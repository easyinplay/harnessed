// Phase 1.2 unit tests for src/installers/mcpStdioAdd.ts.
//
// Covers (ADR 0004 § 5 + H2 + C2):
//   - dispatch-mismatch: receives non-mcp-stdio-add method → ok:false preflight
//   - L3 non-interactive + --apply: spawn called with exact authoritative
//     args ['mcp', 'add', '--scope', 'user', '--transport', 'stdio', name,
//     '--', 'npx', '--yes', `${pkg}@${ver}`]
//   - H2 defense: even with valid manifest, verify args are checked one by
//     one (we hit it indirectly by injecting a forged args via a name with
//     `${...}`) → ok:false phase:'preflight' keyword:'security-gate-bypass'
//   - install spawn exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - v3.0.3 verify: fs-based via readUserClaudeJson — happy path mocks the
//     readFile to return a valid mcpServers map; verify-failed path returns
//     ENOENT or missing server.
//   - happy path: appliedFiles contains the .claude.json target
//
// Mocks: child_process / fs/promises / @clack/prompts (C6 mitigation).

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
// v3.0.3 — verify reads ~/.claude.json via fs; mock returns a valid mcpServers
// map containing the test fixture name by default. Tests that want the verify
// to fail (server not registered) override via readFileMock.mockRejectedValueOnce
// (ENOENT) or .mockResolvedValueOnce(JSON.stringify({mcpServers:{}})) before the
// installer is invoked.
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => JSON.stringify({ mcpServers: { 'tavily-mcp': { type: 'stdio' } } })),
  writeFile: vi.fn(async () => undefined),
  rename: vi.fn(async () => undefined),
}))
// v3.9.8 — mock isAlreadyInstalled probe so tests exercise install path
// (probe would otherwise short-circuit via mocked spawn returning exit 0).
vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => false),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installMcpStdioAdd } from '../../src/installers/mcpStdioAdd.js'

const spawnMock = vi.mocked(spawn)
const readFileMock = vi.mocked(readFile)

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
  updateInstalled: true,
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
    // Restore default readFile mock: returns valid mcpServers map with the
    // fixture name registered (v3.0.3 verify happy-path).
    readFileMock.mockReset()
    readFileMock.mockResolvedValue(
      JSON.stringify({ mcpServers: { 'tavily-mcp': { type: 'stdio' } } }),
    )
  })

  it('dispatch-mismatch: non-mcp-stdio-add method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'npm-cli'
    const r = await installMcpStdioAdd(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  // v3.0.2 hotfix: assert --scope user (was --scope project pre-v3.0.2 EPERM
  // in read-only CWD). MCP server should be available cross-project per
  // user-global ~/.claude.json registration.
  it('L3 + --apply: spawn invoked with hardcoded --scope user --transport stdio args (v3.0.2)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({ exitCode: 0, stdout: 'tavily-mcp\n' }) as unknown as ReturnType<typeof spawn>,
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
      expect(flat).toContain('user') // v3.0.2 — was 'project' pre-v3.0.2
      expect(flat).not.toContain('--scope project') // explicit negative: ensure flip is real
      expect(flat).toContain('--transport')
      expect(flat).toContain('stdio')
      expect(flat).toContain('tavily-mcp')
    } finally {
      s.restore()
    }
  })

  // v3.0.3 hotfix regression fixture: verify must NOT spawn `claude mcp list`
  // (or any other claude subcommand for the verify step) — verify reads
  // `~/.claude.json` directly via fs to avoid the cold-start spawn timeout
  // user reported on Windows after 3 sequential `claude mcp add` calls.
  it('v3.0.3 — verify reads ~/.claude.json directly (no claude mcp list spawn)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      await installMcpStdioAdd(ctx())
      const flat = spawnMock.mock.calls
        .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
        .join('\n')
      // No grep invocation anywhere (sister v3.0.2 anti-regression).
      expect(flat).not.toContain('grep')
      // No `mcp list` spawn either — v3.0.3 verify is fs-only.
      expect(flat).not.toContain('mcp list')
      // readFile WAS called against ~/.claude.json (verify path).
      const readPaths = readFileMock.mock.calls.map((c) => String(c[0]))
      expect(readPaths.some((p) => p.endsWith('.claude.json'))).toBe(true)
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

  // v1.0.4 T1.5 + v3.0.2 — ADR 0004 idempotent contract: "already exists"
  // stderr with exit=1 must return ok:true + alreadyInstalled:true. v3.0.2
  // loosens substring match (was '.mcp.json', now 'already exists') since
  // `--scope user` writes ~/.claude.json (CC CLI message no longer mentions
  // .mcp.json specifically).
  it('install exit=1 + "already exists" stderr → ok:true alreadyInstalled:true', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () =>
          makeChild({
            exitCode: 1,
            stderr: 'MCP server tavily-mcp already exists',
          }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: true, alreadyInstalled: true })
      expect('appliedFiles' in r).toBe(false)
    } finally {
      s.restore()
    }
  })

  // v3.0.3: appliedFiles contains ~/.claude.json (user-global, --scope user).
  // Default readFile mock returns valid mcpServers map → verify passes.
  it('happy path: install ok + verify ok → appliedFiles contains .claude.json (v3.0.3)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true && !('alreadyInstalled' in r)) {
        expect(r.appliedFiles.some((f) => f.endsWith('.claude.json'))).toBe(true)
      }
    } finally {
      s.restore()
    }
  })

  // v3.0.3 regression fixture: install spawn ok, but ~/.claude.json missing
  // the server (file empty, malformed, or written elsewhere) → verify-failed
  // with the v3.0.3 message referencing the mcpServers map.
  it('v3.0.3 — install ok but server missing from ~/.claude.json → verify-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      // Verify path reads a config that does not contain tavily-mcp.
      readFileMock.mockReset()
      readFileMock.mockResolvedValue(
        JSON.stringify({ mcpServers: { 'other-mcp': { type: 'stdio' } } }),
      )
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'verify' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('verify-failed')
        expect(r.error.message).toContain('not found in mcpServers map')
      }
    } finally {
      s.restore()
    }
  })

  // v3.0.3 regression fixture: ~/.claude.json does not exist (first install,
  // ENOENT). readClaudeConfig returns {} gracefully → server missing → verify-failed.
  it('v3.0.3 — ~/.claude.json ENOENT → graceful verify-failed (no throw)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      readFileMock.mockReset()
      const enoent = new Error('ENOENT') as NodeJS.ErrnoException
      enoent.code = 'ENOENT'
      readFileMock.mockRejectedValue(enoent)
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'verify' })
    } finally {
      s.restore()
    }
  })

  // v3.0.3 regression fixture: ~/.claude.json malformed JSON → graceful empty
  // config → server missing → verify-failed (no SyntaxError thrown).
  it('v3.0.3 — ~/.claude.json malformed JSON → graceful verify-failed (no throw)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      readFileMock.mockReset()
      readFileMock.mockResolvedValue('{ not valid json')
      const r = await installMcpStdioAdd(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'verify' })
    } finally {
      s.restore()
    }
  })
})
