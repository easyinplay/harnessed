# Phase 84 — 自动检测 + 自动更新(binary 通道)

- **Status**: reviewed(2026-11-04,经 gstack `/plan-ceo-review` 模式 SELECTIVE EXPANSION + 对抗性 spec review 两轮)
- **Date**: 2026-11-03 提出 / 2026-11-04 修订(两轮)
- **来源**:`TODOS.md`「自动检测新版本并自动更新」条(维护者 2026-11-03 提问 → 同日批准开工)
- **Relates to**: ADR 0043(状态根跨宿主)、v5.0.12 自更新慢链路修复、`TODOS.md`「binary 体积 99MB」条

> **本文件是决策与契约的 SoT**。错误与救援表、失败模式登记表在 `ERRORS.md`;
> 测试图与实施任务在 `TASKS.md`。研究证据在 `findings.md`;决策记录在
> `docs/adr/0044-auto-update-consent-and-handover.md`。
>
> **编号约定**:只有一套 `D` 编号(维护者批准的决策)与一套 `R` 编号(评审挖出的必要修补,
> 不是新范围 —— 它们是让已批准的 D 真的成立的最小改动)。

## Context

### 问题

harnessed 的更新链路有「检测」和「替换」两半,缺的只是「自动触发」:

| 半边 | 现状 | 位置 |
|---|---|---|
| 检测 | SessionStart hook → 后台 worker → 24h TTL 缓存 | `src/compile/updateReminderEntrypoint.ts:121-166`、`src/cli/lib/updateReminderCache.ts:3` |
| 替换 | 下载 → sha256 → ed25519 签名 → `--version` 冒烟 → 同卷 rename → 回滚 → `bin-backup/` | `src/cli/lib/selfUpdateBinary.ts:184-436` |
| 交接 | 换完由新 binary 刷新自有 skills/hooks | `src/cli/lib/ownedRefresh.ts:91-136`(手动路径 `src/cli/update.ts:140-141` 自 v5.0.8 在用) |
| **触发** | **只提醒不动手** | `src/cli/updateReminderHookMain.ts:42-52`、`src/cli/updateReminderWorkerMain.ts:50-60` |

维护者 2026-11-03 的诉求:「后期我们 harnessed 能自动检测新版本并更新吗」。

### 硬约束(读码确认)

1. **consent 默认关**。`enabled` 的缺省语义是「文件不存在 = 开」
   (`src/compile/updateReminderEntrypoint.ts:111`),`autoUpdate` 必须**缺省 false**。
2. **binary 通道才谈得上自替换**。npm 通道被显式拒绝
   (`src/cli/lib/selfUpdateBinary.ts:193-195`,`/node_modules/` → refused)。
3. **Windows 上可以 rename 掉正在运行的 exe**。证据:`src/cli/lib/selfUpdateBinary.ts:375`
   的 `rename(deps.execPath, bakPath)`,而 `deps.execPath` 就是运行中的 `process.execPath`
   (同文件 `:935`)—— 手动 `harnessed update` 已在生产跑通。
   (`:422-425` 的注释只证明 **delete 必然 EPERM**,不证明 rename 可行。)
4. **同目录同卷**。临时文件与续传分片必须落在 exec 同目录。
5. **公开命令面被合同钉死**:`tests/docs/cli-surface.contract.test.ts:140` 钉死公开顶层
   命令 **32** 个,`:141-142` 要求每个都在 **11 个 README locale** 的命令表里有对应行。
   先例:`inject-state` 注册了但被排除在公开面外(`:94`)。
6. **compiled 入口的 op 分派在资产解包之前**:`src/compile/entry.ts:50-59` 先分派
   `update-reminder` / `update-reminder-worker`,解包在 `:61-99`,`import('../cli.js')` 在 `:101`。
   → 后台 worker 运行时**没有** assets;要读 `getAssetsRoot()` 的逻辑必须在解包之后。
7. **两个宿主的 stateRoot 不同**:`src/platform/platform.ts:92`(claude `~/.claude/harnessed`)
   与 `:132`(codex `~/.codex/harnessed`)。→ consent 与配额**按宿主分开**。
8. **update lock 的 anchor 在 exe 同目录**(`src/cli/lib/updateLock.ts:118-121`)→
   锁**与宿主无关**,但**要求 exe 目录可写**(`ensureAnchor` 在 `:123-127` 用 `openSync(anchor,'a')`)。

## Decision ledger

### 维护者批准的决策

| ID | 契约 | 证据 | 状态 | 批准来源 |
|---|---|---|---|---|
| D1 | 审查模式 = SELECTIVE EXPANSION | — | approved | 2026-11-03 AskUserQuestion |
| D2 | consent 默认关,用 `autoUpdate` 字段表达 | 硬约束 1 | approved | 同上 |
| D3 | 只覆盖 binary 通道 | 硬约束 2 | approved | 同上 |
| D4 | 切换发生在后台 worker 里(换完再退) | 硬约束 3 | approved | 同上 |
| D5 | 交接只刷自有状态,不带上游组件 | continuation 只接受 `scope:'all'` | approved | 同上 |
| D6 | 失败限流:同宿主同版本 24h 内最多一次**完整失败** | 硬约束 7 | approved | 同上 + CEO plan |
| D7 | 慢链路要能断点续传(Range) | 99MB @ 157 KB/s ≈ 11 min | approved | CEO plan |
| D8 | 交接通道 = **复用** `spawnOwnedRefresh` | `src/cli/lib/ownedRefresh.ts:91` | approved | 2026-11-04 重开(机制已存在) |
| D9 | consent/status = **公开子命令** `harnessed auto-update` | 硬约束 5 | approved | 2026-11-04 重开(维护者知情选公开面) |
| D10 | 下载可见性:进度写状态文件 + status 命令 | 11 分钟后台零反馈 | approved | 2026-11-03 第二轮 AskUserQuestion |
| D11 | 更新公告:CHANGELOG 摘要 + restart 提示 | CHANGELOG 已在包内 | approved | 同上 |
| D12 | 失败历史保留最近 10 条 | 区分偶发与持续失败 | approved | 同上 |
| D13 | doctor 不单独加行(status 命令已覆盖) | — | deferred | HOLD 三查 |

### 对抗性 spec review 的必要修补(非新范围)

