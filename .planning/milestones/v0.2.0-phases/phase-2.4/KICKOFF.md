# Phase 2.4 plan-phase — KICKOFF

> **Authored**: 2026-05-16
> **Phase**: v0.2.0 Phase 2.4（末 phase）— doctor health check 完整版 + EE-4 plan-checker 量化阈值 ABSORB + dashboard C 路径 FULL absorb + README CI counter gate + ralph-loop Win 兼容验收
> **依赖**: `2.4-CONTEXT.md`（discuss-phase 4 D-决策 D-01~D-04）+ `.planning/intel/omc-comparison.md`（EE-4 PENDING + § 0 SSOT 引用纪律 + v0.2.0+ actionable）+ `.planning/intel/dashboard-handoff-2026-05-16.md` § 3 C 路径 ~160L + `.planning/ROADMAP.md` L113-115 + `.planning/STATE.md` "Phase 2.4 Prereq Notes" 节（L601+）
> **风格沿袭**: phase 1.5/2.1/2.2/2.3 plan-phase Wave 结构（KICKOFF → Wave A R1 PATTERNS + R2 RESEARCH → Wave B ASSUMPTIONS + PLAN + task_plan → Wave C PLAN-CHECK）

---

## § 1 Phase Goal & Scope

### 1.1 Goal

把 v0.2.0 收尾末 phase 装配为 **`doctor` 健康检查完整版 ship + EE-4 plan-checker 4 维量化阈值 absorb + dashboard C 路径 3 子功能 FULL absorb + README CI counter gate（B 路径）+ ralph-loop Windows native 兼容验收 sentinel**。 5 大主题 sister cluster 一次 ship，作为 v0.2.0 milestone 4/4 close（v0.2.0 alpha cycle 收官）。

**doctor 完整版 = MIN 5 check**（D-01）— Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL 校验。 现 `src/cli/doctor.ts` ~38L 扩到 ~150L，沿袭 ROADMAP P2.4 原承诺（jq/Git Bash 探测 + Win bash flavor + origin URL 篡改检）。

**EE-4 ABSORB-2.4**（D-02）— intel L74-82 omo Metis + Momus 双 agent 4 维硬标准（100% file references / ≥80% reference sources / ≥90% concrete acceptance / 0 business-logic assumption）。 落地为 `gsd-plan-checker` agent prompt + 新 `plan-review-schema.yaml` SSOT + ~30L plan-checker 量化输出 + 不达标自动触发 plan-phase 重跑。 与 doctor 项目健康度 sister cluster 语义一致（一个查项目，一个查 plan）。

**dashboard C 路径 FULL absorb**（D-04）— handoff intel § 3 全 ~160L 进 doctor sister cluster：3.1 SessionStart hook auto-install（~30L `src/installers/cc-hook-installer.ts` NEW + dispatch 接入）+ 3.2 STATE.md watcher + WebSocket push（~50L 增 `scripts/dashboard.mjs`）+ 3.3 多项目支持（~80L 左栏 nav + URL routing）。 doctor + dashboard 完整 sister ship，作为 heptagent ADD 形态 ancestor prototype。

**README CI counter gate 走 B 路径**（D-03）— Wave 0 加 CI step：`grep "Phase 2.X shipped" README | wc -l` vs `grep "Acceptance bar X1-X8" README | wc -l` vs L44 counter 三者一致才 PASS（~15L yaml）。 沿袭 Phase 2.2 T0.4 freshness gate pattern，补 counter 维度。 README 用户面 enumeration 保留 visible（非 SSOT 收敛激进路径 a）。

**Wave 0 必办** — STATE.md Phase 2.4 Prereq Notes 全 absorb（H3 README counter / M1 dashboard polish RETRO entry / M2 schemaVersion long-tail land 1 consumer / T2 dashboard C-path 已 D-04 absorb 不重复 / T3 v0.3.0 prep 留尾）+ ralph-loop Win 兼容验收 sentinel + audit 完整版 scope（origin URL 校验 + 模拟恶意 fork 测试）。

### 1.2 In Scope（8 acceptance bar F1-F8 — 详 Wave B ASSUMPTIONS § A）

### F1 — Wave 0 STATE.md prereq backlog 全 absorb 一次根治

H3 README CI counter gate（B 路径 ~15L yaml step）+ M1 dashboard polish round 1 RETRO 历史 cluster 补一句 + M2 schemaVersion 7 surface long-tail land 1 consumer（5 候选中 planner 实占）+ T3 v0.3.0 backlog 预启动注记（不 land）+ deferred-items review 节强化（沿袭 Phase 2.3 T5）。 T2 dashboard C-path D-04 absorb 不重复。 沿袭 Phase 2.1/2.2/2.3 Wave 0 模式（引重但后面净）。

