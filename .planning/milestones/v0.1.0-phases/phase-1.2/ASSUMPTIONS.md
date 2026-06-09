# Phase 1.2 Assumptions Analysis

> Phase: v0.1.0 / Phase 1.2 — cli-npm + mcp-stdio installer + harnessed setup/doctor 命令骨架
> 范围（重组后，原 ROADMAP cross-OS CI 已在 phase 1.1 提前完成）：
>   - cli-npm installer（ctx7 真实安装）
>   - mcp-stdio-add installer（Tavily + Exa）
>   - harnessed setup（自检 + npx@latest 提示 + dry-run + .harnessed-backup/）
>   - harnessed doctor health check 骨架（6 月 stale + Node 版本 + jq/bash + scope）
>   - harnessed audit 骨架（git origin URL 篡改检测）
>   - plugin uninstall 强制 CLI 不走 TUI（4 步 fallback）
>   - ralph-loop Windows fix 探测代码（jq + Git Bash）
>   - karpathy-skills behavior-rule 实装（CLAUDE.md 注入 + 多源 merge）
>   - ADR 0004 6 条 installer UX 硬契约 落地
> 验收：3 平台（mac/linux/win-native）真实 install ctx7 + tavily + exa idempotent + dry-run + rollback 通过；71 → ≥ 110 tests；6 contract tests 全绿
>
> Date: 2026-05-12
> Analyzer: gsd-assumptions-analyzer (Opus 4.7)
> Calibration tier: standard (3-4 areas + 2 alternatives per Likely/Unclear)
> Inputs read:
>   - ROADMAP.md v0.1.0 Phase 1.2 章节 (L74-L82)
>   - PROJECT-SPEC.md v2.1 § 8.3 + § 8.4 (hook 数据化 / setup explicit confirm / MCP CLI / project scope)
>   - REQUIREMENTS.md R2.1 / R2.2 / R2.3 / R3.1-R3.4 / R4.4 / R5.1-R5.3 / R9.3
>   - ADR 0001 (schema) / ADR 0002 (toolchain) / ADR 0003 (6 method) / ADR 0004 (installer UX 6 硬契约)
>   - research/02-upstream-reality.md § 1-9 (10 上游真实安装) + 红旗 1-10
>   - research/03-integration-mechanisms.md § 3-4 (cli-npm + mcp-npm 实证) + 红旗 1-8
>   - phase-1.1/ASSUMPTIONS.md (上一 phase 同类文档参考)
>   - phase-1.1/progress.md § B F1-F22（含 F20 cc-plugin-marketplace headless 关键决策点）
>   - src/manifest/{validate.ts, errors.ts, security.ts, schema/} 已实装代码
>   - manifests/tools/{ctx7, tavily-mcp, exa-mcp, ralph-loop, superpowers}.yaml
>   - .github/workflows/ci.yml 36L
>   - STATE.md L20-L46 (current position)

---

## A. 已有强证据的 assumptions（spec / ADR / 已实装代码 锁定）

### A1. 6 install method 完整列表 + 4 type × 6 method 矩阵 frozen
- Source: ADR 0001 § type×method 矩阵 (line 104-113) + ADR 0003 errata (5→6 文档对齐) + src/manifest/schema/index.ts matrix allOf 实装
- 6 method: cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / npm-cli / mcp-stdio-add / mcp-http-add
- Phase 1.2 实装范围：仅 npm-cli (ctx7) + mcp-stdio-add (Tavily / Exa)；其余 4 method 在 phase 2.x
- Strength: Locked，schema 实装层已 GREEN（71 vitest 含 17 illegal matrix）
- Discuss action: 不需 — plan-phase 直接读 ADR 0001/0003

### A2. Installer UX 6 硬契约 frozen（ADR 0004）
- Source: docs/adr/0004-installer-dry-run-diff-preview-contract.md Accepted (2026-05-12)
- 6 条契约：(1) dry-run 默认 + --apply / --non-interactive --apply；(2) unified diff 格式 + nocolor TTY 检测 + 200L 折叠；(3) .harnessed-backup/<ISO-timestamp>/ 镜像目录 + metadata.json + harnessed rollback；(4) 4 级 confirm（L1-L4）+ 每 method 声明级别；(5) MCP 修改强制 claude mcp add/remove --scope project，禁直接编辑 .mcp.json；(6) 任何步骤失败 STOP + report 可执行修复命令，禁 silent skip
- Method-Level 映射已在 ADR 0004 § 4 表格定义（npm-cli L4 if global / L1 if npx；mcp-stdio-add L3）
- CI 守门：tests/integration/installer-contract.test.ts 6 contract tests phase 1.2 加
- Strength: Locked，phase 1.2 第一行 installer 代码前的 user-facing UX 契约
- Discuss action: 不需 — plan-phase 直接按 ADR 0004 § Compliance 写 contract test

