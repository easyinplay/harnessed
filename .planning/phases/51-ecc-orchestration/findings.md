# findings — Phase 51 ECC 编排

## F1 上游三调用面实拉(2026-07-29,ECC 2.1.0)

根:`C:\Users\easyi\.claude\plugins\cache\ecc\ecc\2.1.0`。注册键 `"ecc@ecc"`(数组值,含 `installPath`/`version`/`gitCommitSha`),**无 enable 字段** —— enable 在 `~/.claude/settings.json` 的 `enabledPlugins["ecc@ecc"]`。cache 另有 `2.0.0-rc.1` 带 `.orphaned_at` 标记(升级遗留),注册↔cache 无分歧。规模自述 67 agents / 281 skills,实测吻合(commands 94)。

**语言 review 存在三个面,不是两个:**

| 面 | 形态 | 语言级存在性 |
|---|---|---|
| agent | `agents/<lang>-reviewer.md`,frontmatter `name`/`description`/`tools: Read, Grep, Glob, Bash`/`model: sonnet` | **11 种语言**:cpp csharp fsharp go java kotlin php python rust swift typescript(+5 框架:django fastapi flutter react vue;+6 领域:code database healthcare mle network-config security) |
| command | `commands/<lang>-review.md`,薄壳,正文明写 "Invokes the `<lang>-reviewer` agent",frontmatter 仅 `description` | **12 个**但有缺口:cpp fastapi flutter go kotlin python react rust vue code(+epic/orch 非代码)。**无** typescript/java/swift/php/csharp/fsharp/django review 命令 |
| skill | `skills/<name>/SKILL.md` | **语言 review skill 完全不存在**。语言相关 skill 走 `-patterns`/`-testing`(注意 Go 的 skill 面前缀是 `golang-`,agent 面是 `go-`) |

**结论(OQ1 输入)**:design doc 里「skill 面 `ecc:<lang>-review` vs agent 面 `ecc:<lang>-reviewer`」的二分是错的 —— `ecc:<lang>-review` 是 **command** 面。真实二选一 = command(薄壳,覆盖 12,有缺口)vs agent(实体,覆盖 11 语言 + 10 框架/领域,命名规整)。

## F2 seeds 命名漂移(真 bug,本 phase 顺手修)

- `code-review` aliases `ecc:python-review` / `ecc:rust-review` / `ecc:go-review`(capabilities.yaml L143-145)——**与 command 面精确匹配**,现名有效。
- `gsd-debug` aliases `ecc:rust-build` / `ecc:go-build` / `ecc:build-fix`(L342-344)——**上游无此三名**。真名:`rust-build-resolver`、`go-build-resolver`、通用兜底 `build-error-resolver`(非 `build-fix`)。且 **无 `python-build-resolver`**(Python 侧由 `django-build-resolver` + `pytorch-build-resolver` 分担)。

build-resolver 实存 10 个:cpp dart django go java kotlin pytorch react rust swift;相邻异名 2 个:`build-error-resolver`(通用/TS)、`harmonyos-app-resolver`。

## F4 capability 级 `fires_when` 从不被求值(推翻设计前提)

- 两套 `fires_when` 形状不同:capabilities 的是 `Array<string>`(`src/workflow/schema/capabilities.ts:70`),judgments 的是单 `string`(`src/workflow/schema/judgment.ts:39`)。**只有后者进 `resolveJudgmentGate` → `evalGate`**(`src/workflow/judgmentResolver.ts:42-104`)。
- 全仓无任何 TS 读取 capability 级 `fires_when`;唯一动态消费是 `tests/workflow/ecc-wiring.test.ts:60-70` 的正交轴断言。
- 因此 `capabilities.yaml:226` playwright-test 的 `subtask.language == 'typescript'`(及 `:237` webapp-testing 的 python)是**文档性表达式,从未被 expr-eval 看到**。真正在跑的语言维度被折叠进 `workflows/judgments/web-testing-routing.yaml` 的 `subtask.test_type` 四值枚举。
- 连带:`subtask.language` 无生产者,且 `SubtaskShape`(`src/workflow/schema/phaseFactContext.ts:87-110`)`additionalProperties: false` 不含该键。

**影响**:design doc 假定的「aliases 加 `language:` 标注 + fires_when 路由」机制,在 fires_when 侧是死路。语言选择必须发生在别处(见 F5)。

## F5 真实注入链:`harnessed prompt` → `buildToolsSection`(资源级消费点)

