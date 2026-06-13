import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildInjection,
  buildProjectContextBlock,
  buildWorkflowStateBlock,
  DEFAULT_INJECT_BUDGET,
  filterRelevantLearnings,
  findPhaseContextExcerpt,
  parseLearnings,
  selectWithinBudget,
} from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// Phase 16 LEARNINGS.md fixture (two entries; newest at bottom).
const LEARNINGS_MD = `# Learnings

> Append-only cross-session learning log.

### 2026-06-13T00:00:00.000Z — phase task
- looped: alpha (×3)
- lesson: do not retry alpha blindly

### 2026-06-13T01:00:00.000Z — phase other
- rejected: gamma

`

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

// ── Phase 17: parseLearnings / filterRelevantLearnings / selectWithinBudget ──

describe('parseLearnings', () => {
  it('parses Phase-16 markdown into {phase, subs} entries', () => {
    const entries = parseLearnings(LEARNINGS_MD)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ phase: 'task', subs: ['alpha'] })
    expect(entries[1]).toMatchObject({ phase: 'other', subs: ['gamma'] })
  })
  it('header-only / empty → []', () => {
    expect(parseLearnings('# Learnings\n\n> note\n')).toEqual([])
    expect(parseLearnings('')).toEqual([])
  })
})

describe('filterRelevantLearnings', () => {
  const entries = parseLearnings(LEARNINGS_MD)
  it('keeps phase-match entries, newest first', () => {
    const rel = filterRelevantLearnings(entries, { phase: 'task', ledgerSubs: [] })
    expect(rel.map((e) => e.phase)).toEqual(['task'])
  })
  it('keeps sub-match entries', () => {
    const rel = filterRelevantLearnings(entries, { phase: 'zzz', ledgerSubs: ['gamma'] })
    expect(rel.map((e) => e.subs[0])).toContain('gamma')
  })
  it('falls back to the single most-recent when nothing matches', () => {
    const rel = filterRelevantLearnings(entries, { phase: 'zzz', ledgerSubs: ['none'] })
    expect(rel).toHaveLength(1)
    expect(rel[0]?.phase).toBe('other') // newest entry
  })
})

describe('selectWithinBudget', () => {
  const entries = parseLearnings(LEARNINGS_MD)
  it('never exceeds the token budget', () => {
    const tiny = selectWithinBudget(entries, 1)
    expect(tiny.length).toBeLessThanOrEqual(1)
  })
  it('takes entries when the budget is generous', () => {
    expect(selectWithinBudget(entries, 10_000).length).toBe(entries.length)
  })
})

// ── Phase 17: buildProjectContextBlock / findPhaseContextExcerpt / buildInjection ──

describe('buildProjectContextBlock', () => {
  it('wraps learnings + context excerpt in a project-context block', () => {
    const out = buildProjectContextBlock({
      learnings: parseLearnings(LEARNINGS_MD).slice(0, 1),
      contextExcerpt: '## Goal\ndo the thing',
    })
    expect(out).toContain('<project-context>')
    expect(out).toContain('looped: alpha')
    expect(out).toContain('do the thing')
    expect(out).toContain('</project-context>')
  })
  it('empty learnings + no excerpt → empty string', () => {
    expect(buildProjectContextBlock({ learnings: [] })).toBe('')
  })
})

describe('findPhaseContextExcerpt', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'ctx-excerpt-'))
    mkdirSync(join(tmp, '.planning', 'phases', '13-x'), { recursive: true })
    writeFileSync(
      join(tmp, '.planning', 'phases', '13-x', '13-CONTEXT.md'),
      '# Phase 13\n\n## Goal\n\ncut the bloat\n\n## Scope\n\nx\n',
      'utf8',
    )
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('returns a bounded excerpt when the phase token matches a phase dir', () => {
    const ex = findPhaseContextExcerpt(tmp, '13-planning-doc-debloat', DEFAULT_INJECT_BUDGET)
    expect(ex).not.toBeNull()
    expect(ex).toContain('Goal')
  })
  it('null when no phase dir matches', () => {
    expect(findPhaseContextExcerpt(tmp, 'task', DEFAULT_INJECT_BUDGET)).toBeNull()
  })
})

describe('buildInjection', () => {
  const wf: CurrentWorkflowV1Type = {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-06-12T00:00:00.000Z',
    sub_progress: [{ sub: 'beta', status: 'pending', gate_fired: true }],
  }
  it('composes workflow-state + project-context when relevant learnings exist', () => {
    const out = buildInjection('/no/such/repo', wf, LEARNINGS_MD, DEFAULT_INJECT_BUDGET)
    expect(out).toContain('<workflow-state>')
    expect(out).toContain('<project-context>')
    expect(out).toContain('looped: alpha') // phase 'task' match
  })
  it('workflow-state only when no learnings', () => {
    const out = buildInjection('/no/such/repo', wf, '', DEFAULT_INJECT_BUDGET)
    expect(out).toContain('<workflow-state>')
    expect(out).not.toContain('<project-context>')
  })
  it('empty string when no workflow', () => {
    expect(buildInjection('/no/such/repo', null, LEARNINGS_MD, DEFAULT_INJECT_BUDGET)).toBe('')
  })
})

// ── Phase 17: repo-aware bin parity ──

describe('bin/harnessed-inject-state.mjs parity (repo-aware)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'inject-parity-'))
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    mkdirSync(join(tmp, 'root', '.claude', 'harnessed'), { recursive: true })
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  const wf: CurrentWorkflowV1Type = {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-06-12T00:00:00.000Z',
    sub_progress: [{ sub: 'beta', status: 'pending', gate_fired: true }],
  }

  const binPath = join(__dirname, '..', '..', 'bin', 'harnessed-inject-state.mjs')
  const runBin = () =>
    execFileSync('node', [binPath], {
      env: {
        ...process.env,
        HOME: join(tmp, 'root'),
        USERPROFILE: join(tmp, 'root'),
        HARNESSED_ROOT_OVERRIDE: join(tmp, 'root', '.claude', 'harnessed'),
      },
      encoding: 'utf8',
      cwd: join(tmp, 'repo'),
    })

  it('reads workflows.json[repoKey] + repo LEARNINGS.md and emits both blocks; matches buildInjection', () => {
    const repoRoot = resolve(join(tmp, 'repo'))
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoRoot]: wf },
      }),
    )
    mkdirSync(join(tmp, 'repo', '.planning'), { recursive: true })
    writeFileSync(join(tmp, 'repo', '.planning', 'LEARNINGS.md'), LEARNINGS_MD, 'utf8')

    const stdout = runBin().trim()
    expect(stdout).toContain('<workflow-state>')
    expect(stdout).toContain('<project-context>')
    expect(stdout).toContain('looped: alpha')
    // parity: identical to the TS builder on the same inputs
    expect(stdout).toBe(buildInjection(repoRoot, wf, LEARNINGS_MD, DEFAULT_INJECT_BUDGET).trim())
  })

  it('falls back to legacy current-workflow.json when workflows.json is absent', () => {
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'current-workflow.json'),
      JSON.stringify(wf),
    )
    const stdout = runBin().trim()
    expect(stdout).toContain('<workflow-state>')
    expect(stdout).toContain('phase: task')
  })
})
