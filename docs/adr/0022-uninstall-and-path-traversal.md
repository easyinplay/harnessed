# ADR 0022: Phase 5.2 — R10.3 harnessed uninstall CLI (7-method dispatch) + R10.4 path traversal 5-vector regex hardening

## Status

**Accepted (phase 5.2 W1/W2 — 2026-05-19)** — phase 5.2 plan-phase PLAN.md 1577L 23 tasks 3 waves
ready → Wave 0 backlog #BH+#BI absorb + D2 cadence iter 6 REINFORCE → Wave 1 R10.3
NEW src/cli/uninstall.ts 115L + 7 src/uninstallers/*.ts + 14 TDD cells + 14th subcommand register →
Wave 2 R10.4 src/manifest/lib/path-guard.ts + 4-site D-04 + ADR 0022 + ci.yml A7
iter 0021→0022 + dual tag → Accepted at phase 5.2 ship.

> Phase 5.2 是 v0.5.0 milestone **第 2 phase (2/3)**, 把 v0.5.0 装配为 **R10.3 `harnessed uninstall`
> CLI 14th subcommand (7 per-method inverse uninstallers symmetric installers/ pattern延袭 +
> D-02 ephemeral no-op + D-05 --dry-run default + D-06 --yes bypass) + R10.4 path traversal
> 5-vector OWASP A1 regex hardening (src/manifest/lib/path-guard.ts NEW + PathTraversalError
> D-08 + checkPathSafe 4-site D-04 integration) + ADR 0022 PRIMARY anchor + ci.yml A7 iter
> 0021→0022 + dual tag sister v0.5.0-alpha.1 close cadence延袭 (adr-0022-accepted +
> v0.5.0-alpha.2-uninstall-security)**. 8 D-decisions + M-01 ARCHITECTURAL phase class lock —
> 沿袭 ADR 0021 多决策合并 errata 模式.

## Context

R10.3 spec verbatim: `harnessed uninstall <name>` CLI subcommand — users can install tools via
`harnessed install` but had no inverse. #BV carry-forward Phase 4.2 sister 3rd-cycle: asymmetric
CLI gap. Phase 5.2 delivers 14th subcommand + 7 per-method uninstallers (functional inverse of
existing 7 installers: npmCli→npm uninstall; mcpStdioAdd/mcpHttpAdd→claude mcp remove;
ccPluginMarketplace→claude plugin uninstall; gitCloneWithSetup/npxSkillInstaller→fs.rm recursive;
ccHookAdd→reverse JSON deep-merge ~/.claude/settings.json hooks block).

R10.4 spec verbatim: path traversal regex hardening #AH carry-forward Phase 3.4. Two
user-controlled path input sites (resolveAlias + manifest path resolve) lacked attack vector
screening. Phase 5.2 delivers NEW src/manifest/lib/path-guard.ts with 5 OWASP A1 vectors
pre-compiled at module load + PathTraversalError D-08 generic message.

Phase 5.2 = ARCHITECTURAL decision phase per M-01 LOCK (R10.3 NEW src/cli/uninstall.ts +
7 NEW src/uninstallers/*.ts + R10.4 NEW src/manifest/lib/path-guard.ts). Full ship cadence applies.

### A7 守恒约束 (ADR 0001-0021 main body 不可改)

Phase 5.2 沿袭 ADR 0021 errata 风格 — **不动 ADR 0001-0021 main body** (A7 守恒). baseline tag
iterate 0021 → 0022 (Wave 2 ship 时 LOCAL CREATE `adr-0022-accepted` tag; ci.yml A7 step iter
`0021` → `0022` single extend NOT retroactive — Phase 5.1 W2 T2.8 已 retroactive fix 0019+0020+0021).
本 ADR 0022 起 phase 5.2 ship 时刻 frozen; v0.6.0+ 演化走 ADR 0023+ errata.

## Decisions

### 1. D-01 DispatchArch — per-method 7 NEW src/uninstallers/*.ts (HIGH, deliberate)

7 NEW symmetric inverse files: npmCli / mcpStdioAdd / mcpHttpAdd / ccPluginMarketplace /
gitCloneWithSetup / npxSkillInstaller / ccHookAdd. Each ≤72L (Karpathy ≤200L; sister installers
25-50L precedent). Dispatch table src/uninstallers/index.ts symmetric src/installers/index.ts.
Sneak-blocks: NO single switch 7-case (asymmetric + ~150L) + NO reverse-by-install ledger
(over-engineering) + NO Hybrid architecture (2 architectures simultaneously).

### 2. D-02 EphemeralSemantic — no-op + warn exit 0 (HIGH, deliberate)

Detection: `spec.install.cmd` includes `npx --yes` or `npx -y` → ephemeral classification.
Behavior: exit 0 + warn message (NOT error). npxSkillInstaller NOT ephemeral (writes persistent
~/.claude/skills/<name>/ files). Sneak-blocks: NO exit 1 (UX weak) + NO silent skip.

### 3. D-03 AttackVectorScope — 5 vector minimal MVP OWASP A1 (HIGH CSO, deliberate)

Pre-compiled module-level RegExp array in src/manifest/lib/path-guard.ts:
1. `/\.\.\//` Unix dot-dot-slash: `../../etc/passwd`
2. `/\.\.\\/` Windows backslash: `..\windows\system32`
3. `/\x00/` Null byte injection: `path\x00attack`
4. `/%2[eE]%2[eE]/` URL-encoded dot-dot: `%2e%2e%2fetc`
5. `/%25[2][eE]%25[2][eE]/` Double-encoded: `%252e%252e%252f`
Sneak-blocks: NO 10+ vectors (YAGNI; v0.6+ if real attack signal) + NO regex+resolve double-defense.

### 4. D-04 HardeningScope — resolveAlias + manifest path 2 sites minimal (HIGH, deliberate)

2 user-controlled input sites: (1) src/manifest/aliases.ts resolveAlias() — user name before
yaml lookup; (2) src/cli/install.ts + src/cli/uninstall.ts — resolvedName after alias resolution
(defense-in-depth for alias redirect value). src/cli/audit-log.ts SKIP: AUDIT_PATH hardcoded
`.harnessed/audit.log` NOT user-controlled (no attack surface per D-04 sneak-block).

### 5. D-05 DryRunFlag — --dry-run default ON per ADR 0004 contract 1 (MED, batch)

`harnessed uninstall <name>` defaults dry-run preview; `--apply` explicit. Sister install.ts
ADR 0004 contract 1延袭. Sneak-blocks: NO apply-default (destructive op UX anti-pattern).

### 6. D-06 ConfirmPrompt — --yes bypass interactive y/N (MED, batch)

Interactive `y/N` default No + `--yes` flag skip prompt (CI/scripts). H1 gate: `--yes` without
`--apply` → exit 2 + actionable error. Sister install --non-interactive --apply double-flag延袭
(--yes used for destructive op UX familiarity; inconsistency documented intentionally).

### 7. D-07 BackupOption — NO --keep-backup flag (LOW, batch)

Single responsibility: `harnessed backup create` is the independent backup workflow. Uninstall
does NOT provide --keep-backup. Sneak-blocks: NO --keep-backup (scope creep).

### 8. D-08 ErrorMessageSafety — generic PathTraversalError NOT leak attempted path (LOW CSO, batch)

PathTraversalError.message = `'path traversal attempt detected'` — generic, NOT echo user input.
Prevents attack reconnaissance via error message channel. Audit trail via Phase 4.3 audit.log
producer (security_violation category deferred Phase 5.3+ if signal). CSO + Paranoid Staff Eng veto.

### § M-01 PhaseClass ARCHITECTURAL LOCK

Phase 5.2 = architectural decision phase (R10.3 NEW src/cli/uninstall.ts + 7 NEW uninstallers +
R10.4 NEW src/manifest/lib/path-guard.ts) ≠ R-5 publish-only. Full ship cadence applies.

## A7 Conservation

ADR 0001-0021 main body **untouched**; baseline tag iteration `adr-0001-accepted`…`adr-0021-accepted`
(Phase 5.1 ship) → 加 `adr-0022-accepted` (Phase 5.2 Wave 2 T2.8 LOCAL CREATE).

### A7 守恒验收命令 (phase 5.2 ship 后 0001-0022 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018 0019 0020 0021 0022; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0022 main body unchanged"
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0021` → `for n in ... 0021 0022`;
step name `ADR 0001-0021` → `ADR 0001-0022` (Wave 2 T2.7 落地; single extend NOT retroactive).

## Consequences

**Capability deltas (Phase 5.2 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| R10.3 harnessed uninstall CLI (D-01 through D-07) | NEW src/cli/uninstall.ts 115L + 7 src/uninstallers/*.ts (≤72L each) + src/uninstallers/index.ts + 14th subcommand | wc -l src/cli/uninstall.ts ≤ 200 |
| R10.4 path traversal guard (D-03 + D-08) | NEW src/manifest/lib/path-guard.ts 36L + checkPathSafe 4-site D-04 integration | grep 'checkPathSafe' src/manifest/aliases.ts src/cli/install.ts src/cli/uninstall.ts |
| Tests | 733 (Phase 5.1) → 747 (Wave 1 +14) → 756 (Wave 2 +9) PASS | pnpm test |

**Negative consequence + mitigation**: path-guard.ts NEW dep for resolveAlias (minor coupling;
Karpathy isolation: separate concern from security.ts shell-escape AST detector). DEFERRED
comprehensive 10+ vectors (v0.6+ if signal). DEFERRED full fs.* API audit (v0.6+ supply-chain).

## Compliance

**F1-F8 8/8 acceptance bar:**

- **F1 ADR 0022 accepted** — 本 ADR Status flip (T2.5)
- **F2 R10.3 harnessed uninstall 100% traceable forward** — T1.1+T1.2+T1.3 PASS (747 tests; +14 cells)
- **F3 R10.4 path traversal 5-vector guard** — T2.1+T2.2+T2.3+T2.4 PASS (756 tests; +9 cells)
- **F4 ci.yml A7 iter 0021→0022** — T2.7 single extend
- **F5 DOGFOOD-T2.X.md 3-axis PASS** — T2.9
- **F6 RETROSPECTIVE Phase 5.2** — T2.10
- **F7 STATE.md update** — T2.11
- **F8 SHIP dual tag** — T2.8 adr-0022-accepted + T2.13 v0.5.0-alpha.2-uninstall-security LOCAL CREATE

## Errata-path note

Phase 5.2 走 ADR 0022 errata pattern (新决策 inline; ADR 0001-0021 0-diff preserved). Future Phase 5.3+
走 ADR 0023+ errata. 本 ADR 0022 起 phase 5.2 ship 时刻 frozen — v0.6.0+ 演化 (10+ attack vectors /
regex+path.resolve double-defense / full fs.* audit) 必须开 ADR 0023+ errata.

## Adoption-confirmation

Phase 5.2 W1+W2 SHIPPED:
- Wave 0: validateFlags.ts + runOrPreview.ts dedup extract + D2 cadence iter 6 + SIZE_LIMIT 165→150
- Wave 1: src/cli/uninstall.ts 115L R10.3 + 7 uninstallers + 14 TDD cells + 14th subcommand
- Wave 2: src/manifest/lib/path-guard.ts 36L R10.4 + 9 TDD cells + 4-site D-04 + ADR 0022
- Tests: 733 → 756 PASS (+23; 0 regression)
- ci.yml A7 iter 0021→0022 + adr-0022-accepted + v0.5.0-alpha.2-uninstall-security LOCAL CREATE

## References

### 内部依据

- `docs/adr/0021-state-lock-and-audit-consumer.md` (Phase 5.1 PRIMARY anchor — 9-section format template)
- `docs/adr/0004-installer-dry-run-diff-preview-contract.md` (dry-run default ADR 0004 contract 1延袭)
- `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (STATE COLLAPSE — uninstall reads manifest yaml only)
- `src/manifest/lib/path-guard.ts` (W2 T2.1 NEW 36L — D-03 5 OWASP A1 + D-08 PathTraversalError)
- `src/cli/uninstall.ts` (W1 T1.1 NEW 115L — D-05 dry-run + D-06 --yes + D-07 NO backup)
- `src/uninstallers/` (W1 T1.2 NEW 7 files — D-01 per-method dispatch + D-02 ephemeral no-op)
- `tests/manifest/lib/path-guard.test.ts` (W2 T2.2 NEW — 9 TDD cells R10.4)
- `tests/cli/uninstall.test.ts` (W1 T1.3 NEW — 14 TDD cells R10.3)
- `.planning/phase-5.2/{5.2-CONTEXT,PLAN,PLAN-CHECK,PATTERNS,RESEARCH}.md`

### 外部参考

- OWASP Top 10 A1 Path Traversal (5-vector minimal MVP per D-03)
- `.planning/REQUIREMENTS.md` R10.3 + R10.4 acceptance criteria
- `.planning/ROADMAP.md` § v0.5.0 chapter Phase 5.2 spec
