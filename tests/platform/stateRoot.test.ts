// Phase 84 / T10 (R15, AC15) — the ONE state-root derivation.
//
// Before this module there were three derivations, and the codex one did not
// honour `HARNESSED_ROOT_OVERRIDE` → the CLI wrote one root and the codex
// path read another. These tests pin the single behaviour every consumer now
// shares.

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { canonicalStateRoot } from '../../src/platform/stateRoot.js'

const KEYS = ['HARNESSED_ROOT_OVERRIDE', 'CODEX_HOME', 'CLAUDE_CONFIG_DIR'] as const

const saved = new Map<string, string | undefined>()

function setEnv(key: string, value: string | undefined): void {
  if (!saved.has(key)) saved.set(key, process.env[key])
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

afterEach(() => {
  for (const key of KEYS) {
    const value = saved.get(key)
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
    saved.delete(key)
  }
})

describe('canonicalStateRoot', () => {
  it('uses the codex home for the codex host', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', undefined)
    setEnv('CODEX_HOME', join(homedir(), '.codex'))
    expect(canonicalStateRoot('codex')).toBe(resolve(join(homedir(), '.codex', 'harnessed')))
  })

  it('uses the claude home for the claude host', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', undefined)
    setEnv('CLAUDE_CONFIG_DIR', undefined)
    expect(canonicalStateRoot('claude')).toBe(resolve(join(homedir(), '.claude', 'harnessed')))
  })

  it('honours CODEX_HOME over the default codex home', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', undefined)
    setEnv('CODEX_HOME', join(homedir(), 'custom-codex'))
    expect(canonicalStateRoot('codex')).toBe(resolve(join(homedir(), 'custom-codex', 'harnessed')))
  })

  it('honours CLAUDE_CONFIG_DIR over the default claude home', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', undefined)
    setEnv('CLAUDE_CONFIG_DIR', join(homedir(), 'custom-claude'))
    expect(canonicalStateRoot('claude')).toBe(
      resolve(join(homedir(), 'custom-claude', 'harnessed')),
    )
  })

  it('moves BOTH hosts with HARNESSED_ROOT_OVERRIDE (the codex bug)', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', join(homedir(), 'override-root'))
    setEnv('CODEX_HOME', join(homedir(), '.codex'))
    setEnv('CLAUDE_CONFIG_DIR', join(homedir(), '.claude'))
    const override = resolve(join(homedir(), 'override-root'))
    expect(canonicalStateRoot('codex')).toBe(override)
    expect(canonicalStateRoot('claude')).toBe(override)
  })

  it('ignores a blank override and trims the home variables', () => {
    setEnv('HARNESSED_ROOT_OVERRIDE', '   ')
    setEnv('CODEX_HOME', `  ${join(homedir(), '.codex')}  `)
    expect(canonicalStateRoot('codex')).toBe(resolve(join(homedir(), '.codex', 'harnessed')))
  })
})
