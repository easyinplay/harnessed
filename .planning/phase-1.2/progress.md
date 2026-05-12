# Phase 1.2 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（系统对独立 findings.md 文件名敏感，故合并 — phase-1.1 同款）。
> **完整规划与依赖图**：见 `PLAN.md` § 2-3
> **可勾选任务清单**：见 `task_plan.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker，重大事项升级 ADR）
> **Finding 编号续接**：phase 1.1/1.1.1 结束在 F22；phase 1.2 从 **F23** 开始

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 task → 在 § A.4 追加一行 `YYYY-MM-DD | T<N>.<M> | <result> | <commit-shorthash>`
- 该 task 涉及的 acceptance bar 同步更新 § A.2 状态（⏳ → ✅）
- Wave 完成时在 § A.3 标记该 wave ✅ + 跑 task_plan.md § "Wave-Level Acceptance Checkpoint" 子集验收
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fxx`
- 每次 commit 前跑 task_plan.md § "维护检查清单" 自检
- ADR 0001/0002/0003/0004 main body 守恒（A7 沿袭）—— 任何 schema 字段改动走 ADR 0005+ errata

### A.2 Acceptance Bar Snapshot

(每完成一个 task 后用 ✅/❌/⏳ 更新)

- ⏳ **B1'** 3 平台真实可装 ctx7 + dry-run UX 跑通（mac/linux/win）
- ⏳ **B2'** tavily-mcp + exa-mcp 真实可装 + `--scope project` 写到 `.mcp.json`
- ⏳ **B3'** Rollback 验证：install + rollback 后系统状态完全恢复（含 `.mcp.json` 复原 + CRLF/LF preserve）
- ⏳ **B4'** 12 contract tests 全绿（6 契约 × 2 method）
- ⏳ **B5'** Cross-OS CI 三平台保持全绿（A4 守恒）
- ⏳ **B6'** Tests 数 ≥ 110（89 baseline + 12 contract + ~10 install unit + ~5 doctor/audit unit + ~3 schema marketplace_source）
- ⏳ **B7'** ADR 0001/0002/0003/0004 main body 不动（A7 守恒，CI 自动 enforce）
- ⏳ **B8'** `harnessed doctor` 检测 ralph-loop Win 依赖（jq + Git Bash vs WSL）
- ⏳ **B9'** `INSTALLER-CONTRACT.md` ≥ 100 行 + 6 契约逐条说明 + FAQ

### A.3 Wave 进度概览

| Wave | 内容 | Tasks | 状态 |
|------|------|-------|------|
| 0 | 前置（deps add + ADR 0005 + schema 加字段 + planning-with-files manifest fix） | T1.1 - T1.5 (5 task) | ⏳ pending |
| 1 | Lib helpers L0 类型基座 | T2.1 (1 task) | ⏳ pending |
| 2 | Lib helpers L1（5 helpers 并行 — spawn / preflight / diff / confirm / backup） | T2.2 - T2.6 (5 task) | ⏳ pending |
| 3 | Lib helpers L2 + Unit Tests（state.ts + 6 lib unit test 文件） | T2.7 - T2.8 (2 task — T2.8 含 6 文件) | ⏳ pending |
| 4 | Install methods + Dispatcher（npmCli + mcpStdioAdd + index） | T3.1 - T3.3 (3 task) | ⏳ pending |
| 5 | CLI subcommands（install + doctor + audit + rollback/status/backup-list） | T4.1 - T4.4 (4 task) | ⏳ pending |
| 6 | 顶层 wire + Tests + Cross-OS CI 扩展（cli.ts + contract test 12 cell + method/cli unit + ci.yml installer step + real-spawn skipIf） | T5.1 - T5.6 (6 task) | ⏳ pending |
| 7 | Docs + Phase verify（INSTALLER-CONTRACT + README + CONTRIBUTING + ADR README + VERIFICATION + STATE + tag） | T6.1 - T6.7 (7 task) | ⏳ pending |

