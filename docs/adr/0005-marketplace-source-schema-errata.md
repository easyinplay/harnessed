# ADR-0005: marketplace_source Schema Errata (cc-plugin-marketplace 字段补完)

## Status

**Accepted** — 2026-05-12

## Context

### Phase 1.1 manifest fix needed (GA-1 调研结论)

phase 1.2 discuss-phase 调研（`.planning/phase-1.2/research/01-claude-plugin-marketplace.md` ≈ GA-1）发现：

- `manifests/skill-packs/planning-with-files.yaml` 上游 `OthmanAdi/planning-with-files` **不在** `claude-plugins-official` 默认 marketplace；安装走 Claude Code REPL 的 **2-step**：
  1. `/plugin marketplace add OthmanAdi/planning-with-files`
  2. `/plugin install planning-with-files@planning-with-files`
- 当前 phase 1.1 ADR 0001 schema `cc-plugin-marketplace` 仅 enforce `cmd / git_ref / idempotent_check` 三字段；**没有结构化字段** 表达 "this manifest's marketplace is `OthmanAdi/planning-with-files` (third-party)" — 这层信息只能藏在 `cmd` 字符串里靠后期解析复原，违反 ADR 0001 § "schema = SSOT" 原则。
- phase 2.1 cc-plugin-marketplace installer 实装时（headless 调用 Claude Code 而非 REPL）需要从 manifest **结构化** 读出 source + repo，否则需 retrofit schema。

### A7 守恒约束

phase 1.1 acceptance bar A7 + phase 1.2 acceptance bar B7' 要求 **ADR 0001-0004 main body 不可改**（仅允许 ADR-NNNN errata）。本 ADR 是 **errata** 形式 — ADR 0001 main body 不动；schema 通过新增 **optional 字段** 扩展（backward-compat）。

### 沿袭风格

本 ADR 沿袭 ADR 0003（install method count errata 5→6）的"errata 不动 main body"风格 — 文档对齐 + schema 字段补完都走独立 ADR。

## Decision

### 1. cc-plugin-marketplace schema 加 optional 字段

在 `src/manifest/schema/installMethods/ccPluginMarketplace.ts` 现有 schema 基础上加一个 optional `marketplace_source` 字段（**仅** cc-plugin-marketplace install method），结构如下：

```typescript
marketplace_source: Type.Optional(Type.Object({
  source: Type.Literal('github'),  // v0.1 仅 github；v0.2+ 加 gitlab / direct-url
  repo: Type.String({
    pattern: '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$',
    minLength: 3,
  }),
}, { additionalProperties: false })),
```

字段语义：

- `source`：marketplace 提供方。v0.1 仅 `github`（const literal —— invalid 值如 `gitlab` 直接 reject）。
- `repo`：`<owner>/<repo>` 形式（pattern enforce），用于 phase 2.1 installer 拼出 `claude-code plugin marketplace add <owner>/<repo>` 调用。

### 2. 字段是 optional —— official 上游可省略

`claude-plugins-official` 的官方 marketplace 上游（如未来加入的 `superpowers` 或 `ralph-loop` 如官方化时）**可省略** `marketplace_source` 字段；installer 默认走 official marketplace。仅 third-party（`OthmanAdi/planning-with-files` 类）需声明该字段。

### 3. ADR 0001 main body 不动（A7 守恒）

`docs/adr/0001-manifest-schema-v1.md` 的 cc-plugin-marketplace 字段表 **不修改**；读者通过本 ADR 0005 知道："phase 1.2+ schema 实际多一个 optional `marketplace_source` 字段，仅 cc-plugin-marketplace method 接受。"

未来其他 install method 如有同类 third-party metadata 需求，同样走独立 ADR errata（不 inline 修订 ADR 0001）。

### 4. phase 1.2 不实装 cc-plugin-marketplace installer 代码

