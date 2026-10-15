# Phase 67 — 跨宿主接力 `harnessed checkpoint adopt`

> 主计划。由 `/plan-eng-review`(2026-10-15,HEAD `afe9e7b`)的全部裁定派生。
> 执行方式按 STATE.md 的 methodology lesson:**主 session 手控 plan+execute**,
> 单任务下放 fork subagent + TDD,**产物由主 session 亲验**(vitest / tsc / gates 实跑)。
> 伴随文档:`progress.md`(当前节点)· `findings.md`(执行中发现)· `SUMMARY.md`(收口)
> 决策记录:`docs/adr/0043-cross-host-relay-shared-state-root.md`(T10 改写后为唯一真相源)

## 目标

Claude Code 额度耗尽时,切到 codex 把**同一个 leaf 接着跑完**。

今天不成立的根因:账本是每宿主一份(`workflows.json` 落 `detectPlatform().stateRoot`),
两个宿主各看一本账。

## 已裁定的设计(不得在执行中重开)

**共享中立状态根方案被否决。** ADR-0043 原 Decision 1-3 作废。采用**只读跨根单向拷贝**:

| # | 裁定 | 依据 |
|---|---|---|
| D1 | 不建共享根、不搬账本、**不动任何读路径** | 6 个裸键回退点原样保留 |
| D2 | `adopt` 从**另一宿主自己的 stateRoot** 只读 `workflows.json` | `PLATFORMS` 已按 id 暴露两根(`platform.ts:145`) |
| D3 | **跨根严格只读是承重不变量**,全程不写源根 | 这是本方案便宜的全部原因:无需跨根加锁、无需管对端版本 |
| D4 | 目标键是**裸 `repoKey`**,不是 `activeKey()` | `state.ts:101` 的裸键回退是被接管槽位唯一可达通路;写 `activeKey()` 则下个会话双 miss,重跑 adopt 会从源头拉回接力前旧态 = 数据丢失 |
| D5 | 接力语义是**一个会话**,adopt 结尾显式预告 | 首次 `complete` 读裸写复合(`state.ts:125`)必然叉开槽位,裸槽从此冻结;跨会话续跑与同宿主原生多会话行为一致,不引入新语义 |
| D6 | 写路径走既有 `mutateStore()`,**不给 `state.ts` 加任何导出** | 14 个测试文件工厂 mock 它(STATE invariant 明载);`mutateStore` 自带 `withLock`,锁目标恰为目标根 |
| D7 | 回调内**显式盖 `updated_at`** | `mutateStore`(`state.ts:191-198`)不像 `writeCurrentWorkflowUnlocked`(`:114`)那样盖;否则带源宿主时间戳,跨日接力触发 `injectState.ts:81,104-107` 的 >24h STALE 告警 |
| D8 | 宿主自识别:`--from` == 解析出的宿主 → **硬拒 + 点名依据** | 本机 `~/.claude` 与 `~/.codex` 俱在、无 `.platform` pin ⇒ 裸终端解析为 claude(`platform.ts:214-217` incumbent 优先),`--from claude` 会成 src==dest 自拷 |
| D9 | 候选匹配**精确两段** + 显式排除 `::displaced-` | `repoKey::displaced-<ts>` 仍以 `repoKey` 开头,松匹配会让反向接力撞「>1 候选拒绝」死锁 |
| D10 | 多候选(多 `::sid`)→ **拒绝并列出,绝不猜** | 沿 ADR 原意 |
| D11 | 目标槽位 `active` → **锁内 throw 拒绝**;`paused` → 先归档 `repoKey::displaced-<ts>` 再写;`complete`/无 → 直接写 | `withLock` 的 `try/finally`(`state.ts:82-86`)保证 throw 时放锁且 `writeStoreRaw` 未执行,TOCTOU 免疫。热读路径不认 `::displaced-*`,这是对的:它不该被注入 |
| D12 | **不搬证据文件**,`last_checkpoint_path` 原样保留 | 绝对路径同机可读;`template.ts:69` 的 `complete` 不传 `customPath`,下一条 `complete` 就把目标根同名文件重写,拷贝窗口只剩「源根被删 + 尚未 complete + 此时 resume」 |
| D13 | 源槽位**不动** + 结尾点名警告 + 给出清理命令 | 换掉它就要写源根,违反 D3 |
| D14 | 源账本缺失 vs 损坏**必须分辨**,后者诚实报错 | `readStoreAt` 继承 CD-5 fail-soft,照搬会把「账本坏了」报成「源宿主没账本」 |
| D15 | `retro_meta` 取 `max(src, dest ?? 0)` 带走;**`intents` 不带** | `retro_meta` 按裸 `repoKey` 键、仓级节奏,归零会静默重置将触发的 retro 提醒;`intents` 是单轮面包屑且被 `checkpoint start` 吸收,带过去只会让 codex 吃别人的 freestyle nag |
| D16 | `--from` 候选从 `PLATFORMS` **派生**,不得新造字面清单 | `platform.ts:199` / `setup.ts:58` / `setup.ts:83-85` 已是三份手写宿主清单,adopt 不做第四份;加 gemini 时自动跟上 |
| D17 | 证据路径拷贝若保留(已按 D12 取消)则必须锁内先拷后写 | 保留此条仅为记录推理:锁内顺序决定孤儿文件有无 |

