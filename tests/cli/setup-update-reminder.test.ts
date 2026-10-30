import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { installBaseProfile } from '../../src/cli/install-base.js'
import { writeAllCommands } from '../../src/cli/lib/generateCommands.js'
import { runStepBInstall } from '../../src/cli/lib/setup-helpers.js'
import { registerSetup } from '../../src/cli/setup.js'
import { resolveUpdateReminderRuntime } from '../../src/compile/updateReminderEntrypoint.js'
import { runInstall } from '../../src/installers/index.js'
import { writeCodexAgentRoles } from '../../src/installers/lib/codexAgentRoles.js'
import type { InstallOpts } from '../../src/installers/lib/types.js'

vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('../../src/cli/lib/version-banner.js', () => ({ printSetupVersionBanner: vi.fn() }))
vi.mock('../../src/cli/lib/setup-helpers.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/cli/lib/setup-helpers.js')>()),
  runStepBInstall: vi.fn(),
  warnIfAgentTeamsMissing: vi.fn(),
}))
vi.mock('../../src/cli/lib/renderSkillTemplates.js', () => ({
  renderAllSkills: async () => ({ results: [], aggregatedWarnings: [] }),
  loadCapabilities: async () => ({}),
}))
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  writeAllCommands: vi.fn(async () => ({ results: [] })),
}))
vi.mock('../../src/workflow/rolePrompts.js', () => ({ loadRolePrompts: async () => ({}) }))
vi.mock('../../src/cli/lib/hostPrimitives.js', () => ({
  toHostId: (host: string) => host,
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
vi.mock('../../src/cli/lib/skillIntegrity.js', () => ({
  readHashLedger: async () => ({}),
  recordSkillHashes: vi.fn(),
  auditInstalledSkills: async () => [],
  attachCulprits: (entries: unknown) => entries,
  buildCulpritIndex: async () => ({}),
}))
vi.mock('../../src/cli/lib/enableAgentTeamsInSettings.js', () => ({
  enableAgentTeamsInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/enableUserLangInSettings.js', () => ({
  enableUserLangInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/optional-offer.js', () => ({
  runOptionalOffer: async () => ({ installed: [], alreadyInstalled: [], skipped: [], failed: [] }),
}))
vi.mock('../../src/cli/lib/auto-install.js', () => ({ runAutoInstall: vi.fn() }))
vi.mock('../../src/cli/lib/search-mcp-keys.js', () => ({ searchMcpKeyHintLines: async () => [] }))
vi.mock('../../src/cli/lib/check-guard-conflict.js', () => ({
  checkGuardConflict: async () => ({ status: 'pass' }),
}))
vi.mock('../../src/cli/lib/check-install-channels.js', () => ({
  detectInstallChannels: () => ({ both: false }),
  dualChannelLines: () => [],
}))

class ExitError extends Error {
  constructor(readonly code: number) {
    super(`exit:${code}`)
  }
}

const installOpts: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}

let root: string
let assets: string
let nativeHome: string

async function runSetup(...args: string[]): Promise<void> {
  const program = new Command().exitOverride()
  registerSetup(program)
  await expect(
    program.parseAsync(['node', 'harnessed', 'setup', '--non-interactive', ...args]),
  ).rejects.toThrow('exit:0')
}

function reminderRuntime(host: 'claude' | 'codex') {
  const runtime = resolveUpdateReminderRuntime({ args: ['--platform', host] })
  if (!runtime) throw new Error('missing reminder runtime')
  return runtime
}

async function seedPreferences(text: string, host: 'claude' | 'codex' = 'claude') {
  const { preferencesPath } = reminderRuntime(host)
  await mkdir(dirname(preferencesPath), { recursive: true })
  await writeFile(preferencesPath, text)
  return preferencesPath
}

beforeEach(async () => {
  vi.clearAllMocks()
  root = await mkdtemp(join(tmpdir(), 'harnessed-setup-reminder-'))
  assets = join(root, 'assets')
  nativeHome = join(root, 'custom native home')
  vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assets)
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('CLAUDE_CONFIG_DIR', nativeHome)
  vi.stubEnv('CODEX_HOME', join(root, 'custom codex home'))
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitError(Number(code ?? 0))
  })
  vi.mocked(runStepBInstall).mockImplementation(async () => ({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
    elapsedMs: 0,
    componentTypes: {},
  }))
  vi.mocked(runInstall).mockResolvedValue({ ok: true, backupId: '', appliedFiles: [] })
  await mkdir(join(assets, 'workflows', 'demo'), { recursive: true })
  await writeFile(join(assets, 'workflows', 'demo', 'SKILL.md'), '# Demo\n')
  const manifest = parse(await readFile(resolve('manifests/cc-hooks/update-reminder.yaml'), 'utf8'))
  for (const [directory, name] of [
    ['tools', 'base-tool'],
    ['skill-packs', 'base-skill'],
    ['cc-hooks', 'update-reminder'],
    ['cc-hooks', 'unrelated-hook'],
    ['optional', 'unrelated-optional'],
  ]) {
    const folder = join(assets, 'manifests', directory ?? '')
    await mkdir(folder, { recursive: true })
    await writeFile(
      join(folder, `${name}.yaml`),
      stringify({ ...manifest, metadata: { ...manifest.metadata, name } }),
    )
  }
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await rm(root, { recursive: true, force: true })
})

