// Phase 3.2 W2 T2.6 — loadPhases vars + interpolate integration unit test (3 fixtures, D-02 JINJA WIRED).
// Sister tests/workflow/load-phases.test.ts tmpdir fixture pattern.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { InterpolationError } from '../../src/workflow/interpolate.js'
import { loadPhases } from '../../src/workflow/loadPhases.js'

let tmpDir: string
function writeTmp(name: string, contents: string): string {
  const p = join(tmpDir, name)
  writeFileSync(p, contents, 'utf8')
  return p
}

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'harnessed-loadphases-interp-'))
})
afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('loadPhases + JINJA interpolate (Phase 3.2 W2 T2.1)', () => {
  it('1. yaml + vars → ph.invokes interpolated (gstack- prefix)', () => {
    const path = writeTmp(
      'with-invokes.yaml',
      `workflow: plan-feature-fixture
phases:
  - id: 01-decision
    name: governance gate
    upstream: gstack
    model: opus
    invokes: '{{ gstack_prefix }}office-hours'
`,
    )
    const result = loadPhases(path, { gstack_prefix: 'gstack-' })
    expect(result.phases?.[0]?.invokes).toBe('gstack-office-hours')
  })

  it('2. undefined var → throws InterpolationError (fail-loud per RESEARCH § 3)', () => {
    const path = writeTmp(
      'unknown-var.yaml',
      `workflow: plan-feature-fixture
phases:
  - id: 01-decision
    name: governance gate
    upstream: gstack
    model: opus
    invokes: '{{ unknown_var }}cmd'
`,
    )
    expect(() => loadPhases(path, { gstack_prefix: 'gstack-' })).toThrow(InterpolationError)
  })

  it('3. vars omitted → no interpolate (backward-compat — sister execute-task unchanged)', () => {
    const path = writeTmp(
      'no-vars.yaml',
      `workflow: plan-feature-fixture
phases:
  - id: 01-decision
    name: governance gate
    upstream: gstack
    model: opus
    invokes: '{{ gstack_prefix }}office-hours'
`,
    )
    // No vars arg → literal {{ ... }} string preserved (no throw)
    const result = loadPhases(path)
    expect(result.phases?.[0]?.invokes).toBe('{{ gstack_prefix }}office-hours')
  })
})
