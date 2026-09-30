// Phase 2.4 W1 T1.3 — doctor 5-check unit + --json + warn≠fail exit policy.
// Sister: tests/unit/cli-doctor.test.ts (Phase 1.2, 4 cells checks 1-4). ≤100L.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))
// Phase 3.3 W1 T1.12 — 7th check mock: doctor tests mock node:fs globally with
// JSON content; loading aliases.yaml via yaml.parse would fail. Mock the helper
// to always emit pass-status (deprecation logic is unit-tested in
// tests/cli/check-deprecations.test.ts and tests/manifest/aliases.test.ts).
vi.mock('../../src/cli/lib/check-deprecations.js', () => ({
  checkDeprecations: () => ({
    name: 'deprecated manifests',
    status: 'pass',
    message: 'no deprecated manifests',
  }),
}))
// Phase 3.4 W1 T1.4 — 8th check mock (same reason as 7th): global vi.mock('node:fs')
// would crash check-token-budget.ts existsSync/readdirSync. Real PRIMARY helper logic
// is unit-tested in tests/cli/check-token-budget.test.ts (5 fixtures with tmpdir).
vi.mock('../../src/cli/lib/check-token-budget.js', () => ({
  checkTokenBudget: () => ({
    name: 'token budget',
    status: 'pass',
    message: '0 skill(s) total 0 tokens (under 1% / 2000 threshold)',
  }),
}))
// 4.32.4 — 18th check mock (same reason): checkInstallChannels spawns `npm
// prefix -g` + reads fs, both globally mocked here, and its result depends on
// the runner's actual dual-install state. Real logic is unit-tested in
// tests/cli/check-install-channels.test.ts. Default pass for cell-1 all-pass.
vi.mock('../../src/cli/lib/check-install-channels.js', () => ({
  checkInstallChannels: () => ({
    name: 'install channel',
    status: 'pass',
    message: 'single channel (npm)',
  }),
}))
// issue #8 — stale-hook self-heal check reads ~/.claude/settings.json; mock to a
// clean pass here (primary logic unit-tested in tests/cli/check-stale-hooks.test.ts).
vi.mock('../../src/cli/lib/check-stale-hooks.js', () => ({
  checkStaleHooks: () => ({
    name: 'stale hooks',
    status: 'pass',
    message: 'no orphaned harnessed hooks',
  }),
}))
// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th check mocks (same reason as 7th/8th):
// real impls read process.env / fs which doctor.test.ts has globally mocked.
// PRIMARY logic unit-tested in tests/cli/checkAgentTeams.test.ts + tests/cli/
// check-planning-with-files.test.ts (sister pattern). Default = pass for cell 1
// "all checks pass"; individual cells override status as needed.
vi.mock('../../src/cli/lib/check-agent-teams-doctor.js', () => ({
  checkAgentTeamsDoctor: () => ({
    name: 'Agent Teams env',
    status: 'pass',
    message: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 (env var)',
  }),
}))
vi.mock('../../src/cli/lib/check-planning-with-files.js', () => ({
  checkPlanningWithFiles: () => ({
    name: 'planning-with-files plugin',
    status: 'pass',
    message: 'installed (version 2.34.0)',
  }),
}))
// v3.6.0 Phase 2 Wave 3 — 11th + 12th check mocks (same reason as 9th/10th).
// PRIMARY logic unit-tested in tests/cli/check-mattpocock-skills.test.ts +
// tests/cli/check-mcp-availability.test.ts (sister tmpdir+HOME redirect pattern).
// Phase 56 — 22nd check mock (check-plugin-staleness.ts walks the shipped
// manifests/ dir and reads ~/.claude/plugins/installed_plugins.json, neither of
// which the global node:fs mock serves; on a real dev machine it legitimately
// warns, which would flip this suite's all-pass cells. Real logic unit-tested in
// tests/cli/check-plugin-staleness.test.ts (12 cells, fully dep-injected).
vi.mock('../../src/cli/lib/check-plugin-staleness.js', () => ({
  checkPluginStaleness: () => ({
    name: 'plugin install freshness',
    status: 'pass',
    message: '4 marketplace plugin(s) current',
  }),
}))
vi.mock('../../src/cli/lib/check-mattpocock-skills.js', () => ({
  checkMattpocockSkills: () => ({
    name: 'mattpocock-skills',
    status: 'pass',
    message: 'installed as plugin (version 1.2.0)',
  }),
}))
vi.mock('../../src/cli/lib/check-mcp-availability.js', () => ({
  checkMcpAvailability: () => ({
    name: 'MCP servers (tavily/exa)',
    status: 'pass',
    message: 'installed: tavily-mcp, exa-mcp (API keys configured)',
  }),
}))
// 4.32.22 — 20th check mock (check-ecc.ts reads installed_plugins.json +
// ~/.codex paths via fs/promises stat, not in the global mock). Real logic
// unit-tested in tests/cli/check-ecc.test.ts (tmpdir + HOME redirect).
vi.mock('../../src/cli/lib/check-ecc.js', () => ({
  checkEcc: () => ({
    name: 'ecc',
    status: 'pass',
    message: 'CC: installed (plugin ecc@ecc); codex: not present (no ~/.codex/config.toml)',
  }),
}))
// Phase 18 — 13th check mock (same reason: check-codegraph.ts uses fs existsSync
// which the global node:fs mock doesn't export). Real logic unit-tested in
// tests/cli/check-codegraph.test.ts. Always-pass opt-in detector.
vi.mock('../../src/cli/lib/check-codegraph.js', () => ({
  checkCodeGraph: () => ({
    name: 'codegraph',
    status: 'pass',
    message: 'CodeGraph not configured (optional semantic index)',
  }),
}))
// Phase 20 — 14th check mock (check-update.ts spawns `npm view` for the version
// check). Real logic unit-tested in tests/cli/check-update.test.ts. Default pass.
vi.mock('../../src/cli/lib/check-update.js', () => ({
  checkUpdate: () => ({ name: 'update', status: 'pass', message: 'up to date (test)' }),
}))
// 4.23.0 (issue #3) — 17th check mock (check-skill-integrity.ts reads the real
// skills dir + hash ledger; the global fs mocks would make it audit garbage).
// Real logic unit-tested in tests/cli/lib/skillIntegrity.test.ts (tmpdir).
vi.mock('../../src/cli/lib/check-skill-integrity.js', () => ({
  checkSkillIntegrity: () => ({
    name: 'workflow skill integrity',
    status: 'pass',
    message: '28 installed workflow skill(s) match their install-time hash ledger',
  }),
}))

