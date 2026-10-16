// v16.0 Phase 67 (T4 / T5) — `harnessed checkpoint adopt`: a strictly READ-ONLY
// cross-root copy of ONE workflow slot from the other host's ledger into this
// host's ledger, so an in-flight leaf can be finished in codex after Claude Code's
// quota runs out. ADR 0043 (Accepted 2026-10-15) is the decision record; the
// numbered D-references below are its Decisions.
//
// The load-bearing invariant (D3 / ADR Decision 2): NOTHING here writes the source
// root — not even to mark the slot handed over. That single property is why the
// design is cheap: no cross-root locking, no concern for the other host's harnessed
// version, and no way to damage someone else's ledger. `tests/checkpoint/
// adoptSlot.test.ts` asserts the source root is byte-identical (content AND mtime)
// after every path, refusals included.
//
// What this module deliberately does NOT do:
//   - touch any of the six bare-key read fallbacks (ADR: gating them on the host
//     would break the very relay they enable — the original proposal's Decision #3,
//     found harmful),
//   - add an export to `state.ts` (14 test files factory-mock it; standing project
//     invariant) — the write goes through the EXISTING `mutateStore()`,
//   - copy the evidence file (D12) or write a `host` field on the slot.
//
// Rendering lives at the CLI call site (`src/cli/checkpoint.ts`): that file carries
// zero `t()` calls, so checkpoint's user-facing English/Chinese is written in place
// by convention. Everything here returns STRUCTURED data.

import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getHarnessedRoot } from '../platform/harnessedRoot.js'
import {
  descriptorFor,
  HOST_IDS,
  type HostId,
  type HostResolutionReason,
  type HostResolutionSkip,
  isHostId,
  type PlatformDescriptor,
  resolveHostWithReason,
} from '../platform/platform.js'
import { DEFAULT_STALE_MS, isStaleSessionSlot } from './pruneSlots.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'
import { mutateStore } from './state.js'
import {
  type RetroMetaEntryType,
  readStoreAt,
  repoKey,
  type WorkflowStoreV1Type,
} from './workflowStore.js'

/** Any id a resolved descriptor can carry. Wider than `HostId`: the descriptor
 *  union also names the harnesses that have no descriptor yet. */
type ResolvedHostId = PlatformDescriptor['id']

/** D11 — a destination slot displaced by an adopt is preserved under this suffix.
 *  ARCHIVE-ONLY, exactly like `::premigrate-*`: no read path recognises it and none
 *  may be wired to it (`activeKey()` cannot construct the suffix, so the hot reads
 *  are immune by construction — an injected displaced slot is precisely the
 *  cross-slot bleed of issue #10). Old ones are pruned by `harnessed gc` (T7,
 *  `src/checkpoint/pruneSlots.ts`). */
const DISPLACED = '::displaced-'

/** The archive suffixes a candidate match must EXCLUDE (D9). Both are
 *  `repoKey`-prefixed two-segment keys, so a loose prefix match would count them as
 *  candidates and trip the >1-candidate refusal on a reverse relay — a dead-lock
 *  that gets worse every time an adopt or a migration archives something. */
const ARCHIVE_SEGMENT_PREFIXES = ['displaced-', 'premigrate-'] as const

/** The marker every `harnessed setup`-generated command file carries as its last
 *  non-blank line. The WRITER is `src/cli/lib/generateCommands.ts` (`MARKER`);
 *  this is the version-loose prefix of it, matched here rather than imported so
 *  that the per-command rendering stack (yaml + capability resolution) is not
 *  dragged into this module. `grep harnessed-generated` finds both sites. */
const GENERATED_COMMAND_MARKER = 'harnessed-generated:'

export interface AdoptSlotOptions {
  /** Source host id, verbatim from `--from`. Omitted → inferred as the other
   *  entry of `HOST_IDS`. */
  from?: string
  /** Home base the host DESCRIPTORS are derived from. Injectable because
   *  `HARNESSED_ROOT_OVERRIDE` replaces only the RESOLVED host's `stateRoot` and
   *  therefore cannot sandbox the OTHER host's root — tests need both seams, and
   *  setting one without the other reads the real user profile. */
  home?: string
  /** Repo the slot belongs to. Defaults to `process.cwd()`. */
  cwd?: string
}

