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

## 参考

- ADR 起源：[Michael Nygard, "Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- 仿 Kubernetes API Conventions: [kubernetes/community](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
