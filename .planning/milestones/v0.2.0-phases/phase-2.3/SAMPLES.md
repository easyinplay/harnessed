# Phase 2.3 — 30 FRESH 真实查询样本 (Routing Accuracy Baseline v0.2 — design/content/testing 三段)

> **Status**: frozen at phase 2.3 plan-phase Wave B / **execute-phase 不允许改样本** (R3 沿袭 phase 1.4 / 2.2 frozen 模式)
> **Trigger**: Phase 2.3 KICKOFF § 1.2 D-05 acceptance bar — 30 sample × arbitrateWithRedirect routing → ≥85% (≥26/30) hit rate
> **Test consumer**: `tests/routing/samples-30.test.ts` (T4.3 — markdown table parser 1:1 对应 § 2)
> **Plan-checker (Wave C) 验收**: SAMPLES.md frozen — execute-phase 任何 sample 字段修改 = ADR 0012+ errata 触发

---

## § 1 Selection Rationale (B-21 + B-23 — 防 cherry-pick 透明声明)

### 1.1 来源约束 (沿袭 phase 1.4 § 1.1 三约束 + FRESH-30 = 不复用 phase 1.4 / 2.2 任一 sample)

每个 prompt 必须满足以下 ≥1 条约束:

1. **CLAUDE.md trigger phrase 直接命中** — 用户全局规则中明示的关键词 / 决策路由 (e.g. "做出风格" → frontend-design / "perf/a11y/memory" → chrome-devtools-mcp)
2. **routing/decision_rules.yaml v2 production rule trigger 字段** — `override_keywords` / `do_not_use_when` / `task_type` / `signals` 直接命中 production yaml
3. **Phase 2.3 W2 T2.1 ship 的 CD-3 negative-space + 9-keyword 词集校准** 投影 — D-08 双向 redirect + D2.3-4 词集校准 anchor / false-pos

> **FRESH-30 = 全 30 sample 全部新写** — 不复用 phase 1.4 / 2.2 任一 sample (B-21 lock — 防 design/content/testing 三段 baseline 与 phase 1.4 6-category baseline 测试焦点漂移)

### 1.2 分布 (10 design + 10 content + 10 testing — D-05 + B-21 frozen)

| Category | Sample 数 | 主要规则 hit | anchor case (≥1) | false-pos 负样本 (≥1) | CD-3 disqualify edge (≥3 跨段) |
| -------- | --------- | ------------ | ---------------- | --------------------- | ------------------------------ |
| design   | 10        | 5 ui-task-default + 3 ui-task-bold-style-override + 2 CD-3 redirect | 3 (S02/S03/S04 做出风格 + signature style + bold style) | 1 (S07 "找一个独特的搜索方案" — 独特已 removed from override v2) | 2 (S09/S10 ui-design + do_not_use_when keyword) |
| content  | 10        | 6 pptx-file-task + 3 chinese-content-deck + 1 CD-3 negative-space rejected | 1 (S15 中文 deck baoyu trigger) | 1 (S19 "用英文 markdown 直接展示" — 缺 language=zh → fallback) | 1 (S20 中文 deck + "通用 markdown 文档" → rejected no-redirect) |
| testing  | 10        | 4 playwright-test + 3 webapp-testing + 2 chrome-devtools-mcp + 1 playwright-cli | 1 (S25 "perf LCP Core Web Vitals" array trigger) | 1 (S29 webapp-testing + "no python backend" → redirect to playwright-test) | 1 (S30 ai-explore / element-ref array trigger) |
| **TOTAL** | **30** | — | **5 anchor** | **3 false-pos** | **≥4 CD-3 edges** (含 redirect) |

### 1.3 anchor / false-pos / CD-3 设计 (B-23 + D2.3-4 + D2.3-7 验)

- **9-keyword anchor coverage** — design 段必含 **≥3 keywords** from D2.3-4 anchor 集: `做出风格 / 独创 / 风格化 / 品牌调性 / design-led / distinctive / signature style / art direction / bold style / creative / experimental` (NOT `独特` — D2.3-4 v2 已移除 false-pos)
- **CD-3 negative-space disqualify edge (≥3 跨段)** — prompt 含 `do_not_use_when` keyword → arbitrateWithRedirect 返 `{ kind: 'rejected', redirectTo }`:
  - design S09/S10 ui-task-default `do_not_use_when: [做出风格 / 独创 / 风格化 / design-led]` → redirect to frontend-design (NOTE: 该 4 词同时是 `ui-task-bold-style-override` 的 `override_keywords`, 实际 arbitrate `{ kind: 'matched' rule=ui-task-bold }` 命中 priority=100 — 终态 expected_primary_expert = frontend-design 一致, D-08 双向 redirect 一致性 verify)
  - content S20 chinese-content-deck `do_not_use_when: [通用 markdown 文档 / generic markdown / plain doc]` + 无 `if_rejected_use` → `{ kind: 'none' }` (expected_primary_expert = null — fallback)
  - testing S29 e2e-with-python-backend `do_not_use_when: [pure-frontend / no-Python-backend / no python backend]` + `if_rejected_use: playwright-test` → 终态 expected_primary_expert = playwright-test (e2e-default priority=50 同时 match → 命中 matched 路径或 rejected redirect 路径, 终态一致)
