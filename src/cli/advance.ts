// src/cli/advance.ts — v12.0 Forward Continuation (Phase 38, D4). `harnessed advance`
// — the act half of the gsd-pi next(read)/advance(act) split. Derives the next work
// unit from .planning disk state, applies the comet advance-gate (refuse to skip an
// earlier incomplete phase / a failed sub unless --force), and PRINTS the start
// instruction. OQ-1 print-only: it never seeds current-workflow.json and never spawns
// — the main session runs the emitted command, keeping clarification / Agent-Teams
// reachable (same rationale as the issue #2 orchestrator bodies).
//
// Exit codes: 0 advance · 2 done · 10 blocked · 11 gate-reject · 1 error.
// Driver loop:  while harnessed advance --json; do : ; done   (0 loops, non-zero stops)

import type { Command } from 'commander'

interface AdvanceOpts {
  json?: boolean
  force?: boolean
}

export function registerAdvance(program: Command): void {
  program
    .command('advance')
    .description(
      'Advance to the next work unit derived from .planning (gated: refuses to skip an earlier incomplete phase unless --force). Print-only — emits the command to run.',
    )
    .option('--json', 'emit machine-readable {next, unit, hint} for driver loops')
    .option('--force', 'override the advance-gate (records an audit note in the output)')
    .action(async (opts: AdvanceOpts) => {
      const { readCurrentWorkflow } = await import('../checkpoint/state.js')
      const { scanPlanning } = await import('../checkpoint/planningScan.js')
      const { resolveAdvance } = await import('../checkpoint/forwardStep.js')
      const current = await readCurrentWorkflow()
      const snapshot = scanPlanning({
        repoRoot: process.cwd(),
        currentWorkflow: current,
        includeTasks: false,
      })
      const step = resolveAdvance(snapshot, opts.force ?? false)
      if (opts.json) {
        console.log(JSON.stringify(step.json))
      } else {
        for (const line of step.lines) console.log(line)
      }
      process.exit(step.exitCode)
    })
}
