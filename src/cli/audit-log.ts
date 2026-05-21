// Phase 5.1 W1 T1.1 — R10.1 audit log --filter consumer (registerAuditLog).
// D-01: jq subprocess spawn (shell:false, argv-mode, STRIDE T mitigation).
// D-02: dual format — default human table 5-col + --json full 12-field opt-in.
// D-03: pagination: --tail N (default 50) + --head N + --reverse.
// D-04: consumer 2nd-layer redact 5 patterns (defense-in-depth, CSO gate).
// Sister: src/cli/doctor.ts register + ExitError + flag validation pattern.
// Karpathy hard limit ≤200L.

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import type { Command } from 'commander'
import type { AuditRecord } from '../audit/log.js'
import { t } from '../i18n/index.js'
import { harnessedFile } from '../installers/lib/harnessedRoot.js'

// v3.0.3 — homedir-rooted via harnessedRoot SoT (sister src/audit/log.ts).
function auditPath(): string {
  return harnessedFile('audit.log')
}

// D-04: pre-compile at module load (NOT inside loop per PLAN sneak-block).
// Apply to task_excerpt field only (other fields are structured IDs/enums/timestamps).
// Pipeline order: paginate → redact → jq → render (redact LAST per RESEARCH § 2.2).
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key=[REDACTED]'],
  [/\btoken\s*[:=]\s*\S+/gi, 'token=[REDACTED]'],
  [/\bpassword\s*[:=]\s*\S+/gi, 'password=[REDACTED]'],
  [/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: Bearer [REDACTED]'],
  [/\b(sk-|pk-|gh_|ghp_|ya29\.|AIza)[A-Za-z0-9_\-.]{4,}/g, '[REDACTED]'],
]

function redact(s: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), s)
}

function redactRecord(r: AuditRecord): AuditRecord {
  return { ...r, task_excerpt: redact(r.task_excerpt) }
}

function renderHumanTable(records: AuditRecord[]): void {
  // 5-col: ts(19) | phase(6) | category(11) | matched_rule_id(20) | outcome
  const header = `${'ts'.padEnd(19)} | ${'phase'.padEnd(6)} | ${'category'.padEnd(11)} | ${'matched_rule_id'.padEnd(20)} | outcome`
  const sep = `${'-'.repeat(19)}-+-${'-'.repeat(6)}-+-${'-'.repeat(11)}-+-${'-'.repeat(20)}-+--------`
  console.log(header)
  console.log(sep)
  for (const r of records) {
    const ts = r.ts.slice(0, 19)
    const phase = r.phase.padEnd(6)
    const cat = r.category.padEnd(11)
    const rule = (r.matched_rule_id ?? 'null').padEnd(20)
    console.log(`${ts} | ${phase} | ${cat} | ${rule} | ${r.outcome}`)
  }
}

function pipeToJq(filterExpr: string, lines: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    // D-01: spawn with shell:false (default) — argv-mode immune to shell injection (STRIDE T).
    const child = spawn('jq', [filterExpr], {
      stdio: ['pipe', 'inherit', 'inherit'],
      windowsHide: true,
    })
    // Handle jq absent (ENOENT) — actionable error per doctor.ts jq check pattern.
    child.on('error', (err) => {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') {
        console.error(t('audit_log.jq_missing'))
        resolve(1)
      } else {
        reject(err)
      }
    })
    child.on('close', (code) => resolve(code ?? 0))
    child.stdin.write(lines.join('\n'))
    child.stdin.end()
  })
}

export function registerAuditLog(program: Command): void {
  program
    .command('audit-log')
    .description(
      'Query routing audit log (<harnessed-root>/audit.log) with optional jq filter (R10.1)',
    )
    .option('--filter <expr>', 'jq filter expression (e.g. \'.category=="engineering"\')')
    .option('--tail <n>', 'show N most recent records (default 50)', '50')
    .option('--head <n>', 'show N oldest records (--head takes priority over --tail)')
    .option('--reverse', 'flip output order')
    .option('--json', 'output full 12-field JSON instead of human table')
    .action(
      async (opts: {
        filter?: string
        tail?: string
        head?: string
        reverse?: boolean
        json?: boolean
      }) => {
        // H1 gate: validate pagination flags before any I/O (sister doctor.ts pattern).
        const tailN = opts.tail !== undefined ? Number(opts.tail) : 50
        if (Number.isNaN(tailN) || tailN < 1) {
          console.error(t('audit_log.tail_invalid'))
          process.exit(2)
        }
        const headN = opts.head !== undefined ? Number(opts.head) : undefined
        if (headN !== undefined && (Number.isNaN(headN) || headN < 1)) {
          console.error(t('audit_log.head_invalid'))
          process.exit(2)
        }

        // Read audit.log — SoT-derived path (STRIDE T: no derivation from user input).
        const path = auditPath()
        if (!existsSync(path)) {
          console.log(t('audit_log.no_records_file', { path }))
          process.exit(0)
        }

        const raw = readFileSync(path, 'utf8')
        const lines = raw
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0)

        if (lines.length === 0) {
          console.log(t('audit_log.no_records_empty'))
          process.exit(0)
        }

        // Parse records; skip malformed lines silently.
        let records: AuditRecord[] = []
        for (const line of lines) {
          try {
            records.push(JSON.parse(line) as AuditRecord)
          } catch {
            // skip malformed line
          }
        }

        // D-03: pagination — --head takes priority over --tail per PLAN must_haves.
        if (headN !== undefined) {
          records = records.slice(0, headN)
        } else {
          records = records.slice(-tailN)
        }

        // D-03: --reverse flips output order.
        if (opts.reverse) records = records.reverse()

        // D-04: redact task_excerpt BEFORE any output (apply last in pipeline per RESEARCH § 2.2).
        records = records.map(redactRecord)

        // D-01: --filter → pipe redacted JSONL through jq subprocess.
        if (opts.filter) {
          // jq absent → actionable error (sister doctor.ts jq check pattern).
          const redactedLines = records.map((r) => JSON.stringify(r))
          const exitCode = await pipeToJq(opts.filter, redactedLines)
          process.exit(exitCode)
        }

        // D-02: output format.
        if (opts.json) {
          for (const r of records) {
            console.log(JSON.stringify(r, null, 2))
          }
        } else {
          renderHumanTable(records)
        }

        process.exit(0)
      },
    )
}
