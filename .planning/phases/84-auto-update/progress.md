# Progress — Phase 84 自动更新

## 2026-11-03 立项

- 维护者提问「后期 harnessed 能自动检测新版本并更新吗」→ `TODOS.md` 记为候选
  (原条目标注「属新功能,开工前应走 `/office-hours` + `/plan-ceo-review`」)。
- 读码确认:检测(`updateReminderEntrypoint.ts` / `updateReminderCache.ts`)与替换
  (`selfUpdateBinary.ts`)两半都现成,**缺的只是自动触发**。
- 走 gstack `/plan-ceo-review`(模式 SELECTIVE EXPANSION)。`/office-hours` 跳过:
  这是既有产品的维护型功能,scope 已由 TODOS 条目界定,YC 式产品方向诊断不匹配。

## 2026-11-03 决策

AskUserQuestion 四问,全部按推荐落定:

1. gstack 自身升级(1.91.101.0 → 1.94.19.0)→ 暂缓 24h(写 snooze,level 1)
2. review 模式 → SELECTIVE EXPANSION
3. 通道范围 → 只做 binary 通道
4. 切换时机 → 后台 worker 直接换完(不引入暂存态)

第二轮四问(cherry-pick)全部采纳:

4. 交接触发 → 新增内部 op `auto-update-handover`
5. 下载可见性 → 加(状态文件 + status 命令)
6. 更新公告 → 加(CHANGELOG 段落)
7. 失败历史 → 加(最近 10 条)

## 2026-11-04 读码推翻两个决策(重开)

- **交接通道**:原计划要新增内部 op,但读码发现 `spawnOwnedRefresh` +
  `--internal-owned-refresh` **已经存在并已上线**(手动更新路径 `src/cli/update.ts:140-141`
  自 v5.0.8 在用)。重开 → 维护者改选「复用已有通道」。ADR 0044 D4。
- **consent/status 落点**:读码发现公开命令面被 `tests/docs/cli-surface.contract.test.ts`
  钉死(32 个公开顶层命令 + 11 个 README locale 各一行)。原计划的公开子命令要付这份文档债;
  隐藏命令(`inject-state` 先例)不用。重开 → 维护者选公开面,知情承担代价。ADR 0044 D6。

## 2026-11-04 对抗性 spec review 第一轮:4/10 FAIL

挖出三个 fatal(不改就做不出来)+ 十余项缺失路径:

1. 自动更新不取 `withUpdateLock` → 与手动更新撞车,两次 rename 交错
2. Range 续传在现有结构下不可实现(PID 临时名 + 每次重试截断 + 停滞不重试)
3. 限流(24h 版本级)与续传打架 → 第 10 分钟断掉的 11 分钟下载要等一天

以及:回滚也失败的最坏状态(exec 路径无 binary)、exec 目录不可写、restart 提示缺失、
codex 信任闸门导致 hooks 实际没刷新、`.bak` 卫生、i18n 漏了、`bin/` drift 门禁漏了、
argv 严格解析会让整条链路静默哑火、`src/compile/entry.ts` 被 tsconfig exclude。

→ 全部转成 R1-R14 写进 `CONTEXT.md`(是修补,不是扩范围)。
→ 计划重写:决策编号统一成一套(D1-D13 + R1-R14),验收标准改成可判定断言(AC1-AC13)。
→ 状态文件 schema、status 输出格式、Range 续传改造细节全部写成契约。

## 2026-11-04 对抗性 spec review 第二轮:6/10 仍 FAIL

已验证为正确(不用再查):D8 复用 `spawnOwnedRefresh`、R1 锁的 target 与手动路径一致、
R2 跨宿主互斥、R11 argv 严格解析、R13 `bin/` drift 门禁、AC12 的公开面成本、
整个 compiled 触发链闭环、AC13 不用演练缝。

又挖出 17 条。其中**我自己写错的一条空操作**:R9 照抄 `src/cli/update.ts:158` 的
`execPath: null`,而那恰好是「不清理本次刚产生的 .bak」——`src/cli/gc.ts:162-176` 的清理分支
被 `if (opts.execPath)` 包着,传 null 等于整个关掉。改为 `process.execPath`。

其余要点:
- 三个 state root 推导虽然实际一致,但没有单一真相源 → 「开了却永不触发」以更高层形式复活
- 公告没有一次性规则 → CHANGELOG 摘录会每次会话重复刷屏
- 交接不知道 from 版本、不知道状态文件路径 → notice 写进另一个 root,AC7 静默失败
- 两个写者一个文件无写协议 → 后写者抹掉对方字段
- `.part` 永远没人回收
- Range 头根本没地方下发(`fetchAsset` 硬编码 accept 头)
- 损坏 preferences 的 enabled 语义被我写反了(现有两个读者都是「损坏 → 关」)

