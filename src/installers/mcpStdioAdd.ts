// Phase 1.2 install method 2/2 — mcp-npm × mcp-stdio-add per ADR 0004 § 5.
//
// IMPL NOTE (Rule 1 / CC #54803): mandatory --scope project; user scope is
// broken in v2.1.122 (rules silently land in ~/.claude.json but Claude Code
// fails to read them back). hardcoded `--scope project` here cannot be
// overridden by manifest fields — the manifest cmd string is treated as
// audit-trail only; we authoritatively reconstruct the args array.
//
// IMPL NOTE (Rule 1 / H2 sister review fix — defense in depth): we bypass
// lib/spawn.ts (which checks the literal cmd string once via checkCmdString)
// because our args[] is constructed locally; instead, we re-run
// checkCmdString on EVERY args[i] right before spawn. This catches any
// future caller (phase 1.4 routing, test harness) that hands us a manifest
// where metadata.upstream.source / metadata.name / install.npm_version
// contains shell escapes — the schema-level B1 gate did not screen these
// non-cmd fields, so the runtime gate must.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C2): verify uses `claude mcp list` exit
// code via `grep -q <name>` — we do NOT parse stdout. The CLI's textual
// output format is not a stable contract; exit code is.

import { spawn } from 'node:child_process'
import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { preflight } from './lib/preflight.js'
import type { ProcResult } from './lib/runClaudeArgs.js'
import { runArgs } from './lib/runClaudeArgs.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'

export const installMcpStdioAdd: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'mcp-stdio-add') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installMcpStdioAdd received non-mcp-stdio-add method '${install.method}' (dispatch bug)`,
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

  const name = ctx.manifest.metadata.name
  const pkg = ctx.manifest.metadata.upstream.source
  const ver = install.npm_version
  // Authoritative args — `--scope project` hardcoded per ADR 0004 § 5 + CC #54803.
  // The manifest's install.cmd string is informational only; we never invoke it.
  const addArgs = [
    'mcp',
    'add',
    '--scope',
    'project',
    '--transport',
    'stdio',
    name,
    '--',
    'npx',
    '--yes',
    `${pkg}@${ver}`,
  ]

  // H2 defense-in-depth — re-screen each constructed arg. metadata.name and
  // metadata.upstream.source pass through B1 only as YAML scalars; never as
  // shell tokens. Re-check in case a future schema change relaxes those fields.
  for (const a of addArgs) {
    const violation = checkCmdString(a)
    if (violation) {
      return {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/spec/install/cmd',
          `shell escape detected in constructed mcp-add arg '${a.slice(0, 60)}': ${violation.label} (${violation.hint})`,
          'security-gate-bypass',
        ),
      }
    }
  }

  // L3 fixed — diff shows .mcp.json will gain an entry. We simulate the entry
  // textually rather than calling `claude mcp add --dry-run` (CLI flag not
  // documented in v2.1; relying on it would be an unstable contract).
  const mcpFile = `${ctx.cwd}/.mcp.json`
  const newEntry = JSON.stringify(
    { [name]: { type: 'stdio', command: 'npx', args: ['--yes', `${pkg}@${ver}`] } },
    null,
    2,
  )
  const plan: DiffPlan = {
    files: [
      {
        target: mcpFile,
        scope: 'PROJECT',
        oldText: '',
        newText: `// will be merged into .mcp.json mcpServers map by \`claude mcp add\`:\n${newEntry}\n`,
      },
    ],
  }
  process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  const r = await runArgs(addArgs, install.cwd ?? ctx.cwd)
  if (r.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `claude mcp add exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // Verify via `claude mcp list` exit code piped through `grep -q <name>`.
  // We invoke a small shell snippet (Win cmd.exe /c, Unix /bin/sh -c) just for
  // the pipe; arg list is whitelisted.
  const verifyShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
  const verifyFlag = process.platform === 'win32' ? '/c' : '-c'
  const verifyLine = `claude mcp list | grep -q ${name}`
  const violation = checkCmdString(verifyLine)
  if (violation) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify shell escape: ${violation.label}`,
        'security-gate-bypass',
      ),
    }
  }
  // Verify shell can't use runArgs (it always prefixes 'claude'); spawn the
  // pipe-runner shell directly. Args have been B1-checked above.
  const vr = await new Promise<ProcResult>((resolve) => {
    const child = spawn(verifyShell, [verifyFlag, verifyLine], { cwd: ctx.cwd, windowsHide: true })
    let stderr = ''
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout]` })
    }, 15_000)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: e.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr })
    })
  })
  if (vr.exitCode !== 0) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify exit ${vr.exitCode}: ${vr.stderr.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, ver, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [mcpFile] }
}
