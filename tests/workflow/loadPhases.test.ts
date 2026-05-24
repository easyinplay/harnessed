// Phase v3.4.4 Commit 1 — schema dispatch matrix unit test (7 fixtures).
// Sister tests/workflow/loadPhases-interpolate.test.ts only covers v1 + JINJA;
// this file covers the v1 / v2 / v3 dispatch matrix added in v3.4.4.
//
// Fixtures (per PHASE-2-SPEC L196-204):
//   1. v1 yaml → PhasesSchema validates + returns shape (regression).
//   2. v2 yaml → WorkflowSchemaV2 validates + returns shape (regression).
//   3. v3 sub yaml (phases, no delegates_to) → WorkflowSchemaV3 validates.
//   4. v3 master yaml (delegates_to, no phases) → WorkflowSchemaV3 validates,
//      phases === undefined + delegates_to.length === 6.
//   5. v3 yaml with invalid `disciplines_applied` literal ('karpatHy') → throws
//      PhasesValidationError (Pattern A A.1 strict Literal Union assertion).
//   6. vars provided + v3 master yaml (no phases) → no throw (guards the
//      validated.phases && undefined-skip in the interpolate loop).
//   7. unknown `schema_version` value → falls back to v1 PhasesSchema → throws
//      (unchanged behavior preserved).

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadPhases, PhasesValidationError } from '../../src/workflow/loadPhases.js'
import type { WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

let tmpDir: string
function writeTmp(name: string, contents: string): string {
  const p = join(tmpDir, name)
  writeFileSync(p, contents, 'utf8')
  return p
}

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'harnessed-loadphases-dispatch-'))
})
afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('loadPhases — schema dispatch matrix (v3.4.4 Phase 2 Commit 1)', () => {
  it('1. v1 yaml (no schema_version) → PhasesSchema validates + returns shape', () => {
    const path = writeTmp(
      'v1.yaml',
      `workflow: execute-task
phases:
  - id: 01-clarify
    name: clarify task
    upstream: superpowers brainstorming
    model: opus
`,
    )
    const result = loadPhases(path)
    expect(result.workflow).toBe('execute-task')
    expect(result.phases?.[0]?.id).toBe('01-clarify')
  })

  it('2. v2 yaml → WorkflowSchemaV2 validates + returns shape', () => {
    const path = writeTmp(
      'v2.yaml',
      `schema_version: harnessed.workflow.v2
workflow: verify-work
description: v2 sample
phases:
  - id: 01-review
    name: code review
    model: sonnet
`,
    )
    const result = loadPhases(path)
    expect(result.workflow).toBe('verify-work')
    expect(result.phases?.[0]?.id).toBe('01-review')
  })

  it('3. v3 sub yaml (phases, no delegates_to) → WorkflowSchemaV3 validates', () => {
    const path = writeTmp(
      'v3-sub.yaml',
      `schema_version: harnessed.workflow.v3
workflow: verify-simplify
description: v3 sub-stage sample
disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [code-simplifier]
phases:
  - id: 01-simplify
    name: code-simplifier 末尾串行
    upstream: mattpocock-skills
    model: sonnet
    gate: judgments.stage-routing.verify-simplify-tail.fires
`,
    )
    const result = loadPhases(path) as WorkflowSchemaV3T
    expect(result.workflow).toBe('verify-simplify')
    expect(result.phases?.length).toBe(1)
    expect(result.phases?.[0]?.id).toBe('01-simplify')
    expect(result.delegates_to).toBeUndefined()
  })

  it('4. v3 master yaml (delegates_to, no phases) → WorkflowSchemaV3 validates; phases undefined, delegates_to.length === 6', () => {
    const path = writeTmp(
      'v3-master.yaml',
      `schema_version: harnessed.workflow.v3
workflow: auto
description: super-master orchestrator
disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [agent-teams-create, planning-with-files]
delegates_to:
  - sub: research
    mode: serial
    order: 0
    gate: judgments.stage-routing.auto-research-unclear.fires
  - sub: discuss
    mode: serial
    order: 1
  - sub: plan
    mode: serial
    order: 2
  - sub: task
    mode: serial
    order: 3
  - sub: verify
    mode: serial
    order: 4
  - sub: retro
    mode: serial
    order: 5
`,
    )
    const result = loadPhases(path) as WorkflowSchemaV3T
    expect(result.workflow).toBe('auto')
    expect(result.phases).toBeUndefined()
    expect(result.delegates_to?.length).toBe(6)
    expect(result.delegates_to?.[0]?.sub).toBe('research')
  })

  it('5. v3 yaml with invalid disciplines_applied literal (karpatHy typo) → throws PhasesValidationError', () => {
    const path = writeTmp(
      'v3-bad-discipline.yaml',
      `schema_version: harnessed.workflow.v3
workflow: bad-typo
disciplines_applied: [karpatHy, output-style]
phases:
  - id: 01-x
    name: dummy
`,
    )
    expect(() => loadPhases(path)).toThrow(PhasesValidationError)
  })

  it('6. vars provided + v3 master yaml (no phases) → no throw (interpolate loop skip guard)', () => {
    const path = writeTmp(
      'v3-master-vars.yaml',
      `schema_version: harnessed.workflow.v3
workflow: auto-vars
delegates_to:
  - sub: discuss
    mode: serial
    order: 0
`,
    )
    // Master shape has no phases; vars provided exercises the `validated.phases &&` guard.
    expect(() => loadPhases(path, { gstack_prefix: 'gstack-' })).not.toThrow()
    const result = loadPhases(path, { gstack_prefix: 'gstack-' }) as WorkflowSchemaV3T
    expect(result.phases).toBeUndefined()
  })

  it('7. unknown schema_version → falls back to v1 PhasesSchema → throws PhasesValidationError', () => {
    const path = writeTmp(
      'unknown-version.yaml',
      `schema_version: harnessed.workflow.v999
workflow: future-shape
phases:
  - id: 01-x
    name: dummy
`,
    )
    // Unknown version falls to v1 arm; the v1 PhasesSchema rejects the extra
    // top-level 'schema_version' field (additionalProperties:false) → throws.
    expect(() => loadPhases(path)).toThrow(PhasesValidationError)
  })
})
