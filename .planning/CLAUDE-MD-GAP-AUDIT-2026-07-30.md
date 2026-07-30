# CLAUDE.md ↔ harnessed 差距审计(2026-07-30,对 4.32.23)

> 方法:四路并行只读审计,逐条对齐用户全局 `~/.claude/CLAUDE.md` 及其 `rules/*.md`,每条结论带 `file:line`。
> 组别:A 治理关卡 · B 澄清判据与并行机制 · C 文档纪律与 TDD · D rules 路由与输出规范。
> 本文件是 digest + 指针,不是审计全文;结论按「系统性断裂 → 具体 bug → 未实现条目 → 文档失真」分层。

## 一句话结论

**条目覆盖面很全,缺的是接线。** gstack 53 skill 已接 47(未接 6 个均为 ADR 明示的故意排除)、四阶段 + 28 workflow + 117 capability + 12 judgment + 7 discipline 都在,但五类系统性断裂让相当一部分「已机器化」的规则在真实执行路径上执行次数为 0。

---

## 一、五类系统性断裂(同一失败模式的不同面)

失败模式与项目 memory 记录的复发规律一致:**capability built-but-unwired** —— yaml SoT 写得完整,runtime 消费点缺失或不可达。

### S1 discipline 强制层整体是死代码

`runBeforeCommitHook` / `runAfterOutputHook` 唯一调用点在 `src/workflow/run.ts:562`(`r.target === 'chat'`)与 `:580`(`r.triggers_commit === true`),两个字段**全仓从无赋值**(`run.ts:59-60` 仅测试注入接口);即便触发,`:583` 硬编码 `changedFiles: []` 使 STATE.md 与 biome 两分支双双短路;而 `harnessed run` 本身被所有 SKILL 明令禁用(`workflows/auto/SKILL.md:119-120`)。

后果:doc-discipline 唯一的 halt 规则(STATE <100 行)、operational 的 `biome-preempt` / `no-push-without-approval` / `no-skip-hooks`、output-style 全部校验,在 v4 编排路径里**从未执行**。单测覆盖充分(`tests/discipline/enforcement/before-commit.test.ts:109-183`),纯粹未接线。

### S2 gate 判据在运行时无辨别力

三层澄清判据分三个独立 yaml(`strategic-gate.yaml:13/22` · `phase-gate.yaml:14` · `subtask-gate.yaml:14`),但:

- 默认 context 把判据全开:`src/cli/lib/gateContext.ts:44-79` 设 `open_decisions:2 / scope_days:2 / approaches:2 / core_algorithm:true / error_cost:'high' / is_critical_module:true / is_complex_architecture:true`,且 `workflows/` 下**零处传 `--context`** → 等价「永远 fire」。
- `skips_when` 是死配置:`judgmentResolver.ts:91-96` 支持 `.skips`,但全仓无任何 `judgments.*.*.skips` 引用,`delegates_to[].gate` 一律 `.fires` → 所有 ❌ 跳过条件从不求值。
- 双 SoT:同一表达式在 `stage-routing.yaml:18/25/31` 逐字重复,而 master 实际走 stage-routing 那份(`workflows/discuss/auto/workflow.yaml:32-39`),改判据要改两处。
- 唯独最硬的 🔒 默认关:`gateContext.ts:59` `phase.type='general'` 不在 `['new_project','new_milestone','new_feature']` 里 → `/office-hours` + `/plan-ceo-review` 默认 skip;且 `'general'` 不在 `PhaseType` 枚举(`src/workflow/schema/phaseFactContext.ts:15-22`,`additionalProperties:false`),是 out-of-schema 默认值。

### S3 🔒 强制与 ⭐ 可选在机器层没有语义差别

CLAUDE.md 分了三档(🔒 强制 / ⚠️ 建议 / ⭐ 可选),引擎里全是同一种 conditional fires_when:

