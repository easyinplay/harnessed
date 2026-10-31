import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as prompts from '@clack/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAutoInstall } from '../../src/cli/lib/auto-install.js'
import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import { mergeSettingsEnvKey } from '../../src/cli/lib/settingsWriter.js'
import {
  readUserLangPin,
  userLangPinPath,
  writeUserLangPin,
} from '../../src/cli/lib/userLangPin.js'
import {
  createHostInstallContext,
  type HostInstallContext,
} from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

const doctor = vi.hoisted(() => ({ check: vi.fn() }))
vi.mock('../../src/cli/lib/doctor-registry.js', () => ({
  CHECKS: [{ name: 'optional-claude', hosts: ['claude'], fn: doctor.check }],
}))
vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync: vi.fn() }))
vi.mock('@clack/prompts', () => ({ confirm: vi.fn(), isCancel: vi.fn(() => false) }))

let root: string
let claude: HostInstallContext
let codex: HostInstallContext

function fixture(hostId: 'claude' | 'codex'): HostInstallContext {
  const userHome = join(root, hostId)
  const descriptor = hostId === 'claude' ? claudeDescriptor(userHome) : codexDescriptor(userHome)
  return createHostInstallContext(
    { ...descriptor, stateRoot: join(userHome, 'captured-state') },
    {
      os: process.platform,
      userHome,
      nativeHome: join(userHome, 'custom-native'),
    },
  )
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'host-setup-context-'))
  claude = fixture('claude')
  codex = fixture('codex')
  vi.stubEnv('HOME', join(root, 'ambient'))
  vi.stubEnv('USERPROFILE', join(root, 'ambient'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'ambient-state'))
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('CODEX_HOME', join(root, 'ambient-codex'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'ambient-claude'))
  vi.stubEnv('HARNESSED_SPAWN_CWD', join(root, 'ambient-neutral'))
  doctor.check.mockReset().mockResolvedValue({
    name: 'optional-claude',
    status: 'warn',
    message: 'not installed',
    install_commands: [
      'claude plugin marketplace add fixture/repo',
      'claude plugin install fixture',
    ],
  })
  vi.mocked(prompts.confirm).mockReset().mockResolvedValue(true)
  vi.mocked(spawnSync)
    .mockReset()
    .mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await rm(root, { recursive: true, force: true })
})

