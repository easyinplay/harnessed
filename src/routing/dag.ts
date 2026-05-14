// Phase 1.5 T3.1 — DAG resolver (Kahn's algorithm, iterative ≤200L hard limit).
//
// IMPL NOTE — implements ADR 0009 § Decision (Errata 4 接口契约升级) + D1.5-1
// lock. Kahn's algorithm (BFS + indegree queue), self-implemented, NO external
// graph library (no graphlib / @dagrejs/graphlib / toposort) per karpathy
// YAGNI — a ≤30L core handles ≤50 manifest dependency graphs. RESEARCH § 1.2
// rationale for choosing Kahn over DFS-based toposort (4 points):
//   1. iterative (queue-based) — no recursion, Node.js call-stack safe even
//      for deep linear chains (DFS recursion would risk stack overflow).
//   2. queue-based — natural to emit a debug trace of processing order.
//   3. cycle detection is a natural byproduct — after the queue drains, any
//      node with indegree ≠ 0 is provably part of a cycle.
//   4. karpathy simplicity — the whole algorithm fits in one readable loop.
// LOC budget: ≤200L hard limit (D-19). SPIKE-REPORT-2.md § 2 validated the
// algorithm on 5 graph cases (linear / diamond / multi-root / single / cycle)
// before this file existed — 5/5 PASS including E_DAG_CYCLE detection.
//
// Three-state discriminated union `DagResolveResult` mirrors `EngineResult`
// (engine.ts) per the F41 takeaway — callers narrow on `result.ok` and the
// TypeScript compiler guarantees `order` xor `cycle` access.

import { InvalidDecisionError } from './agentDefinition.js'

/** A node identifier within the dependency graph. */
export type NodeId = string

/** A single DAG node: an id plus the ids it depends on (edges point dep → id). */
export interface DagNode {
  /** Unique node identifier. */
  id: NodeId
  /** Ids this node depends on; each must resolve before this node. */
  deps: NodeId[]
}

/**
 * Three-state result of {@link resolveDag} — discriminated on `ok`:
 *  - `{ ok: true, order }`  — topological order (deps before dependents)
 *  - `{ ok: false, cycle }` — cycle detected; `cycle` lists the offending nodes
 */
export type DagResolveResult = { ok: true; order: NodeId[] } | { ok: false; cycle: NodeId[] }

/**
 * Resolve a dependency graph into a topological order using Kahn's algorithm.
 *
 * Iterative (no recursion) — BFS over an indegree queue. Deterministic output:
 * the ready queue is kept alphabetically sorted so the same graph always yields
 * the same ordering (eases debugging + snapshot tests).
 *
 * @param nodes - graph nodes; `deps` entries referencing unknown ids are ignored
 *                (treated as already-satisfied external deps).
 * @returns `{ ok: true, order }` for an acyclic graph, or `{ ok: false, cycle }`
 *          listing the nodes that form one or more cycles.
 */
export function resolveDag(nodes: DagNode[]): DagResolveResult {
  // Build the id set + adjacency (dep → dependents) + indegree map.
  const ids = new Set<NodeId>(nodes.map((n) => n.id))
  const adj = new Map<NodeId, NodeId[]>()
  const indegree = new Map<NodeId, number>()
  for (const id of ids) {
    adj.set(id, [])
    indegree.set(id, 0)
  }
  for (const node of nodes) {
    for (const dep of node.deps) {
      // Skip edges to unknown ids — external/already-satisfied dependencies.
      if (!ids.has(dep)) continue
      adj.get(dep)?.push(node.id)
      indegree.set(node.id, (indegree.get(node.id) ?? 0) + 1)
    }
  }

  // Seed the ready queue with every indegree-0 node, alphabetically sorted.
  const queue: NodeId[] = []
  for (const [id, deg] of indegree) {
    if (deg === 0) queue.push(id)
  }
  queue.sort()

  // Kahn main loop — pop a ready node, emit it, decrement its dependents.
  const order: NodeId[] = []
  while (queue.length > 0) {
    const id = queue.shift() as NodeId
    order.push(id)
    let exposed = false
    for (const dependent of adj.get(id) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1
      indegree.set(dependent, next)
      if (next === 0) {
        queue.push(dependent)
        exposed = true
      }
    }
    // Keep the queue sorted for deterministic ordering when new nodes appear.
    if (exposed) queue.sort()
  }

  // Cycle detection — any node not emitted still has indegree > 0 and is
  // provably part of a cycle (Kahn cannot reach it).
  if (order.length !== ids.size) {
    const cycle: NodeId[] = []
    for (const [id, deg] of indegree) {
      if (deg > 0) cycle.push(id)
    }
    cycle.sort()
    return { ok: false, cycle }
  }

  return { ok: true, order }
}

/**
 * Format a friendly, actionable error message for a detected dependency cycle.
 * Mirrors the phase 1.1 manifest-validate friendly-error style (label + hint +
 * doc reference) so CLI output stays consistent across subsystems.
 *
 * @param cycle - the cycle node ids returned by {@link resolveDag}.
 */
export function formatCycleError(cycle: NodeId[]): string {
  const chain = cycle.join(' → ')
  return [
    `Circular dependency detected in skills: ${chain}`,
    `  hint: check 'deps:' field in manifest spec; cycle members above must form an acyclic graph.`,
    `  see docs/adr/0009-routing-l2-engineering-23-shi-errata.md § DAG resolver friendly error.`,
  ].join('\n')
}

/**
 * Resolve a graph and throw a typed {@link InvalidDecisionError} on a cycle —
 * convenience wrapper for callers (e.g. engine.ts) that prefer the throw-error
 * path (D-14) over manual three-state narrowing. Returns the topological order
 * directly on success.
 *
 * @param nodes - graph nodes.
 * @throws {InvalidDecisionError} when the graph contains a cycle.
 */
export function resolveDagOrThrow(nodes: DagNode[]): NodeId[] {
  const result = resolveDag(nodes)
  if (!result.ok) {
    throw new InvalidDecisionError(formatCycleError(result.cycle))
  }
  return result.order
}
