// `harnessed learn "<lesson>"` — append a prose learning to this repo's
// .planning/LEARNINGS.md (the agent-supplied half of the Phase 16 hybrid loop;
// the auto half fires on workflow completion in checkpoint.ts).
import type { Command } from 'commander'

export function registerLearn(program: Command): void {
  program
    .command('learn <lesson>')
    .description("Append a prose learning to this repo's .planning/LEARNINGS.md")
    .action(async (lesson: string) => {
      const { appendLearning, formatLearningEntry } = await import('../checkpoint/learnings.js')
      const { repoKey } = await import('../checkpoint/workflowStore.js')
      const entry = formatLearningEntry({
        phase: '(manual)',
        signals: [],
        prose: lesson,
        at: new Date().toISOString(),
      })
      await appendLearning(repoKey(), entry)
      console.log('[harnessed] learning appended → .planning/LEARNINGS.md')
      process.exit(0)
    })
}
