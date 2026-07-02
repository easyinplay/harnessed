# ADR 0036 — Completion gate 交互面三级偏好链: ralph-loop plugin → native /goal → self-loop

- **Status**: Accepted
- **Date**: 2026-07-02
- **Supersedes**: none — **Amends** ADR-0011 D-10 与 ADR-0028 的**交互 cmd 面**(仅 SKILL.md 指令层);SDK wrapper(`src/workflow/lib/ralphLoop.ts`)不变
- **Relates to**: ADR-0011(execute-task SDK + ralph-loop 真接)、ADR-0028(D-10 R20.10 capability wire)、`.planning/phases/_patch-4.14.0-cross-harness-setup/`(cross-harness parity 前置)
- **Milestone**: (patch 4.15.0,无活动 milestone)

## Context

ralph-loop 是 base 组件集中唯一没有 codex 安装路径的组件(claude-plugins-official 专属;
openai/plugins 无等价,4.14.0 已按 harness-mismatch 诚实跳过)。用户提出以 CC 原生 `/goal`
替代;查证(2026-07-02,官方 docs)结论:

- **CC `/goal`**(v2.1.139+,内置零安装):条件句(≤4k chars)定义终止条件,每轮由 Haiku
  评估器判定,未满足自动续轮;支持 "or stop after N turns" 转义子句;需 workspace trust +
  hooks 未禁用。来源: code.claude.com/docs/en/goal.md
- **Codex `/goal`**(原生):概念相同、实现 Codex-specific。来源:
  developers.openai.com/codex/use-cases/follow-goals
- **ralph-loop plugin**:Stop-hook 拦截 + 同 prompt 重喂,completion-promise **逐字匹配**
  (官方 README 自认脆弱,以 `--max-iterations` 为真正安全网)。

完全替换的 trade-off 分析(见下 Consequences)显示 `/goal` 并非严格占优 — 用户裁决
(2026-07-02 LOCKED):**不替换,做三级偏好链** — 有 ralph-loop 用它,没有 fallback 到
`/goal`,再没有 self-loop 兜底。

## Decision

1. **交互面(28 workflow 的 SKILL.md 指令)三级偏好链**:
   - Tier 1 — `/ralph-loop "<prompt>" --max-iterations <N> --completion-promise "COMPLETE"`
     (plugin 已装时优先;fail-closed 逐字匹配 + 硬迭代上界)
   - Tier 2 — plugin 未装 → native `/goal "this subtask is delivered: the subagent's final
     output contains verbatim <promise>COMPLETE</promise>; or stop after <N> turns"`
     (CC 2.1.139+ / Codex 双平台内置;条件句压缩为近似 verbatim 匹配以收窄 fail-open 余量)
   - Tier 3 — `/goal` 亦不可用(CC < 2.1.139 / 其他 harness)→ self-loop:
     spawn → 查 `<promise>COMPLETE</promise>` → 重 spawn(至多 max_iterations)
2. **叶子层约束**:`/goal` 每 session 单槽、新目标覆盖旧目标 — goal 只准在叶子 subtask 层
   设置,禁止 master/sub-stage 嵌套设置(嵌套会静默覆盖外层 gate)。
3. **SDK 路径零改动**:`ralphLoopWrap`(for-loop 硬上界 + 4-layer `isComplete` verbatim
   判定)是 headless `harnessed run` 的执行体,不参与该链。R20.10
   `max_iterations_exceeded → emit_warning_and_halt` 硬契约仅在 SDK/Tier 1 有硬保证。
4. **manifest 不动**:`manifests/tools/ralph-loop.yaml` 留在 base 集(claude 继续安装;
   codex 维持 harness-mismatch 跳过 — 那里 plugin 本不存在,由 Tier 2 接管)。
5. **不加 capability schema 字段**:链条语义由 SKILL.md 指令文本承载;
   `capabilities.yaml` 仅更新 description + D-10 注释指针(check-workflow-schema 兼容)。

## Consequences

正向:codex 与未装 plugin 的 claude 环境获得强于盲目 self-loop 的原生 completion gate;
plugin 环境行为零变化;base 集 13 组件的 codex 功能覆盖闭合(ralph-loop 组件本身仍不装,
但其职责由 `/goal` 承接)。

代价与风险(完全替换方案被否决的原因,三级链将其局限在"本来就没有硬闸门"的环境):

1. **fail-closed vs fail-open**:逐字匹配的失败方向是漏判(多跑几轮,劣质交付不放行);
   `/goal` 的 Haiku 评估存在误判为真方向(提前放行)。缓解:条件句写 verbatim promise,
   把评估任务压缩成近似字符串匹配;subagent 侧 verbatim promise 输出约定不变。
2. **硬上界 vs 软上界**:`--max-iterations` 是代码强制;"or stop after N turns" 是评估器
   解释的自然语言,无硬保证。Tier 2 环境的失控兜底弱于 Tier 1/SDK。
3. **单槽覆盖**:`/goal` per-session 单槽,嵌套 workflow 会静默覆盖外层 gate — 以
   Decision 2 的叶子层约束规避,依赖指令遵从(无机制强制)。
4. **双平台实现差异**:CC 与 Codex 的 `/goal` "概念相同、实现各异"(评估机制、转义子句
   支持度未必一致)— SKILL.md 单份指令在两平台的实际行为可能有差,文档如实标注,
   不宣称语义一致。

## Verification

- 46 个 SKILL.md(23 en + 23 zh-Hans)指令文本三级链落地;check-skill-i18n-parity 绿
- capabilities.yaml / task/deliver workflow.yaml 注释 + description 更新;check-workflow-schema 绿
- `ralphLoopWrap` / `promiseExtract` / `fallbackHandlers` / ralph-loop manifest 零 diff
