// Phase 3.3 W1 T1.12 — known-good.v1 TypeBox schema contract fixtures (4 cells).
// Sister tests/manifest/schema/aliases-v1.test.ts pattern.

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { KnownGoodV1 } from '../../../src/manifest/schema/known-good.v1.js'
import { SCHEMA_VERSIONS } from '../../../src/types/schemaVersion.js'

const validKnownGood = {
  schemaVersion: SCHEMA_VERSIONS.knownGood,
  harnessed_version: '0.3.0',
  e2e_verified_at: '2026-05-17',
  upstreams: [{ name: 'ctx7', version: '7.2.0', install_method: 'npm-cli' }],
}

describe('KnownGoodV1 — D-03 YAML manifest 13th surface contract (T1.12 fixtures 1-4)', () => {
  it('1. happy round-trip — valid harnessed_version + e2e_verified_at + upstreams', () => {
    expect(Value.Check(KnownGoodV1, validKnownGood)).toBe(true)
  })

  it('2. missing required harnessed_version → rejects', () => {
    const { harnessed_version: _hv, ...partial } = validKnownGood
    expect(Value.Check(KnownGoodV1, partial)).toBe(false)
  })

  it('3. extra field on outer → additionalProperties:false strict rejects', () => {
    const tampered = { ...validKnownGood, malicious_field: 'x' }
    expect(Value.Check(KnownGoodV1, tampered)).toBe(false)
  })

  it('4. invalid semver harnessed_version → rejects (rm -rf / NOT 0.3.0)', () => {
    const drift = { ...validKnownGood, harnessed_version: 'rm -rf /' }
    expect(Value.Check(KnownGoodV1, drift)).toBe(false)
  })
})
