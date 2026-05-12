// Phase 1.2 integration contract tests — ADR 0004 6 hard contracts × 2 methods = 12 cells.
//
// B4' acceptance bar — proves npm-cli + mcp-stdio-add satisfy the dry-run /
// diff-format / backup-location / level-declaration / mcp-cli-only /
// no-silent-failure contracts.
//
// All I/O is mocked (C6 mitigation): node:child_process / @clack/prompts /
// node:fs/promises. Inline manifest factory (B/M-style) chosen over yaml
// fixtures to minimise file overhead per task_plan T5.2 note ("如 fixture
// 数量大可改为 inline manifest object 减少 file overhead").
//
// The 6 contracts (per ADR 0004 § Compliance):
//   C1 dry-run-default   — opts.apply=false ⇒ no spawn invocation
//   C2 diff-format       — output contains unified-diff markers (+++ / --- / @@)
//                          OR the (no file changes) sentinel for L1/L4 plans
//                          that produce empty plan.files[]
//   C3 backup-location   — backup writes under .harnessed-backup/<ts>/
//   C4 level-declaration — npm-cli respects --system gate; mcp-stdio at L3
//   C5 mcp-cli-only      — mcp-stdio uses `claude mcp` CLI (never direct fs.write
//                          on .mcp.json); npm-cli does NOT invoke `claude mcp`
//   C6 no-silent-failure — spawn exit=1 yields { ok:false, error.message } with
//                          a non-empty user-facing message (suggest field is
//                          optional per InstallError shape — keyword non-empty)

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks (declared before importing SUT; vitest hoists vi.mock calls) ----

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

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
import { mkdir, writeFile } from 'node:fs/promises'
import { runInstall } from '../../src/installers/index.js'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)
const mkdirMock = vi.mocked(mkdir)
const writeFileMock = vi.mocked(writeFile)

// --- Helpers ----------------------------------------------------------------

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}

function makeChild(opts: { exitCode?: number; stdout?: string; stderr?: string }): FakeChild {
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

function captureStdout(): { restore: () => void; output: () => string } {
  const original = process.stdout.write.bind(process.stdout)
  let buf = ''
  // biome-ignore lint/suspicious/noExplicitAny: stdout.write has variadic overloads
  process.stdout.write = ((chunk: any) => {
    buf += typeof chunk === 'string' ? chunk : chunk.toString()
    return true
  }) as typeof process.stdout.write
  return {
    restore: () => {
      process.stdout.write = original
    },
    output: () => buf,
  }
}

const baseOpts = (over: Partial<InstallOpts> = {}): InstallOpts => ({
  apply: false,
  dryRun: true,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
  ...over,
})

function npmCliManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'ctx7',
      display_name: 'Context7 CLI',
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
        npm_version: '^1.0.0',
        idempotent_check: 'which ctx7',
      },
      verify: { cmd: 'ctx7 --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g ctx7' },
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

