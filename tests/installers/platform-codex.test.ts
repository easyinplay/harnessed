// Phase 28 W1 — Codex second-platform proof (v9.0 Phase C) unit tests.
//
// TDD red-first. Asserts the capability-aware PlatformDescriptor + the host-
// verified codexDescriptor paths + the detectPlatform precedence (ADR 0040:
// HARNESSED_PLATFORM → single host env → .platform pin → claude-first auto-probe
// → fallback; HARNESSED_ROOT_OVERRIDE only replaces stateRoot). The load-bearing invariant: the claude default stays byte-
// identical (no env / no pin + ~/.claude present → exact claudeDescriptor).
//
// Env isolation is CRITICAL here: a test that sets HARNESSED_PLATFORM must
// restore it, or it corrupts the claude-default regression proof in every other
// suite. vi.stubEnv + vi.unstubAllEnvs (afterEach) handle that; HARNESSED_ROOT_
// OVERRIDE is saved/restored explicitly so a leaked override cannot move stateRoot
// under the precedence assertions.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readInstalledPlugins } from '../../src/cli/lib/capabilityResolver.js'
import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import { isPluginRegistered } from '../../src/installers/lib/readClaudeConfig.js'
import {
  claudeDescriptor,
  codexDescriptor,
  detectPlatform,
  getPluginsRegistry,
  harnessSkillsDirs,
} from '../../src/platform/platform.js'

const OVERRIDE_KEY = 'HARNESSED_ROOT_OVERRIDE'
const PLATFORM_KEY = 'HARNESSED_PLATFORM'

describe('platform — codexDescriptor (Phase C / D1+D2)', () => {
  it('codexDescriptor(home) returns the host-verified codex paths', () => {
    const d = codexDescriptor('/home/x')

    expect(d.id).toBe('codex')
    expect(d.homeDir).toBe(join('/home/x', '.codex'))
    expect(d.stateRoot).toBe(join('/home/x', '.codex', 'harnessed'))
    // Phase 63 T2 — no JSON settings file on codex (config.toml is never a settings
    // target); MCP/plugin probes still read the TOML via mcpConfigPath.
    expect(d.settingsPath).toBeNull()
    expect(d.mcpConfigPath).toBe(join('/home/x', '.codex', 'config.toml'))
    // Phase 63 T2 — codex shells carry CODEX_SESSION_ID (measured, codex-cli 0.154).
    expect(d.sessionIdEnv).toBe('CODEX_SESSION_ID')
    // skillsDir is the SHARED ~/.agents/skills, NOT ~/.codex/skills
    expect(d.skillsDir).toBe(join('/home/x', '.agents', 'skills'))
    expect(d.skillsDir).not.toBe(join('/home/x', '.codex', 'skills'))
    // commands named "prompts"
    expect(d.commandsDir).toBe(join('/home/x', '.codex', 'prompts'))
    // capability-absent: no plugin registry, no env-key write
    expect(d.pluginsRegistry).toBeNull()
    expect(d.supportsEnvKeyWrite).toBe(false)
  })

  it('codexDescriptor() with no arg bases on homedir()', () => {
    expect(codexDescriptor()).toEqual(codexDescriptor(homedir()))
  })

  it('claude descriptor stays unchanged: supportsEnvKeyWrite true + pluginsRegistry is a string', () => {
    const d = claudeDescriptor('/home/x')
    expect(d.supportsEnvKeyWrite).toBe(true)
    expect(typeof d.pluginsRegistry).toBe('string')
    expect(d.pluginsRegistry).toBe(join('/home/x', '.claude', 'plugins', 'installed_plugins.json'))
  })
})

