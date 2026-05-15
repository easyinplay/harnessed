---
phase: 2.2
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  - scripts/check-transparency-verdicts.mjs
  - .planning/phase-1.1/PLAN-CHECK.md
  - .planning/phase-1.1/VERIFICATION.md
  - .planning/phase-1.2/PLAN-CHECK.md
  - .planning/phase-1.2/VERIFICATION.md
  - .planning/phase-1.3/PLAN-CHECK.md
  - .planning/phase-1.3/VERIFICATION.md
  - .planning/phase-1.4/PLAN-CHECK.md
  - .planning/phase-1.4/VERIFICATION.md
  - .planning/phase-1.5/PLAN-CHECK.md
  - .planning/phase-1.5/VERIFICATION.md
  - .planning/v0.1.0-MILESTONE-AUDIT.md
  - .planning/phase-2.1/PLAN-CHECK.md
  - .planning/phase-2.1/VERIFICATION.md
  - README.md
  - docs/PROJECT-SPEC.md
  - docs/TRANSPARENCY-VERDICT-CHECKLIST.md
  - docs/adr/0011-execute-task-sdk-ralph.md
  - src/routing/agentDefinition.ts
  - src/routing/lib/sdkReconcile.ts
  - src/routing/lib/sdkSpawn.ts
  - src/routing/lib/ralphLoop.ts
  - src/routing/completionSchema.ts
  - src/routing/systemPrompt.ts
  - src/routing/engine.ts
  - src/workflow/schema/phases.ts
  - src/workflow/loadPhases.ts
  - workflows/execute-task/SKILL.md
  - workflows/execute-task/phases.yaml
  - src/cli/execute-task.ts
  - src/cli.ts
  - package.json
  - package-lock.json
  - ci.yml
autonomous: true
requirements:
  - R6.1
  - R3.4
  - R5.3
