// `harnessed checkpoint` CLI — record workflow progress to the harnessed checkpoint
// store. CC main session calls this after each sub-workflow completes.
//
// Single `checkpoint <action> <sub>` command; action ∈ {start, complete, fail}.
// Reuses src/checkpoint/engineHook.ts (activatePhase / completePhase) — no direct
// filesystem or Date access here (sister: src/cli/resume.ts lazy-import pattern).
//
// Semantics:
//   start <sub>               → activatePhase(sub)        — status=active + checkpoint path
//   complete <sub> [--summary]→ completePhase(complete)   — terminal checkpoint, exit 0
//   fail <sub> [--summary]    → completePhase(complete)   — terminal checkpoint w/ FAILED:
//                                prefix in lastTask, exit 1 (engineHook has no 'fail' status).

import type { Command } from 'commander'

const ACTIONS = ['start', 'complete', 'fail'] as const
type Action = (typeof ACTIONS)[number]

function isAction(a: string): a is Action {
  return (ACTIONS as readonly string[]).includes(a)
}

export function registerCheckpoint(program: Command): void {
  program
    .command('checkpoint <action> <sub>')
    .description(
      'Record workflow progress: start | complete | fail <sub-workflow> (writes to ~/.claude/harnessed/checkpoints/)',
    )
    .option('--summary <text>', 'short summary stored as the checkpoint lastTask')
    .action(async (action: string, sub: string, opts: { summary?: string }) => {
      if (!isAction(action)) {
        console.error(
          `[harnessed] checkpoint: unknown action "${action}" — expected one of ${ACTIONS.join(', ')}`,
        )
        process.exit(1)
        return
      }

      const { activatePhase, completePhase } = await import('../checkpoint/engineHook.js')

      if (action === 'start') {
        const { checkpointPath } = await activatePhase(sub)
        console.log(`[harnessed] checkpoint started: ${sub} → ${checkpointPath}`)
        process.exit(0)
        return
      }

      if (action === 'complete') {
        await completePhase({
          phaseId: sub,
          status: 'complete',
          lastTask: opts.summary ?? `phase ${sub} complete`,
        })
        console.log(`[harnessed] checkpoint complete: ${sub}`)
        process.exit(0)
        return
      }

      // action === 'fail' — record a terminal checkpoint with FAILED: prefix,
      // signal failure via exit code (engineHook status union has no 'fail').
      await completePhase({
        phaseId: sub,
        status: 'complete',
        lastTask: `FAILED: ${opts.summary ?? ''}`,
      })
      console.error(
        `[harnessed] checkpoint FAILED recorded: ${sub}${opts.summary ? ` — ${opts.summary}` : ''}`,
      )
      process.exit(1)
    })
}
