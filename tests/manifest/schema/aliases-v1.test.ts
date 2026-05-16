// Phase 3.3 W1 T1.12 — aliases.v1 TypeBox schema contract fixtures (4 cells).
// Sister tests/checkpoint/schema.test.ts (TypeBox Value.Check + happy + reject
// missing required + reject additionalProperties + reject invalid pattern).

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { AliasesV1 } from '../../../src/manifest/schema/aliases.v1.js'
import { SCHEMA_VERSIONS } from '../../../src/types/schemaVersion.js'

const validEntry = {
  redirect: 'new-ctx7',
  reason: 'upstream renamed (v2.0 rebrand)',
  since_version: '0.3.0',
  deprecation_date: '2026-05-17',
  removal_date: '2026-12-31',
}

const validAliases = {
  schemaVersion: SCHEMA_VERSIONS.aliases,
  aliases: { 'old-ctx7': validEntry },
}

describe('AliasesV1 — D-01 RICH 12th surface contract (T1.12 fixtures 1-4)', () => {
  it('1. happy round-trip — full RICH entry passes Value.Check', () => {
    expect(Value.Check(AliasesV1, validAliases)).toBe(true)
  })

  it('2. missing required since_version → Value.Check rejects', () => {
    const { since_version: _sv, ...partial } = validEntry
    const drift = { ...validAliases, aliases: { 'old-ctx7': partial } }
    expect(Value.Check(AliasesV1, drift)).toBe(false)
  })

  it('3. extra field on entry → additionalProperties:false strict rejects', () => {
    const tampered = {
      ...validAliases,
      aliases: { 'old-ctx7': { ...validEntry, malicious_field: 'x' } },
    }
    expect(Value.Check(AliasesV1, tampered)).toBe(false)
  })

  it('4. invalid ISO-date pattern on deprecation_date → rejects (Phase 3.2 W2 Rule 1)', () => {
    const drift = {
      ...validAliases,
      aliases: { 'old-ctx7': { ...validEntry, deprecation_date: 'not-a-date' } },
    }
    expect(Value.Check(AliasesV1, drift)).toBe(false)
  })
})
