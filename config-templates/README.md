# config-templates/ — 配置注入层

`config-templates/` 包含 harnessed setup 时**注入用户项目**的配置模板。

## 结构

- `statusline.json` — Claude Code statusline 配置模板（v0.4+）
- `hooks/` — UserPromptSubmit hook 配置（B+C 混合 C 层 SSOT）
- `claude-md-block.md` — 注入 CLAUDE.md 的 harnessed 路由块模板

## 安全约束（PROJECT-SPEC.md § 8.3）

- **routing/*.md（hook 配置）必须纯 yaml/markdown** — 数据驱动，无可执行逻辑
- **harnessed 自带 hook 脚本严格受控** — 用 Node.js 内置 `fs` / `child_process`，禁动态 shell escape
- **install 时 print 全部脚本代码 + 配置 diff**（100% 透明）
- **1-key uninstall** 完全清理 settings.json hook entry + 所有 script files

## 关联

- setup 流程：`src/cli/setup.ts`（v0.1 phase 1.3）
- 用户备份：`<user-project>/.harnessed-backup/`
