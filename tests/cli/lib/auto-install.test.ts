// v3.9.0 P4 / v3.9.1 — auto-install dispatcher tests.
// 4 fixtures: opt-out short-circuit / nonInteractive skip / no installables /
// installables collected from install_commands field. Real spawnSync NOT
// exercised here (would touch user's actual claude/npx CLI); integration
// verification deferred to manual `harnessed setup` dogfood post-ship.

import { describe, expect, it, vi } from 'vitest'

// Mock the CHECKS registry to avoid touching real filesystem / spawns.
vi.mock('../../../src/cli/lib/doctor-registry.js', () => ({
  CHECKS: [
    async () => ({
      name: 'fake-missing-plugin',
      status: 'warn' as const,
      message: 'not installed',
      fix: 'install via marketplace add + plugin install',
      install_commands: [
        'claude plugin marketplace add owner/repo',
        'claude plugin install fake-plugin',
      ],
    }),
    async () => ({
      name: 'fake-pass-check',
      status: 'pass' as const,
      message: 'ok',
    }),
    async () => ({
      name: 'fake-warn-no-install-cmds',
      status: 'warn' as const,
      message: 'misconfigured',
      fix: 'edit config manually',
      // No install_commands → not auto-installable.
    }),
  ],
}))

import { runAutoInstall } from '../../../src/cli/lib/auto-install.js'

describe('cli/lib/auto-install — v3.9.0 P4 plugin auto-install dispatcher', () => {
  it('F1. autoInstall:false → short-circuits without running checks (opt-out)', async () => {
    const r = await runAutoInstall({ nonInteractive: false, autoInstall: false })
    expect(r.installed).toEqual([])
    expect(r.skipped).toEqual([])
    expect(r.failed).toEqual([])
  })

  it('F2. nonInteractive:true → installables pushed to skipped (no spawn, no prompt)', async () => {
    const r = await runAutoInstall({ nonInteractive: true, autoInstall: true })
    // Fake registry: 1 warn entry with install_commands, 1 pass, 1 warn without install_commands.
    // Only the first qualifies as installable.
    expect(r.skipped).toEqual(['fake-missing-plugin'])
    expect(r.installed).toEqual([])
    expect(r.failed).toEqual([])
  })

  it('F3. warn entry without install_commands is NOT auto-installable (filtered out)', async () => {
    // Same fake registry — 1 installable + 1 warn-without-cmds.
    // nonInteractive=true so we exercise the filter without prompting.
    const r = await runAutoInstall({ nonInteractive: true, autoInstall: true })
    // fake-warn-no-install-cmds NOT in skipped (filtered out before per-check loop).
    expect(r.skipped).not.toContain('fake-warn-no-install-cmds')
  })
})
