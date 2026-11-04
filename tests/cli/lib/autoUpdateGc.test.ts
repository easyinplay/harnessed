// Phase 84 / T6 — the artifact hygiene half of the auto-update (R9 / R19).
//
// Two leftovers live next to the binary:
//   `<base>.bak-*`            the previous image (Windows EPERM leftovers),
//   `.harnessed-update-<ver>` the download fragment / the smoke target.
//
// The `.part` fragment is 99 MB of garbage per version, so gc has to sweep it
// (R19) — but only the ones that can no longer be used: a fragment NEWER than
// the installed version may be a download in progress and must survive.

import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import pkg from '../../../package.json' with { type: 'json' }
import { gcCompiledArtifacts } from '../../../src/cli/gc.js'

function execDir(): { dir: string; execPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'auto-update-gc-'))
  const execPath = join(dir, 'harnessed.exe')
  writeFileSync(execPath, 'BIN')
  return { dir, execPath }
}

describe('gcCompiledArtifacts — the self-update leftovers (R9 / R19)', () => {
  it('sweeps the download fragment of an older version', async () => {
    const { dir, execPath } = execDir()
    const fragment = join(dir, '.harnessed-update-0.9.0.part')
    writeFileSync(fragment, 'bytes')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(existsSync(fragment)).toBe(false)
  })

  it('sweeps the smoke target of the installed version (it can never be used again)', async () => {
    const { dir, execPath } = execDir()
    const target = join(dir, `.harnessed-update-${pkg.version}.exe`)
    writeFileSync(target, 'bytes')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(existsSync(target)).toBe(false)
  })

  it('keeps a fragment newer than the installed version (a download may be running)', async () => {
    const { dir, execPath } = execDir()
    const fragment = join(dir, '.harnessed-update-99.0.0.part')
    writeFileSync(fragment, 'bytes')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(existsSync(fragment)).toBe(true)
  })

  it('keeps a prerelease fragment that is newer than the installed version', async () => {
    const { dir, execPath } = execDir()
    const fragment = join(dir, '.harnessed-update-99.1.0-rc.1.part')
    writeFileSync(fragment, 'bytes')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(existsSync(fragment)).toBe(true)
  })

  it('sweeps a prerelease fragment of an older version', async () => {
    const { dir, execPath } = execDir()
    const fragment = join(dir, '.harnessed-update-0.9.0-rc.1.part')
    writeFileSync(fragment, 'bytes')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(existsSync(fragment)).toBe(false)
  })

  it('sweeps every .bak-* leftover and leaves the unrelated files alone', async () => {
    const { dir, execPath } = execDir()
    writeFileSync(join(dir, 'harnessed.exe.bak-0.9.0'), 'OLD')
    writeFileSync(join(dir, 'harnessed.exe.bak-0.8.0'), 'OLDER')
    writeFileSync(join(dir, 'unrelated.txt'), 'keep me')

    const result = await gcCompiledArtifacts({
      keepVersions: [],
      stateRoot: dir,
      execPath,
      settingsPath: null,
    })

    expect(existsSync(join(dir, 'harnessed.exe.bak-0.9.0'))).toBe(false)
    expect(existsSync(join(dir, 'harnessed.exe.bak-0.8.0'))).toBe(false)
    expect(existsSync(join(dir, 'unrelated.txt'))).toBe(true)
    expect(result.removed).toContain(join(dir, 'harnessed.exe.bak-0.9.0'))
  })

  it('does nothing without an exec path (the caller opts in)', async () => {
    const { dir } = execDir()
    const fragment = join(dir, '.harnessed-update-0.9.0.part')
    writeFileSync(fragment, 'bytes')

    await gcCompiledArtifacts({
      keepVersions: [],
      stateRoot: dir,
      execPath: null,
      settingsPath: null,
    })

    expect(existsSync(fragment)).toBe(true)
  })

  it('dry-run lists the fragment but removes nothing', async () => {
    const { dir, execPath } = execDir()
    const fragment = join(dir, '.harnessed-update-0.9.0.part')
    writeFileSync(fragment, 'bytes')

    const result = await gcCompiledArtifacts({
      keepVersions: [],
      stateRoot: dir,
      execPath,
      dryRun: true,
      settingsPath: null,
    })

    expect(result.removed).toContain(fragment)
    expect(existsSync(fragment)).toBe(true)
  })

  it('leaves the exec directory clean of update leftovers', async () => {
    const { dir, execPath } = execDir()
    writeFileSync(join(dir, '.harnessed-update-0.9.0.part'), 'bytes')
    writeFileSync(join(dir, 'harnessed.exe.bak-0.9.0'), 'OLD')

    await gcCompiledArtifacts({ keepVersions: [], stateRoot: dir, execPath, settingsPath: null })

    expect(
      readdirSync(dir).filter(
        (name) => name.includes('.harnessed-update-') || name.includes('.bak-'),
      ),
    ).toEqual([])
  })
})
