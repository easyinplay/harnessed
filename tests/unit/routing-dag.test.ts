// Phase 1.5 T6.1 — DAG resolver unit tests (≥10 cell, Pattern J fixture-driven).
//
// IMPL NOTE — covers ADR 0009 § Decision (Errata 4 接口契约) + D1.5-1 (Kahn
// topology + cycle detect). Cells exercise: empty graph / single node / linear
// chain / diamond DAG / disconnected components / 2-node + 3-node + self-loop
// cycles / partial cycle (acyclic subgraph + cycle subgraph) / deterministic
// indegree-queue ordering / formatCycleError friendly message / three-state
// DagResolveResult discriminated-union narrowing. NO external graph library —
// the resolver is self-implemented per karpathy YAGNI.

import { describe, expect, it } from 'vitest'
import { InvalidDecisionError } from '../../src/routing/agentDefinition.js'
import {
  type DagNode,
  type DagResolveResult,
  formatCycleError,
  resolveDag,
  resolveDagOrThrow,
} from '../../src/routing/index.js'

describe('resolveDag — acyclic graphs (Kahn topology)', () => {
  it('1. empty graph → ok with empty order', () => {
    const result = resolveDag([])
    expect(result).toEqual({ ok: true, order: [] })
  })

  it('2. single node, no deps → ok order [a]', () => {
    const result = resolveDag([{ id: 'a', deps: [] }])
    expect(result).toEqual({ ok: true, order: ['a'] })
  })

  it('3. two-node linear a → b → ok order [a, b]', () => {
    const nodes: DagNode[] = [
      { id: 'b', deps: ['a'] },
      { id: 'a', deps: [] },
    ]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: true, order: ['a', 'b'] })
  })

  it('4. five-node linear chain → deps before dependents', () => {
    const nodes: DagNode[] = [
      { id: 'e', deps: ['d'] },
      { id: 'd', deps: ['c'] },
      { id: 'c', deps: ['b'] },
      { id: 'b', deps: ['a'] },
      { id: 'a', deps: [] },
    ]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: true, order: ['a', 'b', 'c', 'd', 'e'] })
  })

  it('5. diamond DAG (a → b,c → d) → topological order is legal', () => {
    const nodes: DagNode[] = [
      { id: 'a', deps: [] },
      { id: 'b', deps: ['a'] },
      { id: 'c', deps: ['a'] },
      { id: 'd', deps: ['b', 'c'] },
    ]
    const result = resolveDag(nodes)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const pos = (id: string) => result.order.indexOf(id)
      expect(pos('a')).toBeLessThan(pos('b'))
      expect(pos('a')).toBeLessThan(pos('c'))
      expect(pos('b')).toBeLessThan(pos('d'))
      expect(pos('c')).toBeLessThan(pos('d'))
      // Deterministic alphabetical tie-break — b before c.
      expect(result.order).toEqual(['a', 'b', 'c', 'd'])
    }
  })

  it('6. disconnected components → both resolved, deterministic order', () => {
    const nodes: DagNode[] = [
      { id: 'x', deps: [] },
      { id: 'y', deps: ['x'] },
      { id: 'm', deps: [] },
      { id: 'n', deps: ['m'] },
    ]
    const result = resolveDag(nodes)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Deterministic — queue is re-sorted as nodes become ready: seed [m,x],
      // pop m → expose n → [n,x], pop n → [x], pop x → expose y → [y].
      expect(result.order).toEqual(['m', 'n', 'x', 'y'])
      // Per-component dep ordering still holds.
      const pos = (id: string) => result.order.indexOf(id)
      expect(pos('m')).toBeLessThan(pos('n'))
      expect(pos('x')).toBeLessThan(pos('y'))
    }
  })

  it('7. unknown dep id is ignored (treated as external/satisfied)', () => {
    const nodes: DagNode[] = [{ id: 'a', deps: ['external-not-in-graph'] }]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: true, order: ['a'] })
  })
})

describe('resolveDag — cycle detection', () => {
  it('8. two-node cycle a ⇄ b → not ok, cycle lists both', () => {
    const nodes: DagNode[] = [
      { id: 'a', deps: ['b'] },
      { id: 'b', deps: ['a'] },
    ]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: false, cycle: ['a', 'b'] })
  })

  it('9. three-node cycle a → b → c → a → cycle lists all three', () => {
    const nodes: DagNode[] = [
      { id: 'a', deps: ['c'] },
      { id: 'b', deps: ['a'] },
      { id: 'c', deps: ['b'] },
    ]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: false, cycle: ['a', 'b', 'c'] })
  })

  it('10. self-loop a → a → cycle is [a]', () => {
    const result = resolveDag([{ id: 'a', deps: ['a'] }])
    expect(result).toEqual({ ok: false, cycle: ['a'] })
  })

  it('11. partial cycle — acyclic subgraph + cycle subgraph → only cycle nodes', () => {
    const nodes: DagNode[] = [
      // acyclic part
      { id: 'root', deps: [] },
      { id: 'leaf', deps: ['root'] },
      // cycle part
      { id: 'p', deps: ['q'] },
      { id: 'q', deps: ['p'] },
    ]
    const result = resolveDag(nodes)
    expect(result).toEqual({ ok: false, cycle: ['p', 'q'] })
  })
})

describe('formatCycleError + resolveDagOrThrow + type narrowing', () => {
  it('12. formatCycleError → friendly message with arrow + hint + ADR ref', () => {
    const msg = formatCycleError(['a', 'b', 'c'])
    expect(msg).toContain('Circular dependency detected')
    expect(msg).toContain('a → b → c')
    expect(msg).toContain('hint:')
    expect(msg).toContain('docs/adr/0009-routing-l2-engineering-23-shi-errata.md')
  })

  it('13. resolveDagOrThrow → returns order on acyclic, throws InvalidDecisionError on cycle', () => {
    expect(resolveDagOrThrow([{ id: 'a', deps: [] }])).toEqual(['a'])
    expect(() =>
      resolveDagOrThrow([
        { id: 'a', deps: ['b'] },
        { id: 'b', deps: ['a'] },
      ]),
    ).toThrow(InvalidDecisionError)
  })

  it('14. DagResolveResult three-state discriminated union narrows on .ok', () => {
    const results: DagResolveResult[] = [
      resolveDag([{ id: 'a', deps: [] }]),
      resolveDag([
        { id: 'a', deps: ['b'] },
        { id: 'b', deps: ['a'] },
      ]),
    ]
    for (const r of results) {
      if (r.ok) {
        // `order` accessible, `cycle` is a type error — compiler-enforced.
        expect(Array.isArray(r.order)).toBe(true)
      } else {
        expect(Array.isArray(r.cycle)).toBe(true)
      }
    }
  })
})
