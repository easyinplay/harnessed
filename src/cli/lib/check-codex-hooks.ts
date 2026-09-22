// v16.0 Phase 64 (ADR 0041) — doctor probe for harnessed's codex hook plugins.
//
// codex SILENTLY skips a hook that is untrusted or whose entry changed since it
// was trusted ("modified") — measured on codex-cli 0.154 (warp's five hooks sat
// modified and never ran). So "installed" is not "running": per generated plugin
// this reports
//   - installed in codex          (`codex plugin list`)
//   - trust status                (app-server hooks/list: trusted / untrusted / modified / unknown)
//   - npm shim chain              (${PLUGIN_DATA}/install.json → bin/ or dist/ entry)
//   - binary mode `harnessed`     (bare PATH lookup — the command's first token)
// Sources are exactly those + the plugin dirs; config.toml is never opened.
// Warn-only: a missing optional hook is degraded behavior, not a broken install.

import { existsSync, readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveCodexHome } from '../../installers/codexHookAdd.js'
import { binaryOnPath } from '../../installers/lib/binaryProbe.js'
import { CODEX_HOOK_MARKETPLACE } from '../../installers/lib/codexHookPlugin.js'
import {
  type CodexHookEntry,
  listCodexHooks,
  type RpcOutcome,
} from '../../installers/lib/codexHookTrust.js'
import { listInstalledCodexPlugins } from '../../installers/lib/codexPlugins.js'
import { detectPlatform } from '../../platform/platform.js'
import type { CheckResult } from './check-builtin.js'

export interface CodexHooksDeps {
  platformId: string
  codexHome: string
  join: (...parts: string[]) => string
  pluginDirs: () => Promise<string[]>
  installedPlugins: () => Promise<Set<string> | null>
  listHooks: () => Promise<RpcOutcome<CodexHookEntry[]>>
  readText: (p: string) => string | null
  exists: (p: string) => boolean
  onPath: (bin: string) => boolean
}

const NAME = 'codex hook plugins'

function defaultDeps(): CodexHooksDeps {
  const codexHome = resolveCodexHome()
  return {
    platformId: detectPlatform().id,
    codexHome,
    join,
    pluginDirs: async () => {
      try {
        return (await readdir(join(codexHome, 'harnessed', 'marketplace', 'plugins'))).filter((n) =>
          n.startsWith('harnessed-'),
        )
      } catch {
        return []
      }
    },
    installedPlugins: listInstalledCodexPlugins,
    listHooks: () => listCodexHooks(),
    readText: (p) => {
      try {
        return readFileSync(p, 'utf8')
      } catch {
        return null
      }
    },
    exists: existsSync,
    onPath: (bin) => binaryOnPath(bin),
  }
}

/** First-party hook id named by the plugin's generated hooks.json command
 *  (`… hook.cjs" <id> …` / `harnessed <id> …`); null when unreadable. */
function hookIdOf(d: CodexHooksDeps, pluginName: string): string | null {
  const raw = d.readText(
    d.join(d.codexHome, 'harnessed', 'marketplace', 'plugins', pluginName, 'hooks', 'hooks.json'),
  )
  let command = ''
  try {
    const hooks = (JSON.parse(raw ?? '{}') as { hooks?: Record<string, unknown[]> }).hooks ?? {}
    const group = Object.values(hooks)[0]?.[0] as { hooks?: { command?: string }[] } | undefined
    command = group?.hooks?.[0]?.command ?? ''
  } catch {
    return null
  }
  const m = command.match(/(?:hook\.cjs"|^harnessed) ([a-z][a-z-]*)/)
  return m?.[1] ?? null
}

/** The shim chain problem for one plugin, or null when it resolves. */
function chainProblem(d: CodexHooksDeps, pluginName: string, id: string | null): string | null {
  const infoPath = d.join(
    d.codexHome,
    'plugins',
    'data',
    `${pluginName}-${CODEX_HOOK_MARKETPLACE}`,
    'install.json',
  )
  let info: { mode?: string; assetsRoot?: string } | null = null
  try {
    info = JSON.parse(d.readText(infoPath) ?? 'null')
  } catch {
    info = null
  }
  if (!info || typeof info.assetsRoot !== 'string') return 'shim: install.json missing'
  if (info.mode === 'binary')
    return d.onPath('harnessed') ? null : '`harnessed` not on PATH (binary-mode hook command)'
  // the shim runs bin/harnessed-<id>.mjs when present, else the CLI entry
  const bin = id ? d.join(info.assetsRoot, 'bin', `harnessed-${id}.mjs`) : null
  const cli = d.join(info.assetsRoot, 'dist', 'cli.mjs')
  return (bin && d.exists(bin)) || d.exists(cli) ? null : `shim: no entry under ${info.assetsRoot}`
}

export async function checkCodexHooks(deps?: Partial<CodexHooksDeps>): Promise<CheckResult> {
  const d = { ...defaultDeps(), ...deps }
  if (d.platformId !== 'codex')
    return { name: NAME, status: 'pass', message: `not codex (${d.platformId}) — skipped` }
  const plugins = await d.pluginDirs()
  if (plugins.length === 0)
    return { name: NAME, status: 'pass', message: 'no harnessed codex hook plugins installed' }

  const [installed, listed] = await Promise.all([d.installedPlugins(), d.listHooks()])
  const problems: string[] = []
  const fixes: string[] = []
  const ok: string[] = []
  for (const pluginName of plugins.sort()) {
    const manifest = pluginName.replace(/^harnessed-/, '')
    const pluginId = `${pluginName}@${CODEX_HOOK_MARKETPLACE}`
    const issues: string[] = []
    if (installed && !installed.has(pluginId)) issues.push('not installed in codex')
    const hooks = listed.ok ? listed.value.filter((h) => h.key.startsWith(`${pluginId}:`)) : []
    const trust = !listed.ok
      ? 'unknown'
      : hooks.length === 0
        ? 'unknown'
        : (hooks.find((h) => h.trustStatus !== 'trusted')?.trustStatus ?? 'trusted')
    if (trust !== 'trusted') issues.push(`trust: ${trust}`)
    const chain = chainProblem(d, pluginName, hookIdOf(d, pluginName))
    if (chain) issues.push(chain)
    if (issues.length === 0) ok.push(manifest)
    else {
      problems.push(`${manifest} (${issues.join('; ')})`)
      fixes.push(`harnessed install ${manifest} --trust-codex-hooks`)
    }
  }
  if (problems.length === 0)
    return { name: NAME, status: 'pass', message: `installed + trusted: ${ok.join(', ')}` }
  return {
    name: NAME,
    status: 'warn',
    message: `codex skips hooks that are not installed/trusted — ${problems.join(', ')}`,
    fix: fixes.join(' && '),
  }
}
