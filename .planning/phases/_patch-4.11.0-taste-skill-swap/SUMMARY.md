# Patch 4.11.0 — design capability swap: frontend-design → taste-skill

> Replace the Claude-only anthropic `frontend-design` with cross-agent `design-taste-frontend` (Leonxlnx/taste-skill), re-defining its role from XOR arbitration to a two-stage overlay atop `ui-ux-pro-max`.

## Why
harnessed's "creative / visual polish" design role used anthropic's `frontend-design` (git-cloned from `anthropics/skills`, a Claude-ecosystem `SKILL.md` install) — contradicts harnessed's cross-harness identity. taste-skill's `design-taste-frontend` is cross-agent (Claude Code + Codex, vercel-labs/agent-skills standard), MIT, purpose-built anti-slop.

## Role re-definition (user-locked)
- **Stage 1 `ui-ux-pro-max`** — audience / interaction logic / design axis (data-driven structural backbone). Always first on UI changes.
- **Stage 2 `design-taste-frontend`** — detail + visual polish overlay → premium ("usable page" → "eye-catching work"). Always layered on top (decision: default-on, not gated).
- Was XOR (`requires_creative_polish` discriminator); now sequential. `requires_creative_polish` is now an orphan field (marked legacy; not removed — schema+test churn out of scope).

## Changes
- **Manifest**: del `frontend-design.yaml` (anthropic git-clone); add `design-taste-frontend.yaml` (`npx-skill-installer`, `npx skills add github.com/Leonxlnx/taste-skill --skill design-taste-frontend --copy --global`, cross-agent idempotent_check `~/.claude/skills/` ‖ `~/.agents/skills/`).
- **capabilities.yaml**: `frontend-design` → `design-taste-frontend` (`install_type: user-skill` per schema; `fires_when: has_ui_changes`).
- **web-design-routing.yaml**: XOR → two-stage (`ui-ux-pro-max-structure` + `design-taste-polish`, both fire on `has_ui_changes`).
- **verify/design**: workflow.yaml `tools_available` + SKILL.md (en/zh).
- **docs**: WORKFLOW.md, AGENT-DEFINITION-FACTORY-CONTRACT.md, routing/{decision_rules.yaml, SCHEMA.md, README.md}.
- **README**: en (verify-design row + design-routing summary → two-stage) + 9 localized (verbatim `frontend-design`→`design-taste-frontend` name swap; deeper two-stage reword deferred to next i18n re-sync).
- **tests**: git-clone-idempotent (drop frontend-design assertion — now only gstack/ui-ux git-clone), manifest-install-dry-run, phase-2.3-e2e, ui-ux-pro-max fixture.

## Carve-outs (intentional)
- `routing/decision_rules.yaml` (legacy v0.2, no runtime loader): pointer rename + two-stage reword, kept L1 arbitration structure (engine refactor out of scope).
- `requires_creative_polish` field kept (orphan, commented legacy).
- ADRs / CHANGELOG / PROJECT-SPEC historical mentions unchanged.

## Gate
tsc 0 · biome · validate-schema · check-workflow-schema (C1/C3 capability-name cross-validate) · skill+yaml i18n-parity · relevant vitest suites green (local vitest slow via orphan-proc; CI authoritative). Published npm 4.11.0.
