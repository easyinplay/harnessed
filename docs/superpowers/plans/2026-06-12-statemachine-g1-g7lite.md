# State Machine Gap-Fill (G1-G4 + G6 + G7-lite) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Borrow six state-machine capabilities from comet/Trellis into harnessed — scale-adaptive verify, deterministic next-step contract, structured recovery, per-turn state injection, loop-escape, and a `rejected` sub-status — all additive, preserving the D-01 flat-ledger and D-02 3-state locks.

**Architecture:** Pure logic modules (`scale`, `nextStep`, `recovery`, `breakLoop`) depend only on schema TYPES — zero fs/git/crypto. All I/O is isolated in collectors and the CLI/hook layer, mirroring the existing `ledger.ts` purity convention. Schema changes are additive-optional (no `schemaVersion` bump per CD-5); old state files keep passing `Value.Check`.

**Tech Stack:** Node.js 22, TypeScript, TypeBox (`@sinclair/typebox`), commander, vitest, biome, proper-lockfile.

**Conventions (every task):**
- Run a single test file: `corepack pnpm vitest run tests/checkpoint/<file>.test.ts`
- Before EVERY commit touching `.ts`: `corepack pnpm exec biome check --write <files>` (project memory: 3 CI-red recurrences).
- Commit with explicit file lists — NEVER `git add -A`. NEVER push (user approval required).
- ESM imports use the `.js` extension on relative paths.

**Spec:** `docs/superpowers/specs/2026-06-12-statemachine-g1-g7lite-design.md`

---

## Task 1: Schema additive fields + D-02 lock regression guard

**Files:**
- Modify: `src/checkpoint/schema/currentWorkflow.v1.ts`
- Test: `tests/checkpoint/schema.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Add to `tests/checkpoint/schema.test.ts`:

```typescript
import { Value } from '@sinclair/typebox/value'
import {
  CurrentWorkflowV1,
  SubProgressEntry,
  WorkflowStatus,
} from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { CheckpointStatus } from '../../src/checkpoint/schema/checkpoint.v1.js'

