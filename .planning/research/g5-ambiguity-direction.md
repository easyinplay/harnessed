# G5 — ambiguity-gate direction (discuss-only, lead-authored)

Date: 2026-11-09 · Status: direction decided, **no implementation**. The scope
approved 2026-10-14 is *discuss only* — this document IS the deliverable; it
creates no dataset, rubric, weights, threshold, schema, or command.

## Problem

Reduce unnecessary clarification without silently skipping consequential
decisions.

## Verified current state

- Gate sources: `workflows/judgments/{strategic-gate,phase-gate,subtask-gate}.yaml`
  and `workflows/role-prompts.yaml` lines 214–220.
- The existing deferrable-relay mechanism is a workflow/prompt contract —
  **not** a claim that a new runtime relay was proven.
- Subtask gate already encodes the Phase 58 fix: a skip veto may NOT override
  design-risk signals. That fail-closed behavior stays untouched.

## Upstream research (OMC)

Official OMC `deep-interview` skill
(https://github.com/Yeachan-Heo/oh-my-claudecode/blob/main/skills/deep-interview/SKILL.md):
threshold source resolved first (project/user/default), persists the source,
and requires both a threshold AND explicit execution approval.

Upstream issue reports (reports only — NOT local reproductions):
- #2192 — config documented but unread
  (https://github.com/Yeachan-Heo/oh-my-claudecode/issues/2192)
- #2545 — incomplete runtime substitution
  (https://github.com/Yeachan-Heo/oh-my-claudecode/issues/2545)
- #3028 — claimed 5th recurrence / plugin-qualified path
  (https://github.com/Yeachan-Heo/oh-my-claudecode/issues/3028)

OMC's default 0.2 is a **product policy**; there is no evidence it is
calibrated for harnessed — or even for OMC itself. (The earlier second-opinion
phrasing "0.2 is about the OMC corpus" is an interpretation, not a fact, and
is not repeated here as one.)

## Alternatives evaluated

- **A — import a numeric ambiguity threshold now**: rejected. No labeled
  outcome data, no calibration; a number lifted from another product's policy
  would be cargo, not engineering.
- **B — reason-oriented clarification records on the existing gate paths**:
  a possible future minimal experiment (structured reasons recorded where the
  current gates already fire). NOT implemented and NOT approved as
  instrumentation — would need its own spec covering calibration/evaluation
  design, storage, and privacy.
- **C — retain existing gates, write this evidence-based direction** (chosen):
  no engine changes now; reopen on concrete missed-decision or
  unnecessary-interruption cases, not fabricated accuracy metrics.

## Decision

- No numeric score now; no fail-open relaxation; no forced UX questions to
  satisfy a score.
- Independent second opinion agrees: no numeric adoption now; suggests
  structured reason records later. Lead agrees — without expanding the
  discuss-only scope into instrumentation.
- Existing nonnegotiable fail-closed policy stays; keeping it needs no user
  approval.

## Status in TODOS

G5 marked discuss-complete → this doc. Numeric implementation NOT delivered
and NOT silently started.
