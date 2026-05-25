// v3.9.0 P4 — auto-install dispatcher tests.
// 3 critical fixtures: extractPluginName parsing / opt-out short-circuit /
// non-interactive skip behavior. Real spawnSync NOT exercised here (would
// touch user's actual claude CLI); integration verification deferred to
// manual `harnessed setup` dogfood post-ship.

import { describe, expect, it, vi } from 'vitest'

// Mock the CHECKS registry to avoid touching real filesystem / spawns.
vi.mock('../../../src/cli/lib/doctor-registry.js', () => ({
  CHECKS: [
    async () => ({
      name: 'fake-missing-plugin',
      status: 'warn' as const,
      message: 'not installed',
      fix: 'claude plugin install fake-plugin-name',
    }),
    async () => ({
      name: 'fake-pass-check',
      status: 'pass' as const,
      message: 'ok',
    }),
    async () => ({
      name: 'fake-warn-no-install-fix',
      status: 'warn' as const,
      message: 'misconfigured',
      fix: 'edit config manually',
    }),
  ],
}))

import { extractPluginName, runAutoInstall } from '../../../src/cli/lib/auto-install.js'

describe('cli/lib/auto-install — v3.9.0 P4 plugin auto-install dispatcher', () => {
  it('F1. extractPluginName parses `claude plugin install <X>` from various fix strings', () => {
    // Plain form
    expect(extractPluginName('claude plugin install foo')).toBe('foo')
    // Embedded in install hint sentence (sister check-planning-with-files.ts REMEDIATION format)
    expect(
      extractPluginName(
        'install via Claude Code plugin marketplace: `claude plugin install planning-with-files` (requires >=2.2.0)',
      ),
    ).toBe('planning-with-files')
    // With @marketplace suffix syntax
    expect(extractPluginName('run: claude plugin install ralph-loop@claude-plugins-official')).toBe(
      'ralph-loop@claude-plugins-official',
    )
    // No match
    expect(extractPluginName('install via Claude Code plugin marketplace UI')).toBeNull()
    expect(extractPluginName('npm install foo')).toBeNull()
    expect(extractPluginName('')).toBeNull()
  })

  it('F2. autoInstall:false → short-circuits without running checks (opt-out)', async () => {
    const r = await runAutoInstall({ nonInteractive: false, autoInstall: false })
    expect(r.installed).toEqual([])
    expect(r.skipped).toEqual([])
    expect(r.failed).toEqual([])
  })

  it('F3. nonInteractive:true → installables pushed to skipped (no spawn, no prompt)', async () => {
    const r = await runAutoInstall({ nonInteractive: true, autoInstall: true })
    // Fake registry above has 1 warn entry with `claude plugin install fake-plugin-name`.
    expect(r.skipped).toEqual(['fake-plugin-name'])
    expect(r.installed).toEqual([])
    expect(r.failed).toEqual([])
  })
})
