# Phase 3.4 Deferred Items

## Phase 3.4 ship sister review absorb (2026-05-17, post-ship + post-CI-hotfix)

Sister review identified 1 H-tier + 3 M-tier + 5 T-tier observations on Phase 3.4 ship state (post-554b82b CI hotfix). Tiered absorb per established cadence (Phase 2.4 + 3.3 sister pattern延袭 — H inline / M+T → next phase W0).

### H-tier inline absorbed (this commit cycle)

- **H1 v0.3.0 tag push origin verify**: ✅ FIXED 2026-05-17 (verify: `git ls-remote origin refs/tags/v0.3.0 refs/tags/adr-0017-accepted refs/tags/v0.3.0-alpha.4-routing` returned 3 SHAs confirming push; inline absorb 8 stale "LOCAL pending push" sites across 5 docs: README.md L65+L66 / STATE.md L25+L61+L132 / ROADMAP.md L174 / milestones/v0.3.0-ROADMAP.md L74 / milestones/v0.3.0-MILESTONE-AUDIT.md L136 → "pushed to origin 2026-05-17 (CI run 25992781663 3-OS green post-hotfix 554b82b)"). Root cause of narrative-vs-state mismatch: T2.12 commit was made by executor BEFORE user PP approval, so commit-time narrative correctly said "LOCAL pending"; push happened immediately AFTER per user choice — narrative not auto-updated by subsequent push. **Anti-pattern note**: future ship-time T6.N cadence should include "post-push narrative sync" sub-step OR avoid baking transient state ("LOCAL pending") into committed docs (only commit msgs).

### v0.4.0 W0 prereq backlog (sister Phase 3.3 → Phase 3.4 W0 一次根治 cadence延袭)

> Per sister review T1 candidate list — 5 items carry-forward to v0.4.0 W0 first task batch. 沿袭 5 phase 连续 "deferred → next phase W0 一次根治" cadence (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → v0.4.0 = 7th phase).

| # | Source | Item | Priority |
|---|--------|------|----------|
| W0.1 | sister H1 verify | ✅ DONE this absorb (v0.3.0 tag push origin verified + 8 stale "LOCAL pending" sites fixed) | RESOLVED |
| W0.2 | DEFERRED #AF | D3 gate `scripts/check-state-archive-stale.mjs` ENFORCE flip (warn-only round 1 → ENFORCE=true) — sister Phase 2.1 transparency gate "warn → enforce" cadence延袭 | HIGH |
| W0.3 | sister M2 | D2 cadence iter 2 verify — Phase 4.1 W2 T2.N MUST include "trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE" sub-step (verify D2 standing process really fires beyond first-implementation) | HIGH |
| W0.4 | DEFERRED #AE + #AH | path traversal regex hardening if real attack surface surfaces (currently sole consumer is project maintainer; spike outcome 2026-05-17 deferred to Phase 4.0 W0; re-spike trigger = external user input arrival) | LOW (conditional) |
| W0.5 | DEFERRED #AG | D1 STATE.md ≤150L round 2 tighten — current 148L 极度接近 D3 SIZE_LIMIT 150L threshold post-W0.3 trim (sister review M1 noted); v0.4.0+ tighten D3 SIZE_LIMIT round 2 (≤150 → ≤120 or freeze at 150) | MED (conditional on W0.3 outcome) |

### M-tier carry-forward (advisory / 长期一致性)

