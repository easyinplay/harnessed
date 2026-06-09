# Phase 2.2 — 30 真实查询样本 (Execute-Task Workflow Baseline v0.2)

> **Status**: frozen at phase 2.2 plan-phase Wave B / **execute-phase 不允许改样本** (R3 沿袭 phase 1.4 frozen 模式)
> **Trigger**: Phase 2.2 KICKOFF § 1.2 F7 acceptance bar — 30 sample × execute-task workflow → ralph-loop COMPLETE 100% rate
> **Test consumer**: `scripts/run-samples.mjs` + `tests/cli/execute-task.test.ts` (T5.5 — 1:1 对应)
> **Plan-checker (Wave C) 验收**: SAMPLES.md frozen — execute-phase 任何 sample 字段修改 = ADR 0011+ errata 触发

---

## § 1 Selection Rationale (B-29 selection rationale — 防 cherry-pick 透明声明)

### 1.1 来源约束 (沿袭 phase 1.4 § 1.1 三约束)

每个 prompt 必须满足以下 ≥1 条约束：

1. **CLAUDE.md trigger phrase 直接命中** — 用户全局规则中明示的关键词 / 决策路由
2. **phase 1.4 / 1.5 / 2.1 progress.md 实战决策点** — 历史真实出现的路由决策场景
3. **8 支柱 mattpocock 23 招式 + 心法 4** 实际场景投影
4. **execute-task workflow 4-phase chain** (01-clarify / 02-code / 03-test / 04-deliver) trigger 场景

### 1.2 分布 (15 reused + 15 new — B-29 frozen reuse rationale)

> **B-29 rationale**: phase 1.4 SAMPLES.md `§ 2 Sample Truth Table` 30 sample 已 frozen v0.1.1 baseline (28/30 specific match @ phase 1.5 v2 errata). routing arbitrate 路径仍是 execute-task workflow 4-phase chain 的 step 1 (arbitrate → install → factory → spawn) — 复用 15 sample = backward compat regression coverage (phase 1.4 routing 不能 regress). 新增 15 sample 专门覆盖 phase 2.2 W4 execute-task workflow chain 行为 (multi-phase spawn / model tier resolve / ralph-loop COMPLETE round-trip / dual-signal degraded paths / SDK error 恢复).

| Group | Sample 数 | Source | Coverage focus |
| ----- | --------- | ------ | -------------- |
| Reused from phase 1.4 | 15 | `.planning/phase-1.4/SAMPLES.md` § 2 | routing arbitrate v2 regression (canary `search-default` tavily-mcp first) |
| New phase 2.2 (4 phase chain) | 4 | execute-task workflow 4-phase trigger | 01-clarify / 02-code / 03-test / 04-deliver each spawn |
| New phase 2.2 (ralph-loop max-iter) | 3 | T2.4 ralphLoopWrap boundary | maxIter=1 / 3 / 20 退场 |
| New phase 2.2 (structured_output paths) | 4 | B-07 PRIMARY vs FALLBACK | Tier A / Tier B / partial / mixed |
| New phase 2.2 (dual-signal degraded) | 2 | T2.4 4-layer | outer FALLBACK only / inner FALLBACK only |
| New phase 2.2 (异常路径) | 2 | F7 acceptance bar | SDK error / invalid model 错误恢复 |
| **TOTAL** | **30** | — | 100% COMPLETE rate target |

### 1.3 Canary sample (first row)

`S01 = search-default → tavily-mcp` (sourced from phase 1.4 `search-1`) — 由 prompt KICKOFF § 1.2 W5 canary 指定. 保证 30-sample harness first iteration 命中 stable arbitrate path (B-07 PRIMARY path + 4-字段 baseline 5-字段 SDK input).

### 1.4 Cherry-pick 防御 (沿袭 phase 1.4 § 1.4)

- SAMPLES.md plan-phase Wave B 锁定，execute-phase **不允许改样本** (R3 frozen 模式 v0.2)
- `scripts/run-samples.mjs` (T5.5) loops 本文件 § 2 truth table 1:1
- per-group breakdown 防止单组拉高 mean

---

## § 2 Sample Truth Table (30 sample)

### 2.1 Reused from phase 1.4 (15 sample — arbitrate v2 backward-compat regression)

