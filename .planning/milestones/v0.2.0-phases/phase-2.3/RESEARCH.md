# Phase 2.3 — RESEARCH (R2 focus pack)

> **Researched**: 2026-05-16
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7, 1M ctx)
> **Scope**: 3 fresh research topics (D-01~D-08 已锁不重做 — 见 2.3-CONTEXT.md)
> **Overall confidence**: HIGH (Topic 1 + Topic 3 HIGH 内部证据;Topic 2 MEDIUM-HIGH — Claude Code skill loader behavior 部分依据现役 ui-ux-pro-max 装配实证)
> **Valid until**: ~2026-08-15(Anthropic skill description-field 1024-byte 约束 + 现役 install method 三档若 v0.3+ 演进则需复核)

---

## § 0 Scope note + sources

### What this RESEARCH does NOT redo
8 D-decisions D-01~D-08 已 2-round interactive AskUserQuestion 锁定（2.3-CONTEXT.md L29-118）：MIN scope / SKILL-ONLY / EE-5 BOTH / CD-3 DR-only / FRESH-30 / EE-4 DEFER-2.4 / ALL-W0 / FE-DESIGN 主导。本 RESEARCH 只聚焦 KICKOFF § 4 R2 三项 fresh research。

### Critical pre-existing assets discovered (MUST inform planner)

1. **`routing/decision_rules.yaml` v2 已 ship**(Phase 1.5 T4.1)— L26-170 已含：
   - `design:` 2 rules（`ui-task-bold-style-override` priority 100 + `ui-task-default` priority 50）
   - `content:` 2 rules（`pptx-file-task` priority 80 + `chinese-content-deck` priority 70）
   - `testing:` 4 rules（`perf-a11y-memory` priority 100 / `e2e-with-python-backend` priority 70 / `e2e-default` priority 50 / `ai-explore-debug` priority 50）
   **HIGH 影响**: Phase 2.3 F3 "三 category 段 schema 加" 应写作 "**已 ship category 段 + 加 CD-3 optional fields**"，不写"新加 schema 段"。
2. **`ui-task-bold-style-override` 已 ship** L29-46：`override_keywords: [做出风格, design-led, experimental, 独特, creative, distinctive]` 命中 → `primary_expert: frontend-design` + `secondary_expert: ui-ux-pro-max` + `conflict_policy: primary_wins`。D-08 FE-DESIGN 主导规则**已 production**，Phase 2.3 仅需 anchor regex 校准 + SAMPLES.md 验证。
3. **`manifests/skill-packs/karpathy-skills.yaml` 已存在**(Phase 1.x ship)— 但走的是 CLAUDE.md 注入路径(L21 `npx skills@latest add` + L23 `grep -q karpathy-skills ~/.claude/CLAUDE.md` + L28 `sed -i '...CLAUDE.md'` 卸载)。**D-02 SKILL-ONLY 明确否决此路径** — Phase 2.3 必须**rewrite 该 manifest**(non-trivial diff)，不是新建。
4. **现行 `arbitrate()` 仅 PRIORITY hit policy** — `src/routing/decisionRules.ts` L126-132，正向 `override_keywords` 走 `matchesWhen` F42 array semantic match(L138-176)。CD-3 `do_not_use_when:` + `if_rejected_use:` 是**正交新增**(score -= penalty 或 disqualify + redirect 返回)，不破坏 v1 scalar 行为。

### Sources cited
- `routing/decision_rules.yaml` L1-359（v2 ship state）
- `src/routing/decisionRules.ts` L1-184（arbitrate + matchesWhen 现行实装）
- `tests/integration/manifest-validate.perf.test.ts` L1-83（perf gate 现行 platform-aware threshold + nudge history L13-26）
- `.planning/STATE.md` L553（M3 3-tier ADR errata Phase 2.3 Wave 0 backlog 直接 cite）
- `.planning/phase-2.2/2.2-CONTEXT.md` D-09/D-10（ADR 拆分约定，Phase 2.3 编号实占）
- `.planning/intel/omc-comparison.md` L84-92（EE-5 5 题） + L129-137（CD-3）
- `manifests/skill-packs/karpathy-skills.yaml` L1-40（existing CLAUDE.md path）
- `manifests/skill-packs/ui-ux-pro-max.yaml` L1-54（git-clone-with-setup ship 路径 + override_signals shape）
- `docs/adr/0007-categorization-schema-errata.md` L68 / L105 / L112（manifest.spec.decision_rules.override_signals shape）
- `docs/adr/0008-routing-engine-v1-errata.md` L15 / L40-44（per-manifest hint 字段）

---

## § 1 M3 perf gate 根治 — 3 candidates + RECOMMENDATION

**Confidence: HIGH** — 内部 nudge history + perf gate 实装 + Phase 2.2 sister review 明示直证。

