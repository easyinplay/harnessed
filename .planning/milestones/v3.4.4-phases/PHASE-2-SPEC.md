# Phase 2 Spec — v3.4.4 v3 dispatch arm + sdkSpawn move + real `_dispatchSkillStub` impl

> **Scope**: Land the v3 schema dispatch arm in `loadPhases.ts`, relocate the `sdkSpawn` driver from `src/routing/lib/` to `src/workflow/lib/` (single SoT), and replace the literal `<stub for X>` placeholder in `_dispatchSkillStub.fn` with a real `sdkSpawn`-backed implementation. After Phase 2 ships, `harnessed run <name>` (without `--dry-run`) drives real Claude subagent spawns through the full master/sub orchestration tree, disciplines, judgments, and v3 schema validators.
>
> **Out of scope (deferred)**: ralph-loop wrapper wire (Phase 3), `research` + `execute-task` migration to `harnessed run` (Phase 4), real `getNextHint` implementation (Phase 5), deletion of `src/routing/` + `src/routing-engine/` + `tests/routing/` (Phase 6).

---

## Scope

- **Part A — v3 dispatch arm** (`src/workflow/loadPhases.ts`): the v3 schema (`WorkflowSchemaV3`) is already defined + exported (`src/workflow/schema/workflow.ts` L107-118) but `loadPhases` only dispatches on v1 / v2. Add a v3 arm mirroring the existing v2 pattern (`Value.Check` + `Value.Errors`). 24 v3 yamls currently throw `PhasesValidationError` when spawned via `harnessed run` (Phase 1 E2E scenario 4 deferred).
- **Part B — sdkSpawn relocate**: `src/routing/lib/sdkSpawn.ts` (91 LOC) is a working SDK `query()` consumer. Move it to `src/workflow/lib/sdkSpawn.ts` (new directory) so both the workflow runtime (Phase 2 consumer) and the legacy routing engine (Phase 6 deletion target) read from one source. Single import-path update in `src/routing/engine.ts` (1 LOC) + sister test update (1 LOC).
- **Part C — real `_dispatchSkillStub.fn`**: rewrite the literal `<stub for ${skillName}>` placeholder in `src/workflow/run.ts:34-40` so the production default calls `sdkSpawn`, builds an `AgentDefinition`, and returns a `DispatchStubResult` shape unchanged. DI seam (`_dispatchSkillStub.fn = ...`) preserved so existing 16 fixtures in `tests/workflow/run.test.ts` + 21+ fixtures in `tests/workflow/masterOrchestrator.test.ts` continue mocking the boundary.
- **Part D — tests**: add unit cases for the v3 dispatch arm in `tests/workflow/loadPhases.test.ts` (NEW file — sister `tests/workflow/loadPhases-interpolate.test.ts` only covers v1 + JINJA), adapt `tests/workflow/run.test.ts` fixture #3 (the `/<stub for plan-feature-/` regex assertion), and add an E2E integration test `tests/integration/cli-run-real-spawn.test.ts` gated on `HARNESSED_REAL_SPAWN=1` env var (sister `tests/integration/installer-real-spawn.test.ts:31-33` pattern).

Effort: **8-15h**, single PR (user explicit choice over 1.5 / 2 split).

---

## Goal — acceptance criteria after Phase 2 ships

