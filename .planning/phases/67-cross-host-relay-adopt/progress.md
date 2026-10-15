# Phase 67 — progress

> 当前节点。详细计划见 `task_plan.md`;执行中的发现进 `findings.md`。

## 状态

- **立项**: 2026-10-15
- **当前**: T10(ADR 改写)进行中;T1 待起
- **基线**: HEAD `afe9e7b`,vitest 3296/0,npm latest 4.48.0

## 治理关卡

| 关卡 | 状态 |
|---|---|
| gstack `/plan-eng-review` | ✅ 2026-10-15,`SCOPE_REDUCED`,15 issues,0 critical gaps,0 unresolved。产物:`~/.gstack/projects/easyinplay-harnessed/tasks-eng-review-20261015-093003.jsonl`(12 行)+ 同目录 test-plan |
| 外部意见 | ✅ Claude subagent(**非 codex**:维护者长期约束「claude 宿主永不自动拉起 `codex exec`」;本轮已把 `codex_reviews` 设为 `disabled`,该约束现由二进制强制)。13 条,7 条验证成立并吸收 |
| `/office-hours` + `/plan-ceo-review` | ⏭️ 跳过。非新产品方向:scope 已由维护者 2026-10-14 裁决「做」+ TODOS 条目定义,属既有 backlog 的实现关卡,不是战略层决策 |
| `superpowers:brainstorming` | ⏭️ 跳过。多方案对比已在 `/plan-eng-review` 的 Step 0 与四节审查里穷尽(共 16 个决策点逐个交维护者裁定),再 brainstorm 是重复 |

## 任务进度

- [ ] T1 `repoKey` 大小写归一 + 账本键迁移 【最先】
- [ ] T2 抽 `readStoreAt(root)`
- [ ] T3 导出 `resolveHostWithReason()`
- [ ] T4 `adoptSlot.ts` 核心
- [ ] T5 目标宿主未 setup 时拒绝
- [ ] T6 CLI 接线
- [ ] T7 `::displaced-*` 归档 + 修剪
- [ ] T8 `resume` 宿主措辞
- [ ] T9 测试 27 路径 + R1/R2/R3
- [ ] T10 改写 ADR-0043  ← 进行中
- [ ] T11 10 份 README 命令表
- [ ] T12 `retro_meta` 取 max

## TDD 判据

T1 / T4 **强制 TDD**(核心数据结构键与迁移、编排逻辑与全部拒绝路径,错误成本高)。
T2 / T3 为行为保持的重构,以回归测试(R1、platform-golden 不变)代替新写 red 测试。
T8 / T10 / T11 为文案与文档,**显式跳过 TDD**(理由记于此,满足跳过声明协议)。

## 阻塞

(无)
