// v3.7.0 Phase 1 — built-in doctor checks hoisted from src/cli/doctor.ts.
// Sister `check-planning-with-files.ts` / `check-agent-teams-doctor.ts` helper
// pattern keeps each check ≤80L and lets doctor.ts itself stay a thin dispatcher
// (≤100L) — true to B-03 ≤225L hard limit without 12.5% tolerance exception.
//
// 4 built-in checks moved here verbatim:
//   - checkNodeVersion  (sync, Node ≥22 hard requirement)
//   - checkMcpScope     (async, ADR 0004 § 5 project-scope MCP enforcement)
//   - checkJq           (sync, jq CLI presence + platform install hint)
//   - checkWinBash      (sync, WSL bash detection + ralph-loop fork bug guard)

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

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
  // ADR 0004 § 5: MCP servers must be installed at project scope (.mcp.json),
  // never at user scope (~/.claude.json mcpServers block) — CC #54803.
  const projectMcp = join(process.cwd(), '.mcp.json')
  const userClaude = join(homedir(), '.claude.json')

  let projectExists = false
  try {
    await readFile(projectMcp, 'utf8')
    projectExists = true
  } catch {
    // .mcp.json absence is fine if no MCP servers are installed yet — only an issue
    // if the user has them at user scope instead.
  }

  let userHasMcp = false
  try {
    const raw = await readFile(userClaude, 'utf8')
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> }
    userHasMcp = !!parsed.mcpServers && Object.keys(parsed.mcpServers).length > 0
  } catch {
    // ENOENT or malformed JSON — treat as no user-scope MCP servers, OK.
  }

  if (userHasMcp) {
    return {
      name: 'mcp scope = project',
      status: 'fail',
      message: `~/.claude.json has user-scope mcpServers (CC #54803 risk)`,
      fix: 'remove user-scope entries; re-add via `claude mcp add --scope project ...`',
    }
  }
  return {
    name: 'mcp scope = project',
    status: 'pass',
    message: projectExists ? 'project .mcp.json present' : 'no MCP servers installed',
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
  return { name: 'jq present', status: 'fail', message: 'jq not found in PATH', fix }
}

export function checkWinBash(): CheckResult {
  // Only meaningful on Windows; on Unix we report skipped-OK.
  if (process.platform !== 'win32') {
    return { name: 'bash flavor (win)', status: 'pass', message: 'skipped (non-Windows)' }
  }
  // Step 1: locate the `bash` that PATH would resolve.
  const where = spawnSync('where', ['bash'], { encoding: 'utf8' })
  const firstBash = (where.stdout ?? '').split(/\r?\n/)[0]?.trim() ?? '(not found)'
  if (where.status !== 0 || !firstBash || firstBash === '(not found)') {
    return {
      name: 'bash flavor (win)',
      status: 'fail',
      message: 'no bash on PATH',
      fix: 'install Git for Windows (Git Bash) and ensure it is on PATH',
    }
  }
  // Step 2: WSL probe — non-empty WSL_DISTRO_NAME = WSL bash, ralph-loop fork bug risk.
  const probe = spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'], { encoding: 'utf8' })
  const distro = (probe.stdout ?? '').trim()
  if (distro.length > 0) {
    return {
      name: 'bash flavor (win)',
      status: 'fail',
      message: `WSL bash (${distro}) — ralph-loop subagent fork breaks under WSL`,
      fix: 'reorder PATH so Git Bash precedes WSL bash.exe (Settings → System → Environment Variables)',
    }
  }
  return { name: 'bash flavor (win)', status: 'pass', message: `${firstBash} (Git Bash / native)` }
}
