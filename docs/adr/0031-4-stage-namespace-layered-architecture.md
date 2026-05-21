# ADR-0031: 4-Stage Namespace-Layered Workflow Architecture (M-01 + D-03 + D-07)

## Status

**Accepted (phase v3.0-3.6 — 2026-05-21)** — v3.0 milestone Phase 3.3 schema foundation + Phase 3.4 14 sub yaml + Phase 3.5 master orchestrator + Phase 3.5 W2.1 4-cycle dogfood SHIPPED 后 Phase 3.6 W0.2 backfill。

> Phase v3.0-3.1 discuss-phase LOCKED 13 D-decision 中 **M-01 ARCHITECTURAL MAJOR REFACTOR v2** + **D-03 nested 2-level `workflows/<stage>/<sub>/` dir** + **D-07 20 workflow ship** 的合并 ADR — 沿袭 ADR 0024 v2.0 多决策合并 errata 模式 (sister D-01+D-02+D-09 合并 pattern)。本 ADR 0031 是 ADR 0024 v2 schema 的 v3 superset (4-stage namespace-layered 升级)。

## Context

v2.0.0 GA SHIPPED 2026-05-20 后 24 小时内 user catch architectural smell — `/plan-feature` 5-phase workflow conflates **5 个独立抽象层** in 单 workflow:

1. **Strategic layer** — gstack `/office-hours` + `/plan-ceo-review` (新 milestone 商业 scope 决策)
2. **Phase layer** — GSD `/gsd-discuss-phase` (phase 灰色澄清 ≥2 open implementation decisions)
3. **Subtask layer** — `superpowers:brainstorming` (≥2 implementation 方案 + 错误成本高)
4. **Plan layer** — GSD `/gsd-plan-phase` + planning-with-files (task_plan.md 持久化)
5. **Persist layer** — planning-with-files findings.md / progress.md / knowledge.md (跨 session)

CLAUDE.md 全局规则明确「澄清/审查触发判据」**三层独立判断**铁律 (战略层 / Phase 层 / 子任务层独立激活, 跳过战略层 ≠ 跳过 phase 层), 而 v2.0 `/plan-feature` 5-phase 把这 5 层强行 concatenate 进 single workflow, gate-skip 仅是 cosmetic band-aid — 用户原话「gate-skip 只是障眼法」, 不解决 conflate fundamental issue。

Q-AUDIT batch 1 (Phase 3.1 2026-05-20) user 进一步 raise 3 architectural gap:

1. **Optional / conditional stages 缺位** — gstack 30+ slash cmd 如 `/plan-eng-review` / `/design-review` / `/devex-review` 缺乏 routing 入口
2. **Subagent + Agent Teams execution mechanism 漏** — 与 workflow orthogonal, 不应嵌入 phase
3. **CLAUDE.md global rules (语言 / 风格 / 优先级 / 纪律) 应作为单独 layer** — global cross-stage, NOT capability NOT tool (Q-AUDIT batch 2 D-09 NEW L0 Discipline Substrate)

User commitment Q9 batch 2: "理论上我的这三个 (CLAUDE.md + Obsidian doc + rules) 是你这个项目的子集, 你能实现的功能要大于我或者某个功能更优于我" → harnessed = full codification + > user manual via auto gate-route + Pure bundled + cross-session memory + ADR audit + real-time discipline enforcement (D-13 superset commitment)。

User Q4 batch 1 explicit 选 **Option A Pure ship v3 deprecate v2 (release-notes-only migration)** — sister D-04 release-notes-only pattern, NOT 写 `harnessed migrate v2→v3` CLI helper (YAGNI)。

### A7 守恒约束 (ADR 0001-0030 main body 不可改)

phase v3.0-3.6 沿袭 ADR 0024 / 0025 / 0026 / 0027 / 0028 / 0029 / 0030 errata 风格 — **不动 ADR 0001-0030 main body** (A7 守恒)。4-stage namespace-layered 重构 (M-01 + D-03 + D-07) 不影响 ADR 0024 v2 schema main body — v2 schema 与 v3 schema namespace 独立, `schema_version: harnessed.workflow.v2` 保留 (3 legacy workflow research / plan-feature / execute-task v2 alias keep), 新 v3 workflow 用 `schema_version: harnessed.workflow.v3`。