### A3. Schema validator + security gate API 已实装
- Source: src/manifest/validate.ts L50-L80 (validateManifestFile) + src/manifest/security.ts L96-L144 (checkSecurityViolations) + src/manifest/errors.ts (ValidationError type)
- Phase 1.2 installer 加载 manifest 时调用顺序：parse yaml → checkSecurityViolations (B1 gate) → Ajv strict validate → typed Manifest
- B1 gate 检测 dollar-paren / dollar-brace / backtick 在 spec.install.cmd / verify.cmd / uninstall.cmd / cleanup_paths[*]，phase 1.2 spawn cmd 前已被防住
- Strength: Locked，9 security tests + 17 matrix tests + 18 fixture tests 全绿
- Discuss action: 不需 — installer 直接 import validateManifestFile

### A4. MCP install 强制 --scope project（user scope bug 永久规避）
- Source: PROJECT-SPEC v2.1 § 8.4 + ADR 0004 契约 5 + R03 § 3.3 红旗 1（CC issue #54803 v2.1.122 user scope 写但不可读）+ manifests/tools/{tavily,exa}-mcp.yaml install.cmd 已硬编码
- 配置文件落到项目 .mcp.json，团队可共享，避开 user scope bug
- Strength: Locked at 4 个独立来源（spec / ADR / research / manifest 实证）
- Discuss action: 不需

### A5. Cross-OS CI matrix 已就绪 + Windows 性能 outlier 已知
- Source: .github/workflows/ci.yml 36L 3-OS × Node 22 matrix + phase-1.1/progress.md § B F18 (Windows cloud VM 100ms threshold)
- Phase 1.2 不需新建 CI workflow；只需扩展现有 ci.yml 加 installer integration test job
- Strength: Locked，run 25686045249 三平台全绿
- Discuss action: 不需

### A6. 上游真实安装路径已 dogfooded
- Source: manifests/tools/ctx7.yaml (npm-cli `npm install -g ctx7`) + tavily-mcp.yaml + exa-mcp.yaml (mcp-stdio-add `claude mcp add --scope project --transport stdio ... -- npx --yes ...`)
- R03 § 3.7：Windows native stdio + npx 必须 `cmd /c` wrapper
- R03 § 4.1-4.3：cli-npm 用 `which` npm package 跨平台 detect + is-installed-globally
- Strength: Locked，3 manifests 已 pass strict 校验

### A7. ralph-loop Windows fix 范围明确
- Source: R02 § 7 + R03 红旗 6 + R5.3 + ROADMAP Phase 1.2 列表 + manifests/tools/ralph-loop.yaml stability=beta
- 已知坑：(a) 未声明 jq 依赖；(b) 解析到 WSL bash 而非 Git Bash；(c) issue #1429 --completion-promise newline bug
- Phase 1.2 范围：doctor 探测 + 修复指引；不修上游 bug（仅给 fallback 文档）
- Strength: Locked

### A8. ADR 0001/0002 main body 守恒（A7 acceptance bar 沿袭）
- Source: phase-1.1/progress.md § B F19 + STATE.md L40 (adr-0001-accepted baseline tag) + ci.yml 已加 A7 守恒 step
- Phase 1.2 任何 schema 字段缺口 → 出 ADR 0005+ errata，不动 ADR 0001 main body
- Strength: Locked via git tag sentry + CI step

---

## B. 隐式假设但未明说（plan-phase 前需澄清）

