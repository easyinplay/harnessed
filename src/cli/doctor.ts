// Phase 1.2 cli subcommand `doctor` per PLAN § 4.1 acceptance B8' + ASSUMPTIONS B4 候选 1 + C4.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C4 mitigation — WSL detection): on Windows
// we resolve which `bash` the shell will spawn (PATH-first), then probe
// `bash -c 'echo $WSL_DISTRO_NAME'`. If the probe outputs a non-empty string
// the resolved bash is the WSL `bash.exe` shim (which forks a Linux process
// — known to break ralph-loop subagent spawning on harness side, see
// phase-1.1 finding). Empty output = Git Bash or native bash, OK.
//
// Phase 1.2 scope: 4 minimal checks per ASSUMPTIONS B4 候选 1 — Node ≥ 22,
// MCP --scope project (.mcp.json present, not in user-scope ~/.claude.json),
// jq available, Win bash flavor. Stale-detection / 6-month freshness probe
// is deferred to phase 2.4 (B4 候选 1 explicitly).

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Command } from 'commander'

interface CheckResult {
  name: string
  ok: boolean
  detail: string
  fix?: string
}

function checkNodeVersion(): CheckResult {
  const v = process.versions.node
  const major = Number.parseInt(v.split('.')[0] ?? '0', 10)
  return major >= 22
    ? { name: 'node ≥ 22', ok: true, detail: `node ${v}` }
    : {
        name: 'node ≥ 22',
        ok: false,
        detail: `node ${v} (need ≥ 22)`,
        fix: 'nvm install 22 && nvm use 22',
      }
}

async function checkMcpScope(): Promise<CheckResult> {
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
      ok: false,
      detail: `~/.claude.json has user-scope mcpServers (CC #54803 risk)`,
      fix: 'remove user-scope entries; re-add via `claude mcp add --scope project ...`',
    }
  }
  return {
    name: 'mcp scope = project',
    ok: true,
    detail: projectExists ? 'project .mcp.json present' : 'no MCP servers installed',
  }
}

function checkJq(): CheckResult {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, ['jq'], { encoding: 'utf8' })
  if (r.status === 0 && r.stdout.trim().length > 0) {
    return {
      name: 'jq present',
      ok: true,
      detail: r.stdout.split(/\r?\n/)[0]?.trim() ?? 'jq found',
    }
  }
  const fix =
    process.platform === 'win32'
      ? 'winget install jqlang.jq  (or: scoop install jq)'
      : process.platform === 'darwin'
        ? 'brew install jq'
        : 'apt-get install jq  (or: dnf install jq)'
  return { name: 'jq present', ok: false, detail: 'jq not found in PATH', fix }
}

function checkWinBash(): CheckResult {
  // Only meaningful on Windows; on Unix we report skipped-OK.
  if (process.platform !== 'win32') {
    return { name: 'bash flavor (win)', ok: true, detail: 'skipped (non-Windows)' }
  }
  // Step 1: locate the `bash` that PATH would resolve.
  const where = spawnSync('where', ['bash'], { encoding: 'utf8' })
  const firstBash = (where.stdout ?? '').split(/\r?\n/)[0]?.trim() ?? '(not found)'
  if (where.status !== 0 || !firstBash || firstBash === '(not found)') {
    return {
      name: 'bash flavor (win)',
      ok: false,
      detail: 'no bash on PATH',
      fix: 'install Git for Windows (Git Bash) and ensure it is on PATH',
    }
  }
  // Step 2: WSL probe — non-empty WSL_DISTRO_NAME = WSL bash, ralph-loop fork bug risk.
  const probe = spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'], { encoding: 'utf8' })
  const distro = (probe.stdout ?? '').trim()
  if (distro.length > 0) {
    return {
      name: 'bash flavor (win)',
      ok: false,
      detail: `WSL bash (${distro}) — ralph-loop subagent fork breaks under WSL`,
      fix: 'reorder PATH so Git Bash precedes WSL bash.exe (Settings → System → About → Advanced system settings → Environment Variables)',
    }
  }
  return { name: 'bash flavor (win)', ok: true, detail: `${firstBash} (Git Bash / native)` }
}

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Minimal preflight checks (Node / MCP scope / jq / Win bash flavor)')
    .action(async () => {
      const results: CheckResult[] = [
        checkNodeVersion(),
        await checkMcpScope(),
        checkJq(),
        checkWinBash(),
      ]
      let allOk = true
      for (const r of results) {
        const mark = r.ok ? '✓' : '✗'
        console.log(`${mark} ${r.name} — ${r.detail}`)
        if (!r.ok) {
          allOk = false
          if (r.fix) console.log(`    fix: ${r.fix}`)
        }
      }
      console.log(allOk ? '\nall checks passed' : '\nsome checks failed (see fix hints above)')
      process.exit(allOk ? 0 : 1)
    })
}
