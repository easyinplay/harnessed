// Phase 28 W1 — Codex second-platform proof (v9.0 Phase C) unit tests.
//
// TDD red-first. Asserts the capability-aware PlatformDescriptor + the host-
// verified codexDescriptor paths + the expanded detectPlatform precedence
// (override-first → HARNESSED_PLATFORM → .platform pin → claude-first auto-probe
// → fallback). The load-bearing invariant: the claude default stays byte-
// identical (no env / no pin + ~/.claude present → exact claudeDescriptor).
//
// Env isolation is CRITICAL here: a test that sets HARNESSED_PLATFORM must
// restore it, or it corrupts the claude-default regression proof in every other
// suite. vi.stubEnv + vi.unstubAllEnvs (afterEach) handle that; HARNESSED_ROOT_
// OVERRIDE is saved/restored explicitly because it must NOT be set during the
// precedence tests (it is the FIRST check and would short-circuit them).

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readInstalledPlugins } from '../../src/cli/lib/capabilityResolver.js'
import { enableAgentTeamsInSettings } from '../../src/cli/lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from '../../src/cli/lib/enableUserLangInSettings.js'
import {
  claudeDescriptor,
  codexDescriptor,
  detectPlatform,
  getPluginsRegistry,
  harnessSkillsDirs,
} from '../../src/installers/lib/platform.js'
import { isPluginRegistered } from '../../src/installers/lib/readClaudeConfig.js'

const OVERRIDE_KEY = 'HARNESSED_ROOT_OVERRIDE'
const PLATFORM_KEY = 'HARNESSED_PLATFORM'

describe('platform — codexDescriptor (Phase C / D1+D2)', () => {
  it('codexDescriptor(home) returns the host-verified codex paths', () => {
    const d = codexDescriptor('/home/x')

    expect(d.id).toBe('codex')
    expect(d.homeDir).toBe(join('/home/x', '.codex'))
    expect(d.stateRoot).toBe(join('/home/x', '.codex', 'harnessed'))
    // settings === mcp, both the same TOML config file
    expect(d.settingsPath).toBe(join('/home/x', '.codex', 'config.toml'))
    expect(d.mcpConfigPath).toBe(join('/home/x', '.codex', 'config.toml'))
    expect(d.settingsPath).toBe(d.mcpConfigPath)
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

  it('HARNESSED_ROOT_OVERRIDE wins FIRST → claude id + stateRoot=override (unchanged)', () => {
    process.env[OVERRIDE_KEY] = '/tmp/override-root'
    vi.stubEnv(PLATFORM_KEY, 'codex') // even with codex env, override is FIRST
    const d = detectPlatform(tmpHome)
    expect(d.id).toBe('claude')
    expect(d.stateRoot).toBe('/tmp/override-root')
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

describe('platform — harnessSkillsDirs (Phase C / D6)', () => {
  it('returns deduped [claude.skillsDir, codex.skillsDir]', () => {
    const dirs = harnessSkillsDirs('/home/x')
    expect(dirs).toEqual([
      join('/home/x', '.claude', 'skills'),
      join('/home/x', '.agents', 'skills'),
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
