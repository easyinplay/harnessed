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
const FRONT_MATTER_DOCS = ['README.md', 'PROJECT-SPEC.md']
const ROADMAP_LATEST_RE = /^##\s+v\d+\.\d+\.\d+\s+—.*✅\s*SHIPPED/m
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
  const m = roadmap.match(ROADMAP_LATEST_RE)
  return m ? m[0].match(/v\d+\.\d+\.\d+/)[0] : null
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
  const required = [milestone, subphase].filter(Boolean)
  if (!required.length) return
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
    for (const token of required)
      if (!match[1].includes(token))
        violations.push(
          `${file}:1  Status "${match[1].trim()}" missing latest shipped token "${token}"`,
        )
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
