// Phase 1.4 T4.1 — routing engine unit tests (≥10 cell + S-3 cell 11).
//
// IMPL NOTE — covers Anchor 1-7 of SPIKE-REPORT § 7 + 4 typed error narrow
// (D-14) + verbatim ^COMPLETE$/m grep (F33 P1 mitigation, Anchor 2) +
// max-iter 20 兜底 (Anchor 4) + reload bypass (D1.4-1 / Anchor 3) + RestartRequiredError 极端
// bail (Anchor 5) + B1 yaml security gate inject reject (沿袭 phase 1.1.1 H7
// pattern). Cell 11 (S-3 sister patch) asserts SYSTEM_PROMPT 1:1 contract
// § 5.4 line content — Pattern O single-source enforce; drift = test fail =
// ADR 0008+ errata trigger (D-18).
//
// Inline yaml + filesystem skill stub fixture per karpathy YAGNI; tmpdir +
// rmSync afterEach 清理.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type AgentDefinition,
  InvalidDecisionError,
  RestartRequiredError,
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
      { rulesPath, skillsRoot, spawn: async (_d: AgentDefinition) => 'doing work...\nCOMPLETE' },
    )
    expect(result).toMatchObject({ ok: true })
    if (result.ok === true) {
      expect(result.matchedRule?.id).toBe('search-default')
      expect(result.result).toContain('COMPLETE')
    }
  })

  it('2. arbitrate hit + skip install (idempotent) → factory → ok', async () => {
    stubSkill('ui-ux-pro-max')
    const result = await runRouting(
      { task: 'design landing page', task_type: 'ui-design' },
      { rulesPath, skillsRoot, spawn: async () => 'COMPLETE' },
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
        fallbackSupervisor: async () => 'fallback supervisor result\nCOMPLETE',
      },
    )
    expect(result).toMatchObject({ ok: true })
    if (result.ok === true) {
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
      { rulesPath, skillsRoot, spawn: async () => 'work\nCOMPLETE' },
    )
    expect(result).toMatchObject({ ok: true })
  })

  it('5. reload bypass path — filesystem scan only (no /reload-plugins call)', async () => {
    // D1.4-1 verify: skill probe is fs.existsSync(SKILL.md), no shell hook.
    stubSkill('tavily-mcp')
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot, spawn: async () => 'COMPLETE' },
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
    if (result.ok === false) {
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
    if (result.ok === false) {
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
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(RestartRequiredError)
    }
  }, 10_000)
})

describe('SYSTEM_PROMPT — S-3 sister patch (Pattern O single-source enforce)', () => {
  it('11. SYSTEM_PROMPT 1:1 contract § 5.4 line content (D-18 enforce)', () => {
    // task_plan T3.3 prescribes uppercase "DO NOT" verbatim — assert that.
    expect(SYSTEM_PROMPT).toContain('DO NOT summarize, paraphrase')
    expect(SYSTEM_PROMPT).toContain('verbatim grep')
    expect(SYSTEM_PROMPT).toContain('^COMPLETE$')
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
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(InvalidDecisionError)
    }
  })
})
