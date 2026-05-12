# Installer UX Contract — User Reference

> **Audience**：harnessed 用户（运行 `harnessed install / doctor / audit / rollback`）
> **Source**：[ADR 0004](./adr/0004-installer-dry-run-diff-preview-contract.md) — 6 条用户视角硬契约
> **Phase**：1.2 起强制；任一 installer 违反 → CI fail
> **Cross-ref**：`PROJECT-SPEC.md` v2.1 § 8.3 + § 8.4 起源；`SECURITY.md` 防御深度

---

## 1. Why this contract

为什么需要 dry-run + diff + rollback？harnessed 的 6 种 installer (`cc-plugin-marketplace` / `git-clone-with-setup` / `npx-skill-installer` / `npm-cli` / `mcp-stdio-add` / `mcp-http-add`) 会修改 `~/.claude.json`、`~/.claude/skills/`、`<project>/.mcp.json` 等用户系统状态——任一 silent failure 都可能导致 CC plugin 协同 break。

PROJECT-SPEC v2.1 § 8.3（hook 配置数据化）+ § 8.4（setup 写用户文件 explicit confirm + dry-run + rollback）已声明安全约束；ADR 0004 把声明 → 6 条**硬契约** + contract test 自动化。本文件是 contract 的**用户视角说明**——你 install / rollback 时实际会看到什么。

---

## 2. Six Contracts

### Contract 1 — Dry-Run Default + Explicit Apply

`harnessed install <name>` **默认 dry-run**：列出将装的上游、改的文件、写入路径，不实际写盘。你必须显式输入 `y` / `yes` 或加 `--apply` flag 才执行。

不允许默认 yes / 隐式 `--yes-to-all`。自动化场景必须用**双 flag**：

```bash
harnessed install ctx7 --non-interactive --apply
```

单独 `--apply`（无 `--non-interactive`）仍走 prompt——避免 CI 流水线误用单 flag 跳确认。`harnessed install --dry-run` 永远不写文件，即使加了 `--apply` 也优先 dry-run。

CLI 对 dry-run + cancel 退出码 = `2`（`exit-code: aborted` sentinel）；apply 成功 = `0`；任意 step 失败 = `1`。

### Contract 2 — Diff Preview Format

文件改动用 **unified diff**（`+`/`-`，类似 `git diff`），含 3 类标头：

- `+++ NEW: <path>` — 新增文件
- `--- REMOVE: <path>` — 删除文件
- `--- chmod: <path> <oldperm> → <newperm>` — 权限改动

终端默认带色（红删/绿增），通过 `process.stdout.isTTY` 检测；CI / pipe (`!isTTY`) 自动 nocolor + 不带 ANSI。`--no-color` 强制 nocolor 即使 TTY；`--full-diff` 展开 > 200 行的折叠。

diff 之前显示 summary：`will modify N files (M lines added, K removed)`。

### Contract 3 — Rollback Backup Location + Schema

所有 install 操作前**自动备份**到 `<user-project>/.harnessed-backup/<ISO-timestamp>/`。备份目录镜像被改文件位置（`~/.claude.json` → `<backup>/HOME/.claude.json`），含 `metadata.json` + 每文件 `eol: lf|crlf` 字段（per ADR 0004 § 3 + ASSUMPTIONS C3）：

```json
{
  "installer": "cc-plugin-marketplace",
  "manifest": "ralph-loop",
  "timestamp": "2026-05-12T15:30:00Z",
  "files": [
    { "target": "~/.claude.json", "backup": "HOME/.claude.json", "sha1": "...", "mode": "644", "eol": "crlf" }
  ]
}
```

恢复一行：`harnessed rollback 2026-05-12T15:30:00Z`——按 metadata.json 反向操作 + sha1 verify + EOL preserve（CRLF 文件不会被 LF 化）。`harnessed backup list` 列已有备份；`harnessed gc --older-than 30d` 清理历史（默认 30 天，最新 N 个 keepLast 保护）。备份不进 git（`.gitignore` 已含 `.harnessed-backup/`）。

ENOENT pure-create sentinel：若原文件不存在（install 是首次创建），backup 标记 `"backup": ""`；rollback 视为 unlink 而非 restore-empty——避免 phantom empty file。

### Contract 4 — 4-Level Confirm

不同 install 影响范围不同，prompt 严格度按 4 级分：

