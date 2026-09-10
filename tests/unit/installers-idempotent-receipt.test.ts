// Phase 59 — wiring regression: the idempotent early return must record a receipt.
//
// Every installer probes `isAlreadyInstalled(ctx)` and returns early on a hit.
// That return sat BEFORE the `updateInstalled` call at the end of the success
// path in all six installers, so the receipt was only ever written on the path
// that performed a write. A component installed by hand — e.g. the
// upstream-documented `claude plugin install` — or one whose entry was lost could
// never be recorded, and no number of `harnessed install` runs would repair it.
// `harnessed status`, the one consumer of state.json, then reported
// "no installs recorded" on a machine full of installed components (dogfooded).
//
// The unit tests in installers-lib-state.test.ts cover recordObservedInstall's
// own behaviour. This file covers the thing that actually broke: whether the
// early-return path reaches it at all. Mocking `idempotent.js` is what makes the
// hit deterministic — the real probe does native fs/registry detection.
//
// Sister defect: Trellis #575 (`fix(update): repair receipt entries for files
// already identical to a template`).

import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => true),
}))
vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => {
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  }),
  writeFile: vi.fn(async () => undefined),
  rename: vi.fn(async () => undefined),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))

import { writeFile } from 'node:fs/promises'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpmCli } from '../../src/installers/npmCli.js'

const writeFileMock = vi.mocked(writeFile)

function manifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'ctx7',
      display_name: 'Context7',
      description: 'fixture',
      upstream: {
        source: 'ctx7',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/ctx7.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g ctx7',
        npm_version: '^0.5.0',
        idempotent_check: 'which ctx7',
      },
      verify: { cmd: 'ctx7 --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g ctx7' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-09-10',
        last_known_good_version: '0.5.11',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(): InstallContext {
  const opts = { yes: true, system: true, dryRun: false, quiet: true } as unknown as InstallOpts
  return { manifest: manifest(), opts, level: 'L4', cwd: '/tmp/proj' }
}

/** The single state.json payload written during the call, parsed. */
function writtenState(): { installed: Record<string, { version: string }> } | null {
  for (const call of writeFileMock.mock.calls) {
    const body = call[1]
    if (typeof body !== 'string' || !body.includes('"installed"')) continue
    return JSON.parse(body) as { installed: Record<string, { version: string }> }
  }
  return null
}

describe('installer idempotent path — records a receipt (Phase 59)', () => {
  it('an already-installed component is written to state.json, not silently skipped', async () => {
    writeFileMock.mockClear()
    const r = await installNpmCli(ctx())

    // Still the idempotent no-op it always was …
    expect(r).toMatchObject({ ok: true, alreadyInstalled: true })

    // … but the receipt now exists, so `harnessed status` can see it.
    const state = writtenState()
    expect(state, 'no state.json payload was written on the idempotent path').not.toBeNull()
    expect(state?.installed.ctx7?.version).toBe('^0.5.0')
  })
})