1. `loadPhases('workflows/verify/simplify/workflow.yaml', {})` returns a `WorkflowSchemaV3T`-shaped object (currently throws `PhasesValidationError: phases.yaml validation failed (7 errors)`).
2. `loadPhases('workflows/auto/workflow.yaml', {})` returns a `WorkflowSchemaV3T` with `phases: undefined` + `delegates_to.length = 6` (master shape — v3 schema declares `phases: Type.Optional(...)`).
3. `node dist/cli.mjs run verify-simplify --dry-run` still exits 0 (Phase 1 path preserved — no regression).
4. `HARNESSED_REAL_SPAWN=1 node dist/cli.mjs run verify-simplify` (no `--dry-run`) exits 0 + stderr matches `[stage verify-simplify complete]`, and the spawn produces NON-stub output (no `<stub for ` substring in any `completePhase` payload).
5. `src/routing/engine.ts` still passes its existing unit tests after the `sdkSpawn` import path moves from `./lib/sdkSpawn.js` to `../workflow/lib/sdkSpawn.js`.
6. `tests/routing/sdk-spawn.test.ts` (8 fixtures) updates import path to `../../src/workflow/lib/sdkSpawn.js` and continues passing.
7. All 16 fixtures in `tests/workflow/run.test.ts` continue passing (DI seam `_dispatchSkillStub.fn` still overridable; production default behavior change documented).
8. All 21+ fixtures in `tests/workflow/masterOrchestrator.test.ts` continue passing (uses `SpawnDriver` DI; never touches `_dispatchSkillStub.fn` directly).
9. `pnpm exec biome check --write && pnpm test` exits 0 (baseline 8 fail still expected per project memory).

---

## Files (file-by-file)

### MODIFY: `src/workflow/loadPhases.ts` (72 → ~95 LOC)

Add a v3 dispatch arm before the v2 arm so the explicit-version check fires first. Pattern lifts the existing v2 arm verbatim (L52-56).

```ts
// at top — add v3 import
import {
  WorkflowSchemaV2,
  type WorkflowSchemaV2T,
  WorkflowSchemaV3,        // NEW
  type WorkflowSchemaV3T,  // NEW
} from './schema/workflow.js'

// expand LoadedPhases union
export type LoadedPhases = PhasesSchemaType | WorkflowSchemaV2T | WorkflowSchemaV3T

// inside loadPhases() — replace the if/else with 3-arm dispatch
const version = parsed?.schema_version
if (version === 'harnessed.workflow.v3') {
  if (!Value.Check(WorkflowSchemaV3, parsed)) {
    throw new PhasesValidationError([...Value.Errors(WorkflowSchemaV3, parsed)])
  }
} else if (version === 'harnessed.workflow.v2') {
  if (!Value.Check(WorkflowSchemaV2, parsed)) {
    throw new PhasesValidationError([...Value.Errors(WorkflowSchemaV2, parsed)])
  }
} else {
  if (!Value.Check(PhasesSchema, parsed)) {
    throw new PhasesValidationError([...Value.Errors(PhasesSchema, parsed)])
  }
}
const validated = parsed as LoadedPhases
```

**Critical**: the JINJA interpolate loop at L66-70 (`for (const ph of validated.phases)`) must guard against `validated.phases === undefined` (v3 master yamls have no `phases`). Replace with:

```ts
if (vars && validated.phases) {
  for (const ph of validated.phases) {
    if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)
  }
}
```

Header comment block (L1-21) gets a Phase v3.4.4 line: `// Phase v3.4.4 — add v3 dispatch arm mirroring v2 pattern; master yamls (no phases) validate via WorkflowSchemaV3 Optional phases field.`

---

### MOVE: `src/routing/lib/sdkSpawn.ts` → `src/workflow/lib/sdkSpawn.ts` (91 LOC, byte-identical)

```bash
mkdir -p src/workflow/lib
git mv src/routing/lib/sdkSpawn.ts src/workflow/lib/sdkSpawn.ts
```

**Import path updates inside the moved file** (relative paths shift one directory up):

| Before (`src/routing/lib/sdkSpawn.ts`) | After (`src/workflow/lib/sdkSpawn.ts`) |
|---|---|
| `from '../agentDefinition.js'` | `from '../../routing/agentDefinition.js'` |
| `from '../completionSchema.js'` | `from '../../routing/completionSchema.js'` |
| `from './sdkReconcile.js'` | `from '../../routing/lib/sdkReconcile.js'` |

