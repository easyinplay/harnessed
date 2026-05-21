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
}))

vi.mock('../../src/installers/lib/harnessedRoot.js', () => ({
  harnessedSubdir: (name: string) => `/fake-home/.claude/harnessed/${name}`,
}))

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const renameMock = vi.mocked(rename)
const mkdirMock = vi.mocked(mkdir)

beforeEach(() => {
  readFileMock.mockReset()
  writeFileMock.mockReset()
  renameMock.mockReset()
  mkdirMock.mockReset()
  mkdirMock.mockResolvedValue(undefined as never)
  writeFileMock.mockResolvedValue(undefined as never)
  renameMock.mockResolvedValue(undefined as never)
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
    expect(writeFileMock).toHaveBeenCalledOnce()
    expect(renameMock).toHaveBeenCalledOnce()
    // tmp file content should contain the env key flipped on
    const tmpContent = writeFileMock.mock.calls[0]?.[1] as string
    expect(tmpContent).toContain('"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"')
    expect(tmpContent).toContain('"env":')
  })

  it('2. file exists + key=1 → idempotent no-op (no write)', async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }),
    )
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('already-enabled')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })

  it('3. file exists + key=0 → backup + flip to "1"', async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '0' } }),
    )
    const { enableAgentTeamsInSettings } = await import(
      '../../src/cli/lib/enableAgentTeamsInSettings.js'
    )
    const r = await enableAgentTeamsInSettings()
    expect(r.status).toBe('enabled')
    // 2 write calls: 1 backup + 1 atomic tmp; 1 rename for final
    expect(writeFileMock).toHaveBeenCalledTimes(2)
    expect(renameMock).toHaveBeenCalledOnce()
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
    readFileMock.mockResolvedValue(
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
