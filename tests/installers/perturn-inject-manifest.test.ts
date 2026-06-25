// Phase 35 (Spec 3/G) — the opt-in per-turn injection manifest validates against
// the manifest schema AND lives in manifests/optional/ (so `setup`'s auto-glob,
// which covers only tools+skill-packs, never enables it — opt-in by construction).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const manifestPath = join(__dirname, '..', '..', 'manifests', 'optional', 'perturn-inject.yaml')

describe('manifests/optional/perturn-inject.yaml (Phase 35)', () => {
  const src = readFileSync(manifestPath, 'utf8')
  const result = validateManifestFile(src, manifestPath)

  it('validates against the manifest schema', () => {
    if (!result.ok) {
      throw new Error(`validation failed: ${result.errors.map((e) => e.message).join('; ')}`)
    }
    expect(result.ok).toBe(true)
  })

  it('is a cc-hook-add registering a UserPromptSubmit hook for the inject bin', () => {
    if (!result.ok) throw new Error('manifest invalid')
    const install = result.manifest.spec.install as Record<string, unknown>
    expect(install.method).toBe('cc-hook-add')
    expect(install.hook_event).toBe('UserPromptSubmit')
    expect(String(install.hook_command)).toContain('harnessed-inject-state')
  })

  it('lives in manifests/optional/ → opt-in (excluded from setup auto-glob)', () => {
    expect(manifestPath.replace(/\\/g, '/')).toContain('/manifests/optional/')
  })
})
