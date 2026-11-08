// Phase 86 — `resolveAgentTeamsStatus` truth table.
//
// Why a PURE resolver: the gates decision (src/cli/gates.ts) must know whether
// this host can form an Agent Team BEFORE it hands the orchestrator a
// team-shaped plan. The doctor answers the same question from the same two
// sources (env + settings.json), so the truth table lives in ONE pure function
// both callers feed. Pure = no process.env, no fs: the inputs arrive as
// arguments, which is also what makes the matrix below testable at all.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

import { readFile } from 'node:fs/promises'
import { resolveAgentTeamsStatus } from '../../src/cli/lib/checkAgentTeams.js'

const readFileMock = vi.mocked(readFile)

/** The two spellings that mean "on" — everything else is off. */
const ENABLED = new Set(['1', 'true'])

function expectedOn(value: string | undefined): boolean {
  return value !== undefined && ENABLED.has(value.trim().toLowerCase())
}

/** The full input space of the two sources (unset included). */
const VALUES: (string | undefined)[] = ['1', 'true', '0', 'false', '', undefined]

beforeEach(() => {
  vi.unstubAllEnvs()
  readFileMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Phase 86 — resolveAgentTeamsStatus truth matrix', () => {
  it('env × settings — active / source / echoed raw values', () => {
    for (const envValue of VALUES) {
      for (const settingsValue of VALUES) {
        const status = resolveAgentTeamsStatus({ envValue, settingsValue })
        const envOn = expectedOn(envValue)
        const settingsOn = expectedOn(settingsValue)

        expect(status.active).toBe(envOn || settingsOn)
        expect(status.source).toBe(envOn ? 'env' : settingsOn ? 'settings' : 'none')
        // The raw values ride along so a caller can explain the verdict.
        expect(status.envValue).toBe(envValue)
        expect(status.settingsValue).toBe(settingsValue)
      }
    }
  })

  it("only '1' and 'true' count as on — '0', 'false' and '' do not", () => {
    expect(resolveAgentTeamsStatus({ envValue: '1' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ envValue: 'true' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ envValue: '0' }).active).toBe(false)
    expect(resolveAgentTeamsStatus({ envValue: 'false' }).active).toBe(false)
    expect(resolveAgentTeamsStatus({ envValue: '' }).active).toBe(false)
    expect(resolveAgentTeamsStatus({}).active).toBe(false)
  })

  it('the value is trimmed and lower-cased before the verdict', () => {
    expect(resolveAgentTeamsStatus({ envValue: ' 1 ' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ envValue: ' TRUE ' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ envValue: ' True' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ settingsValue: '\tTrue\n' }).active).toBe(true)
    expect(resolveAgentTeamsStatus({ envValue: ' 0 ' }).active).toBe(false)
    expect(resolveAgentTeamsStatus({ envValue: ' false ' }).active).toBe(false)
  })

  it('settings.json alone can enable the capability (env unset)', () => {
    const status = resolveAgentTeamsStatus({ settingsValue: '1' })
    expect(status.active).toBe(true)
    expect(status.source).toBe('settings')
  })

  it('env wins the source attribution when BOTH sources are on', () => {
    const status = resolveAgentTeamsStatus({ envValue: '1', settingsValue: '1' })
    expect(status.active).toBe(true)
    expect(status.source).toBe('env')
  })

  it('an explicitly disabled env does not veto an enabled settings.json', () => {
    const status = resolveAgentTeamsStatus({ envValue: '0', settingsValue: 'true' })
    expect(status.active).toBe(true)
    expect(status.source).toBe('settings')
  })

  it('nothing enabled → active=false, source=none', () => {
    const status = resolveAgentTeamsStatus({ envValue: '0', settingsValue: 'false' })
    expect(status.active).toBe(false)
    expect(status.source).toBe('none')
  })

  it('PURE — the live env and the filesystem do not leak into the verdict', () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '1')
    const status = resolveAgentTeamsStatus({})
    // The live env says "on"; the pure resolver says "no input, no verdict".
    expect(status.active).toBe(false)
    expect(status.source).toBe('none')
    // And it touched no IO at all.
    expect(readFileMock).not.toHaveBeenCalled()
  })
})
