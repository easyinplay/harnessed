---
status: ready-to-execute
phase: 11-doc-discipline
milestone: v6.0
requirements:
  - REQ-v60-doc-discipline
  - REQ-v60-validation
wave_count: 3
autonomous: true
---

# Phase 11 — doc-discipline: 7th L0 Discipline Substrate

Codify CLAUDE.md 文档纪律 section as a 7th L0 discipline yaml + wire commit-time enforcement.

Additive-only. No existing discipline/capability/architecture mutated.

---

## Open Questions

None. All ambiguities resolved in findings.md + locked decisions. `status: ready-to-execute`.

---

## Task Breakdown

### T11.1 — Create `workflows/disciplines/doc-discipline.yaml` [Wave 1]

**Files:** `workflows/disciplines/doc-discipline.yaml` — **NEW**

**Depends on:** nothing

**Satisfies:** REQ-v60-doc-discipline

**Reference verified:** `workflows/disciplines/operational.yaml` ✓existing (schema shape), `src/workflow/schema/discipline.ts` ✓existing (DisciplineRule fields)

**Action:**

Create the 7th L0 discipline yaml. Must satisfy the TypeBox `Discipline` schema (`additionalProperties: false` strict). Match the EXACT `DisciplineRule` shape: `id`, `description`, `enforcement`, `trigger`, `check_method`, optional `auto_fix_cmd` — no extra keys.

```yaml
schema_version: harnessed.discipline.v1
discipline: doc
enforcement_layer: commit
auto_enforce: true
```

Six rules in this order (ids are kebab, enforcement from findings.md table):

1. `id: state-digest-line-limit` — `enforcement: halt`, `check_method: external-cmd`
   - `description`: STATE.md >100 lines triggers halt; override via `HARNESSED_ALLOW_LONG_STATE=1`
   - `trigger`: `"phase.type == 'commit' AND changed_files contains '.planning/STATE.md'"`
   - `auto_fix_cmd`: omit (halt rules do not auto-fix; override is env-based in TS, not yaml)

2. `id: one-fact-per-file` — `enforcement: warn`, `check_method: heuristic`
   - `description`: Decision docs must be single-topic; duplicate fact spread across files violates one-fact-per-file
   - `trigger`: `"phase.type == 'commit' AND changed_files matches '\\.planning/'"`

3. `id: overview-pointer-no-inline-narrative` — `enforcement: warn`, `check_method: heuristic`
   - `description`: ROADMAP/overview docs must not inline closing narrative (叙事进 SUMMARY, not ROADMAP)
   - `trigger`: `"phase.type == 'commit' AND changed_files matches 'ROADMAP\\.md|STATE\\.md'"`

4. `id: transient-consume-then-archive` — `enforcement: warn`, `check_method: heuristic`
   - `description`: HANDOFF and other transient artifacts must be archived after consumption, not accumulated at .planning/ root
   - `trigger`: `"phase.type == 'commit' AND changed_files matches 'HANDOFF'"`

5. `id: status-derived-from-artifacts` — `enforcement: warn`, `check_method: heuristic`
   - `description`: Phase status must derive from VERIFICATION artifacts + test results, not hand-maintained booleans in STATE/ROADMAP
   - `trigger`: `"phase.type == 'commit' AND changed_files contains '.planning/STATE.md'"`

6. `id: responsibility-matrix-one-home` — `enforcement: info`, `check_method: heuristic`
   - `description`: Each fact has exactly one home per responsibility matrix (decision→ADR, requirement→REQUIREMENTS, etc.); cross-file duplication is a violation
   - `trigger`: `"phase.type == 'commit' AND changed_files matches '\\.planning/'"`

Do NOT add any keys outside the schema (no `version`, no `tags`, no extra root keys). Mirror the comment header style from `operational.yaml`.

**Acceptance:** `Value.Check(Discipline, parsed)` returns `true` for the yaml. Task T11.3 schema test confirms this.

---

### T11.2 — Register `doc-discipline` capability in `workflows/capabilities.yaml` [Wave 1]

