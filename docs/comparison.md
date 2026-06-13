# harnessed vs comet vs Trellis — an honest comparison

> Snapshot date: **2026-06-13**. Numbers move; treat them as a point-in-time reading, not a leaderboard.
> Written by the harnessed maintainer. We try hard not to flatter ourselves here — where harnessed is behind, this says so.

[comet](https://github.com/rpamis/comet) and [Trellis](https://github.com/mindfold-ai/Trellis) are the two AI-coding-harness projects closest in spirit to harnessed. This page compares the three honestly: the headline metrics, what each does well, and where harnessed genuinely lags.

## The metrics (and why one of them is noise)

| | npm downloads / month | GitHub stars | downloads ÷ stars |
|---|---|---|---|
| **harnessed** | 8,627 | **2** | 4,313 : 1 |
| **comet** | 6,810 | 1,207 | 5.6 : 1 |
| **Trellis** | 13,247 | 10,221 | 1.3 : 1 |

*(npm `api.npmjs.org`, 2026-05-13 → 06-11; GitHub stars via API, 2026-06-13.)*

**Read the third column before the first.** harnessed's download/star ratio is three orders of magnitude out of line with comet and Trellis. A package with 8,627 monthly downloads and **2 stars** does not have 8,627 human users — those downloads are overwhelmingly CI runs, the maintainer's own `npx harnessed@latest` dogfooding, and registry/mirror bots (60 versions were published in about a month). **harnessed's real organic adoption is ~0.** comet and Trellis, by contrast, have download/star ratios consistent with genuine human uptake.

So: comet and Trellis have shipped and found users. harnessed has shipped a lot of *engineering* and almost no *adoption*. That gap is the honest backdrop for everything below.

## What each project is

- **comet** ([@rpamis/comet](https://www.npmjs.com/package/@rpamis/comet), MIT) — chains OpenSpec (the WHAT) and Superpowers (the HOW) into a 5-phase idea→archive pipeline. It installs both upstreams from their official channels (OpenSpec via `npm i -g @fission-ai/openspec`, Superpowers via `npx skills add obra/superpowers`) — it does **not** vendor their source — using an imperative, per-component TypeScript installer, and drives them with a shell-script state machine (`.comet.yaml` + guard scripts). Strong at: a resumable spec lifecycle, cross-platform distribution (14 platforms), semantic code indexing (CodeGraph), and measured context compression.

- **Trellis** ([@mindfoldhq/trellis](https://www.npmjs.com/package/@mindfoldhq/trellis), AGPL-3.0) — a self-contained engineering framework that persists specs/tasks/memory **into your repo** (`.trellis/`). Its moat: per-session auto-injection of relevant specs, and an `update-spec` loop that promotes learnings back so the next session starts smarter. 14 platforms, the strongest adoption of the three.

- **harnessed** (Apache-2.0) — also installs upstreams from their official channels (no vendoring), but describes each one **declaratively** in a YAML manifest (install method + verify + uninstall + license + provenance + health), rather than in bespoke installer code. A generic engine consumes the manifests, and an imperative installer backend handles the irregular cases. It orchestrates ECC / Superpowers / GSD / gstack and others through these manifests + composition skills, machine-executing a three-layer-stack methodology. Highest engineering investment of the three; lowest adoption.

## Where harnessed genuinely lags

- **Adoption.** ~0 organic users vs comet's ~1.2k stars and Trellis's ~10k. Architecture decisions here are made without real user feedback to falsify them.
- **Cross-session learning was a gap.** Trellis's promote-learnings-back loop is its headline. harnessed only added an equivalent (capture + relevance-filtered injection) in the v7.0 milestone (2026-06) — it is newer and less battle-tested.
- **Per-turn spec injection is best-effort.** harnessed injects relevant learnings every turn, but its phase-CONTEXT excerpt rarely fires in practice (the workflow's `phase` field usually carries no phase number to match a phase dir). Trellis's spec injection is more mature.
- **Cross-platform breadth.** Trellis targets 14 platforms; comet targets several. harnessed reserves a multi-harness abstraction but only implements Claude Code.
- **Planning-doc bloat (now treated).** harnessed's own planning docs had metastasized (a ~4,000-word status blockquote, 23 ADRs, 11 README translations). The v7.0 milestone's first phase cut that back, but it was a real self-inflicted smell.

## Where harnessed is genuinely good (not forced)

- **Declarative composition + a supply-chain layer.** None of the three vendor upstream source (an earlier draft of this page wrongly said comet does — corrected). The real difference: comet installs each upstream with bespoke, per-component imperative code; harnessed describes each upstream in a uniform YAML manifest carrying a license whitelist, provenance, an audit trail, and health metadata — a supply-chain/governance layer comet's installers don't have — over an imperative installer backend for the irregular cases. Trellis is a self-contained monolith. harnessed's bet: the declarative-manifest-plus-provenance layer scales composition better as the component count grows. (Caveat: this is cleaner *in principle* but under-validated — comet has actually shipped imperative installers across 14 platforms, while harnessed's manifests have only been exercised on Claude Code and have already had to cram multi-step installs into a single command string.)
- **Engineering rigor.** TypeScript + TypeBox schema validation + atomic writes + `proper-lockfile` + graceful-degrade schema versioning + ~1,290 tests. comet's state machine is shell scripts (its own README calls the old approach "fragile"). Same job, an order of magnitude more crash-resistance.
- **Audit + provenance + supply-chain hygiene.** A JSONL audit log, a provenance schema, path-traversal hardening, license-whitelist manifest validation. For a tool that installs many heterogeneous upstream components, this matters — and neither competitor emphasizes it.

## Bottom line

If you want a proven, widely-used harness today, Trellis (adoption) or comet (a mature spec lifecycle across 14 platforms) are the safer picks. harnessed's bet is narrower and not yet validated: **describe upstream composition declaratively, with a real supply-chain/provenance layer, engineering rigor, and a cross-session learning loop — rather than bespoke imperative installers.** Whether that bet pays off depends on adoption it does not yet have. This page will be updated as that changes (or doesn't).
