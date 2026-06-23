// Phase 24 Wave 1 (v8.0 Frictionless Entry) — zero-arg `harnessed` you-are-here
// entry: the comet `/comet` analog. A bare `harnessed` auto-detects the active
// workflow for the current repo (readCurrentWorkflow, repoKey-routed) and prints a
// "you-are-here + what's-next" dashboard (reuse buildRecoverLines) + a deterministic
// `NEXT: auto|manual|done` contract line + a run hint; `--json` emits the structured
// object; no active workflow → onboarding hint. The mechanism is entirely shipped —
// this is pure aggregation + a zero-arg dispatch (D4/D5). Read-only: no spawn, no
// state/git/remote mutation (D2 no-spawn report; cli.ts:99 "no spawn"). Sister:
// src/cli/lib/release-preflight.ts (pure collect + thin runner).

import { resolveAutoTransition, resolveNext } from '../../checkpoint/nextStep.js'
import type { SubProgressEntryType } from '../../checkpoint/schema/currentWorkflow.v1.js'
import { t } from '../../i18n/index.js'
import { harnessedFile } from '../../installers/lib/harnessedRoot.js'
import { buildRecoverLines } from '../status.js'

/** Workflow envelope subset consumed by the here view (mirrors buildRecoverLines). */
interface HereWorkflow {
  phase: string
  status: string
  started_at: string
}

export interface HereJson {
  active: boolean
  phase?: string
  status?: string
  started_at?: string
  next?: 'auto' | 'manual' | 'done'
  sub?: string
  hint?: string
  sub_progress?: SubProgressEntryType[]
}

/**
 * D3 — explicit bare-invocation detection (NOT commander program.action). The
 * already-pre-parsed `--lang`/`--lang=` pair is stripped first, then ONLY `[]` →
 * here(human) and `['--json']` → here(json) are recognized. Anything else
 * (subcommand / `--help` / `--version` / unknown word / multi-token) falls through
 * so `harnessed bogus` still errors as an unknown command (T-24-01 anti-misfire).
 */
export function parseBareInvocation(argvRest: string[]): { here: boolean; json: boolean } {
  const tokens: string[] = []
  for (let i = 0; i < argvRest.length; i++) {
    const a = argvRest[i]
    if (a === '--lang') {
      i++ // skip the language code that follows
      continue
    }
    if (a?.startsWith('--lang=')) continue
    if (a !== undefined) tokens.push(a)
  }
  if (tokens.length === 0) return { here: true, json: false }
  if (tokens.length === 1 && tokens[0] === '--json') return { here: true, json: true }
  return { here: false, json: false }
}

/**
 * D4 — aggregate the you-are-here view. Pure over the injected wf/ledger (the only
 * impurity is buildRecoverLines' drift re-hash, which fires only when a ledger entry
 * carries evidence). wf null → onboarding; else the recover body + a `NEXT:` line +
 * an optional run hint. Returns lines (for human) + the structured json shape.
 */
export async function buildHereView(
  wf: HereWorkflow | null,
  ledger: SubProgressEntryType[],
  auto: boolean,
): Promise<{ lines: string[]; json: HereJson }> {
  if (!wf) {
    return {
      lines: [
        t('here.no_workflow', { path: harnessedFile('workflows.json') }),
        t('here.no_workflow.hint'),
      ],
      json: { active: false },
    }
  }

  const body = await buildRecoverLines(wf, ledger)
  const step = resolveNext(ledger, auto)
  const lines = [
    ...body,
    `NEXT: ${step.next}`,
    ...(step.sub ? [`→ run: harnessed prompt ${step.sub}`] : []),
  ]
  return {
    lines,
    json: {
      active: true,
      phase: wf.phase,
      status: wf.status,
      started_at: wf.started_at,
      next: step.next,
      sub: step.sub,
      hint: step.hint,
      sub_progress: ledger,
    },
  }
}

/** Thin runner — lazy-imports the repo-routed state read (sister: cli/next.ts), then
 *  prints the human dashboard or the JSON object. Read-only; exits 0. */
export async function runHere(opts: { json?: boolean }): Promise<void> {
  const { readCurrentWorkflow } = await import('../../checkpoint/state.js')
  const wf = await readCurrentWorkflow()
  const ledger = wf?.sub_progress ?? []
  const auto = resolveAutoTransition(wf?.auto_transition)
  const view = await buildHereView(wf, ledger, auto)
  if (opts.json) {
    console.log(JSON.stringify(view.json, null, 2))
  } else {
    for (const l of view.lines) console.log(l)
  }
  process.exit(0)
}
