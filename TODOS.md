# TODOS

> Deferred work with context. Source of each entry = a review decision (linked). Do not
> inline into ROADMAP/STATE (doc discipline: one fact one home).

## From /plan-ceo-review 2026-09-22 (codex 宿主对等 — CEO plan: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-09-22-codex-host-parity.md`)

- [x] **Cross-host workflow adoption (Claude Code / Codex)** — SHIPPED 4.49.0; reconciled 2026-10-25.
  `harnessed checkpoint adopt [--from claude|codex]` is implemented by `src/checkpoint/adoptSlot.ts`
  and the checkpoint CLI. The earlier shared-root proposal was rejected by accepted ADR-0043;
  production copies from the read-only source root into the existing target ledger, preserving
  active-slot rejection and paused-slot recovery. See `.planning/phases/67-cross-host-relay-adopt/SUMMARY.md`.
  Isolated two-host fixtures passed; real dual-host workflow handoff remains separately unverified.
- [x] **AGENTS.md 同源生成** — **CLOSED 2026-10-07**,`harnessed agents-md`(opt-in 命令)。
  范围经维护者当场裁定「只放 harnessed 自己那段」:命令清单 + 宿主原语对照 + caveat,
  全部从真相源派生(命令取 `writeAllCommands` 的同一集合;对照表**嵌** `buildHostMapSection()`
  的输出,所以 AGENTS.md 与 SKILL 正文里那张表是同一个产物、同一 yaml 源,不会各自漂)。
  **个人方法论不生成**:harnessed 没有 gstack 技能清单 / 三层栈路由偏好的机器可读源,
  它们留在标记区间外手写、不碰。
  **「把 CLAUDE.md 渲染成 AGENTS.md」这条路被判不成立**:Phase 65 的渲染器替换占位符,
  而 CLAUDE.md 是零占位符的自由散文;自动改写散文等于盲替换,而 Phase 65 的教训正是不能盲替换。
  opt-in = 它是一条要手敲的命令,`setup` 不碰 AGENTS.md。`--dry-run` / `--remove` /
  `uninstall` 剥除三条都有测试;非 codex 宿主诚实拒绝(退出码 1)。
  实施中自查出的两个错并当场修掉:(1) 预览最初回传**文件全文**,dry-run 把维护者 192 行个人指令
  整篇打进终端 —— 收窄为只回传那一段;(2) 拒绝文案建议 `--platform codex`,而本命令**没有**这个
  flag(只有 setup / check-docs / inject-state 有)—— 改为 `HARNESSED_PLATFORM=codex`。
  实测到的漂移(作为本项动机留档):`/to-prd` `/to-issues` `/diagnose` `/zoom-out` 均已改名或删除;
  `TeamCreate` / `TeamDelete` 在 Claude Code 已删;且有「Codex Agent Teams + `TeamCreate`」——
  名字本地化了机制没换,codex 无 Agent Teams。

- [ ] **gemini 宿主 milestone** — P2 / L,**已批准开发**(2026-10-14)
  Why: 复用 codex milestone 收敛出的 HostAdapter 契约加第三宿主。先实测 gemini hook / subagent / skills 目录。
  Criterion: 实际用不用(design doc 2026-08-26 OQ4)。Depends: codex 宿主对等 milestone 收口。
  **2026-10-14 维护者裁决**：**做**。OQ4「实际用不用」由维护者直接答「做」。
  新 milestone → 按三层栈须先过 gstack `/office-hours` + `/plan-ceo-review`,再 GSD plan-phase。
  先做的事:实测 gemini 的 hook / subagent / skills 目录三面(不实测不得写进 HostAdapter 契约)。
