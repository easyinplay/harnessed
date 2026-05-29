// Phase 5.2 W1 T1.3 — TDD RED: uninstall CLI subcommand tests.
// R10.3 D-01 7-method dispatch + D-02 ephemeral no-op.
// v3.0.1 UX flip — apply-immediate default + --dry-run opt-in.
// v3.9.x — unified uninstall (no name arg) added + --yes/--non-interactive removed.
// Sister: tests/cli/audit-log.test.ts — ExitError + runCli helper 100% reuse.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:fs/promises', () => ({
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

import { spawn } from 'node:child_process'
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { Command } from 'commander'
import { registerUninstall } from '../../src/cli/uninstall.js'

const spawnMock = vi.mocked(spawn)
const rmMock = vi.mocked(rm)
const readFileMock = vi.mocked(readFile)
const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)
const writeFileMock = vi.mocked(writeFile)
const confirmMock = vi.mocked(p.confirm)
const isCancelMock = vi.mocked(p.isCancel)

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
  })
  afterEach(() => vi.restoreAllMocks())

  it('manifest not found → exit 1', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { code, stderr } = await runCli(['uninstall', 'nonexistent'])
    expect(code).toBe(1)
    expect(stderr).toContain('not found')
  })

  it('--dry-run → preview output + exit 2', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    const { code, stdout } = await runCli(['uninstall', 'ctx7', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toMatch(/\[dry-run\]/)
  })

  it('ephemeral npm-cli (npx --yes) → exit 0 + ephemeral warn', async () => {
    mockManifestFile(EPHEMERAL_NPM_MANIFEST_YAML)
    confirmMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['uninstall', 'ctx7-ephemeral'])
    expect(code).toBe(0)
    expect(stdout).toContain('ephemeral install')
  })

  it('git-clone-with-setup → fs.rm called with clone target + exit 0', async () => {
    mockManifestFile(GIT_CLONE_MANIFEST_YAML)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-skill'])
    expect(code).toBe(0)
    expect(rmMock).toHaveBeenCalledWith(
      expect.stringContaining('.claude/skills/my-skill'),
      expect.objectContaining({ recursive: true, force: true }),
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
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall', 'my-skill'])
    expect(rmMock.mock.calls[0]?.[1]).toMatchObject({ recursive: true, force: true })
  })
})

// ── Unified uninstall tests ───────────────────────────────────────

describe('cli/uninstall (no name) — unified', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isCancelMock.mockReturnValue(false)
    // Default: nothing installed
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    statMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  })
  afterEach(() => vi.restoreAllMocks())

  function mockArtifacts(): void {
    readdirMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('commands')) return ['discuss.md', 'plan.md'] as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    readFileMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.endsWith('.md')) return '<!-- harnessed-generated:v3.4.4 -->\ncontent' as never
      if (path.includes('settings.json'))
        return JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' } }) as never
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
    const rmCalls = rmMock.mock.calls.map((c) => String(c[0]))
    expect(rmCalls.some((p) => p.includes('discuss.md'))).toBe(true)
    expect(rmCalls.some((p) => p.includes('plan.md'))).toBe(true)
  })

  it('removes settings env vars, preserves others', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
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
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    rmMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    expect(writeFileMock).toHaveBeenCalled()
    const written = JSON.parse(String(writeFileMock.mock.calls[0]?.[1]))
    expect(written.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBeUndefined()
    expect(written.env?.HARNESSED_USER_LANG).toBeUndefined()
    expect(written.env?.OTHER_VAR).toBe('keep-me')
  })

  it('state dir removed last', async () => {
    mockArtifacts()
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall'])
    const rmCalls = rmMock.mock.calls.map((c) => String(c[0]))
    const stateDirIdx = rmCalls.findLastIndex((p) => p.includes('harnessed'))
    expect(stateDirIdx).toBe(rmCalls.length - 1)
  })
})
