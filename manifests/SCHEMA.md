# manifests/ — Manifest Schema v1 (Human-Readable Reference)

> **决策真理来源**：[`docs/adr/0001-manifest-schema-v1.md`](../docs/adr/0001-manifest-schema-v1.md)
> **机器消费 artifact**：[`schemas/manifest.v1.schema.json`](../schemas/manifest.v1.schema.json)（`pnpm build && pnpm build:schema` 产出）
> **本文件定位**：人类可读视图（schema 字段速查 + 9 上游路径占位 + IDE 集成示例），与 ADR 0001 互补 — ADR 决策；本文件帮你**写**和**读** manifest。

任何字段语义冲突以 ADR 0001 为准；任何机器校验差异以 `schemas/manifest.v1.schema.json` 为准。

---

## 1. 顶层结构（4 个必填字段）

```yaml
apiVersion: harnessed/v1   # 仿 K8s CRD，固定字面量
kind: Manifest             # 固定字面量
metadata: {...}            # 见 § 2
spec: {...}                # 见 § 3
```

`additionalProperties: false` 全树启用 — 任何未声明字段被 reject（拒绝清单见 ADR 0001 line 134-139）。

---

## 2. metadata 字段表

| 字段 | 必填 | 类型 | 约束 | 来源 |
|------|------|------|------|------|
| `name` | ✅ | string | `^[a-z0-9][a-z0-9-]*$`，全局唯一 | ADR 0001 line 44 |
| `display_name` | optional | string | UI 展示名 | ADR 0001 line 45 |
| `description` | ✅ | string | ≤ 120 char | ADR 0001 line 46 |
| `upstream.source` | ✅ | string | 上游官方名 | ADR 0001 line 48 |
| `upstream.homepage` | ✅ | uri | https URL | ADR 0001 line 49 |
| `upstream.repository` | ✅ | uri | git URL（用于 audit 检测篡改） | ADR 0001 line 50 |
| `upstream.license` | ✅ | SPDX enum | `MIT` / `Apache-2.0` / `BSD-3-Clause` / `ISC` / `0BSD` | ADR 0001 line 51 |
| `upstream.notice` | ✅ | string | 1 行致谢，≤ 500 char，写入用户 NOTICES.md | ADR 0001 line 52 |

非白名单 license（GPL / AGPL / SSPL / proprietary）一律 reject — vendor 准入门槛见 [`vendor/ENTRY-CRITERIA.md`](../vendor/ENTRY-CRITERIA.md)。

---

## 3. spec 字段表

| 字段 | 必填 | 类型 | 约束 |
|------|------|------|------|
| `type` | ✅ | enum | `cc-plugin` / `cc-skill-pack` / `mcp-npm` / `cli-npm` |
| `component_type` | ✅ | enum | `command` / `behavior-rule` / `mcp-tool` / `cli-binary` |
| `install` | ✅ | object | 见 § 4 install 矩阵 |
| `verify.cmd` | ✅ | string | health-check 命令 |
| `verify.timeout_ms` | optional | int | 100..60000 ms，默认 5000 |
| `verify.expected_exit_code` | optional | int | 默认 0 |
| `uninstall.cmd` | ✅ | string | 1-key 卸载命令 |
| `uninstall.cleanup_paths` | optional | string[] | 额外清理路径 |
| `upstream_health.stability` | ✅ | enum | `stable` / `beta` / `unstable` / `archived` |
| `upstream_health.last_check` | ✅ | ISO date | weekly CI 自动写入 |
| `upstream_health.last_known_good_version` | ✅ | string | weekly CI 自动维护 |
| `upstream_health.fallback_action` | ✅ | enum | `warn` / `block` / `use_alternative` |
| `upstream_health.alternative` | conditional | string | `fallback_action == use_alternative` 时必填 |
| `signed_by` | ✅ | string | maintainer GitHub username（v0.1-0.3 commit hash 校验，v0.4+ sigstore） |
| `signature.sigstore_bundle` | optional | uri | v0.4+ 启用 |
| `platforms` | ✅ | enum[] | 至少 1 个：`linux` / `darwin` / `win32`，去重 |
| `tested_with_versions.cc_versions` | optional | string[] | weekly CI 回填 |
| `tested_with_versions.node_versions` | optional | string[] | weekly CI 回填 |
| `mutually_exclusive_with` | optional | string[] | manifest names（v0.2+ 启用） |

---

## 4. type × install.method 兼容矩阵（4 type × 6 method）

CI 通过 ManifestSchema 顶层 `allOf` + `if/then` 严格 enforce；任何不在矩阵中的组合直接 reject。

| type \ method | `cc-plugin-marketplace` | `git-clone-with-setup` | `npx-skill-installer` | `npm-cli` | `mcp-stdio-add` | `mcp-http-add` |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **cc-plugin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **cc-skill-pack** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **mcp-npm** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **cli-npm** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**install.* method-条件必填字段**（discriminator union）：

| install.method | 额外必填字段 |
|---|---|
| `cc-plugin-marketplace` | `git_ref` |
| `git-clone-with-setup` | `git_ref` |
| `npx-skill-installer` | `npm_version` |
| `npm-cli` | `npm_version` |
| `mcp-stdio-add` | `npm_version` |
| `mcp-http-add` | `npm_version` |

**install.* 通用必填字段**：`method` / `cmd` / `idempotent_check`
**install.* 通用可选字段**：`cwd` / `env` / `args`

---

