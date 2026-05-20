// Phase v2.0-2.5 W1 Cycle 1 — parallelism-gate + Agent Teams dogfood
//
// Verifies R20.11 (parallelism-gate yaml 3 route 实装路径 完整) + Agent Teams
// env check (R20.11 acceptance + Q-AUDIT-5b root-level env.* schema)。
//
// NOT a unit test (mock-based) — this is dogfood:
//   - real fs.readFile workflows/judgments/parallelism-gate.yaml (no mock)
//   - real resolveJudgmentGate path (T2.3.W0.4 SHIPPED) + real evalGate
//     (T2.3.W0.3 SHIPPED) + real TypeBox JudgmentTriggersFile schema check
//     (T2.3.W0.6 SHIPPED)
//   - real checkAgentTeams() probe — env=CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
//     verified on dev machine 2026-05-20
//
// Sister Phase 4.3 DOGFOOD-T2.X.md 3-axis pattern 沿袭 (verbatim from execute
// task brief). 5 fixture covering 3 route × 5 trigger matrix per task spec.
//
// Cross-OS perf bar: 5/5 < 200ms (Windows fs cold readFile + parse).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { checkAgentTeams } from '../../src/cli/lib/checkAgentTeams.js'
import { _clearJudgmentCache, resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'
import { JudgmentTriggersFile } from '../../src/workflow/schema/judgment.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearJudgmentCache()
})

afterEach(() => {
  _clearJudgmentCache()
})

describe('Phase v2.0-2.5 W1 Cycle 1 — parallelism-gate + Agent Teams dogfood', () => {
  // ==========================================================================
  // F1 — Scenario A: subagent-default route
  // (默认 fan-out, parallel_count <= 3 AND communication_needed == false)
  // ==========================================================================
  it('F1. Scenario A — subagent-default.fires === true (parallel_count=2, no communication)', async () => {
    const fires = await resolveJudgmentGate(
      'judgments.parallelism-gate.subagent-default.fires',
      {
        subtask: {
          parallel_count: 2,
          communication_needed: false,
        },
      },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  // ==========================================================================
  // F2 — Scenario B: main-session-fallback route
  // (降级 主 session 直跑, lines < 20 OR type == 'single_command_query')
  // ==========================================================================
  it('F2. Scenario B — main-session-fallback.fires === true (lines=15 single query)', async () => {
    const fires = await resolveJudgmentGate(
      'judgments.parallelism-gate.main-session-fallback.fires',
      {
        subtask: {
          lines: 15,
          type: 'single_command_query',
        },
      },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  // ==========================================================================
  // F3 — Scenario C: agent-teams-upgrade 5 trigger OR-chain
  // (升级 Agent Teams, 5 trigger 任一激活 fires=true per ~/.claude/rules/
  //  agent-teams.md 升级触发节)
  // ==========================================================================
  it('F3. Scenario C — agent-teams-upgrade.fires === true for each of 5 triggers独立激活', async () => {
    const baseCtx = {
      teammate_send_message_needed: false,
      subagent_context_overflow: false,
      shared_task_list: false,
      opposing_hypothesis_debate: false,
      fullstack_three_way: false,
    }

    // T1 — teammate SendMessage 互通
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        { ...baseCtx, teammate_send_message_needed: true },
        PACKAGE_ROOT,
      ),
    ).toBe(true)

    // T2 — subagent context overflow 需分担
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        { ...baseCtx, subagent_context_overflow: true },
        PACKAGE_ROOT,
      ),
    ).toBe(true)

    // T3 — 共享 task list 自协调
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        { ...baseCtx, shared_task_list: true },
        PACKAGE_ROOT,
      ),
    ).toBe(true)

    // T4 — 对立假设辩论
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        { ...baseCtx, opposing_hypothesis_debate: true },
        PACKAGE_ROOT,
      ),
    ).toBe(true)

    // T5 — 全栈三路协同
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        { ...baseCtx, fullstack_three_way: true },
        PACKAGE_ROOT,
      ),
    ).toBe(true)

    // Sanity — all 5 false 应 fires=false (baseline negative case)
    expect(
      await resolveJudgmentGate(
        'judgments.parallelism-gate.agent-teams-upgrade.fires',
        baseCtx,
        PACKAGE_ROOT,
      ),
    ).toBe(false)
  })

  // ==========================================================================
  // F4 — checkAgentTeams() real probe (NO mock — Q-AUDIT-5b root-level env.*)
  // Dev machine 2026-05-20 实证: env=CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 +
  // settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 both ON.
  // ==========================================================================
  it('F4. checkAgentTeams() real probe — status=pass on dev machine', async () => {
    const r = await checkAgentTeams()
    // Dogfood asserts dev machine 实际 env state: both env and settings should
    // detect Agent Teams enabled. status MUST be 'pass' for Cycle 1 acceptance
    // (R20.11 agent-teams-upgrade route 可实际激活)。
    expect(r.status).toBe('pass')
    expect(r.detected.env || r.detected.settingsJson).toBe(true)
    expect(r.remediation).toBeUndefined()
  })

  // ==========================================================================
  // F5 — parallelism-gate.yaml schema parse + TypeBox JudgmentTriggersFile
  // Value.Check pass (verifies T2.3.W0.2 SHIPPED yaml + T2.3.W0.6 SHIPPED
  // schema 仍 contract-stable)
  // ==========================================================================
  it('F5. parallelism-gate.yaml — TypeBox JudgmentTriggersFile Value.Check pass', async () => {
    const yamlPath = resolve(PACKAGE_ROOT, 'workflows', 'judgments', 'parallelism-gate.yaml')
    const raw = await readFile(yamlPath, 'utf8')
    const parsed = parseYaml(raw) as unknown

    // TypeBox strict schema check — additionalProperties:false should reject
    // any drifted shape (sister R20.4 schema contract guarantee)
    expect(Value.Check(JudgmentTriggersFile, parsed)).toBe(true)

    // Structural assertions — 4 triggers present per W0.2 ship:
    //   subagent-default / main-session-fallback / agent-teams-upgrade /
    //   ralph-loop-wrapper (orthogonal wrapper per R20.10)
    const file = parsed as { triggers: Record<string, unknown> }
    expect(Object.keys(file.triggers)).toEqual(
      expect.arrayContaining([
        'subagent-default',
        'main-session-fallback',
        'agent-teams-upgrade',
        'ralph-loop-wrapper',
      ]),
    )
  })
})
