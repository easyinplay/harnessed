# ADR 0043 — 跨宿主接力:只读跨根拷贝 + 显式 `checkpoint adopt`

- **Status**: Accepted(2026-10-15,经 gstack `/plan-eng-review`)
- **Date**: 2026-10-14 提出 / **2026-10-15 大幅改写并接受**
- **改写说明**: 本 ADR 从未进入 Accepted,`/plan-eng-review` 否决了它原本提案的
  「共享中立状态根」。按 ADR 不可变性**只在 accepted 之后生效**,此处原地改写
  而非另开一份 supersede。原提案的三条 Decision 见下「被否决的原提案」节,
  连同否决理由一并留档 —— 其中一条**不只是多余,是有害的**,这是本 ADR 最重要的记录。
- **Amends**(不是推翻): `.planning/v9.0-cross-harness-ARCHITECTURE.md` §3d 第 2 条,
  以及 `.planning/milestones/v9.0-phases/28-codex-platform/28-CONTEXT.md` 把它列为非目标的那行。
- **Relates to**: ADR 0040(宿主判定)、GitHub issue #10(槽位键 / 串槽)、
  v11.0 Phase 34(session 作用域复合键)、`TODOS.md`「跨宿主接力」条、
  `.planning/phases/67-cross-host-relay-adopt/`(实现计划)
- **Milestone**: (v16.0 收口后,无活动 milestone;维护者 2026-10-14 批准开发)

## Context

### 问题

维护者的真实工作流:Claude Code 额度耗尽 → 切到 codex 把**同一个 leaf** 接着跑完。
今天不成立,根因是账本每宿主一份:`workflows.json` 落 `harnessedFile(...)` →
`getHarnessedRoot()` → `detectPlatform().stateRoot`,即 `~/.claude/harnessed/` 或
`~/.codex/harnessed/`。两个宿主各看一本账。

### 要 amend 的那条,原文

`.planning/v9.0-cross-harness-ARCHITECTURE.md` §3d:

> - v9.0 does **NOT** auto-migrate state across platforms. Active platform = detected platform;
>   switching platforms = explicit re-`setup`. Documented, not silent.
>   (Avoids a cross-platform state-merge hazard for a rare action.)

它禁的是 *auto-migrate* / *silent*,并没有禁止「显式迁移」。括号里的理由由两个前提支撑,
而两个前提都变了:(1)「rare action」不成立 —— 这是额度周期内的常规动作;
(2)「state-merge hazard」有了针对性设计(见 Decision)。
「Active platform = detected platform」**保持不变**:`adopt` 不改宿主判定。

### 槽位键的现状(读码确认)

`src/checkpoint/workflowStore.ts`:

- `repoKey(cwd)` = 最近的含 `.git` 的祖先目录,否则 resolved cwd。**宿主无关**。
- `activeKey()` = `repoKey` 或 `repoKey::<sessionId>`,sessionId 取
  `detectPlatform().sessionIdEnv`。**session 段必然跨宿主不同。**

读路径(`src/checkpoint/state.ts:101`):

```js
return store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null
```

那个 `?? store.workflows[repoKey()]` 是 v11.0 Phase 34 加的**裸键回退**。

## 被否决的原提案(留档)