must_haves:
  truths:
    - "developer can run `harnessed execute-task --task <text> --apply` and trigger real SDK subagent spawn"
    - "execute-task workflow 4-phase chain(brainstorming → karpathy → mattpocock → TDD → ralph-loop)端到端 wire 通"
    - "ralph-loop COMPLETE 检测 dual-signal 4-layer 工作:PRIMARY=structured_output PASS,FALLBACK=`<promise>` PASS"
    - "phases.yaml 含 `model:` 必填字段,agentFactory 读 phase.model 注 AgentDefinition.model"
    - "scripts/check-transparency-verdicts.mjs ENFORCE=true,全 13 verdict 文档 marker 合规,CI 全绿"
    - "README/PROJECT-SPEC Status: marker 反映最新 shipped phase,freshness check 扫过 0 violation"
    - "ADR errata 0011 accepted 含 6 章节;ADR 0001-0010 main body 0 diff;baseline tag 1-10 → 1-0011"
    - "30 子任务 SAMPLES.md COMPLETE 检测 100% 准确(沿袭 phase 1.4 R3 frozen rationale)"
    - "3-OS CI 全绿(Win Git Bash + macOS + Linux)含 SDK spawn 实际跑 + transparency ENFORCE=true 实测"
  artifacts:
    - path: "docs/adr/0011-execute-task-sdk-ralph.md"
      provides: "单 ADR errata 6 章节(SDK 引入 / ralph-wiggum keep / dual-signal / contract v1.2 / model tier / Wave 0 transparency)"
      contains: "## SDK 引入, ## dual-signal completion, ## per-phase model tier, ## transparency CI gate flip"
    - path: "src/routing/lib/sdkSpawn.ts"
      provides: "SDK query() async-iterable consumer + JSON envelope return"
      exports: ["sdkSpawn"]
    - path: "src/routing/lib/sdkReconcile.ts"
      provides: "14→4 字段 unpack + 10 字段 prompt inject helper"
      exports: ["toSdkAgentDefinition", "injectFactoryInternalFields"]
    - path: "src/routing/completionSchema.ts"
      provides: "Unified `COMPLETION_SCHEMA` TypeBox-like JSON schema const"
      exports: ["COMPLETION_SCHEMA"]
    - path: "src/workflow/schema/phases.ts"
      provides: "TypeBox PhasesSchema(workflow phases.yaml schema)"
      exports: ["PhasesSchema", "PhaseEntry", "ModelTier"]
    - path: "src/workflow/loadPhases.ts"
      provides: "parse + validate + emit PhaseEntry[]"
      exports: ["loadPhases"]
    - path: "workflows/execute-task/SKILL.md"
      provides: "execute-task workflow skill manifest(trigger_phrases forward-looking,B-28)"
    - path: "workflows/execute-task/phases.yaml"
      provides: "4-phase chain 实例配置 + model 字段实例"
      contains: "model:"
    - path: "src/cli/execute-task.ts"
      provides: "10th register fn(commander)"
      exports: ["registerExecuteTask"]
    - path: ".planning/phase-2.2/SAMPLES.md"
      provides: "30 子任务 ralph-loop COMPLETE selection rationale + sample list"
  key_links:
    - from: "src/routing/engine.ts"
      to: "src/routing/lib/sdkSpawn.ts"
      via: "import sdkSpawn + opts.spawn injection seam"
      pattern: "import.*sdkSpawn"
    - from: "src/routing/lib/sdkSpawn.ts"
      to: "@anthropic-ai/claude-agent-sdk"
      via: "import { query, type SDKResultMessage }"
      pattern: "from '@anthropic-ai/claude-agent-sdk'"
    - from: "src/routing/lib/sdkSpawn.ts"
      to: "src/routing/lib/sdkReconcile.ts"
      via: "toSdkAgentDefinition + injectFactoryInternalFields"
      pattern: "toSdkAgentDefinition\\(def\\)"
    - from: "src/routing/lib/sdkSpawn.ts"
      to: "src/routing/completionSchema.ts"
      via: "COMPLETION_SCHEMA → outputFormat options"
      pattern: "schema:\\s*COMPLETION_SCHEMA"
    - from: "src/routing/lib/ralphLoop.ts"
      to: "src/routing/lib/promiseExtract.ts"
      via: "FALLBACK 路径(dual-signal Tier B + inner FALLBACK)"
      pattern: "extractPromise"
    - from: "src/cli/execute-task.ts"
      to: "src/routing/engine.ts"
      via: "engine.route() 调用(沿袭 research.ts pattern)"
      pattern: "engine\\.(route|runRouting)"
    - from: "src/cli/execute-task.ts"
      to: "src/workflow/loadPhases.ts"
      via: "phases.yaml load + phase.model 决定 AgentDefinition.model"
      pattern: "loadPhases\\("
    - from: "scripts/check-transparency-verdicts.mjs"
      to: "README.md, docs/PROJECT-SPEC.md"
      via: "freshness checkFreshness() 第二 walker"
      pattern: "FRONT_MATTER_DOCS"
---

<objective>
Phase 2.2 把 v0.1.0 routing engine v1 + Phase 2.1 6 install method runtime-ready 升级为**真实 SDK spawn subagent + ralph-loop 完整闭合**。实装 execute-task workflow 4-phase chain(brainstorming → karpathy 心法 → mattpocock 招式 → conditional TDD → ralph-loop COMPLETE)+ per-phase model tier schema + dual-signal completion 4-layer + Wave 0 transparency 一次性根治。

**Purpose**:R6.1(execute-task workflow 主线 — execute-task chain 与 ralph-loop 真实闭合)+ R3.4(multi-source merge v1 — SDK introduction 闭合 phase 1.4 F33 summarize-risk 通过 structured output dual-signal)+ R5.3(ralph-loop Win 兼容 — partial,Phase 2.4 全兼容)。

**Output**:7 Wave × ~28 atomic task(F1-F8 acceptance bars 全 ship)+ 单 ADR errata(实占 N)+ `v0.2.0-alpha.2-execute-task` 候选 tag。
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2.2/KICKOFF.md
@.planning/phase-2.2/2.2-CONTEXT.md
@.planning/phase-2.2/PATTERNS.md
@.planning/phase-2.2/RESEARCH.md
@.planning/phase-2.2/ASSUMPTIONS.md
@.planning/research/v0.2.0-execute-task-ralph.md
@.planning/intel/omc-comparison.md