// v16.0 Phase 64 — 24th check mock (check-codex-hooks.ts spawns `codex plugin list`
// / `codex app-server` on codex and reads plugin dirs). Real logic unit-tested in
// tests/cli/check-codex-hooks.test.ts (injected deps).
// v16.0 Phase 66 T5 — `skipped`, not the fake `pass` it wore before. On a claude
// run this is the ONE row whose mark changes (✓ → -); the summary is unaffected.
// Host-aware like the real check: it reads detectPlatform().id, which `doctor
// --host` / `--matrix` drive through HARNESSED_PLATFORM — so the matrix cells stay
// honest (cell 13 asserts no cell is `skipped`).
vi.mock('../../src/cli/lib/check-codex-hooks.js', () => ({
  checkCodexHooks: () =>
    process.env.HARNESSED_PLATFORM === 'codex'
      ? {
          name: 'codex hook plugins',
          status: 'pass',
          message: 'no harnessed codex hook plugins installed',
        }
      : {
          name: 'codex hook plugins',
          status: 'skipped',
          message: 'not codex (claude) — skipped',
        },
}))

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerDoctor } from '../../src/cli/doctor.js'

const spawnSyncMock = vi.mocked(spawnSync)
const readFileMock = vi.mocked(readFile)
const readFileSyncMock = vi.mocked(readFileSync)

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string }> {
  let stdout = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerDoctor(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout }
    throw e
  }
}

const REPO = 'https://github.com/easyinplay/harnessed.git'