- `--skip-sub` 在 gate eval 之前直接短路,无 allowlist 保护(`src/cli/gates.ts:177-185`)。
- 唯一 halt 通道 `governance.json` veto(`src/workflow/governance.ts:43-45`)设计为「gstack 写 / harnessed 读」,**仓内无任何写入方** → 死通道。
- 无 `scripts/check-*.mjs` 断言治理关卡跑过。

最小修法方向:judgment trigger 加 `enforcement: mandatory`,`gates.ts` 拒绝 `--skip-sub` 掉它。

### S4 三个 web routing judgment 是运行时孤儿

`web-search-routing.yaml` / `web-testing-routing.yaml` / `web-design-routing.yaml` 共 12 个 trigger,**零 workflow 引用、零测试引用**。`resolveJudgmentGate` 是纯 ref 驱动(`judgmentResolver.ts:42-63`),没有 `gate:` / `on:` 引用就永不加载。ADR-0032:81 描述过这步接线,从未落地。

连带:`chrome-devtools-mcp` 不在任何 `tools_available`(`verify/qa/workflow.yaml:21` 只有 gstack-qa/playwright-cli/playwright-test/webapp-testing)→「非功能性诊断必用 chrome-devtools-mcp」对模型完全不可见。

**没有任何机制能发现这类孤儿** —— `tests/workflow/workflow-gate-refs.test.ts` 只校验 ref 形状,不校验 trigger 被引用过。建议加 CI gate 枚举未被触达的 trigger。

### S5 prompt 注入层丢弃 yaml 元数据

`buildDisciplinesSection`(`src/cli/prompt.ts:132-138`)**只渲染 `description`,丢掉 `trigger` 与 `enforcement`**,再冠以 `:144` 的表头 "Disciplines (always-on — L0 substrate) / Follow these ... while doing the work"。

后果(本次审计里唯一会**主动产生错误产物**的缺口):output-style 的「禁 em-dash / 禁结尾总结 / 禁 emoji / 段段 BLUF」本应仅约束 chat response(`output-style.yaml:31/38/52/60` 带 `trigger: response.target == 'chat'`),但 subagent 收到的是无条件版本 → 会套到它写的 README / CHANGELOG / SUMMARY.md 上。CLAUDE.md 的「范围声明」那节因此在注入层完全丢失。另 `:15/:23/:46` 三条本身就写成 `always-on`(其中 no-sycophantic 还是 `auto-fix`)。

同源问题:`language` discipline 被 `prompt.ts:125` 显式排除,真正到达 subagent 的是 `:156` 一句硬编码,对照 CLAUDE.md 的 8 类保留清单**缺第 3 类**(工具/框架/产品/公司名)、**第 7 类**(业内缩写 TDD/CRUD/MCP)、**第 8 类**(引用 verbatim);8 类本身只是 `language.yaml:30-38` 的注释,不是可解析 data。

---

## 二、已确认的具体 bug(主 session 亲验)

