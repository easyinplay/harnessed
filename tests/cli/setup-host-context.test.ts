import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAutoInstall } from '../../src/cli/lib/auto-install.js'
import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import { writeAllCommands } from '../../src/cli/lib/generateCommands.js'
import { runL4Rescue } from '../../src/cli/lib/l4-rescue.js'
import { removeLegacyClaudeCommands } from '../../src/cli/lib/legacyCommandCleanup.js'
import { runOptionalOffer } from '../../src/cli/lib/optional-offer.js'
import { renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'
import { searchMcpKeyHintLines } from '../../src/cli/lib/search-mcp-keys.js'
import { makeIdempotentProbe, runStepBInstall } from '../../src/cli/lib/setup-helpers.js'
import { newBackupSessionDir } from '../../src/cli/lib/skillBackup.js'
import {
  auditInstalledSkills,
  readHashLedger,
  recordSkillHashes,
} from '../../src/cli/lib/skillIntegrity.js'
import { registerSetup } from '../../src/cli/setup.js'
import { writeCodexAgentRoles } from '../../src/installers/lib/codexAgentRoles.js'

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  cp: vi.fn(),
  readdir: vi.fn(async () => []),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))
vi.mock('@clack/prompts', () => ({ confirm: vi.fn(async () => true), isCancel: () => false }))
vi.mock('../../src/cli/lib/version-banner.js', () => ({ printSetupVersionBanner: vi.fn() }))
vi.mock('../../src/cli/lib/setup-helpers.js', () => ({
  runStepBInstall: vi.fn(),
  makeIdempotentProbe: vi.fn(async () => async () => true),
  reclassifyForceUpdateFailures: vi.fn(async () => ({ failed: [], keptExisting: [] })),
  scanWorkflowsWithSkill: vi.fn(async () => ({
    workflows: [{ name: 'harnessed-update', relPath: 'harnessed-update', isMaster: false }],
  })),
  warnIfAgentTeamsMissing: vi.fn(),
}))
vi.mock('../../src/cli/lib/l4-rescue.js', () => ({
  runL4Rescue: vi.fn(async () => ({ installed: [], skipped: [], failed: [] })),
}))
vi.mock('../../src/cli/lib/optional-offer.js', () => ({
  runOptionalOffer: vi.fn(async () => ({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
  })),
}))
vi.mock('../../src/cli/lib/renderSkillTemplates.js', () => ({
  renderAllSkills: vi.fn(async () => ({ results: [], aggregatedWarnings: [] })),
  loadCapabilities: async () => ({}),
}))
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  writeAllCommands: vi.fn(async () => ({ results: [] })),
}))
vi.mock('../../src/cli/lib/legacyCommandCleanup.js', () => ({
  removeLegacyClaudeCommands: vi.fn(async () => ({ removed: [], skipped: [], warnings: [] })),
}))
vi.mock('../../src/workflow/rolePrompts.js', () => ({ loadRolePrompts: async () => ({}) }))
vi.mock('../../src/cli/lib/hostPrimitives.js', () => ({
  toHostId: (id: string) => id,
  loadHostPrimitives: async () => ({}),
  renderHostPrimitives: (body: string) => body,
}))
vi.mock('../../src/cli/lib/rolePromptHostRender.js', () => ({
  renderRolePromptsForHost: async () => ({}),
}))
vi.mock('../../src/installers/lib/codexAgentRoles.js', () => ({
  codexAgentsDir: (home: string) => join(home, 'agents'),
  buildCodexAgentRoles: () => [],
  writeCodexAgentRoles: vi.fn(async () => ({ written: [], skipped: [] })),
}))
vi.mock('../../src/cli/lib/capabilityResolver.js', () => ({
  readInstalledPlugins: () => new Set(),
  readInstalledUserSkills: () => new Set(),
}))
vi.mock('../../src/cli/lib/skillIntegrity.js', () => ({
  readHashLedger: vi.fn(async () => ({})),
  recordSkillHashes: vi.fn(),
  auditInstalledSkills: vi.fn(async () => [{ name: 'harnessed-update', status: 'missing' }]),
  attachCulprits: (entries: unknown) => entries,
  buildCulpritIndex: async () => ({}),
  integrityReportLines: () => [],
}))
vi.mock('../../src/cli/lib/skillBackup.js', () => ({
  newBackupSessionDir: vi.fn(() => '/backup'),
  skillContentMatchesLedger: async () => false,
  backupSkillDir: async () => ({ ok: true, dir: '/backup' }),
}))
vi.mock('../../src/cli/lib/workflowArtifacts.js', () => ({ copyWorkflowArtifacts: vi.fn() }))
vi.mock('../../src/cli/lib/auto-install.js', () => ({ runAutoInstall: vi.fn() }))
vi.mock('../../src/cli/lib/enableAgentTeamsInSettings.js', () => ({
  enableAgentTeamsInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/enableUserLangInSettings.js', () => ({
  enableUserLangInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/search-mcp-keys.js', () => ({
  searchMcpKeyHintLines: vi.fn(async () => []),
}))
vi.mock('../../src/cli/lib/check-guard-conflict.js', () => ({
  checkGuardConflict: async () => ({ status: 'pass' }),
}))

