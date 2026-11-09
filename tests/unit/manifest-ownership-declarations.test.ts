// Phase 85 — the manifest side of the force-update authorization.
//
// A refresh is authorized by the manifest's own ownership declaration, so the
// declaration has to (a) validate against the schema and (b) cover every skill
// the manifest claims to install. A declaration that misses one of the pack's
// skills does not bound what a refresh may overwrite, and the installer
// refuses the refresh (see `declaredCoversSkillNames`).
//
// The manifests pinned here are the ones the force-update pass runs into:
// every skill pack with a declaration.

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import type { Manifest } from '../../src/installers/lib/types.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const DECLARED_MANIFESTS = [
  'manifests/skill-packs/gsd.yaml',
  'manifests/skill-packs/design-taste-frontend.yaml',
  'manifests/skill-packs/mattpocock-skills.yaml',
  'manifests/tools/playwright-test.yaml',
  'manifests/tools/webapp-testing.yaml',
]

interface OwnershipResource {
  root: string
  kind: 'file' | 'directory'
  selector: { names?: string[]; prefix?: string }
  marker: { path?: string; contains: string }
}

function resourcesOf(manifest: Manifest): OwnershipResource[] {
  const ownership = (manifest.spec as unknown as { ownership?: { resources?: unknown } }).ownership
  const resources = ownership?.resources
  return Array.isArray(resources) ? (resources as OwnershipResource[]) : []
}

function covers(resources: OwnershipResource[], name: string): boolean {
  return resources.some((resource) => {
    const { names, prefix } = resource.selector
    return Boolean(names?.includes(name) || (prefix?.length && name.startsWith(prefix)))
  })
}

describe('manifest ownership declarations', () => {
  for (const path of DECLARED_MANIFESTS) {
    it(`${path} validates against the schema`, async () => {
      const source = await readFile(path, 'utf8')
      const result = validateManifestFile(source, path)
      expect(result.ok ? [] : result.errors.map((error) => error.message)).toEqual([])
    })

    it(`${path} covers every skill it claims to install`, async () => {
      const source = await readFile(path, 'utf8')
      const result = validateManifestFile(source, path)
      if (!result.ok) throw new Error(`manifest does not validate: ${path}`)
      const resources = resourcesOf(result.manifest)
      expect(resources.length).toBeGreaterThan(0)
      const claimed =
        (result.manifest.spec.install as { installs_skills?: string[] }).installs_skills ?? []
      for (const name of claimed) {
        expect(covers(resources, name)).toBe(true)
      }
    })
  }
})