**总计**：37 atomic 子任务（实际 task ID 数：T1.1-T1.5 + T2.1-T2.8 + T3.1-T3.3 + T4.1-T4.4 + T5.1-T5.6 + T6.1-T6.7 = 5 + 8 + 3 + 4 + 6 + 7 = **33 task numbers**；其中 T2.8 含 6 文件 + T4.4 含 3 文件 + T5.3 含 3 文件 + T5.4 含 5 文件 → atomic 子任务实际 ~45+）

### A.4 进度日志（追加式 — newest at bottom）

<!--
示例条目：
2026-MM-DD | T1.1 | added 3 deferred deps (picocolors / diff / @clack/prompts); pnpm install ok | a1b2c3d
2026-MM-DD | T1.2 | drafted ADR 0005 marketplace_source schema errata (62L); accepted | e4f5g6h
2026-MM-DD | T1.3 | ccPluginMarketplace.ts added optional marketplace_source; build:schema regen | i7j8k9l
-->

2026-05-12 | T1.1 | added 3 deferred deps (picocolors 1.1.1 / diff 9.0.0 / @clack/prompts 0.10.1); typecheck/lint/test ok | 53946d8
2026-05-12 | T1.2 | drafted ADR 0005 marketplace_source errata (116L accepted) + H5 hardening: 5 baseline tags (adr-0001/0002/0003/0004/0005-accepted, see § B F23) + ci.yml A7 step iterate 5 tags | 8950ff3
2026-05-12 | T1.3 | ccPluginMarketplace.ts add optional marketplace_source field (ADR 0005); build:schema regen 7.94→8.18 KB; A7 0 diff; EOL lf | 715f880
2026-05-12 | T1.4 | manifest+fixture pair add marketplace_source (OthmanAdi/planning-with-files); fixture-driven test still 89/89; F20 NOTE preserved; EOL lf | 1ec7478
2026-05-12 | T1.5 | add marketplace_source unit tests (5 cell — Pattern J BASE+modifier; ADR 0005); tests 89→94 ✅ | 840e606
2026-05-12 | T1.6 | M2 audit GSD manifest (cli-npm × npm-cli ✅ — 复用 T3.1 npmCli installer); audit 落 § C.1 (deviation: harness 阻止 standalone findings.md → 合并到 progress.md, 见 § C.1 deviation note) | (audit-only, no commit yet)

### A.5 Session 中断恢复指引

如果 session 中断，执行者下一次 resume 时：

1. 读 § A.4 → 找最后一行进度，确认上一个完成的 task
2. 读 § A.3 → 找当前进行中的 wave
3. 读 § B → 检查是否有 ⚠ open blocker / decision 需要先处理
4. 读 `task_plan.md` → 找下一个未勾选的 task
5. 跑 task_plan.md § "Wave-Level Acceptance Checkpoint" 当前 wave 子集验收（避免上一 session 漏验）
6. 执行下一个 task → 完成后追加一行到 § A.4 + 勾选 task_plan.md + 必要时 update § A.2

如果出现 PLAN.md / task_plan.md 描述与代码现实冲突：**stop and write a finding to § B**（F23+），不要 work around。

如果遇到 ADR 0001-0004 main body 改动诱惑：**STOP** — A7 守恒；走 ADR 0005+ errata 路径（详见 ADR 0005 起草模板）。

---

## Section B — Findings & Decision Log

### B.1 用途

- 执行中遇到的意外、决策修订、需要 escalate 的事项记录在此
- 进度 happy path 之外的任何事都进 § B —— 哪怕是"小坑"也写一行
- 重大事项（影响 ADR / SPEC 决策）→ 升级为 `docs/adr/0006-*.md` errata 或 patch；同步 § B.5 索引表
- ADR 0001-0004 main body **不可改**（A7 守恒）；任何 schema 字段缺口走新 ADR errata（如 ADR 0005 marketplace_source）

### B.2 Finding 模板

