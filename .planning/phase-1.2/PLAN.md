---
phase: 1.2-installer-runtime-+-cli-skeleton
milestone: v0.1.0
type: execute
status: ready-for-execute
created: 2026-05-12
dependencies: [phase-1.1, phase-1.1.1-hotfix]
unblocks: [phase-1.3-dag-resolver-+-doctor-extension, phase-1.4-research-workflow, phase-2.1-remaining-4-installers]
authority_documents:
  - PROJECT-SPEC.md (v2.1, § 5.5 / 8.3 / 8.4 / 11)
  - WORKFLOWS-MVP.md (v2.1)
  - .planning/ROADMAP.md (v0.1.0 Phase 1.2 章节)
  - .planning/REQUIREMENTS.md (R2.1 / R2.2 partial / R3.2 / R3.3 / R4.4 / R5.1 / R5.2 / R9.3)
  - docs/adr/0001-manifest-schema-v1.md (Accepted, main body 守恒)
  - docs/adr/0002-repo-structure-toolchain-v0.1.md (Accepted, main body 守恒)
  - docs/adr/0003-install-method-count-errata.md (Accepted)
  - docs/adr/0004-installer-dry-run-diff-preview-contract.md (Accepted, 6 硬契约)
  - .planning/phase-1.2/ASSUMPTIONS.md (A1-A8 锁 / B1-B7 / C1-C6)
  - .planning/phase-1.2/GRAY-AREA-1-cc-plugin-headless.md (Option B + C 决议)
  - .planning/phase-1.2/GRAY-AREA-2-installer-abstraction.md (A3 + picocolors + jsdiff + @clack/prompts)
  - .planning/phase-1.2/PATTERNS.md (17 file mappings + 7-wave topology + 6 reuse decisions)
requirements_addressed:
  - R2.1   # harnessed setup 启动自检（dry-run + .harnessed-backup/ rollback；npx@latest 提示推到 phase 1.3）
  - R2.2   # harnessed doctor 骨架（Node ≥ 22 / MCP scope / jq / Win bash — B4 候选 1 最小 4 项；6 月 stale + weekly cron 推 phase 2.4）
  - R3.2   # MCP installer 强制 --scope project（避开 user-scope bug）
  - R3.3   # Windows native cmd /c wrapper for npx
  - R4.4   # hook 配置数据化（本 phase 不装 hook，但 spawn.ts 不允许任意 shell — B1 二次 security check）
  - R5.1   # cross-OS CI 矩阵（沿用 phase 1.1 ci.yml + 加 installer integration test job）
  - R5.2   # npx 跨平台 wrapper
  - R9.3   # install dry-run + diff + explicit confirm + ADR 0004 6 契约
acceptance_high_level:
  - 3 平台真实可装 ctx7（npm-cli L4 / L1 npx fallback）+ tavily-mcp + exa-mcp（mcp-stdio-add L3 强制 --scope project），全部 idempotent + dry-run + rollback
  - ADR 0004 6 契约 × 2 method = 12 contract tests 全绿
  - tests 89 → ≥ 110（+12 contract / +~10 install unit / +~5 doctor+audit unit）
  - ADR 0001/0002 main body 守恒（A7 不变）；schema 字段缺口 → ADR 0005 errata
  - Cross-OS CI 三平台保持全绿（A4 沿袭）
  - harnessed doctor 在 Windows 上正确报告 Git Bash vs WSL；harnessed audit 检测 git origin URL 篡改
  - docs/INSTALLER-CONTRACT.md ≥ 100 行 + 6 契约逐条说明 + FAQ
---

# Phase 1.2 PLAN — cli-npm + mcp-stdio installer + setup/doctor/audit/rollback 骨架

> 视角：GSD（项目经理 / phase-level orchestration）
> 范围：v0.1.0 第 2 个 phase（4 之 2），phase 1.3 (DAG resolver) 与 phase 2.1 (剩余 4 method) 的入口前置
> 完成定义：`task_plan.md` 全部 task ✅ + acceptance bar B1'-B9' 全绿 + STATE.md 标记 phase 1.2 completed

---

## 1. Phase 元数据

| 字段 | 值 |
|------|----|
| Phase ID | 1.2 |
| Phase 名称 | cli-npm + mcp-stdio installer 实装 + setup/doctor/audit/rollback 命令骨架 |
| 所属里程碑 | v0.1.0（manifest 引擎 + research workflow 入口） |
| 周期估算 | 2-3 周（37 atomic 子任务 × 平均 ~25 min + 7 wave checkpoint） |
| 依赖前置 phase | 1.1（schema v1 frozen + B1 security gate）+ 1.1.1 hotfix（git_ref pattern + signed_by）|
| 后续解锁 phase | 1.3（DAG resolver / harnessed-router）、1.4（research workflow）、2.1（剩 4 method） |
| ADR 落地 | **0005 marketplace_source schema errata**（条件性 — Wave 0 决策；ADR 0001 main body 不动） |
| Decision boundary | B1-B7 + GA-1/2/3 全部锁定，本 phase 不再 reopen |

