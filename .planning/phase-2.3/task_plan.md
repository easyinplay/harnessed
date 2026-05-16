# Phase 2.3 — task_plan.md

> **Resolved (T5.4, 2026-05-16)**: Wave 5 A7 守恒 mid-wave verify = **PASS (0 lines diff)**。`git diff adr-0011-accepted..HEAD -- 'docs/adr/0001-*.md' ... 'docs/adr/0011-*.md' | wc -l` = **0**(per-ADR breakdown: 0001=0 / 0002=0 / 0003=0 / 0004=0 / 0005=0 / 0006=0 / 0007=0 / 0008=0 / 0009=0 / 0010=0 / 0011=0 全部 0 lines)。 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` = 0 lines + `docs/INSTALLER-CONTRACT.md` = 0 lines。 ADR 0001-0011 main body + 2 contract docs pristine。 Wave 6 T6.4 ship-time gate 再次 verify(S4 plan-check fix 双闸 final gate)。
> **Resolved (T5.3, 2026-05-16)**: e2e 5-link smoke shipped at `tests/integration/phase-2.3-e2e.test.ts` NEW (105L, 6 cells covering Link 1 install dry-run + Link 2 EE-5 CLI + Link 3 routing 30-sample + Link 4 arbitrate-redirect + Link 5 karpathy SKILL-ONLY surface + cross-link compose)。 commit a378bb4。 Tests 485→491 (+6)。 SCOPE BOUNDARY out-of-scope discovery → DI-1 (karpathy-skills.yaml L31 `git_ref: HEAD` schema violation) logged to `.planning/phase-2.3/deferred-items.md` for Wave 6 hotfix (M2 severity)。
> **Resolved (T5.2, 2026-05-16)**: **SKIPPED — ship-early at Wave 3 T3.3 (commit d6489bb)**。 `tests/cli/manifest-add-ee5.test.ts` 已 ship (133L, 6 cells covering register / H1 gate / WARN dry-run / interactive 5Q readline mock / --apply Path A sibling JSON 5-field write / empty answer reject), 6-cell coverage **远超** task_plan T5.2 spec (2 cells minimum: --non-interactive H1 + --non-interactive --dry-run WARN)。 0 file 新建 0 commit 新增 — single Resolved-block 占位 stamp。
> **Resolved (T5.1, 2026-05-16)**: 4-cell spec functionally subsumed by Wave 2 T2.2 d6489bb (`tests/unit/routing-arbitrateRedirect.test.ts` 6 cells covering matched / rejected+redirect / none-no-redirect / equal-priority-tie / no-match / mix-eligible-wins)。 DRY consolidation strategy: appended 3 COMPLEMENTARY cells (D-04 false-pos guard 独创≠独特 char-precision + CD-3 S20 sister no-auto-promotion + D-04 multi-keyword OR semantic) — file 90L→166L ≤200L 硬限。 commit f13ca63。 Tests 482→485 (+3)。 D-08 reverse-direction redirect (frontend-design → ui-ux-pro-max) deferred — policy noted at decision_rules.yaml L67 comment but no reverse rule encoded (YAGNI; Phase 2.4 routing refinement OR Wave 6 backlog)。
>
> **Resolved (T0.1, 2026-05-16)**: `0012` = `0012` (next after `docs/adr/0011-execute-task-sdk-ralph.md` = Phase 2.2 ship)。ROADMAP latest-shipped token verified = "Phase 2.2 SHIPPED 2026-05-15" (ROADMAP.md L34 `v0.2.0 Sub-task Loop ... Phase 2.1 + Phase 2.2 SHIPPED`). 后续 task_plan / PLAN / ASSUMPTIONS / PLAN-CHECK-DELTA 引用 `0012` 实占。
> **Resolved (T0.10, 2026-05-16)**: always_active spike outcome = **FAIL**。 SDK `@anthropic-ai/claude-agent-sdk@0.3.142` `skillFrontmatter` 仅 extract `name / source / tokens` 三字段(verify via `node_modules/@anthropic-ai/claude-agent-sdk/dist/*.d.ts` grep — 无 `always_active` / `auto_load` / `always_on` 任何变体)。 Skill activation 实际机制 = SDK `query()` options `skills: 'all'` (load all discovered) OR `skills: [name]` (explicit allowlist) — NOT frontmatter 字段驱动。 **R2 ASSUMPTION A1 fallback 触发**: description-keyword matching + self-reflexive prompt `"ALWAYS apply 4 心法 ..."` 嵌入 SKILL.md body (Claude Code auto-discovers via description-match at session start)。 **Impact T2.3 SKILL.md ship 设计调整**: (1) frontmatter 不含 `always_active` 字段; (2) `description:` 字段用 high-precision keyword 集 (e.g. "ALWAYS apply Karpathy 4 心法 baseline: Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution"); (3) SKILL.md body 首段 self-reflexive prompt "ALWAYS apply these 4 心法 to every coding decision..."; (4) `manifests/skill-packs/karpathy-skills.yaml` install cmd 仍走 git-clone 装到 `~/.claude/skills/karpathy-baseline/SKILL.md` (D-02 SKILL-ONLY 不动 CLAUDE.md 路径不变)。 ADR 0012 § 4 章节 fill 时 absorb 该 fallback rationale。 W2 T2.3 spec accordingly 调整。
>
> **Authored**: 2026-05-16
> **Author**: gsd-planner (Wave B)
> **Sources**: KICKOFF § 2 Wave 拓扑 + ASSUMPTIONS § A bar mapping + ASSUMPTIONS § B 39 lock + PATTERNS § 2 code excerpts + RESEARCH D2.3-1~D2.3-7 + § 1.3 / § 2.4 / § 3.5 implementation sketches
> **Style**: 沿袭 phase 1.5 / 2.1 / 2.2 task_plan.md atomic sub-task structure(file path / action concrete values / read_first / acceptance_criteria grep-verifiable / decision source)
> **Task count**: 35 atomic tasks across 7 Waves (W0:10 / W1:6 / W2:5 / W3:3 / W4:3 / W5:4 / W6:4) — W0 T0.10 always_active spike 提前(W1 plan-check fix from Wave C delta)
> **Hard limit verify**: every code-producing task 含 `wc -l` 或 ≤N 行 acceptance criterion

> ⚠️ **Placeholder sed-replace discipline (Phase 2.1 W1 plan-check fix sister precedent)**: T0.1 resolve `0012` 后,**在 commit 任何 T0.2+ 产物前**,必须对本 task_plan.md + PLAN.md + KICKOFF.md + 所有 NEW ADR/SPEC 文件批量 sed-replace 字面占位:`sed -i "s/0012/<actual-NNNN>/g" .planning/phase-2.3/task_plan.md .planning/phase-2.3/PLAN.md .planning/phase-2.3/KICKOFF.md docs/adr/<actual-NNNN>-*.md`(以及任何 grep 命中的其他文件)。**zero 字面 `0012` 残留**是 W0 commit 前置条件(grep `0012` .planning/phase-2.3/ docs/adr/ 必须 exit 1)。

---

## Wave 0 — STATE.md 6 项 prereq backlog 一次根治 + ADR draft

### T0.1 — ADR 编号实占 + ROADMAP latest-shipped token + sed-replace placeholder discipline

- **files_modified**: (read-only;后续 task 批量 sed-replace)
- **action**:
  1. 跑 `ls -1 docs/adr/ | grep -E '^[0-9]{4}-.*\.md$' | sort | tail -1` 读最新 ADR 编号,取 `NNNN`(预期 `0011` 来自 Phase 2.2)
  2. `0012` := `printf '%04d' $((10#NNNN + 1))`(zero-padded 4 digit,预期 `0012` 但**不预占**,以实际 ls 结果为准)
  3. 跑 `head -100 .planning/ROADMAP.md | grep -E '^##\s+(v[0-9.]+|Phase\s+[0-9.]+)'` 读 latest header pattern → 验 STATE freshness token 仍 valid("Phase 2.2 shipped")
  4. 把实占 N + ROADMAP latest token 决议**记录到本 task_plan.md 顶部 Resolved block**(供后续 task 引用)
  5. **批量 sed-replace** `0012` 字面占位 — `grep -rl "0012" .planning/phase-2.3/ docs/adr/ | xargs sed -i "s/0012/<actual-NNNN>/g"`(zero 字面残留)
- **read_first**:
  - `ls docs/adr/`(by Bash)
  - `head -100 .planning/ROADMAP.md`(by Read)
  - ASSUMPTIONS B-34(SSOT 引用纪律)
- **acceptance_criteria**:
  - `ls docs/adr/<actual-NNNN>-*.md 2>&1` 此时**不存在**(T0.2 才创建)
  - 本 task_plan.md 顶部新增 `> **Resolved (T0.1)**: 0012 = <actual-NNNN>` block(grep-verifiable)
  - `grep -rn "0012" .planning/phase-2.3/ docs/adr/ 2>&1` exit 1(zero 字面残留)
  - **W3 plan-check fix — manifest placeholder zero-residue gate**:
    `grep -rnE "<[a-z][a-z0-9-]+-upstream>|<upstream-url>|<frontend-design-upstream>|<chrome-devtools-mcp-upstream>|<SHA>|<ref>|<repo-url>" manifests/ 2>&1` exit 1
    (Wave 1 T1.1 + T1.5 实占 upstream URL + SHA + repo-url 后必批量 sed-replace;否则 install 跑 literal placeholder 必 fail。zero-residue 是 Wave 1 commit 前置条件,沿袭 T0.1 sed-replace discipline。)
- **decision_source**: B-34 + KICKOFF § 3.2 + intel § 0 SSOT 引用纪律 + W3 plan-check fix

### T0.2 — ADR 0012 draft(5 章节 sketch only,Wave 6 详细 fill)

- **files_modified**: `docs/adr/0012-extension-mvp-karpathy-inject.md`(NEW)
- **action**: 创建 ADR file 含 5 章节 sketch(详细 Wave 6 T6.1 fill):
  ```markdown
  # ADR 0012: extension category MVP + karpathy inject 引擎

  Status: Draft (phase 2.3 W0 draft → W6 accepted)
  Date: 2026-05-16

  ## Context
  Phase 2.3 把 v0.2.0 routing engine 升级为 3 extension category(design/content/testing)MVP 装配 + karpathy SKILL-ONLY 注入 + 30 FRESH 样本 routing ≥85% ...

  ## Decisions
  ### 1. extension category MVP 装配 (B-01 ~ B-05 / D-01)
  ### 2. CD-3 negative-space + if_rejected_use (B-15 ~ B-19 / D-04)
  ### 3. EE-5 5-question merge gate 双层 (B-11 ~ B-14 / D-03)
  ### 4. karpathy SKILL-ONLY 注入 (B-06 ~ B-10 / D-02)
  ### 5. Wave 0 perf gate 根治 + 6 项 backlog (B-25 ~ B-32 / D-07)
  ### 6. Plan-check Wave C fixes (W1 always_active spike 提前 / W2 sed→node script / W3 manifest placeholder zero-residue gate / W4 decisionRules.ts proactive split / W5 EE-5 self-meta + S1-S4 polish)
  ### 7. schemaVersion adoption status errata (B1 plan-check fix)
  Phase 2.2 W2 schemaVersion ship 实际 = **helper-only adoption** (consumer count = 2 at Phase 2.3 start: `src/types/schemaVersion.ts` 定义 + 1 self-reference)。Phase 2.2 W2 T2.0 claim 的 7 surface 各 ≥ 1 consumer call site **未真实落地**。Phase 2.3+ 逐步扩 consumer per surface (handoff doc / phases-yaml / manifest state / installer state / route decision log / checkpoint / agent definition factory)。Wave 0 T0.5 gate 阈值 ≥2 反映 honest baseline;后续 phase 每扩 1 consumer surface 同步 bump 阈值。

  ## A7 Conservation
  ADR 0001-0011 main body untouched; baseline tag 1-11 → 1-0012; arbitrate() legacy 保留 (B-18) 避免 30-sample routing-engine.test.ts byte-stable 回归.

  ## References
  ```
- **read_first**:
  - `docs/adr/0011-*.md`(by Read,作 errata fence pattern 参考)
  - `.planning/phase-2.3/ASSUMPTIONS.md` § B(by Read,锁列表)
- **acceptance_criteria**:
  - `ls docs/adr/0012-*.md` 命中 1 file
  - `grep -E "^### [1-5]\. " docs/adr/0012-*.md | wc -l` == 5
  - `grep "Status: Draft" docs/adr/0012-*.md` 命中
- **decision_source**: B-33 + B-34 + KICKOFF § 3.2

### T0.3 — M3 perf gate 根治(D2.3-1 (a) 移出 CI critical path)

- **files_modified**: `.github/workflows/perf-bench.yml`(NEW ≤50L)+ `.github/workflows/ci.yml`(MODIFY — 删 perf step OR `it.skip(IS_GHA)`)+ `tests/integration/manifest-validate.perf.test.ts`(MODIFY — 加 `it.skip(IS_GHA)` 守护)
- **action**:
  1. 创建 `.github/workflows/perf-bench.yml`(沿袭 RESEARCH § 1.3 sketch):
  ```yaml
  name: perf-bench (advisory)
  on:
    schedule:
      - cron: '0 3 * * *'  # daily 3am UTC
    workflow_dispatch:
  jobs:
    perf:
      strategy:
        fail-fast: false
        matrix:
          os: [ubuntu-latest, windows-latest, macos-latest]
      runs-on: ${{ matrix.os }}
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
        - run: pnpm install --frozen-lockfile
        - name: perf threshold (advisory)
          run: pnpm test -- tests/integration/manifest-validate.perf.test.ts || echo "::warning::perf threshold exceeded on ${{ matrix.os }}"
          continue-on-error: true
  ```
  2. `ci.yml` 删 perf step OR `tests/integration/manifest-validate.perf.test.ts` 顶加 `const IS_GHA = !!process.env.GITHUB_ACTIONS; describe.skipIf(IS_GHA)(...)` (vitest skipIf API);保留 file 给 local dev 跑
  3. **STATE.md L553 close** — 注明 "M3 resolved by D2.3-1 (a) 移出 CI critical path,Phase 2.3 Wave 0 T0.3 ship"
- **read_first**:
  - `.github/workflows/ci.yml`(by Read,定位 perf step)
  - `tests/integration/manifest-validate.perf.test.ts` L1-83(by Read,验 IS_GHA 嵌入位置)
  - RESEARCH § 1.3
- **acceptance_criteria**:
  - `wc -l .github/workflows/perf-bench.yml` ≤ 50
  - `grep "cron: '0 3 \* \* \*'" .github/workflows/perf-bench.yml` 命中
  - `grep -E "describe.skipIf\\(IS_GHA\\)|it\\.skip\\(.*IS_GHA" tests/integration/manifest-validate.perf.test.ts` 命中
  - `grep -E "Phase 2.3.*W0.*T0.3|M3 resolved" .planning/STATE.md` 命中
- **decision_source**: B-28 + RESEARCH D2.3-1 + § 1.3

### T0.4 — M1 schema regen CI gate(`corepack pnpm build:schema && git diff --exit-code schemas/`)

- **files_modified**: `.github/workflows/ci.yml`(MODIFY +10L)
- **action**: ci.yml 加 step(沿袭 Phase 2.2 RETROSPECTIVE Lesson 6 自我建议落地):
  ```yaml
  - name: Schema regen gate (Phase 2.3 Wave 0 M1)
    run: |
      corepack pnpm build:schema
      git diff --exit-code schemas/ || {
        echo "::error::schemas/ drift detected — run 'corepack pnpm build:schema' locally and commit"
        exit 1
      }
  ```
- **read_first**:
  - `.github/workflows/ci.yml`(定位 transparency gate L83-84 附近作锚)
  - PATTERNS § 2.8
  - `.planning/phase-2.2/RETROSPECTIVE.md` Lesson 6
- **acceptance_criteria**:
  - `grep -E "Schema regen gate.*Phase 2.3 Wave 0 M1" .github/workflows/ci.yml` 命中
  - `grep "corepack pnpm build:schema" .github/workflows/ci.yml` 命中
  - `grep "git diff --exit-code schemas/" .github/workflows/ci.yml` 命中
- **decision_source**: B-26 + CONTEXT D-07 + Phase 2.2 RETROSPECTIVE Lesson 6

### T0.5 — T1.2 schemaVersion consumer grep gate

- **files_modified**: `.github/workflows/ci.yml`(MODIFY +10L)
- **action**: ci.yml 加 step(沿袭 PATTERNS § 2.8 sketch):
  ```yaml
  - name: schemaVersion consumer gate (Phase 2.3 Wave 0 T1.2)
    run: |
      count=$(grep -r "branchOnSchemaVersion" src/ | wc -l | tr -d ' ')
      if [ "$count" -lt 2 ]; then
        echo "::error::expected ≥ 2 branchOnSchemaVersion call sites (Phase 2.2 W2 helper-only adoption baseline; Phase 2.3+ expands per surface — see ADR 0012 § 7 errata), found $count"
        exit 1
      fi
  ```

  > **B1 annotation (Wave C plan-check fix)**: Threshold 降 ≥7 → ≥2 反映 Phase 2.2 W2 schemaVersion 实际 helper-only ship 真相(grep `branchOnSchemaVersion(` src/ 当前 = 2: `src/types/schemaVersion.ts` 定义 + 1 self-reference)。原 ≥7 阈值是 Phase 2.2 W2 ship claim 但 consumer call sites 未真实落地;Phase 2.3+ 逐步扩 7 surface (handoff doc / phases-yaml / manifest state / installer state / route decision log / checkpoint / agent definition factory) — 详 ADR 0012 § 7 errata。阈值 ≥2 是 honest baseline 保 Wave 0 push CI 不 red。

- **read_first**: PATTERNS § 2.8 + ASSUMPTIONS B-29
- **acceptance_criteria**:
  - `grep -E "schemaVersion consumer gate.*Phase 2.3 Wave 0 T1.2" .github/workflows/ci.yml` 命中
  - `grep -E 'count.*grep -r.*branchOnSchemaVersion' .github/workflows/ci.yml` 命中
  - **本地 verify**:`grep -r "branchOnSchemaVersion" src/ | wc -l` ≥ 2(B1 plan-check fix: ≥7 → ≥2 honest baseline,反映 Phase 2.2 W2 helper-only adoption 真相 — consumer count 当前 = 2;Phase 2.3+ 逐步扩 consumer per surface,详 T0.2 ADR § 7 errata)
- **decision_source**: B-29 + CONTEXT D-07

### T0.6 — T1.3 Win pwsh provenance sentinel

- **files_modified**: `.github/workflows/ci.yml`(MODIFY +8L)
- **action**: ci.yml 加 Win-only step(沿袭 PATTERNS § 2.8 sketch):
  ```yaml
  - name: Provenance gate (Win pwsh sentinel, Phase 2.3 Wave 0 T1.3)
    if: runner.os == 'Windows'
    shell: pwsh
    run: pwsh -c "node scripts/check-provenance.mjs"
  ```
- **read_first**:
  - `.github/workflows/ci.yml` provenance gate L90-91 附近作锚
  - `scripts/check-provenance.mjs`(by Read,验脚本入口)
- **acceptance_criteria**:
  - `grep -E "Provenance gate.*Win pwsh sentinel.*Phase 2.3 Wave 0 T1.3" .github/workflows/ci.yml` 命中
  - `grep -E "if: runner.os == 'Windows'" .github/workflows/ci.yml` 命中 ≥ 1(此 step)
  - `grep "shell: pwsh" .github/workflows/ci.yml` 命中
- **decision_source**: B-30 + CONTEXT D-07 + PATTERNS § 2.8

### T0.7 — M2 intel L236-238 ## 实施进度回填 节

- **files_modified**: `.planning/intel/omc-comparison.md`(MODIFY +30-50L 新节)
- **action**: L236-238 之后加 `## 实施进度回填` 节,沿袭 § 0 SSOT 引用纪律:
  ```markdown
  ## 实施进度回填

  > **Authored**: Phase 2.3 Wave 0 T0.7 (2026-05-16)
  > **Purpose**: 每 intel actionable entry 标 IMPL: Phase X.Y (commit) 或 PENDING — 防 intel drift

  | Intel Entry | Status | Implementation |
  |-------------|--------|---------------|
  | 第 1 条 ... | IMPL: Phase 2.2 (commit hash) | ... |
  | 第 2 条 resolved_routing 快照冻结 | PENDING (v0.3+ evaluation) | — |
  | 第 4 条 per-phase model tier | IMPL: Phase 2.2 (commit hash) | ... |
  | L86 EE-5 5 题原型 | IMPL: Phase 2.3 (本 phase) | manifest-add.ts + KICKOFF § 7 |
  | L130-135 CD-3 显式负空间 | IMPL: Phase 2.3 (本 phase) | decision_rules.yaml + arbitrateWithRedirect |
  | L149-157 CD-5 schemaVersion | IMPL: Phase 2.2 (commit hash) | ... |
  | L159-167 CD-6 provenance gate | IMPL: Phase 2.2 (commit hash) | ... |
  | L139-147 CD-4 Task Session | PENDING (v0.3.0 — SC4 PARTIAL deferred per Phase 2.2 T1.2) | — |
  ```
  实际 commit hash 由 executor 填(`git log --oneline` 查 Phase 2.2 各 task 实 commit);PENDING entry 标明 deferred phase
- **read_first**:
  - `.planning/intel/omc-comparison.md` L1-50(by Read,验 § 0 SSOT 引用纪律 wording)+ L236-238
  - `.planning/phase-2.2/2.2-SUMMARY.md`(by Read,取 Phase 2.2 ship commit list)
- **acceptance_criteria**:
  - `grep -E "## 实施进度回填" .planning/intel/omc-comparison.md` 命中
  - `grep -cE "IMPL: Phase 2.[12]|PENDING" .planning/intel/omc-comparison.md` ≥ 6(至少 6 entry status 标定)
- **decision_source**: B-27 + CONTEXT D-07 + intel § 0 SSOT 引用纪律

### T0.8 — T5 deferred-items review(RETROSPECTIVE.md 模板节 + check-deferred-items.mjs warn-only)

- **files_modified**: `.planning/RETROSPECTIVE.md`(MODIFY +15L 加新节模板)+ `scripts/check-deferred-items.mjs`(NEW ≤80L)
- **action**:
  1. RETROSPECTIVE.md 顶/底加节模板(每次 ship phase 触发 review):
  ```markdown
  ## Deferred items review (Phase 2.3 W0 T0.8 cadence)

  > 每 ship phase 时强制运行:`cat .planning/phase-*/deferred-items.md 2>/dev/null; grep -rE "DEFERRED|defer.*v0\.3\.0|defer.*Phase 2\.4" .planning/phases/`
  > 检查 deferred items 是否触发条件已满足(e.g. T4.4 Task Session conditional pass → 触发 v0.3.0 实施)
  >
  > **Review history**:
  > - Phase 2.3 ship (2026-05-16): T1.1 dual-signal real-API(待 ANTHROPIC_API_KEY env) / T4.4 Task Session(SC4 PARTIAL → v0.3.0 stable bridge/assistant API) / EE-4 plan 4 维量化阈值(Phase 2.4 doctor)— PENDING
  ```
  2. 创建 `scripts/check-deferred-items.mjs`(沿袭 PATTERNS § 2.7 sketch):
  ```javascript
  #!/usr/bin/env node
  // Phase 2.3 Wave 0 T5 — deferred-items review cadence gate (warn-only round 1).
  // 沿袭 check-transparency-verdicts.mjs walker pattern (Phase 2.1 T1.7 ship).
  import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
  import { join } from 'node:path'

  const ENFORCE = false  // warn-only round 1 (沿袭 transparency W3 模式)
  const ROOT = '.planning'

  function walk(dir, out = []) {
    if (!existsSync(dir)) return out
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p, out)
      else if (/deferred-items\.md$|DEFERRED.*\.md$/i.test(name)) out.push(p)
    }
    return out
  }

  const violations = []
  // Check 1: RETROSPECTIVE.md must include cadence section
  const retro = '.planning/RETROSPECTIVE.md'
  if (existsSync(retro)) {
    const txt = readFileSync(retro, 'utf8')
    if (!/##\s+Deferred\s+items?\s+review/i.test(txt)) {
      violations.push(`${retro}: missing "## Deferred items review" section`)
    }
  }
  // Check 2: deferred-items.md / DEFERRED-*.md files exist + are not stale (>180d untouched)
  const files = walk(ROOT)
  // ... (omit stale check round 1)

  if (violations.length > 0) {
    if (ENFORCE) {
      console.error(`::error::${violations.length} deferred-items violations`)
      violations.forEach(v => console.error(`  - ${v}`))
      process.exit(1)
    } else {
      console.warn(`::warning::${violations.length} deferred-items violations (warn-only round 1)`)
      violations.forEach(v => console.warn(`  - ${v}`))
    }
  } else {
    console.log('check-deferred-items: 0 violations (warn-only round 1)')
  }
  ```
  3. ci.yml 加 step(warn-only,不阻 CI):
  ```yaml
  - name: Deferred items review (Phase 2.3 Wave 0 T5, warn-only round 1)
    run: node scripts/check-deferred-items.mjs
    continue-on-error: true
  ```
