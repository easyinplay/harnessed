// Phase 3.3 W1 T1.12 — check-deprecations.ts PRIMARY helper functional fixtures
// (5 cells). Sister tests/manifest/aliases.test.ts tmpdir+cwd+vi.resetModules.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origCwd: string

beforeEach(() => {
  origCwd = process.cwd()
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-dep-'))
  mkdirSync(join(tmpRoot, 'manifests'), { recursive: true })
  process.chdir(tmpRoot)
  vi.resetModules()
})

afterEach(() => {
  process.chdir(origCwd)
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('checkDeprecations — D-02 DOCTOR-ONLY-WARN (T1.12 fixtures 1-5)', () => {
  it('1. aliases.yaml missing → pass status (no deprecated manifests)', async () => {
    const mod = await import('../../src/cli/lib/check-deprecations.js')
    const r = mod.checkDeprecations()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/no deprecated/)
  })

  it('2. empty aliases: {} → pass status', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      'schemaVersion: harnessed.aliases.v1\naliases: {}\n',
      'utf8',
    )
    const mod = await import('../../src/cli/lib/check-deprecations.js')
    expect(mod.checkDeprecations().status).toBe('pass')
  })

  it('3. 1 deprecation → warn + message contains old + new + reason', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  old-ctx7:
    redirect: ctx7
    reason: rebrand
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
      'utf8',
    )
    const mod = await import('../../src/cli/lib/check-deprecations.js')
    const r = mod.checkDeprecations()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/old-ctx7/)
    expect(r.message).toMatch(/ctx7/)
    expect(r.message).toMatch(/rebrand/)
    expect(r.fix).toMatch(/auto-redirect/)
  })

  it('4. 3 deprecations → warn + table multi-line aggregation', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  a-old:
    redirect: a-new
    reason: r1
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
  b-old:
    redirect: b-new
    reason: r2
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
    removal_date: '2026-12-31'
  c-old:
    redirect: c-new
    reason: r3
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
      'utf8',
    )
    const mod = await import('../../src/cli/lib/check-deprecations.js')
    const r = mod.checkDeprecations()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/3 deprecated/)
    expect(r.message.split('\n').length).toBeGreaterThanOrEqual(4) // header + 3 entries
    expect(r.message).toMatch(/removes 2026-12-31/) // optional removal_date surfaced
  })

  it('5. schema-invalid aliases.yaml → fail + fix hint', async () => {
    writeFileSync(
      join(tmpRoot, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  bad:
    redirect: x
    reason: drift
    since_version: '0.3.0'
    deprecation_date: 'not-iso'
`,
      'utf8',
    )
    const mod = await import('../../src/cli/lib/check-deprecations.js')
    const r = mod.checkDeprecations()
    expect(r.status).toBe('fail')
    expect(r.message).toMatch(/load error/)
    expect(r.fix).toMatch(/verify manifests\/aliases\.yaml/)
  })
})
