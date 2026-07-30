// T2.5 — `harnessed check-docs`: the SHIPPED documentation-discipline gate.
//
// WHY THIS IS IN src/ AND NOT scripts/ (the whole point of this subcommand):
// the only hard doc-discipline gate this repo had was scripts/check-state-archive-
// stale.mjs, and `scripts/` is absent from package.json `files` — so a user who
// `npm i -g harnessed` got NO documentation gate at all. The discipline layer that
// was supposed to cover it (src/discipline/enforcement/*) never fired in the real
// orchestration path. Rules therefore live here, ship inside dist/, and are
// reachable both by hand (`harnessed check-docs`) and by an opt-in CC hook
// (manifests/optional/doc-discipline-gate.yaml).
//
// Rule semantics are PORTED, not invented: thresholds / the 关键决议-section limit /
// the historical-errata literal come from scripts/check-state-archive-stale.mjs
// (Rules 1-3), and the tiering comes from workflows/disciplines/doc-discipline.yaml
// `enforcement` fields (state-digest-line-limit = halt; everything else = warn).
// scripts/ deliberately keeps its own copy — see the drift-alarm test in
// tests/cli/check-docs.test.ts for the rationale.
//
// EXIT CODES — the CLI's exit code IS the hook contract, no glue script needed:
//   0  clean (or nothing to check)
//   1  warn-tier only            → PreToolUse: advisory, stderr to the user
//   2  any halt-tier violation   → PreToolUse: BLOCKS the call, stderr to the model
// Violations print to stderr (so a hook surfaces them); --json prints to stdout.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'

/** doc-discipline.yaml `enforcement` mapped onto the two hook-visible outcomes. */
export type DocRuleTier = 'halt' | 'warn'

export interface DocViolation {
  rule: string
  tier: DocRuleTier
  /** repo-relative path, forward slashes (stable across platforms + in --json). */
  file: string
  /** 1-based line number when the rule is line-anchored. */
  line?: number
  message: string
}

export interface DocCheckOptions {
  /** repo root holding .planning/ (cwd-relative, sister src/checkpoint/planningScan.ts). */
  cwd: string
  /** STATE.md digest ceiling. Default = doc-discipline.yaml's declared 100. */
  maxStateLines?: number
  /** doc-discipline.yaml documented escape hatch (HARNESSED_ALLOW_LONG_STATE=1). */
  allowLongState?: boolean
}

/** doc-discipline.yaml `state-digest-line-limit`: ">100 lines triggers halt".
 *
 *  DO NOT "unify" this with the 150 in scripts/check-state-archive-stale.mjs —
 *  the two numbers are a deliberate division of labour, not a drift:
 *    - 100 here = the SHIPPED default, and it MUST equal the bundled
 *      workflows/disciplines/doc-discipline.yaml value, because that yaml is the
 *      only rule source a plain user can read (they do not have the author's
 *      ~/.claude/CLAUDE.md). A user reading 100 while the tool enforces 150
 *      would be a fresh doc↔code contradiction.
 *    - 150 in the gate script = this repo's own tightening cadence, repo-local.
 *  Any repo (including this one) declares its own ceiling via --max-state-lines;
 *  a stricter local gate on top of the shipped floor is the intended shape. */
export const DEFAULT_MAX_STATE_LINES = 100

/** Rule 2 constants, verbatim from scripts/check-state-archive-stale.mjs. */
export const KEY_DECISIONS_SECTION_RE = /^##\s+.*关键决议\s*ship\s*总结/gm
export const KEY_DECISIONS_SECTION_LIMIT = 1

/** Rule 3 literal, verbatim from scripts/check-state-archive-stale.mjs. */
export const HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/

/** doc-discipline.yaml `overview-pointer-no-inline-narrative`: an overview doc
 *  carries one line + a pointer per phase; closing narrative (commit / test tally /
 *  CI verdict / lesson) belongs in SUMMARY / VERIFICATION. These are the
 *  deterministic signals of that narrative having leaked into ROADMAP.md.
 *
 *  Deliberately NOT a signal: an `ADR-0030`-style reference. It looks like
 *  closing narrative but it IS a pointer — precisely the shape this rule wants
 *  an overview doc to use — so flagging it would punish the correct behaviour and
 *  invert the rule's intent. Do not add it back. */
const ROADMAP_NARRATIVE_SIGNALS: readonly { id: string; test: (line: string) => boolean }[] = [
  { id: 'commit-hash', test: hasCommitHash },
  { id: 'test-tally', test: (l) => /\b\d{2,}\s*\/\s*0\b/.test(l) },
  { id: 'ci-verdict', test: (l) => /\bCI\s+(green|red|绿|红)/i.test(l) },
  { id: 'lesson', test: (l) => /(教训|lesson\s*[:：]|lessons?\s+learned)/i.test(l) },
]

/** A bare hex run is only a commit ref when it mixes digits AND a-f — that
 *  rejects dates/version digits ("2026", "43221") and a-f-only English words. */
function hasCommitHash(line: string): boolean {
  for (const m of line.matchAll(/\b[0-9a-f]{7,40}\b/g)) {
    if (/\d/.test(m[0]) && /[a-f]/.test(m[0])) return true
  }
  return false
}

function read(cwd: string, rel: string): string | null {
  const p = join(cwd, rel)
  if (!existsSync(p)) return null
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return null // unreadable → not a discipline violation (fail-soft)
  }
}

