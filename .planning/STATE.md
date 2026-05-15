# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> 最后更新：2026-05-15（**Phase 2.1 SHIPPED** — 4 placeholder installer 实装完成（mcpHttpAdd / gitCloneWithSetup / ccPluginMarketplace / npxSkillInstaller）+ Wave 0 schema 前置（license whitelist MIT-0+anthropics-official / license_source / provides[] / install_type enforce）+ sister review 结构性根治（TRANSPARENCY-VERDICT-CHECKLIST CI gate W3 warn-only + CONTRIBUTING SSOT 引用纪律）+ ADR 0010 errata；E1-E8 8/8 acceptance bar；6 install method 全 runtime-ready，phase21Placeholder 删除；10 ADR + 10 baseline tag（pending T6.5 main agent tag push）；tests 318+3 → 374+3。前置 **🚀 v0.2.0 MILESTONE ACTIVE**；前置 **🎯 v0.1.0 MILESTONE SHIPPED & ARCHIVED**：6/6 phase + audit passed + git tag v0.1.0）

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」——routing engine v1 已实装（main-process-driven query→arbitrate→install missing→factory→spawn→ralph-loop→verbatim COMPLETE 闭合）；6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
- **当前关注**：v0.2.0（Sub-task Loop + Extension Installers，Phase 2.1-2.4 — Phase 2.1 ship 后 6 install method 全 runtime-ready + ADR 0010 schema errata + **transparency 反模式 CI gate 结构性根治**；下一 Phase 2.2 execute-task workflow + ralph-loop full integration + SDK INTRODUCE NOW + per-phase model tier per intel + transparency CI gate `ENFORCE` flip 为 true）
  - **W-1 errata（phase 1.5 T8.1 修正）**：phase 1.4 STATE.md 本行原写 "7 接口契约 frozen for phase 1.5" — 实际 phase 1.4 PLAN.md § 4 列 8 个（第 8 = SAMPLES inline truth table 30 entries）；phase 1.5 KICKOFF + PLAN § 4 + 本文件 line 22/357 全部写 8。phase 1.5 T8.1 sync 修正 7 → 8（gsd-plan-checker PLAN-CHECK round 1 W-1 finding）
  - **当前关注 sister review M1 修正（2026-05-15 phase-2.1 sister review）**：本行原写 "v0.1.0（manifest 引擎 + research workflow） — phase 1.5 ship 后..." — 实际 v0.1.0 已 100% SHIPPED & ARCHIVED + Phase 2.1 SHIPPED。已 sync 到 v0.2.0 当前 phase。沿袭 intel § 0 SSOT 引用纪律 — phase 编号语义锚定。
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 **17 phases** v3 重排后）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：✅ **Phase 2.1 SHIPPED**（2026-05-15 — 4 placeholder installer 实装 + Wave 0 schema/sister-review/docs batch；E1-E8 8/8 acceptance bar；6 install method 全 runtime-ready）— 前置 🚀 **v0.2.0 MILESTONE ACTIVE**；前置 ✅ v0.1.0 SHIPPED & ARCHIVED（6/6 phase；git tag `v0.1.0`）
- **当前里程碑**：v0.2.0 Sub-task Loop + Extension Installers（Phase 2.1-2.4；roadmap 骨架原 /autoplan + v3 重排时定，本次 research refresh 保留骨架 + fold 11 refinement）— **Phase 2.1 1/4 完成**
- **下一 phase**：**Phase 2.2** discuss-phase（execute-task workflow 主线 + ralph-loop full integration + `@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE NOW + transparency CI gate flip ENFORCE = true + 起 ADR 0011 errata — ADR 编号由 Phase 2.2 plan-phase 流程分配，不预占）
- **状态**：✅ **Phase 2.1 SHIPPED — Ready for Phase 2.2 discuss-phase**（T6.4 CI run 25900941988 三平台全绿 + T6.5 tags `adr-0010-accepted` + `v0.2.0-alpha.1-installers` pushed to origin → `b9c932a`；含 phase 2.1.1 hotfix CI lint）
- **进度**：7 / 17 phases 已完成 ▓▓▓▓▓▓▓░░░░░░░░░░ 41.2%（v0.1.0 里程碑 100%；v0.2.0 1/4 = 25%）
- **research refresh 关键决议**：D1.5-5 SDK → **Phase 2.2 INTRODUCE NOW**（`@anthropic-ai/claude-agent-sdk` 0.2.141）；R6 ralph-wiggum plugin → **不切换**（自实装 ralphLoopWrap 是正确永久架构）；Phase 2.2 起 schema errata ADR 含 SDK 引入 + ralph-wiggum keep-vs-switch + **per-phase model tier**（`.planning/intel/omc-comparison.md` 第 4 条 — phases schema 加 `model:` 字段）—— **ADR 编号由 Phase 2.2 plan-phase 流程分配，不预占**（沿袭 intel § 0 SSOT 引用纪律；Phase 2.1 CONTEXT D-08 暂记 0011，以 plan-phase 实占为准）。注：H3 agentDefinition budget errata 已归 **Phase 2.1 ADR 0010**（installer-schema-extension-errata），非 Phase 2.2 范围

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 (P1.1+P1.2+P1.2.5) / 2026-05-13 (P1.3+P1.4) / 2026-05-14 (P1.5) |
| v0.2.0 Sub-task Loop + Extension Installers | 1/4 | 🚀 ACTIVE — Phase 2.1 SHIPPED 2026-05-15；Phase 2.2 待启动 | 启动 2026-05-15 / Phase 2.1 ship 2026-05-15 |
| v0.3.0 plan-feature + checkpoint | 0/4 | Not started | - |
| v0.4.0 dogfooding + 稳定期 | 0/3 | Not started | - |

### 下一步行动

1. ✅ ~~Phase 1.1 全 47 子任务完成~~ — 2026-05-12 ship
2. ✅ ~~ADR 0001 / 0002 / 0003 全部 accepted~~ — schema v1 frozen
3. ✅ ~~两个 local tag 打好~~ — `adr-0001-accepted` + `v0.1.0-alpha.1-schema-frozen`（已 push 到 origin）
4. ✅ ~~A4 acceptance bar~~ — CI run 25686045249 @ 92b355c 三平台全绿；**Phase 1.1 全 8/8 ✅**
5. ✅ ~~Phase 1.1.1 hotfix~~ — 9 项 paranoid review fixes shipped (B1+B2+M1+H1-H7)；tests 71→89；ADR 0001/0002 不动 (A7 守恒)
6. ✅ ~~Phase 1.2 SHIPPED~~ — 2026-05-12；installer runtime ready；B1'-B9' 9/9 acceptance bar；ADR 累积 5；tests 89→202+1 skipped
7. ✅ ~~Phase 1.2.1 hotfix~~ — 2026-05-12；B5' CI fail fix (commit `bad2f20` — `set +o pipefail` in ok_or_dryrun helper)；CI run 25721497734 三平台全绿；**B5' acceptance bar 实测达成**（见 phase-1.2/progress.md § B F32）
8. ✅ ~~Phase 1.2.5 architecture revision SHIPPED~~ — 2026-05-12；ADR 0006 wedge 重定位（"装配主义包管理器" → "完整三层栈方法论的可执行 engine"）；8 支柱 100% capture lock + 5 P0 决策 lock；6 baseline tag 全部加入 A7 守恒 iterate；ROADMAP v3 重排 16 → 17 phase（加 phase 1.2.5 + phase 1.5）；不动已 ship 代码 (A7 守恒)
9. ✅ ~~Phase 1.3 SHIPPED~~ — 2026-05-13；base profile + categorization schema + decision_rules.yaml v1；B1-B8 8/8 acceptance bar；ADR 累积 7（加 0007 errata）；baseline tag 5 → 7（加 adr-0006-accepted retag → 3e24c16 + adr-0007-accepted）；tests 202+1 → 235+1 skipped (+33)；含 phase 1.3.1 hotfix bundle（F37/F38/F39 — sister review patch round 6/8 applied + 2 deferred）；详 `.planning/phase-1.3/{progress.md, VERIFICATION.md, PERF-ATTRIBUTION.md}`
10. ✅ ~~main agent tag `v0.1.0-alpha.3-base-profile`~~ — pushed
11. ✅ ~~Phase 1.4 SHIPPED~~ — 2026-05-13；routing engine v1 + AgentDefinition factory + research workflow E2E + 30 sample 100.0% hit (**expected behavior match**；specific rule match 21/30 = 70% — 9 plan-phase expected fallback/fallthrough：engineering 5/5 v1 占位 0 rules 走 fallback_supervisor + 4 array trigger v1 miss fallthrough；array semantic match 升级推 phase 1.5 DAG resolver — sister review T1 transparency strengthening)；C1-C8 8/8 acceptance bar；ADR 累积 8（加 0008 errata 含 H1a perf transparency + M1 yaml path migration + R6 engineering category 推 phase 1.5）；baseline tag 7 → 8（加 adr-0008-accepted）；tests 235+1 → 291+2 skipped (+56)；CI run 25804037789 @ 8f56514 + 25805032247 @ fe97a72 三平台全绿；详 `.planning/phase-1.4/{progress.md, VERIFICATION.md}`
12. ✅ **main agent tag `v0.1.0-alpha.4-routing-engine` pushed** — fe97a72；4 milestone tag 累积（alpha.1-schema-frozen / alpha.2-installer-runtime / alpha.3-base-profile / alpha.4-routing-engine）
13. ✅ ~~Phase 1.5 SHIPPED~~ — 2026-05-14；DAG resolver Kahn 拓扑排序 + Semantic Router L2 stub + engineering 5 routing rules + mattpocock 23 招式 phase routing schema + ADR 0009 errata 4 items（D1.4-2 contract v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum `<promise>` XML wrapper）；D1-D8 8/8 acceptance bar；ADR 累积 8 → 9（加 0009 errata）；baseline tag 8 → 9（加 adr-0009-accepted）；tests 291+2 → 318+3 skipped (+27)；30 sample specific match 28/30 (93.3%) ≥ 27/30 + total 30/30；3 routing 新文件（dag.ts 142L / semanticRouter.ts 81L / promiseExtract.ts 32L）+ embedding.ts 17L placeholder + decision_rules.yaml v2 + spec.ts phase+triggers；8 支柱 100% capture verify roadmap closure（A1' engineering 5 rules / A5' mattpocock_phases / A7' triggers semantic L2 stub 全 CLOSED）；详 `.planning/phase-1.5/{progress.md, VERIFICATION.md, PERF-ATTRIBUTION-2.md}`
14. ✅ ~~main agent tag `adr-0009-accepted` + `v0.1.0-alpha.5-routing-l2-engineering` pushed~~
15. ✅ ~~v0.1.0 MILESTONE SHIPPED & ARCHIVED~~ — 2026-05-15；audit `passed` post-reconciliation Path A；归档 `.planning/milestones/v0.1.0-{ROADMAP,REQUIREMENTS}.md`；git tag `v0.1.0` pushed
16. ✅ ~~Phase 2.1 SHIPPED~~ — 2026-05-15；4 placeholder installer → 6 install method 全 runtime-ready + Wave 0 schema/sister-review/docs batch；E1-E8 8/8；ADR 累积 10（加 0010 installer-schema-extension-errata）；baseline tag 10（加 adr-0010-accepted）；tests 318+3 → 374+3 (+56)；CI run 25900941988 三平台全绿；详 `.planning/phase-2.1/{progress.md, VERIFICATION.md}`
17. ✅ ~~Phase 2.1.1 hotfix~~ — 2026-05-15；CI lint failure fix (commit `b9c932a` — biome `organizeImports` auto-fix on `src/installers/index.ts` + `tests/unit/installers-index.test.ts` post-Wave-5 dispatch swap)；CI run 25900941988 三平台全绿；同 commit 触发 final ship CI verify
18. ✅ ~~main agent tag `adr-0010-accepted` + `v0.2.0-alpha.1-installers` pushed~~ → `b9c932a`；10 ADR baseline tag + 5 milestone tag 累积
19. ⏳ **transparency CI gate `ENFORCE` flip 为 `true`**（Phase 2.2 Wave 0 必办）— `scripts/check-transparency-verdicts.mjs` 顶部 const + 历史 verdict 文档迁移到结构化 marker（`Verdict:` / `状态:` / `Closure:` 行首 + `\d+/\d+` ratio + `miss:` 声明）；W3 lock from Phase 2.1 T1.7 — 当前 warn-only round 1
20. ⏳ **进入 Phase 2.2 discuss-phase**（execute-task workflow 主线 + ralph-loop full integration + `@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE NOW + per-phase model tier per intel omc-comparison.md 第 4 条 + 起 schema errata ADR — 编号由 Phase 2.2 plan-phase 流程分配,不预占）
21. ⏳ **phase 2.2 Wave 0 候选 — transparency CI gate 扩展覆盖 README/PROJECT-SPEC 状态节 freshness check**（sister review 洞察:T1.9 把 SSOT 引用纪律提升项目级但 README/PROJECT-SPEC 自身 stale；T1.7 CI gate 当前只扫 verdict 文档,可扩展为 doc freshness gate — Phase 2.2 plan 时评估）

