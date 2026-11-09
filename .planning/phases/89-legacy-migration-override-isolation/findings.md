# Phase 89 — findings

## Confirmed defect (lead-reviewed repro evidence)

- Both hosts, native-absent: `--version` under `HARNESSED_ROOT_OVERRIDE` moved
  `<home>/.harnessed` → `<home>/.claude/harnessed` (claude) /
  `.codex/harnessed` (codex). Evidence: `repro-root-override-20261109.results.json`
  + fixtures `repro-root-override-{FolCM4,GvxvIx,qdiipo,49f5jt}` in temp.
- Both hosts, native-present (corrected fixture): `.harnessed` →
  `.harnessed.legacy-bak`, native `<host>/harnessed/keep` byte+mtime unchanged.
  Evidence: `repro-root-override-20261109.native-present.results.json` +
  fixtures `repro-root-override-native-{Lzr7Fi,jSIgcj}`.

## Fixture-bug note (superseded claims)

First repro's "native-present" cases placed the native root at
`<home>/harnessed` instead of `<home>/<host-conf>/harnessed` — a fixture bug;
those two rows must not be cited as native-present coverage. The corrected
native-present run above supersedes them. First run's native-ABSENT rows
remain valid.

## Decisions

- Fix = early `return` on nonempty `HARNESSED_ROOT_OVERRIDE` inside
  `migrateLegacyHarnessedRoot` (lead + independent second opinion agree).
  Whitespace-only overrides also skip (nonempty check only, no trim —
  consistent with `detectPlatform` precedence semantics).
- Comparator analogy only: pip documents `PIP_CONFIG_FILE` to suppress
  ambient user config
  (https://github.com/pypa/pip/blob/main/docs/html/topics/configuration.md) —
  not the same mechanism, directionally supports "override ⇒ no ambient
  mutation".
- Scope: only automatic legacy migration is in scope; other ambient writes
  are NOT audited, so no claim that the whole CLI is read-only under override.

## Test-isolation notes

- Unit tests stub env via `vi.stubEnv` + `vi.unstubAllEnvs()` in `afterEach`.
- Process test spawns the BUILT `dist/cli.mjs` in a fresh fake home per cell.

## Lead audit inputs (persisted as facts — not re-derived)

- `gh issue list --state open` → `[]` (zero open issues).
- GSD audit-uat query returned **68 historical deferred entries** — NOT 68
  confirmed open bugs: some quoted entries are RESOLVED, and the tool does
  not recognize recent unstructured SUMMARY handovers. No "999 phases".
- Phase 67 real dual-session handoff remains **human-unverified**; the CLI
  process test does not and cannot prove that path.
- Root F6 old hardcoding was superseded by host-context routing since
  Phase 69 — the Phase 89 defect was override-isolation only.
- No new product milestone is implied by any of the above.
