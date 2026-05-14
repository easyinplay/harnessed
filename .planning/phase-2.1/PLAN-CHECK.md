# Phase 2.1 PLAN-CHECK — independent plan verification

> Checked: 2026-05-15 (Wave C — independent plan-checker)
> Inputs: KICKOFF / 2.1-CONTEXT / PATTERNS / RESEARCH / ASSUMPTIONS / PLAN / task_plan
> Style: phase 1.5 PLAN-CHECK.md 13-section structure
> Background: PLAN/ASSUMPTIONS/task_plan are main-agent direct-write (gsd-planner socket-errored @8 tool uses) — independent check matters most here
> Verdict: APPROVED WITH CONDITIONS — 0 BLOCKER / 4 WARNING / 5 SUGGESTION

---

## section 1 — Goal-backward E1-E8 achievability

Backward from phase goal = 6 install methods all runtime-ready + Wave 0 sister-review cleared.

| AB | deliverable | task map | 1:1? | content-achievable? | note |
|----|-------------|----------|------|---------------------|------|
| E1 | ADR 0010 >=100L 6-section errata | T1.1 | yes | yes | 6 Decision sub-items + H3/H4 + D-16 all listed; ADR 0008/0009 template in read_first |
| E2 | license whitelist + provides + install_type enforce + decision_rules + tests | T1.2-T1.6 (5 tasks) | yes | yes | schema changes all additive Type.*; TypeBox pattern has in-file analog |
| E3 | transparency checklist + CI gate + ci.yml step + M1 annotation | T1.7 + T1.8 | yes | WARN | T1.7 CI gate could red CI on first run — see W3 |
| E4 | mcpHttpAdd.ts + unit test | T2.1 + T2.2 | yes | yes | ~85% clone, lowest risk, proven sibling |
| E5 | gitCloneWithSetup.ts + unit test | T3.1 + T3.2 | yes | yes | git rev-parse SHA verify is NEW but <=10L self-contained |
| E6 | ccPluginMarketplace.ts + unit test | T4.1 + T4.2 | yes | yes | two-step spawn; D-20 idempotency tested in execute-phase |
| E7 | npxSkillInstaller.ts + unit test | T5.1 + T5.2 | yes | yes | minimal-pin skills@1.5.7, real-path verify |
| E8 | dispatch 6 method + contract test + CI + tag + A7 iter | T6.1-T6.6 (6 tasks) | yes | yes | dispatch swap cross-ref confirmed against placeholder state (index.ts:22,39-42) |

Result: 8/8 acceptance bars have task coverage, 22 tasks no orphans. Each bar traces to concrete file + grep/wc/test acceptance. E3 has one execution-order risk (W3). Goal-backward PASS.

---

## section 2 — Dependency check (Wave 0 -> 1 -> 2 -> 3 -> 4 -> 5)

depends_on graph (from each task depends_on field):

- Wave 0: T1.1-T1.5, T1.7, T1.8 -> depends_on empty (parallel); T1.6 -> depends_on T1.2,T1.3,T1.4 (schema must change before testing) — sound
- Wave 1: T2.1 -> T1.1; T2.2 -> T2.1
- Wave 2: T3.1 -> T2.1; T3.2 -> T3.1
- Wave 3: T4.1 -> T3.1; T4.2 -> T4.1
- Wave 4: T5.1 -> T4.1; T5.2 -> T5.1
- Wave 5: T6.1 -> T2.1,T3.1,T4.1,T5.1; T6.2 -> T6.1; T6.3 -> T1.1; T6.4 -> T6.1,T6.2,T6.3; T6.5 -> T6.4; T6.6 -> T6.5

