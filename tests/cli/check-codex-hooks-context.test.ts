import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkCodexHooks } from '../../src/cli/lib/check-codex-hooks.js'
import { listCodexHooks } from '../../src/installers/lib/codexHookTrust.js'
import {
  listCodexPluginMetadata,
  listInstalledCodexPlugins,
} from '../../src/installers/lib/codexPlugins.js'

vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
}))
vi.mock('node:fs/promises', () => ({ readdir: vi.fn() }))
vi.mock('../../src/installers/lib/binaryProbe.js', () => ({ binaryOnPath: () => true }))
vi.mock('../../src/installers/lib/codexPlugins.js', () => ({
  listCodexPluginMetadata: vi.fn(),
  listInstalledCodexPlugins: vi.fn(),
}))
vi.mock('../../src/installers/lib/codexHookTrust.js', () => ({ listCodexHooks: vi.fn() }))

const pluginId = 'harnessed-perturn-inject@harnessed-local'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('CODEX_HOME', '/selected-native')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/selected-state')
  vi.mocked(readdir).mockImplementation((async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/drift-native')
    return ['harnessed-perturn-inject']
  }) as never)
  vi.mocked(readFileSync).mockImplementation(((path: unknown) =>
    String(path).endsWith('install.json')
      ? JSON.stringify({ mode: 'binary', assetsRoot: '/assets' })
      : JSON.stringify({
          hooks: { UserPromptSubmit: [{ hooks: [{ command: 'harnessed inject-state' }] }] },
        })) as never)
  vi.mocked(listInstalledCodexPlugins).mockResolvedValue(new Set([pluginId]))
  vi.mocked(listCodexPluginMetadata).mockResolvedValue([
    { pluginId, installed: true, enabled: true },
  ])
  vi.mocked(listCodexHooks).mockResolvedValue({
    ok: true,
    value: [
      {
        key: `${pluginId}:hooks/hooks.json:user_prompt_submit:0:0`,
        trustStatus: 'trusted',
        currentHash: 'h',
        eventName: 'x',
      },
    ],
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('Codex doctor default context', () => {
  it('pins native plugin, metadata and hook listings after plugin-directory await drift', async () => {
    const result = await checkCodexHooks()
    expect(result.status).toBe('pass')
    const context = vi.mocked(listInstalledCodexPlugins).mock.calls[0]?.[0]
    expect(context).toMatchObject({
      hostId: 'codex',
      nativeHome: '/selected-native',
      platform: { stateRoot: '/selected-state' },
    })
    expect(listCodexPluginMetadata).toHaveBeenCalledWith(context)
    expect(listCodexHooks).toHaveBeenCalledWith({ hostContext: context })
    const paths = vi.mocked(readFileSync).mock.calls.map(([path]) => String(path))
    expect(
      paths.every(
        (path) => path.startsWith('/selected-native') || path.startsWith('\\selected-native'),
      ),
    ).toBe(true)
    expect(paths.join('\n')).not.toMatch(/config\.toml|drift-native/)
  })

  it.each([false, null])('enabled=%s must not be reported trusted and ready', async (enabled) => {
    vi.mocked(listCodexPluginMetadata).mockResolvedValue([{ pluginId, installed: true, enabled }])
    const result = await checkCodexHooks()
    expect(result.status).toBe('warn')
    expect(result.message).toMatch(enabled === false ? /disabled/ : /enablement.*unknown/)
  })

  it('unknown installation listing stays warn even when hooks are trusted', async () => {
    vi.mocked(listInstalledCodexPlugins).mockResolvedValue(null)
    const result = await checkCodexHooks()
    expect(result.status).toBe('warn')
    expect(result.message).toMatch(/installation.*unknown|registration.*unknown/)
  })
})
