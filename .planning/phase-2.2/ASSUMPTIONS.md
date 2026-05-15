# Phase 2.2 — ASSUMPTIONS

> **Authored**: 2026-05-15
> **Author**: gsd-planner (Wave B)
> **Sources**: `KICKOFF.md` § 1-6 / `2.2-CONTEXT.md` D-01~D-15 + delta D-16~D-18 / `PATTERNS.md` D-WP-1~D-WP-7 / `RESEARCH.md` D2.2-1~D2.2-7 / `.planning/research/v0.2.0-execute-task-ralph.md` HIGH conf / `.planning/intel/omc-comparison.md` 第 4 条 + CD-5(L149-157) + CD-6(L159-167) + CD-4(L139-147)
> **Style**: 沿袭 phase 1.5 / 2.1 ASSUMPTIONS.md(§ A acceptance-bar status table + § B decision lock 合并 + § C risks 一行 mitigation + § D references)

---

## § A — F1-F8 Acceptance Bar Status Mapping

| Bar | What it asserts | Source artifact | Status entering plan-phase | Mapped Wave |
|-----|-----------------|-----------------|-----------------------------|-------------|
| **F1** | Wave 0 transparency 一次性根治:`ENFORCE=true` + 全 13 verdict 文档 marker 合规 + freshness ext 扩展(README/PROJECT-SPEC `Status:` marker) | `scripts/check-transparency-verdicts.mjs` + `.planning/**/PLAN-CHECK\|VERIFICATION\|*-AUDIT.md` × 13 + `README.md` + `docs/PROJECT-SPEC.md` | INFRA ready(Phase 2.1 T1.7);marker 0/13 合规;ENFORCE=false;freshness ext 未实装 | **Wave 0** |
| **F2** | 单 ADR errata draft 覆盖 Phase 2.2 全决策(SDK 引入 + ralph-wiggum keep + dual-signal + contract v1.2 + per-phase model tier + Wave 0 transparency + delta CD-5/CD-6/CD-4)— **编号 plan-phase 实占** | `docs/adr/0011-*.md` | NEW;编号由本 plan-phase 实占(intel § 0 SSOT 引用纪律,不预占)；本 plan / task_plan / ASSUMPTIONS 一律写 `0011` | **Wave 0**(draft)→ **Wave 6**(accepted + baseline tag) |
| **F3** | SDK 引入:`@anthropic-ai/claude-agent-sdk` 版本复核 + `outputFormat` × `agents`-map 组合 spike + SC4 session resume API verify(delta D-18)+ package.json + lockfile + 3-OS CI verify | `package.json` + `package-lock.json` + `scripts/spike-outputFormat-agents.mjs`(throwaway,**not committed** per D2.2-5)+ `ci.yml` 3-OS 矩阵 | NOT started;SDK 未引入;spike 未跑;research § 4 open question 未 verify | **Wave 1** |
| **F4** | agentFactory contract v1.2 reconcile + dual-signal completion 4-layer 实装(D2.2-4)+ schemaVersion 7 surface 引入(delta D-16) | `src/routing/agentDefinition.ts` + `src/routing/lib/sdkReconcile.ts`(NEW per D-WP-5)+ `src/routing/lib/ralphLoop.ts` + `src/routing/lib/promiseExtract.ts` + `src/routing/completionSchema.ts`(NEW)| 14 字段 v1.1 现存;`toSdkAgentDefinition` / `injectFactoryInternalFields` / 4-layer `isComplete` 未实装 | **Wave 2** |
| **F5** | per-phase model tier schema:`workflows/<name>/phases.yaml` schema + 4 phase 默认表 + `--model-tier inherit` CLI flag + agentFactory 读 `phase.model` | `src/workflow/schema/phases.ts`(NEW per D-WP-1)+ `src/workflow/loadPhases.ts`(NEW)+ `workflows/execute-task/phases.yaml`(NEW)+ `src/cli/execute-task.ts` --model-tier 解析 | NOT started;phases.yaml schema 不存在;commander flag 未加 | **Wave 3** |
| **F6** | ralph-loop full integration:`engine.route()` spawn placeholder → SDK `query()` real;`ralphLoopWrap` callback 升级接 SDK;verbatim COMPLETE 回流 + provenance gate 启动前必上(delta D-17)+ Task Session 集成 conditional(delta D-18 SC4 pass branch) | `src/routing/engine.ts`(替 `defaultSpawn`)+ `src/routing/lib/sdkSpawn.ts`(NEW)+ `src/routing/lib/ralphLoop.ts`(升级接 resumeSessionId)+ `provenance.schema.json`(NEW)| 现 placeholder 抛 'engine.defaultSpawn is a placeholder';SDK 真接入未做 | **Wave 4** |
| **F7** | execute-task CLI 10th register fn + 4-phase chain orchestration + 30 子任务 SAMPLES.md COMPLETE 100% 准确 | `src/cli/execute-task.ts`(NEW)+ `src/cli.ts`(register)+ `.planning/phase-2.2/SAMPLES.md`(NEW,30 sample,沿袭 phase 1.4 R3 frozen)+ `tests/cli/execute-task.test.ts`(NEW) | NOT started | **Wave 5** |
| **F8** | Ship:3-OS CI 全绿 含 transparency ENFORCE=true 实测 + ADR baseline tag `adr-0011-accepted` + `ci.yml` A7 iter `1-10 → 1-0011` + ADR 0001-0010 main body 0 diff + `v0.2.0-alpha.2-execute-task` 候选 tag | `ci.yml` + git tag + `.planning/STATE.md` + `RETROSPECTIVE.md` 续编 | NOT started | **Wave 6** |

