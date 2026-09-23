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
| spawn 子 agent | Task / Agent tool | `spawn_agent`(`task_name`, `message`;v1 另有 `agent_type` / `model` / `reasoning_effort`) |
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

## F8 顺带发现(不在本 phase 修,记 TODO)

- codex 上 `pluginsRegistry: null`(`platform.ts:135`)→ `readInstalledPlugins` 返回空集
  (`capabilityResolver.ts:86-87`),于是**每个 `install_type: plugin` 的能力在 codex 上都告警**。
- codex 上 `supportsEnvKeyWrite: false` → `HARNESSED_USER_LANG` 从不写 → `buildLanguageSection`
  (`prompt.ts:217-218`)返回空,**codex subagent prompt 拿不到语言指令**。
- `setup.ts:567` 的 `loadRolePrompts()` 未显式传 locale,落到 `rolePrompts.ts:44` 的默认参数,
  与同函数上游显式线程下来的 locale 不同源(当前行为一致,属隐患)。