- [x] **codex goal 桥接** — **永久关闭 2026-10-07**,结构性不成立(实测,codex-cli 0.155.1)。
  本项原记「只有维护者能在 TUI 里实测」。那判断划得太宽:整条路可以**零推理**地在 app-server
  协议层判定,不需要 TUI、不花额度、不碰真实 CODEX_HOME(探针全部在临时目录,`harnessed-probe-*`)。
  实测三条,每条都是服务端原话:
  1. **没有创建 goal 的 API。** `thread/goal/set` 是纯 **update** 语义:目标不存在时报
     `cannot update goal for thread <id>: no goal exists` —— **thread 的所有者自己也被拒**,
     不只是外部进程。`thread/start {goal: …}` 的参数被接受但不生效(`thread/goal/get` 仍为 null)。
     167 个 app-server 方法里没有 goal 的创建口(枚举法:发一个不存在的方法,
     从 `-32600 unknown variant … expected one of …` 的 serde 报错里读全集)。
     推论:goal 是 codex 自己在 turn 过程中产生的,`goal/set` 只供事后编辑。
  2. **活 thread 有单写者锁。** 另一个进程 `thread/resume` 同一个 threadId →
     `thread <id> already has an active writer`。真实场景里持锁的就是那个运行中的 TUI,
     所以 harnessed 作为另一个进程**永远改不了它的状态**。
  3. **读是跨进程的,写不是。** 非所有者进程 `thread/goal/get` 能正常返回(`{"goal":null}`)。
     另:没跑过 turn 的 thread 不落盘(`thread/resume` → `no rollout found`),
     `thread/inject_items` 可以零推理地造出 rollout(返回 `{}`)—— 这条顺带记下,它是
     「不花额度地造一个可 resume 的会话」的办法,将来别的实测用得上。
  **与本条目旧表述的矛盾,如实记下**:原文写「`thread/goal/set` 经 app-server 写入**跨进程持久**
  (Phase 63-64 期间实测过)」。在 0.155.1 上、对一个**没有 goal 的 thread**,我复现不出成功的写入 ——
  set 直接被拒。可能当时测的是一个已被 codex 创建过 goal 的 thread。
  **未实测的那一支**:thread 已有 goal 时,外部进程能否 update 它。即便能,对 harnessed 也无用 ——
  harnessed 要的是**主动施加**一个 goal,而创建口不存在;只能编辑 codex 自己定的目标没有价值。
  **因此不需要维护者再做 TUI 实测**:判据「步骤 3 或 4 可见」的前提(外部能把 goal 设进去)
  本身就不成立。ADR-0039 删掉 goal tier 的理由(「从未被实证」)在 codex 侧同样成立,无需新 ADR。
  若上游将来加了 goal 的创建 API,再按本条的实测记录重开。

- [x] **README 表述更新(v16.0 宿主对等)** — **CLOSED 2026-10-08**。
  封锁解除:那 10 个 README 的改动(另一会话的「安装路径前置 + 英文链接修正」)已于同日落地
  (`b25e62f`,维护者明确要求;按显式路径 stage,不含工作树其它内容)。
  对齐内容不是「补新功能描述」,而是**更正两处错误的否定性断言**:
  「原生 Codex 只有 `AGENTS.md`、无 skill/hook」与「无 subagent/team 原语」—— 两条都被本项目
  自己的实测证伪(Phase 64 的 hook via 本地插件 + `~/.agents/skills`;Phase 66 的
  `spawn_agent` / `send_input` / `wait_agent` / `list_agents` / `close_agent` / `resume_agent`)。
  项目记忆 `verify-upstream-before-asserting` 要求否定性断言有引文级来源,这两条正是反例。
  第三处「Codex 经 platform 层」说轻了,改为点名 v16.0 的五项。
  **README 没有任何闸门或测试守**,所以每次碰都要手验:本次验了(a) 三处旧说法零残留、
  (b) 10 个镜像结构一致(各 25 个标题,层级与 emoji 逐位相同)、(c) 十道 `check-*.mjs` 全 0。
  tr 镜像把 `Cross-harness` 译成了 `Çapraz-harness`,机械匹配漏掉它 —— 单独补,
  并靠「每条替换必须恰好命中一次,否则 abort」的断言把这个漏网当场暴露出来。

- [x] **MCP 注册探测仍读 `~/.codex/config.toml` 全文** — **CLOSED 2026-09-30**(v16.0 收口后顺手做,
  trigger「下一次碰 codex MCP 安装路径时」正好命中:那次改的就是这两个安装器)。
  探测改问 `codex mcp list --json`(`codexMcpServers.ts`);形状实测于 0.155.1,用 `-c` 的内存内覆盖探得,
  没写过任何文件。TOML 段头正则连同测试整块删除。**顺带揪出第二处读取**:`probeSearchMcpKey` 经
  `readUserClaudeJson()` 读同一文件只为让 `JSON.parse` 失败 —— 守卫下在机制上,新调用方自动继承。
  于是 ADR 0041「不写也不读」不再需要例外条款,与 ADR 0040 保留 `mcpConfigPath` 之间的张力消解:
  该字段唯一职责变成 diff 预览里的目标文件标注。详 `docs/host-contract.md` §5.1 + CHANGELOG。

- [x] **codex 上 plugin 类能力全告警** — **CLOSED 2026-10-07,但立项前提被实测否掉**。
  原描述说「逐条刷屏」。实测:`renderAllSkills` 把所有 skill 的告警折进一个 `warningSet` 全局去重,
  commands 面的 `warnings` 按构造恒为空 —— 所以整次 setup 最多 **5 行**,不是每个能力刷一条。
  真正会命中的只有 4 个 plugin-only 能力(`code-review` / `code-simplifier` / `ui-ux-pro-max` /
  `planning-with-files`)加 `caveman`(plugin+user-skill,仅当 user-skill 那条也没命中)。
  78 个 user-skill-only 在 codex 上照常探真实目录,不是宿主伪影。**因此不做聚合机制**(无需求)。
  真缺陷在**出路**:那几行告诉 codex 用户去跑 `claude plugin install <id>`,而 codex 根本没有
  Claude Code 插件注册表(`pluginsRegistry: null`),这个动作不可能有用。已改为「本宿主不可用、
  没有任何安装能改变、把调用它的步骤记为 skip」,措辞与 `host-primitives.yaml` 里既有的
  `Claude Code plugin components` caveat 对齐,不另造一套说法。claude 侧文案逐字节不变。
  可达性单独钉死(`renderAllSkills` 层三条):断掉 host 传参那条立刻变红 —— 这个「已实现但不可达」
  的坑在本项目反复出现。考虑过但没走的路:给 schema 加「本宿主不可用」声明(`by_host` 扩展)——
  4 个能力、全是插件分发的上游,不值一个 schema 变更 + 闸门改动。