| ID | 修补 | 轮次 | 修的是 |
|---|---|---|---|
| R1 | 自动更新全程持 `withUpdateLock`(target = execPath) | 1 | D2/D4 可执行性 |
| R2 | 跨宿主互斥由 execPath 锁提供(提醒锁各锁各的,不能当互斥) | 1 | D6 |
| R3 | preferences 单一 reader;`autoUpdate` 与 `enabled` 独立 | 1 | D2 |
| R4 | Range 续传改造契约 | 1 | D7 可实现性 |
| R5 | 限流只计完整失败,续传不消耗配额 | 1 | D6 与 D7 的冲突 |
| R6 | exec 目录可写预检(**必须在取锁之前**) | 1 | 失败可诊断性 |
| R7 | 「换入失败 **且** 回滚也失败」= CRITICAL + restore 指令 + 自动关开关 | 1 | D4 失败面 |
| R8 | 公告固定含 restart 提示;codex 信任闸门单独说明 | 1 | D11/D5 |
| R9 | 换完调 `gcCompiledArtifacts` 清 `.bak` | 1 | D4 卫生 |
| R10 | 新增文案走 `t()`,补两个 catalog | 1 | 全部 UI 文案 |
| R11 | worker **不新增 argv flag**,自己重读 preferences | 1 | D2 |
| R12 | 状态文件 schema + status 输出格式契约 | 1 | D10 |
| R13 | `build:hooks` + `bin/` drift 门禁进验收 | 1 | 验收门禁 |
| R14 | CHANGELOG 摘要由**新 binary 在交接时**算 | 1 | D11 |
| R15 | canonical state root + `auto-update --platform` + 配额按宿主 | 2 | S1/C1/F10 |
| R16 | notice 一次性消费 + 字段归属 + 原子合并写 | 2 | F2/F4 |
| R17 | 交接时显式传「状态文件绝对路径」与 `from` 版本 | 2 | F3 |
| R18 | `status` 命令 = preferences + 状态文件两源合并 | 2 | C3/F6 |
| R19 | gc 顺带清 `.harnessed-update-<ver>.part` | 2 | F5 |
| R20 | 编排层留 `spawnOwnedRefresh` 注入缝 | 2 | S3 |
| R21 | worker 用 `captureHostInstallContext({ hostId })` | 2 | F11 |
| R22 | 损坏的 preferences → `enabled:false`(与现有两个读者一致) | 2 | C2 |
| R23 | `fetchAsset` 需支持自定义请求头(Range);Content-Range 不匹配 → 丢弃重下 | 2 | F8/C5/S2 |
| R24 | 状态文件写失败 / preferences 写失败要登记进两张表;worker 侧写失败至少有 stderr 一行(不进 stdout) | 3 | C-1 |
| R25 | 半成品 notice(`to` 为空)视为 pending:hook 不打印,只留作诊断 | 3 | C-2 |
| R26 | 交接的状态文件路径走 env 继承(`process.env.HARNESSED_AUTO_UPDATE_STATUS_PATH` → `withHostInstallEnv` 继承 `process.env`,win32 分支只删 pins 键);命令要自己 `mkdir(stateRoot)` | 3 | L-4 |
| R27 | setup 的写入规则写成 `enabled = (显式 --no-update-reminder ? false : (既有 enabled ?? true))`,显式 flag 优先 | 3 | L-3 |
| R28 | ADR 0044 原地 amend:同步 canonical root(R15)、冒烟/分片顺序(R4)、AC 计数、锁要求 exe 目录可写;实现级细节下沉到本文件 | 3 | K-2/K-3/4.1 |

## Decisions(逐条展开)

### D1 — 审查模式

SELECTIVE EXPANSION:守住原有 scope,把 4 个候选项(D10-D12 + 通道边界)摆给维护者逐项裁决。

### D2 — consent 默认关

`update-reminder-preferences.json` 增加 `"autoUpdate": true`。缺省 / 字段缺失 / 文件损坏 = 关(fail-closed)。

### D3 — 只覆盖 binary 通道

npm/bun 通道不自替换,只提醒。判据:`identity.channel === 'binary'`。
status 要显示 `skipped: npm channel (auto-update needs the binary channel)`。

### D4 — 切换发生在后台 worker 里

worker 走完:预检 → 取锁 → 观察 → 下载 → 校验 → 换入 → 交接 → 记状态 → 退出。

### D5 — 交接只刷自有状态

不跑上游组件更新(GSD skill pack 等)。只刷 harnessed 自有 skills/hooks。

### D6 — 失败限流(按宿主)

同一宿主、同一目标版本,24h 内最多一次**完整失败**的自动尝试。
手动 `harnessed update` 不受限流。配额状态存在该宿主的 state root 里 → **按宿主分开**
(硬约束 7:claude 与 codex 是两个 root)。两个宿主都装着时,第二个宿主的尝试会因
「已是当前版本」而是无操作(update lock 也保证两次 rename 不交错)。

### D7 — 断点续传

后台跑,链路慢是常态(实测 11 分钟)。断了要从已有字节续。改造契约见 R4 + R23。

### D8 — 交接通道:复用 `spawnOwnedRefresh`

**不新增内部 op**。换入成功后直接调 `spawnOwnedRefresh(process.execPath, context)`
(`src/cli/lib/ownedRefresh.ts:91`):它 spawn 现在 execPath 上的新 binary 并带
`--internal-owned-refresh`,新 binary 在 `src/cli.ts:143-147` 走 `runOwnedRefreshEntry()`
→ `refreshOwnedUpdate(context)`。这条路径与手动更新完全一致,已被 v5.0.8 起的生产验证。
**且它走 `src/cli.ts` 主路径(在 `src/compile/entry.ts` 的资产解包之后)→ 新 binary 确实能读到新 assets。**

### D9 — consent/status 落点:公开子命令

`harnessed auto-update <on|off|status>`,并支持 `--platform <claude|codex>`(与
`harnessed update` 一致,见 `src/cli/update.ts:71`)。
**代价**:公开顶层命令 32 → 33,11 个 README locale 的命令表各加一行。维护者知情后选定。

- `on`:read-modify-write preferences,写 `autoUpdate: true`(保留既有 `enabled` 与其它键;
  文件不存在时写 `{schemaVersion:1, enabled:true, autoUpdate:true}`)。
- `off`:置 `autoUpdate: false`。
- `status`:两源合并输出(R18),`--json` 输出合并结果。

### D10 — 下载可见性

下载中把「已收字节 / 总量 / 速率」写进状态文件,`harnessed auto-update status` 看得到。
写盘节流:≥5 秒一次,或阶段切换时立即写。

### D11 — 更新公告

自动更新成功后,下一次 SessionStart 提示包含:版本号变化 + CHANGELOG 该版本段落摘要
(≤1200 字符)+ restart 提示。**只打印一次**(R16)。摘要由新 binary 在交接时算(R14)。

### D12 — 失败历史

状态文件 `history` 保留最近 10 条,超出丢最旧。

### D13 — doctor 不单独加行

status 命令已覆盖。已记入 `TODOS.md` 的延后项。

### R1 — 自动更新全程持 update lock

```ts
const locked = await withUpdateLock(
  { stateRoot: context.platform.stateRoot, target: updateTarget().target },
  async () => { /* 观察→下载→校验→换入→交接→记状态 */ },
)
if (locked.status === 'busy') { /* 记 skipped:busy,本轮结束,不下载 */ }
```
与手动路径(`src/cli/update.ts:73-76`、`src/cli/lib/updateCoordinator.ts:639`)同一把锁、同一 target
→ 手动更新与自动更新互斥,两个 rename 不会交错。

