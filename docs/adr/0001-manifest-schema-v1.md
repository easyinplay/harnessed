# ADR-0001: Manifest Schema v1

## Status

**Accepted** — 2026-05-11

## Context

harnessed 的核心 IP 在 `manifests/` + `workflows/` + `routing/` 三个 markdown/yaml 目录（PROJECT-SPEC § 3 设计哲学）。manifest 是其中"上游描述"层 —— 不 vendor 上游代码，仅声明"在哪、怎么装、怎么用"。

### 立项约束

- **PROJECT-SPEC § 8.1（工程纪律）**：第一行 installer 代码前 manifest schema v1 必须冻结。schema 改 = 全量 manifest migration，成本极高。
- **PROJECT-SPEC § 2（上游清单）**：MVP 9 个上游分布在 4 种 manifest type、5 种异构 install method、4 种 component_type。
- **ROADMAP v0.1.0 Phase 1.1**：本 ADR 是 phase 1.1 的入口产出。

### 立项调研依据

- **R03 § 6.5**：完整 schema 草案（基于 Anthropic 官方 docs + 社区实测）
- **R04 P0#1-2**：建议加 `apiVersion` / `upstream_health` / `signed_by`（仿 Kubernetes CRD 模式）
- **R02 § 红旗 P0#1**：实证 9 个上游需要 5 种异构 install method
- **R02 § 6**：karpathy-skills 是 CLAUDE.md 行为规范，与命令式 skill 安装/卸载语义不同
- **R02 § 红旗 GSD 漂移**：GSD 4 个月发了 41 个 minor release，命令名漂移风险 → 需 `tested_with_versions` 字段
- **SUMMARY § 二 冲突 2 决议**：4 type + install.method 子枚举（schema 简洁性优先）
- **SUMMARY § 二 冲突 6 决议**：R03 schema 草案为基础，按 R04 P0 加 3 字段

### 用户已敲定决策（2026-05-11）

1. manifest type 计数 = **4 type + install.method 子枚举**（不升 5 type）
2. gstack 命令前缀 v0.1 = **双路径验证**（plugin 化预留 + git-clone-with-setup 实证）
3. 6 项 spec 修订 = **立即批量 patch**（已落入 PROJECT-SPEC v2.1）

## Decision

冻结 manifest schema v1 如下定义。所有 v0.1+ manifest 文件必须严格符合本 schema，CI 用 JSON Schema 校验严格 enforce（`-strict` 模式，未知字段拒绝）。

### Top-level 结构

