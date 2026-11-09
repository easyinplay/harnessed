# Binary size — controlled local measurement (2026-11-09)

Status: evidence recorded, work stays **OPEN**. No compiler switch or
build-flag change is authorized by these data.

## Method (lead-authored, executed once — do not rerun)

Temp script `C:/WINDOWS/TEMP/harnessed-size-probe-20261109.mts` (outside repo,
retained by lead): same local **Bun 1.4.4** win32 x64, a minimal
`console.log` baseline binary, the current official `build-binary.mjs`, and
the same source compiled with `--minify`. Frozen output copied verbatim to
`binary-size-2026-11-09.measurements.json` (same dir as this doc); artifacts
retained under `C:/Users/easyi/AppData/Local/Temp/harnessed-size-rdUqza` —
do not execute or delete.

## Data (exact, frozen)

| Metric | Bytes |
|---|---|
| Assets: 183 files, logical size | 1,662,458 |
| Assets serialized as base64 JSON | 2,224,355 |
| Minimal baseline binary | 115,271,680 |
| Full current build | 120,578,560 |
| Same source `--minify` | 119,398,912 |
| Installed released 5.0.15 exe | 104,075,776 |

Lead-derived differences: full − baseline = **5,306,880 B**;
minify savings = **1,179,648 B (~1%, approximation)**.

## Interpretation limits (important)

- **CI/release pins Bun 1.3.14** (`.github/workflows/ci.yml` + `publish.yml`,
  verified) — the local compiler differs, so these numbers do **not** predict
  release-binary savings and cannot separate every runtime byte.
- The minimal baseline only establishes runtime dominance **for this
  controlled local build**.
- The previous TODO claim — "assets ~2MB proves only ~2% possible; all
  remaining ~97MB is runtime" — was **overconfident and is corrected here**:
  raw/unpacked asset size ≠ embedded contribution (base64 overhead exists:
  1.66MB logical → 2.22MB serialized), and bundled JS cannot be isolated by
  subtracting the asset directory from the binary.
- Honest read: on this local toolchain the payload above baseline is ~5.3MB
  and minify trims ~1%; whether the same holds under pinned Bun 1.3.14 is
  unmeasured — that comparison is still needed before any build-flag or
  runtime change is considered.
