// v4.13.0 — unit tests for src/cli/lib/l4-rescue.ts (patch 4.13.0 setup UX;
// findings.md 根因 4: ctx7 L4 permanently skipped by nonInteractive Step B).
//
// Covers:
//   - no level-flag-missing skips → no prompt, empty result
//   - consent → runInstall re-run with system:true + nonInteractive:true
//   - decline → skipped, runInstall NOT called
//   - install failure → failed bucket with reason

import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  beforeEach(() => {
    vi.restoreAllMocks()
    runInstallMock.mockReset()
    validateMock.mockReset()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue(true)
    validateMock.mockReturnValue({ ok: true, errors: [], manifest: CTX7_MANIFEST } as never)
    silenceConsole()
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
