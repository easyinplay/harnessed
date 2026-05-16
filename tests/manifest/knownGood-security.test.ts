// Phase 3.3 W2 T2.4 — STRIDE threat model fixture (known-good.v1 security守门).
//
// 1 fixture covering T-3.3-05 (malicious version-string injection):
//
//   K1 malicious harnessed_version — known-good.yaml uses a non-semver
//      harnessed_version string ('9.9.9.invalid' OR shell-eval-like
//      'rm -rf /' literal). TypeBox KnownGoodV1.harnessed_version is
//      `Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' })` strict semver →
//      Value.Check returns false → loadKnownGood throws fail-loud per
//      Karpathy strict-schema-or-throw discipline.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface Fixture {
  cwd: string
  prevCwd: string
}

function setupFixtureCwd(): Fixture {
  const cwd = mkdtempSync(join(tmpdir(), 'phase-3.3-w2-known-good-sec-'))
  mkdirSync(join(cwd, 'versions'), { recursive: true })
  const prevCwd = process.cwd()
  process.chdir(cwd)
  return { cwd, prevCwd }
}

describe('Phase 3.3 W2 T2.4 — known-good.v1 STRIDE threat fixture (T-3.3-05)', () => {
  let fx: Fixture

  beforeEach(() => {
    fx = setupFixtureCwd()
    vi.resetModules()
  })

  afterEach(() => {
    process.chdir(fx.prevCwd)
  })

  it('K1 — malicious non-semver harnessed_version rejected fail-loud (T-3.3-05)', async () => {
    // 9.9.9.invalid: 4 dot-segments violates ^\d+\.\d+\.\d+$ strict semver
    writeFileSync(
      join(fx.cwd, 'versions', '9.9.9.invalid-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '9.9.9.invalid'
e2e_verified_at: '2026-05-17'
upstreams: []
`,
    )

    const kgMod = await import('../../src/manifest/knownGood.js')
    expect(() => kgMod.loadKnownGood('9.9.9.invalid')).toThrow(/schema invalid/)
  })

  it('K1b — shell-eval-like version string in YAML rejected fail-loud (T-3.3-05 variant)', async () => {
    // Use a valid file path but inject a shell-eval-like harnessed_version VALUE.
    // The schema validates the VALUE (not the file name) — Windows filesystem
    // forbids '/' in names so we can't actually write 'rm -rf /-known-good.yaml',
    // but the threat model concern is malicious content INSIDE the YAML.
    writeFileSync(
      join(fx.cwd, 'versions', '0.0.1-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: 'rm -rf /'
e2e_verified_at: '2026-05-17'
upstreams: []
`,
    )

    const kgMod = await import('../../src/manifest/knownGood.js')
    // loadKnownGood reads versions/0.0.1-known-good.yaml; semver pattern on the
    // YAML's harnessed_version field rejects 'rm -rf /' fail-loud.
    expect(() => kgMod.loadKnownGood('0.0.1')).toThrow(/schema invalid/)
  })
})
