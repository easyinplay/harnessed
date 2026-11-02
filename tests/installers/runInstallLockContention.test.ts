import { describe, expect, it, vi } from 'vitest'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'

vi.mock('../../src/installers/npmCli.js', () => ({
  installNpmCli: vi.fn(),
}))

import { runInstall } from '../../src/installers/index.js'
import { installNpmCli } from '../../src/installers/npmCli.js'

const context: HostInstallContext = {
  hostId: 'claude',
  os: 'linux',
  userHome: '/fixture/home',
  platform: {
    id: 'claude',
    homeDir: '/fixture/home/.claude',
    stateRoot: '/fixture/home/.claude/harnessed',
    settingsPath: '/fixture/home/.claude/settings.json',
    skillsDir: '/fixture/home/.claude/skills',
    commandsDir: '/fixture/home/.claude/commands',
    pluginsRegistry: '/fixture/home/.claude/plugins/installed_plugins.json',
    mcpConfigPath: '/fixture/home/.claude.json',
    supportsEnvKeyWrite: true,
    sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
  },
  nativeHome: '/fixture/home/.claude',
}

const opts: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: 'auto',
}

const manifest = {
  metadata: { name: 'ctx7' },
  spec: { install: { method: 'npm-cli', cmd: 'npm install -g ctx7' } },
} as unknown as Manifest

describe('runInstall lock contention classification', () => {
  it('reports a lock-contention throw as its own retryable keyword', async () => {
    vi.mocked(installNpmCli).mockRejectedValueOnce(
      Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED' }),
    )

    const result = await runInstall(manifest, opts, context)

    expect('error' in result).toBe(true)
    if (!('error' in result)) return
    expect(result.error.keyword).toBe('lock-contention')
    expect(result.error.message).toMatch(/retry/i)
  })

  it('keeps unrelated installer throws on the generic keyword', async () => {
    vi.mocked(installNpmCli).mockRejectedValueOnce(
      Object.assign(new Error('spawn failed'), { code: 'EACCES' }),
    )

    const result = await runInstall(manifest, opts, context)

    expect('error' in result).toBe(true)
    if (!('error' in result)) return
    expect(result.error.keyword).toBe('installer-exception')
  })
})
