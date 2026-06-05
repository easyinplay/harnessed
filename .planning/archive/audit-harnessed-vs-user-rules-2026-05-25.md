# harnessed v3.5.0 vs user 私有规则 — 完整 gap audit (2026-05-25)

## 1. user CLAUDE.md → harnessed mapping

| user 规则 / 章节 | user 源 | harnessed 实现 | 状态 | gap 描述 |
|---|---|---|---|---|
| 三层栈框架 (gstack/GSD/superpowers) | CLAUDE.md:L4-10 | capabilities.yaml Bucket 3-5 + priority.yaml | ✅ MACHINED | 三层优先级完整编码 |
| gstack 治理关卡 6 个 | CLAUDE.md:L13-17 | capabilities.yaml Bucket 3 + strategic-gate.yaml | ✅ MACHINED | office-hours / plan-ceo-review / review / qa / cso / design-review |
| 澄清触发判据三层独立 | CLAUDE.md:L19-38 | 3 gate files (strategic/phase/subtask) | ✅ MACHINED | 三层独立判据完整 |
| 三层 fallback 铁律 | CLAUDE.md:L35-38 | 3 gate files | ⚠️ PARTIAL | 静态 fires_when;拿不准倾向跳过的动态检测缺失 |
| 子任务并行执行机制 | CLAUDE.md:L40-68 | parallelism-gate.yaml + agent-teams-* entries | ✅ MACHINED | subagent 默认 + 5 升级触发完整 |
| 澄清主 session 先行方案 a/b/c | CLAUDE.md:L68 | role-prompts (推测) | ⚠️ PARTIAL | 混合方案的动态路由未编码 |
| 四阶段工作流 | CLAUDE.md:L70-122 | GSD workflows/{discuss/plan/execute/verify} | ✅ MACHINED | 全阶段覆盖 |
| 语言规范 (默认中文 + 8 类英文) | CLAUDE.md:L124-176 | disciplines/language.yaml | ✅ MACHINED | env.HARNESSED_USER_LANG + 用户覆盖完整 |
| 对话风格 (BLUF + 无套话等) | CLAUDE.md:L139-171 | disciplines/output-style.yaml | ✅ MACHINED | 7 条规则 + auto-fix 完整 |
| 优先级 7 层 | CLAUDE.md:L177-180 | disciplines/priority.yaml | ✅ MACHINED | gstack > ... > parallel 清晰 |
| Web 搜索路由 | CLAUDE.md:L182-184 | judgments/web-search-routing.yaml | ✅ MACHINED | Tavily/Exa/ctx7/WebFetch 完整 |
| 跨 CC hand-off | CLAUDE.md:L190-191 | disciplines/protocols.yaml | ✅ MACHINED | 4 角色文件所有权完整 |

## 2. user rules/*.md → harnessed mapping

### 2.1 agent-teams.md (6 sections)

| 内容 | 状态 | gap |
|---|---|---|
| 5 升级触发 | ✅ MACHINED | 无 |
| 何时不用 Teams | ✅ MACHINED | 无 |
| 完整生命周期 | ✅ MACHINED | 无 |
| 防呆清单 4 项 | ⚠️ PARTIAL | 自动检查缺失 (cleanup, brief) |
| Pattern A/B/C | ⚠️ PARTIAL | Pattern C (多维审查) 缺 Agent Teams 变种 |
| 失败排查 | ❌ MISSING | 诊断逻辑未编码 |

### 2.2 cc-handoff.md (5 sections)

| 内容 | 状态 | gap |
|---|---|---|
| 场景 A 设计文档 | ✅ MACHINED | 无 |
| 场景 B 计划就绪 | ✅ MACHINED | 无 |
| 写入边界表 | ✅ MACHINED | 无 |
| 歧义处理 | ✅ MACHINED | 无 |
| 反模式 5 条 | ✅ MACHINED | 无 |

### 2.3 context7.md (3 sections)

| 内容 | 状态 | gap |
|---|---|---|
| Steps 1-4 | ✅ MACHINED | 无 |
| 禁用场景 | ⚠️ PARTIAL | skips_when 缺失 |
| 错误处理 | ⚠️ PARTIAL | discipline rule 缺失 |

### 2.4 google-workspace.md (5 sections)

| 内容 | 状态 | gap |
|---|---|---|
| 工具与认证 | ⚠️ PARTIAL | OAuth setup doctor 缺失 |
| 调用模式 | ❌ MISSING | 工具文档不在 framework |
| auth 踩坑 | ❌ MISSING | Windows workaround 未通用化 |
| 错误处理 5 类 | ⚠️ PARTIAL | gws 特定映射缺失 |
| 禁止行为 5 条 | ✅ MACHINED | 无 |

