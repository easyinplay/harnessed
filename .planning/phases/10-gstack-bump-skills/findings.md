# Phase 10 — findings

> Reconstructed retroactively 2026-06-10. Discoveries/decisions not in task_plan/SUMMARY.

## Decisions

- **gstack repo NOT renamed** — only GSD was (`get-shit-done-cc` → `@opengsd/gsd-core`).
  gstack stays `garrytan/gstack`; the bump is version drift only (git_ref + last_known_good),
  install.cmd/homepage/repo untouched.
- **gstack still pins by commit SHA, not tag** — `garrytan/gstack` has NO git tags / NO
  releases (verified via gh: tags empty, releases 404). The "1.52.1.0" is an internal VERSION
  file, not a git tag. So the bump = new commit SHA pin + last_known_good label `1.52.1.0`.
- **mattpocock last_known_good left commit-based** — `skills@1.5.10` is the *installer* version,
  not mattpocock's own. No precise current mattpocock/skills commit count available → did NOT
  fabricate a number; only refreshed last_check (grep-over-assume / honesty).
- **iOS suite skipped** — per scope decision; 6 non-iOS gstack skills only.

## Landmines avoided

- **install-known-good is version-sensitive** — it reads the gstack git_ref / known-good lock.
  Ran it explicitly in the green gate (167 passed) to confirm the bump didn't break the
  reproducible-install lock. (It didn't.)
- **Windows cold-spawn 5000ms timeouts are FLAKES** — the version-sensitive integration tests
  time out under full-suite load on Windows; re-run isolated with `--testTimeout=60000` to
  confirm green (not a real failure). Confirmed this repo's recurring flake pattern.

## Process

- Phase 10 collapsed plan+execute (single gsd-executor with full inline spec) because the
  scope was 2 field bumps + 6 entries with pre-verified exact values — no design decisions to
  plan. Transparent deviation from the per-phase gsd-planner step, justified by triviality.