---

## 已完成（Completed）

- ✅ **Phase 2.1 SHIPPED**（2026-05-15）
  - 23 atomic 子任务全部完成（Wave 0-5；T1.9 user-directed post-Wave-C 加入；详 `.planning/phase-2.1/{progress.md, VERIFICATION.md}`）
  - **Acceptance bar E1-E8 8/8** ✅
    - E1 ADR 0010 draft — `docs/adr/0010-installer-schema-extension-errata.md` ≥ 100L 6-section（Status/Context/Decision/Consequences/Compliance/Errata-path note）+ 7 关键 decision 项命中（license_source / provides / H3 / H4 / --header / MIT-0 / anthropics-official）；errata 沿袭 ADR 0008/0009 风格
    - E2 schema 扩展 — `spec.ts` license whitelist `MIT-0` + `anthropics-official` + `license_source` 4-enum optional 字段 + `ProvidedUnit` schema（id + component_type + `minItems: 2` + `uniqueItems: true`）；`validate.ts` install_type↔method cross-field refinement；`decision_rules.yaml` 移除 chinese-content-deck rule `warn:`；3 schema test 文件 ≥13 新 cell（5 license + 5 bundle + 3 install-type）
    - E3 transparency 纪律基建 — `TRANSPARENCY-VERDICT-CHECKLIST.md` 定义 `Verdict:`/`状态:`/`Closure:` marker 约定 + `check-transparency-verdicts.mjs` CI gate W3 warn-only round 1（`ENFORCE = false`；phase 2.2 flip enforce）+ M1 SAMPLES § 8.4 标注 2/30 miss 身份 + CONTRIBUTING.md SSOT 引用纪律 section（语义锚定 phase 编号 + ADR 编号绝不预占 + 反面教材）
    - E4 mcp-http-add — `mcpHttpAdd.ts` (clone mcpStdioAdd ~85%) + D-12 hardcode `--scope project` + D-16 `--header ${ENV_VAR}` env-resolution carve-out（B1 gate 零改动 — resolve 在 args 构造前）+ `.mcp.json` entry shape `{type:'http',url,headers}` + verify `claude mcp list | grep -q ${name}` exit-code；unit test ≥6 cell
    - E5 git-clone-with-setup — `gitCloneWithSetup.ts` (~55% reuse npmCli orchestrator + mcpStdioAdd preflight/verify) + inline `gitRevParseHead` ≤10L (D-15 — 单 caller YAGNI 不建 lib/gitVerify.ts) + strict SHA-only enforcement (ADR 0001 reproducibility — `git rev-parse HEAD` returns SHA，authority must be SHA)；unit test ≥6 cell
    - E6 cc-plugin-marketplace — `ccPluginMarketplace.ts` (~65% clone mcpStdioAdd direct-spawn + two sequential `runArgs`) + D-20 idempotency（step-1 `marketplace add` 非零退出非致命 IF step-2 `plugin install` 成功）+ D-12 hardcode `--scope project` + diff target `.claude/settings.json` `enabledPlugins` + verify `claude plugin list --json | grep -q <pluginName>` exit-code；unit test ≥6 cell
    - E7 npx-skill-installer — `npxSkillInstaller.ts` (~50% reuse npmCli npx 模式) + flexible pin enforcement（preflight enforce `skills@<version-spec>` shape forbidding `@latest`，不 hardcode `1.5.7`）+ `--copy` + `--global` 强制（D2.1-5 — Win symlink-safe + user scope）+ **D2.1-6 CRITICAL real-path verify** (`fs.access('~/.claude/skills/<name>/SKILL.md')` — 真实路径，非 npx exit code；D-02 ~/.agents/ vs ~/.claude/ bridge known limitation logged)；unit test ≥6 cell
    - E8 dispatch table + contract + CI + tag — `src/installers/index.ts` 6 method dispatch table 全覆盖 + `phase21Placeholder` 删除（4-line swap + 4 imports + 1 deletion per PATTERNS § 4）；`tests/integration/installer-contract.test.ts` extend 4 新 factory + `methods` 数组扩 2→6 + `SYSTEM_FLAG_REQUIRED` Set + `CLAUDE_CLI_METHODS` Set（区分 L4 npm-cli vs L2/L3 + 区分 claude-CLI 走者）— 36 cell（6 method × 6 contract）全绿；ci.yml A7 step iter 1-9 → 1-10（两处 for loop + step name + 注释更新 + phase 2.1 errata 说明注释）；A7 守恒 ADR 0001-0009 main body 0 diff；CI 三平台全绿 verify + push + `adr-0010-accepted` tag main agent T6.5 创建
  - **6 wave 完整跑完**：Wave 0 ADR 0010 + schema 4 项 + transparency CI gate W3 + M1 + CONTRIBUTING SSOT (T1.1-T1.9) / Wave 1 mcpHttpAdd (T2.1+T2.2) / Wave 2 gitCloneWithSetup (T3.1+T3.2) / Wave 3 ccPluginMarketplace (T4.1+T4.2) / Wave 4 npxSkillInstaller (T5.1+T5.2) / Wave 5 dispatch + contract test + ci.yml A7 iter 1-10 + STATE/progress/VERIFICATION (T6.1-T6.6)
  - **6 install method 全 runtime-ready** — npm-cli + mcp-stdio-add（phase 1.2 ship）+ mcp-http-add + git-clone-with-setup + cc-plugin-marketplace + npx-skill-installer（phase 2.1 ship）；`phase21Placeholder` const + 注释引用 全删
  - **新 ADR**：0010 installer-schema-extension-errata（A7 守恒：ADR 0001-0009 main body 0 diff；license whitelist MIT-0 + anthropics-official + license_source audit + bundle-install provides[] + install_type↔method 1:N enforcement + H3 agentDefinition budget ≤200L errata + H4 substring match known limitation + D-16 --header env-resolution carve-out）
  - **新 baseline tag**：9 → 10（加 `adr-0010-accepted`；CI A7 step iterate 1-10 全 10 ADR 守恒）；候选 milestone tag `v0.2.0-alpha.1-installers`
  - **新文件**：`docs/adr/0010-installer-schema-extension-errata.md` + `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + `src/installers/{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.ts` + `tests/unit/installers-{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.test.ts` + 3 schema test 文件 + `.planning/phase-2.1/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, progress.md, VERIFICATION.md}`；**修改**：`src/manifest/schema/spec.ts` + `src/manifest/validate.ts` + `src/installers/index.ts` + `routing/decision_rules.yaml` + `.github/workflows/ci.yml` + `tests/integration/installer-contract.test.ts` + `tests/unit/installers-index.test.ts` + `.planning/phase-1.4/SAMPLES.md` + `CONTRIBUTING.md`
  - **9 finding logged**：Wave 1-4 — F2.1-1 (Rule 2 schema-gap parse-from-cmd × 3：mcp-http url+headers / git-clone dest / cc-plugin marketplaceRef+plugin@mkt — cmd 保留 audit-trail，args authoritative) / F2.1-2 (Rule 2 git-clone strict SHA-only enforcement — schema 允许 SHA OR SemVer，installer enforce SHA-only) / F2.1-3 (Rule 2 npx-skill flexible pin enforcement — preflight 验 pin shape 不 hardcode `1.5.7`)；Wave 5 — F2.5-1 (Rule 1 stale phase-deferred tests 替换为 dispatch identity 测试) / F2.5-2 (Rule 1 contract test C5 mcp-cli-only regex tighten — 原 `\bclaude\b` 误命中 `claude-code` 因 `\b` 在 `e-`) / F2.5-3 (Rule 1 cc-plugin fixture git_ref 40-hex SHA compliance — preflight GIT_REF_SHAPE) / F2.5-4 (Rule 2 contract test mock `fs.access` for npx-skill real-path verify)；Wave 0 known limitations — D-02 npx ~/.agents/ vs ~/.claude/ 完整桥接 deferred / H4 substring match false-positive v0.2+ semantic router 替代
  - **sister review 结构性根治**：T1.8 SAMPLES § 8.4 miss 身份标注（防 phase 1.4 T1 "100% 实际 70%" + phase 1.5 H1/M1 "聚合数字盖过真实状态" 反模式第三次复发）+ T1.7 TRANSPARENCY-VERDICT-CHECKLIST CI gate（W3 warn-only round 1 + phase 2.2 flip enforce）+ T1.9 CONTRIBUTING SSOT 引用纪律 section（intel/参考文档不写死 phase/ADR 编号 — 反面教材 omc-comparison.md 写死 "phase 2.0" + "ADR 0010" v0.2.0 激活即 stale）
  - 见 `.planning/phase-2.1/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- ✅ **Phase 2.1.1 hotfix SHIPPED**（2026-05-15）
  - phase 2.1 ship 触发 CI run 25900868139 三平台全 fail — biome `organizeImports` 强制排序规则 reject Wave 5 T6.1 dispatch table swap + Wave 5 F2.5-1 stale-test 替换为 dispatch identity 测试时新增的 4 个 import 未按 biome 字典序排
  - 2 atomic 文件 fix — `src/installers/index.ts` + `tests/unit/installers-index.test.ts`（`corepack pnpm exec biome check --write` auto-fix）；可修复因为是 FIXABLE rule
  - 1 atomic commit `b9c932a` — phase-2.1.1: hotfix CI lint；CI run 25900941988 三平台全绿；ADR 0001-0010 main body 不动 (A7 守恒)；同 commit 触发 final ship CI verify + `adr-0010-accepted` / `v0.2.0-alpha.1-installers` tag push
  - **Root cause + lesson**：executor 本地 lint 看到 `.omc/` errors（untracked tooling state）覆盖了真正问题的可见性 — 后续 executor 报告需 disambiguate "errors in changed tracked files" vs "errors in untracked tooling state"。沿袭 phase 1.2.1 / 1.3.1 / 1.5.1 hotfix 模式
  - 见 `.planning/phase-2.1/progress.md`（hotfix 节附加）
- ✅ **Phase 1.5 SHIPPED**（2026-05-14）
  - 28 atomic 子任务全部完成（Wave 0-7 跑完；4 batch — batch 1 Wave 0+1 / batch 2 Wave 2+3 / batch 3 Wave 4+5 / batch 4 Wave 6+7）
  - **Acceptance bar D1-D8 8/8** ✅
    - D1 DAG resolver + 拓扑排序实装 — `dag.ts` 142L ≤ 200L Kahn iterative（BFS + indegree queue，自实装无外部 graph library）+ cycle detect（E_DAG_CYCLE）+ 三态 `DagResolveResult` discriminated union（F41 takeaway）+ ≥ 10 unit cell
    - D2 Semantic Router L2 stub — `semanticRouter.ts` 81L ≤ 150L（v0.1 stub return null，contract frozen for v0.2+ embedding swap-in）+ `lib/embedding.ts` 17L ≤ 30L placeholder interface only + ≥ 8 unit cell
    - D3 engineering 5 rules + 30 sample re-test — `decision_rules.yaml` v2 engineering category 5 specific rules（A1' enforcement，R6 mitigation 完成）；30 sample specific match **28/30 (93.3%)** ≥ 27/30 threshold + total 30/30 (100%)
    - D4 mattpocock_phases schema + manifest spec phase + triggers — `decision_rules.yaml` v2 `mattpocock_phases:` 段（4 phase × 21 unique skills × 23 trigger entry）+ `spec.ts` 加 `phase`（4-value `Type.Union` enum：discuss/plan/execute/verify）+ `triggers`（`Type.Object`）；**注意：项目 manifest schema 用 TypeBox（`@sinclair/typebox`）不是 zod — PLAN § 6 D4 原 `grep "phase: z.enum"` 命令错误，正确验证见 VERIFICATION.md § 1 D4**
    - D5 ADR 0009 errata 4 items + agentDefinition 14 字段 + XML wrapper — ADR 0009 errata 4 sub-item inline（D1.4-2 v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum `<promise>` XML wrapper）+ `agentDefinition.ts` 191L 14 字段（phase 1.4 12 + `initialPrompt` Stable + `criticalSystemReminder_EXPERIMENTAL` Experimental）+ `systemPrompt.ts` 53L `<promise>COMPLETE</promise>` XML wrapper + `lib/promiseExtract.ts` 32L（W-2 hard split — ralphLoop.ts 收回 65L）+ contract v1.1 errata（A7 守恒 main body 0 diff）
    - D6 PERF-ATTRIBUTION-2.md ship — ≥ 80L 8-section；DAG resolver hot path micro-bench：realistic 50-node 图 0.0096ms/call（**+0.96% regress** vs 保守 1ms baseline）≤ 5% threshold ✅ PASS；manifest validate hot path 0 regress（DAG 不调 `validateManifestFile`）
    - D7 ADR 0009 errata accepted + adr-0009-accepted tag — ADR 0009 232L 6-section（Status/Context/Decision/Consequences/Compliance/References）；tag main agent final ship step 创建
    - D8 Cross-OS CI 三平台全绿 + A7 step iter 1-9 — `ci.yml` A7 step iterate 1-8 → 1-9（`for n in 0001..0009` 9 ADR baseline tag 守恒）+ ADR 0001-0008 main body 0 diff（phase 1.5 只动 ADR 0009 + errata path）
  - **8 wave 完整跑完**：Wave 0 ADR 0009 errata draft + ci.yml A7 iter 1-9 / Wave 1 DAG Kahn + ralph-wiggum XML wrapper spike（SPIKE-REPORT-2.md 10/10 PASS GO）/ Wave 2 dag.ts + semanticRouter.ts + embedding.ts + engine.ts 升级 + index.ts barrel / Wave 3 decision_rules.yaml v2 + engineering 5 rules + mattpocock_phases 段 + migration script + decisionRules.ts arbitrate F42 / Wave 4 D5 ADR 0009 errata 实装（systemPrompt XML wrapper + ralphLoop + agentDefinition 14 字段 + spec.ts phase+triggers）/ Wave 5 routing-dag + routing-semanticRouter + routing-engine 升级 + 30 sample re-test + SAMPLES.md v2 / Wave 6 PERF-ATTRIBUTION-2.md + Cross-OS CI verify / Wave 7 docs + ship
  - **3 routing 新文件**：`src/routing/dag.ts`（142L Kahn iterative — Pattern Q）+ `src/routing/semanticRouter.ts`（81L v0.1 stub — Pattern R）+ `src/routing/lib/promiseExtract.ts`（32L `<promise>` XML wrapper extract — W-2 hard split）；+ `src/routing/lib/embedding.ts`（17L placeholder interface — D1.5-2 推 v0.2+）+ `src/routing/index.ts` barrel re-export 扩展
  - **新 ADR**：0009 routing-l2-engineering-23-shi-errata（A7 守恒：ADR 0001-0008 main body 0 diff；D5 三 P1 + 1 fresh deferred items errata 4 sub-item inline + DAG + Semantic Router L2 + mattpocock_phases schema 接口契约升级）
  - **新 baseline tag**：8 → 9（加 `adr-0009-accepted`；CI A7 step iterate 1-9 全 9 ADR 守恒）
  - **新文件**：`docs/adr/0009-routing-l2-engineering-23-shi-errata.md` + `src/routing/{dag.ts, semanticRouter.ts, lib/embedding.ts, lib/promiseExtract.ts}` + `scripts/migrate-decision-rules-v1-to-v2.mjs` + `scripts/spike/{dag-and-promise-xml.sh, dag-bench.mjs}` + `tests/unit/{routing-dag, routing-semanticRouter}.test.ts` + `.planning/phase-1.5/{KICKOFF.md, PATTERNS.md, RESEARCH.md, ASSUMPTIONS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, SPIKE-REPORT-2.md, progress.md, PERF-ATTRIBUTION-2.md, VERIFICATION.md}`；**修改**：`routing/decision_rules.yaml`（v1 → v2）+ `src/manifest/schema/spec.ts`（加 phase + triggers）+ `src/routing/{engine.ts, agentDefinition.ts, systemPrompt.ts, lib/ralphLoop.ts, decisionRules.ts}` + `.github/workflows/ci.yml`（A7 iter 1-9）+ `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`（v1.1 errata）+ `.planning/phase-1.4/SAMPLES.md`（v2）
  - **findings logged**：W-1（STATE.md 7→8 接口契约 numeric drift — phase 1.5 T8.1 sync 修正 + errata 注）/ W-2（ralphLoop.ts ≤ 50L wedge soft-overflow — hard split lib/promiseExtract.ts 32L，ralphLoop.ts 收回 65L）/ S-1（systemPrompt.ts budget tighten ≤ 80L → ≤ 60L，实测 53L）/ S-2（task_plan T6.4/T6.5 action outline 过宽 — 吸收进 batch 3 T6.4 atomic 范围）/ F-note（D4 acceptance command 更正 — TypeBox 不是 zod）
  - **8 支柱 capture roadmap**：A1' engineering 5 rules ✅ CLOSED（T4.1 yaml v2）/ A5' mattpocock_phases ✅ CLOSED（T4.1 yaml v2 4×21×23）/ A7' triggers semantic L2 → **INTERFACE CLOSED / CAPABILITY DEFERRED v0.2+**（T3.2 `semanticRouter.match()` 是 return null stub — 接口契约 ship 非语义匹配能力实现；真实 embedding kNN 推 phase 2.x。**sister review H1 修正**：return null stub 是 "interface contract shipped" 不是 "capability captured"，不标裸 "CLOSED" 避免 SSOT 顶行误导"100% 全实现"）
  - 见 `.planning/phase-1.5/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, PERF-ATTRIBUTION-2.md, SPIKE-REPORT-2.md}`
- ✅ **Phase 1.4 SHIPPED**（2026-05-13）
  - 21 atomic 子任务全部完成（Wave 0-7 跑完；详 `.planning/phase-1.4/progress.md` § A.4）
  - **Acceptance bar C1-C8 8/8** ✅
    - C1 main-process-driven routing engine 实装 — `engine.ts` 170L ≤ 200L + ≥ 10 unit cell (12 实测) + verbatim COMPLETE 闭合 (Wave 6 CI verify run 25804037789 三平台全绿)
    - C2 AgentDefinition factory 实装 — `agentDefinition.ts` 148L ≤ 150L + 12 字段 1:1 contract + 4 typed error class
    - C3 6 category routing rules MVP execute — 30 sample 命中率 100.0% (30/30) ≥ 85% baseline；design/content/testing/search/meta 全 5/5；engineering 全 fallback_supervisor
    - C4 research workflow E2E — `research.ts` 93L ≤ 100L + `cli.ts` 9th register fn + integration test +3 mock cell + 1 real-spawn skipIf gate
    - C5 systemPrompt verbatim COMPLETE — `systemPrompt.ts` 43L ≤ 80L + 1:1 对齐 contract § 5.4 + D-18 enforce
    - C6 30 真实查询样本路由命中率 ≥ 85% — 实测 100.0% (30/30) ✅；per-category 全 5/5；4 F42 fallthrough corrected
    - C7 Cross-OS CI 三平台全绿 + A7 step iter 1-8 ✅ (run 25804037789 @ 8f56514；macOS 1m18s / Win 58s / Ubuntu 36s)
    - C8 ADR 0008 errata accepted + adr-0008-accepted tag pushed (172L 6-section)
  - **8 wave 完整跑完**：Wave 0 ADR 0008 errata + ci.yml A7 iter 1-8 / Wave 1 spike main-process query() API 实证 + SPIKE-REPORT 7 anchor decisions / Wave 2 engine.ts + agentDefinition.ts + systemPrompt.ts 实装 / Wave 3 engine + agentDefinition unit (+21 cell) / Wave 4 research workflow E2E sub-routing / Wave 5 SAMPLES.md + 30-sample integration test (Pattern P) / Wave 6 cross-OS CI verify (T7.3 perf attribution 跳过 — routing engine 不调 manifest validate hot path 0 perf 影响) / Wave 7 docs + ship
  - **3 routing 文件**：`src/routing/engine.ts`(170L Pattern N — 主流程编排) + `src/routing/agentDefinition.ts`(148L 12 字段 + 4 typed error + 4 心法 prepend D1.4-14) + `src/routing/systemPrompt.ts`(43L Pattern O verbatim 1:1 contract § 5.4 D-18) + `src/routing/lib/ralphLoop.ts`(spillover) + `src/routing/index.ts`(barrel)
  - **新 ADR**：0008 routing-engine-v1-errata（A7 守恒：ADR 0001-0007 main body 0 diff；含 phase 1.3 deferred H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5）
  - **新 baseline tag**：7 → 8（加 `adr-0008-accepted`；CI A7 step iterate 1-8 全 8 ADR 守恒）
  - **新文件**：`docs/adr/0008-routing-engine-v1-errata.md` + `src/routing/{engine.ts, agentDefinition.ts, systemPrompt.ts, index.ts, lib/ralphLoop.ts}` + `src/cli/research.ts` + `tests/unit/routing-{engine, agentDefinition}.test.ts`(+21 cell) + `tests/integration/{routing-research-workflow, routing-30-samples}.test.ts`(+3+30 cell) + `scripts/spike/routing-spawn-agent.sh` + `.planning/phase-1.4/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md, SPIKE-REPORT.md, SAMPLES.md, progress.md, VERIFICATION.md}`
  - **3 finding logged**：F40-2 (SDK type alias deferred — agentDefinition.ts 改用本地 structural interface；karpathy YAGNI；推 phase 1.5 D1.4-2 errata window) / F41 (engine.test.ts narrow guard fix — TS strict union narrowing across no-discriminator variant；6 处 `if ('ok' in result && result.ok === false)` Rule 3 trivial auto-fix) / F42 (SAMPLES.md plan-phase hypothesis correction — 4 sample expected fallthrough not fallback; arbitrate v1 array-field miss → priority=50 default rule fallthrough hit；R3 frozen 边界澄清 expected/hypothesis 可改 prompt+category 不可改)
  - **Pattern N/O/P 新生**：Pattern N (engine.ts 主流程编排 ≤ 200L Wave 2 anchor) / Pattern O (systemPrompt.ts verbatim instructional template ≤ 80L D-18 1:1 contract § 5.4) / Pattern P (SAMPLES.md inline truth table ≥ 85% tolerance threshold 30 sample × 6 category v0.1 内部基线)
  - **15 D1.4-* 决策 lock**：D1.4-1 main-process query() API 实证路径 / D1.4-2 contract v1 frozen 不动 main body 守 A7（推 phase 1.5 errata） / D1.4-3 自实装 ralph-loop wrap ≤ 50L 是 wedge 原则 / D1.4-4 sequential MCP add + parallel ctx7 / D1.4-5 30 sample 选取标准 (6 category × 5 + ≥ 3 ambiguous) / D1.4-14 4 心法 always-on baseline inject / D1.4-15 research independent subcommand (D-15)
  - 见 `.planning/phase-1.4/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, SPIKE-REPORT.md, SAMPLES.md}`
- ✅ **Phase 1.3 SHIPPED**（2026-05-13）
  - 22 atomic 子任务全部完成（含 phase 1.3.1 hotfix bundle 6 commit; sister review F39 6/8 applied + 2 deferred；详 `.planning/phase-1.3/progress.md` § A.4）
  - **Acceptance bar B1-B8 8/8** ✅
    - B1 ADR 0007 errata accepted + adr-0007-accepted tag pushed (CI run 25790126213 三平台全绿验证)
    - B2 manifest schema 加 3 字段（category 6 enum / install_type 4 enum / decision_rules optional Object）+ `validate:schema` 通过
    - B3 schema unit tests +19 cell（>= 12 acceptance bar；分布 category 8 / install-type 6 / decision-rules 5 含嵌套 array+object reject mitigation）
    - B4 `routing/decision_rules.yaml` v1 (12 rules + version: 1 + fallback_supervisor) + arbitrate Priority Hit Policy +8 cell unit
    - B5 `harnessed install-base` 独立子命令 (D-9) + dry-run 三态输出 (D-11 installed/skipped/failed) + 5 cell unit
    - B6 ui-ux-pro-max install path 实测 PATH_A_OK + PATH_B_OK + manifest 创建 (路径 B git-clone-with-setup) + F36 finding logged
    - B7 AgentDefinition factory contract draft 12 字段 + signature + W-5 consumption + V1 BLOCKER 检查
    - B8 CI 三平台全绿（run 25790126213 @ 7c9b66f）+ A7 step iterate 1-7 全绿 + ADR 0001-0007 main body diff 0
  - **7 wave 完整跑完**：Wave 0 ADR 0007 errata + ci.yml A7 iterate 1-7 / Wave 1 schema 实装 (3 字段 + 10 manifest patch + 19 cell) / Wave 2 decision_rules.yaml v1 + arbitrate / Wave 3 install-base 子命令 (8 register fn) / Wave 4 ui-ux-pro-max install path 实测 / Wave 5 AgentDefinition factory contract / Wave 6 cross-OS CI verify + perf attribution / Wave 7 docs + ship
  - **3 schema 新字段**：`category` (6 enum: design/content/testing/search/meta/engineering required) / `install_type` (4 enum: ngm/npx/git/local required, 与 install.method 1:N 闭合) / `decision_rules` (optional per-manifest decision hint, schema 与 routing/decision_rules.yaml 全局 rule-set 完全独立 — B-1 区分)
  - **新 ADR**：0007 categorization-schema-extension errata（A7 守恒：ADR 0001 main body 0 diff；schema 加 3 字段 via errata 流程）
  - **新 baseline tag**：5 → 7（加 `adr-0006-accepted` retag → 3e24c16 [F37 retroactive 同 phase 1.2 F26 模式] + `adr-0007-accepted`）
  - **新文件**：`docs/adr/0007-categorization-schema-extension.md` + `routing/decision_rules.yaml`(179L) + `src/routing/decisionRules.ts`(105L) + `src/cli/install-base.ts`(102L) + `manifests/skill-packs/ui-ux-pro-max.yaml` + `scripts/probe/ui-ux-pro-max-install.sh`(108L) + `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `tests/unit/{routing-decisionRules,manifest-validate.{category,install-type,decision-rules},cli-install-base}.test.ts`(+32 cell) + `.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PERF-ATTRIBUTION.md, VERIFICATION.md}`
  - **5 finding logged**：F36 (ui-ux-pro-max install path 实测 — Win Git Bash PATH_A+B 双 OK / v4-next tip SHA e89d70e4bcd0) / F37 (ADR 0006 baseline tag 漂移 + retroactive 重打到 3e24c16) / F38 (CI Ubuntu perf gate 50.14ms 越线 + hotfix 50→75ms) / F39 (sister review patch round — 6/8 applied + 2 deferred [H1a phase 1.4 ADR 0008 errata; M2 v0.4 maintainer onboarding])
  - 见 `.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, PERF-ATTRIBUTION.md}`
- ✅ **Phase 1.2.5 architecture revision SHIPPED**（2026-05-12）
  - sister review challenge 后 architecture wedge 重定位（"装配主义包管理器" → "完整三层栈方法论的可执行 engine"）
  - 8 支柱 100% capture lock + 5 P0 决策 lock + ROADMAP v3 重排（16 → 17 phase，加 phase 1.2.5 + phase 1.5）
  - 12 sister review patches（H1+H2+H3+M1-5+L1-4 — commit 3e24c16 单 commit，ADR 0006 main body 加 "Quick Reference Snapshot" 段 + "8 支柱 100% Capture" 表 self-contained 改写）
  - 新 ADR 0006 architecture-wedge-revision-v3 + adr-0006-accepted baseline tag（phase 1.3 F37 retroactive 重打到 3e24c16 修复漂移）
  - 不动已 ship 代码 (A7 守恒严格遵守)；为 phase 1.3 implementation 铺路
  - 见 `.planning/phase-1.2.5/{ASSUMPTIONS.md, RESEARCH-1, RESEARCH-2, ADR-0006-DRAFT.md, progress.md, KICKOFF.md, PATTERNS.md}`
- ✅ **Phase 1.2.1 hotfix SHIPPED**（2026-05-12）
  - phase 1.2 ship 后 CI run 25718x fail — Wave 6 H4 dual-layer step 出错（ok_or_dryrun bash helper 在 Ubuntu/macOS pipefail strict mode 下 set -e 失效）
  - 1 atomic commit `bad2f20` — `set +o pipefail` in ok_or_dryrun helper（接受 mock-claude-cli.sh exit 0/2 dry-run sentinel 不被 pipefail 误吃）
  - CI run 25721497734 三平台全绿；**B5' acceptance bar 实测达成**
  - 见 `.planning/phase-1.2/progress.md` § B F32
- ✅ **Phase 1.2 SHIPPED**（2026-05-12）
  - 33 task ID / 37 atomic 子任务全部完成或合理 deferred（见 `.planning/phase-1.2/progress.md` § A.4 + § B.6 Wave retro）
  - **Acceptance bar B1'-B9' 9/9** ✅
    - B1' real-spawn ctx7 install ready (Wave 6 T5.6, skipIf gate, 1 skipped test)
    - B2' / B3' integration ready (T6.5 VERIFICATION.md § 1 复现命令)
    - B4' 12 contract tests 全绿 ✅ (Wave 6 T5.2 commit 7769535 — 6 contract × 2 method)
    - B5' Cross-OS CI dual-layer step ready (Wave 6 T5.5 H4 + mock-claude-cli.sh — push validates 3 platforms)
    - B6' tests ≥ 110 ✅ 当前 **202 + 1 skipped**（89 baseline → 202 = +113 / skipped: real-spawn）
    - B7' ADR 0001-0005 main body 守恒 ✅（5 baseline tag iterate, A7 step 实测 0 diff per F26 retroactive 0002 补齐）
    - B8' `harnessed doctor` 4-check 落地 ✅（Wave 5 T4.2 — Node ≥22 / MCP scope / jq present / Win bash flavor 含 WSL_DISTRO_NAME probe）
    - B9' `INSTALLER-CONTRACT.md` 182L + 6 契约 + 6-Q FAQ ✅ (Wave 7 T6.1)
  - **6 wave 完整跑完**：Wave 0 deps + ADR 0005 / Wave 1 types base / Wave 2 lib helpers L1 (5 helpers) / Wave 3 state.ts + 6 unit test (+56 tests) / Wave 4 3 installer + dispatcher / Wave 5 4 cli subcommands (含 M1 gc) / Wave 6 顶层 wire + 12 contract test + 19 method unit + 21 cli unit + ci.yml H4 + real-spawn skipIf / Wave 7 docs + verify
  - **2 install methods runtime-ready**：`npm-cli` + `mcp-stdio-add`；4 method placeholders unblock phase 2.1
  - **5 CLI subcommands** wired to commander root：install / doctor / audit / rollback / status / backup-list / gc（7 register fn — F31 followup 1）
  - **新 ADR**：0005 marketplace_source schema errata（F23 起源 → ADR 0001 main body 0 diff per A7 守恒）
  - **新 deps**：picocolors 1.1.1 + diff 9.0.0 + @clack/prompts 0.10.1（GA-2 § B 锁定）
  - **新 baseline tag**：`adr-0005-accepted`（5 tag total: 0001 / 0002 (retroactive d5589dd, F26) / 0003 / 0004 / 0005）
  - **新文件**：`docs/INSTALLER-CONTRACT.md`(182L) + `.planning/phase-1.2/VERIFICATION.md`(237L) + 7 lib helpers (`src/installers/lib/*.ts`) + 2 installer + dispatcher (`src/installers/{npmCli,mcpStdioAdd,index}.ts`) + 7 cli files (`src/cli/{install,doctor,audit,rollback,status,backup-list,gc}.ts`) + 12 contract test + 19 method unit test + 21 cli unit test + 1 real-spawn skipIf test + ci.yml H4 dual-layer step + scripts/ci/mock-claude-cli.sh
  - **9 finding logged**：F23 (executed predicted) / F24 (ready, awaiting CI push) / F25 (resolved) / F26 (auto-fix retroactive tag) / F27 / F28 / F29 / F30 / F31 (cluster — 4 followup actions)
  - 见 `.planning/phase-1.2/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- ✅ **Phase 1.1.1 hotfix SHIPPED**（2026-05-12）
  - paranoid staff engineer review 后续 — 9 项 fixes 全部 ship；ADR 0001/0002 main body 不动 (A7 守恒)
  - 10 atomic commits + 1 lint fix；tests 71→89（+18）：B1 security gate 9 + B2/M1 git_ref pattern 9
  - 见 `.planning/phase-1.1/progress.md` § B F19-F22；task_plan.md § "Phase 1.1.1 Hotfix Batch" 索引表
- ✅ **Phase 1.1 SHIPPED**（2026-05-12）
  - 47 atomic 子任务全部完成或合理 deferred（见 `.planning/phase-1.1/progress.md` § B F16 deferred 表）
  - 50 commits / 71 vitest passing / 10 manifests / 30+ fixtures / 3 SCHEMA.md / bench 21.7ms
  - **Acceptance bar 8/8 ✅** — A1/A2/A3/A4/A5/A6/A7/A8 全绿（A4: CI run 25686045249 三平台全绿 @ 2026-05-12，详见 § B F18）
  - 3 ADR accepted: 0001 schema v1 / 0002 toolchain / 0003 install method count errata
  - 2 local tag: `adr-0001-accepted`（A7 baseline sentry）+ `v0.1.0-alpha.1-schema-frozen`（milestone）
  - VERIFICATION.md（140L）+ CONTRIBUTING.md（139L）+ README expand（72L）+ MAINTAINER-ONBOARDING stub（50L）
  - GitHub Actions ci.yml（36L）3-OS × Node 22 matrix config-ready
- ✅ **gstack /autoplan 三关卡通过**（2026-05-11）
  - `/office-hours` + `/plan-ceo-review` + `/plan-eng-review`
- ✅ **PROJECT-SPEC v2 锁定**（2026-05-11）
  - 14 项决策已敲定（项目名 / License / 路由机制 / 上游版本锁等）
- ✅ **WORKFLOWS-MVP v2 锁定**（2026-05-11）
  - 3 个 workflow phases schema 标准化（plan-feature 作 reference implementation）
- ✅ **4 个 domain researcher 调研**（2026-05-11）
  - R01 竞品格局（HIGH） / R02 上游真实性（HIGH） / R03 集成机制（HIGH） / R04 失败模式（HIGH）
- ✅ **research synthesis（SUMMARY.md）**（2026-05-11）
  - 6 个核心 spec 修订建议 + ROADMAP ready-to-use 必含项 + 6 项拒绝清单
- ✅ **ROADMAP.md / STATE.md / REQUIREMENTS.md 创建**（2026-05-11）
- ✅ **6 项 spec 修订批量 patch**（2026-05-11）
  - PROJECT-SPEC.md v2 → v2.1（§ 2 上游清单 / § 5.1 跨 harness 损失 / § 7 风险登记 + 5 新增 / § 8.3 hook 措辞重写 / § 8.4 MCP CLI 强制 / § 11 cross-OS 前移）
  - WORKFLOWS-MVP.md v2 → v2.1（research MCP scope project + Windows wrapper / execute-task ralph-loop max-iterations + Windows fix / plan-feature gstack 双路径变量插值 / 跨 workflow upstream_health 降级）
- ✅ **3 项 P0 决策敲定**（2026-05-11）
  - manifest type = 4 type + install.method 子枚举（schema 简洁性优先）
  - gstack v0.1 验证 = 双路径（plugin 化预留 + git-clone-with-setup 实证）
  - 6 项 spec 修订全部立即批量 patch（避免文档分叉）
- ✅ **ADR 0001 manifest schema v1**（2026-05-11）
  - 完整 schema 冻结 + type×method 矩阵 + component_type 语义
- ✅ **ADR 0002 repo structure + toolchain v0.1**（2026-05-11）
  - single package + pnpm 10 + tsup + pure ESM + vitest 4 + commander + biome 2
- ✅ **ADR 0003 install method count errata**（2026-05-12）
  - install method 数 5→6 文档对齐（SPEC + REQUIREMENTS + ROADMAP + STATE）；ADR 0001 main body 守恒
- ✅ **GSD discuss-phase 1**（2026-05-11）
  - ASSUMPTIONS.md（A 8 / B 9 / C 6）+ GA-1 (Ajv+TypeBox) + GA-2 (toolchain)
- ✅ **GSD plan-phase 1**（2026-05-11）
  - PLAN.md（339L）+ task_plan.md（1528L · 47 原子子任务）+ progress.md（含 § B Findings tracker）
  - plan-checker verdict ⚠️ APPROVED WITH CONDITIONS — V1 BLOCKER（5→6 install method）已 patch
- ✅ **GSD execute-phase 1.1 (batch 1-6)**（2026-05-11 → 2026-05-12）
  - batch 1 (T1+T2 wave 1) / 1.5 (T1 残项) / 2 (T3+T4 wave 2) / 3 (T5+T6 wave 3) / 4 (T7 wave 4) / 5 (T8 wave 5) / 6 (T9+T10 wave 6+7)

---

## 进行中（In Progress）

[当前无 — Phase 1.5 SHIPPED；v0.1.0 里程碑全部完成；等待 main agent final ship step（CI 三平台全绿 verify + push tag `adr-0009-accepted` + `v0.1.0-alpha.5-routing-l2-engineering`）+ 启动 Phase 2.0]

---

## 待办（按优先级）

### P0 — Phase 1.5 启动前

1. ⏳ **Phase 1.4 push tag `v0.1.0-alpha.4-routing-engine`** (T8.3；main agent 决定时机；CI 已三平台全绿验证 — run 25804037789 @ 8f56514)
2. ⏳ **Phase 1.5 discuss-phase 启动**（DAG resolver + Semantic Router L2 embedding kNN + engineering category routing rules + mattpocock 23 招式 phase routing schema）
3. ⏳ Phase 1.5 plan-phase（task 拆分 + planning-with-files 落地 task_plan）
4. ⏳ Phase 1.5 ADR 0009 候选评估（`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata D1.4-2 + array semantic match 升级 R5/F42 fallthrough → match）

### P1 — Phase 1.5 周期

5. **Phase 1.5 DAG resolver Day 1 实装**（R04 P0#4；不允许 sequential 拖到 v0.3）
6. **Phase 1.5 Semantic Router L2 升级**（embedding kNN 语义增强；高频 workflow 模式编码）
7. **Phase 1.5 engineering category routing rules + mattpocock 23 招式 phase routing schema** — 完成 8 支柱 A1' / A5' enforcement (phase 1.4 R6 mitigation)
8. **`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata 评估**（D1.4-2 — fresh 2026 RESEARCH § 2 暴露的 2 新字段）
9. **F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估**（推 phase 1.5 D1.4-2 errata window — 视 research workflow E2E 是否需要 query() 真实调用决定 deps 引入；karpathy YAGNI 至 phase 1.5）
10. **`--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估**（D1.4-3；v0.2+ 评估窗口）
11. **routing schema strict 校验**（v0.3 phase 1.4 → 实际已在 phase 1.3 落地 routing/decision_rules.yaml schema 验证）

### P2 — 跨里程碑预留

12. `mutually_exclusive_with` 字段在 schema v1 已留占位（v0.2 dogfooding 时观察 planning-with-files vs superpowers/writing-plans 实际语义）
13. gstack-2 / GSD-2 v2 重写迁移策略（v1.0+ 议题，schema 留迁移接口）
14. sigstore / cosign 签名集成（v0.4+ 议题，v0.1-0.3 先用 commit hash）
15. **deferred from phase 1.1**: 原 T4.4 shell-escape pre-Ajv 检测（`$(...)` `${...}` `eval` `!ruby/regexp`）— phase 1.4+ 评估
16. **deferred from phase 1.1**: 原 T8.7 workflow + routing schema artifact + 同等测试覆盖 — v0.3 phase 1.4 (routing/decision_rules.yaml v1 已落地，但完整 workflow schema artifact 仍 deferred)
17. **deferred from phase 1.2**: cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer 实装代码 — phase 2.1（GA-1 Recommendation Option C timing）
18. **deferred from phase 1.2**: mcp-http-add 实装 — phase 2.x（无真实上游 demo）
19. **deferred from phase 1.2**: 6 月 stale upstream check + `--force` flag for idempotent_check — phase 2.4 / 2.1+
20. **deferred from phase 1.3 sister review**: M2 ADR 0006 self-contained snapshot SSOT drift defense — v0.4 maintainer onboarding 加监控警示
21. **deferred from phase 1.4 (F42)**: array semantic match 升级 (R5 array fallthrough → match 行为) — phase 1.5 评估 OR ADR 0009 errata 路径；4 SAMPLES expected_rule_id v0.1 fallthrough → v0.2+ 升级回 array-trigger rule (SAMPLES.md § 8.1 升级映射已落地)
22. **deferred from phase 1.4 (P2)**: phase 1.4 30 sample → phase 3.4 v0.3.0 完整命中率 100+ sample × 多 model × stability 验收（W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` — phase 3.4 fixture 化迁移基线）

---

## 关键提醒（⚠️ 不可忽略）

1. ✅ ~~SUMMARY 提议的 6 项 spec 修订尚未应用~~ — **已 patch 进 PROJECT-SPEC v2.1 / WORKFLOWS-MVP v2.1（2026-05-11）**
2. ✅ ~~新增 5 条风险尚未合并~~ — **已合并到 SPEC § 7（2026-05-11）**
3. ✅ ~~Phase 1.1 schema v1 frozen~~ — **2026-05-12 SHIPPED；ADR 0001/0002 main body 受 `adr-0001-accepted` tag 守恒；进入 phase 1.2 前 schema 改动 = 全量 manifest 迁移**
4. ✅ ~~Phase 1.3 schema 加 3 字段 (category/install_type/decision_rules)~~ — **2026-05-13 SHIPPED via ADR 0007 errata；A7 守恒：ADR 0001 main body 0 diff；adr-0007-accepted tag iterate 1-7 全 7 ADR baseline tag 守恒**
5. ✅ ~~Phase 1.4 routing engine v1 + research workflow E2E~~ — **2026-05-13 SHIPPED via ADR 0008 errata；A7 守恒：ADR 0001-0007 main body 0 diff；adr-0008-accepted tag iterate 1-8 全 8 ADR baseline tag 守恒；30 sample 100.0% hit ≥ 85% baseline；3 routing 文件 (engine.ts 170L / agentDefinition.ts 148L / systemPrompt.ts 43L) karpathy 严守 ≤ 200/150/80**
6. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
7. **DAG resolver Day 1 实装**——sequential 容易拖到 v0.3，brew bundle 案的反面教材；v3 重排推到 phase 1.5（base profile 安装顺序明确，不需拓扑）
8. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）；phase 1.4 30 sample × 6 category 100% hit (单 model 单环境基线，phase 3.4 v0.3.0 升级多 model × stability 验收)
9. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰
10. ✅ ~~Phase 1.4 verbatim COMPLETE 强制~~ — **2026-05-13 SHIPPED；systemPrompt.ts D-18 1:1 contract § 5.4 enforce + main agent system prompt verbatim COMPLETE marker (F33 P1 mitigation)；T6.2 30-sample test 验证主流程 verbatim COMPLETE 不被 summarize 误吞**

---

## 累积上下文（Decisions / Todos / Blockers）

### 关键决策记录（追溯到 spec / research 章节）

| 决策 | 来源 | 备注 |
|------|------|------|
| 路由 B+C 混合 + 85% 验收 | SPEC § 5.1 + R03 § 2.4 | Sonnet 100% / Haiku 84% 实证 |
| schema apiVersion + upstream_health + signed_by | R04 P0 + R03 § 6.5 | 仿 K8s CRD 模式 |
| 6 种 install method 用子枚举（type 仍 4） | SUMMARY § 二 冲突 2 决议 + ADR-0003 errata | schema 简洁性优先；mcp-stdio-add / mcp-http-add 拆为独立 method |
| Hook 措辞重写 | SUMMARY § 二 冲突 3 决议 | 配置纯 yaml/md + 脚本严格审计 |
| Cross-OS 前移 | SPEC § 11 修订 | R03 红旗 6 + R04 P0 |
| 单点维护风险升级 | SPEC § 7 修订 | R04 学术 36%/年 |
| Schema v1 sufficient (T7.10 verdict) | progress.md § B F14 + § B.4 表 | 9 上游 dry-run 全 pass，零字段缺失，无 errata 需求 |
| Phase 1.1 SHIP | progress.md § B F17 + .planning/phase-1.1/VERIFICATION.md | 7/8 acceptance bar ✅；A4 ⏳ pending CI；schema v1 frozen via 2 local tags |
| ADR 0005 marketplace_source schema errata | phase-1.2 progress.md § B F23 + ADR 0005 | A7 守恒：ADR 0001 main body 0 diff；schema 加 optional field via errata 流程 |
| Phase 1.2 SHIP — installer runtime ready | phase-1.2 progress.md § A.4 + VERIFICATION.md | B1'-B9' 9/9 ✅；2 method runtime + 4 placeholder；ADR 4→5；tests 89→202+1 skipped |
| Installer UX 6 contract 硬契约（dry-run default + diff + rollback + 4-Level confirm + MCP CLI-only + no-silent-failure）| ADR 0004 + INSTALLER-CONTRACT.md | 12 contract test 自动化 (`tests/integration/installer-contract.test.ts`)；CI fail if violation |
| `npm-cli` L4 → L1 自动降级（fallback npx ephemeral）| ASSUMPTIONS B3 候选 1 + D1.2-4 | H3 三选一 prompt: retry/downgrade/abort；karpathy YAGNI 不抽 selectAt helper |
| `mcp-stdio-add` hardcoded `--scope project` | ADR 0004 § 5 + D1.2-10 + CC #54803 | manifest 不能 override；规避 user-scope bug；不调通用 spawn helper |
| `.harnessed/state.json` SSOT + atomic write-then-rename | D1.2-7 + state.ts | 仅 backup + state.json；audit.log / checkpoints 推 phase 1.4+ |
| backup metadata.json per-file `eol: lf\|crlf` 字段 | ASSUMPTIONS C3 + D1.2-11 | rollback EOL preserve（CRLF 文件不被 LF 化）|
| Contract test 12 cell 用 vi.mock; real-spawn 单独 skipIf gate | D1.2-12 + ASSUMPTIONS C6 + Pattern K | `HARNESSED_REAL_SPAWN=1` 才 run；CI 默认 skip 避免装真包污染 |
| ADR 0001-0005 main body 永久守恒（A7） | F26 + ci.yml iterate 5 tag | 5 baseline tag全部就位；任一字符 diff = CI fail |
| ADR 0006 architecture-wedge-revision-v3 | phase 1.2.5 ASSUMPTIONS § E + ADR 0006 | 8 支柱 100% capture lock + ROADMAP v3 重排 16 → 17 phase；不动已 ship 代码 |
| Phase 1.3 SHIP — base profile + categorization schema + decision_rules.yaml v1 | phase-1.3 progress.md § A.4 + VERIFICATION.md | B1-B8 8/8 ✅；3 schema 字段 + 12 rules + install-base + ui-ux-pro-max install path 实测；ADR 5→7；tests 202+1→235+1 |
| Phase 1.3 perf cost 量化 (schema +3 字段 cost +12% / 100 ops) | phase-1.3 PERF-ATTRIBUTION.md + F38 | 同机本地 phase 1.1 20.13 / 1.2 20.80 / 1.3 22.58ms; CI Ubuntu spike 50.14ms hotfix 50→75ms relax (data-driven 不优化 schema validation) |
| `routing/decision_rules.yaml` v1 schema (Priority Hit Policy + 12 rules) | phase-1.3 T3.1 + RESEARCH-2 | DMN Priority hit policy；6 category × 12 rules MVP；fallback_supervisor=claude-opus-4-7；deprecated brave-search-mcp |
| ADR 0006 baseline tag retroactive 重打到 3e24c16 (F37) | phase-1.3 progress.md § B F37 | 沿袭 phase 1.2 F26 模式；phase 1.2.5 Wave D commit 3e24c16 加 ~50 行 self-contained snapshot 后 tag 与 main body 漂移 → retag 修复
| Phase 1.4 SHIP — routing engine v1 + research workflow E2E + 30 sample 100% hit | phase-1.4 progress.md § A.4 + VERIFICATION.md | C1-C8 8/8 ✅；3 routing 文件 (engine.ts 170L / agentDefinition.ts 148L / systemPrompt.ts 43L)；30 sample 100.0% hit (30/30) ≥ 85% baseline；ADR 7→8；tests 235+1 → 291+2 skipped |
| ADR 0008 routing-engine-v1-errata | phase-1.4 progress.md + ADR 0008 | A7 守恒：ADR 0001-0007 main body 0 diff；含 phase 1.3 deferred H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5 跟踪条目 |
| Pattern N/O/P 新生 (engine 主流程编排 / systemPrompt verbatim 1:1 / SAMPLES inline truth table) | phase-1.4 PATTERNS.md + PLAN.md § 2 | Pattern N ≤ 200L Wave 2 anchor；Pattern O ≤ 80L D-18 1:1 contract § 5.4；Pattern P ≥ 85% tolerance threshold 30 sample × 6 category v0.1 内部基线 |
| AgentDefinition 12 字段 1:1 contract drift detector (T4.2 cell 1) | phase-1.4 T4.2 + W-5 V1 BLOCKER | inline interface 替代 SDK type alias (F40-2)；karpathy YAGNI；推 phase 1.5 D1.4-2 errata window 评估 deps 引入 |
| F42 SAMPLES expected fallthrough not fallback (R3 frozen 边界澄清) | phase-1.4 progress.md § B F42 | R3 mitigation Step 3 严守 prompt+category 不可改；expected/hypothesis 必须同步 ground truth (test 永远 fail 否则)；4 sample (design-3/-5 + search-4/-5) 升级映射推 phase 1.5 array semantic match |
| Phase 1.4 perf 0 影响 (T7.3 跳过) | phase-1.4 task_plan T7.3 trigger 条件 + KICKOFF YAGNI | routing engine 不调用 manifest validate hot path (engine.route 直走 arbitrate / agentFactory / spawn — no validateManifestFile)；T7.3 触发条件不满足；karpathy YAGNI 跳过 PERF-ATTRIBUTION-2.md |
| Phase 1.5 SHIP — DAG resolver + Semantic Router L2 stub + engineering 5 rules + mattpocock 23 招式 phase routing schema | phase-1.5 progress.md + VERIFICATION.md | D1-D8 8/8 ✅；dag.ts 142L Kahn iterative 自实装 / semanticRouter.ts 81L v0.1 stub / promiseExtract.ts 32L W-2 split / agentDefinition 191L 14 字段；decision_rules.yaml v2 engineering 5 rules + mattpocock_phases 4×21×23；spec.ts phase+triggers (TypeBox)；ADR 8→9；tests 291+2 → 318+3；8 接口契约 frozen for phase 2.0；8 支柱 100% capture roadmap closure |
| ADR 0009 routing-l2-engineering-23-shi-errata | phase-1.5 progress.md + ADR 0009 | A7 守恒：ADR 0001-0008 main body 0 diff；D5 三 P1 + 1 fresh deferred items errata 4 sub-item inline（D1.4-2 contract v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum `<promise>` XML wrapper）|
| Phase 1.5 DAG resolver hot path ≤ 5% regress (PERF-ATTRIBUTION-2.md) | phase-1.5 PERF-ATTRIBUTION-2.md + D6 | DAG resolver micro-bench：realistic 50-node 图 0.0096ms/call +0.96% regress ≤ 5% threshold ✅ PASS；Kahn O(V+E) 自实装无 graph library；manifest validate hot path 0 regress（DAG 不调 validateManifestFile）|
| W-1 STATE.md 7→8 接口契约 numeric drift 修正 | phase-1.5 PLAN-CHECK round 1 W-1 + T8.1 | phase 1.4 STATE.md line 11 原写 7，实际 phase 1.4 PLAN § 4 列 8（第 8 = SAMPLES inline truth table）；phase 1.5 T8.1 sync 修正 7→8 + errata 注 |
| manifest schema 用 TypeBox 不是 zod (D4 acceptance command 更正) | phase-1.5 VERIFICATION.md § 1 D4 F-note | PLAN § 6 D4 原 `grep "phase: z.enum"` 命令错误；spec.ts 用 `Type.Union`/`Type.Object`；正确验证 `pnpm build:schema && grep "phase\|triggers" schemas/manifest.v1.schema.json` |

### 未决问题（留给 phase 1.3+ phase）

1. ~~manifest type 计数：keep 4 + 子方法 vs 升 5 type？~~ — **已决：4 type + 6 method（ADR 0003 errata）**
2. ~~installer UX 契约：dry-run 默认还是 explicit~~ — **已决：dry-run 默认 + `--apply` 显式 + `--non-interactive --apply` 双 flag for CI（ADR 0004 + INSTALLER-CONTRACT.md）**
3. ~~MCP scope: user vs project~~ — **已决：硬编码 `--scope project` 写到 .mcp.json，规避 CC #54803（ADR 0004 § 5）**
4. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察）
5. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
6. sigstore / cosign 签名（v0.4+ 议题）
7. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定）
8. token budget 监控 UX（v0.3 设计）
9. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）
10. `requires_secret` 字段（API key 注入声明）— v0.2 schema 增强候选（F14 子决策）
11. `command_prefix_strategy` 字段（gstack 前缀可配置）— v0.2 schema 增强候选（F14 子决策）
12. `--force` flag for install idempotent_check 重装语义（phase 2.1+；当前 already-installed = exit 0 + skip）
13. cc-plugin-marketplace REPL slash-command headless 机制（F20 deferred to phase 2.1 plan-phase；ADR 0004 L3 适用）

### Blockers

[当前无]

---

## Session 连续性（Continuity）

### 跨 session 恢复指南

```bash
# 进入项目根
cd D:/GitCode/harnessed

# 1. 读 STATE.md（本文件）了解当前位置 + 待办
# 2. 读 ROADMAP.md 看里程碑总览
# 3. 读 REQUIREMENTS.md 看功能需求清单
# 4. 读 PROJECT-SPEC.md / WORKFLOWS-MVP.md 看立项 spec
# 5. 读 .planning/research/SUMMARY.md 看调研综合
# 6. 读 .planning/phase-1.1/VERIFICATION.md 看 phase 1.1 复现指南（A1-A8 + F1-F22 索引）
# 7. 读 .planning/phase-1.2/VERIFICATION.md 看 phase 1.2 复现指南（B1'-B9' + F23-F31 索引 + Phase 1.3 prereq）
# 8. 读 .planning/phase-1.3/VERIFICATION.md 看 phase 1.3 复现指南（B1-B8 + F36-F39 索引 + Phase 1.4 prereq）
# 9. 读 .planning/phase-1.3/PERF-ATTRIBUTION.md 看 schema 3 字段 perf cost 量化结论 (H1b sister patch 落地)
# 10. 读 .planning/phase-1.4/VERIFICATION.md 看 phase 1.4 复现指南（C1-C8 + F40-F42 索引 + Phase 1.5 prereq 8 接口契约）
# 11. 读 .planning/phase-1.4/SAMPLES.md 看 30 sample inline truth table + R3 frozen + § 8 升级映射
# 12. 读 .planning/phase-1.4/SPIKE-REPORT.md 看 main-process query() API 实证 + 7 anchor decisions
# 13. 读 docs/INSTALLER-CONTRACT.md 看 phase 1.2 installer UX 6 contract（用户视角）
# 14. 读 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md 看 phase 1.3 AgentDefinition factory 12 字段 contract draft (phase 1.4 已实装 1:1 binding)
# 15. 读 docs/adr/0006-architecture-wedge-revision-v3.md 看完整三层栈方法论 wedge 定义 (8 支柱 capture)
# 16. 读 docs/adr/0007-categorization-schema-extension.md 看 phase 1.3 schema errata
# 17. 读 docs/adr/0008-routing-engine-v1-errata.md 看 phase 1.4 routing engine v1 errata + R6 deferred
# 18. 读 .planning/phase-1.{1,2,2.5,3,4}/progress.md § B 看完整 finding narratives
```

### 本 session 关键产出（截至 2026-05-13 phase 1.4 ship）

- `D:/GitCode/harnessed/.planning/ROADMAP.md`（v3 重排：16 → 17 phase）
- `D:/GitCode/harnessed/.planning/STATE.md`（本文件）
- `D:/GitCode/harnessed/.planning/REQUIREMENTS.md`
- `D:/GitCode/harnessed/.planning/phase-1.1/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/.planning/phase-1.2/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, ASSUMPTIONS.md, PATTERNS.md, GRAY-AREA-1, GRAY-AREA-2, PLAN-CHECK.md}`
- `D:/GitCode/harnessed/.planning/phase-1.2.5/{ASSUMPTIONS.md, RESEARCH-1, RESEARCH-2, ADR-0006-DRAFT.md, progress.md, KICKOFF.md, PATTERNS.md}`
- `D:/GitCode/harnessed/.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PERF-ATTRIBUTION.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md}`
- `D:/GitCode/harnessed/.planning/phase-1.4/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md, SPIKE-REPORT.md, SAMPLES.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/docs/adr/{0001,0002,0003,0004,0005,0006,0007,0008}*.md`
- `D:/GitCode/harnessed/docs/{INSTALLER-CONTRACT.md, AGENT-DEFINITION-FACTORY-CONTRACT.md}`
- `D:/GitCode/harnessed/{README.md, CONTRIBUTING.md, SECURITY.md, LICENSE, NOTICE, NOTICES.md}`
- `D:/GitCode/harnessed/docs/MAINTAINER-ONBOARDING.md`
- `D:/GitCode/harnessed/{manifests, workflows, routing, schemas, src, tests}/`
- `D:/GitCode/harnessed/src/installers/{lib/{types,spawn,preflight,diff,confirm,backup,state}.ts, npmCli.ts, mcpStdioAdd.ts, index.ts}`（phase 1.2 — 7 lib + 2 installer + dispatcher）
- `D:/GitCode/harnessed/src/cli/{install,doctor,audit,rollback,status,backup-list,gc,install-base,research}.ts`（phase 1.2 — 7 register fn + phase 1.3 install-base = 8 register fn + phase 1.4 research = 9 register fn）
- `D:/GitCode/harnessed/src/routing/{decisionRules.ts, engine.ts, agentDefinition.ts, systemPrompt.ts, index.ts, lib/ralphLoop.ts}`（phase 1.3 decisionRules + phase 1.4 engine 170L / agentDefinition 148L / systemPrompt 43L / barrel + ralphLoop spillover）
- `D:/GitCode/harnessed/routing/decision_rules.yaml`（phase 1.3 — 179L v1 schema; 12 rules + version: 1 + fallback_supervisor + hit_policy: P；M1 sister patch 移自 .planning/）
- `D:/GitCode/harnessed/manifests/skill-packs/ui-ux-pro-max.yaml`（phase 1.3 — install_type=git + method=git-clone-with-setup; v4-next tip SHA e89d70e4bcd0; decision_rules per-manifest hint）
- `D:/GitCode/harnessed/scripts/probe/ui-ux-pro-max-install.sh`（phase 1.3 — 108L; D-10 shell probe Win Git Bash 双路径 OK; 不入 CI）
- `D:/GitCode/harnessed/scripts/spike/routing-spawn-agent.sh`（phase 1.4 — D1.4-1 spike script; main-process query() API 实证）
- `D:/GitCode/harnessed/tests/integration/{installer-contract.test.ts, installer-real-spawn.test.ts, routing-research-workflow.test.ts, routing-30-samples.test.ts}`（phase 1.2 — 12 contract + 1 real-spawn skipIf；phase 1.4 — 3 mock E2E + 1 real-spawn skipIf + 30 sample-driven cell + 1 load + 1 summary skipIf）
- `D:/GitCode/harnessed/tests/unit/installers-{npmCli,mcpStdioAdd,index,lib-*}.test.ts` + `cli-{install,doctor,audit,rollback,status,install-base}.test.ts` + `routing-{decisionRules,engine,agentDefinition}.test.ts`（phase 1.2 — 6 lib + 19 method + 21 cli unit; phase 1.3 + cli-install-base 5 cell + routing-decisionRules 8 cell + manifest-validate.{category 8, install-type 6, decision-rules 5}; phase 1.4 + routing-engine 12 cell + routing-agentDefinition 9 cell）
- `D:/GitCode/harnessed/.github/workflows/ci.yml`（含 phase 1.2 H4 dual-layer installer step + phase 1.4 A7 step iterate 1-8 ADR守恒）
- `D:/GitCode/harnessed/scripts/ci/mock-claude-cli.sh`（phase 1.2 mock shim）

### 性能指标（phase 1.1 + 1.1.1 + 1.2 + 1.2.1 + 1.2.5 + 1.3 + 1.4 实证）

- 当前 phase token 消耗：— (main agent 后续填入)
- checkpoint 数量：phase 1.1 内多次 batch checkpoint（batch 1-6 各一次）；phase 1.1.1 hotfix 1 次 batch；phase 1.2 共 7 batch (Wave 0-7)；phase 1.2.1 hotfix 1 batch；phase 1.2.5 多 wave；phase 1.3 共 4 batch (batch 1+2+3+4)；phase 1.4 共 4 batch (batch 1+2+3+4)
- 累积 ADR 数量：**10**（0001 schema / 0002 toolchain / 0003 method count errata / 0004 installer UX contract / 0005 marketplace_source schema errata / 0006 architecture-wedge-revision-v3 / 0007 categorization-schema-extension errata / 0008 routing-engine-v1-errata / 0009 routing-l2-engineering-23-shi-errata / 0010 installer-schema-extension-errata）（目标 v0.4 ≥ 5 ✅ 已达）
- 累积 baseline tag 数量：**10**（adr-0001/0002/0003/0004/0005/0006/0007/0008/0009/0010-accepted；0006 phase 1.3 F37 retroactive 重打到 3e24c16；0009 由 main agent phase 1.5 final ship step 创建；0010 由 main agent phase 2.1 T6.5 final ship step 创建）+ 5-6 milestone tag（v0.1.0-alpha.1-schema-frozen + alpha.2-installer-runtime + alpha.3-base-profile + alpha.4-routing-engine + alpha.5-routing-l2-engineering + v0.1.0 archive；候选 `v0.2.0-alpha.1-installers` pending phase 2.1 T6.5 main agent ship）
- 路由命中率：**phase 1.5 30 sample specific match 28/30 (93.3%) ≥ 27/30 threshold + total 30/30 (100%)** ✅；目标 ≥ 85% 达成；engineering 5/5 specific match（phase 1.4 走 fallback_supervisor → phase 1.5 engineering 5 rules ship 后精确路由）；phase 3.4 v0.3.0 升级 100+ sample × 多 model × stability 验收
- 总 commits（phase 1.1 累积 50 + phase 1.1.1 hotfix 10 + phase 1.2 ~37 + phase 1.2.1 hotfix 1 + phase 1.2.5 多 + phase 1.3 ~24 atomic + phase 1.4 ~21 atomic + phase 1.5 ~12 (4 batch + checkpoints) + checkpoints）：~180
- 总 vitest tests：**374 passing + 3 skipped**（phase 2.1: +56 from phase 1.5 baseline 318+3；分布 8 schema test (license/bundle/install-type) + 24 installer unit test (4 installer × ≥6 cell) + 24 contract test (4 新 method × 6 contract) + 2 dispatch identity test - 4 stale phase-deferred test = +54 + 2 = +56）
- bench：phase 1.3 22.58ms mean / RME ±1.88% / SLA < 75ms（phase 1.3.1 hotfix relax；本地仍 ~3.3× headroom；详 PERF-ATTRIBUTION.md § 2-4）；phase 1.4 routing engine 0 perf 影响 (T7.3 跳过)；**phase 1.5 DAG resolver hot path micro-bench：realistic 50-node 图 0.0096ms/call (+0.96% regress) / 100-node 0.0268ms / 1000-node 极限 0.606ms ≤ 5% threshold ✅ PASS；manifest validate hot path 0 regress（DAG 不调 validateManifestFile）；详 PERF-ATTRIBUTION-2.md**
- 总 manifests / fixtures / SCHEMA.md：10 / 30+ / 3（phase 1.5 不加 manifest，只加 routing 文件 + decision_rules.yaml v2 + spec.ts phase+triggers）
- 新 deps：8（5 phase 1.1 base：Ajv + TypeBox + yaml + Ajv-formats + Ajv-errors + 3 phase 1.2：picocolors + diff + @clack/prompts；phase 1.3 / 1.4 / 1.5 均不加 dep — phase 1.5 DAG resolver 自实装无外部 graph library；Semantic Router L2 embedding deps 推 v0.2+ D1.5-2；`@anthropic-ai/claude-agent-sdk` 推 v0.2+ D1.5-5）

---

## Phase 1.5 Prereq Notes（phase 1.4 ship 后 explicit 启动 prereq — T8.4）

> phase 1.5 plan-phase 启动**直接消费 phase 1.4 输出**，无需重做。完整 8 接口契约见 `.planning/phase-1.4/VERIFICATION.md` § 2 + `PLAN.md` § 4。

### P0 — phase 1.5 启动必备

1. **DAG resolver + Semantic Router L2 (embedding kNN)** — 解锁 plan-feature workflow context routing
   - **接口入口**: `engine.route(task, opts)` (phase 1.4 已 ship — `src/routing/engine.ts`)；DAG resolver 替换 arbitrate 步骤；其余编排步骤同源
   - **EngineResult narrow pattern**: `if ('ok' in result && result.ok === false)` (F41 takeaway — TS strict union narrow 防陷阱)
   - **来源**: ROADMAP.md v0.1.0 phase 1.5 + R04 P0#4 (sequential 不允许拖到 v0.3)

2. **engineering category routing rules + mattpocock 23 招式 phase routing schema** — 完成 8 支柱 A1' / A5' enforcement
   - **R6 mitigation**: phase 1.4 KICKOFF 第 38 行 explicit lock + ADR 0008 § Consequences R6 跟踪条目
   - **现状**: phase 1.4 30 sample 中 engineering 5/5 走 fallback_supervisor (claude-opus-4-7) — 单模型兜底；phase 1.5 加 23 招式 phase routing schema 后能精确路由 discuss/plan/execute/verify
   - **接口扩展**: `routing/decision_rules.yaml` 加 engineering category 新 rules + manifest spec 顶层 `phase` 字段（discuss/plan/execute/verify enum 候选）

3. **PERF-ATTRIBUTION-2.md ship — DAG resolver hot path bench** (sister review T3 transparency — phase 1.5 acceptance bar D9 候选)
   - **触发**: phase 1.5 DAG resolver 频繁调 `validateManifestFile` (依赖图解析必经路径) — 不 audit 风险 100ms→200ms perf 跳跃 ship 前才发现
   - **范围**:
     - manifest validate 调用次数 baseline (phase 1.4 routing engine 0 hot path) vs phase 1.5 DAG (≥ N 次/调用)
     - 单 manifest validate 时间 baseline (phase 1.3 ship 28ms) 是否 regress (≥ 5% threshold)
     - 续 phase 1.3 PERF-ATTRIBUTION.md 模式 + phase 1.4 跳过 T7.3 透明性补强
   - **决策点**: phase 1.5 plan-phase Wave 6 acceptance bar D9 (类 phase 1.4 C7 模式)

4. **v0.1.0-alpha.4 release notes 显式 known limitations** (sister review T2 transparency — 推 phase 1.5 release window 顺手 patch)
   - **触发**: phase 1.4 30 sample 100.0% hit metric 用户视角误读风险（specific rule match 21/30 = 70% — array trigger v1 miss 影响 search-5 批量 URL → tavily fallback ~10× cost vs exa intent）
   - **范围**: README v0.1.0-alpha.4 状态段已加 5 行注脚 (sister T1 inline) — phase 1.5 release notes (CHANGELOG.md or GitHub Release) 加 ## Known Limitations 段
   - **决策点**: phase 1.5 ship 时 release notes 内联 (类 phase 1.4 ADR 0008 inline phase 1.3 deferred items 模式)

### P1 — phase 1.5 周期内评估

3. **`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata 评估** (D1.4-2)
   - **来源**: phase 1.4 RESEARCH § 2 fresh 2026 暴露 2 新字段；contract v1 frozen at phase 1.3 ship — 不动 main body 守 A7 (D1.4-2 lock)
   - **决策点**: phase 1.5 errata window 走 ADR 0009 errata 加 `initialPrompt: string` + `criticalSystemReminder_EXPERIMENTAL: string` 2 字段，AgentDefinition 12 字段 → 14 字段 1:1 binding；T4.2 cell 1 W-5 V1 BLOCKER drift detector 同步扩展
   - **预期 impact**: spawn 时刻 main agent 注入 initialPrompt 进 subagent context (复用 ralph-loop wrap pattern + verbatim COMPLETE marker 约束)

4. **F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估** (推 phase 1.5 D1.4-2 errata window 同步)
   - **现状**: phase 1.4 agentDefinition.ts 用 inline `interface AgentDefinition` 1:1 contract § 2 (12 字段)；package.json 不污染 dep；karpathy YAGNI
   - **触发条件**: research workflow E2E (T5.x) 真实调用 query() API 时 (HARNESSED_REAL_SPAWN=1 spawn 真实 main-process subagent) 才引入 deps
   - **决策点**: 视 phase 1.5 实装 DAG resolver 调用 spawn 频率 + Semantic Router L2 supervisor 调用 query() API 真实形态实证后决定

5. **`--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估** (D1.4-3)
   - **现状**: phase 1.4 自实装 `src/routing/lib/ralphLoop.ts` ≤ 50L (wedge 原则 — 自实装 small 是核心 wedge)；KICKOFF lock 严守
   - **触发条件**: v0.2+ 官方 plugin 成熟度可信 + 自实装 cost > 切换 cost 时
   - **决策点**: phase 2.1+ + ADR 0009+ errata 评估窗口

### P2 — 跨里程碑预留 (phase 1.4 deferred items)

6. **F42 array semantic match 升级** (R5 array fallthrough → match 行为)
   - **现状**: phase 1.4 arbitrate v1 array-field rule (priority=100 ui-task-bold-style-override / priority=80 search-academic-or-batch-or-token-sensitive) v1 miss → priority=50 default rule fallthrough 命中
   - **影响**: 4 SAMPLES expected_rule_id v0.1 fallthrough — design-3/-5 (`ui-task-default`) / search-4/-5 (`search-default`)；命中 default rule (非 array-trigger rule) 不影响 routing primary 命中率 (设计意图仍达成 — ui-design 走 ui-ux-pro-max / search 走 tavily-mcp)
   - **决策点**: phase 1.5 评估 OR ADR 0009 errata 路径；升级回 array-trigger rule 命中后 4 SAMPLES expected_rule_id 同步升级（SAMPLES.md § 8.1 升级映射已落地）

7. **phase 1.4 30 sample → phase 3.4 v0.3.0 完整命中率 100+ sample × 多 model × stability 验收**
   - **现状**: phase 1.4 30 sample inline truth table (Pattern P) 单 model 单环境 100% hit ≥ 85% v0.1 内部基线
   - **升级路径**: W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` 把 SAMPLES.md inline truth → tests/fixtures/routing/samples/*.yaml；phase 3.4 v0.3.0 release 验收时 100+ sample × Haiku/Sonnet/Opus 各 ≥ 8 × stability run × 3 验收

> **↑ Phase 1.5 Prereq Notes 段已全部 fulfilled** — phase 1.5 SHIPPED 2026-05-14；P0 项 1-4 全部落地（DAG resolver + Semantic Router L2 stub ✅ / engineering 5 rules + mattpocock_phases ✅ / PERF-ATTRIBUTION-2.md ✅ / release notes known limitations 内联 ADR 0009 § Consequences ✅）；P1 项 3-5 全部走 ADR 0009 errata 决议（initialPrompt + criticalSystemReminder_EXPERIMENTAL 14 字段 ✅ / F40-2 SDK 推 v0.2+ ✅ / ralph-wiggum 切换推 phase 2.1+ ✅）；P2 F42 array semantic match v0.1 fallthrough 行为 frozen（v0.2+ 升级推 phase 2.x）。下方 Phase 2.0 Prereq Notes 为新的启动 prereq。

---

## Phase 2.0 Prereq Notes（phase 1.5 ship 后 explicit 启动 prereq — T8.1）

> phase 2.0 plan-phase 启动**直接消费 phase 1.5 输出**，无需重做。完整 8 接口契约见 `.planning/phase-1.5/PLAN.md` § 4 + `VERIFICATION.md` § 2。

### phase 2.0 entry — execute-task workflow 主线 + ralph-loop full integration + 4 placeholder installer 实装

phase 1.5 ship 后 frozen 的 **8 接口契约**（PLAN.md § 4 1:1），phase 2.0 直接消费：

1. **`resolveDag(nodes: DagNode[]) → DagResolveResult`**（`src/routing/dag.ts` 142L）— Kahn 拓扑排序，三态 `{ ok:true, order }` / `{ ok:false, cycle }` 沿袭 EngineResult union（F41）
2. **`semanticRouter.match(prompt, threshold=0.85) → Promise<SemanticMatchResult>`**（`src/routing/semanticRouter.ts` 81L）— v0.1 stub return null；v0.2+ 仅替换 stub body 不改 contract
3. **`SemanticMatchResult` type** — `{ matched, rule, confidence }` 三态 narrow
4. **`engine.route` 升级**（`src/routing/engine.ts`）— arbitrate 前插 resolveDag + 后兜底 semanticRouter.match；保留 fallback_supervisor 三层兜底；主流程接口契约 phase 1.4 frozen 不破
5. **`decision_rules.yaml v2 mattpocock_phases:` 段 schema**（`routing/decision_rules.yaml`）— 4 phase × skills array + triggers array；engineering sub-rules `skills_overlay: { ref: ... }` cross-link
6. **`AgentDefinition` v1.1 14 字段**（`src/routing/agentDefinition.ts` 191L）— phase 1.4 12 字段 + `initialPrompt`（Stable）+ `criticalSystemReminder_EXPERIMENTAL`（Experimental）
7. **`ManifestSpec` 升级**（`src/manifest/schema/spec.ts`）— TypeBox `Type.Union` 4-value phase enum（discuss/plan/execute/verify）+ `Type.Object` triggers（**注意：项目 manifest schema 用 TypeBox `@sinclair/typebox` 不是 zod**）
8. **`<promise>COMPLETE</promise>` XML wrapper 协议**（`src/routing/systemPrompt.ts` 53L + `src/routing/lib/promiseExtract.ts` 32L）— systemPrompt const + `PROMISE_PATTERN` regex `<promise>([^<]+)</promise>` — phase 2.1+ `--add-plugin ralph-wiggum` 1:1 顺滑切换

### 8 支柱 capture roadmap（sister review H1 修正 — A7' stub 不标裸 "CLOSED"）

phase 1.5 ship 后，KICKOFF § 8 支柱 + PLAN-CHECK § 8 的 capture roadmap 状态：

- **A1' engineering 5 rules** → ✅ CLOSED（T4.1 `decision_rules.yaml` v2 engineering category 5 specific rules ship — 真实 routing 能力）
- **A5' mattpocock_phases** → ✅ CLOSED（T4.1 yaml v2 `mattpocock_phases:` 段 4 phase × 21 unique skills × 23 trigger entry ship — 真实 schema）
- **A7' triggers semantic L2 stub** → **INTERFACE CLOSED / CAPABILITY DEFERRED v0.2+**（T3.2 `semanticRouter.match()` v0.1 是 **return null stub** — 接口契约 frozen ship，**非**语义匹配能力实现；真实 embedding kNN capability 推 phase 2.x）
  - **sister review H1**：`return null` stub 是 "interface contract shipped" 不是 "capability captured"。phase 1.4 sister review T1（"100% hit" 实际 70%）的同一个 transparency 反模式 — 不再用裸 "CLOSED / 100%" 字眼盖过真实状态。结构性根治见下方 Phase 2.1 Wave 0 deferred § "transparency verify checklist"。

### phase 2.0 启动项（discuss-phase 入口）

- **execute-task workflow 主线**（WORKFLOWS § 2 — brainstorming → karpathy 心法 always-on → mattpocock 招式按需召唤 → 条件 TDD → ralph-loop 交付 COMPLETE）
- **ralph-loop full integration**（主流程 routing engine 调用 ralph-loop wrap "...COMPLETE" --completion-promise；A7' 8 支柱 100% 闭环 — phase 2.2）
- **4 phase-2.1 placeholder installer 实装**（cc-plugin-marketplace + git-clone-with-setup + npx-skill-installer + mcp-http-add — ADR 0003 errata + ADR 0007 install_type 字段）
- **Semantic Router L2 真实启用评估**（embedding kNN — D1.5-2 触发条件：30 sample 升 100+ × 多 model × stability validation）

### Phase 1.5 Sister Review — Deferred to Phase 2.1 Wave 0

phase 1.5 ship 后 sister review（paranoid staff engineer 视角）— **H1 + H2 已 ship 前修复**（H1 STATE.md A7' wording 改 "INTERFACE CLOSED / CAPABILITY DEFERRED" / H2 ralphLoop.ts Anchor 3 hard split → `lib/skillInstall.ts`，ralphLoop.ts 65L → **42L ≤50L**，ADR 0009 § Decision 3 "≤50L strict" 声明变真，A7 守恒保留无需动 ADR）。以下 3 项 + 1 结构性根治推 Phase 2.1 Wave 0 顺手：

- **H3 — agentDefinition.ts budget 偷改**（🟡 Med）：phase 1.4 C2 acceptance bar ≤150L（实测 148L）→ phase 1.5 T5.3 加 2 字段 + drift detector → 191L；progress.md 默写 "≤200L" 无 ADR 记录。budget 放宽是架构决策 — Phase 2.1 Wave 0 走 ADR 0010 errata 正式记录 ≤150 → ≤200 + 理由（+43L / 2 optional string 字段 + `AGENT_DEFINITION_FIELDS` drift detector）。
- **H4 — substring match false-positive 风险未记**（🟡 Med）：ADR 0009 § Decision 2 `matchesTrigger` 用 `task.prompt.toLowerCase().includes(trigger.toLowerCase())` substring 包含匹配 — trigger `"test"` 命中 `"latest"`/`"contest"`，`"ai"` 命中 `"email"`。30 sample 没撞 ≠ 真实 query 不撞。Phase 2.1 Wave 0 在 ADR 0010 errata § Consequences 记 "substring match v0.1 已知 false-positive 风险，v0.2 semantic router 替代"。
- **M1 — 2/30 sample miss 身份未记录**（🟡 Med）：28/30 specific match，2 个 miss 是哪 2 个？STATE.md / ADR 0009 / progress.md 全是聚合数字（phase 1.4 T1 transparency 反模式复发）。Phase 2.1 Wave 0 跑 30-sample test 标注 2 miss 身份 + 为何可接受，写入 `.planning/phase-1.4/SAMPLES.md` v2 § 8.4。
- **结构性根治 — transparency verify checklist**（reviewer 强调"否则 phase 2.0/2.x 还会复发第三次"）：Phase 2.1 Wave 0 建立 verify-phase checklist（或轻量 CI gate）—— 任何 "CLOSED / 100% / 全绿" 字眼必须附 specific 数字 + miss 清单否则 verify 不通过。根治 phase 1.4 T1（"100% hit" 实际 70%）+ phase 1.5 H1/M1 连续 2 phase 复发的"聚合数字盖过真实状态"结构性倾向。

L1（1000-node DAG +60.6% regress）已被 `PERF-ATTRIBUTION-2.md` § 7 监控触发器 tracked；L2（`.omc/` biome 污染）已记 `deferred-items.md` D-OOS-1 — 均合理 deferred，无需额外动作。

---

## 框架治理路由（呼应 ~/.claude/CLAUDE.md）

本项目在 v0.1+ 的子任务执行阶段须遵循：

- **gstack**：决策关卡（每新里程碑 / 关键模块 PR 前 `/review` 强制）
- **GSD**：整体 orchestration（discuss → plan → execute → verify）
- **planning-with-files**：每个 phase 落地 task_plan.md / progress.md / findings.md
- **superpowers**：子任务级 brainstorming + 可选 TDD
- **andrej-karpathy-skills**：编码心法硬约束（surgical changes / simplicity first）
- **mattpocock-skills**：按需召唤 / `/zoom-out` / `/diagnose` / `/grill-with-docs`
- **ralph-loop**：每子任务交付保证（COMPLETE 标记）
- **Tavily / Exa MCP**：网络调研优先（不用 WebSearch / WebFetch）
- **ctx7**：库 / API / SDK 文档查询（默认）

