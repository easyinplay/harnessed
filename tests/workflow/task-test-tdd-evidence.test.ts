// TDD 跳过声明协议 — machine-ized acceptance gate for the `task-test` sub.
//
// The global CLAUDE.md contract reads: if a subtask is judged not to need TDD, the
// skip rationale MUST be recorded explicitly; with neither a skip declaration nor
// executed test verification the main session refuses acceptance. That contract had
// ZERO machine enforcement — workflows/task/test/workflow.yaml declared no
// `artifacts_expected`, so `checkArtifacts` returned `none_declared` and
// `harnessed checkpoint complete task-test` had nothing to block on (it could neither
// catch a missing skip declaration nor a never-run test suite).
//
// Fix (zero src/ change): task-test declares ONE artifact — `tdd-evidence.md`.
// `artifacts_expected` is AND semantics (every declared path must exist), so the
// two-way choice ("red→green record" XOR "skip declaration + reason") lives INSIDE
// that single file's content, not in the list. The declaration reuses the existing
// fail-closed guard: src/cli/checkpoint.ts merges checkArtifacts().missing with
// checkPlanningSync().missing → BLOCKED exit 1, escapable only via `--force`, which
// records evidence_status=overridden (an audited escape hatch, not a silent bypass).
//
// A dedicated name is deliberate: reusing `findings.md` (declared by discuss-phase /
// discuss-strategic) would let an unrelated upstream artifact satisfy this gate
// through the 4.22.1 bare-name `.planning/phases/*/` probe — a false pass.

import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { checkArtifacts } from '../../src/checkpoint/evidence.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const TASK_TEST_YAML = join(REPO_ROOT, 'workflows', 'task', 'test', 'workflow.yaml')
const EVIDENCE_ARTIFACT = 'tdd-evidence.md'

interface ParsedWorkflow {
  phases?: { id?: string; artifacts_expected?: string[] }[]
}

async function declaredArtifacts(): Promise<string[]> {
  const parsed = parseYaml(await readFile(TASK_TEST_YAML, 'utf8')) as ParsedWorkflow
  return (parsed.phases ?? []).flatMap((ph) => ph.artifacts_expected ?? [])
}

describe('task-test workflow.yaml — TDD evidence artifact declaration', () => {
  it('declares exactly the bare-name tdd-evidence.md across its phases', async () => {
    const declared = await declaredArtifacts()
    // Exactly one, exactly this name: a bare name (no separator) so the 4.22.1
    // multi-base probe resolves the dynamic .planning/phases/<NN>-<slug>/ write
    // convention; and NOT a foreign sub's artifact (findings.md / progress.md),
    // which would be satisfiable by unrelated upstream output.
    expect(declared).toEqual([EVIDENCE_ARTIFACT])
    expect(EVIDENCE_ARTIFACT).not.toMatch(/[\\/]/)
  })
})

describe('checkArtifacts against the REAL task-test leaf (fail-closed integration)', () => {
  let cwdRoot: string
  let prevCwd: string

  beforeEach(() => {
    // realpathSync: macOS tmpdir() is /var/... but cwd after chdir is /private/var/...
    cwdRoot = realpathSync(mkdtempSync(join(tmpdir(), 'harnessed-tdd-evidence-')))
    prevCwd = process.cwd()
    process.chdir(cwdRoot)
  })
  afterEach(() => {
    process.chdir(prevCwd)
    rmSync(cwdRoot, { recursive: true, force: true })
  })

  it('reports missing (→ checkpoint complete BLOCKED) when no TDD evidence exists', async () => {
    const r = await checkArtifacts('task-test', REPO_ROOT)
    // 'none_declared' here would mean the guard is disarmed — the exact pre-fix hole.
    expect(r.status).toBe('missing')
    expect(r.missing).toContain(EVIDENCE_ARTIFACT)
  })

  it('verifies once the evidence lands in .planning/phases/<NN>-<slug>/ (write convention)', async () => {
    const phaseDir = join(cwdRoot, '.planning', 'phases', '01-subtask')
    mkdirSync(phaseDir, { recursive: true })
    const abs = join(phaseDir, EVIDENCE_ARTIFACT)
    writeFileSync(
      abs,
      '# TDD evidence\n\nSKIPPED — ui_polish only, no core logic touched.\n',
      'utf8',
    )
    const r = await checkArtifacts('task-test', REPO_ROOT)
    expect(r.status).toBe('verified')
    expect(r.missing).toEqual([])
    expect(r.found.map((e) => e.path)).toEqual([abs])
  })
})

describe('task-test role prompt — evidence-or-skip-declaration checklist item', () => {
  interface ParsedRolePrompts {
    prompts?: Record<string, { checklist?: string[] }>
  }

  async function checklistFor(file: string): Promise<string[]> {
    const parsed = parseYaml(
      await readFile(join(REPO_ROOT, 'workflows', file), 'utf8'),
    ) as ParsedRolePrompts
    return parsed.prompts?.['task-test']?.checklist ?? []
  }

  for (const file of ['role-prompts.yaml', 'role-prompts.zh-Hans.yaml']) {
    it(`${file} names tdd-evidence.md and the BLOCKED consequence`, async () => {
      const checklist = await checklistFor(file)
      expect(checklist.length).toBeGreaterThan(0)
      const evidenceItems = checklist.filter((c) => c.includes(EVIDENCE_ARTIFACT))
      expect(evidenceItems.length).toBeGreaterThan(0)
      // The item must state BOTH branches (ran TDD / skipped with reason) and the
      // enforcement consequence, so the agent knows why the file is mandatory.
      const joined = evidenceItems.join('\n')
      expect(joined).toMatch(/BLOCKED/)
      expect(joined).toMatch(/checkpoint complete/)
    })
  }
})
