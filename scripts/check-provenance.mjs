#!/usr/bin/env node
// Phase 2.2 T4.0 — provenance gate (ADR 0011 § 8, B-33 + B-34, CD-6 ⭐⭐).
// 走 .harnessed/sessions/** | .harnessed/checkpoints/** | .harnessed/route-logs/** —
// 任何 runtime artifact 必须有 sibling `.provenance.json`, 否则 violation.
// 沿袭 check-transparency-verdicts.mjs walker pattern (W3 ENFORCE=true).
// Curated paths (workflows/**, manifest.yaml, docs/**) NOT in scope — see R8.
// Phase 2.4 Wave 0 T0.4 (M2 absorb) — branchOnSchemaVersion 3rd consumer (was 2 helper-only):
// runtime provenance.json files may carry a `schemaVersion` field for forward-compat
// (handoff-doc / phases-yaml / manifest-state / installer-state / route-decision-log /
// checkpoint / agent-definition-factory surfaces). Per ADR 0011 § R3 rule (a):
// consumers MUST branch on schemaVersion via the helper. The .mjs runtime can't import
// the TS module directly (NodeNext + verbatimModuleSyntax + noEmit ts → bundled .mjs);
// inline-port the helper here mirroring src/types/schemaVersion.ts (SSOT remains TS;
// grep -r "branchOnSchemaVersion" src/ scripts/ ≥ 3 — M2 long-tail consumer #3 landed).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KNOWN_V1_SURFACES = [
  'harnessed.routing-snapshot.v1',
  'harnessed.handoff-doc.v1',
  'harnessed.phases-yaml.v1',
  'harnessed.manifest-state.v1',
  'harnessed.installer-state.v1',
  'harnessed.route-decision-log.v1',
  'harnessed.checkpoint.v1',
]

function branchOnSchemaVersion(v, handlers) {
  return KNOWN_V1_SURFACES.includes(v) ? handlers.v1() : handlers.unknown()
}

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
  // Phase 2.4 W0 T0.4 — branchOnSchemaVersion consumer: forward-compat schemaVersion
  // branch (degrade gracefully on absent/unknown — non-v1 schemaVersion is informational,
  // not a hard violation; only future v2 surfaces with breaking-change semantics would error).
  if (parsed.schemaVersion != null) {
    branchOnSchemaVersion(parsed.schemaVersion, {
      v1: () => {
        /* known v1 surface — current validators are v1-shape compatible */
      },
      unknown: () => {
        errs.push(
          `${file}: schemaVersion "${parsed.schemaVersion}" unknown (expected one of harnessed.<surface>.v1)`,
        )
      },
    })
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
