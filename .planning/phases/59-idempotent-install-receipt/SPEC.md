---
phase: 59
name: Idempotent Install Receipt
status: complete
created: 2026-09-11
completed: 2026-09-11
gates_passed:
  - strategic gate SKIPPED (declared): a defect fix found by a competitor-intel
    read, verified against this tree before being called a gap.
  - user decision: "修" after the intel report
verified_refs:
  - "src/installers/lib/state.ts updateInstalled / recordObservedInstall (edited)"
  - "6 installers, 8 idempotent return sites (edited)"
  - "src/cli/status.ts — the only state.json consumer (read)"
  - "src/installers/lib/idempotent.ts:238 isAlreadyInstalled (read)"
  - "Trellis #575 fix(update): repair receipt entries … (fetched)"
  - "tests/unit/installers-lib-state.test.ts (+5 cells)"
  - "tests/unit/installers-idempotent-receipt.test.ts (NEW, falsified)"
---

# Phase 59 — Idempotent Install Receipt

## Where it came from

A competitor-intel read of `rpamis/comet` and `mindfold-ai/Trellis` since the
2026-08-26 snapshot. Trellis #575 — *repair receipt entries for files already
identical to a template* — described a receipt whose write-back drew only from
the changed sets, so a wrong or absent entry beside an already-correct file was
unrepairable by any number of update runs.

Checked against this tree, the same shape was here.

## The defect

All six installers probe `isAlreadyInstalled(ctx)` and return early on a hit.
Every one of those returns sits before the success path's `updateInstalled`:

| installer | idempotent return | receipt write |
|---|---|---|
| ccPluginMarketplace.ts | 119 | 271 |
| gitCloneWithSetup.ts | 160 | 324 |
| mcpHttpAdd.ts | 130 | 314 |
| mcpStdioAdd.ts | 80 | 230 |
| npmCli.ts | 61 | 157 |
| npxSkillInstaller.ts | 85 | 244 |

So the receipt only ever existed for components this tool itself wrote. Install
by hand — which both ECC's and superpowers' READMEs tell you to do — and the
component is never recorded; re-running `harnessed install` cannot repair it,
because the probe hits and the write is downstream of the return.

`harnessed status` is the only real consumer of `state.json`
(`readInstalledPlugins` / `readInstalledUserSkills` read the CC registry and
skills dirs, not this file). Dogfooded before the fix, on a machine carrying
superpowers / planning-with-files / ui-ux-pro-max / ecc / gstack / gsd / ctx7 /
tavily / exa / codegraph:

```
$ harnessed status
no installs recorded (…\.claude\harnessed\state.json absent or empty)
```

## Delivered

`recordObservedInstall(cwd, name, version, manifestSha1)` in
`src/installers/lib/state.ts`, called at all 8 idempotent return sites
(`mcpHttpAdd` and `mcpStdioAdd` have two each: the pre-probe, and the post-spawn
`already exists` branch). Each site records the same version expression its own
success path records, so the two paths cannot disagree.

Two deliberate differences from `updateInstalled`, both about not overclaiming:

- **`installedAt` is not restamped** when an entry exists. We did not install it
  now and cannot know when it happened; the first time we recorded it is the most
  honest thing the field can hold.
- **A matching entry is left completely alone** — re-running on an up-to-date
  tree writes nothing at all.

Fail-soft: every error swallowed. A receipt is bookkeeping; losing it must not
turn a successful idempotent no-op into an install failure.

## Verification

End-to-end on the real machine:

```
$ harnessed install ctx7
already-installed ctx7@^0.5.0 (idempotent check hit; nothing to do)
$ harnessed status
ctx7 @ ^0.5.0  (installed 2026-09-10T17:44:39.717Z)
1 install(s) recorded
```

Re-running left the timestamp unchanged.

- `installers-lib-state.test.ts` +5 cells: repairs absent, writes nothing when
  matching, repairs a stale version while preserving `installedAt`, preserves
  unrelated entries, swallows a write failure.
- `installers-idempotent-receipt.test.ts` (NEW) covers the thing that actually
  broke — whether the early-return path reaches the call at all — by mocking
  `idempotent.js` to force the hit. **Falsified before being trusted**: commenting
  out the call in `npmCli.ts` makes it fail with `no state.json payload was
  written on the idempotent path`; restoring it makes it pass. A wiring test that
  cannot fail is a change-detector, not a test.
- `tsc --noEmit` clean across all 8 sites (each needed `install` to be narrowed
  at that point; `mcpStdioAdd`'s local `ver` is declared *after* its first early
  return, so that site uses `install.npm_version` — the expression `ver` is
  assigned from — rather than the variable).

## Observed, not fixed

`HarnessedStateEntry.manifestSha1` is documented as "sha1 of the manifest yaml
that produced this install"; all six call sites pass `''`. Another declaration
nothing evaluates — same family as Phases 55-58. Recorded rather than fixed, to
keep this phase to the defect that was reported.

## Rejected candidates from the same intel read

Each was checked against this tree before being dismissed:

| source | class | why not |
|---|---|---|
| Trellis `9681cbd` bare `git commit` sweeps staged work | auto-commit scope | harnessed never auto-commits; `git commit` appears only in `checkDocs.ts`'s PreToolUse *gate* |
| Trellis `638d368` manifest-referenced read escapes base path | path traversal into a prompt | `checkArtifacts` stats + hashes, never injects content; paths come from our own shipped yaml |
| Trellis `e635ee8` symlinked workflow dir fails containment | symlink containment | no containment layer to fix, given the above |
| Trellis `32c7b92` UTF-8 split across incremental reads | multibyte decode | `stopHookMain.ts:54` does decode a byte slice, but the only corrupted region is the tail slice's first line, which is already discarded by the `JSON.parse` catch (the comment anticipates it); the other two sites `Buffer.concat` first |
| comet PR #392 overlapping recovery / PID reuse | hardening of the `return-to-shape` recovery we adopted in Phase 53 | our `reopenSub` goes through `mutateSubProgress` → `withLock`, already concurrency-safe |

comet's 27 commits this cycle were 0.4.0-RC stabilisation of its Native/Classic
supervisor — an architecture harnessed does not have. The one overlapping surface
(recovery) is covered by our lock.

## Still open

Trellis `17d1807` *reversible full ablation* — one command to turn the whole
system off and restore it. Fits the established "run the same task with and
without the component before building routing" practice; we only have
`HARNESSED_INJECT_PC_OFF` for the injection slice. Not started.
