# Phase 19 CONTEXT — minimal adoption (G)

> Locked from v7.0 milestone discuss (2026-06-13, AskUserQuestion: minimal adoption — README quickstart + 1 honest comparison post). Docs/markdown only — zero code, zero tests. LAST phase of v7.0. Main session. Low gray-area: placement + scope are author decisions.

## Goal

Make the project legible to a first real user (2 GitHub stars today) and publish one honest positioning artifact, reusing the 2026-06-13 comparison analysis — no vanity-metric spin.

## Current state (verified)

- README.md (492 lines) already has a thorough "🚀 Quick Start — 3 Options" (Auto / Stage / Surgical) + a mermaid 4-stage flow. So "quickstart polish" is a LIGHT touch — the path exists and is detailed.
- `docs/` has `benchmarks/` (v0.4.md) but NO competitive comparison doc.
- The honest comparison data already exists from the 2026-06-13 session analysis: monthly npm downloads (harnessed 8627 / comet 6810 / Trellis 13247), GitHub stars (2 / 1207 / 10221), the download÷star ratio insight (harnessed's downloads are CI/dogfood noise, not organic adoption), the no-vendor composition thesis, engineering rigor (typed + tested + audited), and the honest gaps.

## Locked decisions

- **D1 — comparison post = `docs/comparison.md`** (NEW): a factual harnessed-vs-comet-vs-Trellis comparison reusing the 2026-06-13 analysis. MUST be honest: downloads-are-noise caveat, 2-stars reality, no over-claiming. Three-way positioning + what each does well + harnessed's real strengths (no-vendor, engineering rigor, audit/provenance) AND real gaps.
- **D2 — README polish = minimal**: add a short "How it compares" pointer to `docs/comparison.md` near the top (or in an existing section); verify the install→first-command path is crisp. Do NOT rewrite the existing Quick Start. English README.md only (non-English translations are best-effort per Phase 13 — not hand-synced here).
- **D3 — accuracy over spin**: every number cited carries its 2026-06-13 snapshot date; the downloads≠adoption caveat is stated plainly; no inflated claims.
- **D4 — docs-only**: zero `src/`/`tests/` change; no TDD (pure markdown). Verification = doc-discipline + factual accuracy + working links + biome N/A.

## Scope

- `docs/comparison.md` (NEW) — the honest 3-way comparison.
- `README.md` — add a one-line "How it compares" link to `docs/comparison.md`; light path check.
- `.planning/` — STATE/ROADMAP done-marks (at commit).

## Out of scope

- Rewriting the Quick Start / mermaid flow (already good).
- Non-English README translations (best-effort per Phase 13).
- Landing page / docs site / dogfood-user recruitment (the rejected fuller go-to-market option).
- Any code/tests.

## Acceptance

1. `docs/comparison.md` exists: 3-way positioning, each tool's strengths, harnessed's real strengths + gaps, with the downloads-are-noise + 2-stars caveats and 2026-06-13 snapshot dates.
2. README has a working link to `docs/comparison.md`; install→first-command path verified crisp.
3. Factually accurate (no over-claim); links resolve.
4. docs-only diff (zero src/tests); full test gate unaffected (still green).
