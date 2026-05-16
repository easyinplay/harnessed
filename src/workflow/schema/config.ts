// src/workflow/schema/config.ts — Phase 3.2 W1 T1.2 (D-01 PROBE 9th surface).
// Sister Phase 3.1 W1 T1.2 (currentWorkflow.v1.ts TypeBox shape direct analog).
// Stores gstack_prefix from doctor 6th check (probe-gstack.ts) for JINJA vars
// source consumed by src/workflow/run.ts → loadPhases interpolate step.
// Path divergence from PATTERNS § 2.4 documented in W0.3-schema-decision.md
// (Karpathy colocation rule — primary consumers are workflow/* modules).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const ConfigV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.config), // 'harnessed.config.v1'
    gstack_prefix: Type.Union([Type.Literal('gstack-'), Type.Literal('')]),
  },
  { additionalProperties: false },
)

export type ConfigV1Type = Static<typeof ConfigV1>
