# ADR-0003: Install Method Count Errata (5 → 6) — 文档对齐

## Status

**Accepted** — 2026-05-12

## Context

### V1 BLOCKER 历史回溯

phase 1.1 plan-check 阶段（`.planning/phase-1.1/PLAN-CHECK.md`）发现 install method 计数不一致：

- ADR 0001 实际枚举 **6 种** install method：`cc-plugin-marketplace` / `git-clone-with-setup` / `npx-skill-installer` / `npm-cli` / `mcp-stdio-add` / `mcp-http-add`
- 其他文档（PROJECT-SPEC v2.1 § 2 / ROADMAP § 5 / REQUIREMENTS R1.2 / STATE / ADR 0001 Context 描述段）写 **5 种**
- 历史调研（R02 § 红旗 P0#1 / SUMMARY § 二冲突 2）实证 5 种 — 但当时 R02 把 `mcp-stdio-add` 与 `mcp-http-add` 视作单一"MCP 通道"。schema 落地时拆为两个独立 method（transport 字段差异、idempotent_check 命令不同）

plan-check verdict 是 ⚠️ APPROVED WITH CONDITIONS：**最小修正**先 patch phase-1.1 内文件（PLAN.md / task_plan.md），SPEC / ADR / ROADMAP **推迟到 T7.10 verdict 后一并处理 ADR 0003 errata**。

### T7.10 Verdict（Phase 1.1 关键 milestone）

batch 4 完成后，T7.10 verdict 确认（progress.md § B F14）：

> **✅ schema v1 sufficient** — 9 上游 (10 manifests) all pass strict schema validation, zero missing fields, zero schema anomalies. Coverage: 4/4 type, 5/6 install.method (mcp-http-add 是 schema-only placeholder), 4/4 component_type.

schema 实际是 6 种 method 已经被 9 上游 dry-run **实证 sufficient**，故现在是 **执行文档对齐 errata** 的最佳时机（T7.10 反哺 SPEC/ROADMAP 的预定路径）。

### A7 守恒约束

phase 1.1 acceptance bar A7 要求 **ADR 0001 / 0002 主体未被 phase 1.1 修改**（仅允许 ADR-NNNN errata）。本 ADR 是 errata 形式 — **ADR 0001 main body 不动**，仅通过本 ADR 显式标注 "historical wording"。

## Decision

### 1. 数字修订（活文档 inline patch）

把以下文档中的 "5 种 install method / 5 种异构 install method / 5 种 installer / 5 种子方法" 全部修订为 **6 种**，并列出完整 6 种 method 名称：

| 文件 | 行 | 修订前 | 修订后 |
|------|---|--------|--------|
| `PROJECT-SPEC.md` | 47 | "**安装通道（5 种异构 — install.method 子枚举）**：" | "**安装通道（6 种异构 — install.method 子枚举）**：" + 完整列出 6 种 |
| `.planning/REQUIREMENTS.md` | 38-39 | "（5 种 install method 子枚举）" / "支持 5 种子方法" | "（6 种 install method 子枚举）" / "支持 6 种子方法" |
| `.planning/ROADMAP.md` | 51 | "5 种 installer 中的 3 个" | "6 种 installer 中的 3 个" |
| `.planning/ROADMAP.md` | 124 | "5 种 installer 全部覆盖 9 个上游" | "6 种 installer 全部覆盖 9 个上游" |
| `.planning/STATE.md` | 128 | "5 种 install method 用子枚举" | "6 种 install method 用子枚举" |

### 2. ADR 0001 main body 不动（A7 守恒）

`docs/adr/0001-manifest-schema-v1.md` line 14 / 21 / 189 的 "5 种" 文字 **保留作为 historical wording**：

- line 14 / 189 是引用 PROJECT-SPEC（patch 前的 verbatim quote）— 留作历史记录
- line 21 是引用 R02 红旗 P0#1（当时调研结论）— 留作历史记录

读者通过本 ADR 0003 知道：**ADR 0001 文中"5 种"的引用应读为"6 种"**（schema 实际枚举 6 种）。

### 3. 历史/调研文档不动

以下文档**不修改**（保留时刻快照价值）：

- `.planning/research/02-upstream-reality.md`（调研报告 — R02 当时的认识）
- `.planning/research/SUMMARY.md`（synthesizer 当时综合）
- `.planning/phase-1.1/PLAN-CHECK.md`（plan-checker 当时识别的 V1 BLOCKER）
- `.planning/phase-1.1/GRAY-AREA-1-json-schema.md` / `GRAY-AREA-2-repo-structure.md`（discuss-phase 调研）

这些文件的"5 种"是历史调研轨迹，不应 retroactively 改写。

## Consequences

### 正面

1. **SSOT 一致性恢复** — 活文档（SPEC / REQUIREMENTS / ROADMAP / STATE）与 schema 实际枚举对齐
2. **A7 守恒维持** — ADR 0001 main body 0 修改，仅以本 ADR 形式 errata
3. **历史可追溯** — 调研/PLAN-CHECK 文件保留快照，未来读者能理解 5→6 的演化路径
4. **mcp-http-add 字段定义保留** — 即使 v0.1 phase 1.1 dry-run 没有真上游用 mcp-http-add，schema 已为 phase 1.2+ 的 MCP HTTP server 上游（如 Vercel / Cloudflare MCP）预留

### 负面

1. **文档版本号不变**（PROJECT-SPEC 仍 v2.1）— errata 不构成 minor version bump，符合 ADR 0001 § Compliance "schema 任何字段 add/remove/rename/type 变更 → ADR 0002+ + 全量 migration"，但本 errata 不涉及 schema 字段变更，故无 migration
2. **读者认知负担** — 读 ADR 0001 historical wording "5 种" 时需通过本 errata 解读为 "6 种"
3. **mitigation**：在 ADR 0001 README 索引（`docs/adr/README.md`）通过添加 superseded link 让读者立即看到 ADR 0003 提示

### 中性

1. T8 矩阵测试已按 6 method × 4 type = 24 - 6 legal = **18 illegal combinations** 设计（PLAN.md line 138 + task_plan.md T8.3 已 patch），与本 ADR 一致
2. 未来若新增 install method（如 v0.2+ MCP Docker），需出 ADR 0004+ 同时修订 schema + 文档（不是 errata 路径）

## Compliance / Migration

### v0.1 起的强制约束

- 任何活文档新增引用 install method 数量必须用 **6 种**
- ADR 0001 main body 永久保留 historical wording — 不允许 inline 修订
- 未来调研 / PLAN-CHECK / 综合文档应记录"6 种 install method"作为基线

### A7 验收命令更新建议（不强制）

`git diff` ADR 0001 验收命令（如 PLAN.md A7）保持原样 — 本 ADR 0003 不修改 ADR 0001。

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § Decision "type × install.method 兼容矩阵"（实际枚举 6 种）
- `.planning/phase-1.1/PLAN-CHECK.md` § V1 BLOCKER（识别）
- `.planning/phase-1.1/progress.md` § B F14（T7.10 verdict — schema v1 sufficient）
- `manifests/SCHEMA.md` § 6（已列 6 method 表）
- `schemas/manifest.v1.schema.json` artifact（runtime 校验入口，已 enforce 6 method）

### 外部参考

- 无（本 errata 完全 internal — 文档对齐范畴）
