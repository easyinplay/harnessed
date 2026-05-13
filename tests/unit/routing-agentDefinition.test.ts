// Phase 1.4 T4.2 — AgentDefinition factory unit tests (≥8 cell — V1 BLOCKER
// 12 字段 1:1 对齐 contract enforce + 4 error path narrow + B-1/B-2 enum
// value assert + D1.4-14 4 心法 prepend verify + ENV override).
//
// IMPL NOTE — W-5 V1 BLOCKER plan-checker enforce: cell 1 explicitly asserts
// memory ∈ {'user','project','local'} + permissionMode ∈ {'default',
// 'acceptEdits','bypassPermissions','plan'} so any drift on contract § 2
// optional-field enums = test fail = ADR 0008+ errata trigger (D-18).
// Karpathy YAGNI: tmpdir + stubSkill helper, no fixtures dir.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ArbitrateResult,
  createAgent,
  InvalidDecisionError,
  MissingSkillsError,
  SkillNotInstalledError,
  type TaskContext,
} from '../../src/routing/index.js'

let workdir: string
let skillsRoot: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-agentdef-'))
  skillsRoot = join(workdir, 'skills')
  mkdirSync(skillsRoot, { recursive: true })
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
  delete process.env.HARNESSED_AGENT_MODEL
})

function stubSkill(name: string): void {
  mkdirSync(join(skillsRoot, name), { recursive: true })
  writeFileSync(join(skillsRoot, name, 'SKILL.md'), `# ${name}\n`, 'utf8')
}

const SAMPLE_TASK: TaskContext = {
  task: 'design a landing page for the harnessed marketing site',
  task_type: 'ui-design',
}

const SAMPLE_DECISION: ArbitrateResult = {
  matched_rule_id: 'ui-task-default',
  primary_expert: 'ui-ux-pro-max',
  secondary_expert: 'frontend-design',
  category: 'design',
  required_skills: ['ui-ux-pro-max'],
}

describe('createAgent — 12 字段 shape (W-5 V1 BLOCKER 1:1 contract § 2)', () => {
  it('1. 12 字段 shape + memory/permissionMode enum value asserts (B-1/B-2 fix)', async () => {
    stubSkill('ui-ux-pro-max')
    const def = await createAgent(SAMPLE_TASK, SAMPLE_DECISION, { skillsRoot })
    // Required (§ 2.1)
    expect(def).toHaveProperty('description')
    expect(def).toHaveProperty('prompt')
    // Optional (§ 2.2)
    expect(def).toHaveProperty('tools')
    expect(def).toHaveProperty('disallowedTools')
    expect(def).toHaveProperty('model')
    expect(def).toHaveProperty('skills')
    expect(def).toHaveProperty('mcpServers')
    expect(def).toHaveProperty('memory')
    expect(def).toHaveProperty('maxTurns')
    expect(def).toHaveProperty('background')
    expect(def).toHaveProperty('effort')
    expect(def).toHaveProperty('permissionMode')
    // B-1 V1 BLOCKER — memory enum value lock
    expect(['user', 'project', 'local']).toContain(def.memory)
    // B-2 V1 BLOCKER — permissionMode enum value lock
    expect(['default', 'acceptEdits', 'bypassPermissions', 'plan']).toContain(def.permissionMode)
  })

  it('2. factory signature 类型 verify (compile-time + runtime)', async () => {
    stubSkill('ui-ux-pro-max')
    type AgentFactory = typeof createAgent
    // Compile-time: AgentFactory should match (task, decision, opts) =>
    // Promise<AgentDefinition>; runtime ensures the type alias is callable.
    const fn: AgentFactory = createAgent
    const def = await fn(SAMPLE_TASK, SAMPLE_DECISION, { skillsRoot })
    expect(typeof def.description).toBe('string')
    expect(typeof def.prompt).toBe('string')
  })
})

describe('createAgent — 4 typed error class throw paths (contract § 5.1, D-14)', () => {
  it('3. SkillNotInstalledError — partial skills missing → reject', async () => {
    // 1 stubbed (primary_expert), 1 missing → triggers SkillNotInstalledError
    stubSkill('ui-ux-pro-max')
    const decision: ArbitrateResult = {
      ...SAMPLE_DECISION,
      required_skills: ['ui-ux-pro-max', 'frontend-design'],
    }
    await expect(createAgent(SAMPLE_TASK, decision, { skillsRoot })).rejects.toThrow(
      SkillNotInstalledError,
    )
  })

  it('4. InvalidDecisionError — primary_expert null → reject', async () => {
    const decision: ArbitrateResult = {
      ...SAMPLE_DECISION,
      primary_expert: null,
    }
    await expect(createAgent(SAMPLE_TASK, decision, { skillsRoot })).rejects.toThrow(
      InvalidDecisionError,
    )
  })

  it('5. MissingSkillsError — all required skills missing → reject', async () => {
    const decision: ArbitrateResult = {
      ...SAMPLE_DECISION,
      required_skills: ['skill-a', 'skill-b'],
    }
    await expect(createAgent(SAMPLE_TASK, decision, { skillsRoot })).rejects.toThrow(
      MissingSkillsError,
    )
  })

  it('6. throw-error not return Result (D-14 verify) — rejects, no .ok=false', async () => {
    const decision: ArbitrateResult = {
      ...SAMPLE_DECISION,
      primary_expert: null,
    }
    // D-14: factory uses throw, not Result wrap. Compare with engine.ts which
    // *does* narrow into EngineResult — boundary respected.
    await expect(createAgent(SAMPLE_TASK, decision, { skillsRoot })).rejects.toBeInstanceOf(Error)
  })
})

describe('createAgent — D1.4-14 prompt template + ENV override', () => {
  it('7. prompt 注入 4 心法 + COMPLETE_INSTRUCTION (D1.4-14 verify)', async () => {
    stubSkill('ui-ux-pro-max')
    const def = await createAgent(SAMPLE_TASK, SAMPLE_DECISION, { skillsRoot })
    expect(def.prompt).toContain('Think Before Coding')
    expect(def.prompt).toContain('Simplicity First')
    expect(def.prompt).toContain('Surgical Changes')
    expect(def.prompt).toContain('Goal-Driven Execution')
    // COMPLETE_INSTRUCTION reference
    expect(def.prompt).toContain('COMPLETE')
    // task body verbatim
    expect(def.prompt).toContain(SAMPLE_TASK.task)
  })

  it('8. ENV override decision.model — HARNESSED_AGENT_MODEL=opus → model: opus', async () => {
    stubSkill('ui-ux-pro-max')
    process.env.HARNESSED_AGENT_MODEL = 'opus'
    const def = await createAgent(SAMPLE_TASK, SAMPLE_DECISION, { skillsRoot })
    expect(def.model).toBe('opus')
  })

  it('9. opts.modelOverride beats ENV — modelOverride: haiku → haiku', async () => {
    stubSkill('ui-ux-pro-max')
    process.env.HARNESSED_AGENT_MODEL = 'opus'
    const def = await createAgent(SAMPLE_TASK, SAMPLE_DECISION, {
      skillsRoot,
      modelOverride: 'haiku',
    })
    expect(def.model).toBe('haiku')
  })
})
