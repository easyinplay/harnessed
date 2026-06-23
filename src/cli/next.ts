// `harnessed next` — emit the deterministic next-step contract (G2). Reads the
// singleton ledger + auto_transition (env > envelope > default true), prints
// NEXT/SUB/HINT. No state mutation. Sister: src/cli/resume.ts lazy-import pattern.

import type { Command } from 'commander'

export function registerNext(program: Command): void {
  program
    .command('next')
    .description(
      'Print the deterministic next-step contract (NEXT: auto|manual|done) for the active workflow',
    )
    .action(async () => {
      const { readCurrentWorkflow } = await import('../checkpoint/state.js')
      const { resolveNext, resolveAutoTransition } = await import('../checkpoint/nextStep.js')
      const current = await readCurrentWorkflow()
      const ledger = current?.sub_progress ?? []
      const auto = resolveAutoTransition(current?.auto_transition)
      const step = resolveNext(ledger, auto)
      console.log(`NEXT: ${step.next}`)
      if (step.sub) console.log(`SUB: ${step.sub}`)
      if (step.hint) console.log(`HINT: ${step.hint}`)
      process.exit(0)
    })
}
