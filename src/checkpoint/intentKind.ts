// 4.22.0 T6 — master/leaf classification for `checkpoint intent <sub>`.
//
// SoT = workflows/role-prompts.yaml `is_master: true` (the same flag that routes
// generateCommands to the orchestrator vs execution body — no hardcoded name
// list here). Unknown names, missing file, or any parse error classify as
// 'leaf' (fail-soft per T6 spec: a wrong-but-harmless leaf nag beats a crash
// on a pre-exec surface). Read once per CLI invocation (intent is one-shot).
//
// Own module (not a checkpoint.ts/generateCommands.ts export) — sister
// l4-rescue/hookEntry precedent for the mock-export-gap trap.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

export type IntentKind = 'master' | 'leaf'

export function classifyIntentKind(sub: string, assetsRoot: string): IntentKind {
  try {
    const raw = readFileSync(join(assetsRoot, 'workflows', 'role-prompts.yaml'), 'utf8')
    const doc = parse(raw) as { prompts?: Record<string, { is_master?: boolean }> }
    return doc?.prompts?.[sub]?.is_master === true ? 'master' : 'leaf'
  } catch {
    return 'leaf'
  }
}
