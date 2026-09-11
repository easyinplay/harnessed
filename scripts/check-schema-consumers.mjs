#!/usr/bin/env node
// Phase 61 — the gate for "declared but never evaluated".
//
// harnessed's central bet is that describing composition DECLARATIVELY scales
// better than bespoke imperative installers. It probably does. What it buys
// along with the scaling is a failure mode the imperative approach cannot have:
// a declaration that nothing evaluates. In comet's model the installer code IS
// the description, so a field cannot be "declared but dead" — there are no
// fields. Here, declaration and evaluation are separate artifacts, and neither
// TypeScript, nor the schema, nor CI notices when the second one is missing.
//
// Thirteen instances were found in this repo by hand (see docs/comparison.md).
// The clearest, `mutually_exclusive_with`, ran the full cycle: designed,
// schema'd, documented as "v0.2+ 启用", never wired — and when a real mutual
// exclusion appeared (ECC's bundled chrome-devtools vs the standalone manifest)
// it was solved imperatively by hand in src/cli/lib/check-ecc.ts, with nothing
// anywhere noticing the declarative mechanism for that exact job was dead.
// `marketplace_source` ran the same cycle: declared by 3 manifests, while the
// installer regexed the same value back out of the command string.
//
// WHAT THIS GATE PROVES, AND WHAT IT DOES NOT
//
// It proves a SUFFICIENT condition for dead: a field name that appears nowhere
// outside its schema, in no non-comment line of src/ or scripts/, is certainly
// not read. That is the half worth automating, and it would have caught 6 of the
// 13 found by hand.
//
// It is NOT a proof of liveness. Known false-negative class: a field whose name
// collides with a DIFFERENT artifact. `spec.decision_rules` (the per-manifest
// routing hint) reads as live only because scripts/migrate-decision-rules-v1-to-v2.mjs
// mentions `routing/decision_rules.yaml`, an unrelated file. A dynamic read
// (`spec[key]`) would also slip through. So: a red gate is always a real finding;
// a green gate is a floor, not a certificate.
//
// Comments are stripped before searching precisely because several of the 13
// were mentioned only in prose — `component_type` survives in one comment in
// src/cli/setup.ts claiming the installer groups output by it, while the code
// actually groups by `spec.type`. Counting that comment as a consumer would have
// hidden the defect.
//
// Sister gate: the K10 orphan-trigger check in scripts/check-workflow-schema.mjs
// does the same job for judgment triggers, with the same exemption-with-a-reason
// shape.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Schema files: where declarations live. A mention here is never a consumer. */
const SCHEMA_DIRS = ['src/manifest/schema/']
/** Where an evaluation could live. */
const CONSUMER_ROOTS = ['src', 'scripts']

// Every exemption carries a reason. An exemption without one is the same defect
// this gate exists to catch, one level up.
const EXEMPTIONS = new Map([
  [
    'component_type',
    'KNOWN DEAD, decision pending — required on all 19 manifests, so removing it ' +
      'is a schema-breaking edit that deserves its own phase. src/cli/setup.ts:90 ' +
      'claims output is grouped by it; the code groups by `spec.type`.',
  ],
  [
    'alternative',
    'KNOWN DEAD, decision pending — `upstream_health.alternative` (tavily-mcp ' +
      'declares `exa-mcp`). SCHEMA.md documents it as required when ' +
      '`fallback_action == use_alternative`, and that conditional is not enforced ' +
      'either. Either surface it in doctor or delete both fields together.',
  ],
  [
    'schemaVersion',
    'forward-compat envelope field, read via branchOnSchemaVersion in ' +
      'scripts/check-provenance.mjs against runtime artifacts, not manifest types.',
  ],
  [
    'brainstorming_required',
    'KNOWN DEAD, decision pending — `spec.triggers.brainstorming_required` (ADR 0009 ' +
      'errata). The live brainstorming decision is judgments/subtask-gate.yaml, ' +
      'rewritten in Phase 58; this per-manifest hint would be a second, competing ' +
      'source for the same routing. Most likely a delete.',
  ],
  [
    'license_source',
    'KNOWN DEAD, decision pending — `metadata.upstream.license_source`. The licence ' +
      'WHITELIST does work (a literal union in metadata.ts rejects non-allowed values ' +
      'at Value.Check), but the field recording WHERE the licence was read from is ' +
      'evaluated by nothing. Either surface it in `harnessed audit` or delete it.',
  ],
  [
    'override_signals',
    'KNOWN DEAD, decision pending — part of the `spec.decision_rules` subtree, whose ' +
      'own comment calls it a "redundant guard layer; SSOT remains ' +
      'routing/decision_rules.yaml". Decide the whole subtree at once rather than ' +
      'field by field.',
  ],
])

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) {
      walk(p, out)
      continue
    }
    if (!/\.(ts|mjs|js)$/.test(e)) continue
    if (/\.test\.|\.d\.ts$|\.d\.mts$/.test(e)) continue
    out.push(p)
  }
  return out
}

const norm = (p) => p.replace(/\\/g, '/')
const isSchema = (p) => SCHEMA_DIRS.some((d) => norm(p).includes(d))

