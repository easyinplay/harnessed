# ADR 0021: Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer

## Status

**Accepted (phase 5.1 W1/W2 — 2026-05-19)** — phase 5.1 plan-phase PLAN.md 1047L 24 tasks 3 waves
ready → Wave 0 backlog #BF+#BG absorb + retroactive adr-0019/0020-accepted tags → Wave 1 R10.1
NEW src/cli/audit-log.ts 162L + 8 TDD cells + 13th subcommand register → Wave 2 R10.2
src/checkpoint/state.ts lock wrap + proper-lockfile dep + status.ts enhance + ADR 0021 + ci.yml A7
iter 0018→0021 + triple tag → Accepted at phase 5.1 ship.

> Phase 5.1 是 v0.5.0 milestone **第 1 phase (1/3)**, 把 v0.5.0 装配为 **R10.1 `harnessed audit-log`
> CLI consumer (jq subprocess + 5-pattern redact + dual format + 3 pagination flags) + R10.2
> `src/checkpoint/state.ts` concurrent write lock (proper-lockfile dir-level `.harnessed/.lock`
> + LockHeldError + bounded retry) + ADR 0021 PRIMARY anchor + ci.yml A7 iter 0018→0021 + triple tag
> sister v0.4.0 close cadence延袭 (adr-0021-accepted + v0.5.0-alpha.1-audit-lock)**. 8 D-decisions +
> M-01 ARCHITECTURAL phase class lock — 沿袭 ADR 0018/0019/0020 多决策合并 errata 模式.

## Context

R10.1 spec verbatim: `harnessed audit log --filter` CLI subcommand consumer reads `.harnessed/audit.log`
JSONL (Phase 4.3 R8.1 producer already shipped 12-field schema); user can filter with jq expression,
paginate with --tail/--head/--reverse, output human table or --json. Defense-in-depth redact 5 patterns
(api_key/token/password/Bearer/key-prefix) applied consumer-side before render.

R10.2 spec verbatim: `.harnessed/` concurrent write lock #BU — `src/checkpoint/state.ts`
writeCurrentWorkflow has no lock (Phase 4.3 DEFERRED #BU single-maintainer dogfood low-risk; multi-maintainer
co-maintainer recruit window prerequisite). Phase 5.1 must deliver R10.2 to unblock v1.0 GA.

Phase 5.1 = ARCHITECTURAL decision phase per M-01 LOCK (R10.1 NEW src/cli/audit-log.ts + R10.2 MODIFY
src/checkpoint/state.ts + NEW dep proper-lockfile). Full ship cadence applies.

### A7 守恒约束 (ADR 0001-0020 main body 不可改)

Phase 5.1 沿袭 ADR 0018 errata 风格 — **不动 ADR 0001-0020 main body** (A7 守恒). baseline tag iterate
0018 → 0021 (Wave 2 ship 时 LOCAL CREATE `adr-0021-accepted` tag; ci.yml A7 step iter `0018` → `0021`
per Phase 4.3 W2 T2.4 pattern). 本 ADR 0021 起 phase 5.1 ship 时刻 frozen; v0.6.0+ 演化走 ADR 0022+ errata.

## Decisions

### 1. D-05 LockImpl — proper-lockfile@4.1.2 dir-level lock (HIGH, deliberate)

Library: `proper-lockfile` (5M weekly downloads, MIT, 6KB minified, no runtime dep, cross-OS).
API: `lockfile.lock('.harnessed', { stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 },
lockfilePath: '.harnessed/.lock' })` + `release()` in finally. Sneak-blocks: NO handwritten `fs.open(wx)`
(race window + crash leftover footgun) + NO OS flock (Win unsupported) + NO defer Phase 5.2+ (R10.2
必须 Phase 5.1 兑现推 v1.0 GA).

### 2. D-06 RetryPolicy — bounded retry 3×100ms exp-backoff + LockHeldError (MED, batch confirm)

Policy: `{ retries: 3, factor: 2, minTimeout: 100 }` → ~700ms total → throw `LockHeldError` with hint
"another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)".
Sneak-blocks: NO unbounded retry (deadlock risk) + NO fail-fast zero retry (UX weak).