- [x] **codex 上 subagent prompt 拿不到语言指令** — **CLOSED 2026-10-07**。
  「语言偏好存哪」这个待定项的答案被约束逼成唯一解:不能写 `config.toml`(含凭据、codex 自己写),
  codex 无 JSON settings 文件,改 shell profile 等于写一个 harnessed 不拥有的文件 —— 所以写
  harnessed 自己的 state root:`<stateRoot>/user-lang`,Phase 63 `.platform` pin 的邻居。
  取值顺序 env → pin(env 优先保住 claude 侧逐字节不变,并保留单次覆盖)。
  **没有用 `getLocale()` 顶替**:它回答「读哪个语言的 yaml/CLI 文案」,而这里回答「模型用什么语言回话」
  (`setup --user-lang` 指定)—— 在英文 locale 机器上跑 `--user-lang zh-Hans` 会造成两宿主结论分叉。
  pin 内容不是受支持语言码时按不存在处理(那个值会拼进 `Respond in <name>`)。
  卸载无需改动(本来整删 state root)。`host-contract.md` 的缺口表删掉该行、descriptor 表那条改为已修。

- [x] **en 安装在 skills 目录留一份带未解析占位符的 zh 副本** — **CLOSED 2026-10-07**,选「剥除」。
  两个候选里不选「也渲染它」:locale 在安装时选定,换语言要重跑 setup(会重新从包里 cp),
  第二份 locale 正文没有任何读者 —— 把垃圾渲染正确仍然是垃圾。剥除则什么都不用解释。
  实现上把 strip 提成独立函数,**两条返回路径都跑** —— 包括「正文无占位符因而无需写入」那条提前返回,
  此前 strip 写在它之后,于是恰恰是无需渲染的那批 skill 留下残留。
  `SKILL.md` 字节不受影响(en 安装仍逐字节不变,金标守着)。
  **TODO 原文把锁旧行为的断言位置说错了**:它说在 `renderSkillTemplates.test.ts`,实际那条只断言
  `SKILL.md` 未变、标题写着「sibling left untouched」却没断言 sibling 存在;真正锁着的是
  `renderGolden.test.ts:202`(标为 Phase 29 contract)与 `setup-locale.test.ts:170`,两条都已改。
  `renderGolden.test.ts` 的 `LOCALE_SIBLING_RX` 过滤器保留为双保险并注明理由:它原本是必需的
  (否则对未渲染副本断言「无 `{{ host.`」必假红),现在冗余,但留着能让「又开始留 sibling」的回归
  先在 sibling-absence 那条上失败、而不是静默放宽这道门的扫描范围。

- [x] **`check-host-primitives` 未覆盖生成命令体(S2)** — **CLOSED 2026-10-07**,但不是让门去 build。
  真缺口不是「S2 没人查」(`generateCommandsGolden.test.ts` 有 codex sanity 块),而是**判据分叉**:
  那个 sanity 块在两个文件上手挑三个 token(`task_name` / `CC-native` / `AskUserQuestion`),
  而门里的 `CC_TOKENS` 才是「什么算残留」的真相源 —— 往它加一条只强化 S1/S3,S2 不受益。
  而 S2 恰恰是 Phase 65 出过真 bug 的面(指向 `~/.claude/rules/agent-teams.md`、命令模型调
  `AskUserQuestion`,两者在 codex 上都不存在)。
  做法:新增 `tests/cli/generateCommandsHostResidue.test.ts`,**import 门的** `CC_TOKENS` /
  `MASKS` / `maskPhrase` / `hostMapMarkers` / `scanCcTokens`,作用到全部 codex 命令体 ——
  一处编辑同时覆盖三个面。门保持 dep-light,不新增 build 依赖。
  自带正向对照:同一条 mask→scan 管道跑 claude 产物必须仍有命中,否则 codex 那条绿什么都不证明
  (与门自己「零命中的 allowlist 条目算违规」同一思路)。实测当前 codex 产物零残留。