## 不在范围(考虑过,显式推迟)

- 共享中立状态根(ADR-0043 原方案):同目标可用只读拷贝达成,少花一个 innovation token
- 槽位 `host` 字段:账本不共享 ⇒ 槽位不会混宿主,字段无消费者
- 六个裸键回退加宿主闸门:**原 ADR 称其为前置,实为有害** —— 它会打断它要启用的接力
- 写源根(标 paused / 清理源槽):违反 D3
- `harnessed status` 显示「另一宿主有可接管槽位」:要么跨根探测进热路径,要么无从得知
- 第三宿主(gemini):`--from` 从 `PLATFORMS` 派生 ⇒ 不构成前置

## 任务(按依赖排序)

### T1 (P1) — `repoKey` win32 大小写归一 + 账本键迁移 【必须最先】

- **Why**: 实测 `path.resolve` 完整保留大小写含盘符(`resolve('d:/gitcode/harnessed')` ≠ `resolve('D:/GitCode/harnessed')`)。同一目录用不同大小写进入就是两个独立槽位,在途 workflow 静默消失。**非 adopt 特有,是既存缺陷。**
- **落地后 D9 的局部归一成为死代码,不写。**
- Files: `src/checkpoint/workflowStore.ts`(`repoKey` 返回前归一)· 一次性账本键迁移 · `src/cli/lib/migration-report.ts`(如需出报告)
- TDD: 必须。核心数据结构键 + 迁移,错误成本高。
- Verify: 两种大小写进入得同一槽位;迁移幂等;旧账本读起来不丢槽位;回滚路径有测试

### T2 (P1) — 抽 `readStoreAt(root)`,`readStoreRaw` 变一行委派

- Files: `src/checkpoint/workflowStore.ts`
- **安全前提已验**:`workflowStore.ts` 在 `tests/` 下**零** `vi.mock` 工厂模拟 ⇒ 可加新导出
- Verify: R1 回归 —— `readStoreRaw()` 仍读 `getHarnessedRoot()/workflows.json`、仍 `Value.Check`、仍 fail-soft 空店,逐字不变

### T3 (P1) — 导出 `resolveHostWithReason()`,`resolveHost` 委派

- **Why**: D8 的拒绝文案要点名「依据」。在 adopt 里复算 `resolveHost`(`platform.ts:182-224`,40 行 5 分支 3 处 fall-through)是必然漂移点。
- Files: `src/platform/platform.ts`
- 约束: `detectPlatform()` 返回形状**不变**;`tests/installers/platform-golden.test.ts` 必须不变即绿

### T4 (P1) — `adoptSlot.ts` 核心

- Files: `src/checkpoint/adoptSlot.ts`(NEW)
- 实现 D2 / D4 / D7 / D9 / D10 / D11 / D13 / D14 / D15
- 签名收 `home` 参数(默认 `homedir()`),见 T9 的沙箱要求
- TDD: 必须。编排逻辑 + 全部拒绝路径。

### T5 (P1) — 目标宿主未 setup 时拒绝

- **Why**: 账本不是 codex 唯一需要的。`commandsDir` / `skillsDir`(`platform.ts:134-137`)只有 `harnessed setup --platform codex`(`setup.ts:58,68-88`)才填。无此前置,happy path 是「adopt 说 OK,codex 没有命令可跑」。
- 判据: 目标根的 `state.json` / `.platform` / 非空 `commandsDir`

