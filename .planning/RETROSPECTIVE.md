# harnessed RETROSPECTIVE

> Milestone-level retrospective —— phase-by-phase 经验沉淀；不重复 STATE.md 项目记忆，专注 What Worked / What Was Inefficient / Patterns Established / Key Lessons / Cost patterns。

---

## Deferred items review (Phase 2.3 W0 T0.8 cadence — 起每 ship phase 触发)

> 每 ship phase 时强制运行 `node scripts/check-deferred-items.mjs` + 人工 cat 各 `.planning/phase-*/deferred-items.md` + grep DEFERRED entry 是否触发条件已满足 (e.g. T4.4 Task Session conditional pass → 触发 v0.3.0 实施)。
> 沿袭 D-OOS-1 `.omc/` 2026-05-13 → 2026-05-15 三 phase 未 review process bug 根因修正。

**Review history**:
- Phase 2.3 W0 (2026-05-16 — 本 phase 启动 W0): T1.1 dual-signal real-API (等 ANTHROPIC_API_KEY env, v0.3.0 prep) / T4.4 Task Session (SC4 PARTIAL → v0.3.0 stable bridge/assistant API) / EE-4 plan 4 维量化阈值 (Phase 2.4 doctor) — PENDING (无 trigger 满足)
- **Phase 2.3 ship** (2026-05-16 — 本 phase ship): T1.1 dual-signal real-API PENDING (无 ANTHROPIC_API_KEY env 触发 — v0.3.0 prep continues) / T4.4 Task Session PENDING (closure infra 三件套 ready, consumer 接入 + schema bump 走 v0.3.0) / EE-4 plan 4 维量化阈值 PENDING (Phase 2.4 doctor 完整版 absorb 候选) / **DI-1 RESOLVED** (Phase 2.3 W6 hotfix commit `5ccc631` — karpathy-skills.yaml schema-compliant: git_ref pin 40-hex all-zeros + install_type:git per ADR 0007 1:N closure; 全 local-copy install method DEFERRED v0.2.4+)
- **Phase 2.4 W0** (2026-05-16 — 本 phase 启动 W0): cadence walker round-2 warn-only continues (phase-2.4/deferred-items.md stub created in T0.5; check-deferred-items.mjs phase-aware token added; Phase 2.4 ship 后评估 ENFORCE=true flip per round-3 cadence)
- Phase 2.4 ship (TBD): 同步触发条件复查 + 本表更新

---

## dashboard tool cross-phase history cluster (M1 absorb — Phase 2.4 Wave 0 T0.6)

> sister Phase 2.3 RETROSPECTIVE What Worked § "dashboard tooling (T-W6-2 absorb) cross-phase reference" extension。 跨 phase 2.2/2.3/2.4 boundary tooling reference cluster — 单一 tool 多次跨 phase 演化的 sister observability 模板。

**Timeline cluster**:
- **`0b4e76d`** (Phase 2.2/2.3 boundary, 2026-05-15): `scripts/dashboard.mjs` NEW ~456L zero-dep ESM read-only `.planning/` + `docs/adr/` + git visualization + tiny inline md→html + mtime polling + hook-ready `--no-open` + port-occupied silent exit
- **`161621c`** (Phase 2.3 ship 时, 2026-05-16): UX polish round 1 — 7 项 UX 改善 + 1 silent bug fix + rename Dashboard → STATE (page heading + window title + sidebar)
- **`3fc0c42`** (Phase 2.4 Wave 0 pre-flight, 2026-05-16): UX polish round 2 — reverse sort (latest first) Phase History + ADRs + Phycat-Cherry dark-friendly typography borrow (heading decorations 4 级 + blockquote + font stack incl. LXGW WenKai)
- **Phase 2.4 Wave 3 (TBD)**: dashboard C 路径 FULL absorb (D-04) — SessionStart hook auto-install + STATE.md SSE watcher + 多项目支持 (3 子功能 atomic, sister cluster Wave 3 3 sub-task)

advisory — dashboard polish round 1 (commit `161621c`) + dashboard polish round 2 (commit `3fc0c42`) 都是 NEW (commit `0b4e76d`) 的延伸, 不另立功能 entry；Phase 2.4 C 路径 FULL absorb 才是主功能 ship (sister ADR 0013 § 4 Decision)。 此 M1 entry sister STATE.md L611 M1 backlog 一句补诺言交付。

---

## Advisory Absorb Path — dashboard polish round 2 commit attribution 复盘 (Phase 3.1 W0.2 absorb)

> sister M2+M3 backlog absorption (Phase 3.1 W0.2 cluster) — Phase 2.4 handoff intel L482 草案 "polish round 2 独立 commit" 未被 executor 采纳, 合理 absorb 进 W3 主 commit cluster (`cf00d17` T3.2 SSE watcher + `008f9ab` T3.3 multi-project). polish 2 changes 100% 存活 (Phycat CSS + `.sort().reverse()` + `.slice().reverse()` 全在), 仅 commit attribution 改路径.

**Timeline**:
- handoff intel L482 (Phase 2.4 W2-W3 boundary, 2026-05-16): "推 polish round 2 独立 commit 隔离观察"
- executor decision (Phase 2.4 W3 `cf00d17` + `008f9ab`): absorb 进 main W3 commit cluster, dashboard.mjs 改动 atomic with SSE watcher + multi-project
- post-ship lesson: **scope-coherent absorb** 比强 standalone 干净 — 单 Wave 单 file 多 commit = artificial atomicity

**Cadence note for future advisory**: executor 在 advisory 与 task 紧耦合的情况下选择 absorb 进相邻 task commit 是合理判断 — handoff intel "独立 commit" 是推荐路径不是强制. 沿袭 future advisory phrasing: "推荐独立 commit OR absorb 进 next task (executor 判断)" 避免 "advisory rejected" 暗示 (sister LinkedIn "草案不动" 反 pattern).

---

## Phase 3.3 milestone retrospective — aliases.yaml RICH + DOCTOR-ONLY-WARN deprecation marker + known-good 版本组合 lock (2026-05-17 ship) — v0.3.0 milestone 3/4 progress

### What Went Well

- **W0.1 D-04 STATE dual-SSOT 5-recurrence terminus COLLAPSE 一次落地**: 4 prior recurrences identified (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope) + 5th (STATE L4+L5 dual-SSOT itself) terminated via single SoT (L21-27 "当前位置" block) + STATE_POSITION_RE OR-fallback freshness gate extend +10L. Karpathy YAGNI 严守 single source of truth — 删 2 lines + 加 10 lines freshness gate extend (净 +8L) 解决 5 prior recurrences。
- **W0.2 dashboard-sse fix path (a) 4-cell 一次性 pass cross-OS**: Phase 3.2 DEFERRED #2 carry-forward closed via RESEARCH-guided recipe verbatim — sister Node `net.createServer({port:0})` MDN std + DASHBOARD_PORT env injection + sister Phase 2.4 W4 Win 3-tier 8s waitFor reused。Fix path (a) chosen over (b) rude port-kill + (c) skip-with-stderr (quality loss)。
- **D-01 ~ D-04 4 D-decision lock 一次活化 zero sneak-in**: aliases.v1 RICH 5-field (not FLAT or TIERED) + install 安静 (not console.warn) + YAML manifest (not JSON npm-lock style) + STATE COLLAPSE (b) (not EXTEND (a) or INVERSE (c)) — 全 4 decision 严守 LOCKED 不被 sneak-in。
- **manifest-domain colocation 3rd consumer 闭环 pattern 已成 cross-phase reusable rule**: checkpoint-domain (Phase 3.1 currentWorkflow.v1) + workflow-domain (Phase 3.2 config + governance + planFeature) + manifest-domain (Phase 3.3 aliases + known-good) 三 domain colocation rule sister Karpathy consumer-locality discipline pattern — "schemas go where primary consumer lives" promoted 为 cross-phase standard rule。
- **install resolveAlias 1-line surgical Karpathy exemplar**: install.ts L74-77 3-line net delta (import + resolveAlias call + null coalesce) — sister Phase 3.2 W2 governance.ts isVetoed 1-line guard pattern延袭。Karpathy surgical exemplar — 1 line not 6。

### What Surprised Us

- **T0.5 planFeature.v1 11th surface backfill (Phase 3.2 W2 T2.2 b875e21 latent stale claim surgical fix)**: Phase 3.3 W3 plan-checker iter 1 B-1 BLOCKER 揭露 — Phase 3.2 W2 T2.2 commit message claimed "11th surface" but planFeature.v1 was NEVER actually registered。Latent stale claim same shape as sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern (governance.v1 vetoed_at format bug)。Surgical W0 T0.5 fix: +4-5L schemaVersion.ts only。
- **W2 fixture invocation requires --system for L4 npm-cli installs**: T2.1 install-aliases.test.ts fixture 1 first attempt failed because ctx7 is L4 (global npm install — `npm install -g ctx7`); `--system` flag required to pass L4 security gate before dry-run preview reaches user-cancel abort path。Test fixture design refined: assert on semantic redirect-worked proof (clean user-cancel abort + L4 system install path reached) rather than 'ctx7' literal in stdout (npm-cli renderDiff is "(no file changes)" — PATH-only mutation not previewable as file diff)。
- **Windows filesystem '/' restriction in test fixture filename**: T2.4 K1b shell-eval-like version test originally tried `rm -rf /-known-good.yaml` filename — Windows rejected。Refined: use valid 0.0.1-known-good.yaml filename + inject malicious YAML CONTENT (schema validates VALUE not filename) per actual threat model concern。

### What We'd Change

- **W2 test fixture renderDiff visibility for npm-cli L4**: T2.1 fixture 1 cannot grep 'ctx7' from stdout because npm-cli L4 renderDiff is "(no file changes)" (PATH-only mutation not previewable). Future improvement: add explicit cmd echo in renderDiff for L4 system installs (sister contract 6 audit trail principle — "see cmd above" should actually show cmd above)。
- **Anti-stall dispatch granularity**: Phase 3.2 W3 38-tool early stall lesson + Phase 3.3 W2 SHIP wave 50-tool extended budget — confirm that 3-4 task per executor batch better than 6-8 (Phase 3.2 RETRO carry-forward 验证)。

### Lessons Learned

