// src/workflow/schema/governance.ts — Phase 3.2 W1 T1.3 (D-04 PUSH 10th surface).
// Sister Phase 3.1 W1 T1.2 (checkpoint.v1.ts TypeBox Union shape direct analog).
// gstack writes .harnessed/governance.json (NOT harnessed scope per D-04);
// harnessed reads lazy-once per workflow phase boundary (NOT polling — sister
// Phase 2.4 SSE polling anti-pattern lesson). Threat mitigation (RESEARCH §
// 11.4): maxLength caps prevent DOS; fixed path prevents traversal; TypeBox
// strict prevents schema drift (graceful null via branchOnSchemaVersion CD-5).
// Path divergence from PATTERNS § 2.4 in W0.3-schema-decision.md (colocation).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

/** 2-state governance status (D-04 PUSH lock). gstack writes 'vetoed' to halt
 *  harnessed workflow execution at next phase boundary. */
export const GovernanceStatus = Type.Union([Type.Literal('active'), Type.Literal('vetoed')])

export const GovernanceV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance), // 'harnessed.governance.v1'
    status: GovernanceStatus,
    reason: Type.Optional(Type.String({ maxLength: 500 })), // DOS cap per RESEARCH § 11.4
    // ISO-8601 date-time regex (Phase 3.2 W2 Rule 1 fix — TypeBox `format: 'date-time'`
    // requires FormatRegistry.Set which is not registered project-wide; using
    // `pattern` is zero-config equivalent. Sister checkpoint.v1 uses ISO pattern too.).
    vetoed_at: Type.Optional(
      Type.String({
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$',
      }),
    ),
    vetoed_by: Type.Optional(Type.String({ maxLength: 100 })), // e.g. 'CEO' (gstack role)
  },
  { additionalProperties: false },
)

export type GovernanceV1Type = Static<typeof GovernanceV1>