### F2 — doctor 5 check 完整版 ship（MIN scope）

`src/cli/doctor.ts` ~38L → ~150L，5 check 各自独立 method：
1. **Node ≥ 22**：`spawnSync('node', ['--version'])` 解析 semver
2. **MCP scope**：检 `~/.claude/mcp.json` 或 project `.mcp.json` 文件 + scope 字段（user/project/local）
3. **jq present**：`spawnSync('jq', ['--version'])` exit 0
4. **Win bash flavor**：Win 平台下检 Git Bash vs MSYS2 vs WSL（`bash --version` 字符串解析）
5. **origin URL 校验**：`git config --get remote.origin.url` 比对 manifest 期望值（篡改检 — sister to audit 完整版）

每 check 返回 `{ name, status: 'pass'|'warn'|'fail', message, fix? }`，failed/warn 累计后 doctor 整体 exit code 1/0 + JSON output（`--json` flag）。 Karpathy hard limit：`doctor.ts` ≤200L（沿袭 engine/agentDefinition ≤200L 模式）。

### F3 — EE-4 plan-checker 量化阈值 ABSORB（`plan-review-schema.yaml` + agent prompt 改造）

新 `routing/plan-review-schema.yaml`（intel L74-82 4 维原型 formalize）：
- `file_references_verified: 100%`（plan 提及的 file path 100% grep 命中真实文件）
- `reference_sources: >= 80%`（plan 引用的 intel/ADR/RETROSPECTIVE/CONTEXT 文件路径 ≥80% 真实存在）
- `concrete_acceptance: >= 90%`（plan 的 acceptance bar ≥90% 含可量化 signal — 行数/exit code/regex 命中数等）
- `business_logic_assumptions: 0`（plan 无 "assumed X behaves like Y" 类无来源臆测）

`gsd-plan-checker` agent prompt 加 ~30L 量化输出节（输出 4 维 score + BLOCKER/WARNING/PASS 三档：4/4 达标 PASS、3/4 WARNING、≤2/4 BLOCKER 强制重跑 plan-phase）。 不达标自动触发：CI 加 step `node scripts/run-plan-checker.mjs .planning/phase-X.Y/ > .planning/phase-X.Y/plan-check.json`，BLOCKER exit 1。

### F4 — dashboard C 路径 3 子功能 FULL absorb

handoff intel § 3 全 ~160L 进 doctor sister cluster（D-04）：
- **3.1 SessionStart hook auto-install**（~30L）：新 `src/installers/cc-hook-installer.ts`（沿袭 Phase 2.1 6 installer pattern）+ dispatch table 加 entry + manifest `install_type: cc-hook` + dashboard 启动时自动 install hook（首次启动时检 hook 不在 → 提示 + `--install-hook` flag）
- **3.2 STATE.md watcher + WebSocket push**（~50L 增 `scripts/dashboard.mjs`）：`fs.watch('.planning/STATE.md')` + debounce 500ms + WebSocket broadcast 给前端（前端不轮询，event-driven 刷新）
- **3.3 多项目支持**（~80L）：左栏 nav 列 `~/.claude/harnessed-projects.json` 项目列表 + URL routing `?project=<path>` + 项目切换无 reload（client-side route）

3 子功能均 doctor sister cluster 一并 ship（heptagent ADD 形态 ancestor prototype — 一个 ADD wave 装多个 sister 功能）。

### F5 — README CI counter gate（B 路径）+ audit 完整版 + ralph-loop Win 兼容 sentinel

**README CI counter gate**（D-03 B 路径，Wave 0）：~15L yaml CI step，三计数一致才 PASS：
```yaml
- name: README counter integrity gate
  run: |
    SHIPPED=$(grep -c "Phase 2\..*shipped" README.md)
    BARS=$(grep -c "Acceptance bar [A-Z][0-9]" README.md)
    L44=$(sed -n '44p' README.md | grep -oE '[0-9]+/4')
    # 三者解析后比对一致
```

**audit 完整版**：`src/cli/audit.ts`（NEW or 扩 doctor）— origin URL 校验（与 doctor check 5 共享 helper）+ 模拟恶意 fork 检测（manifest 中声明的 upstream repo URL vs 实际 git remote 比对）+ provenance 完整性 check（沿袭 Phase 2.2 `check-provenance.mjs`）。