### R2 — 跨宿主原子性

提醒缓存锁按宿主分开(`update-reminder-${host}.json`),**不能当互斥用**。
互斥必须来自 execPath 锁:`updateLock.ts:118-121` 的 anchor 落在 exec 同目录 → 与宿主无关。
限流判定放在锁内 → 同宿主内无 TOCTOU。

### R3 / R22 — preferences 单一 reader + consent 独立

新增唯一读取点 `src/cli/lib/updateReminderPreferences.ts`:

```ts
export interface UpdateReminderPreferences {
  enabled: boolean      // reminder consent
  autoUpdate: boolean   // auto-update consent;仅当字段严格 === true
  unreadable: boolean   // 文件存在但解析失败
}
export function readUpdateReminderPreferences(path: string): UpdateReminderPreferences
```

规则(逐条与现有两个读者对齐):
1. 文件缺失(ENOENT)→ `{ enabled: true, autoUpdate: false, unreadable: false }`
   (对齐 `updateReminderEntrypoint.ts:111` 的 ENOENT → true)
2. 文件存在但 JSON 非法 → `{ enabled: false, autoUpdate: false, unreadable: true }`
   (**对齐** `updateReminderEntrypoint.ts:101-111` 与 `refreshOwnedUpdate.ts:110-116`
   的「损坏 → 关」;这是 fail-closed)
3. 文件能解析但 **`schemaVersion !== 1`** → 同 2(`unreadable: true`,两个 consent 都关)。
   现有两个读者都要求 `schemaVersion === 1`(`updateReminderEntrypoint.ts:103-106`、
   `refreshOwnedUpdate.ts:113`)→ 未知 schema 一律 disabled。**这条不能漏**:
   少了它,一个 `schemaVersion: 2` 的文件会被新 reader 判为「enabled」= 对未知 schema fail-open。
4. 解析成功且 schema 正确 → `enabled = (value.enabled === true)`,
   `autoUpdate = (value.autoUpdate === true)`;非 boolean 或缺字段 → false
5. 永不抛异常;只开一次文件。

`autoUpdate` **不依赖** `enabled`:两个 consent 各自生效。
(reader 只接路径;路径由调用方给 —— 见 R15 的 canonical root。)

### R4 / R23 — Range 续传改造契约

改 `src/cli/lib/selfUpdateBinary.ts`:

| 环节 | 契约 |
|---|---|
| 分片文件名 | `<execDir>/.harnessed-update-<targetVersion>.part`(**版本稳定、无 PID** → 跨进程可续)。同版本并发由 R1 的锁排除 |
| **N 的唯一拥有者** | `downloadTo` 在发请求前 `stat` 一次 `.part`,得到 N;**同一个值**同时喂给 Range 头构造与写入器(决定 append/truncate 与 `received` 初值)。不许 stat 两次、不许两处各算 |
| Range 头 | 由 `fetchAsset` 发出 → 它需要新增「已有字节数 / 额外请求头」入参(它现在硬编码 `{accept:'application/octet-stream'}`,`selfUpdateBinary.ts:711-713`)。`fetchAsset` 的第二个调用点(校验和文本)用默认值(不发 Range、不带已有字节数) |
| 206 响应 | 校验 `Content-Range` 起点 == N:相等 → 追加写(`createWriteStream(dest,{flags:'a'})`);**不等 → 抛可区分错误 `RangeMismatchError`** → 调用方删 `.part`、把已有字节数归零、**继续重试循环**从头重下(不能 break 掉整次下载) |
| 200 响应 | 服务端不支持 Range → 截断重写(`flags:'w'`),`received` 归零 |
| 416 响应 | 服务端说 Range 不可满足 → 说明分片**已经完整** → 跳过下载,直接进校验 |
| 计数初始化 | `received` 从 N 起算;速率按本次尝试的 elapsed 算 |
| 停滞 | 停滞 = 本次尝试的判决(保留 `TransferStalledError` 语义),但**允许进入重试循环**并从 `.part` 续(不再「抛出不重试」) |
| 换 URL | 主 URL 与备 URL 之间切换时,`.part` 的字节数**只在服务端对同一资产语义一致时才沿用**;206 起点不符即按上面规则丢弃重下 |
| **冒烟目标名** | `<execDir>/.harnessed-update-<targetVersion><ext>`(**版本稳定,不再用 PID**)。旧注释 `selfUpdateBinary.ts:201-202` 的「PID 唯一,因为没有锁、last-wins」前提已不成立:所有真实更新路径都持 per-exec-path 的 update lock(`src/cli/update.ts:73-76`、`src/cli/lib/updateCoordinator.ts:639`)。win32 的 `fs.rename` 不覆盖已存在的目标 → 目标已存在时先 unlink |
| 顺序 | 下载/续传 → `.part` → **在 `.part` 上验 sha256 + ed25519** → rename `.part` → 冒烟目标名 → `--version` 冒烟 → 换入 |
| **冒烟失败** | 把冒烟目标 **rename 回 `.part`**(字节留给下次),**不要 unlink**(现 `selfUpdateBinary.ts:366` 会 unlink → 99 MB 白丢);rename 失败则留在原地,交给 gc |
| 不变式 | 已下载并验签的字节**永远落在两个版本稳定名之一**:`.part`(未验签)或 `.harnessed-update-<version><ext>`(已验签未过冒烟)。下次尝试直接复用,不重下 |
| 清理 | 成功换入后删两个名字;**完整性失败删 `.part`**;停滞/网络失败保留 `.part`;冒烟失败 rename 回 `.part` |
| 演练缝 | `HARNESSED_UPDATE_SOURCE_DIR` 路径**绕过 `.part`**(本地 copy 直接落到冒烟目标名),不参与续传语义 |
| 总量 | `Content-Length`(206 时用 `Content-Range` 的总长) |

### R5 — 限流与续传的边界

- 「完整失败」= 完整性失败 / 冒烟失败 / 换入失败 / 交接失败 / 停滞且**零新增字节** → 计入配额。
- 有进度中断(停滞但已有字节 / 网络断开)→ **不消耗配额**,下次会话直接续传。
- 配额键 = (宿主, 目标版本号)。

### R6 — 可写预检(排在取锁之前)

顺序固定:**预检 → 取锁 → 下载**。
`execDirWritable(execPath)`(`src/cli/lib/selfUpdateBinary.ts:969-976` 已存在)不可写 → 立即中止,
不浪费 11 分钟下载,状态记 `exec-dir-readonly`。
**必须在取锁之前**:update lock 的 anchor 也在 exe 同目录(`updateLock.ts:123-127`
用 `openSync(anchor,'a')`),目录不可写时取锁会抛 EACCES,而 `acquireUpdateLock` 的 catch
只处理 ELOCKED(`:321-324`)→ 异常上抛 → worker 的 `catch {}` 吞掉 → **零痕迹**。

