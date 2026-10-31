import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getHarnessedRoot,
  harnessedFile,
  migrateLegacyHarnessedRoot,
} from '../../src/platform/harnessedRoot.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { codexDescriptor } from '../../src/platform/platform.js'

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

function fixture() {
  const userHome = mkdtempSync(join(tmpdir(), 'harnessed-root-'))
  roots.push(userHome)
  const nativeHome = join(userHome, 'custom-codex')
  const stateRoot = join(nativeHome, 'harnessed')
  const context = createHostInstallContext(
    { ...codexDescriptor(userHome), homeDir: nativeHome, stateRoot },
    { userHome, os: process.platform, nativeHome },
  )
  return { userHome, stateRoot, context }
}

describe('migrateLegacyHarnessedRoot', () => {
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
