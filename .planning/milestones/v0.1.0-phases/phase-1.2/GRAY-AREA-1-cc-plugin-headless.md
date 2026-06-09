# GA-1: cc-plugin-marketplace Headless Install Mechanism

> Phase: 1.2 plan-phase pre-blocker
> Investigation date: 2026-05-12
> Role: GSD advisor-researcher
> Refs: phase-1.1 progress.md F20, ASSUMPTIONS.md L190, VERIFICATION.md L139

---

## Problem Statement

Phase 1.1 wave 8 (paranoid hotfix) F20 finding:

> The 3 manifests (ralph-loop / superpowers / planning-with-files) have spec.install.cmd written as Claude Code REPL slash commands (/plugin install foo at marketplace), NOT shell commands. A harnessed installer using child process exec(cmd) directly would 100 percent fail (/plugin: command not found). Schema layer is fine (cmd is just string), but the actual execution mechanism is undefined.

Phase 1.1 wave 8 H5 commit 101f0b4 added yaml comments to the three manifests flagging this and deferred the decision to phase 1.2 plan-phase.

Why phase 1.2 must address this: although ROADMAP.md schedules the cc-plugin-marketplace installer for phase 2.1 (v0.2.0), phase 1.1 already landed these 3 manifests as fixtures (T7.3 / T7.4 / T7.7). Any phase 1.2 dry-run / validator work that defaults to assuming install.cmd is shell-executable will accumulate design debt. Phase 1.2 plan-phase MUST pick A/B/C direction first so phase 2.1 can implement against a frozen contract.

---

## Research Findings

### 1. Does Claude Code have a headless plugin install CLI?

**YES, and it is first-class.** This is the most important finding -- phase 1.1 F20 assumed cc-plugin-marketplace requires the REPL, but **official docs explicitly support a shell-CLI form**:

