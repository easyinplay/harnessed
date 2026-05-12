# ADR-0004: Installer Dry-Run + Diff Preview UX Contract

## Status

**Accepted** — 2026-05-12

## Context

Phase 1.2 即将实装 6 种 installer（cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / npm-cli / mcp-stdio-add / mcp-http-add — per ADR 0003）。这些 installer 会修改用户系统状态：

- `~/.claude/skills/` — 装 skill packs
- `~/.claude.json` / `<project>/.mcp.json` — 装 MCP servers
- `~/.claude/settings.json` — hook 注入（B+C 路由的 C 层）
- `<user-project>/.harnessed/` — 新增 workflow 状态目录
- npm global / npx 缓存 — CLI 装包

PROJECT-SPEC v2.1 已经在 § 8.3 + § 8.4 声明了若干安全约束（hook 配置数据化、setup 写用户文件 explicit confirm + dry-run + `.harnessed-backup/` rollback、MCP server 强制走 CLI）。

**但声明 ≠ 契约**。Phase 1.2 第一行 installer 代码前必须把 UX 契约固化为可校验规范，避免：

1. 6 个 installer 各自实现 dry-run 风格不一致（用户每次重学）
2. diff preview 格式不统一（review 困难）
3. rollback 边界 case 各自处理（部分覆盖 / 部分丢失）
4. explicit confirm 精确语义不明（哪些自动？哪些 prompt？哪些必须 explicit flag？）

### Cross-validation 来源

- **PROJECT-SPEC v2.1 § 8.3 + § 8.4** — 已声明的安全约束（本 ADR 把声明 → 契约）
- **Paranoid Staff Engineer review (2026-05-12)** — B1 shell-escape gate（已 ship phase 1.1.1）+ H7 SECURITY.md disclosure scope（已 ship）— dry-run 与这两者形成 defense in depth
- **Sister CC review (2026-05-12 第一轮 KICKOFF 建议)** — dry-run 契约值得 ADR 化（cross-validated 与 paranoid review）

## Decision

定义 6 条 installer UX **硬契约**。Phase 1.2 任何 installer 实装违反任一条 → CI fail。

### 1. Dry-Run 默认 + Explicit Apply

- `harnessed install <name>` **默认显示 dry-run**（列出将装的上游、改的文件、写入路径）
- 用户必须显式输入 `y` / `yes` 或加 `--apply` flag 才执行
- **不允许**默认 yes / `--yes-to-all` 隐式跳过 prompt
- 自动化场景必须用 **双 flag**：`--non-interactive --apply`（避免误用 `--apply` 一个 flag 在交互场景跳确认）
- `harnessed install --dry-run` 永远不写文件（即使加了 `--apply` 也优先 dry-run）

### 2. Diff Preview 格式统一

- 文件改动用 **unified diff** 输出（`+`/`-` 格式，类似 `git diff`）
- 新增文件标头：`+++ NEW: <path>`
- 删除文件标头：`--- REMOVE: <path>`
- 权限改动标头：`--- chmod: <path> <oldperm> → <newperm>`
- 终端默认带色（红删/绿增），通过 `process.stdout.isTTY` 检测
- CI / pipe 输出（`!isTTY`）自动 nocolor + 不带 ANSI
- 大文件 diff（> 200 行）默认折叠，`--full-diff` flag 展开
- diff 之前显示 summary：`will modify N files (M lines added, K removed)`

### 3. Rollback 备份位置 + 命名

- 所有 install 操作前**自动备份**到 `<user-project>/.harnessed-backup/<ISO-timestamp>/`
- 备份目录结构 **镜像被改文件位置**：
  - `~/.claude.json` → `<backup>/HOME/.claude.json`
  - `~/.claude/settings.json` → `<backup>/HOME/.claude/settings.json`
- 每个备份目录含 `metadata.json`：
  ```json
  {
    "installer": "cc-plugin-marketplace",
    "manifest": "ralph-loop",
    "timestamp": "2026-05-12T15:30:00Z",
    "files": [
      { "target": "~/.claude.json", "backup": "HOME/.claude.json", "sha1": "...", "mode": "644" }
    ]
  }
  ```
- `harnessed rollback <timestamp>` 一行恢复（按 metadata.json 反向操作）
- `harnessed backup list` 列出现有备份
- backup 不进 git（`.gitignore` 已含 `.harnessed-backup/`）

### 4. 操作分级 — 4 级 confirm 严格度

不同操作影响范围不同，prompt 严格度分级：

| Level | 范围 | Prompt 行为 |
|-------|------|-------------|
| **L1** | 仅写 `<user-project>/.harnessed/`（项目本地，git-track 可逆）| 默认 apply，仅 `print "will write: <files>"` 即可 |
| **L2** | 写 user `~/.claude/skills/`（per-user 可恢复，影响仅当前用户的 CC）| dry-run + prompt y/N + 备份 |
| **L3** | 改 `~/.claude.json` / `~/.claude/settings.json` / hooks（影响其他 CC plugins）| dry-run + diff + prompt y/N + 备份 + **post-confirm 二次验证**（"Are you sure? This affects other plugins"）|
| **L4** | 改 system / global npm / 装新 binary 到 PATH | dry-run + diff + prompt y/N + 备份 + **显式 `--system` flag 拒默认**（`harnessed install --system` 才允许）|

每个 install method 必须**声明自己的最高级别**：
- `cc-plugin-marketplace` → L3（改 ~/.claude.json）
- `git-clone-with-setup` → L2（写 ~/.claude/skills/）+ 可能 L4 if setup.sh 装 binary
- `npx-skill-installer` → L2
- `npm-cli` → L4 if global / L1 if npx ephemeral
- `mcp-stdio-add` → L3（改 .mcp.json）
- `mcp-http-add` → L3