**ralph-loop Win 兼容 sentinel**：CI matrix Windows native runner 跑 `npm run test:e2e:ralph-loop` 全链路（Phase 2.2 部分覆盖，Phase 2.4 完整 sentinel — 真实 ralph-loop spawn + completion-promise verbatim COMPLETE 检测在 Win bash 下跑通）。 ROADMAP L115 验收 "Windows native CI 跑过 ralph-loop 完整链路" 兑现。

### F6 — Wave 0 + F2-F5 集成 e2e（30-sample like Phase 2.3 sister 风格）

整合验证：30 样本走 doctor → plan-checker → dashboard 完整链路。 不重做 Phase 2.3 30 routing sample（D-05 FRESH-30 已 frozen），Phase 2.4 30-sample = 30 doctor health check fixture（5 check × 6 模拟环境 scenario：clean Linux / clean Mac / clean Win Git Bash / missing jq / wrong Node / tampered origin URL）+ 30 plan-checker fixture（已存 phase plan 跑 plan-review-schema 量化输出 — Phase 1.1~2.3 各 phase plan 实测）。

### F7 — A7 守恒（ADR 0001-0012 main body 0 diff + 新 ADR baseline tag）

Phase 2.3 实占 ADR 0012。 本 phase 新 ADR 走 errata 路径覆盖：doctor schema / EE-4 plan-review-schema / dashboard C 路径 install/state-watch/multi-project / README counter gate / audit 完整版 / cc-hook install_type 字段。 **ADR 编号由本 plan-phase 实占**（沿袭 intel § 0 SSOT 引用纪律 + CONTRIBUTING.md 项目级，**不预占 0013**）。 baseline tag 12 → N（N 实占），ci.yml A7 iter 1-12 → 1-N，ADR 0001-0012 main body 0 diff。

### F8 — ship（3-OS CI 全绿 + v0.2.0 4/4 close milestone tag）

CI 三平台全绿（Wave 0 加固 step 全跑 + ralph-loop Win sentinel 跑通）+ adr-NN-accepted baseline tag（N 实占）+ ci.yml A7 step iter 1-12 → 1-N + ADR 0001-0012 main body 0 diff + v0.2.0-alpha.4-final 候选 milestone tag（v0.2.0 4/4 ship close）+ STATE.md 更新 Phase 2.4 SHIPPED + ROADMAP § v0.2.0 全 4 phase 打 ✅ + v0.3.0 启动 prereq 列表（T3 backlog + plan-feature workflow + checkpoint 启动 cadence）。

### 1.3 Out of Scope（推后续 phase）

| 项 | 推迟到 | Rationale |
|----|-------|-----------|
| T4.4 Task Session 复用 完整版 | v0.3.0 checkpoint | closure infra 三件套 ready（`.planning/phase-2.2/T4.4-DEFERRED-onboarding.md`），Phase 2.4 ship 后 v0.3.0 启动立即 land |
| T1.1 dual-signal 4-layer real-API integration cell | v0.3.0 prep | 需 ANTHROPIC_API_KEY env，real-API e2e |
| EE-2 ECC 9-field manifest schema | v0.3+ 评估 | Phase 2.4 manifest schema 仅加 `install_type: cc-hook` MIN 扩展，不动 9-field |
| EE-1 role-router scoring 中间层 | v0.3+ 路由命中率验收 | 100+ sample × multi-model 验收时 |
| CD-1 handoff 四字段完整模板 | v0.3.0 checkpoint 完整版 | Phase 2.2/2.3 已用模板格式，完整机制 v0.3.0 |
| V-1 动态 model routing | v0.3+ discuss | static model tier 跑通后再考虑升级 |
| V-2 Manual fallback bundle export | v0.4+ | 边界 case wedge 风险警示 |
| plan-feature workflow + checkpoint + 路由命中率验收 + gstack 前缀探测 | v0.3.0 | Phase 2.4 ship 后启动 |
| intel 第 2 条 resolved_routing 快照冻结 | v0.3+ evaluation | karpathy YAGNI — 真实 mid-session drift 出现后再做 |

---

## § 2 Wave 拓扑（预期 — Wave B planner 细化）

