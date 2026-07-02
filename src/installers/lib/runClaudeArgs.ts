// Phase 5.1 W0 T0.3 — extract runArgs helper (#BF MED carry-forward 4-phase discharge).
// Identical implementation existed in mcpStdioAdd.ts L40 + mcpHttpAdd.ts L47 +
// ccPluginMarketplace.ts L49; extracted here to eliminate 3-way duplication.
//
// v4.14.0 — generalized to runHarnessArgs(bin, ...): the same spawn shape now
// serves BOTH harness CLIs (`claude` and `codex` — codex mcp/plugin subcommands
// are shape-compatible per findings.md research). `runArgs` stays as the claude
// shorthand so all pre-4.14.0 call sites are byte-identical. `stdout` added to
// ProcResult (codex `plugin list` verify matches on stdout); stderr-only callers
// unaffected.
//
// IMPL NOTE: Win routes through cmd.exe /c because `claude`/`codex` ship as
// .cmd shims / PATH-resolved exes. Unix spawns the binary directly (no shell) —
// args remain unparsed. This matches the established cross-OS pattern.

import { spawn } from 'node:child_process'

export type HarnessBin = 'claude' | 'codex'

export interface ProcResult {
  exitCode: number
  stdout: string
  stderr: string
}

export function runHarnessArgs(
  bin: HarnessBin,
  args: string[],
  cwd: string,
  timeoutMs = 15_000,
): Promise<ProcResult> {
  return new Promise((resolve) => {
    // Win: route through cmd.exe /c because the harness CLI ships as a .cmd shim.
    // Unix: spawn the binary directly (no shell) — args remain unparsed.
    const isWin = process.platform === 'win32'
    // v4.13.0 — stdin 'ignore' (sister lib/spawn.ts): harness subcommands must
    // never wait on interactive input during setup.
    const stdio: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe']
    const child = isWin
      ? spawn('cmd.exe', ['/c', bin, ...args], { cwd, windowsHide: true, stdio })
      : spawn(bin, args, { cwd, shell: false, stdio })
    let stdout = ''
    let stderr = ''
    child.stdout?.setEncoding('utf8').on('data', (c: string) => {
      stdout += c
    })
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stdout, stderr: `${stderr}[timeout after ${timeoutMs}ms]` })
    }, timeoutMs)
    child.on('error', (e) => {
      clearTimeout(timer)
      // v4.14.0 fail-loud: codex is optional tooling — a missing binary must
      // surface as an actionable message, not a bare ENOENT (findings.md 锁定
      // 决策: spawn PATH 上的 codex,不猜 AppData hash 目录).
      const enoent = (e as NodeJS.ErrnoException).code === 'ENOENT'
      const msg =
        enoent && bin === 'codex'
          ? 'codex CLI not found on PATH — install Codex CLI or re-run setup on the claude platform'
          : e.message
      resolve({ exitCode: -1, stdout, stderr: `${stderr}${msg}` })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stdout, stderr })
    })
  })
}

/** Claude shorthand — all pre-4.14.0 call sites keep this exact signature. */
export function runArgs(
  claudeArgs: string[],
  cwd: string,
  timeoutMs = 15_000,
): Promise<ProcResult> {
  return runHarnessArgs('claude', claudeArgs, cwd, timeoutMs)
}
