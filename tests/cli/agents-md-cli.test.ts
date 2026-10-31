import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const captureHostInstallContextMock = vi.hoisted(() => vi.fn())
const detectPlatformMock = vi.hoisted(() => vi.fn())
const runAgentsMdMock = vi.hoisted(() => vi.fn())

vi.mock('../../src/platform/hostInstallContext.js', () => ({
  captureHostInstallContext: captureHostInstallContextMock,
}))
vi.mock('../../src/platform/platform.js', () => ({
  detectPlatform: detectPlatformMock,
}))
vi.mock('../../src/platform/assetsRoot.js', () => ({
  getAssetsRoot: () => '/assets',
}))
vi.mock('../../src/i18n/index.js', () => ({
  getLocale: () => 'en',
}))
vi.mock('../../src/cli/lib/agentsMd.js', () => ({
  runAgentsMd: runAgentsMdMock,
}))

import { Command } from 'commander'
import { registerAgentsMd } from '../../src/cli/agents-md.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('agents-md CLI context capture', () => {
  it('passes the captured custom CODEX_HOME context to runAgentsMd', async () => {
    const context = {
      hostId: 'codex',
      nativeHome: 'C:\\selected-codex',
      platform: { id: 'codex', commandsDir: 'C:\\selected-codex\\prompts' },
    }
    detectPlatformMock.mockReturnValue({ id: 'codex' })
    captureHostInstallContextMock.mockReturnValue(context)
    runAgentsMdMock.mockResolvedValue({
      status: 'unchanged',
      path: 'C:\\selected-codex\\AGENTS.md',
    })

    const program = new Command().exitOverride()
    registerAgentsMd(program)
    await program.parseAsync([process.execPath, 'harnessed', 'agents-md'])

    expect(captureHostInstallContextMock).toHaveBeenCalledWith({ hostId: 'codex' })
    expect(runAgentsMdMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hostContext: context,
        workflowsDir: join('/assets', 'workflows'),
      }),
    )
  })
})