# Frozen interface contracts(本 phase 升级或消费)
@src/routing/engine.ts
@src/routing/agentDefinition.ts
@src/routing/systemPrompt.ts
@src/routing/lib/ralphLoop.ts
@src/routing/lib/promiseExtract.ts
@src/cli/research.ts
@src/manifest/schema/spec.ts
@scripts/check-transparency-verdicts.mjs
@docs/TRANSPARENCY-VERDICT-CHECKLIST.md
</context>

---

## § 1 Goal & Scope

### 1.1 Goal
真实 SDK spawn subagent + ralph-loop 完整闭合 + execute-task workflow 4-phase chain + per-phase model tier + Wave 0 transparency 一次性根治。

### 1.2 In Scope
F1-F8 acceptance bars(详 ASSUMPTIONS § A)。

### 1.3 Out of Scope
Phase 2.3 / 2.4 / v0.3.0 + intel 第 2/3 条 + 动态 model routing + checkpoint 完整版(详 CONTEXT § Deferred + KICKOFF § 1.3)。

---

## § 2 Wave 拓扑(实占)

```
Wave 0 — transparency 一次性根治 + ADR draft (F1 + F2 draft)
  ├─ T0.1  扫 ROADMAP.md + max(NNNN) 实占 ADR 编号 N
  ├─ T0.2  ADR <N> draft(6 章节 — sketch only,详细 Wave 6 ship 时 fill)
  ├─ T0.3  13 verdict 文档 manual marker migration(10 ADD + 3 REPAIR)
  ├─ T0.4  freshness ext 扩展 scripts/check-transparency-verdicts.mjs(+25L)
  ├─ T0.5  README + PROJECT-SPEC 加 Status: marker + TRANSPARENCY-VERDICT-CHECKLIST 加 § Status freshness
  ├─ T0.6  ENFORCE=true atomic flip(独立 commit,B-18)
  └─ T0.7  3-OS CI 跑通 gate verify
       ↓
Wave 1 — SDK spike + 引入 (F3)
  ├─ T1.1  npm view @anthropic-ai/claude-agent-sdk version 复核 + 对照 .d.ts 重验 14→4 字段
  ├─ T1.2  spike scripts/spike-outputFormat-agents.mjs(throwaway,Win 实跑)
  ├─ T1.3  npm i @anthropic-ai/claude-agent-sdk + package-lock.json verify
  └─ T1.4  3-OS CI verify SDK install + smoke import
       ↓
Wave 2 — agentFactory contract v1.2 + dual-signal 4-layer (F4)
  ├─ T2.1  src/routing/lib/sdkReconcile.ts NEW(toSdkAgentDefinition + injectFactoryInternalFields)
  ├─ T2.2  src/routing/completionSchema.ts NEW(COMPLETION_SCHEMA unified)
  ├─ T2.3  src/routing/systemPrompt.ts +schema const append + 1 prompt 段
  ├─ T2.4  src/routing/lib/ralphLoop.ts 升级 isComplete 4-layer + resumeSessionId 闭包
  └─ T2.5  test:tests/routing/sdk-reconcile.test.ts + isComplete.test.ts(dual-signal 4 path)
       ↓
Wave 3 — per-phase model tier schema (F5)
  ├─ T3.1  src/workflow/schema/phases.ts NEW(TypeBox)
  ├─ T3.2  src/workflow/loadPhases.ts NEW(parse + validate)
  ├─ T3.3  workflows/execute-task/phases.yaml NEW(4 phase × intel 第 4 条默认表)
  └─ T3.4  test:tests/workflow/load-phases.test.ts(schema valid + invalid + missing model)
       ↓
Wave 4 — ralph-loop full integration 主流程 (F6)
  ├─ T4.1  src/routing/lib/sdkSpawn.ts NEW(query() async-iterable consumer + JSON envelope)
  ├─ T4.2  src/routing/engine.ts 升级:替 defaultSpawn placeholder + 三层 fallback orchestration
  ├─ T4.3  test:tests/routing/sdk-spawn.test.ts + routing-engine.test.ts(end-to-end + isComplete dual-signal)
       ↓
Wave 5 — execute-task CLI + 30 sample (F7)
  ├─ T5.1  src/cli/execute-task.ts NEW(10th register fn,沿袭 research.ts scaffold)
  ├─ T5.2  src/cli.ts register + comment 更新
  ├─ T5.3  workflows/execute-task/SKILL.md NEW(trigger_phrases forward-looking 文档)
  ├─ T5.4  .planning/phase-2.2/SAMPLES.md NEW(30 sample,B-29 = phase 1.4 复用 15 + 新增 15)
  └─ T5.5  test:tests/cli/execute-task.test.ts + 30 sample harness(SAMPLES.md → CI run + COMPLETE 100% 验证)
       ↓
Wave 6 — ship (F8)
  ├─ T6.1  ADR <N> finalize 6 章节(Wave 0 draft → Wave 6 详细 fill 完成)+ accepted
  ├─ T6.2  ci.yml A7 step iter 1-10 → 1-<N>
  ├─ T6.3  ADR 0001-0010 main body diff verify(0 diff)
  ├─ T6.4  RETROSPECTIVE.md 续编 + STATE.md 更新
  └─ T6.5  baseline tag adr-<N>-accepted + v0.2.0-alpha.2-execute-task 候选 tag
```

