// v3.4.0 NEW — enableUserLangInSettings fixture (sister enableAgentTeams
// v3.3.1 pattern, Q-AUDIT-5b LOCKED root-level env.* schema preserved).
//
// Covers:
//   1. detected zh + file missing → create with HARNESSED_USER_LANG=zh-Hans
//   2. detected en + file missing → create with HARNESSED_USER_LANG=en
//   3. existing key set + no override → idempotent no-op (respect user override)
//   4. existing key set + explicit override → backup + overwrite
//   5. file exists missing key → backup + merge (non-destructive)
//   6. malformed JSON → warn + skip
//   7. write fail (permission) → warn + skip
//   8. detectUserLang() ko/ja/fr → 'en' (universal default)
//   9. detectUserLang() zh-TW / zh-HK → 'zh-Hans'

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

const ENV_KEYS = ['HARNESSED_LANG', 'LC_ALL', 'LANG', 'LANGUAGE'] as const
const savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  readFileMock.mockReset()
  writeFileMock.mockReset()
  renameMock.mockReset()
  mkdirMock.mockReset()
  mkdirMock.mockResolvedValue(undefined as never)
  writeFileMock.mockResolvedValue(undefined as never)
  renameMock.mockResolvedValue(undefined as never)
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  vi.restoreAllMocks()
})

describe('enableUserLangInSettings — v3.4.0', () => {
  it('1. detected zh + file missing → create with HARNESSED_USER_LANG=zh-Hans', async () => {
    process.env.LANG = 'zh_CN.UTF-8'
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('created')
    if (r.status === 'created') expect(r.detected).toBe('zh-Hans')
    const tmpContent = writeFileMock.mock.calls[0]?.[1] as string
    expect(tmpContent).toContain('"HARNESSED_USER_LANG": "zh-Hans"')
  })

  it('2. detected en + file missing → create with HARNESSED_USER_LANG=en', async () => {
    process.env.LANG = 'en_US.UTF-8'
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('created')
    if (r.status === 'created') expect(r.detected).toBe('en')
    const tmpContent = writeFileMock.mock.calls[0]?.[1] as string
    expect(tmpContent).toContain('"HARNESSED_USER_LANG": "en"')
  })

  it('3. existing key set + no override → idempotent no-op (respect user)', async () => {
    process.env.LANG = 'zh_CN.UTF-8'
    readFileMock.mockResolvedValue(JSON.stringify({ env: { HARNESSED_USER_LANG: 'en' } }))
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('already-set')
    if (r.status === 'already-set') expect(r.existing).toBe('en')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })

  it('4. existing key + explicit override → backup + overwrite', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ env: { HARNESSED_USER_LANG: 'en' } }))
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings('zh-CN')
    expect(r.status).toBe('enabled')
    if (r.status === 'enabled') expect(r.detected).toBe('zh-Hans')
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    const content = finalWrite?.[1] as string
    expect(content).toContain('"HARNESSED_USER_LANG": "zh-Hans"')
  })

  it('5. file exists missing key → backup + merge non-destructive', async () => {
    process.env.LANG = 'en_US.UTF-8'
    readFileMock.mockResolvedValue(
      JSON.stringify({
        env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1', SOME_OTHER_VAR: 'preserved' },
        hooks: { keep: true },
      }),
    )
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('enabled')
    if (r.status === 'enabled') expect(r.detected).toBe('en')
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    const content = finalWrite?.[1] as string
    expect(content).toContain('"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"')
    expect(content).toContain('"SOME_OTHER_VAR": "preserved"')
    expect(content).toContain('"hooks":')
    expect(content).toContain('"keep": true')
    expect(content).toContain('"HARNESSED_USER_LANG": "en"')
  })

  it('6. malformed JSON → warn + skip', async () => {
    readFileMock.mockResolvedValue('{ invalid json [[[')
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('warn')
    expect(writeFileMock).not.toHaveBeenCalled()
    if (r.status === 'warn') {
      expect(r.message).toMatch(/malformed JSON/i)
    }
  })

  it('7. write fail (permission) → warn + skip', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    writeFileMock.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
    const { enableUserLangInSettings } = await import(
      '../../src/cli/lib/enableUserLangInSettings.js'
    )
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('warn')
    if (r.status === 'warn') {
      expect(r.message).toMatch(/EPERM|write.*failed/i)
    }
  })

  it('8. detectUserLang() — ko / ja / fr → en universal default', async () => {
    const { detectUserLang } = await import('../../src/cli/lib/enableUserLangInSettings.js')
    process.env.LANG = 'ko_KR.UTF-8'
    expect(detectUserLang()).toBe('en')
    process.env.LANG = 'ja_JP.UTF-8'
    expect(detectUserLang()).toBe('en')
    process.env.LANG = 'fr_FR.UTF-8'
    expect(detectUserLang()).toBe('en')
    process.env.LANG = 'de_DE.UTF-8'
    expect(detectUserLang()).toBe('en')
  })

  it('9. detectUserLang() — zh-TW / zh-HK / zh.UTF-8 all map to zh-Hans', async () => {
    const { detectUserLang } = await import('../../src/cli/lib/enableUserLangInSettings.js')
    process.env.LANG = 'zh_TW.UTF-8'
    expect(detectUserLang()).toBe('zh-Hans')
    process.env.LANG = 'zh_HK.UTF-8'
    expect(detectUserLang()).toBe('zh-Hans')
    process.env.LANG = 'zh.UTF-8'
    expect(detectUserLang()).toBe('zh-Hans')
    process.env.LANG = 'zh-Hans'
    expect(detectUserLang()).toBe('zh-Hans')
  })

  it('10. detectUserLang(override) — explicit param wins over env', async () => {
    const { detectUserLang } = await import('../../src/cli/lib/enableUserLangInSettings.js')
    process.env.LANG = 'en_US.UTF-8'
    expect(detectUserLang('zh-CN')).toBe('zh-Hans')
    process.env.LANG = 'zh_CN.UTF-8'
    expect(detectUserLang('en')).toBe('en')
    expect(detectUserLang('fr')).toBe('en') // unsupported → en fallback
  })
})