```
Wave 0 — STATE.md prereq backlog 全 absorb + 新 ADR draft (F1 + F7 draft)
  ├─ H3 README CI counter gate ~15L yaml step (B 路径)
  ├─ M1 RETRO dashboard polish 历史 cluster 一句补
  ├─ M2 schemaVersion 7 surface land 1 consumer (planner 5 候选选一)
  ├─ T3 v0.3.0 backlog 预启动注记 (不 land)
  ├─ deferred-items review 节强化 (Phase 2.3 T5 沿袭)
  └─ 新 ADR draft (编号 plan-phase 实占, 不预占 0013)
       ↓
Wave 1 — doctor 5 check 完整版 (F2)
  ├─ Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL
  ├─ 每 check 独立 method + 统一 result schema
  └─ --json flag + exit code 0/1 + Karpathy ≤200L
       ↓
Wave 2 — EE-4 plan-review-schema + plan-checker 改造 (F3)
  ├─ routing/plan-review-schema.yaml 4 维 formalize
  ├─ gsd-plan-checker agent prompt ~30L 量化输出节
  └─ CI step run-plan-checker.mjs + BLOCKER exit 1
       ↓
Wave 3 — dashboard C 路径 3 子功能 FULL absorb (F4)
  ├─ 3.1 SessionStart hook auto-install (cc-hook-installer.ts NEW + dispatch)
  ├─ 3.2 STATE.md watcher + WebSocket push (dashboard.mjs ~50L)
  └─ 3.3 多项目支持 (左栏 nav + URL routing ~80L)
       ↓
Wave 4 — audit 完整版 + ralph-loop Win 兼容 sentinel (F5)
  ├─ README CI counter gate B 路径 ship (Wave 0 中已 draft, 此 wave verify CI 跑通)
  ├─ audit 完整版 (origin URL + 模拟 fork + provenance)
  └─ ralph-loop Win matrix sentinel (CI Win native runner e2e)
       ↓
Wave 5 — 30-sample integration e2e (F6)
  ├─ 30 doctor health check fixture (5 check × 6 env scenario)
  ├─ 30 plan-checker fixture (Phase 1.1~2.3 plan 跑量化输出)
  └─ 全链路 e2e (doctor → plan-checker → dashboard 多项目 + STATE watcher)
       ↓
Wave 6 — ship + v0.2.0 4/4 close (F8)
  ├─ CI 三平台全绿 + Wave 0 加固 step 全跑 + Win sentinel 跑通
  ├─ adr-NN-accepted baseline tag (N 实占)
  ├─ ci.yml A7 iter 1-12 → 1-N
  ├─ ADR 0001-0012 main body 0 diff verify
  ├─ v0.2.0-alpha.4-final 候选 milestone tag
  └─ ROADMAP § v0.2.0 4 phase ✅ + STATE 更新 + v0.3.0 启动 prereq
```

**Wave 0 必须最先** — STATE.md prereq backlog 不解，后续 wave CI 不稳。 Wave 1（doctor）+ Wave 2（plan-checker）可并行（无 schema 依赖冲突）。 Wave 3（dashboard C 路径）依赖 Wave 1 doctor 完成（dashboard 与 doctor sister cluster ship，dashboard 启动时 doctor 触发）。 Wave 4 audit 完整版 sentinel 依赖 Wave 1 doctor origin URL check helper 复用。 Wave 5 integration 必依赖 Wave 1-4 全完成。

---

## § 3 Hard Constraints（不可违反）

