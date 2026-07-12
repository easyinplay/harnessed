# harnessed 私有文件引用审计 - 2026-05-25

## Scope
- 检查范围: `D:\GitCode\harnessed\` 全目录 (排除 node_modules, dist, .git, .planning/audit-*)
- npm publish 范围 (package.json `files` 字段): `dist/`, `manifests/`, `workflows/`, `routing/`, `config-templates/`, `schemas/`, `README.md`, `LICENSE`, `NOTICE`
- 检查模式:
  1. `~/.claude/CLAUDE.md` 或 `~\.claude\CLAUDE.md`
  2. `~/.claude/rules/` 或 `~\.claude\rules`
  3. `agent-teams.md`, `web-design.md`, `web-testing.md`, `web-search.md`, `context7.md`, `cc-handoff.md`, `google-workspace.md`
  4. `easyinplay` (非 GitHub 用户名上下文)
  5. `C:\Users\easyi` 或 `C:/Users/easyi`
  6. `~/Documents/Obsidian`
  7. `三层栈`, `两层栈`
  8. `gstack` (私有工具)
  9. `superpowers:` 前缀引用
  10. `mcp__chrome-devtools-mcp`, `mcp__obsidian-vault__`, `mcp__utools__`

---

## 🔴 P0 BLOCKER (npm publish 范围内的私有引用)

### 1. workflows/task/deliver/SKILL.md:82
- **引用内容**: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。文件路径引用用户本地插件缓存目录,下游用户无法复现此路径。
- **建议处置**: 替换为通用描述或相对路径,例如: `planning-with-files` plugin (v2.34.0+) 或删除具体路径,仅保留插件名称引用。

### 2. workflows/task/deliver/SKILL.md:103
- **引用内容**: `~/.claude/rules/agent-teams.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。SKILL.md 是发布物,引用私有 rules 会导致下游用户无法访问这些规则。
- **建议处置**: 替换为指向 harnessed 项目自己的文档,例如: `docs/` 或 `routing/` 目录下的规则文档,或使用能力注册表 (capabilities.yaml) 交叉引用。

### 3. workflows/task/deliver/SKILL.md:108
- **引用内容**: `~/.claude/CLAUDE.md "Execute 阶段"`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。引用用户全局 CLAUDE.md 会导致下游用户获得错误指导。
- **建议处置**: 迁移到 harnessed 项目自己的文档 (docs/WORKFLOW.md 或项目 CLAUDE.md),相对路径或内部 ID 引用。

### 4. workflows/task/deliver/SKILL.md:110
- **引用内容**: `~/.claude/rules/agent-teams.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。同 #2。
- **建议处置**: 替换为 harnessed 自己的规则文档引用。

### 5. workflows/capabilities.yaml (多处)
- **引用内容**: 
  - L108: `~/.claude/rules/web-design.md`
  - L110: `~/.claude/rules/web-design.md`
  - L113: `~/.claude/rules/web-testing.md`
  - L116: `~/.claude/rules/web-testing.md`
  - L119: `~/.claude/rules/web-testing.md`
  - L122: `~/.claude/rules/web-testing.md`
  - L125: `~/.claude/rules/web-testing.md`
  - L128: `~/.claude/rules/context7.md`
  - L131: `~/.claude/rules/web-search.md`
  - L134: `~/.claude/rules/web-search.md`
  - L145: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0`
  - L150: `~/.claude/rules/agent-teams.md`
  - L152: `~/.claude/rules/agent-teams.md`
  - L154: `~/.claude/rules/google-workspace.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。capabilities.yaml 是发布物核心,所有 description 字段中的私有规则引用会导致下游用户无法理解能力说明。
- **建议处置**: 
  - 对于规则引用 (web-design.md, web-testing.md 等): 替换为文档链接指向 harnessed 项目自己的指南 (可以新建 `docs/capabilities-guide.md` 或在 README.md 中补充)。
  - 对于插件路径: 删除具体版本号路径,仅保留插件名称。

### 6. workflows/disciplines/karpathy.yaml:1
- **引用内容**: `~/.claude/CLAUDE.md "andrej-karpathy-skills"`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。yaml 文件注释中的私有引用可能在自动化处理时被误用。
- **建议处置**: 改为指向 harnessed 项目 docs/ 中的 Karpathy 心法文档,或删除此引用,用 ADR/docs 代替。

### 7. workflows/disciplines/operational.yaml:1
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

### 8. workflows/disciplines/output-style.yaml:1
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

### 9. workflows/disciplines/priority.yaml:1
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

### 10. workflows/disciplines/protocols.yaml:1
- **引用内容**: `~/.claude/rules/cc-handoff.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 迁移到 harnessed 项目自己的文档。

### 11. workflows/disciplines/language.yaml:XX
- **引用内容**: `~/.claude/settings.json`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。YAML 中参考用户本地配置会导致下游用户配置验证失败。
- **建议处置**: 改为通用配置键名或文档指引,例如 `HARNESSED_USER_LANG` 环境变量或配置项名称,不涉及路径。