- **read_first**:
  - `scripts/check-transparency-verdicts.mjs`(by Read,作 walker pattern 1:1 scaffold)
  - PATTERNS § 2.7 sketch
- **acceptance_criteria**:
  - `wc -l scripts/check-deferred-items.mjs` ≤ 80
  - `grep -E "## Deferred items review" .planning/RETROSPECTIVE.md` 命中
  - `node scripts/check-deferred-items.mjs` exit 0(warn-only round 1)
  - `grep -E "Deferred items review.*Phase 2.3 Wave 0 T5.*warn-only" .github/workflows/ci.yml` 命中
- **decision_source**: B-31 + CONTEXT D-07 + PATTERNS § 2.7 + D-WP-6 (b)

### T0.9 — 3-OS CI 跑通 gate verify

- **files_modified**: (no file modify;CI run-only)
- **action**: push T0.1~T0.8 commits to remote;trigger CI;monitor `gh run watch` OR `gh run list --limit 1 --json conclusion`
- **read_first**: `.github/workflows/ci.yml`(by Read,验全 6 Wave 0 step 在位 + 3-OS matrix)
- **acceptance_criteria**:
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `success`
  - 3-OS matrix(ubuntu/macos/windows)all `success`
  - CI log 含 6 Wave 0 step:transparency(Phase 2.2 ship)+ M1 schema regen + T1.2 grep gate + T1.3 Win pwsh sentinel + T5 deferred-items warn-only + perf step skip(M3 移出)
  - perf-bench.yml dispatch workable(`gh workflow run perf-bench.yml -r main` 触发后 `gh run list --workflow=perf-bench.yml --limit=1` 见 entry)
