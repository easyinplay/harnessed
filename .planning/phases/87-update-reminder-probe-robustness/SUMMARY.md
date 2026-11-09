# Phase 87 — Update-reminder probe robustness — SUMMARY

Shipped as **v5.0.14** (2026-11-09).

## What shipped

- The update reminder's version check no longer collapses a failed probe
  into silence. Previously the binary channel asked the GitHub releases API
  and nothing else, so a timeout / rate limit / blocked host turned "a newer
  version exists" into "unknown" and the reminder printed nothing for the
  next 24 h.
- The probe now asks GitHub first (authoritative for the downloadable
  assets) and falls back to the npm registry over plain HTTP; it reports
  the reason it failed, keeps the last successful observation as last-known
  instead of erasing the cache, and retries within the hour after a failure.
- Same release: the README set dropped the duplicate `README-en.md` mirror
  (ten real locales pinned; the install section documents the binary channel
  only).

## Evidence

- Commit `79dcfd6`; release `v5.0.14` — CI `42504437277` success, publish
  run `42503917114` success (4 jobs), 9 assets, npm `latest` = 5.0.14.