export type AdoptRefusal =
  /** `--from` named something that is not a known host id. */
  | { kind: 'unknown-from'; value: string; known: readonly HostId[] }
  /** `--from` omitted and the "other host" is not unique (a third host exists). */
  | { kind: 'from-required'; host: ResolvedHostId; known: readonly HostId[] }
  /** D8 — `--from` names the host this process already resolved to. */
  | {
      kind: 'same-host'
      host: HostId
      other: HostId
      reason: HostResolutionReason
      skipped: HostResolutionSkip[]
    }
  /** T5 — the destination host has no harnessed-generated commands to run. */
  | { kind: 'dest-not-set-up'; host: ResolvedHostId; commandsDir: string }
  /** D14 — the source host has no ledger at all. */
  | { kind: 'no-source-ledger'; from: HostId; path: string }
  /** D14 — the source ledger exists but could not be read (damaged / wrong schema). */
  | { kind: 'source-ledger-unreadable'; from: HostId; path: string }
  /** D9 — the source ledger holds no slot for this repo. */
  | { kind: 'no-candidate'; from: HostId; repoKey: string; sourceKeys: string[] }
  /** D10 — more than one candidate. Refuse and list; never pick. */
  | { kind: 'ambiguous'; from: HostId; candidates: string[] }
  /** D11 — the destination slot is in flight. Thrown inside the lock, so nothing
   *  was written (TOCTOU-free). */
  | {
      kind: 'dest-occupied'
      from: HostId
      mine: { phase: string; status: string; done: number; total: number }
      theirs: { phase: string }
    }

export interface AdoptSuccess {
  ok: true
  from: HostId
  to: ResolvedHostId
  /** The BARE `repoKey` the slot was written at (D4). NOT `activeKey()`: the bare
   *  key is the only one a later session can still reach (`state.ts`'s bare-key
   *  fallback), and a re-adopt of a composite-keyed slot would pull the PRE-relay
   *  state back over the intervening work. */
  key: string
  /** The source ledger key the slot came from (bare or `repoKey::<sessionId>`). */
  sourceKey: string
  sourceRoot: string
  destRoot: string
  phase: string
  status: string
  /** D12 — carried over verbatim. It still points into the SOURCE root; the next
   *  `checkpoint complete` writes the same-named file under the destination root
   *  and the pointer corrects itself. */
  evidencePath: string | null
  /** D7 — stamped at write time here, because `mutateStore` (unlike
   *  `writeCurrentWorkflowUnlocked`) does not stamp it. */
  updatedAt: string
  /** D11 — set only when a `paused` destination slot was displaced. */
  archivedKey?: string
  /** D15 — set only when the source carried a `retro_meta` entry for this repo. */
  retroMeta?: RetroMetaEntryType
}

export type AdoptOutcome = AdoptSuccess | { ok: false; refusal: AdoptRefusal }

/** Carries a refusal decided INSIDE the `mutateStore` callback out through
 *  `withLock`. Throwing is the refusal mechanism on purpose: `withLock`'s
 *  `try/finally` releases the lock and `writeStoreRaw` has not run, so the
 *  check-then-write race cannot exist (ADR Decision 5). */
class AdoptRefused extends Error {
  constructor(readonly refusal: AdoptRefusal) {
    super(`adopt refused: ${refusal.kind}`)
    this.name = 'AdoptRefused'
  }
}

const refuse = (refusal: AdoptRefusal): AdoptOutcome => ({ ok: false, refusal })

/**
 * Does `commandsDir` hold at least one `harnessed setup`-generated command?
 *
 * T5 / ADR Decision 14 — the ledger is not all the destination needs. `commandsDir`
 * and `skillsDir` are populated only by `harnessed setup --platform <id>`, so
 * without this precondition the happy path is "adopt says OK, and the destination
 * has no command to run".
 *
 * Keyed on the GENERATED MARKER rather than mere non-emptiness: `~/.claude/commands`
 * routinely holds the user's own and their plugins' command files, and counting
 * those as "harnessed is set up here" would pass exactly the case this refusal
 * exists to catch.
 */
async function destIsSetUp(commandsDir: string): Promise<boolean> {
  let names: string[]
  try {
    names = (await readdir(commandsDir)).filter((n) => n.endsWith('.md'))
  } catch {
    return false // absent / unreadable → not set up
  }
  for (const n of names) {
    try {
      if ((await readFile(join(commandsDir, n), 'utf8')).includes(GENERATED_COMMAND_MARKER)) {
        return true
      }
    } catch {
      // unreadable file → keep looking
    }
  }
  return false
}

/**
 * Candidate slots for `key` in a source ledger, matched on EXACTLY two segments
 * (D9): the bare `repoKey`, or `repoKey::<sessionId>` where the session segment is
 * itself `::`-free and is not an archive marker.
 *
 * No local case folding: Phase 67 T1 normalizes the repo key at the root
 * (`normalizeRepoKey`), so both sides of this comparison are already canonical and
 * a fold here would be dead code.
 */
