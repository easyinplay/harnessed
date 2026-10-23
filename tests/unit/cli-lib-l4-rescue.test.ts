// v4.13.0 — unit tests for src/cli/lib/l4-rescue.ts (patch 4.13.0 setup UX;
// findings.md 根因 4: ctx7 L4 permanently skipped by nonInteractive Step B).
//
// Covers:
//   - no level-flag-missing skips → no prompt, empty result
//   - consent → runInstall re-run with system:true + nonInteractive:true
//   - decline → skipped, runInstall NOT called
//   - install failure → failed bucket with reason

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async () => 'yaml-content'),
}))
vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))
vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))
const confirmMock = vi.fn(async (_o?: unknown) => true)
vi.mock('@clack/prompts', () => ({
  confirm: (o: unknown) => confirmMock(o as never),
  isCancel: () => false,
}))

import { runL4Rescue } from '../../src/cli/lib/l4-rescue.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const runInstallMock = vi.mocked(runInstall)
const validateMock = vi.mocked(validateManifestFile)

const CTX7_MANIFEST = {
  metadata: { name: 'ctx7' },
  spec: {
    component_type: 'cli-binary',
    install: { method: 'npm-cli', cmd: 'npm install -g ctx7' },
  },
}

function silenceConsole(): void {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('runL4Rescue', () => {
  afterEach(() => vi.unstubAllEnvs())
  beforeEach(() => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.restoreAllMocks()
    runInstallMock.mockReset()
    validateMock.mockReset()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue(true)
    validateMock.mockReturnValue({ ok: true, errors: [], manifest: CTX7_MANIFEST } as never)
    silenceConsole()
  })

  it('pins override display, permission and native context across an async consent drift', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', '/selected-native')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/selected-state')
    const logs: string[] = []
    vi.mocked(console.log).mockImplementation((...args) => {
      logs.push(args.join(' '))
    })
    const manifest = {
      ...CTX7_MANIFEST,
      spec: {
        ...CTX7_MANIFEST.spec,
        harness_overrides: {
          codex: { install: { method: 'npm-cli', cmd: 'npm install -g codex-fixture' } },
        },
      },
    }
    validateMock.mockReturnValue({ ok: true, manifest } as never)
    confirmMock.mockImplementation(async () => {
      vi.stubEnv('HARNESSED_PLATFORM', 'claude')
      vi.stubEnv('CODEX_HOME', '/drift-native')
      vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/drift-state')
      return true
    })
    runInstallMock.mockResolvedValue({ ok: true, backupId: '', appliedFiles: [] })
    const result = await runL4Rescue(
      ['ctx7.yaml'],
      [{ name: 'ctx7', reason: 'level-flag-missing' }],
    )
    expect(result.installed).toEqual(['ctx7'])
    expect(logs.join('\n')).toContain('$ npm install -g codex-fixture')
    expect(logs.join('\n')).not.toContain('$ npm install -g ctx7')
    expect(runInstallMock.mock.calls[0]?.[0].spec.install.cmd).toBe('npm install -g codex-fixture')
    expect(runInstallMock.mock.calls[0]?.[1]).toMatchObject({
      system: true,
      nonInteractive: true,
      dryRun: false,
    })
    expect(runInstallMock.mock.calls[0]?.[2]).toMatchObject({
      hostId: 'codex',
      nativeHome: '/selected-native',
      platform: { stateRoot: '/selected-state' },
    })
    expect(manifest.spec.install.cmd).toBe('npm install -g ctx7')
  })

  it('rejects an unsupported Codex install before asking for L4 consent', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    validateMock.mockReturnValue({
      ok: true,
      manifest: {
        ...CTX7_MANIFEST,
        spec: {
          install: { method: 'cc-plugin-marketplace', cmd: 'claude plugin install fixture' },
        },
      },
    } as never)
    const result = await runL4Rescue(
      ['ctx7.yaml'],
      [{ name: 'ctx7', reason: 'level-flag-missing' }],
    )
    expect(result).toEqual({ installed: [], skipped: ['ctx7'], failed: [] })
    expect(confirmMock).not.toHaveBeenCalled()
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  it('no level-flag-missing skips → no prompt, no install', async () => {
    const r = await runL4Rescue(['ctx7.yaml'], [{ name: 'x', reason: 'user-cancel' }])
    expect(r).toEqual({ installed: [], skipped: [], failed: [] })
    expect(confirmMock).not.toHaveBeenCalled()
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  it('consent → runInstall with system:true + nonInteractive:true (no double prompt)', async () => {
    runInstallMock.mockResolvedValue({ ok: true, backupId: 'bk', appliedFiles: [] } as never)
    const r = await runL4Rescue(['ctx7.yaml'], [{ name: 'ctx7', reason: 'level-flag-missing' }])
    expect(r.installed).toEqual(['ctx7'])
    expect(runInstallMock).toHaveBeenCalledOnce()
    const opts = runInstallMock.mock.calls[0]?.[1] as { system: boolean; nonInteractive: boolean }
    expect(opts.system).toBe(true)
    expect(opts.nonInteractive).toBe(true)
  })

  it('decline → skipped, runInstall NOT called', async () => {
    confirmMock.mockResolvedValue(false)
    const r = await runL4Rescue(['ctx7.yaml'], [{ name: 'ctx7', reason: 'level-flag-missing' }])
    expect(r.skipped).toEqual(['ctx7'])
    expect(runInstallMock).not.toHaveBeenCalled()
  })

  it('install failure → failed bucket with reason', async () => {
    runInstallMock.mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: { message: 'npm exploded' },
    } as never)
    const r = await runL4Rescue(['ctx7.yaml'], [{ name: 'ctx7', reason: 'level-flag-missing' }])
    expect(r.failed).toEqual([{ name: 'ctx7', reason: 'npm exploded' }])
  })
})
