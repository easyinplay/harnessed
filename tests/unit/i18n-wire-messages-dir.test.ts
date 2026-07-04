// B2 T4 — messages/ 惰性接线(wireMessagesDir;D5)。
// 契约:未 wire → B1 行为逐字节不变(setup-i18n 预加载安全);wire 后该候选最优先;
// provider 抛错/目录不可读 → 回落既有候选(可用性优先)。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compiledAssetsDir } from '../../src/cli/lib/assetsRoot.js'
import { __resetForTests, setLocale, t, wireMessagesDir } from '../../src/i18n/index.js'
import { detectPlatform } from '../../src/installers/lib/platform.js'

const tmp: string[] = []
afterEach(() => {
  __resetForTests()
  for (const d of tmp.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('wireMessagesDir (B2 D5)', () => {
  it('wired provider dir wins over the package messages/ candidates', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hb2-i18n-'))
    tmp.push(dir)
    mkdirSync(join(dir, 'messages'))
    writeFileSync(
      join(dir, 'messages', 'en.json'),
      JSON.stringify({ 'setup.nothing_to_install': 'WIRED-SENTINEL' }),
    )
    __resetForTests()
    wireMessagesDir(() => join(dir, 'messages'))
    setLocale('en')
    expect(t('setup.nothing_to_install')).toBe('WIRED-SENTINEL')
  })

  it('throwing provider falls back to the packaged en table (availability first)', () => {
    __resetForTests()
    wireMessagesDir(() => {
      throw new Error('boom')
    })
    setLocale('en')
    // 真实 en 表可读 → 返回真实文案,不裸奔 key。
    expect(t('setup.nothing_to_install')).not.toBe('setup.nothing_to_install')
  })

  it('__resetForTests clears the wired provider (test isolation contract)', () => {
    wireMessagesDir(() => '/nonexistent-sentinel-dir')
    __resetForTests()
    setLocale('en')
    expect(t('setup.nothing_to_install')).not.toBe('setup.nothing_to_install')
  })
})

describe('compiledAssetsDir (B2 — entry/assetsRoot 同路径 SoT)', () => {
  it('is <stateRoot>/assets/<version>', () => {
    expect(compiledAssetsDir('1.2.3')).toBe(join(detectPlatform().stateRoot, 'assets', '1.2.3'))
  })
})
