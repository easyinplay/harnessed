# Task: add recurring-todo support (compound feature)

This repo is a small in-memory TODO store (`src/store.mjs`) with a passing test
suite. Implement recurring-todo support end to end. There are SEVEN explicit
acceptance requirements — all of them are checked mechanically, so treat each
one as a deliverable, not a suggestion:

- **R1 — recurrence field.** `add()` accepts an optional `recurrence` field with
  exactly two legal values: `'daily'` or `'weekly'`. Any other non-null value
  must be rejected with a thrown `Error` (message must mention `recurrence`).
  Todos without the field behave exactly as before.
- **R2 — next instance on complete, exactly once.** When `complete(id)` is called
  on a recurring todo, the store creates ONE new pending todo: same `title`,
  same `recurrence`, and `due` rolled forward by the period (`daily` = +1 day,
  `weekly` = +7 days, correct across month/year boundaries). Completing the SAME
  id again must be idempotent — it must NOT create another instance.
- **R3 — zero behavior change for plain todos.** All pre-existing tests keep
  passing UNMODIFIED. Do not edit or delete the existing tests in
  `test/store.test.mjs` (adding new tests is allowed and required — see R4).
- **R4 — author tests for the new behavior.** Add at least FOUR new tests
  covering recurrence, including at minimum: the invalid-value rejection, and
  the complete-twice idempotency edge.
- **R5 — document the API.** Add a `README.md` with an API documentation section
  for the new behavior: the `recurrence` field, what `complete()` does for
  recurring todos, and at least one fenced code-block example.
- **R6 — dueBefore interaction.** New instances created by R2 participate in
  `list({dueBefore})` filtering correctly (the documented on-or-before boundary
  semantics apply to them like any other todo).
- **R7 — green finish.** `npm test` must exit 0 when you are done.
