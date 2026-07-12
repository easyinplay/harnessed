# Phase 10: gstack/mattpocock bump + 6 skills — Summary

**One-liner**: Bumped gstack manifest to current main HEAD (`1626d485…` / `1.52.1.0`), refreshed mattpocock `last_check`, and wired 6 new non-iOS gstack capabilities (`spec` / `skillify` / `pair-agent` / `scrape` / `benchmark-models` / `landing-report`) into capabilities.yaml Bucket 7 — additive-only, full green against the v5.1 baseline.

**Phase**: 10 (gstack-bump-skills)
**Status**: COMPLETE ✅ 2026-06-09
**Type**: additive config / version-bump (no design decisions; mechanical edits per pre-verified brief)

---

## What changed

### T1 — gstack manifest version bump
`manifests/skill-packs/gstack.yaml` (+ synced fixture `tests/fixtures/manifests/valid/gstack.yaml`):
- `install.git_ref`: `74895062fb8a3acbf9f66cd088a83359aaaa56cd` → `1626d4857bfe30da2690dd6a3217961934aa3192` (current garrytan/gstack main HEAD, gh-verified 2026-06-09)
- `upstream_health.last_known_good_version`: `main-269-commits` → `1.52.1.0`
- `upstream_health.last_check`: `"2026-05-11"` → `"2026-06-09"`
- `install.cmd` / homepage / repository UNCHANGED (gstack repo NOT renamed — only GSD was).

### T2 — mattpocock manifest refresh
`manifests/skill-packs/mattpocock-skills.yaml`:
- `upstream_health.last_check`: `"2026-05-11"` → `"2026-06-09"`
- `npm_version` (`^1.5.7`) left as-is — already satisfies installer latest 1.5.10; bump deemed optional/minor per brief, skipped for minimal diff.
- `last_known_good_version` (`main-76-commits`) left as-is — commit-based; precise current commit count not independently verifiable, so not fabricated per brief instruction.

### T3 — 6 new gstack capabilities (capabilities.yaml Bucket 7, additive)
Appended after `investigate-gstack` (last existing Bucket 7 entry), before Bucket 8 comment. All 6 mirror existing Bucket 7 shape exactly (`impl: gstack` / `install_type: user-skill` / `skill_dir: gstack` / `cmd: /<name>` / `since: v5.1` / `category: tool-slash-cmd` / `description` / `fires_when`):

| entry | cmd | fires_when predicate |
|-------|-----|----------------------|
| `spec` | `/spec` | `phase.stage == 'plan' AND phase.needs_spec_to_issues == true` |
| `skillify` | `/skillify` | `user.explicit_signal includes 'skillify'` |
| `pair-agent` | `/pair-agent` | `user.explicit_signal includes 'pair agent'` |
| `scrape` | `/scrape` | `user.explicit_signal includes 'scrape'` |
| `benchmark-models` | `/benchmark-models` | `user.explicit_signal includes 'benchmark models'` |
| `landing-report` | `/landing-report` | `phase.stage == 'verify' AND phase.needs_landing_report == true` |

All 6 `skill_dir` subdirs verified on disk at `~/.claude/skills/gstack/<name>/` before wiring (grep-over-assume per CLAUDE.md checklist). iOS skills intentionally NOT added.

---

## Green gate (all GREEN, no flakes)

| suite | result |
|-------|--------|
| `tests/unit/capability-resolver.test.ts` | 26 passed |
| `tests/unit/manifest-validate*` (16 files) | 122 passed |
| `tests/scripts/check-workflow-schema.test.ts` | 14 passed |
| `tests/integration/install-known-good.test.ts` + `install-aliases.test.ts` | 5 passed |

Biome: `.yaml` files are outside biome's processed set (TS/JS only) — "No files were processed" is expected, no TS/JS touched this phase.

---

## Deviations from Plan

**1. [minor] mattpocock `npm_version` left at `^1.5.7`** — brief marked the `^1.5.10` bump as optional ("your call, minor"); `^1.5.7` already satisfies 1.5.10. Chose minimal diff.

**2. [minor] mattpocock `last_known_good_version` left at `main-76-commits`** — brief explicitly instructed not to fabricate a commit count; current count not independently verified.

No other deviations — T1/T3 executed exactly as specified.

## Self-Check: PASSED
- `manifests/skill-packs/gstack.yaml` — git_ref/known-good/last_check updated ✓
- `tests/fixtures/manifests/valid/gstack.yaml` — synced ✓
- `manifests/skill-packs/mattpocock-skills.yaml` — last_check updated ✓
- `workflows/capabilities.yaml` — 6 entries appended to Bucket 7 ✓
- All green-gate suites pass (167 tests across 4 invocations) ✓
