# Phase 52 — CLAUDE.md 差距收口

> 上游审计:`.planning/CLAUDE-MD-GAP-AUDIT-2026-07-30.md`(五类系统性断裂 S1-S5 + 7 个确认 bug + 18 项未实现 + 5 处文档失真,每条带 `file:line`)
> 状态:第一梯队 in flight(4 路 subagent)· 第二梯队方向已裁决待实施

## 框架约束(2026-07-30 用户提醒,凌驾于下方所有裁决)

**普通用户没有类似的 `~/.claude/CLAUDE.md`。** 本审计以用户全局 CLAUDE.md 为对照基准,但 harnessed 的交付对象是**没有这份文件的人** —— 方法论必须活在 harnessed 自己的 bundled 资产里(workflows / disciplines / judgments / SKILL / CLI),不能假设用户侧有 prose 承接。

由此重排两件事:

1. **「已交给 prose 承担」不等于已交付。** 对我(有 CLAUDE.md)成立的规则,对普通用户等于零。凡结论是「靠 SKILL prose / 靠用户自觉」的条目,对普通用户都要重新问一遍:装了 harnessed 的人看得到吗?这直接抬高了 S5(prompt 注入是普通用户**唯一**的规则送达通道)与 D1「检查逻辑进 CLI 而非 `scripts/`」的权重。
2. **区分「方法论」与「我的环境偏好」**,后者不该 bundle 进 harnessed 强推给所有人:
   - 属方法论(harnessed 该做):三层澄清判据 · 治理关卡强制语义 · 并行/teams 路由 · TDD 判据与跳过声明门 · 文档纪律 · output-style/language 注入 · 主 session 不写实现代码 · sketch-then-refine · BDD 验收形态 · ralph-loop wrapper · web search/testing/design 路由 · context7 三步流程 · Agent Teams API 时效
   - 属环境偏好(**改判为 out-of-scope**,不再算「未实现」):`CLI-TOOLS.md` 的 fd/rg/bat/eza/jq/fnm/tldr 强制替换(用户机器上可能根本没装这些)· RTK · `google-workspace` 的 `gws` SOP(capability 登记足够,SOP 属用户 rules)
   - **需重裁**:`mcp__claude-in-chrome__*` 的禁令(见 D3 修正)

## 用户裁决(2026-07-30)

- **D1 强制层 = 混合**。确定性规则(STATE <100 行 / commit 前 biome / 未批准不 push)做成 opt-in CC hook + `harnessed check-docs` 子命令 —— 检查逻辑必须**进 CLI 而非留在 `scripts/`**,因为 `scripts/` 不在 npm `files` 白名单(`package.json:45-58`),留在那里只守 harnessed 自己的仓,用户装了拿不到。`after-output` 整批死代码删除(无对应 CC hook 点,且风格审查本质是判断题;第一梯队的 S5 修复已把它放到正确位置)。`before-spawn` 保留(第一梯队修 tier bug)。
- **D2 facts = 混合来源**。能确定性推导的由 harnessed 推(`files_touched` 等);判断题(`open_decisions` / `approaches` / `error_cost` / `phase.type`)由 SKILL step 1 的 locked spec 带结构化 JSON 块输出,step 2 用 `--context-file` 传(避 Windows 引号坑)。同时给 `delegates_to` 加 `.skips` 支持,让 ❌ 条件活起来。
- **D3 浏览器 = `/browse` 主导**,`playwright-cli` 降为备选。要做:`needs_browser_automation` 补进 `SubtaskShape`(`src/workflow/schema/phaseFactContext.ts:87-110`,`additionalProperties:false`)+ `gateContext`;`web-testing-routing.yaml:26-33` 的探查分支改指 `/browse`;补 `mcp__claude-in-chrome__*` 的 deny 表达。

## 第一梯队(in flight,4 路并行,文件互不重叠)

