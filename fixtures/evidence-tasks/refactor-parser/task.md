# Task: extract the duplicated value-unescaping logic

`src/parser.mjs` contains the same value-processing block copy-pasted twice
(marked with `duplicated unescape block #1 / #2` comments). Refactor it:

1. Create `src/escape.mjs` exporting a function `unescapeValue(rawValue, lineNo)`
   that contains the shared logic: quoted-value unescaping (`\n`, `\t`, `\"`,
   `\\`, with the same error messages for unterminated quotes and bad escapes)
   and unquoted trailing `;` comment stripping. It returns the processed value.
2. `src/parser.mjs` must import `unescapeValue` from `./escape.mjs` and use it in
   BOTH branches — the duplicated blocks must be gone.
3. Behavior must be identical: do not modify any test file; `npm test` must stay
   green (all 6 tests). The public API of `parse()` must not change.
