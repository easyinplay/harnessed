// Metadata sub-schema per ADR 0001 § Top-level structure.
// Fields: apiVersion (Literal harnessed/v1), kind (Literal Manifest),
// metadata.{name, display_name?, description, upstream{...}}.

import { Type } from '@sinclair/typebox'

export const ApiVersion = Type.Literal('harnessed/v1')
export const Kind = Type.Literal('Manifest')

// SPDX whitelist per ADR 0001 line 51.
const SpdxLicense = Type.Union([
  Type.Literal('MIT'),
  Type.Literal('Apache-2.0'),
  Type.Literal('BSD-3-Clause'),
  Type.Literal('ISC'),
  Type.Literal('0BSD'),
])

const Upstream = Type.Object(
  {
    source: Type.String({ minLength: 1 }),
    homepage: Type.String({ format: 'uri' }),
    repository: Type.String({ format: 'uri' }),
    license: SpdxLicense,
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
