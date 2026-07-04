// v4.18.0 — unit tests for src/cli/lib/optional-offer.ts (setup optional-tier
// offer; user directive: setup 能装 codegraph。manifests/optional/ stays out of
// Step B by design (Phase 18 D2 opt-in) — this block surfaces it interactively).
//
// Covers:
//   - already-installed → no prompt, alreadyInstalled bucket
//   - consent on npm-cli (codegraph) → runInstall with system:true (L4 opt-in
//     IS this confirm) + nonInteractive:true; post-install `codegraph init` hint
//   - consent on non-npm method (ecc cc-plugin) → system:false
//   - decline → skipped, runInstall NOT called
//   - non-interactive → advisory line only, no prompt, no install
//   - empty/missing optional dir → empty result

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async () => 'yaml-content'),
  readdir: vi.fn(async () => ['codegraph.yaml']),
}))
vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))
vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => false),
}))
const confirmMock = vi.fn(async (_o?: unknown) => true)
vi.mock('@clack/prompts', () => ({
  confirm: (o: unknown) => confirmMock(o as never),
  isCancel: () => false,
}))

import { readdir } from 'node:fs/promises'
import { runOptionalOffer } from '../../src/cli/lib/optional-offer.js'
import { runInstall } from '../../src/installers/index.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const runInstallMock = vi.mocked(runInstall)
const validateMock = vi.mocked(validateManifestFile)
const installedMock = vi.mocked(isAlreadyInstalled)
const readdirMock = vi.mocked(readdir)

const CODEGRAPH_MANIFEST = {
  metadata: {
    name: 'codegraph',
    display_name: 'CodeGraph',
    description: 'semantic index',
  },
  spec: {
    component_type: 'cli-binary',
    install: {
      method: 'npm-cli',
      cmd: 'npm i -g @colbymchenry/codegraph && codegraph install --yes',
    },
  },
}

const ECC_MANIFEST = {
  metadata: { name: 'ecc', display_name: 'ECC', description: 'assimilation' },
  spec: {
    component_type: 'command',
    install: { method: 'cc-plugin-marketplace', cmd: 'claude plugin install ecc@ecc' },
  },
}

let logLines: string[]

function silenceConsole(): void {
  logLines = []
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    logLines.push(a.join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    logLines.push(a.join(' '))
  })
}

describe('runOptionalOffer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    runInstallMock.mockReset()
    validateMock.mockReset()
    confirmMock.mockReset()
    installedMock.mockReset()
    readdirMock.mockReset()
    readdirMock.mockResolvedValue(['codegraph.yaml'] as never)
    installedMock.mockResolvedValue(false)
    confirmMock.mockResolvedValue(true)
    validateMock.mockReturnValue({ ok: true, errors: [], manifest: CODEGRAPH_MANIFEST } as never)
    silenceConsole()
  })

  it('already-installed → no prompt, alreadyInstalled bucket', async () => {
    installedMock.mockResolvedValue(true)
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r.alreadyInstalled).toEqual(['codegraph'])
    expect(confirmMock).not.toHaveBeenCalled()
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  it('consent on npm-cli → runInstall with system:true + nonInteractive:true, init hint printed', async () => {
    runInstallMock.mockResolvedValue({ ok: true, backupId: 'bk', appliedFiles: [] } as never)
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r.installed).toEqual(['codegraph'])
    expect(runInstallMock).toHaveBeenCalledOnce()
    const opts = runInstallMock.mock.calls[0]?.[1] as {
      system: boolean
      nonInteractive: boolean
      apply: boolean
    }
    expect(opts.system).toBe(true)
    expect(opts.nonInteractive).toBe(true)
    expect(opts.apply).toBe(true)
    expect(logLines.join('\n')).toContain('codegraph init')
  })

  it('consent on non-npm method (cc-plugin) → system:false', async () => {
    readdirMock.mockResolvedValue(['ecc.yaml'] as never)
    validateMock.mockReturnValue({ ok: true, errors: [], manifest: ECC_MANIFEST } as never)
    runInstallMock.mockResolvedValue({ ok: true, backupId: 'bk', appliedFiles: [] } as never)
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r.installed).toEqual(['ecc'])
    const opts = runInstallMock.mock.calls[0]?.[1] as { system: boolean }
    expect(opts.system).toBe(false)
    expect(logLines.join('\n')).not.toContain('codegraph init')
  })

  it('decline → skipped, runInstall NOT called', async () => {
    confirmMock.mockResolvedValue(false)
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r.skipped).toEqual(['codegraph'])
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  it('non-interactive → advisory line only, no prompt, no install', async () => {
    const r = await runOptionalOffer('/opt', { interactive: false })
    expect(r.skipped).toEqual(['codegraph'])
    expect(confirmMock).not.toHaveBeenCalled()
    expect(runInstallMock).not.toHaveBeenCalled()
    expect(logLines.join('\n')).toContain('harnessed install')
  })

  it('non-interactive with everything installed → silent, no advisory', async () => {
    installedMock.mockResolvedValue(true)
    const r = await runOptionalOffer('/opt', { interactive: false })
    expect(r.alreadyInstalled).toEqual(['codegraph'])
    expect(logLines.join('\n')).not.toContain('harnessed install')
  })

  it('install failure → failed bucket with reason', async () => {
    runInstallMock.mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: { message: 'npm exploded' },
    } as never)
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r.failed).toEqual([{ name: 'codegraph', reason: 'npm exploded' }])
  })

  it('missing optional dir → empty result, silent', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const r = await runOptionalOffer('/opt', { interactive: true })
    expect(r).toEqual({ installed: [], alreadyInstalled: [], skipped: [], failed: [] })
  })
})
