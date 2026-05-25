// Phase v3.4.4 Phase 4 Commit 2 — buildAgentDef enrich unit test (4 fixtures).
// `buildAgentDef` is private to src/workflow/run.ts (not exported); we exercise
// it indirectly via `_dispatchSkillStub.fn`, which calls it inside `spawnOnce`.
// `sdkSpawn` is vi.mock'd at the module boundary so we capture the AgentDefinition
// argument and assert on its shape.
//
// Fixtures (per PHASE-4-SPEC L420-423):
//   F1. known skillName (`'verify-paranoid'`) + non-empty rolePrompts → prompt
//       contains responsibility text + ≥5 checklist items
//   F2. unknown skillName (`'fake-phase-id'`) → conservative 2-field stub
//   F3. empty/undefined rolePrompts → conservative fallback regardless of skillName
//   F4. modelTierOverride === 'inherit' → def.model === 'inherit'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RolePrompt } from '../../src/cli/lib/generateCommands.js'
import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'

// Capture every AgentDefinition that flows into sdkSpawn so each fixture can
// inspect the def built by buildAgentDef (private to run.ts).
let capturedDefs: AgentDefinition[] = []

vi.mock('../../src/workflow/lib/sdkSpawn.js', () => ({
  sdkSpawn: async (def: AgentDefinition, _opts: unknown): Promise<string> => {
    capturedDefs.push(def)
    // Return a COMPLETE envelope so _dispatchSkillStub.fn returns ok cleanly
    // (downstream JSON.parse + status check passes). Single-shot path (no
    // ralph-loop opt-in) — we drive phase=undefined so isRalphLoopOptIn → false.
    return JSON.stringify({
      subtype: 'success',
      structured_output: { status: 'COMPLETE' },
      result: '<promise>COMPLETE</promise>',
    })
  },
}))

// SDK mock to keep any incidental query() call inert.
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

import { _dispatchSkillStub } from '../../src/workflow/run.js'

const VERIFY_PARANOID_ROLE: RolePrompt = {
  primary_cap: 'gstack-review',
  specialist: 'Paranoid Staff Engineer (pre-landing review)',
  responsibility:
    'Mandatory on critical modules (auth / payment / data migration / core algorithm). Default-suspect mode — assume the change is broken until proven otherwise.',
  checklist: [
    'SQL & Data Safety — string interpolation, TOCTOU races, validation bypass, N+1',
    'Race conditions & concurrency — read-check-write without unique constraint',
    'LLM output trust boundary — unvalidated LLM-generated values to DB / SSRF',
    'Shell injection — subprocess shell=True with interpolation, os.system, eval/exec',
    'Enum & value completeness — new enum/status/tier value reached every consumer',
    'Async/sync mixing — sync I/O inside async def, time.sleep in async',
    'Column/field name safety — ORM .select/.eq columns match schema',
  ],
  severity:
    'CRITICAL / INFORMATIONAL (Fix-First Heuristic — critical → ASK, informational → AUTO-FIX)',
  description:
    'Paranoid Staff Engineer pre-landing review (default-suspect mode, critical+informational two-pass).',
}

const ROLE_PROMPTS: Record<string, RolePrompt> = {
  'verify-paranoid': VERIFY_PARANOID_ROLE,
}