**Wave 0 必须最先**(B-19)— ENFORCE=true 后续 wave CI 全凭 gate 通过运行。Wave 1 GO/NO-GO(spike 决定)是 Wave 2-4 prereq。Wave 5 依赖 Wave 2-4 全完成。

---

## § 3 Atomic Task Table

详 `task_plan.md`。本节是 summary view。

| Wave | Task Count | Est. Effort | Key Verify |
|------|-----------|-------------|-----------|
| 0 | 7 | ~2d | gate 0 violation + ENFORCE=true commit + 3-OS CI 全绿 |
| 1 | 4 | ~1d | spike pass + package-lock verify + 3-OS smoke |
| 2 | 5 | ~2d | sdkReconcile.test pass + isComplete 4-layer test pass + agentDefinition.ts ≤200L + ralphLoop ≤50L |
| 3 | 4 | ~1d | loadPhases.test pass + phases.yaml schema 实例 valid |
| 4 | 3 | ~2d | engine.ts ≤200L(split sdkSpawn 后)+ 端到端 spawn test pass + Win Git Bash 跑 |
| 5 | 5 | ~2d | 30 sample COMPLETE 100% 准确 + execute-task CLI exit code 0/1/2 3-state verify |
| 6 | 5 | ~1d | 3-OS CI 全绿 + A7 守恒 verify + adr-<N>-accepted tag |
| **Total** | **33** | **~11d** | — |

---

## § 4 Phase 2.3 / 2.4 prereq 接口契约

Phase 2.2 ship 后,下游 phase 直接消费的接口:

| Consumer | Surface | Locked by Phase 2.2 |
|----------|---------|---------------------|
| Phase 2.3 extension category(design/content/testing skill install adapter) | `src/installers/index.ts` dispatch table + `workflows/<name>/SKILL.md` + `phases.yaml` schema | B-13 + B-28(workflow skill 模式确立,extension category 复用) |
| Phase 2.3 karpathy behavior-rule + CLAUDE.md merge | `SystemPrompt` `COMPLETION_SCHEMA` const + KARPATHY_BASELINE prepend pattern | B-27(systemPrompt.ts ≤80L pattern 复用) |
| Phase 2.4 doctor 完整版 + audit | `src/routing/lib/sdkSpawn.ts` async-iterable + session_id capture + SDK error classify | T4.1(sdkSpawn.ts 新文件 — doctor + audit 复用 session_id capture) |
| Phase 2.4 ralph-loop Win 全兼容 | `src/routing/lib/ralphLoop.ts` resumeSessionId 闭包 + dual-signal isComplete + Win Git Bash 验证 | B-26 + T2.4(ralph-loop ≤50L 主体保持,Win 兼容 partial 已 ship) |
| v0.3.0 checkpoint 完整版(handoff 四字段 + harnessed resume) | sdkSpawn session_id capture + ralphLoop resume 接续 + SDKResultMessage envelope | T4.1 session_id callback + B-26 |
| v0.3+ 动态 model routing | `workflows/<name>/phases.yaml` model 字段 + agentFactory 读 phase.model | B-08 + B-12(static model tier 跑通后再 dynamic resolver) |

