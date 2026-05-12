# Phase 1.2 Verification (Reproduction Guide)

> **Purpose**：让任何 reviewer / fork 能本地复现 phase 1.2 的 9 acceptance bar (B1'-B9') 验收
> **Tag baseline**：`v0.1.0-alpha.2-installer-runtime`（local tag — 见 T6.7，main agent 决定 push）
> **Created**：2026-05-12（phase 1.2 final ship batch — Wave 7 T6.5）
> **Style**：phase-1.1 VERIFICATION.md 同款（A1-A8 复现 + finding 索引 + 下一 phase prereq）

## Prerequisites

- Node.js ≥ 22.0.0（v0.1 锁 22 LTS — `engines.node` 强制）
- Git（Windows: Git Bash 推荐 — 见 CONTRIBUTING.md "Windows Workaround"）
- 5 分钟 + 干净仓库（`git status` clean）
- (可选) `claude` CLI 已装且能 `claude mcp list`（B2' / B3' integration 才需）

## Setup

```bash
git clone <repo-url>
cd harnessed
git checkout v0.1.0-alpha.2-installer-runtime   # phase 1.2 milestone tag
corepack enable
corepack pnpm install --frozen-lockfile
```

如 Windows ACL 报错 → CONTRIBUTING.md "Windows Workaround"（F1）。

---

## 1. Acceptance Bar B1'-B9' 复现

### B1' — 3 平台真实可装 ctx7 + dry-run UX 跑通（mac/linux/win）

```bash
HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter real-spawn
# 期望：tests/integration/installer-real-spawn.test.ts 1 test pass
# 流程：tmpdir + npm_config_prefix 隔离 → runInstall(ctx7, apply:true, nonInteractive:true) → state + backup verify
```

CI 由 `.github/workflows/ci.yml` H4 dual-layer step 实测 3 平台（B5'）；本地 manual run 走单平台。real-spawn 平时由 `describe.skipIf(!HARNESSED_REAL_SPAWN)` gate 跳过，避免 CI 默认 step 装真包污染（per ASSUMPTIONS C6 + Pattern K）。

### B2' — tavily-mcp + exa-mcp 真实可装 + `--scope project` 写到 `.mcp.json`

```bash
# 在 tmpdir 项目内手工执行（real-spawn 默认仅覆盖 ctx7 npm-cli；mcp 需 claude CLI 预装）
cd $(mktemp -d) && git init
node <repo>/dist/cli.mjs install tavily-mcp --apply --non-interactive
cat .mcp.json | jq '.mcpServers.tavily'   # 期望存在
claude mcp list | grep tavily              # 期望 hit
```

