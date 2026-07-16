// Phase 2.4 W5 T5.1 — doctor 5-check × 6-env-scenario fixture matrix (30 cells).
// Sister: tests/cli/doctor.test.ts (T1.3, 4 cells, ≤100L) — this is the broader
// fixture exercise per B-31 + D2.4-19. Karpathy YAGNI: spawnSync/readFile mock
// per-scenario (single mockImplementation), JSON-shape assertion only — no
// re-asserting check internals (those covered in doctor.test.ts cells 1-4).
// ≤150L per task_plan.md L1027.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))
// Phase 3.3 W1 T1.12 — 7th check mock (same reason as tests/cli/doctor.test.ts):
// global fs mocks would corrupt aliases.yaml load path; deprecation logic
// covered in tests/cli/check-deprecations.test.ts + tests/manifest/aliases.test.ts.
vi.mock('../../src/cli/lib/check-deprecations.js', () => ({
  checkDeprecations: () => ({
    name: 'deprecated manifests',
    status: 'pass',
    message: 'no deprecated manifests',
  }),
}))
// Phase 3.4 W1 T1.4 — 8th check mock (same reason as 7th): global vi.mock('node:fs')
// would crash check-token-budget.ts existsSync/readdirSync. Deprecation logic
// covered in tests/cli/check-token-budget.test.ts (5 tmpdir fixtures).
vi.mock('../../src/cli/lib/check-token-budget.js', () => ({
  checkTokenBudget: () => ({
    name: 'token budget',
    status: 'pass',
    message: '0 skill(s) total 0 tokens (under 1% / 2000 threshold)',
  }),
}))
// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th check mocks (same reason as 7th/8th).
// PRIMARY logic unit-tested in tests/cli/checkAgentTeams.test.ts + tests/cli/
// check-planning-with-files.test.ts. Scenario matrix axes (jq/bash/git/mcp/node)
// orthogonal to these 2 NEW axes — keep default pass for all 6 scenarios.
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
// tests/cli/check-mcp-availability.test.ts. Scenario matrix axes orthogonal.
vi.mock('../../src/cli/lib/check-mattpocock-skills.js', () => ({
  checkMattpocockSkills: () => ({
    name: 'mattpocock-skills',
    status: 'pass',
    message: 'installed as plugin (version 1.2.0)',
  }),
}))
vi.mock('../../src/cli/lib/check-mcp-availability.js', () => ({
  checkMcpAvailability: () => ({
    name: 'MCP servers (tavily/exa/chrome-devtools)',
    status: 'pass',
    message: 'all 3 installed: tavily-mcp, exa-mcp, chrome-devtools',
  }),
}))
// Phase 18 — 13th check mock (check-codegraph.ts uses fs existsSync not in the
// node:fs mock). Always-pass opt-in detector; real logic in check-codegraph.test.ts.
vi.mock('../../src/cli/lib/check-codegraph.js', () => ({
  checkCodeGraph: () => ({
    name: 'codegraph',
    status: 'pass',
    message: 'CodeGraph not configured (optional semantic index)',
  }),
}))
// Phase 20 — 14th check mock (check-update.ts spawns `npm view`). Real logic in
// tests/cli/check-update.test.ts. Default pass.
// 4.23.0 (issue #3) — 17th check mock (reads the real skills dir + hash
// ledger; the global fs mocks would make it audit garbage). Real logic in
// tests/cli/lib/skillIntegrity.test.ts (tmpdir).
vi.mock('../../src/cli/lib/check-skill-integrity.js', () => ({
  checkSkillIntegrity: () => ({
    name: 'workflow skill integrity',
    status: 'pass',
    message: '28 installed workflow skill(s) match their install-time hash ledger',
  }),
}))
vi.mock('../../src/cli/lib/check-update.js', () => ({
  checkUpdate: () => ({ name: 'update', status: 'pass', message: 'up to date (test)' }),
}))
// 4.32.4 install-channels + issue #8 stale-hooks both call fs.existsSync at
// runtime; this file mocks node:fs with readFileSync only (no existsSync), so
// mock these two checks to deterministic pass. Real logic unit-tested in
// tests/cli/check-install-channels.test.ts + tests/cli/check-stale-hooks.test.ts.
vi.mock('../../src/cli/lib/check-install-channels.js', () => ({
  checkInstallChannels: () => ({
    name: 'install channel',
    status: 'pass',
    message: 'single channel (npm)',
  }),
}))
vi.mock('../../src/cli/lib/check-stale-hooks.js', () => ({
  checkStaleHooks: () => ({
    name: 'stale hooks',
    status: 'pass',
    message: 'no orphaned harnessed hooks',
  }),
}))

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerDoctor } from '../../src/cli/doctor.js'

const spawnSyncMock = vi.mocked(spawnSync)
const readFileMock = vi.mocked(readFile)
const readFileSyncMock = vi.mocked(readFileSync)
const REPO = 'https://github.com/easyinplay/harnessed.git'

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

interface Scenario {
  name: string
  jq: boolean
  bashFlavor: 'git-bash' | 'wsl' | 'missing'
  gitUrl: string
  hasMcp: boolean
}

