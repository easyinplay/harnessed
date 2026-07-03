# task_plan — 4.16.3 mattpocock 招式上游对账 + mcp formatSpawnFail 统一(两个登记 follow-up)

status: ready-to-execute
上游对账实证(2026-07-04,gh api 全目录清单):
- engineering: ask-matt code-review codebase-design diagnosing-bugs domain-modeling grill-with-docs implement
  improve-codebase-architecture prototype research resolving-merge-conflicts setup-matt-pocock-skills tdd
  to-issues to-prd triage
- productivity: grill-me grilling handoff teach writing-great-skills;personal/deprecated/in-progress 不采
失配三类:diagnose→diagnosing-bugs(改名)、zoom-out(删除,无稳定后继)、investigate(上游消失;gstack 有同名 skill)。

## 决策(锁定)
- D1 capability KEY 一律不改(49 处引用面);只改 cmd / aliases / 描述。
- D2 diagnose: cmd `/diagnose` → `/diagnosing-bugs`;所有 aliases 链中 `{impl: mattpocock-skills, cmd: /diagnose}`
  同步;role-prompts(en+zh)与 workflow SKILL/yaml 里字面 `/diagnose` 同步(grep 全量)。
- D3 (REVISED,用户 2026-07-04 指示"不做兼容性保留") zoom-out: capability entry **整体移除**;
  workflows / role-prompts(en+zh)/ decision_rules / SKILL(.zh-Hans).md / workflow.yaml 中全部 zoom-out
  引用一并清理 — 指令清单里的 zoom-out 项直接删除(不找替代招式,勿自行扩容);tools_available 等
  schema 交叉校验清单同步剔除(check-workflow-schema C1 gate 要求 entry ∈ capabilities 集合)。
  Bucket 1 注释计数同步。
- D4 investigate: aliases 链 gstack 提为主(gstack /investigate 实存,本机 53-skill 清单在列),移除失效的
  mattpocock 项;description 同步。
- D5 上游新增 skills 不扩容 capability(YAGNI,follow-up 记 progress.md)。

## T1 — capabilities.yaml 对账 [workflows/capabilities.yaml]
按 D2/D3/D4 改;头部 Bucket 1 注释的 "12 招式" 计数如受影响同步;跑 check-workflow-schema gate。

## T2 — 引用面同步 [workflows/**/SKILL(.zh-Hans).md + workflow.yaml + role-prompts(.zh-Hans).yaml + routing/decision_rules.yaml]
- grep `/diagnose\b`(防误伤 diagnosing-bugs)全量替换 `/diagnosing-bugs`;zoom-out 引用不改名,若有
  "召唤 /zoom-out" 类指令文本,在 role-prompts 层补一句 legacy 说明(轻,勿膨胀)。
- decision_rules.yaml mattpocock_phases 段同步;i18n parity gate(skill+yaml)必须绿。

## T3 — mcp installer formatSpawnFail 统一 [mcpStdioAdd.ts + mcpHttpAdd.ts]
- `${bin} mcp add exited N: stderr.slice(0,200)` → formatSpawnFail(取尾 + sanitize + stdout 兜底),
  与其余 4 installer 对齐;测试同步。

## T4 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs(重点 workflow-schema / skill-i18n-parity / yaml-i18n-parity);
  CHANGELOG `## [4.16.3]`(中文,Edit 工具写)+ bump 4.16.3 + progress.md。不 commit 不 push。
