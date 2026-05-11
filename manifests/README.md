# manifests/ — 上游依赖描述层

harnessed 不 vendor 上游代码。`manifests/` 是**纯描述层** — 每个 yaml 声明：在哪能找到上游、怎么装、怎么验证健康、卸载怎么清理。

## 结构

- `tools/` — 纯工具类上游（github-mcp / tavily-mcp / playwright 等）
- `skill-packs/` — 流程包 / skill 集合（superpowers / GSD / mattpocock-skills 等）

## Schema

每个 manifest 必须符合 `manifests/SCHEMA.md` 描述的 v1 schema（运行时由 `schemas/manifest.v1.schema.json` 严格 strict 模式校验）。

详细字段定义、`type × install.method` 兼容矩阵、`component_type` 语义请见：

- `docs/adr/0001-manifest-schema-v1.md` — 不可 inline 修改主体（仅允许通过 ADR-NNNN errata 修订）
- `manifests/SCHEMA.md` — 实现视图（人类可读，含 9 个上游路径占位）

## 关联

- 上游清单：`PROJECT-SPEC.md` v2.1 § 2
- 编译产物：`schemas/manifest.v1.schema.json`（npm publish 给社区供 IDE 校验）
- vendor 例外门槛：`vendor/ENTRY-CRITERIA.md`