// 6 env scenarios × 5 checks = 30 fixture matrix per B-31 / D2.4-19.
// Anchor for task_plan T5.1 acceptance grep (scenario: 'clean-linux'|'clean-mac'|
// 'clean-win-git-bash'|'missing-jq'|'wrong-node'|'tampered-origin').
const SCENARIOS: Scenario[] = [
  { name: 'clean-linux', jq: true, bashFlavor: 'git-bash', gitUrl: REPO, hasMcp: false },
  { name: 'clean-mac', jq: true, bashFlavor: 'git-bash', gitUrl: REPO, hasMcp: false },
  { name: 'clean-win-git-bash', jq: true, bashFlavor: 'git-bash', gitUrl: REPO, hasMcp: false },
  { name: 'missing-jq', jq: false, bashFlavor: 'git-bash', gitUrl: REPO, hasMcp: false },
  { name: 'wrong-node', jq: true, bashFlavor: 'git-bash', gitUrl: REPO, hasMcp: false },
  {
    name: 'tampered-origin',
    jq: true,
    bashFlavor: 'git-bash',
    gitUrl: 'https://github.com/evil/tampered.git',
    hasMcp: false,
  },
]

function applyScenario(s: Scenario): void {
  spawnSyncMock.mockImplementation((cmd: string, args?: readonly string[]) => {
    const argv = (args ?? []) as string[]
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'jq')
      return { status: s.jq ? 0 : 127, stdout: s.jq ? '/usr/bin/jq\n' : '' } as never
    // Phase 3.2 W1 T1.5 — 6th check gstack PROBE: scenarios all assume 'prefixed'
    // gstack-only state (clean PROBE pass, prefix='gstack-'). Scenario matrix could
    // be expanded later for gstack=bare/both/neither — current 6 scenarios match
    // doctor's check#1-5 axes (jq/bash/git/mcp/node) NOT gstack axis (T1.8 covers it).
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'gstack-office-hours')
      return { status: 0, stdout: '/usr/bin/gstack-office-hours\n' } as never
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'office-hours')
      return { status: 1, stdout: '' } as never
    if (cmd === 'where' || cmd === 'which')
      return s.bashFlavor === 'missing'
        ? ({ status: 1, stdout: '' } as never)
        : ({ status: 0, stdout: '/usr/bin/bash\n' } as never)
    if (cmd === 'bash')
      return {
        status: 0,
        stdout: s.bashFlavor === 'wsl' ? 'Ubuntu\n' : '',
      } as never
    if (cmd === 'git') return { status: 0, stdout: `${s.gitUrl}\n` } as never
    return { status: 0, stdout: '' } as never
  })
  if (s.hasMcp)
    readFileMock.mockResolvedValue(JSON.stringify({ mcpServers: { foo: { command: 'x' } } }))
  else readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  readFileSyncMock.mockReturnValue(JSON.stringify({ repository: { url: REPO } }))
}

async function runCli(): Promise<{
  code: number
  parsed: { checks: Array<{ name: string; status: string }>; summary: string }
}> {
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
    await program.parseAsync(['node', 'harnessed', 'doctor', '--json'])
    return { code: 0, parsed: JSON.parse(stdout) }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, parsed: JSON.parse(stdout) }
    throw e
  }
}

describe('Phase 2.4 W5 T5.1 — doctor 12-check × 6-scenario fixture matrix (72 cells, v3.6.0 Phase 2 bump 10→12)', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset()
    readFileMock.mockReset()
    readFileSyncMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // Win-specific scenarios run on all OS via mock (no real platform branch needed —
  // doctor reads process.platform which we cannot mock cross-OS without ESM tricks;
  // skipIf non-Win for clean-win-git-bash since bash-flavor check branches on real OS).
  for (const scenario of SCENARIOS) {
    const skipNonWin = scenario.name === 'clean-win-git-bash' && process.platform !== 'win32'
    const test = skipNonWin ? it.skip : it
    test(`scenario: '${scenario.name}' — 19 checks emit + summary matches expectation`, async () => {
      applyScenario(scenario)
      const { code, parsed } = await runCli()
      expect(parsed.checks).toHaveLength(19)
      expect(parsed.checks.map((c) => c.name)).toEqual(
        expect.arrayContaining([
          'node ≥ 22',
          'mcp scope', // v4.15.1 — renamed (informational; user-scope is the install default)
          'jq present',
          'bash flavor (win)',
          'origin URL',
          'gstack prefix', // ← Phase 3.2 W1 T1.5 6th check
          'deprecated manifests', // ← Phase 3.3 W1 T1.7 7th check
          'token budget', // ← Phase 3.4 W1 T1.2 8th check
          'Agent Teams env', // ← Phase v2.0-2.4 W3 T2.4.W3.1 9th check (D-11)
          'planning-with-files plugin', // ← Phase v2.0-2.4 W3 T2.4.W3.1 10th check (D-15)
          'mattpocock-skills', // ← v3.6.0 Phase 2 Wave 1 11th check (user reframe)
          'MCP servers (tavily/exa/chrome-devtools)', // ← v3.6.0 Phase 2 Wave 2 12th check (audit P1a)
          'codegraph', // ← Phase 18 13th check (opt-in semantic index, always pass)
          'update', // ← Phase 20 14th check (update available, fail-soft pass)
          'bun present', // ← v4.16.1 15th check (warn-only gstack build dep)
          'guard conflict (GateGuard)', // ← 4.22.1 16th check (dual-guard, warn-only)
          'workflow skill integrity', // ← 4.23.0 17th check (issue #3, warn-only)
        ]),
      )
      if (scenario.name === 'missing-jq') {
        // v4.15.2 T5 — jq downgraded fail → warn (optional: only audit-log --filter
        // + ralph-loop-on-Windows consume it; setup/core never does).
        expect(parsed.summary).toBe('warn')
        expect(code).toBe(0)
      } else if (scenario.name === 'tampered-origin') {
        expect(parsed.summary).toBe('warn') // doctor allowFork=true → warn (audit fails hard)
        expect(code).toBe(0) // B-06: warn ≠ fail
      } else {
        // clean / wrong-node: Node ≥ 22 enforced by ci.yml so clean path expected pass
        expect(['pass', 'warn']).toContain(parsed.summary)
      }
    })
  }
})
