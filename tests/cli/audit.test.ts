// Phase 2.4 W4 T4.2 — audit runtime-layer 5-cell unit test (B-28 + RESEARCH § 11 + PATTERNS § 1).
// Sister: tests/unit/cli-audit.test.ts (Phase 1.2 manifest-layer 4 case); this file complements
// at tests/cli/ for the Phase 2.4 runtime-layer 3 helpers in src/cli/lib/audit-helpers.ts.
// Karpathy budget: ≤100L (B-29 target ≤80 + biome multi-line carve-out sister doctor.ts B-03 pattern).

import type { SpawnSyncReturns } from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  auditInstallCmdIntegrity,
  auditOriginIntegrity,
  auditProvenance,
} from '../../src/cli/lib/audit-helpers.js'
import type { Manifest } from '../../src/manifest/schema/types.js'

const spawnSyncMock = vi.mocked(spawnSync)
const readFileSyncMock = vi.mocked(readFileSync)

// Strongly-typed spawnSync stub (avoids `as any` — biome ignore would be misplaced by multi-line expand).
const ssOk = (stdout: string): SpawnSyncReturns<string> =>
  ({ status: 0, stdout, stderr: '' }) as SpawnSyncReturns<string>
const ssFail = (stderr: string): SpawnSyncReturns<string> =>
  ({ status: 1, stdout: '', stderr }) as SpawnSyncReturns<string>

function stubManifest(name: string, repo: string, cmd: string): Manifest {
  return {
    metadata: { name, upstream: { repository: repo } },
    spec: { install: { cmd } },
  } as unknown as Manifest
}

describe('audit runtime-layer (Phase 2.4 W4 T4.2)', () => {
  it('cell 1: origin URL drift → level=error finding (B-28 hard-fail mode)', () => {
    readFileSyncMock.mockReturnValue(
      JSON.stringify({ repository: { url: 'https://github.com/expected/repo.git' } }),
    )
    spawnSyncMock.mockReturnValue(ssOk('https://github.com/tampered/repo.git\n'))
    const findings = auditOriginIntegrity('/fake/cwd')
    expect(findings).toHaveLength(1)
    expect(findings[0]?.level).toBe('error') // allowFork=false → drift = fail (not warn)
    expect(findings[0]?.field).toBe('/git/remote/origin')
  })

  it('cell 2: install.cmd with `;` shell separator → level=error injection finding', () => {
    const m = stubManifest('evil', 'https://github.com/foo/evil.git', 'npm install evil; rm -rf /')
    const findings = auditInstallCmdIntegrity(m)
    expect(findings.some((f) => f.level === 'error' && f.detail.includes('shell separator'))).toBe(
      true,
    )
  })

  it('cell 3: upstream github.com/foo/bar + npm install bar-evil → level=warn cross-check mismatch', () => {
    const m = stubManifest('mismatched', 'https://github.com/foo/bar.git', 'npm install bar-evil')
    const findings = auditInstallCmdIntegrity(m)
    const warn = findings.find((f) => f.level === 'warn' && f.field === '/spec/install/cmd')
    expect(warn).toBeDefined()
    expect(warn?.detail).toContain('bar-evil')
    expect(warn?.detail).toContain("'bar'")
  })

  it('cell 4: scripts/check-provenance.mjs fail → level=error provenance finding', () => {
    spawnSyncMock.mockReturnValue(ssFail('provenance violation: missing sibling\n'))
    const findings = auditProvenance()
    expect(findings).toHaveLength(1)
    expect(findings[0]?.level).toBe('error')
    expect(findings[0]?.detail).toContain('provenance violation')
  })

  it('cell 5 (pass-path verify): origin URL match + clean manifest → no findings', () => {
    readFileSyncMock.mockReturnValue(
      JSON.stringify({ repository: 'https://github.com/expected/repo.git' }),
    )
    spawnSyncMock.mockReturnValue(ssOk('https://github.com/expected/repo.git\n'))
    expect(auditOriginIntegrity('/fake/cwd')).toEqual([])
    const m = stubManifest('clean', 'https://github.com/foo/clean.git', 'npm install clean')
    expect(auditInstallCmdIntegrity(m)).toEqual([])
  })
})
