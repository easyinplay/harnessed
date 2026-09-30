// v16.0 Phase 66 T5 — the doctor registry is a DESCRIPTOR list, not a bare fn list.
//
// Before T5 `CHECKS` was `readonly CheckFn[]` with no metadata, so nothing in the
// codebase could answer "which harness is this check even about" — every check
// re-derived that itself via `detectPlatform()` and early-returned a FAKE `pass`.
// These cells pin the descriptor shape, the host annotations (audited against each
// check's real early-return logic, not its name), and the filter that `doctor
// --host <id>` / `--matrix` dispatch through.

import { describe, expect, it } from 'vitest'
import { ALL_HOSTS, CHECKS, checksForHost } from '../../src/cli/lib/doctor-registry.js'

describe('cli/lib/doctor-registry — Phase 66 T5 descriptors', () => {
  it('cell 1 — every entry is a {name, hosts, fn} descriptor (24 checks)', () => {
    expect(CHECKS).toHaveLength(24)
    for (const c of CHECKS) {
      expect(typeof c.name).toBe('string')
      expect(c.name.length).toBeGreaterThan(0)
      expect(typeof c.fn).toBe('function')
      expect(Array.isArray(c.hosts)).toBe(true)
    }
  })

  it('cell 2 — names are unique (matrix rows are keyed by name)', () => {
    const names = CHECKS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('cell 3 — every `hosts` is non-empty and a subset of ALL_HOSTS', () => {
    expect([...ALL_HOSTS]).toEqual(['claude', 'codex'])
    for (const c of CHECKS) {
      expect(c.hosts.length).toBeGreaterThan(0)
      for (const h of c.hosts) expect(ALL_HOSTS).toContain(h)
    }
  })

  it('cell 4 — checksForHost keeps only the checks declaring that host', () => {
    for (const host of ALL_HOSTS) {
      const slice = checksForHost(host)
      expect(slice.length).toBeGreaterThan(0)
      expect(slice.length).toBeLessThan(CHECKS.length)
      expect(slice.every((c) => c.hosts.includes(host))).toBe(true)
      // order preserved — human-readable doctor output depends on it
      expect(slice.map((c) => c.name)).toEqual(
        CHECKS.filter((c) => c.hosts.includes(host)).map((c) => c.name),
      )
    }
  })

  it('cell 5 — the two host slices together cover every check (no orphan)', () => {
    const covered = new Set(ALL_HOSTS.flatMap((h) => checksForHost(h).map((c) => c.name)))
    expect(covered.size).toBe(CHECKS.length)
  })

  it('cell 6 — the single-host annotations match the audited early-return logic', () => {
    // claude-only: each of these has a host early-return that makes it a no-op on
    // codex (`detectPlatform().id !== "claude"`, `getSettingsPath() === null`, or
    // `getPluginsRegistry() === null`).
    expect(CHECKS.filter((c) => !c.hosts.includes('codex')).map((c) => c.name)).toEqual([
      'mcp scope',
      'Agent Teams env',
      'planning-with-files plugin',
      'stale hooks',
      'per-turn inject pairing',
      'plugin install freshness',
    ])
    // codex-only: `check-codex-hooks.ts` returns early unless platformId === 'codex'.
    expect(CHECKS.filter((c) => !c.hosts.includes('claude')).map((c) => c.name)).toEqual([
      'codex hook plugins',
    ])
  })
})
