#!/usr/bin/env node
// Phase 2.4 W2 D-02 — EE-4 plan-checker quantitative gate walker.
// Sister: scripts/check-transparency-verdicts.mjs (Phase 2.1 T1.7) walker + ENFORCE pattern.
// Sister: scripts/check-provenance.mjs (Phase 2.2 T4.0) JSON-validator pattern.
// Reads routing/plan-review-schema.yaml (T2.1 SSOT) -> walks plan-doc files ->
// emits per-file JSON verdict; BLOCKER (<=2/4) -> exit 1 + ::error:: (manual rerun per B-12).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ENFORCE = process.env.ENFORCE !== 'false'
const SCHEMA = parseYaml(readFileSync('routing/plan-review-schema.yaml', 'utf8'))
const targetArg = process.argv[2] ?? '.planning/'

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  const st = statSync(dir)
  if (st.isFile()) {
    if (/task_plan\.md$|PLAN\.md$/.test(dir)) out.push(dir)
    return out
  }
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/task_plan\.md$|PLAN\.md$/.test(name)) out.push(p)
  }
  return out
}

// W6 fix: multi-line aware (acceptance_criteria spans 5-10 lines). Markdown-bold tolerant.
function scoreFileRefs(c) {
  const lines = [...c.matchAll(/files?(?:_modified|_created)\*?\*?:\s*([^\n]+)/g)].map((m) => m[1])
  const paths = []
  for (let blk of lines) {
    while (/\([^()]*\)/.test(blk)) blk = blk.replace(/\([^()]*\)/g, ' ')
    paths.push(
      ...blk
        .replace(/[`*]/g, ' ')
        .split(/[+,\s;]+/)
        .filter((p) => /^[.\w-][\w/.-]*\.(ts|md|yaml|yml|mjs|json|js|tsx|sh)$/.test(p)),
    )
  }
  const uniq = [...new Set(paths)]
  if (uniq.length === 0) return { score: 1.0, found: 0, total: 0 }
  const found = uniq.filter((p) => existsSync(p)).length
  return { score: found / uniq.length, found, total: uniq.length }
}
function scoreSourceRefs(c) {
  const lines = [...c.matchAll(/(?:decision_source|see|ref)\*?\*?:\s*([^\n]+)/g)].map((m) => m[1])
  const md = []
  let anchors = 0
  for (const blk of lines) {
    for (const p of blk.replace(/[`*]/g, ' ').split(/[+,\s;]+/))
      if (/\.(md|yaml|yml)$/.test(p) && /\//.test(p)) md.push(p)
    anchors += [
      ...blk.matchAll(
        /\b(B-\d+|D-\d+|Phase \d+\.\d+|§ ?\d+(?:\.\d+)*|ADR \d+|R\d+|F\d+|D2\.\d+-\d+|O\d+|S\d+|H\d+|M\d+|W\d+|T[0-9.]+)\b/g,
      ),
    ].length
  }
  if (md.length + anchors === 0) return { score: 1.0, mdFound: 0, mdTotal: 0, anchors: 0 }
  if (md.length === 0) return { score: 1.0, mdFound: 0, mdTotal: 0, anchors }
  const mdFound = md.filter((r) => existsSync(r)).length
  return { score: mdFound / md.length, mdFound, mdTotal: md.length, anchors }
}
function scoreAcceptance(c) {
  const blocks = [...c.matchAll(/acceptance_criteria\*?\*?:\s*\n((?:\s{2,}-[^\n]+\n?)+)/g)].map(
    (m) => m[1],
  )
  const qre =
    /grep -c|wc -l|exit \d+|≤\s*\d+|≥\s*\d+|==\s*\d+|toBeGreaterThan|toBe\(|\d+\s*lines?|fail-fast|smoke|命中|\bpass\b|exit 0|exit 1|\bcount\b|line count|present|absent|匹配|不存在|存在|REMOVED|verify|valid|invalid|success|fail|>\s*0|<\s*\d+|!grep|! grep|! test|grep -E|0 (增|副|残|实)|0\s+(diff|error)|all (success|pass|green)|\bship|expected|REQUIRED|MUST|含 |不含|hit|MATCH|HIT|无 |有 |生成|创建|删除|backup|rollback|实测/i
  let total = 0
  let quant = 0
  for (const blk of blocks)
    for (const s of blk.split(/\n/).filter((l) => /^\s+-\s/.test(l))) {
      total++
      if (qre.test(s)) quant++
    }
  return { score: total === 0 ? 1.0 : quant / total, quant, total }
}
function scoreWeasel(c) {
  let n = 0
  for (const _m of c.matchAll(/\b(presumably|likely|probably|maybe)\b/gi)) n++
  for (const m of c.matchAll(/\bassumed\b/gi))
    if (!/\(per [A-Z]+-?\d+\)|\(locked\)|assumption/i.test(c.substr(m.index, 80))) n++
  for (const m of c.matchAll(/\bshould be\b/gi))
    if (!/\(per [A-Z]+-?\d+\)|\(locked\)/i.test(c.substr(m.index, 80))) n++
  return n
}

const t = SCHEMA.spec.dimensions
const s = SCHEMA.spec.scoring
let totalBLOCKER = 0
for (const file of walk(targetArg)) {
  const c = readFileSync(file, 'utf8')
  const fr = scoreFileRefs(c)
  const sr = scoreSourceRefs(c)
  const ac = scoreAcceptance(c)
  const w = scoreWeasel(c)
  const passed = [
    fr.score >= t.file_references_verified.threshold,
    sr.score >= t.reference_sources_real.threshold,
    ac.score >= t.concrete_acceptance.threshold,
    w <= t.business_logic_assumptions.threshold,
  ]
  const pc = passed.filter(Boolean).length
  const verdict =
    pc >= s.pass_threshold ? 'PASS' : pc >= s.warning_threshold ? 'WARNING' : 'BLOCKER'
  console.log(
    JSON.stringify({
      file,
      scores: {
        file_references_verified: fr,
        reference_sources_real: sr,
        concrete_acceptance: ac,
        business_logic_assumptions: w,
      },
      dimensions_passed: pc,
      verdict,
      auto_retrigger_plan_phase: false,
    }),
  )
  if (verdict === 'BLOCKER') {
    console.error(
      `::error file=${file}::plan-check BLOCKER (${pc}/4) -- manual /gsd-plan-phase rerun required (per B-12)`,
    )
    totalBLOCKER++
  }
}
process.exit(ENFORCE && totalBLOCKER > 0 ? 1 : 0)
