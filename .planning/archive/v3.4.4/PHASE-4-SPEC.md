# Phase 4 Spec — v3.4.4 research + execute-task migrate to `harnessed run` (Path A)

> **Scope**: Migrate the two legacy LIVE subcommands `harnessed research` and `harnessed execute-task` from the `src/routing/` engine to the universal `src/workflow/` runtime that Phase 1-3 ship via `harnessed run <name>`. Both subcommands survive as thin aliases (zero user-visible regression). `workflows/execute-task/workflow.yaml` (v3) is authored fresh, mirroring the v2 `phases.yaml`. `buildAgentDef` (`src/workflow/run.ts` L59-64) is enriched with `workflows/role-prompts.yaml` lookup. `MaxIterFallbackCtx.workflowName` (`src/workflow/run.ts:145` hardcoded `'harnessed-run'`) is plumbed through `runWorkflow` → `_dispatchSkillStub.fn` → `handleMaxIterationsExceeded`.
>
> **Out of scope (deferred)**: Phase 5 — real `getNextHint`. Phase 6 — delete `src/routing/` + `src/routing-engine/` + `tests/routing/*` + `tests/integration/routing-research-workflow.test.ts` + `workflows/execute-task/phases.yaml` (v2 legacy SoT).

---

## Scope

- **Part A — `research` alias**: `src/cli/research.ts` (96 LOC) currently calls `runRouting(taskCtx, {…})` from `src/routing/engine.ts`. Phase 4 replaces the body so the action handler instead resolves `workflows/research/workflow.yaml` (already v3 per Phase 2 Commit 1 — verified L25 `schema_version: harnessed.workflow.v3`) and calls `runWorkflow(yamlPath, {}, { packageRoot, gateContext })`. `--query <text>` forwards into `gateContext.task`; `--model` into `gateContext.modelOverride`; `--dry-run` keeps the existing "print arbitrate/yaml summary + exit 0" branch (now prints the resolved yamlPath + gateContext instead of `preview.matchedRule.id`). Subcommand surface unchanged — H1 gate (`--non-interactive` requires `--apply` OR `--dry-run`), `requiredOption --query`, exit-code semantics (0 ok, 1 fail, 2 usage) all preserved.

- **Part B — `execute-task` v3 yaml NEW**: Author `workflows/execute-task/workflow.yaml` (~80 LOC) mirroring the v2 `phases.yaml` 4-phase chain (01-clarify brainstorming → 02-code karpathy+mattpocock → 03-test TDD+diagnose → 04-deliver ralph-loop COMPLETE). Bump `schema_version: harnessed.workflow.v3`, add `disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]` (6 default substrate per L0), add `tools_available: [superpowers-brainstorming, tdd, grill-with-docs, zoom-out, diagnose, ralph-loop, planning-with-files]` (per sister `workflows/task/auto/workflow.yaml` shape + execute-task `on[]` invokes). Keep phase-level `capability:` + `gate:` + `parallelism:` + `on[]` + `fallback.max_iterations_exceeded:` + per-phase `model:` literal (intel CD-2 § 第 4 条 defaults: opus / sonnet / sonnet / haiku) verbatim from v2 `phases.yaml`.

- **Part C — `execute-task` alias**: `src/cli/execute-task.ts` (168 LOC post-`878589c`) currently `loadPhases('workflows/execute-task/phases.yaml')` + `runRouting()`. Phase 4 replaces with `runWorkflow('workflows/execute-task/workflow.yaml', {}, { packageRoot, gateContext })`. `--task <text>` → `gateContext.task`; `--max-iterations <n>` → `gateContext.maxIterations` (Phase 3 plumb path); `--model <m>` → `gateContext.modelOverride`; `--model-tier inherit` → `gateContext.modelTierOverride` (consumed by Phase 4 `buildAgentDef` enrichment when set). `--dry-run` keeps the JSON-dump branch but emits `{ workflow, yamlPath, gateContext }` (sister `src/cli/run.ts:91` dry-run path). The `runBeforeCommitHook` pre-flight + `execSync('git status --porcelain')` block at L122-144 stays put for K5 Option A enforcement (still apply-immediate-only). LOC drops ~168 → ~110 (removes v2 `loadPhases` narrowing block L62-94, fallback config extraction L112-120, `aborted`/`ok:false` branching L154-164 which now propagate through `runWorkflow` result instead).

