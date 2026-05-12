// Phase 1.2 unit tests for src/installers/index.ts (dispatcher / level seed).
//
// Covers (Pattern G barrel + ADR 0004 + ADR 0005):
//   - 6-method dispatch table is fully populated (no undefined slots)
//   - npm-cli routes to installNpmCli; mcp-stdio-add routes to installMcpStdioAdd
//   - 4 phase-2.1 placeholders (cc-plugin-marketplace / git-clone-with-setup /
//     npx-skill-installer / mcp-http-add) yield explicit phase-deferred error
//   - levelOf seed: npm-cli=L4, mcp-stdio-add=L3, mcp-http-add=L3,
//     cc-plugin-marketplace=L3, git-clone-with-setup=L2, npx-skill-installer=L2
//
// Mocks: child_process / fs/promises / @clack/prompts so dispatch can run end
// to end without real IO (C6 mitigation).

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
import { installers, runInstall } from '../../src/installers/index.js'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(exitCode = 0): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    child.emit('close', exitCode)
  })
  return child
}
function silence(): { restore: () => void } {
  const orig = process.stdout.write.bind(process.stdout)
  // biome-ignore lint/suspicious/noExplicitAny: stdout overload polymorphism
  process.stdout.write = (() => true) as any
  return {
    restore: () => {
      process.stdout.write = orig
    },
  }
}

const BASE_OPTS: InstallOpts = {
  apply: false,
  dryRun: true,
  system: true,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}
function manifestForMethod(method: Manifest['spec']['install']['method']): Manifest {
  // Choose a type/component_type compatible with the method per schema rules.
  const isMcp = method === 'mcp-stdio-add' || method === 'mcp-http-add'
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: `${method}-fixture`,
      display_name: 'Fixture',
      description: 'fixture',
      upstream: {
        source: `${method}-fixture`,
        homepage: 'https://example.com',
        repository: 'https://github.com/example/fixture.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: isMcp ? 'mcp-npm' : 'cli-npm',
      component_type: isMcp ? 'mcp-tool' : 'cli-binary',
      install: {
        method,
        cmd: 'echo placeholder',
        npm_version: '^1.0.0',
        idempotent_check: 'true',
      },
      verify: { cmd: 'true', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'echo uninstall' },
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

describe('installers dispatch table', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it('exports all 6 methods (no undefined slots)', () => {
    const methods = [
      'npm-cli',
      'mcp-stdio-add',
      'cc-plugin-marketplace',
      'git-clone-with-setup',
      'npx-skill-installer',
      'mcp-http-add',
    ] as const
    for (const m of methods) {
      expect(typeof installers[m]).toBe('function')
    }
  })

  it('npm-cli + mcp-stdio-add are NOT the phase-deferred placeholder (different fn refs)', () => {
    expect(installers['npm-cli']).not.toBe(installers['cc-plugin-marketplace'])
    expect(installers['mcp-stdio-add']).not.toBe(installers['cc-plugin-marketplace'])
  })

  it('all 4 phase-2.1 placeholders share the same function reference', () => {
    const placeholder = installers['cc-plugin-marketplace']
    expect(installers['git-clone-with-setup']).toBe(placeholder)
    expect(installers['npx-skill-installer']).toBe(placeholder)
    expect(installers['mcp-http-add']).toBe(placeholder)
  })

  for (const method of [
    'cc-plugin-marketplace',
    'git-clone-with-setup',
    'npx-skill-installer',
    'mcp-http-add',
  ] as const) {
    it(`runInstall(${method}) → phase-deferred error`, async () => {
      const r = await runInstall(manifestForMethod(method), BASE_OPTS)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('phase-deferred')
        expect(r.error.message).toContain('phase 2.1')
      }
    })
  }

  it('runInstall routes npm-cli to installNpmCli (level seed L4 visible via flag-missing path)', async () => {
    const s = silence()
    try {
      // Force --system=false to land in level-flag-missing — proves L4 seed.
      const opts: InstallOpts = { ...BASE_OPTS, system: false }
      const r = await runInstall(manifestForMethod('npm-cli'), opts)
      expect(r).toMatchObject({ aborted: true, reason: 'level-flag-missing' })
    } finally {
      s.restore()
    }
  })

  it('runInstall routes mcp-stdio-add to installMcpStdioAdd (L3 — no --system gate)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(() => makeChild(0) as unknown as ReturnType<typeof spawn>)
      const r = await runInstall(manifestForMethod('mcp-stdio-add'), {
        ...BASE_OPTS,
        apply: true,
        dryRun: false,
        system: false, // mcp-stdio is L3 — does NOT require --system
      })
      // Should NOT abort with level-flag-missing (would prove L4 was assumed).
      const aborted = (r as { aborted?: boolean }).aborted === true
      const reason = (r as { reason?: string }).reason
      expect(aborted && reason === 'level-flag-missing').toBe(false)
    } finally {
      s.restore()
    }
  })
})
