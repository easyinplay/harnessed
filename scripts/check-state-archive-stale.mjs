#!/usr/bin/env node
// Phase 3.4 W0.1 D3 — STATE.md role + archive cadence institutionalize gate.
// Sister scripts/check-transparency-verdicts.mjs 130L warn-only round 1 → ENFORCE
// Phase 3.5+ pattern (Phase 2.1 T1.7 ship ENFORCE=false → Phase 2.2 W0 T0.6 flip
// ENFORCE=true 沿袭 cadence). 3 rules per D-04 paranoid architectural framing
// (NOT cleanup): (1) size ≤200L round 1 (≤150 v0.4 tighten); (2) 关键决议总结 ≤1
// section; (3) historical W-N errata literal 禁字面 (move to RETROSPECTIVE).
import { readFileSync } from 'node:fs'

const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)
const STATE_PATH = '.planning/STATE.md'
const SIZE_LIMIT = 150 // Phase 5.2 W0 T0.2 round 3 FLIP: post-T0.1 STATE 150L ≤ 150L → FLIP 165→150 (15L safety headroom; sister Phase 4.3 W0.2 200→175 cadence延袭 tighter as more confidence; #BA decision tree FLIP PATH active)
const KEY_DECISIONS_SECTION_LIMIT = 1
const HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/

function checkStateArchive() {
  const violations = []
  const content = readFileSync(STATE_PATH, 'utf8')
  const lines = content.split(/\r?\n/)

  // Rule 1: wc -l ≤ 200 (warn-only round 1; ENFORCE round 2 = strict gate)
  if (lines.length > SIZE_LIMIT) {
    violations.push(
      `Rule 1 (size): STATE.md ${lines.length}L > ${SIZE_LIMIT}L (archive prev-prev-phase narrative to RETROSPECTIVE.md § ARCHIVED FROM STATE)`,
    )
  }

  // Rule 2: "关键决议 ship 总结" section count (HTML-comment archive marker matches OK)
  const keyDecisionsMatches = content.match(/^##\s+.*关键决议\s*ship\s*总结/gm) ?? []
  if (keyDecisionsMatches.length > KEY_DECISIONS_SECTION_LIMIT) {
    violations.push(
      `Rule 2 (key decisions): ${keyDecisionsMatches.length} '关键决议 ship 总结' section(s) > ${KEY_DECISIONS_SECTION_LIMIT} (move to RETROSPECTIVE.md; only HTML-comment archive marker remains in STATE.md)`,
    )
  }

  // Rule 3: historical errata literal 禁字面 (W-N errata / sister review M-N 修正)
  for (let i = 0; i < lines.length; i++) {
    if (HISTORICAL_ERRATA_RE.test(lines[i])) {
      violations.push(
        `Rule 3 (errata): L${i + 1} historical commentary literal '${lines[i].trim().slice(0, 80)}...' (move to RETROSPECTIVE.md)`,
      )
    }
  }
  return violations
}

const violations = checkStateArchive()
if (violations.length > 0) {
  console.warn(`[state-archive-stale] ${violations.length} violation(s):`)
  for (const v of violations) console.warn(`  ${v}`)
  console.warn('See Phase 3.4 W0.1 STRATEGIC institutionalize (D1+D2+D3+D4) for archive cadence.')
  process.exit(ENFORCE ? 1 : 0)
}
console.log('[state-archive-stale] STATE.md within archive cadence limits.')
