// Phase 21 Wave 1 — `harnessed release-preflight`. Prints the read-only
// release-readiness checks and exits 1 if any fail (the "PR ready != release ready"
// gate). Mutates nothing — ship stops at tag-ready; publish.yml CI does the publish.
import type { Command } from 'commander'

export function registerReleasePreflight(program: Command): void {
  program
    .command('release-preflight')
    .description(
      'Read-only release-readiness gate (CHANGELOG / version / git-clean / tag). Exits 1 if not ready.',
    )
    .action(async () => {
      const { collectPreflight, anyFailed, defaultDeps } = await import(
        './lib/release-preflight.js'
      )
      const checks = collectPreflight(defaultDeps(process.cwd()))
      console.log('\n  release preflight (read-only — nothing is pushed/published):\n')
      for (const c of checks) {
        const mark = c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'
        console.log(`  ${mark} ${c.name} — ${c.message}`)
        if (c.status !== 'pass' && c.fix) console.log(`      fix: ${c.fix}`)
      }
      const failed = anyFailed(checks)
      console.log(
        failed
          ? '\n  NOT release-ready — resolve the failures above before tagging.'
          : '\n  release-ready — tag the version to trigger publish.yml.',
      )
      process.exit(failed ? 1 : 0)
    })
}
