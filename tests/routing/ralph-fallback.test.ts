// Phase v2.0-2.4 W1 T2.4.W1.2 — ralph-loop fallback UX text + process.exit (R20.10 c).
// Sister Phase 2.2 W4 T4.3 ralph-loop-win-sentinel.test.ts pattern (mock spawn).
// Sister tests/unit/cli-doctor.test.ts ExitError-throw pattern for process.exit mock.
//
// 5 fixture per PLAN L361:
//   1. max-iter exceeded     — stderr 含 'max-iterations exceeded' UX text + exit 1
//   2. verbatim-fail         — stderr 含 'verbatim' UX text + exit 1 (fallback default)
//   3. clean COMPLETE        — exit 0 + NO fallback path triggered
//   4. mid-iter no-error     — continue, no fallback path triggered
//   5. iter < hard_upper_limit — verify limit clamp ≤ 100

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock SDK BEFORE engine import (Pattern J — sister sdk-spawn.test.ts L22-30).
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        structured_output: { status: 'COMPLETE' },
      }
    })(),
}))

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runRouting } from '../../src/routing/engine.js'
import {
  handleMaxIterationsExceeded,
  handleVerbatimCompleteFail,
} from '../../src/routing/lib/fallbackHandlers.js'
import {
  MaxIterationsExceededError,
  VerbatimCompleteFailError,
} from '../../src/routing/lib/ralphLoop.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

const RULES_YAML = `version: 1
hit_policy: P
rules:
  - id: search-default
    priority: 100
    domain: search
    when:
      task_type: search
    decision:
      primary_expert: tavily-mcp
      required_skills: [tavily-mcp]
fallback_supervisor:
  trigger: no-rule-match
  llm: claude-opus-4-7
`

let workdir: string
let rulesPath: string
let skillsRoot: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-fallback-w1-'))
  rulesPath = join(workdir, 'decision_rules.yaml')
  skillsRoot = join(workdir, 'skills')
  writeFileSync(rulesPath, RULES_YAML, 'utf8')
  mkdirSync(skillsRoot, { recursive: true })
  mkdirSync(join(skillsRoot, 'tavily-mcp'), { recursive: true })
  writeFileSync(join(skillsRoot, 'tavily-mcp', 'SKILL.md'), '# tavily-mcp\n', 'utf8')
})
afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

const FALLBACK_CFG = {
  action: 'emit_warning_and_halt' as const,
  message:
    '⚠️ ralph-loop max-iterations ({{ args.max_iterations }}) exceeded for execute-task 04-deliver.',
  exit_code: 1,
}

describe('handleMaxIterationsExceeded — direct unit (T2.4.W1.2 R20.10 c)', () => {
  it('fixture 1: max-iter exceeded → stderr UX text + process.exit(1)', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new ExitError(typeof code === 'number' ? code : 0)
    })
    const errFn = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      handleMaxIterationsExceeded(new MaxIterationsExceededError(20), FALLBACK_CFG, {
        subtaskSummary: 'fix auth bug',
        workflowName: 'execute-task',
        phaseId: '04-deliver',
        lastMessage: 'still working on it...',
        maxIterations: 20,
      }),
    ).toThrow(ExitError)
    expect(exit).toHaveBeenCalledWith(1)
    const stderr = errFn.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).toMatch(/max-iterations exceeded/i)
    expect(stderr).toContain('20/20')
    expect(stderr).toContain('04-deliver')
    expect(stderr).toContain('execute-task')
    expect(stderr).toContain('Continue with current state')
    expect(stderr).toContain('Re-run from last checkpoint')
    expect(stderr).toContain('Abort cleanly')
  })
})

describe('handleVerbatimCompleteFail — direct unit (T2.4.W1.2 R20.10 c)', () => {
  it('fixture 2: verbatim-fail → stderr UX text + process.exit(1)', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new ExitError(typeof code === 'number' ? code : 0)
    })
    const errFn = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      handleVerbatimCompleteFail(
        new VerbatimCompleteFailError('subagent missed <promise>COMPLETE</promise>'),
        FALLBACK_CFG,
        {
          subtaskSummary: 'rebuild docs',
          workflowName: 'execute-task',
          phaseId: '04-deliver',
        },
      ),
    ).toThrow(ExitError)
    expect(exit).toHaveBeenCalledWith(1)
    const stderr = errFn.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).toMatch(/verbatim/i)
    expect(stderr).toContain('execute-task')
    expect(stderr).toContain('04-deliver')
  })
})

describe('runRouting — clean COMPLETE NO fallback (T2.4.W1.2)', () => {
  it('fixture 3: clean COMPLETE → exit 0 path, no stderr fallback', async () => {
    const errFn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await runRouting(
      { task: 'search docs', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        maxIterations: 5,
        spawn: async () => '<promise>COMPLETE</promise>',
      },
    )
    expect(result).toMatchObject({ ok: true })
    const stderr = errFn.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).not.toMatch(/max-iterations exceeded/i)
    expect(stderr).not.toMatch(/verbatim/i)
  })
})

describe('runRouting — mid-iter no-error continues (T2.4.W1.2)', () => {
  it('fixture 4: mid-iter no-error → eventually COMPLETE, no fallback triggered', async () => {
    const errFn = vi.spyOn(console, 'error').mockImplementation(() => {})
    let calls = 0
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        maxIterations: 5,
        spawn: async () => {
          calls++
          return calls < 3 ? 'still working' : '<promise>COMPLETE</promise>'
        },
      },
    )
    expect(result).toMatchObject({ ok: true })
    expect(calls).toBe(3)
    const stderr = errFn.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).not.toMatch(/max-iterations exceeded/i)
  })
})

describe('handleMaxIterationsExceeded — hard_upper_limit clamp (T2.4.W1.2)', () => {
  it('fixture 5: iter < hard_upper_limit (100) — UX text reflects actual iter not clamp', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new ExitError(typeof code === 'number' ? code : 0)
    })
    const errFn = vi.spyOn(console, 'error').mockImplementation(() => {})
    // iter=50, max=50 — well under hard_upper_limit=100 (RESEARCH § 7.1)
    expect(() =>
      handleMaxIterationsExceeded(new MaxIterationsExceededError(50), FALLBACK_CFG, {
        subtaskSummary: 'big refactor',
        workflowName: 'execute-task',
        phaseId: '04-deliver',
        maxIterations: 50,
      }),
    ).toThrow(ExitError)
    expect(exit).toHaveBeenCalledWith(1)
    const stderr = errFn.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).toContain('50/50')
    expect(stderr).toContain('hard upper limit 100')
  })
})
