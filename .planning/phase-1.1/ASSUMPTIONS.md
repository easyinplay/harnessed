# Phase 1.1 Assumptions Analysis

> Phase: v0.1.0 / Phase 1.1 - repo skeleton + manifest schema v1 frozen + ADR 0001
> Deliverables: 4-layer dir + workflows/SCHEMA.md + routing/SCHEMA.md + JSON Schema files + ADR 0001 (done)
> Acceptance: schema validator unit tests all green; any invalid manifest rejected

## Metadata

- Date: 2026-05-11
- Analyzer: gsd-assumptions-analyzer (Opus 4.7)
- Inputs read:
  - PROJECT-SPEC.md v2.1 (sec 1, sec 2, sec 4, sec 8.1, sec 9, sec 10)
  - WORKFLOWS-MVP.md v2.1
  - .planning/ROADMAP.md (v0.1.0 full + Phase 1.1 expansion)
  - .planning/REQUIREMENTS.md (R1.1, R1.4, R4.1, R5.1)
  - .planning/research/SUMMARY.md (4/4 HIGH)
  - .planning/research/03-integration-mechanisms.md sec 6.5 + sec 7
  - docs/adr/0001-manifest-schema-v1.md (Accepted)
- Repo state now: only spec + .planning + docs/adr/. No src/, tests/, package.json, workflows/, manifests/, routing/.

---

## A. Strong-evidence assumptions (no need to discuss)

### A1. manifest schema v1 fields and type-method matrix frozen

- Source: ADR 0001 sec Decision (docs/adr/0001-manifest-schema-v1.md L34-L138)
- Top-level 4 blocks: apiVersion / kind / metadata / spec
- 4 type by 5 install.method matrix locked (cc-plugin / cc-skill-pack / mcp-npm / cli-npm with paired method subsets)
- 17 required fields; reject list 4 items (dynamic shell escape / eval / extends / unknown fields)
- Strength: Accepted, user-locked (ADR L27-L31). Do not re-discuss.

### A2. Repo 4-layer dir structure locked

- Source: PROJECT-SPEC sec 4 (L70-L114) + ROADMAP Phase 1.1 must-have 1
- Tree: manifests/{tools,skill-packs}/, workflows/{SCHEMA.md, */}, routing/{SCHEMA.md, *.md}, config-templates/, vendor/, src/{installers,doctor,routing-engine,checkpoint}/, tests/, docs/adr/
- Strength: aligned with ECC / Cargo, locked by spec sec 4.

### A3. Implementation language = Node.js + TypeScript

- Source: PROJECT-SPEC sec 1 (L17) + sec 5.5
- Reason: 100% CC users have Node; most orchestrated components are npm packages; cross-harness future also Node.
- Strength: Locked.

### A4. JSON Schema strict = Kubeconform -strict semantics

- Source: ROADMAP must-have 7 (L65) + R04 P0#7 + REQUIREMENTS R1.4 + ADR 0001 L35
- Semantics: undeclared fields reject, type mismatch reject, fail before runtime.
- Strength: consistent. Library choice is B-class.

### A5. Workflows phases schema = workflows/SCHEMA.md, plan-feature is the reference

- Source: PROJECT-SPEC sec 10 (L298-L364) + WORKFLOWS-MVP Workflow 3 / design principle 2
- 9 fields: id / layer / upstream / invokes / inputs / outputs / pause(opt) / on_veto(opt) / conditional(opt)
- Strength: Locked.

### A6. Routing SSOT schema = yaml frontmatter shared by B + C layers

- Source: PROJECT-SPEC sec 9 (L258-L295) + REQUIREMENTS R4.1
- 3 blocks: trigger / hard_route / soft_hint (+ fallback). B-layer auto-generates description; C-layer hook reads hard_route.
- Strength: Locked.

### A7. ADR 0001 done; schema changes need new ADR

- Source: PROJECT-SPEC sec 8.1 (L210-L214) + ADR 0001 sec Compliance L168-L173
- Strength: discipline hardcoded - any field add/remove/rename/type change requires ADR 0002+ and full migration.

