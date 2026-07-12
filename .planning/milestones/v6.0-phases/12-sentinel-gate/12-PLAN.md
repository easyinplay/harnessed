---
phase: 12-sentinel-gate
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/checkpoint/evidence.ts
  - tests/checkpoint/evidence.test.ts
  - src/cli/checkpoint.ts
  - tests/checkpoint/checkpoint-complete-planning.test.ts
autonomous: true
requirements:
  - REQ-v60-sentinel-gate
  - REQ-v60-validation
status: ready-to-execute

verified_refs:
  - "src/checkpoint/evidence.ts (exists) — checkArtifacts, CheckArtifactsResult, EvidenceRefType; hashFile, detectDrift; imports node:fs/promises stat"
  - "src/cli/checkpoint.ts L148-211 (exists) — complete path: checkArtifacts → block(missing&&!force) → evidenceStatus → mutateSubProgress(markIfSeeded) → completePhase"
  - "src/checkpoint/state.ts (exists) — readCurrentWorkflow():Promise<CurrentWorkflowV1Type|null>; mutateSubProgress(fn)"
  - "src/checkpoint/schema/currentWorkflow.v1.ts (exists) — CurrentWorkflowV1Type has phase:string, started_at:string, status; SubProgressEntryType"
  - "tests/checkpoint/evidence.test.ts (exists) — mkdtempSync tmpdir pattern; writeLeaf/writeArtifact helpers; process.chdir cwd isolation"
  - "tests/checkpoint/checkpoint-complete-planning.test.ts (NEW)"
  - "1179-test baseline from REQ-v60-doc-discipline (Phase 11 Done)"

must_haves:
  truths:
    - "harnessed checkpoint complete <sub> exits 1 with a transparent message when .planning/ exists and STATE.md is absent, and --force was NOT passed"
    - "harnessed checkpoint complete <sub> exits 0 (evidence_status: overridden) when the same condition holds but --force IS passed"
    - "harnessed checkpoint complete <sub> exits 0 normally when .planning/STATE.md is present (synced)"
    - "harnessed checkpoint complete <sub> exits 0 normally when no .planning/ directory exists in cwd (non-GSD user unaffected)"
    - "checkPlanningSync returns none_declared when no .planning/ dir exists"
    - "checkPlanningSync returns missing when .planning/ exists but STATE.md is absent"
    - "checkPlanningSync returns verified when .planning/STATE.md exists"
    - "The existing checkpoint ledger (mutateSubProgress / single mark) is reused; no new state store"
    - "biome + tsc + full vitest green; no regression vs 1179-test baseline"
  artifacts:
    - path: "src/checkpoint/evidence.ts"
      provides: "checkPlanningSync pure fn + CheckPlanningSyncResult interface"
      contains: "checkPlanningSync"
    - path: "src/cli/checkpoint.ts"
      provides: "wired checkPlanningSync into complete path; merged missing sets"
      contains: "checkPlanningSync"
    - path: "tests/checkpoint/evidence.test.ts"
      provides: "unit tests for checkPlanningSync (none_declared / missing / verified)"
      contains: "checkPlanningSync"
    - path: "tests/checkpoint/checkpoint-complete-planning.test.ts"
      provides: "integration tests for complete-path block/override/na/synced"
      contains: "planning"
  key_links:
    - from: "src/cli/checkpoint.ts complete path"
      to: "src/checkpoint/evidence.ts checkPlanningSync"
      via: "dynamic import after checkArtifacts call"
      pattern: "checkPlanningSync"
    - from: "checkPlanningSync"
      to: ".planning/STATE.md"
      via: "stat(join(cwd, '.planning', 'STATE.md'))"
      pattern: "\\.planning.*STATE\\.md"
---

<objective>
Implement the `.planning/` sync guard (强制执行哨兵 G2) layered on the existing fail-closed
evidence guard at `harnessed checkpoint complete`. Adds `checkPlanningSync` as a pure sibling
function to `checkArtifacts` in `src/checkpoint/evidence.ts`, wires it into the complete path in
`src/cli/checkpoint.ts`, and covers it with unit + integration tests (TDD red→green→refactor).

Purpose: The CLAUDE.md 强制执行哨兵 requires that before emitting COMPLETE the `.planning/`
progress doc has been updated. The existing evidence guard covers declared artifacts but not the
GSD `.planning/STATE.md` sync. This phase closes that gap using the same fail-closed halt +
`--force` override contract (ADR-0033) so non-GSD users are completely unaffected.

