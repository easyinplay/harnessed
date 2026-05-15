// Phase 2.1 unit tests for src/installers/ccPluginMarketplace.ts.
//
// Covers (ADR 0004 § 4-5 + D-11 + D-12 + D-20):
//   - dispatch-mismatch: non-cc-plugin-marketplace method → ok:false preflight
//   - cmd missing `plugin install <plugin>@<marketplace>` → keyword:'cc-plugin-shape'
//   - L3 + --apply: two-step spawn (marketplace add THEN plugin install),
//     plugin install args include `--scope project` (D-12)
//   - D-20 idempotency: step-1 (marketplace add) exits non-zero BUT step-2
//     (plugin install) exits 0 → overall ok:true (already-registered is benign)
//   - step-2 (plugin install) exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - happy path: both steps + verify all 0 → ok:true / appliedFiles
//
// Mocks: child_process / fs/promises / @clack/prompts (C6 mitigation).

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { spawn } from 'node:child_process'
import { installCcPluginMarketplace } from '../../src/installers/ccPluginMarketplace.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(opts: { exitCode?: number; stderr?: string }): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    if (opts.stderr) stderr.emit('data', opts.stderr)
    child.emit('close', opts.exitCode ?? 0)
  })
  return child
}
function scriptedSpawn(script: Array<{ exitCode?: number; stderr?: string }>) {
  let i = 0
  return () => {
    const step = script[Math.min(i, script.length - 1)] ?? { exitCode: 0 }
    i += 1
    return makeChild(step) as unknown as ReturnType<typeof spawn>
  }
}
function silence(): { restore: () => void } {
  const orig = process.stdout.write.bind(process.stdout)
  // biome-ignore lint/suspicious/noExplicitAny: stdout.write overload polymorphism
  process.stdout.write = (() => true) as any
  return {
    restore: () => {
      process.stdout.write = orig
    },
  }
}

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}
function withOpts(over: Partial<InstallOpts>): InstallOpts {
  return { ...BASE_OPTS, ...over }
}
function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'superpowers',
      display_name: 'superpowers',
      description: 'fixture',
      upstream: {
        source: 'obra/superpowers-marketplace',
        homepage: 'https://example.com',
        repository: 'https://github.com/obra/superpowers-marketplace.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-plugin',
      component_type: 'cli-binary',
      install: {
        method: 'cc-plugin-marketplace',
        cmd: '/plugin marketplace add obra/superpowers-marketplace && /plugin install superpowers@superpowers-marketplace',
        git_ref: 'abc1234',
        idempotent_check: '/plugin list | grep -q superpowers',
      },
      verify: {
        cmd: '/plugin list | grep -q superpowers',
        timeout_ms: 5000,
        expected_exit_code: 0,
      },
      uninstall: { cmd: '/plugin uninstall superpowers@superpowers-marketplace' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: 'v5.1.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}
function ctx(over?: Partial<InstallOpts>, modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: withOpts(over ?? {}), level: 'L3', cwd: '/tmp/proj' }
}

describe('installCcPluginMarketplace', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it('dispatch-mismatch: non-cc-plugin-marketplace method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'npm-cli'
    const r = await installCcPluginMarketplace(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  it('cmd without `plugin install <p>@<m>` → keyword:cc-plugin-shape', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = '/plugin marketplace add foo/bar'
      })
      const r = await installCcPluginMarketplace(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('cc-plugin-shape')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('L3 + --apply: two spawns issued (marketplace add THEN plugin install), --scope project hardcoded', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }, { exitCode: 0 }]),
      )
      await installCcPluginMarketplace(ctx())
      expect(spawnMock).toHaveBeenCalled()
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      expect(flat).toContain('plugin')
      expect(flat).toContain('marketplace')
      expect(flat).toContain('add')
      expect(flat).toContain('obra/superpowers-marketplace')
      expect(flat).toContain('install')
      expect(flat).toContain('superpowers@superpowers-marketplace')
      expect(flat).toContain('--scope')
      expect(flat).toContain('project')
    } finally {
      s.restore()
    }
  })

  it('D-20 idempotency: marketplace add exits non-zero but plugin install ok → overall ok:true', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 1, stderr: 'marketplace already registered' }, // step 1 fail
          { exitCode: 0 }, // step 2 ok
          { exitCode: 0 }, // verify
        ]),
      )
      const r = await installCcPluginMarketplace(ctx())
      expect(r).toMatchObject({ ok: true })
    } finally {
      s.restore()
    }
  })

  it('plugin install (step 2) exit=1 → ok:false phase:spawn keyword:install-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 0 }, // step 1 ok
          { exitCode: 1, stderr: 'plugin not found' }, // step 2 fail
        ]),
      )
      const r = await installCcPluginMarketplace(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  it('happy path: both steps + verify all exit 0 → ok:true with appliedFiles', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }, { exitCode: 0 }]),
      )
      const r = await installCcPluginMarketplace(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true) {
        expect(r.appliedFiles.some((f) => f.endsWith('settings.json'))).toBe(true)
      }
    } finally {
      s.restore()
    }
  })
})
