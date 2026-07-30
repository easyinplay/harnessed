// src/checkpoint/completionClaim.ts — T2.7 D-1: move the completion promise off the
// dead path and onto the live one.
//
// harnessed already owns a complete promise machine: `isComplete` (4-layer dual
// signal: structured status > clean-run subtype > verbatim `<promise>COMPLETE</promise>`
// fallback), `extractPromise`, `COMPLETION_SCHEMA`. Its ONLY consumer was
// src/workflow/run.ts, i.e. `harnessed run` — the path every generated SKILL forbids
// ("Do NOT pipe to `harnessed run`"). Built, tested, unreachable.
//
// This adapter re-exposes the SAME predicate to `harnessed checkpoint complete`, which
// is on the live path. The predicate is REUSED verbatim — no reimplementation, its
// existing unit tests keep covering the 4 layers.
//
// Honest scope (ECC gan-style-harness/SKILL.md:15-17): `<promise>COMPLETE</promise>` is
// a string the EVALUATED agent emits, so this gate is structurally a self-report. It
// proves the promise was made, not that the work is done. That is why it is one of
// four checks and not the guarantee by itself — the artifact existence guard, the
// D-4 boundary, and the budget/plateau damping carry the parts a self-report cannot.

import { readFile } from 'node:fs/promises'
import { isComplete } from '../workflow/lib/ralphLoop.js'

/** 'not_provided' — no claim was supplied; the caller WARNS (back-compat: callers
 *      predating this flag must keep working).
 *  'incomplete'   — a claim was supplied and failed the predicate, OR was supplied as
 *      a file that could not be read. Unverifiable is treated as failed (fail-closed):
 *      pointing the gate at a missing file must not be a way to pass it.
 *  'complete'     — the predicate accepted it. */
export type ClaimVerdict = 'complete' | 'incomplete' | 'not_provided'

export interface ClaimInput {
  /** Raw subagent final output, or the SDK result envelope JSON. */
  result?: string
  /** Path to the same, for callers that cannot safely quote it (Windows). Wins
   *  over `result` when both are given. */
  resultFile?: string
}

export interface ClaimResult {
  verdict: ClaimVerdict
  /** Where the text came from — the file path, or '--result'; null when unprovided. */
  source: string | null
}

export async function verifyCompletionClaim(input: ClaimInput): Promise<ClaimResult> {
  if (input.resultFile) {
    let text: string
    try {
      text = await readFile(input.resultFile, 'utf8')
    } catch {
      return { verdict: 'incomplete', source: input.resultFile }
    }
    return { verdict: isComplete(text) ? 'complete' : 'incomplete', source: input.resultFile }
  }
  if (typeof input.result === 'string' && input.result.trim() !== '') {
    return { verdict: isComplete(input.result) ? 'complete' : 'incomplete', source: '--result' }
  }
  return { verdict: 'not_provided', source: null }
}
