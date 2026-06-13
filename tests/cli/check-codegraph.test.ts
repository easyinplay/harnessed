// Phase 18 — CodeGraph catalog + doctor detect. TDD: written RED, driven to GREEN.
// checkCodeGraph is an opt-in detector that NEVER fails (absence of an optional
// tool is not a health problem). The manifest lives in manifests/optional/ so it
// is cataloged but never part of the base profile.

import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkCodeGraph } from '../../src/cli/lib/check-codegraph.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

describe('checkCodeGraph (opt-in doctor detect — always pass)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'codegraph-'))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('present — .codegraph/ exists → pass, "detected"', () => {
    mkdirSync(join(tmp, '.codegraph'), { recursive: true })
    const r = checkCodeGraph(tmp)
    expect(r.name).toBe('codegraph')
    expect(r.status).toBe('pass')
    expect(r.message.toLowerCase()).toContain('detected')
  })

  it('absent — no .codegraph/ → pass (optional, not a failure) + enable hint', () => {
    const r = checkCodeGraph(tmp)
    expect(r.status).toBe('pass') // opt-in absence is NOT a health failure
    expect(r.message.toLowerCase()).toContain('optional')
    expect(`${r.message} ${r.fix ?? ''}`.toLowerCase()).toContain('codegraph')
  })

  it('always pass regardless of presence', () => {
    mkdirSync(join(tmp, '.codegraph'), { recursive: true })
    expect(checkCodeGraph(tmp).status).toBe('pass')
    rmSync(join(tmp, '.codegraph'), { recursive: true, force: true })
    expect(checkCodeGraph(tmp).status).toBe('pass')
  })
})

describe('manifests/optional/codegraph.yaml (catalog manifest)', () => {
  const path = resolve(process.cwd(), 'manifests/optional/codegraph.yaml')

  it('validates against the manifest schema', () => {
    const src = readFileSync(path, 'utf8')
    const v = validateManifestFile(src, path)
    expect(v.ok).toBe(true)
  })

  it('is the codegraph component, MIT-licensed', () => {
    const src = readFileSync(path, 'utf8')
    const v = validateManifestFile(src, path)
    if (!v.ok) throw new Error('manifest invalid')
    expect(v.manifest.metadata.name).toBe('codegraph')
    expect(v.manifest.metadata.upstream.license).toBe('MIT')
  })
})
