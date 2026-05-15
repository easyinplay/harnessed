# Phase 2.2 — task_plan.md

> **Resolved (T0.1, 2026-05-15)**: `0011` = **`0011`** (latest ADR on disk = `0010-installer-schema-extension-errata.md` → next = `0011`); `ROADMAP_LATEST_RE` = `/^##\s+v\d+\.\d+\.\d+\s+—.*✅\s*SHIPPED/m` (matches top-level milestone header with `✅ SHIPPED` suffix in `.planning/ROADMAP.md`; latest match → `v0.1.0`); freshness `Status:` marker must additionally carry `Phase 2.1 shipped` token (sourced from STATE.md, sub-phase ship not yet promoted to ROADMAP top-level header — Wave 0 freshness gate validates BOTH tokens via STATUS_MARKER tolerance).

> **Authored**: 2026-05-15
> **Author**: gsd-planner (Wave B)
> **Sources**: KICKOFF § 2 Wave 拓扑 + ASSUMPTIONS § A bar mapping + ASSUMPTIONS § B 31 lock + PATTERNS § 2 code excerpts + RESEARCH § 1.6 / § 2.4 / § 3.5 implementation sketches
> **Style**: 沿袭 phase 1.5 / 2.1 task_plan.md atomic sub-task structure(file path / action concrete values / read_first / acceptance_criteria grep-verifiable / decision source)
> **Task count**: 35 (or 36 if T1.2 SC4 pass) atomic tasks across 7 Waves — delta absorbed 2026-05-15 (T2.0 schemaVersion / T4.0 provenance / T4.4 Task Session conditional + T1.2 SC4 augment)
> **Hard limit verify**: every code-producing task 含 `wc -l` 或 ≤N 行 acceptance criterion

---

## Wave 0 — transparency 一次性根治 + ADR draft

### T0.1 — ADR 编号实占 + ROADMAP latest-shipped token audit

- **files_modified**: (read-only)
- **action**:
  1. 跑 `ls -1 docs/adr/ | grep -E '^[0-9]{4}-.*\.md$' | sort | tail -1` 读最新 ADR 编号,取 `NNNN`
  2. `0011` := `printf '%04d' $((10#NNNN + 1))`(zero-padded 4 digit,e.g. `0011`)
  3. 跑 `head -100 .planning/ROADMAP.md | grep -E '^##\s+(v[0-9.]+|Phase\s+[0-9.]+)'` 读 latest header pattern → 决定 freshness check 的 `ROADMAP_LATEST_RE` regex(RESEARCH § 3.6 open detail)
  4. 把实占 N + ROADMAP_LATEST_RE 决议**记录到本 task_plan.md 第 1 行 frontmatter-style block**(供后续 task 引用)
- **read_first**:
  - `ls docs/adr/`(by Bash)
  - `head -100 .planning/ROADMAP.md`(by Read)
- **acceptance_criteria**:
  - `ls docs/adr/0011-*.md 2>&1` 此时**不存在**(T0.2 才创建)
  - 本 task_plan.md 顶部新增 `> **Resolved**: 0011=NNNN+1, ROADMAP_LATEST_RE=...` block(grep-verifiable)
- **decision_source**: B-21 + RESEARCH § 3.6

> ⚠️ **Placeholder sed-replace discipline (W1 plan-check fix)**: T0.1 resolve `0011` 后,**在 commit 任何 T0.2+ 产物前**,必须对本 task_plan.md + PLAN.md + KICKOFF.md + 所有 NEW ADR/SPEC 文件批量 sed-replace 字面占位:`sed -i "s/0011/<actual-NNNN>/g" .planning/phase-2.2/task_plan.md .planning/phase-2.2/PLAN.md .planning/phase-2.2/KICKOFF.md docs/adr/<actual-NNNN>-*.md`(以及任何 grep 命中的其他文件)。**zero 字面 `0011` 残留**是 W0 commit 前置条件(grep `0011` .planning/phase-2.2/ docs/adr/ 必须 exit 1)。

### T0.2 — ADR 0011 draft(6 章节 sketch)

- **files_modified**: `docs/adr/0011-execute-task-sdk-ralph.md`(NEW)
- **action**: 创建 ADR file 含 6 章节 sketch(详细 Wave 6 T6.1 fill):
  ```markdown
  # ADR 0011: execute-task workflow + ralph-loop SDK introduction
  Status: Draft (phase 2.2 W0 draft → W6 accepted)
  Date: 2026-05-15
  ## Context
  Phase 2.2 路由 routing engine v1 真实 SDK spawn + ralph-loop full integration ...
  ## Decisions
  ### 1. SDK 引入 (B-04)
  ### 2. ralph-wiggum keep (B-05)
  ### 3. dual-signal completion 4-layer (B-02)
  ### 4. contract v1.2 reconcile (B-01)
  ### 5. per-phase model tier schema (B-08~B-13)
  ### 6. Wave 0 transparency CI gate flip + freshness ext (B-14~B-19)
  ## A7 Conservation
  ADR 0001-0010 main body untouched; baseline tag 1-10 → 1-0011; contract v1.1 → v1.2 reconcile via this errata inline (AGENT-DEFINITION-FACTORY-CONTRACT.md main body 不动).
  ## References
  ```
- **read_first**:
  - `docs/adr/0010-*.md`(by Read,作 errata fence pattern 参考)
  - `.planning/phase-2.2/ASSUMPTIONS.md` § B(by Read,锁列表)
- **acceptance_criteria**:
  - `ls docs/adr/0011-*.md` 命中 1 file
  - `grep -E "^### [1-6]\. " docs/adr/0011-*.md | wc -l` == 6
  - `grep "Status: Draft" docs/adr/0011-*.md` 命中
- **decision_source**: B-20 + B-21 + KICKOFF § 3.2

### T0.3 — 13 verdict 文档 manual marker migration

- **files_modified**(13 files,manual 1-by-1):
  - 10 ADD:`.planning/phase-1.1/PLAN-CHECK.md` / `VERIFICATION.md` / `phase-1.2/PLAN-CHECK.md` / `VERIFICATION.md` / `phase-1.3/PLAN-CHECK.md` / `VERIFICATION.md` / `phase-1.4/PLAN-CHECK.md` / `VERIFICATION.md` / `phase-1.5/VERIFICATION.md` / `phase-2.1/VERIFICATION.md`
  - 3 REPAIR:`.planning/phase-1.5/PLAN-CHECK.md`(已有 `**Verdict**` 行但缺 N/N + miss)/ `.planning/v0.1.0-MILESTONE-AUDIT.md`(已有 verdict 但缺 N/N + miss)/ `.planning/phase-2.1/PLAN-CHECK.md`(`0B/4W/5S` 改为 `0/9 BLOCKER` + miss list)
- **action**: 每 file 按 RESEARCH § 2.3 template A/B/C 加 marker 行(top of closure section):
  - PLAN-CHECK template A: `**Verdict:** APPROVED ({N}/{N} BLOCKER, miss: {none | T-X.Y})`
  - VERIFICATION template B: `**Verdict:** SHIPPED ({N}/{N} acceptance bars, miss: {none | bar-X})`
  - MILESTONE-AUDIT template C: `**Verdict:** PASSED ({M}/{M} phases × {N}/{N} bars, miss: {none})`
  - N/N ratio 由各 doc existing content 数(✅ 行 / acceptance bar count / passed task count)— **human-judgment**,non-automate(B-15)
  - miss: 字段若已 ship 写 `none`,若 doc 含明确 miss 罗列(如 phase 1.4 SAMPLES.md 2/30 miss)enumerate
- **read_first**: 每 file 顺序读 by Read,scan closure section 决 N + miss
- **acceptance_criteria**:
  - `node scripts/check-transparency-verdicts.mjs`(此时 ENFORCE=false)stdout `violations = 0`
  - `grep -lE '^\*{0,2}(Verdict|状态|Closure)\*{0,2}\s*:' .planning/**/PLAN-CHECK.md .planning/**/VERIFICATION.md .planning/v0.1.0-MILESTONE-AUDIT.md .planning/phase-2.1/PLAN-CHECK.md | wc -l` == 13
  - `grep -cE '[0-9]+/[0-9]+' .planning/**/PLAN-CHECK.md` ≥ 13(N/N ratio present)
- **decision_source**: B-15 + RESEARCH D2.2-2 + § 2.3 + § 2.4

### T0.4 — freshness ext 扩展 `check-transparency-verdicts.mjs`(+25L)

- **files_modified**: `scripts/check-transparency-verdicts.mjs`(MODIFY +25L)
- **action**: 沿袭 RESEARCH § 3.5 implementation sketch:
  1. 加 import `readFileSync` from `node:fs`(若未 import)
  2. 加 const `STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m`(B-17 tolerance regex)
  3. 加 const `FRONT_MATTER_DOCS = ['README.md', 'docs/PROJECT-SPEC.md']`
  4. 加 fn `getLatestShippedToken()` 用 T0.1 决议的 `ROADMAP_LATEST_RE` 扫 `.planning/ROADMAP.md` 返回 latest shipped token(e.g. `'Phase 2.1'`)
  5. 加 fn `checkFreshness()` 扫 `FRONT_MATTER_DOCS` 前 50 行匹配 `STATUS_MARKER` + `match[1].includes(latestToken)`,collect violations to existing `violations` array
  6. main 末尾 call `checkFreshness()` append to violations,**统一 ENFORCE gate**(T0.6 flip 时同时控两 check)
  7. 文件总长 45L → ~70L(单 file,无需 split)
- **read_first**:
  - `scripts/check-transparency-verdicts.mjs`(by Read,全文 45L)
  - `.planning/ROADMAP.md` 首 100 行(by Read,验 ROADMAP_LATEST_RE 真扫得到 token)
