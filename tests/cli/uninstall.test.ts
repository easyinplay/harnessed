// Phase 5.2 W1 T1.3 — TDD RED: uninstall CLI subcommand tests.
// R10.3 D-01 7-method dispatch + D-02 ephemeral no-op.
// v3.0.1 UX flip — apply-immediate default + --dry-run opt-in.
// v3.9.x — unified uninstall (no name arg) added + --yes/--non-interactive removed.
// Sister: tests/cli/audit-log.test.ts — ExitError + runCli helper 100% reuse.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const content = Buffer.from('uninstall.test quarantine digest fixture')
  return {
    ...actual,
    createReadStream: vi.fn(() => ({
      async *[Symbol.asyncIterator]() {
        yield content
      },
    })),
  }
})
vi.mock('node:fs/promises', () => ({
  lstat: vi.fn(),
  realpath: vi.fn(),
  rename: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rm: vi.fn(),
  stat: vi.fn(),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}))
vi.mock('../../src/cli/lib/settingsTransactionLock.js', () => ({
  withSettingsTransactionLock: vi.fn(async (_context: unknown, work: () => Promise<unknown>) =>
    work(),
  ),
}))
// assetsRoot mocked so the CLI-removal hint's channel branch (isCompiledRuntime)
// is controllable; getAssetsRoot returns a stub (readdir/readFile are mocked, so
// the value is never dereferenced for real I/O).
const assetsMock = vi.hoisted(() => ({ compiled: false }))
const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
vi.mock('../../src/platform/assetsRoot.js', () => ({
  getAssetsRoot: () => '/fake/pkg',
  isCompiledRuntime: () => assetsMock.compiled,
}))

import { spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { lstat, readdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import * as p from '@clack/prompts'
import { Command } from 'commander'
import { registerUninstall } from '../../src/cli/uninstall.js'

const spawnMock = vi.mocked(spawn)
const lstatMock = vi.mocked(lstat)
const realpathMock = vi.mocked(realpath)
const renameMock = vi.mocked(rename)
const rmMock = vi.mocked(rm)
const readFileMock = vi.mocked(readFile)
const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)
const writeFileMock = vi.mocked(writeFile)
const confirmMock = vi.mocked(p.confirm)
const isCancelMock = vi.mocked(p.isCancel)
const quarantinedPathKinds = new Map<string, boolean>()

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerUninstall(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}

function mockPathInfo(path: string) {
  const name = path.replace(/\\/g, '/').split('/').at(-1) ?? ''
  const isDirectory =
    quarantinedPathKinds.get(path) ??
    (['.claude', '.codex', 'agents', 'commands', 'harnessed', 'skills'].includes(name) ||
      !name.includes('.'))
  return {
    dev: 1,
    ino: 1,
    isDirectory: () => isDirectory,
    isSymbolicLink: () => false,
  }
}

function canonicalMockPath(path: string): string {
  let candidate = path
  const missing: string[] = []
  for (;;) {
    try {
      return resolvePath(realpathSync(candidate), ...missing)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const parent = dirname(candidate)
      if (parent === candidate) throw error
      missing.unshift(basename(candidate))
      candidate = parent
    }
  }
}

function mockSpawnExit(code: number, stderr = ''): void {
  spawnMock.mockReturnValue({
    stderr: {
      setEncoding: vi.fn().mockReturnThis(),
      on: vi.fn().mockImplementation((ev: string, cb: (d: string) => void) => {
        if (ev === 'data' && stderr) cb(stderr)
        return { setEncoding: vi.fn().mockReturnThis(), on: vi.fn() }
      }),
    },
    on: vi.fn().mockImplementation((ev: string, cb: (c: number) => void) => {
      if (ev === 'close') setTimeout(() => cb(code), 0)
    }),
    kill: vi.fn(),
  } as unknown as ReturnType<typeof spawn>)
}

// ── Manifest fixtures ──────────────────────────────────────────────

const NPM_CLI_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: ctx7
  display_name: ctx7 CLI
  description: test npm cli manifest
  upstream:
    source: ctx7
    homepage: https://example.com
    repository: https://github.com/test/ctx7.git
    license: MIT
    notice: test notice
spec:
  type: cli-npm
  component_type: cli-binary
  category: search
  install_type: npm
  install:
    method: npm-cli
    cmd: "npm install -g ctx7"
    npm_version: ^0.4.0
    idempotent_check: "command -v ctx7"
  verify:
    cmd: "ctx7 --version"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "npm uninstall -g ctx7"
  upstream_health:
    stability: stable
    last_check: "2026-01-01"
    last_known_good_version: 0.4.x
    fallback_action: warn
  signed_by: test
  platforms:
    - linux
    - darwin
    - win32
`

const EPHEMERAL_NPM_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: ctx7-ephemeral
  display_name: ctx7 ephemeral
  description: test ephemeral npm manifest
  upstream:
    source: ctx7
    homepage: https://example.com
    repository: https://github.com/test/ctx7.git
    license: MIT
    notice: test notice
spec:
  type: cli-npm
  component_type: cli-binary
  category: search
  install_type: npm
  install:
    method: npm-cli
    cmd: "npx --yes ctx7 --version"
    npm_version: ^0.4.0
    idempotent_check: "command -v ctx7"
  verify:
    cmd: "ctx7 --version"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "npx --yes ctx7 --version"
  upstream_health:
    stability: stable
    last_check: "2026-01-01"
    last_known_good_version: 0.4.x
    fallback_action: warn
  signed_by: test
  platforms:
    - linux
    - darwin
    - win32
`

const MCP_STDIO_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: my-mcp-server
  display_name: My MCP Server
  description: test mcp stdio manifest
  upstream:
    source: my-mcp-pkg
    homepage: https://example.com
    repository: https://github.com/test/mcp.git
    license: MIT
    notice: test notice
spec:
  type: mcp-npm
  component_type: mcp-tool
  category: engineering
  install_type: mcp
  install:
    method: mcp-stdio-add
    cmd: "claude mcp add --scope project --transport stdio my-mcp-server -- npx --yes my-mcp-pkg@1.0.0"
    npm_version: "1.0.0"
    idempotent_check: "claude mcp list | grep -q my-mcp-server"
  verify:
    cmd: "claude mcp list | grep -q my-mcp-server"
    timeout_ms: 5000
  uninstall:
    cmd: "claude mcp remove my-mcp-server"
  upstream_health:
    stability: stable
    last_check: "2026-01-01"
    last_known_good_version: "1.0.0"
    fallback_action: warn
  signed_by: test
  platforms:
    - linux
    - darwin
    - win32
`

const GIT_CLONE_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: my-skill
  display_name: My Skill
  description: test git clone manifest
  upstream:
    source: my-skill
    homepage: https://example.com
    repository: https://github.com/test/skill.git
    license: MIT
    notice: test notice
spec:
  type: cc-skill-pack
  component_type: command
  category: engineering
  install_type: git
  install:
    method: git-clone-with-setup
    cmd: "git clone https://github.com/test/skill.git ~/.claude/skills/my-skill"
    git_ref: "abc1234567890123456789012345678901234567"
    idempotent_check: "test -d ~/.claude/skills/my-skill"
  verify:
    cmd: "test -d ~/.claude/skills/my-skill"
    timeout_ms: 5000
  uninstall:
    cmd: "rm -rf ~/.claude/skills/my-skill"
    cleanup_paths:
      - ~/.claude/skills/my-skill
  upstream_health:
    stability: stable
    last_check: "2026-01-01"
    last_known_good_version: main
    fallback_action: warn
  signed_by: test
  platforms:
    - linux
    - darwin
    - win32
`

const CC_HOOK_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: my-hook
  display_name: My Hook
  description: test cc-hook-add manifest
  upstream:
    source: my-hook
    homepage: https://example.com
    repository: https://github.com/test/hook.git
    license: MIT
    notice: test notice
spec:
  type: cc-hook
  component_type: command
  category: meta
  install_type: hook
  install:
    method: cc-hook-add
    cmd: "my-hook-cmd"
    hook_event: "PreToolUse"
    hook_command: "my-hook-cmd"
    hook_matcher: "Read"
    idempotent_check: "grep -q my-hook-cmd ~/.claude/settings.json"
  verify:
    cmd: "grep -q my-hook-cmd ~/.claude/settings.json"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "true"
  upstream_health:
    stability: beta
    last_check: "2026-01-01"
    last_known_good_version: "1.0.0"
    fallback_action: warn
  signed_by: test
  platforms:
    - linux
    - darwin
    - win32
`

function mockManifestFile(yaml: string): void {
  readFileMock.mockResolvedValueOnce(yaml as never)
}

// ── Per-manifest uninstall tests ──────────────────────────────────

describe('cli/uninstall <name> — per-manifest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isCancelMock.mockReturnValue(false)
    lstatMock.mockImplementation(async (path) => mockPathInfo(String(path)) as never)
    realpathMock.mockImplementation(async (path) => canonicalMockPath(String(path)) as never)
    renameMock.mockImplementation(async (source, target) => {
      quarantinedPathKinds.set(String(target), mockPathInfo(String(source)).isDirectory())
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('manifest not found → exit 1', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { code, stderr } = await runCli(['uninstall', 'nonexistent'])
    expect(code).toBe(1)
    expect(stderr).toContain('not found')
  })

  // v16.0 Phase 64 R7 — `harnessed install <name>` resolves tools → skill-packs →
  // optional; uninstall only looked at the first two, so every optional
  // component (perturn-inject, doc-discipline-gate, ecc …) was "not found".
  it('resolves a manifest that lives only in manifests/optional/', async () => {
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).replace(/\\/g, '/').includes('manifests/optional/'))
        return NPM_CLI_MANIFEST_YAML as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    const { code, stdout } = await runCli(['uninstall', 'ctx7', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toMatch(/\[dry-run\]/)
  })

  it('--dry-run → preview output + exit 2', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    const { code, stdout } = await runCli(['uninstall', 'ctx7', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toMatch(/\[dry-run\]/)
  })

  it('npm-cli → runs the declared uninstall cmd via spawn + exit 0 (C1: honors spec.uninstall, not per-method ephemeral no-op)', async () => {
    mockManifestFile(EPHEMERAL_NPM_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'ctx7-ephemeral'])
    expect(code).toBe(0)
    // C1: npm-cli routes to the declared teardown, which runs uninstall.cmd
    // through the spawn seam instead of the per-method "ephemeral → no-op" path.
    expect(spawnMock).toHaveBeenCalled()
  })

  it('git-clone-with-setup → declared teardown removes cleanup_paths via fs.rm + exit 0 (C1)', async () => {
    mockManifestFile(GIT_CLONE_MANIFEST_YAML)
    mockSpawnExit(0) // declared cmd `rm -rf …` goes through the spawn seam (Git Bash on win)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-skill'])
    expect(code).toBe(0)
    // cross-platform removal is the confined cleanup_paths fs.rm — not the
    // per-method reverse-parsed clone dest.
    expect(rmMock).toHaveBeenCalledWith(
      expect.stringMatching(/[/\\]\.claude[/\\]skills[/\\]\.harnessed-quarantine-/),
      expect.objectContaining({ recursive: true, force: true, maxRetries: 3 }),
    )
  })

  it('mcp-stdio-add → runArgs mcp remove <name> + exit 0', async () => {
    mockManifestFile(MCP_STDIO_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-mcp-server'])
    expect(code).toBe(0)
    expect(spawnMock).toHaveBeenCalled()
  })

  it('spawn error → exit 1', async () => {
    mockManifestFile(MCP_STDIO_MANIFEST_YAML)
    mockSpawnExit(1, 'mcp remove failed: server not found')
    confirmMock.mockResolvedValue(true)
    const { code, stderr } = await runCli(['uninstall', 'my-mcp-server'])
    expect(code).toBe(1)
    expect(stderr).toContain('error')
  })

  it('cc-hook-add → settings.json hook filtered out + exit 0', async () => {
    mockManifestFile(CC_HOOK_MANIFEST_YAML)
    readFileMock.mockImplementation(async (path: unknown) => {
      const p = String(path)
      if (p.includes('settings.json'))
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              { matcher: 'Read', command: 'my-hook-cmd' },
              { matcher: 'Write', command: 'other-cmd' },
            ],
          },
        }) as never
      return CC_HOOK_MANIFEST_YAML as never
    })
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-hook'])
    expect(code).toBe(0)
    expect(writeFileMock).toHaveBeenCalled()
    const written = writeFileMock.mock.calls[0]?.[1] as string
    const parsed = JSON.parse(written)
    expect(parsed.hooks?.PreToolUse).toHaveLength(1)
    expect(parsed.hooks?.PreToolUse?.[0]?.command).toBe('other-cmd')
  })

  it('cc-hook-add → atomic settings replacement leaves the original path as rename target', async () => {
    mockManifestFile(CC_HOOK_MANIFEST_YAML)
    readFileMock.mockImplementation(async (path: unknown) => {
      const p = String(path)
      if (p.includes('settings.json'))
        return JSON.stringify({ hooks: { PreToolUse: [{ command: 'my-hook-cmd' }] } }) as never
      return CC_HOOK_MANIFEST_YAML as never
    })
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall', 'my-hook'])
    expect(renameMock).toHaveBeenCalledWith(
      expect.stringContaining('settings.json.tmp-'),
      expect.stringContaining('settings.json'),
    )
  })

  it('interactive confirm declined → exit 2', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    confirmMock.mockResolvedValue(false)
    const { code } = await runCli(['uninstall', 'ctx7'])
    expect(code).toBe(2)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('interactive confirm accepted → immediate uninstall + exit 0', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'ctx7'])
    expect(code).toBe(0)
    expect(confirmMock).toHaveBeenCalledOnce()
    expect(spawnMock).toHaveBeenCalled()
  })

  it('fs.rm called with { recursive: true, force: true }', async () => {
    mockManifestFile(GIT_CLONE_MANIFEST_YAML)
    mockSpawnExit(0)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall', 'my-skill'])
    expect(rmMock).toHaveBeenCalledWith(
      expect.stringMatching(/[/\\]\.claude[/\\]skills[/\\]\.harnessed-quarantine-/),
      expect.objectContaining({ recursive: true, force: true, maxRetries: 3 }),
    )
  })
})

// ── Unified uninstall tests ───────────────────────────────────────

describe('cli/uninstall (no name) — unified', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    quarantinedPathKinds.clear()
    isCancelMock.mockReturnValue(false)
    assetsMock.compiled = false
    // Default: nothing installed
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    statMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    lstatMock.mockImplementation(async (path) => mockPathInfo(String(path)) as never)
    realpathMock.mockImplementation(async (path) => canonicalMockPath(String(path)) as never)
    renameMock.mockImplementation(async (source, target) => {
      quarantinedPathKinds.set(String(target), mockPathInfo(String(source)).isDirectory())
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
    else Reflect.deleteProperty(process.versions, 'bun')
  })

  function mockArtifacts(): void {
    readdirMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('commands')) return ['discuss.md', 'plan.md'] as never
      if (path.endsWith('harnessed'))
        return ['backups', 'settings-env-ownership.json', 'state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.endsWith('.md')) return '<!-- harnessed-generated:v3.4.4 -->\ncontent' as never
      if (path.includes('settings.json'))
        return JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }) as never
      if (path.includes('settings-env-ownership.json'))
        return JSON.stringify({
          version: 1,
          entries: {
            CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: {
              installedValue: '1',
              previous: { present: false },
            },
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
  }

  it('--dry-run → show summary, exit 2, no mutations', async () => {
    mockArtifacts()
    const { code, stdout } = await runCli(['uninstall', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toContain('harnessed-generated')
    expect(rmMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('nothing to remove → exit 0 + "nothing to do"', async () => {
    const { code, stdout } = await runCli(['uninstall'])
    expect(code).toBe(0)
    expect(stdout).toContain('nothing to do')
  })

  it('confirm rejected → exit 2', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(false)
    const { code, stderr } = await runCli(['uninstall'])
    expect(code).toBe(2)
    expect(stderr).toContain('cancelled')
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('confirm accepted → remove artifacts, exit 0', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['uninstall'])
    expect(code).toBe(0)
    expect(stdout).toContain('removed')
    expect(rmMock).toHaveBeenCalled()
  })

  it('removes harnessed-generated command files only', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    const renameSources = renameMock.mock.calls.map((c) => String(c[0]))
    expect(renameSources.some((p) => p.includes('discuss.md'))).toBe(true)
    expect(renameSources.some((p) => p.includes('plan.md'))).toBe(true)
    expect(
      rmMock.mock.calls.some(([path]) => String(path).includes('.harnessed-quarantine-')),
    ).toBe(true)
  })

  it('updates AGENTS.md with atomic temp+rename instead of a direct write', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', 'C:\\codex')
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed')) return ['state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('AGENTS.md')) {
        return [
          'user text',
          '<!-- harnessed:agents-md:start -->',
          'generated',
          '<!-- harnessed:agents-md:end -->',
          '',
        ].join('\n') as never
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)

    const { code } = await runCli(['uninstall'])

    expect(code).toBe(0)
    const tempWrite = writeFileMock.mock.calls.find(([path]) =>
      String(path).includes('AGENTS.md.tmp-'),
    )
    expect(tempWrite).toBeDefined()
    expect(writeFileMock.mock.calls.some(([path]) => String(path).endsWith('AGENTS.md'))).toBe(
      false,
    )
    expect(renameMock).toHaveBeenCalledWith(
      expect.stringContaining('AGENTS.md.tmp-'),
      expect.stringMatching(/AGENTS\.md$/),
    )
  })

  it('fails closed when the AGENTS.md atomic rename loses a symlink race', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', 'C:\\codex')
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed')) return ['state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('AGENTS.md')) {
        return [
          'user text',
          '<!-- harnessed:agents-md:start -->',
          'generated',
          '<!-- harnessed:agents-md:end -->',
          '',
        ].join('\n') as never
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockRejectedValueOnce(new Error('symlink race'))
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)

    const { code, stderr } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toContain('symlink race')
    expect(writeFileMock.mock.calls.some(([path]) => String(path).endsWith('AGENTS.md'))).toBe(
      false,
    )
    expect(rmMock.mock.calls.every(([path]) => String(path).includes('AGENTS.md.tmp-'))).toBe(true)
  })

  it('restores only journal-owned settings env vars and preserves others', async () => {
    readdirMock.mockImplementation(async (p: unknown) => {
      if (String(p).endsWith('harnessed')) return ['settings-env-ownership.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('settings.json'))
        return JSON.stringify({
          env: {
            CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
            HARNESSED_USER_LANG: 'en',
            OTHER_VAR: 'keep-me',
          },
        }) as never
      if (path.includes('settings-env-ownership.json'))
        return JSON.stringify({
          version: 1,
          entries: {
            CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: {
              installedValue: '1',
              previous: { present: false },
            },
            HARNESSED_USER_LANG: {
              installedValue: 'en',
              previous: { present: true, value: 'zh-Hans' },
            },
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    expect(writeFileMock).toHaveBeenCalled()
    const written = JSON.parse(String(writeFileMock.mock.calls[0]?.[1]))
    expect(written.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBeUndefined()
    expect(written.env?.HARNESSED_USER_LANG).toBe('zh-Hans')
    expect(written.env?.OTHER_VAR).toBe('keep-me')
  })

  it('does not remove matching env keys without an ownership journal', async () => {
    readdirMock.mockImplementation(async (p: unknown) => {
      if (String(p).endsWith('harnessed')) return ['state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (p: unknown) => {
      if (String(p).includes('settings.json'))
        return JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('strips orphaned harnessed hooks, preserves unrelated hooks (issue #8)', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    readFileMock.mockImplementation(async (p: unknown) => {
      if (String(p).includes('settings.json'))
        return JSON.stringify({
          hooks: {
            UserPromptSubmit: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'node "/fake/pkg/bin/harnessed-inject-state.mjs"',
                  },
                ],
              },
            ],
            Stop: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'node "/fake/pkg/bin/harnessed-stop-hook.mjs"',
                  },
                ],
              },
            ],
            PreToolUse: [{ hooks: [{ type: 'command', command: 'node bin/guard.mjs' }] }],
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['uninstall'])
    expect(code).toBe(0)
    expect(stdout).toContain('hook')
    expect(writeFileMock).toHaveBeenCalled()
    const written = JSON.parse(String(writeFileMock.mock.calls[0]?.[1]))
    expect(written.hooks?.UserPromptSubmit).toBeUndefined()
    expect(written.hooks?.Stop).toBeUndefined()
    expect(written.hooks?.PreToolUse).toHaveLength(1)
  })

  it('strips the doc-discipline-gate PreToolUse hook, keeps a user Bash hook (4.34.1)', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    readFileMock.mockImplementation(async (p: unknown) => {
      if (String(p).includes('settings.json'))
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'command', command: 'harnessed check-docs --hook' }],
              },
              { matcher: 'Bash', hooks: [{ type: 'command', command: 'node bin/guard.mjs' }] },
            ],
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall'])
    expect(code).toBe(0)
    const written = JSON.parse(String(writeFileMock.mock.calls[0]?.[1]))
    expect(written.hooks?.PreToolUse).toHaveLength(1)
    expect(JSON.stringify(written.hooks?.PreToolUse)).toContain('guard.mjs')
    expect(JSON.stringify(written.hooks?.PreToolUse)).not.toContain('check-docs')
  })

  it('--dry-run surfaces harnessed hooks without mutating', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    readFileMock.mockImplementation(async (p: unknown) => {
      if (String(p).includes('settings.json'))
        return JSON.stringify({
          hooks: {
            UserPromptSubmit: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'node "/fake/pkg/bin/harnessed-inject-state.mjs"',
                  },
                ],
              },
            ],
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    const { code, stdout } = await runCli(['uninstall', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toContain('hook')
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('removes state entries last while preserving backups and the state root', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    const rmCalls = rmMock.mock.calls.map((c) => String(c[0]))
    expect(rmCalls.some((p) => p.endsWith('backups'))).toBe(false)
    expect(rmCalls.some((p) => p.endsWith('harnessed'))).toBe(false)
    expect(renameMock.mock.calls.at(-1)?.[0]).toMatch(/harnessed[\\/]state\.json$/)
    expect(rmCalls.at(-1)).toContain('.harnessed-quarantine-')
  })

  it('quarantines state entries under an authorized custom host root', async () => {
    vi.stubEnv('CLAUDE_CONFIG_DIR', 'D:\\shared')
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).replace(/\\/g, '/') === 'D:/shared/harnessed') return ['state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)

    const { code } = await runCli(['uninstall'])

    expect(code).toBe(0)
    expect(
      renameMock.mock.calls.some(([source]) =>
        String(source).replace(/\\/g, '/').endsWith('shared/harnessed/state.json'),
      ),
    ).toBe(true)
  })

  it('fails before any mutation when the state root is a symlink or junction', async () => {
    mockArtifacts()
    lstatMock.mockImplementation(async (path) =>
      String(path).endsWith('harnessed')
        ? ({ isSymbolicLink: () => true } as never)
        : ({ isSymbolicLink: () => false } as never),
    )
    confirmMock.mockResolvedValue(true)

    const { code, stderr } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toMatch(/canonical|symbolic|junction|refusing/i)
    expect(rmMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('preserves the ownership receipt and exits 1 when settings cannot be parsed', async () => {
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed'))
        return ['settings-env-ownership.json', 'state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).includes('settings-env-ownership.json'))
        return JSON.stringify({
          version: 1,
          entries: {
            HARNESSED_USER_LANG: {
              installedValue: 'zh-Hans',
              previous: { present: false },
            },
          },
        }) as never
      if (String(path).includes('settings.json')) return '{bad json' as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })

    const { code, stderr, stdout } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toContain('settings.json')
    expect(stdout).not.toContain('uninstall complete')
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('preserves the ownership receipt and exits 1 when settings cannot be read', async () => {
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed'))
        return ['settings-env-ownership.json', 'state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).includes('settings-env-ownership.json'))
        return JSON.stringify({
          version: 1,
          entries: {
            HARNESSED_USER_LANG: {
              installedValue: 'zh-Hans',
              previous: { present: false },
            },
          },
        }) as never
      if (String(path).includes('settings.json'))
        throw Object.assign(new Error('access denied'), { code: 'EACCES' })
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })

    const { code, stderr, stdout } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toContain('access denied')
    expect(stdout).not.toContain('uninstall complete')
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('cleans receipt and state when settings ownership exists but settings.json is absent', async () => {
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed'))
        return ['settings-env-ownership.json', 'state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).includes('settings-env-ownership.json'))
        return JSON.stringify({
          version: 1,
          entries: {
            HARNESSED_USER_LANG: {
              installedValue: 'zh-Hans',
              previous: { present: false },
            },
          },
        }) as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    lstatMock.mockImplementation(async (path) => {
      if (String(path).includes('settings.json'))
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      return mockPathInfo(String(path)) as never
    })
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)

    const { code, stderr } = await runCli(['uninstall'])

    expect(code).toBe(0)
    expect(stderr).not.toContain('settings.json')
    expect(lstatMock.mock.calls.some(([path]) => String(path).includes('settings.json'))).toBe(
      false,
    )
    expect(
      renameMock.mock.calls.some(([path]) => String(path).endsWith('settings-env-ownership.json')),
    ).toBe(true)
    expect(renameMock.mock.calls.some(([path]) => String(path).endsWith('state.json'))).toBe(true)
  })

  it('fails closed before mutation when the ownership receipt is corrupt', async () => {
    readdirMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('harnessed'))
        return ['settings-env-ownership.json', 'state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).includes('settings-env-ownership.json')) return '{bad receipt' as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })

    const { code, stderr } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toContain('ownership')
    expect(rmMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('exits 1 and does not print complete when any removal fails', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    rmMock.mockRejectedValueOnce(new Error('locked'))

    const { code, stdout, stderr } = await runCli(['uninstall'])

    expect(code).toBe(1)
    expect(stderr).toContain('locked')
    expect(stdout).not.toContain('uninstall complete')
  })

  it('does not remove a same-named user skill without ownership evidence', async () => {
    readdirMock.mockImplementation(async (path: unknown) => {
      const value = String(path)
      if (value.includes('workflows')) return ['auto'] as never
      if (value.endsWith('harnessed')) return ['state.json'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (path: unknown) => {
      if (String(path).endsWith('SKILL.md')) return '# user-owned skill' as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    confirmMock.mockResolvedValue(true)

    const { code } = await runCli(['uninstall'])

    expect(code).toBe(0)
    expect(rmMock.mock.calls.some((call) => String(call[0]).match(/[\\/]skills[\\/]auto$/))).toBe(
      false,
    )
  })

  // ── CLI-removal hint (channel-aware; closes "uninstall not unified" gap) ──

  it.each([
    false,
    true,
  ])('Bun lists manual npm/Bun removal choices without inferring or uninstalling (dryRun=%s)', async (dryRun) => {
    Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.4.4' })
    if (dryRun) mockArtifacts()
    const { stdout } = await runCli(['uninstall', ...(dryRun ? ['--dry-run'] : [])])
    expect(stdout).toContain('install manager not inferred')
    expect(stdout).toContain('actual install source')
    expect(stdout).toContain('npm uninstall -g harnessed')
    expect(stdout).toContain('bun remove --global harnessed')
    expect(spawnMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('completion prints CLI-removal hint — npm channel by default', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    const { stdout } = await runCli(['uninstall'])
    expect(stdout).toContain('to remove the harnessed CLI itself')
    expect(stdout).toContain('npm uninstall -g harnessed')
    expect(stdout).toContain('  npm: npm uninstall -g harnessed\n')
    expect(stdout).not.toContain('bun remove --global harnessed')
    expect(stdout).not.toContain('install manager not inferred')
  })

  it('dry-run also prints the CLI-removal hint', async () => {
    mockArtifacts()
    const { code, stdout } = await runCli(['uninstall', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toContain('to remove the harnessed CLI itself')
  })

  it('compiled binary channel → binary removal hint names the exe path', async () => {
    assetsMock.compiled = true
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    const { stdout } = await runCli(['uninstall'])
    expect(stdout).toContain(process.execPath)
    expect(stdout).toContain('PATH')
    // npm line must NOT be the primary channel line for a binary install
    expect(stdout).not.toMatch(/npm: npm uninstall -g harnessed/)
  })

  it('nothing-to-do still tells the user how to remove the CLI', async () => {
    const { code, stdout } = await runCli(['uninstall'])
    expect(code).toBe(0)
    expect(stdout).toContain('nothing to do')
    expect(stdout).toContain('to remove the harnessed CLI itself')
  })

  it('fails closed when both host homes are set without --platform', async () => {
    vi.stubEnv('CLAUDE_CONFIG_DIR', '/custom/claude')
    vi.stubEnv('CODEX_HOME', '/custom/codex')
    const { code, stderr } = await runCli(['uninstall'])
    expect(code).toBe(1)
    expect(stderr).toContain('--platform')
  })

  it('accepts --platform to disambiguate dual host homes', async () => {
    vi.stubEnv('CLAUDE_CONFIG_DIR', '/custom/claude')
    vi.stubEnv('CODEX_HOME', '/custom/codex')
    const { code, stderr } = await runCli(['uninstall', '--platform', 'codex'])
    expect(code).toBe(0)
    expect(stderr).not.toContain('unknown option')
  })
})
