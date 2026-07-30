// src/checkpoint/tddBoundary.ts — T2.7 D-4: a BOUNDARY for the `tdd-evidence.md`
// done-criterion.
//
// 4.33.0 machine-ized the TDD skip-declaration protocol by declaring
// `artifacts_expected: [tdd-evidence.md]` on the task-test leaf. That is a PURE
// done-criterion, and ECC's loop-design-check names exactly this shape as the worst
// collapse mode (skills/loop-design-check/SKILL.md:105):
//   (worst) Only gates on "all tests pass" → agent deletes the tests
//   | Is there a boundary ("what it must NOT do")? Or only a done-criterion?
// with the fix (:121): `all tests green AND no test file deleted or weakened AND
// coverage not lowered AND a change-list produced`.
//
// "Write a tdd-evidence.md" is satisfiable by an empty file, by boilerplate, and — the
// one that actually costs something — by a plausible red→green record written while
// the tests it describes were deleted.
//
// FOUR CHECKS, TWO SEVERITIES. Per ECC delivery-gate/SKILL.md:28 (regex heuristics
// warn deliberately, because they misfire) only mechanically decidable facts block:
//   B1 evidence-empty      BLOCK — file size / non-blank content. Mechanically decidable.
//   B2 evidence-one-sided  BLOCK — presence of both sides, or of a reasoned SKIPPED
//                                  declaration. Token PRESENCE is decidable; the
//                                  truthfulness of what is written is not, and is not
//                                  attempted. Markers are deliberately generous so a
//                                  compliant agent is never falsely blocked.
//   B3 test-file-deleted   BLOCK — git says a test file disappeared. Decidable.
//   B4 assertions-weakened WARN  — assertion-token count in the test diff dropped.
//                                  Heuristic (parametrizing or merging cases legitimately
//                                  lowers it) → warn only, never block.
//
// Everything git-derived is fail-OPEN: no repo / no git / command error → no findings.
// The boundary must never block a user who simply is not using git. It is also SCOPED
// to the subtree it was handed (see SCOPE below) — never to whatever repository happens
// to enclose that subtree.

import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)

/** The done-criterion this module bounds (declared by workflows/task/test/workflow.yaml). */
export const TDD_EVIDENCE_ARTIFACT = 'tdd-evidence.md'

export interface BoundaryFinding {
  id: 'evidence-empty' | 'evidence-one-sided' | 'test-file-deleted' | 'assertions-weakened'
  /** 'block' → merged into the fail-closed blocker set; 'warn' → printed only. */
  kind: 'block' | 'warn'
  message: string
}

/** Basename match, so the 4.22.1 multi-base probe's resolved absolute path (which may
 *  live under `.planning/phases/<NN>-<slug>/`) is recognized on either OS separator. */
export function isTddEvidencePath(path: string): boolean {
  return path.split(/[\\/]/).pop() === TDD_EVIDENCE_ARTIFACT
}

/** Paths that count as tests for B3/B4. Covers the JS/TS conventions this repo uses
 *  plus the common Python/Go ones, so the boundary is not harnessed-only. */
function isTestPath(p: string): boolean {
  const s = p.replace(/\\/g, '/')
  return (
    /(^|\/)tests?\//.test(s) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(s) ||
    /(^|\/)test_[^/]+\.py$/.test(s) ||
    /_test\.(py|go|rb)$/.test(s)
  )
}

// A generous two-sided contract. workflows/role-prompts.yaml tells the agent to write
// "EITHER the red→green record (the failing test, then the pass) OR ... an explicit
// `SKIPPED — <reason>` declaration", so both vocabularies are accepted, and any of the
// natural words for each side counts. The point is to reject a file that records
// NEITHER side — not to impose a template nobody was told about.
const RED_MARKER = /\b(red|fail(?:s|ed|ing|ure)?)\b/i
const GREEN_MARKER = /\b(green|pass(?:es|ed|ing)?)\b/i
// A skip needs a REASON: `SKIPPED` alone is a label, not a declaration.
const SKIP_DECLARATION = /\bSKIPPED\b\s*[—–:-]\s*\S+/i

/** Strip markdown headings and blank lines — a file made only of the template's
 *  headings carries no evidence. */
