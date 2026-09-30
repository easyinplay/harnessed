# HostAdapter 契约 — Claude Code / codex 宿主差异参考

> **这是一份契约 / 参考,不是历史。** 它回答「同一份 harnessed 装到 Claude Code 和 codex 上,
> 各自发生什么」,好让后来人不必去翻四个 phase 的 findings。
>
> 覆盖范围:v16.0 Phase 63-66 积累的宿主差异。
> 历史指针(叙事在那儿,不在这儿):`.planning/phases/{63-platform-detection-refactor,64-codex-hooks-plugin,65-host-primitive-content,66-codex-spawn-agents-goal}/`。
> 决策来源:[ADR 0040](./adr/0040-host-detection-precedence.md)(宿主判定)、
> [ADR 0041](./adr/0041-codex-hooks-via-local-plugin.md)(codex hooks 承载与信任)。
>
> **真相源优先级**:代码 > 本文件。每个断言带 `文件:行` 或 ADR 编号,读者应能逐条复核;
> 发现本文件与代码冲突,以代码为准并修本文件。
> §4 的原语对照表是**派生产物**,不要手抄维护 —— 派生方式见该节。

---

## 1. 宿主判定优先级(ADR 0040)

`detectPlatform()` 的六级链,自上而下首个命中即返回
(`src/platform/platform.ts:173` 入口 / `:180-222` `resolveHost` 实现;ADR 0040 § Decision):

| # | 判据 | 命中结果 | 代码 |
|---|---|---|---|
| 1 | `HARNESSED_PLATFORM=<id>` env(也是 `setup --platform` / `doctor --host` 进入进程的通道) | 该 descriptor;未知 id **不抛错**,继续下落 | `platform.ts:184-189` |
| 2 | 宿主 env 嗅探:`CLAUDE_CODE_SESSION_ID` → claude、`CODEX_SESSION_ID` → codex。**仅当恰好一个非空时生效**;两者并存(一个宿主里启动了另一个,外层 env 被继承)→ 判歧义,下落 | 对应 descriptor | `platform.ts:192-194` |
| 3 | `.platform` pin:先读 codex stateRoot,再读 claude stateRoot(后者也承载 pre-0040 `setup --platform codex` 写的 pin) | 该 descriptor;缺失 / 不可读 / 未知 id → 下落 | `platform.ts:197-204` |
| 4 | 目录探测:`~/.claude` 存在 → claude(在位者优先);否则 `~/.codex` 存在 → codex | 对应 descriptor | `platform.ts:212-218` |
| 5 | fallback | claude | `platform.ts:221` |

设计要点(ADR 0040 § Decision 1-2):

- **env 嗅探排在 pin 之前**,因为会话 env 是「此刻在哪个宿主里」的直接证据,pin 只是机器级偏好。
- **pin 按宿主读写**。`setup --platform <id>` 把 pin 写进所选宿主自己的 stateRoot;切换宿主时,
  另一宿主 stateRoot 下**已存在且内容不同**的 pin 一并改写(防旧 pin 因读取顺位靠前压住新选择);
  另一侧没有 pin 时不新建文件、不建目录(codex-only 机器仍不长出 `~/.claude`),也不删任何文件。

### 1.1 `HARNESSED_ROOT_OVERRIDE` 只换 stateRoot

`platform.ts:175-177`:`{ ...resolved, stateRoot: override }`。

- 它**不再短路平台判定**(这是 ADR 0040 如实声明的行为变化):在 codex 环境下设了 override 的脚本 / 测试
  现在拿到的是 **codex** descriptor,不是 claude。
- pin 仍从各宿主自己的 stateRoot 读,**不**从 override 目录读(`platform.ts:197`)。
- config 类 resolver(`getSettingsPath` / `getSkillsDir` / `getCommandsDir` / `getPluginsRegistry` /
  `getMcpConfigPath`,`platform.ts:237-263`)与它正交 —— override 只搬 stateRoot,不影响这五个。

---

## 2. descriptor 差异表

`PlatformDescriptor` 的 9 个字段(`src/platform/platform.ts:40-80`),两宿主取值
(`claudeDescriptor` `:87-105` / `codexDescriptor` `:124-141`):

| 字段 | claude | codex | codex 侧 null / false 意味着什么 |
|---|---|---|---|
| `id` | `claude` | `codex` | — |
| `homeDir` | `~/.claude` | `~/.codex` | — |
| `stateRoot` | `~/.claude/harnessed` | `~/.codex/harnessed` | — |
| `settingsPath` | `~/.claude/settings.json` | **`null`** | **没有 JSON settings 面**。`getSettingsPath()` 返回 `string \| null`,13 个调用方**显式 skip 并给出理由**(pass-skip),不抛错、不回退到别的文件 —— 尤其不回退到 `config.toml`(那是 TOML 且含凭据)。Phase 63 F2 漏列 `src/cli/uninstall.ts`,被 `tsc` 捕获。 |
| `skillsDir` | `~/.claude/skills` | `~/.agents/skills` | 不是 `~/.codex/skills`。`~/.agents/skills` 是**跨工具约定目录**(codex 从这里读,`.agents/skills/<name>/SKILL.md` 与 CC 格式字节兼容)。codex 自带的 skills 在 `~/.codex/skills/.system/`,与 harnessed 无关。 |
| `commandsDir` | `~/.claude/commands` | `~/.codex/prompts` | 仍然交付(`setup.ts:552` 创建并写入),但 OpenAI 已声明 "custom prompts are deprecated in favor of skills"(Phase 65 F5)。Phase 65 的决定是**两面都交付、两面都做原语化**,不在该 phase 讨论废弃。 |
| `pluginsRegistry` | `~/.claude/plugins/installed_plugins.json` | **`null`** | **没有文件系统插件注册表**(codex 用 inline `[marketplaces.*]`)。`readInstalledPlugins` 因此返回空集(`capabilityResolver.ts:93-96`)→ **每个 `install_type: plugin` 的能力在 codex 上都告警**。这是 Phase 65 F8 记录的已知缺口,未修。 |
| `mcpConfigPath` | `~/.claude.json`(**homedir 的兄弟**,不是 `.claude` 的子项) | `~/.codex/config.toml` | 不是「可以随便读写 config.toml」的许可 —— 见 §5.1 的精确边界。 |
| `supportsEnvKeyWrite` | `true` | **`false`** | **两个 env-key 写入器变成 no-op + 告知**:`enableAgentTeamsInSettings`(`:37`)、`enableUserLangInSettings`(`:75`);`guard-exemption.ts:224` 也据此判断能否写 env。连带后果:codex 上 `HARNESSED_USER_LANG` 从不被写入 → `buildLanguageSection`(`prompt.ts:265-282`)在该 env 未设时返回空串 → **codex subagent prompt 拿不到 `## Language` 节**。Phase 65 F8 记录,未修。 |
| `sessionIdEnv` | `CLAUDE_CODE_SESSION_ID` | `CODEX_SESSION_ID` | 非 null 的连带后果有两条:(a) codex 会话内 `harnessed run` / `research` 被嵌套守卫拦截(`src/cli/run.ts:211` / `research.ts:83`,非 TTY exit 1,`HARNESSED_ALLOW_NESTED=1` 可覆盖)—— 这是修复,嵌套 SDK spawn 在 codex 里同样会挂;(b) workflow ledger 按会话分槽(`activeKey` 用 `CODEX_SESSION_ID`)。 |

