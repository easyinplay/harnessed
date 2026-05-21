// Phase 3.1 W4 T4.4 — `harnessed resume` 12th CLI subcommand (R7.3 D-03 RELOAD).
// Sister: src/cli/doctor.ts L136-175 (--json flag + exit code pattern, PATTERNS § 1 #7 85% reuse).
// Dynamic import of runResume matches doctor.ts L131 lazy-load pattern (CI-friendly + smaller cold-start).

import type { Command } from 'commander'
import { t } from '../i18n/index.js'

export function registerResume(program: Command): void {
  program
    .command('resume')
    .description(
      'Reload checkpoint from paused workflow + print resume hint (D-03 — user invokes phase command manually)',
    )
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      const { runResume } = await import('../checkpoint/resume.js')
      const r = await runResume()
      if (opts.json) {
        console.log(JSON.stringify(r, null, 2))
        process.exit(r.status === 'ok' ? 0 : 1)
        return
      }
      if (r.status === 'no-paused-phase') {
        console.error(t('resume.fail', { error: r.error }))
        process.exit(1)
      }
      if (r.status === 'corrupt') {
        console.error(t('resume.corrupt', { error: r.error, path: r.path }))
        process.exit(1)
      }
      if (r.cwdWarn) console.error(r.cwdWarn)
      console.log(`phase: ${r.checkpoint.phase}`)
      console.log(`last_task: ${r.checkpoint.last_task}`)
      if (r.checkpoint.key_decisions.length) {
        console.log(`key_decisions: ${r.checkpoint.key_decisions.slice(0, 5).join(', ')}`)
      }
      if (r.checkpoint.canonical_refs.length) {
        console.log(`canonical_refs: ${r.checkpoint.canonical_refs.slice(0, 3).join(', ')}`)
      }
      console.log(r.resumeHint)
      process.exit(0)
    })
}