Rationale: keep the cross-module dependency on `routing/agentDefinition.ts` + `routing/completionSchema.ts` + `routing/lib/sdkReconcile.ts` intact for Phase 2. Phase 6 will hoist `agentDefinition` + `completionSchema` + `sdkReconcile` out of `src/routing/` (or inline what `sdkSpawn` needs into `src/workflow/lib/`) when `src/routing/` is deleted.

Audit grep to confirm no other importers were missed:

```bash
# expected: 0 hits after the move + import update below
git grep -n "routing/lib/sdkSpawn" -- '*.ts'
```

---

### MODIFY: `src/routing/engine.ts` (1 LOC change)

```diff
-import { sdkSpawn } from './lib/sdkSpawn.js'
+import { sdkSpawn } from '../workflow/lib/sdkSpawn.js'
```

No behavior change — `defaultSpawn` at L60-63 + `wrappedSpawn` at L158-171 keep their signatures.

---

### MODIFY: `tests/routing/sdk-spawn.test.ts` (1 LOC change)

```diff
-import { SpawnFailError, sdkSpawn } from '../../src/routing/lib/sdkSpawn.js'
+import { SpawnFailError, sdkSpawn } from '../../src/workflow/lib/sdkSpawn.js'
```

All 8 fixtures continue passing — the mock targets `@anthropic-ai/claude-agent-sdk` `query()`, not file paths.

Test file location stays under `tests/routing/` for Phase 2 (Phase 6 will relocate / delete). Optional: rename to `tests/workflow/sdkSpawn.test.ts` later — defer to keep the PR diff small.

---

### MODIFY: `src/workflow/run.ts` (~200 → ~230 LOC)

Replace the literal stub at L34-40 with a real `sdkSpawn`-backed default. Preserve the `_dispatchSkillStub` export object so tests can DI-override `.fn`. The wrapper builds a minimal `AgentDefinition`, calls `sdkSpawn`, parses the JSON envelope, and maps it to `DispatchStubResult`.

```ts
// at top — add imports
import type { AgentDefinition } from '../routing/agentDefinition.js'
import { sdkSpawn } from './lib/sdkSpawn.js'

// New helper — builds a minimal AgentDefinition for a workflow phase skill.
// Phase 2 ships a conservative default (description + prompt only); Phase 4
// will enrich with role-prompts.yaml lookup + capabilities.yaml model tier.
function buildAgentDef(skillName: string): AgentDefinition {
  return {
    description: `harnessed workflow phase: ${skillName}`,
    prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
  } as AgentDefinition
}

// Replace L34-40 — production default now real spawn, NOT literal stub string.
export const _dispatchSkillStub = {
  fn: async (skillName: string): Promise<DispatchStubResult> => {
    try {
      const envelopeJson = await sdkSpawn(buildAgentDef(skillName), {
        expertName: skillName,
      })
      const env = JSON.parse(envelopeJson) as {
        structured_output?: { status?: string }
        text?: string
        result?: string
        subtype?: string
      }
      const status: 'ok' | 'fail' =
        env.structured_output?.status === 'COMPLETE' || env.subtype === 'success'
          ? 'ok'
          : 'fail'
      return {
        status,
        output: env.text ?? env.result ?? '',
        ...(env.structured_output?.status ? { decision: env.structured_output.status } : {}),
      }
    } catch (err) {
      // Fail-soft per ADR 0029 — runtime emits failure but doesn't crash run loop.
      return {
        status: 'fail',
        output: `sdkSpawn failed for ${skillName}: ${(err as Error).message}`,
      }
    }
  },
}
```

**Header comment delta** (L1-2): append `// Phase v3.4.4 — _dispatchSkillStub.fn production default rewired to real sdkSpawn (was literal '<stub for X>'). DI seam preserved for tests.`

**Test mock surface unchanged** — `_dispatchSkillStub.fn = ...` overrides remain the test pattern. The export name `_dispatchSkillStub` is now a misnomer (no longer a stub); rename DEFERRED to Phase 6 cleanup to keep diff minimal.

