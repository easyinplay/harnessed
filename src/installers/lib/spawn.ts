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

import { type ChildProcess, spawn } from 'node:child_process'
import { checkCmdString } from '../../manifest/security.js'
import type { InstallContext, InstallResult } from './types.js'

const DEFAULT_TIMEOUT_MS = 15_000

export interface SpawnOk {
  ok: true
  exitCode: number
  stdout: string
  stderr: string
}

/**
 * Spawn `cmd args...` under the platform's default shell with B1 defense-
 * in-depth, env injection, cwd from manifest, and timeout (default 15s,
 * overridable via spec.verify.timeout_ms).
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
  const verifyCfg = ctx.manifest.spec.verify
  const timeoutMs = verifyCfg.timeout_ms ?? DEFAULT_TIMEOUT_MS
  const env = { ...process.env, ...(installCfg.env ?? {}) }
  const cwd = installCfg.cwd ?? ctx.cwd

  let child: ChildProcess
  if (process.platform === 'win32') {
    child = spawn('cmd.exe', ['/c', cmd, ...args], { cwd, env, windowsHide: true })
  } else {
    const joined = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd
    child = spawn('/bin/sh', ['-c', joined], { cwd, env })
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
          message: `spawn timed out after ${timeoutMs}ms (cmd: ${cmd}); partial stderr: ${stderr.slice(0, 200)}`,
          line: null,
          column: null,
          keyword: 'spawn-timeout',
        },
      })
    }, timeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({
        ok: false,
        phase: 'spawn',
        error: {
          file: ctx.manifest.metadata.name,
          path: '/spec/install/cmd',
          message: `spawn failed: ${err.message}`,
          line: null,
          column: null,
          keyword: 'spawn-error',
        },
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ ok: true, exitCode: code ?? -1, stdout, stderr })
    })
  })
}