1. **`/task --skip-sub discuss` 命不中任何 clause**。`workflows/task/auto/SKILL.md:75` 传 `discuss`,`task` 的 sub 名是 `clarify`(`workflows/task/auto/workflow.yaml:42`),`SKIP_SYNONYMS` 只有 `clarify → discuss` 单向(`src/workflow/skipSubs.ts:20`),`matchSkipSub` 三路匹配全 false(`skipSubs.ts:22-30`)→ `task-clarify` 照样 fire(默认 context 下 gate 恒真)。**症状 = 主 session 澄清完仍 spawn brainstorming subagent,正是 CLAUDE.md 铁律明令禁止的退化**。4.32.20 改名只修了 `/auto`,漏了 `/task`,而 `/task` 是 Execute 阶段主入口。
2. **优先级仲裁是 no-op**。`src/workflow/run.ts:475` 的 `tier: c.tool` 填工具名而非 tier 名 → `before-spawn.ts:25` 的 `hierarchy.indexOf(tier)` 全部 -1 → 排序退化恒等;且返回值未赋值使用,结果直接丢弃。`priority.yaml` 的 7 tier 对实际 spawn 顺序零影响。附带:`priority.yaml:11-18` 与 CLAUDE.md 有 2 处偏差(多插 `mattpocock` tier;把 ralph-loop 折进最低 tier,丢掉「正交 wrapper」语义,与 `parallelism-gate.yaml:38-48` 的 `wraps:` 自相矛盾)。
3. **`/ship` 与 `/investigate` 是死登记项**。`/ship` 只出现在 `ship/auto/workflow.yaml:31` 的 tools_available(无 phase、无 trigger);`/investigate`(`capabilities.yaml:173-186` + 别名 `:1095-1106`)零 workflow 引用,bug 分支被 `task/code/workflow.yaml:42-43` 路由给 mattpocock `/diagnosing-bugs`。两者都是 CLAUDE.md 里的高频入口。
4. **`browse` capability 不可路由**。`fires_when: subtask.needs_browser_automation` 引用的 fact 既不在 `SubtaskShape`(`phaseFactContext.ts:87-110`,`additionalProperties:false`)也不在 gateContext 默认里 → 真求值会撞 undefined-variable,按 ADR-0038 fail-closed 永不 fire。而 `web-testing-routing.yaml:26-33` 把探查显式路由到 `playwright-cli`,与项目 CLAUDE.md「网页浏览统一走 `/browse`」正面冲突。
5. **`scripts/check-adr-conservation.sh` 不存在**,`operational.yaml:31` 指向它。
6. **`subtask.needs_google_workspace` 在 schema 有、gateContext 缺** —— 一旦被 gate 引用即 issue #5 同款 fail-soft 地雷。
7. **Agent Teams 指令面全线指向已删除的上游 API**。`capabilities.yaml:584/610`(`cmd: TeamCreate` / `TeamDelete`)、34 个 SKILL 的 step 4、`role-prompts.yaml:371/521/526/531`、`src/workflow/run.ts:117/121`、`verify/multispec/workflow.yaml:40/59`、`docs/WORKFLOW.md:89/104/276`。CC v2.1.178+ 已删除这两个工具(直接 spawn 即成团、session 退出自动清理、`team_name` 被忽略)。`workflows/auto/SKILL.md:126` 还把 `TeamDelete` 定为 MUST-in-finally → 该分支一旦命中即不可执行。目前被低触发率掩盖(`is_critical_release` 默认 false)。

---

## 三、完全未实现的条目