1. **A7 守恒** — ADR 0001-0012 main body 0 diff；Phase 2.4 新 ADR 走 errata 路径（不动旧 ADR）；ship 时 baseline tag 12 → N（N 实占）；ci.yml A7 step iter 1-12 → 1-N；`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动
2. **ADR 编号不预占**（intel § 0 SSOT 引用纪律 + CONTRIBUTING.md 项目级） — 本 phase 一切文档（KICKOFF/PATTERNS/RESEARCH/ASSUMPTIONS/PLAN/task_plan）写 "新 ADR（编号 plan-phase 实占）" 或 "新 ADR errata"，**不写 ADR 0013**（写作惯例）；plan-phase Wave 6 ship 时 git mv / new file 决定实际编号
3. **TypeBox not zod** — schema 改动用 `@sinclair/typebox` `Type.*`；沿袭 ADR 0010/0011/0012 errata 注释块 fence 模式；`plan-review-schema.yaml` 用 yaml SSOT + TypeBox runtime validate；`install_type: cc-hook` 字段 TypeBox enum 加项
4. **doctor MIN 5 check 严守**（D-01 Karpathy YAGNI） — 不预先加 weekly cron / upstream_health / plugin uninstall 4 步 fallback（ROADMAP P2.4 这些项 v0.3+ 评估，Phase 2.4 MIN 5 check 已兑现核心承诺）；`doctor.ts` ≤200L
5. **EE-4 plan-checker schema 单一 SSOT**（D-02） — `routing/plan-review-schema.yaml` 唯一来源；不开第二来源（避免 plan-checker / manifest 双源不一致）；`gsd-plan-checker` 一致 consume；不预先抽 plan-review 分层中间层
6. **README enumeration 保留 visible**（D-03 B 路径） — 不走激进路径 a（README enumeration 收敛到 STATE.md 删 README 冗余）；CI counter gate 只校验三计数一致，不强制 enumeration 内容
7. **dashboard C 路径 FULL absorb 不拆**（D-04） — 3 子功能（3.1 hook + 3.2 watcher + 3.3 多项目）整 Wave 3 一次 ship；不允许 split 推 Phase 2.5（v0.3.0 已启 plan-feature 主线，dashboard C 路径再推会失去 sister cluster 语义）
8. **Karpathy simplicity hard limit 继承** — `engine.ts` ≤200L / `agentDefinition.ts` ≤200L / `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L / `promiseExtract.ts` ≤50L / 新 `doctor.ts` ≤200L / 新 `cc-hook-installer.ts` ≤100L；新文件超 hard limit 必须 spillover to lib/
9. **A8 LF line endings** — 所有新文件 LF；Win 测试需 Git Bash；新 `plan-review-schema.yaml` + `cc-hook-installer.ts` + `doctor.ts` 扩展 + dashboard.mjs 全 LF
10. **A7 ADR 0001-0012 全 baseline tag 不动 main body** — Phase 2.4 ship 时只新增 ADR + iter 1-12 → 1-N，不修旧 ADR 任何 main body 行

---

## § 4 Wave A 研究分工

research refresh 范围：Phase 2.4 主决议（doctor MIN 5 check / EE-4 ABSORB / README B 路径 / dashboard C 路径 FULL）已 4 D-decisions D-01~D-04 锁（2.4-CONTEXT.md），Wave A 聚焦 **剩余不确定**：

### R1 (gsd-pattern-mapper → PATTERNS.md)

doctor 5 check + EE-4 schema + dashboard C 路径 3 子功能 + 新代码文件 → existing analog mapping。 重点：
- `src/cli/doctor.ts` 5 check 各 method → analog: 现 doctor.ts ~38L baseline + `spawnSync` 模式（Phase 2.1 git-clone-with-setup 用过）+ Phase 2.2 check-provenance.mjs `git config --get` 模式
- `routing/plan-review-schema.yaml` 4 维 → analog: Phase 1.5 v2 `routing/decision_rules.yaml` 段 schema + Phase 2.3 CD-3 optional fields + intel L74-82 omo Metis/Momus 原型
- `gsd-plan-checker` agent prompt ~30L 量化输出 → analog: 现 gsd-plan-checker BLOCKER/WARNING/SUGGESTION 三档 + Phase 2.3 EE-5 5-question gate prompt 模式
- `src/installers/cc-hook-installer.ts` NEW → analog: Phase 2.1 6 installer dispatch（npx-skill-installer 最近似形态）+ install_type 字段 + provenance 4 字段约束
- `scripts/dashboard.mjs` STATE.md watcher + WebSocket → analog: 现 dashboard.mjs baseline + Node `fs.watch` + 简易 WebSocket（ws npm 包或原生 http upgrade）
- `src/cli/audit.ts` NEW or 扩 doctor → analog: doctor.ts 5 check 共享 helper + Phase 2.2 check-provenance.mjs 模式
- README CI counter gate ~15L yaml → analog: Phase 2.2 T0.4 freshness gate yaml step 模式

### R2 (gsd-phase-researcher → RESEARCH.md)

3 项 fresh research（主决议 D-01~D-04 已锁不重做）：