---

### NEW: `tests/workflow/loadPhases.test.ts` (~80 LOC)

Sister file does not exist (only `loadPhases-interpolate.test.ts` covers v1 + JINJA). NEW file covers schema-dispatch matrix.

Fixtures:

1. **v1 yaml → PhasesSchema validates + returns shape** (regression — no behavior change).
2. **v2 yaml → WorkflowSchemaV2 validates + returns shape** (regression).
3. **v3 sub yaml (verify-simplify, has phases, no delegates_to) → WorkflowSchemaV3 validates + returns shape with `phases.length === 1`**.
4. **v3 master yaml (auto, has delegates_to, no phases) → WorkflowSchemaV3 validates + returns shape with `phases === undefined` + `delegates_to.length === 6`**.
5. **v3 yaml with invalid `disciplines_applied` literal ('karpatHy' typo) → throws `PhasesValidationError`** (Pattern A A.1 strict Literal Union assertion).
6. **vars provided + v3 master yaml (no phases) → no throw** (guard the `validated.phases &&` undefined-skip in the interpolate loop).
7. **unknown `schema_version` value → falls back to v1 PhasesSchema → throws PhasesValidationError** (unchanged behavior preserved).

Test pattern: `mkdtempSync` + `writeFileSync` tmpdir fixtures (sister `tests/workflow/loadPhases-interpolate.test.ts:11-22`).

---

### MODIFY: `tests/workflow/run.test.ts` (365 LOC)

Fixture #3 (L142-152) currently asserts `expect(lt).toMatch(/<stub for plan-feature-/)`. After Part C ships, the production default no longer emits that string. Two options:

- **Option A (recommended)**: rewrite fixture #3 to assert the DI seam still works by setting `_dispatchSkillStub.fn` to a known mock at top-of-test (matching the rest of the file's pattern at fixtures #14, #15), then assert the mock's output flows through. Sister fixture #14 L321-325 already does this pattern verbatim.
- **Option B**: keep the assertion but DI-override `_dispatchSkillStub.fn` in `beforeEach` to a "<stub for X>" returning shim before all 16 fixtures. Less invasive but couples test setup to legacy behavior.

Choose A — cleaner contract.

Rewrite of fixture #3:

```ts
it('3. _dispatchSkillStub DI seam — phase chain consumes whatever fn returns', async () => {
  // Production default after v3.4.4 Phase 2 calls real sdkSpawn; tests DI-override.
  isVetoedMock.mockResolvedValue(false)
  _dispatchSkillStub.fn = async (skillName) => ({
    status: 'ok',
    output: `mock-output-for-${skillName}`,
    decision: 'mock-approved',
  })
  await runWorkflow('workflows/plan-feature/workflow.yaml', { gstack_prefix: 'gstack-' })
  const lastTaskStrings = completePhaseMock.mock.calls.map((c) => c[0].lastTask ?? '')
  for (const lt of lastTaskStrings) {
    expect(lt).toMatch(/mock-output-for-plan-feature-/)
  }
  expect(lastTaskStrings).toHaveLength(5)
})
```

No other fixture asserts on the literal `<stub for X>` string (verified via Grep). Fixtures #14 (L318-333), #15 (L335-350), #16 (L352-364) already DI-override and remain unchanged.

**Critical**: the file imports `vi.mock('@anthropic-ai/claude-agent-sdk', ...)` is NOT currently set up here. After Part C, the production default calls `sdkSpawn` → `query()` on import. Add a top-level `vi.mock('@anthropic-ai/claude-agent-sdk', () => ({ query: () => (async function* () {})() }))` so any test that does NOT DI-override `_dispatchSkillStub.fn` still doesn't hit the real SDK (returns SpawnFailError → status='fail' → workflow path tested via existing fixture #16). Sister `tests/routing/sdk-spawn.test.ts:27-34` pattern.

