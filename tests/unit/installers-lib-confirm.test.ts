// Phase 1.2 unit tests for src/installers/lib/confirm.ts (Pattern J BASE+modifier).
//
// Covers per-level prompt shapes (ADR 0004 contract 4):
//   L1 → p.note() once + auto-yes (no confirm prompt)
//   L2 → single p.confirm; user yes / no / Ctrl-C cancel paths
//   L3 → two p.confirm calls; second mentions "other plugins"; cancel guarded
//   L4 + ctx.opts.system=false → flag-missing short-circuit + p.note teach
//   L4 + ctx.opts.system=true → single high-stakes p.confirm
//   nonInteractive=true → skip prompts, decide from ctx.opts.apply
//
// Mocks: @clack/prompts entirely — note / confirm / isCancel are intercepted.
// No fs / spawn — confirm.ts is a pure orchestration helper.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const CANCEL_SYMBOL = Symbol('clack-cancel')

vi.mock('@clack/prompts', () => ({
  note: vi.fn(),
  confirm: vi.fn(),
  isCancel: (v: unknown) => v === CANCEL_SYMBOL,
}))

import * as p from '@clack/prompts'
import { confirmAt } from '../../src/installers/lib/confirm.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const noteMock = vi.mocked(p.note)
const confirmMock = vi.mocked(p.confirm)

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: false,
  fullDiff: false,
  updateInstalled: true,
  color: 'auto',
}

function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'cf-test',
      display_name: 'Confirm Test',
      description: 'fixture',
      upstream: {
        source: 'cf-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/cf-test.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g cf-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which cf-test',
      },
      verify: { cmd: 'cf-test --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g cf-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(opts: Partial<InstallOpts> = {}): InstallContext {
  return {
    manifest: baseManifest(),
    opts: { ...BASE_OPTS, ...opts },
    level: 'L2',
    cwd: '/tmp/cf',
  }
}

describe('confirmAt', () => {
  beforeEach(() => {
    noteMock.mockClear()
    confirmMock.mockClear()
  })

  it('L1: prints note + auto-proceeds without prompt', async () => {
    const r = await confirmAt('L1', ctx())
    expect(r.proceed).toBe(true)
    expect(noteMock).toHaveBeenCalledTimes(1)
    expect(confirmMock).not.toHaveBeenCalled()
  })

  it('L2: single confirm — user yes → proceed', async () => {
    confirmMock.mockResolvedValueOnce(true)
    const r = await confirmAt('L2', ctx())
    expect(r.proceed).toBe(true)
    expect(confirmMock).toHaveBeenCalledTimes(1)
  })

  it('L2: user no → not proceed (no reason)', async () => {
    confirmMock.mockResolvedValueOnce(false)
    const r = await confirmAt('L2', ctx())
    expect(r.proceed).toBe(false)
    expect(r.reason).toBeUndefined()
  })

  it('L2: Ctrl-C / ESC → reason=user-cancel (isCancel guard)', async () => {
    confirmMock.mockResolvedValueOnce(CANCEL_SYMBOL as unknown as boolean)
    const r = await confirmAt('L2', ctx())
    expect(r.proceed).toBe(false)
    expect(r.reason).toBe('user-cancel')
  })

  it('L3: two confirms; second mentions "other plugins"', async () => {
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true)
    const r = await confirmAt('L3', ctx())
    expect(r.proceed).toBe(true)
    expect(confirmMock).toHaveBeenCalledTimes(2)
    const secondArg = confirmMock.mock.calls[1]?.[0] as { message: string }
    expect(secondArg.message).toMatch(/other plugins|user-scope/i)
  })

  it('L3: first confirm cancelled → user-cancel without showing second', async () => {
    confirmMock.mockResolvedValueOnce(CANCEL_SYMBOL as unknown as boolean)
    const r = await confirmAt('L3', ctx())
    expect(r.proceed).toBe(false)
    expect(r.reason).toBe('user-cancel')
    expect(confirmMock).toHaveBeenCalledTimes(1)
  })

  it('L3: first yes + second cancel → user-cancel', async () => {
    confirmMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(CANCEL_SYMBOL as unknown as boolean)
    const r = await confirmAt('L3', ctx())
    expect(r.proceed).toBe(false)
    expect(r.reason).toBe('user-cancel')
  })

  it('L4 without --system flag → flag-missing + educational note + no confirm', async () => {
    const r = await confirmAt('L4', ctx({ system: false }))
    expect(r.proceed).toBe(false)
    expect(r.reason).toBe('flag-missing')
    expect(noteMock).toHaveBeenCalledTimes(1)
    expect(confirmMock).not.toHaveBeenCalled()
  })

  it('L4 with --system flag → single confirm gate', async () => {
    confirmMock.mockResolvedValueOnce(true)
    const r = await confirmAt('L4', ctx({ system: true }))
    expect(r.proceed).toBe(true)
    expect(confirmMock).toHaveBeenCalledTimes(1)
  })

  it('nonInteractive + apply=true → proceed without any prompt (L2)', async () => {
    const r = await confirmAt('L2', ctx({ nonInteractive: true, apply: true }))
    expect(r.proceed).toBe(true)
    expect(confirmMock).not.toHaveBeenCalled()
    expect(noteMock).not.toHaveBeenCalled()
  })

  it('nonInteractive + apply=false → not proceed (dry-run)', async () => {
    const r = await confirmAt('L2', ctx({ nonInteractive: true, apply: false }))
    expect(r.proceed).toBe(false)
    expect(confirmMock).not.toHaveBeenCalled()
  })

  it('nonInteractive at L4 without --system still flag-missing (security flag, not UX)', async () => {
    const r = await confirmAt('L4', ctx({ nonInteractive: true, system: false, apply: true }))
    expect(r.proceed).toBe(false)
    expect(r.reason).toBe('flag-missing')
    // educational note suppressed under nonInteractive
    expect(noteMock).not.toHaveBeenCalled()
  })
})