### 12. workflows/discuss/auto/SKILL.md (多处)
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

### 13. workflows/discuss/phase/SKILL.md
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

### 14. workflows/discuss/strategic/SKILL.md
- **引用内容**: `~/.claude/CLAUDE.md`
- **为何 BLOCKER**: npm publish 包含 workflows/ 目录。
- **建议处置**: 改为指向 harnessed 项目 docs/。

**合计 P0 引用点数**: ~20+ (capabilities.yaml 中 11 处+其他 9 处)

---

## 🟡 P1 PROJECT-INTERNAL (不影响 npm publish,清单留档)

以下文件在 package.json `files` 字段外,仅用于 harnessed 内部开发,不被 npm publish:

| 文件路径 | 引用内容 | 注释 |
|---------|---------|------|
| `CLAUDE.md:5` | `~/.claude/CLAUDE.md` | 项目 CLAUDE.md 本身,dev 用,不 publish |
| `CLAUDE.md:17,77` | `三层栈方法论` | 项目内部 workflow 参考,不 publish |
| `CLAUDE.md:23` | `mcp__claude-in-chrome__*` | 项目 CLAUDE.md 批注,不 publish |
| `.planning/**/*.md` (122 文件) | `~/.claude/CLAUDE.md` + `~/.claude/rules/*` | .planning/ 目录是项目审计/规划产物,不 publish (package.json files 字段无此项) |
| `docs/adr/0006-three-stack-mechanization-wedge.md` | `三层栈`, `两层栈` | 架构决策记录,不 publish (docs/ 不在 files 字段) |
| `docs/adr/**/*.md` (其他) | `~/.claude/CLAUDE.md` 等 | ADR 文档不 publish |
| `tests/**/*.ts` | `~/.claude/CLAUDE.md` 等 | 测试文件不 publish |
| `scripts/**/*.mjs` | `gstack` 等 | 脚本不 publish |

**清单**: P1 文件总计 ~130+ 处,均在 package.json `files` 字段外,不影响 npm publish 功能,但应在内部保留为开发参考。

---

## 🟢 P2 灰区 (需要用户决策)

### superpowers: 引用 (26 处)
**发现位置**: workflows/capabilities.yaml, workflows/judgments/*.yaml, workflows/discuss/subtask/SKILL.md, workflows/plan/auto/SKILL.md

**引用示例**:
- `superpowers:test-driven-development`
- `superpowers:brainstorming`
- `superpowers:subagent-driven-development`
- 等 (capabilities.yaml impl: superpowers 字段)

**问题**: 这些 `superpowers:` 引用在 capabilities.yaml 和 workflows 文件中,作为能力注册表的一部分被 npm publish (workflows/ 在 files 字段)。判断:
1. **如果 `superpowers:*` 是 harnessed 声明的"可用能力"清单**: ✅ 可接受,属于能力声明,不是私有路径引用。
2. **如果 `superpowers:*` 依赖用户私有 skills 注册**: ❌ 需要重构 — capabilities.yaml 应只列公开能力,私有能力放在用户 CLAUDE.md 或项目外 skill packs。

**建议**: 检查 `workflows/capabilities.yaml` 的 `impl: superpowers` 条目是否真实可用:
- 若是 harnessed 内置或可作为 npm package 的公开能力 → 保留,标记为 impl: bundled / impl: public
- 若依赖用户 ~/.claude/rules/* → 必须改为条件路由 (judgments/*.yaml 中 conditional gate)

---

## 统计

| 优先级 | 数量 | 说明 |
|--------|------|------|
| 🔴 P0 | ~20+ | npm publish 范围内的私有引用,会导致下游用户报错或功能退化 |
| 🟡 P1 | ~130+ | 项目内部文件 (.planning/, docs/, tests/, scripts/),不被 npm publish,可保留 |
| 🟢 P2 | 26 | superpowers: 能力引用,需要验证是否真实可用 vs. 私有依赖 |

**npm publish 受影响**: YES ✅ **需要立即修复**
- workflows/capabilities.yaml: 11+ 处私有规则和路径引用
- workflows/task/deliver/SKILL.md: 3 处私有引用
- workflows/disciplines/*.yaml: 5 处私有 CLAUDE.md 引用
- workflows/discuss/*/SKILL.md + workflow.yaml: 多处私有引用

**推荐处置顺序**:
1. **URGENT**: 修复 workflows/capabilities.yaml 的所有 `~/.claude/rules/*` 和插件路径引用 → 转为相对文档链接或删除
2. **HIGH**: 修复 workflows/task/deliver/SKILL.md, workflows/disciplines/*.yaml 的 CLAUDE.md 引用
3. **MEDIUM**: 评估 superpowers: 能力引用的可访问性,决定是否改为条件路由或删除

---

**审计完成** — 2026-05-25 由只读 subagent 自动生成
