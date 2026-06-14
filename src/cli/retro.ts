// `harnessed retro --done` — Phase 22 retro-reminder reset. `/retro` is a gstack
// skill harnessed can't observe, so after running it the operator (or the AI,
// prompted by the RETRO-DUE inject line) calls this to zero the per-repo phase
// counter and clear the envelope `retro_due` flag. Sister: `harnessed reject`.

import type { Command } from 'commander'
import { resetRetro } from '../checkpoint/retroMeta.js'

/** Reset the per-repo retro cadence: zero the store-sidecar counter + stamp
 *  last_retro_at, and clear the envelope `retro_due` flag. Pure-ish (I/O via
 *  state.ts); `now` injected for deterministic tests. Returns the new counter. */
export async function runRetroDone(now: string): Promise<{ reset: true }> {
  const { mutateStore, readCurrentWorkflow, writeCurrentWorkflow } = await import(
    '../checkpoint/state.js'
  )
  const { repoKey } = await import('../checkpoint/workflowStore.js')
  const key = repoKey()

  await mutateStore((store) => {
    const meta = { ...(store.retro_meta ?? {}) }
    meta[key] = resetRetro(now)
    return { ...store, retro_meta: meta }
  })

  // Clear the derived flag on the current envelope (if any) so the RETRO-DUE line
  // stops immediately, rather than waiting for the next completion to re-derive it.
  const wf = await readCurrentWorkflow()
  if (wf?.retro_due) await writeCurrentWorkflow({ ...wf, retro_due: false })

  return { reset: true }
}

export function registerRetro(program: Command): void {
  program
    .command('retro')
    .description('Retro cadence: --done resets the phase counter after running /retro')
    .option(
      '--done',
      'mark a retro as done — reset the phase counter + clear the RETRO-DUE reminder',
    )
    .action(async (opts: { done?: boolean }) => {
      if (!opts.done) {
        console.error('[harnessed] retro: nothing to do — pass --done after running /retro')
        process.exit(1)
        return
      }
      await runRetroDone(new Date().toISOString())
      console.log('[harnessed] retro recorded — phase counter reset, RETRO-DUE reminder cleared')
      process.exit(0)
    })
}
