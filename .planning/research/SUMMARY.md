# harnessed 立项调研综合（gsd-research-synthesizer 输出）

## 元数据

- **综合日期**：2026-05-11
- **立项 spec 版本**：PROJECT-SPEC v2（14 项决策已锁定）+ WORKFLOWS-MVP v2（phases schema 已锁定）
- **researcher 置信度**：4/4 HIGH
  - R01 唯一 LOW 项（"mattpocock-skills / gstack 上游存在性"）已被 R02 用 GitHub URL + star 数实证 **澄清** → 已解决
- **关键新增高置信度证据**：
  - R02：9/9 上游全部公开开源、MIT、可定位（gstack 93.5k★、karpathy-skills 125k★、superpowers 186k★、mattpocock-skills 70.6k★、GSD 61.4k★、context7 55k★）
  - R03：UserPromptSubmit hook 官方文档 + skill description 触发率多源实测（Sonnet 50-55% / Haiku 0-20% → 加 hook 84-100%）
  - R04：Avelino 2019 论文 + 2025 后续研究的 OSS 维护者存活率数据（单 maintainer 年掉队率 36%）

## 一、调研结论汇总（一句话各组）

- **R01 竞品格局**（HIGH）：harnessed 直接威胁为 0；最像的 `ccpi`（jeremylongshore）走"自营集市"路线，与 harnessed"装配派 + composition skill"实质不同；ECC（170K★）+ Superpowers（150K★）占 mindshare 但社区有"过度工程"批评，**wedge 锁定为「不让你卸 ECC，让你按需装配」**。
- **R02 上游真实性**（HIGH）：9 个上游全部存在 + 公开 + MIT，但分布在**至少 5 种异构安装通道**（不是 spec § 2 写的 4 种），且 gstack 的命令前缀**用户可配置**、GSD 4 个月内出 41 个 minor release（命令名漂移风险）、ralph-loop 在 Windows 上对 jq + Git Bash 有未声明依赖。
- **R03 集成机制**（HIGH）：4 种 type 在 CC 生态均有官方支持路径，但成熟度差异大（plugin 最完整、MCP 有 user scope bug、skill 触发率不可控、CLI 最朴素）；UserPromptSubmit hook **真实可用**（exit 0 stdout 唯一被注入 context）；**spec § 8.3 "hook 禁 shell" 与 CC hook 体系结构性冲突**，措辞需修正；manifest schema v1 草案已交付。
- **R04 失败模式**（HIGH）：Top 10 失败模式中 **6 类对 harnessed 直接致命**——bridge 永久债（LangChain 案）、抽象成枷锁（Octomind 案）、单维护者倦怠（学术 36%/年）、拓扑解析缺失（brew bundle 案）、上游废弃静默失败、范围蔓延变 meta-PM；**Cargo + rustup 是最佳模仿对象**，Yeoman / CRA 是反面教材。

## 二、4 份调研之间的冲突 / 互补处理

### 冲突 1：R01 担忧 mattpocock-skills / gstack 上游存在性 (LOW) ↔ R02 实证全部存在 (HIGH)

