// Phase 1.2 cli subcommand `doctor` per PLAN § 4.1 acceptance B8' + ASSUMPTIONS B4 候选 1 + C4.
// v3.7.0 Phase 1 — refactored to thin dispatcher (≤100L, well within B-03 ≤225L hard limit).
// All checks live in `src/cli/lib/check-*.ts` helper files; CHECKS array is single source
// of truth (`src/cli/lib/doctor-registry.ts`). Adding a check: see registry header.
//
// v16.0 Phase 66 T5 — host-aware dispatch on top of the registry descriptors:
//   `doctor`                 every check, active harness (DEFAULT — unchanged surface)
//   `doctor --host <id>`     only the checks declaring <id>, resolved AS <id>
//   `doctor --matrix`        every check × every harness, one status per cell
//
// The DEFAULT deliberately does NOT filter by host. A filtered default would make
// rows vanish from the command people actually run day to day (`codex hook plugins`
// off a claude machine), and a row that says "does not apply here" is worth its one
// line. The only visible change to the default is the leading mark: a host
// early-return now prints `-` (skipped) instead of a `✓` it never earned. Exit code
// policy is untouched — only `fail` exits 1.
//
// `--host` reaches the checks the same way `setup --platform` does: by setting
// `HARNESSED_PLATFORM` for the run (ADR 0040 precedence rule 1), so every
// descriptor-backed resolver (getSettingsPath / getSkillsDir / getPluginsRegistry)
// answers for the requested harness. Nothing is persisted — no `.platform` pin.
// The matrix therefore runs its hosts SEQUENTIALLY (one process-wide env var), while
// the checks WITHIN a host still fan out through Promise.allSettled.

import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import {
  type CheckStatus,
  type DoctorMatrix,
  type MatrixCell,
  renderMatrix,
  summarise,
} from './lib/doctor-matrix.js'
import {
  ALL_HOSTS,
  CHECKS,
  type CheckDescriptor,
  type CheckResult,
  checksForHost,
} from './lib/doctor-registry.js'
import type { HostId } from './lib/hostPrimitives.js'

const MARKS: Record<CheckStatus, string> = { pass: '✓', warn: '⚠', fail: '✗', skipped: '-' }

/**
 * Dispatch `checks`, degrading a crashed check to its own warn row.
 *
 * 4.32.23 — allSettled, not all: readClaudeConfig deliberately re-throws
 * non-ENOENT read errors (EACCES / EISDIR), so one unlucky check used to abort
 * `doctor` with a bare stack trace and discard every other result. Phase 66 T5
 * keeps that contract intact — the descriptor's declared `name` now labels the
 * degraded row, which beats the old positional `check #N`.
 */
async function runChecks(checks: readonly CheckDescriptor[]): Promise<CheckResult[]> {
  const settled = await Promise.allSettled(checks.map((c) => c.fn()))
  return settled.map((s, i) =>
    s.status === 'fulfilled'
      ? s.value
      : {
          name: checks[i]?.name ?? `check #${i + 1}`,
          status: 'warn' as const,
          message: `check crashed: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
          fix: 'this check was skipped; the other checks above are unaffected',
        },
  )
}

/** Run `checks` with the harness forced to `host` for the duration, then restore. */
async function runAsHost(host: HostId, checks: readonly CheckDescriptor[]): Promise<CheckResult[]> {
  const prev = process.env.HARNESSED_PLATFORM
  process.env.HARNESSED_PLATFORM = host
  try {
    return await runChecks(checks)
  } finally {
    if (prev === undefined) delete process.env.HARNESSED_PLATFORM
    else process.env.HARNESSED_PLATFORM = prev
  }
}

/** Build the check × host matrix, one host at a time (env var is process-wide). */
async function buildMatrix(): Promise<DoctorMatrix> {
  const perHost = new Map<HostId, Map<string, MatrixCell>>()
  const summary = {} as Record<HostId, ReturnType<typeof summarise>>
  for (const host of ALL_HOSTS) {
    const applicable = checksForHost(host)
    const results = await runAsHost(host, applicable)
    perHost.set(
      host,
      new Map(
        results.map((r, i) => [
          applicable[i]?.name ?? r.name,
          { status: r.status, message: r.message, ...(r.fix ? { fix: r.fix } : {}) },
        ]),
      ),
    )
    summary[host] = summarise(results)
  }
  return {
    hosts: ALL_HOSTS,
    checks: CHECKS.map((c) => ({
      name: c.name,
      hosts: c.hosts,
      cells: Object.fromEntries(
        ALL_HOSTS.map((h) => [h, perHost.get(h)?.get(c.name) ?? null]),
      ) as Record<HostId, MatrixCell | null>,
    })),
    summary,
  }
}

/** Human-readable check list — the pre-Phase-66 rendering, plus the `-` mark. */
function printList(results: readonly CheckResult[]): void {
  for (const r of results) {
    console.log(`${MARKS[r.status]} ${r.name} — ${r.message}`)
    if (r.status !== 'pass' && r.status !== 'skipped' && r.fix) console.log(`    fix: ${r.fix}`)
  }
}

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description(
      'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget / Agent Teams / planning-with-files / mattpocock-skills / MCP availability / ECC / plugin freshness / codex hooks)',
    )
    .option('--json', 'output JSON instead of human-readable')
    .option(
      '--host <id>',
      `run only the checks that apply to one harness (${ALL_HOSTS.join(' | ')}), resolved as that harness`,
    )
    .option('--matrix', 'report every check against every harness (check × host table)')
    .action(async (opts: { json?: boolean; host?: string; matrix?: boolean }) => {
      if (opts.matrix && opts.host !== undefined) {
        console.error('--matrix and --host are mutually exclusive (--matrix covers every host)')
        process.exit(2)
      }
      if (opts.matrix) {
        const matrix = await buildMatrix()
        if (opts.json) console.log(JSON.stringify({ matrix }, null, 2))
        else console.log(renderMatrix(matrix, t('doctor.matrix.legend')))
        process.exit(ALL_HOSTS.some((h) => matrix.summary[h] === 'fail') ? 1 : 0)
      }

      let host: HostId | null = null
      if (opts.host !== undefined) {
        if (!(ALL_HOSTS as readonly string[]).includes(opts.host)) {
          console.error(
            `--host: unknown id '${opts.host}' (expected one of: ${ALL_HOSTS.join(' | ')})`,
          )
          process.exit(2)
        }
        host = opts.host as HostId
      }

      // Default (no --host): every check, active harness — byte-identical surface
      // to pre-Phase-66 apart from the `-` mark on a host early-return.
      const checks = host === null ? CHECKS : checksForHost(host)
      const results = host === null ? await runChecks(checks) : await runAsHost(host, checks)
      const summary = summarise(results)
      if (opts.json) {
        console.log(JSON.stringify({ host, checks: results, summary }, null, 2))
      } else {
        if (host !== null) {
          console.log(
            t('doctor.host_scope', { host, applied: checks.length, total: CHECKS.length }),
          )
        }
        printList(results)
        console.log(
          summary === 'fail'
            ? t('doctor.summary.fail')
            : summary === 'warn'
              ? t('doctor.summary.warn')
              : t('doctor.summary.pass'),
        )
      }
      process.exit(summary === 'fail' ? 1 : 0) // B-06: warn ≠ fail (advisory only)
    })
}