- No cycle: linear + fan-in, clean DAG.
- No forward-ref: every depends_on points to an earlier wave or earlier same-wave task.
- Does Wave 0 truly block installers? Three prereq chains verified:
  1. license whitelist (T1.2) -> cc-plugin/extension — WARN: T4.1 (cc-plugin) depends_on lists only T3.1, not T1.2. But the cc-plugin-marketplace installer itself does not read the license enum (license is a manifest-schema validation layer; the installer is a runtime spawn layer). KICKOFF 1.2 calls license whitelist an extension-candidate prereq, not an installer-code prereq. No real dependency gap; the Wave topology (all Wave 0 done before Wave 1) covers it implicitly. Acceptable — see S1.
  2. bundle-install provides (T1.3) -> document-skills — the document-skills manifest is authored in Phase 2.3 (D2.1-3); Phase 2.1 only ships the schema field. No installer dependency.
  3. --header env-resolution (T1.1 ADR records D-16) -> mcp-http-add — T2.1 depends_on correctly lists T1.1. D-16 approach locked in ADR Decision sub-item 6; T2.1 read_first includes docs/adr/0010-*.md. Chain complete.
- Wave 1-4 serial dependency (T3.1 -> T2.1 etc): rationale is lib-helper reuse validation. Technically the 4 installers do not import each other and could run in parallel; the serial chain is a risk-control choice (D-10 low-risk-first). Not an error — conservative ordering. See S2 / W4.

Result: dependency graph has no cycle, no forward-ref. Wave 0 prereq chains 2/3 explicitly correct, 1 covered by wave boundary implicitly — acceptable. Dependency check PASS.

---

## section 3 — Risk mitigation completeness (R1-R6)

| ID | risk | mitigation task landing | landed? |
|----|------|-------------------------|---------|
| R1 | cc-plugin marketplace add re-register behavior undocumented | T4.1 action states D-20 non-zero exit non-fatal IF install succeeds + optional pre-check | yes, in-task |
| R2 | --header ENV_VAR collides with checkCmdString | T2.1 resolveHeaders helper (resolve before arg construction) + T1.1 ADR Decision 6 records approach | yes, in-task |
| R3 | npx directory conflict ~/.agents vs ~/.claude/skills | T5.1 --copy flag forces real dir + real-path verify + progress.md finding (D-02) | yes, in-task |
| R4 | win32 git-clone needs Git Bash | T3.1 reuses preflight which already checks bash flavor (phase 1.3 tested) | yes, reuses existing |
| R5 | transparency CI gate false-positive on prose | T1.7 action states match only line-start marker tokens + restrict to 3 globs | yes, in-task |
| R6 | skills npm version moves fast | T5.1 action states if >2 weeks since research, re-check npm view skills version | yes, in-task |

Result: R1-R6 each have a concrete task carrying the mitigation, no orphan risks. Risk mitigation COMPLETE.

---

## section 4 — Actionability spot check (5/22 tasks)

Sampled T1.1 / T1.3 / T2.1 / T4.1 / T6.1 for action concreteness + acceptance verifiability:

| Task | action concrete? | acceptance verifiable? | verdict |
|------|------------------|------------------------|---------|
| T1.1 | yes — 6 sections itemized, 6 Decision sub-items expanded, H3 191L/+43L/2-fields specific numbers | yes — wc -l >=100 / grep -c section-headers >=6 / grep -c keywords >=7 | CONCRETE |
| T1.3 | yes — full TypeBox code block (ProvidedUnit + provides field), fenced comment text given | yes — grep ProvidedUnit >=1 / grep minItems-2 >=1 / typecheck | CONCRETE |
| T2.1 | yes — 7-step skeleton itemized, addArgs array literal given, resolveHeaders behavior (<=10L, throw env-unset) explicit | yes — 5 greps + typecheck, grep resolveHeaders/process.env >=1 | CONCRETE |
| T4.1 | yes — two-step mktArgs/installArgs array literals given, D-20 idempotency behavior explicit, verify uses exit-code | yes — grep marketplace-add/plugin-install >=2 + typecheck | CONCRETE |
| T6.1 | yes — 4-line swap + 4 imports + 1 deletion, import statement sample given, levelOf zero-change explicit | yes — grep phase21Placeholder =0 / grep 4-installer-imports >=8 | CONCRETE |

No vague align-X-with-Y phrasing. All actions give concrete file + concrete values (array literals / code blocks / command strings). Acceptance criteria all grep/wc/test/typecheck machine-verifiable.