- **R01 § 类别 E + § LOW confidence 来源**：mattpocock-skills 仓库地址未直接命中，gstack 公开存在性"疑为私人/小众"。
- **R02 § 1 + § 5**：[github.com/garrytan/gstack](https://github.com/garrytan/gstack) 93.5k★ MIT；[github.com/mattpocock/skills](https://github.com/mattpocock/skills) 70.6k★ MIT，17 个命令全部确认存在。
- **决议**：✅ **采纳 R02 结论**。R01 的 LOW flag 标为"已澄清"。但 R02 暴露的真问题：gstack **没有 plugin 化**（只有 `git clone + ./setup`），命令前缀**用户可配置**——见冲突 2。

### 冲突 2：R02 发现 5 种 install kind ↔ SPEC § 2 写的 4 种类型

- **R02 § 红旗 P0#1**：实证需要 5 种 install_method:
  1. `cc-plugin-marketplace`（superpowers, ralph-loop, planning-with-files-plugin, karpathy-skills-plugin）
  2. `git-clone-with-setup`（**gstack — 当前 spec 缺**）
  3. `npx-skill-installer`（mattpocock-skills, planning-with-files 替代路径）
  4. `npm-cli`（GSD via `get-shit-done-cc`, ctx7）
  5. `mcp-stdio-add` / `mcp-http-add`（Tavily, Exa, context7-mcp）
- **R03 § 6.4**：cli-npm 同时覆盖 `npm_global` + `npx` 两种 method（fallback），manifest schema v1 草案已经允许。
- **决议**：✅ **SPEC § 2 必须修订**。两条候选路线：(a) type 从 4 → 5（新增 `git-clone-with-setup`）；(b) 保持 4 type 但 cc-skill-pack 内部 `install.method` 枚举增加 `git_clone_with_setup` 子型。**推荐 (b)**（schema 简洁性优先）。同步：karpathy-skills 是 **CLAUDE.md 行为规范**而非命令式 skill（R02 § 6），manifest 必须区分 `component_type: command | behavior-rule | mcp-tool | cli-binary`。

### 冲突 3：R03 实测 hook 体系 ↔ SPEC § 8.3 "hook 禁 shell"

- **SPEC § 8.3**：硬约束"hook 纯 yaml/markdown，禁 shell"。
- **R03 § 5.4 + 红旗 4**：CC hook 仅支持 `command/http/prompt/mcp_tool/agent` 5 种 type，**最常用的 command type 必然 spawn 子进程**——"纯 yaml/md hook" 在 CC 体系内不存在。
- **决议**：✅ **SPEC § 8.3 措辞重写**：
  - **routing/\*.md（hook 配置）** 纯 yaml/md
  - **harnessed 自带的 hook 脚本**严格审计 + install 时 print 全文 + 不调任意 shell（用 Node.js 内置 fs/child_process 受控调用）
  - 用户 1-key uninstall 完全清理（settings.json hook entry + script files）

### 互补 4：R03 实测路由命中率 ↔ SPEC § 5.1 验收标准 ↔ § 11 跨 harness

- **R03 § 2.4 / § 5.5**：B 层（仅 description）：Sonnet 50-55%, Haiku 0-20%；B+C 混合：Sonnet 100%（22 样本）, Haiku 84%（200+ samples）。
- **SPEC § 5.1**：B+C 混合 + 30 样本 ≥ 85% 命中率验收。
- **SPEC § 11 / § 5.1 末段**：跨 harness 时砍 C 层"丢 30% 触发命中率换跨平台"。
- **决议**：✅ **直接证实 § 5.1 B+C 混合 + 85% 验收的合理性**。但 § 11 "丢 30%" 数字偏乐观——实际损失 **30-50% 命中率（model-dependent）**。SPEC § 5.1 末段 / § 11 修订为"**砍 C 层后命中率降至 50-55%（Sonnet）/ 0-20%（Haiku），损失 30-50%**"。

### 互补 5：R04 单 maintainer 年掉队率 36% ↔ SPEC § 7 风险登记

- **R04 § 失败模式 3**：Avelino 2019 + 2025 后续研究：单 maintainer 项目年掉队率 **36%**，6 个月窗口大概率招不到 co-maintainer。
- **决议**：✅ **SPEC § 7 升级 中/中 → 中/高**。新增 4 项缓解：降低 fork 成本（schema 数据格式 + ADR 公开）、CI 自动化（不依赖人工 vigilance）、dogfooding 内在动力、`signed_by` 字段。

### 互补 6：R04 manifest schema 建议 ↔ R03 schema v1 草案

- **R04 § 实施建议 P0**：manifest 必须加 `apiVersion: harnessed/v1`（仿 K8s CRD）、`upstream_health`、`signed_by`。
- **R03 § 6.5**：完整 schema 草案有 `schema_version: 1` + 完整字段，但**缺 apiVersion / upstream_health / signed_by**。
- **决议**：✅ **R03 schema 草案为基础**，按 R04 P0 加 3 字段。`schema_version: 1` 替换为 `apiVersion: harnessed/v1`（统一 K8s 模式）。

## 三、对 PROJECT-SPEC.md 的修订建议（按 § 章节）

### SPEC § 2（上游依赖清单）
- **现状**：表格"安装方式"列写 `claude plugin install` 用于 CC plugin 全部（含 gstack）。
- **修订**：
  - gstack 行：安装方式 → `git clone + ./setup`（R02 § 1）
  - GSD 行：→ `npx get-shit-done-cc@latest`（R02 § 2）
  - planning-with-files 行：增加备选 "或 `npx skills@latest add`"（R02 § 4）
  - mattpocock-skills 行：→ `npx skills@latest add mattpocock/skills`（R02 § 5）
  - karpathy-skills 行：注明 component_type 是 **behavior-rule**（CLAUDE.md 注入）（R02 § 6）
- **影响范围**：installer 引擎需支持 5 种子方法；manifest schema 加 `component_type` 字段。

### SPEC § 5.1（路由机制 B+C 混合）
- **修订**：
  - 末段"砍 C 层只留 B；丢 30%" → "**砍 C 层后命中率降至 50-55%（Sonnet）/ 0-20%（Haiku），损失 30-50%（model-dependent）**"
  - 30 样本验收 → "**30 样本应覆盖 model 差异（Haiku / Sonnet / Opus 各 ≥ 8 样本）+ token budget 监控（skill description 总和不超 1% context window）**"

### SPEC § 7（风险登记）
- **修订**：上游 breaking change 中/高 → **高/高**；单点维护 中/中 → **中/高**。新增 5 条（详见第六节）。

### SPEC § 8.3（hook 禁 shell）
- **修订**：直接采纳 R03 § 5.4 + 红旗 4 的重写措辞（见冲突 3 决议）。

### SPEC § 8.4（setup 写文件 explicit confirm）
- **新增**：所有 mcpServers 修改必须用 `claude mcp add/remove` CLI 而非直接编辑 `~/.claude.json`（R03 § 3.4 / issue #15797）。

### SPEC § 11（Ship 节奏）
- **修订**：cross-OS 测试**前移到 v0.1 就开始**（R03 红旗 6 + R04 P0），不要拖到 v0.4。

### SPEC § 4（仓库架构）
- **新增** `docs/adr/` 目录（R04 § P0#6）：每个非常规决策一份 ADR。
- **新增** `manifests/aliases.yaml`（R04 § P2#13）：上游改名重定向表（v0.3+ 启用）。

## 四、对 WORKFLOWS-MVP.md 的修订建议

### Workflow 3 plan-feature § 设计决策
- **修订**：gstack 命令前缀**用户可配置**（默认 `/office-hours`、`--no-prefix`、`--prefix gstack-` 三选一），workflow 模板**不能硬编码字面量**。`harnessed doctor` 探测当前用户的实际前缀写入 `.harnessed/config.json`，workflow 引擎读取（R02 § 1）。
- **影响**：workflows/plan-feature/SKILL.md `invokes` 字段需变量插值；doctor 探测脚本。

### Workflow 2 execute-task § 设计决策
- **新增**：
  - ralph-loop `--completion-promise` 不可靠（issue #1429），workflow 模板**强制 `--max-iterations` 兜底**（在 SCHEMA 中显式 required）。
  - Windows 用户：`harnessed doctor` 检查 `jq` + `bash` 解析路径（Git Bash 而非 WSL）。

### Workflow 1 research § 设计决策
- **新增**：
  - MCP installer 强制 `--scope project`（R03 § 3.3 红旗 1，避开 v2.1.122 user scope bug）。
  - Windows native 平台 npx 自动注入 `cmd /c` wrapper（R03 § 3.7）。

### 跨 workflow 共享设计 § 错误降级
- **新增**：上游废弃 / 改名静默失败的 fallback 路径（R04 § 失败模式 6）。manifest 必填 `upstream_health`，doctor weekly 检查 6 月无 commit 上游标 stale。

## 五、对 ROADMAP 的输入（v0.1 → v0.4 必含项 + 拒绝清单）

### v0.1.0（manifest 引擎 + research workflow）

**MUST**:

1. **manifest schema v1 冻结**（SPEC § 8.1）—— R03 § 6.5 草案 + R04 P0 增补：
   - 加 `apiVersion: harnessed/v1`（仿 K8s CRD）
   - 加 `upstream_health: { stability, last_check, fallback_action }`
   - 加 `signed_by: <maintainer github username>`
   - 4 type 共有/分支字段全部 frozen
2. **5 种 installer 中的 3 个**（research workflow 实际用到）：
   - `cli-npm`（ctx7）
   - `mcp-stdio-add`（Tavily, Exa）
   - 内置 `harnessed-router` 引擎
3. **DAG resolver 从 Day 1**（R04 § P0#4）：install engine 不是 sequential，是先解析全图再拓扑排序。循环依赖 schema 校验时拒绝。
4. **research workflow 跑通**（WORKFLOWS § 1）：30 个真实查询样本验证。
5. **第一份 ADR**：`docs/adr/0001-manifest-schema-v1.md`（R04 § P0#6）。
6. **`harnessed setup` 启动自检自身版本**（R04 § P0#5）。
7. **routing schema 严格 JSON Schema 校验**（学 Kubeconform `-strict`，R04 § P0#7）。
8. **Cross-OS 测试 Day 1 启用**（R03 红旗 6 + R04 P0）：CI 矩阵含 macOS + Linux + Windows native（不是 WSL）。npx `cmd /c` wrapper 自动注入。
9. **MCP installer 强制 `--scope project`**（R03 红旗 1）。

### v0.2.0（execute-task workflow + ralph-loop）

**MUST**:

1. **剩下 2 种 installer**：
   - `cc-plugin-marketplace`（superpowers, ralph-loop）
   - `npx-skill-installer` / `git-clone-with-setup`（mattpocock-skills, karpathy-skills, gstack）
2. **execute-task workflow 跑通**（WORKFLOWS § 2）。
3. **ralph-loop Windows fix**（R02 § 7 红旗 + R03 红旗 6）：doctor 检查 jq + bash 路径；模板强制 `--max-iterations`。
4. **`harnessed doctor` health check**（R04 § P1#8）：6 月无 commit 标 stale。
5. **`harnessed audit` 命令**（R04 § P1#10）：检查上游 git origin URL 未被篡改。
6. **karpathy-skills 作为 behavior-rule 实装**（R02 § 6）：CLAUDE.md 注入策略 + 多源 merge。
7. **plugin 卸载强制 CLI 不走 TUI**（R03 § 1.3 issue #52456）：`claude plugin uninstall --prune` + 4 步 fallback。

### v0.3.0（plan-feature workflow + checkpoint）

**MUST**:

1. **plan-feature workflow 跑通**（WORKFLOWS § 3）。
2. **checkpoint 机制**（SPEC § 12）：摘要 vs archive 分层 + `harnessed resume`。
3. **B+C 路由实测命中率 ≥ 85%**（SPEC § 5.1 + R03 § 2.4）：30 样本覆盖 Haiku/Sonnet/Opus 各 ≥ 8。
4. **gstack 命令前缀探测**（R02 § 1）。
5. **manifest deprecation marker**（R04 § P2#12）。
6. **manifests/aliases.yaml**（R04 § P2#13）。
7. **"known good" 版本组合**（R04 § P1#9）：每个 harnessed 版本冻结一组通过 e2e 的上游版本。

### v0.4.0(dogfooding benchmark + 稳定期)

**MUST**:

1. **dogfooding benchmark 公开发布**（R01 § 9）：30 真实任务 + 命中率数据 + 上游升级 e2e → `docs/benchmarks/`。
2. **co-maintainer 招募窗口启动**（SPEC § 5.6 + R04 § 失败模式 3）：6 月窗口 + `docs/MAINTAINER-ONBOARDING.md`。
3. **stale-bot + issue templates**（R04 § P2#14）。
4. **公开 ADR 全集**（R04 § P2#15）。
5. **路由透明度日志**（R01 § 7）：`.harnessed/audit.log`。
6. **GitHub Sponsors 启用**（SPEC § 5.6）。

### MVP 拒绝清单（v1.0 前明确不做，直接采纳 R04 § P3）

- ❌ **不在 v1.0 前加新 workflow type**（坚守 3 个：research / execute-task / plan-feature）
- ❌ **不 wrap 上游 API**（不写 `harnessed.invokeBrainstorming()` 这类二次抽象）
- ❌ **不做"云端 manifest registry"**（v1.0+ 再考虑）
- ❌ **不支持 manifest 里的动态求值 / shell escape**（`${shell command}` / `eval` / `!ruby/regexp` 全禁）
- ❌ **不在 v0.5 前实现跨 harness**（先把 CC 一条线打透；schema 留接口注释即可）
- ❌ **不做可视化 dashboard**（v1.0+ 再考虑）

## 六、风险登记修订（SPEC § 7 完整版）

### 现有风险评级修正

| 现有风险 | 当前评级 | 修订评级 | 依据 |
|---------|---------|---------|------|
| 上游 breaking change 塌方 | 中/高 | **高/高** | R04：N 个上游 = 平方级负载，5 个个人项目 SemVer 不严，10 上游月均 ~0.83 次 breaking |
| 单点维护（bus factor 1） | 中/中 | **中/高** | R04：Avelino 论文实证单 maintainer 年掉队率 36% |

### 新增 5 条风险

| 新风险 | 概率 | 影响 | 缓解 | 来源 |
|--------|------|------|------|------|
| 抽象层成为枷锁（用户绕不开 harnessed 时弃用） | 中 | 高 | escape hatch（每个 workflow 可绕开直调上游）+ 透明度（每步可见可改） | R04 § 失败模式 2（Octomind） |
| 上游 deprecate / rename 静默失败 | 中 | 中 | manifest 必填 `upstream_health` + doctor weekly + deprecation marker + aliases.yaml | R04 § 失败模式 6（Homebrew tap） |
| 范围蔓延变 meta-PM | 中 | 高 | feature request 三问 + v1.0 前 freeze workflow 数量为 3 | R04 § 失败模式 10（brew bundle / LangChain） |
| 拓扑解析缺失导致 install 顺序错乱 | 高 | 中 | install engine Day 1 是 DAG resolver | R04 § 失败模式 4（brew bundle issue #21416） |
| 装机即过期（用户用旧版本却不知道） | 高 | 中 | `harnessed setup` 启动自检 + 推 `npx@latest` | R04 § 失败模式 9（CRA / Vue CLI） |

## 七、未决问题（留给 plan-phase 处理）

1. **manifest type 计数**：keep 4 type + 子方法 vs 升 5 type？两条路线 R03 schema 都能覆盖。当前推荐 4 type（schema 简洁性），需要 plan-phase 选定并写 ADR。
2. **planning-with-files 与 superpowers/writing-plans 的精确互斥语义**（R02 § 4）：是命令冲突还是行为冲突？v0.1 dogfooding 时观察。manifest 先支持 `mutually_exclusive_with` 数组占位。
3. **gstack-2 / GSD-2 v2 重写的迁移策略**（R02 § 红旗 P3#9 + R03 § 1）：v0.1 不阻塞，ROADMAP 留 v1.0+ 迁移占位。
4. **签名版 manifest 是否启用 sigstore / cosign**（R01 § 5）：v0.4+ 议题，v0.1-0.3 先用 commit hash。
5. **`mutually-exclusive skill groups` 元模型**（R02 § 红旗 P2#7）：TDD 类多上游各有实现，v0.2 设计 pack schema 时定。
6. **token budget 监控的 UX**（R03 § 2.4）：`harnessed doctor` 怎么算 skill description 总 token？需要近似算法 + 阈值告警。v0.3 设计。
7. **"用户 10 秒手动覆盖路由错误" UX 指标量化方式**（R04 § Q2）：v0.4 benchmark 阶段定。

---

## Highlights

4 份调研 4/4 HIGH 置信。R02 实证 9 个上游全部存在，澄清 R01 唯一 LOW flag。**6 个核心修订**：
1. SPEC § 2 install kind 4→5（gstack 是 git+setup 不是 plugin）
2. SPEC § 8.3 "hook 禁 shell" 措辞重写为"配置纯 yaml/md + 脚本严格审计透明"
3. SPEC § 5.1 跨 harness 命中率损失 30%→30-50%
4. SPEC § 7 单点维护 中/中→中/高，新增 5 条风险
5. manifest schema 加 apiVersion + upstream_health + signed_by 三字段
6. Cross-OS 测试 v0.4→v0.1 前移

**ROADMAP 4 个版本必含项 + 6 项拒绝清单 ready-to-use**。

**最大致命风险**：bridge 永久债（10 上游月均 0.83 次 breaking）+ 单维护者倦怠（学术 36%/年），缓解靠 weekly CI + 降低 fork 成本（schema 数据化 + ADR 公开 + 自动化）。