Output:
- `src/checkpoint/evidence.ts` MODIFIED — `checkPlanningSync` + `CheckPlanningSyncResult`
- `src/cli/checkpoint.ts` MODIFIED — wired in complete path, merged missing sets
- `tests/checkpoint/evidence.test.ts` MODIFIED — `checkPlanningSync` unit tests appended
- `tests/checkpoint/checkpoint-complete-planning.test.ts` NEW — complete-path integration tests
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/12-sentinel-gate/findings.md

# Key source files (read before implementing)
@src/checkpoint/evidence.ts
@src/cli/checkpoint.ts
@src/checkpoint/state.ts
@src/checkpoint/schema/currentWorkflow.v1.ts
@tests/checkpoint/evidence.test.ts
</context>

<tasks>

<!-- ═══════════════════════════════════════════════════════════════════
     T12.1 — RED: write failing tests for checkPlanningSync + complete-path block
     ═══════════════════════════════════════════════════════════════════ -->
<task type="tdd" tdd="true" phase="red">
  <name>T12.1 RED — failing tests for checkPlanningSync and complete-path sentinel block</name>
  <files>
    tests/checkpoint/evidence.test.ts (MODIFY — append describe block),
    tests/checkpoint/checkpoint-complete-planning.test.ts (NEW)
  </files>
  <behavior>
    Unit tests for checkPlanningSync (append to existing evidence.test.ts describe structure):
    - none_declared: cwd has no .planning/ dir → status 'none_declared', missing []
    - missing: cwd has .planning/ dir but no STATE.md → status 'missing', missing includes '.planning/STATE.md'
    - verified: cwd has .planning/STATE.md (any content) → status 'verified', missing []

    Integration tests in checkpoint-complete-planning.test.ts (mock the complete path):
    - block: .planning/ dir exists, STATE.md absent, opts.force=false → process.exit(1) called,
      error message contains '.planning/STATE.md' and 'BLOCKED'
    - override: .planning/ dir exists, STATE.md absent, opts.force=true → process.exit(0) called,
      log message contains 'overridden'
    - synced: .planning/STATE.md present → process.exit(0) called, log contains 'evidence: verified'
      or log does not mention 'BLOCKED'
    - na (none_declared): no .planning/ dir at all → process.exit(0) called, no block

    All tests MUST FAIL before implementation (RED). Commit with message:
    test(12-sentinel-gate): add failing tests for checkPlanningSync + complete-path sentinel block
  </behavior>
  <action>
    Append a new `describe('checkPlanningSync', ...)` block to `tests/checkpoint/evidence.test.ts`.
    Mirror the existing cwd-isolation pattern: `mkdtempSync` tmpdir, `process.chdir` into it in
    beforeEach, restore in afterEach. Import `checkPlanningSync` from `../../src/checkpoint/evidence.js`
    — this import will fail until T12.2 adds the export (RED confirmed).

    For the three unit cases:
    - none_declared: do NOT create `.planning/` — call `checkPlanningSync(process.cwd(), null)` and
      assert `{ status: 'none_declared', missing: [] }`.
    - missing: `mkdirSync(join(cwd, '.planning'), { recursive: true })` but write NO STATE.md —
      assert `{ status: 'missing', missing: ['.planning/STATE.md'] }`.
    - verified: also `writeFileSync(join(cwd, '.planning', 'STATE.md'), '# state\n', 'utf8')` —
      assert `{ status: 'verified', missing: [] }`.

    `workflowState` parameter: pass `null` for all unit tests (the guard's hard gate is STATE.md
    existence; `workflowState` is accepted for future mtime-warn use but unused in the predicate).

    For `checkpoint-complete-planning.test.ts`: use vitest `vi.spyOn(process, 'exit')` (mock to
    throw or capture) and spy on `console.error` / `console.log`. Import the complete handler
    function from `src/cli/checkpoint.ts` OR drive it through the CLI command object if a direct
    function export exists. If checkpoint.ts only registers a Commander action (no exported handler
    fn), spy on dynamic imports via `vi.mock` to intercept `checkArtifacts` (return
    `{ status: 'none_declared', found: [], missing: [] }`) and `checkPlanningSync`. Set up a real
    tmpdir cwd with/without `.planning/STATE.md` for each case. The goal is to confirm the merged
    missing-sets block/pass logic — not to replicate the full engineHook chain. Keep tests focused
    and hermetic.

    Do NOT implement `checkPlanningSync` yet. The import will be an unresolved export — tests fail
    at import or at call site. Run `pnpm exec vitest run tests/checkpoint/evidence.test.ts
    tests/checkpoint/checkpoint-complete-planning.test.ts` to confirm RED, then commit.
  </action>
  <verify>
    <automated>cd "D:/GitCode/harnessed" && pnpm exec vitest run tests/checkpoint/evidence.test.ts tests/checkpoint/checkpoint-complete-planning.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>
    Both test files exist. Running the targeted vitest command shows failures specifically on
    checkPlanningSync-related tests (import error or assertion failure). Commit
    `test(12-sentinel-gate): add failing tests for checkPlanningSync + complete-path sentinel block`
    exists.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════════
     T12.2 — GREEN: implement checkPlanningSync + wire checkpoint.ts
     ═══════════════════════════════════════════════════════════════════ -->