ADR 0005 仅在 schema 层补字段；phase 1.2 acceptance B4' 仅覆盖 `npm-cli` + `mcp-stdio-add` 两个 method 的 contract test。`cc-plugin-marketplace` installer 真实装代码推 **phase 2.1**（与 `git-clone-with-setup` / `npx-skill-installer` 同 batch）。本 ADR 0005 是 phase 2.1 的 schema 前置。

## Consequences

### 正面

1. **结构化 SSOT 恢复** — manifest 不再藏 third-party marketplace 元信息于字符串；validate 时 schema 直接 enforce `repo` pattern。
2. **A7 守恒维持** — ADR 0001 main body 0 修改。
3. **phase 2.1 不需 retrofit** — installer 实装时直接 `manifest.spec.install.marketplace_source.repo` 拿数据，无需后期 schema 大改。
4. **测试自动覆盖** — 新增 `tests/unit/manifest-validate.marketplace-source.test.ts` 5 test（present/absent/source-invalid/repo-pattern-invalid/wrong-method-with-field）+ fixture `tests/fixtures/manifests/valid/planning-with-files.yaml` 同步加字段后自动走 fixture-driven positive test。

### 负面

1. **认知负担** — schema 字段表分散到 ADR 0001 + 0005，需 ADR README index 显式 link。
2. **mitigation**：`docs/adr/README.md` index 加 0005 行，并在 0001 索引行后加注 "(see ADR 0005 for cc-plugin-marketplace optional `marketplace_source` field)"。

### 中性

1. v0.1 `source` 仅 `github` —— v0.2+ 拓展 `gitlab` / `direct-url` 时再开 ADR 0006+。
2. `repo` pattern 与 phase 1.1.1 H4 manifest 修复中的 `signed_by` pattern 风格一致（最小限制 `[a-zA-Z0-9_.-]+`）；不放过 path traversal `..` 但允许 `.` 用于域名风格 owner（如 `obsidian.md/foo`）。

## Compliance / Migration

### v0.1 强制约束

- `marketplace_source` 仅 `cc-plugin-marketplace` install method 接受（其他 method schema 仍 `additionalProperties: false`，添加该字段直接 reject）。
- 现有 `claude-plugins-official` 上游 manifest 无需改动（字段 optional）。
- 第三方 marketplace 上游（当前唯一 `planning-with-files`）必须在 phase 1.2 T1.4 同步加该字段 + 同步 fixture。

### 守恒强化（H5 sister review hardening）

phase 1.2 T1.2 完成时，CI A7 守恒 step 升级 — 从 hardcoded 检查 ADR 0001/0002 升级为 iterate 全部 5 个 baseline tag（`adr-{0001,0002,0003,0004,0005}-accepted`）— 任一非空 diff 即 fail。同时追溯打 `adr-0003-accepted` (`ffc1ff1`) + `adr-0004-accepted` (`18081d4`) 让历史 ADR 也进入守恒。

### A7 验收命令更新

```bash
for n in 0001 0002 0003 0004 0005; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0005 main body unchanged"
```

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § "type × install.method 兼容矩阵"（cc-plugin-marketplace 字段表 unchanged）
- `docs/adr/0003-install-method-count-errata.md`（errata 不动 main body 风格沿袭）
- `.planning/phase-1.2/research/01-claude-plugin-marketplace.md`（GA-1，调研发现 third-party marketplace 2-step add+install 必要性）
- `.planning/phase-1.1/progress.md` § B F20（cc-plugin-marketplace REPL slash command vs headless installer 矛盾首次记录）
- `.planning/phase-1.2/PLAN.md` § "Wave 0 必修 manifest"（ADR 0005 在 phase 1.2 内定位）
- `manifests/skill-packs/planning-with-files.yaml` + `tests/fixtures/manifests/valid/planning-with-files.yaml`（T1.4 同步修订对象）

### 外部参考

- Claude Code Plugin Marketplace docs（`/plugin marketplace add <owner>/<repo>` 子命令官方文档 — 2025-11 publish）