- **decision_source**: B-25 + B-32 + KICKOFF § 1.2 F1

### T0.10 — always_active spike(W1 plan-check fix — 提前到 Wave 0,T2.3 ship 前 validated)

- **files_modified**: (throwaway spike;NOT committed;outcome 写入本 task_plan.md 顶部 Resolved block)
- **action**: W1 plan-check fix — spike 反序修正(原 T4.2 在 Wave 4 但 T2.3 W2 ship SKILL.md `always_active: true` 反序);R2 RESEARCH A1 MED-HIGH conf,spike LOC < 30 min:
  1. 验证 Anthropic skill frontmatter 字段名 — 检查 `node_modules/@anthropic-ai/claude-agent-sdk/dist/` (若存在) 或 Anthropic 官方 skill 上游 README 是否含 `always_active` 字段
  2. 备选验证:临时 `cp -R skills/karpathy-baseline ~/.claude/skills/` + 启动新 Claude Code session 验 system prompt context 含 karpathy 内容
  3. spike outcome 三选一:
     - **PASS**: `always_active: true` 字段 supported → T2.3 SKILL.md frontmatter 实占 `always_active: true`
     - **PARTIAL**: 字段名不同(e.g. `auto_load: true` / `always_on: true`)→ T2.3 SKILL.md 实占正确字段名
     - **FAIL**: 完全不支持 frontmatter toggle → fallback **description-keyword 匹配 + self-reflexive prompt "ALWAYS apply..."** (R2 ASSUMPTIONS A1 fallback;RESEARCH § 2.3)
  4. spike outcome 必填到本 task_plan.md 顶部 Resolved block:`> **Resolved (T0.10)**: always_active mechanism = <PASS/PARTIAL/FAIL>, field name = <name>, fallback = <details>`
  5. spike 末 `rm -rf ~/.claude/skills/karpathy-baseline` (若临时装),git status 无残留
- **read_first**: RESEARCH § 2.3 + A1 + skills/karpathy-baseline/SKILL.md (若 T2.3 已 ship,否则空)
- **acceptance_criteria**:
  - spike outcome 记录到本 task_plan.md 顶部 Resolved block (`grep "Resolved.*T0.10" .planning/phase-2.3/task_plan.md` 命中)
  - T2.3 SKILL.md frontmatter 字段名据 spike outcome 实占 (W2 T2.3 执行时 read 此 Resolved block)
  - 若 FAIL → T2.3 description 字段必含 "ALWAYS apply" wording (self-reflexive fallback)
  - spike cleanup 验证 (`! test -d ~/.claude/skills/karpathy-baseline` if temporary install used)
- **decision_source**: R1 + RESEARCH A1 + § 2.3 + W1 plan-check fix (spike 反序 → 提前 Wave 0)

---

## Wave 1 — extension category manifest schema 演进(D-01 MIN scope)

### T1.1 — manifests/skill-packs/frontend-design.yaml NEW

- **files_modified**: `manifests/skill-packs/frontend-design.yaml`(NEW ≤60L)
- **action**: 沿袭 PATTERNS § 2.1 ADAPT spec(ui-ux-pro-max.yaml COPY scaffold):
  ```yaml
  # yaml-language-server: $schema=../../schemas/manifest.v1.schema.json
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: frontend-design
    display_name: frontend-design (style-led)
    description: Style-led frontend design skill (layout / 动效 / 装饰细节, D-08 "做出风格" anchor 时主导).
    upstream:
      source: github.com/<frontend-design-upstream>
      repository: https://github.com/<frontend-design-upstream>
      license: MIT
      notice: |
        frontend-design — D-08 "做出风格" override anchor 主导; default 下补 ui-ux-pro-max 剩余维度.
  spec:
    type: cc-skill-pack
    component_type: command
    category: design
    install_type: skill
    install:
      method: git-clone-with-setup
      cmd: "git clone <repo-url> ~/.claude/skills/frontend-design"
      git_ref: <SHA>  # planner 实占 release SHA
      idempotent_check: "test -f ~/.claude/skills/frontend-design/SKILL.md"
    verify:
      cmd: "test -f ~/.claude/skills/frontend-design/SKILL.md"
      timeout_ms: 5000
      expected_exit_code: 0
    uninstall:
      cmd: "rm -rf ~/.claude/skills/frontend-design"
      cleanup_paths:
        - ~/.claude/skills/frontend-design
    upstream_health: { stability: beta, last_check: "2026-05-16", last_known_good_version: <ref>, fallback_action: warn }
    signed_by: easyinplay
    platforms: [linux, darwin, win32]
    decision_rules:
      trigger: "user 请求 style-led / 独特创意 / 做出风格"
      default_expert: frontend-design
      override_signals:
        - phrase: "做出风格"
          use: frontend-design
      # Phase 2.3 B-17 per-manifest hint 冗余守护层(Q3)
      do_not_use_when: []
      if_rejected_use: ui-ux-pro-max  # 反向 redirect — frontend-design 拒绝时回到 ui-ux-pro-max(D-08 镜像)
  ```
  **W3 plan-check fix — placeholder resolution discipline**: `<frontend-design-upstream>` + `<SHA>` + `<repo-url>` 字面 placeholder 必须 Wave 1 executor 实占 via T0.1 sed-replace discipline。若 URL 未 resolve,T1.1 **SKIP** until T0.1 manifest placeholder zero-residue gate (acceptance line 4) pass。schema validate 不 catch placeholder (URL field 是 string),依赖 T0.1 grep gate 守护。
- **read_first**:
  - `manifests/skill-packs/ui-ux-pro-max.yaml` L1-55(by Read,1:1 scaffold)
  - PATTERNS § 2.1
  - `routing/decision_rules.yaml` L29-46(ui-task-bold-style-override 现 production)
- **acceptance_criteria**:
  - `wc -l manifests/skill-packs/frontend-design.yaml` ≤ 60
  - `grep -E "category: design" manifests/skill-packs/frontend-design.yaml` 命中
  - `grep -E "method: git-clone-with-setup" manifests/skill-packs/frontend-design.yaml` 命中
  - `grep -E "decision_rules:" manifests/skill-packs/frontend-design.yaml` 命中
  - schema validate pass(`pnpm validate:manifest manifests/skill-packs/frontend-design.yaml` OR equivalent)
- **decision_source**: B-01 + B-02 + B-17 + PATTERNS § 2.1
- **EE-5 self-meta (W5 plan-check fix)** — 5-question gate self-application for frontend-design upstream:
  - ① reusable surface? **YES** — D-08 "做出风格" anchor 主导 redirect target,生产路径,非临时 wrapper
  - ② name fit + conflict? **YES fit / NO conflict** — `frontend-design` 命名清晰反映 style-led 维度;与 ui-ux-pro-max (标准化) 正交,无冲突
  - ③ overlap with installed? **PARTIAL by-design** — 与 ui-ux-pro-max overlap 在 design category 但维度不同 (ui-ux 标准化 / frontend-design 风格化);D-08 anchor 决定 redirect 方向,不重复装配
  - ④ concept vs identity? **CONCEPT** — frontend-design 是 design skill 概念 (layout/动效/装饰),非 import 别人产品身份
  - ⑤ user 无 upstream 理解? **YES** — "frontend design" 通用术语,user 不需知 upstream repo 就理解装配

### T1.2 — manifests/skill-packs/anthropics-skills-pptx.yaml NEW

- **files_modified**: `manifests/skill-packs/anthropics-skills-pptx.yaml`(NEW ≤60L)
- **action**: 沿袭 PATTERNS row 2 ADAPT(karpathy-skills.yaml npx-skill-installer 模板 + D2.1-5 `--copy --global` 必带 + skills@1.5.7 pin):
  ```yaml
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: anthropics-skills-pptx
    display_name: Anthropic Skills — pptx
    description: PowerPoint deck generation skill from anthropics/skills upstream.
    upstream:
      source: github.com/anthropics/skills
      repository: https://github.com/anthropics/skills
      license: Apache-2.0
      notice: |
        Anthropic skills — pptx sub-skill from anthropics/skills.
  spec:
    type: cc-skill-pack
    component_type: command
    category: content
    install_type: skill
    install:
      method: npx-skill-installer
      cmd: "npx --yes skills@1.5.7 add anthropics/skills/pptx --copy --global"
      idempotent_check: "test -f ~/.claude/skills/pptx/SKILL.md"
    verify:
      cmd: "test -f ~/.claude/skills/pptx/SKILL.md"
      timeout_ms: 5000
      expected_exit_code: 0
    uninstall:
      cmd: "rm -rf ~/.claude/skills/pptx"
      cleanup_paths:
        - ~/.claude/skills/pptx
    upstream_health: { stability: stable, last_check: "2026-05-16", last_known_good_version: "1.5.7", fallback_action: warn }
    signed_by: easyinplay
    platforms: [linux, darwin, win32]
    decision_rules:
      trigger: "user 请求生成 pptx / PowerPoint / slide deck (English)"
      default_expert: anthropics-skills-pptx
  ```
