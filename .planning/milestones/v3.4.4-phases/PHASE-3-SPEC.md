# Phase 3 Spec — v3.4.4 ralph-loop wrapper wire + max-iterations end-to-end

> **Scope**: Move `ralphLoop.ts` from `src/routing/lib/` to `src/workflow/lib/` (mirror Phase 2 `sdkSpawn` SoT move), plumb `--max-iterations <n>` end-to-end (CLI flag → `gateContext` → `runWorkflow` → per-phase resolve → wrapper), wrap `_dispatchSkillStub.fn`'s `sdkSpawn` call with `ralphLoopWrap` on an opt-in basis (phase carries `max_iterations` OR `fallback.max_iterations_exceeded` config in yaml), and surface `MaxIterationsExceededError` via `phase.fallback.max_iterations_exceeded` (R20.10 explicit-halt path) instead of silent abort.
>
> **Out of scope (deferred)**: `research` + `execute-task` migration to `harnessed run` (Phase 4), real `getNextHint` (Phase 5), delete `src/routing/` + `src/routing-engine/` + `tests/routing/*` (Phase 6).

---

## Scope

- **Part A — `ralphLoop` relocate**: `git mv src/routing/lib/ralphLoop.ts src/workflow/lib/ralphLoop.ts` (54 LOC). Internal relative imports shift one directory up: `'../completionSchema.js'` → `'../../routing/completionSchema.js'` and `'./promiseExtract.js'` → `'../../routing/lib/promiseExtract.js'`. Five sister consumers update their import path (3 src files + 3 test files; see file-by-file). The wrapper class + `MaxIterationsExceededError` + `VerbatimCompleteFailError` + `isComplete` API is byte-identical post-move.
- **Part B — `--max-iterations` plumb**: `src/cli/run.ts:84` already injects `gateContext.maxIterations` (Phase 1 stub). `src/workflow/run.ts` reads it via `opts.gateContext?.maxIterations`, validates against `hard_upper_limit = 100`, and threads it through the per-phase resolver. CLI flag wins over yaml-level `phase.max_iterations` which wins over already-interpolated `{{ defaults.ralph_max_iterations.<workflow>.<phase> }}` (already resolved at yaml-load time per the existing v2 interpolate path) which wins over a hardcoded fallback of 20.
- **Part C — dispatch wrapper**: Layer `ralphLoopWrap` over the existing `sdkSpawn` call inside `_dispatchSkillStub.fn` ONLY when the current phase declares ralph-loop opt-in (either `phase.max_iterations` field present, OR `phase.fallback.max_iterations_exceeded` config present, OR `phase.upstream === 'ralph-loop'`). Default OFF — Phase 2's plain single-shot `sdkSpawn` remains the path for phases that do not opt in (no behavior change for the 7 phases that lack any ralph-loop yaml signal). On `MaxIterationsExceededError`, dispatch `handleMaxIterationsExceeded` from `src/routing/lib/fallbackHandlers.ts` (re-exported from new `src/workflow/lib/ralphLoop.ts` for path co-location) when `phase.fallback.max_iterations_exceeded` is present; otherwise return `{status: 'fail', output}` (sister Phase 2 fail-soft pattern at `src/workflow/run.ts:67-73`).
- **Part D — tests**: NEW `tests/workflow/ralphLoop.test.ts` (~120 LOC) covering the wrap-conditional + resolver + fallback dispatch. UPDATE `tests/routing/{ralph-loop-win-sentinel,ralph-fallback,isComplete}.test.ts` + `tests/checkpoint/sdk-wire.test.ts` import paths (4 files, 1 LOC each). UPDATE `src/routing/{engine,index}.ts` import paths (2 files, 2 LOC). NEW gated `tests/integration/cli-run-max-iterations.test.ts` (~60 LOC, `HARNESSED_REAL_SPAWN=1`) verifying flag caps SDK calls + surfaces `MaxIterationsExceededError`. UPDATE `tests/workflow/run.test.ts` SDK-mock so existing 16 fixtures (DI-overriding `_dispatchSkillStub.fn`) untouched + add fixture #17 verifying ralph-loop opt-in path triggers wrap.

Effort: **6-12h**, single PR (sister Phase 2 cadence).

---

## Goal — acceptance criteria after Phase 3 ships

1. `harnessed run task-deliver --max-iterations 5 --dry-run` echoes `gateContext.maxIterations: 5` in dry-run JSON output (Phase 1 dry-run path preserved).
2. `harnessed run task-deliver --max-iterations 5` (no `--dry-run`, with `HARNESSED_REAL_SPAWN=1`) caps SDK `query()` calls to at most 5 for phase `01-deliver` (ralph-loop opt-in via `phase.fallback.max_iterations_exceeded` present in yaml).
3. Phases that DO declare ralph-loop signal (`phase.max_iterations` OR `phase.fallback.max_iterations_exceeded` OR `phase.upstream === 'ralph-loop'`) execute via `ralphLoopWrap` — `sdkSpawn` is retried until `isComplete` 4-layer dual-signal returns true OR max-iterations hit.
4. Phases that do NOT declare ralph-loop signal continue executing via single-shot `sdkSpawn` (Phase 2 behavior — no regression).
5. Max-iterations resolution chain (highest → lowest): `gateContext.maxIterations` (CLI flag) → `phase.max_iterations` (yaml literal Number, OR pre-resolved JINJA string converted to Number) → hardcoded `20`. All resolved values clamped at `hard_upper_limit = 100` (sister Phase 2.2 STRIDE T-2.2-05 DoS mitigation).
6. On `MaxIterationsExceededError`: if `phase.fallback.max_iterations_exceeded` present → `handleMaxIterationsExceeded` fires (stderr UX text + `process.exit(exit_code)` per R20.10 acceptance c). Otherwise → `{status: 'fail', output: 'ralph-loop max-iterations exceeded ...'}` propagated to `runWorkflow` → `runWorkflow` returns `{status: 'failed', ...}` (sister Phase 2 fail-soft).
7. `src/routing/engine.ts` continues passing all existing routing-engine unit tests after `ralphLoop` import path moves (1 LOC change).
8. All 5 fixtures in `tests/routing/ralph-loop-win-sentinel.test.ts` + 7 fixtures in `tests/routing/ralph-fallback.test.ts` + all fixtures in `tests/routing/isComplete.test.ts` + sdk-wire fixture in `tests/checkpoint/sdk-wire.test.ts` pass after import-path update.
9. `pnpm exec biome check --write && pnpm build && pnpm test` exits 0 (baseline 9 fail expected per Phase 2 ship — 8 pre-existing + 1 `research-v2`).