- **acceptance_criteria**:
  - `wc -l scripts/check-transparency-verdicts.mjs` 输出 ≤ 75
  - `grep -n "STATUS_MARKER\|FRONT_MATTER_DOCS\|checkFreshness\|getLatestShippedToken" scripts/check-transparency-verdicts.mjs | wc -l` ≥ 4(四 symbol 都 present)
  - `node scripts/check-transparency-verdicts.mjs`(ENFORCE 仍 false)报告 freshness 状态(README/PROJECT-SPEC 此时**应**报 missing Status: marker → 准备 T0.5)
- **decision_source**: B-16 + B-17 + RESEARCH D2.2-3 + § 3.5

### T0.5 — README + PROJECT-SPEC 加 `Status:` marker + TRANSPARENCY-VERDICT-CHECKLIST 加 § Status freshness

- **files_modified**: `README.md`(MODIFY,加 1 行 marker)+ `docs/PROJECT-SPEC.md`(MODIFY,加 1 行 marker)+ `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`(MODIFY,加 § Status freshness markers 节)
- **action**:
  1. `README.md` 前 50 行内(顶部 title block 后),加:
     ```markdown
     > **Status:** v0.1.0 shipped + Phase 2.1 shipped — execute-task workflow in Phase 2.2 (in-progress)
     ```
  2. `docs/PROJECT-SPEC.md` 顶部 same marker(可调措辞)
  3. `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 加新章节 `## Status freshness markers`(~15 行)记录:
     - convention `**Status:** <phase milestone tokens>`
     - regex `STATUS_MARKER` 容忍 optional `>` + optional `**`
     - check scope `FRONT_MATTER_DOCS = ['README.md', 'docs/PROJECT-SPEC.md']`
     - false-positive note(B-17 rationale)
- **read_first**:
  - `README.md` 前 50 行
  - `docs/PROJECT-SPEC.md` 前 50 行
  - `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`(by Read,验现章节结构)