describe('captured auto-install policy', () => {
  it('falls back to captured userHome when the neutral directory cannot be created', async () => {
    const blocker = join(root, 'blocked-state')
    await writeFile(blocker, 'not a directory')
    await mkdir(claude.userHome, { recursive: true })
    const host = { ...claude, platform: { ...claude.platform, stateRoot: join(blocker, 'nested') } }
    await runAutoInstall({ nonInteractive: false, autoInstall: true }, host)
    expect(vi.mocked(spawnSync).mock.calls[0]?.[2]?.cwd).toBe(host.userHome)
  })

  it('skips Codex as unsupported before doctor reads, prompts or any install commands', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const result = await runAutoInstall({ nonInteractive: false, autoInstall: true }, codex)
    expect(result).toEqual({ installed: [], skipped: ['auto-install'], failed: [] })
    expect(doctor.check).not.toHaveBeenCalled()
    expect(prompts.confirm).not.toHaveBeenCalled()
    expect(spawnSync).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/unsupported-operation.*codex/))
    expect(existsSync(codex.platform.stateRoot)).toBe(false)
  })

  it('keeps Claude command policy and consent while pinning env and neutral cwd', async () => {
    vi.stubEnv('PRIVATE_TOKEN', 'existing-install-secret')
    const result = await runAutoInstall({ nonInteractive: false, autoInstall: true }, claude)
    expect(result).toEqual({ installed: ['optional-claude'], skipped: [], failed: [] })
    expect(prompts.confirm).toHaveBeenCalledOnce()
    expect(vi.mocked(spawnSync).mock.calls.map((call) => [call[0], call[1]])).toEqual([
      ['claude', ['plugin', 'marketplace', 'add', 'fixture/repo']],
      ['claude', ['plugin', 'install', 'fixture']],
    ])
    for (const call of vi.mocked(spawnSync).mock.calls) {
      expect(call[2]).toMatchObject({
        cwd: join(claude.platform.stateRoot, '.spawn'),
        shell: true,
        stdio: 'inherit',
        env: {
          HOME: claude.userHome,
          USERPROFILE: claude.userHome,
          CLAUDE_CONFIG_DIR: claude.nativeHome,
          HARNESSED_PLATFORM: 'claude',
          HARNESSED_ROOT_OVERRIDE: claude.platform.stateRoot,
          HARNESSED_SPAWN_CWD: '',
          PRIVATE_TOKEN: 'existing-install-secret',
        },
      })
    }
    expect(process.env.HARNESSED_PLATFORM).toBe('codex')
    expect(process.env.CLAUDE_CONFIG_DIR).toBe(join(root, 'ambient-claude'))
  })

  it('uses a captured explicit neutral cwd even after the ambient override changes', async () => {
    const neutralSpawnCwd = join(root, 'captured-neutral')
    const host = { ...claude, neutralSpawnCwd }
    await runAutoInstall({ nonInteractive: false, autoInstall: true }, host)
    expect(vi.mocked(spawnSync).mock.calls[0]?.[2]).toMatchObject({
      cwd: neutralSpawnCwd,
      env: { HARNESSED_SPAWN_CWD: neutralSpawnCwd },
    })
  })

  it.each([
    'opt-out',
    'non-interactive',
    'declined',
  ] as const)('preserves %s consent policy', async (mode) => {
    if (mode === 'declined') vi.mocked(prompts.confirm).mockResolvedValueOnce(false)
    const result = await runAutoInstall(
      { nonInteractive: mode === 'non-interactive', autoInstall: mode !== 'opt-out' },
      claude,
    )
    expect(result.installed).toEqual([])
    expect(spawnSync).not.toHaveBeenCalled()
    if (mode !== 'declined') expect(prompts.confirm).not.toHaveBeenCalled()
    if (mode === 'opt-out') expect(doctor.check).not.toHaveBeenCalled()
    else expect(result.skipped).toEqual(['optional-claude'])
  })

  it('preserves legacy env inheritance when no context was passed', async () => {
    await runAutoInstall({ nonInteractive: false, autoInstall: true })
    const opts = vi.mocked(spawnSync).mock.calls[0]?.[2]
    expect(opts).not.toHaveProperty('env')
    expect(opts?.cwd).toBe(join(root, 'ambient-neutral'))
  })
})

