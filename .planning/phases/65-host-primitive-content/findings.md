# Phase 65 findings —— 开工前实测与链路摸底(2026-09-24)

## F1 交付面是三面,不是一面(SPEC 只算了其中一面的 236 处)

| 面 | 产物 | claude 目标 | codex 目标 | 生成方式 |
|---|---|---|---|---|
| S1 skills | `workflows/**/SKILL.md` | `~/.claude/skills/<flat>/` | `~/.agents/skills/<flat>/` | 原样 `cp`(`src/cli/setup.ts:478`)后就地渲染 |
| S2 commands | `/<name>` 命令体 | `~/.claude/commands/<x>.md` | `~/.codex/prompts/<x>.md` | **完全合成**(`src/cli/lib/generateCommands.ts:288-318`) |
| S3 runtime prompt | subagent prompt | 进程内字符串 | 同 | `src/cli/prompt.ts:296-305` + `src/workflow/run.ts:204-241` 从 `role-prompts.yaml` / `capabilities.yaml` / `disciplines/` / `defaults.yaml` 组装 |

SPEC 的「57 文件 236 处」只覆盖 S1 的正文与 S3 的数据源。**S2 的 CC 原语是 TS 字面量**,不在计数内,
但它正是 codex 用户敲 `/<name>` 时读到的正文,且已知引用 `~/.claude/rules/agent-teams.md`
(`generateCommands.ts:212`)与 `~/.claude/skills/<name>/SKILL.md`(`:263`)——codex 上这两条路径都不存在。
**结论:S2 必须纳入 Phase 65**,否则「正文不再指挥调用不存在的工具」这一 phase 目标不闭合。

## F2 渲染钩子已经存在,不需要新引擎

`src/cli/lib/renderSkillTemplates.ts:104` 是 S1 唯一的正文写入点;它已经在做
`{{ capabilities.<x>.cmd }}` 的查表替换(`src/cli/lib/capabilityResolver.ts:212,230-254`)。
宿主原语替换挂在同一个点即可,**不新造模板引擎**。

注意 `src/workflow/interpolate.ts:11,26-28` 是另一套严格 `\w+` 的插值器(用于 `invokes`),
点号占位符会触发 `InterpolationError` —— 新语法不能走这条路径。

## F3 claude 不读 `~/.agents/skills`,两侧渲染产物天然隔离

Claude Code 官方 skill 加载位置只有 `~/.claude/skills` / `.claude/skills` / `--add-dir` / 插件目录
(code.claude.com/docs/en/skills.md「Skill Loading Locations」),**不含 `~/.agents/skills`**。
codex 则从 `$HOME/.agents/skills` 读(learn.chatgpt.com/docs/build-skills,含 repo/admin/system 多级)。
→ SPEC 担心的「共享目录串扰」对 CC 不成立;claude 渲染仍可走逐字节金标。
**残留风险(记录,不在本 phase 处理)**:`~/.agents/skills` 是跨工具约定目录,codex 渲染版可能被
第三方 agent 工具读到。缓解手段是在 codex 渲染产物里插入宿主标记小节(见 R4)。

## F4 codex 的多 agent 原语齐全,不需要「退化为顺序执行」

本机 `codex features list`:`multi_agent = stable true`、`multi_agent_v2 = stable false` →
**v1 生效**。工具名取自上游 `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`:

| 概念 | claude | codex(v1) |
|---|---|---|
| spawn 子 agent | Task / Agent tool | `spawn_agent`(~~`task_name`~~, `message`)——**本行的参数名写错了,见 F14 更正**;v1 实为 `agent_type` / `message` |
| 给已有 agent 发消息 | `SendMessage` | `send_input`(`target`, `items`, `interrupt`) |
| 追加任务 | —— | `followup_task`(v2 spec) |
| 等待完成 | ——(CC 无) | `wait_agent` |
| 列出 | ——(CC 无) | `list_agents` |
| 关停 | 「ask the <name> teammate to shut down」 | `close_agent` |
| 恢复 | —— | `resume_agent` |
| 编队 | Agent Teams(首个 spawn 隐式成团) | 多次 `spawn_agent`(v1 在 namespace 下) |

`codex exec --ephemeral --json -o <file>` 是进程侧 spawn,属 Phase 66,不在本 phase 正文范围。

**未实测因而不得写进正文的事实**:codex agent 的生命周期语义(是否 session-scoped、退出是否自动清理、
能否嵌套)。codex 版段落只使用上表已验证的工具名与参数,不复制 CC 的生命周期承诺。

## F5 codex 命令交付形态:skill 为主,prompts 仍保留

