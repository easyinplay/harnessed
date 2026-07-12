// v4.20.0 hotfix (dogfood, pre-release gate) — CC hook entry shape + command
// resolution helpers for cc-hook-add.
//
// Dogfood report (perturn-inject on a user machine): the installer wrote
//   { "command": "node bin/harnessed-inject-state.mjs" }
// into settings.hooks.UserPromptSubmit[] — DOUBLE bug:
//   1. shape — Claude Code's settings schema requires
//      { matcher?, hooks: [{ type: 'command', command }] }; the flat form fails
//      CC validation ("hooks.UserPromptSubmit.1.hooks: Expected array").
//   2. path — `bin/harnessed-inject-state.mjs` is package-relative; as written
//      it only resolves when the session cwd happens to contain that file, so
//      the hook errors on every prompt in every other project.
// This module is the single SoT for the CORRECT entry shape, install-time
// absolute-path resolution (against the assets root — B2 bundles bin/ into the
// unpacked assets, npm mode = package root), and legacy/broken entry matching
// for self-heal migration + uninstall.
//
// Pure functions with injected deps (exists/assetsRoot) — new module rather
// than new exports on ccHookAdd.ts/idempotent.ts (mock-export-gap 教训).

import { join } from 'node:path'

/** Correct CC settings shape: one group per registration. */
export interface HookGroup {
  matcher?: string
  hooks: { type: string; command: string }[]
}

/** Legacy flat form the pre-4.20.0 installer wrote (and hand-fixed variants). */
export interface LegacyFlatHook {
  matcher?: string
  command: string
}

export type AnyHookEntry = Partial<HookGroup> & Partial<LegacyFlatHook>

export interface HookCmdDeps {
  /** Assets root the package-relative script tokens resolve against. */
  assetsRoot: () => string
  exists: (p: string) => boolean
  /** 4.27.0 (B3 T1 / D6) — compiled-mode routing: when non-null, the inject
   *  hook resolves to `"<binary>" inject-state` (no host node needed). npm
   *  mode returns null and the legacy node+mjs resolution applies. */
  compiledExecPath?: () => string | null
}

/** Normalized registration identities for first-party harnessed hooks whose npm
 *  form is `node …/harnessed-<id>.mjs` and compiled form is `"<binary>" <id>`.
 *  Both forms share ONE identity so entryMatchesRegistration migrates/dedupes
 *  across mode switches in either direction. 4.30.0 added `stop-hook` (issue #6)
 *  alongside 4.27.0's `inject-state`. */
const COMPILED_HOOK_IDENTITIES = ['inject-state', 'stop-hook'] as const

const ABSOLUTE_RE = /^([A-Za-z]:[\\/]|[\\/])/

/** A token is a package-relative file candidate when it has a path separator,
 *  is not absolute, and has no shell-glob/expansion chars. */
