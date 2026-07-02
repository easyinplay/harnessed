// Phase 5.1 W0 T0.3 — extract runArgs helper (#BF MED carry-forward 4-phase discharge).
// Identical implementation existed in mcpStdioAdd.ts L40 + mcpHttpAdd.ts L47 +
// ccPluginMarketplace.ts L49; extracted here to eliminate 3-way duplication.
//
// IMPL NOTE: Win routes through cmd.exe /c because `claude` ships as a .cmd shim.
// Unix spawns the binary directly (no shell) — args remain unparsed. This matches
// the established cross-OS pattern across all 3 call sites verbatim.

import { spawn } from 'node:child_process'

export interface ProcResult {
  exitCode: number
  stderr: string
}

export function runArgs(
  claudeArgs: string[],
  cwd: string,
  timeoutMs = 15_000,
): Promise<ProcResult> {
  return new Promise((resolve) => {
    // Win: route through cmd.exe /c because `claude` ships as a .cmd shim.
    // Unix: spawn the binary directly (no shell) — args remain unparsed.
    const isWin = process.platform === 'win32'
    // v4.13.0 — stdin 'ignore' (sister lib/spawn.ts): `claude` subcommands must
    // never wait on interactive input during setup.
    const stdio: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe']
    const child = isWin
      ? spawn('cmd.exe', ['/c', 'claude', ...claudeArgs], { cwd, windowsHide: true, stdio })
      : spawn('claude', claudeArgs, { cwd, shell: false, stdio })
    let stderr = ''
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout after ${timeoutMs}ms]` })
    }, timeoutMs)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: `${stderr}${e.message}` })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr })
    })
  })
}
