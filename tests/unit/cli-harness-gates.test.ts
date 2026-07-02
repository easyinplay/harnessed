// v4.14.0 T6/T7 — CC-only 文案/探测在非 claude 平台的门控:
//   - warnIfAgentTeamsMissing: codex → 静默 return(Agent Teams 是 CC-only 概念)
//   - checkPlanningWithFiles: 平台无 plugin registry(codex)→ pass-skip
//   - checkMcpScope: claude-only 检查 → codex pass-skip
//   - checkMattpocockSkills: 未安装时 install_commands 的 --agent 按平台计算

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const enoent = () => {
  const e = new Error('ENOENT') as NodeJS.ErrnoException
  e.code = 'ENOENT'
  return e
}
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async () => {
    throw enoent()
  }),
  readdir: vi.fn(async () => {
    throw enoent()
  }),
  stat: vi.fn(async () => {
    throw enoent()
  }),
  access: vi.fn(async () => {
    throw enoent()
  }),
}))
vi.mock('../../src/cli/lib/checkAgentTeams.js', () => ({
  checkAgentTeams: vi.fn(async () => ({
    status: 'missing',
    detected: { env: false, settingsJson: false },
  })),
}))

import { checkMcpScope } from '../../src/cli/lib/check-builtin.js'
import { checkMattpocockSkills } from '../../src/cli/lib/check-mattpocock-skills.js'
import { checkPlanningWithFiles } from '../../src/cli/lib/check-planning-with-files.js'
import { warnIfAgentTeamsMissing } from '../../src/cli/lib/setup-helpers.js'

describe('cross-harness gates (v4.14.0)', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('warnIfAgentTeamsMissing on codex → no warning output (CC-only concept)', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await warnIfAgentTeamsMissing()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warnIfAgentTeamsMissing on claude + missing → warns (regression)', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await warnIfAgentTeamsMissing()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('checkPlanningWithFiles on codex (no plugin registry) → pass-skip, no CC remediation', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = await checkPlanningWithFiles()
    expect(r.status).toBe('pass')
    expect(r.message).toContain('skipped')
    expect(r.install_commands).toBeUndefined()
  })

  it('checkMcpScope on codex → pass-skip (claude-only check)', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = await checkMcpScope()
    expect(r.status).toBe('pass')
    expect(r.message).toContain('skipped')
  })

  it('checkMattpocockSkills install_commands carries --agent codex on codex', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn') // nothing on disk (fs mocked ENOENT)
    expect(r.install_commands?.[0]).toContain('--agent codex')
    expect(r.install_commands?.[0]).not.toContain('--agent claude-code')
  })

  it('checkMattpocockSkills install_commands carries --agent claude-code on claude', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.install_commands?.[0]).toContain('--agent claude-code')
  })
})