- **false-pos 负样本 (≥1)** — prompt 含 phase 2.2 旧词集 `独特` 等 benign-context 词, 不应 trigger style override:
  - design S07 prompt "找一个独特的搜索方案" task_type=search (跨 category) → 命中 search-default (tavily-mcp), `独特` 应**不**触发 ui-task-bold (v2 已 remove `独特` 从 override_keywords)
  - content S19 prompt "用英文 markdown 直接展示" task_type=slide-deck **无 language=zh** → 缺 `chinese-content-deck` 第二键约束 → fallthrough fallback (expected null)

### 1.4 Cherry-pick 防御 (沿袭 phase 1.4 § 1.4)

- SAMPLES.md plan-phase Wave B 锁定, execute-phase **不允许改样本** (R3 frozen 模式 v0.2)
- `tests/routing/samples-30.test.ts` (T4.3) markdown table 解析 1:1 对应本文件 § 2
- per-category breakdown (T4.3 输出) 防止单 category 拉高 mean

---

## § 2 Sample Truth Table (30 sample — FRESH-30)

| #  | category | task_type            | prompt                                                                              | expected_route                              | expected_primary_expert | acceptance_signal       | rationale |
|----|----------|----------------------|-------------------------------------------------------------------------------------|---------------------------------------------|-------------------------|-------------------------|-----------|
| 01 | design   | ui-design            | 设计 enterprise admin dashboard 的 sidebar, 数据驱动 + 标准化导航                    | ui-task-default                             | ui-ux-pro-max           | matched (priority 50)   | non-anchor default — CLAUDE.md UI 路由默认 |
| 02 | design   | ui-design            | 给 SaaS landing page 做出风格 distinctive 的 hero 区                                 | ui-task-bold-style-override                 | frontend-design         | matched (priority 100)  | **anchor (D2.3-4): 做出风格 + distinctive** |
| 03 | design   | ui-design            | 给品牌 marketing page 一个 signature style 的 art direction                          | ui-task-bold-style-override                 | frontend-design         | matched (priority 100)  | **anchor (D2.3-4): signature style + art direction** |
| 04 | design   | ui-design            | 设计 product launch 页面 bold style 的 hero, 要 creative 且 experimental             | ui-task-bold-style-override                 | frontend-design         | matched (priority 100)  | **anchor (D2.3-4): bold style + creative + experimental** |
| 05 | design   | ui-design            | 设计 settings 表单 input + label + validation, 标准化布局                            | ui-task-default                             | ui-ux-pro-max           | matched (priority 50)   | non-anchor — 数据驱动 + 标准化 默认 |
| 06 | design   | ui-design            | 给 user profile 页面设计 avatar + 信息栅格, 数据可解释                               | ui-task-default                             | ui-ux-pro-max           | matched (priority 50)   | non-anchor — 标准化场景 |
| 07 | search   | search               | 找一个独特的搜索方案对比 Tavily 和 Exa                                                | search-default                              | tavily-mcp              | matched (priority 50)   | **false-pos (D2.3-4): 独特 应不触发 style override; 跨段** |
| 08 | design   | ui-design            | 设计 notification center 卡片列表, 信息层级清晰可解释                                | ui-task-default                             | ui-ux-pro-max           | matched (priority 50)   | non-anchor — 数据驱动 |
| 09 | design   | ui-design            | 给 landing page 做出风格化的 hero + 内容栅格                                          | ui-task-bold-style-override                 | frontend-design         | matched (priority 100)  | **CD-3 edge: 风格化 ∈ do_not_use_when ∩ override_keywords — D-08 双向 redirect 一致** |
| 10 | design   | ui-design            | 设计 design-led 的 marketing site, 突出品牌调性                                       | ui-task-bold-style-override                 | frontend-design         | matched (priority 100)  | **CD-3 edge: design-led + 品牌调性 ∈ override_keywords — D-08 一致** |
| 11 | content  | pptx-file-operation  | 创建 12-slide 技术汇报 pptx 模板, 含图表 page master                                 | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | task_type 直接命中 — 官方 pptx skill |
| 12 | content  | pptx-file-operation  | 编辑现有 pptx, 替换第 5 页 slide master 为新 layout                                  | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | pptx 文件操作 — anthropics 官方 |
| 13 | content  | pptx-file-operation  | 批量给 30-page pptx 注入 footer + page number                                         | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | pptx 批量操作 |
| 14 | content  | pptx-file-operation  | 从 markdown 大纲生成 pptx 含 bullet + 图片占位                                        | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | markdown → pptx 转换 |
| 15 | content  | slide-deck           | 用中文做产品发布会 slide deck, 含图表 + 中文字体                                       | chinese-content-deck                        | jimliu-baoyu-skills-baoyu-slide-deck | matched (priority 70) | **anchor — 双键 task_type + language=zh** (隐含 language=zh) |
| 16 | content  | pptx-file-operation  | 用 anthropics pptx skill 给学术报告做 32-page deck                                    | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | task_type 直接命中 |
| 17 | content  | slide-deck           | 用中文做内部全员会 slide deck, 含数据图表                                              | chinese-content-deck                        | jimliu-baoyu-skills-baoyu-slide-deck | matched (priority 70) | 双键 task_type + language=zh |
| 18 | content  | pptx-file-operation  | 给 pptx 模板加 page transition 动效                                                   | pptx-file-task                              | anthropics-skills-pptx  | matched (priority 80)   | pptx 文件操作 |
| 19 | content  | slide-deck           | 用英文 markdown 直接展示销售方案, 不输出 pptx                                          | (fallback)                                  | null                    | none (no rule match)    | **false-pos 负样本: 缺 language=zh 第二键 → fallthrough** |
| 20 | content  | slide-deck           | 用中文做 generic markdown 文档转 slide deck                                            | chinese-content-deck → rejected             | null                    | none (rejected no-redirect) | **CD-3 edge: do_not_use_when=[generic markdown] hit + 无 if_rejected_use → kind=none** |
| 21 | testing  | e2e-test             | E2E 测试 Next.js 14 app router app, setup 仅浏览器 + HTTP API                          | e2e-default                                 | playwright-test         | matched (priority 50)   | TS frontend 默认 — playwright-test |
| 22 | testing  | e2e-test             | E2E 测试 Vue 3 app SSR rendering 流程                                                  | e2e-default                                 | playwright-test         | matched (priority 50)   | TS frontend 默认 |
| 23 | testing  | e2e-test             | E2E 测试 Django + Tortoise ORM app, setup 需直调 Python 后端                            | e2e-with-python-backend                     | webapp-testing          | matched (priority 70)   | 双键 task_type + backend_language=python (隐含) |
| 24 | testing  | e2e-test             | E2E 测试 FastAPI + pandas backend, setup 直调 Python utils                              | e2e-with-python-backend                     | webapp-testing          | matched (priority 70)   | 双键 backend_language=python |
| 25 | testing  | performance          | 测 React app perf LCP / Core Web Vitals, 找瓶颈 chrome devtools                         | perf-a11y-memory                            | chrome-devtools-mcp     | matched (priority 100)  | **anchor: array trigger task_type=performance** (CLAUDE.md 笔记硬规则) |
| 26 | testing  | memory-leak          | 诊断 SPA app memory-leak, 抓 heap snapshot 排查                                         | perf-a11y-memory                            | chrome-devtools-mcp     | matched (priority 100)  | array trigger task_type=memory-leak |
| 27 | testing  | e2e-test             | E2E 测试 Remix app, 仅浏览器 setup                                                      | e2e-default                                 | playwright-test         | matched (priority 50)   | TS frontend |
| 28 | testing  | e2e-test             | E2E 测试 Next.js 15 app router, 仅浏览器 + REST API                                     | e2e-default                                 | playwright-test         | matched (priority 50)   | TS frontend |
| 29 | testing  | e2e-test             | E2E 测试 Vue 3 SPA — pure-frontend 无 Python backend                                    | e2e-with-python-backend → rejected → e2e-default | playwright-test     | matched OR rejected+redirect | **CD-3 edge: do_not_use_when=[pure-frontend] hit + if_rejected_use=playwright-test — 终态一致** |
| 30 | testing  | ai-explore           | AI 探查页面结构 + 调试一次性交互, 拿 element-ref                                         | ai-explore-debug                            | playwright-cli          | matched (priority 50)   | array trigger task_type=ai-explore (CLAUDE.md "playwright-cli AI 探查") |

