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
      'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget / Agent Teams / planning-with-files / mattpocock-skills / MCP availability / ECC)',
    )
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      // Run all checks in parallel (no data deps between them). Order preserved
      // for human-readable output per doctor.test.ts cell-1+4+5 expectations.
      // 4.32.23 — allSettled, not all: readClaudeConfig deliberately re-throws
      // non-ENOENT read errors (EACCES / EISDIR), so one unlucky check used to
      // abort `doctor` with a bare stack trace and discard every other result.
      // A crashed check degrades to its own warn row; the rest still report.
      const settled = await Promise.allSettled(CHECKS.map((c) => c()))
      const results: CheckResult[] = settled.map((s, i) =>
        s.status === 'fulfilled'
          ? s.value
          : {
              name: `check #${i + 1}`,
              status: 'warn' as const,
              message: `check crashed: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
              fix: 'this check was skipped; the other checks above are unaffected',
            },
      )
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
