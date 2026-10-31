import { cp, readdir, readFile } from 'node:fs/promises'
import { confirm, isCancel } from '@clack/prompts'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAutoInstall } from '../../src/cli/lib/auto-install.js'
import { checkGuardConflict } from '../../src/cli/lib/check-guard-conflict.js'
import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import { writeAllCommands } from '../../src/cli/lib/generateCommands.js'
import { runOptionalOffer } from '../../src/cli/lib/optional-offer.js'
import { renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'
import { searchMcpKeyHintLines } from '../../src/cli/lib/search-mcp-keys.js'
import { runStepBInstall, type StepBResult } from '../../src/cli/lib/setup-helpers.js'
import { backupSkillDir } from '../../src/cli/lib/skillBackup.js'
import { auditInstalledSkills, recordSkillHashes } from '../../src/cli/lib/skillIntegrity.js'
import { registerSetup } from '../../src/cli/setup.js'
import { runInstall } from '../../src/installers/index.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'
import * as manifestValidation from '../../src/manifest/validate.js'

vi.mock('node:fs/promises', () => ({
  cp: vi.fn(),
  mkdir: vi.fn(),
  lstat: vi.fn(async () => ({ isSymbolicLink: () => false, isDirectory: () => true })),
  realpath: vi.fn(async (path) => String(path)),
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))
vi.mock('../../src/platform/assetsRoot.js', () => ({ getAssetsRoot: () => '/fixture' }))
vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
  resolveForHarness: (manifest: unknown) => ({ manifest, gate: null }),
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({ isAlreadyInstalled: vi.fn() }))
vi.mock('../../src/installers/lib/verifyInstalled.js', () => ({ verifyInstalled: vi.fn() }))
vi.mock('@clack/prompts', () => ({ confirm: vi.fn(), isCancel: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: () => ({
    ok: true,
    manifest: {
      metadata: { name: 'gstack' },
      spec: { install: { method: 'git-clone-with-setup' } },
    },
  }),
}))
vi.mock('../../src/cli/lib/setup-helpers.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/cli/lib/setup-helpers.js')>()
  return {
    ...original,
    runStepBInstall: vi.fn(original.runStepBInstall),
    scanWorkflowsWithSkill: async () => ({
      workflows: [{ name: 'demo', relPath: 'demo', isMaster: false }],
    }),
    warnIfAgentTeamsMissing: vi.fn(),
  }
})
vi.mock('../../src/cli/lib/version-banner.js', () => ({ printSetupVersionBanner: vi.fn() }))
vi.mock('../../src/cli/lib/capabilityResolver.js', () => ({
  readInstalledPlugins: () => [],
  readInstalledUserSkills: () => [],
}))
vi.mock('../../src/cli/lib/renderSkillTemplates.js', () => ({
  renderAllSkills: vi.fn(async () => ({ results: [], aggregatedWarnings: [] })),
  loadCapabilities: async () => ({}),
}))
vi.mock('../../src/workflow/rolePrompts.js', () => ({ loadRolePrompts: async () => ({}) }))
vi.mock('../../src/cli/lib/hostPrimitives.js', () => ({
  loadHostPrimitives: async () => ({}),
  toHostId: (id: string) => id,
  renderHostPrimitives: (body: string) => body,
}))
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  writeAllCommands: vi.fn(async () => ({ results: [], warnings: [] })),
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
  vi.mocked(writeAllCommands).mockResolvedValue({ results: [], warnings: [] })
  vi.mocked(renderAllSkills).mockResolvedValue({ results: [], aggregatedWarnings: [] })
  vi.mocked(enableAgentTeamsInSettings).mockResolvedValue({
    status: 'warn',
    message:
      "platform 'codex' does not support env-key settings writes (capability-absent) — CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS skipped",
  })
  vi.mocked(enableUserLangInSettings).mockResolvedValue({
    status: 'pinned',
    path: '/fixture/user-lang',
    detected: 'en',
  })
  vi.mocked(runInstall).mockReset()
  vi.mocked(isAlreadyInstalled).mockReset().mockResolvedValue(false)
  vi.mocked(verifyInstalled).mockReset().mockResolvedValue(null)
  vi.mocked(runOptionalOffer).mockReset().mockResolvedValue({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
  })
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.mocked(readdir).mockImplementation(async (path, options?: unknown) => {
    const normalized = String(path).replaceAll('\\', '/')
    if (options && typeof options === 'object' && 'withFileTypes' in options) {
      return ['SKILL.md', 'workflow.yaml'].map((name) => ({
        name,
        isDirectory: () => false,
      })) as never
    }
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

async function runSetup(args = ['--non-interactive']): Promise<void> {
  return runSetupForPlatform('codex', args)
}

async function runSetupForPlatform(platform: 'claude' | 'codex', args: string[]): Promise<void> {
  const program = new Command().exitOverride()
  registerSetup(program)
  await program.parseAsync(['node', 'harnessed', 'setup', '--platform', platform, ...args])
}

function stepB(overrides: Partial<StepBResult>): StepBResult {
  return {
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
    elapsedMs: 1,
    componentTypes: {},
    ...overrides,
  }
}

describe('setup surface write failures through registerSetup', () => {
  it('keeps codex capability absence advisory and exits zero', async () => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('capability-absent'))
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
  })

  it.each([
    'capabilities.yaml load failed: access denied',
    'host-primitive render failed in /fixture/skills/demo/SKILL.md — missing primitive',
    'write failed: read-only filesystem',
  ])('counts a real skill render failure and exits one: %s', async (error) => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))
    vi.mocked(renderAllSkills).mockResolvedValueOnce({
      results: [
        {
          name: 'demo',
          skillPath: '/fixture/skills/demo/SKILL.md',
          rendered: false,
          warnings: [],
          error,
        },
      ],
      aggregatedWarnings: [`demo: ${error}`],
    })

    await expect(runSetup()).rejects.toMatchObject({ code: 1 })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(error))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
  })

  it('counts a thrown skill render load failure and exits one', async () => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))
    vi.mocked(renderAllSkills).mockRejectedValueOnce(new Error('host primitives unreadable'))

    await expect(runSetup()).rejects.toMatchObject({ code: 1 })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('host primitives unreadable'))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
  })

  it.each([
    'read /fixture/settings.json failed: access denied',
    '/fixture/settings.json malformed JSON: Unexpected token }',
    'backup /fixture/backups/settings.json.bak failed: disk full',
    'write /fixture/settings.json failed: read-only filesystem',
  ])('counts a Claude settings failure and preserves its detail: %s', async (message) => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))
    vi.mocked(enableAgentTeamsInSettings).mockResolvedValueOnce({ status: 'warn', message })
    vi.mocked(enableUserLangInSettings).mockResolvedValueOnce({
      status: 'already-set',
      path: '/fixture/settings.json',
      existing: 'en',
    })

    await expect(runSetupForPlatform('claude', ['--non-interactive'])).rejects.toMatchObject({
      code: 1,
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
  })

  it.each([
    'host-primitive render failed for commands/demo.md — missing primitive',
    'write failed for commands/demo.md: permission denied',
  ])('counts a real command failure and reports it once: %s', async (warning) => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))
    vi.mocked(writeAllCommands).mockResolvedValueOnce({
      results: [{ name: 'demo', path: '/fixture/prompts/demo.md', written: false, warning }],
      warnings: [warning, warning],
    })

    await expect(runSetup()).rejects.toMatchObject({ code: 1 })

    const warnings = vi
      .mocked(console.warn)
      .mock.calls.flat()
      .map(String)
      .filter((line) => line.includes(warning))
    expect(warnings).toEqual([expect.stringContaining(warning)])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
  })

  it('keeps advisory and user-authored command skips successful while deduplicating warnings', async () => {
    vi.mocked(runStepBInstall).mockResolvedValueOnce(stepB({ installed: ['gstack'] }))
    const userAuthored =
      'commands/demo.md is user-authored (no harnessed marker) — leaving unchanged. Delete the file to force regenerate.'
    const advisory = "capability 'gstack-review' is not installed"
    vi.mocked(writeAllCommands).mockResolvedValueOnce({
      results: [
        {
          name: 'demo',
          path: '/fixture/prompts/demo.md',
          written: false,
          warning: userAuthored,
        },
      ],
      warnings: [advisory, advisory],
    })

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    const warnings = vi.mocked(console.warn).mock.calls.flat().map(String)
    expect(warnings.filter((line) => line.includes(userAuthored))).toHaveLength(1)
    expect(warnings.filter((line) => line.includes(advisory))).toHaveLength(1)
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
  })
})