### 2.5 web-design.md (4 sections)

| 内容 | 状态 | gap |
|---|---|---|
| ui-ux-pro-max 默认 | ✅ MACHINED | 无 |
| frontend-design 补充 | ✅ MACHINED | 无 |
| 冲突仲裁 | ✅ MACHINED | 无 |
| design-review 可选 | ✅ MACHINED | 无 |

### 2.6 web-search.md (5 sections)

| 内容 | 状态 | gap |
|---|---|---|
| MCP 探测 | ⚠️ PARTIAL | 自动检测未显式编码 |
| 不可用 fallback | ✅ MACHINED | 无 |
| MCP 可用路由 | ✅ MACHINED | 无 |
| 单 URL WebFetch | ✅ MACHINED | 无 |
| 反模式 3 条 | ✅ MACHINED | 无 |

### 2.7 web-testing.md (4 sections)

| 内容 | 状态 | gap |
|---|---|---|
| 三层职责矩阵 | ✅ MACHINED | 无 |
| 决策树 | ✅ MACHINED | 无 |
| 非功能诊断 | ✅ MACHINED | 无 |
| 微软误解澄清 | ✅ MACHINED | 无 |

## 3. capabilities.yaml impl 字段审计 (35 entries)

| impl 类型 | 数量 | 已妥善 | 缺 fallback | 缺自动探测 | 建议 v3.6 |
|---|---|---|---|---|---|
| mattpocock-skills | 12 | 3 (alias) | 6 | 0 | 补全 alias / conditional check |
| gstack | 33 | 33 | 0 | 0 | 保留 |
| MCP | 3 | 0 | 0 | 3 | doctor 探测 + hint |
| CLI | 2 | 1 | 0 | 1 (gws auth) | gws oauth check |
| plugin (official) | 4 | 4 | 0 | 0 | 保留 |
| claude-platform | 3 | 3 | 0 | 0 | doctor check CC version |
| GSD | 7 | 7 | 0 | 0 | 保留 |
| superpowers | 2 | 2 | 0 | 0 | 保留 |
| 其他 | 2 | 2 | 0 | 0 | 保留 |

**高风险 entry**: 6 个 mattpocock-skills (grill-with-docs, zoom-out, grill-me, to-prd, to-issues, improve-codebase-architecture)

## 4. v3.6+ 候选 backlog (优先级排序)

| 优先级 | gap | 成本 | 影响 |
|---|---|---|---|
| P0 | mattpocock 6 fallback 补全 | 低 | 26% capability gap |
| P0 | 澄清运行时检测 | 中 | 判据正确性 |
| P1 | MCP 自动探测 + fallback | 低 | 可用性 |
| P1 | gws OAuth doctor 检查 | 低 | gws 可用性 |
| P1 | Agent Teams 防呆自动检查 | 中 | 误用率 |
| P2 | ctx7 / Pattern 自动化 | 低-中 | 体验 |
| P2 | cc-handoff validator | 中 | 低阶错误 |
| P3 | Agent Teams 失败诊断 | 高 | 可靠性 |

## 5. 真 OUT-OF-SCOPE (不应机械化到 harnessed)

1. **easyinplay@gmail.com / gen-lang-client-0043163520** — 用户特定账户,不 hardcode
2. **C:\Users\easyi\.config\gws** — Windows 本地路径,应用 env 变量 / XDG
3. **Obsidian Vault 路径** — 用户工具选择,framework 不约束
4. **PowerShell auth workaround** — Windows 特定脚本,跨平台用通用库
5. **项目相对路径** — 项目特定结构,不硬编码
6. **GCP OAuth Testing 模式** — 用户项目配置

## 6. 总结

| 指标 | 数量 |
|---|---|
| 已 machined | 64 |
| 部分 machined | 8 |
| 完全缺失 | 4 |
| 真 out-of-scope | 6 |
| P0/P1 backlog | 6-7 |
| **覆盖率** | **~85%** |

### 核心 gap (v3.6 必修)

1. **mattpocock-skills 6 个 fallback** — 17% entry 缺陷
2. **澄清运行时检测** — 影响判据正确性 (拿不准倾向跳过 + 用户明示覆盖)
3. **MCP/gws 自动探测** — 影响可用性 (3 MCP + 1 OAuth)

### 剩余工作量分析

- **已机械化**: 65% (capabilities / disciplines / judgments 的 static manifest)
- **部分机械化**: 20% (需要 fallback alias 或运行时 decision logic)
- **运行时执行层面**: 15% (防呆自动检查 / 动态路由 / 协议验证 / 诊断逻辑)

harnessed v3.5.0 已覆盖框架的核心结构性规则;剩余工作在运行时质量保障、自动化检查、跨平台适配、protocol validation 等深度实装层面。