- [x] **E1 二进制签名(Windows Authenticode + macOS notarization)** — **PARKED**(2026-10-14,维护者裁决延后)
  Why: 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,安装器体验最大摩擦源。
  Depends: **用户拍板证书采购** — 决策清单已备:`docs/e1-code-signing-options.md`(4.32.20,三档预算 + 三个拍板问题)。
  注意:与 4.32.19 更新通道 ed25519 资产签名(review #12)是两回事,后者已落地。
  **2026-10-14 维护者裁决**：**延后**,从活动队列移出(标 parked,不是放弃)。证书采购是花钱决策,决策清单已备:
  `docs/e1-code-signing-options.md`(三档预算 + 三个拍板问题)。要重启就把本条改回 `- [ ]`。
  注意它与「二进制优先于 npm」那条方针相关:无签名是二进制渠道**最大**的摩擦源(SmartScreen / Gatekeeper)。
- [x] **E3 channel-aware update(stable/beta)** — **PARKED**(2026-10-14)
  Why: Trellis 模式的预发订阅。Blocked by: 发布节奏尚无 beta 轨道(预发 tag 约定 + publish.yml 分轨先行)。
  **2026-10-14 维护者裁决**：**按建议办** = 继续停。它的前置(发布节奏先有 beta 轨道:预发 tag 约定 + publish.yml 分轨)
  本身是产品决定「要不要一条预发通道」,维护者未表态要 → 不投机建设。想要时先做轨道再做订阅侧。
- [x] **`harnessed update --rollback`** — SHIPPED 4.32.20:`runBinaryRollback`(同款 rename dance,被换下的二进制先 bank 回 bin-backup/<curver>/ 保可逆;`--rollback [version]`,缺省取最高 banked 版;npm 模式明确拒绝导向 `npm i -g`)。
- [x] **System proxy support for binary updates** — SHIPPED 4.49.0; reconciled 2026-10-25.
  `src/cli/lib/proxyDispatcher.ts` provides Node-side `EnvHttpProxyAgent` handling;
  `src/cli/lib/selfUpdateBinary.ts` invokes it before download. Compiled Bun retains its native
  proxy path. This closes the implementation TODO, not an independent fresh network acceptance claim.
- [x] **Slice 2:curl/PowerShell 一行安装器** — **已发,本条目过期**(2026-10-07 对账补勾)。
  按产物核实而非凭记忆:仓库里有 `install.sh` / `install.ps1`,CHANGELOG 记着
  「B 路线 Phase 3 Slice 2:一行安装器」交付(含 unix `~/.local/bin/harnessed` 与 Windows
  `%LOCALAPPDATA%\harnessed\bin\harnessed.exe` 两条落位),之后还有两次 dogfood 修复
  (PATH 遮蔽导致 setup 跑到旧那份)。下方 Slice 3 的 Depends 行也早已写「Slice 1/2(已发)」。
  一个实际已发的 **P1** 挂在队首会扭曲优先级,这正是「状态从产物派生」要防的漂移。

- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P3,**保持 open**(2026-10-14)
  Why: esbuild/Biome 模式。价值质疑:npm 用户必有 Node(包是纯 JS 本就能跑),二进制用户已有一行安装器;
  收益仅剩启动速度,代价是 4 个 npm 包的发布管线/版本锁/launcher shim 维护面。等真实需求信号再启。
  Depends: Slice 1/2(已发)。

## Gate semantics

  **2026-10-14 维护者裁决**：**不关**。维护者给的方针:「后续二进制方式安装**优先级高于** npm 方式」。
  ⚠️ 需要留意的张力:本条改善的是 **npm 渠道**(让 npm 用户也拿到二进制),而方针说 npm 是次要渠道;
  真正推进「二进制优先」的是 **E1 签名**(无签名 = SmartScreen/Gatekeeper 摩擦),而那条刚被延后。
  所以本条暂不排期,等「二进制优先」具体要落到哪一步再定;若目标是「npm 装完即得原生二进制」则本条就是它。
- [x] **ADR-0038 第三类:对缺失/null 成员用 `in` 落 fail-SOFT** — **CLOSED 2026-10-07**(ADR-0042)。
  判据改名 `isStaticGateConfigError`,从单一 `undefined variable` 扩到三类静态漂移:裸标识符缺失 /
  `in` 访问缺失或 null 成员 / 表达式无法解析。三条消息都**实测**自本仓 pinned 的 expr-eval,
  测试断言的是真实抛出的文本,所以上游改措辞会红而不是静默退回 fail-soft。
  刻意不纳入 `must evaluate to boolean`(可能取决于 fact 的运行时类型,不必然静态)。
  **顺带更正 ADR-0038 的一条前提**:它的 Context 写「object member 缺失静默求 false(4.23.2 实证)」,
  对 `in` 运算符不成立 —— 实测抛 TypeError。按 0038 自己 amend 0029 的守恒做法,以 ADR-0042 承载、不改其正文。
  三处 catch 的 warn 文案一并泛化(原文只说「a variable missing」,对后两类是错的指引)。

- [x] **ECC 语言专家路由是否补机器层(B 方案)** — CLOSED 2026-07-29:**不补**。
  rust(reedline-pr `caeff8a`)+ go(plandex `active_plan.go`)对照实测补齐后,三语言
  (TS/rust/go)三次通用发现均为专家的**严格超集**,且通用独有项含每个语言最严重那条
  (rust:feature 对下游 crate 不可用;go:`Finish()` 永久阻塞)。证据 findings F8+F10。
  prose 级(4.32.23 aliases 渲染)保留 —— 装了 ECC 的用户仍可用,但不再为它建机器。

## Watch items

- [x] **gsd-core 1.7.0 GA watch** — RESOLVED 2026-07-15:1.7.0 GA 已发(npm latest=1.7.0)。
  评估结论:host-integration interface(ADR-1239)+ destSubpath write-confinement 未改
  claude runtime 写入路径(本机 1.7.0 实测 gsd-* 仍装 ~/.claude/skills/,71 skill)。
  manifest re-sync 完成(npm_version ^1.7.0 / last_known_good 1.7.0 / 4.32.3)。
- [x] **quarantine 身份判定在 Windows runner 上偶发命中另一条拒绝理由** — FIXED 2026-11-09(`e7ec448`):
  断言改为接受两条拒绝理由(NTFS inode 回收会让 rename 后的替换文件命中 content guard 而非 identity guard,两条都是正确 fail-closed)。原记录:
  Phase 84 的 push(`77bf63f`)让 `test windows-latest` 红过一次,失败点是
  `tests/unit/quarantineDelete.test.ts` 的「restores and preserves a replacement file swapped in
  after preflight」—— 断言要 `identity changed after preflight`,实际抛
  `content changed after preflight`。两条都是「preflight 之后文件被换掉」的**拒绝**路径(都安全),
  只是命中了不同的守卫(身份判定比对 `dev`/`ino`,内容判定比对摘要)。
  证据:同一次 push 的 `gh run rerun --failed` 9/9 全绿;本机 Windows 跑该文件 11 测试全绿;
  `src/lib/quarantineDelete.ts` 只 import node 内置模块,与自动更新改动无关 → 判为 Windows
  runner 上的时序/文件标识复用类 flake(测试负载变化会把它顶出来)。
  待办:把「身份不符」与「内容不符」的判定顺序固定,或让断言接受两条拒绝理由,
  免得红色 CI 掩盖真失败。

## Earlier deferrals (intel 回填表镜像,详 .planning/intel/omc-comparison.md)

- [x] **B4 eval harness** — Slice A SHIPPED 4.31.0(trap suite + coverage 导航;B1 证据包 SHIPPED(逮住 issue #7);Slice C 录制导出 SHIPPED 4.32.0(harnessed eval record,默认脱敏,round-trip);后续差异化实验需另一形态(模糊 spec/跨 session))
- [x] **SOP 文本 `--skip-sub clarify` 改名 `discuss`** — SHIPPED 4.32.20:generator(generateCommands + rewrite-skill-invoke-sections)+ 全部 workflows/*/SKILL{,.zh-Hans}.md 改 `--skip-sub discuss`;engine 侧 clarify→discuss synonym 保留(兼容已装旧文本)。
- [ ] **G5/OMC ambiguity 量化阈值** — P3,**已批准开 discuss**(2026-10-14)

  **2026-10-14 维护者裁决**：**开**。方向级设计 → 走 `/discuss-strategic`(或 gstack `/office-hours`)出方案再决定是否立项,
  本条本身不产出代码。

## From the 2026-11-02 credential-hygiene pass (machine-local incident, not a repo defect)

背景:本机 `~/.claude/settings.json` 的 `env` 里同时躺着两枚**互不相同**的凭据,都已扩散到
Claude Code / Codex 的 session transcript 与 harness 的 install 备份里。本轮把能自动化的部分做掉,
剩下的两件必须维护者本人在浏览器里做。

- [ ] **撤销泄漏的 GitHub OAuth token(需维护者本人操作,无法脚本化)** — 泄漏的那枚是
  `gho_Go58Vf…`(2026-11-02 实测仍有效:`GET /user` 返回 200;scopes `delete_repo, gist, read:org,
  repo, workflow`)。它**不是** gh keyring 里那枚(`gho_8qzd…`,scopes 多 `admin:org` / `user`)。
  GitHub 的 `DELETE /applications/{client_id}/token` 需要该 OAuth app 的 client secret,拿不到 →
  只能网页撤销:GitHub → Settings → Applications → Authorized OAuth Apps → 对应应用 → Revoke。
  撤销后如果 `gh` 也失效,`gh auth login`(device flow)重登。
  已做:从 `~/.claude/settings.json` 删除;从 harness install 备份快照 + CC 日志里抹除(备份快照的
  `metadata.json` sha1 已同步重算,`harnessed rollback` 的完整性校验不受影响)。
  仍在:旧 session transcript(`.claude/projects/**.jsonl`、`.codex/sessions/**.jsonl`)—— 撤销后即失效。
- [ ] **轮换 Context7 API key** — `ctx7sk-…` 同样已从 `~/.claude/settings.json` 删除;
  context7 MCP 走自己的 OAuth(`~/.claude/.credentials.json` → `mcpOAuth` → `plugin:context7:context7`),
  删 env key 不影响 MCP 使用。但旧 transcript 里仍有明文,建议到 context7 dashboard 作废并重发。
- [ ] **installer 备份整份 `settings.json`(含明文凭据)—— 待定方案,未改代码** —
  `src/installers/lib/backup.ts` 对 `plan.files` 里每个文件做整份字节备份;装 `update-reminder` 时
  `~/.claude/settings.json` 会被原样复制到 `~/.claude/harnessed/backups/<id>/HOME/.claude/settings.json`,
  于是凭据多出第二份。**当前刻意不改**:`src/cli/rollback.ts` 用 `metadata.json` 的 sha1 校验备份完整性,
  整份脱敏会破坏回滚保真(回滚要把原样文件写回去)。候选方案:
  (a) 只备份被改动的 JSON 子树(本例只有 `hooks`),rollback 做子树还原;
  (b) 备份时对 secret 形态的值脱敏,rollback 还原时保留当前值;
  (c) 维持现状 + 文档化「settings.json 不放长期凭据」。
  选 (a)/(b) 需要独立 phase + TDD(备份/回滚保真 + sha1 契约都有既有测试)。
- [ ] **gh keyring token 权限过大** — 当前那枚是 user-to-server OAuth token,scopes 含 `admin:org` +
  `delete_repo` + `workflow`。若要长期用 GitHub,换成 fine-grained PAT(按 repo 授权)更合适。
- [ ] **会话里不要 echo 凭据** — 本轮 `gh auth token` 的输出被 Claude Code 记进
  `~/.claude/bash-commands.log` 与 `cost-tracker.log`(已抹除)。查凭据一律只打印前缀与长度。

## From the 2026-11-02 codex-host setup repair (v5.0.9 live run)

用户在 codex 宿主跑 `install.ps1`,`harnessed setup` 退出 1。用 v5.0.9 重跑并逐条定位后,
3 个失败里 2 个已修好,剩下的 1 个属于另一条在途改动。

- [x] **gstack Codex lease:需要 POSIX symlink,本机 Git Bash 没有 symlink 权限** — 已修。
  现象:`gstack-lease: the lease directory is locked by live process ; lease <pid> not renewed`
  —— 持有者是**空的**,其实没人占锁。根因:`bin/gstack-lease` 的锁是 `ln -s` 造的 symlink
  (`$DIR/.lock`,target = `<pid> <start identity>`),而本机 Git Bash 的 `ln -s` 直接失败
  (`failed to create symbolic link: No such file or directory`);Developer Mode 的注册表值是 1,
  但用户不在 Developers 组、进程非管理员,`New-Item -ItemType SymbolicLink` 报
  "Administrator privilege required for this operation" → symlink 原语不可用 → 锁永远拿不到。
  解法:`MSYS=winsymlinks:lnk`(已写进 Windows 用户级环境变量)。实测:`ln -s` 造出 `.lock.lnk`,
  `readlink .lock` 读回持有者字符串,第二次 `ln -s` 报 "File exists" —— **锁语义完整,没有绕过**;
  `gstack-lease touch`/`list` 退出 0,gstack 组件随即变成 `already-installed`。
  待决:要不要让 harnessed 在 win32 上为 lease 子进程自动带这个变量(`src/installers/lib/gstackLease.ts`),
  或向上游 gstack 提一个「Windows 无 symlink 权限时退化为 .lnk」的 PR。
- [x] **playwright-cli 版本与 manifest 钉的版本不一致** — 已修(本机侧)。
  主机全局是 `@playwright/cli@0.1.23`,而 `manifests/tools/playwright-cli.yaml` 钉的是 `0.1.22`
  (`npm_version` + `idempotent_check` + verify 脚本里都是精确匹配),于是 verify 报
  "Expected playwright-cli 0.1.22"。注意:`harnessed setup --system` 也**不会**自动降级它 ——
  组件在 harnessed 的账本里记着"已安装",走的分支是"只 verify 不 install"。
  本机已执行 `npm install -g @playwright/cli@0.1.22` + `playwright-cli install-browser chromium`,
  setup 里该组件转 `already-installed`。
  待决:manifest 的 `upstream_health.last_check` 还停在 2026-10-23、`stability: unstable`,
  要不要把钉的版本推到 0.1.23(需改 manifest + verify 脚本 + 发版),还是继续钉 known-good。
  回滚本机改动:`npm install -g @playwright/cli@0.1.23`。
- [x] **planning-with-files 被 ownership guard 拒绝替换** — 已修(2026-11-03,`7a2f64a`,v5.0.11)。
  现象:`Existing shared skill source or external write footprint is unproven; refusing replacement.`
  组件**功能上是好的**:`~/.agents/skills/planning-with-files/` 内容完整(SKILL.md + scripts +
  templates),manifest 的 codex verify 也过。真正的根因不是「缺 receipt」,而是**顺序**:
  `src/installers/npxSkillInstaller.ts` 的拒绝分支跑在「是否已安装」判定**之前**,而
  `planning-with-files` 是唯一既没写 `--skill` 单选、也没声明 `installs_skills` 的
  npx-skill-installer manifest → codex 上被**无条件**拒绝,连"已装好了"都不问。
  解法(manifest 层,不碰另一会话正在改的 installer / receipt 文件):codex override 声明
  `installs_skills: [planning-with-files]`(该 repo 就是这一个 skill 目录,target set 可证)
  → 拒绝分支不再触发 → 组件判 already-installed。真机验证:codex 宿主 setup
  `0 failed` / exit 0,`install.ps1` 不再抛。回归护栏:manifest 契约测试 + installer 层用例。
  另一会话的「Manifest ownership declaration for GSD legacy adoption」仍在推进
  (`npmCli.ts` / `skillOwnershipReceipt.ts` / manifest schema),那条线解决的是
  **receipt 与 legacy adoption**,与本项不重叠,继续做即可。

## From the 2026-11-03 stop-hook-recover retirement (v5.0.11)

组件本体已在 v5.0.11 彻底删除(manifest / 运行时 / `harnessed stop-hook` 子命令 /
生成产物),但**识别用的 `stop-hook` 身份刻意保留**。用户裁定:保留 3 个月,之后移除,
移除动作列入计划。

- [ ] **`stop-hook` 身份在 2027-02-03 之后移除** — 待办(用户已排期)。
  身份在 `src/installers/lib/hookEntry.ts` 的 `COMPILED_HOOK_IDENTITIES` 里,现在只用于
  **识别**:teardown(`harnessedHookTeardown.ts`)靠它判定"settings.json 里这条注册是不是
  我们的",doctor 的 stale-hook 探针(`check-stale-hooks.ts`)也靠它报残留。
  为什么不能立刻删:旧装机(4.30.0–5.0.10 装过该组件的机器)`~/.claude/settings.json` 里
  还留着 `Stop` 注册,身份一删,`harnessed uninstall` 摘不掉它、doctor 也不再提示,
  用户只能手改 settings.json。
  窗口到期时的移除清单(一起做,别只删身份):
  - `src/installers/lib/hookEntry.ts` — 移除 `'stop-hook'` 身份条目;
  - `src/installers/lib/harnessedHookTeardown.ts` — 移除 legacy 形态字符串
    (`node …/bin/harnessed-stop-hook.mjs` / `"<binary>" stop-hook` / `assets/<ver>/…`);
  - `src/cli/lib/check-stale-hooks.ts` — 若还引用旧形态,一并清;
  - 测试:`tests/installers/harnessedHookTeardown*.test.ts`、`issue36-hook-identity.test.ts`、
    `tests/unit/installers-lib-hookEntry.test.ts`、`tests/cli/uninstall.test.ts`、
    `tests/cli/check-stale-hooks.test.ts`、`tests/cli/gc-compiled.test.ts` 里以
    `harnessed-stop-hook.mjs` 为样本的 legacy 断言;
  - CHANGELOG 记一笔,并在发版说明里提示:2027-02-03 之后仍带旧注册的机器需要手工清理
    `~/.claude/settings.json` 的 `Stop` 条目(或先跑一次 `harnessed uninstall`)。
  验收:移除后 `harnessed doctor` 不再报 Stop 残留、`harnessed uninstall` 不再误摘
    第三方同名 hook(左边界匹配已有防护,别破坏它)。

## From the 2026-11-03 v5.0.11 live install (本机 Windows)

- [x] **自动检测新版本并自动更新** — 已发(v5.0.13,Phase 84);**AC13 真机验收 2026-11-09 完成**,
  真机抓出 2 个 bug 已修(详见 `.planning/phases/84-auto-update/progress.md` 末节)。
  现状拆三块看:
  - **检测已有**:`update-reminder` SessionStart hook(`manifests/cc-hooks/update-reminder.yaml`)
    + `src/cli/lib/update-check-cache.ts` 的 **24h TTL 缓存**(`DEFAULT_UPDATE_CHECK_TTL_MS`);
    缓存命中时 hot path 不出网,无缓存才查(npm view / GitHub API,fail-soft,null 不入缓存)。
    `harnessed update --check` 同源。
  - **自动替换已有**:`runBinarySelfUpdate`(`src/cli/lib/selfUpdateBinary.ts`)是完整的自替换
    管线 —— 下载 → sha256 → **ed25519 签名校验**(合同级)→ `--version` 冒烟 → 同目录同卷
    rename(exec → .bak,temp → exec)→ 失败回滚 → `bin-backup/` 副本;成功后由**新 binary
    接管**刷新 skills/hooks(v5.0.8 的 owned-state handover)。
  - **缺的是自动触发**:update-reminder **只提醒不动手**,真正的自替换只在手动
    `harnessed update` 时发生。要补三件事:
    1. **consent 开关**:自动换 binary 是有副作用的动作,默认关;现成的
       `update-reminder-preferences.json` 加一个 `autoUpdate` 字段最省事。
    2. **调度**:不能发生在会话开始(阻塞),要放进 SessionStart 的后台 worker
       (`harnessed-update-reminder-worker.mjs` 已经在后台跑)下载,**下次会话前完成切换**。
    3. **慢链路策略**:本机 99MB 曾用 11 分钟(后来恢复到 27 秒),所以后台下载必须
       支持「慢慢下 + 失败重试 + 断点」,且下载中不占会话。v5.0.12 的流式落盘 + 进度行 +
       停滞守卫正是这件事的前提(不然后台下载既看不见也卡不住)。
  - 风险点:**切换时机**与**失败后用户状态一致性**(新 binary 没起来时旧 binary 要能回退)。

- [x] **binary 自更新在慢链路上失败,且报错信息指错了地方** — 已修(2026-11-03)。
  现象:本机 `harnessed update`(5.0.10 binary)报
  `could not reach GitHub releases to resolve the latest binary`;重跑一次则**挂住** 10 分钟以上。
  但同一时刻 `curl` / `node fetch` / `bun fetch` 都能正常拿到 `v5.0.11`,api.github.com
  也不限流(49/60 剩余)。真因不是「解析 release」失败,而是**资产下载太慢**:
  `harnessed-windows-x64.exe` 有 **103,795,200 字节(≈99MB)**,实测 `curl` 拉完用了
  **660 秒**(≈157 KB/s)—— 而且旧实现是 `res.arrayBuffer()` **整块进内存再落盘**,所以
  下载期间磁盘上看不到临时文件、屏幕上也毫无输出,看着像挂死;metadata 跳的 10 s 超时
  在这种链路上也会误报成「无法访问 GitHub releases」。
  修法(`src/cli/lib/selfUpdateBinary.ts`):metadata 预算 10 s → **30 s**;失败**分阶段**
  报错(timeout / network / HTTP 状态 / 解析失败各一条),「release 还在发布中」那句提示
  只留给真正属于发布中��那种;资产改为**流式落盘**(99MB 不再整块进内存,下载期间能看到
  临时文件与进度行),**停滞守卫** 120 s 无数据即中止并报「已收字节数 + 用时 + 平均速率」,
  进度行每 60 s 一行(11 分钟 ≈ 11 行)。新增测试 13 条
  (`tests/cli/lib/selfUpdateBinary-stream.test.ts`)。
  本机绕过方式(当时已用):`curl -L` 拉 asset + `sha256sum` 对 `.sha256` 校验 → 覆盖
  `~/AppData/Local/harnessed/bin/harnessed.exe`(旧版留 `harnessed.exe.bak-5.0.10`)→
  跑 `harnessed setup` 刷新自有状态。
- [ ] **binary 体积 99MB** — 未立项。windows asset 实测 103,795,200 字节;内嵌 assets /
  bun runtime 各占多少、能否瘦(例如 assets 改为运行时按需解包)值得单独立项。
- [x] **doctor 的「双通道并存」告警会假阳性** — 已修(2026-11-03)。
  现象:本机其实**只装了 binary 通道**(npm 全局前缀 `C:\Users\easyi\AppData\Roaming\npm`
  下没有 `harnessed.cmd`,`npm ls -g` 也没有 harnessed),但 doctor 仍报
  "both harnessed install channels are present"。
  根因:`src/cli/lib/check-install-channels.ts` 的
  `npmPresent = running === 'npm' || (npmCand != null && exists(npmCand))` ——
  **运行通道默认视为存在**,所以只要是从源码树 / npm 渠道跑的(`node dist/cli.mjs`),
  就一定报「双通道」,哪怕磁盘上根本没有 npm 全局 shim。
  修法:通道**存在性一律按磁盘判定**(npm shim / binary 文件是否真的在),`running` 只用于
  文案;单通道那行也改成报**磁盘上真实存在**的通道名(源码树运行时不再自称 npm 通道,
  一个都没装时明说 "no install channel on disk")。真机验证:源码树与 binary 两侧都是
  `✓ install channel — single channel (binary)`。
