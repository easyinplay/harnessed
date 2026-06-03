// Phase 3.1 W2 T2.1 — checkpoint template: mechanical writer + budget enforcer
// (D-01 LOCKED: zero LLM call — pure mechanical assembly + fail-loud truncate).
//
// Sister of `src/workflow/loadPhases.ts` (Value.Check validate-and-throw pattern).
// Budget enforcement strategy (R § 2 R7.2 < 1k token acceptance):
//   Level 1 — truncate `last_task` to first 200 chars
//   Level 2 — truncate `key_decisions` to first 5 items
//   Level 3 — throw CheckpointTooLargeError (fail-loud, do NOT silently drop data)
// Token estimation: 1 char ≈ 0.25 token via Buffer.byteLength (R § 3 heuristic).

import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { harnessedSubdir } from '../installers/lib/harnessedRoot.js'
import { writeFileSyncAtomic } from './atomicWrite.js'
import { CheckpointV1, type CheckpointV1Type } from './schema/index.js'

const BUDGET_TOKEN = 1000

export class CheckpointTooLargeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckpointTooLargeError'
  }
}

export class CheckpointWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckpointWriteError'
  }
}

/** Heuristic: 1 char ≈ 0.25 token (English-dominant) — R § 3 estimation strategy.
 *  Uses Buffer.byteLength for utf8-accurate length (multibyte glyphs counted right). */
export function estimateTokens(s: string): number {
  return Math.ceil(Buffer.byteLength(s, 'utf8') / 4)
}

/** Fail-loud truncate strategy: try truncate longest fields first; if still over → throw.
 *  Order chosen so highest-value fields (canonical_refs, session_id, cwd) are preserved
 *  and only narrative-redundant fields (last_task tail, decisions tail) are sacrificed. */
export function enforceBudget(c: CheckpointV1Type, budget = BUDGET_TOKEN): CheckpointV1Type {
  let candidate = c
  let tokens = estimateTokens(JSON.stringify(candidate))
  if (tokens <= budget) return candidate
  // Level 1: truncate last_task to first 200 chars
  candidate = { ...candidate, last_task: candidate.last_task.slice(0, 200) }
  tokens = estimateTokens(JSON.stringify(candidate))
  if (tokens <= budget) return candidate
  // Level 2: truncate key_decisions to first 5 items
  candidate = { ...candidate, key_decisions: candidate.key_decisions.slice(0, 5) }
  tokens = estimateTokens(JSON.stringify(candidate))
  if (tokens <= budget) return candidate
  throw new CheckpointTooLargeError(
    `Checkpoint exceeds ${budget}-token budget even after truncation (estimated ${tokens})`,
  )
}

/** Write checkpoint envelope to `<harnessed-root>/checkpoints/<phase>.json` (or customPath).
 *  v3.0.3: default path routed through `getHarnessedRoot()` SoT (homedir-rooted).
 *  Throws CheckpointWriteError on schema violation; CheckpointTooLargeError on budget. */
export function writeCheckpoint(c: CheckpointV1Type, customPath?: string): string {
  if (!Value.Check(CheckpointV1, c)) {
    const errs = [...Value.Errors(CheckpointV1, c)].map((e) => e.message).join('; ')
    throw new CheckpointWriteError(`Schema validation failed: ${errs}`)
  }
  const enforced = enforceBudget(c)
  const path = customPath ?? join(harnessedSubdir('checkpoints'), `${enforced.phase}.json`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSyncAtomic(path, JSON.stringify(enforced, null, 2))
  return path
}
