# Phase 5 Spec — v3.4.4 real `getNextHint` implementation

> **Scope**: Replace the Phase 1 stub `getNextHint()` (`src/cli/run.ts:190-192`, currently `return null`) with a real implementation that reads `workflows/auto/workflow.yaml` `delegates_to[]` (6 ordered stages: `research → discuss → plan → task → verify → retro`) and returns the next-in-chain stage name. Add sub-workflow → parent-stage resolution (e.g. `verify-paranoid` → parent `verify` → next `retro`). Cache the parsed yaml at module scope (load once, reuse forever). Format the stderr hint emitted at `src/cli/run.ts:107-111` so users see a 3-line `[stage <name> complete] / Next stage: harnessed run <next> / (In Claude Code: /<next>)` envelope. Fail-soft per ADR 0029: any read / parse / lookup error returns `null` with a 1-line stderr warn — never crashes the `harnessed run` loop.
>
> **Out of scope (deferred)**: Phase 6 — delete `src/routing/` + `src/routing-engine/` + `tests/routing/*` + `tests/integration/routing-research-workflow.test.ts` + `workflows/execute-task/phases.yaml` (v2 legacy SoT). `gateContext.modelOverride` consumption at sdkSpawn level (Phase 4 captures into gateContext but doesn't propagate to AgentDefinition spawn yet; out of scope per HANDOFF L745).

---

## Scope

- **Part A — real `getNextHint`**: Phase 1 shipped a stub returning `null`. Phase 5 reads `workflows/auto/workflow.yaml` once (lazy module-level cache), extracts `delegates_to[]` sorted by `order`, and resolves the next stage for the passed `workflowName`. Uses `loadPhases` (existing v3 dispatch arm validated `workflows/auto/workflow.yaml` shape end-to-end per Phase 2 Commit 1 — `WorkflowSchemaV3T.delegates_to` is `DelegationClause[]` with `sub` + `order` + optional `gate` / `mode`). The 6 stages per the actual yaml (verified L42-61): `research(0) → discuss(1) → plan(2) → task(3) → verify(4) → retro(5)`.

- **Part B — sub-workflow → parent-stage resolution (D-1 Option C)**: Sub-workflows (e.g. `verify-paranoid`, `discuss-strategic`, `task-clarify`) are NOT in `delegates_to[]`. Phase 5 derives parent stage by splitting on the first dash: `verify-paranoid` → parent `verify` → next-after-verify = `retro`. Sister to `resolveWorkflowYaml` tier-3 logic (`src/cli/run.ts:136-141`) which uses the same dash-split convention. When no dash present and name not in chain (e.g. `research`, `auto`, hypothetical unknown) → return `null`.

- **Part C — module-level lazy cache (D-2 Option B)**: A module-scoped `let chainCache: string[] | null = null` lazy-loads on first `getNextHint` call and reuses forever. `harnessed run` is a CLI process that exits after each invocation, so cache lifetime is per-process — no invalidation needed (re-runs reload). Sister pattern: `PACKAGE_ROOT = getPackageRoot()` at `src/cli/run.ts:31` (module-level const init).

- **Part D — formatted stderr hint (D-3)**: `src/cli/run.ts:107-111` currently emits `[stage <name> <status>]\n` + (if hint truthy) `Next stage: harnessed run <hint>\n(In Claude Code: /<hint>)\n`. Phase 1 stub returned `null` so the 2nd + 3rd lines NEVER fired. Phase 5 keeps the exact 3-line format (already correct per the wired call site) — only `getNextHint` body changes; the formatter at L108-111 stays verbatim. The user-visible UX after Phase 5 ships:
  ```
  [stage discuss complete]
  Next stage: harnessed run plan
  (In Claude Code: /plan)
  ```

- **Part E — fail-soft (D-4, ADR 0029)**: Yaml missing / parse error / `delegates_to` malformed → catch, emit 1-line stderr `⚠️ getNextHint failed (<msg>); skipping hint.`, return `null`. Caller (`src/cli/run.ts:109`) already guards `if (hint)` so null silently skips the 2-line `Next stage:` envelope without breaking the `[stage X complete]` line. Sister fail-soft pattern: `runWorkflow` L260-265 (loadRolePrompts) + L292-297 (loadDisciplinesForPhase) + L334-337 (resolveJudgmentGate).

Effort: **2-4h**, single PR. Phase 5 is significantly smaller than Phase 1-4 — 2 sequential commits, no parallel wave.

---

## Goal — acceptance criteria after Phase 5 ships

1. `getNextHint('research')` returns `'discuss'` (next stage after research per `auto/workflow.yaml:42-49`).
2. `getNextHint('discuss')` returns `'plan'`. `getNextHint('plan')` returns `'task'`. `getNextHint('task')` returns `'verify'`. `getNextHint('verify')` returns `'retro'`.
3. `getNextHint('retro')` returns `null` (last stage in chain — no next).
4. `getNextHint('auto')` returns `null` (super-master itself; whole chain about to run, no next-stage hint applies).
5. `getNextHint('verify-paranoid')` returns `'retro'` (parent stage `verify` → next-after-verify = `retro`, via D-1 Option C parent-stage fallback). Sister: `getNextHint('discuss-strategic')` returns `'plan'`. `getNextHint('task-clarify')` returns `'verify'`. `getNextHint('verify-simplify')` returns `'retro'`.
6. `getNextHint('totally-unknown-name')` returns `null` (no dash → not in chain → null; OR dash present but parent stage not in chain → null).
7. `getNextHint('plan-architecture')` returns `'task'` (parent stage `plan` → next = `task`).
8. After `harnessed run discuss --task "X"` exits with `status: 'complete'`, stderr contains the verbatim 3-line envelope:
   ```
   [stage discuss complete]
   Next stage: harnessed run plan
   (In Claude Code: /plan)
   ```
9. After `harnessed run retro` exits, stderr contains ONLY `[stage retro complete]\n` (no `Next stage:` lines — chain end).
10. Yaml-read failure (simulate via stubbing `loadPhases` to throw OR pointing `WORKFLOWS_DIR` at empty dir) → `getNextHint` returns `null` + stderr warn `⚠️ getNextHint failed (...); skipping hint.` → run loop continues + exits with normal `result.status` code.
11. Cache verify: `getNextHint('discuss')` + `getNextHint('verify')` in the same process call `loadPhases('workflows/auto/workflow.yaml', ...)` exactly ONCE total (verifiable via vi.spyOn on `loadPhases`).
12. `pnpm exec biome check --write && pnpm build && pnpm test` exits 0 — Phase 4 baseline preserved. Existing `tests/cli/run.test.ts` cells 14 + 15 (which assert stderr `[stage X complete]`) continue to pass (the new `Next stage:` lines are ADDITIONAL stderr, not replacement — assertions use `expect(stderr).toContain(...)` not `toBe`).

---

## Files (file-by-file)

### MODIFY: `src/cli/run.ts` (getNextHint real impl — ~40 LOC delta)

Replace the stub at L187-192. Add 2 module-level constants (cache + chain accessor). Header comment at L1-12 amended.

```diff
+import { loadPhases } from '../workflow/run.js'  // ALREADY imported via runWorkflow — re-use; OR import from '../workflow/loadPhases.js' direct
+// (Implementer: `loadPhases` is exported from src/workflow/loadPhases.ts; re-use the existing import path
+//  used by src/workflow/run.ts. Add `import { loadPhases } from '../workflow/loadPhases.js'` near top.)

 const PACKAGE_ROOT = getPackageRoot()
 const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

+/** Phase 5 — module-level lazy cache for the 6-stage chain extracted from
+ *  workflows/auto/workflow.yaml delegates_to[]. Loaded ONCE per process at first
+ *  getNextHint call; harnessed run exits after each invocation so per-process
+ *  cache lifetime is correct (no invalidation needed). null = not yet loaded;
+ *  empty array [] = load attempted but failed (fail-soft — don't retry). */
+let _autoChainCache: string[] | null = null
+let _autoChainLoadFailed = false

-/** Phase 1 stub — Phase 5 reads workflows/auto/workflow.yaml delegates_to[]
- *  and returns the next sub name in order. Returns null when no `auto`
- *  context applies (e.g. sub invoked directly, not via /auto). */
-export async function getNextHint(_workflowName: string): Promise<string | null> {
-  return null
-}
+/** Phase 5 — load workflows/auto/workflow.yaml delegates_to[] sorted by
+ *  `order`, return the 6-stage chain as a string[]. Lazy cached at module
+ *  level. Fail-soft per ADR 0029: read/parse error → set _autoChainLoadFailed
+ *  + emit 1-line stderr warn + return []. */
+function loadAutoChain(): string[] {
+  if (_autoChainCache !== null) return _autoChainCache
+  if (_autoChainLoadFailed) return []
+  try {
+    const yamlPath = join(WORKFLOWS_DIR, 'auto', 'workflow.yaml')
+    const parsed = loadPhases(yamlPath)
+    const delegates = 'delegates_to' in parsed && Array.isArray(parsed.delegates_to)
+      ? parsed.delegates_to
+      : []
+    const sorted = [...delegates].sort((a, b) => {
+      const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
+      const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
+      return ao - bo
+    })
+    _autoChainCache = sorted.map((d) => d.sub).filter((s): s is string => typeof s === 'string')
+    return _autoChainCache
+  } catch (err) {
+    _autoChainLoadFailed = true
+    process.stderr.write(
+      `⚠️ getNextHint failed (${(err as Error).message}); skipping hint.\n`,
+    )
+    return []
+  }
+}
+
+/** Phase 5 — return the next stage name in the 6-stage auto chain for the
+ *  passed workflowName. Resolution chain (D-1 Option C):
+ *    1. Direct: `workflowName` ∈ chain → return next-in-order (or null if last).
+ *    2. Parent-stage fallback: split on FIRST dash → parent stage (e.g.
+ *       'verify-paranoid' → 'verify') → if parent in chain, return
+ *       next-after-parent (or null if parent is last).
+ *    3. 'auto' super-master OR unresolvable → null (whole chain runs / no hint).
+ *
+ *  Cache: loadAutoChain() is lazy (1 load per process). Fail-soft per ADR 0029. */
+export async function getNextHint(workflowName: string): Promise<string | null> {
+  if (workflowName === 'auto') return null
+  const chain = loadAutoChain()
+  if (chain.length === 0) return null  // load failed or empty delegates
+  // Direct lookup
+  const directIdx = chain.indexOf(workflowName)
+  if (directIdx >= 0) {
+    return directIdx + 1 < chain.length ? (chain[directIdx + 1] ?? null) : null
+  }
+  // Parent-stage fallback (D-1 Option C): split on FIRST dash
+  const dashIdx = workflowName.indexOf('-')
+  if (dashIdx > 0) {
+    const parentStage = workflowName.slice(0, dashIdx)
+    const parentIdx = chain.indexOf(parentStage)
+    if (parentIdx >= 0) {
+      return parentIdx + 1 < chain.length ? (chain[parentIdx + 1] ?? null) : null
+    }
+  }
+  return null
+}
+
+/** Phase 5 — test hook: reset module cache so unit tests can verify lazy-load
+ *  + fail-soft + re-load paths in isolation. NOT for production use. */
+export function _resetAutoChainCache(): void {
+  _autoChainCache = null
+  _autoChainLoadFailed = false
+}
```

Header comment update at L1-12: append `// Phase v3.4.4 (Phase 5) — real getNextHint implementation: reads workflows/auto/workflow.yaml delegates_to[] (lazy module-level cache), resolves direct + parent-stage fallback per D-1 Option C, fail-soft per ADR 0029 (stderr warn + null on yaml read/parse error).`

**Interface contracts**:
- `getNextHint(name: string): Promise<string | null>` — signature unchanged from Phase 1 stub (still `Promise<string | null>` despite synchronous body; `async` retained for caller compatibility per `src/cli/run.ts:107` `await getNextHint(name)`).
- Cache exported reset hook `_resetAutoChainCache()` — underscore-prefixed per `_dispatchSkillStub` test-DI convention (`src/workflow/run.ts:159`).
- Stderr warn format matches sister fail-soft messages (`⚠️ <op> failed (<msg>); <action>.`).

---

### MODIFY: `tests/cli/run.test.ts` (add 6-8 cells for getNextHint — ~80 LOC delta)

Sister Pattern J (existing 16 cells) — extend with `describe('getNextHint — Phase 5', ...)` block. Add `_resetAutoChainCache()` import to ensure each fixture starts with cold cache.

```diff
-import { registerRun } from '../../src/cli/run.js'
+import { _resetAutoChainCache, getNextHint, registerRun } from '../../src/cli/run.js'
```

ADD cells (after existing cell 15):

```ts
describe('getNextHint — Phase 5 real impl', () => {
  beforeEach(() => {
    _resetAutoChainCache()  // cold cache each fixture
  })

  it('cell 16 — direct hit: getNextHint("discuss") → "plan"', async () => {
    expect(await getNextHint('discuss')).toBe('plan')
  })

  it('cell 17 — direct hit chain coverage', async () => {
    expect(await getNextHint('research')).toBe('discuss')
    expect(await getNextHint('plan')).toBe('task')
    expect(await getNextHint('task')).toBe('verify')
    expect(await getNextHint('verify')).toBe('retro')
  })

  it('cell 18 — last stage: getNextHint("retro") → null', async () => {
    expect(await getNextHint('retro')).toBe(null)
  })

  it('cell 19 — super-master: getNextHint("auto") → null', async () => {
    expect(await getNextHint('auto')).toBe(null)
  })

  it('cell 20 — parent-stage fallback: getNextHint("verify-paranoid") → "retro"', async () => {
    expect(await getNextHint('verify-paranoid')).toBe('retro')
    expect(await getNextHint('discuss-strategic')).toBe('plan')
    expect(await getNextHint('task-clarify')).toBe('verify')
    expect(await getNextHint('plan-architecture')).toBe('task')
  })

  it('cell 21 — unresolvable name → null', async () => {
    expect(await getNextHint('totally-unknown-name')).toBe(null)
    expect(await getNextHint('xyz')).toBe(null)  // no dash, not in chain
  })

  it('cell 22 — cache verify: loadPhases called exactly once across 3 hint calls', async () => {
    // vi.spyOn the loadPhases module entry; expect 1 call total.
    const loadPhasesMod = await import('../../src/workflow/loadPhases.js')
    const spy = vi.spyOn(loadPhasesMod, 'loadPhases')
    await getNextHint('discuss')
    await getNextHint('verify')
    await getNextHint('task-clarify')
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('cell 23 — fail-soft: yaml read fail → null + stderr warn', async () => {
    // Mock loadPhases to throw; verify null + stderr warn.
    const loadPhasesMod = await import('../../src/workflow/loadPhases.js')
    const spy = vi.spyOn(loadPhasesMod, 'loadPhases').mockImplementation(() => {
      throw new Error('ENOENT: yaml missing')
    })
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const result = await getNextHint('discuss')
    expect(result).toBe(null)
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringMatching(/⚠️ getNextHint failed \(ENOENT: yaml missing\); skipping hint/),
    )
    spy.mockRestore()
    stderrWrite.mockRestore()
  })
})
```

Existing cells 14 + 15 — VERIFY no breakage:
- Cell 14 (`'cell 14 — runWorkflow returns { status: "complete" } → exit 0 + stderr ...'`): asserts `expect(stderr).toContain('[stage verify-paranoid complete]')` — uses `toContain`, so the ADDITIONAL `Next stage: harnessed run retro` lines (Phase 5 newly emitted via parent-stage fallback) DO NOT break the assertion. No update needed.
- Cell 15 (runtime failed): asserts `runtime failed` substring — Phase 5 changes don't touch the error path. No update needed.

**Optionally tighten cell 14** (recommended additive assertion):
```ts
expect(stderr).toContain('[stage verify-paranoid complete]')
expect(stderr).toContain('Next stage: harnessed run retro')   // NEW per Phase 5 parent-stage fallback
expect(stderr).toContain('(In Claude Code: /retro)')          // NEW per Phase 5 format
```

---

### MODIFY: `CHANGELOG.md`

Append to `v3.4.4 (Unreleased)` section:

```markdown
### Phase 5 — real getNextHint + formatted stderr stage hint

- `getNextHint(workflowName)` replaced the Phase 1 stub: reads `workflows/auto/workflow.yaml` `delegates_to[]` (6 stages: research → discuss → plan → task → verify → retro) with lazy module-level cache (1 load per process).
- Sub-workflow parent-stage fallback (D-1 Option C): `verify-paranoid` → parent `verify` → hints `retro`; sister for `discuss-strategic` / `task-clarify` / `plan-architecture`.
- Stderr now emits 3-line stage-complete envelope after every `harnessed run <name>` invocation: `[stage <name> complete]` + `Next stage: harnessed run <next>` + `(In Claude Code: /<next>)`.
- ADR 0029 fail-soft preserved — yaml read / parse error returns null + 1-line stderr warn, never crashes the run loop.
```

---

## Architecture decision points

### D-1 — Hint resolution for sub-workflows (e.g. `verify-paranoid`)

- **Option A**: Direct lookup only. `verify-paranoid` not in `delegates_to[]` → return null. User must manually navigate stage advancement.
- **Option B**: Parent-stage mapping only. Always derive parent from dash-split → resolve via chain.
- **Option C (recommended)**: Both — try direct first (handles the 6 main stages), fall back to parent-stage (handles all 24 sub-workflows). Maximizes hint coverage with zero false-positive risk (parent stage either resolves or doesn't).

Recommend **C**. Parent-stage derivation uses dash-split on FIRST dash (sister `resolveWorkflowYaml` tier-3 logic at `src/cli/run.ts:136-141` — same convention, single SoT for the name-shape rule). Multi-dash names like `discuss-subtask-clarify-x` (hypothetical) still resolve to parent `discuss` correctly because we only split on the first dash.

### D-2 — Cache strategy

- **Option A**: Read yaml on every `getNextHint` call (no cache).
- **Option B (recommended)**: Module-level lazy cache (`let _autoChainCache: string[] | null`). Load once on first call, reuse forever.
- **Option C**: External cache (e.g. fs `stat` mtime check).

Recommend **B**. `workflows/auto/workflow.yaml` is read-only at runtime; cache invalidation only happens between `harnessed setup` runs which restart the CLI process anyway (per-process cache lifetime is correct). Option A wastes IO. Option C is over-engineered.

The cache state has TWO booleans: `_autoChainCache: string[] | null` (loaded data) + `_autoChainLoadFailed: boolean` (fail flag — prevents retry storm when yaml truly missing). On first failure, fail flag locks → subsequent calls short-circuit to `return []`.

### D-3 — Hint output format

Phase 1 already wired the formatter at `src/cli/run.ts:108-111`:
```ts
process.stderr.write(`[stage ${name} ${result.status}]\n`)
if (hint) {
  process.stderr.write(`Next stage: harnessed run ${hint}\n(In Claude Code: /${hint})\n`)
}
```

This format matches the Phase 1 SPEC L208-210 documented envelope verbatim. Phase 5 does NOT change the formatter — only the `hint` value transitions from always-null (Phase 1) to real values (Phase 5). The 3-line UX appears automatically once `getNextHint` returns non-null.

Recommend **confirm verbatim** — no format changes in Phase 5.

### D-4 — Fail mode

- **Option A**: Silent null (no stderr).
- **Option B (recommended)**: Null + 1-line stderr warn (`⚠️ getNextHint failed (<msg>); skipping hint.`).
- **Option C**: Throw + let caller handle.

Recommend **B**. Sister fail-soft warns at `src/workflow/run.ts:260-265` + `292-297` use identical `⚠️ <op> failed (<msg>); ...` format. ADR 0029 fail-soft per project policy. Caller at `src/cli/run.ts:109` already guards `if (hint)` so null cleanly skips the `Next stage:` envelope.

Option C rejected — `getNextHint` is a best-effort UX nicety; crashing the run loop because a hint can't resolve violates ADR 0029.

### D-5 — `loadPhases` import source

`loadPhases` is exported from `src/workflow/loadPhases.ts` (verified L57). It's re-imported by `src/workflow/run.ts:30`. Phase 5 should import direct from `loadPhases.ts` (not re-export through `run.ts`) to keep dependency graph clean — sister convention: `src/workflow/run.ts:30` imports direct.

```ts
import { loadPhases } from '../workflow/loadPhases.js'
```

### D-6 — getNextHint as module export vs file-local

Phase 1 stub already declared `export async function getNextHint` (per `src/cli/run.ts:190`). Phase 5 KEEPS export — needed for unit testability (`tests/cli/run.test.ts` cell 16+ imports `getNextHint` direct, sister to `resolveWorkflowYaml` + `listWorkflowNames` exports at L125 + L146).

`_resetAutoChainCache` ALSO exported with underscore prefix (sister `_dispatchSkillStub` test-DI convention at `src/workflow/run.ts:159`) — test-only hook, signaled via the `_` prefix.

---

## Test plan (commands to run before each commit)

```bash
pnpm exec biome check --write
pnpm build                    # MANDATORY per Phase 2 hotfix lesson (dist/cli.mjs flattens import.meta.url)
pnpm test                     # baseline 0 fail expected (Phase 4 ship state)

# Phase 5 specific manual verifications:
node dist/cli.mjs run discuss --dry-run --task "x"
# Expected stderr: [stage discuss complete]\nNext stage: harnessed run plan\n(In Claude Code: /plan)\n
# (Note: --dry-run currently exits before the hint code path at L107 — verify hint path
#  fires on --dry-run too OR document that hint only emits on real-run path.)

node dist/cli.mjs run verify-paranoid --dry-run --task "x"
# Expected stderr (parent-stage fallback): includes Next stage: harnessed run retro

node dist/cli.mjs run retro --dry-run --task "x"
# Expected stderr: ONLY [stage retro complete]\n (no Next stage: lines — chain end)

node dist/cli.mjs run auto --dry-run --task "x"
# Expected stderr: ONLY [stage auto complete]\n (no Next stage: lines — super-master, whole chain runs)
```

Regression sweeps:
```bash
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-real-spawn.test.ts   # Phase 2 regression
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-max-iterations.test.ts  # Phase 3 regression
pnpm test tests/cli/run.test.ts          # 16 existing + ~8 NEW Phase 5 cells = ~24 total
pnpm test tests/cli/research.test.ts     # Phase 4 regression
pnpm test tests/cli/execute-task.test.ts # Phase 4 regression
```

---

## Atomic commit plan

| # | Files | Suggested message | Wave |
|---|-------|-------------------|------|
| 1 | `src/cli/run.ts` (getNextHint real impl + _resetAutoChainCache test hook + header comment) + `tests/cli/run.test.ts` (add cells 16-23 + tighten cell 14) | `feat(cli): v3.4.4 real getNextHint reads workflows/auto/workflow.yaml delegates_to (Phase 5; replaces Phase 1 stub)` | 1 |
| 2 | `CHANGELOG.md` (Phase 5 section append) | `docs(changelog): v3.4.4 Phase 5 real getNextHint + stderr stage hint envelope` | 2 |

**Execution order**: Sequential — Commit 1 ships the feature + tests atomically; Commit 2 documents. Phase 5 is small enough that 2 commits suffice (no parallel wave). Sister Phase 1-4 each used 4-5 commits; Phase 5 narrows to 2 because:
- No new yaml files (Phase 4 ships `workflows/execute-task/workflow.yaml`; Phase 5 only reads existing `auto/workflow.yaml`).
- No new test files (extend existing `tests/cli/run.test.ts` describe block).
- No new CLI subcommands (modifies existing `run` subcommand behavior).
- No alias migrations (Phase 4 territory).

---

## Open verifications before implement

1. **`workflows/auto/workflow.yaml` `delegates_to[]` shape** — VERIFIED L42-61: 6 entries with `sub` (string) + `mode: serial` + `order: 0-5` + optional `gate` (only on `sub: research`). Sorted by `order` ascending gives `[research, discuss, plan, task, verify, retro]`. **No surprises expected** — implementer should sanity-check the sort produces this exact array.
2. **`--dry-run` path — does hint fire?** — `src/cli/run.ts:90-93` exits BEFORE the hint code path at L107. Phase 5 inherits this — `--dry-run` paths do NOT emit stage-complete hints. **Implementer decision**: (a) leave as-is (hints only on real-run path; sister Phase 1 behavior), or (b) move hint emission into dry-run branch too. **Recommend (a)** — dry-run is a JSON envelope dump; adding text to stderr would muddy machine-parseable output. Document in CHANGELOG that hints only fire on apply path.
3. **Cell 14 / 15 stderr assertions** — VERIFIED both use `toContain` not `toBe` (L216 + L222-224). Phase 5 ADDITIONAL `Next stage:` lines do NOT break existing cells. Cell 14 should be additively tightened to assert the NEW envelope lines (recommended in Files section above).
4. **`loadPhases` reuse vs raw yaml.parse** — `loadPhases` from `src/workflow/loadPhases.ts:57` includes Value.Check WorkflowSchemaV3 validation. **Use `loadPhases`** — fail-soft catches validation errors AND parse errors with the same `try/catch` (sister `runWorkflow` consumes `loadPhases` at L246). Avoids duplicating yaml parsing logic.
5. **Cache state isolation across test fixtures** — Module-level `let _autoChainCache` persists across vitest fixtures within the same module instance. Each fixture MUST call `_resetAutoChainCache()` in `beforeEach` to start with cold cache. Cell 22 (cache verify) depends on this — verify spy count is `1` not `2-3` from carry-over.
6. **`process.stderr.write` mock interaction with existing cells** — `runCli` helper (`tests/cli/run.test.ts:42-48`) already mocks `process.stderr.write` to capture stderr. The new fail-soft path in `getNextHint` writes via `process.stderr.write` directly — mock catches it. Cell 23 fail-soft test installs its OWN `stderrWrite` spy (separate from `runCli`) — verify no double-installation conflict (it's calling `getNextHint` directly, not via `runCli`, so isolation is clean).
7. **`getNextHint('research')` — direct hit even though research has a gate** — `delegates_to[0]` has `gate: judgments.stage-routing.auto-research-unclear.fires`. The gate is a RUNTIME concern (masterOrchestrator decides whether to fire research stage when /auto runs). For HINT purposes (next-stage navigation), gate is irrelevant — we always return `discuss` as the next stage after `research`. **No special handling needed**.

---

## NOT in Phase 5 (deferred)

| Phase | Deferred work |
|-------|---------------|
| 6 | Delete `src/routing/` + `src/routing-engine/` + `tests/routing/*` + `tests/integration/routing-research-workflow.test.ts` + `workflows/execute-task/phases.yaml` (v2 legacy SoT). Remove `t('install.aborted')` / `t('research.install_fix_hint')` i18n keys (no longer reachable from CLI surface post-Phase 4). Final cleanup wave for v3.4.4. |
| 6 (or 7) | `gateContext.modelOverride` consumption at sdkSpawn level (Phase 4 captures into gateContext but doesn't propagate to AgentDefinition `model` field; sdkSpawn-level override needs separate plumb beyond `--model-tier inherit` B-10 path). |
| Future | --dry-run hint emission (if user feedback warrants). Stage-skip awareness in hints (e.g. when `research` gate evaluates false, next hint after `auto` should jump to `discuss`). Both deferred pending UX feedback after v3.4.4 ships. |