- **Lesson 1：5-recurrence terminus COLLAPSE pattern (D-04 (b) LOCKED)**。 Dual-SSOT 反模式 4 prior recurrences (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope) → 5th and final at STATE L4+L5 itself。 Lesson: 4-recurrence threshold reached = pattern terminus signal, force COLLAPSE to single SoT not yet-another-extend。 Future: 任何 dual-SSOT 反模式 ≥ 3 recurrences immediately considered for COLLAPSE。
- **Lesson 2：manifest-domain colocation 3rd consumer 闭环 = cross-phase standard rule promoted**。 Phase 3.1 + 3.2 + 3.3 = 3 domain consecutive colocation cycles validate "schemas go where primary consumer lives" 跨 phase reusable Karpathy discipline。 Future: any NEW schema 在 plan phase 必须 explicit 标 colocation domain。
- **Lesson 3：install resolveAlias 1-line surgical exemplar**。 sister Phase 3.2 governance.ts isVetoed 1-line guard pattern延袭，Phase 3.3 install.ts resolveAlias 同 pattern continued — "1 line not 6" Karpathy surgical 跨 phase 已成熟为 standard helper integration pattern。
- **Lesson 4：D-02 silent install sister Unix tool 习俗 (ls/cp 不 warn aliases)**。 INSTALL-WARN console.warn() 不可 sneak-in — CI 噪声 + 重复警告 + R7.5 "install 通过" 语义对齐。Doctor 是 human-readable audit surface (主动 invoke), install 是 silent capability delivery (passive)。 Sister Unix tool 习俗 cross-tool reusable convention。

### Process Improvements

- **Carry-forward closure tracking 模板成熟**: Phase 3.2 DEFERRED #2 dashboard-sse closed Phase 3.3 W0.2 + Phase 3.2 W3 carry-forward "DEFERRED #2 → Phase 3.3 OR dedicated patch session" 兑现 — cross-phase deferred-items closure rate signal 健康。
- **Anti-stall extended budget for ship wave**: Phase 3.2 W3 38-tool early stall → Phase 3.3 W2 50-tool extended budget proven适用 ship wave (9 task batch)。Pattern: discovery/research wave 25-30 tool; impl wave 35-40 tool; ship wave 50 tool。

### Carry-forward

