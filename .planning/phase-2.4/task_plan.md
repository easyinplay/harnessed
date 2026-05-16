# Phase 2.4 — task_plan.md

> **Authored**: 2026-05-16
> **Author**: gsd-planner (Wave B)
> **Sources**: KICKOFF § 2 Wave 拓扑 + ASSUMPTIONS § A bar mapping + ASSUMPTIONS § B 43 lock + PATTERNS § 2 code excerpts + RESEARCH D2.4-1~D2.4-20 + § 1-4 implementation sketches + O1~O7 open question handoff
> **Style**: 沿袭 phase 1.5 / 2.1 / 2.2 / 2.3 task_plan.md atomic sub-task structure (file path / action concrete values / read_first / acceptance_criteria grep-verifiable / decision source)
> **Task count**: 29 atomic tasks across 7 Waves (W0:6 / W1:3 / W2:5 / W3:4 / W4:3 / W5:3 / W6:5)
> **Hard limit verify**: every code-producing task 含 `wc -l` 或 ≤N 行 acceptance criterion

> ⚠️ **Placeholder sed-replace discipline (Phase 2.1 W1 + Phase 2.3 T0.1 plan-check fix sister precedent)**: T0.1 resolve `0013` (predicted `0013` but **绝不预占**) 后,**在 commit 任何 T0.2+ 产物前**,必须对本 task_plan.md + PLAN.md + KICKOFF.md + ASSUMPTIONS.md + 所有 NEW ADR 文件批量 sed-replace 字面占位:`grep -rl "0013\|0013\|0013" .planning/phase-2.4/ docs/adr/ | xargs sed -i "s/0013/<actual-NNNN>/g; s/0013/<actual-NNNN>/g"`(以及任何 grep 命中的其他文件)。**zero 字面 `<实占` 残留**是 W0 commit 前置条件 (`grep -rn "<实占" .planning/phase-2.4/ docs/adr/` 必须 exit 1)。同时禁写 `ADR 0013` 字面 (intel § 0 + CONTRIBUTING.md 项目级 SSOT 引用纪律 + D2.4-20)。

---

## Resolved Blocks (executor fill in-place, sister Phase 2.3 task_plan precedent)

> ⚠️ **W4 plan-check fix** — task_plan 顶部 Resolved 区设 skeleton (4 spike/decision block); executor in-place fill 后 commit; grep-verifiable 锚点 supplied for downstream task acceptance.

> **Resolved (T0.1)**: 实占 N = **0013** (ls docs/adr/ tail-1 = `0012-extension-mvp-karpathy-inject.md`, max+1 = `0013`); ROADMAP latest-shipped token = "Phase 2.3 shipped" (verify pass, STATE freshness consistent); sed-replace batch executed on 4 files (.planning/phase-2.4/{ASSUMPTIONS,PLAN-CHECK,PLAN,task_plan}.md); `grep -rnE "<实占N>|<实占NNNN>" .planning/phase-2.4/` exit 1 ✅ (zero literal placeholder residue; 3 narrative backtick-quoted `<实占` self-references in task_plan.md L10/L38 + PLAN-CHECK.md L92 are sed-replace discipline historical text, sister ADR 0012 L102 pattern); ADR 0012 main body untouched (A7 守恒)。执行日期 2026-05-16 Wave 0。

> **Resolved (T2.0, 2026-05-16)**: EE-4 baseline spike outcome (sister Phase 2.3 T0.10 always_active spike pattern; 4 维 omo Metis+Momus 原型 per intel L74-82):
>   - **phase-2.3/task_plan.md**: file_refs=25/28=0.893, source_refs=1/1=1.000 (+91 anchor refs), concrete_acceptance=127/134=0.948, weasel=0, **WARNING (3/4)** under DEFAULT (1.0/0.8/0.9/0)
>   - **phase-2.2/task_plan.md**: file_refs=30/36=0.833, source_refs=N/A md_refs=0 (+84 anchor refs only) → 1.000, concrete_acceptance=129/140=0.921, weasel=0, **WARNING (3/4)** under DEFAULT
>   - **阈值校准决策**: **RELAX** intel defaults — `file_references_verified` 1.0 → **0.80** (NEW-file 容忍：plan 写就时 NEW file 路径尚未创建，executor 后续 create — 6/36 Phase 2.2 missing = 16% NEW-file ratio, sister Phase 2.3 3/28 = 11%, 容忍 0.80 = 20% NEW headroom); `concrete_acceptance` 0.9 → **0.80** (heuristic regex 覆盖盲点：实际 plan 用 `!grep` / `命中` / `不存在` / `0 增量` 等模式 — regex 不可能 enumerate all signals,降 0.80 留 false-negative 余地)；keep `reference_sources_real` **0.8** + `business_logic_assumptions` **0** (anchor refs + weasel detection 已稳)
>   - **T2.1 plan-review-schema.yaml 阈值 ship 数值**: `file_references_verified: 0.80` / `reference_sources_real: 0.80` / `concrete_acceptance: 0.80` / `business_logic_assumptions: 0`
>   - **Validation**: 校准后 phase-2.3 = 4/4 PASS, phase-2.2 = 3/4 WARNING(fr=0.833 仍紧贴 0.80 阈值)；rationale 健康 shipped plan 至少 WARNING，PASS 留给 zero-NEW edge case (T2.0 spike confirm RELAX 不退化为永远 PASS rubber-stamp)
>   - **W3 fix Walker multi-line aware**: acceptance_criteria 块跨 5-10 行 (header + indented sub-bullets) — walker 用 `m` flag + 子 bullet 级 quant 检测, sister Phase 2.3 T-W3 cross-line 修法

> **Resolved (T3.4, 2026-05-16)**: `wc -l scripts/dashboard.mjs` = **610** (post T3.1+T3.2+T3.3 ship); 610 ≤ 650L T3.4 split trigger → **SKIP** (PARTIAL split fallback NOT triggered;保持单文件 per B-26 default decision + 沿袭 Phase 2.3 W3 reactive-vs-proactive split discipline — 不到必要不抽)。措施 baseline: T3.2 +35L (SSE+B-27 bind) + T3.3 +70L (multi-project nav + harnessed-projects.json) = +105L from 505L baseline,under 650L 软限 ~40L 余量,under 700L B-26 hard cap ~90L 余量。Next plan (v0.3.0+) 若 dashboard 继续扩张越 650L,触发 SHELL HTML (~250L) 抽到 `scripts/dashboard/shell.mjs` per D-WP-1 (c) splitting playbook。

> **Resolved (T6.4)**: <PENDING — Wave 6 T6.4 fill: `git tag --list v0.2.0` pre-flight outcome (proceed create vs S3 fallback decision tree)>

---

## Wave 0 — STATE.md 5 项 prereq backlog 一次根治 + ADR draft

### T0.1 — ADR 编号实占 + ROADMAP latest-shipped token + sed-replace placeholder discipline

- **files_modified**: (read-only;后续 task 批量 sed-replace)
- **action**:
  1. 跑 `ls -1 docs/adr/ | grep -E '^[0-9]{4}-.*\.md$' | sort | tail -1` 读最新 ADR 编号,取 `NNNN`(预期 `0012` 来自 Phase 2.3 ship)
  2. `0013` := `printf '%04d' $((10#NNNN + 1))`(zero-padded 4 digit,预期 `0013` 但**绝不预占**,以实际 ls 结果为准)
  3. 跑 `head -100 .planning/ROADMAP.md | grep -E '^##\s+(v[0-9.]+|Phase\s+[0-9.]+)'` 读 latest header pattern → 验 STATE freshness token 仍 valid("Phase 2.3 shipped")
  4. 把实占 N + ROADMAP latest token 决议**记录到本 task_plan.md 顶部 Resolved block**(供后续 task 引用)
  5. **批量 sed-replace** `0013` / `0013` 字面占位 — `grep -rl "<实占" .planning/phase-2.4/ docs/adr/ | xargs sed -i "s/0013/<actual-NNNN>/g; s/0013/<actual-NNNN>/g"`(zero 字面残留)
- **read_first**:
  - `ls docs/adr/`(by Bash)
  - `head -100 .planning/ROADMAP.md`(by Read)
  - ASSUMPTIONS B-36(SSOT 引用纪律)
- **acceptance_criteria**:
  - `ls docs/adr/<actual-NNNN>-*.md 2>&1` 此时**不存在**(T0.2 才创建)
  - 本 task_plan.md 顶部新增 `> **Resolved (T0.1)**: 0013 = <actual-NNNN>` block(grep-verifiable)
  - `grep -rnE "0013|0013|0013" .planning/phase-2.4/ docs/adr/ 2>&1` exit 1(zero 字面残留)
  - **禁写 `ADR 0013` 字面 verify**: `grep -rn "ADR 0013\|0013" .planning/phase-2.4/ docs/adr/<actual-NNNN>-*.md 2>&1` 仅命中 actual-NNNN (若 actual = 0013 命中;否则 exit 1)
- **decision_source**: B-36 + KICKOFF § 3 Hard Constraint #2 + intel § 0 SSOT 引用纪律

### T0.2 — ADR 0013 draft (9 章节 sketch only, Wave 6 详细 fill)

- **files_modified**: `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md`(NEW)
- **action**: 创建 ADR file 含 9 章节 sketch(详细 Wave 6 T6.1 fill):
  ```markdown
  # ADR 0013: Phase 2.4 — doctor MIN + EE-4 plan-checker + dashboard C 路径 + Win sentinel

  Status: Draft (phase 2.4 W0 draft → W6 accepted)
  Date: 2026-05-16

  ## Context
  Phase 2.4 把 v0.2.0 收尾末 phase 装配为 doctor 健康检查完整版 ship + EE-4 plan-checker 4 维量化阈值 ABSORB + dashboard C 路径 3 子功能 FULL absorb + README CI counter gate B 路径 + ralph-loop Windows native 兼容验收 sentinel + audit 完整版扩。5 大主题 sister cluster 一次 ship,作为 v0.2.0 milestone 4/4 close。

  ## Decisions
  ### 1. doctor 5 check MIN scope (B-01 ~ B-07 / D-01) — 152→~210L 容忍超 5%
  ### 2. EE-4 plan-review-schema.yaml 4 维 SSOT (B-08 ~ B-15 / D-02) — yaml-only + walker + project-local agent override
  ### 3. EE-4 BLOCKER auto-rerun DOWN-SCOPE (B-12 / O1) — CI fail + manual rerun (NOT auto-spawn,v0.3.0 feature)
  ### 4. dashboard C 路径 3 子功能 FULL absorb (B-18 ~ B-22 / D-04) — Wave 3 3 sub-task 并行 + cc-hook-add 第 7 method
  ### 5. SSE 替 WebSocket rationale (B-23 / D2.4-9) — zero-dep + 单向 push + EventSource native auto-reconnect
  ### 6. cc-hook 3 处 schema enum 加 (B-22) — InstallType + TypeEnum + install.method (R2 critical finding 修正 KICKOFF wording)
  ### 7. README CI counter gate B 路径 (B-16 + B-17 / D-03) — 三计数一致 grep -cE + Wave 0 pre-flight calibration
  ### 8. audit 完整版扩 (B-28 + B-29) — 扩 audit.ts NOT NEW (R2 critical finding) + helper split + Win sentinel 5 fixture MIN
  ### 9. Wave 0 backlog 5 项一次根治 (B-32 + B-33) — schemaVersion long-tail land scripts/check-provenance.mjs as 1 consumer + RETRO/STATE/deferred cadence 强化

  ## A7 Conservation
  ADR 0001-0012 main body untouched; baseline tag 1-12 → 1-0013; ci.yml A7 iter 1-12 → 1-0013;
  docs/AGENT-DEFINITION-FACTORY-CONTRACT.md + docs/INSTALLER-CONTRACT.md main body 不动。

  ## References
  - .planning/phase-2.4/{KICKOFF,2.4-CONTEXT,PATTERNS,RESEARCH,ASSUMPTIONS,PLAN,task_plan}.md
  - .planning/intel/omc-comparison.md L74-82 (EE-4 4 维原型) + L286 (EE-4 PENDING)
  - .planning/intel/dashboard-handoff-2026-05-16.md § 3 (C 路径)
  - .planning/ROADMAP.md L113-115 (Phase 2.4 必含项 + 验收)
  ```
- **read_first**:
  - `docs/adr/0012-*.md`(by Read,作 Phase 2.3 errata fence pattern 参考)
  - `.planning/phase-2.4/ASSUMPTIONS.md` § B(by Read,锁列表)
- **acceptance_criteria**:
  - `ls docs/adr/<actual-NNNN>-*.md` 命中 1 file
  - `grep -E "^### [1-9]\. " docs/adr/<actual-NNNN>-*.md | wc -l` == 9
  - `grep "Status: Draft" docs/adr/<actual-NNNN>-*.md` 命中
- **decision_source**: B-35 + B-36 + KICKOFF § 3 Hard Constraint #2

### T0.3 — README CI counter gate B 路径 ship (B-16 + B-17 + D-03)