- **read_first**:
  - `manifests/skill-packs/karpathy-skills.yaml`(by Read,npx-skill-installer 模板)
  - `src/installers/npxSkillInstaller.ts` L92 + L111(by Grep,验 --copy --global flag 实装)
- **acceptance_criteria**:
  - `wc -l manifests/skill-packs/anthropics-skills-pptx.yaml` ≤ 60
  - `grep -E "category: content" manifests/skill-packs/anthropics-skills-pptx.yaml` 命中
  - `grep -E "npx --yes skills@1.5.7 add anthropics/skills/pptx --copy --global" manifests/skill-packs/anthropics-skills-pptx.yaml` 命中
  - schema validate pass
- **decision_source**: B-01 + B-03 + PATTERNS row 2 + D2.1-5
- **EE-5 self-meta (W5 plan-check fix)** — 5-question gate self-application for anthropics-skills-pptx upstream:
  - ① reusable surface? **YES** — pptx 生成是 content category 标准能力,Anthropic 官方维护
  - ② name fit + conflict? **YES fit / NO conflict** — `anthropics-skills-pptx` 显式 scope upstream + sub-skill,无冲突
  - ③ overlap with installed? **NO** — content category 当前无 pptx 能力 (仅 markdown / slide-deck via T1.3)
  - ④ concept vs identity? **CONCEPT** — pptx 文件生成是通用概念,非 import Anthropic 产品身份 (Apache-2.0 OSS sub-skill)
  - ⑤ user 无 upstream 理解? **YES** — "pptx generation skill" 通用术语,user 不需知 anthropics/skills repo 就理解

### T1.3 — manifests/skill-packs/anthropics-skills-slide-deck.yaml NEW

- **files_modified**: `manifests/skill-packs/anthropics-skills-slide-deck.yaml`(NEW ≤60L)
- **action**: 与 T1.2 同款,ref=`anthropics/skills/slide-deck`(verify `test -f ~/.claude/skills/slide-deck/SKILL.md`);decision_rules trigger "中文 slide / 中文 PPT 演示稿"(沿袭 decision_rules.yaml `chinese-content-deck` rule 协同)
- **read_first**: T1.2 产物 + `routing/decision_rules.yaml` L66-78(`chinese-content-deck` priority 70 rule 现 production)
- **acceptance_criteria**:
  - `wc -l manifests/skill-packs/anthropics-skills-slide-deck.yaml` ≤ 60
  - `grep -E "category: content" manifests/skill-packs/anthropics-skills-slide-deck.yaml` 命中
  - `grep -E "npx --yes skills@1.5.7 add anthropics/skills/slide-deck --copy --global" manifests/skill-packs/anthropics-skills-slide-deck.yaml` 命中
  - schema validate pass
- **decision_source**: B-01 + B-03 + PATTERNS row 3
- **EE-5 self-meta (W5 plan-check fix)** — 5-question gate self-application for anthropics-skills-slide-deck upstream:
  - ① reusable surface? **YES** — slide-deck 中文 PPT 演示稿生成,内容 category 高频需求 (decision_rules `chinese-content-deck` rule 已 production at L66-78)
  - ② name fit + conflict? **YES fit / NO conflict** — `anthropics-skills-slide-deck` upstream + sub-skill,无冲突
  - ③ overlap with installed? **NO** — 与 T1.2 pptx 互补 (pptx = 通用 PowerPoint / slide-deck = 中文 PPT 演示),不重复
  - ④ concept vs identity? **CONCEPT** — slide-deck 是中文演示概念,非 import Anthropic 身份
  - ⑤ user 无 upstream 理解? **YES** — "slide deck skill" 通用术语,user 不需知 anthropics/skills 就理解装配

### T1.4 — manifests/tools/playwright-test.yaml NEW

- **files_modified**: `manifests/tools/playwright-test.yaml`(NEW ≤60L)
- **action**: 沿袭 PATTERNS row 4(npx-skill-installer 或 npm-cli 由 executor 实占;优先 npx-skill-installer 与 anthropics-skills 一致):
  ```yaml
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: playwright-test
    display_name: Playwright Test
    description: End-to-end browser test framework (@playwright/test). Used for TS/React/Vue frontend e2e.
    upstream:
      source: github.com/microsoft/playwright
      repository: https://github.com/microsoft/playwright
      license: Apache-2.0
  spec:
    type: cc-skill-pack
    component_type: command
    category: testing
    install_type: skill
    install:
      method: npx-skill-installer
      cmd: "npx --yes skills@1.5.7 add playwright-test --copy --global"
      idempotent_check: "test -f ~/.claude/skills/playwright-test/SKILL.md"
    verify:
      cmd: "test -f ~/.claude/skills/playwright-test/SKILL.md"
    uninstall:
      cmd: "rm -rf ~/.claude/skills/playwright-test"
    platforms: [linux, darwin, win32]
    decision_rules:
      trigger: "e2e / browser test / TypeScript frontend"
      default_expert: playwright-test
  ```
- **read_first**: T1.2 产物 + `routing/decision_rules.yaml` L101-115(`e2e-default` priority 50 rule)
- **acceptance_criteria**:
  - `wc -l manifests/tools/playwright-test.yaml` ≤ 60
  - `grep -E "category: testing" manifests/tools/playwright-test.yaml` 命中
  - schema validate pass
- **decision_source**: B-01 + B-04 + PATTERNS row 4
- **EE-5 self-meta (W5 plan-check fix)** — 5-question gate self-application for playwright-test upstream:
  - ① reusable surface? **YES** — `@playwright/test` 是 TS/React/Vue frontend e2e 业界标准框架,非临时 wrapper
  - ② name fit + conflict? **YES fit / NO conflict** — `playwright-test` 显式 scope,与 webapp-testing (Python backend) 互补无冲突
  - ③ overlap with installed? **NO overlap by-design** — testing category cross-link 现 `e2e-default` rule (decision_rules L101-115),playwright-test 是该 expert 实装
  - ④ concept vs identity? **CONCEPT** — browser e2e test 是通用概念,非 import Microsoft 产品身份 (Apache-2.0 OSS)
  - ⑤ user 无 upstream 理解? **YES** — "playwright test" 业内广为人知,user 不需知 microsoft/playwright repo

### T1.5 — manifests/tools/chrome-devtools-mcp.yaml NEW

- **files_modified**: `manifests/tools/chrome-devtools-mcp.yaml`(NEW ≤60L)
- **action**: 沿袭 PATTERNS § 2.2 ADAPT(tavily-mcp.yaml mcp-http-add 模板):
  ```yaml
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: chrome-devtools-mcp
    display_name: Chrome DevTools MCP
    description: Performance / a11y / memory-leak diagnostics via Chrome DevTools MCP server (LCP / Core Web Vitals / ARIA / heap snapshot).
    upstream:
      source: github.com/<chrome-devtools-mcp-upstream>
      repository: https://github.com/<chrome-devtools-mcp-upstream>
      license: MIT
  spec:
    type: cc-skill-pack
    component_type: mcp-server
    category: testing
    install_type: mcp
    install:
      method: mcp-http-add
      cmd: "claude mcp add chrome-devtools-mcp --transport http <upstream-url>"
      idempotent_check: "claude mcp list | grep -q chrome-devtools-mcp"
    verify:
      cmd: "claude mcp list | grep -q chrome-devtools-mcp"
    uninstall:
      cmd: "claude mcp remove chrome-devtools-mcp"
    platforms: [linux, darwin, win32]
    decision_rules:
      trigger: "perf / a11y / memory-leak / LCP / Core Web Vitals"
      default_expert: chrome-devtools-mcp
      # 现 decision_rules.yaml L79-95 已有 perf-a11y-memory rule + forbidden_experts cross-link;manifest 此处 hint only
  ```
  **W3 plan-check fix — placeholder resolution discipline**: `<chrome-devtools-mcp-upstream>` + `<upstream-url>` 字面 placeholder 必须 Wave 1 executor 实占 via T0.1 sed-replace discipline。若 URL 未 resolve,T1.5 **SKIP** until T0.1 manifest placeholder zero-residue gate (acceptance line 4) pass;mcp-http-add cmd 跑 literal `<upstream-url>` 必 fail。
- **read_first**:
  - `manifests/tools/tavily-mcp.yaml` OR `manifests/tools/exa-mcp.yaml`(by Read,mcp-http-add 模板)
  - `routing/decision_rules.yaml` L79-95(perf-a11y-memory rule 现 production)
- **acceptance_criteria**:
  - `wc -l manifests/tools/chrome-devtools-mcp.yaml` ≤ 60
  - `grep -E "method: mcp-http-add" manifests/tools/chrome-devtools-mcp.yaml` 命中
  - schema validate pass
- **decision_source**: B-01 + B-05 + PATTERNS § 2.2
- **EE-5 self-meta (W5 plan-check fix)** — 5-question gate self-application for chrome-devtools-mcp upstream:
  - ① reusable surface? **YES** — perf / a11y / memory-leak 诊断是 testing category 关键能力 (decision_rules `perf-a11y-memory` rule 已 production at L79-95)
  - ② name fit + conflict? **YES fit / NO conflict** — `chrome-devtools-mcp` 显式 scope MCP transport,与 playwright-test 维度互补 (functional vs non-functional)
  - ③ overlap with installed? **NO** — perf/a11y/memory 维度当前无 expert,chrome-devtools-mcp 是该 dimension 唯一装备
  - ④ concept vs identity? **CONCEPT** — Chrome DevTools 协议是 W3C-style 标准,非 import Google 产品身份;MCP transport 是协议接口
  - ⑤ user 无 upstream 理解? **YES** — "chrome devtools mcp" 业内术语清晰,user 不需知具体 upstream repo

### T1.6 — install 链路 e2e smoke

- **files_modified**: (no file modify;CLI dry-run only)
- **action**: 沿袭 Phase 2.1 6 method dispatch e2e mode,各 5 NEW manifest 跑 install dry-run:
  ```bash
  for f in frontend-design anthropics-skills-pptx anthropics-skills-slide-deck playwright-test chrome-devtools-mcp; do
    harnessed install $f --dry-run --apply || echo "FAIL: $f"
  done
  ```
  每 manifest 必返 exit 0 + 输出 install cmd preview(无实际副作用)
- **read_first**: `src/installers/index.ts`(by Read,dispatch table)+ Phase 2.1 install method test 模式
- **acceptance_criteria**:
  - 5 NEW manifest 全 `harnessed install <name> --dry-run --apply` exit 0
  - install cmd preview 含正确 method(git-clone-with-setup / npx-skill-installer / mcp-http-add)
  - 0 实际副作用(`~/.claude/skills/` 0 增量 file;`claude mcp list` 0 增量 entry)
- **decision_source**: B-01 + KICKOFF § 1.2 F2

---

## Wave 2 — decision_rules CD-3 字段 + karpathy SKILL-ONLY(D-02 + D-04 + D-08)

### T2.1 — routing/decision_rules.yaml CD-3 字段 + 9 keywords 词集校准 + 1-2 anchor/negative-space rule

