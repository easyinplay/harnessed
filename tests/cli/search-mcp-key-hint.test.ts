import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchMcpKeyHintLines } from '../../src/cli/lib/search-mcp-keys.js'
import { setLocale } from '../../src/i18n/index.js'
import { isCodexMcpServerRegistered } from '../../src/installers/lib/codexMcpServers.js'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../../src/installers/lib/codexMcpServers.js', () => ({
  isCodexMcpServerRegistered: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('EXA_API_KEY', '')
  vi.stubEnv('TAVILY_API_KEY', '')
  vi.mocked(isCodexMcpServerRegistered).mockResolvedValue(true)
  vi.mocked(readFile).mockImplementation(async (path) => {
    if (String(path).endsWith('.claude.json')) {
      return JSON.stringify({ mcpServers: { 'tavily-mcp': {}, 'exa-mcp': {} } })
    }
    return '{}'
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  setLocale('en')
})

describe('setup search-key hint follows the host without reading Codex config', () => {
  it.each(['en', 'zh-Hans'])('Codex %s: missing keys only point to shell env', async (locale) => {
    setLocale(locale)
    const lines = await searchMcpKeyHintLines()
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(
      locale === 'en'
        ? '\n⚠ Search MCP API keys not visible to this check: Codex checks only process env. Verify the tools first; if authentication fails, set the key in your shell environment.'
        : '\n⚠ 本次检查未观察到搜索类 MCP API key: Codex 仅检查 process env。请先验证工具;若出现认证失败,再在 shell 环境中设置 key。',
    )
    expect(lines.join('\n')).not.toMatch(/will fail|will.*fail|查询会失败|未配置 key 前查询会失败/)
    for (const [index, server, envVar] of [
      [1, 'tavily-mcp', 'TAVILY_API_KEY'],
      [2, 'exa-mcp', 'EXA_API_KEY'],
    ] as const) {
      expect(lines[index]).toBe(
        locale === 'en'
          ? `  ${server}: set ${envVar} in your shell environment (export ${envVar}="<your-key>")`
          : `  ${server}: 请在 shell 环境中设置 ${envVar} (export ${envVar}="<your-key>")`,
      )
    }
    expect(lines.join('\n')).not.toMatch(
      /\.claude|settings\.json|config\.toml|setup\.search_key_hint/,
    )
    expect(readFile).not.toHaveBeenCalled()
  })

  it.each(['en', 'zh-Hans'])('Claude %s: legacy hint remains byte-identical', async (locale) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    setLocale(locale)
    const lines = await searchMcpKeyHintLines()
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(
      locale === 'en'
        ? '\n⚠ Search MCP API keys missing — the server(s) below are installed but will fail at query time until the key is configured:'
        : '\n⚠ 搜索类 MCP 缺少 API key — 下列 server 已安装，但未配置 key 前查询会失败:',
    )
    expect(lines[2]).toBe(
      locale === 'en'
        ? '  exa-mcp: set EXA_API_KEY — add it to the ~/.claude/settings.json "env" block (e.g. {"env": {"EXA_API_KEY": "<your-key>"}}) or export EXA_API_KEY in your shell'
        : '  exa-mcp: 需配置 EXA_API_KEY — 写入 ~/.claude/settings.json 的 "env" 块（如 {"env": {"EXA_API_KEY": "<your-key>"}}）或在 shell 中 export EXA_API_KEY',
    )
    expect(isCodexMcpServerRegistered).not.toHaveBeenCalled()
  })

  it('Codex: configured env keys suppress the hint without reading any file', async () => {
    vi.stubEnv('EXA_API_KEY', 'fixture-exa')
    vi.stubEnv('TAVILY_API_KEY', 'fixture-tavily')
    expect(await searchMcpKeyHintLines()).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it('Codex: unregistered servers do not produce missing-key hints', async () => {
    vi.mocked(isCodexMcpServerRegistered).mockResolvedValue(false)
    expect(await searchMcpKeyHintLines()).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })
})
