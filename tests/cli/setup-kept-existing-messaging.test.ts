// Phase 85 — the kept-existing summary must be HONEST about retryability.
//
// A force-update refresh that failed but left a usable prior version is a
// warning, not a failure. But not every kept-existing entry is retryable: an
// `update-unsupported` refusal is a CONTRACT decision (the existing source is
// not provably ours), so re-running the very same setup cannot change the
// outcome. Telling the user to "re-run `harnessed setup` later to retry" for
// such a component is a lie — the user must instead update it with its
// upstream tool.
//
// These tests drive the REAL printing code in src/cli/setup.ts (the
// force-update second pass) through registerSetup, mocking only the Step B
// entry point (runStepBInstall) — the same seam tests/cli/setup-failure-exit.test.ts
// uses. The classification (retryable vs refused) comes from the real
// reclassifyForceUpdateFailures + the real retained-version probe.

import { readdir } from 'node:fs/promises'
import { confirm, isCancel } from '@clack/prompts'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Reclassify = typeof import('../../src/cli/lib/setup-helpers.js').reclassifyForceUpdateFailures

// Phase 85 — the classifier always sets `retryable` explicitly, so the
// "no flag" branch of the printing code is only reachable with a pre-aggregated
// entry. This holder lets ONE test inject that shape without replacing the
// printing code under test.
const state = vi.hoisted(() => ({
  reclassifyOverride: undefined as Reclassify | undefined,
}))

vi.mock('node:fs/promises', () => ({
  access: vi.fn(async () => {}),
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
vi.mock('../../src/installers/lib/idempotent.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/installers/lib/idempotent.js')>()
  return { ...original, isAlreadyInstalled: vi.fn() }
})
vi.mock('../../src/installers/lib/verifyInstalled.js', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../src/installers/lib/verifyInstalled.js')>()
  return { ...original, verifyInstalled: vi.fn() }
})
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
    reclassifyForceUpdateFailures: (
      first: Parameters<Reclassify>[0],
      next: Parameters<Reclassify>[1],
      probe: Parameters<Reclassify>[2],
    ) =>
      state.reclassifyOverride
        ? state.reclassifyOverride(first, next, probe)
        : original.reclassifyForceUpdateFailures(first, next, probe),
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
  auditInstalledSkills: vi.fn(async () => []),
  buildCulpritIndex: async () => ({}),
  attachCulprits: (audit: unknown[]) => audit,
  integrityReportLines: () => [],
}))
vi.mock('../../src/cli/lib/check-guard-conflict.js', () => ({
  checkGuardConflict: vi.fn(async () => ({ status: 'pass' })),
}))

import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import { runOptionalOffer } from '../../src/cli/lib/optional-offer.js'
import { runStepBInstall, type StepBResult } from '../../src/cli/lib/setup-helpers.js'
import { registerSetup } from '../../src/cli/setup.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'

const RETRY_HINT = 'Re-run `harnessed setup` later to retry'
const REFUSAL_HINT = 'harnessed refuses to replace them'

class ExitError extends Error {
  constructor(readonly code: number | string | null | undefined) {
    super(`exit(${code})`)
  }
}

const streams = [process.stdin, process.stdout]
const ttyDescriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, 'isTTY'))

beforeEach(() => {
  vi.clearAllMocks()
  state.reclassifyOverride = undefined
  for (const stream of streams) {
    Object.defineProperty(stream, 'isTTY', { value: true, configurable: true })
  }
  vi.mocked(runStepBInstall).mockReset()
  vi.mocked(isAlreadyInstalled).mockReset().mockResolvedValue(true)
  vi.mocked(verifyInstalled).mockReset().mockResolvedValue(null)
  vi.mocked(confirm).mockReset().mockResolvedValue(true)
  vi.mocked(isCancel).mockReset().mockReturnValue(false)
  vi.mocked(enableAgentTeamsInSettings).mockReset().mockResolvedValue({
    status: 'already-enabled',
    path: '/fixture/settings.json',
  })
  vi.mocked(enableUserLangInSettings).mockReset().mockResolvedValue({
    status: 'already-set',
    path: '/fixture/user-lang',
    existing: 'en',
  })
  vi.mocked(runOptionalOffer).mockReset().mockResolvedValue({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
  })
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
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitError(code)
  })
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
})