describe('platform — detectPlatform precedence (Phase C / D3)', () => {
  let savedOverride: string | undefined
  let tmpHome: string

  beforeEach(() => {
    savedOverride = process.env[OVERRIDE_KEY]
    delete process.env[OVERRIDE_KEY]
    vi.unstubAllEnvs()
    // per-test tmp home so the .platform pin + auto-probe touch isolated dirs
    tmpHome = mkdtempSync(join(tmpdir(), 'harnessed-plat-'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (savedOverride === undefined) delete process.env[OVERRIDE_KEY]
    else process.env[OVERRIDE_KEY] = savedOverride
    rmSync(tmpHome, { recursive: true, force: true })
  })

  // ADR 0040 — the override replaces ONLY stateRoot; it no longer forces claude.
  it('HARNESSED_ROOT_OVERRIDE + HARNESSED_PLATFORM=codex → codex descriptor, stateRoot=override', () => {
    process.env[OVERRIDE_KEY] = '/tmp/override-root'
    vi.stubEnv(PLATFORM_KEY, 'codex')
    const d = detectPlatform(tmpHome)
    expect(d).toEqual({ ...codexDescriptor(tmpHome), stateRoot: '/tmp/override-root' })
  })

  it("HARNESSED_PLATFORM='codex' (no override) → codex descriptor", () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(codexDescriptor(tmpHome))
  })

  it("HARNESSED_PLATFORM='claude' → claude descriptor", () => {
    vi.stubEnv(PLATFORM_KEY, 'claude')
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(claudeDescriptor(tmpHome))
  })

  it('HARNESSED_PLATFORM unknown value → ignored, falls through (no claude/codex home → fallback claude)', () => {
    vi.stubEnv(PLATFORM_KEY, 'bogus')
    const d = detectPlatform(tmpHome)
    // no claude/codex home dir created → fallback is claude
    expect(d.id).toBe('claude')
  })

  it('.platform pin at claude stateRoot containing "codex" → codex', () => {
    // pin lives in the well-known incumbent (claude) stateRoot
    const pinDir = claudeDescriptor(tmpHome).stateRoot
    mkdirSync(pinDir, { recursive: true })
    writeFileSync(join(pinDir, '.platform'), 'codex\n', 'utf8')
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(codexDescriptor(tmpHome))
  })

  it('.platform pin "claude" → claude (explicit pin to incumbent)', () => {
    const pinDir = claudeDescriptor(tmpHome).stateRoot
    mkdirSync(pinDir, { recursive: true })
    writeFileSync(join(pinDir, '.platform'), 'claude', 'utf8')
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(claudeDescriptor(tmpHome))
  })

  it('no env/pin + claude home exists → claude (INCUMBENT wins, byte-identical)', () => {
    mkdirSync(join(tmpHome, '.claude'), { recursive: true })
    mkdirSync(join(tmpHome, '.codex'), { recursive: true }) // both present
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(claudeDescriptor(tmpHome))
  })

  it('no env/pin + claude home ABSENT + codex home exists → codex', () => {
    mkdirSync(join(tmpHome, '.codex'), { recursive: true })
    expect(existsSync(join(tmpHome, '.claude'))).toBe(false)
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(codexDescriptor(tmpHome))
  })

  it('no env/pin + neither home exists → fallback claude', () => {
    const d = detectPlatform(tmpHome)
    expect(d).toEqual(claudeDescriptor(tmpHome))
  })

  it('getPluginsRegistry() under HARNESSED_PLATFORM=codex → null', () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    expect(getPluginsRegistry(tmpHome)).toBeNull()
  })
})

// v16.0 Phase 63 T1 — ADR 0040 precedence: explicit > single host env > pin
// (codex stateRoot first) > directory probe > claude. The host env sniff is what
// makes a dual-host machine resolve per session instead of per machine.
describe('platform — ADR 0040 host precedence (Phase 63)', () => {
  let tmpHome: string

  function pinAt(host: 'claude' | 'codex', id: string): void {
    const dir = join(tmpHome, host === 'claude' ? '.claude' : '.codex', 'harnessed')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, '.platform'), `${id}\n`, 'utf8')
  }

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'harnessed-prec-'))
    for (const k of [OVERRIDE_KEY, PLATFORM_KEY, 'CLAUDE_CODE_SESSION_ID', 'CODEX_SESSION_ID']) {
      vi.stubEnv(k, undefined)
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('HARNESSED_PLATFORM beats a host env', () => {
    vi.stubEnv(PLATFORM_KEY, 'claude')
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(detectPlatform(tmpHome)).toEqual(claudeDescriptor(tmpHome))
  })

  it('CODEX_SESSION_ID alone → codex, even with ~/.claude present and a claude pin', () => {
    mkdirSync(join(tmpHome, '.claude'), { recursive: true })
    pinAt('claude', 'claude')
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(detectPlatform(tmpHome)).toEqual(codexDescriptor(tmpHome))
  })

  it('CLAUDE_CODE_SESSION_ID alone → claude, even with a codex pin', () => {
    pinAt('codex', 'codex')
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'sess-1')
    expect(detectPlatform(tmpHome)).toEqual(claudeDescriptor(tmpHome))
  })

  it('empty host env value is not a signal', () => {
    mkdirSync(join(tmpHome, '.claude'), { recursive: true })
    vi.stubEnv('CODEX_SESSION_ID', '  ')
    expect(detectPlatform(tmpHome)).toEqual(claudeDescriptor(tmpHome))
  })

  it('both host envs (nested launch) → ambiguous, falls through to the pin', () => {
    mkdirSync(join(tmpHome, '.claude'), { recursive: true })
    pinAt('codex', 'codex')
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'a')
    vi.stubEnv('CODEX_SESSION_ID', 'b')
    expect(detectPlatform(tmpHome)).toEqual(codexDescriptor(tmpHome))
  })

  it('both host envs, no pin → directory probe (~/.claude first)', () => {
    mkdirSync(join(tmpHome, '.claude'), { recursive: true })
    mkdirSync(join(tmpHome, '.codex'), { recursive: true })
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'a')
    vi.stubEnv('CODEX_SESSION_ID', 'b')
    expect(detectPlatform(tmpHome)).toEqual(claudeDescriptor(tmpHome))
  })

  it('pin at codex stateRoot is read before the claude stateRoot pin', () => {
    pinAt('codex', 'codex')
    pinAt('claude', 'claude')
    expect(detectPlatform(tmpHome)).toEqual(codexDescriptor(tmpHome))
  })

  it('garbage codex pin falls through to the claude pin', () => {
    pinAt('codex', 'vim')
    pinAt('claude', 'claude')
    mkdirSync(join(tmpHome, '.codex'), { recursive: true })
    expect(detectPlatform(tmpHome)).toEqual(claudeDescriptor(tmpHome))
  })

  it('legacy codex pin at the claude stateRoot is still honoured', () => {
    pinAt('claude', 'codex')
    expect(detectPlatform(tmpHome)).toEqual(codexDescriptor(tmpHome))
  })

  it('HARNESSED_ROOT_OVERRIDE only replaces stateRoot: CODEX_SESSION_ID still → codex', () => {
    vi.stubEnv(OVERRIDE_KEY, join(tmpHome, 'ovr'))
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(detectPlatform(tmpHome)).toEqual({
      ...codexDescriptor(tmpHome),
      stateRoot: join(tmpHome, 'ovr'),
    })
  })

  it('HARNESSED_ROOT_OVERRIDE does not relocate the pin lookup', () => {
    const ovr = join(tmpHome, 'ovr')
    mkdirSync(ovr, { recursive: true })
    writeFileSync(join(ovr, '.platform'), 'codex', 'utf8')
    vi.stubEnv(OVERRIDE_KEY, ovr)
    expect(detectPlatform(tmpHome).id).toBe('claude')
  })
})

