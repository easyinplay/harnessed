# Findings — Phase 84 自动更新

> 只记「读码确认的事实」与「评审挖出来的问题」。结论性决策在 `CONTEXT.md` 的台账里。

## F-01 — 检测与替换两半都现成,缺的只是触发

- 检测:`src/compile/updateReminderEntrypoint.ts:121-131`(hook)、`:133-166`(worker)、
  `src/cli/lib/updateReminderCache.ts:3`(24h TTL)、`:4`(1h retry)
- 替换:`src/cli/lib/selfUpdateBinary.ts:184-436`
- 触发缺失:`src/cli/updateReminderHookMain.ts:42-52` 只在「缓存该刷新」时拉起 worker,
  而 worker(`src/cli/updateReminderWorkerMain.ts:50-60`)只观察、只写缓存。

## F-02 — 交接通道已经存在并已上线(推翻原计划的新建 op)

- `src/cli/lib/ownedRefreshFlag.ts:16` — `OWNED_REFRESH_FLAG = '--internal-owned-refresh'`
- `src/cli/lib/ownedRefresh.ts:91-136` — `spawnOwnedRefresh(execPath, context, deps, timeoutMs)`
  (180s 超时,fail-soft,stderr 继承)
- `src/cli.ts:143-147` — CLI 入口识别该 flag → `runOwnedRefreshEntry()`
- `src/cli/update.ts:140-141` — 手动更新路径换入后就在调它(v5.0.8 起)

→ 维护者 2026-11-04 批准复用,不新增内部 op。

## F-03 — 公开命令面被合同钉死

`tests/docs/cli-surface.contract.test.ts`:
- `:140` `expect(publicTopLevel.size).toBe(32)`
- `:99` README locale 11 个(`README.md` + 10 个 `README-<locale>.md`)
- `:142` 每个 README 的命令表(`| \`harnessed xxx\` |` 行)必须覆盖全部公开命令
- `:94` `internalTopLevel = new Set(['help', 'inject-state'])` — 注册但不进公开面的先例

→ 维护者 2026-11-04 选择公开子命令,代价 = 计数 33 + 11 个 README 各加一行。

## F-04 — Windows rename 证据的正确出处

- `src/cli/lib/selfUpdateBinary.ts:375` — `rename(deps.execPath, bakPath)`,
  而 `deps.execPath` = 运行中的 `process.execPath`(同文件 `:935`)
  → 手动 `harnessed update` 已在生产跑通「rename 掉运行中的 exe」
- `src/cli/lib/selfUpdateBinary.ts:422-425` 的注释只证明 **delete 报 EPERM**(`.bak` 是运行映像)
- 原计划把 `:422-425` 当成 rename 可行的证据 → 已更正

## F-05 — npm 通道被管道本身拒绝

`src/cli/lib/selfUpdateBinary.ts:193-195` — `normalized(execPath).includes('/node_modules/')` → `refused`。

## F-06 — preferences 有三个读者三种语义

- `src/compile/updateReminderEntrypoint.ts:92-119` — 文件存在时要求 `schemaVersion===1 && enabled===true`;
  **文件不存在(ENOENT)→ enabled = true**
- `src/cli/lib/refreshOwnedUpdate.ts:102-117` — 第三份读法,stateRoot 推导规则也不同
  (`context.platform.homeDir` vs `nativeHome`)
- `src/cli/setup.ts:410-425` — 写入方:`{schemaVersion:1, enabled: raw.updateReminder !== false}`,
  flag 用 `'wx'`(存在则 EEXIST 跳过)→ **setup 不会冲掉 `autoUpdate`**;
  但 `--no-update-reminder` 用 `'w'` 全量覆盖 → 会抹掉 `autoUpdate` 字段

→ R3:单一 reader + `autoUpdate` 与 `enabled` 独立 + setup 改 read-modify-write。

## F-07 — 对抗性 spec review 第一轮:4/10,5 维 4 项 FAIL

挖出的三个 fatal(不改就会做不出来):

1. **自动更新不取 update lock** → 与手动 `harnessed update` 撞车,两次 rename 交错。
   手动路径:`src/cli/update.ts:73-76`、`src/cli/lib/updateCoordinator.ts:639`。
   锁的 anchor 在 exec 同目录(`src/cli/lib/updateLock.ts:118-121`)→ 与宿主无关,
   claude/codex 两个 worker 也互斥。
2. **Range 续传在现有结构下不可实现**:
   - 临时名带 PID(`src/cli/lib/selfUpdateBinary.ts:202`)→ 跨进程找不到分片
   - 每次重试截断(`:817-819` 的 `createWriteStream(dest)` 默认 `'w'`)
   - 停滞直接抛出、不进重试(`:726` `if (error instanceof TransferStalledError) throw error`)
   → R4 的改造契约(part 文件 / 206 / 200 / append-truncate / 计数器初始化 / part→exe 改名)。
3. **限流与续传打架**:24h 版本级限流会让「第 10 分钟断掉的 11 分钟下载」等一天。
   → R5:限流只计完整失败,续传不消耗配额。

其余:回滚也失败的最坏状态(exec 路径无 binary)、exec 目录不可写、restart 提示缺失、
codex 信任闸门导致 hooks 实际没刷新、`.bak` 卫生、i18n 漏了、`bin/` drift 门禁漏了、
argv 严格解析会让整条链路静默哑火、`src/compile/entry.ts` 被 tsconfig exclude。