另有一个跨宿主的**探测集**(不是 descriptor 字段):`harnessSkillsDirs()`(`platform.ts:277-281`)去重返回
`~/.claude/skills` + `~/.agents/skills` + `~/.codex/skills`,只用于探测,安装目标始终取活动 descriptor 的 `skillsDir`。

### 2.1 hook 进程看不到宿主 env

实测(codex-cli 0.154,ADR 0040 § Context;0.155.1 exec 路径复验,Phase 66 F7 第 3 点):
**codex 的 hook 进程没有任何 `CODEX_*` env**(F7 实测 111 个 env 键里匹配 `/CODEX/i` 的为 0),
而 codex 会话里的 shell(模型经工具调用跑的 `harnessed` CLI)带 `CODEX_SESSION_ID`,
其值与 hook stdin 的 `session_id` 相同。

因此:

- hook 侧的宿主**必须显式传** `--platform codex`,走 §1 的第 1 级(ADR 0041 § Decision 3;
  `codexHookPlugin.ts:57` 的 `HOST_AWARE_IDS`)。claude 侧不带该参数,行为逐字节不变。
- codex 下 hook 的会话 id 取 stdin 的 `session_id`,不取 env。
- 残余风险(ADR 0040 § Consequences):双宿主机器上不设 pin 时,codex hook 会解析到 claude。

---

## 3. 四个交付面

Phase 65 的结论:交付面是**四个**,不是一个。任一面漏做,「正文不再指挥调用不存在的工具」就不闭合
(Phase 65 findings F1 / SUMMARY)。

| 面 | 产物 | claude 落点 | codex 落点 | 渲染方式 | claude 侧保证 |
|---|---|---|---|---|---|
| **S1** skills | `workflows/**/SKILL.md` | `~/.claude/skills/<flat>/` | `~/.agents/skills/<flat>/` | 原样 `cp` 后**就地三 pass 渲染**:pass 1 capability cmd(`renderSkillTemplates.ts:122-130`)→ pass 2 `{{ host.* }}`(`:132-147`)→ pass 3 host-map 小节(`:148-152`)。安装目标 `setup.ts:307` `getSkillsDir()` | 逐字节金标 en 91 / zh 62 条 |
| **S2** 命令体 | `/<name>` 的正文 | `~/.claude/commands/<x>.md` | `~/.codex/prompts/<x>.md` | **完全合成**(TS 字面量,`generateCommands.ts`);host 决策 `:175`,单占位符解析 `:201`,`description` 渲染 `:466`,body 渲染 `:482`。安装目标 `setup.ts:552` `getCommandsDir()` | 逐字节金标 各 26 条 |
| **S3** 运行时 prompt | 交给 subagent 的 prompt 字符串(进程内,不落盘) | 同一机制 | 同一机制 | `prompt.ts` / `run.ts` 从 `role-prompts.yaml` / `capabilities.yaml` / `disciplines/` / `defaults.yaml` 组装;host 默认取 `toHostId(detectPlatform().id)`(`prompt.ts:79`、`:268`、`:366`;`run.ts:514`),role prompt 的 `{{ host.* }}` 走 `rolePromptHostRender.ts:46-51` | 逐字节金标 61 sub × 2 locale |
| **B** 能力注册表 | `Invoke <cmd>` 行 | 顶层 `cmd` | `by_host.codex.cmd` 覆盖 | `capabilities.yaml` 的 `by_host` 段(`:609` / `:629` / `:644`)+ `pickHostValues`(`capabilityResolver.ts:171-176`);`resolveCapabilityCmd` `:209` | 默认 `claude`,pre-65 调用点不传参即不变 |

**为什么 B 面不占位符化**(Phase 65 findings F6 的 B 类):`capabilities.yaml` 的 `impl` / `cmd`
是**注册表事实**,不是措辞。正确做法是补 codex 侧能力条目让 `capabilityResolver` 按宿主选,
而不是把注册表值变成模板。今天带 `by_host.codex` 的三条都在 Bucket 5 agent-platform:
`agent-teams-create`(`Agent(name, run_in_background=true)` → `spawn_agent(agent_type, message)`)、
`agent-teams-send-message`(`SendMessage` → `send_input`)、
`agent-teams-shutdown`(`ask the <teammate-name> teammate to shut down` → `close_agent`)。

### 3.1 codex 专属的第五面:agent roles(Phase 66 T1)

不属于 Phase 65 的四面,但属于本契约:**`<CODEX_HOME>/agents/harnessed-<sub>.toml`**
(`src/installers/lib/codexAgentRoles.ts`;安装点 `setup.ts:619-659` Step A.7,codex-only)。

