// src/manifest/aliases.ts — Phase 3.3 W1 T1.4 — D-01 RICH consumer.
// Sister src/manifest/validate.ts (yaml.parse + Value.Check) + sister
// src/checkpoint/state.ts L23-41 (fail-soft read pattern).
// Memoized 1-read per process (Karpathy YAGNI, only pay cost on doctor 7th
// check OR install path resolveAlias call). yaml.parse via existing project
// yaml lib (sister src/manifest/validate.ts convention).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse } from 'yaml'
import { AliasesV1, type AliasesV1Type } from './schema/aliases.v1.js'

const ALIASES_PATH = join(process.cwd(), 'manifests', 'aliases.yaml')

let _cached: AliasesV1Type | null = null

/** Load aliases.yaml once per process (memoized). Returns null if file absent.
 *  Throws Karpathy fail-loud Error on schema invalid (debug locality). */
export function loadAliases(): AliasesV1Type | null {
  if (_cached) return _cached
  if (!existsSync(ALIASES_PATH)) return null
  const raw = readFileSync(ALIASES_PATH, 'utf8')
  const parsed = parse(raw) as unknown
  if (!Value.Check(AliasesV1, parsed)) {
    const errs = [...Value.Errors(AliasesV1, parsed)].slice(0, 3)
    throw new Error(
      `aliases.yaml schema invalid: ${errs.map((e) => `${e.path} ${e.message}`).join('; ')}`,
    )
  }
  _cached = parsed
  return parsed
}

/** Resolve old → new name redirect; returns null if no alias for the name. */
export function resolveAlias(name: string): string | null {
  return loadAliases()?.aliases?.[name]?.redirect ?? null
}

/** List all deprecated entries (consumer: doctor 7th check). */
export function listDeprecations(): Array<{
  old: string
  entry: AliasesV1Type['aliases'][string]
}> {
  const a = loadAliases()
  return a ? Object.entries(a.aliases).map(([old, entry]) => ({ old, entry })) : []
}
