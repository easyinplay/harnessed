// Phase 1.2 → 2.1 integration contract tests — ADR 0004 6 hard contracts × 6 methods = 36 cells.
//
// B4' (phase 1.2) + E8 (phase 2.1) acceptance bar — proves all 6 install
// methods (npm-cli + mcp-stdio-add + mcp-http-add + git-clone-with-setup +
// cc-plugin-marketplace + npx-skill-installer) satisfy the dry-run /
// diff-format / backup-location / level-declaration / mcp-cli-only /
// no-silent-failure contracts.
//
// All I/O is mocked (C6 mitigation): node:child_process / @clack/prompts /
// node:fs/promises. Inline manifest factory (B/M-style) chosen over yaml
// fixtures to minimise file overhead per task_plan T5.2 note ("如 fixture
// 数量大可改为 inline manifest object 减少 file overhead"). Phase 2.1 T6.2
// adds 4 factories + extends the test grid loop — no new mock infra.
//
// The 6 contracts (per ADR 0004 § Compliance):
//   C1 dry-run-default   — opts.apply=false ⇒ no spawn invocation
//   C2 diff-format       — output contains unified-diff markers (+++ / --- / @@)
//                          OR the (no file changes) sentinel for L1/L4 plans
//                          that produce empty plan.files[]
//   C3 backup-location   — backup writes under .harnessed-backup/<ts>/
//   C4 level-declaration — npm-cli respects --system gate; L2/L3 installers
//                          do not (no flag gate; just confirm tier)
//   C5 mcp-cli-only      — mcp-{stdio,http}-add + cc-plugin-marketplace use
//                          `claude` CLI (never direct fs.write on .mcp.json /
//                          .claude/settings.json); npm-cli / git-clone-with-setup
//                          / npx-skill-installer do NOT invoke `claude`
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
  // Phase 2.1 T6.2 — npx-skill-installer real-path verify uses fs.access
  // to check `~/.claude/skills/<name>/SKILL.md` exists. Default mock returns
  // success (path exists) so the C3/C5/C6 tests can reach end-of-install;
  // the no-silent-failure C6 cell exercises the spawn-exit-1 path which
  // returns before fs.access is reached.
  access: vi.fn(async () => undefined),
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

// --- Phase 2.1 T6.2 — 4 new installer factories ---------------------------
// Per ADR 0004 6 contracts, every method must satisfy the same grid. Each
// factory produces a minimal-but-shape-correct Manifest for the installer
// under test.

function mcpHttpManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'remote-mcp',
      display_name: 'Remote MCP (HTTP)',
      description: 'fixture',
      upstream: {
        source: 'remote-mcp',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/remote-mcp.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'mcp-npm',
      component_type: 'mcp-tool',
      category: 'meta',
      install_type: 'local',
      install: {
        method: 'mcp-http-add',
        // mcp-http-add parses url + headers from this cmd. No ${ENV_VAR}
        // references so the env-resolution carve-out short-circuits clean.
        cmd: 'claude mcp add --scope project --transport http remote-mcp https://api.example.com/mcp',
        npm_version: '^1.0.0',
        idempotent_check: 'claude mcp list | grep -q remote-mcp',
      },
      verify: { cmd: 'claude mcp list', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'claude mcp remove remote-mcp' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

function gitCloneManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'my-skill-pack',
      display_name: 'My Skill Pack',
      description: 'fixture',
      upstream: {
        source: 'my-skill-pack',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/my-skill-pack.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'skill-pack',
      category: 'engineering',
      install_type: 'git',
      install: {
        method: 'git-clone-with-setup',
        // gitCloneWithSetup parses `git clone <url> <dest>` from cmd; dest
        // is required (D-15 SHA-verify needs the cwd). Use a 40-hex SHA so
        // the strict SHA-pin guard passes.
        cmd: 'git clone --depth 1 https://github.com/example/my-skill-pack.git /tmp/my-skill-pack',
        git_ref: 'e89d70e4bcd0a1234567890abcdef1234567890a',
        idempotent_check: 'test -d /tmp/my-skill-pack',
      },
      verify: { cmd: 'test -d /tmp/my-skill-pack', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'rm -rf /tmp/my-skill-pack' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

function ccPluginManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'ralph-loop',
      display_name: 'Ralph Loop',
      description: 'fixture',
      upstream: {
        source: 'ralph-loop',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/ralph-loop.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-plugin',
      component_type: 'plugin',
      category: 'meta',
      install_type: 'local',
      install: {
        method: 'cc-plugin-marketplace',
        // ccPluginMarketplace parses `plugin marketplace add <ref>` and
        // `plugin install <plugin>@<mkt>` from cmd. Note: the `/` prefix
        // is the in-REPL slash form; we strip it during parse.
        cmd: '/plugin marketplace add example/ralph-loop && /plugin install ralph-loop@example',
        // 40-hex SHA satisfies preflight GIT_REF_SHAPE regex (the schema
        // permits either SHA or SemVer; cc-plugin-marketplace's verify path
        // does not use git_ref directly — it's recorded for audit-trail).
        git_ref: 'a1b2c3d4e5f67890123456789012345678901234',
        idempotent_check: 'claude plugin list | grep -q ralph-loop',
      },
      verify: { cmd: 'claude plugin list --json', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'claude plugin uninstall ralph-loop' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

function ccHookAddManifest(): Manifest {
  // Phase 2.4 W3 T3.1 (D-04 § 3.1 + R2.4.4) — 7th installer contract row.
  // cc-hook-add does NOT spawn (registers entry into ~/.claude/settings.json
  // via fs.writeFile); C5 mcp-cli-only contract expects invokedClaude=false.
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'cc-hook-fixture',
      display_name: 'CC Hook Fixture',
      description: 'fixture',
      upstream: {
        source: 'cc-hook-fixture',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/cc-hook-fixture.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-hook',
      component_type: 'command',
      category: 'meta',
      install_type: 'hook',
      install: {
        method: 'cc-hook-add',
        cmd: 'node scripts/dashboard.mjs --no-open',
        hook_event: 'SessionStart',
        hook_matcher: 'startup|resume',
        hook_command: 'node scripts/dashboard.mjs --no-open',
        idempotent_check: 'grep -q dashboard.mjs ~/.claude/settings.json',
      },
      verify: { cmd: 'true', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'true' },
      upstream_health: {
        stability: 'beta',
        last_check: '2026-05-16',
        last_known_good_version: '0.2.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

function npxSkillManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'my-npx-skill',
      display_name: 'My NPX Skill',
      description: 'fixture',
      upstream: {
        source: 'my-npx-skill',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/my-npx-skill.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'skill-pack',
      category: 'engineering',
      install_type: 'npx',
      install: {
        method: 'npx-skill-installer',
        // npxSkillInstaller preflight requires `skills@<pinned>` (not @latest)
        // + `--copy` + `--global`. D2.1-5 enforcement.
        cmd: 'npx --yes skills@1.5.7 add example/my-npx-skill --skill my-npx-skill --agent claude-code --copy --global --yes',
        npm_version: '1.5.7',
        idempotent_check: 'test -f ~/.claude/skills/my-npx-skill/SKILL.md',
      },
      verify: {
        cmd: 'test -f ~/.claude/skills/my-npx-skill/SKILL.md',
        timeout_ms: 5000,
        expected_exit_code: 0,
      },
      uninstall: { cmd: 'rm -rf ~/.claude/skills/my-npx-skill' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.5.7',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

const factories = {
  'npm-cli': npmCliManifest,
  'mcp-stdio-add': mcpStdioManifest,
  'mcp-http-add': mcpHttpManifest,
  'git-clone-with-setup': gitCloneManifest,
  'cc-plugin-marketplace': ccPluginManifest,
  'npx-skill-installer': npxSkillManifest,
  // Phase 2.4 W3 T3.1 — 7th installer contract row (D-04 § 3.1 + R2.4.4).
  'cc-hook-add': ccHookAddManifest,
}

// --- Contract test grid (6 methods × 6 contracts = 36 cells) ----------------

const methods = [
  'npm-cli',
  'mcp-stdio-add',
  'mcp-http-add',
  'git-clone-with-setup',
  'cc-plugin-marketplace',
  'npx-skill-installer',
  // Phase 2.4 W3 T3.1 — 7th installer (D-04 § 3.1).
  'cc-hook-add',
] as const
type Method = (typeof methods)[number]

// Methods whose ADR 0004 § Compliance C5 disposition is "uses `claude` CLI as
// the sole mutator" — they SHOULD spawn `claude ...` and SHOULD NOT directly
// writeFile to the target config (.mcp.json / .claude/settings.json).
const CLAUDE_CLI_METHODS = new Set<Method>([
  'mcp-stdio-add',
  'mcp-http-add',
  'cc-plugin-marketplace',
])

// Methods that require --system (L4 / level-flag-missing gate). Currently
// only npm-cli is L4. L2/L3 installers proceed to the dry-run sentinel.
const SYSTEM_FLAG_REQUIRED: ReadonlySet<Method> = new Set<Method>(['npm-cli'])

function isAborted(r: unknown): r is { aborted: true; reason: string } {
  return typeof r === 'object' && r !== null && 'aborted' in r
}
function isFailure(
  r: unknown,
): r is { ok: false; phase: string; error: { message: string; keyword: string } } {
  return typeof r === 'object' && r !== null && 'ok' in r && (r as { ok: boolean }).ok === false
}

function applyOpts(method: Method): InstallOpts {
  return SYSTEM_FLAG_REQUIRED.has(method)
    ? baseOpts({ apply: true, dryRun: false, system: true })
    : baseOpts({ apply: true, dryRun: false })
}

function dryRunOpts(method: Method): InstallOpts {
  return SYSTEM_FLAG_REQUIRED.has(method)
    ? baseOpts({ apply: false, dryRun: true, system: true })
    : baseOpts({ apply: false, dryRun: true })
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
        // L4 installers (npm-cli) need --system to clear the level-flag gate
        // and reach the dry-run abort; L2/L3 installers proceed without it.
        const r = await runInstall(factories[method as Method](), dryRunOpts(method))
        expect(isAborted(r)).toBe(true)
        expect(spawnMock).not.toHaveBeenCalled()
      } finally {
        cap.restore()
      }
    })

    // C2 — diff output uses unified-diff markers OR the documented (no file
    // changes) sentinel. npm-cli emits no-files-changed (PATH mod is not a
    // unified diff); all other installers emit a synthetic patch w/ +++/---/@@
    // (mcp-stdio + mcp-http: .mcp.json; cc-plugin: .claude/settings.json;
    // git-clone: cloned dir; npx-skill: ~/.claude/skills/<name>/SKILL.md).
    it('contract: diff-format', async () => {
      const cap = captureStdout()
      try {
        await runInstall(factories[method as Method](), dryRunOpts(method))
        const out = cap.output()
        if (method === 'npm-cli') {
          // L4 plan has no file mutations — sentinel + L4 educational hint.
          expect(out).toContain('(no file changes)')
        } else {
          // Synthesised pure-create patch — must contain at least one of the
          // unified-diff hunk markers.
          const hasUnifiedMarker = /(^|\n)(\+\+\+|---|@@)/.test(out)
          expect(hasUnifiedMarker).toBe(true)
        }
      } finally {
        cap.restore()
      }
    })

    // C3 — backups land under <harnessed-root>/backups/<ts>/. v3.0.3 path:
    // `~/.claude/harnessed/backups/<ts>/` (sister v2.0.1 `~/.harnessed/backups/`
    // root migration generalised to co-located Claude Code dir). backup.ts
    // always mkdir's the timestamp dir even for empty plans.
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
        await runInstall(factories[method as Method](), applyOpts(method))
        const calls = mkdirMock.mock.calls.map((c) => String(c[0]))
        const hasBackupDir = calls.some((p) => /\.claude[/\\]harnessed[/\\]backups/.test(p))
        expect(hasBackupDir).toBe(true)
      } finally {
        cap.restore()
      }
    })

    // C4 — Level declaration. npm-cli (L4) requires --system; L2/L3 installers
    // proceed to the dry-run sentinel (user-cancel) without a flag gate.
    it('contract: level-declaration', async () => {
      const cap = captureStdout()
      try {
        if (SYSTEM_FLAG_REQUIRED.has(method)) {
          // No --system, non-interactive ⇒ aborted with level-flag-missing.
          const r = await runInstall(factories[method as Method](), baseOpts({ system: false }))
          expect(isAborted(r)).toBe(true)
          if (isAborted(r)) expect(r.reason).toBe('level-flag-missing')
          // Now with --system → proceeds (still dry-run aborted, but for a
          // different reason — user-cancel sentinel from dry-run short-circuit).
          spawnMock.mockReset()
          const r2 = await runInstall(factories[method as Method](), baseOpts({ system: true }))
          expect(isAborted(r2)).toBe(true)
          if (isAborted(r2)) expect(r2.reason).not.toBe('level-flag-missing')
        } else {
          // L2/L3 = no --system check; dry-run path aborts with user-cancel
          // (dry-run sentinel — never level-flag-missing).
          const r = await runInstall(factories[method as Method](), baseOpts())
          expect(isAborted(r)).toBe(true)
          if (isAborted(r)) expect(r.reason).not.toBe('level-flag-missing')
        }
      } finally {
        cap.restore()
      }
    })

    // C5 — mcp-cli-only. CLAUDE_CLI_METHODS (mcp-stdio + mcp-http + cc-plugin)
    // must invoke `claude ...` via spawn (not direct fs.writeFile on their
    // config target); other methods must NEVER spawn `claude` at all.
    it('contract: mcp-cli-only', async () => {
      const cap = captureStdout()
      try {
        spawnMock.mockImplementation(
          () =>
            makeChild({ exitCode: 0, stdout: '', stderr: '' }) as unknown as ReturnType<
              typeof spawn
            >,
        )
        await runInstall(factories[method as Method](), applyOpts(method))

        const allSpawnCalls = spawnMock.mock.calls.map((c) => {
          const argv = (c[1] ?? []) as string[]
          return [String(c[0]), ...argv].join(' ')
        })
        // Match `claude` as the binary token, NOT inside compound words like
        // `claude-code` (which appears as the `--agent claude-code` argument
        // of `npx skills add`). On Win we route through `cmd.exe /c claude
        // ...`; on Unix we spawn `claude ...` directly (or `/bin/sh -c
        // "claude ..."` for the verify pipe). The binary token is always
        // followed by whitespace and a sub-command (mcp / plugin / etc.).
        const invokedClaude = allSpawnCalls.some((line) => /(?:^|\s)claude(?:\s|$)/.test(line))

        if (CLAUDE_CLI_METHODS.has(method)) {
          expect(invokedClaude).toBe(true)
          // And NO direct write to the CLI-managed config files.
          const wroteCliConfig = writeFileMock.mock.calls.some((c) => {
            const p = String(c[0])
            return p.endsWith('.mcp.json') || p.endsWith('settings.json')
          })
          expect(wroteCliConfig).toBe(false)
        } else {
          expect(invokedClaude).toBe(false)
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
        const r = await runInstall(factories[method as Method](), applyOpts(method))
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