afterEach(() => {
  streams.forEach((stream, index) => {
    const descriptor = ttyDescriptors[index]
    if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
    else Reflect.deleteProperty(stream, 'isTTY')
  })
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

async function runSetup(args: string[] = []): Promise<void> {
  const program = new Command().exitOverride()
  registerSetup(program)
  await program.parseAsync(['node', 'harnessed', 'setup', '--platform', 'codex', ...args])
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

function warnLines(): string[] {
  return vi
    .mocked(console.warn)
    .mock.calls.flat()
    .map((line) => String(line))
}

describe('setup force-update kept-existing messaging', () => {
  it('a refusal is reported as a refusal — no retry hint, the component is named', async () => {
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(stepB({ alreadyInstalled: ['gstack'] }))
      .mockResolvedValueOnce(
        stepB({
          failed: ['gstack: existing source is not provably ours'],
          failureKeywords: { gstack: 'update-unsupported' },
        }),
      )

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    const lines = warnLines()
    expect(lines.some((line) => line.includes(RETRY_HINT))).toBe(false)
    expect(lines.some((line) => line.includes(REFUSAL_HINT) && line.includes('gstack'))).toBe(true)
    // The refusal is a contract decision — the retained component is still
    // configured, not failed.
    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.failed).toEqual([])
    expect(result.keptExisting).toEqual([
      {
        name: 'gstack',
        reason: 'existing source is not provably ours',
        retryable: false,
      },
    ])
  })

  it('a transient refresh failure keeps the retry hint', async () => {
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(stepB({ alreadyInstalled: ['gstack'] }))
      .mockResolvedValueOnce(
        stepB({
          failed: ['gstack: npm install exited 1'],
          failureKeywords: { gstack: 'spawn-failed' },
        }),
      )

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    const lines = warnLines()
    expect(lines.some((line) => line.includes(RETRY_HINT))).toBe(true)
    expect(lines.some((line) => line.includes(REFUSAL_HINT))).toBe(false)
    const result = await vi.mocked(runStepBInstall).mock.results[0]?.value
    expect(result.keptExisting).toEqual([
      { name: 'gstack', reason: 'npm install exited 1', retryable: true },
    ])
  })

  it('a kept-existing entry without a retryable flag keeps the retry hint', async () => {
    state.reclassifyOverride = (async () => ({
      failed: [],
      keptExisting: [{ name: 'gstack', reason: 'refresh failed' }],
    })) as Reclassify
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(stepB({ alreadyInstalled: ['gstack'] }))
      .mockResolvedValueOnce(stepB({ failed: ['gstack: refresh failed'] }))

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    const lines = warnLines()
    expect(lines.some((line) => line.includes(RETRY_HINT))).toBe(true)
    expect(lines.some((line) => line.includes(REFUSAL_HINT))).toBe(false)
  })

  it('the consent prompt names the global npm tools it upgrades in system scope', async () => {
    vi.mocked(runStepBInstall)
      .mockResolvedValueOnce(
        stepB({
          alreadyInstalled: ['ctx7', 'gstack'],
          globalNpmComponents: ['ctx7'],
        }),
      )
      .mockResolvedValueOnce(stepB({ installed: ['ctx7', 'gstack'] }))

    await expect(runSetup()).rejects.toMatchObject({ code: 0 })

    const message = String(vi.mocked(confirm).mock.calls[0]?.[0]?.message ?? '')
    expect(message).toContain('ctx7')
    expect(message).toContain('system scope')
    // The second pass is the force pass — it must run with the system scope
    // granted to the global npm component.
    const forceCall = vi.mocked(runStepBInstall).mock.calls[1]?.[1]
    expect(forceCall).toMatchObject({ updateInstalled: true, forceSystemScope: true })
  })
})
