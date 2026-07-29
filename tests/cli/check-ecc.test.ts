// 4.32.22 — checkEcc helper PRIMARY coverage (doctor 20th check).
// Sister check-mattpocock-skills.test.ts tmpdir + HOME redirect + vi.resetModules
// per-cell isolation pattern (real fs, NOT global mock).
//
// ECC is multi-harness (manifests/optional/ecc.yaml, BONUS TIER — the 4.32.22
// interim base-promotion was withdrawn): CC = plugin marketplace (`ecc@ecc` in
// installed_plugins.json), codex = sync-flow clone kept at ~/.codex/.cache/ecc
// (harness_overrides.codex). The two sides are detected INDEPENDENTLY — never
// inferred from each other.
// Final semantics: ≥1 side installed → pass; both missing → pass-INFORMATIONAL
// (optional enhancement — installing ecc unlocks finer-grained orchestration
// at a ~20k+ tokens/session listing cost; sister check-codegraph "absence of
// an optional tool is not a health failure"); ecc + leftover chrome-devtools
// channel (official plugin or stdio mcpServers entry) → warn dual-install
// (remove the leftover, keep ecc).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origHome: string | undefined
let origUserprofile: string | undefined

beforeEach(() => {
  origHome = process.env.HOME
  origUserprofile = process.env.USERPROFILE
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-ecc-'))
  process.env.HOME = tmpRoot
  process.env.USERPROFILE = tmpRoot
  vi.resetModules()
})

afterEach(() => {
  if (origHome === undefined) delete process.env.HOME
  else process.env.HOME = origHome
  if (origUserprofile === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = origUserprofile
  rmSync(tmpRoot, { recursive: true, force: true })
})

/** ~/.claude/plugins/installed_plugins.json v2-schema writer (CC side). */
function writePluginsRegistry(pluginKeys: string[]): void {
  mkdirSync(join(tmpRoot, '.claude', 'plugins'), { recursive: true })
  const plugins: Record<string, unknown[]> = {}
  for (const k of pluginKeys) plugins[k] = [{ scope: 'user' }]
  writeFileSync(
    join(tmpRoot, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins }),
    'utf8',
  )
}

/** ~/.claude.json mcpServers writer (stdio leftover cell). */
function writeClaudeJsonMcp(servers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude.json'), JSON.stringify({ mcpServers: servers }), 'utf8')
}

/** codex platform marker: ~/.codex/config.toml. */
function writeCodexConfig(): void {
  mkdirSync(join(tmpRoot, '.codex'), { recursive: true })
  writeFileSync(join(tmpRoot, '.codex', 'config.toml'), 'model = "gpt-5"\n', 'utf8')
}

/** codex-side ECC sync clone marker: ~/.codex/.cache/ecc/.git. */
function writeCodexEccClone(): void {
  mkdirSync(join(tmpRoot, '.codex', '.cache', 'ecc', '.git'), { recursive: true })
}

describe('checkEcc — 4.32.22 per-harness ECC detect (bonus tier; chrome-devtools either/or)', () => {
  it('1. CC-only installed (ecc@ecc in installed_plugins.json) → pass + CC reported, codex independent', async () => {
    writePluginsRegistry(['ecc@ecc'])
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('pass')
    expect(r.name).toBe('ecc')
    expect(r.message).toMatch(/CC: installed/)
    // codex has no config.toml in this cell → not-present, NOT inferred installed
    expect(r.message).toMatch(/codex: not present/)
    // provider note: chrome-devtools connector comes with ECC
    expect(r.message).toMatch(/chrome-devtools connector provided by ECC/)
  })

  it('2. codex-only installed (config.toml + ~/.codex/.cache/ecc/.git) → pass + codex reported, CC not installed', async () => {
    // NOTE: no ~/.claude tree at all — CC side must independently read as missing.
    writeCodexConfig()
    writeCodexEccClone()
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/codex: installed/)
    expect(r.message).toMatch(/CC: not installed/)
  })

  it('3. both installed → pass + both sides reported', async () => {
    writePluginsRegistry(['ecc@ecc'])
    writeCodexConfig()
    writeCodexEccClone()
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/CC: installed/)
    expect(r.message).toMatch(/codex: installed/)
  })

  it('4. both missing → pass-informational (optional enhancement + token-cost note), NOT warn', async () => {
    mkdirSync(join(tmpRoot, '.claude'), { recursive: true })
    writeCodexConfig() // codex platform present but ECC not synced
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    // 4.32.22 final — ecc is BONUS TIER: absence is informational, never a
    // health gap (sister check-codegraph). Message sells the value + is honest
    // about the ECC-side token cost.
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/optional enhancement/)
    expect(r.message).toMatch(/finer-grained orchestration/)
    expect(r.message).toMatch(/tokens\/session/)
    expect(r.message).toMatch(/codex: not installed/)
    expect(r.message).toMatch(/harnessed install ecc/)
    expect(r.message).not.toMatch(/base component/)
  })

  it('5. CC ecc + official chrome-devtools plugin leftover → warn + uninstall-plugin remediation (keep ecc)', async () => {
    writePluginsRegistry(['ecc@ecc', 'chrome-devtools-mcp@claude-plugins-official'])
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/dual-install/)
    expect(r.fix).toMatch(/claude plugin uninstall chrome-devtools-mcp@claude-plugins-official/)
    expect(r.fix).toMatch(/keep ecc/)
  })

  it('6. CC ecc + chrome-devtools stdio entry leftover in ~/.claude.json → warn + mcp-remove remediation', async () => {
    writePluginsRegistry(['ecc@ecc'])
    writeClaudeJsonMcp({ 'chrome-devtools-mcp': { type: 'stdio', command: 'npx' } })
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/stdio entry/)
    expect(r.fix).toMatch(/claude mcp remove chrome-devtools-mcp/)
  })

  it('7. codex config.toml missing but stale clone cache exists → codex-not-present (not ecc-installed)', async () => {
    writePluginsRegistry(['ecc@ecc'])
    writeCodexEccClone() // orphan cache without a codex install
    const { checkEcc } = await import('../../src/cli/lib/check-ecc.js')
    const r = await checkEcc()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/codex: not present/)
    expect(r.message).not.toMatch(/codex: installed/)
  })
})