function findCandidateKeys(
  workflows: Record<string, CurrentWorkflowV1Type>,
  key: string,
  nowMs: number = Date.now(),
): string[] {
  const prefix = `${key}::`
  return Object.keys(workflows).filter((k) => {
    if (k === key) return true
    if (!k.startsWith(prefix)) return false
    const segment = k.slice(prefix.length)
    if (segment === '' || segment.includes('::')) return false
    if (ARCHIVE_SEGMENT_PREFIXES.some((p) => segment.startsWith(p))) return false
    // T7 / F10 — a `complete` session slot past the same threshold `harnessed gc`
    // prunes at is dead history, not a relay target. Ignored, never deleted (this
    // module is read-only on the source root). `active` / `paused` stay candidates.
    return !isStaleSessionSlot(k, workflows[k] as CurrentWorkflowV1Type, nowMs, DEFAULT_STALE_MS)
  })
}

/**
 * D15 — carry the repo's retro cadence forward as the MAX of the two sides.
 *
 * `retro_meta` is keyed by the bare `repoKey` and is a REPO-level cadence, so
 * taking the source value blindly would silently reset a retro reminder that was
 * about to fire on the destination. `last_retro_at` only rides along: the newer of
 * the two when either has one.
 */
function mergeRetroMeta(
  src: RetroMetaEntryType,
  dest: RetroMetaEntryType | undefined,
): RetroMetaEntryType {
  const last = [src.last_retro_at, dest?.last_retro_at].filter((v): v is string => v !== undefined)
  const newest = last.length > 0 ? last.reduce((a, b) => (a > b ? a : b)) : undefined
  return {
    phases_since_retro: Math.max(src.phases_since_retro, dest?.phases_since_retro ?? 0),
    ...(newest !== undefined ? { last_retro_at: newest } : {}),
  }
}

/** Resolved ledger entries + a `done/total` summary for the occupied refusal. */
function ledgerShape(slot: CurrentWorkflowV1Type): { done: number; total: number } {
  const entries = slot.sub_progress ?? []
  return { done: entries.filter((e) => e.status === 'done').length, total: entries.length }
}

/** True when the raw bytes self-describe as a ledger holding zero slots.
 *
 *  `readStoreAt` fail-softs "no ledger here" and "the ledger is corrupt" into the
 *  SAME empty store (its own doc note), and a legitimately empty ledger is
 *  indistinguishable from either through that seam. This is the one-line
 *  disambiguation — a structural look at the bytes, deliberately NOT a fourth copy
 *  of the typebox validation that T2 extracted `readStoreAt` to avoid. */
function selfDescribesEmptyLedger(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return false
    const wf = (parsed as { workflows?: unknown }).workflows
    return typeof wf === 'object' && wf !== null && Object.keys(wf).length === 0
  } catch {
    return false
  }
}

/** `readStoreAt` returned something indistinguishable from `emptyStore()`. */
function isVacuous(store: WorkflowStoreV1Type): boolean {
  return (
    Object.keys(store.workflows).length === 0 &&
    store.retro_meta === undefined &&
    store.intents === undefined
  )
}

/**
 * Adopt the other host's slot for this repo into this host's ledger.
 *
 * Always resolves — refusals are returned as data, never thrown, so the CLI owns
 * every message and every exit code.
 */