**Files:** `workflows/capabilities.yaml` — **MODIFY**

**Depends on:** nothing (parallel with T11.1)

**Satisfies:** REQ-v60-doc-discipline

**Reference verified:** `workflows/capabilities.yaml` lines 520-575 ✓existing (Bucket 6 behavioral entries), `karpathy-guidelines` entry at line ~529 ✓existing (mirror shape)

**Action:**

In `workflows/capabilities.yaml`, locate Bucket 6 (L0 Discipline Substrate behavioral ref). After the last existing behavioral entry (`conceptual-protocols`, line ~574), append the new `doc-discipline` entry before the Bucket 7 comment block:

```yaml
  doc-discipline:
    impl: harnessed-bundled
    cmd: '<not-applicable-behavioral>'
    since: v6.0
    category: behavioral
    description: STATE digest <100L halt + one-fact-per-file + overview-pointer-no-inline-narrative + transient-archive + status-from-artifacts + responsibility-one-home (6 rules)
    discipline_ref: workflows/disciplines/doc-discipline.yaml
```

Shape must match existing behavioral entries exactly: `impl`, `cmd`, `since`, `category`, `description`, `discipline_ref` — no extra keys. Two-space indent (yaml map under top-level `capabilities:` key).

**Acceptance:** `doc-discipline` key present in capabilities.yaml; capability-resolver test passes (T11.4 covers).

---

### T11.3 — Schema + disciplineLoader tests for doc-discipline [Wave 2]

**Files:** `tests/workflow/schema/discipline.test.ts` — **MODIFY**, `tests/workflow/disciplineLoader.test.ts` — **MODIFY**

**Depends on:** T11.1 (yaml must exist before loader test can read it from disk)

**Satisfies:** REQ-v60-doc-discipline, REQ-v60-validation

**TDD: red-green-refactor** — write tests first (they will fail until T11.1 yaml is present and valid); tests go green when T11.1 yaml passes schema check.

**Reference verified:** `tests/workflow/schema/discipline.test.ts` ✓existing, `tests/workflow/disciplineLoader.test.ts` ✓existing

**Action:**

**In `tests/workflow/schema/discipline.test.ts`**, add a new describe block `'Discipline — doc-discipline yaml shape'` with tests:

- `D1`: Parse `doc-discipline` shape inline (all 6 rules, correct enforcement literals) → `Value.Check(Discipline, obj)` is `true`
- `D2`: `state-digest-line-limit` rule has `enforcement: 'halt'` and `check_method: 'external-cmd'` — verify via inline object
- `D3`: `responsibility-matrix-one-home` rule has `enforcement: 'info'` — verify enforcement literal accepted by schema
- `D4`: Adding an extra root key to doc-discipline shape → `Value.Check` returns `false` (additionalProperties guard)

**In `tests/workflow/disciplineLoader.test.ts`**, append to the existing `'disciplineLoader — load each of 6 LOCKED disciplines'` describe (or add a sibling describe `'disciplineLoader — 7th discipline: doc'`):

- `D5`: `loadDiscipline('doc', PACKAGE_ROOT)` resolves, `d.discipline === 'doc'`, `d.enforcement_layer === 'commit'`, `d.rules.length === 6`
- `D6`: `DEFAULT_APPLIED` does NOT include `'doc'` (doc-discipline is opt-in via explicit `loadDiscipline` call, not in the default-applied 6 — additive constraint)
- `D7`: After loading `doc`, `getRule('doc', 'state-digest-line-limit')` returns the rule with `enforcement === 'halt'`

All tests use `_clearDisciplineCache()` in `beforeEach` (already present in the file).

**Acceptance:** All 7 new test assertions pass. No existing tests modified or broken.

---

### T11.4 — Extend `before-commit.ts` with doc-discipline STATE line-count halt [Wave 2]

**Files:** `src/discipline/enforcement/before-commit.ts` — **MODIFY**

**Depends on:** T11.1 (doc-discipline yaml must be loadable), T11.2 (capability registered — logical dependency for correctness)

