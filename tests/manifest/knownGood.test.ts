// Phase 3.3 W1 T1.12 — knownGood.ts loader functional fixtures (5 cells).
// Sister tests/manifest/aliases.test.ts pattern (tmpdir + cwd + vi.resetModules
// per cell; per-version Map cache cleared via fresh module instance).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origCwd: string

beforeEach(() => {
  origCwd = process.cwd()
  tmpRoot = mkdtempSync(join(tmpdir(), 'kg-test-'))
  mkdirSync(join(tmpRoot, 'versions'), { recursive: true })
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterEach(() => {
  process.chdir(origCwd)
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('knownGood.ts — loader + pinned-version lookup (T1.12 fixtures 1-5)', () => {
  it('1. file missing → loadKnownGood returns null (fail-soft)', async () => {
    const mod = await import('../../src/manifest/knownGood.js')
    expect(mod.loadKnownGood('0.3.0')).toBeNull()
  })

  it('2. empty upstreams: [] → loadKnownGood valid + getPinnedVersion returns null', async () => {
    writeFileSync(
      join(tmpRoot, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'
upstreams: []
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/knownGood.js')
    expect(mod.loadKnownGood('0.3.0')?.upstreams).toEqual([])
    expect(mod.getPinnedVersion('ctx7', '0.3.0')).toBeNull()
  })

  it('3. 3-entry upstreams → getPinnedVersion hit returns version string', async () => {
    writeFileSync(
      join(tmpRoot, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'
upstreams:
  - name: ctx7
    version: '7.2.0'
    install_method: npm-cli
  - name: gstack
    version: '1.5.0'
    install_method: npm-cli
  - name: claude-agent-sdk
    version: '0.3.142'
    install_method: npm-cli
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/knownGood.js')
    expect(mod.getPinnedVersion('ctx7', '0.3.0')).toBe('7.2.0')
    expect(mod.getPinnedVersion('gstack', '0.3.0')).toBe('1.5.0')
  })

  it('4. unknown upstream → getPinnedVersion returns null', async () => {
    writeFileSync(
      join(tmpRoot, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'
upstreams:
  - name: ctx7
    version: '7.2.0'
    install_method: npm-cli
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/knownGood.js')
    expect(mod.getPinnedVersion('nonexistent-pkg', '0.3.0')).toBeNull()
  })

  it('5. schema drift (malicious harnessed_version) → throws fail-loud', async () => {
    writeFileSync(
      join(tmpRoot, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: 'rm -rf /'
e2e_verified_at: '2026-05-17'
upstreams: []
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/knownGood.js')
    expect(() => mod.loadKnownGood('0.3.0')).toThrow(/schema invalid/)
  })
})
