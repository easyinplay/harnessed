// v4.14.0 T2 — isMcpServerRegistered codex 分支: ~/.codex/config.toml
// `[mcp_servers.<name>]` header 存在性探测(行首正则,非完整 TOML parser —
// findings.md 锁定决策)。claude 分支回归:仍走 JSON mcpServers 读取。
//
// detectPlatform 平台切换经 HARNESSED_PLATFORM env(precedence 2);
// HARNESSED_ROOT_OVERRIDE stub 为 ''(precedence 1 显式短路条件是非空串)。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

import { readFile } from 'node:fs/promises'
import { isMcpServerRegistered } from '../../src/installers/lib/readClaudeConfig.js'

const readFileMock = vi.mocked(readFile)

const TOML_FIXTURE = [
  '[features]',
  'js_repl = false',
  '',
  '[mcp_servers.tavily-mcp]',
  'args = ["/c", "npx", "--yes", "tavily-mcp@0.2.0"]',
  'command = "cmd"',
  '',
  '[mcp_servers."dotted.name"]',
  'url = "https://example.com/mcp"',
  '',
  '[mcp_servers.node_repl.env]',
  'FOO = "bar"',
].join('\n')

describe('isMcpServerRegistered — codex TOML header probe', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    readFileMock.mockReset()
    readFileMock.mockResolvedValue(TOML_FIXTURE)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('bare table header present → true (+ reads config.toml not .claude.json)', async () => {
    await expect(isMcpServerRegistered('tavily-mcp')).resolves.toBe(true)
    const readPaths = readFileMock.mock.calls.map((c) => String(c[0]))
    expect(readPaths.some((p) => p.replace(/\\/g, '/').endsWith('.codex/config.toml'))).toBe(true)
    expect(readPaths.some((p) => p.endsWith('.claude.json'))).toBe(false)
  })

  it('quoted (dotted) table header present → true', async () => {
    await expect(isMcpServerRegistered('dotted.name')).resolves.toBe(true)
  })

  it('only sub-table header ([mcp_servers.<name>.env]) present → true', async () => {
    await expect(isMcpServerRegistered('node_repl')).resolves.toBe(true)
  })

  it('server absent → false', async () => {
    await expect(isMcpServerRegistered('chrome-devtools-mcp')).resolves.toBe(false)
  })

  it('name is regex-escaped (no false positive via dot wildcard)', async () => {
    // 'tavily-mcp' exists; 'tavilyXmcp' must NOT match through an unescaped '.'
    await expect(isMcpServerRegistered('tavily.mcp')).resolves.toBe(false)
  })

  it('config.toml ENOENT → false (graceful, first-install)', async () => {
    readFileMock.mockReset()
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException
    enoent.code = 'ENOENT'
    readFileMock.mockRejectedValue(enoent)
    await expect(isMcpServerRegistered('tavily-mcp')).resolves.toBe(false)
  })
})

describe('isMcpServerRegistered — claude regression (JSON path unchanged)', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    readFileMock.mockReset()
    readFileMock.mockResolvedValue(JSON.stringify({ mcpServers: { 'tavily-mcp': {} } }))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads ~/.claude.json mcpServers map', async () => {
    await expect(isMcpServerRegistered('tavily-mcp')).resolves.toBe(true)
    await expect(isMcpServerRegistered('other')).resolves.toBe(false)
    const readPaths = readFileMock.mock.calls.map((c) => String(c[0]))
    expect(readPaths.every((p) => p.endsWith('.claude.json'))).toBe(true)
  })
})