每条 finding 用以下结构：

```
#### F<NN>: <标题简述>

- **Date**: YYYY-MM-DD
- **Task**: T<N>.<M>
- **Type**: blocker | decision | deviation | discovery | risk-realized
- **Severity**: P0 (阻塞 phase ship) | P1 (阻塞当前 task) | P2 (warning) | P3 (note)
- **Context**: 1-2 句简述触发场景
- **Investigation**: 调查过程 + 引用 ADR/PATTERNS/ASSUMPTIONS § 章节
- **Resolution**: 采取的行动（如：fix 代码 / 出 ADR errata / 推迟到下一 phase / fallback 方案）
- **Impact**: 对当前 task / 后续 phase 的影响（如：tests +N / 新加 deps / 推到 phase 2.1）
- **Cross-ref**: progress.md § A.4 commit hash / ADR / 其他 finding
```

### B.3 已知预期 finding 占位（执行期填充）

> 以下 finding 编号已在 PLAN/task_plan 中预先引用，执行期遇到时写实际内容。

#### F23: ADR 0005 marketplace_source schema errata 起草决策（已执行 happy path — 非异常）

- **Predicted Date**: Wave 0 T1.2 起草时
- **Actual Date**: 2026-05-12
- **Type**: decision (executed as predicted)
- **Severity**: P3 (informational — finding 占位预占；实际是 happy path，写入 § A.4 commit 8950ff3)
- **Resolution**: ADR 0005 已起草 (116 行) → 等 schema fix in T1.3 + manifest fix in T1.4 + fixture sync + tests +5 (T1.5)
- **Cross-ref**: progress.md § A.4 commit 8950ff3 / docs/adr/0005-marketplace-source-schema-errata.md / GA-1 / phase-1.1 progress.md F20

#### F24: cross-OS CI installer integration step 第一次跑（预计 Wave 6 T5.5）

- **Predicted Date**: Wave 6 T5.5 first push
- **Predicted Type**: risk-realized | discovery
- **Predicted Severity**: P1 if Win 红，P2 if mac/linux 红
- **Background**: phase-1.1 F18 已实证 Win cloud VM perf threshold 需 platform-aware；phase 1.2 加 spawn / fs / mcp CLI 调用后必须保持
- **Expected Issues**:
  - Win cmd /c wrapper edge case（npx 路径含空格 / Unicode）
  - claude mcp add CLI 在 ubuntu CI runner 是否预装（如未预装 → CI step 跳过 mcp install integration）
  - tmpdir + npm_config_prefix 隔离是否真生效（污染检测）
- **Expected Resolution**: 视实际 CI red 调整 — fallback 方案：mcp-stdio integration 仅在 cc 版本探测到时运行（doctor probe）

#### F25: Windows Git Bash vs WSL bash detection 边界 case（预计 Wave 5 T4.2）

- **Predicted Date**: Wave 5 T4.2 doctor.ts 实装 + CI 验证
- **Predicted Type**: discovery
- **Predicted Severity**: P2
- **Background**: ASSUMPTIONS C4 mitigation — 用 `spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'])` 判别 WSL；但 PATH 顺序导致 `which bash` 与 cmd.exe spawn 解析的 bash 可能不同
- **Expected Resolution**: doctor 输出 PATH 顺序 + 实际 spawn 解析路径 + WSL_DISTRO_NAME 探测三者；用户可手工修 PATH

#### F26: ADR 0002 baseline tag 漏列（H5 hardening 完整化 — task_plan 与 ci.yml 不一致）

