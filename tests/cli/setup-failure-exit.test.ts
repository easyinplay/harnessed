import { cp, readdir, readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAutoInstall } from '../../src/cli/lib/auto-install.js'
import { checkGuardConflict } from '../../src/cli/lib/check-guard-conflict.js'
import { searchMcpKeyHintLines } from '../../src/cli/lib/search-mcp-keys.js'
import { backupSkillDir } from '../../src/cli/lib/skillBackup.js'
import { auditInstalledSkills, recordSkillHashes } from '../../src/cli/lib/skillIntegrity.js'
import { registerSetup } from '../../src/cli/setup.js'
import { runInstall } from '../../src/installers/index.js'

vi.mock('node:fs/promises', () => ({
  cp: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))
vi.mock('../../src/platform/assetsRoot.js', () => ({ getAssetsRoot: () => '/fixture' }))
vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: () => ({
    ok: true,
    manifest: {
      metadata: { name: 'gstack' },
      spec: { install: { method: 'git-clone-with-setup' } },
    },
  }),
}))
vi.mock('../../src/cli/lib/setup-helpers.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/cli/lib/setup-helpers.js')>()),
  scanWorkflowsWithSkill: async () => ({
    workflows: [{ name: 'demo', relPath: 'demo', isMaster: false }],
  }),
  warnIfAgentTeamsMissing: vi.fn(),
}))
vi.mock('../../src/cli/lib/version-banner.js', () => ({ printSetupVersionBanner: vi.fn() }))
vi.mock('../../src/cli/lib/capabilityResolver.js', () => ({
  readInstalledPlugins: () => [],
  readInstalledUserSkills: () => [],
}))
vi.mock('../../src/cli/lib/renderSkillTemplates.js', () => ({
  renderAllSkills: vi.fn(async () => ({ aggregatedWarnings: [] })),
  loadCapabilities: async () => ({}),
}))
vi.mock('../../src/workflow/rolePrompts.js', () => ({ loadRolePrompts: async () => ({}) }))
vi.mock('../../src/cli/lib/hostPrimitives.js', () => ({
  loadHostPrimitives: async () => ({}),
  toHostId: (id: string) => id,
  renderHostPrimitives: (body: string) => body,
}))
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  writeAllCommands: async () => ({ results: [] }),
}))
vi.mock('../../src/installers/codexHookAdd.js', () => ({
  resolveCodexHome: () => '/fixture/codex',
}))
vi.mock('../../src/installers/lib/codexAgentRoles.js', () => ({
  codexAgentsDir: () => '/fixture/codex/agents',
  buildCodexAgentRoles: () => [],
  writeCodexAgentRoles: async () => ({ written: [], skipped: [] }),
}))
vi.mock('../../src/cli/lib/rolePromptHostRender.js', () => ({
  renderRolePromptsForHost: async () => ({}),
}))
vi.mock('../../src/cli/lib/enableAgentTeamsInSettings.js', () => ({
  enableAgentTeamsInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/enableUserLangInSettings.js', () => ({
  enableUserLangInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/optional-offer.js', () => ({ runOptionalOffer: vi.fn() }))
vi.mock('../../src/cli/lib/search-mcp-keys.js', () => ({
  searchMcpKeyHintLines: vi.fn(async () => []),
}))
vi.mock('../../src/cli/lib/check-install-channels.js', () => ({
  detectInstallChannels: () => ({ both: false }),
  dualChannelLines: () => [],
}))
vi.mock('../../src/cli/lib/auto-install.js', () => ({ runAutoInstall: vi.fn() }))
vi.mock('../../src/cli/lib/skillBackup.js', () => ({
  skillContentMatchesLedger: async () => false,
  newBackupSessionDir: (tag: string) => `/fixture/backups/${tag}`,
  backupSkillDir: vi.fn(async () => ({ ok: true, dir: '/fixture/backup' })),
}))
vi.mock('../../src/cli/lib/skillIntegrity.js', () => ({
  readHashLedger: async () => null,
  recordSkillHashes: vi.fn(),
  auditInstalledSkills: vi.fn(async () => [{ name: 'demo', status: 'foreign' }]),
  buildCulpritIndex: async () => ({}),
  attachCulprits: (audit: unknown[]) => audit,
  integrityReportLines: () => [],
}))
vi.mock('../../src/cli/lib/check-guard-conflict.js', () => ({
  checkGuardConflict: vi.fn(async () => ({ status: 'pass' })),
}))

class ExitError extends Error {
  constructor(readonly code: number | string | null | undefined) {
    super(`exit(${code})`)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.mocked(readdir).mockImplementation(async (path) => {
    const normalized = String(path).replaceAll('\\', '/')
    return (
      normalized.endsWith('/workflows')
        ? ['demo']
        : normalized.endsWith('/skill-packs')
          ? ['gstack.yaml']
          : []
    ) as never
  })
  vi.mocked(readFile).mockResolvedValue('fixture manifest')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitError(code)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

async function runSetup(): Promise<void> {
  const program = new Command().exitOverride()
  registerSetup(program)
  await program.parseAsync([
    'node',
    'harnessed',
    'setup',
    '--platform',
    'codex',
    '--non-interactive',
  ])
}

describe('setup base-install exit status through registerSetup', () => {
  it('reports upstream gstack failure only after workflow installation, backup and self-heal', async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      error: { message: 'git-clone-with-setup cmd exited 1' },
    } as never)
    await expect(runSetup()).rejects.toMatchObject({ code: 1 })
    expect(runInstall).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 failed'))
    expect(backupSkillDir).toHaveBeenCalledTimes(2)
    expect(cp).toHaveBeenCalledTimes(2)
    expect(auditInstalledSkills).toHaveBeenCalledOnce()
    expect(recordSkillHashes).toHaveBeenCalledTimes(2)
    expect(runAutoInstall).toHaveBeenCalledWith({ nonInteractive: true, autoInstall: true })
    expect(searchMcpKeyHintLines).toHaveBeenCalledOnce()
    expect(checkGuardConflict).toHaveBeenCalledOnce()
    expect(vi.mocked(process.exit).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(checkGuardConflict).mock.invocationCallOrder[0] ?? 0,
    )
  })

  it.each([
    ['installed', { ok: true }],
    ['already installed', { ok: true, alreadyInstalled: true }],
    ['skipped', { aborted: true, reason: 'harness-mismatch' }],
  ])('%s without failures exits zero', async (_name, result) => {
    vi.mocked(runInstall).mockResolvedValue(result as never)
    await expect(runSetup()).rejects.toMatchObject({ code: 0 })
    expect(runInstall).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 failed'))
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })
})
