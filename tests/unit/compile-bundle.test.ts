// B2 T1 — 资产 bundle 生成器(scripts/build-binary.mjs 的纯逻辑核,TDD 先红)。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ASSET_DIRS, ASSET_FILES, collectAssets } from '../../src/compile/bundleAssets.js'

function scaffold(): string {
  const root = mkdtempSync(join(tmpdir(), 'hb2-bundle-'))
  mkdirSync(join(root, 'workflows', 'qa'), { recursive: true })
  writeFileSync(join(root, 'workflows', 'qa', 'SKILL.md'), '# qa\n')
  mkdirSync(join(root, 'manifests', 'tools'), { recursive: true })
  writeFileSync(join(root, 'manifests', 'tools', 'a.yaml'), 'name: a\n')
  mkdirSync(join(root, 'messages'))
  writeFileSync(join(root, 'messages', 'en.json'), '{"k":"v"}\n')
  writeFileSync(join(root, 'CHANGELOG.md'), '# changelog\n')
  return root
}

const roots: string[] = []
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true })
})

describe('collectAssets (B2 T1)', () => {
  it('walks ASSET_DIRS + ASSET_FILES into a v1 bundle with posix relPaths and base64 content', () => {
    const root = scaffold()
    roots.push(root)
    const b = collectAssets(root, '9.9.9')
    expect(b.schema).toBe('harnessed.assets-bundle.v1')
    expect(b.version).toBe('9.9.9')
    // 3 files under dirs + CHANGELOG.md = 4; absent dirs (routing/…) are skipped silently.
    expect(b.fileCount).toBe(4)
    expect(Object.keys(b.files)).toHaveLength(4)
    // posix separators — never backslashes (bundle is cross-platform).
    expect(b.files['workflows/qa/SKILL.md']).toBeDefined()
    expect(Object.keys(b.files).some((k) => k.includes('\\'))).toBe(false)
    expect(Buffer.from(b.files['workflows/qa/SKILL.md'] as string, 'base64').toString('utf8')).toBe(
      '# qa\n',
    )
    expect(b.files['CHANGELOG.md']).toBeDefined()
  })

  it('asset set constants cover the runtime consumers (workflows/manifests/messages/routing/config-templates/schemas/bin + CHANGELOG.md)', () => {
    expect([...ASSET_DIRS]).toEqual([
      'workflows',
      'manifests',
      'messages',
      'routing',
      'config-templates',
      'schemas',
      'bin',
    ])
    expect([...ASSET_FILES]).toEqual(['CHANGELOG.md'])
  })

  it('throws when the workflows dir is missing (a bundle without workflows can never satisfy the unpack presence probe)', () => {
    const root = mkdtempSync(join(tmpdir(), 'hb2-bundle-empty-'))
    roots.push(root)
    expect(() => collectAssets(root, '1.0.0')).toThrow(/workflows/)
  })
})
