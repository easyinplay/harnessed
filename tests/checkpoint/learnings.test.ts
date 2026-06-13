// Phase 16 — cross-session learning loop. TDD: written RED (functions absent),
// driven to GREEN. extractLearnings/formatLearningEntry are pure; appendLearning
// is append-only into <repoRoot>/.planning/LEARNINGS.md; captureWorkflowLearnings
// is a no-op when the ledger is clean (D4 — protects the real repo + test suite
// from pollution). Write target is repoKey(cwd), NOT the global harnessed root.

import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  appendLearning,
  captureWorkflowLearnings,
  extractLearnings,
  formatLearningEntry,
  learningsPath,
} from '../../src/checkpoint/learnings.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

const entry = (
  sub: string,
  status: SubProgressEntryType['status'],
  fail_count?: number,
): SubProgressEntryType => ({
  sub,
  status,
  gate_fired: true,
  ...(fail_count != null ? { fail_count } : {}),
})

// ── extractLearnings (pure) ──

describe('extractLearnings', () => {
  it('returns looped / rejected / failed signals; skips clean entries', () => {
    const signals = extractLearnings([
      entry('a-loop', 'done', 3),
      entry('b-reject', 'rejected'),
      entry('c-fail', 'failed'),
      entry('d-clean', 'done'),
      entry('e-pending', 'pending'),
    ])
    expect(signals).toContainEqual({ sub: 'a-loop', kind: 'looped', fail_count: 3 })
    expect(signals).toContainEqual({ sub: 'b-reject', kind: 'rejected' })
    expect(signals).toContainEqual({ sub: 'c-fail', kind: 'failed' })
    expect(signals.map((s) => s.sub)).not.toContain('d-clean')
    expect(signals.map((s) => s.sub)).not.toContain('e-pending')
  })

  it('clean ledger → empty array', () => {
    expect(extractLearnings([entry('a', 'done'), entry('b', 'skipped')])).toEqual([])
  })

  it('looped takes precedence (a failed sub with fail_count>0 is one looped signal)', () => {
    const signals = extractLearnings([entry('x', 'failed', 4)])
    expect(signals).toEqual([{ sub: 'x', kind: 'looped', fail_count: 4 }])
  })
})

// ── formatLearningEntry (pure) ──

describe('formatLearningEntry', () => {
  it('produces a dated markdown block with signals and optional prose', () => {
    const md = formatLearningEntry({
      phase: 'task',
      signals: [{ sub: 'a', kind: 'looped', fail_count: 3 }],
      prose: 'avoid retrying the migration blindly',
      at: '2026-06-13T00:00:00.000Z',
    })
    expect(md).toContain('2026-06-13T00:00:00.000Z')
    expect(md).toContain('phase task')
    expect(md).toContain('looped: a')
    expect(md).toContain('×3')
    expect(md).toContain('lesson: avoid retrying the migration blindly')
  })

  it('omits the lesson line when no prose', () => {
    const md = formatLearningEntry({
      phase: 'task',
      signals: [{ sub: 'a', kind: 'failed' }],
      at: '2026-06-13T00:00:00.000Z',
    })
    expect(md).not.toContain('lesson:')
    expect(md).toContain('failed: a')
  })
})

// ── appendLearning / captureWorkflowLearnings (impure, repo-targeted) ──

describe('append + capture', () => {
  let tmp: string
  let originalCwd: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'learnings-'))
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    originalCwd = process.cwd()
    process.chdir(join(tmp, 'repo'))
  })
  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(tmp, { recursive: true, force: true })
  })

  const repoRoot = () => join(tmp, 'repo')
  const lpath = () => join(tmp, 'repo', '.planning', 'LEARNINGS.md')

  it('learningsPath joins repoRoot/.planning/LEARNINGS.md', () => {
    expect(learningsPath(repoRoot())).toBe(lpath())
  })

  it('appendLearning creates the file with a header on first write, then appends', async () => {
    await appendLearning(repoRoot(), '### entry-one\n')
    await appendLearning(repoRoot(), '### entry-two\n')
    const body = await readFile(lpath(), 'utf8')
    expect(body).toContain('# Learnings') // header once
    expect(body.match(/# Learnings/g)).toHaveLength(1)
    expect(body).toContain('### entry-one')
    expect(body).toContain('### entry-two')
    // append order preserved, nothing truncated
    expect(body.indexOf('entry-one')).toBeLessThan(body.indexOf('entry-two'))
  })

  it('captureWorkflowLearnings appends when the ledger has signals', async () => {
    const n = await captureWorkflowLearnings([entry('a', 'failed'), entry('b', 'done')], 'task')
    expect(n).toBe(1)
    expect(existsSync(lpath())).toBe(true)
    expect(await readFile(lpath(), 'utf8')).toContain('failed: a')
  })

  it('captureWorkflowLearnings is a NO-OP (no file created) for a clean ledger — D4 anti-pollution', async () => {
    const n = await captureWorkflowLearnings([entry('a', 'done'), entry('b', 'skipped')], 'task')
    expect(n).toBe(0)
    expect(existsSync(lpath())).toBe(false)
  })
})