---

## § 5 Risks

详 ASSUMPTIONS § C(R1-R6)。**no Wave 1 BLOCKER**(R1 degraded fallback Tier A 已 verified functional);**no SSOT 引用纪律 risk**(R5 单线性顺序);**partial Win 兼容 risk**(R6 Wave 1 spike Win 实跑 + Wave 6 3-OS CI sentinel,若 Win 失败 partial R5.3 ship + Phase 2.4 全兼容)。

---

## § 6 F1-F8 Acceptance Bar(with reproduction commands)

| Bar | Reproduction Command | Pass Criteria |
|-----|----------------------|---------------|
| **F1** | `node scripts/check-transparency-verdicts.mjs` | exit 0,stdout includes "13/13 verdict markers compliant + 2/2 Status: markers compliant",`grep "ENFORCE = true" scripts/check-transparency-verdicts.mjs` 命中 |
| **F2** | `ls docs/adr/<N>-*.md && grep -E "^### [1-6]\. (SDK 引入\|ralph-wiggum keep\|dual-signal completion\|contract v1\.2 reconcile\|per-phase model tier\|Wave 0 transparency)" docs/adr/<N>-*.md \| wc -l` | wc 输出 == 6(与 T0.2/T6.1 实际 `### N. ` heading-3 numbered form 一致;W3 plan-check fix)|
| **F3** | `npm view @anthropic-ai/claude-agent-sdk version && grep "@anthropic-ai/claude-agent-sdk" package.json && npm test -- tests/sdk-import.smoke.test.ts` | SDK version 与 lockfile match,smoke test pass on 3 OS |
| **F4** | `npm test -- tests/routing/sdk-reconcile.test.ts tests/routing/isComplete.test.ts && wc -l src/routing/agentDefinition.ts src/routing/lib/sdkReconcile.ts src/routing/lib/ralphLoop.ts src/routing/lib/promiseExtract.ts` | tests pass;agentDefinition.ts ≤200L,ralphLoop ≤50L,promiseExtract ≤50L,sdkReconcile ≤80L |
| **F5** | `npm test -- tests/workflow/load-phases.test.ts && node -e "const {loadPhases} = require('./dist/workflow/loadPhases'); console.log(loadPhases('workflows/execute-task/phases.yaml').phases.map(p=>p.model))"` | tests pass;stdout `['opus','sonnet','sonnet','haiku']`(intel 第 4 条默认表) |
| **F6** | `npm test -- tests/routing/sdk-spawn.test.ts tests/routing/routing-engine.test.ts && wc -l src/routing/engine.ts src/routing/lib/sdkSpawn.ts` | tests pass;engine ≤200L,sdkSpawn ≤120L |
| **F7** | `npm test -- tests/cli/execute-task.test.ts && node dist/cli.js execute-task --task "test" --dry-run --non-interactive && node scripts/run-samples.mjs .planning/phase-2.2/SAMPLES.md` | tests pass;dry-run exit 0;30 sample COMPLETE 100% |
| **F8** | `gh run list --workflow=ci.yml --limit=1` + `git tag --list adr-<N>-accepted v0.2.0-alpha.2-execute-task` + `git diff <baseline-tag-1-10>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" | wc -l` | CI all-green 3 OS;tags exist;diff wc == 0(A7 守恒)|

---

## § 7 Wave Acceptance Checkpoint Table