## Decisions

### 1. 4-Stage namespace-layered workflow architecture (M-01 — Q0 implicit 2026-05-20)

**Decision: v3.0 把 v2 5-phase plan-feature 拆为 4 master orchestrator (`/discuss` + `/plan` + `/task` + `/verify`) + 14 sub-workflow + 2 standalone (`/research` keep + `/retro` NEW), 总 20 workflow。Master `auto/workflow.yaml` 通过 `delegates_to:` 字段引用 sub-workflow + gate-eval 条件 fire (D-01 master auto gate-route)。**

**Architecture**:

| Stage | Master orchestrator | Sub-workflow (count) | gate basis |
|-------|---------------------|----------------------|------------|
| ① Discuss | `/discuss` (auto delegates 3 sub) | `discuss-strategic` + `discuss-phase` + `discuss-subtask` | CLAUDE.md 三层独立判断 |
| ② Plan | `/plan` (auto delegates 2 sub) | `plan-phase` + `plan-persist` | 复杂架构 → eng-review |
| ③ Task | `/task` (auto delegates 4 sub) | `task-clarify` + `task-code` + `task-test` + `task-deliver` | subtask ralph-loop COMPLETE |
| ④ Verify | `/verify` (auto delegates 7 sub) | `verify-progress` + `verify-paranoid` + `verify-qa` + `verify-security` + `verify-design` + `verify-simplify` + `verify-multispec` | code-review fan-out + 关键模块 paranoid |

Sub-workflow 总数 = 3 + 2 + 4 + 7 = **16 sub** (而非初稿 14 — Phase 3.4 ship 期 W2.1 W2.2 拆 verify 7 sub 满 9-phase Pattern C 4-specialist 升级 ADR 0028)。Plus 2 standalone (`/research` v3 schema bump only slash cmd unchanged + `/retro` standalone NEW) → 4 master + 16 sub + 2 standalone = **22 v3 workflow** (实际 Phase 3.5 ship 22 v3 + 3 v2 legacy = 25 total per setup --apply manifest)。

### 2. Nested 2-level `workflows/<stage>/<sub>/` dir (D-03 — Q3 2026-05-20)

**Decision: workflows/ 目录嵌套 2 层 grouped by 4 stage, sister CLAUDE.md 4-stage visual 镜像。每个 sub-workflow 落 `workflows/<stage>/<sub>/workflow.yaml` + `workflows/<stage>/<sub>/SKILL.md`。Master orchestrator 落 `workflows/<stage>/auto/workflow.yaml` (e.g., `workflows/discuss/auto/workflow.yaml`)。**

**Directory structure example**:

```
workflows/
├── discuss/
│   ├── auto/workflow.yaml          # /discuss master orchestrator
│   ├── strategic/workflow.yaml     # /discuss-strategic sub
│   ├── phase/workflow.yaml         # /discuss-phase sub
│   └── subtask/workflow.yaml       # /discuss-subtask sub
├── plan/
│   ├── auto/workflow.yaml          # /plan master
│   ├── phase/workflow.yaml         # /plan-phase sub
│   └── persist/workflow.yaml       # /plan-persist sub
├── task/
│   ├── auto/workflow.yaml          # /task master
│   ├── clarify/workflow.yaml
│   ├── code/workflow.yaml
│   ├── test/workflow.yaml
│   └── deliver/workflow.yaml
├── verify/
│   ├── auto/workflow.yaml          # /verify master
│   ├── progress/workflow.yaml
│   ├── paranoid/workflow.yaml
│   ├── qa/workflow.yaml
│   ├── security/workflow.yaml
│   ├── design/workflow.yaml
│   ├── simplify/workflow.yaml
│   └── multispec/workflow.yaml
├── research/workflow.yaml          # standalone (v3 schema bump)
├── retro/workflow.yaml             # standalone NEW
├── capabilities.yaml               # v3 superset (39 v2 baseline + ~36 NEW)
├── disciplines/                    # L0 (D-09 NEW per ADR 0032)
└── judgments/                      # 10 yaml (6 v2 + 4 NEW per ADR 0032)
```

