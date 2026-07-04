// B2 T2 — 首跑解包器(compiled entry 消费;TDD 先红)。
// 判据契约:`<target>/workflows` 存在 = 已解包 — 与 computeAssetsRoot 的 presence
// probe(src/cli/lib/assetsRoot.ts)同一判据,两处注释互相交叉引用。
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { AssetsBundle } from '../../src/compile/bundleAssets.js'
import { unpackAssets } from '../../src/compile/unpackAssets.js'

const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64')

function bundle(): AssetsBundle {
  return {
    schema: 'harnessed.assets-bundle.v1',
    version: '9.9.9',
    fileCount: 2,
    files: {
      'workflows/qa/SKILL.md': b64('# qa\n'),
      'messages/en.json': b64('{"k":"v"}'),
    },
  }
}

const roots: string[] = []
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true })
})

function freshTarget(): string {
  const base = mkdtempSync(join(tmpdir(), 'hb2-unpack-'))
  roots.push(base)
  return join(base, 'assets', '9.9.9')
}

describe('unpackAssets (B2 T2)', () => {
  it('unpacks a fresh target atomically (files written, tmp dir gone) and reports fileCount', () => {
    const target = freshTarget()
    const r = unpackAssets(bundle(), target)
    expect(r).toEqual({ status: 'unpacked', fileCount: 2 })
    expect(readFileSync(join(target, 'workflows', 'qa', 'SKILL.md'), 'utf8')).toBe('# qa\n')
    expect(readFileSync(join(target, 'messages', 'en.json'), 'utf8')).toBe('{"k":"v"}')
    expect(existsSync(`${target}.unpack-tmp`)).toBe(false)
  })

  it('is idempotent — second run short-circuits on the workflows presence probe', () => {
    const target = freshTarget()
    unpackAssets(bundle(), target)
    const r2 = unpackAssets(bundle(), target)
    expect(r2.status).toBe('already')
  })

  it('replaces a corrupt target (dir exists but workflows/ probe missing)', () => {
    const target = freshTarget()
    const corrupt: AssetsBundle = {
      ...bundle(),
      fileCount: 1,
      files: { 'messages/en.json': b64('{}') },
    }
    // 先铺一个没有 workflows/ 的损坏目录(手工/中断产物)。
    expect(() => unpackAssets(corrupt, target)).not.toThrow()
    const r = unpackAssets(bundle(), target)
    expect(r.status).toBe('unpacked')
    expect(existsSync(join(target, 'workflows', 'qa', 'SKILL.md'))).toBe(true)
  })

  it('throws (and leaves no tmp) when written count mismatches bundle.fileCount', () => {
    const target = freshTarget()
    const bad = { ...bundle(), fileCount: 3 } // 声称 3,实际 2 → 完整性校验必须炸
    expect(() => unpackAssets(bad, target)).toThrow(/fileCount|integrity/i)
    expect(existsSync(`${target}.unpack-tmp`)).toBe(false)
    expect(existsSync(join(target, 'workflows'))).toBe(false)
  })

  it('rejects path-escaping relPaths (defense-in-depth on the bundle contract)', () => {
    const target = freshTarget()
    const evil: AssetsBundle = {
      ...bundle(),
      fileCount: 1,
      files: { '../evil.txt': b64('x') },
    }
    expect(() => unpackAssets(evil, target)).toThrow(/escape|outside|relPath/i)
  })
})