| Wave | Checkpoint Type | Gate Check | Action if FAIL |
|------|----------------|-----------|----------------|
| 0 | auto | `node scripts/check-transparency-verdicts.mjs` exit 0 含 ENFORCE 实测 | revert ENFORCE=true atomic commit → identify missed file → 补 marker → re-commit |
| 1 | auto(decision implicit) | Spike script Win 实跑 success criteria 1+2+3 ≥ Tier A | 若 Tier B → 升级 plan dual-signal 退到 outer FALLBACK 主路径(B-07 已预案);若 Tier C → 不会出现 |
| 2 | auto | 4-layer isComplete 4 path 全 test pass;hard limit verify | split 再细化(sdkReconcile/ralphLoop 单 fn 移到独立 file)|
| 3 | auto | schema 接受 valid yaml + reject missing model;intel 4 phase model 默认表实例 | typebox 错误时校验 `Type.Union` 顺序 + `additionalProperties: false` 配置 |
| 4 | auto + Win sentinel | 端到端 spawn Win Git Bash 跑(real SDK call,需要 ANTHROPIC_API_KEY env)| 若 Win spawn fail → R6 升级到 Phase 2.4 BLOCKER + 本 phase ship partial(skip Win-only sample)|
| 5 | auto | 30 sample COMPLETE 100% + execute-task CLI 3-state exit code | sample miss 列入 SAMPLES.md "known miss" 节 + plan-phase replan(沿袭 phase 1.4 SAMPLES.md miss 节模式)|
| 6 | auto | 3-OS CI 全绿 + tag exist + A7 diff 0 | rollback to last stable commit + investigate;A7 diff > 0 必须 revert 改动到 ADR 0001-0010 main body |

**Wave 1 spike 是隐式 decision checkpoint**:Tier A pass → Wave 2-4 走 PRIMARY 路径;Tier B → Wave 2-4 走 FALLBACK 主路径(B-07 已预案,non-blocker);Tier C 不会出现(`promiseExtract.ts` 32L 已 ship)。

---

## § 8 Phase 2.2 vs 2.3 / 2.4 boundary

| 维度 | phase 2.2(本) | phase 2.3 | phase 2.4 |
|------|---------------|-----------|-----------|
| workflow | execute-task 主线 + ralph-loop full integration | design/content/testing extension MVP + karpathy behavior-rule + CLAUDE.md merge | — |
| schema | phases.yaml + `model:` 必填 + contract v1.2 reconcile | extension category schema(若需要)| — |
| ADR | 单 ADR errata 0011 6 章节(本 phase 实占)| 新 ADR errata(Phase 2.3 决策)| 新 ADR errata(Phase 2.4 决策)|
| SDK | INTRODUCE NOW + 4-layer dual-signal | — | — |
| transparency | gate ENFORCE=true 一次性根治 + Status: marker convention + freshness ext | — | — |
| installer | 复用 Phase 2.1 6 method | extension category install adapter 真实候选实装 | — |
| doctor | — | — | 完整版 jq/Git Bash 探测 + weekly cron + audit + ralph-loop Win 全兼容 |
| checkpoint | execute-task 长链路 checkpoint 模板(handoff 四字段可用)| — | — |
| sample | 30 sample(15 复用 + 15 新增)| extension category sample 候选 | doctor sample |