<task type="tdd" tdd="true" phase="green">
  <name>T12.2 GREEN — implement checkPlanningSync and wire into checkpoint.ts complete path</name>
  <files>
    src/checkpoint/evidence.ts (MODIFY — add CheckPlanningSyncResult + checkPlanningSync),
    src/cli/checkpoint.ts (MODIFY — wire checkPlanningSync in complete path, merge missing sets)
  </files>
  <behavior>
    checkPlanningSync(cwd, workflowState) pure fn:
    - If .planning/ dir does NOT exist in cwd → { status: 'none_declared', missing: [] }
    - If .planning/ dir exists but .planning/STATE.md does NOT exist →
        { status: 'missing', missing: ['.planning/STATE.md'] }
    - If .planning/STATE.md exists → { status: 'verified', missing: [] }

    checkpoint.ts complete path (after existing checkArtifacts call):
    - Call checkPlanningSync(process.cwd(), workflowState_or_null)
    - Merge: combinedMissing = [...artifactResult.missing, ...planningSyncResult.missing]
    - Block: if combinedMissing.length > 0 && !opts.force → console.error BLOCKED message
      listing all items (including the .planning/STATE.md path if unsynced) → process.exit(1)
    - Force path: proceeds to evidenceStatus resolution; planning missing + force → 'overridden'
    - Single mark: existing mutateSubProgress(markIfSeeded(...)) call unchanged
    - Log line: existing `[harnessed] checkpoint complete: ${sub} (evidence: ${evidenceStatus})`
      unchanged
  </behavior>
  <action>
    In `src/checkpoint/evidence.ts`, add immediately after the `CheckArtifactsResult` interface:

    ```
    export interface CheckPlanningSyncResult {
      status: 'verified' | 'missing' | 'none_declared'
      missing: string[]
    }
    ```

    Then add `checkPlanningSync` as a new exported async function after `checkArtifacts`:

    - Import `stat` is already imported from `node:fs/promises`. Also import `join` from
      `node:path` (already imported as `resolve` — add `join` to the destructure or use
      `resolve(cwd, '.planning')` inline).
    - Check `.planning/` dir: `stat(resolve(cwd, '.planning')).then(s => s.isDirectory()).catch(() => false)`.
      If false → return `{ status: 'none_declared', missing: [] }`.
    - Check STATE.md: `stat(resolve(cwd, '.planning', 'STATE.md')).then(s => s.isFile()).catch(() => false)`.
      If false → return `{ status: 'missing', missing: ['.planning/STATE.md'] }`.
    - Else return `{ status: 'verified', missing: [] }`.
    - `workflowState` parameter type: `CurrentWorkflowV1Type | null` (already imported from
      `./schema/currentWorkflow.v1.js` via the existing `EvidenceRefType` import — check the
      actual exports of that module; `CurrentWorkflowV1Type` is exported from
      `src/checkpoint/schema/currentWorkflow.v1.ts`). If not yet imported in evidence.ts, add the
      import. The parameter is accepted but unused in the hard-gate predicate (reserved for future
      mtime-warn extension per locked decision D5).

    In `src/cli/checkpoint.ts`, inside the `action === 'complete'` block:

    After `const result = await checkArtifacts(sub, getPackageRoot())`, add:
    ```
    const { checkPlanningSync } = await import('../checkpoint/evidence.js')
    const syncResult = await checkPlanningSync(process.cwd(), null)
    ```

    Replace the existing block condition:
    ```
    // was: if (result.missing.length > 0 && !opts.force)
    const allMissing = [...result.missing, ...syncResult.missing]
    if (allMissing.length > 0 && !opts.force) {
      console.error(`[harnessed] checkpoint complete BLOCKED: ${sub} — ${allMissing.length} item(s) missing (evidence guard + .planning/ sync, fail-closed):`)
      for (const m of allMissing) console.error(`  - ${m}`)
      console.error('  (re-run with --force to override and record evidence_status=overridden)')
      process.exit(1)
      return
    }
    ```

    Update the force-path evidenceStatus check:
    ```
    // was: if (result.missing.length > 0 && opts.force)
    if (allMissing.length > 0 && opts.force) evidenceStatus = 'overridden'
    ```

    Keep everything else (markOpts, mutateSubProgress call, completePhase, log line) exactly as-is.
    The single-mark guarantee is preserved because allMissing replaces result.missing only in the
    gate check; found evidence refs still come from result.found (artifact evidence only).

    Run `pnpm exec vitest run tests/checkpoint/evidence.test.ts
    tests/checkpoint/checkpoint-complete-planning.test.ts` — all must pass (GREEN).
    Commit: `feat(12-sentinel-gate): implement checkPlanningSync + wire sentinel into checkpoint complete`
  </action>
  <verify>
    <automated>cd "D:/GitCode/harnessed" && pnpm exec vitest run tests/checkpoint/evidence.test.ts tests/checkpoint/checkpoint-complete-planning.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>
    All checkPlanningSync unit tests pass (none_declared / missing / verified). Complete-path
    integration tests pass (block / override / synced / na). No pre-existing tests broken in the
    two targeted files. Commit exists.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════════
     T12.3 — REFACTOR + FULL GATE: biome, tsc, full vitest, no regression
     ═══════════════════════════════════════════════════════════════════ -->
