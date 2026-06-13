// `harnessed workflows` — list every in-flight workflow (one per repo-root) in
// the Phase 15 multi-workflow store. The active workflow is resolved implicitly
// by the current working directory, so this is the way to see what is running
// across other repos on the machine.
import type { Command } from 'commander'

export function registerWorkflows(program: Command): void {
  program
    .command('workflows')
    .description('List all in-flight workflows (one per repo) from the multi-workflow store')
    .action(async () => {
      const { listWorkflows } = await import('../checkpoint/workflowStore.js')
      const ws = await listWorkflows()
      if (ws.length === 0) {
        console.log('[harnessed] no active workflows')
        return
      }
      for (const w of ws) console.log(`${w.key}  ${w.phase} [${w.status}]`)
    })
}
