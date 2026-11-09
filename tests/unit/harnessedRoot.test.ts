import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getHarnessedRoot,
  harnessedFile,
  migrateLegacyHarnessedRoot,
} from '../../src/platform/harnessedRoot.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

const roots: string[] = []
const renameGate = vi.hoisted(() => ({ error: undefined as NodeJS.ErrnoException | undefined }))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    renameSync: (...args: Parameters<typeof actual.renameSync>) => {
      if (renameGate.error !== undefined) throw renameGate.error
      return actual.renameSync(...args)
    },
  }
})

afterEach(() => {
  renameGate.error = undefined
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(host: 'claude' | 'codex' = 'codex') {
  const userHome = mkdtempSync(join(tmpdir(), 'harnessed-root-'))
  roots.push(userHome)
  const nativeHome = join(userHome, host === 'claude' ? '.claude' : 'custom-codex')
  const stateRoot = join(nativeHome, 'harnessed')
  const base = host === 'claude' ? claudeDescriptor(userHome) : codexDescriptor(userHome)
  const context = createHostInstallContext(
    { ...base, homeDir: nativeHome, stateRoot },
    { userHome, os: process.platform, nativeHome },
  )
  return { userHome, stateRoot, context }
}

describe('migrateLegacyHarnessedRoot', () => {
  it.each([
    ['claude', false],
    ['claude', true],
    ['codex', false],
    ['codex', true],
  ] as const)('skips migration under HARNESSED_ROOT_OVERRIDE (%s, native=%s) — zero fs changes', (host, nativePresent) => {
    const { userHome, stateRoot, context } = fixture(host)
    const override = join(userHome, 'isolated-state')
    const legacyRoot = join(userHome, '.harnessed')
    mkdirSync(legacyRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')
    const legacyMtime = statSync(join(legacyRoot, 'state.json')).mtimeMs
    let nativeMtime = -1
    if (nativePresent) {
      mkdirSync(stateRoot, { recursive: true })
      writeFileSync(join(stateRoot, 'keep'), 'native must stay')
      nativeMtime = statSync(join(stateRoot, 'keep')).mtimeMs
    }
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', override)

    migrateLegacyHarnessedRoot(context)

    expect(readFileSync(join(legacyRoot, 'state.json'), 'utf8')).toBe('legacy')
    expect(statSync(join(legacyRoot, 'state.json')).mtimeMs).toBe(legacyMtime)
    expect(existsSync(join(userHome, '.harnessed.legacy-bak'))).toBe(false)
    expect(existsSync(override)).toBe(false) // no override-target creation
    if (nativePresent) {
      expect(readFileSync(join(stateRoot, 'keep'), 'utf8')).toBe('native must stay')
      expect(statSync(join(stateRoot, 'keep')).mtimeMs).toBe(nativeMtime)
    } else {
      expect(existsSync(stateRoot)).toBe(false)
    }
  })

  it('skips migration for a whitespace-only override value', () => {
    const { userHome, context } = fixture()
    const legacyRoot = join(userHome, '.harnessed')
    mkdirSync(legacyRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '   ')

    migrateLegacyHarnessedRoot(context)

    expect(existsSync(legacyRoot)).toBe(true)
    expect(existsSync(join(userHome, '.harnessed.legacy-bak'))).toBe(false)
  })

  it.each([
    ['unset', undefined],
    ['empty', ''],
  ] as const)('migrates normally when override is %s', (_label, value) => {
    const { userHome, stateRoot, context } = fixture()
    const legacyRoot = join(userHome, '.harnessed')
    mkdirSync(legacyRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', value)

    migrateLegacyHarnessedRoot(context)

    expect(existsSync(legacyRoot)).toBe(false)
    expect(readFileSync(join(stateRoot, 'state.json'), 'utf8')).toBe('legacy')
  })

  it('renames legacy state into the captured host stateRoot', () => {
    const { userHome, stateRoot, context } = fixture()
    const legacyRoot = join(userHome, '.harnessed')
    mkdirSync(legacyRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')

    migrateLegacyHarnessedRoot(context)

    expect(existsSync(legacyRoot)).toBe(false)
    expect(readFileSync(join(stateRoot, 'state.json'), 'utf8')).toBe('legacy')
  })

  it('preserves legacy data at .legacy-bak when both roots exist', () => {
    const { userHome, stateRoot, context } = fixture()
    const legacyRoot = join(userHome, '.harnessed')
    const safetyBak = join(userHome, '.harnessed.legacy-bak')
    mkdirSync(legacyRoot, { recursive: true })
    mkdirSync(stateRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')
    writeFileSync(join(stateRoot, 'state.json'), 'current')

    migrateLegacyHarnessedRoot(context)

    expect(existsSync(legacyRoot)).toBe(false)
    expect(readFileSync(join(safetyBak, 'state.json'), 'utf8')).toBe('legacy')
    expect(readFileSync(join(stateRoot, 'state.json'), 'utf8')).toBe('current')
  })

  it('warns and leaves legacy data in place when rename crosses devices', () => {
    const { userHome, stateRoot, context } = fixture()
    const legacyRoot = join(userHome, '.harnessed')
    mkdirSync(legacyRoot, { recursive: true })
    writeFileSync(join(legacyRoot, 'state.json'), 'legacy')
    renameGate.error = Object.assign(new Error('cross-device rename'), { code: 'EXDEV' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => migrateLegacyHarnessedRoot(context)).not.toThrow()

    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN.*EXDEV/))
    expect(readFileSync(join(legacyRoot, 'state.json'), 'utf8')).toBe('legacy')
    expect(existsSync(stateRoot)).toBe(false)
    expect(existsSync(join(userHome, '.harnessed.legacy-bak'))).toBe(false)
  })
})

describe('custom host root path resolution', () => {
  it.each([
    ['CLAUDE_CONFIG_DIR', 'claude-home'],
    ['CODEX_HOME', 'codex-home'],
  ] as const)('routes checkpoint and status files through %s', (envVar, directory) => {
    const userHome = mkdtempSync(join(tmpdir(), 'harnessed-custom-root-'))
    roots.push(userHome)
    const nativeHome = join(userHome, directory)
    vi.stubEnv(envVar, nativeHome)

    expect(getHarnessedRoot()).toBe(join(nativeHome, 'harnessed'))
    expect(harnessedFile('current-workflow.json')).toBe(
      join(nativeHome, 'harnessed', 'current-workflow.json'),
    )
    expect(harnessedFile('workflows.json')).toBe(join(nativeHome, 'harnessed', 'workflows.json'))
    expect(harnessedFile('state.json')).toBe(join(nativeHome, 'harnessed', 'state.json'))
  })
})
