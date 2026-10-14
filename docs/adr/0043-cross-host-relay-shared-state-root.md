# ADR 0043 — 跨宿主接力:账本迁共享中立状态根 + 显式 `checkpoint adopt`

- **Status**: Proposed(待 gstack `/plan-eng-review` —— 本仓 CLAUDE.md 对「复杂架构」强制该关卡;
  这里动的是**状态持久化**,是整个引擎里最不该靠猜的那一层)
- **Date**: 2026-10-14
- **Amends**(不是推翻): `.planning/v9.0-cross-harness-ARCHITECTURE.md` §3d 第 2 条,
  以及 `.planning/milestones/v9.0-phases/28-codex-platform/28-CONTEXT.md` 把它列为非目标的那行。
  v9.0 的正文不改(沿用 ADR-0029 → 0038 → 0042 那条「以新 ADR 承载修正」的守恒做法)。
- **Relates to**: ADR 0040(宿主判定)、GitHub issue #10(槽位键 / 串槽)、
  v11.0 Phase 34(session 作用域复合键)、`TODOS.md`「跨宿主接力」条
- **Milestone**: (v16.0 收口后,无活动 milestone;维护者 2026-10-14 批准开发)

## Context

### 要改的那条,原文

`.planning/v9.0-cross-harness-ARCHITECTURE.md` §3d:

> - v9.0 does **NOT** auto-migrate state across platforms. Active platform = detected platform;
>   switching platforms = explicit re-`setup`. Documented, not silent.
>   (Avoids a cross-platform state-merge hazard for a rare action.)

**注意它禁的是什么**:*auto-migrate* / *silent*。它并没有禁止「显式迁移」—— 恰恰相反,
括号里给的理由由两个前提支撑,而**两个前提现在都变了**:

1. **「rare action」不再成立。** 维护者的真实工作流是:Claude Code 额度耗尽 → 切到 codex
   把同一个 leaf 接着跑完。这不是罕见动作,是额度周期内的常规动作。
2. **「state-merge hazard」有了针对性设计**(见下 Decision):显式命令、无隐式回退、
   并存不覆盖、撞键加后缀。v9.0 当时没有这套,所以它选择了保守的「不做」。

所以本 ADR 是**延伸**:保留「不自动、不静默」,新增一条**显式、带锁、非破坏性**的接力路径。
「Active platform = detected platform」也**保持不变** —— `adopt` 不改宿主判定,只搬账本里的一个槽位。

> TODOS 原条目写的是「需 ADR 推翻 v9.0 28-CONTEXT」。两处都要更正:规范源在
> ARCHITECTURE §3d(28-CONTEXT 只是引用它列非目标),且性质是 amend 而非 overturn。

### 现状(读码确认,非推测)

- 账本是**每宿主一份**:`workflows.json` 落 `harnessedFile(...)` → `getHarnessedRoot()` →
  `detectPlatform().stateRoot`,即 `~/.claude/harnessed/` 或 `~/.codex/harnessed/`。
  **这就是接力不成立的根因** —— 两个宿主各看一本账。
- 槽位键分两段(`src/checkpoint/workflowStore.ts`):
  - `repoKey(cwd)` = 最近的含 `.git` 的祖先目录,否则 resolved cwd。**宿主无关** ——
    同一个仓库在两个宿主上得到**同一个** repo 段。
  - `activeKey()` = `repoKey` 或 `repoKey::<sessionId>`,而 sessionId 取
    `detectPlatform().sessionIdEnv`(claude → `CLAUDE_CODE_SESSION_ID`,codex → `CODEX_SESSION_ID`)。
    **session 段必然跨宿主不同。**

### 新发现的隐患(本 ADR 的主要技术贡献)

`src/checkpoint/state.ts` 的读路径:

```js
return store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null
```

那个 `?? store.workflows[repoKey()]` 是 v11.0 Phase 34 加的**裸键回退**,为的是让「没有
session 作用域时启动的在途 workflow 仍然可见」。在**每宿主一本账**的今天它是安全的。

