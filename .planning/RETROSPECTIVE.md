# harnessed RETROSPECTIVE

> Milestone-level retrospective —— phase-by-phase 经验沉淀；不重复 STATE.md 项目记忆，专注 What Worked / What Was Inefficient / Patterns Established / Key Lessons / Cost patterns。

---

## Deferred items review (Phase 2.3 W0 T0.8 cadence — 起每 ship phase 触发)

> 每 ship phase 时强制运行 `node scripts/check-deferred-items.mjs` + 人工 cat 各 `.planning/phase-*/deferred-items.md` + grep DEFERRED entry 是否触发条件已满足 (e.g. T4.4 Task Session conditional pass → 触发 v0.3.0 实施)。
> 沿袭 D-OOS-1 `.omc/` 2026-05-13 → 2026-05-15 三 phase 未 review process bug 根因修正。

**Review history**:
- Phase 2.3 W0 (2026-05-16 — 本 phase 启动 W0): T1.1 dual-signal real-API (等 ANTHROPIC_API_KEY env, v0.3.0 prep) / T4.4 Task Session (SC4 PARTIAL → v0.3.0 stable bridge/assistant API) / EE-4 plan 4 维量化阈值 (Phase 2.4 doctor) — PENDING (无 trigger 满足)
- Phase 2.3 ship (TBD): 同步触发条件复查 + 本表更新

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