| Level | 范围 | Prompt 行为 | Phase 1.2 实装 method |
|-------|------|-------------|------------------------|
| **L1** | 仅写 `<project>/.harnessed/` | 默认 apply + `print "will write: ..."` | `npm-cli`（npx ephemeral）|
| **L2** | 写 user `~/.claude/skills/` | dry-run + prompt y/N + 备份 | (phase 2.1 — `git-clone-with-setup` / `npx-skill-installer`) |
| **L3** | 改 `~/.claude.json` / hooks / `.mcp.json` | dry-run + diff + prompt y/N + 备份 + 二次验证 | `mcp-stdio-add`（hardcoded `--scope project`）|
| **L4** | system / global npm / 装 binary 到 PATH | dry-run + diff + prompt y/N + 备份 + 显式 `--system` flag | `npm-cli`（global mode）+ (phase 2.1 `cc-plugin-marketplace`) |

每 install method 必须**声明自己最高 Level**（dispatcher `levelOf(method)` API）。Phase 1.2 起强制：用户传 `--system` 才允许 L4；否则 L4 install 自动降级 L1 + 显式告知（如 `npm-cli` global → npx ephemeral fallback per D1.2-4）。

### Contract 5 — MCP Server CLI-Only

所有 MCP server install / uninstall 必须用 `claude mcp add/remove --scope project` CLI 调用——**禁止**直接编辑 `~/.claude.json` 或 `.mcp.json`。规避 CC v2.1.122 user-scope bug ([issue #54803](https://github.com/anthropics/claude-code/issues/54803))：手编 user-scope MCP 配置不被 Claude Code 加载。

`mcp-stdio-add` installer 内**硬编码** `--scope project`（manifest 不能 override），写入 `<project>/.mcp.json`，不污染 user 全局。Phase 1.2 verify 走 `claude mcp list | grep -q <name>` exit code（不解析 stdout — per ASSUMPTIONS C2）。

### Contract 6 — No Silent Failures

任一步骤失败 → STOP + 报错 + 不进下一步。**Partial install 状态**显式：

- `harnessed status` 显示 `Partially installed: <upstream>, last good step: <N>`
- 错误信息含 `suggest:` 字段 + 可执行修复命令（如 `network failed → retry: harnessed install <name> --retry`）

不允许 fallback "假装成功"：上游不可达 → 报错（不静默 skip）；上游版本不匹配 → 报错（不悄悄装其他版本）；平台不支持 → 报错（manifest `platforms` 字段 enforced）。

CLI exit codes 严格按语义：`0` = ok（apply 成功）；`1` = error（任意 phase fail）；`2` = aborted（dry-run cancel / `--non-interactive` 缺 `--apply`）。

---

## 3. Level System (L1-L4) — 完整映射

| Level | Prompt | Backup | --system flag |
|-------|--------|--------|----------------|
| L1 | print only | optional | not required |
| L2 | y/N | required | not required |
| L3 | y/N + diff + 二次验证 | required | not required |
| L4 | y/N + diff + 二次验证 | required | **required**（否则自动降级 L1）|

**Phase 1.2 method 当前 Level**（`src/installers/index.ts` `levelOf` seed）：

| Method | Level | 备注 |
|--------|-------|------|
| `npm-cli` | L1 (npx) / L4 (global) | global 需 `--system` flag；否则降级 npx ephemeral |
| `mcp-stdio-add` | L3 | 写 `.mcp.json`（影响其他 CC plugins）|
| `cc-plugin-marketplace` | (phase 2.1 placeholder, expected L3) | 改 `~/.claude.json` |
| `git-clone-with-setup` | (phase 2.1 placeholder, expected L2/L4) | L2 默认；L4 if setup.sh 装 binary |
| `npx-skill-installer` | (phase 2.1 placeholder, expected L2) | 写 `~/.claude/skills/` |
| `mcp-http-add` | (phase 2.x placeholder, expected L3) | 同 mcp-stdio-add |

---

## 4. Error Reference

错误信息按 `InstallError.keyword` 分类（src/installers/lib/types.ts）。每错误含 `phase: 'preflight' | 'spawn' | 'verify' | 'backup'` + `suggest:` 修复建议：

| Phase | Keyword | 触发场景 | Exit | 修复建议样例 |
|-------|---------|----------|------|--------------|
| `preflight` | `platform` | manifest `platforms` 不含当前 OS | 1 | "skip this manifest on Windows; use WSL or run on Linux/Mac" |
| `preflight` | `git_ref` | manifest `repository.git_ref` 是 HEAD/main/master | 1 | "pin to commit SHA / tag (e.g. `v1.2.3`); see ADR 0001 § B2" |
| `preflight` | `idempotent_check` | upstream 已装（`which <bin>` exit 0）| 0 | "already installed; use `--force` to reinstall" |
| `preflight` | `security-gate-bypass` | cmd 含 `${...}` / `$(...)` / `eval` / `!ruby/regexp` | 1 | "remove shell expansion from manifest cmd; see SECURITY.md" |
| `spawn` | `install-failed` | 上游 install 命令 exit ≠ 0 | 1 | "check network / npm registry; retry with `--verbose`" |
| `verify` | `verify-failed` | post-install verify 命令 exit ≠ 0 | 1 | "upstream installed but not detectable; check PATH order" |
| `phase-deferred` | `phase-deferred` | 调用 phase 2.x placeholder method | 1 | "this method is implemented in phase 2.1; use `npm-cli` / `mcp-stdio-add` instead" |
| `dispatch-mismatch` | `dispatch-mismatch` | manifest `install.method` ≠ runner method | 1 | "fix `install.method` to match runner (e.g. `mcp-stdio-add`)" |
| `backup` | `backup-failed` | `.harnessed-backup/<ts>/` mkdir / write 失败 | 1 | "check disk space / permissions on `<project>/.harnessed-backup/`" |

---

## 5. FAQ

**Q1. dry-run 怎么 disable？**

用**双 flag**：`harnessed install <name> --non-interactive --apply`。单独 `--apply` 仍走 prompt（避免 CI 流水线误用 `--apply` 跳确认）；单独 `--non-interactive` 必须配合 `--apply` 或 `--dry-run` 使用，否则 CLI 立即 exit 2（H1 pre-action gate）。

**Q2. 我可以同时装两个 method 的同名 manifest 吗？**

否。preflight `idempotent_check` 通过运行 `which <bin>` / `claude mcp list | grep -q <name>` 守护——upstream 已装则 phase 1.2 默认 skip（exit 0 + `keyword: idempotent_check`）。phase 2.1+ 加 `--force` flag 允许重装（不影响 backup 自动创建，rollback 链条不断）。

**Q3. L4 全局装失败如何 fallback？**

`npm-cli` global L4 触发 H3 三选一 prompt：

- **retry**（重试 global，可能要求 sudo / Win admin）
- **downgrade**（自动降级 L1 npx ephemeral + 教学行：`use 'npx <pkg>' for one-shot exec`）
- **abort**（exit 2 + 不写盘）

每次 prompt isCancel guard，Ctrl+C 安全 exit 2 不留 partial state。其他 method 的 L4 fallback 在 phase 2.1+ 同款实装。

**Q4. rollback 后 EOL 会变吗？**

不会。`metadata.json` 每文件含 `eol: lf|crlf` 字段（ASSUMPTIONS C3 mitigation）；rollback 时 `normalizeEol(buf, eol)` Buffer 转换严守 CRLF/LF 来源。这意味着 Windows 上的 CRLF 文件 rollback 后仍是 CRLF，Linux 上的 LF 文件仍是 LF——zero EOL drift。

**Q5. MCP server 装到哪？**

`<project>/.mcp.json`（per ADR 0004 § 5 + Contract 5）——硬编码 `--scope project`，不污染 user 全局 `~/.claude.json`。规避 CC v2.1.122 user-scope bug (#54803)：手编 user-scope MCP 配置不被 Claude Code 加载。

不允许 manifest override `--scope user`——installer 实装直接忽略；`harnessed audit manifests/tools/*.yaml` 校验通过 `signed_by` placeholder + `git_ref` forbidden + `repository` pattern 三 check。

**Q6. backup 累积填磁盘怎么办？**

`harnessed gc --older-than 30d` 清理 30 天以上的备份；`--keep-last 5` 保留最新 5 个；`--dry-run`（默认）+ `--apply` 双 flag。size-aware report 输出每备份大小（KB），方便决策。

`backup-list` 子命令列已有备份 + 时间戳 + 大小 + per-snapshot try/catch fallback（metadata.json 缺失 graceful 降级）。

---

## See Also

- [ADR 0004](./adr/0004-installer-dry-run-diff-preview-contract.md) — 起源 ADR
- [ADR 0005](./adr/0005-marketplace-source-schema-errata.md) — `marketplace_source` schema errata
- `src/installers/index.ts` — 6-method dispatch table + `levelOf()` seed
- `tests/integration/installer-contract.test.ts` — 12 contract test cells (6 contract × 2 method)
- `.planning/phase-1.2/VERIFICATION.md` — 9 acceptance bar 复现指南
- [SECURITY.md](../SECURITY.md) — vulnerability disclosure（installer escape 范围）
