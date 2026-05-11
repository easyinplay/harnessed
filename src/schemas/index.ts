// Re-export schemas for third-party consumers via `harnessed/schemas` exports field.
// Consumers can `import { ManifestSchema } from 'harnessed/schemas'` and feed it
// to their own Ajv instance, OR consume the standalone JSON artifact at
// `schemas/manifest.v1.schema.json` (built by `scripts/build-schema.mjs`).

export { ManifestSchema } from '../manifest/schema/index.js'
export const SCHEMA_VERSION = 'v1'
