# Phase 24 CONTEXT — single-command resume entry (comet `/comet` analog)

> Locked from the 2026-06-23 v8.0 Frictionless Entry discuss (ROADMAP active + STATE — do NOT re-derive the posture/competitive basis here) + the Phase 24 design clarification (AskUserQuestion 2026-06-23: output contract = human you-are-here dashboard default + `--json` machine + trailing NEXT hint). Main-session hand-controlled plan (GSD plan-phase agent chain overreaches on this host — STATE methodology lesson). Lightweight design-lock, NOT a formal `/plan-eng-review` (no new architecture — pure aggregation of shipped pieces); raise if a formal review is wanted.

## Goal

Close the single-command-resume ergonomics gap vs comet `/comet`: a bare `harnessed` (zero-arg) auto-detects the active workflow for the current repo and prints a "you-are-here + what's-next" view — no need to remember which of `status` / `next` / `resume` to run. The mechanism is **entirely shipped** (`readCurrentWorkflow` repoKey-routed, `resolveNext`, `buildRecoverLines`); the only gap is the zero-arg dispatch + an aggregated view.

## Architecture constraint (already resolves the "continue" gray area)

`cli.ts:99` comment (v4.0): "CC main session calls these; **no spawn**". harnessed's CLI never runs the implementation itself. So "continue" for the zero-arg entry = **report you-are-here + emit the deterministic NEXT contract + point at the next command** — the actual continue is the CC main session acting on `NEXT: auto|manual|done`. comet `/comet` is a CC slash command that keeps orchestrating; harnessed's counterpart is a CLI report whose NEXT line the orchestrator consumes. This is architecture-fixed, not a choice.

## Verified reuse surface (spec-writing checklist — all grep/Read-confirmed 2026-06-23)

- `readCurrentWorkflow()` — `src/checkpoint/state.js` (next.ts:21 / status.ts:20 import it). Returns the cwd-repo envelope (repoKey-routed via workflowStore) or `null`. Envelope fields used: `phase`, `status`, `started_at`, `sub_progress` (ledger), `auto_transition?`.
- `resolveNext(ledger, auto)` — `src/checkpoint/nextStep.ts:15`. Returns `{ next: 'auto'|'manual'|'done', sub?, hint? }`. (exists)
- `resolveAutoTransition(envelopeValue)` — currently **private** in `src/cli/next.ts:7` (env `HARNESSED_AUTO_TRANSITION` > envelope > default true). **No test covers it** (grep empty). → MIGRATE to `nextStep.ts` + export; next.ts re-imports; add cases to `tests/checkpoint/nextStep.test.ts`.
- `buildRecoverLines(wf, ledger)` — `src/cli/status.ts:59` (exists, export, async; emits `workflow:` line + per-sub `statusMarker` + `← next` + `→ next: harnessed prompt <sub>` + drift warnings). Reused as the human you-are-here body.
- `statusMarker`, `nextPending`, `repoKey` — `status.ts:26` / `ledger.ts` / `workflowStore.ts:60` (all exist, export).
- i18n key style: `"ns.key": "...{{param}}"` (messages/en.json L80–106). NEW keys: `here.no_workflow`, `here.no_workflow.hint`.

## Locked decisions

