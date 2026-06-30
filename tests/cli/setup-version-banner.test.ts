// Patch 4.11.1 — setup version banner. versionBannerLines is pure (installed +
// already-resolved npm-latest in → printable lines out), so no network here.

import { describe, expect, it } from 'vitest'
import { versionBannerLines } from '../../src/cli/lib/setup-helpers.js'

describe('versionBannerLines', () => {
  it('always prints the installed version as line 1', () => {
    expect(versionBannerLines('4.11.0', null)[0]).toBe('harnessed setup v4.11.0')
    expect(versionBannerLines('4.11.0', '4.11.0')[0]).toBe('harnessed setup v4.11.0')
  })

  it('behind → update-available warn with both versions + install command', () => {
    const lines = versionBannerLines('4.10.0', '4.11.0')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('⚠ update available: 4.10.0 → 4.11.0 — npm install -g harnessed@latest')
  })

  it('current → ✓ latest', () => {
    const lines = versionBannerLines('4.11.0', '4.11.0')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('✓ latest (v4.11.0)')
  })

  it('offline (null latest) → single "could not check" line, no version verdict', () => {
    const lines = versionBannerLines('4.11.0', null)
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('  could not check latest version')
    expect(lines.some((l) => l.includes('update available'))).toBe(false)
  })

  it('ahead (local dev > published) → ✓ latest at the installed version, no warn', () => {
    const lines = versionBannerLines('4.12.0', '4.11.0')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('✓ latest (v4.12.0)')
  })

  it('malformed installed version → no verdict line (no false claim)', () => {
    const lines = versionBannerLines('not-a-version', '4.11.0')
    expect(lines).toEqual(['harnessed setup vnot-a-version'])
  })
})
