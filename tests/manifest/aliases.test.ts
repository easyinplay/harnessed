// Phase 3.3 W1 T1.12 — aliases.ts loader functional fixtures (5 cells).
// Sister tests/checkpoint/state.test.ts (tmpdir + cwd isolation). vi.resetModules
// per cell because loadAliases memoizes _cached (read-once-per-process semantics).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origCwd: string

beforeEach(() => {
  origCwd = process.cwd()
  tmpRoot = mkdtempSync(join(tmpdir(), 'aliases-test-'))
  mkdirSync(join(tmpRoot, 'manifests'), { recursive: true })
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterEach(() => {
  process.chdir(origCwd)
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('aliases.ts — loader + resolver functional (T1.12 fixtures 1-5)', () => {
  it('1. file missing → loadAliases returns null (fail-soft)', async () => {
    const mod = await import('../../src/manifest/aliases.js')
    expect(mod.loadAliases()).toBeNull()
  })

  it('2. empty aliases: {} record → loadAliases valid + resolveAlias returns null', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      'schemaVersion: harnessed.aliases.v1\naliases: {}\n',
      'utf8',
    )
    const mod = await import('../../src/manifest/aliases.js')
    const loaded = mod.loadAliases()
    expect(loaded?.aliases).toEqual({})
    expect(mod.resolveAlias('any-name')).toBeNull()
  })

  it('3. 1-entry aliases → resolveAlias old → new redirect', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  old-name:
    redirect: new-name
    reason: rename test
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/aliases.js')
    expect(mod.resolveAlias('old-name')).toBe('new-name')
    expect(mod.listDeprecations()).toHaveLength(1)
  })

  it('4. resolveAlias unknown name → returns null (caller ?? name fallback)', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      'schemaVersion: harnessed.aliases.v1\naliases: {}\n',
      'utf8',
    )
    const mod = await import('../../src/manifest/aliases.js')
    expect(mod.resolveAlias('nonexistent')).toBeNull()
  })

  it('5. schema drift (extra field) → loadAliases throws fail-loud Error', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  bad:
    redirect: x
    reason: drift
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
    EXTRA_TAMPER: malicious
`,
      'utf8',
    )
    const mod = await import('../../src/manifest/aliases.js')
    expect(() => mod.loadAliases()).toThrow(/schema invalid/)
  })
})
