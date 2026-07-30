// T2.5 — `harnessed check-docs`: the SHIPPED doc-discipline gate.
//
// Why this exists (context for future readers): the only hard documentation-
// discipline gate in this repo used to be scripts/check-state-archive-stale.mjs,
// and `scripts/` is NOT in package.json `files` — so users who `npm i -g
// harnessed` received zero enforcement. The rule semantics are ported into
// src/ (shipped in dist/) and exposed as a subcommand so an opt-in CC hook can
// call it.
//
// Exit-code contract under test (mirrors doc-discipline.yaml `enforcement`):
//   0 = clean (or nothing to check)      1 = warn-tier only      2 = halt-tier
// 1 vs 2 is not cosmetic: a PreToolUse hook exiting 2 BLOCKS the tool call and
// feeds stderr to the model; exiting 1 is advisory (stderr to the user only).
//
// All fixtures are tmpdirs — the real .planning/ of this repo is never read.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  collectDocViolations,
  DEFAULT_MAX_STATE_LINES,
  exitCodeFor,
  HISTORICAL_ERRATA_RE,
  KEY_DECISIONS_SECTION_LIMIT,
  KEY_DECISIONS_SECTION_RE,
  registerCheckDocs,
  shouldGateForHookPayload,
} from '../../src/cli/checkDocs.js'

let tmpRoot: string

function writePlanning(files: Record<string, string>): void {
  mkdirSync(join(tmpRoot, '.planning'), { recursive: true })
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(tmpRoot, '.planning', name), body)
  }
}

/** A compliant STATE digest: short, one 关键决议 section, no historical errata. */
function cleanState(lines = 20): string {
  return [
    '# STATE',
    '',
    '## 关键决议 ship 总结',
    '',
    ...Array.from({ length: lines }, (_, i) => `- line ${i + 1}`),
  ].join('\n')
}

const CLEAN_ROADMAP = [
  '# ROADMAP',
  '',
  '- [x] Phase 1 — done ✅2026-07-01 详: phases/01-foo/',
].join('\n')

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-docs-'))
})
afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('collectDocViolations', () => {
  it('no .planning/ at all → no violations (absence is not a violation)', () => {
    expect(collectDocViolations({ cwd: tmpRoot })).toEqual([])
  })

  it('compliant STATE.md + ROADMAP.md → no violations', () => {
    writePlanning({ 'STATE.md': cleanState(), 'ROADMAP.md': CLEAN_ROADMAP })
    expect(collectDocViolations({ cwd: tmpRoot })).toEqual([])
  })

  it('STATE.md over the digest limit → halt-tier violation carrying the real line count', () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    const v = collectDocViolations({ cwd: tmpRoot })
    const halt = v.filter((x) => x.tier === 'halt')
    expect(halt).toHaveLength(1)
    expect(halt[0]?.rule).toBe('state-digest-line-limit')
    expect(halt[0]?.message).toContain(String(over))
    expect(halt[0]?.message).toContain(String(DEFAULT_MAX_STATE_LINES))
  })

  it('a trailing newline does not inflate the line count past the limit', () => {
    const body = `${Array.from({ length: DEFAULT_MAX_STATE_LINES }, (_, i) => `L${i + 1}`).join('\n')}\n`
    writePlanning({ 'STATE.md': body })
    expect(collectDocViolations({ cwd: tmpRoot })).toEqual([])
  })

  it('--max-state-lines override raises the threshold (repo-local cadence)', () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    expect(collectDocViolations({ cwd: tmpRoot, maxStateLines: over + 1 })).toEqual([])
  })

  it('allowLongState suppresses only the halt rule, not the warn rules', () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    const body = [
      ...Array.from({ length: over }, (_, i) => `L${i + 1}`),
      '## 关键决议 ship 总结',
      '## 关键决议 ship 总结',
    ].join('\n')
    writePlanning({ 'STATE.md': body })
    const v = collectDocViolations({ cwd: tmpRoot, allowLongState: true })
    expect(v.some((x) => x.rule === 'state-digest-line-limit')).toBe(false)
    expect(v.some((x) => x.rule === 'state-key-decisions-section-limit')).toBe(true)
  })

  it('two 关键决议 ship 总结 sections → warn-tier (Rule 2 parity)', () => {
    writePlanning({
      'STATE.md': ['## 关键决议 ship 总结', 'a', '## 关键决议 ship 总结', 'b'].join('\n'),
    })
    const v = collectDocViolations({ cwd: tmpRoot })
    const r = v.find((x) => x.rule === 'state-key-decisions-section-limit')
    expect(r?.tier).toBe('warn')
    expect(r?.message).toContain('2')
  })

  it('historical errata literal in STATE.md → warn-tier with the line number (Rule 3 parity)', () => {
    writePlanning({ 'STATE.md': ['# STATE', 'W-3 errata: fixed the thing'].join('\n') })
    const v = collectDocViolations({ cwd: tmpRoot })
    const r = v.find((x) => x.rule === 'state-historical-errata')
    expect(r?.tier).toBe('warn')
    expect(r?.line).toBe(2)
  })

  it('ROADMAP.md inlining closing narrative → warn-tier violation', () => {
    writePlanning({
      'STATE.md': cleanState(),
      'ROADMAP.md': [
        '# ROADMAP',
        '- [x] Phase 1 — shipped in a189632, vitest 1470/0 green, CI green, lesson: 别再内联',
      ].join('\n'),
    })
    const v = collectDocViolations({ cwd: tmpRoot })
    const r = v.find((x) => x.rule === 'roadmap-no-inline-narrative')
    expect(r?.tier).toBe('warn')
    expect(r?.file).toBe('.planning/ROADMAP.md')
    expect(r?.line).toBe(2)
  })

  it('an ADR reference in ROADMAP.md is a POINTER, not narrative → never flagged', () => {
    // Guard against re-adding an `adr-ref` signal: doc discipline wants overview
    // docs to carry pointers, so flagging `ADR-0030` would invert the rule.
    writePlanning({
      'STATE.md': cleanState(),
      'ROADMAP.md': [
        '# ROADMAP',
        '| v3.0 | 2026-05-21 | 4-Stage workflow — master orchestrator. ADR-0030/0031/0032. |',
        '- [x] Phase 2 — see ADR 0032 详: phases/02/',
      ].join('\n'),
    })
    expect(collectDocViolations({ cwd: tmpRoot })).toEqual([])
  })

  it('a bare version/date number in ROADMAP.md is not mistaken for a commit hash', () => {
    writePlanning({
      'STATE.md': cleanState(),
      'ROADMAP.md': ['# ROADMAP', '- [x] Phase 1 — v4.32.21 ✅2026-07-29 详: phases/01/'].join(
        '\n',
      ),
    })
    expect(collectDocViolations({ cwd: tmpRoot })).toEqual([])
  })
})