- codex skills 目录 = `$HOME/.agents/skills`(已是 `src/platform/platform.ts:133` 的 codex `skillsDir`)。
- `~/.codex/prompts/<name>.md` → `/<name>` slash 命令仍可用,但 OpenAI 已声明
  "custom prompts are deprecated in favor of skills"(developers.openai.com/codex/custom-prompts)。
- 本机 `~/.codex/prompts` 不存在(SPEC 的观察属实),但 `src/platform/platform.ts:134` 已把它定为
  codex `commandsDir`,`setup.ts:551` 会创建并写入。
- **决定**:维持现状(两面都交付),两面都做原语化。不在本 phase 讨论废弃 prompts。

## F6 236 处不是同一类,必须先分类再改

按上下文去重后,`Task / Agent`(103)里 96 处来自 6 句固定模板(24 + 19×3 + 5×3),
说明它们由 `scripts/rewrite-skill-invoke-sections.mjs`(574 行,SKILL「如何调用」段的 SoT)渲染。
**改这 96 处 = 改一个生成器的 builder 再重跑**,不是 96 次手改。该脚本自带纪律警告:
「Never hand-edit a rendered invoke section: change the builder here and re-run」(`:26-28`)。

三类分法(实施按此归档,逐处标注):

- **A 类 术语/指令**(正文指挥模型用某工具)→ 占位符化。
- **B 类 能力注册**(`capabilities.yaml` 的 `impl` / `cmd` 字段,如 `agent-teams-create — impl: claude-platform,
  cmd: Agent(name, run_in_background=true)`)→ **不占位符化**;改为补 codex 侧能力条目,由
  `capabilityResolver` 按宿主选。这是注册表事实,不是措辞。
- **C 类 散文/历史说明**(如「`harnessed run` … bypasses Agent Teams and hangs inside Claude Code」×5 en + 5 zh)
  → 整段变体(见 R3),因为该事实在 codex 上不成立。

## F7 门与金标现状

- `scripts/check-skill-i18n-parity.mjs:56-65` 已经做「`{{ capabilities.X }}` 占位符集合双向精确相等」——
  新占位符必须纳入同一集合检查,否则 en/zh 占位符漂移无人守。
- 9 个 `check-*.mjs` 全在 `ci.yml` 的 `test` job;dep-free 的插在 `:177` 之后,需依赖的插在 `:203` 之后。
  新门要动:`scripts/check-host-primitives.mjs`(NEW)+ 可能的 `.d.mts` + `ci.yml` + `tests/scripts/` 单测。
- 既有内容门 `tests/unit/skill-invoke-parity.test.ts` 已在扫 `workflows/**/SKILL*.md` 做禁词 + 必需 token 断言
  (`:23` FOOTGUN、`:37` REQUIRED_TOKENS)——占位符化会改变这些 token 的字面形态,**该测试必须同步更新**,
  否则本 phase 一动就红。
- 渲染产物金标已有先例:`tests/cli/renderSkillTemplates.test.ts`(en 且无 zh 兄弟时 dest `SKILL.md` 逐字节不变)。
- eval golden = `fixtures/eval/<scenario>/{scenario.yaml,golden.json}`,11 个 scenario,
  CI 仅 ubuntu 跑 `node dist/cli.mjs eval --dir fixtures/eval`(`ci.yml:269-271`)。

## F7b S2 的改动面已量清:6 处正文字面量

`src/cli/lib/generateCommands.ts` 内 12 行命中里,注释占 5-6 行,真正进产物的是:
`:89`(spawn 一句)、`:190`(orchestrator 抬头)、`:212`(**Agent Teams 整段**,含「隐式成团 / `team_name` 被忽略 /
session 退出自动清理 / 无 teardown 工具」四条 CC 专属事实)、`:221`(为何不用 `harnessed run`)、
`:252`(execution 抬头)、`:263`(sister SKILL.md 路径 `~/.claude/skills/...`)。

其中两处引用在 codex 上指向不存在的东西:
- `~/.claude/rules/agent-teams.md`(`:212`)——用户私有规则文件,codex 侧无对应物。
  **决定**:codex 变体不引用外部文件,改为内联要点,且只写 F4 已验证的工具名与参数。
- `~/.claude/skills/<name>/SKILL.md`(`:263`)——codex 侧应为 `~/.agents/skills/<name>/SKILL.md`;
  该路径应由 `getSkillsDir()` 派生而非字面量。

`:212` 整段是 C 类的典型:逐 token 替换会把四条 CC 事实伪装成 codex 事实。整段入表。

## F9 `disciplines/language.yaml` 是渲染面,但在 codex 上当前不渲染(两条事实叠加)

台账第二轮发现 `prompt.ts:192-208` 的 `loadPreserveCategories` 会把
`workflows/disciplines/language.yaml` 的 `preserve-english-categories` 规则 description
逐行解析进 subagent prompt 的 `## Language` 节 —— 已复核属实(`prompt.ts:186-209`)。

