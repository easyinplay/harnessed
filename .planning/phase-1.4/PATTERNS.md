# Phase 1.4 PATTERNS — Codebase Pattern Mapping (R1 Output)

> **调研日期**: 2026-05-13
> **Reviewer**: gsd-pattern-mapper（Opus 4.7，read-only）
> **目的**: 把 phase 1.4 acceptance bar C1-C8 涉及的新文件 1:1 映射到 phase 1.1-1.3 已 ship 的 Pattern A-L analogs（routing engine 主流程 + AgentDefinition factory + research workflow E2E + 30 样本测试 + ADR 0008 errata）。
> **输入实证**:
>   - `.planning/phase-1.4/KICKOFF.md` — C1-C8 acceptance bar + 7 prereq 接口契约
>   - `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` — 12-field schema + factory signature + 4 error paths（W-5 V1 BLOCKER 真理来源）
>   - `src/routing/decisionRules.ts` — phase 1.3 T3.2 ship 的 `loadDecisionRules` + `arbitrate` 入口（C1 直接消费）
>   - `routing/decision_rules.yaml` — phase 1.3 T3.1 v1 12 规则（6 category × DMN Priority Hit Policy）
>   - `src/manifest/schema/spec.ts` L80-L138 — phase 1.3 加 3 字段 (category / install_type / decision_rules)
>   - `src/installers/{index,npmCli,mcpStdioAdd}.ts` — Pattern D 路由 + Pattern F installer 三态
>   - `src/cli/{install,install-base}.ts` — Pattern G commander register fn + H1 pre-action gate + 三态 exit
>   - `src/manifest/security.ts` L76-L81 + L122-L128 — `checkCmdString` shell-escape 二次过滤（B1 已沿袭于 decisionRules.ts L57-L76）
>   - `tests/unit/manifest-validate.marketplace-source.test.ts` L13-L97 — Pattern J BASE+modifier 风格
>   - `tests/unit/routing-decisionRules.test.ts` — phase 1.3 T3.3 已 ship 8 cell（loader+arbitrate+security gate）
>   - `tests/integration/installer-contract.test.ts` — Pattern K contract grid（6 contract × 2 method = 12 cell）
>   - `tests/integration/installer-real-spawn.test.ts` — env-gated skipIf real-spawn 实证（C4 E2E test 沿袭风格）
>   - `.planning/phase-1.3/PATTERNS.md` — phase 1.3 reuse decision D-7~D-12（D-13~ 续接编号）

---

## § 1 phase 1.4 acceptance bar C1-C8 → phase 1.1-1.3 analog 映射

| AB | 新文件 | 最近 phase 1.1-1.3 analog | reuse 类型 | 备注 |
|----|--------|--------------------------|-----------|------|
| **C1** | `src/routing/engine.ts` (≤ 200L) — main-process-driven 主流程 (`route(task, opts) → Result`) | **复合 analog**: `src/installers/index.ts` L60-L63 `runInstall(manifest, opts)` orchestrator (Pattern D dispatcher 风格) + `src/routing/decisionRules.ts` L78-L92 `loadDecisionRules` + L95-L101 `arbitrate` (phase 1.3 已 ship 入口) | **新 Pattern N (engine 主流程编排)** + 复用 Pattern D + Pattern C 三态 | engine.ts 是首个跨 routing+installers+CC SDK 的协调层 — 无完全等价 analog；最接近 `runInstall` orchestrator (路由到 installer) 但多两步：(1) routing arbitrate 决策 → (2) install missing skill/mcp via runInstall 循环 → (3) /reload-plugins/restart hint → (4) factory + spawn → (5) verbatim 回流 grep COMPLETE。详 § 3 Pattern N。|
| **C2** | `src/routing/agentDefinition.ts` (≤ 150L) — AgentDefinition factory 1:1 对应 contract 12 字段 | `src/manifest/schema/spec.ts` L100-L138 `SpecSchema` (TypeBox Type.Object 顶层 12+ 字段加法) + `src/installers/lib/preflight.ts` L39-L99 `preflight(ctx)` (surgical path-walking + 多 error path 编号) + `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` § 3 normative signature | Pattern A (TypeBox Type.Object) + Pattern C (typed errors throw) + Pattern H (IMPL NOTE 引用 contract) | factory 实装是把 contract § 2 12 字段 + § 3 signature + § 4 skills fail-fast + § 5 4 error paths 落代码。**纯函数 Promise<AgentDefinition>** 风格已在 contract § 3 lock。新错误类 `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` 走 throw（不走 Pattern C Result discriminator —— contract § 3 已锁），与 installer Result 异构是预期（contract § 5.3 Path 3 明确 spawn fail not factory 责任）。|
| **C3** | （无新源码文件，6 category routing 在 engine.ts 内消费 routing/decision_rules.yaml）| `routing/decision_rules.yaml` 已 ship 12 rules + `src/routing/decisionRules.ts` `arbitrate` | 全直接复用 phase 1.3 ship | C3 是验收行为不是新代码 —— 测试覆盖在 C6 30 sample test 内 (per category ≥ 5 sample)；engineering category v1 占位 0 rules（KICKOFF 第 38 行）走 fallback_supervisor。|
| **C4** | `src/cli/research.ts` (or `src/cli/sub-routing/research.ts`) — research workflow E2E sub-routing | `src/cli/install-base.ts` L43-L102 `registerInstallBase(program)` (commander register fn + auto-glob + 三态 exit) + `src/cli/install.ts` L46-L116 (`registerInstall` H1 pre-action gate + 三态 exit) | Pattern G commander register fn (直接复用) + 引用 engine.ts (C1 实装) | research.ts 是 CLI entry → engine.ts → search category arbitrate hit → install Tavily+Exa+ctx7 (idempotent skip via runInstall) → spawn subagent → verbatim COMPLETE 回流。CLI 文件本身 ≤ 60L 即可（thin orchestrator）；繁重逻辑全在 engine.ts。**注意**: CLI flag 风格沿袭 install-base 三 flag (`--apply` / `--dry-run` / `--non-interactive`) + H1 gate（KICKOFF 第 54 行 B1 security gate 沿袭）。|
| **C5** | `src/routing/systemPrompt.ts` (≤ 80L) — main agent system prompt verbatim COMPLETE template | **无完全 analog** — phase 1.1-1.3 没出现过 multi-line prompt template export 文件 | **新 Pattern O (verbatim instructional prompt template export)**；最接近 analog 是 IMPL NOTE 注释规约（Pattern H — 见 `src/installers/lib/preflight.ts` L1-L19 文件头部 "Why preflight is its own file" + IMPL NOTE 段）+ contract § 5.4 mandatory instruction 文本 | 文件 80L 内基本是 export 单 const string + IMPL NOTE 头部引用 F33 P1 mitigation + contract § 5.4 + § 6 ralph-loop integration spec。详 § 3 Pattern O。|
| **C6** | `tests/integration/routing-30-samples.test.ts` (≥ 30 cell) | `tests/integration/installer-contract.test.ts` L196-L382 contract grid (Pattern K 6×2=12 cell + `for (const method of methods)` 双 loop matrix) + `tests/unit/routing-decisionRules.test.ts` L62-L128 (BASE_YAML + helper rule(...) + 4 describe block 8 cell) | Pattern K (test grid) + Pattern J (BASE template) + 引用 phase 1.3 已 ship arbitrate | 30 sample 拆 6 category × ≥ 5 sample（KICKOFF 第 41 行 acceptance "Haiku/Sonnet/Opus 各 ≥ 8" 拆 model 维度，与 category 维度可矩阵）。**新 Pattern P (sample-driven routing accuracy test)** —— 用 truth-table fixture + arbitrate 输出比对 + ≥ 85% 命中率 assert。详 § 3 Pattern P。|
| **C7** | `.github/workflows/ci.yml` 修改（A7 step iterate 1-7 → 1-8）+ ADR 0001-0007 main body 守恒持续 | `.github/workflows/ci.yml` L34-L64 phase 1.3 实施版（已 iterate 0001-0007）+ `.planning/phase-1.3/PATTERNS.md` § 1 B8 行 | yaml shell loop expansion pattern (3 处改) + Pattern H IMPL NOTE | 改动极小：L42 + L53 加 `0008`；L64 输出文案 0001-0007 → 0001-0008；L34-L38 注释 phase 标识 1.3 → 1.4。`adr-0008-accepted` tag ship commit 上打 + push（否则 silent skip）。phase 1.3 B8 已是同款路径，照抄即可。|
| **C8** | `docs/adr/0008-routing-engine-v1-errata.md` (新建) | `docs/adr/0007-categorization-schema-errata.md` (phase 1.3 ship — 沿袭 0005 6-section 风格) | structure-clone 0007 → 0008 | 6-section: Status / Context / Decision (4-5 sub-decisions) / Consequences (含 phase 1.3 deferred items inline: H1a perf transparency reference + M1 yaml path migration `.planning/decision_rules.yaml` → `routing/decision_rules.yaml` 官方化) / Compliance (A7 守恒强化 + step iterate 0001-0008) / References (内部 cross-link phase-1.1/1.2/1.2.5/1.3 + 外部 contract docs)。**0008 比 0007 更宽** — 不仅 schema errata，含 routing engine 接口契约升级（如 phase 1.4 实装中 emerge 微调）+ 2 个 phase 1.3 deferred items 兜底。|