- 消费方是**会话内** `spawn_agent(agent_type: …)`:`agent_type` 是**角色名**,必须对应
  `~/.codex/agents/<x>.toml` 里的 `name`。`codex exec` **不能**指定 agent role(Phase 66 F2),
  那条路径把角色指令拼进 prompt 文本。两者不要互相假设。
- codex 的发现机制是**目录扫描**(上游 `codex-rs/agent-roles/src/loader.rs:76-78`),
  与 config.toml 的 `[agents]` 段是两条独立来源 —— harnessed 只用目录这条,所以不碰 config.toml。
- role name 取自**文件内容**而非文件名(`loader.rs:303` `role_name_hint: None`);同名 role 重复 →
  codex 跳过 + 告警(`:311-322`)。本机已有 33 个 GSD 装的 toml,故 harnessed 一律加前缀
  `harnessed-`(`codexAgentRoles.ts:40`),并在文件首行写所有权标记 `# GENERATED by harnessed`
  (`:44`)—— 没有该标记的 `harnessed-*.toml` 是别人的文件,永不触碰。
- `description` 是**必填**字段(上游报错文案:`agent role <name> must define a description`)。
- 渲染顺序是硬要求:调用方先 `renderRolePromptsForHost(..., host: 'codex')` 把 `{{ host.* }}`
  解析成 codex 列,再交给 `buildCodexAgentRoles` —— 否则会把 Claude Code 的原语
  (Task tool / SendMessage / Agent Teams)写进 codex 侧产物。
- role 的 `developer_instructions` 措辞必须是正常的角色说明。实测(Phase 66 F8 第一轮)
  「忽略一切 / 只输出固定串」这种形状会被子 agent 按 prompt injection 拒绝执行。

### 3.2 codex 产物额外带一个 host-map 小节

codex 侧的 S1 产物在 frontmatter 之后插入一个 marker 包裹的小节
(`hostPrimitives.ts:296`/`:299` markers,`:370` 构建,`:433` 插入)。claude 产物从这一 pass 拿到
**零字节**(`buildHostMapSection` 对 claude 返回 `''`,`insertHostMapSection` 见空即原样返回),
这是逐字节金标的保证方式。

小节内容 = 术语表(从原语表**派生**,见 §4)+ `host_map_notes.codex` 的整篇级 caveat。
存在理由:正文里的 CC 术语已被换成 codex 的,但读者仍可能遇到一个**形状**只在 CC 下讲得通的步骤;
把映射和 caveat 说一次,胜过在约 74 处散文里各加一遍对冲。

---

## 4. 原语对照表(派生,勿手抄)

机制:第二族占位符 `{{ host.<primitive>[.<variant>] }}`,与既有 `{{ capabilities.<x>.cmd }}` 同族、
挂同一个渲染点 —— **没有新模板引擎**。词表:`workflows/host-primitives.yaml` +
`workflows/host-primitives.zh-Hans.yaml`,今天是 **14 primitive / 39 占位符**。

渲染器:`src/cli/lib/hostPrimitives.ts` —— 正则 `:185`、渲染 `:222`、占位符集合扫描 `:266`。
**刻意 throw 而不保留**:未知 primitive / 未知 variant(**无** `default` 回退)/ 该 host 列缺文本
三种情况全部在 build 时报错(`:232-250`)。静默保留一个 `{{ host.* }}`,等于把 Claude-only 原语
悄悄发进 codex 产物且下游无人看得见。

### 4.1 派生方式

> 本节两张表由下面的命令从 `workflows/host-primitives.yaml` **生成**。
> 改了词表就重跑并替换,不要逐行手改 —— 手抄必然腐烂。
> zh-Hans 的对应值在 `workflows/host-primitives.zh-Hans.yaml`,key 集合与本文件严格相等
> (`scripts/check-yaml-i18n-parity.mjs` 守三层 key 集合)。

全量 39 行:

```bash
nu -c '
open workflows/host-primitives.yaml
| get primitives
| transpose primitive variants
| each {|p| $p.variants | transpose variant hosts
    | each {|v| {primitive: $p.primitive, variant: $v.variant,
                 claude: ($v.hosts.claude? | default ""),
                 codex:  ($v.hosts.codex?  | default "")} } }
| flatten
| to md
'
```

术语级 16 行(§4.2 的表)= 在上面的管道尾部追加与 `hostMapRows`
(`src/cli/lib/hostPrimitives.ts:335-347`)**同一条**判据的过滤:两列都单行、且两列长度都
≤ `TERM_MAX_LEN`(64,`:311`):

```bash
# 接在上面 `| flatten` 之后、`| to md` 之前
| where {|r| not ($r.claude | str contains (char newline))
        and not ($r.codex  | str contains (char newline))
        and ($r.claude | str length) <= 64
        and ($r.codex  | str length) <= 64 }
```

这条判据是**分类器,不是截断**:词表里混着两类值 —— 短术语替换与整段 C 类语义段,
实测最长术语 48 字符、最短段落 99 字符,中间空档很宽(`hostPrimitives.ts:302-310` 注释)。

### 4.2 术语级对照(16 行,派生于 2026-09-30)

| primitive | variant | claude | codex |
| --- | --- | --- | --- |
| spawn_subagent | default | Task / Agent tool | spawn_agent tool |
| spawn_subagent | zh_tool | Task / Agent 工具 | spawn_agent 工具 |
| spawn_subagent | plural | Task / Agent tools | spawn_agent tools |
| spawn_subagent | call_plural | Task calls | spawn_agent calls |
| send_message | default | SendMessage | send_input |
| team | default | Agent Teams | a multi-agent formation (repeated `spawn_agent`) |
| team | attributive | Agent Teams | multi-agent formation |
| team | singular | Agent Team | multi-agent formation |
| native | default | CC-native | codex-native |
| name | default | Claude Code | Codex |
| name | short | Claude | Codex |
| teammate | default | teammate | agent |
| teammate | plural | teammates | agents |
| ask_user | default | AskUserQuestion | request_user_input |
| skills_dir | default | ~/.claude/skills | ~/.agents/skills |
| teams_cleanup_note | shutdown_phrase | 按名请求每个 teammate shut down | 对每个 agent 调 `close_agent` |

