// v3.4.0 NEW — unit tests for src/i18n/index.ts.
//
// Locale matching policy (v3.4.0 LOCKED):
//   - `zh*` (zh-CN / zh-Hans / zh-TW / zh.UTF-8 / etc.) → 'zh-Hans'
//   - Any other input (en / ko / ja / fr / de / es / etc.) → 'en'
//
// Covers: locale detect (env / Intl / fallback) + setLocale override +
// fallback chain on missing keys + `{{param}}` interpolation + 7+ locale
// matrix (zh-CN / zh-TW / ko / ja / fr / en / undefined).

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { __resetForTests, getLocale, setLocale, t } from '../../src/i18n/index.js'

// Snapshot + restore env vars touched by these tests so we don't leak state.
const ENV_KEYS = ['HARNESSED_LANG', 'LC_ALL', 'LANG', 'LANGUAGE'] as const
const savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  __resetForTests()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  __resetForTests()
})

describe('i18n — locale detection (zh* → zh-Hans, else → en)', () => {
  it('cell 1 — no env vars + Intl fallback → en (universal default)', () => {
    // With no env vars set, Intl.DateTimeFormat returns OS locale; on most CI
    // runners that is en-US which maps to 'en'. On a Chinese-locale dev box it
    // would map to 'zh-Hans'. Either way the supported set is {en, zh-Hans}.
    const locale = getLocale()
    expect(['en', 'zh-Hans']).toContain(locale)
  })

  it('cell 2 — HARNESSED_LANG=zh wins over LANG=en_US', () => {
    process.env.HARNESSED_LANG = 'zh'
    process.env.LANG = 'en_US.UTF-8'
    expect(getLocale()).toBe('zh-Hans')
  })

  it('cell 3 — LANG=zh_CN.UTF-8 detected as zh-Hans', () => {
    process.env.LANG = 'zh_CN.UTF-8'
    expect(getLocale()).toBe('zh-Hans')
  })

  it('cell 4 — LANG=zh_TW.UTF-8 detected as zh-Hans (all zh variants → zh-Hans)', () => {
    process.env.LANG = 'zh_TW.UTF-8'
    expect(getLocale()).toBe('zh-Hans')
  })

  it('cell 5 — LANG=ko_KR.UTF-8 → en (Korean has no translation, universal default)', () => {
    process.env.LANG = 'ko_KR.UTF-8'
    expect(getLocale()).toBe('en')
  })

  it('cell 6 — LANG=ja_JP.UTF-8 → en (Japanese has no translation)', () => {
    process.env.LANG = 'ja_JP.UTF-8'
    expect(getLocale()).toBe('en')
  })

  it('cell 7 — LANG=fr_FR.UTF-8 → en (French has no translation)', () => {
    process.env.LANG = 'fr_FR.UTF-8'
    expect(getLocale()).toBe('en')
  })

  it('cell 8 — LANG=en_GB.UTF-8 detected as en', () => {
    process.env.LANG = 'en_GB.UTF-8'
    expect(getLocale()).toBe('en')
  })

  it('cell 9 — LC_ALL takes priority over LANG', () => {
    process.env.LC_ALL = 'zh_HK.UTF-8'
    process.env.LANG = 'en_US.UTF-8'
    expect(getLocale()).toBe('zh-Hans')
  })

  it('cell 10 — LANGUAGE=zh as fallback when LANG/LC_ALL absent', () => {
    process.env.LANGUAGE = 'zh'
    expect(getLocale()).toBe('zh-Hans')
  })
})

describe('i18n — setLocale override', () => {
  it('cell 11 — setLocale("en") forces en even with LANG=zh', () => {
    process.env.LANG = 'zh_CN.UTF-8'
    setLocale('en')
    expect(getLocale()).toBe('en')
  })

  it('cell 12 — setLocale("zh") forces zh-Hans even with LANG=en_US', () => {
    process.env.LANG = 'en_US.UTF-8'
    setLocale('zh')
    expect(getLocale()).toBe('zh-Hans')
  })

  it('cell 13 — setLocale("ko") falls through to en (unsupported)', () => {
    process.env.LANG = 'zh_CN.UTF-8'
    setLocale('ko')
    expect(getLocale()).toBe('en')
  })

  it('cell 14 — setLocale(undefined) is no-op (detect still runs)', () => {
    process.env.LANG = 'en_US.UTF-8'
    setLocale(undefined)
    expect(getLocale()).toBe('en')
  })
})

describe('i18n — t() translation + fallback', () => {
  it('cell 15 — en locale returns en string verbatim', () => {
    setLocale('en')
    const result = t('setup.nothing_to_install')
    expect(result).toContain('nothing to install')
  })

  it('cell 16 — zh-Hans returns English (v3.9.13 unified)', () => {
    setLocale('zh-Hans')
    const result = t('setup.nothing_to_install')
    expect(result).toContain('nothing to install')
  })

  it('cell 17 — missing key returns raw key (defensive)', () => {
    setLocale('en')
    const result = t('totally.bogus.key.does.not.exist')
    expect(result).toBe('totally.bogus.key.does.not.exist')
  })

  it('cell 18 — {{param}} interpolation works in en', () => {
    setLocale('en')
    const result = t('install.success_with_version', { name: 'foo', version: '1.2.3' })
    expect(result).toBe('installed foo@1.2.3')
  })

  it('cell 19 — interpolation works in zh-Hans (English)', () => {
    setLocale('zh-Hans')
    const result = t('install.success_with_version', { name: 'foo', version: '1.2.3' })
    expect(result).toBe('installed foo@1.2.3')
  })

  it('cell 20 — missing param leaves placeholder verbatim', () => {
    setLocale('en')
    const result = t('install.success_with_version', { name: 'foo' })
    expect(result).toBe('installed foo@{{version}}')
  })

  it('cell 21 — numeric params are coerced to string', () => {
    setLocale('en')
    const result = t('setup.dry_run.header', { count: 5, path: '/tmp/skills' })
    expect(result).toContain('5 workflow(s)')
    expect(result).toContain('/tmp/skills')
  })
})
