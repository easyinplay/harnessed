# CONTRIBUTING-BENCHMARK -- Manual Re-Run Instructions

> **Cadence (D-04 LOCKED)**: MANUAL on-demand only -- NO weekly cron / NO per-PR full benchmark (sister Phase 3.4 routing harness already gates per-PR via `pnpm test`)

## When to re-run

- `.planning/phase-3.4/SAMPLES.md` 30-row source churn (ADR-needed-to-amend)
- `routing/decision_rules.yaml` v3 release (rule priority changes)
- `versions/<harnessed-ver>-known-good.yaml` upstream major version bump

## Pre-flight

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm build  # MUST run BEFORE test per Phase 3.4 CI hotfix 554b82b
```

## How to re-run

```bash
# Step 1 -- Routing harness re-run (expected 30/30 = 100%)
corepack pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts

# Step 2 -- E2E upgrade log re-capture (per D-03 4-section)
node ./dist/cli.mjs install ctx7 --known-good --dry-run --non-interactive --system 2>&1 | tee -a docs/benchmarks/v0.4-upgrade-e2e.log
node ./dist/cli.mjs install gstack --known-good --dry-run --non-interactive 2>&1 | tee -a docs/benchmarks/v0.4-upgrade-e2e.log

# Step 3 -- Update docs/benchmarks/v0.4.md if hit/miss verdict changed (D-02 NO suppress miss cases)
# Step 4 -- Commit + push (NO CI gate fires per D-04 MANUAL)
```