One soft spot: T1.4 install_type enforcement acceptance only checks the keyword string exists, not that the mapping logic is correct. The mapping table itself is fully written in the action (ngm->npm-cli etc), backed by T1.6 >=3 install-type cells. Acceptable.

Result: 5/5 sampled actions CONCRETE, acceptance verifiable. Actionability PASS.

---

## section 5 — Decision trace (D-01-D-14 + D-15-D-21 + D2.1-1-D2.1-8)

ASSUMPTIONS section B three-layer consolidation verified:

- B.1 CONTEXT D-01-D-14 — all 14 listed, one-line summary each.
- B.2 PATTERNS D-15-D-21 — all 7 listed: D-15 (git-verify inline), D-16 (env-resolution a), D-18 (license enum location grep), D-20 (cc-plugin idempotency) directly locked. D-17 -> RESOLVED by D2.1-1; D-19 -> RESOLVED by D2.1-7/8; D-21 -> RESOLVED by D2.1-4.
- B.3 RESEARCH D2.1-1-D2.1-8 — all 8 listed with confidence labels.

RESOLVED chain consistency check:
- D-17 -> D2.1-1: PATTERNS proposed two options, RESEARCH section 1 actually compared 3 options (A/B/C) and chose C (provides). task_plan T1.3 implements provides — consistent with D2.1-1. Note: PATTERNS section 3.3 code sketch still shows the old Bundle/components shape (stale option-B residue), but task_plan T1.3 uses the RESEARCH provides/ProvidedUnit shape — task_plan took the correct resolved version. No conflict (PATTERNS is the proposal layer, RESEARCH/task_plan are the resolved layer).
- D-19 -> D2.1-7/8: PATTERNS proposed a/b/recommend-both, RESEARCH compared a/b/c and chose c hybrid. task_plan T1.7 implements checklist + narrow CI gate = hybrid. Consistent.
- D-21 -> D2.1-4: PATTERNS proposed pin npx skills@version, RESEARCH confirmed skills@1.5.7. task_plan T5.1 uses skills@1.5.7. Consistent.

No unresolved conflicts. D-18 is the only by-design deferral to execute-phase (see W1).

Result: 29 decisions (14+7+8) all consolidated, 3 RESOLVED chains consistent, task_plan uses the resolved-layer versions. Decision trace PASS.

---

## section 6 — Test coverage

| test task | files | est. cell count | adequate? |
|-----------|-------|-----------------|-----------|
| T1.6 schema tests | license.test (new) + bundle.test (new) + install-type (extend) | >=5 + >=5 + >=3 = >=13 cells | yes — license covers 4-enum + reject; bundle covers minItems/uniqueItems/additionalProperties negatives; install-type covers accept+reject+unconstrained |
| T2.2 mcpHttpAdd | installers-mcpHttpAdd.test (new) | >=6 cells | yes — covers env-resolution set/unset dual path + dispatch-mismatch + dry-run |
| T3.2 gitCloneWithSetup | installers-gitCloneWithSetup.test (new) | >=6 cells | yes — covers SHA-verify match/mismatch + pure-create backup |
| T4.2 ccPluginMarketplace | installers-ccPluginMarketplace.test (new) | >=6 cells | yes — covers two-step + D-20 idempotency |
| T5.2 npxSkillInstaller | installers-npxSkillInstaller.test (new) | >=6 cells | yes — covers real-path verify (npx exit 0 but file missing -> verify-failed) |
| T6.2 contract test extend | installer-contract.test (extend) | 4 installers x 6 contracts = ~24 contract assertions | yes — ADR 0004 6 contracts fully covered + dispatch-mismatch |

Estimated total addition: ~13 schema + ~24 installer unit + ~24 contract. The Ship-line self-estimate of +~30 cells is conservative (actual closer to +50-60). Not a problem — a conservative estimate beats an optimistic one.

Each installer test clones its analog test structure; the key negative paths (env-unset / sha-mismatch / verify-failed / D-20 idempotency) are all explicitly named in the actions. Coverage is sufficient.

