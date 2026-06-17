# ADR-0034: ECC 选择性同化 + de-confliction 矩阵 (additive-first A→B posture)

## Status

**Accepted (2026-06-17)** — gstack `/plan-eng-review`(Finding 1-5 absorbed)+ ECC skill inventory 实测枚举(246 skills / 61 agents,§ 枚举结论 partition 核对 + 3 处修正 absorbed)均已完成。de-confliction 矩阵锁定。剩余 wire 前门:`harnessed manifest-add` EE-5 gate。本 ADR 是动 `manifests/skill-packs/ecc.yaml` + `workflows/capabilities.yaml` 之前的 de-confliction SoT。

## Date

2026-06-17

## Context

ECC(`ecc@ecc` CC plugin,本机 cache v2.0.0-rc.1)被提议引入 harnessed 生态。安装本身 trivial(走现成 plugin manifest,sister `gstack.yaml` shape)。真正的设计问题:**ECC 本身是一套与 GSD / superpowers / gstack 高度重叠的平行栈**——自带 plan / execute / review / learn / checkpoint / multi-agent 全链。

harnessed 的核心不变量(sister ADR 0006 three-stack mechanization wedge + ADR 0025 capabilities baseline):**单一路由 SoT + 显式 precedence + 重叠用 alias 收编,绝不让「同一件事有两种走法」**。priority.yaml 7 层仲裁(gstack > gsd > superpowers > planning-with-files > karpathy > mattpocock)是既有 owner 的定序机制。

若把 ECC 整套裸接进 capabilities.yaml,会为 plan / execute / review / learn / checkpoint 制造并列路由,直接破坏该不变量。因此引入必须走「capability source 选择性同化」——只收 ECC 的加性区,碰撞区显式排除或 alias 收编。

### 关键先例(同化机制不另起炉灶)

- ADR 0025:capabilities.yaml = maintainer-curated static map,每次上游变更走 ADR + patch release;**重叠用 `aliases:` 收编**(现成例:`gsd-debug` 把 mattpocock `/diagnose` 挂为 alias)。
- KEYSTONE 排除先例:`gsd-execute-phase` 在 capabilities.yaml Bucket 10 注释中 **deliberately NOT wired**——execute 机制由 harnessed 自有 checkpoint ledger 引擎拥有。ECC 的 checkpoint/session 适用同一排除逻辑。

### A7 守恒约束

本 ADR 沿袭 ADR 0025 static-manifest discipline:capabilities.yaml schema invariant 守恒,**entries 按 ADR 迭代**。ECC 加性 entry 作为新 Bucket 11 增量,不改既有 bucket 的 entry。

## Decisions

### 1. Posture = additive-first A → 按需升 B(C 排除,除非未来 ADR)

| Posture | 内容 | 决定 |
|---------|------|------|
| **A 加性 only** | 只收 domain / language / cost / hookify;碰撞区一律不 wire | **起步采纳** |
| **B 选择性收编** | A + 个别确实更强的 ECC 变体用 alias-replace 挂到现有 capability 下,仲裁交 priority.yaml | **按需升级**(每次升级走 errata ADR) |
| **C 全量 alt-profile** | ECC 整套当与 gstack+GSD 栈互斥的 `--profile ecc` | **排除**(除非未来明确要双栈对照,另开 ADR) |

### 2. 安装机制 = 1 manifest,install_type plugin

`manifests/skill-packs/ecc.yaml`,`spec.install.method` 走 plugin/marketplace(`ecc`),`idempotent_check` + `verify` 照 `gstack.yaml` 模板(test plugin dir / 代表 skill 存在)。不 vendor ECC 代码(sister 项目核心:装配主义不 vendor 上游)。

### 3. De-confliction 矩阵(本 ADR 的 SoT)

**加性区 → Bucket 11 wire(A posture,正交轴真加性;plan-eng-review 2026-06-17 修正后):**

