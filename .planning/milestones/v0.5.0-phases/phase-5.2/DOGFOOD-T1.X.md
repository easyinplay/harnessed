# DOGFOOD-T1.X — Phase 5.2 Wave 1 Empirical Verify
# Sister: Phase 5.1 DOGFOOD-T1.X.md format 100% reuse adapted W1 scope

**Date**: 2026-05-19
**Phase**: 5.2 Wave 1
**Axes**: A (Karpathy LoC + TDD PASS) / B (PREREQ CC CLI syntax) / C (ephemeral detect smoke)
**Verdict**: PASS 3/3 axes

---

## Axis A — Karpathy ≤200L + TDD ≥10 cells PASS

### File line counts (`wc -l src/uninstallers/*.ts src/cli/uninstall.ts`)

| File | Lines | Karpathy ≤200L |
|------|-------|----------------|
| src/cli/uninstall.ts | 115 | PASS |
| src/uninstallers/npmCli.ts | 62 | PASS |
| src/uninstallers/mcpStdioAdd.ts | 28 | PASS |
| src/uninstallers/mcpHttpAdd.ts | 28 | PASS |
| src/uninstallers/ccPluginMarketplace.ts | 45 | PASS |
| src/uninstallers/gitCloneWithSetup.ts | 57 | PASS |
| src/uninstallers/npxSkillInstaller.ts | 35 | PASS |
| src/uninstallers/ccHookAdd.ts | 72 | PASS (≤40L estimate advisory; ccHook IS most complex per plan) |
| src/uninstallers/index.ts | 30 | PASS |
| src/uninstallers/lib/types.ts | 26 | PASS |

All 9 uninstaller files + cli/uninstall.ts ≤200L Karpathy PASS. ccHookAdd 72L (advisory said ≤40L; acceptable — JSON deep-merge + idempotent path handling justified).

### TDD 14 cells PASS

```
Tests  747 passed | 4 skipped (751)   [was 733; +14 new cells]
```

tests/cli/uninstall.test.ts: 14/14 cells PASS, 599L, 0 regression.

Cell coverage: H1 gate / manifest-not-found / dry-run default / ephemeral D-02 warn / git-clone fs.rm / npx-skill fs.rm / mcp-stdio runArgs / mcp-http runArgs / cc-plugin runArgs / --yes skip confirm / spawn error / cc-hook inverse merge / interactive decline / cross-OS rm options.

---

## Axis B — PREREQ CC CLI syntax verify (T1.0 BDL resolved)

**Source**: `.planning/phase-5.2/T1.0-CC-CLI-BDL.md` commit f86b8c6

```
$ claude mcp remove --help
Usage: claude mcp remove [options] <name>
EXIT:0  ← A1 RESOLVED

$ claude plugin uninstall --help
Usage: claude plugin uninstall|remove [options] <plugin>
EXIT:0  ← A2 RESOLVED
```

A1 delta: `--scope` flag NOT required for `mcp remove` (transport-agnostic; removes from any scope). T1.2 impl uses `['mcp', 'remove', name]` (no scope) — CORRECT per BDL.

A2 match: `claude plugin uninstall <plugin>@<marketplace>` confirmed. T1.2 impl uses `['plugin', 'uninstall', pluginAtMkt]` — CORRECT per BDL.

---

## Axis C — Ephemeral detect smoke + real CLI invocation

### Real CLI invocations verified:

**Axis A smoke**: `harnessed uninstall ctx7 --dry-run`
```
[dry-run] would uninstall 'ctx7' via method 'npm-cli'
  run with --apply to execute
EXIT:2
```
PASS: dry-run default shows preview + exit 2.

**Axis B clean degradation**: `harnessed uninstall nonexistent`
```
error: manifest 'nonexistent' not found
  fix:  ensure manifests/tools/nonexistent.yaml or ... exists
EXIT:1
```
PASS: clean error message + exit 1.

**Axis C ephemeral detect**: No real npm-cli manifest with `npx --yes` cmd exists in repo (correct — real ephemeral use npx method not npm-cli). D-02 ephemeral detection verified via TDD cell 4: `npx --yes ctx7 --version` cmd → exit 0 + `ephemeral install: nothing to uninstall` warn message.

---

## Summary

| Axis | Metric | Result |
|------|--------|--------|
| A | 9 files ≤200L Karpathy + 14 TDD cells PASS | PASS |
| B | claude mcp remove + claude plugin uninstall syntax verified | PASS |
| C | dry-run smoke + clean degradation + ephemeral unit test D-02 | PASS |

**Wave 1 verdict: PASS — ready for Wave 2 (R10.4 path-guard + ADR 0022 + ship cadence)**