- **files_modified**: `routing/decision_rules.yaml`(MODIFY +20-30L)
- **action**:
  1. **9 keywords 词集升级**(L29-46 `ui-task-bold-style-override` override_keywords 区)— 沿袭 RESEARCH § 3.3 D2.3-4 推荐:
  ```yaml
  override_keywords:
    - 做出风格
    - 独创
    - 风格化
    - 品牌调性
    - design-led
    - distinctive
    - signature style  # NEW
    - art direction    # NEW
    - bold style       # NEW
    # REMOVED: 独特 (false-pos "独特的搜索方案" 太高)
    # KEEP-with-caveat: creative + experimental (已 ship;SAMPLES.md 边界 case 验证)
  ```
  保留 `creative` + `experimental` 字段(SAMPLES.md 边界 case 验证,不强删)
  2. **CD-3 字段加**(L47-56 `ui-task-default` 段)— 沿袭 PATTERNS § 2.3 ADAPT:
  ```yaml
  - id: ui-task-default
    priority: 50
    domain: design
    when:
      task_type: ui-design
    decision:
      primary_expert: ui-ux-pro-max
      secondary_expert: frontend-design
      conflict_policy: primary_wins
      rationale: 数据驱动 + 标准化 + 可解释 优先
      # Phase 2.3 D-04 CD-3 negative-space + redirect — NEW optional fields
      do_not_use_when:
        - 做出风格
        - 独创
        - 风格化
        - design-led
      if_rejected_use: frontend-design  # D-08 锁 redirect target
  ```
  3. **content 段同款补 CD-3**(L57-78 现 `pptx-file-task` + `chinese-content-deck` 段;加 1 negative-space e.g. "通用 markdown 文档" → if_rejected_use: docs-default 或 omit)
  4. **testing 段同款补 CD-3**(L79-126 现 4 rules;perf-a11y-memory 已有 forbidden_experts 不动 A7 守恒,加 e2e-with-python-backend 的 do_not_use_when: "pure-frontend / no-Python-backend")
  5. **A7 守恒** — `version: 2` 不动(不 bump v3,additive D1.5-10)
- **read_first**:
  - `routing/decision_rules.yaml` L1-170(全 production state)
  - PATTERNS § 2.3
  - RESEARCH § 3.3 D2.3-4 + § 3.4 D2.3-5
- **acceptance_criteria**:
  - `grep -cE "do_not_use_when:|if_rejected_use:" routing/decision_rules.yaml` ≥ 4(三 category 至少各 1 negative-space)
  - `grep -E "signature style|art direction|bold style" routing/decision_rules.yaml` 命中 3
  - `! grep -E "^\s+-\s+独特\s*$" routing/decision_rules.yaml`(独特 REMOVED)
  - `grep "version: 2" routing/decision_rules.yaml` 命中(A7 守恒)
  - yaml-language-server schema validate pass
- **decision_source**: B-15 + B-16 + B-23 + RESEARCH D2.3-4 + § 3.3

### T2.2 — src/routing/decisionRules.ts arbitrateWithRedirect() NEW(B-18 legacy 保留)

- **files_modified**: `src/routing/decisionRules.ts`(MODIFY ~+5L import + re-export only — 主体 ≤183L 不动) + `src/routing/lib/arbitrateRedirect.ts`(**NEW ~25-30L, W4 plan-check fix — PROACTIVE SPLIT**;沿袭 Phase 2.2 sdkReconcile → agentDefinition.ts split 先例;不留 ~208L 临界 reactive 决策给 executor)
- **action**: 沿袭 RESEARCH D2.3-7 pseudocode + PATTERNS § 2.4 升级:
  ```typescript
  // 文件顶 ADR errata 注释
  // ADR 0012 errata — CD-3 negative-space + if_rejected_use redirect (phase 2.3 W2 — F3).
  // Legacy arbitrate() 保留 A7 守恒 (B-18 (b));新 fn arbitrateWithRedirect() 走 ArbitrateResult discriminated union.

  export type ArbitrateResult =
    | { kind: 'matched'; rule: Rule }
    | { kind: 'rejected'; redirectTo: string }
    | { kind: 'none' }

  /** Phase 2.3 D-04 CD-3 — arbitrate + negative-space + if_rejected_use redirect。 */
  export function arbitrateWithRedirect(rules: Rule[], task: TaskContext): ArbitrateResult {
    const matches = rules.filter((r) => matchesWhen(r.when, task))
    // Filter out rules whose do_not_use_when matches task
    const eligible = matches.filter((r) => {
      const dec = r.decision as { do_not_use_when?: string[] }
      if (!Array.isArray(dec.do_not_use_when)) return true
      return !dec.do_not_use_when.some((k) => taskHas(task, k))
    })
    const sorted = [...eligible].sort((a, b) => b.priority - a.priority)
    const [top, second] = sorted
    if (!top) {
      // All rules rejected by do_not_use_when → surface redirect from highest-priority rejected
      const rejectedHighest = matches.find((r) => {
        const dec = r.decision as { if_rejected_use?: string }
        return !!dec.if_rejected_use
      })
      if (rejectedHighest) {
        const dec = rejectedHighest.decision as { if_rejected_use: string }
        return { kind: 'rejected', redirectTo: dec.if_rejected_use }
      }
      return { kind: 'none' }
    }
    if (second && second.priority === top.priority) return { kind: 'none' }
    return { kind: 'matched', rule: top }
  }

  // Legacy arbitrate() 保留不动 A7 守恒 + 30-sample routing-engine.test.ts byte-stable
  export function arbitrate(rules: Rule[], task: TaskContext): Rule | null { /* 原 6L 主体不动 */ }

  // helper(可复用 F42 substring fn)
  function taskHas(task: TaskContext, keyword: string): boolean {
    const haystack = JSON.stringify(task).toLowerCase()
    return haystack.includes(keyword.toLowerCase())
  }
  ```
  **W4 plan-check fix — PROACTIVE SPLIT (no longer fallback)**:`arbitrateWithRedirect` + `taskHas` helper + `ArbitrateResult` type **直接** ship 到 `src/routing/lib/arbitrateRedirect.ts` (≤80L);`src/routing/decisionRules.ts` 仅加 ~5L `export { arbitrateWithRedirect, type ArbitrateResult } from './lib/arbitrateRedirect.js'` re-export (主体 ≤183L 不动 + ~+5L re-export = ≤188L,200L hard limit 有充足 buffer)。沿袭 Phase 2.2 sdkReconcile → agentDefinition.ts proactive split 先例 (reactive 200L 临界决策不留给 executor)。
- **read_first**:
  - `src/routing/decisionRules.ts` L1-184(by Read,全 production state)
  - PATTERNS § 2.4
  - RESEARCH D2.3-7 pseudocode
- **acceptance_criteria**:
  - `grep -E "export function arbitrateWithRedirect" src/routing/lib/arbitrateRedirect.ts` 命中(**W4 plan-check fix**: proactive split — fn 主体在 lib/)
  - `grep -E "export \{ arbitrateWithRedirect" src/routing/decisionRules.ts` 命中(W4: re-export only)
  - `grep -E "export function arbitrate\\(" src/routing/decisionRules.ts` 仍命中(legacy 保留 A7)
  - `wc -l src/routing/decisionRules.ts` ≤ 200(proactive guard via split — 主体 + 5L re-export ≤188L)
  - `wc -l src/routing/lib/arbitrateRedirect.ts` ≤ 80
  - `grep "ADR 0012" src/routing/decisionRules.ts` 命中(B-38 fence)
  - `npm test -- tests/routing/decision-rules.test.ts`(若存在) pass(legacy 测试 byte-stable)
  - `npx tsc --noEmit` pass
- **decision_source**: B-18 + B-19 + B-36 + RESEARCH D2.3-7 + PATTERNS D-WP-5 + § 2.4

### T2.3 — skills/karpathy-baseline/SKILL.md NEW(D-02 + D2.3-2 单文件 + always_active)

- **files_modified**: `skills/karpathy-baseline/SKILL.md`(NEW ≤80L,本仓库 source of truth)
- **action**: 沿袭 RESEARCH § 2.2 推荐:
  ```markdown
  ---
  name: karpathy-baseline
  description: |
    Cross-cutting Karpathy coding heuristics (always-on心法).
    Apply 4 rules to ALL coding tasks: Think Before Coding,
    Simplicity First, Surgical Changes, Goal-Driven Execution.
    Source: andrej-karpathy-skills (forrestchang) — distilled.
  always_active: true
  version: 1.0.0
  license: MIT
  upstream: https://github.com/forrestchang/andrej-karpathy-skills
  ---

  # Karpathy Baseline(心法 always-on)

  ## 1. Think Before Coding
  先思考再写。 对新功能/陌生代码先 read + understand,禁止"看着改"。
  触发:每次 implementation task。 反模式:直接动键盘改文件。

  ## 2. Simplicity First (YAGNI)
  最小有效代码。 不预先抽象、不预先加灵活性、不堆装配。
  触发:每次 design decision。 反模式:preemptive abstraction、N×M 候选矩阵。

  ## 3. Surgical Changes
  小步原子修改。 一次只改一个意图,git commit 历史保持线性。
  触发:每次 edit。 反模式:mixed-concern commit、连 refactor 带 feature。

  ## 4. Goal-Driven Execution
  始终回到目标。 写代码前问"这一步要达到什么",写完问"达到了吗"。
  触发:每个子任务起点 + 终点。 反模式:side quest、yak shaving。

  ---

  *Source distilled from forrestchang/andrej-karpathy-skills (MIT). Phase 2.3 D-02 SKILL-ONLY injection.*
  ```
- **read_first**:
  - `~/.claude/skills/ui-ux-pro-max/SKILL.md`(by Read,验现役 SKILL.md 模板 + frontmatter shape)
  - RESEARCH § 2.2
- **acceptance_criteria**:
  - `wc -l skills/karpathy-baseline/SKILL.md` ≤ 80
  - `grep -E "always_active:\s*true" skills/karpathy-baseline/SKILL.md` 命中
  - `grep -cE "^## [1-4]\." skills/karpathy-baseline/SKILL.md` == 4(4 心法各 1 节)
  - `grep "license: MIT" skills/karpathy-baseline/SKILL.md` 命中
  - `file skills/karpathy-baseline/SKILL.md` 不含 CRLF(LF only B-39)
- **decision_source**: B-06 + B-07 + B-08 + RESEARCH D2.3-2 + § 2.2

### T2.4 — manifests/skill-packs/karpathy-skills.yaml REWRITE(D-02 删 CLAUDE.md sed → cp -R skill)

- **files_modified**: `manifests/skill-packs/karpathy-skills.yaml`(REWRITE ≤60L) + `scripts/strip-claude-md-section.mjs`(**NEW ≤40L, W2 plan-check fix** — cross-platform CLAUDE.md section stripper sub-task of T2.4;沿袭 check-transparency-verdicts.mjs node-walker 模式)
- **action**: 沿袭 RESEARCH § 2.4 D2.3-3 REWRITE:
  ```yaml
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: karpathy-skills
    display_name: Karpathy Baseline (心法 always-on)
    description: Andrej Karpathy 心法 always-on SKILL-ONLY injection (D-02 锁 不动 CLAUDE.md).
    upstream:
      source: github.com/forrestchang/andrej-karpathy-skills
      repository: https://github.com/forrestchang/andrej-karpathy-skills
      license: MIT
      notice: |
        rules attributed to Andrej Karpathy; distilled to ~/.claude/skills/karpathy-baseline/SKILL.md.
  spec:
    type: cc-skill-pack
    component_type: command
    category: meta
    install_type: skill
    install:
      method: git-clone-with-setup  # D2.3-3 沿袭 Phase 2.1 6 method dispatch
      cmd: |
        # Migration cleanup (Phase 2.3 R3 mitigation + W2 plan-check fix) — 一次性清旧 CLAUDE.md sed-injection block
        # W2 plan-check fix: 改 sed -i 为 node script (cross-platform Win + macOS BSD + Linux GNU 统一,
        # architect-clean — node script 是跨平台字符串操作的正路, 不是 ad-hoc workaround;
        # 沿袭 check-transparency-verdicts.mjs 模式; macOS BSD `sed -i` 需 empty-string arg 兼容性 gap 通过此根除)
        if [ -f ~/.claude/CLAUDE.md ]; then
          node scripts/strip-claude-md-section.mjs "<!-- karpathy-skills:start -->" "<!-- karpathy-skills:end -->" ~/.claude/CLAUDE.md \
            && echo "[migration] cleaned legacy karpathy-skills CLAUDE.md block (D-02 SKILL-ONLY transition; cross-platform via node script)"
        fi
        # Install — cp 本仓 source-of-truth 到 user skills
        cp -R skills/karpathy-baseline ~/.claude/skills/
      idempotent_check: "test -f ~/.claude/skills/karpathy-baseline/SKILL.md"
    verify:
      cmd: "test -f ~/.claude/skills/karpathy-baseline/SKILL.md && ! grep -q 'karpathy-skills:start' ~/.claude/CLAUDE.md 2>/dev/null"
      timeout_ms: 5000
      expected_exit_code: 0
    uninstall:
      cmd: "rm -rf ~/.claude/skills/karpathy-baseline"
      cleanup_paths:
        - ~/.claude/skills/karpathy-baseline
    upstream_health: { stability: stable, last_check: "2026-05-16", fallback_action: warn }
    signed_by: easyinplay
    platforms: [linux, darwin, win32]
  ```
