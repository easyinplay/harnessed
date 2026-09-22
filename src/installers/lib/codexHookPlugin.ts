// v16.0 Phase 64 (ADR 0041) — codex hooks ride a LOCAL codex plugin.
//
// harnessed never writes ~/.codex/hooks.json (its trust keys are positional — a
// harnessed edit would shift and poison other hooks' keys) nor config.toml (TOML
// is codex's to write). Instead every first-party hook manifest becomes one
// plugin `harnessed-<manifest>@harnessed-local` in a harnessed-owned local
// marketplace (~/.codex/harnessed/marketplace), installed with `codex plugin add`.
//
// Trust contract (measured, codex-cli 0.154/0.155 + codex-rs hooks discovery):
// codex hashes the UNEXPANDED hook entry, so the `command` literal must survive
// upgrades, reinstalls and a moved node byte-for-byte. It therefore names only
// `${PLUGIN_ROOT}` (expanded by codex) and an UNQUOTED PATH-resolved first token
// — codex runs hook commands through the user's shell, and pwsh rejects a quoted
// first token (`"C:/x/node.exe" …` is a syntax error there). The moving part (where
// the harnessed assets live) sits in `${PLUGIN_DATA}/install.json`, read by the
// shim at run time — updating it never changes the hash.
//
// Pure module: builds file contents only. The installer (codexHookAdd.ts) owns fs
// + codex CLI + trust RPC.

import { hookScriptMarker } from './hookEntry.js'

export const CODEX_HOOK_MARKETPLACE = 'harnessed-local'
/** Plugin format version: bump only when the generated layout/shim changes.
 *  (Re-running `codex plugin add` refreshes the cache copy regardless — measured.) */
export const CODEX_HOOK_PLUGIN_VERSION = '1.0.0'

export type CodexHookMode = 'npm' | 'binary'

export interface HookIdentity {
  id: string
  args: string[]
}

export interface CodexHookSpec {
  manifestName: string
  event: string
  matcher?: string
  hookCommand: string
}

export interface RenderedFile {
  /** Path relative to the marketplace root, forward slashes. */
  path: string
  content: string
}

/** Hook ids that have a codex port (R2). stop-hook reads Claude Code transcript
 *  shapes — no codex counterpart, so stop-hook-recover stays claude-only. */
const PORTABLE_IDS: ReadonlySet<string> = new Set(['inject-state', 'check-docs'])
/** Ids whose behavior depends on the host: codex hook processes carry NO CODEX_*
 *  env (measured), so the host must be passed explicitly (R3). check-docs joined
 *  after the three-shell contract test: codex runs hooks via `pwsh -NoProfile
 *  -Command` on Windows, which collapses any non-zero exit to 1, so the exit-2
 *  PreToolUse block never reaches codex — under codex the gate answers with the
 *  JSON `permissionDecision: deny` form on stdout (exit 0) instead. */
const HOST_AWARE_IDS: ReadonlySet<string> = new Set(['inject-state', 'check-docs'])

export function codexHookPluginName(manifestName: string): string {
  return `harnessed-${manifestName}`
}

/** `harnessed-<m>@harnessed-local` — the id `codex plugin add/remove/list` use. */
export function codexHookPluginId(manifestName: string): string {
  return `${codexHookPluginName(manifestName)}@${CODEX_HOOK_MARKETPLACE}`
}

/** First-party identity of a manifest hook_command + the arguments after it
 *  (same identity rules as the claude path — hookEntry.hookScriptMarker). */
export function parseHookIdentity(hookCommand: string): HookIdentity | null {
  const id = hookScriptMarker(hookCommand)
  if (id === null) return null
  const tokens = hookCommand.split(/\s+/).filter((t) => t.length > 0)
  const at = tokens.findIndex((t) => t.replace(/^"|"$/g, '').includes(id))
  if (at < 0 || !/^[a-z][a-z-]*$/.test(id)) return null
  return { id, args: tokens.slice(at + 1) }
}

export function isCodexPortableHook(hookCommand: string): boolean {
  const ident = parseHookIdentity(hookCommand)
  return ident !== null && PORTABLE_IDS.has(ident.id)
}

