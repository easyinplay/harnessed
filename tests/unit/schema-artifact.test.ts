// T5.3 — verify the standalone JSON Schema artifact (schemas/manifest.v1.schema.json)
// is (A) present and well-formed JSON with the required draft-2020-12 metadata,
// and (B) compilable by Ajv 2020 in strict mode + actually validates a known-good
// manifest. Catches drift between the in-source TypeBox definition and the
// published artifact.
//
// IMPL NOTE: uses Ajv's 2020 entry because the artifact declares
// `$schema: https://json-schema.org/draft/2020-12/schema` (per ADR 0001 § C1
// draft-2020-12 unification). Default Ajv export is draft-07-only and rejects
// the artifact at compile — see progress.md § B F11.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020Module from 'ajv/dist/2020.js'
import * as ajvFormatsNs from 'ajv-formats'
import { describe, expect, it } from 'vitest'

// CJS interop under verbatimModuleSyntax — same trick as src/manifest/validate.ts (F9).
// `ajv/dist/2020.js` exports its class as default; namespace import + `.default`.
type AjvCtor = new (
  opts?: Record<string, unknown>,
) => {
  compile: (schema: unknown) => (data: unknown) => boolean
  errors?: unknown
}
const Ajv2020 = (Ajv2020Module as unknown as { default: AjvCtor }).default
const addFormats = (ajvFormatsNs as unknown as { default: (a: unknown) => unknown }).default

const SCHEMA_PATH = resolve('schemas/manifest.v1.schema.json')

// A minimal known-good manifest matching ADR 0001 (cli-npm × npm-cli legal combo).
// Used to confirm the compiled validator both accepts valid input and is wired
// to the matrix allOf clauses (rejection coverage lives in the existing suites).
const VALID_MANIFEST = {
  apiVersion: 'harnessed/v1',
  kind: 'Manifest',
  metadata: {
    name: 'ctx7',
    description: 'Fetch up-to-date library documentation via the ctx7 CLI tool.',
    upstream: {
      source: 'ctx7',
      homepage: 'https://context7.com',
      repository: 'https://github.com/upstash/context7.git',
      license: 'MIT',
      notice: 'ctx7 by Upstash, used as documentation lookup tool.',
    },
  },
  spec: {
    type: 'cli-npm',
    component_type: 'cli-binary',
    install: {
      method: 'npm-cli',
      cmd: 'npm install -g ctx7@^1.0.0',
      npm_version: '^1.0.0',
      idempotent_check: 'command -v ctx7',
    },
    verify: {
      cmd: 'ctx7 --version',
      timeout_ms: 5000,
    },
    uninstall: {
      cmd: 'npm uninstall -g ctx7',
    },
    upstream_health: {
      stability: 'stable',
      last_check: '2026-05-11',
      last_known_good_version: '1.0.0',
      fallback_action: 'warn',
    },
    signed_by: 'harnessed-maintainer',
    platforms: ['linux', 'darwin', 'win32'],
  },
}

describe('schemas/manifest.v1.schema.json artifact', () => {
  it('A. exists on disk + parses as JSON + carries the draft-2020-12 preamble', () => {
    expect(
      existsSync(SCHEMA_PATH),
      `${SCHEMA_PATH} missing — run \`pnpm build && pnpm build:schema\``,
    ).toBe(true)

    const raw = readFileSync(SCHEMA_PATH, 'utf8')
    expect(raw.length).toBeGreaterThan(100)

    // JSON.parse must not throw — well-formedness assertion.
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Draft + identity preamble required for IDE / SchemaStore consumers.
    expect(parsed.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(parsed.$id).toBe('https://harnessed.dev/schemas/manifest.v1.schema.json')
    expect(parsed.title).toBe('harnessed Manifest v1')
    expect(typeof parsed.description).toBe('string')

    // Sanity: top-level shape per ADR 0001.
    expect(parsed.type).toBe('object')
    expect(Array.isArray(parsed.required)).toBe(true)
    expect((parsed.required as string[]).sort()).toEqual(
      ['apiVersion', 'kind', 'metadata', 'spec'].sort(),
    )

    // Matrix allOf clauses must be present (Rule 2 enforcement, F10).
    expect(Array.isArray(parsed.allOf)).toBe(true)
    expect((parsed.allOf as unknown[]).length).toBe(4) // 4 type buckets per ADR 0001 line 104-113
  })

  it('B. Ajv 2020 compiles it in strict mode and the validator accepts a known-good manifest', () => {
    const raw = readFileSync(SCHEMA_PATH, 'utf8')
    const parsed = JSON.parse(raw)

    // Same Ajv config as scripts/validate-schema.mjs and src/manifest/validate.ts.
    // Strict everywhere + discriminator + allErrors so any artifact-level breach
    // (unknown keyword, malformed discriminator, missing required propertyName, ...)
    // surfaces here before it reaches downstream consumers.
    const ajv = addFormats(
      new Ajv2020({
        strict: true,
        strictSchema: true,
        strictTypes: true,
        strictRequired: true,
        allErrors: true,
        discriminator: true,
        allowUnionTypes: false,
      }) as never,
    ) as InstanceType<AjvCtor>

    // ajv.compile must not throw — primary acceptance bar A5.
    const validate = ajv.compile(parsed) as ((data: unknown) => boolean) & { errors?: unknown }

    // And the compiled validator must actually accept a known-good manifest:
    // confirms artifact + matrix wiring round-trip end-to-end.
    const ok = validate(VALID_MANIFEST)
    if (!ok) {
      // Surface validate.errors in the test failure for fast debugging.
      throw new Error(
        `compiled artifact rejected a known-good manifest: ${JSON.stringify(validate.errors, null, 2)}`,
      )
    }
    expect(ok).toBe(true)
  })
})
