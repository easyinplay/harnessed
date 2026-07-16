import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NextUnit } from '../../src/checkpoint/deriveNext.js'
import {
  buildInjection,
  buildIntentBlock,
  buildProjectContextBlock,
  buildWorkflowStateBlock,
  DEFAULT_INJECT_BUDGET,
  filterRelevantLearnings,
  findPhaseContextExcerpt,
  INTENT_TTL_MS,
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

  // 4.23.0 (issue #3, T4/D4) — staleness: a pending sub whose ledger file has
  // had NO checkpoint activity for >24h reads as STALE (abandoned/bypassed run),
  // not as a live state machine directive. Parity branch exists in
  // bin/harnessed-inject-state.mjs (mtime-derived ledgerAgeMs).
  const pendingWf = (): CurrentWorkflowV1Type => ({
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-06-12T00:00:00.000Z',
    sub_progress: [{ sub: 'b', status: 'pending', gate_fired: true }],
  })

  it('emits the STALE line (not the live ENGINE directive) when ledgerAgeMs > 24h', () => {
    const out = buildWorkflowStateBlock(pendingWf(), undefined, 3 * 24 * 60 * 60 * 1000)
    expect(out).toContain('ENGINE: STALE state machine')
    expect(out).toContain('>3d') // floor(days) surfaced
    expect(out).toContain('status --recover')
    expect(out).toContain('checkpoint fail b')
    expect(out).not.toContain('mid state-machine') // the live directive is REPLACED
  })

  it('keeps the live ENGINE directive for a fresh ledger / unknown age', () => {
    for (const age of [0, 60_000, null, undefined]) {
      const out = buildWorkflowStateBlock(pendingWf(), undefined, age)
      expect(out).not.toContain('STALE')
      expect(out).toContain('mid state-machine')
    }
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

  // Phase 39 (D6 / AC7) — per-turn current→next pointer. When the workflow's subs
  // are ALL resolved (no ENGINE) and a cross-unit next exists, point at it so the
  // agent continues forward instead of stalling. Mutually exclusive with ENGINE.
  it('AC7 — emits a NEXT-UNIT line naming the next phase when subs resolved + a next exists', () => {
    const phaseUnit: NextUnit = { kind: 'phase', phase: '17', name: 'forward-cont' }
    const out = buildWorkflowStateBlock(reminderWf({}), { unit: phaseUnit, remainingPhases: 3 })
    expect(out).toContain('NEXT-UNIT: current workflow complete')
    expect(out).toContain("next is phase 17 'forward-cont'")
    expect(out).toContain('harnessed advance')
    expect(out).toContain('3 phases remain')
    expect(out).not.toContain('ENGINE:')
  })

  it('AC7 — singularizes "1 phase remain"', () => {
    const phaseUnit: NextUnit = { kind: 'phase', phase: '17', name: 'x' }
    const out = buildWorkflowStateBlock(reminderWf({}), { unit: phaseUnit, remainingPhases: 1 })
    expect(out).toContain('1 phase remain')
    expect(out).not.toContain('1 phases remain')
  })

  it('AC7 — describes a task next as "task ... in phase N"', () => {
    const taskUnit: NextUnit = { kind: 'task', phase: '16', task: 'wire middleware' }
    const out = buildWorkflowStateBlock(reminderWf({}), { unit: taskUnit, remainingPhases: 2 })
    expect(out).toContain("next is task 'wire middleware' in phase 16")
  })

  it('emits NO NEXT-UNIT while a sub is still pending (ENGINE owns the mid-flight case)', () => {
    const pendingWf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [{ sub: 'b', status: 'pending', gate_fired: true }],
    }
    const phaseUnit: NextUnit = { kind: 'phase', phase: '17', name: 'x' }
    const out = buildWorkflowStateBlock(pendingWf, { unit: phaseUnit, remainingPhases: 1 })
    expect(out).toContain('ENGINE:')
    expect(out).not.toContain('NEXT-UNIT:')
  })

  it('emits no NEXT-UNIT when the forward pointer is null (done/blocked / no .planning)', () => {
    expect(buildWorkflowStateBlock(reminderWf({}), null)).not.toContain('NEXT-UNIT:')
    expect(buildWorkflowStateBlock(reminderWf({}))).not.toContain('NEXT-UNIT:')
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

  it('IGNORES the legacy global current-workflow.json — anti cross-repo leak (issue: phantom inject in a repo with no slot)', () => {
    // The pre-Phase-15 singleton carries NO repo identity, so an unconditional
    // fallback injects one repo's workflow-state into EVERY other repo that has
    // no workflows.json slot (independent new project → phantom <workflow-state>
    // every turn). The hot-path hook must never inject unattributable state:
    // with only the legacy singleton present and no slot for this repo, emit
    // nothing. (Migration of a genuine pre-Phase-15 root stays owned by
    // readStoreRaw, which only reads legacy when workflows.json is wholly absent.)
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'current-workflow.json'),
      JSON.stringify(wf),
    )
    const stdout = runBin().trim()
    expect(stdout).toBe('')
    expect(stdout).not.toContain('<workflow-state>')
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

  it('Phase 39 — emits NEXT-UNIT (current→next phase) when subs resolved + an incomplete next phase; matches buildInjection', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const resolvedWf: CurrentWorkflowV1Type = {
      ...wf,
      phase: '16',
      status: 'complete',
      sub_progress: [{ sub: 'a', status: 'done', gate_fired: true }],
    }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoRoot]: resolvedWf },
      }),
    )
    // phase 16 complete (PLAN+SUMMARY) ; phase 17 incomplete (PLAN, no SUMMARY).
    const phases = join(tmp, 'repo', '.planning', 'phases')
    mkdirSync(join(phases, '16-done'), { recursive: true })
    writeFileSync(join(phases, '16-done', '16-01-PLAN.md'), '# plan', 'utf8')
    writeFileSync(join(phases, '16-done', '16-01-SUMMARY.md'), '# summary', 'utf8')
    mkdirSync(join(phases, '17-forward'), { recursive: true })
    writeFileSync(join(phases, '17-forward', '17-01-PLAN.md'), '# plan', 'utf8')

    const stdout = runBin().trim()
    expect(stdout).toContain("NEXT-UNIT: current workflow complete → next is phase 17 'forward'")
    expect(stdout).toContain('1 phase remain')
    expect(stdout).not.toContain('ENGINE:')
    // parity: byte-identical to the TS builder on the same disk inputs
    expect(stdout).toBe(buildInjection(repoRoot, resolvedWf, '', DEFAULT_INJECT_BUDGET).trim())
  })
})