---

## § B — Consolidated Decision Locks

合并三处来源:**CONTEXT D-01~D-18**(discuss-phase 锁 + 2026-05-15 delta)+ **PATTERNS D-WP-1~D-WP-7**(pattern-mapper 提案 → plan-phase 决)+ **RESEARCH D2.2-1~D2.2-7**(researcher 决议)。同号但跨来源不同语义(如 RESEARCH 内部用 `D2.2-1` 指代 SDK introduction 的本地 ID,与 CONTEXT D-11 同决议)— 此处统一 → CONTEXT 主、RESEARCH 补、PATTERNS 提案选项。

### B.1 SDK & spawn

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-01** | 14 字段 `AgentDefinition` 类型不变(harnessed-internal contract);query() 调用前 unpack 4 字段(`description`/`prompt`/`tools`/`model`)作 SDK 物理 input;其余 10 字段 prompt-inject | CONTEXT D-01 |
| **B-02** | completion = **4-layer dual-signal**(RESEARCH § 1.3 refine CONTEXT D-02):outer PRIMARY(`outputFormat: json_schema` → `SDKResultMessage.structured_output.status === 'COMPLETE'`)+ outer FALLBACK(`<promise>COMPLETE</promise>` extract on `result.result`)+ inner PRIMARY(subagent `<promise>` grep)+ inner FALLBACK(`Task` tool_use `subtype === 'success'`) | CONTEXT D-02 → RESEARCH D2.2-4(refine) |
| **B-03** | SDK reconcile flow:Wave 1 first action = `npm view @anthropic-ai/claude-agent-sdk version`(复核 0.2.141 vs 已升,research valid ~2026-06-15)+ 对照 installed `.d.ts` 重验 14→4 字段映射;contract v1.2 reconcile 走 ADR errata(D-09 单一 ADR) | CONTEXT D-03 |
| **B-04** | `@anthropic-ai/claude-agent-sdk` INTRODUCE NOW — phase-1.5 deferral 触发条件已满足(real spawn + dual-signal completion 都被它 hard-block) | CONTEXT D-11(research v0.2.0 closed) |
| **B-05** | `ralph-wiggum` 官方 plugin **不切换**;`ralphLoopWrap` 自实装是**永久架构** — 官方 plugin interactive-TUI-Stop-hook-only + jq 依赖撞 Win 红旗 | CONTEXT D-12(R6 closed) |
| **B-06** | Wave 1 SDK `outputFormat`+`agents`-map 组合 spike(`scripts/spike-outputFormat-agents.mjs`)是**throwaway,NOT committed** — 决策用,non-shipping | RESEARCH D2.2-5 |
| **B-07** | 若 Wave 1 spike 揭示组合不兼容 → degraded fallback Tier A(outer schema keep + inner `<promise>` grep 接管 subagent completion)→ Tier B(outer demote 到 `<promise>` grep)→ Tier C 不会出现(`promiseExtract.ts` 32L 已 ship,功能完整);**no Wave 1 BLOCKER** | RESEARCH § 1.5 + D2.2-4 |

