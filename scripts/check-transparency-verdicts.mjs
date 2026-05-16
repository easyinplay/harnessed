#!/usr/bin/env node
// Phase 2.1 T1.7 — transparency verdict-marker gate (ADR 0010 § Decision, D2.1-7/8).
// Scans .planning verdict docs (PLAN-CHECK.md / *-AUDIT.md / VERIFICATION.md) for
// marker lines (`Verdict:` / `状态:` / `Closure:`, tolerating 0-2 markdown bold `*`).
// A marker line must carry an N/N ratio AND a `miss:` declaration; else it's flagged.
// See docs/TRANSPARENCY-VERDICT-CHECKLIST.md for the full convention.
//
// W3: warn-only round 1; flip to true in phase 2.2.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ENFORCE = true
const ROOT = '.planning'
const MARKER = /^\s*\*{0,2}(?:Verdict|状态|Closure)\*{0,2}\s*[:：]/
const HAS_RATIO = /\d+\s*\/\s*\d+/
const HAS_MISS = /miss\s*[:：]/i
// Phase 2.2 T0.4 — front-matter Status: freshness gate (B-16/B-17 + RESEARCH § 3.5)
// Phase 2.2 post-ship hardening — extended to dual-token (milestone + sub-phase) per
// T0.1 original intent (Wave 0 implementation was milestone-only — caught by sister review).
const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m
// Phase 2.3 W6 T-W6-1 (sister review backlog absorb) — STATE.md added to close
// Phase 2.2 T0.4 freshness gate blind spot: STATE.md L4 "最后更新" was stale
// 2026-05-15 → 2026-05-16 without being caught by this gate (sister review H1).
// FRONT_MATTER_DOCS is the canonical scan list for freshness Status: markers.
const FRONT_MATTER_DOCS = ['README.md', 'PROJECT-SPEC.md', '.planning/STATE.md']
// Phase 2.4 ship post-mortem sister review H2 fix: was `m`-flag `.match()` returning FIRST
// shipped (= v0.1.0 oldest since ROADMAP order ASC), not latest. Now matchAll + capture + last.
const ROADMAP_SHIPPED_RE = /^##\s+(v\d+\.\d+\.\d+)\s+—.*✅\s*SHIPPED/gm
const STATE_LATEST_SUBPHASE_RE = /\*{2}Phase\s+(\d+\.\d+)\s+SHIPPED\*{2}/g

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/PLAN-CHECK\.md$|-AUDIT\.md$|VERIFICATION\.md$/.test(name)) out.push(p)
  }
  return out
}

function getLatestShippedToken() {
  const roadmap = readFileSync('.planning/ROADMAP.md', 'utf8')
  const matches = [...roadmap.matchAll(ROADMAP_SHIPPED_RE)]
  return matches.length ? matches[matches.length - 1][1] : null
}

function getLatestShippedSubphase() {
  const state = readFileSync('.planning/STATE.md', 'utf8')
  const matches = [...state.matchAll(STATE_LATEST_SUBPHASE_RE)].map((m) => m[1])
  if (!matches.length) return null
  return `Phase ${matches.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0]}`
}

function checkFreshness(violations) {
  const milestone = getLatestShippedToken()
  const subphase = getLatestShippedSubphase()
  if (!milestone && !subphase) return
  for (const file of FRONT_MATTER_DOCS) {
    let head
    try {
      head = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 50).join('\n')
    } catch {
      violations.push(`${file}:0  front-matter doc missing`)
      continue
    }
    const match = head.match(STATUS_MARKER)
    if (!match) {
      violations.push(`${file}:1  missing Status: marker in first 50 lines`)
      continue
    }
    // Phase 2.4 ship post-mortem sister review H2 fix: substring includes() was too weak —
    // "Next: Phase X.Y" or "Next: vX.Y.Z" satisfied token requirement by accident, silent PASS.
    // Now: milestone needs SHIPPED/MILESTONE/ARCHIVED context; subphase needs literal `**Phase X.Y SHIPPED`.
    const content = match[1]
    if (milestone) {
      const ctx = new RegExp(
        `${milestone.replace(/\./g, '\\.')}[^\\n]{0,80}?(SHIPPED|MILESTONE|ARCHIVED)`,
        'i',
      )
      if (!ctx.test(content))
        violations.push(
          `${file}:1  Status "${content.trim().slice(0, 80)}..." missing milestone "${milestone}" in SHIPPED/MILESTONE/ARCHIVED context`,
        )
    }
    if (subphase) {
      const lit = `**${subphase} SHIPPED`
      if (!content.includes(lit))
        violations.push(
          `${file}:1  Status "${content.trim().slice(0, 80)}..." missing subphase literal "${lit}"`,
        )
    }
  }
}

const violations = []
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    if (MARKER.test(line) && !(HAS_RATIO.test(line) && HAS_MISS.test(line)))
      violations.push(`${file}:${i + 1}  ${line.trim()}`)
  })
}
checkFreshness(violations)

if (violations.length > 0) {
  console.warn(
    `[transparency-verdicts] ${violations.length} marker line(s) missing N/N ratio + miss: declaration:`,
  )
  for (const v of violations) console.warn(`  ${v}`)
  console.warn('See docs/TRANSPARENCY-VERDICT-CHECKLIST.md for the marker convention.')
  process.exit(ENFORCE ? 1 : 0)
}
console.log('[transparency-verdicts] all verdict marker lines compliant.')
