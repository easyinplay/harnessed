// B1 T3 — i18n 内嵌 en 兜底(spike bug: compiled 模式 messages/ 落空 → t() 裸奔 key)。
// D4: 文件系统 locale json(现状)→ 读失败 → 内嵌 en → 仍缺 key → key 裸奔(末级不变)。
//
// 注意:全局 setupFiles(tests/setup-i18n.ts)会先加载真实 i18n 模块实例,静态
// import + vi.mock 拿到的是已缓存实例(mock 不生效 → 假绿)。故 vi.resetModules
// + beforeEach 动态导入,确保 fresh 实例绑定被 mock 的 node:fs。

import { beforeEach, describe, expect, it, vi } from 'vitest'

// 全部 fs 读失败 → 模拟 compiled 无资产环境。spread importOriginal 防
// mock-export-gap(i18n 只用 readFileSync,但同图其它模块可能用 node:fs 其余导出)。
vi.mock('node:fs', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs')>()
  return {
    ...real,
    readFileSync: vi.fn(() => {
      throw new Error('ENOENT (simulated compiled-no-assets)')
    }),
  }
})

type I18n = typeof import('../../src/i18n/index.js')

describe('t() embedded-en fallback when messages/ unreadable', () => {
  let i18n: I18n

  beforeEach(async () => {
    vi.resetModules()
    i18n = await import('../../src/i18n/index.js')
    i18n.__resetForTests()
  })

  it('en locale: returns real English text, NOT the raw key', () => {
    i18n.setLocale('en')
    const s = i18n.t('setup.mcp_hint')
    expect(s).not.toBe('setup.mcp_hint')
    expect(s).toContain('/mcp')
  })

  it('zh-Hans locale with unreadable files: falls through to embedded en', () => {
    i18n.setLocale('zh-Hans')
    const s = i18n.t('setup.mcp_hint')
    expect(s).not.toBe('setup.mcp_hint')
    expect(s).toContain('/mcp')
  })

  it('unknown key still degrades to raw key (末级链不变)', () => {
    i18n.setLocale('en')
    expect(i18n.t('no.such.key.b1')).toBe('no.such.key.b1')
  })

  it('interpolation works on embedded template', () => {
    i18n.setLocale('en')
    const s = i18n.t('setup.workflows_not_found', { path: 'X:\\nowhere' })
    expect(s).toContain('X:\\nowhere')
    expect(s).not.toBe('setup.workflows_not_found')
  })
})
