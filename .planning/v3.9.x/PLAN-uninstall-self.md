# PLAN: `harnessed uninstall-self` — 统一卸载命令

> Phase: v3.9.x 维护系列 | 日期: 2026-05-27 | 状态: ready-to-execute

## 目标

新增 `harnessed uninstall-self` 命令，一键移除 harnessed 自身文件，不动上游组件。

## 范围

### 卸载内容（harnessed 自身文件）
1. `~/.claude/commands/<name>.md` — harnessed 生成的 slash command 文件（通过 `<!-- harnessed-generated:` marker 识别）
2. `~/.claude/skills/<name>/` — workflow skill 目录（setup Step A 安装的 24 个 workflow）
3. `~/.claude/settings.json` — 部分清理：仅移除 `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 和 `env.HARNESSED_USER_LANG`
4. `~/.claude/harnessed/` — 整个 state 目录

### 不卸载（上游组件）
- npm 全局包（npm-cli manifests 安装）
- MCP server 配置（mcp-stdio-add / mcp-http-add）
- CC 插件（cc-plugin-marketplace）
- Git clone 的仓库（git-clone-with-setup）
- npx 安装的 skills（npx-skill-installer）

## 设计

### CLI 接口
```
harnessed uninstall-self [--dry-run] [--yes]
```
- `--dry-run`: 预览模式，只显示会删除什么（exit 2）
- `--yes`: 跳过确认提示（CI/scripts）
- 默认 apply-immediate + 交互式 confirm（pattern: `src/cli/uninstall.ts`）

### 执行流程
1. **Discovery** — 发现所有 harnessed 拥有的路径（扫描 commands/ + skills/ + settings.json + harnessed/ dir）
2. **Summary** — 分组显示摘要（count + path）
3. **Confirmation** — `@clack/prompts` confirm（除非 --yes）
4. **Removal** — 按序删除：commands → skills → settings partial → harnessed state dir

### 关键复用
- `shouldOverwriteFile()` from `src/cli/lib/generateCommands.ts` — 识别 harnessed 生成的 command 文件
- `scanWorkflowsNested()` from `src/cli/lib/scan-nested.ts` — 获取 workflow 名称列表
- `getHarnessedRoot()` from `src/installers/lib/harnessedRoot.ts` — 获取 `~/.claude/harnessed/` 路径
- `uninstall.ts` pattern — Commander flag 解析 + @clack/prompts confirm + i18n + exit codes

## 文件变更

| 文件 | 动作 | 说明 |
|------|------|------|
| `src/cli/uninstall-self.ts` | NEW | 主实现（~180 行） |
| `src/cli.ts` | MODIFY | import + `registerUninstallSelf(program)` |
| `messages/en.json` | MODIFY | 14 个 i18n key |
| `tests/cli/uninstall-self.test.ts` | NEW | 12-14 个测试 cell |

## 验收标准
1. `harnessed uninstall-self --dry-run` 显示摘要，exit 2，不删除文件
2. `harnessed uninstall-self --yes` 跳过确认，执行删除，exit 0
3. 交互式运行：confirm 确认后删除，cancel 则 abort exit 2
4. 不删除上游组件（npm packages / MCP / plugins / cloned repos / npx skills）
5. 部分清理后仍可重新激活：`npm install -g harnessed && harnessed setup`
6. biome clean + tsc 0 errors + 全量 test suite 通过