function mockSpawn(
  opts: { jq?: boolean; gitUrl?: string; gstack?: 'prefixed' | 'bare' | 'both' | 'neither' } = {},
): void {
  const { jq = true, gitUrl = REPO, gstack = 'prefixed' } = opts
  spawnSyncMock.mockImplementation((cmd: string, args?: readonly string[]) => {
    const argv = (args ?? []) as string[]
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'jq')
      return { status: jq ? 0 : 127, stdout: jq ? '/usr/bin/jq\n' : '' } as never
    // Phase 3.2 W1 T1.5 — 6th check gstack PROBE: 4 outcome branches via gstack opt.
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'gstack-office-hours') {
      const found = gstack === 'prefixed' || gstack === 'both'
      return {
        status: found ? 0 : 1,
        stdout: found ? '/usr/bin/gstack-office-hours\n' : '',
      } as never
    }
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'office-hours') {
      const found = gstack === 'bare' || gstack === 'both'
      return { status: found ? 0 : 1, stdout: found ? '/usr/bin/office-hours\n' : '' } as never
    }
    if (cmd === 'where' || cmd === 'which') return { status: 0, stdout: '/usr/bin/bash\n' } as never
    if (cmd === 'bash') return { status: 0, stdout: '' } as never // empty WSL probe
    if (cmd === 'git') return { status: 0, stdout: `${gitUrl}\n` } as never
    return { status: 0, stdout: '' } as never
  })
  readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  readFileSyncMock.mockReturnValue(JSON.stringify({ repository: { url: REPO } }))
}