function mcpStdioManifest(): Manifest {
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

const factories = {
  'npm-cli': npmCliManifest,
  'mcp-stdio-add': mcpStdioManifest,
}

// --- Contract test grid (12 cells) -----------------------------------------

const methods = ['npm-cli', 'mcp-stdio-add'] as const
type Method = (typeof methods)[number]

function isAborted(r: unknown): r is { aborted: true; reason: string } {
  return typeof r === 'object' && r !== null && 'aborted' in r
}
function isFailure(
  r: unknown,
): r is { ok: false; phase: string; error: { message: string; keyword: string } } {
  return typeof r === 'object' && r !== null && 'ok' in r && (r as { ok: boolean }).ok === false
}

for (const method of methods) {
  describe(`${method} satisfies ADR 0004 contracts`, () => {
    beforeEach(() => {
      spawnMock.mockReset()
      mkdirMock.mockClear()
      writeFileMock.mockClear()
    })

    // C1 — dry-run is default; spawn must NOT be invoked when apply=false.
    it('contract: dry-run-default', async () => {
      const cap = captureStdout()
      try {
        // npm-cli at L4 without --system → aborts before spawn (level-flag-missing);
        // pass --system so we exercise the dry-run gate, not the level gate.
        const opts =
          method === 'npm-cli'
            ? baseOpts({ apply: false, dryRun: true, system: true })
            : baseOpts({ apply: false, dryRun: true })
        const r = await runInstall(factories[method as Method](), opts)
        expect(isAborted(r)).toBe(true)
        expect(spawnMock).not.toHaveBeenCalled()
      } finally {
        cap.restore()
      }
    })

    // C2 — diff output uses unified-diff markers OR the documented (no file
    // changes) sentinel. npm-cli emits no-files-changed (PATH mod is not a
    // unified diff); mcp-stdio emits a synthetic .mcp.json patch w/ +++/---.
    it('contract: diff-format', async () => {
      const cap = captureStdout()
      try {
        const opts =
          method === 'npm-cli'
            ? baseOpts({ apply: false, dryRun: true, system: true })
            : baseOpts({ apply: false, dryRun: true })
        await runInstall(factories[method as Method](), opts)
        const out = cap.output()
        if (method === 'npm-cli') {
          // L4 plan has no file mutations — sentinel + L4 educational hint.
          expect(out).toContain('(no file changes)')
        } else {
          // mcp-stdio synthesises a pure-create patch for .mcp.json — must
          // contain at least one of the unified-diff hunk markers.
          const hasUnifiedMarker = /(^|\n)(\+\+\+|---|@@)/.test(out)
          expect(hasUnifiedMarker).toBe(true)
        }
      } finally {
        cap.restore()
      }
    })

    // C3 — backups land under .harnessed-backup/<ts>/. Only mcp-stdio has
    // a non-empty plan.files[] in dry-run (npm-cli's plan is empty); we
    // therefore exercise the `apply` path so backup() is reached on both.
    it('contract: backup-location', async () => {
      const cap = captureStdout()
      try {
        // Make spawn always succeed so we get past install + verify steps.
        spawnMock.mockImplementation(
          () =>
            makeChild({ exitCode: 0, stdout: '', stderr: '' }) as unknown as ReturnType<
              typeof spawn
            >,
        )
        const opts =
          method === 'npm-cli'
            ? baseOpts({ apply: true, dryRun: false, system: true })
            : baseOpts({ apply: true, dryRun: false })
        await runInstall(factories[method as Method](), opts)
        // backup.ts always mkdir's the timestamp dir even for empty plans.
        const calls = mkdirMock.mock.calls.map((c) => String(c[0]))
        const hasBackupDir = calls.some((p) => p.includes('.harnessed-backup'))
        expect(hasBackupDir).toBe(true)
      } finally {
        cap.restore()
      }
    })

    // C4 — Level declaration. npm-cli requires --system; mcp-stdio at L3
    // (no flag gate; just confirm tier).
    it('contract: level-declaration', async () => {
      const cap = captureStdout()
      try {
        if (method === 'npm-cli') {
          // No --system, non-interactive ⇒ aborted with level-flag-missing.
          const r = await runInstall(npmCliManifest(), baseOpts({ system: false }))
          expect(isAborted(r)).toBe(true)
          if (isAborted(r)) expect(r.reason).toBe('level-flag-missing')
          // Now with --system → proceeds (still dry-run aborted, but for a
          // different reason — user-cancel sentinel from dry-run short-circuit).
          spawnMock.mockReset()
          const r2 = await runInstall(npmCliManifest(), baseOpts({ system: true }))
          expect(isAborted(r2)).toBe(true)
          if (isAborted(r2)) expect(r2.reason).not.toBe('level-flag-missing')
        } else {
          // mcp-stdio = L3 fixed; no --system check; dry-run path aborts
          // with user-cancel (the dry-run sentinel — never level-flag-missing).
          const r = await runInstall(mcpStdioManifest(), baseOpts())
          expect(isAborted(r)).toBe(true)
          if (isAborted(r)) expect(r.reason).not.toBe('level-flag-missing')
        }
      } finally {
        cap.restore()
      }
    })

    // C5 — mcp-cli-only. mcp-stdio must invoke `claude mcp ...` via spawn
    // (not direct fs.writeFile on .mcp.json); npm-cli must NEVER spawn
    // `claude` at all.
    it('contract: mcp-cli-only', async () => {
      const cap = captureStdout()
      try {
        spawnMock.mockImplementation(
          () =>
            makeChild({ exitCode: 0, stdout: '', stderr: '' }) as unknown as ReturnType<
              typeof spawn
            >,
        )
        const opts =
          method === 'npm-cli'
            ? baseOpts({ apply: true, dryRun: false, system: true })
            : baseOpts({ apply: true, dryRun: false })
        await runInstall(factories[method as Method](), opts)

        const allSpawnCalls = spawnMock.mock.calls.map((c) => {
          const argv = (c[1] ?? []) as string[]
          return [String(c[0]), ...argv].join(' ')
        })
        const invokedClaudeMcp = allSpawnCalls.some((line) => /\bclaude\b.*\bmcp\b/.test(line))

        if (method === 'mcp-stdio-add') {
          expect(invokedClaudeMcp).toBe(true)
          // And NO direct write to .mcp.json (CLI is the only mutator).
          const wroteMcpJson = writeFileMock.mock.calls.some((c) =>
            String(c[0]).endsWith('.mcp.json'),
          )
          expect(wroteMcpJson).toBe(false)
        } else {
          expect(invokedClaudeMcp).toBe(false)
        }
      } finally {
        cap.restore()
      }
    })

    // C6 — non-zero spawn exit code yields { ok:false } with a non-empty
    // user-facing message + keyword. `suggest` is optional in InstallError.
    it('contract: no-silent-failure', async () => {
      const cap = captureStdout()
      try {
        spawnMock.mockImplementation(
          () =>
            makeChild({
              exitCode: 1,
              stderr: 'simulated install failure',
            }) as unknown as ReturnType<typeof spawn>,
        )
        const opts =
          method === 'npm-cli'
            ? baseOpts({ apply: true, dryRun: false, system: true })
            : baseOpts({ apply: true, dryRun: false })
        const r = await runInstall(factories[method as Method](), opts)
        expect(isFailure(r)).toBe(true)
        if (isFailure(r)) {
          expect(r.error.message.length).toBeGreaterThan(0)
          expect(r.error.keyword.length).toBeGreaterThan(0)
        }
      } finally {
        cap.restore()
      }
    })
  })
}