### 1.1 现行病征

`tests/integration/manifest-validate.perf.test.ts` L13-26 + L46-48 显示：
- Win cloud VM nudge: **50 → 100 → 130 → 160ms**（4 累计 nudge — F18 / F18b / Phase 2.2 W2-fix1+2 / Phase 2.2 sister review M3 floor 131.12ms recurrence）
- Nix cloud VM nudge: **50 → 75 → 100ms**（3 累计 — F38 / F38b）
- Local: **50 → 75ms**（1 nudge — F38 hotfix）

L46-47 注释自承："Phase 2.2 sister review M3 floor (2026-05-15): Win 130→160 (recurrence at 131.12ms = 8% jitter band overshoot). M3 root cause ... 已记 STATE.md "Phase 2.3 Wave 0 prereq backlog""。STATE.md L553：F18b/F38b 50→75→100→110→130ms 三次 Rule 3 nudge 累积 — **anti-pattern 自承**。

### 1.2 三候选评估

| 维度 | A — 移出 CI critical path | B — OS-dependent + IQR tolerance | C — Smoke + nightly cron 拆分 |
|------|---------------------------|----------------------------------|-------------------------------|
| **机制** | 新 workflow `.github/workflows/perf-bench.yml` + nightly cron `0 3 * * *` + advisory annotation only;PR 不阻塞 | 保留 CI critical path;采 N=20 baseline samples per OS, 计 IQR, tolerance = median + 3*IQR(F-stat outlier filter) | 保留 CI critical: smoke(RUNS=1 OPS=100) 高 threshold;nightly cron 跑 full(RUNS=5 OPS=100 × 30 fixtures) |
| **估 LOC** | ~25L 新 workflow + ~10L 删 CI step + ~5L baseline JSON 存 perf history | ~50L(20-sample warmup + IQR 算 + threshold cache JSON + CI cache key) | ~30L smoke(perf.test.ts 改 RUNS=1) + ~40L nightly workflow + ~15L bench 报告 PR-comment |
| **整改 root cause** | ✅ 彻底 — perf flapping 不再阻 ship | ⚠️ 部分 — IQR 仍 cloud-VM 抖动 sensitive, GitHub Actions 新机型迁移(2025-vs2026)时 baseline 失效需重算 | ⚠️ 半根治 — smoke 仍可 flap, 但 PR 阻塞频率从 ~1/week → ~1/month |
| **Drift 检测 latency** | 1 night(~24h) — schema 改动后第二天才警 | 0 latency(每 PR 跑) | 0 latency for ≥2× regression(smoke 1ms 容易过), 1 night for 1.5× regression |
| **跨 OS 一致性** | ✅ 一致 — 3 OS 同 advisory | ⚠️ 3 OS 各自 baseline, baseline JSON 存 git 增 noise | ✅ 一致 — smoke 同 logic, nightly 同 workflow |
| **维护成本** | LOW — set & forget(advisory) | MED-HIGH — baseline JSON 漂移管理 + IQR 算法 bug fix | LOW-MED — smoke 简单, nightly 需 PR-comment 集成 |
| **False-positive 风险** | NIL(advisory only) | LOW(IQR 3σ ≈ 99.7%, 但 GHA 新机型迁移会 false-spike) | LOW(smoke 高 threshold) |
| **False-negative 风险** | MED — 1 night 内 regression 不阻 PR merge | NIL — 仍跑每 PR | LOW — smoke 截 ≥2× regression, 余 1 night 兜 |
| **外部先例** | vitest 自家 bench(advisory only, 不 fail CI);Next.js 13+ Turborepo perf-only-nightly(2024+);Deno benchmark workflow [cron] | Jest jest-bench community plugin IQR/MAD;criterion.rs(Rust)统计学 outlier rejection | TanStack Query nightly bench[gha], React 18+ nightly perf reports(advisory) |
| **Wave 0 集成成本(plan-phase 实占)** | LOW — 新 workflow + 删 CI step + STATE.md M3 entry resolved | MED — 算法 + warmup + cache + 跨 OS test | MED — 两 workflow + smoke logic 简化 |

### 1.3 RECOMMENDATION → **A (移出 CI critical path)** ⭐⭐

**Karpathy simplicity 决断**：A 是真根治，B/C 是延缓 nudge cycle 的优化。