describe('platform — harnessSkillsDirs (Phase C / D6)', () => {
  // v4.14.0 — third entry ~/.codex/skills: codex's own skills dir (distinct from
  // the shared ~/.agents/skills descriptor skillsDir); upstream codex installers
  // write there (e.g. @opengsd/gsd-core --codex). Probe-only widening.
  it('returns deduped [claude.skillsDir, codex.skillsDir, codex homeDir skills]', () => {
    const dirs = harnessSkillsDirs('/home/x')
    expect(dirs).toEqual([
      join('/home/x', '.claude', 'skills'),
      join('/home/x', '.agents', 'skills'),
      join('/home/x', '.codex', 'skills'),
    ])
  })
})

describe('platform — capability-aware consumers under codex (Phase C / D4)', () => {
  let savedOverride: string | undefined

  beforeEach(() => {
    savedOverride = process.env[OVERRIDE_KEY]
    delete process.env[OVERRIDE_KEY]
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (savedOverride === undefined) delete process.env[OVERRIDE_KEY]
    else process.env[OVERRIDE_KEY] = savedOverride
  })

  it('readInstalledPlugins() tolerates null registry → empty Set (no throw)', () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    // codex pluginsRegistry is null → resolver returns [] without reading fs.
    expect(readInstalledPlugins().size).toBe(0)
  })

  it('isPluginRegistered() tolerates null registry → false (no throw)', async () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    // codex: no plugin registry, and config.toml is not JSON — must not throw,
    // returns false (no plugin sources to consult).
    await expect(isPluginRegistered('gstack')).resolves.toBe(false)
  })

  it('enableAgentTeamsInSettings() no-op + inform when supportsEnvKeyWrite=false (codex)', async () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    const r = await enableAgentTeamsInSettings()
    // gated off BEFORE any fs read: maps to the existing union's informative
    // 'warn' variant with the explicit capability-absent message, NOT a write
    // and NOT a TOML-parse error (the gate short-circuits before touching fs).
    expect(r.status).toBe('warn')
    if (r.status === 'warn') {
      expect(r.message).toMatch(/does not support env-key/i)
      expect(r.message).toContain('codex')
      expect(r.message).not.toMatch(/malformed|JSON/i)
    }
  })

  it('enableUserLangInSettings() no-op + inform when supportsEnvKeyWrite=false (codex)', async () => {
    vi.stubEnv(PLATFORM_KEY, 'codex')
    const r = await enableUserLangInSettings()
    expect(r.status).toBe('warn')
    if (r.status === 'warn') {
      expect(r.message).toMatch(/does not support env-key/i)
      expect(r.message).toContain('codex')
      expect(r.message).not.toMatch(/malformed|JSON/i)
    }
  })
})
