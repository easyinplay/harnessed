---
phase: 1
version: 3.6.0
title: mattpocock methodology inline (sub-workflow role-prompt enrichment)
status: ready-for-review
created: 2026-05-25
sister_cadence: v3.5.0 Phase 2 (ESCALATION_RULES inject pattern)
estimated_loc: ~150-200 yaml + ~50 test
estimated_commits: 4 (Wave 1 fetch+audit / Wave 2 enrich / Wave 3 tests / Wave 4 reality check)
---

# v3.6.0 Phase 1 — mattpocock methodology inline

## Goal (one sentence)

把 mattpocock 4 招式核心方法论(`grill-with-docs` / `zoom-out` / `improve-codebase-architecture` / `grill-me`)从 mattpocock/skills GitHub repo 拉取并 paraphrase 后,inline 注入到 harnessed `workflows/role-prompts.yaml` 中对应 3 个 sub-workflow entries(`task-clarify` + `task-code` + `discuss-subtask`)的 `responsibility` / `checklist` 字段,让 spawned subagent 在 mattpocock plugin 未装时也能按方法论自实施。

## Why (background — user reframe)

v3.5.0 ship 后 audit (`audit-harnessed-vs-user-rules-2026-05-25.md`) 标定 P0a 为 "mattpocock 6 fallback 补全"。**初步设计**(conditional skip)被用户 reframe 否决:

> 在 setup 时就需要检测 mattpocock-skills 并安装,调用方法我理解我们只要想告诉 agent 使用心法+招式,类似 claude.md 起到的作用那样

正确的 reframe:capability 本质 = **方法论 prompt-inject**,不是 cmd 调用。pattern 跟 v3.5.0 Phase 2 `ESCALATION_RULES` 注入完全一致(把 parallelism-gate.yaml 方法论 prompt-inject 到 spawned subagent)。

**进一步发现**(写 SPEC 前 verify):
- `role-prompts.yaml` 是 24 sub-workflow level entries(对应 `<claude-home>/commands/<x>.md`),**完全不含** mattpocock 6 capability-level entries
- 当前 3 个 sub-workflow role-prompts **已 mention mattpocock 招式名**(`task-clarify:248` 提 `grill-me`,`task-code:258-260` 提 `/zoom-out` `/improve-codebase-architecture` `/diagnose`),但**方法论没展开**
- 用户本地 `~/.claude/skills/mattpocock-skills/` 不存在 → 当前已经在跑 fallback 路径(role-prompts.yaml splice),这正是要 enrich 的位置

所以 Phase 1 真实工作不是"给 mattpocock capability 加方法论字段",而是 **enrich 3 affected sub-workflow role-prompts**,把 mention 的招式核心方法论 inline 展开。

## Source + license (CRITICAL)

- **Repo**: https://github.com/mattpocock/skills
- **License**: MIT
- **Commit SHA**: TBD at Wave 1 fetch time(必须固定 SHA 才 deterministic;`gh api repos/mattpocock/skills/commits/main --jq .sha`)
- **Attribution required**: MIT 允许 paraphrase + redistribute,但要求 license + copyright notice 保留。Wave 2 enrich 时在 `role-prompts.yaml` 顶部 + 每个 enrich 段落上方加 attribution。

## Scope

### In-scope (4 招式 / 3 sub-workflow entries)

| 招式 | mattpocock 路径 | 注入到 role-prompts.yaml entry | 注入字段 |
|---|---|---|---|
| grill-with-docs | `skills/engineering/grill-with-docs/SKILL.md` | `task-clarify` (L235-250) | `responsibility` + `checklist` |
| zoom-out | `skills/engineering/zoom-out/SKILL.md` | `task-code` (L252-271) | `checklist` |
| improve-codebase-architecture | `skills/engineering/improve-codebase-architecture/SKILL.md` | `task-code` (L252-271) | `checklist` |
| grill-me | `skills/productivity/grill-me/SKILL.md` | `discuss-subtask` (L173-188) + `task-clarify` (L248 现有 mention) | `responsibility` |

