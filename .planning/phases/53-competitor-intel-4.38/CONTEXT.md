# Phase 53 — Competitor intel read (comet + Trellis, 06-13 → 08-26) → 4.38.0

**Trigger**: user asked what recent upstream commits on `rpamis/comet` and the
project we habitually compare against are worth absorbing. `docs/comparison.md`
identified the second as `mindfold-ai/Trellis` and was 2.5 months stale.

**Method**: every commit on both repos since the comparison snapshot (2026-06-13)
read in full via `gh api`. Candidates were kept only when they looked like a
defect class *this* repo could share, then each was verified against this tree
before being called a gap. Two of five survived that check.

## Landed (4.38.0)

| # | Source | What | Where |
|---|---|---|---|
| A1 | Trellis `feat(omp): compaction-aware injection`, `feat(mem): recover conversations hidden behind compaction` | SessionStart hook invalidating the per-turn delta cache | `manifests/optional/perturn-inject-invalidate.yaml`, `injectCache.invalidateInjectCache`, `--invalidate` branch in `injectStateMain`, doctor check 21 |
| B1 | Trellis `no-trellis skip keyword mutes per-turn context injection (#427)` | Substituted: `HARNESSED_INJECT_PC_OFF=1` (see D5) | `injectStateMain` |
| B2 | Trellis `guard uninstall against deleting uncommitted user data` | Dirty-clone refusal before `rm -rf` | `src/uninstallers/gitCloneWithSetup.ts` |

## Rejected after verification (no code)

- **Trellis context-injection caps** (`cap sub-agent context injection #441`,
  `bound Trellis task context injection`, `deduplicate shared task context
  files`). Already covered: `DEFAULT_INJECT_BUDGET = 1500` +
  `selectWithinBudget`, since 4.25.0.
- **comet `exclude .comet runtime state from eval skill copies (#340)`.**
  `src/eval/runner.ts` gives every scenario a fresh `mkdtemp` repo AND state
  root, plus `GIT_CEILING_DIRECTORIES` to stop git walking up into an ambient
  repo (a leak this repo already hit and fixed — the comment records it).
  `EVAL_OVERLAY` in `scripts/verify-eval-traps.mjs` is a four-entry source
  allowlist, not a recursive tree copy. Stricter than the fix being considered.
- **Trellis `continue seq after a torn events.jsonl tail (#564)`.** Not
  applicable: `src/audit/log.ts` is append-only and nothing in this repo reads
  the audit log back.
- **comet `feat(core): move Runtime storage to project-local path (#291)`.**
  Runs *opposite* to this repo invariant (`~/.harnessed` is a legacy root; state
  resolves through `harnessedRoot()`). Recorded, not adopted.

## Decisions

**D1 — A1 is an upgrade, not a missed gap.** `injectCache.ts` 4.25.0 header
already named the tradeoff: the `REFRESH_TURNS` timer is "a stateless
alternative to a PreCompact hook we do not install". So this was a deliberate
weaker hedge, and the proposal is to replace a blind timer with the real signal.
The framing was corrected mid-session after reading that header.

**D2 — SessionStart, not PreCompact.** `PreCompact` is not in `ccHookAdd`
`HookEvent` union; `SessionStart` is, and it covers strictly more discontinuities
(`compact` / `clear` / `resume`). No `hook_matcher`: `startup` is already a no-op
because a new session id is a new cache key, and an unfiltered entry is one less
thing to keep in sync with CC source vocabulary.

**D3 — clear the whole `inject-cache/` dir.** Entry filenames hash
`repoKey::sid` together, so a single session cannot be singled out without a sid
the hook does not reliably carry. Over-clearing is the direction the module
fail-soft contract explicitly permits ("may only ever SAVE tokens, never lose
context"); worst case is one redundant full injection per live session.

**D4 — two manifests, closed by a doctor check.** `cc-hook-add` registers exactly
one hook per manifest and the manifest schema has no `requires` field, so the
pair cannot be one component. Half-install degrades to the pre-4.38.0 behaviour
(not a regression), so the check warns rather than fails.

**D5 — B1 substituted, not copied.** Trellis in-prompt keyword requires reading
the UserPromptSubmit stdin payload every turn. A blocking read on the per-turn
hot path is the user prompt hanging; that is a bad trade for ~1500 tokens. An
env switch buys the same relief at session granularity with none of the risk.
Scope narrowed on purpose: `<workflow-state>` is not mutable — muting the
breadcrumb that keeps the agent on the state machine buys tokens with drift.

**D6 — B2 refuses only on a positive dirty signal.** An uninstall that cannot
complete without a working `git` trades a rare data loss for a common dead end
(ADR-0029 fail-soft for operational faults). Override:
`HARNESSED_FORCE_UNINSTALL=1`, matching the `HARNESSED_ALLOW_LONG_STATE` house
pattern rather than adding a field to the `UninstallOpts` shared by all seven
uninstallers.

**D7 — `--show-toplevel`, not `--is-inside-work-tree`.** Found while making the
B2 test go green: git walks up, so a non-repo clone target answers `true`
whenever any ancestor is a repo, and the porcelain then reports the *outer* repo
dirt and blocks an unrelated uninstall. Requiring the toplevel to be the target
directory pins the question to the clone. The test that caught this ran under a
TMPDIR with a repo ancestor.

## Incidents

`src/checkpoint/budget.ts` was found emptied in the working tree at session start
(102 lines deleted, all four exports gone, uncommitted, not from this work).
Same shape as the two master `workflow.yaml` files that vanished in the previous
session. Restored with `git checkout HEAD --`. Cause still unidentified; the
recurrence is the signal worth keeping.

## Strategic finding (recorded, not actioned)

Platform expansion is the axis where the gap is widening: comet added Grok /
Trae / CodeBuddy / Antigravity 2.0 in ten weeks, Trellis added DeepSeek Harness /
Kimi Code / Snow CLI / Grok Build. harnessed implements Claude Code with a
partial codex path. User has since asked for full codex support plus a broader
compatibility range — milestone-scale, to be opened on its own cadence.

Counterweight: Trellis `refactor(configurators): describe each platform file set
once` moves it toward declarative platform description — an external data point
for this repo central bet, arriving from the project with the most platforms to
maintain.

Detail: `docs/comparison.md` (refreshed to a 2026-08-26 snapshot in this phase).
