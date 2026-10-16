// v16.0 Phase 67 T7 (findings F10) — ledger slot pruning.
//
// Nothing else in `src/` ever deletes from `workflows.json`: every session leaves a
// permanent `<repoKey>::<sid>` slot, and every adopt / migration may add a
// `::displaced-*` / `::premigrate-*` archive key. Left alone the map only grows, and
// adopt's "more than one candidate -> refuse" (D10) becomes the NORMAL outcome.
//
// Two consumers share ONE staleness rule (`isStaleSessionSlot`):
//   - `harnessed gc` calls `pruneSlots()` (deletion, behind `--older-than`).
//   - `adoptSlot` calls the predicate to ignore dead session slots as candidates
//     (no deletion; it is strictly read-only on the source root).
//
// The write goes through the EXISTING exported `mutateStore()` (locked RMW). This
// module adds nothing to `state.ts` (14 test files factory-mock it).
//
// What is NEVER deleted: `active` / `paused` slots, bare `repoKey` slots, the current
// session's own slot, and anything whose age cannot be determined. Deletion is for
// data that is provably dead; when in doubt the slot stays.

import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'
import { mutateStore } from './state.js'
import { activeKey, readStoreRaw, type WorkflowStoreV1Type } from './workflowStore.js'

/** The default staleness threshold; also `harnessed gc --older-than`'s default. */
export const DEFAULT_STALE_MS = 30 * 86_400_000

/** Archive-segment prefixes (`::displaced-*`, `::premigrate-*`): read by nothing. */
const ARCHIVE_SEGMENT_PREFIXES = ['displaced-', 'premigrate-'] as const

type KeyKind = 'bare' | 'session' | 'archive' | 'other'

/** Classify a ledger key by the segment after its FIRST `::` (mirrors how
 *  `activeKey()` composes keys). `other` = shapes nothing here creates (three
 *  segments, empty session segment); never touched. */
function classifyKey(key: string): KeyKind {
  const i = key.indexOf('::')
  if (i === -1) return 'bare'
  const segment = key.slice(i + 2)
  if (segment === '' || segment.includes('::')) return 'other'
  return ARCHIVE_SEGMENT_PREFIXES.some((p) => segment.startsWith(p)) ? 'archive' : 'session'
}

/** Age basis of a slot: the FIRST present of updated_at, completed_at, started_at.
 *  A present-but-unparseable value yields `undefined` (age unknown -> caller keeps
 *  the slot); we deliberately do not fall through to an older field then. */
function slotTimeMs(slot: CurrentWorkflowV1Type): number | undefined {
  const raw = slot.updated_at ?? slot.completed_at ?? slot.started_at
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? undefined : ms
}

/** `age >= olderThanMs`, same convention as gc's snapshot cutoff
 *  (`ts <= now - olderThan` is old). Unknown age -> false. */
function isOlder(slot: CurrentWorkflowV1Type, nowMs: number, olderThanMs: number): boolean {
  const t = slotTimeMs(slot)
  return t !== undefined && nowMs - t >= olderThanMs
}

/** A `<repoKey>::<sid>` slot that is `complete` and older than the threshold. The
 *  shared rule: gc deletes these, adopt ignores them as candidates. */
export function isStaleSessionSlot(
  key: string,
  slot: CurrentWorkflowV1Type,
  nowMs: number,
  olderThanMs: number,
): boolean {
  return (
    classifyKey(key) === 'session' &&
    slot.status === 'complete' &&
    isOlder(slot, nowMs, olderThanMs)
  )
}

/** Keys eligible for deletion. Pure. */
function planPrune(
  store: WorkflowStoreV1Type,
  nowMs: number,
  olderThanMs: number,
  protectedKeys: ReadonlySet<string>,
): string[] {
  const out: string[] = []
  for (const [key, slot] of Object.entries(store.workflows)) {
    if (protectedKeys.has(key)) continue
    const kind = classifyKey(key)
    if (
      kind === 'archive'
        ? isOlder(slot, nowMs, olderThanMs)
        : isStaleSessionSlot(key, slot, nowMs, olderThanMs)
    ) {
      out.push(key)
    }
  }
  return out
}