const streams = [process.stdin, process.stdout]
const ttyDescriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, 'isTTY'))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('CODEX_HOME', '/selected-codex')
  vi.stubEnv('CLAUDE_CONFIG_DIR', '/selected-claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/selected-state')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`exit:${code}`)
  })
  for (const stream of streams)
    Object.defineProperty(stream, 'isTTY', { value: true, configurable: true })
  vi.mocked(runStepBInstall).mockImplementation(async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/drift-native')
    vi.stubEnv('CLAUDE_CONFIG_DIR', '/drift-native')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/drift-state')
    return {
      installed: [],
      alreadyInstalled: ['fixture'],
      skipped: [{ name: 'ctx7', reason: 'level-flag-missing' }],
      failed: [],
      elapsedMs: 0,
      componentTypes: {},
    }
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  streams.forEach((stream, index) => {
    const descriptor = ttyDescriptors[index]
    if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
    else Reflect.deleteProperty(stream, 'isTTY')
  })
})

describe('setup single context routing', () => {
  it.each([
    'codex',
    'claude',
  ])('pins %s roots, render, ledger, backup and lifecycle entrypoints across StepB drift', async (host) => {
    vi.stubEnv('HARNESSED_PLATFORM', host)
    const selectedNative = host === 'codex' ? '/selected-codex' : '/selected-claude'
    if (host === 'claude') {
      vi.mocked(removeLegacyClaudeCommands).mockResolvedValueOnce({
        removed: [join(selectedNative, 'commands', 'old.md')],
        skipped: [join(selectedNative, 'commands', 'demo.md')],
        warnings: [`${join(selectedNative, 'commands', 'demo.md')}: remove failed (denied)`],
      })
    }
    vi.mocked(writeAllCommands).mockResolvedValueOnce({
      results: [
        {
          name: 'harnessed-update',
          path: join(selectedNative, 'prompts', 'harnessed-update.md'),
          written: true,
        },
      ],
      warnings: [],
    })
    const program = new Command().exitOverride()
    registerSetup(program)
    await expect(
      program.parseAsync(['node', 'harnessed', 'setup', '--platform', host, '--user-lang', 'en']),
    ).rejects.toThrow('exit:0')
    const context = vi.mocked(runStepBInstall).mock.calls[0]?.[1]?.hostContext
    expect(context).toMatchObject({
      hostId: host,
      nativeHome: selectedNative,
      platform: { stateRoot: join(selectedNative, 'harnessed') },
    })
    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      join(selectedNative, 'harnessed', '.platform'),
      host,
      'utf8',
    )
    expect(vi.mocked(runStepBInstall).mock.calls[1]?.[1]?.hostContext).toBe(context)
    expect(makeIdempotentProbe).toHaveBeenCalledWith(expect.any(Array), context)
    expect(runL4Rescue).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ skipped: expect.any(Array), failed: expect.any(Array) }),
      context,
      { interactive: true },
    )
    expect(runOptionalOffer).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ interactive: true }),
      context,
    )
    expect(runAutoInstall).toHaveBeenCalledWith(
      expect.objectContaining({ nonInteractive: false }),
      context,
    )
    expect(enableAgentTeamsInSettings).toHaveBeenCalledWith(context)
    expect(enableUserLangInSettings).toHaveBeenCalledWith('en', context)
    expect(searchMcpKeyHintLines).toHaveBeenCalledWith(context)
    const skills = host === 'codex' ? context?.platform.skillsDir : join(selectedNative, 'skills')
    expect(renderAllSkills).toHaveBeenCalledTimes(2)
    for (const call of vi.mocked(renderAllSkills).mock.calls) {
      expect(call[0]).toContain('harnessed-update')
      expect(call[1]).toBe(skills)
      expect(call[5]).toBe(host)
    }
    const setupOutput = vi.mocked(console.log).mock.calls.flat().map(String).join('\n')
    if (host === 'codex') {
      expect(removeLegacyClaudeCommands).not.toHaveBeenCalled()
      expect(writeAllCommands).toHaveBeenCalledWith(
        expect.arrayContaining(['harnessed-update']),
        join(selectedNative, 'prompts'),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Function),
        undefined,
        undefined,
        expect.objectContaining({ host: 'codex' }),
      )
      expect(setupOutput).toContain('generated 1 commands/<x>.md file(s)')
      expect(writeCodexAgentRoles).toHaveBeenCalledWith(
        join(selectedNative, 'agents'),
        expect.any(Array),
      )
    } else {
      expect(writeAllCommands).not.toHaveBeenCalled()
      expect(removeLegacyClaudeCommands).toHaveBeenCalledWith(join(selectedNative, 'commands'))
      expect(setupOutput).not.toContain('generated 1 commands/<x>.md file(s)')
      expect(setupOutput).toContain('removed 1 legacy commands/<x>.md file(s)')
      expect(vi.mocked(console.warn).mock.calls.flat().map(String).join('\n')).toContain(
        `[A.6] ${join(selectedNative, 'commands', 'demo.md')}: remove failed (denied)`,
      )
      expect(writeCodexAgentRoles).not.toHaveBeenCalled()
    }
    expect(readHashLedger).toHaveBeenCalledWith(
      join(selectedNative, 'harnessed', 'skill-hashes.json'),
    )
    for (const call of vi.mocked(recordSkillHashes).mock.calls)
      expect(call[2]).toBe(join(selectedNative, 'harnessed', 'skill-hashes.json'))
    for (const call of vi.mocked(newBackupSessionDir).mock.calls)
      expect(call[1]).toBe(join(selectedNative, 'harnessed', 'backups'))
    expect(auditInstalledSkills).toHaveBeenCalledWith(
      expect.any(Array),
      skills,
      expect.any(String),
      { ledger: {} },
    )
    expect(
      vi
        .mocked(mkdir)
        .mock.calls.map(([path]) => String(path))
        .join('\n'),
    ).not.toContain('/drift-native')
  })
})
