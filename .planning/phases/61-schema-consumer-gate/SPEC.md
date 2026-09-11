---
phase: 61
name: Schema Consumer Gate
status: complete
created: 2026-09-11
completed: 2026-09-11
gates_passed:
  - strategic gate SKIPPED (declared): the structural answer to a defect class
    this repo has already paid for six times; scope came from the three-way gap
    analysis the user asked for, not from a new product direction.
  - user decision: "按你的建议来" — item 1 (build the gate) then item 2 (resolve
    what it flags)
verified_refs:
  - "scripts/check-schema-consumers.mjs (NEW)"
  - "src/manifest/schema/spec.ts — TestedWithVersions + mutually_exclusive_with removed"
  - "src/installers/ccPluginMarketplace.ts:151 — marketplace_source wired"
  - "src/cli/lib/check-ecc.ts — the hand-written mutual-exclusion check that outlived the declarative one"
  - "schemas/manifest.v1.schema.json regenerated (build + build:schema)"
  - ".github/workflows/ci.yml — wired before pnpm install (dep-free)"
---

# Phase 61 — Schema Consumer Gate

## The class

harnessed's central bet: describing composition **declaratively** scales better
than bespoke imperative installers. What it buys along with the scaling is a
failure mode the imperative approach cannot have — **a declaration that nothing
evaluates**. In comet's model the installer code *is* the description, so a field
cannot be "declared but dead"; there are no fields. Here, declaration and
evaluation are separate artifacts, and neither TypeScript nor the schema nor CI
notices when the second one is missing.

Thirteen instances were found by hand across Phases 54-59 and the gap analysis
(table in `docs/comparison.md`). This phase builds the machine.

## What the gate proves, and what it does not

- **Proves (sufficient):** a field name absent from every non-comment line of
  `src/` and `scripts/`, outside its own schema, is certainly not read.
- **Does not prove (not necessary):** liveness. Two known false-negative classes —
  cross-artifact name collision (`spec.decision_rules` reads as live only because
  a script mentions the unrelated `routing/decision_rules.yaml`) and dynamic
  access (`spec[key]`).

So a red gate is always a real finding; a green gate is a floor, not a certificate.
That is stated in the script header, not just here.

Two design points that decide whether the gate lies:

- **Comments are stripped before searching.** Several of the thirteen lived only
  in prose. `component_type` survives in a comment at `src/cli/setup.ts:90`
  claiming output is grouped by it, while the code groups by `spec.type`. Counting
  that comment as a consumer would have hidden the defect.
- **"Evaluated" has two meanings.** `license` has no reader anywhere, yet a
  non-whitelisted licence fails `Value.Check` because its type is a literal union —
  the declaration does real work, just not by being read. So the report has three
  tiers: read by code (57) / shape-enforced only, advisory (14) / **evaluated by
  nothing at all (hard fail)**. Missing the middle tier would have made the gate
  cry wolf on the licence whitelist, which is one of the few supply-chain claims
  this project actually delivers.

## Two defects the gate found in itself

Both fixed before it was trusted:

1. **Self-reference.** The script names fields in its own error text and exemption
   reasons. Those are string literals, not comments, so it read its own prose as
   a consumer — `marketplace_source` went green purely because a paragraph
   mentioned it. Fixed by excluding the script from its own consumer set.
2. **Half-blind declaration detection.** The first version matched only
   `name: Type.X(...)` and missed `name: NamedSchema` — so it never even saw the
   `license` / `stability` / `fallback_action` family it was written to audit.
   Widened; the declared-field count went 66 → 81.

It also produced two false positives that were checked rather than accepted
(`apiVersion`, a named `Type.Literal` const; `provides`, constrained by
`minItems`/`uniqueItems`) — both were classifier gaps, both fixed, count now 0.

## Resolutions

| field | resolution | why |
|---|---|---|
| `tested_with_versions` (+`cc_versions`, `node_versions`) | **deleted** | ADR-0001 documented it as "weekly CI 会回填"; that CI never existed — the same phantom that licensed `upstream_health` to rot until Phase 55. One manifest had filled it by hand; nothing read it. |
| `mutually_exclusive_with` | **deleted** | schema'd, documented "v0.2+ 启用", never wired, and **zero manifests ever declared it**. |
| `marketplace_source` | **wired** | three manifests declare it while the installer regexed the same value back out of the command string. Declared now wins; regex is the fallback. |
| `brainstorming_required`, `license_source`, `override_signals` | **exempt, KNOWN DEAD** | each with the reason it is not yet decided. |

`mutually_exclusive_with` is the sharpest lesson and it **corrects a judgement I
published earlier the same day**: `docs/comparison.md` said it "should probably be
wired". Zero declarations means wiring it is building a machine for a
hypothetical. Delete; re-introduce only when a second real case exists, in the
same commit that wires it. The one real case (ECC's bundled chrome-devtools
connector vs the standalone manifest) is already handled imperatively in
`check-ecc.ts` — which is precisely how the dead declaration went unnoticed.

An exemption without a reason is the same defect one level up, so every entry
carries one.

## Verification

- Gate green: `77 declared field(s): 57 read by code, 14 shape-enforced only, 0
  evaluated by nothing, 6 exempt`.
- **Falsified before being trusted:** injecting `zz_probe_dead_field` into
  `spec.ts` makes it exit 1 and name the field; removing it returns green.
- `schemas/manifest.v1.schema.json` regenerated via `pnpm build && pnpm
  build:schema` and verified to no longer contain the deleted fields — a stale
  `dist/` producing an old schema has burned this repo before (4.14.0→4.14.1).
- `validate-schema`, `tsc --noEmit`, biome clean.
- CI wired before `pnpm install` (dep-free: fs + regex only), sister
  `check-provenance`.

## Still open

- The three exempted fields need decisions. `override_signals` should be decided
  with the whole `spec.decision_rules` subtree at once — its own comment calls it
  "a redundant guard layer; SSOT remains routing/decision_rules.yaml".
- `component_type` (required on all 19 manifests, read by nothing) and
  `upstream_health.alternative` are exempted from earlier in this phase and are
  schema-breaking to remove; they deserve their own pass.
- The gate covers `src/manifest/schema/` only. `src/workflow/schema/` has the same
  exposure and is where three of the thirteen lived (`capabilities.fires_when`,
  `max_iterations`, the second-opinion sub); K10 covers judgment triggers but not
  workflow fields.
