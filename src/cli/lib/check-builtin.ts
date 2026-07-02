// v3.7.0 Phase 1 — built-in doctor checks hoisted from src/cli/doctor.ts.
// Sister `check-planning-with-files.ts` / `check-agent-teams-doctor.ts` helper
// pattern keeps each check ≤80L and lets doctor.ts itself stay a thin dispatcher
// (≤100L) — true to B-03 ≤225L hard limit without 12.5% tolerance exception.
//
// 4 built-in checks moved here verbatim:
//   - checkNodeVersion  (sync, Node ≥22 hard requirement)
//   - checkMcpScope     (async; v4.15.1 informational — user-scope is the
//                        harnessed install default since v3.0.2, never a fail)
//   - checkJq           (sync, jq CLI presence + platform install hint)
//   - checkWinBash      (sync; v4.15.1 resolveBash SoT — WSL stub detection
//                        aligned with what spawnCmd actually executes)

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { detectPlatform } from '../../installers/lib/platform.js'
import { resolveBash } from '../../installers/lib/resolveBash.js'
import { sanitizeOutputTail } from '../../installers/lib/verifyMessage.js'

export interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  /** v3.9.1 — structured install command sequence consumed by auto-install
   *  dispatcher. Each entry is a single shell command tokenized for spawnSync
   *  (first token = exe, rest = argv). Multiple entries run sequentially;
   *  any non-zero exit aborts the chain. Distinct from `fix` (free-text
   *  human-readable hint) — `install_commands` is machine-executable. */
  install_commands?: readonly string[]
}

export function checkNodeVersion(): CheckResult {
  const v = process.versions.node
  const major = Number.parseInt(v.split('.')[0] ?? '0', 10)
  return major >= 22
    ? { name: 'node ≥ 22', status: 'pass', message: `node ${v}` }
    : {
        name: 'node ≥ 22',
        status: 'fail',
        message: `node ${v} (need ≥ 22)`,
        fix: 'nvm install 22 && nvm use 22',
      }
}

export async function checkMcpScope(): Promise<CheckResult> {
  // v4.14.0 — this check reads CC-specific files (~/.claude.json); on any other
  // platform it is meaningless → pass-skip.
  if (detectPlatform().id !== 'claude') {
    return {
      name: 'mcp scope',
      status: 'pass',
      message: 'skipped (claude-only check)',
    }
  }
  // v4.15.1 — semantics ALIGNED with the installer: since v3.0.2 harnessed
  // deliberately installs MCP servers with `claude mcp add --scope user`
  // (~/.claude.json; CWD-independent, cross-project — see mcpStdioAdd.ts header;
  // the pre-v3.0.2 CC #54803 user-scope read-back bug is fixed upstream). The
  // old check FAILED on exactly the state our own setup produces — every user
  // who completed setup saw a red doctor (v4.15.0 dogfood). Now informational:
  // report where servers live, never fail.
  const projectMcp = join(process.cwd(), '.mcp.json')
  const userClaude = join(homedir(), '.claude.json')

  let projectExists = false
  try {
    await readFile(projectMcp, 'utf8')
    projectExists = true
  } catch {
    // .mcp.json absence is fine — user-scope is the harnessed default.
  }

  let userCount = 0
  try {
    const raw = await readFile(userClaude, 'utf8')
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> }
    userCount = parsed.mcpServers ? Object.keys(parsed.mcpServers).length : 0
  } catch {
    // ENOENT or malformed JSON — treat as no user-scope MCP servers.
  }

  const parts: string[] = []
  if (userCount > 0)
    parts.push(
      `${userCount} user-scope server(s) (~/.claude.json — harnessed default since v3.0.2)`,
    )
  if (projectExists) parts.push('project .mcp.json present')
  return {
    name: 'mcp scope',
    status: 'pass',
    message: parts.length > 0 ? parts.join('; ') : 'no MCP servers installed',
  }
}

export function checkJq(): CheckResult {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, ['jq'], { encoding: 'utf8' })
  if (r.status === 0 && r.stdout.trim().length > 0) {
    return {
      name: 'jq present',
      status: 'pass',
      message: r.stdout.split(/\r?\n/)[0]?.trim() ?? 'jq found',
    }
  }
  const fix =
    process.platform === 'win32'
      ? 'winget install jqlang.jq  (or: scoop install jq)'
      : process.platform === 'darwin'
        ? 'brew install jq'
        : 'apt-get install jq  (or: dnf install jq)'
  // v4.15.2 T5 — fail → warn. 实际消费方核查:jq 只被 (1) `harnessed audit-log
  // --filter`(可选功能,自带 ENOENT 降级提示)与 (2) ralph-loop plugin 的 Windows
  // 运行时(manifest notice)使用 — 不是 setup/核心链路依赖,不该把 doctor 打红。
  // install_commands 让 setup 末尾的 auto-install 可以顺手补装。
  const installCmd =
    process.platform === 'win32'
      ? 'winget install jqlang.jq'
      : process.platform === 'darwin'
        ? 'brew install jq'
        : 'apt-get install -y jq'
  return {
    name: 'jq present',
    status: 'warn',
    message:
      'jq not found in PATH (optional — needed by `harnessed audit-log --filter` and the ralph-loop plugin on Windows)',
    fix,
    install_commands: [installCmd],
  }
}

/** v4.15.2 T4 — delegates to the shared sanitizer (verifyMessage.ts): doctor and
 *  installer error tails go through the SAME cleaning (first non-empty line,
 *  printable-only, capped). Local wrapper keeps the 60-char doctor cap. */
function sanitizeToolOutput(raw: string, cap = 60): string {
  return sanitizeOutputTail(raw, cap)
}

export function checkWinBash(): CheckResult {
  // Only meaningful on Windows; on Unix we report skipped-OK.
  if (process.platform !== 'win32') {
    return { name: 'bash flavor (win)', status: 'pass', message: 'skipped (non-Windows)' }
  }
  // v4.15.1 — single SoT with the installers: resolveBash() is exactly what
  // spawnCmd's posixShell branch will use, so doctor reports the REAL runtime
  // state instead of re-deriving it (pre-4.15.1 this check detected the WSL
  // stub but setup didn't consume the diagnosis — user dogfood).
  const r = resolveBash()
  if (r.path === null) {
    return {
      name: 'bash flavor (win)',
      status: 'fail',
      message: `only the WSL stub is on PATH (${sanitizeToolOutput(r.wslOnPath ?? '')}) — harnessed verify/install cmds cannot run`,
      fix: 'install Git for Windows (https://git-scm.com/download/win), reorder PATH so Git Bash precedes WSL bash.exe, or set HARNESSED_BASH to a Git Bash path',
    }
  }
  if (r.source === 'path-fallback') {
    return {
      name: 'bash flavor (win)',
      status: 'fail',
      message: 'no bash on PATH',
      fix: 'install Git for Windows (Git Bash) and ensure it is on PATH',
    }
  }
  if (r.wslOnPath) {
    return {
      name: 'bash flavor (win)',
      status: 'warn',
      message: `PATH-first bash is the WSL stub (${sanitizeToolOutput(r.wslOnPath)}); harnessed resolved Git Bash at ${r.path} — but OTHER tools (e.g. ralph-loop plugin forks) may still hit WSL`,
      fix: 'reorder PATH so Git Bash precedes WSL bash.exe (Settings → System → Environment Variables)',
    }
  }
  return {
    name: 'bash flavor (win)',
    status: 'pass',
    message: `${r.path} (Git Bash / native, via ${r.source})`,
  }
}
