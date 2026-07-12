// 4.27.0 (B3 Slice 1, T2) — compiled-binary self-update engine. TDD red-first.
//
// Contract source: CEO plan ~/.gstack/projects/easyinplay-harnessed/ceo-plans/
// 2026-07-12-b5-phase3-slice1.md — atomic sequence: download to same-dir temp
// (pid-unique, .exe suffix on win32) → sha256 verify (per-asset .sha256) →
// chmod → smoke → in-place rename to .bak-<oldver> (same volume) → temp→exec →
// copy (not move) .bak to <stateRoot>/bin-backup/<oldver>/ → delete .bak
// fail-soft (skip delete when the backup copy failed — the .bak IS the net).
// Any pre-swap failure leaves the original untouched; a failed temp→exec rename
// rolls back from .bak. Real fs against tmpdirs; failure injection via fsOps.

import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assetNameFor,
  runBinarySelfUpdate,
  type SelfUpdateDeps,
} from '../../../src/cli/lib/selfUpdateBinary.js'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Build a tmp world: exec file + local source dir with a "new binary" + .sha256. */
function world(opts?: {
  newContent?: string
  shaOverride?: string
  omitAsset?: boolean
  omitSha?: boolean
  platform?: string
  arch?: string
}) {
  const platform = opts?.platform ?? 'linux'
  const arch = opts?.arch ?? 'x64'
  const dir = mkdtempSync(join(tmpdir(), 'selfupd-exec-'))
  const srcDir = mkdtempSync(join(tmpdir(), 'selfupd-src-'))
  const stateRoot = mkdtempSync(join(tmpdir(), 'selfupd-state-'))
  const asset = assetNameFor(platform, arch)
  const execPath = join(dir, asset)
  writeFileSync(execPath, 'OLD-BINARY')
  const newContent = opts?.newContent ?? 'NEW-BINARY'
  if (!opts?.omitAsset) writeFileSync(join(srcDir, asset), newContent)
  if (!opts?.omitSha) {
    writeFileSync(
      join(srcDir, `${asset}.sha256`),
      `${opts?.shaOverride ?? sha256(newContent)}  ${asset}\n`,
    )
  }
  const logs: string[] = []
  const deps: SelfUpdateDeps = {
    execPath,
    platform,
    arch,
    currentVersion: '4.26.0',
    sourceDir: srcDir,
    resolveRelease: async () => null,
    downloadTo: async () => {
      throw new Error('network must not be touched in sourceDir mode')
    },
    fetchShaText: async () => {
      throw new Error('network must not be touched in sourceDir mode')
    },
    smoke: async () => '4.27.0',
    stateRoot: () => stateRoot,
    log: (l) => logs.push(l),
    pid: 4242,
  }
  return { dir, srcDir, stateRoot, execPath, asset, deps, logs }
}

describe('assetNameFor (frozen asset-name contract)', () => {
  it('maps the three release platforms', () => {
    expect(assetNameFor('win32', 'x64')).toBe('harnessed-windows-x64.exe')
    expect(assetNameFor('darwin', 'arm64')).toBe('harnessed-darwin-arm64')
    expect(assetNameFor('linux', 'x64')).toBe('harnessed-linux-x64')
  })
})

describe('runBinarySelfUpdate — safety valve', () => {
  it('refuses when execPath lives under node_modules (npm-managed)', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      { ...w.deps, execPath: join(w.dir, 'node_modules', '.bin', 'harnessed') },
      {},
    )
    expect(r.status).toBe('refused')
  })
})

describe('runBinarySelfUpdate — dry-run (zero writes)', () => {
  it('prints a step preview and touches nothing', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(w.deps, { dryRun: true })
    expect(r.status).toBe('dry-run')
    if (r.status !== 'dry-run') return
    const joined = r.steps.join('\n')
    expect(joined).toMatch(/download|copy/i)
    expect(joined).toMatch(/sha256/i)
    expect(joined).toMatch(/\.bak-4\.26\.0/)
    expect(joined).toContain('bin-backup')
    // zero writes: exec unchanged, no temp/bak siblings
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
    const names = await readdir(w.dir)
    expect(names).toEqual([w.asset])
  })

  it('win32 temp name carries .exe (spawnability of the smoke step)', async () => {
    const w = world({ platform: 'win32' })
    const r = await runBinarySelfUpdate(w.deps, { dryRun: true })
    expect(r.status).toBe('dry-run')
    if (r.status !== 'dry-run') return
    expect(r.steps.join('\n')).toMatch(/\.harnessed-update-4242\.exe/)
  })
})

describe('runBinarySelfUpdate — sourceDir swap (happy path)', () => {
  it('replaces the exec, keeps a bin-backup copy, reports versions', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(w.deps, {})
    expect(r.status).toBe('updated')
    if (r.status !== 'updated') return
    expect(r.from).toBe('4.26.0')
    expect(r.to).toBe('4.27.0')
    expect(readFileSync(w.execPath, 'utf8')).toBe('NEW-BINARY')
    // E4 rollback net: old content preserved under bin-backup/<oldver>/
    const backup = join(w.stateRoot, 'bin-backup', '4.26.0', w.asset)
    expect(readFileSync(backup, 'utf8')).toBe('OLD-BINARY')
    // .bak removed on a plain-file unix-semantics fs
    expect(existsSync(join(w.dir, `${w.asset}.bak-4.26.0`))).toBe(false)
  })
})

