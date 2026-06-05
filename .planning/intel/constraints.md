# Constraints Intel (SPECs)

> Synthesized by gsd-doc-synthesizer (2026-06-05) from 4 classified SPECs.
> Constraints are implementation contracts the system must honor. Where a SPEC
> assertion is superseded by a higher-precedence LOCKED ADR, it is flagged and the
> ADR value is recorded as authoritative (see INGEST-CONFLICTS.md INFO bucket).
>
> SPEC precedence: PROJECT-SPEC (prec=1) > WORKFLOWS-MVP (prec=2) > others (default).

---

## PROJECT-SPEC.md — Project Parameter Spec Sheet (v3) [precedence=1]

- **source**: `PROJECT-SPEC.md`
- **type**: project-contract (self-labeled "Locked v3"; classifier locked=false since locked reserved for Accepted ADRs)

### C-PS-1 — Positioning (api-contract / behavioral)
harnessed = executable engine of the full three-layer-stack methodology. Not "assembling market skills" — machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Base + Extension dual-layer; do NOT vendor upstream code (composition skill model Z).

### C-PS-2 — Manifest schema (schema)
4 manifest types (`cc-plugin` / `cc-skill-pack` / `mcp-npm` / `cli-npm`, ADR-0001). 6 install methods (ADR-0003). v3 NEW fields via ADR-0007 errata: `install_type` (skill|mcp|npm|git), `category` (meta|engineering|design|content|testing|search), `decision_rules` (optional YAML). `manifest.lock.yaml` upstream version locking: git commit hash (plugins/skill-packs), `^minor` (MCP/CLI).

### C-PS-3 — Routing SSOT schema (schema / protocol)
B+C hybrid. `routing/*.md` frontmatter shared by B layer (skill description) + C layer (UserPromptSubmit hook). Blocks: `trigger` / `hard_route` / `soft_hint` / `fallback`. Hook fail → degrade to soft_hint (never block user). Acceptance: routing hit-rate ≥85% on 30 samples (Haiku/Sonnet/Opus ≥8 each) + token budget ≤1% context window. [SHIPPED v0.3-v0.4 at 100%.]

### C-PS-4 — Workflow phases schema (schema)
`workflows/*/SKILL.md` frontmatter: `id` / `layer` (governance|orchestration|execution) / `upstream` / `invokes` / `inputs` (`$NN.outputs`) / `outputs` / optional `pause` / `on_veto` / `conditional`.

### C-PS-5 — Checkpoint-based execution (protocol)
`.harnessed/` runtime: `current-workflow.json` + `checkpoints/` (summaries <1k token, enter context) + `archive/` (full output, never enters context). Later phases read checkpoint only. `harnessed resume` from `current-workflow.json`.

