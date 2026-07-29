# progress — Phase 51 ECC skills 编排

## 2026-07-29

- 治理链完成(gstack 层,产物在 `~/.gstack/projects/easyinplay-harnessed/`):`/office-hours` D1-D6 → design doc APPROVED → 2 轮对抗式 doc review(9 issue 修完 8/10)→ `/plan-ceo-review` HOLD SCOPE D7-D16(8 findings 全采纳)→ outside voice(Codex 认证失效,按协议降级 Claude subagent,7 findings 全采纳)。0 unresolved / 0 critical gap。
- GSD 层落地:建 `phases/51-ecc-orchestration/`,写 CONTEXT.md(交付物 sketch + 6 Open Questions + 硬约束)。沿用 46-50 的 task_plan/progress 双文件惯例;milestone 仍 none(与 46-50 同为 patch 驱动 active phase)。
- discuss 阶段实证:并行三路 research subagent —— (1) ECC 上游调用面实拉(skill 面 vs agent 面 + 语言覆盖统计)、(2) 仓内 alias 消费链 + gates/prompt 注入链 + schema gate 落点、(3) expr-eval 表达力 spike(多语言 diff 的 fact 形状)。结论回填 task_plan「锁定决策」。

- 三路结论回填 findings F1-F7,6 个 Open Question 全裁,写出 task_plan(B 方案 D1-D8 / T1-T5)。
- T0 代理实测(TS 面,`ecc:typescript-reviewer` vs 通用,同题同 diff `12a8f22`):**专家发现是通用的真子集**,零语言特有发现(F8)。通用反而独有抓到 `doctor.ts:20` 崩溃面与 descriptor 接缝绕过。
- **用户裁决:降级 Approach A + 修真 bug**。B 方案的 probe/resolver/git 语言推导/schema 全部不建;task_plan 转为回补蓝图。

## 4.32.23 实际交付(Approach A)

- **aliases 首次被渲染**(`src/cli/prompt.ts` `buildToolsSection`):ADR-0034 起 alias 就躺在 yaml 里零消费者,setup offer 承诺的「点亮细化编排」对 subagent 完全不可见。现在 `## Tools` 段在 base cmd 下多一行 specialist alternatives + 单火(never both)+ 降级(未装/不匹配就用 base)指令,语言匹配交给模型。零 probe、零 git spawn、零新模块。
- **alias 名对齐上游 agent 面**:`ecc:python-reviewer` / `rust-reviewer` / `go-reviewer` / `typescript-reviewer`;`ecc:rust-build-resolver` / `go-build-resolver` / `build-error-resolver`(原三个 build 名上游根本不存在)。新增 agent-face 正则守卫 + 降级链链尾不变式测试(有 ecc alias 的 entry 其 base impl 不得为 ecc)。
- **`capabilities.yaml:139-141` stale 注释兑现**:原文承诺的 `runtime/priority.yaml` 仲裁器从不存在,改写为指向真实的 prose 级机制。
- **修 `setup-helpers.ts:244-245`**(两路 review 共同判定最重):MCP 串行化分区改读 `effectiveInstallMethod`,与 `installGroupOf` 同源;补 codex-override 串行化测试(原测试只断言分桶,把不一致固化了)。
- **修 `doctor.ts:20`**:`Promise.all` → `allSettled`,崩掉的 check 降级成 warn 行,其余 19 个照常报告(`readClaudeConfig` 对 EACCES/EISDIR 显式 re-throw 是有意设计,doctor 侧必须兜住)。
- TODOS 新增「Gate semantics」节:ADR-0038 第三类 fail-soft 缺口(引入数组 fact 前必须先收口)+ B 方案回补触发条件。

### 待办

- [ ] 用户 15-min rust/go 手测 → 决定是否回补 B 机器层
