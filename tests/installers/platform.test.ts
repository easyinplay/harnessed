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
import { claudeDescriptor, detectPlatform } from '../../src/installers/lib/platform.js'

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
