// 4.22.2 — GateGuard `.gateguard.yml` exemption auto-fix (consented, default YES).
//
// Dual-guard conflict (4.22.1 detection sibling: check-guard-conflict.ts): the
// full gateguard-ai package blocks report/findings/summary/analysis Writes;
// harnessed's evidence guard REQUIRES those exact names. gateguard-ai's own
// config surface (`.gateguard.yml` → `ignore_paths`, upstream README) is the
// sanctioned resolution: exempt `.planning/**` — planning dirs are the
// legitimate home of findings.md / *-report.md, and root-level slop protection
// stays intact.
//
// User decisions (2026-07-05, task_plan D1-D6):
//   - confirm DEFAULT YES: narrow scope (one glob), backed-up, reversible, and
//     the only configuration where both co-installed guards work as designed.
//     (Default-No gets Enter'd past and the verify stage re-collides five times.)
//   - refusal must be LOUD: three concrete consequences + the exact manual
//     command; the doctor check stays `warn` until resolved (persistent nag).
//   - red line: NEVER silently rewrite a third-party guard config — backup
//     first, text-level append only (comments/formatting survive; the 4.16.0
//     messages-json wholesale-reserialize lesson), print the exact diff line
//     BEFORE consent.
//
// Own module (not new exports on check-guard-conflict.ts): checkpoint tests
// factory-mock that sibling with importOriginal; a fresh module keeps both
// mockable independently (mock-export-gap 教训).

import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir, rename } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { harnessedSubdir } from '../../installers/lib/harnessedRoot.js'

export const PLANNING_GLOB = '.planning/**'
export const MANUAL_FIX_CMD = 'harnessed exempt-gateguard'

// ── discovery ────────────────────────────────────────────────────────────────

export interface FindYmlDeps {
  cwd: string
  home: string
  exists: (p: string) => Promise<boolean>
}

function defaultFindDeps(): FindYmlDeps {
  return {
    cwd: process.cwd(),
    home: homedir(),
    exists: async (p) =>
      fsReadFile(p, 'utf8').then(
        () => true,
        () => false,
      ),
  }
}

/** Locate `.gateguard.yml` — project cwd first (gateguard-ai `init` writes it
 *  per-project), then the home dir. Null when neither exists (bundled ecc
 *  fact-force hook has no config file — different variant, no auto-fix). */
export async function findGateguardYml(deps: Partial<FindYmlDeps> = {}): Promise<string | null> {
  const d = { ...defaultFindDeps(), ...deps }
  for (const base of [d.cwd, d.home]) {
    const candidate = join(base, '.gateguard.yml')
    try {
      if (await d.exists(candidate)) return candidate
    } catch {
      // fail-soft — probe errors mean "not found here"
    }
  }
  return null
}

// ── idempotent text-level planner ────────────────────────────────────────────

export interface ExemptionPlan {
  action: 'skip' | 'append-entry' | 'append-section'
  /** Full new file text (absent for 'skip'). */
  newText?: string
  /** The exact line(s) that will be inserted (diff preview). */
  insertedLines: string[]
}

/** Plan the `.planning/**` exemption as a TEXT-LEVEL append (never a wholesale
 *  YAML re-serialize — user comments/ordering/quoting must survive verbatim).
 *  - glob already present anywhere → skip (conservative: a commented-out entry
 *    also skips; this is a warn-class fix, over-skipping is the safe direction).
 *  - `ignore_paths:` header present → insert the entry immediately AFTER the
 *    header line (list order is semantically free for globs).
 *  - no header → append a fresh section at EOF.
 *  EOL style (LF vs CRLF) is detected from the file and preserved. */
export function planExemption(raw: string): ExemptionPlan {
  const entryBare = `  - "${PLANNING_GLOB}"`
  if (raw.includes(PLANNING_GLOB)) return { action: 'skip', insertedLines: [] }

  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const headerRe = /^(ignore_paths[ \t]*:)[ \t]*$/m
  const m = headerRe.exec(raw)
  if (m && m.index !== undefined) {
    // insert right after the header line (before whatever followed it)
    const headerEnd = m.index + m[0].length
    // consume the EOL that terminates the header line, if present
    const afterHeader = raw.startsWith(eol, headerEnd) ? headerEnd + eol.length : headerEnd
    const newText = raw.slice(0, afterHeader) + entryBare + eol + raw.slice(afterHeader)
    return { action: 'append-entry', newText, insertedLines: [entryBare] }
  }

  const sep = raw.endsWith(eol) || raw.length === 0 ? '' : eol
  const section = `${sep}${eol}ignore_paths:${eol}${entryBare}${eol}`
  return {
    action: 'append-section',
    newText: raw + section,
    insertedLines: ['ignore_paths:', entryBare],
  }
}

// ── apply (backup first, atomic write) ───────────────────────────────────────

export type BackupResult = { status: 'ok'; path: string } | { status: 'warn'; message: string }

export interface ApplyDeps {
  readFile: (p: string) => Promise<string>
  writeFile: (p: string, text: string) => Promise<void>
  backup: (raw: string) => Promise<BackupResult>
}

/** Backup into the harnessed backups dir (same home as settingsWriter's
 *  settings.json backups — one place to look for every config harnessed ever
 *  touched). Timestamped, never overwritten. */