- **M1 D1 round 2 target ≤150L 即将再次触发** (#AG carry-forward): 当前 STATE.md = 148L 极度接近 D1 round 2 target ≤150L; v0.4.0 启动 + Phase 4.1 ship 后 STATE narrative 增加会超 150L. **Mitigation**: D2 cadence (W0.3) 会自动 trim — verify next phase ship cadence really fires.
- **M2 D2 cadence 1st implementation 后是否 institutionalized 待 verify**: D2 ship-time T6.N cadence 只 first-implementation 在 Phase 3.4 W2 T2.2 (Phase 3.1+3.2 narrative archived). Phase 4.1 是第 2 次 cadence test — 验证模式真稳定还是 first-time effort. **Action**: v0.4.0 W0 task_plan 显式列 "T6.N D2 cadence iter 2 — trim Phase 3.3+3.4 narrative to RETROSPECTIVE" sub-step.
- **M3 D3 gate 仍 warn-only** (#AF carry-forward): `check-state-archive-stale.mjs` 当前 warn-only round 1. **Action**: v0.4.0 W0 flip ENFORCE = true (沿袭 transparency gate "warn → enforce" cadence).

### T-tier advisory (v0.4.0 启动前可关注)

- **T1 v0.4.0 W0 backlog 候选清单**: 5 项已 institutionalize (上 W0.1-W0.5 表 + 本节 M1-M3 referenced)
- **T2 v0.4.0 ROADMAP scope frozen verify**: ROADMAP L185 v0.4.0 scope = 2-3 周 / 3 phase (Phase 4.1 benchmark + Phase 4.2 co-maintainer + Phase 4.3 路由审计日志 + ADR 全集 + v1.0-RC 收尾). v1.0 必达 6 项: benchmark 公开 / stale-bot / ADR 全集 / 路由审计日志 / Sponsors / co-maintainer 招募.
- **T3 v0.4.0 节奏判断**: Phase 3.x 节奏 = 1 phase/day → v0.4.0 推测 3-5 天 ship. 但 v0.4.0 特殊: co-maintainer 招募 + benchmark 公开 = **外部依赖**, 不像 v0.3.0 全内部可控. **Action**: v0.4.0 discuss-phase 时 explicit 评估"外部依赖项时间不可控"风险, 可能需调整节奏期望.
- **T4 CI latent ordering bug 复查**: CI hotfix 554b82b 揭示 "build BEFORE test ordering" latent bug 跨 P3.3/P3.4 才 surface. **Action**: v0.4.0 W0 spike 30 min 查 ci.yml step 是否还有其他类似 ordering 隐患 (e.g., `pnpm validate:schema` 依赖 `pnpm build:schema` 是否正确 sequenced).
- **T5 paranoid review 自身节奏**: 6 phase 连续 backlog 100% absorb 模式持续 (Phase 2.4 → 3.1+3.2 → 3.3 → 3.4 → 本次 v0.4.0). sister cadence value loop 100% institutionalized — paranoid review 已成为项目 quality engine.

---

## v0.3.0 milestone 后置 carry-forward (Phase 3.4 own carry, cross-milestone)

- **DEFERRED #AF** (Phase 3.4 own carry, sister cadence inherited from Phase 2.1 transparency gate pattern): D3 gate `check-state-archive-stale.mjs` ENFORCE flip → v0.4.0 W0 first task (HIGH priority per sister M3)
- **DEFERRED #AG** (Phase 3.4 own carry): D1 STATE.md ≤150L round 2 tighten — round 1 target ≤200L achieved (148L); v0.4.0+ tighten via W0.3 + W0.5 conditional (MED priority)
- **DEFERRED #AH** (Phase 3.4 own carry): W0.4 path traversal regex hardening → Phase 4.0 W0 (LOW priority, conditional on real attack surface arrival; currently sole consumer = project maintainer per spike outcome)
- **DEFERRED #AC** ✅ RESOLVED W0 (Phase 3.4 W0.3 — versions/0.3.0-known-good.yaml 8 real e2e-verified pinned upstream entries fill)
- **DEFERRED #AD** ✅ RESOLVED W0 (Phase 3.4 W0.2 — install.ts pkg.version Path A ES2022 import attributes 1-line surgical)
- **DEFERRED #AE** ✅ partially RESOLVED W0 (Phase 3.4 W0.4 path traversal spike outcome — defense-in-depth fixture + 56L rationale doc + DEFER to Phase 4.0; #AH inherited for explicit regex hardening if needed)

---

*Phase 3.4 ship sister review absorb cadence: 1 H + 3 M + 5 T = 9 observations, 100% absorbed (1 H inline this commit + 8 M/T carried forward to v0.4.0 W0 institutionalize backlog). sister review value loop 6 phase 连续 100% absorb pattern 沿袭 (Phase 2.4 → 3.1+3.2 → 3.3 → 3.4 → next: v0.4.0 W0 absorb).*
