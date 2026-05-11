# Phase 1.1 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（系统对独立 findings.md 文件名敏感，故合并）。
> **完整规划与依赖图**：见 `PLAN.md` § 2-3
> **可勾选任务清单**：见 `task_plan.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker，重大事项升级 ADR）

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 task → 在 § A.4 追加一行 `YYYY-MM-DD | T<N>.<M> | <result> | <commit-shorthash>`
- 该 task 涉及的 acceptance bar 同步更新 § A.2 状态（⏳ → ✅）
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fx`

### A.2 Acceptance Bar Snapshot

(每完成一个 task 后用 ✅/❌/⏳ 更新)

- ⏳ **A1** `pnpm test` ≥ 50 测试 passed
- ⏳ **A2** ctx7 manifest 在正向测试中 pass
- ⏳ **A3** ≥ 35 个负向测试 + 行号 assertion 全绿
- ⏳ **A4** GitHub Actions mac/linux/win × Node 22 全绿
- ⏳ **A5** `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` exit 0
- ⏳ **A6** vitest bench 100 manifest < 50ms
- ⏳ **A7** ADR 0001 / 0002 主体未被 phase 1.1 修改
- ⏳ **A8** `git ls-files --eol manifests/*.yaml` 输出 LF

### A.3 Wave 进度概览

| Wave | 内容 | Tasks | 状态 |
|------|------|-------|------|
| 1 | 仓库骨架与工具链 | T1 + T2 | ⏳ 未开始 |
| 2 | Schema 实现与 validator | T3 + T4 | ⏳ 未开始 |
| 3 | Schema artifact + SCHEMA.md | T5 + T6 | ⏳ 未开始 |
| 4 | 9 上游 dry-run | T7 | ⏳ 未开始 |
| 5 | 测试矩阵 | T8 | ⏳ 未开始 |
| 6 | CI + Docs | T9 | ⏳ 未开始 |
| 7 | Phase verify | T10 | ⏳ 未开始 |

### A.4 进度日志（追加式 — newest at bottom）

<!--
示例条目：
2026-05-11 | T1.1 | created 22 dirs incl manifests/ workflows/ routing/ etc. | a1b2c3d
2026-05-11 | T1.2 | .gitattributes locked LF for yaml/json/md (C3 mitigation) | e4f5g6h
2026-05-11 | T1.3 | .gitignore + vendor/ENTRY-CRITERIA.md placeholder; see § B F2 about windows symlink | i7j8k9l
-->

[尚未开始 — 等待 execute-phase 启动]

### A.5 Session 中断恢复指引

如果 session 中断，执行者下一次 resume 时：

1. 读 § A.4 → 找最后一行进度，确认上一个完成的 task
2. 读 § B → 检查是否有 ⚠ open blocker 需要先处理
3. 读 `task_plan.md` → 找下一个未勾选的 task
4. 执行下一个 task → 完成后追加一行到 § A.4 + 勾选 task_plan.md + 必要时 update § A.2

如果出现 PLAN.md / task_plan.md 描述与代码现实冲突：**stop and write a finding to § B**，不要 work around。

---

## Section B — Findings & Decision Log

### B.1 用途

- 执行中遇到的意外、决策修订、需要 escalate 的事项记录在此
- 进度 happy path 之外的任何事都进 § B — 哪怕是"小坑"也写一行
- 重大事项（影响 ADR / SPEC 决策）→ 升级为 `docs/adr/0003-*.md` errata 或 patch；同步 § B.5 索引表

### B.2 Finding 模板（参考用，不删）

```markdown
### F<N> — <一句话标题>

- **Date**：YYYY-MM-DD
- **Trigger task**：T<N>.<M>
- **Symptom**：<观察到什么>
- **Hypothesis**：<推测原因>
- **Impact**：<影响哪些 task / acceptance bar>
- **Resolution**：⏳ in-progress / ✅ resolved / ❌ blocker — escalate / ⚠ ADR-bound

<详细 narrative，含 stack trace / 命令输出 / 决策路径...>
```

### B.3 Findings

#### F0 — 起点确认（占位，不计 finding）

- **Date**：2026-05-11
- **State**：phase 1.1 plan 创建完成。仓库根目前仅含 `.gitignore` `README.md` `PROJECT-SPEC.md` `WORKFLOWS-MVP.md` `.planning/` `docs/adr/0001` `docs/adr/0002`。所有 task 起点干净。
- **Resolution**：✅ baseline confirmed; ready for execute-phase

[尚未开始 — 等待 execute-phase 启动；后续 finding 追加在此]

### B.4 C2 callout 专用追踪（T7.10 反哺判定）

T7.1-T7.9 9 上游 dry-run 期间，每发现一个 schema 字段不足或语义不清，在此追加：

| 上游 | 缺 / 疑问字段 | 路径 A: in-place patch ADR 0001 / 路径 B: 出 ADR 0003 errata / 路径 C: 占位 TBD 不算缺 | 状态 |
|------|--------------|------------------------------------------------------------------------------|------|
| (none yet) | | | |

T7.10 verdict（在 T7.9 完成后回来填）：⏳ pending / ✅ schema v1 sufficient / ⚠ requires patch / ❌ requires errata

### B.5 已升级为 ADR 的 finding 索引

(如果某 finding 触发 ADR 0003 errata，在此表追加索引)

| Finding ID | ADR | 决策摘要 | 决策日期 |
|-----------|-----|---------|---------|
| (none) | (none) | (none) | (none) |
