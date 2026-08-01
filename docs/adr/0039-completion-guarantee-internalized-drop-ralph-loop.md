# ADR 0039 — 完成保证内置化落地,摘除上游 `/ralph-loop` 依赖(指令面收敛为单一自有闸门)

- **Status**: Accepted
- **Date**: 2026-08-01
- **Supersedes**: **ADR-0036**(completion gate 交互面三级偏好链 plugin → native `/goal` → self-loop)。
  ADR-0036 的 main body 不改;其 Status 已标 superseded 并指回本 ADR。
- **Amends**: ADR-0011 D-10 与 ADR-0028 的**交互 cmd 面**表述(「上游 ralph-loop plugin」→
  「harnessed 自有 `checkpoint` 完成闸门」)。SDK 路径(`src/workflow/lib/ralphLoop.ts`
  `ralphLoopWrap` 硬上界 + `isComplete` 4 层双信号)是 harnessed 自有代码,**零改动**。
- **Relates to**: ADR-0033(state machine ledger + fail-closed evidence guard)、
  `.planning/phases/52-claude-md-gap-close/T2.7-SPEC-loop-internalization.md`(OQ1/OQ2/OQ3 裁决)
- **Milestone**: (patch 4.36.0,无活动 milestone)

## Context

ADR-0036 建立三级偏好链的唯一理由是**上游 plugin 的可用性**:`ralph-loop` 是 base 组件集中
唯一没有 codex 安装路径的组件(`claude-plugins-official` 专属),manifest 自述
"Windows requires jq + Git Bash",其 headless 安装机制从 v0.1 起一直是未决项。链条的
tier 2 / tier 3 存在,是为了回答「plugin 装不上怎么办」。

两件事让这个问题消失:

1. **T2.7 第一步(4.35.0 已交付并验证)把完成保证搬上了 harnessed 自己的 live path。**
   在此之前,`isComplete` / `promiseExtract` / `ralph_max_iterations` 齐全但唯一消费者是
   `harnessed run`(每份 SKILL 都明令禁用的 CI/headless 路径)—— 典型的 built-but-unwired。
   4.35.0 把承诺校验接进 `checkpoint complete`,把迭代预算接进 ledger,并新增无进展熔断。
2. **ADR-0036 的 tier 2 从未被实证。** `/goal` 的可用性与行为在仓内只有 ADR-0036 的自述
   背书,按项目铁律(上游断言必须实拉验证)它不具备承载保证的资格;而它自述的
   single-slot-per-session 语义对多层编排本身就是硬约束。

三级链因此变成:一个不再需要的 fallback(tier 2)去兜底一个不再需要的主路径(tier 1),
而真正在跑的东西(tier 0 = harnessed 自己)反而没被写进指令。

## Decision

1. **指令面收敛为单一闸门。** 所有生成的指令面 —— `src/cli/lib/generateCommands.ts`
   (`~/.claude/commands/<name>.md`)与其 sister `scripts/rewrite-skill-invoke-sections.mjs`
   (`workflows/**/SKILL{,.zh-Hans}.md` 的 invoke 段)—— 删除 `/ralph-loop` 调用与 `/goal`
   fallback,替换为:

   ```
   Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`,
   then drive delivery with harnessed's own completion gate:
     - on return, write the subagent's final output to a file and run
       `harnessed checkpoint complete <sub> --result-file <path>` — it is fail-closed on
       the declared artifacts, the TDD boundary, and the verbatim <promise>COMPLETE</promise>.
     - if it blocks, run `harnessed checkpoint fail <sub> --failing-tests <n>` to record
       the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop
       condition is reached.
     - respawn ONLY while none of those three has fired. Any one of them means stop:
       re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past
       a stop directive.
   ```

   两个 sister surface 必须逐字一致(已有 lockstep 测试
   `tests/unit/generate-commands.test.ts` "in lockstep with the SKILL sister")。

2. **`/goal` tier 一并删除,不保留第三档。** 它存在的唯一理由是「plugin 可能没装」;自有闸门
   没有「装没装」的问题。且它从未被实拉验证过(仅 ADR-0036 自述),留着等于把保证挂在一个
   未经证实的上游行为上。

3. **停机语义的对应关系写进文档,不让读者自己推。** 上游那两个 flag 的职责由三条停机理由
   承接,且比原来更强:

   | 原 `/ralph-loop` | 现在 |
   |---|---|
   | `--completion-promise "COMPLETE"`(逐字匹配) | `checkpoint complete --result-file` 的三重 fail-closed:声明产物存在 **AND** TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)**AND** verbatim `<promise>COMPLETE</promise>` 或结构化 COMPLETE 状态 |
   | `--max-iterations <N>`(硬上界) | `BUDGET-EXHAUSTED`(ledger 记的 attempt 数 vs `workflows/defaults.yaml ralph_max_iterations`) |
   | (无对应物) | `NO-PROGRESS`(连续 N 轮无改善:优先失败测试数,省略 `--failing-tests` 时退回证据产物摘要)—— 阻尼,上游没有 |
   | (无对应物) | `BREAK-LOOP`(同一 sub 失败次数达阈值) |

   `--force` 记录 `evidence_status=overridden` 的**可审计覆盖**,不是静默放行。
   `--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。

