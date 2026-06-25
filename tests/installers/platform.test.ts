// Phase 26 W1 T1 — PlatformDescriptor seam (v9.0 Phase A) unit tests.
//
// TDD red-first. Asserts the descriptor shape + detectPlatform precedence +
// getHarnessedRoot routing. Zero behavior change is the invariant: tests 4/5
// pin getHarnessedRoot byte-identical output (default + HARNESSED_ROOT_OVERRIDE).
//
// Env isolation: HARNESSED_ROOT_OVERRIDE is saved/restored per-test so toggling
// the override does not leak into other suites (the override is the supported
// e2e test-isolation hook — see harnessedRoot.ts doc-comment).

import { homedir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getHarnessedRoot } from '../../src/installers/lib/harnessedRoot.js'
import {
  claudeDescriptor,
  codexDescriptor,
  detectPlatform,
  getCommandsDir,
  getMcpConfigPath,
  getPluginsRegistry,
  getSettingsPath,
  getSkillsDir,
} from '../../src/installers/lib/platform.js'

const ENV_KEY = 'HARNESSED_ROOT_OVERRIDE'

describe('platform — PlatformDescriptor seam (Phase A)', () => {
  let savedOverride: string | undefined

  beforeEach(() => {
    savedOverride = process.env[ENV_KEY]
    delete process.env[ENV_KEY]
  })

  afterEach(() => {
    if (savedOverride === undefined) delete process.env[ENV_KEY]
    else process.env[ENV_KEY] = savedOverride
  })

  it('claudeDescriptor() returns the claude paths (mcpConfigPath is a homedir sibling)', () => {
    const home = join(homedir(), '.claude')
    const d = claudeDescriptor()

    expect(d.id).toBe('claude')
    expect(d.homeDir).toBe(home)
    expect(d.homeDir.endsWith('.claude')).toBe(true)
    expect(d.stateRoot).toBe(join(home, 'harnessed'))
    expect(d.settingsPath).toBe(join(home, 'settings.json'))
    expect(d.skillsDir).toBe(join(home, 'skills'))
    expect(d.commandsDir).toBe(join(home, 'commands'))
    expect(d.pluginsRegistry).toBe(join(home, 'plugins', 'installed_plugins.json'))
    // mcpConfigPath is ~/.claude.json — a SIBLING of homeDir, NOT under it.
    expect(d.mcpConfigPath).toBe(join(homedir(), '.claude.json'))
    expect(d.mcpConfigPath.startsWith(`${home}${'/'}`)).toBe(false)
  })

  it('detectPlatform() with no override deep-equals claudeDescriptor()', () => {
    expect(detectPlatform()).toEqual(claudeDescriptor())
  })

  it('detectPlatform() with HARNESSED_ROOT_OVERRIDE replaces only stateRoot', () => {
    process.env[ENV_KEY] = '/tmp/x'
    const d = detectPlatform()
    const base = claudeDescriptor()

    expect(d.stateRoot).toBe('/tmp/x')
    // every other field stays claude-default (only the harnessed root is overridden today).
    expect(d.id).toBe(base.id)
    expect(d.homeDir).toBe(base.homeDir)
    expect(d.settingsPath).toBe(base.settingsPath)
    expect(d.skillsDir).toBe(base.skillsDir)
    expect(d.commandsDir).toBe(base.commandsDir)
    expect(d.pluginsRegistry).toBe(base.pluginsRegistry)
    expect(d.mcpConfigPath).toBe(base.mcpConfigPath)
  })

  it('getHarnessedRoot() (default) is byte-identical to detectPlatform().stateRoot', () => {
    const expected = join(homedir(), '.claude', 'harnessed')
    expect(getHarnessedRoot()).toBe(expected)
    expect(getHarnessedRoot()).toBe(detectPlatform().stateRoot)
  })

  it('getHarnessedRoot() (override set) returns the override verbatim', () => {
    process.env[ENV_KEY] = '/tmp/x'
    expect(getHarnessedRoot()).toBe('/tmp/x')
    expect(getHarnessedRoot()).toBe(detectPlatform().stateRoot)
  })
})

// Phase 35 T35.1 — sessionIdEnv on PlatformDescriptor (cross-harness session seam).
// TDD red-first. The session-id env name is platform-specific (claude has one,
// codex does not yet) → it belongs on the descriptor, not hardcoded in activeKey.
describe('platform — sessionIdEnv (Phase 35)', () => {
  let savedOverride: string | undefined
  beforeEach(() => {
    savedOverride = process.env[ENV_KEY]
    delete process.env[ENV_KEY]
  })
  afterEach(() => {
    if (savedOverride === undefined) delete process.env[ENV_KEY]
    else process.env[ENV_KEY] = savedOverride
  })

  it('claudeDescriptor() exposes the CC session-id env name', () => {
    expect(claudeDescriptor().sessionIdEnv).toBe('CLAUDE_CODE_SESSION_ID')
  })

  it('codexDescriptor() has no session-id env (null → single-session fallback)', () => {
    expect(codexDescriptor().sessionIdEnv).toBeNull()
  })

  it('detectPlatform() default (claude) exposes the claude session-id env name', () => {
    expect(detectPlatform().sessionIdEnv).toBe('CLAUDE_CODE_SESSION_ID')
  })

  it('claudeDescriptor(home) keeps sessionIdEnv home-independent', () => {
    expect(claudeDescriptor('/home/x').sessionIdEnv).toBe('CLAUDE_CODE_SESSION_ID')
  })
})

