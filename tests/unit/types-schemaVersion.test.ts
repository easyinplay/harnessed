// Phase 2.2 Wave 2 T2.0 — unit tests for src/types/schemaVersion.ts.
// Covers CD-5 contract: surfaces named, branch helper degrades unknown
// gracefully, TypeBox literal union accepts only known surfaces.
//
// Phase v3.0-3.3 W0 T3.3.W0.11 — 16→18 surface bump (workflow_v3 + discipline).
// v3.9.15 — 18→17 (removed plan-feature legacy surface).

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import {
  branchOnSchemaVersion,
  SCHEMA_VERSIONS,
  SchemaVersionLiteral,
} from '../../src/types/schemaVersion.js'

describe('SCHEMA_VERSIONS — 18 surfaces', () => {
  it('has exactly 18 surface entries', () => {
    expect(Object.keys(SCHEMA_VERSIONS)).toHaveLength(18)
  })

  it('every value matches `harnessed.<surface>.v<N>` shape (v1 default, v2 introduced in Phase v2.0-2.4, v3 introduced in Phase v3.0-3.3)', () => {
    for (const v of Object.values(SCHEMA_VERSIONS)) {
      expect(v).toMatch(/^harnessed\.[a-z-]+\.v[123]$/)
    }
  })

  it('values are uniqueness-locked (no duplicate surface names)', () => {
    const values = Object.values(SCHEMA_VERSIONS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('covers the 17 named surfaces', () => {
    const expectedSurfaces = [
      'routing-snapshot',
      'handoff-doc',
      'phases-yaml',
      'manifest-state',
      'installer-state',
      'route-decision-log',
      'checkpoint',
      'current-workflow',
      'config',
      'governance',
      'aliases',
      'known-good',
      'capabilities',
      'judgment',
      'workflow',
      'workflow-store',
    ]
    const actualSurfaces = Object.values(SCHEMA_VERSIONS).map((v) => v.split('.')[1])
    for (const s of expectedSurfaces) {
      expect(actualSurfaces).toContain(s)
    }
    // Phase v3.0-3.3 ADD 'discipline' 17th surface
    expect(actualSurfaces).toContain('discipline')
  })

  it('workflow.v2 + workflow.v3 both registered (Phase v2.0-2.4 + Phase v3.0-3.3)', () => {
    const v2Entries = Object.values(SCHEMA_VERSIONS).filter((v) => v.endsWith('.v2'))
    expect(v2Entries).toEqual(['harnessed.workflow.v2'])
    const v3Entries = Object.values(SCHEMA_VERSIONS).filter((v) => v.endsWith('.v3'))
    expect(v3Entries).toEqual(['harnessed.workflow.v3'])
  })

  it('discipline surface registered as harnessed.discipline.v1 (Phase v3.0-3.3 W0 T3.3.W0.11 — D-09 L0 Discipline Substrate)', () => {
    expect(SCHEMA_VERSIONS.discipline).toBe('harnessed.discipline.v1')
  })

  it('workflow_v3 surface registered as harnessed.workflow.v3 (Phase v3.0-3.3 W0 T3.3.W0.11 — D-09 + D-05 + master delegates_to per Pattern A B.1 LOCK)', () => {
    expect(SCHEMA_VERSIONS.workflow_v3).toBe('harnessed.workflow.v3')
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

  it('rejects an unregistered v2 string (future-proof — v2 must enter union explicitly)', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.routing-snapshot.v2')).toBe(false)
  })

  it('accepts `harnessed.workflow.v2` (first registered .v2 surface — Phase v2.0-2.4 W0 T2.4.W0.1)', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.workflow.v2')).toBe(true)
  })

  it('accepts `harnessed.workflow.v3` (first registered .v3 surface — Phase v3.0-3.3 W0 T3.3.W0.11)', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.workflow.v3')).toBe(true)
  })

  it('accepts `harnessed.discipline.v1` (Phase v3.0-3.3 W0 T3.3.W0.11)', () => {
    expect(Value.Check(SchemaVersionLiteral, 'harnessed.discipline.v1')).toBe(true)
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

  it('routes a known v3 value to the v1 handler (rule (a) treats all registered surfaces as known)', () => {
    const result = branchOnSchemaVersion(SCHEMA_VERSIONS.workflow_v3, {
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