### B1. Installer 抽象层形态 — class hierarchy / functional pipeline / discriminated union switch?
- Unstated: ADR 0004 § Consequences 中性 3 明说"不约束 installer 内部架构（OOP / 函数式 / pipeline 任意）"，但 6 个 method（phase 1.2 实装 2 个，phase 2.x 4 个）必须 share 一个 dry-run/diff/rollback/confirm 抽象（ADR 0004 § Consequences 负面 4）
- Candidates:
  1. **BaseInstaller class + 6 subclass**（继承 OOP 风格）— 共享 dryRun() / diff() / rollback() / confirm() 模板方法；6 method 各自 override execute()。优点：契约 6 surface 在 base class 有显式 abstract 方法，CI contract test 易写；缺点：与项目其余 functional 风格（src/manifest/{validate,errors,security}.ts 全函数）不一致
  2. **Discriminated union + dispatcher functions**（karpathy simplicity 风格）— Installer 类型用 type-tag union (method 字段判别)；runInstaller(manifest, opts) 顶层做 dry-run / diff / rollback wrapping，再 dispatch 到 method-specific execute。优点：与 src/manifest/ 现有 discriminator union 风格一致；类型安全；缺点：6 surface 抽象需手动注入到 wrapper（不是 base class 强制）
- Recommendation: 候选 2（discriminated union + wrapper），与 phase 1.1 ManifestSchema 风格一致 + ADR 0002 verbatimModuleSyntax 友好
- Phase 1.3-2.x impact: DAG resolver (phase 1.3) 调用 installer 接口；phase 2.x 加 4 method 时新增 union variant + execute 函数
- Status: **GA-2 已 handed to advisor-researcher**（phase-1.2 main agent 已识别）

### B2. CLI / Diff / Color library 选型
- Unstated: ADR 0004 契约 2 要求 unified diff + 终端检测 nocolor + 200L 折叠 + summary 行；未指定 lib
- Candidates:
  1. **commander + picocolors + diff (jsdiff)** — commander 已被 ADR 0002 选定；picocolors 是最小颜色库（~3KB，无 deps）；jsdiff (npm "diff") ~12k weekly DL，提供 createTwoFilesPatch unified diff 输出。优点：bundle 小（~50KB total），与 ADR 0002 ESM-only / Node 22 友好；缺点：颜色库 chalk v5 ESM only（如选则与 picocolors 二选一）
  2. **commander + chalk v5 + diff (jsdiff)** — chalk 是社区习惯（35M weekly DL），样式 API 更丰富。但 chalk v5 ESM-only 与 ADR 0002 兼容；与 picocolors 在功能上重叠 — 选其一即可
- Recommendation: 候选 1（picocolors 更小 + isTTY 自然支持）。jsdiff 是无争议选项。需验证 jsdiff 在 Windows CRLF 文件下输出正确（phase 1.1 已用 .gitattributes 强制 LF — 见 § C3）
- Phase 1.3 impact: harnessed setup 也要复用 diff 输出（settings.json / CLAUDE.md merge）
- Status: **GA-3 已 handed to advisor-researcher**

### B3. cli-npm fallback 链 — 用户拒绝全局 + npx 失败时下一步？
- Unstated: ADR 0001 schema cli-npm install.method ∈ {npm-cli, npx}；R03 § 4.1 决策 "默认 `npm i -g`，用户拒绝则 `npx <pkg>@<lock_version>` fallback"；但 ADR 0004 契约 6 "no silent failure" 与 ADR 0004 § 4 L4 "改 system PATH 必须 explicit `--system` flag" 之间未澄清：用户拒绝 L4 → 自动降级到 L1 npx ephemeral 还是 STOP？
- Candidates:
  1. **拒 L4 → 自动降级到 L1 npx + 显式告知**（PROJECT-SPEC § 8.5 不允许 silent skip 但允许 explicit fallback）— installer 写到 .harnessed/runtime-cli.json 标记该 upstream 走 npx；workflow 调用统一 wrapper 函数选 npx
  2. **拒 L4 → STOP + 报错 + 提示用户 explicit 加 `--allow-npx-fallback` flag**（karpathy goal-driven，不假设用户意图）
- Recommendation: 候选 1（与 § 8.5 一致 + 减少用户摩擦）；告知行必须打印精确 npx 命令模板
- Impact: workflow 调用层（phase 1.4 research）需要 awareness；ctx7 manifest 已有 fallback_action: warn

