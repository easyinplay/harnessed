import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

  // Phase 22 — smart-reminder lines, emitted from envelope flags.
  const reminderWf = (extra: Partial<CurrentWorkflowV1Type>): CurrentWorkflowV1Type => ({
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'complete',
    last_checkpoint_path: null,
    started_at: '2026-06-12T00:00:00.000Z',
    sub_progress: [{ sub: 'b', status: 'done', gate_fired: true }],
    ...extra,
  })

  it('emits a SHIP-READY line with the commit count when ship_ready is set', () => {
    const out = buildWorkflowStateBlock(reminderWf({ ship_ready: true, ship_commits: 4 }))
    expect(out).toContain('SHIP-READY: 4 commit(s) since the last release tag')
    expect(out).toContain('release-preflight')
  })

  it('emits a RETRO-DUE line when retro_due is set', () => {
    const out = buildWorkflowStateBlock(reminderWf({ retro_due: true }))
    expect(out).toContain('RETRO-DUE:')
    expect(out).toContain('harnessed retro --done')
  })

  it('emits neither reminder line when the flags are unset', () => {
    const out = buildWorkflowStateBlock(reminderWf({}))
    expect(out).not.toContain('SHIP-READY')
    expect(out).not.toContain('RETRO-DUE')
  })

  // Phase 36 (Spec 3/H) — surface the scale-adaptive verify_mode as a directive.
  it('emits a VERIFY-MODE: full directive when verify_mode is full', () => {
    const out = buildWorkflowStateBlock(reminderWf({ verify_mode: 'full' }))
    expect(out).toContain('VERIFY-MODE: full')
    expect(out).toContain('run full verification')
  })

  it('emits a VERIFY-MODE: light directive when verify_mode is light', () => {
    const out = buildWorkflowStateBlock(reminderWf({ verify_mode: 'light' }))
    expect(out).toContain('VERIFY-MODE: light')
    expect(out).toContain('scope verification to the changed surface')
  })

  it('emits no VERIFY-MODE line when verify_mode is unset (byte-identical to today)', () => {
    expect(buildWorkflowStateBlock(reminderWf({}))).not.toContain('VERIFY-MODE')
  })

  // issue #2 (T2) — anti-freestyle ENGINE enforcement line, emitted only while a
  // sub is still pending (mid state-machine). Pulls a drifting agent back to the
  // ledger/engine instead of letting it freestyle the orchestration.
  it('emits an ENGINE line naming the next sub when a sub is pending', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [{ sub: 'b', status: 'pending', gate_fired: true }],
    }
    const out = buildWorkflowStateBlock(wf)
    expect(out).toContain('ENGINE:')
    expect(out).toContain("sub 'b'")
    expect(out).toContain('harnessed checkpoint')
    expect(out).toContain('Do NOT freestyle')
  })

  it('emits no ENGINE line when all subs are resolved (next is null)', () => {
    expect(buildWorkflowStateBlock(reminderWf({}))).not.toContain('ENGINE:')
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
  // Phase 35 — clear the session-env signals the parent process may carry (the
  // real CLAUDE_CODE_SESSION_ID / HARNESSED_PLATFORM) so the bare-key cells are
  // deterministic; `extraEnv` lets a cell opt into a session id explicitly.
  const runBin = (extraEnv: NodeJS.ProcessEnv = {}) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: join(tmp, 'root'),
      USERPROFILE: join(tmp, 'root'),
      HARNESSED_ROOT_OVERRIDE: join(tmp, 'root', '.claude', 'harnessed'),
    }
    delete env.CLAUDE_CODE_SESSION_ID
    delete env.HARNESSED_PLATFORM
    return execFileSync('node', [binPath], {
      env: { ...env, ...extraEnv },
      encoding: 'utf8',
      cwd: join(tmp, 'repo'),
    })
  }

  it('reads workflows.json[repoKey] + repo LEARNINGS.md and emits both blocks; matches buildInjection', () => {
    // realpathSync (not resolve): the child bin sees process.cwd() with symlinks
    // resolved (macOS /var → /private/var), so the workflows.json key must match
    // that canonical form, else repoKey(cwd) lookup misses. No-op on Linux/Windows.
    const repoRoot = realpathSync(join(tmp, 'repo'))
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

  it('Phase 22 — emits SHIP-READY / RETRO-DUE from envelope flags; matches buildInjection', () => {
    // realpathSync (not resolve): the child bin sees process.cwd() with symlinks
    // resolved (macOS /var → /private/var), so the workflows.json key must match
    // that canonical form, else repoKey(cwd) lookup misses. No-op on Linux/Windows.
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const flagged: CurrentWorkflowV1Type = {
      ...wf,
      status: 'complete',
      ship_ready: true,
      ship_commits: 2,
      retro_due: true,
    }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoRoot]: flagged },
      }),
    )
    const stdout = runBin().trim()
    expect(stdout).toContain('SHIP-READY: 2 commit(s) since the last release tag')
    expect(stdout).toContain('RETRO-DUE:')
    expect(stdout).toBe(buildInjection(repoRoot, flagged, '', DEFAULT_INJECT_BUDGET).trim())
  })

  it('Phase 35 — reads the session-scoped slot <repoKey>::<sid> over the bare slot when CLAUDE_CODE_SESSION_ID is set', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const sid = 'sessBIN'
    const sessionWf: CurrentWorkflowV1Type = { ...wf, phase: 'verify' }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        // both slots present — the bin must prefer the session-scoped one.
        workflows: { [`${repoRoot}::${sid}`]: sessionWf, [repoRoot]: wf },
      }),
    )
    const stdout = runBin({ CLAUDE_CODE_SESSION_ID: sid }).trim()
    expect(stdout).toContain('phase: verify') // session slot, NOT the bare 'phase: task'
    expect(stdout).toBe(buildInjection(repoRoot, sessionWf, '', DEFAULT_INJECT_BUDGET).trim())
  })

  it('Phase 35 — HARNESSED_PLATFORM=codex (sessionIdEnv=null) reads the bare slot even with CLAUDE_CODE_SESSION_ID set', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const bareWf: CurrentWorkflowV1Type = { ...wf, phase: 'task' }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [`${repoRoot}::ignored`]: { ...wf, phase: 'verify' }, [repoRoot]: bareWf },
      }),
    )
    const stdout = runBin({ HARNESSED_PLATFORM: 'codex', CLAUDE_CODE_SESSION_ID: 'ignored' }).trim()
    expect(stdout).toContain('phase: task') // bare slot — codex has no session env
    expect(stdout).toBe(buildInjection(repoRoot, bareWf, '', DEFAULT_INJECT_BUDGET).trim())
  })

  it('Phase 36 — the bin emits the VERIFY-MODE directive from verify_mode; matches buildInjection', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const scaled: CurrentWorkflowV1Type = { ...wf, status: 'complete', verify_mode: 'full' }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoRoot]: scaled },
      }),
    )
    const stdout = runBin().trim()
    expect(stdout).toContain('VERIFY-MODE: full')
    expect(stdout).toContain('run full verification')
    expect(stdout).toBe(buildInjection(repoRoot, scaled, '', DEFAULT_INJECT_BUDGET).trim())
  })
})
