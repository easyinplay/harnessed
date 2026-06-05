// v5.0 Spec 1 Phase 3 — unit tests for the evidence guard (TDD red→green).
//
// evidence.ts is the only fs/crypto touch of the state-machine core: it locates a
// flattened sub's leaf workflow.yaml, reads `phases[].artifacts_expected`, and
// checks/hashes each declared artifact. Tests inject a tmpdir `packageRoot` so they
// never depend on the real `workflows/` tree (isolation per design §11).

import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkArtifacts, detectDrift, hashFile } from '../../src/checkpoint/evidence.js'
import type { EvidenceRefType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-evidence-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex')

/** Write a leaf workflow.yaml for a flattened sub name `<stage>-<leaf>` under
 *  `<root>/workflows/<stage>/<leaf>/workflow.yaml` with the given artifacts. */
function writeLeaf(sub: string, artifactsByPhase: string[][]): void {
  const dash = sub.indexOf('-')
  const stage = sub.slice(0, dash)
  const leaf = sub.slice(dash + 1)
  const dir = join(root, 'workflows', stage, leaf)
  mkdirSync(dir, { recursive: true })
  const phases = artifactsByPhase
    .map((arts, i) => {
      const list = arts.length ? `\n    artifacts_expected: [${arts.join(', ')}]` : ''
      return `  - id: 0${i + 1}-x\n    name: phase ${i}${list}`
    })
    .join('\n')
  writeFileSync(
    join(dir, 'workflow.yaml'),
    `schema_version: harnessed.workflow.v3\nworkflow: ${sub}\nphases:\n${phases}\n`,
    'utf8',
  )
}

/** Write an artifact file at a path relative to `root` and return its abs path. */
function writeArtifact(rel: string, content: string): string {
  const abs = join(root, rel)
  mkdirSync(join(abs, '..'), { recursive: true })
  writeFileSync(abs, content, 'utf8')
  return abs
}

describe('hashFile', () => {
  it('returns the known sha256 hex of a file content', async () => {
    const abs = writeArtifact('hash-me.txt', 'hello evidence')
    expect(await hashFile(abs)).toBe(sha256('hello evidence'))
  })
})

describe('checkArtifacts', () => {
  it('returns none_declared when the leaf has no artifacts_expected', async () => {
    writeLeaf('task-code', [[]])
    const r = await checkArtifacts('task-code', root)
    expect(r.status).toBe('none_declared')
    expect(r.found).toEqual([])
    expect(r.missing).toEqual([])
  })

  it('returns verified with sha256 when all declared artifacts are present', async () => {
    writeLeaf('verify-code-review', [['report.md']])
    writeArtifact('report.md', 'the report')
    const r = await checkArtifacts('verify-code-review', root)
    expect(r.status).toBe('verified')
    expect(r.missing).toEqual([])
    expect(r.found).toEqual([{ path: 'report.md', sha256: sha256('the report') }])
  })

  it('flattens artifacts_expected across multiple phases', async () => {
    writeLeaf('task-code', [['a.md'], ['b.md']])
    writeArtifact('a.md', 'A')
    writeArtifact('b.md', 'B')
    const r = await checkArtifacts('task-code', root)
    expect(r.status).toBe('verified')
    expect(r.found.map((e) => e.path).sort()).toEqual(['a.md', 'b.md'])
  })

  it('lists missing artifacts and still records found ones', async () => {
    writeLeaf('task-code', [['present.md', 'gone.md']])
    writeArtifact('present.md', 'here')
    const r = await checkArtifacts('task-code', root)
    expect(r.missing).toEqual(['gone.md'])
    expect(r.found).toEqual([{ path: 'present.md', sha256: sha256('here') }])
    expect(r.status).not.toBe('verified')
  })
})

describe('detectDrift', () => {
  it('detects a mutated file (sha mismatch)', async () => {
    const abs = writeArtifact('drift.md', 'original')
    const stored: EvidenceRefType[] = [{ path: abs, sha256: sha256('original') }]
    writeFileSync(abs, 'mutated', 'utf8')
    const drift = await detectDrift(stored)
    expect(drift).toHaveLength(1)
    expect(drift[0]?.path).toBe(abs)
    expect(drift[0]?.was).toBe(sha256('original'))
    expect(drift[0]?.now).toBe(sha256('mutated'))
  })

  it('returns empty when nothing changed', async () => {
    const abs = writeArtifact('stable.md', 'same')
    const stored: EvidenceRefType[] = [{ path: abs, sha256: sha256('same') }]
    expect(await detectDrift(stored)).toEqual([])
  })

  it('flags a deleted file as drift', async () => {
    const abs = writeArtifact('deleted.md', 'bye')
    const stored: EvidenceRefType[] = [{ path: abs, sha256: sha256('bye') }]
    unlinkSync(abs)
    const drift = await detectDrift(stored)
    expect(drift).toHaveLength(1)
    expect(drift[0]?.path).toBe(abs)
    expect(drift[0]?.was).toBe(sha256('bye'))
    expect(drift[0]?.now).toBe('')
  })
})