| 加性 family | 代表成员 | fires_when 轴(现无人 fire) | 初始 cap |
|-------------|----------|------------------------------|----------|
| domain pattern 库 | `ecc:postgres-patterns` / `python-patterns` / `rust-patterns` / `mcp-server-patterns` / `nextjs-turbopack` / `docker-patterns` | `subtask.domain == '<x>'` | **≤8 起步 starter-set**(Finding 4) |
| cost report | `ecc:cost-tracking`(skill);`cost-report` / `model-route`(command 路径) | `subtask.needs_cost_report` / `needs_model_routing` | 全收(harnessed 两者皆无) |
| hook 作者助手 | `ecc:hookify-rules`(skill);`hookify`(command) | `subtask.needs_hook_authoring == true` | 全收 |

> **枚举修正(2026-06-17,见 § 枚举结论)**:ECC 实测 246 skills,但 domain-pattern「~100+」中**仅 ~55 是 dev pattern(相关),~95 是垂直/业务 app(`energy-procurement` / `visa-doc-translate` / `ito-*` / `homelab-*` / `scientific-*` 等)对 dev harness 无关 → NOT wire**。`cost-report`/`model-route` 是 command 不是 skill。
>
> **Finding 4 starter-set(≤8,按 harnessed Node/TS 栈 + CC-harness-builder 用户高频)**:`mcp-server-patterns` · `python-patterns` · `rust-patterns` · `golang-patterns` · `postgres-patterns` · `docker-patterns` · `nextjs-turbopack` · `api-design`。其余 dev pattern 按 demand 长(incremental over big-bang;ECC pre-release churn × 数量 = blast radius)。

**alias-收编(verify 维度,B-posture 提前;plan-eng-review Finding 1 决议):**

per-language reviewer / build-resolver **不是正交轴**——它们落在和 `code-review` / `gsd-verify-work` 同一个 verify stage,裸 wire 会三重 fire。决议:**当 review 能力的 per-language alias 挂到现有 verify capability 下**(复用 `gsd-debug → /diagnose` alias 模式),由 priority.yaml 仲裁单一 fire。

| alias family | 代表成员 | 挂到 |
|--------------|----------|------|
| per-language reviewer | `ecc:python-reviewer` / `go-reviewer` / `rust-reviewer` | `code-review` / `gstack-review` 的 per-language alias |
| per-language build-resolver | `ecc:rust-build-resolver` / `go-build-resolver` | `gsd-debug` / `diagnose` 的 per-language alias |

**碰撞区 → 默认不 wire(已有 owner):**

| ECC 碰撞 family | 代表成员 | 既有 owner |
|-----------------|----------|------------|
| orchestration | `ecc:plan` / `multi-plan` / `feature-dev` / `multi-execute` / `prp-*` / `plan-orchestrate` | GSD plan/execute + planning-with-files + superpowers:subagent |
| review | `ecc:code-review` / `review-pr` / `quality-gate` / `security-scan` | gstack `/review` `/cso` + code-review plugin |
| learning | `ecc:learn` / `continuous-learning` / `instinct-*` / `evolve` | harnessed Phase 16/17 学习环 + gstack `/learn` |
| multi-agent | `ecc:council` / `team-builder` / `claude-devfleet` / `multi-frontend` `multi-backend` | Agent Teams bucket + superpowers:dispatching-parallel-agents |
| token/compact(Finding 3 拆出) | `ecc:token-budget-advisor` / `context-budget` / `strategic-compact` | harnessed `check-token-budget.ts`(ADR 0017)+ `compact.ts` |

**硬排除清单(永不 wire;keystone state/ledger 引擎,等同 `gsd-execute-phase` 排除;plan-eng-review Finding 2 扩充):**

- `ecc:checkpoint` / `save-session` / `resume-session` / `sessions` — 撞 harnessed checkpoint ledger 引擎(envelope + sub_progress ledger + G6 break-loop + compact)。
- `ecc:recursive-decision-ledger` — 又一个 ledger,撞 checkpoint ledger。
- `ecc:strategic-compact` — 撞 `src/checkpoint/compact.ts`。
- `ecc:context-budget` / `token-budget-advisor` — 撞 `check-token-budget.ts`(ADR 0017)+ state(枚举新增 `context-budget`,§3 token/compact 碰撞区同源)。
- `ecc:continuous-learning` / `continuous-learning-v2` / `instinct-export` / `instinct-import` / `instinct-status` — 持久化学得行为,撞 Phase 16/17 `learnings.ts` 学习环。

