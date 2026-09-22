// architecture review #5 (slice 2) — UserPromptSubmit hook entry: the SINGLE
// SOURCE for the per-turn injection binary. `scripts/build-hooks.mjs` esbuild-
// bundles this into the self-contained, dep-free `bin/harnessed-inject-state.mjs`
// that the npm-mode hook runs and the compiled `harnessed inject-state` subcommand
// dynamic-imports.
//
// The 443-line predecessor hand-mirrored the ENTIRE pure pipeline in plain JS
// (workflowStateBlock / forwardPointer / scanPhases / parseLearnings / the inject
// cache …), welded to the TS only by a parity test — a TS branch the fixtures
// missed drifted silently on the per-turn hot path. Now the assembly is delegated
// wholesale to `buildInjection` (src/checkpoint/injectState.ts) and the inject
// cache is imported from `injectCache.ts`; the only code that lives HERE is the
// hook-specific IO glue with no other consumer:
//   - repoKey: dep-free replica (the real one lives in typebox-tainted
//     workflowStore.ts; importing it would pull typebox into the hot path).
//     State root + session-id env come straight from detectPlatform()
//     (src/platform/platform.ts is node:-builtins only) — v16.0 Phase 63 removed
//     the precedence / sessionIdEnvName replicas that used to drift from the CLI.
//   - readWorkflow: raw workflows.json JSON.parse (no Value.Check) + ledger mtime age.
//
// Dep-free by construction (node: builtins + dep-light injectState/injectCache and
// their siblings; the currentWorkflow schema is imported type-only → erased), so
// the bundle pulls nothing heavy and the per-prompt path stays fast. Fail-soft:
// ANY error injects nothing (a hook must never block the prompt).
//
// Root + session env: detectPlatform() (ADR 0040 precedence, dependency-free).

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { isAblated } from '../platform/ablation.js'
import { detectPlatform } from '../platform/platform.js'
import { applyPlatformArg, readHookStdin, sessionIdFromPayload } from './hookHost.js'
import {
  decidePcEmission,
  injectCacheKey,
  invalidateInjectCache,
  parseRefreshTurns,
  readInjectCache,
  writeInjectCache,
} from './injectCache.js'
import { buildInjection, DEFAULT_INJECT_BUDGET, type WorkflowIntent } from './injectState.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

/** Dep-free replica of workflowStore.repoKey (that module imports typebox). Pure
 *  fs walk-up: nearest ancestor of `cwd` with a `.git`, else the resolved `cwd`. */
function repoKey(cwd: string): string {
  let dir = resolve(cwd)
  for (;;) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return resolve(cwd)
}

/** Read the active repo's workflow slot + intent sidecar from workflows.json (raw
 *  JSON.parse — the hot path trusts the store, no Value.Check). `keys` is ordered
 *  most→least specific (session-scoped composite, then bare repoKey). ledgerAgeMs
 *  is the store file's mtime age, driving the STALE-ledger wording. NO legacy
 *  current-workflow.json fallback (removed 4.32.6): the pre-Phase-15 global
 *  singleton carries no repo identity and leaked cross-repo. */
function readWorkflow(
  root: string,
  keys: string[],
): { wf: CurrentWorkflowV1Type | null; intent: WorkflowIntent | null; ledgerAgeMs: number | null } {
  let wf: CurrentWorkflowV1Type | null = null
  let intent: WorkflowIntent | null = null
  let ledgerAgeMs: number | null = null
  const ageOf = (p: string): number | null => {
    try {
      return Date.now() - statSync(p).mtimeMs
    } catch {
      return null
    }
  }
  try {
    const storePath = join(root, 'workflows.json')
    const store = JSON.parse(readFileSync(storePath, 'utf8')) as {
      workflows?: Record<string, CurrentWorkflowV1Type>
      intents?: Record<string, WorkflowIntent>
    }
    if (store?.workflows) {
      for (const k of keys) {
        if (store.workflows[k]) {
          wf = store.workflows[k]
          // Per-slot activity when stamped; the shared file's mtime is refreshed by
          // ANY repo's write, so it is only the fallback for pre-stamp records (L8).
          const stamped = wf?.updated_at ? Date.parse(wf.updated_at) : Number.NaN
          ledgerAgeMs = Number.isNaN(stamped) ? ageOf(storePath) : Date.now() - stamped
          break
        }
      }
    }
    if (store?.intents) {
      for (const k of keys) {
        if (store.intents[k]) {
          intent = store.intents[k]
          break
        }
      }
    }
  } catch {
    // no store / corrupt → inject nothing (fail-soft)
  }
  return { wf, intent, ledgerAgeMs }
}

