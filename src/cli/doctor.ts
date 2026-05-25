// Phase 1.2 cli subcommand `doctor` per PLAN § 4.1 acceptance B8' + ASSUMPTIONS B4 候选 1 + C4.
// Phase 2.4 W1 T1.2 — expanded to 5 checks + --json flag + 3-tier status enum
// (pass/warn/fail) + warn ≠ fail exit policy (B-06). Phase v2.0-2.4 W3 T2.4.W3.1 —
// 9th + 10th checks (Agent Teams env D-11 + planning-with-files plugin D-15);
// hard limit ≤225L per B-03 (12.5% tolerance over Karpathy 200L target — split
// to 2 helper per `if exceed split helper` plan provision). Origin URL check
// delegates to src/cli/lib/origin-check.ts (sister-share with audit, per B-28 + D2.4-3).
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C4 mitigation — WSL detection): on Windows
// we resolve which `bash` the shell will spawn (PATH-first), then probe
// `bash -c 'echo $WSL_DISTRO_NAME'`. If the probe outputs a non-empty string
// the resolved bash is the WSL `bash.exe` shim (which forks a Linux process
// — known to break ralph-loop subagent spawning on harness side, see
// phase-1.1 finding). Empty output = Git Bash or native bash, OK.

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

function checkNodeVersion(): CheckResult {
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

function checkJq(): CheckResult {
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

function checkWinBash(): CheckResult {
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

// Phase 2.4 W1 T1.2 — 5th check: origin URL drift detection (warn mode for fork
// legitimacy per B-05; audit uses hard-fail mode via same helper per B-28).
async function checkOriginUrl(): Promise<CheckResult> {
  const { checkOrigin } = await import('./lib/origin-check.js')
  const r = checkOrigin(process.cwd(), { allowFork: true })
  return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
}

// Phase 3.2 W1 T1.5 — 6th check: gstack command prefix PROBE (D-01 LOCKED).
// Sister Phase 2.4 W1 checkOriginUrl L130-134 dynamic import + delegate pattern.
async function checkGstackPrefix(): Promise<CheckResult> {
  const { probeGstackPrefix } = await import('./lib/probe-gstack.js')
  const r = probeGstackPrefix()
  return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
}

// Phase 3.3 W1 T1.7 — 7th check: deprecated manifests via aliases.yaml (D-02
// DOCTOR-ONLY-WARN). Phase 3.4 W1 T1.2 — 8th check: skill description token
// budget (D-03 BUFFER /4 + D-04 DOCTOR WARN). Option A inline shrink (3L each)
// per RESEARCH § 1.3 + sister L138-142 checkGstackPrefix 100% delegate pattern.
async function checkDeprecations(): Promise<CheckResult> {
  return (await import('./lib/check-deprecations.js')).checkDeprecations()
}
async function checkTokenBudget(): Promise<CheckResult> {
  return (await import('./lib/check-token-budget.js')).checkTokenBudget()
}

// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th checks (Agent Teams env + planning-
// with-files plugin presence). 100% delegate per sister checkGstackPrefix L138
// pattern keeps doctor.ts ≤ Karpathy 200L+5% (CLAUDE.md L21 hard limit).
async function checkAgentTeamsEnv(): Promise<CheckResult> {
  return (await import('./lib/check-agent-teams-doctor.js')).checkAgentTeamsDoctor()
}
async function checkPlanningPlugin(): Promise<CheckResult> {
  return (await import('./lib/check-planning-with-files.js')).checkPlanningWithFiles()
}

// v3.6.0 Phase 2 Wave 1 — 11th check (mattpocock-skills install probe per user
// reframe "setup 时检测"). 100% delegate per sister L161-166 pattern. doctor.ts
// accepts targeted exception over B-03 ≤225L hard limit (PHASE-2-SPEC.md D3
// option A justify: thin dispatcher unchanged; refactor to check-registry.ts
// deferred to v3.7+ when checks reach ~14+).
async function checkMattpocockSkillsInstall(): Promise<CheckResult> {
  return (await import('./lib/check-mattpocock-skills.js')).checkMattpocockSkills()
}

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description(
      'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget / Agent Teams / planning-with-files / mattpocock-skills)',
    )
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      // Phase 4.3 W0 sister 3rd-cycle absorb #BT — async checks parallelize via
      // Promise.all (no data deps); Phase v2.0-2.4 W3 T2.4.W3.1 ADD 9th (D-11)
      // + 10th (D-15); v3.6.0 Phase 2 Wave 1 ADD 11th (mattpocock install probe).
      // Ordering preserved per doctor.test.ts cell-1+4+5.
      const [mcp, origin, gstack, dep, tok, at, ppwf, matt] = await Promise.all([
        checkMcpScope(),
        checkOriginUrl(),
        checkGstackPrefix(),
        checkDeprecations(),
        checkTokenBudget(),
        checkAgentTeamsEnv(),
        checkPlanningPlugin(),
        checkMattpocockSkillsInstall(),
      ])
      const results: CheckResult[] = [
        checkNodeVersion(),
        mcp,
        checkJq(),
        checkWinBash(),
        origin,
        gstack,
        dep,
        tok,
        at,
        ppwf,
        matt,
      ]
      const hasFail = results.some((r) => r.status === 'fail')
      const hasWarn = results.some((r) => r.status === 'warn')
      if (opts.json) {
        console.log(
          JSON.stringify(
            { checks: results, summary: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass' },
            null,
            2,
          ),
        )
      } else {
        for (const r of results) {
          const mark = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
          console.log(`${mark} ${r.name} — ${r.message}`)
          if (r.status !== 'pass' && r.fix) console.log(`    fix: ${r.fix}`)
        }
        console.log(
          hasFail
            ? t('doctor.summary.fail')
            : hasWarn
              ? t('doctor.summary.warn')
              : t('doctor.summary.pass'),
        )
      }
      process.exit(hasFail ? 1 : 0) // B-06: warn ≠ fail (advisory only)
    })
}
