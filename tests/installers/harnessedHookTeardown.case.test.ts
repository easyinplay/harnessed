import { afterEach, describe, expect, it, vi } from 'vitest'

async function identityWithAssetsRoot(root: string) {
  vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', root)
  vi.resetModules()
  return (await import('../../src/installers/lib/harnessedHookTeardown.js')).harnessedHookIdentity
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('harnessed hook path case sensitivity', () => {
  it('requires exact case for POSIX captured assets and version siblings', async () => {
    const identity = await identityWithAssetsRoot('/opt/vendor/harnessed/assets/5.0.5')

    expect(
      identity('node "/opt/vendor/harnessed/assets/5.0.4/bin/harnessed-inject-state.mjs"'),
    ).toBe('inject-state')
    expect(
      identity('node "/opt/vendor/Harnessed/assets/5.0.4/bin/harnessed-inject-state.mjs"'),
    ).toBeNull()
  })

  it('allows case variants for Windows drive captured assets and compiled transport', async () => {
    vi.stubEnv('LOCALAPPDATA', 'C:\\Users\\Test\\AppData\\Local')
    const identity = await identityWithAssetsRoot('C:\\Vendor\\Harnessed\\assets\\5.0.5')

    expect(identity('node "c:/vendor/harnessed/assets/5.0.4/bin/HARNESSED-INJECT-STATE.MJS"')).toBe(
      'inject-state',
    )
    expect(identity('"c:/users/test/appdata/local/HARNESSED/BIN/HARNESSED.EXE" stop-hook')).toBe(
      'stop-hook',
    )
  })

  it('allows case variants for UNC captured assets', async () => {
    const identity = await identityWithAssetsRoot('\\\\Server\\Share\\Harnessed\\assets\\5.0.5')

    expect(
      identity('node "//server/share/harnessed/assets/5.0.4/bin/HARNESSED-STOP-HOOK.MJS"'),
    ).toBe('stop-hook')
  })
})
