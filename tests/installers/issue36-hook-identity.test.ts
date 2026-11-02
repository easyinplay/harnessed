// issue #36 — a compiled-binary self-update leaves the OLD assets version in
// ~/.claude/settings.json (`…/harnessed/assets/4.32.0/bin/harnessed-<id>.mjs`).
// That registration must still be recognised as FIRST-PARTY (so the installer
// can migrate it) while a third-party lookalike never is.
//
// The trust base is the CURRENT assets root, so the fixture points the assets
// root at `<tmp>/assets/9.9.9` — the compiled layout (`<stateRoot>/assets/<ver>`)
// the version-agnostic comparison keys on.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { harnessedHookRegistrations } from '../../src/installers/lib/harnessedHookTeardown.js'

const LOCAL_APPDATA =
  process.env.LOCALAPPDATA ?? join(process.env.USERPROFILE ?? '', 'AppData', 'Local')
const TRUSTED_BINARY = join(LOCAL_APPDATA, 'harnessed', 'bin', 'harnessed.exe').replace(/\\/g, '/')

/** Run `fn` with the assets root pointed at a compiled-layout fixture dir. */
function withAssetsRoot<T>(fn: (assetsRoot: string, tmp: string) => T): T {
  const tmp = mkdtempSync(join(tmpdir(), 'harnessed-issue36-'))
  const assetsRoot = join(tmp, 'assets', '9.9.9')
  mkdirSync(join(assetsRoot, 'bin'), { recursive: true })
  writeFileSync(join(assetsRoot, 'bin', 'harnessed-stop-hook.mjs'), '// fixture')
  vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot)
  try {
    return fn(assetsRoot.replace(/\\/g, '/'), tmp.replace(/\\/g, '/'))
  } finally {
    vi.unstubAllEnvs()
  }
}

describe('harnessedHookRegistrations — first-party identity across recorded forms', () => {
  it('recognises the STALE versioned-assets registration (issue #36 shape)', () => {
    withAssetsRoot((assetsRoot, tmp) => {
      const stale = `node "${tmp}/assets/4.32.0/bin/harnessed-stop-hook.mjs"`
      const hooks = {
        Stop: [{ hooks: [{ type: 'command', command: stale }] }],
      }
      expect(harnessedHookRegistrations(hooks, 'node bin/harnessed-stop-hook.mjs')).toEqual([
        { event: 'Stop', command: stale },
      ])
      // the CURRENT absolute form is the same registration
      expect(
        harnessedHookRegistrations(
          {
            Stop: [
              {
                hooks: [
                  { type: 'command', command: `node "${assetsRoot}/bin/harnessed-stop-hook.mjs"` },
                ],
              },
            ],
          },
          'node bin/harnessed-stop-hook.mjs',
        ),
      ).toHaveLength(1)
    })
  })

  it('recognises the legacy relative form and the compiled transport', () => {
    withAssetsRoot(() => {
      const relative = 'node bin/harnessed-stop-hook.mjs'
      const transport = `"${TRUSTED_BINARY}" stop-hook`
      expect(
        harnessedHookRegistrations({ Stop: [{ hooks: [{ command: relative }] }] }, relative),
      ).toEqual([{ event: 'Stop', command: relative }])
      expect(
        harnessedHookRegistrations({ Stop: [{ hooks: [{ command: transport }] }] }, relative),
      ).toEqual([{ event: 'Stop', command: transport }])
    })
  })

  it('never claims a third-party lookalike (different assets base / vendor binary)', () => {
    withAssetsRoot(() => {
      const vendorScript = 'node "C:/vendor/harnessed-stop-hook.mjs"'
      const vendorBinary = '"C:/vendor/harnessed.exe" stop-hook'
      const otherScript = 'node "C:/vendor/other-tool.mjs"'
      const hooks = {
        Stop: [
          { hooks: [{ command: vendorScript }] },
          { hooks: [{ command: vendorBinary }] },
          { hooks: [{ command: otherScript }] },
        ],
      }
      expect(harnessedHookRegistrations(hooks, 'node bin/harnessed-stop-hook.mjs')).toEqual([])
    })
  })

  it('does not confuse two hooks that share a script but live in different events', () => {
    withAssetsRoot((assetsRoot, tmp) => {
      const invalidate = `node "${tmp}/assets/4.32.0/bin/harnessed-inject-state.mjs" --invalidate`
      const hooks = {
        SessionStart: [{ hooks: [{ command: invalidate }] }],
      }
      const found = harnessedHookRegistrations(hooks, 'node bin/harnessed-inject-state.mjs')
      expect(found).toEqual([{ event: 'SessionStart', command: invalidate }])
      expect(assetsRoot).toContain('/assets/')
    })
  })
})
