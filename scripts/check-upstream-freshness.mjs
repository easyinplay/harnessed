#!/usr/bin/env node
// Phase 55 — upstream_health freshness gate.
//
// `spec.upstream_health` has been a required schema block since v0.1 (4 fields ×
// 19 manifests = 76 declarations) with ZERO code consumers — the same
// declaration-without-evaluation defect family Phase 54 cleared out of
// capabilities.yaml / max_iterations / verify-second-opinion. The difference:
// `routing_note` was mis-read as a machine input (renaming fixed it), whereas
// `last_check` / `last_known_good_version` are read by HUMANS as *current facts*
// about our upstreams. Nothing made them stop being read that way when they went
// stale, so deleting the block would throw away real supply-chain provenance.
//
// This gate makes the rot audible instead: a THIRD-PARTY manifest whose
// `last_check` is older than STALE_DAYS fails CI. First-party manifests
// (upstream repository == this repo) are exempt — their "upstream" is the commit
// you are looking at, so a date stamp there carries no information.
//
// Zero network, zero protocol adapters: an upstream cutting a release must NOT
// turn this red, because almost every install cmd resolves `@latest` and drifting
// downward is the intended behaviour. What is being asserted is only "a human
// re-verified this row recently" — which is exactly what `last_check` means.
//
// Clearing the gate = re-verify the row (registry / tag / HEAD) and stamp today's
// date, NOT bump the number blindly.
//
// Sister gates: scripts/check-state-archive-stale.mjs (staleness, hard-fail),
// scripts/check-yaml-i18n-parity.mjs (yaml-parsing, runs AFTER pnpm install).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const STALE_DAYS = 90
const FIRST_PARTY_REPO = 'github.com/easyinplay/harnessed'
const MANIFEST_ROOT = 'manifests'

/** Deterministic override for tests / reproducible runs (ISO date, e.g. 2026-09-10). */
function today() {
  const override = process.env.HARNESSED_FRESHNESS_TODAY
  return override ? new Date(`${override}T00:00:00Z`) : new Date()
}

function walkYaml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkYaml(full, out)
      continue
    }
    if (!entry.endsWith('.yaml')) continue
    // zh-Hans siblings mirror the en base; the base row is the one being verified.
    if (entry.endsWith('.zh-Hans.yaml')) continue
    out.push(full)
  }
  return out
}

function ageInDays(lastCheck, now) {
  const then = new Date(`${lastCheck}T00:00:00Z`)
  if (Number.isNaN(then.getTime())) return null
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000)
}

const now = today()
const stale = []
const malformed = []
let thirdParty = 0
let firstParty = 0

for (const file of walkYaml(MANIFEST_ROOT)) {
  let doc
  try {
    doc = parse(readFileSync(file, 'utf8'))
  } catch (err) {
    malformed.push(`${file}: unparseable yaml (${err.message})`)
    continue
  }
  const health = doc?.spec?.upstream_health
  // Not every yaml under manifests/ is a Manifest (aliases.yaml etc.); the schema
  // gate — not this one — enforces that real manifests declare the block.
  if (!health) continue

  const repository = doc?.metadata?.upstream?.repository ?? ''
  if (repository.includes(FIRST_PARTY_REPO)) {
    firstParty += 1
    continue
  }
  thirdParty += 1

  const age = ageInDays(health.last_check, now)
  if (age === null) {
    malformed.push(`${file}: last_check '${health.last_check}' is not an ISO date`)
    continue
  }
  if (age > STALE_DAYS) {
    stale.push({
      name: doc?.metadata?.name ?? file,
      file,
      age,
      version: health.last_known_good_version,
    })
  }
}

stale.sort((a, b) => b.age - a.age)

console.log(
  `[upstream-freshness] ${thirdParty} third-party manifests, ${stale.length} stale (>${STALE_DAYS}d), ${firstParty} first-party exempt`,
)
for (const s of stale) {
  console.error(`  ${s.name} ${s.age}d (record: ${s.version}) — ${s.file}`)
}
for (const m of malformed) {
  console.error(`  ${m}`)
}

if (stale.length > 0 || malformed.length > 0) {
  console.error(
    'Re-verify each row against its upstream (npm view / gh api tags / gh api commits), update ' +
      'last_known_good_version to what you actually observed, then stamp last_check with today.',
  )
  process.exit(1)
}
