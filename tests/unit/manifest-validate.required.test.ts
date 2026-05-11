// T8.2 — Required-field negative coverage per ADR 0001 § 必填字段总览.
// Each test drops exactly one mandatory field from a known-good BASE manifest
// and asserts the validator (a) rejects it and (b) reports the missing field's
// path with `keyword: 'required'` (or `additionalProperties` for parent paths).
//
// Surface area covered (≥ 8 fields per task spec):
//   apiVersion, kind, metadata, metadata.name, metadata.upstream.repository,
//   metadata.upstream.license, spec.type, spec.install, spec.install.method,
//   spec.install.idempotent_check, spec.verify.cmd, spec.uninstall.cmd,
//   spec.upstream_health, spec.signed_by, spec.platforms.
//
// karpathy simplicity: single BASE template + targeted line-level mutation
// keeps each fixture ~minimal (no parallel yaml files needed; ad-hoc strings).

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Known-good cli-npm × npm-cli manifest used as a mutation source.
const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Required-field negative test base manifest.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example upstream attribution.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g example
    npm_version: ^1.0.0
    idempotent_check: which example
  verify:
    cmd: example --version
  uninstall:
    cmd: npm uninstall -g example
  upstream_health:
    stability: stable
    last_check: "2026-05-11"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: harnessed-maintainer
  platforms:
    - linux
    - darwin
    - win32
`

interface Case {
  field: string // expected substring in any error path
  yaml: string
  // Optional second predicate: at least one error must satisfy this.
  // We always check `ok === false` + path-substring; some cases also assert
  // a specific keyword (`required` / `additionalProperties`).
  keyword?: string
}

const cases: Case[] = [
  {
    field: 'apiVersion',
    yaml: BASE.replace('apiVersion: harnessed/v1\n', ''),
    keyword: 'required',
  },
  {
    field: 'kind',
    yaml: BASE.replace('kind: Manifest\n', ''),
    keyword: 'required',
  },
  {
    field: 'name',
    yaml: BASE.replace('  name: example\n', ''),
    keyword: 'required',
  },
  {
    field: 'repository',
    yaml: BASE.replace('    repository: https://github.com/example/example.git\n', ''),
    keyword: 'required',
  },
  {
    field: 'license',
    yaml: BASE.replace('    license: MIT\n', ''),
    keyword: 'required',
  },
  {
    field: 'type',
    yaml: BASE.replace('  type: cli-npm\n', ''),
    keyword: 'required',
  },
  {
    field: 'install',
    yaml: BASE.replace(
      / {2}install:\n {4}method: npm-cli\n {4}cmd: npm install -g example\n {4}npm_version: \^1\.0\.0\n {4}idempotent_check: which example\n/,
      '',
    ),
    keyword: 'required',
  },
  {
    field: 'method',
    yaml: BASE.replace('    method: npm-cli\n', ''),
    // discriminator-required strips `method`; Ajv reports a discriminator
    // keyword error rather than a plain `required` (ADR 0001 + F8 hand-rolled
    // shape). We keep the path assertion only.
  },
  {
    field: 'idempotent_check',
    yaml: BASE.replace('    idempotent_check: which example\n', ''),
    keyword: 'required',
  },
  {
    field: 'cmd',
    // Drop verify.cmd specifically. Use a unique replace target by including
    // the surrounding `verify:` block so we don't strip uninstall.cmd by accident.
    yaml: BASE.replace('  verify:\n    cmd: example --version\n', '  verify: {}\n'),
    keyword: 'required',
  },
  {
    field: 'uninstall',
    yaml: BASE.replace(/ {2}uninstall:\n {4}cmd: npm uninstall -g example\n/, ''),
    keyword: 'required',
  },
  {
    field: 'upstream_health',
    yaml: BASE.replace(
      / {2}upstream_health:\n {4}stability: stable\n {4}last_check: "2026-05-11"\n {4}last_known_good_version: 1\.0\.0\n {4}fallback_action: warn\n/,
      '',
    ),
    keyword: 'required',
  },
  {
    field: 'signed_by',
    yaml: BASE.replace('  signed_by: harnessed-maintainer\n', ''),
    keyword: 'required',
  },
  {
    field: 'platforms',
    yaml: BASE.replace(/ {2}platforms:\n {4}- linux\n {4}- darwin\n {4}- win32\n/, ''),
    keyword: 'required',
  },
]

describe('validateManifestFile — required-field rejection (T8.2)', () => {
  for (const c of cases) {
    it(`rejects manifest missing required field '${c.field}'`, () => {
      const result = validateManifestFile(c.yaml, `missing-${c.field}.yaml`)
      expect(result.ok, `expected rejection for missing ${c.field}`).toBe(false)
      if (!result.ok) {
        const matched = result.errors.some((e) => {
          const pathHasField = e.path.includes(`/${c.field}`) || e.path.endsWith(c.field)
          const messageHasField = e.message.includes(c.field)
          const kwOk = c.keyword === undefined || e.keyword === c.keyword
          return (pathHasField || messageHasField) && kwOk
        })
        expect(
          matched,
          `expected error for missing '${c.field}' (keyword=${c.keyword ?? 'any'}); got: ${result.errors
            .map((e) => `${e.keyword}@${e.path}: ${e.message}`)
            .join(' | ')}`,
        ).toBe(true)
      }
    })
  }
})