```yaml
apiVersion: harnessed/v1               # 必填，仿 K8s CRD（v2 时改 harnessed/v2）
kind: Manifest                         # 必填，固定值

metadata:
  name: <string>                       # 必填，唯一标识，kebab-case，全局唯一
  display_name: <string>               # 可选，UI 展示名（如 "Tavily MCP"）
  description: <string>                # 必填，1 行简述（≤ 120 char）
  upstream:                            # 必填
    source: <string>                   # 必填，上游官方名
    homepage: <url>                    # 必填
    repository: <url>                  # 必填，git URL（用于 audit 检测篡改）
    license: <SPDX>                    # 必填，SPDX 标识符（MIT / Apache-2.0 / ISC / 0BSD / BSD-3-Clause）
    notice: <string>                   # 必填，1 行致谢（写入用户项目 NOTICES.md）

spec:
  type: <enum>                         # 必填: cc-plugin / cc-skill-pack / mcp-npm / cli-npm
  component_type: <enum>               # 必填: command / behavior-rule / mcp-tool / cli-binary
  
  install:                             # 必填
    method: <enum>                     # 必填，见下方 type × method 兼容矩阵
    cmd: <string>                      # 必填，install 命令（支持 ${variable} 插值）
    cwd: <string>                      # 可选，工作目录
    env: <map>                         # 可选，环境变量
    args: <map>                        # 可选，extra 参数
    git_ref: <string>                  # method ∈ {cc-plugin-marketplace, git-clone-with-setup} 必填，commit hash 或 tag
    npm_version: <string>              # method ∈ {npm-cli, mcp-stdio-add, mcp-http-add, npx-skill-installer} 必填，^minor 范围
    idempotent_check: <string>         # 必填，dry-run 检测命令（如 `claude plugin list | grep <name>`）
  
  verify:                              # 必填
    cmd: <string>                      # 必填，health check 命令
    timeout_ms: <integer>              # 可选，默认 5000
    expected_exit_code: <integer>      # 可选，默认 0
  
  uninstall:                           # 必填
    cmd: <string>                      # 必填，1-key 卸载命令
    cleanup_paths: <list of string>    # 可选，需额外清理的文件路径（如 hook scripts）
  
  upstream_health:                     # 必填（R04 P0）
    stability: <enum>                  # 必填: stable / beta / unstable / archived
    last_check: <ISO date>             # 必填，weekly CI 自动写入
    last_known_good_version: <string>  # 必填，weekly CI 自动维护
    fallback_action: <enum>            # 必填: warn / block / use_alternative
    alternative: <manifest_name>       # fallback_action == use_alternative 时必填
  
  signed_by: <github_username>          # 必填，maintainer GitHub username（v0.1-0.3 用 commit hash 校验）
  signature:                            # 可选（v0.4+ 启用 sigstore 时必填，本 schema v1 暂留接口）
    sigstore_bundle: <url>
  
  platforms:                            # 必填，list of: linux / darwin / win32
    - linux
    - darwin
    - win32                             # win32 时 npx 自动注入 cmd /c wrapper
  
  tested_with_versions:                 # 可选，但 weekly CI 会回填
    cc_versions: <list of string>       # 测试通过的 Claude Code 版本（如 ["2.1.118", "2.1.122"]）
    node_versions: <list of string>     # 测试通过的 Node 版本（如 ["20", "22"]）
  
  mutually_exclusive_with:              # 可选，list of manifest names（v0.2+ 启用）
    - <manifest_name>
  
  # workflow 反向索引（运行时自动构建，不在 manifest 写）
  # required_by: <list of workflow names> — runtime 反向索引，doctor/uninstall 用
```

### type × install.method 兼容矩阵

CI 严格校验。任何不在矩阵中的组合 reject。

| type | 允许的 install.method |
|------|---------------------|
| `cc-plugin` | `cc-plugin-marketplace` |
| `cc-skill-pack` | `cc-plugin-marketplace` / `git-clone-with-setup` / `npx-skill-installer` |
| `mcp-npm` | `mcp-stdio-add` / `mcp-http-add` |
| `cli-npm` | `npm-cli`（含 `npx` fallback） |

### component_type 语义

| component_type | 描述 | 例子（v0.1 上游） |
|---------------|------|-----------------|
| `command` | 注册 `/foo:bar` 命令 | mattpocock-skills, GSD |
| `behavior-rule` | CLAUDE.md 注入行为规范，无命令 | karpathy-skills |
| `mcp-tool` | MCP server 提供的 tool | Tavily MCP, Exa MCP |
| `cli-binary` | 独立 CLI 可执行 | ctx7 |

特殊语义：

- `behavior-rule` 安装 = CLAUDE.md merge（多源时按 manifest `priority` 字段排序，未来引入）
- `behavior-rule` 卸载 = 移除 CLAUDE.md 中对应 block（用 marker 注释定位）
- `mcp-tool` 安装/卸载强制走 `claude mcp add/remove` CLI，禁止直接编辑 `~/.claude.json` 或 `.mcp.json`

### 必填字段总览

apiVersion / kind / metadata.name / metadata.description / metadata.upstream.{source,homepage,repository,license,notice} / spec.type / spec.component_type / spec.install.{method,cmd,idempotent_check} / spec.install.{git_ref|npm_version}（按 method 决定）/ spec.verify.cmd / spec.uninstall.cmd / spec.upstream_health.{stability,last_check,last_known_good_version,fallback_action} / spec.signed_by / spec.platforms

### 字段拒绝清单（schema v1 不允许）

- `${shell command}` 动态求值（如 `cmd: "echo $(curl ...)"`） — 安全约束
- `eval` / `!ruby/regexp` / 其他可执行 yaml 标签 — 安全约束
- 任何 `extends` / `inherits` 字段 — 简洁性优先（v0.5+ 重新评估 templating）
- 自定义字段（schema 校验 strict 模式，未知字段 reject）