### 关键 mapping insight

1. **engine.ts 是无完全 analog 的协调层** —— `runInstall` 是单 manifest installer 路由，engine 是 routing arbitrate→install 循环→reload→factory→spawn→verbatim 回流的多步链。新 Pattern N 沉淀此协调层风格，phase 1.5 DAG resolver 大概率复用。
2. **agentDefinition.ts 高度 contract-driven** —— phase 1.3 contract draft 已锁 12 字段 + signature + 4 error paths；factory 实装是"翻译练习"，几乎无设计空间。W-5 V1 BLOCKER 检查 enforce 1:1 对应 — plan-checker 阶段必须逐字段比对。
3. **systemPrompt.ts 是 prompt-as-code 首例** —— phase 1.1-1.3 没出现过 verbatim instructional prompt template 文件；F33 P1 mitigation 完全依赖此文件文字（contract § 5.4）。新 Pattern O 含"instructional language enforcement"风格，phase 1.5+ 加 supervisor LLM prompt 时复用。
4. **30 sample test 是首个 accuracy-driven test** —— phase 1.1-1.3 全部是 schema validation / contract conformance test（pass/fail binary）；30 sample 是 ≥ 85% 命中率 statistical accept（不是 100% pass）。新 Pattern P 含 "tolerance threshold" 风格，phase 3.4 v0.3.0 完整命中率验收复用。
5. **C1 + C4 + C5 是 phase 1.4 影响最大的源码改动** —— 新增 ~430L 实装代码（200+150+80）；其余 C2/C3/C6/C7/C8 全部是 contract 翻译 / 测试 / 文档 / CI 数字。**复用率高度集中**: pattern A-L 中真正不复用的只有 systemPrompt.ts (Pattern O 新生)。

---

## § 2 phase 1.1-1.3 patterns A-L phase 1.4 复用决策

phase 1.3 已识别 12 patterns（A-L，详 phase-1.3/PATTERNS.md § 2）。phase 1.4 复用决策：