但与 F8 叠加后有个反直觉结论:codex 上 `supportsEnvKeyWrite: false` → `HARNESSED_USER_LANG` 从不写
→ `buildLanguageSection`(`prompt.ts:217-218`)返回空字符串 → **整个 `## Language` 节在 codex 上不出现**,
该文件里的 CC token 也就不会进 codex 产物。

**决定:仍然原语化**(成本低),不依赖「一个待修缺陷的当前行为」作为豁免理由。若日后 F8 的语言指令
缺失被修好,这里无需回头再改。

## F10 全角 / 半角标点在 repo 内两套并存(影响 claude 值的逐字还原)

`task/deliver` 与 `verify/multispec` 的 **zh SKILL 正文用全角 `，（）；`**,而生成器渲染出来的 zh 段用半角。
同一仓库两套并存,是既有事实。词表里 3 个 key 因此在首稿金标红,已按站点原文分别取值。
**不在本 phase 统一标点**(统一会改 claude 金标)。

## F11 金标口径:en 安装下未渲染的 locale sibling 不该进字节锁

批 A 改写后 claude×en 金标红在 **恰好 29 个 `*/SKILL.zh-Hans.md`** 上(一个不多一个不少),
而 29 个渲染后的 `SKILL.md`、全部 `workflow.yaml`、claude×zh-Hans 整份、codex sanity 全绿;
另一条独立证据:58 个文件按 claude 渲染后与 `git show HEAD:` 逐字节对比 `0 differ`。

原因:`renderSkillTemplates.ts:135,153` —— en 安装时只渲染并写 `SKILL.md`,
`localeBodySelected === false` 于是 `SKILL.zh-Hans.md` 以 `cp` 原样留在安装目录,不渲染也不删除;
而金标的 `hashTree` 哈希安装目录下每一个文件。

**裁决:改金标口径,不改产品行为。** 金标锁的是「宿主实际会读到的内容」,Claude Code 只读 `SKILL.md`
(官方 skill 加载契约,F3),那份 zh 副本是死副本。codex sanity 断言的口径须同步统一,不留不对称的门。
`renderSkillTemplates.test.ts:170`「en 侧必须有 zh 兄弟」保留(它锁产品行为),只是不纳入字节锁。

**副作用记 TODO(本 phase 不修)**:en 安装会往 `~/.claude/skills/<name>/` 丢一份**带未解析占位符**的
`SKILL.zh-Hans.md`。无人读取因而无实际危害,但不干净。后续可选:en 安装也剥除 sibling,或也渲染它。

## F12 marker 版本号与逐字节金标的结构性冲突

`scripts/rewrite-skill-invoke-sections.mjs` 的 marker 字符串**是产物的一部分**,所以 bump `NEW_MARKER`
必然改掉 58 个文件的 hash —— 与「claude 产物逐字节不变」直接冲突。

**裁决:Phase 65 不 bump**(批 A 用「临时 bump → 重跑 → 改回 → 再重跑」得到正确终态:产物含占位符、
marker 字节不变)。定调写进该脚本注释:marker 版本号不是用户可见措辞,将来确需 bump 时允许重录 claude
金标,**但必须在同一 commit 内用 diff 证明「除 marker 行外零差异」**,否则重录就是在掩盖回归。

## F13 en 与 zh 的 `host.*` 占位符集合**故意不相等**

en 正文用 `spawn_subagent.default` / `.plural`,zh 正文用 `.zh_tool` —— 词表设计使然(中英行文形态不同)。
**T12 把 `host.*` 纳入 `check-skill-i18n-parity` 时不能简单比 variant 集合相等**,否则必红;
正确判据待定(候选:比 primitive 集合而非 variant 集合)。

## F8 顺带发现(不在本 phase 修,记 TODO)

- codex 上 `pluginsRegistry: null`(`platform.ts:135`)→ `readInstalledPlugins` 返回空集
  (`capabilityResolver.ts:86-87`),于是**每个 `install_type: plugin` 的能力在 codex 上都告警**。
- codex 上 `supportsEnvKeyWrite: false` → `HARNESSED_USER_LANG` 从不写 → `buildLanguageSection`
  (`prompt.ts:217-218`)返回空,**codex subagent prompt 拿不到语言指令**。
- `setup.ts:567` 的 `loadRolePrompts()` 未显式传 locale,落到 `rolePrompts.ts:44` 的默认参数,
  与同函数上游显式线程下来的 locale 不同源(当前行为一致,属隐患)。

## F14 更正:codex spawn 原语的参数签名(2026-09-29)