**Satisfies:** REQ-v60-doc-discipline

**TDD: red-green-refactor** — test file (T11.5) written first to define expected behavior contracts; before-commit.ts implementation follows.

**Reference verified:** `src/discipline/enforcement/before-commit.ts` ✓existing (47 lines), `src/workflow/disciplineLoader.ts` ✓existing (`loadDiscipline` API)

**Action:**

Extend `runBeforeCommitHook` in `src/discipline/enforcement/before-commit.ts`. The file is currently 47 lines; the extension must keep the file ≤200 lines (karpathy hard limit). Extract a helper function if needed.

Add a second discipline block **after** the existing `loadDiscipline('operational', ...)` block:

```
const docD = await loadDiscipline('doc', ctx.packageRoot)
```

Then, when `.planning/STATE.md` is among `changedFiles`:

1. Find rule `state-digest-line-limit` in `docD.rules`.
2. If the rule's `enforcement === 'halt'`:
   a. Check `process.env.HARNESSED_ALLOW_LONG_STATE` — if set to any truthy string (`'1'`, `'true'`, etc.), skip the check and log a warning: `⚠️ doc-discipline: state-digest-line-limit override active (HARNESSED_ALLOW_LONG_STATE)`.
   b. Otherwise, count lines in the STATE.md file at `path.resolve(ctx.packageRoot, '.planning/STATE.md')` using `readFileSync` (already have `node:child_process` imported; add `readFileSync` from `node:fs`).
   c. If line count > 100: `console.error('❌ doc-discipline: STATE.md exceeds 100-line digest limit (current: N lines). Set HARNESSED_ALLOW_LONG_STATE=1 to override.')` then `process.exit(2)`.
   d. If line count ≤ 100: pass silently.

No other rules from doc-discipline require commit-time TS enforcement this phase (warn/info/heuristic rules are advisory, enforced via prompt-inject or future phases). The yaml encodes them as behavioral guidance.

State file path: always `<packageRoot>/.planning/STATE.md`. Use `path.resolve` (already imported as `resolve` — verify import or add).

Import additions needed: `readFileSync` from `node:fs` (add alongside existing `execSync` import from `node:child_process`). Also add `resolve` from `node:path` if not already present (check existing imports — `before-commit.ts` currently does not import `path`; add it).

**Acceptance:** Tests in T11.5 all pass. File stays ≤200 lines. `tsc` clean.

---

### T11.5 — before-commit doc-discipline enforcement tests [Wave 2]

**Files:** `tests/discipline/enforcement/before-commit.test.ts` — **MODIFY**

**Depends on:** T11.4 source exists (TDD: write test first, then implement in T11.4)

**Note on TDD ordering:** In practice, write T11.5 test stubs first (RED), then implement T11.4 (GREEN). The wave assignment reflects artifact dependency for CI, not the red-green authoring order.

**Satisfies:** REQ-v60-doc-discipline, REQ-v60-validation

**Reference verified:** `tests/discipline/enforcement/before-commit.test.ts` ✓existing (83 lines, tests 1-6)

**Action:**

Append a new `describe('doc-discipline: state-digest-line-limit', ...)` block to the existing test file. Use the same `ExitError`, `baseCtx`, `_clearDisciplineCache`, `execSyncMock` fixtures already in scope.

Add these 5 tests (continue numbering from 7):

- `test 7`: STATE.md not in changedFiles → hook completes without exit (doc rule not triggered). Use `baseCtx({ changedFiles: ['.planning/ROADMAP.md'] })`.
- `test 8`: STATE.md in changedFiles, file has ≤100 lines → hook completes, no `process.exit`. Mock `readFileSync` to return a string with 50 newlines.
- `test 9 (TDD core)`: STATE.md in changedFiles, file has 101 lines → `process.exit(2)` thrown. Mock `readFileSync` to return a string with 101 newlines. Spy on `process.exit` with `ExitError` pattern (same as tests 3/4).
- `test 10 (TDD override)`: STATE.md in changedFiles, file has 150 lines, but `process.env.HARNESSED_ALLOW_LONG_STATE = '1'` → no exit. Clean up env var in `afterEach` / `try-finally`.
- `test 11`: Override env var set to `'true'` (alternate truthy value) → no exit. Verify the override accepts any non-empty string.

