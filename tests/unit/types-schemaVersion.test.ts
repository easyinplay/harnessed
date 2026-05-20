// Phase 2.2 Wave 2 T2.0 — unit tests for src/types/schemaVersion.ts.
// Covers CD-5 contract: 7 surfaces named, branch helper degrades unknown
// gracefully, TypeBox literal union accepts only known surfaces.

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import {
  branchOnSchemaVersion,
  SCHEMA_VERSIONS,
  SchemaVersionLiteral,
} from '../../src/types/schemaVersion.js'

describe('SCHEMA_VERSIONS — 15 surfaces (B-32 + Phase 3.1 W1 T1.1 currentWorkflow + Phase 3.2 W1 T1.1 config + governance + Phase 3.3 W0 T0.5 planFeature backfill + Phase 3.3 W1 T1.1 aliases + knownGood + Phase v2.0-2.3 W0 T2.3.W0.6 capabilities + judgment)', () => {
  it('has exactly 15 surface entries', () => {
    expect(Object.keys(SCHEMA_VERSIONS)).toHaveLength(15)
  })

  it('every value matches `harnessed.<surface>.v1` shape', () => {
    for (const v of Object.values(SCHEMA_VERSIONS)) {
      expect(v).toMatch(/^harnessed\.[a-z-]+\.v1$/)
    }
  })

  it('values are uniqueness-locked (no duplicate surface names)', () => {
    const values = Object.values(SCHEMA_VERSIONS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('covers the 15 named surfaces (7 B-32 + currentWorkflow Phase 3.1 + config/governance Phase 3.2 + plan-feature Phase 3.3 W0 T0.5 backfill + aliases/knownGood Phase 3.3 W1 T1.1 + capabilities/judgment Phase v2.0-2.3 W0 T2.3.W0.6)', () => {
    const expectedSurfaces = [
      'routing-snapshot',
      'handoff-doc',
      'phases-yaml',
      'manifest-state',
      'installer-state',
      'route-decision-log',
      'checkpoint',
      'current-workflow', // ← Phase 3.1 W1 T1.1 8th surface
      'config', // ← Phase 3.2 W1 T1.1 9th surface (D-01 PROBE)
      'governance', // ← Phase 3.2 W1 T1.1 10th surface (D-04 PUSH)
      'plan-feature', // ← Phase 3.3 W0 T0.5 11th surface BACKFILL (sister Phase 3.2 W2 T2.2 b875e21 stale claim fix)
      'aliases', // ← Phase 3.3 W1 T1.1 12th surface (D-01 RICH manifests/aliases.yaml)
      'known-good', // ← Phase 3.3 W1 T1.1 13th surface (D-03 YAML versions/<harnessed-ver>-known-good.yaml)
      'capabilities', // ← Phase v2.0-2.3 W0 T2.3.W0.6 14th surface (R20.2 flat yaml capabilities manifest)
      'judgment', // ← Phase v2.0-2.3 W0 T2.3.W0.6 15th surface (R20.4 judgments triggers/rules multi-file)
    ]
    const actualSurfaces = Object.values(SCHEMA_VERSIONS).map((v) => v.split('.')[1])
    for (const s of expectedSurfaces) {
      expect(actualSurfaces).toContain(s)
    }
  })
})

describe('SchemaVersionLiteral — TypeBox accept/reject', () => {
  it('accepts every known SCHEMA_VERSIONS value', () => {
    for (const v of Object.values(SCHEMA_VERSIONS)) {
      expect(Value.Check(SchemaVersionLiteral, v)).toBe(true)
    }
  })

  it('rejects an unknown adapter-specific string', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.adapter-x.v1')).toBe(false)
  })

  it('rejects a v2 string (future-proof — v2 must enter union explicitly)', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.routing-snapshot.v2')).toBe(false)
  })
})

describe('branchOnSchemaVersion — rule (a) branch + rule (b) graceful degrade', () => {
  it('routes a known v1 value to the v1 handler', () => {
    const result = branchOnSchemaVersion(SCHEMA_VERSIONS.routingSnapshot, {
      v1: () => 'v1-branch',
      unknown: () => 'unknown-branch',
    })
    expect(result).toBe('v1-branch')
  })

  it('routes an unknown adapter-specific string to the unknown handler (graceful degrade)', () => {
    const result = branchOnSchemaVersion('harnessed.custom-adapter.v1', {
      v1: () => 'v1-branch',
      unknown: () => 'unknown-branch',
    })
    expect(result).toBe('unknown-branch')
  })

  it('routes a malformed empty string to the unknown handler (does NOT throw)', () => {
    const result = branchOnSchemaVersion('', {
      v1: () => 'v1-branch',
      unknown: () => 'unknown-branch',
    })
    expect(result).toBe('unknown-branch')
  })
})