## Consequences

### 正面

1. **schema 冻结使后续 manifest 文件可批量编写、不返工** — 9 个 v0.1 上游约 1 天写完
2. **apiVersion 字段保证 v2 时无歧义升级** — 仿 K8s CRD 已工业验证模式
3. **upstream_health 必填使上游 deprecate 不再静默失败** — 直接缓解新增风险 #2（SPEC § 7）
4. **DAG resolver 输入清晰** — `required_by` 反向索引在 setup 时构建，doctor/uninstall 时使用
5. **JSON Schema 校验可在 CI 严格 enforce** — 学 Kubeconform `-strict`
6. **type × method 矩阵防止配置错误** — 编译期发现而非运行时
7. **mutually_exclusive_with 占位字段** — 为 v0.2 dogfooding 观察 planning-with-files vs superpowers/writing-plans 互斥语义留接口

### 负面

1. **字段较多** — 每份 manifest ~30-50 行 YAML，门槛比"3 行配置"工具高（mitigation: 提供 `harnessed manifest scaffold <type>` 脚手架命令）
2. **9 个上游全部需要按此 schema 写** — v0.1 工作量约 1 工作日（acceptable）
3. **后续若发现 schema 缺失字段，必须出 ADR 0002 + 全量 migration** — 这正是工程纪律的目的（强制 thinking ahead）
4. **JSON Schema strict 模式可能误伤** — 用户自定义元数据无法直接放 manifest（mitigation: 提供 `metadata.annotations` 自由 map 字段，v0.2 加）

### 中性

1. **v0.4+ 签名升级到 sigstore 时新增 `signature.*` 字段** — 可向后兼容（apiVersion 仍 v1，仅 signature 块 from optional → required）
2. **`tested_with_versions` 由 CI 自动维护** — manifest 作者初始可不填，weekly CI 回填
3. **跨 harness（v0.5+）抽象层** — type 字段未来扩展为 `cc-plugin / codex-plugin / cursor-plugin / ...`（仍 apiVersion v1）

## Compliance / Migration

### v0.1 起的强制约束

- 所有 manifest 文件必须含 `apiVersion: harnessed/v1`
- 缺必填字段的 manifest 在 setup/doctor 阶段被拒（exit 非 0，print schema 错误位置）
- 任何字段 add / remove / rename / type 变更 → ADR 0002+ + 全量 migration

### 未来 v2 升级路径

- 出 `harnessed manifest migrate` 命令自动迁移 v1 → v2（参考 `kubectl convert`）
- v1 manifest 在 v2 引擎中保留至少 2 个 minor 版本兼容期
- breaking change 必须有 `deprecation_warning` 至少 1 个 minor 版本

### 未知字段的处理

- v0.1：strict 模式直接 reject
- 未来若需要扩展，先加 `metadata.annotations: <map>` 自由字段（v0.2 评估）

## References

### 内部依据

- `PROJECT-SPEC.md` v2.1 § 1（已锁定决策）/ § 2（上游清单 + 5 种 install method）/ § 8.1（schema 冻结纪律）
- `WORKFLOWS-MVP.md` v2.1（4 种 manifest type 用法）
- `.planning/research/SUMMARY.md` § 二 冲突 2 + § 二 冲突 6（决议来源）
- `.planning/research/02-upstream-reality.md` § 1-9（9 个上游实证）
- `.planning/research/03-integration-mechanisms.md` § 6.5（schema 草案）
- `.planning/research/04-failure-modes.md` § P0#1-2（apiVersion / upstream_health / signed_by 论证）
- `.planning/ROADMAP.md` v0.1.0 Phase 1.1（本 ADR 在 roadmap 中的位置）

### 外部参考

- [Kubernetes API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
- [Cargo `Cargo.toml` schema](https://doc.rust-lang.org/cargo/reference/manifest.html)（最佳模仿对象之一，R04 § 失败模式 1）
- [Kubeconform](https://github.com/yannh/kubeconform)（JSON Schema strict 校验工具参考）
- [SPDX License List](https://spdx.org/licenses/)（license 字段标识符来源）