### B4. doctor / audit 命令 phase 1.2 的最小可用集
- Unstated: ROADMAP Phase 1.2 列出 doctor "6 月无 commit 上游标 stale" + audit "git origin URL 篡改检测"；R2.2 / R2.3 列出更长清单（Node 版本 / MCP scope / jq / bash / API key 缺失）；phase 1.2 实装哪些 vs 推迟到 phase 2.4？
- Candidates:
  1. **Phase 1.2 = 4 项最小可用 doctor**：(a) Node ≥ 22；(b) MCP --scope project 探测；(c) jq 存在；(d) Windows bash 路径（Git Bash 而非 WSL）。Phase 1.2 = 1 项最小 audit：(e) 9 个上游 git origin URL 比对 manifest.repository。其余（6 月 stale / weekly cron / API key / version skew）= phase 2.4
  2. **Phase 1.2 = 完整 doctor + audit**（含 weekly cron 配置 + stale 检测）— 但 6 月 stale 需 GitHub API 调用 + commit history fetch，工程量大；R04 P1#8 是 v0.2 范围
- Recommendation: 候选 1（karpathy surgical），符合 ROADMAP 措辞 "命令骨架"；6 月 stale + weekly cron 推到 phase 2.4 与 audit 命令一同出 v0.2
- Impact: 影响 phase 1.2 task count 估算（候选 1 ≈ 8-10 task / 候选 2 ≈ 14-16 task）

### B5. karpathy-skills behavior-rule CLAUDE.md merge 顺序 + 卸载策略
- Unstated: REQUIREMENTS R6.2 + R02 § 6 + ROADMAP Phase 1.2 列表 / Phase 2.2 都提到该实装；ROADMAP 文字"phase 1.2 范围"实际重叠 phase 2.2 描述，需在 plan-phase 决策
- Candidates:
  1. **Phase 1.2 实装注入引擎 + 多源 merge + 一键关闭 + uninstall**（按 ROADMAP Phase 1.2 列表）— 范围扩 ~5-6 task；需定义 merge 顺序：harnessed default < 用户私有 ~/.claude/CLAUDE.md < 项目级 .claude/CLAUDE.md（priority 升序覆盖）
  2. **Phase 1.2 仅 manifest 安装 karpathy-skills（npx-skill-installer）+ behavior-rule 边界 case 已通过 schema dry-run（F14）；CLAUDE.md merge 引擎推到 phase 2.2**
- Recommendation: 候选 2（karpathy simplicity + ROADMAP Phase 2.2 已显式列 "karpathy-skills behavior-rule 注入引擎 + CLAUDE.md merge"）；phase 1.2 主诉求是 installer pipeline + setup/doctor 骨架，CLAUDE.md merge 是独立子系统
- Impact: 影响 phase 1.2 验收标准；候选 2 让 phase 1.2 acceptance bar 简洁（ctx7 + tavily + exa 端到端 + dry-run UX 6 contract）

### B6. cc-plugin-marketplace 3 manifests（ralph-loop / superpowers / planning-with-files）— 留 phase 1.2 还是推迟？
- Unstated: phase-1.1 progress.md § B F20 (H5 paranoid review) 明示决策点：3 manifests 在 manifests/tools/ 已 ship，但 install.cmd 是 CC REPL slash command（/plugin install ...），headless installer 不能直接 spawn
- Candidates: **(已是 GA-1，main agent 已识别)**
  1. **(A)** Auto-print prompt + user paste into CC REPL（半自动；user friction 中）
  2. **(B)** 等 Anthropic ship `claude plugin install` headless CLI（时间不可控；R03 § 1.1 已显示 `claude plugin install` CLI 存在 — 需重新验证 v2.1.122+ 是否 stable）
  3. **(C)** Defer 这 3 manifests 到 v0.2 phase 2.1（最 conservative；v0.1 SHIP 缺这 3 个上游 — research workflow 不依赖它们 → 可推迟）
- Recommendation: **候选 C**（research workflow 实际只用 ctx7 + Tavily + Exa，3 个 cc-plugin marketplace 上游不在 v0.1 关键路径；推到 v0.2 phase 2.1 与剩下 4 method 一同实装）
- 如选 C：phase 1.2 install method 实装范围收敛到 2 个（npm-cli + mcp-stdio-add），符合 ROADMAP § Phase 1.2 原描述
- Impact: 直接决定 phase 1.2 task list 长度
- Status: **GA-1 已 handed to advisor-researcher**