这些是 KEYSTONE engine 的并列 owner 风险,硬排除是安全边界。

**ECC 自管理排除类(枚举新发现,2026-06-17;NOT wire——ECC 自身管理,harnessed 用不到):**

- `ecc:configure-ecc` / `ecc-guide` / `ecc-tools-cost-audit` / `skill-comply` / `skill-scout` / `skill-stocktake` — ECC 自身的配置/文档/skill-registry 管理,与 harnessed 的 manifest/capability 体系无关。

### 4. fires_when 轴 = 正交新维度(plan-eng-review 修正:仅 domain/cost/hook 正交)

加性 entry(domain-pattern / cost-report / model-route / hookify)的 fires_when 用 **domain / cost / hook-authoring** 信号——现有 capabilities.yaml 无 entry fire,真零碰撞。domain fact 由子任务 phase fact 注入(sister ADR 0025 § 4)。

**修正(Finding 1)**:`language` 轴**不正交**——per-language reviewer/build-resolver 落在既有 verify/debug stage,故移出加性区,改 alias-收编(见 § 3 alias 表),由 priority.yaml 仲裁单一 fire。

### 5. precedence(priority.yaml)

- orchestration / review 维度:ECC 排在 gstack / gsd / superpowers **之下**(它们是既有 owner;B posture alias-replace 时由 priority.yaml 仲裁)。
- domain / language 维度:**正交新轴,不参与 7 层 tier 竞争**(无人与之争)。

### 6. 流程门(动 manifest 前必过,plan-eng-review Finding 5 修正)

1. gstack `/plan-eng-review` — ✅ 完成 2026-06-17(本 ADR § 审查结论)
2. ECC skill inventory 实测枚举 — ✅ 完成 2026-06-17(本 ADR § 枚举结论,partition 核对 + 3 修正)
3. 本 ADR-0034 Accepted — ✅ 2026-06-17(矩阵锁定)
4. `harnessed manifest-add` EE-5 gate(5 问)— ✅ 完成 2026-06-17(`ecc.ee5-answers.json` PASSED)
5. wire:`ecc.yaml` manifest + capabilities.yaml Bucket 11 + verify alias + guard test — ✅ 完成 2026-06-17(F1 alias 收编;judgments 无需改——alias 即单一 capability,不会三重 fire,故不需 skips_when)

## Plan-Eng-Review 审查结论(2026-06-17)

Eng-manager 审查针对 § 3 de-confliction 矩阵。5 findings,absorb 入上文:

| # | Sev | Conf | Finding | 决议 |
|---|-----|------|---------|------|
| 1 | P1 | 8/10 | 「正交 fires_when 零碰撞」对 per-language reviewer/build-resolver **不成立**——落在和 `code-review`/`gsd-verify-work` 同一 verify stage,会三重 fire | **用户决:alias 收编到 verify 维度**(§ 3 alias 表);从加性区移出 |
| 2 | P1 | 8/10 | 硬排除清单漏 `recursive-decision-ledger` / `strategic-compact` / `continuous-learning(-v2)` / `instinct-*`——同样撞 state/ledger/compact/学习引擎 | 扩排除清单(§ 3 硬排除) |
| 3 | P2 | 7/10 | cost family 没拆——`token-budget-advisor`/`context-budget`/`strategic-compact` 撞 `check-token-budget.ts`+`compact.ts`,非加性 | 拆:加性=cost-report/model-route;碰撞=其余(§ 3 碰撞区) |
| 4 | P2 | 7/10 | 100+ domain skill 全量 wire 不现实(ECC pre-release churn × blast radius) | 初始 cap ≤8 demand-driven(§ 3 cap) |
| 5 | P3 | 6/10 | 门序倒置——partition 基于代表样本就 Accept,EE-5 才发现真清单矛盾 | 接受前插 inventory 枚举步(§ 6 step 2) |

**VERDICT**:ENG REVIEW — issues_found=5,全 absorbed,无 critical gap(无代码,无 silent-failure 风险)。ADR 状态 Proposed → **pending ECC inventory**(Finding 5);枚举 + EE-5 后可 Accept。