- **files_modified**: `.github/workflows/ci.yml`(MODIFY +~15L step) + `README.md`(MODIFY only if pre-flight 校准发现 drift, fix 三计数一致)
- **action**:
  1. **Pre-flight regex calibration + FIX** (local, push 前 — **B1 plan-check fix: regex 精度提升 + 实测 SHIPPED=4/BARS=3/L44=3 三者不一致 mandate FIX**) — 跑精度版 grep (line-start + bold + Phase 2.X 限定排除 Phase 1.X 历史 + 排除 L44 enumeration line 命中):
     ```bash
     # 精度版 — line-start `- ` + bold `**` + Phase 2.[1-9] (限当前 v0.2.0 cycle, 排除 1.X 历史)
     SHIPPED=$(grep -cE "^- \*\*Phase 2\.[1-9] shipped\*\* ✅" README.md)
     BARS=$(grep -cE "^- \*\*Acceptance bar [A-Z]1-[A-Z]8 8/8 \(Phase 2\.[1-9]\)\*\* ✅" README.md)
     # L44 = "Phase 2.1+2.2+2.3/2.4 = N/4 完成" 行内 numerator (head -1 防多命中)
     L44=$(grep -oE "Phase 2\.1\+2\.2(\+2\.3)?(\+2\.4)?/2\.4 = ([0-9])/4 完成" README.md | grep -oE "[0-9]/4" | head -1 | cut -d/ -f1)
     echo "shipped=$SHIPPED bars=$BARS L44=$L44"
     ```
     **MANDATORY FIX (B1 plan-check fix path a)** — 实测当前 Phase 2.3 ship 后状态 SHIPPED=4 (Phase 2.1+2.2+2.3+1.5) / BARS=3 (Phase 2.1+2.2+2.3) / L44=3。 精度 regex 后三者应 align (SHIPPED=BARS=L44=3 since Phase 1.5 ship marker 不命中 Phase 2.[1-9] 限定);如仍不一致 → executor 必先 FIX README L44 行 (校到 4 marker SHIPPED) OR 加 Phase 2.4 SHIPPED entry (T6.3 提前 land hint) OR 改 README enumeration token 准确化,**再** ship CI gate。 sister Phase 2.3 PLAN-CHECK B1 类似 pre-flight 模式 (counter drift surface 前置修)。
  2. `.github/workflows/ci.yml` 在 transparency / provenance step 后加 `README counter integrity gate` step ~15L yaml(沿袭 Phase 2.2 T0.4 freshness gate pattern + Phase 2.3 W0 T0.5 schemaVersion grep gate sister):
     ```yaml
     - name: README counter integrity gate (Phase 2.4 Wave 0 D-03 B 路径 — B1 plan-check fix regex 精度)
       run: |
         # B1 plan-check fix — line-start + bold + Phase 2.[1-9] 精度排除 Phase 1.X 历史 + L44 enumeration
         SHIPPED=$(grep -cE "^- \*\*Phase 2\.[1-9] shipped\*\* ✅" README.md)
         BARS=$(grep -cE "^- \*\*Acceptance bar [A-Z]1-[A-Z]8 8/8 \(Phase 2\.[1-9]\)\*\* ✅" README.md)
         L44=$(grep -oE "Phase 2\.1\+2\.2(\+2\.3)?(\+2\.4)?/2\.4 = ([0-9])/4 完成" README.md | grep -oE "[0-9]/4" | head -1 | cut -d/ -f1)
         if [ "$SHIPPED" != "$BARS" ] || [ "$SHIPPED" != "$L44" ]; then
           echo "::error::README counter drift: shipped=$SHIPPED bars=$BARS L44=$L44"
           exit 1
         fi
         echo "README counter integrity ✅ shipped=$SHIPPED bars=$BARS L44=$L44"
     ```
- **read_first**:
  - `README.md`(by Read,行号 44 + 全 enumeration 区段)
  - `.github/workflows/ci.yml`(by Read,Phase 2.2 T0.4 freshness gate L86-87 + Phase 2.3 T0.5 schemaVersion grep gate L132-138 — sister 模板)
  - PATTERNS § 2.10 + RESEARCH § 4.3 + CONTEXT D-03 hint L65-75
- **acceptance_criteria**:
  - `grep -E "README counter integrity gate" .github/workflows/ci.yml | wc -l` == 1
  - **B1 plan-check fix — 精度 regex 三计数 pre-flight verify**: `bash -c 'SHIPPED=$(grep -cE "^- \*\*Phase 2\.[1-9] shipped\*\* ✅" README.md); BARS=$(grep -cE "^- \*\*Acceptance bar [A-Z]1-[A-Z]8 8/8 \(Phase 2\.[1-9]\)\*\* ✅" README.md); L44=$(grep -oE "Phase 2\.1\+2\.2(\+2\.3)?(\+2\.4)?/2\.4 = ([0-9])/4 完成" README.md | grep -oE "[0-9]/4" | head -1 | cut -d/ -f1); [ "$SHIPPED" = "$BARS" ] && [ "$SHIPPED" = "$L44" ]'` exit 0 (local pre-flight passes 后才 push — 防第一 push CI red; 若 fail executor must FIX README L44 enumeration OR 加 Phase 2.4 entry to align counters)
  - `wc -l .github/workflows/ci.yml` 增量 ~15L
- **decision_source**: B-16 + B-17 + CONTEXT D-03 + RESEARCH § 4.3 + R10

### T0.4 — M2 schemaVersion 7 surface land 1 consumer (B-33)

- **files_modified**: `scripts/check-provenance.mjs`(MODIFY +1 行 consumer call site)
- **action**:
  1. 读 `src/types/schemaVersion.ts` 实现确认 `branchOnSchemaVersion(version: number, branches: Record<number, () => T>)` 接口
  2. `scripts/check-provenance.mjs` 在 provenance JSON parse 后加 1 行 consumer call:
     ```js
     import { branchOnSchemaVersion } from '../src/types/schemaVersion.js'
     // ... existing provenance walker logic ...
     const handled = branchOnSchemaVersion(provenance.schemaVersion ?? 1, {
       1: () => verifyProvenanceV1(provenance),
       // v2 placeholder for future bump
     })
     ```
  3. Wave 0 grep gate ≥2 阈值若需 bump → Phase 2.4 ship 后 Phase 2.3 T0.5 grep ≥2 仍 honest baseline (这 1 加未达 bump threshold);ADR errata § 7 同步注记 schemaVersion adoption status
- **read_first**:
  - `src/types/schemaVersion.ts`(by Read,接口签名)
  - `scripts/check-provenance.mjs`(by Read,Phase 2.2 T4.0 ship 70L baseline)
  - ASSUMPTIONS B-33 (5 候选 friction 评估)
- **acceptance_criteria**:
  - `grep -E "branchOnSchemaVersion" scripts/check-provenance.mjs | wc -l` ≥ 1
  - `node scripts/check-provenance.mjs` 仍 exit 0 (Phase 2.2 ship 行为不破)
  - `wc -l scripts/check-provenance.mjs` 增量 ≤ 5 行
- **decision_source**: B-33 + RESEARCH § 0 prereq backlog + Phase 2.3 W0 T0.5 sister grep gate

### T0.5 — M1 RETRO + T3 v0.3.0 prep + deferred-items review 强化 + REQUIREMENTS R2.4.1~R2.4.7 expand verify (B2 plan-check fix) + W1 mkdir tests dirs (parallel 纯文档/script)

- **files_modified**: `.planning/RETROSPECTIVE.md`(MODIFY 加 dashboard polish round 1 历史 cluster 一句补) + `.planning/STATE.md`(MODIFY 加 v0.3.0 启动 prereq 节) + `scripts/check-deferred-items.mjs`(MODIFY 沿袭 Phase 2.3 T0.8 cadence 强化 — 加 Phase 2.4 phase dir 进 walker 路径) + `.planning/phase-2.4/deferred-items.md`(NEW empty stub or existing extension) + **`.planning/REQUIREMENTS.md`(MODIFY +R2.4.1~R2.4.7 expand per B2 plan-check fix, sister R6.1-R6.5 + R7.1-R7.6 expand 模式 — pre-applied in plan-check fix CC commit; T0.5 verifies in-place + grep gate)** + **`tests/installers/` + `tests/scripts/`(NEW directories per W1 plan-check fix — mkdir -p; required pre-Wave-2/Wave-3 NEW test ship)**
- **action**:
  1. `.planning/RETROSPECTIVE.md` 加 M1 entry — dashboard polish round 1 (commit 161621c) 历史 cluster note (一句 e.g. "Phase 2.3 ship 时 dashboard 0b4e76d NEW + 161621c polish round 1 = sister cluster,Phase 2.4 C 路径 absorb 是 round 2 完整 ship")
  2. `.planning/STATE.md` 加 `## v0.3.0 启动 prereq` 节 — T3 backlog (plan-feature workflow + checkpoint + 路由命中率验收 + gstack 前缀探测) + EE-4 BLOCKER auto-spawn rerun (Phase 2.4 down-scope 推 v0.3.0)
  3. `scripts/check-deferred-items.mjs` 沿袭 Phase 2.3 T0.8 模式,加 Phase 2.4 deferred 进 walker 路径 + ENFORCE 仍 warn-only round 1 (Phase 2.4 ship 时 ENFORCE 阶梯推 v0.3.0)
  4. **B2 plan-check fix — REQUIREMENTS R2.4.1~R2.4.7 expand verify** (沿袭 R6.1-R6.5 + R7.1-R7.6 expand 模式; 7 子 ID = R2.4.1 doctor 5 check / R2.4.2 EE-4 plan-checker schema / R2.4.3 README CI counter gate / R2.4.4 dashboard SessionStart hook / R2.4.5 dashboard SSE watcher / R2.4.6 dashboard 多项目 / R2.4.7 ralph-loop Win sentinel) — pre-applied in plan-check fix CC commit; verify in-place: `grep -cE "^### R2\.4\.[1-7]" .planning/REQUIREMENTS.md` == 7;若发现 stale 或缺,executor re-apply per .planning/phase-2.4/PLAN-CHECK.md B2 fix path (a)。
  5. **W1 plan-check fix — mkdir tests dirs** (pre-Wave-2/Wave-3 ship): `mkdir -p tests/installers tests/scripts` — Wave 3 T3.1 (`tests/installers/ccHookAdd.test.ts`) + T3.2 (`tests/scripts/dashboard-sse.test.ts`) + T3.3 (`tests/scripts/dashboard-multi-project.test.ts`) 必前置;否则 vitest NEW test file fail。
- **read_first**:
  - `.planning/RETROSPECTIVE.md`(by Read,Phase 2.3 milestone retrospective 模板)
  - `.planning/STATE.md` L601+(by Read,Phase 2.4 Prereq Notes 节)
  - `scripts/check-deferred-items.mjs`(by Read,Phase 2.3 T0.8 ~80L warn-only baseline)