| #   | task_type             | expected_route                              | primary_expert                       | acceptance_signal                           |
| --- | --------------------- | ------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| S01 | search                | search-default                              | tavily-mcp                           | COMPLETE (canary — KICKOFF W5)              |
| S02 | search                | search-default                              | tavily-mcp                           | COMPLETE (库 API 文档 keyword)              |
| S03 | search                | search-academic-or-batch-or-token-sensitive | exa-mcp                              | COMPLETE (signals 学术/论文 phase 1.5 v2)   |
| S04 | search                | search-academic-or-batch-or-token-sensitive | exa-mcp                              | COMPLETE (signals 批量 URL/token-sensitive) |
| S05 | ui-design             | ui-task-default                             | ui-ux-pro-max                        | COMPLETE (CLAUDE.md UI 路由默认)            |
| S06 | ui-design             | ui-task-bold-style-override                 | frontend-design                      | COMPLETE (override_keywords 做出风格 v2)    |
| S07 | pptx-file-operation   | pptx-file-task                              | anthropics-skills-pptx               | COMPLETE (anthropics 官方 skill)            |
| S08 | slide-deck            | chinese-content-deck                        | jimliu-baoyu-skills-baoyu-slide-deck | COMPLETE (双键 task_type+language=zh)       |
| S09 | e2e-test              | e2e-with-python-backend                     | webapp-testing                       | COMPLETE (双键 backend_language=python)     |
| S10 | e2e-test              | e2e-default                                 | playwright-test                      | COMPLETE (TS frontend 默认)                 |
| S11 | performance           | perf-a11y-memory                            | chrome-devtools-mcp                  | COMPLETE (array semantic match phase 1.5)   |
| S12 | skill-creation        | meta-create-skill                           | anthropics-skills-skill-creator      | COMPLETE (anthropics 官方)                  |
| S13 | skill-discovery       | meta-find-skill                             | vercel-labs-skills-find-skills       | COMPLETE (vercel-labs 发现入口)             |
| S14 | engineering           | engineering-execute-tdd                     | (mattpocock_phases.execute.skills)   | COMPLETE (TDD keyword phase 1.5 v2)         |
| S15 | engineering           | engineering-execute-debug                   | (mattpocock_phases.execute.skills)   | COMPLETE (diagnose 排错 keyword)            |

### 2.2 New phase 2.2 — execute-task 4-phase chain trigger (4 sample)

| #   | task_type    | expected_route | primary_expert         | acceptance_signal                                       |
| --- | ------------ | -------------- | ---------------------- | ------------------------------------------------------- |
| S16 | execute-task | 01-clarify     | superpowers brainstorm | COMPLETE (phase 1 任务复杂度澄清 / opus)                |
| S17 | execute-task | 02-code        | karpathy 心法          | COMPLETE (phase 2 small surgical changes / sonnet)      |
| S18 | execute-task | 03-test        | superpowers TDD        | COMPLETE (phase 3 conditional TDD red-green / sonnet)   |
| S19 | execute-task | 04-deliver     | ralph-loop             | COMPLETE (phase 4 verbatim COMPLETE round-trip / haiku) |

### 2.3 New phase 2.2 — ralph-loop max-iter boundary (3 sample)

| #   | task_type    | expected_route                | primary_expert | acceptance_signal                                              |
| --- | ------------ | ----------------------------- | -------------- | -------------------------------------------------------------- |
| S20 | execute-task | ralph-loop max_iter=1         | (any)          | COMPLETE iter=1 (single-shot PRIMARY structured_output)        |
| S21 | execute-task | ralph-loop max_iter=3         | (any)          | COMPLETE iter≤3 (retry boundary — T2.4 ralphLoopWrap)          |
| S22 | execute-task | ralph-loop max_iter=20        | (any)          | COMPLETE iter≤20 (D1.4-3 lock default — F7 30-sample test bar) |

### 2.4 New phase 2.2 — structured_output paths (4 sample — B-07 PRIMARY vs FALLBACK)

| #   | task_type    | expected_route                          | primary_expert | acceptance_signal                                                                       |
| --- | ------------ | --------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| S23 | execute-task | PRIMARY structured_output Tier A        | (any)          | COMPLETE via `structured_output.status='COMPLETE'` (W4 sdk-spawn cell 3)                |
| S24 | execute-task | FALLBACK `<promise>COMPLETE</promise>`  | (any)          | COMPLETE via verbatim promise extract (W4 sdk-spawn cell 4 — B-07 fallback)             |
| S25 | execute-task | PARTIAL Tier B (structured_output none) | (any)          | COMPLETE — fall through PRIMARY → FALLBACK chain, text-only verbatim hit               |
| S26 | execute-task | MIXED (structured_output PARTIAL → COMPLETE next iter) | (any) | COMPLETE iter=2 (T2.4 ralphLoopWrap retry — PARTIAL → retry → COMPLETE)                |

