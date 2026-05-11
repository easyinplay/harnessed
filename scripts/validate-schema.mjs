#!/usr/bin/env node
// Validate the published JSON Schema artifact (schemas/manifest.v1.schema.json)
// against Ajv in strict mode. Fails (exit 1) if Ajv refuses to compile it —
// catching schema-level bugs (unknown keywords, malformed discriminator, dangling
// $ref, etc.) before npm publish.
//
// Per ADR 0001 § "CI 严格 enforce" + GA-1 § CI 集成方式 (acceptance bar A5):
// `pnpm validate:schema` exit 0 == phase 1.1 A5 passed.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// Use Ajv 2020 entry: schemas/manifest.v1.schema.json declares
// `$schema: draft/2020-12`, so default Ajv (draft-07) refuses it. The 2020
// entry registers the draft-2020-12 metaschema so strict compile succeeds.
import Ajv2020 from 'ajv/dist/2020.js'
import * as ajvFormatsNs from 'ajv-formats'

// CJS interop under verbatimModuleSyntax (F9): ajv-formats has no named export.
// Same trick for ajv/dist/2020 (default-only export).
const Ajv = /** @type {typeof import('ajv').default} */ (
  /** @type {{default: typeof import('ajv').default}} */ (/** @type {unknown} */ (Ajv2020))
    .default ?? Ajv2020
)
const addFormats = /** @type {(a: InstanceType<typeof Ajv>) => InstanceType<typeof Ajv>} */ (
  /** @type {{default: (a: InstanceType<typeof Ajv>) => InstanceType<typeof Ajv>}} */ (
    /** @type {unknown} */ (ajvFormatsNs)
  ).default
)

const SCHEMA_PATH = resolve('schemas/manifest.v1.schema.json')

if (!existsSync(SCHEMA_PATH)) {
  console.error(
    `[validate-schema] missing ${SCHEMA_PATH}. Run \`pnpm build && pnpm build:schema\` first.`,
  )
  process.exit(1)
}

const raw = readFileSync(SCHEMA_PATH, 'utf8')

let parsed
try {
  parsed = JSON.parse(raw)
} catch (err) {
  console.error(`[validate-schema] JSON parse failed: ${err.message}`)
  process.exit(1)
}

// Same Ajv config as src/manifest/validate.ts: strict everywhere + discriminator
// + allErrors so any breach surfaces here before reaching consumers.
const ajv = addFormats(
  new Ajv({
    strict: true,
    strictSchema: true,
    strictTypes: true,
    strictRequired: true,
    allErrors: true,
    discriminator: true,
    allowUnionTypes: false,
  }),
)

try {
  ajv.compile(parsed)
} catch (err) {
  console.error(`[validate-schema] Ajv strict compile FAILED: ${err.message}`)
  process.exit(1)
}

console.log(
  `[validate-schema] OK — ${SCHEMA_PATH} is a valid JSON Schema (Ajv 8 strict + discriminator).`,
)
