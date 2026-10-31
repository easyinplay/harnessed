import { readFileSync } from 'node:fs'
import AjvModule from 'ajv/dist/2020.js'
import * as ajvFormatsNs from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { ManifestSchema } from '../../src/manifest/schema/index.js'

type AjvCtor = new (
  opts?: Record<string, unknown>,
) => {
  compile: (schema: unknown) => (data: unknown) => boolean
}
const Ajv = (AjvModule as unknown as { default: AjvCtor }).default
const addFormats = (ajvFormatsNs as unknown as { default: (ajv: unknown) => unknown }).default
const validate = (
  addFormats(new Ajv({ strict: true, allErrors: true, discriminator: true })) as {
    compile: (schema: unknown) => (data: unknown) => boolean
  }
).compile(ManifestSchema)

function fixture(ownership: unknown) {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'fixture',
      display_name: 'fixture',
      description: 'fixture',
      upstream: {
        source: 'fixture/source',
        homepage: 'https://example.com',
        repository: 'https://example.com/repo.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'command',
      category: 'engineering',
      install_type: 'npm',
      install: {
        method: 'npm-cli',
        cmd: 'npx --yes fixture',
        npm_version: '^1.0.0',
        idempotent_check: 'test -d fixture',
      },
      verify: { cmd: 'true' },
      uninstall: { cmd: 'true', cleanup_paths: [] },
      ownership,
      upstream_health: {
        stability: 'stable',
        last_check: '2026-10-31',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'fixture',
      platforms: ['linux'],
    },
  }
}

describe('manifest ownership contract', () => {
  it('accepts explicit roots/selectors/markers and rejects prefix-only ownership', () => {
    expect(
      validate(
        fixture({
          resources: [
            {
              root: 'platform-skills',
              kind: 'directory',
              selector: { prefix: 'gsd-' },
              marker: { path: 'SKILL.md', contains: 'gsd-core' },
            },
          ],
        }),
      ),
    ).toBe(true)
    expect(
      validate(
        fixture({
          resources: [
            {
              root: 'platform-skills',
              kind: 'directory',
              selector: { prefix: 'gsd-' },
            },
          ],
        }),
      ),
    ).toBe(false)

    expect(
      validate(
        fixture({
          resources: [
            {
              root: 'host-commands',
              kind: 'file',
              selector: { names: ['fixture'] },
              marker: { contains: 'fixture' },
            },
          ],
        }),
      ),
    ).toBe(true)
  })

  it('rejects invalid roots, selector shapes, and kind-specific markers', () => {
    const validDirectory = {
      root: 'platform-skills',
      kind: 'directory',
      selector: { names: ['fixture'] },
      marker: { path: 'SKILL.md', contains: 'fixture' },
    }
    const invalidCases: unknown[] = [
      { ...validDirectory, root: 'home' },
      { ...validDirectory, kind: 'symlink' },
      {
        root: 'platform-skills',
        kind: 'directory',
        marker: { path: 'SKILL.md', contains: 'fixture' },
      },
      { ...validDirectory, selector: { names: ['fixture'], prefix: 'fix-' } },
      { ...validDirectory, selector: { names: [] } },
      { ...validDirectory, selector: { names: ['fixture', 'fixture'] } },
      { ...validDirectory, selector: { prefix: '' } },
      { ...validDirectory, marker: { path: 'SKILL.md', contains: '' } },
      { ...validDirectory, marker: { path: '/SKILL.md', contains: 'fixture' } },
      { ...validDirectory, marker: { path: 'C:/x', contains: 'fixture' } },
      { ...validDirectory, marker: { path: 'nested//SKILL.md', contains: 'fixture' } },
      { ...validDirectory, marker: { path: './SKILL.md', contains: 'fixture' } },
      { ...validDirectory, marker: { path: '../SKILL.md', contains: 'fixture' } },
      { ...validDirectory, marker: { path: 'nested\\SKILL.md', contains: 'fixture' } },
      { ...validDirectory, marker: { contains: 'fixture' } },
      { ...validDirectory, marker: undefined },
      {
        root: 'platform-skills',
        kind: 'file',
        selector: { names: ['fixture'] },
        marker: { path: 'SKILL.md', contains: 'fixture' },
      },
      {
        root: 'platform-skills',
        kind: 'file',
        selector: { names: ['fixture'] },
        marker: {},
      },
      {
        root: 'platform-skills',
        kind: 'directory',
        selector: { names: ['fixture'] },
        marker: { path: 'SKILL.md', contains: 'fixture' },
        extra: true,
      },
      {
        root: 'platform-skills',
        kind: 'directory',
        selector: { names: ['fixture'], extra: true },
        marker: { path: 'SKILL.md', contains: 'fixture' },
      },
      {
        root: 'platform-skills',
        kind: 'directory',
        selector: { names: ['fixture'] },
        marker: { path: 'SKILL.md', contains: 'fixture', extra: true },
      },
    ]

    for (const resource of invalidCases) {
      expect(validate(fixture({ resources: [resource] }))).toBe(false)
    }

    expect(
      validate(
        fixture({
          resources: [validDirectory],
          extra: true,
        }),
      ),
    ).toBe(false)
  })

  it('ships receipt-only GSD and exact mattpocock ownership declarations', () => {
    const gsd = parse(readFileSync('manifests/skill-packs/gsd.yaml', 'utf8'))
    const matt = parse(readFileSync('manifests/skill-packs/mattpocock-skills.yaml', 'utf8'))
    expect(validate(gsd)).toBe(true)
    expect(validate(matt)).toBe(true)
    expect(gsd.spec.uninstall).toEqual({ cmd: 'true', cleanup_paths: [] })
    expect(gsd.spec.harness_overrides.codex.uninstall).toEqual({
      cmd: 'true',
      cleanup_paths: [],
    })
    expect(gsd.spec.ownership.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ selector: { prefix: 'gsd-' }, marker: expect.any(Object) }),
        expect.objectContaining({ root: 'native-home', selector: { names: ['gsd-core'] } }),
        expect.objectContaining({ root: 'host-agents' }),
        expect.objectContaining({ root: 'host-commands' }),
      ]),
    )
    const names = matt.spec.install.installs_skills
    expect(matt.spec.ownership.resources).toEqual(
      names.map((name: string) => ({
        root: 'platform-skills',
        kind: 'directory',
        selector: { names: [name] },
        marker: { path: 'SKILL.md', contains: `name: ${name}` },
      })),
    )
  })
})
