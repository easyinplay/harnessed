// Fixture-driven positive validation: every yaml under
// `tests/fixtures/manifests/valid/` is loaded and run through the strict
// validator. Each fixture becomes its own `it()` so a single bad manifest
// surfaces as a single failing test (not a generic assertion failure).
//
// Adding an upstream manifest = drop a yaml here + the test auto-registers.
// No per-upstream test boilerplate needed (karpathy simplicity).

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const FIXTURE_DIR = resolve('tests/fixtures/manifests/valid')

const yamlFiles = readdirSync(FIXTURE_DIR).filter(
  (f) => f.endsWith('.yaml') || f.endsWith('.yml'),
)

describe('valid manifest fixtures pass strict validation', () => {
  if (yamlFiles.length === 0) {
    it.skip('no fixtures yet — populate tests/fixtures/manifests/valid/', () => {})
    return
  }
  for (const file of yamlFiles) {
    it(`${file} validates`, () => {
      const yaml = readFileSync(resolve(FIXTURE_DIR, file), 'utf8')
      const result = validateManifestFile(yaml, file)
      if (!result.ok) {
        // Surface validation errors so CI logs show *which* field failed.
        console.error(`Fixture ${file} validation errors:`, result.errors)
      }
      expect(result.ok).toBe(true)
    })
  }
})