// ── 4.22.0 T3 — intent guard (L3 anti-freestyle per-turn nag) ──

describe('buildIntentBlock + buildInjection intent guard (4.22.0)', () => {
  const NOW = Date.parse('2026-07-05T12:00:00.000Z')
  const freshIntent = { master: 'auto', ts: '2026-07-05T11:49:30.000Z' } // ~10.5m old

  it('emits the workflow-intent block for a fresh intent', () => {
    const block = buildIntentBlock(freshIntent, NOW)
    expect(block).toContain('<workflow-intent>')
    expect(block).toContain('intent: /auto invoked 10m ago')
    expect(block).toContain('harnessed gates auto')
    expect(block).toContain('harnessed checkpoint start auto')
    expect(block).toContain('</workflow-intent>')
  })

  it('returns empty for null / unparseable ts / expired TTL', () => {
    expect(buildIntentBlock(null, NOW)).toBe('')
    expect(buildIntentBlock({ master: 'auto', ts: 'not-a-date' }, NOW)).toBe('')
    const stale = { master: 'auto', ts: new Date(NOW - INTENT_TTL_MS - 1000).toISOString() }
    expect(buildIntentBlock(stale, NOW)).toBe('')
  })

  it('buildInjection: no workflow + fresh intent → intent block alone; no intent → "" (legacy)', () => {
    const out = buildInjection('/no/such/repo', null, '', DEFAULT_INJECT_BUDGET, freshIntent, NOW)
    expect(out).toBe(buildIntentBlock(freshIntent, NOW))
    expect(buildInjection('/no/such/repo', null, '', DEFAULT_INJECT_BUDGET, null, NOW)).toBe('')
  })

  it('buildInjection: workflow with a SEEDED ledger ignores the intent (byte-identical)', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'auto',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-07-05T11:50:00.000Z',
      sub_progress: [{ sub: 'plan', status: 'pending', gate_fired: true }],
    }
    const withIntent = buildInjection(
      '/no/such/repo',
      wf,
      '',
      DEFAULT_INJECT_BUDGET,
      freshIntent,
      NOW,
    )
    const without = buildInjection('/no/such/repo', wf, '', DEFAULT_INJECT_BUDGET, null, NOW)
    expect(withIntent).toBe(without)
    expect(withIntent).not.toContain('<workflow-intent>')
  })

  it('buildInjection: workflow with an EMPTY ledger + fresh intent → intent block prepended', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'auto',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-07-05T11:50:00.000Z',
    }
    const out = buildInjection('/no/such/repo', wf, '', DEFAULT_INJECT_BUDGET, freshIntent, NOW)
    expect(out.startsWith(buildIntentBlock(freshIntent, NOW))).toBe(true)
    expect(out).toContain('<workflow-state>')
  })
})

