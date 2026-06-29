// `harnessed next` — emit the deterministic next-step contract. Reads the singleton
// ledger + auto_transition (env > envelope > default true). Two layers:
//   1. mid-flight workflow (pending sub) → intra-workflow NEXT: auto|manual|done +
//      SUB/HINT, exit 0 — the existing G2 contract, unchanged (AC9).
//   2. subs resolved to `done` → fall through to cross-unit forward continuation
//      (v12.0 Phase 38, D3): scanPlanning → deriveNext → NEXT: advance|blocked|done
//      with exit codes 0 (advance) / 2 (done) / 10 (blocked) so a driver can branch.
// No state mutation. Sister: src/cli/resume.ts lazy-import pattern.

import type { Command } from 'commander'

export function registerNext(program: Command): void {
  program
    .command('next')
    .description(
      'Print the deterministic next-step contract: intra-workflow sub (auto|manual|done) then cross-unit forward continuation (advance|blocked|done), exit 0/2/10',
    )
    .action(async () => {
      const { readCurrentWorkflow } = await import('../checkpoint/state.js')
      const { resolveNext, resolveAutoTransition } = await import('../checkpoint/nextStep.js')
      const current = await readCurrentWorkflow()
      const ledger = current?.sub_progress ?? []
      const auto = resolveAutoTransition(current?.auto_transition)
      const step = resolveNext(ledger, auto)
      // Backward-compat (AC9): a mid-flight workflow keeps the intra-workflow sub
      // contract verbatim. ONLY when subs resolve to `done` do we fall through to
      // cross-unit forward continuation (D3).
      if (step.next !== 'done') {
        console.log(`NEXT: ${step.next}`)
        if (step.sub) console.log(`SUB: ${step.sub}`)
        if (step.hint) console.log(`HINT: ${step.hint}`)
        process.exit(0)
        return
      }
      // D3 fall-through — derive the next cross-unit (task / phase / blocked / done).
      const { scanPlanning } = await import('../checkpoint/planningScan.js')
      const { resolveForwardStep } = await import('../checkpoint/forwardStep.js')
      const snapshot = scanPlanning({
        repoRoot: process.cwd(),
        currentWorkflow: current,
        includeTasks: false,
      })
      const fwd = resolveForwardStep(snapshot)
      for (const line of fwd.lines) console.log(line)
      process.exit(fwd.exitCode)
    })
}
