// v16.0 Phase 64 T1 — codex hook plugin generator (pure). ADR 0041.
//
// The generated `command` literal is what codex hashes for hook trust (the
// UNEXPANDED string, codex-rs hooks discovery), so it must be byte-stable across
// upgrades / reinstalls / node moves: it may name only `${PLUGIN_ROOT}` and a
// PATH-resolved first token, never an absolute install path.

import { describe, expect, it } from 'vitest'
import {
  CODEX_HOOK_MARKETPLACE,
  CODEX_HOOK_SHIM,
  codexHookCommand,
  codexHookPluginName,
  codexHookTrustKey,
  codexMarketplaceJson,
  parseHookIdentity,
  renderCodexHookPlugin,
} from '../../src/installers/lib/codexHookPlugin.js'

describe('parseHookIdentity — manifest hook_command → first-party hook id + tail args', () => {
  it.each([
    ['node bin/harnessed-inject-state.mjs', { id: 'inject-state', args: [] }],
    [
      'node bin/harnessed-inject-state.mjs --invalidate',
      { id: 'inject-state', args: ['--invalidate'] },
    ],
    ['harnessed check-docs --hook', { id: 'check-docs', args: ['--hook'] }],
    ['node bin/harnessed-stop-hook.mjs', { id: 'stop-hook', args: [] }],
  ])('%s', (cmd, expected) => {
    expect(parseHookIdentity(cmd)).toEqual(expected)
  })

  it('a third-party / unknown command has no identity', () => {
    expect(parseHookIdentity('node scripts/dashboard.mjs --no-open')).toBeNull()
  })
})

describe('codexHookCommand — hash-stable literal (R4)', () => {
  it('npm mode: unquoted `node` first token + ${PLUGIN_ROOT} shim; --platform codex for inject-state', () => {
    expect(codexHookCommand({ id: 'inject-state', args: [] }, 'npm')).toBe(
      'node "${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex',
    )
    expect(codexHookCommand({ id: 'inject-state', args: ['--invalidate'] }, 'npm')).toBe(
      'node "${PLUGIN_ROOT}/hook.cjs" inject-state --invalidate --platform codex',
    )
  })

  it('check-docs also carries --platform codex (pwsh collapses exit 2 → JSON deny under codex)', () => {
    expect(codexHookCommand({ id: 'check-docs', args: ['--hook'] }, 'npm')).toBe(
      'node "${PLUGIN_ROOT}/hook.cjs" check-docs --hook --platform codex',
    )
  })

  it('binary mode: bare PATH `harnessed` first token, no path at all', () => {
    expect(codexHookCommand({ id: 'inject-state', args: [] }, 'binary')).toBe(
      'harnessed inject-state --platform codex',
    )
    expect(codexHookCommand({ id: 'check-docs', args: ['--hook'] }, 'binary')).toBe(
      'harnessed check-docs --hook --platform codex',
    )
  })
})

describe('renderCodexHookPlugin — one plugin per hook manifest (CQ2)', () => {
  const spec = {
    manifestName: 'perturn-inject',
    event: 'UserPromptSubmit',
    hookCommand: 'node bin/harnessed-inject-state.mjs',
  }

  it('names the plugin harnessed-<manifest> in the harnessed-local marketplace', () => {
    expect(codexHookPluginName('perturn-inject')).toBe('harnessed-perturn-inject')
    expect(CODEX_HOOK_MARKETPLACE).toBe('harnessed-local')
  })

  it('npm mode snapshot: plugin.json + hooks.json (command === commandWindows) + shim', () => {
    const r = renderCodexHookPlugin(spec, 'npm')
    expect(r).not.toBeNull()
    if (!r) return
    expect(r.pluginName).toBe('harnessed-perturn-inject')
    const byPath = Object.fromEntries(r.files.map((f) => [f.path, f.content]))
    expect(Object.keys(byPath).sort()).toEqual([
      'plugins/harnessed-perturn-inject/.codex-plugin/plugin.json',
      'plugins/harnessed-perturn-inject/hook.cjs',
      'plugins/harnessed-perturn-inject/hooks/hooks.json',
    ])
    expect(
      JSON.parse(byPath['plugins/harnessed-perturn-inject/hooks/hooks.json'] ?? ''),
    ).toMatchInlineSnapshot(`
      {
        "hooks": {
          "UserPromptSubmit": [
            {
              "hooks": [
                {
                  "command": "node "\${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex",
                  "commandWindows": "node "\${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex",
                  "type": "command",
                },
              ],
            },
          ],
        },
      }
    `)
    expect(
      JSON.parse(byPath['plugins/harnessed-perturn-inject/.codex-plugin/plugin.json'] ?? ''),
    ).toMatchObject({ name: 'harnessed-perturn-inject', version: expect.any(String) })
    expect(byPath['plugins/harnessed-perturn-inject/hook.cjs']).toBe(CODEX_HOOK_SHIM)
  })

  it('binary mode ships no shim', () => {
    const r = renderCodexHookPlugin(spec, 'binary')
    expect(r?.files.map((f) => f.path)).not.toContain('plugins/harnessed-perturn-inject/hook.cjs')
  })

  it('matcher is carried (doc-discipline-gate: PreToolUse / Bash — codex tool name is Bash)', () => {
    const r = renderCodexHookPlugin(
      {
        manifestName: 'doc-discipline-gate',
        event: 'PreToolUse',
        matcher: 'Bash',
        hookCommand: 'harnessed check-docs --hook',
      },
      'npm',
    )
    const hooks = JSON.parse(
      r?.files.find((f) => f.path.endsWith('hooks/hooks.json'))?.content ?? '{}',
    )
    expect(hooks.hooks.PreToolUse[0].matcher).toBe('Bash')
  })

  it('stop-hook-recover is NOT portable (CC transcript-shaped) → null', () => {
    expect(
      renderCodexHookPlugin(
        {
          manifestName: 'stop-hook-recover',
          event: 'Stop',
          hookCommand: 'node bin/harnessed-stop-hook.mjs',
        },
        'npm',
      ),
    ).toBeNull()
  })

  it('the generated literal never embeds an absolute path (hash-stable)', () => {
    for (const mode of ['npm', 'binary'] as const) {
      const r = renderCodexHookPlugin(spec, mode)
      const hooks = r?.files.find((f) => f.path.endsWith('hooks/hooks.json'))?.content ?? ''
      expect(hooks).not.toMatch(/[A-Za-z]:[\\/]|\/(?:home|Users|usr)\//)
    }
  })
})

describe('codexMarketplaceJson — lists every generated plugin', () => {
  it('local-source entries under ./plugins/<p>, sorted', () => {
    expect(codexMarketplaceJson(['harnessed-b', 'harnessed-a'])).toEqual({
      name: 'harnessed-local',
      owner: { name: 'harnessed' },
      plugins: [
        {
          name: 'harnessed-a',
          source: './plugins/harnessed-a',
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
          version: expect.any(String),
        },
        {
          name: 'harnessed-b',
          source: './plugins/harnessed-b',
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
          version: expect.any(String),
        },
      ],
    })
  })
})

describe('codexHookTrustKey — deterministic key (measured: <p>@<m>:hooks/hooks.json:<event_snake>:0:0)', () => {
  it.each([
    ['UserPromptSubmit', 'user_prompt_submit'],
    ['SessionStart', 'session_start'],
    ['PreToolUse', 'pre_tool_use'],
  ])('%s', (event, snake) => {
    expect(codexHookTrustKey('harnessed-x', event)).toBe(
      `harnessed-x@harnessed-local:hooks/hooks.json:${snake}:0:0`,
    )
  })
})