- **acceptance_criteria**:
  - `head -50 README.md | grep -cE '^\s*>?\s*\*{0,2}Status\*{0,2}\s*[:：]'` == 1
  - `head -50 docs/PROJECT-SPEC.md | grep -cE '^\s*>?\s*\*{0,2}Status\*{0,2}\s*[:：]'` == 1
  - `grep -E '## Status freshness markers' docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 命中
  - `node scripts/check-transparency-verdicts.mjs`(ENFORCE 仍 false)stdout `violations = 0`(13 verdict + 2 Status: marker 全合规)
- **decision_source**: B-16 + RESEARCH § 3.4

### T0.6 — `ENFORCE = true` atomic flip(独立 commit)

- **files_modified**: `scripts/check-transparency-verdicts.mjs`(MODIFY 单行)
- **action**: 单 1 行改动 `const ENFORCE = false` → `const ENFORCE = true`;**no other change in this commit**(B-18 atomic);commit message: `chore(phase-2.2-w0): flip transparency gate ENFORCE=true (Phase 2.1 T1.7 W3 lock 解除)`
- **read_first**: `scripts/check-transparency-verdicts.mjs`(by Read,定位 ENFORCE line)
- **acceptance_criteria**:
  - `grep -n "const ENFORCE = true" scripts/check-transparency-verdicts.mjs | wc -l` == 1
  - `git log -1 --format=%s` matches `chore(phase-2.2-w0): flip transparency gate ENFORCE=true`
  - `git show --stat HEAD` 输出**单 file diff**(只 check-transparency-verdicts.mjs +1 -1)
  - `node scripts/check-transparency-verdicts.mjs` exit code == 0
- **decision_source**: B-14 + B-18 + RESEARCH D2.2-6

### T0.7 — 3-OS CI 跑通 gate verify

- **files_modified**: (no file modify;CI run-only)
- **action**: push T0.1~T0.6 commits to remote;trigger CI;monitor `gh run watch`(若该 CLI 可用)or `gh run list --limit 1 --json conclusion`
- **read_first**: `ci.yml`(by Read,验 transparency step 存在 + 3-OS matrix)
- **acceptance_criteria**:
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `success`
  - 3-OS matrix(`ubuntu-latest` / `macos-latest` / `windows-latest`)all `success`
  - CI log 含 `node scripts/check-transparency-verdicts.mjs` step 输出 `violations = 0`
- **decision_source**: B-19 + KICKOFF § 1.2 F1

---

## Wave 1 — SDK spike + 引入

### T1.1 — SDK version 复核 + .d.ts 14→4 字段 verify

- **files_modified**: (read-only,knowledge gather)
- **action**:
  1. 跑 `npm view @anthropic-ai/claude-agent-sdk version` 取 currentVer
  2. `npm view @anthropic-ai/claude-agent-sdk versions --json` 输出含 currentVer >= 0.2.141 verify(research baseline)
  3. 临时 install `npm i --no-save @anthropic-ai/claude-agent-sdk@<currentVer>` 到 tmpdir
  4. 验 `node_modules/@anthropic-ai/claude-agent-sdk/dist/*.d.ts` 含 `AgentDefinition` type 且 `description`/`prompt`/`tools`/`model` 4 字段(B-01 reconcile 前提)
  5. 记录 currentVer 到本 task_plan.md(Resolved 区块)
- **read_first**: PATTERNS § 2.3 (14 字段映射) + ASSUMPTIONS B-01 / B-03
- **acceptance_criteria**:
  - currentVer ≥ `0.2.141`(若 currentVer < 0.2.141 → BLOCKER,RESEARCH valid 失效)
  - `.d.ts` 含 `interface AgentDefinition` + 4 字段(否则 reconcile invalid)
  - 本 task_plan.md 含 `> **Resolved (T1.1)**: SDK version = X.Y.Z, .d.ts 4 字段 verified`
- **decision_source**: B-03 + B-04 + CONTEXT D-03

### T1.2 — Spike `scripts/spike-outputFormat-agents.mjs`(Win 实跑 + throwaway)

- **files_modified**: `scripts/spike-outputFormat-agents.mjs`(NEW,**throwaway,Wave 1 末 delete,NOT committed**,B-06)
- **action**: 沿袭 RESEARCH § 1.6 spike script 模板:
  ```javascript
  // scripts/spike-outputFormat-agents.mjs(throwaway,B-06)
  import { query } from '@anthropic-ai/claude-agent-sdk'
  const COMPLETION_SCHEMA = { type: 'object', properties: { status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] } }, required: ['status'] }
  for await (const message of query({
    prompt: '...',
    options: {
      allowedTools: ['Read', 'Task'],
      agents: { 'code-reviewer': { description: '...', prompt: '...', tools: ['Read'], model: 'haiku' } },
      outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA },
    },
  })) { /* log message */ }
  ```
  Win Git Bash 实跑(B-31 Win 兼容验证);记录 3 success criterion 结果(RESEARCH § 1.6):
  - SC1: query() 接受 options 无 TS / runtime reject?
  - SC2: subtype === 'success'?
  - SC3: structured_output 有值 OR `<promise>COMPLETE</promise>` extractable?
- **read_first**: RESEARCH § 1.6(spike outline)+ § 1.5(degraded fallback tiers)
- **acceptance_criteria**:
  - Spike script 运行成功:Win 退出 0 + SC1 + SC2 pass
  - SC3 PRIMARY(structured_output 有值)→ Wave 2-4 走 PRIMARY 路径
  - SC3 fallback(structured_output 空但 `<promise>` extract)→ Wave 2-4 走 Tier A fallback(non-blocker,B-07)
  - **Spike 末 `rm scripts/spike-outputFormat-agents.mjs`(B-06,NOT committed)**;git status 不含此 file
- **decision_source**: B-06 + B-07 + RESEARCH § 1.5 + § 1.6 + D2.2-5

> **Delta augment (2026-05-15, B-35 / D-18)** — SC4 added: verify `@anthropic-ai/claude-agent-sdk` 暴露 session resume API。
> - **SC4 acceptance**:① `.d.ts` 含 `resume?: string` option on `query()`(necessary)② spike 实测 resume 后 agent state(memory / tools / conversation history)carry to new query() call(sufficient,omo `task_sessions[task_key]` 语义)
> - **SC4 outcome record**:跑完 spike 在本 task_plan.md 顶部 Resolved block 加 `> **Resolved (T1.2 SC4)**: SDK session resume API = pass/fail, branch = Wave 4 T4.4 active/deferred`
> - **Branch impact**:SC4 pass → Wave 4 T4.4 active(phase manifest 加 `task_session_id?: string`);SC4 fail → Wave 4 T4.4 skip,CD-4 转 v0.3.0 deferred(non-blocker)
> - **decision_source (delta)**:B-35 + B-36 + CONTEXT D-18 + intel CD-4(L139-147)

### T1.3 — `npm i @anthropic-ai/claude-agent-sdk` + lockfile verify

- **files_modified**: `package.json`(MODIFY +1 dep)+ `package-lock.json`(MODIFY by npm)
- **action**:
  1. `npm i --save @anthropic-ai/claude-agent-sdk@<T1.1 currentVer>`
  2. verify `package.json` `dependencies` 含 entry
  3. verify `package-lock.json` 含 integrity hash + resolved URL
  4. `npm run typecheck` pass(SDK type 解析 OK)
- **read_first**: `package.json`(by Read)+ T1.1 currentVer
- **acceptance_criteria**:
  - `grep -E '"@anthropic-ai/claude-agent-sdk"' package.json` 命中
  - `grep -A2 '"@anthropic-ai/claude-agent-sdk"' package-lock.json | grep -E 'integrity|resolved'` 命中
  - `npx tsc --noEmit` pass
- **decision_source**: B-04 + KICKOFF § 1.2 F3

### T1.4 — 3-OS CI verify SDK install + smoke import test

- **files_modified**: `tests/sdk-import.smoke.test.ts`(NEW ~20L,minimal smoke)
- **action**:
  ```typescript
  // tests/sdk-import.smoke.test.ts
  import { describe, it, expect } from 'vitest'
  import { query } from '@anthropic-ai/claude-agent-sdk'
  describe('SDK smoke import', () => {
    it('query is a function', () => { expect(typeof query).toBe('function') })
    it('SDK module resolves on this OS', () => { expect(query).toBeDefined() })
  })
  ```
  push commits + watch 3-OS CI
- **read_first**: 本 repo 任何现 `tests/*.test.ts`(by Glob,沿袭 vitest pattern)
- **acceptance_criteria**:
  - `npm test -- tests/sdk-import.smoke.test.ts` local pass
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `success`
  - 3-OS matrix all `success`
- **decision_source**: B-04 + B-31 + KICKOFF § 1.2 F3

---

## Wave 2 — agentFactory contract v1.2 reconcile + dual-signal 4-layer

### T2.0 — schemaVersion infrastructure NEW(7 surface naming + consumer branch helper)— delta D-16 / B-32

- **files_modified**: `src/types/schemaVersion.ts`(NEW ~30L)+ `docs/SCHEMA-VERSION-CONVENTION.md`(NEW ~50L)— OR Wave 2 executor decides TypeBox schema vs convention-only doc
- **action**: 沿袭 CD-5 ⭐⭐⭐ ECC pattern(intel L149-157)— 7 surface 单一兼容门:
  1. naming 约定 `harnessed.<surface>.v1`(7 surface 列表 B-32:routing snapshot / handoff doc / phases.yaml / manifest state / installer state / route decision log / checkpoint)
  2. 写 `src/types/schemaVersion.ts` 含 `type SchemaVersion<S extends string> = \`harnessed.\${S}.v1\`` + `SCHEMA_VERSIONS` const map(7 entry)+ helper `branchOnSchemaVersion<T>(v: string, handlers: { v1: () => T; unknown: () => T }): T`
  3. 3 rules 文档化(`docs/SCHEMA-VERSION-CONVENTION.md`):(a) consumer 必须 branch-on-version,(b) 未知 enum 值 graceful degrade(adapter-specific 字符串 = 合法,视作 `unknown`-bucket,不 fail),(c) 新增字段必须 nested 不能 top-level
  4. **纯学不 vendor**(intel CD-5 实施约束)— 引擎层算法结构,不引入 ECC 外部代码
  5. T2.1 / T2.2 / T2.3 / T2.4 / T3.1 / T3.3 等后续 schema-producing task 必引用此 const,实际 7 surface 字段引入分布在 Wave 2-4(routing snapshot / phases.yaml / manifest state 等)
- **read_first**:
  - `.planning/intel/omc-comparison.md` § CD-5(L149-157)
  - ASSUMPTIONS B-32(7 surface 列表)
  - ADR 0011 § 7 SchemaVersion(T0.2 sketch)
- **acceptance_criteria**:
  - `ls src/types/schemaVersion.ts` 命中(or convention-only doc 命中)
  - `grep -E 'harnessed\.\w+\.v1' src/types/schemaVersion.ts` 命中 ≥ 7(7 surface 都列入)
  - `grep -E 'branchOnSchemaVersion|SCHEMA_VERSIONS' src/types/schemaVersion.ts` 命中
  - `npx tsc --noEmit` pass
  - Wave 2 末 verify(F4 reproduction):`grep -E 'schemaVersion.*harnessed\.\w+\.v1' src/types/*.ts src/routing/*.ts src/workflow/*.ts | wc -l` ≥ 7(7 surface 真实引入字段位)
- **decision_source**: B-32 + CONTEXT D-16 + intel CD-5(L149-157)+ ADR 0011 § 7

### T2.1 — `src/routing/lib/sdkReconcile.ts` NEW

- **files_modified**: `src/routing/lib/sdkReconcile.ts`(NEW ~60-80L)
- **action**: 沿袭 PATTERNS § 2.3 ADAPT spec:
  ```typescript
  // src/routing/lib/sdkReconcile.ts(NEW)
  // ADR 0011 errata — contract v1.2 reconcile (phase 2.2 W2 — F4).
  // Splits 2 helper fn from agentDefinition.ts to keep agentDefinition.ts ≤200L hard limit (B-24).
  import type { AgentDefinition } from '../agentDefinition.js'
  import type { AgentDefinition as SdkAgentDef } from '@anthropic-ai/claude-agent-sdk'

  /** Unpack 14 字段 → 4 字段 SDK input(B-01)。 */
  export function toSdkAgentDefinition(def: AgentDefinition): SdkAgentDef {
    return {
      description: def.description,
      prompt: def.prompt,
      ...(def.tools ? { tools: def.tools } : {}),
      ...(def.model ? { model: def.model } : {}),
    }
  }

  /** 10 字段 prompt-inject(B-01,沿袭 KARPATHY_BASELINE prepend pattern)。 */
  export function injectFactoryInternalFields(def: AgentDefinition, basePrompt: string): string {
    const parts: string[] = [basePrompt]
    if (def.criticalSystemReminder_EXPERIMENTAL) parts.push(`## CRITICAL\n${def.criticalSystemReminder_EXPERIMENTAL}`)
    if (def.skills?.length) parts.push(`## Available skills\n- ${def.skills.join('\n- ')}`)
    if (def.maxTurns) parts.push(`## Turn budget\n${def.maxTurns} turns max.`)
    if (def.disallowedTools?.length) parts.push(`## Disallowed tools\n${def.disallowedTools.join(', ')}`)
    if (def.background) parts.push(`## Background\n${def.background}`)
    if (def.effort) parts.push(`## Effort\n${def.effort}`)
    if (def.permissionMode) parts.push(`## Permission mode\n${def.permissionMode}`)
    if (def.initialPrompt) parts.push(`## Initial prompt\n${def.initialPrompt}`)
    if (def.mcpServers && Object.keys(def.mcpServers).length) parts.push(`## MCP servers\n${Object.keys(def.mcpServers).join(', ')}`)
    if (def.memory) parts.push(`## Memory\n${JSON.stringify(def.memory)}`)
    return parts.join('\n\n')
  }
  ```
- **read_first**:
  - `src/routing/agentDefinition.ts`(by Read,L37 14 字段)
  - PATTERNS § 2.3
  - T1.1 验 SDK `.d.ts` `SdkAgentDef` type 4 字段
- **acceptance_criteria**:
  - `ls src/routing/lib/sdkReconcile.ts` 命中
  - `wc -l src/routing/lib/sdkReconcile.ts` ≤ 80
  - `grep -E "export function (toSdkAgentDefinition|injectFactoryInternalFields)" src/routing/lib/sdkReconcile.ts | wc -l` == 2
  - `npx tsc --noEmit` pass
  - `grep "ADR 0011" src/routing/lib/sdkReconcile.ts` 命中(B-30 fence)
- **decision_source**: B-01 + B-24 + PATTERNS D-WP-5 + § 2.3

### T2.2 — `src/routing/completionSchema.ts` NEW(Unified COMPLETION_SCHEMA)

- **files_modified**: `src/routing/completionSchema.ts`(NEW ~30L)
- **action**: 沿袭 RESEARCH § 1.4 unified schema spec:
  ```typescript
  // src/routing/completionSchema.ts(NEW)
  // ADR 0011 errata — dual-signal completion 4-layer (phase 2.2 W2 — F4).
  // Unified COMPLETION_SCHEMA(D2.2-1)— 4 phase chain 共享一 schema,Karpathy YAGNI (RESEARCH § 1.4).
  export const COMPLETION_SCHEMA = {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
      phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
      summary: { type: 'string' },
      blockers: { type: 'array', items: { type: 'string' } },
    },
    required: ['status', 'phase'],
  } as const
  export type CompletionStatus = 'COMPLETE' | 'PARTIAL' | 'BLOCKED'
  export type CompletionPhase = '01-clarify' | '02-code' | '03-test' | '04-deliver'
  ```
- **read_first**: RESEARCH § 1.4 + § 1.3(4-layer dual-signal)
- **acceptance_criteria**:
  - `wc -l src/routing/completionSchema.ts` ≤ 35
  - `grep -E "export const COMPLETION_SCHEMA" src/routing/completionSchema.ts | wc -l` == 1
  - `grep -E "'COMPLETE'.*'PARTIAL'.*'BLOCKED'" src/routing/completionSchema.ts` 命中
  - `grep -E "'01-clarify'.*'02-code'.*'03-test'.*'04-deliver'" src/routing/completionSchema.ts` 命中
  - `npx tsc --noEmit` pass
- **decision_source**: B-02 + RESEARCH D2.2-1 + § 1.4

### T2.3 — `src/routing/systemPrompt.ts` 加 schema const + prompt 段

- **files_modified**: `src/routing/systemPrompt.ts`(MODIFY +~25L)
- **action**: 现 53L → ~78L(B-27 仍 ≤80L 守住):
  1. import `COMPLETION_SCHEMA` from `./completionSchema.js`
  2. 在 `SYSTEM_PROMPT` 末尾 append 1 段 belt-and-suspenders 注入(沿袭 PATTERNS § 2.3 推荐):
     ```typescript
     // ADR 0011 errata — dual-signal PRIMARY schema inject (phase 2.2 W2 — F4).
     export const SYSTEM_PROMPT = `${EXISTING_SYSTEM_PROMPT}

     ## Completion signal (dual-signal — emit BOTH)
     If \`outputFormat: { type: 'json_schema' }\` is set on this query, emit a final-turn output conforming to the schema (status/phase/summary/blockers).
     AND emit \`<promise>COMPLETE</promise>\` (FALLBACK signal — required regardless of structured output presence,for inner-layer subagent completion detection per RESEARCH § 1.3).`
     ```
  3. **不动** verbatim `COMPLETE_INSTRUCTION` const(contract 1:1 锁)
- **read_first**:
  - `src/routing/systemPrompt.ts`(by Read,53L 全文)
  - PATTERNS § 2.3 + RESEARCH § 1.3
- **acceptance_criteria**:
  - `wc -l src/routing/systemPrompt.ts` ≤ 80(B-27 守住)
  - `grep -E "import.*COMPLETION_SCHEMA.*from '\\./completionSchema" src/routing/systemPrompt.ts` 命中
  - `grep -E "Completion signal \\(dual-signal" src/routing/systemPrompt.ts` 命中
  - `grep -E "export const COMPLETE_INSTRUCTION" src/routing/systemPrompt.ts | wc -l` == 1(verbatim 1:1 守住,不动)
  - `npx tsc --noEmit` pass
- **decision_source**: B-02 + B-27 + PATTERNS § 2.3 + § 2.5 row 5

### T2.4 — `src/routing/lib/ralphLoop.ts` 升级 isComplete 4-layer + resumeSessionId 闭包

- **files_modified**: `src/routing/lib/ralphLoop.ts`(MODIFY,42L → ~48L,B-26 ≤50L)
- **action**:
  1. 升级 `isComplete()`(L11-14)为 4-layer dual-signal(沿袭 PATTERNS § 2.4 spec):
     ```typescript
     export function isComplete(output: string): boolean {
       try {
         const env = JSON.parse(output) as { subtype?: string; structured_output?: { status?: string }; text?: string; result?: string }
         // outer PRIMARY: structured_output
         if (env.subtype === 'success' && env.structured_output?.status === 'COMPLETE') return true
         // outer FALLBACK: <promise> grep on result text
         const resultText = env.text ?? env.result ?? ''
         if (extractPromise(resultText) === 'COMPLETE') return true
         return false
       } catch {
         // 非 JSON(raw string,test mock or degraded)→ inner PRIMARY: <promise> grep(B-07 Tier B path)
         return extractPromise(output) === 'COMPLETE'
       }
     }
     ```
  2. `ralphLoopWrap` 加 `resumeSessionId` 闭包(沿袭 PATTERNS § 2.2):
     ```typescript
     export async function ralphLoopWrap(
       spawn: (resumeSessionId?: string) => Promise<string>,
       maxIter: number,
     ): Promise<string> {
       let last = '', sessionId: string | undefined
       for (let i = 0; i < maxIter; i++) {
         last = await spawn(sessionId)
         if (isComplete(last)) return last
         // sessionId 由 spawn 内部 callback 更新(T4.1 sdkSpawn 实装)
       }
       throw new MaxIterationsExceededError(maxIter)
     }
     ```
- **read_first**:
  - `src/routing/lib/ralphLoop.ts`(by Read,42L 全文)
  - PATTERNS § 2.2 + § 2.4
  - RESEARCH § 1.3 4-layer table
- **acceptance_criteria**:
  - `wc -l src/routing/lib/ralphLoop.ts` ≤ 50(B-26 守住 D1.4-3)
  - `grep -E "(resumeSessionId|sessionId)" src/routing/lib/ralphLoop.ts | wc -l` ≥ 3
  - `grep -E "JSON\\.parse|env\\.structured_output|env\\.text" src/routing/lib/ralphLoop.ts | wc -l` ≥ 2
  - `grep -E "extractPromise" src/routing/lib/ralphLoop.ts | wc -l` ≥ 2(用 2 path)
  - `npx tsc --noEmit` pass
- **decision_source**: B-02 + B-26 + PATTERNS § 2.2 + § 2.4 + RESEARCH § 1.3

### T2.5 — Tests:sdkReconcile + isComplete dual-signal 4 path

- **files_modified**: `tests/routing/sdk-reconcile.test.ts`(NEW)+ `tests/routing/isComplete.test.ts`(NEW)
- **action**:
  - `sdk-reconcile.test.ts`:① `toSdkAgentDefinition` 输出仅 4 字段 + optional 字段缺失正确 strip;② `injectFactoryInternalFields` 10 字段全注入正确;③ 缺字段 部分 strip 正确
  - `isComplete.test.ts` 4 path:① outer PRIMARY pass(JSON envelope w/ structured_output.status='COMPLETE')→ true;② outer FALLBACK pass(JSON envelope w/ `<promise>COMPLETE</promise>` text)→ true;③ inner FALLBACK / raw string mode(`<promise>COMPLETE</promise>` raw)→ true;④ all signal fail(JSON envelope `status='PARTIAL'` + no `<promise>`)→ false
- **read_first**:
  - `tests/routing/routing-engine.test.ts`(若存在,by Glob,验 vitest 现 pattern)
- **acceptance_criteria**:
  - `npm test -- tests/routing/sdk-reconcile.test.ts tests/routing/isComplete.test.ts` 全 pass
  - sdk-reconcile.test.ts 含 ≥ 3 test case
  - isComplete.test.ts 含 ≥ 4 test case(4-layer 每 layer 1 case)
  - `npx tsc --noEmit` pass
- **decision_source**: B-02 + B-07 + RESEARCH § 1.3

---

## Wave 3 — per-phase model tier schema

### T3.1 — `src/workflow/schema/phases.ts` NEW(TypeBox)

- **files_modified**: `src/workflow/schema/phases.ts`(NEW ~80-100L)+ `src/workflow/`(NEW dir)
- **action**: 沿袭 PATTERNS § 3.1 TypeBox 模板:
  ```typescript
  // src/workflow/schema/phases.ts(NEW)
  // ADR 0011 errata — per-phase model tier schema (phase 2.2 W3 — F5).
  // ModelTier 4-enum(haiku/sonnet/opus/inherit),defaults per intel 第 4 条 表:
  //   01-clarify=opus/sonnet, 02-code=sonnet, 03-test=sonnet/haiku, 04-deliver=haiku.
  // `--model-tier inherit` CLI flag override 逃生口(B-10)。
  import { Type, type Static } from '@sinclair/typebox'

  export const ModelTier = Type.Union([
    Type.Literal('haiku'),
    Type.Literal('sonnet'),
    Type.Literal('opus'),
    Type.Literal('inherit'),  // B-10 override 逃生口
  ])

  export const PhaseEntry = Type.Object(
    {
      id: Type.String({ minLength: 1 }),         // e.g. '01-clarify'
      name: Type.String({ minLength: 1 }),
      upstream: Type.String({ minLength: 1 }),    // e.g. 'superpowers brainstorming'
      model: ModelTier,                           // 必填(B-08)
      skills: Type.Optional(Type.Array(Type.String())),
      max_iterations: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    },
    { additionalProperties: false },
  )

  export const PhasesSchema = Type.Object(
    {
      workflow: Type.String({ minLength: 1 }),    // e.g. 'execute-task'
      phases: Type.Array(PhaseEntry, { minItems: 1 }),
    },
    { additionalProperties: false },
  )

  export type PhaseEntryType = Static<typeof PhaseEntry>
  export type PhasesSchemaType = Static<typeof PhasesSchema>
  ```
- **read_first**:
  - `src/manifest/schema/spec.ts`(by Read,L20-189 沿袭 pattern)
  - PATTERNS § 3.1
- **acceptance_criteria**:
  - `wc -l src/workflow/schema/phases.ts` ≤ 100
  - `grep -E "(ModelTier|PhaseEntry|PhasesSchema)" src/workflow/schema/phases.ts | wc -l` ≥ 6
  - `grep -E "'haiku'.*'sonnet'.*'opus'.*'inherit'" src/workflow/schema/phases.ts` 命中
  - `grep "additionalProperties: false" src/workflow/schema/phases.ts | wc -l` ≥ 2
  - `npx tsc --noEmit` pass
- **decision_source**: B-08 + B-10 + B-13 + B-30 + PATTERNS D-WP-1 + § 3.1

### T3.2 — `src/workflow/loadPhases.ts` NEW(parse + validate)

- **files_modified**: `src/workflow/loadPhases.ts`(NEW ~50-60L)
- **action**: 沿袭 `src/manifest/loadManifest.ts` pattern:
  ```typescript
  // src/workflow/loadPhases.ts(NEW)
  import { readFileSync } from 'node:fs'
  import { parse as parseYaml } from 'yaml'
  import { Value } from '@sinclair/typebox/value'
  import { PhasesSchema, type PhasesSchemaType } from './schema/phases.js'

  export class PhasesValidationError extends Error {
    constructor(public errors: ReturnType<typeof Value.Errors>) { super(`phases.yaml validation failed`) }
  }

  export function loadPhases(yamlPath: string): PhasesSchemaType {
    const raw = readFileSync(yamlPath, 'utf8')
    const parsed = parseYaml(raw)
    if (!Value.Check(PhasesSchema, parsed)) {
      throw new PhasesValidationError(Value.Errors(PhasesSchema, parsed))
    }
    return parsed
  }
  ```
- **read_first**:
  - `src/manifest/loadManifest.ts`(若存在,by Glob,沿袭 parse + validate pattern)
  - T3.1 PhasesSchema export
- **acceptance_criteria**:
  - `wc -l src/workflow/loadPhases.ts` ≤ 60
  - `grep -E "(loadPhases|PhasesValidationError)" src/workflow/loadPhases.ts | wc -l` ≥ 2
  - `grep -E "Value\\.Check|Value\\.Errors" src/workflow/loadPhases.ts | wc -l` ≥ 2
  - `npx tsc --noEmit` pass
- **decision_source**: B-08 + B-13 + PATTERNS § 5(D-WP-1 row "Truly NEW patterns")

### T3.3 — `workflows/execute-task/phases.yaml` NEW(4 phase × intel 第 4 条默认表)

- **files_modified**: `workflows/execute-task/phases.yaml`(NEW)+ `workflows/execute-task/`(NEW dir)
- **action**:
  ```yaml
  # workflows/execute-task/phases.yaml
  workflow: execute-task
  phases:
    - id: 01-clarify
      name: brainstorming
      upstream: superpowers brainstorming
      model: opus            # intel 第 4 条:opus / sonnet 任务复杂度
      skills: ['brainstorming']
      max_iterations: 5
    - id: 02-code
      name: code (karpathy 心法 always-on)
      upstream: karpathy
      model: sonnet
      max_iterations: 20
    - id: 03-test
      name: test (conditional TDD + mattpocock 招式)
      upstream: superpowers TDD
      model: sonnet          # intel 第 4 条:sonnet / haiku
      skills: ['test-driven-development']
      max_iterations: 15
    - id: 04-deliver
      name: deliver (ralph-loop COMPLETE)
      upstream: ralph-loop
      model: haiku           # intel 第 4 条 04-deliver=haiku(省 token)
      max_iterations: 20
  ```
- **read_first**:
  - intel `omc-comparison.md` 第 4 条(by Read,model 默认表 source of truth)
  - T3.1 PhasesSchema type 验 yaml shape compatible
- **acceptance_criteria**:
  - `ls workflows/execute-task/phases.yaml` 命中
  - `node -e "const {loadPhases} = require('./dist/workflow/loadPhases.js'); const p = loadPhases('workflows/execute-task/phases.yaml'); console.log(p.phases.map(x => x.model).join(','))"` 输出 `opus,sonnet,sonnet,haiku`
  - `grep -E "^\\s*model:\\s*(haiku|sonnet|opus)$" workflows/execute-task/phases.yaml | wc -l` == 4
  - `grep -E "^\\s*id:\\s*(01-clarify|02-code|03-test|04-deliver)" workflows/execute-task/phases.yaml | wc -l` == 4
- **decision_source**: B-08 + B-09 + B-12 + intel 第 4 条

### T3.4 — Tests:`loadPhases.test.ts`

- **files_modified**: `tests/workflow/load-phases.test.ts`(NEW)
- **action**:
  1. valid path:load `workflows/execute-task/phases.yaml` returns shape match,4 phase entry,model 字段全 valid
  2. invalid path - missing `model:` 字段 yaml fixture → throw `PhasesValidationError`
  3. invalid path - `model: invalid-tier` 非 4-enum → throw
  4. invalid path - `additionalProperties` violation(yaml 含 unknown 顶层字段)→ throw
  5. valid path - `model: inherit` ok(B-10)
- **read_first**: T3.1 PhasesSchema + T3.2 loadPhases + T3.3 yaml instance
- **acceptance_criteria**:
  - `npm test -- tests/workflow/load-phases.test.ts` 全 pass
  - 含 ≥ 5 test case(对应 1-5)
  - `npx tsc --noEmit` pass
- **decision_source**: B-08 + B-10 + B-13

---

## Wave 4 — ralph-loop full integration 主流程

### T4.0 — provenance.schema.json NEW + composition/installer enforce(hard gate prereq)— delta D-17 / B-33+B-34

- **files_modified**: `provenance.schema.json`(NEW ~5KB / ~60L JSON schema)+ `scripts/check-provenance.mjs`(NEW ~50L)+ existing composition skill / installer hook 文件(MODIFY,加 enforce call)
- **action**: 沿袭 CD-6 ⭐⭐ ECC pattern(intel L159-167)— BEFORE-W4 hard gate:
  1. 写 `provenance.schema.json`(JSON Schema Draft 2020-12)含 4 字段:
     - `source` enum:`curated` / `learned` / `imported` / `evolved`(沿袭 ECC SKILL-PLACEMENT-POLICY.md 4 类产源)
     - `created_at` string format date-time(ISO 8601)
     - `confidence` number minimum 0 maximum 1(curated=1.0;evolved 视演化次数 decay)
     - `author` string minLength 1(subagent name OR human user OR ralph-loop iteration id)
     - top-level `required: ['source', 'created_at', 'confidence', 'author']` + `additionalProperties: false`
  2. 写 `scripts/check-provenance.mjs`(沿袭 `check-transparency-verdicts.mjs` walker pattern):
     - scope 限定 runtime artifact path:`.harnessed/sessions/**`、`.harnessed/checkpoints/**`、`.harnessed/route-logs/**` 等(R8 mitigation — 不扫 curated path 如 `workflows/**/SKILL.md`、`manifest.yaml`)
     - 任何 runtime artifact 必须 sibling `.provenance.json`,否则 violation
     - validate `.provenance.json` against `provenance.schema.json`(用 `ajv` 或手写最小 validator)
     - violations > 0 → exit 1(hard fail)
  3. composition skill / installer 加 enforce hook:产 runtime artifact 时同步写 sibling `.provenance.json`(具体 hook 形式由 executor 决,可选 commit-time hook OR runtime auto-write)
  4. CI integration:在 `ci.yml` 加 step `node scripts/check-provenance.mjs`(在 transparency gate step 之后,W4 工作开始之前 — 即本 Wave 4 第一步)
  5. 3-OS sentinel:Win Git Bash 跑 check-provenance.mjs verify
- **read_first**:
  - `.planning/intel/omc-comparison.md` § CD-6(L159-167)
  - ASSUMPTIONS B-33 + B-34
  - ADR 0011 § 8 Provenance gate(T0.2 sketch)
  - `scripts/check-transparency-verdicts.mjs`(walker pattern 参考)
- **acceptance_criteria**:
  - `ls provenance.schema.json scripts/check-provenance.mjs` 命中 2 file
  - `node -e "const s = require('./provenance.schema.json'); console.log(Object.keys(s.properties).sort().join(','))"` 输出 `author,confidence,created_at,source`
  - `wc -l provenance.schema.json` ≤ 100(~5KB target)
  - `wc -l scripts/check-provenance.mjs` ≤ 80
  - **Hard fail test**:在 `.harnessed/sessions/test-no-provenance/dummy.md` 创个无 sibling provenance 的文件 → `node scripts/check-provenance.mjs` exit code == 1 + stderr 含 violation path → 然后补 sibling → exit 0 → cleanup test fixture
  - CI step 加入 verify(ci.yml grep 命中 `check-provenance.mjs` step)
  - **Scope verify**:在 `workflows/execute-task/SKILL.md`(curated path)旁不需要 `.provenance.json`,check-provenance.mjs 不扫(`grep -E 'workflows/' scripts/check-provenance.mjs` 输出 walker exclusion regex 中含 `workflows/`)
- **decision_source**: B-33 + B-34 + CONTEXT D-17 + intel CD-6(L159-167)+ ADR 0011 § 8

### T4.1 — `src/routing/lib/sdkSpawn.ts` NEW(query() async-iterable consumer)

- **files_modified**: `src/routing/lib/sdkSpawn.ts`(NEW ~80-120L)
- **action**: 沿袭 PATTERNS § 2.2 ADAPT spec + RESEARCH § 3.1 executeSubtask shape:
  ```typescript
  // src/routing/lib/sdkSpawn.ts(NEW)
  // ADR 0011 errata — SDK introduction + ralph-loop full integration (phase 2.2 W4 — F6).
  // engine.ts ≤200L hard limit 守 → split sdkSpawn 到此(B-25)。
  import { query, type SDKResultMessage } from '@anthropic-ai/claude-agent-sdk'
  import type { AgentDefinition } from '../agentDefinition.js'
  import { toSdkAgentDefinition, injectFactoryInternalFields } from './sdkReconcile.js'
  import { COMPLETION_SCHEMA } from '../completionSchema.js'

  export interface SdkSpawnOpts {
    expertName: string
    resumeSessionId?: string
    onSessionId?: (id: string) => void
  }

  export class SpawnFailError extends Error {
    constructor(public lastMessage?: SDKResultMessage) { super('sdkSpawn produced no result message') }
  }

  /** Spawn a subagent via SDK query() — main-process async-iterable consumer。
   *  Returns JSON envelope string consumed by ralphLoopWrap.isComplete (4-layer dual-signal). */
  export async function sdkSpawn(def: AgentDefinition, opts: SdkSpawnOpts): Promise<string> {
    const sdkDef = toSdkAgentDefinition(def)  // 14→4 字段 unpack (B-01)
    const injectedPrompt = injectFactoryInternalFields(def, def.initialPrompt ?? def.prompt)  // 10 字段 prompt
    const q = query({
      prompt: injectedPrompt,
      options: {
        allowedTools: ['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash', 'Task'],
        agents: { [opts.expertName]: sdkDef },
        outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA },  // PRIMARY (B-02)
        ...(opts.resumeSessionId ? { resume: opts.resumeSessionId } : {}),
      },
    })
    let result: SDKResultMessage | undefined
    for await (const msg of q) {
      if (msg.type === 'system' && msg.subtype === 'init') opts.onSessionId?.(msg.session_id)
      if (msg.type === 'result') result = msg
    }
    if (!result) throw new SpawnFailError()
    return JSON.stringify({
      subtype: result.subtype,
      structured_output: (result as any).structured_output,
      text: result.result,
    })
    // 注:isComplete (T2.4) 解析此 JSON envelope (4-layer dual-signal)
  }
  ```
- **read_first**:
  - T1.1 SDK `.d.ts`(by Read,验 `SDKResultMessage` shape + `structured_output` field)
  - PATTERNS § 2.2 + RESEARCH § 1.3 + § 1.6
  - T2.1 sdkReconcile + T2.2 completionSchema
- **acceptance_criteria**:
  - `wc -l src/routing/lib/sdkSpawn.ts` ≤ 120
  - `grep -E "from '@anthropic-ai/claude-agent-sdk'" src/routing/lib/sdkSpawn.ts | wc -l` == 1
  - `grep -E "export (function sdkSpawn|class SpawnFailError|interface SdkSpawnOpts)" src/routing/lib/sdkSpawn.ts | wc -l` == 3
  - `grep -E "outputFormat.*json_schema.*COMPLETION_SCHEMA" src/routing/lib/sdkSpawn.ts` 命中
  - `grep -E "toSdkAgentDefinition|injectFactoryInternalFields" src/routing/lib/sdkSpawn.ts | wc -l` ≥ 2
  - `grep -E "onSessionId|session_id" src/routing/lib/sdkSpawn.ts | wc -l` ≥ 2
  - `npx tsc --noEmit` pass
- **decision_source**: B-01 + B-02 + B-04 + B-25 + PATTERNS § 2.2 + RESEARCH § 1.3

### T4.2 — `src/routing/engine.ts` 升级:替 defaultSpawn placeholder

- **files_modified**: `src/routing/engine.ts`(MODIFY,199L → ≤200L,B-25 split 后)
- **action**:
  1. import `sdkSpawn` from `./lib/sdkSpawn.js`
  2. import `ralphLoopWrap` from `./lib/ralphLoop.js`(若未 import)
  3. **替换** L80-84 `defaultSpawn` placeholder fn:
     - 新 `defaultSpawn(def: AgentDefinition, opts?: { resumeSessionId?: string; onSessionId?: (id:string)=>void; expertName: string }): Promise<string>` → `sdkSpawn(def, opts)`
  4. **保留** 三层 fallback orchestration(`opts.spawn` injection seam → `defaultSpawn` → real SDK)— **不动** 现 `arbitrate` → `installAdapter` → `factory` 链
  5. `runRouting` 末尾改为:`return await ralphLoopWrap((rid) => defaultSpawn(def, { ...opts, resumeSessionId: rid }), maxIter)`
  6. 验 wc -l engine.ts ≤ 200(若超 → split orchestration helper 到 `lib/engineOrchestration.ts`)
- **read_first**:
  - `src/routing/engine.ts`(by Read,199L 全文 + L62-112 spawn 段)
  - PATTERNS § 2.2 spawn 升级 spec
- **acceptance_criteria**:
  - `wc -l src/routing/engine.ts` ≤ 200(B-23 守住)
  - `grep -E "from '\\./lib/sdkSpawn'" src/routing/engine.ts | wc -l` == 1
  - `grep -E "ralphLoopWrap.*sdkSpawn|sdkSpawn.*ralphLoopWrap" src/routing/engine.ts` 命中(end-to-end wire)
  - `grep "engine.defaultSpawn is a placeholder" src/routing/engine.ts | wc -l` == 0(placeholder 已替换)
  - `grep -E "throw new Error\\('engine\\.defaultSpawn is a placeholder" src/routing/engine.ts | wc -l` == 0
  - `npx tsc --noEmit` pass
- **decision_source**: B-25 + KICKOFF § 2 Wave 4 + PATTERNS § 2.2

### T4.3 — Tests:sdk-spawn + routing-engine end-to-end + Win sentinel

- **files_modified**: `tests/routing/sdk-spawn.test.ts`(NEW)+ `tests/routing/routing-engine.test.ts`(MODIFY,已存在则升级)
- **action**:
  - `sdk-spawn.test.ts`:① mock SDK query() 返 success result w/ structured_output → sdkSpawn 返 JSON envelope w/ status COMPLETE;② mock no result → throw SpawnFailError;③ mock session_id init → onSessionId callback 触发
  - `routing-engine.test.ts`(升级现 mock):① 端到端 spawn 路径(mock SDK query)→ engine.route 返 verbatim COMPLETE;② max-iterations 退场(mock spawn 总返 PARTIAL)→ throw MaxIterationsExceededError;③ injection seam opts.spawn 覆盖 defaultSpawn 仍工作(backward compat — phase 1.4 test 不破)
  - Win sentinel:本 test 须 `npm test` 在 Win Git Bash 跑通(R6 + B-31)
- **read_first**:
  - `tests/routing/routing-engine.test.ts`(若已存在,by Read,沿袭 mock pattern)
  - T4.1 sdkSpawn + T4.2 engine
- **acceptance_criteria**:
  - `npm test -- tests/routing/sdk-spawn.test.ts tests/routing/routing-engine.test.ts` pass(local + CI 3-OS)
  - sdk-spawn.test.ts 含 ≥ 3 test case
  - routing-engine.test.ts 升级 ≥ 3 new test case(端到端 + max-iter + injection seam)
  - `gh run list --limit 1 --json conclusion -q '.[0].conclusion'` Win 矩阵 == `success`
- **decision_source**: B-04 + B-31 + R6

---

### T4.4 — Task Session 集成(**conditional — only if T1.2 SC4 pass**)— delta D-18 / B-35+B-36

> ⚠️ **CONDITIONAL TASK**:仅当 T1.2 SC4(SDK `resume?: string` API verify)pass 时执行;若 SC4 fail,**skip 本任务**并在 task_plan.md Resolved block 记录 `> **Resolved (T4.4)**: SKIPPED (SC4 fail → CD-4 deferred → v0.3.0 checkpoint 完整版)`。

- **files_modified**(SC4 pass branch only):
  - `src/manifest/schema/spec.ts` OR `src/workflow/schema/phases.ts`(MODIFY,加 `task_session_id?: string` optional field 到 phase manifest entry)
  - `src/routing/lib/sdkSpawn.ts`(MODIFY,加 `task_session_id` 优先 resume 逻辑 — `opts.resumeSessionId ?? taskSession.session_id`)
  - `src/cli/execute-task.ts`(MODIFY,Wave 5 T5.1 后再加;本 task 仅 schema + sdkSpawn 改;CLI side 由 Wave 5 executor 接续)
- **action**(SC4 pass branch only):
  1. phase manifest TypeBox schema 加 `task_session_id: Type.Optional(Type.String())`(沿袭 B-32 schemaVersion 章节 3 rule "新增字段必须 nested"— 加在 phase entry 内嵌 sub-object `runtime: { task_session_id?: string }` 而非 top-level)
  2. `sdkSpawn` 加 `resumeSessionId` 优先级:`opts.resumeSessionId ?? def.runtime?.task_session_id ?? undefined`(omo `task_sessions[task_key]` 语义)
  3. executor 4-phase chain 中,phase 03 (test) 失败回炉 phase 02 (code) 时,read prev phase `task_session_id` → 注入 next phase spawn `resumeSessionId`(复用同 subagent context)
  4. test:tests/routing/task-session.test.ts(NEW ~40L)— mock SDK query 含 `resume` option;verify resume call 传递 `task_session_id`;verify state carry(memory / tools subset)
  5. **Schema interaction with B-32**:phase manifest 加 `task_session_id` 字段属 schemaVersion 7 surface 第 3 项(phases.yaml `harnessed.phases.v1` — 见 T2.0)— 即 nested field 加在 `harnessed.phases.v1` schema 内 phase entry 子节点;**bump 不 trigger v2**(沿袭 B-32 rule 3 "新增字段必须 nested" → 仍是 v1)
- **read_first**(SC4 pass branch only):
  - T1.2 SC4 outcome(若 fail,SKIP 本 task)
  - ASSUMPTIONS B-35 + B-36
  - ADR 0011 § 9 Task Session(T0.2 sketch + T6.1 ship 时 fill)
  - `.planning/intel/omc-comparison.md` § CD-4(L139-147)
- **acceptance_criteria**(SC4 pass branch only):
  - `grep -E 'task_session_id\?:\s*string|task_session_id: Type\.Optional' src/manifest/schema/spec.ts src/workflow/schema/phases.ts | wc -l` ≥ 1
  - `grep -E 'opts\.resumeSessionId.*task_session_id|task_session_id.*resumeSessionId' src/routing/lib/sdkSpawn.ts` 命中
  - `npm test -- tests/routing/task-session.test.ts` pass
  - `npx tsc --noEmit` pass
  - task_plan.md Resolved block 含 `> **Resolved (T4.4)**: SC4 pass — Task Session 实装 ship(phase manifest task_session_id field + sdkSpawn resume logic)`
- **acceptance_criteria**(SC4 fail branch — SKIP):
  - task_plan.md Resolved block 含 `> **Resolved (T4.4)**: SKIPPED (SC4 fail → CD-4 deferred → v0.3.0 checkpoint 完整版)`
  - 无 schema / sdkSpawn / test 改动(`git diff --name-only HEAD` 不含 src/manifest src/routing src/workflow tests/routing/task-session 任一)
- **decision_source**: B-35 + B-36 + CONTEXT D-18 + intel CD-4(L139-147)+ ADR 0011 § 9

---

## Wave 5 — execute-task CLI + 30 sample

### T5.1 — `src/cli/execute-task.ts` NEW(10th register fn)

- **files_modified**: `src/cli/execute-task.ts`(NEW ~110L)
- **action**: 沿袭 PATTERNS § 2.1 COPY scaffold from `src/cli/research.ts`:
  ```typescript
  // src/cli/execute-task.ts(NEW)
  // ADR 0011 errata — execute-task workflow CLI (phase 2.2 W5 — F7).
  // 10th register fn — 沿袭 phase 1.4 T5.1 research.ts pattern.
  import { Command } from 'commander'
  import { route, EngineResult } from '../routing/engine.js'
  import { loadPhases } from '../workflow/loadPhases.js'
  import type { TaskContext } from '../routing/types.js'

  interface RawOpts {
    task?: string
    apply?: boolean
    dryRun?: boolean
    nonInteractive?: boolean
    model?: 'haiku' | 'sonnet' | 'opus'
    modelTier?: 'inherit'
    maxIterations?: number
    workflow?: string
  }

  export function registerExecuteTask(program: Command): void {
    program
      .command('execute-task')
      .description('Run execute-task workflow (4-phase chain → ralph-loop COMPLETE)')
      .requiredOption('--task <text>', 'task description (required)')
      .option('--workflow <name>', 'workflow name', 'execute-task')
      .option('--apply', 'execute the spawn (default: dry-run preview)')
      .option('--dry-run', 'force dry-run')
      .option('--non-interactive', 'CI / scripts — requires --apply or --dry-run')
      .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
      .option('--model-tier <tier>', "override: 'inherit' bypasses phase.model")
      .option('--max-iterations <n>', 'ralph-loop max iter (default 20)', (v) => parseInt(v, 10))
      .action(async (raw: RawOpts) => {
        // H1 gate — 沿袭 research.ts L37-43
        if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
          process.stderr.write('--non-interactive requires --apply or --dry-run\n')
          process.exit(2)
        }
        if (!raw.task) { process.stderr.write('--task is required\n'); process.exit(2) }
        // load phases.yaml
        const phases = loadPhases(`workflows/${raw.workflow ?? 'execute-task'}/phases.yaml`)
        const taskCtx: TaskContext = { task: raw.task, task_type: 'execute-task' }
        const isDryRun = raw.dryRun || !raw.apply
        if (isDryRun) {
          // arbitrate-only path,沿袭 research.ts L52-72
          console.log(JSON.stringify({ workflow: phases.workflow, phases: phases.phases, taskCtx }, null, 2))
          process.exit(0)
        }
        // apply path — 4-phase chain orchestration
        const result: EngineResult = await route(taskCtx, {
          model: raw.modelTier === 'inherit' ? undefined : raw.model,
          phases,
          maxIterations: raw.maxIterations ?? 20,
        })
        // EngineResult 3-state → exit code 0 (COMPLETE) / 1 (FAIL) / 2 (USAGE/CONFIG)
        process.exit(result.status === 'COMPLETE' ? 0 : 1)
      })
  }
  ```
- **read_first**:
  - `src/cli/research.ts`(by Read,93L,COPY scaffold L16-92)
  - PATTERNS § 2.1
  - T3.2 loadPhases + T4.2 engine.route
- **acceptance_criteria**:
  - `wc -l src/cli/execute-task.ts` ≤ 130
  - `grep -E "export function registerExecuteTask" src/cli/execute-task.ts | wc -l` == 1
  - `grep -E "(--task|--apply|--dry-run|--non-interactive|--model|--model-tier|--max-iterations)" src/cli/execute-task.ts | wc -l` ≥ 7
  - `grep -E "loadPhases\\(" src/cli/execute-task.ts | wc -l` ≥ 1
  - `grep -E "route\\(.*taskCtx" src/cli/execute-task.ts | wc -l` ≥ 1
  - `grep -E "process\\.exit\\(2\\)" src/cli/execute-task.ts | wc -l` ≥ 2(H1 gate)
  - `npx tsc --noEmit` pass
- **decision_source**: B-10 + B-28 + PATTERNS § 2.1 + CONTEXT D-14

### T5.2 — `src/cli.ts` register + comment update

- **files_modified**: `src/cli.ts`(MODIFY +2L)
- **action**:
  1. import `registerExecuteTask` from `./cli/execute-task.js`(沿袭 L9 import pattern)
  2. 在 `registerResearch(program)` 后加 `registerExecuteTask(program)`
  3. 文件顶 comment 改为 "10 subcommands per ADR 0004 + 0007 + 0008 + 0011"
- **read_first**: `src/cli.ts`(by Read,沿袭 register pattern)
- **acceptance_criteria**:
  - `grep -E "import.*registerExecuteTask.*from '\\./cli/execute-task" src/cli.ts | wc -l` == 1
  - `grep -E "registerExecuteTask\\(program\\)" src/cli.ts | wc -l` == 1
  - `grep -E "10 subcommands" src/cli.ts` 命中(comment 更新)
  - `node dist/cli.js execute-task --help` exit 0 + stdout contains "Run execute-task workflow"
- **decision_source**: B-28 + PATTERNS § 2.1 (Register block)

### T5.3 — `workflows/execute-task/SKILL.md` NEW(trigger_phrases forward-looking)

- **files_modified**: `workflows/execute-task/SKILL.md`(NEW)
- **action**: 沿袭 mattpocock skill 风格 YAML frontmatter + Markdown body(~60L):
  ```markdown
  ---
  name: execute-task
  description: |
    execute-task workflow — 4-phase chain (brainstorming → karpathy → mattpocock → TDD → ralph-loop)
    triggered by harnessed CLI `harnessed execute-task --task <text>`.
  trigger_phrases:
    # forward-looking documentation — auto-invocation 实装推 Phase 2.3 extension category (B-28)
    - "execute this task"
    - "implement this feature"
    - "execute-task workflow"
  ---

  # execute-task workflow

  ## Overview
  4-phase chain ...
  ## CLI invocation (the only enforced entry — B-28)
  `harnessed execute-task --task "<text>" --apply`
  ## Forward-looking note
  `trigger_phrases` 段当前**仅 documentation purpose**;GSD orchestration agent 自动召唤 CLI 的实装推 Phase 2.3 extension category。
  ```
- **read_first**: 任何现 SKILL.md(若存在 — by Glob)or skill skeleton 参考
- **acceptance_criteria**:
  - `ls workflows/execute-task/SKILL.md` 命中
  - `grep -E "^name:\\s*execute-task$" workflows/execute-task/SKILL.md` 命中
  - `grep -E "^trigger_phrases:" workflows/execute-task/SKILL.md` 命中
  - `grep -E "forward-looking|Phase 2\\.3" workflows/execute-task/SKILL.md` 命中(B-28 doc only)
- **decision_source**: B-28 + PATTERNS D-WP-2 selected (a)

### T5.4 — `.planning/phase-2.2/SAMPLES.md` NEW(30 sample — 15 复用 + 15 新增)

- **files_modified**: `.planning/phase-2.2/SAMPLES.md`(NEW)
- **action**: B-29 selection rationale(沿袭 phase 1.4 R3 frozen 模式):
  - 复用 15:从 `.planning/phase-1.4/SAMPLES.md` 取 15 个 sample(rationale:routing arbitrate 路径仍核心 — backward compat regression coverage)
  - 新增 15(execute-task 专属):
    - 4 = 4-phase chain 各 phase trigger(01-clarify / 02-code / 03-test / 04-deliver)
    - 3 = ralph-loop max-iter 退场(maxIter=1/3/20 边界)
    - 4 = structured_output PRIMARY vs FALLBACK 路径(spike Tier A / Tier B / partial / mixed)
    - 2 = dual-signal degraded path(outer FALLBACK only / inner FALLBACK only)
    - 2 = 异常路径(SDK error / invalid model 错误恢复)
  - 文件结构沿袭 phase 1.4 SAMPLES.md(标题 + selection rationale + table 30 row + known miss 节)
- **read_first**:
  - `.planning/phase-1.4/SAMPLES.md`(by Read,R3 frozen rationale + 30 sample 模式)
- **acceptance_criteria**:
  - `ls .planning/phase-2.2/SAMPLES.md` 命中
  - `grep -cE "^\\|\\s*S\\d+\\s*\\|" .planning/phase-2.2/SAMPLES.md` ≥ 30(30+ sample row)
  - `grep -E "^## Selection rationale|^## Known miss" .planning/phase-2.2/SAMPLES.md | wc -l` ≥ 2
  - `grep -E "01-clarify|02-code|03-test|04-deliver" .planning/phase-2.2/SAMPLES.md | wc -l` ≥ 4(覆盖 4 phase)
- **decision_source**: B-29 + PATTERNS D-WP-6

### T5.5 — Tests:`execute-task.test.ts` + `run-samples.mjs` 30 sample harness

- **files_modified**: `tests/cli/execute-task.test.ts`(NEW)+ `scripts/run-samples.mjs`(NEW or MODIFY)
- **action**:
  - `execute-task.test.ts`:① H1 gate `--non-interactive` 无 `--apply`/`--dry-run` → exit 2;② missing `--task` → exit 2;③ `--dry-run` arbitrate-only → exit 0 stdout 含 workflow JSON;④ `--apply` mock SDK spawn 返 COMPLETE → exit 0;⑤ `--apply` mock SDK spawn 返 PARTIAL → exit 1;⑥ `--model-tier inherit` 不 read phase.model
  - `run-samples.mjs`:loop 30 sample → 对每 sample run `node dist/cli.js execute-task --task "<sample>" --dry-run --non-interactive`(or `--apply` mock SDK env),验 COMPLETE 100% 准确;输出 `samples passed: N/30, missed: [...]`
  - 沿袭 phase 1.4 SAMPLES harness pattern(若存在)
- **read_first**:
  - T5.1 + T5.4
  - `tests/cli/research.test.ts`(若存在,by Glob,sister pattern)
- **acceptance_criteria**:
  - `npm test -- tests/cli/execute-task.test.ts` 全 pass
  - 含 ≥ 6 test case
  - `node scripts/run-samples.mjs .planning/phase-2.2/SAMPLES.md` exit 0 + stdout `samples passed: 30/30, missed: []`(or 28-30 with explicit known-miss enumeration matching SAMPLES.md "known miss" section)
  - `npx tsc --noEmit` pass
- **decision_source**: B-28 + B-29 + KICKOFF § 1.2 F7

---

## Wave 6 — ship

### T6.1 — ADR 0011 finalize 6 章节(Wave 0 draft → 详细 fill)

- **files_modified**: `docs/adr/0011-execute-task-sdk-ralph.md`(MODIFY,fill detail)
- **action**: 升级 T0.2 draft 为 accepted 状态:
  1. Status: `Draft` → `Accepted (phase 2.2 W6 — 2026-05-15)`
  2. 6 章节每节 fill detail:
     - **§ 1 SDK 引入**:cite B-04,research v0.2.0 § 1-3,SDK currentVer(T1.1 resolved)
     - **§ 2 ralph-wiggum keep**:cite B-05,jq Win 红旗,interactive-TUI rationale
     - **§ 3 dual-signal completion 4-layer**:cite B-02,RESEARCH § 1.3 4 layer table,COMPLETION_SCHEMA inline
     - **§ 4 contract v1.2 reconcile**:cite B-01,14→4 字段 unpack + 10 字段 inject;**inline 注释**(`AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 不动,reconcile 走此 ADR errata)
     - **§ 5 per-phase model tier schema errata**:cite B-08~B-13,intel 第 4 条默认表,`--model-tier inherit` 逃生口
     - **§ 6 Wave 0 transparency CI gate flip + freshness ext**:cite B-14~B-19,STATUS_MARKER regex,FRONT_MATTER_DOCS list
  3. ## A7 Conservation 节:`baseline tag 1-10 → 1-0011`(T6.5 创建)
  4. ## References 节:全 source(KICKOFF / CONTEXT / PATTERNS / RESEARCH / ASSUMPTIONS / research/v0.2.0 / intel / Phase 2.1 D-08 暂记 0011 仅参考)
