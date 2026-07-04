// B1 T1 — assetsRoot seam (bun-compile 路线 Phase 1; spike: _spike-bun-compile).
// Pure computeAssetsRoot with injected deps; npm/dev 模式必须严格等于 packageRoot
// (D1 — 现有全量测试是等价性回归网)。

import { describe, expect, it } from 'vitest'
import { computeAssetsRoot, isCompiledModuleUrl } from '../../src/cli/lib/assetsRoot.js'

const BASE = {
  env: {} as Record<string, string | undefined>,
  moduleUrl: 'file:///D:/some/pkg/dist/cli.mjs',
  exists: (_p: string) => true,
  // thunk — 仅 compiled 分支求值(npm 路径不得触碰 detectPlatform,见 src 注释)
  stateRoot: () => 'C:\\Users\\u\\.claude\\harnessed',
  packageRoot: 'D:\\some\\pkg',
  version: '9.9.9',
}

describe('isCompiledModuleUrl (D2 — bunfs 前缀两形,spike 实测)', () => {
  it('detects unix bunfs virtual root', () => {
    expect(isCompiledModuleUrl('file:///$bunfs/root/cli.mjs')).toBe(true)
  })
  it('detects windows bunfs virtual root (B:/~BUN)', () => {
    expect(isCompiledModuleUrl('file:///B:/~BUN/root/cli.mjs')).toBe(true)
  })
  it('detects windows bunfs with backslashes', () => {
    expect(isCompiledModuleUrl('B:\\~BUN\\root\\cli.mjs')).toBe(true)
  })
  it('detects percent-encoded ~ (REAL observed form: file:///B:/%7EBUN/root/cli.exe)', () => {
    expect(isCompiledModuleUrl('file:///B:/%7EBUN/root/cli.exe')).toBe(true)
  })
  it('plain dist url is NOT compiled', () => {
    expect(isCompiledModuleUrl('file:///D:/some/pkg/dist/cli.mjs')).toBe(false)
  })
})

describe('computeAssetsRoot (D1 优先级)', () => {
  it('(1) HARNESSED_ASSETS_OVERRIDE wins verbatim', () => {
    const r = computeAssetsRoot({
      ...BASE,
      env: { HARNESSED_ASSETS_OVERRIDE: ' D:\\override\\assets ' },
    })
    expect(r.source).toBe('override')
    expect(r.root).toBe('D:\\override\\assets')
  })

  it('(2) compiled → <stateRoot>/assets/<version>, present assets → no missing flag', () => {
    const r = computeAssetsRoot({
      ...BASE,
      moduleUrl: 'file:///B:/~BUN/root/cli.mjs',
      exists: () => true,
    })
    expect(r.source).toBe('compiled')
    expect(r.root.replace(/\\/g, '/')).toBe('C:/Users/u/.claude/harnessed/assets/9.9.9')
    expect(r.compiledAssetsMissing).toBe(false)
  })

  it('(2b) compiled + assets absent → same root + compiledAssetsMissing (fail-loud 由调用方消费)', () => {
    const r = computeAssetsRoot({
      ...BASE,
      moduleUrl: 'file:///$bunfs/root/cli.mjs',
      exists: () => false,
    })
    expect(r.source).toBe('compiled')
    expect(r.compiledAssetsMissing).toBe(true)
  })

  it('(3) default npm/dev → EXACTLY packageRoot (等价性铁律)', () => {
    const r = computeAssetsRoot(BASE)
    expect(r.source).toBe('package')
    expect(r.root).toBe(BASE.packageRoot)
    expect(r.compiledAssetsMissing).toBe(false)
  })

  it('(3b) npm/dev path NEVER evaluates stateRoot thunk(部分 mock 环境下 detectPlatform 会抛)', () => {
    const r = computeAssetsRoot({
      ...BASE,
      stateRoot: () => {
        throw new Error('detectPlatform must not run on the npm path')
      },
    })
    expect(r.root).toBe(BASE.packageRoot)
  })
})