Result: Wave 0 schema (>=13 cells) + 4 installer unit (>=24) + contract extend (~24). Negative paths explicitly named. Test coverage ADEQUATE.

---

## section 7 — Interface contracts (phase 2.2/2.3 prereq)

PLAN section 4 lists 7 frozen interfaces; task coverage verified per item:

| # | interface | covering task | actionable? |
|---|-----------|---------------|-------------|
| 1 | 6 install method dispatch table | T6.1 | yes — grep phase21Placeholder =0 |
| 2 | provides ProvidedUnit[] schema field | T1.3 | yes — grep provides-Type.Optional >=1 |
| 3 | license_source audit field | T1.2 | yes — grep license_source >=1 |
| 4 | license whitelist extension (MIT-0 + anthropics-official) | T1.2 | yes — grep Type.Literal MIT-0 etc |
| 5 | install_type enforcement 1:N closure | T1.4 | yes — grep install-type-mismatch >=1 |
| 6 | transparency verdict-marker convention | T1.7 | yes — docs/TRANSPARENCY-VERDICT-CHECKLIST.md |
| 7 | 4 installer module exports | T2.1/T3.1/T4.1/T5.1 | yes — test -f each installer |

7/7 interfaces have tasks, all grep/test verifiable. Phase 2.3 consumes #2 directly when authoring the document-skills manifest; phase 2.2 verify/audit docs must follow #6. VERIFICATION.md (T6.6) restates these 7 as a prereq index.

Result: 7 interface contracts all task-covered + actionable. phase 2.2/2.3 prereq PASS.

---

## section 8 — A7 conservation

| A7 conservation point | plan handling | OK? |
|------------------------|---------------|-----|
| ADR 0001-0009 main body 0 diff | T1.1 Compliance section writes git diff adr-0001-accepted = 0; ADR 0010 takes errata path as a new file | yes |
| ADR 0010 errata path | new file docs/adr/0010-*.md, does not touch old ADRs; follows 0007/0008/0009 errata pattern | yes |
| INSTALLER-CONTRACT.md main body untouched | H3 recorded via ADR 0010 errata (agentDefinition budget), does not change contract main body | yes |
| AGENT-DEFINITION-FACTORY-CONTRACT.md main body untouched | H3 errata written into ADR 0010 Decision 5, does not change contract main body | yes — but see W2 |
| baseline tag iterate | T6.5 git tag adr-0010-accepted + git diff adr-0010-accepted on 0010 file = 0 | yes |
| ci.yml A7 step iter 1-9 -> 1-10 | T6.3 adds 0010 to both loops + name update | yes — grep 0001...0010 >=2 |

Errata path correct end-to-end. H3 and H4 both go through ADR 0010 errata rather than editing contracts or old ADR main bodies.

Result: A7 conservation chain complete, errata path follows the established phase 1.3-1.5 pattern. A7 conservation PASS.

---

## section 9 — Karpathy simplicity

| check | plan state | OK? |
|-------|------------|-----|
| no new npm dep | all 4 installers use existing claude CLI / git / npx; skills is npx-runtime-fetched, not a package.json dep | yes |
| reuse 7 lib helpers, add no new helper | PATTERNS section 5 confirms 6 present helpers (backup/confirm/diff/preflight/spawn/state) + types cover all 4 installers | yes |
| D-15 git-verify inline, no new lib file | T3.1 action states inline <=10L, no lib/gitVerify.ts, single caller YAGNI | yes |
| D-16 resolveHeaders inline | T2.1 action states inline <=10L — not a new lib file | yes |
| schema changes surgical | all additive Type.Optional / Type.Union extensions, no migration script | yes |
| dispatch change minimal | T6.1 4-line swap + 4 imports + 1 deletion, levelOf/runInstall zero change | yes |

Minor observation: resolveHeaders (T2.1) and git SHA-verify (T3.1) are both inline in their respective installers. If a future phase introduces a second caller, spillover to lib/ then — consistent with Karpathy spillover-only-past-hard-limit. Single-caller inline is correct now.