原提案三条核心 Decision:(1) 账本搬进共享中立状态根
(unix `${XDG_STATE_HOME:-~/.local/state}/harnessed/`、Windows `%LOCALAPPDATA%\harnessed\state\`);
(2) 槽位新增 `host` 字段;(3) **给裸键回退加宿主闸门**,并称其为第 1 条的「前置而非可选」。

`/plan-eng-review` 逐条否决:

1. **共享根不必要。** 同一目标可用「只读跨根拷贝」达成,少花一个 innovation token:
   不建新根、不搬账本、不动任何读路径、不改锁语义。原方案要改的面是 15+ 文件
   (含 10 份 README 与 schema regen),拷贝方案是 4 文件量级的核心 + 测试。
2. **`host` 字段随之失去消费者。** 账本不共享 ⇒ 槽位不会混宿主。
3. **第 3 条有害,不是多余。** `state.ts:101` 的裸键回退**正是**被接管槽位在后续
   任意会话里唯一可达的通路。给它加宿主闸门会**亲手打断它要启用的那条接力**。
   原文把它写成「前置」,这个判断是错的,此处显式更正。

另外两条原提案遗漏,被审查揪出:

- **裸键回退不止一处,共 6 处同形**:`state.ts:101` · `workflowStore.ts:151`(`readIntent`)·
  `cli/checkpoint.ts:112` · `cli/checkpoint.ts:308-309`(同时删两个 intent 键)·
  `injectStateMain.ts:151` · `bin/harnessed-inject-state.mjs:599`(**dep-free 手抄件**,
  读 `workflows.json` 不做 `Value.Check`)。原提案只提了第一处。共享账本下,
  那个手抄件会把另一宿主的在途 workflow 注进本宿主每一轮 prompt。
- **共享根不在测试沙箱覆盖内**:`HARNESSED_ROOT_OVERRIDE` 只替换**已解析宿主**的
  `stateRoot`(`platform.ts:177-178`)。新根若自行从 `XDG_STATE_HOME` / `LOCALAPPDATA` 算,
  3296 个用 override 重定向的测试会开始往真实用户目录写。

## Decision

**`harnessed checkpoint adopt [--from claude|codex]` = 只读跨根单向拷贝。**

1. **不建共享根、不搬账本、不动任何读路径。** 6 处裸键回退原样保留。
   issue #10 那类跨宿主串槽按构造仍然关着:每个宿主只读自己那本账。
2. **跨根严格只读是承重不变量。** 全程不写源根。这是本方案便宜的全部原因:
   不必跨根加锁、不必管对端 harnessed 版本、不可能写坏别人的账本。
   必须有断言守护:**任何** adopt 路径(含每条拒绝)之后,源根文件内容与 mtime 逐字节不变。
3. **目标键是裸 `repoKey`,不是 `activeKey()`。** 写 `activeKey()` 则下个会话
   复合键与裸键双 miss,接力只活一个会话;而重跑 `adopt` 会从源头拉回**接力前**的旧状态,
   丢掉上个会话的进展 = 数据丢失。
4. **接力语义是「一个会话」,`adopt` 结尾显式预告。** 首次 `checkpoint complete`
   读裸槽、写复合键(`state.ts:125`)必然把槽位叉开,裸槽从此冻结。跨会话续跑的限制
   与同宿主原生多会话行为**一致**,不引入新语义,因此不为它加槽位字段或改热写路径。
5. **写路径走既有 `mutateStore()`,不给 `state.ts` 加任何导出。** 14 个测试文件
   工厂 mock 该模块(STATE invariant 明载:`vi.mock` factory 模块禁加新导出)。
   `mutateStore` 自带 `withLock`,锁目标恰为**目标根**(源只读,不该锁)。
   拒绝 = 在回调里 throw:`withLock` 的 `try/finally`(`state.ts:82-86`)保证放锁且
   `writeStoreRaw` 未执行,TOCTOU 免疫。
6. **回调内显式盖 `updated_at`。** `mutateStore`(`:191-198`)不像
   `writeCurrentWorkflowUnlocked`(`:114`)那样盖。不盖则槽位带**源宿主**时间戳,
   跨日接力(周额度重置)会让 codex 第一轮就吃 `injectState.ts:81,104-107` 的
   >24h「疑似废弃运行」告警。
7. **宿主自识别:`--from` 等于解析出的宿主 → 硬拒 + 点名依据。** 双宿主目录俱在且无
   `.platform` pin 时,裸终端解析为 claude(`platform.ts:214-217` incumbent 优先),
   `--from claude` 会成 src==dest 自拷。依据由 `resolveHostWithReason()` 提供,
   `detectPlatform()` 的契约不变。
8. **候选匹配精确两段 + 显式排除 `::displaced-`。** 多候选(多 `::sid`)
   **拒绝并列出,绝不猜**。
9. **目标槽位占用处置**:`active` → 锁内 throw 拒绝(点名两个 phase + 两条出路);
   `paused` → 先把被顶掉的槽位归档到 `repoKey::displaced-<ts>` 再写;
   `complete` / 无槽 → 直接写。热读路径**不认** `::displaced-*`,这是对的:它不该被注入。
   归档键需配修剪 —— `src/cli/gc.ts:165` 只扫安装备份与编译产物,`src/` 里没有任何
   `delete store.workflows[...]`,无修剪则 map 单调增长,数周内「歧义拒绝」变成常态。
10. **不搬证据文件,`last_checkpoint_path` 原样保留。** 它是绝对路径
    (`engineHook.ts:35` / `template.ts:69` 由 `harnessedSubdir('checkpoints')` 拼),
    同机同用户可读,`resume.ts:49` 逐字读即可用。而 `template.ts:69` 的 `complete`
    不传 `customPath`,下一条 `complete` 就在目标根写同名文件、指针自然转正。
    拷贝的唯一窗口只剩「源根被删 + 尚未 complete + 此时 resume」。
11. **源槽位不动** + 结尾点名警告并给出清理命令(在源宿主侧跑)。换掉它就要写源根,违反第 2 条。
12. **源账本缺失与损坏必须分辨。** `readStoreAt` 继承 `readStoreRaw` 的 CD-5 fail-soft
    (`workflowStore.ts:126-134`),照搬会把「账本坏了」报成「源宿主没账本」,
    用户永远不知道自己的账本坏了。fail-soft 适合被动注入路径,不适合用户亲手敲的命令。
13. **`retro_meta` 取 `max(src, dest ?? 0)` 带走;`intents` 不带。**
    `retro_meta` 按裸 `repoKey` 键、是仓级节奏(`cli/checkpoint.ts:524-538`、`cli/retro.ts:17`),
    归零会静默重置一个将要触发的 retro 提醒;`intents`(`workflowStore.ts:41-64`)
    是单轮调用面包屑且被 `checkpoint start` 吸收,带过去只会让 codex 吃别人的 freestyle nag。
14. **目标宿主未 setup 时拒绝。** 账本不是 codex 唯一需要的:`commandsDir` / `skillsDir`
    (`platform.ts:134-137`)只有 `harnessed setup --platform codex`(`setup.ts:58,68-88`)才填。
    无此前置,happy path 是「adopt 说 OK,codex 没有命令可跑」。
15. **`--from` 候选必须从单一导出的宿主 id 清单派生,不得新造字面清单。**

    > **更正(2026-10-15,T2/T3 执行中实测)**:本条原文写「从 `PLATFORMS`(`platform.ts:145`)派生」。
    > **`PLATFORMS` 不存在。** `platform.ts` 该处是一句注释,其下是**私有未导出**的
    > `descriptorById(id, home)` —— 一次返回一个描述符,不是可枚举清单。全仓
    > `rg PLATFORMS src/` 只有 `preflight.ts` 的 `SUPPORTED_PLATFORMS`(OS 名,无关)
    > 与 `setup.ts` 的 `KNOWN_PLATFORMS`(而它本身就是本条要消除的手写清单之一)。
    > 所以**今天没有可派生的东西**,结论因此加强而非削弱:T4/T6 需新增一个导出的
    > id 清单,并让 `setup.ts` 的 `KNOWN_PLATFORMS` 消费它,把三份手写清单**收敛成两份**,
    > 而不是只是「不做第四份」。

    现存三份手写宿主枚举(用构造名而非行号,行号会随改动漂移 —— T3 已让其中一处从
    `:199` 移到 `:288`):`resolveHost` 里 `.platform` pin 探测的二元数组
    `[codexDescriptor(home).stateRoot, base.stateRoot]` · `setup.ts` 的 `KNOWN_PLATFORMS` ·
    `setup.ts` 里按 `platform === 'codex'` 分支写死两种顺序的 `[own, other]` 对。
    将来加 gemini 时,派生清单的那条自动跟上。

### 前置缺陷(必须先修)

`repoKey` 在 win32 不归一大小写:实测 `path.resolve` 完整保留大小写含盘符,
同一目录用 `d:\` 与 `D:\` 进入就是两个独立槽位,在途 workflow 静默消失。
**这不是 adopt 特有,是既存缺陷**,且必须排在 adopt 之前 —— 修了之后,
adopt 侧「匹配时临时归一」这条补丁就成为死代码。

## Consequences

- `adopt` 之前两宿主互不可见,与 v9.0 的用户体感一致。**没有任何现有行为变得「自动」。**
- 不动读路径 ⇒ 回滚代价近乎为零:删掉这个子命令即回到今天的行为。
- 不引入跨宿主并发写 ⇒ 不新增并发面(这是否决共享根省下的最大一块)。
- 接力限本会话(Decision 4)。这是 Phase 34 会话隔离的既有代价,非本特性引入。
- `resume` 的措辞成为接力后第一眼可见的瑕疵:`resume.ts:83` 硬编码
  `→ in Claude Code: /gsd-execute-phase`,`:81` 把拷来的 CC `session_id` 当
  「SDK will redirect to original session」广告。Phase 65 的
  `scripts/check-host-primitives.mjs` 只扫 `workflows/**/SKILL.md` 与 yaml,
  **扫不到 TS 运行时字符串**,所以闸门看不见这处。随本 phase 修,闸门盲区另记 TODO。
- 跨机器 / 网络盘不在范围。WSL ⇄ Win32 的 repo 键前缀完全不同 ⇒ 退化为「无候选」,
  即今天的行为,降级安全。

## 原三个未决项的答案

1. **共享根里只放账本还是连 `checkpoints/` 一起?** 问题消失:不建共享根。
   证据文件也不拷(Decision 10)。
2. **`adopt` 之后来源槽位的生命周期?** 保留不动 + 点名警告(Decision 11)。
   任何「标记来源」的做法都要写源根,违反只读不变量。
3. **是否让 `harnessed status` 显示「另一宿主有可接管的槽位」?** 不做。
   要么把跨根探测塞进 status 热路径,要么无从得知;可发现性由 `adopt` 的拒绝文案点名代偿。