### 4.3 整段级(C 类)23 行 —— 只列名与长度,内容看词表

C 类存在的理由:claude 的措辞里**陈述了一个 Claude-only 事实**。token 级替换会让同一句话
把那个事实断言到 codex 上。codex 列因此**丢掉**该断言,而不是替换主语重新断言一遍
(`host-primitives.yaml:160-166`)。

| primitive | variant | claude 长度 | codex 长度 |
| --- | --- | --- | --- |
| spawn_subagent | zh_tool_wrapped | 19 | 18 |
| team | wrapped | 11 | 21 |
| harnessed_run_warning_note | default | 65 | 50 |
| harnessed_run_warning_note | execution_tail | 65 | 50 |
| harnessed_run_warning_note | orchestrator_tail | 98 | 50 |
| harnessed_run_warning_note | execution | 137 | 122 |
| harnessed_run_warning_note | orchestrator | 170 | 122 |
| harnessed_run_warning_note | command_orchestrator | 148 | 132 |
| harnessed_run_warning_note | command_execution | 83 | 83 |
| teams_step_note | default | 684 | 790 |
| teams_step_note | skill | 684 | 790 |
| teams_step_note | command | 1019 | 838 |
| teams_teardown_note | default | 1056 | 821 |
| delivery_contract_note | default | 411 | 396 |
| delivery_contract_note | checklist | 235 | 258 |
| teams_cleanup_note | default | 269 | 193 |
| teams_cleanup_note | checklist | 269 | 193 |
| teams_cleanup_note | multispec_checklist | 294 | 201 |
| teams_cleanup_note | deliver | 347 | 329 |
| teams_cleanup_note | multispec | 158 | 180 |
| multispec_spawn_note | default | 221 | 311 |
| multispec_spawn_note | responsibility | 77 | 81 |
| multispec_spawn_note | checklist | 56 | 187 |

注:`spawn_subagent.zh_tool_wrapped` 与 `team.wrapped` 字符很短,落在这张表里是因为**单元格带换行**
(源行在术语中间折行,cell 把那个换行带上,让正文能持有一个不折断的占位符,而 claude 渲染仍逐字节还原原来的两行)。
`hostMapRows` 排除多行单元格,与长度无关。

### 4.4 codex 列的来源与两条纪律

