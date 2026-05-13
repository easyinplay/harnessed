// Phase 1.4 T5.3 — research workflow E2E integration tests (≥3 cell + skipIf
// real-spawn gate per Pattern K phase 1.2).
//
// IMPL NOTE — covers KICKOFF C4 (research workflow E2E) + D1.4-1 reload bypass
// + R1 mitigation Step 3 (mock spawn happy path + fallback supervisor route +
// skills fail-fast). Default mock cells run on every CI / `pnpm test`; real-
// spawn cell is HARNESSED_REAL_SPAWN=1 gated (沿袭 installer-real-spawn.test
// .ts pattern) so devs can do manual end-to-end verify on machines with
// claude CLI + skills installed without polluting CI matrix.
//
// F42 (executor 2026-05-13 deviation): cell 2 was originally specced "install
// fail → fallback_supervisor" but engine.ts narrows install fail to
// {ok:false, phase:'install'} — never reaches fallbackSupervisor (which only
// fires on arbitrate-miss per agentDefinition.ts L117 + engine.ts L117-L127).
// Rule 3 auto-fix: reframe cell 2 as the legitimate fallback path
// (arbitrate-miss → fallbackSupervisor → ok:true matchedRule:null), which
// still validates the L2 supervisor mock — same semantic intent, accurate
// coverage. Install-fail path is exhaustively covered in unit tests cell 6
// + cell 10 (routing-engine.test.ts).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type AgentDefinition,
  RestartRequiredError,
  runRouting,
  SkillNotInstalledError,
  type TaskContext,
} from '../../src/routing/index.js'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'

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
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-research-e2e-'))
  rulesPath = join(workdir, 'decision_rules.yaml')
  skillsRoot = join(workdir, 'skills')
  writeFileSync(rulesPath, RULES_YAML, 'utf8')
  mkdirSync(skillsRoot, { recursive: true })
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

function stubSkill(name: string): void {
  mkdirSync(join(skillsRoot, name), { recursive: true })
  writeFileSync(join(skillsRoot, name, 'SKILL.md'), `# ${name}\n`, 'utf8')
}

describe('research workflow E2E — mock cells (always run)', () => {
  it('1. happy path — query "Next.js v15 app router" → search-default → COMPLETE → ok', async () => {
    stubSkill('tavily-mcp')
    let invokedAgentDef: AgentDefinition | null = null
    const task: TaskContext = { task: 'Next.js v15 app router', task_type: 'search' }

    const result = await runRouting(task, {
      rulesPath,
      skillsRoot,
      spawn: async (def: AgentDefinition) => {
        invokedAgentDef = def
        // Simulate verbatim grep `^COMPLETE$/m` happy round-trip (Anchor 2 SPIKE-REPORT § 3.1)
        return 'searched ctx7 docs for Next.js v15 app router\nCOMPLETE'
      },
    })

    expect(result).toMatchObject({ ok: true })
    if ('ok' in result && result.ok === true) {
      expect(result.matchedRule?.id).toBe('search-default')
      expect(result.result).toContain('COMPLETE')
    }
    // Verify agentDef wired correctly through factory (T3.2 contract § 2)
    expect(invokedAgentDef).not.toBeNull()
    if (invokedAgentDef !== null) {
      const def = invokedAgentDef as AgentDefinition
      expect(def.description).toContain('search')
      expect(def.skills).toContain('tavily-mcp')
      expect(def.prompt).toContain('Next.js v15 app router')
    }
  })

  it('2. fallback path — non-search task_type → arbitrate miss → fallbackSupervisor → ok matchedRule:null', async () => {
    // F42 reframe: install-fail narrows to phase=install (not fallback);
    // legitimate fallback fires on arbitrate-miss per engine.ts L117-L121.
    let supervisorCalls = 0
    const result = await runRouting(
      { task: 'totally unknown vague request', task_type: 'unknown-domain' },
      {
        rulesPath,
        skillsRoot,
        fallbackSupervisor: async (task) => {
          supervisorCalls++
          // Mock LLM L2 supervisor returning a synthesized result for the task.
          return `L2 supervisor handled: ${task.task}\nCOMPLETE`
        },
      },
    )

    expect(result).toMatchObject({ ok: true })
    if ('ok' in result && result.ok === true) {
      expect(result.matchedRule).toBeNull()
      expect(result.result).toContain('L2 supervisor handled')
      expect(result.result).toContain('totally unknown')
    }
    expect(supervisorCalls).toBe(1)
  })

  it('3. skills missing fail-fast — required skill never stubbed → ok:false phase:install', async () => {
    // Simulate AgentDefinition.skills referencing un-installed skill;
    // ensureSkillsInstalled (lib/ralphLoop.ts) retries 3× then bubbles
    // SkillNotInstalledError or RestartRequiredError. Either narrows to
    // phase=install per engine.ts L132-L141 + L148-L150.
    const result = await runRouting(
      { task: 'find docs', task_type: 'search' },
      { rulesPath, skillsRoot },
    )

    expect(result).toMatchObject({ ok: false, phase: 'install' })
    if ('ok' in result && result.ok === false) {
      const err = result.error
      const isExpected =
        err instanceof SkillNotInstalledError || err instanceof RestartRequiredError
      expect(isExpected).toBe(true)
      // Friendly print verify (T5.1 research.ts CLI surfaces this on phase=install)
      expect(err.message).toMatch(/skill|install|restart/i)
    }
  }, 10_000)
})

describe.skipIf(!REAL)('research workflow E2E — real-spawn (HARNESSED_REAL_SPAWN=1)', () => {
  it('4. real claude CLI spawn → real ctx7 lookup → verbatim COMPLETE round-trip', async () => {
    // Manual verify only — requires:
    //   1. claude CLI installed (verified phase 1.4 T2.1 spike — Win Git Bash v2.1.133)
    //   2. ctx7 skill installed (`harnessed install ctx7 --apply` or equivalent)
    //   3. ANTHROPIC_API_KEY env var set
    // Run: HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter routing-research-workflow
    //
    // This cell is intentionally minimal — full real-spawn coverage is owned
    // by spike script (scripts/spike/routing-spawn-agent.sh) for one-shot
    // smoke checks; embedding it here lets devs verify the engine wiring
    // glue post-implementation without re-running the spike.
    throw new Error(
      'real-spawn cell requires query() SDK wiring (deferred to phase 1.5 per F40-2). ' +
        'Run scripts/spike/routing-spawn-agent.sh for current end-to-end verify.',
    )
  }, 60_000)
})