**NOT in scope**(显式):ECC orchestration/review/learning/multi-agent wire;C posture;domain-pattern 全量(改 demand-driven ≤8 起步)。

**Outside voice(Codex)**:未跑(Windows 环境 + ADR 非 code plan;可单独 `/codex` 要第二意见)。

## 枚举结论(2026-06-17,Finding 5 gate-2)

实测 `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/`:**246 skills + 61 agents + 76 commands**。按 § 3 partition 逐 family 核对(按 skill/agent 名分类;28 个 verify agent 实测列出,domain 数量为名字一遍估算):

| Bucket | ~数量 | 处置 |
|--------|-------|------|
| 加性 dev domain-pattern(相关) | ~55 | wire ≤8 起步(§ 3 starter-set) |
| 加性但 OUT OF SCOPE(垂直/业务 app) | ~95 | NOT wire(无碰撞,但 dev harness 用户无关) |
| alias-verify(per-language reviewer 18 + build-resolver 10) | ~28 | alias 收编(F1) |
| 碰撞 testing/tdd/verify | ~20 | NOT wire(撞 superpowers:tdd / gsd-verify-work / gstack /cso) |
| 碰撞 orchestration/multi-agent | ~25 | NOT wire(撞 GSD/superpowers/Agent Teams) |
| 硬排除 state/ledger/compact/learning | ~7 | 硬排除(§ 3) |
| ECC 自管理 | ~6 | NOT wire(枚举新发现) |

**3 处 partition 修正(已 absorb § 3)**:
1. `ecc:context-budget` 进硬排除(枚举发现,撞 token budget + state)。
2. domain「~100+」重算为「~55 相关 + ~95 out-of-scope 垂直 app」——加性可 wire 面比原估小,强化 Finding 4 cap。
3. 新增「ECC 自管理排除类」(`configure-ecc` 等 6 个),ADR 原未预见。

**核对结论**:Finding 2 硬排除目标全部实测命中;partition 站得住,3 修正后矩阵锁定。

## Consequences

### Positive

| Benefit | Detail |
|---------|--------|
| 单一路由 SoT 守住 | 碰撞区不 wire → 无并列路由;不变量不破 |
| 立即享 ECC 独有价值 | domain pattern 库 + per-language reviewer/build-resolver 是三层栈完全缺的轴 |
| 零冲突起步 | A posture fires_when 走正交轴,与现有 39+ entry 不撞 |
| keystone engine 受保护 | checkpoint/session 硬排除,checkpoint ledger 引擎唯一 owner |
| 可控升级路径 | B 的每次 alias-replace 走 errata ADR,audit trail 完整 |

### Negative

| Cost | Detail |
|------|--------|
| domain entry 维护量大 | ECC 约 100+ domain skill,Bucket 11 选哪些 wire 需 maintainer curate + 追上游 |
| ECC 升级追踪 | ECC rename skill → 静默破 Bucket 11 entry(sister ADR 0025 static-manifest 固有成本) |
| B 升级判断主观 | 「某 ECC 变体确实更强」需逐个评估,非机械规则 |

### Neutral

| Item | Detail |
|------|--------|
| ECC 安装态 | plugin(marketplace),不 vendor;与 caveman dual-install 不同,ECC 纯 plugin |
| C posture | 不实现,但保留为未来 ADR 选项(双栈对照场景) |
| Bucket 11 entry count | 待 manifest-add 实测枚举;本 ADR 只锁 family + 排除清单,不锁具体 entry 数 |

## References

### 内部依据

- `docs/adr/0025-capabilities-yaml-baseline-static-manifest.md`(capability map static manifest discipline + aliases 收编先例)
- `docs/adr/0016-aliases-deprecation-known-good.md`(alias 机制)
- `docs/adr/0006-three-stack-mechanization-wedge.md`(单一路由 SoT 核心不变量)
- `docs/adr/0024-workflow-schema-v2-capability-abstraction.md`(capability 抽象层)
- `workflows/capabilities.yaml`(Bucket 10 注释 `gsd-execute-phase` deliberately-NOT-wired keystone 排除先例)
- `manifests/skill-packs/gstack.yaml`(ecc.yaml manifest shape 模板)
- `workflows/disciplines/priority.yaml`(7 层 precedence 仲裁)
- `CLAUDE.md` § "gstack 治理关卡"(新功能/复杂架构 plan-eng-review 门)

