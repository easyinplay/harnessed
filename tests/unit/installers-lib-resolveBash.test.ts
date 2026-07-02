// v4.15.1 T1 — resolveBash: Windows Git-Bash 显式解析(WSL stub 根因修复)。
//
// 用户 dogfood(v4.15.0, easyinplay 机):PATH 上 bash = C:\Windows\System32\bash.exe
// (WSL stub,无发行版)→ 全部 posixShell verify exit 1。resolveBash 必须绕过 PATH
// 顺序:env 覆盖 → where git 派生 → 标准位置 → PATH 非 WSL 项 → WSL-only 拒绝。
//
// 测试策略:注入 deps(spawnSyncImpl / existsImpl / env)驱动每个分支,不依赖
// 本机真实 Git 安装路径;memoize 通过 resetBashResolutionCache 隔离。

import { beforeEach, describe, expect, it } from 'vitest'
import {
  type ResolveBashDeps,
  resetBashResolutionCache,
  resolveBash,
} from '../../src/installers/lib/resolveBash.js'

function deps(over: Partial<ResolveBashDeps> = {}): ResolveBashDeps {
  return {
    platform: 'win32',
    env: {},
    where: () => [],
    exists: () => false,
    // v4.15.2 — default probe 'unknown' in tests: candidates are fake paths, the
    // real spawnSync probe would ENOENT on them (=null anyway); explicit here so
    // pre-4.15.2 cases stay deterministic on all 3 CI OSes.
    probe: () => null,
    ...over,
  }
}

describe('resolveBash (v4.15.1 T1)', () => {
  beforeEach(() => resetBashResolutionCache())

  it('HARNESSED_BASH env override wins verbatim', () => {
    const r = resolveBash(deps({ env: { HARNESSED_BASH: 'D:\\tools\\bash.exe' } }))
    expect(r.path).toBe('D:\\tools\\bash.exe')
    expect(r.source).toBe('env')
  })

  it('derives Git Bash from `where git` (<gitroot>\\bin\\bash.exe)', () => {
    const r = resolveBash(
      deps({
        where: (name) => (name === 'git' ? ['C:\\Program Files\\Git\\cmd\\git.exe'] : []),
        exists: (p) => p === 'C:\\Program Files\\Git\\bin\\bash.exe',
      }),
    )
    expect(r.path).toBe('C:\\Program Files\\Git\\bin\\bash.exe')
    expect(r.source).toBe('git-derived')
  })

  it('falls back to standard install locations when git not on PATH', () => {
    const r = resolveBash(
      deps({
        env: { ProgramFiles: 'C:\\Program Files' },
        exists: (p) => p === 'C:\\Program Files\\Git\\bin\\bash.exe',
      }),
    )
    expect(r.path).toBe('C:\\Program Files\\Git\\bin\\bash.exe')
    expect(r.source).toBe('standard-location')
  })

  it('picks the first non-WSL bash from PATH, skipping System32 stub', () => {
    const r = resolveBash(
      deps({
        where: (name) =>
          name === 'bash'
            ? ['C:\\Windows\\System32\\bash.exe', 'C:\\msys64\\usr\\bin\\bash.exe']
            : [],
      }),
    )
    expect(r.path).toBe('C:\\msys64\\usr\\bin\\bash.exe')
    expect(r.source).toBe('path')
    expect(r.wslOnPath).toBe('C:\\Windows\\System32\\bash.exe')
  })

  it('PATH has ONLY the WSL stub → path null + reason wsl-only (refuse, never spawn WSL)', () => {
    const r = resolveBash(
      deps({
        where: (name) => (name === 'bash' ? ['C:\\Windows\\System32\\bash.exe'] : []),
      }),
    )
    expect(r.path).toBeNull()
    expect(r.reason).toBe('wsl-only')
    expect(r.wslOnPath).toBe('C:\\Windows\\System32\\bash.exe')
  })

  it('nothing resolvable at all → legacy literal `bash` fallback (pre-4.15.1 behavior)', () => {
    const r = resolveBash(deps())
    expect(r.path).toBe('bash')
    expect(r.source).toBe('path-fallback')
  })

  it('memoizes: second call returns cached result without re-probing', () => {
    let calls = 0
    const d = deps({
      where: (name) => {
        calls++
        return name === 'bash' ? ['C:\\Git\\bin\\bash.exe'] : []
      },
    })
    resolveBash(d)
    const before = calls
    resolveBash(d)
    expect(calls).toBe(before)
  })

  it('non-win32 platform → not applicable (path null, reason not-applicable)', () => {
    const r = resolveBash(deps({ platform: 'linux' }))
    expect(r.path).toBeNull()
    expect(r.reason).toBe('not-applicable')
  })
})

