// C1 fix (issue #9) — the manifest's declared uninstall contract (spec.uninstall,
// schema-REQUIRED + security-screened) was never executed: runUninstall dispatched
// only to the per-method inverse, which reverse-engineered teardown from
// spec.install and produced wrong/no-op removal for gsd + ui-ux-pro-max. These
// tests pin the declared-teardown executor: it runs the declared cmd through the
// shared spawn seam, removes cleanup_paths $HOME-confined + idempotently, is
// fail-soft on a non-zero cmd exit, and refuses paths escaping $HOME.

import { homedir } from 'node:os'
import { join, resolve as resolvePath } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const spawnCmdMock = vi.fn()
vi.mock('../../src/installers/lib/spawn.js', () => ({
  spawnCmd: (...a: unknown[]) => spawnCmdMock(...a),
  DEFAULT_INSTALL_TIMEOUT_MS: 300_000,
}))
const rmMock = vi.fn(async (_p: string, _o?: unknown) => undefined)
vi.mock('node:fs/promises', () => ({
  rm: (p: string, o?: unknown) => rmMock(p, o),
}))

import type { Manifest } from '../../src/manifest/schema/types.js'
import {
  confineCleanupPath,
  hasDeclaredUninstall,
  runDeclaredTeardown,
} from '../../src/uninstallers/lib/declaredTeardown.js'
import type { UninstallContext } from '../../src/uninstallers/lib/types.js'

/** SpawnOk success shape (exit 0). */
function spawnOk(exitCode = 0) {
  return { ok: true, exitCode, stdout: '', stderr: '' }
}

function manifestWith(uninstall: { cmd: string; cleanup_paths?: string[] }): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'gsd',
      display_name: 'GSD',
      description: 'x',
      upstream: {
        source: '@opengsd/gsd-core',
        homepage: 'https://e.com',
        repository: 'https://github.com/e/x.git',
        license: 'MIT',
        notice: 'x',
      },
    },
    spec: {
      type: 'skill-pack',
      component_type: 'skill-pack',
      install: {
        method: 'npm-cli',
        cmd: 'npx --yes @opengsd/gsd-core@latest --claude --global',
      },
      verify: { cmd: 'x', timeout_ms: 5000 },
      uninstall,
    },
  } as unknown as Manifest
}

function ctxFor(m: Manifest, dryRun = false): UninstallContext {
  return { manifest: m, opts: { apply: true, dryRun, yes: true }, cwd: process.cwd() }
}

beforeEach(() => {
  spawnCmdMock.mockReset()
  rmMock.mockReset()
  spawnCmdMock.mockResolvedValue(spawnOk())
  rmMock.mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('hasDeclaredUninstall', () => {
  it('true when spec.uninstall present', () => {
    expect(hasDeclaredUninstall(ctxFor(manifestWith({ cmd: 'x' })))).toBe(true)
  })
})

describe('confineCleanupPath', () => {
  it('resolves a ~/-relative path under $HOME to absolute', () => {
    expect(confineCleanupPath('~/.claude/skills/gsd')).toBe(
      resolvePath(join(homedir(), '.claude/skills/gsd')),
    )
  })

  it('refuses $HOME itself (null)', () => {
    expect(confineCleanupPath('~')).toBeNull()
  })

  it('refuses a path outside $HOME (null)', () => {
    // an absolute path that is not under home
    const outside = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd'
    expect(confineCleanupPath(outside)).toBeNull()
  })

  it('throws on a dot-dot traversal vector', () => {
    expect(() => confineCleanupPath('~/.claude/../../etc/passwd')).toThrow()
  })
})

describe('runDeclaredTeardown', () => {
  it('runs the declared cmd through the spawn seam and removes cleanup_paths', async () => {
    const m = manifestWith({
      cmd: 'npx --yes @opengsd/gsd-core@latest --uninstall --claude',
      cleanup_paths: ['~/.claude/skills/gsd'],
    })
    const res = await runDeclaredTeardown(ctxFor(m))

    expect(spawnCmdMock).toHaveBeenCalledTimes(1)
    // 2nd positional arg to spawnCmd is the literal declared cmd
    expect(spawnCmdMock.mock.calls[0]?.[1]).toBe(
      'npx --yes @opengsd/gsd-core@latest --uninstall --claude',
    )
    const expected = resolvePath(join(homedir(), '.claude/skills/gsd'))
    expect(rmMock).toHaveBeenCalledTimes(1)
    expect(rmMock.mock.calls[0]?.[0]).toBe(expected)
    // idempotent removal: force:true
    expect(rmMock.mock.calls[0]?.[1]).toMatchObject({ recursive: true, force: true })
    expect(res).toEqual({ ok: true, removedPaths: [expected] })
  })

  it('is fail-soft on a non-zero cmd exit: still removes paths + ok', async () => {
    spawnCmdMock.mockResolvedValue(spawnOk(1))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = manifestWith({
      cmd: 'claude mcp remove gsd',
      cleanup_paths: ['~/.claude/skills/gsd'],
    })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(warn).toHaveBeenCalled()
    expect(rmMock).toHaveBeenCalledTimes(1)
    expect(res).toMatchObject({ ok: true })
  })

  it('is fail-soft when the spawn seam fails (missing bash / timeout): still removes cleanup_paths', async () => {
    // e.g. a `rm -rf` cmd that needs Git Bash on a Windows host without it — the
    // cross-platform cleanup_paths fs removal must still run.
    spawnCmdMock.mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: { message: 'Git Bash is required', keyword: 'bash-missing' },
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = manifestWith({
      cmd: 'rm -rf ~/.claude/skills/gsd',
      cleanup_paths: ['~/.claude/skills/gsd'],
    })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(warn).toHaveBeenCalled()
    expect(rmMock).toHaveBeenCalledTimes(1)
    expect(res).toMatchObject({ ok: true })
  })

  it('refuses a cleanup_path outside $HOME (no rm)', async () => {
    const outside = process.platform === 'win32' ? 'C:\\Windows\\System32\\evil' : '/etc/evil'
    const m = manifestWith({ cmd: 'true', cleanup_paths: [outside] })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(res).toMatchObject({ ok: false })
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('refuses a traversal cleanup_path (no rm)', async () => {
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/../../etc/passwd'] })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(res).toMatchObject({ ok: false })
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('dry-run aborts without spawning or removing', async () => {
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/skills/gsd'] })
    const res = await runDeclaredTeardown(ctxFor(m, true))
    expect(res).toEqual({ aborted: true, reason: 'dry-run' })
    expect(spawnCmdMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('no cleanup_paths: runs cmd only, removedPaths empty', async () => {
    const m = manifestWith({ cmd: 'claude mcp remove x' })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(spawnCmdMock).toHaveBeenCalledTimes(1)
    expect(rmMock).not.toHaveBeenCalled()
    expect(res).toEqual({ ok: true, removedPaths: [] })
  })
})
