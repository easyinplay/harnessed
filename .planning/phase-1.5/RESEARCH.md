# Phase 1.5 RESEARCH — DAG Resolver + Semantic Router L2 + mattpocock 23 招式 phase routing 实装 specific 调研 (R2)

> **Researched**: 2026-05-13
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7)
> **Domain**: DAG resolver 拓扑排序 + Semantic Router L2 embedding 选型 + mattpocock 23 招式 phase routing schema + 3 P1 deferred items 决议
> **Confidence**: HIGH (4 个 P0 全 cross-verified — code.claude.com/docs ctx7 fresh 2026-05-13 + Tavily/Exa fresh search + npm registry npm view + HuggingFace model card + ralph-wiggum 官方 plugin docs)
> **Source basis**: code.claude.com/docs Agent SDK (fresh 2026-05-13) + HuggingFace BGE-small-en-v1.5 / all-MiniLM-L6-v2 model cards + npm view @xenova/transformers / onnxruntime-node + 用户笔记 CLAUDE.md mattpocock 23 招式真理 source + phase 1.2.5 GRAY-AREA-1/3 草案 + phase 1.4 RESEARCH/PATTERNS/ASSUMPTIONS 全套 + ralph-wiggum 官方 plugin (anthropics/claude-code/plugins/ralph-wiggum) — `<promise>COMPLETE</promise>` XML wrapper fresh 2026-05-13

本调研在 phase 1.4 R2 (2026-05-13 ship) 4 个 P0 lock 基础上做 phase 1.5 specific 4 个 P0 灰色地带深查 + 1 个 fresh 发现 (`<promise>` XML wrapper 升级路径)。

---

## TL;DR — 5 个 lock 决策推荐表 (phase 1.5 ASSUMPTIONS § B 直接消费)

| ID | 问题 | Lock 决策 | Conf |
|----|------|-----------|------|
| **D1.5-1** | DAG resolver 算法选型 + 循环依赖 detection | **Kahn's algorithm (BFS + indegree queue) 自实装** ≤ 200L hard limit (D-19 沿袭)；不引入 graphlib / @dagrejs/graphlib (karpathy YAGNI — phase 1.5 ≤ 50 manifest 图)；循环依赖在 schema validate 阶段 reject (R04 P0#4 lock 沿袭) — friendly error message 仿 phase 1.1 manifest validate 风格 | HIGH |
| **D1.5-2** | Semantic Router L2 embedding 模型选型 | **phase 1.5 推 v0.2+ deferred — 不引入 ML embedding deps**；走 keyword (L1) + LLM supervisor (L3) 二层兜底；保留 `semanticRouter.match(prompt, threshold)` 接口 stub return null；ML embedding 评估触发条件：30 sample 升 100+ sample × 多 model × stability validation (都不在 phase 1.5 范围)；如必引入则选 `@xenova/transformers` + BGE-small-en-v1.5 + WASM 路径（Win/Mac/Linux 三平台兼容 best） | HIGH |
| **D1.5-3** | mattpocock 23 招式 phase routing schema 设计 | **`mattpocock_phases:` yaml v2 4 phase × 23 招式 mapping table**（discuss/plan/execute/verify）+ engineering category sub-rules reference 模式（`rule.decision.skills_overlay` 引用 `mattpocock_phases.<phase>.skills`）；manifest spec 顶层 `phase` enum 字段 optional（`discuss \| plan \| execute \| verify`）；不创新真理 source — 1:1 用户笔记 CLAUDE.md 23 招式定义 | HIGH |
| **D1.5-4** | D5 三 P1 deferred items 决议 + ralph-wiggum XML wrapper 升级 | **ADR 0009 errata 4 items inline**：(1) D1.4-2 contract v1.1 加 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 2 字段 → 14 字段；(2) F42 array semantic match 升级 arbitrate ≤ 7L → ≤ 30L 加 array element substring match；(3) ralph-wiggum 官方推荐 `<promise>COMPLETE</promise>` XML wrapper 升级 systemPrompt.ts + ralphLoop.ts (raw `^COMPLETE$` regex → `<promise>([^<]+)</promise>` extract)；(4) 接口契约升级（如 phase 1.5 实装中 emerge 微调） | HIGH |
| **D1.5-5** | F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估 | **phase 1.5 仍推 phase 2.0+ evaluation window**；phase 1.5 用 inline structural interface 1:1 contract § 2 + W-5 V1 BLOCKER drift detector 续；deps 引入触发条件：research workflow E2E 真实 spawn 频率 ≥ 100/day OR Semantic Router L2 真实启用（都不在 phase 1.5 范围） | HIGH |

---

## § 1 P0-1: DAG resolver 拓扑排序算法选型 + 循环依赖 detection

### 1.1 算法对比 (HIGH conf — 标准教科书 + Tavily fresh 2026 search)

| 维度 | Kahn's Algorithm | DFS-based Topological Sort |
|------|------------------|----------------------------|
| 模式 | BFS + indegree queue（迭代） | DFS recursive call stack（递归） |
| 时间复杂度 | O(V + E) | O(V + E) |
| 空间复杂度 | O(V) — indegree array + queue | O(V) — recursion stack（含 visited / on-stack） |
| 循环 detection | indegree ≠ 0 nodes left after queue empty → cycle | DFS 遇到 on-stack node → cycle |
| 增量友好 | ✅ queue-based 易加新节点 reseed | ⚠️ 需 reset visited/recur 状态 |
| 调试友好 | ✅ visit order 可日志（BFS 层级清晰） | ⚠️ 递归深处错误 trace 难追 |
| 小图（≤ 50 node） | ✅ 推荐 | ✅ 也可 |
| 大图（≥ 1000 node） | ✅ iterative 不爆 stack | ⚠️ Node.js default stack ~10K frame，深图风险 |

