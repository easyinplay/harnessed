// Phase 2.4 W3 T3.1 — cc-hook-add installer unit tests (5 cells per task_plan acceptance).
//
// Mocks node:fs/promises + @clack/prompts so the test does NOT touch the real
// ~/.claude/settings.json. dispatch / install (fresh write) / install (deep-merge into
// existing hooks block) / install (idempotent skip on duplicate) / verify-failed.

import { describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => {
  // In-memory FS keyed by absolute path so we can simulate read-modify-write.
  const fs: Record<string, string> = {}
  return {
    readFile: vi.fn(async (p: string) => {
      const v = fs[String(p)]
      if (v === undefined) {
        const e = new Error('ENOENT') as NodeJS.ErrnoException
        e.code = 'ENOENT'
        throw e
      }
      return v
    }),
    writeFile: vi.fn(async (p: string, data: string) => {
      fs[String(p)] = data
    }),
    mkdir: vi.fn(async () => undefined),
    rename: vi.fn(async (from: string, to: string) => {
      fs[String(to)] = fs[String(from)] ?? ''
      delete fs[String(from)]
    }),
    access: vi.fn(async () => undefined),
    // Expose helper for test setup.
    __fs: fs,
  }
})

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))

import * as fsp from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { installCcHookAdd } from '../../src/installers/ccHookAdd.js'
import { runInstall } from '../../src/installers/index.js'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json')
const fakeFs = (fsp as unknown as { __fs: Record<string, string> }).__fs

function captureStdout(): { restore: () => void } {
  const original = process.stdout.write.bind(process.stdout)
  // biome-ignore lint/suspicious/noExplicitAny: stdout.write variadic
  process.stdout.write = ((_c: any) => true) as typeof process.stdout.write
  return {
    restore: () => {
      process.stdout.write = original
    },
  }
}

function ccHookManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'dashboard-autospawn',
      display_name: 'Dashboard Autospawn',
      description: 'fixture',
      upstream: {
        source: 'dashboard-autospawn',
        homepage: 'https://example.com',
        repository: 'https://github.com/easyinplay/harnessed.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-hook',
      component_type: 'command',
      category: 'meta',
      install_type: 'hook',
      install: {
        method: 'cc-hook-add',
        cmd: 'node scripts/dashboard.mjs --no-open',
        hook_event: 'SessionStart',
        hook_matcher: 'startup|resume',
        hook_command: 'node scripts/dashboard.mjs --no-open',
        idempotent_check: 'grep -q dashboard.mjs ~/.claude/settings.json',
      },
      verify: { cmd: 'true', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'true' },
      upstream_health: {
        stability: 'beta',
        last_check: '2026-05-16',
        last_known_good_version: '0.2.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

const baseOpts: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}

describe('cc-hook-add installer', () => {
  it('dispatch — runInstall routes cc-hook-add to installCcHookAdd', async () => {
    for (const k of Object.keys(fakeFs)) delete fakeFs[k]
    const cap = captureStdout()
    try {
      const r = await runInstall(ccHookManifest(), baseOpts)
      expect('ok' in r && r.ok === true).toBe(true)
    } finally {
      cap.restore()
    }
  })

  it('install — fresh settings.json (file does not exist) → creates with hook entry', async () => {
    for (const k of Object.keys(fakeFs)) delete fakeFs[k]
    const cap = captureStdout()
    try {
      const r = await installCcHookAdd({
        manifest: ccHookManifest(),
        opts: baseOpts,
        level: 'L3',
        cwd: process.cwd(),
      })
      expect('ok' in r && r.ok === true).toBe(true)
      const written = JSON.parse(fakeFs[SETTINGS_PATH] ?? '{}')
      expect(written.hooks.SessionStart).toHaveLength(1)
      expect(written.hooks.SessionStart[0].command).toBe('node scripts/dashboard.mjs --no-open')
      expect(written.hooks.SessionStart[0].matcher).toBe('startup|resume')
    } finally {
      cap.restore()
    }
  })

  it('install — deep-merges into existing hooks block (preserves other event entries)', async () => {
    for (const k of Object.keys(fakeFs)) delete fakeFs[k]
    fakeFs[SETTINGS_PATH] = JSON.stringify(
      {
        hooks: {
          PreToolUse: [{ command: 'echo pre', matcher: 'Bash' }],
          SessionStart: [{ command: 'echo other', matcher: 'startup' }],
        },
      },
      null,
      2,
    )
    const cap = captureStdout()
    try {
      const r = await installCcHookAdd({
        manifest: ccHookManifest(),
        opts: baseOpts,
        level: 'L3',
        cwd: process.cwd(),
      })
      expect('ok' in r && r.ok === true).toBe(true)
      const written = JSON.parse(fakeFs[SETTINGS_PATH] ?? '{}')
      // Preserved other event AND other matcher within same event.
      expect(written.hooks.PreToolUse).toHaveLength(1)
      expect(written.hooks.SessionStart).toHaveLength(2)
      const cmds = written.hooks.SessionStart.map((h: { command: string }) => h.command)
      expect(cmds).toContain('echo other')
      expect(cmds).toContain('node scripts/dashboard.mjs --no-open')
    } finally {
      cap.restore()
    }
  })

  it('install — idempotent on duplicate (matching cmd+matcher) → ok + appliedFiles=[]', async () => {
    for (const k of Object.keys(fakeFs)) delete fakeFs[k]
    fakeFs[SETTINGS_PATH] = JSON.stringify(
      {
        hooks: {
          SessionStart: [
            { command: 'node scripts/dashboard.mjs --no-open', matcher: 'startup|resume' },
          ],
        },
      },
      null,
      2,
    )
    const cap = captureStdout()
    try {
      const r = await installCcHookAdd({
        manifest: ccHookManifest(),
        opts: baseOpts,
        level: 'L3',
        cwd: process.cwd(),
      })
      expect('ok' in r && r.ok === true).toBe(true)
      if ('ok' in r && r.ok) {
        expect(r.backupId).toBe('idempotent-skip')
        expect(r.appliedFiles).toEqual([])
      }
    } finally {
      cap.restore()
    }
  })

  it('preflight — non-cc-hook-add method → dispatch-mismatch error', async () => {
    const m = ccHookManifest()
    // Force-cast to simulate dispatch bug
    ;(m.spec.install as { method: string }).method = 'npm-cli'
    const cap = captureStdout()
    try {
      const r = await installCcHookAdd({
        manifest: m,
        opts: baseOpts,
        level: 'L3',
        cwd: process.cwd(),
      })
      expect('ok' in r && r.ok === false).toBe(true)
      if ('ok' in r && r.ok === false) {
        expect(r.error.keyword).toBe('dispatch-mismatch')
      }
    } finally {
      cap.restore()
    }
  })
})
