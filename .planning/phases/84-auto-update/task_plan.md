# Task Plan — Phase 84 自动更新(binary 通道)

> 详细契约与验收标准见同目录 `CONTEXT.md`;决策记录见 `docs/adr/0044-auto-update-consent-and-handover.md`。

## Goal

给 harnessed 的 binary 通道补上「自动触发」:检测到新版本 → 后台下载 → 校验 → 原地换 binary
→ 新 binary 刷新自有 skills/hooks → 下次会话告知。全程 consent 默认关,失败不静默。

## Phases

- [x] 治理: gstack `/plan-ceo-review`(SELECTIVE EXPANSION)+ 对抗性 spec review 第一轮
- [x] 决策落地: D1-D13 + R1-R14 写进 `CONTEXT.md` 与 ADR 0044
- [x] 对抗性 spec review 第二、三轮(4/10 → 6/10 → 7/10,Scope PASS;R1-R28 全部折进计划)
- [x] T1 preferences 单一 reader + consent 独立
- [x] T2 状态文件 schema + status 输出契约
- [x] T3 公开子命令 `harnessed auto-update` + 11 个 README locale + 合同计数
- [x] T4 Range 续传改造(`.part` / 206 / 200 / stall / part→exe)
- [x] T5 自动更新编排 + update lock + 预检 + CRITICAL 路径
- [x] T6 交接 + 公告 + gc
- [x] T7 i18n(en/zh-Hans + parity)
- [x] T8 生成产物与门禁(build:hooks + bin/ drift)
- [x] T10 canonical state root(`src/platform/stateRoot.ts`)+ 入口 gate 修正
- [ ] T9 本机实测(发布门):命令面已实测 ✓;**binary 通道的真实自动更新需等本功能发布后**
      (被自动替换的 binary 必须自带本功能 → 只能在 v5.0.13 发布后才可能发生)

## Owned Files

- `src/cli/lib/updateReminderPreferences.ts`(新)
- `src/cli/lib/autoUpdateStatus.ts`(新)
- `src/cli/lib/autoUpdate.ts`(新)
- `src/cli/autoUpdateCmd.ts`(新)
- `src/cli/updateReminderWorkerMain.ts`
- `src/cli/updateReminderHookMain.ts`
- `src/compile/updateReminderEntrypoint.ts`
- `src/cli/lib/selfUpdateBinary.ts`
- `src/cli/lib/refreshOwnedUpdate.ts`
- `src/cli/setup.ts`
- `src/cli.ts`
- `src/cli/update.ts`
- `messages/en.json`、`messages/zh-Hans.json`
- `README.md` + `README-{en,ja,ko,pt-BR,ru,th,tr,tw,vi,zh}.md`
- `tests/docs/cli-surface.contract.test.ts`
- 对应测试文件

## Acceptance Criteria

见 `CONTEXT.md` 的 AC1-AC15(全部为可判定断言)。摘要:

1. `autoUpdate` 关时,worker 不发 asset 请求、不写状态文件、提醒缓存逐字节不变
2. 开 + claude + 有新版本 → 换 binary + 交接 + 状态 updated + notice 写入
3. 续传:206 追加 / 200 截断
4. 完整性失败 → 原 binary 不变 + 24h 内不再自动尝试
5. npm 通道 → 不自替换,状态标 npm-channel
6. status 输出与契约逐字段一致
7. 公告含版本变化 + CHANGELOG 段落 + restart 提示(codex 另含信任提示)
8. 12 次失败 → history 留最近 10 条
9. 锁被占 → 不下载
10. 换入双失败 → swap-critical + restore 指令 + 自动关开关
11. 门禁:biome / typecheck / build:hooks+bin drift / i18n parity / check-*.mjs / vitest 全绿
12. 公开命令面 32→33 + 11 个 README locale 各一行
13. 本机实测一次真实自动更新 + rollback 可用(发布后补)
14. 公告的落点一致:交接后状态文件里的 `notice` 与下次会话打印的内容一致
15. 同一 hostId 下,`harnessed auto-update on` 写入的 preferences 路径 == 后台 worker 读取的路径

## Dependencies

- T1 → T2(T2 的 consent 字段来自 T1 的 reader)
- T2 → T3(status 命令读 T2 的文件)
- T1 + T2 → T5(编排要读 consent 与写状态)
- T4 独立,但 T5 依赖它的续传契约
- T3 → T7(i18n 要覆盖子命令文案)
- 全部 → T8/T9

## Errors

- (none yet)

## 实施期新增文件(2026-11-04)

- `src/platform/stateRoot.ts`(新)— `canonicalStateRoot(hostId)`,R15 单一真相源
- `src/cli/lib/changelogSection.ts`(新)— CHANGELOG 摘要(独立小模块,免得拖进整个
  update 命令 → compiled worker 体积)
- `src/cli/lib/autoUpdateHandover.ts`(新)— 交接(env 传 status 路径 + `from` 记录)
- `src/cli/lib/autoUpdateNotice.ts`(新)— 公告读写与一次性消费
- `tests/platform/stateRoot.test.ts`、`tests/cli/autoUpdateNoticeHook.test.ts`、
  `tests/cli/lib/autoUpdateOwnedRefreshNotice.test.ts`、
  `tests/compile/auto-update-entry-gate.test.ts`(新)
