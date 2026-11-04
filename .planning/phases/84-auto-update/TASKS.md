# Test diagram + Implementation Tasks — Phase 84 自动更新

> 契约与验收标准见 `CONTEXT.md`;错误与救援表见 `ERRORS.md`。

## Test diagram

```
consent
  ├─ 文件缺失        → {enabled:true, autoUpdate:false}
  ├─ 文件损坏        → {enabled:false, autoUpdate:false, unreadable:true}
  ├─ autoUpdate:true → 开(与 enabled 无关)
  └─ autoUpdate 非 boolean → 关

根路径
  ├─ CLI 与 hook 同 root → 写读一致
  └─ root 不同(HARNESSED_ROOT_OVERRIDE 偏差) → 命令打印路径,当场可见

通道
  ├─ binary → 走自替换
  └─ npm/bun → skipped:npm-channel(不下载)

预检 → 取锁 → 下载(顺序固定)
  ├─ 目录不可写 → exec-dir-readonly(取锁之前就停)
  ├─ 拿到锁   → 继续
  └─ busy     → skipped:busy(不下载)

限流
  ├─ 同版本无完整失败记录 → 继续
  └─ 有完整失败记录(<24h) → 跳过

下载
  ├─ 一次成功          → 校验 → 换入
  ├─ 中断+206(起点=N)  → 续传(追加)
  ├─ 中断+206(起点≠N)  → 丢弃 .part,重下
  ├─ 中断+200          → 截断重下
  ├─ 停滞(有字节)      → 保留 .part,不消耗配额
  └─ 停滞(零字节)      → 完整失败,消耗配额

换入
  ├─ 成功             → 交接 → updated + notice + gc
  ├─ temp→exec 失败   → 回滚 → swap
  ├─ 双失败           → swap-critical + 关开关
  └─ 冒烟失败         → 保留 .part(下次直接冒烟)

交接
  ├─ claude 成功 → updated
  ├─ codex 成功  → handover-trust-pending(hooks 未刷新)
  └─ 失败        → handover

公告
  ├─ 首次会话 → 打印(版本 + CHANGELOG + restart)
  └─ 再次会话 → 不再打印(consumedAt)
```

## Implementation Tasks

