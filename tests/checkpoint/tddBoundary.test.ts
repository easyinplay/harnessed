// T2.7 D-4 — boundary for the `tdd-evidence.md` done-criterion.
//
// ECC论据 D (`skills/loop-design-check/SKILL.md:105`, the worst-collapse row):
//   (worst) Only gates on "all tests pass" → agent deletes the tests
//   | Is there a boundary ("what it must NOT do")? Or only a done-criterion?
//   | Done-criterion + boundary together
// and its fix example (:121): `all tests green AND no test file deleted or weakened
// AND coverage not lowered AND a change-list produced`.
//
// 4.33.0 shipped `artifacts_expected: [tdd-evidence.md]` — a PURE done-criterion.
// "Write a tdd-evidence.md" is itself gameable (empty file / boilerplate / a
// fabricated red→green record written while the tests were deleted). These are the
// boundary checks. Per ECC `delivery-gate/SKILL.md:28`, regex heuristics WARN and
// never block (they misfire); only mechanically decidable facts block.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type BoundaryFinding,
  checkTddBoundary,
  isTddEvidencePath,
  TDD_EVIDENCE_ARTIFACT,
} from '../../src/checkpoint/tddBoundary.js'

const blocks = (f: BoundaryFinding[]) => f.filter((x) => x.kind === 'block').map((x) => x.id)
const warns = (f: BoundaryFinding[]) => f.filter((x) => x.kind === 'warn').map((x) => x.id)

const RED_GREEN = [
  '# TDD evidence',
  '',
  '## Red',
  '`vitest run tests/foo.test.ts` → 1 failing: expected 3, received undefined.',
  '',
  '## Green',
  'After the implementation the same command passes: 1 passed.',
  '',
].join('\n')

describe('isTddEvidencePath', () => {
  it('matches the declared artifact by basename, anywhere it landed', () => {
    expect(isTddEvidencePath(`/proj/.planning/phases/52-x/${TDD_EVIDENCE_ARTIFACT}`)).toBe(true)
    expect(isTddEvidencePath(`C:\\proj\\${TDD_EVIDENCE_ARTIFACT}`)).toBe(true)
    expect(isTddEvidencePath('/proj/findings.md')).toBe(false)
  })
})

describe('checkTddBoundary — content boundaries (no git involved)', () => {
  let cwd: string
  let evidence: string

  beforeEach(() => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'harnessed-tddb-')))
    evidence = join(cwd, TDD_EVIDENCE_ARTIFACT)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('B1 blocks an empty artifact (the cheapest way to satisfy a pure done-criterion)', async () => {
    writeFileSync(evidence, '')
    expect(blocks(await checkTddBoundary(cwd, evidence))).toContain('evidence-empty')
  })

  it('B1 blocks a heading-only artifact (boilerplate, zero content)', async () => {
    writeFileSync(evidence, '# TDD evidence\n\n\n')
    expect(blocks(await checkTddBoundary(cwd, evidence))).toContain('evidence-empty')
  })

  it('B2 blocks a substantive artifact that records neither side nor a skip', async () => {
    writeFileSync(
      evidence,
      '# TDD evidence\n\nEverything is done and the subtask is complete as requested.\n',
    )
    const f = await checkTddBoundary(cwd, evidence)
    expect(blocks(f)).toContain('evidence-one-sided')
    expect(blocks(f)).not.toContain('evidence-empty')
  })

  it('B2 accepts a red→green record', async () => {
    writeFileSync(evidence, RED_GREEN)
    expect(blocks(await checkTddBoundary(cwd, evidence))).toEqual([])
  })

  it('B2 accepts an explicit SKIPPED declaration WITH a reason (the tdd-gate skip branch)', async () => {
    writeFileSync(
      evidence,
      '# TDD evidence\n\nSKIPPED — ui_polish only: CSS token rename, no core logic touched.\n',
    )
    expect(blocks(await checkTddBoundary(cwd, evidence))).toEqual([])
  })

  it('B2 blocks a bare SKIPPED with no reason (the declaration protocol requires one)', async () => {
    writeFileSync(evidence, '# TDD evidence\n\nSKIPPED\n\nnothing else to say about this one.\n')
    expect(blocks(await checkTddBoundary(cwd, evidence))).toContain('evidence-one-sided')
  })

  it('missing artifact → no findings (checkArtifacts already blocked; do not double-report)', async () => {
    expect(await checkTddBoundary(cwd, join(cwd, 'nope.md'))).toEqual([])
  })
})

