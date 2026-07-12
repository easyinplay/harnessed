// 4.27.0 (B3 Slice 1, T5) — compiled-artifact gc: assets/<ver> keep-set
// {running version, newly installed version}, bin-backup keeps newest 1,
// same-dir `<exec>.bak-*` sweep (Windows EPERM leftovers from self-update).
// entry.ts re-unpacks missing assets on next start, so an over-eager delete
// self-heals — but the keep-set is still contractual (CEO plan rev2 issue 5).

import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gcCompiledArtifacts } from '../../src/cli/gc.js'

function world() {
  const stateRoot = mkdtempSync(join(tmpdir(), 'gc-state-'))
  const execDir = mkdtempSync(join(tmpdir(), 'gc-exec-'))
  for (const v of ['0.9.0', '1.0.0', '2.0.0']) {
    mkdirSync(join(stateRoot, 'assets', v), { recursive: true })
    writeFileSync(join(stateRoot, 'assets', v, 'marker.txt'), v)
  }
  for (const v of ['0.8.0', '0.9.0']) {
    mkdirSync(join(stateRoot, 'bin-backup', v), { recursive: true })
    writeFileSync(join(stateRoot, 'bin-backup', v, 'harnessed'), v)
  }
  const execPath = join(execDir, 'harnessed.exe')
  writeFileSync(execPath, 'BIN')
  writeFileSync(join(execDir, 'harnessed.exe.bak-0.9.0'), 'OLDBIN')
  writeFileSync(join(execDir, 'unrelated.txt'), 'keep me')
  return { stateRoot, execDir, execPath }
}

describe('gcCompiledArtifacts', () => {
  it('removes assets outside the keep-set, keeps bin-backup newest 1, sweeps .bak-*', async () => {
    const w = world()
    const r = await gcCompiledArtifacts({
      keepVersions: ['1.0.0', '2.0.0'],
      stateRoot: w.stateRoot,
      execPath: w.execPath,
    })
    expect(existsSync(join(w.stateRoot, 'assets', '0.9.0'))).toBe(false)
    expect(existsSync(join(w.stateRoot, 'assets', '1.0.0'))).toBe(true)
    expect(existsSync(join(w.stateRoot, 'assets', '2.0.0'))).toBe(true)
    // bin-backup: newest (0.9.0) kept, older removed
    expect(existsSync(join(w.stateRoot, 'bin-backup', '0.9.0'))).toBe(true)
    expect(existsSync(join(w.stateRoot, 'bin-backup', '0.8.0'))).toBe(false)
    // .bak sweep, unrelated files untouched
    expect(existsSync(join(w.execDir, 'harnessed.exe.bak-0.9.0'))).toBe(false)
    expect(existsSync(join(w.execDir, 'unrelated.txt'))).toBe(true)
    expect(existsSync(w.execPath)).toBe(true)
    expect(r.removed.length).toBeGreaterThanOrEqual(3)
  })

  it('dry-run lists candidates but removes nothing', async () => {
    const w = world()
    const r = await gcCompiledArtifacts({
      keepVersions: ['1.0.0'],
      stateRoot: w.stateRoot,
      execPath: w.execPath,
      dryRun: true,
    })
    expect(r.removed.length).toBeGreaterThanOrEqual(3)
    expect(existsSync(join(w.stateRoot, 'assets', '0.9.0'))).toBe(true)
    expect(existsSync(join(w.execDir, 'harnessed.exe.bak-0.9.0'))).toBe(true)
  })

  it('missing dirs → no-op (fail-soft), empty result', async () => {
    const stateRoot = join(mkdtempSync(join(tmpdir(), 'gc-empty-')), 'nope')
    const r = await gcCompiledArtifacts({ keepVersions: ['1.0.0'], stateRoot, execPath: null })
    expect(r.removed).toEqual([])
  })
})
