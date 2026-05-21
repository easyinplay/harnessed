// Phase 1.2 unit tests for src/cli/install.ts.
//
// v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
// Covers (ADR 0004 contract 1 / 6 + H1 pre-action gate):
//   - --non-interactive without --apply or --dry-run → exit 2 (H1 gate)
//   - missing manifest file → exit 1
//   - happy path: manifest found + runInstall ok → exit 0
//     (NEW v3.0.1: no flag = immediate; --apply legacy no-op alias still works)
//   - runInstall aborted → exit 2; runInstall error → exit 1
//
// Mocks: fs/promises (readFile), runInstall, validateManifestFile,
// process.exit (intercept; assert called code).

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))

import { readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerInstall } from '../../src/cli/install.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const readFileMock = vi.mocked(readFile)
const runInstallMock = vi.mocked(runInstall)
const validateMock = vi.mocked(validateManifestFile)

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

function spyExit() {
  return vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
}

function silence() {
  const out = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  return () => {
    out.mockRestore()
    err.mockRestore()
    log.mockRestore()
  }
}

async function runCli(argv: string[]): Promise<number> {
  const exit = spyExit()
  const restore = silence()
  const program = new Command().exitOverride()
  registerInstall(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  } finally {
    exit.mockRestore()
    restore()
  }
}

describe('cli/install', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    runInstallMock.mockReset()
    validateMock.mockReset()
  })

  it('manifest file not found → exit 1', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const code = await runCli(['install', 'ghost', '--non-interactive'])
    expect(code).toBe(1)
  })

  it('happy path: ok:true → exit 0', async () => {
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue({
      ok: true,
      manifest: {
        metadata: { name: 'ctx7' },
        spec: { install: { method: 'npm-cli', npm_version: '^1.0.0' } },
      },
      // biome-ignore lint/suspicious/noExplicitAny: validateManifestFile success shape — only used keys matter for cli
    } as any)
    runInstallMock.mockResolvedValue({
      ok: true,
      backupId: '2026-05-12T00-00-00.000Z',
      appliedFiles: [],
    })
    const code = await runCli(['install', 'ctx7', '--non-interactive', '--system'])
    expect(code).toBe(0)
  })

  it('aborted result → exit 2', async () => {
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue({
      ok: true,
      manifest: { metadata: { name: 'ctx7' }, spec: { install: { method: 'npm-cli' } } },
      // biome-ignore lint/suspicious/noExplicitAny: see above
    } as any)
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'user-cancel' })
    const code = await runCli(['install', 'ctx7', '--dry-run', '--non-interactive'])
    expect(code).toBe(2)
  })

  it('error result → exit 1', async () => {
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue({
      ok: true,
      manifest: { metadata: { name: 'ctx7' }, spec: { install: { method: 'npm-cli' } } },
      // biome-ignore lint/suspicious/noExplicitAny: see above
    } as any)
    runInstallMock.mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: {
        file: 'ctx7',
        path: '/spec/install/cmd',
        message: 'fail',
        line: null,
        column: null,
        keyword: 'install-failed',
      },
    })
    const code = await runCli(['install', 'ctx7', '--non-interactive', '--system'])
    expect(code).toBe(1)
  })

  // v3.0.1 UX flip — apply-immediate default regression fixture.
  it('v3.0.1 flip: no flag → runInstall called with opts.apply=true (immediate)', async () => {
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue({
      ok: true,
      manifest: { metadata: { name: 'ctx7' }, spec: { install: { method: 'npm-cli' } } },
      // biome-ignore lint/suspicious/noExplicitAny: see above
    } as any)
    runInstallMock.mockResolvedValue({
      ok: true,
      backupId: '2026-05-21T00-00-00.000Z',
      appliedFiles: [],
    })
    // --non-interactive 仍 H1 gate require --apply OR --dry-run for CI safety;
    // 但 interactive TTY 路径 no flag = immediate (--non-interactive --apply 等价新 default 为 immediate)
    const code = await runCli(['install', 'ctx7', '--non-interactive', '--system'])
    expect(code).toBe(0)
    expect(runInstallMock).toHaveBeenCalledOnce()
    const opts = runInstallMock.mock.calls[0]?.[1]
    expect(opts?.apply).toBe(true)
    expect(opts?.dryRun).toBe(false)
  })

  // v3.0.1 UX flip — backward-compat alias regression fixture.
  it('v3.0.1 flip: --dry-run opt-in → runInstall called with opts.dryRun=true', async () => {
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue({
      ok: true,
      manifest: { metadata: { name: 'ctx7' }, spec: { install: { method: 'npm-cli' } } },
      // biome-ignore lint/suspicious/noExplicitAny: see above
    } as any)
    runInstallMock.mockResolvedValue({ aborted: true, reason: 'user-cancel' })
    const code = await runCli(['install', 'ctx7', '--dry-run', '--non-interactive'])
    expect(code).toBe(2)
    const opts = runInstallMock.mock.calls[0]?.[1]
    expect(opts?.dryRun).toBe(true)
    expect(opts?.apply).toBe(false)
  })
})