describe('additive G1/G6/G7 schema fields', () => {
  it('accepts an envelope WITHOUT the new optional fields (back-compat)', () => {
    const old = {
      schemaVersion: '1',
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
    }
    expect(Value.Check(CurrentWorkflowV1, old)).toBe(true)
  })

  it('accepts verify_mode and auto_transition on the envelope', () => {
    const next = {
      schemaVersion: '1',
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      verify_mode: 'full',
      auto_transition: false,
    }
    expect(Value.Check(CurrentWorkflowV1, next)).toBe(true)
  })

  it('accepts fail_count and rejected status on a sub entry', () => {
    const entry = { sub: 's', status: 'rejected', gate_fired: true, fail_count: 3 }
    expect(Value.Check(SubProgressEntry, entry)).toBe(true)
  })

  it('rejects an invalid verify_mode value', () => {
    const bad = {
      schemaVersion: '1',
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      verify_mode: 'medium',
    }
    expect(Value.Check(CurrentWorkflowV1, bad)).toBe(false)
  })

  it('D-02 lock: top-level WorkflowStatus/CheckpointStatus stay 3-state', () => {
    expect(WorkflowStatus.anyOf.map((s: { const: string }) => s.const)).toEqual([
      'active',
      'paused',
      'complete',
    ])
    expect(CheckpointStatus.anyOf.map((s: { const: string }) => s.const)).toEqual([
      'active',
      'paused',
      'complete',
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm vitest run tests/checkpoint/schema.test.ts`
Expected: FAIL — `verify_mode: 'full'` and `status: 'rejected'` rejected by current schema.

- [ ] **Step 3: Add the additive fields**

In `src/checkpoint/schema/currentWorkflow.v1.ts`, add `'rejected'` to the `SubProgressEntry.status` union, add `fail_count` to `SubProgressEntry`, and add `verify_mode` + `auto_transition` to `CurrentWorkflowV1`:

```typescript
// in SubProgressEntry, status union — add 'rejected' (sub-level; NOT the D-02 top union):
status: Type.Union([
  Type.Literal('pending'),
  Type.Literal('done'),
  Type.Literal('failed'),
  Type.Literal('skipped'),
  Type.Literal('rejected'),
]),
// ...after evidence: in SubProgressEntry object, add:
fail_count: Type.Optional(Type.Integer({ minimum: 0 })),
```

```typescript
// in CurrentWorkflowV1 object, after sub_progress, add:
verify_mode: Type.Optional(Type.Union([Type.Literal('light'), Type.Literal('full')])),
auto_transition: Type.Optional(Type.Boolean()),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm vitest run tests/checkpoint/schema.test.ts`
Expected: PASS (all 5 new cases + existing cases).

- [ ] **Step 5: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/schema/currentWorkflow.v1.ts tests/checkpoint/schema.test.ts
git add src/checkpoint/schema/currentWorkflow.v1.ts tests/checkpoint/schema.test.ts
git commit -m "feat(checkpoint): additive verify_mode/auto_transition/fail_count + rejected sub-status (G1/G6/G7-lite schema)"
```

---

## Task 2: markSub increments fail_count; accepts rejected

**Files:**
- Modify: `src/checkpoint/ledger.ts:75-96` (`markSub`)
- Test: `tests/checkpoint/ledger.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Add to `tests/checkpoint/ledger.test.ts`:

```typescript
describe('markSub fail_count + rejected (G6/G7-lite)', () => {
  const base: SubProgressEntryType[] = [{ sub: 'a', status: 'pending', gate_fired: true }]

  it('sets fail_count=1 on first ->failed', () => {
    const next = markSub(base, 'a', 'failed')
    expect(next[0]).toMatchObject({ status: 'failed', fail_count: 1 })
  })

  it('increments fail_count on repeated ->failed', () => {
    let led = markSub(base, 'a', 'failed')
    led = markSub(led, 'a', 'failed')
    led = markSub(led, 'a', 'failed')
    expect(led[0]).toMatchObject({ status: 'failed', fail_count: 3 })
  })

  it('does NOT touch fail_count on ->done', () => {
    const failed = markSub(base, 'a', 'failed')
    const done = markSub(failed, 'a', 'done')
    expect(done[0]).toMatchObject({ status: 'done', fail_count: 1 })
  })

  it('accepts the rejected status', () => {
    const next = markSub(base, 'a', 'rejected')
    expect(next[0].status).toBe('rejected')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm vitest run tests/checkpoint/ledger.test.ts`
Expected: FAIL — `fail_count` is undefined (markSub never sets it).

- [ ] **Step 3: Implement fail_count increment in markSub**

In `src/checkpoint/ledger.ts`, inside `markSub`, after building `updated` and before assigning evidence, add the fail_count rule:

```typescript
  const current = entries[idx] as SubProgressEntryType
  const updated: SubProgressEntryType = { ...current, status }
  // G6 — count repeated failures of the same sub (drives detectLoop). Only the
  // ->failed transition bumps the counter; other transitions carry it forward.
  if (status === 'failed') updated.fail_count = (current.fail_count ?? 0) + 1
  if (opts?.evidence !== undefined) updated.evidence = opts.evidence
  if (opts?.evidence_status !== undefined) updated.evidence_status = opts.evidence_status
```

(`'rejected'` already type-checks via `SubStatus = SubProgressEntryType['status']`, which now includes it — no code change needed for acceptance.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm vitest run tests/checkpoint/ledger.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/ledger.ts tests/checkpoint/ledger.test.ts
git add src/checkpoint/ledger.ts tests/checkpoint/ledger.test.ts
git commit -m "feat(checkpoint): markSub increments fail_count on repeated failure (G6)"
```

---

## Task 3: G1 — scale-adaptive verify (`scale.ts`)

**Files:**
- Create: `src/checkpoint/scale.ts`
- Test: `tests/checkpoint/scale.test.ts`

- [ ] **Step 1: Write the failing test (pure assessScale)**

Create `tests/checkpoint/scale.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { assessScale } from '../../src/checkpoint/scale.js'

describe('assessScale', () => {
  it('light when all metrics under threshold', () => {
    expect(assessScale({ changedFiles: 5, firedSubs: 4, requirements: 3 })).toBe('light')
  })
  it('full when changedFiles > 5', () => {
    expect(assessScale({ changedFiles: 6, firedSubs: 0, requirements: 0 })).toBe('full')
  })
  it('full when firedSubs > 4', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 5, requirements: 0 })).toBe('full')
  })
  it('full when requirements > 3', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 0, requirements: 4 })).toBe('full')
  })
  it('light when everything is zero (all signals absent)', () => {
    expect(assessScale({ changedFiles: 0, firedSubs: 0, requirements: 0 })).toBe('light')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/checkpoint/scale.test.ts`
Expected: FAIL — `Cannot find module '../../src/checkpoint/scale.js'`.

- [ ] **Step 3: Implement scale.ts (pure assesser + impure collector)**

Create `src/checkpoint/scale.ts`:

```typescript
// src/checkpoint/scale.ts — G1 scale-adaptive verify strength. Pure assessScale
// (schema-type-only, zero I/O — sister of ledger.ts purity); collectScaleMetrics
// is the impure git/.planning collector, fail-soft per design (absent signal -> 0).

import { exec } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

const execp = promisify(exec)

export interface ScaleMetrics {
  changedFiles: number
  firedSubs: number
  requirements: number
}

/** Pure decision: 'full' verify when ANY signal exceeds its threshold, else 'light'. */
export function assessScale(m: ScaleMetrics): 'light' | 'full' {
  return m.changedFiles > 5 || m.firedSubs > 4 || m.requirements > 3 ? 'full' : 'light'
}

/** Impure collector. All three signals fail-soft to 0 (git absent / no merge-base /
 *  no .planning) so a non-GSD repo with no git still yields a deterministic 'light'. */
export async function collectScaleMetrics(
  cwd: string,
  ledger: SubProgressEntryType[],
): Promise<ScaleMetrics> {
  const firedSubs = ledger.filter((e) => e.status !== 'skipped').length
  return {
    changedFiles: await countChangedFiles(cwd),
    firedSubs,
    requirements: await countRequirements(cwd),
  }
}

async function countChangedFiles(cwd: string): Promise<number> {
  try {
    const { stdout: base } = await execp('git merge-base HEAD origin/main', { cwd })
    const ref = base.trim()
    if (!ref) return 0
    const { stdout } = await execp(`git diff --name-only ${ref}`, { cwd })
    return stdout.split('\n').filter((l) => l.trim() !== '').length
  } catch {
    return 0
  }
}

async function countRequirements(cwd: string): Promise<number> {
  try {
    const text = await readFile(resolve(cwd, '.planning', 'REQUIREMENTS.md'), 'utf8')
    // Acceptance items are markdown list lines (`- ` / `* ` / `1. `).
    return text.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s+/.test(l)).length
  } catch {
    return 0
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/checkpoint/scale.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/scale.ts tests/checkpoint/scale.test.ts
git add src/checkpoint/scale.ts tests/checkpoint/scale.test.ts
git commit -m "feat(checkpoint): G1 scale-adaptive verify_mode assessor + metrics collector"
```

---

## Task 4: G2 — deterministic next-step (`nextStep.ts` + `harnessed next`)

**Files:**
- Create: `src/checkpoint/nextStep.ts`
- Create: `src/cli/next.ts`
- Modify: `src/cli.ts` (register)
- Test: `tests/checkpoint/nextStep.test.ts`

- [ ] **Step 1: Write the failing test (pure resolveNext)**

Create `tests/checkpoint/nextStep.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { resolveNext } from '../../src/checkpoint/nextStep.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

const pending: SubProgressEntryType[] = [
  { sub: 'a', status: 'done', gate_fired: true },
  { sub: 'b', status: 'pending', gate_fired: true },
]
const allDone: SubProgressEntryType[] = [{ sub: 'a', status: 'done', gate_fired: true }]

describe('resolveNext', () => {
  it('auto + next sub when pending exists and autoTransition true', () => {
    expect(resolveNext(pending, true)).toEqual({ next: 'auto', sub: 'b' })
  })
  it('manual + hint when pending exists and autoTransition false', () => {
    const r = resolveNext(pending, false)
    expect(r.next).toBe('manual')
    expect(r.sub).toBe('b')
    expect(r.hint).toContain('b')
  })
  it('done when no pending remain', () => {
    expect(resolveNext(allDone, true)).toEqual({ next: 'done' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/checkpoint/nextStep.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement nextStep.ts**

Create `src/checkpoint/nextStep.ts`:

```typescript
// src/checkpoint/nextStep.ts — G2 deterministic next-step contract. Pure resolver
// (schema-type-only) over the ledger; reuses nextPending (ledger.ts). Mirrors comet
// `comet-state next` output: auto | manual | done. autoTransition precedence is
// resolved by the CLI (env > envelope > default) before calling this.

import { nextPending } from './ledger.js'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export interface NextStep {
  next: 'auto' | 'manual' | 'done'
  sub?: string
  hint?: string
}

export function resolveNext(
  ledger: SubProgressEntryType[],
  autoTransition: boolean,
): NextStep {
  const sub = nextPending(ledger)
  if (sub === null) return { next: 'done' }
  if (autoTransition) return { next: 'auto', sub }
  return { next: 'manual', sub, hint: `pending sub '${sub}' — run the next step manually to continue` }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/checkpoint/nextStep.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the CLI test**

Create `tests/cli/next.test.ts` (mirror `tests/cli/resume.test.ts` harness — set `HARNESSED_ROOT_OVERRIDE`, seed a workflow, capture stdout):

```typescript
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerNext } from '../../src/cli/next.js'

describe('harnessed next CLI', () => {
  let log: string[]
  beforeEach(() => {
    log = []
    vi.spyOn(console, 'log').mockImplementation((m: string) => void log.push(m))
  })
  afterEach(() => vi.restoreAllMocks())

  it('prints NEXT: done when no active workflow', async () => {
    const program = new Command()
    registerNext(program)
    await program.parseAsync(['node', 'h', 'next'])
    expect(log.join('\n')).toContain('NEXT: done')
  })
})
```

(Mock `readCurrentWorkflow` to return null for the no-workflow path, following the `vi.mock('../../src/checkpoint/state.js', ...)` pattern already used in `tests/cli/resume.test.ts`.)

- [ ] **Step 6: Implement next.ts CLI + register**

Create `src/cli/next.ts`:

```typescript
// `harnessed next` — emit the deterministic next-step contract (G2). Reads the
// singleton ledger + auto_transition (env > envelope > default true), prints
// NEXT/SUB/HINT. No state mutation. Sister: src/cli/resume.ts lazy-import pattern.

import type { Command } from 'commander'

function resolveAutoTransition(envelopeValue: boolean | undefined): boolean {
  const env = process.env.HARNESSED_AUTO_TRANSITION
  if (env === 'true') return true
  if (env === 'false') return false
  return envelopeValue ?? true
}

export function registerNext(program: Command): void {
  program
    .command('next')
    .description('Print the deterministic next-step contract (NEXT: auto|manual|done) for the active workflow')
    .action(async () => {
      const { readCurrentWorkflow } = await import('../checkpoint/state.js')
      const { resolveNext } = await import('../checkpoint/nextStep.js')
      const current = await readCurrentWorkflow()
      const ledger = current?.sub_progress ?? []
      const auto = resolveAutoTransition(current?.auto_transition)
      const step = resolveNext(ledger, auto)
      console.log(`NEXT: ${step.next}`)
      if (step.sub) console.log(`SUB: ${step.sub}`)
      if (step.hint) console.log(`HINT: ${step.hint}`)
      process.exit(0)
    })
}
```

In `src/cli.ts`, add the import next to the existing `registerCheckpoint` import and call `registerNext(program)` alongside the other `register*` calls:

```typescript
import { registerNext } from './cli/next.js'
// ...wherever registerCheckpoint(program) / registerGates(program) are called:
registerNext(program)
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `corepack pnpm vitest run tests/checkpoint/nextStep.test.ts tests/cli/next.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/nextStep.ts src/cli/next.ts src/cli.ts tests/checkpoint/nextStep.test.ts tests/cli/next.test.ts
git add src/checkpoint/nextStep.ts src/cli/next.ts src/cli.ts tests/checkpoint/nextStep.test.ts tests/cli/next.test.ts
git commit -m "feat(cli): G2 harnessed next — deterministic next-step contract"
```

---

## Task 5: G3 — structured recovery (`recovery.ts` + runResume)

**Files:**
- Create: `src/checkpoint/recovery.ts`
- Modify: `src/checkpoint/resume.ts` (`ResumeResult` ok variant + `runResume`)
- Test: `tests/checkpoint/recovery.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/checkpoint/recovery.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { recoveryActions } from '../../src/checkpoint/recovery.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

describe('recoveryActions', () => {
  it('emits run instruction for a pending sub', () => {
    const led: SubProgressEntryType[] = [{ sub: 'a', status: 'pending', gate_fired: true }]
    expect(recoveryActions(led)).toEqual(['run sub a'])
  })
  it('emits investigate instruction with fail count for a failed sub', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 2 },
    ]
    expect(recoveryActions(led)).toEqual(['sub a failed 2x — investigate before retry'])
  })
  it('emits the all-resolved sentinel when nothing is pending/failed', () => {
    const led: SubProgressEntryType[] = [{ sub: 'a', status: 'done', gate_fired: true }]
    expect(recoveryActions(led)).toEqual(['all subs resolved — run: harnessed next'])
  })
  it('returns the sentinel for an empty ledger', () => {
    expect(recoveryActions([])).toEqual(['all subs resolved — run: harnessed next'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/checkpoint/recovery.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement recovery.ts**

Create `src/checkpoint/recovery.ts`:

```typescript
// src/checkpoint/recovery.ts — G3 structured recovery actions. Pure mapper from the
// ledger's sub-states to human next-actions (comet `check --recover` analog). Used by
// runResume to translate "where am I" into "what to do next" after a compaction resume.

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export function recoveryActions(ledger: SubProgressEntryType[]): string[] {
  const actions: string[] = []
  for (const e of ledger) {
    if (e.status === 'pending') actions.push(`run sub ${e.sub}`)
    else if (e.status === 'failed')
      actions.push(`sub ${e.sub} failed ${e.fail_count ?? 1}x — investigate before retry`)
  }
  if (actions.length === 0) return ['all subs resolved — run: harnessed next']
  return actions
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/checkpoint/recovery.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into runResume + extend the test**

In `src/checkpoint/resume.ts`, add `recoveryActions: string[]` to the `ok` variant of `ResumeResult`, import the mapper, and populate it from the live ledger:

```typescript
// in the ResumeResult 'ok' union member, add:
      recoveryActions: string[]
```

```typescript
// add import near detectDrift:
import { recoveryActions } from './recovery.js'
```

```typescript
// in runResume, before the final return, after computing driftWarn:
  const recovery = recoveryActions(current.sub_progress ?? [])
```

```typescript
// in the final return object, add:
    recoveryActions: recovery,
```

Add a case to `tests/checkpoint/resume.test.ts` asserting a paused workflow with a pending sub yields `recoveryActions` containing `'run sub <name>'` (follow the existing paused-workflow setup in that file).

- [ ] **Step 6: Run tests to verify they pass**

Run: `corepack pnpm vitest run tests/checkpoint/recovery.test.ts tests/checkpoint/resume.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/recovery.ts src/checkpoint/resume.ts tests/checkpoint/recovery.test.ts tests/checkpoint/resume.test.ts
git add src/checkpoint/recovery.ts src/checkpoint/resume.ts tests/checkpoint/recovery.test.ts tests/checkpoint/resume.test.ts
git commit -m "feat(checkpoint): G3 structured recovery actions on resume"
```

---

## Task 6: G6 — loop detection (`breakLoop.ts`) + fail-path capture

**Files:**
- Create: `src/checkpoint/breakLoop.ts`
- Modify: `src/cli/checkpoint.ts` (fail action — surface break-loop + capture stub)
- Test: `tests/checkpoint/breakLoop.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/checkpoint/breakLoop.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { detectLoop } from '../../src/checkpoint/breakLoop.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

describe('detectLoop', () => {
  it('empty when no sub has fail_count >= 3', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 2 },
    ]
    expect(detectLoop(led)).toEqual([])
  })
  it('flags subs with fail_count >= 3', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 3 },
      { sub: 'b', status: 'pending', gate_fired: true },
      { sub: 'c', status: 'failed', gate_fired: true, fail_count: 5 },
    ]
    expect(detectLoop(led)).toEqual([
      { sub: 'a', count: 3 },
      { sub: 'c', count: 5 },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/checkpoint/breakLoop.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement breakLoop.ts**

Create `src/checkpoint/breakLoop.ts`:

```typescript
// src/checkpoint/breakLoop.ts — G6 anti-thrash. Pure detector: subs that have failed
// >= LOOP_THRESHOLD times are in a fix-forget-repeat loop (Trellis break-loop analog).
// The 5-dimension root-cause framework lives in the break-loop skill doc, not here.

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export const LOOP_THRESHOLD = 3

export interface LoopHit {
  sub: string
  count: number
}

export function detectLoop(ledger: SubProgressEntryType[]): LoopHit[] {
  return ledger
    .filter((e) => (e.fail_count ?? 0) >= LOOP_THRESHOLD)
    .map((e) => ({ sub: e.sub, count: e.fail_count as number }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/checkpoint/breakLoop.test.ts`
Expected: PASS.

- [ ] **Step 5: Surface break-loop in the checkpoint fail path**

In `src/cli/checkpoint.ts`, in the `fail` action after the `mutateSubProgress(... 'failed')` call, read the ledger back and warn when a loop is detected. Add after the `mutateSubProgress` line in the fail branch:

```typescript
        // G6 — after recording the failure, detect a fix-forget-repeat loop and
        // surface a break-loop directive (the skill doc carries the 5-dim analysis).
        const { readCurrentWorkflow } = await import('../checkpoint/state.js')
        const { detectLoop, LOOP_THRESHOLD } = await import('../checkpoint/breakLoop.js')
        const latest = await readCurrentWorkflow()
        const loops = detectLoop(latest?.sub_progress ?? [])
        const looped = loops.find((l) => l.sub === sub)
        if (looped) {
          console.error(
            `[harnessed] BREAK-LOOP: sub '${sub}' failed ${looped.count}x (>= ${LOOP_THRESHOLD}). ` +
              'Stop retrying — run the break-loop skill for root-cause analysis and capture the lesson to .planning/.',
          )
        }
```

- [ ] **Step 6: Extend the checkpoint CLI test**

In `tests/cli/checkpoint.test.ts`, add a case: seed a ledger with one sub, call `checkpoint fail <sub>` three times, assert the third run's stderr contains `BREAK-LOOP`. Follow the existing `registerCheckpoint(program)` + `HARNESSED_ROOT_OVERRIDE` harness in that file, and spy on `console.error`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `corepack pnpm vitest run tests/checkpoint/breakLoop.test.ts tests/cli/checkpoint.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/breakLoop.ts src/cli/checkpoint.ts tests/checkpoint/breakLoop.test.ts tests/cli/checkpoint.test.ts
git add src/checkpoint/breakLoop.ts src/cli/checkpoint.ts tests/checkpoint/breakLoop.test.ts tests/cli/checkpoint.test.ts
git commit -m "feat(checkpoint): G6 loop detection + break-loop directive on repeated fail"
```

---

## Task 7: G7-lite — `harnessed reject <sub>` CLI

**Files:**
- Create: `src/cli/reject.ts`
- Modify: `src/cli.ts` (register)
- Test: `tests/cli/reject.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/cli/reject.test.ts` mirroring the `tests/cli/checkpoint.test.ts` harness: seed a workflow with a pending sub (via `mutateSubProgress(() => seedLedger(...))` under `HARNESSED_ROOT_OVERRIDE`), run `reject <sub>`, then read the ledger and assert the sub's status is `'rejected'`. Skeleton:

```typescript
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerReject } from '../../src/cli/reject.js'
// ...set HARNESSED_ROOT_OVERRIDE to a tmp dir, seed ledger, then:
it('marks the sub rejected', async () => {
  const program = new Command()
  registerReject(program)
  vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  await program.parseAsync(['node', 'h', 'reject', 'a'])
  const { readCurrentWorkflow } = await import('../../src/checkpoint/state.js')
  const cur = await readCurrentWorkflow()
  expect(cur?.sub_progress?.find((e) => e.sub === 'a')?.status).toBe('rejected')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/cli/reject.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement reject.ts CLI + register**

Create `src/cli/reject.ts`:

```typescript
// `harnessed reject <sub>` — G7-lite. Mark a seeded sub as user-abandoned (terminal,
// distinct from `failed` which is retryable + drives G6). nextPending ignores it.
// Sister: the fail action in src/cli/checkpoint.ts (mutateSubProgress + markSub).

import type { Command } from 'commander'
import { checkPathSafe } from '../manifest/lib/path-guard.js'

export function registerReject(program: Command): void {
  program
    .command('reject <sub>')
    .description('Mark a sub-workflow as user-rejected (terminal; distinct from failed)')
    .action(async (sub: string) => {
      try {
        checkPathSafe(sub)
      } catch {
        console.error('[harnessed] reject: invalid sub name (path traversal rejected)')
        process.exit(1)
        return
      }
      const { mutateSubProgress } = await import('../checkpoint/state.js')
      const { markSub } = await import('../checkpoint/ledger.js')
      let touched = false
      await mutateSubProgress((entries) => {
        if (!entries.some((e) => e.sub === sub)) return entries
        touched = true
        return markSub(entries, sub, 'rejected')
      })
      if (touched) {
        console.log(`[harnessed] rejected: ${sub}`)
        process.exit(0)
      } else {
        console.error(`[harnessed] reject: sub '${sub}' not found in the active ledger`)
        process.exit(1)
      }
    })
}
```

In `src/cli.ts`, add `import { registerReject } from './cli/reject.js'` and call `registerReject(program)` with the other `register*` calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/cli/reject.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
corepack pnpm exec biome check --write src/cli/reject.ts src/cli.ts tests/cli/reject.test.ts
git add src/cli/reject.ts src/cli.ts tests/cli/reject.test.ts
git commit -m "feat(cli): G7-lite harnessed reject — terminal user-abandoned sub-status"
```

---

## Task 8: G4 — per-turn state injection hook + installer wiring

**Files:**
- Create: `src/checkpoint/injectState.ts`
- Create: `bin/harnessed-inject-state.mjs` (hook entrypoint)
- Modify: `src/installers/index.ts` (register the hook installer)
- Create: `src/installers/injectHookAdd.ts`
- Test: `tests/checkpoint/injectState.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/checkpoint/injectState.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildWorkflowStateBlock } from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

describe('buildWorkflowStateBlock', () => {
  it('returns empty string when there is no workflow', () => {
    expect(buildWorkflowStateBlock(null)).toBe('')
  })
  it('emits a workflow-state block with phase, status, next sub', () => {
    const wf: CurrentWorkflowV1Type = {
      schemaVersion: '1',
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
      schemaVersion: '1',
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-12T00:00:00.000Z',
      sub_progress: [{ sub: 'a', status: 'failed', gate_fired: true, fail_count: 3 }],
    }
    expect(buildWorkflowStateBlock(wf)).toContain('BREAK-LOOP')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/checkpoint/injectState.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement injectState.ts (pure block builder)**

Create `src/checkpoint/injectState.ts`:

```typescript
// src/checkpoint/injectState.ts — G4 per-turn breadcrumb. Pure builder: turns the
// current-workflow envelope into a <workflow-state> block for UserPromptSubmit hook
// injection (Trellis inject-workflow-state analog). null -> '' (silent no-op).

import { detectLoop } from './breakLoop.js'
import { nextPending } from './ledger.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

export function buildWorkflowStateBlock(wf: CurrentWorkflowV1Type | null): string {
  if (!wf) return ''
  const ledger = wf.sub_progress ?? []
  const next = nextPending(ledger)
  const loops = detectLoop(ledger)
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  for (const l of loops) {
    lines.push(`BREAK-LOOP: sub '${l.sub}' failed ${l.count}x — stop retrying, run break-loop skill`)
  }
  lines.push('</workflow-state>')
  return lines.join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/checkpoint/injectState.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the hook entrypoint**

Create `bin/harnessed-inject-state.mjs` (walk-up root discovery, read state, print block, silent exit 0 on any error):

```javascript
#!/usr/bin/env node
// G4 UserPromptSubmit hook — print the <workflow-state> breadcrumb for the active
// harnessed workflow. Silent exit 0 when there is no state (mirror readCurrentWorkflow
// fail-soft). Reads <harnessed-root>/current-workflow.json directly (no heavy imports).
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

try {
  const statePath = join(homedir(), '.harnessed', 'current-workflow.json')
  const wf = JSON.parse(readFileSync(statePath, 'utf8'))
  const ledger = wf.sub_progress ?? []
  const next = ledger.find((e) => e.status === 'pending')?.sub ?? null
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  for (const e of ledger) {
    if ((e.fail_count ?? 0) >= 3)
      lines.push(`BREAK-LOOP: sub '${e.sub}' failed ${e.fail_count}x — stop retrying, run break-loop skill`)
  }
  lines.push('</workflow-state>')
  process.stdout.write(`${lines.join('\n')}\n`)
} catch {
  // no state / corrupt / not a harnessed session -> inject nothing
}
process.exit(0)
```

(The hook intentionally inlines the read rather than importing `injectState.ts` to avoid a build/bundle dependency at hook runtime; `buildWorkflowStateBlock` is the unit-tested source of truth for the block format, and this entrypoint mirrors it. A parity test is added in Step 6.)

- [ ] **Step 6: Add a format-parity test**

Append to `tests/checkpoint/injectState.test.ts` a test that runs the bin entrypoint against a temp `$HOME/.harnessed/current-workflow.json` and asserts its stdout equals `buildWorkflowStateBlock(wf)` for the same envelope (spawn `node bin/harnessed-inject-state.mjs` with `HOME` pointed at a tmp dir via `execFileSync`). This guards against the inlined hook drifting from the tested builder.

- [ ] **Step 7: Write the installer**

Create `src/installers/injectHookAdd.ts` following the `installCcHookAdd` Installer pattern (deep-merge `settings.hooks['UserPromptSubmit']`, idempotent on duplicate command, backup before write). The injected entry:

```typescript
// matcher '' (all prompts); command invokes the shipped hook entrypoint.
const ev = 'UserPromptSubmit'
const cmd = 'node "$HOME/.harnessed/bin/harnessed-inject-state.mjs"'
```

Register it in `src/installers/index.ts` alongside the other installers, and ensure the install step copies `bin/harnessed-inject-state.mjs` to `<harnessed-root>/bin/`. (Follow the existing file-copy convention in the install path; if none exists for `bin/`, add the copy in the same installer.)

- [ ] **Step 8: Run the full checkpoint + installer suites**

Run: `corepack pnpm vitest run tests/checkpoint/injectState.test.ts tests/installers`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
corepack pnpm exec biome check --write src/checkpoint/injectState.ts src/installers/injectHookAdd.ts src/installers/index.ts tests/checkpoint/injectState.test.ts
git add src/checkpoint/injectState.ts bin/harnessed-inject-state.mjs src/installers/injectHookAdd.ts src/installers/index.ts tests/checkpoint/injectState.test.ts
git commit -m "feat(installers): G4 per-turn workflow-state injection hook + UserPromptSubmit wiring"
```

---

## Task 9: G1 wire-in — set verify_mode when the verify sub completes

**Files:**
- Modify: `src/cli/checkpoint.ts` (complete action)
- Test: `tests/checkpoint/checkpoint-complete-planning.test.ts` (extend) or a new `tests/cli/checkpoint-scale.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/cli/checkpoint-scale.test.ts`: seed a ledger whose firing count exceeds the threshold (e.g. 5 fired subs), run `checkpoint complete <verify-sub>`, then read the envelope and assert `verify_mode === 'full'`. Use the `HARNESSED_ROOT_OVERRIDE` + `registerCheckpoint` harness from `tests/checkpoint/checkpoint-complete-planning.test.ts`. Assert that for a small ledger (1 fired sub, no git diff) `verify_mode === 'light'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tests/cli/checkpoint-scale.test.ts`
Expected: FAIL — `verify_mode` is undefined (never written).

- [ ] **Step 3: Wire verify_mode into the complete action**

In `src/cli/checkpoint.ts`, in the `complete` branch after the `mutateSubProgress((e) => markIfSeeded(e, sub, 'done', markOpts))` call and before reading back for `allResolved`, compute and persist `verify_mode`:

```typescript
        // G1 — recompute scale from the post-mark ledger + working-tree size and
        // record verify_mode on the envelope (advisory; consumed by the verify skill).
        const { collectScaleMetrics, assessScale } = await import('../checkpoint/scale.js')
        const { readCurrentWorkflow: readWf } = await import('../checkpoint/state.js')
        const { writeCurrentWorkflow } = await import('../checkpoint/state.js')
        const afterMark = await readWf()
        if (afterMark) {
          const metrics = await collectScaleMetrics(process.cwd(), afterMark.sub_progress ?? [])
          await writeCurrentWorkflow({ ...afterMark, verify_mode: assessScale(metrics) })
        }
```

(Place this before the existing `readCurrentWorkflow()` / `nextPending` block; the later read picks up the same persisted envelope.)

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tests/cli/checkpoint-scale.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full checkpoint suite (regression)**

Run: `corepack pnpm vitest run tests/checkpoint tests/cli`
Expected: PASS (no regression in existing complete/fail/planning tests).

- [ ] **Step 6: Commit**

```bash
corepack pnpm exec biome check --write src/cli/checkpoint.ts tests/cli/checkpoint-scale.test.ts
git add src/cli/checkpoint.ts tests/cli/checkpoint-scale.test.ts
git commit -m "feat(checkpoint): G1 wire-in — record verify_mode on sub completion"
```

---

## Task 10: G6 non-code half — break-loop skill doc

**Files:**
- Create: `docs/skills/break-loop.md` (or the project's skill-doc location — check `docs/` for convention)

- [ ] **Step 1: Write the skill doc**

Create `docs/skills/break-loop.md` capturing the Trellis 5-dimension root-cause framework as a prompt the operator runs when a `BREAK-LOOP` directive fires:

```markdown
# break-loop — deep analysis to escape fix-forget-repeat

Trigger: a `harnessed checkpoint fail` or `<workflow-state>` block reports
`BREAK-LOOP: sub '<x>' failed Nx`. Stop retrying the same fix. Analyze across 5 dimensions:

1. **Root cause category** — missing-spec / cross-layer-contract / change-propagation /
   test-coverage-gap / implicit-assumption.
2. **Why prior fixes failed** — surface fix / incomplete scope / tool limitation / wrong mental model.
3. **Prevention mechanism** — docs / architecture / compile-time / runtime / test / review.
4. **Systematic expansion** — where else does this class of bug live?
5. **Knowledge capture** — write the lesson to `.planning/` (GSD lessons) so the next
   session does not repeat it.
```

- [ ] **Step 2: Commit**

```bash
git add docs/skills/break-loop.md
git commit -m "docs(skill): G6 break-loop 5-dimension root-cause framework"
```

---

## Task 11: Full-suite green + spec reconciliation

- [ ] **Step 1: Run the full test suite**

Run: `corepack pnpm test`
Expected: PASS (all new + existing).

- [ ] **Step 2: Typecheck + lint**

Run: `corepack pnpm typecheck && corepack pnpm lint`
Expected: no errors.

- [ ] **Step 3: Reconcile the spec verified_refs**

Update `docs/superpowers/specs/2026-06-12-statemachine-g1-g7lite-design.md` `verified_refs` — flip each `(NEW)` entry to `(created)`. Commit:

```bash
git add docs/superpowers/specs/2026-06-12-statemachine-g1-g7lite-design.md
git commit -m "docs(spec): reconcile verified_refs — G1-G7lite shipped"
```

---

## Self-Review notes (author)

- **Spec coverage:** G1 (Task 3 + 9), G2 (Task 4), G3 (Task 5), G4 (Task 8), G6 (Task 6 + 10), G7-lite (Task 1 + 2 + 7). Schema (Task 1). All six goals mapped.
- **D-02 lock:** Task 1 Step 1 includes the regression guard asserting the top-level union stays 3-state.
- **Build order:** Task 1 (schema) → Task 2 (ledger) unblock everything; Tasks 3/4/5 are independent pure modules; Task 6 depends on Task 2's fail_count; Task 8 depends on Task 6's detectLoop; Tasks 9/10/11 finalize.
- **Type consistency:** `ScaleMetrics`, `NextStep`, `LoopHit`, `recoveryActions`, `buildWorkflowStateBlock` names are used identically across tasks and tests.
- **Open follow-up (next milestone):** G5 singleton→multi-workflow (breaking migration), deferred per spec.
