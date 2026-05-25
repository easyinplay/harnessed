// src/cli/lib/extract-user-overrides.ts — v3.6.0 Phase 3 Wave 2
// (P0b 上半 CLI integration).
//
// Loads workflows/judgments/user-overrides.yaml (sister Wave 1 schema) and
// extracts matched trigger gate refs from user task description via
// case-insensitive substring match. Consumed by src/cli/run.ts:
//   const overrides = await loadUserOverrides(packageRoot)
//   const matched = extractMatchedTriggers(task, overrides)
//   if (matched.length > 0) gateContext.user_overrides = matched
//
// Match algorithm: for each override entry, if ANY keyword is a substring
// (case-insensitive) of userText → include ALL of entry.triggers[] in result.
// Multiple entries can match the same userText → triggers union deduped.
//
// Fail-soft per ADR 0029: missing yaml / parse error / schema invalid → empty
// array (extract returns []). CLI emits no stderr — silent no-op preserves
// existing behavior for users who don't use override keywords.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { UserOverridesFile, type UserOverridesFileT } from '../../workflow/schema/judgment.js'

export interface UserOverrideEntry {
  id: string
  keywords: string[]
  triggers: string[]
}

/** Load + validate workflows/judgments/user-overrides.yaml. Fail-soft per
 *  ADR 0029: any error (missing file / parse fail / schema reject) → []. */
export async function loadUserOverrides(packageRoot: string): Promise<UserOverrideEntry[]> {
  const yamlPath = resolve(packageRoot, 'workflows', 'judgments', 'user-overrides.yaml')
  let raw: string
  try {
    raw = await readFile(yamlPath, 'utf8')
  } catch {
    return []
  }
  let parsed: unknown
  try {
    parsed = parseYaml(raw)
  } catch {
    return []
  }
  if (!Value.Check(UserOverridesFile, parsed)) {
    return []
  }
  const valid = parsed as UserOverridesFileT
  return valid.overrides.map((o) => ({
    id: o.id,
    keywords: [...o.keywords],
    triggers: [...o.triggers],
  }))
}

/** Case-insensitive substring match — for each override entry, if ANY keyword
 *  is a substring of userText (after lowercasing both sides) → include ALL of
 *  entry.triggers[]. Result is deduped union of all matched triggers.
 *
 *  Empty userText → empty result (no-op, preserves existing behavior).
 *  Empty overrides → empty result. */
export function extractMatchedTriggers(userText: string, overrides: UserOverrideEntry[]): string[] {
  if (!userText || overrides.length === 0) return []
  const haystack = userText.toLowerCase()
  const matched = new Set<string>()
  for (const entry of overrides) {
    for (const kw of entry.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        for (const trigger of entry.triggers) matched.add(trigger)
        break // one keyword hit → all triggers added, no need to check siblings
      }
    }
  }
  return [...matched]
}
