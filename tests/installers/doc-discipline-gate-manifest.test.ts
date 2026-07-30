// T2.5 — the opt-in doc-discipline gate manifest validates against the manifest
// schema AND lives in manifests/optional/ (setup's auto-glob covers only
// tools+skill-packs, so it is opt-in by construction — sister
// tests/installers/perturn-inject-manifest.test.ts).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const manifestPath = join(
  __dirname,
  '..',
  '..',
  'manifests',
  'optional',
  'doc-discipline-gate.yaml',
)

describe('manifests/optional/doc-discipline-gate.yaml (T2.5)', () => {
  const src = readFileSync(manifestPath, 'utf8')
  const result = validateManifestFile(src, manifestPath)

  it('validates against the manifest schema', () => {
    if (!result.ok) {
      throw new Error(`validation failed: ${result.errors.map((e) => e.message).join('; ')}`)
    }
    expect(result.ok).toBe(true)
  })

  it('is a cc-hook-add registering a PreToolUse(Bash) hook for `check-docs --hook`', () => {
    if (!result.ok) throw new Error('manifest invalid')
    const install = result.manifest.spec.install as Record<string, unknown>
    expect(install.method).toBe('cc-hook-add')
    expect(install.hook_event).toBe('PreToolUse')
    // matcher narrows to Bash; the --hook stdin gate narrows further to git commit
    expect(install.hook_matcher).toBe('Bash')
    expect(String(install.hook_command)).toContain('check-docs')
    expect(String(install.hook_command)).toContain('--hook')
  })

  it('lives in manifests/optional/ → opt-in (excluded from setup auto-glob)', () => {
    expect(manifestPath.replace(/\\/g, '/')).toContain('/manifests/optional/')
  })
})
