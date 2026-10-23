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

import { resolve } from 'node:path'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'
import { runHarnessArgs } from './runClaudeArgs.js'
import { getMcpSpawnCwd } from './safeCwd.js'

/** Installed plugin ids (`<plugin>@<marketplace>`), or null when unrecognizable. */
export interface CodexPluginMetadata {
  readonly pluginId: string
  readonly installed: true
  readonly enabled: boolean | null
}

export function parseCodexPluginMetadata(stdout: string): readonly CodexPluginMetadata[] | null {
  const text = stdout.trim()
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { installed?: unknown }
      if (!Array.isArray(parsed.installed)) return null
      const entries: CodexPluginMetadata[] = []
      for (const p of parsed.installed as {
        pluginId?: unknown
        installed?: unknown
        enabled?: unknown
      }[]) {
        if (
          !p ||
          typeof p.installed !== 'boolean' ||
          typeof p.pluginId !== 'string' ||
          !/^\S+@\S+$/.test(p.pluginId)
        )
          return null
        if (p.installed)
          entries.push({
            pluginId: p.pluginId,
            installed: true,
            enabled: typeof p.enabled === 'boolean' ? p.enabled : null,
          })
      }
      return entries
    } catch {
      return null
    }
  }
  if (!/^PLUGIN\s+STATUS\b/m.test(text)) return null
  const entries: CodexPluginMetadata[] = []
  for (const m of text.matchAll(/^(\S+@\S+)\s+installed\b([^\r\n]*)/gm)) {
    if (m[1])
      entries.push({
        pluginId: m[1],
        installed: true,
        enabled: /\bdisabled\b/.test(m[2] ?? '')
          ? false
          : /\benabled\b/.test(m[2] ?? '')
            ? true
            : null,
      })
  }
  return entries
}

export function parseCodexPluginList(stdout: string): Set<string> | null {
  const entries = parseCodexPluginMetadata(stdout)
  return entries === null ? null : new Set(entries.map((entry) => entry.pluginId))
}

const cache = new Map<string, Promise<readonly CodexPluginMetadata[] | null>>()
function cacheKey(context?: HostInstallContext): string {
  const c = context ?? captureHostInstallContext({ hostId: 'codex' })
  return JSON.stringify([c.hostId, c.os, resolve(c.userHome), resolve(c.nativeHome)])
}

export function invalidateCodexPluginCache(context?: HostInstallContext): void {
  if (context) cache.delete(cacheKey(context))
  else cache.clear()
}

async function listOnce(
  context?: HostInstallContext,
): Promise<readonly CodexPluginMetadata[] | null> {
  if (context && context.hostId !== 'codex') return null
  const cwd = getMcpSpawnCwd(context)
  const run = (args: string[]) =>
    context
      ? runHarnessArgs('codex', args, cwd, 30_000, context)
      : runHarnessArgs('codex', args, cwd, 30_000)
  try {
    const json = await run(['plugin', 'list', '--json'])
    const fromJson = json.exitCode === 0 ? parseCodexPluginMetadata(json.stdout) : null
    if (fromJson) return fromJson
    if (json.exitCode === -1) return null // codex missing / timed out — a second spawn won't help
    const table = await run(['plugin', 'list'])
    return table.exitCode === 0 ? parseCodexPluginMetadata(table.stdout) : null
  } catch {
    return null
  }
}

/** Memoized installed set; null = unknown (codex absent / unparseable). */
export function listCodexPluginMetadata(
  context?: HostInstallContext,
): Promise<readonly CodexPluginMetadata[] | null> {
  const key = cacheKey(context)
  let result = cache.get(key)
  if (!result) {
    result = listOnce(context)
    cache.set(key, result)
  }
  return result
}

export async function listInstalledCodexPlugins(
  context?: HostInstallContext,
): Promise<Set<string> | null> {
  const entries = await listCodexPluginMetadata(context)
  return entries === null ? null : new Set(entries.map((entry) => entry.pluginId))
}

/** `name` bare (`warp`, any marketplace) or qualified (`warp@codex-warp`). */
export async function isCodexPluginInstalled(
  name: string,
  context?: HostInstallContext,
): Promise<boolean> {
  const ids = await listInstalledCodexPlugins(context)
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