### 5. MCP Server 修改强制走 CLI

- 所有 MCP server install / uninstall 必须用 `claude mcp add/remove --scope project` CLI 调用
- **禁止**直接编辑 `~/.claude.json` 或 `.mcp.json`
- 避开 CC v2.1.122 user scope bug（issue #54803）
- L3 级别但 prompt 简化（CLI 自身已封装一层确认）
- `--scope project` 写到项目 `.mcp.json`（不污染 user 全局）

### 6. 不允许 Silent Failures

- installer 任何步骤失败 → **STOP + 报错** + 不进下一步
- **partial install 状态**必须显式：
  - `harnessed status` 显示 "Partially installed: <upstream>, last good step: <N>"
  - prompt 用户：rollback / 强制继续 / 标 dirty 留待 manual fix
- **不允许 fallback "假装成功"**：
  - 上游不可达 → 报错（不静默 skip）
  - 上游版本不匹配 → 报错（不悄悄装其他版本）
  - 平台不支持 → 报错（manifest `platforms` 字段 enforced）
- 错误信息含**可执行修复命令**：
  - 例：`network failed → retry: 'harnessed install <name> --retry'`
  - 例：`manifest schema invalid → fix: 'harnessed lint manifests/<name>.yaml'`

## Consequences

### 正面

1. **Phase 1.2 6 installer 风格统一** — 用户学一次 install UX，应用到所有
2. **完整可见性 + 可逆性** — 用户对 harnessed 操作有 git-style 透明度
3. **Supply chain 攻击窗口缩小** — dry-run 让恶意 manifest 更难偷偷过 PR（攻击者必须接受用户在 prompt 阶段察觉）
4. **与 B1 + SECURITY.md 形成完整安全模型**：
   - B1（已 ship）：schema-level shell-escape detection
   - **本 ADR**：runtime-level dry-run + diff + confirm 防社工
   - SECURITY.md（已 ship）：用户 disclosure 通道
5. **MCP user-scope bug 永久规避** — 强制 project scope

### 负面

1. **Installer 实装代码量 +30-50%**（每个 installer 加 dry-run + diff + rollback + confirm 4 个 surface）
2. **首次用户多一道 prompt**（mitigation: `--non-interactive --apply` 双 flag 给自动化兜底）
3. **Backup 累积填磁盘**（mitigation: phase 1.2 加 `harnessed gc --older-than 30d` 清理命令）
4. **6 个 installer 必须 share 一个 dry-run/confirm 抽象**（增加 phase 1.2 的设计 surface — 但避免分散更糟）

### 中性

1. **v0.2 deterministic mode 候选**：lock-file driven `--auto-apply`（基于已批准 lock）— 重新评估 Level 划分
2. **v0.4 sigstore 签名启用后**：signed manifest 可考虑 L2 默认 apply（信任降级 — 但目前不开后门）
3. **本 ADR 不约束 installer 内部架构**（OOP / 函数式 / pipeline 任意）— 仅约束 user-facing UX

## Compliance / Migration

### v0.1 phase 1.2 起的强制约束

- 任一 installer 实装违反 6 条契约 → CI fail（phase 1.2 加 contract test：`tests/integration/installer-contract.test.ts`）
- 新增 install method（v0.5+）必须 declare 自己的 Level（L1-L4）
- diff preview 格式 / backup 路径 schema 改动 → 必须出 ADR-NNNN errata + 全 installer migration

### CI 守门（phase 1.2 实装时加）

```yaml
- name: Installer UX contract conformance
  run: |
    corepack pnpm test -- --filter installer-contract
    # 6 contract tests: dry-run-default / diff-format / backup-location / level-declaration / mcp-cli-only / no-silent-failure
```

### 用户文档（phase 1.2 ship 时同步）

- `harnessed install --help` 必须显示 dry-run-default 行为
- `docs/INSTALLER-CONTRACT.md`（phase 1.2 ship）— 用户视角的 6 条契约说明 + 错误信息库
- README FAQ 加一项："dry-run 怎么 disable？" → 答：用 `--non-interactive --apply` 双 flag

## References

### 内部依据

- `PROJECT-SPEC.md` v2.1 § 8.3 hook 配置数据化（已声明 → 本 ADR 契约化）
- `PROJECT-SPEC.md` v2.1 § 8.4 setup 写用户文件 explicit confirm（已声明 → 本 ADR 细化 4-level）
- `docs/adr/0001-manifest-schema-v1.md` § Decision 安全约束 schema 字段拒绝清单
- `docs/adr/0003-install-method-count-errata.md` 6 install method 计数 — 本 ADR 适用于全 6 种
- `SECURITY.md` (Phase 1.1.1 H7) — disclosure scope: "Installer arbitrary code execution beyond declared upstream cmd"
- `src/manifest/security.ts` (Phase 1.1.1 B1) — schema-level shell-escape gate（与本 ADR runtime gate 互补）
- `vendor/ENTRY-CRITERIA.md` — vendor 准入门槛（与 install dry-run 同信任模型）
- `.planning/phase-1.1/progress.md` § B F20 — ralph-loop /plugin install REPL slash-command 不可执行（phase 1.2 plan-phase 决策点 — 本 ADR L3 适用）

### 外部参考

- `git diff` unified diff format（本 ADR diff format 来源）
- npm `--dry-run` flag convention（本 ADR --apply 互补设计）
- Homebrew `--cask` interactive prompt model（本 ADR L3 二次验证灵感）
- Ansible `--check` mode（本 ADR dry-run 默认行为参考）
- pnpm `--frozen-lockfile`（本 ADR --non-interactive 兜底场景类比）
