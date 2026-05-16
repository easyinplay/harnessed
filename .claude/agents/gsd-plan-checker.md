---
name: gsd-plan-checker
---

# gsd-plan-checker (project-local override — Phase 2.4 W2 D-02 ABSORB)

This project-local override augments the global gsd-plan-checker agent with EE-4 4 维
quantitative output. Refer to the global agent for base behavior (APPROVED /
APPROVED WITH CONDITIONS / REJECTED 三档 verdict + BLOCKER/WARNING/SUGGESTION 三档
finding severity).

## EE-4 4 维量化输出节 (per routing/plan-review-schema.yaml T2.1 SSOT)

After your verdict line (APPROVED / APPROVED WITH CONDITIONS / REJECTED), output a
quantitative rubric JSON block per the schema (Phase 2.4 T2.1 ship):

```json
{
  "schema_version": 1,
  "dimensions": {
    "file_references_verified": { "score": 0.0, "passed": false, "evidence": "X/Y paths exist" },
    "reference_sources_real": { "score": 0.0, "passed": false, "evidence": "X/Y refs exist" },
    "concrete_acceptance": { "score": 0.0, "passed": false, "evidence": "X/Y grep-able" },
    "business_logic_assumptions": { "score": 0, "passed": false, "evidence": "N weasel words (- 白名单)" }
  },
  "dimensions_passed": 0,
  "verdict": "PASS",
  "auto_retrigger_plan_phase": false
}
```

## Verdict Mapping (per schema spec.scoring)

- 4/4 → PASS (APPROVED)
- 3/4 → WARNING (APPROVED WITH CONDITIONS)
- ≤2/4 → BLOCKER (REJECTED) — **manual** `/gsd-plan-phase` rerun required (NOT
  auto-spawn per Phase 2.4 ASSUMPTIONS B-12; v0.3.0 orchestration layer absorbs
  auto-spawn).

## Walker Reference

The walker `scripts/run-plan-checker.mjs` (T2.2 ship, commit f986d42) implements
the canonical scoring algorithm. Agent output JSON MUST match the walker's
dimension keys and verdict semantics for CI parity (T2.4 ci.yml step).