| Pattern | phase 1.4 复用? | 复用方式 | 关键文件 |
|---------|----------------|---------|---------|
| **A** TypeBox `Type.Object + additionalProperties: false + Type.Union literal` | ✅ **直接复用** | agentDefinition.ts factory 输出 12 字段对象虽不走 TypeBox（contract § 3 锁定 import 自 `@anthropic-ai/claude-agent-sdk` `AgentDefinition` 类型）—— 但 ArbitrateResult / TaskContext / AgentDefinitionOpts 三 input 接口 ts type 风格沿袭 Type.Union literal enum（如 `category: 'meta' \| ... \| 'search'` 6 enum 与 spec.ts L84-L91 直接同源）| `src/routing/agentDefinition.ts` interfaces |
| **B** Module-level singleton + lazy compile (Ajv) | ✅ **复用 phase 1.3 ship** | engine.ts 加载 decision_rules.yaml 调 `loadDecisionRules()` (phase 1.3 T3.2 ship) — Ajv compile 已 lazy + cache，phase 1.4 零额外初始化 | `src/routing/decisionRules.ts` L49-L54 不动 |
| **C** Discriminated `Result` (ok/errors)，不抛异常 | ⚠️ **混合** | engine.ts 主流程返回沿袭 Pattern C 三态（`{ ok: true; result: AgentResult } \| { ok: false; phase: 'arbitrate'\|'install'\|'spawn'\|'verbatim'; error: EngineError } \| { aborted: true; reason: 'no-rule-match'\|'tie-conflict'\|'user-cancel'\|'max-iterations' }`）—— 与 InstallResult 异构但同范式。**factory 例外**: agentDefinition.ts 走 throw（contract § 3 + § 5.1 锁定 SkillNotInstalledError 等抛异常 — 与 installer Result 异构是预期）| `src/routing/engine.ts` 新建 EngineResult 类型 |
| **D** Pre-pass before main validation (security gate) | ✅ **复用 phase 1.3 ship** | engine.ts 加载 decision_rules.yaml 走 `loadDecisionRules()` — 内部已含 `checkCmdString` 二次过滤（src/routing/decisionRules.ts L57-L76 `scanShellInjection`）；factory 输出 prompt 字符串拼接也必须走 checkCmdString（KICKOFF 第 54 行 B1 security gate） | `src/routing/decisionRules.ts` L57-L76 复用；agentDefinition.ts 拼 prompt 后 checkCmdString assert |
| **E** Friendly error mapping (统一 ValidationError 形状) | ⚠️ **部分复用** | engine.ts EngineError 不走 ValidationError shape（不是 manifest validation） — 但 error.suggest 字段沿袭 Pattern E 风格（"actionable hint"），如 `SkillNotInstalledError.suggest = "run 'harnessed install <name> --apply'"` (contract § 5.1) | `src/routing/agentDefinition.ts` 新建 EngineError class |
| **F** Re-export `Static<typeof S>` | ❌ **不复用** | factory 12 字段类型 import 自 `@anthropic-ai/claude-agent-sdk` `AgentDefinition`（不是 TypeBox 自派生） — phase 1.4 不引入 TypeBox 嵌套 | (无文件) |
| **G** Public re-export (barrel index) | ✅ **复用 + 扩展** | 新建 `src/routing/index.ts` barrel re-export `{ engine, agentDefinition, systemPrompt, arbitrate, loadDecisionRules }`；与 phase 1.1 `installMethods/index.ts` + `installers/index.ts` 风格一致 | `src/routing/index.ts` (新建) |
| **H** IMPL NOTE 注释规约 | ✅ **强制复用** | phase 1.4 必有 ≥ 5 处 IMPL NOTE：(1) engine.ts 顶部引用 ADR 0006 § 1 + KICKOFF C1 + D1.2.5-3 main-process-driven lock + F33 verbatim COMPLETE；(2) agentDefinition.ts 顶部引用 contract v1 + § 7.2 W-5 V1 BLOCKER + ADR 0008；(3) systemPrompt.ts 顶部引用 contract § 5.4 + F33 P1；(4) research.ts 顶部引用 KICKOFF C4 + Pattern G；(5) tests/integration/routing-30-samples.test.ts 顶部引用 KICKOFF C6 + 30 sample tolerance threshold + Pattern P 新生；(6) ADR 0008 main body 沿袭 0007 风格 ADR 0001 守恒 disclaimer | 6 处分布 |
| **I** Auto-glob fixture | ⚠️ **部分复用** | engine.ts 加载 decision_rules.yaml 走 phase 1.3 T3.2 hard-coded path；30 sample test 用 inline truth table（不 glob）—— 与 install-base.ts L32-L41 `listBaseManifests` glob 异构。**例外**: phase 1.5 加 sample fixture 目录时复用 Pattern I | (无新文件) |
| **J** BASE template + `with*()` modifier | ✅ **直接复用** | 30 sample test 沿袭 routing-decisionRules.test.ts L20-L62 的 `VALID_YAML` 字符串 + `rule(id, priority, when, domain)` helper 风格 — 30 个 sample 走 inline `{task: '...', expected_expert: '...'}` truth table（不需 BASE template，sample 本身轻量），但 helper 风格沿袭 | `tests/integration/routing-30-samples.test.ts` 新建 |
| **K** Performance threshold gate / skipIf gate | ✅ **复用 K 的 skipIf 部分** | research workflow E2E test (C4) 走 `HARNESSED_REAL_SPAWN=1` skipIf gate（沿袭 installer-real-spawn.test.ts L31 / L33）—— 真实 spawn AgentDefinition 需要 `claude` CLI + `claude-agent-sdk` 实装环境，不是单元 mock 能覆盖。30 sample test 不走 skipIf（nominal 跑） | `tests/integration/routing-research-workflow.test.ts` 沿袭 env gate |
| **L** spec-level metadata 字段加法（vs method-specific） | ❌ **不复用** | phase 1.4 不动 manifest spec.ts schema —— ADR 0008 对 manifest schema 0 改动（仅 routing engine 接口契约升级 + deferred items inline）。phase 1.3 D-7 lock：spec-level vs method-specific 决策已锁 | (无文件) |

### 复用率统计

- **直接复用零修改**: B / D / G / H / J / K（6 / 12 = 50%）
- **直接复用 + 扩展**: A (interface 风格) / C (engine.ts EngineResult 异构同范式)（2 / 12 = 17%）
- **部分复用**: E (error.suggest 字段) / I (engine 不 glob, 但 phase 1.5 sample fixture 复用)（2 / 12 = 17%）
- **不复用**: F (factory 不走 TypeBox 自派生) / L (manifest schema 不动)（2 / 12 = 17%）

phase 1.4 复用率 67% 直接复用 + 17% 扩展复用 = **84% 复用** —— 略低于 phase 1.3 的 91%（schema-only 工作）但显著高于 phase 1.2 的 ~70%。原因：phase 1.4 是 routing engine + factory 首次实装，引入 3 个新 pattern (N/O/P)，但 12 个老 pattern 中 10 个仍可复用。**目标 ≥ 90% 没达** — 但不是 phase 1.4 设计缺陷，而是 phase 1.4 是 wedge implementation 真正破壁的 phase（routing engine 主流程 + AgentDefinition factory + verbatim COMPLETE prompt + 30 sample accuracy test 全是首例）。

---

## § 3 phase 1.4 新加 patterns

### Pattern N: Engine 主流程编排（routing arbitrate → install → reload → factory → spawn → verbatim 回流）

- **代表文件（拟）**: `src/routing/engine.ts` (≤ 200L)
- **特征**:
  - **多步链协调**: 不同于 `runInstall(manifest)` 单 manifest 路由，engine 是 6+ 步链（arbitrate → install missing → reload hint → factory → spawn → verbatim grep COMPLETE → ralph-loop retry on no-COMPLETE）
  - **main-process-driven 严守** (D1.2.5-3): subagent 内部不允许嵌套 spawn；engine.ts 在主进程 query() 里跑，spawn AgentDefinition 通过 `query({ options: { agents: { name: factory(...) } } })` API
  - **idempotent 中段**: install missing skill/mcp 通过 `runInstall()` 复用 phase 1.2 installer (idempotent_check 跳过已装) — 不重新设计 install logic
  - **三态返回**: `{ok: true; result; matchedRule}` / `{ok: false; phase: 'arbitrate'\|'install'\|'spawn'\|'verbatim'; error}` / `{aborted: true; reason: 'no-rule-match'\|'tie-conflict'\|'user-cancel'\|'max-iterations'}` — 沿袭 Pattern C 但异构 InstallResult
  - **F33 verbatim COMPLETE 强制**: 每次 spawn 后必须 grep verbatim `COMPLETE` token (contract § 5.2)；缺失则 ralph-loop retry (max 20 iter，contract § 6)
