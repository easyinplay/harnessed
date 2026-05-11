// Manifest schema v1 — main entry per ADR 0001.
// Top-level: { apiVersion, kind, metadata, spec } with strict additionalProperties: false.
//
// Type × install.method matrix (ADR 0001 § 4.5) is enforced via top-level `allOf`
// with `if/then` clauses. Without this, the install discriminator only validates
// the chosen method's structure but allows e.g. `type: cli-npm` paired with
// `method: cc-plugin-marketplace` (matrix violation). Rule 2 enforcement.

import { Type } from '@sinclair/typebox'
import { ApiVersion, Kind, MetadataSchema } from './metadata.js'
import { SpecSchema } from './spec.js'

// TypeBox-typed base — drives Static<typeof ManifestBase> for the inferred
// Manifest TS type (re-exported via ./types.js).
export const ManifestBase = Type.Object(
  {
    apiVersion: ApiVersion,
    kind: Kind,
    metadata: MetadataSchema,
    spec: SpecSchema,
  },
  { additionalProperties: false },
)

// Per-type allowed install.method whitelist per ADR 0001 line 104-113.
const matrix: Record<string, string[]> = {
  'cc-plugin': ['cc-plugin-marketplace'],
  'cc-skill-pack': ['cc-plugin-marketplace', 'git-clone-with-setup', 'npx-skill-installer'],
  'mcp-npm': ['mcp-stdio-add', 'mcp-http-add'],
  'cli-npm': ['npm-cli'],
}

const matrixConstraints = Object.entries(matrix).map(([typeValue, allowedMethods]) => ({
  if: {
    type: 'object',
    properties: {
      spec: {
        type: 'object',
        properties: { type: { const: typeValue } },
        required: ['type'],
      },
    },
    required: ['spec'],
  },
  // biome-ignore lint/suspicious/noThenProperty: JSON Schema `then` keyword (conditional schemas), not a thenable.
  then: {
    type: 'object',
    properties: {
      spec: {
        type: 'object',
        properties: {
          install: {
            type: 'object',
            properties: { method: { enum: allowedMethods } },
            required: ['method'],
          },
        },
        required: ['install'],
      },
    },
    required: ['spec'],
  },
}))

// Runtime JSON Schema fed to Ajv: typed base + matrix allOf clauses + metadata.
// We spread ManifestBase (a TypeBox object that is already a valid JSON Schema)
// and append the cross-field constraints.
export const ManifestSchema = {
  ...(ManifestBase as unknown as Record<string, unknown>),
  $id: 'https://harnessed.dev/schemas/manifest.v1.schema.json',
  title: 'harnessed Manifest v1',
  description: 'Per ADR 0001. Strict mode (additionalProperties: false everywhere).',
  allOf: matrixConstraints,
}