4. **命名去上游化。** capability `ralph-loop` → `completion-gate`(`impl: harnessed-bundled`,
   `cmd: harnessed checkpoint complete`);parallelism-gate trigger `ralph-loop-wrapper` →
   `completion-gate-wrapper`;`manifests/tools/ralph-loop.yaml` 删除。

5. **不改的东西(明确列出,防止连带误删)**:
   - `workflows/defaults.yaml` 的键名 `ralph_max_iterations` 沿用不改名 —— 它是 harnessed
     自己的配置键,改名会波及 schema / 测试 / 已安装用户的 state,收益为零。
   - `src/workflow/lib/ralphLoop.ts`(含文件名)不动 —— 自有代码,`sdk_ref` 仍指向它。
   - R20.10 `max_iterations_exceeded → emit_warning_and_halt` 硬契约不动;它在交互面的
     对应物就是 `checkpoint fail` 打印的 `BUDGET-EXHAUSTED`。
   - `skills/karpathy-baseline/SKILL.md` 不动(见 Consequences 的孤儿说明)。

## Consequences

正向:

1. **保证不再依赖任何上游 plugin。** 一台没装任何 plugin 的机器上,子任务完成保证照样生效 ——
   这正是 T2.7 的验收条件。Windows 上的 jq / Git Bash 门槛与那条一直没解决的 headless
   安装路径一并消失。
2. **指令面只剩一条路,不再有三档降级要读者判断。** 三级链本身是认知负担:模型要先判断
   plugin 装没装、再判断 `/goal` 可用不可用,判断错了就静默降级到最弱的一档。
3. **停机理由从 1 个变 3 个。** 上游只有「预算停」;现在多了阻尼(`NO-PROGRESS`)与熔断
   (`BREAK-LOOP`)。ECC `loop-design-check` 的原话是 negative feedback with no damping
   oscillates —— 只有预算停的循环会把迭代烧完才停。
4. **done-criterion 配上了 boundary。** 逐字承诺是**被评者自己输出的字符串**,结构上就是自评;
   现在它只是三个条件之一,另外两个(产物存在 / 测试没被删弱化)是外部事实。

代价与风险:

1. **失去 `--max-iterations` 那种「代码强制」的进程级硬上界。** 现在的预算是 ledger 里的计数
   + 打印停机指令,靠调用方遵从;它不能像 plugin 的 Stop hook 那样物理拦截。缓解:三条停机
   理由由 per-turn injector 每回合从持久化 ledger 重新注入,不依赖操作者读到那一行 stderr;
   且 `checkpoint complete` 本身是 fail-closed 的 —— 越过停机指令重跑也换不来一个假的 done。
2. **`checkpoint complete` 成为单点。** 它现在同时承担产物门、TDD boundary 与承诺校验;
   它挂掉等于三道门一起挂。缓解:三者都在同一个 fail-closed 分支里,失败方向是拦下而非放行。
3. **老指令面存量。** 用户机器上已生成的 `~/.claude/commands/*.md` 仍写着 `/ralph-loop`,
   要 `harnessed setup` 重跑才刷新(marker-based overwrite 会覆盖自生成文件)。属于既有升级
   路径,不新增迁移步骤。
4. **`skills/karpathy-baseline/SKILL.md` 现已孤儿。** 装它的 `manifests/skill-packs/
   karpathy-skills.yaml` 在 4.35.0 (T2.7) 随 karpathy 内化一起删除,活载体是
   `workflows/disciplines/karpathy.yaml`;`tests/integration/phase-2.3-e2e.test.ts` Link 5
   已反转为「守 manifest 保持删除」。该 SKILL 现在没有任何 install / 引用路径,仅
   `docs/benchmarks/v0.4.md` 的历史 routing 记录提到它的名字。**本 ADR 不删它** —— 删除属于
   独立清理决策,应单独裁决,以免和本次摘除混为一谈。

## Verification

- 指令面:`src/cli/lib/generateCommands.ts` 与 `scripts/rewrite-skill-invoke-sections.mjs`
  两个 sister 渲染出的三条 bullet + 「任一触发即停」规则逐字一致;56 份 SKILL 文件重渲染
- `node scripts/check-skill-i18n-parity.mjs` / `check-yaml-i18n-parity.mjs` 绿
- `tests/unit/skill-invoke-parity.test.ts`(engine token 内联)+
  `tests/unit/generate-commands.test.ts`(lockstep + body-type 断言)绿
- 全仓无残留 `/ralph-loop` 调用指令;残留的 `ralph` 字样仅为自有配置键
  `ralph_max_iterations`、自有源文件 `src/workflow/lib/ralphLoop.ts`,以及本 ADR / ADR-0036 /
  历史记录中的指名引用