describe('bin parity — intent guard (4.22.0)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'inject-intent-'))
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    mkdirSync(join(tmp, 'root', '.claude', 'harnessed'), { recursive: true })
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  const binPath = join(__dirname, '..', '..', 'bin', 'harnessed-inject-state.mjs')
  const runBin = () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: join(tmp, 'root'),
      USERPROFILE: join(tmp, 'root'),
      HARNESSED_ROOT_OVERRIDE: join(tmp, 'root', '.claude', 'harnessed'),
    }
    delete env.CLAUDE_CODE_SESSION_ID
    delete env.HARNESSED_PLATFORM
    return execFileSync('node', [binPath], {
      env,
      encoding: 'utf8',
      cwd: join(tmp, 'repo'),
    })
  }

  it('fresh intent + no workflow → bin emits the intent block (parity with TS builder)', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    // Center the age at 10m30s so ±30s of runtime skew keeps floor(minutes)=10.
    const intent = { master: 'auto', ts: new Date(Date.now() - 10.5 * 60_000).toISOString() }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: {},
        intents: { [repoRoot]: intent },
      }),
    )
    const stdout = runBin().trim()
    expect(stdout).toContain('<workflow-intent>')
    expect(stdout).toContain('intent: /auto invoked 10m ago')
    expect(stdout).toBe(
      buildInjection(repoRoot, null, '', DEFAULT_INJECT_BUDGET, intent, Date.now()).trim(),
    )
  })

  it('expired intent + no workflow → bin emits nothing (legacy silence)', () => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const intent = {
      master: 'auto',
      ts: new Date(Date.now() - INTENT_TTL_MS - 60_000).toISOString(),
    }
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: {},
        intents: { [repoRoot]: intent },
      }),
    )
    expect(runBin().trim()).toBe('')
  })
})

// 4.22.0 T6 — leaf intent nag variant: text points at the leaf SOP (prompt →
// spawn → checkpoint complete), never at gates/start (which do not exist in a
// leaf command's SOP). Master text stays byte-identical, kind-absent = master
// (back-compat: 765cbc9 only ever wrote master intents).
describe('buildIntentBlock — leaf variant (4.22.0 T6)', () => {
  const NOW = Date.parse('2026-07-05T12:00:00.000Z')

  it('leaf kind → prompt/complete instructions, no gates/start', () => {
    const block = buildIntentBlock(
      { master: 'verify-qa', ts: '2026-07-05T11:49:30.000Z', kind: 'leaf' },
      NOW,
    )
    expect(block).toContain('<workflow-intent>')
    expect(block).toContain('intent: /verify-qa invoked 10m ago')
    expect(block).toContain('harnessed prompt verify-qa')
    expect(block).toContain('harnessed checkpoint complete verify-qa')
    expect(block).not.toContain('harnessed gates')
    expect(block).not.toContain('checkpoint start')
  })

  it('explicit kind:master is byte-identical to kind-absent (back-compat)', () => {
    const ts = '2026-07-05T11:49:30.000Z'
    expect(buildIntentBlock({ master: 'auto', ts, kind: 'master' }, NOW)).toBe(
      buildIntentBlock({ master: 'auto', ts }, NOW),
    )
  })
})

// ── 4.25.0 (intel B1) — session-scoped delta injection: the bin skips re-injecting
// a byte-identical <project-context> within the same session (hash cache under
// <root>/inject-cache/), refreshing every N turns as a compaction hedge. No sid /
// cache trouble → byte-identical legacy full injection (fail-soft). ──

