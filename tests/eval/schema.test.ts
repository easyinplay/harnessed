// 4.31.0 eval Slice A (T2) — scenario typebox schema validation.
// CEO plan locked semantics: scenario = {name, description?, assets_dir?,
// seed_context?(+$unset), steps[](gates/checkpoint/file), expect?.golden}.

import { describe, expect, it } from 'vitest'
import { validateScenario } from '../../src/eval/schema.js'

const minimal = {
  name: 'smoke',
  steps: [{ gates: { master: 'verify' } }],
}

describe('eval scenario schema (T2)', () => {
  it('accepts a minimal gates-only scenario', () => {
    const r = validateScenario(minimal)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.scenario.name).toBe('smoke')
  })

  it('accepts the full step vocabulary (gates/checkpoint/file) + seed_context with $unset', () => {
    const r = validateScenario({
      name: 'full',
      description: '逮 issue #5 缺陷 1',
      assets_dir: 'assets',
      seed_context: {
        phase: { is_critical_module: false },
        $unset: ['is_critical_release'],
      },
      steps: [
        { file: { path: '.planning/STATE.md', content: '# STATE', mtime: '2026-01-01T00:00:00Z' } },
        { gates: { master: 'verify', task: 't', skip_sub: ['paranoid'], context: { x: 1 } } },
        {
          checkpoint: {
            action: 'start',
            sub: 'verify',
            plan: { fire: [{ sub: 'progress', mode: 'serial', order: 1 }], skip: [] },
          },
        },
        { checkpoint: { action: 'complete', sub: 'progress', force: true, summary: 's' } },
        { checkpoint: { action: 'fail', sub: 'progress' } },
      ],
      expect: { golden: 'golden.json' },
    })
    expect(r.ok).toBe(true)
  })

  it('rejects a step that is none of gates/checkpoint/file', () => {
    const r = validateScenario({ name: 'bad', steps: [{ bogus: {} }] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0)
  })

  it('rejects checkpoint step with unknown action', () => {
    const r = validateScenario({
      name: 'bad-action',
      steps: [{ checkpoint: { action: 'explode', sub: 'x' } }],
    })
    expect(r.ok).toBe(false)
  })

  it('rejects missing name / empty steps', () => {
    expect(validateScenario({ steps: [{ gates: { master: 'verify' } }] }).ok).toBe(false)
    expect(validateScenario({ name: 'x', steps: [] }).ok).toBe(false)
  })

  it('rejects non-object input without throwing', () => {
    expect(validateScenario(null).ok).toBe(false)
    expect(validateScenario('yaml gone wrong').ok).toBe(false)
  })
})