// ── The fixture the spec demands: delete the tests, then write an evidence file
// that CLAIMS the work is done. The done-criterion alone is satisfied; the
// boundary must still block. ──
describe('checkTddBoundary — git boundaries', () => {
  let cwd: string
  let evidence: string

  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' })

  beforeEach(() => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'harnessed-tddb-git-')))
    evidence = join(cwd, TDD_EVIDENCE_ARTIFACT)
    git('init', '--quiet')
    git('config', 'user.email', 't@example.com')
    git('config', 'user.name', 'T')
    git('config', 'commit.gpgsign', 'false')
    mkdirSync(join(cwd, 'tests'), { recursive: true })
    writeFileSync(
      join(cwd, 'tests', 'widget.test.ts'),
      [
        "import { describe, expect, it } from 'vitest'",
        "describe('widget', () => {",
        "  it('adds', () => { expect(add(1, 2)).toBe(3) })",
        "  it('rejects negatives', () => { expect(() => add(-1, 0)).toThrow() })",
        "  it('is associative', () => { expect(add(add(1,2),3)).toBe(add(1,add(2,3))) })",
        '})',
      ].join('\n'),
    )
    writeFileSync(join(cwd, 'src.ts'), 'export const add = (a: number, b: number) => a + b\n')
    git('add', '-A')
    git('commit', '--quiet', '-m', 'baseline')
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('B3 BLOCKS when a test file was deleted and the evidence claims completion', async () => {
    rmSync(join(cwd, 'tests', 'widget.test.ts'))
    writeFileSync(evidence, RED_GREEN) // a well-formed, entirely plausible claim
    const f = await checkTddBoundary(cwd, evidence)
    expect(blocks(f)).toContain('test-file-deleted')
    expect(f.find((x) => x.id === 'test-file-deleted')?.message).toContain('widget.test.ts')
  })

  it('B3 also catches a STAGED deletion (git rm, not just an unlink)', async () => {
    git('rm', '--quiet', 'tests/widget.test.ts')
    writeFileSync(evidence, RED_GREEN)
    expect(blocks(await checkTddBoundary(cwd, evidence))).toContain('test-file-deleted')
  })

  it('B3 ignores a deleted NON-test file (surgical: only the boundary it owns)', async () => {
    rmSync(join(cwd, 'src.ts'))
    writeFileSync(evidence, RED_GREEN)
    expect(blocks(await checkTddBoundary(cwd, evidence))).toEqual([])
  })

  it('B4 WARNS (never blocks) when assertions were removed — regex heuristic per delivery-gate:28', async () => {
    writeFileSync(
      join(cwd, 'tests', 'widget.test.ts'),
      [
        "import { describe, expect, it } from 'vitest'",
        "describe('widget', () => {",
        "  it('adds', () => { expect(add(1, 2)).toBe(3) })",
        '})',
      ].join('\n'),
    )
    writeFileSync(evidence, RED_GREEN)
    const f = await checkTddBoundary(cwd, evidence)
    expect(warns(f)).toContain('assertions-weakened')
    expect(blocks(f)).toEqual([])
  })

  it('B4 stays silent when assertions grew', async () => {
    writeFileSync(
      join(cwd, 'tests', 'widget.test.ts'),
      [
        "import { describe, expect, it } from 'vitest'",
        "describe('widget', () => {",
        "  it('adds', () => { expect(add(1, 2)).toBe(3) })",
        "  it('rejects negatives', () => { expect(() => add(-1, 0)).toThrow() })",
        "  it('is associative', () => { expect(add(add(1,2),3)).toBe(add(1,add(2,3))) })",
        "  it('handles zero', () => { expect(add(0, 0)).toBe(0) })",
        '})',
      ].join('\n'),
    )
    writeFileSync(evidence, RED_GREEN)
    expect(warns(await checkTddBoundary(cwd, evidence))).not.toContain('assertions-weakened')
  })

  it('non-git working tree → git boundaries silently unavailable (fail-open)', async () => {
    const bare = realpathSync(mkdtempSync(join(tmpdir(), 'harnessed-tddb-nogit-')))
    try {
      const ev = join(bare, TDD_EVIDENCE_ARTIFACT)
      writeFileSync(ev, RED_GREEN)
      expect(await checkTddBoundary(bare, ev)).toEqual([])
    } finally {
      rmSync(bare, { recursive: true, force: true })
    }
  })

  // Isolation. git resolves a repo by walking UP from cwd, so "this directory is not a
  // repo" is never something the caller can rely on — a scratch dir under a
  // version-controlled home directory is inside a work tree as far as git is concerned,
  // and an unscoped `git diff` reports THAT repo's deletions as this sub's boundary
  // violations. The boundary only ever judges the subtree it was handed.
  it('is scoped to the subtree it was handed — an enclosing repo’s deletions do not leak in', async () => {
    rmSync(join(cwd, 'tests', 'widget.test.ts')) // a real deletion, one level UP
    const inner = join(cwd, 'sub', 'project')
    mkdirSync(inner, { recursive: true })
    const ev = join(inner, TDD_EVIDENCE_ARTIFACT)
    writeFileSync(ev, RED_GREEN)
    expect(await checkTddBoundary(inner, ev)).toEqual([])
    // …and the same deletion IS reported when the boundary is pointed at the tree
    // that actually contains it, so the scoping cannot silently disarm B3.
    writeFileSync(evidence, RED_GREEN)
    expect(blocks(await checkTddBoundary(cwd, evidence))).toContain('test-file-deleted')
  })
})
