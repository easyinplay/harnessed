# Phase 2.1: 4 installer methods 实装 - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 11 (4 new installers + 3 modified + 2 docs/config + test patterns)
**Analogs found:** 9 / 11 (2 with no direct analog — transparency checklist + dispatch placeholder removal)

R1 deliverable for Wave A. Consumed by gsd-planner (Wave B) — every new installer maps to a proven sibling in `src/installers/`.

---

## § 1 File → Analog Mapping Table

| New/Modified File | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|-------------------|------|-----------|----------------|---------|---------------|
| `src/installers/mcpHttpAdd.ts` | installer | request-response (CLI spawn) | `src/installers/mcpStdioAdd.ts` | **~85%** | **Copy**: file skeleton, `runArgs`/`err`/`ProcResult`, preflight→diff→confirm→backup→spawn→verify flow, hardcoded `--scope project`, `claude mcp list \| grep -q` verify. **Adapt**: `addArgs` (`--transport http` + `<url>` instead of `-- npx ...`), `--header` handling, `.mcp.json` entry shape (`{type:"http",url,headers}`) |
| `src/installers/gitCloneWithSetup.ts` | installer | file-I/O (clone + copy) | `src/installers/npmCli.ts` (orchestrator shape) + `mcpStdioAdd.ts` (preflight/verify) | **~55%** | **Copy**: thin-orchestrator structure from npmCli, preflight gate, `renderDiff` call, backup/state calls. **Adapt**: spawn the manifest `cmd` pipeline via `lib/spawn.ts` (like npmCli does with `install.cmd`), `git rev-parse HEAD` SHA-verify step is NEW, pure-create backup sentinel (`oldText:''`), L2 default / L4-if-PATH |
| `src/installers/ccPluginMarketplace.ts` | installer | request-response (2-step CLI) | `src/installers/mcpStdioAdd.ts` | **~65%** | **Copy**: `runArgs` direct-spawn pattern (not `lib/spawn.ts` — args constructed authoritatively), B1 per-arg re-screen, textual diff simulation, exit-code verify. **Adapt**: TWO spawns (`claude plugin marketplace add` then `claude plugin install <plugin>@<mkt> --scope project`), diff target is `.claude/settings.json` `enabledPlugins`, verify `claude plugin list --json` exit code |
| `src/installers/npxSkillInstaller.ts` | installer | file-I/O (npx → skills dir) | `src/installers/npmCli.ts` | **~50%** | **Copy**: npmCli's `npx --yes` cmd pattern, thin orchestrator, `lib/spawn.ts` delegation. **Adapt**: `npx skills add <repo> --agent claude-code -y` cmd, verify checks **real path** `test -f ~/.claude/skills/<name>/SKILL.md` (NOT npx exit code — C6 directory-conflict gotcha), `~/.agents/` conflict → `progress.md` finding + `suggest:` |
| `src/installers/index.ts` | config (dispatch) | dispatch table | self (current placeholder structure) | **modify** | Replace 4 `phase21Placeholder` entries with 4 real imports. `levelOf()` already correct (L3/L2/L2/L3) — **no change**. Delete `phase21Placeholder` const once all 4 wired |
| `src/manifest/schema/spec.ts` | model (schema) | transform (validation) | self (existing `InstallType` / `Category` `Type.Union` + ADR 0007/0009 errata blocks) | **modify** | Extend a license enum + add `license_source` + `bundle` field — all via `Type.Union` / `Type.Optional(Type.Object())`, following the ADR 0009 errata comment-block precedent (lines 133–150) |
| `src/manifest/schema/installMethods/*` or `metadata` schema | model (schema) | transform | existing `InstallSchema` discriminated union | **modify** | `bundle-install` field shape — see § 3 / D-17 |
| `routing/decision_rules.yaml` | config (routing) | event-driven (rule match) | self (existing rules w/ & w/o `warn:`) | **modify** | Remove `warn:` key from `chinese-content-deck` rule (baoyu-skills resolved to MIT-0). 1-line deletion |
| `docs/adr/0010-installer-schema-extension-errata.md` | docs (ADR) | — | `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` + `0008-routing-engine-v1-errata.md` | **new from template** | 6-section errata style: Status / Context / Decision / Consequences / Compliance (A7) / errata-path note. ≥100L per E1 |
| transparency verify checklist file | docs/config | — | **no direct analog** | **new** | Planner decides form (markdown checklist read by verify-phase vs CI grep gate — D-19). Closest reference: phase 1.5 `PLAN-CHECK.md` § 8 errata style |
| `tests/integration/installer-contract.test.ts` (extend) + `tests/unit/installers-{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.test.ts` (new) | test | — | `tests/unit/installers-mcpStdioAdd.test.ts`, `tests/unit/installers-npmCli.test.ts`, `tests/integration/installer-contract.test.ts`, `tests/integration/installer-real-spawn.test.ts` | **~80%** | **Copy**: `vi.mock` contract test structure, `skipIf(!process.env.HARNESSED_REAL_SPAWN)` real-spawn gate, dispatch-mismatch test. **Adapt**: per-installer args assertions + verify path |

