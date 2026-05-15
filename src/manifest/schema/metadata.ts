// Metadata sub-schema per ADR 0001 § Top-level structure.
// Fields: apiVersion (Literal harnessed/v1), kind (Literal Manifest),
// metadata.{name, display_name?, description, upstream{...}}.

import { Type } from '@sinclair/typebox'

export const ApiVersion = Type.Literal('harnessed/v1')
export const Kind = Type.Literal('Manifest')

// SPDX whitelist per ADR 0001 line 51.
// ADR 0010 errata — license whitelist extension (D-03/D-05). `MIT-0` (MIT No
// Attribution, SPDX-registered) added for baoyu-skills; `anthropics-official`
// carve-out added for anthropics/skills monorepo sub-skills (frontend-design /
// document-skills / webapp-testing) which have no per-skill LICENSE file.
const SpdxLicense = Type.Union([
  Type.Literal('MIT'),
  Type.Literal('Apache-2.0'),
  Type.Literal('BSD-3-Clause'),
  Type.Literal('ISC'),
  Type.Literal('0BSD'),
  Type.Literal('MIT-0'),
  Type.Literal('anthropics-official'),
])

// ADR 0010 errata — license provenance audit field (D-04). Records where the
// license info was sourced from so it can be mechanically audited. Optional —
// additive only, A7' 8-pillar safe (no existing manifest broken).
const LicenseSource = Type.Union([
  Type.Literal('README'),
  Type.Literal('registry'),
  Type.Literal('none'),
  Type.Literal('anthropics-official'),
])

const Upstream = Type.Object(
  {
    source: Type.String({ minLength: 1 }),
    homepage: Type.String({ format: 'uri' }),
    repository: Type.String({ format: 'uri' }),
    license: SpdxLicense,
    license_source: Type.Optional(LicenseSource),
    notice: Type.String({ minLength: 1, maxLength: 500 }),
  },
  { additionalProperties: false },
)

export const MetadataSchema = Type.Object(
  {
    name: Type.String({ pattern: '^[a-z0-9][a-z0-9-]*$', minLength: 1 }),
    display_name: Type.Optional(Type.String()),
    description: Type.String({ minLength: 1, maxLength: 120 }),
    upstream: Upstream,
  },
  { additionalProperties: false },
)