| # | 内容 | 可改文件 |
|---|---|---|
| 1 | S5 discipline scope 剥离修复 + language 8 类提成结构化 yaml | `src/cli/prompt.ts` · `workflows/disciplines/language.yaml` · 对应测试 |
| 2 | `/task --skip-sub discuss` 同义词双向 | `src/workflow/skipSubs.ts` + 测试 |
| 3 | TDD 跳过声明门(`task/test` 补 `artifacts_expected`,复用现成 fail-closed 门,零 `src/` 改动) | `workflows/task/test/workflow.yaml` · role-prompts 的 task-test 条 · 测试 |
| 4 | 优先级仲裁 no-op(tier 填真名 + 消费返回值)+ `priority.yaml` 与 CLAUDE.md 6 tier 对齐 | `src/workflow/run.ts` · `src/discipline/enforcement/before-spawn.ts` · `workflows/disciplines/priority.yaml` · 测试 |

全部 TDD 红先行 + 灰区回流(`STATUS: NEEDS_CLARIFICATION`)+ 不 commit(主 session 亲验后统一提交)。

已知待裁决点(subagent 可能回流):#1 的 `output-style.yaml` 三条错标 `always-on` 的规则是否一并改(BLUF / no-sycophantic / precise-quantifier);#4 的 `mattpocock` tier 删不删(删了那批 capability 可能无处归 tier)。

## 第二梯队(按依赖排序,待实施)

- **T2.1 facts 生产链(D2)** —— 前置于 T2.2。harnessed 侧推导器 + SKILL step 1 结构化 facts 块 + `--context-file` + `delegates_to` 的 `.skips` 语义。
- **T2.2 `enforcement: mandatory`(D1 的 gate 侧)** —— judgment trigger 加字段;`gates.ts` 拒绝 `--skip-sub` 掉 mandatory 项(逃生口需记 ledger reason);修 `phase.type` 默认值(`'general'` 是 out-of-schema,`src/cli/lib/gateContext.ts:59`)。**依赖 T2.1** —— 判据无辨别力时加 mandatory 只会把恒真门标成不可跳过,更糟。
- **T2.3 web routing 接线 + 孤儿 trigger CI gate(D3)** —— 三份 routing judgment 共 12 trigger 目前零引用;新 gate 枚举从未被 `gate:`/`parallelism:`/`tools_available` 触达的 trigger 并报错(这类孤儿现在无任何机制能发现)。连带 `chrome-devtools-mcp` 进 `tools_available`。
- **T2.4 Agent Teams 新 API 重定义** —— `agent-teams-create` 改为「直接 spawn teammate 即成团」、`agent-teams-shutdown` 改为「按名请求 shutdown,session 退出自动清团」;去掉 `TeamDelete` 的 MUST-in-finally;`cc_version` 分段(`>=2.1.133 <2.1.178` 旧 / `>=2.1.178` 新);34 SKILL × 2 语言走生成器重跑。纯机械,无裁决。
- **T2.6 `masterOrchestrator-helpers.ts:216/218` 的同构仲裁缺陷 —— 先答「该不该接线」再动手**(第一梯队 T4 发现)。那里是**真正的 delegation spawn 点**(`tier: c.sub` 填 sub-workflow 名同样不是 hierarchy 条目 + 返回值同样丢弃,注释自认 "v3.0 sub-as-tier placeholder"),影响面比 `run.ts` 那处大。但 `delegates_to` 已有 `order` + `serial/parallel` 决定次序,所以**先答:tier 仲裁在该点是否还有独立意义?** 若 `order` 已全权决定 → 正解是删 placeholder 调用而非补映射(与 D1 的「删死抽象优于为对称而接线」同一哲学)。
- **T2.5 强制层混合落地(D1 的 hook 侧)** —— `harnessed check-docs` 子命令(STATE 行数 / ROADMAP 内联叙事)+ opt-in manifest 把它接成 CC hook;biome-preempt 与 no-push-without-approval 同法;删 `after-output` 死代码及其单测。

## 安装层 follow-up(T2.5 发现,单独 slice)