<task type="auto">
  <name>T12.3 REFACTOR + GATE — biome lint, tsc typecheck, full vitest green, no regression</name>
  <files>
    src/checkpoint/evidence.ts (MODIFY if refactor needed),
    src/cli/checkpoint.ts (MODIFY if refactor needed)
  </files>
  <action>
    Refactor step (minimal — karpathy simplicity):
    - Review `checkPlanningSync` for any dead code, redundant awaits, or duplicate stat calls.
      The three-path structure (none_declared → missing → verified) should be ≤ 15 lines of
      function body. No changes needed if already clean.
    - Ensure the `workflowState` parameter is properly typed (not `any`) and the
      `CheckPlanningSyncResult` interface JSDoc mirrors the `CheckArtifactsResult` comments
      (three-state semantics).

    Then run the full gate sequence in order:

    1. `pnpm exec biome check --write src/checkpoint/evidence.ts src/cli/checkpoint.ts
       tests/checkpoint/evidence.test.ts tests/checkpoint/checkpoint-complete-planning.test.ts`
       Fix any lint/format issues biome reports before proceeding.

    2. `pnpm exec tsc --noEmit`
       Fix any type errors. Common issues: missing import for `CurrentWorkflowV1Type` in
       evidence.ts; `allMissing` referenced before declaration in checkpoint.ts; parameter
       type mismatch on `checkPlanningSync`.

    3. `pnpm exec vitest run` (full suite — NOT targeted)
       Must pass with count >= 1179 (Phase 11 baseline). Zero regressions permitted.
       If count is exactly 1179 + new tests count → correct. If any pre-existing test
       fails → diagnose and fix before committing.

    If biome or tsc introduces changes, re-run vitest to confirm still green.

    Commit: `refactor(12-sentinel-gate): biome + tsc clean; full vitest green (no regression)`
  </action>
  <verify>
    <automated>cd "D:/GitCode/harnessed" && pnpm exec biome check src/checkpoint/evidence.ts src/cli/checkpoint.ts 2>&1 | tail -5 && pnpm exec tsc --noEmit 2>&1 | tail -5 && pnpm exec vitest run 2>&1 | tail -10</automated>
  </verify>
  <done>
    `pnpm exec biome check` exits 0 on modified files. `pnpm exec tsc --noEmit` exits 0.
    `pnpm exec vitest run` exits 0 with total test count >= 1179. The new checkPlanningSync
    unit tests and complete-path integration tests appear in the run output and pass.
    All three commits (RED / GREEN / REFACTOR) exist in git log.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cwd → `.planning/STATE.md` | `checkPlanningSync` stats a path derived from `process.cwd()`. An adversarial cwd (path traversal) could be crafted. |
