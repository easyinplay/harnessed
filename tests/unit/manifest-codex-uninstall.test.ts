import { readFileSync } from 'node:fs'
import { Ajv } from 'ajv'
import * as ajvFormatsNs from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { Document, isMap, isScalar, isSeq, parse, stringify } from 'yaml'
import { ManifestSchema } from '../../src/manifest/schema/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const install = {
  method: 'npm-cli',
  cmd: 'npm install -g fixture',
  npm_version: '^1.0.0',
  idempotent_check: 'command -v fixture',
}
const base = {
  apiVersion: 'harnessed/v1',
  kind: 'Manifest',
  metadata: {
    name: 'fixture',
    description: 'Codex uninstall schema fixture',
    upstream: {
      source: 'fixture',
      homepage: 'https://example.com',
      repository: 'https://example.com/fixture.git',
      license: 'MIT',
      notice: 'fixture',
    },
  },
  spec: {
    type: 'cli-npm',
    component_type: 'cli-binary',
    category: 'engineering',
    install_type: 'npm',
    install,
    verify: { cmd: 'fixture --version' },
    uninstall: { cmd: 'npm uninstall -g fixture' },
    upstream_health: {
      stability: 'stable',
      last_check: '2026-10-23',
      last_known_good_version: '1.0.0',
      fallback_action: 'warn',
    },
    signed_by: 'fixture',
    platforms: ['linux', 'darwin', 'win32'],
  },
}

function withOverride(uninstall: unknown) {
  return {
    ...base,
    spec: { ...base.spec, harness_overrides: { codex: { install, uninstall } } },
  }
}

const overridePath = '/spec/harness_overrides/codex/uninstall'
const safeUninstall = {
  cmd: 'npm uninstall -g fixture',
  cleanup_paths: ['~/.agents/skills/fixture'],
}
const addFormats = (ajvFormatsNs as unknown as { default: (a: Ajv) => Ajv }).default
const artifact = JSON.parse(readFileSync('schemas/manifest.v1.schema.json', 'utf8'))
delete artifact.$schema

describe.each([
  ['source', ManifestSchema],
  ['artifact', artifact],
])('Codex uninstall %s schema', (_name, schema) => {
  const validate = addFormats(
    new Ajv({ strict: true, allErrors: true, discriminator: true }),
  ).compile(schema)

  it('accepts the optional override and preserves legacy manifests', () => {
    expect(validate(base)).toBe(true)
    expect(validate(withOverride(safeUninstall))).toBe(true)
    expect(validate(withOverride({ cmd: safeUninstall.cmd }))).toBe(true)
    expect(
      validate({ ...base, spec: { ...base.spec, harness_overrides: { codex: { install } } } }),
    ).toBe(true)
  })

  it.each([
    {},
    { cmd: '' },
    { cmd: 42 },
    { cmd: 'ok', cleanup_paths: [42] },
    { cmd: 'ok', unexpected: true },
  ])('rejects invalid uninstall shape %j', (uninstall) => {
    expect(validate(withOverride(uninstall))).toBe(false)
  })

  it('keeps parent override additionalProperties strict', () => {
    const manifest = withOverride(safeUninstall)
    expect(
      validate({
        ...manifest,
        spec: {
          ...manifest.spec,
          harness_overrides: { codex: { install, uninstall: safeUninstall, unexpected: true } },
        },
      }),
    ).toBe(false)
    expect(
      validate({
        ...manifest,
        spec: { ...manifest.spec, harness_overrides: { cursor: { install } } },
      }),
    ).toBe(false)
  })

  it('rejects the removed ownership contract', () => {
    expect(
      validate({
        ...base,
        spec: {
          ...base.spec,
          ownership: {
            source: 'fixture',
            version: '1.0.0',
            resources: [],
          },
        },
      }),
    ).toBe(false)
  })
})