/** The hash-stable command literal (R4). `command` and `commandWindows` use it verbatim. */
export function codexHookCommand(ident: HookIdentity, mode: CodexHookMode): string {
  const host = HOST_AWARE_IDS.has(ident.id) ? ['--platform', 'codex'] : []
  const head = mode === 'npm' ? ['node', '"${PLUGIN_ROOT}/hook.cjs"'] : ['harnessed']
  return [...head, ident.id, ...ident.args, ...host].join(' ')
}

/** Deterministic trust key for the single group/handler we generate (measured shape). */
export function codexHookTrustKey(pluginName: string, event: string): string {
  const snake = event.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
  return `${pluginName}@${CODEX_HOOK_MARKETPLACE}:hooks/hooks.json:${snake}:0:0`
}

export function codexMarketplaceJson(pluginNames: readonly string[]): object {
  return {
    name: CODEX_HOOK_MARKETPLACE,
    owner: { name: 'harnessed' },
    plugins: [...pluginNames].sort().map((name) => ({
      name,
      source: `./plugins/${name}`,
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      version: CODEX_HOOK_PLUGIN_VERSION,
    })),
  }
}

export interface CodexInstallInfo {
  mode: CodexHookMode
  /** harnessed assets root (npm: package root) — the shim resolves bin/ + dist/ here. */
  assetsRoot: string
  harnessedVersion: string
}

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`

/** Plugin files for one hook manifest, or null when the hook has no codex port. */
export function renderCodexHookPlugin(
  spec: CodexHookSpec,
  mode: CodexHookMode,
): { pluginName: string; files: RenderedFile[] } | null {
  const ident = parseHookIdentity(spec.hookCommand)
  if (ident === null || !PORTABLE_IDS.has(ident.id)) return null
  const pluginName = codexHookPluginName(spec.manifestName)
  const command = codexHookCommand(ident, mode)
  const group = {
    ...(spec.matcher !== undefined ? { matcher: spec.matcher } : {}),
    hooks: [{ type: 'command', command, commandWindows: command }],
  }
  const base = `plugins/${pluginName}`
  const files: RenderedFile[] = [
    {
      path: `${base}/.codex-plugin/plugin.json`,
      content: json({
        name: pluginName,
        description: `harnessed first-party hook (${spec.manifestName}) for codex`,
        version: CODEX_HOOK_PLUGIN_VERSION,
        author: { name: 'harnessed' },
      }),
    },
    { path: `${base}/hooks/hooks.json`, content: json({ hooks: { [spec.event]: [group] } }) },
  ]
  if (mode === 'npm') files.push({ path: `${base}/hook.cjs`, content: CODEX_HOOK_SHIM })
  return { pluginName, files }
}

/**
 * npm-mode shim (`${PLUGIN_ROOT}/hook.cjs <id> [args]`). Reads install.json from
 * `${PLUGIN_DATA}` (fallback: beside itself), then runs the first-party entry IN
 * PROCESS — `bin/harnessed-<id>.mjs` when it exists, else the CLI `dist/cli.mjs`
 * (its argv is already `<id> [args]`). One node start per hook; stdin, stdout and
 * the exit code pass straight through. Fail-soft: no install info / missing entry
 * → exit 0 silently (a hook must never wedge the session).
 */
export const CODEX_HOOK_SHIM = `#!/usr/bin/env node
// harnessed codex hook shim — GENERATED by \`harnessed install\` (ADR 0041). Do not edit:
// the hook command that runs this file is hash-trusted by codex; this file is not.
'use strict'
const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')

function installInfo() {
  for (const dir of [process.env.PLUGIN_DATA, __dirname]) {
    if (!dir) continue
    try {
      return JSON.parse(readFileSync(join(dir, 'install.json'), 'utf8'))
    } catch {}
  }
  return null
}

const id = process.argv[2]
const info = installInfo()
if (!info || typeof info.assetsRoot !== 'string' || !/^[a-z][a-z-]*$/.test(id || '')) process.exit(0)
const bin = join(info.assetsRoot, 'bin', 'harnessed-' + id + '.mjs')
const target = existsSync(bin) ? bin : join(info.assetsRoot, 'dist', 'cli.mjs')
import(pathToFileURL(target).href).catch(() => process.exit(0))
`