describe('cli/doctor — Phase 2.4 W1 5-check + Phase 3.2 W1 6 + Phase 3.3 W1 7 + Phase 3.4 W1 8 + Phase v2.0-2.4 W3 10 + v3.6.0 Phase 2 12-check + --json + exit policy', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset()
    readFileMock.mockReset()
    readFileSyncMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // v3.7.0 Phase 1 — registry future-proof: CHECKS array is single source of truth.
  // Bump assertion when adding a check (sister doctor.ts --description string update).
  it('cell 0 — CHECKS registry has 24 descriptor entries (Phase 66 T5 shape)', async () => {
    const { CHECKS } = await import('../../src/cli/lib/doctor-registry.js')
    expect(CHECKS.length).toBe(24)
    // Phase 66 T5 — every entry carries its own name + host annotation.
    expect(CHECKS.every((c) => typeof c.name === 'string' && Array.isArray(c.hosts))).toBe(true)
  })

  it('cell 1 — all 24 checks pass/skipped → exit 0 + summary "pass" (Phase 66: 1 skipped)', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    const p = JSON.parse(stdout) as { checks: { name: string }[]; summary: string }
    expect(p.checks).toHaveLength(24)
    expect(p.summary).toBe('pass')
    expect(p.checks.map((c) => c.name)).toContain('deprecated manifests')
    // Phase 3.4 W1 T1.4 — 8th check assertion (token budget = pass mock when no skills)
    expect(p.checks.map((c) => c.name)).toContain('token budget')
    // Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th check assertions (D-11 + D-15)
    expect(p.checks.map((c) => c.name)).toContain('Agent Teams env')
    expect(p.checks.map((c) => c.name)).toContain('planning-with-files plugin')
    // v3.6.0 Phase 2 Wave 3 — 11th + 12th check assertions (mattpocock + MCP avail)
    expect(p.checks.map((c) => c.name)).toContain('mattpocock-skills')
    expect(p.checks.map((c) => c.name)).toContain('MCP servers (tavily/exa)')
    // Phase 18 — 13th check (opt-in codegraph detect, always pass)
    expect(p.checks.map((c) => c.name)).toContain('codegraph')
    // Phase 20 — 14th check (update available, fail-soft pass)
    expect(p.checks.map((c) => c.name)).toContain('update')
    // v4.16.1 — 15th check (bun present, warn-only gstack build dep)
    expect(p.checks.map((c) => c.name)).toContain('bun present')
    // 4.22.1 — 16th check (dual-guard GateGuard conflict, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('guard conflict (GateGuard)')
    // 4.23.0 — 17th check (installed workflow-skill integrity, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('workflow skill integrity')
    // 4.32.4 — 18th check (dual install-channel conflict, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('install channel')
    // 4.32.22 — 20th check (ECC per-harness detect, optional / warn on overlap)
    expect(p.checks.map((c) => c.name)).toContain('ecc')
    // Phase 56 — 22nd check (stale marketplace plugin installs, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('plugin install freshness')
    // Phase 60 — 23rd check (HARNESSED_OFF left on, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('ablation switch')
  })

  it('cell 5 — doctor 8th check token budget — status warn does NOT fail exit (B-06 + D-04)', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0) // warn ≠ fail per D-04 DOCTOR WARN + B-06
    const p = JSON.parse(stdout) as { checks: { name: string; status: string }[]; summary: string }
    expect(p.checks).toHaveLength(24)
    const tokenBudget = p.checks.find((c) => c.name === 'token budget')
    expect(tokenBudget).toBeDefined()
    expect(['pass', 'warn']).toContain(tokenBudget?.status ?? 'fail')
  })

  it('cell 2 — origin URL drift → warn → exit 0 per B-06 (warn ≠ fail)', async () => {
    mockSpawn({ gitUrl: 'https://github.com/forker/fork.git' })
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    expect(JSON.parse(stdout).summary).toBe('warn')
  })

  it('cell 3 — jq missing → warn → exit 0 (v4.15.2 T5: jq is optional, not a core dep)', async () => {
    mockSpawn({ jq: false })
    const { code } = await runCli(['doctor'])
    expect(code).toBe(0)
  })

  it('cell 4 — --json emits {host, checks, summary}; summary stays 3-tier for CI', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--json'])
    const p = JSON.parse(stdout) as {
      host: string | null
      checks: { status: string; name: string }[]
      summary: string
    }
    // Phase 66 T5 — `host: null` = not forced; every check ran against the
    // active harness (the pre-Phase-66 default behaviour).
    expect(p.host).toBeNull()
    expect(['pass', 'warn', 'fail']).toContain(p.summary)
    // Phase 66 T5 — `skipped` joins the per-check status set; the SUMMARY does not.
    expect(p.checks.every((c) => ['pass', 'warn', 'fail', 'skipped'].includes(c.status))).toBe(true)
    expect(p.checks.map((c) => c.name)).toContain('origin URL')
  })

  // ── v16.0 Phase 66 T5 ──────────────────────────────────────────────────────

  it('cell 6 — skipped is first-class: the codex-hooks row reports it and the summary stays pass', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    const p = JSON.parse(stdout) as { checks: { name: string; status: string }[]; summary: string }
    expect(p.checks.find((c) => c.name === 'codex hook plugins')?.status).toBe('skipped')
    expect(p.summary).toBe('pass') // skipped ≠ warn, skipped ≠ fail
    expect(code).toBe(0)
  })

  it('cell 7 — human output marks a skipped row with `-`, not `✓`', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor'])
    expect(stdout).toContain('- codex hook plugins —')
    expect(stdout).not.toContain('✓ codex hook plugins')
  })

  it('cell 8 — every declared registry name matches the name its check reports', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--json'])
    const p = JSON.parse(stdout) as { checks: { name: string }[] }
    const { CHECKS } = await import('../../src/cli/lib/doctor-registry.js')
    expect(p.checks.map((c) => c.name)).toEqual(CHECKS.map((c) => c.name))
  })

  it('cell 9 — --host codex runs only the codex-applicable checks', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--host', 'codex', '--json'])
    const p = JSON.parse(stdout) as {
      host: string
      checks: { name: string; status: string }[]
      summary: string
    }
    const { checksForHost } = await import('../../src/cli/lib/doctor-registry.js')
    expect(p.host).toBe('codex')
    expect(p.checks.map((c) => c.name)).toEqual(checksForHost('codex').map((c) => c.name))
    // the claude-only rows are gone entirely — not present as skipped rows
    expect(p.checks.map((c) => c.name)).not.toContain('mcp scope')
    expect(p.checks.map((c) => c.name)).not.toContain('Agent Teams env')
    expect(p.checks.map((c) => c.name)).toContain('codex hook plugins')
    expect(code).toBe(0)
  })

  it('cell 10 — --host claude drops the codex-only check but keeps all claude rows', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--host', 'claude', '--json'])
    const p = JSON.parse(stdout) as { checks: { name: string }[] }
    expect(p.checks.map((c) => c.name)).not.toContain('codex hook plugins')
    expect(p.checks.map((c) => c.name)).toContain('mcp scope')
    expect(p.checks).toHaveLength(23)
  })

  it('cell 11 — --host rejects an unknown id with exit 2', async () => {
    mockSpawn()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { code } = await runCli(['doctor', '--host', 'cursor', '--json'])
    expect(code).toBe(2)
    expect(err.mock.calls.flat().join(' ')).toContain("unknown id 'cursor'")
  })

  it('cell 12 — --matrix --json emits one row per check with a cell or null per host', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--matrix', '--json'])
    expect(code).toBe(0)
    const { matrix } = JSON.parse(stdout) as {
      matrix: {
        hosts: string[]
        checks: {
          name: string
          hosts: string[]
          cells: Record<string, { status: string } | null>
        }[]
        summary: Record<string, string>
      }
    }
    expect(matrix.hosts).toEqual(['claude', 'codex'])
    expect(matrix.checks).toHaveLength(24)
    expect(Object.keys(matrix.summary).sort()).toEqual(['claude', 'codex'])

    const row = (n: string) => matrix.checks.find((c) => c.name === n)
    // claude-only check: no codex cell at all (never run there)
    expect(row('mcp scope')?.cells.codex).toBeNull()
    expect(row('mcp scope')?.cells.claude?.status).toBeDefined()
    // codex-only check: no claude cell
    expect(row('codex hook plugins')?.cells.claude).toBeNull()
    // both-hosts check: two real cells
    expect(row('node ≥ 22')?.cells.claude?.status).toBe('pass')
    expect(row('node ≥ 22')?.cells.codex?.status).toBe('pass')
  })

  it('cell 13 — no matrix cell is `skipped`: the host annotations match the checks', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--matrix', '--json'])
    const { matrix } = JSON.parse(stdout) as {
      matrix: { checks: { name: string; cells: Record<string, { status: string } | null> }[] }
    }
    // A `skipped` cell means the registry declared a host whose own early-return
    // rejects it — the drift this whole descriptor layer exists to make visible.
    // (`codex hook plugins` is mocked, so its codex cell answers for real here.)
    const drift = matrix.checks.flatMap((c) =>
      Object.entries(c.cells)
        .filter(([, cell]) => cell?.status === 'skipped')
        .map(([host]) => `${c.name} @ ${host}`),
    )
    expect(drift).toEqual([])
  })

  it('cell 14 — --matrix human output is a check × host table with a summary row', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--matrix'])
    const lines = stdout.split('\n')
    expect(lines[0]).toMatch(/^check\s+claude\s+codex$/)
    expect(lines.find((l) => l.startsWith('mcp scope'))).toMatch(/^mcp scope\s+\S+\s+n\/a$/)
    expect(lines.find((l) => l.startsWith('codex hook plugins'))).toMatch(
      /^codex hook plugins\s+n\/a\s+\S+$/,
    )
    expect(lines.find((l) => l.startsWith('summary'))).toMatch(/^summary\s+\S+\s+\S+$/)
  })

  it('cell 15 — --matrix and --host are mutually exclusive (exit 2)', async () => {
    mockSpawn()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { code } = await runCli(['doctor', '--matrix', '--host', 'codex'])
    expect(code).toBe(2)
    expect(err.mock.calls.flat().join(' ')).toContain('mutually exclusive')
  })

  it('cell 16 — --host leaves HARNESSED_PLATFORM as it found it', async () => {
    mockSpawn()
    const before = process.env.HARNESSED_PLATFORM
    await runCli(['doctor', '--host', 'codex', '--json'])
    expect(process.env.HARNESSED_PLATFORM).toBe(before)
  })
})
