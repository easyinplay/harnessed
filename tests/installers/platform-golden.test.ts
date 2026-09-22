// v16.0 Phase 63 T6 — CRITICAL regression lock for the claude host.
//
// Written GREEN against the pre-refactor detectPlatform() and kept unchanged
// through the ADR 0040 precedence rewrite: for a claude user (no host env, no
// pin or a claude pin, with or without HARNESSED_ROOT_OVERRIDE, ~/.claude present
// or absent) every descriptor field must stay byte-identical. Expected values are
// spelled out as literal paths — not derived from claudeDescriptor() — so a
// change to the descriptor itself also trips this file.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getHarnessedRoot } from '../../src/platform/harnessedRoot.js'
import {
  detectPlatform,
  getCommandsDir,
  getMcpConfigPath,
  getPluginsRegistry,
  getSettingsPath,
  getSkillsDir,
} from '../../src/platform/platform.js'

const HOST_ENV = [
  'HARNESSED_ROOT_OVERRIDE',
  'HARNESSED_PLATFORM',
  'CLAUDE_CODE_SESSION_ID',
  'CODEX_SESSION_ID',
] as const

let home: string

function golden(stateRoot = join(home, '.claude', 'harnessed')) {
  return {
    id: 'claude',
    homeDir: join(home, '.claude'),
    stateRoot,
    settingsPath: join(home, '.claude', 'settings.json'),
    skillsDir: join(home, '.claude', 'skills'),
    commandsDir: join(home, '.claude', 'commands'),
    pluginsRegistry: join(home, '.claude', 'plugins', 'installed_plugins.json'),
    mcpConfigPath: join(home, '.claude.json'),
    supportsEnvKeyWrite: true,
    sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
  }
}

function pinClaude(): void {
  mkdirSync(join(home, '.claude', 'harnessed'), { recursive: true })
  writeFileSync(join(home, '.claude', 'harnessed', '.platform'), 'claude\n', 'utf8')
}

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'harnessed-golden-'))
  for (const k of HOST_ENV) vi.stubEnv(k, undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

describe('vitest setupFile strips ambient host env (Phase 63 T5)', () => {
  it('no CLAUDE_CODE_SESSION_ID / CODEX_* / HARNESSED_PLATFORM leaks in from the launching shell', () => {
    vi.unstubAllEnvs() // inspect the env as the setupFile left it
    const leaked = Object.keys(process.env).filter(
      (k) => k.startsWith('CODEX_') || k === 'CLAUDE_CODE_SESSION_ID' || k === 'HARNESSED_PLATFORM',
    )
    expect(leaked).toEqual([])
  })
})

describe('claude golden — detectPlatform byte-identical (Phase 63 T6)', () => {
  const cases: Array<[string, () => void]> = [
    ['no env, nothing on disk', () => {}],
    ['no env, ~/.claude present', () => mkdirSync(join(home, '.claude'))],
    [
      'no env, both ~/.claude and ~/.codex present',
      () => {
        mkdirSync(join(home, '.claude'))
        mkdirSync(join(home, '.codex'))
      },
    ],
    ['pin=claude, ~/.claude present', pinClaude],
    [
      'HARNESSED_PLATFORM=claude, nothing on disk',
      () => vi.stubEnv('HARNESSED_PLATFORM', 'claude'),
    ],
  ]

  it.each(cases)('%s → exact claude descriptor', (_name, arrange) => {
    arrange()
    expect(detectPlatform(home)).toStrictEqual(golden())
  })

  const overrideCases: Array<[string, () => void]> = [
    ['nothing on disk', () => {}],
    ['~/.claude present', () => mkdirSync(join(home, '.claude'))],
    ['pin=claude', pinClaude],
  ]

  it.each(
    overrideCases,
  )('HARNESSED_ROOT_OVERRIDE + %s → claude, only stateRoot replaced', (_n, arrange) => {
    arrange()
    const override = join(home, 'override-root')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', override)
    expect(detectPlatform(home)).toStrictEqual(golden(override))
  })

  it('config resolvers return the literal claude paths', () => {
    mkdirSync(join(home, '.claude'))
    expect(getSettingsPath(home)).toBe(join(home, '.claude', 'settings.json'))
    expect(getSkillsDir(home)).toBe(join(home, '.claude', 'skills'))
    expect(getCommandsDir(home)).toBe(join(home, '.claude', 'commands'))
    expect(getPluginsRegistry(home)).toBe(
      join(home, '.claude', 'plugins', 'installed_plugins.json'),
    )
    expect(getMcpConfigPath(home)).toBe(join(home, '.claude.json'))
  })

  it('getHarnessedRoot(): override verbatim when set', () => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'override-root'))
    expect(getHarnessedRoot()).toBe(join(home, 'override-root'))
  })
})