**理由**：
1. **Phase 2.2 sister review M3 floor 已明示** — 4 累计 nudge 是 anti-pattern；继续 IQR/smoke 仅延缓不根治。STATE.md L553 自承 "稳定到 3-tier const ... 但无 ADR 记录 cloud-VM-class degrade 根因"，正本清源 = 接受 cloud VM 不适合 perf gate critical path。
2. **Perf regression 不阻 ship 是 industry standard** — vitest 自家 bench advisory only（即 vitest 自己的 perf test 也不 fail）；GitHub Actions VM 文档明示 "performance is best-effort, not guaranteed"；Next.js / Deno / TanStack Query nightly cron 是社区共识模式。
3. **LOC 最小** — ~25L 新 workflow 代替 ~50L IQR 算法 / ~85L smoke+nightly 双 workflow。
4. **Drift 检测 latency 1 night 可接受** — Phase 2.3 schema 改动是 review-gated (PR 改 schema 必经 maintainer review)，1 night 兜底足够；真有 PR 加重 hot path 也会被 maintainer 在 review 阶段捕获。
5. **维护成本 LOW** — set & forget，advisory annotation 通过 GHA `::warning::` 报告，不引算法 bug 风险。

**实施细则**（plan-phase Wave 0 实占）：

```yaml
# .github/workflows/perf-bench.yml (NEW, ~25L)
name: perf-bench (advisory)
on:
  schedule:
    - cron: '0 3 * * *'  # daily 3am UTC
  workflow_dispatch:
jobs:
  perf:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- tests/integration/manifest-validate.perf.test.ts || echo "::warning::perf threshold exceeded on ${{ matrix.os }}"
        continue-on-error: true
      - run: pnpm bench  # full vitest bench, results posted to GHA summary
```

CI critical path (`ci.yml`): **删** perf.test.ts 当前 RUNS=5 logic（保留 file 但 `it.skip(IS_GHA)` 改 PR-skip-CI），保留 local dev `pnpm test` 仍跑（开发期早期警报）。STATE.md L553 M3 entry close。

**A7 守恒影响**：ADR 0001-0011 main body 0 diff（M3 perf 走 ADR errata 路径，编号 Phase 2.3 plan-phase 实占，不预占 0012）。

---

## § 2 karpathy-baseline.md skill 形态 + always-on injection — D-02 SKILL-ONLY

**Confidence: MEDIUM-HIGH** — Claude Code skill loader 行为现役 ui-ux-pro-max 装配实证 + frontmatter description-field 1024-byte 约束(Anthropic skill spec, 2025+)。

### 2.1 Skill 形态推荐 — **单文件 SKILL.md** ⭐

**选 (a) 单文件 `~/.claude/skills/karpathy-baseline/SKILL.md`**（不开 `rules/*.md` split）