- **read_first**:
  - T0.2 draft + ASSUMPTIONS § B 31 lock
- **acceptance_criteria**:
  - `grep -E "Status: Accepted" docs/adr/0011-*.md` 命中
  - `grep -E "^### [1-9]\\." docs/adr/0011-*.md | wc -l` == 9(delta absorbed — ADR 0011 实占已 9 章节:原 6 + delta 3 schemaVersion / provenance / Task Session)
  - `grep -E "(B-0[1-9]|B-[12][0-9]|B-3[01])" docs/adr/0011-*.md | wc -l` ≥ 20(20+ B-lock cite)
  - `grep -E "AGENT-DEFINITION-FACTORY-CONTRACT\\.md main body" docs/adr/0011-*.md` 命中(A7 守恒声明)
- **decision_source**: B-20 + B-21 + B-22

### T6.2 — `ci.yml` A7 iter `1-10 → 1-0011`

- **files_modified**: `ci.yml`(MODIFY,A7 step iter range)
- **action**: 找到 A7 step iter 行(沿袭 phase 1.4 ADR 0008 A7 step pattern),改 `for i in $(seq 1 10)` → `for i in $(seq 1 0011)`(or等价 syntax,看 ci.yml 现 form)
- **read_first**: `ci.yml`(by Read,定位 A7 step)
- **acceptance_criteria**:
  - `grep -E "seq 1 0011|seq 1 ${N}" ci.yml | wc -l` ≥ 1
  - `grep -E "seq 1 10" ci.yml | wc -l` == 0(旧 iter 已替换)
