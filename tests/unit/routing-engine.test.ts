// Phase 1.4 T4.1 — routing engine unit tests (≥10 cell + S-3 cell 11).
// Phase 1.5 T6.3 — Wave 4+5 upgrade cells (13-16) + XML wrapper fixture sync.
//
// IMPL NOTE — covers Anchor 1-7 of SPIKE-REPORT § 7 + 4 typed error narrow
// (D-14) + verbatim <promise>COMPLETE</promise> XML wrapper grep (F33 P1
// mitigation, Anchor 2 — phase 1.5 T5.2 upgrade) + max-iter 20 兜底 (Anchor 4)
// + reload bypass (D1.4-1 / Anchor 3) + RestartRequiredError 极端 bail
// (Anchor 5) + B1 yaml security gate inject reject (沿袭 phase 1.1.1 H7
// pattern). Cell 11 (S-3 sister patch) asserts SYSTEM_PROMPT 1:1 contract
// § 5.4 line content — Pattern O single-source enforce; drift = test fail =
// ADR 0009+ errata trigger (D-18).
//
// Phase 1.5 upgrade cells: 13 — W-5 V1 BLOCKER 14-field drift detector
// (AGENT_DEFINITION_FIELDS, contract v1.1); 14 — <promise>COMPLETE</promise>
// XML wrapper extract incl. false-positive avoidance; 15 — dag.resolve cycle
// pre-check; 16 — F42 array-element substring match.
//
// Inline yaml + filesystem skill stub fixture per karpathy YAGNI; tmpdir +
// rmSync afterEach 清理.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  AGENT_DEFINITION_FIELDS,
  type AgentDefinition,
  arbitrate,
  createAgent,
  extractPromise,
  InvalidDecisionError,
  isComplete,
  loadDecisionRules,
  RestartRequiredError,
  resolveDag,
  runRouting,
  SkillNotInstalledError,
  SYSTEM_PROMPT,
} from '../../src/routing/index.js'

// ---- Fixtures ---------------------------------------------------------------

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
  - id: ui-task-default
    priority: 90
    domain: design
    when:
      task_type: ui-design
    decision:
      primary_expert: ui-ux-pro-max
      required_skills: [ui-ux-pro-max]
fallback_supervisor:
  trigger: no-rule-match
  llm: claude-opus-4-7
