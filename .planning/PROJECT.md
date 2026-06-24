# PROJECT — harnessed

> Project charter. Regenerated 2026-06-05 from `.planning/intel/` reconciliation.
> Sister docs: [REQUIREMENTS.md](./REQUIREMENTS.md) · [ROADMAP.md](./ROADMAP.md) · [STATE.md](./STATE.md) · [CHANGELOG.md](../CHANGELOG.md)

## One-liner

AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」。不 vendor 上游代码,通过 manifest 描述 install/check + composition skill 编排 ECC / Superpowers / GSD / gstack 等异构上游组件成可执行 workflow。

## Core value

harnessed 是 the executable engine of the full three-layer-stack methodology — 把 CLAUDE.md 协作规则 machine-codify 成一个 subagent-isolated routing engine。不是「组装市场技能」,而是 orchestration brain + prompt library:main session orchestrates,通过 gates → prompt → spawn → checkpoint 把异构上游编排成 4-stage 可执行 workflow (discuss → plan → task → verify)。

## Current Milestone: v10.0 i18n Surface — opened 2026-06-24 (4 phases 29–32)

> Charter era-pointer only; live per-milestone position lives in `STATE.md`. (Refreshed at each milestone-open; was stale v5.1→v8.0.)

**Last shipped:** **v9.0 Cross-Harness** (2026-06-24, npm `4.7.0`) — PlatformDescriptor seam + central config resolvers + Codex second-platform proof; claude default byte-identical. Audit passed 3/3 (`milestones/v9.0-MILESTONE-AUDIT.md`). Released as part of v4.7.0 (bundled v8.0+v9.0+ECC).

**Active:** **v10.0 i18n Surface** — extend i18n from the shipped CLI message layer to the skill/workflow surface (comet model: ship EN+中文 skills). Full bilingual scope (user override of office-hours narrow recommendation) + Approach A parallel sibling files (`SKILL.md` + `SKILL.zh-Hans.md`, locale-aware resolve, CI sync-guard). 4 phases: 29 resolve layer / 30 sync-guard / 31 translation / 32 CLI gap close. Strategy gate: `v10.0-i18n-surface-DESIGN.md` (office-hours + ceo-review). 2 open design questions deferred to per-phase plan.

## Constraints

- **Runtime**: Node.js 22 + TypeScript + pnpm + vitest + biome. npm package `harnessed`, bin `harnessed` CLI.
- **License**: Apache-2.0. vendor/ entry whitelist: MIT/Apache-2.0/BSD/ISC/0BSD only, ≤500KB, no GPL/AGPL/SSPL/binary.
- **Do NOT vendor upstream code** — composition skill model Z (manifest describes install/check; never copies upstream source).
- **Cross-OS**: CI green on 3 platforms; Windows must stay green (historical Day-1 commitment, Git Bash required, no WSL — ralph-loop path conflict).
- **Commit safety**: NEVER push to remote without explicit user approval. Biome preempt (`pnpm exec biome check --write`) before every TS/JS commit (3 CI-red recurrences in project memory).
- **Degradations explicit**: no silent skip; hook fail → soft_hint (never block user); two error postures must not conflate (gate eval = fail-soft per ADR-0029; evidence guard = fail-closed per ADR-0033).
- **KARPATHY-minimal**: smallest effective code, no FSM library, surgical changes, small atomic commits.

## Success metric (developer-facing)

Shipped to npm + dogfooded across maintainer machines. v1.0 GA + v2.0 + v3.0 all shipped (current published **v4.3.0**, 2026-06-10 — v5.1 Upstream Re-sync; prior v4.2.0 = v5.0 State Machine Core Spec 1). 1160+ tests passing (1167 at v4.3.0), CI green on 3 platforms.

## Locked decisions (ADRs)

> LOCKED = Accepted, cannot be auto-overridden. See `docs/adr/`.

| ADR | Status | Decision |
|-----|--------|----------|
| 0006 | LOCKED | Wedge positioning — harnessed as composition orchestrator (foundational). |
| 0020 | LOCKED | Maintenance mode posture (stale-bot, weekly doctor, co-maintainer onboarding). |
| 0029 | LOCKED | Fail-soft gate evaluation — gate eval error → fire (degrade open). |
| 0030 | LOCKED | Bare slash command namespace (`/discuss-strategic`, no `:`/`/`/`.` prefix). Supersedes PROJECT-SPEC §5.2 `/harnessed:*`. |
| 0031 | LOCKED | 4-stage namespace-layered workflow (4 master + 16 sub + 2 standalone = 22 v3 workflows). Schema `harnessed.workflow.v3`. v2→v3 BREAKING (release-notes migration). |
| 0032 | LOCKED | L0 Discipline Substrate (6 yaml + 4 hooks) + L5b Execution Mechanism Layer + rules-based routing (4 judgments yaml). |
| 0033 | **Proposed** | Workflow state machine — progress ledger + fail-closed evidence guard (v5.0 forward scope, NOT yet locked). |

Auto-resolutions honored: (1) bare slash cmd > `/harnessed:*` prefix; (2) v4.0 CC-native spawn > in-process SDK spawn.

## Out of scope (deferred siblings, same v5.0 milestone)

- **Spec 2** — session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **Spec 3** — per-turn injection hook + scale-adaptive verify strength.
- Deferred security hardening pass (threat-model-gated, not active exploits): shell-injection in `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards in `sigintTrap.ts`/`before-commit.ts`.

## Architecture references

- `PROJECT-SPEC.md` — project parameter spec (manifest schema, routing SSOT, workflow phases, checkpoint execution).
- `.planning/milestones/v4.0-phases/v4.0/ARCHITECTURE-SPEC.md` — orchestration brain + 3 CLIs (gates/prompt/checkpoint) — SHIPPED v4.0.0.
- `.planning/milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` — v5.0 State Machine Core implementation contract (SHIPPED v4.2.0).
- `docs/adr/` — 33 ADRs. `.planning/milestones/` — shipped milestone audits (clean archive). `.planning/RETROSPECTIVE.md` — historical narrative.