Mock `readFileSync` from `node:fs` using `vi.mock('node:fs', ...)` or `vi.spyOn` at the test level — match the existing pattern for `execSync` mocking in the file.

The `_clearDisciplineCache()` call in `beforeEach` already clears the discipline cache between tests; ensure it remains in place.

**Acceptance:** All 5 new tests pass. Tests 1-6 (existing) unchanged and still green.

---

### T11.6 — Update `DEFAULT_APPLIED` comment and append `doc` to loader list [Wave 2]

**Files:** `src/workflow/disciplineLoader.ts` — **MODIFY**

**Depends on:** T11.1 (doc-discipline.yaml must exist)

**Satisfies:** REQ-v60-doc-discipline

**Reference verified:** `src/workflow/disciplineLoader.ts` ✓existing — `DEFAULT_APPLIED` at line 21 is a hard-coded array of 6 basenames with comment `/** All 6 LOCKED basenames per D-09 */`

**Action:**

The findings.md notes: "check if any hard-coded discipline-name list exists, append `doc`."

`DEFAULT_APPLIED` in `src/workflow/disciplineLoader.ts` line 21 is the only such list. However, per the locked decisions: doc-discipline is the 7th discipline but additive — it should NOT be appended to `DEFAULT_APPLIED` in this phase because `DEFAULT_APPLIED` drives `loadAllApplied(undefined, ...)` which is the "all disciplines" default loader for the master orchestrator. Adding `doc` to `DEFAULT_APPLIED` would automatically apply it in all workflow contexts, which is correct behavior for an always-on L0 discipline.

Per REQ-v60-doc-discipline: capability `doc-discipline` is `auto_enforce: true`. The before-commit hook calls `loadDiscipline('doc', root)` explicitly (T11.4), so it works regardless. But `DEFAULT_APPLIED` should also include `doc` so `loadAllApplied(undefined, root)` returns all 7 disciplines and any other consumer gets `doc` in the set.

Append `'doc'` to `DEFAULT_APPLIED` array and update the JSDoc comment from "All 6 LOCKED" to "All 7 LOCKED" with the new d-number reference:

```typescript
/** All 7 LOCKED basenames per D-09 (v6.0 adds doc). */
export const DEFAULT_APPLIED: readonly string[] = [
  'karpathy',
  'output-style',
  'language',
  'operational',
  'priority',
  'protocols',
  'doc',
]
```

Test D6 in T11.3 must be updated: D6 originally said `DEFAULT_APPLIED` does NOT include `'doc'`. After this task, it DOES include `'doc'`. Revise D6 to: `DEFAULT_APPLIED.includes('doc')` is `true` and array length is 7. (Coordinate the test wording in T11.3 accordingly — whichever is authored second should reflect the final state.)

**Acceptance:** `DEFAULT_APPLIED.length === 7`, `DEFAULT_APPLIED.includes('doc') === true`. `disciplineLoader.test.ts` updated D6 test passes.

---

### T11.7 — Final validation gate [Wave 3]

**Files:** none (read-only verification)

**Depends on:** T11.1, T11.2, T11.3, T11.4, T11.5, T11.6

**Satisfies:** REQ-v60-validation

**Action:**

Run the complete quality gate in sequence:

1. **Biome lint + format** (mandatory per project CLAUDE.md before any TS commit):
   ```
   corepack pnpm exec biome check --write
   ```
   Fix any reported issues in T11.4/T11.5/T11.6 modified files before proceeding.

2. **TypeScript compile check**:
   ```
   corepack pnpm exec tsc --noEmit
   ```
   Must be clean (zero errors). Pay attention to: `readFileSync` import in `before-commit.ts`, `resolve`/`path` import if added.

