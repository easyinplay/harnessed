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
//
// The hook-id set + the command-string enumerator are SHARED with hookEntry.ts
// (single SoT — a drift between the two would silently skip a new hook, exactly
// the issue #8 class). Only the ABSOLUTE-token matching that hookScriptMarker
// deliberately omits lives here.

import { type AnyHookEntry, COMPILED_HOOK_IDENTITIES, entryCommands } from './hookEntry.js'

export type HarnessedHookId = (typeof COMPILED_HOOK_IDENTITIES)[number]
/** `inject-state|stop-hook` — the id alternation for building matchers. */
const ID_ALT = COMPILED_HOOK_IDENTITIES.join('|')
// A first-party token must start at a command boundary (start-of-string, space,
// quote, or path separator) — NOT mid-token — so a user's own
// `team-harnessed-stop-hook.mjs` / `myharnessed.exe` is never mis-owned and
// silently deleted. `=` covers `--flag=…harnessed…` style tokens.
const LEFT = `(?:^|[\\s"'=/\\\\])`

/** Which harnessed hook (if any) this recorded command string belongs to. */
export function harnessedHookIdentity(raw: string): HarnessedHookId | null {
  for (const id of COMPILED_HOOK_IDENTITIES) {
    // npm form: the script basename harnessed-<id>.mjs, boundary-anchored on
    // BOTH sides (`team-harnessed-stop-hook.mjs` / `harnessed-inject-statement.mjs`
    // must NOT match).
    if (new RegExp(`${LEFT}harnessed-${id}\\.mjs(?:["']|\\s|$)`).test(raw)) return id
    // compiled/bare form: `harnessed[.exe][" ] <id>` as a boundary-anchored word.
    if (new RegExp(`${LEFT}harnessed(?:\\.exe)?["']?\\s+${id}(?:\\s|$)`).test(raw)) return id
  }
  return null
}

/** Filesystem path the hook points at (script for npm form, binary for compiled),
 *  for staleness (existence) checks. Only reached AFTER harnessedHookIdentity has
 *  confirmed ownership, so it can be lenient. Quoted paths may contain spaces
 *  (e.g. `C:/Program Files/...`) — capture the WHOLE quoted token, not up to the
 *  first space. A bare `harnessed` PATH token is returned verbatim (unstattable —
 *  caller skips the staleness verdict). */
export function harnessedHookScriptPath(raw: string): string | null {
  // quoted .mjs (may contain spaces): "…harnessed-<id>.mjs" or '…'
  const qMjs =
    raw.match(new RegExp(`"([^"]*harnessed-(?:${ID_ALT})\\.mjs)"`)) ??
    raw.match(new RegExp(`'([^']*harnessed-(?:${ID_ALT})\\.mjs)'`))
  if (qMjs?.[1]) return qMjs[1]
  // unquoted .mjs (no spaces)
  const uMjs = raw.match(new RegExp(`(?:^|\\s)([^\\s"']*harnessed-(?:${ID_ALT})\\.mjs)`))
  if (uMjs?.[1]) return uMjs[1]
  // quoted binary (may contain spaces): "…harnessed[.exe]" <id>
  const qBin =
    raw.match(new RegExp(`"([^"]*harnessed(?:\\.exe)?)"\\s+(?:${ID_ALT})\\b`)) ??
    raw.match(new RegExp(`'([^']*harnessed(?:\\.exe)?)'\\s+(?:${ID_ALT})\\b`))
  if (qBin?.[1]) return qBin[1]
  // bare binary: harnessed[.exe] <id>
  const bBin = raw.match(new RegExp(`(?:^|\\s)(harnessed(?:\\.exe)?)\\s+(?:${ID_ALT})\\b`))
  if (bBin?.[1]) return bBin[1]
  return null
}

/** Is this a harnessed-owned command string? */
function isHarnessedCmd(cmd: string): boolean {
  return harnessedHookIdentity(cmd) !== null
}

/** MUTATES the hooks map: drop every harnessed-owned registration across all
 *  events, prune events that become empty. Filters at the INNER hooks[] level so
 *  a group holding both a harnessed hook AND a user's sibling hook keeps the
 *  sibling (never silently delete unrelated registrations). Returns how many
 *  harnessed commands were removed. */
export function stripHarnessedHooks(hooks: Record<string, AnyHookEntry[]>): { removed: number } {
  let removed = 0
  for (const ev of Object.keys(hooks)) {
    const arr = hooks[ev]
    if (!Array.isArray(arr)) continue
    const kept: AnyHookEntry[] = []
    for (const entry of arr) {
      if (!entry || typeof entry !== 'object') {
        kept.push(entry)
        continue
      }
      // legacy flat form: a single command lives on the entry itself.
      if (typeof entry.command === 'string' && isHarnessedCmd(entry.command)) {
        removed++
        continue // drop the whole flat entry
      }
      // nested group: filter harnessed inner hooks, preserve any siblings.
      if (Array.isArray(entry.hooks)) {
        const before = entry.hooks.length
        entry.hooks = entry.hooks.filter(
          (h) => !(h && typeof h.command === 'string' && isHarnessedCmd(h.command)),
        )
        removed += before - entry.hooks.length
        if (entry.hooks.length === 0 && typeof entry.command !== 'string') continue // emptied → drop
      }
      kept.push(entry)
    }
    if (kept.length === 0) delete hooks[ev]
    else hooks[ev] = kept
  }
  return { removed }
}

/** Non-mutating count of harnessed-owned hook COMMANDS across all events (same
 *  granularity as stripHarnessedHooks' `removed`, so summary == removal). */
export function countHarnessedHooks(hooks: Record<string, AnyHookEntry[]>): number {
  let n = 0
  for (const arr of Object.values(hooks)) {
    if (!Array.isArray(arr)) continue
    for (const entry of arr) n += entryCommands(entry).filter(isHarnessedCmd).length
  }
  return n
}

const ABSOLUTE_RE = /^([A-Za-z]:[\\/]|[\\/])/

/** Harnessed hook registrations pointing at a script that cannot resolve, so the
 *  hook errors MODULE_NOT_FOUND every prompt (issue #8). Reports:
 *   - an ABSOLUTE `.mjs`/binary path that does not exist (package deleted), and
 *   - a RELATIVE `.mjs` path (the pre-4.20.0 broken shape — resolves against the
 *     session cwd, so it errors in every project that lacks the file; harnessed
 *     never writes relative post-4.20.0, so any relative harnessed .mjs is an
 *     orphan). A bare `harnessed` PATH token is a legit compiled-binary lookup —
 *     unstattable → skipped (never a false-positive warn). */
export function harnessedStaleHookPaths(
  hooks: Record<string, AnyHookEntry[]>,
  exists: (p: string) => boolean,
): { event: string; path: string }[] {
  const out: { event: string; path: string }[] = []
  for (const [event, arr] of Object.entries(hooks)) {
    if (!Array.isArray(arr)) continue
    for (const entry of arr) {
      for (const cmd of entryCommands(entry)) {
        if (harnessedHookIdentity(cmd) === null) continue
        const path = harnessedHookScriptPath(cmd)
        if (!path) continue
        if (ABSOLUTE_RE.test(path)) {
          if (!exists(path)) out.push({ event, path })
        } else if (/\.mjs$/.test(path)) {
          out.push({ event, path }) // relative script → broken regardless of cwd
        }
      }
    }
  }
  return out
}