- **Part D — `buildAgentDef` enrich**: `src/workflow/run.ts:59-64` currently builds a 2-field stub `{ description, prompt }`. Phase 4 widens signature: `buildAgentDef(skillName, rolePrompts?, capability?)` — lookup `skillName` in `rolePrompts[skillName]` (loaded once at `runWorkflow` entry via `loadRolePrompts(workflowsDir)`), splice `responsibility` + `checklist` + `severity` + `specialist` into `prompt`; lookup `capability` (passed by `_dispatchSkillStub.fn` from `phase.capability` or `phase.upstream`) for any future capability-level prompt fragments. **Falls back to current 2-field stub when entries missing** (zero regression for phase ids that aren't in role-prompts.yaml). Model tier is NOT sourced from `capabilities.yaml` — verified L1-1021 zero `model:` field on capability entries; model tier comes from `phase.model` (yaml literal) or `gateContext.modelTierOverride` (B-10 escape hatch).

- **Part E — `MaxIterFallbackCtx.workflowName` plumb**: `src/workflow/run.ts:145` hardcoded `workflowName: 'harnessed-run'`. Phase 4 plumbs the actual `parsed.workflow` (e.g. `'execute-task'`, `'research'`, `'verify-paranoid'`) through `runWorkflow` → `_dispatchSkillStub.fn` opts → `handleMaxIterationsExceeded` ctx. Signature widens: `_dispatchSkillStub.fn(skillName, phase?, opts?: { maxIter?, fallback?, workflowName? })`. `runWorkflow` extracts `parsed.workflow` once and passes it on every dispatch call.

Effort: **8-14h**, single PR (sister Phase 2/3 cadence). 5 atomic commits per the table at bottom.

---

## Goal — acceptance criteria after Phase 4 ships

1. `harnessed research --query "Next.js v15 router" --dry-run --non-interactive` exits 0 and prints `{ workflow: "research", yamlPath: ".../workflows/research/workflow.yaml", gateContext: { task: "Next.js v15 router", … } }`. The 3-line v3.4.3 `dry_run.matched_rule` output shape is REPLACED by the universal Phase 1 dry-run JSON shape.
2. `harnessed research --query "Next.js v15 router"` (apply path, with `HARNESSED_REAL_SPAWN=1`) walks `workflows/research/workflow.yaml` v3 phases (01-fan-out + 02-synth) via `runWorkflow` — `src/routing/engine.ts.runRouting` is NEVER called from this subcommand's code path.
3. `harnessed execute-task --task "implement X" --dry-run --non-interactive` exits 0 and prints `{ workflow: "execute-task", yamlPath: ".../workflows/execute-task/workflow.yaml", gateContext: { task: "implement X", … } }`. The v2 `loadPhases` JSON dump output is REPLACED.
4. `harnessed execute-task --task "X" --max-iterations 5 --non-interactive` (apply path) caps the SDK `query()` calls at phase `04-deliver` (the ralph-loop opt-in phase per `fallback.max_iterations_exceeded` declaration) to at most 5 iterations (Phase 3 plumb path preserved end-to-end through the new alias).
5. `workflows/execute-task/workflow.yaml` exists, validates against `WorkflowSchemaV3` (`Value.Check(WorkflowSchemaV3, parsed)` returns true), and contains exactly 4 phases with ids `[01-clarify, 02-code, 03-test, 04-deliver]` + per-phase models `[opus, sonnet, sonnet, haiku]` (intel CD-2 § 第 4 条 defaults preserved).
6. `workflows/execute-task/phases.yaml` (v2) is UNTOUCHED — both files coexist through Phase 4 + 5 (per D-2 Path A1 recommendation). Phase 6 deletes the v2 file alongside `src/routing/`.
7. `buildAgentDef('verify-paranoid', rolePrompts)` returns a `prompt` that contains the `responsibility` text from `role-prompts.yaml:357` ("Mandatory on critical modules (auth / payment / data migration / core algorithm). Default-suspect mode …") and the 9-item paranoid checklist. `buildAgentDef('some-unknown-phase-id', rolePrompts)` returns the conservative 2-field stub (current Phase 2 behavior).
8. When phase `04-deliver` exceeds `max_iterations`, the stderr UX text emitted by `handleMaxIterationsExceeded` contains `Workflow: execute-task / phase 04-deliver` (NOT `Workflow: harnessed-run / phase …`). Plumbed via Part E.
9. `src/routing/index.ts` re-exports + `src/routing/engine.ts` are UNTOUCHED — both files remain consumed by the legacy `src/routing-engine/` test fixtures + Phase 6 deletion target. The Phase 4 changes are purely additive in `src/workflow/run.ts` + replacement in `src/cli/{research,execute-task}.ts`.
10. `pnpm exec biome check --write && pnpm build && pnpm test` exits 0 — baseline 0 fail expected (Phase 3.5 hotfix sweep cleared all 9). The 9 existing `tests/cli/execute-task.test.ts` fixtures + the 4 `tests/workflow/research-v2.test.ts` fixtures continue to pass after the alias migration (test refactor scope per Part D below).

---

## Files (file-by-file)

### MODIFY: `src/cli/research.ts` (96 LOC → ~75 LOC)

Replace the action body. Keep registration metadata (`--query`, `--dry-run`, `--non-interactive`, `--model`, H1 gate) verbatim.

```diff
-import { runRouting, type TaskContext } from '../routing/index.js'
+import { runWorkflow } from '../workflow/run.js'
+import { resolveWorkflowYaml } from './run.js'
+import { getPackageRoot } from './lib/packagePath.js'
+
+const PACKAGE_ROOT = getPackageRoot()
+const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

 .action(async (raw: RawOpts) => {
   validateNonInteractiveFlags(raw, 'research --query <text>')
   if (!raw.query) {
     console.error(t('research.require_query'))
     process.exit(2)
   }
-  const taskCtx: TaskContext = { task: raw.query, task_type: 'search' }
+  const yamlPath = await resolveWorkflowYaml('research', WORKFLOWS_DIR)
+  if (!yamlPath) {
+    console.error(`error: workflows/research/workflow.yaml not found under ${WORKFLOWS_DIR}`)
+    process.exit(2)
+  }
+  const gateContext: Record<string, unknown> = {
+    task: raw.query,
+    ...(raw.model ? { modelOverride: raw.model } : {}),
+  }
   if (raw.dryRun === true) {
-    const preview = await runRouting(taskCtx, { …old runRouting opts… })
-    // 25 LOC of branchy three-state EngineResult mapping deleted
-    console.log(t('research.dry_run.matched_rule', { rule: preview.matchedRule?.id ?? '(fallback supervisor)' }))
-    console.log(t('research.dry_run.query', { query: raw.query }))
-    console.log(t('research.dry_run.run_hint'))
+    console.log(JSON.stringify({ workflow: 'research', yamlPath, gateContext }, null, 2))
     process.exit(0)
   }
-  const result = await runRouting(taskCtx, { … })
-  // 14 LOC of EngineResult three-state mapping deleted
+  let result: Awaited<ReturnType<typeof runWorkflow>>
+  try {
+    result = await runWorkflow(yamlPath, {}, { packageRoot: PACKAGE_ROOT, gateContext })
+  } catch (err) {
+    console.error(`error: workflow runtime failed — ${(err as Error).message}`)
+    process.exit(1)
+    return
+  }
+  process.exit(result.status === 'failed' ? 1 : 0)
 })
```

- `TaskContext` import + `task_type: 'search'` field — DELETED. New workflow runtime doesn't consume `task_type` (verified `runWorkflow` reads `gateContext.task` only).
- `t('install.aborted')` + `t('research.install_fix_hint')` i18n keys — kept in `src/i18n/locales/*.json` for now (Phase 6 cleanup alongside `runRouting` deletion). Aliased branches no longer reach them in this file.
- DELETE `import type { TaskContext }` + `import { runRouting }`.
- The `resolveWorkflowYaml` helper is exported from `src/cli/run.ts:125` — re-import here (sister `src/cli/run.ts:75`).

---

### NEW: `workflows/execute-task/workflow.yaml` (~80 LOC, v3)

Mirror `workflows/execute-task/phases.yaml` 4-phase chain with v3 schema fields. Sister `workflows/task/auto/workflow.yaml` (task stage-master) for v3 conventions; sister `workflows/research/workflow.yaml` for v3 shape (already-shipped reference). Sister `workflows/verify/simplify/workflow.yaml` for sub-workflow phase shape.

```yaml
# workflows/execute-task/workflow.yaml — v3.4.4 Phase 4 NEW (Path A)
# Sister v2 `phases.yaml` (60L) preserved through Phase 5; Phase 6 deletes both
# alongside src/routing/. Authored fresh per HANDOFF-v3.4.4 L745 Path A decision.
#
# 4-phase chain mirrors v2 verbatim:
#   01-clarify  superpowers-brainstorming  opus  gate: subtask-gate.brainstorming.fires
#   02-code     karpathy 心法 + on[]       sonnet  conditional: tdd / grill-with-docs / zoom-out
#   03-test     superpowers TDD            sonnet  on: test_fail → diagnose
#   04-deliver  ralph-loop                 haiku   args.completion_promise=COMPLETE + fallback

schema_version: harnessed.workflow.v3
workflow: execute-task
description: |
  子任务执行 workflow — 4-phase chain (brainstorming → karpathy + mattpocock route by
  condition → TDD + diagnose → ralph-loop COMPLETE) triggered by harnessed CLI
  `harnessed execute-task --task <text>` OR universal `harnessed run execute-task`.

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [superpowers-brainstorming, tdd, grill-with-docs, zoom-out, diagnose, ralph-loop, planning-with-files]

phases:
  - id: 01-clarify
    name: brainstorming
    upstream: superpowers brainstorming
    capability: '{{ capabilities.superpowers-brainstorming.cmd }}'
    model: opus
    max_iterations: '{{ defaults.ralph_max_iterations.execute-task.01-clarify }}'
    gate: judgments.subtask-gate.brainstorming.fires

  - id: 02-code
    name: code (karpathy 心法 always-on + mattpocock conditional route)
    upstream: karpathy
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.execute-task.02-code }}'
    on:
      - if: 'judgments.tdd-gate.tdd-strongly-suggested.fires'
        invoke: '{{ capabilities.tdd.cmd }}'
      - if: 'phase.spec_ambiguous == true'
        invoke: '{{ capabilities.grill-with-docs.cmd }}'
      - if: 'phase.unfamiliar_module == true'
        invoke: '{{ capabilities.zoom-out.cmd }}'

  - id: 03-test
    name: test (conditional TDD + diagnose on fail)
    upstream: superpowers TDD
    capability: '{{ capabilities.tdd.cmd }}'
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.execute-task.03-test }}'
    on:
      - if: 'test_fail == true'
        invoke: '{{ capabilities.diagnose.cmd }}'

  - id: 04-deliver
    name: deliver (ralph-loop COMPLETE gate + max-iter fallback)
    upstream: ralph-loop
    capability: '{{ capabilities.ralph-loop.cmd }}'
    model: haiku
    args:
      completion_promise: COMPLETE
      max_iterations: '{{ defaults.ralph_max_iterations.execute-task.04-deliver }}'
    gate: judgments.parallelism-gate.fires
    parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires
    on:
      - if: 'subtask.lines >= 20 and subtask.type != "single_command_query"'
        invoke: '{{ capabilities.ralph-loop.cmd }}'
      - if: 'subtask.lines < 20 or subtask.type == "single_command_query"'
        action: skip
    fallback:
      max_iterations_exceeded:
        action: emit_warning_and_halt
        message: '⚠️ ralph-loop max-iterations ({{ args.max_iterations }}) exceeded for execute-task 04-deliver. Sub-task likely incomplete — see workflow engine catch handler for manual options.'
        exit_code: 1
```

Validation: must pass `Value.Check(WorkflowSchemaV3, parsed)` in a new fixture (see test plan).

---

### MODIFY: `src/cli/execute-task.ts` (168 LOC → ~110 LOC)

Drop v2 `loadPhases` block + fallback extraction + `aborted`/`ok:false` branches. Keep H1 gate, `requiredOption --task`, `--model-tier inherit` (now forwarded to gateContext for `buildAgentDef` consumption), `runBeforeCommitHook` K5 Option A enforcement (unchanged).

```diff
-import { execSync } from 'node:child_process'
-import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
-import { runRouting, type TaskContext } from '../routing/index.js'
-import type { FallbackMaxIterationsExceededConfig } from '../routing/lib/fallbackHandlers.js'
-import { type LoadedPhases, loadPhases } from '../workflow/loadPhases.js'
+import { execSync } from 'node:child_process'
+import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
+import { runWorkflow } from '../workflow/run.js'
+import { resolveWorkflowYaml } from './run.js'
+import { getPackageRoot } from './lib/packagePath.js'

 .action(async (raw: RawOpts) => {
   validateNonInteractiveFlags(raw, 'execute-task --task <text>')
   if (!raw.task) { … exit 2 … }
-  const workflowName = raw.workflow ?? 'execute-task'
-  let phases: ReturnType<typeof loadPhases>
-  try { phases = loadPhases(`workflows/${workflowName}/phases.yaml`) } …
-  if (!phases.phases) { … exit 2 … }
-  let phaseList = phases.phases
-  if (raw.modelTier === 'inherit') { phaseList = phaseList.map(p => ({…inherit…})) }
-  const taskCtx: TaskContext = { task: raw.task, task_type: 'execute-task' }
+  const PACKAGE_ROOT = getPackageRoot()
+  const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')
+  const workflowName = raw.workflow ?? 'execute-task'
+  const yamlPath = await resolveWorkflowYaml(workflowName, WORKFLOWS_DIR)
+  if (!yamlPath) {
+    console.error(t('execute_task.load_phases_failed', { workflow: workflowName, message: 'workflow.yaml not found' }))
+    process.exit(2)
+  }
+  const gateContext: Record<string, unknown> = {
+    task: raw.task,
+    ...(raw.model ? { modelOverride: raw.model } : {}),
+    ...(raw.modelTier ? { modelTierOverride: raw.modelTier } : {}),
+    ...(raw.maxIterations ? { maxIterations: raw.maxIterations } : {}),
+  }

   if (raw.dryRun === true) {
-    console.log(JSON.stringify({ workflow: phases.workflow, phases: phaseList, taskCtx }, null, 2))
+    console.log(JSON.stringify({ workflow: workflowName, yamlPath, gateContext }, null, 2))
     process.exit(0)
   }

-  // T2.4.W1.5 — extract fallback config from v2 phases.yaml (block deleted; runWorkflow handles per-phase)
-  let fallbackConfig: FallbackMaxIterationsExceededConfig | undefined
-  let fallbackPhaseId: string | undefined
-  for (const ph of phaseList) { if ('fallback' in ph && ph.fallback?.max_iterations_exceeded) { … } }

   // T3.5.W0.4 — before-commit hook K5 Option A enforcement (UNCHANGED, L122-144 preserved verbatim)
   try { … runBeforeCommitHook … } catch (err) { … warn-soft … }

-  const result = await runRouting(taskCtx, { maxIterations: raw.maxIterations ?? 20, … fallbackConfig … })
-  if ('aborted' in result) { … exit 2 … }
-  if ('ok' in result && result.ok === false) { … exit 1 … }
-  console.log(result.result)
+  let result: Awaited<ReturnType<typeof runWorkflow>>
+  try {
+    result = await runWorkflow(yamlPath, {}, { packageRoot: PACKAGE_ROOT, gateContext })
+  } catch (err) {
+    console.error(`error: workflow runtime failed — ${(err as Error).message}`)
+    process.exit(1)
+    return
+  }
+  process.exit(result.status === 'failed' ? 1 : 0)
 })
```

Notes:
- `--workflow <name>` option preserved — non-default values resolve via tier-3 `resolveWorkflowYaml` (e.g. `--workflow execute-task-custom` → `workflows/execute-task/custom/workflow.yaml` if it exists).
- `--model-tier inherit` flag now plumbs into `gateContext.modelTierOverride`. `buildAgentDef` Part D enrichment checks this key + applies `'inherit'` to the AgentDefinition `model` field (sister B-10 escape hatch behavior preserved through new path).
- `runBeforeCommitHook` block + `execSync('git status --porcelain')` UNCHANGED. K5 Option A enforcement migrates verbatim into the new alias path.

---

### MODIFY: `src/workflow/run.ts` (buildAgentDef enrich + workflowName plumb, ~30 LOC delta)

Two related edits.

**Edit 1 — Widen `buildAgentDef` signature + role-prompts lookup** (L59-64):

```diff
-function buildAgentDef(skillName: string): AgentDefinition {
-  return {
-    description: `harnessed workflow phase: ${skillName}`,
-    prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
-  } as AgentDefinition
-}
+import type { RolePrompt } from '../cli/lib/generateCommands.js'
+
+function buildAgentDef(
+  skillName: string,
+  rolePrompts?: Record<string, RolePrompt>,
+  modelTierOverride?: string,
+): AgentDefinition {
+  const rp = rolePrompts?.[skillName]
+  if (!rp) {
+    // Conservative fallback (Phase 2 behavior) for phase ids not in role-prompts.yaml.
+    return {
+      description: `harnessed workflow phase: ${skillName}`,
+      prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
+      ...(modelTierOverride ? { model: modelTierOverride } : {}),
+    } as AgentDefinition
+  }
+  const checklist = rp.checklist.length
+    ? `\n\nChecklist:\n${rp.checklist.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`
+    : ''
+  const prompt = [
+    `You are a ${rp.specialist}.`,
+    ``,
+    rp.responsibility.trim(),
+    checklist,
+    ``,
+    `Severity scale: ${rp.severity}`,
+    ``,
+    `Emit a structured COMPLETE signal when done.`,
+  ].join('\n')
+  return {
+    description: rp.description,
+    prompt,
+    ...(modelTierOverride ? { model: modelTierOverride } : {}),
+  } as AgentDefinition
+}
```

**Edit 2 — `runWorkflow` loads role-prompts once + threads `workflowName` to dispatch** (around L184-200 and L289):

```diff
+import { loadRolePrompts } from '../cli/lib/generateCommands.js'

 export async function runWorkflow(yamlPath, vars, opts = {}) {
   const parsed = loadPhases(yamlPath, vars)
   const yamlDir = dirname(pathResolve(yamlPath))
   const inferredRoot = pathResolve(yamlDir, '..', '..')
   const packageRoot = opts.packageRoot ?? inferredRoot
   const gateContext: Record<string, unknown> = { ...(opts.gateContext ?? {}) }
+  // Phase 4 — load role-prompts.yaml once per workflow run (cached map for all phases).
+  // Fail-soft per ADR 0029: missing yaml or parse error → empty map (Phase 2 conservative fallback).
+  let rolePrompts: Record<string, RolePrompt> = {}
+  try {
+    rolePrompts = await loadRolePrompts(join(packageRoot, 'workflows'))
+  } catch (err) {
+    console.warn(`⚠️ loadRolePrompts failed (${(err as Error).message}); proceeding without role-prompt enrichment (ADR 0029 fail-soft).`)
+  }
+  const workflowName = parsed.workflow

   // … existing master-detect + disciplines wedge unchanged …

   for (let i = 0; i < phases.length; i++) {
     // … existing gate eval / arbitrate unchanged …
-    const r = await _dispatchSkillStub.fn(skillName, ph, { maxIter, ...(fallback ? { fallback } : {}) })
+    const r = await _dispatchSkillStub.fn(skillName, ph, {
+      maxIter,
+      ...(fallback ? { fallback } : {}),
+      workflowName,
+      rolePrompts,
+      ...(typeof gateContext.modelTierOverride === 'string' ? { modelTierOverride: gateContext.modelTierOverride } : {}),
+    })
   }
 }
```

**Edit 3 — `_dispatchSkillStub.fn` signature widen + workflowName forward** (L114-173):

```diff
 export const _dispatchSkillStub = {
   fn: async (
     skillName: string,
     phase?: unknown,
     opts?: {
       maxIter?: number
       fallback?: FallbackMaxIterationsExceededConfig
+      workflowName?: string
+      rolePrompts?: Record<string, RolePrompt>
+      modelTierOverride?: string
     },
   ): Promise<DispatchStubResult> => {
     const optIn = isRalphLoopOptIn(phase)
     const spawnOnce = async (resumeSessionId?, onSessionId?) =>
-      sdkSpawn(buildAgentDef(skillName), { expertName: skillName, … })
+      sdkSpawn(buildAgentDef(skillName, opts?.rolePrompts, opts?.modelTierOverride), {
+        expertName: skillName,
+        ...(resumeSessionId ? { resumeSessionId } : {}),
+        ...(onSessionId ? { onSessionId } : {}),
+      })
     // … existing wrap + try/catch unchanged except for ctx …
     if (err instanceof MaxIterationsExceededError && opts?.fallback) {
       handleMaxIterationsExceeded(err, opts.fallback, {
         subtaskSummary: `phase ${skillName}`,
-        workflowName: 'harnessed-run',
+        workflowName: opts.workflowName ?? 'harnessed-run',
         phaseId: skillName,
         maxIterations: opts?.maxIter ?? RALPH_DEFAULT_MAX_ITER,
       })
     }
     // … rest unchanged …
   },
 }
```

Header comment update at L1-8: append `// Phase v3.4.4 (Phase 4) — buildAgentDef enriched with role-prompts.yaml lookup + workflowName plumbed through MaxIterFallbackCtx (replaces hardcoded 'harnessed-run' literal at fallback site).`

---

### NEW + MODIFY: tests

**NEW** `tests/cli/research.test.ts` (~120 LOC) — sister `tests/cli/run.test.ts` Pattern J. Cells:
1. registers `research` subcommand on Command instance
2. H1 gate — `--non-interactive` without `--query` → exit 2 (commander requiredOption)
3. `--dry-run --non-interactive` exits 0 + stdout JSON contains `workflow: 'research'` + `yamlPath` + `gateContext.task`
4. `--query` forwards to `gateContext.task`
5. `--model haiku` forwards to `gateContext.modelOverride`
6. apply path (mock `runWorkflow`) — `runWorkflow` called with correct `(yamlPath, {}, { packageRoot, gateContext })` triplet
7. `runWorkflow` returns `{ status: 'failed' }` → process.exit(1)
8. `runWorkflow` throws → process.exit(1) with stderr `workflow runtime failed —`
9. `runRouting` is NEVER imported / called (assert via vi.spyOn import-time check)

**MODIFY** `tests/cli/execute-task.test.ts` (existing 9 fixtures):
- Replace `vi.mock('@anthropic-ai/claude-agent-sdk', …)` with `vi.mock('../../src/workflow/run.js', …)` (sister `tests/cli/run.test.ts` L11-13 pattern).
- Cell 4 — dry-run JSON shape changes: `parsed.workflow === 'execute-task'` (string, not yaml-parsed object); `parsed.yamlPath` ends with `workflows/execute-task/workflow.yaml`; `parsed.gateContext.task === 'implement auth'`. Drop the `parsed.phases` array assertion (no longer in dry-run output — runtime handles per-phase). Drop `parsed.taskCtx` assertion.
- Cell 5 (`--model-tier inherit`) — assert `gateContext.modelTierOverride === 'inherit'` in the dry-run JSON.
- Cell 6 (invalid workflow) — assert exit 2 + stderr matches `workflow.yaml not found` (new error message from `resolveWorkflowYaml`).
- Cell 7+8 (K5 K5 Option A before-commit) — unchanged; the `runBeforeCommitHook` block at L122-144 stays verbatim.
- ADD Cell 10 — `runWorkflow` called with yamlPath ending `execute-task/workflow.yaml` (NOT `phases.yaml`).
- ADD Cell 11 — `--max-iterations 5` forwards to `gateContext.maxIterations === 5` in dry-run.

**NEW** `tests/workflow/execute-task-v3.test.ts` (~80 LOC) — sister `tests/workflow/research-v2.test.ts` Pattern. 4 fixtures:
- F1: `workflows/execute-task/workflow.yaml` parses + `Value.Check(WorkflowSchemaV3)` true + 4 phases
- F2: phase ids = `['01-clarify', '02-code', '03-test', '04-deliver']` + per-phase models = `['opus', 'sonnet', 'sonnet', 'haiku']` (intel CD-2 § 第 4 条)
- F3: capability refs `superpowers-brainstorming` / `tdd` / `grill-with-docs` / `zoom-out` / `diagnose` / `ralph-loop` all resolve in `workflows/capabilities.yaml`
- F4: `04-deliver.fallback.max_iterations_exceeded` shape valid + `defaults.ralph_max_iterations.execute-task.{01..04}` all numeric 1-100

**NEW** `tests/workflow/buildAgentDef.test.ts` (~60 LOC) — unit test the enriched `buildAgentDef`. 4 fixtures:
- F1: known skillName (`'verify-paranoid'`) + non-empty `rolePrompts` → `prompt` includes `responsibility` text + checklist items (count ≥ 5)
- F2: unknown skillName (`'fake-phase-id'`) → falls back to conservative 2-field stub (sister Phase 2 behavior)
- F3: `rolePrompts` empty / undefined → conservative fallback regardless of skillName
- F4: `modelTierOverride === 'inherit'` → `def.model === 'inherit'`

**NEW** `tests/workflow/run-workflowname-plumb.test.ts` (~40 LOC) — unit test Part E. 2 fixtures:
- F1: `_dispatchSkillStub.fn` called with `opts.workflowName === 'execute-task'` when `runWorkflow` parses `workflow: execute-task` yaml (spy on `_dispatchSkillStub.fn` via DI override)
- F2: `handleMaxIterationsExceeded` ctx receives `workflowName === 'execute-task'` (NOT `'harnessed-run'`) when fallback path triggers (mock `handleMaxIterationsExceeded` + force `MaxIterationsExceededError`)

**UPDATE** `tests/integration/routing-research-workflow.test.ts` (existing) — if it asserts `runRouting` is invoked from `src/cli/research.ts`, refactor to assert `runWorkflow` invocation instead. If it tests the routing engine internals (decoupled from CLI), leave untouched (Phase 6 deletion target).

---

### MODIFY: `CHANGELOG.md`

Append to `v3.4.4 (Unreleased)` section:

```markdown
### Phase 4 — research + execute-task migrate to harnessed run (Path A)

- `harnessed research` + `harnessed execute-task` subcommands are now thin aliases that invoke `runWorkflow` (the Phase 1-3 universal runtime); `src/routing/runRouting` is no longer called from the CLI surface (Phase 6 will delete `src/routing/`).
- NEW `workflows/execute-task/workflow.yaml` v3 (mirrors v2 `phases.yaml` 4-phase chain; v2 file preserved through Phase 5).
- `buildAgentDef` enriched with `workflows/role-prompts.yaml` lookup (responsibility + checklist + severity + specialist spliced into prompt; conservative 2-field stub fallback for unknown skill names).
- `MaxIterFallbackCtx.workflowName` plumbed through dispatch chain — stderr UX text now shows the actual workflow name (e.g. `execute-task`, `verify-paranoid`) instead of hardcoded `'harnessed-run'`.
```

---

## Architecture decision points

### D-1 — Backward compat strategy for research + execute-task subcommands

- **Option A (recommended)**: Keep subcommands as thin aliases. `harnessed research --query X` internally calls `runWorkflow('workflows/research/workflow.yaml', {}, { gateContext: { task: X } })`. Zero user-visible regression; existing user scripts continue to work.
- **Option B**: Deprecate with stderr warning + redirect to `harnessed run research --task X`. Breaks user scripts; conflicts with HANDOFF-v3.4.4 zero-regression contract.

Recommend **A**. Phase 6 (delete `src/routing/`) does NOT delete the alias subcommands themselves — they become thin shims over `runWorkflow` forever.

### D-2 — `workflows/execute-task/phases.yaml` v2 fate

- **Path A1 (recommended)**: Keep v2 `phases.yaml` alongside new v3 `workflow.yaml` through Phase 4 + 5. Phase 6 deletes both if no other consumer. Pro: safe rollback. Con: 2 SoT temporarily (acceptable per HANDOFF L745 "Path A").
- **Path A2**: Delete v2 `phases.yaml` in Phase 4. Pro: single SoT. Con: rollback harder; ROADMAP / handoff docs may still reference legacy file.

Recommend **A1**. Open verification: `tests/cli/execute-task.test.ts` cell 6 references `--workflow nonexistent-workflow-xyz` which currently exercises `loadPhases('workflows/nonexistent-workflow-xyz/phases.yaml')`. After migration the resolution path is `resolveWorkflowYaml('nonexistent-workflow-xyz')` → null → exit 2 with new error message. Test assertion adapts.

### D-3 — `buildAgentDef` lookup data source

`skillName` passed to `buildAgentDef` is the **phase id** (e.g. `'01-clarify'`, `'02-code'`) per `src/workflow/run.ts:281`: `const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id`.

`role-prompts.yaml` is keyed by **slash name** (e.g. `'verify-paranoid'`, `'task-clarify'`), NOT phase id. This means `rolePrompts[skillName]` lookup will MISS for most phase ids and fall back to the conservative stub for v3 sub-workflow phases.

**Resolution chain (Phase 4 v1)**:
1. Look up `rolePrompts[skillName]` directly (covers the standalone workflows where phase id IS the workflow name, e.g. `research/workflow.yaml` phase `01-fan-out` → no match; `auto/workflow.yaml` delegates_to entries → may match).
2. If miss, look up `rolePrompts[parsed.workflow]` (covers sub-workflows — workflow name IS the slash name; e.g. `verify-paranoid/workflow.yaml` phase `01-review` → `rolePrompts['verify-paranoid']` HIT).
3. If both miss, conservative 2-field stub.

This requires plumbing `workflowName` to `buildAgentDef` too (already added in Part E for fallback ctx — reuse). Update Edit 1 signature to accept optional `workflowName?: string` and try `rolePrompts[skillName] ?? rolePrompts[workflowName]`.

### D-4 — Model tier resolution

`workflows/capabilities.yaml` has ZERO `model:` field on capability entries (verified via Grep L1-1021; only `cmd:`, `since:`, `category:`, `description:`, `fires_when:`). Original spec assumption wrong.

**Revised resolution chain**:
1. `gateContext.modelTierOverride` (CLI `--model-tier inherit` from execute-task) — highest priority (B-10 escape hatch).
2. `phase.model` (yaml literal — e.g. `model: opus` on `01-clarify`) — applied at `AgentDefinition` construction time by `buildAgentDef`.
3. SDK parent-resolve (no `model` field on `AgentDefinition` → SDK uses parent session's model).

`gateContext.modelOverride` (CLI `--model haiku` from execute-task / research) is a DIFFERENT key — it overrides SPAWN-level model, sister legacy `runRouting.agentOpts.modelOverride`. For Phase 4, `gateContext.modelOverride` is captured into `gateContext` but NOT consumed by the dispatch path until Phase 5 (sdkSpawn-level override needs separate plumb; out of scope per HANDOFF L745).

### D-5 — `workflowName` extraction

`runWorkflow` already has `parsed.workflow` (the `workflow:` field at top of yaml) extracted at L198. Pass into every `_dispatchSkillStub.fn` call via opts.

`_dispatchSkillStub.fn` signature widens additively — existing 16 fixtures in `tests/workflow/run.test.ts` that DI-override the fn still work because the new opts fields are optional. `tests/cli/run.test.ts` already mocks `runWorkflow` outright so it's unaffected.

### D-6 — `getPackageRoot()` import in cli alias files

Phase 1 `src/cli/run.ts:31` does `const PACKAGE_ROOT = getPackageRoot()` at module top-level. The aliases in Part A + C need the same pattern. Sister import: `import { getPackageRoot } from './lib/packagePath.js'`. Verified `getPackageRoot()` already handles bundled `dist/cli.mjs` flattening (per commit `1bd7337`).

---

## Test plan (commands to run before each commit)

```bash
pnpm exec biome check --write
pnpm build                                                                  # MANDATORY per Phase 2 hotfix lesson
pnpm test                                                                    # baseline 0 fail expected (Phase 3.5 hotfix sweep cleared)

# Phase 4 specific:
node dist/cli.mjs research --query "Next.js v15 router" --dry-run --non-interactive
node dist/cli.mjs execute-task --task "implement X" --dry-run --non-interactive
node dist/cli.mjs run research --task "Next.js v15 router" --dry-run           # equivalent direct path
node dist/cli.mjs run execute-task --task "implement X" --dry-run              # NEW direct path (Phase 4 enables)

# Regression sweeps (Phase 1-3 paths still work):
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-real-spawn.test.ts  # Phase 2 regression
HARNESSED_REAL_SPAWN=1 pnpm test tests/integration/cli-run-max-iterations.test.ts  # Phase 3 regression
```

---

## Atomic commit plan

| # | Files | Suggested message | Wave |
|---|-------|-------------------|------|
| 1 | NEW `workflows/execute-task/workflow.yaml` + NEW `tests/workflow/execute-task-v3.test.ts` | `feat(workflow): v3.4.4 add v3 workflow.yaml for execute-task (sister v2 phases.yaml preserved for Phase 6 cleanup)` | 1 (parallel with #2) |
| 2 | `src/workflow/run.ts` (buildAgentDef enrich + workflowName plumb) + NEW `tests/workflow/buildAgentDef.test.ts` + NEW `tests/workflow/run-workflowname-plumb.test.ts` | `feat(workflow): v3.4.4 enrich buildAgentDef with role-prompts.yaml + plumb workflowName through MaxIterFallbackCtx` | 1 (parallel with #1) |
| 3 | `src/cli/research.ts` (alias to runWorkflow) + NEW `tests/cli/research.test.ts` | `refactor(cli): v3.4.4 research subcommand as thin alias to runWorkflow (routing/ dependency removed from CLI surface)` | 2 (depends on #2) |
| 4 | `src/cli/execute-task.ts` (alias to runWorkflow) + MODIFY `tests/cli/execute-task.test.ts` | `refactor(cli): v3.4.4 execute-task subcommand as thin alias to runWorkflow (v3 workflow.yaml from Commit 1)` | 3 (depends on #1 + #2) |
| 5 | `CHANGELOG.md` append | `docs(changelog): v3.4.4 Phase 4 research + execute-task aliases + buildAgentDef enrich + workflowName plumb` | 4 (depends on #1-4) |

**Execution order**:
- Wave 1 (parallel): Commits #1 + #2 (independent — yaml addition + run.ts internals)
- Wave 2 (sequential): Commit #3 (research alias — depends on enriched buildAgentDef)
- Wave 3 (sequential): Commit #4 (execute-task alias — depends on new v3 yaml from #1 + enriched buildAgentDef from #2)
- Wave 4 (sequential): Commit #5 (CHANGELOG — depends on all prior changes)

---

## Open verifications before implement

1. **`skillName` at dispatch site is phase id, NOT workflow name** — confirmed L281 `const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id`. D-3 resolution chain needed (try `rolePrompts[skillName]` then `rolePrompts[workflowName]`). **Implementer must verify that role-prompts.yaml lookup falls back gracefully when phase id doesn't match — non-master phases will mostly fall through to the workflowName lookup.**
2. **`runRouting` features NOT in `runWorkflow`**: `runRouting` does DAG pre-check + L1 keyword arbitrate + L2 semantic match + L3 fallback supervisor. `runWorkflow` reads yaml + walks phases + dispatches via SDK. The decision-rules / arbitrate / semantic-match layers are NOT replicated. For `research` migration this is acceptable because the v3 `workflows/research/workflow.yaml` already lists 2 phases (`01-fan-out` + `02-synth`) — runtime walks them directly without needing keyword arbitration. **Implementer must confirm no existing `harnessed research --query X` users rely on the L1/L2 semantic routing nuances.**
3. **`runBeforeCommitHook` replacement in workflow runtime**: `src/workflow/run.ts:316-331` already has a `runBeforeCommitHook` invocation gated on `r.triggers_commit === true` (phase-level dispatch result). The `execute-task.ts` pre-flight at L122-144 is a SEPARATE enforcement (cwd-wide `git status --porcelain` before spawn). Phase 4 KEEPS the pre-flight verbatim in the new alias body — both layers coexist (one enforces cwd-clean, the other enforces per-phase commit trigger). Long-term Phase 5+ may consolidate; out of scope.
4. **`role-prompts.yaml` schema field names**: Verified L28-43 in `src/cli/lib/generateCommands.ts` — `RolePrompt` has `primary_cap` / `specialist` / `responsibility` / `checklist[]` / `severity` / `description` / `is_master?`. Confirmed L99-188 `role-prompts.yaml` entries use exact field names. No drift.
5. **`workflows/capabilities.yaml` `model:` field availability**: Verified 0 entries declare `model:` (Grep L1-1021 returned 0 hits for `model.*haiku|sonnet|opus` and 0 for `^\s*model:`). D-4 revised — model tier resolution does NOT touch capabilities.yaml.
6. **`tests/workflow/research-v2.test.ts` impact**: 4 fixtures validate `workflows/research/workflow.yaml` v3 schema directly — they don't exercise the CLI path. Phase 4 does NOT modify the yaml, so these tests remain green without changes. Filename keeps the historical `-v2` suffix per the existing in-file comment (low-value rename).
7. **`tests/integration/routing-research-workflow.test.ts` impact**: Glob hit but not read in audit. **Implementer must read this file first** — if it asserts CLI calls `runRouting`, it needs refactor (see Part D Tests). If it tests routing engine internals decoupled from CLI, leave untouched (Phase 6 deletion).
8. **`getPackageRoot()` cwd-swap safety**: Phase 1 `1bd7337` hotfix already added `getPackageRoot()` to handle bundled `dist/cli.mjs` `import.meta.url` flattening. Sister Phase 4 aliases reuse the same helper.

---

## NOT in Phase 4 (deferred)

| Phase | Deferred work |
|-------|---------------|
| 5 | Real `getNextHint` implementation (Phase 1 stub at `src/cli/run.ts:190` returns null). `gateContext.modelOverride` consumption at sdkSpawn level (Phase 4 captures into gateContext but doesn't propagate to AgentDefinition spawn). |
| 6 | Delete `src/routing/` + `src/routing-engine/` + `tests/routing/*` + `tests/integration/routing-*` + `workflows/execute-task/phases.yaml` (v2 legacy SoT after Phase 4 keeps both). Remove `t('install.aborted')` / `t('research.install_fix_hint')` i18n keys (no longer reachable from CLI surface). |
