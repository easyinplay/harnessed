// Phase 2.1 unit tests for src/installers/mcpHttpAdd.ts.
//
// Covers (ADR 0004 § 5 + D-12 + D-16 + H2 + C2):
//   - dispatch-mismatch: receives non-mcp-http-add method → ok:false preflight
//   - L3 + --apply: spawn called with authoritative args
//     ['mcp','add','--scope','project','--transport','http', name, url]
//     (URL extracted from install.cmd; --scope project hardcoded D-12)
//   - D-16 env-resolution: --header "X-Key: ${TEST_KEY}" + env set → resolved
//     value flows into addArgs; env unset → ok:false / keyword:'env-unset'
//   - cmd missing http(s):// URL → ok:false / keyword:'http-url-missing'
//   - install spawn exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - verify shell exit=1 → ok:false phase:'verify' keyword:'verify-failed'
//   - happy path: appliedFiles contains .mcp.json target
//
// Mocks: child_process / fs/promises / @clack/prompts (C6 mitigation).

import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
import { installMcpHttpAdd } from '../../src/installers/mcpHttpAdd.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(opts: { exitCode?: number; stderr?: string; stdout?: string }): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    if (opts.stdout) stdout.emit('data', opts.stdout)
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
      name: 'exa-mcp-http',
      display_name: 'Exa MCP (HTTP)',
      description: 'fixture',
      upstream: {
        source: 'exa-mcp-server',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/exa-mcp.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'mcp-npm',
      component_type: 'mcp-tool',
      install: {
        method: 'mcp-http-add',
        cmd: 'claude mcp add --scope project --transport http exa-mcp-http https://exa.example.com/mcp',
        npm_version: '^1.0.0',
        idempotent_check: 'claude mcp list | grep -q exa-mcp-http',
      },
      verify: { cmd: 'claude mcp list', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'claude mcp remove exa-mcp-http' },
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

describe('installMcpHttpAdd', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })
  afterEach(() => {
    delete process.env.HTTP_TEST_KEY
  })

  it('dispatch-mismatch: non-mcp-http-add method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'mcp-stdio-add'
    const r = await installMcpHttpAdd(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  // v3.0.2 hotfix: assert --scope user (was --scope project pre-v3.0.2).
  it('L3 + --apply: spawn invoked with --scope user --transport http + URL (v3.0.2)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({ exitCode: 0, stdout: 'exa-mcp-http\n' }) as unknown as ReturnType<
            typeof spawn
          >,
      )
      await installMcpHttpAdd(ctx())
      expect(spawnMock).toHaveBeenCalled()
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      expect(flat).toContain('mcp')
      expect(flat).toContain('add')
      expect(flat).toContain('--scope')
      expect(flat).toContain('user') // v3.0.2 — was 'project'
      expect(flat).not.toContain('--scope project')
      expect(flat).toContain('--transport')
      expect(flat).toContain('http')
      expect(flat).toContain('exa-mcp-http')
      expect(flat).toContain('https://exa.example.com/mcp')
    } finally {
      s.restore()
    }
  })

  // Literal `${VAR}` is the env-resolution input pattern; constructed by
  // concatenation to avoid biome's noTemplateCurlyInString false-positive on
  // a non-template plain string (we are NOT using template-string semantics —
  // the dollar-brace pattern is data that the installer parses).
  const DOLLAR_BRACE_OPEN = '${'
  const HEADER_WITH_SET_VAR = `--header "X-API-Key: ${DOLLAR_BRACE_OPEN}HTTP_TEST_KEY}"`
  const HEADER_WITH_UNSET_VAR = `--header "X-API-Key: ${DOLLAR_BRACE_OPEN}UNSET_KEY_FIXTURE}"`

  it('D-16 env-resolution: --header with VAR set → resolved value in args', async () => {
    process.env.HTTP_TEST_KEY = 'sk-test-123'
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd =
          `claude mcp add --scope project --transport http ${HEADER_WITH_SET_VAR} exa-mcp-http https://exa.example.com/mcp`
      })
      await installMcpHttpAdd(c)
      expect(spawnMock).toHaveBeenCalled()
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      expect(flat).toContain('--header')
      expect(flat).toContain('X-API-Key: sk-test-123')
      // The dollar-brace input pattern must NOT survive into the spawned args.
      expect(flat).not.toContain(`${DOLLAR_BRACE_OPEN}HTTP_TEST_KEY}`)
    } finally {
      s.restore()
    }
  })

  it('D-16 env-resolution: --header references unset env var → ok:false keyword:env-unset', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd =
          `claude mcp add --scope project --transport http ${HEADER_WITH_UNSET_VAR} exa-mcp-http https://exa.example.com/mcp`
      })
      const r = await installMcpHttpAdd(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('env-unset')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('cmd missing http(s):// URL → ok:false keyword:http-url-missing', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd =
          'claude mcp add --scope project --transport http exa-mcp-http'
      })
      const r = await installMcpHttpAdd(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('http-url-missing')
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
          makeChild({ exitCode: 1, stderr: 'http boom' }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpHttpAdd(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  // v1.0.4 T1.5 + v3.0.2 — ADR 0004 idempotent contract: "already exists"
  // stderr (substring) with exit=1 → ok:true + alreadyInstalled:true.
  it('install exit=1 + "already exists" stderr → ok:true alreadyInstalled:true', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({
            exitCode: 1,
            stderr: 'MCP server exa-mcp already exists',
          }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpHttpAdd(ctx())
      expect(r).toMatchObject({ ok: true, alreadyInstalled: true })
      expect('appliedFiles' in r).toBe(false)
    } finally {
      s.restore()
    }
  })

  // v3.0.2: appliedFiles now ~/.claude.json (user-global) — flipped from .mcp.json.
  it('happy path: install ok + verify ok → appliedFiles contains .claude.json (v3.0.2)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({ exitCode: 0, stdout: 'exa-mcp-http\n' }) as unknown as ReturnType<
            typeof spawn
          >,
      )
      const r = await installMcpHttpAdd(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true && !('alreadyInstalled' in r)) {
        expect(r.appliedFiles.some((f) => f.endsWith('.claude.json'))).toBe(true)
      }
    } finally {
      s.restore()
    }
  })

  // v3.0.2 regression: verify must not invoke shell `grep` (Bug 2 fix).
  it('v3.0.2 — verify uses claude mcp list directly (no grep)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({ exitCode: 0, stdout: 'exa-mcp-http\n' }) as unknown as ReturnType<
            typeof spawn
          >,
      )
      await installMcpHttpAdd(ctx())
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      expect(flat).not.toContain('grep')
      expect(flat).toContain('mcp list')
    } finally {
      s.restore()
    }
  })
})