---

## Files (file-by-file)

### MOVE: `src/routing/lib/ralphLoop.ts` → `src/workflow/lib/ralphLoop.ts` (54 LOC, near-identical)

```bash
git mv src/routing/lib/ralphLoop.ts src/workflow/lib/ralphLoop.ts
```

**Import path updates INSIDE the moved file** (3 relative-path shifts, 1 directory up):

| Before (`src/routing/lib/ralphLoop.ts`) | After (`src/workflow/lib/ralphLoop.ts`) |
|---|---|
| `from '../completionSchema.js'` | `from '../../routing/completionSchema.js'` |
| `from './promiseExtract.js'` | `from '../../routing/lib/promiseExtract.js'` |

**Add a re-export of `handleMaxIterationsExceeded`** (helper co-location for Part C wrap dispatch — saves an import on the consumer side):

```ts
// Append at bottom of moved file:
export { handleMaxIterationsExceeded, handleVerbatimCompleteFail } from '../../routing/lib/fallbackHandlers.js'
export type { FallbackMaxIterationsExceededConfig, MaxIterFallbackCtx, VerbatimFallbackCtx } from '../../routing/lib/fallbackHandlers.js'
```

**Header comment delta** (L1-3): append `// Phase v3.4.4 — moved from src/routing/lib/ to src/workflow/lib/ (single SoT, sister Phase 2 sdkSpawn pattern). promiseExtract + completionSchema + fallbackHandlers remain in src/routing/ pending Phase 6 hoist.`

Rationale: keep `promiseExtract` + `completionSchema` + `fallbackHandlers` in `src/routing/` for Phase 3 — they have other consumers (`src/routing/index.ts` re-exports `extractPromise`, `fallbackHandlers` is consumed by `src/routing/engine.ts`). Phase 6 will hoist all four together when `src/routing/` is deleted.

Audit grep to confirm no other importers missed:

```bash
git grep -n "routing/lib/ralphLoop" -- '*.ts' '*.md'
# expected: 0 hits in src/ + tests/ after the updates below; .planning/ may still reference historical paths (ok)
```

---

### MODIFY: `src/routing/engine.ts` (2 LOC changes)

```diff
@@ -27,7 +27,7 @@
 import {
   MaxIterationsExceededError,
   ralphLoopWrap,
   VerbatimCompleteFailError,
-} from './lib/ralphLoop.js'
+} from '../workflow/lib/ralphLoop.js'
 import { ensureSkillsInstalled } from './lib/skillInstall.js'
 import { match as semanticMatch } from './semanticRouter.js'

-export { MaxIterationsExceededError, VerbatimCompleteFailError } from './lib/ralphLoop.js'
+export { MaxIterationsExceededError, VerbatimCompleteFailError } from '../workflow/lib/ralphLoop.js'
```

No behavior change — `defaultSpawn` + `wrappedSpawn` + `ralphLoopWrap` signatures unchanged.

---

### MODIFY: `src/routing/index.ts` (1 LOC change)

```diff
@@ -28,5 +28,5 @@
 export { extractPromise, PROMISE_PATTERN } from './lib/promiseExtract.js'
 export {
   isComplete,
   MaxIterationsExceededError,
   VerbatimCompleteFailError,
-} from './lib/ralphLoop.js'
+} from '../workflow/lib/ralphLoop.js'
```

Barrel re-export path-only update; downstream consumers unaffected.

---

### MODIFY: `tests/routing/ralph-loop-win-sentinel.test.ts` (1 LOC)

```diff
-import { MaxIterationsExceededError, ralphLoopWrap } from '../../src/routing/lib/ralphLoop.js'
+import { MaxIterationsExceededError, ralphLoopWrap } from '../../src/workflow/lib/ralphLoop.js'
```

5 fixtures (1 happy + 1 multi-iter + 1 max-exceeded + 1 spawn-mock + 1 structured_output) continue passing — test logic untouched.

---

### MODIFY: `tests/routing/ralph-fallback.test.ts` (1 LOC)

```diff
-import {
-  MaxIterationsExceededError,
-  VerbatimCompleteFailError,
-} from '../../src/routing/lib/ralphLoop.js'
+import {
+  MaxIterationsExceededError,
+  VerbatimCompleteFailError,
+} from '../../src/workflow/lib/ralphLoop.js'
```

