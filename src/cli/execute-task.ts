// Phase 2.2 T5.1 — `harnessed execute-task --task <text>` independent subcommand.
//
// IMPL NOTE — B-10 + B-28 + PATTERNS § 2.1 (Register block).
// Sister to src/cli/research.ts L16-92 — same H1 gate (sibling install-base.ts L51-56),
// same 3-state exit code mapping (0 ok / 1 fail / 2 usage).
//
// v3.4.4 (Phase 4 Commit 4) — REFACTORED: execute-task subcommand is now a thin
// alias to `runWorkflow` (src/workflow/run.ts) targeting the v3
// workflows/execute-task/workflow.yaml (landed Commit 1 — sister
// `40e76fd`). Subcommand surface unchanged (--task / --dry-run /
// --non-interactive / --model / --model-tier / --max-iterations /
// --workflow + H1 gate + K5 before-commit hook + exit-code semantics 0/1/2)
// → zero user-visible regression.
//
// Pre-Phase-4 body called `loadPhases(v2 phases.yaml)` + `runRouting(taskCtx)`.
// Phase 6 will delete src/routing/ + the v2 `workflows/execute-task/phases.yaml`
// alongside src/routing-engine/. The v2 yaml stays put through Phase 5 per
// D-2 Path A1 (HANDOFF L745).
//
// Phase v3.0-3.5 W0 T3.5.W0.4 — before-commit hook wire (K5 Option A enforcement):
// apply path pre-flight `runBeforeCommitHook` enforce biome auto-fix on TS/JS work
// tree changes BEFORE workflow runtime dispatch。subagent SDK 内部 git commit 时
// work tree 已 biome-clean。User 主 session git commit 不走此 path(clean separation
// per K5 Option A;主 session 用户自负 biome-preempt 责任)。
// dry-run path NOT triggered(K5 Option A 仅 真 spawn 路径 enforce)。
//
// This pre-flight K5 Option A block (cwd-wide `git status --porcelain` enforce)
// coexists with src/workflow/run.ts:316-331 per-phase `triggers_commit`-gated
// enforcement (both layers preserved per spec D-3 verification #3).
//
// v3.3.0 cleanup — `--apply` backward-compat alias removed (was no-op since v3.0.1)。
//
// Exit codes:
//   0  → ok (workflow runtime completed successfully)
//   1  → workflow runtime failed (status === 'failed' or thrown)
//   2  → usage error (missing --task / yaml not found)

import { execSync } from 'node:child_process'
import { join } from 'node:path'
import type { Command } from 'commander'
import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
import { t } from '../i18n/index.js'
import { runWorkflow } from '../workflow/run.js'
import { getPackageRoot } from './lib/packagePath.js'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'
import { resolveWorkflowYaml } from './run.js'

interface RawOpts {
  task?: string
  dryRun?: boolean
  nonInteractive?: boolean
  model?: 'haiku' | 'sonnet' | 'opus'
  modelTier?: 'inherit'
  maxIterations?: number
  workflow?: string
}

const PACKAGE_ROOT = getPackageRoot()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

export function registerExecuteTask(program: Command): void {
  program
    .command('execute-task')
    .description(
      'Run execute-task workflow (4-phase chain → ralph-loop COMPLETE; immediate by default — use --dry-run for preview)',
    )
    .requiredOption('--task <text>', 'task description (required)')
    .option('--workflow <name>', 'workflow name', 'execute-task')
    .option('--dry-run', 'preview only — do not spawn subagent (opt-in for advanced users)')
    .option('--non-interactive', 'CI / scripts')
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .option('--model-tier <tier>', "override: 'inherit' bypasses per-phase phase.model (B-10)")
    .option('--max-iterations <n>', 'ralph-loop max iter (default 20)', (v) => parseInt(v, 10))
    .action(async (raw: RawOpts) => {
      // H1 gate — sibling install-base.ts pattern
      validateNonInteractiveFlags(raw, 'execute-task --task <text>')
      if (!raw.task) {
        console.error(t('execute_task.require_task'))
        process.exit(2)
      }

      const workflowName = raw.workflow ?? 'execute-task'
      const yamlPath = await resolveWorkflowYaml(workflowName, WORKFLOWS_DIR)
      if (!yamlPath) {
        console.error(
          t('execute_task.load_phases_failed', {
            workflow: workflowName,
            message: 'workflow.yaml not found',
          }),
        )
        process.exit(2)
        return
      }

      // gateContext: --task → task; --model → modelOverride (captured for Phase 5
      // sdkSpawn-level consumption); --model-tier → modelTierOverride (consumed by
      // Phase 4 buildAgentDef enrichment when set — B-10 escape hatch);
      // --max-iterations → maxIterations (Phase 3 plumb path; ralph-loop opt-in
      // phases 01-04 honor the cap end-to-end).
      const gateContext: Record<string, unknown> = {
        task: raw.task,
        ...(raw.model ? { modelOverride: raw.model } : {}),
        ...(raw.modelTier ? { modelTierOverride: raw.modelTier } : {}),
        ...(raw.maxIterations ? { maxIterations: raw.maxIterations } : {}),
      }

      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      if (raw.dryRun === true) {
        // Universal Phase 1 dry-run JSON envelope shape (sister src/cli/run.ts:91 +
        // src/cli/research.ts:77). Replaces v2 `{ workflow, phases, taskCtx }` shape.
        console.log(JSON.stringify({ workflow: workflowName, yamlPath, gateContext }, null, 2))
        process.exit(0)
        return
      }

      // T3.5.W0.4 — before-commit hook K5 Option A enforcement (apply path ONLY).
      // Pre-flight enforce biome auto-fix on TS/JS work tree changes BEFORE the
      // workflow runtime dispatch (subagent SDK internal commits run with a
      // biome-clean work tree). PRESERVED VERBATIM from pre-Phase-4 body — spec
      // D-3 verification #3 explicitly says keep this enforcement layer; it
      // coexists with src/workflow/run.ts:316-331 per-phase `triggers_commit`
      // enforcement (this layer is cwd-wide; workflow runtime layer is per-phase).
      try {
        const stagedOut = execSync('git status --porcelain', { encoding: 'utf8' })
        const changedFiles = stagedOut
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((l) => l.slice(3).trim())
        await runBeforeCommitHook({
          changedFiles,
          cmdArgs: [],
          packageRoot: process.cwd(),
          cmdType: 'git-commit',
          hasUserApproval: true, // apply-immediate default
        })
      } catch (err) {
        // Fail-soft per ADR 0029:git status / biome auto-fix throw → warn + 继续
        // (subagent 内部 commit 时还会有第二道 biome --write check via SDK Bash tool)。
        console.warn(t('execute_task.precommit_skipped', { message: (err as Error).message }))
      }

      // Apply path — runWorkflow + fail-soft try/catch + exit 1 on failed status.
      let result: Awaited<ReturnType<typeof runWorkflow>>
      try {
        result = await runWorkflow(yamlPath, {}, { packageRoot: PACKAGE_ROOT, gateContext })
      } catch (err) {
        console.error(`error: workflow runtime failed — ${(err as Error).message}`)
        process.exit(1)
        return
      }
      process.exit(result.status === 'failed' ? 1 : 0)
    })
}
