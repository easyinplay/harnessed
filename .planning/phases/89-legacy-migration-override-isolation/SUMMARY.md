# Phase 89 — SUMMARY: root-override legacy-migration isolation

## Implemented and locally verified — not published

**Problem.** `migrateLegacyHarnessedRoot()` ran at every CLI startup using a
host context that deliberately ignores `HARNESSED_ROOT_OVERRIDE`. Any
invocation under an isolated root — including `--version` — could move
`~/.harnessed` into the real native home (`<home>/.claude|codex/harnessed`)
or rename it to `.harnessed.legacy-bak`, violating test isolation and risking
real-home mutation. Repro-proven on the built CLI for both hosts in both
native-absent and native-present shapes.

**Fix.** One guard at the top of `migrateLegacyHarnessedRoot`: return early
when `HARNESSED_ROOT_OVERRIDE` is set and nonempty (no trim — consistent
with `detectPlatform` semantics). Unset/empty values keep prior behavior.
No API, descriptor, or cli.ts changes; EXDEV/race behavior untouched.

**Verification.** Red→green unit TDD, 4-cell host×native matrix +
whitespace/unset/empty cases (12/12), real-process integration test
(4 cells vs built `dist/cli.mjs --version`, byte+mtime assertions), build,
tsc, biome, diffcheck, bin drift all green. Full suite + script battery run
once at closeout — see VERIFICATION.md.

**Honest scope.** Only automatic legacy migration is covered; other ambient
writes are unaudited — no claim that the CLI is read-only under override.