**Rationale (D-03 Q3 A user choice)**: sister gstack 4-stage cadence + CLAUDE.md 4-stage prose 一一映射 (`Discuss → Plan → Execute → Verify`)。Bare slash cmd 用 `-` separator (sister ADR 0030 D-02 LOCK), 但 dir path 用 nested `/` 分隔 (sister Node.js `require('./<stage>/<sub>/workflow.yaml')` 自然路径 resolution)。

**Reject paths** (Q3 决策时): Flat `workflows/<sub>/workflow.yaml` (20 sub-dir 同级混乱 — verify-paranoid / verify-qa 视觉不分组) / 3-level `workflows/<stage>/<sub>/<variant>/` (over-engineering, 没有 variant 需求)。

### 3. 20 workflow ship (4 master + 14 sub + 2 standalone) (D-07 — Q-batch derive 2026-05-20)

**Decision: v3.0 ship total 20 workflow** (Q-batch derive 数 — Phase 3.4 W2 ship 期 verify 拆 7 sub 后 sub count 14→16, total 22 v3 — 但本 ADR 沿用 discuss-phase locked 数 D-07 "20 workflow", 标 errata 引用 Phase 3.5 实际 ship 22)。

**4 master orchestrator** (`workflows/<stage>/auto/workflow.yaml`):

1. `/discuss` — delegates_to: strategic, phase, subtask (3 sub parallel eval via judgments.discuss.*.fires)
2. `/plan` — delegates_to: phase, persist (2 sub serial mixed — phase 先 lock 架构 → persist 落 task_plan.md)
3. `/task` — delegates_to: clarify, code, test, deliver (4 sub serial order 1-4 ralph-loop wrap)
4. `/verify` — delegates_to: progress, paranoid, qa, security, design, simplify, multispec (7 sub mixed serial + parallel + conditional)

**14 sub-workflow** (Q-batch derive 数; Phase 3.4 W2 ship 实际 16 sub per Pattern C 4-specialist 升级 verify 拆 7):

- Discuss: strategic + phase + subtask (3)
- Plan: phase + persist (2)
- Task: clarify + code + test + deliver (4)
- Verify: progress + paranoid + qa + security + design (5 → 实际 ship 7 加 simplify + multispec per ADR 0028 Pattern C 升级)

**2 standalone**: `/research` v3 schema bump only slash cmd unchanged (sister Phase 3.5 W2.1 Cycle 3 dogfood verified 0 bug) + `/retro` standalone NEW (milestone narrative 总结, sister CLAUDE.md "里程碑结束: 可选跑 /retro 总结" prose 机器化)。

### 4. BREAKING migration path (release-notes-only per D-04)

**Decision: v2.0.x → v3.0 升级走 CHANGELOG [3.0.0] BREAKING section + alias map table, NOT 写 `harnessed migrate` CLI helper (sister D-05 release-notes-only YAGNI)。**

**Alias map (CHANGELOG [3.0.0] BREAKING section)**:

| v2 slash cmd (DROPPED) | v3 master OR sub equivalent |
|------------------------|------------------------------|
| `/plan-feature` | `/plan` master OR `/plan-phase` sub |
| `/execute-task` | `/task` master OR `/task-{clarify,code,test,deliver}` sub |
| `/verify-work` | `/verify` master OR `/verify-{progress,paranoid,qa,security,design,simplify,multispec}` sub |

**End-user 升级一行**: `npm install -g harnessed@3.0 && harnessed setup --apply` — sister D-04 Pure bundled + sister ADR 0023 v1.0 OIDC + sigstore provenance npm publish path。无 user-dir override (per ADR 0024 D-01 Pure bundled rule 2)。

NEW: `/research` v3 schema bump only (slash cmd unchanged, schema_version `harnessed.workflow.v2` → `harnessed.workflow.v3`)、`/retro` standalone NEW、20 v3 workflow + L0 Discipline Substrate (per ADR 0032) + L5b Execution Mechanism Layer + 10 judgments + ~75 capabilities。

## A7 Conservation

ADR 0001-0030 main body **untouched** — baseline tag iteration `adr-0001-accepted` ... `adr-0030-accepted` → 加 `adr-0031-accepted` (Phase v3.0-3.6 W1 ship 时刻打)。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** — 与 workflow schema v3 namespace 独立。