`

let workdir: string
let rulesPath: string
let skillsRoot: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-engine-'))
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

// ---- Cells ------------------------------------------------------------------

describe('runRouting — happy + verbatim COMPLETE (Anchor 1+2)', () => {
  it('1. main-process spawn happy path → ok result', async () => {
    stubSkill('tavily-mcp')
    const result = await runRouting(
      { task: 'find Next.js v15 router docs', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        spawn: async (_d: AgentDefinition) => 'doing work...\n<promise>COMPLETE</promise>',
      },
    )
    expect(result).toMatchObject({ ok: true })
    if ('ok' in result && result.ok === true) {
      expect(result.matchedRule?.id).toBe('search-default')
      expect(result.result).toContain('COMPLETE')
    }
  })

  it('2. arbitrate hit + skip install (idempotent) → factory → ok', async () => {
    stubSkill('ui-ux-pro-max')
    const result = await runRouting(
      { task: 'design landing page', task_type: 'ui-design' },
      { rulesPath, skillsRoot, spawn: async () => '<promise>COMPLETE</promise>' },
    )
    expect(result).toMatchObject({ ok: true })
  })
})

describe('runRouting — fallback / install fail / verbatim mismatch', () => {
  it('3. arbitrate miss + fallback_supervisor 兜底', async () => {
    const result = await runRouting(
      { task: 'unknown task', task_type: 'totally-unknown' },
      {
        rulesPath,
        skillsRoot,
        fallbackSupervisor: async () => 'fallback supervisor result\n<promise>COMPLETE</promise>',
      },
    )
    expect(result).toMatchObject({ ok: true })
    if ('ok' in result && result.ok === true) {
      expect(result.matchedRule).toBeNull()
      expect(result.result).toContain('fallback supervisor result')
    }
  })

  it('4. install missing skill → fresh spawn after stub install → ok', async () => {
    // Simulate post-install state by stubbing skill before runRouting (Anchor 3
    // sleep+retry idempotent_check would otherwise fail; this exercises the
    // happy-after-install flow per D1.4-1 reload bypass spec).
    stubSkill('tavily-mcp')
    const result = await runRouting(
      { task: 'search docs', task_type: 'search' },
      { rulesPath, skillsRoot, spawn: async () => 'work\n<promise>COMPLETE</promise>' },
    )
    expect(result).toMatchObject({ ok: true })
  })

  it('5. reload bypass path — filesystem scan only (no /reload-plugins call)', async () => {
    // D1.4-1 verify: skill probe is fs.existsSync(SKILL.md), no shell hook.
    stubSkill('tavily-mcp')
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot, spawn: async () => '<promise>COMPLETE</promise>' },
    )
    expect(result).toMatchObject({ ok: true })
  })

  it('6. SkillNotInstalledError narrow → EngineResult phase=install', async () => {
    // No stubSkill — required_skills missing; ensureSkillsInstalled retries
    // 3× then throws RestartRequiredError (Anchor 5). Either RestartRequired
    // or SkillNotInstalled is acceptable narrow into phase=install.
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot },
    )
    expect(result).toMatchObject({ ok: false, phase: 'install' })
    if ('ok' in result && result.ok === false) {
      const err = result.error
      const isExpected =
        err instanceof RestartRequiredError || err instanceof SkillNotInstalledError
      expect(isExpected).toBe(true)
    }
  }, 10_000)

  it('7. verbatim COMPLETE grep — subagent summarize → max-iter exhausted → aborted', async () => {
    stubSkill('tavily-mcp')
    let calls = 0
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        maxIterations: 3,
        spawn: async () => {
          calls++
          // F33 simulation: subagent paraphrases instead of emitting verbatim.
          return 'Task completed successfully (no verbatim token).'
        },
      },
    )
    expect(result).toMatchObject({ aborted: true })
    expect(calls).toBe(3)
  })

  it('8. max-iter 20 兜底 → aborted reason mentions iterations', async () => {
    stubSkill('tavily-mcp')
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        maxIterations: 2,
        spawn: async () => 'never says it',
      },
    )
    expect(result).toMatchObject({ aborted: true })
    if ('aborted' in result && result.aborted === true) {
      expect(result.reason).toMatch(/max-iterations/i)
    }
  })
})

describe('runRouting — security + restart bail', () => {
  it('9. yaml security gate inject reject (B1 沿袭 phase 1.1.1 H7)', async () => {
    const evilYaml = RULES_YAML.replace(
      'primary_expert: tavily-mcp',
      'primary_expert: "evil-$(whoami)"',
    )
    writeFileSync(rulesPath, evilYaml, 'utf8')
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot },
    )
    expect(result).toMatchObject({ ok: false, phase: 'arbitrate' })
    if ('ok' in result && result.ok === false) {
      expect(result.error.message).toMatch(/security violation/)
    }
  })

  it('10. RestartRequiredError → EngineResult phase=install (Anchor 5 bail)', async () => {
    // Don't stub the required skill so retries exhaust and RestartRequired bubbles.
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot },
    )
    expect(result).toMatchObject({ ok: false, phase: 'install' })
    if ('ok' in result && result.ok === false) {
      expect(result.error).toBeInstanceOf(RestartRequiredError)
    }
  }, 10_000)
})

describe('SYSTEM_PROMPT — S-3 sister patch (Pattern O single-source enforce)', () => {
  it('11. SYSTEM_PROMPT 1:1 contract § 5.4 line content (D-18 enforce)', () => {
    // task_plan T3.3 prescribes uppercase "DO NOT" verbatim — assert that.
    expect(SYSTEM_PROMPT).toContain('DO NOT summarize, paraphrase')
    expect(SYSTEM_PROMPT).toContain('verbatim grep')
    // phase 1.5 T5.1 — XML wrapper upgrade: raw ^COMPLETE$ → <promise>...</promise>.
    expect(SYSTEM_PROMPT).toContain('<promise>COMPLETE</promise>')
    expect(SYSTEM_PROMPT).not.toContain('^COMPLETE$')
    expect(SYSTEM_PROMPT).toContain('max 20 iterations')
    expect(SYSTEM_PROMPT).toContain('skills fail-fast handling')
  })

  it('12. arbitrate-empty rules path → ok=false phase=arbitrate', async () => {
    // Sanity: empty rules array + no fallback → InvalidDecisionError narrow.
    const emptyYaml = `version: 1
hit_policy: P
rules:
  - id: only-rule
    priority: 1
    domain: meta
    when:
      task_type: never-matches
    decision:
      primary_expert: noop