export interface PruneSlotsOptions {
  /** Plan only: no lock, no write. */
  dryRun?: boolean
  /** Staleness threshold in ms. Default `DEFAULT_STALE_MS`. */
  olderThanMs?: number
  /** Injectable clock (tests). Default `Date.now()`. */
  nowMs?: number
  /** Repo whose `activeKey()` slot is protected. Default `process.cwd()`. */
  cwd?: string
  /** Test seam: runs between the lock-free plan and the locked write, receiving
   *  the planned keys. A concurrent session touching its slot lands exactly here. */
  onPlanned?: (plan: string[]) => void | Promise<void>
}

export interface PruneSlotsResult {
  /** Slot keys deleted (or, when `dryRun`, that WOULD be deleted). */
  pruned: string[]
  /** Slots remaining in the ledger. */
  keptCount: number
  /** retro_meta / intents entries dropped along with pruned composite keys. */
  cascaded: number
  dryRun: boolean
}

/** Drop sidecar entries keyed by a pruned composite key. Bare-keyed entries are
 *  never in `gone` (bare slots are never pruned), so they are untouched by
 *  construction. Returns the same object when nothing matched. */
function dropKeys<T>(
  map: Record<string, T> | undefined,
  gone: ReadonlySet<string>,
): { next: Record<string, T> | undefined; dropped: number } {
  if (!map) return { next: map, dropped: 0 }
  const kept = Object.entries(map).filter(([k]) => !gone.has(k))
  const dropped = Object.keys(map).length - kept.length
  return dropped === 0 ? { next: map, dropped: 0 } : { next: Object.fromEntries(kept), dropped }
}

/** Apply a prune to a store value. Pure. */
function applyPrune(
  store: WorkflowStoreV1Type,
  keys: readonly string[],
): { store: WorkflowStoreV1Type; cascaded: number } {
  const gone = new Set(keys)
  const workflows = Object.fromEntries(
    Object.entries(store.workflows).filter(([k]) => !gone.has(k)),
  )
  const next: WorkflowStoreV1Type = { ...store, workflows }
  const r = dropKeys(store.retro_meta, gone)
  const i = dropKeys(store.intents, gone)
  if (r.next) next.retro_meta = r.next
  if (i.next) next.intents = i.next
  return { store: next, cascaded: r.dropped + i.dropped }
}

/**
 * Prune dead slots from the active root's ledger.
 *
 * Plans lock-free off `readStoreRaw()`; returns without taking the lock or writing
 * when nothing qualifies (the permanent steady state) or when `dryRun`. Otherwise
 * the write goes through `mutateStore`, which RE-PLANS inside the lock — the first
 * plan is a TOCTOU snapshot and a session may have touched its slot since.
 */
export async function pruneSlots(options: PruneSlotsOptions = {}): Promise<PruneSlotsResult> {
  const nowMs = options.nowMs ?? Date.now()
  const olderThanMs = options.olderThanMs ?? DEFAULT_STALE_MS
  const dryRun = options.dryRun === true
  const protectedKeys = new Set([activeKey(options.cwd)])

  const snapshot = await readStoreRaw()
  const plan = planPrune(snapshot, nowMs, olderThanMs, protectedKeys)
  if (plan.length === 0) {
    return { pruned: [], keptCount: Object.keys(snapshot.workflows).length, cascaded: 0, dryRun }
  }
  if (dryRun) {
    const { cascaded } = applyPrune(snapshot, plan)
    return {
      pruned: plan,
      keptCount: Object.keys(snapshot.workflows).length - plan.length,
      cascaded,
      dryRun,
    }
  }

  await options.onPlanned?.(plan)

  let result: PruneSlotsResult = { pruned: [], keptCount: 0, cascaded: 0, dryRun }
  await mutateStore((store) => {
    const locked = planPrune(store, nowMs, olderThanMs, protectedKeys)
    const applied = applyPrune(store, locked)
    result = {
      pruned: locked,
      keptCount: Object.keys(applied.store.workflows).length,
      cascaded: applied.cascaded,
      dryRun,
    }
    return applied.store
  })
  return result
}