- **decision_source**: B-22 + KICKOFF § 1.2 F8

### T6.3 — ADR 0001-0010 main body 0 diff verify

- **files_modified**: (verify-only)
- **action**: 跑 `git diff <baseline-tag-1-10>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md"` 验输出 empty(若非 empty → revert 改动)
- **read_first**: (verify-only)
- **acceptance_criteria**:
  - `git diff <last baseline tag — e.g. adr-0010-accepted>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" | wc -l` == 0
  - `git log --oneline <baseline tag>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md"` empty(no commit touched 旧 ADR)
- **decision_source**: B-22 + KICKOFF § 3.1

### T6.4 — `.planning/STATE.md` + `RETROSPECTIVE.md` 续编

- **files_modified**: `.planning/STATE.md`(MODIFY)+ `.planning/RETROSPECTIVE.md`(MODIFY)
- **action**:
  - STATE.md:增 entry "Phase 2.2 shipped — execute-task workflow + ralph-loop SDK introduction (F1-F8 all green)";更新 item 19(transparency gate flip done)+ item 21(freshness ext done)
  - RETROSPECTIVE.md:续编 phase 2.2 milestone retrospective(What Worked / What Was Inefficient / Patterns Established / Key Lessons / Cost patterns)
- **read_first**:
  - `.planning/STATE.md`(by Read)+ `.planning/RETROSPECTIVE.md`(by Read,沿袭续编 pattern)
