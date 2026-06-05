# Phase 6 Spec — v3.4.4 FINAL cleanup: hoist routing deps + delete `src/routing/` + i18n & doc-path cleanup

> **Scope**: Phase 6 is the FINAL wave of v3.4.4 — collapse the dead `src/routing/` tree (1247 LOC across 14 files) by hoisting the 5 still-live cross-package dependency files to `src/workflow/lib/` (sister sdkSpawn / ralphLoop relocation), pulling the still-live `agentDefinition.ts` types + `decisionRules.ts` `Rule` type up to a shared home for the LIVE audit + workflow consumers, then deleting the rest of `src/routing/` + `src/routing-engine/` + the unit/integration tests that import deleted modules + the v2 legacy `workflows/execute-task/phases.yaml` SoT. Also clean up two stale i18n keys (`research.dry_run.*` + `research.install_fix_hint`) whose only consumer (pre-Phase-4 `src/cli/research.ts`) no longer references them, plus three stale `src/routing/lib/...` path mentions in shipped workflow yaml/md (doc-rot triggered by Phase 2's relocation).
>
> **Out of scope (deferred to v3.5.0+)**: `_dispatchSkillStub` → `dispatchSkill` rename (cosmetic; breaks 16+ DI-seam test fixtures for ~zero user-facing value — see D-3). `gateContext.modelOverride` propagation to `AgentDefinition.model` at sdkSpawn level (Phase 4 captured into gateContext, never flowed through). `--dry-run` hint emission (Phase 5 left apply-path only).

---

## Scope

- **Part A — HOIST 5 live cross-dep files** from `src/routing/` + `src/routing/lib/` to `src/workflow/lib/`. These are the ONLY files in `src/routing/` that LIVE post-Phase-4 (consumed by `src/workflow/lib/sdkSpawn.ts` + `src/workflow/lib/ralphLoop.ts`). Files: `agentDefinition.ts` (195 LOC), `completionSchema.ts` (33 LOC), `lib/sdkReconcile.ts` (56 LOC), `lib/promiseExtract.ts` (32 LOC), `lib/fallbackHandlers.ts` (92 LOC). Audit confirmed in `## Open verifications` § 1-5 below.

- **Part B — UPDATE imports in 4 src/ files + 5 tests/ files** to point at the hoisted locations. Affected src/ files: `src/workflow/lib/sdkSpawn.ts` (3 paths) + `src/workflow/lib/ralphLoop.ts` (3 paths) + `src/audit/hook.ts` (2 paths) + `src/audit/log.ts` (2 paths) + `src/workflow/run.ts` (1 path). Affected tests/ files: `tests/workflow/buildAgentDef.test.ts` + `tests/audit/log.test.ts` + `tests/audit/hook.test.ts` + 2 surviving `tests/routing/` files that get RELOCATED to `tests/workflow/` (Part D).

- **Part C — DELETE `src/routing/` + `src/routing-engine/` entirely** AFTER Parts A+B verify green. `src/routing/` minus the 5 hoisted = 9 files deleted (1247 - 408 = 839 LOC dead-code removal). `src/routing-engine/` is `.gitkeep`-only per Phase 1 spec — confirmed empty in `## Open verifications` § 7.

- **Part D — DELETE 5 + RELOCATE 3 test files** under `tests/routing/` and `tests/unit/routing-*.test.ts` + `tests/integration/routing-*.test.ts`. The 5 routing-engine-coupled tests delete (their target `runRouting` / `arbitrate` / `arbitrateWithRedirect` / `semanticMatch` / `dag` all die in Part C). The 3 surviving tests (`isComplete.test.ts` / `ralph-loop-win-sentinel.test.ts` / `sdk-spawn.test.ts` / `sdk-reconcile.test.ts` — see audit § Part D) test the HOISTED workflow/lib functions; they move to `tests/workflow/` with import-path updates.

- **Part E — DELETE `workflows/execute-task/phases.yaml`** (v2 legacy SoT). Phase 4 Commit 1 shipped the v3 `workflow.yaml` (Path A1, HANDOFF L745); the v2 file has zero live consumers post-Phase-4 — `src/cli/execute-task.ts:46` resolves via `resolveWorkflowYaml('execute-task', WORKFLOWS_DIR)` which finds `workflow.yaml` first. The v2 file is doc-rot at this point.

- **Part F — REMOVE 4 stale i18n keys** (3 of 4 confirmed dead by grep; 1 LIVE key stays): delete `research.dry_run.matched_rule` + `research.dry_run.query` + `research.dry_run.run_hint` + `research.install_fix_hint` from `messages/en.json` + `messages/zh-Hans.json`. **KEEP `install.aborted`** — still used by `src/cli/install.ts:122` + `src/cli/uninstall.ts:114` (the original spec assumption was wrong; see `## Open verifications` § 8).

- **Part G — FIX 4 stale doc-path references** to `src/routing/lib/ralphLoop.ts` + `src/routing/lib/sdkSpawn.ts` left in shipped yaml/md after Phase 2's relocation. Affected: `workflows/capabilities.yaml:454` (`sdk_ref:` field) + `workflows/execute-task/SKILL.md` L44/82/83 + `workflows/task/deliver/SKILL.md:44`. Update path to `src/workflow/lib/ralphLoop.ts` + `src/workflow/lib/sdkSpawn.ts`. Pure doc-rot fix; no code change.

- **Part H — APPEND CHANGELOG.md** v3.4.4 (Unreleased) Phase 6 section.

Effort: **5-7h**, single PR. 6 commits (Wave 1 hoist atomic → Wave 2 import-update atomic → Wave 3 deletions split into 3 parallel commits → Wave 4 CHANGELOG).

---

## Goal — acceptance criteria after Phase 6 ships

1. `git grep -n "from.*routing/" src/ tests/` returns 0 hits (all `src/routing/` import paths gone).
2. `ls src/routing` and `ls src/routing-engine` both return "No such file or directory".
3. `ls workflows/execute-task/` shows only 2 files: `SKILL.md` + `workflow.yaml` (v2 `phases.yaml` deleted).
4. `git grep -n "src/routing" -- '*.ts' '*.json' '*.yaml' '*.md'` returns 0 hits in shipped artifacts (allows hits inside `.planning/` historical docs).
5. `src/workflow/lib/` contains 7 files: `sdkSpawn.ts` + `ralphLoop.ts` + `agentDefinition.ts` (HOISTED) + `completionSchema.ts` (HOISTED) + `sdkReconcile.ts` (HOISTED) + `promiseExtract.ts` (HOISTED) + `fallbackHandlers.ts` (HOISTED).
6. `pnpm exec biome check --write && pnpm build && pnpm test` exits 0 (Phase 5 ship state preserved). Specifically: `tests/checkpoint/sdk-wire.test.ts` (Phase 3 sister) + `tests/integration/cli-run-real-spawn.test.ts` (Phase 2 regression, gated `HARNESSED_REAL_SPAWN=1`) + `tests/integration/cli-run-max-iterations.test.ts` (Phase 3 regression, gated) all green.
7. `messages/en.json` + `messages/zh-Hans.json` no longer contain `research.dry_run.matched_rule` / `research.dry_run.query` / `research.dry_run.run_hint` / `research.install_fix_hint` keys. `install.aborted` PRESERVED in both files.
8. `tests/workflow/` gains 3-4 relocated test files (`isComplete.test.ts` + `ralph-loop-win-sentinel.test.ts` + `sdk-spawn.test.ts` + `sdk-reconcile.test.ts` — count per `## Open verifications` § 10).
9. LOC reduction: ~1900 lines deleted net (1247 LOC `src/routing/` minus 408 LOC hoisted + 5 deleted test files ~1100 LOC + 73 LOC v2 phases.yaml ≈ 2012 deletions − 408 relocations = ~1604 net), with 0 user-facing regression. (Final number computed in Part H CHANGELOG.)
10. `pnpm build` (NOT just `pnpm test`) green — Phase 2 hotfix lesson honored (dist/cli.mjs bundle still produces all required entry points after `src/routing/` vanishes).
11. `harnessed run research --dry-run --task "x"` and `harnessed run execute-task --dry-run --task "x"` still emit Phase 1 universal JSON envelope (`{ workflow, yamlPath, gateContext }`). Phase 5 stage-complete envelope on apply path still fires (regression sweep cell 14 in `tests/cli/run.test.ts`).

---

## Files (file-by-file)

### Part A — HOIST 5 cross-dep files (`src/routing/...` → `src/workflow/lib/...`)

All hoists use `git mv` (preserves history). Internal relative imports inside each hoisted file get re-anchored.

#### A.1 — `src/routing/agentDefinition.ts` → `src/workflow/lib/agentDefinition.ts` (195 LOC)

```bash
git mv src/routing/agentDefinition.ts src/workflow/lib/agentDefinition.ts
```

**Internal import rewrites inside the moved file**:
```diff
-import { COMPLETE_INSTRUCTION } from './systemPrompt.js'
+// systemPrompt.ts is deleted in Part C; inline the COMPLETE_INSTRUCTION const
+// directly into agentDefinition.ts (sister Karpathy "Simplicity First" — single-
+// consumer constant pulled inline at deletion time to avoid a 2nd file move
+// for a 7-line export).
```

The inlined `COMPLETE_INSTRUCTION` body (verbatim from `src/routing/systemPrompt.ts:60-66`):
```ts
const COMPLETE_INSTRUCTION = `## CRITICAL RULE: COMPLETE marker
When your task is done, emit the exact verbatim XML wrapper
\`<promise>COMPLETE</promise>\` on its own line and nothing else after it. Do
NOT emit any other variant — not "completed", not "DONE", not bare \`COMPLETE\`,
not "✅". The parent agent will verbatim grep \`<promise>COMPLETE</promise>\` —
any deviation fails the round-trip and forces a re-spawn (max 20 iterations).
`
```

Header comment update: add a v3.4.4 Phase 6 hoist note at the top of the moved file's existing 27-line header block.

#### A.2 — `src/routing/completionSchema.ts` → `src/workflow/lib/completionSchema.ts` (33 LOC)

```bash
git mv src/routing/completionSchema.ts src/workflow/lib/completionSchema.ts
```

No internal imports — pure type export file. Header comment additive note.

#### A.3 — `src/routing/lib/sdkReconcile.ts` → `src/workflow/lib/sdkReconcile.ts` (56 LOC)

```bash
git mv src/routing/lib/sdkReconcile.ts src/workflow/lib/sdkReconcile.ts
```

**Internal import rewrite**:
```diff
-import type { AgentDefinition } from '../agentDefinition.js'
+import type { AgentDefinition } from './agentDefinition.js'
```

#### A.4 — `src/routing/lib/promiseExtract.ts` → `src/workflow/lib/promiseExtract.ts` (32 LOC)

```bash
git mv src/routing/lib/promiseExtract.ts src/workflow/lib/promiseExtract.ts
```

No internal imports — pure regex helper. Header comment additive note.

#### A.5 — `src/routing/lib/fallbackHandlers.ts` → `src/workflow/lib/fallbackHandlers.ts` (92 LOC)

```bash
git mv src/routing/lib/fallbackHandlers.ts src/workflow/lib/fallbackHandlers.ts
```

**Internal import rewrite** (the file already imports from `workflow/lib/ralphLoop.js` — same directory now):
```diff
-import type {
-  MaxIterationsExceededError,
-  VerbatimCompleteFailError,
-} from '../../workflow/lib/ralphLoop.js'
+import type {
+  MaxIterationsExceededError,
+  VerbatimCompleteFailError,
+} from './ralphLoop.js'
```

### Part B — UPDATE imports in 4 src/ files + 3 tests/ files

#### B.1 — `src/workflow/lib/sdkSpawn.ts` (3 paths)
```diff
-import type { AgentDefinition } from '../../routing/agentDefinition.js'
-import { COMPLETION_SCHEMA, type SdkResultEnvelope } from '../../routing/completionSchema.js'
-import {
-  injectFactoryInternalFields,
-  toSdkAgentDefinition,
-} from '../../routing/lib/sdkReconcile.js'
+import type { AgentDefinition } from './agentDefinition.js'
+import { COMPLETION_SCHEMA, type SdkResultEnvelope } from './completionSchema.js'
+import { injectFactoryInternalFields, toSdkAgentDefinition } from './sdkReconcile.js'
```

#### B.2 — `src/workflow/lib/ralphLoop.ts` (3 paths)
```diff
-import type { SdkResultEnvelope } from '../../routing/completionSchema.js'
-import { extractPromise } from '../../routing/lib/promiseExtract.js'
+import type { SdkResultEnvelope } from './completionSchema.js'
+import { extractPromise } from './promiseExtract.js'

 // ... later in file ...
-export type {
-  FallbackMaxIterationsExceededConfig,
-  MaxIterFallbackCtx,
-  VerbatimFallbackCtx,
-} from '../../routing/lib/fallbackHandlers.js'
-export {
-  handleMaxIterationsExceeded,
-  handleVerbatimCompleteFail,
-} from '../../routing/lib/fallbackHandlers.js'
+export type {
+  FallbackMaxIterationsExceededConfig,
+  MaxIterFallbackCtx,
+  VerbatimFallbackCtx,
+} from './fallbackHandlers.js'
+export { handleMaxIterationsExceeded, handleVerbatimCompleteFail } from './fallbackHandlers.js'
```

#### B.3 — `src/audit/hook.ts` (2 paths)
```diff
-import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
-import type { Rule } from '../routing/decisionRules.js'
+import type { ArbitrateResult, TaskContext } from '../workflow/lib/agentDefinition.js'
+import type { Rule } from '../workflow/lib/agentDefinition.js'  // see B.5 note
```

> **B.5 note — `Rule` type relocation**: `Rule` currently lives in `src/routing/decisionRules.ts` (deleted Part C). Audit needs the type. Options: **(a) inline a minimal `Rule` shape into `src/workflow/lib/agentDefinition.ts`** (audit only reads `.id` per `src/audit/hook.ts:29` + `src/audit/log.ts:57`); **(b) re-export from a new `src/workflow/lib/auditTypes.ts`**; **(c) move `decisionRules.ts` to `src/workflow/lib/` alongside** (NO — decisionRules is dead other than for the `Rule` type, hoisting it brings back 190 LOC of dead code).
>
> **Recommend (a)** — inline a minimal `Rule` interface in `agentDefinition.ts` (or sister `auditTypes.ts` 1-file if biome's `noBarrelFile` rule complains). Audit only reads `matched.id`; the full `Rule` type's 12-field decision body is irrelevant. Code:
> ```ts
> /** Minimal Rule shape consumed by audit log (Phase 6 — extracted from former
>  *  src/routing/decisionRules.ts since the engine that produced full Rules died
>  *  with v3.4.4 Phase 6. Audit only reads .id; full schema retired with engine). */
> export interface Rule {
>   id: string
> }
> ```

#### B.4 — `src/audit/log.ts` (2 paths)
```diff
-import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
-import type { Rule } from '../routing/decisionRules.js'
+import type { ArbitrateResult, TaskContext, Rule } from '../workflow/lib/agentDefinition.js'
```

#### B.5 — `src/workflow/run.ts` (1 path)
```diff
-import type { AgentDefinition } from '../routing/agentDefinition.js'
+import type { AgentDefinition } from './lib/agentDefinition.js'
```

#### B.6 — `tests/workflow/buildAgentDef.test.ts` (1 path)
```diff
-import type { AgentDefinition } from '../../src/routing/agentDefinition.js'
+import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'
```

#### B.7 — `tests/audit/log.test.ts` + `tests/audit/hook.test.ts` (2 paths each)
```diff
-import type { ArbitrateResult, TaskContext } from '../../src/routing/agentDefinition.js'
-import type { Rule } from '../../src/routing/decisionRules.js'
+import type { ArbitrateResult, TaskContext, Rule } from '../../src/workflow/lib/agentDefinition.js'
```

### Part C — DELETE `src/routing/` + `src/routing-engine/`

After Parts A+B verified green:

```bash
# 9 files in src/routing/ remain (5 hoisted in Part A):
rm src/routing/dag.ts                       # 142 LOC, only consumed by engine.ts + tests/unit/routing-dag.test.ts (deleted Part D)
rm src/routing/decisionRules.ts             # 190 LOC, audit types extracted Part B.3 note (a)
rm src/routing/engine.ts                    # 200 LOC, runRouting orphan post-Phase-4 (cli/research + cli/execute-task migrated to runWorkflow)
rm src/routing/index.ts                     # 40 LOC, barrel re-export — orphan after engine + factory die
rm src/routing/semanticRouter.ts            # 81 LOC, v0.1 stub never wired beyond engine.ts
rm src/routing/systemPrompt.ts              # 66 LOC, COMPLETE_INSTRUCTION inlined into hoisted agentDefinition.ts (A.1)
rm src/routing/lib/arbitrateRedirect.ts     # 69 LOC, only consumed by tests/unit/routing-arbitrateRedirect.test.ts (deleted Part D)
rm src/routing/lib/embedding.ts             # 17 LOC, interface-only stub for never-shipped v0.2 semantic router
rm src/routing/lib/skillInstall.ts          # 34 LOC, only consumed by engine.ts (deleted)
# Then prune empty dirs:
rmdir src/routing/lib
rmdir src/routing
# src/routing-engine/ is .gitkeep-only (verified in Open verifications § 7):
rm src/routing-engine/.gitkeep
rmdir src/routing-engine
```

### Part D — DELETE 5 + RELOCATE 3 routing test files

After audit (`## Open verifications` § 10), `tests/routing/` partitions as:

**DELETE 4 (routing-engine-coupled — targets all die in Part C)**:
```bash
rm tests/routing/routing-engine.test.ts         # 182 LOC, imports runRouting from src/routing/engine.js
rm tests/routing/ralph-fallback.test.ts         # 260 LOC, imports runRouting + handleMaxIterationsExceeded from src/routing/
rm tests/routing/samples-30.test.ts             # 150 LOC, imports arbitrateWithRedirect from src/routing/decisionRules.js
rm tests/routing/phase-3.4-routing-hit-rate.test.ts  # 182 LOC, imports arbitrate + loadDecisionRules from src/routing/decisionRules.js
```

**RELOCATE 4 (target the HOISTED workflow/lib functions)**:
```bash
git mv tests/routing/isComplete.test.ts          tests/workflow/isComplete.test.ts
git mv tests/routing/ralph-loop-win-sentinel.test.ts tests/workflow/ralph-loop-win-sentinel.test.ts
git mv tests/routing/sdk-spawn.test.ts           tests/workflow/sdk-spawn.test.ts
git mv tests/routing/sdk-reconcile.test.ts       tests/workflow/sdk-reconcile.test.ts
```

After relocate, update import paths inside each moved test:
- `isComplete.test.ts` — already imports from `src/workflow/lib/ralphLoop.js` (Phase 2 update); only the test file's PATH moved, imports stay green.
- `ralph-loop-win-sentinel.test.ts` — same; already imports from `src/workflow/lib/ralphLoop.js`.
- `sdk-spawn.test.ts` — imports `import type { AgentDefinition } from '../../src/routing/agentDefinition.js'`; update to `'../../src/workflow/lib/agentDefinition.js'`.
- `sdk-reconcile.test.ts` — imports `AgentDefinition` + `sdkReconcile` both from `src/routing/`; update both paths to `src/workflow/lib/`.

Then prune the empty dir:
```bash
rmdir tests/routing
```

**DELETE 6 unit + 2 integration tests under `tests/unit/routing-*.test.ts` + `tests/integration/routing-*.test.ts`** — these are 100% engine-tier tests with no relocation candidate:

```bash
rm tests/unit/routing-agentDefinition.test.ts   # 166 LOC, tests createAgent (Part C deletes)
rm tests/unit/routing-arbitrateRedirect.test.ts # 166 LOC, tests src/routing/lib/arbitrateRedirect.ts (deleted)
rm tests/unit/routing-dag.test.ts               # 175 LOC, tests DAG resolver (deleted)
rm tests/unit/routing-decisionRules.test.ts     # 128 LOC, tests arbitrate + loadDecisionRules (deleted)
rm tests/unit/routing-engine.test.ts            # 355 LOC, tests runRouting (deleted)
rm tests/unit/routing-semanticRouter.test.ts    # 90 LOC, tests semantic router stub (deleted)
rm tests/integration/routing-30-samples.test.ts # 400 LOC, integration of arbitrate (deleted)
rm tests/integration/routing-research-workflow.test.ts # 169 LOC, original spec verified — Phase 4 Commit 3 LEFT untouched precisely because Phase 6 deletes it
```

Net delete: 8 file deletions under tests/unit + tests/integration totalling ~1649 LOC.

> **Carve-out for `createAgent` test coverage**: `tests/unit/routing-agentDefinition.test.ts` (166 LOC) tests the factory; if Phase 6 ships without replacement, `createAgent` becomes UNTESTED. Audit confirms `createAgent` is still consumed by the hoisted `agentDefinition.ts` exports BUT no live src/ caller invokes it (the only caller was `src/routing/engine.ts:141`, deleted Part C). **Recommend**: also remove the `createAgent` factory + related error classes (`SkillNotInstalledError`, `MissingSkillsError`, `RestartRequiredError`) from the hoisted `agentDefinition.ts` — they're zombie exports with no consumer. Keep ONLY: the `AgentDefinition` interface, the `ArbitrateResult` interface, the `TaskContext` interface, the minimal `Rule` interface (per B.5 note), and `AGENT_DEFINITION_FIELDS` const (only if any live caller needs it — verify with grep). See `## Open verifications` § 11.

### Part E — DELETE `workflows/execute-task/phases.yaml`

```bash
rm workflows/execute-task/phases.yaml
```

Verification: `git grep -n "execute-task/phases.yaml" -- '*.ts' '*.json'` returns 0 hits in shipped code (allows `.planning/` historical mentions). `src/cli/execute-task.ts:46` calls `resolveWorkflowYaml('execute-task', WORKFLOWS_DIR)` which probes `workflow.yaml` first (Phase 4 ship state). The v2 phases.yaml is doc-rot — no resolver path reaches it after Phase 4.

### Part F — REMOVE stale i18n keys

Delete 4 keys (3 `research.dry_run.*` + 1 `research.install_fix_hint`) from both `messages/en.json` and `messages/zh-Hans.json`. **DO NOT delete `install.aborted`** — still live (see `## Open verifications` § 8).

`messages/en.json` diff:
```diff
   "research.require_query": "error: --query <text> is required",
-  "research.dry_run.matched_rule": "[dry-run] matched_rule: {{rule}}",
-  "research.dry_run.query": "[dry-run] query: {{query}}",
-  "research.dry_run.run_hint": "  (run without --dry-run to spawn the subagent and emit verbatim COMPLETE round-trip)",
-  "research.install_fix_hint": "  fix:  'harnessed install <skill>' (see error above)",

   "manifest_add.non_interactive_warn": ...
```

Sister diff in `messages/zh-Hans.json` (assumed to mirror; verify it has the same 4 keys — `## Open verifications` § 12).

### Part G — FIX 4 stale doc-path references

Pure documentation refresh — paths in shipped yaml + SKILL.md still point at the pre-Phase-2 `src/routing/lib/` location:

#### G.1 — `workflows/capabilities.yaml:454`
```diff
-    sdk_ref: src/routing/lib/ralphLoop.ts
+    sdk_ref: src/workflow/lib/ralphLoop.ts
```

#### G.2 — `workflows/execute-task/SKILL.md` L44 + L82 + L83
```diff
-reuses sister Phase 2.2 v0.2.0 ship: `src/routing/lib/ralphLoop.ts` (54L) + `sdkSpawn.ts` (91L)
+reuses sister Phase 2.2 v0.2.0 ship: `src/workflow/lib/ralphLoop.ts` (54L) + `sdkSpawn.ts` (91L)
 ...
-- `src/routing/lib/sdkSpawn.ts` — SDK query() consumer (T4.1)
-- `src/routing/lib/ralphLoop.ts` — verbatim COMPLETE round-trip
+- `src/workflow/lib/sdkSpawn.ts` — SDK query() consumer (T4.1)
+- `src/workflow/lib/ralphLoop.ts` — verbatim COMPLETE round-trip
```

#### G.3 — `workflows/task/deliver/SKILL.md:44`
```diff
-`sdk_ref: src/routing/lib/ralphLoop.ts` (Phase 2.2 v0.2.0 ship)。
+`sdk_ref: src/workflow/lib/ralphLoop.ts` (Phase 2.2 v0.2.0 ship)。
```

### Part H — MODIFY `CHANGELOG.md`

Append to `v3.4.4 (Unreleased)` section:

```markdown
### Phase 6 — FINAL cleanup (delete `src/routing/` + hoist 5 deps + i18n & doc-path cleanup)

- Hoisted 5 cross-package dependency files from `src/routing/` to `src/workflow/lib/` (single SoT for the workflow runtime extras): `agentDefinition.ts` (195L) + `completionSchema.ts` (33L) + `sdkReconcile.ts` (56L) + `promiseExtract.ts` (32L) + `fallbackHandlers.ts` (92L). `COMPLETE_INSTRUCTION` const inlined into hoisted `agentDefinition.ts` (sister Karpathy simplicity — single consumer, 7-line export).
- Deleted `src/routing/` (9 remaining files, 839 LOC) + `src/routing-engine/` (empty `.gitkeep`) + 4 `tests/routing/` engine-coupled tests + 6 `tests/unit/routing-*.test.ts` + 2 `tests/integration/routing-*.test.ts`. Net dead-code removal: ~2400 LOC across src + tests.
- Relocated 4 `tests/routing/` workflow-tier tests to `tests/workflow/` with import path updates (target the hoisted lib/ functions; sister structure to existing `tests/workflow/buildAgentDef.test.ts`).
- Deleted `workflows/execute-task/phases.yaml` (v2 legacy SoT — Phase 4 v3 `workflow.yaml` is the single dispatcher).
- Removed 4 stale i18n keys (`research.dry_run.matched_rule` + `research.dry_run.query` + `research.dry_run.run_hint` + `research.install_fix_hint`) from `messages/{en,zh-Hans}.json`. `install.aborted` PRESERVED (still live in `install.ts` + `uninstall.ts`).
- Fixed 4 stale `src/routing/lib/` doc-path references in shipped yaml/md (post-Phase-2 doc-rot): `workflows/capabilities.yaml:454` + `workflows/execute-task/SKILL.md` L44/82/83 + `workflows/task/deliver/SKILL.md:44`. All now point at `src/workflow/lib/`.
- Zero user-facing regression: `harnessed run` / `harnessed research` / `harnessed execute-task` CLI surface + exit-code semantics + Phase 5 stage-complete envelope all preserved. Phase 4 alias migration leaves no `runRouting` consumer in production CLI.
```

---

## Architecture decision points

### D-1 — Hoist destination for the 5 dep files

- **Option A (recommended)**: `src/workflow/lib/` — sister sdkSpawn + ralphLoop location. Single SoT for "workflow runtime extras" (the 7 files together form a tight cluster: sdkSpawn + ralphLoop are the workflow-level wrappers; the 5 hoist candidates are their direct typed dependencies).
- **Option B**: `src/workflow/` (one level higher). Mixes orchestration entry (`run.ts`, `masterOrchestrator.ts`) with low-level typed helpers. Worse cohesion.
- **Option C**: Mix — keep small helpers (`promiseExtract.ts` 32L + `completionSchema.ts` 33L) in `/lib/`, hoist larger (`agentDefinition.ts` 195L) one level higher. Pointless heterogeneity.

Recommend **A**. The `lib/` subdir is conventionally "implementation helpers consumed by the parent dir's public API"; all 5 satisfy that for `src/workflow/`.

### D-2 — Hoist vs inline-and-delete

- **Option A (recommended)**: Hoist all 5 as separate files. Preserves the Phase 2.2 sdkReconcile.ts split rationale (≤200L hard limit per Karpathy + single-responsibility testability). The 5 files already have unit tests (Part D relocate) — inlining loses test granularity.
- **Option B**: Inline the small helpers (`promiseExtract.ts` 32L + `completionSchema.ts` 33L) into `ralphLoop.ts` / `sdkSpawn.ts`. Saves 2 files. **Rejected** — `extractPromise` has its own test cell, and `COMPLETION_SCHEMA` is consumed by BOTH `sdkSpawn` and `ralphLoop` (re-import would re-create the cross-package boundary we're trying to collapse).

Recommend **A**. Pay the 5-file cost; reap the testability + readability.

### D-3 — `_dispatchSkillStub` → `dispatchSkill` rename

- **Option A**: Rename in Phase 6 (signals end of v3.4.4 cycle, name is no longer truthful — it's the real spawn function since Phase 2).
- **Option B (recommended)**: Defer to v3.5.0+ (rename ripples through `tests/workflow/buildAgentDef.test.ts` + ~10-15 other test fixtures' `vi.spyOn(_dispatchSkillStub, 'fn', ...)` DI-seam pattern; mechanical but high-blast-radius). The `_` prefix convention is a documented test-DI seam (sister `_autoChainCache` in Phase 5 spec D-6).

Recommend **B**. Rename is cosmetic, breaks active DI seam, low value. Tracked in `NOT in Phase 6` table.

### D-4 — `agentDefinition.ts` zombie-export cleanup

After Part C deletes `engine.ts`, the hoisted `agentDefinition.ts` exports (`createAgent`, `SkillNotInstalledError`, `MissingSkillsError`, `RestartRequiredError`, `AGENT_DEFINITION_FIELDS`) become orphans — no live src/ caller.

- **Option A**: Hoist verbatim, leave the zombies. 195L hoisted, ~120L of which is dead.
- **Option B (recommended)**: Trim to ~75L during hoist — keep only the 4 interfaces (`AgentDefinition`, `ArbitrateResult`, `TaskContext`, minimal `Rule`) that audit + workflow need. Delete `createAgent` + 4 error classes + `AGENT_DEFINITION_FIELDS` const + `KARPATHY_BASELINE` + `COMPLETE_INSTRUCTION` (inlined-then-deleted if no longer needed — verify with grep).
- **Option C**: Keep zombies in case v3.5.0+ wants a "lite engine" again. YAGNI; if v3.5.0 needs them, they're 1 git revert away.

Recommend **B**. Aligned with Karpathy "Simplicity First" — dead exports = future-archeology confusion. Verify with `git grep` per `## Open verifications` § 11. Deletion of zombies happens in the SAME commit as the hoist (Wave 1) to keep diff atomic.

### D-5 — i18n key removal verification protocol

For each candidate key, verify it has 0 LIVE consumers (excluding `.planning/` historical docs):

```bash
git grep -nE "t\(['\"]<KEY>['\"]" -- 'src/**/*.ts' 'tests/**/*.ts'
```

Hits in `src/cli/research.ts:75` for `research.dry_run.*` are COMMENT only (Phase 4 replaced the 3-line emit with a 1-line JSON envelope) — `git grep` for `t('research.dry_run` (the actual call form) returns 0 src/ hits. Confirmed in `## Open verifications` § 8.

### D-6 — Order of operations (commit split / wave plan)

**Sequential dependency chain**:
- Wave 1 (Commit 1): Hoist 5 files (atomic) — internal import rewrites land here.
- Wave 2 (Commit 2): Update import paths in 4 src/ + 3 tests/ files (atomic) — depends on Wave 1.
- Wave 3 (Commits 3 + 4 + 5, **parallel-safe**): (a) Delete `src/routing/*` + `src/routing-engine/*`; (b) Delete + relocate test files; (c) Delete `workflows/execute-task/phases.yaml` + i18n keys + doc-path fixes.
- Wave 4 (Commit 6): CHANGELOG.

Waves 1 → 2 must be sequential (W2 depends on W1's new file locations). Waves 3a/3b/3c touch DISJOINT file sets and can be done in 3 parallel subagent calls if helpful; the audit (subagent splitting) is overkill for Phase 6 — 3 sequential commits in the same session is faster than the dispatch overhead. **Recommend: 6 commits sequential, single-session.**

---

## Test plan (commands to run before each commit)

```bash
pnpm exec biome check --write
pnpm build                    # MANDATORY per Phase 2 hotfix lesson (dist/cli.mjs bundle)
pnpm test                     # baseline 0 fail expected (Phase 5 ship state)

# Phase 6 specific verifications (run BEFORE each wave's commit):
git grep -n "from.*'\.\./\.\./routing/" -- 'src/**/*.ts' 'tests/**/*.ts'  # expected 0 after Wave 2
git grep -n "from.*'\.\./routing/" -- 'src/**/*.ts'                       # expected 0 after Wave 2
git grep -n "src/routing" -- '*.ts' '*.json' '*.yaml' '*.md' ':!.planning/**'  # expected 0 after Wave 3

# Post-Wave-3 (after all deletions land):
ls src/routing 2>&1 | grep -i "no such"                                   # confirms dir deleted
ls src/routing-engine 2>&1 | grep -i "no such"                            # confirms dir deleted
ls workflows/execute-task/phases.yaml 2>&1 | grep -i "no such"            # confirms file deleted
ls tests/routing 2>&1 | grep -i "no such"                                 # confirms dir deleted

# Regression sweep:
pnpm test tests/workflow/                                                 # hoisted tests still green
pnpm test tests/audit/                                                    # audit B.3/B.4 path updates green
pnpm test tests/checkpoint/sdk-wire.test.ts                               # Phase 3 sister still green
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-real-spawn.test.ts  # Phase 2 regression
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-max-iterations.test.ts  # Phase 3 regression
pnpm test tests/cli/run.test.ts                                           # Phase 5 stage-complete envelope
pnpm test tests/cli/research.test.ts                                      # Phase 4 alias preserved
pnpm test tests/cli/execute-task.test.ts                                  # Phase 4 alias preserved

# i18n verification:
node -e "const m=require('./messages/en.json'); console.log('install.aborted' in m, 'research.install_fix_hint' in m, 'research.dry_run.query' in m)"
# Expected: true false false (install.aborted KEPT; research.* DELETED)
```

---

## Atomic commit plan

| # | Files | Suggested message | Wave |
|---|-------|-------------------|------|
| 1 | `git mv` 5 files `src/routing/* → src/workflow/lib/*` + internal relative-import re-anchor + `agentDefinition.ts` D-4 zombie trim + inline `COMPLETE_INSTRUCTION` | `refactor(workflow): v3.4.4 hoist 5 routing deps to workflow/lib + trim zombies (Phase 6 prep)` | 1 |
| 2 | `src/workflow/lib/sdkSpawn.ts` + `src/workflow/lib/ralphLoop.ts` + `src/audit/hook.ts` + `src/audit/log.ts` + `src/workflow/run.ts` + `tests/workflow/buildAgentDef.test.ts` + `tests/audit/{log,hook}.test.ts` (9 files, 14 import-path updates total) | `refactor(workflow): v3.4.4 update 5 src + 3 test imports for hoisted deps (Phase 6)` | 2 (depends on #1) |
| 3 | `rm -rf src/routing/ src/routing-engine/` + verification `git grep` clean | `refactor(cleanup): v3.4.4 delete src/routing/ + src/routing-engine/ (Phase 6 — all consumers migrated)` | 3a (depends on #2) |
| 4 | `rm` 4 routing/ + 6 unit/routing-*.test.ts + 2 integration/routing-*.test.ts + `git mv` 4 routing/ → tests/workflow/ + import path updates inside relocated tests | `refactor(tests): v3.4.4 delete 12 routing tests + relocate 4 workflow-tier tests (Phase 6)` | 3b (parallel-safe with #3) |
| 5 | `rm workflows/execute-task/phases.yaml` + remove 4 i18n keys from `messages/{en,zh-Hans}.json` + fix 4 stale doc-path references in `workflows/capabilities.yaml` + 2 SKILL.md | `refactor(workflows): v3.4.4 delete v2 phases.yaml + clean 4 i18n keys + fix 4 doc-paths (Phase 6)` | 3c (parallel-safe with #3 + #4) |
| 6 | `CHANGELOG.md` | `docs(changelog): v3.4.4 Phase 6 FINAL cleanup (~2400 LOC removed; hoist + delete)` | 4 (last) |

**Parallel waves**: Commits 3 + 4 + 5 touch disjoint file sets — could spawn 3 parallel subagents. **Recommend sequential single-session** since each is small and the orchestration cost of 3 subagents > 3 sequential commits.

---

## Open verifications before implement

1. **`src/routing/agentDefinition.ts` consumer list** — VERIFIED 4 LIVE src/ files: `src/workflow/lib/sdkSpawn.ts:22` (type) + `src/workflow/run.ts:20` (type) + `src/audit/hook.ts:7` (types `ArbitrateResult`, `TaskContext`) + `src/audit/log.ts:12` (types `ArbitrateResult`, `TaskContext`). Plus 6 test files. Hoist destination MUST be reachable by audit + workflow.

2. **`src/routing/completionSchema.ts` consumer list** — VERIFIED 2 LIVE src/ files: `src/workflow/lib/sdkSpawn.ts:23` (value + type) + `src/workflow/lib/ralphLoop.ts:6` (type only). 0 test direct consumers (tested through isComplete + sdkSpawn callers).

3. **`src/routing/lib/sdkReconcile.ts` consumer list** — VERIFIED 1 LIVE src/ + 1 test: `src/workflow/lib/sdkSpawn.ts:25-27` (value imports) + `tests/routing/sdk-reconcile.test.ts:10` (value imports). 0 other src/ files. Clean hoist.

4. **`src/routing/lib/promiseExtract.ts` consumer list** — VERIFIED 1 LIVE src/ + 0 direct tests: `src/workflow/lib/ralphLoop.ts:7` (value import). Cleanest hoist of the 5.

5. **`src/routing/lib/fallbackHandlers.ts` consumer list** — VERIFIED 1 LIVE src/ + 1 test: `src/workflow/lib/ralphLoop.ts:61+65` (re-export both type + value) + `tests/routing/ralph-fallback.test.ts:34` (value import). The test imports `runRouting` from `src/routing/engine.js` (deleted Part C) — test gets DELETED Part D, not relocated.

6. **`src/routing/decisionRules.ts` consumer list** — VERIFIED 2 LIVE src/ files: `src/audit/hook.ts:8` + `src/audit/log.ts:13` (BOTH type-only imports of `Rule`). Per D-4 + B.3 note (a), inline a minimal `Rule` interface into hoisted `agentDefinition.ts` rather than hoist decisionRules.ts (190L file is dead other than the `Rule` type — audit only reads `.id`).

7. **`src/routing-engine/` is `.gitkeep`-only** — VERIFIED via `ls -la src/routing-engine/` returns `.gitkeep` (0 bytes) only. No actual code. Phase 1 spec assumption confirmed.

8. **i18n key reachability post-Phase-4** — VERIFIED:
   - `install.aborted` → 2 LIVE callers (`src/cli/install.ts:122` + `src/cli/uninstall.ts:114`). **KEEP**.
   - `research.dry_run.matched_rule` / `research.dry_run.query` / `research.dry_run.run_hint` → 0 callers (Phase 4 `src/cli/research.ts:75` is a COMMENT only; `t('research.dry_run...` value-form returns 0 src/ hits). **DELETE**.
   - `research.install_fix_hint` → 0 callers (only consumed by old `runRouting` install-fail path, removed Phase 4). **DELETE**.

9. **tsup config / package.json exports** — VERIFIED neither `tsup.config.ts` (entry: `index.ts` + `cli.ts` + `schemas/index.ts`) nor `package.json` `exports` / `files` array (`["dist", "manifests", "workflows", "routing", ...]`) reference `src/routing/`. **Wait — `package.json:48 "routing"`** is the top-level `routing/` directory (contains `decision_rules.yaml`, NOT `src/routing/`). Verified separate; no `package.json` update needed.

10. **`tests/routing/` partition (delete vs relocate)** — VERIFIED 8 files (1316 LOC total):
    - **DELETE 4**: `routing-engine.test.ts` (imports `runRouting` from `src/routing/engine.js`) + `ralph-fallback.test.ts` (imports `runRouting` + `handleMaxIterationsExceeded` from `src/routing/`) + `samples-30.test.ts` (imports `arbitrateWithRedirect` from `src/routing/decisionRules.js`) + `phase-3.4-routing-hit-rate.test.ts` (imports `arbitrate` from `src/routing/decisionRules.js`).
    - **RELOCATE 4**: `isComplete.test.ts` (already imports from `src/workflow/lib/ralphLoop.js` per Phase 2 update) + `ralph-loop-win-sentinel.test.ts` (same) + `sdk-spawn.test.ts` (imports `AgentDefinition` from `src/routing/agentDefinition.js` — gets Part D import-update) + `sdk-reconcile.test.ts` (imports both `AgentDefinition` and `sdkReconcile` from `src/routing/` — gets Part D updates).

11. **`agentDefinition.ts` zombie export grep** — VERIFY before Wave 1:
    ```bash
    git grep -n "createAgent\|SkillNotInstalledError\|MissingSkillsError\|RestartRequiredError\|AGENT_DEFINITION_FIELDS\|KARPATHY_BASELINE" -- 'src/**/*.ts' ':!src/routing/**'
    ```
    Expected: 0 hits (all references live in `src/routing/engine.js` which dies Part C). If grep returns hits in `src/workflow/` or `src/audit/` or `src/cli/`, that export STAYS in hoisted agentDefinition.ts. If 0 hits, D-4 Option B trim is safe.

12. **`messages/zh-Hans.json` key parity** — VERIFY both locale files have the same 4 `research.*` keys before deleting from both. If `zh-Hans.json` is missing translations or has different keys, Part F diff may need adjustment.

13. **dist/ rebuild green** — Phase 2 lesson: `dist/cli.mjs` flattens `import.meta.url` paths. Any package layout change MUST be verified via `pnpm build` (not just `tsc --noEmit`). Run after each commit, especially Wave 1 (hoist) and Wave 3a (delete `src/routing/`).

14. **`workflows/execute-task/phases.yaml` consumer grep** — VERIFY before Part E:
    ```bash
    git grep -n "execute-task/phases.yaml" -- 'src/**/*.ts' 'tests/**/*.ts'
    ```
    Expected: 0 hits in shipped code (only `.planning/` historical mentions). If a test fixture still loads it (sister Phase 4 may have left a regression test), surface and remediate.

15. **`tests/workflow/` directory exists for relocate target** — VERIFIED via `ls tests/workflow/` returns existing files including `buildAgentDef.test.ts` (Phase 4 Commit 2 created). Part D relocate `git mv` will land cleanly.

16. **Audit-log CLI subcommand surface** — VERIFY `src/cli/audit-log.ts` doesn't import `src/routing/*` either:
    ```bash
    git grep -n "routing" src/cli/audit-log.ts
    ```
    Expected: 0 hits (the audit log SUBCOMMAND reads `~/.claude/harnessed/audit.log` JSONL — it doesn't link to the routing engine module). If hits surface, plumb additional B.x updates.

---

## NOT in Phase 6 (deferred to future minor)

| Future | Deferred work |
|--------|---------------|
| v3.5.0+ | `_dispatchSkillStub` → `dispatchSkill` rename (cosmetic; breaks 16+ DI-seam test fixtures for ~zero user-facing value — D-3 Option B). |
| v3.5.0+ | `gateContext.modelOverride` consumption at sdkSpawn level (Phase 4 captures into gateContext but doesn't propagate to `AgentDefinition.model` field). Separate plumb beyond `--model-tier inherit` B-10 path. |
| v3.5.0+ | `--dry-run` hint emission (Phase 5 left it apply-path only; reconsider after user feedback). |
| v3.5.0+ | `Rule` type formalization — Phase 6 inlines a minimal `{ id: string }` interface to satisfy audit; a richer schema is appropriate if a future engine returns. |
| v3.5.0+ | `tests/workflow/` directory README to document the post-Phase-6 layout (was `tests/routing/` for engine tests; now `tests/workflow/` for both engine-was tests and Phase 2/3 spawn/loop tests). |
| Future | Resurrect any of the deleted routing primitives (DAG resolver, semantic router, decision rules engine) — all live in `git log` history if needed; revertible by `git revert` of Wave 3a commit. |
