# ADR 0044 — 自动更新:consent 默认关 + 复用既有交接通道

- **Status**: Accepted(2026-11-04,经 gstack `/plan-ceo-review` 模式 SELECTIVE EXPANSION + 对抗性 spec review);**2026-11-04 原地 amend**(三轮评审后:canonical root 收口、冒烟/分片顺序修正、AC 计数同步 —— 逐条见「amend 记录」)
- **Date**: 2026-11-03 提出 / 2026-11-04 接受 / 2026-11-04 amend
- **Relates to**: ADR 0043(状态根跨宿主)、`TODOS.md`「自动检测新版本并自动更新」条、
  `.planning/phases/84-auto-update/CONTEXT.md`(本 ADR 的完整契约与验收标准在那边)
- **Milestone**: (无活动 milestone;维护者 2026-11-03 批准开发,2026-11-04 批准实现)

> **编号对照**:本 ADR 的 Decision 段用 ADR 自有的 D1-D12;phase 计划
> `.planning/phases/84-auto-update/CONTEXT.md` 的台账用另一套编号(维护者批准的 D1-D13 +
> 评审修补 R1-R23)。两套号**故意不同**(ADR 记「决定了什么」,phase 台账记「每条决策的证据与
> 批准来源」),对照关系:

| 本 ADR | phase 台账 | 内容 |
|---|---|---|
| D1 | CONTEXT D2 + R3 + R22 | consent 默认关 + 单一 reader + 与 enabled 独立 |
| D2 | CONTEXT D3 | 只覆盖 binary 通道 |
| D3 | CONTEXT D4 | 切换在后台 worker 里一次做完 |
| D4 | CONTEXT D8 | 交接复用 `spawnOwnedRefresh` |
| D5 | CONTEXT D5 | 交接只刷自有状态 |
| D6 | CONTEXT D9 | consent/status = 公开子命令 |
| D7 | CONTEXT R1 + R2 | 互斥门是 update lock(execPath),与宿主无关 |
| D8 | CONTEXT D6 + R5 | 限流只计完整失败,续传不消耗配额 |
| D9 | CONTEXT D7 + R4 + R23 | Range 续传契约 |
| D10 | CONTEXT R7 + R12 + D10 + D12 | 失败必须落到状态文件 + CRITICAL 处理 |
| D11 | CONTEXT R8 | restart 提示 + codex 信任闸门 |
| D12 | CONTEXT D10 + D11 | 慢链路可见性 |

| phase 台账(仅此几条无对应 ADR 段) | 内容 |
|---|---|
| R15 / R16 / R17 / R18 / R19 / R20 / R21 | canonical root / notice 一次性与字段归属 / 交接传路径 / status 两源合并 / `.part` 回收 / 注入缝 / worker context |
| D1 | 审查模式(不是产品决策,不进 ADR) |

## Context

### 问题

harnessed 的更新链路有「检测」和「替换」两半,缺的是「自动触发」:

- 检测 ✅:SessionStart hook → 后台 worker → 24h TTL 缓存
  (`src/compile/updateReminderEntrypoint.ts`、`src/cli/lib/updateReminderCache.ts`)
- 替换 ✅:`runBinarySelfUpdate` 全套 —— 下载 → sha256 → ed25519 签名 → `--version` 冒烟 →
  同卷 rename → 回滚 → `bin-backup/`(`src/cli/lib/selfUpdateBinary.ts`)
- 交接 ✅:`spawnOwnedRefresh` 让换上去的新 binary 刷新自有 skills/hooks
  (`src/cli/lib/ownedRefresh.ts:91`,手动路径 `src/cli/update.ts:140-141` 自 v5.0.8 在用)
- **触发 ❌**:只提醒不动手。真替换只在用户手动 `harnessed update` 时发生。

维护者 2026-11-03 的原话:「后期我们 harnessed 能自动检测新版本并更新吗」。

### 为什么这不是一个「加个开关」的小事

三个事实决定了它必须被当成独立设计来做:

1. **自动替换用户机器上的可执行文件是有副作用的动作**,必须有显式 consent。
2. **本机链路很慢**:99MB 资产在 157 KB/s 下要 ≈11 分钟
   ([measured: 2026-11-03 release asset 103,795,200 bytes])。
   后台跑 11 分钟的下载,必须能断点续传,必须让用户看得见进度。
3. **自替换是并发敏感的**:手动 `harnessed update` 与后台自动更新如果同时 rename
   同一个 execPath,轻则互相覆盖,重则落到「exec 路径上没有 binary」的状态。

## Decision

### D1 — consent 默认关,用 `update-reminder-preferences.json` 的 `autoUpdate` 字段表达

- 字段缺省 / 文件缺失 / 文件损坏 / **未知 `schemaVersion`** → 自动更新**关**(fail-closed)。
- `autoUpdate` 与既有的 `enabled`(提醒开关)**相互独立**:两个 consent 各自生效。
  这条同时修掉了一个坑 —— 如果自动更新要求 `enabled === true`,而
  `enabled` 在「文件缺失」与「文件存在」两种情况下的读法不同,用户开了自动更新
  却可能永远不触发。
