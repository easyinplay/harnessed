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
- [ ] **AGENTS.md 同源生成** — P3 / M(CC: ~1h)
  Why: `~/.codex/AGENTS.md` 手抄 CLAUDE.md 已漂移(ralph-loop / TeamCreate / zoom-out)。只写 AGENTS.md 标记区间,
  opt-in,dry-run diff,uninstall 往返,永不写 CLAUDE.md。Trigger: 同上。Depends: Phase 2 渲染器。
- [ ] **gemini 宿主 milestone** — P2 / L(CC: ~4h)
  Why: 复用 codex milestone 收敛出的 HostAdapter 契约加第三宿主。先实测 gemini hook / subagent / skills 目录。
  Criterion: 实际用不用(design doc 2026-08-26 OQ4)。Depends: codex 宿主对等 milestone 收口。
- [ ] **codex goal 桥接** — P3 / M,Phase 66 裁定移出(2026-09-29)
  Why: SPEC 的 Phase 66 列了它,但仓库里 goal 是**被删掉的东西** —— ADR-0036 曾引入三级完成保证链
  (ralph-loop plugin → 宿主原生 `/goal` → self-loop),**ADR-0039 在 4.43.0 整档 supersede 并删除**,
  删除理由之一正是「tier 2(原生 `/goal`)从未被实证」(`docs/adr/0039-*.md:27`)。codex 侧的可见性同样未实证,
  在实测之前重新引入等于重犯同一个错。已知事实:`thread/goal/set` 经 app-server 写入**跨进程持久**
  (Phase 63-64 期间实测过),但**运行中的 TUI 能否即时感知未知** —— 这是整条路的成立前提。
  **Trigger(需维护者实测,只有你能做)**:
    1. 开一个 codex TUI 会话,记下它的 thread id(`codex agents` 可列出会话;或 TUI 内查看)。
    2. 另开一个终端,用 app-server 的 JSON-RPC 对**那个 threadId** 调 `thread/goal/set`
       (握手与调用形状见 `src/installers/lib/codexHookTrust.ts:1-17` 的协议注释 + `spawnCodexAppServer`;
       Phase 64 已验证 `initialize` → `initialized` → 具体方法 这条链可用)。
    3. 回到那个**仍在运行**的 TUI,不重启、不新开 turn,看 goal 是否已出现/生效。
    4. 若不可见,再试「设完之后在 TUI 里发一条消息」,区分「完全不可见」与「下一 turn 才生效」。
  Criterion: 步骤 3 或 4 可见 → 值得立项(那时需要一份新 ADR 说明为何推翻 0039 的相关部分);
  完全不可见 → 记显式降级并永久关闭此项。Depends: 无(可随时测)。
- [ ] **README 表述更新(v16.0 宿主对等)** — P2 / S,Phase 66 T6 推迟
  Why: T6 交付了 `docs/` 下的 HostAdapter 契约,但 README 体系(root + 9 个镜像)在做 Phase 66 时
  **正被另一个会话改动**(10 个文件 untracked-modified),按共享工作树纪律不碰。
  Trigger: 那批 README 改动落地后,把「codex 宿主支持到什么程度」的表述对齐到 `docs/` 的契约文档,
  10 个镜像同步。注意 `check-provenance` 与 i18n 对等门。
- [ ] **MCP 注册探测仍读 `~/.codex/config.toml` 全文** — P2 / S,Phase 64 R6 明确推迟、Phase 66 T6 复核确认
  Why: `isMcpServerRegistered`(`src/installers/lib/readClaudeConfig.ts:111-124`)在 codex 上
  `readFile(platform.mcpConfigPath)` 把**整个** config.toml 读进进程内存,再做 `[mcp_servers.<name>]`
  段头匹配。该文件含明文 `experimental_bearer_token`,所以凭据行会经过内存(不被提取、不被打印,
  但确实进过进程)。Phase 64 的 R6 已把**插件**探测迁到 `codex plugin list`,当时明确把 MCP 探测留到后面。
  这也造成一处文档张力:ADR 0041 § Context 3 写「不写也不读 config.toml」,而 ADR 0040 § Decision 4
  有意保留 `mcpConfigPath` 做 MCP 探测 —— `docs/host-contract.md` §5.1 已把口径校正为
  「不写;保留一处窄读;写是 `codex mcp add` 干的」。
  Fix: 迁到 `codex mcp list` 的输出(与 Phase 64 迁插件探测同一手法),之后 `mcpConfigPath` 可整个退役,
  「不读 config.toml」才真正成立,ADR 张力随之消解。
  Trigger: 下一次碰 codex MCP 安装路径时顺手做;或安全审查提出时优先。
  **2026-09-30 收窄**:v16.0 收口审计发现同一文件还有一条**复制**面 —— `mcp-stdio-add` / `mcp-http-add`
  把它列进了 backup plan,`backup()` 会逐字节复制,凭据在 `~/.harnessed/backups/` 下多出一份。
  那条已在 4.46.0 修掉(两条反证测试)。**剩下的只有这处窄读**,本项范围不变。