---

## § 3 30-Sample Harness Verify

```bash
# 1. Sample count == 30
grep -cE "^\| (0[1-9]|[12][0-9]|30) \|" .planning/phase-2.3/SAMPLES.md
# Expected: 30

# 2. 9-keyword anchor coverage (≥3 from D2.3-4 anchor set)
grep -cE "做出风格|signature style|bold style|design-led|distinctive|品牌调性|风格化|art direction|creative|experimental|独创" .planning/phase-2.3/SAMPLES.md
# Expected: ≥ 5 (anchor cases body refs)

# 3. false-pos 负样本 ≥1 (`独特` 应 NOT trigger style override)
grep -E "独特" .planning/phase-2.3/SAMPLES.md
# Expected: ≥ 1 (S07 false-pos negative sample)

# 4. CD-3 negative-space disqualify edge ≥3 (跨段)
grep -cE "CD-3 edge|rejected" .planning/phase-2.3/SAMPLES.md
# Expected: ≥ 3

# 5. Selection rationale present (B-21 anti-cherry-pick)
grep -cE "^## § 1 Selection Rationale|^## § 2 Sample Truth Table" .planning/phase-2.3/SAMPLES.md
# Expected: 2

# 6. Category distribution = 10/10/10
grep -cE "^\| (0[1-9]|10) \| design "    .planning/phase-2.3/SAMPLES.md  # design 6 行直接命中, 4 行通过 task_type=ui-design (S07 例外为跨段 search)
grep -cE "^\| (1[1-9]|20) \| content "   .planning/phase-2.3/SAMPLES.md
grep -cE "^\| (2[1-9]|30) \| testing "   .planning/phase-2.3/SAMPLES.md
```