// v4.15.2 T1 — Microsoft Store WSL app alias + functional probe.
// 用户 dogfood(v4.15.1, 同机):PATH bash = C:\Users\<u>\AppData\Local\Microsoft\
// WindowsApps\bash.exe(Store WSL 别名)— 4.15.1 的 WSL_STUB_RE 只匹配 System32/
// Sysnative/SysWOW64,该别名在第 2 步被采纳;doctor 同步误报 "(Git Bash / native)"。
describe('resolveBash (v4.15.2 T1 — WindowsApps alias + functional probe)', () => {
  const WINAPPS = 'C:\\Users\\u\\AppData\\Local\\Microsoft\\WindowsApps\\bash.exe'

  beforeEach(() => resetBashResolutionCache())

  it('rejects the Microsoft Store WSL app alias (WindowsApps\\bash.exe) as PATH-first', () => {
    const r = resolveBash(
      deps({
        where: (name) =>
          name === 'bash' ? [WINAPPS] : name === 'git' ? ['C:\\Git\\cmd\\git.exe'] : [],
        exists: (p) => p === 'C:\\Git\\bin\\bash.exe',
      }),
    )
    expect(r.path).toBe('C:\\Git\\bin\\bash.exe')
    expect(r.source).toBe('git-derived')
    expect(r.wslOnPath).toBe(WINAPPS)
  })

  it('WindowsApps alias only + nothing else → refuse (wsl-only), never spawn it', () => {
    const r = resolveBash(deps({ where: (name) => (name === 'bash' ? [WINAPPS] : []) }))
    expect(r.path).toBeNull()
    expect(r.reason).toBe('wsl-only')
    expect(r.wslOnPath).toBe(WINAPPS)
  })

  it('a PATH-first bash that FAILS the functional probe is skipped (unknown stub location)', () => {
    const r = resolveBash(
      deps({
        where: (name) =>
          name === 'bash'
            ? ['C:\\weird\\bash.exe']
            : name === 'git'
              ? ['C:\\Git\\cmd\\git.exe']
              : [],
        exists: (p) => p === 'C:\\Git\\bin\\bash.exe',
        probe: (p) => p !== 'C:\\weird\\bash.exe',
      }),
    )
    expect(r.path).toBe('C:\\Git\\bin\\bash.exe')
    expect(r.source).toBe('git-derived')
  })

  it('ALL candidates fail the probe while bash IS on PATH → refuse (wsl-only)', () => {
    const r = resolveBash(
      deps({
        where: (name) => (name === 'bash' ? ['C:\\weird\\bash.exe'] : []),
        probe: () => false,
      }),
    )
    expect(r.path).toBeNull()
    expect(r.reason).toBe('wsl-only')
  })

  it('probe unknown (null — spawnSync unavailable/ENOENT) accepts the candidate', () => {
    const r = resolveBash(
      deps({
        where: (name) => (name === 'bash' ? ['C:\\msys64\\usr\\bin\\bash.exe'] : []),
        probe: () => null,
      }),
    )
    expect(r.path).toBe('C:\\msys64\\usr\\bin\\bash.exe')
  })

  it('HARNESSED_BASH env override is trusted verbatim — probe NOT consulted', () => {
    let probed = 0
    const r = resolveBash(
      deps({
        env: { HARNESSED_BASH: 'D:\\tools\\bash.exe' },
        probe: () => {
          probed++
          return false
        },
      }),
    )
    expect(r.path).toBe('D:\\tools\\bash.exe')
    expect(probed).toBe(0)
  })
})
