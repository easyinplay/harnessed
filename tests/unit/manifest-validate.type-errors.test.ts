// T8.4 — Type-error negative coverage.
// Covers `wrong type` / `non-enum value` / `non-format value` rejections that
// are distinct from missing-field (T8.2) and matrix violations (T8.3). Each
// case mutates a known-good BASE manifest in exactly one place and asserts
// the validator surfaces a path-anchored error referencing the corrupt field.
//
// Coverage (≥ 5 distinct field types):
//   1. apiVersion: number (must be Literal 'harnessed/v1' string)
//   2. metadata.upstream.license: 'GPL-3.0' (non-SPDX whitelist value)
//   3. spec.platforms: 'linux' (must be Array<string>, not scalar string)
//   4. spec.upstream_health.stability: 'unknown' (non-enum stable|beta|unstable|archived)
//   5. spec.upstream_health.last_check: 'yesterday' (must be ISO date YYYY-MM-DD)
//   6. spec.platforms enum: ['windows'] (string but not in linux|darwin|win32)
//   7. spec.upstream_health.fallback_action: 'panic' (non-enum)

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Type-error negative test base.
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

interface TypeErrorCase {
  label: string
  yaml: string
  pathSubstring: string
  // Optional: additional message-content predicate.
  messageMatch?: RegExp
}

const cases: TypeErrorCase[] = [
  {
    label: 'apiVersion as number (should be Literal string)',
    yaml: BASE.replace('apiVersion: harnessed/v1', 'apiVersion: 1'),
    pathSubstring: '/apiVersion',
  },
  {
    label: 'license value not in SPDX whitelist',
    yaml: BASE.replace('    license: MIT', '    license: GPL-3.0'),
    pathSubstring: '/metadata/upstream/license',
  },
  {
    label: 'platforms scalar string instead of array',
    yaml: BASE.replace(
      / {2}platforms:\n {4}- linux\n {4}- darwin\n {4}- win32\n/,
      '  platforms: linux\n',
    ),
    pathSubstring: '/spec/platforms',
  },
  {
    label: 'upstream_health.stability outside enum',
    yaml: BASE.replace('    stability: stable', '    stability: unknown'),
    pathSubstring: '/spec/upstream_health/stability',
  },
  {
    label: 'upstream_health.last_check non-ISO date string',
    yaml: BASE.replace('    last_check: "2026-05-11"', '    last_check: "yesterday"'),
    pathSubstring: '/spec/upstream_health/last_check',
    // ajv-formats `format: date` should fire.
    messageMatch: /date/i,
  },
  {
    label: 'platforms[0] enum violation (windows not in linux|darwin|win32)',
    yaml: BASE.replace(
      / {2}platforms:\n {4}- linux\n {4}- darwin\n {4}- win32\n/,
      '  platforms:\n    - windows\n',
    ),
    pathSubstring: '/spec/platforms/0',
  },
  {
    label: 'fallback_action outside enum',
    yaml: BASE.replace('    fallback_action: warn', '    fallback_action: panic'),
    pathSubstring: '/spec/upstream_health/fallback_action',
  },
]

describe('validateManifestFile — type / enum / format violations (T8.4)', () => {
  for (const c of cases) {
    it(`rejects: ${c.label}`, () => {
      const result = validateManifestFile(c.yaml, `${c.label.replace(/\W+/g, '-')}.yaml`)
      expect(result.ok, `expected rejection for case: ${c.label}`).toBe(false)
      if (!result.ok) {
        const matched = result.errors.some((e) => {
          const pathOk = e.path.includes(c.pathSubstring)
          const msgOk = c.messageMatch === undefined || c.messageMatch.test(e.message)
          return pathOk && msgOk
        })
        expect(
          matched,
          `expected error anchored at ${c.pathSubstring}${c.messageMatch ? ` matching ${c.messageMatch}` : ''}; got: ${result.errors
            .map((e) => `${e.keyword}@${e.path}: ${e.message}`)
            .join(' | ')}`,
        ).toBe(true)
      }
    })
  }
})