## F-08 — compiled 入口的 op 分派在解包之前

`src/compile/entry.ts:50-59` 分派 `update-reminder` / `update-reminder-worker` → `:61-99` 解包
→ `:101` `import('../cli.js')`。

推论:后台 worker 运行时**没有** assets。要读 `getAssetsRoot()` 的逻辑必须在解包之后
(即 CLI 主路径内)。→ R14:CHANGELOG 摘要由新 binary 在交接时算(它走 `src/cli.ts` 主路径)。

## F-09 — 既有可复用件清单

| 已有物 | 位置 |
|---|---|
| `withUpdateLock` | `src/cli/lib/updateLock.ts:327-348` |
| `runBinarySelfUpdate` | `src/cli/lib/selfUpdateBinary.ts:184` |
| `execDirWritable` | `src/cli/lib/selfUpdateBinary.ts:969-976` |
| `spawnOwnedRefresh` | `src/cli/lib/ownedRefresh.ts:91` |
| `gcCompiledArtifacts` | `src/cli/gc.ts`(用法见 `src/cli/update.ts:153-159`) |
| `changelogTop` | `src/cli/update.ts:175-189`(取首个 section,≤1200 字符) |
| `realSelfUpdateDeps` | `src/cli/lib/selfUpdateBinary.ts:927-967`(`deps.log` 是进度写盘的口子) |
| `updateTarget` | `src/cli/lib/updateCoordinator.ts:233` |

## F-10 — i18n 与文档面的实际形状

- `messages/en.json` / `messages/zh-Hans.json`:嵌套 JSON,122 个顶层 key;
  `tests/unit/i18n-parity.test.ts` 要求两边的 key 集合**完全相等**
- README 命令表行格式:`| \`harnessed <cmd>\` | 说明 |`(正则 `^\| \`harnessed ([^`]+)\` \|`)

## F-11 — 实施期发现:三处「既有合同」与 R15 的冲突(2026-11-04)

R15 要求五个消费点统一走 `canonicalStateRoot(hostId)`。实施时撞到两个既有合同,
读码确认后按「既有合同优先 + 明确偏离」处理:

| 消费点 | 既有合同(有测试锁定) | 实施决定 |
|---|---|---|
| `src/cli/lib/refreshOwnedUpdate.ts` | 用 **capture 到的 context 的 nativeHome**,忽略环境漂移(`tests/unit/refresh-owned-update.test.ts`「ignores an explicit root override and preserves native-home opt-out after environment drift」) | **保留 context 推导**。这个 reader 只决定「要不要重新注册提醒 hook」,读的是 reminder consent,不是 auto-update consent;改动会回归 v16.0 的漂移保证 |
| `src/installers/codexHookAdd.ts` | hook 命令字面量里的 `--state-root` 用 **显式 nativeHome**(portable codex home 特性),忽略 override(`tests/installers/codexHookAdd.test.ts`) | **override 优先,其次 context 的 nativeHome**。R15 明确要求「有 override 时与 claude 侧对齐」,且 portable home 特性在无 override 时逐字节不变 |
| `src/compile/updateReminderEntrypoint.ts` | 显式 `--state-root` 优先 | 保留(显式指令优先于 canonical 函数) |

→ 结论:**auto-update consent 链路(命令 → hook → worker)是 canonical 的**;
reminder hook 重注册这条路是 context 权威。两者读的是同一个 preferences 文件,
但读的字段不同(`autoUpdate` vs `enabled`)。

## F-12 — 实施期发现:两处既有测试编码了被 R4/R15 改掉的旧契约(2026-11-04)

1. `tests/cli/lib/selfUpdateBinary-stream.test.ts`「stalled transfer … the temp file is
   cleaned up」——R4/R5 改成「停滞保留 `.part` 作为续传点」,测试仍断言删除。
   → 按新契约改断言(`.harnessed-update-<ver>.part` 保留,原 binary 不动)。
2. `tests/installers/codexHookAdd.test.ts` 的 portable-home 用例在 `beforeEach` 里全局
   设了 `HARNESSED_ROOT_OVERRIDE` → 与 R15 的 override 优先规则冲突。
   → 该用例显式清空 override(保住「显式 nativeHome 优先」的意图),另加一条
   「override 优先」的新用例。

## F-13 — compiled hook 里的 i18n 只能落到英文(2026-11-04)

`messages/` 目录的注入点(`wireMessagesDir`)在 `src/cli.ts` 顶层;compiled 入口
`src/compile/entry.ts` 在解包 assets **之前**就分派 reminder op(见 F-08),
所以 hook 进程里 `t()` 找不到 `messages/zh-Hans.json` → 回落内嵌 en 表。
→ 公告在 compiled binary 里是英文;npm/bun 通道跟随 locale。
→ 不改入口顺序(那是 assets 边界测试锁住的)。

## F-14 — 入口 gate 的真 bug:整条链被 reminder consent 单独门控(2026-11-04)

`src/compile/updateReminderEntrypoint.ts` 原来只有 `reminderEnabled(...)` 一个闸门 →
`enabled:false + autoUpdate:true` 时 hook 与 worker 都不跑 → 「开了永不触发」。
→ 改为 `enabled || autoUpdate`(两个 consent 独立)。新增
`tests/compile/auto-update-entry-gate.test.ts`(compiled 入口级,3 个用例)。