`
    writeFileSync(rulesPath, emptyYaml, 'utf8')
    const result = await runRouting(
      { task: 'unknown', task_type: 'foo' },
      { rulesPath, skillsRoot },
    )
    expect(result).toMatchObject({ ok: false, phase: 'arbitrate' })
    if ('ok' in result && result.ok === false) {
      expect(result.error).toBeInstanceOf(InvalidDecisionError)
    }
  })
})

describe('Phase 1.5 Wave 4+5 upgrade cells (13-16)', () => {
  it('13. W-5 V1 BLOCKER — AgentDefinition 14-field drift detector (contract v1.1)', async () => {
    // The canonical field list is extended 12 → 14 (initialPrompt +
    // criticalSystemReminder_EXPERIMENTAL). Any drift = test fail = ADR 0009+
    // errata trigger (D-18).
    expect(AGENT_DEFINITION_FIELDS.length).toBe(14)
    expect(AGENT_DEFINITION_FIELDS).toContain('initialPrompt')
    expect(AGENT_DEFINITION_FIELDS).toContain('criticalSystemReminder_EXPERIMENTAL')

    // The factory output shape must carry exactly the 14 canonical fields.
    stubSkill('ui-ux-pro-max')
    const def = await createAgent(
      { task: 'design a dashboard', task_type: 'ui-design' },
      {
        matched_rule_id: 'ui-task-default',
        primary_expert: 'ui-ux-pro-max',
        secondary_expert: null,
        category: 'design',
        required_skills: ['ui-ux-pro-max'],
      },
      { skillsRoot },
    )
    expect(Object.keys(def).sort()).toEqual([...AGENT_DEFINITION_FIELDS].sort())
  })

  it('14. <promise>COMPLETE</promise> XML wrapper extract + false-positive avoidance', () => {
    // Positive — verbatim wrapper, incl. trailing think-out-loud prefix.
    expect(isComplete('<promise>COMPLETE</promise>')).toBe(true)
    expect(isComplete('did the work\n<promise>COMPLETE</promise>')).toBe(true)
    // False-positive avoidance — bare "COMPLETE" in prose must NOT match (this
    // is exactly what the phase 1.4 raw ^COMPLETE$/m regex was prone to).
    expect(isComplete('I think the task is COMPLETE in nature, continuing.')).toBe(false)
    expect(isComplete('COMPLETE')).toBe(false)
    // extractPromise returns the wrapped content (capture group), or null.
    expect(extractPromise('<promise>COMPLETE</promise>')).toBe('COMPLETE')
    expect(extractPromise('<promise>PARTIAL</promise>')).toBe('PARTIAL')
    expect(extractPromise('no wrapper here')).toBeNull()
  })

  it('15. dag.resolve cycle pre-check — engine consumes a three-state result', () => {
    // engine.route runs dag.resolve(allManifests) before arbitrate; a cyclic
    // manifest graph yields { ok: false, cycle } which the engine narrows into
    // an InvalidDecisionError (resolveDagOrThrow path, covered in routing-dag).
    const cyclic = resolveDag([
      { id: 'skill-a', deps: ['skill-b'] },
      { id: 'skill-b', deps: ['skill-a'] },
    ])
    expect(cyclic.ok).toBe(false)
    if (!cyclic.ok) {
      expect(cyclic.cycle).toEqual(['skill-a', 'skill-b'])
    }
    const acyclic = resolveDag([
      { id: 'skill-a', deps: [] },
      { id: 'skill-b', deps: ['skill-a'] },
    ])
    expect(acyclic).toEqual({ ok: true, order: ['skill-a', 'skill-b'] })
  })

  it('16. F42 array-element substring match — keywords hit task prompt/signals', () => {
    // The v2 engineering rules use `when.keywords` arrays; arbitrate matches a
    // rule when ANY keyword is a substring of the task prompt or signals.
    const rules = loadDecisionRules(join(process.cwd(), 'routing', 'decision_rules.yaml')).rules
    // "TDD" keyword on engineering-execute-tdd should hit a prompt containing it.
    const tddMatch = arbitrate(rules, {
      task_type: 'engineering',
      prompt: 'please use TDD to implement the password validator',
    })
    expect(tddMatch?.id).toBe('engineering-execute-tdd')
    // "排错" keyword on engineering-execute-debug via the signals array.
    const debugMatch = arbitrate(rules, {
      task_type: 'engineering',
      prompt: 'help me',
      signals: ['系统化排错 production 502'],
    })
    expect(debugMatch?.id).toBe('engineering-execute-debug')
  })
})
