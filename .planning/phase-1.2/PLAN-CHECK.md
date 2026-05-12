# Phase 1.2 Plan Check

**Date**: 2026-05-12  
**Checker**: gsd-plan-checker (goal-backward verification)  
**Plans**: PLAN.md (384L) + task_plan.md (840L) + progress.md (186L)  
**ADRs**: 0001-0004 + 0005 (drafted in Wave 0)

---

## Verdict

APPROVED — 可直接进入 /gsd-execute-phase 1.2，无 BLOCKER；3 条可选优化收录到下方 callout。

理由：5 个核心验证点（V1 越界 / V2 ADR 0004 12 cell 覆盖 / V3 ADR 0005 路径 / V4 acceptance bar 可执行 / V5 17 file mappings sync）全部通过。决策回溯链路完整（每 task 引 ADR/GA/ASSUMPTIONS/PATTERNS 章节）；A7 守恒明确（ADR 0001-0004 main body CI 自动 enforce）；out-of-scope 列表与 ROADMAP 和 GA-1 Recommendation 完全一致。

---

## V1. Out-of-scope 越界

**结论：无越界**。task_plan.md 对 4 项推迟 installer + DAG + merge + research workflow 的处理：

| 推迟项 | 应在 phase | task_plan.md 处理 | 校验 |
|--------|-----------|-------------------|------|
| cc-plugin-marketplace installer | 2.1 | L101 仅 manifest 声明 + L432 phase21Placeholder throw + L740/L828 deferred 列 | 仅 schema 字段 reserve（T1.3）+ phase21Placeholder，无实装代码 |
| git-clone-with-setup installer | 2.1 | L433 phase21Placeholder + L829 deferred | OK |
| npx-skill-installer installer | 2.1 | L434 phase21Placeholder + L830 deferred | OK |
| mcp-http-add installer | 2.x | L435 phase21Placeholder + L831 deferred | OK |
| karpathy CLAUDE.md merge 引擎 | 2.2 | L832 deferred + B5 候选 2 锁定 | OK |
| DAG resolver | 1.3 | L738 phase 1.3 prereq 接口契约 + L834 deferred | 仅暴露 runInstall 接口给 phase 1.3 消费 |
| Research workflow 端到端 dispatch | 1.4 | L833 deferred + PLAN.md L276 显式列 | phase 1.2 仅备 install ctx7+tavily+exa 三 deps，不跑 dispatch |

**越界检查 grep 项 0 命中实装代码**。所有 mention 均为 placeholder / deferred 列表 / 接口契约 / fixture 声明。

---

## V2. ADR 0004 6 契约 × 12 cell 覆盖

T5.2（tests/integration/installer-contract.test.ts，task_plan.md L566-595）通过 nested loop 自动展开 6 × 2 = 12 cell：