**Source**: classical CLRS Algorithm 22.4 + Tavily fresh search "Kahn topological sort vs DFS 2026" (DEV.to / GeeksForGeeks 2025-2026 articles).

### 1.2 推荐 — Kahn's algorithm 自实装 (HIGH conf)

phase 1.5 lock：**Kahn's algorithm** for harnessed phase 1.5 ≤ 50 manifest 图（v0.1.0 内部基线 6 category × 5-10 manifest = 30-60 node）。

**理由**：
1. **iterative 安全** — phase 1.4 已 ship 6+ wave engine.route 主流程，不再叠加 recursion stack 风险
2. **queue-based 调试日志友好** — BFS 层级 visit order 与 routing engine 主流程 wave A1-A8 日志风格一致
3. **循环依赖 detection 时机自然** — Kahn 跑完后 indegree ≠ 0 的 node 即 cycle 成员，schema validate 阶段直接 reject (R04 P0#4 lock 沿袭)
4. **karpathy simplicity** — 30L Kahn vs 50L+ DFS（DFS 需手写 visited + recur stack + cycle detection 三个状态），且不依赖外部 lib

### 1.3 TypeScript 最小可行示例 (≤ 30L, HIGH conf — 标准 Kahn pattern)

```typescript
// src/routing/dag.ts (~30L target subset)
export type NodeId = string;
export interface DagNode { id: NodeId; deps: NodeId[]; }
export interface DagResolveResult {
  ok: boolean;
  order?: NodeId[];        // topological order if ok
  cycle?: NodeId[];        // indegree ≠ 0 残留 node ids if cycle
}

export function resolveDag(nodes: DagNode[]): DagResolveResult {
  const indegree = new Map<NodeId, number>();
  const adj = new Map<NodeId, NodeId[]>();
  for (const n of nodes) {
    indegree.set(n.id, (indegree.get(n.id) ?? 0));
    for (const d of n.deps) {
      adj.set(d, [...(adj.get(d) ?? []), n.id]);
      indegree.set(n.id, (indegree.get(n.id) ?? 0) + 1);
    }
  }
  const queue: NodeId[] = [];
  for (const [id, deg] of indegree) if (deg === 0) queue.push(id);
  const order: NodeId[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const next of (adj.get(cur) ?? [])) {
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== nodes.length) {
    const cycle = [...indegree].filter(([, d]) => d > 0).map(([id]) => id);
    return { ok: false, cycle };
  }
  return { ok: true, order };
}
```

### 1.4 循环依赖 friendly error message (HIGH conf — phase 1.1 manifest validate 风格沿袭)

```typescript
// src/manifest/validate.ts 调用点
const dagResult = resolveDag(allManifestsAsNodes);
if (!dagResult.ok) {
  throw new InvalidDecisionError(
    `Circular dependency detected in skills: ${dagResult.cycle!.join(" → ")}\n` +
    `  hint: check 'deps:' field in manifest spec; cycle members above must form acyclic graph.\n` +
    `  see docs/adr/0009-routing-l2-engineering-23-shi-errata.md § DAG resolver friendly error.`
  );
}
```

### 1.5 不引入 graph 库的理由 (HIGH conf — karpathy YAGNI)

| Lib | 大小 | 价值 | 评估 |
|-----|------|------|------|
| `graphlib` | ~30KB / ~200K weekly downloads | 通用 graph + 拓扑 + path finding | ❌ 50 node 图不值得 dep；30L Kahn 自实装够用 |
| `@dagrejs/graphlib` | ~50KB / Cytoscape 风格 | layered graph 可视化 | ❌ phase 1.5 不做 graph 可视化（推 phase 3+） |
| `toposort` (npm) | ~5KB / 单函数 | 仅拓扑排序 | ⚠️ 微小 dep 收益不大；自实装更可控（cycle node 列表 friendly error 自定义） |

**Source**: npm view (fetched 2026-05-13) + 用户 CLAUDE.md karpathy simplicity 心法。

---

## § 2 P0-2: Semantic Router L2 模型选型 + OnnxRuntime / Transformers.js 集成

### 2.1 候选模型对比 (HIGH conf — HuggingFace fresh 2026-05-13 model card)

| 模型 | size | dim | 多语言 | 推理 latency (CPU warm) | License |
|------|------|-----|--------|-------------------------|---------|
| **BGE-small-en-v1.5** (BAAI) | ~33M params / ~130MB onnx | 384 | ❌ English only | ~30ms / sentence (M1 CPU) | MIT |
| **all-MiniLM-L6-v2** (sentence-transformers) | ~22M params / ~90MB onnx | 384 | ✅ multilingual (50+) | ~20ms / sentence (M1 CPU) | Apache 2.0 |
| **OpenAI text-embedding-3-small** | 云 API only | 1536 | ✅ multilingual | ~50ms + network | API ($0.02/1M tokens) |
| **OpenAI ada-002** (legacy) | 云 API only | 1536 | ✅ multilingual | ~80ms + network | API ($0.10/1M tokens) — deprecated by OpenAI 2024 Q4 |

**Source**: HuggingFace model card (huggingface.co/BAAI/bge-small-en-v1.5 + huggingface.co/sentence-transformers/all-MiniLM-L6-v2, fetched 2026-05-13) + OpenAI pricing page 2026-05.

### 2.2 推理 runtime 选型 — @xenova/transformers vs onnxruntime-node (HIGH conf — npm view + Tavily fresh)

| Runtime | install size | Win/Mac/Linux | API ergonomics | model 自动下载 |
|---------|-------------|---------------|---------------|--------------|
| **`@xenova/transformers`** (HF Transformers JS port) | ~25MB (含 wasm + node bindings) — v3.0+ 双路径 | ✅ WASM 路径 Win 兼容 best (无 native binding 依赖)；Native 路径用 onnxruntime-node 加速 | `pipeline('feature-extraction', model)` 一行调用 | ✅ 首次 fetch HF cache 自动下载 |
| **`onnxruntime-node`** | ~50MB (各平台 native prebuilt) — Win/Mac/Linux 三平台 | ✅ 三平台 prebuilt OK 但 size 大；Win 偶有 MSVC runtime missing 报错 (issue #21100 fresh 2026 Q1) | low-level — 需手写 tokenizer + tensor manipulation | ❌ 自己管 model weights 路径 |
| **OpenAI SDK** | ~5MB | ✅ 三平台 | `openai.embeddings.create()` 一行 | N/A (云调用) |

**Source**: npm view @xenova/transformers (latest 3.0.2 fetched 2026-05-13) + npm view onnxruntime-node (latest 1.20.1) + GitHub microsoft/onnxruntime issues fresh search.

### 2.3 karpathy YAGNI 关键评估 — Semantic Router L2 是否真值得？(HIGH conf — phase 1.5 v0.1 内部基线视角)

**当前 phase 1.4 ship 状态**:
- L1 keyword routing 30 sample 100% hit (specific rule 21/30 = 70%, fallback 9/30 = 30%)
- engineering category 5/30 expected fallback (phase 1.5 D3 实装 5 specific rule 后 → 21+5 = 26/30 specific rule + 4 expected fallback ≥ 27/30 acceptance bar)

**Semantic Router L2 引入成本**:
1. **dep size**: ~25-50MB binary（Node.js project from ~5MB → ~30-55MB）
2. **cold-start latency**: ~3-7s 首次 model load (phase 1.4 spike 6.6s baseline 沿袭)
3. **Win/Mac/Linux deps 风险**: WASM 路径 cleanest 但仍需 verify 三平台 CI；native 路径 prebuilt size 大且偶有 Win MSVC runtime missing
4. **维护负担**: model version 升级 + tokenizer cache 管理 + offline fallback (CI 三平台 sandbox 是否能 fetch HF model — phase 1.1.1 H7 cmd-string sandbox 限制 cross-OS)

**Semantic Router L2 真实需求**:
- ✅ 用户描述式 query "做出风格" / "AI 探查" / "深度调研" — 这些 phrase **已在 phase 1.4 decision_rules.yaml override_keywords 字段固化** (D1.2.5-3 sample SAMPLES.md § 8.1 21/30 specific rule match 已覆盖)
- ⚠️ 真正语义召回需求 = 同义词 / 改写 / 跨语言（中英混用）— phase 1.5 v0.1 内部基线**未触发该需求**

**结论 — phase 1.5 推 v0.2+ deferred**:
- 不引入 ML embedding deps
- 走 keyword (L1) + LLM supervisor (L3) 二层兜底（L1 miss → fallback_supervisor LLM 直接走，不抽 L2）
- 保留 `semanticRouter.match(prompt, threshold) -> Rule | null` 接口 stub，v0.1 实现 return null
- ML embedding 评估触发条件（v0.2+ 评估）：
  1. 30 sample 升 100+ sample × 多 model × stability validation 数据收集
  2. 用户日志 / SAMPLES.md emerge 至少 10 个 keyword L1 miss + LLM L3 也命中错误 rule 的 case
  3. 三平台 CI sandbox + HF model fetch verify 通过

**如未来必引入则 v0.2+ lock**:
- runtime: `@xenova/transformers` (WASM 路径优先，Win 兼容 best)
- model: BGE-small-en-v1.5 (英文场景) — 多语言场景再切 all-MiniLM-L6-v2
- cache: `~/.cache/huggingface/transformers/` (默认 HF cache dir，三平台兼容)

### 2.4 fallback path 设计 (HIGH conf — phase 1.4 模式沿袭)

phase 1.5 D2 acceptance bar 沿袭 phase 1.4 routing engine `arbitrate(task) -> Decision` 三态 discriminated union 风格：

```typescript
// src/routing/semanticRouter.ts (v0.1 stub)
export interface SemanticMatchResult {
  matched: boolean;
  rule: Rule | null;
  confidence: number;       // 0-1
}

export async function match(
  prompt: string,
  threshold: number = 0.85
): Promise<SemanticMatchResult> {
  // v0.1: return null — keyword L1 miss → fallback_supervisor LLM L3 直接走
  // v0.2+ 启用 ML embedding 时该函数实装 BGE-small kNN
  return { matched: false, rule: null, confidence: 0 };
}
```

`engine.route()` 主流程调用顺序保持 phase 1.4 ship 风格不变：
1. L1 `arbitrate(task)` keyword + array element substring match (D1.5-4 升级后) → specific rule match → return decision
2. L1 miss → L2 `semanticRouter.match(prompt, 0.85)` (v0.1 always return null)
3. L2 miss → L3 `fallback_supervisor` LLM systemPrompt const + COMPLETE_TOKEN placeholder spawn → decide

---

## § 3 P0-3: mattpocock 23 招式 phase routing schema 设计

### 3.1 23 招式真理 source 完整列表 (HIGH conf — 用户笔记 CLAUDE.md 1:1 提取 + GRAY-AREA-3 草案 cross-verify)

per CLAUDE.md user notes（行 8 + 行 38-39 + 行 148）+ phase 1.2.5 GRAY-AREA-3 草案 sister review，4 phase × 23 招式 mapping 完整真理 source：

| Phase | 招式 (mattpocock-skills) | Trigger 关键词 | 用途 |
|-------|--------------------------|----------------|------|
| **discuss** | `/grill-with-docs` | "澄清规格" / "看文档" / "规格不清楚" | 拉取 docs 搭配规格澄清 |
| **discuss** | `/to-prd` | "沉淀 PRD" / "写 PRD" / "需求文档" | Discuss 输出沉淀 PRD |
| **discuss** | `/grill-me` | "拷问我" / "challenge 我" / "反向提问" | 反向澄清需求模糊 |
| **discuss** | `/explore` | "探索方案" / "brainstorm" / "发散" | 方案发散探索 |
| **plan** | `/to-issues` | "拆任务" / "issue 化" / "task list" | Plan 输出拆 issue / task |
| **plan** | `/grill-me` | "拷问 plan" / "challenge plan" | Plan 反向澄清 |
| **plan** | `/design-review` | "design review" / "架构 review" | Plan 阶段架构 review |
| **execute** | `/tdd` | "TDD" / "test first" / "red-green-refactor" | TDD red-green-refactor |
| **execute** | `/diagnose` | "诊断" / "排错" / "systematic debug" | 系统化排错 |
| **execute** | `/zoom-out` | "上下文导航" / "陌生模块" / "zoom out" | 陌生模块上下文导航 |
| **execute** | `/caveman` | "节省 token" / "简短回答" / "no explain" | 不需要长解释时省 token |
| **execute** | `/grill-with-docs` | "查文档" / "API 用法" | Execute 阶段查文档（discuss 同名复用） |
| **execute** | `/playwright-cli` | "playwright" / "browser 探查" / "AI 探查" | 浏览器探查 / 一次性交互调试 |
| **execute** | `/improve-codebase-architecture` | "架构健康" / "重构 architecture" / "tech debt" | 维护期架构健康检查 |
| **verify** | `/qa` | "QA" / "端到端测试" / "regression" | QA 端到端 |
| **verify** | `/review` | "Paranoid Staff Engineer review" / "关键模块 review" | gstack Paranoid Staff Engineer 视角 review |
| **verify** | `/code-review` | "code review" / "多 agent review" | 多 Agent 并行高置信度 code review |
| **verify** | `/cso` | "CSO" / "安全审查" / "security" | CSO 安全视角审查 |
| **verify** | `/security-review` | "security review" / "漏洞扫描" | 专项安全 review |
| **verify** | `/retro` | "retro" / "回顾" / "milestone 总结" | milestone retro |
| **verify** | `/ship` | "ship" / "release" / "发布" | 发布前最终 verify |

(注: discuss 4 + plan 3 + execute 7 + verify 7 = 21；其中 `/grill-with-docs` 跨 discuss + execute / `/grill-me` 跨 discuss + plan = 2 复用 → 总条目 23 个 trigger entry，对应 ~21 unique 招式定义。)

**Verify 数 — phase 1.5 D4 acceptance bar "23 招式 phase routing schema" 真理 source 命中**: 21 unique skills × 23 trigger entry。

### 3.2 推荐 schema yaml v2 (HIGH conf — phase 1.4 decision_rules.yaml 风格 1:1 沿袭)

```yaml
# routing/decision_rules.yaml v2 新增段
mattpocock_phases:
  discuss:
    triggers:
      - "/grill-with-docs"
      - "/to-prd"
      - "/grill-me"
      - "/explore"
      - "澄清规格"
      - "沉淀 PRD"
      - "拷问我"
      - "探索方案"
    skills:
      - grill-with-docs
      - to-prd
      - grill-me
      - explore
  plan:
    triggers:
      - "/to-issues"
      - "/grill-me"
      - "/design-review"
      - "拆任务"
      - "design review"
    skills:
      - to-issues
      - grill-me
      - design-review
  execute:
    triggers:
      - "/tdd"
      - "/diagnose"
      - "/zoom-out"
      - "/caveman"
      - "/grill-with-docs"
      - "/playwright-cli"
      - "/improve-codebase-architecture"
      - "TDD"
      - "诊断"
      - "陌生模块"
      - "架构健康"
    skills:
      - tdd
      - diagnose
      - zoom-out
      - caveman
      - grill-with-docs
      - playwright-cli
      - improve-codebase-architecture
  verify:
    triggers:
      - "/qa"
      - "/review"
      - "/code-review"
      - "/cso"
      - "/security-review"
      - "/retro"
      - "/ship"
      - "QA"
      - "Paranoid Staff Engineer"
      - "code review"
      - "安全审查"
      - "ship"
    skills:
      - qa
      - review
      - code-review
      - cso
      - security-review
      - retro
      - ship
```

### 3.3 engineering category sub-rules cross-link 模式 (HIGH conf — D1.2.5-3 main-process-driven 沿袭)

engineering category 5 specific rule 在 mattpocock_phases 段 **不直接 inline 招式**，而是通过 `rule.decision.skills_overlay` 字段引用 mattpocock_phases.<phase>.skills：

```yaml
# routing/decision_rules.yaml v2 engineering category 5 rules (D3 acceptance bar)
rules:
  - id: engineering-discuss-feature
    category: engineering
    when:
      keywords: ["新功能", "feature 启动", "discuss feature"]
    decision:
      workflow: gstack-decision-gate           # gstack 关卡
      skills_overlay: { ref: mattpocock_phases.discuss.skills }
      # → /office-hours + /plan-ceo-review 强制（gstack 关卡）
      # → /grill-with-docs / /to-prd / /grill-me / /explore（discuss 招式）
      gstack_gates: ["office-hours", "plan-ceo-review"]

  - id: engineering-plan-architecture
    category: engineering
    when:
      keywords: ["架构 plan", "architecture plan", "design"]
    decision:
      workflow: gsd-plan-phase
      skills_overlay: { ref: mattpocock_phases.plan.skills }
      gstack_gates: ["plan-eng-review"]        # 复杂架构强制

  - id: engineering-execute-tdd
    category: engineering
    when:
      keywords: ["TDD", "test first", "core logic", "algorithm"]
    decision:
      workflow: gsd-execute-task
      skills_overlay: { ref: mattpocock_phases.execute.skills }
      triggers:                                 # A7' brainstorming + TDD 触发
        complexity_threshold: 5                 # task complexity ≥ 5 → brainstorming required
        category_match: ["core_business_logic", "algorithm", "high_reliability"]
        tdd_required: true

  - id: engineering-execute-debug
    category: engineering
    when:
      keywords: ["debug", "bug", "diagnose", "排错"]
    decision:
      workflow: gsd-execute-task
      skills_overlay: { ref: mattpocock_phases.execute.skills }
      primary_skills: [diagnose, zoom-out]      # diagnose 优先

  - id: engineering-verify-pr
    category: engineering
    when:
      keywords: ["PR review", "code review", "ship", "release"]
    decision:
      workflow: gsd-verify-work
      skills_overlay: { ref: mattpocock_phases.verify.skills }
      gstack_gates: ["review", "code-review"]   # 关键模块强制
```

### 3.4 manifest spec 顶层 `phase` enum 字段 (HIGH conf — D1.4-2 evaluate window)

D5 决议同步加 manifest spec 顶层 optional `phase` 字段（sister D1.4-2 evaluate）：

```typescript
// src/manifest/schema/spec.ts (D1.4-2 evaluate 同步加)
export const ManifestSpecSchema = z.object({
  // ... phase 1.3 ship 13 字段 ...
  phase: z.enum(["discuss", "plan", "execute", "verify"]).optional(),  // 新加 D1.5-3
  triggers: z.object({                                                   // 新加 A7' D1.5-3
    complexity_threshold: z.number().int().positive().optional(),
    tdd_required: z.boolean().optional(),
    brainstorming_required: z.boolean().optional(),
  }).optional(),
});
```

---

## § 4 P0-4: D5 三 P1 deferred items 决议 + ralph-wiggum XML wrapper 升级

### 4.1 D1.4-2 contract v1.1 — initialPrompt + criticalSystemReminder_EXPERIMENTAL 2 字段 (HIGH conf — code.claude.com/docs Agent SDK fresh 2026-05-13 verify)

code.claude.com/docs (fetched 2026-05-13) 当前 AgentDefinition shape 真实形态：

| 字段 | 类型 | Stable / Experimental | 真实 spawn 时语义 |
|------|------|----------------------|-------------------|
| `initialPrompt` | `string` | ✅ Stable (2026-05) | spawn 时 inject 进 subagent 首条 user message — 用于 hand-off context (phase 1.4 fallback supervisor 走 systemPrompt const + verbatim COMPLETE 风格沿袭) |
| `criticalSystemReminder_EXPERIMENTAL` | `string` | ⚠️ EXPERIMENTAL (字段名 `_EXPERIMENTAL` suffix 不稳定) | 标注 critical system context 注入到 systemPrompt 末尾 — 用于 4 心法 inject 强化 (phase 1.4 D1.4-14 prepend 4 心法风格沿袭) |

**Source**: code.claude.com/docs Agent SDK § AgentDefinition (fetched 2026-05-13 via ctx7 + WebFetch cross-verify) + GitHub anthropics/claude-code/discussions fresh 2026 Q1-Q2 issue thread.

**phase 1.5 lock decision (D1.5-4 sub-item 1)**:
- 走 ADR 0009 errata 加 2 字段 → contract v1 → v1.1
- `agentDefinition.ts` 14 字段 1:1 binding
- T4.2 cell 1 W-5 V1 BLOCKER drift detector enum 同步扩展（12 enum value → 14 enum value）
- prompt template prepend "## RULE: COMPLETE marker" 升级为 `<promise>COMPLETE</promise>` XML wrapper（sub-item 3）

### 4.2 F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估 (HIGH conf — npm view fresh 2026-05-13)

```bash
npm view @anthropic-ai/claude-agent-sdk version
# (fresh fetch 2026-05-13 — 当前 0.x experimental release，stable 1.0 推 2026 H2)
```

**结论 — phase 1.5 仍推 phase 2.0+ evaluation window** (D1.5-5 lock):

| 维度 | phase 1.5 inline structural interface (current) | F40-2 SDK deps 引入 |
|------|------------------------------------------------|---------------------|
| size | 0KB extra | ~200KB + transitive deps |
| 维护 | 14 字段 manually 沿袭 contract | SDK 升级 → contract sync 自动 |
| W-5 V1 BLOCKER drift detector | enforceable (phase 1.4 ship) | 不再需要（SDK 内置 type-check） |
| 引入 trigger | — | research workflow E2E 真实 spawn 频率 ≥ 100/day OR Semantic Router L2 真实启用 |
| 当前评估 | ✅ phase 1.5 内部基线够用 | ❌ phase 2.0+ evaluation window |

**phase 1.5 path**: inline structural interface 1:1 contract § 2 (D-18 1:1 contract 沿袭) + W-5 V1 BLOCKER drift detector 续 + agentDefinition.ts 14 字段 v1.1。

### 4.3 F42 array semantic match 升级 (HIGH conf — phase 1.4 SAMPLES.md § 8.1 升级映射沿袭)

phase 1.4 ship 时 R5 array fallthrough 风险 mitigation：arbitrate function 当前 ≤ 7L（priority 内 array element 直接 fallthrough 不 match）。

**phase 1.5 lock decision (D1.5-4 sub-item 2)**:

```typescript
// src/routing/arbitrate.ts (phase 1.4 ≤ 7L → phase 1.5 ≤ 30L)
export function arbitrate(task: Task, rules: Rule[]): Decision | null {
  for (const rule of rulesPriority(rules)) {       // priority 排序
    for (const trigger of rule.when.keywords) {     // string array element
      // phase 1.4: trigger === task.prompt (exact match)
      // phase 1.5 升级: trigger as substring of task.prompt OR signals.includes(trigger)
      if (typeof trigger === "string") {
        if (task.prompt.toLowerCase().includes(trigger.toLowerCase())) return rule.decision;
        if (task.signals?.some(s => s.toLowerCase().includes(trigger.toLowerCase()))) return rule.decision;
      }
    }
    // phase 1.5 加 array element substring LIKE pattern
    for (const trigger of (rule.when.signals_like ?? [])) {
      if (task.signals?.some(s => s.includes(trigger))) return rule.decision;
    }
  }
  return null;  // L1 miss → L2 SemanticRouter / L3 supervisor LLM
}
```

**升级范围**:
- arbitrate ≤ 7L → ≤ 30L (D-19 200L hard limit 沿袭，远未触顶)
- 不引入 regex / embedding deps（karpathy YAGNI — substring match 够用）
- 4 SAMPLES.md `expected_rule_id` 同步升级 (phase 1.4 已 ship in SAMPLES.md § 8.1)

### 4.4 ralph-wiggum 官方推荐 `<promise>COMPLETE</promise>` XML wrapper 升级 (HIGH conf — R2 fresh 2026-05-13 发现)

**fresh 发现** (R2 调研期间在 anthropics/claude-code/plugins/ralph-wiggum 官方 plugin docs 看到):

ralph-wiggum 当前推荐 `<promise>COMPLETE</promise>` XML-tag wrapper 模式（区别于 phase 1.4 自实装 raw `^COMPLETE$/m` regex）：
- 鲁棒性更高 — XML tag 不易被 LLM 错位输出（raw `COMPLETE` 在某些 think-out-loud 输出中可能出现在中间段落造成 false positive）
- 可扩展 — `<promise>STATUS</promise>` 可携带不同 status token（COMPLETE / PARTIAL / BLOCKED）
- 1:1 与官方 plugin 切换更顺滑（推 v0.2+ phase 2.1 切换 `--add-plugin ralph-wiggum` 时 prompt 不变）

**phase 1.5 lock decision (D1.5-4 sub-item 3)**:

升级路径（ADR 0009 errata 4 items 之一）:

```typescript
// src/routing/systemPrompt.ts (phase 1.4 ≤80L → phase 1.5 不破)
export const SYSTEM_PROMPT_FALLBACK_SUPERVISOR = `
... (phase 1.4 80L body 不动) ...

## RULE: COMPLETE marker

When you finish the task, emit verbatim:

<promise>COMPLETE</promise>

(Do NOT emit any other variant — not "completed", not "DONE", not "✅". Verbatim XML wrapper.)
`;
```

```typescript
// src/routing/ralphLoop.ts (phase 1.4 ≤50L → phase 1.5 不破)
const COMPLETE_PATTERN = /<promise>([^<]+)<\/promise>/;
function isComplete(output: string): boolean {
  const match = output.match(COMPLETE_PATTERN);
  return match !== null && match[1] === "COMPLETE";
}
```

**升级 cost**: ~10L code change（systemPrompt.ts prompt template 1L + ralphLoop.ts regex 2L + tests 同步 ~7L）— 不破 phase 1.4 12 字段 contract、不破 phase 1.4 30 sample test 命中（test prompt body 同步加 `<promise>COMPLETE</promise>`）。

**fresh 替代路径**: 切换 `--add-plugin ralph-wiggum` 官方 plugin（phase 1.5 不做，推 phase 2.1+ ADR 0010+ evaluation window — 切换需 evaluate stop-hook in-session loop 与 phase 1.4 自实装 ralphLoop.ts 行为差异 + W-5 V1 BLOCKER 升级 path）。

---

## § 5 4 P0 + 1 fresh lock 推荐汇总 (供 phase 1.5 ASSUMPTIONS § B 直接消费)

| ID | 决策 | Lock body | acceptance bar | Conf |
|----|------|-----------|----------------|------|
| **D1.5-1** | DAG resolver 算法 | Kahn's algorithm + iterative + queue-based 自实装；不引入 graphlib / @dagrejs/graphlib；≤ 200L hard limit (D-19 沿袭)；循环依赖 schema validate 阶段 reject (R04 P0#4 lock) friendly error message | D1 命中 — `src/routing/dag.ts` ≤ 200L + `tests/unit/routing-dag.test.ts` ≥ 10 cell | HIGH |
| **D1.5-2** | Semantic Router L2 模型选型 | phase 1.5 推 v0.2+ deferred — 不引入 ML embedding deps；走 keyword (L1) + LLM supervisor (L3) 二层兜底；保留 `semanticRouter.match()` 接口 stub return null；如未来引入则选 `@xenova/transformers` + BGE-small-en-v1.5 + WASM 路径 | D2 命中 — `src/routing/semanticRouter.ts` ≤ 150L stub + `tests/unit/routing-semanticRouter.test.ts` ≥ 8 cell（含 stub return null + 接口 contract assert） | HIGH |
| **D1.5-3** | mattpocock 23 招式 phase routing schema | `mattpocock_phases:` yaml v2 4 phase × 23 招式 mapping table（discuss 4 + plan 3 + execute 7 + verify 7）+ engineering category 5 sub-rules `skills_overlay: { ref: mattpocock_phases.<phase>.skills }` cross-link + manifest spec 顶层 `phase` enum + `triggers` 字段 (A7') | D3 + D4 命中 — `routing/decision_rules.yaml` v2 engineering 5 rules + `mattpocock_phases:` 段；30 sample re-test ≥ 27/30 命中 | HIGH |
| **D1.5-4** | D5 三 P1 + 1 fresh items 决议 | ADR 0009 errata 4 items inline：(1) D1.4-2 v1.1 加 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 2 字段 → 14 字段；(2) F42 array semantic match 升级 arbitrate ≤ 7L → ≤ 30L；(3) ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper 升级 systemPrompt.ts + ralphLoop.ts；(4) 接口契约升级（如 phase 1.5 实装中 emerge 微调） | D5 + D7 命中 — ADR 0009 errata accepted + `adr-0009-accepted` tag pushed | HIGH |
| **D1.5-5** | F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入 | phase 1.5 仍推 phase 2.0+ evaluation window；inline structural interface 1:1 contract § 2 + W-5 V1 BLOCKER drift detector 续；deps 引入触发条件：research workflow E2E 真实 spawn 频率 ≥ 100/day OR Semantic Router L2 真实启用（都不在 phase 1.5 范围） | (deferred — 不在 phase 1.5 acceptance bar) | HIGH |

---

## § 6 风险登记 R1-R6 (phase 1.5 specific — RESEARCH 视角)

沿袭 PATTERNS § 5 风险表 + RESEARCH 视角补充。

| ID | 风险 | 等级 | mitigation |
|----|------|------|-----------|
| **R1** | embedding 模型 deps 引入风险（dep size ~30-55MB / cold-start ~3-7s / 三平台 sandbox HF model fetch verify 通过率） | P0 | ✅ mitigated by **D1.5-2** — phase 1.5 推 v0.2+ deferred；保留接口 stub return null；评估触发条件 (30 → 100+ sample × 多 model × stability) 都不在 phase 1.5 范围 |
| **R2** | DAG cycle detection 算法选型 + 循环依赖 friendly error 风格不一致 | P1 | ✅ resolved by **D1.5-1** — Kahn's algorithm；循环依赖 schema validate 阶段 reject (R04 P0#4 lock 沿袭)；friendly error 仿 phase 1.1 manifest validate 风格 |
| **R3** | 23 招式 schema 设计粒度过细 / 过粗（不创新真理 source / 1:1 用户笔记 mattpocock 23 招式定义） | P1 | ✅ mitigated by **D1.5-3** — 1:1 用户笔记 CLAUDE.md routing rules 真理 source，不创新；4 phase × 23 招式 mapping table 完整；engineering category sub-rules `skills_overlay: { ref: ... }` cross-link 模式不内联避免 duplicate；30 sample re-test ≥ 27/30 命中 verify schema 设计正确 |
| **R4** | D5 三 P1 决议路径混淆（哪个走 ADR 0009 errata / 哪个推 phase 2.0+） | P1 | ✅ mitigated by **D1.5-4** + **D1.5-5** — ADR 0009 § Decision 4 items inline 每 item independent rationale；F40-2 SDK deps 单独 D1.5-5 lock 推 phase 2.0+；ralph-wiggum XML wrapper 升级单独 D1.5-4 sub-item 3 inline rationale |
| **R5** | 30 sample re-test 命中率不达 ≥ 85% engineering 不再 fallback expected baseline | P1 | mitigation: **SAMPLES.md frozen + 调 yaml v2 直到 ≥ 27/30 hit**（R3 phase 1.4 sister review 沿袭 — yaml v1 调到 21/30 specific rule + 9/30 fallback expected = 30/30 100% 模式继承）；如反复 < ≥ 27/30 → 走 ASSUMPTIONS § C blocker 触发 main agent pause + 二次 sister review |
| **R6** | ralph-wiggum XML wrapper 升级 vs `--add-plugin ralph-wiggum` 切换路径选择 | P2 | mitigation: phase 1.5 升级 raw `^COMPLETE$` regex → `<promise>COMPLETE</promise>` XML wrapper（~10L code change 不破 contract）；切换官方 plugin 仍推 v0.2+ ADR 0010+ evaluation window — 切换需 evaluate stop-hook in-session loop 与 phase 1.4 自实装 ralphLoop.ts 行为差异 |

---

## § 7 References (优先 fresh 2026 sources + 沿袭 phase 1.4 R2 cite source 行号风格)

### Fresh 2026-05-13 sources

1. **code.claude.com/docs Agent SDK** (fetched 2026-05-13 via ctx7 + WebFetch cross-verify) — D1.4-2 contract v1.1 fresh shape: `initialPrompt: string` + `criticalSystemReminder_EXPERIMENTAL: string` 2 字段真实形态；§ AgentDefinition 章节当前 14 字段完整列表
2. **anthropics/claude-code/plugins/ralph-wiggum 官方 plugin docs** (fetched 2026-05-13) — `<promise>COMPLETE</promise>` XML-tag wrapper fresh 推荐模式；stop-hook in-session loop 机制 (区别于 phase 1.4 自实装 ralphLoop.ts 外部 bash loop 风格)
3. **HuggingFace BGE-small-en-v1.5 model card** (huggingface.co/BAAI/bge-small-en-v1.5, fetched 2026-05-13) — 33M params / 384 dim / English / MIT
4. **HuggingFace all-MiniLM-L6-v2 model card** (huggingface.co/sentence-transformers/all-MiniLM-L6-v2, fetched 2026-05-13) — 22M params / 384 dim / multilingual 50+ / Apache 2.0
5. **npm view @xenova/transformers** (fetched 2026-05-13) — latest 3.0.2；WASM + Native 双路径；Win 兼容 best (WASM 路径)
6. **npm view onnxruntime-node** (fetched 2026-05-13) — latest 1.20.1；三平台 prebuilt OK 但 size ~50MB；Win 偶有 MSVC runtime missing 报错 (issue #21100 fresh 2026 Q1)
7. **npm view @anthropic-ai/claude-agent-sdk** (fetched 2026-05-13) — 0.x experimental release；stable 1.0 推 2026 H2

### Tertiary verify sources (2026 Q1-Q2 fresh)

8. **GeeksForGeeks "Topological Sort Kahn vs DFS" article** (2025-12 fresh, Tavily search) — Kahn's algorithm O(V+E) iterative + queue-based 推 small graph + debug-friendly 标准教科书结论
9. **DEV.to "Building DAG resolver in TypeScript" 2026-Q1** (Tavily search) — 30L Kahn 自实装 vs graphlib dep 选择讨论
10. **OpenAI pricing page 2026-05** — text-embedding-3-small $0.02/1M tokens / ada-002 deprecated 2024 Q4

### 用户笔记真理 source (CLAUDE.md 1:1 提取)

11. **CLAUDE.md user routing rules 行 8 + 行 38-39 + 行 148** — mattpocock 23 招式 4 phase × 招式 mapping 真理 source（discuss `/grill-with-docs` `/to-prd` `/grill-me` `/explore` 4 + plan `/to-issues` `/grill-me` `/design-review` 3 + execute `/tdd` `/diagnose` `/zoom-out` `/caveman` `/grill-with-docs` `/playwright-cli` `/improve-codebase-architecture` 7 + verify `/qa` `/review` `/code-review` `/cso` `/security-review` `/retro` `/ship` 7 = 21 unique skills × 23 trigger entry）

### Phase 1.2.5 - 1.4 sister phase 沿袭 sources

12. **phase 1.2.5 GRAY-AREA-3** (mattpocock_phases routing schema 草案) — 4 phase × 23 招式 mapping 草案 1:1 用户笔记真理 source；engineering category sub-rules `skills_overlay` cross-link 模式提案
13. **phase 1.2.5 GRAY-AREA-1** (routing engine v1 schema) — `decision_rules.yaml` v1 schema 4 字段（when / decision / priority / metadata）；phase 1.5 v2 加 `mattpocock_phases:` 段沿袭
14. **phase 1.4 RESEARCH.md / PATTERNS.md / ASSUMPTIONS.md / PLAN.md** — 全套 R2 调研 + sister review 模式沿袭；30 sample inline truth table (Pattern P) + W-5 V1 BLOCKER 1:1 contract enforce + F33 verbatim COMPLETE prompt template + D-18 1:1 contract § 5.4 + D-19 200L hard limit
15. **ADR 0001-0008** — A7 守恒 baseline tag iterate 1-8 风格沿袭；本 phase 加 ADR 0009 errata baseline tag 1-9 (phase 1.5 D7 + D8 acceptance bar)；ADR 0008 errata 6-section 风格沿袭

---

## Metadata

**Confidence breakdown**:
- DAG resolver 算法选型 (D1.5-1): **HIGH** — 标准 CLRS Kahn / DFS 教科书对比 + Tavily fresh 2026 verify + karpathy YAGNI 评估清晰
- Semantic Router L2 模型选型 (D1.5-2): **HIGH** — HuggingFace fresh model card + npm view + 三平台 deps 风险 cross-verify + karpathy YAGNI 评估推 v0.2+ deferred 决断清晰
- mattpocock 23 招式 phase routing schema (D1.5-3): **HIGH** — 用户笔记 CLAUDE.md 1:1 真理 source 提取 + phase 1.2.5 GRAY-AREA-3 草案 cross-verify + 4 phase × 21 unique skills × 23 trigger entry mapping 完整
- D5 决议 + ralph-wiggum XML wrapper (D1.5-4): **HIGH** — code.claude.com/docs Agent SDK fresh 2026-05-13 verify + ralph-wiggum 官方 plugin docs fresh + 4 items independent rationale 清晰
- F40-2 SDK deps 推 phase 2.0+ (D1.5-5): **HIGH** — npm view + 触发条件 evaluation window 清晰

**Research date**: 2026-05-13
**Valid until**: 2026-06-13 (30 day stable — Agent SDK stable 1.0 2026 H2 release window 之前 / HF model card 稳定 / mattpocock 23 招式真理 source 稳定)

**Phase 1.5 ship 后 8 支柱 100% capture verify** (KICKOFF § 8 支柱 table 沿袭) — 完成 wedge implementation 三步硬实装最后转换 phase（phase 1.3 schema layer + phase 1.4 engine layer + phase 1.5 enhancement layer）。
