# Phase 32 task_plan (PWF) — CLI message gap close

> Checklist + dep map. Spec: [PLAN.md](./PLAN.md). Status: [progress.md](./progress.md). Findings: [findings.md](./findings.md).

## Dependency order
```
T32.1 (parity test, TDD red)
   └─> T32.2 (add 16 + remove 2 dead → green)
          └─> T32.3 (gate)
```

## Checklist
- [ ] **T32.1** NEW `tests/unit/i18n-parity.test.ts` — flatten en.json + zh-Hans.json, assert key-set equality both directions. RED now (80 vs 94 + 2 extra).
- [ ] **T32.2** MODIFY `messages/zh-Hans.json` — add 16 translated `uninstall.unified.*` (preserve `{{count}}` + `\n`, keep identifiers English); remove 2 dead `uninstall.yes_dryrun_conflict[.fix]`. → 94/94 green.
- [ ] **T32.3** GATE — biome --write clean (JSON), tsc clean, full vitest green vs 1423 + parity test, en.json byte-identical.

## TDD scope
Parity assertion = **TDD red-green** (T32.1 red → T32.2 green). The 16 string translations are data but the parity gate is real testable mechanism. No TDD-skip needed.

## Acceptance (REQ-v100-cli-gap)
`zh-Hans.json` key-set == `en.json` key-set (94/94); en-default byte-identical; existing i18n `t()` tests green + the parity assertion; green gate.