---

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI input → engine | `harnessed execute-task` 接受 `--task <text>` 用户文本 → spawn subagent prompt 注入 |
| User-controlled `--model-tier` flag → AgentDefinition.model | 用户 CLI flag 直接控 SDK model 字段;非 4-enum 值需 schema reject |
| External SDK boundary → @anthropic-ai/claude-agent-sdk | Anthropic SDK 网络调用 + API key env(ANTHROPIC_API_KEY)|
| YAML 文件 input → loadPhases parser | `workflows/<name>/phases.yaml` 用户可改 → schema validate 防止 YAML injection / unknown 字段 |
| Subagent output → main agent ralph-loop | subagent text 含 `<promise>COMPLETE</promise>` 可能 user-injected 触发 false COMPLETE → regex match 严格 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-2.2-01 | Tampering | `--task <text>` CLI input | mitigate | Wave 5 `RawOpts` validate task is non-empty + 长度上限(沿袭 research.ts L37-43 pattern);unicode 字符不 sanitize(LLM input,但禁注入 shell metacharacters,B-31 LF line endings + Bash spawn 用 array argv 而非 string concat)|
| T-2.2-02 | Tampering | `phases.yaml` user input | mitigate | TypeBox `additionalProperties: false`(B-30)+ `loadPhases` 严格 schema validate(`Value.Check`)拒绝 unknown 字段 + ModelTier 4-enum 强制 |
| T-2.2-03 | Tampering | `--model-tier <value>` CLI flag | mitigate | commander.js `choices` 限制 4 value(`haiku`/`sonnet`/`opus`/`inherit`);超出 reject + exit 2(沿袭 research.ts H1 gate pattern)|
| T-2.2-04 | Info Disclosure | ANTHROPIC_API_KEY env | mitigate | sdkSpawn 不打印 API key 到 stdout/stderr;SDK 内部处理 auth;test mock 用 fake key;CI use GitHub secret(`secrets.ANTHROPIC_API_KEY`)|
| T-2.2-05 | DoS | ralph-loop max-iterations | mitigate | `maxIter` default 20(R6.4);CLI flag `--max-iterations` 上限 100(`Type.Integer({ minimum: 1, maximum: 100 })`);超出 reject |
| T-2.2-06 | Spoofing | subagent text 含 `<promise>COMPLETE</promise>` user-injected | accept | LLM-internal trust boundary;若 attacker 能控 subagent prompt 已 own engine spawn,完整 system compromise — `<promise>` grep 仅判 completion signal,non-security-critical |
| T-2.2-07 | Tampering | `STATUS_MARKER` regex matching front-matter doc input | mitigate | regex anchored `^\s*>?\s*\*{0,2}(?:Status\|状态)\*{0,2}\s*[:：]\s*(.+)$`(B-17 tolerance);仅扫前 50 行(implementation sketch RESEARCH § 3.5)|
| T-2.2-08 | Repudiation | transparency gate violation 历史 audit | accept | git history 已记录所有 verdict marker commit;`scripts/check-transparency-verdicts.mjs` CI step 输出 violation list 进 CI log;不需要独立 audit log(Phase 2.4 audit infra 时再做)|
| T-2.2-09 | Elevation of Privilege | SDK `allowedTools` 默认 broad(Read/Edit/Write/Grep/Glob/Bash/Task) | mitigate | execute-task workflow phase 1 (clarify) `allowedTools: ['Read', 'Grep', 'Glob']`(no Write);phase 2-3 (code/test) full;phase 4 (deliver) excludes destructive tools(reviewer 倾向 — 但本 phase scope 内全 broad,Phase 2.3 fine-tune per-phase tool gating)|
</threat_model>

<verification>
- `node scripts/check-transparency-verdicts.mjs` exit 0
- `npm run typecheck` + `npm run lint` + `npm test` all pass
- `npx tsc --noEmit` 编译通过
- `wc -l src/routing/engine.ts src/routing/agentDefinition.ts src/routing/systemPrompt.ts src/routing/lib/ralphLoop.ts src/routing/lib/promiseExtract.ts src/routing/lib/sdkSpawn.ts src/routing/lib/sdkReconcile.ts` 全 ≤ hard limit
- `git diff <baseline-tag-1-10>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md"` 输出 empty(A7 守恒)
- 3-OS CI matrix(`ubuntu-latest`/`macos-latest`/`windows-latest`)all green
- `node dist/cli.js execute-task --task "test" --dry-run --non-interactive` exit 0
- 30 sample 跑通 SAMPLES.md COMPLETE 100% 准确
- `git tag --list adr-<N>-accepted v0.2.0-alpha.2-execute-task` 两 tag 存在
</verification>

<success_criteria>
- F1-F8 全 ship(详 § 6 reproduction commands)
- 31 个 decision lock(B-01 ~ B-31)全 ship,**zero unresolved conflict**
- 33 atomic task 全 done + 7 Wave 全 checkpoint pass
- ADR errata 0011 accepted + baseline tag updated
- v0.2.0-alpha.2-execute-task 候选 milestone tag created
- `.planning/STATE.md` + `RETROSPECTIVE.md` 续编 reflect Phase 2.2 ship
</success_criteria>

<output>
After completion, create `.planning/phases/2.2/2.2-SUMMARY.md`(沿袭 phase 1.5 / 2.1 SUMMARY 模式)+ 续编 `.planning/STATE.md` + `RETROSPECTIVE.md`。
</output>