describe('setup base-install exit status through registerSetup', () => {
  it('reports upstream gstack failure only after workflow installation, backup and self-heal', async () => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      error: { message: 'git-clone-with-setup cmd exited 1' },
    } as never)
    await expect(runSetup()).rejects.toMatchObject({ code: 1 })
    expect(runInstall).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /setup incomplete.*1 workflow\(s\) installed.*0 base component\(s\) configured.*1 component\(s\) failed/,
      ),
    )
    expect(backupSkillDir).toHaveBeenCalledTimes(2)
    expect(cp).toHaveBeenCalledTimes(4)
    expect(auditInstalledSkills).toHaveBeenCalledOnce()
    expect(recordSkillHashes).toHaveBeenCalledTimes(2)
    expect(runAutoInstall).toHaveBeenCalledWith(
      { nonInteractive: true, autoInstall: true },
      expect.objectContaining({ hostId: 'codex' }),
    )
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

describe('setup explicit force-update retained installs through registerSetup', () => {
  const args = ['--system', '--non-interactive', '--update-installed']
  const streams = [process.stdin, process.stdout]
  const ttyDescriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, 'isTTY'))
  const reason = 'opaque provenance refusal: external install has no update metadata'

  beforeEach(() => {
    for (const stream of streams) {
      Object.defineProperty(stream, 'isTTY', { value: true, configurable: true })
    }
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      phase: 'preflight',
      error: { message: reason, keyword: 'update-unsupported' },
    } as never)
  })

  afterEach(() => {
    streams.forEach((stream, index) => {
      const descriptor = ttyDescriptors[index]
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else Reflect.deleteProperty(stream, 'isTTY')
    })
  })

  it.each([
    true,
    false,
  ])('keeps a healthy retained install before the first summary with TTY=%s', async (tty) => {
    for (const stream of streams) {
      Object.defineProperty(stream, 'isTTY', { value: tty, configurable: true })
    }
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)

    await expect(runSetup(args)).rejects.toMatchObject({ code: 0 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.failed).toEqual([])
    expect(result.keptExisting).toEqual([{ name: 'gstack', reason }])
    expect(runStepBInstall).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({ updateInstalled: true, system: true }),
    )
    expect(runInstall).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({ updateInstalled: true, system: true, nonInteractive: true }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(isAlreadyInstalled).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ hostContext: expect.objectContaining({ hostId: 'codex' }) }),
    )
    expect(verifyInstalled).toHaveBeenCalledOnce()
    expect(confirm).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('1 failed'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 base manifests configured'))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(reason))
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
    const summaryIndex = vi
      .mocked(console.log)
      .mock.calls.findIndex(([message]) => String(message).includes('0 failed'))
    expect(vi.mocked(verifyInstalled).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(console.log).mock.invocationCallOrder[summaryIndex] ?? 0,
    )
  })

  it.each([
    'presence-false',
    'presence-throw',
    'runtime-false',
    'runtime-throw',
  ] as const)('keeps the provenance failure fatal when the retained probe is %s', async (outcome) => {
    vi.mocked(isAlreadyInstalled).mockImplementation(async () => {
      if (outcome === 'presence-throw') throw new Error('presence unavailable')
      return outcome !== 'presence-false'
    })
    if (outcome === 'runtime-false') {
      vi.mocked(verifyInstalled).mockResolvedValue({
        ok: false,
        phase: 'verify',
        error: { message: 'retained runtime broken' },
      } as never)
    } else if (outcome === 'runtime-throw') {
      vi.mocked(verifyInstalled).mockRejectedValue(new Error('runtime unavailable'))
    }

    await expect(runSetup(args)).rejects.toMatchObject({ code: 1 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.failed).toEqual([`gstack: ${reason}`])
    expect(result.keptExisting ?? []).toEqual([])
    expect(isAlreadyInstalled).toHaveBeenCalledOnce()
    expect(verifyInstalled).toHaveBeenCalledTimes(outcome.startsWith('runtime') ? 1 : 0)
    expect(runStepBInstall).toHaveBeenCalledTimes(1)
    expect(runInstall).toHaveBeenCalledTimes(1)
    expect(confirm).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
  })

  it('keeps only healthy structured refusals in a mixed batch and leaves genuine failures fatal', async () => {
    vi.mocked(readdir).mockImplementation(async (path, options?: unknown) => {
      const normalized = String(path).replaceAll('\\', '/')
      if (options && typeof options === 'object' && 'withFileTypes' in options) {
        return ['SKILL.md', 'workflow.yaml'].map((name) => ({
          name,
          isDirectory: () => false,
        })) as never
      }
      return (
        normalized.endsWith('/workflows')
          ? ['demo']
          : normalized.endsWith('/skill-packs')
            ? ['gstack.yaml', 'broken.yaml', 'fresh.yaml', 'unstructured.yaml', 'updated.yaml']
            : []
      ) as never
    })
    vi.spyOn(manifestValidation, 'validateManifestFile').mockImplementation(
      (_source, path) =>
        ({
          ok: true,
          manifest: {
            metadata: { name: String(path).split(/[\\/]/).at(-1)?.replace('.yaml', '') },
            spec: { install: { method: 'git-clone-with-setup' } },
          },
        }) as never,
    )
    vi.mocked(runInstall).mockImplementation(async (manifest) => {
      const name = manifest.metadata.name
      if (name === 'updated') return { ok: true } as never
      return {
        ok: false,
        phase: name === 'fresh' ? 'spawn' : 'preflight',
        error: {
          message:
            name === 'fresh' ? 'fresh install failed' : 'update-unsupported: provenance refusal',
          ...(name === 'gstack' || name === 'broken'
            ? { keyword: 'update-unsupported' }
            : name === 'fresh'
              ? { keyword: 'spawn-failed' }
              : {}),
        },
      } as never
    })
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    vi.mocked(verifyInstalled).mockImplementation(async (context) =>
      context.manifest.metadata.name === 'broken'
        ? ({ ok: false, phase: 'verify', error: { message: 'runtime broken' } } as never)
        : null,
    )

    await expect(runSetup(args)).rejects.toMatchObject({ code: 1 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.keptExisting).toEqual([
      { name: 'gstack', reason: 'update-unsupported: provenance refusal' },
    ])
    expect(result.failed).toEqual([
      'broken: update-unsupported: provenance refusal',
      'fresh: fresh install failed',
      'unstructured: update-unsupported: provenance refusal',
    ])
    expect(result.installed).toEqual(['updated'])
    expect(
      vi.mocked(isAlreadyInstalled).mock.calls.map(([context]) => context.manifest.metadata.name),
    ).toEqual(['broken', 'gstack'])
    expect(verifyInstalled).toHaveBeenCalledTimes(2)
    expect(runStepBInstall).toHaveBeenCalledTimes(1)
    expect(confirm).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3 failed'))
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /setup incomplete.*2 base component\(s\) configured.*3 component\(s\) failed/,
      ),
    )
  })
})