### C-PS-6 — Engineering discipline (nfr, CI-gated)
manifest schema v1 frozen before code; vendor/ entry whitelist (MIT/Apache-2.0/BSD/ISC/0BSD, ≤500KB, no GPL/AGPL/SSPL/binary); hooks data-driven (no shell eval); setup explicit-confirm + dry-run + backup; MCP via `claude mcp add --scope project` (avoid CC #54803); all degradations explicit (no silent skip).

### C-PS-7 — SUPERSEDED: namespace `/harnessed:*` full prefix (§5.2)
**Superseded by ADR-0030 (LOCKED, bare slash cmd).** Authoritative value: bare `/discuss-strategic`, no namespace prefix. PROJECT-SPEC §1 "命名空间 `/harnessed:*` 完整前缀" is the older v3-wedge era assumption; the v3.0 milestone reversed it. See INGEST-CONFLICTS.md.

---

## WORKFLOWS-MVP.md — MVP Workflows Design (v2) [precedence=2]

- **source**: `WORKFLOWS-MVP.md`
- **type**: workflow-design-contract (eng-review approved, schema locked)

### C-MVP-1 — 3 MVP workflows (api-contract)
`/harnessed:research` (v0.1, multi-source Tavily/Exa/ctx7 routing), `/harnessed:execute-task` (v0.2, clarify→code→test→deliver), `/harnessed:plan-feature` (v0.3, governance→brainstorm→discuss→plan→persist, reference implementation).

### C-MVP-2 — Shared persistence contract (protocol)
`.harnessed/` dir; compact protocol (each pause writes <1k-token checkpoint, full output to archive; later phases read checkpoint only); session resume via `harnessed status` + `harnessed resume`.

### C-MVP-3 — Error degradation (nfr)
Upstream unavailable → manifest fallback; missing required dep → `harnessed doctor` fix hints; no silent skip; hook fail → soft_hint; upstream deprecate/rename → `upstream_health` field + weekly doctor + `aliases.yaml`.

### C-MVP-4 — Platform constraints (nfr)
MCP installer forces `--scope project` (CC #54803); Windows native npx → `cmd /c` wrapper; ralph-loop `--completion-promise` unreliable (issue #1429) → `--max-iterations` mandatory fallback; Git Bash required (no WSL — ralph-loop path conflict).

**Note**: WORKFLOWS-MVP namespace examples use `/harnessed:*` — superseded by ADR-0030 bare convention (same as C-PS-7). The 3 MVP workflows themselves were later refactored by ADR-0031 into the 4-stage architecture.

---

## .planning/v4.0/ARCHITECTURE-SPEC.md — Orchestration Brain + Prompt Library

- **source**: `.planning/v4.0/ARCHITECTURE-SPEC.md`
- **type**: architecture-contract (ready-to-plan, D0-D3 locked, SHIPPED v4.0.0 2026-05-30 per CHANGELOG)

### C-V4-1 — Architecture direction (api-contract)
harnessed = orchestration brain + prompt library; execution = CC-native subagent/Agent Teams spawn (NOT in-process SDK spawn). Main session orchestrates; `harnessed run` retained as CI/headless-only.

### C-V4-2 — 3 new CLI subcommands (api-contract)
`harnessed gates <master>` → JSON `{fire, skip, parallelism}` (reuses `resolveJudgmentGate`, no spawn). `harnessed prompt <sub>` → spawn-ready prompt with COMPLETE + NEEDS_CLARIFICATION protocols (reuses `buildAgentDef` + `loadRolePrompts`). `harnessed checkpoint <complete|fail|start> <sub>` → state persistence.

### C-V4-3 — Command body templates (protocol)
3 types: INTERACTIVE (discuss + task-clarify, main-session dialogue, no spawn), ORCHESTRATOR (auto/plan/task/verify masters, gates→prompt→ralph-loop spawn→checkpoint), EXECUTION (other subs, single spawn). NEEDS_CLARIFICATION round-trip enabled because spawner is CC main session (can dialogue).

**Note**: ARCHITECTURE-SPEC v4.0 supersedes the SDK-spawn execution model assumed in WORKFLOWS-MVP/PROJECT-SPEC checkpoint sections. Both remain valid for their schema/persistence contracts; only the execution mechanism changed. See INGEST-CONFLICTS.md INFO.

---

## .planning/v5.0/STATE-MACHINE-CORE-DESIGN.md — State Machine Core (Spec 1)

- **source**: `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md`
- **type**: implementation-contract (DESIGN LOCKED, forward-scope, NOT shipped). Locking authority delegated to ADR-0033.

### C-V5-1 — Data structures (schema)
`src/checkpoint/schema/currentWorkflow.v1.ts` add `EvidenceRef {path, sha256}` + `SubProgressEntry {sub, status∈{pending,done,failed,skipped}, gate_fired, reason?, evidence_status?∈{verified,none_declared,overridden}, evidence?}` + `sub_progress: Optional(Array(...))`. `checkpoint.v1.ts` NOT modified (single SoT, eng-review D1).

### C-V5-2 — Two error postures (protocol — must not conflate)
Gate eval = fail-soft/fire (ADR-0029, unchanged, in `gates.ts`/`judgmentResolver`). Evidence guard = fail-closed/block (ADR-0033, NEW, in `checkpoint complete`). ADR-0033 records the distinction so a future "unify error handling" refactor cannot collapse evidence into fail-soft.

### C-V5-3 — CLI surface (api-contract, surgical)
`checkpoint start <master> --plan <json>` (seed ledger from gates output), `checkpoint complete <sub> [--force]` (evidence guard), `checkpoint fail <sub>`, `status --recover` (NEW flag), `resume` (+ evidence re-hash drift).

### C-V5-4 — Component isolation (nfr)
`src/checkpoint/ledger.ts` (pure fns, no I/O), `src/checkpoint/evidence.ts` (only fs/crypto touch), `src/cli/status.ts --recover` branch (pure formatting). Invariants preserved: ADR-0029 fail-soft, atomic write (`writeFileAtomic`), proper-lockfile dir lock, KARPATHY-minimal (no FSM lib).
