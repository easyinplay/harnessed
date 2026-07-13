# Task: add a --median stat

Implement a `median` statistic with this exact spec:

1. `src/stats.mjs` exports `median(values)`. It validates input the same way the
   existing functions do (non-empty array of finite numbers, otherwise throw),
   sorts **numerically**, returns the middle value for an odd count and the
   average of the two middle values for an even count. It must not mutate the
   input array.
2. `src/cli.mjs` accepts a `--median` flag that behaves exactly like the
   existing `--mean`/`--min`/`--max` flags (composable with them, reported under
   the `median` key). Unknown flags must still exit 2.

The acceptance tests already exist in `test/median.test.mjs` and are currently
failing. Do not modify any test file. `npm test` must exit 0 when you are done.