`mcp-stdio-add` installer 硬编码 `--scope project`（per ADR 0004 § 5 + Contract 5）—— manifest 不能 override，规避 CC v2.1.122 user-scope bug (#54803)。

### B3' — Rollback 验证：install + rollback 后系统状态完全恢复（含 `.mcp.json` 复原 + CRLF/LF preserve）

```bash
TS=$(node <repo>/dist/cli.mjs status | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z' | head -1)
node <repo>/dist/cli.mjs rollback $TS --apply
diff <(git status --porcelain) /dev/null   # 期望：empty (working tree restored)
```

`metadata.json` per-file `eol: lf|crlf` 字段守 CRLF/LF preserve（ASSUMPTIONS C3）；ENOENT pure-create sentinel `backup: ""` 让 phantom file 走 unlink 而非 restore-empty。

### B4' — 12 contract tests 全绿（6 契约 × 2 method）✅ 已达成

```bash
corepack pnpm test -- --filter installer-contract
# 期望：tests/integration/installer-contract.test.ts 12 cell pass
# Wave 6 T5.2 commit 7769535 一次实装；mock node:child_process / @clack/prompts / node:fs/promises (C6)
```

12 cell 对应 ADR 0004 6 contract × 2 phase 1.2 实装 method (`npm-cli` + `mcp-stdio-add`)。详见 § 2 索引表。

### B5' — Cross-OS CI 三平台保持全绿（A4 守恒）⏳ ready

```bash
gh run list -R easyinplay/harnessed --limit 1
# 期望：最新 push 后 ubuntu / macos / windows × Node 22 全绿
```

CI workflow 三 step 把关：(1) typecheck/lint/test/build/bench；(2) A7 ADR 0001-0005 baseline iterate 5 tag 0 diff；(3) H4 dual-layer installer integration（mock-claude-cli.sh + `ok_or_dryrun()` 接受 exit 0/2 dry-run sentinel — Wave 6 T5.5）。

### B6' — Tests 数 ≥ 110 ✅ 当前 202 + 1 skipped

```bash
corepack pnpm test 2>&1 | tail -5
# 期望：Test Files 28 passed | 1 skipped (29) / Tests 202 passed | 1 skipped (203)
# 89 baseline (phase 1.1.1) → 202 (+113)
```

新增分布：Wave 0 +5（marketplace_source schema cells）/ Wave 3 +56（6 lib unit）/ Wave 6 +52（12 contract + 19 method + 21 cli unit）+ 1 skipped real-spawn skipIf gate。

### B7' — ADR 0001/0002/0003/0004 main body 不动（A7 守恒）✅

```bash
for n in 0001 0002 0003 0004 0005; do
  echo "--- ADR $n ---"
  git diff adr-$n-accepted -- docs/adr/$n-*.md
done
# 期望：5 段空 diff
```

5 个 baseline tag (`adr-0001-accepted` / 0002 / 0003 / 0004 / 0005) 由 Wave 0 T1.2 H5 hardening 全部就位（F26 finding 触发 0002 retroactive tag 补齐）；CI workflow A7 step iterate 5 tag——任一 main body 字符 diff 立即 fail。

### B8' — `harnessed doctor` 检测 ralph-loop Win 依赖（jq + Git Bash vs WSL）

```bash
node ./dist/cli.mjs doctor
# 期望：4 check 输出
# - Node version: ≥22 ✓
# - MCP scope: project .mcp.json + ~/.claude.json mcpServers empty
# - jq present: where jq 找到 (Win: winget install jqlang.jq; Mac: brew install jq; Linux: apt install jq)
# - Win bash flavor: WSL_DISTRO_NAME 探测 / Git Bash fallback
```

Pattern I auto-glob 风格；C4 mitigation (PATH 顺序 / WSL_DISTRO_NAME probe — F25 预测 finding 实装到位)；CONTRIBUTING.md "How to add a doctor check" 是新加 check 的 step-by-step。

### B9' — `INSTALLER-CONTRACT.md` ≥ 100 行 + 6 契约逐条说明 + FAQ ✅

```bash
wc -l docs/INSTALLER-CONTRACT.md           # 期望 ≥ 100 (实装 182)
grep -c "^### Contract [1-6]" docs/INSTALLER-CONTRACT.md   # 期望 6
grep "^**Q[1-6]" docs/INSTALLER-CONTRACT.md | wc -l         # 期望 ≥ 5 (实装 6)
```

Wave 7 T6.1 一次实装；含 § Why / § 6 Contracts / § Level System / § Error Reference / § FAQ 五大节。

---

## 2. 12 Contract Test 索引（method × contract）

| Contract | npm-cli cell | mcp-stdio-add cell |
|----------|--------------|---------------------|
| 1 — Dry-Run Default + Explicit Apply | `npm-cli C1: dry-run mode does not spawn install` | `mcp-stdio-add C1: dry-run mode does not spawn claude mcp add` |
| 2 — Diff Preview Format | `npm-cli C2: renderDiff produces unified diff with summary` | `mcp-stdio-add C2: renderDiff produces unified diff for .mcp.json` |
| 3 — Rollback Backup Location + Schema | `npm-cli C3: backup creates .harnessed-backup/<ts>/ with metadata.json` | `mcp-stdio-add C3: backup includes per-file eol field` |
| 4 — 4-Level Confirm | `npm-cli C4: levelOf(npm-cli) returns L1/L4 based on global flag` | `mcp-stdio-add C4: levelOf(mcp-stdio-add) returns L3` |
| 5 — MCP CLI-Only | `npm-cli C5: skip (not applicable)` | `mcp-stdio-add C5: spawn args contains --scope project hardcoded` |
| 6 — No Silent Failures | `npm-cli C6: install-failed returns InstallError with suggest` | `mcp-stdio-add C6: verify-failed returns InstallError with suggest` |

**Test file**：`tests/integration/installer-contract.test.ts`（Wave 6 T5.2 commit 7769535；inline manifest factory 替代 yaml fixtures，B/M-style）
**Mock 模型**：`vi.mock('node:child_process')` + `vi.mock('@clack/prompts')` + `vi.mock('node:fs/promises')` — C6 zero real IO mitigation
**Cross-ref**：ADR 0004 contract 1-6 + `src/installers/{npmCli,mcpStdioAdd,index}.ts`

---

## 3. Phase 1.3 Prerequisites

下一阶段（v0.1 phase 1.3 — DAG resolver + harnessed-router 引擎 + setup 完整版）依赖以下契约：

1. **`runInstall(manifest, opts)` 公共 API**（`src/installers/index.ts` Pattern G barrel） — phase 1.3 DAG resolver 拿到 manifest 树后单 caller，无 wrap 层
2. **`InstallResult` discriminated union shape** — `{ ok: true | false; phase; backupId?; appliedFiles?; error? }` 三分支 narrow（cli/install.ts 已 reference 实装）
3. **`levelOf(method)` Level seed** — phase 1.3 routing engine 拿 manifest 时直接 import 推断 Level，不 reimplement
4. **`.harnessed/state.json` SSOT schema**（`src/installers/lib/state.ts` `readState/writeState/updateInstalled`）— phase 1.3 routing engine 加 `.harnessed/checkpoints.json` 时复用 atomic write-then-rename 模式
5. **`InstallError.keyword` 错误库**（types.ts）— phase 1.3 routing engine 错误统一映射，不新建 error class
6. **`backup.ts` ENOENT pure-create sentinel** — phase 1.3 routing engine 若做 manifest patch / config merge 时尊重 `backup: ""` → unlink 语义
7. **`spawn.ts` cross-OS spawn helper** + B1 二次 security check (`checkCmdString`) — phase 1.3 routing engine 调任意 cmd 时复用
8. **5 baseline tag (`adr-0001/0002/0003/0004/0005-accepted`)** — phase 1.3 起 ADR 0001-0005 main body 永久守恒；新 schema errata 走 ADR 0006+

```bash
# Phase 1.3 入口验证
git clone <repo-url> harnessed-repro && cd harnessed-repro
git checkout v0.1.0-alpha.2-installer-runtime
corepack enable && corepack pnpm install --frozen-lockfile
corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test \
  && corepack pnpm build && corepack pnpm build:schema \
  && corepack pnpm validate:schema && corepack pnpm bench \
  && node ./dist/cli.mjs --version && node ./dist/cli.mjs --help
# 全绿 = phase 1.2 复现成功 + phase 1.3 prereq ready
```

---

## 4. Findings 索引（F23-F31）

完整 finding narratives 见 [progress.md § B](./progress.md#section-b--findings--decision-log)。

| ID | 主题 | Resolution | Cross-ref |
|----|------|-----------|-----------|
| F23 | ADR 0005 marketplace_source schema errata 起草决策 | ✅ Wave 0 T1.2 commit 8950ff3 (predicted=executed) | progress.md § B.3 + ADR 0005 |
| F24 | Cross-OS CI installer integration 第一次跑（B5' 实证）| ⏳ Wave 6 T5.5 commit 91ebe93 ready；main agent push 验证 | ci.yml H4 dual-layer + mock-claude-cli.sh |
| F25 | Win Git Bash vs WSL bash detection 边界（doctor checkWinBash）| ✅ Wave 5 T4.2 commit e60f0f1 (WSL_DISTRO_NAME probe + where bash 双 step) | src/cli/doctor.ts checkWinBash |
| F26 | ADR 0002 baseline tag 漏列（H5 hardening）| ✅ Wave 0 T1.2 retroactive `git tag adr-0002-accepted d5589dd` | 5 baseline tag iterate fixed |
| F27 | spawn.ts 二次 security check 需 string-level helper | ✅ Wave 2 T2.2 commit 355654b (security.ts +`checkCmdString` export) | F27 ⨯ phase-1.3 教训："跨 phase 复用前必看签名" |
| F28 | diff.ts renderDiff 签名改 (plan, ctx) — fullDiff 不在 plan 里 | ✅ Wave 2 T2.4 commit e1f16b0 (signature 改 ctx 参数) | F28 ⨯ phase-1.3 教训："helper signature 必含所有内部依赖" |
| F29 | spawn.test.ts SpawnOk × InstallResult ok:true 重叠 narrow 失败 | ✅ Wave 3 T2.8 commit f6e36ca (test-内部 type guard helper) | F29 ⨯ phase-2.1 教训：types.ts 加 `kind` discriminator field |
| F30 | npmCli.ts 135L 超 80L 软上限（biome formatter 展开）| ✅ 接受非 logic 膨胀；A7/A8 全绿 | task_plan 估行公式更新（lib/cli ≤ 80L 改为"非空逻辑行 ≤ 80"）|
| F31 | Wave 5 cli/* 4 文件软上限集体超出（multi-check + commander nesting + M1 gc 真实成本）| ✅ 接受 (typecheck/lint/test/A7 全绿)；commit 7 register fn (含 gc) | F31 followup 1 ✅ Wave 6 T5.1 wire 7 fn / followup 2 ✅ deferred 表 strikethrough |

**Predicted but not realized（happy path）**：F24（CI 实测 ⏳ awaiting push）。

**Cross-phase 经验**（phase 1.3 沿用）：见 progress.md § B.6 Wave 0-6 retro 段（每 wave 1-3 段 retrospective）。

---

## 5. Known Issues + Deferred Items

### Phase 1.2 deferred（与 PLAN § 4.2 + task_plan.md L890+ 一致）

| 项 | 推到 | 理由 |
|----|------|------|
| `cc-plugin-marketplace` installer 实装代码 | phase 2.1 | GA-1 Recommendation Option C timing；ROADMAP 一致 |
| `git-clone-with-setup` installer 实装 | phase 2.1 | 同上 |
| `npx-skill-installer` installer 实装 | phase 2.1 | 同上 |
| `mcp-http-add` installer 实装 | phase 2.x | 无真实上游 demo |
| karpathy CLAUDE.md merge 引擎 | phase 2.2 | B5 候选 2；ROADMAP Phase 2.2 已显式列 |
| research workflow 端到端 | phase 1.4 | phase 1.2 仅备 install 三 deps |
| 6 月 stale upstream check | phase 2.4 | doctor 4-check baseline 不含 staleness |
| `--force` flag for idempotent_check | phase 2.1+ | 当前 already-installed = exit 0 + skip |

### Wave 5/6 retro 沉淀的 phase 1.3+ 教训

- **CLI 文件软上限公式**：`commander 简单 register × 30L base + 每 cross-OS branch +20L + 每 nested sub-command +15L + 每 helper fn +20L`；M1-class 任务（含真实 fs / network / 跨平台 logic 的 mitigation）软上限 × 4 plan estimate（per F31）
- **Helper signature 完整性**：plan-with-files 写 helper signature 时，所有内部步骤引用的字段必须出现在签名 typeparam 中（per F28）
- **Discriminated Result type**：多个 ok:true 变体必须加显式 `kind` discriminator 字段，避免消费方 narrow 失败（per F29）
- **跨 phase 复用现有函数**：必须 `grep "^export.*<fnName>"` 确认实际签名，特别是 phase-1.1.1 hotfix 重写的函数（per Wave 6 retro）
- **长 task agent socket-close**：每 task 完成立即 commit（不要 batch commit 多 task），写 helper 时如发现首选 path 不通要"完整删除回退"不留 `void` workaround（per Wave 4 retro）
- **biome format 习惯**：每文件 commit 前一次 `biome check --write` format pass，零 lint round-trip（per Wave 4-5 共识）

### Auto-fixed during phase 1.2

- F26 ADR 0002 baseline tag retroactive 补齐（H5 hardening 完整化）
- F27 security.ts `checkCmdString` helper 加（surgical add 不动 `checkSecurityViolations`）
- F31 followup 1：Wave 6 T5.1 cli.ts wire **7 个** register fn（task_plan 列 6 — 多 registerGc）
- F31 followup 2：task_plan.md L906 deferred 表格 "harnessed gc → phase 2.4" 行 strikethrough（gc 实装在 phase 1.2）

---

## See Also

- [.planning/phase-1.2/PLAN.md](./PLAN.md) — Phase 1.2 PLAN（339L）
- [.planning/phase-1.2/task_plan.md](./task_plan.md) — Atomic task list（33 task ID, 37 atomic 子任务）
- [.planning/phase-1.2/progress.md](./progress.md) — § A 进度日志 + § B Findings + § B.6 Wave retro + § C audit snapshots
- [.planning/phase-1.1/VERIFICATION.md](../phase-1.1/VERIFICATION.md) — Phase 1.1 复现指南（A1-A8 + F1-F22）
- [docs/INSTALLER-CONTRACT.md](../../docs/INSTALLER-CONTRACT.md) — Phase 1.2 用户视角契约（B9'）
- [docs/adr/0004](../../docs/adr/0004-installer-dry-run-diff-preview-contract.md) — UX 契约起源 ADR
- [docs/adr/0005](../../docs/adr/0005-marketplace-source-schema-errata.md) — Schema errata
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — CI 三平台 + A7 iterate 5 tag + H4 installer integration step
