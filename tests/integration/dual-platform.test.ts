// Phase 28 W1 — dual-platform integration (v9.0 Phase C / Acceptance 5).
//
// The cross-platform proof in one place: under a single tmp HOME, a claude-pinned
// resolve vs a codex-pinned resolve return the correct value for EVERY descriptor
// field (skills / commands / state / settings / mcp / plugins). This is the
// concrete evidence that the Phase 26/27 seam admits a real, divergent second
// harness without touching call sites.
//
// Env isolation: HARNESSED_PLATFORM / HARNESSED_ROOT_OVERRIDE are saved/restored
// so this never leaks into the claude-default regression proof.

import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  claudeDescriptor,
  codexDescriptor,
  detectPlatform,
  harnessSkillsDirs,
} from '../../src/installers/lib/platform.js'

const PLATFORM_KEY = 'HARNESSED_PLATFORM'
const OVERRIDE_KEY = 'HARNESSED_ROOT_OVERRIDE'
const HOME = '/home/dual'

describe('dual-platform resolution (Phase C / Acceptance 5)', () => {
  let savedPlatform: string | undefined
  let savedOverride: string | undefined

  beforeEach(() => {
    savedPlatform = process.env[PLATFORM_KEY]
    savedOverride = process.env[OVERRIDE_KEY]
    delete process.env[PLATFORM_KEY]
    delete process.env[OVERRIDE_KEY]
  })

  afterEach(() => {
    if (savedPlatform === undefined) delete process.env[PLATFORM_KEY]
    else process.env[PLATFORM_KEY] = savedPlatform
    if (savedOverride === undefined) delete process.env[OVERRIDE_KEY]
    else process.env[OVERRIDE_KEY] = savedOverride
  })

  it('claude-pinned (HARNESSED_PLATFORM=claude) resolves every field to claude paths', () => {
    process.env[PLATFORM_KEY] = 'claude'
    const d = detectPlatform(HOME)
    expect(d).toEqual(claudeDescriptor(HOME))
    expect(d.skillsDir).toBe(join(HOME, '.claude', 'skills'))
    expect(d.commandsDir).toBe(join(HOME, '.claude', 'commands'))
    expect(d.stateRoot).toBe(join(HOME, '.claude', 'harnessed'))
    expect(d.settingsPath).toBe(join(HOME, '.claude', 'settings.json'))
    expect(d.mcpConfigPath).toBe(join(HOME, '.claude.json'))
    expect(d.pluginsRegistry).toBe(join(HOME, '.claude', 'plugins', 'installed_plugins.json'))
    expect(d.supportsEnvKeyWrite).toBe(true)
  })

  it('codex-pinned (HARNESSED_PLATFORM=codex) resolves every field to codex paths', () => {
    process.env[PLATFORM_KEY] = 'codex'
    const d = detectPlatform(HOME)
    expect(d).toEqual(codexDescriptor(HOME))
    expect(d.skillsDir).toBe(join(HOME, '.agents', 'skills')) // shared, not .codex/skills
    expect(d.commandsDir).toBe(join(HOME, '.codex', 'prompts'))
    expect(d.stateRoot).toBe(join(HOME, '.codex', 'harnessed'))
    expect(d.settingsPath).toBe(join(HOME, '.codex', 'config.toml'))
    expect(d.mcpConfigPath).toBe(join(HOME, '.codex', 'config.toml'))
    expect(d.pluginsRegistry).toBeNull()
    expect(d.supportsEnvKeyWrite).toBe(false)
  })

  it('claude and codex diverge on exactly the load-bearing fields', () => {
    const c = claudeDescriptor(HOME)
    const x = codexDescriptor(HOME)
    // skills: shared dir for codex, under-home for claude
    expect(c.skillsDir).not.toBe(x.skillsDir)
    // settings === mcp for codex (one TOML file); separate files for claude
    expect(c.settingsPath).not.toBe(c.mcpConfigPath)
    expect(x.settingsPath).toBe(x.mcpConfigPath)
    // plugins registry present for claude, null for codex
    expect(typeof c.pluginsRegistry).toBe('string')
    expect(x.pluginsRegistry).toBeNull()
    // env-key write capability present for claude, absent for codex
    expect(c.supportsEnvKeyWrite).toBe(true)
    expect(x.supportsEnvKeyWrite).toBe(false)
  })

  it('idempotent probe set is descriptor-derived = both harness skills dirs', () => {
    expect(harnessSkillsDirs(HOME)).toEqual([
      join(HOME, '.claude', 'skills'),
      join(HOME, '.agents', 'skills'),
    ])
  })
})
