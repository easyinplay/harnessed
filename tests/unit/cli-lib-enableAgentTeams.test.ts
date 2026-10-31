// v3.3.1 hotfix — enableAgentTeamsInSettings 6-fixture (Q-AUDIT-5b LOCKED root-level
// env.* schema). Sister tests/cli/checkAgentTeams.test.ts vi.mock pattern.
//
// Covers: (1) file missing → create + key=1
//         (2) file exists + key=1 → idempotent no-op
//         (3) file exists + key=0 → backup + flip to "1"
//         (4) file exists + missing env key → merge add + backup
//         (5) malformed JSON → warn + skip (not throw)
//         (6) write fail (permission) → warn + skip

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
  stat: vi.fn(),
}))

vi.mock('../../src/platform/harnessedRoot.js', () => ({
  harnessedFile: (name: string) => `/fake-home/.claude/harnessed/${name}`,
  harnessedSubdir: (name: string) => `/fake-home/.claude/harnessed/${name}`,
}))

vi.mock('proper-lockfile', () => ({
  default: { lock: vi.fn(async () => vi.fn(async () => undefined)) },
}))

import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const renameMock = vi.mocked(rename)
const mkdirMock = vi.mocked(mkdir)
const statMock = vi.mocked(stat)

function mockSettingsFile(raw: string): void {
  readFileMock.mockImplementation(async (path) => {
    if (String(path).includes('settings-env-ownership.json')) {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    }
    return raw
  })
}

beforeEach(() => {
  readFileMock.mockReset()
  writeFileMock.mockReset()
  renameMock.mockReset()
  mkdirMock.mockReset()
  statMock.mockReset()
  mkdirMock.mockResolvedValue(undefined as never)
  writeFileMock.mockResolvedValue(undefined as never)
  renameMock.mockResolvedValue(undefined as never)
  statMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('enableAgentTeamsInSettings — v3.3.1 6-fixture', () => {
  it('1. file missing → create with key=1', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('created')
    // tmp write + rename to real path
    expect(writeFileMock).toHaveBeenCalledTimes(2)
    expect(renameMock).toHaveBeenCalledTimes(2)
    // tmp file content should contain the env key flipped on
    const tmpContent = writeFileMock.mock.calls.find((call) =>
      String(call[0]).includes('settings.json.tmp-'),
    )?.[1] as string
    expect(tmpContent).toContain('"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"')
    expect(tmpContent).toContain('"env":')
  })

  it('2. file exists + key=1 → idempotent no-op (no write)', async () => {
    mockSettingsFile(JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }))
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('already-enabled')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })

  it('3. file exists + key=0 → backup + flip to "1"', async () => {
    mockSettingsFile(JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '0' } }))
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('enabled')
    // 3 write calls: backup + atomic settings tmp + ownership receipt tmp
    expect(writeFileMock).toHaveBeenCalledTimes(3)
    expect(renameMock).toHaveBeenCalledTimes(2)
    // backup path should land under harnessed/backups (cross-platform path sep)
    const backupCall = writeFileMock.mock.calls.find((c) => {
      const p = String(c[0]).replace(/\\/g, '/')
      return p.includes('/backups/settings.json')
    })
    expect(backupCall).toBeDefined()
    // final write content should flip key to "1"
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    expect(finalWrite).toBeDefined()
    const content = finalWrite?.[1] as string
    expect(content).toContain('"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"')
  })

  it('4. file exists + missing env key → merge add + backup (non-destructive)', async () => {
    mockSettingsFile(
      JSON.stringify({ env: { SOME_OTHER_VAR: 'preserved' }, hooks: { keep: true } }),
    )
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('enabled')
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    const content = finalWrite?.[1] as string
    // Non-destructive: SOME_OTHER_VAR preserved, hooks preserved, new key added
    expect(content).toContain('"SOME_OTHER_VAR": "preserved"')
    expect(content).toContain('"hooks":')
    expect(content).toContain('"keep": true')
    expect(content).toContain('"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"')
  })

  it('5. malformed JSON → warn + skip (not throw)', async () => {
    readFileMock.mockResolvedValue('{ invalid json [[[')
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('warn')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
    if (r.status === 'warn') {
      expect(r.message).toMatch(/malformed JSON/i)
    }
  })

  it('6. write fail (permission) → warn + skip', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    writeFileMock.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('warn')
    if (r.status === 'warn') {
      expect(r.message).toMatch(/EPERM|write.*failed/i)
    }
  })
})