function substantiveBody(text: string): string {
  return text
    .split('\n')
    .filter((l) => l.trim() !== '' && !/^\s*#{1,6}\s/.test(l))
    .join('\n')
    .trim()
}

/** Run the boundary checks for one resolved `tdd-evidence.md`.
 *  Empty result = the boundary is satisfied (or could not be evaluated).
 *  A missing file yields NO findings: `checkArtifacts` has already blocked on it and
 *  double-reporting the same fact only confuses the block message. */
export async function checkTddBoundary(
  cwd: string,
  evidencePath: string,
): Promise<BoundaryFinding[]> {
  const findings: BoundaryFinding[] = []

  const exists = await stat(evidencePath)
    .then((s) => s.isFile())
    .catch(() => false)
  if (!exists) return findings

  const text = await readFile(evidencePath, 'utf8').catch(() => '')
  const body = substantiveBody(text)
  if (body.length === 0) {
    findings.push({
      id: 'evidence-empty',
      kind: 'block',
      message: `${TDD_EVIDENCE_ARTIFACT} has no content beyond headings — an empty artifact satisfies the file-exists criterion but records nothing. Write the red→green record, or an explicit \`SKIPPED — <reason>\`.`,
    })
  } else if (!SKIP_DECLARATION.test(body) && !(RED_MARKER.test(body) && GREEN_MARKER.test(body))) {
    findings.push({
      id: 'evidence-one-sided',
      kind: 'block',
      message: `${TDD_EVIDENCE_ARTIFACT} records neither a red→green cycle (a failing run AND the subsequent pass) nor a reasoned \`SKIPPED — <reason>\` declaration.`,
    })
  }

  findings.push(...(await gitBoundaries(cwd)))
  return findings
}

/** Base for the diff: the merge-base with origin/main when it exists (so a deletion
 *  the agent already COMMITTED is still visible — sister of scale.ts countChangedFiles),
 *  otherwise HEAD (working tree + index). Null when this is not a git work tree. */
async function diffBase(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileP('git', ['merge-base', 'HEAD', 'origin/main'], { cwd })
    const ref = stdout.trim()
    if (ref) return ref
  } catch {
    // no remote / no merge base — fall through to HEAD.
  }
  try {
    await execFileP('git', ['rev-parse', '--verify', 'HEAD'], { cwd })
    return 'HEAD'
  } catch {
    return null
  }
}

// Every diff is scoped by the `-- .` pathspec, i.e. to the subtree `cwd` points at.
// git resolves a repository by walking UP from cwd, so an unscoped diff reports the
// whole enclosing repository — and a directory that is "not a repo" from the caller's
// point of view (a scratch fixture, a scratch dir under a home directory that happens
// to be version-controlled) is still inside one as far as git is concerned. Unscoped,
// that repo's unrelated deletions surface as this sub's boundary violations. The
// boundary judges the tree it was handed, nothing above it.
const SCOPE = ['--', '.']

async function gitBoundaries(cwd: string): Promise<BoundaryFinding[]> {
  const base = await diffBase(cwd)
  if (!base) return []
  const findings: BoundaryFinding[] = []

  // B3 — deletions. `--diff-filter=D` against the base covers unlink, `git rm`, and
  // (via the merge-base branch) a deletion already committed on this branch.
  try {
    const { stdout } = await execFileP(
      'git',
      ['diff', '--name-only', '--diff-filter=D', base, ...SCOPE],
      {
        cwd,
      },
    )
    const deleted = stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '' && isTestPath(l))
    if (deleted.length > 0) {
      findings.push({
        id: 'test-file-deleted',
        kind: 'block',
        message: `${deleted.length} test file(s) deleted since ${base} — a done-criterion that only asks for evidence is satisfiable by removing the tests it describes: ${deleted.join(', ')}. Restore them, or re-run with --force to record a deliberate override.`,
      })
    }
  } catch {
    // fail-open
  }

  // B4 — weakening (heuristic, warn only).
  try {
    const { stdout } = await execFileP('git', ['diff', '-U0', base, ...SCOPE], {
      cwd,
      maxBuffer: 32 * 1024 * 1024,
    })
    const delta = assertionDelta(stdout)
    if (delta.removed > delta.added) {
      findings.push({
        id: 'assertions-weakened',
        kind: 'warn',
        message: `assertion count in test files dropped (-${delta.removed} / +${delta.added}) — verify this is a refactor, not a weakened suite. Heuristic (parametrized cases legitimately reduce the count), so this warns and does not block.`,
      })
    }
  } catch {
    // fail-open
  }

  return findings
}

const ASSERTION_TOKEN = /\b(expect|assert\w*|should|toBe\w*|toEqual|toThrow|toMatch)\b|\.to\./

/** Count assertion-bearing added/removed lines inside TEST files only. Walks the
 *  unified diff, tracking the current file from its `+++ b/<path>` header. */
export function assertionDelta(diff: string): { added: number; removed: number } {
  let inTest = false
  let added = 0
  let removed = 0
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      const p = line.slice(4).trim().replace(/^b\//, '')
      inTest = p !== '/dev/null' && isTestPath(p)
      continue
    }
    if (line.startsWith('--- ') || line.startsWith('diff --git') || line.startsWith('@@')) continue
    if (!inTest) continue
    if (line.startsWith('+') && ASSERTION_TOKEN.test(line)) added++
    else if (line.startsWith('-') && ASSERTION_TOKEN.test(line)) removed++
  }
  return { added, removed }
}