describe('bin delta injection (4.25.0 — session pc cache)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'inject-delta-'))
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    mkdirSync(join(tmp, 'repo', '.planning'), { recursive: true })
    mkdirSync(join(tmp, 'root', '.claude', 'harnessed'), { recursive: true })
    writeFileSync(join(tmp, 'repo', '.planning', 'LEARNINGS.md'), LEARNINGS_MD, 'utf8')
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

  const seed = (sid?: string) => {
    const repoRoot = realpathSync(join(tmp, 'repo'))
    const slot = sid ? `${repoRoot}::${sid}` : repoRoot
    writeFileSync(
      join(tmp, 'root', '.claude', 'harnessed', 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [slot]: wf },
      }),
    )
  }

  const runBin = (extraEnv: NodeJS.ProcessEnv = {}) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: join(tmp, 'root'),
      USERPROFILE: join(tmp, 'root'),
      HARNESSED_ROOT_OVERRIDE: join(tmp, 'root', '.claude', 'harnessed'),
    }
    delete env.CLAUDE_CODE_SESSION_ID
    delete env.HARNESSED_PLATFORM
    delete env.HARNESSED_INJECT_REFRESH_TURNS
    return execFileSync('node', [binPath], {
      env: { ...env, ...extraEnv },
      encoding: 'utf8',
      cwd: join(tmp, 'repo'),
    })
  }

  it('same session, unchanged pc → 2nd run keeps <workflow-state>, skips <project-context>', () => {
    seed('sessD1')
    const first = runBin({ CLAUDE_CODE_SESSION_ID: 'sessD1' })
    expect(first).toContain('<workflow-state>')
    expect(first).toContain('<project-context>')
    const second = runBin({ CLAUDE_CODE_SESSION_ID: 'sessD1' })
    expect(second).toContain('<workflow-state>')
    expect(second).not.toContain('<project-context>')
  })

  it('HARNESSED_INJECT_REFRESH_TURNS=1 → full, skip, full (periodic refresh)', () => {
    seed('sessD2')
    const env = { CLAUDE_CODE_SESSION_ID: 'sessD2', HARNESSED_INJECT_REFRESH_TURNS: '1' }
    expect(runBin(env)).toContain('<project-context>')
    expect(runBin(env)).not.toContain('<project-context>')
    expect(runBin(env)).toContain('<project-context>')
  })

  it('no session id → every run carries the full pc (legacy behavior)', () => {
    seed()
    expect(runBin()).toContain('<project-context>')
    expect(runBin()).toContain('<project-context>')
  })

  it('pc content change between turns → hash miss → full re-injection', () => {
    seed('sessD3')
    expect(runBin({ CLAUDE_CODE_SESSION_ID: 'sessD3' })).toContain('<project-context>')
    writeFileSync(
      join(tmp, 'repo', '.planning', 'LEARNINGS.md'),
      `${LEARNINGS_MD}\n### 2026-06-14T00:00:00.000Z — phase task\n- failed: beta\n`,
      'utf8',
    )
    const third = runBin({ CLAUDE_CODE_SESSION_ID: 'sessD3' })
    expect(third).toContain('<project-context>')
    expect(third).toContain('failed: beta')
  })

  it('corrupt cache file → fail-soft full injection', () => {
    seed('sessD4')
    runBin({ CLAUDE_CODE_SESSION_ID: 'sessD4' }) // primes the cache
    const cacheDir = join(tmp, 'root', '.claude', 'harnessed', 'inject-cache')
    for (const f of readdirSync(cacheDir)) {
      writeFileSync(join(cacheDir, f), '{oops', 'utf8')
    }
    expect(runBin({ CLAUDE_CODE_SESSION_ID: 'sessD4' })).toContain('<project-context>')
  })

  it('different sessions do not share the cache', () => {
    seed('sessA')
    expect(runBin({ CLAUDE_CODE_SESSION_ID: 'sessA' })).toContain('<project-context>')
    // sessB reads the bare slot? No — seed wrote only sessA's slot; reseed for B.
    seed('sessB')
    expect(runBin({ CLAUDE_CODE_SESSION_ID: 'sessB' })).toContain('<project-context>')
  })
})
