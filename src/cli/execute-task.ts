// Phase 2.2 T5.1 — `harnessed execute-task --task <text>` independent subcommand.
//
// IMPL NOTE — B-10 + B-28 + PATTERNS § 2.1 (Register block).
// Sister to src/cli/research.ts L16-92 — same H1 gate (sibling install-base.ts L51-56),
// same 3-state EngineResult → exit code mapping (0 COMPLETE / 1 FAIL / 2 USAGE).
// Loads execute-task workflow phases.yaml (T3.2 loadPhases) + drives engine.runRouting
// (T4.2 sdkSpawn-backed). `--model-tier inherit` flag = B-10 escape hatch — overrides
// per-phase phase.model with 'inherit' for SDK parent-resolve semantics (W3 ModelTier
// 4th enum). Forward-looking subcommand surface; auto-invocation pushed Phase 2.3.

import type { Command } from 'commander'
import { runRouting, type TaskContext } from '../routing/index.js'
import { loadPhases } from '../workflow/loadPhases.js'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'

interface RawOpts {
  task?: string
  apply?: boolean
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
    .description('Run execute-task workflow (4-phase chain → ralph-loop COMPLETE)')
    .requiredOption('--task <text>', 'task description (required)')
    .option('--workflow <name>', 'workflow name', 'execute-task')
    .option('--apply', 'execute the spawn (default: dry-run preview)')
    .option('--dry-run', 'force dry-run (overrides --apply if both set)')
    .option('--non-interactive', 'CI / scripts — requires --apply or --dry-run')
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .option('--model-tier <tier>', "override: 'inherit' bypasses per-phase phase.model (B-10)")
    .option('--max-iterations <n>', 'ralph-loop max iter (default 20)', (v) => parseInt(v, 10))
    .action(async (raw: RawOpts) => {
      // H1 gate — sibling install-base.ts pattern
      validateNonInteractiveFlags(raw, 'execute-task --task <text>')
      if (!raw.task) {
        console.error('error: --task <text> is required')
        process.exit(2)
      }

      const workflowName = raw.workflow ?? 'execute-task'
      let phases: ReturnType<typeof loadPhases>
      try {
        phases = loadPhases(`workflows/${workflowName}/phases.yaml`)
      } catch (error) {
        console.error(
          `error: failed to load workflows/${workflowName}/phases.yaml — ${(error as Error).message}`,
        )
        process.exit(2)
      }

      // B-10 escape hatch — `--model-tier inherit` overrides all phase.model values.
      if (raw.modelTier === 'inherit') {
        phases = {
          ...phases,
          phases: phases.phases.map((p) => ({ ...p, model: 'inherit' as const })),
        }
      }

      const taskCtx: TaskContext = { task: raw.task, task_type: 'execute-task' }
      const isDryRun = raw.dryRun === true || (!raw.apply && !raw.nonInteractive)

      // Dry-run path — arbitrate-only preview (mirrors research.ts L52-72).
      if (isDryRun) {
        console.log(
          JSON.stringify({ workflow: phases.workflow, phases: phases.phases, taskCtx }, null, 2),
        )
        process.exit(0)
      }

      // --apply path — real spawn via engine.runRouting (T4.2 sdkSpawn).
      const result = await runRouting(taskCtx, {
        maxIterations: raw.maxIterations ?? 20,
        ...(raw.model ? { agentOpts: { modelOverride: raw.model } } : {}),
      })
      if ('aborted' in result) {
        console.error(`aborted: ${result.reason}`)
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
