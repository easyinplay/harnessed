#!/usr/bin/env node
// Phase 2.2 T4.0 — provenance gate (ADR 0011 § 8, B-33 + B-34, CD-6 ⭐⭐).
// 走 .harnessed/sessions/** | .harnessed/checkpoints/** | .harnessed/route-logs/** —
// 任何 runtime artifact 必须有 sibling `.provenance.json`, 否则 violation.
// 沿袭 check-transparency-verdicts.mjs walker pattern (W3 ENFORCE=true).
// Curated paths (workflows/**, manifest.yaml, docs/**) NOT in scope — see R8.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ENFORCE = true
const RUNTIME_ROOTS = ['.harnessed/sessions', '.harnessed/checkpoints', '.harnessed/route-logs']
// R8: skip non-runtime / curated paths even if they appear under .harnessed/.
const SKIP_BASENAMES = new Set(['.gitignore', '.gitkeep', 'README.md'])

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (!SKIP_BASENAMES.has(name) && !name.endsWith('.provenance.json')) out.push(p)
  }
  return out
}

function siblingProvenancePath(artifactPath) {
  return `${artifactPath}.provenance.json`
}

function validateProvenance(file) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    return [`${file}: invalid JSON (${e.message})`]
  }
  const errs = []
  for (const k of ['source', 'created_at', 'confidence', 'author']) {
    if (!(k in parsed)) errs.push(`${file}: missing field "${k}"`)
  }
  if (parsed.source && !['curated', 'learned', 'imported', 'evolved'].includes(parsed.source)) {
    errs.push(`${file}: source "${parsed.source}" not in [curated|learned|imported|evolved]`)
  }
  if (parsed.confidence != null && (parsed.confidence < 0 || parsed.confidence > 1)) {
    errs.push(`${file}: confidence ${parsed.confidence} out of [0,1]`)
  }
  if (parsed.author != null && (typeof parsed.author !== 'string' || parsed.author.length === 0)) {
    errs.push(`${file}: author must be non-empty string`)
  }
  return errs
}

const violations = []
for (const root of RUNTIME_ROOTS) {
  for (const file of walk(root)) {
    const prov = siblingProvenancePath(file)
    if (!existsSync(prov)) {
      violations.push(`${file}: missing sibling provenance (${prov})`)
      continue
    }
    violations.push(...validateProvenance(prov))
  }
}

if (violations.length > 0) {
  console.warn(`[provenance-gate] ${violations.length} violation(s):`)
  for (const v of violations) console.warn(`  ${v}`)
  console.warn('See provenance.schema.json + ADR 0011 § 8 for the gate convention.')
  process.exit(ENFORCE ? 1 : 0)
}
console.log('[provenance-gate] all runtime artifacts compliant.')