**账本一旦共享,它就变成隐式跨宿主采纳**:claude 侧写过的裸键槽位,会被 codex 会话
**静默捡起**并当成自己的在途工作流 —— 正是 issue #10 那类串槽的再现,也正是本设计
明文要防的「无隐式回退」。TODOS 的条目只写了「显式 `adopt`」,**没提这条回退必须同时封掉**;
不处理它,`adopt` 做得再严也绕不过去(用户根本不需要 adopt 就被串了)。

### 路径冲突(落位候选要改)

TODOS 给的 Windows 候选是 `%LOCALAPPDATA%\harnessed`。但**一行安装器已经在用它**:
`install.ps1` 装到 `%LOCALAPPDATA%\harnessed\bin\harnessed.exe`。把状态直接放在该根下,
会让「`harnessed update` 换 `bin/`」与「状态」共处一棵树 —— 更新逻辑一旦失手就可能伤到账本。
unix 侧则本来就不冲突(安装器用 `~/.local/bin`,与 XDG 状态目录是两棵树)。

## Decision

1. **共享中立状态根**,只放需要跨宿主共享的东西(账本及其锁),**不是**把整个 stateRoot 搬走:
   - unix:`${XDG_STATE_HOME:-~/.local/state}/harnessed/`
   - Windows:`%LOCALAPPDATA%\harnessed\state\`(**带 `state\` 子目录**,与安装器的 `bin\` 分开)
   - **绝不**用 `~/.harnessed` —— 它是遗留根,铁律禁止作为落位目标(4.28.0 真机实证:
     启动迁移会让落位物蒸发)。
2. **槽位记录写入宿主**:槽位结构新增 `host` 字段。缺失(迁移前写的)按**当前宿主**解释,
   保证旧账本读起来逐字节同义。
3. **裸键回退加宿主闸门**:`store.workflows[repoKey()]` 这条回退仅在
   `slot.host === 当前宿主`(或 `host` 缺失)时命中。跨宿主的裸键槽位**读不到** ——
   要用就得显式 `adopt`。这条是第 1 条的**前置**,不是可选项。
4. **显式 `harnessed checkpoint adopt [--from claude|codex]`**:无参数时若候选唯一则用它,
   多于一个则**拒绝并列出**,绝不猜。adopt 把来源槽位**复制**成当前宿主 + 当前 session 的键,
   **不删除**来源(可回头)。
5. **迁移并存、零覆盖**:老的每宿主账本保留原地;共享账本按需创建。撞键时**加 conflict 后缀**
   而不是覆盖,并在输出里点名两边。
6. **锁沿用 `proper-lockfile`**(已是依赖,且已被账本写路径使用),锁落共享根 ——
   跨宿主并发写同一本账是这条路**新引入**的并发面,必须有锁。

## Consequences

- `adopt` 之前,两个宿主互不可见 —— 与 v9.0 的用户体感一致,**不会**因为引入共享账本而
  让任何现有行为变得「自动」。
- 旧账本不动 ⇒ 回滚代价低:删掉共享根即回到今天的行为。
- 新增的并发面(两宿主同时写一本账)由锁覆盖;但**跨机器/网络盘**不在本 ADR 范围
  (`proper-lockfile` 在网络文件系统上的保证不足,不得默认支持)。
- 第 3 条会**改变一处现有读行为**:同宿主场景逐字节不变(`host` 缺失 → 当前宿主 → 照旧命中),
  只有「跨宿主裸键」这一新情形被拒。需要一条反证测试:构造一个标了别的 `host` 的裸键槽位,
  断言读不到。

## 未决(交给 `/plan-eng-review`)

- 共享根里**只放账本**,还是连 `checkpoints/` 证据一起?证据跨宿主共享有价值,但体量与
  清理策略不同,本 ADR 倾向第一步只搬账本。
- `adopt` 之后来源槽位的生命周期:保留(当前倾向)/ 标记为已被接管 / 由用户另一条命令清理。
- 是否需要 `harnessed status` 显示「另一宿主有可接管的槽位」—— 可发现性 vs 噪音。