---

## § 2 Per-Installer Concrete Code Excerpts

### `src/installers/mcpHttpAdd.ts` — clones `mcpStdioAdd.ts` (~85%)

**lib helpers imported** (identical set to mcpStdioAdd, all 5):
```typescript
import { spawn } from 'node:child_process'
import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { preflight } from './lib/preflight.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallError, Installer } from './lib/types.js'
```
Note: mcp installers **do NOT use `lib/spawn.ts`** — they construct `args[]` authoritatively and direct-`spawn` (mcpStdioAdd.ts:40-65 `runArgs`). Copy `runArgs`, `err`, `ProcResult` verbatim.

**Structure to clone** (mcpStdioAdd.ts:67-230 — same 7-step skeleton):
1. method-discriminator guard (`if install.method !== 'mcp-http-add'` → `dispatch-mismatch` error)
2. `preflight(ctx)` — copy verbatim (lines 81-87)
3. **Adapt the authoritative `addArgs`** — mcpStdioAdd uses (lines 94-106):
   ```typescript
   const addArgs = ['mcp','add','--scope','project','--transport','stdio',name,'--','npx','--yes',`${pkg}@${ver}`]
   ```
   mcp-http-add becomes:
   ```typescript
   // --transport http + <url> instead of `-- npx ...`; --scope project still hardcoded (CC #54803 transport-agnostic, D-12)
   const addArgs = ['mcp','add','--scope','project','--transport','http', ...headerArgs, name, url]
   // headerArgs: flatten manifest headers → ['--header','Key: Value', ...] BEFORE <name> (strict flag-ordering, research § 4)
   ```