- [ ] **codex 上 plugin 类能力全告警** — P2 / S,Phase 65 findings F8
  Why: codex descriptor 的 `pluginsRegistry: null` → `readInstalledPlugins` 返回空集(不读 fs),于是每个
  `install_type: plugin` 的 capability 在 codex 上都告警「backing missing」。`planning-with-files` 这类
  上游在 codex 上确实装不了,所以告警不算假阳性,但**逐条刷屏**且没给用户任何可执行出路。
  与之配套的 Phase 65 裁决 D5:`Claude Code plugin` 字样刻意保留在正文里,由 codex 映射小节的 caveat 说明
  「这类组件在本宿主并未安装,遇到就记 skip」。真正的修法在能力层(聚合告警 + 明确 skip 语义),不在措辞。
  Trigger: 维护者在 codex 上真跑一次 setup 并觉得告警噪音碍事。
- [ ] **codex 上 subagent prompt 拿不到语言指令** — P3 / S,Phase 65 findings F8
  Why: codex descriptor `supportsEnvKeyWrite: false` → `HARNESSED_USER_LANG` 从不写 →
  `buildLanguageSection` 返回空 → 整个 `## Language` 节在 codex 上不出现。副作用:
  `disciplines/language.yaml` 的 `preserve-english-categories` 也随之不渲染。Phase 65 仍然把它原语化了
  (不拿一个待修缺陷当豁免理由),所以这里修好后无需回头改正文。
  需要先定 codex 上语言偏好存哪(不写 `config.toml` 是硬边界)。
- [ ] **en 安装在 skills 目录留一份带未解析占位符的 zh 副本** — P3 / S,Phase 65 findings F11
  Why: `renderSkillTemplates.ts` 在 en 安装时只渲染并写 `SKILL.md`,`SKILL.zh-Hans.md` 以 `cp` 原样留下、
  不渲染也不删除。Claude Code 只读 `SKILL.md`(官方加载契约)所以无人读到,无实际危害,但不干净。
  两个候选:en 安装也剥除该 sibling,或也渲染它。改的是安装产品行为,故未并入 Phase 65。
  注意 `renderSkillTemplates.test.ts` 有一条断言锁着「en 侧必须有 zh 兄弟」这一当前行为。
- [ ] **`check-host-primitives` 未覆盖生成命令体(S2)** — P3 / S,Phase 65 T11 交回
  Why: 该面是 TS 模板字面量,门要扫它就得先 build。现有覆盖是
  `tests/cli/generateCommandsGolden.test.ts` 的 codex sanity 块(断言无 `~/.claude/` / `CC-native` /
  `AskUserQuestion`),**不是**门的完整 token 表。补法很便宜:在 `tests/scripts/` 加一个 test,
  import `generateCommandFile` + 复用门导出的 `scanCcTokens` / `MASKS`,对 codex bodies 跑同一套判据。

## From /plan-ceo-review 2026-07-12 (B5 Phase 3 Slice 1 — CEO plan: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-12-b5-phase3-slice1.md`)

- [ ] **E1 二进制签名(Windows Authenticode + macOS notarization)** — P2 / L(CC: M + 证书采购)
  Why: 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,安装器体验最大摩擦源。
  Depends: **用户拍板证书采购** — 决策清单已备:`docs/e1-code-signing-options.md`(4.32.20,三档预算 + 三个拍板问题)。
  注意:与 4.32.19 更新通道 ed25519 资产签名(review #12)是两回事,后者已落地。
- [ ] **E3 channel-aware update(stable/beta)** — P3 / M(CC: S-M)
  Why: Trellis 模式的预发订阅。Blocked by: 发布节奏尚无 beta 轨道(预发 tag 约定 + publish.yml 分轨先行)。
- [x] **`harnessed update --rollback`** — SHIPPED 4.32.20:`runBinaryRollback`(同款 rename dance,被换下的二进制先 bank 回 bin-backup/<curver>/ 保可逆;`--rollback [version]`,缺省取最高 banked 版;npm 模式明确拒绝导向 `npm i -g`)。
- [ ] **undici EnvHttpProxyAgent 代理支持** — P3 / S
  Why: 受限网络下 update 下载不走系统代理。等真实用户信号;当前以可操作报错 + npm 渠道兜底。
- [ ] **Slice 2:curl/PowerShell 一行安装器** — P1(本切片发布后紧跟,OV1 裁决"不拖")
  Why: 创造二进制用户群;消灭 Node 22 前置。Depends: 资产命名契约(已冻结)+ per-asset .sha256(Slice 1 交付)。
- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P3(2026-07-12 降级,用户裁决)
  Why: esbuild/Biome 模式。价值质疑:npm 用户必有 Node(包是纯 JS 本就能跑),二进制用户已有一行安装器;
  收益仅剩启动速度,代价是 4 个 npm 包的发布管线/版本锁/launcher shim 维护面。等真实需求信号再启。
  Depends: Slice 1/2(已发)。

## Gate semantics

- [ ] **ADR-0038 第三类:对缺失/null 成员用 `in` 落 fail-SOFT** — P2(4.32.23 spike 实测发现)
  `'x' in subtask.missing` 抛的是 `Cannot read properties of undefined (reading 'length')`,
  不匹配 `isUndefinedVariableError` 的 `/undefined variable/i`(`src/workflow/exprBuilder.ts:44-46`)
  → 落 ADR-0029 fail-soft,子项照 fire。目前无 judgment 用数组 fact 故未触发;
  引入任何数组 fact 前必须先把正则收口到 fail-closed(ADR-0038 的「静态配置漂移」理由同样成立)。
  证据:`.planning/phases/51-ecc-orchestration/findings.md` F7。

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