### R7 — 双失败 CRITICAL 路径

`src/cli/lib/selfUpdateBinary.ts:392-399` 的「temp→exec 失败 **且** 回滚也失败」→
exec 路径上没有任何 binary。必须:
- 状态文件记 `swap-critical` + 完整 restore 指令(同 `:396-398` 措辞);
- 下次会话的提示把这条顶到最前面;
- **自动关闭** `autoUpdate`(避免反复撞同一个墙),status 里说明。

### R8 — restart 提示 + codex 信任闸门

- 公告固定含「重启 Claude Code / Codex 让新 hooks 生效」(按宿主切换措辞)。
- codex:`refreshOwnedUpdate.ts:182-192` 把 `codexHookTrust` 硬编码 `'deny'` → hook 重新注册
  走 `trustPending` → status `retained`(`:242-254`)= **hook 实际没被刷新**。
  → 验收拆 claude / codex 两条;codex 记 `handover-trust-pending`,公告与 status 明说。

### R9 — `.bak` 卫生(修正:原写法是空操作)

`gcCompiledArtifacts` 的 `.bak-*` 清理分支被 `if (opts.execPath)` 包着
(`src/cli/gc.ts:162-176`)→ **传 `execPath: null` 时这一段根本不执行**。
`src/cli/update.ts:158` 的 `execPath: null` 正是为了「不清理本次刚产生的 .bak」。
→ 正确调用:`gcCompiledArtifacts({ keepVersions: [from, to], stateRoot, execPath: process.execPath })`
→ 历史 `.bak-*` 被扫掉;当前这一个因是运行映像而 EPERM(fail-soft,`gc.ts:170-173`),
由下一次调用清理。

### R10 — i18n

新增用户可见文案走 `t()`(`src/i18n/index.js`),`messages/en.json` 与 `messages/zh-Hans.json`
同步补 key,`tests/unit/i18n-parity.test.ts` 绿(两边 key 集合必须完全相等)。

### R11 — worker 不新增 argv flag

`resolveUpdateReminderRuntime`(`src/compile/updateReminderEntrypoint.ts:26-45`)遇任何未登记
flag 都 `return null` → `runUpdateReminderWorkerEntrypoint` 随即静默 `return 0`
→ 整条提醒/自动更新链路哑火且无日志。
→ consent 由 worker **自己重读 preferences 文件**。加测试锁住「未知 flag → runtime null」。

### R12 — 状态文件 schema

`<stateRoot>/auto-update-status.json`:

```json
{
  "schemaVersion": 1,
  "consent": { "autoUpdate": false, "enabled": true },
  "channel": "binary",
  "installed": "5.0.12",
  "latest": "5.0.13",
  "state": "idle",
  "progress": { "received": 0, "total": 0, "updatedAt": 0 },
  "lastResult": { "version": "5.0.13", "status": "failed", "reason": "integrity", "message": "", "at": 0 },
  "history": [],
  "notice": { "from": "5.0.12", "to": "5.0.13", "changelog": "", "restart": "Claude Code", "at": 0, "consumedAt": 0 }
}
```

`state`:`idle | downloading | verifying | swapping | handover | updated | failed | skipped`。
`reason`:`network | timeout | http | parse | publishing | integrity | smoke | swap | swap-critical |
exec-dir-readonly | handover | handover-trust-pending | busy | npm-channel`。

### R13 — `bin/` drift 门禁

改了 `src/compile/updateReminderEntrypoint.ts` 就必须 `corepack pnpm build:hooks` 重生成
`bin/harnessed-update-reminder*.mjs` 并提交;CI 有 `git diff --exit-code bin/` 硬门禁。

### R14 — CHANGELOG 摘要在交接时算

compiled worker 跑在资产解包**之前**(`src/compile/entry.ts:50-59` 先于 `:61-99`),
拿不到新 assets;新 binary 才有。所以摘要在**新 binary 的交接过程**里算:
`--internal-owned-refresh` 走 `src/cli.ts` 主路径(解包之后)→ 读
`getAssetsRoot()/CHANGELOG.md` → 按版本取该版本 section(扩展现有
`src/cli/update.ts:175-189` 的 `changelogTop()` 为按版本取,≤1200 字符)→ 写进状态文件的 `notice`。

### R15 — canonical state root(单一真相源)

现有**三套**推导:
- worker / hook:`src/compile/updateReminderEntrypoint.ts:50-52`
  (`HARNESSED_ROOT_OVERRIDE || join(nativeHome,'harnessed')`)
- CLI 平台层:`src/platform/platform.ts:236-241`(`detectPlatform()`;**认** override,
  但 `captureHostInstallContext` 走的是 `descriptorForConfiguredHome`,**不认** override)
- codex hook 注册:`src/installers/codexHookAdd.ts:65-74`(`reminderStateRoot`;
  用 `context.platform.stateRoot`,**不认** override)

无 override 时三者实际一致(claude `~/.claude/harnessed`、codex `~/.codex/harnessed`);
有 override 时 **CLI 认、codex 路径不认** → 写 A 读 B。

→ **新增唯一函数** `src/platform/stateRoot.ts`:

```ts
export function canonicalStateRoot(hostId: 'claude' | 'codex'): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE?.trim()
  if (override) return resolve(override)
  const nativeHome =
    hostId === 'codex'
      ? process.env.CODEX_HOME?.trim() || join(homedir(), '.codex')
      : process.env.CLAUDE_CONFIG_DIR?.trim() || join(homedir(), '.claude')
  return resolve(join(nativeHome, 'harnessed'))
}
```

**五个消费点全部改用它**:
1. `src/compile/updateReminderEntrypoint.ts` 的 `stateRoot`(显式 `--state-root` 仍然优先 ——
   它是显式指令)
2. `src/installers/codexHookAdd.ts` 的 `reminderStateRoot`
   (无 override 时算出的值与今天**逐字节相同** → 已安装的 hook 命令字面量不变,
   不需要重新注册;有 override 时与 claude 侧对齐)
3. `src/cli/lib/refreshOwnedUpdate.ts` 的 reader 调用
4. `harnessed auto-update on|off|status` 命令
5. 后台 worker(经 runtime 拿到的 `stateRoot`)

**实施期修正(2026-11-04,见 findings.md F-11)**:
- 消费点 3 **不改**:`refreshOwnedUpdate` 继续用 capture 到的 context 的 nativeHome。
  它的既有合同(有测试锁定)就是「忽略环境漂移」,而它读的是 reminder consent
  (决定要不要重注册提醒 hook),不是 auto-update consent。auto-update consent
  链路(消费点 1/4/5)才是 canonical 的。
- 消费点 2 的优先级:**override > context 的 nativeHome**。无 override 时逐字节不变
  (portable codex home 特性保留),有 override 时与 claude 侧对齐(R15 原意)。

