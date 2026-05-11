// T8.5 — Unknown / additional field rejection with line-number assertion.
// Each case injects exactly one extra (schema-undeclared) field and verifies:
//   1. The validator rejects with `keyword: 'additionalProperties'`.
//   2. The reported `line` matches the line where the offending field appears
//      in the yaml source (LineCounter mapping from T4.3).
//   3. The error path includes the unknown field name.
//
// Coverage (≥ 5 distinct positions):
//   1. Top-level extra field (sibling of metadata / spec).
//   2. metadata-level extra field (sibling of name / description / upstream).
//   3. metadata.upstream extra field (sibling of source / homepage / etc.).
//   4. spec-level extra field (sibling of type / install / verify / etc.).
//   5. spec.install extra field (sibling of method / cmd / npm_version / etc.).
//   6. spec.upstream_health extra field.
//
// All positions also exercise the LineCounter / doc.getIn mapping so a
// vendor PR that introduces a typo lands on the precise line number.

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

interface UnknownFieldCase {
  label: string
  yaml: string
  expectedLine: number
  expectedField: string
}

// Top-level extra (line 3): line 1=apiVersion, 2=kind, 3=extra_field, then metadata.
const topLevelYaml = `apiVersion: harnessed/v1
kind: Manifest
extra_field: foo
metadata:
  name: example
  description: Top-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
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
`

// metadata-level extra (line 7).
const metadataExtraYaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Metadata-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
  unknown_meta: bar
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
`

// metadata.upstream-level extra (line 12 here).
const upstreamExtraYaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Upstream-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
    upstream_extra: oops
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
`

// spec-level extra (line 14).
const specExtraYaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Spec-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
spec:
  custom_field: baz
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
`

// spec.install-level extra (line 18).
const installExtraYaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Install-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g example
    unknown_install_field: qux
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
`

// spec.upstream_health-level extra (line 27).
const upstreamHealthExtraYaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: upstream_health-level unknown field test.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
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
    unsupported_key: x
  signed_by: harnessed-maintainer
  platforms:
    - linux
`

const cases: UnknownFieldCase[] = [
  {
    label: 'top-level extra_field',
    yaml: topLevelYaml,
    expectedLine: 3,
    expectedField: 'extra_field',
  },
  {
    label: 'metadata-level unknown_meta',
    yaml: metadataExtraYaml,
    expectedLine: 12,
    expectedField: 'unknown_meta',
  },
  {
    label: 'metadata.upstream-level upstream_extra',
    yaml: upstreamExtraYaml,
    expectedLine: 12,
    expectedField: 'upstream_extra',
  },
  {
    label: 'spec-level custom_field',
    yaml: specExtraYaml,
    expectedLine: 13,
    expectedField: 'custom_field',
  },
  {
    label: 'spec.install-level unknown_install_field',
    yaml: installExtraYaml,
    expectedLine: 18,
    expectedField: 'unknown_install_field',
  },
  {
    label: 'spec.upstream_health-level unsupported_key',
    yaml: upstreamHealthExtraYaml,
    expectedLine: 29,
    expectedField: 'unsupported_key',
  },
]

describe('validateManifestFile — unknown-field rejection with line mapping (T8.5)', () => {
  for (const c of cases) {
    it(`rejects ${c.label} and reports correct line ${c.expectedLine}`, () => {
      const result = validateManifestFile(c.yaml, `${c.label.replace(/\W+/g, '-')}.yaml`)
      expect(result.ok, `expected rejection for ${c.label}`).toBe(false)
      if (!result.ok) {
        // Find the additionalProperties error matching the unknown field.
        const err = result.errors.find(
          (e) =>
            e.keyword === 'additionalProperties' &&
            (e.path.endsWith(`/${c.expectedField}`) || e.message.includes(c.expectedField)),
        )
        expect(
          err,
          `expected additionalProperties error for ${c.expectedField}; got: ${result.errors
            .map((e) => `${e.keyword}@${e.path}: ${e.message} (line=${e.line})`)
            .join(' | ')}`,
        ).toBeDefined()
        // Strict line assertion: the unknown field's value node sits on
        // exactly `expectedLine` (1-indexed). LineCounter + doc.getIn(path,
        // true) resolve to the value node — for `key: scalar` pairs the
        // value's range starts on the same line as the key.
        expect(err?.line, `line for ${c.label}: expected ${c.expectedLine}, got ${err?.line}`).toBe(
          c.expectedLine,
        )
      }
    })
  }

  it('every additionalProperties error has a non-null line number', () => {
    // Aggregate sanity: across all cases, every reported additionalProperties
    // error must carry a line number (no `null` line for unknown fields).
    for (const c of cases) {
      const result = validateManifestFile(c.yaml, c.label)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        const addls = result.errors.filter((e) => e.keyword === 'additionalProperties')
        for (const e of addls) {
          expect(e.line, `null line for ${c.label}: ${e.message}`).not.toBeNull()
        }
      }
    }
  })
})