### B7. .harnessed/ 目录结构 phase 1.2 落地范围
- Unstated: ADR 0004 契约 3 + 4（L1 写 <user-project>/.harnessed/）+ R7.3 (harnessed resume 读 .harnessed/current-workflow.json，v0.3) — 但 phase 1.2 已经要写 .harnessed-backup/（rollback）和可能 .harnessed/runtime-cli.json（B3 fallback 标记）
- Candidates:
  1. **Phase 1.2 仅落地 .harnessed-backup/ + .harnessed/state.json（installer 已装清单 + 版本号）+ .gitignore 提示用户 add .harnessed-backup/**（最小可用）
  2. **Phase 1.2 落地完整 .harnessed/{state.json, audit.log placeholder, current-workflow.json placeholder, checkpoints/}**（提前为 phase 1.4 research workflow + phase 3.1 checkpoint 留位）
- Recommendation: 候选 1（karpathy YAGNI），phase 1.4 / phase 3.1 自然添加；不预留空目录
- Impact: phase 1.2 写哪些文件 + .gitignore 模板更新

---

## C. 风险预警 assumptions（未来可能崩塌）

### C1. CC plugin marketplace API 在 phase 1.2 实施期间不变（F20 关联）
- Assumption: 即使决策 B6=候选 C 推迟 cc-plugin-marketplace，phase 1.4 research workflow 也无依赖；但 ralph-loop manifest 已 ship 在 phase 1.1 — schema 字段层 stable
- Risk: Anthropic 在 v2.2 ship breaking change 改 marketplace.json 结构 → ralph-loop manifest 需重写（manifest install.cmd 是 ref 字符串，schema 层不会立即 break，但 phase 2.1 实装时实际 install 失败）
- Mitigation: ADR 0001 apiVersion + 已记录 ADR 0001 L173-L178 升级路径；weekly CI 在 phase 2.4 启动后自动捕获
- Severity: 低（phase 1.2 不实装 cc-plugin-marketplace installer，影响窗口推到 phase 2.1）

### C2. claude mcp add CLI 输出格式稳定（installer 解析其输出）
- Assumption: claude mcp add --scope project --transport stdio NAME -- npx ... 退出码 0 = 成功；claude mcp list 输出可被 grep；claude mcp remove 失败时输出明确 error
- Risk: CC v2.1.x 升级改 CLI 输出格式（如加颜色、改 stderr/stdout 分流、改 success exit code 语义），installer 解析 break
- Mitigation: installer 仅依赖 exit code（不解析 stdout 文本）；idempotent_check 用 claude mcp list pipe grep -q NAME 而非 JSON parse；ADR 0004 契约 5 已强制走 CLI 不直接编辑 .mcp.json，至少避开 .claude.json 大文件 corruption
- Severity: 中（mcp-stdio-add 是 phase 1.2 核心实装；phase 1.4 research workflow 直接依赖）

### C3. Windows native CRLF / 路径分隔符 在 .harnessed-backup/ + diff 输出中正确处理
- Assumption: jsdiff createTwoFilesPatch 在 CRLF 文件 vs LF 文件之间产生稳定 diff（phase 1.1 已 .gitattributes 强制 LF for repo files，但用户系统的 ~/.claude.json / .mcp.json 可能 CRLF）
- Risk: Windows 上读取 user ~/.claude.json (CRLF) → backup 文件落 CRLF → restore 时若用户编辑器改 LF → sha1 mismatch + rollback 报错；或 diff 输出每行末尾显示 \r 噪声
- Mitigation: backup 时记录原始 EOL 到 metadata.json（per-file eol: lf | crlf 字段，扩展 ADR 0004 § 3 metadata schema）；jsdiff 输出前 normalize EOL 到 LF
- Severity: 中（Windows 用户 ~30%；phase 1.2 cross-OS CI 实测会暴露）

### C4. ralph-loop Windows fix 检测代码可靠性（jq + Git Bash detect）
- Assumption: which jq + where bash (Windows) 能区分 Git Bash vs WSL bash
- Risk: Windows PATH 顺序不可控 — 用户装了 Git Bash 但 PATH 中 WSL bash 在前 → which bash 返回 WSL 路径但 ralph-loop hook 实际 invoke 的可能是 Git Bash（因为 hook 通过 cmd.exe spawn，cmd 用不同的 PATH 解析逻辑）
- Mitigation: doctor 检测时用 spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME']) — 若返回非空则是 WSL；否则视为 Git Bash 或 native bash；记录到 STATE.md 后续 finding
- Severity: 中（ralph-loop 是 v0.2 高优先级，phase 1.2 doctor 检测代码若漏检会导致 phase 2.4 ralph-loop 验收失败）

### C5. ADR 0004 契约 4（4 级 confirm）与 npm-cli L4 vs L1 切换的 UX 摩擦
- Assumption: 用户首次跑 harnessed install ctx7 看到 L4 prompt（"will install global npm package — type --system to confirm"）能正确理解
- Risk: 用户被 L4 阻断 → 直接 ctrl-C → 误以为 harnessed broken；或 L1 npx ephemeral fallback 被默认选中导致用户每次跑 ctx7 ... 都有冷启延迟（karpathy goal-driven 失败）
- Mitigation: dry-run 输出 + L4 prompt 含 npx fallback 一句话教学；CONTRIBUTING.md 加 FAQ
- Severity: 低（dogfooding 时观察；phase 1.4 research workflow 不依赖 ctx7 全局安装也能 work）

### C6. Test framework 跨进程 spawn 在 vitest 下的 isolation
- Assumption: phase 1.2 integration test 会 spawn 真实 claude mcp add / npm install -g — vitest 默认进程级 isolation 够
- Risk: npm install -g 真改 user 全局环境 → 测试间互相污染 + CI runner 状态泄漏；mock spawn 又失去 dogfooding 价值
- Mitigation: integration test 用临时 PREFIX 环境变量 (npm_config_prefix) + tmpdir 隔离；mcp add 用 --scope project + cwd: tmpdir；CI 跑完每个 test 清理；分离 unit (vitest mocked) vs integration (real spawn) 两套测试 — 后者仅 phase 1.2 final acceptance run
- Severity: 中（CI 矩阵稳定性直接受影响）

---

## 4. Gray Areas（advisor-researcher 调研清单）

### GA-1: F20 cc-plugin-marketplace headless 机制 — phase 1.2 范围还是推 v0.2？
- 问题陈述: 3 manifests（ralph-loop / superpowers / planning-with-files）install.cmd 是 CC REPL slash command；headless installer 不能直接 spawn；phase 1.2 是否要解决？
- 候选方案: (A) Auto-print prompt 半自动；(B) 等 claude plugin install headless CLI 稳定（需重新验证 v2.1.122+）；(C) 推迟到 v0.2 phase 2.1
- 影响范围: phase 1.2 install method 实装数（2 还是 3）、phase 1.2 task list 长度（10 vs 14 task）、phase 1.4 research workflow 是否依赖（不依赖 — research 仅 ctx7 + Tavily + Exa）
- 优先级: **P0 — phase 1.2 plan-phase 必决**
- 推荐: 候选 (C) — research workflow 不阻塞；conservative 推迟符合 karpathy YAGNI
- Status: handed to advisor-researcher（已识别）

### GA-2: Installer 抽象层形态 — class hierarchy / functional pipeline / discriminated union?
- 问题陈述: ADR 0004 6 surface（dry-run + diff + rollback + 4-level confirm + MCP CLI + no silent failure）必须在 6 method 间一致；选 BaseInstaller class 还是 functional discriminator union？
- 候选方案:
  1. BaseInstaller class + 6 subclass（OOP，contract test 易写）
  2. Discriminated union + wrapper functions（与 src/manifest/ 风格一致，类型安全）
  3. (备选) Pipeline composition (Effect-TS / fp-ts) — 拒绝（dep 重 + 与 ADR 0002 简洁原则冲突）
- 影响范围: phase 1.2 installer 文件组织（src/installers/{base.ts, npm-cli.ts, mcp-stdio.ts}）、phase 2.x 加 4 method 时扩展成本、ADR 0004 6 contract test 实装位置
- 优先级: **P0 — phase 1.2 plan-phase 必决**
- 推荐: 候选 2（与现有 manifest discriminator 风格一致；类型安全；karpathy simplicity）
- Status: handed to advisor-researcher（已识别）

### GA-3: CLI / Diff / Color library 选型
- 问题陈述: ADR 0004 契约 2 unified diff + nocolor TTY + 200L 折叠 + summary；选哪些 lib？
- 候选方案:
  1. commander (locked) + picocolors + diff (jsdiff) — 最小 bundle (~50KB)，picocolors 无 deps
  2. commander + chalk v5 + diff — chalk API 丰富但 bundle 大（~250KB）；ESM-only ✅
  3. (备选) commander + kleur + diff — kleur 介于 picocolors 和 chalk 之间
- 影响范围: phase 1.2 + phase 1.3 setup 命令 diff 输出 UX 一致性、bundle 大小、Windows TTY 检测
- 优先级: **P0 — phase 1.2 plan-phase 必决**
- 推荐: 候选 1（picocolors + jsdiff）；理由：bundle 小 + picocolors process.stdout.isTTY 自动 nocolor；jsdiff 是无争议选项
- Status: handed to advisor-researcher（已识别）

### GA-4（补充）: doctor / audit 命令的 6 月 stale 检测时机
- 问题陈述: B4 中提到 6 月无 commit upstream 标 stale 检测推到 phase 2.4，但 phase 1.2 audit 是否需要 placeholder?
- 候选方案: (a) phase 1.2 audit 仅做 git origin URL 比对（最小骨架）；(b) phase 1.2 audit 加 GitHub API last-commit 抽样查询（半自动，不接 weekly cron）
- 影响范围: phase 1.2 task count + 是否依赖 GitHub API token
- 优先级: P1（plan-phase 决，但不阻塞 GA-1/2/3）
- 推荐: (a)，与 B4 候选 1 一致

### GA-5（补充）: setup 命令 npx@latest 自检的实装路径
- 问题陈述: R2.1 + ROADMAP must-have 6 要求 setup 启动自检自身版本，老旧时建议 npx harnessed@latest；phase 1.2 怎么探测 npm registry latest version？
- 候选方案: (a) 内嵌 npm view harnessed version（spawn npm，慢 ~2s）；(b) 直接调 npm registry HTTP API https://registry.npmjs.org/harnessed/latest（fast，~200ms，但需 fetch dep）；(c) 推到 phase 1.3 setup 命令完整版
- 影响范围: phase 1.2 setup 是否走完整路径还是骨架占位
- 优先级: P1
- 推荐: (b)，Node 22 内置 fetch；与 ADR 0002 ESM + 现代 Node 22 一致

---

## 5. 不需要 discuss 的部分（spec / ADR 已锁，直接进 plan-phase）

- ✅ **6 install method enumeration**（ADR 0001 § type×method 矩阵 + ADR 0003 errata）
- ✅ **Dry-run / diff / rollback / 4-level / MCP CLI / no-silent-failure 6 硬契约**（ADR 0004 全文）
- ✅ **Schema validator + B1 security gate API**（src/manifest/{validate,security,errors}.ts 已实装）
- ✅ **MCP --scope project 强制**（SPEC § 8.4 + ADR 0004 契约 5 + manifests/tools/{tavily,exa}-mcp.yaml）
- ✅ **Cross-OS CI 矩阵已配置**（ci.yml 36L + run 25686045249 三平台全绿）
- ✅ **License whitelist + signed_by + apiVersion**（ADR 0001 + B1.1.1 hotfix H4）
- ✅ **3 manifest 真实 install 字符串**（ctx7 / tavily-mcp / exa-mcp 已 ship）
- ✅ **Node ≥ 22 + ESM + verbatimModuleSyntax**（ADR 0002）
- ✅ **commander CLI framework**（ADR 0002）
- ✅ **vitest test framework**（ADR 0002）
- ✅ **.harnessed-backup/<ISO-timestamp>/<HOME-mirror>/ 目录结构 + metadata.json schema**（ADR 0004 § 3）
- ✅ **harnessed rollback <timestamp> + harnessed backup list 命令存在**（ADR 0004 § 3，phase 1.2 实装）
- ✅ **Windows native cmd /c wrapper for npx**（R03 § 3.7 + R5.2）
- ✅ **A7 ADR 守恒 baseline tag** adr-0001-accepted + ci.yml step（不动 ADR 0001/0002 main body）

---

## 6. Inputs to plan-phase（关键 callout）

### 1. Phase 1.2 task list 必含项（推荐分组）

**T1 — Installer 抽象 + 2 method 实装（ADR 0004 6 契约落地）**
- T1.1 src/installers/base.ts（按 GA-2 决策 — discriminated union + dryRun/diff/rollback/confirm wrapper）
- T1.2 src/installers/npm-cli.ts（ctx7 全量 install / npx fallback / 4-level confirm）
- T1.3 src/installers/mcp-stdio.ts（tavily / exa 走 claude mcp add --scope project）
- T1.4 src/installers/diff.ts + src/installers/backup.ts（jsdiff + ISO-timestamp dir + metadata.json）

**T2 — harnessed install <name> CLI 命令**
- T2.1 dry-run default + --apply / --non-interactive --apply 双 flag
- T2.2 unified diff 输出 + nocolor TTY + 200L 折叠
- T2.3 partial install 状态 print + 修复命令

**T3 — harnessed setup 骨架**
- T3.1 自版本检查（GA-5 决策 — npm registry HTTP API）
- T3.2 写 .harnessed/state.json + dry-run + explicit confirm

**T4 — harnessed doctor 骨架**
- T4.1 Node ≥ 22 探测
- T4.2 MCP scope 探测（解析 .mcp.json）
- T4.3 jq 存在
- T4.4 Windows bash 路径（Git Bash vs WSL detection — C4 mitigation）

**T5 — harnessed audit 骨架**
- T5.1 9 上游 git origin URL 比对 manifest.repository（B4 候选 1）

**T6 — harnessed rollback + harnessed backup list**（ADR 0004 § 3）

**T7 — Contract tests 6 项**（ADR 0004 § Compliance）

**T8 — Integration tests cross-OS**（real spawn ctx7 / mcp add — C6 mitigation tmpdir 隔离）

**T9 — Plugin uninstall 4 步 fallback**（CLI primary + 3 manual cleanup steps；ROADMAP MUST + R6.5）

**T10 — ralph-loop Windows fix 探测代码**（doctor 子命令）

**T11 — Phase verify**（VERIFICATION.md + STATE.md 更新）

预估总 task ≈ 35-45 atomic 子任务（含 wave 分批）

### 2. Phase 1.2 验收标准 hard bar

1. 3 平台 CI 跑 harnessed install research（含 ctx7 + tavily + exa）端到端 idempotent + dry-run + rollback 全绿
2. tests/integration/installer-contract.test.ts 6 contract tests 全绿
3. harnessed doctor 在 Windows 上正确报告 jq + Git Bash 缺失（mock + real）
4. harnessed audit 检测 manifests 中 git origin URL 与 metadata.upstream.repository 一致
5. 总 vitest tests 89 → ≥ 130（增 ~40 installer / setup / doctor / audit 测试）
6. ADR 0001 / 0002 main body 守恒（A7 守恒 step 全绿）
7. harnessed rollback <ts> 正确恢复至原 sha1（含 CRLF/LF preservation per C3）

### 3. Out of Phase 1.2 scope（避免 scope creep）

- DAG resolver（phase 1.3）
- harnessed-router 引擎（phase 1.3）
- research workflow 端到端 + routing/search.md（phase 1.4）
- karpathy CLAUDE.md merge 引擎（phase 2.2）
- 4 个剩余 install method 实装（phase 2.1）
- 6 月 stale 检测 + weekly CI cron（phase 2.4）
- execute-task workflow（phase 2.3）
- checkpoint 引擎（phase 3.1）

### 4. Plan-phase 决策依赖

- **GA-1 (cc-plugin-marketplace 推迟决策)** + **GA-2 (installer 抽象)** + **GA-3 (CLI/diff/color lib)** 必须 plan-phase 第 1 天敲定，否则 T1.1 / T1.4 / T2.x 无法编码
- **B4 (doctor 范围)** 决定 T4.x task 数量，建议直接采用候选 1（最小骨架 + phase 2.4 扩展）
- **B5 (karpathy CLAUDE.md merge 推迟)** 直接采用候选 2（推到 phase 2.2）
- **B6 (cc-plugin-marketplace 推迟)** 与 GA-1 同决策
- **C3 (CRLF/LF preservation in backup)** 必须在 T1.4 backup 设计时纳入 metadata.json schema

### 5. Risk

- **C2 (claude mcp add 输出稳定)**：phase 1.4 research workflow 直接依赖；需在 phase 1.2 integration test 加 idempotent 重跑断言
- **C6 (test isolation)**：CI 跑真 spawn 时若不 tmpdir 隔离，CI runner 状态会泄漏，导致非确定性失败 — plan-phase 第 1 天定 test 策略
