// Phase 1.4 T5.1 — `harnessed research <prompt>` independent subcommand.
//
// IMPL NOTE — D-15 独立子命令 (沿袭 D-9 install-base; 不在 install <name> 上加
// flag 避免 H1 gate 冲突). KICKOFF C4 + D1.4-9 + Pattern G barrel import.
// W-2 sister patch (D1.4-4 子决策): install adapter via library call —
// engine.runRouting → ensureSkillsInstalled (lib/ralphLoop.ts) consumes
// runInstall() directly when wired through opts.installAdapter (PLAN.md
// § 4 接口契约 6); we **never** spawn `node ./dist/cli.mjs install` subprocess
// (overlaps R1 Wave 1 spike + slower + cross-stack debug pain).
// EngineResult three-state → exit codes:
//   0  → ok (verbatim COMPLETE round-trip succeeded)
//   1  → ok:false {phase: arbitrate|install|spawn|verbatim} (typed error)
//   2  → aborted {reason} (max-iter exceeded / user-aborted)
// H1 gate (sibling install-base.ts): --non-interactive requires --apply or --dry-run.

import type { Command } from 'commander'
import { runRouting, type TaskContext } from '../routing/index.js'

interface RawOpts {
  query?: string
  apply?: boolean
  dryRun?: boolean
  nonInteractive?: boolean
  model?: 'haiku' | 'sonnet' | 'opus'
}

export function registerResearch(program: Command): void {
  program
    .command('research')
    .description('Run research workflow (search category sub-routing → spawn → verbatim COMPLETE)')
    .requiredOption('--query <text>', 'research prompt (required)')
    .option('--apply', 'execute the spawn (default: dry-run preview only)')
    .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
    .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .action(async (raw: RawOpts) => {
      // H1 gate (sibling install-base.ts L51-L56)
      if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
        console.error(
          "error: --non-interactive requires --apply or --dry-run\n  fix:  'harnessed research --query <text> --non-interactive --dry-run' or '--apply'",
        )
        process.exit(2)
      }
      if (!raw.query) {
        console.error('error: --query <text> is required')
        process.exit(2)
      }

      const taskCtx: TaskContext = { task: raw.query, task_type: 'search' }

      // Dry-run path: arbitrate-only preview, never spawn (mirrors install --dry-run).
      if (raw.dryRun === true || (!raw.apply && !raw.nonInteractive)) {
        const preview = await runRouting(taskCtx, {
          skillsRoot: undefined,
          // Stub spawn — dry-run never reaches it; explicit COMPLETE keeps shape happy.
          spawn: async () => 'dry-run preview\nCOMPLETE',
          maxIterations: 1,
          ...(raw.model ? { agentOpts: { modelOverride: raw.model } } : {}),
        })
        if ('aborted' in preview) {
          console.error(`aborted: ${preview.reason}`)
          process.exit(2)
        }
        if ('ok' in preview && preview.ok === false) {
          console.error(`error: ${preview.phase} — ${preview.error.message}`)
          process.exit(1)
        }
        console.log(`[dry-run] matched_rule: ${preview.matchedRule?.id ?? '(fallback supervisor)'}`)
        console.log(`[dry-run] query: ${raw.query}`)
        console.log('  (use --apply to spawn the subagent and emit verbatim COMPLETE round-trip)')
        process.exit(0)
      }

      // --apply path: real spawn requires SDK runtime dep (F40-2 deferred to phase 1.5).
      // Until then, runRouting.defaultSpawn throws a friendly placeholder error.
      const result = await runRouting(taskCtx, {
        ...(raw.model ? { agentOpts: { modelOverride: raw.model } } : {}),
      })
      if ('aborted' in result) {
        console.error(`aborted: ${result.reason}`)
        process.exit(2)
      }
      if ('ok' in result && result.ok === false) {
        console.error(`error: ${result.phase} — ${result.error.message}`)
        if (result.phase === 'install') {
          console.error(`  fix:  'harnessed install <skill> --apply' (see error above)`)
        }
        process.exit(1)
      }
      console.log(result.result)
      process.exit(0)
    })
}
