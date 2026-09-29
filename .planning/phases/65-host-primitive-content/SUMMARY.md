# Phase 65 SUMMARY — 正文宿主原语化(v16.0 / 2)

**完成**:2026-09-29 · 11 个 commit(`1626176` 计划 → `2e7dfe6` 收尾)· 2228 测试绿
(`--no-file-parallelism`)· tsc 0 · 十道 `check-*.mjs` 全 0 · 三份逐字节金标无回归。

## 交付

同一份 workflow 内容装到 Claude Code 或 codex,各自指名自己的原语。机制是第二族占位符
`{{ host.<primitive>[.<variant>] }}`,与既有 `{{ capabilities.<x>.cmd }}` 同族并挂同一个渲染点
—— **不新造模板引擎**。词表 `workflows/host-primitives{,.zh-Hans}.yaml`:14 primitive / 39 占位符。

四个交付面全部接入:

| 面 | 产物 | 接入点 | claude 侧保证 |
|---|---|---|---|
| S1 skills | `~/.claude/skills` / `~/.agents/skills` 下的 SKILL.md | `renderSkillTemplates.ts` pass 2/3 | 逐字节金标 en 91 / zh 62 条 |
| S2 命令体 | `~/.claude/commands` / `~/.codex/prompts` | `generateCommands.ts` | 逐字节金标 各 26 条 |
| S3 运行时 prompt | 交给 subagent 的 prompt | `prompt.ts` / `run.ts` | 逐字节金标 61 sub × 2 locale |
| B 能力注册表 | `Invoke <cmd>` 行 | `capabilities.yaml` 的 `by_host` + `pickHostValues` | 默认 `claude`,pre-65 调用点不传参即不变 |

配套:codex 产物插入宿主映射小节(claude 零字节);新门 `check-host-primitives.mjs` 断言 codex
产物在豁免区间外零 CC 原语;`check-skill-i18n-parity` 纳入 `host.*`;`check-yaml-i18n-parity` 守到三层。

## 立项前提被实测推翻 / 更正的(逐条)

1. **SPEC 的「57 文件 236 处」不完整**。实测另有 `CC-native` 97 / `teammate` 123 / `AskUserQuestion` 74 /
   `Claude Code` 64 / `~/.claude/` 13。其中 `CC-native Task / Agent tool` 只换后半句会渲染出
   `CC-native spawn_agent tool` 混血句。维护者拍板全部纳入(D4)。
2. **交付面是三面不是一面**(F1)。SPEC 的计数只覆盖 S1+S3;S2 的 CC 原语是 TS 字面量,且在 codex 上
   指向两处不存在的路径 —— 不纳入则 phase 目标不闭合。
3. **我的分类规则本身写错了**(D1)。「改动手段」(生成器 / 手改)与「粒度」(token / 整段)是**正交两轴**,
   不是互斥子类;生成器 span 内 140 处里有 44 处是整段语义。分工据此改为按交付面切。
4. **codex 不需要「退化为顺序执行」**(F4)。`multi_agent` v1 在本机 stable/enabled,工具族比 CC 还全
   (多 `wait_agent` / `list_agents` / `close_agent`)。SPEC 预设的降级路径没用上。
5. **`generateCommands.ts` 声称与生成器「MUST stay in lockstep」的注释在说谎**(D6)。逐字比对发现
   已漂移 5 处。改为同 primitive 两 variant 共存,漂移从「靠人维护」变成「同表相邻可见」。
6. **台账说要改、实测不该改的两处**:`disciplines/priority*.yaml` 的命中在行尾注释里(yaml parser
   剥除,且那个 key 压根不进 prompt)、`language.yaml:15`(`buildDisciplinesSection` 跳过整个 language
   discipline)。在那儿放占位符等于制造没人渲染的字面量泄漏。
7. **`Claude Code plugin` 不是宿主原语**(D5)。它是上游组件分发渠道的客观名称,套 `{{ host.name }}` 会
   造出「Codex plugin marketplace」这个不存在的事物;移出本 phase 并入 F8,由映射小节的 caveat 兜。

