// Phase 2.3 W3 T3.3 — cli/manifest-add.ts unit tests (EE-5 5Q gate, D-03 BOTH).
// 6 cells: register / H1 gate / WARN dry-run / interactive 5Q / --apply Path A / empty answer.
// Pattern J: readline mock + exit/console spies (sister execute-task.test.ts).

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const questionMock = vi.fn<(p: string) => Promise<string>>()
const closeMock = vi.fn()
vi.mock('node:readline/promises', () => ({
  createInterface: () => ({ question: questionMock, close: closeMock }),
}))

import { registerManifestAdd } from '../../src/cli/manifest-add.js'

class ExitError extends Error {
  constructor(public code: number) {
    super()
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = '',
    stderr = ''
  const sink = (a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  }
  const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'warn').mockImplementation((...a) => sink(a))
  vi.spyOn(console, 'error').mockImplementation((...a) => sink(a))
  const program = new Command().exitOverride()
  registerManifestAdd(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    code = e instanceof ExitError ? e.code : 1
    if (!(e instanceof ExitError)) sink([(e as Error).message])
  } finally {
    exit.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('cli/manifest-add (EE-5 5Q merge gate)', () => {
  let tmpRoot: string
  let origCwd: string
  beforeEach(() => {
    questionMock.mockReset()
    closeMock.mockReset()
    tmpRoot = mkdtempSync(join(tmpdir(), 'ee5-'))
    origCwd = process.cwd()
  })
  afterEach(() => {
    process.chdir(origCwd)
    rmSync(tmpRoot, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('1. registers manifest-add subcommand with EE-5 description', () => {
    const program = new Command()
    registerManifestAdd(program)
    const cmd = program.commands.find((c) => c.name() === 'manifest-add')
    expect(cmd?.description()).toContain('EE-5 5-question merge gate')
  })

  it('3. --non-interactive --dry-run → exit 0 + [ee-5-gate] WARN (D-03 双闸 L2)', async () => {
    const { code, stdout, stderr } = await runCli([
      'manifest-add',
      'foo',
      '--non-interactive',
      '--dry-run',
    ])
    expect(code).toBe(0)
    expect(stderr).toContain('[ee-5-gate] WARN')
    expect(stdout).toContain('dry-run preview for upstream: foo')
  })

  it('4. interactive 5Q dry-run → 5 answers in payload (readline mock)', async () => {
    const answers = ['a1', 'a2', 'a3', 'a4', 'a5']
    let i = 0
    questionMock.mockImplementation(() => Promise.resolve(answers[i++] ?? ''))
    const { code, stdout } = await runCli(['manifest-add', 'foo', '--dry-run'])
    expect(code).toBe(0)
    expect(questionMock).toHaveBeenCalledTimes(5)
    expect(closeMock).toHaveBeenCalled()
    expect(stdout).toContain('would write manifests/skill-packs/foo.ee5-answers.json')
    expect(stdout).toContain('"q1_reusable_surface": "a1"')
    expect(stdout).toContain('"q5_user_understanding": "a5"')
  })

  it('5. --apply persists sibling JSON 5 named fields (Path A, no schema bump)', async () => {
    process.chdir(tmpRoot)
    mkdirSync(join(tmpRoot, 'manifests', 'skill-packs'), { recursive: true })
    const answers = ['r1', 'r2', 'r3', 'r4', 'r5']
    let i = 0
    questionMock.mockImplementation(() => Promise.resolve(answers[i++] ?? ''))
    const { code } = await runCli(['manifest-add', 'github.com/o/upstream-bar.git'])
    expect(code).toBe(0)
    const written = join(tmpRoot, 'manifests', 'skill-packs', 'upstream-bar.ee5-answers.json')
    expect(existsSync(written)).toBe(true)
    const p = JSON.parse(readFileSync(written, 'utf8')) as Record<string, string>
    expect(p.upstream).toBe('github.com/o/upstream-bar.git')
    expect(p.q1_reusable_surface).toBe('r1')
    expect(p.q2_name_fit).toBe('r2')
    expect(p.q3_overlap).toBe('r3')
    expect(p.q4_concept_vs_identity).toBe('r4')
    expect(p.q5_user_understanding).toBe('r5')
    expect(p.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('6. empty answer → exit 1 (gate requires non-empty)', async () => {
    questionMock.mockResolvedValueOnce('  ')
    const { code, stderr } = await runCli(['manifest-add', 'foo', '--dry-run'])
    expect(code).toBe(1)
    expect(stderr).toContain('EE-5 gate requires non-empty answer')
    expect(closeMock).toHaveBeenCalled()
  })

  // v3.0.1 UX flip — apply-immediate default regression fixture.
  // No flag = immediate persist (sister Cell 5 但不传 --apply,验证 default behavior)。
  it('7. v3.0.1 flip: no flag → persists EE-5 JSON immediately (apply-immediate default)', async () => {
    process.chdir(tmpRoot)
    mkdirSync(join(tmpRoot, 'manifests', 'skill-packs'), { recursive: true })
    const answers = ['n1', 'n2', 'n3', 'n4', 'n5']
    let i = 0
    questionMock.mockImplementation(() => Promise.resolve(answers[i++] ?? ''))
    const { code } = await runCli(['manifest-add', 'github.com/o/upstream-baz.git'])
    expect(code).toBe(0)
    const written = join(tmpRoot, 'manifests', 'skill-packs', 'upstream-baz.ee5-answers.json')
    expect(existsSync(written)).toBe(true)
    const p = JSON.parse(readFileSync(written, 'utf8')) as Record<string, string>
    expect(p.q1_reusable_surface).toBe('n1')
    expect(p.q5_user_understanding).toBe('n5')
  })
})