/** Content lines, ignoring a single trailing newline (sister before-commit.ts). */
function contentLines(content: string): string[] {
  const lines = content.split(/\r?\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** Pure over the fs read: every rule against .planning/STATE.md + ROADMAP.md.
 *  A missing file yields no violations — absence is not a discipline breach. */
export function collectDocViolations(opts: DocCheckOptions): DocViolation[] {
  const limit = opts.maxStateLines ?? DEFAULT_MAX_STATE_LINES
  const out: DocViolation[] = []

  const state = read(opts.cwd, join('.planning', 'STATE.md'))
  if (state !== null) {
    const lines = contentLines(state)

    // Rule 1 (halt) — STATE.md is a digest, not an archive.
    if (lines.length > limit && !opts.allowLongState) {
      out.push({
        rule: 'state-digest-line-limit',
        tier: 'halt',
        file: '.planning/STATE.md',
        message: t('check_docs.state_line_limit', { lines: lines.length, limit }),
      })
    }

    // Rule 2 (warn) — only the current 关键决议 ship 总结 stays in the digest.
    const sections = state.match(KEY_DECISIONS_SECTION_RE) ?? []
    if (sections.length > KEY_DECISIONS_SECTION_LIMIT) {
      out.push({
        rule: 'state-key-decisions-section-limit',
        tier: 'warn',
        file: '.planning/STATE.md',
        message: t('check_docs.state_key_decisions', {
          count: sections.length,
          limit: KEY_DECISIONS_SECTION_LIMIT,
        }),
      })
    }

    // Rule 3 (warn) — historical errata commentary belongs in RETROSPECTIVE.md.
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (HISTORICAL_ERRATA_RE.test(line)) {
        out.push({
          rule: 'state-historical-errata',
          tier: 'warn',
          file: '.planning/STATE.md',
          line: i + 1,
          message: t('check_docs.state_errata', { excerpt: line.trim().slice(0, 80) }),
        })
      }
    }
  }

  // Rule 4 (warn) — ROADMAP.md is a pointer index, not a narrative log.
  const roadmap = read(opts.cwd, join('.planning', 'ROADMAP.md'))
  if (roadmap !== null) {
    const lines = contentLines(roadmap)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const hits = ROADMAP_NARRATIVE_SIGNALS.filter((s) => s.test(line)).map((s) => s.id)
      if (hits.length > 0) {
        out.push({
          rule: 'roadmap-no-inline-narrative',
          tier: 'warn',
          file: '.planning/ROADMAP.md',
          line: i + 1,
          message: t('check_docs.roadmap_narrative', { signals: hits.join(', ') }),
        })
      }
    }
  }

  return out
}

export function exitCodeFor(violations: readonly DocViolation[]): 0 | 1 | 2 {
  if (violations.some((v) => v.tier === 'halt')) return 2
  return violations.length > 0 ? 1 : 0
}

/** PreToolUse payload gate: only a `git commit` Bash call is a commit-layer
 *  event (doc-discipline.yaml enforcement_layer: commit). Anything else — other
 *  tools, other Bash commands, malformed/empty stdin — exits the hook silently.
 *  Fail-soft by construction: a hook must never wedge the session on garbage. */
export function shouldGateForHookPayload(raw: string): boolean {
  if (!raw.trim()) return false
  let payload: { tool_name?: unknown; tool_input?: { command?: unknown } }
  try {
    payload = JSON.parse(raw)
  } catch {
    return false
  }
  if (payload?.tool_name !== 'Bash') return false
  const cmd = payload.tool_input?.command
  return typeof cmd === 'string' && /\bgit\s+(?:-\S+\s+)*commit\b/.test(cmd)
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  try {
    const chunks: Buffer[] = []
    for await (const c of process.stdin) chunks.push(c as Buffer)
    return Buffer.concat(chunks).toString('utf8')
  } catch {
    return ''
  }
}

export function registerCheckDocs(program: Command): void {
  program
    .command('check-docs')
    .description(
      'Documentation-discipline gate over .planning/ (STATE digest limit + archive cadence + ROADMAP pointer-not-narrative). Exits 2 on a blocking violation, 1 on advisory-only.',
    )
    .option('--json', 'output JSON instead of human-readable')
    .option('--cwd <dir>', 'repo root holding .planning/ (default: current directory)')
    .option('--max-state-lines <n>', `STATE.md digest ceiling (default ${DEFAULT_MAX_STATE_LINES})`)
    .option('--hook', 'PreToolUse mode: read the tool payload on stdin, gate only git commit')
    .action(
      async (opts: { json?: boolean; cwd?: string; maxStateLines?: string; hook?: boolean }) => {
        if (opts.hook && !shouldGateForHookPayload(await readStdin())) process.exit(0)

        const parsed = Number(opts.maxStateLines)
        const violations = collectDocViolations({
          cwd: opts.cwd ?? process.cwd(),
          ...(Number.isFinite(parsed) && parsed > 0 ? { maxStateLines: parsed } : {}),
          allowLongState: !!process.env.HARNESSED_ALLOW_LONG_STATE,
        })
        const code = exitCodeFor(violations)
        const summary = code === 2 ? 'halt' : code === 1 ? 'warn' : 'pass'

        if (opts.json) {
          console.log(JSON.stringify({ violations, summary, exit_code: code }, null, 2))
        } else if (violations.length === 0) {
          console.log(t('check_docs.clean'))
        } else {
          for (const v of violations) {
            const where = v.line === undefined ? v.file : `${v.file}:${v.line}`
            console.error(`${v.tier === 'halt' ? '✗' : '⚠'} ${where} [${v.rule}] ${v.message}`)
          }
          console.error(
            code === 2
              ? t('check_docs.summary_halt', {
                  halt: violations.filter((v) => v.tier === 'halt').length,
                  warn: violations.filter((v) => v.tier === 'warn').length,
                })
              : t('check_docs.summary_warn', { warn: violations.length }),
          )
        }
        process.exit(code)
      },
    )
}