### B.2 per-phase model tier

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-08** | `workflows/<name>/phases.yaml` schema 加 `model:` **必填字段**(execute-task 主流程 phase 静态标 model) | CONTEXT D-04 |
| **B-09** | 4 phase 默认表(intel 第 4 条):01-clarify=`opus`/`sonnet` / 02-code=`sonnet` / 03-test=`sonnet`/`haiku` / 04-deliver=`haiku` | CONTEXT D-04 + intel 第 4 条 |
| **B-10** | `--model-tier inherit` CLI flag override 逃生口(`harnessed execute-task <name> --model-tier inherit` 不读 `phase.model`,继承调用方 model) | CONTEXT D-04 |
| **B-11** | GSD `/gsd-set-profile`(orchestration agent model)与 harnessed model tier(spawn subagent model)**namespace 独立**,文档明示 | CONTEXT D-05 |
| **B-12** | `agentFactory` 读 `phase.model` 填入 `AgentDefinition.model` — zero new engine(intel "zero new engine" 理念) | CONTEXT D-06 |
| **B-13** | phases.yaml schema 位置 = **(b) 新文件 `src/workflow/schema/phases.ts`**(职责清,与 manifest spec.ts 并列);loader = `src/workflow/loadPhases.ts`(沿袭 `loadManifest.ts` pattern) | PATTERNS D-WP-1 → **PLANNER LOCK** |

### B.3 transparency 一次性根治(Wave 0)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-14** | `scripts/check-transparency-verdicts.mjs` 顶 const `ENFORCE = true`(W3 lock 解除) | CONTEXT D-07a |
| **B-15** | 全 13 verdict 文档迁移 = **manual 1-by-1**(10 ADD + 3 REPAIR — 1.5 PLAN-CHECK / v0.1.0 MILESTONE-AUDIT / 2.1 PLAN-CHECK),NOT 批量 script — 13 文件 human-judgment(real N count + miss list)dominate work,automation 仅省 ~10% 时间却付 ~2h 维护 | CONTEXT D-07b + RESEARCH D2.2-2 + PATTERNS D-WP-3 |
| **B-16** | freshness check 具体形态 = **(b) 结构化 `Status:` marker** convention(README/PROJECT-SPEC 头部加 1 行 `> **Status:** v0.1.0 shipped + Phase 2.1 shipped — Phase 2.2 (in-progress)`),gate 扩展 `check-transparency-verdicts.mjs` ~25L | CONTEXT D-07c + RESEARCH D2.2-3 + PATTERNS D-WP-4 |
| **B-17** | `STATUS_MARKER` regex 容忍 optional `>` blockquote prefix + optional `**` bold(沿袭 verdict-marker regex tolerance) | RESEARCH D2.2-7 |
| **B-18** | `ENFORCE = true` flip 是**独立 atomic commit**(在 13-file 迁移 commit 之后,easy revert if migration miss) | RESEARCH D2.2-6 |
| **B-19** | Wave 0 必须最先(在 SDK/model tier 实装 wave 之前)— 保 CI 不 red on gate violations 后续 wave | CONTEXT D-08 |

