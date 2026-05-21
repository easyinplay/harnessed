// Phase 5.2 W1 T1.3 — TDD RED: uninstall CLI subcommand tests.
// R10.3 D-01 7-method dispatch + D-02 ephemeral no-op + D-06 --yes bypass。
// v3.0.1 UX flip — apply-immediate default + --dry-run opt-in (was D-05 dry-run default)。
// Sister: tests/cli/audit-log.test.ts — ExitError + runCli helper 100% reuse.
// vi.mock spawn/fs.rm (cross-OS; Win CI runner must pass Day 1).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rm: vi.fn(),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}))

import { spawn } from 'node:child_process'
import { readFile, rm, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { Command } from 'commander'
import { registerUninstall } from '../../src/cli/uninstall.js'

const spawnMock = vi.mocked(spawn)
const rmMock = vi.mocked(rm)
const readFileMock = vi.mocked(readFile)
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

// Helper: make spawn resolve with given exit code
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

// Minimal valid manifest shapes per-method
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

const MCP_HTTP_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: my-http-mcp
  display_name: My HTTP MCP
  description: test http mcp manifest
  upstream:
    source: my-http-mcp
    homepage: https://example.com
    repository: https://github.com/test/httpmcp.git
    license: MIT
    notice: test notice
spec:
  type: mcp-npm
  component_type: mcp-tool
  category: engineering
  install_type: mcp
  install:
    method: mcp-http-add
    cmd: "claude mcp add --scope project --transport http my-http-mcp https://example.com/mcp"
    npm_version: "1.0.0"
    idempotent_check: "claude mcp list | grep -q my-http-mcp"
  verify:
    cmd: "claude mcp list | grep -q my-http-mcp"
    timeout_ms: 5000
  uninstall:
    cmd: "claude mcp remove my-http-mcp"
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

const CC_PLUGIN_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: superpowers
  display_name: Superpowers
  description: test cc-plugin manifest
  upstream:
    source: superpowers
    homepage: https://example.com
    repository: https://github.com/test/superpowers.git
    license: MIT
    notice: test notice
spec:
  type: cc-plugin
  component_type: command
  category: engineering
  install_type: skill
  install:
    method: cc-plugin-marketplace
    cmd: "claude plugin marketplace add test/mkt && claude plugin install superpowers@test-marketplace --scope project"
    git_ref: "abc1234567890123456789012345678901234567"
    idempotent_check: "claude plugin list | grep -q superpowers"
  verify:
    cmd: "claude plugin list | grep -q superpowers"
    timeout_ms: 5000
  uninstall:
    cmd: "claude plugin uninstall superpowers@test-marketplace"
  upstream_health:
    stability: beta
    last_check: "2026-01-01"
    last_known_good_version: main
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

const NPX_SKILL_MANIFEST_YAML = `
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: andrej-karpathy-skills
  display_name: Karpathy Skills
  description: test npx skill manifest
  upstream:
    source: andrej-karpathy-skills
    homepage: https://example.com
    repository: https://github.com/test/skills.git
    license: MIT
    notice: test notice
spec:
  type: cc-skill-pack
  component_type: command
  category: engineering
  install_type: skill
  install:
    method: npx-skill-installer
    cmd: "npx --yes skills@1.5.7 add test/andrej-karpathy-skills --copy --global"
    npm_version: "1.5.7"
    idempotent_check: "test -f ~/.claude/skills/andrej-karpathy-skills/SKILL.md"
  verify:
    cmd: "test -f ~/.claude/skills/andrej-karpathy-skills/SKILL.md"
    timeout_ms: 5000
  uninstall:
    cmd: "rm -rf ~/.claude/skills/andrej-karpathy-skills"
  upstream_health:
    stability: stable
    last_check: "2026-01-01"
    last_known_good_version: "1.5.7"
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

// Helper to set up readFile mock to return manifest YAML
function mockManifestFile(yaml: string): void {
  readFileMock.mockResolvedValueOnce(yaml as never)
}

describe('cli/uninstall — Phase 5.2 W1 T1.3 TDD (R10.3 D-01 7-method + D-02 ephemeral + v3.0.1 apply-immediate flip + D-06 --yes)', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    rmMock.mockReset()
    readFileMock.mockReset()
    writeFileMock.mockReset()
    confirmMock.mockReset()
    isCancelMock.mockReset()
    isCancelMock.mockReturnValue(false)
  })
  afterEach(() => vi.restoreAllMocks())

  // Cell 1: v3.0.1 UX flip — --yes alone (no --dry-run) is valid (apply-immediate).
  // Sister Cell flip: H1 gate now triggers only on --yes + --dry-run (mutually exclusive).
  it('cell 1 — v3.0.1 flip: --yes + --dry-run → exit 2 (mutually exclusive)', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    const { code, stderr } = await runCli(['uninstall', 'ctx7', '--yes', '--dry-run'])
    expect(code).toBe(2)
    expect(stderr).toContain('--yes is incompatible with --dry-run')
  })

  // Cell 2: manifest not found → exit 1
  it('cell 2 — manifest not found → exit 1 + stderr manifest not found', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { code, stderr } = await runCli(['uninstall', 'nonexistent', '--apply', '--yes'])
    expect(code).toBe(1)
    expect(stderr).toContain('not found')
  })

  // Cell 3: v3.0.1 UX flip — --dry-run opt-in → preview output + exit 2 aborted。
  // (Was: dry-run default (no --apply) → preview; flipped to --dry-run explicit only.)
  it('cell 3 — v3.0.1 flip: explicit --dry-run → preview output + exit 2', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    const { code, stdout } = await runCli(['uninstall', 'ctx7', '--dry-run'])
    expect(code).toBe(2)
    expect(stdout).toMatch(/\[dry-run\]/)
  })

  // Cell 4: --apply ephemeral (npx --yes cmd) → exit 0 + D-02 warn
  it('cell 4 — --apply ephemeral npm-cli (npx --yes) → exit 0 + ephemeral warn', async () => {
    mockManifestFile(EPHEMERAL_NPM_MANIFEST_YAML)
    confirmMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['uninstall', 'ctx7-ephemeral', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(stdout).toContain('ephemeral install')
  })

  // Cell 5: --apply git-clone → fs.rm called with correct path + exit 0
  it('cell 5 — --apply git-clone-with-setup → fs.rm called with clone target path + exit 0', async () => {
    mockManifestFile(GIT_CLONE_MANIFEST_YAML)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-skill', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(rmMock).toHaveBeenCalledWith(
      expect.stringContaining('.claude/skills/my-skill'),
      expect.objectContaining({ recursive: true, force: true }),
    )
  })

  // Cell 6: --apply npx-skill → fs.rm called with ~/.claude/skills/<name> + exit 0
  it('cell 6 — --apply npx-skill-installer → fs.rm ~/.claude/skills/<name> + exit 0', async () => {
    mockManifestFile(NPX_SKILL_MANIFEST_YAML)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'andrej-karpathy-skills', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(rmMock).toHaveBeenCalledWith(
      expect.stringContaining('andrej-karpathy-skills'),
      expect.objectContaining({ recursive: true, force: true }),
    )
  })

  // Cell 7: --apply mcp-stdio-add → runArgs(['mcp','remove',name]) called + exit 0
  it('cell 7 — --apply mcp-stdio-add → runArgs mcp remove <name> + exit 0', async () => {
    mockManifestFile(MCP_STDIO_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-mcp-server', '--apply', '--yes'])
    expect(code).toBe(0)
    // Verify spawn was called with mcp remove args
    expect(spawnMock).toHaveBeenCalled()
    const callArgs = spawnMock.mock.calls[0]
    // Win: cmd.exe + ['/c','claude','mcp','remove','my-mcp-server'] / Unix: claude + ['mcp','remove',...]
    const isWin = callArgs?.[0] === 'cmd.exe'
    if (isWin) {
      expect(callArgs?.[1]).toEqual(expect.arrayContaining(['mcp', 'remove', 'my-mcp-server']))
    } else {
      expect(callArgs?.[1]).toEqual(['mcp', 'remove', 'my-mcp-server'])
    }
  })

  // Cell 8: --apply mcp-http-add → same as stdio (mcp remove transport-agnostic) + exit 0
  it('cell 8 — --apply mcp-http-add → runArgs mcp remove <name> + exit 0', async () => {
    mockManifestFile(MCP_HTTP_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-http-mcp', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(spawnMock).toHaveBeenCalled()
  })

  // Cell 9: --apply cc-plugin → runArgs(['plugin','uninstall',pluginAtMkt]) + exit 0
  it('cell 9 — --apply cc-plugin-marketplace → runArgs plugin uninstall <slug@mkt> + exit 0', async () => {
    mockManifestFile(CC_PLUGIN_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'superpowers', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(spawnMock).toHaveBeenCalled()
    const callArgs = spawnMock.mock.calls[0]
    const isWin = callArgs?.[0] === 'cmd.exe'
    if (isWin) {
      expect(callArgs?.[1]).toEqual(
        expect.arrayContaining(['plugin', 'uninstall', 'superpowers@test-marketplace']),
      )
    } else {
      expect(callArgs?.[1]).toEqual(['plugin', 'uninstall', 'superpowers@test-marketplace'])
    }
  })

  // Cell 10: --apply --yes skips confirm prompt + exit 0
  it('cell 10 — --apply --yes skips interactive confirm prompt + exit 0', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    mockSpawnExit(0)
    const { code } = await runCli(['uninstall', 'ctx7', '--apply', '--yes'])
    expect(code).toBe(0)
    // confirm() should NOT have been called
    expect(confirmMock).not.toHaveBeenCalled()
  })

  // Cell 11: runArgs spawn error → exit 1
  it('cell 11 — runArgs spawn error (mcp-stdio) → exit 1 + stderr', async () => {
    mockManifestFile(MCP_STDIO_MANIFEST_YAML)
    mockSpawnExit(1, 'mcp remove failed: server not found')
    confirmMock.mockResolvedValue(true)
    const { code, stderr } = await runCli(['uninstall', 'my-mcp-server', '--apply', '--yes'])
    expect(code).toBe(1)
    expect(stderr).toContain('error')
  })

  // Cell 12: cc-hook-add inverse merge → settings.json hook filtered out + exit 0
  it('cell 12 — --apply cc-hook-add → settings.json hook filtered + exit 0', async () => {
    mockManifestFile(CC_HOOK_MANIFEST_YAML)
    const existingSettings = JSON.stringify({
      hooks: {
        PreToolUse: [
          { matcher: 'Read', command: 'my-hook-cmd' },
          { matcher: 'Write', command: 'other-cmd' },
        ],
      },
    })
    // readFile mock chain: manifest (tools/ path) → settings.json
    // Use mockImplementation to route by path rather than call-order fragility.
    readFileMock.mockImplementation(async (path: unknown) => {
      const p = String(path)
      if (p.includes('settings.json')) return existingSettings as never
      // Default: return manifest YAML for tools/ or skill-packs/ paths
      return CC_HOOK_MANIFEST_YAML as never
    })
    writeFileMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    const { code } = await runCli(['uninstall', 'my-hook', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(writeFileMock).toHaveBeenCalled()
    const written = writeFileMock.mock.calls[0]?.[1] as string
    const parsed = JSON.parse(written)
    expect(parsed.hooks?.PreToolUse).toHaveLength(1)
    expect(parsed.hooks?.PreToolUse?.[0]?.command).toBe('other-cmd')
  })

  // Cell 13: interactive confirm — user declines → exit 2
  it('cell 13 — --apply interactive confirm declined → exit 2', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    confirmMock.mockResolvedValue(false)
    const { code } = await runCli(['uninstall', 'ctx7', '--apply'])
    expect(code).toBe(2)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  // Cell 14: cross-OS guard — rm mock works with force+recursive options
  it('cell 14 — cross-OS: fs.rm called with { recursive: true, force: true } options', async () => {
    mockManifestFile(GIT_CLONE_MANIFEST_YAML)
    rmMock.mockResolvedValue(undefined)
    confirmMock.mockResolvedValue(true)
    await runCli(['uninstall', 'my-skill', '--apply', '--yes'])
    const rmCall = rmMock.mock.calls[0]
    expect(rmCall?.[1]).toMatchObject({ recursive: true, force: true })
  })

  // Cell 15 — v3.0.1 UX flip regression: no flag + interactive confirm yes → immediate uninstall
  it('cell 15 — v3.0.1 flip: no flag + interactive confirm → immediate uninstall + exit 0', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    mockSpawnExit(0)
    confirmMock.mockResolvedValue(true) // user confirms 'y'
    const { code } = await runCli(['uninstall', 'ctx7'])
    expect(code).toBe(0)
    expect(confirmMock).toHaveBeenCalledOnce() // interactive prompt protects destructive op
    expect(spawnMock).toHaveBeenCalled() // immediate execute after confirm
  })

  // Cell 16 — v3.0.1 backward-compat: legacy --apply flag still works as no-op alias
  it('cell 16 — v3.0.1 backward-compat: legacy --apply --yes still works (no-op alias)', async () => {
    mockManifestFile(NPM_CLI_MANIFEST_YAML)
    mockSpawnExit(0)
    const { code } = await runCli(['uninstall', 'ctx7', '--apply', '--yes'])
    expect(code).toBe(0)
    expect(spawnMock).toHaveBeenCalled() // legacy flag still triggers immediate execute
  })
})
