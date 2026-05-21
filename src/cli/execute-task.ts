// Phase 2.2 T5.1 — `harnessed execute-task --task <text>` independent subcommand.
//
// IMPL NOTE — B-10 + B-28 + PATTERNS § 2.1 (Register block).
// Sister to src/cli/research.ts L16-92 — same H1 gate (sibling install-base.ts L51-56),
// same 3-state EngineResult → exit code mapping (0 COMPLETE / 1 FAIL / 2 USAGE).
// Loads execute-task workflow phases.yaml (T3.2 loadPhases) + drives engine.runRouting
// (T4.2 sdkSpawn-backed). `--model-tier inherit` flag = B-10 escape hatch — overrides
// per-phase phase.model with 'inherit' for SDK parent-resolve semantics (W3 ModelTier
// 4th enum). Forward-looking subcommand surface; auto-invocation pushed Phase 2.3.
//
// Phase v3.0-3.5 W0 T3.5.W0.4 — before-commit hook wire (K5 Option A enforcement):
// apply path pre-flight `runBeforeCommitHook` enforce biome auto-fix on TS/JS work
// tree changes BEFORE ralph-loop subagent spawn。subagent SDK 内部 git commit 时
// work tree 已 biome-clean。User 主 session git commit 不走此 path(clean separation
// per K5 Option A;主 session 用户自负 biome-preempt 责任)。
// dry-run path NOT triggered(K5 Option A 仅 真 spawn 路径 enforce)。
//
// v3.3.0 cleanup — `--apply` backward-compat alias removed (was no-op since v3.0.1)。

import { execSync } from 'node:child_process'
import type { Command } from 'commander'
import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
import { t } from '../i18n/index.js'
import { runRouting, type TaskContext } from '../routing/index.js'
import type { FallbackMaxIterationsExceededConfig } from '../routing/lib/fallbackHandlers.js'
import { type LoadedPhases, loadPhases } from '../workflow/loadPhases.js'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'

interface RawOpts {
  task?: string
  dryRun?: boolean
  nonInteractive?: boolean
  model?: 'haiku' | 'sonnet' | 'opus'
  modelTier?: 'inherit'
  maxIterations?: number
  workflow?: string
}

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
      let phases: ReturnType<typeof loadPhases>
      try {
        phases = loadPhases(`workflows/${workflowName}/phases.yaml`)
      } catch (error) {
        console.error(
          t('execute_task.load_phases_failed', {
            workflow: workflowName,
            message: (error as Error).message,
          }),
        )
        process.exit(2)
      }

      // B-10 escape hatch — `--model-tier inherit` overrides all phase.model values.
      // T2.4.W1.1: loadPhases returns LoadedPhases union (v1 PhasesSchema OR v2
      // WorkflowSchemaV2T). Cast assembled override to LoadedPhases to preserve
      // v2-only fields (capability/gate/on/fallback) for downstream engine handler.
      if (raw.modelTier === 'inherit') {
        phases = {
          ...phases,
          phases: phases.phases.map((p) => ({ ...p, model: 'inherit' as const })),
        } as LoadedPhases
      }

      const taskCtx: TaskContext = { task: raw.task, task_type: 'execute-task' }
      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      const isDryRun = raw.dryRun === true

      // Dry-run path — arbitrate-only preview (mirrors research.ts L52-72).
      if (isDryRun) {
        console.log(
          JSON.stringify({ workflow: phases.workflow, phases: phases.phases, taskCtx }, null, 2),
        )
        process.exit(0)
      }

      // T2.4.W1.5 — extract phase.fallback.max_iterations_exceeded from v2 phases.yaml
      // (sister `04-deliver` ralph-loop wrapper). Narrow v1 ∪ v2 LoadedPhases via
      // structural `'fallback' in p` check; engine.ts catch handler delegates to
      // handleMaxIterationsExceeded (R20.10 c explicit halt, NOT silent exit).
      let fallbackConfig: FallbackMaxIterationsExceededConfig | undefined
      let fallbackPhaseId: string | undefined
      for (const ph of phases.phases) {
        if ('fallback' in ph && ph.fallback?.max_iterations_exceeded) {
          fallbackConfig = ph.fallback.max_iterations_exceeded
          fallbackPhaseId = ph.id
          break
        }
      }

      // T3.5.W0.4 — before-commit hook K5 Option A enforcement (ralph-loop / subagent
      // auto-commit path ONLY)。apply path 在 runRouting subagent spawn 前 enforce
      // biome auto-fix:work tree TS/JS modified files → biome --write,subagent SDK
      // 内部 commit 时已 biome-clean。apply-immediate default 等同 user explicit approval = pass。
      // User 主 session 直接 git commit NOT 走此 path(K5 Option A clean separation)。
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

      // apply path — real spawn via engine.runRouting (T4.2 sdkSpawn).
      const result = await runRouting(taskCtx, {
        maxIterations: raw.maxIterations ?? 20,
        ...(raw.model ? { agentOpts: { modelOverride: raw.model } } : {}),
        ...(fallbackConfig ? { fallbackConfig } : {}),
        ...(fallbackPhaseId ? { fallbackPhaseId } : {}),
      })
      // T2.4.W1.5 — `aborted` branch reachable ONLY when `fallbackConfig` is
      // absent (legacy caller / unit test mock without v2 yaml fallback). With
      // wire-in: engine handleMaxIterationsExceeded calls process.exit(exit_code)
      // directly, so control never returns here for v2 execute-task workflow.
      if ('aborted' in result) {
        console.error(t('install.aborted', { reason: result.reason }))
        process.exit(2)
      }
      if ('ok' in result && result.ok === false) {
        console.error(`error: ${result.phase} — ${result.error.message}`)
        process.exit(1)
      }
      console.log(result.result)
      process.exit(0)
    })
}
