import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildWorkflowStateBlock } from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

describe('buildWorkflowStateBlock', () => {
  it('returns empty string when there is no workflow', () => {
    expect(buildWorkflowStateBlock(null)).toBe('')
  })

  it('emits a workflow-state block with phase, status, next sub', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [{ sub: 'b', status: 'pending', gate_fired: true }],
    }
    const out = buildWorkflowStateBlock(wf)
    expect(out).toContain('<workflow-state>')
    expect(out).toContain('phase: task')
    expect(out).toContain('status: active')
    expect(out).toContain('next: b')
    expect(out).toContain('</workflow-state>')
  })

  it('includes a break-loop warning for a sub with fail_count >= 3', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [{ sub: 'a', status: 'failed', gate_fired: true, fail_count: 3 }],
    }
    expect(buildWorkflowStateBlock(wf)).toContain('BREAK-LOOP')
  })
})

describe('bin/harnessed-inject-state.mjs parity', () => {
  it('stdout matches buildWorkflowStateBlock for the same envelope', () => {
    // Write a temp state file that mirrors what the state machine would write.
    const tmpBase = join(tmpdir(), `harnessed-inject-parity-${Date.now()}`)
    const harnessedDir = join(tmpBase, '.claude', 'harnessed')
    mkdirSync(harnessedDir, { recursive: true })

    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [
        { sub: 'alpha', status: 'done', gate_fired: true },
        { sub: 'beta', status: 'pending', gate_fired: true },
      ],
    }
    writeFileSync(join(harnessedDir, 'current-workflow.json'), JSON.stringify(wf))

    // The .mjs reads HARNESSED_ROOT_OVERRIDE when set; that is the supported test
    // isolation mechanism (mirrors getHarnessedRoot() in harnessedRoot.ts).
    const stdout = execFileSync('node', ['bin/harnessed-inject-state.mjs'], {
      env: {
        ...process.env,
        HOME: tmpBase,
        USERPROFILE: tmpBase,
        HARNESSED_ROOT_OVERRIDE: harnessedDir,
      },
      encoding: 'utf8',
      cwd: join(__dirname, '..', '..'),
    })

    const expected = buildWorkflowStateBlock(wf)
    expect(stdout.trim()).toBe(expected)
  })
})