Result: no new dep, no new lib helper, inline decisions follow YAGNI. Karpathy simplicity PASS.

---

## section 10 — Cross-phase consistency

- phase 2.1 vs 2.2 boundary: SDK introduction / execute-task / ralph-loop / ADR 0011 all explicitly deferred to 2.2 (D-08). PLAN section 8 boundary table is clear.
- phase 2.1 vs 2.3 boundary: bundle-routing (anthropics-skills-pptx -> bundle resolution) explicitly deferred to 2.3 (D2.1-3); phase 2.1 only ships the provides schema field. Extension category implementation deferred to 2.3. No scope creep.
- bundle-routing correctly deferred? RESEARCH section 1 + D2.1-3 + PLAN section 1.3 + section 8 all four state consistently that Phase 2.1 unique routing edit = D-05 chinese-content-deck warn removal. Consistent, no contradiction.
- contradicts shipped v0.1.0 state? Cross-ref src/installers/index.ts confirms: phase21Placeholder exists (line 22), the 4 methods currently point at it (lines 39-42), mcp-http-add case is in the switch (line 49). The plan description of current state (PATTERNS section 4) matches actual code. The dispatch swap is a real, feasible 4-line change.
- STATE.md progress: T6.5 writes 6/17 -> 7/17 (~41.2%) + ADR 9->10 + baseline tag 9->10. Consistent with the phase 1.5 ship state.

Result: phase boundaries clean, bundle-routing correctly deferred, the plan description of v0.1.0 code state cross-ref verified accurate. Cross-phase consistency PASS.

---

## section 11 — Findings

### BLOCKER (0)

None. All 22 tasks have a file + CONCRETE action + verifiable acceptance; the dependency graph has no cycle; all 8 acceptance bars are covered; all 29 decisions consolidated. Although the plan is main-agent direct-write, its quality meets the executable bar.

### WARNING (4)

W1 — D-18 license enum location deferred to execute-phase (by-design, but minor risk)
- Location: task_plan T1.2 action step 1 (grep src/manifest/schema/ to locate the existing license Type.Union) + ASSUMPTIONS B.2 D-18
- Issue: whether the license enum lives in spec.ts or a metadata sub-schema is not confirmed at plan time. If the license enum does not exist at all (current schema may have no license whitelist enum, just a free string), T1.2 add-2-Type.Literal becomes build-the-whole-license-Type.Union — still compatible with the acceptance criteria but the action description would be inaccurate.
- Assessment: PATTERNS section 6 D-18 and RESEARCH both assume the enum exists. RESEARCH section 1 notes decision_rules.yaml already implicitly accepts anthropics/skills, implying the license concept is already in the schema. The enum most likely exists; deferring the grep confirm to execute-phase is acceptable — the Type.Union extension pattern is location-independent (per D-18).
- Suggested fix: execute-phase T1.2 first action is the grep; if the enum does not exist, upgrade T1.2 to build-license-Type.Union + populate existing OSI whitelist + add MIT-0/anthropics-official and record the scope adjustment in progress.md. Does not block plan approval.
- Repair cost: low (execute-phase 5-10 min grep + conditional branch)

W2 — H3 budget errata numbers inconsistent within the plan
- Location: task_plan T1.1 Decision 5 (budget 150L -> 200L formally recorded, phase 1.5 measured 191L) vs CONTEXT D-07 (150->191L) vs canonical_refs (v1.1 14 fields, 148->191L)
- Issue: three places state the H3 errata target numbers differently: 200L (T1.1) / 191L (D-07) / 148->191L (canonical_refs). Whether AGENT-DEFINITION-FACTORY-CONTRACT.md v1.1 is 14 fields or +2 optional fields is also ambiguous.
- Assessment: not a blocker — the ADR 0010 errata is fundamentally about formally recording the budget breach; the exact wording is a drafting choice. But the T1.1 drafter must unify within the ADR: measured value (191L), new budget cap, field-count change.
- Suggested fix: execute-phase T1.1 before drafting, wc -l the agentDefinition file + read AGENT-DEFINITION-FACTORY-CONTRACT.md v1.1 actual field count, write the ADR by measurement, align all three numbers. read_first should add docs/AGENT-DEFINITION-FACTORY-CONTRACT.md (T1.1 read_first currently omits it).
- Repair cost: low (execute-phase 2 commands to verify + wording unification)

