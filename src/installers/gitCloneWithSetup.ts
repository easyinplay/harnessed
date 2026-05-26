// Phase 2.1 install method 4/6 — cc-skill-pack × git-clone-with-setup per ADR
// 0004 § 5 + ADR 0007 install_type=git + ADR 0010 errata D-15.
//
// IMPL NOTE (Rule 1 / D-15): git_ref HEAD/main/master rejection is ALREADY
// enforced by preflight.ts (git_ref shape regex). We do NOT re-implement that
// here. Between spawn and verify we ADD a `git rev-parse HEAD` SHA-match
// step (inline ≤10 lines per D-15 — only one caller; lib/gitVerify.ts would be
// YAGNI). Mismatch → InstallError keyword:'sha-mismatch'.
//
// IMPL NOTE (Rule 1 / D-1 reuse): every multi-line block delegates to a lib/*
// helper. This installer is a thin orchestrator; spawnCmd handles cross-OS
// shell + B1 defense-in-depth in one place. Mirrors npmCli architecture.
//
// IMPL NOTE (Rule 1 / pure-create backup): git-clone creates new dirs (does
// not edit existing files). DiffPlan.files entries use `oldText:''` per the
// types.ts contract — backup writes a "pure-create sentinel" so rollback can
// `rm -rf` the cloned dir.
//
// IMPL NOTE (Rule 1 / strict SHA pin per ADR 0001 版本锁哲学): the schema
// regex permits SHA(7-40 hex) OR SemVer (v1.2.3); this installer enforces the
// stricter SHA-only invariant for git_ref because `git rev-parse HEAD` after
// `git clone --branch <tag>` produces a SHA, and SHA↔tag is not an authority
// match — the SHA IS the authority. Real manifests already follow this:
// ui-ux-pro-max.yaml + gstack.yaml both pin full 40-hex SHA. SemVer values
// reaching this code path are surfaced as an installer-layer error (NOT a
// silent skip), aligned with ADR 0001's reproducibility requirement.

import { spawn } from 'node:child_process'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { isAlreadyInstalled } from './lib/idempotent.js'
import { preflight } from './lib/preflight.js'
import { DEFAULT_INSTALL_TIMEOUT_MS, DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './lib/spawn.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer, InstallResult } from './lib/types.js'

// D-15 inline SHA-verify. Runs `git rev-parse HEAD` in the cloned dir,
// compares against the manifest's git_ref. Only invoked after a successful
// clone; called once per install — no lib helper warranted (YAGNI).
function gitRevParseHead(cwd: string, timeoutMs = 10_000): Promise<{ sha: string; exit: number }> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32'
    const child = isWin
      ? spawn('cmd.exe', ['/c', 'git', 'rev-parse', 'HEAD'], { cwd, windowsHide: true })
      : spawn('git', ['rev-parse', 'HEAD'], { cwd, shell: false })
    let stdout = ''
    child.stdout?.setEncoding('utf8').on('data', (c: string) => {
      stdout += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ sha: '', exit: -1 })
    }, timeoutMs)
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ sha: '', exit: -1 })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ sha: stdout.trim(), exit: code ?? -1 })
    })
  })
}

// Extract the target clone directory from the manifest cmd. Required: we
// must know the directory to run `git rev-parse HEAD` against post-clone. If
// the cmd shape can't be parsed, we fail preflight clearly (no silent
// fallback). Walks `git clone [flags] <url> <dest>` to find <dest>.
function extractCloneTarget(cmd: string): string | null {
  const idx = cmd.indexOf('git clone')
  if (idx < 0) return null
  const tail = cmd.slice(idx + 'git clone'.length).trim()
  const tokens = tail.split(/\s+/)
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === undefined || !t.startsWith('-')) break
    if (t === '--depth' || t === '--branch' || t === '-b') {
      i += 2
    } else if (t.includes('=')) {
      i += 1
    } else {
      i += 2
    }
  }
  // tokens[i] is the URL; tokens[i+1] is the dest. End-of-clause guards
  // (&&, ;, |) means the manifest omitted dest — git would default to a
  // repo-name dir in cwd, which is fragile; require explicit dest.
  const dest = tokens[i + 1]
  if (!dest || dest === '&&' || dest === ';' || dest === '|') return null
  if (dest.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE
    if (!home) return null
    return `${home}${dest.slice(1)}`
  }
  return dest
}

