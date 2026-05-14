# Phase 2.1: 4 installer methods 实装 — Research

**Researched:** 2026-05-15
**Domain:** manifest schema modeling + npx skill tooling + verify-phase transparency process
**Confidence:** HIGH (Topic 1), HIGH (Topic 2), MEDIUM (Topic 3 — process design, not a fact lookup)

---

## § 0 Scope Note

Installer CLI/API mechanics for all 4 placeholders (cc-plugin-marketplace / git-clone-with-setup /
npx-skill-installer / mcp-http-add) are **already covered HIGH-confidence** by
`.planning/research/v0.2.0-installers.md` — this RESEARCH does **not** redo that. It covers ONLY
the 3 focused uncertainties spelled out in `KICKOFF.md` § 4 R2:

1. bundle-install schema modeling (`document-skills` 4-in-1)
2. npx-skill-installer tool selection confirmation
3. transparency verify checklist landing form

Topic 1 and 3 are reasoning over existing repo files (`spec.ts`, `decision_rules.yaml`,
phase 1.4/1.5 review docs). Topic 2 was verified via `ctx7 /vercel-labs/skills` + npm registry.

---

## § 1 — bundle-install schema modeling

### Problem

`document-skills` (`anthropics/skills` → pptx + docx + xlsx + pdf) installs as **ONE bundled
plugin** via `claude plugin install document-skills@anthropic-agent-skills` — one install action
yields 4 doc skills. The current `SpecSchema` (`src/manifest/schema/spec.ts`) models one manifest
as one atomic component (`component_type` is a single enum value, `install` is a single discriminated
union). `decision_rules.yaml` rule `pptx-file-task` routes `primary_expert: anthropics-skills-pptx`
as if pptx were independently installable — it is **not** (upstream issue #675 confirms bundling).

### Options compared

| Option | Shape | Surgical-ness | Routing fit | Verdict |
|--------|-------|---------------|-------------|---------|
| **A — `component_type: bundle`** | Add `'bundle'` to `ComponentType` union | Smallest enum diff, but `component_type` then means two things (what-it-is vs how-many) — semantic overload | Routing still can't name a sub-skill | ✗ overloads existing field |
| **B — `bundle:` array field** | New optional top-level `bundle: Type.Array(...)` listing sub-units | Additive, A7'-safe, but introduces a parallel "is this manifest a bundle?" code path everywhere `component_type` is read | Routing references `bundle[].id` | △ workable but invasive |
| **C — `provides: [...]` list** (RECOMMENDED) | New **optional** top-level `provides: Type.Optional(Type.Array(ProvidedUnit))` where each `ProvidedUnit = { id, component_type }`. Absent ⇒ manifest is atomic (today's behavior, unchanged). Present ⇒ one install exposes N named units. | Purely additive — every existing manifest validates byte-identical (A7' 8-pillar safe). `install` / `verify` / `uninstall` stay singular (one install action). Only the *catalog/routing* layer reads `provides`. | Routing rule `primary_expert` can reference a `provides[].id` (e.g. `anthropics-skills-document-skills/pptx`) OR the bundle id — both resolvable | ✓ **most surgical** |

### Why Option C

- **Singular install/verify/uninstall preserved.** The bundle is installed by ONE
  `claude plugin install` — modeling 4 separate `install` blocks (Option B's temptation) would
  misrepresent reality and break the dispatch-table 1:installer:1:method invariant.
- **`provides` is descriptive metadata, not an install instruction.** It tells the catalog +
  routing layer "this one install surfaces these named units." `install_type` stays `skill`,
  `component_type` stays the *bundle's* type (`cc-skill-pack`-ish — see note below).
- **Additive-only ⇒ A7' clean.** `Type.Optional(...)` means zero existing manifest breaks; no
  migration script needed (unlike a `component_type` enum widening which is technically additive
  but semantically a breaking reinterpretation).
- **Mirrors the established phase-1.5 T5.5 pattern** — `phase` / `triggers` were added the exact
  same way (optional top-level descriptive fields, schema-independent of routing).

### Concrete schema sketch (TypeBox, for Wave B planner)

```ts
// ADR 0010 errata — bundle-install modeling (#10).
// One install action may surface multiple named units (e.g. document-skills →
// pptx/docx/xlsx/pdf). `provides` absent ⇒ atomic manifest (unchanged behavior).
const ProvidedUnit = Type.Object(
  {
    id: Type.String({ minLength: 1 }),          // routing-addressable, <org>-<repo>-<unit>
    component_type: ComponentType,               // reuse existing union
  },
  { additionalProperties: false },
)
// ...added to SpecSchema:
provides: Type.Optional(Type.Array(ProvidedUnit, { minItems: 2, uniqueItems: true })),
```

`minItems: 2` — a "bundle" of 1 is just an atomic manifest; enforce the distinction.

### Routing-rule impact (`decision_rules.yaml`)

`pptx-file-task` currently: `primary_expert: anthropics-skills-pptx`. Two valid resolutions for
Phase 2.3 (NOT this phase — flagged for continuity):
- **Keep the granular id**, make the catalog resolve `anthropics-skills-pptx` → it lives in the
  `document-skills` bundle manifest's `provides[]`. Routing stays human-readable; resolution layer
  does the bundle lookup.
- This phase (2.1) only needs the **schema field to exist** so Phase 2.3 can write the
  `document-skills` manifest. No `decision_rules.yaml` rule edit for bundling is required in 2.1
  (the only 2.1 routing edit is D-05's `chinese-content-deck` `warn:` removal, unrelated).

**Note on `component_type` for a bundle manifest:** the existing `cc-skill-pack` TypeEnum value
(`type: 'cc-skill-pack'`) already conceptually covers "a pack of skills" — the bundle manifest
sets `type: 'cc-skill-pack'` and `provides[]` enumerates the pack contents. No new `TypeEnum` or
`ComponentType` value needed. **Confidence: HIGH** — `provides` is a clean additive field; the
only open choice is the exact `id` naming convention, which is Phase 2.3's call.

---

## § 2 — npx-skill-installer tool selection confirmation

### Confirmed tool: `skills` (vercel-labs/skills)

| Field | Value | Source |
|-------|-------|--------|
| npm package | **`skills`** (unscoped) | `npm view skills` |
| Latest version | **`1.5.7`**, published **2026-05-14** (1 day before research — very active) | npm registry |
| dist-tags | `latest: 1.5.7`, `snapshot: 1.5.5-snapshot.1` | npm registry |
| Repo | `github.com/vercel-labs/skills` | ctx7 `/vercel-labs/skills` (Source Reputation: High, 111 snippets) |
| Scope | "CLI for managing/installing reusable instruction sets across 40+ agents" | ctx7 |

This **confirms** `v0.2.0-installers.md` § 3's MEDIUM-flagged pick. It is the de-facto tool, it is
healthy (release 1 day ago), and CONTEXT D-01 ("minimal-pin one tool") → pin **`skills@1.5.7`**.

### Exact minimal-pin install command

```bash
npx --yes skills@1.5.7 add <owner/repo> --skill <name> --agent claude-code --copy --global --yes
```

Flag rationale (all verified via ctx7 docs):
- `npx --yes` — skip npx's own install-confirmation (npmCli installer already uses this pattern).
- `skills@1.5.7` — **pin the tool version** (reproducibility — ADR 0007 `install_type: npx` exists
  precisely for this; un-pinned `npx skills` re-fetches latest each run = non-reproducible).
- `add <owner/repo> --skill <name>` — `owner/repo` shorthand + specific skill from a multi-skill repo.
- `--agent claude-code` (`-a`) — restrict install to the Claude Code target.
- `--copy` — **critical**: forces copy mode instead of symlink. See directory-conflict analysis below.
- `--global` (`-g`) — install to the user dir (`~/.claude/skills/`) rather than project-scoped.
- `--yes` (`-y`) — non-interactive / CI-friendly.

### The `~/.agents/` vs `~/.claude/skills/` directory-convention conflict — what it actually is

ctx7 docs for `installSkillForAgent` reveal the exact mechanism. The installer result is:

```ts
{ success, path,            // agent-specific install path (e.g. ~/.claude/skills/<name>)
  canonicalPath?,           // canonical .agents/skills path
  mode: 'symlink' | 'copy',
  symlinkFailed?: boolean }  // true if symlink was attempted but fell back to copy
```

**The conflict, precisely:** `skills` stores a *canonical* copy under `~/.agents/skills/` (its
tool-agnostic home for 40+ agents) and, for each `--agent`, creates an **agent-specific path**
under that agent's convention — for `claude-code` that's `~/.claude/skills/<name>`. By default the
agent-specific path is a **symlink** back to the canonical `.agents/` copy. Claude Code reads
`~/.claude/skills/` — so a symlink *usually* works, BUT:
- On Windows, symlink creation often fails (requires elevation/dev-mode) → `symlinkFailed: true`,
  silently falls back to copy. Inconsistent cross-OS behavior.
- If the user later `rm -rf ~/.agents/`, every symlinked skill silently breaks.
- Symptom in the wild ("skills not found after npx install") = the symlink case degrading.

**`--copy` resolves this for the minimal-pin scope.** With `--copy`, `skills` writes a real
directory at the agent-specific path (`~/.claude/skills/<name>/`) with no dependency on
`~/.agents/`. This is exactly the shape Claude Code expects and matches what git-clone-with-setup
produces. It sidesteps the SessionStart sync-hook bridging problem entirely — which CONTEXT D-02
explicitly defers out of Phase 2.1.

### Best-effort verify strategy (CONTEXT D-02 — no sync-hook this phase)

Verify by the **actual filesystem path Claude Code reads**, NOT the npx exit code (the C6
no-silent-failure contract — npx can exit 0 while CC can't see the skill):

```
verify.cmd: test -f ~/.claude/skills/<name>/SKILL.md
```

- Exit-code gate (same pattern as git-clone-with-setup's `test -f .../SKILL.md`).
- If npx reports success but `verify` fails → report `verify-failed` with a `suggest:` pointing at
  the `~/.agents/` vs `~/.claude/` directory-convention limitation.
- **Record the directory-convention conflict as a known limitation in `progress.md`** (CONTEXT
  D-02) — `--copy` mitigates it for the common case, but full bridging (SessionStart sync-hook for
  symlink-mode installs, or skills that genuinely live only in `~/.agents/`) is deferred.

**Confidence: HIGH** — package name, version, publish date, and all flags verified via ctx7 +
npm registry this session; the `--copy` mitigation is directly supported by the documented
`installSkillForAgent` `mode` parameter.

---

## § 3 — transparency verify checklist landing form

### Problem (the recurrence)

A "CLOSED / 100% / 全绿" claim without specific numbers + a miss list is a transparency
anti-pattern that has **recurred 2 phases running**: phase 1.4 T1, then phase 1.5 H1/M1. Phase 1.5
sister review demanded a **structural** root-cause fix, not another one-off correction —
"否则 phase 2.0/2.x 还会复发第三次" (HARD CONSTRAINT § 3 #8).

### Options compared

| Option | What it is | Catches the bug? | False-positive risk | Root-causes recurrence? |
|--------|-----------|-------------------|---------------------|-------------------------|
| **(a) markdown checklist** the verify-phase agent must follow | A `docs/` checklist: every closure claim must enumerate (1) total count, (2) pass count, (3) explicit miss list or "0 misses — verified by X". verify-phase agent reads + applies it. | Only if the agent actually reads + obeys it — same failure class that produced 1.4 T1 + 1.5 H1 (agent *intended* to be accurate, still wasn't) | None (it's process) | **Weakly** — relies on agent diligence, which already failed twice |
| **(b) CI grep gate** scanning planning docs for bare "CLOSED/100%/全绿" without adjacent numbers | A CI step greps `.planning/**` for the trigger phrases; fails if a match has no number/miss-list within N lines | Mechanically, on every push — no agent diligence required | **HIGH** — legitimate prose ("the issue is now CLOSED", "100% of the unit tests", section headers) trips it constantly; tuning the regex to near-zero false-positives is fragile and itself becomes a maintenance anti-pattern | Partially — catches it, but noisy gate gets ignored/`# noqa`'d, re-creating the problem |
| **(c) HYBRID — checklist as the contract + a NARROW CI gate as the backstop** (RECOMMENDED) | The **markdown checklist is the primary artifact** (defines what a valid closure claim looks like). A **deliberately narrow** CI gate enforces only the *machine-checkable subset*: a closure claim line must have a digit within the same line or adjacent bullet. Scope the gate to a **single well-known location** (e.g. only `**/PLAN-CHECK.md` + `**/*-AUDIT.md` "verdict" sections, or lines matching a structured marker like `Verdict:` / `状态:`), not all prose. | Yes — checklist defines, CI enforces the subset | LOW *if* scoped to structured verdict lines only, not free prose | **Yes** — see rationale | 

### Recommendation: Option (c), checklist-primary + narrow structured-marker CI gate

**Why a pure checklist (a) fails:** the 1.4→1.5 recurrence proves the problem is *not* "the agent
didn't know the rule" — it's that nothing *mechanically* blocked the inaccurate claim from
shipping. A checklist adds another rule to a system that already had the implicit rule.

**Why a pure broad CI gate (b) fails:** grepping all prose for "CLOSED/100%/全绿" generates
constant false-positives on legitimate text. A noisy gate gets suppressed, and a suppressed gate
is no gate.

**Why hybrid (c) root-causes it:** the recurrence happens specifically in **structured verdict
claims** — the "X CLOSED", "100% green", "全绿" lines in PLAN-CHECK / AUDIT / STATE verdict
sections. Constrain the CI gate to *those structured markers only*:
- Define a required marker convention — closure verdicts MUST be written as a structured line,
  e.g. `Verdict: CLOSED (N/N tasks, 0 misses)` or `状态: 全绿 — 14/14, miss: none`.
- The CI gate greps **only lines starting with the marker token** (`Verdict:` / `状态:` /
  `Closure:`), and fails if such a line lacks a `\d+/\d+` ratio AND a miss declaration.
- Free prose ("the bug is CLOSED") never matches because it's not on a marker line → near-zero
  false-positives.
- The markdown checklist documents the marker convention + the human-judgment parts the gate
  can't check (is the miss list *complete*? is the count *correct*?).

This makes the inaccurate claim **structurally unship-able**: you cannot write a bare "全绿" in a
verdict line and pass CI. It's the same philosophy as the existing A7 baseline-tag CI step —
mechanical enforcement of a documented contract.

**Implementation note for Wave B planner:** the CI gate is a ~15-line shell/node script
(`scripts/check-transparency-verdicts.mjs`) wired into `ci.yml` as a new step, plus
`docs/TRANSPARENCY-VERDICT-CHECKLIST.md` (or a section in an existing verify-phase doc) defining
the marker convention. Keep the gate **narrow and well-documented** — its scope boundary (only
marker lines) IS the false-positive mitigation. **Confidence: MEDIUM** — this is process design;
the reasoning is sound and matches the existing A7-step precedent, but the exact marker token +
which files to scan is a Wave B planner decision and should be sanity-checked against how
PLAN-CHECK/AUDIT docs are actually structured today.

---

## § 4 — Decision Locks for Wave B Planner

| # | Decision | Rationale |
|---|----------|-----------|
| **D2.1-1** | bundle-install modeled via a new **optional** `provides: Type.Array({ id, component_type }, { minItems: 2 })` top-level field in `SpecSchema`. `install`/`verify`/`uninstall` stay **singular**. | Most surgical — purely additive, A7' 8-pillar safe (every existing manifest validates unchanged), no migration script. Mirrors phase-1.5 T5.5 `phase`/`triggers` additive pattern. Option C beat `component_type: bundle` (semantic overload) and `bundle:` array (invasive parallel code path). |
| **D2.1-2** | No new `TypeEnum` / `ComponentType` value for bundles. Bundle manifest uses existing `type: 'cc-skill-pack'`; `provides[]` enumerates contents. | `cc-skill-pack` already means "a pack of skills" — reuse it. Zero enum churn. |
| **D2.1-3** | `decision_rules.yaml` bundle-routing edits (granular `anthropics-skills-pptx` → bundle resolution) are **Phase 2.3**, NOT 2.1. Phase 2.1 only ships the `provides` schema field + tests so 2.3 can author the `document-skills` manifest. | Keeps Wave 0 scoped to schema; the only 2.1 routing edit is D-05's unrelated `chinese-content-deck` `warn:` removal. |
| **D2.1-4** | npx-skill-installer pins **`skills@1.5.7`** (vercel-labs/skills, npm pkg `skills`, latest 2026-05-14). | Confirmed de-facto tool, healthy, CONTEXT D-01 minimal-pin. Version pin required for reproducibility (ADR 0007 `install_type: npx`). |
| **D2.1-5** | Exact install command: `npx --yes skills@1.5.7 add <owner/repo> --skill <name> --agent claude-code --copy --global --yes`. **`--copy` is mandatory** — forces real-directory install at `~/.claude/skills/<name>/`, no `~/.agents/` symlink dependency. | `--copy` sidesteps the `~/.agents/` vs `~/.claude/skills/` symlink conflict for the minimal-pin scope, matching what git-clone-with-setup produces; no SessionStart sync-hook needed (CONTEXT D-02). |
| **D2.1-6** | npx-skill-installer verify = `test -f ~/.claude/skills/<name>/SKILL.md` exit code (NOT npx exit code). Directory-convention conflict recorded as a known limitation in `progress.md`. | C6 no-silent-failure — npx can exit 0 while CC can't see the skill. CONTEXT D-02 — full bridging deferred. |
| **D2.1-7** | transparency verify = **hybrid**: `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` defines a structured verdict-marker convention (`Verdict:` / `状态:` lines must carry `N/N` + miss declaration) + a **narrow** CI gate (`scripts/check-transparency-verdicts.mjs`) that scans **only marker lines** and fails on a bare claim. | Pure checklist (a) failed twice already (1.4 T1, 1.5 H1) — relies on agent diligence. Pure broad grep (b) false-positives on prose. Narrow marker-line gate makes the inaccurate verdict structurally unship-able with near-zero false-positives — same philosophy as the existing A7 CI step. |
| **D2.1-8** | The CI gate's scope boundary (marker lines only, not free prose) IS its false-positive mitigation — keep it narrow and documented. Exact marker token + scanned file globs are a Wave B planner call, sanity-checked against current PLAN-CHECK/AUDIT doc structure. | Avoids the "noisy gate gets suppressed" failure mode. |

---

## Confidence Summary

| Topic | Confidence | Rationale |
|-------|-----------|-----------|
| § 1 bundle-install schema | **HIGH** | Pure reasoning over `spec.ts` — `provides` is cleanly additive; only open choice (id naming) is correctly deferred to Phase 2.3. |
| § 2 npx-skill-installer | **HIGH** | Package name / version / publish date / all flags verified via ctx7 `/vercel-labs/skills` + npm registry this session; `--copy` mitigation directly supported by documented `installSkillForAgent` `mode` param. |
| § 3 transparency verify | **MEDIUM** | Sound process-design reasoning matching the existing A7-step precedent, but exact marker token + scanned globs need Wave B sanity-check against actual doc structure. |

**Overall: HIGH** — Topics 1 & 2 are decision-ready; Topic 3 gives a clear recommendation with one
bounded Wave-B refinement.

---

## Sources

### Primary (HIGH confidence)
- ctx7 `/vercel-labs/skills` — `skills add` CLI flags, `installSkillForAgent` API (`path` /
  `canonicalPath` / `mode` / `symlinkFailed`), `--copy` / `--global` / `--agent` / `--yes` semantics
- npm registry (`npm view skills`) — package `skills`, latest `1.5.7` (2026-05-14), dist-tags
- `src/manifest/schema/spec.ts` — current TypeBox `SpecSchema`, `ComponentType`, `TypeEnum`,
  phase-1.5 T5.5 additive-field precedent
- `routing/decision_rules.yaml` — `pptx-file-task` / `chinese-content-deck` rules current state
- `.planning/research/v0.2.0-installers.md` — installer mechanics baseline (not re-researched)
- `.planning/research/v0.2.0-extensions.md` — `document-skills` bundling discovery (upstream #675),
  baoyu-skills MIT-0

### Secondary (MEDIUM confidence)
- `.planning/phase-2.1/2.1-CONTEXT.md` D-01/D-02 — npx minimal-pin + no-sync-hook constraints
- `.planning/phase-2.1/KICKOFF.md` § 3 #8 — transparency anti-pattern root-cause mandate
- phase 1.4 T1 + phase 1.5 H1/M1 (referenced via CONTEXT/KICKOFF) — the 2-phase recurrence evidence

---

## Metadata

**Confidence breakdown:**
- bundle-install schema: HIGH — additive TypeBox field, A7'-safe, well-precedented
- npx tool selection: HIGH — registry + ctx7 verified this session
- transparency verify: MEDIUM — process design, one bounded Wave-B refinement remains

**Research date:** 2026-05-15
**Valid until:** ~2026-06-15 (stable) — except `skills` npm version, which moves fast (re-check
`npm view skills version` at execute-phase if >2 weeks elapsed; pin whatever is latest-stable then).
