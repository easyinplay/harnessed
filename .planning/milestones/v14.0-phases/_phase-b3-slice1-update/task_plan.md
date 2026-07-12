# task_plan — 4.27.0 B 路线 Phase 3 Slice 1:二进制正确性 + 自更新

status: ready-to-execute
spec SoT: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-12-b5-phase3-slice1.md`
(CEO review CLEAR:spec loop 3 轮 18 修 PASS 8.5/10 + 深审 3 findings + outside voice
4 tensions,全部用户裁决;NO UNRESOLVED DECISIONS。本文件只列任务骨架,实现细节
一律以 CEO plan 为准 — 冲突时 CEO plan 赢。)

## 用户已裁决要点(摘要,防实施漂移)
- 并入既有 `harnessed update`,不新增 self-update;模式检测在任何 npm 触碰之前;
  npm 流行为零变化(无 confirm)。
- per-asset `<asset>.sha256`(publish.yml matrix 各 job 生成,glob 顺带上传)。
- 并发:temp 带 pid,不加锁(last-wins accepted risk)。
- 404 → 可操作报错原件不动,不 fallback 旧 release。
- OV3:binary-smoke CI 扩展(真产物 dry-run + 本地源完整 swap,零网络)。
- OV4:手动 restore 命令印在失败报错与 CHANGELOG;--rollback defer。
- E2 = 改造 check-update.ts(24h 缓存 + isCompiledRuntime 分流)+ status 挂载 +
  version-banner 分流;lazy stateRoot + deps 注入(fs-mock 测试防炸)。
- .bak 删除 fail-soft;bin-backup copy 失败跳过删 .bak;gc 扫 .bak-* + 保留集
  {运行中, 新装} + bin-backup 保 1。

## Tasks(T1-T7 成册 = ~/.gstack/.../tasks-ceo-review-20260712-122942.jsonl)
- T1 P1 hook:inject-state 子命令 + hookEntry compiled 路由 + marker 身份扩展双向迁移
- T2 P1 update:compiled 分支全原子序列 + 安全阀 + dry-run + 404 + pid 唯一化
- T3 P1 publish:per-asset .sha256(build-binary.mjs 生成 + publish.yml glob 核验)
- T4 P2 doctor:check-update 改造 + status + version-banner 分流
- T5 P2 gc:assets 保留集 + bin-backup 保 1 + .bak-* 清扫
- T6 P2 ci:binary-smoke 扩展(dry-run + 本地源 swap 演习)
- T7 P3 docs:CHANGELOG 已知限制四条 + 手动 restore 文档(随主 session 收尾)

## T-final 收尾(主 session):vitest 全量 + tsc + pnpm lint + gates 7/7 +
  `pnpm build:binary` 本地冒烟(Windows 真机 dry-run);CHANGELOG `## [4.27.0]` + bump +
  progress + TODOS 对账;commit 即 push;tag 等用户确认;发版后真机 dogfood
  (update compiled 分支首次真实运行)。