## 5. component_type 4 种语义

| component_type | 描述 | v0.1 上游样例 |
|---|---|---|
| `command` | 注册 `/foo:bar` 命令，可被 workflow `invokes` 引用 | mattpocock-skills, GSD, gstack, planning-with-files, ralph-loop, superpowers |
| `behavior-rule` | CLAUDE.md 注入行为规范，**无命令** | karpathy-skills |
| `mcp-tool` | MCP server 提供的 tool（`claude mcp add` 注册） | tavily-mcp, exa-mcp |
| `cli-binary` | 独立 CLI 可执行（`command -v` 验证） | ctx7 |

特殊语义（ADR 0001 line 124-128）：

- `behavior-rule` 安装 = CLAUDE.md merge（多源时按未来 `priority` 字段排序）
- `behavior-rule` 卸载 = 移除 CLAUDE.md 中对应 block（marker 注释定位）
- `mcp-tool` 安装/卸载强制走 `claude mcp add/remove` CLI，**禁止**直接编辑 `~/.claude.json` 或 `.mcp.json`

---

## 6. v0.1 上游 manifest 路径占位（9 上游 / 10 manifest）

phase 1.1 dry-run 验证字段充分性；实际 install/verify 命令在 phase 1.2 落地 installer 时精化。

| 上游 | 文件路径 | type | install.method | component_type |
|---|---|---|---|---|
| gstack | `manifests/skill-packs/gstack.yaml` | cc-skill-pack | git-clone-with-setup | command |
| GSD | `manifests/skill-packs/gsd.yaml` | cli-npm | npm-cli | command |
| superpowers | `manifests/tools/superpowers.yaml` | cc-plugin | cc-plugin-marketplace | command |
| planning-with-files | `manifests/skill-packs/planning-with-files.yaml` | cc-skill-pack | cc-plugin-marketplace | command |
| mattpocock-skills | `manifests/skill-packs/mattpocock-skills.yaml` | cc-skill-pack | npx-skill-installer | command |
| karpathy-skills | `manifests/skill-packs/karpathy-skills.yaml` | cc-skill-pack | npx-skill-installer | behavior-rule |
| ralph-loop | `manifests/tools/ralph-loop.yaml` | cc-plugin | cc-plugin-marketplace | command |
| tavily-mcp | `manifests/tools/tavily-mcp.yaml` | mcp-npm | mcp-stdio-add | mcp-tool |
| exa-mcp | `manifests/tools/exa-mcp.yaml` | mcp-npm | mcp-stdio-add | mcp-tool |
| ctx7 | `manifests/tools/ctx7.yaml` | cli-npm | npm-cli | cli-binary |

矩阵覆盖：4/4 type，6/6 method 中 5 个真实命中（`mcp-http-add` 在 v0.1 无上游，仅 schema 占位 — phase 1.2 会找一个 mcp-http server demo 来覆盖）。

---

## 7. IDE 集成（VS Code yaml-language-server）

在 manifest yaml 顶部加一行：

```yaml
# yaml-language-server: $schema=https://harnessed.dev/schemas/manifest.v1.schema.json
apiVersion: harnessed/v1
kind: Manifest
...
```

`redhat.vscode-yaml` 插件自动启用补全 + 实时校验。

本仓库内贡献者也可指向相对路径（手 ABT)：

```yaml
# yaml-language-server: $schema=../../schemas/manifest.v1.schema.json
```

---

## 8. 必填字段 checklist（review 自检）

提交新 manifest 前确认：

- [ ] `apiVersion: harnessed/v1` + `kind: Manifest`
- [ ] `metadata.name` kebab-case 唯一 + `metadata.description` ≤ 120 char
- [ ] `metadata.upstream` 全 5 字段（source / homepage / repository / license / notice）
- [ ] `spec.type` ∈ 4 enum + `spec.component_type` ∈ 4 enum
- [ ] `spec.install.{method, cmd, idempotent_check}` + 按 method 决定的 `git_ref` / `npm_version`
- [ ] `spec.verify.cmd` + `spec.uninstall.cmd`
- [ ] `spec.upstream_health` 4 字段（stability / last_check / last_known_good_version / fallback_action）
- [ ] `spec.signed_by` GitHub username + `spec.platforms` ≥ 1 个
- [ ] type × method 在 § 4 矩阵合法组合内
- [ ] 没有 `${shell}` `$(cmd)` `eval(...)` `!ruby/regexp` 等动态求值（ADR 0001 reject 清单）
- [ ] 没有 `extends` / `inherits` 等 templating 字段（schema v1 简洁性优先）

CI 强制校验：`pnpm test` + `pnpm validate:schema`。

---

## 9. 关联

- **决策**：`docs/adr/0001-manifest-schema-v1.md`
- **JSON Schema artifact**：`schemas/manifest.v1.schema.json` —— `pnpm build && pnpm build:schema` 产出
- **TypeBox 源定义**：`src/manifest/schema/`（`index.ts` / `metadata.ts` / `spec.ts` / `installMethods/*.ts`）
- **校验器入口**：`src/manifest/validate.ts` — `validateManifestFile(yamlSrc, file)` 返回 `{ok, manifest|errors}`
- **测试**：`tests/unit/manifest-validate.*.test.ts` + `tests/unit/schema-artifact.test.ts`
- **PROJECT-SPEC § 8.1**：schema 冻结纪律（任何字段 add / remove / rename / type 变更 → 新 ADR + 全量 migration）