### 2.5 New phase 2.2 — dual-signal degraded paths (2 sample — T2.4 4-layer table)

| #   | task_type    | expected_route                            | primary_expert | acceptance_signal                                                                |
| --- | ------------ | ----------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| S27 | execute-task | outer FALLBACK only (struct_output empty) | (any)          | COMPLETE via inner verbatim extract path (4-layer L3 → L4 fallback)              |
| S28 | execute-task | inner FALLBACK only (no verbatim promise) | (any)          | COMPLETE via outer structured_output PRIMARY path (4-layer L1 → L2 — exclusive)  |

### 2.6 New phase 2.2 — 异常路径 (2 sample — F7 acceptance bar SDK error 恢复)

| #   | task_type    | expected_route                       | primary_expert | acceptance_signal                                                                            |
| --- | ------------ | ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------- |
| S29 | execute-task | SDK error → re-spawn → COMPLETE      | (any)          | COMPLETE — SDK transient error recovered via ralph-loop next iter (sdk-spawn cell 8 mirror)  |
| S30 | execute-task | invalid model → fallback to 'inherit'| (any)          | COMPLETE — B-10 escape hatch kicks in (--model-tier inherit forces all phases to 'inherit')  |

---

## § 3 Run-samples Harness Verify

```bash
# 1. Sample count == 30
grep -cE "^\| S[0-9]+\s*\|" .planning/phase-2.2/SAMPLES.md
# Expected: 30

# 2. 4-phase chain coverage (S16-S19)
grep -cE "01-clarify|02-code|03-test|04-deliver" .planning/phase-2.2/SAMPLES.md
# Expected: ≥ 4 (sample rows) + extra body refs

# 3. Selection rationale present (B-29 anti-cherry-pick)
grep -cE "^## § 1 Selection Rationale|^## § 2 Sample Truth Table" .planning/phase-2.2/SAMPLES.md
# Expected: 2
```

---

## § 4 Known miss / acceptable fallback (phase 2.2 v0.2 baseline)

> 沿袭 phase 1.4 SAMPLES.md § 8.4.1 transparency 模式 — 任何已知 miss/fallthrough 在此显式 enumerate.

phase 2.2 v0.2 baseline 期望 **30/30 COMPLETE 100% rate** — `scripts/run-samples.mjs` 是 wiring round-trip 验证 (mocked SDK 注 structured_output.status='COMPLETE') 而非 real Claude inference. 所有 30 sample 在 mocked SDK 下都应返 COMPLETE, 无 known miss.

若 v0.3.0 phase 3.4 升级到 real Claude inference (D1.4-5 升级路径), 期望 ≥ 27/30 (90%) hit rate, content-5 / meta-5 / engineering coverage gap sample 同 phase 1.5 baseline 已知 acceptable fallback.

---

## § 5 References

- KICKOFF.md § 1.2 F7 (30-sample COMPLETE 100% rate acceptance bar)
- task_plan.md T5.4 (B-29 + D-WP-6 selection rationale)
- `.planning/phase-1.4/SAMPLES.md` § 2 (15 reuse source — frozen v0.1.1)
- ADR 0011 § 3 dual-signal completion 4-layer table (T2.4 ralphLoopWrap)
- ADR 0011 § 4 contract v1.2 reconcile (5-字段 SDK input + 9-字段 prompt inject)
- B-07 ASSUMPTIONS — structured_output PRIMARY vs `<promise>COMPLETE</promise>` FALLBACK
- B-10 ASSUMPTIONS — `--model-tier inherit` 逃生口 (SDK parent-resolve)
- B-29 ASSUMPTIONS — 15 reuse + 15 new selection rationale
- workflows/execute-task/phases.yaml — 4-phase chain (T3.3)
- tests/routing/sdk-spawn.test.ts (W4 T4.3) — cell 3+4 PRIMARY+FALLBACK path 覆盖
- tests/routing/routing-engine.test.ts (W4 T4.3) — cell 1-4 engine end-to-end + ralph-loop closure