→ **命令的默认宿主 = `detectPlatform().id`**(`src/platform/hostInstallContext.ts:57` 有先例),
  `--platform <claude|codex>` 显式覆盖。
  理由:若默认 claude(像 `updateReminderEntrypoint.ts:23` 那样),只装 codex 的机器上
  `auto-update on` 会写进 `~/.claude/harnessed`,而 codex worker 读 `~/.codex/harnessed`
  → 「开了永不触发」的老坑原样复活。
→ 命令输出**打印:本次写入的宿主 + preferences 路径 + status 文件路径** → 偏差当场可见。
→ 双宿主机器:命令按 `detectPlatform()` 的答案写一次;要写另一个宿主的根就显式
  `--platform codex`。README 的命令行注明这一点。
→ 已知偏差(无法消除,只能暴露):`CLAUDE_CONFIG_DIR` / `CODEX_HOME` 在 CLI 进程与
  hook 进程里不同(终端 env vs 会话 env)→ 根不同。打印路径是缓解。

### R16 — notice 一次性 + 字段归属 + 原子合并写

- `notice` 增加 `consumedAt`。hook 打印后把 `consumedAt` 置为当次时间并原子写回 →
  **公告只打印一次**(hook 每次 SessionStart 都跑,否则 CHANGELOG 摘录会每次会话重复刷屏)。
- 字段归属:**worker 独占** `progress` / `lastResult` / `history`;**新 binary 独占** `notice`。
- 两者都走「读 → 合并自己的字段 → 写 tmp → rename」的原子协议(tmp+rename,同
  `src/cli/updateReminderWorkerMain.ts:74-76`),后写者不会抹掉对方的字段。

### R17 — 交接时显式传递路径与 from 版本

`runOwnedRefreshEntry`(`src/cli/lib/ownedRefresh.ts:59-73`)不知道旧版本号(from),
也不知道 worker 的状态文件路径;`withHostInstallEnv` 设的 `HARNESSED_ROOT_OVERRIDE` 是
`context.platform.stateRoot`(`src/installers/lib/runClaudeArgs.ts:39`),未必等于 worker 的
entrypoint root。
→ worker 在 spawn 交接**之前**先把 `notice.from` 预写进状态文件;
→ 交接用 **env 变量传状态文件的绝对路径**(如 `HARNESSED_AUTO_UPDATE_STATUS_PATH`),
  新 binary **不许自己推导路径**,只往那个绝对路径写 `notice` 字段。

### R18 — status 命令 = 两源合并

`harnessed auto-update status` 的数据来源:
- **consent / channel** ← preferences 文件(R3 的 reader)+ 运行时 channel
- **installed / latest / state / progress / lastResult / history / notice** ← 状态文件

合并优先级:状态文件缺失 → 用 preferences 合成的最小视图(见 R12 的输出格式),
不报错。`--json` 输出合并结果。

### R19 — `.part` 回收

gc(`src/cli/gc.ts`)目前只扫 `.bak-*`(`:162-176`),完全不知道 `.harnessed-update-<ver>.part`
→ 每次换版本都留一个 99MB 的垃圾。
→ gc 顺带扫 exe 同目录的 `.harnessed-update-*.part`,删除版本 ≠ 当前目标版本的文件
  (版本号 ≤ 已安装版本的一并删)。

### R20 — 编排层的注入缝

`spawnOwnedRefresh` 自己支持 `deps.spawn`(`src/cli/lib/ownedRefresh.ts:81-83`),
但编排层(`src/cli/lib/autoUpdate.ts`)必须能**注入** `spawnOwnedRefresh` 本身,
否则 AC2 只能靠真 spawn 一个 binary 来断言。

### R21 — worker 的 context 来源

`realSelfUpdateDeps(context)`(`src/cli/lib/selfUpdateBinary.ts:927-967`)需要
`context.platform.stateRoot`(写 bin-backup)与 `nativeHome`。
→ worker 用 `captureHostInstallContext({ hostId: runtime.identity.host })`,
**不要**让 `detectPlatform` 去猜宿主(否则 bin-backup 会写到另一个 root)。

### R23 — fetchAsset 的头参数与 Range 不匹配

见 R4 表内两行。`fetchAsset` 需要新增「已有字节数 / 额外请求头」入参;
`Content-Range` 起点 ≠ 已有字节数 → 丢弃 `.part` 从 0 重下。

## 非目标(Non-goals)

- 自动更新上游组件(D5)
- npm/bun 包通道的自动更新(D3)
- binary 体积瘦身(99MB,`TODOS.md` 另一条)
- 回滚策略自动化(已有 `harnessed update --rollback`)
- `stop-hook` 身份的 2027-02-03 移除计划
- doctor 单独加一行(D13)
- 跨版本复用下载分片(`.part` 按版本命名,R19 只做回收)

## What already exists(复用清单)

| 已有物 | 位置 | 本 phase 怎么用 |
|---|---|---|
| `withUpdateLock` | `src/cli/lib/updateLock.ts:327-348` | R1 的互斥门(含跨宿主) |
| `runBinarySelfUpdate` | `src/cli/lib/selfUpdateBinary.ts:184` | 下载/校验/冒烟/换入/回滚 |
| `execDirWritable` | `src/cli/lib/selfUpdateBinary.ts:969` | R6 预检 |
| `spawnOwnedRefresh` | `src/cli/lib/ownedRefresh.ts:91` | D8 交接通道 |
| `gcCompiledArtifacts` | `src/cli/gc.ts` | R9 清 `.bak`、R19 清 `.part` |
| `changelogTop` | `src/cli/update.ts:175` | R14 按版本取(扩展它,不新开模块) |
| `realSelfUpdateDeps` | `src/cli/lib/selfUpdateBinary.ts:927` | 组装 deps(`deps.log` 是进度写盘的口子) |
| `updateTarget` | `src/cli/lib/updateCoordinator.ts:233` | 锁的 target |
| `captureHostInstallContext` | `src/platform/hostInstallContext.ts` | R21 worker 的 context |
| 提醒缓存 + 24h TTL | `src/cli/lib/updateReminderCache.ts` | 检测侧不动 |

## Dream state delta

```
CURRENT STATE                THIS PLAN                       12-MONTH IDEAL
手动看到提醒 → 手动          后台自动换好,下次会话告知      「工具自己会保养自己」:
harnessed update(11 分钟     (全程有状态可查,失败会说话)     组件级自动更新 + 渠道统一
 可能失败,报错指错地方)                                   + 二进制瘦身
```

## Acceptance Criteria(可判定断言)