4. **B1 per-arg re-screen** — copy the `for (const a of addArgs)` loop verbatim (lines 111-125). **CARVE-OUT (D-16 / research #11):** `--header` values may carry `${ENV_VAR}` → false-positive on `checkCmdString`. Either (a) resolve env vars before arg construction, or (b) skip B1 re-screen for the value following a `--header` token. Planner decides — see § 6 D-16.
5. textual `.mcp.json` diff simulation (lines 130-146) — **adapt entry shape**: `{[name]:{type:'http',url,headers}}` instead of `{type:'stdio',command,args}`
6. `confirmAt('L3', ...)` + dry-run short-circuit — copy verbatim (lines 148-153)
7. `backup` → `runArgs(addArgs)` → exit-code check → verify `claude mcp list | grep -q ${name}` → `updateInstalled` — copy verbatim (lines 155-229). For OAuth servers add `claude mcp get <name>` pending-auth surface (research § 4).

### `src/installers/gitCloneWithSetup.ts` — npmCli orchestrator + mcpStdioAdd verify (~55%)

**lib helpers imported** (npmCli's set — uses `lib/spawn.ts` because it runs a manifest `cmd` string):
```typescript
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { preflight } from './lib/preflight.js'
import { spawnCmd } from './lib/spawn.js'   // ← runs manifest cmd pipeline (B1-gated once internally)
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallError, Installer, InstallResult } from './lib/types.js'
```
**Structure** — npmCli.ts:39-135 thin-orchestrator shape: discriminator guard → `preflight` → `renderDiff` (pure-create, `files:[]` or `+++ NEW: ~/.claude/skills/<name>/`) → `confirmAt('L2')` → dry-run short-circuit → `backup` → `spawnCmd(ctx, install.cmd, [])` → verify `spawnCmd(ctx, verify.cmd, [])` → `updateInstalled`.
**NEW step (no analog)** — between spawn and verify: `git rev-parse HEAD` SHA-match against `install.git_ref` (research § 2 step 3). `git_ref` HEAD/main/master rejection is **already enforced by `preflight`** (research § 2) — reuse, don't rebuild.
**Backup**: pure-create sentinel — `DiffFile.oldText:''` (types.ts:74-79 documents this); rollback = `rm -rf` created dir.

### `src/installers/ccPluginMarketplace.ts` — mcpStdioAdd direct-spawn pattern (~65%)

**lib helpers**: same as mcpHttpAdd (direct-spawn, authoritative args, no `lib/spawn.ts`).
**Structure**: clone mcpStdioAdd skeleton but **two sequential `runArgs` calls**:
```typescript
// Step 1 — register marketplace (idempotent per research § 1)
const mktArgs = ['plugin','marketplace','add', marketplaceUrl]
// Step 2 — install plugin, --scope project hardcoded (parallels mcp --scope project)
const installArgs = ['plugin','install',`${plugin}@${marketplaceName}`,'--scope','project']
```
Diff target: `.claude/settings.json` `enabledPlugins` key (research § 1). Verify: `claude plugin list --json` **exit code** (not stdout parse — same C6 discipline as mcpStdioAdd's `grep -q`). B1 per-arg re-screen loop copied verbatim.

### `src/installers/npxSkillInstaller.ts` — npmCli npx pattern (~50%)

**lib helpers**: npmCli's set (uses `lib/spawn.ts`).
**Structure**: npmCli orchestrator. `cmd = 'npx skills add <repo> --agent claude-code -y'` (minimal-pin one tool — D-01, vercel-labs/skills). `confirmAt('L2')`.
**CRITICAL adapt (C6)**: verify must `test -f ~/.claude/skills/<name>/SKILL.md` — the **real path**, NOT the npx exit code (research § 3 directory-conflict gotcha). On verify-fail after npx success → `InstallError` with `keyword:'verify-failed'` + `suggest:` pointing at `~/.agents/` vs `~/.claude/` bridge. Directory conflict logged as `progress.md` finding (D-02).

---

## § 3 Schema Change Patterns (`src/manifest/schema/spec.ts` — TypeBox)

**Established analog pattern** — every enum is a `Type.Union([Type.Literal(...), ...])`; every errata block is fenced by a comment citing the ADR. Examples already in-file:
- `InstallType` (lines 106-111): `Type.Union` of 4 `Type.Literal` — **the analog for license enum extension**
- `Category` (lines 97-104): 6-literal union
- ADR 0009 errata block (lines 133-150): comment header `// ADR 0009 errata — ...` then `Phase` + `Triggers` defs, wired into `SpecSchema` at lines 168-170 with inline `// ADR 0009 errata` marker — **the analog for how to ADD the new ADR 0010 fields**

**Phase 2.1 changes (E2), all additive, all `Type.*`:**

1. **License whitelist + `anthropics-official` + `MIT-0`** (D-03/D-05) — the license enum likely lives in the metadata/upstream schema (not shown in spec.ts excerpt — planner verify `src/manifest/schema/`). Pattern: add `Type.Literal('MIT-0')` and `Type.Literal('anthropics-official')` to the existing license `Type.Union`.

2. **`license_source` audit field** (D-04) — new optional enum on metadata.upstream:
   ```typescript
   // ADR 0010 errata — license provenance audit field (D-04).
   license_source: Type.Optional(Type.Union([
     Type.Literal('README'), Type.Literal('registry'),
     Type.Literal('none'), Type.Literal('anthropics-official'),
   ])),
   ```

3. **bundle-install schema** (#10, D-17 — shape is Claude's-discretion, planner decides) — model after the `Triggers` optional-object pattern (lines 143-150):
   ```typescript
   // ADR 0010 errata — bundle-install (document-skills 4-in-1).
   const Bundle = Type.Object(
     { components: Type.Array(Type.String({ minLength: 1 }), { minItems: 2 }) },
     { additionalProperties: false },
   )
   // wired into SpecSchema: bundle: Type.Optional(Bundle)
   ```
   Alternative shape: `component_type: Type.Literal('bundle')` enum extension. **Planner picks — D-17.**

4. **install_type enforcement** — `install_type` (lines 106-111) already exists as required 4-enum; "enforcement" = a cross-field check that `install_type` ↔ `install.method` are consistent (1:N closure per ADR 0007). Analog: this is a `.Check()` / refinement-style validation — planner determines if TypeBox `Type` allows it or it needs a separate validate-layer rule (likely the latter; see `tests/unit/manifest-validate.install-type.test.ts` for the existing check's test).

---

## § 4 Dispatch Table Extension Pattern (`src/installers/index.ts`)

**Current placeholder structure** (index.ts:22-43):
```typescript
const phase21Placeholder: Installer = async (ctx) => ({
  ok: false, phase: 'preflight',
  error: { ...keyword: 'phase-deferred', suggest: 'wait for v0.2.0 release...' },
})

export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  'cc-plugin-marketplace': phase21Placeholder,   // ← replace
  'git-clone-with-setup': phase21Placeholder,    // ← replace
  'npx-skill-installer': phase21Placeholder,     // ← replace
  'mcp-http-add': phase21Placeholder,            // ← replace
}
```

**Extension = exactly mirror the 2 real entries:** add `import { installMcpHttpAdd } from './mcpHttpAdd.js'` (etc.), swap each `phase21Placeholder` for the real installer, delete the `phase21Placeholder` const + its now-unused comment. `levelOf()` (lines 45-58) is **already seeded correctly** (research § 5 confirms L3/L2/L2/L3) — **zero change**. `runInstall` (lines 60-63) — **zero change**. This is the lowest-risk modification in the phase: a 4-line swap + 4 imports + 1 deletion.

---

## § 5 Pattern Reuse Summary

| Aspect | Estimate |
|--------|----------|
| **Overall reuse rate** | **~65%** weighted across 4 installers — mcp-http-add ~85%, cc-plugin ~65%, git-clone ~55%, npx ~50% |
| **7 lib helpers — sufficient?** | **YES, all 6 present helpers cover all 4 installers** (backup/confirm/diff/preflight/spawn/state + types). Two spawn idioms already exist: `lib/spawn.ts` (runs manifest `cmd` string — git-clone, npx use this) vs local `runArgs` direct-spawn (authoritative args — mcp-http, cc-plugin clone mcpStdioAdd's). **No new lib helper needed** (confirms Karpathy constraint #4). |
| **Genuinely NEW patterns this phase** | (1) **`git rev-parse HEAD` SHA-verify** step in git-clone — no prior analog, but small & self-contained. (2) **Two-step sequential spawn** in cc-plugin (marketplace add → install) — extends the single-spawn pattern. (3) **`--header` checkCmdString carve-out** — first time B1 gate needs a data-vs-shell-token exception (research #11). (4) **Real-path verify decoupled from spawn exit code** in npx — mcpStdioAdd already does exit-code-not-stdout, npx extends to "different command entirely for verify". (5) **transparency verify checklist** — no code analog at all. |
| **Errata-path discipline** | ADR 0010 follows the proven 0007/0008/0009 errata pattern exactly — A7 conservation, baseline tag iterate, CI A7 step 1-9→1-10. Zero main-body diff to ADR 0001-0009. |

---

## § 6 Decision Proposals for the Planner (D-15+)

Numbered continuing from phase 1.5's D-26 → these are **D-27+** in global sequence; labeled D-15+ as phase-2.1-local per KICKOFF convention. Planner resolves in ASSUMPTIONS / PLAN.

- **D-15 — git-clone-with-setup verify ownership**: the `git rev-parse HEAD` SHA-match is a NEW step with no lib analog. Propose: inline it in `gitCloneWithSetup.ts` (≤10 lines, self-contained) rather than a new `lib/gitVerify.ts` — only one caller, Karpathy YAGNI. Planner confirm.
- **D-16 — `--header` checkCmdString carve-out shape** (research #11, blocks mcp-http-add): pick (a) resolve `${ENV_VAR}` before arg construction (installer reads `process.env`, fails clear if unset) — *recommended, keeps B1 gate pure*; or (b) teach `checkCmdString` a `--header`-value exemption. (a) is more surgical and keeps the security gate untouched.
- **D-17 — bundle-install schema field shape** (#10, blocks document-skills): pick `bundle: Type.Optional(Type.Object({components: Type.Array(...)}))` *(recommended — additive, mirrors `Triggers` optional-object precedent)* vs `component_type` enum extension to `'bundle'` *(touches a required field — riskier)*. Resolve in RESEARCH.md R2.1 then lock in PLAN.
- **D-18 — license enum location**: confirm whether the license whitelist enum lives in `spec.ts` or a metadata sub-schema (`src/manifest/schema/` — not in the spec.ts excerpt). Planner greps before writing the E2 task. The `Type.Union` extension pattern is identical wherever it lives.
- **D-19 — transparency verify checklist form** (E3, no analog): markdown checklist read by verify-phase agents vs CI grep gate (`grep -E 'CLOSED|100%|全绿'` → require adjacent digit). Recommend **both** — lightweight CI grep gate as the structural enforcement (can't be skipped) + a markdown checklist as the human-facing companion. Planner decides per budget.
- **D-20 — cc-plugin-marketplace idempotency handling**: research § 1 flags `marketplace add` of an already-registered marketplace as a MEDIUM unknown. Propose: treat non-zero exit from step-1 `marketplace add` as non-fatal IF step-2 `plugin install` succeeds (marketplace already registered is a benign state), OR pre-check via `claude plugin marketplace list`. Planner picks; verify exact behavior during execute-phase.
- **D-21 — npx-skill-installer tool pin**: D-01 says minimal-pin one tool; research says vercel-labs/skills `npx skills`. Propose pin `npx skills@<version>` (explicit version, not floating) so the install is reproducible (ADR 0007 `install_type: npx` reproducibility note). RESEARCH.md R2.2 confirms the exact current version.

---

## Metadata

**Analog search scope:** `src/installers/` (index + 2 working installers + 6 lib helpers), `src/manifest/schema/spec.ts`, `manifests/skill-packs/ui-ux-pro-max.yaml`, `docs/adr/`, `tests/{integration,unit}/`
**Files scanned:** 11 read in full + directory listings of `lib/` `adr/` `tests/`
**Pattern extraction date:** 2026-05-15