beforeEach(() => {
  capturedDefs = []
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('buildAgentDef — Phase 4 role-prompts enrichment (4 fixtures)', () => {
  it('F1. known skillName + non-empty rolePrompts → prompt contains responsibility + ≥5 checklist items', async () => {
    // skillName matches a key in rolePrompts directly (D-3 step 1 hit).
    const r = await _dispatchSkillStub.fn('verify-paranoid', undefined, {
      rolePrompts: ROLE_PROMPTS,
    })
    expect(r.status).toBe('ok')
    expect(capturedDefs).toHaveLength(1)
    const def = capturedDefs[0] as AgentDefinition
    // Description sourced from RolePrompt.description (not the conservative fallback).
    expect(def.description).toBe(VERIFY_PARANOID_ROLE.description)
    // Prompt includes the specialist persona line.
    expect(def.prompt).toContain('You are a Paranoid Staff Engineer')
    // Prompt includes responsibility text (trimmed).
    expect(def.prompt).toContain('Default-suspect mode')
    expect(def.prompt).toContain('Mandatory on critical modules')
    // Severity scale line spliced in.
    expect(def.prompt).toContain('Severity scale: CRITICAL / INFORMATIONAL')
    // Checklist numbered list ≥5 items.
    expect(def.prompt).toContain('Checklist:')
    expect(def.prompt).toContain('  1. SQL & Data Safety')
    expect(def.prompt).toContain('  5. Enum & value completeness')
    // Verify ≥5 numbered checklist lines via regex count.
    const checklistMatches = def.prompt.match(/^ {2}\d+\. /gm) ?? []
    expect(checklistMatches.length).toBeGreaterThanOrEqual(5)
    // COMPLETE-signal instruction always appended.
    expect(def.prompt).toContain('Emit a structured COMPLETE signal when done.')
  })

  it('F2. unknown skillName → conservative 2-field stub (description + prompt only)', async () => {
    const r = await _dispatchSkillStub.fn('fake-phase-id', undefined, {
      rolePrompts: ROLE_PROMPTS,
    })
    expect(r.status).toBe('ok')
    expect(capturedDefs).toHaveLength(1)
    const def = capturedDefs[0] as AgentDefinition
    // Conservative stub — Phase 2 behavior preserved verbatim.
    expect(def.description).toBe('harnessed workflow phase: fake-phase-id')
    expect(def.prompt).toBe(
      "You are executing the 'fake-phase-id' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.",
    )
    // No model field set (no modelTierOverride passed).
    expect(def.model).toBeUndefined()
    // No checklist / responsibility splicing happened.
    expect(def.prompt).not.toContain('Checklist:')
    expect(def.prompt).not.toContain('Severity scale:')
  })

  it('F3. empty/undefined rolePrompts → conservative fallback regardless of skillName', async () => {
    // Case A: rolePrompts undefined.
    const rA = await _dispatchSkillStub.fn('verify-paranoid', undefined, {})
    expect(rA.status).toBe('ok')
    // Case B: rolePrompts = {} (empty map).
    const rB = await _dispatchSkillStub.fn('verify-paranoid', undefined, { rolePrompts: {} })
    expect(rB.status).toBe('ok')
    expect(capturedDefs).toHaveLength(2)
    for (const def of capturedDefs) {
      expect(def.description).toBe('harnessed workflow phase: verify-paranoid')
      expect(def.prompt).toBe(
        "You are executing the 'verify-paranoid' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.",
      )
      // Importantly — even though skillName matches a key that exists in our F1
      // fixture rolePrompts, an empty/missing rolePrompts means NO enrichment.
      expect(def.prompt).not.toContain('Checklist:')
    }
  })

  // v3.6.0 Phase 3 Wave 4 — verify both code paths inject CRITICAL_SYSTEM_REMINDER
  // (= ESCALATION_RULES + TRANSPARENT_SKIP_RULES) instead of bare ESCALATION_RULES.
  it('F5 (Phase 3). conservative fallback path → criticalSystemReminder contains BOTH escalation + transparent-skip', async () => {
    const r = await _dispatchSkillStub.fn('fake-phase-id', undefined, {})
    expect(r.status).toBe('ok')
    expect(capturedDefs).toHaveLength(1)
    const def = capturedDefs[0] as AgentDefinition
    const reminder = def.criticalSystemReminder_EXPERIMENTAL ?? ''
    // Phase 2 ESCALATION_RULES preserved
    expect(reminder).toContain('needs_teams_escalation')
    expect(reminder).toContain('teammate_send_message_needed')
    expect(reminder).toContain('fullstack_three_way')
    // Phase 3 TRANSPARENT_SKIP_RULES appended
    expect(reminder).toContain('Skipped <phase>, because <reason>')
    expect(reminder).toContain('Tell me if you actually need it')
    expect(reminder).toContain('Chain-isolation rule')
    expect(reminder).toContain('这次跳过了')
  })

  it('F6 (Phase 3). rolePrompt-found path → criticalSystemReminder also contains BOTH', async () => {
    const r = await _dispatchSkillStub.fn('verify-paranoid', undefined, {
      rolePrompts: ROLE_PROMPTS,
    })
    expect(r.status).toBe('ok')
    expect(capturedDefs).toHaveLength(1)
    const def = capturedDefs[0] as AgentDefinition
    const reminder = def.criticalSystemReminder_EXPERIMENTAL ?? ''
    // Verify same combined string applied to enriched path (sister verbatim Phase 2 ship)
    expect(reminder).toContain('needs_teams_escalation')
    expect(reminder).toContain('Skipped <phase>, because <reason>')
    expect(reminder).toContain('Chain-isolation rule')
  })

  it("F4. modelTierOverride === 'inherit' → def.model === 'inherit' (B-10 escape hatch)", async () => {
    // Case A: with enrichment (known skill).
    const rA = await _dispatchSkillStub.fn('verify-paranoid', undefined, {
      rolePrompts: ROLE_PROMPTS,
      modelTierOverride: 'inherit',
    })
    expect(rA.status).toBe('ok')
    // Case B: conservative fallback path also honors modelTierOverride.
    const rB = await _dispatchSkillStub.fn('fake-phase-id', undefined, {
      modelTierOverride: 'inherit',
    })
    expect(rB.status).toBe('ok')
    expect(capturedDefs).toHaveLength(2)
    for (const def of capturedDefs) {
      expect(def.model).toBe('inherit')
    }
    // Sanity — enriched def still carries the role-prompt-derived description.
    expect(capturedDefs[0]?.description).toBe(VERIFY_PARANOID_ROLE.description)
    // Sanity — fallback def keeps the conservative description.
    expect(capturedDefs[1]?.description).toBe('harnessed workflow phase: fake-phase-id')
  })
})
