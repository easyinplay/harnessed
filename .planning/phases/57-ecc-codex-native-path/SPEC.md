---
phase: 57
name: Plugin Upgrade + ECC Codex Native Path
status: complete
created: 2026-09-10
completed: 2026-09-10
gates_passed:
  - strategic gate SKIPPED (declared): executing a user decision ("升级，换路径")
    on components whose positioning was already settled; no new product direction.
  - user decision: upgrade the stale plugins, switch the ECC install path
verified_refs:
  - "affaan-m/ECC README — 'Both paths install the same ecc@ecc plugin' (fetched)"
  - "affaan-m/ECC README — sync script 'is a deprecated compatibility option' (fetched)"
  - "affaan-m/ECC README — 'Do not add the native marketplace plugin on top of the sync flow' (fetched)"
  - "nextlevelbuilder/ui-ux-pro-max-skill .claude-plugin/marketplace.json → 2.13.0 (fetched)"
  - "`codex plugin add|list|marketplace|remove` exist on this machine (codex plugin --help)"
  - "src/installers/ccPluginMarketplace.ts:104-148 — bin dispatch + two-stage parse (read)"
  - "src/manifest/schema/spec.ts:184-190 HarnessOverride = {install, verify} only (read)"
  - "src/cli/lib/check-ecc.ts (edited), tests/cli/check-ecc.test.ts (+3 cells)"
---

# Phase 57 — Plugin Upgrade + ECC Codex Native Path

## What the user asked, and what the evidence changed

The instruction was "升级，换路径". The upgrade half was unambiguous. The
path half rested on a premise **I** had introduced in Phase 55 from ECC's release
notes — that 2.2's guided installer might supersede the Claude Code plugin path.
Reading the actual README inverted it:

> **Both paths install the same `ecc@ecc` plugin.** Choose one and do not stack
> another manual Claude install on top.

with the native plugin commands listed under "Also supported for Claude Code",
and "Claude Code plugin + the legacy Codex sync flow" listed under "Works" —
i.e. harnessed's existing pairing is on upstream's own supported list.

So the CC path did **not** change: switching to `npx ecc-universal install
--guided` would install the identical artifact while trading a deterministic
two-stage command for an interactive "reviewed flow", which harnessed's
non-interactive installer spawn cannot drive.

The path change upstream actually made is on the **codex** side, and there the
manifest was carrying the opposite of the truth.

## Delivered

1. **Upgrades** (`claude plugin update`): superpowers 5.1.0 → 6.3.0,
   planning-with-files 2.34.0 → 3.17.2, ecc 2.1.0 → 2.2.1, ui-ux-pro-max
   2.5.0 → 2.13.0. Phase 56's check now reports `4 marketplace plugin(s) current`.

2. **ECC codex channel → native plugin.** `git-clone + sync-ecc-to-codex.sh`
   became `codex plugin marketplace add affaan-m/ECC && codex plugin add ecc@ecc`.
   Upstream deprecated the script in 2.2. Beyond following upstream, the native
   route is strictly better for harnessed's contract: the sync flow has no stable
   pinned artifact, so its `idempotent_check`/`verify` could only probe the kept
   clone cache and never the `~/.codex` merge state; `codex plugin list` is a real
   registry query. Zero code change — `ccPluginMarketplace.ts` already dispatches
   on platform and parses the two-stage form (precedent: superpowers' codex
   override).

3. **`check-ecc.ts` codex probe follows.** It probed only the sync clone; after
   the switch that would report "not installed" for everyone on the new path.
   Now accepts both, naming which, and telling a legacy user how to migrate. The
   native probe asks codex itself rather than guessing where codex records
   enabled state on disk (upstream documents only "the active CODEX_HOME"). It
   spawns **only** when `~/.codex/config.toml` exists, and is injectable so the
   suite never spawns the developer's real codex.

4. **`ui-ux-pro-max` version record corrected 2.15.0 → 2.13.0** (both
   `last_known_good_version` and `install.git_ref`), and the source rule written
   down in `manifests/SCHEMA.md` + the freshness gate's failure message.

## The bug this phase found in Phase 55's own work

Phase 55 recorded `ui-ux-pro-max` as 2.15.0 from the repo's newest git tag. The
marketplace manifest declares 2.13.0, and that is what the plugin channel serves
— confirmed when the upgrade landed on 2.13.0, not 2.15.0.

Consequence: Phase 56's doctor check compared an installed 2.13.0 against a
recorded 2.15.0 and reported "behind" — **an alarm no user could ever clear**,
because no amount of updating reaches a version the channel does not publish. A
freshness gate whose remedy does not exist is worse than no gate; it trains
people to ignore it.

Rule now recorded in two places: the version source depends on `install.method`.
`cc-plugin-marketplace` → the marketplace manifest's plugin version, never the
repo git tag (a tag can run ahead of the published entry).

## Migration hazard (users, not this machine)

Upstream verbatim: "Do not add the native marketplace plugin on top of the sync
flow." A user who ran the pre-Phase-57 codex install must strip the legacy layer
first with upstream's own tool (`node scripts/ecc.js uninstall
--legacy-codex-sync`, `--dry-run` to preview). harnessed cannot do it for them:
that sync merged files it does not own. This machine had neither the clone nor
any codex plugin, so the switch carried no local migration.

Also recorded: `HarnessOverride` allows only `install` and `verify`
(`additionalProperties: false`), so `uninstall` cannot be overridden per harness
— on codex the correct command would be `codex plugin remove ecc@ecc`, but
`spec.uninstall` stays claude-flavoured. Pre-existing gap (the old override had
no uninstall either), noted in the manifest rather than widening the schema for
one component.

## Verification

- `doctor` → `pass: 4 marketplace plugin(s) current`.
- freshness gate 0 stale; workflow-schema, validate-schema green.
- `tsc --noEmit` clean; biome clean.
- `check-ecc` 12/12 (was 9; +3 cells for native / legacy-precedence / no-spawn-
  without-codex-marker). Every pre-existing cell pinned to `codexPluginPresent:
  () => false` so the suite is machine-independent.

## Still open

- **superpowers ceremony threshold.** The blocker is cleared — this machine now
  runs 6.3.0, where spike/bounded/architectural classification exists. The A/B on
  `subtask-gate.brainstorming.skips_when` is now runnable. Note from Phase 56's
  investigation: `fires_when` is constant-true under the default gate context, so
  `skips_when` is the only discriminator and any change alters all brainstorming
  routing.
- Claude Code requires a restart for the plugin updates to apply, so the 6.3.0
  behaviour is not live in the current session.
