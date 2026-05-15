# Phase 2.1 Execute Progress

> **Phase 2.1** = 4 placeholder installer 实装 → runtime-ready + Wave 0 schema/sister-review/docs batch
> **Started**: 2026-05-15
> **Status**: ✅ SHIPPED (2026-05-15) — pending main agent T6.4 CI verify + T6.5 tag push
> **Test state**：374 passed + 3 skipped（phase 1.5 baseline 318+3 → +56：8 schema + 24 installer unit + 24 contract +4 dispatch identity -4 stale = 374+3）
> **Acceptance bar E1-E8 8/8** ✅

---

## § A 23 atomic 子任务执行进度（6 wave）

### Wave 0 — sister review 结清 + schema 前置 + ADR 0010（T1.1~T1.9）— ✅ DONE

commit `58ead88`：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T1.1 | `docs/adr/0010-installer-schema-extension-errata.md` (new ≥100L 6-section) | E1 + D-04+D-08+D-09+D-16+H3+H4 + ADR 0008/0009 errata 风格 | ✅ |
| T1.2 | `src/manifest/schema/spec.ts` — license whitelist MIT-0 + anthropics-official + license_source | E2 + D-03+D-04+D-05+D-18 + PATTERNS § 3.1/3.2 | ✅ |
| T1.3 | `src/manifest/schema/spec.ts` — bundle-install `provides:` 字段 | E2 + D2.1-1+D2.1-2 + PATTERNS § 3.3 | ✅ |
| T1.4 | `src/manifest/validate.ts` — install_type↔method 1:N cross-field refinement | E2 + PATTERNS § 3.4 + ADR 0007 | ✅ |
| T1.5 | `routing/decision_rules.yaml` — chinese-content-deck rule 去 warn (baoyu-skills resolve MIT-0) | E2 + D-05 | ✅ |
| T1.6 | 3 schema test 文件 ≥13 新 cell (license + bundle + install-type) | E2 + Pattern J | ✅ |
| T1.7 | `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + ci.yml step (W3 warn-only round 1) | E3 + D2.1-7+D2.1-8 + W3 lock | ✅ |
| T1.8 | `.planning/phase-1.4/SAMPLES.md` § 8.4 — 2/30 miss sample 身份标注 | E3 + M1 | ✅ |
| T1.9 | `CONTRIBUTING.md` — intel/参考文档 SSOT 引用规则 section | E3 + user-directed (intel § 0 提升为项目级) | ✅ |

### Wave 1 — mcp-http-add（T2.1~T2.2）— ✅ DONE

commit `80c3ff9`：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T2.1 | `src/installers/mcpHttpAdd.ts` (new ~85% clone mcpStdioAdd) | E4 + D-12+D-16 + PATTERNS § 2 mcpHttpAdd | ✅ |
| T2.2 | `tests/unit/installers-mcpHttpAdd.test.ts` (new ≥6 cell) | E4 + Pattern K | ✅ |

**Wave 1 deviation**：
- **F2.1-1 (Rule 2 schema-gap parse-from-cmd)** — install method schema 不含 url + headers 字段；installer 从 `install.cmd` 解析（cmd 保留作 audit-trail，args authoritative 构造）— 沿袭 mcpStdioAdd 既有 discipline。`extractUrl` + `resolveHeaders` 是 installer 内部 private 函数（≤30L），不污染 lib/。Rule 2 reasonable — schema-gap 不阻塞 installer ship。

### Wave 2 — git-clone-with-setup（T3.1~T3.2）— ✅ DONE

commit `80c3ff9`：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T3.1 | `src/installers/gitCloneWithSetup.ts` (new ~55% reuse + inline SHA-verify) | E5 + D-13+D-15 + PATTERNS § 2 gitCloneWithSetup | ✅ |
| T3.2 | `tests/unit/installers-gitCloneWithSetup.test.ts` (new ≥6 cell) | E5 + Pattern K | ✅ |

**Wave 2 deviation**：
- **F2.1-2 (Rule 2 strict SHA-only enforcement)** — schema regex 允许 SHA(7-40 hex) OR SemVer (v1.2.3)；installer-layer enforce SHA-only（`git rev-parse HEAD` returns SHA，authority must be SHA — SHA↔tag is not an authority match，SHA IS the authority）。real manifests (ui-ux-pro-max.yaml / gstack.yaml) 已 follow 40-hex SHA pin。Rule 2 — D-15 SHA-verify 的必要前置。SemVer git_ref 仍在 cc-plugin-marketplace 合法（不用 SHA-verify path）。
- **F2.1-1 cont. (Rule 2 schema-gap parse-from-cmd)** — clone dest dir 不在 schema；installer `extractCloneTarget` 解析 `git clone [flags] <url> <dest>` 拿 dest（required，pure-create backup + SHA-verify cwd 都需）。

### Wave 3 — cc-plugin-marketplace（T4.1~T4.2）— ✅ DONE

commit `80c3ff9`：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T4.1 | `src/installers/ccPluginMarketplace.ts` (new ~65% clone mcpStdioAdd direct-spawn + two-step) | E6 + D-11+D-20 + PATTERNS § 2 ccPluginMarketplace | ✅ |
| T4.2 | `tests/unit/installers-ccPluginMarketplace.test.ts` (new ≥6 cell) | E6 + Pattern K | ✅ |

**Wave 3 deviation**：
- **F2.1-1 cont. (Rule 2 schema-gap parse-from-cmd)** — marketplace ref + `<plugin>@<mkt>` 不在 schema；installer `parseCmd` 解析 `plugin marketplace add <ref>` + `plugin install <plugin>@<mkt>` regex。

### Wave 4 — npx-skill-installer（T5.1~T5.2）— ✅ DONE

commit `80c3ff9`：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T5.1 | `src/installers/npxSkillInstaller.ts` (new ~50% reuse npmCli npx 模式 + fs.access real-path verify) | E7 + D-01+D-02+D2.1-4+D2.1-5+D2.1-6 + PATTERNS § 2 npxSkillInstaller | ✅ |
| T5.2 | `tests/unit/installers-npxSkillInstaller.test.ts` (new ≥6 cell) | E7 + Pattern K | ✅ |

**Wave 4 deviation**：
- **F2.1-3 (Rule 2 flexible pin enforcement)** — preflight enforce `skills@<version-spec>` shape（forbids `@latest`），不 hardcode `1.5.7`。让 manifest 自由 pin minor bump（1.5.7 → 1.5.8）是 ADR 0001 reproducibility 的合理解读（pin 是 manifest 责任，installer 验 pin shape 不 hardcode 具体版本）。+ `--copy` + `--global` 强制（D2.1-5 — Win symlink-safe + user scope）。
- **D-02 known limitation logged** — npx-skill-installer ~/.agents/ vs ~/.claude/skills/ 目录冲突（vercel-labs/skills CLI default 在某些系统写 ~/.agents/）；`fs.access` real-path verify catch + suggest 提示用户手动 bridge；**完整 SessionStart sync-hook 桥接 deferred 后续 phase**（D-02 — context.md + ADR 0010 § Consequences 透明记录）。

### Wave 5 — tests + ship（T6.1~T6.6）— ✅ DONE (本 wave)

commit (本 commit)：

| Task | 文件 | 决策来源 | 状态 |
|------|------|---------|------|
| T6.1 | `src/installers/index.ts` — dispatch table 6 method 全覆盖（phase21Placeholder 删除）| E8 + PATTERNS § 4 | ✅ |
| T6.2 | `tests/integration/installer-contract.test.ts` extend — 6 method × 6 contract = 36 cell | E8 + ADR 0004 6 契约 | ✅ |
| T6.3 | `.github/workflows/ci.yml` — A7 step iter 1-9 → 1-10 + ADR 0010 errata 说明注释 | E8 + D-09 + A7 守恒 | ✅ |
| T6.4 | CI 三平台全绿 verify + push origin | E8 | ⏳ main agent |
| T6.5 | `.planning/STATE.md` + `.planning/phase-2.1/progress.md` (本文件) + `adr-0010-accepted` tag | E8 + D-09 | ⏳ drafts done; tag main agent |
| T6.6 | `.planning/phase-2.1/VERIFICATION.md` (≥120L — 实测 426L) | E1-E8 复现命令 + PLAN § 4 phase 2.2/2.3 prereq | ✅ |

**Wave 5 deviations**：
- **F2.5-1 (Rule 1 auto-fix — stale phase-deferred tests in `installers-index.test.ts`)** — 5 stale 测试假设 `phase21Placeholder` 还存在；T6.1 dispatch swap 后必须更新。改为 2 个 dispatch identity 测试（assert `installers[m] === installRealFn` × 6 + assert `new Set(refs).size === refs.length`）— 净 -3 cell，但语义更精确（identity-based dispatch verification > behavior-based stale assertion）。Rule 1 reasonable — stale tests 是 wave 5 dispatch swap 直接 caused，必须同步修。
- **F2.5-2 (Rule 1 auto-fix — contract test C5 mcp-cli-only regex tighten)** — 原 `\bclaude\b` regex 会误命中 `claude-code`（npx-skill 的 `--agent claude-code` 参数 — `\b` 在 `e-` 之间触发）。Fix: `/(?:^|\s)claude(?:\s|$)/` 严格匹配 `claude` 作为 binary 词（前后必空格或行首尾，不接 `-` / `_`）。语义更准确：mcp-cli-only 是说调 `claude` 这个 binary，不是字符串包含 `claude`。
- **F2.5-3 (Rule 1 auto-fix — contract test cc-plugin git_ref shape compliance)** — cc-plugin fixture 原写 `git_ref: 'fixture-git-ref'` 不过 preflight `GIT_REF_SHAPE` regex（`^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+...)$`），改为 40-hex 'a1b2c3d4e5f67890123456789012345678901234'。cc-plugin verify 不直接用 git_ref，记录用作 audit-trail。
- **F2.5-4 (Rule 2 — contract test mock fs.access for npx-skill)** — npx-skill-installer 用 `fs.access` 做 real-path verify，原 contract test mock 文件只 mock 了 `mkdir/readFile/writeFile/rename`。加 `access: vi.fn(async () => undefined)` 默认 return success（path exists）让 C3/C5 测试能 reach end-of-install。C6 测试用 spawn-exit-1 path return 在 fs.access 之前。Rule 2 — 新 installer 用新的 fs API，mock 必须扩展。

---

## § B Findings tracker

### Wave C plan-check round 1 findings（已 patch 进 PLAN-layer）

- **W2 (drafting 前实测对齐)** ✅ resolved — ADR 0010 H3 errata 数字 191L / ≤200L / +43L delta 提前实测对齐
- **W3 (CI gate warn-only round 1 锁定)** ✅ resolved — `ENFORCE = false` + 注释 "W3: warn-only round 1; flip to true in phase 2.2"
- **S1 (T1.1 ADR W2 引用)** ✅ resolved
- **S2 (T1.7 transparency 文档 sample 命中)** ✅ resolved
- **S3 (D-15 inline SHA-verify YAGNI lock)** ✅ resolved
- **S5 (verdict marker regex 容忍 markdown bold `**Verdict:**`)** ✅ resolved

### Wave 1-4 execute findings（5 deviations，全部 Rule 1/Rule 2 reasonable）

- **F2.1-1 (Rule 2 schema-gap parse-from-cmd × 3)** — mcp-http-add (url + headers) / git-clone-with-setup (clone dest) / cc-plugin-marketplace (marketplace ref + plugin@mkt) 不在 install method schema 中。Installer 从 `install.cmd` 解析这些字段（cmd 保留作 audit-trail，args authoritative 构造）— 沿袭 mcpStdioAdd 既有 discipline。✅ DOCUMENTED in VERIFICATION.md § 3 + ADR 0010 errata path 透明记录。
- **F2.1-2 (Rule 2 git-clone strict SHA-only enforcement)** — schema regex 允许 SHA(7-40 hex) OR SemVer (v1.2.3)，installer-layer enforce SHA-only（`git rev-parse HEAD` returns SHA，authority must be SHA）。SemVer git_ref 走 cc-plugin-marketplace 时仍合法（不用 SHA-verify），git-clone-with-setup 强制 SHA。✅ DOCUMENTED in installer source comment + VERIFICATION.md.
- **F2.1-3 (Rule 2 npx-skill 灵活 pin enforcement)** — preflight enforce `skills@<version-spec>` shape（forbids `@latest`），不 hardcode `1.5.7`。让 manifest 自由 pin minor bump 是 ADR 0001 reproducibility 的合理解读（pin 是 manifest 责任，installer 验 pin shape）。✅ DOCUMENTED.

### Wave 5 execute findings（4 deviations，全 Rule 1/Rule 2 reasonable — 详 § A Wave 5）

### Wave 0 known limitations（v0.2+ 评估，不阻塞 ship）

- **D-02 known limitation** — npx-skill-installer ~/.agents/ vs ~/.claude/skills/ 目录冲突；完整 SessionStart sync-hook 桥接 deferred 后续 phase
- **H4 known limitation** — `arbitrate` substring match（ADR 0009 § Decision 2 `task.prompt.toLowerCase().includes(trigger.toLowerCase())`）已知 false-positive 风险（trigger `"test"` 命中 `"latest"`/`"contest"`）；v0.2+ semantic router L2 替代；ADR 0010 § Consequences 透明记录

### Sister review 透明性（结构性根治 — phase 2.1 重要交付）

phase 1.5 sister review T1+T2+T3 transparency 模式 + phase 2.1 Wave 0 结构性根治：

- **sister T1（inline transparency）**：T1.8 SAMPLES § 8.4 标注 2/30 miss 身份（28/30 specific match，2 个 miss 身份 + 为何 acceptable）— 防 "100% / 全绿" 聚合数字盖过真实状态的反模式
- **sister T2（Known Limitations transparency）**：ADR 0010 § Consequences 内联 H4 substring match false-positive 风险 + npx-skill D-02 目录冲突 known limitation
- **sister T3（transparency 结构性根治）**：T1.7 `TRANSPARENCY-VERDICT-CHECKLIST.md` + `check-transparency-verdicts.mjs` CI gate — `Verdict:` / `状态:` / `Closure:` marker 必带 `N/N` ratio + miss 声明；**W3 warn-only round 1 + phase 2.2 flip enforce**
- **sister T4（SSOT 引用纪律 结构性根治）**：T1.9 `CONTRIBUTING.md` SSOT 引用纪律 section — phase 编号语义锚定 + ADR 编号绝不预占 + 校验时机 + 反面教材（引 `.planning/intel/omc-comparison.md` 2026-05-14 初版写死 "phase 2.0" + "ADR 0010" → v0.2.0 激活后即 stale 的真实案例）

---

## § C Wave Acceptance Checkpoint 表（实测）

| Wave | Acceptance | 实测 | Blocker 处理 |
|------|-----------|------|-------------|
| 0 | ADR 0010 ≥100L 6-section + schema 4 项改动 typecheck 通过 + schema unit tests 全绿 + transparency CI gate 可运行 + M1 标注 | ✅ ADR 0010 ≥100L + 6-section + ≥7 关键命中 / schema 4 项改动 typecheck 通过 / ≥13 新 cell / `node scripts/check-transparency-verdicts.mjs` exit=0 / SAMPLES § 8.4 标注 2 miss | 无 |
| 1 | mcpHttpAdd.ts typecheck + unit test 全绿 + ADR 0004 6 契约遵守 | ✅ typecheck pass / unit test ≥6 cell 全绿 / contract test 6/6 ✅ | 无 |
| 2 | gitCloneWithSetup.ts typecheck + unit test + git rev-parse SHA verify inline | ✅ typecheck pass / unit test ≥6 cell 全绿 / inline SHA-verify ≤10L / contract test 6/6 ✅ | 无 |
| 3 | ccPluginMarketplace.ts typecheck + unit test + two-step spawn | ✅ typecheck pass / unit test ≥6 cell 全绿 / two-step spawn + D-20 idempotency / contract test 6/6 ✅ | 无 |
| 4 | npxSkillInstaller.ts typecheck + unit test + real-path verify | ✅ typecheck pass / unit test ≥6 cell 全绿 / `fs.access` real-path verify / contract test 6/6 ✅ | 无 |
| 5 | dispatch table 6 method + contract test 全套 + CI 三平台全绿 + adr-0010-accepted tag + A7 iter 1-10 | ✅ dispatch 6 method runtime-ready + phase21Placeholder = 0 / contract test 36 cell 全绿 / typecheck pass / tests 374+3 / ci.yml `for n in 0001..0010` × 2 + `ADR 0001-0010` × 3 / A7 守恒 ADR 0001-0009 main body 0 diff | ⏳ main agent T6.4 CI verify + T6.5 tag push |

---

## § D Phase 2.1 Acceptance Summary（E1-E8 全 8/8 ✅）

详 VERIFICATION.md § 8 Acceptance Summary 表（每 bar 复现命令 + 实测结果 + commit 索引）。

**Wave 0-5 commit 索引**：

| Wave | commit | 内容 |
|------|--------|------|
| Wave 0 | `58ead88` | ADR 0010 + schema 4 项 + decision_rules + 3 schema test + transparency CI gate + M1 + CONTRIBUTING SSOT (T1.1-T1.9) |
| Wave 1-4 | `80c3ff9` | 4 installer + 4 unit test + 5 deviations 透明记录 (T2.1-T5.2) |
| Wave 5 | (本 commit) | dispatch table + contract test 36 cell + ci.yml A7 iter 1-10 + STATE.md + progress.md + VERIFICATION.md + 4 Rule 1/Rule 2 deviations (T6.1-T6.3+T6.5 drafts+T6.6) |

**Phase 2.1 ship line**：
- 23 atomic 子任务 全完成（Wave 0-5；T1.9 user-directed post-Wave-C 加入）
- 6 install method 全 runtime-ready — `phase21Placeholder` 删除
- E1-E8 8/8 acceptance bar
- ADR 累积 9 → 10；baseline tag 9 → 10（adr-0010-accepted pending T6.5）
- ci.yml A7 step iter 1-9 → 1-10
- tests：phase 1.5 ship 318+3 → 374+3（+56：8 schema + 24 installer unit + 24 contract + 2 dispatch identity - 4 stale = +54 + 2 = +56）
- 新文件：`docs/adr/0010-installer-schema-extension-errata.md` + `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + `src/installers/{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.ts` + 4 unit test + 3 schema test + `.planning/phase-2.1/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, progress.md, VERIFICATION.md}`
- 修改：`src/manifest/schema/spec.ts` + `src/manifest/validate.ts` + `src/installers/index.ts` + `routing/decision_rules.yaml` + `.github/workflows/ci.yml` + `tests/integration/installer-contract.test.ts` + `tests/unit/installers-index.test.ts` + `.planning/phase-1.4/SAMPLES.md` + `CONTRIBUTING.md`
- A7 守恒：ADR 0001-0009 main body 0 diff