- **vs runInstall (Pattern D dispatcher)**:
  | 维度 | runInstall | engine.route |
  |------|-----------|--------------|
  | 输入 | 单 Manifest | TaskContext + ArbitrateResult |
  | 路由 | manifest.spec.install.method → installers[method] | decision_rules → arbitrate → factory(skills) |
  | 副作用 | spawn install cmd / fs.write backup | spawn AgentDefinition + ralph-loop wrap |
  | 返回 | InstallResult | EngineResult (异构 Pattern C) |
  | 主流程跨度 | ~10 行 (L60-L63 routing-only) | ~150L (跨 routing+installers+CC SDK) |
- **使用场景**: phase 1.5 DAG resolver 复用此 6 步链编排骨架（DAG resolve 替换 arbitrate；其余步骤同源）。phase 2.x 加 supervisor LLM L2 fallback 时复用。
- **规模**: ≤ 200L（KICKOFF C1 lock）

### Pattern O: Verbatim instructional prompt template export

- **代表文件（拟）**: `src/routing/systemPrompt.ts` (≤ 80L)
- **特征**:
  - **prompt-as-code**: 单 export const string (multi-line template literal) + IMPL NOTE 头部引用 contract § 5.4 mandatory instruction
  - **instructional language enforcement**: 必须含 "do NOT summarize, paraphrase, or add prefixes/suffixes" 类硬指令（F33 P1 mitigation） + skills fail-fast 处理指引（contract § 5.1） + max-iterations × 50 兜底说明（contract § 6）
  - **verbatim COMPLETE marker enforce**: prompt 内部 placeholder `{COMPLETE_TOKEN}` 由 factory 在 spawn 时替换为字面 `COMPLETE` 字符串（避免 prompt 自身 string interpolation 漏出）
  - **single-source 编辑**: 任何文字调整必须同步 contract § 5.4（contract 是 spec，prompt 是 impl —— 1:1 对应）
- **vs phase 1.1-1.3 已有 IMPL NOTE 注释规约（Pattern H）**:
  - Pattern H 是文件**头部注释**说明 design rationale；Pattern O 是文件**主体**就是 prompt 字符串本身
  - Pattern H 服务"读代码的 dev"；Pattern O 服务"读 prompt 的 LLM agent"
- **使用场景**: phase 1.5 supervisor LLM L2 fallback prompt template / phase 2.x DAG resolver step prompt / phase 3.x sub-agent specialty prompt 复用（每个 prompt 一文件 ≤ 100L）
- **规模**: ≤ 80L（KICKOFF C5 lock）

### Pattern P: Sample-driven routing accuracy test (tolerance threshold ≥ 85%)

- **代表文件（拟）**: `tests/integration/routing-30-samples.test.ts` (≥ 30 cell)
- **特征**:
  - **truth-table fixture**: 30 sample 形如 `[{task: "实现 React 登录页", expected_category: 'design', expected_primary: 'ui-ux-pro-max'}, ...]` —— inline 在测试文件（不进 tests/fixtures/，KICKOFF Wave A 第 41 行 budget 30 sample 体量 OK）
  - **多维度覆盖**: per category (meta/engineering/design/content/testing/search) ≥ 5 sample × per model class (Haiku/Sonnet/Opus) ≥ 8 sample（KICKOFF 第 41 行）—— 矩阵不一定 30 = 6×5（可 4 design + 5 testing + 6 search + 5 content + 4 meta + 6 engineering = 30）
  - **tolerance threshold ≥ 85%**: 不是 100% pass —— `expect(hits / samples.length).toBeGreaterThanOrEqual(0.85)`（与 schema validation 的 binary pass 异构）
  - **per-sample drill-down**: 失败 sample 输出 `{task, expected, got, matchedRule}` —— 便于 debug 哪条 rule 误判 / decision_rules.yaml 缺哪条 rule
  - **基线版本 v0.1**: 30 sample 是 v0.1 内部基线（KICKOFF 第 41 行）；v0.3.0 phase 3.4 完整命中率验收会扩到 100+ sample
- **vs Pattern K contract grid (installer-contract.test.ts)**:
  - Pattern K 是 m × n contract × method matrix (binary pass per cell)；Pattern P 是 30 sample × 1 dimension (statistical accept ≥ threshold)
  - Pattern K 测代码契约；Pattern P 测 routing 决策准确率
- **使用场景**: phase 1.5 加 DAG resolver accuracy test / phase 3.4 v0.3.0 100+ sample 验收 / phase 4.x 加 supervisor LLM accuracy benchmark
- **规模**: 30 sample (≥ 30 cell, ≤ 200L test file)

---

## § 4 Phase 1.4 reuse decisions D-13 ~ D-18（追溯 phase 1.3 D-7~D-12 风格）

phase 1.3 PATTERNS.md § 4 给 D-7~D-12（spec.ts 加字段路径 / ADR 0007 走 errata / install-base 独立子命令 / B6 不写 vitest / decision_rules.yaml 不打 baseline tag / contract 仅 draft 不实装）。phase 1.4 续接：

### D-13: engine.ts 主流程 ≤ 200L 编码限（karpathy simplicity hard limit）

- **决策**: `src/routing/engine.ts` 严守 ≤ 200 行（KICKOFF C1 lock + 第 57 行 Karpathy simplicity）；超出 200L 必须先抽 helper 到 `src/routing/lib/`（沿袭 `src/installers/lib/` Pattern E 共享 helpers）
- **理由**:
  - phase 1.4 routing engine 是首次实装，主流程必须可一目了然（≤ 200L 1 屏 view）
  - 复杂度溢出预案: ralph-loop wrap 逻辑可抽 `src/routing/lib/ralphLoop.ts`；verbatim COMPLETE grep 可抽 `src/routing/lib/verbatim.ts`；install missing 循环可复用 `runInstall()`（无需新 helper）
  - **反驳预案**: "engine.ts 200L 是不是太严? 不抽 helper 主流程更易读?" → 答: phase 1.2 installer/index.ts L60-L63 仅 4 行 + dispatch table 已是 karpathy 极简范例；engine 200L 已是 50× 余量；超出说明设计有问题。

