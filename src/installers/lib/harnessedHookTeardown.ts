// issue #8 — teardown/self-heal for first-party harnessed CC hooks.
//
// The manifest uninstaller (uninstallers/ccHookAdd.ts) removes a hook by
// re-resolving its CURRENT expected command and exact/marker matching. That
// path is unavailable to (a) unified `harnessed uninstall` (no manifest in
// hand) and (b) doctor self-heal on an ALREADY-ORPHANED entry whose package
// dir is gone — the recorded command is an absolute path that no longer
// resolves, and hookScriptMarker() returns null for absolute tokens (it only
// normalizes RELATIVE file tokens), so exact-match teardown misses it.
//
// These helpers identify a harnessed hook registration from the recorded
// command string ALONE, in every shape harnessed has ever written:
//   npm relative : node bin/harnessed-inject-state.mjs
//   npm absolute : node "C:/.../harnessed/bin/harnessed-stop-hook.mjs"
//   compiled     : "C:/.../harnessed.exe" inject-state   (4.27.0/4.30.0)
//   bare PATH    : harnessed inject-state
// Pure, dependency-free — safe to call from uninstall + doctor without I/O.

/** First-party hook identities harnessed installs. Mirrors
 *  installers/lib/hookEntry.ts COMPILED_HOOK_IDENTITIES. */
export type HarnessedHookId = 'inject-state' | 'stop-hook'
const IDS: readonly HarnessedHookId[] = ['inject-state', 'stop-hook']

/** Nested CC hook group OR legacy flat entry — both shapes harnessed produced. */
interface AnyEntry {
  command?: string
  hooks?: { command?: string }[]
}

/** Which harnessed hook (if any) this recorded command string belongs to. */
export function harnessedHookIdentity(raw: string): HarnessedHookId | null {
  for (const id of IDS) {
    // npm form: the script basename harnessed-<id>.mjs, at any path depth.
    // Anchor on `harnessed-<id>.mjs` so `harnessed-inject-statement.mjs` etc.
    // do not match.
    if (new RegExp(`harnessed-${id}\\.mjs(?:["']|\\s|$)`).test(raw)) return id
    // compiled/bare form: `harnessed[.exe][" ] <id>` as a whole word.
    if (new RegExp(`harnessed(?:\\.exe)?["']?\\s+${id}(?:\\s|$)`).test(raw)) return id
  }
  return null
}

/** Filesystem path the hook points at (script for npm form, binary for compiled),
 *  for staleness (existence) checks. A bare `harnessed` PATH token is returned
 *  verbatim — the caller cannot stat it and should skip the staleness verdict. */
export function harnessedHookScriptPath(raw: string): string | null {
  const mjs = raw.match(/["']?([^"'\s]*harnessed-(?:inject-state|stop-hook)\.mjs)["']?/)
  if (mjs?.[1]) return mjs[1]
  const quotedBin = raw.match(/["']([^"']*harnessed(?:\.exe)?)["']\s+(?:inject-state|stop-hook)\b/)
  if (quotedBin?.[1]) return quotedBin[1]
  const bareBin = raw.match(/(?:^|\s)(harnessed(?:\.exe)?)\s+(?:inject-state|stop-hook)\b/)
  if (bareBin?.[1]) return bareBin[1]
  return null
}

/** Recorded command strings carried by an entry (nested group + legacy flat). */
function entryCommands(entry: AnyEntry): string[] {
  const cmds: string[] = []
  if (typeof entry.command === 'string') cmds.push(entry.command)
  if (Array.isArray(entry.hooks)) {
    for (const h of entry.hooks) if (h && typeof h.command === 'string') cmds.push(h.command)
  }
  return cmds
}

function entryIsHarnessed(entry: AnyEntry): boolean {
  return entryCommands(entry).some((c) => harnessedHookIdentity(c) !== null)
}

/** MUTATES the hooks map: drop every harnessed-owned registration across all
 *  events, prune events that become empty. Returns how many were removed. */
export function stripHarnessedHooks(hooks: Record<string, AnyEntry[]>): { removed: number } {
  let removed = 0
  for (const ev of Object.keys(hooks)) {
    const arr = hooks[ev]
    if (!Array.isArray(arr)) continue
    const kept = arr.filter((entry) => {
      const owned = entryIsHarnessed(entry)
      if (owned) removed++
      return !owned
    })
    if (kept.length === 0) delete hooks[ev]
    else hooks[ev] = kept
  }
  return { removed }
}

/** Non-mutating count of harnessed-owned hook registrations across all events. */
export function countHarnessedHooks(hooks: Record<string, AnyEntry[]>): number {
  let n = 0
  for (const arr of Object.values(hooks)) {
    if (!Array.isArray(arr)) continue
    for (const entry of arr) if (entryIsHarnessed(entry)) n++
  }
  return n
}

const ABSOLUTE_RE = /^([A-Za-z]:[\\/]|[\\/])/

/** Harnessed hook registrations whose recorded ABSOLUTE script path no longer
 *  exists (issue #8: package deleted → `node <gone>.mjs` errors every prompt).
 *  Only absolute paths are reported — a bare `harnessed`/relative token can't be
 *  authoritatively resolved, so it is skipped (never a false-positive warn). */
export function harnessedStaleHookPaths(
  hooks: Record<string, AnyEntry[]>,
  exists: (p: string) => boolean,
): { event: string; path: string }[] {
  const out: { event: string; path: string }[] = []
  for (const [event, arr] of Object.entries(hooks)) {
    if (!Array.isArray(arr)) continue
    for (const entry of arr) {
      for (const cmd of entryCommands(entry)) {
        if (harnessedHookIdentity(cmd) === null) continue
        const path = harnessedHookScriptPath(cmd)
        if (path && ABSOLUTE_RE.test(path) && !exists(path)) out.push({ event, path })
      }
    }
  }
  return out
}
