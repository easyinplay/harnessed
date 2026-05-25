// Phase 1.2 cli subcommand `doctor` per PLAN § 4.1 acceptance B8' + ASSUMPTIONS B4 候选 1 + C4.
// v3.7.0 Phase 1 — refactored to thin dispatcher (≤100L, well within B-03 ≤225L hard limit).
// All checks live in `src/cli/lib/check-*.ts` helper files; CHECKS array is single source
// of truth (`src/cli/lib/doctor-registry.ts`). Adding a check: see registry header.

import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { CHECKS, type CheckResult } from './lib/doctor-registry.js'

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description(
      'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget / Agent Teams / planning-with-files / mattpocock-skills / MCP availability)',
    )
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      // Run all checks in parallel (no data deps between them). Order preserved
      // for human-readable output per doctor.test.ts cell-1+4+5 expectations.
      const results: CheckResult[] = await Promise.all(CHECKS.map((c) => c()))
      const hasFail = results.some((r) => r.status === 'fail')
      const hasWarn = results.some((r) => r.status === 'warn')
      if (opts.json) {
        console.log(
          JSON.stringify(
            { checks: results, summary: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass' },
            null,
            2,
          ),
        )
      } else {
        for (const r of results) {
          const mark = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
          console.log(`${mark} ${r.name} — ${r.message}`)
          if (r.status !== 'pass' && r.fix) console.log(`    fix: ${r.fix}`)
        }
        console.log(
          hasFail
            ? t('doctor.summary.fail')
            : hasWarn
              ? t('doctor.summary.warn')
              : t('doctor.summary.pass'),
        )
      }
      process.exit(hasFail ? 1 : 0) // B-06: warn ≠ fail (advisory only)
    })
}
