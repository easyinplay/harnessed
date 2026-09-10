// Phase 56 — doctor probe for SILENTLY STALE Claude Code plugin installs.
//
// The four `cc-plugin-marketplace` manifests (superpowers / planning-with-files /
// ui-ux-pro-max / ecc) install through `claude plugin install`, which copies the
// plugin into a VERSIONED cache directory
// (~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/) and pins it there.
// Unlike the `npx --yes <pkg>@latest` manifests, nothing re-resolves latest on a
// later session: the install is frozen at the version that was current the day it
// ran, and Claude Code never says so.
//
// Measured on the dev machine 2026-09-10, all four behind at once:
//   superpowers 5.1.0 (installed 2026-05-27) vs 6.3.0
//   planning-with-files 2.34.0 vs 3.17.2
//   ui-ux-pro-max 2.5.0 vs 2.15.0
//   ecc 2.1.0 vs 2.2.1
//
// This is the ONLY place harnessed can compare a real detected version against a
// recorded one. Phase 55 investigated and rejected the same comparison at the
// installer-state layer: `HarnessedStateEntry.version` looks like a detected
// version but every caller passes a manifest-declared value
// (`install.npm_version` / `install.git_ref` / `''`), so comparing it against
// `last_known_good_version` compares a record to itself. The plugin registry's
// `version` field is genuinely observed from disk, which is what makes this
// check buildable at all.
//
// Warn, never fail: running an older plugin is degraded, not broken, and the
// upgrade is the user's call (a superpowers 5.1.0 → 6.3.0 jump changes skills the
// user is actively working inside). Reads two files, swallows every parse
// surprise — a doctor check that throws rejects doctor.ts's Promise.all and
// discards every OTHER check.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { getAssetsRoot } from '../../platform/assetsRoot.js'
import { getPluginsRegistry } from '../../platform/platform.js'
import type { CheckResult } from './check-builtin.js'
import { compareVersions } from './version-check.js'

const NAME = 'plugin install freshness'

export interface PluginStalenessDeps {
  assetsRoot: string
  registryPath: string | null
  readText: (p: string) => string | null
  listDir: (p: string) => string[] | null
  isDir: (p: string) => boolean
}

interface PluginRecord {
  /** `metadata.name`, which is also the left-of-`@` key in the plugin registry. */
  name: string
  /** `spec.upstream_health.last_known_good_version`. */
  recorded: string
}

function defaultDeps(): PluginStalenessDeps {
  return {
    assetsRoot: getAssetsRoot(),
    registryPath: getPluginsRegistry(),
    readText: (p) => {
      try {
        return readFileSync(p, 'utf8')
      } catch {
        return null
      }
    },
    listDir: (p) => {
      try {
        return readdirSync(p)
      } catch {
        return null
      }
    },
    isDir: (p) => {
      try {
        return statSync(p).isDirectory()
      } catch {
        return false
      }
    },
  }
}

/** Every manifest installed via `cc-plugin-marketplace`, with its recorded version. */
function collectPluginManifests(deps: PluginStalenessDeps): PluginRecord[] {
  const out: PluginRecord[] = []
  const root = join(deps.assetsRoot, 'manifests')
  const walk = (dir: string): void => {
    const entries = deps.listDir(dir)
    if (entries === null) return
    for (const entry of entries) {
      const full = join(dir, entry)
      if (deps.isDir(full)) {
        walk(full)
        continue
      }
      if (!entry.endsWith('.yaml') || entry.endsWith('.zh-Hans.yaml')) continue
      const raw = deps.readText(full)
      if (raw === null) continue
      let doc: unknown
      try {
        doc = parseYaml(raw)
      } catch {
        continue
      }
      const d = doc as {
        metadata?: { name?: unknown }
        spec?: {
          install?: { method?: unknown }
          upstream_health?: { last_known_good_version?: unknown }
        }
      }
      // The PRIMARY install method only. A harness_overrides entry that happens to
      // use cc-plugin-marketplace describes a different harness, and this check
      // reads Claude Code's registry.
      if (d.spec?.install?.method !== 'cc-plugin-marketplace') continue
      const name = d.metadata?.name
      const recorded = d.spec?.upstream_health?.last_known_good_version
      if (typeof name !== 'string' || typeof recorded !== 'string') continue
      out.push({ name, recorded })
    }
  }
  walk(root)
  return out
}

/** pluginName → installed version, from Claude Code's plugin registry (v2 schema). */
function readInstalledVersions(
  deps: PluginStalenessDeps,
  registryPath: string,
): Map<string, string> | null {
  const raw = deps.readText(registryPath)
  if (raw === null) return null
  let parsed: { plugins?: Record<string, unknown> }
  try {
    parsed = JSON.parse(raw) as { plugins?: Record<string, unknown> }
  } catch {
    return null
  }
  const plugins = parsed.plugins
  if (!plugins || typeof plugins !== 'object') return null
  const map = new Map<string, string>()
  for (const [key, value] of Object.entries(plugins)) {
    // Key shape is `<plugin>@<marketplace>`; the manifest knows only `<plugin>`.
    const pluginName = key.split('@')[0]
    if (!pluginName || !Array.isArray(value)) continue
    for (const entry of value) {
      const v = (entry as { version?: unknown } | null)?.version
      if (typeof v === 'string' && v.length > 0) {
        map.set(pluginName, v)
        break
      }
    }
  }
  return map
}

export function checkPluginStaleness(overrides?: Partial<PluginStalenessDeps>): CheckResult {
  const deps = { ...defaultDeps(), ...overrides }

  // codex and any other harness without a plugin registry: nothing to compare.
  if (deps.registryPath === null) {
    return { name: NAME, status: 'pass', message: 'no plugin registry on this harness' }
  }
  const installed = readInstalledVersions(deps, deps.registryPath)
  if (installed === null) {
    return { name: NAME, status: 'pass', message: 'plugin registry unreadable — skipped' }
  }

  const manifests = collectPluginManifests(deps)
  const behind: string[] = []
  let compared = 0
  for (const m of manifests) {
    const have = installed.get(m.name)
    if (have === undefined) continue // not installed — not this check's business
    compared += 1
    if (compareVersions(have, m.recorded) === 'behind') {
      behind.push(`${m.name} ${have} → ${m.recorded}`)
    }
  }

  if (compared === 0) {
    return { name: NAME, status: 'pass', message: 'no marketplace plugins installed' }
  }
  if (behind.length === 0) {
    return { name: NAME, status: 'pass', message: `${compared} marketplace plugin(s) current` }
  }
  return {
    name: NAME,
    status: 'warn',
    message:
      `${behind.length}/${compared} marketplace plugin(s) behind the version harnessed verified: ` +
      `${behind.join(', ')} — \`claude plugin install\` pins a version at install time and never re-resolves`,
    fix: `claude plugin update ${behind.map((b) => b.split(' ')[0]).join(' && claude plugin update ')}`,
  }
}
