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

const ACTIONS = ['start', 'complete', 'fail', 'intent'] as const
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

// 4.22.0 T6 — absorb a pending intent when ITS OWN sub completes/fails (the
// leaf-intent lifecycle; master intents are absorbed by `checkpoint start`).
// Name-matched: completing a DIFFERENT sub leaves the intent (and its per-turn
// nag) alive. Fail-soft — intent bookkeeping must never break a checkpoint.
async function absorbIntentFor(sub: string): Promise<void> {
  try {
    const { mutateStore } = await import('../checkpoint/state.js')
    const { activeKey, repoKey } = await import('../checkpoint/workflowStore.js')
    await mutateStore((store) => {
      if (!store.intents) return store
      const intents = { ...store.intents }
      for (const k of [activeKey(), repoKey()]) {
        if (intents[k]?.master === sub) delete intents[k]
      }
      return { ...store, intents }
    })
  } catch {
    // fail-soft
  }
}

export function registerCheckpoint(program: Command): void {
  program
    .command('checkpoint <action> <sub>')
    .description(
      'Record workflow progress: intent | start | complete | fail <sub-workflow> (writes to ~/.claude/harnessed/checkpoints/)',
    )
    .option('--summary <text>', 'short summary stored as the checkpoint lastTask')
    .option('--plan <json>', 'gates plan JSON (start only) — seeds the sub-progress ledger')
    .option(
      '--force',
      'complete only — override a missing-artifact evidence block (records overridden)',
    )
    .option(
      '--tokens <n>',
      'complete only — conversation token count; auto-compacts the ledger when >= the shouldCompact threshold (Phase 14)',
    )
    .action(
      async (
        action: string,
        sub: string,
        opts: { summary?: string; plan?: string; force?: boolean; tokens?: string },
      ) => {
        if (!isAction(action)) {
          console.error(
            `[harnessed] checkpoint: unknown action "${action}" — expected one of ${ACTIONS.join(', ')}`,
          )
          process.exit(1)
          return
        }

        // 4.22.0 (L1 anti-freestyle) — `intent <master>`: record that a master
        // command was INVOKED before any plan exists. Pre-executed by the
        // generated /auto command + master SKILL.md via CC's `!`cmd``
        // preprocessing, so it runs before the model decides anything; a fresh
        // intent with an unseeded ledger is the freestyle signature the per-turn
        // inject bin nags on. ABSOLUTELY fail-soft (own guard included): CC's
        // behavior on a failing pre-exec is undocumented — nothing here may
        // print an error into the assembled prompt or exit non-zero.
        if (action === 'intent') {
          try {
            checkPathSafe(sub)
            const { mutateStore } = await import('../checkpoint/state.js')
            const { activeKey } = await import('../checkpoint/workflowStore.js')
            // 4.22.0 T6 — master vs leaf via role-prompts is_master (single SoT);
            // classifier is itself fail-soft (unknown/unreadable → 'leaf').
            const { classifyIntentKind } = await import('../checkpoint/intentKind.js')
            const { getAssetsRoot } = await import('./lib/assetsRoot.js')
            const kind = classifyIntentKind(sub, getAssetsRoot())
            const key = activeKey()
            await mutateStore((store) => ({
              ...store,
              intents: {
                ...(store.intents ?? {}),
                [key]: { master: sub, ts: new Date().toISOString(), kind },
              },
            }))
            console.log(
              kind === 'master'
                ? `[harnessed] engine engaged: /${sub} invoked — intent registered, ledger awaiting plan. ` +
                    `Next: \`harnessed gates ${sub} --task "<locked spec>"\` → \`harnessed checkpoint start ${sub} --plan '<gates JSON>'\`. ` +
                    'Freestyling past this point bypasses the ledger, evidence guard, and recovery.'
                : `[harnessed] engine engaged: /${sub} invoked — intent registered, sub not yet checkpointed. ` +
                    `Next: \`harnessed prompt ${sub} --task "<spec>" --json\` → spawn per SOP → \`harnessed checkpoint complete ${sub}\` (or \`fail\`). ` +
                    'Freestyling past this point bypasses the ledger, evidence guard, and recovery.',
            )
          } catch {
            // fail-soft — a pre-exec surface must never pollute the prompt
          }
          process.exit(0)
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
          // 4.22.0 — absorb this session's pending intent: start IS the engagement
          // the intent was waiting for, so the per-turn nag stops here. Fail-soft
          // (an intent-clear problem must never break start).
          try {
            const { mutateStore } = await import('../checkpoint/state.js')
            const { activeKey, repoKey } = await import('../checkpoint/workflowStore.js')
            await mutateStore((store) => {
              if (!store.intents) return store
              const intents = { ...store.intents }
              delete intents[activeKey()]
              delete intents[repoKey()]
              return { ...store, intents }
            })
          } catch {
            // fail-soft
          }
          console.log(`[harnessed] checkpoint started: ${sub} → ${checkpointPath}`)
          process.exit(0)
          return
        }

        if (action === 'complete') {
          const { checkArtifacts } = await import('../checkpoint/evidence.js')
          const { mutateSubProgress } = await import('../checkpoint/state.js')
          // B1 (v4.19.0): workflows/ 是运行时资产 — 经 assetsRoot seam(npm/dev 下
          // === packageRoot,compiled 下指向解包目录)。
          const { getAssetsRoot } = await import('./lib/assetsRoot.js')

          const result = await checkArtifacts(sub, getAssetsRoot())
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
          // 4.22.0 T6 — a leaf intent for THIS sub is satisfied by its completion.
          await absorbIntentFor(sub)

          // G1 — recompute scale from the post-mark ledger + working-tree size and
          // record verify_mode on the envelope (advisory; consumed by the verify skill).
          const { collectScaleMetrics, assessScale } = await import('../checkpoint/scale.js')
          const { readCurrentWorkflow, writeCurrentWorkflow } = await import(
            '../checkpoint/state.js'
          )
          const afterMark = await readCurrentWorkflow()
          if (afterMark) {
            const metrics = await collectScaleMetrics(process.cwd(), afterMark.sub_progress ?? [])
            await writeCurrentWorkflow({ ...afterMark, verify_mode: assessScale(metrics) })
          }

          // v5.0 Spec 1 — a master chain has many subs; completing ONE sub must not
          // flip the whole workflow to 'complete'. Reuse the post-mark ledger read
          // above (the verify_mode write does not touch sub_progress, so afterMark's
          // ledger is current) and use nextPending: null (all subs resolved, incl. the
          // empty/unseeded ledger where nextPending([])===null) → transition workflow
          // complete (legacy single-sub behavior); non-null (pending subs remain) →
          // keep workflow active.
          const { nextPending } = await import('../checkpoint/ledger.js')
          const allResolved = nextPending(afterMark?.sub_progress ?? []) === null
          await completePhase({
            phaseId: sub,
            status: 'complete',
            lastTask: opts.summary ?? `phase ${sub} complete`,
            transitionWorkflowComplete: allResolved,
          })

          // Phase 16 — auto-capture learnings: when the workflow completes
          // (allResolved), append the final ledger's failure/loop/reject signals
          // to the repo's .planning/LEARNINGS.md. Uses the pre-compact `afterMark`
          // snapshot so rejected entries (which the auto-compact below would evict)
          // are not lost. No-op for a clean ledger (D4).
          if (allResolved && afterMark) {
            const { captureWorkflowLearnings } = await import('../checkpoint/learnings.js')
            const captured = await captureWorkflowLearnings(afterMark.sub_progress ?? [], sub)
            if (captured > 0) {
              console.log(`[harnessed] captured ${captured} learning(s) → .planning/LEARNINGS.md`)
            }
          }

          // Phase 14 — auto-compact: when the caller passes a conversation token
          // count that crosses the shouldCompact threshold, evict resolved ledger
          // entries (G6-safe: fail_count>0 entries are never evicted). Silent no-op
          // without --tokens (manual `harnessed compact` is the other path).
          const { shouldAutoCompact, compactWorkflow } = await import('../checkpoint/compact.js')
          if (shouldAutoCompact(opts.tokens != null ? Number(opts.tokens) : undefined)) {
            const c = await compactWorkflow()
            if (c.evicted > 0) {
              console.log(
                `[harnessed] auto-compact: evicted ${c.evicted} resolved entries (-${c.pct_saved}% tokens)`,
              )
            }
          }

          // Phase 22 — smart reminders: only when this completion finishes the whole
          // chain (allResolved = a completed phase/cycle). Set AFTER auto-compact so
          // the flags survive the compact envelope rewrite. Fail-soft (a reminder must
          // never block a checkpoint): any error here is swallowed, no flags set.
          if (allResolved) {
            try {
              const { defaultShipReady } = await import('../checkpoint/shipReady.js')
              const { incrementPhases, isRetroDue, retroThreshold } = await import(
                '../checkpoint/retroMeta.js'
              )
              const { mutateStore, readCurrentWorkflow, writeCurrentWorkflow } = await import(
                '../checkpoint/state.js'
              )
              const { repoKey } = await import('../checkpoint/workflowStore.js')

              const ship = defaultShipReady(process.cwd())
              const key = repoKey()
              const threshold = retroThreshold(process.env)

              // Bump the per-repo retro counter (store sidecar; survives activate()).
              let retroDue = false
              await mutateStore((store) => {
                const meta = { ...(store.retro_meta ?? {}) }
                const next = incrementPhases(meta[key])
                meta[key] = next
                retroDue = isRetroDue(next.phases_since_retro, threshold)
                return { ...store, retro_meta: meta }
              })

              // Merge the flags onto the latest envelope (read by the G4 inject twins).
              const latest = await readCurrentWorkflow()
              if (latest) {
                await writeCurrentWorkflow({
                  ...latest,
                  ship_ready: ship.ready,
                  ship_commits: ship.commits,
                  retro_due: retroDue,
                })
              }
            } catch {
              // fail-soft — never let a reminder break the checkpoint
            }
          }

          console.log(`[harnessed] checkpoint complete: ${sub} (evidence: ${evidenceStatus})`)
          process.exit(0)
          return
        }

        // action === 'fail' — flip the ledger entry → 'failed', record a terminal
        // checkpoint with FAILED: prefix, signal failure via exit code (engineHook
        // status union has no 'fail').
        const { mutateSubProgress } = await import('../checkpoint/state.js')
        await mutateSubProgress((e) => markIfSeeded(e, sub, 'failed'))
        // 4.22.0 T6 — a failed sub is still a RESOLVED sub for its leaf intent.
        await absorbIntentFor(sub)
        // v5.0 Spec 1 — a failed sub must NOT flip the workflow to 'complete'. The
        // failed entry lives in the ledger; the orchestrator/user reads it and
        // decides STOP. Workflow stays 'active'.
        await completePhase({
          phaseId: sub,
          status: 'complete',
          lastTask: `FAILED: ${opts.summary ?? ''}`,
          transitionWorkflowComplete: false,
        })
        // G6 — after recording the failure, detect a fix-forget-repeat loop and
        // surface a break-loop directive (the skill doc carries the 5-dim analysis).
        const { readCurrentWorkflow } = await import('../checkpoint/state.js')
        const { detectLoop, LOOP_THRESHOLD } = await import('../checkpoint/breakLoop.js')
        const latest = await readCurrentWorkflow()
        const loops = detectLoop(latest?.sub_progress ?? [])
        const looped = loops.find((l) => l.sub === sub)
        if (looped) {
          console.error(
            `[harnessed] BREAK-LOOP: sub '${sub}' failed ${looped.count}x (>= ${LOOP_THRESHOLD}). ` +
              'Stop retrying — run the break-loop skill for root-cause analysis and capture the lesson to .planning/.',
          )
        }
        console.error(
          `[harnessed] checkpoint FAILED recorded: ${sub}${opts.summary ? ` — ${opts.summary}` : ''}`,
        )
        process.exit(1)
      },
    )
}
