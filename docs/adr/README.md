# Architecture Decision Records

本目录存放 harnessed 项目的架构决策记录（ADR）。

## 格式

采用 Michael Nygard 的 ADR 格式：

- **Title**：`ADR-NNNN: 短标题`
- **Status**：`Proposed` / `Accepted` / `Deprecated` / `Superseded by ADR-XXXX`
- **Context**：决策背景（约束、历史、调研依据）
- **Decision**：实际决策内容
- **Consequences**：正面 / 负面 / 中性后果
- **References**：引用的 spec 章节、research 文件、外部资源

## 编号约定

- 从 `0001` 开始，单调递增
- 即使 ADR 被 deprecated 或 superseded，**编号永不重用**
- 文件名格式：`NNNN-kebab-case-title.md`（如 `0001-manifest-schema-v1.md`）

## 何时写 ADR

参考 `PROJECT-SPEC.md § 8.1`，以下情况**必须**写 ADR：

1. manifest schema 变更（任何字段 add / remove / rename / type 变更）
2. routing 机制变更（B+C 混合方案的任何调整）
3. PROJECT-SPEC § 1 / § 5 已锁定的 14 项决策的修改
4. 新增 workflow type（v1.0 前禁止 — 见 ROADMAP 拒绝清单）
5. `vendor/` 例外条目（必须同时满足 `vendor/ENTRY-CRITERIA.md`）
6. 跨 harness 抽象层的实际启用（v0.5+ 议题）

可选写 ADR：

- 关键库选型（如 yaml 解析器、JSON Schema 校验器）
- 命名空间冲突仲裁（`/harnessed:*` 前缀策略调整）

## 索引

| # | 标题 | 状态 | 日期 |
|---|------|------|------|
| [0001](./0001-manifest-schema-v1.md) | Manifest Schema v1 (see ADR 0005 for cc-plugin-marketplace optional `marketplace_source` field) | Accepted | 2026-05-11 |
| [0002](./0002-repo-structure-toolchain-v0.1.md) | Repository Structure and Toolchain v0.1 | Accepted | 2026-05-11 |
| [0003](./0003-install-method-count-errata.md) | Install Method Count Errata (5 → 6) | Accepted | 2026-05-12 |
| [0004](./0004-installer-dry-run-diff-preview-contract.md) | Installer Dry-Run + Diff Preview UX Contract | Accepted | 2026-05-12 |
| [0005](./0005-marketplace-source-schema-errata.md) | marketplace_source Schema Errata (cc-plugin-marketplace 字段补完) | Accepted | 2026-05-12 |
| [0006](./0006-three-stack-mechanization-wedge.md) | Three-Stack Methodology Mechanization Wedge (架构重定位 — 6+ 角色 / 双职责 / 4 心法 / 23 招式 / 6 category routing engine) | Accepted | 2026-05-12 |
| [0007](./0007-categorization-schema-errata.md) | Categorization Schema Errata (manifest 加 category / install_type / decision_rules 字段) | Accepted | 2026-05-13 |
| [0008](./0008-routing-engine-v1-errata.md) | Routing Engine v1 Errata (phase 1.3 deferred items inline — H1a perf transparency / M1 yaml path migration / D1.4-2 contract delta / phase 1.4 接口契约升级跟踪点) | Accepted | 2026-05-13 |
| [0009](./0009-routing-l2-engineering-23-shi-errata.md) | Routing L2 + Engineering 23 招式 Errata (phase 1.5 — DAG + Semantic Router L2 + mattpocock_phases schema) | Accepted | 2026-05-14 |
| [0010](./0010-installer-schema-extension-errata.md) | Installer Schema Extension Errata (phase 2.1 — license whitelist + bundle-install `provides` + install_type enforcement) | Accepted | 2026-05-15 |
| [0011](./0011-execute-task-sdk-ralph.md) | execute-task workflow + ralph-loop SDK + dual-signal completion + per-phase model tier (phase 2.2) | Accepted | 2026-05-15 |
| [0012](./0012-extension-mvp-karpathy-inject.md) | Extension category MVP + karpathy SKILL inject 引擎 + 30-sample routing ≥85% (phase 2.3) | Accepted | 2026-05-16 |
| [0013](./0013-phase-2.4-doctor-ee4-dashboard-c-path.md) | Phase 2.4 — doctor MIN 5 check + EE-4 plan-checker 量化 + dashboard C 路径 + audit 完整版 | Accepted | 2026-05-16 |
| [0014](./0014-checkpoint-engine-resume-compact.md) | Phase 3.1 — checkpoint 引擎 + harnessed resume + compact 协议 + T4.4 closure infra activation | Accepted | 2026-05-16 |
| [0015](./0015-gstack-probe-interpolate-plan-feature.md) | Phase 3.2 — gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装 | Accepted | 2026-05-17 |
| [0016](./0016-aliases-deprecation-known-good.md) | Phase 3.3 — aliases.yaml RICH redirect + DOCTOR-ONLY-WARN deprecation + known-good 版本组合 lock | Accepted | 2026-05-17 |
| [0017](./0017-routing-hit-rate-token-budget.md) | Phase 3.4 — routing 命中率 ≥85% 验收 + token budget doctor 8th check + v0.3.0 milestone close | Accepted | 2026-05-17 |
| [0018](./0018-routing-audit-log.md) | Phase 4.3 — Routing audit log (JSONL append-only + 12-field schema + forward-only) + R8.4 ADR backfill + v0.4.0 milestone close | Accepted | 2026-05-19 |
| [0019](./0019-state-dual-ssot-collapse-pattern.md) | STATE dual-SoT 5-recurrence terminus COLLAPSE pattern (backfill Phase 3.3 D-04 institutional pattern lock) | Accepted | 2026-05-19 |
| [0020](./0020-hybrid-2clock-disambiguation.md) | HYBRID 2-clock disambiguation pattern (backfill Phase 4.2 D-04 institutional pattern lock) | Accepted | 2026-05-19 |
| [0021](./0021-state-lock-and-audit-consumer.md) | Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer | Accepted | 2026-05-19 |

## 参考

- ADR 起源：[Michael Nygard, "Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- 仿 Kubernetes API Conventions: [kubernetes/community](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