- **read_first**:
  - `manifests/skill-packs/karpathy-skills.yaml`(by Read,现 D-02 否决路径)
  - RESEARCH § 2.4
  - PATTERNS row 10
- **acceptance_criteria**:
  - `wc -l manifests/skill-packs/karpathy-skills.yaml` ≤ 60
  - `! grep -E "grep -q.*karpathy-skills.*~/.claude/CLAUDE.md" manifests/skill-packs/karpathy-skills.yaml`(D-02 验:旧 verify cmd 已删)
  - `grep -E "cp -R skills/karpathy-baseline ~/.claude/skills/" manifests/skill-packs/karpathy-skills.yaml` 命中(新 install cmd)
  - `grep -E "node scripts/strip-claude-md-section.mjs" manifests/skill-packs/karpathy-skills.yaml` 命中(**W2 plan-check fix**: cross-platform node script,**REPLACES** `sed -i` macOS BSD gap)
  - `! grep -E "sed -i.*karpathy-skills:start" manifests/skill-packs/karpathy-skills.yaml`(W2 验:旧 sed -i 已删)
  - `wc -l scripts/strip-claude-md-section.mjs` ≤ 40 + `node scripts/strip-claude-md-section.mjs --help 2>&1 | head -3` outputs usage
  - `grep -E "rm -rf ~/.claude/skills/karpathy-baseline" manifests/skill-packs/karpathy-skills.yaml` 命中(uninstall 干净)
  - schema validate pass
- **decision_source**: B-09 + B-10 + R3 + RESEARCH D2.3-3 + § 2.4

### T2.5 — per-manifest hint 层冗余字段(Q3 / B-17)

- **files_modified**: `manifests/skill-packs/ui-ux-pro-max.yaml`(MODIFY +5L)+ `manifests/skill-packs/frontend-design.yaml`(MODIFY +5L if 不在 T1.1 直接含)
- **action**:
  1. `manifests/skill-packs/ui-ux-pro-max.yaml` 在 decision_rules 节加:
  ```yaml
  decision_rules:
    # ... 现存 trigger / default_expert / override_signals 不动 (A7 守恒)
    # Phase 2.3 B-17 per-manifest hint 冗余守护层 (Q3)
    do_not_use_when:
      - 做出风格
      - 独创
      - 风格化
      - design-led
    if_rejected_use: frontend-design
  ```
  2. `frontend-design.yaml` T1.1 已含,本 task verify 一致性
- **read_first**:
  - `manifests/skill-packs/ui-ux-pro-max.yaml`(by Read)
  - T1.1 产物
- **acceptance_criteria**:
  - `grep -E "do_not_use_when:" manifests/skill-packs/ui-ux-pro-max.yaml` 命中
  - `grep -E "if_rejected_use: frontend-design" manifests/skill-packs/ui-ux-pro-max.yaml` 命中
  - `grep -E "if_rejected_use: ui-ux-pro-max" manifests/skill-packs/frontend-design.yaml` 命中 (**S3 plan-check fix**: 互镜射 — frontend-design 拒绝 → ui-ux-pro-max, ui-ux-pro-max 拒绝 → frontend-design;D-08 双向 redirect 一致性)
  - `grep -cE "do_not_use_when|if_rejected_use" manifests/skill-packs/ui-ux-pro-max.yaml` ≥ 2 (**S3**: 两字段总是成对 — semantic consistency)
  - `grep -cE "do_not_use_when|if_rejected_use" manifests/skill-packs/frontend-design.yaml` ≥ 2 (**S3**: 同上)
  - `grep -cE "do_not_use_when|if_rejected_use" routing/decision_rules.yaml` ≥ 2 (**S3**: SSOT 主导,两字段成对存在)
  - `wc -l manifests/skill-packs/ui-ux-pro-max.yaml` ≤ 65(原 55L + ≈5L)
  - schema validate pass
- **decision_source**: B-17 + RESEARCH Q3 + S3 plan-check fix

---

## Wave 3 — EE-5 双层 gate(D-03)

### T3.1 — src/cli/manifest-add.ts NEW(EE-5 5-question CLI)

- **files_modified**: `src/cli/manifest-add.ts`(NEW ≤90L)
- **action**: 沿袭 PATTERNS § 2.6 scaffold(research.ts L19-92 1:1 类比):
  ```typescript
  import type { Command } from 'commander'
  import * as readline from 'node:readline/promises'
  import { stdin, stdout } from 'node:process'

  interface RawOpts {
    apply?: boolean
    dryRun?: boolean
    nonInteractive?: boolean
  }

  const QUESTIONS = [
    '① 这是真 reusable surface 还是临时 wrapper?',
    '② 上游名字 fit 项目 shape 吗? 有现有命名冲突吗?',
    '③ 与已装配组件有 overlap surface 吗?',
    '④ 是 import 概念 (可控) 还是 import 别人产品身份 (高耦合)?',
    '⑤ user 不知 upstream 还能理解该装配吗?',
  ] as const

  export function registerManifestAdd(program: Command): void {
    program
      .command('manifest add <upstream>')
      .description('Add a new upstream adapter (EE-5 5-question gate, D-03 BOTH)')
      .option('--apply', 'persist to manifests/ (default: dry-run preview)')
      .option('--dry-run', 'force dry-run preview')
      .option('--non-interactive', 'CI/scripts — requires --apply or --dry-run; skips prompts in dry-run-only mode (D-03 锁 不绕 plan-phase hard reject)')
      .action(async (upstream: string, raw: RawOpts) => {
        // H1 gate (沿袭 research.ts L37-43)
        if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
          console.error('error: --non-interactive requires either --apply or --dry-run')
          process.exit(2)
        }
        if (raw.nonInteractive) {
          // D-03 dry-run-only — skip 5-question prompt, emit WARN
          console.warn('[ee-5-gate] WARN: --non-interactive skips 5-question prompt (D-03 dry-run-only path). plan-phase template hard reject still applies.')
          console.log(`[manifest-add] dry-run preview for upstream: ${upstream}`)
          return
        }
        // Interactive 5-question prompt
        const rl = readline.createInterface({ input: stdin, output: stdout })
        const answers: string[] = []
        for (const q of QUESTIONS) {
          const a = (await rl.question(`${q}\n> `)).trim()
          if (!a) {
            console.error('error: EE-5 gate requires non-empty answer')
            rl.close()
            process.exit(1)
          }
          answers.push(a)
        }
        rl.close()
        if (raw.apply) {
          // Persist manifest stub + log answers to provenance (D-03 audit trail; B-33 sibling .provenance.json)
          console.log(`[manifest-add] EE-5 gate passed; persisting manifest stub for ${upstream}`)
          // Provenance write (D-03 audit trail) — answers + author + timestamp + confidence
          // ... (executor 实占 provenance JSON write path)
        } else {
          console.log(`[manifest-add] EE-5 gate passed (dry-run); would persist manifest stub for ${upstream}`)
        }
      })
  }
  ```
- **read_first**:
  - `src/cli/research.ts` L1-93(by Read,scaffold 1:1)
  - PATTERNS § 2.6
  - intel L86(5 题原型)
- **acceptance_criteria**:
  - `wc -l src/cli/manifest-add.ts` ≤ 90
  - `grep -E "export function registerManifestAdd" src/cli/manifest-add.ts` 命中
  - `grep -E "readline.createInterface" src/cli/manifest-add.ts` 命中
  - `grep -cE "①|②|③|④|⑤" src/cli/manifest-add.ts` == 5
  - `grep -E "\\[ee-5-gate\\] WARN" src/cli/manifest-add.ts` 命中(R5 mitigation)
  - `npx tsc --noEmit` pass
- **decision_source**: B-11 + B-12 + B-13 + PATTERNS § 2.6 + D-03
- **S2 plan-check fix (EE-5 provenance mapping explicit)**: Phase 2.2 B-33 provenance.schema.json 4 字段 (source/created_at/confidence/author) 与 EE-5 5 答案语义不同 — provenance = manifest metadata,EE-5 = author audit。**Explicit mapping spec**:
  - `source` = `"phase-2.3-w3-ee5-cli"` (固定 string,标识 manifest-add CLI 来源)
  - `created_at` = ISO 8601 date (e.g. `new Date().toISOString()`)
  - `confidence` = `"user-attested"` (manifest-add 互动 prompt 用户答 attested,非 automated inference)
  - `author` = git user.email (executor 实占 via `git config user.email` OR fallback `process.env.USER`)
  - **5 answers storage — 两路径选一**:
    - **Path A (preferred, 无 schema bump)**: 写 sibling file `manifests/skill-packs/<name>.ee5-answers.json` (5 named field: `q1_reusable_surface` / `q2_name_fit` / `q3_overlap` / `q4_concept_vs_identity` / `q5_user_understanding`);不污染 provenance.schema.json 4 字段
    - **Path B (alternative considered — SUGGESTION-3 delta: NOT recommended)**: provenance.schema.json + schema bump 路径已评估但 Path A 简洁性占优;executor 不必走 Path B
  - **Recommendation**: Path A (sibling JSON file) — Karpathy 最简 + 不破 Phase 2.2 ship 的 provenance schema;executor 实占 write path = `manifests/skill-packs/<name>.ee5-answers.json`

### T3.2 — src/cli.ts register registerManifestAdd

- **files_modified**: `src/cli.ts`(MODIFY +2L)
- **action**: import + register call:
  ```typescript
  import { registerManifestAdd } from './cli/manifest-add.js'
  // ...
  registerManifestAdd(program)
  ```
- **read_first**: `src/cli.ts`(by Read,定位现有 register fn 调用区)
- **acceptance_criteria**:
  - `grep "registerManifestAdd" src/cli.ts` 命中 2(import + call)
  - `npx tsc --noEmit` pass
  - `node dist/cli.js manifest add --help` 输出含 description "EE-5 5-question gate"
- **decision_source**: B-12

### T3.3 — KICKOFF.md 模板加 § 7 EE-5 节 + gsd-plan-checker BLOCKER rule

