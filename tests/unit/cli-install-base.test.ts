// Phase 1.3 unit tests for src/cli/install-base.ts (B5 acceptance bar / D-9 + D-11).
//
// Covers (≥ 5 cell per task_plan T4.3):
//   1. H1 gate: --non-interactive without --apply / --dry-run → exit 2
//   2. Happy path: 10 manifest + dispatcher returns ok → exit 0 + installed > 0
//   3. phase 2.1 placeholder method → counted in skipped[] (D-11 三态)
//   4. dispatcher returns ok:false → counted in failed[] + exit 1
//   5. All manifests phase-2.1 placeholder → installed === 0 + failed === 0 → exit 2
//
// Mocks: fs/promises (readdir + readFile), runInstall, validateManifestFile,
// process.exit (intercept; assert called code).

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}))
vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))

import { readdir, readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerInstallBase } from '../../src/cli/install-base.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const readdirMock = vi.mocked(readdir)
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
  registerInstallBase(program)
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

// Helper: mock 1 manifest at path with given install method, validate ok.
function mockManifest(name: string, method: string) {
  validateMock.mockReturnValueOnce({
    ok: true,
    manifest: {
      metadata: { name },
      spec: { install: { method } },
    },
    // biome-ignore lint/suspicious/noExplicitAny: cli only reads metadata.name + spec.install.method
  } as any)
}

describe('cli/install-base', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    readFileMock.mockReset()
    runInstallMock.mockReset()
    validateMock.mockReset()
  })

  it('cell 2 — happy path: 2 manifest dispatcher ok → exit 0 + installed > 0', async () => {
    // tools/ has 1, skill-packs/ has 1; both with installable method.
    readdirMock.mockResolvedValueOnce(['ctx7.yaml'] as never)
    readdirMock.mockResolvedValueOnce(['gsd.yaml'] as never)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    mockManifest('ctx7', 'npm-cli')
    mockManifest('gsd', 'npm-cli')
    runInstallMock.mockResolvedValue({
      ok: true,
      backupId: '2026-05-13T00-00-00.000Z',
      appliedFiles: [],
    })
    const code = await runCli(['install-base', '--dry-run', '--non-interactive'])
    expect(code).toBe(0)
    expect(runInstallMock).toHaveBeenCalledTimes(2)
  })

  it('cell 3 — v3.9.5: previously-deferred methods now dispatch through runInstall', async () => {
    // v3.9.5 — PHASE_21 deferred set removed. cc-plugin-marketplace (and the
    // other 3 previously-deferred methods) now dispatch through runInstall
    // like any other method. Sister cell 5 + setup-helpers.ts equivalent.
    readdirMock.mockResolvedValueOnce(['superpowers.yaml'] as never)
    readdirMock.mockResolvedValueOnce([] as never)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    mockManifest('superpowers', 'cc-plugin-marketplace')
    runInstallMock.mockResolvedValue({ ok: true })
    const code = await runCli(['install-base', '--dry-run', '--non-interactive'])
    // 1 installed → exit 0 (was exit 2 when PHASE_21 short-circuited).
    expect(code).toBe(0)
    expect(runInstallMock).toHaveBeenCalledTimes(1)
  })

  it('cell 4 — dispatcher returns ok:false → failed → exit 1', async () => {
    readdirMock.mockResolvedValueOnce(['ctx7.yaml'] as never)
    readdirMock.mockResolvedValueOnce([] as never)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    mockManifest('ctx7', 'npm-cli')
    runInstallMock.mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: {
        file: 'ctx7',
        path: '/spec/install/cmd',
        message: 'spawn fail',
        line: null,
        column: null,
        keyword: 'install-failed',
      },
    })
    const code = await runCli(['install-base', '--non-interactive'])
    expect(code).toBe(1)
  })

  it('cell 5 — v3.9.5: all 6 methods now dispatch through runInstall (PHASE_21 set removed)', async () => {
    // v3.9.5 — installer dispatchers are runtime-ready (src/installers/index.ts
    // L1-2 "All 6 methods are now runtime-ready"). Previously these 3 manifests
    // would short-circuit as "skipped (deferred phase 2.1)". Now they go
    // through runInstall like any other method.
    readdirMock.mockResolvedValueOnce(['superpowers.yaml', 'ralph-loop.yaml'] as never)
    readdirMock.mockResolvedValueOnce(['gstack.yaml'] as never)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    mockManifest('superpowers', 'cc-plugin-marketplace')
    mockManifest('ralph-loop', 'cc-plugin-marketplace')
    mockManifest('gstack', 'git-clone-with-setup')
    runInstallMock.mockResolvedValue({ ok: true })
    const code = await runCli(['install-base', '--dry-run', '--non-interactive'])
    // All 3 install — exit 0 (was exit 2 when PHASE_21 short-circuited).
    expect(code).toBe(0)
    expect(runInstallMock).toHaveBeenCalledTimes(3)
  })
})
