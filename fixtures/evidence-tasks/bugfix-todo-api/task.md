# Task: fix the dueBefore boundary bug

One test in this repo fails: `list({dueBefore}) includes a todo due exactly on the
boundary date`. The documented contract (see the JSDoc on `list()` in
`src/store.mjs`) says `dueBefore` keeps todos due **on or before** the given date,
but the current implementation excludes the boundary day.

Fix the implementation so the failing test passes. Do not modify any test file,
do not change the public API, and keep all other tests green. `npm test` must
exit 0 when you are done.