From Claude Code CLI Reference (https://code.claude.com/docs/en/cli-reference):

| Command | Description | Example |
|---------|-------------|---------|
| `claude plugin` | Manage Claude Code plugins. Alias: `claude plugins`. | `claude plugin install code-review@claude-plugins-official` |

From Plugins Reference, CLI commands section (https://code.claude.com/docs/en/plugins-reference):

```
plugin install
claude plugin install <plugin> [options]

-s, --scope <scope>   Installation scope: user, project, or local (default: user)

claude plugin install formatter@my-marketplace
claude plugin install formatter@my-marketplace --scope project
claude plugin install formatter@my-marketplace --scope local
```

Full subcommand matrix (all support --scope user/project/local):

- claude plugin install <plugin>[@marketplace] [-s <scope>]
- claude plugin uninstall <plugin> [-s <scope>] [--prune]
- claude plugin enable / disable / update / list / details / tag / validate / prune
- claude plugin marketplace add <source> / remove / list / update

**Direct on-machine verification** (during this investigation, an accidental shell parse caused the harness to actually execute `claude plugin install code-review@claude-plugins-official` which returned: ✔ Successfully installed plugin: code-review@claude-plugins-official (scope: user). The CLI is real, working, and installed v2.x of Claude Code on this Windows native machine).

Key observations:
- --scope project writes the plugin into .claude/settings.json enabledPlugins, mirroring phase 1.1 R03 section 3.3 enforcement of MCP installer --scope project (project-level reproducibility).
- The CLI is process exit-on-completion, directly spawnable via child_process.exec, NO REPL needed.
- v2.1.121+ also offers `claude plugin prune` for orphan-dep cleanup (useful in v0.2 ralph-loop uninstall chain).
- Aliases discovered from on-machine help: `install`/`i`, `uninstall`/`remove`, `prune`/`autoremove`.

Phase 1.1 progress.md F20 assumption (must paste into REPL) is OBSOLETE -- docs at least in v2.1.x have promoted plugin management to top-level shell CLI.

### 2. anthropics/claude-plugins-official actual install mechanism

Direct curl pull of marketplace.json (https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json) verified (200+ plugins, 2241 lines):

**Two of the three target plugins are in the official marketplace**:

```json
{
  "name": "ralph-loop",
  "source": "./plugins/ralph-loop",
  "category": "development",
  "homepage": "https://github.com/anthropics/claude-plugins-public/tree/main/plugins/ralph-loop",
  "author": { "name": "Anthropic", "email": "support@anthropic.com" }
},
{
  "name": "superpowers",
  "source": {
    "source": "url",
    "url": "https://github.com/obra/superpowers.git",
    "sha": "f2cbfbefebbfef77321e4c9abc9e949826bea9d7"
  },
  "category": "development"
}
```

Observations:
- **ralph-loop**: local source (./plugins/ralph-loop), distributed inside anthropics/claude-plugins-official, Anthropic-maintained.
- **superpowers**: url + sha (git-submodule style) pointing to obra/superpowers.git SHA f2cbfbef..., but **served as a member of the official marketplace**. Phase 1.1 manifest source URL https://github.com/obra/superpowers.git matches this sha-pin.
- **planning-with-files**: **NOT in** anthropics/claude-plugins-official, lives in OthmanAdi own marketplace (https://github.com/OthmanAdi/planning-with-files). Install procedure is two-step:

  REPL form:
  ```
  /plugin marketplace add OthmanAdi/planning-with-files
  /plugin install planning-with-files@planning-with-files
  ```

  Shell-CLI equivalent:
  ```
  claude plugin marketplace add OthmanAdi/planning-with-files
  claude plugin install planning-with-files@planning-with-files --scope project
  ```

**Impact on phase 1.1 manifests**:
- manifests/tools/ralph-loop.yaml install.marketplace should be claude-plugins-official (auto-registered, no marketplace add needed) -- matches current state.
- manifests/tools/superpowers.yaml install.marketplace same as above.
- manifests/skill-packs/planning-with-files.yaml install flow is **2-step** (add then install) -- phase 2.1 installer must front-load the marketplace add step. Phase 1.2 schema layer should reserve an optional install.marketplace_source field (owner/repo format), omitted for official upstreams.

**Other Anthropic-blessed plugins** (mentioned in CLAUDE.md but not yet manifested in phase 1.1):
- frontend-design, code-review, code-simplifier, commit-commands, pr-review-toolkit, agent-sdk-dev, plugin-dev are all in claude-plugins-official -- low cost to add in phase 2.1+.
- **gstack, ui-ux-pro-max, webapp-testing are NOT in the official marketplace** (verified by grep on marketplace.json) -- they need phase 2.1 npx-skill-installer or git-clone-with-setup paths.

### 3. Plugin install directory + registration mechanism

From plugins-reference docs:

- **Data dir**: `${CLAUDE_PLUGIN_DATA}` resolves to ~/.claude/plugins/data/{id}/, where {id} = <plugin-name>-<marketplace-name> (chars outside [a-zA-Z0-9_-] replaced with -). Example: formatter@my-marketplace -> ~/.claude/plugins/data/formatter-my-marketplace/
- **Cache dir**: ~/.claude/plugins/cache (clearable for troubleshooting)
- **Persistent registration**:
  - --scope user -> ~/.claude/settings.json enabledPlugins
  - --scope project -> .claude/settings.json enabledPlugins (committed to repo, team-shared)
  - --scope local -> .claude/settings.local.json (not committed)
- **Multi-plugin namespace**: plugin skills auto-prefixed with <plugin-name>: -- e.g. commit-commands plugin provides /commit-commands:commit

**For harnessed**:
- The harnessed manifest install.scope: project (already enforced for MCP in phase 1.1) extends naturally to cc-plugin-marketplace (writes to .claude/settings.json, cross-machine reproducible).
- Uninstall is just claude plugin uninstall <name>@<marketplace> --scope project, no manual settings.json editing needed.

### 4. Headless workaround (if CLI did not exist)

**Not needed** (CLI is first-class).

But as phase 1.2 plan-phase risk buffer, two fallback paths recorded:

**Fallback 1: --plugin-dir <path> / --plugin-url <url> (session-scoped, NOT persisted)**
```
claude -p ... --plugin-dir /path/to/plugin-or-archive.zip --plugin-url https://example.com/plugin.zip
```
- Suitable: CI one-shot use, no settings.json write
- Unsuitable: harnessed users want plugins persistent across sessions

**Fallback 2: manually edit .claude/settings.json + git clone**
```
git clone <plugin-repo> ~/.claude/plugins/data/<id>/
# then write enabledPlugins JSON manually
```
- Risk: bypasses official plugin loader, no dependency demotion reporting
- Use only as: last-resort emergency fallback if official CLI fully broken

**Fallback 3: CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1 + stream-json**
```
CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1 claude -p ... --output-format stream-json
```
Listen for system/plugin_install events to surface install progress (phase 2.1 advanced UI option).

---

## Candidate Comparison

| Option | Feasibility | Phase 1.2 effort | UX | Risk |
|--------|-------------|------------------|------|------|
| **A. Auto-print prompt + manual REPL paste** | fallback only | low (1 file) | badly degraded (manual) | low (no new dep) |
| **B. Headless `claude plugin install` CLI** | **first-class, verified on-machine** | medium (installer module + doctor probe `claude --version` >= 2.1.121) | fully automated | low-medium (depends on CC binary version) |
| **C. Defer cc-plugin-marketplace to v0.2** | viable | 0 | research-only ship | medium (v0.2 ralph-loop / superpowers all delayed) |

### Detailed comparison

**Option A -- Auto-print prompt (semi-auto)**
- Implementation: installer detects type=cc-plugin -> prints prompt + pauses + user manually pastes into REPL
- Pros: no version dep; works on any CC version
- Cons: clashes with harnessed full-auto manifest assembly value prop; UX collapses with 30+ upstream plugins
- Verdict: **fallback only** (degrade path when claude plugin CLI is missing)

**Option B -- Headless CLI (RECOMMENDED)**
- Implementation:
  1. `harnessed setup` doctor probes `claude --version` must be >= v2.1.121 (phase 1.1 R04 P0#5 already has self-version-check skeleton)
  2. installers/ccPluginMarketplace.ts directly spawns `claude plugin install <plugin>@<marketplace> --scope project`
  3. 2-step marketplace (e.g. planning-with-files): first spawn `claude plugin marketplace add <owner/repo>`, then install
  4. 4-step uninstall fallback (already in ROADMAP v0.2 must-have #7): `claude plugin uninstall --prune` -> on fail, manually strip from .claude/settings.json enabledPlugins -> on fail, `rm -rf ~/.claude/plugins/data/<id>` -> finally report manual instructions
- Pros: 100 percent headless; aligns with phase 1.1 ADR-0001 full-auto assembly thesis; mirrors MCP `claude mcp add/remove` pattern (SPEC section 8.4)
- Risk: user has old CC -> doctor refuses run + suggests upgrade (already phase 1.1 setup pattern)
- **Phase 1.2 plan-phase MUST freeze**: schema accepts install.marketplace (marketplace name) + install.marketplace_source (owner/repo, optional, omitted for official); installer auto-expands to add+install two steps

**Option C -- Defer cc-plugin-marketplace to v0.2**
- Implementation: phase 1.2 ships zero cc-plugin-marketplace code (no installer); phase 1.1 manifests remain as schema fixtures (current state)
- Pros: phase 1.2 scope tightens to cli-npm + mcp-stdio only
- Cons: matches ROADMAP.md phase 2.1 plan EXACTLY -- this is **already the plan**. But phase 1.2 plan-phase still needs to freeze schema fields (marketplace_source) and installer interface (spawn shape) up-front so phase 2.1 does not retrofit the schema
- Verdict: **NOT in conflict with B** -- C is about WHEN to write installer code (phase 2.1), but phase 1.2 plan-phase must adopt B is interface design (schema + spawn protocol)

---

## Recommendation

**Primary: Option B (Headless `claude plugin install` CLI) + Option C is timing (installer code lands in phase 2.1)**

Reasoning:
1. **F20 assumption is obsolete** -- `claude plugin install` is a v2.1.x first-class shell CLI, no REPL needed. Option A degradation is moot. Direct on-machine verification confirmed (accidental shell-parse during research actually executed the install successfully).
2. **B is 100 percent symmetric with phase 1.1 architecture** -- SPEC section 8.4 already mandates `claude mcp add/remove` for MCP; plugin uses `claude plugin install/uninstall` as same pattern continuation. Doctor + 4-step uninstall fallback can reuse phase 2.1 design as-is.
3. **Schema tweak cost is low** -- phase 1.2 plan-phase freezes install.marketplace_source (optional owner/repo) to cover both official (omitted) and third-party (e.g. OthmanAdi/planning-with-files) cases.
4. **Phase 1.2 scope unchanged** -- keeps ROADMAP plan (cli-npm + mcp-stdio), but plan-phase documents Option B contract so phase 2.1 implements without rework.

**Fallback: Option A** -- only when doctor detects CC version < v2.1.121, degrade to print-prompt (do not block install flow).

---

## Concrete inputs to phase 1.2 plan-phase

### Phase 1.2 scope confirmation (unchanged + 1 plan-phase doc addition)

**Includes**:
1. cross-OS CI matrix Day 1 (mac / linux / win-native) -- already planned
2. installers/cli-npm.ts -- already planned
3. installers/mcp-stdio.ts with mandatory --scope project -- already planned
4. **NEW (plan-phase only, 0 code lines)**: in phase 1.2 plan-phase docs, freeze the cc-plugin-marketplace **schema + installer interface contract**, write into docs/adr/0003-cc-plugin-marketplace-protocol.md (or merge as ADR 0001 errata #2):
   - install.marketplace: required, marketplace name (e.g. claude-plugins-official / planning-with-files)
   - install.marketplace_source: optional, { source: "github", repo: "owner/name" }, omitted for official upstreams
   - installer spawn protocol: first `claude plugin marketplace add <repo>` (if marketplace_source present) -> then `claude plugin install <name>@<marketplace> --scope project`
   - doctor protocol: `claude --version` >= v2.1.121; if not met, install degrades to Option A print-prompt

**Excludes** (deferred to phase 2.1):
- installers/ccPluginMarketplace.ts actual code -- aligned with ROADMAP
- `claude plugin uninstall --prune` 4-step fallback chain -- aligned with ROADMAP v0.2 must-have #7

### If Option A (fallback only) is invoked, installer prints:

```
Claude Code v<X> detected (required: >= v2.1.121).
cc-plugin-marketplace headless install unavailable.

Manual install required:
  1. Open Claude Code REPL: claude
  2. Paste:    /plugin install ralph-loop@claude-plugins-official
  3. Confirm:  press Enter

Press Enter when done, or Ctrl-C to skip.
```

### If Option C (more aggressive defer) -- ROADMAP adjustment:

**NOT recommended** -- ROADMAP already schedules cc-plugin-marketplace for phase 2.1 (v0.2.0). Research conclusion: phase 1.2 plan-phase **only documents the protocol**, phase 2.1 implements the code -- v0.1 ship cadence unaffected.

If user defers further (team bandwidth / phase 1.2 over-time), the only change is phase 1.2 ADR-0003 writing slips to phase 2.1 plan-phase. But that leaves phase 1.1 three manifests as semantically-undefined fixtures at v0.1 ship time -- **not recommended**.

### Phase 1.1 manifest fix needed?

**Only one fix**:
- manifests/skill-packs/planning-with-files.yaml: current install.marketplace value needs verification -- if it says claude-plugins-official, that is **WRONG** (planning-with-files is not in official). Correct value: marketplace=planning-with-files, plus marketplace_source={ source: github, repo: "OthmanAdi/planning-with-files" }
- manifests/tools/ralph-loop.yaml: install.marketplace=claude-plugins-official -- unchanged
- manifests/tools/superpowers.yaml: install.marketplace=claude-plugins-official -- unchanged (source is obra/superpowers, but distributed via official entry)

Phase 1.2 plan-phase task list should add: planning-with-files manifest fix (schema-extension + manifest-fix coupled commit).

---

## Sources

Primary:
- Claude Code Plugins Reference (CLI commands): https://code.claude.com/docs/en/plugins-reference -- complete claude plugin install subcommand matrix + --scope semantics
- Claude Code CLI Reference: https://code.claude.com/docs/en/cli-reference -- claude plugin top-level command registration
- Discover and install plugins: https://code.claude.com/docs/en/discover-plugins -- slash vs CLI command parity
- Run Claude Code programmatically (headless): https://code.claude.com/docs/en/headless -- --plugin-dir / --plugin-url / system/plugin_install events
- anthropics/claude-plugins-official marketplace.json: https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json -- ralph-loop / superpowers actual source fields
- anthropics/claude-plugins-official README: https://github.com/anthropics/claude-plugins-official -- official marketplace overview

Secondary:
- Ralph Loop on Claude Plugins Hub: https://claude.com/plugins/ralph-loop -- 163,757 installs + Windows jq limitation
- OthmanAdi/planning-with-files: https://github.com/OthmanAdi/planning-with-files -- third-party marketplace install commands
- hesreallyhim/claude-code-json-schema: https://github.com/hesreallyhim/claude-code-json-schema -- unofficial plugin.json / marketplace.json schema reference
- Plugin marketplace deep dive: https://ice-ice-bear.github.io/posts/2026-04-03-claude-code-plugin-marketplace/ -- community marketplace.schema.json status
- Anthropic plugin marketplaces docs: https://code.claude.com/docs/en/plugin-marketplaces -- extraKnownMarketplaces settings integration

Phase-1.1 internal refs:
- D:/GitCode/harnessed/.planning/phase-1.1/progress.md F20 (original finding)
- D:/GitCode/harnessed/.planning/phase-1.1/ASSUMPTIONS.md L190 (6-week stability assumption)
- D:/GitCode/harnessed/.planning/phase-1.1/VERIFICATION.md L139 (deferred to phase 1.2)
- commit 101f0b4 (H5 yaml-comment annotations on three manifests)

---

**One-line conclusion**: F20 assumption (must REPL-paste) is OBSOLETE -- `claude plugin install <name>@<marketplace> --scope project` is a v2.1.x first-class shell CLI (verified on-machine during this investigation). Phase 1.2 plan-phase **needs zero new code**, only an ADR documenting the schema + spawn protocol contract; phase 2.1 implements directly. Doctor probe of CC version is the Option A degradation gate.