**`resolveHookCommand` 的 compiled 分支会静默丢掉尾部 flag。** `harnessed uninstall` 与 doctor 的 stale-hook 自愈靠 `src/installers/lib/hookEntry.ts` 的 `COMPILED_HOOK_IDENTITIES = ['inject-state','stop-hook']` 识别第一方 hook。把 `check-docs` 加进去**会出事**:compiled 分支返回 `"<binary>" <marker>` 形态,`--hook` 会被丢掉 → 该 hook 从「只在 git commit 时检查」变成**对每个 Bash 调用无条件阻断**。这是「看起来接好了、实际变成全局门」的静默故障。修法是教 compiled 分支保留尾部 flag,属安装层单独 slice。当前状态:manifest-scoped uninstall(`src/uninstallers/ccHookAdd.ts` 精确命令匹配)可用,统一 uninstall 不认这个 hook。

## 第三梯队(文档对账 + 小额结构债,低风险可随时插入)

第一梯队实施中新发现的三项:

- **en base 资产里有 597 行中文,分布在 48 个 yaml**(实测:`fd -e yaml . workflows/ | rg -v zh-Hans` 后逐文件数 CJK)。在「普通用户没有 CLAUDE.md」的框架下这不再是内部备注而是交付质量问题。分两类,严重度不同:
  - **会进模型 prompt 的(优先)**:`workflows/role-prompts.yaml` 有 4 行中文,且**全在 body/description 而非 `#` 注释**(`:83` "karpathy 4 心法 + mattpocock conditional招式"、`:311`、`:334`)。role prompt 是 subagent 的主体 prompt(`buildAgentDef`),所以英文用户的 subagent 会收到夹带中文的角色定义。v10.0 i18n milestone 修的是 discipline 的 en-default bug,role-prompts 这几处漏网。
  - **只影响读资产的人(次要)**:其余约 500 行是 `#` 注释,`capabilities.yaml` 独占 159 行(其中 81 行在 `description:` 字段 —— 但已核实 capability 的 `description` **不被任何 TS 代码读取**,纯人读文档,不进 prompt)。英文维护者/用户打开 bundled yaml 看到成片中文。
  - 建议拆两个 slice:先修 role-prompts 的 4 行(小、且真进 prompt);注释英化单独一 slice,zh-Hans sibling 保中文。

原有两项:

- **8 类保留清单目前寄居在 `rules[].description` 的编号行里**。discipline schema 是 `additionalProperties: false`(`src/workflow/schema/discipline.ts:60-70` + `scripts/check-workflow-schema.mjs:221-232` 双份镜像),新增顶层 `preserve_categories:` 会同时打红 CI schema gate。要做成真正的结构化字段需改 schema + CI 镜像 + 重生成 `schemas/`(typebox 铁律:`pnpm build && pnpm build:schema` 并提交)—— 单独一个 slice,不与第一梯队混。
- **`workflows/task/test/SKILL.md` 的 phase 表格没有 `artifacts_expected` 列内容**,而 sibling(`task/code/SKILL.md:32` · `task/deliver/SKILL.md:34`)都标了。三个 gate 脚本都不校验 SKILL.md ↔ workflow.yaml 一致性(skill-i18n-parity 只比 en↔zh),所以 CI 不红。顺带值得考虑:**给这层一致性加 gate**,否则这类落差会持续产生。

原有条目:

`docs/WORKFLOW.md` 计数与引用刷新(102→117 capability / 6→7 discipline / 20→28 workflow / ADR 引用止于 0032 实际 38 个)· 删项目 `CLAUDE.md:74` 那句指向不存在章节的 cross-reference · 修 `.planning/REQUIREMENTS.md:27` 的失真声明("ROADMAP inline-warn" 未实现)· `manifests/skill-packs/gstack.yaml` 与 capabilities 对账(`sync-gbrain` 已装未接 / `/diagram` 已接未列)· `rules/web-design.md` 的 XOR 语义与仓内两段式叠加择一对齐。
