---
phase: 60
name: Ablation Switch
status: complete
created: 2026-09-11
completed: 2026-09-11
gates_passed:
  - strategic gate SKIPPED (declared): adopting one competitor capability into an
    existing surface, with the scope decision put to the user directly once the
    upstream shape was read and this repo's footprint measured.
  - user decision: option A — env-var master switch, not Trellis's file-layer
    transaction
verified_refs:
  - "Trellis PR #538 feat(cli): add reversible full Trellis ablation (fetched)"
  - "src/platform/ablation.ts (NEW)"
  - "src/cli/lib/check-ablation.ts (NEW, doctor check 23)"
  - "src/checkpoint/injectStateMain.ts main() (gated)"
  - "src/checkpoint/stopHookMain.ts main() (gated)"
  - "src/cli/checkDocs.ts --hook branch (gated)"
  - "scripts/dashboard.mjs (gated inline — plain .mjs, cannot import dist)"
  - "tests/unit/ablation.test.ts (NEW), tests/checkpoint/stopHook.test.ts (+2 cells)"
---

# Phase 60 — Ablation Switch

## Why not the upstream shape

Trellis #538 ships `trellis ablate` / `trellis restore`: snapshot Trellis-owned
project state into a crash-safe external transaction, remove it, restore exact
files/dirs/symlinks/modes only after an all-path conflict preflight. 29 files,
110 symbols.

That machinery exists because **Trellis vendors its state into your project**.
Comparing with/without therefore requires destructive removal of files the user
also owns, so every restore-conflict and partial-write class is real for them.

harnessed installs into the host (`~/.claude/`). Measured on this machine before
designing anything:

- harnessed's own hooks in `~/.claude/settings.json`: **0** (all five first-party
  manifests live in `manifests/optional/` + `manifests/cc-hooks/`, opt-in)
- harnessed workflow skills in `~/.claude/skills`: **not installed**
  (`~/.claude/skills/ship` is gstack's — it exports `GSTACK_PLAN_MODE`)

So the removable footprint here is currently near zero, and a file-layer
transaction would be machinery for a problem this architecture does not have.
There is also a live hazard on that path: `manifests/skill-packs/gstack.yaml`
records that gstack's `retro` and `ship` **collide** with harnessed's workflows
of the same name, so a restore that guessed wrong would overwrite a user's
gstack.

Put to the user with that measurement; they chose the env switch.

## Delivered

`HARNESSED_OFF=1` gates the four always-on entry points (five manifests):

| entry point | manifest(s) | ablated behaviour |
|---|---|---|
| `bin/harnessed-inject-state.mjs` | perturn-inject, perturn-inject-invalidate | returns before touching the cache or emitting a breadcrumb |
| `bin/harnessed-stop-hook.mjs` | stop-hook-recover | returns before reading stdin — a pure no-op, not a consumer that decides to do nothing |
| `harnessed check-docs --hook` | doc-discipline-gate | **allows** the commit, i.e. behaves as if never installed |
| `scripts/dashboard.mjs` | dashboard-autospawn | exits 0 without starting a server or writing the project registry |

Explicit CLI calls (`harnessed run` / `gates` / `checkpoint`, and a deliberate
`harnessed check-docs` without `--hook`) are **not** gated: a control arm simply
does not invoke them, and a `harnessed run` that silently did nothing would be a
worse trap than one that runs.

`isAblated()` tests `=== '1'` exactly, matching the sibling
`HARNESSED_INJECT_PC_OFF` (4.38.0). Truthiness would make `HARNESSED_OFF=0` and
`HARNESSED_OFF=false` read as "on"; seven values are asserted against that.

`scripts/dashboard.mjs` inlines the check rather than importing the module: it is
plain `.mjs` that ships and runs outside the TS build. The `=== '1'` test is kept
byte-identical, with a comment on both sides saying why.

**doctor check 23 `ablation switch`** — warn while the switch is on. The failure
mode of a kill switch is silence: every hook no-ops, nothing prints, and the
operator concludes harnessed does nothing, which is indistinguishable from a
broken install. doctor is the command you run at exactly that moment. warn, not
fail — an intentionally ablated machine is not unhealthy.

## Verification

- Dogfood: `doctor` → `pass: active`; `HARNESSED_OFF=1 doctor` → `warn:
  HARNESSED_OFF=1 — harnessed's always-on surface is OFF…`, exit 0.
- `tests/unit/ablation.test.ts` (NEW): the predicate (7 non-ablating values),
  the doctor probe, and the **shipped bundle**.
- `tests/checkpoint/stopHook.test.ts` +2 cells against `bin/harnessed-stop-hook.mjs`.

Both bin-level suites are built to be falsifiable rather than vacuous:

- the stop hook's ablation cell reuses `MODE_B`, which the pre-existing cell 1
  proves *does* emit `decision:block` when the switch is off; a paired
  `HARNESSED_OFF=0` cell asserts it still blocks, so "silent" cannot pass by
  accident.
- the inject-state cells use `--invalidate`, whose effect is observable with
  nothing but a directory: baseline deletes `inject-cache`, ablated leaves it.

Testing the **bin bundles** rather than the TS is deliberate. `bin/*.mjs` are
committed esbuild artifacts, so a gate present in `src/` but missing from the
bundle would ship broken while every source-level test stayed green. `pnpm build`
was re-run and both bundles verified to contain the switch before the tests were
written.

## Not done

- README has no env-var section today (`HARNESSED_INJECT_PC_OFF` is likewise only
  in code and manifest comments). The doctor warn message is the discovery path:
  you notice harnessed "isn't doing anything", run doctor, and it names the
  variable and how to undo it. A proper env-var reference is its own task.
- No selective ablation (per-hook targets). Upstream explicitly scoped theirs to
  full-only as well.
