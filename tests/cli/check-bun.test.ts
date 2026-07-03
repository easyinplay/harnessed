// v4.16.1 T3 — bun 依赖显性化(gstack dogfood 真因:上游 setup 首查
// `command -v bun`,缺失即 exit 1;报错在 stderr 尾部曾被头部截取裁掉)。
// warn-only(bun 只是 gstack 的构建依赖,非 harnessed 核心)+ install_commands
// 供 setup 末 auto-install 消费(沿 checkJq/winget 模式)。

import { describe, expect, it } from 'vitest'
import { checkBun } from '../../src/cli/lib/check-bun.js'

describe('checkBun (v4.16.1 T3)', () => {
  it('bun on PATH → pass with resolved path', () => {
    const r = checkBun({
      platform: 'linux',
      run: () => ({ status: 0, stdout: '/usr/local/bin/bun\n' }),
    })
    expect(r.status).toBe('pass')
    expect(r.message).toContain('/usr/local/bin/bun')
  })

  it('bun missing on win32 → warn + winget install_commands', () => {
    const r = checkBun({ platform: 'win32', run: () => ({ status: 1, stdout: '' }) })
    expect(r.status).toBe('warn')
    expect(r.message).toContain('gstack')
    expect(r.install_commands).toEqual(['winget install Oven-sh.Bun'])
  })

  it('bun missing on darwin → warn + brew install_commands', () => {
    const r = checkBun({ platform: 'darwin', run: () => ({ status: 1, stdout: '' }) })
    expect(r.status).toBe('warn')
    expect(r.install_commands).toEqual(['brew install oven-sh/bun/bun'])
  })

  it('bun missing on linux → warn with fix text, NO auto-run install_commands (curl|bash)', () => {
    const r = checkBun({ platform: 'linux', run: () => ({ status: 1, stdout: '' }) })
    expect(r.status).toBe('warn')
    expect(r.install_commands).toBeUndefined()
    expect(r.fix).toContain('bun.sh')
  })

  it('probe unavailable (partial mock) → warn, never throws', () => {
    const r = checkBun({ platform: 'win32', run: () => null })
    expect(r.status).toBe('warn')
  })
})