describe('setup optional outcomes through registerSetup', () => {
  const streams = [process.stdin, process.stdout]
  const ttyDescriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, 'isTTY'))
  let base: StepBResult

  beforeEach(() => {
    for (const stream of streams) {
      Object.defineProperty(stream, 'isTTY', { value: true, configurable: true })
    }
    base = stepB({
      installed: ['gstack'],
      alreadyInstalled: ['base-mcp'],
      keptExisting: [{ name: 'base-retained', reason: 'verified prior version retained' }],
    })
    vi.mocked(runStepBInstall).mockResolvedValueOnce(base)
  })

  afterEach(() => {
    streams.forEach((stream, index) => {
      const descriptor = ttyDescriptors[index]
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else Reflect.deleteProperty(stream, 'isTTY')
    })
  })

  it.each([
    'npm install exited 1',
    'verify failed: codegraph --version exited 1',
  ])('selected optional failure is counted after recovery: %s', async (reason) => {
    vi.mocked(runOptionalOffer).mockResolvedValueOnce({
      installed: ['ecc'],
      alreadyInstalled: ['optional-present'],
      skipped: ['not-selected'],
      failed: [{ name: 'codegraph', reason }],
    })

    await expect(runSetup(['--update-installed'])).rejects.toMatchObject({ code: 1 })

    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/optional.*codegraph/))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(reason))
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /setup incomplete.*1 workflow\(s\) installed.*3 base component\(s\) configured.*1 component\(s\) failed/,
      ),
    )
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    expect(base.installed).toEqual(['gstack'])
    expect(base.alreadyInstalled).toEqual(['base-mcp'])
    expect(base.keptExisting).toEqual([
      { name: 'base-retained', reason: 'verified prior version retained' },
    ])
    expect(base.failed).toEqual([])
    expect(base.skipped).toEqual([])
    expect(runOptionalOffer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ interactive: true }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(backupSkillDir).toHaveBeenCalledTimes(2)
    expect(cp).toHaveBeenCalledTimes(4)
    expect(auditInstalledSkills).toHaveBeenCalledOnce()
    expect(recordSkillHashes).toHaveBeenCalledTimes(2)
    expect(searchMcpKeyHintLines).toHaveBeenCalledOnce()
    expect(runAutoInstall).toHaveBeenCalledOnce()
    expect(checkGuardConflict).toHaveBeenCalledOnce()
    expect(vi.mocked(auditInstalledSkills).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(runOptionalOffer).mock.invocationCallOrder[0] ?? 0,
    )
    expect(vi.mocked(process.exit).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(checkGuardConflict).mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('counts base and optional failures together without inflating the configured base count', async () => {
    base.failed.push('base-broken: base verify failed')
    vi.mocked(runOptionalOffer).mockResolvedValueOnce({
      installed: [],
      alreadyInstalled: [],
      skipped: [],
      failed: [
        { name: 'codegraph', reason: 'npm exited 1' },
        { name: 'ecc', reason: 'plugin verify failed' },
      ],
    })

    await expect(runSetup(['--update-installed'])).rejects.toMatchObject({ code: 1 })

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /setup incomplete.*3 base component\(s\) configured.*3 component\(s\) failed/,
      ),
    )
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('codegraph: npm exited 1'))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ecc: plugin verify failed'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    expect(base.failed).toEqual(['base-broken: base verify failed'])
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })

  it.each([
    'declined',
    'not-selected',
    '--non-interactive',
    'stdin',
    'stdout',
    'success',
  ])('%s optional outcome preserves success and base-only configured count', async (outcome) => {
    if (outcome === 'stdin' || outcome === 'stdout') {
      Object.defineProperty(process[outcome], 'isTTY', { value: false, configurable: true })
    }
    vi.mocked(runOptionalOffer).mockResolvedValueOnce({
      installed: outcome === 'success' ? ['codegraph', 'ecc'] : [],
      alreadyInstalled: outcome === 'success' ? ['optional-present'] : [],
      skipped: outcome === 'success' ? [] : ['codegraph', 'ecc'],
      failed: [],
    })

    await expect(
      runSetup([
        '--update-installed',
        ...(outcome === '--non-interactive' ? ['--non-interactive'] : []),
      ]),
    ).rejects.toMatchObject({ code: 0 })

    expect(console.log).toHaveBeenCalledWith(
      'setup complete \u2014 1 workflows + 3 base manifests configured',
    )
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('component(s) failed'))
    expect(runOptionalOffer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        interactive: !['--non-interactive', 'stdin', 'stdout'].includes(outcome),
      }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(base.failed).toEqual([])
    expect(base.skipped).toEqual([])
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })

  it.each([
    new Error('optional installer threw'),
    'optional installer rejected',
  ])('preserves the existing rejection boundary without a false success: %s', async (error) => {
    vi.mocked(runOptionalOffer).mockRejectedValueOnce(error)

    await expect(runSetup(['--update-installed'])).rejects.toBe(error)

    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    expect(process.exit).not.toHaveBeenCalled()
    expect(cp).toHaveBeenCalledTimes(2)
  })
})

