// Phase 1.2 cross-OS spawn wrapper per ADR 0004 contract 6 + Pattern D + H.
//
// IMPL NOTE (Rule 1 / R03 § 3.7): Windows uses `cmd.exe /c <cmd> <args...>`
// because npm/npx/claude shipped as .cmd shims under Win, and POSIX-style
// `/bin/sh -c` is unavailable on raw Win (only inside Git-Bash/WSL). Unix
// uses `/bin/sh -c "<cmd> <joined-args>"` so single-string cmds with pipes /
// redirections still work consistently with what users typed in the manifest.
//
// IMPL NOTE (Rule 1 / B1 hotfix defense-in-depth, PATTERNS Pattern D pre-pass):
// re-run `checkCmdString()` on the cmd right before spawn(). The phase 1.1.1
// security gate in `validate.ts` already screens manifests, but a future
// caller (phase 1.4 routing-engine / test harnesses / direct installer use
// without validate.ts) might hand us an unvalidated cmd. Refuse to spawn
// shell-escape patterns even at this layer — InstallResult `phase: 'preflight'`
// + keyword `'security'` returned, never thrown.
//
// Pattern C: returns Result-shaped object {ok:true|false} — no throws on
// expected paths (timeout, non-zero exit, security gate). Unexpected errors
// (e.g. cmd binary not found / EACCES) bubble out as throws — the caller
// (installer dispatch) catches and wraps.
//
// v3.0.2 hotfix (Windows cold-install timeout): npm-cli installers running
// `npx --yes <pkg>@<ver> install` need >15s on Windows cold cache (user
// reported gsd install timing out at 10s/15s). spawnCmd now accepts an
// explicit `timeoutMs` arg from the caller — installers pass 60_000ms for
// the install step; verify continues to honor spec.verify.timeout_ms (default
// 15s) so manifest authors retain control. The pre-v3.0.2 bug: install spawn
// was reading verify.timeout_ms (cross-purpose; verify-only field) which
// shortened install timeout to whatever manifest authors set for verify.