// Phase 27 W1 T1 — optional home base (D2) + 5 config resolvers (D1).
//
// TDD red-first. The descriptor gains an optional `home` base param (additive,
// default homedir()) so capabilityResolver's homedirOverride can thread through
// WITHOUT re-hardcoding `.claude`. Resolvers are thin `detectPlatform(home).<field>`
// accessors. Zero behavior change: no-arg callers (Phase 26) byte-identical.
describe('platform — optional home base + config resolvers (Phase B)', () => {
  let savedOverride: string | undefined

  beforeEach(() => {
    savedOverride = process.env[ENV_KEY]
    delete process.env[ENV_KEY]
  })

  afterEach(() => {
    if (savedOverride === undefined) delete process.env[ENV_KEY]
    else process.env[ENV_KEY] = savedOverride
  })

  it('claudeDescriptor(home) bases every field on the supplied home; no-arg unchanged', () => {
    const d = claudeDescriptor('/home/x')
    expect(d.homeDir).toBe(join('/home/x', '.claude'))
    expect(d.stateRoot).toBe(join('/home/x', '.claude', 'harnessed'))
    expect(d.settingsPath).toBe(join('/home/x', '.claude', 'settings.json'))
    expect(d.skillsDir).toBe(join('/home/x', '.claude', 'skills'))
    expect(d.commandsDir).toBe(join('/home/x', '.claude', 'commands'))
    expect(d.pluginsRegistry).toBe(join('/home/x', '.claude', 'plugins', 'installed_plugins.json'))
    // mcpConfigPath is a sibling of homeDir, now based on the supplied home.
    expect(d.mcpConfigPath).toBe(join('/home/x', '.claude.json'))
    // no-arg default still resolves to homedir()
    expect(claudeDescriptor()).toEqual(claudeDescriptor(homedir()))
  })

  it('detectPlatform(home) honors the optional base; no-arg unchanged', () => {
    expect(detectPlatform('/home/x').skillsDir).toBe(join('/home/x', '.claude', 'skills'))
    expect(detectPlatform('/home/x')).toEqual(claudeDescriptor('/home/x'))
    expect(detectPlatform()).toEqual(claudeDescriptor())
  })

  it('5 resolvers each equal the corresponding descriptor field (default home)', () => {
    const base = detectPlatform()
    expect(getSettingsPath()).toBe(base.settingsPath)
    expect(getSkillsDir()).toBe(base.skillsDir)
    expect(getCommandsDir()).toBe(base.commandsDir)
    expect(getPluginsRegistry()).toBe(base.pluginsRegistry)
    expect(getMcpConfigPath()).toBe(base.mcpConfigPath)
  })

  it('resolvers thread the optional home through to detectPlatform(home)', () => {
    expect(getSettingsPath('/home/x')).toBe(detectPlatform('/home/x').settingsPath)
    expect(getSkillsDir('/home/x')).toBe(join('/home/x', '.claude', 'skills'))
    expect(getCommandsDir('/home/x')).toBe(join('/home/x', '.claude', 'commands'))
    expect(getPluginsRegistry('/home/x')).toBe(
      join('/home/x', '.claude', 'plugins', 'installed_plugins.json'),
    )
    expect(getMcpConfigPath('/home/x')).toBe(join('/home/x', '.claude.json'))
  })

  it('HARNESSED_ROOT_OVERRIDE affects only stateRoot, NOT the config resolvers (orthogonal)', () => {
    const before = {
      settings: getSettingsPath(),
      skills: getSkillsDir(),
      commands: getCommandsDir(),
      plugins: getPluginsRegistry(),
      mcp: getMcpConfigPath(),
    }
    process.env[ENV_KEY] = '/tmp/override-root'
    expect(detectPlatform().stateRoot).toBe('/tmp/override-root')
    // resolvers stay claude-default — the override is stateRoot-only.
    expect(getSettingsPath()).toBe(before.settings)
    expect(getSkillsDir()).toBe(before.skills)
    expect(getCommandsDir()).toBe(before.commands)
    expect(getPluginsRegistry()).toBe(before.plugins)
    expect(getMcpConfigPath()).toBe(before.mcp)
  })
})