| CLI opts → `--force` flag | `--force` bypasses the sentinel; the flag is user-supplied. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-01 | Tampering | `checkPlanningSync` path construction | accept | Path is `resolve(cwd, '.planning', 'STATE.md')` — `resolve` normalizes traversal segments; the existing `checkPathSafe` guard in checkpoint.ts already covers CLI inputs; pure stat (no write) so no escalation vector. |
| T-12-02 | Denial of Service | `process.exit(1)` sentinel block | accept | Intentional by design (fail-closed); `--force` escape hatch is documented; non-GSD users unaffected (none_declared path). |
| T-12-03 | Spoofing | `.planning/STATE.md` presence gating | accept | Gate is existence-only; an empty file passes. Staleness (content spoofing) is explicitly deferred per locked decision D5 (user rejected mtime gating). Low-value target: attacker must already control the project filesystem. |
| T-12-SC | Tampering | npm installs | mitigate | No new packages installed in this phase — all implementation uses existing node:fs/promises + existing imports. Slopcheck N/A. |
</threat_model>

<verification>
Run in sequence after all three tasks complete:

```bash
# 1. Biome clean on modified files
pnpm exec biome check src/checkpoint/evidence.ts src/cli/checkpoint.ts \
  tests/checkpoint/evidence.test.ts \
  tests/checkpoint/checkpoint-complete-planning.test.ts

# 2. TypeScript typecheck
pnpm exec tsc --noEmit

# 3. Full vitest (no regression vs 1179-baseline)
pnpm exec vitest run

# 4. Smoke: sentinel blocks without --force (tmpdir with .planning/ but no STATE.md)
#    (manual verification — not automated in CI, covered by integration tests)
```

Confirm:
- [ ] `checkPlanningSync` exported from `src/checkpoint/evidence.ts`
- [ ] `CheckPlanningSyncResult` interface exported from `src/checkpoint/evidence.ts`
- [ ] `checkpoint.ts` complete path calls `checkPlanningSync` and merges missing sets
- [ ] Block message names `.planning/STATE.md` explicitly
- [ ] No new state store introduced (only `mutateSubProgress` reused)
- [ ] vitest count >= 1179, all green
- [ ] Three atomic commits: RED → GREEN → REFACTOR
</verification>

<success_criteria>
1. `checkPlanningSync(cwd, null)` returns `none_declared` when no `.planning/` dir exists.
2. `checkPlanningSync(cwd, null)` returns `missing` with `['.planning/STATE.md']` when `.planning/` exists but STATE.md absent.
3. `checkPlanningSync(cwd, null)` returns `verified` when `.planning/STATE.md` exists.
4. `harnessed checkpoint complete <sub>` exits 1 with BLOCKED message naming `.planning/STATE.md` when condition 2 holds and `--force` not passed.
5. Same command exits 0 with `evidence: overridden` when `--force` IS passed.
6. Same command exits 0 normally when condition 3 holds (synced).
7. Same command exits 0 normally when no `.planning/` dir (none_declared — non-GSD users unblocked).
8. Single ledger mark preserved — `mutateSubProgress` called once, no new state store.
9. `pnpm exec biome check --write` clean, `pnpm exec tsc --noEmit` clean.
10. `pnpm exec vitest run` green, count >= 1179, zero regressions.
11. REQ-v60-sentinel-gate satisfied; REQ-v60-validation (Phase 12 gate) satisfied.
</success_criteria>

<output>
Create `.planning/phases/12-sentinel-gate/12-01-SUMMARY.md` when done, covering:
- What was built (checkPlanningSync contract, wire-in, test coverage)
- Three-state predicate (STATE.md existence as hard gate; workflowState param reserved)
- Commit hashes for RED / GREEN / REFACTOR
- Final vitest count and baseline delta
- Any deviations from this plan (document in SUMMARY, not here)
</output>