- **D1 — output contract = human dashboard default + `--json` + NEXT hint** (AskUserQuestion A): bare `harnessed` prints the human you-are-here body (reuse `buildRecoverLines`) + a `NEXT: auto|manual|done` contract line (same as `harnessed next`) + a run hint; `harnessed --json` prints the structured object (sister: `status`/`resume`/`next` all have `--json` or machine output). No active workflow → onboarding hint, exit 0.
- **D2 — no-spawn report semantics** (architecture-fixed): the entry reports + emits NEXT; it never spawns/executes the implementation, and it does NOT auto-emit `harnessed prompt <sub>` (rejected option C — single-responsibility; would dump prompt text unexpectedly).
- **D3 — explicit bare-invocation detection, NOT commander `program.action()`**: a pure `parseBareInvocation(argvRest)` recognizes ONLY `[]` → here(human) and `['--json']` → here(json) (stripping the already-pre-parsed `--lang`/`--lang=` pair). Anything else (subcommand / `--help` / `--version` / unknown word) falls through to `program.parse`. This guarantees `harnessed bogus` still errors as an unknown command (does NOT misfire the dashboard) and keeps `--help`/`--version` intact.
- **D4 — reuse `buildRecoverLines` for the human body** (KARPATHY-minimal): no new rendering; the entry = readCurrentWorkflow → (null ? onboarding : buildRecoverLines + NEXT line). The aggregation lives in a testable pure-ish `buildHereView(wf, ledger, auto)`.
- **D5 — aggregation in `src/cli/lib/here.ts`** (sister: `src/cli/lib/release-preflight.ts`): holds `parseBareInvocation`, `buildHereView`, `runHere`; `cli.ts` calls them before `program.parse`. TDD red-first (D6).
- **D6 — TDD red-first**: unit-test `parseBareInvocation` (6 argv shapes), `buildHereView` (null → onboarding; populated → phase + markers + NEXT), and the migrated `resolveAutoTransition` (env precedence) before implementing.

## Scope

**Wave 1 — `src/cli/lib/here.ts` + dispatch (TDD):**
- `src/checkpoint/nextStep.ts`: export `resolveAutoTransition` (migrated from next.ts).
- `src/cli/next.ts`: import `resolveAutoTransition` from nextStep (de-dup).
- `src/cli/lib/here.ts` (NEW): `parseBareInvocation`, `buildHereView`, `runHere`.
- `src/cli.ts`: bare-invocation dispatch before `program.parse`.
- `messages/en.json` + `messages/zh-Hans.json`: `here.no_workflow` + `here.no_workflow.hint`.
- `tests/cli/here.test.ts` (NEW) + `tests/checkpoint/nextStep.test.ts` (resolveAutoTransition cases).

## Out of scope (do NOT touch)

- README value-prop / quickstart narrative — that is **Phase 25** (avoid double-authoring the same surface).
- `prompt`/`gates`/`run` behavior — the entry only reads + reports.
- Cross-harness path abstraction (`~/.claude/` hardcoding) — that is **v9.0**.
- Any spawn / auto-exec of the next sub (D2).

## Invariants

- Read-only: the entry never mutates state, git, or remote.
- `harnessed bogus` / `--help` / `--version` / every existing subcommand behave exactly as before (D3 explicit detection).
- KARPATHY-minimal surgical diff; reuse `buildRecoverLines` (no new renderer).
- TDD red→green (Wave 1); full gate green vs the post-ECC-batch baseline (1342 tests); Windows CI green; biome preempt before commit; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `parseBareInvocation`: `[]` → `{here:true,json:false}`; `['--json']` → `{here:true,json:true}`; `['--lang','zh']` → `{here:true,json:false}` (lang stripped); `['status']` / `['bogus']` / `['--help']` → `{here:false}`. (unit)
2. `buildHereView`: `null` wf → onboarding line(s) + json `{active:false}`; populated wf+ledger → lines contain the phase, per-sub markers, a `← next`, and a `NEXT: auto|manual|done` line; json contains `phase`/`status`/`next`/`sub`. (unit, injected wf/ledger)
3. `resolveAutoTransition`: env `true`/`false` override the envelope; unset falls to envelope value then default `true`. (unit, migrated)
4. Bare `harnessed` in a repo with an active workflow prints the dashboard + NEXT; in a repo with none prints the onboarding hint; `harnessed --json` prints valid JSON; `harnessed bogus` still errors unknown-command. (dogfood)
5. Full test gate green; biome clean; tsc 0; no state/git/remote mutation from the new path.