- 唯一读取点:`src/cli/lib/updateReminderPreferences.ts`(新)。
  现有三处读法(`updateReminderEntrypoint.ts:92-119`、`refreshOwnedUpdate.ts:102-117`
  以及新逻辑)收敛到它;**字段语义与文件位置都统一**:
  文件位置由唯一的状态根解析函数给出(见 D7 的 canonical root),不再各算各的。

### D2 — 只覆盖 binary 通道

npm/bun 通道不自替换,只提醒。依据:`src/cli/lib/selfUpdateBinary.ts:193-195`
显式拒绝 `/node_modules/` 下的 binary;而且后台跑 `npm i -g` 会动用户的全局包树,
失败模型与 binary 自替换完全不同。

### D3 — 切换在后台 worker 里一次做完

worker 走完:观察 → 下载 → 校验 → rename → 交接 → 记状态 → 退出。
不引入「下载到暂存区、下次会话再切」的中间态。

依据:Windows 上 rename 一个正在运行的 exe 是可行的
(`src/cli/lib/selfUpdateBinary.ts:375` 的 `rename(deps.execPath, bakPath)`,
而 `deps.execPath` 就是运行中的 `process.execPath`,同文件 `:935`)——
手动 `harnessed update` 已在生产跑通这条路径。
(注:`src/cli/lib/selfUpdateBinary.ts:422-425` 的注释只证明 **delete 必然 EPERM**,
不证明 rename 可行,两者不可互证。)

### D4 — 交接复用既有的 `spawnOwnedRefresh`,不新增内部 op

换入成功后直接调 `spawnOwnedRefresh(process.execPath, context)`
(`src/cli/lib/ownedRefresh.ts:91`)。它 spawn 现在的 execPath 上的新 binary 并带
`--internal-owned-refresh`(`src/cli/lib/ownedRefreshFlag.ts:16`),
新 binary 在 `src/cli.ts:143-147` 走 `runOwnedRefreshEntry()` → `refreshOwnedUpdate(context)`。

**为什么不新增一条内部 op**:这条通道已经上线并被手动更新路径验证(v5.0.8 起)。
再造一条等于仓库里同时有两条做同一件事的交接路径,以后修一处忘一处。

### D5 — 交接只刷自有状态,不带上游组件

`harnessed update --all` 的 continuation 会连带更新上游组件(GSD skill pack 等)。
后台自动更新不跑那条路径:它要下载外部包、依赖网络、失败面大得多。

### D6 — consent/status 落点 = 公开子命令 `harnessed auto-update on|off|status`

维护者在知情后选择了公开面(可发现性优先)。代价明确承担:
公开顶层命令 32 → 33,且 **11 个 README locale** 的命令表各加一行
(`tests/docs/cli-surface.contract.test.ts:139-143` 钉死这两件事)。

### D7 — 互斥门是 update lock,不是 continuation 协议

自动更新全程持 `withUpdateLock({ target: execPath })`
(`src/cli/lib/updateLock.ts:327-348`),与手动路径同一把锁。
锁的 anchor 落在 exec 同目录 → **与宿主无关** → claude 与 codex 两个 worker
也互斥(claude/codex 的提醒缓存锁各锁各的,不能当互斥用)。
拿不到锁 = 本轮跳过,不下载。

**承重约束(amend 补记)**:锁的 anchor 也在 exec 同目录(`updateLock.ts:123-127`
用 `openSync(anchor,'a')`)→ **exe 目录必须可写**,否则取锁会抛 EACCES,而 worker 的
`catch {}` 会把它吞掉 → 零痕迹。所以「目录可写」预检必须排在取锁**之前**。

### D8 — 失败限流按「完整失败」计,续传不消耗配额

同一目标版本 24h 内最多一次完整失败(完整性/冒烟/换入/交接失败,或停滞且零新增字节)。
有进度中断(停滞但已有字节 / 网络断开)不算完整失败 → 不消耗配额,下次会话直接续传。
否则「11 分钟下到第 10 分钟断了」要等一天才��续。

### D9 — 断点续传按版本稳定的文件名做(amend 修正)

分片文件与冒烟目标**都用版本稳定名**(无 PID)→ 跨进程可续,且并发由 update lock 排除
(旧实现按 PID 命名的前提「没有锁、last-wins」已不成立)。
续传请求发 `Range: bytes=N-`:206 追加、200 截断重下、Content-Range 起点不符则丢弃重下、
416 视为分片已完整。

**不变式(amend 修正)**:已下载并验签的字节永远落在两个版本稳定名之一 ——
「未验签的分片」或「已验签未过冒烟」;**冒烟失败时要把字节改名回分片名,不能删掉**
(旧写法在冒烟失败时 unlink → 99 MB 白丢,「下次直接冒烟」的承诺落空)。
具体文件名与顺序细节在 phase 契约里(`CONTEXT.md` R4),ADR 只记这条不变式。

### D10 — 失败必须落到状态文件,不静默