| # | 断言 |
|---|---|
| AC1 | `autoUpdate` 缺省或为 false 时:worker **不发起任何资产下载请求**(元数据请求仍会发生)、**不写** `auto-update-status.json`、提醒缓存内容与基线逐字节相同 |
| AC2 | claude 宿主 + `autoUpdate:true` + 有新版本:资产被下载 → sha256 + ed25519 通过 → execPath 换成新 binary → **注入的** `spawnOwnedRefresh` stub 被调用 → 状态 `updated` + `notice` 写入 |
| AC3 | 续传:stub 的是 `fetchImpl`(不是 `downloadTo`)。对已有 `.part`(N 字节)返回 206 → 落盘 == 旧 N 字节 + 新增字节;返回 200 → 落盘 == 仅新内容(截断);返回 206 但 `Content-Range` 起点 ≠ N → 丢弃 `.part` 从 0 重下 |
| AC4 | 完整性失败:execPath 字节不变、状态 `reason=integrity`、同一版本 24h 内第二次尝试 **不发起资产下载请求** |
| AC5 | npm 通道 + `autoUpdate:true`:不发生自替换(无资产下载),状态 `skipped` + `npm-channel` |
| AC6 | `harnessed auto-update status` 输出与 R12/R18 契约逐字段一致;状态文件缺失时输出 preferences 合成的最小视图;`--json` 等于合并结果 |
| AC7 | 自动更新后**下一次**会话的提示包含:版本号变化 + CHANGELOG 段落(≤1200 字符)+ restart 提示;codex 场景额外含信任提示;**再下一次会话不再重复打印** |
| AC8 | 连续 12 次失败 → `history` 保留最新 10 条 |
| AC9 | 锁被占时:无资产下载,状态 `skipped` + `busy` |
| AC10 | 换入双失败:状态 `swap-critical`、含 restore 指令、`autoUpdate` 被自动关闭 |
| AC11 | 门禁:`pnpm exec biome check --write` 干净;`pnpm typecheck` 干净;`corepack pnpm build:hooks` 后 `git diff --exit-code bin/` 干净;i18n parity 绿;`scripts/check-*.mjs` 全绿;相关 vitest 全绿 |
| AC12 | 公开命令面:合同测试的公开顶层命令计数 32 → 33,且 11 个 README locale 各有一行 `\| \`harnessed auto-update\` \|` |
| AC13 | 本机实测(发布门):开着 consent 跑一次真实自动更新 → 版本号变化、claude 侧 skills/hooks 被刷新、status 显示 updated;`harnessed update --rollback` 仍可用 |
| AC14 | 公告的落点一致:交接后状态文件里的 `notice` 与下次会话打印的内容一致(根路径一致,见 R15/R17) |
| AC15 | 同一 hostId 下,`harnessed auto-update on` 写入的 preferences 路径 == 后台 worker 读取的路径;命令打印的宿主与两个路径可核对 |

> AC13 不用 `HARNESSED_UPDATE_SOURCE_DIR` 演练缝验收:该缝
> (`src/cli/lib/selfUpdateBinary.ts:215-236`)**跳过版本比对**、走本地 copy、
> 并**跳过 ed25519 验签**(`:333`),只能证明「本地文件被换掉」。

## Unresolved Decisions

无。D1-D13 与 R1-R28 全部已裁定或已定为必要修补。三轮对抗性 spec review 的全部
findings 都已落进本文件或 `ERRORS.md` / `TASKS.md` / ADR 0044。

## ENG REVIEW — 2026-11-04(gstack `/plan-eng-review`,评审对象 = 实施后的工作树)

### Scope Challenge(范围挑战)

- **复杂度**:8 个新模块 + 14 个改动文件 + 11 个 README locale + `bin/` 产物。
- **结构问题(D1)**:用户选定 **A(保持原结构)** —— 8 个新模块各自单一职责,
  `changelogSection` 独立是为 compiled worker 体积,`notice`/`status` 关注点分离,
  `stateRoot` 作为可 grep 的单一真相源。
- **模式**:scope accepted as-is(无 feature 裁剪)。
- **现实性行(REALITY)**:

```
REALITY: premise-table pass — 7 条承重前提逐条对源码核过(consent 默认关 / 只 binary 通道 / per-exec-path 锁 / 交接复用 spawnOwnedRefresh / compiled 入口先分派后解包 / 新 binary 持有新 assets / 状态文件路径走 env),unverified=0 .planning/phases/84-auto-update/CONTEXT.md:334
REALITY: already-done pass — origin/main 上搜不到本功能的任何实现(空 log),不是重复建设 src/platform/stateRoot.ts:1
REALITY: surface-check pass — `harnessed auto-update --help` 的子命令/参数与注册一致(on|off|status + --platform + --json) src/cli/autoUpdateCmd.ts:263
REALITY: binding-decisions pass — CEO review(SELECTIVE EXPANSION)的 8 条已批准范围与实现一致;2026-10-15 的 Eng SCOPE_REDUCED 决策(ADR-0043 共享状态根)不涉及本功能(本功能按宿主分根,不共享) docs/adr/0044-auto-update-consent-and-handover.md:195
REALITY: numbers pass — 公开命令 33(合同测试断言)/ README locale 11(逐文件 rg 计数 = 1)/ AC 15 / history 10 / 配额 24h / 停滞 120s / 摘录 1200 字符,全部从源码与测试重新数过 tests/docs/cli-surface.contract.test.ts:140
REALITY: deferred-asks pass — TODO 的三问(consent 开关 / 后台调度 / 慢链路续传)与两风险(切换时机 / 失败后状态一致性)全部落地;唯一未覆盖的是 npm/bun 通道自替换,那是维护者显式裁剪(D3) TODOS.md:302
REALITY: pr-count pass — 单波单模块,1 个 PR(仓内无 .gstack/ship-policy.json → 默认一波一个 PR) src/cli/lib/autoUpdate.ts:1
```

### 1. 架构评审(Architecture)

1. **[P2] (confidence: 9/10) `src/cli/updateReminderHookMain.ts:104-109` + `src/cli/lib/updateReminderCache.ts:109`** —
   自动更新那一轮的**节奏被提醒缓存的 24h TTL 卡住**:`shouldRefreshReminder` 只在缓存
   缺失 / state='unknown'(1h retry)/ 超过 24h TTL 时为真,所以 worker 一轮跑完后,
   之后 24 小时里 worker 根本不启动 → 断流后磁盘上的 `.part` 无人续传。
   R5 与 `ERRORS.md:35` 写的是「下次会话直接续传」,实现给的是「下次刷新窗口(≤24h)」。
   本机实测链路 157 KB/s、99 MB ≈ 11 分钟 → 一次断流的代价是一整天。
   **处置:D2 决策 = A(状态文件驱动节奏)** → 状态文件新增 `hasResumableAutoUpdateWork()`
   (`src/cli/lib/autoUpdateStatus.ts`),hook 读到可续传痕迹就唤醒 worker;
   `[resumable]` 标记从 `autoUpdate.ts` 迁到状态模块(写者与读者都要它)。
   回归测试:`tests/cli/lib/autoUpdateStatus.test.ts`(5 例)、
   `tests/cli/autoUpdateNoticeHook.test.ts`(2 例:可续传 → 唤醒;完整失败 → 不唤醒)。
