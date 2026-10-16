# Phase 67 — progress

> 当前节点。详细计划见 `task_plan.md`;执行中的发现进 `findings.md`。

## 状态

- **立项**: 2026-10-15
- **当前**: T1-T6 + T10 已交付并 push。**命令已可用并经独立冒烟**。T1-T12 全部完成,收口见 SUMMARY.md
- **基线**: 立项时 HEAD `afe9e7b`,vitest 3296/0,npm latest 4.48.0
- **现在**: HEAD `541be4b`,vitest **3415**/0(+119),10 闸门全 PASS,bin 漂移闸门提交后演练 PASS

## 独立冒烟实测(主 session 自跑,非采信 subagent)

四次调用全对:成功路径 exit 0 · `src==dest` 拒绝(`依据:` 行正确反映
`HARNESSED_PLATFORM` 分支而非硬编码探测分支)· 目标占用拒绝(`1/2 subs done`
由 sub_progress 正确渲染)· `--from` 省略能推断。

逐条印证:**R2 承重不变量 PASS**(源账本 md5 与 mtime 四次调用后逐字节未变,含两条拒绝路径)·
目标账本写在**裸键**(D4)· `updated_at` 是写入时刻而非源值(D7)· `retro_meta` 取 max 带走、
`intents` 为 null(D15)· 指针仍指源根(D12)· 源账本里的 `::displaced-*` 归档键
被正确排除在候选外(D9,否则会变成 2 候选拒绝)。

## T4 的入口条件(T2/T3 已备好的 seam)

- `readStoreAt(root)` — 对任意根做读 + `Value.Check` + fail-soft。**注意 D14**:
  fail-soft 把「没账本」与「账本损坏」塌成同一个空店,T4 必须自己探文件是否存在才能分辨。
- `resolveHostWithReason(home)` — 返回 `{ descriptor, reason, skipped }`。
  `reason` 是 5 变体判别联合(阶梯五条规则各一),`skipped` 只记「尝试过但被跳过」的规则
  (未知 `HARNESSED_PLATFORM` / 两个 session env 同时存在 / pin 指向未知 id;**pin 缺失不记**,
  那是 99% 路径)。返回的是宿主**自己的** `stateRoot`(pre-override),正是跨根读需要的。
- **D16 需要的导出 id 清单今天不存在**(见 `findings.md` F8),T4/T6 要新增并让
  `setup.ts` 的 `KNOWN_PLATFORMS` 消费它。

## 已交付

- **T10**(`cbd4f0e`,CI `conclusion=success`): ADR-0043 Proposed → **Accepted**。共享中立状态根否决;
  原 Decision #3「裸键回退加宿主闸门」被认定**有害**(它会打断它要启用的接力);原提案两处遗漏留档
  (6 处同形回退含 dep-free 手抄 bin;共享根不在 `HARNESSED_ROOT_OVERRIDE` 沙箱覆盖内)。
  ADR 从未 Accepted 过 ⇒ 原地改写而非另开 supersede。索引行同步。
- **T1**(`993b12d`): `normalizeRepoKey` + `migrateRepoKeyCase`,挂 `src/cli.ts`。
  **同批修掉一个若不修就会发出去的回归**:`injectStateMain.ts` 的 dep-free `repoKey` 复制品
  (打进每轮 hook 的 `bin/harnessed-inject-state.mjs`)原本不折叠 ⇒ 只折 CLI 侧会让两边键不相合,
  win32 上每轮注入器几乎必瞎。现复制品同折 + 拆 `slotKey`(折,喂账本与 inject cache)/
  `repoPath`(不折,喂磁盘路径),并加 parity 测试驱动真实 bin 锁死两份实现。
  顺带修正 3 个 bin 驱动测试文件里 22 个用裸 tmp 路径做键的既存测试(它们只断言 bin 自洽,
  从未断言 bin 与 CLI 相合)。详 `findings.md`。

## 治理关卡

| 关卡 | 状态 |
|---|---|
| gstack `/plan-eng-review` | ✅ 2026-10-15,`SCOPE_REDUCED`,15 issues,0 critical gaps,0 unresolved。产物:`~/.gstack/projects/easyinplay-harnessed/tasks-eng-review-20261015-093003.jsonl`(12 行)+ 同目录 test-plan |
| 外部意见 | ✅ Claude subagent(**非 codex**:维护者长期约束「claude 宿主永不自动拉起 `codex exec`」;本轮已把 `codex_reviews` 设为 `disabled`,该约束现由二进制强制)。13 条,7 条验证成立并吸收 |
| `/office-hours` + `/plan-ceo-review` | ⏭️ 跳过。非新产品方向:scope 已由维护者 2026-10-14 裁决「做」+ TODOS 条目定义,属既有 backlog 的实现关卡,不是战略层决策 |
| `superpowers:brainstorming` | ⏭️ 跳过。多方案对比已在 `/plan-eng-review` 的 Step 0 与四节审查里穷尽(共 16 个决策点逐个交维护者裁定),再 brainstorm 是重复 |

## 任务进度

- [x] T1 `repoKey` 大小写归一 + 账本键迁移 【最先】 ✅ `993b12d`(含 F2 的复制品折叠)
- [x] T2 抽 `readStoreAt(root)` ✅ `74f4714`
- [x] T3 导出 `resolveHostWithReason()` ✅ `74f4714`
- [x] T4 `adoptSlot.ts` 核心 ✅ `541be4b`
- [x] T5 目标宿主未 setup 时拒绝 ✅ `541be4b`(判据 = `commandsDir` 里有 `harnessed-generated:` 标记的命令)
- [x] T6 CLI 接线 + D16 `HOST_IDS` 导出 ✅ `541be4b`(三份手写宿主清单收敛成两份)
- [x] T7 账本槽位修剪 B+E ✅ `c18c04a`(CI success)。原前置项,见 `findings.md` F10
      ⚠️ 开工前要先裁一个有数据丢失风险的问题:修剪只碰归档键,还是也碰真实 `::<sid>` 槽位
      (后者需按状态与年龄定规则:永不删 `active`,只删足够老的 `complete`)
- [x] T8 `resume` / `checkpoint` 描述宿主中立措辞 ✅(TDD 跳过:纯文案,既有 resume 测试 26 改断言)
- [x] T9 测试 27 路径 + R1/R2/R3 ✅ 随 T2-T7 交付,对账见 SUMMARY
- [x] T10 改写 ADR-0043 ✅ `cbd4f0e`
- [x] T11 10 份 README 命令表 ✅
- [x] T12 `retro_meta` 取 max ✅ 随 T4(`adoptSlot.test.ts` D15 组)

## TDD 判据

T1 / T4 **强制 TDD**(核心数据结构键与迁移、编排逻辑与全部拒绝路径,错误成本高)。
T2 / T3 为行为保持的重构,以回归测试(R1、platform-golden 不变)代替新写 red 测试。
T8 / T10 / T11 为文案与文档,**显式跳过 TDD**(理由记于此,满足跳过声明协议)。

## 阻塞

(无)
