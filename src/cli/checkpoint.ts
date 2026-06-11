// `harnessed checkpoint` CLI — record workflow progress to the harnessed checkpoint
// store. CC main session calls this after each sub-workflow completes.
//
// Single `checkpoint <action> <sub>` command; action ∈ {start, complete, fail}.
// Reuses src/checkpoint/engineHook.ts (activatePhase / completePhase) — no direct
// filesystem or Date access here (sister: src/cli/resume.ts lazy-import pattern).
//
// v5.0 Spec 1 (ADR-0033 / STATE-MACHINE-CORE-DESIGN.md §8) — the checkpoint CLI is
// the sole write path for the sub-progress ledger (agents never touch state files
// directly). It wires:
//   start <master> --plan <json> → activate + seed ledger from the `gates` plan
//   complete <sub> [--force]     → fail-CLOSED evidence guard + ledger mark 'done'
//   fail <sub>                   → ledger mark 'failed'
//
// Semantics:
//   start <master> --plan <json> → activatePhase(master) + seedLedger(plan)
//                                  (D3: missing/empty --plan → empty ledger, no error)
//   complete <sub> [--force]     → checkArtifacts(sub) evidence guard:
//                                    missing && !force → exit 1 (fail-CLOSED), stay pending
//                                    missing && force  → markSub done, evidence_status 'overridden'
//                                    verified          → markSub done, evidence + 'verified'
//                                    none_declared     → markSub done, 'none_declared'
//                                  + completePhase(complete) terminal checkpoint, exit 0
//   fail <sub> [--summary]       → markSub failed + completePhase w/ FAILED: prefix, exit 1.

import type { Command } from 'commander'
import { checkPathSafe } from '../manifest/lib/path-guard.js'

const ACTIONS = ['start', 'complete', 'fail'] as const
type Action = (typeof ACTIONS)[number]

function isAction(a: string): a is Action {
  return (ACTIONS as readonly string[]).includes(a)
}

/** Mark a sub in the ledger ONLY when it was seeded. `markSub` throws when the
 *  sub is absent (D3 empty-ledger / no `--plan`); here we degrade to a no-op so a
 *  completion/fail with an unseeded ledger still records its checkpoint envelope.
 *  The ledger is an additive overlay, never a hard gate on the checkpoint write. */
function markIfSeeded(
  entries: import('../checkpoint/schema/currentWorkflow.v1.js').SubProgressEntryType[],
  sub: string,
  status: import('../checkpoint/ledger.js').SubStatus,
  opts?: import('../checkpoint/ledger.js').MarkSubOpts,
): import('../checkpoint/schema/currentWorkflow.v1.js').SubProgressEntryType[] {
  return entries.some((e) => e.sub === sub) ? markSubImpl(entries, sub, status, opts) : entries
}

// markSub is loaded lazily at the module top once (pure fn, no I/O) so markIfSeeded
// can call it synchronously inside the mutateSubProgress closure.
import { markSub as markSubImpl } from '../checkpoint/ledger.js'

/** Parse the `--plan` gates JSON. Returns null on missing/empty/invalid input so
 *  the caller can degrade to an empty ledger (D3) instead of throwing. */
async function parsePlan(
  raw: string | undefined,
): Promise<import('../checkpoint/ledger.js').GatesPlan | null> {
  if (!raw || raw.trim() === '') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  // Minimal shape guard — `fire`/`skip` arrays. seedLedger tolerates absent arrays
  // via the local interface defaults, but we normalize here for safety.
  // P1-1 — explicit pick of the known GatesPlan keys ONLY. The `--plan` JSON is
  // untrusted CLI input; spreading `...(parsed as object)` would carry arbitrary
  // attacker-controlled keys (proto/injection surface) into the persisted ledger.
  const p = parsed as {
    master?: unknown
    fire?: unknown
    skip?: unknown
    parallelism?: unknown
  }
  if (!Array.isArray(p.fire) && !Array.isArray(p.skip)) return null
  const plan: import('../checkpoint/ledger.js').GatesPlan = {
    fire: Array.isArray(p.fire)
      ? (p.fire as import('../checkpoint/ledger.js').GatesPlan['fire'])
      : [],
    skip: Array.isArray(p.skip)
      ? (p.skip as import('../checkpoint/ledger.js').GatesPlan['skip'])
      : [],
  }
  if (typeof p.master === 'string') plan.master = p.master
  if (p.parallelism && typeof p.parallelism === 'object' && !Array.isArray(p.parallelism)) {
    plan.parallelism = p.parallelism as import('../checkpoint/ledger.js').GatesPlan['parallelism']
  }
  return plan
}