→ 全部转成 R15-R23;计划按 文档纪律 拆成 CONTEXT / ERRORS / TASKS 三份。

## 2026-11-04 对抗性 spec review 第三轮(最后一轮):7/10 仍 FAIL,阻塞项收敛到 4 条

机制层面经源码核实**全部成立**:复用 `spawnOwnedRefresh`(交接走 `src/cli.ts` 主路径 → 在资产
解包之后 → 新 binary 确实拿到新 assets)、update lock 的 target 与手动路径一致、跨宿主互斥、
env 继承可传状态文件路径(不用改 `spawnOwnedRefresh` 签名)、注入缝、每宿主配额、
`critical` 错误形状、文档拆分。

四条阻塞:
1. **F-1**:R4「冒烟失败保留 `.part`」与「part→exe 改名顺序」自相矛盾 —— 冒烟时 `.part` 已被
   改名走,无从保留;现 `selfUpdateBinary.ts:366` 的 unlink 让 99 MB 白丢。
   修法:冒烟目标改成**版本稳定名**(旧 PID 唯一的前提「没有锁、last-wins」已不成立,
   所有真实更新路径都持 per-exec-path 的 update lock);冒烟失败改名回 `.part`。
2. **K-1**:R15 两条 bullet 互斥 —— canonical 认 override,`refreshOwnedUpdate` 的
   `context.platform.stateRoot` 不认,codex hook 的 `--state-root` 也不认 → 有 override 时写 A 读 B。
3. **L-1**:CLI 的默认宿主未定义 → 只装 codex 的机器上 `auto-update on` 写进 claude 根。
4. **F-2**:R3 规则 3 漏了 `schemaVersion === 1` → 对未知 schema fail-open。

八条小项:两条写失败未登记、半成品 notice、map/registry 计数、ADR 与台账不同步、
锁的「exe 目录可写」承重约束、N 的归属与不匹配处置机制、setup 写入规则表述、
env 机制与 mkdir。

→ 全部落进 R24-R28 + R3/R4/R15 的改写;ADR 0044 原地 amend 并留 amend 记录。

## 2026-11-04 会话中断与续跑

gstack 治理关卡在同一晚关闭:计划终稿 + `## GSTACK REVIEW REPORT` 落在 CONTEXT.md 末尾
(末行 `NO UNRESOLVED DECISIONS`,read-back 已核)、review log + decision log + telemetry
已持久化、learnings 记了两条(gc 的 `execPath: null` 空操作坑 / 三轮对抗性评审的收敛形态)。

随后 Claude Code 进程退出,T3/T4/T5 三个 agent 停在半路(transcript 保留,可用 SendMessage 续跑)。
落地情况:
- T1(preferences reader)+ T2(状态文件)已完整落地,主 session 亲验:5 个测试文件 78 测试全绿
- T3 的 `src/cli/autoUpdateCmd.ts` + `tests/cli/autoUpdateCmd.test.ts` 已落盘,11 个 README +
  `src/cli.ts` + 合同测试已改
- T5 的 `src/cli/lib/autoUpdate.ts` + `tests/cli/lib/autoUpdate.test.ts` 已落盘
- **T4 把 `src/cli/lib/selfUpdateBinary.ts` 写坏了**(945 行起语法错误,`tsc` 一串 TS1005)

续跑动作:三个 agent 全部用 SendMessage 唤回并给了各自的收尾指令(T4 带「文件当前不解析,
先修语法再按修正后的契约收尾」;T3 带「默认宿主必须是 `detectPlatform().id` 而不是
硬编码 claude」;T5 带「未知 `schemaVersion` 必须 fail-closed」)。另外清掉 12 个 agent 留下的
shell 重定向碎片(未跟踪 + 0 字节)。

## 2026-11-04 产出

- `.planning/phases/84-auto-update/CONTEXT.md` — 完整契约 + 台账 + 错误救援表 + 失败模式表 +
  测试图 + 验收标准 + 实施任务
- `.planning/phases/84-auto-update/task_plan.md` / `findings.md` / `progress.md`
- `docs/adr/0044-auto-update-consent-and-handover.md` — ADR(D1-D12)
- CEO 摘要:`~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-11-03-auto-update.md`
- 对抗性 spec review 第二轮:已派发,等待结果

## 待办

- [ ] 第二轮对抗性 spec review 结论
- [ ] 计划终稿批准(0H 文档批准)
- [ ] T1-T9 实施

## 2026-11-04 实施(主 session 直写,agent 因 429 全线挂掉)

API 配额耗尽(`已达到 Token Plan 用量上限`)→ T3/T4/T5/T6/T10 的 agent 全部中途
429 退场。恢复策略:能续的用 SendMessage 续,剩下的由主 session 直写并自己跑验收。