export const installGitCloneWithSetup: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'git-clone-with-setup') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installGitCloneWithSetup received non-git-clone-with-setup method '${install.method}' (dispatch bug)`,
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

  // Strict SHA-pin (ADR 0001 + D-15). Schema regex permits SemVer too, but
  // this installer enforces the tighter invariant: rev-parse HEAD returns a
  // SHA, so the authority must be a SHA. SemVer git_ref → preflight-layer error.
  if (!/^[a-f0-9]{7,40}$/.test(install.git_ref)) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/git_ref',
          `git-clone-with-setup requires a full SHA git_ref (7-40 hex), got '${install.git_ref}' (ADR 0001 reproducibility — SHA is the only stable authority for git_rev-parse HEAD verification)`,
          'sha-required',
        ),
        suggest: `pin git_ref to a 40-hex commit SHA from the upstream repo (e.g. \`git rev-parse <tag-or-branch>\` in the source)`,
      },
    }
  }

  // Parse clone target from cmd. Required for D-15 SHA-verify cwd; fail clear
  // if the manifest cmd shape is unsupported (`git clone <url> <dest>`).
  const cloneTarget = extractCloneTarget(install.cmd)
  if (!cloneTarget) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `git-clone-with-setup cmd does not contain a parseable \`git clone <url> <dest>\` invocation; D-15 SHA-verify requires an explicit destination directory`,
          'git-clone-shape',
        ),
        suggest: 'use `git clone [flags] <url> <dest>` with an explicit destination directory',
      },
    }
  }

  // L2 — per-user (~/.claude/skills/<name>/). pure-create DiffPlan:
  // oldText:'' so backup writes a sentinel; rollback = `rm -rf` cloned dir.
  const name = ctx.manifest.metadata.name
  const plan: DiffPlan = {
    files: [
      {
        target: cloneTarget,
        scope: 'HOME',
        oldText: '',
        newText: `// new directory created by: ${install.cmd}\n// pinned at git_ref ${install.git_ref}\n`,
      },
    ],
  }
  if (!ctx.opts.quiet) process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L2', { ...ctx, level: 'L2' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  // Run the manifest cmd as-is (rm + git clone + cp + cleanup pipeline).
  // spawnCmd handles cross-OS shell + B1 re-screen. cmd is single string.
  // v3.0.2: explicit install timeout (60s — git clone over network can exceed 15s).
  const sp = await spawnCmd(ctx, install.cmd, [], DEFAULT_INSTALL_TIMEOUT_MS)
  if (!('exitCode' in sp)) return { ...sp, backupId: bk.backupId } as InstallResult
  if (sp.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `git-clone-with-setup cmd exited ${sp.exitCode}: ${sp.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // D-15 — SHA-verify. `git rev-parse HEAD` in clone target dir; match the
  // manifest git_ref by prefix (git's standard SHA-prefix semantics — a
  // 7-hex prefix is a valid name for the full 40-hex commit).
  const rp = await gitRevParseHead(cloneTarget)
  if (rp.exit !== 0 || !rp.sha) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/git_ref',
        `git rev-parse HEAD failed in ${cloneTarget} (exit ${rp.exit}); cannot verify SHA pin '${install.git_ref}'`,
        'sha-mismatch',
      ),
    }
  }
  if (!rp.sha.startsWith(install.git_ref)) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/git_ref',
        `git_ref SHA mismatch: manifest pinned '${install.git_ref}' but HEAD is '${rp.sha}' in ${cloneTarget}`,
        'sha-mismatch',
      ),
    }
  }

  // verify cmd (e.g. `test -f ~/.claude/skills/<name>/SKILL.md`).
  // v3.0.2: verify honors spec.verify.timeout_ms (default 15s).
  const verifyTimeoutMs = ctx.manifest.spec.verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS
  const vr = await spawnCmd(ctx, ctx.manifest.spec.verify.cmd, [], verifyTimeoutMs)
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
        `verify exit ${vr.exitCode} ≠ expected ${expected}: ${vr.stderr.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, install.git_ref, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [cloneTarget] }
}
