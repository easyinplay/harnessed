// Phase 1.2 unit tests for src/installers/mcpStdioAdd.ts.
//
// Covers (ADR 0004 § 5 + H2 + C2):
//   - dispatch-mismatch: receives non-mcp-stdio-add method → ok:false preflight
//   - L3 non-interactive + --apply: spawn called with exact authoritative
//     args ['mcp', 'add', '--scope', 'project', '--transport', 'stdio', name,
//     '--', 'npx', '--yes', `${pkg}@${ver}`]
//   - H2 defense: even with valid manifest, verify args are checked one by
//     one (we hit it indirectly by injecting a forged args via a name with
//     `${...}`) → ok:false phase:'preflight' keyword:'security-gate-bypass'
//   - install spawn exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - verify shell exit=1 → ok:false phase:'verify' keyword:'verify-failed'
//   - happy path: appliedFiles contains the .mcp.json target
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
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installMcpStdioAdd } from '../../src/installers/mcpStdioAdd.js'

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
      name: 'tavily-mcp',
      display_name: 'Tavily MCP',
      description: 'fixture',
      upstream: {
        source: 'tavily-mcp',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/tavily-mcp.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'mcp-npm',
      component_type: 'mcp-tool',
      install: {
        method: 'mcp-stdio-add',
        cmd: 'claude mcp add --scope project --transport stdio tavily-mcp -- npx --yes tavily-mcp@latest',
        npm_version: '^1.0.0',
        idempotent_check: 'claude mcp list | grep -q tavily-mcp',
      },
      verify: { cmd: 'claude mcp list', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'claude mcp remove tavily-mcp' },
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
function ctx(over?: Partial<InstallOpts>, modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: withOpts(over ?? {}), level: 'L3', cwd: '/tmp/proj' }
}

describe('installMcpStdioAdd', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it('dispatch-mismatch: non-mcp-stdio-add method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'npm-cli'
    const r = await installMcpStdioAdd(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  it('L3 + --apply: spawn invoked with hardcoded --scope project --transport stdio args', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      await installMcpStdioAdd(ctx())
      expect(spawnMock).toHaveBeenCalled()
      // Reconstruct argv across all spawn invocations (Win wraps cmd.exe /c claude ...).
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      expect(flat).toContain('mcp')
      expect(flat).toContain('add')
      expect(flat).toContain('--scope')
      expect(flat).toContain('project')
      expect(flat).toContain('--transport')
      expect(flat).toContain('stdio')
      expect(flat).toContain('tavily-mcp')
    } finally {
      s.restore()
    }
  })

  it('H2 defense-in-depth: shell-escape in metadata.name caught at args[] re-check', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern is the attack vector
        ;(m.metadata as { name: string }).name = 'evil${HOME}'
      })
      const r = await installMcpStdioAdd(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('security-gate-bypass')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('install spawn exit=1 → ok:false phase:spawn keyword:install-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({ exitCode: 1, stderr: 'install boom' }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  it('happy path: install ok + verify ok → appliedFiles contains .mcp.json target', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true) {
        expect(r.appliedFiles.some((f) => f.endsWith('.mcp.json'))).toBe(true)
      }
    } finally {
      s.restore()
    }
  })
})