W3 — transparency CI gate (T1.7) could red CI on first run
- Location: task_plan T1.7 acceptance_criteria line 2 already self-flags it (existing verdict docs must comply first, or set the gate warn-only for round 1, decide at execute time)
- Issue: T1.7 check-transparency-verdicts.mjs scans .planning glob PLAN-CHECK.md + AUDIT.md + VERIFICATION.md. This PLAN-CHECK.md, the phase 1.x PLAN-CHECK.md files, v0.1.0-MILESTONE-AUDIT.md, and each phase VERIFICATION.md were all written before the gate existed and most likely do not contain Verdict / status / Closure line-start markers (they use free prose for conclusions). The gate would red CI immediately, and the red would be on historical docs rather than this phase output.
- Assessment: the plan is aware (the parenthetical on acceptance line 2), but decide-at-execute-time pushes the decision to the executor without locking a strategy at the plan layer — this is exactly the task_plan ambiguity that most needs a plan-layer decision. Two clean fixes: option a, gate warn-only for round 1 (exit 0 plus print violations), flip to enforce next phase; option b, gate scans only added/modified docs (git diff name-only filter) instead of all of .planning, historical docs naturally exempt.
- Suggested fix: lock option a (warn-only round 1) when implementing T1.7 in execute-phase — lowest risk, most consistent with the narrow-gate-must-not-be-noisy philosophy (RESEARCH section 3 explicitly says a noisy gate gets suppressed). Recommend changing this from decide-at-execute-time to an explicit plan-layer lock of option a. Note: this PLAN-CHECK.md itself uses a bold-wrapped Verdict marker with a digit — the gate regex must tolerate markdown bold wrapping (see S5).
- Repair cost: low-medium (warn-only is a 1-line process.exit zero difference; git-diff filter is about 5 lines)

W4 — Wave 1-4 forced serial sacrifices parallelism (conservative orchestration, not an error)
- Location: PLAN section 2 Wave topology + task_plan T3.1/T4.1/T5.1 each depends_on the previous installer
- Issue: the 4 installers do not depend on each other in code (each clones a different analog, no cross-import). The serial dependency rationale is lib-helper-reuse-validation — but the lib helpers are already proven in v0.1.0 (npmCli + mcpStdioAdd shipped), no wave-by-wave validation needed. Forcing serial turns 4 installers from a possible 1-wave parallel into 4 waves.
- Assessment: not an error — D-10 low-risk-first is the CONTEXT-locked implementation order, and conservative orchestration after a main-agent direct-write is reasonable (socket-error lesson). But if execute-phase uses a parallel batch executor (CLAUDE.md PP cadence), Wave 1 could dispatch all 4 installer tasks at once.
- Suggested fix: optional execute-phase optimization — T2.1/T3.1/T4.1/T5.1 can actually be dispatched in parallel (drop the artificial T3.1 depends-on T2.1 etc, keep only the T6.1 fan-in). If the executor prefers conservative (build confidence one at a time), keeping the status quo is fully acceptable. Does not block approval, pure execute-phase efficiency note.
- Repair cost: 0 (status quo acceptable) / trivial (drop 3 artificial depends_on)

### SUGGESTION (5)

S1 — task_plan T4.1 depends_on should explicitly add T1.2 (even though the cc-plugin installer does not read the license enum, writing the all-Wave-0-done-before-Wave-1 implicit convention into depends_on is more self-documenting). Or PLAN section 2 should explicitly state all Wave 1-5 tasks implicitly depend on all of Wave 0.

S2 — the Wave topology diagram should add a line noting Wave 1-4 serial is a risk-control choice, not a code dependency; execute-phase may parallelize depending on batch capability — to prevent the executor mistaking it for a hard dependency.