describe('runBinarySelfUpdate — pre-swap failures leave the original untouched', () => {
  it('sha mismatch → error, temp cleaned, exec unchanged', async () => {
    const w = world({ shaOverride: 'deadbeef'.repeat(8) })
    const r = await runBinarySelfUpdate(w.deps, {})
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
    expect(await readdir(w.dir)).toEqual([w.asset])
  })

  it('smoke failure → error, temp cleaned, exec unchanged', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      { ...w.deps, smoke: async () => Promise.reject(new Error('spawn EACCES')) },
      {},
    )
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
    expect(await readdir(w.dir)).toEqual([w.asset])
  })

  it('missing source asset → actionable error, exec unchanged', async () => {
    const w = world({ omitAsset: true })
    const r = await runBinarySelfUpdate(w.deps, {})
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
  })

  it('missing .sha256 → error (integrity is contractual), exec unchanged', async () => {
    const w = world({ omitSha: true })
    const r = await runBinarySelfUpdate(w.deps, {})
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
  })
})

describe('runBinarySelfUpdate — swap failure rollback', () => {
  it('temp→exec rename failure rolls the .bak back into place', async () => {
    const w = world()
    let renames = 0
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        fsOps: {
          rename: async (from: string, to: string) => {
            renames++
            // 1st rename = exec→bak (allow); 2nd = temp→exec (fail); 3rd = rollback bak→exec (allow)
            if (renames === 2) throw new Error('EACCES injected')
            const { rename } = await import('node:fs/promises')
            return rename(from, to)
          },
        },
      },
      {},
    )
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY') // rolled back
  })
})

describe('runBinarySelfUpdate — post-swap fail-soft', () => {
  it('bin-backup copy failure → still updated, .bak kept (skip delete), warn logged', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        fsOps: {
          copyFile: async () => {
            throw new Error('ENOSPC injected')
          },
        },
      },
      {},
    )
    expect(r.status).toBe('updated')
    if (r.status !== 'updated') return
    expect(r.bakRemoved).toBe(false)
    expect(readFileSync(join(w.dir, `${w.asset}.bak-4.26.0`), 'utf8')).toBe('OLD-BINARY')
    expect(readFileSync(w.execPath, 'utf8')).toBe('NEW-BINARY')
  })

  it('.bak delete failure (Windows EPERM on the running image) → still updated', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        fsOps: {
          unlink: async () => {
            throw new Error('EPERM injected')
          },
        },
      },
      {},
    )
    expect(r.status).toBe('updated')
    if (r.status !== 'updated') return
    expect(r.bakRemoved).toBe(false)
    // backup copy still succeeded
    expect(existsSync(join(w.stateRoot, 'bin-backup', '4.26.0', w.asset))).toBe(true)
  })
})

describe('runBinarySelfUpdate — GitHub mode (no sourceDir)', () => {
  it('release unreachable → actionable error naming the npm fallback channel', async () => {
    const w = world()
    const r = await runBinarySelfUpdate({ ...w.deps, sourceDir: null }, {})
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message.toLowerCase()).toMatch(/github|release/)
    expect(r.message).toContain('npm')
  })

  it('missing platform asset (404 / publish window) → error, no fallback to older releases', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        sourceDir: null,
        resolveRelease: async () => ({
          error: 'asset harnessed-linux-x64 not found on latest release',
        }),
      },
      {},
    )
    expect(r.status).toBe('error')
    expect(readFileSync(w.execPath, 'utf8')).toBe('OLD-BINARY')
  })

  it('already current → status current, zero writes', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        sourceDir: null,
        resolveRelease: async () => ({
          version: '4.26.0',
          assetUrl: 'https://x/a',
          shaUrl: 'https://x/a.sha256',
        }),
      },
      {},
    )
    expect(r.status).toBe('current')
    expect(await readdir(w.dir)).toEqual([w.asset])
  })

  it('--check reports without installing', async () => {
    const w = world()
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        sourceDir: null,
        resolveRelease: async () => ({
          version: '9.9.9',
          assetUrl: 'https://x/a',
          shaUrl: 'https://x/a.sha256',
        }),
      },
      { check: true },
    )
    expect(r.status).toBe('checked')
    if (r.status !== 'checked') return
    expect(r.installed).toBe('4.26.0')
    expect(r.latest).toBe('9.9.9')
    expect(await readdir(w.dir)).toEqual([w.asset])
  })

  it('downloads via injected net when behind, then swaps', async () => {
    const w = world()
    const newContent = 'NET-BINARY'
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        sourceDir: null,
        resolveRelease: async () => ({
          version: '4.27.0',
          assetUrl: 'https://gh/asset',
          shaUrl: 'https://gh/asset.sha256',
        }),
        downloadTo: async (_url: string, dest: string) => {
          await mkdir(join(dest, '..'), { recursive: true })
          writeFileSync(dest, newContent)
        },
        fetchShaText: async () => `${sha256(newContent)}  ${w.asset}\n`,
        smoke: async () => '4.27.0',
      },
      {},
    )
    expect(r.status).toBe('updated')
    expect(readFileSync(w.execPath, 'utf8')).toBe(newContent)
  })
})