1. **dashboard C 路径 3 子功能 wave 拓扑细化** — 能否 Wave 3 内 3 子功能（3.1 hook + 3.2 watcher + 3.3 多项目）clean split 为 3 sub-task 并行 OR 必须串行（3.1 hook 先 → 3.2 watcher 用 hook trigger → 3.3 多项目复用 hook + watcher）。 评依赖关系 + Wave 3 时间预算（~3 sub-task × 0.5d ≈ 1.5d 并行 OR 1.5d 串行），给 plan-phase 推荐拓扑
2. **EE-4 plan-review-schema 量化阈值实测候选** — intel L74-82 给原型（100% / ≥80% / ≥90% / 0），但 Phase 1.1~2.3 现存 plan 实测会有多少落 BLOCKER（≤2/4） vs WARNING（3/4） vs PASS（4/4）。 跑 1-2 plan 试跑（如 phase-2.3/task_plan.md）出 baseline 分布 + 调整阈值候选（若现存 plan 普遍 ≤2/4 则 BLOCKER 阈值过严，需放宽）
3. **ralph-loop Win 兼容验收 sentinel scope** — Phase 2.2 已部分覆盖（spawn cross-platform），Phase 2.4 完整 sentinel 范围 — CI matrix Windows native runner 跑哪些 e2e（最小：1 ralph-loop spawn + COMPLETE 检测；完整：30 sample 走 main agent + subagent + ralph-loop 全链路）；给 plan-phase 推荐 scope（推 MIN 走 5 fixture sample，不重做 Phase 2.3 30 sample）

intel directive（EE-4 PENDING ABSORB + 新 ADR errata 路径）已 D-02 + F7 锁不重做。 STATE.md prereq backlog 5 项细则（H3/M1/M2/T3 + deferred-items review 强化）由 planner 实占。

---

## § 5 预算

- **plan-phase**: ~2-3h（Wave A 并行 R1+R2 ~45min / Wave B planner ~60min / Wave C plan-checker ~30min — Phase 2.4 task 数估 ~20-26 子任务，介于 Phase 2.1 的 23 与 Phase 2.3 的 ~28 之间，MIN scope discipline 控制 + 5 大主题 sister cluster 复用减重复）
- **execute-phase**: ~6-8 工作日（Wave 0 prereq + ADR draft ~1d / Wave 1 doctor 5 check ~1d / Wave 2 plan-checker schema + 改造 ~1d / Wave 3 dashboard C 路径 3 子功能 ~2d / Wave 4 audit + Win sentinel ~1d / Wave 5 integration ~1d / Wave 6 ship + v0.2.0 close ~0.5d）
- 沿袭 phase 1.5/2.1/2.2/2.3 batch 节奏（PP cadence — push + 并行 batch executor；期望 Wave 0/1/2 同 batch，Wave 3 单 batch（dashboard 3 子功能并行），Wave 4/5 同 batch，Wave 6 final ship + v0.2.0 close）

---

## § 6 phase 2.4 vs phase 2.3/v0.3.0 边界

| 维度 | phase 2.3（已 ship） | phase 2.4（本 phase）| v0.3.0（next） |
|------|---------------------|---------------------|-----------------|
| workflow | extension category MVP + karpathy 注入引擎 ✅ | doctor 完整版 + EE-4 plan-checker absorb + dashboard C 路径 absorb + Win sentinel | plan-feature workflow + checkpoint |
| schema | decision_rules 三 category 段 + CD-3 ✅ | plan-review-schema.yaml 4 维 + install_type: cc-hook 字段 | task_session_id field bump |
| ADR | ADR 0012 单一覆盖 Phase 2.3 全决策 ✅ | 新 ADR（编号 plan-phase 实占，不预占 0013）| 新 ADR plan-feature |
| installer | 6 method dispatch frozen + extension category 5 NEW adapter ✅ | + cc-hook 第 7 method（dashboard 3.1 SessionStart hook） | （frozen）|
| skill 注入 | karpathy-baseline.md SKILL-ONLY ✅ | （不动） | （不动） |
| gate | EE-5 5-question merge gate 双层 ✅ | EE-4 4 维 plan-checker 量化 BLOCKER + README CI counter gate | 路由命中率验收 ≥ N% |
| doctor | — | **5 check MIN + audit 完整版 + ralph-loop Win sentinel** | （frozen） |
| dashboard | dashboard baseline 0b4e76d NEW + 161621c polish ✅ | + C 路径 3 子功能（SessionStart hook + STATE watcher + 多项目）| 多项目跨 phase 历史 view |
| sample 命中 | 30 category-specific routing ≥85% ✅ | 30 doctor fixture + 30 plan-checker fixture | 100+ sample × multi-model 验收 |
| milestone | v0.2.0 3/4 ship | **v0.2.0 4/4 close + v0.2.0-alpha.4-final** | v0.3.0-alpha.1 |

---

**phase 2.4 KICKOFF complete** — Wave A（R1 PATTERNS + R2 RESEARCH 并行，带 anti-stall 约束）启动准备。 v0.2.0 alpha cycle 末 phase，ship 后 v0.3.0 plan-feature workflow + checkpoint 启动。