async function defaultBackup(raw: string): Promise<BackupResult> {
  const backupRoot = harnessedSubdir('backups')
  const ts = new Date().toISOString().replace(/:/g, '-')
  const backupPath = join(backupRoot, `gateguard.yml.${ts}.bak`)
  try {
    await mkdir(backupRoot, { recursive: true })
    await fsWriteFile(backupPath, raw, 'utf8')
    return { status: 'ok', path: backupPath }
  } catch (err) {
    return { status: 'warn', message: `backup ${backupPath} failed: ${(err as Error).message}` }
  }
}

/** Atomic tmp+rename (settingsWriter posture) — a crashed write must not leave
 *  a half-written third-party guard config behind. */
async function defaultWrite(p: string, text: string): Promise<void> {
  const tmp = join(dirname(p), `.gateguard.yml.${process.pid}.tmp`)
  await fsWriteFile(tmp, text, 'utf8')
  await rename(tmp, p)
}

function defaultApplyDeps(): ApplyDeps {
  return {
    readFile: (p) => fsReadFile(p, 'utf8'),
    writeFile: defaultWrite,
    backup: defaultBackup,
  }
}

export type ApplyResult =
  | { status: 'applied'; backupPath: string; insertedLines: string[] }
  | { status: 'already' }
  | { status: 'error'; message: string }

/** Backup-then-append. Refuses to proceed when the backup itself failed
 *  (D6 red line: no un-backed-up mutation of someone else's guard config). */
export async function applyExemption(
  ymlPath: string,
  deps: Partial<ApplyDeps> = {},
): Promise<ApplyResult> {
  const d = { ...defaultApplyDeps(), ...deps }
  try {
    const raw = await d.readFile(ymlPath)
    const plan = planExemption(raw)
    if (plan.action === 'skip') return { status: 'already' }
    const bk = await d.backup(raw)
    if (bk.status === 'warn') return { status: 'error', message: bk.message }
    await d.writeFile(ymlPath, plan.newText ?? raw)
    return { status: 'applied', backupPath: bk.path, insertedLines: plan.insertedLines }
  } catch (err) {
    return { status: 'error', message: (err as Error).message }
  }
}

// ── presentation ─────────────────────────────────────────────────────────────

/** Pre-consent transparency block: exact diff line(s), target file, backup home. */
export function previewLines(plan: ExemptionPlan, ymlPath: string): string[] {
  return [
    `[harnessed] GateGuard ↔ evidence-guard conflict — sanctioned fix available:`,
    `  file:   ${ymlPath}`,
    ...plan.insertedLines.map((l) => `  + ${l}`),
    `  backup: ${join(harnessedSubdir('backups'), 'gateguard.yml.<timestamp>.bak')} (written first)`,
  ]
}

/** D3 — the LOUD refusal block (also reused as non-interactive advice tail). */
export function refusalLines(): string[] {
  return [
    '',
    '⚠️  GateGuard exemption NOT applied — the dual-guard conflict remains:',
    '  • verify-stage artifacts (code-review-report.md, qa-report.md, security-audit-report.md,',
    '    paranoid-review-report.md, multispec-review-report.md) will be blocked at Write',
    '  • subagents have no fact-retry channel — they will rename artifacts and every',
    '    `checkpoint complete` will fail-closed block on the missing contract names',
    `  • fix anytime: \`${MANUAL_FIX_CMD}\` (or add ".planning/**" to ignore_paths in your GateGuard config)`,
    '  harnessed doctor will keep warning until this is resolved.',
    '',
  ]
}

// ── orchestrator (shared by `checkpoint start` pre-check and the CLI command) ─

export interface FlowDeps extends ApplyDeps {
  findYml: () => Promise<string | null>
  print: (line: string) => void
  /** Interactive consent (default YES at the prompt layer). Absent = non-interactive. */
  confirm?: () => Promise<boolean>
}

export type FlowResult = 'no-yml' | 'already' | 'applied' | 'declined' | 'advised' | 'error'

export async function runExemptionFlow(deps: Partial<FlowDeps> = {}): Promise<FlowResult> {
  const d: FlowDeps = {
    ...defaultApplyDeps(),
    findYml: () => findGateguardYml(),
    print: (line) => console.error(line),
    ...deps,
  }
  try {
    const ymlPath = await d.findYml()
    if (!ymlPath) return 'no-yml'

    const raw = await d.readFile(ymlPath)
    const plan = planExemption(raw)
    if (plan.action === 'skip') return 'already'

    for (const line of previewLines(plan, ymlPath)) d.print(line)

    if (!d.confirm) {
      // Non-interactive caller: advise, never mutate without live consent.
      d.print(`  non-interactive session — run \`${MANUAL_FIX_CMD}\` to apply this fix.`)
      return 'advised'
    }

    const yes = await d.confirm()
    if (!yes) {
      for (const line of refusalLines()) d.print(line)
      return 'declined'
    }

    const r = await applyExemption(ymlPath, d)
    if (r.status === 'applied') {
      d.print(`✓ [harnessed] exempted "${PLANNING_GLOB}" in ${ymlPath} (backup: ${r.backupPath})`)
      return 'applied'
    }
    if (r.status === 'already') return 'already'
    d.print(`⚠️ [harnessed] exemption failed: ${r.message} — apply manually: \`${MANUAL_FIX_CMD}\``)
    return 'error'
  } catch (err) {
    d.print(`⚠️ [harnessed] exemption flow error: ${(err as Error).message}`)
    return 'error'
  }
}
