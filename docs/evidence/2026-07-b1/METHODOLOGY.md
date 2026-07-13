# B1 Evidence Pack — Methodology

> Snapshot: harnessed **v4.31.1**, protocol drafted **2026-07-13** (W1). Results in
> this directory are a one-off evidence pack, not a maintained benchmark — see
> "Credibility statement" for what this document does and does not claim.

## Question under test

Does driving a coding agent through harnessed's 4-stage orchestration (`/auto`)
change the outcome on small, well-specified engineering tasks, compared to the
same agent run bare — and at what token cost?

## Tasks

Three self-contained fixture projects under `fixtures/evidence-tasks/`, each with
a verbatim prompt (`task.md`) and a machine acceptance script (`acceptance.mjs`)
that prints a checklist JSON:

| Task | Kind | Initial state | Acceptance (machine-checked) |
|---|---|---|---|
| `bugfix-todo-api` | bug fix | 4/5 tests green, 1 boundary test red | all tests green; test file digest unchanged; API surface intact |
| `feature-cli-stats` | feature | 2 existing tests green, 4 acceptance tests red | all tests green; acceptance test digest unchanged; `median()` does not mutate input |
| `refactor-parser` | behavior-preserving refactor | all 6 tests green; duplicated logic marked | tests stay green; `src/escape.mjs` exists + exported; parser imports it; duplication markers gone |

Tasks were authored before any run and are frozen for the duration of the
experiment (this directory's git history is the audit trail).

## Arms

Both arms use the same model, the same task prompt (verbatim from `task.md`),
and a fresh isolated copy of the fixture as working directory.

- **Arm `bare`** — Claude Code headless (`claude -p`), no harnessed involvement.
- **Arm `harnessed`** — the same headless entry, prompt routed through
  harnessed's `/auto` orchestration (workflow skills installed, engine
  gates/checkpoint/evidence guard active).

Exact command lines are recorded per run in `runs/*.result.json`; the runner is
`scripts/evidence-pack/run.mjs` (`--dry-run` prints the full protocol without
spending tokens). Flag calibration happens in the W2 pilot and is frozen before
the full grid.

## Metrics (per run)

1. **Acceptance pass rate** — checklist from the task's `acceptance.mjs`
   (machine-checked; the primary outcome).
2. **Turns** — assistant turns to completion, from the transcript.
3. **Tokens** — total input/output tokens, from the transcript usage records.
4. **Compliance surface** (harnessed arm only) — ledger/evidence integrity of
   the orchestrated run; recorded as context, not compared across arms.
5. **Subjective notes** — explicitly labeled as subjective; never aggregated.

## Repetitions & grid

Full grid: 3 tasks × 2 arms × ≥2 reps. The W2 pilot (1 task × 2 arms × 1 rep)
calibrates flags and cost before the grid is run.

## Credibility statement (read this first)

- **No statistical claim.** At this N, differences may be noise. Published
  agent-benchmark literature reports ~7-percentage-point swings attributable to
  the harness alone and a ~37% lab-to-real gap; we do not pretend this pack is
  above that noise floor.
- **Conflict of interest.** This pack is produced by harnessed's author, on the
  author's machine. It is adoption *evidence*, not third-party proof.
- **The mitigation is transparency, not authority**: every run's full transcript
  (stream-json) is published unedited alongside the summary. Readers are
  expected to check the transcripts, not trust the table.
- Runs are one-off against the pinned versions above; results are not
  maintained across future releases.

## Reproduction

```bash
git checkout v4.31.1   # or later — protocol files live in-tree
node scripts/evidence-pack/run.mjs --task bugfix-todo-api --arm bare --rep 1 --dry-run
# drop --dry-run to spend real tokens (requires authenticated Claude Code)
```

Each run writes `scripts/evidence-pack/runs/<task>-<arm>-r<N>.jsonl` (transcript)
and `...result.json` (metrics + acceptance checklist + exact command). RESULTS.md
in this directory aggregates the grid after W3.