---

## 2. 任务图（Task Graph — 7 wave 拓扑）

> 详细子任务（37 atomic）见 `task_plan.md`。本节仅给 wave-level overview + analog + acceptance。

### Wave 0 — 前置（依赖修复 + 必修 manifest + 条件 ADR）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T1.1** | 加 3 个 deferred deps（picocolors / diff / @clack/prompts）+ pnpm install | `package.json` deps 块 + `pnpm-lock.yaml` | phase-1.1 F5 deferred deps add | GA-2 § B + ADR 0002 |
| **T1.2** | 起草 ADR 0005 errata（marketplace_source schema 加 optional 字段）+ accept | `docs/adr/0005-marketplace-source-schema-errata.md` + `docs/adr/README.md` index 更新 | phase-1.1 ADR 0003 errata 风格 | GA-1 § "Phase 1.1 manifest fix needed" + A7 守恒（不动 ADR 0001 main body） |
| **T1.3** | schema 实装：`ccPluginMarketplace.ts` 加 optional `marketplace_source: { source: 'github', repo: pattern }` 字段（**纯 schema 层**，phase 1.2 不实装 cc-plugin-marketplace installer 代码 — 仅修字段供 phase 2.1 消费）+ 重新 build:schema | `src/manifest/schema/installMethods/ccPluginMarketplace.ts` + `schemas/manifest.v1.schema.json` 重新生成 | phase-1.1 T3.4 schema pattern | ADR 0005 errata + GA-1 § "schema-extension and manifest-fix coupled commit" |
| **T1.4** | 修复 `manifests/skill-packs/planning-with-files.yaml` 加 `marketplace_source: { source: github, repo: "OthmanAdi/planning-with-files" }` + 同步 fixture | manifest + fixture | phase-1.1.1 H4 manifest+fixture 同步 | GA-1 § "planning-with-files: NOT in claude-plugins-official" |
| **T1.5** | 加 schema unit test（≥ 3 tests：official 上游 omit / OthmanAdi 写正确 / source: 'gitlab' 非 github reject）| `tests/unit/manifest-validate.marketplace-source.test.ts` | phase-1.1 manifest-validate.discriminator.test.ts BASE template + with* | Pattern J + GA-1 |

**Wave 0 验收**: pnpm typecheck/lint/test/build 全绿；ADR 0001 main body 0 字节修改（A7 验收）；planning-with-files manifest 通过 strict 校验；deps 已装；tests 89 → ≥ 92。

---

### Wave 1 — Lib helpers L0 类型基座（无依赖）

| Task ID | 名称 | 输出 | Analog (PATTERNS § 二) | 决策来源 |
|---------|------|------|------------------------|---------|
| **T2.1** | 写 `src/installers/lib/types.ts` — InstallContext / InstallResult / InstallError extends ValidationError / Level union | ~50 行 | F (re-export) + C (Result discriminator) + E (extend ValidationError) | GA-2 § Sub-issue A 骨架 + PATTERNS D-1 |

**Wave 1 验收**: `pnpm typecheck` 0 错误；`InstallContext / InstallResult / Level` 类型可在 phase 1.2 其它文件 import。

---