**这是事实更正,不是措辞调整。Phase 65 写错了,发版前在此改掉。**

### 原先写的是什么

Phase 65 把 codex 的 spawn 原语一律写成 `spawn_agent(task_name, message)`,并据此在四处写了
**带具名实参**的指令:`spawn_agent(task_name: <sub>, message: …)` /
`spawn_agent(task_name: <specialist>, message: <brief>)`。

### 为什么错

读上游时把 **v2 的签名当成了 v1**。`codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
有两个构造函数:

- `create_spawn_agent_tool_v1` —— properties 来自 `spawn_agent_common_properties_v1`(含
  `agent_type`),`required: None`,**没有 `task_name`**。
- `create_spawn_agent_tool_v2` —— 才加 `task_name`,`required: ["task_name", "message"]`。

本机 `codex features list`:`multi_agent` = stable/**true**,`multi_agent_v2` = stable/**false**
→ **v1 生效**。Phase 65 的词表注释里已经写了「`multi_agent` stable/true → v1 生效」,却配了 v2 的
签名 —— 两句话自相矛盾,当时没有交叉核对。

### 正确的是什么

**`spawn_agent(agent_type, message)`。** 三重依据:

1. **源码**:上述两个构造函数的 properties / required 差异。
2. **本机 feature flag**:`multi_agent_v2` stable/false,v2 签名不生效。
3. **实测**(Phase 66 T0.4,真跑 `codex exec`,见
   `.planning/phases/66-codex-spawn-agents-goal/findings.md` F8):模型明确报告
   「`task_name` 参数在我手上的 `spawn_agent` 工具 schema 中不存在」;同一轮实测里用
   `agent_type: "<role name>"` 成功引用了 `~/.codex/agents/` 里的 agent role,
   role 的 `developer_instructions` 真的进了子 agent 的上下文。

### 语义差异(为什么不是把 `task_name` 换成 `agent_type` 就完事)

`agent_type` 是**角色名**,必须对应 `~/.codex/agents/<x>.toml` 里的 `name`;传一个不存在的值,
工具层直接报 `unknown agent_type '<x>'`、不创建 agent(F8 第 4 点)。而原文里
`task_name: <sub>` / `task_name: <specialist>` 是拿 **sub-workflow 名 / specialist 名**当任务标签
用的 —— harnessed 今天并不往 `~/.codex/agents/` 写这些 role(那是 Phase 66 尚未落地的工作)。
所以机械替换成 `agent_type: <sub>` 会把一条**必然报错**的指令写进产物,比原来的错误更糟。

四处带具名实参的句子因此**改写成不依赖该参数的说法**:调 `spawn_agent(message: …)`,
把 sub / specialist 名写进 `message`,并在同句点明「`agent_type` 选的是 agent role 不是任务标签」。
纯签名陈述(注释、`capabilities.yaml` 的 `cmd`、checklist)才做 `task_name` → `agent_type` 的直接替换。

### 影响面(已改)

| 面 | 内容 |
|---|---|
| `workflows/capabilities.yaml` | `agent-teams-create.by_host.codex.cmd` |
| `workflows/host-primitives.yaml` | 文件头签名注释 / `teams_step_note` 的 `default`+`command` 两个 codex 变体 / `multispec_spawn_note.default` codex / 该节注释 / `multispec_spawn_note.checklist` codex |
| `workflows/host-primitives.zh-Hans.yaml` | 同上 6 处 |
| `tests/unit/capability-resolver.test.ts` | cells 27/28 fixture + cell 34 对 shipped yaml 的断言(3 处) |
| `tests/eval/fixtures.test.ts` | codex golden 的 capability-cmd spot-check |
| `tests/cli/generateCommandsGolden.test.ts` | codex `auto.md` 断言改为 `spawn_agent(message:`,并新增 `not.toContain('task_name')` 回归闸 |
| `tests/scripts/host-primitives-gate.test.ts` | 合成 CAPABILITIES fixture |
| `CHANGELOG.md` | `[Unreleased]` 两处 |
| `fixtures/eval/host-render-codex/golden.json` | 用 `eval --update-golden` 重录(2 行) |

**claude 侧零改动**:三份渲染金标(skills / 命令体 / `harnessed prompt`)与
`fixtures/eval/host-render-claude/golden.json` 均零差异 —— 本次只动 codex 列。

### 复核办法(给后来人)

```bash
codex features list | rg multi_agent               # v2 必须仍是 stable/false
rg -n 'task_name' workflows/ tests/ CHANGELOG.md   # 应无命中
```

若哪天 `multi_agent_v2` 变成 stable/true,`task_name` 才重新成立 —— 那时要连同 `required` 的变化
一起重写,而不是把这一节改回去。
