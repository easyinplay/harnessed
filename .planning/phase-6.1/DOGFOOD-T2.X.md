# DOGFOOD-T2.X — Phase 6.1 Wave 2 Empirical Verify
# Sister: Phase 5.3 W2 DOGFOOD-T2.X.md 77L format 100% reuse adapted PRODUCTION RELEASE scope

**Date**: 2026-05-22
**Phase**: 6.1 Wave 2 (v1.0 GA production release)
**Axes**: A (npm publish infra + package.json) / B (v1.0 tag annotation + release docs) / C (README + CHANGELOG + ROADMAP coherence)
**Verdict**: PASS 3/3 axes

---

## Axis A — npm publish infra + package.json [PASS]

### File existence + LoC budget verify

| File | Lines | Sister Target | Karpathy ≤200L |
|------|-------|---------------|----------------|
| `.github/workflows/publish.yml` | 39L | ~50-70L | PASS (-80% margin) |
| `package.json` | 96L | ±5L delta | PASS |
| `docs/adr/0023-npm-publish-release-process.md` | 153L | ~150-180L (sister 0022 184L) | PASS (-17% under sister) |

### Sister format reuse verify

- publish.yml SHA-pinned actions ← ci.yml Phase 1.1.1 H1 pattern (checkout@34e114876b0b + setup-node@49933ea5288c)
- publish.yml corepack pnpm install + build ← ci.yml standard pattern
- publish.yml id-token: write + npm publish --provenance --access public ← RESEARCH § 2 LOCK
- package.json 3 surgical changes (private removal + 1.0.0 + author easyinplay) ← D-05 LOCKED
- ADR 0023 9-section ← ADR 0022 sister format 100% reuse

### Empirical run

- `npm pack --dry-run` → harnessed@1.0.0, tarball confirmed (Phase 6.1 W0 T0.3 rehearsal PASS)
- `npm view harnessed` → 404 unclaimed (pre-push state; name available for v1.0.0 first publish)
- publish.yml YAML parses clean (python3 yaml.safe_load verified)

### Verdict: Axis A PASS — npm publish infra ship-ready; ADR 0023 153L within sister 184L budget

---

## Axis B — v1.0 tag annotation + release docs [PASS]

### File existence + LoC budget verify

| File | Lines | Sister Target | Karpathy ≤200L |
|------|-------|---------------|----------------|
| `🎯 v1.0.0 tag annotation (PLAN.md § T2.10 draft)` | ~34L | D-04 25-40L | PASS |
| `CHANGELOG.md [1.0.0] entry` | ~30L additive | D-06 sister [0.5.0] format | PASS |
| `docs/MAINTAINER-ONBOARDING.md NOTE` | ~10L additive | D-08 ~5-10L target | PASS |

### Sister format reuse verify

- v1.0 tag annotation 5-section (intro + milestones + GA criteria + stats + forward) ← D-04 LOCKED structure
- CHANGELOG [1.0.0] Added/Changed/Note ← Keep-a-Changelog [0.5.0] format
- MAINTAINER-ONBOARDING NOTE forward visibility ← D-08 sneak-block (no "frozen"/"abandoned") enforced
- All sneak-blocks verified clean: `! grep -qE "(frozen|abandoned)" docs/MAINTAINER-ONBOARDING.md` ✅

### Verdict: Axis B PASS — release docs coherent + sneak-blocks enforced

---

## Axis C — README + CHANGELOG + ROADMAP coherence [PASS]

### Cross-document coherence check

- README L7 npm badge URL → `img.shields.io/npm/v/harnessed` ✅ (pre-launch badge removed)
- README Status "v1.0 GA SHIPPED 2026-05-22" → matches CHANGELOG [1.0.0] - 2026-05-22 → matches ROADMAP v1.0 SHIPPED 2026-05-22 ✅
- ADR 0020 ref in 3 docs (README Status, CHANGELOG Note, MAINTAINER-ONBOARDING NOTE) — all consistent ✅
- 23 ADRs count in CHANGELOG + ROADMAP milestone header — consistent post ADR 0023 add ✅

### Empirical verify

- `grep "v1.0 GA SHIPPED 2026-05-22" README.md` → 1 match ✅
- `grep "\[1.0.0\] - 2026-05-22" CHANGELOG.md` → 1 match ✅
- `grep "v1.0 MILESTONE 1/1 SHIPPED" .planning/ROADMAP.md` → 1 match ✅
- `grep "ADR 0001-0023" .planning/ROADMAP.md` (ci.yml A7 iter verify) → 1 match ✅
- `! grep -qE "(frozen|abandoned)" README.md CHANGELOG.md .planning/ROADMAP.md docs/MAINTAINER-ONBOARDING.md` → all clean ✅

### Verdict: Axis C PASS — cross-document coherence verified

---

## Summary

| Axis | Metric | Result |
|------|--------|--------|
| A | npm publish infra + package.json + ADR 0023 153L | PASS |
| B | v1.0 tag annotation + release docs + sneak-blocks | PASS |
| C | README + CHANGELOG + ROADMAP coherence | PASS |

**Overall verdict**: PASS 3/3 — Phase 6.1 Wave 2 ship-ready; pending T2.9 STATE FINAL update + T2.10 3 tags LOCAL CREATE + user push approval.
