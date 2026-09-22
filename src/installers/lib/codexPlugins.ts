// v16.0 Phase 64 (R6) — "which codex plugins are installed", from the codex CLI.
//
// Replaces the `[plugins."<p>@<m>"]` header regex over ~/.codex/config.toml: that
// file is codex's to read (it also holds credentials) and ADR 0041 keeps harnessed
// code out of it. Measured on codex-cli 0.155.1: `codex plugin list --json` →
// {installed:[{pluginId, installed, enabled, …}], available:[…]}. `available`
// entries — and the "not installed" rows of the plain table, which is the
// fallback for a codex without --json — must never count as installed.
//
// One spawn costs ~1.7 s, and setup probes many manifests, so the listing is
// memoized per process; installers invalidate it after they add/remove a plugin.
// Own module (not a readClaudeConfig export): tests factory-mock readClaudeConfig.

import { runHarnessArgs } from './runClaudeArgs.js'
import { getMcpSpawnCwd } from './safeCwd.js'

/** Installed plugin ids (`<plugin>@<marketplace>`), or null when unrecognizable. */
export function parseCodexPluginList(stdout: string): Set<string> | null {
  const text = stdout.trim()
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { installed?: unknown }
      if (!Array.isArray(parsed.installed)) return null
      const ids = new Set<string>()
      for (const p of parsed.installed as { pluginId?: unknown; installed?: unknown }[]) {
        if (p?.installed === true && typeof p.pluginId === 'string') ids.add(p.pluginId)
      }
      return ids
    } catch {
      return null
    }
  }
  if (!/^PLUGIN\s+STATUS\b/m.test(text)) return null
  const ids = new Set<string>()
  for (const m of text.matchAll(/^(\S+@\S+)\s+installed\b/gm)) if (m[1]) ids.add(m[1])
  return ids
}

let cache: Promise<Set<string> | null> | null = null

export function invalidateCodexPluginCache(): void {
  cache = null
}

async function listOnce(): Promise<Set<string> | null> {
  const cwd = getMcpSpawnCwd()
  const json = await runHarnessArgs('codex', ['plugin', 'list', '--json'], cwd, 30_000)
  const fromJson = json.exitCode === 0 ? parseCodexPluginList(json.stdout) : null
  if (fromJson) return fromJson
  if (json.exitCode === -1) return null // codex missing / timed out — a second spawn won't help
  const table = await runHarnessArgs('codex', ['plugin', 'list'], cwd, 30_000)
  return table.exitCode === 0 ? parseCodexPluginList(table.stdout) : null
}

/** Memoized installed set; null = unknown (codex absent / unparseable). */
export function listInstalledCodexPlugins(): Promise<Set<string> | null> {
  cache = cache ?? listOnce()
  return cache
}

/** `name` bare (`warp`, any marketplace) or qualified (`warp@codex-warp`). */
export async function isCodexPluginInstalled(name: string): Promise<boolean> {
  const ids = await listInstalledCodexPlugins()
  if (!ids) return false
  if (name.includes('@')) return ids.has(name)
  for (const id of ids) if (id.split('@')[0] === name) return true
  return false
}

let lock: Promise<unknown> = Promise.resolve()

/** R5 — codex plugin operations run one at a time: concurrent `codex plugin add`
 *  processes each rewrite config.toml and can lose each other's edits. */
export function withCodexPluginLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn)
  lock = run.catch(() => undefined)
  return run
}
