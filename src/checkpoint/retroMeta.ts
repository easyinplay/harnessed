// Phase 22 — retro-reminder counter core. Pure helpers over a per-repo
// RetroMetaEntry (stored in the WorkflowStoreV1 sidecar, NOT the envelope — the
// envelope is replaced each `activate()`). The counter increments on every
// allResolved `checkpoint complete`; when it crosses the threshold the
// checkpoint path sets envelope `retro_due`. `harnessed retro --done` resets it.

import type { RetroMetaEntryType } from './workflowStore.js'

export const DEFAULT_RETRO_THRESHOLD = 5

/** Pure — resolve the phase-count threshold from env (default 5). Junk / zero /
 *  negative falls back to the default (a non-positive threshold would fire every
 *  cycle, defeating the milestone-level intent). */
export function retroThreshold(env: NodeJS.ProcessEnv): number {
  const raw = env.HARNESSED_RETRO_PHASE_THRESHOLD
  if (raw === undefined) return DEFAULT_RETRO_THRESHOLD
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_RETRO_THRESHOLD
}

/** Pure — bump the counter by 1. Absent entry seeds a fresh counter at 1;
 *  preserves `last_retro_at` on an existing entry. */
export function incrementPhases(entry: RetroMetaEntryType | undefined): RetroMetaEntryType {
  if (!entry) return { phases_since_retro: 1 }
  return entry.last_retro_at
    ? { phases_since_retro: entry.phases_since_retro + 1, last_retro_at: entry.last_retro_at }
    : { phases_since_retro: entry.phases_since_retro + 1 }
}

/** Pure — has the counter reached the threshold? */
export function isRetroDue(count: number, threshold: number): boolean {
  return count >= threshold
}

/** Pure — reset on an actual retro: zero the counter, stamp the time. */
export function resetRetro(now: string): RetroMetaEntryType {
  return { phases_since_retro: 0, last_retro_at: now }
}