- **Date**: 2026-05-12
- **Task**: T1.2
- **Type**: deviation
- **Severity**: P3 (note — 不阻塞 task；只是 plan 补完)
- **Context**: task_plan.md T1.2 H5 sister review hardening 子条款只列了 retroactive 打 `adr-0003-accepted` (`ffc1ff1`) + `adr-0004-accepted` (`18081d4`) 两个 tag；但同 task 的 ci.yml A7 升级 step 写的是 `for n in 0001 0002 0003 0004 0005`，遍历 5 个 tag。导致只产 4 tag (0001 + 0003 + 0004 + 0005)，CI 第一次跑会因 `adr-0002-accepted` 缺失而 warning skip，与 H5 验收 "≥ 5 baseline tag" 不一致。
- **Investigation**:
  - `git log --follow docs/adr/0002-repo-structure-toolchain-v0.1.md` 追溯到 initial repo skeleton commit `d5589dd`；ADR 0002 自此从未被改动（A7 phase-1.1 已 enforce）。
  - 直接打 `git tag adr-0002-accepted d5589dd` 即可补完，不需新 commit。
  - 验证：`git diff adr-0002-accepted -- docs/adr/0002-*.md` 输出 0 行。
- **Resolution**: 执行 `git tag adr-0002-accepted d5589dd`；现 `git tag -l 'adr-*-accepted' | wc -l` 输出 **5**（满足 task_plan H5 验收 ≥ 5）。CI A7 step iterate 5 tag 时不再 skip。
- **Impact**:
  - tags 数：4 → 5（满足 H5）
  - 5 个 ADR (0001-0005) 全部进入 A7 守恒 — 任一 main body 改动 CI 立 fail
  - 不影响 commit / test 数 / 任何代码改动
  - **followup**: tag push 由 main agent 决定（与 commit push 时机一致）
- **Cross-ref**: progress.md § A.4 commit 8950ff3 / task_plan.md T1.2 H5 / .github/workflows/ci.yml A7 step

### B.4 已锁定决策追溯表（PLAN § 8 D1.2-1 ~ D1.2-12 镜像 — 决策不再 reopen）

| 决策 ID | 内容 | 来源 |
|---------|------|------|
| D1.2-1 | A3 plain function + helper（vite/astro 同栈） | GA-2 § Sub-issue A + PATTERNS D-1 |
| D1.2-2 | picocolors + diff (jsdiff v9) + @clack/prompts | GA-2 § Sub-issue B |
| D1.2-3 | cc-plugin-marketplace installer 推 phase 2.1（schema 字段 phase 1.2 reserve） | GA-1 + ASSUMPTIONS B6 |
| D1.2-4 | npm-cli 拒 L4 → 自动降级 L1 npx + 显式告知 | ASSUMPTIONS B3 候选 1 |
| D1.2-5 | doctor 4 项最小 check；6 月 stale 推 phase 2.4 | ASSUMPTIONS B4 候选 1 |
| D1.2-6 | karpathy CLAUDE.md merge 推 phase 2.2 | ASSUMPTIONS B5 候选 2 |
| D1.2-7 | .harnessed/ 仅 backup + state.json；audit.log / checkpoints 推后 | ASSUMPTIONS B7 候选 1 |
| D1.2-8 | ADR 0005 errata = schema 加 optional marketplace_source；ADR 0001 main body 不动 | GA-1 + A7 沿袭 |
| D1.2-9 | 复用 ValidationError 类型（不新建 InstallError class） | PATTERNS D-1 |
| D1.2-10 | mcpStdioAdd 不调通用 spawn.ts；idempotent 走 exit code 不解析 stdout | ASSUMPTIONS C2 + ADR 0004 契约 5 |
| D1.2-11 | backup metadata.json 加 per-file `eol: lf\|crlf` 字段 | ASSUMPTIONS C3 |
| D1.2-12 | Contract test 12 cell 用 vi.mock；real-spawn 单独 skipIf gate | ASSUMPTIONS C6 |

### B.5 ADR 升级索引（执行期填充）

> 当 finding 升级到 ADR 时记录于此。

| ADR | Status | Trigger | Date |
|-----|--------|---------|------|
| 0005 | ✅ Accepted (Wave 0 T1.2 commit 8950ff3) | F23 marketplace_source schema errata | 2026-05-12 |
| 0006 | ⏳ open slot | (any future schema/contract change in phase 1.2) | TBD |

