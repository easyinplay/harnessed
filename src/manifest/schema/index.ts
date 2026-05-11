// Manifest schema v1 — main entry per ADR 0001.
// Top-level: { apiVersion, kind, metadata, spec } with strict additionalProperties: false.
// Use `Static<typeof ManifestSchema>` for inferred TS type (re-exported from ./types.js).

import { Type } from '@sinclair/typebox'
import { ApiVersion, Kind, MetadataSchema } from './metadata.js'
import { SpecSchema } from './spec.js'

export const ManifestSchema = Type.Object(
  {
    apiVersion: ApiVersion,
    kind: Kind,
    metadata: MetadataSchema,
    spec: SpecSchema,
  },
  {
    additionalProperties: false,
    $id: 'https://harnessed.dev/schemas/manifest.v1.schema.json',
    title: 'harnessed Manifest v1',
    description: 'Per ADR 0001. Strict mode (additionalProperties: false everywhere).',
  },
)
