import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const cli = vi.hoisted(() => ({
  npm: vi.fn(async () => ({ stdout: '88.0.0\n' })),
  bun: vi.fn(async (..._args: unknown[]) => ({ stdout: '"99.0.0"\n' })),
}))
vi.mock('node:child_process', () => {
  const execFileRunner = async (file: string, ...args: unknown[]) =>
    /(?:^|[\\/])npm(?:\.cmd)?$/.test(file) ? cli.npm() : cli.bun(file, ...args)
  return {
    exec: Object.assign(vi.fn(), { [Symbol.for('nodejs.util.promisify.custom')]: cli.npm }),
    execFile: Object.assign(vi.fn(), {
      [Symbol.for('nodejs.util.promisify.custom')]: execFileRunner,
    }),
  }
})

import {
  fetchLatestBunVersion,
  fetchLatestNpmVersion,
  fetchLatestVersion,
} from '../../src/cli/lib/version-check.js'
import * as runtime from '../../src/platform/runtime.js'

const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
const useBun = () =>
  Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.4.4' })

beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('unexpected direct registry fetch')
    }),
  ),
)

afterEach(() => {
  if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
  else Reflect.deleteProperty(process.versions, 'bun')
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('native package-manager version queries', () => {
  it('the default diagnostic lookup remains fail-soft if runtime detection fails', async () => {
    const detect = vi.spyOn(runtime, 'isBunRuntime').mockImplementation(() => {
      throw new Error('runtime probe unavailable')
    })
    try {
      await expect(fetchLatestVersion()).resolves.toBeNull()
    } finally {
      detect.mockRestore()
    }
  })

  it('Bun default diagnostic lookup uses bounded shell-free bun info, not npm or fetch', async () => {
    useBun()
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect(await fetchLatestVersion()).toBe('99.0.0')
    expect(cli.bun).toHaveBeenCalledWith(
      process.execPath,
      ['info', 'harnessed@latest', 'version', '--json'],
      { timeout: 8000, windowsHide: true, shell: false },
    )
    expect(cli.npm).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('an injected plain-text runner keeps its old behavior under Bun', async () => {
    useBun()
    expect(await fetchLatestVersion(async () => '4.5.0\n')).toBe('4.5.0')
    expect(cli.npm).not.toHaveBeenCalled()
    expect(cli.bun).not.toHaveBeenCalled()
  })

  it('Node default still uses the original npm runner, without Bun or fetch', async () => {
    Reflect.deleteProperty(process.versions, 'bun')
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect(await fetchLatestVersion()).toBe('88.0.0')
    expect(cli.npm).toHaveBeenCalledTimes(1)
    expect(cli.bun).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('Bun runtime explicit npm preserves the native custom-registry result', async () => {
    useBun()
    const registry = 'https://registry.fixture.invalid/private/'
    vi.stubEnv('npm_config_registry', registry)
    cli.npm.mockImplementationOnce(async () => ({
      stdout: process.env.npm_config_registry === registry ? '99.0.0\n' : '1.0.0\n',
    }))
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect(await fetchLatestNpmVersion()).toBe('99.0.0')
    expect(cli.npm).toHaveBeenCalledTimes(1)
    expect(cli.bun).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('Node explicit Bun resolves the native executable on PATH, retaining native config', async () => {
    Reflect.deleteProperty(process.versions, 'bun')
    vi.stubEnv('npm_config_registry', 'https://registry.fixture.invalid/bun/')
    cli.bun.mockImplementationOnce(async () => ({
      stdout:
        process.env.npm_config_registry === 'https://registry.fixture.invalid/bun/'
          ? '"4.5.0"'
          : '"1.0.0"',
    }))
    expect(await fetchLatestBunVersion()).toBe('4.5.0')
    expect(cli.bun).toHaveBeenCalledWith(
      process.platform === 'win32' ? 'bun.exe' : 'bun',
      ['info', 'harnessed@latest', 'version', '--json'],
      { timeout: 8000, windowsHide: true, shell: false },
    )
    expect(cli.npm).not.toHaveBeenCalled()
  })

  it('accepts only a JSON string containing a validated version', async () => {
    expect(await fetchLatestBunVersion(async () => '"4.5.0-rc.1"\n')).toBe('4.5.0-rc.1')
  })

  it.each([
    'not-json',
    '4.5.0',
    'null',
    '99',
    '["4.5.0"]',
    '{"version":"4.5.0"}',
    '"not-semver"',
    '""',
    '"4.5"',
    '" 4.5.0 "',
  ])('rejects invalid bun info output: %s', async (output) => {
    expect(await fetchLatestBunVersion(async () => output)).toBeNull()
  })

  it.each([
    'ETIMEDOUT',
    'ENOENT',
    'EACCES',
  ])('Bun CLI failure %s is fail-soft with no npm fallback', async (code) => {
    useBun()
    cli.bun.mockRejectedValueOnce(Object.assign(new Error(code), { code }))
    expect(await fetchLatestVersion()).toBeNull()
    expect(cli.bun).toHaveBeenCalledWith(
      process.execPath,
      ['info', 'harnessed@latest', 'version', '--json'],
      { timeout: 8000, windowsHide: true, shell: false },
    )
    expect(cli.npm).not.toHaveBeenCalled()
  })
})