### Out-of-scope (NOT Phase 1)

- **`to-prd` / `to-issues`**(audit 列在 mattpocock 6 中):这两个是 standalone slash command(用户 explicit invoke from CLI),不属于 sub-workflow 内辅助。当前 `role-prompts.yaml` 也没有任何 sub-workflow mention 它们。**留给 v3.7+ 看是否有需要 sub-workflow inject**(empirical-driven)。
- **`diagnose`**(`task-code:259` 提到):虽然 mattpocock 有 `engineering/diagnose/`,但 harnessed `capabilities.yaml` 中 diagnose entry 当前 alias to `gsd-debug` (impl: gsd),并不专属 mattpocock。inline diagnose 方法论需要决定**用 mattpocock 版还是 gsd-debug 版**,涉及更宽 capability 设计(v3.7+ 范围)。
- **`caveman`**(`productivity/caveman/`):caveman 在 harnessed 已 dual-install (`impl: [user-skill, plugin]`),不在 audit P0a 缺 fallback 清单。
- **`write-a-skill` / `tdd` / `prototype` / `setup-matt-pocock-skills`**:不在 harnessed sub-workflow role-prompts 引用范围。
- **其他 capability(gstack / superpowers / planning-with-files)的方法论补齐**:用户已 explicit 选 **Z 范围**(只 mattpocock,其他 v3.7+ empirical-driven)。
- **`harnessed setup` 检测 mattpocock 安装**:Phase 2 范围(setup-time doctor 强化)。

### NOT touching (out of Phase 1)

- `workflows/capabilities.yaml`(capability registry 不动)
- `src/` 源码(无 runtime logic 改动 — buildAgentDef 现成 pipeline 已经 inject `responsibility` + `checklist`)
- `tests/` 现有 cells(只新增,不改)

---

## Design details

### D1. Source fetch — fixed SHA + audit trail

Wave 1 实施 subagent **必须**:

1. `gh api repos/mattpocock/skills/commits/main --jq .sha` → 拿 `<SHA>`(锁定 reproducibility,后续 maintainer rebuild 用同 SHA)
2. 用 `gh api repos/mattpocock/skills/contents/skills/<category>/<skill>/SKILL.md?ref=<SHA> --jq .content` 拉 4 个 SKILL.md(base64 decoded)
3. 写到 `.planning/v3.6.0/mattpocock-source/<skill>.md` 留 audit trail(maintainer 后续可对比 paraphrase 与 source)
4. 同步拉 `LICENSE` 文件到 `.planning/v3.6.0/mattpocock-source/LICENSE` 同 SHA

**Why fixed SHA**: mattpocock skills 会迭代,如不固定 SHA,后续 maintainer rebuild 拿到不同版本 → paraphrase 与 source 偏离。固定 SHA 保 reproducibility。

### D2. Paraphrase guideline

**MIT 允许 verbatim 复制**(只要保留 license + copyright),但 verbatim 大段 prompt 让 spawned subagent 收到太长。**paraphrase 到 ~50-100 words 每招式** 注入 `responsibility` 或 `checklist`。

- **保留**:核心方法论 step / decision criteria / 关键术语
- **删除**:examples / appendix / FAQ / 内部 cross-reference
- **重写**:口语化中文/英文 → harnessed 风格紧凑英文(matches 现有 role-prompts.yaml 风格,见 `task-test:282-288`)

每段 enrich 上方加单行 attribution comment:
```yaml
# grill-with-docs methodology paraphrased from mattpocock/skills (MIT, <SHA short>)
# Source: skills/engineering/grill-with-docs/SKILL.md
```

### D3. Enrichment shape per sub-workflow entry

#### D3.1 `task-clarify` (L235-250) — add grill-with-docs methodology

