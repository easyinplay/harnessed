# Binary size — controlled local measurement (2026-11-09)

Status: work stays **OPEN** (runtime-cost decision unmade). The `--minify`
flag is now implemented in `build-binary.mjs`, built and smoke-verified —
not published, not a source version bump. Sections below the
"Pinned-compiler comparison" heading are the current record; the initial
Bun 1.4.4 section is retained as the earlier (unpinned) measurement and any
"comparison still needed" wording there is superseded by the pinned data.

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

## Pinned-compiler comparison (Bun 1.3.14, frozen 2026-11-09)

Same lead-authored probe (`harnessed-size-probe-20261109.mts`, unmodified)
run with the official **Bun 1.3.14** windows-x64 build — the version
CI/release actually pins. Provenance: release tag `bun-v1.3.14`, asset
`bun-windows-x64.zip` id `418775198`, SHA256
`0a0620930b6675d7ba440e81f4e0e00d3cfbe096c4b140d3fff02205e9e18922` verified
against official `SHASUMS256.txt` (asset id `418956640`); no signature
verification performed. Frozen output:
`binary-size-2026-11-09.bun-1.3.14.measurements.json` (this dir); artifacts
`C:/Users/easyi/AppData/Local/Temp/harnessed-size-YJ9lyE`.

| Metric | Bun 1.4.4 (local) | Bun 1.3.14 (CI-pinned) |
|---|---|---|
| baseline | 115,271,680 | 98,480,216 |
| full | 120,578,560 | 104,089,088 |
| minified | 119,398,912 | 102,781,440 |
| full − baseline | 5,306,880 | 5,608,872 |
| minify savings | 1,179,648 (~1%) | 1,307,648 (~1.26%) |

Under the pinned compiler the payload-above-baseline (~5.6MB) and the
~1.3MB minify gain are both real but small; runtime still dominates.

## Follow-up plan (settled by lead, 2026-11-09)

- [x] Add ONLY `--minify` to `buildArgs` in `scripts/build-binary.mjs`
      (after `--compile`). No sourcemap/bytecode/trim/compiler pin change.
- [x] Build through the official script with the downloaded Bun 1.3.14 to a
      fresh temp outfile (frozen artifacts untouched).
- [x] Smoke: `node scripts/runtime-channel-smoke.mjs` against the new binary.
- [x] Review: biome + git diff --check + bin/ drift.

**TDD waiver (explicit)**: build-config tech-debt, not core logic — the
change is one flag on a compile invocation; verification is by compiled
binary behavior (smoke), not source-text assertions or unit tests.

*Artifact sizes measured by the config-validation build below are evidence of
the flag landing, NOT a second size derivation — they reflect the post-change
source tree and must not replace the frozen counts above.*

## Flag follow-through evidence (2026-11-09, frozen)

- Change: `'--minify'` added to `buildArgs` in `scripts/build-binary.mjs`
  (official docs: https://bun.sh/docs/bundler/executables recommends it;
  independent opinion agreed). No sourcemap/bytecode/trim/pin change.
- Build: official script + downloaded Bun 1.3.14 →
  `C:/Windows/Temp/harnessed-minify-check/harnessed.exe` (exit 0, ~98MB);
  generated `.sha256` matches artifact digest
  `1b1690dbc86f5555d0858417db53f2d80eb7f9a699ff7836518b0fddcbf46728`.
- Smoke (exact command):
  `node scripts/runtime-channel-smoke.mjs --node-cli D:/GitCode/harnessed/dist/cli.mjs --binary C:/Windows/Temp/harnessed-minify-check/harnessed.exe --bun C:/WINDOWS/TEMP/bun1314/bun-windows-x64/bun.exe --timeout-ms 30000`
  → exit 0, `ok: true`, all 3 runtime channels (node-npm, bun-compiled,
  bun-explicit) passed; log `/tmp/smoke2.json`.
- First smoke run failed on a path-CASE mismatch (`C:\WINDOWS\TEMP` arg vs
  canonical `C:/Windows/Temp` registration string compare) — a smoke-harness
  limitation, NOT a minify defect; resolved by passing the canonical path.
  It does not prove the binary is safe against arbitrary absolute-path
  invocation differences.
- Artifact sizes from this config-validation build are NOT a size
  re-derivation and do not replace the frozen counts above.