describe('real skill-pack uninstall contracts', () => {
  const gsd = parse(readFileSync('manifests/skill-packs/gsd.yaml', 'utf8'))
  const mattpocock = parse(readFileSync('manifests/skill-packs/mattpocock-skills.yaml', 'utf8'))

  it('uses receipt-only GSD uninstall contracts for Claude and Codex', () => {
    expect(gsd.spec).toHaveProperty('ownership.resources')
    expect(gsd.spec.uninstall).toEqual({
      cmd: 'true',
      cleanup_paths: [],
    })
    expect(gsd.spec.harness_overrides.codex.uninstall).toEqual({
      cmd: 'true',
      cleanup_paths: [],
    })
  })

  it('keeps the mattpocock no-op uninstall and declared skill set', () => {
    expect(mattpocock.spec).toHaveProperty('ownership.resources')
    expect(mattpocock.spec.uninstall).toEqual({ cmd: 'true', cleanup_paths: [] })
    expect(mattpocock.spec.install.installs_skills).toEqual([
      'ask-matt',
      'code-review',
      'codebase-design',
      'diagnosing-bugs',
      'domain-modeling',
      'grill-with-docs',
      'implement',
      'improve-codebase-architecture',
      'prototype',
      'research',
      'resolving-merge-conflicts',
      'setup-matt-pocock-skills',
      'tdd',
      'to-spec',
      'to-tickets',
      'triage',
      'wayfinder',
      'grill-me',
      'grilling',
      'handoff',
      'teach',
      'writing-great-skills',
    ])
  })
})

describe('Codex uninstall validation consumer and security paths', () => {
  it('returns the typed nested interface without replacing the base uninstall', () => {
    const result = validateManifestFile(stringify(withOverride(safeUninstall)), 'fixture.yaml')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result.errors))
    expect(result.manifest.spec.harness_overrides?.codex?.uninstall).toEqual(safeUninstall)
    expect(result.manifest.spec.uninstall).toEqual(base.spec.uninstall)
  })

  it.each([
    '$(whoami)',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: intentionally unsafe fixture
    '${HOME}',
    '`whoami`',
  ])('screens nested command and every cleanup entry: %s', (bad) => {
    const result = validateManifestFile(
      stringify(
        withOverride({ cmd: `echo ${bad}`, cleanup_paths: ['~/.agents/skills/fixture', bad] }),
      ),
      'fixture.yaml',
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unsafe override accepted')
    expect(result.errors.map((error) => error.path)).toEqual([
      `${overridePath}/cmd`,
      `${overridePath}/cleanup_paths/1`,
    ])
    for (const error of result.errors) {
      expect(error.keyword).toBe('security')
      expect(error.line).toBeGreaterThan(0)
    }
  })

  it.each([
    '../outside',
    '..\\outside',
    'path\u0000suffix',
    '%2e%2e/outside',
    '%252e%252e/outside',
  ])('applies existing traversal guards to both cleanup paths: %s', (bad) => {
    const manifest = withOverride({ cmd: 'echo ok', cleanup_paths: [bad] })
    const result = validateManifestFile(
      stringify({
        ...manifest,
        spec: { ...manifest.spec, uninstall: { cmd: 'echo ok', cleanup_paths: [bad] } },
      }),
      'fixture.yaml',
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unsafe cleanup accepted')
    expect(result.errors.map((error) => error.path)).toEqual([
      '/spec/uninstall/cleanup_paths/0',
      `${overridePath}/cleanup_paths/0`,
    ])
    expect(result.errors.every((error) => error.keyword === 'security')).toBe(true)
  })
})

