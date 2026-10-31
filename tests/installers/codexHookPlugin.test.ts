// v16.0 Phase 64 T1 — codex hook plugin generator (pure). ADR 0041.
//
// The generated `command` literal is what codex hashes for hook trust (the
// UNEXPANDED string, codex-rs hooks discovery), so it must be byte-stable across
// upgrades / reinstalls / node moves: it may name only `${PLUGIN_ROOT}` and a
// PATH-resolved first token, never an absolute install path.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

describe('Phase 78 T5 minimal reminder delivery', () => {
  it.each([
    'npm',
    'bun',
    'binary',
  ] as const)('quotes a fixed reminder root in %s delivery', (mode) => {
    const stateRoot = join(tmpdir(), "state's $;&` root")
    const rendered = renderCodexHookPlugin(
      {
        manifestName: 'update-reminder',
        event: 'SessionStart',
        hookCommand: 'node bin/harnessed-update-reminder.mjs',
        reminderStateRoot: stateRoot,
      },
      mode,
    )
    const hooks = JSON.parse(
      rendered?.files.find((file) => file.path.endsWith('hooks/hooks.json'))?.content ?? '{}',
    )
    const hook = hooks.hooks.SessionStart[0].hooks[0]
    expect(hook.command).toContain(
      `--state-root '${stateRoot.replaceAll("'", "'\\''")}' --platform codex`,
    )
    expect(hook.commandWindows).toContain(
      `--state-root '${stateRoot.replaceAll("'", "''")}' --platform codex`,
    )
    expect(() => codexHookCommand({ id: 'update-reminder', args: [] }, mode, 'relative')).toThrow()
    expect(() =>
      codexHookCommand({ id: 'update-reminder', args: [] }, mode, `${stateRoot}\n`),
    ).toThrow()
  })

  it('keeps reminder and invalidation trust keys separate', () => {
    expect(codexHookTrustKey('harnessed-update-reminder', 'SessionStart')).not.toBe(
      codexHookTrustKey('harnessed-inject-state', 'SessionStart'),
    )
    expect(parseHookIdentity('harnessed update-reminder --platform codex')).toEqual({
      id: 'update-reminder',
      args: ['--platform', 'codex'],
    })
  })

  it('recognizes a distinct portable reminder identity', () => {
    const hookCommand = 'node bin/harnessed-update-reminder.mjs'
    expect(parseHookIdentity(hookCommand)).toEqual({ id: 'update-reminder', args: [] })
    expect(
      renderCodexHookPlugin(
        { manifestName: 'update-reminder', event: 'SessionStart', hookCommand },
        'npm',
      ),
    ).not.toBeNull()
  })
})

describe('parseHookIdentity — manifest hook_command → first-party hook id + tail args', () => {
  it.each([
    ['node bin/harnessed-inject-state.mjs', { id: 'inject-state', args: [] }],
    [
      'node bin/harnessed-inject-state.mjs --invalidate',
      { id: 'inject-state', args: ['--invalidate'] },
    ],
    ['harnessed check-docs --hook', { id: 'check-docs', args: ['--hook'] }],
    ['node bin/harnessed-stop-hook.mjs', { id: 'stop-hook', args: [] }],
    ['node bin/harnessed-update-reminder.mjs', { id: 'update-reminder', args: [] }],
  ])('%s', (cmd, expected) => {
    expect(parseHookIdentity(cmd)).toEqual(expected)
  })

  it('a third-party / unknown command has no identity', () => {
    expect(parseHookIdentity('node scripts/dashboard.mjs --no-open')).toBeNull()
  })
})