`auto-update-status.json` 记进度、上次结果、最近 10 条历史。
其中「换入失败 **且** 回滚也失败」(`src/cli/lib/selfUpdateBinary.ts:392-399`)
是 CRITICAL:exec 路径上没有任何 binary。此时状态文件要写 restore 指令,
并且**自动关掉自动更新开关**,避免反复撞同一个墙。

### D11 — 公告固定带 restart 提示;codex 宿主的 hooks 受信任闸门限制

`refreshOwnedUpdate.ts:165-167,255-256` 每个 component 都标 `restartRequired: true`。
codex 侧 `codexHookTrust` 硬编码 `'deny'`(`refreshOwnedUpdate.ts:182-192`)
→ hook 重新注册落到 `trustPending` → status `retained`(`:242-254`)= **hook 实际没被刷新**。
所以公告要分宿主说清楚:claude 侧 hooks 已刷新;codex 侧 skills 已刷新、hooks 需要用户确认信任。

### D12 — 慢链路的可见性是功能的一部分,不是装饰

下载中把「已收字节 / 总量 / 速率」写进状态文件(≥5 秒一次,阶段切换时立即写),
`harnessed auto-update status` 看得到。一个不可见的 11 分钟后台下载,
是用户把这个功能关掉的头号理由。

## Consequences

**变好**

- 用户不需要记得更新;更新在后台完成,下次会话告知改了什么、要不要重启。
- 慢链路不再是「像卡死」:有进度、有速率、有续传。
- 与手动更新的互斥靠已有锁,不新增并发原语。
- 交接复用已上线的通道,不产生第二条交接路径。

**代价 / 风险**

- 二进制自动替换本身是供应链面:缓解手段是**合同级**的 sha256 + ed25519 签名
  (`src/cli/lib/updateSignature.ts`),且验签必须在执行之前(顺序不可调换)。
- 多了一个用户可见的公开命令 → 11 个 README locale 的文档债。
- 多了一个状态文件与一个 preferences 字段 → 两个新的持久化契约(都要带 schemaVersion)。
- 「exec 路径上没有 binary」这个最坏状态在自动更新路径上概率变高
  (无人值守)→ D10 的 CRITICAL 处理是必须的。

## 非目标

- 自动更新上游组件(D5)。
- npm/bun 通道自动更新(D2)。
- binary 体积瘦身(99MB,`TODOS.md` 另一条)。
- 回滚策略自动化(已有 `harnessed update --rollback`)。
- 跨版本复用下载分片。

## 验证

完整契约(状态文件 schema、status 输出格式、Range 续传改造细节、错误与救援表、
可判定的验收标准 AC1-AC15)见 `.planning/phases/84-auto-update/CONTEXT.md`。

## amend 记录(2026-11-04)

三轮对抗性 spec review(4/10 → 6/10 → 7/10)之后的原地修订。ADR 已 Accepted,
按仓库惯例(ADR 0043 的做法)原地 amend 并留档,不另开 supersede:

| 位置 | 改动 | 原因 |
|---|---|---|
| D1 | 「各自的 stateRoot 推导规则保留」→ 字段语义与文件位置**都统一**(唯一 canonical root 函数) | 三套 root 推导,有 override 时 CLI 认、codex 路径不认 → 写 A 读 B |
| D1 | 加上「未知 `schemaVersion` 也算关」 | 现有两个读者都要求 `schemaVersion === 1`;漏掉就是对未知 schema fail-open |
| D7 | 补「锁要求 exe 目录可写」这条承重约束 | 锁 anchor 也在 exec 同目录,不可写时取锁抛 EACCES 被 `catch {}` 吞掉 → 零痕迹 |
| D9 | 冒烟/分片顺序改为版本稳定名 + 冒烟失败改名回分片名(不删) | 旧写法在冒烟失败时 unlink → 99 MB 白丢,「下次直接冒烟」落空 |
| 验证 | AC1-AC13 → AC1-AC15 | 新增 AC15(canonical root 不变量) |
| — | 实现级细节(文件名、顺序)下沉到 phase 契约 | 同一实现细节两个家,一改就漂 |

### amend 记录二(2026-11-04,实施期)

实施时撞到两个**既有合同**(都有测试锁定),与 D1 的「唯一 canonical root」字面冲突。
读码确认后按「既有合同优先 + 明确偏离」处理,并在此留档:

| 位置 | 改动 | 原因 |
|---|---|---|
| D1 | canonical root 的适用范围收窄为 **auto-update consent 链路**(命令 → hook → worker);`refreshOwnedUpdate` 继续用 capture 到的 context 的 nativeHome | 该 reader 只决定「要不要重注册提醒 hook」(读 reminder consent),且它的既有合同就是「忽略环境漂移」;改它会回归 v16.0 的漂移保证 |
| D1 | codex hook 注册的优先级定为 **override > context 的 nativeHome** | 无 override 时逐字节不变(portable codex home 特性保留);有 override 时与 claude 侧对齐(D1 原意) |
| D6 | 入口闸门从「reminder consent」改为「`enabled \|\| autoUpdate`」 | 原闸门让 `enabled:false + autoUpdate:true` 的机器整条链不跑 ——「开了永不触发」。两个 consent 独立是 D1 的原意,闸门却只认了一个 |
