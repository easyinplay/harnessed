// src/manifest/schema/aliases.v1.ts — Phase 3.3 W1 T1.2 (D-01 RICH 12th surface).
// Sister Phase 3.2 W1 T1.3 (governance.ts TypeBox shape direct analog).
// RICH schema rejected FLAT (失 metadata) + TIERED (Karpathy YAGNI violation).
// Manifest-domain colocation: src/manifest/schema/ (sister spec.ts + metadata.ts
// existing manifest-domain schemas). Per W0.3 decision doc colocation rule.
// ISO-date `pattern` NOT `format: 'date'` (Phase 3.2 W2 Rule 1 lesson:
// FormatRegistry.Set not registered project-wide; `pattern` is zero-config
// equivalent + sister governance.ts vetoed_at pattern precedent).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const AliasEntryV1 = Type.Object(
  {
    redirect: Type.String({ minLength: 1 }),
    reason: Type.String({ minLength: 1, maxLength: 500 }), // DOS cap sister governance.ts
    since_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }), // semver strict
    deprecation_date: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), // ISO-date Phase 3.2 W2 Rule 1
    removal_date: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })), // optional long-tail window
  },
  { additionalProperties: false },
)

export const AliasesV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.aliases), // 'harnessed.aliases.v1'
    aliases: Type.Record(Type.String({ minLength: 1 }), AliasEntryV1),
  },
  { additionalProperties: false },
)

export type AliasEntryV1Type = Static<typeof AliasEntryV1>
export type AliasesV1Type = Static<typeof AliasesV1>