### B.4 ADR & A7

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-20** | **独立 1 个 ADR** 覆盖 Phase 2.2 全决策(沿袭 phase 1.4 ADR 0008 多决策合并 errata 模式)— 内部 **9 章节**(原 6 + delta 3):① SDK 引入 ② ralph-wiggum keep ③ dual-signal completion 4-layer ④ contract v1.2 reconcile ⑤ per-phase model tier schema errata ⑥ Wave 0 transparency CI gate flip + freshness ext ⑦ SchemaVersion 单一兼容门(B-32)⑧ Provenance gate hard fail(B-33+B-34)⑨ Task Session 复用 conditional(B-35+B-36) | CONTEXT D-09 + D-16~D-18 + PATTERNS D-WP-7 |
| **B-21** | ADR 编号**由 Phase 2.2 plan-phase 实占**(intel § 0 + Phase 2.1 T1.9 CONTRIBUTING.md 项目级 SSOT 引用纪律)— 本 phase 一切文档写 `0011` 或 "ADR errata(编号 plan-phase 实占)"。**禁写 `ADR 0011`** | CONTEXT D-10 + intel § 0 |
| **B-22** | A7 守恒持续:ADR 0001-0010 main body **0 diff**;新 ADR 走 errata 路径(不动旧 ADR);ship 时 baseline tag `1-10 → 1-0011`;CI `ci.yml` A7 step iter 同步;`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动(contract v1.2 reconcile 走 ADR errata inline 注释) | CONTEXT D-15 + KICKOFF § 3.1 |

### B.5 Karpathy hard limits & file split

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-23** | 5 hard limit 严守:`engine.ts` ≤200L / `agentDefinition.ts` ≤200L(H3 errata cap)/ `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L 主体(D1.4-3 + 1.5.1 enforced)/ `promiseExtract.ts` ≤50L;超 hard limit 必须 spillover to `lib/` | KICKOFF § 3.5 |
| **B-24** | `agentDefinition.ts` 现 191L + 加 2 reconcile fn ≈ +30-40L 预计超 200L → **split 到 `src/routing/lib/sdkReconcile.ts`**(沿袭 Phase 1.5 `promiseExtract.ts` split 模式) | PATTERNS D-WP-5 → **PLANNER LOCK** |
| **B-25** | `engine.ts` 现 199L + SDK spawn 替换约 +60L 预计超 200L → **split sdkSpawn 到 `src/routing/lib/sdkSpawn.ts`**(NEW,~80L);engine.ts 仅保留 orchestration 三层 fallback + injection seam | KICKOFF § 3.5 + 推理 |
| **B-26** | `ralphLoop.ts` 升级加 `resumeSessionId` 闭包 + JSON envelope `isComplete` ≈ 42L → ~48L,**仍 ≤50L** — 守住 D1.4-3 lock,无需 split | PATTERNS § 2.2 |
| **B-27** | `systemPrompt.ts` 53L 加 `COMPLETION_SCHEMA` const export + 1 段 prompt append ≈ +25L → ~78L,**仍 ≤80L** — 守住 hard limit,无需 split | PATTERNS § 2.3 + 推理 |