2. **[P2] (confidence: 9/10) `src/cli/lib/autoUpdateStatus.ts:341`(评审前)** —
   D3 要求 status 显示 `skipped: npm channel (auto-update needs the binary channel)`,
   实现只印 `(npm-channel)` → npm 通道的用户看到一个没有解释的代码。
   **处置:已批准契约的直接落地** → `formatAutoUpdateStatus` 加 `REASON_TEXT` 映射,
   npm 通道渲染成 `npm channel — auto-update needs the binary channel`。
   回归测试:`tests/cli/lib/autoUpdateStatus.test.ts` 新增 1 例。
3. **交接的 env 路径(R17)核对通过**:`withHostInstallEnv`
   (`src/installers/lib/runClaudeArgs.ts:43-49`)只删/覆盖 pin 键,其余 env 原样继承 →
   `HARNESSED_AUTO_UPDATE_STATUS_PATH` 一定到达新 binary;新 binary 只按该路径写公告,
   不自己推导根 → override 场景下公告也落对文件。
4. **锁的语义核对通过**:锁 anchor 在 exec 同目录(`updateLock.ts:118-121`),
   `stateRoot` 参数不参与路径构造 → override 场景下「状态文件在 override 根、
   锁在 exec 目录」不冲突。手动 `harnessed update` 与自动更新共用同一把锁 ✓。
5. **入口 gate 修正(实施期发现,评审确认)**:`enabled || autoUpdate`
   (`src/compile/updateReminderEntrypoint.ts:135-141`)是「两个 consent 独立」的必然结果,
   原先只认 reminder consent → 「开了永不触发」。

### 2. 代码质量评审(Code Quality)

1. **[P3] (confidence: 8/10) `src/cli/lib/autoUpdateStatus.ts:305`(评审前)** —
   `isAutoUpdateInProgress` 只有测试引用,生产代码无人调用 → 删掉(连同它的 15 分钟
   窗口常量与 4 条测试)。**处置:已删**,不留「也许以后用」的 API。
2. **共享代码**:三个新模块(`autoUpdateStatus` / `autoUpdateNotice` /
   `autoUpdateHandover`)各有单一职责且被 ≥2 个调用点使用;没有发现值得抽取的重复
   (status 文件的读写只有一处 `readAutoUpdateStatus`/`writeAutoUpdateStatus`)。
3. **错误处理**:`autoUpdateHandover` / `writeAutoUpdateNoticeForNewBinary` 全部 fail-soft
   (交接失败不撤销已成功的换入);`runAutoUpdate` 的每个失败分支都写状态文件,
   CRITICAL 分支额外关掉 consent 并给 restore 指令 ✓。

### 3. 测试评审(Test Review)

```
CODE PATHS                                          USER FLOWS
[+] src/cli/lib/autoUpdate.ts (编排)                 [+] 用户开/关授权
  ├── consent 关 → skipped(不写任何文件)               ├── [★★★ TESTED] on/off 写 preferences(保留其他键)
  ├── 通道 != binary → skipped(npm-channel)            ├── [★★★ TESTED] status 合并两源 + 打印三条路径
  ├── 配额命中 → skipped(rate-limited)                 └── [★★  TESTED] --json 单对象输出
  ├── exec 目录不可写 → failed(exec-dir-readonly)
  ├── 取锁 busy → skipped(busy)                      [+] 自动更新跑一轮
  ├── 自更新 updated → 写公告骨架 → 交接               ├── [★★★ TESTED] 编排全分支(autoUpdate.test.ts)
  │   ├── 交接 ok → state updated                     ├── [★★★ TESTED] 续传 .part/206/200/416(stream 测试)
  │   └── 交接失败 → 记录 handover 原因,不回滚          ├── [★★★ TESTED] 锁 busy / 配额 / CRITICAL
  ├── 自更新 current/refused → skipped                └── [GAP]        真实 binary 通道端到端(发布门)
  └── 失败 → 记录原因;CRITICAL → 关 consent + restore
[+] src/cli/lib/autoUpdateStatus.ts (状态文件)        [+] 公告只出现一次
  ├── 读:损坏/版本不符 → null                          ├── [★★★ TESTED] 打印一次 + consumedAt
  ├── 写:临时文件 + rename(原子)                       ├── [★★★ TESTED] 半成品(to 为空)不打印不消费
  └── 可续传痕迹 → hook 唤醒 worker(D2)                 └── [★★★ TESTED] 缺/坏状态文件不炸
[+] src/cli/lib/autoUpdateNotice.ts (公告)
  ├── 可打印 = to 非空 且 consumedAt === 0
  └── 消费 = 原子写回 consumedAt
[+] src/cli/updateReminderHookMain.ts (hook)
  ├── 公告打印 → 消费
  ├── 提醒文案(enabled 时)
  └── 唤醒 worker(提醒到期 或 有可续传痕迹)
[+] src/compile/updateReminderEntrypoint.ts (入口)
  ├── 闸门 = enabled || autoUpdate
  └── 状态根 = canonicalStateRoot(host)
[+] src/platform/stateRoot.ts (单一真相源)
  ├── override 优先
  └── 否则 nativeHome/harnessed

COVERAGE: 24/26 paths tested (92%)  |  Code paths: 19/21 (90%)  |  User flows: 5/6 (83%)
QUALITY: ★★★:21 ★★:3 ★:0  |  GAPS: 2 (1 真机端到端 = 发布门, 1 本机实测待发布)
```

- 唯一真 gap:AC13 的真实 binary 通道端到端 —— **只能在 v5.0.13 发布后发生**
  (被自动替换的 binary 必须自带本功能),已写进 `task_plan.md` 的待办。
- 门禁证据:vitest **5514 通过 / 0 失败**(439 文件);`tsc --noEmit` 干净;
  `pnpm build` + `build:hooks` 成功(`bin/` 已重生成);biome 硬门 **0 blocking**;
  `scripts/check-*.mjs` 9 个全 0;i18n parity 绿;`tests/docs/cli-surface.contract.test.ts` 绿。

### 4. 性能评审(Performance)

- hook 每次会话多读一次状态文件(<1 KB JSON)—— 可忽略。
- 状态文件写入是「临时文件 + rename」,不在 SessionStart 的热路径上。
- worker 每次多出的网络请求只在**有可续传痕迹时**发生(D2 的代价,已在决策里认领)。
- 没有循环里的 N+1、没有无界缓存、没有缺超时的阻塞调用。

### 失败模式