### 外部参考

- ECC plugin(`ecc@ecc` marketplace,本机 cache `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/`)— skill/agent 面清单(orchestration / review / learning / checkpoint / multi-agent / domain-patterns / language-reviewers / build-resolvers / cost / hookify)

## Implementation Status

**WIRED — A posture 2026-06-17。** 全 5 门通过(plan-eng-review / 枚举 / Accepted / EE-5 / wire):
- `manifests/skill-packs/ecc.yaml`(cc-plugin-marketplace,git_ref ec92b52,stability unstable+warn,schema audit ✓)+ `ecc.ee5-answers.json`(EE-5 PASSED)。
- `workflows/capabilities.yaml` Bucket 11:10 加性 entry(domain starter-8 + `ecc-cost-tracking` + `ecc-hookify-rules`,impl: ecc opt-in 无 presence-check,正交 fires_when domain/cost/hook)。
- Finding 1 alias:`code-review` += `ecc:python-review`/`rust-review`/`go-review`;`gsd-debug` += `ecc:rust-build`/`go-build`/`build-fix`(verify 维度,priority.yaml 仲裁单一 fire)。
- Guard test `tests/workflow/ecc-wiring.test.ts`(6 tests):Bucket 11 正交轴 ECC-exclusive + alias 非并列 entry(F1 单一 fire)+ 硬排除 family 全网不出现(F2 安全边界)。schema check + full suite(1341)绿。

B posture(更多 domain / alias-replace)逐个走 errata ADR(SOP 见下)。

## B-posture 增量 SOP(demand-driven,逐个走)

B 不是批量任务。每个增量 = 一个 ECC 变体在一个具体场景上**有证据**强过现有 owner(或填一个 A 没覆盖的 domain),走以下 6 步。无证据不启动(plan-eng-review Finding 4「incremental, 不过度 wire」+ 本 ADR「by need」)。

1. **Demand signal(硬门)**:必须有实证,不是「ECC 有就接」。两类合法触发:
   - **alias-replace**:dogfood 中某 ECC 变体在某语言/场景明显强过现有 owner(例:「gstack `/review` 在 Rust 上漏了 borrow-checker 类问题,`ecc:rust-review` 抓到」)。记录复现/对比。
   - **domain 扩容**:starter-8 外某 domain 被实际子任务反复需要(例:连续 3 个 phase 碰 `swift`)。
   无证据 → 不启动(透明声明跳过)。
2. **Scope = 1 变体 vs 1 owner**:一个增量只动一个 ECC 变体 + 一个现有 capability。不批量。
3. **errata ADR(ADR-0035+)**:记录 变体名 / 替代或增补的 owner / 证据 / alias 编码 / precedence 决定。本 ADR-0034 main body 不改(frozen),演化进 errata ADR(sister ADR 0025 errata pattern)。
4. **Wire = alias,不是并列 entry**:挂 alias 到现有 capability 的 `aliases:`(F1 模式),**绝不**新增并列 top-level entry(会破单一 fire)。domain 扩容例外:加 Bucket 11 entry(正交轴,同 A)。
5. **守护测试**:扩 `tests/workflow/ecc-wiring.test.ts`——新 alias 进断言 + 硬排除/正交不变量复跑。schema check(`node scripts/check-workflow-schema.mjs`)+ full suite 必绿。
6. **Precedence**:priority.yaml 默认 ECC 在现有 owner **之下**;若 errata 明确证据支持「该场景 ECC 优先」,在 errata 里显式 elevate,否则不动 tier。

**红线**:碰撞区(orchestration/learning/multi-agent)+ 硬排除区(checkpoint/ledger/compact/learning)**永不** B——它们不是「更强的替代」问题,是 keystone 引擎所有权问题。B 只在 review/build/domain 维度动。

## Errata

(none yet)