### A8. License = Apache-2.0; namespace = /harnessed:*

- Source: PROJECT-SPEC sec 1 (L20-L21) + sec 5.2
- Phase 1.1 impact: write LICENSE file at root + populate package.json fields.
- Strength: Locked.

---

## B. Implicit assumptions (clarify before plan-phase)

### B1. Repo layout = single-package monorepo vs workspace

- Unstated: spec sec 4 shows a single repo tree but does not say whether it is npm workspaces / pnpm workspaces / single package.
- Candidates:
  1. Single-package monorepo (recommended): one root package.json; everything in src/ ships as a single npm package `harnessed`. Simplest, aligns with karpathy simplicity.
  2. pnpm workspace: packages/{cli, core, installers, routing-engine}/ for future split publishing.
  3. Nx / Turborepo: over-engineering. Reject (only 9 upstreams + 4 workflows pre-v1.0).
- Recommendation: 1. Migrate to workspaces only if v0.5+ cross-harness adapters are split (e.g. @harnessed/cc-adapter + @harnessed/codex-adapter).
- Phase 1.2-1.4 impact: decides import paths in installers/cli-npm.ts and number of tsconfig.json files.
- Status: handed to advisor-researcher (see GA-2).

### B2. JSON Schema validator library choice

- Unstated: ADR 0001, spec, and research none pick a concrete npm library.
- Candidates (Node ecosystem):
  1. Ajv: most mainstream (130k+ weekly downloads), supports strict mode, JSON Schema draft-07/2019/2020, formats (uri, date) extensions, fine-grained errors. Recommended.
  2. @hyperjump/json-schema: modular and modern but small ecosystem and sparse docs.
  3. zod + zod-to-json-schema: TS-first but conflicts with our SSOT philosophy (zod schema is code, not yaml/json artifact - violates spec sec 3 data-driven principle).
  4. TypeBox: same issue as zod.