import { type ChildProcess, spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { checkCmdString } from '../../manifest/security.js'
import type { InstallContext, InstallResult } from './types.js'

/** v3.9.8 — pre-expand `~/` to OS home dir before passing cmd to cmd.exe.
 *  Windows cmd.exe does NOT expand `~` as POSIX shells do, causing
 *  `mkdir ~/.claude/skills/.cache/X` to fail with "could not create leading
 *  directories" (frontend-design dogfood failure). POSIX /bin/sh expands
 *  `~` natively — this helper is win32-only.
 *  Uses forward slashes in the replaced home path (Windows tools accept both). */
function expandTildeForWindows(cmd: string): string {
  const home = homedir().replace(/\\/g, '/')
  // Match `~/` only at start of string OR after whitespace / shell-quote /
  // glob-safe boundary chars — avoid replacing `something~/x`.
  return cmd.replace(/(^|[\s"'`(])~\//g, `$1${home}/`)
}

export const DEFAULT_VERIFY_TIMEOUT_MS = 15_000
/** v3.0.2: explicit install-step timeout — Windows cold npm/npx cache can
 *  exceed 30-45s on first install.
 *  Patch 4.10.1: raised 120s → 300s. Real dogfood showed `npx skills add`
 *  (playwright-test / mattpocock-skills) + cold `git clone` exceeding 120s on a
 *  warm-but-not-cached machine, surfacing as spurious spawn-timeout failures in
 *  force-update. comet allots npx skills installers 300s; we match that ceiling
 *  so legitimate cold pulls finish instead of being killed mid-fetch. */
export const DEFAULT_INSTALL_TIMEOUT_MS = 300_000

export interface SpawnOk {
  ok: true
  exitCode: number
  stdout: string
  stderr: string
}

/**
 * Spawn `cmd args...` under the platform's default shell with B1 defense-
 * in-depth, env injection, cwd from manifest, and timeout.
 *
 * v3.0.2: `timeoutMs` is now an explicit caller-supplied arg. Pre-v3.0.2
 * read `spec.verify.timeout_ms` for BOTH install and verify spawns — a bug
 * because verify.timeout_ms is verify-only (e.g. gsd manifest sets 10000ms
 * for fast `--version` verify, but install needs >30s on Windows cold cache).
 * Callers now pass the timeout explicitly: installers use
 * DEFAULT_INSTALL_TIMEOUT_MS (60s), verify callers pass
 * `verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS` (15s).
 *
 * Returns:
 *   - `SpawnOk` on completion (any exit code; caller decides if non-zero
 *     means failure based on context — install vs verify vs idempotent_check)
 *   - `InstallResult` failure shape on security gate / timeout
 */
export async function spawnCmd(
  ctx: InstallContext,
  cmd: string,
  args: string[],
  timeoutMs?: number,
  opts?: { posixShell?: boolean },
): Promise<SpawnOk | InstallResult> {
  // 1. B1 defense-in-depth — re-check the literal cmd string for shell escapes.
  const violation = checkCmdString(cmd)
  if (violation) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        file: ctx.manifest.metadata.name,
        path: '/spec/install/cmd',
        message: `shell escape detected at spawn boundary: '${violation.label}' (${violation.hint}) — refusing to execute. v0.1 forbids dynamic shell evaluation; this is a defense-in-depth gate after schema validation.`,
        line: null,
        column: null,
        keyword: 'security-gate-bypass',
      },
    }
  }

  // 2. Platform branch — Win cmd.exe vs POSIX /bin/sh.
  const installCfg = ctx.manifest.spec.install
  // v3.0.2: timeoutMs MUST be explicit (back-compat: undefined → 60s install default).
  const effectiveTimeoutMs = timeoutMs ?? DEFAULT_INSTALL_TIMEOUT_MS
  const env = { ...process.env, ...(installCfg.env ?? {}) }
  const cwd = installCfg.cwd ?? ctx.cwd

  let child: ChildProcess
  // v23 (4.5.1) — POSIX-shell cmds (git-clone-with-setup install + all verify cmds
  // use rm/cp/test/grep/| which cmd.exe can't run) route through Git Bash on Windows.
  // bash expands `~` natively (no pre-expand). npm/npx/claude/mcp install cmds keep
  // cmd.exe (they are .cmd shims). `triedBash` lets the error handler emit a clear
  // "Git Bash required" message on ENOENT.
  let triedBash = false
  // v4.13.0 — stdin CLOSED ('ignore'): install/verify cmds must be non-interactive.
  // With the default 'pipe' stdin (open, never fed), an upstream CLI that decides
  // to prompt (e.g. `npx skills add` confirmation) blocks forever and surfaces as
  // a 300s spawn-timeout (user dogfood: mattpocock-skills / design-taste-frontend).
  // Closed stdin makes prompt-happy CLIs fail fast or take their non-TTY default.
  const stdio: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe']
  if (process.platform === 'win32') {
    if (opts?.posixShell) {
      const joined = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd
      triedBash = true
      child = spawn('bash', ['-c', joined], { cwd, env, windowsHide: true, stdio })
    } else {
      // v3.9.8 — expand `~/` because cmd.exe doesn't (POSIX-only convention).
      const expandedCmd = expandTildeForWindows(cmd)
      const expandedArgs = args.map(expandTildeForWindows)
      child = spawn('cmd.exe', ['/c', expandedCmd, ...expandedArgs], {
        cwd,
        env,
        windowsHide: true,
        stdio,
      })
    }
  } else {
    const joined = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd
    child = spawn('/bin/sh', ['-c', joined], { cwd, env, stdio })
  }

  // 3. Collect stdout/stderr + race against timeout.
  let stdout = ''
  let stderr = ''
  child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
    stdout += chunk
  })
  child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk
  })

  return await new Promise<SpawnOk | InstallResult>((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({
        ok: false,
        phase: 'spawn',
        error: {
          file: ctx.manifest.metadata.name,
          path: '/spec/install/cmd',
          message: `spawn timed out after ${effectiveTimeoutMs}ms (cmd: ${cmd}); partial stderr: ${stderr.slice(0, 200)}`,
          line: null,
          column: null,
          keyword: 'spawn-timeout',
        },
      })
    }, effectiveTimeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      const bashMissing = triedBash && (err as NodeJS.ErrnoException).code === 'ENOENT'
      resolve({
        ok: false,
        phase: 'spawn',
        error: {
          file: ctx.manifest.metadata.name,
          path: '/spec/install/cmd',
          message: bashMissing
            ? 'Git Bash is required for this component on Windows, but `bash` was not found on PATH. Install Git for Windows (https://git-scm.com/download/win) and re-run `harnessed setup`.'
            : `spawn failed: ${err.message}`,
          line: null,
          column: null,
          keyword: bashMissing ? 'bash-missing' : 'spawn-error',
        },
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ ok: true, exitCode: code ?? -1, stdout, stderr })
    })
  })
}