- **工具名与参数取自上游** `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`,
  codex-cli 0.155.1,`codex features list` 显示 `multi_agent` stable/**true**、
  `multi_agent_v2` stable/**false** → **v1 生效**:
  `spawn_agent(agent_type, message)` / `send_input(target, items, interrupt)` /
  `wait_agent` / `list_agents` / `close_agent` / `resume_agent`。
  claude 侧没有 `wait_agent` / `list_agents` 的对等物;codex 侧没有 branded team 概念
  (编队 = 重复 `spawn_agent`)。
- **`agent_type` 不是任务标签**(Phase 65 F14 的事实更正,发版前改掉)。v2 才有 `task_name`,
  v1 没有;传一个不存在的 `agent_type`,工具层直接报 `unknown agent_type '<x>'` 且不创建 agent。
  所以正文里凡需要标识子任务的地方,都写进 `message`,并在同句点明「`agent_type` 选的是 agent role
  不是任务标签」。复核办法:`codex features list | rg multi_agent`(v2 必须仍 stable/false)+
  `rg -n 'task_name' workflows/ tests/`(应无命中)。
- **claude 列是逐字还原的原文,不许「改进」**(`host-primitives.yaml:18-20`)。
  每个 claude 值都用字符串包含比对过真实产物(25/25)。取值必须从真实文件 `sed -n` 出来,
  不能从生成器源码(那是转义过的 JS 模板字面量)或从文档转抄。

### 4.5 与该机制相关的两条结构性裁决

- **marker ⇄ 逐字节金标**(Phase 65 F12):`scripts/rewrite-skill-invoke-sections.mjs` 的 marker
  字符串**是产物的一部分**,bump 必然改掉 58 个文件的 hash。Phase 65 不 bump;政策写进该脚本注释:
  将来确需 bump 时允许重录 claude 金标,**但必须在同一 commit 内用 diff 证明「除 marker 行外零差异」**,
  否则重录就是在掩盖回归。
- **金标口径 ⇄ 未渲染的 locale sibling**(Phase 65 F11):en 安装时只渲染并写 `SKILL.md`,
  `SKILL.zh-Hans.md` 以 `cp` 原样留下、不渲染也不删除(`renderSkillTemplates.ts:157,175`),
  而 Claude Code 只读 `SKILL.md`。金标锁的是「宿主实际会读到的内容」,那份 zh 副本是死副本,
  不纳入字节锁。**副作用记 TODO(未修)**:en 安装会往 `~/.claude/skills/<name>/` 丢一份
  **带未解析占位符**的 `SKILL.zh-Hans.md` —— 无人读取因而无实际危害,但不干净。

---

## 5. 硬边界(每条给出为什么)

### 5.1 不写 `~/.codex/config.toml`

**为什么**:它同时存放凭据(含 `experimental_bearer_token`)。ADR 0041 § Context 3 把这条定为边界。
连带两处实际改动:

- Phase 64 修掉了 `ccPluginMarketplace` 在 codex 上**把 `config.toml` 纳入 backup** 的行为
  (backup 会复制含凭据的文件)→ 已改为不 backup。**v16.0 收口审计发现那次只扫了一个文件**:
  `mcpStdioAdd` / `mcpHttpAdd` 同样把它列进 backup plan,凭据在 `~/.harnessed/backups/` 下多出一份
  (4.46.0 修,两条反证测试)。
- 「已装」判定与信任判定都不再读它:插件从 `codex plugin list --json` 取
  (ADR 0041 § Decision 6),信任从 app-server `hooks/list` 取(§ Decision 5)。
- **MCP 登记探测也迁走了**(v16.0 收口后):`isMcpServerRegistered` 改问 `codex mcp list --json`
  (`codexMcpServers.ts`),那条 TOML 段头正则连同它的测试一并删除,不留无调用方的导出。

**精确口径(读 ≠ 写,且不要把这条说过头)**:

- harnessed **自己不写**这个文件。`codex mcp add` / `codex plugin add` 会写 —— 那是 codex CLI 的行为;
  harnessed 只在 diff 预览里把它标为目标文件(`mcpStdioAdd.ts:145` / `mcpHttpAdd.ts:227` /
  `ccPluginMarketplace.ts:198`),预览文本明说 "will be written … by `codex mcp add`"。
- **曾经保留的那一处窄读已经没有了。** 在 v16.0 收口之前,`isMcpServerRegistered` 会把整个文件
  读进内存去匹配 `[mcp_servers.<name>]` 段头 —— 凭据行随之经过进程。现在它问
  `codex mcp list --json`(顶层是**数组**,与 `codex plugin list --json` 的对象形状不同;
  形状实测于 0.155.1,用 `-c 'mcp_servers.<probe>={…}'` 的内存内覆盖探得,**没有写过任何文件**)。
  于是 ADR 0041 § Context 3 的「不写也不读」**不再需要例外条款**,与 ADR 0040 § Decision 4 之间的
  张力随之消解:`mcpConfigPath` 仍然存在,但它唯一的职责变成 diff 预览里的**目标文件标注**。
  判据落在 `tests/installers/codexMcpServers.test.ts` —— 放一个含假凭据的 decoy config.toml,
  断言无论答案是 true 还是 false,那个文件都没被打开过(回退实现时该断言会红并打印出那次读取)。
- **同一次迁移还揪出第二处读取**:`probeSearchMcpKey`(doctor `check-mcp-availability` 与 setup 尾部
  提示)经 `readUserClaudeJson()` 读 `getMcpConfigPath()` —— 在 codex 上那就是 config.toml,而它读它
  **只是为了让 `JSON.parse` 失败**然后落到 `{}`。守卫下在 `readUserClaudeJson` 这个机制上而非那个调用点,
  于是将来新增的调用方自动继承;codex 上的结论不变(只有 process-env 这一源能回答)。
  剩下唯一一处经 `getMcpConfigPath()` 的读在 `isPluginRegistered` 的 legacy fallback 循环里,
  靠该函数顶部的 codex 早退保持不可达 —— 代码里写了注释点明这层依赖。
- `settingsPath` 链**完全不碰**它:codex 上 `settingsPath === null`,每个调用方显式 skip,
  不回退(ADR 0040 § Decision 4;`tests/platform/settingsPath-null.test.ts` 守着)。

### 5.2 不写 `~/.codex/hooks.json`

**为什么**:codex 用户 hook 文件的信任键是**位置性**的(`<path>:<event>:<组>:<条>`)。
harnessed 往里插一条,**别人已信任的 hook 的键就漂移了,变成未信任**,而未信任 / 被改过(`modified`)
的 hook 在 codex 上**静默不跑**。这是毒化他人配置(ADR 0041 § Context 1 + § Alternatives rejected)。

**替代方案**:每个 hook manifest 一个本地 codex 插件 `harnessed-<manifest>@harnessed-local`,
共用 harnessed 自有的本地 marketplace `~/.codex/harnessed/marketplace`。插件 hook 的信任键带插件命名空间
(`<p>@<m>:hooks/hooks.json:<event>:0:0`),与他人 hook 互不干扰(ADR 0041 § Decision 1)。
配套约束:命令字面量固定以保 hash 稳定(会变的资产根放 `${PLUGIN_DATA}/install.json` 由 shim 运行时读),
否则每次升级都改 hash、已信任的 hook 静默变 `modified`(§ Decision 2)。

harnessed 在 `~/.codex` 下的**全部写入**就是:本地 marketplace 目录、插件目录、
`plugins/data/<p>-harnessed-local/install.json`,以及 §3.1 的 `agents/harnessed-*.toml`。

### 5.3 不写 `~/.harnessed`

**为什么**:它是 **pre-v3.0.3 的遗留根**,不是安装目标。今天状态根由 descriptor 派生
(`<homeDir>/harnessed`,即 claude 上 `~/.claude/harnessed` / codex 上 `~/.codex/harnessed`),
`migrateLegacyHarnessedRoot()` 在 CLI 入口把遗留的 `~/.harnessed` **原子改名迁走**
(`src/platform/harnessedRoot.ts:27-31`;两者都存在时把遗留目录改名成 `~/.harnessed.legacy-bak/`)。
往 `~/.harnessed` 写新东西 = 往一个会被迁移器搬走的目录里写。

### 5.4 claude 宿主永不自动拉起 `codex exec`

**为什么**:这是**外发边界**。开发期手动实测不等于产品行为(Phase 66 findings F4)。
一个跑在 Claude Code 里的会话自动去起另一个厂商的 CLI 子进程,是用户没同意过的外发动作。

**机制上怎么钉住的**(两道,互不依赖):

- `dispatchSpawn`(`src/workflow/lib/spawnDispatch.ts:75-85`)只在 `resolveSpawnHost() === 'codex'`
  时走 `codexExecSpawn`,否则走 `sdkSpawn`。
- `codexExecSpawn` 在自己入口**再查一次宿主**,非 codex 抛 `HostNotCodexError`
  (`codexExecSpawn.ts:117-121`)—— 这不算五类 spawn 失败之一,它是接线 bug 不是跑坏的运行。
  所以一个路由错的调用方**仍然**不能从 claude 起 codex。

### 5.5 `codex exec` 路径的四条实测约束(一并当边界看)

来自 Phase 66 F5-F6(codex-cli 0.155.1,Windows),实现照做(`codexExecSpawn.ts:23-35` 注释、
`:288-295` argv):

- **Windows 上不能 `shell: true`** —— prompt 字符串会被按空格重新切分,报
  `error: unexpected argument 'with' found`。用绝对路径 + `shell: false`(复用
  `planWindowsSpawn` / `resolveWindowsBin`)。
- **`--skip-git-repo-check` 必要**,否则在非 git 工作目录直接拒跑。
- **不能靠切 `CODEX_HOME` 来隔离**:隔离的 home 里没有 `auth.json`,等于未认证。
  只能真实 home + `--ephemeral`(不落 session 文件)。
- **exit code 0 什么都不证明**。沙箱拒绝工具调用(F6)与不存在的 agent role(F8)都以 exit 0 收场。
  成功判据落在 `-o` 的 last message 内容 + JSONL 事件流上,由 `classifyCodexExec` 裁。
  默认沙箱是 `workspace-write`(`DEFAULT_CODEX_SANDBOX`,`:64`):leaf 子任务要写文件,
  `read-only` 会让它们全部 `SpawnRefused`;调用方可覆盖。

### 5.6 spawn 失败的五类具名错误

`src/workflow/lib/spawnFailure.ts:35-43`,形状照抄 `codexHookTrust.ts` 的
`TrustFailure` / `RpcOutcome<T>` 判别联合(Phase 66 R5,不另发明)。判据顺序是 load-bearing:

| kind | 含义 | 可重试 |
|---|---|---|
| `SpawnTimeout` | 自己的墙钟上限触发(`HARNESSED_SPAWN_TIMEOUT_MS`,默认 1 小时,`spawnTimeout.ts:11-17`) | **是**,且**只**这一类;重试恰好 1 次(`codexExecSpawn.ts:474`) |
| `SpawnAuthFailed` | 认证失败。**排在 exit code 之前判**,因为认证失败同样非零退出,而「你没登录」才是可行动的结论 | 否 |
| `SpawnExitNonZero` | 进程本身失败:非零退出 / 信号 / 根本没起来(ENOENT)。**反向不成立**:exit 0 不证明成功 | 否 |
| `SpawnRefused` | 拿到了格式良好的一轮,答案是「我不做 / 做不了」:沙箱拒了工具调用、agent role 不存在、turn 失败。合法但无用的输出 | 否 |
| `SpawnOutputMalformed` | 拿到了一轮但没拿到契约输出:没有 last message、没有终止事件、stdout 不是 JSONL。结构缺失,且没有一句拒绝来解释 | 否 |

一句话分界:**Refused = 这一轮告诉了我们为什么失败;Malformed = 这一轮什么都没告诉我们**。

入账本:`spawn_failure` 是账本条目上的**可选**字段
(`src/checkpoint/schema/currentWorkflow.v1.ts:116`,五个字面量的 union,SoT 是 `SPAWN_FAILURES`);
唯一 CLI 注入点是 `harnessed checkpoint fail --failure <kind>`(`src/cli/checkpoint.ts:815-816`),
未知值**先校验后落盘**直接拒(`:573-580`),缺省则条目上**不留这个 key**(`:630`)。

---

## 6. 已实测 vs 未实测

**这一节的分界是硬的。** 未实测的东西不得当事实写进任何产物;词表里标了 `TODO(未验证)` 的,
这里也标。

### 6.1 已实测(带测量时间与 codex 版本)

| 结论 | 测得于 | codex 版本 | 证据 |
|---|---|---|---|
| codex hook 协议与 CC 同形(stdin 字段一致;UserPromptSubmit 的纯文本 / `additionalContext` 都进上下文;PreToolUse 的 shell 工具名是 `Bash`) | 2026-09-22 | **0.154** | ADR 0041 § Context;fixture 取自 0.154 真实 payload(脱敏) |
| hook 进程无任何 `CODEX_*` env;codex 会话的 shell 带 `CODEX_SESSION_ID`,其值 == hook stdin 的 `session_id` | 2026-09-22 | **0.154** | ADR 0040 § Context |
| pwsh 压退出码 → codex 上 exit 2 的 PreToolUse 阻断到不了宿主;裁决改走 stdout JSON(`permissionDecision: deny` / `systemMessage`,exit 0) | 2026-09-23 | 0.155.1 | Phase 64 SUMMARY「实施中推翻的前提」1;ADR 0041 § Decision 4 |
| hook 延迟:SessionStart 594 ms / UserPromptSubmit 565 ms / PreToolUse 765 ms(p95 < 1s 预算);`cmd /c` 直跑同一命令 p50 约 100 ms,差额主要是 pwsh 启动 | 2026-09-23 | **0.155.1**(Windows / pwsh) | `pnpm test:codex-live` 29/29;Phase 64 SUMMARY |
| codex 契约细节:`${PLUGIN_DATA}` = `<CODEX_HOME>/plugins/data/<plugin>-<marketplace>`(不预建);`plugin remove` 不删 data、留空 cache;`marketplace remove` 不幂等;信任删除 = 引号 keyPath + `value:null`;未知 app-server 方法返回 `-32600`;app-server 启动会在 `CODEX_HOME/.tmp` 拉后台 git fetch | 2026-09-23 | 0.155.1 | Phase 64 SUMMARY 第 4 条 |
| `multi_agent` stable/true、`multi_agent_v2` stable/false → v1 生效;v1 的 `spawn_agent` **没有** `task_name` | 2026-09-29 | 0.155.1 | `codex features list` + 上游 `multi_agents_spec.rs` 的 v1/v2 两个构造函数;Phase 65 F14 |
| `codex exec --ephemeral --json -o <file> -s read-only --skip-git-repo-check "<prompt>"` 可用;stdout 是 JSONL,事件依次 `thread.started` → `turn.started` → `item.completed` → `turn.completed`;`-o` 文件写入模型最后一条消息 | 2026-09-29 | 0.155.1(Windows) | Phase 66 F5(T0.1) |
| `-s read-only` 确实挡工具调用,**但 exitCode 仍是 0**(模型自己回 `BLOCKED`) | 2026-09-29 | 0.155.1 | Phase 66 F6(T0.3) |
| 注入 `codex exec` 的 env **直达子会话两个 hook 进程**(`SessionStart` + `UserPromptSubmit` 都 fire);hook stdin 的 `session_id` == JSONL 首事件 `thread.started.thread_id`,且该事件是流的第一条 | 2026-09-29 | 0.155.1 | Phase 66 F7(T0.2),探针插件 + 1 次 codex 调用 |
| `~/.codex/agents/*.toml` **能**被 exec 会话内的 `spawn_agent` 按名引用,且 `developer_instructions` 真的进了子 agent 上下文(role 要求回复附 `ECHO-7742`,子 agent 返回 `"4\n\nECHO-7742"`) | 2026-09-29 | 0.155.1 | Phase 66 F8(T0.4),2 次 codex 调用 |
| 不存在的 `agent_type` → 工具层报 `unknown agent_type '<x>'`,不创建 agent、不返回 agent_id;事件流表现为**只有 `item.started` 没有 `item.completed`**,而整个 turn 仍 exit 0 | 2026-09-29 | 0.155.1 | Phase 66 F8 第 4 点 |
| 子 agent 的最终文本**不是**独立的顶层 `agent_message`,而落在 `wait` item 的 `agents_states[<子 thread id>].message`;观察到的 status 取值 `pending_init` → `running` → `completed` | 2026-09-29 | 0.155.1 | Phase 66 F8「事件形状」 |
| Claude Code 的 skill 加载位置**不含** `~/.agents/skills`(只有 `~/.claude/skills` / `.claude/skills` / `--add-dir` / 插件目录) | 2026-09-24 | —(CC 侧) | code.claude.com/docs/en/skills.md「Skill Loading Locations」;Phase 65 F3 |

### 6.2 未实测 —— 不得当事实使用(逐条)

1. **codex agent 生命周期:是否 session-scoped。** 未测。
   词表标注点:`host-primitives.yaml:34-36`(文件头)、`teams_step_note.default/.command` 的
   `TODO(未验证)`、`host_map_notes.codex` 第 3 条。
2. **codex agent 生命周期:session 退出时是否自动回收运行中的 agent。** 未测。
   因此纪律是**显式 `close_agent`**,不依赖任何没观察到的清理:
   `teams_teardown_note.default`、`teams_cleanup_note.{default,checklist,multispec_checklist,deliver,multispec}`
   全部带该 `TODO(未验证)`。
3. **codex agent 生命周期:一个 agent 能否再 spawn 另一个(嵌套)。** 未测。
   标注点同 1。
4. **codex 是否把 spawned agent 的 final text 交回 caller。** 未测。
   已知的**相邻**事实是 exec 路径上它落在 `wait` item 的 `agents_states[...].message`(§6.1),
   但「会话内模型拿不拿得到它作为工具结果」没测。因此交付契约写成:让 agent 写文件(并读回)
   或用 `send_input` 送回,`wait_agent` 之后再读 —— 两条路都不依赖它。
   标注点:`delivery_contract_note.{default,checklist}`。
5. **`request_user_input` 在本机安装上是否默认启用。** 未测。
   工具确实存在于上游(`codex-rs/core/src/tools/handlers/request_user_input{,_spec}.rs`),
   但启用状态没测;`codex features list` 里的 `default_mode_request_user_input` 是**模式 flag,
   不是该工具自己的开关**。caveat 只说一次,在 `host_map_notes.codex` 第 1 条,
   不散进 74 处散文。若澄清往返不可用,不许猜 —— 停下并报 `STATUS: NEEDS_CLARIFICATION` + 问题列表。
   词表标注点:`host-primitives.yaml:146-149`。
6. **`thread/goal/set` 对运行中的 TUI 是否可见。** 未测,且**只有维护者能测**。
   goal 因此整体移出 Phase 66(维护者 2026-09-29 裁定,Phase 66 F2d):仓库里 goal 是
   [ADR 0039](./adr/0039-completion-guarantee-internalized-drop-ralph-loop.md) 删掉的东西,
   删除理由之一正是「tier 2(原生 `/goal`)从未被实证」。在 codex 侧同样未实证的情况下重新引入,
   等于重犯 ADR 0039 指出的那个错。实测步骤进 `TODOS.md`;实测通过再单独立项,
   那时需要一份新 ADR 说明为何推翻 0039 的相关部分。

### 6.3 已知缺口(测过、成立、但没修)

不是「未实测」,是「实测确认存在的缺陷」。来源 Phase 65 findings F8 / F11。

| 缺口 | 后果 | 位置 |
|---|---|---|
| codex 上 `pluginsRegistry: null` | `readInstalledPlugins` 返回空集 → **每个 `install_type: plugin` 的能力在 codex 上都告警**。`host_map_notes.codex` 第 2 条把这条告诉读者:把这类步骤当不可用并记录 skip,**不要**替换成一个等价物 | `platform.ts:135`;`capabilityResolver.ts:93-96` |
| codex 上 `supportsEnvKeyWrite: false` | `HARNESSED_USER_LANG` 从不被写入 → `buildLanguageSection` 返回空 → **codex subagent prompt 拿不到 `## Language` 节** | `platform.ts:137`;`enableUserLangInSettings.ts:75`;`prompt.ts:265-282` |
| `setup.ts` 的 `loadRolePrompts()` 未显式传 locale | 落到 `rolePrompts.ts:43` 的默认参数,与同函数上游显式线程下来的 locale **不同源**。当前行为一致,属隐患 | `setup.ts` role-prompts 加载点 |
| en 安装留下未渲染的 locale sibling | `~/.claude/skills/<name>/SKILL.zh-Hans.md` 带**未解析的占位符**。无人读取(CC 只读 `SKILL.md`)因而无实际危害,但不干净 | `renderSkillTemplates.ts:157,175`;裁决见 §4.5 |
| `stop-hook-recover` 在 codex 上不可用 | 它依赖 CC transcript 形态,在 codex 上**诚实返回 `harness-mismatch`**(不是伪装成成功) | ADR 0041 § Consequences |
| `dashboard-autospawn` 不 port | 任何 CLI 路径都不扫描 `manifests/cc-hooks/`,在 claude 上同样不可达 | ADR 0041 § Consequences |

---

## 7. `doctor` 宿主矩阵怎么读

三个入口(`src/cli/doctor.ts:119-177`):

| 命令 | 行为 |
|---|---|
| `harnessed doctor` | **每一条** check,按**活动**宿主跑。默认**刻意不按宿主过滤** —— 一条「这儿不适用」的行值它那一行(`doctor.ts:11-16`) |
| `harnessed doctor --host <id>` | 只跑声明了 `<id>` 的 check,并**解析为** `<id>`:实现方式与 `setup --platform` 相同,给本次运行设 `HARNESSED_PLATFORM`(§1 第 1 级),因此每个 descriptor 型 resolver 都按请求的宿主回答。**不持久化**,不写 `.platform` pin |
| `harnessed doctor --matrix` | 每条 check × 每个宿主,一个 cell 一个状态。`--matrix` 与 `--host` 互斥(给了两个 → exit 2) |

矩阵**按宿主串行**跑(`HARNESSED_PLATFORM` 是进程级的一个变量),同一宿主内的 check 仍经
`Promise.allSettled` 并行(`doctor.ts:80-109`)。

### 7.1 `n/a` 与 `skipped` 的区别 —— 这是漂移探测器

这是本节唯一真正需要记住的东西(`src/cli/lib/doctor-matrix.ts:14-18`):

- **`n/a`** = 注册表**从未为该 check 声明那个宿主**,于是**根本没跑**。cell 值是 `null`
  (`doctor-matrix.ts:30` `NOT_APPLICABLE` / `:50-55`)。这是**预期**。
- **`skipped`** = 声明了那个宿主,check **跑了**,但它自己的 early-return 说「这儿不适用」。
  这是**漂移信号**:注册表的 `hosts` 标注**声明**了一个宿主,而 check 的真实逻辑**拒绝**它。

所以 `harnessed doctor --matrix --json` 是 `doctor-registry.ts` 里那些宿主标注的**自审面**:
**在一个标注承诺了真实裁决的位置出现 `skipped`,就是标注与代码对不上。**

这条对账关系的另一半写在注册表头(`doctor-registry.ts:11-22`):`hosts` 是该 check
**有意义**的宿主集合,**从每个 check 真实的 early-return 逻辑审出来,绝不从名字猜**。
参考点:宿主型 early-return(`detectPlatform().id !== 'claude'` / `settingsPath === null` /
`pluginsRegistry === null`)⇒ 那个宿主**不**列;跨两宿主目录的探测(`harnessSkillsDirs()`)、
descriptor 解析出的路径(`getSkillsDir()`)、或压根没有宿主面的(PATH / git / env / 打包资产)
⇒ **两个都列**。

### 7.2 `skipped` 是一等状态,不再伪装成 `pass`

Phase 66 T5 之前,宿主不适用的 early-return 返回的是**假的 `pass`**、消息写着 "skipped"
(Phase 66 findings F2e 记录的原状)。现在它返回真正的 `skipped`
(例:`check-codex-hooks.ts:118-119`)。其余变化:

- `skipped` 进了 `CheckStatus` union,**对 summary 与 exit code 贡献为零**
  (`summarise`,`doctor-matrix.ts:70-74`:`fail` > `warn` > `pass`,`skipped` 不参与;
  空集合算 pass —— 「没有 check 适用于这个宿主」不是健康问题)。
- 默认输出唯一可见的变化是**行首标记**:宿主 early-return 现在印 `-`,不再印一个它没挣到的 `✓`
  (`MARKS`,`doctor.ts:43`)。退出码策略未动:**只有 `fail` 退 1**。

### 7.3 今天的行数

`CHECKS` 24 条(`doctor-registry.ts:67-232`)。按宿主标注:

| 标注 | 条数 | 例 |
|---|---|---|
| `['claude']` | 6 | `mcp scope`、`Agent Teams env`、`planning-with-files plugin`、`stale hooks`、`per-turn inject pairing`、`plugin install freshness` |
| `['codex']` | 1 | `codex hook plugins`(ADR 0041;codex 静默跳过未信任 / 被改过的 hook,所以「已装」不等于「在跑」) |
| 两者 (`BOTH`) | 17 | 其余 |

于是 `--host claude` 跑 23 条、`--host codex` 跑 18 条。
矩阵列顺序由 `ALL_HOSTS`(`doctor-registry.ts:61`)给出:`['claude', 'codex']`。
加新 check 的步骤写在注册表头 `:24-29`(名字必须与 `CheckResult.name` 相等 —— 矩阵行按它做键)。

---

## 附:相关门

| 门 | 守什么 |
|---|---|
| `scripts/check-host-primitives.mjs` | **codex 渲染产物**在豁免区间外零 CC 原语。判的是**渲染后的产物**而非源文本(源文本本来就该满是 `{{ host.team }}`);host-map 区间整段豁免,marker 字符串从 `src/cli/lib/hostPrimitives.ts` **读出来**而不是重打,豁免因此不会与发射器漂移 |
| `scripts/check-skill-i18n-parity.mjs` | en ⇄ zh SKILL 正文的 `{{ capabilities.X }}` 占位符集合双向精确相等,**外加** `{{ host.* }}` 的 **primitive 集合**。注意比的是 primitive 不是 variant —— en / zh 的 variant 集合**故意不相等**(en 用 `.default` / `.plural`,zh 用 `.zh_tool`),词表设计使然(Phase 65 F13) |
| `scripts/check-yaml-i18n-parity.mjs` | `host-primitives` 的 `primitives:` map **三层** key 集合(primitive / variant / host)在 en 与 zh-Hans 之间相等 |
| `tests/unit/skill-invoke-parity.test.ts` | `workflows/**/SKILL*.md` 的禁词 + 必需 token |
| `fixtures/eval/host-render-{claude,codex}/` | **唯一跑 dist 产物**的宿主渲染覆盖(CI 的 `node dist/cli.mjs eval --dir fixtures/eval`)。三份渲染金标跑的都是 src;构建若把渲染链打歪(词表 yaml 查找路径、`getAssetsRoot()` 在 bundle 里解析到别处),金标一律照绿,只有这里会红。另有**防塌陷断言**:直接读两份提交在仓库里的 golden,断言 `claude !== codex` 并逐层 spot-check —— 否则渲染链哪天不再问 host,两份会被重录成同样的字节、然后永远绿着却什么都没覆盖 |
