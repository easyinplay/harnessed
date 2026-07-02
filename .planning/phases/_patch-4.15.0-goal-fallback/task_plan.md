# task_plan — 4.15.0 completion-gate 三级偏好链(ralph-loop → /goal → self-loop)

status: ready-to-execute
scope: 交互面 completion gate 增加 native /goal 中间层;plugin 仍优先;SDK wrapper(ralphLoopWrap)零改动
决策(用户锁定 2026-07-02):有 ralph-loop 用它,没有 fallback 到 /goal,再没有 self-loop。不是替换。

## research 依据(已实证,见对话/ADR 草案)
- CC /goal:v2.1.139+ 内置零安装;条件句(≤4k chars)+ Haiku 评估器自动续轮;"or stop after N turns" 软上界;
  需 workspace trust + hooks 未禁用。来源 code.claude.com/docs/en/goal.md
- Codex /goal:原生存在,概念相同实现各异。来源 developers.openai.com/codex/use-cases/follow-goals
- trade-off:plugin 逐字匹配 = fail-closed + 硬 max-iterations;/goal = LLM 评估有 fail-open 余量 + 软上界
  → 所以 plugin 优先,/goal 只接管无 plugin 环境(codex 全部 + 未装 plugin 的 claude),self-loop 兜底(CC<2.1.139)。

## T1 — 23 对 SKILL.md / SKILL.zh-Hans.md 指令文本(唯一大改动面)
现文本(2 个变体,"b." 嵌套与 "2." 编号,内容一致):
  EN: "...wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations)."
改为三级链(EN,zh 同义镜像):
  "...wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one."
- 保持各文件原有前缀("b."/"2.")与缩进;en↔zh 结构 parity(CI gate check-skill-i18n-parity)。
- workflows/ 下含 "ralph-loop plugin" 的 23 en + 23 zh 全部替换;task/deliver 的 SKILL.md 叙述段落同步补一句三级链。

## T2 — capabilities.yaml ralph-loop entry
- description 更新为三级链措辞(plugin preferred; native /goal fallback on claude≥2.1.139 & codex; self-loop last)。
- 不加新 schema 字段(check-workflow-schema.mjs 兼容风险);链条语义由 SKILL.md 指令承载。
- 头部注释区 D-10 注释补一行 4.15.0 amendment 指针。

## T3 — workflows/task/deliver/workflow.yaml 注释 + defaults 检查
- 头注释补三级链说明;确认 defaults.ralph_max_iterations 插值不受影响(SDK 路径不动)。

## T4 — ADR 0036(amend,非 supersede)
- docs/adr/0036-completion-gate-three-tier-fallback.md:status accepted;amends ADR 0011 D-10 + ADR 0028 的交互 cmd 面;
  记录 trade-off(fail-closed vs fail-open、硬/软上界、单槽覆盖、双平台实现差异)与"plugin 优先"的理由(用户决策);
  SDK wrapper(ralphLoopWrap 硬上界)明确不变。docs/adr/README.md 索引行同步。

## T5 — 收尾
- ralph-loop manifest 不动(claude 继续装;codex 维持 harness-mismatch 跳过——正确,plugin 那边本来就不存在)。
- vitest 全量(SKILL.md 文本变更可能碰 snapshot/字符串断言,逐条核对再改)+ tsc + biome + scripts/check-*.mjs
  (重点 check-skill-i18n-parity / check-workflow-schema)。
- CHANGELOG `## [4.15.0]`(中文)+ package.json bump + progress.md。不 commit 不 push。
