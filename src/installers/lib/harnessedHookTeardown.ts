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
// These helpers identify a harnessed hook registration from explicit
// first-party evidence in every shape harnessed has written:
//   npm relative : node bin/harnessed-inject-state.mjs
//   npm absolute : node "<captured-assets-root>/bin/harnessed-stop-hook.mjs"
//   compiled     : "C:/.../harnessed.exe" inject-state   (4.27.0/4.30.0)
//   bare PATH    : harnessed inject-state
//   subcommand+flags : harnessed check-docs --hook       (4.34.0/4.34.1 — the id
//                      is the subcommand; trailing flags are part of the command
//                      and must never change ownership)
// Captures assetsRoot once; hook identity checks perform no target filesystem I/O.
//
// The hook-id set + the command-string enumerator are SHARED with hookEntry.ts
// (single SoT — a drift between the two would silently skip a new hook, exactly
// the issue #8 class). Only the ABSOLUTE-token matching that hookScriptMarker
// deliberately omits lives here.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { getAssetsRoot } from '../../platform/assetsRoot.js'
import { type AnyHookEntry, COMPILED_HOOK_IDENTITIES, entryCommands } from './hookEntry.js'

export type HarnessedHookId = (typeof COMPILED_HOOK_IDENTITIES)[number]
const ID_ALT = COMPILED_HOOK_IDENTITIES.join('|')
const ABSOLUTE_RE = /^([A-Za-z]:[\\/]|[\\/])/
const CAPTURED_ASSETS_ROOT = getAssetsRoot().replace(/\\/g, '/').replace(/\/$/, '')

function pathKey(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return /^(?:[A-Za-z]:\/|\/\/)/.test(normalized) ? normalized.toLowerCase() : normalized
}

function commandScriptPath(raw: string, id: HarnessedHookId): string | null {
  const match = raw.match(/^\s*(?:node|bun)\s+(?:"([^"]+)"|'([^']+)'|(\S+))(?:\s|$)/)
  const path = match?.[1] ?? match?.[2] ?? match?.[3]
  if (!path) return null
  const normalized = path.replace(/\\/g, '/')
  return pathKey(normalized).split('/').at(-1) === `harnessed-${id}.mjs` ? normalized : null
}

function isTrustedScriptPath(path: string, id: HarnessedHookId): boolean {
  const file = `harnessed-${id}.mjs`
  const relative = path.replace(/^\.\//, '')
  if (relative === `bin/${file}`) return true
  if (!ABSOLUTE_RE.test(path)) return false
  const resolved = `${CAPTURED_ASSETS_ROOT}/bin/${file}`
  if (pathKey(path) === pathKey(resolved)) return true
  const versioned = new RegExp(`^(.+/assets/)[^/]+(/bin/${file})$`)
  const candidate = pathKey(path).match(versioned)
  const captured = pathKey(resolved).match(versioned)
  if (!candidate || !captured) return false
  return candidate[1] === captured[1] && candidate[2] === captured[2]
}

function trustedCompiledPaths(): Set<string> {
  const paths = new Set<string>()
  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) paths.add(pathKey(join(localAppData, 'harnessed', 'bin', 'harnessed.exe')))
  paths.add(pathKey(join(homedir(), 'AppData', 'Local', 'harnessed', 'bin', 'harnessed.exe')))
  paths.add(pathKey(join(homedir(), '.local', 'bin', 'harnessed')))
  return paths
}

function commandBinaryPath(raw: string, id: HarnessedHookId): string | null {
  const match = raw.match(new RegExp(`^\\s*(?:"([^"]+)"|'([^']+)'|(\\S+))\\s+${id}(?:\\s|$)`))
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

/** Which harnessed hook (if any) this recorded command string belongs to. */
export function harnessedHookIdentity(raw: string): HarnessedHookId | null {
  for (const id of COMPILED_HOOK_IDENTITIES) {
    const scriptPath = commandScriptPath(raw, id)
    if (scriptPath && isTrustedScriptPath(scriptPath, id)) return id
    const binaryPath = commandBinaryPath(raw, id)
    if (binaryPath === 'harnessed') return id
    if (binaryPath && trustedCompiledPaths().has(pathKey(binaryPath))) return id
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
