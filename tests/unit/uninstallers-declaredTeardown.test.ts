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
const lstatMock = vi.fn(async (_p: string) => ({ isDirectory: () => true }))
const accessMock = vi.fn(async (_p: string): Promise<void> => {
  throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
})
vi.mock('node:fs/promises', () => ({
  rm: (p: string, o?: unknown) => rmMock(p, o),
  lstat: (p: string) => lstatMock(p),
  access: (p: string) => accessMock(p),
}))
const prepareOwnedPathRemovalMock = vi.fn()
const assertOwnedPathUnchangedMock = vi.fn<(snapshot: unknown) => Promise<void>>(
  async () => undefined,
)
const removeOwnedDirectoryViaQuarantineMock = vi.fn<(snapshot: unknown) => Promise<void>>(
  async () => undefined,
)
const removeOwnedFileViaQuarantineMock = vi.fn<(snapshot: unknown) => Promise<void>>(
  async () => undefined,
)
vi.mock('../../src/lib/quarantineDelete.js', () => ({
  prepareOwnedPathRemoval: (root: string, target: string) =>
    prepareOwnedPathRemovalMock(root, target),
  assertOwnedPathUnchanged: (snapshot: unknown) => assertOwnedPathUnchangedMock(snapshot),
  removeOwnedDirectoryViaQuarantine: (snapshot: unknown) =>
    removeOwnedDirectoryViaQuarantineMock(snapshot),
  removeOwnedFileViaQuarantine: (snapshot: unknown) => removeOwnedFileViaQuarantineMock(snapshot),
}))
const readReceiptMock = vi.fn()
const removeReceiptMock = vi.fn(async () => undefined)
const removeOwnedSkillPathMock = vi.fn(async (_receipt: unknown, _path: string) => undefined)
const verifyOwnedSkillPathMock = vi.fn(async (_receipt: unknown, _path: string) => undefined)
const writeReceiptMock = vi.fn(
  async (_ctx: unknown, _roots: readonly string[], _paths: readonly string[]) => undefined,
)
vi.mock('../../src/installers/lib/skillOwnershipReceipt.js', () => ({
  isSkillOwnershipManaged: (manifest: Manifest) => {
    const install = manifest.spec.install
    return (
      install.method === 'npx-skill-installer' ||
      (install as { installs_skills?: unknown }).installs_skills !== undefined
    )
  },
  readSkillOwnershipReceipt: (ctx: unknown) => readReceiptMock(ctx),
  removeOwnedSkillPath: (receipt: unknown, path: string) => removeOwnedSkillPathMock(receipt, path),
  removeSkillOwnershipReceipt: (_ctx: unknown) => removeReceiptMock(),
  verifyOwnedSkillPath: (receipt: unknown, path: string) => verifyOwnedSkillPathMock(receipt, path),
  writeSkillOwnershipReceipt: (ctx: unknown, roots: readonly string[], paths: readonly string[]) =>
    writeReceiptMock(ctx, roots, paths),
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
  lstatMock.mockReset().mockResolvedValue({ isDirectory: () => true })
  accessMock.mockReset().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  readReceiptMock.mockReset()
  removeOwnedSkillPathMock.mockReset().mockResolvedValue(undefined)
  removeReceiptMock.mockReset().mockResolvedValue(undefined)
  verifyOwnedSkillPathMock.mockReset().mockResolvedValue(undefined)
  writeReceiptMock.mockReset().mockResolvedValue(undefined)
  spawnCmdMock.mockResolvedValue(spawnOk())
  rmMock.mockResolvedValue(undefined)
  prepareOwnedPathRemovalMock.mockReset().mockImplementation((root: string, target: string) => ({
    root,
    target,
    canonicalRoot: resolvePath(root),
    canonicalTarget: resolvePath(target),
    isDirectory: true,
    device: 1,
    inode: 1,
  }))
  assertOwnedPathUnchangedMock.mockReset().mockResolvedValue(undefined)
  removeOwnedDirectoryViaQuarantineMock.mockReset().mockResolvedValue(undefined)
  removeOwnedFileViaQuarantineMock.mockReset().mockResolvedValue(undefined)
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
  it('removes only receipt-owned skill paths without running the declared cmd', async () => {
    const target = resolvePath(join(homedir(), '.claude/skills/gsd-plan-phase'))
    const root = resolvePath(join(target, '..'))
    const m = manifestWith({ cmd: 'dangerous-upstream-uninstall', cleanup_paths: [] })
    ;(m.spec.install as { installs_skills?: string[] }).installs_skills = []
    readReceiptMock.mockResolvedValue({ createdPaths: [target], skillRoots: [root] })

    const res = await runDeclaredTeardown(ctxFor(m))

    expect(spawnCmdMock).not.toHaveBeenCalled()
    expect(verifyOwnedSkillPathMock).toHaveBeenCalledOnce()
    expect(removeOwnedSkillPathMock).toHaveBeenCalledWith(expect.anything(), target)
    expect(rmMock).not.toHaveBeenCalled()
    expect(writeReceiptMock).not.toHaveBeenCalled()
    expect(removeReceiptMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ ok: true, removedPaths: [target] })
  })

  it('fails closed before side effects when receipt validation rejects an injected skill root', async () => {
    const m = manifestWith({ cmd: 'dangerous-upstream-uninstall', cleanup_paths: [] })
    ;(m.spec.install as { installs_skills?: string[] }).installs_skills = []
    readReceiptMock.mockRejectedValue(
      new Error('skill ownership receipt has an injected root; repair or reinstall'),
    )

    const res = await runDeclaredTeardown(ctxFor(m))

    expect(res).toMatchObject({ ok: false, phase: 'preflight' })
    expect('error' in res && res.error).toMatch(/repair or reinstall/i)
    expect(spawnCmdMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('fails verification and retains the receipt when a removed path still exists', async () => {
    const target = resolvePath(join(homedir(), '.claude/skills/gsd-plan-phase'))
    const root = resolvePath(join(target, '..'))
    const m = manifestWith({ cmd: 'dangerous-upstream-uninstall', cleanup_paths: [] })
    ;(m.spec.install as { installs_skills?: string[] }).installs_skills = []
    readReceiptMock.mockResolvedValue({ createdPaths: [target], skillRoots: [root] })
    removeOwnedSkillPathMock.mockRejectedValue(new Error('quarantine verification failed'))

    const res = await runDeclaredTeardown(ctxFor(m))

    expect(res).toMatchObject({ ok: false, phase: 'verify' })
    expect(removeReceiptMock).not.toHaveBeenCalled()
  })

  it('persists remaining receipt paths after partial failure so retry skips removed paths', async () => {
    const root = resolvePath(join(homedir(), '.claude/skills'))
    const first = resolvePath(join(root, 'gsd-plan-phase'))
    const second = resolvePath(join(root, 'gsd-execute-phase'))
    const m = manifestWith({ cmd: 'dangerous-upstream-uninstall', cleanup_paths: [] })
    ;(m.spec.install as { installs_skills?: string[] }).installs_skills = []
    let receipt = { createdPaths: [first, second], skillRoots: [root] }
    readReceiptMock.mockImplementation(async () => receipt)
    writeReceiptMock.mockImplementation(async (_ctx, roots, paths) => {
      receipt = { createdPaths: [...paths], skillRoots: [...roots] }
    })
    let secondRemovalAttempts = 0
    removeOwnedSkillPathMock.mockImplementation(async (_receipt, path) => {
      if (path === second && secondRemovalAttempts++ === 0) {
        throw new Error('quarantine verification failed')
      }
    })

    const firstAttempt = await runDeclaredTeardown(ctxFor(m))
    const retry = await runDeclaredTeardown(ctxFor(m))

    expect(firstAttempt).toMatchObject({ ok: false, phase: 'verify' })
    expect(writeReceiptMock).toHaveBeenCalledWith(expect.anything(), [root], [second])
    expect(removeOwnedSkillPathMock.mock.calls.map((call) => call[1])).toEqual([
      first,
      second,
      second,
    ])
    expect(verifyOwnedSkillPathMock.mock.calls.map((call) => call[1])).toEqual([
      first,
      second,
      second,
    ])
    expect(removeReceiptMock).toHaveBeenCalledTimes(1)
    expect(retry).toEqual({ ok: true, removedPaths: [second] })
  })

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
    expect(removeOwnedDirectoryViaQuarantineMock).toHaveBeenCalledTimes(1)
    expect(removeOwnedDirectoryViaQuarantineMock.mock.calls[0]?.[0]).toMatchObject({
      target: expected,
      root: resolvePath(join(expected, '..')),
      isDirectory: true,
    })
    expect(rmMock).not.toHaveBeenCalled()
    expect(res).toEqual({ ok: true, removedPaths: [expected] })
  })

  it('quarantines an ordinary file before non-recursive removal', async () => {
    prepareOwnedPathRemovalMock.mockImplementation((root: string, target: string) => ({
      root,
      target,
      canonicalRoot: resolvePath(root),
      canonicalTarget: resolvePath(target),
      isDirectory: false,
      device: 2,
      inode: 3,
    }))
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/state.json'] })
    const res = await runDeclaredTeardown(ctxFor(m))
    const expected = resolvePath(join(homedir(), '.claude/state.json'))

    expect(removeOwnedFileViaQuarantineMock).toHaveBeenCalledWith(
      expect.objectContaining({ target: expected, isDirectory: false }),
    )
    expect(assertOwnedPathUnchangedMock).not.toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
    expect(res).toEqual({ ok: true, removedPaths: [expected] })
  })

  it('fails closed when a directory identity changes before quarantine deletion', async () => {
    removeOwnedDirectoryViaQuarantineMock.mockRejectedValue(
      new Error('refusing quarantined path identity changed after preflight'),
    )
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/skills/gsd'] })

    const res = await runDeclaredTeardown(ctxFor(m))

    expect(res).toMatchObject({ ok: false, phase: 'verify' })
    expect('error' in res && res.error).toMatch(/identity changed/i)
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('fails closed when an absent cleanup path appears after preflight', async () => {
    prepareOwnedPathRemovalMock.mockRejectedValue(
      Object.assign(new Error('missing during preflight'), { code: 'ENOENT' }),
    )
    lstatMock.mockResolvedValue({ isDirectory: () => true })
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/skills/late-path'] })

    const res = await runDeclaredTeardown(ctxFor(m))

    expect(res).toMatchObject({ ok: false, phase: 'verify' })
    expect('error' in res && res.error).toMatch(/appeared after preflight/i)
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('removes cleanup paths after a non-zero cmd exit but preserves final failure', async () => {
    spawnCmdMock.mockResolvedValue(spawnOk(1))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = manifestWith({
      cmd: 'claude mcp remove gsd',
      cleanup_paths: ['~/.claude/skills/gsd'],
    })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(warn).toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).toHaveBeenCalledTimes(1)
    expect(rmMock).not.toHaveBeenCalled()
    expect(res).toMatchObject({ ok: false, phase: 'spawn' })
  })

  it('removes cleanup paths after a spawn seam failure but preserves final failure', async () => {
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
    expect(removeOwnedDirectoryViaQuarantineMock).toHaveBeenCalledTimes(1)
    expect(rmMock).not.toHaveBeenCalled()
    expect(res).toMatchObject({ ok: false, phase: 'spawn' })
  })

  it('refuses a cleanup_path outside $HOME (no rm)', async () => {
    const outside = process.platform === 'win32' ? 'C:\\Windows\\System32\\evil' : '/etc/evil'
    const m = manifestWith({ cmd: 'true', cleanup_paths: [outside] })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(res).toMatchObject({ ok: false })
    expect(rmMock).not.toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
  })

  it('refuses a traversal cleanup_path (no rm)', async () => {
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/../../etc/passwd'] })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(res).toMatchObject({ ok: false })
    expect(rmMock).not.toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
  })

  it('dry-run aborts without spawning or removing', async () => {
    const m = manifestWith({ cmd: 'true', cleanup_paths: ['~/.claude/skills/gsd'] })
    const res = await runDeclaredTeardown(ctxFor(m, true))
    expect(res).toEqual({ aborted: true, reason: 'dry-run' })
    expect(spawnCmdMock).not.toHaveBeenCalled()
    expect(rmMock).not.toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
  })

  it('no cleanup_paths: runs cmd only, removedPaths empty', async () => {
    const m = manifestWith({ cmd: 'claude mcp remove x' })
    const res = await runDeclaredTeardown(ctxFor(m))
    expect(spawnCmdMock).toHaveBeenCalledTimes(1)
    expect(rmMock).not.toHaveBeenCalled()
    expect(removeOwnedDirectoryViaQuarantineMock).not.toHaveBeenCalled()
    expect(res).toEqual({ ok: true, removedPaths: [] })
  })
})
