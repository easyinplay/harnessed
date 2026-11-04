// Phase 20 — version-check: pure compareVersions + fail-soft fetchLatestVersion.
// fetchLatestVersion takes an injectable runner so the unit test never spawns npm.

import { describe, expect, it } from 'vitest'
import {
  compareVersionNames,
  compareVersions,
  fetchLatestVersion,
} from '../../src/cli/lib/version-check.js'

describe('compareVersions', () => {
  it('behind / ahead / current', () => {
    expect(compareVersions('4.4.0', '4.5.0')).toBe('behind')
    expect(compareVersions('4.5.0', '4.4.0')).toBe('ahead')
    expect(compareVersions('4.4.0', '4.4.0')).toBe('current')
  })
  it('numeric (not lexicographic) segment compare', () => {
    expect(compareVersions('4.10.0', '4.9.0')).toBe('ahead')
    expect(compareVersions('4.9.0', '4.10.0')).toBe('behind')
  })
  it('prerelease sorts below its release', () => {
    expect(compareVersions('4.5.0-rc.1', '4.5.0')).toBe('behind')
    expect(compareVersions('4.5.0', '4.5.0-rc.1')).toBe('ahead')
  })
  it('malformed / empty → unknown', () => {
    expect(compareVersions('x', '4.4.0')).toBe('unknown')
    expect(compareVersions('', '4.4.0')).toBe('unknown')
    expect(compareVersions('4.4.0', 'nope')).toBe('unknown')
  })
})

describe('compareVersionNames (plugin cache directory names)', () => {
  it('orders full semver numerically, not lexicographically', () => {
    expect(compareVersionNames('3.28.0', '3.17.2')).toBeGreaterThan(0)
    expect(compareVersionNames('10.0.0', '9.1.0')).toBeGreaterThan(0)
    expect(compareVersionNames('2.34.0', '3.28.0')).toBeLessThan(0)
    expect(compareVersionNames('3.28.0', '3.28.0')).toBe(0)
  })
  it('orders short version names numerically too', () => {
    expect(compareVersionNames('2.34', '2.9')).toBeGreaterThan(0)
    expect(compareVersionNames('10.0', '9.1')).toBeGreaterThan(0)
    expect(compareVersionNames('2.34', '2.34.0')).toBe(0)
  })
})

describe('fetchLatestVersion (fail-soft via injected runner)', () => {
  it('returns the trimmed semver on success', async () => {
    expect(await fetchLatestVersion(async () => '4.5.0\n')).toBe('4.5.0')
  })
  it('null on non-semver output', async () => {
    expect(await fetchLatestVersion(async () => 'not a version')).toBeNull()
  })
  it('null when the runner throws (network/timeout) — never throws', async () => {
    expect(
      await fetchLatestVersion(async () => {
        throw new Error('ENETUNREACH')
      }),
    ).toBeNull()
  })
})