---

### NEW: `tests/integration/cli-run-real-spawn.test.ts` (~70 LOC, gated)

Sister pattern: `tests/integration/installer-real-spawn.test.ts:31-33` `describe.skipIf(!REAL)` gate.

```ts
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'
const CLI = join(process.cwd(), 'dist', 'cli.mjs')

describe.skipIf(!REAL)('harnessed run real-spawn (HARNESSED_REAL_SPAWN=1)', () => {
  it('verify-simplify → exit 0 + stderr stage marker + no <stub for X> in output', () => {
    const r = spawnSync('node', [CLI, 'run', 'verify-simplify', '--task', 'noop test task'], {
      encoding: 'utf8',
      timeout: 120_000,
    })
    expect(r.status).toBe(0)
    expect(r.stderr).toMatch(/\[stage verify-simplify complete\]/)
    // KEY: production default emits real SDK output, NOT the literal placeholder.
    expect(r.stdout + r.stderr).not.toMatch(/<stub for /)
  }, 130_000)
})
```

Pre-condition: `pnpm build` must have run so `dist/cli.mjs` exists. The CI workflow does NOT set `HARNESSED_REAL_SPAWN=1` — this test is opt-in only, exactly mirroring `installer-real-spawn.test.ts` policy.

---

### MODIFY: `CHANGELOG.md` (top-of-file 3-line entry)

```markdown
## 3.4.4 (Unreleased)

- **runtime**: `harnessed run <name>` now drives real Claude subagent spawns (was placeholder `<stub for X>` in v3.4.3). 24 v3 workflow yamls load + execute through `loadPhases` + `runWorkflow` + `runMasterOrchestrator` end-to-end. `--dry-run` still bypasses spawn (Phase 1 behavior preserved).
- **schema**: v3 dispatch arm added to `loadPhases` — yamls with `schema_version: harnessed.workflow.v3` validate against `WorkflowSchemaV3` (master shape with `delegates_to` + no phases supported).
- **refactor**: `sdkSpawn` driver moved from `src/routing/lib/` to `src/workflow/lib/` (single SoT, prep for Phase 6 routing deletion).
```

---

## Architecture decision points

### D-1 — `sdkSpawn` envelope vs `DispatchStubResult` shape

`sdkSpawn` returns a JSON string envelope:

```ts
{
  subtype: 'success' | ...,
  structured_output?: { status?: 'COMPLETE' | ..., ... },
  text?: string,
  result?: string,
}
```

`DispatchStubResult` expects:

```ts
{
  status: 'ok' | 'fail',
  output: string,
  decision?: string,
  target?: 'chat' | 'file' | 'commit-message',
  triggers_commit?: boolean,
}
```

**Mapping rule** (codified in Part C):

| envelope field | DispatchStubResult field |
|---|---|
| `structured_output.status === 'COMPLETE' OR subtype === 'success'` | `status = 'ok'` |
| otherwise | `status = 'fail'` |
| `text ?? result ?? ''` | `output` |
| `structured_output.status` (if present) | `decision` |
| (not yet populated by envelope) | `target` — omit, undefined |
| (not yet populated by envelope) | `triggers_commit` — omit, undefined |

`target` + `triggers_commit` stay undefined in Phase 2 → `runAfterOutputHook` + `runBeforeCommitHook` continue not firing for real spawns. Phase 4+ will extend the envelope schema (via `COMPLETION_SCHEMA` update in `src/routing/completionSchema.ts`) to surface those fields.

### D-2 — Move vs copy `sdkSpawn`

**Recommendation: MOVE.** Phase 6 is queued (delete `src/routing/` entirely). Copy would create a 91-LOC duplicate that diverges. Move + 3-LOC import-path updates (`src/routing/engine.ts` L31 + `tests/routing/sdk-spawn.test.ts` L38 + relative imports inside the moved file) is reversible via `git mv` history.