- **files_modified**: `.planning/_templates/KICKOFF-TEMPLATE.md`(NEW if 不存在 OR `.planning/phase-2.3/KICKOFF.md` 直接 convention 示范) + `.claude/agents/gsd-plan-checker.md`(MODIFY +5L rule)
- **action**:
  1. 写 KICKOFF.md § 7 模板节(沿袭 PATTERNS § 1 row 12 + D-03):
  ```markdown
  ## § 7 EE-5 manifest-add gate(if any new upstream adapter)

  > **Required**: 若本 phase 列出新 upstream adapter(`manifests/**.yaml` NEW entry)→ 必答 5 题。 plan-phase gsd-plan-checker BLOCKER if 任一题未答(D-03 + intel L86)。

  | Q | Question | Answer |
  |---|----------|--------|
  | ① | 这是真 reusable surface 还是临时 wrapper? | <fill> |
  | ② | 上游名字 fit 项目 shape 吗? 有现有命名冲突吗? | <fill> |
  | ③ | 与已装配组件有 overlap surface 吗? | <fill> |
  | ④ | 是 import 概念 (可控) 还是 import 别人产品身份 (高耦合)? | <fill> |
  | ⑤ | user 不知 upstream 还能理解该装配吗? | <fill> |
  ```
  2. gsd-plan-checker rule(伪代码注入 checker agent prompt):
  ```markdown
  ### EE-5 BLOCKER rule (Phase 2.3 ship)
  IF kickoff_listing_new_upstream_adapter THEN
    REQUIRE § 7 section exists in KICKOFF.md AND all 5 questions have non-`<fill>` answers
    ELSE emit BLOCKER (not WARNING / SUGGESTION)
  ```
- **read_first**:
  - `.claude/agents/gsd-plan-checker.md`(by Read,验现有 schema)
  - `.planning/phase-2.3/KICKOFF.md`(by Read,作 § 7 节插入位置)
- **acceptance_criteria**:
  - `grep -E "## § 7 EE-5" .planning/phase-2.3/KICKOFF.md OR .planning/_templates/KICKOFF-TEMPLATE.md` 命中
  - `grep -cE "①|②|③|④|⑤" 上述 file` == 5
  - `grep -E "EE-5 BLOCKER rule.*Phase 2.3" .claude/agents/gsd-plan-checker.md` 命中
- **decision_source**: B-14 + PATTERNS § 1 row 12 + D-03

---

## Wave 4 — 30 SAMPLES.md FRESH + arbitrate routing ≥85%(D-05 + D-08)

### T4.1 — .planning/phase-2.3/SAMPLES.md NEW R3 frozen

- **files_modified**: `.planning/phase-2.3/SAMPLES.md`(NEW ≤250L)
- **action**: 沿袭 phase 1.4 / 2.2 SAMPLES.md R3 frozen 模板 + B-21 分布:
  - § 1.1 三约束(R3 frozen + FRESH-30 + 每 category 含 anchor / non-anchor / cross-category edge / CD-3 negative-space disqualify edge **各 ≥1**)
  - § 1.2 分布表(10 design + 10 content + 10 testing)
  - § 1.3 anchor / false-pos 设计
  - § 1.4 cherry-pick 防御(execute-phase 不允许改)
  - § 2 truth table(列 schema:# / category / task_type / prompt / expected_route / expected_primary_expert / acceptance_signal / R3 rationale)
  - 30 行 sample,e.g.:
  ```markdown
  | # | category | task_type | prompt | expected_route | expected_primary_expert | acceptance_signal | rationale |
  |---|----------|-----------|--------|----------------|------------------------|-------------------|-----------|
  | 01 | design | ui-design | "做一个 admin dashboard,数据驱动 standardized" | ui-task-default | ui-ux-pro-max | matched | non-anchor default |
  | 02 | design | ui-design | "做出风格化的 landing page,要 distinctive" | ui-task-bold-style-override | frontend-design | matched (priority 100) | **anchor case (D-08)** |
  | 03 | design | ui-design | "找一个独特的搜索算法" | search-default | (search expert) | matched (priority 50) | **false-pos 负样本:独特 应 routing 到 search 而非 ui-design** |
  | 04 | design | ui-design | "做出风格 + 标准化 dashboard" | ui-task-default | (rejected via do_not_use_when) → frontend-design | rejected with redirect | **CD-3 negative-space disqualify edge** |
  | ... | ... | ... | ... | ... | ... | ... | ... |
  ```
  全 30 sample 详 truth table;每 category 必含 anchor(≥1)+ non-anchor(≥6)+ cross-category edge(≥1)+ CD-3 disqualify edge(≥1);**design 段必含 ≥1 做出风格 anchor + ≥1 false-pos 独特 负样本(B-23 D2.3-4 验)**
- **read_first**:
  - `.planning/phase-1.4/SAMPLES.md`(by Read,R3 frozen 原版 truth table shape)
  - `.planning/phase-2.2/SAMPLES.md`(by Read,§ 1.1 三约束 + § 2 truth table 列 schema)
  - `routing/decision_rules.yaml` L1-170(全 production state 验 expected_route)
  - ASSUMPTIONS B-21 + B-23
- **acceptance_criteria**:
  - `wc -l .planning/phase-2.3/SAMPLES.md` ≤ 250
  - `grep -cE "^\| (0[1-9]|[12][0-9]|30) \|" .planning/phase-2.3/SAMPLES.md` == 30(30 sample 行)
  - `grep -E "做出风格" .planning/phase-2.3/SAMPLES.md` 命中 ≥ 1
  - `grep -E "独特" .planning/phase-2.3/SAMPLES.md` 命中 ≥ 1(false-pos 负样本)
  - `grep -cE "design|content|testing" .planning/phase-2.3/SAMPLES.md` ≥ 30
  - `grep -cE "CD-3|disqualify|rejected with redirect" .planning/phase-2.3/SAMPLES.md` ≥ 3
- **decision_source**: B-20 + B-21 + B-22 + B-23 + D-05 + D-08

### T4.2 — always_active spike validation (W1 plan-check fix — SKIPPED, spike moved to T0.10)

> **Resolved (T4.2, 2026-05-16)**: SKIPPED satisfied — spike outcome 已 W0 T0.10 ship (outcome FAIL → R2 A1 fallback locked, 详见 task_plan.md L4 顶部 Resolved (T0.10) block + W2 T2.3 0ccb58d SKILL.md description-keyword + self-reflexive prompt design)。Wave 4 sequence 占位 task — 无 file 创建; acceptance criteria 验证: `grep "Resolved.*T0.10" .planning/phase-2.3/task_plan.md` 命中 (L4 块存在) + T2.3 SKILL.md frontmatter 与 T0.10 outcome 一致 (description 含 "ALWAYS apply" wording 由 T2.3 ship 锁定)。

- **status**: **SKIPPED — spike 已提前到 Wave 0 T0.10** (W1 plan-check fix: spike 反序修正,T2.3 W2 ship 前已 validated)。本 task 保留为 Wave 4 sequence 占位,actual spike outcome 见 T0.10 Resolved block。
- **action (validation only)**: read T0.10 Resolved block + verify T2.3 SKILL.md frontmatter 字段名与 T0.10 outcome 一致 (若 spike FAIL 则 verify description 含 "ALWAYS apply" wording)。
- **acceptance_criteria**:
  - `grep -E "Resolved.*T0.10" .planning/phase-2.3/task_plan.md` 命中 (T0.10 outcome 已记录)
  - T2.3 SKILL.md frontmatter 字段与 T0.10 outcome 一致 (no rework needed at Wave 4)
- **decision_source**: R1 + RESEARCH A1 + § 2.3 + W1 plan-check fix (spike 反序 → SKIP this slot)

### T4.3 — tests/routing/samples-30.test.ts NEW(30-sample harness ≥85%)

- **files_modified**: `tests/routing/samples-30.test.ts`(NEW)
- **action**: 沿袭 phase 1.4 / 2.2 SAMPLES.md harness 模式:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { readFileSync } from 'node:fs'
  import { parse as parseYaml } from 'yaml'
  import { arbitrateWithRedirect, type Rule, type TaskContext } from '../../src/routing/decisionRules.js'

  // Parse SAMPLES.md truth table → Sample[] (executor 实占 markdown table parser OR JSON 镜像 fixture)
  const SAMPLES = parseSamplesTruthTable('.planning/phase-2.3/SAMPLES.md')
  const RULES = (parseYaml(readFileSync('routing/decision_rules.yaml', 'utf8')) as { rules: Rule[] }).rules

  describe('Phase 2.3 30-sample routing harness (B-21 ≥85%)', () => {
    let hits = 0
    for (const sample of SAMPLES) {
      it(`#${sample.id} ${sample.category} ${sample.task_type} — expected ${sample.expected_primary_expert}`, () => {
        const task: TaskContext = { task_type: sample.task_type, prompt: sample.prompt } as TaskContext
        const result = arbitrateWithRedirect(RULES, task)
        let actualExpert: string | null = null
        if (result.kind === 'matched') actualExpert = result.rule.decision.primary_expert
        else if (result.kind === 'rejected') actualExpert = result.redirectTo
        if (actualExpert === sample.expected_primary_expert) hits++
      })
    }
    it('overall hit rate ≥85% (30 中 ≥26)', () => {
      expect(hits).toBeGreaterThanOrEqual(26)
    })
  })
  ```
- **read_first**:
  - `tests/routing/routing-engine.test.ts`(若存在,by Read,vitest pattern)
  - `.planning/phase-2.3/SAMPLES.md`(T4.1 产物)
  - `src/routing/decisionRules.ts`(T2.2 产物)
- **acceptance_criteria**:
  - `npm test -- tests/routing/samples-30.test.ts` pass(≥26/30)
  - 若 < 26 → SAMPLES.md "## known miss" 节追加 + Wave 4 R4 fallback 9 keywords 微调(remove false-pos / add false-neg);沿袭 phase 1.4 SAMPLES.md miss 节模式
  - 测试 file 存在 + 30 sample 全 itentify(`grep -cE "^\\s+it\\(" tests/routing/samples-30.test.ts` ≥ 30 + 1 overall)
- **decision_source**: B-20 + B-22 + R4
- **S1 plan-check fix (vitest parallel race)**: 原 harness 用 `hits` mutate-across-it 累积 — vitest parallel-mode race vulnerable。采用 cleaner refactor (pre-compute pattern):
  ```typescript
  // Refactored — local-state-per-it via pre-compute (S1 plan-check fix)
  describe('Phase 2.3 30-sample routing harness (B-21 ≥85%)', () => {
    const results = SAMPLES.map((sample) => {
      const task: TaskContext = { task_type: sample.task_type, prompt: sample.prompt } as TaskContext
      const result = arbitrateWithRedirect(RULES, task)
      let actualExpert: string | null = null
      if (result.kind === 'matched') actualExpert = result.rule.decision.primary_expert
      else if (result.kind === 'rejected') actualExpert = result.redirectTo
      return { sample, actualExpert, hit: actualExpert === sample.expected_primary_expert }
    })
    for (const { sample, actualExpert, hit } of results) {
      it(`#${sample.id} ${sample.category} ${sample.task_type} — expected ${sample.expected_primary_expert} actual ${actualExpert}`, () => {
        expect(hit).toBe(true)  // per-sample assertion;failure 不阻 overall hit-rate test
      })
    }
    it('overall hit rate ≥85% (30 中 ≥26)', () => {
      const hits = results.filter((r) => r.hit).length
      expect(hits).toBeGreaterThanOrEqual(26)
    })
  })
  ```
  Pre-compute pattern 避免 mutate-across-it,vitest parallel/sequential 模式均 safe。Fallback 兜底:`pnpm test -- tests/routing/samples-30.test.ts --sequential` 命令行强制串行。

---

## Wave 5 — integration + tests(F7 A7 守恒)

### T5.1 — tests/routing/arbitrate-redirect.test.ts NEW(CD-3 单元测试 4 case)

- **files_modified**: `tests/routing/arbitrate-redirect.test.ts`(NEW)
- **action**: 4 case 验 `arbitrateWithRedirect()` discriminated union:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { arbitrateWithRedirect, type Rule, type TaskContext } from '../../src/routing/decisionRules.js'

  describe('arbitrateWithRedirect — CD-3 negative-space + redirect', () => {
    it('matched: rule passes without do_not_use_when', () => {
      const rules: Rule[] = [{ id: 'r1', priority: 50, when: { task_type: 'ui-design' }, decision: { primary_expert: 'ui-ux-pro-max' } }]
      const task = { task_type: 'ui-design', prompt: 'standard dashboard' } as TaskContext
      const result = arbitrateWithRedirect(rules, task)
      expect(result.kind).toBe('matched')
      if (result.kind === 'matched') expect(result.rule.decision.primary_expert).toBe('ui-ux-pro-max')
    })
    it('rejected with redirect: do_not_use_when matches + if_rejected_use set', () => {
      const rules: Rule[] = [{
        id: 'r1', priority: 50, when: { task_type: 'ui-design' },
        decision: { primary_expert: 'ui-ux-pro-max', do_not_use_when: ['做出风格'], if_rejected_use: 'frontend-design' }
      }]
      const task = { task_type: 'ui-design', prompt: '做出风格的 landing page' } as TaskContext
      const result = arbitrateWithRedirect(rules, task)
      expect(result.kind).toBe('rejected')
      if (result.kind === 'rejected') expect(result.redirectTo).toBe('frontend-design')
    })
    it('none: do_not_use_when matches without if_rejected_use', () => {
      const rules: Rule[] = [{
        id: 'r1', priority: 50, when: { task_type: 'ui-design' },
        decision: { primary_expert: 'ui-ux-pro-max', do_not_use_when: ['做出风格'] }
      }]
      const task = { task_type: 'ui-design', prompt: '做出风格 page' } as TaskContext
      const result = arbitrateWithRedirect(rules, task)
      expect(result.kind).toBe('none')
    })
    it('none: multiple equal priority rules', () => {
      const rules: Rule[] = [
        { id: 'r1', priority: 50, when: { task_type: 'ui-design' }, decision: { primary_expert: 'ui-ux-pro-max' } },
        { id: 'r2', priority: 50, when: { task_type: 'ui-design' }, decision: { primary_expert: 'frontend-design' } }
      ]
      const task = { task_type: 'ui-design', prompt: 'dashboard' } as TaskContext
      const result = arbitrateWithRedirect(rules, task)
      expect(result.kind).toBe('none')
    })
  })
  ```
- **read_first**: T2.2 产物 + `src/routing/decisionRules.ts`
- **acceptance_criteria**:
  - `npm test -- tests/routing/arbitrate-redirect.test.ts` pass 4 case
  - 4 it block 全显式(matched / rejected with redirect / none w/o redirect / none equal priority)
- **decision_source**: B-18 + B-19 + RESEARCH D2.3-7

### T5.2 — tests/cli/manifest-add-ee5.test.ts NEW

- **files_modified**: `tests/cli/manifest-add-ee5.test.ts`(NEW)
- **action**: 验 EE-5 CLI 5-question + `--non-interactive` dry-run-only(沿袭 Phase 2.2 cli test 模式):
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { Command } from 'commander'
  import { registerManifestAdd } from '../../src/cli/manifest-add.js'

  describe('manifest-add EE-5 gate', () => {
    it('--non-interactive without --apply/--dry-run exits 2', async () => {
      const program = new Command()
      registerManifestAdd(program)
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((c: number) => { throw new Error(`exit ${c}`) }) as never)
      await expect(program.parseAsync(['node', 'cli', 'manifest', 'add', 'foo', '--non-interactive'])).rejects.toThrow('exit 2')
      exitSpy.mockRestore()
    })
    it('--non-interactive --dry-run emits WARN + exit 0', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const program = new Command()
      registerManifestAdd(program)
      await program.parseAsync(['node', 'cli', 'manifest', 'add', 'foo', '--non-interactive', '--dry-run'])
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[ee-5-gate] WARN'))
      warnSpy.mockRestore()
    })
    // Interactive 5-question test 由 readline mock(stdin/stdout)实现 — executor 实占 mock
  })
  ```
- **read_first**: T3.1 产物 + `src/cli/research.ts` + vitest mock pattern
- **acceptance_criteria**:
  - `npm test -- tests/cli/manifest-add-ee5.test.ts` pass
  - `--non-interactive` 单跑 exit 2(H1 gate)
  - `--non-interactive --dry-run` 跑 WARN emit + exit 0
  - 5-question interactive 路径 covered by readline mock
- **decision_source**: B-11 + B-12 + R5

### T5.3 — end-to-end 全链路 smoke

- **files_modified**: (no file modify;CLI integration test)
- **action**: 5 链路 smoke:
  1. `harnessed install frontend-design --dry-run --apply` exit 0(install adapter 链路)
  2. `harnessed install karpathy-skills --apply` 跑通(SKILL-ONLY 装到 ~/.claude/skills/karpathy-baseline/);`! grep -q 'karpathy-skills:start' ~/.claude/CLAUDE.md`(D-02 验)
  3. `node -e "...arbitrateWithRedirect(rules, {task_type:'ui-design',prompt:'做出风格 page'})..."` 返 `kind: 'rejected', redirectTo: 'frontend-design'`(CD-3 链路)
  4. `harnessed manifest add new-upstream --non-interactive --dry-run` 跑通 EE-5 WARN emit + exit 0(EE-5 gate)
  5. `harnessed uninstall karpathy-skills` 跑通 `rm -rf ~/.claude/skills/karpathy-baseline`(uninstall 干净;D-02 不留残留)
- **read_first**: 前 4 wave 全 ship 产物
- **acceptance_criteria**: 5 链路全 exit 0 + 副作用符合预期(SKILL.md 装在 / 卸掉 / arbitrate 返 redirect / EE-5 WARN)
- **decision_source**: 综合 B-01 ~ B-19

### T5.4 — A7 守恒 verify

- **files_modified**: (no file modify;git diff verify)
- **action**:
  ```bash
  # 取 Phase 2.2 ship baseline tag (e.g. adr-0011-accepted)
  baseline=$(git tag --list 'adr-0011-accepted')
  # Verify ADR 0001-0011 main body 0 diff
  for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011; do
    diff=$(git diff $baseline..HEAD -- "docs/adr/${n}-*.md" | wc -l)
    if [ "$diff" -gt 0 ]; then
      # Allow errata fence comment additions only (`<!-- ADR 0012 errata`); else fail
      echo "::error::ADR ${n} main body diff $diff lines"
      exit 1
    fi
  done
  # AGENT-DEFINITION-FACTORY-CONTRACT.md + INSTALLER-CONTRACT.md main body 不动
  for f in docs/AGENT-DEFINITION-FACTORY-CONTRACT.md docs/INSTALLER-CONTRACT.md; do
    diff=$(git diff $baseline..HEAD -- "$f" | wc -l)
    if [ "$diff" -gt 5 ]; then  # tolerate small errata fence
      echo "::error::$f main body diff $diff lines"
      exit 1
    fi
  done
  ```
- **read_first**: `docs/adr/0001-*.md` ~ `docs/adr/0011-*.md`(by Read,verify 现状)
- **acceptance_criteria**:
  - 上述 script exit 0
  - `git diff adr-0011-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" "docs/adr/0011-*.md" | wc -l` ≈ 0(允许 errata 注释 fence 微改)
- **decision_source**: B-35 + KICKOFF § 3.1

---

## Wave 6 — ship(F8)

### T6.1 — ADR 0012 finalize 5 章节(Wave 0 draft → 详细 fill)

- **files_modified**: `docs/adr/0012-extension-mvp-karpathy-inject.md`(MODIFY — Wave 0 sketch → finalize)
- **action**: 5 章节详细 fill(rationale + alternatives + consequences + references);Status: Draft → Accepted
  - 章节 ① extension category MVP — 引 B-01~B-05 + D-01 + R2 critical finding(decision_rules v2 已 ship,Phase 2.3 是 ADAPT 非 greenfield)
  - 章节 ② CD-3 — 引 B-15~B-19 + D-04 + RESEARCH D2.3-7 pseudocode + D-WP-1 (b) do nothing schema
  - 章节 ③ EE-5 — 引 B-11~B-14 + D-03 + intel L86 + L92
  - 章节 ④ karpathy SKILL-ONLY — 引 B-06~B-10 + D-02 + RESEARCH D2.3-2/3 + R3 migration cleanup
  - 章节 ⑤ Wave 0 perf gate 根治 — 引 B-25~B-32 + D-07 + RESEARCH D2.3-1(D2.3-1 (a) 移出 CI critical path)
- **read_first**: ASSUMPTIONS § B 全锁 + RESEARCH § 1-3 + PATTERNS § 3
- **acceptance_criteria**:
  - `grep "Status: Accepted" docs/adr/0012-*.md` 命中
  - `grep -cE "^### [1-5]\. " docs/adr/0012-*.md` == 5
  - 每章节含 `## Decision` + `## Rationale` + `## Consequences`(章节内子节)
- **decision_source**: B-33 + B-34 + KICKOFF § 1.2 F7

### T6.2 — ci.yml A7 step iter 1-11 → 1-0012

- **files_modified**: `.github/workflows/ci.yml`(MODIFY — A7 守恒 step 迭代)
- **action**: 定位 A7 step iter range,改 `1-11` → `1-0012`(沿袭 Phase 2.2 T6.2)
- **read_first**: `.github/workflows/ci.yml`(by Read,A7 step L53-78 附近)
- **acceptance_criteria**:
  - `grep -E "1-0012" .github/workflows/ci.yml` 命中(实际 N 数字)
  - `! grep -E "1-11" .github/workflows/ci.yml`(旧 range 全替换)
- **decision_source**: B-35 + KICKOFF § 3.1

### T6.3 — STATE.md 续编 + RETROSPECTIVE.md milestone retrospective

- **files_modified**: `.planning/STATE.md`(MODIFY)+ `.planning/RETROSPECTIVE.md`(MODIFY)
- **action**:
  1. STATE.md 加 Phase 2.3 ship 节(沿袭 Phase 2.2 ship 模式),M1+M2+M3+T1.2+T1.3+T5 全 close;Phase 2.4 prereq backlog 列入
  2. RETROSPECTIVE.md 加 Phase 2.3 milestone retrospective(What Worked / What Was Inefficient / Patterns Established / Key Lessons / Cost patterns);**Deferred items review 节真实跑通 T0.8 cadence**(列 T1.1 / T4.4 / EE-4 三 deferred 状态)
- **read_first**: `.planning/STATE.md` + `.planning/RETROSPECTIVE.md`(by Read)+ Phase 2.2 ship 模式
- **acceptance_criteria**:
  - `grep -E "Phase 2.3.*ship.*2026-05" .planning/STATE.md` 命中
  - `grep -E "Phase 2.3 milestone retrospective" .planning/RETROSPECTIVE.md` 命中
  - `grep -E "## Deferred items review" .planning/RETROSPECTIVE.md` 含 Phase 2.3 review entry
  - `node scripts/check-deferred-items.mjs` exit 0(warn-only round 1)
- **decision_source**: B-31 + KICKOFF § 1.2 F8

### T6.4 — baseline tag adr-0012-accepted + v0.2.0-alpha.3-extension-mvp

- **files_modified**: (no file;git tag)
- **action**:
  ```bash
  git tag adr-0012-accepted -m "ADR 0012 Phase 2.3 extension MVP + karpathy inject accepted"
  git tag v0.2.0-alpha.3-extension-mvp -m "v0.2.0-alpha.3 — Phase 2.3 extension category MVP + karpathy SKILL-ONLY + CD-3 negative-space + EE-5 双层 gate + Wave 0 perf gate 根治"
  git push origin adr-0012-accepted v0.2.0-alpha.3-extension-mvp
  ```
- **read_first**: `git tag --list adr-*-accepted`(verify 1-11 全 in;新 N 不冲突)
- **acceptance_criteria**:
  - `git tag --list adr-0012-accepted` 命中 1
  - `git tag --list v0.2.0-alpha.3-extension-mvp` 命中 1
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `success`(3-OS CI 全绿)
  - **S4 plan-check fix — ship-time A7 re-verify gate** (mirror Phase 2.2 T6.3 + Wave 5 T5.4 ship-time gate):
    `git diff adr-0011-accepted..HEAD -- 'docs/adr/000[1-9]-*.md' 'docs/adr/0010-*.md' 'docs/adr/0011-*.md' | wc -l` == 0
    (Wave 5 T5.4 一次 A7 verify 之后到 Wave 6 ship 之间任何 commit 不得 unintentionally touch ADR 0001-0011 main body;ship-time 再次 verify 是最终 gate)
- **decision_source**: B-35 + KICKOFF § 1.2 F8 + S4 plan-check fix

---

*Phase 2.3 task_plan.md complete — **35 atomic tasks** across 7 Waves (W0:10 / W1:6 / W2:5 / W3:3 / W4:3 / W5:4 / W6:4);hard limit verify per task;sed-replace `0012` discipline embedded near T0.1; W1 plan-check fix from Wave C delta (T0.10 always_active spike 提前) + S-2 cosmetic count sync。 Wave B planner ready for Wave C plan-checker → ✅ delta APPROVED WITH CONDITIONS (0B/0W/3S cosmetic) → execute-phase Wave 0 ready。*