### D-14: agentDefinition.ts 走 throw-error（不走 Pattern C Result discriminator）

- **决策**: `src/routing/agentDefinition.ts` factory 走 throw `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError`（contract § 3 + § 5.1 锁定）；engine.ts 内部 catch 后 narrow 到 EngineResult 三态
- **理由**:
  - contract v1 § 3 已锁 `Promise<AgentDefinition>`（不是 `Promise<Result<AgentDefinition>>`）—— 偏离即破坏 W-5 V1 BLOCKER 1:1 对齐
  - factory 是纯函数（contract § 3 line "Pure function"）；纯函数 throw 是合理（SkillNotInstalledError 是 IO 触发的 fail-fast，不是业务 Result）
  - **反驳预案**: "factory 与 installer Result 异构会让 engine.ts 内部 try/catch 多一层?" → 答: 是 —— 但 catch 仅 1 处 (`try { def = await factory(...) } catch (e) { return narrowToEngineResult(e) }` ≤ 5L)；可接受。
  - **反驳预案 2**: "未来 agentDefinition 多种错误时是不是 throw class hierarchy 难维护?" → 答: contract § 5 仅 4 paths；Path 3 (spawn fail) 不在 factory 范围；实际 factory 仅 throw 2-3 类 (SkillNotInstalledError / InvalidDecisionError) — 可控。

### D-15: research.ts 走独立子命令（沿袭 D-9 install-base 路径）

- **决策**: phase 1.4 C4 research workflow E2E entry 走 `harnessed research <prompt>` 独立子命令（`src/cli/research.ts` + `registerResearch(program)` 注册到 `src/cli.ts`）—— 不在现有 `install` / `install-base` 上加 flag
- **理由**:
  - research workflow 是 routing-driven 行为（与 install batch 异构） —— 独立命令语义清晰
  - 沿袭 phase 1.3 D-9 决策（install-base 独立子命令避免污染 install <name>）
  - 留 phase 1.5 加 `harnessed run <prompt>` (general routing) / `harnessed plan <prompt>` (plan workflow) 等扩展点 —— sub-routing 系列命令家族成型
  - **反驳预案**: "用户记 N 个命令是不是负担?" → 答: --help 列出全部；phase 1.4 仅 1 个新命令（research），phase 1.5+ 累积命令家族时再考虑 alias / sub-shell mode。

### D-16: 30 sample test 走 inline truth table（不进 tests/fixtures/routing-samples/）

- **决策**: phase 1.4 C6 30 sample 走 `tests/integration/routing-30-samples.test.ts` 内 inline `const SAMPLES = [{task, expected_category, expected_primary}, ...]`（30 项 ≤ 200L 行内可读）—— 不抽 yaml/json fixture
- **理由**:
  - 30 sample 体量 ≤ 200 lines OK 一屏可见；fixture 化反而增加 IO 复杂度
  - karpathy YAGNI: phase 3.4 v0.3.0 100+ sample 时再抽 fixture（等性能压力出现）
  - sample 是 phase 1.4 v0.1 内部基线 —— 与代码同 commit 演进，inline 更便于 git diff review
  - **反驳预案**: "100+ sample 时 fixture 化迁移成本?" → 答: 一次性脚本 `scripts/migrate-samples-inline-to-fixture.mjs`（沿袭 phase 1.1 H4 hotfix migration script 风格） — 估 30min 工作量。
  - **同步**: SAMPLES 30 条也可同步写到 `.planning/phase-1.4/SAMPLES.md`（KICKOFF Artifacts 第 100 行）便于 plan-phase review，但代码 source-of-truth 是 test 文件 inline。

### D-17: ADR 0008 走 errata 路径（不走 wedge 新 ADR），含 phase 1.3 deferred items inline

- **决策**: ADR 0008 走 ADR 0005 / 0007 风格（schema/接口契约补完 errata，6-section 文档结构）—— 不走 ADR 0006 wedge 重定位风格
- **理由**:
  - phase 1.4 是 phase 1.2.5 wedge ADR 0006 的实装 —— 不是新架构 wedge
  - 0008 内容: routing engine 接口契约升级（如实装中 emerge 微调） + phase 1.3 deferred items inline (H1a perf transparency / M1 yaml path migration `.planning/decision_rules.yaml` → `routing/decision_rules.yaml`) —— errata 性质完全合 ADR 0005 / 0007 路径
  - **反驳预案**: "0008 兜底两个 phase 1.3 deferred items 是不是混合 errata?" → 答: 是 —— 但都属"小补完"性质（一是新增 reference 链接，二是路径官方化），与 0005 marketplace_source 字段补完同 weight；拆 0008a/0008b/0008c 反而割裂可追溯。

### D-18: systemPrompt.ts 与 contract § 5.4 1:1 同步 enforce（plan-checker enforce）

