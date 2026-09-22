// v16.0 Phase 64 T8 — doctor: codex hook plugins (ADR 0041).
//
// Per generated plugin: installed (`codex plugin list`), trust status from the
// app-server hooks/list (trusted / untrusted / modified / unknown), the npm-mode
// shim chain (${PLUGIN_DATA}/install.json → assets entry), and — binary mode — a
// bare `harnessed` on PATH. Sources are limited to those + the plugin dirs; the
// check never opens config.toml. Warn-only (never fails doctor).

import { describe, expect, it } from 'vitest'
import { type CodexHooksDeps, checkCodexHooks } from '../../src/cli/lib/check-codex-hooks.js'

const PID = 'harnessed-perturn-inject@harnessed-local'
const KEY = `${PID}:hooks/hooks.json:user_prompt_submit:0:0`

function deps(over: Partial<CodexHooksDeps> = {}): CodexHooksDeps {
  const files: Record<string, string> = {
    'H/plugins/data/harnessed-perturn-inject-harnessed-local/install.json': JSON.stringify({
      mode: 'npm',
      assetsRoot: 'A',
    }),
    'A/bin/harnessed-inject-state.mjs': '',
    'H/harnessed/marketplace/plugins/harnessed-perturn-inject/hooks/hooks.json': JSON.stringify({
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node "${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex',
              },
            ],
          },
        ],
      },
    }),
  }
  const opened: string[] = []
  return {
    platformId: 'codex',
    codexHome: 'H',
    join: (...p: string[]) => p.join('/'),
    pluginDirs: async () => ['harnessed-perturn-inject'],
    installedPlugins: async () => new Set([PID]),
    listHooks: async () => ({
      ok: true,
      value: [{ key: KEY, trustStatus: 'trusted', currentHash: 'h', eventName: 'x' }],
    }),
    readText: (p) => {
      opened.push(p)
      return files[p] ?? null
    },
    exists: (p) => p in files,
    onPath: () => true,
    ...over,
  }
}

describe('checkCodexHooks', () => {
  it('not codex → pass, skipped', async () => {
    const r = await checkCodexHooks(deps({ platformId: 'claude' }))
    expect(r).toMatchObject({ status: 'pass', message: expect.stringContaining('skipped') })
  })

  it('no generated plugin → pass', async () => {
    const r = await checkCodexHooks(deps({ pluginDirs: async () => [] }))
    expect(r.status).toBe('pass')
  })

  it('installed + trusted + shim chain intact → pass', async () => {
    const r = await checkCodexHooks(deps())
    expect(r).toMatchObject({ status: 'pass' })
    expect(r.message).toContain('perturn-inject')
  })

  it.each(['untrusted', 'modified'])('%s → warn with the trust fix', async (trustStatus) => {
    const r = await checkCodexHooks(
      deps({
        listHooks: async () => ({
          ok: true,
          value: [{ key: KEY, trustStatus, currentHash: 'h', eventName: 'x' }],
        }),
      }),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain(trustStatus)
    expect(r.fix).toContain('harnessed install perturn-inject --trust-codex-hooks')
  })

  it('hooks/list unavailable → trust "unknown", warn', async () => {
    const r = await checkCodexHooks(
      deps({ listHooks: async () => ({ ok: false, failure: 'method-missing', detail: 'x' }) }),
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('unknown')
  })

  it('plugin dir present but not installed in codex → warn', async () => {
    const r = await checkCodexHooks(deps({ installedPlugins: async () => new Set() }))
    expect(r.status).toBe('warn')
    expect(r.message).toContain('not installed')
  })

  it('npm shim chain broken (assets entry missing) → warn', async () => {
    const d = deps()
    const r = await checkCodexHooks({ ...d, exists: () => false })
    expect(r.status).toBe('warn')
    expect(r.message).toContain('shim')
  })

  it('binary mode without `harnessed` on PATH → warn', async () => {
    const d = deps()
    const r = await checkCodexHooks({
      ...d,
      readText: (p) =>
        p.endsWith('install.json') ? JSON.stringify({ mode: 'binary', assetsRoot: 'A' }) : null,
      onPath: () => false,
    })
    expect(r.status).toBe('warn')
    expect(r.message).toContain('PATH')
  })

  it('never reads config.toml', async () => {
    const seen: string[] = []
    const d = deps()
    await checkCodexHooks({
      ...d,
      readText: (p) => {
        seen.push(p)
        return d.readText(p)
      },
    })
    expect(seen.filter((p) => p.endsWith('config.toml'))).toEqual([])
  })
})