describe('setup update reminder defaults and persistent opt-out', () => {
  it.each([
    'claude',
    'codex',
  ] as const)('%s installs only the default reminder hook and initializes preferences at the T5 native path', async (host) => {
    const selectedHome = host === 'codex' ? join(root, 'custom codex home') : nativeHome
    const otherHome = host === 'codex' ? nativeHome : join(root, 'custom codex home')
    await runSetup('--platform', host)
    expect(vi.mocked(runStepBInstall).mock.calls[0]?.[0]).toEqual([
      join(assets, 'manifests', 'tools', 'base-tool.yaml'),
      join(assets, 'manifests', 'skill-packs', 'base-skill.yaml'),
      join(assets, 'manifests', 'cc-hooks', 'update-reminder.yaml'),
    ])
    expect(vi.mocked(runStepBInstall).mock.calls[0]?.[1]?.hostContext).toMatchObject({
      hostId: host,
      nativeHome: selectedHome,
    })
    const { preferencesPath } = reminderRuntime(host)
    expect(preferencesPath).toBe(
      join(selectedHome, 'harnessed', 'update-reminder-preferences.json'),
    )
    expect(existsSync(join(otherHome, 'harnessed', 'update-reminder-preferences.json'))).toBe(false)
    expect(JSON.parse(await readFile(preferencesPath, 'utf8'))).toEqual({
      schemaVersion: 1,
      enabled: true,
    })
    if (host === 'claude') {
      expect(writeAllCommands).not.toHaveBeenCalled()
      expect(writeCodexAgentRoles).not.toHaveBeenCalled()
      expect(existsSync(join(nativeHome, 'commands'))).toBe(false)
    } else {
      expect(vi.mocked(writeAllCommands).mock.calls[0]?.[1]).toBe(join(selectedHome, 'prompts'))
      expect(vi.mocked(writeCodexAgentRoles).mock.calls[0]?.[0]).toBe(join(selectedHome, 'agents'))
    }
  })

  it.each([
    'claude',
    'codex',
  ] as const)('%s persists --no-update-reminder across setup and base refresh', async (host) => {
    await runSetup('--platform', host, '--no-update-reminder')
    const { preferencesPath } = reminderRuntime(host)
    expect(JSON.parse(await readFile(preferencesPath, 'utf8'))).toEqual({
      schemaVersion: 1,
      enabled: false,
    })
    expect(vi.mocked(runStepBInstall).mock.calls[0]?.[0]).not.toContain(
      join(assets, 'manifests', 'cc-hooks', 'update-reminder.yaml'),
    )
    await runSetup('--platform', host, '--update-installed')
    await installBaseProfile(installOpts)
    expect(JSON.parse(await readFile(preferencesPath, 'utf8'))).toEqual({
      schemaVersion: 1,
      enabled: false,
    })
  })

  it('explicit opt-out replaces an existing opt-in at HARNESSED_ROOT_OVERRIDE', async () => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'custom state'))
    const path = await seedPreferences('{"schemaVersion":1,"enabled":true}')
    await runSetup('--no-update-reminder')
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ schemaVersion: 1, enabled: false })
    expect(existsSync(join(nativeHome, 'harnessed', 'update-reminder-preferences.json'))).toBe(
      false,
    )
  })

  it.each([
    '{"schemaVersion":1,"enabled":false,"custom":"preserve"}\n',
    '{"schemaVersion":1,"enabled":true}\n',
    'not-json\n',
  ])('default setup leaves existing preferences byte-identical: %s', async (text) => {
    const path = await seedPreferences(text)
    await runSetup()
    expect(await readFile(path, 'utf8')).toBe(text)
  })

  it('deleting preferences explicitly re-enables the default on the next setup', async () => {
    const path = await seedPreferences('{"schemaVersion":1,"enabled":false}')
    await rm(path)
    await runSetup()
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ schemaVersion: 1, enabled: true })
  })

  it('default initialization leaves an unavailable state root untouched without blocking setup', async () => {
    const stateRoot = join(root, 'blocked-state')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', stateRoot)
    await writeFile(stateRoot, 'preserve')
    await runSetup()
    expect(await readFile(stateRoot, 'utf8')).toBe('preserve')
  })

  it('explicit opt-out fails when preferences cannot be persisted', async () => {
    const { preferencesPath } = reminderRuntime('claude')
    await mkdir(preferencesPath, { recursive: true })
    const program = new Command().exitOverride()
    registerSetup(program)
    await expect(
      program.parseAsync(['node', 'harnessed', 'setup', '--no-update-reminder']),
    ).rejects.toMatchObject({ code: 'EISDIR' })
    expect(runStepBInstall).not.toHaveBeenCalled()
  })

  it.each([
    [],
    ['--no-update-reminder'],
  ])('dry-run never creates preferences or installs hooks: %j', async (...args) => {
    await runSetup('--dry-run', ...args)
    expect(existsSync(reminderRuntime('claude').preferencesPath)).toBe(false)
    expect(runStepBInstall).not.toHaveBeenCalled()
  })

  it('base profile refresh includes only the reminder from cc-hooks without writing preferences', async () => {
    const text = '{"schemaVersion":1,"enabled":false}\n'
    const path = await seedPreferences(text)
    const result = await installBaseProfile(installOpts)
    expect(result.failed).toEqual([])
    expect(result.installed).toEqual(['base-tool', 'base-skill', 'update-reminder'])
    expect(await readFile(path, 'utf8')).toBe(text)
  })
})
