// src/manifest/knownGood.ts — Phase 3.3 W1 T1.5 — D-03 YAML manifest consumer.
// Sister src/manifest/aliases.ts (fail-soft read + Value.Check + memoize).
// Path: versions/<harnessed-ver>-known-good.yaml (sister manifests/tools/
// <name>.yaml install.ts L66 path 范式). Lazy read per-harnessed-ver
// (Karpathy YAGNI per planner CONTEXT Discretion lock — only pay cost when
// --known-good flag triggers consume).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse } from 'yaml'
import { KnownGoodV1, type KnownGoodV1Type } from './schema/known-good.v1.js'

const versionsDir = (): string => join(process.cwd(), 'versions')

const _cache = new Map<string, KnownGoodV1Type | null>()

/** Load versions/<harnessedVer>-known-good.yaml; memoized per harnessedVer.
 *  Returns null if file absent. Throws Karpathy fail-loud on schema invalid. */
export function loadKnownGood(harnessedVer: string): KnownGoodV1Type | null {
  if (_cache.has(harnessedVer)) return _cache.get(harnessedVer) ?? null
  const path = join(versionsDir(), `${harnessedVer}-known-good.yaml`)
  if (!existsSync(path)) {
    _cache.set(harnessedVer, null)
    return null
  }
  const raw = readFileSync(path, 'utf8')
  const parsed = parse(raw) as unknown
  if (!Value.Check(KnownGoodV1, parsed)) {
    const errs = [...Value.Errors(KnownGoodV1, parsed)].slice(0, 3)
    throw new Error(
      `${path} schema invalid: ${errs.map((e) => `${e.path} ${e.message}`).join('; ')}`,
    )
  }
  _cache.set(harnessedVer, parsed)
  return parsed
}

/** Get pinned version for an upstream name + harnessed version. */
export function getPinnedVersion(upstreamName: string, harnessedVer: string): string | null {
  const kg = loadKnownGood(harnessedVer)
  if (!kg) return null
  const entry = kg.upstreams.find((u) => u.name === upstreamName)
  return entry?.version ?? null
}
