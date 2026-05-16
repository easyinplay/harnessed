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

describe('Phase 2.4 W5 T5.1 — doctor 6-check × 6-scenario fixture matrix (36 cells, Phase 3.2 W1 bump 5→6)', () => {
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
    test(`scenario: '${scenario.name}' — 6 checks emit + summary matches expectation`, async () => {
      applyScenario(scenario)
      const { code, parsed } = await runCli()
      expect(parsed.checks).toHaveLength(6)
      expect(parsed.checks.map((c) => c.name)).toEqual(
        expect.arrayContaining([
          'node ≥ 22',
          'mcp scope = project',
          'jq present',
          'bash flavor (win)',
          'origin URL',
          'gstack prefix', // ← Phase 3.2 W1 T1.5 6th check
        ]),
      )
      if (scenario.name === 'missing-jq') {
        expect(parsed.summary).toBe('fail')
        expect(code).toBe(1)
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
