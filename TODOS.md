# TODOS

> Deferred work with context. Source of each entry = a review decision (linked). Do not
> inline into ROADMAP/STATE (doc discipline: one fact one home).

## From /plan-ceo-review 2026-09-22 (codex 宿主对等 — CEO plan: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-09-22-codex-host-parity.md`)

- [ ] **跨宿主接力(CC ⇄ codex workflow 认领)** — P3 / L(CC: ~4h)
  Why: CC 额度耗尽时切到 codex 接着跑同一 leaf。设计已裁定:账本迁共享中立根(非 `~/.harnessed`,候选 XDG
  `$XDG_STATE_HOME/harnessed` / Windows `%LOCALAPPDATA%\harnessed`),复用 proper-lockfile;显式
  `harnessed checkpoint adopt [--from claude|codex]`,无隐式回退(防 issue #10 串槽);迁移并存 + 撞 key 加
  conflict 后缀,零覆盖。需 ADR 推翻 v9.0 28-CONTEXT「不做跨平台状态迁移」。
  Trigger: 维护者在 codex 里真跑 ≥3 次长活并有记录。Depends: codex 宿主对等 milestone Phase 1。
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

- [ ] **gemini 宿主 milestone** — P2 / L(CC: ~4h)
  Why: 复用 codex milestone 收敛出的 HostAdapter 契约加第三宿主。先实测 gemini hook / subagent / skills 目录。
  Criterion: 实际用不用(design doc 2026-08-26 OQ4)。Depends: codex 宿主对等 milestone 收口。
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

- [ ] **README 表述更新(v16.0 宿主对等)** — P2 / S,Phase 66 T6 推迟
  Why: T6 交付了 `docs/` 下的 HostAdapter 契约,但 README 体系(root + 9 个镜像)在做 Phase 66 时
  **正被另一个会话改动**(10 个文件 untracked-modified),按共享工作树纪律不碰。
  Trigger: 那批 README 改动落地后,把「codex 宿主支持到什么程度」的表述对齐到 `docs/` 的契约文档,
  10 个镜像同步。注意 `check-provenance` 与 i18n 对等门。
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

- [ ] **E1 二进制签名(Windows Authenticode + macOS notarization)** — P2 / L(CC: M + 证书采购)
  Why: 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,安装器体验最大摩擦源。
  Depends: **用户拍板证书采购** — 决策清单已备:`docs/e1-code-signing-options.md`(4.32.20,三档预算 + 三个拍板问题)。
  注意:与 4.32.19 更新通道 ed25519 资产签名(review #12)是两回事,后者已落地。
- [ ] **E3 channel-aware update(stable/beta)** — P3 / M(CC: S-M)
  Why: Trellis 模式的预发订阅。Blocked by: 发布节奏尚无 beta 轨道(预发 tag 约定 + publish.yml 分轨先行)。
- [x] **`harnessed update --rollback`** — SHIPPED 4.32.20:`runBinaryRollback`(同款 rename dance,被换下的二进制先 bank 回 bin-backup/<curver>/ 保可逆;`--rollback [version]`,缺省取最高 banked 版;npm 模式明确拒绝导向 `npm i -g`)。
- [ ] **undici EnvHttpProxyAgent 代理支持** — P3 / S
  Why: 受限网络下 update 下载不走系统代理。等真实用户信号;当前以可操作报错 + npm 渠道兜底。
- [x] **Slice 2:curl/PowerShell 一行安装器** — **已发,本条目过期**(2026-10-07 对账补勾)。
  按产物核实而非凭记忆:仓库里有 `install.sh` / `install.ps1`,CHANGELOG 记着
  「B 路线 Phase 3 Slice 2:一行安装器」交付(含 unix `~/.local/bin/harnessed` 与 Windows
  `%LOCALAPPDATA%\harnessed\bin\harnessed.exe` 两条落位),之后还有两次 dogfood 修复
  (PATH 遮蔽导致 setup 跑到旧那份)。下方 Slice 3 的 Depends 行也早已写「Slice 1/2(已发)」。
  一个实际已发的 **P1** 挂在队首会扭曲优先级,这正是「状态从产物派生」要防的漂移。

- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P3(2026-07-12 降级,用户裁决)
  Why: esbuild/Biome 模式。价值质疑:npm 用户必有 Node(包是纯 JS 本就能跑),二进制用户已有一行安装器;
  收益仅剩启动速度,代价是 4 个 npm 包的发布管线/版本锁/launcher shim 维护面。等真实需求信号再启。
  Depends: Slice 1/2(已发)。

## Gate semantics

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

## Earlier deferrals (intel 回填表镜像,详 .planning/intel/omc-comparison.md)

- [x] **B4 eval harness** — Slice A SHIPPED 4.31.0(trap suite + coverage 导航;B1 证据包 SHIPPED(逮住 issue #7);Slice C 录制导出 SHIPPED 4.32.0(harnessed eval record,默认脱敏,round-trip);后续差异化实验需另一形态(模糊 spec/跨 session))
- [x] **SOP 文本 `--skip-sub clarify` 改名 `discuss`** — SHIPPED 4.32.20:generator(generateCommands + rewrite-skill-invoke-sections)+ 全部 workflows/*/SKILL{,.zh-Hans}.md 改 `--skip-sub discuss`;engine 侧 clarify→discuss synonym 保留(兼容已装旧文本)。
- [ ] **G5/OMC ambiguity 量化阈值** — P3,方向级设计,v5+ discuss