describe('setup L4 rescue result through registerSetup', () => {
  const streams = [process.stdin, process.stdout]
  const ttyDescriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, 'isTTY'))

  beforeEach(() => {
    for (const stream of streams) {
      Object.defineProperty(stream, 'isTTY', { value: true, configurable: true })
    }
    vi.mocked(confirm).mockResolvedValue(true)
    vi.mocked(isCancel).mockReturnValue(false)
    vi.mocked(runInstall).mockResolvedValueOnce({
      aborted: true,
      reason: 'level-flag-missing',
    })
  })

  afterEach(() => {
    streams.forEach((stream, index) => {
      const descriptor = ttyDescriptors[index]
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else Reflect.deleteProperty(stream, 'isTTY')
    })
  })

  function useCtx7Manifest(
    provenance: 'tools' | 'skill-packs' = 'tools',
    installType: 'npm' | null = 'npm',
  ): void {
    vi.mocked(readdir).mockImplementation(async (path, options?: unknown) => {
      const normalized = String(path).replaceAll('\\', '/')
      if (options && typeof options === 'object' && 'withFileTypes' in options) {
        return ['SKILL.md', 'workflow.yaml'].map((name) => ({
          name,
          isDirectory: () => false,
        })) as never
      }
      return (
        normalized.endsWith('/workflows')
          ? ['demo']
          : normalized.endsWith(`/manifests/${provenance}`)
            ? ['ctx7.yaml']
            : []
      ) as never
    })
    vi.spyOn(manifestValidation, 'validateManifestFile').mockReturnValue({
      ok: true,
      manifest: {
        metadata: { name: 'ctx7' },
        spec: {
          type: 'cli-npm',
          component_type: 'cli-binary',
          ...(installType ? { install_type: installType } : {}),
          install: { method: 'npm-cli', cmd: 'npm install -g ctx7' },
        },
      },
    } as never)
  }

  function verifyFailedBase(reason = 'old verify reason'): StepBResult {
    return stepB({
      failed: [`ctx7: ${reason}`],
      failureKeywords: { ctx7: 'verify-failed' },
      componentTypes: { ctx7: 'cli-binary' },
    })
  }

  it('approved cli-binary verify repair forces update and removes the original failure', async () => {
    useCtx7Manifest()
    const initial = verifyFailedBase()
    vi.mocked(runStepBInstall).mockResolvedValueOnce(initial)
    vi.mocked(runInstall)
      .mockReset()
      .mockResolvedValue({ ok: true } as never)

    await expect(runSetup([])).rejects.toMatchObject({ code: 0 })

    expect(runInstall).toHaveBeenCalledOnce()
    expect(runInstall).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ system: true, nonInteractive: true, updateInstalled: true }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(initial.installed).toEqual(['ctx7'])
    expect(initial.failed).toEqual([])
  })

  it('failed cli-binary verify repair replaces the original failure reason', async () => {
    useCtx7Manifest()
    const initial = verifyFailedBase()
    vi.mocked(runStepBInstall).mockResolvedValueOnce(initial)
    vi.mocked(runInstall)
      .mockReset()
      .mockResolvedValue({
        ok: false,
        phase: 'verify',
        error: { message: 'latest verify reason' },
      } as never)

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(initial.failed).toEqual(['ctx7: latest verify reason'])
  })

  it.each([
    'declined',
    'cancelled',
  ] as const)('%s cli-binary verify repair preserves the original failure', async (answer) => {
    useCtx7Manifest()
    const initial = verifyFailedBase()
    vi.mocked(runStepBInstall).mockResolvedValueOnce(initial)
    vi.mocked(confirm).mockResolvedValue(answer === 'declined' ? false : Symbol('cancel'))
    vi.mocked(isCancel).mockReturnValue(answer === 'cancelled')

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(initial.failed).toEqual(['ctx7: old verify reason'])
    expect(runInstall).not.toHaveBeenCalled()
  })

  it('does not offer verify repair for skill-pack provenance', async () => {
    useCtx7Manifest('skill-packs')
    vi.mocked(runStepBInstall).mockResolvedValueOnce(verifyFailedBase())

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(confirm).not.toHaveBeenCalled()
    expect(runInstall).not.toHaveBeenCalled()
  })

  it('does not offer verify repair without npm install_type', async () => {
    useCtx7Manifest('tools', null)
    vi.mocked(runStepBInstall).mockReset()
    vi.mocked(runStepBInstall).mockResolvedValueOnce(verifyFailedBase())

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(confirm).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('ctx7') }),
    )
    expect(runInstall).not.toHaveBeenCalled()
  })

  it.each([
    ['declined', false],
    ['failed', true],
  ] as const)('converges duplicate skipped and failed states after verify repair %s', async (outcome, shouldInstall) => {
    useCtx7Manifest()
    const initial = stepB({
      skipped: [{ name: 'ctx7', reason: 'level-flag-missing' }],
      failed: ['ctx7: old verify reason'],
      failureKeywords: { ctx7: 'verify-failed' },
      componentTypes: { ctx7: 'cli-binary' },
    })
    vi.mocked(runStepBInstall).mockResolvedValueOnce(initial)
    vi.mocked(confirm).mockResolvedValue(outcome !== 'declined')
    if (shouldInstall) {
      vi.mocked(runInstall)
        .mockReset()
        .mockResolvedValue({
          ok: false,
          phase: 'verify',
          error: { message: 'latest verify reason' },
        } as never)
    }

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(confirm).toHaveBeenCalledOnce()
    expect(initial.skipped).toEqual([])
    expect(initial.failed).toEqual([
      shouldInstall ? 'ctx7: latest verify reason' : 'ctx7: old verify reason',
    ])
  })

  it.each([
    ['--non-interactive', ['--non-interactive']],
    ['non-TTY', []],
  ] as const)('%s verify repair prints the forced-update command', async (mode, args) => {
    useCtx7Manifest()
    vi.mocked(runStepBInstall).mockResolvedValueOnce(verifyFailedBase())
    if (mode === 'non-TTY') {
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
    }

    await expect(runSetup([...args])).rejects.toMatchObject({ code: 1 })

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('harnessed setup --system --non-interactive --update-installed'),
    )
    expect(confirm).not.toHaveBeenCalled()
    expect(runInstall).not.toHaveBeenCalled()
  })

  it.each([
    ['spawn', 'npm install exited 1'],
    ['verify', 'verify failed: ctx7 --version exited 1'],
  ] as const)('approved rescue %s failure exits one after setup tail work', async (phase, reason) => {
    vi.mocked(runInstall).mockResolvedValue({
      ok: false,
      phase,
      error: { message: reason },
    } as never)

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.failed).toEqual([`gstack: ${reason}`])
    expect(result.skipped).toEqual([])
    expect(confirm).toHaveBeenCalledOnce()
    expect(runInstall).toHaveBeenCalledTimes(2)
    expect(runInstall).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ system: true, nonInteractive: true, updateInstalled: false }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(vi.mocked(runInstall).mock.invocationCallOrder[1]).toBeGreaterThan(
      vi.mocked(confirm).mock.invocationCallOrder[0] ?? 0,
    )
    expect(console.error).toHaveBeenCalledWith(`  [L4 rescue] gstack: ${reason}`)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('1 component(s) failed'))
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
    expect(checkGuardConflict).toHaveBeenCalledOnce()
    expect(vi.mocked(process.exit).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(checkGuardConflict).mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('approved successful rescue merges installed and removes its original skip', async () => {
    vi.mocked(runInstall).mockResolvedValue({ ok: true } as never)

    await expect(runSetup([])).rejects.toMatchObject({ code: 0 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.installed).toEqual(['gstack'])
    expect(result.skipped).toEqual([])
    expect(result.failed).toEqual([])
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 base manifests configured'))
  })

  it.each([
    'declined',
    'cancelled',
  ])('%s rescue keeps the skip without system install', async (answer) => {
    vi.mocked(confirm).mockResolvedValue(answer === 'declined' ? false : Symbol('cancel'))
    vi.mocked(isCancel).mockReturnValue(answer === 'cancelled')

    await expect(runSetup([])).rejects.toMatchObject({ code: 0 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.skipped).toEqual([{ name: 'gstack', reason: 'level-flag-missing' }])
    expect(result.installed).toEqual([])
    expect(result.failed).toEqual([])
    expect(confirm).toHaveBeenCalledOnce()
    expect(runInstall).toHaveBeenCalledOnce()
    expect(runInstall).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ system: true }),
      expect.objectContaining({ hostId: 'codex' }),
    )
  })

  it('an aborted approved retry remains skipped', async () => {
    vi.mocked(runInstall).mockResolvedValue({ aborted: true, reason: 'user-cancel' })

    await expect(runSetup([])).rejects.toMatchObject({ code: 0 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.skipped).toEqual([{ name: 'gstack', reason: 'level-flag-missing' }])
    expect(result.failed).toEqual([])
    expect(runInstall).toHaveBeenCalledTimes(2)
  })

  it.each([
    '--non-interactive',
    'stdin',
    'stdout',
  ])('%s suppresses rescue approval and system installation', async (gate) => {
    if (gate === 'stdin' || gate === 'stdout') {
      Object.defineProperty(process[gate], 'isTTY', { value: false, configurable: true })
    }

    await expect(runSetup(gate === '--non-interactive' ? [gate] : [])).rejects.toMatchObject({
      code: 0,
    })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.skipped).toEqual([{ name: 'gstack', reason: 'level-flag-missing' }])
    expect(confirm).not.toHaveBeenCalled()
    expect(runInstall).toHaveBeenCalledOnce()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('harnessed setup --system --non-interactive'),
    )
  })

  it.each([
    false,
    true,
  ])('non-TTY --system authorizes Step B with force-update=%s', async (forceUpdate) => {
    for (const stream of streams) {
      Object.defineProperty(stream, 'isTTY', { value: false, configurable: true })
    }
    vi.mocked(runInstall)
      .mockReset()
      .mockImplementation(async (_manifest, opts) =>
        opts.system ? ({ ok: true } as never) : { aborted: true, reason: 'level-flag-missing' },
      )

    await expect(
      runSetup(['--system', '--non-interactive', ...(forceUpdate ? ['--update-installed'] : [])]),
    ).rejects.toMatchObject({ code: 0 })

    expect(runStepBInstall).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ system: true, updateInstalled: forceUpdate }),
    )
    expect(runInstall).toHaveBeenCalledOnce()
    expect(vi.mocked(runInstall).mock.calls[0]?.[1]).not.toHaveProperty('codexHookTrust')
    expect(runOptionalOffer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ interactive: false, trustCodexHooks: false }),
      expect.objectContaining({ hostId: 'codex' }),
    )
    expect(confirm).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 base manifests configured'))
  })

  it.each([
    false,
    true,
  ])('interactive force-update preserves explicit system=%s on both passes', async (system) => {
    vi.mocked(runInstall)
      .mockReset()
      .mockImplementation(async (_manifest, opts) => {
        if (!opts.updateInstalled) return { ok: true, alreadyInstalled: true } as never
        return opts.system
          ? ({ ok: true } as never)
          : { aborted: true, reason: 'level-flag-missing' }
      })

    await expect(runSetup(system ? ['--system'] : [])).rejects.toMatchObject({ code: 0 })

    expect(runStepBInstall).toHaveBeenCalledTimes(2)
    for (const call of vi.mocked(runStepBInstall).mock.calls) {
      expect(call[1]?.system).toBe(system)
    }
    const finalResult = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(finalResult.installed).toEqual(system ? ['gstack'] : [])
    expect(finalResult.alreadyInstalled).toEqual(system ? [] : ['gstack'])
    expect(finalResult.skipped).toEqual([])
    const forceResult = await vi.mocked(runStepBInstall).mock.results[1]?.value
    if (system) {
      expect(forceResult.installed).toEqual(['gstack'])
      expect(forceResult.skipped).toEqual([])
    } else {
      expect(forceResult.skipped[0]?.reason).toContain('excluded from force-update')
    }
    expect(confirm).toHaveBeenCalledOnce()
  })

  it('non-interactive force-update without system consent keeps the skip and remedy', async () => {
    await expect(runSetup(['--update-installed', '--non-interactive'])).rejects.toMatchObject({
      code: 0,
    })
    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.skipped[0]?.reason).toContain('excluded from force-update')
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('harnessed setup --system --non-interactive'),
    )
    expect(confirm).not.toHaveBeenCalled()
    expect(runInstall).toHaveBeenCalledOnce()
  })

  it.each([
    'spawn',
    'verify',
  ])('force-update %s failure replaces prior success and exits one', async (phase) => {
    const first = stepB({ alreadyInstalled: ['gstack'] })
    const reason = `gstack: ${phase} failed after approval`
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(stepB({ failed: [reason] }))

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 1 })

    expect(first.failed).toEqual([reason])
    expect(first.alreadyInstalled).toEqual([])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`${phase} failed after approval`),
    )
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })

  it('force-update recovery removes the same component first-pass failure', async () => {
    const first = stepB({
      alreadyInstalled: ['existing'],
      failed: ['gstack: first attempt failed'],
    })
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(stepB({ installed: ['gstack'], alreadyInstalled: ['existing'] }))

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 0 })

    expect(first.failed).toEqual([])
    expect(first.installed).toEqual(['gstack'])
    expect(first.alreadyInstalled).toEqual(['existing'])
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('component(s) failed'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 base manifests configured'))
  })

  it('retains a verified existing version as a warning and configured component', async () => {
    const first = stepB({ alreadyInstalled: ['gstack'] })
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(stepB({ failed: ['gstack: refresh failed'] }))
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 0 })

    expect(first.keptExisting).toEqual([{ name: 'gstack', reason: 'refresh failed' }])
    expect(first.failed).toEqual([])
    expect(first.alreadyInstalled).toEqual([])
    expect(verifyInstalled).toHaveBeenCalledOnce()
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('prior version retained'))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 base manifests configured'))
  })

  it.each([
    'false',
    'throw',
  ] as const)('reports structured update-unsupported as kept-existing and exits zero without a %s runtime probe', async (probeOutcome) => {
    vi.mocked(runInstall)
      .mockReset()
      .mockResolvedValueOnce({ ok: true, alreadyInstalled: true } as never)
      .mockResolvedValueOnce({
        ok: false,
        phase: 'preflight',
        error: { message: 'opaque provenance refusal', keyword: 'update-unsupported' },
      } as never)
    vi.mocked(isAlreadyInstalled).mockImplementation(async () => {
      if (probeOutcome === 'throw') throw new Error('runtime unavailable')
      return false
    })
    vi.mocked(verifyInstalled).mockRejectedValue(new Error('runtime must not be checked'))

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 0 })

    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.keptExisting).toEqual([{ name: 'gstack', reason: 'opaque provenance refusal' }])
    expect(result.failed).toEqual([])
    expect(result.alreadyInstalled).toEqual([])
    expect(isAlreadyInstalled).not.toHaveBeenCalled()
    expect(verifyInstalled).not.toHaveBeenCalled()
    expect(runInstall).toHaveBeenCalledTimes(2)
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('0 installed / 1 kept-existing / 0 still-already-installed'),
    )
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 base manifests configured'))
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('setup incomplete'))
  })

  it('presence without runtime health remains a genuine force-update failure', async () => {
    const first = stepB({ alreadyInstalled: ['gstack'] })
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(stepB({ failed: ['gstack: runtime helper broken'] }))
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    vi.mocked(verifyInstalled).mockResolvedValue({
      ok: false,
      phase: 'verify',
      error: { message: 'runtime helper broken' },
    } as never)

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 1 })

    expect(first.failed).toEqual(['gstack: runtime helper broken'])
    expect(first.keptExisting ?? []).toEqual([])
    expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('prior version retained'))
  })

  it('merges by component without losing MCP success or earlier failures on a skip', async () => {
    const first = stepB({
      installed: ['mcp-server'],
      alreadyInstalled: ['gstack'],
      failed: ['unrecovered: first pass failed'],
      componentTypes: { 'mcp-server': 'mcp-tool' },
    })
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(
        stepB({
          installed: ['gstack'],
          skipped: [
            { name: 'mcp-server', reason: 'excluded from force-update' },
            { name: 'unrecovered', reason: 'harness-mismatch' },
          ],
          componentTypes: { gstack: 'command' },
        }),
      )

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 1 })

    expect(first.installed).toEqual(['mcp-server', 'gstack'])
    expect(first.alreadyInstalled).toEqual([])
    expect(first.skipped).toEqual([])
    expect(first.failed).toEqual(['unrecovered: first pass failed'])
    expect(first.componentTypes).toEqual({ 'mcp-server': 'mcp-tool', gstack: 'command' })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /setup incomplete.*2 base component\(s\) configured.*1 component\(s\) failed/,
      ),
    )
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('setup complete'))
  })

  it('a force-update success replaces the original skip without duplicating other components', async () => {
    const first = stepB({
      alreadyInstalled: ['existing'],
      skipped: [{ name: 'gstack', reason: 'user-cancel' }],
    })
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(stepB({ installed: ['gstack'], alreadyInstalled: ['existing'] }))

    await expect(runSetup(['--system'])).rejects.toMatchObject({ code: 0 })

    expect(first.skipped).toEqual([])
    expect(first.installed).toEqual(['gstack'])
    expect(first.alreadyInstalled).toEqual(['existing'])
  })

  it.each([
    'installed',
    'declined',
    'failed',
  ] as const)('force-update preserves an L4 skip for the subsequent rescue: %s', async (outcome) => {
    vi.mocked(readdir).mockImplementation(async (path, options?: unknown) => {
      const normalized = String(path).replaceAll('\\', '/')
      if (options && typeof options === 'object' && 'withFileTypes' in options) {
        return ['SKILL.md', 'workflow.yaml'].map((name) => ({
          name,
          isDirectory: () => false,
        })) as never
      }
      return (
        normalized.endsWith('/workflows')
          ? ['demo']
          : normalized.endsWith('/tools')
            ? ['ctx7.yaml']
            : normalized.endsWith('/skill-packs')
              ? ['gstack.yaml']
              : []
      ) as never
    })
    vi.spyOn(manifestValidation, 'validateManifestFile').mockImplementation((_source, path) => {
      const l4 = String(path).endsWith('ctx7.yaml')
      return {
        ok: true,
        manifest: {
          metadata: { name: l4 ? 'ctx7' : 'gstack' },
          spec: {
            install: {
              method: l4 ? 'npm-cli' : 'git-clone-with-setup',
              cmd: l4 ? 'npm install -g ctx7' : 'git clone fixture',
            },
          },
        },
      } as never
    })
    vi.mocked(confirm)
      .mockReset()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(outcome !== 'declined')
    vi.mocked(runInstall)
      .mockReset()
      .mockImplementation(async (manifest, opts) => {
        if (manifest.metadata.name !== 'ctx7') {
          return opts.updateInstalled
            ? ({ ok: true } as never)
            : ({ ok: true, alreadyInstalled: true } as never)
        }
        if (!opts.system) return { aborted: true, reason: 'level-flag-missing' }
        return outcome === 'failed'
          ? ({ ok: false, phase: 'verify', error: { message: 'ctx7 runtime failed' } } as never)
          : ({ ok: true } as never)
      })

    await expect(runSetup([])).rejects.toMatchObject({ code: outcome === 'failed' ? 1 : 0 })

    expect(runStepBInstall).toHaveBeenCalledTimes(2)
    const forceResult = await vi.mocked(runStepBInstall).mock.results[1]?.value
    expect(forceResult.skipped).toEqual([
      { name: 'ctx7', reason: expect.stringContaining('L4 system-scope') },
    ])
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(confirm).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: expect.stringContaining('Run L4 install for "ctx7"?'),
      }),
    )
    const authorized = vi.mocked(runInstall).mock.calls.filter(([, opts]) => opts.system)
    expect(authorized).toHaveLength(outcome === 'declined' ? 0 : 1)
    if (outcome !== 'declined') {
      expect(vi.mocked(runInstall).mock.invocationCallOrder.at(-1)).toBeGreaterThan(
        vi.mocked(confirm).mock.invocationCallOrder[1] ?? 0,
      )
    }
    const finalResult = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(finalResult.installed).toEqual(outcome === 'installed' ? ['gstack', 'ctx7'] : ['gstack'])
    expect(finalResult.skipped).toEqual(
      outcome === 'declined' ? [{ name: 'ctx7', reason: 'level-flag-missing' }] : [],
    )
    expect(finalResult.failed).toEqual(outcome === 'failed' ? ['ctx7: ctx7 runtime failed'] : [])
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })

  it.each([false, true])('dry-run never prompts or installs with system=%s', async (system) => {
    await expect(runSetup(['--dry-run', ...(system ? ['--system'] : [])])).rejects.toMatchObject({
      code: 0,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(runInstall).not.toHaveBeenCalled()
  })

  it('successful rescue preserves earlier installs, failures and unrelated skips', async () => {
    const initial = {
      installed: ['existing'],
      alreadyInstalled: [],
      skipped: [
        { name: 'gstack', reason: 'level-flag-missing' },
        { name: 'claude-only', reason: 'harness-mismatch' },
      ],
      failed: ['other: base install failed'],
      elapsedMs: 1,
      componentTypes: {},
    }
    vi.mocked(runStepBInstall).mockResolvedValueOnce(initial)
    vi.mocked(runInstall)
      .mockReset()
      .mockResolvedValue({ ok: true } as never)

    await expect(runSetup([])).rejects.toMatchObject({ code: 1 })

    expect(initial.installed).toEqual(['existing', 'gstack'])
    expect(initial.skipped).toEqual([{ name: 'claude-only', reason: 'harness-mismatch' }])
    expect(initial.failed).toEqual(['other: base install failed'])
    expect(checkGuardConflict).toHaveBeenCalledOnce()
  })
})