- **acceptance_criteria**:
  - `grep -E "dashboard polish round 1" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
  - `grep -E "v0\.3\.0 启动 prereq" .planning/STATE.md | wc -l` ≥ 1
  - `grep -E "phase-2\.4" scripts/check-deferred-items.mjs | wc -l` ≥ 1
  - `node scripts/check-deferred-items.mjs` exit 0 (warn-only round 1)
  - **B2 plan-check fix verify**: `grep -cE "^### R2\.4\.[1-7]" .planning/REQUIREMENTS.md` == 7 (R2.4.1~R2.4.7 全 expand);PLAN frontmatter `requirements: [R2.4.1, ..., R2.4.7]` 与 REQUIREMENTS.md align (无 stale ref)
  - **W1 plan-check fix verify**: `[ -d tests/installers ] && [ -d tests/scripts ]` exit 0 (both dirs exist 前置 Wave 2/3 NEW test file ship)
- **decision_source**: B-32 + Phase 2.3 T0.8 sister precedent + STATE.md L601+ Phase 2.4 Prereq Notes + .planning/phase-2.4/PLAN-CHECK.md B2 + W1 plan-check fix path (a)

### T0.6 — 3-OS CI 跑通 gate verify (Wave 0 全 step 合规)

- **files_modified**: (read-only verify)
- **action**:
  1. 跑 `gh run list --workflow=ci.yml --limit=1 --json conclusion,headBranch` 验最近 push CI 全绿
  2. 验 README counter gate + transparency + provenance + perf-bench cron + 6 Phase 2.3 Wave 0 step + Phase 2.4 Wave 0 step (T0.3 README counter + T0.4 schemaVersion consumer) 全跑
  3. 若 fail → revert 上一 push → identify Wave 0 step 失败 → 修 → re-push
- **read_first**:
  - `.github/workflows/ci.yml`(by Read,全 step 名称 verify)
- **acceptance_criteria**:
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `"success"`
  - 3 OS matrix (ubuntu / macos / windows) 全 conclusion success (`gh run view <run-id> --json jobs -q '.jobs[].conclusion' | sort -u` == `"success"`)
- **decision_source**: B-32 + KICKOFF § 1.2 F1

---

## Wave 1 — doctor 5 check 完整版 (D-01 MIN)

### T1.1 — src/cli/lib/origin-check.ts NEW (sister-share helper, B-05 + B-28)

- **files_modified**: `src/cli/lib/origin-check.ts`(NEW ≤80L)
- **action**: 创建 helper sister-share (doctor #5 warn mode + audit hard-fail mode):
  ```ts
  // src/cli/lib/origin-check.ts (Karpathy hard limit ≤80L per B-38)
  // Sister-share helper — doctor #5 (warn mode for fork 合法用例) + audit 完整版 (hard-fail mode allowFork=false).
  // Source: RESEARCH § 1.2.5 + § 4.1.1 + D2.4-3
  import { spawnSync } from 'node:child_process'
  import { readFileSync } from 'node:fs'
  import { join } from 'node:path'

  export interface OriginCheckResult {
    status: 'pass' | 'warn' | 'fail'
    detail: string
    fix?: string
  }

  export interface OriginCheckOptions {
    allowFork?: boolean  // true = doctor (warn on drift), false = audit (fail on drift)
  }

  export function checkOrigin(cwd: string = process.cwd(), opts: OriginCheckOptions = {}): OriginCheckResult {
    const allowFork = opts.allowFork ?? true
    // 1. Read expected URL from package.json `repository.url` SSOT
    let expected: string | null = null
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
      expected = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? null
    } catch { /* package.json missing 是合法 case (npm 全局装) */ }
    if (!expected) {
      return { status: 'warn', detail: 'package.json has no repository.url field', fix: 'add `repository` field to package.json' }
    }
    // 2. Read actual git remote origin URL
    const r = spawnSync('git', ['config', '--get', 'remote.origin.url'], { cwd, encoding: 'utf8' })
    if (r.status !== 0) {
      return { status: 'warn', detail: 'no git remote origin (detached / non-clone)', fix: 'git remote add origin <expected-url>' }
    }
    const actual = r.stdout.trim()
    // 3. Normalize: strip trailing .git, normalize protocol prefix (https vs ssh)
    const norm = (s: string) => s.replace(/^(https?:\/\/|git@github\.com:)/, '').replace(/\.git$/, '').replace(':', '/')
    if (norm(actual) === norm(expected)) return { status: 'pass', detail: actual }
    // 4. Drift: warn for doctor (fork 合法), fail for audit (tamper detection)
    return {
      status: allowFork ? 'warn' : 'fail',
      detail: `origin '${actual}' ≠ expected '${expected}'`,
      fix: allowFork ? 'verify this is intentional fork; if not, `git remote set-url origin <expected>`' : 'origin URL drift — possible tamper, `git remote set-url origin <expected>` to restore',
    }
  }
  ```
- **read_first**:
  - `src/cli/doctor.ts` L99-127(by Read,Win bash flavor spawnSync probe pattern analog)
  - `src/cli/audit.ts` L42-50(by Read,REPO_URL_PATTERN regex 模板)
  - RESEARCH § 1.2.5 + § 4.1.1 + PATTERNS § 2.2
- **acceptance_criteria**:
  - `wc -l src/cli/lib/origin-check.ts` ≤ 80
  - `grep -E "export function checkOrigin" src/cli/lib/origin-check.ts | wc -l` == 1
  - `grep -E "allowFork" src/cli/lib/origin-check.ts | wc -l` ≥ 2 (interface + impl branch)
  - TypeScript compile pass (`corepack pnpm tsc --noEmit` or build target)
- **decision_source**: B-05 + B-28 + D2.4-3 + RESEARCH § 1.2.5

### T1.2 — src/cli/doctor.ts MODIFY +~55-65L (5th check + --json + status 三档 enum 升级)

- **files_modified**: `src/cli/doctor.ts`(MODIFY,152→~210L 容忍超 hard limit 5% per B-03)
- **action**:
  1. 升级 `CheckResult` interface L21-26: `{ name, ok: boolean, detail, fix? }` → `{ name, status: 'pass' | 'warn' | 'fail', message, fix? }`(rename `detail` → `message`,向后兼容 derive `ok = status === 'pass'`)
  2. 4 现 check (`checkNodeVersion` / `checkMcpScope` / `checkJq` / `checkWinBash`) 内部 return 升级 — 把现 `{ ok: true, detail: '...' }` 改 `{ status: 'pass', message: '...' }`,`{ ok: false, detail: '...' }` 改 `{ status: 'fail', message: '...' }`(语义 1:1 映射,无逻辑改)
  3. 加 5th `checkOriginUrl()` method ~10L wrapper(主体 in `src/cli/lib/origin-check.ts` per T1.1):
     ```ts
     async function checkOriginUrl(): Promise<CheckResult> {
       const { checkOrigin } = await import('./lib/origin-check.js')
       const r = checkOrigin(process.cwd(), { allowFork: true })  // doctor warn mode per B-05
       return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
     }
     ```
  4. **W3 plan-check fix — proactive split decision** (sister Phase 2.3 W4 arbitrateRedirect.ts proactive split precedent): planner 决 **(a) single-file 维持 per B-03 + D-WP-3 (a)** (≤215L 5% 超 hard limit 容忍, Karpathy "Don't split until pain") — doctor.ts ~210L acceptable; **若 wc -l > 215L** (post-ship 实测) → R1 fallback split `src/cli/doctor/checks.ts` (~80L 抽 5 check method) + `src/cli/doctor.ts` ~150L (orchestrator only)。 注: origin-check helper 抽 `src/cli/lib/origin-check.ts` is **sister-share rationale not split signal** (per B-03 + D2.4-3);proactive split decision = (a) per plan-phase lock (single-file ≤215L), reactive R1 trigger = split if wc > 215L 持续。
  5. `registerDoctor()` action() refactor(L129-152):加 `--json` flag option + results 累积 + 三档 exit policy(warn = 0, fail = 1 per B-06):
     ```ts
     .option('--json', 'output JSON instead of human-readable')
     .action(async (opts: { json?: boolean }) => {
       const results: CheckResult[] = [
         checkNodeVersion(),
         await checkMcpScope(),
         checkJq(),
         checkWinBash(),
         await checkOriginUrl(),
       ]
       const hasFail = results.some(r => r.status === 'fail')
       const hasWarn = results.some(r => r.status === 'warn')
       if (opts.json) {
         console.log(JSON.stringify({ checks: results, summary: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass' }, null, 2))
       } else {
         for (const r of results) {
           const mark = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
           console.log(`${mark} ${r.name} — ${r.message}`)
           if (r.status !== 'pass' && r.fix) console.log(`    fix: ${r.fix}`)
         }
         console.log(hasFail ? '\nsome checks failed' : hasWarn ? '\nall checks ok (with warnings)' : '\nall checks passed')
       }
       process.exit(hasFail ? 1 : 0)  // warn ≠ fail per B-06
     })
     ```
- **read_first**:
  - `src/cli/doctor.ts`(by Read,现 152L 全文 — 4 check production + registerDoctor L129-152)
  - PATTERNS § 2.1 + RESEARCH § 1.3
- **acceptance_criteria**:
  - `wc -l src/cli/doctor.ts` ≤ 215 (5% 超 hard limit 容忍 per B-03,>215L 触发 R1 split fallback)
  - `grep -E "checkOriginUrl" src/cli/doctor.ts | wc -l` ≥ 2 (declare + call)
  - `grep -E "'pass' \\| 'warn' \\| 'fail'" src/cli/doctor.ts | wc -l` ≥ 1 (CheckResult upgraded)
  - `grep -E "'--json'" src/cli/doctor.ts | wc -l` ≥ 1
  - `grep -E "process\\.exit\\(hasFail \\? 1 : 0\\)" src/cli/doctor.ts | wc -l` ≥ 1 (warn ≠ fail per B-06)
  - `node dist/cli.js doctor --json | jq '.summary'` 输出 `"pass"` or `"warn"` or `"fail"` (smoke)
- **decision_source**: B-02 + B-03 + B-04 + B-05 + B-06 + B-07 + RESEARCH § 1.1-1.3

### T1.3 — tests/cli/doctor.test.ts NEW ~80L (5 check unit + --json + exit code)

- **files_modified**: `tests/cli/doctor.test.ts`(NEW ~80L)
- **action**: vitest unit test 5 check + --json output + exit code policy:
  - cell 1: `checkNodeVersion()` returns `{status: 'pass'}` when `process.versions.node >= 22`
  - cell 2: `checkMcpScope()` returns `{status: 'fail'}` when neither `.mcp.json` nor `~/.claude.json` mcpServers (CC #54803 red flag)
  - cell 3: `checkJq()` mock `where`/`which` failure returns `{status: 'fail', fix: 'install jq'}`
  - cell 4: `checkWinBash()` mock WSL env returns `{status: 'fail', fix: 'use Git Bash...'}`
  - cell 5: `checkOriginUrl()` mock package.json + git remote 一致 returns `{status: 'pass'}`;不一致 returns `{status: 'warn'}` (fork 合法 per B-05)
  - cell 6: `--json` flag — spawn child + assert `JSON.parse(stdout)` has `{checks: [...], summary: 'pass'|'warn'|'fail'}`
  - cell 7: exit code — warn → exit 0 (advisory),fail → exit 1 (blocking) per B-06
- **read_first**:
  - `tests/cli/research.test.ts`(by Read,vitest unit test 模板 — Phase 2.3 sister)
  - `src/cli/doctor.ts`(by Read,T1.2 ship 后版本)
- **acceptance_criteria**:
  - `wc -l tests/cli/doctor.test.ts` ≤ 100 (~80L target,容忍小幅超)
  - `corepack pnpm test -- tests/cli/doctor.test.ts` 全 7 cell pass
  - `grep -E "summary.*pass\\|warn\\|fail" tests/cli/doctor.test.ts | wc -l` ≥ 1
- **decision_source**: B-04 + B-05 + B-06 + RESEARCH § 10 Wave 0 Gaps Wave 1

---

## Wave 2 — EE-4 plan-review-schema + run-plan-checker + project-local agent override (D-02 ABSORB)

### T2.0 — EE-4 阈值 baseline spike (B-15, 沿袭 Phase 2.3 T0.10 always_active spike pattern)

- **files_modified**: (read-only spike — 跑 + Resolved block 进 task_plan.md 顶部)
- **action**:
  1. **设计 spike algorithm pseudocode** (与 T2.2 run-plan-checker.mjs ship 解耦,纯 manual 跑):
     ```
     for plan_file in [.planning/phase-2.3/task_plan.md, .planning/phase-2.2/task_plan.md]:
       file_refs = grep "files_modified:\\|files_created:" → extract paths → fs.access ratio
       source_refs = grep "decision_source:\\|see:\\|ref:" → extract paths → fs.access ratio
       acceptance = grep "acceptance_criteria:" blocks → regex heuristic (含 "grep -c|wc -l|exit \\d+|≤\\d+L") ratio
       weasel = grep -ciE "assumed|presumably|should be|likely|probably|maybe" (- 白名单 "assumed (per D-NN)|assumed (locked)")
       score = sum([fr ≥ 1.0, sr ≥ 0.8, ac ≥ 0.9, w == 0])
       verdict = PASS if score == 4 else WARNING if score == 3 else BLOCKER
     ```
  1.5 **S4 plan-check fix — multi-plan path verify** (T2.0 spike 前置): `ls .planning/phase-2.{2,3}/task_plan.md 2>&1` — verify both paths exist (Phase 2.3 + Phase 2.2 task_plan.md);若 multi-plan-NN 模式 (e.g. task_plan-01.md / task_plan-02.md) — 选最完整 task_plan.md 1 个 baseline OR 全跑 average score (executor judgment based on file count)。 实测 Phase 2.2/2.3 are 单 task_plan.md 模式 expected。
  2. **跑 2 plan baseline** (Phase 2.3 + Phase 2.2 task_plan.md, per step 1.5 verify outcome)
  3. **记录 outcome 到本 task_plan.md 顶部 Resolved block** (沿袭 Phase 2.3 T0.10 always_active spike Resolved 模式):
     ```
     > **Resolved (T2.0, 2026-05-16)**: EE-4 baseline spike outcome:
     >   - phase-2.3/task_plan.md: file_refs=<X>/Y, source_refs=<X>/Y, acceptance=<X>/Y, weasel=<N>, verdict=<PASS|WARNING|BLOCKER>
     >   - phase-2.2/task_plan.md: file_refs=<X>/Y, ...
     >   - 阈值校准决策: <KEEP defaults (4/3/2 + 1.0/0.8/0.9/0) per intel 原型> OR <RELAX concrete_acceptance 0.9 → 0.8> OR <RELAX reference_sources_real 0.8 → 0.7>
     >   - T2.1 plan-review-schema.yaml 阈值 ship 数值 = <X>
     ```
  4. **若 ≥1 plan 落 BLOCKER** (score ≤2) → 阈值过严 → 候选放宽 `concrete_acceptance` 0.9 → 0.8 OR `business_logic_assumptions` 0 → ≤2 + 白名单扩
- **read_first**:
  - `.planning/phase-2.3/task_plan.md`(by Read,Phase 2.3 ship 1306L)
  - `.planning/phase-2.2/task_plan.md`(by Read,Phase 2.2 ship)
  - RESEARCH § 2.2.1-2.2.4 + § 2.6 + ASSUMPTIONS B-15 + R3 + R4
- **acceptance_criteria**:
  - 本 task_plan.md 顶部新增 `> **Resolved (T2.0)**: EE-4 baseline spike outcome ...` block(grep-verifiable)
  - `grep -E "Resolved \\(T2\\.0\\)" .planning/phase-2.4/task_plan.md | wc -l` ≥ 1
  - 阈值校准决策明示 (KEEP or RELAX + 数值)
- **decision_source**: B-15 + Phase 2.3 T0.10 sister + O3 + RESEARCH § 2.6

### T2.1 — routing/plan-review-schema.yaml NEW ≤60L (B-09 + B-10 yaml-only SSOT)

- **files_modified**: `routing/plan-review-schema.yaml`(NEW ≤60L)
- **action**: 创建 yaml SSOT (T2.0 spike outcome 决阈值数值,默认 intel 原型;若 T2.0 决放宽则 substitute):
  ```yaml
  # routing/plan-review-schema.yaml (Phase 2.4 W2 D-02 ABSORB)
  # NEW SSOT for EE-4 plan-checker quantitative rubric.
  # Source: .planning/intel/omc-comparison.md L74-82 (omo Metis + Momus 4 维原型 formalize).
  # NOT vendor: 不复刻希腊神话 prompt 字眼, 仅借 4 维 schema 形态 (B-09 + intel L80).
  # Schema location 路径: yaml-only SSOT (D-WP-2 (a)), NOT TypeBox regen (Karpathy YAGNI per B-10).
  schemaVersion: 1
  apiVersion: harnessed/v1
  kind: PlanReview
  metadata:
    name: ee-4-plan-review-schema
    version: 1
    source: intel/omc-comparison.md L74-82
  spec:
    dimensions:
      file_references_verified:
        description: "plan 提及的 file path 100% grep 命中真实文件 (NEW prefix exempt)"
        threshold: 1.0  # T2.0 spike outcome: <KEEP 1.0 or RELAX to 0.95>
        measurement: "grep files_modified:|files_created: → fs.access() ratio"
      reference_sources_real:
        description: "plan 引用的 intel/ADR/RETRO/CONTEXT 文件路径 ≥80% 真实存在"
        threshold: 0.8  # T2.0 spike outcome: <KEEP 0.8 or RELAX to 0.7>
        measurement: "regex decision_source:|see:|ref: → fs.access() ratio"
      concrete_acceptance:
        description: "plan 的 acceptance bar ≥90% 含可量化 signal (行数/exit code/regex 命中数/grep -c)"
        threshold: 0.9  # T2.0 spike outcome: <KEEP 0.9 or RELAX to 0.8>
        measurement: "regex acceptance_criteria: blocks + heuristic (grep -c|wc -l|exit \\d+|≤\\d+L) ratio"
      business_logic_assumptions:
        description: "plan 无 'assumed X behaves like Y' 类无来源臆测词"
        threshold: 0  # T2.0 spike outcome: <KEEP 0 or RELAX to ≤2>
        measurement: "regex assumed|presumably|should be|likely|probably|maybe count (白名单 'assumed (per D-NN)|assumed (locked)' 不计)"
    scoring:
      pass_threshold: 4    # 4/4 → PASS
      warning_threshold: 3 # 3/4 → WARNING
      blocker_threshold: 2 # ≤2/4 → BLOCKER (manual rerun per B-12, NOT auto-spawn)
    verdict_mapping:
      pass: "APPROVED — 4/4 dimensions met"
      warning: "APPROVED WITH CONDITIONS — 3/4 dimensions met, see warnings"
      blocker: "REJECTED — ≤2/4 dimensions met, plan-phase rerun required (manual)"
  ```
- **read_first**:
  - `routing/decision_rules.yaml`(by Read,Phase 1.5 + Phase 2.3 ship v2 顶层框架 analog)
  - T2.0 Resolved block (本 task_plan.md 顶部 — 阈值校准决策)
  - RESEARCH § 2.1 + intel L74-82 + ASSUMPTIONS B-09 + B-10
- **acceptance_criteria**:
  - `wc -l routing/plan-review-schema.yaml` ≤ 60
  - `grep -E "dimensions:" routing/plan-review-schema.yaml | wc -l` == 1
  - `grep -E "file_references_verified|reference_sources_real|concrete_acceptance|business_logic_assumptions" routing/plan-review-schema.yaml | wc -l` == 4 (4 维 keys)
  - `grep -E "metis|momus" routing/plan-review-schema.yaml | wc -l` == 0 (intel L80 NOT vendor 希腊神话 confirm)
  - yaml syntax valid (`node -e "console.log(JSON.stringify(require('js-yaml').load(require('fs').readFileSync('routing/plan-review-schema.yaml','utf8'))))"` exit 0)
- **decision_source**: B-09 + B-10 + RESEARCH D2.4-5 + intel L74-82

### T2.2 — scripts/run-plan-checker.mjs NEW ~80L (B-11 walker)

- **files_modified**: `scripts/run-plan-checker.mjs`(NEW ≤100L)
- **action**: 沿袭 `scripts/check-transparency-verdicts.mjs` walker L29-36 + ENFORCE 模式:
  ```js
  #!/usr/bin/env node
  // Phase 2.4 W2 D-02 — EE-4 plan-checker quantitative gate.
  // 沿袭 check-transparency-verdicts.mjs walker (Phase 2.1 T1.7 ship) + check-provenance.mjs JSON validator pattern (Phase 2.2 T4.0 ship).
  // BLOCKER (≤2/4) → exit 1 + ::error:: annotation (manual rerun per B-12, NOT auto-spawn).
  import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
  import { join } from 'node:path'
  import { parse as parseYaml } from 'yaml'

  const ENFORCE = process.env.ENFORCE !== 'false'  // default true
  const SCHEMA = parseYaml(readFileSync('routing/plan-review-schema.yaml', 'utf8'))
  const targetDir = process.argv[2] ?? '.planning/'

  function walk(dir, out = []) {
    if (!existsSync(dir)) return out
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p, out)
      else if (/task_plan\.md$|PLAN\.md$/.test(name)) out.push(p)
    }
    return out
  }

  function scoreFileRefs(content) {
    const paths = [...content.matchAll(/files?(?:_modified|_created):\s*([^\n]+)/g)].flatMap(m => m[1].split(/[,\s]+/).filter(p => p && !p.startsWith('#') && !p.startsWith('NEW ')))
    if (paths.length === 0) return 1.0
    const found = paths.filter(p => existsSync(p)).length
    return found / paths.length
  }
  function scoreSourceRefs(content) {
    // W6 plan-check fix — multi-line regex aware: decision_source 块可跨多行 (e.g. "- **decision_source**: B-32 + KICKOFF § 3")
    // 不只 .md path — 加 B-NN / Phase X.Y / § X / ADR N / R-NN anchor pattern 防 false-pass (T2.0 baseline spike 显 ref count 极少 → score 0/0 = 1.0 false-pass risk per RESEARCH § 2.2.2 edge case)
    // Strategy: (1) capture .md path refs (existsSync check) (2) ALSO count anchor refs (B-NN / Phase X.Y / § X / ADR N / R-NN) as "structural refs" (not file-checkable but valid sources)
    const mdRefs = [...content.matchAll(/(?:decision_source|see|ref):\s*([^\n]+\.md)/gm)].map(m => m[1].trim())
    const anchorRefs = [...content.matchAll(/(?:decision_source|see|ref):[^\n]*?(B-\d+|Phase \d+\.\d+|§ ?\d+(?:\.\d+)*|ADR \d+|R\d+)/gm)]
    const totalRefs = mdRefs.length + anchorRefs.length
    if (totalRefs === 0) return 1.0  // legitimate no-ref plan (rare)
    if (mdRefs.length === 0) return 1.0  // anchor-only refs (structural, not file-checkable) — assume valid
    return mdRefs.filter(r => existsSync(r)).length / mdRefs.length
  }
  function scoreAcceptance(content) {
    const blocks = [...content.matchAll(/(?:acceptance_criteria|Acceptance):([\s\S]*?)(?=\n##|\n-\s|\Z)/g)].map(m => m[1])
    if (blocks.length === 0) return 1.0
    const quantifiable = blocks.filter(b => /grep -c|wc -l|exit \d+|≤\d+L|\d+ lines|≥ ?\d+|toBeGreaterThan/.test(b)).length
    return quantifiable / blocks.length
  }
  function scoreWeasel(content) {
    // 白名单 'assumed (per D-NN)' / 'assumed (locked)' 不计 per B-14
    const matches = [...content.matchAll(/\b(assumed|presumably|should be|likely|probably|maybe)\b/gi)]
    const filtered = matches.filter(m => !/\(per D-\d+\)|\(locked\)/.test(content.substr(m.index, 60)))
    return filtered.length
  }

  const t = SCHEMA.spec.thresholds, s = SCHEMA.spec.scoring
  let totalBLOCKER = 0
  for (const file of walk(targetDir)) {
    const content = readFileSync(file, 'utf8')
    const scores = {
      file_references_verified: scoreFileRefs(content),
      reference_sources_real: scoreSourceRefs(content),
      concrete_acceptance: scoreAcceptance(content),
      business_logic_assumptions: scoreWeasel(content),
    }
    const passed = [
      scores.file_references_verified >= t.file_references_verified,
      scores.reference_sources_real >= t.reference_sources_real,
      scores.concrete_acceptance >= t.concrete_acceptance,
      scores.business_logic_assumptions <= t.business_logic_assumptions,
    ]
    const passedCount = passed.filter(Boolean).length
    const verdict = passedCount >= s.pass_threshold ? 'PASS' : passedCount >= s.warning_threshold ? 'WARNING' : 'BLOCKER'
    const result = { file, scores, dimensions_passed: passedCount, verdict, auto_retrigger_plan_phase: false }
    console.log(JSON.stringify(result))
    if (verdict === 'BLOCKER') {
      console.error(`::error file=${file}::plan-check BLOCKER (${passedCount}/4) — manual /gsd-plan-phase rerun required`)
      totalBLOCKER++
    }
  }
  process.exit(ENFORCE && totalBLOCKER > 0 ? 1 : 0)
  ```
- **read_first**:
  - `scripts/check-transparency-verdicts.mjs`(by Read,Phase 2.1 T1.7 ship 96L walker pattern)
  - `scripts/check-provenance.mjs`(by Read,Phase 2.2 T4.0 ship 70L JSON validator pattern)
  - `routing/plan-review-schema.yaml`(by Read,T2.1 ship)
  - PATTERNS § 2.4 + RESEARCH § 2.2
- **acceptance_criteria**:
  - `wc -l scripts/run-plan-checker.mjs` ≤ 100
  - `grep -E "ENFORCE" scripts/run-plan-checker.mjs | wc -l` ≥ 1 (沿袭 Phase 2.1 W3 模式)
  - `node scripts/run-plan-checker.mjs .planning/phase-2.3/` 输出每 plan 一行 JSON 含 `{verdict, dimensions_passed, scores}` (T2.0 spike outcome 与本 Wave 2 实跑一致 — 若不一致,T2.0 Resolved block 校准)
  - `node scripts/run-plan-checker.mjs .planning/phase-2.4/` exit 0 (本 phase 自检 NOT BLOCKER)
- **decision_source**: B-11 + B-14 + RESEARCH § 2.4 + PATTERNS § 2.4

### T2.3 — .claude/agents/gsd-plan-checker.md NEW project-local override ~30L (B-13)

- **files_modified**: `.claude/agents/gsd-plan-checker.md`(NEW project-local override ~30L)
- **action**: 创建 project-local override (NOT 改全局 `~/.claude/agents/gsd-plan-checker`):
  ```markdown
  ---
  name: gsd-plan-checker
  ---

  # gsd-plan-checker (project-local override — Phase 2.4 W2 D-02 ABSORB)

  This project-local override adds EE-4 4 维 quantitative output to the global gsd-plan-checker agent.
  Refer to global agent for base behavior (BLOCKER/WARNING/SUGGESTION 三档 verdict).

  ## EE-4 4 维量化输出节 (per routing/plan-review-schema.yaml)

  After your verdict (APPROVED / APPROVED WITH CONDITIONS / REJECTED), output a quantitative rubric JSON block:

  ```json
  {
    "schema_version": 1,
    "dimensions": {
      "file_references_verified": { "score": <0.0-1.0>, "passed": <bool>, "evidence": "<X>/<Y> paths exist" },
      "reference_sources_real": { "score": <0.0-1.0>, "passed": <bool>, "evidence": "<X>/<Y> refs exist" },
      "concrete_acceptance": { "score": <0.0-1.0>, "passed": <bool>, "evidence": "<X>/<Y> grep-able" },
      "business_logic_assumptions": { "score": <int>, "passed": <bool>, "evidence": "<N> weasel words (- 白名单)" }
    },
    "dimensions_passed": <0-4>,
    "verdict": "PASS" | "WARNING" | "BLOCKER",
    "auto_retrigger_plan_phase": false
  }
  ```

  ## Mapping
  - 4/4 → PASS
  - 3/4 → WARNING
  - ≤2/4 → BLOCKER — **manual** `/gsd-plan-phase` rerun required (NOT auto-spawn per Phase 2.4 ASSUMPTIONS B-12; v0.3.0 orchestration layer will absorb auto-spawn).
  ```
- **read_first**:
  - `.planning/phase-2.3/PLAN-CHECK.md`(by Read,现 gsd-plan-checker 三档 verdict 实证 BLOCKER/WARNING/SUGGESTION 模板)
  - `routing/plan-review-schema.yaml`(by Read,T2.1 ship)
  - RESEARCH § 2.3 + ASSUMPTIONS B-13 + B-12 (manual rerun anchor)
- **acceptance_criteria**:
  - `wc -l .claude/agents/gsd-plan-checker.md` ≤ 50 (~30L target)
  - `grep -E "EE-4 4 维量化输出" .claude/agents/gsd-plan-checker.md | wc -l` ≥ 1
  - `grep -E "auto_retrigger_plan_phase.*false" .claude/agents/gsd-plan-checker.md | wc -l` ≥ 1 (B-12 anchor)
  - `grep -E "manual.*gsd-plan-phase.*rerun" .claude/agents/gsd-plan-checker.md | wc -l` ≥ 1 (B-12 explicit)
- **decision_source**: B-12 + B-13 + RESEARCH D2.4-7 + § 2.3

### T2.4 — .github/workflows/ci.yml +EE-4 plan-checker step + tests/integration/plan-checker-quant.test.ts NEW ~60L

- **files_modified**: `.github/workflows/ci.yml`(MODIFY +~10L step) + `tests/integration/plan-checker-quant.test.ts`(NEW ~60L)
- **action**:
  1. `.github/workflows/ci.yml` 加 step 沿袭 PATTERNS § 2.12:
     ```yaml
     - name: EE-4 plan-checker (Phase 2.4 W2 D-02)
       run: |
         for phase_dir in .planning/phase-*/; do
           node scripts/run-plan-checker.mjs "$phase_dir" > "${phase_dir}plan-check.json" || {
             echo "::error::plan-check BLOCKER at $phase_dir — manual /gsd-plan-phase rerun required (per Phase 2.4 ASSUMPTIONS B-12)"
             exit 1
           }
         done
     ```
  2. `tests/integration/plan-checker-quant.test.ts` ~60L integration test:
     - cell 1: spawn `node scripts/run-plan-checker.mjs .planning/phase-2.3/` and assert exit 0 (Phase 2.3 plan PASS or WARNING per T2.0 baseline)
     - cell 2: synthetic BLOCKER plan (fixture with weasel words + missing file refs) → exit 1 + `::error::` annotation
     - cell 3: schema yaml validate (yaml parse + threshold keys 4 维)
     - cell 4: walker 路径覆盖 (`.planning/phase-2.4/` 自检 NOT BLOCKER)
- **read_first**:
  - `scripts/run-plan-checker.mjs`(by Read,T2.2 ship)
  - PATTERNS § 2.12
- **acceptance_criteria**:
  - `grep -E "EE-4 plan-checker" .github/workflows/ci.yml | wc -l` ≥ 1
  - `wc -l tests/integration/plan-checker-quant.test.ts` ≤ 80 (~60L target)
  - `corepack pnpm test -- tests/integration/plan-checker-quant.test.ts` 全 4 cell pass
- **decision_source**: B-11 + B-12 + PATTERNS § 2.12 + RESEARCH § 10

---

## Wave 3 — dashboard C 路径 FULL absorb (D-04, 3 sub-task 并行 per B-19)

### T3.1 — cc-hook installer (NEW + dispatch + 3 处 schema enum + fixture)

- **files_modified**: `src/installers/ccHookAdd.ts`(NEW ≤100L) + `src/installers/index.ts`(MODIFY +1 dispatch + +1 levelOf case) + `src/manifest/schema/spec.ts`(MODIFY 3 处 enum 加) + `src/manifest/schema/installMethods/ccHookAdd.ts`(NEW ~30L) + `src/manifest/schema/installMethods/index.ts`(MODIFY +1 branches entry) + `manifests/cc-hooks/dashboard-autospawn.yaml`(NEW ≤40L fixture) + `tests/installers/ccHookAdd.test.ts`(NEW ~50L) + `tests/integration/installer-contract.test.ts`(MODIFY +15L cc-hook-add row)
- **action**:
  1. `src/installers/ccHookAdd.ts` NEW 复刻 `npxSkillInstaller.ts` skeleton (L65-217 dispatch guard + preflight + DiffPlan + L2 confirm + backup + JSON merge + verify) ≤100L (per B-21):
     ```ts
     // src/installers/ccHookAdd.ts (Karpathy hard limit ≤100L per B-38)
     // Closest analog: npxSkillInstaller.ts (L2, ~/.claude/ write, real-path verify).
     // L3 level (system-config tier sister mcp-stdio-add / mcp-http-add / cc-plugin-marketplace).
     import { readFile, writeFile } from 'node:fs/promises'
     import { homedir } from 'node:os'
     import { join } from 'node:path'
     import { backup } from './lib/backup.js'
     import { confirmAt } from './lib/confirm.js'
     import { renderDiff } from './lib/diff.js'
     import { preflight } from './lib/preflight.js'
     import { updateInstalled } from './lib/state.js'
     import type { DiffPlan, InstallContext, Installer, InstallResult } from './lib/types.js'

     export const installCcHookAdd: Installer = async (ctx) => {
       const install = ctx.manifest.spec.install
       if (install.method !== 'cc-hook-add') {
         return { ok: false, phase: 'preflight', error: { keyword: 'dispatch-mismatch', detail: 'method ≠ cc-hook-add' } }
       }
       const pre = preflight(ctx)
       if (!pre.ok) return { ok: false, phase: 'preflight', error: pre.error }
       // Target: ~/.claude/settings.json hooks block deep-merge (B-21)
       const settingsPath = join(homedir(), '.claude', 'settings.json')
       const existing = await readFile(settingsPath, 'utf8').catch(() => '{}')
       const settings = JSON.parse(existing)
       settings.hooks = settings.hooks ?? {}
       const ev = install.hook_event, matcher = install.hook_matcher, cmd = install.hook_command
       settings.hooks[ev] = settings.hooks[ev] ?? []
       // Idempotent: matching cmd already present? skip
       if (settings.hooks[ev].some((h: any) => h.command === cmd && h.matcher === matcher)) {
         return { ok: true, backupId: 'idempotent-skip', appliedFiles: [], skipped: true }
       }
       settings.hooks[ev].push({ matcher, command: cmd })
       const newText = JSON.stringify(settings, null, 2)
       const plan: DiffPlan = { files: [{ target: settingsPath, scope: 'HOME', oldText: existing, newText }] }
       process.stdout.write(renderDiff(plan, ctx))
       const conf = await confirmAt('L3', { ...ctx, level: 'L3' })  // sister mcp-stdio-add 同档
       if (!conf.proceed) return { aborted: true, reason: 'user-cancel' }
       const bk = await backup(plan, ctx)
       if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }
       await writeFile(settingsPath, newText)
       // Verify: re-read JSON.parse + grep hook_command present (B-21 R7 mitigation)
       const verifyJson = JSON.parse(await readFile(settingsPath, 'utf8'))
       if (!verifyJson.hooks?.[ev]?.some((h: any) => h.command === cmd)) {
         return { ok: false, phase: 'verify', backupId: bk.backupId, error: { keyword: 'verify-failed', detail: 'hook command not present after write' } }
       }
       await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, '', '')
       return { ok: true, backupId: bk.backupId, appliedFiles: [settingsPath] }
     }

     export const uninstallCcHookAdd: Installer = async (ctx) => {
       // S2 plan-check fix — uninstall 4 step 详细 (sister Phase 2.1 4 installer uninstall pattern; symmetric to install ~20L):
       // (1) Read ~/.claude/settings.json — find matching hook block by hook_command exact match
       // (2) Splice matching entry from settings.hooks[hook_event][] array (or delete event key if empty)
       // (3) backup() before write + writeFile new settings.json
       // (4) Verify hook unregistered: re-read JSON.parse + assert NO matching hook_command in hooks[hook_event][]
       // + emit done message + provenance state.json updateInstalled() removal (sister 6 installer uninstall pattern)
       // Idempotent: if no matching hook found → return { ok: true, skipped: true, reason: 'not-installed' }
     }
     ```
  2. `src/installers/index.ts` 加 dispatch + levelOf 沿袭 PATTERNS § 2.6:
     ```ts
     import { installCcHookAdd } from './ccHookAdd.js'
     // ... existing imports 不动 ...
     export const installers = {
       // ... 6 existing entries 不动 ...
       'cc-hook-add': installCcHookAdd,  // ← 7th entry
     }
     function levelOf(manifest: Manifest): Level {
       switch (manifest.spec.install.method) {
         case 'mcp-stdio-add':
         case 'mcp-http-add':
         case 'cc-plugin-marketplace':
         case 'cc-hook-add':  // ← ADD 沿袭 L3 user-config (~/.claude/settings.json)
           return 'L3'
         // ... 其余 case 不动 ...
       }
     }
     ```
  3. `src/manifest/schema/spec.ts` **3 处 enum 加**(B-22 R2 critical finding):
     - L106-111 `InstallType` Union +1 `Type.Literal('hook')` → 5 enum
     - L23-28 `TypeEnum` Union +1 `Type.Literal('cc-hook')` → NEW type (1:1 与 install_type:'hook')
     - L27-33 `install.method` union +1 `Type.Literal('cc-hook-add')` → 7 method
     - `install` 字段加 3 optional field: `hook_event` (Type.Union enum SessionStart/UserPromptSubmit/PreToolUse/PostToolUse) + `hook_matcher: Type.Optional(Type.String())` + `hook_command: Type.String({ minLength: 1 })`
  4. `src/manifest/schema/installMethods/ccHookAdd.ts` NEW ~30L 复刻 npxSkillInstaller schema shape (PATTERNS § 2.7):
     ```ts
     import { Type } from '@sinclair/typebox'
     export const CcHookAdd = Type.Object({
       method: Type.Literal('cc-hook-add'),
       cmd: Type.String({ minLength: 1 }),  // sister 6 method 共通字段
       hook_event: Type.Union([
         Type.Literal('SessionStart'),
         Type.Literal('UserPromptSubmit'),
         Type.Literal('PreToolUse'),
         Type.Literal('PostToolUse'),
       ]),
       hook_matcher: Type.Optional(Type.String()),
       hook_command: Type.String({ minLength: 1 }),
       idempotent_check: Type.String({ minLength: 1 }),
     }, { additionalProperties: false })
     ```
  5. `src/manifest/schema/installMethods/index.ts` branches[] L20-27 加 7th entry `CcHookAdd`
  6. `manifests/cc-hooks/dashboard-autospawn.yaml` NEW ≤40L 第一 fixture (SessionStart hook 触发 dashboard 启动检查 demo)
  7. `tests/installers/ccHookAdd.test.ts` ~50L (dispatch + install + uninstall + idempotent + verify-failed case)
  8. `tests/integration/installer-contract.test.ts` +15L cc-hook-add row (contract row 沿袭 6 method 现有 rows)
- **read_first**:
  - `src/installers/npxSkillInstaller.ts`(by Read,closest analog L65-217 复刻 skeleton)
  - `src/installers/index.ts`(by Read,现 6 dispatch L27-49)
  - `src/manifest/schema/spec.ts`(by Read,L23-33 TypeEnum + L27-33 install.method + L106-111 InstallType)
  - `src/manifest/schema/installMethods/index.ts`(by Read,branches L20-27)
  - PATTERNS § 2.5-2.7 + RESEARCH § 3.5.3 + ASSUMPTIONS B-20 + B-21 + B-22
- **acceptance_criteria**:
  - `wc -l src/installers/ccHookAdd.ts` ≤ 100 (B-38)
  - `wc -l src/manifest/schema/installMethods/ccHookAdd.ts` ≤ 40 (~30L target)
  - `wc -l manifests/cc-hooks/dashboard-autospawn.yaml` ≤ 40
  - `grep -E "'cc-hook-add':\\s*installCcHookAdd" src/installers/index.ts | wc -l` == 1 (dispatch 7th)
  - `grep -E "case 'cc-hook-add'" src/installers/index.ts | wc -l` == 1 (levelOf 沿袭 L3)
  - `grep -E "Type\\.Literal\\('hook'\\)" src/manifest/schema/spec.ts | wc -l` == 1 (InstallType 5 enum)
  - `grep -E "Type\\.Literal\\('cc-hook'\\)" src/manifest/schema/spec.ts | wc -l` == 1 (TypeEnum NEW type)
  - `grep -E "Type\\.Literal\\('cc-hook-add'\\)" src/manifest/schema/spec.ts | wc -l` ≥ 1 (install.method 7th)
  - `grep -E "CcHookAdd" src/manifest/schema/installMethods/index.ts | wc -l` ≥ 1 (branches 7th)
  - `corepack pnpm test -- tests/installers/ccHookAdd.test.ts` 全 pass
  - `corepack pnpm test -- tests/integration/installer-contract.test.ts` 全 pass (含 7th row)
  - `harnessed install dashboard-autospawn --dry-run` exit 0 (smoke)
- **decision_source**: B-20 + B-21 + B-22 + D2.4-13 + D2.4-14 + D2.4-15 + R9

### T3.2 — scripts/dashboard.mjs +~50L SSE watcher + localhost-only bind (B-23 + B-24 + B-27)

- **files_modified**: `scripts/dashboard.mjs`(MODIFY +~50L SSE + localhost bind) + `tests/scripts/dashboard-sse.test.ts`(NEW ~40L)
- **action**:
  1. `scripts/dashboard.mjs` server-side 加 fs.watch + SSE `/events` endpoint (PATTERNS § 2.8 + RESEARCH § 3.2.2):
     ```js
     import { watch } from 'node:fs'

     const sseClients = new Set()
     let debounceTimer = null
     watch(join(PLANNING, 'STATE.md'), () => {  // 仅 watch 单文件 per B-24 (Win 不稳 recursive)
       clearTimeout(debounceTimer)
       debounceTimer = setTimeout(() => {
         const msg = `event: state-changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
         for (const res of sseClients) { try { res.write(msg) } catch {} }
       }, 500)  // debounce 500ms per B-24
     })

     // In createServer dispatcher:
     if (url === '/events') {
       res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
       res.write(': connected\n\n')
       sseClients.add(res)
       req.on('close', () => sseClients.delete(res))
       return
     }
     ```
  2. Client-side SHELL HTML L406-429 改 — `setInterval(poll, 2000)` 替 `new EventSource('/events')` per B-23 + O6 (MIN: SSE 替换 polling 完全,不双轨):
     ```js
     const es = new EventSource('/events')
     es.addEventListener('state-changed', () => { dot.classList.add('changed'); t.textContent='文件有更新, 点击 ⟳ 刷新' })
     ```
  3. **localhost-only bind** (B-27 R5 mitigation) — dashboard.mjs L478 `listen(PORT)` 改 `listen(PORT, '127.0.0.1')` 防 SSE endpoint 被外部恶意 client connect resource exhaustion
  3.5 **W5 plan-check fix — zero-dep grep gate** (Phase 2.2 dashboard.mjs L11 "Zero external deps" promise 维持): Wave 3 T3.2 + T3.3 ship pre-commit 必跑 `grep -cE "^import.*from\s+['\"](ws|socket\.io|express|fastify|cors|helmet|body-parser)['\"]" scripts/dashboard.mjs` == 0 (NO npm dep imports — 仅 `node:*` built-ins allowed);违反则 Wave 3 fail-fast。
  3.6 **S1 plan-check fix — SSE reconnect re-fetch** (RESEARCH § 3.2.2 reconnect 期 state-changed event 丢失补偿 path): client-side 加 EventSource `onopen` handler — reconnect 触发时显式 re-fetch current page (沿袭现 loadPage() 模式):
     ```js
     es.onopen = () => {
       // S1 plan-check fix — reconnect 期可能错过 state-changed event, re-fetch current page 强制 refresh
       if (typeof loadPage === 'function' && currentPage) loadPage(currentPage)
     }
     ```
     标准 SSE 模式 — EventSource 内建 reconnect 但不补 events; client-side 显式 re-fetch 兜 (Last-Event-Id header reserve for v0.3.0 enhancement if drift surfaces)。
  4. `tests/scripts/dashboard-sse.test.ts` ~40L:
     - cell 1: spawn dashboard + `curl -N http://localhost:47180/events` 收到 `: connected\n\n`
     - cell 2: touch `.planning/STATE.md` → SSE 1s 内收到 `event: state-changed`
     - cell 3: bind verify — `curl http://0.0.0.0:47180/events` fail (localhost-only)
     - cell 4: debounce verify — 连续 5 touch 500ms 内 → 仅 1 event 发出
- **read_first**:
  - `scripts/dashboard.mjs`(by Read,现 505L,L406-429 client polling + L435-445 watchedPaths + L478 listen)
  - PATTERNS § 2.8 + RESEARCH § 3.2.2 + ASSUMPTIONS B-23 + B-24 + B-27 + R5 + R6
- **acceptance_criteria**:
  - `grep -E "import \\{ watch \\} from 'node:fs'" scripts/dashboard.mjs | wc -l` ≥ 1
  - `grep -E "text/event-stream" scripts/dashboard.mjs | wc -l` ≥ 1 (SSE not WebSocket per B-23)
  - `grep -E "new EventSource\\('/events'\\)" scripts/dashboard.mjs | wc -l` ≥ 1 (client)
  - `grep -E "listen\\(PORT,?\\s*'127\\.0\\.0\\.1'" scripts/dashboard.mjs | wc -l` ≥ 1 (B-27 localhost bind)
  - `wc -l scripts/dashboard.mjs` ≤ 600 (T3.2 +~50L 后 505+50=555 — T3.3 后再涨 ~80L → 635L 软限内)
  - `grep -E "ws\\|WebSocket\\b" scripts/dashboard.mjs | grep -v "EventSource\\|state-changed\\|web socket" | wc -l` == 0 (NOT ws — sanity)
  - **W5 plan-check fix — zero-dep grep gate**: `grep -cE "^import.*from\s+['\"](ws|socket\.io|express|fastify|cors|helmet|body-parser)['\"]" scripts/dashboard.mjs` == 0 (zero npm dep imports — 仅 `node:*` built-ins 允许; Phase 2.2 L11 promise 维持)
  - **S1 plan-check fix — SSE reconnect re-fetch**: `grep -E "es\.onopen|loadPage\(currentPage\)" scripts/dashboard.mjs | wc -l` ≥ 1 (reconnect path 显式)
  - `corepack pnpm test -- tests/scripts/dashboard-sse.test.ts` 全 4 cell pass
- **decision_source**: B-23 + B-24 + B-27 + D2.4-9 + D2.4-10 + RESEARCH § 3.2 + R5 + R6

### T3.3 — scripts/dashboard.mjs +~80L 多项目 nav + ~/.claude/harnessed-projects.json (B-25)

- **files_modified**: `scripts/dashboard.mjs`(MODIFY +~80L) + `tests/scripts/dashboard-multi-project.test.ts`(NEW ~40L)
- **action**:
  1. `scripts/dashboard.mjs` server-side 加 `/api/projects` + `/api/project/<id>/state` endpoint (PATTERNS § 2.9 + RESEARCH § 3.3):
     ```js
     import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

     const projectsConfigPath = join(homedir(), '.claude', 'harnessed-projects.json')

     function loadProjects() {
       if (!existsSync(projectsConfigPath)) {
         // Auto-init: dashboard 启动检无则 default cwd as first project (B-25 + O7 MIN)
         mkdirSync(dirname(projectsConfigPath), { recursive: true })
         const init = { schemaVersion: 1, projects: [{ name: 'default', path: process.cwd(), lastAccessed: new Date().toISOString() }] }
         writeFileSync(projectsConfigPath, JSON.stringify(init, null, 2))
         return init
       }
       return JSON.parse(readFileSync(projectsConfigPath, 'utf8'))
     }

     // In createServer dispatcher:
     if (url === '/api/projects') {
       res.writeHead(200, { 'content-type': 'application/json' })
       return res.end(JSON.stringify(loadProjects()))
     }
     if (url.startsWith('/api/project/')) {
       // per-project STATE.md content
       const idx = parseInt(url.split('/')[3])
       const cfg = loadProjects()
       const proj = cfg.projects[idx]
       if (!proj) { res.writeHead(404); return res.end('not found') }
       const state = readFileSync(join(proj.path, '.planning', 'STATE.md'), 'utf8')
       res.writeHead(200, { 'content-type': 'text/markdown' })
       return res.end(state)
     }
     ```
  2. Client-side SHELL HTML 加 project selector (L389-405 nav HTML 上方):
     ```html
     <select id="proj-sel" onchange="loadProject(this.value)"></select>
     ```
     + JS (沿袭 现 L409-414 loadPage() pattern):
     ```js
     async function loadProject(path) {
       history.pushState({}, '', `?project=${encodeURIComponent(path)}`)
       const cfg = await (await fetch('/api/projects')).json()
       // re-render all panels with new project root
     }
     window.addEventListener('popstate', () => { /* re-render from URL */ })
     fetch('/api/projects').then(r => r.json()).then(cfg => {
       const sel = document.getElementById('proj-sel')
       cfg.projects.forEach((p, i) => sel.add(new Option(p.name, p.path)))
     })
     ```
  3. `tests/scripts/dashboard-multi-project.test.ts` ~40L:
     - cell 1: `/api/projects` 返回 default project (auto-init from cwd per O7)
     - cell 2: 多 project config (manual write 2 entries) → `/api/projects` 返回 2 entries
     - cell 3: `/api/project/0/state` 返回 cwd .planning/STATE.md content
     - cell 4: `/api/project/<invalid>/state` 返回 404
- **read_first**:
  - `scripts/dashboard.mjs`(by Read,T3.2 ship 后版本 + L447-473 createServer dispatch + L389-405 nav HTML)
  - PATTERNS § 2.9 + RESEARCH § 3.3 + ASSUMPTIONS B-25 + O7
- **acceptance_criteria**:
  - `grep -E "/api/projects" scripts/dashboard.mjs | wc -l` ≥ 1
  - `grep -E "harnessed-projects\\.json" scripts/dashboard.mjs | wc -l` ≥ 1
  - `grep -E "history\\.pushState" scripts/dashboard.mjs | wc -l` ≥ 1 (B-25 client route)
  - `grep -E "proj-sel" scripts/dashboard.mjs | wc -l` ≥ 1 (nav HTML)
  - `wc -l scripts/dashboard.mjs` ≤ 700 (B-26 soft cap;>650L 触发 T3.4 split fallback)
  - `corepack pnpm test -- tests/scripts/dashboard-multi-project.test.ts` 全 4 cell pass
- **decision_source**: B-25 + D2.4-12 + O7 + RESEARCH § 3.3 + PATTERNS § 2.9

### T3.4 — dashboard.mjs PARTIAL split fallback gate (B-26 + B-39 + R5, per D-WP-1 (c))

- **files_modified**: (conditional ship)
- **action**:
  1. T3.1 + T3.2 + T3.3 全 merge 后 verify `wc -l scripts/dashboard.mjs`
  2. **若 wc > 650** → 触发 PARTIAL split per D-WP-1 (c):
     - 抽 SHELL HTML inline (~250L) 到 `scripts/dashboard/shell.mjs` (export `function renderShell(): string`)
     - 主 `scripts/dashboard.mjs` import shell + call renderShell() — 主文件 ~385L 软限内
  3. **若 wc ≤ 650** → SKIP + Resolved block:
     ```
     > **Resolved (T3.4)**: dashboard.mjs wc = <X> ≤ 650L → split fallback NOT triggered;保持单文件 per B-26 default decision.
     ```
- **read_first**:
  - `scripts/dashboard.mjs`(by Read,T3.3 ship 后版本)
  - ASSUMPTIONS B-26 + B-39 + R5 + RESEARCH § 3.4 + D-WP-1
- **acceptance_criteria**:
  - 本 task_plan.md 顶部新增 `> **Resolved (T3.4)**: <SKIP or SPLIT> + dashboard.mjs wc = <X>` block(grep-verifiable)
  - 若 SPLIT → `ls scripts/dashboard/shell.mjs` 命中 + `wc -l scripts/dashboard.mjs` ≤ 400
  - 若 SKIP → `wc -l scripts/dashboard.mjs` ≤ 650
- **decision_source**: B-26 + B-39 + R5 + D-WP-1 (c) + O2

---

## Wave 4 — audit 完整版扩 + ralph-loop Win sentinel (F5 — D2.4-16 + D2.4-18)

### T4.1 — src/cli/audit.ts +~80L runtime layer + src/cli/lib/audit-helpers.ts NEW ≤50L split (B-28 + B-29)

- **files_modified**: `src/cli/audit.ts`(MODIFY,125→~150L cli orchestration under hard limit per B-29) + `src/cli/lib/audit-helpers.ts`(NEW ≤50L 含 3 helper)
- **action**:
  1. `src/cli/lib/audit-helpers.ts` NEW (B-29 split 默认 ship NOT fallback) ≤50L 含 3 helper (RESEARCH § 4.1.1-4.1.3):
     ```ts
     // src/cli/lib/audit-helpers.ts (Karpathy ≤50L per B-38)
     import { spawnSync } from 'node:child_process'
     import { checkOrigin } from './origin-check.js'
     import type { AuditFinding, Manifest } from '../audit-types.js'

     const COMMAND_SEPARATORS = /[;&|`$]/  // shell command injection markers
     const NPM_PKG_RE = /npm(?:\s+install\b|\s+i\b)(?:\s+(?:-g|--global))?\s+(\S+)/

     export function auditOriginIntegrity(cwd: string): AuditFinding[] {
       const r = checkOrigin(cwd, { allowFork: false })  // audit hard-fail mode per B-28
       if (r.status === 'pass') return []
       return [{ manifest: 'project', level: r.status === 'fail' ? 'error' : 'warn', field: '/git/remote/origin', detail: r.detail }]
     }

     export function auditInstallCmdIntegrity(m: Manifest): AuditFinding[] {
       const findings: AuditFinding[] = []
       const cmd = m.spec.install.cmd ?? ''
       if (COMMAND_SEPARATORS.test(cmd)) {
         findings.push({ manifest: m.metadata.name, level: 'error', field: '/spec/install/cmd', detail: 'install.cmd contains shell separator (injection risk)' })
       }
       const upstream = m.metadata.upstream?.repository ?? ''
       const npmMatch = cmd.match(NPM_PKG_RE)
       if (npmMatch && upstream.includes('github.com/')) {
         const declaredPkg = upstream.split('/').pop()?.replace('.git', '')
         if (declaredPkg && npmMatch[1] !== declaredPkg) {
           findings.push({ manifest: m.metadata.name, level: 'warn', field: '/spec/install/cmd', detail: `install.cmd npm pkg '${npmMatch[1]}' ≠ upstream '${declaredPkg}'` })
         }
       }
       return findings
     }

     export function auditProvenance(): AuditFinding[] {
       const r = spawnSync('node', ['scripts/check-provenance.mjs'], { encoding: 'utf8' })
       if (r.status === 0) return []
       return [{ manifest: 'project', level: 'error', field: '/.harnessed/provenance', detail: r.stderr.trim().slice(0, 200) }]
     }
     ```
  2. `src/cli/audit.ts` 加 runtime layer call site (audit action() 中累积 findings):
     ```ts
     import { auditOriginIntegrity, auditInstallCmdIntegrity, auditProvenance } from './lib/audit-helpers.js'
     // ... existing manifest layer 不动 ...
     // 新 runtime layer (Phase 2.4 W4):
     findings.push(...auditOriginIntegrity(process.cwd()))
     for (const m of manifests) findings.push(...auditInstallCmdIntegrity(m))
     findings.push(...auditProvenance())
     ```
- **read_first**:
  - `src/cli/audit.ts`(by Read,现 125L manifest layer + L42-50 REPO_URL_PATTERN)
  - `src/manifest/security.ts`(by Read,checkCmdString existing pattern)
  - `src/cli/lib/origin-check.ts`(by Read,T1.1 ship)
  - RESEARCH § 4.1 + PATTERNS § 1 row 11 + ASSUMPTIONS B-28 + B-29 + R2
- **acceptance_criteria**:
  - `wc -l src/cli/audit.ts` ≤ 200 (helper split 后 ~150L cli orchestration per B-29)
  - `wc -l src/cli/lib/audit-helpers.ts` ≤ 50 (B-29)
  - `grep -E "auditOriginIntegrity\\|auditInstallCmdIntegrity\\|auditProvenance" src/cli/audit.ts | wc -l` ≥ 3 (3 helper call site)
  - `grep -E "allowFork:\\s*false" src/cli/lib/audit-helpers.ts | wc -l` ≥ 1 (B-28 hard-fail mode)
  - TypeScript compile pass
- **decision_source**: B-28 + B-29 + D2.4-16 + D2.4-17 + RESEARCH § 4.1 + R2

### T4.2 — tests/cli/audit.test.ts NEW ~60L (4 case)

- **files_modified**: `tests/cli/audit.test.ts`(NEW ~60L)
- **action**: 4 case test:
  - cell 1: origin URL drift → audit 输出 `level: error` finding (B-28 hard-fail vs doctor warn)
  - cell 2: manifest `install.cmd` 含 `;` shell separator → audit `level: error` injection risk finding
  - cell 3: manifest upstream `github.com/foo/bar` + install.cmd `npm install bar-evil` → audit `level: warn` cross-check mismatch
  - cell 4: `node scripts/check-provenance.mjs` fail (mock fixture) → audit `level: error` provenance finding
- **read_first**:
  - `src/cli/lib/audit-helpers.ts`(by Read,T4.1 ship)
  - `src/cli/audit.ts`(by Read,T4.1 modified version)
  - PATTERNS § 1 row 11 + RESEARCH § 11 STRIDE T-2.4-01/02/03
- **acceptance_criteria**:
  - `wc -l tests/cli/audit.test.ts` ≤ 80 (~60L target)
  - `corepack pnpm test -- tests/cli/audit.test.ts` 全 4 cell pass
- **decision_source**: B-28 + RESEARCH § 11 + § 10 Wave 0 Gaps Wave 4

### T4.3 — tests/routing/ralph-loop-win-sentinel.test.ts NEW ~80L (B-30 5 fixture) + CI Win step

- **files_modified**: `tests/routing/ralph-loop-win-sentinel.test.ts`(NEW ~80L,Win-only via `it.skipIf(process.platform !== 'win32')`) + `.github/workflows/ci.yml`(MODIFY +~10L Win-only step)
- **action**:
  1. `tests/routing/ralph-loop-win-sentinel.test.ts` ~80L per B-30 MIN 5 fixture (anti-redo Phase 2.3 30 sample per D2.4-19):
     - fixture 1: `simple-complete` — spawn ralphLoopWrap, 1 iter, "COMPLETE" detect, exit 0
     - fixture 2: `multi-iter` — spawn, 3 iter, "COMPLETE" on iter 3, exit 0
     - fixture 3: `max-iter-exceeded` — spawn, reach max-iter, exit 1 with "iter exceeded" msg
     - fixture 4: `subagent-spawn` — **mock subagent** per B-30 + O5 (real CC SDK 需 ANTHROPIC_API_KEY OOS),Win bash fork test (Phase 1.1 finding 验证)
     - fixture 5: `timeout` — spawn, timeout reached, SIGKILL, exit 1 (Win SIGKILL behavior parity)
     - 每 fixture skipIf 非 Win
  2. `.github/workflows/ci.yml` 加 Win-only step 沿袭 Phase 2.3 W0 T0.6 provenance pwsh sentinel pattern (PATTERNS § 2.11):
     ```yaml
     - name: ralph-loop Win sentinel (Phase 2.4 F5 — MIN 5 fixture per B-30)
       if: runner.os == 'Windows'
       shell: bash  # 沿袭 doctor.ts 验过 Git Bash 路径 per B-04
       run: corepack pnpm test -- tests/routing/ralph-loop-win-sentinel.test.ts
     ```
- **read_first**:
  - `src/routing/lib/ralphLoop.ts`(by Read,Phase 2.2 W4 ship ≤50L wedge)
  - `tests/routing/sdk-spawn.test.ts`(by Read,Phase 2.2 W4 ralph-loop unit test analog)
  - `.github/workflows/ci.yml` L100-103(by Read,Phase 2.3 W0 T0.6 Provenance Win pwsh sentinel pattern)
  - RESEARCH § 4.2 + PATTERNS § 2.11 + ASSUMPTIONS B-30 + R13 + O5
- **acceptance_criteria**:
  - `wc -l tests/routing/ralph-loop-win-sentinel.test.ts` ≤ 100 (~80L target)
  - `grep -E "simple-complete\\|multi-iter\\|max-iter-exceeded\\|subagent-spawn\\|timeout" tests/routing/ralph-loop-win-sentinel.test.ts | wc -l` ≥ 5 (5 fixture)
  - `grep -E "ralph-loop Win sentinel" .github/workflows/ci.yml | wc -l` ≥ 1
  - `grep -E "if: runner.os == 'Windows'" .github/workflows/ci.yml | wc -l` ≥ 2 (Phase 2.3 T0.6 provenance + Phase 2.4 ralph-loop = 2 Win sentinel step)
  - On Win matrix: `corepack pnpm test -- tests/routing/ralph-loop-win-sentinel.test.ts` 5 fixture 全 pass
- **decision_source**: B-30 + D2.4-18 + Phase 2.3 W0 T0.6 sister + RESEARCH § 4.2 + R13 + O5

---

## Wave 5 — 30-sample integration e2e (F6 — D2.4-19 anti-redo)

### T5.1 — tests/cli/doctor-fixtures.test.ts NEW ~120L (30 doctor fixture per B-31)

- **files_modified**: `tests/cli/doctor-fixtures.test.ts`(NEW ~120L)
- **action**: 30 doctor fixture (5 check × 6 env scenario per B-31):
  - 5 check: Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL
  - 6 env scenario: clean Linux / clean Mac / clean Win Git Bash / missing jq / wrong Node / tampered origin URL
  - 每 fixture mock 相应 env (spawn child with controlled env vars + fs fixture mock) + assert `harnessed doctor --json` output matches expected `{checks: [...], summary}`
- **read_first**:
  - `src/cli/doctor.ts`(by Read,T1.2 ship 后版本)
  - `tests/cli/doctor.test.ts`(by Read,T1.3 ship unit test 模板扩展)
  - ASSUMPTIONS B-31 + D2.4-19
- **acceptance_criteria**:
  - `wc -l tests/cli/doctor-fixtures.test.ts` ≤ 150 (~120L target)
  - `grep -E "scenario:\\s*'(clean-linux\\|clean-mac\\|clean-win-git-bash\\|missing-jq\\|wrong-node\\|tampered-origin)'" tests/cli/doctor-fixtures.test.ts | wc -l` ≥ 6 (6 env scenario)
  - `corepack pnpm test -- tests/cli/doctor-fixtures.test.ts` 30 fixture 全 pass (3 OS matrix: Win-specific fixtures skipIf non-Win)
- **decision_source**: B-31 + D2.4-19 + RESEARCH § 10

### T5.2 — tests/integration/plan-checker-fixtures.test.ts NEW ~80L (30 plan-checker fixture)

- **files_modified**: `tests/integration/plan-checker-fixtures.test.ts`(NEW ~80L)
- **action**: 30 plan-checker fixture — Phase 1.1~2.3 现存 plan 跑 plan-review-schema 量化输出 per B-31 (anti-redo Phase 2.3 routing 30 sample per D2.4-19):
  - 跑 `.planning/phase-{1.1,1.2,1.3,1.4,1.5,2.1,2.2,2.3}/{PLAN,task_plan}.md` 共 ~16 plan file
  - 加 synthetic fixture 14 (e.g. weasel-word heavy / stale file refs / no acceptance / mix BLOCKER/WARNING/PASS spectrum)
  - assert verdict 与 T2.0 spike baseline 一致 + 验证三档分布合理
- **read_first**:
  - `scripts/run-plan-checker.mjs`(by Read,T2.2 ship)
  - `routing/plan-review-schema.yaml`(by Read,T2.1 ship + T2.0 spike calibrated)
  - T2.0 Resolved block (本 task_plan.md 顶部)
  - ASSUMPTIONS B-15 + B-31 + RESEARCH § 10
- **acceptance_criteria**:
  - `wc -l tests/integration/plan-checker-fixtures.test.ts` ≤ 100 (~80L target)
  - `corepack pnpm test -- tests/integration/plan-checker-fixtures.test.ts` 30 fixture 全 pass + verdict 分布与 T2.0 baseline 一致
- **decision_source**: B-15 + B-31 + D2.4-19 + RESEARCH § 2.6 + § 10

### T5.3 — tests/integration/phase-2.4-e2e.test.ts NEW ~100L (全链路 e2e)

- **files_modified**: `tests/integration/phase-2.4-e2e.test.ts`(NEW ~100L)
- **action**: 全链路 e2e (沿袭 Phase 2.3 T5.3 phase-2.3-e2e.test.ts 105L pattern):
  - Link 1: `harnessed doctor --json` exit 0 + 5 check 全 status PASS (or expected WARN on test env)
  - Link 2: `node scripts/run-plan-checker.mjs .planning/phase-2.4/` exit 0 (本 phase 自检 NOT BLOCKER)
  - Link 3: spawn dashboard + `curl /api/projects` returns default project (auto-init from cwd per O7) + SSE /events stream working
  - Link 4: `harnessed install dashboard-autospawn --dry-run` exit 0 (cc-hook-add 7th method dispatch smoke)
  - Link 5: `harnessed audit` exit 0 (origin pass + install.cmd 无 injection + provenance pass)
  - Link 6: cross-link compose — doctor 通过 → audit 通过 → dashboard 启动 → plan-checker 通过 → cc-hook installer dry-run 通过
- **read_first**:
  - `.planning/phase-2.3/tests/integration/phase-2.3-e2e.test.ts`(by Read,sister 105L pattern)
  - 各 W1-W4 ship 后版本
  - ASSUMPTIONS B-31 + RESEARCH § 10
- **acceptance_criteria**:
  - `wc -l tests/integration/phase-2.4-e2e.test.ts` ≤ 120 (~100L target)
  - `corepack pnpm test -- tests/integration/phase-2.4-e2e.test.ts` 6 Link 全 pass
- **decision_source**: B-31 + Phase 2.3 T5.3 sister + RESEARCH § 10

---

## Wave 6 — ship + v0.2.0 4/4 close (F7 + F8)

### T6.1 — ADR 0013 finalize 9 章节 (Wave 0 draft → Wave 6 详细 fill) + accepted

- **files_modified**: `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md`(MODIFY,T0.2 sketch → finalize 详细 fill 9 章节)
- **action**:
  1. 每章节详细 fill (T0.2 sketch → finalize),沿袭 Phase 2.3 ADR 0012 模板模式:
     - § 1 doctor 5 check MIN scope (B-01~B-07) — 含 R2 critical finding "152L not 38L" rationale + 5% 超 hard limit 容忍 + origin-check helper sister-share
     - § 2 EE-4 plan-review-schema.yaml 4 维 SSOT (B-08~B-15) — 含 yaml-only rationale + walker pattern + spike T2.0 outcome reference + project-local agent override
     - § 3 EE-4 BLOCKER auto-rerun DOWN-SCOPE (B-12 / O1) — 含 manual rerun rationale + auto-spawn v0.3.0 feature 推迟说明
     - § 4 dashboard C 路径 3 子功能 FULL absorb (B-18~B-22) — 含 Wave 3 3 sub-task 并行 rationale + cc-hook-add 第 7 method
     - § 5 SSE 替 WebSocket rationale (B-23 / D2.4-9) — 含 zero-dep + 单向 push + EventSource native reconnect 评估
     - § 6 cc-hook 3 处 schema enum 加 (B-22) — InstallType + TypeEnum + install.method (R2 critical finding 修正 KICKOFF wording)
     - § 7 README CI counter gate B 路径 (B-16 + B-17) — 含 H3 root-cause-class 第 3 次复发根治
     - § 8 audit 完整版扩 (B-28 + B-29) — 扩 audit.ts NOT NEW + helper split + Win sentinel 5 fixture MIN
     - § 9 Wave 0 backlog 5 项一次根治 (B-32 + B-33) — schemaVersion long-tail land scripts/check-provenance.mjs as 1 consumer (honest baseline 沿袭)
  2. Status 从 Draft 改 Accepted
  3. 加 A7 Conservation section (verify ADR 0001-0012 main body 0 diff per T6.2)
  4. 加 References section (含 phase-2.4 全文档 + intel L74-82 + L286 + dashboard-handoff § 3 + ROADMAP L113-115)
- **read_first**:
  - `docs/adr/0012-*.md`(by Read,Phase 2.3 final accepted ADR 模板)
  - 本 task_plan.md 顶部 Resolved blocks (T0.1 + T2.0 + T3.4)
  - ASSUMPTIONS § B 全 43 lock
- **acceptance_criteria**:
  - `grep -E "^### [1-9]\\. " docs/adr/<actual-NNNN>-*.md | wc -l` == 9 (9 章节)
  - `grep "Status: Accepted" docs/adr/<actual-NNNN>-*.md` 命中
  - `wc -l docs/adr/<actual-NNNN>-*.md` ≤ 500 (沿袭 Phase 2.3 ADR 0012 详细 fill 行数)
- **decision_source**: B-35 + B-36 + KICKOFF § 3 Hard Constraint #2

### T6.2 — ci.yml A7 step iter 1-12 → 1-0013 + ADR 0001-0012 main body 0 diff verify

- **files_modified**: `.github/workflows/ci.yml`(MODIFY A7 step iter range)
- **action**:
  1. 找 `ci.yml` A7 step (Phase 2.3 ship iter 1-12)
  2. iter 1-12 → 1-0013(预期 1-13 但实占,以 T0.1 outcome 为准)
  3. Run A7 verify locally: `for n in $(seq -w 1 12); do git diff adr-<previous-baseline>..HEAD -- "docs/adr/${n}-*.md" | wc -l; done` 必全 0
  4. `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 0 diff verify
- **read_first**:
  - `.github/workflows/ci.yml` A7 step(by Read,Phase 2.3 ship iter 1-12 范围)
  - ASSUMPTIONS B-37
- **acceptance_criteria**:
  - `grep -E "iter.*1-0013\|iter.*1-0013" .github/workflows/ci.yml | wc -l` ≥ 1 (实占 N)
  - Local A7 verify: `for n in $(seq -w 1 12); do git diff adr-0012-accepted..HEAD -- "docs/adr/${n}-*.md"; done` 全 empty
  - CI Wave 6 push A7 step 全绿
- **decision_source**: B-37 + KICKOFF § 3 Hard Constraint #10

### T6.3 — STATE.md 续编 + RETROSPECTIVE.md milestone retrospective

- **files_modified**: `.planning/STATE.md`(MODIFY 续编 Phase 2.4 SHIPPED) + `.planning/RETROSPECTIVE.md`(MODIFY 加 v0.2.0 milestone retrospective)
- **action**:
  1. `.planning/STATE.md` 加 `## Phase 2.4 SHIPPED <date>` 节 — 含 ship marker + 5 大主题 ship 摘要 + 3 tag refs + v0.3.0 启动 prereq 列表 (T3 backlog + plan-feature workflow + checkpoint cadence + gstack 前缀探测 + EE-4 auto-spawn rerun)
  2. `.planning/RETROSPECTIVE.md` 加 v0.2.0 alpha cycle close milestone retrospective 节 — 含:
     - What worked: doctor MIN 5 check ship + EE-4 plan-review-schema yaml-only + dashboard C 路径 3 子并行 + SSE 替 WebSocket
     - What was inefficient: dashboard.mjs 27% 超软限 trade-off + EE-4 BLOCKER down-scope (auto-spawn 推 v0.3.0)
     - Key lessons: R2 critical finding 6 项 absorb 模式 (KICKOFF stale 数字 → RESEARCH 实测校正) + sister-share helper pattern (origin-check) + project-local agent override pattern
     - Patterns established: Wave 0 prereq 一次根治 (5 phase 沿袭) + ADR 编号实占 sed-replace discipline + Win sentinel `if: runner.os == 'Windows'` pattern
     - Deferred items review tracker pass (Phase 2.3 T0.8 cadence + Phase 2.4 T0.5 强化)
- **read_first**:
  - `.planning/STATE.md`(by Read,Phase 2.3 ship 后版本)
  - `.planning/RETROSPECTIVE.md`(by Read,Phase 2.3 ship milestone retrospective 模板)
  - ASSUMPTIONS § A + § B + § C
- **acceptance_criteria**:
  - `grep -E "Phase 2\\.4 SHIPPED" .planning/STATE.md | wc -l` ≥ 1
  - `grep -E "v0\\.2\\.0 alpha cycle close" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
  - `grep -E "v0\\.3\\.0 启动 prereq" .planning/STATE.md | wc -l` ≥ 1 (T3 backlog enumeration)
- **decision_source**: B-32 + Phase 2.3 T6.3 sister + KICKOFF § 1.2 F8

### T6.4 — v0.2.0 milestone close — 3 tag + archive (B-42 + B-43, 沿袭 v0.1.0 close 模式)

- **files_modified**: `.planning/milestones/v0.2.0-ROADMAP.md`(NEW snapshot) + `.planning/milestones/v0.2.0-REQUIREMENTS.md`(NEW snapshot) + `.planning/v0.2.0-MILESTONE-AUDIT.md`(NEW) + git tag (3 个)
- **action**:
  1. **Pre-flight tag check** (R12 mitigation + **S3 plan-check fix — fallback decision tree**): `git tag --list v0.2.0` — 决策树:
     - **(a) `v0.2.0` tag 不存** → proceed create `v0.2.0` (主 path, 实测 `git tag --list 'v0.2.0*'` = 3 alpha tag 不命中 v0.2.0 大 tag, expect this path)
     - **(b) `v0.2.0` tag 已存** → fallback 决断 (executor judgment based on existing tag context):
       - (b.1) tag 是历史误占 (commit hash 不是 Phase 2.4 ship) → `v0.2.0-final` (沿袭 Phase 1.5 v0.1.0 close 模板)
       - (b.2) tag 是 extension category v0.2.0 占 → `v0.2.0-extension` differentiator
       - (b.3) 复杂场景 → `git tag -d v0.2.0` (local) + `git push --delete origin v0.2.0` + re-create (需 user 显式 confirm — destructive op, planner Wave 6 决, NOT auto)
     - Resolved (T6.4) block 顶部记录 fallback 决断 (Wave 6 T6.4 fill)
     - Phase 1.5 v0.1.0 close sister 模板 — v0.1.0 tag 历史 ship 时未踩 fallback (proceed create path 走通), Phase 2.4 v0.2.0 expect 同 (a) path
  2. Snapshot `.planning/ROADMAP.md` § v0.2.0 节 → `.planning/milestones/v0.2.0-ROADMAP.md` (沿袭 `.planning/milestones/v0.1.0-ROADMAP.md` 模板)
  3. Snapshot `.planning/REQUIREMENTS.md` v0.2.0 scope → `.planning/milestones/v0.2.0-REQUIREMENTS.md`
  4. 创建 `.planning/v0.2.0-MILESTONE-AUDIT.md` — 含:
     - v0.2.0 4 phase ship 路径表 (Phase 2.1 + 2.2 + 2.3 + 2.4 — ship date + commit + 主要交付 + ADR + tag)
     - cumulative metric: 总 atomic task ~120 / 总 commit count / sister review 闭环数 / Karpathy hard limit 遵守度
     - milestone-level lessons:Wave 0 prereq 一次根治模式成熟 + R2 critical finding sister precedent + ADR errata 模式 + sister-share helper pattern
     - v0.3.0 启动 prereq 列表 (T3 backlog + plan-feature workflow + checkpoint + 路由命中率验收 + gstack 前缀探测 + EE-4 auto-spawn rerun + Task Session 复用完整版)
     - 沿袭 `.planning/v0.1.0-MILESTONE-AUDIT.md` 模板
  5. Git tag 3 个 (per S3 plan-check fix fallback decision tree, step 1 outcome 决):
     ```bash
     git tag adr-0013-accepted
     git tag v0.2.0-alpha.4-doctor
     # S3 fallback decision tree apply — choose ONE based on step 1 outcome:
     git tag v0.2.0  # (a) 主 path — v0.2.0 大里程碑, v0.2.0 alpha cycle 4/4 close
     # OR fallback:
     # git tag v0.2.0-final         # (b.1) 历史误占 fallback
     # git tag v0.2.0-extension     # (b.2) extension category differentiator
     # (b.3 destructive delete+re-create 需 user 显式 confirm, NOT in this script)
     ```
- **read_first**:
  - `.planning/v0.1.0-MILESTONE-AUDIT.md`(by Read,Phase 1.5 v0.1.0 close 模板)
  - `.planning/milestones/v0.1.0-{ROADMAP,REQUIREMENTS}.md`(by Read,archive 模板)
  - `.planning/ROADMAP.md` § v0.2.0(by Read,snapshot 源)
  - ASSUMPTIONS B-42 + B-43 + R12
- **acceptance_criteria**:
  - `ls .planning/milestones/v0.2.0-ROADMAP.md .planning/milestones/v0.2.0-REQUIREMENTS.md` 全命中
  - `ls .planning/v0.2.0-MILESTONE-AUDIT.md` 命中
  - `git tag --list adr-<actual-N>-accepted v0.2.0-alpha.4-doctor v0.2.0 2>&1 | wc -l` ≥ 3 (3 tag 全存)
  - `wc -l .planning/v0.2.0-MILESTONE-AUDIT.md` ≥ 80 (沿袭 v0.1.0 audit 文档行数)
- **decision_source**: B-42 + B-43 + Phase 1.5 v0.1.0 close sister + R12

### T6.5 — ROADMAP § v0.2.0 4 phase 全 ✅ + v0.3.0 启动 prereq 列表

- **files_modified**: `.planning/ROADMAP.md`(MODIFY § v0.2.0 全 4 phase 打 ✅ + v0.3.0 启动 prereq 节扩)
- **action**:
  1. `.planning/ROADMAP.md` § v0.2.0 全 4 phase (Phase 2.1 + 2.2 + 2.3 + 2.4) 全打 ✅ SHIPPED marker
  2. § v0.3.0 节加启动 prereq 详细列表 — T3 backlog + plan-feature workflow + checkpoint + 路由命中率验收 + gstack 前缀探测 + EE-4 auto-spawn rerun (Phase 2.4 down-scope per B-12) + Task Session 复用完整版 (Phase 2.3 deferred)
  3. § v0.3.0 加 cycle goal note (v0.2.0 ship 起 — sub-task loop + extension installers infra ready,v0.3.0 = plan-feature workflow + checkpoint + 100+ sample × multi-model 验收 + dashboard 多项目跨 phase 历史 view)
- **read_first**:
  - `.planning/ROADMAP.md`(by Read,§ v0.2.0 现状 + § v0.3.0 现 sketch)
  - `.planning/v0.2.0-MILESTONE-AUDIT.md`(by Read,T6.4 ship 后 v0.3.0 启动 prereq 列表)
  - ASSUMPTIONS B-42 + B-43
- **acceptance_criteria**:
  - `grep -E "Phase 2\\.4.*SHIPPED\|Phase 2\\.4.*✅" .planning/ROADMAP.md | wc -l` ≥ 1
  - `grep -cE "Phase 2\\.[1-4].*(SHIPPED|✅)" .planning/ROADMAP.md` ≥ 4 (4 phase 全 ✅)
  - `grep -E "v0\\.3\\.0 启动 prereq" .planning/ROADMAP.md | wc -l` ≥ 1
- **decision_source**: B-42 + B-43 + KICKOFF § 1.2 F8

---

*Phase 2.4 task_plan.md complete — 29 atomic tasks across 7 Waves (W0:6 / W1:3 / W2:5 / W3:4 / W4:3 / W5:3 / W6:5);全 task 含 `wc -l` / regex grep / TypeScript compile / vitest pass / CI step grep verify acceptance criterion;沿袭 Phase 2.3 task_plan.md atomic sub-task structure;6 R2 critical finding absorb 进 task body (T0.3 README pre-flight + T1.2 doctor.ts 152L baseline + T4.1 audit.ts 125L baseline + T3.2 SSE not WebSocket + T2.0 EE-4 baseline spike + T2.3 manual rerun anchor);7 open question O1-O7 全 surface in task body (O1 manual rerun anchor T2.3 + O2 T3.4 fallback gate + O3 T2.0 spike + O4 hook_type MIN scope T3.1 implicit + O5 mock subagent T4.3 + O6 SSE 不双轨 T3.2 + O7 auto-init T3.3);ADR `0013` placeholder 全文使用 T0.1 sed-replace discipline 沿袭 Phase 2.1 + Phase 2.3 sister precedent。*