- Recommendation: Ajv. Reason: JSON Schema files themselves are repo artifacts (Phase 1.1 deliverable), Ajv consumes them directly; strict mode is built-in ({strict:true, allErrors:true}).
- Impact: tests/schema/*.test.ts shape + CI validation script deps.
- Status: handed to advisor-researcher (see GA-1).

### B3. Test framework choice

- Unstated: ROADMAP says `validator unit tests all green` without specifying vitest / jest / node:test.
- Candidates:
  1. Vitest (recommended): TS-first, native ESM, fast watch mode, jest API compatible. Trend (2024+ default for new projects).
  2. Jest: mature but ESM config painful; TS needs ts-jest or babel.
  3. Node:test (built-in): zero deps but weak assertion library (uses node:assert), small ecosystem.
- Recommendation: Vitest (matches karpathy simplicity + modern TS ecosystem).
- Impact: every installer unit test from Phase 1.2 onward, plus Phase 1.4 research workflow e2e.

### B4. JSON Schema file location and naming

- Unstated: ADR 0001 defines fields but does not specify schema file path on disk.
- Candidates:
  1. schemas/manifest.v1.json + schemas/workflow.v1.json + schemas/routing.v1.json (top-level schemas/ dir). Recommended - schema is a cross-language artifact and belongs at root.
  2. src/schemas/*.json - couples with TS impl, hard to reuse for cross-harness.
  3. Embedded inside manifests/SCHEMA.md / workflows/SCHEMA.md / routing/SCHEMA.md as code blocks - human-readable but Ajv cannot import directly.
- Recommendation: 1, with markdown links from SCHEMA.md. spec sec 4 omits schemas/ dir - plan-phase should add it.
- Impact: extends repo tree and SCHEMA.md cross-link conventions.

### B5. CI platform and config file location

- Unstated: ROADMAP mentions GitHub Actions matrix as Phase 1.2 work; unclear if Phase 1.1 lands a CI file Day 1.
- Candidates:
  1. Phase 1.1 lands .github/workflows/schema-validate.yml (schema validation + lint + typecheck only, no cross-OS). Recommended. Phase 1.2 adds cross-OS matrix (test + e2e).
  2. Phase 1.1 ships no CI; Phase 1.2 lands multi-platform multi-job at once. Risk: schema PRs merge without gating.
- Recommendation: 1. schema-validate single job on ubuntu-latest is enough (schema files are platform-independent JSON).
- Impact: Phase 1.2 just adds OS dimension instead of creating a new workflow file.

### B6. Schema unit tests fixture location and coverage definition

- Unstated: ROADMAP `any invalid manifest gets rejected` is fuzzy; need to define equivalence classes.
- Coverage decomposition:
  - Required field missing (17 required fields x 1 test each = 17 tests). Mandatory.
  - type x method matrix illegal combinations (4 type x 5 method = 20; 6 legal = 14 illegal tests). Mandatory.
  - Reject list (dynamic shell escape / eval / extends / unknown fields = 4 tests). Mandatory.
  - SPDX license non-whitelist value rejected. Mandatory.
  - 9 real upstream manifests all pass (fixtures from real v0.1 manifests/). Mandatory.
- Recommended fixture path: tests/fixtures/manifests/{valid,invalid}/*.yaml; pair each invalid fixture with *.expected-error.json.
- Impact: coverage threshold + Phase 1.1 effort estimate (about 50+ tests).

### B7. Whether to write manifests/SCHEMA.md (parallel to workflows + routing SCHEMA.md)

- Unstated: ROADMAP Phase 1.1 lists workflows/SCHEMA.md + routing/SCHEMA.md; does NOT list manifests/SCHEMA.md, yet ADR 0001 IS the manifest schema doc.
- Candidates:
  1. ADR 0001 is the de-facto manifest schema doc; ALSO add manifests/SCHEMA.md as the implementation view + 9 upstream example links. Recommended.
  2. Skip manifests/SCHEMA.md and let the first real manifest file in manifests/ serve as example. Inconsistent with the other two layers.
- Recommendation: 1 (uniform style across all 3 layers).
- Impact: deliverable count goes from 4 to 5 (minor).

### B8. Should LICENSE / NOTICES.md / CONTRIBUTING.md land in Phase 1.1?

- Unstated: spec sec 1 locks Apache-2.0 but does not say which phase writes the LICENSE file.
- Recommendation: Phase 1.1 lands LICENSE + placeholder NOTICES.md (empty list); existing README.md kept. CONTRIBUTING.md / MAINTAINER-ONBOARDING.md pushed to v0.4 (per SUMMARY).
- Impact: tiny; if not in Phase 1.1, blocks Phase 1.2 PR merges.

### B9. TypeScript config baseline (target / module / strict)

- Unstated: spec says Node + TS but does not pick ESM/CJS, target, strict level.
- Candidates:
  1. ESM + target ES2022 + module NodeNext + strict:true (recommended). Matches modern Node 20+ and the npx ctx7@latest-style ecosystem.
  2. CJS + target ES2020 + strict:false. Best compat but ESM-only upstreams (Tavily MCP etc.) fail to import.
- Recommendation: 1.
- Impact: import style in installer impl from Phase 1.2 + research workflow engine wiring in Phase 1.4.

---

## C. Risk-warning assumptions (could collapse later)

### C1. JSON Schema draft version compatibility

- Assumption: Ajv on draft-07 / 2020-12 is stable across all upstream schema reference scenarios.
- Risk: if v0.4 integrates sigstore signature schema (ADR 0001 L86-L88), sigstore bundles use draft-2020-12 which may clash with manifest schema draft.
- Mitigation: declare $schema URI 'https://json-schema.org/draft/2020-12/schema' in every schema file to unify the whole stack on 2020-12.

### C2. ADR 0001 field set is sufficient for 9 real upstreams

- Assumption: the 17 required + several optional fields cover every v0.1 upstream manifest writing need.
- Risk: while writing the 9 manifests in Phase 1.2/1.3 we discover an upstream needs a new field (e.g. gstack git_clone_post_setup_command), forcing ADR 0002 + migration into v0.1, breaking the sec 8.1 discipline.
- Mitigation: in Phase 1.1 do a pre-flight DRY-RUN draft of all 9 upstream manifests (drafts need not be precise, only validate field set sufficiency). If gaps appear, fold into ADR 0001 BEFORE locking the repo tag. Plan-phase should write this as an explicit task.

### C3. Windows-native filesystem / line-ending differences not yet hit

- Assumption: schema files + SCHEMA.md are cross-platform unambiguous in Phase 1.1.
- Risk: yaml CRLF vs LF; JSON Schema fixtures rewritten by git autocrlf at Windows checkout, breaking Ajv parsing in edge cases.
- Mitigation: land .gitattributes at repo root with star.yaml text eol=lf and star.json text eol=lf IN PHASE 1.1, do not wait for Phase 1.2 cross-OS CI to surface this.

### C4. CC plugin marketplace API stable during the v0.1 implementation window

- Assumption: ADR 0001 cc-plugin-marketplace install method semantics stays stable for ~6 weeks.
- Risk: Anthropic ships v2.2 changing marketplace.json structure (R03 sec 1.1 measured but the schema is not formally frozen by Anthropic).
- Mitigation: ADR 0001 already has apiVersion + a documented v2 upgrade path (L173-L178). No mitigation needed in Phase 1.1; just ensure weekly CI is in place before Phase 1.4 (lands in Phase 1.2).

### C5. JSON Schema strict mode (unknown fields rejected) conflicts with future extensibility

- Assumption: strict mode blocks user-defined metadata.
- Risk: in dogfooding (v0.2-0.3) community contributors want to add metadata.tags or similar custom fields and get rejected, raising fork friction.
- Mitigation: ADR 0001 L182-L184 already promises evaluating metadata.annotations free-field map in v0.2. No Phase 1.1 mitigation needed; plan-phase can include a note in SCHEMA.md tagged v0.2 review item.

### C6. Validator unit tests all green is NOT equivalent to schema is correctly designed

- Assumption: high coverage means schema is fine.
- Risk: unit tests verify schema correctly rejects illegal input; they do NOT verify schema is expressive enough. Typos / under-specification surface only when writing the first real manifest in Phase 1.2.
- Mitigation: plan-phase appends one task at the end of Phase 1.1: write a complete real-upstream manifest (suggest ctx7, the simplest) and run validator on it. Acceptance bar becomes not only invalid rejection but also legal acceptance verified.

---

## Four. Gray areas (advisor-researcher backlog)

### GA-1. JSON Schema validator + surrounding toolchain

- Question: in the Node.js ecosystem, what is the best toolchain for strict manifest schema validation?
- Candidate solutions:
  1. Ajv + handwritten fixtures + Vitest
  2. Ajv + ajv-formats + ajv-errors + custom error formatter
  3. @hyperjump/json-schema (modular)
  4. TypeBox / zod (schema-as-code; not recommended but compared as baseline)
- Scope of impact: Phase 1.1 (schema files + validator + unit tests) + Phase 1.2 (in-installer manifest load validation) + Phase 1.4 (routing schema validates with same validator)
- Priority: P0 (must be resolved in Phase 1.1, otherwise tests cannot be written)
- Status: handed to advisor-researcher (parallel)

### GA-2. Repo layout: monorepo / workspace / single package

- Question: which repo layout for harnessed v0.1-1.0 best balances karpathy simplicity with v0.5+ cross-harness extensibility?
- Candidate solutions:
  1. Single package (one root package.json)
  2. pnpm workspace (packages/{cli, core, installers, routing-engine})
  3. npm workspaces (same as 2 but using npm)
  4. Nx / Turborepo (reject - over-engineered)
- Scope of impact: Phase 1.1 (package.json + tsconfig.json count) + Phase 1.2 (installer file organization) + Phase 1.3 (DAG resolver placement) + v0.5+ cross-harness adapters
- Priority: P0 (must be picked in Phase 1.1; otherwise rework cost is high from Phase 1.2 onward)
- Status: handed to advisor-researcher (parallel)

### GA-3. (potential) Schema evolution v1 to v2 field migration toolchain

- Question: when v2 schema arrives in the future, how is harnessed manifest migrate command implemented?
- Priority: P2 (v0.5+ topic; does not block Phase 1.1)
- Status: no research needed now; ADR 0001 L173-L178 already documents the upgrade path

---

## Five. Spec-locked items (go directly to plan-phase, do NOT discuss)

- 4-layer dir architecture (PROJECT-SPEC sec 4 L70-L114)
- manifest schema v1 field set (ADR 0001 sec Decision)
- type x install.method compatibility matrix (ADR 0001 table)
- 4 component_type enum values + semantics (ADR 0001 sec component_type semantics)
- Required / optional / rejected field lists (ADR 0001 required-field overview + reject-list)
- workflows phases schema 9 fields (PROJECT-SPEC sec 10)
- routing SSOT schema 3 blocks (PROJECT-SPEC sec 9)
- JSON Schema Kubeconform -strict semantics (ROADMAP must-have 7 + REQUIREMENTS R1.4)
- Apache-2.0 + /harnessed:* namespace (PROJECT-SPEC sec 1 / sec 5.2)
- Node.js + TypeScript (PROJECT-SPEC sec 1)
- ADR process (PROJECT-SPEC sec 8.1 + ADR 0001 sec Compliance)
- Reject list 4 items (dynamic shell escape / eval / extends / unknown fields)
- SPDX license whitelist (MIT / Apache-2.0 / ISC / 0BSD / BSD-3-Clause)
- Phase 1.1 does NOT include installer impl / DAG resolver / setup-doctor (those are Phase 1.2-1.3)

---

## Six. Inputs to plan-phase (key callouts)

### 1. Phase 1.1 task list must include these 9 items

(per ROADMAP + this analysis)

1. Create root 4-layer dirs (with .gitkeep placeholders + README placeholders)
2. package.json + tsconfig.json + .gitattributes (B9 + C3)
3. manifests/SCHEMA.md (B7) + workflows/SCHEMA.md + routing/SCHEMA.md
4. schemas/manifest.v1.json + schemas/workflow.v1.json + schemas/routing.v1.json (B4)
5. src/schema-validator/ module (thin Ajv wrapper, after B2 / GA-1 settles)
6. tests/fixtures/manifests/{valid,invalid}/*.yaml + tests (B6)
7. tests/fixtures/workflows/{valid,invalid}/*.yaml + tests
8. tests/fixtures/routing/{valid,invalid}/*.yaml + tests
9. .github/workflows/schema-validate.yml (B5 - single ubuntu-latest job)

### 2. Phase 1.1 acceptance hard bar

(concretizing the fuzzy `validator unit tests all green`)

- JSON Schema unit tests >= 50 (per B6 decomposition)
- At least 1 real upstream (suggest ctx7) has a complete manifest passing the validator (C6 mitigation - not only reject tests, but also accept tests)
- schema-validate.yml CI runs on PRs automatically
- All invalid fixtures rejected 100 percent + error messages are readable

### 3. Out of Phase 1.1 scope (avoid scope creep)

- Any installer impl (Phase 1.2)
- DAG resolver (Phase 1.3)
- Cross-OS CI matrix (Phase 1.2)
- harnessed setup / doctor commands (Phase 1.3)
- Any real install / verify command execution (Phase 1.2+)
- All 9 upstream manifest files (only 1 written for acceptance; rest pushed to Phase 1.2)

### 4. Plan-phase decision dependencies

- GA-1 (validator lib) + GA-2 (repo layout) MUST settle on plan-phase day 1; otherwise tasks 5 / 6 cannot be planned
- B3 (Vitest) / B5 (schema-validate.yml) / B7 (manifests/SCHEMA.md) / B9 (TS config) - directly accept the recommendations in this analysis; no further discussion needed
- C2 mitigation (pre-flight DRY-RUN of 9 upstream manifest drafts) - schedule as a sub-task of task 5

### 5. Risk

Misjudging B1 (repo layout) causes installer file organization rework from Phase 1.2 onward. This analysis recommends single-package monorepo as the simplest start for v0.1-0.4. If advisor-researcher results contradict, reconcile on plan-phase day 1.

---