S3 — T1.1 read_first should add docs/AGENT-DEFINITION-FACTORY-CONTRACT.md (the object of the H3 errata) + docs/adr/0009 Decision 2 (the source of the H4 substring match). Currently it only lists 0008/0009 as style references, but the factual source docs for H3/H4 are not in read_first.

S4 — T6.2 contract test extend acceptance_criteria (4 new installers each have a contract test cell) could be more precise — specify a per-installer by ADR-0004-6-contract expected cell matrix, to avoid has-a-cell but misses-one-contract (e.g. rollback or no-silent-failure).

S5 — check-transparency-verdicts.mjs regex must handle markdown-bold-wrapped markers (bold Verdict vs plain Verdict). Recommend the T1.7 regex tolerate 0-2 asterisk wrapping, and docs/TRANSPARENCY-VERDICT-CHECKLIST.md should state whether the marker allows bold — otherwise docs like this PLAN-CHECK.md that use a bold Verdict marker either escape the gate or false-trigger.

---

## section 12 — Final verdict

APPROVED WITH CONDITIONS

- 0 BLOCKER — 8/8 acceptance bars fully task-covered, 22 tasks all CONCRETE + verifiable, dependency graph clean with no cycle, 29 decisions (D-01-14 / D-15-21 / D2.1-1-8) all consolidated with 3 RESOLVED chains consistent, A7 conservation chain complete, Karpathy simplicity passes, phase boundaries clean. Although the plan was main-agent direct-write (gsd-planner socket-error), its quality meets the executable bar.
- 4 WARNING — all low-to-medium repair cost, and all can be absorbed at each task start in execute-phase, no re-plan needed:
  - W1 (D-18 license enum location) — execute-phase T1.2 first action grep confirm, by-design acceptable
  - W2 (H3 budget numbers inconsistent) — execute-phase T1.1 measures and aligns the three numbers before drafting
  - W3 (transparency CI gate first-run red risk) — recommend a plan-layer lock of warn-only round 1; this is the one WARNING worth making explicit before execution
  - W4 (Wave 1-4 serial) — conservative orchestration, not an error, status quo acceptable
- 5 SUGGESTION — self-documentation / read_first completeness / regex detail, polish in execute-phase as convenient.

Conditions: before starting Wave 0 in execute-phase, the T1.7 implementer explicitly adopts transparency CI gate warn-only round 1 (W3 fix); the T1.1 and T1.2 implementers each do the grep/wc measurement check as the first step of their task (W1/W2 fix). Meet these 3 and phase 2.1 plan is fully cleared.

---

## section 13 — Recommended next step

1. (Optional, 5 min) main-agent edits W3 decide-at-execute-time in task_plan T1.7 to an explicit lock of warn-only round 1 (1-line edit), and adds the S1/S2 Wave-topology notes — removing the only plan-layer ambiguity for the executor.
2. Proceed to /gsd-execute-phase 2.1 — Wave 0 (T1.1-T1.8) runs first. Wave 0 is the prereq for the three installer dependencies (license / bundle / checkCmdString carve-out) and contains the transparency structural root-cause fix (KICKOFF hard constraint #8 — cannot be deferred again).
3. Within the Wave 0 batch, the three drafting-type tasks T1.1 (ADR) / T1.2 (license) / T1.7 (transparency) each do their W1/W2/W3 measurement-verification action at task start.
4. For Wave 1-4, if execute-phase uses a parallel batch executor, consider the W4/S2 parallelization optimization; otherwise run wave-by-wave per the D-10 order.
5. At Wave 5 ship, T6.4 three-platform CI + T6.5 adr-0010-accepted tag follow the phase 1.3-1.5 chicken-and-egg pattern (tag pushed after, A7 step warn-skips on the first run).

---

Phase 2.1 PLAN-CHECK complete — Wave C independent verification
Verdict: APPROVED WITH CONDITIONS (0B / 4W / 5S) — 2026-05-15
