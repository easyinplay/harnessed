// src/discipline/enforcement/before-spawn.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9 priority.yaml).
// Hook trigger: master orchestrator 收到 ≥2 capability fired 时 arbitrate.
//
// Sorts the fired capability list by `priority_hierarchy` rank loaded from
// disciplines/priority.yaml. Unknown tier names sort to the end (LOWEST priority,
// MAX_SAFE_INTEGER rank — conservative degrade per RESEARCH-disciplines § 3.2.3).
//
// 4.32.22 no-op-arbitration fix — callers used to hand us `tier: <tool name>`
// (e.g. 'grill-with-docs'), which is never a `priority_hierarchy` entry, so every
// rank collapsed to MAX_SAFE_INTEGER and the sort degenerated into the identity
// permutation. Tier is now RESOLVED from the capability name via
// `workflows/capabilities.yaml` `impl` (the owning upstream system) plus a small
// name-override table for the impl buckets that are heterogeneous.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface FiredCapability {
  /** `workflows/capabilities.yaml` entry name (e.g. 'grill-with-docs', 'gsd-plan-phase'). */
  name: string
  /** Tier identifier — one of priority.yaml priority_hierarchy entries
   *  (gstack / gsd / superpowers / planning-with-files / karpathy / mattpocock / parallel).
   *
   *  OPTIONAL since 4.32.22: omit it and the tier is resolved from `name` via
   *  capabilities.yaml. An explicitly supplied tier still wins (backwards-compat
   *  for callers that already know the tier). `arbitrateBeforeSpawn` echoes the
   *  resolved tier back on the returned entries. */
  tier?: string
}

/** capabilities.yaml `impl` → priority.yaml tier. The tier is the OWNING UPSTREAM
 *  SYSTEM, not a semantic role — that is what CLAUDE.md's priority sentence ranks
 *  (gstack > GSD > superpowers > planning-with-files > karpathy > 子任务并行机制).
 *
 *  Deliberately NOT mapped (→ rank LOWEST, stable order): `ecc` / `mcp` / `cli` /
 *  `npm-cli` / `plugin` / `caveman` / `design-taste-frontend` / `harnessed-bundled`
 *  — none of these upstreams appear in the hierarchy. `plugin` in particular is a
 *  heterogeneous bucket (ralph-loop / code-review / code-simplifier / ui-ux-pro-max);
 *  ralph-loop is an ORTHOGONAL wrapper per CLAUDE.md, explicitly not a tier, so
 *  leaving `plugin` unmapped is the correct outcome rather than an oversight. */
const IMPL_TIER: Readonly<Record<string, string>> = {
  gstack: 'gstack',
  gsd: 'gsd',
  superpowers: 'superpowers',
  'mattpocock-skills': 'mattpocock',
  // agent-teams-create / -send-message / -shutdown — 子任务并行机制 (Agent Teams).
  'claude-platform': 'parallel',
}

/** capability NAME → tier, for the two entries whose `impl` bucket is shared with
 *  untiered siblings. Wins over IMPL_TIER.
 *    planning-with-files — impl 'claude-code-plugin', a 1-member bucket; keyed by
 *      name so the tier does not silently absorb future plugins.
 *    karpathy-guidelines — impl 'harnessed-bundled', shared with the 6 other
 *      bundled discipline capabilities (output-style / language / operational /
 *      priority / protocols / doc-discipline) which have NO tier. */
const NAME_TIER: Readonly<Record<string, string>> = {
  'planning-with-files': 'planning-with-files',
  'karpathy-guidelines': 'karpathy',
}

/** packageRoot → (capability name → impl). Populated on first successful read. */
const _implCache = new Map<string, Map<string, string>>()

/** Load capability name → `impl` from `<packageRoot>/workflows/capabilities.yaml`.
 *  Fail-soft per ADR 0029: unreadable / malformed → warn + empty map, so every
 *  fired capability degrades to rank LOWEST and the caller's order is preserved
 *  (never throws, never reorders on bad input). Failures are NOT cached. */
async function loadCapabilityImpls(packageRoot: string): Promise<Map<string, string>> {
  const cached = _implCache.get(packageRoot)
  if (cached) return cached
  const out = new Map<string, string>()
  try {
    const raw = await readFile(resolve(packageRoot, 'workflows', 'capabilities.yaml'), 'utf8')
    const parsed = parseYaml(raw) as { capabilities?: Record<string, { impl?: string }> } | null
    for (const [name, entry] of Object.entries(parsed?.capabilities ?? {})) {
      if (entry && typeof entry.impl === 'string') out.set(name, entry.impl)
    }
  } catch (err) {
    console.warn(
      `⚠️ before-spawn: capabilities.yaml unreadable (${(err as Error).message}); ` +
        'arbitrating without capability→tier resolution (ADR 0029 fail-soft — ' +
        'fired order preserved).',
    )
    return out
  }
  _implCache.set(packageRoot, out)
  return out
}

/** Resolve the priority tier for one fired capability. Explicit `tier` wins;
 *  otherwise name-override → impl lookup → undefined (rank LOWEST). */
function resolveTier(cap: FiredCapability, impls: Map<string, string>): string | undefined {
  if (cap.tier !== undefined) return cap.tier
  const byName = NAME_TIER[cap.name]
  if (byName) return byName
  const impl = impls.get(cap.name)
  return impl ? IMPL_TIER[impl] : undefined
}

export async function arbitrateBeforeSpawn(
  fired: FiredCapability[],
  packageRoot: string,
): Promise<FiredCapability[]> {
  if (fired.length <= 1) return fired
  const d = await loadDiscipline('priority', packageRoot)
  const hierarchy = d.priority_hierarchy ?? []
  const impls = await loadCapabilityImpls(packageRoot)
  // Decorate → sort → undecorate: rank each entry ONCE (keeps the comparator pure
  // and makes the resolved tier observable on the result). Array.prototype.sort is
  // stable (ES2019+), so equal ranks — notably the MAX_SAFE_INTEGER "unknown tier"
  // bucket — retain their input order instead of shuffling among themselves.
  return fired
    .map((cap) => {
      const tier = resolveTier(cap, impls)
      const i = tier === undefined ? -1 : hierarchy.indexOf(tier)
      return {
        cap: tier === undefined ? cap : { ...cap, tier },
        rank: i === -1 ? Number.MAX_SAFE_INTEGER : i,
      }
    })
    .sort((a, b) => a.rank - b.rank)
    .map((e) => e.cap)
}
