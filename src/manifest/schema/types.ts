// Re-export inferred Manifest type + Static helper for downstream consumers.
// Per ADR 0001 — schema is SSOT; types derive from schema via TypeBox Static<>.
// The runtime ManifestSchema (used by Ajv) is a wrapped form with allOf matrix
// constraints, so we type-derive from ManifestBase (the typed object body).

import type { Static } from '@sinclair/typebox'
import type { ManifestBase } from './index.js'

export type { Static }
export type Manifest = Static<typeof ManifestBase>