- **acceptance_criteria**:
  - `grep -E "Phase 2\\.2 shipped" .planning/STATE.md | wc -l` ≥ 1
  - `grep -E "## Phase 2\\.2 milestone" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
- **decision_source**: KICKOFF § 1.2 F8 + 沿袭 phase 1.5 / 2.1 ship pattern

### T6.5 — baseline tag `adr-<N>-accepted` + `v0.2.0-alpha.2-execute-task` 候选 tag

- **files_modified**: (git tag-only)
- **action**:
  1. `git tag adr-0011-accepted -m "phase 2.2 ship — ADR 0011 accepted, A7 baseline 1-10 → 1-0011"`
  2. `git tag v0.2.0-alpha.2-execute-task -m "phase 2.2 candidate milestone — execute-task workflow + ralph-loop SDK introduction"`
  3. (不 push origin 等用户手动 push,沿袭 phase 1.5 / 2.1 ship pattern)
- **read_first**: T6.1 + T6.2 + T6.3 全 pass 后才执行
- **acceptance_criteria**:
  - `git tag --list adr-0011-accepted v0.2.0-alpha.2-execute-task | wc -l` == 2
  - `git show adr-0011-accepted --no-patch` 显示 commit hash + tag message 含 "phase 2.2 ship"
  - 3-OS CI 全绿(最后一次 push 触发)
- **decision_source**: B-22 + KICKOFF § 1.2 F8

---

## Wave 全完成 — Phase 2.2 acceptance verify

跑 PLAN.md § 6 全 8 acceptance bar reproduction command,全 pass。

跑 PLAN.md § 7 全 Wave checkpoint verify pass。

ASSUMPTIONS § B 31 lock 全 ship:
- B-01~B-07 SDK & spawn — T1.x + T2.1 + T2.4 + T4.1 + T4.2 ship
- B-08~B-13 per-phase model tier — T3.1 + T3.2 + T3.3 + T3.4 ship
- B-14~B-19 transparency 一次性根治 — T0.3 + T0.4 + T0.5 + T0.6 + T0.7 ship
- B-20~B-22 ADR & A7 — T0.2 + T6.1 + T6.2 + T6.3 + T6.5 ship
- B-23~B-27 Karpathy hard limit — 每 code-producing task 含 wc -l verify
- B-28~B-31 CLI / workflow / SAMPLES / TypeBox / LF — T5.1 + T5.3 + T5.4 + 全文件 LF + Win sentinel

R6.1 + R3.4 + R5.3 requirement IDs 全 covered:
- **R6.1**(execute-task workflow main line) — T5.1~T5.5 + T3.3 + T4.1 + T4.2(完整 chain ship)
- **R3.4**(multi-source merge v1 → SDK closes phase 1.4 F33) — T2.1 + T2.2 + T2.3 + T2.4 + T4.1(dual-signal 4-layer structural elimination)
- **R5.3**(ralph-loop Win compat partial) — T2.4 + T4.3 Win sentinel + T1.2 spike Win 实跑 + 3-OS CI matrix sentinel(Phase 2.4 全兼容)

---

*Phase 2.2 task_plan.md complete — 35 (or 36 if SC4 pass) atomic tasks across 7 Waves (W0 7 + W1 4 + W2 6 [+T2.0] + W3 4 + W4 4 [+T4.0, optional +T4.4] + W5 5 + W6 5);每 task 含 file path + concrete action + read_first + grep-verifiable acceptance + decision source citation;Karpathy 5 hard limit + A7 守恒 + 31 lock 全 trace。*


---

## Discuss-phase delta absorbed — 2026-05-15

| Delta item | Source | Decision | Tasks added/modified | ASSUMPTIONS § B | ADR 0011 章节 |
|-----------|--------|---------|---------------------|-----------------|---------------|
| **CD-5 schemaVersion 单一兼容门** ⭐⭐⭐ | intel L149-157 (ECC) | FULL — 7 surface `harnessed.<surface>.v1` + consumer branch + 3 rules | T2.0 NEW (Wave 2 prep) | B-32 | § 7 |
| **CD-6 provenance gate** ⭐⭐ | intel L159-167 (ECC) | BEFORE-W4 hard fail — ~5KB schema + 4 fields + composition/installer enforce | T4.0 NEW (Wave 4 prereq) | B-33 + B-34 | § 8 |
| **CD-4 Task Session 复用** ⭐⭐ | intel L139-147 (omo) | PIGGY-W1 conditional — SC4 verify SDK resume API → pass branch实装 / fail branch deferred | T1.2 augment (SC4) + T4.4 NEW conditional (Wave 4) | B-35 + B-36 | § 9 |
| **EE-4 plan 4 维量化阈值** ⭐⭐ | intel L74-82 (omo) | DEFER-2.4 — Phase 2.4 doctor 完整版 absorb OR 独立 phase 2.5 | (无 Phase 2.2 task — deferred 项) | (无 lock — deferred) | (无章节 — Phase 2.2 不动 ADR) |

**Net effect**:Phase 2.2 task count 33 → 35 (or 36 if SC4 pass);ADR 0011 章节 6 → 9;B-lock 31 → 36(B-32~B-36 加入);F2 reproduction regex `^### [1-6]\. ` → `^### [1-9]\. ` + wc 6 → 9。
