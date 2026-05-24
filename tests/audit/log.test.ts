// tests/audit/log.test.ts — Phase 4.3 W1 T1.4 (R8.1 audit log unit test 8 fixtures).
// vi.mock node:fs sync pattern (sister tests/checkpoint/state.test.ts vi.mock node:fs/promises adapt sync surface).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appendedLines: string[] = []
const mkdirSyncCalls: string[] = []

vi.mock('node:fs', () => ({
  appendFileSync: (_p: string, data: string) => void appendedLines.push(data),
  mkdirSync: (_p: string, _opts?: unknown) => void mkdirSyncCalls.push(String(_p)),
}))

import { Value } from '@sinclair/typebox/value'
import {
  type AuditCtx,
  AuditRecordSchema,
  buildAuditRecord,
  emitAuditRecord,
} from '../../src/audit/log.js'
import { getHarnessedRoot } from '../../src/installers/lib/harnessedRoot.js'
import type { ArbitrateResult, Rule, TaskContext } from '../../src/workflow/lib/agentDefinition.js'

const makeFixture = (taskText = 'test task content') => ({
  task: { task: taskText, task_type: 'engineering', phaseId: 'phase-4.3' } as TaskContext,
  decision: {
    matched_rule_id: 'test-rule',
    primary_expert: 'expert-a',
    secondary_expert: null,
    category: 'engineering',
  } as ArbitrateResult,
  matched: { id: 'test-rule', domain: 'engineering', decision: {} } as unknown as Rule,
  ctx: {
    outcome: 'complete',
    routeLayer: 'L1-keyword',
    sessionId: 'sess-123',
    iterCount: null,
  } satisfies AuditCtx,
})

beforeEach(() => {
  appendedLines.length = 0
  mkdirSyncCalls.length = 0
})
afterEach(() => vi.clearAllMocks())

describe('audit/log — JSONL append-only (Phase 4.3 W1 T1.4)', () => {
  it('1. emitAudit writes valid JSONL line — Value.Check passes', () => {
    const f = makeFixture()
    const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
    emitAuditRecord(record)
    expect(appendedLines).toHaveLength(1)
    const line = appendedLines[0] ?? ''
    const parsed = JSON.parse(line.trim())
    expect(Value.Check(AuditRecordSchema, parsed)).toBe(true)
  })

  it('2. emitAudit appends — second call adds second line, first unchanged', () => {
    const f1 = makeFixture('task A')
    const f2 = makeFixture('task B')
    emitAuditRecord(buildAuditRecord(f1.task, f1.decision, f1.matched, f1.ctx))
    emitAuditRecord(buildAuditRecord(f2.task, f2.decision, f2.matched, f2.ctx))
    expect(appendedLines).toHaveLength(2)
    expect(JSON.parse((appendedLines[0] ?? '').trim()).task_excerpt).toBe('task A')
    expect(JSON.parse((appendedLines[1] ?? '').trim()).task_excerpt).toBe('task B')
  })

  it('3. all 12 fields present in emitted record (D-01 schema exact)', () => {
    const f = makeFixture()
    const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
    const fields = Object.keys(record).sort()
    expect(fields).toEqual([
      'category',
      'iter_count',
      'matched_rule_id',
      'outcome',
      'phase',
      'primary_expert',
      'route_layer',
      'secondary_expert',
      'session_id',
      'task_excerpt',
      'task_sha1',
      'ts',
    ])
  })

  it('4. task_sha1 is 40-char hex (node:crypto sha1)', () => {
    const f = makeFixture()
    const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
    expect(record.task_sha1).toMatch(/^[a-f0-9]{40}$/)
  })

  it('5. task_excerpt truncated at 200 chars', () => {
    const longTask = 'x'.repeat(500)
    const f = makeFixture(longTask)
    const record = buildAuditRecord(f.task, f.decision, f.matched, f.ctx)
    expect(record.task_excerpt).toHaveLength(200)
  })

  it('6. outcome values map correctly through ctx', () => {
    const f = makeFixture()
    const rec1 = buildAuditRecord(f.task, f.decision, f.matched, {
      ...f.ctx,
      outcome: 'complete',
    })
    expect(rec1.outcome).toBe('complete')
    const rec2 = buildAuditRecord(f.task, f.decision, f.matched, {
      ...f.ctx,
      outcome: 'spawn-err',
    })
    expect(rec2.outcome).toBe('spawn-err')
  })

  it('7. mkdirSync called with the harnessed root (v3.0.3: ~/.claude/harnessed)', () => {
    const f = makeFixture()
    emitAuditRecord(buildAuditRecord(f.task, f.decision, f.matched, f.ctx))
    expect(mkdirSyncCalls).toContain(getHarnessedRoot())
  })

  it('8. log injection — raw newline in task encoded as \\n NOT literal newline (STRIDE T-4.3-05 mitigation)', () => {
    const injectionTask = 'first line\n{"ts":"FAKE","phase":"injected"}'
    const f = makeFixture(injectionTask)
    emitAuditRecord(buildAuditRecord(f.task, f.decision, f.matched, f.ctx))
    expect(appendedLines).toHaveLength(1)
    const line = appendedLines[0] ?? ''
    expect(line).toContain('\\n')
    const logicalLines = line.split('\n').filter((l) => l.trim())
    expect(logicalLines).toHaveLength(1)
  })
})