describe.each([
  ['base', ['spec', 'uninstall'], '/spec/uninstall'],
  ['codex', ['spec', 'harness_overrides', 'codex', 'uninstall'], overridePath],
] as const)('%s uninstall security aliases', (_host, path, errorPath) => {
  function aliasFixture(bad: string, field: 'cmd' | 'item' | 'sequence') {
    const doc = new Document({
      ...base,
      spec: {
        ...base.spec,
        install: { ...install, env: { BAD: bad }, installs_skills: ['safe', bad] },
        uninstall: { cmd: 'echo base', cleanup_paths: [] },
        harness_overrides: {
          codex: {
            install: structuredClone(install),
            uninstall: { cmd: 'echo codex', cleanup_paths: [] },
          },
        },
      },
    })
    const anchorPath =
      field === 'sequence'
        ? ['spec', 'install', 'installs_skills']
        : ['spec', 'install', 'env', 'BAD']
    const anchor = doc.getIn(anchorPath, true)
    if (!isScalar(anchor) && !isSeq(anchor)) throw new Error('fixture anchor missing')
    const target =
      field === 'cmd'
        ? [...path, 'cmd']
        : field === 'item'
          ? [...path, 'cleanup_paths', 0]
          : [...path, 'cleanup_paths']
    doc.setIn(target, doc.createAlias(anchor, 'bad'))
    const yaml = doc.toString()
    return { yaml, aliasLine: yaml.split('\n').findIndex((line) => line.includes('*bad')) + 1 }
  }

  it.each([
    '$(whoami)',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: intentionally unsafe alias fixture
    '${HOME}',
    '`whoami`',
  ])('screens command alias %s at its usage location', (bad) => {
    const { yaml, aliasLine } = aliasFixture(bad, 'cmd')
    const result = validateManifestFile(yaml, 'alias.yaml')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unsafe command alias accepted')
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: `${errorPath}/cmd`, line: aliasLine, keyword: 'security' }),
    )
  })

  describe.each(['item', 'sequence'] as const)('cleanup %s alias', (field) => {
    it.each([
      '../outside',
      '$(whoami)',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: intentionally unsafe alias fixture
      '${HOME}',
      '`whoami`',
    ])('screens %s and preserves alias path/line', (bad) => {
      const { yaml, aliasLine } = aliasFixture(bad, field)
      const result = validateManifestFile(yaml, 'alias.yaml')
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('unsafe cleanup alias accepted')
      const index = field === 'sequence' ? 1 : 0
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: `${errorPath}/cleanup_paths/${index}`,
          line: aliasLine,
          keyword: 'security',
        }),
      )
    })
  })

  it('accepts safe aliased cleanup values', () => {
    expect(
      validateManifestFile(aliasFixture('~/.agents/skills/fixture', 'item').yaml, 'alias.yaml').ok,
    ).toBe(true)
    expect(
      validateManifestFile(aliasFixture('~/.agents/skills/fixture', 'sequence').yaml, 'alias.yaml')
        .ok,
    ).toBe(true)
  })
})

it('screens an aliased uninstall mapping at the alias location, not only the base anchor', () => {
  const doc = new Document(withOverride({ cmd: 'echo safe' }))
  doc.setIn(['spec', 'uninstall', 'cmd'], 'echo $(whoami)')
  doc.setIn(['spec', 'uninstall', 'cleanup_paths'], ['../outside'])
  const anchor = doc.getIn(['spec', 'uninstall'], true)
  if (!isMap(anchor)) throw new Error('fixture mapping missing')
  doc.setIn(
    ['spec', 'harness_overrides', 'codex', 'uninstall'],
    doc.createAlias(anchor, 'teardown'),
  )
  const yaml = doc.toString()
  const line = yaml.split('\n').findIndex((text) => text.includes('*teardown')) + 1
  const result = validateManifestFile(yaml, 'alias.yaml')
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('unsafe uninstall mapping alias accepted')
  expect(result.errors).toContainEqual(
    expect.objectContaining({ path: `${overridePath}/cmd`, keyword: 'security', line }),
  )
  expect(result.errors).toContainEqual(
    expect.objectContaining({ path: `${overridePath}/cleanup_paths/0`, keyword: 'security', line }),
  )
})