### Wave 2 — Lib helpers L1（5 个并行 — 无相互依赖）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T2.2** | 写 `src/installers/lib/spawn.ts` — Win cmd.exe vs sh + B1 二次 security check + timeout | ~90 行 | D (pre-pass) + Pattern H (IMPL NOTE: R03 § 3.7) | GA-2 § A4 跨 OS 红旗 3 + ADR 0004 契约 6 |
| **T2.3** | 写 `src/installers/lib/preflight.ts` — platform / git_ref valid / npm_version 字段 shape 检查 | ~80 行 | D (pre-pass) + C (errors[]) | A6 + ASSUMPTIONS B |
| **T2.4** | 写 `src/installers/lib/diff.ts` — jsdiff `createPatch({ stripTrailingCr: true })` + picocolors `isColorSupported` + 200L 折叠 | ~60 行 | B (lazy module-level) + Pattern H (IMPL NOTE: C3 CRLF + nodejs/node#39673) | ADR 0004 契约 2 + GA-2 § B.1 + B.2 |
| **T2.5** | 写 `src/installers/lib/confirm.ts` — Clack 4-level + isCancel 守卫 + isColorSupported 协调 | ~70 行 | C (Result) + Pattern H | ADR 0004 契约 4 + GA-2 § B.3 |
| **T2.6** | 写 `src/installers/lib/backup.ts` — ISO-ts dir + metadata.json + sha1 + **per-file eol 字段 (CRLF mitigation C3)** | ~120 行 | C + B (lazy timestamp) + Pattern H (CRLF) | ADR 0004 契约 3 + ASSUMPTIONS C3 |

**Wave 2 验收**: 5 helper 文件创建；`pnpm typecheck && pnpm lint && pnpm test` 全绿；每 helper 文件顶部含 IMPL NOTE 注释引用 finding 编号。

---

### Wave 3 — Lib helpers L2 + State（依赖 Wave 2）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T2.7** | 写 `src/installers/lib/state.ts` — `.harnessed/state.json` schema + 读写 + atomic update | ~50 行 | A (TypeBox lite — plain interface) + C (Result) | ASSUMPTIONS B7 候选 1 + ADR 0004 契约 6（partial install 状态） |
| **T2.8** | 写 5-6 helper 的 unit test（preflight / diff / confirm / backup / spawn / state — mock @clack/prompts + child_process + fs）| `tests/unit/installers-lib-*.test.ts` 5-6 文件 | I (auto-glob) + J (BASE + with* modifier) | PATTERNS D-5 + ASSUMPTIONS C6 mitigation（vi.mock 隔离）|

**Wave 3 验收**: tests 92 → ≥ 102；helper 互相 import 无循环依赖；mock-driven unit tests 不真 spawn / 不真写文件。

---

### Wave 4 — Install methods（2 个并行；依赖 Wave 1+2+3）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T3.1** | 写 `src/installers/npmCli.ts` — Level: L4 if global / L1 if npx fallback；调 `preflight → planDryRun → renderDiff → confirmAt → backup → spawnCmd → verify`；用户拒 L4 → 自动降级 L1 + 显式告知（B3 候选 1）| ~50 行 | C + 调用 lib/* helpers | ADR 0004 契约 1+2+3+4+6 + ASSUMPTIONS B3 + GA-2 骨架 |
| **T3.2** | 写 `src/installers/mcpStdioAdd.ts` — Level: L3；**不调通用 spawn.ts**，直接 spawn `claude mcp add --scope project --transport stdio NAME -- npx ...`；idempotent_check 走 `claude mcp list \| grep -q NAME`（**仅 exit code，不解析 stdout** — C2 mitigation）| ~50 行 | C + Pattern H (IMPL NOTE: CC #54803 user-scope bug) | ADR 0004 契约 5 + ASSUMPTIONS C2 + R3.2 |
| **T3.3** | 写 `src/installers/index.ts` — 2-method dispatch table + `runInstall(manifest, opts)` orchestrator；其余 4 method `() => { throw new Error('not yet implemented in phase 1.2 — see phase 2.1') }` placeholder | ~40 行 | G (barrel) + GA-2 骨架 | PATTERNS § 二 + ASSUMPTIONS B6 |

**Wave 4 验收**: 2 method 文件 + dispatch index；`runInstall(manifest, { dryRun: true })` 对 ctx7 fixture 不报错（mock spawn）；其余 4 method 调用抛 explicit error。

---

### Wave 5 — CLI subcommands（4-5 个并行；依赖 Wave 4）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T4.1** | 写 `src/cli/install.ts` — commander subcommand + flags `--apply` `--dry-run` `--system` `--non-interactive` `--full-diff` `--no-color`；narrow InstallResult → exit code (ok=0 / aborted=2 / error=1) | ~80 行 | C + Pattern H (IMPL NOTE: ADR 0004 双 flag --non-interactive --apply) | ADR 0004 契约 1 + GA-2 § B.1 |
| **T4.2** | 写 `src/cli/doctor.ts` — 4 项最小 check：(a) Node ≥ 22；(b) MCP scope（解析 .mcp.json 存在 & 不在 ~/.claude.json）；(c) jq 存在；(d) Win bash 路径（Git Bash vs WSL — 用 `spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'])` 判别 — C4 mitigation）| ~80 行 | C + I (fixture-driven check list) | ASSUMPTIONS B4 候选 1 + C4 mitigation + R2.2 + R5.3 ralph-loop Win fix 骨架 |
| **T4.3** | 写 `src/cli/audit.ts` — 10 上游（manifests/{tools,skill-packs}/*.yaml）→ parse → 比对 `metadata.upstream.repository`；本 phase 仅做 **manifest 内自一致校验**（已 install 副本的 git origin 比对推到 phase 2.4 真 audit）| ~60 行 | C + I (auto-glob manifests/) | ASSUMPTIONS B4 候选 1 + R2.3 (skeleton) |
| **T4.4** | 写 `src/cli/rollback.ts` + `src/cli/status.ts` + `src/cli/backup-list.ts`（gc --older-than 推 phase 2.4） | ~100 行（3 文件） | C + B (lazy load metadata.json + sha1) + Pattern H (CRLF eol preservation) | ADR 0004 § 3 + ASSUMPTIONS C3 |

**Wave 5 验收**: 5 子命令文件（install + doctor + audit + rollback + status；backup-list 与 rollback 同文件或独立）；commander route 注册到 cli root（Wave 6 wire 时验证）。

---

### Wave 6 — 顶层 wire + Tests + Cross-OS CI 扩展（依赖 Wave 5）

| Task ID | 名称 | 输出 | Analog | 决策来源 |
|---------|------|------|--------|---------|
| **T5.1** | 改 `src/cli.ts` 顶层 — 把 5 个子命令挂载到 commander root；--help 显示 dry-run-default 行为（ADR 0004 契约 1 用户文档要求）| ~30 行 | phase 1.1 src/cli.ts skeleton 扩展 | ADR 0004 § Compliance |
| **T5.2** | 写 `tests/integration/installer-contract.test.ts` — 6 contract × 2 method = **12 cell** matrix；`vi.mock('child_process')` 隔离；fixtures `tests/fixtures/installers/<method>/<contract>.yaml` | ~250 行 | I (auto-glob) + J (BASE + modifier) | ADR 0004 § Compliance + PATTERNS § 4.1 + ASSUMPTIONS C6 mitigation |
| **T5.3** | 写 `tests/unit/installers-{npmCli,mcpStdioAdd,index}.test.ts` — BASE manifest + with* modifier + vi.mock spawn + assert InstallResult shape | ~150 行（3 文件） | J + C | PATTERNS D-5 |
| **T5.4** | 写 `tests/unit/cli-{install,doctor,audit,rollback,status}.test.ts` — commander parse + InstallResult narrow + exit code assertion；mock CLI inputs | ~150 行（5 文件） | J + C | PATTERNS § 4.1 |
| **T5.5** | 扩展 `.github/workflows/ci.yml` — 加 installer integration step（real spawn ctx7 + tavily / exa **--dry-run only**；用 tmpdir + `npm_config_prefix` 隔离 — C6 mitigation）| ci.yml +~15L | phase-1.1 ci.yml | A5 + ASSUMPTIONS C6 + R5.1 |
| **T5.6** | （可选）`it.skipIf(!CI && !ACCEPTANCE)` final 真 spawn run — 仅 phase 1.2 final acceptance + CI 周期跑（可推到 wave 7 acceptance）| `tests/integration/installer-real-spawn.test.ts` | K (perf threshold gate skipIf 风格) | ASSUMPTIONS C6 |

**Wave 6 验收**: tests 102 → ≥ 110；3 平台 CI 全绿（installer integration step 含 dry-run real spawn）；contract test 12 cell 全绿。

---

### Wave 7 — Docs + Phase verify（依赖 Wave 6）

| Task ID | 名称 | 输出 | 决策来源 |
|---------|------|------|---------|
| **T6.1** | 写 `docs/INSTALLER-CONTRACT.md` ≥ 100 行 — 6 契约逐条用户视角说明 + 错误信息库 + FAQ "dry-run 怎么 disable" → `--non-interactive --apply` 双 flag | ADR 0004 § Compliance "用户文档" |
| **T6.2** | 更新 `README.md` — 加 `harnessed install` quick start 段落 + `--apply` / `--non-interactive` flag 文档 + 链接 INSTALLER-CONTRACT.md | ADR 0004 § Compliance |
| **T6.3** | 更新 `CONTRIBUTING.md` — 加 doctor 部分（如何加新 doctor check）+ ADR 0005 errata 写作背景 | phase-1.1 CONTRIBUTING.md 风格 |
| **T6.4** | 更新 `docs/adr/README.md` — 加 0004 + 0005（条件） index | R8.4 占位 |
| **T6.5** | 写 `.planning/phase-1.2/VERIFICATION.md` — B1'-B9' 复现命令清单 + 12 contract test 索引 + F23+ finding 索引 | phase-1.1 VERIFICATION.md 风格 |
| **T6.6** | 更新 `.planning/STATE.md` — phase 1.2 completed + unblocks 列表 + key findings 引用 | GSD 标准 |
| **T6.7** | （可选）git tag `v0.1.0-alpha.2-installer-runtime` — 标 phase 1.2 milestone | phase-1.1 tag 风格 |

**Wave 7 验收**: INSTALLER-CONTRACT.md ≥ 100 行；README quick start 含 `harnessed install` 例子；STATE.md phase 1.2 段落完整；B1'-B9' 全 ✅。

---

## 3. 依赖图（ASCII）

```
                    ┌──────────────────────────────────────────────┐
                    │                Phase 1.2                     │
                    └──────────────────────────────────────────────┘

Wave 0 (前置 — 必修)
T1.1 deps add ─┐
               ├─> T1.2 ADR 0005 draft (条件性 — 选 schema 加字段路径)
               │       │
               │       ▼
               │   T1.3 ccPluginMarketplace schema add marketplace_source
               │       │
               │       ▼
               │   T1.4 planning-with-files manifest fix
               │       │
               │       ▼
               │   T1.5 schema unit test
               ▼
Wave 1 (类型基座)
T2.1 lib/types.ts ──┐
                    │
                    ▼
Wave 2 (5 helpers 并行)
T2.2 spawn ──┬──> T2.3 preflight (并行)
             ├──> T2.4 diff (并行)
             ├──> T2.5 confirm (并行)
             └──> T2.6 backup (并行)
                    │
                    ▼
Wave 3 (state + unit tests)
T2.7 state.ts ──> T2.8 lib/* unit tests (5-6 files)
                    │
                    ▼
Wave 4 (2 method 并行)
T3.1 npmCli ──┬──> T3.3 dispatcher index.ts
T3.2 mcpStdio─┘
                    │
                    ▼
Wave 5 (CLI 4-5 个并行)
T4.1 install ──┬──> [4 子命令并行]
T4.2 doctor ───┤
T4.3 audit ────┤
T4.4 rollback/status ┘
                    │
                    ▼
Wave 6 (wire + tests + CI)
T5.1 cli.ts root wire ──> T5.2 contract test (12 cell)
                          T5.3 method unit tests
                          T5.4 cli unit tests
                          T5.5 ci.yml installer integration step
                          T5.6 real-spawn skipIf gate (acceptance only)
                    │
                    ▼
Wave 7 (Docs + verify)
T6.1 INSTALLER-CONTRACT.md ──> T6.2-T6.4 README/CONTRIBUTING/ADR README
                              T6.5 VERIFICATION.md
                              T6.6 STATE.md
                              T6.7 tag (optional)

并行机会（max parallelism）:
  - Wave 0: T1.4+T1.5 与 T1.3 串行（schema → manifest → test 是依赖链；T1.1 deps add 与 T1.2 ADR draft 可并行）
  - Wave 2: T2.2-T2.6 5 个 helper 完全独立 (5 路并行)
  - Wave 3: T2.7 state.ts 独立；T2.8 5-6 个 lib unit test 6 路并行
  - Wave 4: T3.1+T3.2 2 method 独立 (2 路并行)
  - Wave 5: T4.1-T4.4 4-5 路并行
  - Wave 6: T5.2-T5.4 3 类 test 独立；T5.5 ci.yml 与 T5.2-T5.4 完全并行；T5.1 cli.ts wire 必须先于 T5.4 cli test
  - Wave 7: T6.1-T6.6 全部独立 6 路并行

关键路径 (critical path):
  T1.1 deps -> T1.3 schema -> T2.1 types -> T2.6 backup (最长 helper) -> T2.7 state ->
  T3.1 npmCli -> T3.3 index -> T5.1 cli wire -> T5.2 contract test -> T5.5 CI -> T6.5 VERIFICATION -> T6.6 STATE.md

预计关键路径长度: ~12 步 sequential
预计实际工时: 2-3 周（含 cross-OS CI 红 -> 修循环 + plan-checker / paranoid review buffer）
```

---

## 4. 验收标准（Goal-Backward — Acceptance Bar B1'-B9'）

### 4.1 Phase 级硬验收（必须全部 ✅ 才算 phase 1.2 done）

| Bar | 验收命令 / 检查 | 来源 |
|-----|---------------|------|
| **B1'** ctx7 真实可装 + dry-run UX 跑通 (mac/linux/win) | 手工 / CI 跑 `harnessed install ctx7 --dry-run` 输出 unified diff + summary + L4 prompt（global）/ L1 教学（npx fallback）；3 平台无报错 | ROADMAP Phase 1.2 must-have + ADR 0004 契约 1+2+4 |
| **B2'** tavily-mcp + exa-mcp 真实可装 + `--scope project` 写到 .mcp.json | 手工 / CI 跑 `harnessed install tavily-mcp --apply` → `.mcp.json` 含 tavily 条目；`claude mcp list` 含 tavily；`~/.claude.json` 不被改 | R3.2 + ADR 0004 契约 5 |
| **B3'** Rollback 验证 — install + rollback 后系统状态完全恢复（含 .mcp.json 复原 + CRLF/LF preserve） | 跑 `harnessed install tavily-mcp --apply` → `harnessed rollback <ts>` → `claude mcp list` 不含 tavily；diff `.mcp.json` 与 install 前 0 行差异（含 EOL）| ADR 0004 契约 3 + ASSUMPTIONS C3 |
| **B4'** 12 contract tests 全绿（6 契约 × 2 method）| `pnpm test -- --filter installer-contract` 输出 12/12 ✅ | ADR 0004 § Compliance |
| **B5'** Cross-OS CI 三平台保持全绿（A4 守恒）| GitHub Actions UI 显示 ubuntu/macos/windows × Node 22 = 3 jobs 全 ✅ + 含 installer integration step | R5.1 + A4 acceptance bar 沿袭 |
| **B6'** Tests 数 ≥ 110（89 baseline + 12 contract + ~10 install unit + ~5 doctor/audit unit + ~3 schema marketplace_source）| `pnpm test` 输出 "Tests: ≥ 110 passed" | C6 + B6（phase 1.1 acceptance bar 风格延续）|
| **B7'** ADR 0001/0002/0003/0004 main body 不动（A7 守恒，CI 自动 enforce）| `git diff adr-0001-accepted -- docs/adr/0001-*.md docs/adr/0002-*.md docs/adr/0003-*.md docs/adr/0004-*.md` 输出空（ADR 0005 是新文件，不影响 baseline）| ADR 0001 § "字段冻结" + phase-1.1 A7 step |
| **B8'** `harnessed doctor` 检测 ralph-loop Windows 依赖（jq + Git Bash 而非 WSL）| 跑 `harnessed doctor` → 输出含 4 个 check 行；Windows 上 jq 缺失 → 输出可复制粘贴的 winget/scoop 修复命令；WSL bash 检测到时显式提示 | R5.3 (skeleton) + ASSUMPTIONS C4 |
| **B9'** `INSTALLER-CONTRACT.md` ≥ 100 行 + 6 契约逐条说明 + FAQ | `wc -l docs/INSTALLER-CONTRACT.md` ≥ 100；grep "Contract 1" / ... / "Contract 6" 全部 hit | ADR 0004 § Compliance "用户文档" |

### 4.2 Out-of-Scope（明确不做 — 防 scope creep；ASSUMPTIONS § 6.3 + GA-1 § Recommendation 已定）

- ❌ **cc-plugin-marketplace installer 实装代码** → phase 2.1（GA-1 § Recommendation Option C timing；ROADMAP 一致；schema 字段已 phase 1.2 Wave 0 reserve）
- ❌ **git-clone-with-setup installer 实装** → phase 2.1
- ❌ **npx-skill-installer installer 实装** → phase 2.1
- ❌ **mcp-http-add installer 实装** → phase 2.x（无真实上游 demo）
- ❌ **karpathy-skills CLAUDE.md merge 引擎** → phase 2.2（B5 候选 2 — ROADMAP Phase 2.2 已显式列）
- ❌ **research workflow 端到端实装** → phase 1.4（phase 1.2 仅备 install ctx7+tavily+exa 三 deps）
- ❌ **DAG resolver / 拓扑排序** → phase 1.3
- ❌ **6 月 stale 检测 + weekly cron + GitHub API token** → phase 2.4（B4 候选 1）
- ❌ **完整 .harnessed/{audit.log, current-workflow.json, checkpoints/}** → phase 1.4 / 3.1（B7 候选 1：仅 backup + state.json）
- ❌ **harnessed setup 完整自检（npx@latest 提示）** → phase 1.3（GA-5 推迟）
- ❌ **真 git origin URL 篡改 audit**（要求已 install 副本存在）→ phase 2.4（phase 1.2 audit 仅 manifest 内自一致 + repository 字段格式校验）
- ❌ **Plugin uninstall 4 步 fallback** → phase 2.4（R6.5 v0.2 范围；phase 1.2 只在 mcp-stdio rollback 中走 `claude mcp remove`）

---

## 5. 风险登记（phase 内 — C1-C6 + 新增）

| ID | 风险 | 概率 | 影响 | 缓解 |
|----|------|------|------|------|
| **PR1** | Wave 0 ADR 0005 起草 + schema 加字段触发 phase 1.1 fixture 全量重跑 | 低 | 中 | T1.3 加 optional 字段（不破坏 backward compat）；T1.4 仅修 1 个 manifest（planning-with-files）；其余 9 manifest 不影响 |
| **PR2** | claude mcp add CLI 输出格式 v2.1.x 升级时变（C2）| 中 | 中 | T3.2 mcpStdioAdd 仅依赖 exit code（不解析 stdout）；idempotent_check 走 `grep -q` 而非 JSON parse；ADR 0001 apiVersion 已留升级路径 |
| **PR3** | Windows native CRLF / 路径分隔符在 backup + diff 输出错位（C3）| 中 | 中 | T2.4 diff stripTrailingCr=true（contract test 1 项）；T2.6 backup metadata.json 加 per-file `eol: lf\|crlf` 字段；T4.4 rollback 按 eol 还原 |
| **PR4** | ralph-loop Windows fix 检测代码漏检（C4 — Git Bash vs WSL bash PATH 顺序）| 中 | 中 | T4.2 doctor 用 `spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'])` 判别（非空 = WSL）；CI Windows runner 实测；记录到 progress.md F23+ |
| **PR5** | Test framework 跨进程 spawn isolation 在 CI 不稳（C6）| 中 | 中 | T5.2 contract test 用 `vi.mock('child_process')`；T5.6 real-spawn 用 `it.skipIf(!CI && !ACCEPTANCE)` + tmpdir + `npm_config_prefix`；CI 跑完每 test 清理 |
| **PR6** | L4 vs L1 切换 UX 摩擦（C5 — 用户首次见 L4 prompt 误以为 broken）| 低 | 低 | T6.1 INSTALLER-CONTRACT.md 加 FAQ；T3.1 dry-run 输出 + L4 prompt 含 npx fallback 教学行；CONTRIBUTING.md 加备注 |
| **PR7** | picocolors `isColorSupported` 在 Windows git-bash 仍有 corner case（nodejs/node#39673 衍生）| 低 | 低 | T2.4 commander 加 `--no-color` flag + IMPL NOTE 引用 GA-2 § B.1；CI 全平台 contract test 自动覆盖 |
| **PR8** | @clack/prompts 220KB install + 周下载比 prompts 小 100x（bus factor 担忧）| 低 | 低 | GA-2 § B.3 已 lock；增长趋势猛 + vite/astro/nuxt scaffolders 全栈采用；如未来真 deprecate 可切 prompts (terkelg) — 仅 confirm.ts 一处改 |
| **PR9** | 12 contract test cell 中某个 method × contract 组合 OOS（如 npm-cli L4 与 mcp-stdio L3 在同一 contract 下行为差异）| 中 | 中 | T5.2 nested loop 自动展开；fixtures 准备时区分 method 特异性（L4 vs L3 prompt 文本）；plan-checker / 第二轮 paranoid review 兜底 |
| **PR10** | phase 1.2 实际工期 > 3 周（37 子任务 + cross-OS CI 红循环）| 中 | 中 | 7-wave checkpoint；每 wave 完成跑全 acceptance bar 子集；如 wave 4 卡 1 method 可先 ship 另一 method（vertical slice 而非 horizontal）|

---

## 6. 完成定义（Definition of Done — 每个 task 必满足）

每个 task ✅ 必满足以下硬约束（沿袭 phase-1.1 PLAN.md § 6）：

1. **代码 / 配置 commit 进 git** — 每个 task 至少 1 个 commit，commit message 格式 `phase-1.2: T<N>.<M> <action> (<reason>)`
2. **本地通过相关命令** — `pnpm typecheck && pnpm lint` 0 错误；改测试时 `pnpm test` 局部通过
3. **task_plan.md 同步勾选 + progress.md 追加一行**
4. **决策来源标注** — task action / commit message 必须引用对应 ADR / GA / PATTERNS / ASSUMPTIONS § 章节
5. **如发现意外 / 决策修订 → progress.md § B 追加 F23+ finding** — 不允许悄悄 work around；重大事项升级 ADR 0006+ errata（但 ADR 0001-0004 main body 守恒）

Phase 1.2 整体 done 必须满足 § 4.1 全部 9 条 acceptance bar。

---

## 7. 与 phase 1.3 / 1.4 / 2.1 的接口契约

phase 1.2 deliver 的接口（phase 1.3+ 直接消费，禁止重写）：

| 接口 | 文件 | 消费者 |
|------|------|-------|
| `runInstall(manifest, opts) → InstallResult` | `src/installers/index.ts` | phase 1.3 DAG resolver 拓扑排序后调用；phase 1.4 research workflow install ctx7+tavily+exa |
| `InstallContext / InstallResult / Level` 类型 | `src/installers/lib/types.ts` | phase 1.3 doctor 扩展 / phase 2.1 4 method 实装 |
| `lib/{preflight, diff, confirm, backup, spawn, state}` 6 helpers | `src/installers/lib/*.ts` | phase 2.1 4 method 实装直接复用（不重写）|
| `harnessed install / doctor / audit / rollback / status` 5 子命令 | `src/cli/*.ts` | phase 1.3 setup 完整版 + phase 2.4 audit/doctor 扩展 |
| `.harnessed/state.json` schema | `src/installers/lib/state.ts` | phase 3.1 checkpoint 引擎扩展（不冲突 — phase 1.2 仅占用 installed 字段；phase 3.1 加 current-workflow 字段）|
| `.harnessed-backup/<ISO-ts>/metadata.json` schema | ADR 0004 § 3 + lib/backup.ts 实装 | phase 2.x 任何 installer 复用同 backup 路径 |
| 3 新 deps（picocolors / diff / @clack/prompts）| package.json | phase 1.3 setup CLI / phase 2.1 4 method 复用 |
| ADR 0005 marketplace_source 字段 | `src/manifest/schema/installMethods/ccPluginMarketplace.ts` + `schemas/manifest.v1.schema.json` | phase 2.1 cc-plugin-marketplace installer 消费（third-party marketplace 2-step add+install）|

---

## 8. 关键决策记录（plan 内冷封 — 执行期不再 reopen）

| 决策 ID | 内容 | 来源 |
|---------|------|------|
| **D1.2-1** | Installer 抽象 = A3（plain function + helper），与 vite/astro 同栈，karpathy simplicity | GA-2 § Sub-issue A 推荐 + PATTERNS D-1 |
| **D1.2-2** | CLI lib 三件套 = picocolors + diff (jsdiff v9) + @clack/prompts | GA-2 § Sub-issue B |
| **D1.2-3** | cc-plugin-marketplace installer 推 phase 2.1（GA-1 timing 推荐 Option C；schema 字段 phase 1.2 reserve）| GA-1 § Recommendation + ASSUMPTIONS B6 |
| **D1.2-4** | npm-cli 用户拒 L4 → 自动降级 L1 npx + 显式告知 | ASSUMPTIONS B3 候选 1 + SPEC § 8.5 |
| **D1.2-5** | doctor 4 项最小 check（Node / MCP scope / jq / Win bash）；6 月 stale + weekly cron 推 phase 2.4 | ASSUMPTIONS B4 候选 1 + R04 P1#8 |
| **D1.2-6** | karpathy CLAUDE.md merge 引擎推 phase 2.2 | ASSUMPTIONS B5 候选 2 + ROADMAP Phase 2.2 |
| **D1.2-7** | .harnessed/ 落地范围 = 仅 .harnessed-backup/ + .harnessed/state.json；audit.log + current-workflow.json + checkpoints/ 推 phase 1.4 / 3.1 | ASSUMPTIONS B7 候选 1 + karpathy YAGNI |
| **D1.2-8** | ADR 0005 errata = schema 加 optional `marketplace_source` 字段；ADR 0001 main body 不动（A7 守恒）| GA-1 § "Phase 1.1 manifest fix needed" + A7 沿袭 |
| **D1.2-9** | 复用 `ValidationError` 类型（不新建 InstallError class）；扩展 keyword 取值集合 | PATTERNS D-1 |
| **D1.2-10** | mcpStdioAdd 不调通用 spawn.ts，直接 spawn `claude mcp ...`；idempotent 走 exit code 不解析 stdout | ASSUMPTIONS C2 mitigation + ADR 0004 契约 5 |
| **D1.2-11** | backup metadata.json 加 per-file `eol: lf\|crlf` 字段（CRLF preservation C3 mitigation）| ASSUMPTIONS C3 |
| **D1.2-12** | Contract test 12 cell（6 × 2）使用 `vi.mock('child_process')` 隔离；real-spawn 单独 skipIf gate | ASSUMPTIONS C6 + PATTERNS § 4.1 |

---

## 9. 下一步

1. ✅ 本 PLAN.md 创建（GSD 视角）
2. ✅ task_plan.md 创建（planning-with-files 主计划，37 atomic 子任务可勾选）
3. ✅ progress.md 初始空跟踪（§ A 维护规则 / § A.2 acceptance bar snapshot / § A.3 wave 进度 / § A.4 进度日志 / § A.5 session 恢复）
4. ✅ progress.md § B 初始空发现记录（F23 起，模板沿用 phase-1.1）
5. ⏳ **plan-checker review**（建议跑 — phase 1.1 plan-checker 给了 V1 BLOCKER 经验）
6. ⏳ **进入 GSD `/gsd-execute-phase 1.2`**（按 task_plan.md wave 顺序执行；每子任务 `/ralph-loop` 包裹 COMPLETE）
7. ⏳ phase 1.2 done 后 → `/gsd-discuss-phase 1.3`（DAG resolver + harnessed-router 引擎 + setup/doctor 完整版）

---

## 10. 关注点 — 给 plan-checker 的 verify hint

1. **决策回溯链路完整**：每个 task 必引用 ADR 0001-0005 / GA-1/2/3 / PATTERNS / ASSUMPTIONS callout — 缺引用即 reject
2. **6 项 ASSUMPTIONS callout 全部覆盖**：
   - GA-1（cc-plugin-marketplace 推 phase 2.1）✅ Wave 0 ADR 0005 + planning-with-files manifest fix
   - GA-2（A3 + picocolors + jsdiff + @clack/prompts）✅ Wave 0 deps + Wave 2 helpers
   - GA-3 = GA-2 § B 三件套 ✅
   - C2（claude mcp 输出稳定）✅ T3.2 exit-code only + idempotent grep -q
   - C3（CRLF/LF preservation）✅ T2.4 stripTrailingCr + T2.6 metadata.json eol 字段
   - C6（test isolation）✅ T5.2 vi.mock + T5.6 real-spawn skipIf + tmpdir
3. **依赖图无遗漏**：Wave 0 T1.2 ADR 0005 起草是条件性节点（如最终决定 schema 字段不加，只需 manifest 注释；本 plan 默认走加字段路径 — 与 GA-1 § "Phase 1.1 manifest fix needed" 一致）
4. **B1'-B9' acceptance bar 必须能用 single command 验证**：避免"测试通过 == 验收"模糊语义
5. **out-of-scope 严格遵守**：任何 cc-plugin-marketplace installer / DAG / setup 完整版 / merge 引擎实装 = scope creep，立即拒绝
6. **task 粒度合理性**：T2.6 backup（120 行 + sha1 + eol）单任务偏大，执行期可二拆为 T2.6a (basic backup) + T2.6b (eol preservation)；plan 不必预拆
7. **A7 守恒 step 沿用**：CI 自动 git diff `adr-0001-accepted` 跑 0001/0002/0003/0004 main body — Wave 0 T1.2 写 0005 是新文件不影响 baseline
8. **ADR 0005 errata 起草路径**：Wave 0 T1.2 必须在 schema 加字段（T1.3）之前完成 ADR 起草；如 user push back 不要 schema 加字段，则改走 GA-1 fallback "manifest yaml 注释 marketplace_source"（不 reserve schema 字段）—— 但 GA-1 推荐前者

---

**Phase 1.2 plan complete: PLAN.md / task_plan.md / progress.md。下一步建议跑 plan-checker（phase 1.1 V1 BLOCKER 经验沿袭）。**
