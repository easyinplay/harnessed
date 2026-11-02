// issue #8 — doctor stale-hook self-heal probe.

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { checkStaleHooks } from '../../src/cli/lib/check-stale-hooks.js'

const P = '/fake/settings.json'

function withSettings(obj: unknown, exists: (p: string) => boolean = () => false) {
  return checkStaleHooks({
    settingsPath: P,
    readText: () => JSON.stringify(obj),
    exists,
  })
}

describe('checkStaleHooks', () => {
  it('no settings.json → pass', () => {
    const r = checkStaleHooks({ settingsPath: P, readText: () => null, exists: () => false })
    expect(r.status).toBe('pass')
  })

  it('unreadable JSON → pass (skipped)', () => {
    const r = checkStaleHooks({ settingsPath: P, readText: () => '{not json', exists: () => false })
    expect(r.status).toBe('pass')
  })

  it('no hooks → pass', () => {
    expect(withSettings({ env: {} }).status).toBe('pass')
  })

  it('harnessed hook pointing at a MISSING absolute script → warn + fix', () => {
    const binary = join(homedir(), 'AppData', 'Local', 'harnessed', 'bin', 'harnessed.exe')
    const r = withSettings(
      {
        hooks: {
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: 'command',
                  command: `"${binary}" inject-state`,
                },
              ],
            },
          ],
        },
      },
      () => false,
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('MODULE_NOT_FOUND')
    expect(r.fix).toContain('harnessed uninstall')
    expect(r.fix).toContain(P)
  })

  it('harnessed hook whose script EXISTS → pass (healthy install)', () => {
    const r = withSettings(
      {
        hooks: {
          Stop: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'node "C:/live/harnessed/bin/harnessed-stop-hook.mjs"',
                },
              ],
            },
          ],
        },
      },
      () => true,
    )
    expect(r.status).toBe('pass')
  })

  it('malformed hooks (null array element) → pass, never throws (warn-never-fail contract)', () => {
    const r = withSettings({ hooks: { Stop: [null, { hooks: [null] }] } }, () => false)
    expect(r.status).toBe('pass')
  })

  it('relative-form harnessed hook (pre-4.20.0 orphan) → warn', () => {
    const r = withSettings(
      {
        hooks: {
          UserPromptSubmit: [{ hooks: [{ command: 'node bin/harnessed-inject-state.mjs' }] }],
        },
      },
      () => true, // exists is irrelevant for a cwd-relative script
    )
    expect(r.status).toBe('warn')
    expect(r.fix).toContain('harnessed uninstall')
  })

  // 4.34.1 — doc-discipline-gate (PreToolUse/Bash) was invisible to self-heal
  // because `check-docs` was not a first-party hook identity.
  it('orphaned doc-discipline-gate (compiled binary gone) → warn', () => {
    const binary = join(homedir(), 'AppData', 'Local', 'harnessed', 'bin', 'harnessed.exe')
    const r = withSettings(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command: `"${binary}" check-docs --hook`,
                },
              ],
            },
          ],
        },
      },
      () => false,
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('PreToolUse')
    expect(r.message).toContain(binary)
    expect(r.fix).toContain('harnessed uninstall')
  })

  it('healthy doc-discipline-gate (bare PATH form) → pass, never a false positive', () => {
    const r = withSettings(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'harnessed check-docs --hook' }],
            },
          ],
        },
      },
      () => false,
    )
    expect(r.status).toBe('pass')
  })

  it('unrelated hook pointing nowhere → pass (not ours)', () => {
    const r = withSettings(
      {
        hooks: {
          PreToolUse: [{ hooks: [{ type: 'command', command: 'node "/x/gone/other.mjs"' }] }],
        },
      },
      () => false,
    )
    expect(r.status).toBe('pass')
  })

  // issue #36 — a stale VERSIONED assets path is a registration harnessed still
  // ships: re-registering it (setup/update) fixes it, uninstalling does not.
  // The trust base is the current assets root, so the module is re-imported
  // with the assets root pointed at a compiled-layout fixture dir.
  it('versioned-assets stale path → fix points at re-registration, NOT uninstall', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'harnessed-issue36-'))
    const assetsRoot = join(tmp, 'assets', '9.9.9')
    await mkdir(join(assetsRoot, 'bin'), { recursive: true })
    await writeFile(join(assetsRoot, 'bin', 'harnessed-stop-hook.mjs'), '// fixture')
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot)
    vi.resetModules()
    try {
      const { checkStaleHooks: fresh } = await import('../../src/cli/lib/check-stale-hooks.js')
      const stale = `node "${join(tmp, 'assets', '4.32.0', 'bin', 'harnessed-stop-hook.mjs').replace(/\\/g, '/')}"`
      const r = fresh({
        settingsPath: P,
        readText: () =>
          JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: stale }] }] } }),
        exists: () => false,
      })
      expect(r.status).toBe('warn')
      expect(r.fix).toContain('harnessed setup')
      expect(r.fix).not.toContain('harnessed uninstall')
      expect(r.fix).toContain(P)
    } finally {
      vi.unstubAllEnvs()
      await rm(tmp, { recursive: true, force: true })
    }
  })
})
