# task_plan — 4.26.0 A3 串行次序守卫(transition 级校验,intel 候选 P1)

status: ready-to-execute
来源:intel 增补 3 候选 A3(comet 0.3.9 phase-skip 教训:"prose 门挡不住,enforcement
必须每个 transition 脚本级校验"),用户"评估之后按优先级推进"。
缺口实锤:SubProgressEntry(currentWorkflow.v1.ts)无 mode/order 字段 — gates plan 的
串并行语义 seeding 时丢失;`checkpoint complete` 只有 evidence guard,无次序守卫。
串行前置(如 verify 的 progress order 1)pending 时 complete 后面的 sub 不设防。
markSub 对未知 sub 已抛错(该面有防线)。

## 锁定决策
- D1 schema 扩展:SubProgressEntry 加可选 `mode: 'serial'|'parallel'` + `order?: number`
  (Optional — 旧 envelope 无字段合法);seedLedger 从 gates plan fire 条目透传(确认
  FireEntry 携带 mode/order,缺失则从 gates.ts fireEntry 补透传)。
  **typebox 改动 → 必须 `pnpm build && pnpm build:schema` 并提交 schemas/**(memory 铁律)。
- D2 次序守卫(`checkpoint complete` 与 `fail` 同点):目标 sub 在 ledger 索引 i,
  存在 j<i 且 entries[j].status==='pending' 且 entries[j].mode==='serial' → fail-closed
  BLOCK,输出被阻塞原因 + pending 的串行前置名 + 两条出路(先完成前置 / --force 越过并
  打印越过声明)。--force 复用现有 flag,不新增 ledger 字段(不与 evidence_status 混载)。
  并行组内乱序、串行尾(simplify order 99)在全前置 resolved 前被拦 — 均符合 verify
  master 设计语义。
- D3 back-compat fail-soft:旧 ledger 条目无 mode → 守卫对该前置 no-op(无从判定,
  不误拦);守卫任何内部异常 → warn + 放行(运行时故障 fail-soft,4.23.2 分型立场:
  这不是配置错误面)。
- D4 bin/注入端不涉(ledger 消费只读);状态 schema 变更为可选字段,injectState/status
  读旧新 envelope 均兼容 — 用测试锁。
- D5 版本 4.26.0;TDD 红先行。同批记录 B2 DEFER 决策(intel 回填:B1 已覆盖注入大头,
  status/prompt 消费面低频收益边际,YAGNI 不做)。

## T1 测试红先行:seeding 透传 mode/order / 守卫拦截(串行前置 pending)/ 并行乱序放行 /
     串行尾拦截 / --force 越过 + 声明 / 旧 ledger 无 mode no-op / 守卫异常 fail-soft /
     schema 旧 envelope 兼容(injectState/status 读取)
## T2 D1 schema + seedLedger 透传 + build/build:schema + schemas/ 提交
## T3 D2/D3 守卫实现 [checkpoint.ts complete/fail 路径]
## T4 收尾:vitest 全量 + tsc + pnpm lint + gates 7/7 + schema drift 检查;
     CHANGELOG `## [4.26.0]` + bump + progress.md + intel 回填(A3 IMPL / B2 DEFER);
     commit 即 push;tag 等确认。