- capability 的 `cmd` 进入 subagent prompt 的**唯一运行时路径**:`src/cli/prompt.ts:195` → `buildToolsSection`(`:66`)→ 读 `workflows/capabilities.yaml`(`:72`)→ `caps[tool]?.cmd` / `?.impl`(`:79-81`)→ 输出 `## Tools — invoke these (not optional)` 节(`:84`)。**每次 exec 重读,天然新鲜求值**(OV#1 要求的「非 setup 烘焙」已由架构满足)。
- OV#1/D12 写的「generateCommands 链路」是错的:`generateCommandFile` 的 `_capabilities` / `_installedPlugins` / `_installedUserSkills` 三参数**自 v4.0 起全部废弃前缀 `_`**,不再渲染 `{{ capabilities }}` 占位符(`src/cli/lib/generateCommands.ts:261-294`)。commands/*.md 是 setup 时烘焙的薄壳,运行时 shell-out 调 `harnessed prompt` / `harnessed gates` 拿 stdout。
- 另一条 setup 时烘焙路径:`renderSkillBody`(`src/cli/lib/capabilityResolver.ts:230`)替换 SKILL.md 里 `{{ capabilities.<x>.cmd }}`,`resolveCapabilityCmd`(`:149-209`)只做 presence-check,注释明写 "Resolver never mutates the cmd"(`:65-66`)。**语言路由不能落这条**(装 ECC 后不重跑 setup 就点不亮)。
- `harnessed gates`(`src/cli/gates.ts:87-260`)只输出 JSON plan(fire/skip 的 sub 列表),不 spawn、不碰 capability cmd。

**影响**:resolver 接入点 = `prompt.ts:79-81` 附近(把 `caps[tool].cmd` 换成语言匹配的 alias cmd)。这同时给出 OQ2 答案:一个 tool 只出一个 cmd,single-fire 天然成立,**无需新建 judgment yaml**(交付物 4 撤销)。

## F6 `aliases` 目前零运行时行为 + gate 落点

- `aliases` schema:`{ impl, cmd }` 数组(`src/workflow/schema/capabilities.ts:31-37` + `:86`;CI 逐字镜像 `scripts/check-workflow-schema.mjs:49-52`/`:88`)。
- 读取点:**TS 生产代码零个**。仅 schema 声明 + `tests/workflow/ecc-wiring.test.ts:24/81/90/114` 断言。`capabilityResolver.ts:39-58` 的 `CapabilityEntry` 接口连 `aliases` 字段都没声明。
- 与 `manifests/aliases.yaml`(manifest 弃用重定向,`src/manifest/aliases.ts`)同名不同物,勿混。
- ADR-0038 fail-closed:判别器 `isUndefinedVariableError`(`src/workflow/exprBuilder.ts:44-46`),三处 catch 分型(`src/cli/gates.ts:198-221` / `src/workflow/masterOrchestrator.ts:159` / `src/workflow/run.ts:498`)。
- gateContext 唯一硬编码 SoT:`src/cli/lib/gateContext.ts:28-81`;`--context` 深合并 `mergeGateContext`(`:86-99`),仅 `harnessed gates` 路径有(`harnessed run` 路径无 `--context` 合并,`src/cli/run.ts:156-171`)。
- 结构性断言落点(D8 链尾不变式):`scripts/check-workflow-schema.mjs` Step 1 通过分支内(`:306-308`,已持有 `capParsed.capabilities`)—— capabilities.yaml 唯一 CI 硬失败 gate,C1/C2/C3/K9 契约同住此处。无 package.json script 别名,CI 直调(`.github/workflows/ci.yml:176`)。

## F7 expr-eval spike(结论:本 phase 不用它,但留档)

lib = `expr-eval@2.0.2`(`package.json:84`),唯一求值入口 `evalGate`(`src/workflow/exprBuilder.ts:48-67`),`PARSER_OPTIONS`(`:9-20`)关掉算术/赋值,**保留 `in` / comparison / logical**,内置函数(`indexOf`/`length`/`join`)未关。

若将来真需要「多语言 diff」fact,实测最优形状是 **`'rust' in subtask.languages`**(JS 字符串数组直传):仓内 `in` 已在生产用(`workflows/judgments/tdd-gate.yaml:15` 等 6 处),JSON round-trip 无损,总改动 2 行(`gateContext.ts` 加 `languages: []` + `phaseFactContext.ts` SubtaskShape 加数组)。已排除:`indexOf(a, b)` 参数写反**静默给错答案**;helper 注入进 context 经 `JSON.stringify`(`src/cli/run.ts:174`)被**静默吞掉**→ 退化 `undefined variable` fail-closed;扁平 boolean fact 是 O(N) 且 `additionalProperties: false` 逼每加一语言改 schema;csv 字符串法 —— **`in` 对字符串是逐字符匹配**(`'r' in 'rust,go'` 为 true),语义完全错。

**独立发现(第三类未定义变量行为,新)**:对**缺失/null 成员**用 `in`(如 `'rust' in subtask.languages` 而无该键)抛的是 `Cannot read properties of undefined (reading 'length')`,**不匹配** `isUndefinedVariableError` 的 `/undefined variable/i`(`exprBuilder.ts:44-46`)→ 落 ADR-0029 **fail-SOFT** → 子项照 fire。与 ADR-0038 已记载的两类(裸标识符缺失 fail-closed / 对象成员缺失静默 false)并列的第三类。**本 phase 不引入数组 fact,故不触发;记入 TODOS 作为 ADR-0038 正则收口候选。**

## F8 T0 代理实测结果(TS 面):专家**无**优势,通用胜出

同题同 diff(`12a8f22`,8 文件 +341/-34 src TS),`ecc:typescript-reviewer` vs 通用 code review 并行:

| | ECC TS 专家 | 通用 |
|---|---|---|
| 发现数 | 4(1 HIGH / 1 MED / 2 LOW) | 12(2 建议级实质 + 10 健壮性/UX/细节)+ 4 条正面确认 |
| 最重发现 | `setup-helpers.ts:244-245` effective-method 未用于 MCP 串行分区 | **同一条**,且额外指出测试把不一致固化了(`tests/unit/cli-setup-helpers-stepb.test.ts:200` 只断言分桶不断言串行) |
| 独有发现 | check-ecc codex-only 侧 leftover 分支被 `if (ccInstalled)` 挡掉;search-mcp-keys EACCES 被静默降级 | `doctor.ts:20` `Promise.all` 无 per-check 容错(`readClaudeConfig.ts:73/119` 显式 re-throw → 任一 check 抛错整个 doctor 崩、19 个结果全丢);`check-ecc.ts:56-57` 硬编码 codex 路径绕过 `codexDescriptor()` 接缝;optional-offer 可一键装出 doctor 随后要求撤销的 ecc + chrome-devtools 双装态;`TARGET_SERVERS` 注释宣称的不变式已失效 |
| 语言特有问题(borrow checker / goroutine 泄漏类比) | **零** | — |

**判定**:按 design doc Assignment 判据(「专家是否揪出通用漏掉的语言特有问题」),TS 面答案是 **NO** —— 专家发现是通用发现的真子集 + 两条边缘项,通用反而抓到更深的架构缺陷。

**证据强度限定**:TS 是对该假设最不利的测试面(通用 reviewer 在 TS/JS 上训练密度最高,且本仓就是 TS 有充分上下文)。rust/go 的 borrow checker / goroutine 泄漏面**未被本代理测覆盖**,用户手上的 15-min 实测仍是独立第二锚点。

## F10 rust / go 对照实测(2026-07-29,补齐 F8 的证据强度限定)

F8 只测了 TS(对专家最不利面)。补测 rust + go —— design doc 点名的「borrow checker / goroutine 泄漏」正是这两面。

**rust**:`D:\GitCode\reedline-pr` commit `caeff8a`(upstream PR #1117 "Asyncronous prompt updates",单文件 +225/-17,async + 共享状态)。

| | `ecc:rust-reviewer` | 通用 |
|---|---|---|
| 发现数 | 5(1 HIGH + 4 MEDIUM/style) | 9(2 BLOCKER + 4 SUGGESTION + 3 NIT) |
| 共同命中 | `Arc::strong_count` 门控竞态;`Ordering::Relaxed` 无 happens-before;测试只覆盖 primitive 不覆盖 read loop | 同左,且更深:给出竞态的 5 步交错、定位到 drop 与 store 之间的窗口、给出 flag 复查修法;把 Relaxed 从「文档该补一句」升级为真实数据可见性缺陷 + Release/Acquire 修法 |
| 专家独有 | `#[must_use]` 缺失(真实,小);derive 顺序(风格) | — |
| 通用独有 | — | **`RepaintSignal` 没从私有 mod re-export → 整个 feature 对下游 crate 不可用**(写临时 integration test 编译实证 `error[E0425]`,专家完全没发现);`#[derive(Default)]` 让下游能造出永远失效的 handle;取 handle 即把 session 从阻塞 read 切成 100ms 轮询但公开文档未说明;缺 example(而 example 按外部 crate 编译,本会立刻暴露导出缺口) |

两侧都跑了 `cargo check/clippy/fmt` + 新测试,基线相同。

**go**:`plandex/app/server/types/active_plan.go`(446 行,16 处 mutex,2 goroutine;go 仓全是 depth-1 浅克隆无 diff 可取,改整文件同题对照)。

| | `ecc:go-reviewer` | 通用 |
|---|---|---|
| 发现数 | 5(2 CRITICAL + 3 HIGH) | 11 + nits(5 红 + 6 黄) |
| 共同命中 | subscriptions map header 复制导致锁范围假保护(runtime fatal);持 `streamMu` 向可能无接收者的 channel 裸发送;skipBuffer 分支缺 return 导致重复投递;`cond.Signal` 丢失唤醒;Subscribe 桥接 goroutine 不被 Unsubscribe 释放 | 全部命中(通用还补充 `recover()` 救不了并发 map 访问 —— 那是 runtime throw 不是 panic) |
| 专家独有 | 无 | — |
| 通用独有 | — | `StreamDoneCh` 二次发送永久阻塞 `Finish()`(专家只泛指裸发送,没定位到这条);全仓 ~30 个 sender 抢单次消费 channel;`BuildQueuesByPath` 读端锁状态不一致(逐个列出 5 个越界读点);`messageQueue` 无上界;`FlushStreamBuffer` 不保证 flush(会被速率判定塞回);`ResetModelCtx` 无同步写导出字段;导出可变字段无同步契约 |

通用侧交叉核对了 6 个关联文件(消费端/写入端)才敢断言「唯一消费者已 return」—— 这是它能定位 `StreamDoneCh` 那条的原因。

**判定**:三语言(TS / rust / go)三次,**通用发现均为专家的严格超集**,且通用独有项里包含每个语言最严重的那条(TS:doctor 崩溃面;rust:feature 对外不可用;go:`Finish()` 永久阻塞)。design doc 假设的「专家揪出通用漏掉的语言特有问题」在三个面上都不成立。B 方案(probe + resolver + 语言推导器 + schema)**确定不回补**。

**可能的机制解释(非结论,供后续参考)**:ECC 专家 agent 的 `tools: Read, Grep, Glob, Bash` 与通用相同,差异在系统提示词把注意力**收窄**到该语言的 checklist 维度,而这三次的最严重缺陷都在**跨文件契约面**(导出面 / 消费端生命周期 / 调用方锁约定),恰好落在收窄视野之外。

## F9 T0 附带打出的真 bug(独立于本 Phase 存废)

1. **`src/cli/lib/setup-helpers.ts:244-245`(两路 review 共同判定最重)**:MCP 串行化分区读 raw `spec.install.method`,而同 commit 新引入的 `installGroupOf`(`:131`)读 `effectiveInstallMethod`(应用 `harness_overrides.codex`)。同一事实两个判定点。base 非 MCP + codex override 成 `mcp-stdio-add` → 分桶显示 `'mcp-tool'` 但实际进并行组 → 重开 v4.13.0 的 `~/.claude.json` lost-update 竞态(注释 `:107-111` 正是为此存在)。**现网潜伏**:7 个带 `harness_overrides` 的 manifest(superpowers/gstack/karpathy/planning-with-files/gsd/ui-ux-pro-max/ecc)base 与 override 均不跨 MCP 边界,已逐个核实。
2. **`src/cli/doctor.ts:20`**:`await Promise.all(CHECKS.map(c => c()))` 无 per-check 容错。`readClaudeConfig.ts:73`/`:119-120` 对非 ENOENT(EACCES/EISDIR)**显式 re-throw**(反 silent-swallow 的有意设计),任一 check 抛错 → 整个 `harnessed doctor` 裸 stack trace 崩,另 19 个结果全丢。4.32.22 的 `checkEcc:78` 新增一个抛点。
3. F2 的 `gsd-debug` 三个 ecc alias 名上游不存在。
4. `capabilities.yaml:138-141` 承诺的 `runtime/priority.yaml` 仲裁器不存在。
5. F7 的 ADR-0038 第三类(对缺失成员用 `in` → fail-SOFT)。

## F3 覆盖缺口(供 OQ5 首发范围裁决)

- reviewer 有 / build-resolver 无:C#、F#、PHP、TypeScript(通用 `build-error-resolver` 兜底)、Python 原生
- build-resolver 有 / 同名 reviewer 无:Dart(`flutter-reviewer` 覆盖)、PyTorch(`mle-reviewer` 覆盖)