---

## § 4 Known miss / acceptable fallback (phase 2.3 v0.2 baseline)

> 沿袭 phase 1.4 SAMPLES.md § 8.4.1 / phase 2.2 SAMPLES.md § 4 transparency 模式 — 任何已知 miss/fallthrough 在此显式 enumerate.

phase 2.3 v0.2 baseline 期望 **≥26/30 hit rate (≥85% — D-05 acceptance bar)**:

- **S19 fallback expected (null)** — 缺 language=zh 第二键约束, `chinese-content-deck` 不命中, 无 specific rule 兜底 → arbitrate 正确返 null (符合 expected null = hit)
- **S20 rejected-no-redirect expected (null)** — `chinese-content-deck` do_not_use_when 命中 + 无 `if_rejected_use` → `arbitrateWithRedirect` 返 `{ kind: 'none' }`, actualExpert = null = expected null (hit)
- **D-08 双向 redirect 一致性 (S09/S10/S29)** — 当 do_not_use_when 与 override_keywords 词集 overlap (design 段 4 词全 overlap), 实际 arbitrate 走 priority=100 ui-task-bold matched 路径而非 rejected+redirect 路径; 终态 expected_primary_expert 一致 (frontend-design / playwright-test), 不计 miss

若 v0.3.0 升级 real Claude inference (phase 3.4+), 期望 hit rate ≥ 0.92 (LangChain industry ceiling); 当前 v0.2 mock arbitrateWithRedirect 期望 ≥ 0.85 (≥ 26/30) — 给词集校准留 buffer 防止 boundary case.

---

## § 5 References

- KICKOFF.md § 1.2 D-05 (30 sample × design/content/testing — ≥85% routing acceptance bar)
- task_plan.md T4.1 (B-21 + B-22 + B-23 selection rationale + D-08 双向 redirect 一致性)
- `.planning/phase-1.4/SAMPLES.md` § 1.1 (R3 frozen + 三约束源头)
- `.planning/phase-2.2/SAMPLES.md` § 2 (truth table 列 schema 模板)
- routing/decision_rules.yaml v2 (Phase 2.3 W2 T2.1 ship — CD-3 + 9-keyword 词集 + 3 negative-space)
- `src/routing/lib/arbitrateRedirect.ts` (Phase 2.3 W2 T2.2 NEW — discriminated union 三态 arbitrate)
- ADR 0012 (draft Wave 6 T6.1 finalize — CD-3 negative-space + if_rejected_use redirect arbitrate)
- CLAUDE.md (用户全局规则 — trigger phrase 来源 1.1 约束 1)
