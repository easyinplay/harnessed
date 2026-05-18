# Phase 4.2 Sister Review Findings — Redirect

**Date**: 2026-05-18 (post Phase 4.2 ship + 5996ea1 sister H1+H2 inline absorb)
**Purpose**: Standalone redirect doc for sister reviewer expecting findings at conventional path. Full 9-item M+L tier carry-forward + 2-item H absorb details live in `deferred-items.md` to avoid duplication SoT drift.

---

## Full findings location

**See [`.planning/phase-4.2/deferred-items.md`](./deferred-items.md) L40-72** for:

- **H1 version sync drift** (3-source: src/index.ts + src/cli.ts + package.json) — ✅ FIXED commit 5996ea1
- **H2 audit N+1 file read** (src/cli/audit.ts L116-121) — ✅ FIXED commit 5996ea1
- **#BF~#BN (9 M+L tier items)** — carry-forward Phase 4.3 W0 backlog:
  - #BF runArgs 3-installer dup → extract `lib/runClaudeArgs.ts` (MED)
  - #BG err() 8-file dup → extract `lib/err.ts` (MED)
  - #BH H1 gate dup → extract `lib/validateFlags.ts` (LOW, verify scope first)
  - #BI dry-run pattern abstract (LOW, verify scope first)
  - #BJ process.exit + unreachable return cleanup (LOW cosmetic)
  - #BK writeFileSync try-catch (LOW rare scenario)
  - #BL `as unknown as` double cast adapter (DEFER known gap)
  - #BM semantic router v0.1 stub — NOT absorb (ADR 0009 errata F40-2 forward-compat intentional)
  - #BN 中英混写 — NOT absorb (project by-design bilingual; R8.2 trigger condition)

## Sister review WRONG paths/claims (transparency)

- M7 "void isMap at src/cli/security.ts:160" — actual path `src/manifest/security.ts:160` (cli/security.ts doesn't exist); pattern is intentional `void <import>` suppress-unused idiom — keep as-is.
- M3 "2 alpha tags pending push" — both `v0.4.0-alpha.1-benchmark` + `v0.4.0-alpha.2-community` ARE already on origin (verified `git ls-remote origin refs/tags/`); reviewer claim is stale.

## Sister review post-fix-cycle (2nd review 2026-05-18)

Second sister review surfaced 2 H + 3 M + 4 T (post-5996ea1 fix verify cycle):

- **H1 (this review)**: 5996ea1 commit msg 黑箱 → reviewer didn't know deferred-items.md L40-72 SoT existed → fix this doc serves as redirect
- **H2 (this review)**: D1 round 2 target ≤150L math unreachable (156L baseline + 10L Phase 4.3 ship narrative = 166L always) → user relaxed target to ≤175L per Option AA decision; D2 cadence trim still applied; #BA disposition updated below

See `deferred-items.md` for full 2nd-cycle absorb (post-5996ea1 #BO~#BS Phase 4.3 W0 carry).