export function registerCheckpoint(program: Command): void {
  program
    .command('checkpoint <action> <sub>')
    .description(
      'Record workflow progress: start | complete | fail <sub-workflow> (writes to ~/.claude/harnessed/checkpoints/)',
    )
    .option('--summary <text>', 'short summary stored as the checkpoint lastTask')
    .option('--plan <json>', 'gates plan JSON (start only) — seeds the sub-progress ledger')
    .option(
      '--force',
      'complete only — override a missing-artifact evidence block (records overridden)',
    )
    .action(
      async (
        action: string,
        sub: string,
        opts: { summary?: string; plan?: string; force?: boolean },
      ) => {
        if (!isAction(action)) {
          console.error(
            `[harnessed] checkpoint: unknown action "${action}" — expected one of ${ACTIONS.join(', ')}`,
          )
          process.exit(1)
          return
        }

        // P0-B — `sub` is a user-controlled positional that flows into
        // activatePhase / resolveWorkflowYaml path joins (e.g. `complete
        // ../../../etc/passwd`). Screen it before any path use. checkPathSafe
        // throws PathTraversalError; convert to a clean exit 1 (generic message
        // per D-08 — do not echo the input).
        try {
          checkPathSafe(sub)
        } catch {
          console.error('[harnessed] checkpoint: invalid sub name (path traversal rejected)')
          process.exit(1)
          return
        }

        const { activatePhase, completePhase } = await import('../checkpoint/engineHook.js')

        if (action === 'start') {
          const { checkpointPath } = await activatePhase(sub)
          // D3 graceful degrade — seed the ledger only when a plan is supplied; a
          // missing/empty/invalid --plan leaves an empty ledger, no error.
          const plan = await parsePlan(opts.plan)
          if (plan) {
            const { seedLedger } = await import('../checkpoint/ledger.js')
            const { mutateSubProgress } = await import('../checkpoint/state.js')
            await mutateSubProgress(() => seedLedger(plan))
          }
          console.log(`[harnessed] checkpoint started: ${sub} → ${checkpointPath}`)
          process.exit(0)
          return
        }

        if (action === 'complete') {
          const { checkArtifacts } = await import('../checkpoint/evidence.js')
          const { mutateSubProgress } = await import('../checkpoint/state.js')
          const { getPackageRoot } = await import('./lib/packagePath.js')

          const result = await checkArtifacts(sub, getPackageRoot())
          const { checkPlanningSync } = await import('../checkpoint/evidence.js')
          const syncResult = await checkPlanningSync(process.cwd(), null)

          // Fail-CLOSED (ADR-0033 D2 + Phase 12 G2): merge artifact missing set with
          // planning sync missing set. Any missing item blocks completion unless --force.
          // The ledger entry stays 'pending'; no done flip; exit 1.
          const allMissing = [...result.missing, ...syncResult.missing]
          if (allMissing.length > 0 && !opts.force) {
            console.error(
              `[harnessed] checkpoint complete BLOCKED: ${sub} — ${allMissing.length} item(s) missing (evidence guard + .planning/ sync, fail-closed):`,
            )
            for (const m of allMissing) console.error(`  - ${m}`)
            console.error(
              '  (re-run with --force to override and record evidence_status=overridden)',
            )
            process.exit(1)
            return
          }

          // Resolve the three-state evidence posture for the ledger mark, then do a
          // SINGLE mark. D3: if the ledger was never seeded (empty/absent --plan at
          // start), the sub is not present → `markIfSeeded` no-ops (the checkpoint
          // envelope below is the baseline; the ledger is an additive overlay, never
          // a hard gate). P1-5 — `evidenceStatus` captures the ACTUAL posture written
          // (not `result.status`, which would print 'missing' on a --force override
          // and hide the override).
          //   missing && force → 'overridden' (record present artifacts as evidence)
          //   verified         → 'verified'   (record found artifacts as evidence)
          //   none_declared    → 'none_declared' (guard had nothing to check; NOT a pass)
          let evidenceStatus: 'overridden' | 'verified' | 'none_declared'
          if (allMissing.length > 0 && opts.force) evidenceStatus = 'overridden'
          else if (result.status === 'verified') evidenceStatus = 'verified'
          else evidenceStatus = 'none_declared'

          // none_declared records no evidence refs (nothing was checked); the other
          // two postures attach the present artifacts as evidence.
          const markOpts =
            evidenceStatus === 'none_declared'
              ? { evidence_status: evidenceStatus }
              : { evidence: result.found, evidence_status: evidenceStatus }
          await mutateSubProgress((e) => markIfSeeded(e, sub, 'done', markOpts))

          // v5.0 Spec 1 — a master chain has many subs; completing ONE sub must
          // not flip the whole workflow to 'complete'. Read back the ledger AFTER
          // the mark (mutateSubProgress already persisted) and use nextPending to
          // decide: null (all subs resolved, incl. empty/unseeded ledger where
          // nextPending([])===null) → transition workflow complete (legacy single-
          // sub behavior); non-null (pending subs remain) → keep workflow active.
          const { readCurrentWorkflow } = await import('../checkpoint/state.js')
          const { nextPending } = await import('../checkpoint/ledger.js')
          const latest = await readCurrentWorkflow()
          const allResolved = nextPending(latest?.sub_progress ?? []) === null
          await completePhase({
            phaseId: sub,
            status: 'complete',
            lastTask: opts.summary ?? `phase ${sub} complete`,
            transitionWorkflowComplete: allResolved,
          })
          console.log(`[harnessed] checkpoint complete: ${sub} (evidence: ${evidenceStatus})`)
          process.exit(0)
          return
        }

        // action === 'fail' — flip the ledger entry → 'failed', record a terminal
        // checkpoint with FAILED: prefix, signal failure via exit code (engineHook
        // status union has no 'fail').
        const { mutateSubProgress } = await import('../checkpoint/state.js')
        await mutateSubProgress((e) => markIfSeeded(e, sub, 'failed'))
        // v5.0 Spec 1 — a failed sub must NOT flip the workflow to 'complete'. The
        // failed entry lives in the ledger; the orchestrator/user reads it and
        // decides STOP. Workflow stays 'active'.
        await completePhase({
          phaseId: sub,
          status: 'complete',
          lastTask: `FAILED: ${opts.summary ?? ''}`,
          transitionWorkflowComplete: false,
        })
        console.error(
          `[harnessed] checkpoint FAILED recorded: ${sub}${opts.summary ? ` — ${opts.summary}` : ''}`,
        )
        process.exit(1)
      },
    )
}
