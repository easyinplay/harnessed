#!/usr/bin/env node
// Build the standalone JSON Schema artifact from the in-source TypeBox definition.
//
// Reads the runtime ManifestSchema object (already a valid JSON Schema thanks to
// TypeBox + the matrix allOf clauses appended in src/manifest/schema/index.ts)
// and writes it to schemas/manifest.v1.schema.json with a draft-2020-12 $schema
// preamble so VS Code yaml-language-server / SchemaStore can consume it directly.
//
// Per ADR 0001 § "JSON Schema 文件可独立 publish" + GA-1 § CI 集成方式.
// Pure ESM JS: no tsx / ts-node dependency (T5 acceptance, karpathy simplicity).
// Source resolution: imports from compiled `dist/schemas/index.mjs` so this script
// stays free of the ts strip-types path-suffix issue. Run `pnpm build` first.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIST_ENTRY = resolve('dist/schemas/index.mjs')
const OUT = 'schemas/manifest.v1.schema.json'

if (!existsSync(DIST_ENTRY)) {
  console.error(
    `[build-schema] missing ${DIST_ENTRY}. Run \`pnpm build\` first so the schema entry is compiled.`,
  )
  process.exit(1)
}

const { ManifestSchema } = await import(pathToFileURL(DIST_ENTRY).href)

if (!ManifestSchema || typeof ManifestSchema !== 'object') {
  console.error('[build-schema] ManifestSchema export is missing or not an object.')
  process.exit(1)
}

// ManifestSchema already carries $id / title / description (set in
// src/manifest/schema/index.ts). We only inject the draft-2020-12 $schema
// preamble for IDE consumers. Order: $schema first, then existing fields.
const artifact = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...ManifestSchema,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')

const sizeKB = (Buffer.byteLength(JSON.stringify(artifact)) / 1024).toFixed(2)
console.log(`[build-schema] wrote ${OUT} (~${sizeKB} KB)`)