**Current** (L238-249):
```yaml
task-clarify:
  primary_cap: "superpowers-brainstorming"
  specialist: "Subtask spec clarifier"
  responsibility: |
    Surface ambiguity in a single subtask spec by asking ONE focused
    question at a time. Fires when ≥2 approaches / core algorithm / API
    contract / high error-cost. Skip if subtask is CRUD or already obvious.
  checklist:
    - "Read the subtask description; restate it in your own words to confirm"
    - "List every assumption you would make; flag the ones the user must confirm"
    - "Ask ONE question at a time, lowest-cost-to-answer first"
    - "Stop asking when you have enough to write 80% of the code without guessing"
    - "Record the resolved spec at the top of the subtask file before implementing"
    - "If `phase.spec_ambiguous == true AND phase.no_docs == true`, request grill-me"
```

**Proposed** (附加 grill-with-docs methodology):
```yaml
task-clarify:
  primary_cap: "superpowers-brainstorming"
  specialist: "Subtask spec clarifier"
  responsibility: |
    Surface ambiguity in a single subtask spec by asking ONE focused
    question at a time. Fires when ≥2 approaches / core algorithm / API
    contract / high error-cost. Skip if subtask is CRUD or already obvious.

    # grill-with-docs methodology paraphrased from mattpocock/skills (MIT, <SHA short>)
    # When ambiguity overlaps with existing project docs / ADRs, run a
    # grill-with-docs cycle: pressure-test the plan against the project's
    # domain language (CONTEXT.md), sharpen terminology mismatches inline,
    # and update ADRs as decisions crystallise. Output is BOTH a refined
    # spec AND a doc-diff (CONTEXT.md / docs/adr/*.md).
  checklist:
    - "Read the subtask description; restate it in your own words to confirm"
    - "List every assumption you would make; flag the ones the user must confirm"
    - "Ask ONE question at a time, lowest-cost-to-answer first"
    - "Stop asking when you have enough to write 80% of the code without guessing"
    - "Record the resolved spec at the top of the subtask file before implementing"
    - "If `phase.spec_ambiguous == true AND phase.no_docs == true`, request grill-me"
    # grill-with-docs additional checklist (paraphrased from mattpocock/skills)
    - "Cross-reference each assumption against CONTEXT.md domain language; flag terminology drift"
    - "If a decision crystallises mid-grill, draft the ADR delta inline (don't defer)"
    - "Output BOTH the refined spec AND any doc-diff (CONTEXT.md / docs/adr/*.md)"
```

#### D3.2 `task-code` (L252-271) — add zoom-out + improve-codebase-architecture methodology

**Current responsibility** (L255-261) mentions `/zoom-out` `/improve-codebase-architecture` `/diagnose` but doesn't expand. **Proposed**: keep responsibility wording, add 5-7 new checklist items capturing the two methodologies' core steps. Diagnose stays as-is (out of Phase 1).

#### D3.3 `discuss-subtask` (L173-188) — add grill-me methodology

**Current responsibility** (L176-179) doesn't mention grill-me but `task-clarify:248` cross-references it. **Proposed**: enrich `discuss-subtask.responsibility` with grill-me "relentless interview until shared understanding" methodology + 2-3 checklist items.

### D4. Attribution + license file

Wave 2 must:

1. Add header comment to `role-prompts.yaml` top:
   ```yaml
   # ...existing header...
   #
   # Portions of this file (sub-workflow role-prompt entries enriched with
   # mattpocock methodology) are paraphrased from https://github.com/mattpocock/skills
   # (MIT License, commit <SHA>). See .planning/v3.6.0/mattpocock-source/LICENSE
   # for the full upstream license text.
   ```

2. Copy `LICENSE` text from mattpocock/skills to `.planning/v3.6.0/mattpocock-source/LICENSE` (kept for audit + license compliance evidence).