describe('exitCodeFor', () => {
  it('clean → 0', () => {
    expect(exitCodeFor([])).toBe(0)
  })
  it('warn only → 1 (advisory: a PreToolUse hook does not block)', () => {
    expect(exitCodeFor([{ rule: 'r', tier: 'warn', file: 'f', message: 'm' }])).toBe(1)
  })
  it('any halt → 2 (blocks the tool call; stderr is fed back to the model)', () => {
    expect(
      exitCodeFor([
        { rule: 'r', tier: 'warn', file: 'f', message: 'm' },
        { rule: 'h', tier: 'halt', file: 'f', message: 'm' },
      ]),
    ).toBe(2)
  })
})

describe('shouldGateForHookPayload', () => {
  it('a Bash git commit payload gates', () => {
    const raw = JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'git commit -m "wip"' },
    })
    expect(shouldGateForHookPayload(raw)).toBe(true)
  })

  it('a Bash non-commit payload does not gate', () => {
    const raw = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls -la' } })
    expect(shouldGateForHookPayload(raw)).toBe(false)
  })

  it('a non-Bash tool does not gate', () => {
    const raw = JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'a.ts' } })
    expect(shouldGateForHookPayload(raw)).toBe(false)
  })

  it('garbage / empty payload does not gate (fail-soft: a hook must never wedge)', () => {
    expect(shouldGateForHookPayload('')).toBe(false)
    expect(shouldGateForHookPayload('not json {{{')).toBe(false)
  })
})

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  let out = ''
  let errOut = ''
  vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    out += `${args.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errOut += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckDocs(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  }
  return { code, out, err: errOut }
}

describe('harnessed check-docs (command surface)', () => {
  it('clean fixture → exit 0', async () => {
    writePlanning({ 'STATE.md': cleanState(), 'ROADMAP.md': CLEAN_ROADMAP })
    const r = await runCli(['check-docs', '--cwd', tmpRoot])
    expect(r.code).toBe(0)
  })

  it('over-limit STATE.md → exit 2 and the message names the actual line count', async () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    const r = await runCli(['check-docs', '--cwd', tmpRoot])
    expect(r.code).toBe(2)
    expect(r.err).toContain(String(over))
  })

  it('ROADMAP inline narrative only → exit 1 (non-zero, advisory tier)', async () => {
    writePlanning({
      'STATE.md': cleanState(),
      'ROADMAP.md': ['# ROADMAP', '- [x] Phase 1 — shipped a189632, CI green, lesson: x'].join(
        '\n',
      ),
    })
    const r = await runCli(['check-docs', '--cwd', tmpRoot])
    expect(r.code).toBe(1)
    expect(r.err).toContain('ROADMAP.md')
  })

  it('--json emits {violations, summary, exit_code} on stdout', async () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    const r = await runCli(['check-docs', '--cwd', tmpRoot, '--json'])
    expect(r.code).toBe(2)
    const parsed = JSON.parse(r.out) as {
      violations: { rule: string; tier: string; file: string; message: string }[]
      summary: string
      exit_code: number
    }
    expect(parsed.summary).toBe('halt')
    expect(parsed.exit_code).toBe(2)
    expect(parsed.violations[0]?.rule).toBe('state-digest-line-limit')
    expect(parsed.violations[0]?.tier).toBe('halt')
  })

  it('--json on a clean tree → summary pass, empty violations', async () => {
    writePlanning({ 'STATE.md': cleanState(), 'ROADMAP.md': CLEAN_ROADMAP })
    const r = await runCli(['check-docs', '--cwd', tmpRoot, '--json'])
    expect(r.code).toBe(0)
    const parsed = JSON.parse(r.out) as { violations: unknown[]; summary: string }
    expect(parsed).toMatchObject({ violations: [], summary: 'pass' })
  })

  it('--max-state-lines raises the ceiling from the CLI (flag → camelCase mapping)', async () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    expect((await runCli(['check-docs', '--cwd', tmpRoot])).code).toBe(2)
    const r = await runCli(['check-docs', '--cwd', tmpRoot, '--max-state-lines', String(over + 1)])
    expect(r.code).toBe(0)
  })

  it('HARNESSED_ALLOW_LONG_STATE=1 downgrades the halt to clean (documented override)', async () => {
    const over = DEFAULT_MAX_STATE_LINES + 7
    writePlanning({ 'STATE.md': Array.from({ length: over }, (_, i) => `L${i + 1}`).join('\n') })
    vi.stubEnv('HARNESSED_ALLOW_LONG_STATE', '1')
    const r = await runCli(['check-docs', '--cwd', tmpRoot])
    vi.unstubAllEnvs()
    expect(r.code).toBe(0)
  })
})

describe('i18n', () => {
  const load = (name: string): Record<string, string> =>
    JSON.parse(readFileSync(join(process.cwd(), 'messages', name), 'utf8'))

  it('every check_docs.* key exists in both en and zh-Hans', () => {
    const en = load('en.json')
    const zh = load('zh-Hans.json')
    const enKeys = Object.keys(en)
      .filter((k) => k.startsWith('check_docs.'))
      .sort()
    expect(enKeys.length).toBeGreaterThanOrEqual(5)
    expect(
      Object.keys(zh)
        .filter((k) => k.startsWith('check_docs.'))
        .sort(),
    ).toEqual(enKeys)
  })
})

describe('rule parity with scripts/check-state-archive-stale.mjs (drift alarm)', () => {
  // The repo-internal CI gate keeps its own implementation (scripts/ is not in
  // package.json `files`, and reverse-importing dist/ from a gate script would
  // make the gate depend on build ordering — stale-dist false-green risk). This
  // test is the drift alarm holding the two copies' rule semantics identical.
  const src = readFileSync(join(process.cwd(), 'scripts', 'check-state-archive-stale.mjs'), 'utf8')

  it('the errata regex is byte-identical to the gate script', () => {
    expect(src).toContain(HISTORICAL_ERRATA_RE.source)
  })

  it('the 关键决议 section regex + its limit are identical to the gate script', () => {
    expect(src).toContain(KEY_DECISIONS_SECTION_RE.source)
    expect(src).toContain(`KEY_DECISIONS_SECTION_LIMIT = ${KEY_DECISIONS_SECTION_LIMIT}`)
  })
})