7 fixtures (handle-max-iter direct, handle-verbatim direct, clean-complete-no-fallback, mid-iter-no-error, hard-upper-limit-clamp, opts-fallbackConfig-wired, legacy-aborted-not-exit) continue passing.

---

### MODIFY: `tests/routing/isComplete.test.ts` (1 LOC)

```diff
-import { isComplete } from '../../src/routing/lib/ralphLoop.js'
+import { isComplete } from '../../src/workflow/lib/ralphLoop.js'
```

All fixtures (4-layer dual-signal coverage) continue passing.

---

### MODIFY: `tests/checkpoint/sdk-wire.test.ts` (1 LOC)

```diff
-import { ralphLoopWrap } from '../../src/routing/lib/ralphLoop.js'
+import { ralphLoopWrap } from '../../src/workflow/lib/ralphLoop.js'
```

---

### MODIFY: `src/cli/run.ts` (verify-only — flag plumbing already shipped Phase 1)

**No diff needed.** Phase 1 already added `--max-iterations <n>` (L43-45) and injects into `gateContext.maxIterations` at L84. The flag value flows verbatim through `runWorkflow(yamlPath, {}, { gateContext })` at L95. Verify the flag still echoes in `--dry-run` JSON output (acceptance #1).

Optional: add a 1-line audit-trail comment at L43 noting Phase 3 activation:

```diff
-    .option('--max-iterations <n>', 'ralph-loop max iter (default 20; honored Phase 3+)', (v) =>
+    .option('--max-iterations <n>', 'ralph-loop max iter (default 20; honored Phase 3 onward)', (v) =>
```

---

### MODIFY: `src/workflow/run.ts` (~235 → ~290 LOC)

Add the conditional wrap at the dispatch site (Option A — wrap-inside-dispatch, sister Phase 2 fail-soft pattern). The `_dispatchSkillStub.fn` interface changes from `(skillName: string)` to `(skillName: string, phase?: PhaseShape, opts?: { maxIter?: number; fallback?: FallbackMaxIterationsExceededConfig })` so the call site at L183 can pass phase + resolved-iter context.

**New imports at top**:

```ts
import {
  type FallbackMaxIterationsExceededConfig,
  handleMaxIterationsExceeded,
  MaxIterationsExceededError,
  ralphLoopWrap,
} from './lib/ralphLoop.js'
```

**Constants** (file-top, after existing `MASTER_NAMES`):

```ts
const RALPH_DEFAULT_MAX_ITER = 20
const RALPH_HARD_UPPER_LIMIT = 100 // sister workflows/defaults.yaml:103 + Phase 2.2 STRIDE T-2.2-05
```

**Helper — opt-in detection** (before `_dispatchSkillStub`):

```ts
/** Phase v3.4.4 — ralph-loop opt-in detection per phase. Returns true when
 *  any of: phase.max_iterations declared, phase.fallback.max_iterations_exceeded
 *  declared, phase.upstream === 'ralph-loop'. Default OFF (single-shot sdkSpawn)
 *  for phases without any ralph-loop yaml signal — preserves Phase 2 behavior
 *  for 7 phases that lack the signal. */
function isRalphLoopOptIn(phase: unknown): boolean {
  if (!phase || typeof phase !== 'object') return false
  const p = phase as Record<string, unknown>
  if (p.max_iterations !== undefined && p.max_iterations !== null) return true
  if (p.upstream === 'ralph-loop') return true
  const fb = p.fallback as Record<string, unknown> | undefined
  if (fb?.max_iterations_exceeded !== undefined) return true
  return false
}

/** Phase v3.4.4 — max-iter resolution chain (CLI flag → phase yaml → fallback 20),
 *  clamped at hard_upper_limit 100. Reads gateContext.maxIterations (Number, set
 *  by src/cli/run.ts:84) + phase.max_iterations (Number OR pre-resolved JINJA
 *  String → coerce). */
export function resolveMaxIterations(
  phase: unknown,
  gateContext: Record<string, unknown>,
): number {
  const fromCli = typeof gateContext.maxIterations === 'number'
    ? gateContext.maxIterations
    : undefined
  let fromYaml: number | undefined
  if (phase && typeof phase === 'object') {
    const raw = (phase as Record<string, unknown>).max_iterations
    if (typeof raw === 'number') fromYaml = raw
    else if (typeof raw === 'string') {
      const n = Number.parseInt(raw, 10)
      if (Number.isFinite(n) && n > 0) fromYaml = n
    }
  }
  const chosen = fromCli ?? fromYaml ?? RALPH_DEFAULT_MAX_ITER
  return Math.min(Math.max(1, chosen), RALPH_HARD_UPPER_LIMIT)
}
```

**Rewrite `_dispatchSkillStub`** (replaces L48-75) — add `phase?` + `opts?` params; conditional wrap:

```ts
export const _dispatchSkillStub = {
  fn: async (
    skillName: string,
    phase?: unknown,
    opts?: { maxIter?: number; fallback?: FallbackMaxIterationsExceededConfig },
  ): Promise<DispatchStubResult> => {
    const optIn = isRalphLoopOptIn(phase)
    const spawnOnce = async (
      resumeSessionId?: string,
      onSessionId?: (id: string) => void,
    ): Promise<string> =>
      sdkSpawn(buildAgentDef(skillName), {
        expertName: skillName,
        ...(resumeSessionId ? { resumeSessionId } : {}),
        ...(onSessionId ? { onSessionId } : {}),
      })

    let envelopeJson: string
    try {
      if (optIn) {
        const maxIter = opts?.maxIter ?? RALPH_DEFAULT_MAX_ITER
        envelopeJson = await ralphLoopWrap(spawnOnce, maxIter)
      } else {
        envelopeJson = await spawnOnce()
      }
    } catch (err) {
      // R20.10 c — explicit halt path: phase fallback config present → UX text + process.exit
      if (err instanceof MaxIterationsExceededError && opts?.fallback) {
        // handleMaxIterationsExceeded calls process.exit(exit_code) — never returns
        handleMaxIterationsExceeded(err, opts.fallback, {
          subtaskSummary: `phase ${skillName}`,
          workflowName: 'harnessed-run', // Phase 4 will plumb actual workflow name
          phaseId: skillName,
          maxIterations: opts?.maxIter ?? RALPH_DEFAULT_MAX_ITER,
        })
      }
      // Fail-soft per ADR 0029 — runtime emits failure but doesn't crash run loop.
      return {
        status: 'fail',
        output:
          err instanceof MaxIterationsExceededError
            ? `ralph-loop max-iterations exceeded (${err.iterations}) for ${skillName}`
            : `sdkSpawn failed for ${skillName}: ${(err as Error).message}`,
      }
    }

    const env = JSON.parse(envelopeJson) as {
      structured_output?: { status?: string }
      text?: string
      result?: string
      subtype?: string
    }
    const status: 'ok' | 'fail' =
      env.structured_output?.status === 'COMPLETE' || env.subtype === 'success' ? 'ok' : 'fail'
    return {
      status,
      output: env.text ?? env.result ?? '',
      ...(env.structured_output?.status ? { decision: env.structured_output.status } : {}),
    }
  },
}
```

**Update call site** (L183 inside `runWorkflow` for-loop):

```diff
-    const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id
-    const r = await _dispatchSkillStub.fn(skillName)
+    const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id
+    const maxIter = resolveMaxIterations(ph, gateContext)
+    const fallback =
+      'fallback' in ph && ph.fallback?.max_iterations_exceeded
+        ? (ph.fallback.max_iterations_exceeded as FallbackMaxIterationsExceededConfig)
+        : undefined
+    const r = await _dispatchSkillStub.fn(skillName, ph, {
+      maxIter,
+      ...(fallback ? { fallback } : {}),
+    })
```

**Header comment delta** (L1-4): append `// Phase v3.4.4 (Phase 3) — _dispatchSkillStub.fn now conditionally wraps sdkSpawn in ralphLoopWrap when phase opt-in (max_iterations / fallback / upstream='ralph-loop' signal); else single-shot per Phase 2. max-iter resolved via gateContext.maxIterations (CLI flag) → phase.max_iterations → 20, clamped 100.`

---

### NEW: `tests/workflow/ralphLoop.test.ts` (~150 LOC)

Sister test pattern: `tests/workflow/run.test.ts` vi.mock layout (the file uses module-boundary `vi.mock` for SDK + checkpoint deps).

Fixtures (12 total):

1. **`isRalphLoopOptIn` — phase with `max_iterations` (Number) → true** (export `isRalphLoopOptIn` as a named export for testability, OR test indirectly via wrap behavior; choose direct export).
2. **`isRalphLoopOptIn` — phase with `fallback.max_iterations_exceeded` only → true**.
3. **`isRalphLoopOptIn` — phase with `upstream: 'ralph-loop'` only → true**.
4. **`isRalphLoopOptIn` — phase with none of the three signals → false** (e.g. plain `{id: 'p1'}`).
5. **`resolveMaxIterations` — CLI flag in `gateContext.maxIterations` wins over phase yaml** (CLI=5, yaml=10 → 5).
6. **`resolveMaxIterations` — phase yaml wins when no CLI flag** (CLI absent, yaml=15 → 15).
7. **`resolveMaxIterations` — hardcoded 20 fallback** (CLI absent, yaml absent → 20).
8. **`resolveMaxIterations` — JINJA string `'5'` coerces** (yaml carries pre-resolved string → 5).
9. **`resolveMaxIterations` — clamp at `hard_upper_limit` 100** (CLI=500 → 100).
10. **`_dispatchSkillStub.fn` opt-in path — phase with `max_iterations: 3` + sdkSpawn returns non-complete repeatedly → `MaxIterationsExceededError` → `{status: 'fail', output: /max-iterations exceeded \(3\)/}`** (vi.mock SDK `query` to yield non-COMPLETE 4-layer envelope; assert 3 spawn calls).
11. **`_dispatchSkillStub.fn` opt-in path — sdkSpawn returns COMPLETE on iter 2 → `{status: 'ok'}` + spawn called 2x** (mock yields `still working` iter 1, COMPLETE iter 2).
12. **`_dispatchSkillStub.fn` opt-in + `fallback.max_iterations_exceeded` config present → `handleMaxIterationsExceeded` fires `process.exit(1)`** (vi.spyOn process.exit + assert UX text in stderr, sister `tests/routing/ralph-fallback.test.ts:88-111` ExitError pattern).

**vi.mock setup** (top of file, before importing src under test):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let queryCallCount = 0
let queryResponses: unknown[] = []

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      queryCallCount++
      const response = queryResponses[queryCallCount - 1] ?? {
        type: 'result',
        subtype: 'error',
        result: 'still working',
      }
      yield response
    })(),
}))