| 路径 | 真实的生产失败 | 覆盖 | 用户看到什么 |
|---|---|---|---|
| 换入 | 换入与回滚都失败(exec 路径无 binary) | 编排单测(CRITICAL 分支) | `swap-critical` + restore 指令 + consent 自动关 |
| 下载 | 慢链路停滞 | 停滞守卫 + `.part` 保留 | 进度行 + 「已收字节/用时/平均速率」 |
| 断流 | 续传时服务器 Range 语义不符 | `RangeMismatchError` → 丢弃重下(fetchAsset 的 retryable 分支) | 自动从头重下,不报错 |
| 交接 | 新 binary 写不出公告 | `writeAutoUpdateNoticeForNewBinary` fail-soft + 单测 | 换入照常成功,只是没有公告 |
| 公告 | 半成品公告(`to` 为空) | hook 不打印不消费 | 无公告(不谎称版本变了) |
| 锁 | 手动更新与自动更新同时跑 | per-exec-path 锁 | 一个拿不到锁 → `busy` 跳过 |

**critical gap:0** —— 每个失败类都有测试或错误处理,没有「静默失败且无测试」的组合。

### 决策台账

| ID | 选项 | 结论 | 来源 |
|---|---|---|---|
| D1 | A 保持 8 个新模块 / B 收拢成 5 个 | **A** | 用户 2026-11-04 |
| D2 | A 状态文件驱动续传节奏 / B 接受 24h 并改措辞 | **A** | 用户 2026-11-04 |

### Implementation Tasks

- [x] **T1 (P2, human: ~2h / CC: ~20min)** — hook — 状态文件驱动续传节奏
  - Surfaced by: Architecture F1 — 24h TTL 卡住自动更新节奏
  - Files: `src/cli/lib/autoUpdateStatus.ts`, `src/cli/updateReminderHookMain.ts`,
    `src/cli/lib/autoUpdate.ts`, `tests/cli/lib/autoUpdateStatus.test.ts`,
    `tests/cli/autoUpdateNoticeHook.test.ts`
  - Verify: `pnpm exec vitest run tests/cli/lib/autoUpdateStatus.test.ts tests/cli/autoUpdateNoticeHook.test.ts`
- [x] **T2 (P2, human: ~30min / CC: ~5min)** — status 输出 — D3 的 npm 通道说明
  - Surfaced by: Architecture F2 — 裸 `(npm-channel)` 没有解释
  - Files: `src/cli/lib/autoUpdateStatus.ts`, `tests/cli/lib/autoUpdateStatus.test.ts`
  - Verify: 同上
- [x] **T3 (P3, human: ~15min / CC: ~5min)** — 死代码 — 删 `isAutoUpdateInProgress`
  - Surfaced by: Code Quality F1 — 只有测试引用的导出
  - Files: `src/cli/lib/autoUpdateStatus.ts`, `tests/cli/lib/autoUpdateStatus.test.ts`
  - Verify: `pnpm exec tsc --noEmit` + vitest
- [x] **T4 (P3, human: ~30min / CC: ~10min)** — README — 说明默认宿主 = 检测到的那个
  - Surfaced by: Scope Challenge(R15 的「README 注明这一点」未被满足)
  - Files: `README.md` + 10 个 locale
  - Verify: `pnpm exec vitest run tests/docs/cli-surface.contract.test.ts`
- [ ] **T5 (P2, human: ~1h / CC: ~10min,发布后)** — 真机 — binary 通道端到端自动更新
  - Surfaced by: Test Review — AC13 的唯一真 gap
  - Files: 无(发布门的人工步骤)
  - Verify: 开着 consent 跑一次真实自动更新 → 版本变化 + hooks 刷新 + status updated + rollback 可用

### NOT in scope

- npm/bun 通道自替换 —— 维护者显式裁剪(D3),只提醒不换。
- codex hook 信任的自动批准 —— R8:信任必须由用户确认,公告里已给出提示。

### What already exists(复用而非重建)

| 已有物 | 位置 | 本次怎么用 |
|---|---|---|
| `spawnOwnedRefresh` | `src/cli/lib/ownedRefresh.ts:91` | 交接直接复用,没新建内部 op |
| `withUpdateLock` | `src/cli/lib/updateLock.ts` | 互斥门,target = execPath |
| `runBinarySelfUpdate` | `src/cli/lib/selfUpdateBinary.ts` | 下载/校验/冒烟/换入/回滚管线,只加了 Range 续传 |
| `gcCompiledArtifacts` | `src/cli/gc.ts:105` | 顺带清 `.harnessed-update-<ver>.part` |
| `readUpdateReminderPreferencesFile` | `src/cli/lib/updateReminderPreferences.ts` | 三个旧读者合并成一个 |

### 并行化

Sequential implementation, no parallelization opportunity —— 单波、单模块族
(`src/cli/lib/*` + `src/cli/*`),共享 `src/cli/lib/autoUpdateStatus.ts` 一处改动会
同时影响编排、hook、命令三个调用点。

### 完成摘要

- Step 0: Scope Challenge — **scope accepted as-is**(结构问题 D1 = A)
- Reality rows: **7/7** 行已发出(`premise-table` / `already-done` / `surface-check` /
  `binding-decisions` / `numbers` / `deferred-asks` / `pr-count`),**0** 个未核前提
- Architecture Review: **2** 个问题(F1 节奏 / F2 npm 通道文案)
- Code Quality Review: **1** 个问题(F1 死代码)
- Test Review: 图已出,**2** 个 gap(1 个 = 发布门真机,1 个 = 同上)
- Performance Review: **0** 个问题
- NOT in scope: 已写
- What already exists: 已写
- TODOS.md updates: **0** 项(TODO 的三问已全部落地,不再新增)
- Failure modes: **0** 个 critical gap
- Unresolved decisions: **0**
- Outside voice: provider `codex`,**disabled**(项目配置 `codex_reviews=disabled`,
  已按协议写 disabled 记录;不声称任何外部评审信用)
- Parallelization: 0 lanes,0 parallel / 1 sequential
- Lake Score: N/A(本次无 Completeness 评分的选项)

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 10 proposals, 8 accepted, 1 deferred, 1 rejected; 3 adversarial rounds folded in (4/10 → 6/10 → 7/10) |
| Outside Review | codex (plan-review) | Independent 2nd opinion | 0 | disabled | no completed external review — `codex_reviews` is `disabled` in this project's gstack config |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 3 issues (2 P2 + 1 P3), 0 critical gaps; 2 decisions taken (D1 structure, D2 resume cadence); 5514 tests green |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | not run | no UI scope (CLI only) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | not run | — |

- **OUTSIDE COVERAGE:** provider `codex`, phase `plan-review`, status `disabled` — the stored
  `codex_reviews` setting is `disabled` for this project, so no outside process was started and
  no native replacement was dispatched. No clean-review credit is claimed from it.
- **VERDICT:** CEO + ENG CLEARED — 实施完成,门禁全绿;剩发布后的真机端到端(AC13)。
  ENG review 的两项 P2 已按批准契约落地(状态文件驱动续传节奏、D3 的 npm 通道文案),
  一项 P3 死代码已删;唯一未完成项是发布门实测,按计划留到 v5.0.13 发布之后。

NO UNRESOLVED DECISIONS


