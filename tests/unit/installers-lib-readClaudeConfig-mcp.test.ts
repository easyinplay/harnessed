// isMcpServerRegistered — claude 分支回归:仍走 `~/.claude.json` 的 JSON mcpServers 读取。
//
// 原为 v4.14.0 T2 的 codex config.toml header 探测测试(文件旧名 `-toml`)。v16.0 收口后
// codex 分支改问 `codex mcp list --json`,那半边整块删除并搬到
// `tests/installers/codexMcpServers.test.ts`(含「永不打开 config.toml」的断言)。
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
