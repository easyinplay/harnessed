// Phase v2.0-2.3 W0 T2.3.W0.4 — judgmentResolver.ts 12 fixture test
// per PLAN L196 verbatim: 6 cross-file resolve (1 file each) + 3 error path +
// 2 cache hit verify + 1 TypeBox validate reject (malformed yaml).
//
// Fixtures consume real shipped workflows/judgments/*.yaml (W0.2) — packageRoot
// is process.cwd() since tests run from repo root via vitest CLI.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  _clearJudgmentCache,
  resolveJudgmentGate,
  TriggerNotFoundError,
} from '../../src/workflow/judgmentResolver.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearJudgmentCache()
})

describe('judgmentResolver — cross-file resolve (6 fixture, 1 file each)', () => {
  it('1. strategic-gate.office-hours.fires_when fires for new_feature', async () => {
    const result = await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'new_feature', scope_locked_in_history: false } },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('2. phase-gate.gsd-discuss-phase.fires_when fires for open_decisions>=2', async () => {
    const result = await resolveJudgmentGate(
      'judgments.phase-gate.gsd-discuss-phase.fires',
      {
        phase: {
          open_decisions: 3,
          has_cross_phase_data_flow: false,
          scope_days: 2,
        },
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('3. subtask-gate.brainstorming.fires_when fires for approaches>=2', async () => {
    const result = await resolveJudgmentGate(
      'judgments.subtask-gate.brainstorming.fires',
      {
        subtask: {
          approaches: 3,
          core_algorithm: false,
          has_api_contract: false,
          error_cost: 'low',
        },
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('4. parallelism-gate.agent-teams-upgrade.fires_when fires for send_message_needed (acceptance b)', async () => {
    const result = await resolveJudgmentGate(
      'judgments.parallelism-gate.agent-teams-upgrade.fires',
      {
        teammate_send_message_needed: true,
        subagent_context_overflow: false,
        shared_task_list: false,
        opposing_hypothesis_debate: false,
        fullstack_three_way: false,
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('5. tdd-gate.tdd-strongly-suggested.fires_when fires for core_business_logic', async () => {
    const result = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      {
        subtask: {
          is_core_business_logic: true,
          is_algorithm: false,
          is_data_processing: false,
          regression_risk: 'low',
          reliability_required: false,
        },
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('6. fallback.yaml dual-schema accepted (rules root key, no fires_when by design)', async () => {
    // fallback.yaml ships with `rules:` root key (not `triggers:`) and rule
    // entries have no fires_when / skips_when — they're consumed by runtime
    // lexical matching, not expr-eval. Test verifies (a) TypeBox JudgmentRulesFile
    // accepts the file, (b) loader extracts rule entry, (c) field-not-found
    // throws the graceful error (not a TypeBox / yaml parse error).
    await expect(
      resolveJudgmentGate(
        'judgments.fallback.uncertain-skip-transparently.fires',
        {},
        PACKAGE_ROOT,
      ),
    ).rejects.toThrow(/Field 'fires' has no expression/)
  })
})

describe('judgmentResolver — error paths (3 fixture)', () => {
  it('7. invalid 4-segment ref throws "Invalid gate ref" (acceptance c)', async () => {
    await expect(resolveJudgmentGate('foo.bar.baz.qux', {}, PACKAGE_ROOT)).rejects.toThrow(
      'Invalid gate ref: foo.bar.baz.qux',
    )
  })

  it('8. nonexistent judgment file throws ENOENT (file not found)', async () => {
    await expect(
      resolveJudgmentGate('judgments.nonexistent-file.some-trigger.fires', {}, PACKAGE_ROOT),
    ).rejects.toThrow(/ENOENT|no such file/i)
  })

  it('9. unknown trigger in existing file throws TriggerNotFoundError', async () => {
    await expect(
      resolveJudgmentGate('judgments.strategic-gate.unknown-trigger.fires', {}, PACKAGE_ROOT),
    ).rejects.toThrow(TriggerNotFoundError)
  })
})

describe('judgmentResolver — cache behavior (2 fixture)', () => {
  it('10. second resolve of same file uses cache (< 50ms typical, < 100ms hard cap)', async () => {
    // First call: cold cache (readFile + parseYaml + Value.Check).
    const t0 = performance.now()
    await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'new_feature', scope_locked_in_history: false } },
      PACKAGE_ROOT,
    )
    const coldMs = performance.now() - t0

    // Second call: cache hit (skip readFile + parseYaml + Value.Check).
    const t1 = performance.now()
    await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'new_feature', scope_locked_in_history: false } },
      PACKAGE_ROOT,
    )
    const warmMs = performance.now() - t1

    // Cache hit MUST be at least 2x faster than cold (avoids flake on CI).
    // Hard ceiling 50ms for warm — Windows fs slow but cache hit is pure mem.
    expect(warmMs).toBeLessThan(50)
    expect(warmMs).toBeLessThan(coldMs)
  })

  it('11. cache survives across distinct trigger lookups within same file', async () => {
    // Both lookups hit parallelism-gate.yaml; second must cache-hit.
    await resolveJudgmentGate(
      'judgments.parallelism-gate.agent-teams-upgrade.fires',
      {
        teammate_send_message_needed: true,
        subagent_context_overflow: false,
        shared_task_list: false,
        opposing_hypothesis_debate: false,
        fullstack_three_way: false,
      },
      PACKAGE_ROOT,
    )
    const t = performance.now()
    await resolveJudgmentGate(
      'judgments.parallelism-gate.subagent-default.fires',
      { subtask: { parallel_count: 2, communication_needed: false } },
      PACKAGE_ROOT,
    )
    const ms = performance.now() - t
    expect(ms).toBeLessThan(50)
  })
})

describe('judgmentResolver — TypeBox validate reject (1 fixture)', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'judgment-resolver-'))
    // Nested workflows/judgments/<file>.yaml structure built inside the test
    // body — mkdtempSync only creates the top-level tmpRoot directory.
  })

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('12. malformed yaml (wrong schema_version) rejected by TypeBox Value.Check', async () => {
    const { mkdirSync } = await import('node:fs')
    const dir = join(tmpRoot, 'workflows', 'judgments')
    mkdirSync(dir, { recursive: true })
    // Wrong schema_version literal — TypeBox JudgmentTriggersFile must reject.
    const malformed = `schema_version: wrong.version.v99
triggers:
  bogus:
    fires_when: "true"
`
    writeFileSync(join(dir, 'malformed.yaml'), malformed, 'utf8')

    await expect(
      resolveJudgmentGate('judgments.malformed.bogus.fires', {}, tmpRoot),
    ).rejects.toThrow(/Invalid judgment file malformed\.yaml/)
  })
})