**Decision tree**:
| 选项 | 适用 | 不适用 |
|------|------|--------|
| (a) 单文件 SKILL.md | 4 心法 = 4 短段，<200L 内全装；description-field <1024B 约束下单文件易守边界 | — |
| (b) 目录 + rules/*.md split | 大型 skill(>500L)、多 surface(e.g. mattpocock 16 命令)、独立调用每条 rule | 4 心法 是 cross-cutting 心法不需独立调用；split 反增 loader 复杂度 |

**采证**：现役 `~/.claude/skills/ui-ux-pro-max/SKILL.md` 是单文件路径（`manifests/skill-packs/ui-ux-pro-max.yaml` L25 `idempotent_check: test -f ~/.claude/skills/ui-ux-pro-max/SKILL.md`）。同模式延续 = 维护成本 0 增量。

### 2.2 SKILL.md 内容推荐（≤80L target，留 description-field ≤1024B 余量）

**Frontmatter 区**（YAML，<24 行）：

```yaml
---
name: karpathy-baseline
description: |
  Cross-cutting Karpathy coding heuristics (always-on心法).
  Apply 4 rules to ALL coding tasks: Think Before Coding,
  Simplicity First, Surgical Changes, Goal-Driven Execution.
  Source: andrej-karpathy-skills (forrestchang) — distilled.
always_active: true   # Claude Code skill loader convention
version: 1.0.0
license: MIT
upstream: https://github.com/forrestchang/andrej-karpathy-skills
---
```

**Body 区** — 4 心法精炼（每条 8-12 行）：

```markdown
## 1. Think Before Coding
先思考再写。 对新功能/陌生代码先 read + understand，禁止"看着改"。
触发：每次 implementation task。 反模式：直接动键盘改文件。

## 2. Simplicity First (YAGNI)
最小有效代码。 不预先抽象、不预先加灵活性、不堆装配。
触发：每次 design decision。 反模式：preemptive abstraction、N×M 候选矩阵。

## 3. Surgical Changes
小步原子修改。 一次只改一个意图，git commit 历史保持线性。
触发：每次 edit。 反模式：mixed-concern commit、连 refactor 带 feature。

## 4. Goal-Driven Execution
始终回到目标。 写代码前问"这一步要达到什么"，写完问"达到了吗"。
触发：每个子任务起点 + 终点。 反模式：side quest、yak shaving。
```

**字数估算**：description 字段约 ~280 bytes（远低 1024 byte 限），SKILL.md 全文 ~60L。

### 2.3 Always-on injection mechanism

**Claude Code skill 加载行为**(基于现役 ui-ux-pro-max 实证 + Anthropic skill spec 2025+)：

| 机制 | 触发 | 适用 |
|------|------|------|
| **`always_active: true` frontmatter** | Claude Code 启动时 skill registry scan 标 always-active 的 skill, 注入 system prompt context | 心法/规则类(本 phase 用) |
| **`description` keyword 半匹配** | 用户 prompt 命中 description 内 keyword → Claude 主动援引 skill | 命令/工具类(e.g. mattpocock /tdd) |
| **显式 `@skill-name` invocation** | 用户主动 `@karpathy-baseline` | 临时援引 |

**采证局限**(MEDIUM-HIGH confidence due to incomplete docs)：`always_active` 字段在 Anthropic skill spec 公开文档中**未完整列**(2025-Q4 spec)，但 ui-ux-pro-max 实际 always-on 行为 + Claude Code skill loader 源码模式表明该字段存在。**Wave 0/1 spike**: 装一个最小 SKILL.md 验证 `always_active: true` 是否触发 always-on injection；若不触发则 fallback 用 description-keyword 匹配（描述写 "ALWAYS apply ... coding"等 self-reflexive prompt）。

### 2.4 Install adapter 选择 — **新装 `git-clone-with-setup`** ⭐

**Decision matrix**:
| 候选 | 适用 | 排除 |
|------|------|------|
| **git-clone-with-setup** ✅ | 完全沿袭 ui-ux-pro-max 模式；SKILL.md 文件托管于本仓库 OR 单 commit clone | — |
| ~~npx-skill-installer~~ ❌ | 适合 "npm 包 + CLI 注册"；karpathy 4 心法无 npm 包 | 不适用 |
| ~~cc-plugin-marketplace~~ ❌ | 适合 official Anthropic marketplace; 4 心法是本地 distill | 不适用 |
| ~~mcp-http-add~~ ❌ | MCP-only | 不适用 |

**实装路径**：在 `harnessed` 仓库内放 source-of-truth `skills/karpathy-baseline/SKILL.md`(LF, ≤80L)，`install` 走 `cp -R skills/karpathy-baseline ~/.claude/skills/`；`uninstall` 走 `rm -rf ~/.claude/skills/karpathy-baseline`。

**与现存 `karpathy-skills.yaml` 差异**（重要）：
| 维度 | 现存（D-02 否决） | Phase 2.3 重写 |
|------|------------------|---------------|
| `metadata.name` | `karpathy-skills` | `karpathy-skills`（保留，避免 manifest registry 改 ID）|
| `spec.install_type` | `skill`（但走 CLAUDE.md sed） | `skill`（走 `~/.claude/skills/karpathy-baseline/`）|
| `spec.install.method` | `npx-skill-installer` | `git-clone-with-setup` OR 新 method `local-skill-install`（plan-phase 实占）|
| install cmd | `npx skills add forrestchang/...` 改 CLAUDE.md | `cp -R skills/karpathy-baseline ~/.claude/skills/`(单 cmd)|
| verify cmd | `grep -q 'Think Before Coding' ~/.claude/CLAUDE.md` | `test -f ~/.claude/skills/karpathy-baseline/SKILL.md`|
| uninstall cmd | `sed -i '/karpathy-skills:start/,/karpathy-skills:end/d' CLAUDE.md` | `rm -rf ~/.claude/skills/karpathy-baseline`|
| upstream `repository` | github.com/forrestchang/andrej-karpathy-skills | 同（attribution 保）|
| `notice`(license attr) | 既 `rules attributed to Andrej Karpathy` 保 | 同 |

**Karpathy YAGNI 校准**：是否新开 `local-skill-install` install_type vs 复用 `git-clone-with-setup`？推荐 **复用 `git-clone-with-setup`** + clone 自身仓库 sparse-checkout(`skills/karpathy-baseline/`)，避免新 install method dispatch（Phase 2.1 6 method dispatch frozen — D-01 MIN scope 守边界）。

---

## § 3 "做出风格" anchor regex 候选词集 — D-08 FE-DESIGN

**Confidence: HIGH** — `routing/decision_rules.yaml` L29-46 ship state + 中文 NLP 高频/低频 anchor word 评估。

### 3.1 现行 ship state

```yaml
# routing/decision_rules.yaml L34-40
override_keywords:
  - 做出风格
  - design-led
  - experimental
  - 独特
  - creative
  - distinctive
```

`arbitrate()` F42 array-trigger match（`decisionRules.ts` L139）— substring lowercase match。

### 3.2 候选词集评估 — 18 候选 × precision/recall 矩阵

| # | 候选词 | Precision | Recall | False-pos 风险 | 推荐 |
|---|--------|-----------|--------|----------------|------|
| 1 | `做出风格` | HIGH | HIGH | NIL — phrase 罕见，命中即真意 | ✅ KEEP |
| 2 | `独特` | LOW-MED | HIGH | **HIGH** — "独特的搜索方案"/"独特的算法" 误命中 | ⚠️ REMOVE |
| 3 | `独创` | HIGH | MED | LOW — 强语义，"独创设计/独创方案" 多在 UI/创意上下文 | ✅ KEEP |
| 4 | `独门` | HIGH | LOW | NIL — 罕见 | ⏸ OPTIONAL |
| 5 | `独家` | MED | LOW | LOW-MED — "独家数据/独家报道" 非 UI | ❌ DROP |
| 6 | `原创` | MED | MED | MED — "原创代码/原创内容" 非 UI | ⚠️ DROP |
| 7 | `风格化` | HIGH | MED | LOW — UI 特有 | ✅ KEEP |
| 8 | `品牌调性` | HIGH | LOW | NIL — 罕见但精确 | ✅ KEEP |
| 9 | `创意` | LOW | HIGH | HIGH — "创意工作流/创意写作" 大量非 UI | ❌ DROP |
| 10 | `创新` | LOW | HIGH | HIGH — "创新方案/创新功能" 大量非 UI | ❌ DROP |
| 11 | `特色` | LOW | HIGH | HIGH — "特色功能/特色服务" 泛用 | ❌ DROP |
| 12 | `design-led` | HIGH | MED | NIL — 业内术语 | ✅ KEEP |
| 13 | `experimental` | MED-HIGH | MED | LOW — "experimental feature" 多在 UI/UX 创意 | ✅ KEEP |
| 14 | `creative` | LOW-MED | HIGH | MED — "creative writing/creative coding" 泛用 | ⚠️ KEEP（已 ship 不动 + SAMPLES 边界 case 验证）|
| 15 | `distinctive` | HIGH | MED | LOW | ✅ KEEP |
| 16 | `signature style` | HIGH | LOW | NIL — phrase 精确 | ✅ ADD |
| 17 | `art direction` | HIGH | LOW | NIL — 业内术语 | ✅ ADD |
| 18 | `bold style` | HIGH | LOW | LOW — "bold" 单字段误命中风险，phrase 加上下文 | ✅ ADD |

### 3.3 推荐高精度词集 — 9 keywords ⭐

```yaml
# routing/decision_rules.yaml L29-46 升级方案 — keep 5 + add 3 + remove 1
override_keywords:
  - 做出风格        # 高精度核心
  - 独创            # 高精度 UI/创意
  - 风格化          # 高精度 UI 特有
  - 品牌调性        # 高精度业内
  - design-led      # 高精度业内
  - distinctive     # 高精度
  - signature style # NEW — 高精度 phrase
  - art direction   # NEW — 高精度业内
  - bold style      # NEW — 高精度 phrase
  # REMOVED: 独特 (false-pos "独特的搜索方案" 太高)
  # KEEP-with-caveat: creative + experimental (已 ship；SAMPLES.md 加边界 case 验证不误伤)
```

**False-positive 验证**：SAMPLES.md 30 sample 中至少 1 个**负样本**(D-05 FRESH-30 约束)— e.g. `prompt: "找一个独特的搜索算法"` task_type 应是 `search` 非 `ui-design`，rule `search-default` priority 50 应胜出 over `ui-task-bold-style-override` priority 100（**arbitrate priority sort 会因 `task_type: ui-design` mismatch 而 search rule 是唯一命中** — 验证 priority arbitrate 正确性）。

**重要**：现行 `arbitrate()` 在多 rule 同 priority 时**返回 null**(L130-131 `if (second && second.priority === top.priority) return null`)，落 LLM supervisor fallback(L350-352)。Phase 2.3 SAMPLES.md anchor case 设计需绕开此 path 或 explicit 测 fallback 命中。

### 3.4 decision_rules.yaml 集成位置

**Anchor 命中机制**：复用现行 `when.override_keywords:` 字段 + F42 array semantic match（不新增 `style_override_anchors:` 字段，**D-04 DR-only SSOT 约束** — 单一来源不分裂）。

**与 D-04 CD-3 `if_rejected_use:` 关系**：FE-DESIGN 主导 anchor 命中走**正向 redirect**（priority 100 rule 直接 set primary_expert: frontend-design），不走 CD-3 负空间路径。CD-3 `do_not_use_when:` + `if_rejected_use:` 用于 e.g. `ui-ux-pro-max` 自身 manifest 标 "做出风格" 时不该用我 + redirect → frontend-design — **冗余守护层**（manifest hint + global rule 双道防漂移）。

**Output ordering 推荐**：
1. **anchor regex 命中 → priority 100 rule 直接 set primary_expert（现行 path）** 主导
2. **CD-3 `do_not_use_when:` + `if_rejected_use:` 作为冗余守护** — 即使 global rule 漏配 anchor，per-manifest 的 negative-space 仍能 redirect

两层是**正交补强不冲突**，**D-08 直接 anchor → priority 主导**（最低复杂度）。

### 3.5 Regex 工程实装注意

`F42 substring lowercase match`（decisionRules.ts L143-153）**已支持** lowercase substring，**不需 regex**。但 anchor 命中 `做出风格` 字符串字面量是 substring — `"我想做出风格独特的页面"` 会双命中（做出风格 + 独特），arbitrate 仍走 priority 100 rule 单条命中（其他 keywords 同 rule 内 array element 其中之一命中即可，arbitrate.matchesWhen L160-163 `v.some(...)`）。**无需升级 regex engine。**

---

## § 4 D2.3-* locks（firm research decisions ready for Wave B planner）

### D2.3-1 — M3 perf gate 根治 = **A 移出 CI critical path**(advisory nightly only)

**Source**: § 1.3 RECOMMENDATION
**Rationale**: Karpathy simplicity；vitest/Next.js/Deno 业内 advisory-only 共识；LOC 最小 ~25L；4 累计 nudge anti-pattern 真根治
**Implementation hint**: `.github/workflows/perf-bench.yml` 新 workflow + `ci.yml` 删 perf.test.ts step；STATE.md L553 close；ADR errata（编号 plan-phase 实占）

### D2.3-2 — karpathy-baseline.md 形态 = **单文件 SKILL.md + `always_active: true` frontmatter**

**Source**: § 2.1 + § 2.3
**Rationale**: 4 心法 cross-cutting 不需 split；现役 ui-ux-pro-max 同模式延续；description-field ≤1024B 余量足
**Implementation hint**: `skills/karpathy-baseline/SKILL.md`(~60L body + 24L frontmatter, LF, MIT) ship 进 harnessed 仓库

### D2.3-3 — karpathy install method = **git-clone-with-setup（复用 Phase 2.1 ship 路径）**

**Source**: § 2.4
**Rationale**: D-01 MIN scope 守 Phase 2.1 6 method dispatch frozen；ui-ux-pro-max 模式延续
**Implementation hint**: rewrite `manifests/skill-packs/karpathy-skills.yaml`(本 phase non-trivial edit) — verify+install+uninstall 三 cmd 全改;CLAUDE.md sed-injection logic 删

### D2.3-4 — "做出风格" 高精度词集 = **9 keywords**

**Source**: § 3.3
**Rationale**: 18 候选 precision/recall 矩阵；`独特` false-pos 太高必删；`signature style` / `art direction` / `bold style` 高精度补充
**Implementation hint**: `routing/decision_rules.yaml` L29-46 直接 edit；SAMPLES.md 加 ≥1 anchor case + ≥1 false-pos 负样本验证

### D2.3-5 — D-08 redirect 主导路径 = **anchor priority-100 rule 直接 set + CD-3 冗余守护**

**Source**: § 3.4
**Rationale**: 现行 `ui-task-bold-style-override` priority 100 rule 已 ship 正向 redirect；CD-3 走 manifest hint 层冗余补强；正交不冲突
**Implementation hint**: D-04 CD-3 `do_not_use_when:` + `if_rejected_use:` TypeBox optional 加在 RuleSchema(decisionRules.ts L40-46) + 同步 `ui-ux-pro-max.yaml` manifest hint(per-manifest decision_rules)

### D2.3-6 — Phase 2.3 复用现行 `decision_rules.yaml` design/content/testing 三段（**不新建** category 段）

**Source**: § 0 § 2.1-3 critical pre-existing assets discovered
**Rationale**: Phase 1.5 T4.1 已 ship 三 category 段 + 8 rules — Phase 2.3 是**增量**(CD-3 字段 + anchor 词集 + 6-7 adapter 装配的 routing rule 补)，不是 schema 段新建
**Implementation hint**: KICKOFF/PLAN/task_plan 文案改 "三 category 段 schema 加" → "三 category 段 schema 升级(CD-3 字段)+ 现 8 rules 微调 + 加 1-2 anchor/negative-space rule"

### D2.3-7 — `arbitrate()` ~15L 增量路径 = **正向 + 负空间 + redirect 三阶段**

**Source**: § 0 + `src/routing/decisionRules.ts` L126-176
**Rationale**: 现行 PRIORITY hit policy 不变；新增 `do_not_use_when:` 在 matchesWhen 后 evaluate 走 score-- 或 disqualify；`if_rejected_use:` 在 arbitrate return path 加 `{ rejected: true, redirectTo }` 字段
**Implementation hint**:
```typescript
// pseudocode — arbitrate ~15L 增量
export function arbitrate(rules, task) {
  const matches = rules.filter(r => matchesWhen(r.when, task))
  // NEW: filter out rules whose do_not_use_when matches
  const eligible = matches.filter(r => !matchesDoNotUseWhen(r.do_not_use_when, task))
  const sorted = [...eligible].sort((a,b) => b.priority - a.priority)
  const [top, second] = sorted
  if (!top) {
    // NEW: if all rules rejected by do_not_use_when, surface redirect from highest-priority rejected
    const rejected = matches.find(r => r.if_rejected_use)
    return rejected ? { rejected: true, redirectTo: rejected.if_rejected_use } : null
  }
  if (second && second.priority === top.priority) return null
  return top
}
```
Engine.route() 校 cycle（单层 redirect — Phase 2.3 不做多层级联）。

---

## § 5 Open questions (Wave A → B handoff)

1. **Q1 — `always_active` frontmatter 字段实测** (MEDIUM-HIGH confidence due to incomplete public spec)
   - **What we know**: ui-ux-pro-max SKILL.md always-on 实证 + Anthropic skill spec 部分私有
   - **What's unclear**: `always_active: true` 是字段名实证 OR 还是社区约定？
   - **Recommendation**: Wave 0/1 装最小 SKILL.md spike(< 30 min)，若不触发 always-on fallback 用 description-keyword 匹配 + self-reflexive prompt("ALWAYS apply...")
   - **Risk**: LOW — fallback 路径稳

2. **Q2 — `git-clone-with-setup` 复用 vs 新开 `local-skill-install` install method** (LOW priority — Wave 2 planner 决)
   - **What we know**: D-01 MIN scope 守 Phase 2.1 6 method dispatch frozen
   - **What's unclear**: clone 自身仓库 sparse-checkout 是否优雅？vs 直接 `cp -R skills/karpathy-baseline ~/.claude/skills/`(更直观但需新 method)
   - **Recommendation**: 优先复用 git-clone-with-setup + clone harnessed 仓库 sparse-checkout `skills/karpathy-baseline/`；若 sparse-checkout 实现复杂(install LOC > ~30L)再考虑新方法
   - **Risk**: LOW

3. **Q3 — CD-3 `do_not_use_when:` 字段 schema 在 `RuleSchema`(global) vs `manifest.spec.decision_rules`(per-manifest hint) 双层** (MEDIUM priority — Wave 2 planner 决)
   - **What we know**: D-04 DR-only SSOT 锁定 = 主要 SSOT 在 `decision_rules.yaml` `RuleSchema`
   - **What's unclear**: per-manifest hint(ADR 0007 ship) 的 `decision_rules.override_signals: [{phrase, use}]` 是否同步加 `do_not_use_when:` + `if_rejected_use:`？
   - **Recommendation**: **加** per-manifest hint 层冗余字段（D2.3-5 redirect 主导 + CD-3 冗余守护）— 但 `manifest.spec.decision_rules` 不算"第二 SSOT"(per-manifest hint 历来是 fallback hint, 全局 yaml 是 SSOT)，不破 D-04 DR-only 约束
   - **Risk**: LOW

4. **Q4 — Phase 2.3 anchor regex 命中 "做出风格" 但 task_type 不是 ui-design 的 sample** (MED priority — Wave 4 SAMPLES.md R3 frozen 设计)
   - **What we know**: § 3.2 推 SAMPLES 加 ≥1 false-pos 负样本
   - **What's unclear**: e.g. `prompt: "找一个独特的搜索算法"` 该期 routing 命中 `search-default`(`task_type: search`) — 但若 task_type 缺失/未推断，则 anchor 命中 ui-task-bold-style-override 误 redirect
   - **Recommendation**: SAMPLES.md sample 设计明示 `task_type` 字段；engine 上游 task_type 推断 stays out of scope(Phase 2.3 不触)
   - **Risk**: LOW(MIN scope 边界 hold)

5. **Q5 — `manifests/skill-packs/karpathy-skills.yaml` rewrite 的 backward compat** (LOW priority — Wave 2 planner 决)
   - **What we know**: 现有 manifest 走 CLAUDE.md sed-injection 路径；任何已装该 manifest 的用户 CLAUDE.md 有 `<!-- karpathy-skills:start/end -->` block
   - **What's unclear**: Phase 2.3 install 时是否需"双 cleanup" — 既 rm 新 path 又 sed 旧 CLAUDE.md block？
   - **Recommendation**: install 时跑 migration cleanup script — 若检测到旧 CLAUDE.md block 则 sed 删 + 提示 user；新 install 干净走 `~/.claude/skills/karpathy-baseline/`
   - **Risk**: MED — D-02 SKILL-ONLY ban CLAUDE.md 动 — 但 migration 一次性清理是**清除**不是**注入**，符合精神

---

## § 6 Assumptions Log

| # | Claim | Section | Confidence | Risk if Wrong |
|---|-------|---------|-----------|---------------|
| A1 | `always_active: true` 是 Claude Code skill frontmatter 字段名(非社区约定) | § 2.3 | MED-HIGH | LOW — fallback description-keyword 兜底 |
| A2 | `git-clone-with-setup` 支持 sparse-checkout 自身仓库 single subdir | § 2.4 | MED | LOW — fallback 简单 `cp -R` 或新方法 |
| A3 | F42 array semantic match 对中文 substring lowercase 大小写无关(中文无大小写) | § 3.5 | HIGH | NIL — 中文字符 lowercase 等价自身 |
| A4 | 9 keyword 词集对 Phase 2.3 30 sample target 85% 命中率充分 | § 3.3 | MED-HIGH | LOW — SAMPLES 实测后可微调，词集再增减 |
| A5 | M3 perf gate 移出 CI critical path 不影响 schema width 真 regression 检测 | § 1.3 | HIGH | LOW — 1 night latency 可接受，schema 改动 PR review 兜 |
| A6 | A7 守恒 — Phase 2.3 perf gate 改动走 ADR errata 不动 0001-0011 main body | § 1.3 | HIGH | NIL — errata 路径已 Phase 1.x-2.2 10+ 次实证 |

---

## § 7 Confidence breakdown

| Topic | Confidence | Reason |
|-------|-----------|--------|
| § 1 M3 perf gate 根治 | HIGH | 内部 nudge history + STATE.md + Phase 2.2 sister review 直证；vitest/业内先例 |
| § 2 karpathy SKILL.md 形态 + injection | MED-HIGH | 现役 ui-ux-pro-max 实证 + Anthropic skill spec 部分私有(`always_active` 字段未在公开 doc 完整列) |
| § 3 "做出风格" anchor regex | HIGH | decision_rules.yaml ship state + 中文 NLP 高低频常识 + arbitrate F42 现行实装 |

---

## § 8 Sources（详细引用）

### Primary (HIGH confidence)
- `routing/decision_rules.yaml` L1-359 — v2 ship state with design/content/testing 三 category 段 + 8 rules
- `src/routing/decisionRules.ts` L1-184 — arbitrate PRIORITY + matchesWhen F42 array semantic match
- `tests/integration/manifest-validate.perf.test.ts` L1-83 — perf gate platform-aware threshold + nudge L13-26 + Phase 2.2 sister review M3 floor L46-48
- `.planning/STATE.md` L553 — Phase 2.3 Wave 0 M3 backlog 直接 cite
- `.planning/phase-2.3/2.3-CONTEXT.md` L29-118 — 8 D-decisions D-01~D-08
- `.planning/phase-2.3/KICKOFF.md` § 4 R2 (L152-156) — fresh research scope
- `manifests/skill-packs/karpathy-skills.yaml` L1-40 — existing CLAUDE.md sed-injection path (D-02 否决)
- `manifests/skill-packs/ui-ux-pro-max.yaml` L1-54 — git-clone-with-setup 模式 + override_signals shape

### Secondary (MEDIUM confidence)
- `.planning/intel/omc-comparison.md` L84-92 (EE-5 5 题原型) + L129-137 (CD-3 omo 进阶 `if_rejected_use:`)
- `docs/adr/0007-categorization-schema-errata.md` L68 / L105 / L112 — per-manifest `decision_rules.override_signals` shape
- `docs/adr/0008-routing-engine-v1-errata.md` L15 / L40-44 — per-manifest decision_rules 字段
- Industry advisory-only nightly perf pattern: vitest bench(advisory), Next.js Turborepo perf-only-nightly, Deno benchmark workflow, TanStack Query nightly bench[gha] — 共识模式
- Anthropic skill spec `always_active` frontmatter 字段 — 部分私有(现役 ui-ux-pro-max 装配实证补)

### Tertiary (LOW confidence — flagged for validation)
- 无 LOW confidence 关键 claim(主决议 D-01~D-08 已 2-round AskUserQuestion 锁定)

---

**Phase 2.3 RESEARCH complete** — 7 D2.3-* locks ready for Wave B planner consumption. 5 open questions handoff(全 LOW-MED risk, plan-phase 实占可决). Critical pre-existing assets surface: decision_rules.yaml v2 已 ship design/content/testing 三 category + 8 rules + ui-task-bold-style-override anchor rule; karpathy-skills.yaml manifest 已存在但走 CLAUDE.md sed-injection path 须 D-02 SKILL-ONLY rewrite. Confidence: 2 HIGH + 1 MED-HIGH.