### B.6 CLI / workflow / SAMPLES

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-28** | `execute-task` workflow CLI 唯一入路 = `harnessed execute-task <name>`(D-WP-2 选项 a)— SKILL.md `trigger_phrases` 仅 forward-looking 文档,**实装(GSD orchestration 自动召唤)推 Phase 2.3 extension category** | PATTERNS D-WP-2 → **PLANNER LOCK** |
| **B-29** | 30 子任务 SAMPLES.md 选取(D-WP-6) = phase 1.4 SAMPLES.md 30 sample 中**复用 15 + 新增 15 execute-task 专属**(覆盖:4-phase chain 各 phase trigger × 4 + ralph-loop max-iter 退场 × 3 + structured_output PRIMARY vs FALLBACK 路径 × 4 + dual-signal degraded path × 2 + 异常路径 × 2) | PATTERNS D-WP-6 + phase 1.4 R3 frozen rationale |
| **B-30** | TypeBox not zod — schema 改动用 `@sinclair/typebox` `Type.*`;沿袭 Phase 2.1 ADR 0010 errata 注释块 fence pattern;每 schema 改动行加 `// ADR 0011 errata — <topic> (phase 2.2 W<N> — F<N>)` | KICKOFF § 3.3 + PATTERNS § 3.2 |
| **B-31** | A8 LF line endings — 所有新文件 LF;Win 测试需 Git Bash;`gitCloneWithSetup` Phase 2.1 已实证 PATH_A+B 双 OK,新 SDK call 路径同 Win 兼容验证(Wave 1 spike Win 跑 + Wave 6 CI 3-OS) | KICKOFF § 3.8 |

### B.7 Discuss-phase delta locks（2026-05-15 — CD-5 / CD-6 / CD-4 absorbed)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-32** | **CD-5 FULL schemaVersion scope** — 7 surface 列表:① routing snapshot ② handoff doc ③ phases.yaml ④ manifest state ⑤ installer state ⑥ route decision log ⑦ checkpoint;naming 约定 `harnessed.<surface>.v1`(e.g. `harnessed.routing-snapshot.v1`);3 rules:(a) consumer 必须 branch-on-version,(b) 未知 enum 值 graceful degrade(不 fail),(c) 新字段必须 nested(不能 top-level)。**Wave 2 SDK contract v1.2 reconcile 同步引入** | CONTEXT D-16 + intel CD-5(L149-157)+ DISCUSSION-LOG delta gray area 5 |
| **B-33** | **CD-6 BEFORE-W4 provenance schema** — `provenance.schema.json` ~5KB JSON schema,4 字段:`source`(curated/learned/imported/evolved 等产源 enum)、`created_at`(ISO timestamp)、`confidence`(0-1 float)、`author`(string)。**Wave 4 ralph-loop integration 启动前必上(hard gate prereq)**;hard fail enforcement(CI red 如 runtime artifact 缺 sibling `.provenance.json`) | CONTEXT D-17 + intel CD-6(L159-167)+ DISCUSSION-LOG delta gray area 6 |
| **B-34** | **CD-6 enforce path** — composition skill + installer 加 lint check;runtime artifact(routing 决策日志 / handoff doc / failed-route 记录 / checkpoint 修复 / session learnings)必须 sibling `.provenance.json`,否则 hard fail(commit/CI red)。**CI integration**:Wave 4 启动前 `scripts/check-provenance.mjs`(或扩展 existing transparency gate)加 enforce step;3-OS sentinel | CONTEXT D-17 + intel CD-6 + DISCUSSION-LOG delta gray area 6 |
| **B-35** | **CD-4 PIGGY-W1 SDK verify branch** — Wave 1 spike(T1.1 / T1.2)加 **SC4** success criterion:verify `@anthropic-ai/claude-agent-sdk` 是否暴露 session resume API(查 `.d.ts` `resume?: string` option on `query()` + 实测 spike call 真能 resume 同 session)。**Branch outcome**:① SC4 pass → Wave 4 ralph-loop integration 集成 `task_session_id`(优先 resume 同 session);② SC4 fail → CD-4 加入 deferred(v0.3.0 checkpoint 完整版),Phase 2.2 不实装、不动 phase manifest schema | CONTEXT D-18 + intel CD-4(L139-147)+ DISCUSSION-LOG delta gray area 8 |
| **B-36** | **CD-4 conditional schema** — phase manifest schema **条件性**修改:① SC4 pass → 加 `task_session_id?: string`(optional field)到 phase manifest TypeBox schema + executor 优先 resume 逻辑(Wave 4 集成);② SC4 fail → 不动 schema,不引入字段,功能 deferred。**Wave 0 T0.2 ADR draft 写 conditional 决策语义**;Wave 1 T1.2 SC4 跑完后,Wave 2 schemaVersion 7 surface 列表如包含 phase manifest 也需 conditional reflect(SC4 pass 才加 task_session_id field) | CONTEXT D-18 + intel CD-4 + DISCUSSION-LOG delta gray area 8 + B-35 piggy |