/** true ⇔ the full <project-context> block should be emitted this turn. Thin
 *  wrapper over injectCache (the pure decision + the fail-soft persist). Default
 *  ON for ANY trouble — the cache may only ever SAVE tokens, never lose context;
 *  a SKIP is honored only when the incremented entry was persisted. */
function shouldEmitPc(root: string, repoRoot: string, sid: string, pc: string): boolean {
  try {
    const key = injectCacheKey(repoRoot, sid)
    const cache = readInjectCache(root, key)
    const pcHash = createHash('sha256').update(pc).digest('hex')
    const refreshN = parseRefreshTurns(process.env.HARNESSED_INJECT_REFRESH_TURNS)
    const d = decidePcEmission(cache, pcHash, refreshN, Date.now())
    if (!writeInjectCache(root, key, d.next)) return true // unpersisted → never skip
    return d.emit
  } catch {
    return true
  }
}

async function main(): Promise<void> {
  // Phase 60 — master kill switch. Covers BOTH manifests this bin serves
  // (UserPromptSubmit injection and the SessionStart --invalidate half): under
  // ablation neither may touch the cache or emit a breadcrumb, or the control
  // arm of an A/B would still be carrying harnessed's context.
  if (isAblated()) return
  try {
    // v16.0 Phase 64 — a codex plugin hook names its host explicitly (hookHost.ts).
    const hostArg = applyPlatformArg(process.argv)
    const platform = detectPlatform()
    const root = platform.stateRoot
    // 4.38.0 — SessionStart entry (compact/clear/resume/startup). A context
    // discontinuity invalidates every skip decision the delta cache is holding,
    // so drop it and let the next UserPromptSubmit turn re-emit in full. Silent,
    // always exit 0: a hook that prints on SessionStart would inject noise into
    // every session, and a hook that throws would surface as a startup error.
    if (process.argv.includes('--invalidate')) {
      invalidateInjectCache(root)
      return
    }
    // `key` is the repo ROOT (holds .planning/ for buildInjection's disk scans). The
    // workflow LOOKUP prefers the session-scoped composite slot (Phase 34/35), then
    // the bare repoKey. The composite key is NOT a real directory.
    const key = repoKey(process.cwd())
    const envName = platform.sessionIdEnv
    // codex hook: no CODEX_* env in the hook process — the session id rides stdin.
    // Only an explicit --platform opts in, so the Claude Code path never reads stdin.
    const sid =
      (envName ? process.env[envName]?.trim() : undefined) ||
      (hostArg ? sessionIdFromPayload(await readHookStdin()) : undefined)
    const { wf, intent, ledgerAgeMs } = readWorkflow(root, sid ? [`${key}::${sid}`, key] : [key])

    let learningsMd = ''
    try {
      learningsMd = readFileSync(join(key, '.planning', 'LEARNINGS.md'), 'utf8')
    } catch {
      // no learnings file → buildInjection emits workflow-state only
    }

    const budget = Number(process.env.HARNESSED_INJECT_BUDGET) || DEFAULT_INJECT_BUDGET
    // 4.38.0 — opt-out for the token-heavy half. Trellis mutes its equivalent with
    // an in-prompt keyword, which costs a stdin read on EVERY prompt; a blocking
    // read in this hot path would hang the user's turn, so the escape hatch is
    // session-scoped instead. It gates <project-context> ONLY: <workflow-state> is
    // the you-are-here breadcrumb that keeps the agent on the state machine, and a
    // switch that silently turns off drift protection is not an escape hatch.
    const pcOff = process.env.HARNESSED_INJECT_PC_OFF === '1'
    // Session-delta gate wired only when a session id is present (parity with the
    // pre-4.32.13 bin: `if (pc && sid && !shouldEmitPc)`). No sid → full injection.
    const pcGate = pcOff
      ? () => false
      : sid
        ? (pc: string) => shouldEmitPc(root, key, sid, pc)
        : undefined
    const out = buildInjection(key, wf, learningsMd, budget, intent, Date.now(), {
      ledgerAgeMs,
      pcGate,
    })
    if (out) process.stdout.write(`${out}\n`)
  } catch {
    // no state / corrupt / not a harnessed session → inject nothing
  }
}

void main()
