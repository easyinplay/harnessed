// v16.0 Phase 64 — every manifests/optional/*.yaml must validate.
//
// Found by `pnpm test:codex-live`: perturn-inject-invalidate (4.38.0) carried a
// 149-char metadata.description (schema maxLength 120), so `harnessed install
// perturn-inject-invalidate` failed validation and the setup optional offer
// silently dropped it (loadOptionalManifests skips invalid entries) — on claude
// since 4.38.0, and it is one of the three hooks Phase 64 ports to codex.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const DIR = join(process.cwd(), 'manifests', 'optional')
const files = readdirSync(DIR).filter((f) => f.endsWith('.yaml'))

describe('manifests/optional/*.yaml validate', () => {
  it.each(files)('%s', (f) => {
    const v = validateManifestFile(readFileSync(join(DIR, f), 'utf8'), f)
    expect(v.ok ? [] : v.errors.map((e) => `${e.path}: ${e.message}`)).toEqual([])
  })
})
