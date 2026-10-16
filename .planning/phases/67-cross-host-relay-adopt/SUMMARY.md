# Phase 67 SUMMARY — 跨宿主接力 `checkpoint adopt`

**状态**:T1-T12 全部完成(2026-10-15 立项 -> 2026-10-16 收口),**未发版**(等维护者确认)
vitest 3446 通过 / 0 失败 / 5 skipped / 1 todo · tsc 0 · biome 0 · 十道 `check-*.mjs` 全 PASS · bin 漂移闸门 PASS · CI 末尾 commit `840906a` success

## 交付

| T | 内容 | commit |
|---|---|---|
| T10 | ADR-0043 改写为 Accepted:共享根否决,原 Decision #3 认定有害 | `cbd4f0e` |
| T1 | `repoKey` win32 大小写归一 + 账本键迁移(含 inject 复制品同折) | `993b12d` |
| T2/T3 | `readStoreAt(root)` + `resolveHostWithReason()` | `74f4714` |
| T4-T6 | `adoptSlot.ts` + 目标宿主就绪检查 + CLI 接线 + `HOST_IDS` | `541be4b` |
| T7 | 账本槽位修剪(`gc`)+ adopt 忽略陈旧会话槽位 | `c18c04a` |
| T8 | `resume` / `checkpoint` 描述宿主中立 | `584d483`, `00a2324` |
| T11 | 10 份 README 命令表加 adopt 行 | `840906a` |
| T9/T12 | 随 T4-T7 交付(见下) | 同上 |

## 验收对账

1. **真机接力**:未在真实 claude+codex 双宿主上跑。以 fixture 双宿主沙箱经真实 `dist/cli.mjs` 冒烟(成功、src==dest 拒绝、目标占用拒绝、`--from` 省略推断)。真机验证留给维护者。
2. **R2 不变量**:`adoptSlot.test.ts` 在每条路径(含拒绝)后比对源根内容与 mtime。
3. **R1**:`workflowStore.test.ts` 的 `readStoreRaw` 契约测试。
4. **R3**:`state.ts` 自基线零 diff;`workflowStore` / `checkpoint.ts` / `injectStateMain.ts` 的删除行里没有回退表达式;注入器仍查 `[composite, bare]`。行为由 `state-store.test.ts`、`staleLedgerPerSlot.test.ts` 守。
5. **T12**:`adoptSlot.test.ts` 的 D15 组(max 合并、保留较新 `last_retro_at`、`intents` 不带)。

## 过程教训(详 `findings.md`)

- F8:引用了不存在的 `PLATFORMS` 符号(grep 了注释而非符号)。
- F2:T1 原设计会让 win32 每轮 hook 注入失明,由 subagent 的 NEEDS_CLARIFICATION 抓出。
- F10:槽位无人修剪会让 adopt 的多候选拒绝变常态,T7 因此升为前置。
- T8 漏跑 `tests/integration` 致 CI 三平台红一次(`584d483`),改文案前应先全仓 `rg` 再跑全量。

## 结转

- `check-host-primitives` 扫不到 TS 运行时字符串(F7)。
- `PlatformDescriptor.id` 允许 6 个 id 但只有 2 个有描述符(F12),gemini 里程碑开工时要同步。
- 非中文 README 的 adopt 行译文未经母语者校对。