- **DEFERRED #AC (Phase 3.3 own carry)**: aliases.yaml 真 deprecation entries seed → Phase 3.4 dogfood (本 phase MVP empty `aliases: {}` map)
- **DEFERRED #AD (Phase 3.3 own carry)**: install.ts harnessed_version source-of-truth — hardcoded '0.3.0' TODO marker; Phase 3.4 reads from package.json
- **DEFERRED #AE (Phase 3.3 own carry)**: path traversal hardening regex for resolveAlias → Phase 3.4 dogfood 时若 surface 实际 attack vector 再 add
- **userSpawn session_id capture (Phase 3.1 DEFERRED #2 + Phase 3.2 carry)** → Phase 3.4+ if real userSpawn demand
- **EE-4 BLOCKER auto-spawn rerun** → Phase 3.4 后 evaluate
- **plan-feature 真接外部 gsd-* spawn (D-03 WIRED MVP Phase 3.2)** → Phase 3.4 dogfood 时 transition stub → real
- 3-wave topology pattern + 16 commit cadence + manifest-domain colocation 3rd consumer rule + 5-recurrence terminus COLLAPSE precedent 都 ready 供 Phase 3.4 + v0.4.0 复用

---

## Phase 3.2 milestone retrospective — gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装 (2026-05-17 ship) — v0.3.0 milestone 2/4 progress

### What Went Well

- **W0.1 cli-audit env-dep CI red 解 (Phase 3.1 deferred #1 priority bump)**: R2 § 8 fix path A locally verified recipe (vi.mock audit-helpers.js) executed verbatim. CI 3-OS green restored 596+ pass.
- **D-01 PROBE → D-04 PUSH 全 4 activated zero-dep**: probe-gstack.ts (sister origin-check.ts) + interpolate.ts (zero npm dep守门 JINJA strict) + governance.ts (sister state.ts) + workflow/run.ts (B-01 fix activatePhase BEFORE isVetoed locked).
- **schemaVersion 8→11 surface single 兼容门 (Phase 2.2 CD-5 模式延袭)**: config.v1 + governance.v1 + planFeature.v1 三个独立 surface per Karpathy single-responsibility, branchOnSchemaVersion 守门 consistent.
- **doctor.ts Karpathy ≤200L clean (R2 § 1.4 baseline correction)**: KICKOFF stale 215L 修正 to 实测 175L; 加 6th check 186L 仍 clean, no helper-split needed (vs Phase 3.1 W-01 必 split).
- **3-wave executor batch + 1 hotfix-within-wave**: W0 4 commits + W1 8 commits (7 atomic + 1 deferred #2 doc) + W2 8 commits (6 atomic + 1 Rule 1 fix + 1 deferred #3 RESOLVED) + W3 e2e+ADR+ship 5+ commits = 总 24+ commits clean cadence.

### What Surprised Us

- **Latent W1 governance.v1 vetoed_at format bug 被 W2 T2.6 fixture 3 抓出**: TypeBox `format: 'date-time'` 需 FormatRegistry.Set 注册否则 Value.Check 返 false. W1 T1.7 ship d989c8e 起静默 (governance vetoed timestamp validate 失败 → null → isVetoed false → workflow 跑穿 veto). c37ee29 Rule 1 surgical fix → ISO_DATE_RE pattern; deferred #3 RESOLVED 同 commit.
- **Phase 3.1 sister deferred #1 cli-audit env-dep 复刻验证机制**: W0.1 fix path A vi.mock pattern 与 Phase 3.1 sister 修法 isomorphic — established pattern for "test mock not covering newly-added runtime helpers" recurring class.
- **W-01 sister precedent 复用**: cli-doctor.test.ts (Phase 1.2 起) 在 T1.8 6th check 加后 fail 同 cli-audit pattern, T1.8 commit 内 1 行 vi.mock 扩 spawnSync mock 覆盖 — 不开新 task, 不污 src.

### What We'd Change

- **Executor agent stall pattern recurring**: Wave 1 + Wave 3 executor 都在 ~40 tool uses 后 stalled mid-task. Anti-stall 协议 working (partial commit shipped) 但需考虑 dispatch granularity 更小 (3-4 task per executor instead of 6-8).
- **Pre-existing dashboard-sse env-dep flaky 未在 Phase 3.1 ship 时 catch**: 当时 CI green 但 local fail; Phase 3.2 W1 post-fix verify 才发现. Future: post-ship full local sweep also recommended sister CI green verify.

### Lessons Learned

- **Karpathy hard limit ≤200L 实测 baseline 必 verify**: KICKOFF 引用 doctor.ts 215L stale, R2 实测 175L. Lesson: planner pre-flight 实测 file LoC, KICKOFF copy-paste 不靠.
- **TypeBox format vs pattern 选择**: 全 project sister checkpoint.v1 用 pattern regex, governance.v1 W1 引入 format 是 inconsistent. Lesson: 沿袭 sister pattern (FormatRegistry.Set 重 setup, pattern regex 简单 zero-setup).
- **JINJA strict throw vs fallback empty**: Karpathy fail-loud 符合 Phase 3.1 D-01 enforceBudget throw 模式. Lesson: 一致 fail-loud policy 跨 helper.

### Process Improvements

- **W0.1 sister-class recipe lockable**: Phase 3.1 deferred #1 fix path A locally verified 在 W0 first task 一次执行 — sister pattern "test mock not covering newly-added runtime helpers" 已成熟可复用模板.
- **W-02 PhasesSchema unconditional extend 优先于 conditional/parallel schema**: Karpathy DRY 复用 parent schema (loadPhases-derived); 加 Optional fields backward-compatible.
- **Path divergence doc (W-03)**: PATTERNS.md § 2.4 indicative-of-pattern interpretation 允许 colocation rule choice (workflow/schema/ per sister phases.ts), 不强制 PATTERNS exact path. Recommend future PATTERNS 注明 indicative vs binding.

### Carry-forward

- **DEFERRED #2 dashboard-sse pre-existing flaky** → Phase 3.3 OR dedicated `fix(dashboard-sse-test)` patch session (3 fix path candidates documented in deferred-items.md)
- **userSpawn session_id capture (Phase 3.1 DEFERRED #2)** → Phase 3.4+ if real userSpawn demand (fresh-session fallback per B-02 still acceptable)
- **EE-4 BLOCKER auto-spawn rerun** → Phase 3.4 后 evaluate
- **plan-feature 真接外部 gsd-* spawn (D-03 WIRED MVP)** → Phase 3.3+ dogfood 时 transition stub → real
- 4 Wave topology pattern + 24 commit cadence + sister fix-class recipe lockable 都 ready 供 Phase 3.3 复用

---

## Phase 3.1 milestone retrospective — checkpoint 引擎 + harnessed resume + compact 协议 + T4.4 closure infra activation 闭环（2026-05-16 ship）— v0.3.0 milestone 第 1 phase START

### What Went Well

- **W3 T4.4 closure infra activation 闭环 = 1 milestone 闲置后首消费者 zero throwaway**：Phase 2.2 W4 T4.1 ship `sdkSpawn.onSessionId` + `ralphLoopWrap.resumeSessionId` + `engine.wrappedSpawn capturedSessionId` 三件套，conditional B-35 fallback DEFER → Phase 3.1 W3 T3.1+T3.2 **首消费者** activation 闭环 (D-04 WIRE-IN 实证)。 Phase 2.2 RETRO Lesson 1 "closure-infra-only 实施 = 零 throwaway 零阻塞" 兑现 — closure 三件套 1 milestone 闲置后激活 = 0 sunk cost；consumer 接入仅 30L cross 2 files (ralphLoop L43 + engine wedge L182)。 **经验**：conditional spike → fallback closure infra → 下 milestone consumer 接入 pattern 已 promoted 为 standard cross-phase practice。
- **W0 5-task one-shot absorb 沿袭 Phase 2.2-2.4 atomic-batch 模式**：W0.1 AUDIT.md § 0.5 Line Budget Deviations Accepted (doctor.ts 215L +7% B-03 5% tolerance + dashboard.mjs 610L well-under ≤650L 透明登记) / W0.2 RETROSPECTIVE Advisory Absorb Path 节 (polish round 2 commit attribution 复盘) / W0.3 ci.yml README completeness check WARN-ONLY round 1 (B-01 sister Phase 2.1 transparency 4-phase warn-only round 1 pattern) / W0.4 phase-2.4 self-check fr ≥ 0.80 verify report (deferred-items #2 self-referential 解决证据) / W0.5 tests/checkpoint/cli/integration dirs scaffold + vitest glob verify = 5 commits one-shot ship。 **经验**：phase-start Wave 0 backlog cleanup 已成熟为 cross-milestone standard practice (Phase 2.3 6 项 / Phase 2.4 5 项 / Phase 3.1 5 项)。
- **W-01 PRIMARY extract engineHook.ts 49L = engine.ts ≤200L Karpathy clean restored**：orchestrator decision W-01 promote engineHook.ts 从 wedge → PRIMARY extract sister Phase 2.2 sdkReconcile.ts 56L pattern；engine.ts 195→200L (≤200L hard limit edge, 0 tolerance used per Karpathy clean spec)；engineHook.ts 单独承接 checkpoint bridge logic (activatePhase + completePhase double-write) 保持 engine.ts 主流程清晰。 **经验**：≤50L helper extract pattern (sdkReconcile / engineHook) 已 promoted 为 cross-phase reusable extraction recipe — primary engine 主文件守 hard limit edge + helper 单一职责 + 测试隔离。
- **W-04 phaseId via TaskContext typed field = 0 `as any` cast**：orchestrator decision W-04 fix path a (推荐) via schema field 加 `phaseId?: string` instead of B path (cast `as any`)。 typed field clean + null fallback `'unknown'` warn-only fail-loud (`'[harnessed] WARN engineHook: phaseId="unknown" — checkpoint paths fall back...'`)。 **经验**：避免 `as any` cast 通过 schema field 扩 + null sentinel + warn-only fail-loud (sister Phase 2.2 type-only AgentDefinition 5-字段 vs 9-字段 reconcile pattern)。

### What Surprised Us

- **B-02 userSpawn niche docs vs extend cost 判断**：orchestrator decision B-02 userSpawn signature `(agentDef) => Promise<string>` 不加 onSessionId out-param (breaking change > value, <5% niche)；resume.ts falls back to fresh session + reload checkpoint (DEFERRED #2 → Phase 3.4+ if real demand)。 acceptable tradeoff — userSpawn 是 test seam 主要使用场景不要求 session_id capture；real production path 走 defaultSpawn 100% covered。**经验**：interface extension 决策应权衡 niche % vs breaking change cost；fresh-session fallback + 透明 deferred 是合理 escape hatch。
- **R2 § 1 cwd field critical addition for SDK session resume**：code.claude.com `<encoded-cwd>` 路径 critical constraint — RESEARCH 阶段实测 SDK session_id resume 跨 cwd 失败案例，checkpoint schema 必加 `cwd` field + resume 时 cwd mismatch warn (不强 block 保 RELOAD lock 不偷袭用户)。 **经验**：external API 跨主机/跨 cwd 行为 spike-first 实测 critical — 不依赖 doc fossil。
- **engine.ts 200L 边界**：W-01 PRIMARY extract 后 engine.ts 195L baseline → 加 5L for `activatePhase(phaseId)` + `completePhase()` calls = 200L exactly。 0 tolerance used per Karpathy clean spec；任何 future expand 必须 W-01 类似 extract 或 ADR errata 论证。 **经验**：≤200L hard limit edge 是 commit-level signal — 触 limit 就 trigger PRIMARY extract decision instead of 5% tolerance accept (sister Phase 2.4 doctor.ts 215L 合理性论证 5% accept 是 exception，不应作 default)。

### What We'd Change

- **cli-audit 2 pre-existing fail (pre-Phase 1.2) needs scheduled fix session**：tests/cli/audit baseline 2 fail pre-existing, Phase 3.1 ship 仍未修 — out of scope per Rule 4 (architectural; cli/audit.ts 内部逻辑 + tests refactor needed)。 **改进**：Phase 3.2 排定 1 scheduled fix session 优先于新 feature land — pre-existing fail 累计 risk = "broken windows" CI signal 麻木 (sister Phase 2.4 deferred-items #3 EE-4 ERR_MODULE_NOT_FOUND ship-time catch lesson)。

### Lessons Learned

- **Lesson 1：W-01 PRIMARY extract pattern 复用 (engineHook.ts 49L sister sdkReconcile.ts 56L)**。 Phase 2.2 sdkReconcile.ts ≤56L 已建立"helper extract for testability + main file 主流程 ≤200L"pattern；Phase 3.1 engineHook.ts 49L 第 2 次复用 = pattern 已成熟为 standard primary engine 主文件 hard limit 守护策略 (sister cross-phase reusable extraction recipe)。
- **Lesson 2：closure infra forward-compat 1 milestone 后激活 = high ROI**。 Phase 2.2 T4.1/T4.2/T4.3 +1d 开发量 但 T4.4 DEFERRED v0.3.0 — Phase 3.1 W3 T3.1+T3.2 30L cross 2 files 即激活闭环 (cross 2 files = ralphLoop L43 dead-wiring 删 + engine.ts L182 void placeholder 删 + checkpoint.write 触发)。 "conditional spike → fallback closure infra → next milestone consumer 接入" pattern 已 promoted 为 standard cross-phase practice。
- **Lesson 3：avoid `as any` cast via schema field 加 + null sentinel + warn-only fail-loud**。 W-04 fix path a (typed field) vs B (cast) 选 A — phaseId via TaskContext typed field + 'unknown' fallback + warn-only stderr。 sister Phase 2.2 type-only AgentDefinition 5-字段 vs 9-字段 reconcile pattern — schema 是 SSOT, cast 是 anti-pattern。

### Process Improvements

- **Sister-review absorb tier-call pattern continued — Wave C iter 1 2 BLOCKER + 4 WARNING → revision iter 1 6/6 fix per orchestrator decisions (B-01 + B-02 + W-01 + W-02 + W-03 + W-04) + iter 2 PASS**。 4-D-decision Batch-1 lock (D-01 + D-02 + D-03 + D-04) + 6 fix in revision iter 1 = sister Phase 2.4 W0 backlog 5 项一次根治 cadence 复用。 plan-checker EE-4 4/4 PASS RELAX baseline held strong across both iters。
- **Spike-first sequencing 跨 cross-phase 仍生效**：Phase 3.1 plan-phase Wave A R1 gsd-pattern-mapper 363→412L 15 files mapped + R2 gsd-phase-researcher RESEARCH.md 990L 12 sections = research baseline locked 后 Wave B planner directly consume，无 baseline drift；sister Phase 2.3 R-1 spike-first sequence pattern 跨 phase 复用。

### Carry-forward

- **DEFERRED #1 Phase 3.2 W0**: README completeness check ENFORCE flip — STATE.md/README.md format normalization prereq (sister Phase 2.1 transparency 4-phase warn-only round 1 → ENFORCE pattern)
- **DEFERRED #2 Phase 3.4+ if demand**: userSpawn session_id capture niche (currently fresh-session fallback acceptable per B-02; consumer demand triggers re-eval)
- **cli-audit Phase 3.2 fix session**: 2 pre-existing fail pre-Phase 1.2 — out of scope Phase 3.1; Phase 3.2 排定 1 scheduled fix session 优先于新 feature
- **EE-4 BLOCKER auto-spawn rerun**: Phase 2.4 D-02 down-scope → v0.3.0 plan-feature workflow w/ checkpoint 成熟后接入 (Phase 3.3 or Phase 3.4)

### Cost Patterns

- **commit 数**：Phase 3.1 = 27+ atomic commits (W0 5 + W1 4 + W2 4 + W3 3 + W4 5 + W5 6 final ship)
- **tests 增量**：543 → 596 (+53 cells across W0-W5；最大单 commit +11 cells = W2 T2.4 checkpoint template + archive tests + D-01 grep gate)
- **CI runs**：~6 runs (W0 + W1 + W2 + W3 + W4 + W5 ship final)
- **hard limit edge 情况**：engine.ts 195→200L = ≤200L hard limit edge (0 tolerance used per W-01 PRIMARY extract decision); engineHook.ts 49L (≤50L per W-01 acceptance); 全 NEW files (template/state/archive/sigintTrap/resume/compact/cli-resume) 全 ≤80L hard limit
- **closure infra activation 实施成本**：W3 T3.1 + T3.2 cross 2 files 30L (ralphLoop L43 dead-wiring 删 + engine.ts wedge L182 void placeholder 删 + W-01 engineHook.ts 49L 新增) = D-04 WIRE-IN 实证 + Phase 2.2 closure infra 三件套 0 sunk cost validation

### Next Phase Prep Notes

- **Phase 3.2 discuss-phase 启动入口**：v0.3.0 milestone 1/4 → 2/4 推进；gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装 + governance 层 pause + on_veto；候选启动 `/gsd-discuss-phase 3.2`
- **Sister review 触发**：Phase 3.1 ship 后建议跑 sister review post-ship (gstack `/review` Paranoid Staff Engineer)，重点：(1) ADR 0014 9 章节 vs Phase 2.2/2.3/2.4 ADR 0011/0012/0013 模板一致性；(2) engineHook.ts 49L PRIMARY extract pattern testability + 单一职责完整性；(3) SIGINT trap 30s timeout fallback corner case (Win 双 Ctrl+C force quit OS 行为；resume cwd mismatch warn-only soft fail policy 是否合理)；(4) compact.ts 75% threshold MVP placeholder 是否 future-proof (Phase 3.4 actual fold logic 接入路径预留);  (5) phase-2.4/task_plan self-check fr ≥ 0.80 (deferred-items #2 self-referential 解决证据) verify report 是否 hold

---

## Phase 2.4 milestone retrospective — doctor 完整版 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel（2026-05-16 ship）+ 🎯 v0.2.0 MILESTONE 4/4 CLOSE

### What Worked

- **spike-first sequencing (T2.0) 防 EE-4 plan-checker 量化阈值 over-fit**：W2 T2.0 量化 spike 8 real phase-1.1~2.3 PLAN+task_plan 跑实测 → 三阈值 RELAX 1.0 → 0.8 baseline lock（file_references_verified / reference_sources_real / concrete_acceptance）→ 后续 T2.2 walker + T2.4 quant-test 直接锚定 RELAX baseline 0 throwaway。**经验**：量化决策必须 spike 实测 → 死板 1.0 严格阈值 = 假阳爆炸 + 30 fixture 误杀；spike 优先（sister Phase 2.2 "feature gate 测试时机前置"）扩展到"量化阈值时机前置"。
- **T3.4 SKIP split 决断（dashboard.mjs 610L ≤ 650L）保留 single-file 简洁**：W3 评估 dashboard.mjs 是否拆分时实测 610L ≤ B-26 default 650L hard limit → SKIP split（单文件保留）= 0 wedge 0 churn。**经验**：karpathy simplicity 在"何时拆"决策也适用 — proactive split trigger 未触发就不拆，避免预防性 churn。
- **sister-share helper (origin-check.ts) 跨命令复用**：W1 T1.2 doctor 5 check + W4 T4.1 audit hard-fail 共用 `src/cli/lib/origin-check.ts` ~52L helper（allowFork 参数双模式 — doctor warn / audit fail）= 单一 origin URL 校验真相源；F2 + F5 acceptance bar 共同实现路径锚定。**经验**：lib/ 层 helper 提取 + boolean param 切换 mode = 比 2 独立实现 + drift risk 高 ROI。
- **DI-1 同日修复 precedent 沿袭（W6 T6.2 deferred-items #3 RESOLVED）**：Phase 2.3 DI-1 karpathy-skills.yaml schema fix 同日 hotfix → Phase 2.4 EE-4 yaml ERR_MODULE_NOT_FOUND 同 Wave 6 1-line ci.yml step reorder fix（move AFTER pnpm install）= step ordering bug pre-existing W2 T2.4 ship-time，masked by `continue-on-error: true`，mandatory W6 fix before ENFORCE=true flip。**经验**：deferred-items review cadence 必须在 ship 前一 Wave 跑（check-deferred-items.mjs strengthen），1-line fix 不推迟到 v0.3.0。
- **Wave 0 backlog 5 项一次根治 + ADR 0013 9 章节 sketch 提前**：W0 6 atomic task T0.1-T0.6（含 ADR 0013 sketch 126L draft → W6 T6.1 fill detail 185L）= W1+ 直接消费 sketch 无 churn；H3+T4 README counter / M1 RETRO entry / M2 schemaVersion 3rd consumer / T2 dashboard 决断 / T3 v0.3.0 prereq 锚定全 W0 ship。**经验**：sister Phase 2.3 Wave 0 backlog 6 项一次根治模式沿袭 = phase-start backlog cleanup 已 promoted 为 standard phase-pattern。

### What Was Inefficient

- **R2 RESEARCH KICKOFF doctor stale baseline finding**：T1.1 R2 critical finding "doctor.ts 152L not 38L"（KICKOFF baseline wrong → RESEARCH § 1.2 实测校正）= research 文档 valid-until 期内仍 drift（sister Phase 2.2 T1.1 lesson 1 复发）。**改进**：discuss-phase 锁 baseline 时直接 `wc -l` 抓真实数 + commit hash 锚定，不依赖 KICKOFF 文档历史快照。已在 ADR 0013 §1 implementation note 加 "wc -l verify 当 ship 时"。
- **Wave 5 task scope 重 interpret cost**：T5.2 30-fixture matrix 原 PLAN spec "10 + 10 + 10" 三层 → 实际 ship "16 real + 14 synthetic" 重 interpret（per B-15 + B-31 + D2.4-19 anti-redo discipline 反推 30 总数）= 1 round 来回 + 102L 比 100L target 微超。**改进**：plan-phase task spec 时数学和约束直接写死（"30 total = X real + Y synthetic 任意"），避免 ship 时重新求解。
- **EE-4 yaml ERR_MODULE_NOT_FOUND pre-existing bug 未在 W2 ship 时捕**：W2 T2.4 ci.yml EE-4 step plan-checker `node scripts/run-plan-checker.mjs` 调用 yaml-only routing/plan-review-schema.yaml → ESM yaml import fail，masked by `continue-on-error: true` → W5 deferred-items #3 catch → W6 T6.2 1-line step reorder fix。**改进**：CI step 加 yaml/config 文件 → 同 Wave 必须 standalone smoke test（`node script.mjs --self-check` flag）而非依赖 W6 ship-time review；`continue-on-error: true` 防 noise 但掩盖真实 fail = double-edge sword，应同步加 explicit "step succeeded but produced no output" assert。

### Patterns Established

- **Pattern (Phase 2.4 新生)**：
  - **R-1 spike-first 量化阈值 RELAX baseline lock**（T2.0 8 real phase 实测 → 三阈值 1.0 → 0.8）—— 决策值靠 spike 实测，不靠 PLAN 直觉
  - **R-2 sister-share helper boolean param 双模式**（origin-check.ts allowFork:false audit / allowFork:true doctor）—— 跨命令复用 + drift risk 单一真相源
  - **R-3 SSE watcher + EventSource browser-native** 替 mtime polling/WebSocket（zero-dep `text/event-stream` HTTP + reconnect 内建）—— 选最简协议 + 0 npm dep
  - **R-4 hard limit 5% 容忍**（doctor.ts 152→~215L > 200 hard limit per B-06）—— 简单优先但 not 教条，合理性论证后超 5% accept；避免预防性 split 制造 churn
  - **R-5 三计数一致 CI gate 精度 grep 排除 enumeration line**（Phase 2.[1-9] 精度排除 1.X 历史 + line-start + bold）—— README integrity B 路径根治 H3 第 3 次复发
  - **R-6 30-fixture matrix 真实 + 合成 mix**（T5.1 doctor 30 = 5 check × 6 env scenario / T5.2 plan-checker 30 = 16 real + 14 synthetic）—— anti-redo discipline 30 总数固定，真实 vs 合成比例任 phase 决断
  - **R-7 deferred-items same-Wave-before-ship review cadence**（check-deferred-items.mjs strengthen + W6 ship-time review mandatory）—— 1-line fix 不推迟到 v0.3.0
  - **R-8 phase-start Wave 0 backlog 一次根治 phase-pattern**（sister Phase 2.3 6 项 / Phase 2.4 5 项）—— phase-start backlog cleanup 已 promoted 为 standard practice
- **Pattern 沿袭 (Phase 2.4 验证)**：
  - Pattern conditional branch decision (Phase 2.2 R-1 / Phase 2.4 T3.4 SKIP split — proactive split trigger 未到不拆)
  - Pattern atomic transparency gate flip (Phase 2.2 R-6 — Phase 2.4 deferred-items #2 ENFORCE remain false flip 推 v0.3.0 W0 因 self-referential)
  - Pattern A7 守恒 自动化验收 (T6.2 ship-time `git diff adr-0012-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-2]-*.md" | wc -l = 0`，13 ADR baseline 全自动持续)
  - Pattern sister-share + boolean mode (Phase 2.4 R-2 新生 + 沿袭 Phase 2.2 R-3 schemaVersion 7-surface convention 思路)

### Key Lessons

- **Lesson 1：量化决策必须 spike 实测，死板 1.0 严格阈值 = 30-fixture 误杀**。T2.0 spike outcome RELAX 1.0 → 0.8 baseline lock 三阈值 + 14 synthetic fixture 跑实测验证 = 0 throwaway；plan-phase 时 "1.0 严格阈值" 直觉错误 → spike 推翻。"feature gate 测试时机前置" pattern (Phase 2.2 Lesson 1) 应扩展到"量化阈值时机前置"。
- **Lesson 2：sister-share helper + boolean param mode = 单一真相源跨命令复用比 2 独立实现 ROI 高**。origin-check.ts allowFork 双模式（doctor warn / audit fail）= 1 helper 服务 2 acceptance bar (F2 + F5) + 测试覆盖 1 套；vs 独立实现 2 套代码 + 2 drift risk + 2 test fixture。
- **Lesson 3：CI step 加 yaml/config 文件 → 同 Wave 必须 standalone smoke test，不依赖 W6 review**。EE-4 yaml ERR_MODULE_NOT_FOUND W2 ship-time 未捕被 `continue-on-error: true` 掩盖 → W5 deferred-items review catch → W6 1-line fix。`continue-on-error: true` 应同步加 explicit "step succeeded but produced no output" assert 防 silent fail mask。
- **Lesson 4：hard limit 5% 容忍是 simplicity 的工程化补丁，不教条**。doctor.ts 152→~215L 超 B-06 200L hard limit 7.5% > 5% 容忍上限，但 5 check + JSON flag + 三档 status 合理性论证后 accept；avoid premature split 制造 churn（sister T3.4 SKIP split = dashboard.mjs 610L ≤ 650L 同思路）。Karpathy simplicity ≠ 死板 hard limit，应给"合理性论证后超限"escape hatch。

### Cost Patterns

- **commit 数**：Phase 2.4 = 25+ atomic commits (W0 6 + W1 3 + W2 5 + W3 4 + W4 3 + W5 3 + W6 5 + 1 cross-phase 3fc0c42 dashboard polish round 2 pre-flight)
- **tests 增量**：492+3 → 543+4 (+51 cells across W0-W6；最大单 commit +30 cells = W5 T5.1 doctor 30-fixture matrix)
- **CI runs**：~7 runs (W1 doctor verify + W2 EE-4 verify + W3 dashboard SSE smoke + W4 audit + W5 e2e + final ship + W6 T6.2 deferred-items #3 fix verify)
- **hard limit 超额情况**：1 处（doctor.ts 152→~215L > 200 hard limit per B-06 5% tolerance — 合理性论证后 accept；sister T3.4 dashboard.mjs 610L SKIP split = 选 hard limit 守住）
- **deferred items disposition**（6 items review）：#1 T2.2+T2.4 line-limit ACCEPTED (biome blocking) / #2 phase-2.4 self-check inherent self-referential ACCEPTED (Wave 6 ENFORCE remain false, flip v0.3.0 W0) / #3 EE-4 yaml ERR_MODULE_NOT_FOUND RESOLVED W6 T6.2 (step reorder fix) / T1.1 dual-signal real-API → v0.3.0 (需 ANTHROPIC_API_KEY) / T4.4 Task Session → v0.3.0 (closure infra ready) / EE-4 BLOCKER auto-spawn → v0.3.0 (D-02 down-scope) / karpathy-skills local-copy install_type → v0.2.4+ (DI-1 Phase 2.3 deferred)

### Next Phase Prep Notes

- **v0.3.0 discuss-phase 启动入口**：v0.2.0 milestone 4/4 → CLOSED；next `/gsd-discuss-phase 3.0` 候选 — plan-feature workflow + checkpoint cadence + 路由命中率 ≥ 85% 验收 + gstack 前缀探测（ROADMAP § v0.3.0 必含项 1-7 已锁）
- **v0.3.0 backlog 三件套 ready**：
  - **T4.4 Task Session 复用 完整版**：closure infra 三件套 ready Phase 2.2 ship（sdkSpawn.onSessionId / ralphLoopWrap.resumeSessionId / engine.wrappedSpawn capturedSessionId），consumer 接入 + `harnessed.phases.v1` schema bump 加 `task_session_id?` field 即可
  - **EE-4 BLOCKER auto-spawn rerun**：Phase 2.4 D-02 down-scope 推 v0.3.0；CI fail + manual rerun 当前 acceptable，auto-spawn 待 plan-feature workflow w/ checkpoint 成熟后接入
  - **phase-X.Y self-check ENFORCE=true flip**：Phase 2.4 Wave 0 W0 deferred-items #2 self-referential inherent，v0.3.0 W0 flip
- **karpathy-skills local-copy install method**：DI-1 hotfix Wave 6 deferred → v0.2.4+ patch release 候选（新 `install_type: local-copy` 或 method `local-copy-with-setup` — 解 gitCloneWithSetup installer preflight 拒 custom cmd 问题）
- **Sister review 触发**：Phase 2.4 ship + v0.2.0 milestone close 后建议跑 sister review post-milestone (gstack `/review` Paranoid Staff Engineer + `/cso` 安全审查)，重点：(1) ADR 0013 9 章节 vs Phase 2.2/2.3 ADR 0011/0012 模板一致性；(2) doctor MIN 5 check 是否覆盖 v0.1 R02 P1#8 全部 5 维度；(3) audit 完整版 hard-fail policy 是否绊到 false positive；(4) v0.2.0 milestone archive 3 件 `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` + `.planning/v0.2.0-MILESTONE-AUDIT.md` 是否满足 sister v0.1.0 close 模式完整性

---

## 🎯 v0.2.0 MILESTONE CLOSE NOTE — Sub-task Loop + Extension Installers（2026-05-16 ship）

**v0.2.0 milestone 4/4 SHIPPED & ARCHIVED**（2026-05-15 启动 → 2026-05-16 close；2 day back-to-back from Phase 2.3 ship）

### 4 Phase ship 总览

| Phase | Theme | Ship Date | Atomic Commits | Tests Delta | ADR | Baseline Tag | Milestone Tag |
|-------|-------|-----------|---------------|-------------|-----|--------------|---------------|
| 2.1 | 4 placeholder installer 实装 (6 method 全覆盖) | 2026-05-15 | 25+ | 318→374 (+56) | 0010 installer-schema-errata | adr-0010-accepted | v0.2.0-alpha.1-installers |
| 2.2 | execute-task workflow + ralph-loop full SDK integration | 2026-05-15 | 30+ | 374→432 (+58) | 0011 execute-task-sdk-ralph | adr-0011-accepted | v0.2.0-alpha.2-execute-task |
| 2.3 | extension category 3 MVP + karpathy SKILL-ONLY + EE-5 + CD-3 + 30/30 routing 100% | 2026-05-16 | 31+ | 432→492 (+60) | 0012 extension-mvp-karpathy-inject | adr-0012-accepted | v0.2.0-alpha.3-extension-mvp |
| 2.4 | doctor MIN 5 check + EE-4 plan-checker 4 维 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel | 2026-05-16 | 25+ | 492→543 (+51) + 4 skipped | 0013 doctor-ee4-dashboard-audit-win | adr-0013-accepted | v0.2.0-alpha.4-doctor + 🎯 **v0.2.0** |

**累积**：111+ atomic commits / 318+3 → 543+4 (+225 cells across v0.2.0) / 4 ADR (0010-0013) / 4 baseline tag + 5 milestone tag accumulate + 🎯 v0.2.0 大 tag / 6 install method × 4-phase chain × SDK 0.3.142 real spawn integration × extension category MVP × doctor 完整版 × audit hard-fail × dashboard C 路径

### Milestone-level Patterns Established

- **A7 守恒 4-phase 连续验证**：ADR 0001-0013 main body 0 diff 持续 across Phase 2.1 → 2.2 → 2.3 → 2.4，ci.yml A7 step 每 push 实测 + 每 phase ship 时 ship-time double-verify（Wave 5 mid + Wave 6 ship-time），13 ADR baseline tag 0 false positive 0 false negative
- **discuss-delta absorbed pattern 跨 4 phase 成熟**：intel `omc-comparison.md` § CD-3 / CD-5 / CD-6 / D-01 / D-02 / D-03 / D-04 正式 delta absorbed via dedicated commits，不阻塞 plan-phase ship，plan-check delta round 2 单独验收（sister Phase 2.2 `f66de16` + `da2e812` / Phase 2.3 / Phase 2.4 同模式）
- **karpathy simplicity 4-phase 守住**：5 hard limit (doctor / audit / dashboard / ralphLoop / agentDefinition) 全过 phase 验证；T3.4 SKIP split (Phase 2.4) + closure infra 三件套 (Phase 2.2) = 0 wedge churn；hard limit 5% 容忍合理性论证 escape hatch (Phase 2.4 R-4 doctor.ts)
- **Wave 0 backlog 一次根治 phase-pattern**：sister Phase 2.3 6 项 / Phase 2.4 5 项 = phase-start backlog cleanup 已成熟为 standard practice
- **deferred-items review cadence**：Wave 5/6 ship-before review + check-deferred-items.mjs strengthen → 1-line fix 同 phase RESOLVED 不推迟（Phase 2.4 deferred-items #3 EE-4 yaml fix）
- **mock-based wiring harness 4-phase 验证**：30 sample test harness（Phase 1.4 起源 → Phase 2.2/2.3/2.4 沿袭）不依赖 real Claude inference 仍能 verify 完整 wiring chain，ROI 显著优于 real-API integration test

### Key Decisions Locked (v0.2.0)

- **D1.2.5-3 main-process-driven routing** 全 4 phase 实证 mitigated（subagent 不嵌套 / reload-plugins bug 规避）
- **SDK 引入策略**：Phase 2.2 `@anthropic-ai/claude-agent-sdk@0.3.142` INTRODUCE NOW（NOT v0.3+）— execute-task workflow 主流程必须 real spawn；4-layer dual-signal completion degradation-safe
- **schemaVersion 7-surface 单一兼容门**（Phase 2.2 CD-5）：harnessed.{phases,routing,manifest,sdk,agent,checkpoint,deferred-items}.v1 全 surface 走 `branchOnSchemaVersion<T>` helper
- **karpathy SKILL-ONLY 注入**（Phase 2.3 D-02）：CLAUDE.md 不动 + cp -R 干净 install + skill metadata-driven inject；R02 § 6 behavior-rule "CLAUDE.md merge engine" 推 v0.2.4+ patch release
- **doctor 5 check + audit hard-fail policy**（Phase 2.4 D-01 + R2.4.7）：origin URL drift hard-fail allowFork:false + cmd injection SHELL_EVAL_MARKERS + provenance cross-check = 完整 supply-chain defense
- **EE-4 plan-checker quantitative 量化 SSOT**（Phase 2.4 D-02）：routing/plan-review-schema.yaml NEW yaml-only SSOT 4 维 + RELAX baseline 0.8 + BLOCKER manual rerun（auto-spawn 推 v0.3.0 down-scope per B-12）
- **dashboard C 路径 3 子 FULL absorb**（Phase 2.4 D-04）：cc-hook-add 7th installer + SSE watcher + 多项目 + 3 处 enum 同步 + localhost-only bind

### Issues Resolved (v0.2.0)

- Phase 2.1 transparency 反模式根治 ENFORCE=true（Phase 2.2 W0）— 连续 2 phase 复发的 "100% 聚合数字盖过真实状态" 升级到 CI gate level
- ralph-loop completion-promise 不可靠（issue #1429）— Phase 2.2 dual-signal 4-layer 完成检测 + Phase 2.4 Win sentinel 5 fixture 跨平台验证
- Windows native CI ralph-loop 兼容 — Phase 2.4 F5 `if: runner.os == 'Windows'` + `shell: bash` + 5 fixture matrix
- audit 完整版（R02 P1#10）— Phase 2.4 origin URL hard-fail + signed_by 校验 + 4 步 fallback（R03 § 1.3）
- doctor health check 完整版（R04 P1#8）— Phase 2.4 MIN 5 check + JSON flag + 三档 status
- DI-1 karpathy-skills.yaml schema fix（Phase 2.3 同日 hotfix）+ EE-4 yaml ERR_MODULE_NOT_FOUND（Phase 2.4 W6 T6.2 1-line fix）— deferred-items review cadence same-Wave-before-ship 验证

### Issues Deferred (→ v0.3.0 / v0.2.4+)

- **T4.4 Task Session 复用 完整版**：closure infra 三件套 ready Phase 2.2 ship，v0.3.0 consumer 接入 + schema bump
- **EE-4 BLOCKER auto-spawn rerun**：Phase 2.4 D-02 down-scope；v0.3.0 plan-feature workflow w/ checkpoint 成熟后接入
- **karpathy-skills local-copy install method**：DI-1 hotfix Wave 6 deferred → v0.2.4+ patch release 候选
- **phase-X.Y self-check ENFORCE=true flip**：Phase 2.4 Wave 0 W0 deferred-items #2 self-referential inherent，v0.3.0 W0 flip
- **路由命中率 ≥ 85% 验收**（30 sample × Haiku/Sonnet/Opus 各 ≥ 8）：v0.3.0 R4.2 Phase 3.4 正式跑（v0.2.0 Phase 2.3 30/30 = 100% 是 extension category 范围，非 model-distributed full benchmark）
- **R3.4 multi-source merge segment-by-source**：随 F40-2 SDK dep deferred v0.2+ → Phase 2.2 SDK 引入但 merge 模块未实装，推 v0.3.0+

### Technical Debt Incurred (v0.2.0)

- doctor.ts 215L > 200 hard limit 5% tolerance（合理性论证后 accept；不预防性 split 制造 churn）
- dashboard.mjs 610L ≤ 650L default split trigger 未到（T3.4 SKIP split 决断；proactive split trigger 触发再拆）
- `harnessed.phases.v1` schema 未加 `task_session_id?` field（推 v0.3.0 T4.4 consumer 接入时 schema bump）
- routing/plan-review-schema.yaml 量化阈值 RELAX 0.8（spike-baseline lock；v0.3.0+ collected fixture 规模扩大后可重新 spike 收紧）

### Milestone Tag 累积（v0.2.0 ship 时刻 frozen）

- alpha.1-schema-frozen / alpha.2-installer-runtime / alpha.3-base-profile / alpha.4-routing-engine / alpha.5-routing-l2-engineering（v0.1.0 inherited）
- **v0.2.0-alpha.1-installers / v0.2.0-alpha.2-execute-task / v0.2.0-alpha.3-extension-mvp / v0.2.0-alpha.4-doctor**（v0.2.0 4 phase）
- 🎯 **v0.2.0**（大里程碑 close tag）

### Archive 3 件（Wave 6 T6.5 ship）

- `.planning/milestones/v0.2.0-ROADMAP.md` — 4 phase summary + key decisions
- `.planning/milestones/v0.2.0-REQUIREMENTS.md` — R2.x.y + R5.3 + R6.x close + traceability
- `.planning/v0.2.0-MILESTONE-AUDIT.md` — sister v0.1.0 audit pattern；PASS / DEFERRED 逐 req verdict

### Key Decisions Shipped (archived from STATE.md L31 — 2026-05-17 sister review H2 absorb)

> **Archive source**: STATE.md L31 "Phase 2.4 关键决议 ship 总结" 节 — sister review post-Phase-3.3-ship H2 finding: 历史 phase 总结占 STATE.md SSOT prime real estate; archive 纪律 institutionalize per Phase 3.3 sister cadence. Phase 3.1+3.2+3.3 各 phase 总结仍在各自 phase 目录 `{KICKOFF, CONTEXT, ADR}` 文档 + 本 RETRO 各自 section.

1. **doctor MIN 5 check (D-01)** — `src/cli/doctor.ts` 4 → 5 check (+origin URL warn) + `--json` flag + 三档 status enum (pass/warn/fail) + helper `origin-check.ts` sister-share
2. **EE-4 plan-checker 4 维 SSOT (D-02)** — `routing/plan-review-schema.yaml` 4 维 + `scripts/run-plan-checker.mjs` walker + T2.0 RELAX baseline (3 阈值 1.0 → 0.8) + BLOCKER manual rerun (auto-spawn 推 v0.3.0)
3. **dashboard C 路径 3 子功能 FULL absorb (D-04)** — cc-hook-add 第 7 install method + SSE watcher (替 mtime polling, zero-dep) + 多项目支持 + 3 处 schema enum 同步加
4. **audit 完整版 hard-fail (R2.4.7)** — origin URL drift hard-fail (allowFork: false) + cmd injection SHELL_EVAL_MARKERS refinement + provenance cross-check
5. **ralph-loop Win sentinel (F5)** — 5 fixture (simple/multi-iter/max-iter/subagent-mock/structured_output) + `if: runner.os == 'Windows'` + `shell: bash`
6. **README CI counter gate (D-03 B 路径)** — 三计数一致 grep -cE 精度匹配 (SHIPPED == BARS == L44) + line-start + bold + Phase 2.[1-9] 精度排除 1.X 历史
7. **Wave 0 backlog 5 项一次根治** — H3+T4 README counter / M1 RETRO dashboard polish round 1 / M2 schemaVersion 3rd consumer (check-provenance.mjs) / T2 dashboard absorb 决断 / T3 v0.3.0 prereq 注记
8. **deferred-items #3 RESOLVED** — EE-4 step reorder fix (move AFTER pnpm install) 1-line ci.yml 修
9. **v0.2.0 MILESTONE 4/4 CLOSED** — 4 phase ship (Phase 2.1+2.2+2.3+2.4) + 13 ADR + 13 baseline tag + 9 milestone tag accumulate + archive + audit ship

---

*Phase 2.4 + v0.2.0 MILESTONE 4/4 RETROSPECTIVE complete — 2026-05-16 ship；25+ commits Phase 2.4 / 111+ commits v0.2.0 cumulative / 543+4 tests / 13 ADR + 13 baseline tag iterate / 9 milestone tag 累积 + 🎯 `v0.2.0` 大 tag / 4 phase ship across 2 day back-to-back (Phase 2.3 ship 2026-05-16 → Phase 2.4 ship 2026-05-16) / doctor 完整版 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 一次根治。下个 retro entry 在 v0.3.0 Phase 3.1 ship 后续编。*

---

## Phase 2.3 milestone retrospective — extension category MVP + karpathy SKILL-ONLY 注入 + EE-5 CLI + 30/30 routing (2026-05-16 ship)

### What Worked

- **Spike-first sequence (W1 plan-check fix from Wave C delta) closed RESEARCH-baseline drift gap one-shot**：T0.10 always_active spike 提前到 Wave 0 (原 Wave 4 T4.2 反序)，FAIL outcome 立即触发 R2 A1 fallback (description-keyword + self-reflexive prompt)，W2 T2.3 SKILL.md ship 时 frontmatter 设计已 informed —— 零 "ship 后回炉" 成本。**经验**：spike spec MUST precede consumer ship；spike outcome 决定后续 ship 设计的 task 必须前置。
- **Fallback paths locked at research time = ship-time zero re-evaluation**：R2 ASSUMPTIONS § 2 A1 已 lock fallback path (description-keyword + self-reflexive prompt)，否则 T0.10 spike FAIL 会触发 Wave 0 中断或 over-engineering 探索。**经验**：research-time conditional branching → ship 时直接走 fallback path，无需重新评估。
- **M3 perf gate 根治 via removal not threshold = anti-pattern terminus**：D2.3-1 (a) 移出 CI critical path = 业内共识 (vitest / Next.js / Deno / TanStack Query nightly cron 模式)。**Phase 1.3 / 1.3.1 / 2.2 累计 5 次 nudge (50→75→100→130→160ms)** 终止 — 根治 = 重新审视 gate 位置 (critical vs advisory)，不是无限调阈值。**经验**：连续 3+ 次 perf threshold nudge = signal that gate is in wrong position；should move to advisory (`perf-bench.yml` nightly cron) not bump threshold.
- **Wave 0 一次根治 6 项 backlog 沿袭 Phase 2.2 atomic-batch 模式**：M1 / M2 / M3 / T1.2 / T1.3 / T5 全 Wave 0 ship；每 backlog 单 atomic commit；CI gate 多增 4 step (schema regen / schemaVersion grep / Win pwsh provenance sentinel / deferred items review)。**经验**：phase backlog 同时间一次根治 = 无 cross-wave dependency；STATE.md prereq notes → Wave 0 task 1:1 映射。
- **30/30 = 100% routing accuracy 远超 ≥85% bar (15% headroom) 沿袭 SAMPLES.md FRESH-N 模式**：Phase 2.3 SAMPLES.md 重置 (D-05 FRESH-30 不复用 Phase 2.2 6 category × 5 cross-domain)，新 30 sample (10 design + 10 content + 10 testing + 5 anchor + 1 false-pos + 4+ CD-3 disqualify edges)。 arbitrate 实测 100% hit (D-08 anchor 全 redirect 命中)。**经验**：phase-specific SAMPLES.md 重置 = 测试 surface 与 phase 决议 1:1 对齐；ROI 显著优于 real-API integration test (Phase 2.2 Lesson 5 mock-based pattern 复用)。
- **dashboard tooling (T-W6-2 absorb) cross-phase reference**：commit `0b4e76d` (scripts/dashboard.mjs NEW ~456L zero-dep ESM read-only `.planning/` + `docs/adr/` + git visualization + tiny inline md→html + mtime polling + hook-ready `--no-open` + port-occupied silent exit) — 跨 phase 2.2/2.3 boundary tooling reference；sister review M4 advisory absorb 到 Phase 2.3 Wave 6 RETROSPECTIVE 续编。
- **A7 守恒 ADR 0001-0011 main body 0 diff 双 verify** (Wave 5 T5.4 mid-wave + Wave 6 T6.4 ship-time)：12 ADR baseline tag iterate 全自动 ci.yml A7 step (`seq 1 0012` 双 for-loop); phase 1.1.1 H2 起步到 Phase 2.3 = 8 phase 累积，**0 false positive 0 false negative 0 ADR main body 越权改动**。
- **karpathy YAGNI MIN scope discipline**：不预扩 role-router scoring 中间层 (EE-1 推 v0.3+), 不扩 9-field manifest schema (EE-2 推 Phase 2.4) — Phase 2.3 仅装 5 NEW manifest + 升级 arbitrate ~15L + 新 CLI 78L + 新 schema gate 4 step。

### What Was Inefficient

- **DI-1 schema bug late discovery (Wave 5 T5.3 → Wave 6 hotfix delay)**：karpathy-skills.yaml `git_ref: HEAD` (Phase 1.1.1 hotfix M1 GIT_REF_PATTERN 违反) + `install_type:skill ↔ method:git-clone-with-setup` (ADR 0007 1:N closure 违反) — Wave 2 T2.4 ship 时未被 catch，因为 karpathy 不在 Wave 1 T1.6 5-manifest dry-run integration list。**根因**：W2 T2.4 manifest REWRITE 未触发 schema dry-run gate。**改进**：每个 NEW or REWRITE manifest **必须** 即加入 dry-run integration list (Wave 6 T-W6-1 T-W6-2 absorb 时已加入 schema-only sentinel)。
- **三 task SKIPPED Resolved 占位 (T4.2 + T5.1 部分 + T5.2)** = plan-execute mismatch signal**：T4.2 spike 已 W0 ship → Wave 4 占位 stamp; T5.2 spec 功能由 W2 T2.2 d6489bb 6 cells 覆盖 → SKIPPED; T5.1 4-cell spec functionally subsumed by W2 T2.2 (+3 complementary cells)。**根因**：plan-phase task spec 与 execute-phase 实际 shipping 顺序未完全锁定。**改进**：plan-check 时显式标 SKIPPED 候选 task，避免执行时仅占位。
- **T1.5 chrome-devtools-mcp method DEVIATION (plan said mcp-http-add, landed mcp-stdio-add)**：Rule 1 BUG fix — no HTTP endpoint upstream, npm stdio MCP per research § 3.3 — plan-phase RESEARCH 节未完整 verify upstream HTTP availability。**改进**：plan-phase manifest example 必须 cite RESEARCH-verified install method (or DEFERRED if unverified)。

### Patterns Established

- **Pattern (Phase 2.3 新生)**：
  - **R-1 Spike-first sequence 提前 (W1 plan-check fix)** — T0.10 always_active spike Wave 4 → Wave 0 反序修正; spike outcome 决定的 consumer ship task 前置
  - **R-2 Fallback locked at research time** — R2 ASSUMPTIONS § 2 A1 secondary path (description-keyword) ship 时无需重新评估
  - **R-3 perf gate 根治 via removal** — D2.3-1 (a) 移出 critical path + perf-bench.yml nightly cron advisory only (vitest/Next.js/Deno/TanStack Query 业内共识)
  - **R-4 Wave 0 一次根治 6 backlog** — STATE.md prereq notes → Wave 0 task 1:1 atomic-batch
  - **R-5 SAMPLES.md FRESH-N reset 模式** — phase-specific 30 sample 重置不复用 (D-05 strict bound + 5 anchor case + 1 false-pos + N CD-3 disqualify edges)
  - **R-6 EE-5 5Q gate dual-layer (CLI L1 + plan-phase L2 + gsd-plan-checker BLOCKER)** — `harnessed manifest-add` 78L commander.js + readline + plan-phase KICKOFF § 7 self-meta + BLOCKER (非 warning)
  - **R-7 CD-3 negative-space arbitrate redirect 单一 SSOT** — `decision_rules.yaml` 不开第二来源避免 schema 分裂; arbitrate() legacy 保留避免 byte-stable 回归
  - **R-8 dashboard cross-phase tooling reference** — `scripts/dashboard.mjs` 跨 phase boundary read-only visualization; 沿袭 sister review 跨 phase observability
- **Pattern 沿袭 (Phase 2.3 验证)**：
  - Pattern P (SAMPLES.md inline truth table) — Phase 1.4 起源；Phase 2.3 T4.1 复用 reset 模式
  - Pattern J (test fixture inline) — Phase 1.5 起源；Phase 2.3 T3.3 / T4.3 / T5.1 复用
  - Pattern N (engine ≤ 200L) — Phase 1.4 起源；Phase 2.3 arbitrateWithRedirect proactive split 守住
  - Pattern atomic-3-action W0 backlog (Phase 2.2 transparency gate flip) — Phase 2.3 backlog 6 项 atomic-batch 复用

### Key Lessons

- **Lesson 1：Spike spec MUST precede consumer ship — W1 plan-check fix saved Wave 4 ship-time scramble**。T0.10 always_active spike 提前 Wave 4 → Wave 0 反序修正 + spike outcome 决定的 consumer ship task (W2 T2.3 SKILL.md) 前置 = 零 "ship 后回炉" 成本。
- **Lesson 2：Fallback path locked at research time = ship-time zero re-evaluation**。R2 § 2 A1 secondary path 已 lock (description-keyword)，否则 T0.10 spike FAIL 会触发 Wave 0 中断或 over-engineering 探索。 Research-time conditional branching = 决策点收敛在 research-phase。
- **Lesson 3：连续 3+ 次 perf threshold nudge = signal that gate is in wrong position**。Phase 1.3 / 1.3.1 / 2.2 / 2.3 累计 5 次 perf gate threshold nudge (50→75→100→130→160ms) 才悟到 root cause 是 gate 位置 (critical vs advisory)，不是 threshold value。Phase 2.3 D2.3-1 (a) 移出 CI critical path = 业内共识。**根治 = 重新审视 gate 位置**，不是无限调阈值。
- **Lesson 4：每个 NEW or REWRITE manifest 必须即加入 schema dry-run integration list**。DI-1 root cause = W2 T2.4 karpathy-skills.yaml REWRITE 后未加入 Wave 1 T1.6 dry-run list，schema bug 直到 Wave 5 T5.3 e2e smoke 才被 catch。 改进：dry-run integration list 即时同步。
- **Lesson 5：plan-check 时显式标 SKIPPED 候选 task**。三 task SKIPPED Resolved 占位 (T4.2 + T5.1 部分 + T5.2) = plan-execute mismatch signal — plan-phase task spec 与 execute-phase 实际 shipping 顺序未完全锁定。
- **Lesson 6：phase-specific SAMPLES.md FRESH-N reset 优于复用**。D-05 锁 30 FRESH samples 不复用 Phase 2.2 6 category × 5 cross-domain；测试 surface 与 phase 决议 1:1 对齐；ROI 显著优于 real-API integration test。

### Cost Patterns

- **commit 数**：Phase 2.3 = 31+ atomic commits (含 1 biome-fix `41b5fc6` + 1 hygiene `98facef` W3 sister review remediation + 1 dashboard tooling `0b4e76d` cross-phase + 1 DI-1 hotfix `5ccc631` + Wave 6 ADR 0012 finalize + ci.yml A7 iter + STATE+RETRO 续编 + baseline tag)
- **tests 增量**：432+3 → 492+3 (+60 cells across W0-W6；最大单 commit +6 cells = W3 T3.3 d6489bb manifest-add-ee5 + 30 cells = W4 T4.3 2c4442e samples-30 harness)
- **CI runs**：~8 runs (含 W2-fix biome formatter retries + hygiene + DI-1 hotfix verify + final ship)
- **delta absorption 成本**：CD-3 ⭐⭐⭐ negative-space absorbed 0 throwaway (W2 T2.1 + T2.2 + T2.5 ~ 15L arbitrate upgrade); EE-5 ⭐⭐ 5Q dual-layer absorbed (W3 78L CLI + plan-phase KICKOFF § 7 self-meta) = high ROI
- **DI-1 hotfix 成本**：1 atomic commit `5ccc631` + 1 NEW schema-only sentinel test cell (manifest-install-dry-run.test.ts +1 cell) + 1 e2e test regex update (phase-2.3-e2e.test.ts Link 5 `install_type:skill` → `install_type:git`) = 低成本 surgical 修复

### Next Phase Prep Notes

- **Phase 2.4 doctor 完整版入口**：v0.2.0 milestone 3/4 → 4/4 推进；EE-4 plan 4 维量化阈值 schema (omo ⭐⭐) absorb 候选 OR phase 2.5 独立 — plan-phase 时决断
- **v0.3.0 backlog 锚定**：T4.4 Task Session 复用 完整版 — closure infra 三件套 ready (sdkSpawn.onSessionId + ralphLoopWrap.resumeSessionId + engine.wrappedSpawn capturedSessionId)，consumer 接入 + `harnessed.phases-yaml.v1` schema bump 加 `task_session_id?` field 即可
- **v0.2.4+ backlog 锚定**：karpathy-skills 全 local-copy install method (新 `install_type: local-copy` 或 method `local-copy-with-setup`) — DI-1 hotfix Wave 6 deferred → 解 karpathy gitCloneWithSetup installer preflight 拒 custom cmd 的问题; 完整 install + dry-run integration coverage
- **Sister review 触发**：Phase 2.3 ship 后建议跑 sister review post-ship (gstack `/review` Paranoid Staff Engineer)，重点：(1) ADR 0012 9 章节 vs Phase 2.2 ADR 0011 9 章节 模板一致性; (2) 30 SAMPLES routing 100% 是否有 over-fitting (false-pos guard cell 是否充分); (3) DI-1 hotfix outcome 是否引入新 schema corner case; (4) T-W6-1 STATE.md freshness gate 是否真捕捉到未来 STATE 漂移

---

## Phase 2.2 milestone retrospective — execute-task workflow + ralph-loop full SDK integration（2026-05-15 ship）

### What Worked

- **discuss-phase + plan-phase delta absorbed 一次性根治 transparency 反模式**：phase 1.4 T1 "100% 实际 70%" + phase 1.5 H1/M1 "聚合数字盖过真实状态" + phase 2.1 sister review 复发 → Phase 2.2 Wave 0 atomic 三动作（`ENFORCE=true` flip + 13 verdict 文档 marker migration + freshness ext 扩展 README/PROJECT-SPEC）= 结构性根治。**经验**：连续 2 phase 复发的反模式必须升级到 CI gate level，warn-only 不够。
- **delta gray area absorption 流程化**：intel `omc-comparison.md` § CD-5 / CD-6 / CD-4 (3 ⭐⭐+ items) 在 discuss-phase plan-phase 之间作为正式 delta absorbed（commit `f66de16`），不阻塞 plan-phase ship，且 plan-check delta round 2 (`da2e812`) APPROVED WITH CONDITIONS S1/S2 inline。**经验**：intel-driven decision 通过 absorbed delta 而不是 ad-hoc 临时加塞。
- **A7 守恒 自动化验收**：T6.3 `git diff adr-0010-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" | wc -l = 0` 自动 verify。**phase 2.2 = 11 ADR baseline tag iterate 全自动**（ci.yml 60+L A7 step + fallback `missing_tags` graceful + 三平台 sentinel）；从 phase 1.1.1 H2 起步到 Phase 2.2 = 7 phase 累积，0 false positive 0 false negative，0 ADR main body 越权改动。
- **conditional branch decision (CD-4 / B-35)** = 最佳决策模式实证：Wave 1 SC4 verify spike → outcome PARTIAL → fallback branch triggered → T4.4 DEFERRED v0.3.0 + closure infra 三件套铺好 (sdkSpawn.onSessionId / ralphLoopWrap.resumeSessionId / engine.wrappedSpawn capturedSessionId)，v0.3.0 仅需 consumer 接入。**经验**：feature gate 测试时机前置 + closure-infra-only 实施 = 零 throwaway + 零阻塞。
- **research baseline correction 流程化**：T1.1 实测 SDK `AgentDefinition` shape `disallowedTools` 已迁至 SDK input layer → research baseline 4→5 / 10→9 字段 inline correction note in PATTERNS § 2.3。**经验**：research 文档 valid-until 期内仍可能 drift；T1.1 spike-first pattern 保证 plan-phase decision 锚定真实 API surface 而非 doc fossil。
- **30 sample harness wiring round-trip**：T5.5 `run-samples.mjs` 30/30 COMPLETE 100% mocked SDK round-trip pattern 沿袭 phase 1.4 SAMPLES harness — 不依赖 real Claude inference 仍能验证完整 wiring chain (CLI parse → workflow load → agentFactory → sdkReconcile → sdkSpawn mock → 4-layer isComplete → ralphLoop COMPLETE 闭合)。**经验**：mock-based wiring harness ROI 显著优于 real-API integration test。
- **karpathy simplicity 守住**：Wave 2 ralphLoop.ts 42→49L ≤ 50 hard limit (B-26) / agentDefinition.ts 191L ≤ 200L (H3) / sdkReconcile.ts 56L (split per B-24) / phases.ts 50L (T3.1) / loadPhases.ts 30L (T3.2) — 全 hard limit 守住，0 wedge 越界。
- **sub_repos = []** vanilla single-repo 全 commit 流程清晰，36 atomic task → 30+ atomic commits (含 3 W2-fix Rule 3 + 1 hygiene + 1 PLAN-CHECK-DELTA fix)。

### What Was Inefficient

- **W2-fix 3 次累积 perf gate jitter**：F18b 50→100→110→130ms (Win 3-tier) + F38b 50→75→100ms (Ubuntu 3-tier) 共 3 commits Rule 3 auto-fix —— root cause: GitHub windows-latest migrate 到 windows-2025-vs2026 + Ubuntu cloud-VM degrade class shift。**改进**：perf gate threshold 写成 3-tier env-aware const (`IS_CI_WIN=130 / IS_CI_NIX=100 / local=75`) 之后 0 失败，**早 1 phase (1.3.1) 就该 land 3-tier 而不是 2-tier**。
- **schemas/manifest.v1.schema.json regen drift**：Phase 2.1 ship 时 spec.ts MIT-0/anthropics-official + license_source 添加，但 generated `schemas/manifest.v1.schema.json` 未同步 regen → Phase 2.2 commit `18150a5` hygiene fix。**根因**：`validate:schema` CI step 仅校验 instance（用 schema.json 校验 manifest fixture）而非 schema-vs-source drift。**改进**：加 pre-commit hook 或 CI step `pnpm build:schema && git diff --exit-code schemas/manifest.v1.schema.json` 防 drift。
- **ADR 0011 章节 6 → 9 expansion 时序**：discuss-delta 加 § 7 / § 8 / § 9 后，Wave 0 T0.2 draft 仍 6 章节 → Wave 6 T6.1 fill detail 时被动扩到 9 章节。**改进**：discuss-delta absorbed 时直接 sync T0.2 draft skeleton（不只 task_plan.md / PLAN.md 同步）。

### Patterns Established

- **Pattern (Phase 2.2 新生)**：
  - **R-1 conditional branch decision via SC verify**（T1.2 SC4 = PARTIAL → fallback branch B-35 → DEFERRED v0.3.0；closure infra 三件套铺好 forward-compat）—— spike-driven feature gate 时机前置
  - **R-2 4-layer dual-signal isComplete**（PRIMARY structured_output + FALLBACK `<promise>` + 2 catch path）—— degradation-safe completion 检测
  - **R-3 schemaVersion 单一兼容门** convention (`harnessed.<surface>.v1` × 7 surfaces + branchOnSchemaVersion<T> helper) —— cross-boundary artifact 演进
  - **R-4 provenance gate hard fail before-runtime-floods**（CD-6 BEFORE-W4 enforce + scope 限 `.harnessed/{sessions,checkpoints,route-logs}/**`）—— curated vs runtime artifact 区分
  - **R-5 mock-based wiring harness 30 sample** (T5.5 `run-samples.mjs` 不依赖 real API) —— ROI 显著优于 real-API integration
  - **R-6 atomic transparency gate flip (3-action atomic)**（ENFORCE flip atomic commit + verdict migration atomic + freshness ext atomic）—— 易 revert if migration miss
- **Pattern 沿袭 (Phase 2.2 验证)**：
  - Pattern N (engine.ts 主流程编排 ≤ 200L) — phase 1.4 起源，Phase 2.2 T4.2 199→195L 守住
  - Pattern O (systemPrompt.ts verbatim instructional template ≤ 80L) — phase 1.4 起源，Phase 2.2 T2.3 53→66L 守住
  - Pattern P (SAMPLES.md inline truth table 30 sample × 4 phase) — phase 1.4 起源，Phase 2.2 T5.4 沿袭 selection rationale + Known miss 节
  - Pattern Q (Kahn iterative DAG ≤ 200L) — phase 1.5 起源，Phase 2.2 不使用但保留 forward-compat
  - Pattern J (test fixture tmpdir + rmSync afterEach + inline) — phase 1.5 起源，Phase 2.2 T3.4 load-phases.test / T4.3 sdk-spawn.test / T4.3 routing-engine.test 复用

### Key Lessons

- **Lesson 1：feature gate 测试时机前置 + closure-infra-only 实施 = 零 throwaway 零阻塞**。T1.2 SC4 PARTIAL outcome 触发 B-35 fallback → T4.4 DEFERRED v0.3.0；但 T4.1/T4.2/T4.3 仍铺好 closure 三件套 (sdkSpawn.onSessionId + ralphLoopWrap.resumeSessionId + engine.wrappedSpawn capturedSessionId)，v0.3.0 仅需 consumer 接入 + `harnessed.phases.v1` schema bump 加 `task_session_id?` field。
- **Lesson 2：research baseline 即使 valid-until 期内仍可能 drift；T1.1 spike-first pattern 锚定真实 API surface**。SDK 0.3.142 `AgentDefinition` shape disallowedTools 迁至 SDK input layer = research baseline 4→5 / 10→9 字段，inline correction note in PATTERNS § 2.3 + ADR 0011 § Decision 1+4 inline 修正。
- **Lesson 3：连续 2 phase 复发的反模式必须升级到 CI gate level (W3 ENFORCE=true)，warn-only 不够**。Phase 1.4 T1 "100% 实际 70%" + Phase 1.5 H1/M1 "聚合数字盖过真实状态" + Phase 2.1 sister review 第 3 次复发 → Phase 2.2 Wave 0 atomic 三动作根治。
- **Lesson 4：discuss-delta absorbed pattern**（commit `f66de16`）是 plan-check round 2 之外的正式 plan layer absorption 流程 — intel-driven decision 不阻塞 plan-phase ship，且 plan-check delta 可单独 round 2 验收（`da2e812` APPROVED WITH CONDITIONS）。
- **Lesson 5：perf gate threshold 应该早 1 phase land 3-tier env-aware const**（IS_CI_WIN / IS_CI_NIX / local），避免连续 3 次 Rule 3 nudge 累积。Phase 1.3 / 1.3.1 / 2.2 三次累积才悟到。
- **Lesson 6：generated schema 必须有 schema-vs-source drift 防护**（CI step `pnpm build:schema && git diff --exit-code` 或 pre-commit hook），否则 spec.ts 改动后 generated json 失同步。Phase 2.2 hygiene fix `18150a5` 是滞后修复。

### Cost Patterns

- **commit 数**：Phase 2.2 = 30+ atomic commits (含 1 hygiene `18150a5` + 3 W2-fix Rule 3 + 1 PLAN-CHECK-DELTA fix `da2e812` + 1 T0.4-fix + 1 T1.4-fix + 1 T4.4 DEFER markers `643f29e`)
- **tests 增量**：374+3 → 432+3 (+58 cells across W1-W6；最大单 commit +12 cells = T4.3 `7c12e7a`)
- **CI runs**：~10 runs (含 W2-fix 3 次 Win/Ubuntu perf jitter retries + hygiene + final ship)
- **discuss-delta 决策成本**：3 ⭐⭐+ items absorbed 0 throwaway，conditional branch (CD-4) 决策成本 ≈ 1 spike (T1.2 SC4 4h) + 1 DEFER markers commit (`643f29e`) = high ROI
- **closure infra 提前铺设**：T4.1/T4.2/T4.3 +1d 开发量 但 T4.4 DEFERRED 仍保留 v0.3.0 ready 价值 = 0 sunk cost

### Next Phase Prep Notes

- **Phase 2.3 discuss-phase 入口**：v0.2.0 milestone 2/4 → 3/4 推进；roadmap 骨架原 /autoplan + v3 重排时定，下一 phase plan-phase 时定具体范围
- **v0.3.0 backlog 锚定**：T4.4 Task Session 复用 完整版 — closure infra 三件套已 ready，consumer 接入即可
- **Phase 2.4 backlog 锚定**：EE-4 plan 4 维量化阈值 schema (omo ⭐⭐) — Phase 2.4 doctor 完整版 absorb OR 独立 phase 2.5
- **Sister review 触发**：Phase 2.2 ship 后建议跑 sister review post-ship (gstack `/review` Paranoid Staff Engineer)，重点：(1) dual-signal 4-layer 路径全覆盖；(2) schemaVersion 7-surface consumer branch enforcement；(3) provenance gate 跨平台 sentinel sanity check；(4) T4.4 DEFERRED 文档完整性（closure infra 三件套引用是否清晰）

---

*Phase 2.2 RETROSPECTIVE complete — 2026-05-15 ship；30+ commits / 432+3 tests / 11 ADR + 11 baseline tag iterate / 6 milestone tag 累积 / 6 install method × 4-phase chain × SDK 0.3.142 real spawn integration ship。下个 retro entry 在 Phase 2.3 ship 后续编。*

---

## § ARCHIVED FROM STATE — Phase 1.X-3.2 (first ship-time T6.N implementation per Phase 3.4 W0.1 D2)

> **Archived 2026-05-17** by Phase 3.4 W0.1 STRATEGIC institutionalize (4 D-decisions LOCKED: D1 single-SoT trim + D2 ship-time T6.N archive cadence + D3 `scripts/check-state-archive-stale.mjs` 3-rules gate warn-only round 1 + D4 ship-process integrate Plan 03 W2 T2.3 standing process). STATE.md 723L → 146L round 1 (well under ≤200L target; future v0.4+ tighten ≤150L per DEFERRED #AG).
>
> **Cadence**: This § ARCHIVED FROM STATE — Phase {N-2} section is the canonical resting place for prev-prev-phase narrative trimmed from STATE.md每 phase ship. Phase 3.4 = first implementation; Plan 03 W2 T2.3 includes "trim STATE prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE" sub-step as standing process Phase 3.4+ onward.
>
> **Scope archived** (3 sections, ~400L delta):
> 1. **L96-329 已完成 milestone narrative** — v0.2.0 MILESTONE 4/4 SHIPPED full detail (13 ADR accumulate + 9 milestone tag list + Phase 2.1+2.2+2.3+2.4 8/8 acceptance bar break-down) + Phase 1.1-1.5 all individual ship entries (47-22 atomic task per-phase + ADR 0001-0009 errata trail + 30-sample routing hit-rate evolution) + Phase 2.1 hotfix 2.1.1 (biome organizeImports CI red fix) + Phase 3.1+3.2 startup discuss-phase narrative.
> 2. **L518-624 Phase 1.5+2.0 Prereq Notes** — 8 接口契约 frozen detail (resolveDag 142L Kahn + semanticRouter.match 81L stub + AgentDefinition 14 字段 + ManifestSpec phase+triggers TypeBox + `<promise>COMPLETE</promise>` XML wrapper) + Phase 2.0 entry execute-task workflow主线 + ralph-loop full integration + 4 placeholder installer 实装 + 8 支柱 capture roadmap (A1' engineering 5 rules / A5' mattpocock_phases 4×21×23 / A7' triggers semantic L2 INTERFACE CLOSED / CAPABILITY DEFERRED v0.2+) + Phase 1.5 sister review H3/H4/M1 + transparency verify checklist 结构性根治.
> 3. **L625-683 Phase 2.3+2.4 Prereq Notes** — M1 schema regen drift CI gate + M2 intel `## 实施进度回填` + M3 perf gate 3-tier ADR errata + T1.2 schemaVersion consumer call site CI gate + T1.3 Win pwsh provenance sentinel + T5 deferred-items review cadence; H3+T4 README counter integrity CI gate root-cause-class 第 3 次复发根治 + M1 RETRO dashboard polish round 1 entry + M2 CD-5 schemaVersion 7 surface long-tail + T2 dashboard 进 Phase 2.4 doctor 完整版 absorb 评估 + T3 v0.3.0 backlog T4.4 Task Session 启动准备.
>
> **Preserved in STATE.md** (146L round 1):
> - L1-15 项目核心引用 (constant)
> - L17-21 当前位置 block (sole SSOT marker — `**Phase 3.3 SHIPPED**` literal anchor for STATE_POSITION_RE freshness gate)
> - 已完成 phase ship 历史 compact list (13 entries 1-line each per Phase X.Y shipped ✅ literal — README counter integrity gate sync)
> - 待办 P0+P1+P2 (current churn only — v0.3.0 close window + v0.4+ items)
> - 关键提醒 (long-term constraints only — Cross-OS Day 1 + routing 30 sample tier coverage + bus factor + Karpathy ≤200L + biome preempt + STATE archive cadence + A7 守恒)
> - 累积上下文 Decisions (recent phase decisions + long-term constraints only; full Phase 1.1-3.2 decision table archived to this § ARCHIVED FROM STATE section)
> - 框架治理路由 (呼应 ~/.claude/CLAUDE.md constant)
>
> **Recovery instructions**: If a future maintainer needs full Phase 1.X-3.2 ship narrative detail (per-phase acceptance bar break-down, per-phase progress.md/VERIFICATION.md file lists, per-phase deferred items disposition table, per-phase commit hashes), retrieve from git history via:
> ```bash
> git show f8033e2:.planning/STATE.md  # full 723L pre-archive baseline (Phase 3.4 discuss-phase ship f8033e2)
> ```
> Or read per-phase canonical sources directly: `.planning/phase-{N}/{progress,VERIFICATION,deferred-items}.md` + `docs/adr/{NNNN}-*.md` (ADR 0001-0016 main body 永久守恒 A7 — never archive these).

*Phase 3.4 W0.1 STRATEGIC archive complete — 2026-05-17 first ship-time T6.N cadence implementation. D2 standing process: Plan 03 W2 T2.3 includes archive sub-step Phase 3.4+ onward. Next § ARCHIVED FROM STATE — Phase 3.1+3.2 will be created by Plan 03 W2 T2.2 ship-time (sister Phase 3.4 W0.1 D2 cadence second implementation).*
