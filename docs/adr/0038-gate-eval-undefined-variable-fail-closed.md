# ADR 0038 — gate eval 未定义变量按配置错误 fail-closed(ADR 0029 fail-soft 的例外)

- **Status**: Accepted
- **Date**: 2026-07-11
- **Supersedes**: none — **Amends** ADR-0029 的 fail-soft 语义(v3.9.23 起三处 gate-eval catch:
  `src/cli/gates.ts` / `src/workflow/masterOrchestrator.ts` / `src/workflow/run.ts` phase gate);
  其余 eval 错误的 fail-soft **不变**。按 ADR-0029 守恒条款以新 ADR 承载,不改其 main body。
- **Relates to**: ADR-0029(fallback 3 铁律 + fail-soft)、GitHub issue #5、
  `.planning/phases/_patch-4.23.2-gate-eval-skip-sub/`(dogfood 确诊)
- **Milestone**: (patch 4.23.2,无活动 milestone)

## Context

用户 dogfood(issue #5,`harnessed gates verify`)确诊:`stage-routing.yaml`
`verify-multispec-critical-release.fires` 按 root-flat schema 契约
(`src/workflow/schema/phaseFactContext.ts` `is_critical_release` root-flat required boolean)
裸引用 `is_critical_release`,而 v4.1.2 抽出的 `buildDefaultGateContext` 漏掉了该键 →
expr-eval 抛 `undefined variable: is_critical_release` → ADR 0029 fail-soft 把异常当
`gate=true` → **非关键发布的每次普通 verify 都误触 verify-multispec(4-specialist
Agent Team,成本最高的子项)**,与 gate 本意(仅 critical release 才 fire)完全相反。

根因分型:expr-eval 的 "undefined variable" 只发生在**裸标识符缺失于求值上下文**时
(object member 缺失静默求 false,4.23.2 实证)。这是 gate 表达式与 gateContext 契约的
**静态配置漂移**,写下那一刻就注定每次求值必抛 — 不是 ADR 0029 想兜的运行时操作性故障
(文件不可读 / judgment ref 不存在等偶发)。对配置错误 fail-open 的后果是:
**gate 越贵,误触越贵** — 默认路径变成了最贵路径。

## Decision

三处 gate-eval catch(`gates.ts` / `masterOrchestrator.ts` / `run.ts`)按错误类分流(4.23.2):

1. **`isUndefinedVariableError(e)`(`GateEvalError` 且消息含 `undefined variable`,
   `src/workflow/exprBuilder.ts` 导出)→ fail-CLOSED**:视为 `gate=false` 不 fire,
   skip reason 记 `misconfigured (undefined variable) — fail-closed, not fired`,
   console.warn 醒目指引(修 judgments yaml 表达式,或经 `--context` / gateContext
   defaults 补变量)。
2. **其余 eval 错误 → 维持 ADR 0029 fail-soft**(`gate=true` fire + warn),措辞不变。

静态面守卫:`tests/workflow/judgmentContextAudit.test.ts` 遍历
`workflows/judgments/*.yaml` 全部 `fires_when` / `skips_when`,对
`buildDefaultGateContext` 逐个求值断言零抛错 — 该类漂移在 CI 就红,不再等 dogfood。
(此测试放在 v4.1.2 当时就会当场抓住本 bug。)

## Consequences

- **正向**:配置漂移的爆炸半径从"误触最贵子项"收敛为"该子项不 fire + 醒目 warn";
  普通 verify 回到预期集合(progress + code-review + paranoid + simplify)。
- **弱化(接受)**:若某 gate 本应 fire 而表达式写错变量名,fail-closed 会漏 fire —
  由 audit 测试(CI 静态红)+ warn 双通道兜底,权衡上远优于 fail-open 到 Agent Team。
- **不变**:ADR 0029 对运行时故障的 fail-soft、fallback 3 铁律、parallelism gate 的
  conservative-false 全部原样。

## Verification

- tests/workflow/judgmentContextAudit.test.ts(全 judgments 表达式 × 默认上下文审计,TDD 先红)
- tests/cli/gates.test.ts cell 17/17b、tests/workflow/masterOrchestrator.test.ts fixture 41、
  tests/workflow/run.test.ts fixture 4b/4c(fail-closed 与 fail-soft 边界双向锁定)
- tests/cli/gateContext.test.ts(root-flat `is_critical_release: false` 回归)
