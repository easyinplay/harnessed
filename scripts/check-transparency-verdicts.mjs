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

const ENFORCE = false
const ROOT = '.planning'
const MARKER = /^\s*\*{0,2}(?:Verdict|状态|Closure)\*{0,2}\s*[:：]/
const HAS_RATIO = /\d+\s*\/\s*\d+/
const HAS_MISS = /miss\s*[:：]/i

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/PLAN-CHECK\.md$|-AUDIT\.md$|VERIFICATION\.md$/.test(name)) out.push(p)
  }
  return out
}

const violations = []
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    if (MARKER.test(line) && !(HAS_RATIO.test(line) && HAS_MISS.test(line)))
      violations.push(`${file}:${i + 1}  ${line.trim()}`)
  })
}

if (violations.length > 0) {
  console.warn(
    `[transparency-verdicts] ${violations.length} marker line(s) missing N/N ratio + miss: declaration:`,
  )
  for (const v of violations) console.warn(`  ${v}`)
  console.warn('See docs/TRANSPARENCY-VERDICT-CHECKLIST.md for the marker convention.')
  process.exit(ENFORCE ? 1 : 0)
}
console.log('[transparency-verdicts] all verdict marker lines compliant.')
