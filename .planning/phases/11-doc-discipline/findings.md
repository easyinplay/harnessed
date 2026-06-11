# Phase 11 — findings (grounded impl references)

> planning-with-files findings. Grounded 2026-06-11 (grep-over-assume per CLAUDE.md cross-ref checklist).
> Distilled facts only — full plan in `11-PLAN.md`, requirements in `REQUIREMENTS.md` (REQ-v60-doc-discipline).

## Discipline schema (`src/workflow/schema/discipline.ts`) — verified

- `Discipline` object: `schema_version` (literal `harnessed.discipline.v1`), `discipline` (basename string), `enforcement_layer`, `auto_enforce` (bool), `rules[]`, optional `priority_hierarchy` / `protocols`.
- `enforcement_layer` ∈ `code-writing | output | commit | workflow | tool`. → **doc-discipline uses `commit`** (STATE line check fires at `.planning/` doc commit).
- `DisciplineRule`: `id` (kebab), `description`, `enforcement` ∈ `halt | warn | auto-fix | info`, `trigger` (string expr OR string[]), `check_method` (heuristic/regex/external-cmd/llm-judge/file-content-match), optional `auto_fix_cmd` (auto-fix only).
- `additionalProperties: false` STRICT — no extra keys.

## Enforcement hook (`src/discipline/enforcement/before-commit.ts`) — verified

- Pattern: `const d = await loadDiscipline('operational', ctx.packageRoot)` → `d.rules.find(r => r.id === '...')` → enforce per `enforcement`.
- `CommitHookCtx`: `changedFiles[]`, `cmdArgs[]`, `packageRoot`, `cmdType` (`git-commit|git-push`), `hasUserApproval`.
- halt = `process.exit(2)`; auto-fix = `execSync(rule.auto_fix_cmd)`.
- **Extension point**: add a parallel `loadDiscipline('doc', root)` block — when `changedFiles` touches `.planning/STATE.md`, run `wc -l` halt-with-override (env override e.g. `HARNESSED_ALLOW_LONG_STATE=1`).

## Capability entry shape (behavioral discipline-ref) — verified `capabilities.yaml:529`

```yaml
  doc-discipline:
    impl: harnessed-bundled
    cmd: '<not-applicable-behavioral>'
    since: v6.0
    category: behavioral
    description: <文档纪律 6 rules summary>
    discipline_ref: workflows/disciplines/doc-discipline.yaml
```

## Loader — verified

- `src/workflow/disciplineLoader.ts` `loadDiscipline(name, root)` loads `workflows/disciplines/<name>.yaml` by basename. `doc-discipline.yaml` auto-loadable; check if any hard-coded discipline list needs the new name appended (grep `DISCIPLINE_FILES` / loader array during execute).

## 6 rules to encode (from CLAUDE.md 文档纪律 + discuss hardness decision)

| id | enforcement | check_method | note |
|---|---|---|---|
| `state-digest-line-limit` | **halt** (override) | external-cmd | STATE.md >100 lines → exit 2 unless override env |
| `one-fact-per-file` | warn | heuristic | decision docs single-topic |
| `overview-pointer-no-inline-narrative` | warn | heuristic | ROADMAP/overview no closing narrative inline |
| `transient-consume-then-archive` | warn | heuristic | HANDOFF/transient archived after consume |
| `status-derived-from-artifacts` | warn | heuristic | phase status from VERIFICATION not hand-maintained |
| `responsibility-matrix-one-home` | info | heuristic | one-fact-one-home routing |

## Open for plan

- Exact override mechanism for `state-digest-line-limit` (env var name + task-spec override path).
- Whether `one-fact` / `overview-pointer` heuristics are commit-time (changedFiles content scan) or advisory-only this phase.
- Test fixtures location (sister `tests/cli/` + `tests/workflow/`).
