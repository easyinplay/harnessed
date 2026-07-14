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

## Calibration change history (full disclosure)

- **W2 pilot**: headless dispatch required `--dangerously-skip-permissions` (isolated temp workspace only) + `--max-turns 40`. Frozen after pilot.
- **Variadic flag incident**: the bare arm's `--disallowedTools Skill` was initially placed BEFORE the positional prompt; the variadic option swallowed the entire prompt and two bugfix bare runs died with "Input must be provided". Fixed by ordering the flag after the prompt; the two runs were re-recorded. No data from the broken invocations is included.
- **Pre-setup pilot voided**: the very first bare run executed before `harnessed setup` existed on this machine; it was superseded by a post-setup re-run so both arms share identical machine state.

## Environment disclosure

- Both arms run on the SAME machine with the SAME global Claude Code configuration — including the user's ambient MCP servers and hooks. The only intended variable is the `/auto` entry.
- The bare arm additionally passes `--disallowedTools Skill` so ambient installed skills cannot leak orchestration into it.
- Consequence observed: every headless run inherits the full global config (≈11 hook child-process chains + all user-level MCP servers spawn per run). See Reliability in RESULTS.md — this shaped the non-termination findings.

## Salvage protocol (when a run does not exit cleanly)

A run that is killed (wedge or external cap) leaves no stream-json transcript (stdout is buffered by the dispatcher and lost with the process). In that case:
1. The workspace is preserved (cleanup is skipped on abnormal exit).
2. `acceptance.mjs` is executed against the residual workspace — this measures WORK COMPLETED at kill time, mechanically, same checker as clean runs.
3. The result.json is hand-written with an explicit `status` (`WEDGED_WORK_COMPLETE` / `CAPPED_AT_30MIN`), `salvaged: true`, and `metrics: null` — salvaged rows never claim turns/cost.
4. Every salvage read is disclosed, including flaky ones (compound r2: one 6/7 read under machine load, two independent 7/7 reads; recorded as 7/7 with the flake noted).

## Cost accounting basis

- The RESULTS total ($68.53, 16 runs) sums MEASURED `total_cost_usd` from clean-exit runs only.
- Four harnessed runs (2 × 30-min DNF later re-run as r3, compound r1 11h wedge, compound r2 30-min cap) were billed but their cost is unknowable (transcript lost). Bounded estimate by analogy with completed harnessed runs (~$8-11 each): **+$35-45**, putting the true experiment total at roughly **$105-115** including the voided pilot ($2.18).

## 附:secret 脱敏(2026-07-14 事故补记)

harnessed arm 的一次 transcript 录进了 agent 执行 `env` 的完整环境,含真实 `GITHUB_PERSONAL_ACCESS_TOKEN`。GitHub push-protection 拦下,已脱敏入档,并在 `scripts/evidence-pack/run.mjs` 增 `scrubSecrets()` 写盘前过滤(token shape + secret-named env 赋值)。**该 token 已在别处轮换。** 教训:录制真实 agent 会话必须写盘前脱敏 env dump。