3. **Schema validation smoke-check** (manual inline verification):
   Run a one-off node snippet or confirm via test output that `doc-discipline.yaml` passes `Value.Check(Discipline, parsed)`. The T11.3 loader test covers this automatically.

4. **Full vitest run**:
   ```
   corepack pnpm exec vitest run
   ```
   Must produce ≥ 1167 + new tests passing, zero failures, zero regressions vs the v5.1 baseline. New test count: T11.3 adds 7, T11.5 adds 5 = 12 new tests minimum → expect ≥1179 total.

5. **Capability-resolver spot-check** (confirm `doc-discipline` key loadable):
   In `tests/unit/capability-resolver.test.ts` — no modification needed; the behavioral category entries are not directly exercised by the resolver's install-type path. Confirm by grepping `doc-discipline` in capabilities.yaml output and verifying `loadDiscipline('doc', PACKAGE_ROOT)` resolves cleanly (covered by T11.3 D5).

6. **Windows CI compatibility check**:
   Verify `readFileSync` line-counting in T11.4 uses `\n` split (cross-platform). The STATE.md file on Windows may have `\r\n` line endings — split on `/\r?\n/` to count correctly:
   ```typescript
   const lines = content.split(/\r?\n/)
   const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
   ```
   Confirm T11.4 implementation uses this pattern.

**Acceptance:** biome clean, tsc clean, vitest ≥1179 passing with zero failures, no regression.

---

## Wave Summary

| Wave | Tasks | Parallelizable | Prerequisite |
|------|-------|---------------|--------------|
| 1 | T11.1 (yaml), T11.2 (capability) | Yes — no file overlap | none |
| 2 | T11.3 (schema tests), T11.4 (hook), T11.5 (hook tests), T11.6 (loader) | T11.3+T11.4+T11.5+T11.6 can proceed after T11.1 lands; T11.5 TDD loop is T11.4+T11.5 paired | T11.1 must be written (even if yaml is a stub) |
| 3 | T11.7 (validation gate) | No | all prior tasks |

TDD pairing: T11.5 (tests) and T11.4 (implementation) must be worked in tandem — write test stubs first (RED), implement hook (GREEN), refine (REFACTOR).

---

## File Reference Summary

| File | Status | Task |
|------|--------|------|
| `workflows/disciplines/doc-discipline.yaml` | NEW | T11.1 |
| `workflows/capabilities.yaml` | MODIFY | T11.2 |
| `tests/workflow/schema/discipline.test.ts` | MODIFY | T11.3 |
| `tests/workflow/disciplineLoader.test.ts` | MODIFY | T11.3 |
| `src/discipline/enforcement/before-commit.ts` | MODIFY | T11.4 |
| `tests/discipline/enforcement/before-commit.test.ts` | MODIFY | T11.5 |
| `src/workflow/disciplineLoader.ts` | MODIFY | T11.6 |

Total: 1 NEW file, 6 MODIFY files, 7 tasks across 3 waves.

---

## Verified Cross-References

```yaml
verified_refs:
  - "workflows/disciplines/operational.yaml (exists — shape reference)"
  - "src/workflow/schema/discipline.ts (exists — DisciplineRule TypeBox schema)"
  - "src/discipline/enforcement/before-commit.ts (exists — extension point identified line 22)"
  - "src/workflow/disciplineLoader.ts (exists — DEFAULT_APPLIED line 21, loadDiscipline API)"
  - "workflows/capabilities.yaml lines 520-575 (exists — Bucket 6 behavioral entries verified)"
  - "tests/workflow/schema/discipline.test.ts (exists — modification target)"
  - "tests/workflow/disciplineLoader.test.ts (exists — modification target)"
  - "tests/discipline/enforcement/before-commit.test.ts (exists — modification target, 83 lines)"
  - "tests/unit/capability-resolver.test.ts (exists — no modification needed)"
  - "workflows/disciplines/doc-discipline.yaml (NEW — created by T11.1)"
</yaml>
```