describe('captured setup settings and language writes', () => {
  it('preserves original settings if the captured backup root is unwritable', async () => {
    const blocker = join(root, 'blocked-state')
    await writeFile(blocker, 'not a directory')
    await mkdir(claude.nativeHome, { recursive: true })
    const path = join(claude.nativeHome, 'settings.json')
    const original = '{"env":{"OTHER":"keep"}}\n'
    await writeFile(path, original)
    const host = { ...claude, platform: { ...claude.platform, stateRoot: join(blocker, 'nested') } }
    expect(
      await mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'yes', { hostContext: host }),
    ).toMatchObject({ outcome: 'warn' })
    expect(await readFile(path, 'utf8')).toBe(original)
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
  })

  it('creates settings under captured nativeHome after ambient host and native home drift', async () => {
    const path = join(claude.nativeHome, 'settings.json')
    expect(
      await mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'yes', { hostContext: claude }),
    ).toEqual({ outcome: 'created', path })
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      env: { GATEGUARD_EXEMPT_GLOBS: 'yes' },
    })
    expect(existsSync(join(claude.platform.homeDir, 'settings.json'))).toBe(false)
    expect(existsSync(join(root, 'ambient-claude'))).toBe(false)
  })

  it('backs up original settings only in captured stateRoot and preserves other keys', async () => {
    const path = join(claude.nativeHome, 'settings.json')
    const original = '{"env":{"OTHER":"keep"},"hooks":{"fixture":[]}}\r\n'
    await mkdir(claude.nativeHome, { recursive: true })
    await writeFile(path, original)
    const result = await mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'yes', {
      hostContext: claude,
    })
    expect(result.outcome).toBe('merged')
    if (result.outcome !== 'merged') throw new Error('expected backed-up settings merge')
    expect(result.backupPath.startsWith(join(claude.platform.stateRoot, 'backups'))).toBe(true)
    expect(await readFile(result.backupPath, 'utf8')).toBe(original)
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      env: { OTHER: 'keep', GATEGUARD_EXEMPT_GLOBS: 'yes' },
      hooks: { fixture: [] },
    })
    const backups = await readdir(join(claude.platform.stateRoot, 'backups'))
    expect(
      await mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'yes', {
        hostContext: claude,
        skipIfPresent: () => true,
      }),
    ).toEqual({ outcome: 'already', path, existing: 'yes' })
    expect(await readdir(join(claude.platform.stateRoot, 'backups'))).toEqual(backups)
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
  })

  it('passes the context through Agent Teams and language enablement without ambient reselection', async () => {
    const path = join(claude.nativeHome, 'settings.json')
    expect(await enableAgentTeamsInSettings(claude)).toEqual({ status: 'created', path })
    expect(await enableUserLangInSettings('zh-CN', claude)).toMatchObject({
      status: 'enabled',
      path,
      detected: 'zh-Hans',
    })
    expect(JSON.parse(await readFile(path, 'utf8')).env).toEqual({
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      HARNESSED_USER_LANG: 'zh-Hans',
    })
    expect(await enableAgentTeamsInSettings(claude)).toEqual({ status: 'already-enabled', path })
    expect(await enableUserLangInSettings(undefined, claude)).toMatchObject({
      status: 'already-set',
      existing: 'zh-Hans',
    })
    expect(existsSync(join(claude.platform.stateRoot, 'user-lang'))).toBe(false)
  })

  it('never writes Claude JSON for a captured Codex host even when ambient selection is Claude', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    expect(await enableAgentTeamsInSettings(codex)).toMatchObject({ status: 'warn' })
    expect(
      await mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'yes', { hostContext: codex }),
    ).toMatchObject({ outcome: 'warn' })
    const path = join(codex.platform.stateRoot, 'user-lang')
    expect(await enableUserLangInSettings('zh-CN', codex)).toEqual({
      status: 'pinned',
      path,
      detected: 'zh-Hans',
    })
    expect(await readFile(path, 'utf8')).toBe('zh-Hans\n')
    expect(existsSync(codex.nativeHome)).toBe(false)
    expect(existsSync(join(root, 'ambient', '.claude'))).toBe(false)
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
  })

  it('reads and writes each language pin from its own context while keeping argument order', async () => {
    for (const host of [claude, codex]) {
      expect(userLangPinPath(host)).toBe(join(host.platform.stateRoot, 'user-lang'))
      expect(readUserLangPin(host)).toBeUndefined()
      expect(await writeUserLangPin('en', host)).toBe(join(host.platform.stateRoot, 'user-lang'))
      vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'changed-state'))
      expect(readUserLangPin(host)).toBe('en')
      await writeFile(userLangPinPath(host), 'invalid\n')
      expect(readUserLangPin(host)).toBeUndefined()
    }
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
    expect(existsSync(join(root, 'changed-state'))).toBe(false)
  })

  it('removes a fresh settings file when its ownership receipt cannot be committed', async () => {
    const receiptPath = join(claude.platform.stateRoot, 'settings-env-ownership.json')
    await mkdir(receiptPath, { recursive: true })
    const path = join(claude.nativeHome, 'settings.json')
    const result = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'en', {
      hostContext: claude,
    })
    expect(result).toMatchObject({ outcome: 'warn' })
    expect(existsSync(path)).toBe(false)
  })

  it('restores existing settings when its ownership receipt cannot be committed', async () => {
    const path = join(claude.nativeHome, 'settings.json')
    const original = '{"env":{"OTHER":"keep"}}\n'
    await mkdir(claude.nativeHome, { recursive: true })
    await writeFile(path, original)
    await mkdir(join(claude.platform.stateRoot, 'settings-env-ownership.json'), {
      recursive: true,
    })
    const result = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'en', {
      hostContext: claude,
    })
    expect(result).toMatchObject({ outcome: 'warn' })
    expect(await readFile(path, 'utf8')).toBe(original)
  })
})
