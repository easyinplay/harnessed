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
//   - repoKey / harnessedRoot / sessionIdEnvName: dep-free replicas (the real ones
//     live in typebox-tainted workflowStore.ts / platform-seamed harnessedRoot.ts;
//     importing them would pull typebox into the hot path). The simplified form is
//     intentional and byte-equivalent for the claude default + HARNESSED_ROOT_OVERRIDE.
//   - readWorkflow: raw workflows.json JSON.parse (no Value.Check) + ledger mtime age.
//
// Dep-free by construction (node: builtins + dep-light injectState/injectCache and
// their siblings; the currentWorkflow schema is imported type-only → erased), so
// the bundle pulls nothing heavy and the per-prompt path stays fast. Fail-soft:
// ANY error injects nothing (a hook must never block the prompt).
//
// Root: HARNESSED_ROOT_OVERRIDE if set, else <homedir>/.claude/harnessed.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import {
  decidePcEmission,
  injectCacheKey,
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

/** Dep-free replica of the harness state root (the real getHarnessedRoot routes
 *  through detectPlatform().stateRoot). HARNESSED_ROOT_OVERRIDE else the claude
 *  default `<homedir>/.claude/harnessed` — byte-equivalent for this hot path (the
 *  .platform pin / auto-probe is orthogonal, already surfaced via the override). */
function harnessedRoot(): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  return override !== undefined && override !== ''
    ? override
    : join(homedir(), '.claude', 'harnessed')
}

/** Phase 35 — mirror PlatformDescriptor.sessionIdEnv for the hot path: which env
 *  var carries the active session id. HARNESSED_PLATFORM selects (default claude);
 *  codex has none. State-root selection is orthogonal (HARNESSED_ROOT_OVERRIDE). */
function sessionIdEnvName(): string | null {
  const platform = (process.env.HARNESSED_PLATFORM || 'claude').trim()
  if (platform === 'codex') return null
  return 'CLAUDE_CODE_SESSION_ID' // claude (default)
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
          ledgerAgeMs = ageOf(storePath)
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

function main(): void {
  try {
    const root = harnessedRoot()
    // `key` is the repo ROOT (holds .planning/ for buildInjection's disk scans). The
    // workflow LOOKUP prefers the session-scoped composite slot (Phase 34/35), then
    // the bare repoKey. The composite key is NOT a real directory.
    const key = repoKey(process.cwd())
    const envName = sessionIdEnvName()
    const sid = envName ? process.env[envName]?.trim() : undefined
    const { wf, intent, ledgerAgeMs } = readWorkflow(root, sid ? [`${key}::${sid}`, key] : [key])

    let learningsMd = ''
    try {
      learningsMd = readFileSync(join(key, '.planning', 'LEARNINGS.md'), 'utf8')
    } catch {
      // no learnings file → buildInjection emits workflow-state only
    }

    const budget = Number(process.env.HARNESSED_INJECT_BUDGET) || DEFAULT_INJECT_BUDGET
    // Session-delta gate wired only when a session id is present (parity with the
    // pre-4.32.13 bin: `if (pc && sid && !shouldEmitPc)`). No sid → full injection.
    const out = buildInjection(key, wf, learningsMd, budget, intent, Date.now(), {
      ledgerAgeMs,
      pcGate: sid ? (pc) => shouldEmitPc(root, key, sid, pc) : undefined,
    })
    if (out) process.stdout.write(`${out}\n`)
  } catch {
    // no state / corrupt / not a harnessed session → inject nothing
  }
}

main()
