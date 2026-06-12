# break-loop — deep analysis to escape fix-forget-repeat

> G6 anti-thrash companion. Triggered when harnessed reports a `BREAK-LOOP` directive.

## When this fires

A `BREAK-LOOP` line appears in either place when the same sub-workflow has failed
`fail_count >= 3` times (`LOOP_THRESHOLD`):

- `harnessed checkpoint fail <sub>` stderr — at the moment the 3rd failure is recorded.
- The `<workflow-state>` breadcrumb injected per-turn (G4 hook) — on every prompt while the
  loop persists.

Example:

```
[harnessed] BREAK-LOOP: sub 'task-code' failed 3x (>= 3). Stop retrying — run the
break-loop skill for root-cause analysis and capture the lesson to .planning/.
```

## The rule

**Stop retrying the same fix.** Three failures on one sub means the current mental model is
wrong, not that the fix needs one more attempt. Switch from fixing to analyzing.

## Analysis framework (5 dimensions)

Borrowed from Trellis `trellis-break-loop`. Work the bug you just failed to fix through all
five:

### 1. Root cause category

| Category | Characteristic |
|----------|----------------|
| Missing spec | No documentation on how it should work |
| Cross-layer contract | Interface between layers unclear / mismatched |
| Change propagation failure | Changed one site, missed the others |
| Test coverage gap | Unit passes, integration fails |
| Implicit assumption | Code relies on an undocumented assumption |

### 2. Why prior fixes failed

Surface fix (symptom not cause) · incomplete scope (right cause, missed cases) · tool
limitation (grep/typecheck missed it) · wrong mental model (kept looking in the same layer).

### 3. Prevention mechanism

Documentation · architecture (make the error structurally impossible) · compile-time (strict
types, no escape hatches) · runtime (monitoring/scans) · test coverage · code review.

### 4. Systematic expansion

Where else does this class of bug live? Is there a design flaw, a process flaw, or a team
knowledge gap behind it?

### 5. Knowledge capture

Write the lesson down so the next session does not repeat it:

- Append the root cause + prevention to `.planning/` (GSD lessons / RETROSPECTIVE).
- If the project has no `.planning/`, record it in the repo's findings/notes doc.
- Update the relevant spec or requirement so the assumption is no longer implicit.

## After analysis

Once the real root cause is identified and captured, resume work with a fix that targets the
cause (not the symptom). If the sub then completes, `harnessed checkpoint complete <sub>`
clears the loop; if it is genuinely abandoned, `harnessed reject <sub>` marks it terminal
(distinct from `failed`, so it stops driving the loop counter).