### CI A7 step

`.github/workflows/ci.yml` A7 step iter 0029 → 0031 (W1 落地 single extend NOT retroactive); step name `ADR 0001-0029` → `ADR 0001-0031`。本 ADR 后续 0032 single extend (per Phase 3.6 W0.3 ship), NOT batch retroactive 修改 A7 step。

## Consequences

### Positive

- **Separation of concerns 实现**: 5 个抽象层 (Strategic / Phase / Subtask / Plan / Persist) 在 v2 conflate 单 workflow → v3 拆为 16 sub-workflow + 4 master orchestrator gate-route 独立判断, sister CLAUDE.md 三层独立判断铁律机器化。
- **CLAUDE.md / Obsidian doc / rules 1:1 mapping 100%**: D-13 superset commitment 兑现 (per ADR 0032 L0 Discipline Substrate 6 yaml + L5b Execution Mechanism Layer + 10 judgments + ~75 capabilities)。
- **Master auto gate-route 减少 cognitive load**: User 只需记 4 master slash cmd (`/discuss` / `/plan` / `/task` / `/verify`), master 自动 parallel gate-eval 各 sub 是否 fire, sister gstack `/autoplan` 一键串联多 review pattern。
- **Sub-workflow 独立 invoke 保留**: Power user 可直接 `/discuss-phase` 跳过 master orchestrator (sister CLAUDE.md "用户明示 → 覆盖判据" 铁律)。
- **Nested dir visual 4-stage 对应**: `workflows/discuss/` `workflows/plan/` `workflows/task/` `workflows/verify/` 一眼看清 stage 归属, 减少 maintainer 找文件成本。

### Negative

- **BREAKING change** — v2.0.x → v3.0 升级 user must adopt 新 slash cmd (DROP `/plan-feature` / `/execute-task` / `/verify-work`)。Release-notes-only migration (D-04) 无 CLI helper, end-user 升级需读 CHANGELOG alias map (~5 min onboarding cost 可接受)。
- **Maintainer schema iteration 成本翻倍** — 20 workflow.yaml + 20 SKILL.md 写作 (Phase 3.4 ship 期 W1+W2 batch 实测 ~3 day) vs v2 仅 4 workflow.yaml。但 capability abstraction (ADR 0024 D-02) 摊薄 — upstream cmd rename 改 capabilities.yaml 一处 20 workflow 自动消费。
- **Master orchestrator 复杂度** — `masterOrchestrator.ts` 188L Hybrid Option C 5-phase logic gate eval + serial/parallel split + spawnSubWorkflow Path A SDK default + Path B sub-shell fallback (Phase 3.5 W1 ship)。Karpathy ≤200L 紧贴边界 (197L exact)。
- **A7 守恒 27 ADR baseline tag** — `adr-0001-accepted` ... `adr-0031-accepted` 累计 31 tag, baseline tag iteration cadence 沿袭 sister ADR 0024-0030 pattern (single extend per phase ship NOT batch retroactive)。

### Neutral

- **schema_version `harnessed.workflow.v3`** — sister ADR 0011 § 7 schemaVersion 单一兼容门 7-surface 集合的 11th surface registration (Phase 3.3 W0 schema foundation ship)。v2 alias keep 3 workflow (research / plan-feature / execute-task v2 deprecate warn-only)。
- **20 vs 22 workflow count discrepancy** — D-07 discuss-phase locked "20 workflow" (Q-batch derive 数), Phase 3.5 实际 ship 22 v3 (verify 拆 7 sub per Pattern C 4-specialist 升级 ADR 0028)。本 ADR 0031 main body 沿用 locked 20 数, errata 节点记录实际 ship 22 (sister ADR 0024 v2 schema initial 4 workflow vs Phase 2.4 W1 ship 4 workflow 一致 pattern)。
- **Sister gstack 4-stage cadence 完美对齐** — gstack `/office-hours` (Strategic) / `/plan-eng-review` (Phase plan) / `/review` (paranoid) / `/qa` (verify) 在 harnessed v3 sub-workflow 各 stage gate fire 通过 capabilities.yaml registry (per ADR 0032 D-12 Optional gstack 30+ as capabilities registry NOT sub-workflow scope creep)。

