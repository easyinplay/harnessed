// Re-export inferred Manifest type + Static helper for downstream consumers.
// Per ADR 0001 — schema is SSOT; types derive from schema via TypeBox Static<>.

import type { Static } from '@sinclair/typebox'
import type { ManifestSchema } from './index.js'

export type { Static }
export type Manifest = Static<typeof ManifestSchema>