3. Add `THIRD-PARTY-NOTICES.md` at repo root (or append to existing if exists) listing:
   ```markdown
   ## mattpocock/skills

   - Source: https://github.com/mattpocock/skills (commit <SHA>)
   - License: MIT
   - Used in: `workflows/role-prompts.yaml` — paraphrased methodology excerpts
     for `task-clarify` / `task-code` / `discuss-subtask` sub-workflow role
     prompts.
   - License text preserved in `.planning/v3.6.0/mattpocock-source/LICENSE`
     (paraphrased excerpts only; full SKILL.md content not redistributed).
   ```

### D5. NO runtime code changes

`buildAgentDef` (src/workflow/run.ts) 现成 pipeline 已经把 role-prompts.yaml 的 `responsibility` + `checklist` splice 到 spawned subagent prompt(L94-103)。**Phase 1 不动 src/**,纯 yaml + attribution 文件改动。

---

## Wave 切分 (4 commits)

### Wave 1 — Source fetch + audit trail
- **Action**:
  1. `gh api repos/mattpocock/skills/commits/main --jq .sha` → store as `<SHA>`
  2. Fetch 4 SKILL.md + LICENSE via `gh api ... --jq .content | base64 -d`
  3. Write to `.planning/v3.6.0/mattpocock-source/<skill>.md` (4 files) + `LICENSE` (1 file) + `SHA.txt` (1 file)
- **LOC**: ~0 in shipped scope (only `.planning/` — not published)
- **Commit**: `chore(v3.6.0): vendor mattpocock 4 SKILL.md sources for Phase 1 paraphrase (MIT)`
- **Why separate commit**: audit trail — paraphrase reviewer can diff source vs. result without git archeology

### Wave 2 — `role-prompts.yaml` enrich + attribution
- **Action**:
  1. Header comment + 3 entry enrichment per D3.1-D3.3
  2. Add `THIRD-PARTY-NOTICES.md` at repo root (Apache 2.0 harness + MIT mattpocock co-license disclosure)
- **LOC**: ~120-150 (`role-prompts.yaml` +80-100, `THIRD-PARTY-NOTICES.md` +30-50)
- **Commit**: `feat(role-prompts): v3.6.0 Phase 1 — inline mattpocock 4 methodologies (grill-with-docs/zoom-out/improve-arch/grill-me)`

### Wave 3 — Tests
- **Files**: `tests/workflow/role-prompts.test.ts` (or sibling — verify path)
- **New cells** (3-5):
  1. `role-prompts.yaml` parses without error (existing test should already cover; verify still passes)
  2. `task-clarify.responsibility` contains "grill-with-docs" + key methodology phrase
  3. `task-code.checklist` contains zoom-out methodology phrase + improve-arch methodology phrase
  4. `discuss-subtask.responsibility` contains "grill-me" + key methodology phrase
  5. (Optional) attribution comment present in yaml top
- **LOC**: ~40-60 test
- **Commit**: `test(role-prompts): v3.6.0 Phase 1 — assert mattpocock methodology presence in 3 sub-workflow entries`

### Wave 4 — Reality check + CHANGELOG
- **Step 1**: `pnpm build` 0 红
- **Step 2**: `corepack pnpm test` ≥1097 pass (baseline 1092 + 5 Phase 1 new cells, exact number depending on Wave 3 cell count)
- **Step 3**: `pnpm pack --dry-run` tarball size — verify `role-prompts.yaml` 增量 acceptable (<10KB delta)
- **Step 4**: 抽样 spawn dry-run — `harnessed run task-clarify --task "design API for auth flow" --dry-run` — 看 spawned subagent prompt 是否含 grill-with-docs methodology(envelope JSON 输出 schema-shape verification)
- **Step 5**: 加 CHANGELOG.md v3.6.0 (Unreleased) Phase 1 section
- **Commit**: `docs(changelog): v3.6.0 Phase 1 — mattpocock methodology inline`

---

## 灰区 (实施 subagent 遇到必须 STATUS: NEEDS_CLARIFICATION)

1. **mattpocock SKILL.md 内容大幅超 100 words 难 paraphrase 到 50-100 words**(e.g. SKILL.md 含 multi-step decision tree)→ return,问是否扩展到 150-200 words 或拆 checklist 多项
2. **mattpocock SKILL.md 内容与现有 role-prompts.yaml 已有 checklist 严重重叠**(e.g. zoom-out 方法论的某 step 已经在 task-code checklist L264 有相似项)→ return,问是 dedupe(删 mattpocock 版)还是 keep both(明确标注 origin)
3. **THIRD-PARTY-NOTICES.md 已存在且格式与 spec 提议冲突**(检查 `D:/GitCode/harnessed/THIRD-PARTY-NOTICES.md` 或 `NOTICE`)→ return,问是 append 还是 reformat
4. **role-prompts.yaml schema validation 失败**(新增 attribution comment in body,可能违反 v1 schema)→ return,不要 fix-forward
5. **Wave 1 SHA fetch 失败 / rate-limited** → return,等用户 retry guidance
6. **mattpocock SKILL.md L1-2 frontmatter `license` 或 `description` 字段说明禁止 paraphrase**(unlikely 因为 MIT,但 verify)→ return,reconsider scope

---

## Sister 文件参考

- `D:/GitCode/harnessed/.planning/v3.5.0/PHASE-2-SPEC.md` — ESCALATION_RULES inject pattern 类比
- `D:/GitCode/harnessed/workflows/role-prompts.yaml` — Wave 2 主目标
- `D:/GitCode/harnessed/src/workflow/run.ts` L94-103 — `buildAgentDef` splice 现成 pipeline(NOT 改)
- `D:/GitCode/harnessed/src/cli/lib/generateCommands.ts` — `loadRolePrompts` 路径(testing)

---

## Acceptance criteria

- [ ] Wave 1: 4 SKILL.md + LICENSE + SHA.txt 在 `.planning/v3.6.0/mattpocock-source/`
- [ ] Wave 2: role-prompts.yaml 3 entries enriched + 顶部 attribution + THIRD-PARTY-NOTICES.md
- [ ] Wave 3: 3-5 new test cells pass
- [ ] Wave 4: `pnpm build` 0 红 + `pnpm test` ≥baseline+5 + CHANGELOG Phase 1 section
- [ ] Spawned subagent (dry-run) prompt JSON contains mattpocock methodology key phrases
- [ ] MIT compliance: attribution + license text + commit SHA pinned

---

## Risk + rollback

- **Risk 1**: paraphrase 不准确(误传 mattpocock 原义)
  - **Mitigation**: source files in `.planning/v3.6.0/mattpocock-source/` 留 diff 比对;Wave 3 test cells assert key methodology phrases present
- **Risk 2**: license compliance 漏洞(没保留 copyright notice)
  - **Mitigation**: D4 三处 attribution + THIRD-PARTY-NOTICES.md 三重保险
- **Risk 3**: prompt budget 增加(每个 spawned subagent 多收 ~400 tokens)
  - **Mitigation**: 接受 — methodology inject 是 Phase 1 核心价值,LLM 决策质量提升 > token 成本
- **Risk 4**: mattpocock 后续 update SKILL.md → harnessed 落后
  - **Mitigation**: 固定 SHA(non-issue 直到 maintainer 主动 re-fetch);v3.7+ 加 doctor 检测 source SHA drift

- **Rollback**: 4 atomic commits;Wave 1 (source fetch) 独立,Wave 2-4 依次 revert 可恢复 v3.5.0 state。

---

*Spec written 2026-05-25 by main session per v3.5.0 sister cadence + user reframe (methodology prompt-inject).*
*Approval gate: user review this spec → ack → spawn implementation subagent.*
