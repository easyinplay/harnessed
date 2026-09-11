# harnessed vs comet vs Trellis — an honest comparison

> Snapshot date: **2026-09-11** (previous: 2026-08-26, 2026-06-13). Numbers move; treat them as a point-in-time reading, not a leaderboard.
> Written by the harnessed maintainer. We try hard not to flatter ourselves here — where harnessed is behind, this says so, and the longest section below is about a weakness that is structural to harnessed's own central bet.

[comet](https://github.com/rpamis/comet) and [Trellis](https://github.com/mindfold-ai/Trellis) are the two AI-coding-harness projects closest in spirit to harnessed. This page compares the three honestly: the headline metrics, what each does well, where harnessed genuinely lags, and — the point of the exercise — what to change here as a result.

## The metrics (and which ones are noise)

| | npm dl / month | stars | forks | open issues | dl ÷ stars |
|---|---|---|---|---|---|
| **harnessed** | 920 | **2** | 1 | 1 | 460 : 1 |
| **comet** | 6,041 | 3,013 | 294 | 19 | 2.0 : 1 |
| **Trellis** | 8,917 | 14,602 | 821 | 51 | 0.6 : 1 |

*(npm `api.npmjs.org` 2026-08-12 → 09-10; GitHub API 2026-09-11.)*

**Downloads are the least informative column; forks and open issues are the most.** A download can be a CI run or a bot. A fork is someone who wanted to change the thing. An open issue is someone who hit a problem and cared enough to write it up. harnessed has **1 fork and 1 issue** — that is the honest measure of its organic adoption, and it is approximately zero. Its download/star ratio being two to three orders of magnitude out of line with the other two says the same thing from another angle.

harnessed's own downloads fell 2,771 → 920 since the last snapshot, which is consistent with the reading that they were never people: we published far fewer versions in this window.

So: comet and Trellis have shipped and found users. harnessed has shipped a lot of *engineering* and almost no *adoption*. That is the backdrop for everything below.

## What each project is

- **comet** ([@rpamis/comet](https://www.npmjs.com/package/@rpamis/comet), MIT, 0.4.0 stable since 2026-09-08) — chains OpenSpec (the WHAT) and Superpowers (the HOW) into a 5-phase idea→archive pipeline, installing both from their official channels (no vendoring) via imperative per-component TypeScript installers, driven by a state machine. 0.4.0 shipped a "Native" supervisor engine alongside the older "Classic" one. Strong at: a resumable spec lifecycle, cross-platform distribution, semantic code indexing (CodeGraph), measured context compression.

- **Trellis** ([@mindfoldhq/trellis](https://www.npmjs.com/package/@mindfoldhq/trellis), AGPL-3.0, 0.6.16) — a self-contained engineering framework that persists specs/tasks/memory **into your repo** (`.trellis/`). Its moat: per-session auto-injection of relevant specs, and an `update-spec` loop that promotes learnings back so the next session starts smarter. Strongest adoption of the three.

- **harnessed** (Apache-2.0, 4.41.0) — also installs upstreams from official channels, but describes each one **declaratively** in a YAML manifest (install method + verify + uninstall + license + provenance + health) rather than in bespoke installer code. A generic engine consumes the manifests; an imperative backend handles the irregular cases. Highest engineering investment of the three; lowest adoption.

## The structural cost of harnessed's own bet

This is the section that matters most, and it did not exist in earlier snapshots because it took a concentrated audit to see.

harnessed's central claim is that **describing composition declaratively scales better than bespoke imperative installers**. That claim is probably right about *scaling*. What it buys along with the scaling is a failure mode the imperative approach cannot have:

> **A declaration that nothing evaluates.** In comet's model the installer code *is* the description, so there is no way for a field to be "declared but dead" — there are no fields. In harnessed's model, declaration and evaluation are separate artifacts, and nothing in TypeScript, in the schema, or in CI notices when the second one is missing.

Ten instances have now been found in this repo, every one verified rather than suspected:

| declaration | intended meaning | reality | found |
|---|---|---|---|
| `upstream_health.*` | supply-chain health, 4 fields × 19 manifests | zero consumers; dates frozen up to 121 days | Phase 55 |
| `max_iterations: '{{ … }}'` | per-phase loop caps, 21 sites | never interpolated → every cap silently 20 | Phase 54 |
| `capabilities.fires_when` | 108 routing keys | never read by the resolver | Phase 54 |
| `verify/second-opinion` | a declared verify sub | never delegated to | Phase 54 |
| `brainstorming.skips_when` | "skip when it's a single obvious implementation" | executed as "skip whenever it's small", vetoing every risk signal | Phase 58 |
| install receipt | what is installed | unreachable on the idempotent path → `status` under-reported | Phase 59 |
| `manifestSha1` | "sha1 of the manifest that produced this install" | all 6 call sites pass `''` | Phase 59 |
| `tested_with_versions` | cc/node versions tested against, "CI 回填" | zero consumers; that CI never existed | this snapshot |
| `mutually_exclusive_with` | components that must not coexist | zero consumers **and zero declarations** | this snapshot |
| `decision_rules` | per-manifest routing hint | zero consumers (the routing file of the same name is a different artifact) | this snapshot |

`mutually_exclusive_with` is the clearest case, because it shows the full cycle:

1. the declarative mechanism was designed, schema'd, and documented (`SCHEMA.md`: "v0.2+ 启用");
2. it was never wired to anything;
3. a real mutual exclusion then arose — ECC ships a chrome-devtools MCP connector that conflicts with the standalone `chrome-devtools-mcp` manifest;
4. it was solved **imperatively**, by hand, in `src/cli/lib/check-ecc.ts`'s dual-install detection;
5. nothing anywhere noticed that the declarative mechanism for exactly this job was sitting dead.

That is the bet's cost, priced. Not "declarative is wrong" — but **declarative without an evaluation gate decays into documentation that reads like machinery**, which is worse than no declaration at all, because readers trust it.

Two further observations from the same audit, both about the *shape* of the decay:

- **Several dead fields trace to the same phantom.** `upstream_health.last_check`, `last_known_good_version`, and `tested_with_versions` were all documented as maintained by a "weekly CI" that was never built. One ADR sentence, written once, licensed three fields to rot for years.
- **The decay is invisible to the type system by construction.** ADR-0038's fail-closed rule catches an *undefined* variable in a gate expression. It cannot catch a *defined* field nobody reads — that is not a type error, it is an absence of code.

## Where harnessed genuinely lags

- **Adoption.** 1 fork, 1 issue. Architecture decisions here are made without real users to falsify them. This is the root cause of the section above: with users, a dead `mutually_exclusive_with` would have produced a bug report years before an internal audit found it.
- **Cross-platform breadth, and the rate is the story.** comet has added Grok, Trae, CodeBuddy, Antigravity; Trellis has added DeepSeek Harness, Kimi Code, Snow CLI, Grok Build on top of OpenCode / Pi / Codex. harnessed implements Claude Code, with a codex path behind the `PlatformDescriptor` seam (ECC's codex channel moved to the native codex plugin in 4.41.0 — real, but one component).
- **Nobody has measured whether harnessed helps.** Trellis's ablation PR shipped a *paired A/B*: Trellis on passed 5/5 hidden policy groups, fully ablated passed 1/5, at a cost of 344s/37 commands vs 318s/17. That is narrow evidence, and they said so — but it is evidence. harnessed has 2,706 tests proving it does what it says and **zero** measurements of whether what it says is worth doing. 4.41.0 added `HARNESSED_OFF=1`, which makes the experiment possible for the first time. It has not been run.
- **Test volume relative to comet.** From their own release PRs: comet 4,531 tests with a 77% patch-coverage target; harnessed 2,706; Trellis 1,712. harnessed is not behind Trellis here, but comet's release gate is heavier than ours (three-platform runtime smoke, Dashboard E2E, security review per release).

## Where harnessed is genuinely good (not forced)

- **Engineering rigor.** TypeScript + TypeBox validation + atomic writes + `proper-lockfile` + graceful-degrade schema versioning + 2,706 tests + eight hard CI gates. comet's older state machine is shell scripts (its own README called that approach "fragile").
- **Supply-chain and provenance layer.** JSONL audit log, provenance schema, path-traversal hardening, license-whitelist validation, and now a freshness gate that fails CI when an upstream record goes unverified for 90 days. Neither competitor emphasises this.
- **The audit habit itself.** The section above is evidence in both directions: those ten defects existed, *and* they were found, named, and eight of ten fixed within one audit. A project that can enumerate its own dead declarations in a table is in better shape than one that cannot.
- **Independent verification of the central bet.** Trellis's `refactor(configurators): describe each platform's file set once` moves it from per-platform imperative configurators toward describing each platform once — the same direction as harnessed's manifests, arriving from the project with the most platforms to maintain. It does not validate harnessed's manifest layer, which is still exercised on one harness.

## What to change here as a result

Ordered by expected value, not by effort. None of these are started.

1. **Build the gate that would have caught all ten.** A CI check asserting that every field in the manifest / workflow / judgment schemas has at least one non-schema consumer, with an explicit exemption table carrying a reason per entry — the shape `scripts/check-workflow-schema.mjs`'s K10 orphan-trigger gate already uses for judgment triggers. This is the direct structural answer to this snapshot's main finding, and it converts "we audit occasionally" into "it cannot rot silently". Needs design: proving "nobody reads this field" is not a grep.
2. **Decide each of the three newly-found dead fields.** `mutually_exclusive_with` should probably be *wired* (the need is real and currently met by hand-written code in doctor); `tested_with_versions` and `decision_rules` should probably be *deleted* — the Phase 55 precedent is that a declaration nobody can act on is worse than its absence.
3. **Run one A/B with `HARNESSED_OFF=1` and publish the number, whatever it says.** Trellis did this and reported a result that was narrow and partly unflattering on cost. Until harnessed does it, "the composition layer helps" is an assertion, and every architectural argument on this page rests on it.
4. **Pick one second platform and finish it.** Not for breadth-as-a-metric: because the manifest layer's whole claim is that it scales across harnesses, and it has only ever run on one. codex is the obvious candidate — the seam exists and one component now uses it.
5. **Do something about adoption, or stop treating it as a defect.** 1 fork after this much engineering is a positioning problem, not an engineering one. Either the README leads with a use case someone recognises, or this page should stop listing adoption as a lag and start describing harnessed as what it currently is: a single-maintainer harness with an unusually rigorous supply-chain layer.

## Bottom line

If you want a proven, widely-used harness today, Trellis (adoption) or comet (a mature spec lifecycle across many platforms) are the safer picks.

harnessed's bet is narrower and still unvalidated: **describe upstream composition declaratively, with a real supply-chain layer and engineering rigor, rather than bespoke imperative installers.** This snapshot adds the first honest accounting of that bet's cost — ten declarations that existed without evaluation, one of which had already been silently re-implemented by hand. The bet may still be right. What is now clear is that it does not pay for itself automatically: the declarative half is free, and the evaluation half has to be built and gated, or the declarations become fiction.