/** Strip block and line comments so a mention in prose never counts as a read. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/** Every property declared across the schema files, with its declared type text.
 *
 *  Two forms both count: `name: Type.X(...)` and `name: SomeNamedSchema`. The
 *  whitelist unions are declared as named consts (`license: License`), and the
 *  first version of this gate matched only the `Type.` form — so it never even
 *  saw the license / stability / fallback_action family it was written to audit. */
function declaredFields(files) {
  const fields = new Map() // field -> { declaredIn, typeText }
  const re = /^\s{2,}([a-z_][A-Za-z0-9_]*)\s*:\s*([A-Z][A-Za-z0-9_.]*.*|Type\..*)$/gm
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf8'))
    for (const m of src.matchAll(re)) {
      const name = m[1]
      if (!fields.has(name)) fields.set(name, { declaredIn: norm(f), typeText: m[2] })
    }
  }
  return fields
}

/** Named consts whose definition constrains values — a literal union OR a single
 *  literal (`ApiVersion = Type.Literal('harnessed/v1')`, which an earlier pass
 *  mis-flagged as dead because it only looked for unions). */
function constrainingConsts(files) {
  const out = new Set()
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf8'))
    for (const m of src.matchAll(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*Type\.(?:Union|Literal)\(/g)) {
      out.add(m[1])
    }
  }
  return out
}

/** Does the schema itself reject bad values here?
 *
 *  "Evaluated" has two meanings and missing the second would make this gate lie:
 *  `license` has no reader anywhere, yet an unknown licence fails `Value.Check`
 *  because its type is a literal union — the declaration does real work, just
 *  not by being read. A bare `Type.String()` constrains nothing and is dead for
 *  real. Fields in the middle tier are reported, not failed: the validator
 *  enforces their SHAPE while nothing acts on their VALUE, which is worth
 *  seeing but is not the same defect. */
function isConstrained(typeText, namedUnions) {
  const named = /^([A-Z][A-Za-z0-9_]*)\s*,?\s*$/.exec(typeText.trim())
  if (named && namedUnions.has(named[1])) return true
  if (/Type\.Union\(|Type\.Literal\(/.test(typeText)) return true
  if (
    /(minLength|maxLength|minimum|maximum|pattern|format|minItems|maxItems|uniqueItems)\s*:/.test(
      typeText,
    )
  )
    return true
  return false
}

// This file names fields in its own exemption reasons and error text, which are
// string literals, not comments — so without this exclusion the gate reads its
// own prose as a consumer and silently clears whatever it talks about. Caught
// when `marketplace_source` went green purely because the paragraph below
// mentions it.
const SELF = 'scripts/check-schema-consumers.mjs'

const allFiles = CONSUMER_ROOTS.flatMap((r) => walk(r)).filter((f) => norm(f) !== SELF)
const schemaFiles = allFiles.filter(isSchema)
const consumerFiles = allFiles.filter((f) => !isSchema(f))

if (schemaFiles.length === 0) {
  console.error('[schema-consumers] no schema files found — check SCHEMA_DIRS')
  process.exit(1)
}

// Pre-strip once: this walks the whole of src/ per field otherwise.
const bodies = consumerFiles.map((f) => [norm(f), stripComments(readFileSync(f, 'utf8'))])

const fields = declaredFields(schemaFiles)
const namedUnions = constrainingConsts(schemaFiles)
const dead = []
const shapeOnly = []
let live = 0
let exempt = 0

for (const [field, { declaredIn, typeText }] of fields) {
  if (EXEMPTIONS.has(field)) {
    exempt += 1
    continue
  }
  const re = new RegExp(`\\b${field}\\b`)
  if (bodies.some(([, body]) => re.test(body))) {
    live += 1
    continue
  }
  if (isConstrained(typeText, namedUnions)) {
    shapeOnly.push({ field, declaredIn })
    continue
  }
  dead.push({ field, declaredIn })
}

dead.sort((a, b) => a.field.localeCompare(b.field))
shapeOnly.sort((a, b) => a.field.localeCompare(b.field))

console.log(
  `[schema-consumers] ${fields.size} declared field(s): ${live} read by code, ` +
    `${shapeOnly.length} shape-enforced only, ${dead.length} evaluated by nothing, ${exempt} exempt`,
)
if (shapeOnly.length > 0) {
  console.log(
    '  shape-enforced only (the validator rejects bad VALUES; no behaviour depends on them) — advisory:',
  )
  for (const s of shapeOnly) console.log(`    ${s.field}  (${s.declaredIn})`)
}
for (const d of dead) {
  console.error(`  ${d.field} — declared in ${d.declaredIn}, evaluated by nothing at all`)
}

if (dead.length > 0) {
  console.error(
    'Every declared field needs code that evaluates it. Either wire it (preferred when the ' +
      'need is real — the installer already re-derived `marketplace_source` from the command ' +
      'string by regex), or delete it (preferred when nothing declares it — a mechanism built ' +
      'for a hypothetical is worse than its absence). If neither applies, add it to EXEMPTIONS ' +
      'in this file WITH A REASON.',
  )
  process.exit(1)
}