describe('codexHookCommand — hash-stable literal (R4)', () => {
  it('bun mode keeps a PATH-resolved host and the exact platform arguments', () => {
    expect(codexHookCommand({ id: 'inject-state', args: ['--invalidate'] }, 'bun')).toBe(
      `bun "\${PLUGIN_ROOT}/hook.cjs" inject-state --invalidate --platform codex`,
    )
    expect(codexHookCommand({ id: 'check-docs', args: ['--hook'] }, 'bun')).toBe(
      `bun "\${PLUGIN_ROOT}/hook.cjs" check-docs --hook --platform codex`,
    )
  })

  it(`npm mode: unquoted \`node\` first token + \${PLUGIN_ROOT} shim; --platform codex for inject-state`, () => {
    expect(codexHookCommand({ id: 'inject-state', args: [] }, 'npm')).toBe(
      `node "\${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex`,
    )
    expect(codexHookCommand({ id: 'inject-state', args: ['--invalidate'] }, 'npm')).toBe(
      `node "\${PLUGIN_ROOT}/hook.cjs" inject-state --invalidate --platform codex`,
    )
  })

  it('check-docs also carries --platform codex (pwsh collapses exit 2 → JSON deny under codex)', () => {
    expect(codexHookCommand({ id: 'check-docs', args: ['--hook'] }, 'npm')).toBe(
      `node "\${PLUGIN_ROOT}/hook.cjs" check-docs --hook --platform codex`,
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

  it.each([
    ['npm', `node "\${PLUGIN_ROOT}/hook.cjs" update-reminder --platform codex`],
    ['bun', `bun "\${PLUGIN_ROOT}/hook.cjs" update-reminder --platform codex`],
    ['binary', 'harnessed update-reminder --platform codex'],
  ] as const)('routes update-reminder through the fixed %s host command', (mode, expected) => {
    expect(codexHookCommand({ id: 'update-reminder', args: [] }, mode)).toBe(expected)
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

  it('bun keeps the npm plugin schema and shim, changing only the command host', () => {
    const npm = renderCodexHookPlugin(spec, 'npm')
    const bun = renderCodexHookPlugin(spec, 'bun')
    expect(bun?.files.map((f) => f.path)).toEqual(npm?.files.map((f) => f.path))
    for (const file of bun?.files ?? []) {
      const original = npm?.files.find((f) => f.path === file.path)?.content
      if (file.path.endsWith('hooks/hooks.json')) {
        expect(file.content).toBe(original?.replaceAll('node ', 'bun '))
      } else expect(file.content).toBe(original)
    }
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

  it('renders update-reminder as a portable host-aware plugin in every mode', () => {
    for (const mode of ['npm', 'bun', 'binary'] as const) {
      const rendered = renderCodexHookPlugin(
        {
          manifestName: 'update-reminder',
          event: 'SessionStart',
          hookCommand: 'node bin/harnessed-update-reminder.mjs',
        },
        mode,
      )
      expect(rendered?.pluginName).toBe('harnessed-update-reminder')
      const hooks = JSON.parse(
        rendered?.files.find((file) => file.path.endsWith('hooks/hooks.json'))?.content ?? '{}',
      )
      expect(hooks.hooks.SessionStart[0].hooks[0].command).toContain(
        'update-reminder --platform codex',
      )
    }
  })

  it('never falls back to the full CLI when the standalone reminder bin is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'harnessed-reminder-shim-'))
    try {
      const pluginRoot = join(root, 'plugin')
      const assetsRoot = join(root, 'assets')
      const marker = join(root, 'cli-imported')
      mkdirSync(join(assetsRoot, 'dist'), { recursive: true })
      mkdirSync(pluginRoot, { recursive: true })
      writeFileSync(join(pluginRoot, 'hook.cjs'), CODEX_HOOK_SHIM)
      writeFileSync(join(pluginRoot, 'install.json'), JSON.stringify({ assetsRoot }))
      writeFileSync(
        join(assetsRoot, 'dist', 'cli.mjs'),
        `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'bad');`,
      )
      const result = spawnSync(
        process.execPath,
        [join(pluginRoot, 'hook.cjs'), 'update-reminder'],
        {
          cwd: root,
          encoding: 'utf8',
        },
      )
      expect(result.status).toBe(0)
      expect(result.stdout).toBe('')
      expect(result.stderr).toBe('')
      expect(existsSync(marker)).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('the generated literal never embeds an absolute path (hash-stable)', () => {
    for (const mode of ['npm', 'bun', 'binary'] as const) {
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
