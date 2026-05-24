// Phase 2.2 W3 T3.4 — loadPhases + PhasesSchema validation tests (ADR 0011 errata).
//
// 5 cells per task_plan.md L572-586 acceptance:
//   1. valid path — load real workflows/execute-task/phases.yaml — shape match, 4 phases, models valid
//   2. invalid — missing `model:` field → throw PhasesValidationError
//   3. invalid — `model: invalid-tier` non-4-enum → throw
//   4. invalid — `additionalProperties` violation (unknown top-level field) → throw
//   5. valid — `model: inherit` ok (B-10 escape hatch)
//
// Pattern J: inline string fixtures via tmpdir (mirrors manifest-validate.bundle.test.ts).

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadPhases, PhasesValidationError } from '../../src/workflow/loadPhases.js'

const REAL_YAML = 'workflows/execute-task/phases.yaml'

let tmpDir: string
function writeTmp(name: string, contents: string): string {
  const p = join(tmpDir, name)
  writeFileSync(p, contents, 'utf8')
  return p
}

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'harnessed-phases-'))
})

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('loadPhases', () => {
  it('1. loads workflows/execute-task/phases.yaml — 4 phases with intel 第 4 条 defaults', () => {
    const result = loadPhases(REAL_YAML)
    expect(result.workflow).toBe('execute-task')
    expect(result.phases).toHaveLength(4)
    expect(result.phases?.map((p) => p.id) ?? []).toEqual([
      '01-clarify',
      '02-code',
      '03-test',
      '04-deliver',
    ])
    expect(result.phases?.map((p) => p.model) ?? []).toEqual(['opus', 'sonnet', 'sonnet', 'haiku'])
  })

  it('2. throws PhasesValidationError when `model:` field is missing on a phase', () => {
    const path = writeTmp(
      'missing-model.yaml',
      `workflow: execute-task
phases:
  - id: 01-clarify
    name: brainstorming
    upstream: superpowers brainstorming
    max_iterations: 5
`,
    )
    expect(() => loadPhases(path)).toThrow(PhasesValidationError)
  })

  it('3. throws PhasesValidationError when `model:` is not in the 4-enum', () => {
    const path = writeTmp(
      'invalid-tier.yaml',
      `workflow: execute-task
phases:
  - id: 01-clarify
    name: brainstorming
    upstream: superpowers brainstorming
    model: gpt4
`,
    )
    expect(() => loadPhases(path)).toThrow(PhasesValidationError)
  })

  it('4. throws PhasesValidationError on additionalProperties violation (unknown top-level field)', () => {
    const path = writeTmp(
      'extra-field.yaml',
      `workflow: execute-task
unexpected_top_field: hello
phases:
  - id: 01-clarify
    name: brainstorming
    upstream: superpowers brainstorming
    model: opus
`,
    )
    expect(() => loadPhases(path)).toThrow(PhasesValidationError)
  })

  it('5. accepts `model: inherit` (B-10 override escape hatch)', () => {
    const path = writeTmp(
      'inherit-tier.yaml',
      `workflow: execute-task
phases:
  - id: 01-clarify
    name: brainstorming
    upstream: superpowers brainstorming
    model: inherit
`,
    )
    const result = loadPhases(path)
    expect(result.phases?.[0]?.model).toBe('inherit')
  })
})