| CLAUDE.md 要求 | 状态 | 备注 |
|---|---|---|
| 铁律「主 session 不直接写实现代码」 | 未实现 | 只机器化了**例外**(`parallelism-gate.yaml:19-23` `subtask.lines < 20`),禁令本身零表达 |
| Task/Agent 直调 vs `subagent-driven-development` 判据 | **语义反向** | `parallelism-gate.yaml:15-17` 把「≤3 并行」绑到 skill 上;CLAUDE.md 是「≤3 直调,>3 或需持久化产出物才用 skill」。`>3` 分支与「持久化产出物」判据均缺 |
| Agent Teams 第 6 触发「多维度审查 ≥3 specialist 互相质询」 | 未实现 | 被换成代理指标 `is_critical_release`(`stage-routing.yaml:97`),且不在 parallelism-gate 里 |
| ralph-loop 套在 **team** 外层 | 未实现 | `wraps:` 字段只被 schema 校验无消费者;`auto/SKILL.md:125-127` 的 teams 分支无 ralph/`/goal` 包裹 |
| TDD **跳过声明协议** | 未实现 | `workflows/task/test/workflow.yaml` 无 `artifacts_expected` → `evidence.ts:74` `none_declared` → `checkpoint complete task-test` 无拦点。skip reason 落 `current-workflow.json`(`ledger.ts:74`)而非 `findings.md` |
| 反腐铁律 b/c/d/f/g | 占位 | `check_method: heuristic`,`src/` 零实现;唯一真 gate `check-state-archive-stale.mjs` 硬编码 `.planning/STATE.md` 且 `scripts/` 不在 npm `files`(`package.json:45-58`)→ **用户装了 harnessed 得不到任何文档纪律 gate** |
| 责任矩阵 7 个 home | 部分 | `doc-discipline.yaml:45-49` description 只写 2 个 + "etc.",5 个被吞;层级 info |
| sketch-then-refine | 未实现 | `workflows/` 与 `src/` 零命中 |
| BDD Given/When/Then 形态 | 未实现 | 全仓零命中;discuss 产出是 `- R1:` checklist 形态 |
| 「每次响应开头声明用到的工具」 | 未实现 | `workflows/` 零命中 |
| 禁 `mcp__claude-in-chrome__*` | 未实现 | 全仓零表达;discipline 有 halt 机制但没有 tool deny-list 概念 |
| CLI-TOOLS.md 强制替换规则(fd/rg/bat/eza/jq/fnm/tldr) | 未实现 | `workflows/` 零表达 |
| context7 三步流程(resolve-library-id → query-docs) | 未实现 | 全仓零命中,只有 capability entry |
| google-workspace SOP(`--params` 形态 / 写操作先 `--dry-run` / 禁止行为) | 未实现 | 只有 `capabilities.yaml:1190-1197` 一条孤儿 entry |
| `gstack_prefix` 插值 | 建成后孤儿化 | `{{ gstack_prefix }}` 在 `workflows/` 零命中;doctor 探到前缀写进 config 后无下游读取 → prefix 模式下全部 gstack cmd 失效 |
| compaction 前 flush progress | 未实现 | `injectCache.ts:13` 明确写 "PreCompact hook we do not install" |
| 哨兵第 3 触发点「实质性代码修改前自检」 | 未实现 | `checkPlanningSync` 只在 `complete` 时跑,Edit/Write 前无拦点 |
| output-style 20 条中的 10 条 | 未实现 | 缺:响应尺度匹配 / 不复读问题 / 区分已验证-假设-不知道 / 不引用过时记忆 / 直接表达不同意 / 禁空洞修饰词 / 禁 hedging / 引用不改写 / 一次一个澄清 / 承认错不长段道歉 |
| 判据细项 | 未实现 | Phase 层「scope > 5 文件」`files_touched` 零命中;「灰色地带」无 `gray_area*` 变量;子任务「无现成 pattern 可抄」无对应项 |

---

## 四、文档失真(doc 与 code 矛盾,违反自家铁律 f)

1. 项目 `CLAUDE.md:74` 称 `docs/WORKFLOW.md` 含「4-stage mermaid + harnessed v0.4 gap 分析」—— **该文档没有任何 gap 分析节**,这句 cross-reference 本身是错的。
2. `docs/WORKFLOW.md` 计数全线失效:`:350` 称 102 capabilities(实 117)、`:282` 称 20 workflow(实 28,且 `:5` 自己写 28 与正文矛盾)、`:210` 称 6 disciplines(实 7,`:228` 表格自己写 7)、`:439` 同病;`:502-504` References 只列到 ADR-0032(实 38 个 ADR,缺的 0033/0036/0038 恰是本次审计依赖的核心机制);`:297` 仍写 mattpocock `/zoom-out`(上游已移除);`:214-218` 称 4 hook enforce(其中 2 个生产路径不可达);`:477-481` 是 `harnessed@3.0` 升级指引。
3. `.planning/REQUIREMENTS.md:27` 声称已交付 "ROADMAP inline-warn(Phase 11)" —— 实现不存在。
4. `manifests/skill-packs/gstack.yaml` 声明 48 skill 含 `sync-gbrain`(已装未接),但不含 `/diagram`(已接未列)。
5. `rules/web-design.md` 的 XOR 仲裁语义已在 4.11.0 被**有意**改为两段式叠加(`web-design-routing.yaml:3` + v12.0 patch SUMMARY),`requires_creative_polish` 现为标注的 orphan(`phaseFactContext.ts:78`)—— 属上游演进,但用户 rule 文件与仓内已语义分叉,应择一对齐。