## 结构性冲突与裁决

- **marker ⇄ 逐字节金标**(F12):生成器 marker 字符串是产物的一部分,bump 必然改全部 hash。本 phase
  不 bump;政策写进脚本注释:将来确需 bump 时允许重录金标,**但必须同 commit 内用 diff 证明「除 marker
  行外零差异」**,否则重录就是在掩盖回归。
- **金标口径 ⇄ 未渲染的 locale sibling**(F11):en 安装下 `SKILL.zh-Hans.md` 被 `cp` 原样留下、不渲染
  也无人读(CC 只读 `SKILL.md`)。把它纳入字节锁会把「zh 源带上占位符」这一本意误判为回归 → 改口径,
  不改产品行为。副作用(安装目录留一份带未解析占位符的死副本)记 TODO。
- **新门 ⇄ `agentTeamsApiMigration` 门**:后者禁止整个 live surface 出现 `TeamCreate` / `TeamDelete`,
  而检测器必须持有这两个字面量(扫描器带特征库是必然)。新增 `DETECTORS` 豁免分类,并配一条断言把每处
  出现钉在「裸字符串数组元素」形态上 —— 祈使句仍然会红(已负向验证)。

## eval:唯一跑 dist 产物的覆盖

三份渲染金标跑的都是 **src**;CI 里 `node dist/cli.mjs eval --dir fixtures/eval` 是唯一跑**生产产物**
的地方。构建若把渲染链打歪(词表 yaml 查找路径、`getAssetsRoot()` 在 bundle 里解析到别处),
金标一律照绿,只有这里会红 —— 这条覆盖不是重复。

实施线先走了灰区协议:现有三种 step(`gates` / `checkpoint` / `file`)**没有一条经过宿主渲染路径**,
用它们拼 "codex scenario" 是假覆盖,并给了实测佐证(`HARNESSED_PLATFORM=codex` 跑 11/11 PASS,
对的却是 claude 下录的 golden)。裁决是加一个 `prompt` step 驱动 `buildPromptText`,它同时穿过三层:
role-prompt 的 `{{ host.* }}`、tools 段的 capability cmd(`by_host.codex`)、`## Language` 段的
preserve categories。

两个设计细节值得留:
- **`host` 刻意不做 step 字段** —— 给了的话 scenario 只能证明「这个参数能传」,证明不了
  「`HARNESSED_PLATFORM` → `detectPlatform()` → 渲染器」整条线接上了。
- **防塌陷断言**:两份 golden 都 PASS 不够。渲染链哪天不再问 host,两份会被重录成同样的字节、
  然后永远绿着却什么都没覆盖。故直接读两份提交在仓库里的 golden,断言 `claude !== codex` 并逐层
  spot-check。

## Lessons

- **给 subagent 的约束若引用项目记忆,必须先确认那条规则在当前上下文真的适用。** 我把「改 TypeBox
  schema 必须跑 `pnpm build && build:schema`」写进批 C 的 brief,但那条教训针对的是 manifest 的
  schema,而 capabilities 的定义在门脚本内部、`schemas/` 里根本没有它的产物。代价是**两次 8 小时空转**。
- **假死要靠活性证据判断,不能只看状态字段。** 三次卡死的共同症状:长时间 running + 工作树零落盘 +
  进程表里没有近期启动的子进程(说明连第一次工具调用都没落地)。用**最小任务探针**能区分「机制坏了」
  还是「这个 brief 坏了」—— 拆出最小的一块单独派,20 分钟跑完即证明是后者。
- **`git checkout --` 还原不了未跟踪文件。** 负向验证时往新门(尚未 commit)里插了一行再 checkout,
  以为还原了,实际残留 —— 幸好门自己红了才发现。未 commit 的文件要手工撤销并复验。
- **commit message 用 `-m` 内联时反引号会被 shell 当命令替换并静默吞掉内容**(已记项目记忆)。
