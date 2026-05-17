# Phase 3.3 Deferred Items

## Phase 3.3 ship sister review absorb (2026-05-17, post-ship)

Sister review identified 2 H-tier + 2 M-tier + 4 T-tier observations + 1 meta-observation ("每次 sister review 暴漏问题越来越多"). Tiered absorb per established cadence + user STRATEGIC option lock (4 decisions + paranoid naming).

### H-tier inline absorbed (this commit cycle)

- **H1 STATE.md L11 `当前关注` stale (6-phase old, 当前关注 v0.2.0 + 下一 Phase 2.2)**: ✅ FIXED 2026-05-17 (inline patch — replace with v0.3.0 milestone 3/4 PROGRESS + Phase 3.4 next + DEFERRED #AC/#AD/#AE list; delete L12-L13 W-1 errata + sister review M1 historical notes 6-phase old per sister review "已经过去 6 phase")
- **H2 STATE.md L31 `Phase 2.4 关键决议 ship 总结` 占 SSOT prime real estate**: ✅ FIXED 2026-05-17 (move 9-item content → RETROSPECTIVE.md Phase 2.4 milestone retrospective § "Key Decisions Shipped" subsection 318L 之前 insert; STATE.md L31 replaced with HTML comment archive marker referencing RETROSPECTIVE archive source)

### Phase 3.4 W0 STRATEGIC task lock (user-chosen Option 2; 4 D-decisions + paranoid 命名)

**Task name (paranoid 命名 per user — architectural framing not cleanup)**: **"STATE.md role + archive cadence institutionalize"**

NOT "STATE.md cleanup" — cleanup 暗示一次性, institutionalize 才是 architectural 级 (sister D-04 COLLAPSE 命名 architectural 思路延袭).

**4 D-decisions (user-locked)**:

- **D1 STATE role = single-SoT** (删 view-of-three 复杂度, dashboard.mjs render 单源更顺)
  - Rationale: STATE.md 不再 view of 3 SoT (CONTEXT + ROADMAP + RETRO), 仅 single SoT — 当前位置 + 当前关注 + 里程碑表 + 已完成 phase 历史 (last shipped phase narrative only, prev 全 archive 到 RETRO)
- **D2 archive cadence 进 ship T6.N step** (每 phase ship 自动 trim prev-prev-phase narrative → RETROSPECTIVE)
  - Rationale: archive 纪律 institutionalize 进 ship process — Phase N ship 时, Phase N-2 narrative 从 STATE.md "已完成" 节 trim 到 RETRO (prev phase 仍 in STATE 作 carry-forward 引用; prev-prev 始 archive)
- **D3 `scripts/check-state-archive-stale.mjs` 3 rules** (≤150 行 / 关键决议总结 ≤1 节 / W-N errata 禁字面)
  - Rule 1: STATE.md 总行数 ≤150 (强制 archive 纪律 — sister Karpathy hard limit pattern延袭)
  - Rule 2: "关键决议 ship 总结" section 全文 ≤1 occurrence (防 H2 复发 — 每 phase 各自 ship 总结进 phase 目录 + RETRO, 不在 STATE.md)
  - Rule 3: "W-N errata" / "sister review M[1-9] 修正" 字面禁 (防 H1 类 historical commentary pollution; archived correction notes 在 RETRO)
  - sister cadence: warn-only round 1 → flip ENFORCE Phase 3.5 (sister Phase 2.1 transparency gate "warn-only round 1 → 下 phase flip" pattern延袭)
- **D4 W0 顺序 = H1+H2 inline (15min DONE 此 commit) → NEW STATE 重定义 task (30min Phase 3.4 W0) → 主线 scope → DEFERRED 兑现**

**Estimate**: Phase 3.4 +30 min 不影响 v0.3.0 close 同日 (1 phase/day cadence 沿袭)

**Sister meta-observation acknowledged**: "现在每次暴漏问题越来越多" — root cause analysis (orchestrator pre-discussion):
1. STATE.md role drift (everything 档案, 8 phase 累积 0 删) — D1+D2+D3 root-cause fix
2. v0.3.0 cadence × project complexity 复合 (1 phase/day × 12 artifacts × cross-milestone carry) — D2 archive cadence 减 stack depth
3. executor SCOPE BOUNDARY 副作用 (executor 不 GC stale) — D3 gate make GC visible to executor
4. 5-recurrence terminus 实际效果 vs sister 期望 (W0.1 删 frontmatter 但 STATE 内仍 5+ stale 段落) — sister 不再扩 gate (Karpathy 极简) + D2/D3 archive 纪律 institutionalize 兜底

### M-tier deferred to Phase 3.4 W0

- **M1 DEFERRED #AC + #AD + #AE 三项 Phase 3.4 兑现**: 
  - #AC aliases.yaml dogfood entries (first actual deprecation entries) — Phase 3.4 dogfood scope (R7.6 acceptance "real upstream lock" 完整)
  - #AD install.ts package.json version read (current hardcoded `'0.3.0'` TODO) — Phase 3.4 W0 1-line surgical fix
  - #AE path traversal regex (若 surface real attack vector) — Phase 3.4 W0 spike 30min OR defer Phase 4.0
- **M2 Phase 3.1/3.2/3.3 各 phase ship 总结 — STATE.md 不加** (D1 single-SoT 决断后, 历史 phase ship 总结仅 in 各 phase 目录 + RETRO; STATE.md 仅 last shipped phase 当前位置 + 引用)

### T-tier (Phase 3.4 W0 planning consideration)

- **T1 H1+H2 surgical fix**: ✅ DONE inline this absorb commit (15min)
- **T2 STATE.md role redefine + archive cadence institutionalize**: → Phase 3.4 W0 first task (30min per user STRATEGIC lock)
- **T3 Phase 3.4 prereq link verify**: 30 sample sourcing 路径 + token 算法 baseline — discuss-phase 启动 verify
- **T4 v0.3.0 milestone close prep 早识别**: 1 phase/day 节奏 Phase 3.4 可能 1-2 天内 ship → v0.3.0 4/4 close (archive + audit + milestone tag triple push sister v0.2.0 close 模式)

### Sister cadence pattern stable

5-phase 连续 "deferred-items → next phase W0 一次根治" pattern 延袭 (Phase 2.3 / 2.4 / 3.1 / 3.2 / 3.3 → Phase 3.4 = 6th phase 沿袭). paranoid review value loop institutionalized.