落地与自验(全部主 session 亲跑,不信 agent 报告):

| 任务 | 产出 | 验收 |
|---|---|---|
| T1/T2 | `updateReminderPreferences.ts` / `autoUpdateStatus.ts` | 92 测试绿 |
| T3 | `autoUpdateCmd.ts` + 11 README + 合同计数 33 | 合同测试绿 |
| T4 | `selfUpdateBinary.ts` Range 续传(.part / 206 / 200 / 416) | 续传测试绿;**旧断言按 R4/R5 更新**(见 F-12) |
| T5 | `autoUpdate.ts` 编排(consent→通道→配额→可写预检→锁→自更新→交接) | 编排测试绿 |
| T6 | `autoUpdateHandover.ts` / `autoUpdateNotice.ts` / gc 分片回收 / 新 binary 写公告 | 交接+公告+gc 测试绿 |
| T7 | i18n:`auto_update.*` 13 个 key(en + zh-Hans) | parity 绿 |
| T8 | `build:hooks` 重生成 4 个 `bin/*.mjs` | bin drift 归零 |
| T10 | `src/platform/stateRoot.ts` + 入口 gate 修正(`enabled \|\| autoUpdate`) | stateRoot / 入口 gate / 公告 hook 测试绿 |

实施期抓到的三个真 bug(都已修 + 有回归测试):
1. **入口 gate 只认 reminder consent** → `enabled:false + autoUpdate:true` 时整条链不跑
   → 「开了永不触发」。新增 `tests/compile/auto-update-entry-gate.test.ts`(compiled 入口级)。
2. **公告没有一次性消费** → hook 每次会话重复刷 CHANGELOG 摘录。
   → notice 加 `consumedAt`,hook 打印后原子写回;半成品(`to` 为空)不打印不消费。
3. **新 binary 写不了公告** → CHANGELOG 摘录只能由持有新 assets 的进程算。
   → 新 binary 在交接后写公告(path 走 env,`from` 由旧 binary 先记)。

全量验收(本机):`tsc --noEmit` 干净;vitest 5505 通过 / 0 失败(438 文件);
biome 门禁 0 blocking;`build` 成功;CI 硬门脚本 9 个全 0;`build:hooks` 已重生成。
命令面本机实测(`HARNESSED_ROOT_OVERRIDE` 沙箱):`status` / `on` / `off` / `--json` 正常,
preferences 文件内容正确,i18n 跟随 locale。

## 待办(实施后)

- [x] `/plan-eng-review` —— 2026-11-04 跑完,3 个问题(2 个 P2 + 1 个 P3),0 critical gap,
      0 unresolved;两项 P2 按批准契约当场落地(见下节);review log + decision log 已持久化,
      `PLAN_REALITY: phase=eng rows=7/7 unverified=0 verdict=complete`
- [x] commit + push(带 pathspec)—— `250343b`,已推 main
- [ ] T9 剩余部分:binary 通道的真实自动更新 —— **只能在 v5.0.13 发布后发生**
      (被自动替换的 binary 必须自带本功能)

## 2026-11-04 eng review(gstack `/plan-eng-review`)

评审对象 = 实施后的工作树(不是计划文本)。两个决策由用户拍板:

- **D1 = A(保持 8 个新模块)**:`changelogSection` 必须独立(拖进 update.ts 会把整个
  update 命令塞进 compiled worker);`notice` 与 `status` 关注点不同;
  `stateRoot` 要能一眼 grep 到。
- **D2 = A(状态文件驱动续传节奏)**:见 F-01。

评审挖出的 3 个问题(全部已修 + 回归测试):

| ID | 级别 | 问题 | 处置 |
|---|---|---|---|
| F-01 | P2 | 自动更新那一轮的节奏被提醒缓存的 24h TTL 卡住 → 断流后 `.part` 无人续传,契约写的是「下次会话直接续传」 | 状态文件新增 `hasResumableAutoUpdateWork()`;`[resumable]` 标记迁到状态模块(写者+读者都要);hook 读到痕迹就唤醒 worker |
| F-02 | P2 | D3 要求 status 显示「auto-update needs the binary channel」,实现只印 `(npm-channel)` | `formatAutoUpdateStatus` 加 `REASON_TEXT` 映射 |
| F-03 | P3 | `isAutoUpdateInProgress` 只有测试引用(死代码) | 删掉(连同 15 分钟窗口常量与 4 条测试) |

另外补了 R15 明确要求但漏掉的 README 注明(11 个 locale:默认宿主 = 检测到的那个)。

评审后全量验收:vitest **5514 通过 / 0 失败**(439 文件);`tsc --noEmit` 干净;
biome 硬门 0 blocking;`build` + `build:hooks` 成功;CI 硬门脚本全 0。