### T6 (P1) — CLI 接线 `checkpoint adopt`

- Files: `src/cli/checkpoint.ts`(已 916 行,只接线不放逻辑)
- D16: `--from` 候选从 `PLATFORMS` 派生

### T7 (P2) — `::displaced-*` 归档 + 修剪

- **Why**: `src/cli/gc.ts:165` 只扫安装备份与编译产物,`src/` 里**没有任何** `delete store.workflows[...]`。无修剪则 map 单调增长,数周内「歧义拒绝」变成常态。

### T8 (P2) — `resume` 不再叫接力用户回 Claude Code

- `resume.ts:83` 硬编码 `→ in Claude Code: /gsd-execute-phase ${phase}`;`:81` 把拷来的 `session_id` 当「SDK will redirect to original session」广告,而那是 CC 的 session id,在 codex 下无意义
- 注: Phase 65 的 `scripts/check-host-primitives.mjs` 只扫 `workflows/**/SKILL.md` 与 yaml,**扫不到 TS 运行时字符串**(盲区,另记 TODO)

### T9 (P1) — 测试:27 条路径 + 3 条回归,两个 sandbox seam 并用

- **两个 seam 缺一不可**:
  - **源**根经 `claudeDescriptor(home)` / `codexDescriptor(home)` ⇒ 测试传注入的 `home`(tmpdir 造假双宿主)
  - **目标**根经 `getHarnessedRoot()` → 无参 `detectPlatform()`(`harnessedRoot.ts:72-74`)⇒ 只能靠 `HARNESSED_ROOT_OVERRIDE`
  - `HARNESSED_ROOT_OVERRIDE` **只替换已解析宿主的 stateRoot**(`platform.ts:177-178`,注释 `:170` 明写 pin 仍在宿主自己根下读),管不到另一宿主的根
  - 设一个不设另一个 ⇒ 读写真实用户目录;CI 上(无 `~/.claude` 无 `~/.codex`)**真空跑绿**
- 回归(IRON RULE,不问直接加):
  - **R1** `readStoreRaw` 委派后行为逐字不变
  - **R2** 承重不变量:**任何** adopt 路径(含每条拒绝)之后,源根文件内容 **与 mtime** 逐字节不变
  - **R3** 六个裸键回退点一个未动:`state.ts:101` · `workflowStore.ts:151` · `checkpoint.ts:112` · `checkpoint.ts:308-309` · `injectStateMain.ts:151` · `bin/harnessed-inject-state.mjs:599`

### T10 (P1) — 改写 ADR-0043 【可与 T1 并行,纯文档】

- Status: Proposed → Accepted(改写后)
- 必须记:共享根否决 · 三个未决项的答案(证据:只搬账本 ⇒ 实际连账本也只拷槽位;源槽位:不动+警告;status 曝光:不做)· **Decision #3 有害**的认定 · 一个会话的寿命语义 · 跨根只读不变量
- 同步 `docs/adr/README.md` 索引行

### T11 (P2) — 10 份 README 命令表各加一行

- 每份 24 行命令表,**`scripts/` 与 `tests/` 下零 parity 闸门** ⇒ 漏一个没人抓
- 已核实**不在范围**: i18n catalog(`src/cli/checkpoint.ts` 的 `t()` 调用数为 0,checkpoint 文案全硬编码英文)· schema regen(无 typebox 改动)

### T12 (P2) — `retro_meta` 取 max 带走,`intents` 不带(D15)

## 验收标准

1. 真机接力:claude 侧在途 phase → codex 里 `adopt` → `checkpoint complete` 推进,新证据落 codex 根
2. R2 不变量有断言守护
3. 10 道硬闸门(`scripts/check-*.mjs`)全绿 + `pnpm exec biome check --write` 先行
4. vitest 全量绿(基线 3296/0,`--no-file-parallelism` 为权威口径)
5. 3-OS CI `conclusion=success`(push 后必查,不看绿勾看结论)

## 并行

- `Lane A: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T12`(共享 `src/checkpoint/` 与 CLI 契约,顺序)
- `Lane B: T10 → T11`(纯文档,独立)
- `Lane C: T8`(独立文件)
- **冲突标记**: 并行时**只能一个执行者碰 git**(多 subagent 同工作树并发跑 git 会写坏 `.git/index`),或用 worktree 隔离
