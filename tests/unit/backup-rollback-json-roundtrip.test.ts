// Phase 88 — real-filesystem backup → mutate → rollback roundtrip.
//
// Unlike the mocked-fs unit tests, this exercises the public seams
// (lib/backup.ts `backup()` + cli/rollback.ts `registerRollback`) against a
// real tmpdir. `HARNESSED_ROOT_OVERRIDE` redirects the backup root so nothing
// touches the real user home. Fake secrets only.

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerRollback } from '../../src/cli/rollback.js'
import { backup } from '../../src/installers/lib/backup.js'
import type {
  DiffPlan,
  InstallContext,
  InstallOpts,
  Manifest,
} from '../../src/installers/lib/types.js'

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: false,
  fullDiff: false,
  color: 'auto',
}

function manifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'rt-test',
      display_name: 'Roundtrip',
      description: 'fixture',
      upstream: {
        source: 'rt-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/rt.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g rt-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which rt',
      },
      verify: { cmd: 'rt --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g rt-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runRollback(timestamp: string): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerRollback(program)
  try {
    await program.parseAsync(['node', 'harnessed', 'rollback', timestamp])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
    warn.mockRestore()
  }
}

describe('backup → mutate → rollback roundtrip (real fs)', () => {
  let root: string
  let target: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'harnessed-rt-'))
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'state'))
    target = join(root, 'settings.json')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(root, { recursive: true, force: true })
  })

  it('restores only the mutated subtree, preserving post-install user edits and secrets', async () => {
    const SECRET = 'sk-fake-RTSECRET-1'
    const oldSettings = JSON.stringify(
      {
        env: { API_KEY: SECRET },
        hooks: { SessionStart: [{ type: 'command', command: 'old-hook' }] },
        theme: 'dark',
      },
      null,
      2,
    )
    const newSettings = JSON.stringify(
      {
        env: { API_KEY: SECRET },
        hooks: { SessionStart: [{ type: 'command', command: 'harnessed-hook' }] },
        theme: 'dark',
        harnessedManaged: true,
      },
      null,
      2,
    )
    writeFileSync(target, oldSettings, 'utf8')

    const plan: DiffPlan = {
      files: [{ target, scope: 'HOME', oldText: oldSettings, newText: newSettings }],
    }
    const ctx: InstallContext = { manifest: manifest(), opts: BASE_OPTS, level: 'L3', cwd: root }
    const r = await backup(plan, ctx)
    expect(r.ok).toBe(true)
    if (!r.ok) return

    // backup payload must not contain the secret or the new hook text
    const backupFiles: string[] = []
    const walk = (d: string) => {
      for (const name of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, name.name)
        if (name.isDirectory()) walk(p)
        else backupFiles.push(p)
      }
    }
    walk(r.backupDir)
    for (const f of backupFiles) {
      const text = readFileSync(f, 'utf8')
      expect(text).not.toContain(SECRET)
      expect(text).not.toContain('harnessed-hook')
    }

    // Simulate: installer writes newSettings, then user edits theme + adds a
    // new secret (post-install drift that must survive rollback).
    const drifted = JSON.stringify(
      {
        env: { API_KEY: 'sk-fake-NEWERSECRET-2' },
        hooks: { SessionStart: [{ type: 'command', command: 'harnessed-hook' }] },
        theme: 'light',
        harnessedManaged: true,
      },
      null,
      2,
    )
    writeFileSync(target, drifted, 'utf8')

    const code = await runRollback(r.backupId)
    expect(code).toBe(0)

    const restored = JSON.parse(readFileSync(target, 'utf8')) as Record<string, unknown> & {
      env: { API_KEY: string }
      hooks: { SessionStart: unknown }
    }
    expect(restored.hooks.SessionStart).toEqual([{ type: 'command', command: 'old-hook' }])
    expect('harnessedManaged' in restored).toBe(false)
    expect(restored.env.API_KEY).toBe('sk-fake-NEWERSECRET-2') // user's new secret survives
    expect(restored.theme).toBe('light') // user's post-install edit survives
  })

  it('non-JSON target still round-trips through byte backup', async () => {
    const oldText = 'original body\n'
    writeFileSync(target, oldText, 'utf8')
    const plan: DiffPlan = {
      files: [{ target, scope: 'HOME', oldText, newText: 'installed\n' }],
    }
    const ctx: InstallContext = { manifest: manifest(), opts: BASE_OPTS, level: 'L2', cwd: root }
    const r = await backup(plan, ctx)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    writeFileSync(target, 'installed\n', 'utf8')
    expect(await runRollback(r.backupId)).toBe(0)
    expect(readFileSync(target, 'utf8')).toBe(oldText)
  })

  it('rollback refuses and writes nothing when the current JSON is invalid', async () => {
    const oldSettings = JSON.stringify({ a: 1 }, null, 2)
    const newSettings = JSON.stringify({ a: 2 }, null, 2)
    writeFileSync(target, oldSettings, 'utf8')
    const plan: DiffPlan = {
      files: [{ target, scope: 'HOME', oldText: oldSettings, newText: newSettings }],
    }
    const ctx: InstallContext = { manifest: manifest(), opts: BASE_OPTS, level: 'L3', cwd: root }
    const r = await backup(plan, ctx)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    writeFileSync(target, 'corrupted {', 'utf8')
    expect(await runRollback(r.backupId)).toBe(1)
    expect(readFileSync(target, 'utf8')).toBe('corrupted {')
  })

  it('backup refuses a stale plan without writing a payload', async () => {
    writeFileSync(target, JSON.stringify({ a: 99 }), 'utf8')
    const plan: DiffPlan = {
      files: [
        {
          target,
          scope: 'HOME',
          oldText: JSON.stringify({ a: 1 }),
          newText: JSON.stringify({ a: 2 }),
        },
      ],
    }
    const ctx: InstallContext = { manifest: manifest(), opts: BASE_OPTS, level: 'L3', cwd: root }
    const r = await backup(plan, ctx)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.keyword).toBe('backup-stale-plan')
  })
})