## Alternatives Considered

### Option A: v2.x incremental band-aid (REJECTED)

继续在 v2.0.x patch release 加 conditional skip / `--skip-strategic` flag 让 `/plan-feature` 5-phase 选择性 skip 层。**Reject**: 仅 cosmetic 不解决 5 层 conflate fundamental issue, user 原话「gate-skip 只是障眼法」明确否定。

### Option B: 6-stage 增加 separation (REJECTED)

把 Discuss 拆为 Discuss-Strategic + Discuss-Phase 单独 stage 加上 Subtask-Brainstorm stage 增加 separation。**Reject**: over-engineering, 4-stage 已与 CLAUDE.md / gstack 4-stage cadence 完美对应; 子任务 brainstorm 不需要独立 stage 因为它在 Execute / Task 阶段内 fire (sister CLAUDE.md "子任务层" 子标题 nested under "澄清/审查触发判据")。

### Option C: Namespace `/harnessed:discuss:strategic` 3-level hierarchical (DEFERRED per ADR 0030)

Claude Code 平台原生 namespace 支持后 evaluate 3-level hierarchical slash cmd。**Defer**: 沿袭 ADR 0030 D-02 LOCK bare slash cmd convention; 平台 native 支持成熟后 NEW ADR 0033+ evaluate。

## Validation

**SHIPPED 2026-05-21** — 分 4 Phase 落地:

1. **Phase v3.0-3.3 schema foundation** (2026-05-21) — workflow schema v3 TypeBox + capabilities v3 superset + 10 judgments multi-file + masterOrchestrator schema field (`delegates_to:` + `delegation_strategy: auto`) + check-workflow-schema.mjs cross-validate v2+v3 contract; 13 atomic commit Pattern A 3-teammate
2. **Phase v3.0-3.4 14 sub yaml + SKILL.md** (2026-05-21) — discuss-strategic + discuss-phase + discuss-subtask + plan-phase + plan-persist + task-clarify/code/test/deliver + verify-progress/paranoid/qa/security/design/simplify/multispec (后扩 7); 16 atomic commit
3. **Phase v3.0-3.5 master orchestrator + dogfood** (2026-05-21) — `masterOrchestrator.ts` 188L Hybrid Option C ship + 4 master/auto yaml + run.ts wedge master detect (master ∈ {discuss,plan,task,verify} → runMasterOrchestrator) + W2.1 4-cycle 端到端 dogfood (Cycle 1 /discuss 10 fixture 0 bug + Cycle 2 /plan 10 fixture 0 bug + Cycle 3 /task 10 fixture 0 bug + **Cycle 4 /verify 10 fixture 1 PRODUCTION BUG CATCH** masterOrchestrator spawn order divergence — serial order=99 末尾被一次跑完违反 yaml intent, INLINE FIX split serialLeading order<50 + serialTrailing order≥50 + parallelMid via PARALLEL_MID_ANCHOR=50 阈值); R8.1 dogfood-first methodology proven sister Phase 2.5 uppercase OR/AND benchmark verbatim — schema-shape pass but runtime fail catch via 4-cycle end-to-end
4. **Phase v3.0-3.6 close** (2026-05-21) — 3 NEW ADR (本 0031 + 0030 namespace bare + 0032 disciplines + execution mechanism) + CHANGELOG [3.0.0] BREAKING section + ci.yml A7 0029→0032 + npm publish v3.0.0 pending

**Acceptance Bar**: 22 v3 workflow ship (4 master + 16 sub + 2 standalone, errata 修正 D-07 locked 20→22) + 3 v2 legacy keep (research v2 alias + plan-feature v2 deprecate warn + execute-task v2 deprecate warn) + 4 master `delegates_to:` consume from 16 sub via judgments.<stage>.<sub>.fires gate-eval + check-workflow-schema.mjs exit 0 + full vitest suite 1087+/1093 pass + biome clean + tsc 0 error + Karpathy ≤200L 全 hold (masterOrchestrator.ts 197L + run.ts 200L exact boundary)。

## References

### 内部依据