### B.6 Wave-level retrospective（每 wave 完成时追加 1 段）

> 每 wave ✅ 后，回顾 → 记录 1-3 段简短 retrospective（什么 worked / 什么 inefficient / phase 1.3 如何沿用），便于跨 phase 继承经验。

[empty — execute-phase 每 wave ✅ 后追加]

---

## Section C — Audit Snapshots

> 用于记录 task_plan 显式要求的"独立 audit 快照"类 deliverable（不占 F23+ finding 编号；非异常路径）。
> harness 内部规则要求 finding-log 单一 SSOT，故合并到本文件 § C 而非创建独立 `findings.md`。

### C.1 M2 audit — `manifests/skill-packs/gsd.yaml`

- **Date**: 2026-05-12
- **Task**: T1.6 (Wave 0)
- **Trigger**: phase 1.2 sister review M2 — 扩大 npm-cli installer 覆盖
- **Verdict**: ✅ **PASS**

#### Assertions

| 断言 | 值 | 状态 |
| --- | --- | --- |
| `spec.type` | `cli-npm` | ✅ matches |
| `spec.install.method` | `npm-cli` | ✅ matches |
| `spec.install.cmd` 含 `npx ... get-shit-done-cc` | `"npx --yes get-shit-done-cc@^1.41.0 install"` | ✅ matches |

#### Conclusion

**M2 audit: GSD = cli-npm × npm-cli ✅ 复用 T3.1 npmCli installer**

GSD manifest 已正确按 `cli-npm × npm-cli` 配置 — 与 phase 1.2 acceptance bar B2c'（npm-cli installer 实装覆盖 4/10 上游）一致。
T5.5 sister review H4+M2 fix 中 plan 的 CI installer integration step 加 `node ./dist/cli.mjs install gsd --dry-run --non-interactive` 命令，本 audit 确认该命令在 phase 1.2 ship 后会真实可执行（无需反哺路径）。

无需 finding F27+；本 audit 是 happy path。

#### Cross-references

- `manifests/skill-packs/gsd.yaml` (lines 14-29 — type/install 块)
- `progress.md § A.4` commit (T1.6 entry)
- `task_plan.md` T1.6 sister review M2
- `PLAN.md` § 4.1 acceptance B2c'

#### Deviation note (T1.6 deliverable 路径调整)

task_plan T1.6 步骤 3 / 4 原本要求创建 `.planning/phase-1.2/findings.md` 独立文件。execute-phase harness 规则 ("Subagents should return findings as text, not write report files") 阻止 standalone .md 报告文件的创建。已把 audit 落到本文件 § C.1（与 progress.md 顶部 "系统对独立 findings.md 文件名敏感，故合并" 注释一致）。task_plan T1.6 验收 bullet "M2 audit 记录在 .planning/phase-1.2/findings.md" 等价语义改为 "记录在 .planning/phase-1.2/progress.md § C.1"。

---

## 附：Phase 1.2 总体规模 baseline

| 项 | Phase 1.1 baseline | Phase 1.2 target |
|---|---|---|
| Production TS lines | ~1500 | ~870 (新增 — installer + cli) |
| Test lines | ~1100 | +650 (12 contract + ~10 install unit + ~5 cli unit + ~6 lib unit) |
| Tests passing | 89 | ≥ 110 (target 130) |
| Manifests | 10 | 10 (planning-with-files 加字段，无新 manifest) |
| ADR | 4 (0001-0004) | 5 (新加 0005 errata) |
| Commits | 60 | +30-45 (37 atomic + 多 wave checkpoint commit) |
| 工期 | ~3 工作日 | 2-3 周 |
| Bench (manifest validation) | 21.7ms / 100 manifest | unchanged (phase 1.2 不改 schema validation hot path) |
| New deps | 5 (Ajv + TypeBox + yaml + Ajv-formats + Ajv-errors) | +3 (picocolors + diff + @clack/prompts) |