function isRelativeFileToken(token: string): boolean {
  if (!/[\\/]/.test(token)) return false
  if (ABSOLUTE_RE.test(token)) return false
  if (/[*?$`]/.test(token)) return false
  return true
}

function stripQuotes(token: string): { bare: string; quoted: boolean } {
  const m = token.match(/^"(.*)"$/)
  if (m?.[1] !== undefined) return { bare: m[1], quoted: true }
  return { bare: token, quoted: false }
}

/**
 * Resolve package-relative file tokens in a hook command to absolute paths
 * under the assets root. Tokens that do not exist there are left verbatim
 * (fail-open: an unknown relative token may be intentional). The `node`
 * executable token stays a bare PATH lookup (binary users without node = D6
 * known limitation).
 *
 * v4.21.0 dogfood — resolved paths are emitted FORWARD-SLASH + ALWAYS quoted:
 * CC executes hook commands through a shell where unquoted `C:\Users\...`
 * backslashes are eaten as escapes (`C:Users...` → node MODULE_NOT_FOUND at
 * cjs/loader on every prompt, user report). Forward-slash + quoted is the
 * proven-working convention of every other node hook in real settings.json
 * files (node accepts `/` on Windows).
 */
export function resolveHookCommand(raw: string, deps: HookCmdDeps): string {
  // 4.27.0 (B3 T1) / 4.30.0 (issue #6) — compiled binaries route first-party
  // hooks to themselves: `"<binary>" <id>`. Forward-slash + quoted (v4.21.0
  // shell-escape contract). Other hooks keep the legacy resolution untouched.
  const marker = deps.compiledExecPath ? hookScriptMarker(raw) : null
  if (
    deps.compiledExecPath &&
    marker &&
    (COMPILED_HOOK_IDENTITIES as readonly string[]).includes(marker)
  ) {
    const exe = deps.compiledExecPath()
    if (exe) return `"${exe.replace(/\\/g, '/')}" ${marker}`
  }
  let root: string | null = null
  const tokens = raw.split(/\s+/).filter((t) => t.length > 0)
  const out = tokens.map((token) => {
    const { bare } = stripQuotes(token)
    if (!isRelativeFileToken(bare)) return token
    root = root ?? deps.assetsRoot()
    const abs = join(root, bare)
    if (!deps.exists(abs)) return token
    return `"${abs.replace(/\\/g, '/')}"`
  })
  return out.join(' ')
}

/** Identity marker for "this entry belongs to this hook registration": the
 *  basename of the first package-relative file token, or null when the command
 *  has none (identity falls back to exact command match).
 *
 *  4.27.0 (B3 T1) — the inject hook's identity is NORMALIZED to `inject-state`
 *  so the npm form (`node …/harnessed-inject-state.mjs`) and the compiled form
 *  (`"<binary>" inject-state`) share ONE registration identity — the substring
 *  match in entryMatchesRegistration then migrates/dedupes across mode
 *  switches in both directions (no orphan hooks, no double registration). */
export function hookScriptMarker(raw: string): string | null {
  for (const token of raw.split(/\s+/)) {
    const { bare } = stripQuotes(token)
    if (isRelativeFileToken(bare)) {
      const seg = bare.split(/[\\/]/)
      const base = seg[seg.length - 1] ?? null
      // npm form: harnessed-<id>.mjs basename normalizes to its known identity.
      const id = COMPILED_HOOK_IDENTITIES.find((k) => base?.includes(k))
      if (id) return id
      return base
    }
  }
  // compiled form: no relative file token — the bare subcommand token IS the identity
  for (const token of raw.split(/\s+/)) {
    const { bare } = stripQuotes(token)
    if ((COMPILED_HOOK_IDENTITIES as readonly string[]).includes(bare)) return bare
  }
  return null
}

function entryCommands(entry: AnyHookEntry): string[] {
  const cmds: string[] = []
  if (typeof entry.command === 'string') cmds.push(entry.command)
  if (Array.isArray(entry.hooks)) {
    for (const h of entry.hooks) {
      if (h && typeof h.command === 'string') cmds.push(h.command)
    }
  }
  return cmds
}

/** Does this settings entry (flat legacy OR nested) belong to our registration?
 *  Match by script marker when the command carries one; else exact raw/resolved
 *  command equality. Matcher is deliberately NOT part of the identity — the
 *  migration collapses shape/path variants of the same script. */
export function entryMatchesRegistration(
  entry: AnyHookEntry,
  raw: string,
  resolved: string,
  marker: string | null,
): boolean {
  const cmds = entryCommands(entry)
  if (cmds.length === 0) return false
  if (marker) return cmds.some((c) => c.includes(marker))
  return cmds.some((c) => c === raw || c === resolved)
}

/** The single corrected entry this registration should own. */
export function desiredHookEntry(matcher: string | undefined, resolvedCmd: string): HookGroup {
  return {
    ...(matcher !== undefined ? { matcher } : {}),
    hooks: [{ type: 'command', command: resolvedCmd }],
  }
}

/** Deep-equal against the desired shape (order-insensitive on keys, exact on content). */
export function isDesiredHookEntry(
  entry: AnyHookEntry,
  matcher: string | undefined,
  resolvedCmd: string,
): boolean {
  if (typeof entry.command === 'string') return false // legacy flat form
  if (entry.matcher !== matcher) return false
  if (!Array.isArray(entry.hooks) || entry.hooks.length !== 1) return false
  const h = entry.hooks[0]
  return !!h && h.type === 'command' && h.command === resolvedCmd
}

/**
 * Shape-aware installed probe for cc-hook-add (consumed by isAlreadyInstalled —
 * AUTHORITATIVE, no shell-grep fallback: the legacy `grep -q <marker>` matches
 * broken flat/relative entries too, which made optional-offer/setup skip the
 * very installs that need the self-heal migration).
 */
export function detectCcHookInstalled(
  settingsRaw: string | null,
  ev: string,
  raw: string,
  matcher: string | undefined,
  deps: HookCmdDeps,
): boolean {
  if (settingsRaw === null) return false
  let parsed: { hooks?: Record<string, AnyHookEntry[]> }
  try {
    parsed = JSON.parse(settingsRaw) as { hooks?: Record<string, AnyHookEntry[]> }
  } catch {
    return false
  }
  const arr = parsed.hooks?.[ev]
  if (!Array.isArray(arr)) return false
  const resolved = resolveHookCommand(raw, deps)
  const marker = hookScriptMarker(raw)
  const matching = arr.filter((e) => entryMatchesRegistration(e, raw, resolved, marker))
  return matching.length === 1 && isDesiredHookEntry(matching[0] ?? {}, matcher, resolved)
}