### D-3 — v3 schema validates BOTH master + sub shapes

**Verified** by reading `src/workflow/schema/workflow.ts` L107-118:

```ts
phases: Type.Optional(Type.Array(WorkflowPhaseV3, { minItems: 1 })),  // L115
delegates_to: Type.Optional(Type.Array(DelegationClause)),             // L114
```

Both fields are `Optional`. The "runtime invariant" comment at L14-15 notes: *"every parsed yaml must have phases[] OR delegates_to[] (engine asserts in runWorkflow); BOTH absent → fail-fast"*. The engine assertion lives in `src/workflow/run.ts:64-77` (master detect path) + `:96-99` (sub path falls back to `parsed.phases ?? []`). Both paths handle the v3 shapes correctly — no schema change needed.

### D-4 — Tests using `_dispatchSkillStub.fn` mock

- `tests/workflow/run.test.ts` — 16 fixtures, 4 directly assert on `_dispatchSkillStub.fn` behavior (#3 literal-string assertion + #14, #15, #16 DI-override). Fix #3, keep #14-16 unchanged.
- `tests/workflow/masterOrchestrator.test.ts` — 21+ fixtures use `SpawnDriver` DI (`opts.spawnDriver`), NEVER touch `_dispatchSkillStub`. The `defaultSpawnDriver` in `masterOrchestrator-helpers.ts:51-72` calls `runWorkflow` recursively → reaches `_dispatchSkillStub.fn` indirectly, but the tests inject a mock `spawnDriver` that bypasses this chain. No change required.
- `tests/workflow/loadPhases-interpolate.test.ts` — 3 fixtures, all v1 yaml + JINJA, untouched by Part A (v1 arm unchanged).

### D-5 — Backwards compat — v3.4.3 → v3.4.4 user behavior change

**Phase 2 changes runtime behavior for everyone.** After upgrading from v3.4.3 to v3.4.4 + running `harnessed setup`, any user that types `/verify-paranoid` (or invokes `harnessed run` directly) without `--dry-run` will trigger real Claude subagent spawns — costs API tokens. Phase 1 was safe (literal stub, no spawn); Phase 2 flips the switch.

**Mitigation**:

1. `--dry-run` flag preserved (Phase 1 path) — users can validate without spending tokens.
2. CHANGELOG entry above documents the behavior change explicitly.
3. Phase 4 will update README to document `--dry-run` as the verify-before-spend pattern.

No env-var gate added (`HARNESSED_DRY_BY_DEFAULT=1`) — the user explicitly requested Option A (real spawn lands in 1 PR, not behind a flag). Phase 1 spec already established `--dry-run` as the safety knob.

---

## Test plan (commands to run before each commit)

```bash
# Pre-commit (every commit)
pnpm exec biome check --write
pnpm test                                # baseline 8 fail expected per project memory

# Phase 1 regression — must still pass
node dist/cli.mjs run verify-simplify --dry-run
node dist/cli.mjs run --list
echo "trivial" | node dist/cli.mjs run verify-paranoid --task-stdin --dry-run

# Phase 2 acceptance — gated integration test
pnpm build
HARNESSED_REAL_SPAWN=1 pnpm test -- tests/integration/cli-run-real-spawn.test.ts
```

**Pre-PR gate**: all 4 commits below have been pushed locally, biome + test green, dry-run still 0, real-spawn test produces non-stub stderr `[stage verify-simplify complete]`.

---

## Atomic commit plan

| # | Files | Suggested message |
|---|-------|-------------------|
| 1 | `src/workflow/loadPhases.ts` + `tests/workflow/loadPhases.test.ts` (NEW) | `feat(workflow): v3.4.4 add v3 schema dispatch arm to loadPhases (mirror v2 pattern; master/sub both validate)` |
| 2 | `git mv src/routing/lib/sdkSpawn.ts src/workflow/lib/sdkSpawn.ts` + relative imports inside moved file + `src/routing/engine.ts` + `tests/routing/sdk-spawn.test.ts` | `refactor(spawn): v3.4.4 move sdkSpawn to workflow/lib (single SoT, prep for Phase 6 routing deletion)` |
| 3 | `src/workflow/run.ts` + `tests/workflow/run.test.ts` (fixture #3 rewrite + SDK vi.mock add) | `feat(workflow): v3.4.4 replace _dispatchSkillStub placeholder with sdkSpawn-backed real impl (DI seam preserved)` |
| 4 | `tests/integration/cli-run-real-spawn.test.ts` (NEW) + `CHANGELOG.md` | `test(integration): v3.4.4 E2E real spawn produces non-stub output (HARNESSED_REAL_SPAWN gated)` |

Commit 1 isolated so the v3 arm is reviewable on its own. Commit 2 is pure refactor — green test suite proves no behavior change. Commit 3 is the user-visible behavior flip. Commit 4 documents + gates the new E2E.

---

## Open verifications before implement

These were confirmed during the spec-write read pass. Re-confirm if the executor finds drift:

1. **WorkflowSchemaV3 validates BOTH master (delegates_to + 0 phases) AND sub (no delegates_to + N phases) yamls** — **CONFIRMED** at `src/workflow/schema/workflow.ts` L107-118 (`phases` + `delegates_to` both `Type.Optional`). Runtime invariant lives in engine, not schema.
2. **`@anthropic-ai/claude-agent-sdk` is a runtime dep, not devDep** — **CONFIRMED** at `package.json` L70: `"@anthropic-ai/claude-agent-sdk": "0.3.142"` under `dependencies` (not devDependencies). No new install needed.
3. **`masterOrchestrator.test.ts` still passes after real spawn wired in** — **CONFIRMED** by tracing the DI seam: tests inject `spawnDriver` mock via `runMasterOrchestrator(..., spawnDriver = mock, ...)`. The default `defaultSpawnDriver` (`masterOrchestrator-helpers.ts:51-72`) calls `runWorkflow` → eventually `_dispatchSkillStub.fn` → eventually `sdkSpawn`. None of these are reached when tests pass a mock `spawnDriver`. No fixture change needed.
4. **`HARNESSED_REAL_SPAWN` gating pattern** — **CONFIRMED** at `tests/integration/installer-real-spawn.test.ts:31-33` verbatim:
   ```ts
   const REAL = process.env.HARNESSED_REAL_SPAWN === '1'
   describe.skipIf(!REAL)('installer real-spawn (HARNESSED_REAL_SPAWN=1)', () => { ... })
   ```
5. **`defaultSpawnDriver` recursive chain** — **CONFIRMED** at `src/workflow/masterOrchestrator-helpers.ts:51-72`: `runWorkflow → runMasterOrchestrator → defaultSpawnDriver → runWorkflow(sub) → _dispatchSkillStub.fn`. Replacing the leaf `_dispatchSkillStub.fn` therefore flips the entire master+sub spawn tree to real SDK calls in one shot.
6. **`tests/workflow/loadPhases.test.ts` does NOT currently exist** — Glob confirmed only `tests/workflow/loadPhases-interpolate.test.ts` (73 LOC, v1 + JINJA only). NEW file in Part D is genuinely new, not a modify.

### Potentially adaptive findings (executor: surface if changed)

- **`sdkReconcile.ts` import chain inside `sdkSpawn`**: the moved file imports `'./sdkReconcile.js'` which currently resolves to `src/routing/lib/sdkReconcile.js`. After move, the relative path becomes `'../../routing/lib/sdkReconcile.js'`. Phase 2 keeps this cross-package import; Phase 6 should consolidate. If `sdkReconcile.ts` itself has imports from `src/routing/` (verify with `cat src/routing/lib/sdkReconcile.ts`), no further path updates needed — only the directly moved file's imports change.
- **`tests/workflow/run.test.ts` SDK vi.mock**: current file does NOT mock `@anthropic-ai/claude-agent-sdk`. After Part C, fixtures that don't DI-override `_dispatchSkillStub.fn` would call the real SDK. Add the mock at top of file (mirror `tests/routing/sdk-spawn.test.ts:27-34`). If the existing `loadPhasesMock` in `beforeEach` returns the default `fivePhases` array, the default stub (real `sdkSpawn`) WILL fire for fixtures #1, #2, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13. The SDK mock catches all of them and returns `SpawnFailError` → `status='fail'` → fixtures' workflow-level assertions still hold as long as they don't assert on `status='complete'` final return.
  - **Sub-risk**: fixture #1 asserts `expect(r).toEqual({ status: 'complete', phasesRun: 5 })`. After real-spawn flip + SDK mock yielding no result → `SpawnFailError` → `_dispatchSkillStub.fn` catches → returns `{status: 'fail', ...}` → `runWorkflow` returns `{status: 'failed', phasesRun: 0, ...}`. **Fixture #1 will break.** Fix in Commit 3: DI-override `_dispatchSkillStub.fn` in `beforeEach` to the prior `'<stub for X>'`-style mock so ALL existing fixtures continue testing the workflow-level logic. Add a dedicated NEW fixture (#17 or rewrite #3) that exercises the real default path with the SDK vi.mock.

This adaptive fix is folded into Commit 3 — the `beforeEach` already has `_dispatchSkillStub.fn = _origStubFn` (line 110). Change `_origStubFn` to a stable test-fixture shim function defined at top of file instead of capturing the moved-target production default:

```ts
// At top of file, before beforeEach
const _testStubFn = async (skillName: string) => ({
  status: 'ok' as const,
  output: `<stub for ${skillName}>`,
  decision: 'mock-approved',
})

beforeEach(() => {
  // ... existing resets ...
  _dispatchSkillStub.fn = _testStubFn  // not _origStubFn
})
afterEach(() => {
  _dispatchSkillStub.fn = _testStubFn
})
```

This change isolates the legacy stub-string behavior to the test file (where it was always conceptually owned) and decouples test fixtures from production default rewires. Fixture #3 then keeps its `/<stub for plan-feature-/` regex assertion (the test shim emits it), removing the rewrite proposed earlier in this spec. Net: fewer LOC change in `tests/workflow/run.test.ts`, cleaner separation.

**Executor decision**: use this adaptive approach (top-of-file `_testStubFn`) rather than the rewrite of fixture #3. Surface in PR description that the DI-default-rebind pattern is the chosen approach.

---

## NOT in Phase 2 (deferred — sister HANDOFF-v3.4.4.md phase order)

| Phase | Deferred work |
|-------|---------------|
| 3 | Wire ralph-loop wrapper around `_dispatchSkillStub.fn` (extract from `src/routing/lib/ralphLoop.ts` 54 LOC, layer it over `sdkSpawn` for completion-promise enforcement). Honor `--max-iterations` CLI flag end-to-end. |
| 4 | Migrate `research` + `execute-task` subcommands to `harnessed run <name>` (Path A: author new `workflows/execute-task/workflow.yaml` v3 + delete `src/cli/execute-task.ts` 157 LOC). Enrich `buildAgentDef` with role-prompts.yaml lookup + capabilities.yaml model tier. |
| 5 | Real `getNextHint` implementation — read `workflows/auto/workflow.yaml` `delegates_to[]` and return next-in-order sub for the staged UX hint at end of each `harnessed run` invocation. |
| 6 | Delete `src/routing/` + `src/routing-engine/` + `tests/routing/` + `tests/integration/routing-*`. Hoist `agentDefinition.ts` + `completionSchema.ts` + `sdkReconcile.ts` into `src/workflow/lib/` (or wherever the single remaining caller `sdkSpawn` needs them). Rename `_dispatchSkillStub` → `dispatchSkill` (no longer a stub). |