| 契约 | npm-cli (L4↔L1) | mcp-stdio-add (L3) | 验证点 |
|------|-----------------|---------------------|--------|
| **C1 dry-run default** | cell npm-cli/dry-run-default | cell mcp-stdio-add/dry-run-default | 默认 opts.apply=false → spawn 不被调用（mocked） |
| **C2 unified diff** | cell npm-cli/diff-format | cell mcp-stdio-add/diff-format | 输出含 +++ NEW: / --- REMOVE: / @@ 标头 |
| **C3 backup .harnessed-backup/ts/** | cell npm-cli/backup-location | cell mcp-stdio-add/backup-location | mocked fs.mkdir 被调用 + ISO-ts 路径 |
| **C4 4-level confirm** | cell npm-cli/level-declaration（L4↔L1 切换） | cell mcp-stdio-add/level-declaration（L3 固定） | Level union 字面正确 |
| **C5 MCP CLI 强制（仅 mcp-stdio 触发）** | cell npm-cli/mcp-cli-only（assert 不调 claude mcp） | cell mcp-stdio-add/mcp-cli-only（assert 只用 claude mcp 不 fs.writeFile .mcp.json） | 双向 assertion 防越界 |
| **C6 no silent failure** | cell npm-cli/no-silent-failure | cell mcp-stdio-add/no-silent-failure | 注入 spawn exit=1 → InstallResult.error.suggest 非空 |

**12/12 cell 全覆盖**。Fixtures 路径 tests/fixtures/installers/method/contract.yaml 走 auto-glob (Pattern I)；vi.mock(child_process) 隔离（C6 mitigation）；real-spawn 单独 skipIf gate（T5.6）。

---

## V3. ADR 0005 路径推荐

**推荐：路径 A（schema 加 optional marketplace_source 字段 + ADR 0005 errata）**

依据：

1. **GA-1 Recommendation L196-202** 明确：Primary Option B (Headless claude plugin install CLI) + Option C is timing，并要求 phase 1.2 plan-phase **freeze schema fields (marketplace_source)**。
2. **GA-1 L184** 要求 phase 1.2 freeze 时声明 schema accepts install.marketplace + install.marketplace_source (owner/repo, optional, omitted for official)。
3. **GA-1 Phase 1.1 manifest fix needed L246-253** 明确 schema-extension + manifest-fix coupled commit——即 A 路径。
4. **A7 守恒**：路径 A 通过 ADR 0005 errata 而非动 ADR 0001 main body 实现，与 phase 1.1 ADR 0003 errata 模式同构。

PLAN.md（L73 / L344 D1.2-8）+ task_plan.md（T1.2 / T1.3 / T1.4 / T1.5）已锁路径 A：T1.2 起草 ADR 0005 → T1.3 schema 加 optional 字段 → T1.4 修 planning-with-files manifest → T1.5 加 schema unit test（5 case：official 省略 / OthmanAdi 正确 / source=gitlab reject / repo no-slash reject / 非 cc-plugin 方法 reject）。

**路径 B（manifest yaml comment）已被 GA-1 隐式拒绝**——无 schema enforcement、phase 2.1 cc-plugin-marketplace installer 消费时仍需 retrofit schema，违背 phase 1.2 plan-phase freeze 原则。

---

## V4. Acceptance bar B1-B9 可执行性

**结论：全部可执行**（无模糊验收）。每条 bar 均有具体 bash 命令或可观察 artifact：

| Bar | 验收命令 | 类型 |
|-----|---------|------|
| B1 | harnessed install ctx7 --dry-run 3 平台无报错 | bash |
| B2 | harnessed install tavily-mcp --apply → claude mcp list 含 tavily + ~/.claude.json 不变 | bash + diff |
| B3 | harnessed install ... --apply → harnessed rollback ts → diff .mcp.json 0 差异（含 EOL） | bash + diff |
| B4 | corepack pnpm test -- --filter installer-contract 12/12 OK | bash |
| B5 | GitHub Actions UI 显示 ubuntu/macos/windows × Node 22 = 3 jobs OK | CI artifact |
| B6 | pnpm test 输出 Tests ≥ 110 passed | bash |
| B7 | git diff adr-0001-accepted -- docs/adr/0001-*.md ... 输出空 | git diff (CI enforce) |
| B8 | harnessed doctor 输出 4 个 check 行 + Win jq 缺失给 winget/scoop fix cmd | bash |
| B9 | wc -l docs/INSTALLER-CONTRACT.md ≥ 100 + grep Contract 1..6 全 hit | bash |

**关键检查**：grep 模糊词「测试通过」「代码 review」「approved」在 PLAN.md 仅出现在元数据上下文（如 ADR 0004 Accepted、plan-checker review buffer），**未作为 acceptance 判据**。pnpm typecheck && pnpm lint 0 错误 + git diff 空输出 + wc -l 阈值——全部 deterministic。

---

## V5. PATTERNS.md 17 file mappings 完整性

PATTERNS.md L196-227 列出 17 file mappings，task_plan.md sync 状态：

**6 lib helpers**：types.ts (T2.1) / spawn.ts (T2.2) / preflight.ts (T2.3) / diff.ts (T2.4) / confirm.ts (T2.5) / backup.ts (T2.6) — 全部独立 task。state.ts (T2.7) 是 PATTERNS L237「新加 lib helper（原 6 个之外）」——也已映射。

**2 install methods**：npmCli.ts (T3.1) / mcpStdioAdd.ts (T3.2) — OK；index.ts dispatch (T3.3) — OK。

**5 CLI commands**：install (T4.1) / doctor (T4.2) / audit (T4.3) / rollback + status + backup-list (T4.4 — 3 文件合并 task) — OK；顶层 wire (T5.1) — OK。

**Tests**：12 contract cell (T5.2) + 3 method unit (T5.3) + 5 cli unit (T5.4) + 5-6 lib unit (T2.8) + 3 schema unit (T1.5) — OK；总数约 28 test 文件覆盖 ≥ 130 tests。

**1 manifest fix**：planning-with-files.yaml + fixture 同步 (T1.4) — OK。

**2 docs**：INSTALLER-CONTRACT.md (T6.1) / README + CONTRIBUTING update (T6.2 + T6.3) — OK。CI 扩展 (T5.5) 与 ADR 0005 起草 (T1.2) + ADR README index 更新 (T6.4) 也已覆盖。

**全部 17 mappings sync 到 task_plan.md，无遗漏**。

---

## 必修 fix（执行前必做）

**无 BLOCKER**。Plan 已通过所有 5 个核心验证点，可直接进入 /gsd-execute-phase 1.2。

---

## 可选 fix

1. **T2.6 backup.ts 粒度**（PLAN.md L378 已自标）：120 行 + sha1 + 跨 OS eol 字段单 task 偏大。建议执行期视情况二拆为 T2.6a (basic backup 不含 eol) → T2.6b (per-file eol preservation + CRLF mitigation)，便于 small-step commit。**非阻塞**——执行期决定即可。

2. **T5.2 contract test fixture 命名一致性**：task_plan.md L583 method/contract.yaml 与 PATTERNS.md L162 method/contract.yaml 一致。建议执行期在 fixture dir 加 README.md 简述 6 contract slug 与 ADR 0004 编号映射，方便未来 phase 2.1 加 method 时快速理解。

3. **B5+B8 Windows 部分依赖 manual verification buffer**：B8 jq 缺失 fix cmd 输出依赖 Windows runner 实际无 jq 状态。建议 T4.2 doctor 写一个 mock-driven unit test（注入 which(jq) returns null）assert 输出含 winget/scoop 字样，避免「CI 上 jq 已装所以从未触发 fix-cmd 路径」的盲区。

---

## 给 execute-phase 的 callout

1. **Wave 0 是单点路径关键**：T1.2 ADR 0005 起草 → T1.3 schema 加字段 → T1.4 manifest fix → T1.5 unit test 是严格依赖链；任何一步失败立即停（不要继续 Wave 1+）。建议第一个 ralph-loop 包整个 Wave 0 为一个 milestone（4 task 合并跑），完成后立即 pnpm test + git diff adr-0001-accepted 双门禁。

2. **A7 守恒 CI step 必须 phase 1.2 第一个 commit 就加**（如 phase 1.1 已有则保留）：在 T1.2 commit 前确认 .github/workflows/ci.yml 含 git diff adr-0001-accepted -- docs/adr/0001-*.md docs/adr/0002-*.md docs/adr/0003-*.md docs/adr/0004-*.md 必须空输出的 step。Wave 0 写 ADR 0005 时此 step 自动放过（新文件不属 baseline）。

3. **Wave 4 可走 vertical slice 备案**（PR10 缓解）：如 T3.1 npmCli 卡 cross-OS bug 超 2 天，先 ship T3.2 mcpStdioAdd（B2 acceptance bar）+ index.ts 仅注册 mcp-stdio-add，npm-cli 留 phase21Placeholder——之后再补 npmCli。这样 phase 1.2 仍能 partial-ship 并验证 ADR 0004 6 契约的 6 cell（mcp-stdio 一半）。但默认走 horizontal（2 method 并行），vertical 仅作风险预案。