- `docs/adr/0024-workflow-schema-v2-capability-abstraction.md` (v2 schema sister ADR — workflow.yaml schema v2 + capabilities flat yaml map + `on:` syntax; 本 ADR 0031 是 v3 superset, v2 schema namespace 独立保留 3 legacy alias)
- `docs/adr/0030-namespace-policy-bare-slash-cmd.md` (sister D-02 LOCK bare slash cmd convention; 本 ADR 沿袭, NOT 引入 `/harnessed:*` prefix)
- `docs/adr/0028-ralph-loop-tdd-agent-teams-routing-schema-fix.md` (Pattern C 4-specialist 升级 reference — verify 7 sub 拆分依据)
- `docs/adr/0029-fallback-rules-4-stage-mechanization-dogfood.md` (sister Phase 2.5 R8.1 dogfood-first methodology + 46 fixture pattern; Phase 3.5 W2.1 4-cycle dogfood 完整复用)
- `docs/adr/0011-execute-task-sdk-ralph.md` § 7 SchemaVersion 单一兼容门 (harnessed.workflow.v3 是 11th surface registration)
- `.planning/phase-v3.0-3.1/3.1-CONTEXT.md` § M-01 + D-03 + D-07 LOCK context (architectural smell user catch 2026-05-20 post v2.0.0 GA ship)
- `.planning/phase-v3.0-3.1/3.1-DISCUSSION-LOG.md` Q0 + Q3 + Q-batch derive transcript + Q-AUDIT batch 2 user 3 architectural gap raise
- `.planning/phase-v3.0-3.2/PLAN.md` L626-632 T3.6.W0.2 spec (本 ADR 0031 落地 spec)
- `CLAUDE.md` § "三层栈方法论 reminder" 4-stage cadence prose (Discuss → Plan → Execute → Verify; sister gstack governance gate + GSD orchestration + superpowers + karpathy + mattpocock + ralph-loop)
- `~/.claude/CLAUDE.md` § "澄清/审查触发判据" 三层独立判断铁律 (Strategic / Phase / Subtask 独立激活; 跳过战略层 ≠ 跳过 phase 层)
- `docs/WORKFLOW.md` (v0.4 4-stage mermaid + harnessed v0.4 gap 分析; v3.0 ship 后 gap 全部 close)
- `src/workflow/masterOrchestrator.ts` 197L (Phase 3.5 W1 ship Hybrid Option C 5-phase logic gate eval + serial/parallel split + spawnSubWorkflow Path A SDK default + Path B sub-shell fallback + K8 ctx single snapshot + K14 warn-not-halt arbitration)
- `src/workflow/run.ts` 200L (Phase 3.5 W1 wedge master detect — master ∈ {discuss,plan,task,verify} → runMasterOrchestrator else runSubOrStandalone)
- `workflows/discuss/auto/workflow.yaml` (Phase 3.5 W2 ship master orchestrator 3 sub parallel)
- `workflows/plan/auto/workflow.yaml` (Phase 3.5 W2 ship master orchestrator 2 sub serial mixed)
- `workflows/task/auto/workflow.yaml` (Phase 3.5 W2 ship master orchestrator 4 sub serial order 1-4)
- `workflows/verify/auto/workflow.yaml` (Phase 3.5 W2 ship master orchestrator 7 sub mixed serial+parallel+conditional, K9 invariant explicit order)
- `.planning/phase-v3.0-3.5/W2.1-DOGFOOD-CYCLE-{1,2,3,4}.md` (Phase 3.5 W2.1 4-cycle end-to-end dogfood report 满 L-3 advisory)
- `.planning/REQUIREMENTS.md` § R30 v3.0 NEW (4-stage namespace-layered acceptance criteria)

### 外部参考

- gstack 4-stage cadence (`/office-hours` + `/plan-ceo-review` + `/plan-eng-review` + `/review` + `/qa` + `/design-review` + `/cso` + `/retro` — sister harnessed v3 sub-workflow stage gate mapping per ADR 0032 capabilities registry)
- Claude Code platform native namespace support roadmap (sister ADR 0030 Option C defer trigger condition; 平台 native 支持成熟后 evaluate 3-level hierarchical slash cmd)
