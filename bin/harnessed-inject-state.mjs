#!/usr/bin/env node
// G4 UserPromptSubmit hook — print the <workflow-state> breadcrumb for the active
// harnessed workflow. Silent exit 0 when there is no state (mirror readCurrentWorkflow
// fail-soft). Reads <harnessed-root>/current-workflow.json directly (no heavy imports).
//
// Root resolution replicates getHarnessedRoot() from src/installers/lib/harnessedRoot.ts:
//   - If HARNESSED_ROOT_OVERRIDE is set and non-empty → use it verbatim (test isolation).
//   - Otherwise → <homedir>/.claude/harnessed  (v3.0.3 co-located path).
// On Windows, os.homedir() uses USERPROFILE; on POSIX it uses HOME. Both are correct
// via the Node.js homedir() implementation — no manual env reading needed here.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

try {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  const root =
    override !== undefined && override !== '' ? override : join(homedir(), '.claude', 'harnessed')
  const statePath = join(root, 'current-workflow.json')
  const wf = JSON.parse(readFileSync(statePath, 'utf8'))
  const ledger = wf.sub_progress ?? []
  const next = ledger.find((e) => e.status === 'pending')?.sub ?? null
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  for (const e of ledger) {
    if ((e.fail_count ?? 0) >= 3)
      lines.push(
        `BREAK-LOOP: sub '${e.sub}' failed ${e.fail_count}x — stop retrying, run break-loop skill`,
      )
  }
  lines.push('</workflow-state>')
  process.stdout.write(`${lines.join('\n')}\n`)
} catch {
  // no state / corrupt / not a harnessed session -> inject nothing
}
process.exit(0)