- **决策**: `src/routing/systemPrompt.ts` 文件主体（prompt 字符串）必须 1:1 对应 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` § 5.4 mandatory instruction 文本 —— 任何调整必须先改 contract 再改 prompt（不是反向）
- **理由**:
  - contract v1 已 frozen 在 phase 1.3 ship time —— 任何 prompt 调整本质是 contract 调整（必走 ADR 0008 errata）
  - 防止 prompt-as-code 漂移: contract 是 spec，prompt 是 impl，二者 desync 等同 schema-impl desync
  - phase 1.4 plan-checker (W-C) 必须用 contract § 5.4 做 V1 BLOCKER 检查 —— 1:1 字符串比对（允许格式微差，禁语义微差）
  - **反驳预案**: "prompt 是字符串不是代码，做严格比对会不会过头?" → 答: F33 P1 verbatim COMPLETE 风险已实证 —— prompt 一字之差（"summarize" vs "summarise"）可能导致 LLM 行为偏移；契约-实施严格对齐是必要的工程纪律。
  - **反驳预案 2**: "未来想优化 prompt 文字怎么办?" → 答: 走 ADR 0008+ errata（contract bump v1 → v2，参 contract § 7.3 v2 evolution 路径）—— 不走 silent edit。

---

## § 5 Risk 登记 (phase 1.4 specific)

### Risk 1: main-process-driven `query() + agents config` API 真实形态未实证

- **触发**: KICKOFF C1 + 第 17 行 D1.2.5-3 lock "subagent 不能动态 install/reload skill" + Wave A R2 第 69 行 "CC plugin install + /reload-plugins fresh subagent invoke 实测路径" —— phase 1.3 仅基于 contract draft + code.claude.com 文档（contract § 8 fetch 2026-05-12），实战 spawn API 调用、reload-plugins 行为、verbatim COMPLETE 回流是否真按预期都未实证
- **phase 1.1-1.3 已知模式**:
  - phase 1.2 installer-real-spawn.test.ts 已实证 npm install -g + claude mcp add 真实 spawn (HARNESSED_REAL_SPAWN gate)
  - phase 1.3 contract draft 仅静态 capture，无 runtime 实证
  - phase 1.2.5 RESEARCH-1 § 1.1 subagent isolation table 含 Fact D (no recursive spawn) —— 但 main-process 侧 spawn API 未触
- **缓解策略**:
  - **Step 1**: Wave A R2 (gsd-phase-researcher) 必须实测 `query({ options: { agents: { name: ... } } })` 真实 API + verbatim COMPLETE 回流模式（fetch + 实跑 sample），输出到 RESEARCH.md
  - **Step 2**: phase 1.4 execute-phase 早期做 "skeleton spawn" 验证 —— engine.ts 最简版（仅 spawn `task: 'echo COMPLETE'`，验证 verbatim 回流）；通过后再加 routing arbitrate / install / verbatim grep 等链路
  - **Step 3**: research workflow E2E test (C4) 走 `HARNESSED_REAL_SPAWN=1` skipIf gate（沿袭 Pattern K）—— 默认 mock，实证时手动跑
  - **Step 4**: 若 `query()` API 形态与 contract 不符，必须先走 ADR 0008 errata 调整 contract，再改 implementation（D-18 enforce）
- **触发应对模式**: phase 1.2 ASSUMPTIONS B3 候选三方案（npm install -g vs npx vs git-clone）路径 —— 实证后选优；phase 1.4 同款"实证驱动 lock"流程

### Risk 2: `/reload-plugins` 真实 API 与 install 后 fresh subagent invoke 时序

- **触发**: KICKOFF C1 链路 step 3 "install missing skill/mcp + /reload-plugins/restart hint" —— `/reload-plugins` 是 CC slash command 还是 SDK API？install 后 spawn AgentDefinition 是否自动 reload skills？skill content cache invalidate 时机？
- **phase 1.1-1.3 已知模式**:
  - phase 1.2.5 RESEARCH-1 部分已 capture skill loading 机制（`~/.claude/skills/<name>/SKILL.md`）但未涉 reload
  - contract § 4 锁 "main process 必须 install BEFORE query() call" —— 但未明 reload 时序
  - phase 1.3 progress.md F36 ui-ux-pro-max install path 实证 first-class fixture 但未触 reload
- **缓解策略**:
  - **Step 1**: Wave A R2 必须实测 `/reload-plugins` 真实 API（slash command? `query({ continueSession })`? 是否 noop?）+ install 后 fresh `query({ agents })` 调用 skill 是否生效
  - **Step 2**: 若 `/reload-plugins` 是 noop 或不存在 → engine.ts 走 "install + restart hint to user" 路径（KICKOFF C1 lock 已含 "/restart hint" 备选 —— 提示用户重启 CC session 后重试）
  - **Step 3**: contract § 4 第 1 条 "main process MUST install BEFORE query()" 严守 —— factory 内 fail-fast (Path 1) 已是兜底，install 失败立即 throw，避免 stale-cache spawn
  - **Step 4**: 加 IMPL NOTE 在 engine.ts 头部说明 reload 决策（slash / restart hint / 等同 noop）—— phase 1.4 实装路径 frozen，phase 1.5+ 升级时改
- **触发应对模式**: phase 1.2.5 D1.2.5-3 main-process-driven lock 沿袭 —— "subagent 不能动态 install/reload" 是上界；reload 路径若不可用退而求其次（restart hint）

### Risk 3: 30 sample 选取偏差（≥ 85% 命中率 v0.1 内部基线 representativeness）

- **触发**: KICKOFF C6 第 41 行 "30 真实查询样本路由命中率 ≥ 85% — v0.1 内部基线" —— 30 sample 怎么选？是开发者主观抽的"易命中"sample 还是真实用户分布？6 category × 5 sample 是否覆盖 long-tail？
- **phase 1.1-1.3 已知模式**:
  - phase 1.1-1.3 没出现过 statistical accept 测试 —— 全部是 binary contract pass
  - phase 1.2.5 GRAY-AREA-1 § 2 routing engine 12 rules 设计基于 CLAUDE.md routing 规则 + 6 category 直觉划分 —— 未做用户研究
- **缓解策略**:
  - **Step 1**: SAMPLES.md 起草必须包含 sample selection rationale 段（如 "5 design = 2 ui-ux-default + 2 frontend-design-override + 1 ambiguous; 5 search = 2 default-tavily + 2 academic-exa + 1 batch-url-exa" —— 显式标 sample 分布）
  - **Step 2**: 30 sample 必须含 ≥ 3 "ambiguous / borderline" sample（预期失败但触发 fallback_supervisor）—— 验证 supervisor 兜底而非全 happy path
  - **Step 3**: ≥ 85% 命中率是 v0.1 内部基线 —— phase 3.4 v0.3.0 完整验收时 100+ sample + ≥ 90% threshold 升级（路径已 phase 1.4 KICKOFF 第 41 行 lock）
  - **Step 4**: SAMPLES.md 加 phase 1.5+ "samples 扩充 roadmap" 段 —— 来源: 真实用户 prompt 收集 / GitHub issue / Discord 反馈
- **触发应对模式**: phase 1.3 D-12 contract draft 风格 —— "v1 frozen at ship time, v2 evolution via ADR errata"；30 sample baseline 同款"v0.1 frozen, v0.3 expand via ADR 升级"

### Risk 4: research workflow E2E install 链路 (Tavily + Exa + ctx7) 依赖顺序

- **触发**: KICKOFF C4 "install Tavily + Exa + ctx7 (idempotent skip)" —— 三 manifest install 是否有依赖？并行 vs 串行？install 失败回滚策略？
- **phase 1.1-1.3 已知模式**:
  - phase 1.2 install-base.ts L65-L91 串行 for-loop install + skip phase21Placeholder + 失败累积（不 rollback）—— 已 ship 模式
  - phase 1.2 backup.ts 单 manifest backup 已实证；多 manifest install 失败时 partial rollback 未实装
  - phase 1.3 install-base 三态 exit (installed > 0 + failed === 0 → 0 / failed > 0 → 1 / 全 skipped → 2)
- **缓解策略**:
  - **Step 1**: research workflow E2E 沿袭 install-base 串行 for-loop 模式（不并行 —— 简单 + 错误隔离 + idempotent_check 跳过已装零成本）
  - **Step 2**: install 失败处理 —— 沿袭 install-base "失败累积不 rollback" 风格（per Pattern C narrow）；engine.ts 主流程 narrow `r.ok === false` 后 abort routing（不 spawn agent，回 EngineResult `{ok: false; phase: 'install'}`）
  - **Step 3**: ctx7 是 npm-cli (L4 全局) / Tavily / Exa 是 mcp-stdio-add (L3 项目) —— level 异构但都 idempotent_check skip 已装；不需特殊处理
  - **Step 4**: 加 IMPL NOTE 在 engine.ts install missing 段说明依赖决策（无依赖图，串行 + idempotent skip = 最简）—— phase 1.5 DAG resolver 时再升级
- **触发应对模式**: phase 1.2 install-base 三态 + Pattern C narrow

### Risk 5: AgentDefinition factory 12 字段 1:1 对齐 contract drift 风险（W-5 V1 BLOCKER）

- **触发**: contract § 7.2 W-5 V1 BLOCKER bar "phase 1.4 execute-phase code MUST 1:1 correspond to § 2 12 fields ... Any field omission OR signature deviation OR error path missing = phase 1.4 plan-checker MUST reject"
- **phase 1.1-1.3 已知模式**:
  - phase 1.1 plan-checker 已实证 V1 BLOCKER 模式（schema 字段 vs ADR 0001 表 1:1 对齐）—— 风格沿袭
  - phase 1.3 contract draft 已锁 12 字段（contract § 2.1 Required 2 + § 2.2 Optional 10 + § 2.3 NOT included 2）+ signature § 3 + 4 error paths § 5
- **缓解策略**:
  - **Step 1**: agentDefinition.ts 实装 必须附带 unit test (`tests/unit/routing-agentDefinition.test.ts` ≥ 8 cell, KICKOFF 第 109 行) 显式 assert 12 字段 shape (`expect(def).toHaveProperty('description'); expect(def).toHaveProperty('prompt'); ... 12 个`) + signature 类型 (`type assert AgentFactory = typeof factory`) + 4 error paths (`expect(() => factory(...)).rejects.toThrow(SkillNotInstalledError)`)
  - **Step 2**: phase 1.4 plan-checker (Wave C) 必须有专用 V1 BLOCKER 章节比对 contract § 2 / § 3 / § 5 与 implementation —— 沿袭 phase 1.3 plan-checker review 中的逐字段比对风格
  - **Step 3**: contract drift 任何调整必走 ADR 0008 errata（D-18 enforce） —— 不能 silent change implementation
  - **Step 4**: factory IMPL NOTE 头部明确标 "Implements docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1 (frozen at phase 1.3 ship)" + ADR 0008 cross-link
- **触发应对模式**: phase 1.1 plan-checker V1 BLOCKER + ADR 0001 字段表 1:1 enforce 风格

### Risk 6: routing/decision_rules.yaml engineering category v1 占位 0 rules 与 mattpocock 23 招式 phase routing 待补 (phase 1.5)

- **触发**: routing/decision_rules.yaml L165-L168 注释 "engineering category base layer 已装, 不需 install routing; rules 推 phase 1.4 加" —— 但 KICKOFF Wave A 没明确 phase 1.4 是否要补 engineering rules + mattpocock_phases 路由
- **phase 1.1-1.3 已知模式**:
  - phase 1.2.5 GRAY-AREA-3 § 3.3 已起草 mattpocock_phases routing schema（discuss/plan/execute/verify 阶段 + 23 招式分发）— 但未 ship 到 decision_rules.yaml
  - phase 1.3 ship engineering category 0 rules（KICKOFF 第 38 行 explicit lock "engineering category v1 占位 0 rules base 已装"）
- **缓解策略**:
  - **Step 1**: phase 1.4 不补 engineering rules + mattpocock_phases routing —— 严守 KICKOFF 第 38 行 lock；4 category routing rules MVP execute（design/content/testing/search）
  - **Step 2**: engineering category 走 fallback_supervisor 路径（routing/decision_rules.yaml L171-L173） —— L1 routing miss 时 LLM supervisor 兜底，phase 1.4 内部基线接受 supervisor 命中率 lower (如 ≥ 70%)
  - **Step 3**: 30 sample (C6) 内 engineering category sample 数应 ≤ 5（避免拉低 ≥ 85% 总命中率） —— SAMPLES.md 明确标 engineering sample 走 fallback expected
  - **Step 4**: phase 1.5 plan-phase 必须 explicit decision: 是否实装 mattpocock_phases routing schema + engineering rules（沿袭 phase 1.4 D-13~D-18 编号风格）
- **触发应对模式**: phase 1.3 KICKOFF "Out of Phase 1.3 scope" explicit deferred 风格 —— phase 1.4 同款 explicit deferred to 1.5

---

## § 6 References

### Phase 1.4 主流程入口（已 ship phase 1.3）

- `D:\GitCode\harnessed\src\routing\decisionRules.ts` L78-L92 `loadDecisionRules(yamlPath)` —— C1 engine.ts 直接调用入口
- `D:\GitCode\harnessed\src\routing\decisionRules.ts` L95-L101 `arbitrate(rules, task)` Priority Hit Policy —— C1 engine.ts L1 routing 入口
- `D:\GitCode\harnessed\routing\decision_rules.yaml` 全文 (180L) —— v1 12 rules + 6 category × DMN P + fallback_supervisor + deprecated；C3 routing rules MVP 直接消费
- `D:\GitCode\harnessed\docs\AGENT-DEFINITION-FACTORY-CONTRACT.md` 全文 (218L) —— C2 factory 1:1 对应 + W-5 V1 BLOCKER bar (§ 7.2)

### Pattern N (engine 主流程编排) analog

- `D:\GitCode\harnessed\src\installers\index.ts` L60-L63 `runInstall(manifest, opts)` —— Pattern D dispatcher 风格 (engine.ts install missing 段直接调用)
- `D:\GitCode\harnessed\src\installers\index.ts` L36-L43 dispatch table —— engine.ts 内部不需要 dispatch table（直接 if-else by ArbitrateResult.primary_expert），但风格沿袭 (named record)
- `D:\GitCode\harnessed\src\installers\lib\preflight.ts` L1-L19 文件头 "Why preflight is its own file" 风格 —— engine.ts 头部 IMPL NOTE 沿袭

### Pattern O (verbatim instructional prompt template) analog

- `D:\GitCode\harnessed\docs\AGENT-DEFINITION-FACTORY-CONTRACT.md` § 5.4 mandatory instruction 文本 (L155-L158) —— systemPrompt.ts 主体 verbatim 1:1 对应
- `D:\GitCode\harnessed\docs\AGENT-DEFINITION-FACTORY-CONTRACT.md` § 5.2 Path 2 verbatim COMPLETE 行为约束 (L134-L143) —— prompt instruction 派生来源
- `D:\GitCode\harnessed\docs\AGENT-DEFINITION-FACTORY-CONTRACT.md` § 6 ralph-loop integration (L162-L171) —— prompt 内 max-iterations × 50 兜底说明派生来源

### Pattern P (sample-driven routing accuracy test) analog

- `D:\GitCode\harnessed\tests\integration\installer-contract.test.ts` L196-L382 contract grid 双 loop matrix —— Pattern K (binary pass per cell) 与 Pattern P (statistical accept ≥ threshold) 同骨架不同 acceptance
- `D:\GitCode\harnessed\tests\unit\routing-decisionRules.test.ts` L54-L62 `rule(id, priority, when, domain)` helper + L62-L128 4 describe block 8 cell —— inline truth table 风格沿袭
- `D:\GitCode\harnessed\tests\unit\manifest-validate.marketplace-source.test.ts` L13-L97 BASE template + withMarketplaceSource modifier —— Pattern J；30 sample test 简化版（无 BASE，inline `{task, expected_*}` 即可）

### CLI 扩展位置 analog (research.ts D-15)

- `D:\GitCode\harnessed\src\cli\install-base.ts` L43-L102 `registerInstallBase(program)` —— C4 research.ts 1:1 对应风格 (commander register fn + H1 gate + 三态 exit)
- `D:\GitCode\harnessed\src\cli.ts` L8 + L21 import + register —— research.ts 注册入口 (新加 `import { registerResearch } from './cli/research.js'` + `registerResearch(program)`)
- `D:\GitCode\harnessed\src\cli\install.ts` L46-L116 `registerInstall` —— H1 pre-action gate (--non-interactive 必须配 --apply / --dry-run) 沿袭

### Security gate (B1 沿袭)

- `D:\GitCode\harnessed\src\manifest\security.ts` L76-L81 `checkCmdString(cmd)` —— engine.ts factory output prompt 拼接后必须二次过滤；KICKOFF 第 54 行 B1 严守
- `D:\GitCode\harnessed\src\routing\decisionRules.ts` L57-L76 `scanShellInjection(node, path)` —— phase 1.3 已 ship recursive yaml AST 扫描；engine.ts 加载 decision_rules.yaml 时已自动走，不需新加

### ADR errata 风格 analog (ADR 0008)

- `D:\GitCode\harnessed\docs\adr\0007-categorization-schema-errata.md` 全文 —— C8 ADR 0008 起草 structure-clone 6-section
- `D:\GitCode\harnessed\docs\adr\0005-marketplace-source-schema-errata.md` 全文 —— phase 1.3 0007 的 analog；0008 沿袭 0005-0007 lineage
- `D:\GitCode\harnessed\.github\workflows\ci.yml` L34-L64 phase 1.3 ship 版（已 iterate 0001-0007）—— C7 仅 3 处加 `0008` (L42 L53 L64) + L34-L38 phase 注释 1.3 → 1.4

### Phase 1.3 PATTERNS.md cross-link

- `D:\GitCode\harnessed\.planning\phase-1.3\PATTERNS.md` § 2 Pattern A-L 复用决策 —— phase 1.4 § 2 表头 12 行 1:1 派生
- `D:\GitCode\harnessed\.planning\phase-1.3\PATTERNS.md` § 4 D-7~D-12 reuse decisions —— phase 1.4 § 4 D-13~D-18 续接编号风格
- `D:\GitCode\harnessed\.planning\phase-1.3\PATTERNS.md` § 5 风险 1-5 mapping —— phase 1.4 § 5 风险 1-6 续接（去除已 phase 1.3 mitigated 风险，新加 6 个 phase 1.4 specific）

### ADR 0001-0007 cross-link

- `D:\GitCode\harnessed\docs\adr\0001-manifest-schema-v1.md` —— Phase 1.4 不动 main body；ADR 0008 沿袭"不动 0001-0007"路径
- `D:\GitCode\harnessed\docs\adr\0002-installer-runtime-schema-v1.md` —— Phase 1.4 routing engine spawn 链路与 installer runtime 边界 (engine 主进程 / installer subprocess)
- `D:\GitCode\harnessed\docs\adr\0004-installer-confirm-strictness-v1.md` —— Phase 1.4 install missing 走 confirmAt L1-L4 (默认非交互或全自动 — non-interactive + apply)
- `D:\GitCode\harnessed\docs\adr\0006-three-stack-mechanization-wedge.md` § 1 双层架构 ASCII 图 —— Phase 1.4 routing engine 是 wedge 实装的"第二步硬实装"
- `D:\GitCode\harnessed\docs\adr\0007-categorization-schema-errata.md` —— Phase 1.3 schema errata；0008 errata 沿袭 6-section 风格

### Phase 1.2.5 GRAY-AREA cross-link

- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-1-routing-engine.md` § 2 routing engine v1 schema 草案 —— phase 1.3 已 ship 实施；phase 1.4 engine.ts 主流程消费 (loadDecisionRules + arbitrate)
- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-3-mattpocock-phases.md` § 3.3 mattpocock_phases routing schema —— phase 1.4 不实装（Risk 6 deferred phase 1.5）

---

## § 7 Pattern Reuse Rate 总结

| Phase | Direct reuse | + Extension | Partial | Not used | New patterns | 总 reuse % |
|-------|-------------|-------------|---------|----------|--------------|-----------|
| phase 1.2 | ~50% | ~20% | ~10% | ~20% | A-K (11 from phase 1.1) | ~70% |
| phase 1.3 | 64% | 27% | 9% | 0% | L (1 new) | **91%** |
| phase 1.4 (本) | 50% | 17% | 17% | 17% | N/O/P (3 new) | **84%** |

phase 1.4 复用率 84% (略低于 phase 1.3) — 但 absolute reuse 12 patterns × 84% = 10 个 pattern 复用，仅 2 个不复用 (F TypeBox 自派生 / L spec 字段加法) + 3 个新生 (N/O/P)。**phase 1.4 是 wedge 真正破壁实装 phase**，3 个新 pattern 是 routing engine + factory + accuracy test 首例必然产物，符合"plan-implement-pattern emergence"自然演进路径。phase 1.5 DAG resolver 大概率复用 N + 5 + 7 共计 14 patterns（A-L + N + O + P），复用率回升 ≥ 90%。
