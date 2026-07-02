// v4.15.1 T4 — checkWinBash 与 resolveBash 单一 SoT:doctor 报告的就是 spawnCmd
// 真正会用的 bash;WSL stub 场景三态(fail / warn / pass)+ 乱码消毒。
// 决定性:resetBashResolutionCache(override) 钉住 resolution,不探测真机。

import { afterEach, describe, expect, it } from 'vitest'
import { checkWinBash } from '../../src/cli/lib/check-builtin.js'
import { resetBashResolutionCache } from '../../src/installers/lib/resolveBash.js'

const WIN = process.platform === 'win32'
const d = WIN ? describe : describe.skip

afterEach(() => resetBashResolutionCache())

d('checkWinBash (v4.15.1, win32-only assertions)', () => {
  it('WSL-stub-only PATH → fail with sanitized message + HARNESSED_BASH hint', () => {
    resetBashResolutionCache({
      path: null,
      source: 'path',
      reason: 'wsl-only',
      wslOnPath: 'C:\\Windows\\System32\\bash.exe',
    })
    const r = checkWinBash()
    expect(r.status).toBe('fail')
    expect(r.message).toContain('WSL stub')
    expect(r.fix).toContain('HARNESSED_BASH')
  })

  it('PATH-first is WSL but Git Bash resolved elsewhere → warn (not fail)', () => {
    resetBashResolutionCache({
      path: 'C:\\Program Files\\Git\\bin\\bash.exe',
      source: 'standard-location',
      wslOnPath: 'C:\\Windows\\System32\\bash.exe',
    })
    const r = checkWinBash()
    expect(r.status).toBe('warn')
    expect(r.message).toContain('harnessed resolved Git Bash')
    expect(r.fix).toContain('reorder PATH')
  })

  it('clean Git Bash → pass with resolved path + source', () => {
    resetBashResolutionCache({ path: 'C:\\Git\\bin\\bash.exe', source: 'path' })
    const r = checkWinBash()
    expect(r.status).toBe('pass')
    expect(r.message).toContain('C:\\Git\\bin\\bash.exe')
  })

  it('sanitizes mojibake in embedded tool output (CP936 WSL error case)', () => {
    resetBashResolutionCache({
      path: null,
      source: 'path',
      reason: 'wsl-only',
      wslOnPath: '适用于�� Linux �的 Windows',
    })
    const r = checkWinBash()
    // Non-printable/CJK stripped — only printable ASCII survives.
    expect(r.message).toContain('Linux')
    expect(r.message).not.toContain('�')
    expect(r.message).not.toContain('适')
  })
})
