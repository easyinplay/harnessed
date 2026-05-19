# Phase 5.2 W2 DOGFOOD — T2.X Empirical Verify

**Date**: 2026-05-19
**Wave**: 2 (R10.4 path-guard + ADR 0022 + ship cadence)
**Sister**: Phase 5.1 W2 DOGFOOD-T2.X.md format 100% reuse (3-axis pattern)

Verdict: **3/3 PASS**

---

## Axis A — R10.3 uninstall Karpathy ≤200L + TDD cells

### A.1 Line count verify

```
src/manifest/lib/path-guard.ts   36L  ✅ ≤200L
src/cli/uninstall.ts            118L  ✅ ≤200L
src/uninstallers/ccHookAdd.ts    72L  ✅ ≤200L
src/uninstallers/ccPluginMarketplace.ts 45L ✅ ≤200L
src/uninstallers/gitCloneWithSetup.ts   57L ✅ ≤200L
src/uninstallers/index.ts        30L  ✅ ≤200L
src/uninstallers/mcpHttpAdd.ts   28L  ✅ ≤200L
src/uninstallers/mcpStdioAdd.ts  28L  ✅ ≤200L
src/uninstallers/npmCli.ts       62L  ✅ ≤200L
src/uninstallers/npxSkillInstaller.ts   35L ✅ ≤200L
```

All 10 new/modified files ≤200L. Karpathy hard limit: **PASS**

### A.2 TDD cells verify

Wave 1: `tests/cli/uninstall.test.ts` 14 cells — all PASS (7-method dispatch + ephemeral + --yes + --apply)
Wave 2: `tests/manifest/lib/path-guard.test.ts` 9 cells — all PASS (5 attack vectors + D-08 + 3 safe paths)
Total new cells: **+23** (733 → 756 tests PASS; 0 regression)

### A.3 CLI smoke — dry-run default

```
node ./dist/cli.mjs uninstall ctx7
[dry-run] would uninstall 'ctx7' via method 'npm-cli'
  run with --apply to execute
exit 2 (dry-run sentinel)  ✅
```

Axis A verdict: **PASS**

---

## Axis B — R10.4 path-guard attack vector reject simulation

### B.1 5-vector reject via CLI (live)

```
node ./dist/cli.mjs install '../../etc/passwd'
→ PathTraversalError: path traversal attempt detected
  (D-08: generic message, no path echo)  ✅

node ./dist/cli.mjs uninstall '../../etc/passwd'
→ PathTraversalError: path traversal attempt detected  ✅
```

Both install and uninstall entry points reject traversal before manifest lookup.

### B.2 5 RegExp pattern matrix (unit test verify)

| Cell | Input | Expected | Result |
|------|-------|----------|--------|
| 1 | `../../etc/passwd` | PathTraversalError | ✅ PASS |
| 2 | `..\windows\system32` | PathTraversalError | ✅ PASS |
| 3 | `path\x00attack` | PathTraversalError | ✅ PASS |
| 4 | `%2e%2e%2fetc` | PathTraversalError | ✅ PASS |
| 5 | `%252e%252e%252f` | PathTraversalError | ✅ PASS |
| 6 | D-08: message NOT contain input | verified | ✅ PASS |
| 7 | `manifests/tools/ctx7.yaml` | no throw | ✅ PASS |
| 8 | `ctx7` | no throw | ✅ PASS |
| 9 | `my-tool_v2` | no throw | ✅ PASS |

### B.3 Safe path passthrough

```
node ./dist/cli.mjs install ctx7 --dry-run --non-interactive
→ [dry-run] ... (no PathTraversalError)  ✅
```

Axis B verdict: **PASS**

---

## Axis C — ADR 0022 + ci.yml A7 iter verify + CHANGELOG

### C.1 ADR 0022 integrity

```
docs/adr/0022-uninstall-and-path-traversal.md  184L ≤200L  ✅
git show adr-0022-accepted --no-patch | grep "tag adr-0022-accepted"  ✅
```

### C.2 ci.yml A7 iter 0021→0022

```
grep "0022" .github/workflows/ci.yml
→ for n in ... 0021 0022 (both loops)  ✅
→ ADR 0001-0022 main body 守恒  ✅

git diff HEAD~5 -- docs/adr/000{1..21}-*.md  (no diff on 0001-0021)  ✅
```

Zero diff on ADR 0001-0021 main body. A7 守恒 preserved.

### C.3 W0 sub-batch extract verify

```
grep "validateNonInteractiveFlags" src/cli/install.ts src/cli/install-base.ts
  src/cli/research.ts src/cli/manifest-add.ts src/cli/execute-task.ts
→ 5 import call sites  ✅ (src/cli/lib/validateFlags.ts extract)

src/uninstallers/lib/runOrPreview.ts  ~25L helper  ✅
```

### C.4 CHANGELOG entry

`CHANGELOG.md` `## [0.5.0-alpha.2] - 2026-05-19` section present ✅

Axis C verdict: **PASS**

---

## Summary

| Axis | Description | Verdict |
|------|-------------|---------|
| A | R10.3 uninstall Karpathy + TDD cells | ✅ PASS |
| B | R10.4 5-vector attack reject + D-08 safe message | ✅ PASS |
| C | ADR 0022 + ci.yml A7 iter + CHANGELOG | ✅ PASS |

**Overall: 3/3 PASS** — Phase 5.2 W2 empirical verify complete.
Tests: 733 (Phase 5.1) → 756 (Phase 5.2) PASS (+23 new cells, 0 regression).

*DOGFOOD date: 2026-05-19*
*Phase: phase-5.2*
*Wave: 2*
