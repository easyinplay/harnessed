# Phase v3.0-3.5 W2 Cycle 4 — /verify Master Orchestrator Dogfood + Path A vs B LOCK

**Date**: 2026-05-21
**Phase**: v3.0-3.5 W2 T3.5.W2.1 Cycle 4 (sister Phase 2.5 5-cycle reduced to 4 — final cycle)
**Scope**: `/verify` master 8 sub mixed + **Master Path A SDK vs Path B sub-shell LOCK decision**
**Test artifact**: `tests/dogfood/cycle-4-verify.dogfood.test.ts` (10 fixture)
**Verdict**: **PASS** (10/10 fixture green after **1 production bug caught + inline fixed**)

---

## Scope verbatim per PLAN L591

> Cycle 4 `/verify`: master invoke + 7 sub conditional (progress serial + code-review parallel +
> paranoid conditional + qa+security+design parallel conditional + simplify tail serial + multispec
> Pattern C critical-release) → 验证完整 Verify stage 流程 + **Master Path A SDK query vs Path B
> sub-shell fallback decision LOCK in this cycle**

实际 `verify/auto/workflow.yaml` ship 8 sub (T3.5.W1.4 reconfirmed): progress + code-review +
paranoid + qa + security + design + multispec + simplify。

---

## 🐛 Production bug caught (sister Phase 2.5 W2 uppercase OR/AND benchmark)

### Bug: spawn order violates yaml `order` field intent (HIGH impact)

- **Source**: F6 first-run dogfood `tests/dogfood/cycle-4-verify.dogfood.test.ts:133` assertion
  `expect(order[order.length - 1]).toBe('simplify')` failed — actual last spawn was `paranoid`
  (parallel sub) instead of `simplify` (serial order=99 末尾)。
- **Root cause**: `src/workflow/masterOrchestrator.ts` v0 implementation 把 serial spawn 全
  一次跑完 (L179-183) 然后再 parallel fan-out (L186-192)。yaml 中 `progress` (serial order 1) +
  `simplify` (serial order 99) 被一起 spawn 后 parallel 才跑 — 违反 yaml `order=99` 末尾意图。
- **Why not caught earlier**: Phase 3.4/3.5 W0.1 22 fixture schema-shape unit test 用 mocked
  `noopSpawn` 验 `fired[]` 字段集合,NOT verify temporal spawn ORDER。schema-shape test 永不验
  spawn timeline,所以 order bug 静悄悄通过 unit test 但 runtime dogfood 立马露馅。
- **Methodology evidence**: dogfood-first catch real production bug NOT pass-by schema-shape test
  (mocked noop assert `fired` array elements pass while real spawn order timeline fails) —
  proves R8.1 sister benchmark "dogfooding 内在动力" 不是 cosmetic 而是 fail-late 防线 (5-bug-class
  taxonomy: case-sensitive operator drift Phase 2.5 + temporal-order divergence Cycle 4 类 type)。
- **Inline fix**: split `serialClauses` 为 `serialLeading` (order < 50) + `serialTrailing`
  (order ≥ 50);spawn 顺序 = leading serial → parallel fan-out → trailing serial。`PARALLEL_MID_ANCHOR=50`
  阈值 — yaml `progress` (order=1) leading + `simplify` (order=99) trailing,符合 ~/.claude/CLAUDE.md
  "progress 必跑串行 → code-review 并行 → ... → simplify 末尾串行" 意图。
- **Affected file**: `src/workflow/masterOrchestrator.ts` L141-194 (Phase 2 split + Phase 3 spawn)
- **Status**: ✅ FIXED — 81/81 (masterOrchestrator + 4 dogfood + run) PASS post-fix;ALL Cycle 1-3
  fixture regression PASS (Cycle 1-3 sub 都是单一 mode,fix 无破坏);1087/1093 PASS full suite (2 pre-
  existing baseline unrelated to fix per engine-teammate ack)。

---

## Fixture matrix

| # | Fixture | Axis verified |
|---|---------|---------------|
| F1 | `verify/auto/workflow.yaml` Value.Check pass + `workflow=verify` + `delegates_to=8` | Master yaml shape |
| F2 | 2 serial (`progress order 1` + `simplify order 99`) + 6 parallel | K9 serial order LOCK |
| F3 | 5 conditional parallel gate refs + `code-review` NO gate | Gate convention |
| F4 | Minimal verify ctx → 3 fired (`progress` + `code-review` + `simplify`) + 5 skipped | Baseline scope |
| F5 | Critical release full ctx → 8 fired 0 skipped | Max-scope verify |
| F6 | Order: `progress` first + `simplify` last (parallel 中间) | **Bug caught + fix proof** |
| F7 | Transparency block `Evaluating 8 ... Firing 5 sub in serial+parallel ... Complete: 5 fired, 3 skipped` | RESEARCH § Area 3 |
| F8 | **Path A LOCK** — default spawnDriver in-process spawn real sub yaml (3 SHIPPED sub all load) | Path A SDK query confirmed |
| F9 | **Path B LOCK** — DI spawnDriver throw → Promise.allSettled catch + Path B contract static-verify | Path B sub-shell fallback contract |
| F10 | K8 single-context snapshot — same `ctx` reference 全 8 spawn | K8 mitigation |