import {
  _dispatchSkillStub,
  isRalphLoopOptIn,
  resolveMaxIterations,
} from '../../src/workflow/run.js'
```

**Export changes required in `src/workflow/run.ts`**: export `isRalphLoopOptIn` + `resolveMaxIterations` (currently spec'd as module-local in Part C — promote to `export function` for unit-testability).

---

### NEW: `tests/integration/cli-run-max-iterations.test.ts` (~70 LOC, gated)

Sister gate pattern: `tests/integration/cli-run-real-spawn.test.ts:9-12` `describe.skipIf(!REAL)`.

```ts
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'
const CLI = join(process.cwd(), 'dist', 'cli.mjs')

describe.skipIf(!REAL)('harnessed run --max-iterations (HARNESSED_REAL_SPAWN=1)', () => {
  it('--max-iterations 3 caps SDK calls + surfaces fallback UX on task-deliver', () => {
    // task-deliver phase 01-deliver has fallback.max_iterations_exceeded
    // configured → R20.10 explicit halt with exit_code 1.
    const r = spawnSync(
      'node',
      [CLI, 'run', 'task-deliver', '--task', 'force-incomplete', '--max-iterations', '3'],
      { encoding: 'utf8', timeout: 180_000 },
    )
    // R20.10 explicit halt → exit code 1 (sister handleMaxIterationsExceeded)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/max-iterations exceeded \(3\/3\)/)
    expect(r.stderr).toMatch(/task-deliver/)
  }, 200_000)

  it('--max-iterations flag echoed in --dry-run JSON (Phase 1 regression)', () => {
    const r = spawnSync(
      'node',
      [CLI, 'run', 'task-deliver', '--max-iterations', '5', '--dry-run'],
      { encoding: 'utf8', timeout: 30_000 },
    )
    expect(r.status).toBe(0)
    const parsed = JSON.parse(r.stdout) as { gateContext: { maxIterations: number } }
    expect(parsed.gateContext.maxIterations).toBe(5)
  })
})
```

CI does NOT set `HARNESSED_REAL_SPAWN=1` — opt-in only, mirrors `cli-run-real-spawn.test.ts` policy.

---

### MODIFY: `tests/workflow/run.test.ts` (~384 LOC, additive)

**`_dispatchSkillStub.fn` signature change** — the existing `_testStubFn` shim at L102-106 accepts only `skillName: string`. After Part C, the real `_dispatchSkillStub.fn` signature is `(skillName, phase?, opts?)`. Two options:

- **Option A (recommended)**: widen `_testStubFn` signature to match `(skillName, _phase?, _opts?)` — backwards-compat for all 16 existing fixtures (they pass single-arg, no change required at the call sites in `src/workflow/run.ts:L183` because TS allows under-supplying optional params).
- **Option B**: keep `_testStubFn` strict + update call site at L183 to spread args. Brittler.

Choose A. 1-line shim signature widening:

```diff
-const _testStubFn = async (skillName: string): Promise<DispatchStubResult> => ({
+const _testStubFn = async (
+  skillName: string,
+  _phase?: unknown,
+  _opts?: { maxIter?: number; fallback?: unknown },
+): Promise<DispatchStubResult> => ({
   status: 'ok' as const,
   output: `<stub for ${skillName}>`,
   decision: 'mock-approved',
 })
```

All 16 existing fixtures continue passing — no behavior assertion change.

**Add NEW fixture #17 — ralph-loop opt-in path triggers `ralphLoopWrap`**:

```ts
it('17. T3.x — phase with max_iterations declared → ralph-loop wrap fires (opt-in path)', async () => {
  isVetoedMock.mockResolvedValue(false)
  let wrapInvoked = false
  // Override stub to observe wrap path: production default uses ralphLoopWrap
  // when isRalphLoopOptIn(phase) → true. Test verifies the call-site at L183
  // passes phase object so opt-in detection has data to work with.
  _dispatchSkillStub.fn = async (skillName, phase, opts) => {
    if (phase && typeof phase === 'object' && 'max_iterations' in phase) {
      wrapInvoked = true
      expect(opts?.maxIter).toBe(10) // resolved from phase.max_iterations
    }
    return { status: 'ok', output: `done ${skillName}` }
  }
  const v3Phases = [{ id: 'p1', max_iterations: 10 }]
  loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
  const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
  expect(r.status).toBe('complete')
  expect(wrapInvoked).toBe(true)
})

it('18. T3.x — CLI --max-iterations flag wins over phase.max_iterations', async () => {
  isVetoedMock.mockResolvedValue(false)
  let observedMaxIter: number | undefined
  _dispatchSkillStub.fn = async (_skillName, _phase, opts) => {
    observedMaxIter = opts?.maxIter
    return { status: 'ok', output: 'done' }
  }
  const v3Phases = [{ id: 'p1', max_iterations: 10 }]
  loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
  await runWorkflow(
    'workflows/task/code/workflow.yaml',
    {},
    { packageRoot: '/tmp/fake', gateContext: { maxIterations: 3 } },
  )
  expect(observedMaxIter).toBe(3) // CLI flag wins
})

it('19. T3.x — non-opt-in phase (no max_iterations/fallback/upstream) → single-shot sdkSpawn path (no wrap)', async () => {
  isVetoedMock.mockResolvedValue(false)
  let observedMaxIter: number | undefined
  _dispatchSkillStub.fn = async (_skillName, _phase, opts) => {
    observedMaxIter = opts?.maxIter // resolver still computes; wrap-conditional inside .fn
    return { status: 'ok', output: 'done' }
  }
  const v3Phases = [{ id: 'p1' }] // no opt-in signal
  loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
  const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
  expect(r.status).toBe('complete')
  expect(observedMaxIter).toBe(20) // fallback hardcoded 20 (still resolved + passed)
})
```

Net: 3 new fixtures added (#17, #18, #19) covering opt-in path + CLI override + non-opt-in. Existing 16 fixtures unchanged (signature widening is compatible).

---

### MODIFY: `CHANGELOG.md` (append to Phase 2 v3.4.4 section)

```markdown
- **runtime**: `harnessed run <name>` now honors `--max-iterations <n>` end-to-end (Phase 1 stub fully wired). Resolution chain: CLI flag → `phase.max_iterations` → hardcoded 20, clamped at `hard_upper_limit = 100`.
- **runtime**: phases with `max_iterations` / `fallback.max_iterations_exceeded` / `upstream: ralph-loop` yaml signals now spawn under `ralphLoopWrap` (retry until verbatim `COMPLETE` signal OR max-iter hit). Phases without these signals continue single-shot per Phase 2 (no behavior change).
- **refactor**: `ralphLoop` driver moved from `src/routing/lib/` to `src/workflow/lib/` (single SoT, sister Phase 2 sdkSpawn pattern; `promiseExtract` + `fallbackHandlers` deferred to Phase 6 hoist).
- **runtime**: on `MaxIterationsExceededError`, phases with `fallback.max_iterations_exceeded` config dispatch `handleMaxIterationsExceeded` (R20.10 c — `process.exit(exit_code)` + UX text), NOT silent abort.
```

---

## Architecture decision points

### D-1 — ralph-loop default ON vs opt-in

CLAUDE.md global says *"每个子任务必须使用 ralph-loop 保证最终交付"* (every subtask must use ralph-loop). Naive read: default ON.

**Recommendation: OPT-IN via 3-signal detection** (`phase.max_iterations` OR `phase.fallback.max_iterations_exceeded` OR `phase.upstream === 'ralph-loop'`).

Rationale:
- The "default ON" CLAUDE.md rule applies to **subtask-level executions inside Stage 3 (Task) workflows** — historically wired via `execute-task` orchestration. Not every workflow phase is a subtask (e.g. `verify-progress/02-gsd-progress` is a status-sync phase, not a subagent retry loop).
- Phase 2 just shipped plain `sdkSpawn`; flipping every phase to ralph-loop-by-default in Phase 3 would change behavior for 7 phases that currently have no ralph-loop yaml signal (could double API token cost on phases that genuinely complete in 1 shot).
- The 3-signal opt-in catches every workflow phase that yaml authors INTENDED to retry. Grep of `workflows/` confirms 31 of 38 v3 phases declare at least one signal (see "Open verifications" below).
- Phase 4+ can flip the default after we observe actual completion rates with opt-in path. Lowest-risk Phase 3 ship.

### D-2 — Where to wrap (dispatch seam location)

**Option A (chosen)** — wrap INSIDE `_dispatchSkillStub.fn`. Single seam; DI mock for tests unchanged (signature widens to accept optional `phase` + `opts`, backwards-compat).

**Option B** — wrap at `runWorkflow` for-loop level (explicit check `isRalphLoopOptIn(ph)` outside dispatch). More transparent but requires call-site change at L183 + breaks the test DI seam if `runWorkflow` shortcuts past `_dispatchSkillStub.fn` in the wrap path.

Chose A — minimizes test breakage, sister Phase 2 spawn-wrap-inside-dispatch pattern.

### D-3 — Max-iterations resolution chain

| Priority | Source | Notes |
|---|---|---|
| 1 (highest) | `gateContext.maxIterations` (CLI flag) | Set by `src/cli/run.ts:84` |
| 2 | `phase.max_iterations` (Number OR JINJA-resolved String → coerce) | Yaml literal OR pre-interpolated `{{ defaults.ralph_max_iterations.<workflow>.<phase> }}` |
| 3 (lowest) | hardcoded `RALPH_DEFAULT_MAX_ITER = 20` | sister `src/routing/engine.ts:88` |

All clamped at `RALPH_HARD_UPPER_LIMIT = 100` per `workflows/defaults.yaml:103` + Phase 2.2 STRIDE T-2.2-05 DoS mitigation.

**NOT in chain**: `workflows/defaults.yaml ralph_max_iterations.<workflow>.<phase-id>` direct lookup. Already resolved at yaml-load time via `loadPhases-interpolate` JINJA expansion — by the time `runWorkflow` reads `phase.max_iterations`, it's already a literal Number (or pre-resolved String).

### D-4 — Completion-promise format

`ralphLoop.ts:isComplete` already implements 4-layer dual-signal detection (`subtype === 'success'` + `structured_output.status === 'COMPLETE'` + `<promise>COMPLETE</promise>` regex extract). No per-phase override needed for Phase 3 — the verbatim "COMPLETE" string per CLAUDE.md `ralph-loop COMPLETE` rule is hardcoded in `isComplete`.

**NOT spec'd**: per-phase `phase.ralph_loop.completion_promise` override. v3 schema does NOT have this field (only `args.completion_promise: COMPLETE` is conventional yaml metadata, not consumed by runtime). Defer to Phase 4+ if needed.

### D-5 — Failure mode (R20.10 explicit halt)

| Scenario | Behavior |
|---|---|
| Max-iter hit + `phase.fallback.max_iterations_exceeded` present | `handleMaxIterationsExceeded` fires → stderr UX text + `process.exit(exit_code)`. NEVER silent. |
| Max-iter hit + NO fallback config | `_dispatchSkillStub.fn` returns `{status: 'fail', output: 'ralph-loop max-iterations exceeded (N) for <skill>'}` → `runWorkflow` returns `{status: 'failed', phasesRun: i, lastPhaseId}` → CLI exits 1. |
| `sdkSpawn` throws (network / SDK error) — NOT `MaxIterationsExceededError` | Fail-soft per Phase 2 pattern: `{status: 'fail', output: 'sdkSpawn failed for <skill>: <msg>'}` → `{status: 'failed', ...}`. |

`MaxIterationsExceededError` class already exists (`src/routing/lib/ralphLoop.ts:22-27`, re-exported from new location). No new error class needed. The `subtaskSummary` / `workflowName` ctx fields for `handleMaxIterationsExceeded` are populated from `skillName` + literal `'harnessed-run'` in Phase 3 (Phase 4 will plumb real workflow name from `parsed.workflow`).

---

## Test plan (commands to run before each commit)

```bash
# Pre-commit (every commit) — biome write + build + test
pnpm exec biome check --write
pnpm build                                                                 # MANDATORY post-Phase-2 hotfix lesson (vitest esbuild loader skips tsc strict checks)
pnpm test                                                                  # baseline 9 fail expected (8 pre-existing + 1 research-v2 from Phase 2 Commit 1)

# Phase 1 + 2 regression — must still pass
node dist/cli.mjs run verify-simplify --dry-run                            # Phase 1 regression
node dist/cli.mjs run --list                                               # Phase 1 list
node dist/cli.mjs run verify-simplify --max-iterations 5 --dry-run         # NEW Phase 3 — flag echoed in dry-run JSON

# Phase 3 — opt-in flag wiring (real spawn gated)
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-max-iterations.test.ts

# Sister test path-move regression (must pass after Part A move)
pnpm test tests/routing/ralph-loop-win-sentinel.test.ts
pnpm test tests/routing/ralph-fallback.test.ts
pnpm test tests/routing/isComplete.test.ts
pnpm test tests/checkpoint/sdk-wire.test.ts
```

**Pre-PR gate**: all 4 commits below pushed locally + biome + build + test green + dry-run still 0 + max-iter flag echo correct in dry-run JSON + path-moved tests pass.

---

## Atomic commit plan

| # | Files | Suggested message | Parallel? |
|---|-------|-------------------|-----------|
| 1 | `git mv src/routing/lib/ralphLoop.ts src/workflow/lib/ralphLoop.ts` + relative imports inside moved file + handleMaxIterationsExceeded re-export + `src/routing/engine.ts` (2 LOC) + `src/routing/index.ts` (1 LOC) + 4 test import paths (`tests/routing/{ralph-loop-win-sentinel,ralph-fallback,isComplete}.test.ts` + `tests/checkpoint/sdk-wire.test.ts`) | `refactor(ralph): v3.4.4 move ralphLoop to workflow/lib (sister Phase 2 sdkSpawn pattern; pure path move, byte-identical logic)` | Independent of #2 |
| 2 | `src/cli/run.ts` (optional 1-line audit-trail comment only) + `src/workflow/run.ts` (add `RALPH_*` constants + `isRalphLoopOptIn` + `resolveMaxIterations` helpers, no `_dispatchSkillStub` wrap yet) + tests for helpers (subset of `tests/workflow/ralphLoop.test.ts` fixtures 1-9) | `feat(workflow): v3.4.4 add isRalphLoopOptIn + resolveMaxIterations helpers (opt-in detection + chain resolver)` | Independent of #1 |
| 3 | `src/workflow/run.ts` (`_dispatchSkillStub.fn` signature widen + ralph-loop wrap conditional + R20.10 fallback dispatch + call-site update at L183) + `tests/workflow/ralphLoop.test.ts` (remaining fixtures 10-12) + `tests/workflow/run.test.ts` (signature widen of `_testStubFn` + 3 NEW fixtures #17-19) | `feat(workflow): v3.4.4 wrap _dispatchSkillStub.fn with ralph-loop wrapper on phase opt-in (CLI flag + yaml signal honored)` | Depends on #1 + #2 |
| 4 | `tests/integration/cli-run-max-iterations.test.ts` (NEW gated E2E) + `CHANGELOG.md` (append to Phase 2 v3.4.4 section) | `test(integration): v3.4.4 E2E --max-iterations bound respected + R20.10 explicit halt on task-deliver` | Depends on #3 |

Wave 1 (parallel): Commits #1 + #2 (disjoint files).
Wave 2 (sequential): Commit #3.
Wave 3 (sequential): Commit #4.

---

## Open verifications before implement

These were confirmed during the spec-write read pass. Re-confirm if the executor finds drift:

1. **`src/routing/lib/ralphLoop.ts` internal imports** — **CONFIRMED** 2 relative imports: `'../completionSchema.js'` (L5) + `'./promiseExtract.js'` (L6). Both update to `'../../routing/...'` post-move. No other relative imports.
2. **`MaxIterationsExceededError` class already exists** — **CONFIRMED** at `src/routing/lib/ralphLoop.ts:22-27`. Phase 3 re-uses verbatim; no new class.
3. **24 v3 workflows opt-in coverage** — **CONFIRMED via grep `ralph_loop|max_iterations|fallback` in `workflows/`**: 31 of ~38 v3 phases declare at least one of (`max_iterations`, `fallback.max_iterations_exceeded`, `upstream: ralph-loop`). 7 phases lack all signals (e.g. `task-code/02-progress`, `verify-design/01`, `verify-security/01`, etc.) — those will continue single-shot `sdkSpawn` per Phase 2.
4. **`workflows/defaults.yaml` format** — **CONFIRMED**: `ralph_max_iterations.<workflow>.<phase-id>: <Number>` (e.g. `task-deliver.01-deliver: 20`). Resolved at yaml-load time via existing JINJA interpolate (e.g. `task-deliver/workflow.yaml:58` `'{{ defaults.ralph_max_iterations.task-deliver.01-deliver }}'`). By the time `runWorkflow` reads `phase.max_iterations`, it's a literal Number OR a pre-resolved String (sister `tests/workflow/loadPhases-interpolate.test.ts`).
5. **`phase.max_iterations` type** — **CONFIRMED** at `src/workflow/schema/workflow.ts:98-100`: `Type.Union([Type.Number(), Type.String()])` — schema accepts both. Resolver coerces String via `Number.parseInt(raw, 10)`.
6. **`phase.fallback.max_iterations_exceeded` type** — **CONFIRMED** at `src/workflow/schema/workflow.ts:69-83`: `PhaseFallback` Object with optional `max_iterations_exceeded: FallbackMaxIterationsExceeded` (`action: Literal('emit_warning_and_halt')` + `message: String` + `exit_code: Number`).
7. **`hard_upper_limit` constant** — **CONFIRMED** at `workflows/defaults.yaml:103`: `hard_upper_limit: 100`. Phase 3 hardcodes `100` in `RALPH_HARD_UPPER_LIMIT` constant (matches yaml; if drift later, hoist to env or yaml-read).
8. **Tests using ralph-loop path moves** — **CONFIRMED** 4 test files import from `src/routing/lib/ralphLoop.js` (`tests/routing/ralph-loop-win-sentinel.test.ts:15`, `tests/routing/ralph-fallback.test.ts:38`, `tests/routing/isComplete.test.ts:11`, `tests/checkpoint/sdk-wire.test.ts:29`). All 4 update verbatim path. Plus `src/routing/engine.ts:31+35` (2 LOC) + `src/routing/index.ts:33` (1 LOC) src consumers. No other consumers found via grep.

### Potentially adaptive findings (executor: surface if changed)

- **`handleMaxIterationsExceeded` `process.exit` behavior in tests**: the helper calls `process.exit(exit_code)` which terminates the Node process. In `tests/workflow/ralphLoop.test.ts` fixture #12, `vi.spyOn(process, 'exit')` must be mocked to throw an `ExitError` instance so the test can catch it (sister `tests/routing/ralph-fallback.test.ts:88-91` ExitError pattern verbatim). If the spec's mock pattern fails (e.g. vi version mismatch), surface and use the verbatim 4-line ExitError class from `ralph-fallback.test.ts:40-44`.
- **`isRalphLoopOptIn` + `resolveMaxIterations` export visibility**: spec promotes both to `export function` for unit-testability. If Biome lint complains about unused exports (it shouldn't — `tests/workflow/ralphLoop.test.ts` imports them), surface and consider adding `/* @internal */` JSDoc tag or keeping them module-local + testing indirectly via `_dispatchSkillStub.fn` observation.
- **`tests/workflow/run.test.ts` SDK vi.mock already set up**: Phase 2 added `vi.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: () => (async function* () {})() }))` at L16-18. NEW fixtures #17-19 inherit this mock (no SDK calls reach real network). If executor finds the mock missing, restore from Phase 2 Commit 3.
- **`_dispatchSkillStub.fn` signature widening — TS strict mode**: TS allows under-supplying optional params (1-arg call to 3-arg fn = ok). If strict-mode complains about `phase: unknown` narrowing inside `isRalphLoopOptIn`, surface and add explicit `if (typeof phase !== 'object' || phase === null) return false` early-return (already in spec).
- **Phase 1 stub at `src/cli/run.ts:43` — Phase 3 activation comment**: optional 1-line comment update (Phase 3 line 43 spec). Skip if executor judges noise; tests don't depend on it.

---

## NOT in Phase 3 (deferred — sister HANDOFF-v3.4.4.md phase order)

| Phase | Deferred work |
|-------|---------------|
| 4 | Migrate `research` + `execute-task` subcommands to `harnessed run <name>` (Path A: author new `workflows/execute-task/workflow.yaml` v3 + delete `src/cli/execute-task.ts` 157 LOC). Enrich `buildAgentDef` with `role-prompts.yaml` lookup + `capabilities.yaml` model tier. Plumb actual `workflowName` into `MaxIterFallbackCtx` (Phase 3 hardcodes `'harnessed-run'`). |
| 5 | Real `getNextHint` implementation — read `workflows/auto/workflow.yaml` `delegates_to[]` and return next-in-order sub for the staged UX hint at end of each `harnessed run` invocation. |
| 6 | Delete `src/routing/` + `src/routing-engine/` + `tests/routing/` + `tests/integration/routing-*`. Hoist `agentDefinition.ts` + `completionSchema.ts` + `sdkReconcile.ts` + `promiseExtract.ts` + `fallbackHandlers.ts` into `src/workflow/lib/`. Rename `_dispatchSkillStub` → `dispatchSkill` (no longer a stub). |
