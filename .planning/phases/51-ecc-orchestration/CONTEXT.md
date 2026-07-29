# Phase 51 — ECC skills 编排:语言感知 verify 路由 + 降级链基建

> Status: discuss/plan in progress (2026-07-29)
> 上游治理产物(SoT,不复制只指针):
> - Design doc(APPROVED,四层审毕):`~/.gstack/projects/easyinplay-harnessed/easyi-main-design-20260729-204154.md`
> - CEO review tasks:`~/.gstack/projects/easyinplay-harnessed/tasks-ceo-review-20260729-220726.jsonl`(T0-T6)
> - 决策 D1-D16 见 gstack decision-log(同目录)

## 一句话

兑现 4.32.22 offer 承诺(「点亮细化编排」):`ecc:*` seeds 从 built-but-unwired 变为语言感知 verify 路由,降级链一等公民(有 ecc → 专家,无 ecc → 通用 role-prompt fallback,铁律见 memory `ecc-positioning`)。

## 交付物 sketch(design doc「Recommended Approach」8 条,plan-phase refine)

1. capabilities.yaml alias 标注式降级链(`requires: ecc` + `language:`)+ 链尾不变式 schema 检查
2. check-ecc.ts 结构化 presence probe 抽取(skill 级检测 + 错误表)
3. TS resolver + 3b gates/prompt 会话时消费点 + 3c diff→language fact 推导器
4. verify-routing.yaml(conditional on single-fire 裁决)
5. doctor resolved 路由表(codex 列 display-only)
6. capabilities.yaml L140 stale 注释兑现
7. TDD(resolver/schema 强制)
8. ADR「降级链一等公民 schema + single-fire 机制」

## Open Questions(6,本 phase discuss/plan 裁决)

1. 调用面:skill(`ecc:<lang>-review`)vs agent(`ecc:<lang>-reviewer`)→ 上游实拉验证后定
2. single-fire 机制:code-review aliases 链内解析(推荐)vs 独立 judgment + suppress → 决定交付物 4 存废
3. language fact key 命名 + 多语言 diff fire 语义(前置:expr-eval 表达力 spike)
4. resolver 输出形态:per-harness vs 合并
5. 覆盖语言首发范围(seeds 3 语言 vs 上游 20+)
6. generic tier role-prompt 定义位置;doctor 展示层级(check/info)

## 硬约束

- 降级链铁律:每条路由无 ecc 必须可用(bonus tier,永不硬依赖)
- ADR-0034 single-fire;ADR-0038 fail-closed fires_when
- en-default byte-identical;i18n parity ×3;Biome preempt;vitest `--no-file-parallelism` 权威
- T0(用户 15-min ecc:rust-reviewer vs 通用 review 实测)= kill/降级锚点,execute 前需结论

## Verification 前情

- 4.32.22 已在仓:check-ecc(per-harness)、`ecc:*` seeds(code-review aliases L143-145 / gsd-debug aliases L342-344)、optional offer 文案
- capabilities.yaml L140 注释指向不存在的 `runtime/priority.yaml`(stale,本 phase 兑现)
- gateContext 现无 diff→language 推导(硬编码 + 手传)
