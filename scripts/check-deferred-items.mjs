#!/usr/bin/env node
// Phase 2.3 Wave 0 T5 (T0.8) — deferred-items review cadence gate (warn-only round 1).
// 沿袭 check-transparency-verdicts.mjs walker pattern (Phase 2.1 T1.7 ship).
// 沿袭 W3 warn-only round 1 模式 (Phase 2.2 W3 ENFORCE flip 前置 = 1 phase warn cadence).
// D-OOS-1 .omc/ 2026-05-13 → 2026-05-15 三 phase 未 review 是 process bug 根因.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ENFORCE = false // warn-only round 1 (Phase 2.3 起 cadence; Phase 2.4+ 评估 flip)
const ROOT = '.planning'

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    let s
    try {
      s = statSync(p)
    } catch {
      continue
    }
    if (s.isDirectory()) walk(p, out)
    else if (/deferred-items\.md$|DEFERRED.*\.md$/i.test(name)) out.push(p)
  }
  return out
}

const violations = []
// Check 1: RETROSPECTIVE.md must include cadence section (Phase 2.3 W0 T0.8 起每 ship phase 触发).
const retro = '.planning/RETROSPECTIVE.md'
if (existsSync(retro)) {
  const txt = readFileSync(retro, 'utf8')
  if (!/##\s+Deferred\s+items?\s+review/i.test(txt)) {
    violations.push(
      `${retro}: missing "## Deferred items review" section (Phase 2.3 W0 T0.8 cadence)`,
    )
  }
}
// Check 2: deferred-items.md / DEFERRED-*.md files discovered (informational round 1).
const files = walk(ROOT)
if (files.length > 0) {
  console.log(`check-deferred-items: ${files.length} deferred file(s) tracked:`)
  for (const f of files) console.log(`  - ${f}`)
}

if (violations.length > 0) {
  if (ENFORCE) {
    console.error(`::error::${violations.length} deferred-items violation(s)`)
    for (const v of violations) console.error(`  - ${v}`)
    process.exit(1)
  } else {
    console.warn(`::warning::${violations.length} deferred-items violation(s) (warn-only round 1)`)
    for (const v of violations) console.warn(`  - ${v}`)
  }
} else {
  console.log('check-deferred-items: 0 violations (warn-only round 1)')
}