export async function adoptSlot(options: AdoptSlotOptions = {}): Promise<AdoptOutcome> {
  const home = options.home ?? homedir()
  const cwd = options.cwd ?? process.cwd()

  // 1. Who am I? `resolveHostWithReason` carries the provenance D8's refusal has to
  //    name, and its descriptor holds the host's OWN stateRoot (pre-override) —
  //    exactly what a cross-root reader needs.
  const me = resolveHostWithReason(home)
  const destHost = me.descriptor.id

  // 2. Which host am I reading from?
  let from: HostId
  if (options.from !== undefined) {
    if (!isHostId(options.from)) {
      return refuse({ kind: 'unknown-from', value: options.from, known: HOST_IDS })
    }
    from = options.from
  } else {
    const others = HOST_IDS.filter((id) => id !== destHost)
    // Two hosts exist today, so `others` is a single id. A third would make the
    // inference a coin flip; `--from` becomes required rather than arbitrary.
    const inferred = others.length === 1 ? others[0] : undefined
    if (inferred === undefined) {
      return refuse({ kind: 'from-required', host: destHost, known: HOST_IDS })
    }
    from = inferred
  }

  // 3. D8 — a self-copy is never what the user meant, and the reason they landed
  //    on this host is the part they cannot see.
  if (from === destHost) {
    const other = HOST_IDS.find((id) => id !== destHost) ?? destHost
    return refuse({ kind: 'same-host', host: from, other, reason: me.reason, skipped: me.skipped })
  }

  // 4. T5 — refuse before touching either ledger when the destination cannot run
  //    anything anyway.
  if (!(await destIsSetUp(me.descriptor.commandsDir))) {
    return refuse({
      kind: 'dest-not-set-up',
      host: destHost,
      commandsDir: me.descriptor.commandsDir,
    })
  }

  // 5. D14 — "that host has no ledger" and "your ledger is damaged" are different
  //    sentences, and fail-soft (right for the passive injection path) is wrong for
  //    a command the user typed.
  const sourceRoot = descriptorFor(from, home).stateRoot
  const sourcePath = join(sourceRoot, 'workflows.json')
  if (!existsSync(sourcePath)) {
    return refuse({ kind: 'no-source-ledger', from, path: sourcePath })
  }
  const source = await readStoreAt(sourceRoot)
  if (isVacuous(source)) {
    let raw: string | undefined
    try {
      raw = await readFile(sourcePath, 'utf8')
    } catch {
      raw = undefined
    }
    if (raw === undefined || !selfDescribesEmptyLedger(raw)) {
      return refuse({ kind: 'source-ledger-unreadable', from, path: sourcePath })
    }
  }

  // 6. D9 / D10 — exactly one candidate, or refuse with the evidence.
  const key = repoKey(cwd)
  const sourceKeys = Object.keys(source.workflows)
  const candidates = findCandidateKeys(source.workflows, key)
  if (candidates.length === 0) {
    return refuse({ kind: 'no-candidate', from, repoKey: key, sourceKeys })
  }
  if (candidates.length > 1) {
    return refuse({ kind: 'ambiguous', from, candidates })
  }
  const sourceKey = candidates[0] as string
  const slot = source.workflows[sourceKey] as CurrentWorkflowV1Type

  // 7. D5 / D6 / D7 / D11 — the write. `mutateStore` is the existing locked
  //    read-modify-write of the whole store, and its lock target is the
  //    DESTINATION root, which is correct: the source is read-only and must not be
  //    locked.
  const updatedAt = new Date().toISOString()
  let archivedKey: string | undefined
  let retroMeta: RetroMetaEntryType | undefined
  try {
    await mutateStore((store) => {
      const occupant = store.workflows[key]
      if (occupant?.status === 'active') {
        throw new AdoptRefused({
          kind: 'dest-occupied',
          from,
          mine: { phase: occupant.phase, status: occupant.status, ...ledgerShape(occupant) },
          theirs: { phase: slot.phase },
        })
      }
      const workflows = { ...store.workflows }
      if (occupant?.status === 'paused') {
        // Preserve the displaced slot VERBATIM before overwriting it.
        archivedKey = `${key}${DISPLACED}${updatedAt}`
        workflows[archivedKey] = occupant
      }
      // D4 — the BARE key. D7 — stamp `updated_at` here: carrying the SOURCE host's
      // timestamp would greet the destination's first turn with the >24h stale /
      // abandoned-run warning whenever the relay crosses a day boundary (which is
      // exactly when a weekly quota reset makes someone relay).
      workflows[key] = { ...slot, updated_at: updatedAt }

      const next: WorkflowStoreV1Type = { ...store, workflows }
      // D15 — carry `retro_meta` as the max; `intents` are single-turn breadcrumbs
      // absorbed by `checkpoint start`, so carrying them would only make the
      // destination eat the source session's freestyle nag.
      const srcRetro = source.retro_meta?.[key]
      if (srcRetro) {
        retroMeta = mergeRetroMeta(srcRetro, store.retro_meta?.[key])
        next.retro_meta = { ...(store.retro_meta ?? {}), [key]: retroMeta }
      }
      return next
    })
  } catch (e) {
    if (e instanceof AdoptRefused) return refuse(e.refusal)
    throw e
  }

  return {
    ok: true,
    from,
    to: destHost,
    key,
    sourceKey,
    sourceRoot,
    destRoot: getHarnessedRoot(),
    phase: slot.phase,
    status: slot.status,
    // D12 — verbatim. The evidence file itself is NOT copied.
    evidencePath: slot.last_checkpoint_path,
    updatedAt,
    ...(archivedKey !== undefined ? { archivedKey } : {}),
    ...(retroMeta !== undefined ? { retroMeta } : {}),
  }
}