### 3. D-07 ForceFlag — NO --force + harnessed status displays lock holder (LOW, batch confirm)

No `harnessed resume --force` bypass lock. `harnessed status` displays `.harnessed/.lock` mtime +
stale indicator (age > 10s). Sneak-blocks: NO --force flag (race condition — active process would corrupt state).

### 4. D-08 LockScope — dir-level lock `.harnessed/` (HIGH, deliberate)

Scope: entire `.harnessed/` dir locked by proper-lockfile. Protects: writeCurrentWorkflow + engineHook
activatePhase/completePhase (transitive) + all .harnessed/* writes. Sneak-blocks: NO single-file lock
current-workflow.json (other checkpoint files race) + NO operation-level 7-fn lock (Karpathy YAGNI 5x
complexity) + NO process-level lock (status+resume UX too restrictive).

### 5. D-01 FilterSyntax — jq subprocess pipe internal invocation (HIGH, deliberate)

CLI UX: `harnessed audit-log --filter '.category=="engineering"' --tail 50` → internal `child_process.spawn('jq',
['-c', filter], { shell: false })` pipe audit.log → jq stdin → stdout. Sneak-blocks: NO node-jq npm dep +
NO hand-written DSL parser + NO raw `harnessed audit-log | jq` pipe (Win CMD jq absence UX degradation).

### 6. D-02 OutputFormat — human table default + --json opt-in (MED, batch confirm)

Default: human-readable 5-col table `ts | phase | category | matched_rule_id | outcome`.
Opt-in: `--json` full 12-field JSON. Sneak-blocks: NO cli-table3 dep (Karpathy YAGNI).

### 7. D-03 PaginationFlags — --tail/--head/--reverse MVP 3 flags (LOW, batch confirm)

--tail N (default 50) + --head N + --reverse. Deferred v0.6+: --since/--until/--sort (YAGNI no signal).

### 8. D-04 SecurityRedact — consumer 2nd-layer 5-pattern redact (HIGH, CSO deliberate)

5 patterns pre-compiled at module load: api_key/token/password/Authorization Bearer/key-prefix
(sk-/pk-/gh_/ghp_/ya29./AIza). Applied LAST in pipeline (paginate → jq → redact → render).
Defense-in-depth: producer (Phase 4.3 R8.1) already sanitizes; consumer is second layer.
Sneak-blocks: NO defer to Phase 5.2 (audit log = security boundary; CSO Paranoid Staff Eng veto).

### § M-01 PhaseClass ARCHITECTURAL LOCK

Phase 5.1 = architectural decision phase (R10.1 NEW src/cli/audit-log.ts + R10.2 MODIFY
src/checkpoint/state.ts + NEW dep proper-lockfile) ≠ R-5 publish-only. Full ship cadence applies.

## A7 Conservation

ADR 0001-0020 main body **untouched**; baseline tag iteration `adr-0001-accepted`…`adr-0018-accepted`
(Phase 4.3 ship) + retroactive `adr-0019-accepted` + `adr-0020-accepted` (Phase 5.1 W0 T0.4 LOCAL CREATE)
→ 加 `adr-0021-accepted` (Phase 5.1 Wave 2 T2.9 LOCAL CREATE).

### A7 守恒验收命令 (phase 5.1 ship 后 0001-0021 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018 0019 0020 0021; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0021 main body unchanged"
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0018` → `for n in ... 0018 0019 0020 0021`;
step name `ADR 0001-0018` → `ADR 0001-0021` (Wave 2 T2.8 落地).

## Consequences

**Capability deltas (Phase 5.1 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| R10.1 audit-log consumer (D-01+D-02+D-03+D-04) | NEW src/cli/audit-log.ts 162L jq subprocess + 5-pattern redact + dual format + 3 pagination flags | wc -l src/cli/audit-log.ts ≤ 200 |
| R10.2 concurrent write lock (D-05+D-06+D-07+D-08) | MODIFY src/checkpoint/state.ts 77L→116L LockHeldError + withLock + writeCurrentWorkflow wrap | grep 'class LockHeldError' src/checkpoint/state.ts |
| proper-lockfile runtime dep | package.json dependencies + pnpm-lock.yaml | grep '"proper-lockfile"' package.json |
| harnessed status lock display | src/cli/status.ts 31L→58L lockfile.check + mtime + STALE indicator | grep 'lockfile.check' src/cli/status.ts |

**Negative consequence + mitigation**: DEFERRED #BV harnessed uninstall 推 Phase 5.2 R10.3 + DEFERRED #AH
path traversal regex hardening 推 Phase 5.2 R10.4. Cross-OS: proper-lockfile has Win fallback (file existence
+ O_EXCL where flock unavailable); ci.yml 3-OS matrix verifies Day 1.

## Compliance

**F1-F8 8/8 acceptance bar:**

- **F1 ADR 0021 accepted** — 本 ADR Status flip (T2.6)
- **F2 R10.1 routing audit-log 100% traceable forward** — T1.1+T1.2+T1.3 PASS (728→733 tests)
- **F3 R10.2 concurrent write lock** — T2.2 state.ts wrap + T2.4 5-cell TDD 733 PASS
- **F4 ci.yml A7 iter 0018→0021** — T2.8 retroactive fix
- **F5 DOGFOOD-T2.X.md 3-axis PASS** — T2.11
- **F6 RETROSPECTIVE Phase 5.1** — T2.12
- **F7 STATE.md update** — T2.13
- **F8 SHIP triple tag** — T2.9 adr-0021-accepted + T2.14 v0.5.0-alpha.1-audit-lock LOCAL CREATE

## Errata-path note

Phase 5.1 走 ADR 0021 errata pattern (新决策 inline; ADR 0001-0020 0-diff preserved). Future Phase 5.2+
走 ADR 0022+ errata. 本 ADR 0021 起 phase 5.1 ship 时刻 frozen — v0.6.0+ 演化 (op-level lock refine if
contention measurement signal + --since/--until flags if usage signal) 必须开 ADR 0022+ errata.

## Adoption-confirmation

Phase 5.1 W1+W2 SHIPPED:
- Wave 1: src/cli/audit-log.ts 162L R10.1 + 8 TDD cells + 13th subcommand register + DOGFOOD 3/3 PASS
- Wave 2: src/checkpoint/state.ts 77L→116L R10.2 + proper-lockfile dep + status.ts enhance + ADR 0021
- Tests: 728 → 733 PASS (+5 R10.2 lock cells; 0 regression)
- ci.yml A7 iter 0018→0021 + adr-0021-accepted + v0.5.0-alpha.1-audit-lock LOCAL CREATE

## References

### 内部依据

- `docs/adr/0018-routing-audit-log.md` (Phase 4.3 PRIMARY anchor — 9-section format template 100% reuse)
- `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (Phase 3.3 backfill — STATE COLLAPSE institutional pattern)
- `docs/adr/0020-hybrid-2clock-disambiguation.md` (Phase 4.2 backfill — HYBRID 2-clock disambiguation)
- `src/checkpoint/state.ts` (W2 T2.2 MODIFY 77L→116L — LockHeldError + withLock + writeCurrentWorkflow wrap)
- `src/cli/audit-log.ts` (W1 T1.1 NEW 162L — D-01 jq subprocess + D-04 5-pattern redact + D-02 dual format)
- `src/cli/status.ts` (W2 T2.5 MODIFY 31L→58L — D-07 lock holder display)
- `tests/checkpoint/state-lock.test.ts` (W2 T2.4 NEW 113L — 5 TDD cells R10.2 lock)
- `tests/cli/audit-log.test.ts` (W1 T1.2 NEW — 8 TDD cells R10.1)
- `.planning/phase-5.1/{5.1-CONTEXT,PLAN,PLAN-CHECK,PATTERNS,RESEARCH}.md`

### 外部参考

- `proper-lockfile` npm (MIT, 5M weekly downloads, cross-OS)
- `.planning/REQUIREMENTS.md` R10.1 + R10.2 acceptance criteria
- `.planning/ROADMAP.md` § v0.5.0 chapter Phase 5.1 spec
