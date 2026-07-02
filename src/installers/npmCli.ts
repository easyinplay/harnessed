// Phase 1.2 install method 1/2 — cli-npm × npm-cli per ADR 0004 + ASSUMPTIONS B3.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS B3 候选 1 + H3 sister review fix): when a
// manifest declares `npm install -g <pkg>` (Level L4) but the user has NOT
// passed `--system`, do NOT silently flip to npx — that is "decision masking"
// and erodes trust. Present an explicit 3-way `p.select()`: (a) abort and
// re-run with --system / (b) downgrade to L1 npx ephemeral / (c) abort.
// Default is (c) — safest action wins on Enter / Ctrl-C / Esc.
//
// IMPL NOTE (Rule 1 / D-1 reuse): every multi-line block delegates to a lib/*
// helper. This installer is a thin orchestrator; if you find yourself adding
// fs/spawn/diff logic *here*, lift it to lib/.

import * as p from '@clack/prompts'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { isAlreadyInstalled } from './lib/idempotent.js'
import { preflight } from './lib/preflight.js'
import { DEFAULT_INSTALL_TIMEOUT_MS, DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './lib/spawn.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer, InstallResult, Level } from './lib/types.js'
import { formatVerifyFail } from './lib/verifyMessage.js'

function detectLevel(cmd: string): Level {
  if (/\bnpm\s+install\s+-g\b/.test(cmd)) return 'L4'
  if (/\bnpx\b/.test(cmd)) return 'L1'
  return 'L4' // safest default: assume worst-case scope
}

export const installNpmCli: Installer = async (ctx) => {
  // Discriminator narrow — index.ts only routes here when method === 'npm-cli'.
  const install = ctx.manifest.spec.install
  if (install.method !== 'npm-cli') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installNpmCli received non-npm-cli method '${install.method}' (dispatch bug)`,
        'dispatch-mismatch',
      ),
    }
  }
  const pre = preflight(ctx)
  if (!pre.ok) {
    if (pre.abortReason === 'platform-mismatch')
      return { aborted: true, reason: 'platform-mismatch' }
    const e = pre.errors[0] ?? err(ctx, '/', 'preflight failed (no detail)', 'preflight')
    return { ok: false, phase: 'preflight', error: e }
  }
  // v3.9.6 — idempotent_check probe (skip install if already-installed).
  if (await isAlreadyInstalled(ctx)) {
    return { ok: true, alreadyInstalled: true, backupId: 'noop-idempotent' }
  }
  let level = detectLevel(install.cmd)
  let cmd = install.cmd
  const plan: DiffPlan = { files: [] }
  // L1 npx & L4 global both produce "(no file changes)" diff — L4 PATH mod is
  // not previewable as a unified diff; the cmd echo is the audit trail.
  if (!ctx.opts.quiet) {
    process.stdout.write(renderDiff(plan, ctx))
    // v4.15.1 — gated by quiet: in setup's quiet Step B this line printed with
    // no cmd echo above it, landing mid-progress-stream (user dogfood confusion).
    if (level === 'L4')
      process.stdout.write('  (L4 system install — global PATH change; see cmd above)\n')
  }
  const conf = await confirmAt(level, { ...ctx, level })
  if (!conf.proceed) {
    if (level === 'L4' && conf.reason === 'flag-missing' && !ctx.opts.nonInteractive) {
      // H3 three-way prompt (interactive only — non-interactive already short-circuited)
      const choice = await p.select({
        message: 'L4 install requires --system. Choose:',
        options: [
          { value: 'retry', label: 'Retry with --system flag (re-run command)' },
          { value: 'npx', label: 'Downgrade to L1 npx ephemeral install (no global)' },
          { value: 'abort', label: 'Abort install' },
        ],
        initialValue: 'abort',
      })
      if (p.isCancel(choice) || choice === 'abort') return { aborted: true, reason: 'user-cancel' }
      if (choice === 'retry') return { aborted: true, reason: 'level-flag-missing' }
      // 'npx' branch: rebuild cmd + re-confirm at L1
      cmd = `npx --yes ${ctx.manifest.metadata.upstream.source}@${install.npm_version}`
      level = 'L1'
      const conf2 = await confirmAt('L1', { ...ctx, level: 'L1' })
      if (!conf2.proceed) return { aborted: true, reason: 'user-cancel' }
    } else {
      // confirm.reason 'flag-missing' (L4 non-interactive) maps to InstallResult
      // 'level-flag-missing'; 'user-cancel' / undefined → 'user-cancel'.
      const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
      return { aborted: true, reason }
    }
  }
  // dry-run short-circuit (preview-only, never writes — ADR 0004 contract 1)
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }
  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }
  // v3.0.2: explicit install timeout (60s default — Windows cold npm/npx cache friendly).
  const sp = await spawnCmd(ctx, cmd, [], DEFAULT_INSTALL_TIMEOUT_MS)
  if (!('exitCode' in sp)) return { ...sp, backupId: bk.backupId } as InstallResult
  if (sp.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `install cmd exited ${sp.exitCode}: ${sp.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }
  // v3.0.2: verify honors spec.verify.timeout_ms (default 15s) — manifest authors retain control.
  const verifyTimeoutMs = ctx.manifest.spec.verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS
  // v23 (4.5.1) — verify cmds use POSIX builtins (test/grep/|); route through Git Bash on Windows.
  const vr = await spawnCmd(ctx, ctx.manifest.spec.verify.cmd, [], verifyTimeoutMs, {
    posixShell: true,
  })
  if (!('exitCode' in vr)) return { ...vr, backupId: bk.backupId } as InstallResult
  const expected = ctx.manifest.spec.verify.expected_exit_code ?? 0
  if (vr.exitCode !== expected) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        // v4.15.1 — unified verify-fail format (cmd + output tail; no dangling colon).
        formatVerifyFail(ctx.manifest.spec.verify.cmd, vr.exitCode, expected, vr.stdout, vr.stderr),
        'verify-failed',
      ),
    }
  }
  // manifest sha1 capture is a Wave 5 CLI concern (it owns the raw yaml bytes);
  // T3.1 records empty-string placeholder per state.ts schema.
  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, install.npm_version, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [] }
}