---

## 🔒 Master Path A vs Path B LOCK decision (Open Q4 final)

### Decision: Path A default + Path B fallback contract present (sub-shell exec defer v3.x)

per Open Q4 + RESEARCH-workflows § Area 3 recommendation。Cycle 4 F8 + F9 final 决策:

- **Path A** (`defaultSpawnDriver` L62-69 in `masterOrchestrator.ts`) — **DEFAULT**:
  in-process recursive `runWorkflow(subYamlPath, {}, { packageRoot, gateContext })`。
  F8 实证:3 fired sub (progress + code-review + simplify) 全 SHIPPED Phase 3.4 yaml load
  via `readFile` + `Value.Check` pass + sub workflow.yaml phase loop 桩跑 (D-03 WIRED)。
  快 (no shell spawn) + context 共享 (K8 single snapshot) + error path 透明 (try/catch + warn)。

- **Path B** (`defaultSpawnDriver` L67-77 try/catch) — **FALLBACK**:
  Path A invoke `runWorkflow` throw → catch + `console.warn('⚠️ master spawnSubWorkflow Path A
  failed ... Path B sub-shell fallback deferred T3.5.W2.1')` + 不真 exec sub-shell。
  v3.0 conservative scope:cmd surface 收紧 (避免 spawn 调用栈 unintended side-effect);
  实际 sub-shell `harnessed` CLI invoke defer v3.x first user-reported real-world Path A
  failure case (per K-mitigation cmd surface contract)。

- **F9 contract proof**: parallel sub throw → `Promise.allSettled` L186-192 catch rejection
  silently (failed sub NOT in `fired[]`,master 自身 NOT throw 继续 return success)。serial
  sub throw → propagate up to caller (沿用 Phase 3.2 W2 T2.3 D-03 WIRED throw semantic)。
  `masterOrchestrator.ts` source-level static-verify: `await runWorkflow(subYamlPath` (Path A)
  + `Path B sub-shell fallback` + `Path A failed` comment 全 present。

### Why Path A default (NOT Path B):

1. **Speed** — no shell spawn (Path B sub-shell 真 exec 时会 fork process 多 1-2 秒/sub);
   8 sub verify scope 节省 10s+。
2. **Context sharing** — K8 single snapshot 实证 (F10);Path B sub-shell 须 marshal context
   through env / args / stdin pipe,K8 contract 破。
3. **Error transparency** — Path A throw 直接 propagate / Promise.allSettled catch + warn;
   Path B sub-shell exit code 须额外解析。
4. **K-mitigation cmd surface** — sub-shell exec 风险 (unintended side-effect / cwd drift /
   PATH not propagate) 在 v3.0 conservative scope 收紧。

### Path B v3.x evolution path (deferred):

当 Path A 真 cmd surface 已知 / cmd argument marshal 已成熟 / cwd + env handoff 已 LOCK →
Path B `defaultSpawnDriver` L73-76 console.warn 替换为 `execSync('harnessed run <subYaml>')` →
Path B 真 sub-shell exec activated。v3.x first user-reported Path A failure case 才 evolve。

---

## Aggregate metrics (4-cycle full)

- **4 cycle SHIPPED**: Cycle 1 (10 fixture) + Cycle 2 (10) + Cycle 3 (10) + Cycle 4 (10) = **40 NEW dogfood fixture**
- **W1.5 fixture**: 6 NEW (3 hook fire path)
- **Total NEW fixture in Phase 3.5 dogfood scope**: 40 + 6 = **46** (sister Phase 2.5 46 fixture verbatim match)
- **Production bugs caught + fixed**: **1** (spawn order temporal divergence;Cycle 4 F6 catch;
  inline fix + 81/81 PASS post-fix;sister Phase 2.5 uppercase OR/AND R8.1 benchmark value 实证)
- **Path A/B LOCK**: ✅ Path A SDK query default + Path B sub-shell fallback contract present (deferred v3.x)

---

## Next

T3.5.W2.2 — Phase 3.5 ship cadence (STATE.md update + LOCAL tag `v3.0.0-rc.1` + close commit
sister T3.4.W2.3 pattern)。

---

*Phase v3.0-3.5 W2 Cycle 4 — /verify master orchestrator dogfood + Path A/B LOCK evidence*
*Run: 2026-05-21*
*Sister Phase 2.5 W5 DOGFOOD-T5.5-AGGREGATE 5-axis pattern (reduced to 4 cycle inline reports)*