```markdown
## Implementation Tasks
Synthesized from this review's findings. Each task derives from a specific
finding above. Run with Claude Code or Codex; checkbox as you ship.

- [ ] **T1 (P1, human: ~4h / CC: ~20min)** — preferences — 单一 reader + consent 独立(R3/R22)
  - Surfaced by: Section 2/3 — 三个读者三种语义 + 「开了却永不触发」的坑
  - Files: `src/cli/lib/updateReminderPreferences.ts`(新)、`src/compile/updateReminderEntrypoint.ts`、
    `src/cli/lib/refreshOwnedUpdate.ts`、`src/cli/setup.ts`、`tests/cli/lib/updateReminderPreferences.test.ts`
  - Verify: reader 单测绿;setup 的写入改成 read-modify-write(保留 `autoUpdate` 与其它键)
- [ ] **T2 (P1, human: ~3h / CC: ~15min)** — 状态文件 + status 输出契约(R12/D10/D12)
  - Surfaced by: Section 8 — 无格式契约则 AC6 不可测
  - Files: `src/cli/lib/autoUpdateStatus.ts`(新)、`tests/cli/lib/autoUpdateStatus.test.ts`
  - Verify: schema 单测 + history 截断单测(AC8)+ 原子写(无残留 tmp)
- [ ] **T3 (P1, human: ~6h / CC: ~30min)** — 公开子命令 `harnessed auto-update`(D9/R15/R18)
  - Surfaced by: Section 9 — 公开命令面 32 → 33 + 11 个 README locale
  - Files: `src/cli/autoUpdateCmd.ts`(新)、`src/cli.ts`、`tests/docs/cli-surface.contract.test.ts`、
    `README.md` + `README-{en,ja,ko,pt-BR,ru,th,tr,tw,vi,zh}.md`
  - Verify: 合同测试绿(AC12);status 输出与契约一致(AC6);命令打印解析出的两个路径(R15)
- [ ] **T4 (P1, human: ~6h / CC: ~30min)** — Range 续传改造(R4/R5/R23)
  - Surfaced by: Section 5/6 — D7 在现有代码结构下不可实现;第三轮发现「冒烟失败保留分片」与
    「part→exe 改名顺序」自相矛盾(冒烟时 `.part` 已被改名走,无从保留)
  - Files: `src/cli/lib/selfUpdateBinary.ts`、`tests/cli/lib/selfUpdateBinary-stream.test.ts`
  - Verify: 206 追加 / 200 截断 / 206 起点不符丢弃重下 / 416 视为已完整 / 停滞保留分片 /
    冒烟失败 rename 回 `.part`(下次不重下)/ 冒烟目标名版本稳定(无 PID)/ AC3
- [ ] **T5 (P1, human: ~6h / CC: ~30min)** — 自动更新编排 + 锁 + 预检 + CRITICAL 路径(R1/R2/R6/R7/R20/R21)
  - Surfaced by: Section 1/2 — 与手动更新撞车、exec 无 binary 的最坏状态
  - Files: `src/cli/lib/autoUpdate.ts`(新)、`src/cli/updateReminderWorkerMain.ts`、
    `src/cli/updateReminderHookMain.ts`、`tests/cli/lib/autoUpdate.test.ts`
  - Verify: busy 不下载(AC9)、双失败 CRITICAL(AC10)、npm 通道跳过(AC5)、
    完整性失败限流(AC4)、注入的 `spawnOwnedRefresh` 被调用(AC2)
- [ ] **T6 (P1, human: ~4h / CC: ~20min)** — 交接 + 公告一次性 + gc(R8/R9/R14/R16/R17/R19)
  - Surfaced by: Section 1/4 — 公告要 restart 提示与一次性;codex 信任闸门;.bak/.part 卫生
  - Files: `src/cli/lib/autoUpdate.ts`、`src/cli/update.ts`(扩展 `changelogTop` 按版本取)、
    `src/cli/lib/ownedRefresh.ts`、`src/cli/gc.ts`
  - Verify: 公告内容与一次性(AC7)、notice 与下次会话打印一致(AC14)、
    codex 场景 `handover-trust-pending`、gc 清 `.bak` 与 `.part`
- [ ] **T7 (P1, human: ~3h / CC: ~15min)** — i18n(R10)
  - Surfaced by: Section 5 — 新文案必须走 `t()`
  - Files: `messages/en.json`、`messages/zh-Hans.json`、`src/cli/lib/autoUpdate*.ts`、`src/cli/autoUpdateCmd.ts`
  - Verify: `tests/unit/i18n-parity.test.ts` 绿
- [ ] **T8 (P2, human: ~2h / CC: ~10min)** — 生成产物与门禁(R13)
  - Surfaced by: Section 9 — CI 有 `bin/` drift 硬门禁
  - Files: `bin/harnessed-update-reminder*.mjs`(重生成)
  - Verify: `corepack pnpm build:hooks` 后 `git diff --exit-code bin/` 干净
- [ ] **T9 (P2, human: ~3h / CC: ~15min)** — 本机实测(AC13)
  - Surfaced by: Section 9 — 发布门
  - Files: 无(验证步骤)
  - Verify: 真实 release 自动更新一次,版本变化 + hooks 刷新 + status 正确 + rollback 可用
- [ ] **T10 (P1, human: ~4h / CC: ~20min)** — canonical state root 单一真相源(R15/R26/R27)
  - Surfaced by: Section 2/3 — 三套 root 推导,有 override 时 CLI 认、codex 路径不认 → 写 A 读 B;
    且 CLI 的默认宿主未定义 → codex-only 机器「开了永不触发」
  - Files: `src/platform/stateRoot.ts`(新)、`src/compile/updateReminderEntrypoint.ts`、
    `src/installers/codexHookAdd.ts`、`src/cli/lib/refreshOwnedUpdate.ts`、
    `src/cli/autoUpdateCmd.ts`、`src/cli/lib/autoUpdate.ts`
  - Verify: AC15(同一 hostId 下命令写的路径 == worker 读的路径);无 override 时
    codex hook 的命令字面量**不变**(不触发重新注册);命令输出打印宿主 + 两个路径
- [ ] **T11 (P2, human: ~2h / CC: ~10min)** — ADR 0044 amend(R28)
  - Surfaced by: Section 2 — ADR 与 phase 台账不同步(同一事实两个家)
  - Files: `docs/adr/0044-auto-update-consent-and-handover.md`
  - Verify: ADR 的 root 规则、冒烟/分片顺序、AC 计数、锁的「exe 目录可写」承重约束与
    phase 契约一致;实现级细节(文件名、顺序)下沉到 phase,ADR 只留决策与理由
```
