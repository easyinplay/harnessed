// tests/cli/lib/extract-user-overrides.test.ts — v3.6.0 Phase 3 Wave 4.
// Verify CLI keyword extraction logic (P0b 上半 CLI integration shipped Wave 2).
//
// Fixtures (per PHASE-3-SPEC.md L283):
//   F1. substring match for Chinese keyword → return all triggers for matched entry
//   F2. substring match for English keyword → same triggers (case-insensitive)
//   F3. multi-entry match → union of triggers (deduped)
//   F4. empty userText → empty result (no-op)
//   F5. loadUserOverrides reads + validates real shipped yaml (Wave 1)

import { describe, expect, it } from 'vitest'
import {
  extractMatchedTriggers,
  loadUserOverrides,
  type UserOverrideEntry,
} from '../../../src/cli/lib/extract-user-overrides.js'

const PACKAGE_ROOT = process.cwd()

const FIXTURE_OVERRIDES: UserOverrideEntry[] = [
  {
    id: 'brainstorm',
    keywords: ['先 brainstorm', 'brainstorm first'],
    triggers: [
      'judgments.subtask-gate.brainstorming.fires',
      'judgments.stage-routing.discuss-subtask-delegate.fires',
    ],
  },
  {
    id: 'tdd',
    keywords: ['强制 TDD', 'test first'],
    triggers: ['judgments.tdd-gate.tdd-strongly-suggested.fires'],
  },
]

describe('extractMatchedTriggers — Phase 3 keyword match (5 fixtures)', () => {
  it('F1. Chinese substring match → return all triggers of matched entry', () => {
    const result = extractMatchedTriggers('请先 brainstorm 这个算法', FIXTURE_OVERRIDES)
    expect(result).toEqual(
      expect.arrayContaining([
        'judgments.subtask-gate.brainstorming.fires',
        'judgments.stage-routing.discuss-subtask-delegate.fires',
      ]),
    )
    expect(result).toHaveLength(2)
  })

  it('F2. English keyword case-insensitive match', () => {
    // Mixed case — 'BRAINSTORM FIRST' should match 'brainstorm first' keyword.
    const result = extractMatchedTriggers(
      'Let us BRAINSTORM FIRST before coding',
      FIXTURE_OVERRIDES,
    )
    expect(result).toContain('judgments.subtask-gate.brainstorming.fires')
    expect(result).toContain('judgments.stage-routing.discuss-subtask-delegate.fires')
  })

  it('F3. multi-entry match → union deduped', () => {
    // Both 'brainstorm first' AND 'test first' match — union should include all triggers.
    const result = extractMatchedTriggers(
      'brainstorm first then test first before shipping',
      FIXTURE_OVERRIDES,
    )
    expect(result).toEqual(
      expect.arrayContaining([
        'judgments.subtask-gate.brainstorming.fires',
        'judgments.stage-routing.discuss-subtask-delegate.fires',
        'judgments.tdd-gate.tdd-strongly-suggested.fires',
      ]),
    )
    expect(result).toHaveLength(3)
    // Verify dedupe — no duplicate entries
    expect(new Set(result).size).toBe(result.length)
  })

  it('F4. empty userText → empty result (no-op)', () => {
    expect(extractMatchedTriggers('', FIXTURE_OVERRIDES)).toEqual([])
    expect(extractMatchedTriggers('no matching keywords here', FIXTURE_OVERRIDES)).toEqual([])
    expect(extractMatchedTriggers('先 brainstorm', [])).toEqual([])
  })

  it('F5. loadUserOverrides reads + validates real shipped yaml', async () => {
    const overrides = await loadUserOverrides(PACKAGE_ROOT)
    // Wave 1 shipped 6 override entries
    expect(overrides).toHaveLength(6)
    const ids = overrides.map((o) => o.id).sort()
    expect(ids).toEqual([
      'arch-review',
      'brainstorm',
      'paranoid-review',
      'phase-discuss',
      'strategic-review',
      'tdd',
    ])
    // Cross-validation echo — arch-review trigger points to stage-routing per
    // 灰区 #2 Option C resolution (not architecture-gate which doesn't exist).
    const archReview = overrides.find((o) => o.id === 'arch-review')
    expect(archReview?.triggers).toContain(
      'judgments.stage-routing.plan-architecture-delegate.fires',
    )
    // Cross-validation echo — phase-discuss trigger points to gsd-discuss-phase
    // per 灰区 #1/#3 Option A resolution (not non-existent gray-areas entry).
    const phaseDiscuss = overrides.find((o) => o.id === 'phase-discuss')
    expect(phaseDiscuss?.triggers).toContain('judgments.phase-gate.gsd-discuss-phase.fires')
  })
})
