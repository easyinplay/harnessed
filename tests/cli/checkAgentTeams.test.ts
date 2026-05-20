// Phase v2.0-2.3 W0 T2.3.W0.5 — checkAgentTeams 5-fixture (Q-AUDIT-5b MANDATORY:
// schema is root-level env.* NOT nested experimental.*). Sister
// tests/cli/probe-gstack.test.ts vi.mock pattern + tests/cli/check-deprecations.test.ts
// vi.resetModules pattern.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

import { readFile } from 'node:fs/promises'

const readFileMock = vi.mocked(readFile)

beforeEach(() => {
  vi.unstubAllEnvs()
  readFileMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('checkAgentTeams — Q-AUDIT-5b 5-fixture (env / settings.json env.* root-level)', () => {
  it('1. env-on → status=pass, detected.env=true, envValue="1"', async () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '1')
    readFileMock.mockRejectedValue(new Error('ENOENT'))
    const { checkAgentTeams } = await import('../../src/cli/lib/checkAgentTeams.js')
    const r = await checkAgentTeams()
    expect(r.status).toBe('pass')
    expect(r.detected.env).toBe(true)
    expect(r.detected.settingsJson).toBe(false)
    expect(r.envValue).toBe('1')
    expect(r.remediation).toBeUndefined()
  })

  it('2. settings-on → status=pass, detected.settingsJson=true (env unset)', async () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '')
    readFileMock.mockResolvedValue(
      JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }),
    )
    const { checkAgentTeams } = await import('../../src/cli/lib/checkAgentTeams.js')
    const r = await checkAgentTeams()
    expect(r.status).toBe('pass')
    expect(r.detected.env).toBe(false)
    expect(r.detected.settingsJson).toBe(true)
    expect(r.settingsValue).toBe('1')
  })

  it('3. both-on → status=pass, both detected=true', async () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '1')
    readFileMock.mockResolvedValue(
      JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }),
    )
    const { checkAgentTeams } = await import('../../src/cli/lib/checkAgentTeams.js')
    const r = await checkAgentTeams()
    expect(r.status).toBe('pass')
    expect(r.detected.env).toBe(true)
    expect(r.detected.settingsJson).toBe(true)
    expect(r.envValue).toBe('1')
    expect(r.settingsValue).toBe('1')
  })

  it('4. missing-both → status=missing + remediation has env var + settings.json + CC 2.1.133+', async () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '')
    readFileMock.mockRejectedValue(new Error('ENOENT'))
    const { checkAgentTeams } = await import('../../src/cli/lib/checkAgentTeams.js')
    const r = await checkAgentTeams()
    expect(r.status).toBe('missing')
    expect(r.detected.env).toBe(false)
    expect(r.detected.settingsJson).toBe(false)
    expect(r.remediation).toBeDefined()
    expect(r.remediation).toMatch(/CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS/)
    expect(r.remediation).toMatch(/settings\.json/)
    expect(r.remediation).toMatch(/2\.1\.133/)
    expect(r.remediation).toMatch(/claude config set env\.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1/)
  })

  it('5. settings-malformed → fall through to env probe (non-fatal)', async () => {
    vi.stubEnv('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', '1')
    readFileMock.mockResolvedValue('{ invalid json [[[')
    const { checkAgentTeams } = await import('../../src/cli/lib/checkAgentTeams.js')
    const r = await checkAgentTeams()
    // env probe rescues — non-fatal malformed JSON
    expect(r.status).toBe('pass')
    expect(r.detected.env).toBe(true)
    expect(r.detected.settingsJson).toBe(false)
    expect(r.envValue).toBe('1')
  })
})
