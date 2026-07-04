// Phase 1.4 T5.1 — `harnessed research <prompt>` independent subcommand.
//
// IMPL NOTE — D-15 独立子命令 (沿袭 D-9 install-base; 不在 install <name> 上加
// flag 避免 H1 gate 冲突). KICKOFF C4 + D1.4-9 + Pattern G barrel import.
//
// v3.4.4 (Phase 4) — REFACTORED: research subcommand is now a thin alias to
// `runWorkflow` (src/workflow/run.ts) targeting the already-v3
// workflows/research/workflow.yaml. Subcommand surface unchanged
// (--query / --dry-run / --non-interactive / --model + H1 gate + exit-code
// semantics 0/1/2) → zero user-visible regression.
//
// Pre-Phase-4 body called `runRouting` (src/routing/engine.ts) — Phase 6 will
// delete src/routing/ entirely; for now the routing/ module stays LIVE to
// support legacy callers (src/routing-engine/ test fixtures + ralph-loop
// wrapper). This file no longer imports from src/routing/.
//
// Exit codes (preserved from v3.3.0):
//   0  → ok (workflow runtime completed successfully)
//   1  → workflow runtime failed (status === 'failed' or thrown)
//   2  → usage error (missing --query / yaml not found)
// v3.3.0: `--apply` backward-compat alias removed; default is apply-immediate.

import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { runWorkflow } from '../workflow/run.js'
import { getAssetsRoot } from './lib/assetsRoot.js'
import { resolveWorkflowYaml } from './run.js'

interface RawOpts {
  query?: string
  dryRun?: boolean
  nonInteractive?: boolean
  model?: 'haiku' | 'sonnet' | 'opus'
}

const PACKAGE_ROOT = getAssetsRoot()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

export function registerResearch(program: Command): void {
  program
    .command('research')
    .description(
      'Run research workflow (search category sub-routing → spawn → verbatim COMPLETE; immediate by default — use --dry-run for preview)',
    )
    .requiredOption('--query <text>', 'research prompt (required)')
    .option('--dry-run', 'preview only — do not spawn subagent (opt-in for advanced users)')
    .option('--non-interactive', 'skip all prompts (CI / scripts)')
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .action(async (raw: RawOpts) => {
      if (!raw.query) {
        console.error(t('research.require_query'))
        process.exit(2)
      }

      // Resolve workflows/research/workflow.yaml (already v3 per Phase 2 Commit 1).
      const yamlPath = await resolveWorkflowYaml('research', WORKFLOWS_DIR)
      if (!yamlPath) {
        console.error(`error: workflows/research/workflow.yaml not found under ${WORKFLOWS_DIR}`)
        process.exit(2)
        return
      }

      // gateContext: --query → task; --model → modelOverride (captured for
      // Phase 5 sdkSpawn-level consumption; Phase 4 plumbs only).
      const gateContext: Record<string, unknown> = {
        task: raw.query,
        ...(raw.model ? { modelOverride: raw.model } : {}),
      }

      // Dry-run: universal Phase 1 JSON envelope shape (sister src/cli/run.ts:91).
      // Replaces v3.4.3 3-line t('research.dry_run.*') output.
      if (raw.dryRun === true) {
        console.log(JSON.stringify({ workflow: 'research', yamlPath, gateContext }, null, 2))
        process.exit(0)
        return
      }

      // Apply path: runWorkflow + fail-soft try/catch + exit 1 on failed.
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