---

## 五、已实现得好的部分(校准用,勿重复投入)

- **gstack 覆盖 47/53**;未接 6 个(iOS 5 + `sync-gbrain`)均为 ADR/CHANGELOG 明示的故意排除。清单外还多接了 `/diagram`。
- **session-survival 最强**:会话作用域 composite-key store + ledger 前置播种 + per-turn inject(`injectState.ts:278` 单一装配路径,含 STALE / NEXT-UNIT / BREAK-LOOP / SHIP-READY / VERIFY-MODE 断点)+ 1500 token 预算的 relevance-filtered project-context + `status --recover` catchup + ledger 自动压缩(G6 不变式 `fail_count>0` 永不驱逐)。
- **「状态从产物派生」是 7 铁律里唯一真硬门**:`planningScan.ts:73` `complete = plans>0 && summaries>=plans` + `checkpoint.ts:331-339` 证据门 fail-closed + `task/deliver/workflow.yaml:79-86` 强制 `verification-evidence.md`。
- **relay 协议完整**:`prompt.ts:159-169` 的 `STATUS: NEEDS_CLARIFICATION` 注入 + 34 个 SKILL 一致(生成器 `scripts/rewrite-skill-invoke-sections.mjs:112`)。
- **cc-handoff 到 schema 级**:`protocols.yaml:14-70` 两场景 required_fields + forbidden_phrases + 写入边界表 + `no-modify-upstream-artifact` halt。
- **工具调用损坏缓解比 CLAUDE.md 更进一步**:做成 Stop hook 自动恢复(`bin/harnessed-stop-hook.mjs` + `manifests/optional/stop-hook-recover.yaml`),不靠提醒模型重发。
- **哨兵前两个触发点是真硬门**:`enforceSerialOrder`(`checkpoint.ts:312-317`)+ `checkPlanningSync`/`checkArtifacts` 合并 BLOCKED exit 1(`:325-339`)。

---

## 六、按「修复成本 / 影响」排序的建议起点

**第一梯队(小改动、消除错误产物或恢复铁律)**
1. `prompt.ts:132-138` 渲染 discipline 时保留 scope,把 chat-only 规则归到独立子块(S5)—— 当前每个 subagent 都在把对话风格约束套到项目文件上。
2. `/task --skip-sub discuss` 同义词双向映射(bug 1)—— 每个子任务都走一次。
3. `task/test/workflow.yaml` 补 `artifacts_expected`(如 `tdd-evidence.md`),复用现成 fail-closed 门 → TDD 跳过声明协议一次到位。
4. `run.ts:475` 传真 tier 名并使用返回值(bug 2)。
5. 8 类保留清单提成 `language.yaml` 结构化 `preserve_categories:`,`buildLanguageSection` 从 yaml 读(S5 同源)。

**第二梯队(需要设计裁决)**
6. `enforcement: mandatory` 字段 + `gates.ts` 拒绝 skip 掉它;`phase.type` 默认值改成 schema 内的值(S2/S3)。
7. fact-extraction 前置步骤:SKILL step 1 的 locked spec 带结构化 facts → `--context`;`delegates_to` 支持 `.skips` 否决语义(S2)。
8. 三个 web routing judgment 接线 + CI gate 检测孤儿 trigger(S4)。
9. Agent Teams capability 重定义为新 API + `cc_version` 分段(bug 7)。
10. discipline enforcement hook 接进真实路径,或明确判定「v4 编排下这层由 SKILL prose 承担」并删掉死代码(S1 —— 这是个方向裁决,不是纯实现)。

**第三梯队(文档对账)**
11. `docs/WORKFLOW.md` 计数/引用刷新 + 删掉项目 CLAUDE.md:74 的错误 cross-reference + 修 `.planning/REQUIREMENTS.md:27` 的失真声明 + gstack manifest 与 capabilities 对账。