### B.8 RESOLVED conflict chain notes

- **D2.2-1 (RESEARCH 内部 ID) vs D-11 (CONTEXT)** — 两者同决议(SDK INTRODUCE NOW),RESEARCH 内部 ID 仅章节定位用;**统一以 CONTEXT D-11 为主 lock,B-04 引用**
- **D-07c CONTEXT (Claude's Discretion: planner 决具体形态) → RESEARCH § 3 三候选评估 → 推荐 (b) 结构化 marker** — 决策链 RESOLVED:CONTEXT 留给 planner,RESEARCH 决候选,plan-phase 锁定 **B-16 = RESEARCH 推荐**(原因:架构一致性 + karpathy simplicity + 零 false-positive)
- **D-07b CONTEXT (全史迁移做法) → RESEARCH § 2.2 三候选评估 + PATTERNS D-WP-3 三候选** → 一致推荐 **manual 1-by-1**(B-15)— 三处来源完全一致,无冲突
- **agentDefinition.ts 是否 split 到 sdkReconcile.ts** — CONTEXT 未指定(planner discretion),PATTERNS D-WP-5 推荐 split,RESEARCH 未涉及 — **B-24 = PATTERNS 推荐 LOCK**(原因:Karpathy 5 hard limit 严守 + sister phase 1.5 split 模式已验证)
- **phases.yaml schema 位置** — CONTEXT 未指定,PATTERNS D-WP-1 推荐 (b) 新文件,RESEARCH 未涉及 — **B-13 = PATTERNS 推荐 LOCK**(原因:do-one-thing-well + spec.ts 已 190L 临界)
- **30 sample 来源** — CONTEXT 留给 planner(R3 frozen 风格),PATTERNS D-WP-6 提案 15+15 — **B-29 = PATTERNS 推荐 LOCK**
- **delta CD-5 / CD-6 / CD-4** — 2026-05-15 user 锁定 FULL / BEFORE-W4 / PIGGY-W1 三决策(DISCUSSION-LOG delta);ADR 0011 章节 6 → 9 扩展;B-32~B-36 5 lock 加入;**no cross-source conflict**(delta 是 net-add,无覆盖原 lock 语义)

**No unresolved cross-source conflicts.** All decision chains converge.

---

## § C — Risk Register

| ID | Risk | Severity | Mitigation(one-line) |
|----|------|---------|----------------------|
| **R1** | Wave 1 SDK spike 揭示 `outputFormat` + `agents` 组合不兼容(joint usage ctx7 未文档化,RESEARCH A1 标 LOW) | MEDIUM | Degraded fallback Tier A 已 verified functional(B-07)— spike 即使失败,`<promise>` grep 接 subagent inner layer + outer 退到 `<promise>` 即可,**non-blocker**;Wave 1 task 含 fallback path 直接编译 |
| **R2** | `agentDefinition.ts` split 到 `lib/sdkReconcile.ts` 时 import 循环(`lib/sdkReconcile` import `agentDefinition` 又被 `agentDefinition` 间接消费) | LOW | sdkReconcile 单向 import AgentDefinition type only(no runtime helper);agentDefinition 不 import sdkReconcile;Wave 2 task 含 `tsc --noEmit` verify |
| **R3** | 13 verdict 文档 manual migration 漏文件(B-15 manual,无 batch 检查) | LOW-MEDIUM | Wave 0 task 顺序:① 跑现 gate 列出全部 violation(包括 `walk()` 实际扫到的 list)→ ② 1-by-1 修复 → ③ 再跑 gate(此时 ENFORCE 仍 false)expect 0 violation → ④ atomic commit `ENFORCE=true` → ⑤ 再跑 expect 0;**每步 verify 都 grep-checkable** |
| **R4** | `ENFORCE=true` flip 后 CI red(后续 wave 任何 commit 含未补 marker 的新 verdict 文档)| MEDIUM | Wave 0 必最先(B-19);Wave 1-6 任何新增 `PLAN-CHECK\|VERIFICATION\|*-AUDIT.md` 必须含 marker 行(execute-phase 模板加约束);Wave C plan-checker 自身的 PLAN-CHECK.md 也必 marker compliant |
| **R5** | ADR 编号实占冲突(plan-phase 实占 N 时,git 上已有 N - 即并发其他 phase 占了)| LOW | Wave 0 task 第一步 `ls docs/adr/` + 取 `max(NNNN) + 1`(沿袭 intel § 0 SSOT 引用纪律 + CONTRIBUTING.md 项目级约定);**单线性顺序** — solo 开发无并发风险 |
| **R6** | `ralph-loop` Win32 spawn 兼容性(R5.3 partial,Phase 2.4 全兼容)— SDK `query()` Win spawn 行为未实证 | LOW-MEDIUM | Wave 1 spike Win 实跑(B-31);Wave 6 CI 3-OS 矩阵 sentinel;LF line endings(B-31);若 Win spike 失败 → 升级到 Phase 2.4 ralph-loop Win compat task batch 优先级(本 phase 仍 ship,partial R5.3) |
| **R7** | **delta CD-5 schemaVersion 7 surface 一次性 retrofit 工作量低估**(B-32)— routing snapshot / handoff doc / phases.yaml / manifest state / installer state / route decision log / checkpoint 7 surface 字段位都需要 schema 修改 | LOW-MEDIUM | Wave 2 executor 视具体实施(TypeBox schema vs convention-only doc)定;**fallback**:若 7 surface 一次性引入超 Wave 2 预算,可分批 — 关键 4 surface(routing snapshot / phases.yaml / manifest state / installer state)Wave 2 必做,其余 3 surface(handoff doc / route decision log / checkpoint)Wave 5 / 6 补;**non-blocker for Wave 2**(B-32 列表是 scope guide 不是 commit) |
| **R8** | **delta CD-6 provenance gate 误伤 curated artifact**(B-33+B-34)— composition skill 已 ship 的 curated artifact 也被 hard gate 扫到 → CI red | LOW | Wave 4 T4.0 executor 实施 gate 时 scope **限定 runtime artifact path**(e.g. `.harnessed/sessions/**` `.harnessed/checkpoints/**`);curated path(`workflows/**/SKILL.md` `manifest.yaml` 等)不扫;**fallback**:若 scope 仍误伤,加 explicit allowlist regex(沿袭 transparency gate `walk()` pattern) |
| **R9** | **delta CD-4 SC4 verify 不确定性**(B-35)— `@anthropic-ai/claude-agent-sdk` `.d.ts` 可能含 `resume?: string` 但 runtime 行为不符合 omo task_session 语义(只能 resume conversation 不能 resume agent context) | LOW | SC4 判定 colon-test:① `.d.ts` 含 `resume` option(necessary)② spike 实测 resume 后 agent state 真的保留(`memory` 字段、tools 状态、conversation history 全 carry)(sufficient);若 ① pass ② fail → 仍 deferred(SC4 fail,B-36 第二分支);Wave 1 T1.2 executor 决判定颗粒度 |

---

## § D — References

### D.1 In-phase 上游产出
- `.planning/phase-2.2/KICKOFF.md` — § 1-6(F1-F8 + Wave 拓扑 + 8 hard constraint + R1/R2 分工 + 预算 + 边界)
- `.planning/phase-2.2/2.2-CONTEXT.md` — discuss-phase 4 灰色地带 + 15 D-决策 + delta D-16~D-18 + canonical refs
- `.planning/phase-2.2/2.2-DISCUSSION-LOG.md` — 4 gray area alternatives + delta gray area 5~8 alternatives(CD-5 / CD-6 / EE-4 / CD-4)
- `.planning/phase-2.2/PATTERNS.md` — 9 file analog mapping + ~62% reuse + 7 D-WP proposals
- `.planning/phase-2.2/RESEARCH.md` — 3 focused topics + 7 D2.2-* decision locks + assumption log A1-A4

### D.2 Carry-forward 主依据
- `.planning/research/v0.2.0-execute-task-ralph.md` — SDK INTRODUCE + ralph-wiggum keep + dual-signal v1 + 5-phase orchestration + reject list(HIGH conf,2026-05-15,valid ~2026-06-15)
- `.planning/intel/omc-comparison.md` — 第 4 条 per-phase model tier intel actionable + § 0 SSOT 引用纪律 + delta-absorbed items:CD-5(L149-157)、CD-6(L159-167)、CD-4(L139-147)、EE-4 deferred(L74-82)
- `.planning/ROADMAP.md` v0.2.0 Phase 2.2 — Goal + 必含项 + 验收 5 项 + 关键风险

### D.3 Frozen 接口契约(本 phase 升级或消费)
- `src/routing/engine.ts` 199L — Pattern N(待替 `defaultSpawn` placeholder)
- `src/routing/agentDefinition.ts` 191L — 14 字段 v1.1(待 reconcile + helper split 到 lib/sdkReconcile.ts)
- `src/routing/systemPrompt.ts` 53L — verbatim COMPLETE marker(待 +schema const + prompt 段)
- `src/routing/lib/ralphLoop.ts` 42L — `ralphLoopWrap` ≤50L wedge(D1.4-3 lock 守住)
- `src/routing/lib/promiseExtract.ts` 32L — FALLBACK 路径不动
- `src/routing/decisionRules.ts` + `routing/decision_rules.yaml` v2 — arbitrate + `mattpocock_phases:` 段
- `src/installers/index.ts` — Phase 2.1 ship 6 method dispatch table
- `src/cli/research.ts` 93L — phase 1.4 9th register fn(execute-task.ts COPY scaffold)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 217L+ — main body 不动(A7 守恒,reconcile 走 ADR errata)
- `docs/INSTALLER-CONTRACT.md` — ADR 0004 6 契约
- `src/manifest/schema/spec.ts` 190L — TypeBox spec.ts(workflow phases.yaml schema 沿袭 pattern,L23-35 TypeEnum 模式)

### D.4 Infra(Phase 2.1 T1.7 ship,本 phase Wave 0 flip)
- `scripts/check-transparency-verdicts.mjs` 45L — line-prefix marker scan + regex L14-16
- `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 103L — marker 约定 + checklist
- `.planning/STATE.md` item 19 + item 21 — Wave 0 必办来源

### D.5 Milestone refs
- `.planning/v0.1.0-MILESTONE-AUDIT.md` — R6.1-R6.5 execute-task requirements coverage
- `.planning/phase-2.1/2.1-CONTEXT.md` D-08 — Phase 2.2 ADR 暂记 0011 仅参考(以 plan-phase 实占为准)
- `.planning/phase-1.4/SAMPLES.md` — R3 frozen 30 sample selection rationale(B-29 复用 15)

---

*phase 2.2 ASSUMPTIONS.md complete — § A 8 acceptance bars mapped to 7 Wave / § B 36 lock 全消化 7 来源(CONTEXT 18 incl delta + PATTERNS 7 + RESEARCH 7 + intel 4 incl CD-5/CD-6/CD-4 + KICKOFF 1 + planner inference 0 conflict)/ § C 9 risk 全 mitigation(R1-R6 + delta R7-R9)/ § D references full chain.*
