# Host Installation Pattern Research

Date: 2026-10-23.

## User Decision

The user withdrew the earlier suggestion to directly replace harnessed's installation approach. Preserve the existing shared installer engine and manifests. Investigate a thin host-adaptation contract, initially for Claude Code and Codex only. Do not expand to other agent CLIs or implement a replacement during this research.

## Source Snapshots

| Project | Branch | Commit | Commit Time |
| --- | --- | --- | --- |
| comet | master | aeb1a6598034e28ce46b8422d4dbd8785e607bd7 | 2026-10-22T23:21:20Z |
| Trellis | main | f089cb3286071199e84118dee86b6d76aab032f1 | 2026-09-29T12:35:32Z |

Read primary source and tests at these commits; do not use supported-platform counts or README claims as evidence of working runtime behavior. No upstream installer or agent turn is executed.

## Existing Harnessed Mechanisms To Preserve

- Seven method-based installers and declarative manifests.
- PlatformDescriptor, resolveForHarness and capability host overrides are existing mechanisms, not greenfield features.
- Skill install-time rendered hash ledger and backup-before-overwrite already exist in skillIntegrity.ts and skillBackup.ts.
- Pack collision audits and dirty-checkout protection already exist; investigate gaps in lifecycle consumption rather than rebuilding these mechanisms.
- Native CLI-mediated configuration and existing credential/configuration-read boundaries remain in force.

## Questions Under Review

- Which host rules can be described once and consumed by install, verification, update and uninstall?
- Which differences need explicit component-specific code instead of generic path rewriting?
- How do upstreams distinguish missing, stale, user-modified and unmanaged resources?
- Which patterns fit a global upstream package manager, and which are specific to project-local template distribution?

## Findings

No installation architecture change has been implemented or approved in detail. Source/test inspection is not an upstream runtime acceptance run.

### Comet

Facts verified at aeb1a6598034e28ce46b8422d4dbd8785e607bd7:

- platform/install/platforms.ts:11 defines skills/config/detection/legacy roots and hook-format differences. Codex uses .agents as its canonical skills root while configuration/detection use .codex (lines 127-142). A shared skills directory is not evidence of a particular host installation.
- app/commands/update.ts separates plugin-managed Superpowers targets from skills-cli targets. Plugin-managed targets are reported as skipped rather than taken over; the others use installSuperpowersForPlatforms (lines 1800-1853 in the retrieved source).
- assets/manifest.json describes packaged assets. domains/skill/platform-install.ts and domains/skill/uninstall.ts share that manifest and platform helpers. This is shared description/helper reuse, not proof of one complete lifecycle interface.
- app/commands/init.ts distinguishes install/overwrite/skip/reuse and preflights bundled assets. Update tracks component-specific failures separately and reports incomplete rather than successful completion when any required update failed.

Primary references:

- https://raw.githubusercontent.com/rpamis/comet/aeb1a6598034e28ce46b8422d4dbd8785e607bd7/platform/install/platforms.ts
- https://raw.githubusercontent.com/rpamis/comet/aeb1a6598034e28ce46b8422d4dbd8785e607bd7/app/commands/update.ts
- https://raw.githubusercontent.com/rpamis/comet/aeb1a6598034e28ce46b8422d4dbd8785e607bd7/domains/skill/platform-install.ts
- https://raw.githubusercontent.com/rpamis/comet/aeb1a6598034e28ce46b8422d4dbd8785e607bd7/domains/skill/uninstall.ts

Adaptation recommendation: reuse the distinction between installation source, management responsibility, and host paths. Preserve harnessed's native Codex plugin/CLI and hook-trust boundaries rather than copying Comet's generated hooks configuration or treating cache-directory presence as readiness. Existing tests cover generated configurations and mocked installs; they do not establish actual Codex activation.

### Trellis

Facts verified at f089cb3286071199e84118dee86b6d76aab032f1:

- packages/cli/src/configurators/index.ts:54-85 registers configure and collectTemplates together. fromTemplates derives plain file-writing configuration from one template set; Claude and Codex keep explicit configure behavior for operations that cannot be represented as a file map.
- The same registry derives configured-host detection and init/update file collection. Detection requires tracked project-owned templates instead of merely finding a native .codex or .claude directory.
- packages/cli/test/configurators/platforms.test.ts:247-355 checks both directions: collected files must be written byte-for-byte; written files must be collected or explicitly excepted. It also checks repeated configuration and Windows rendering parity. These are artifact contracts, not live-host compatibility certification.
- packages/cli/src/utils/template-hash.ts records LF-normalized SHA256 baselines; trackedPaths limits platform coverage to files actually written/owned by that initialization. This is not a full-content snapshot, and does not claim all files under the host directory.
- packages/cli/src/utils/managed-removal.ts builds a removal plan from manifest keys. Ordinary listed files are slated for deletion without comparing the current content hash; structured files have dedicated scrubbers. The plan also removes .trellis as a project-owned tree. Do not transfer these deletion semantics to global upstream installations or user agent homes.

Primary references:

- https://raw.githubusercontent.com/mindfold-ai/Trellis/f089cb3286071199e84118dee86b6d76aab032f1/packages/cli/src/configurators/index.ts
- https://raw.githubusercontent.com/mindfold-ai/Trellis/f089cb3286071199e84118dee86b6d76aab032f1/packages/cli/test/configurators/platforms.test.ts
- https://raw.githubusercontent.com/mindfold-ai/Trellis/f089cb3286071199e84118dee86b6d76aab032f1/packages/cli/src/utils/template-hash.ts
- https://raw.githubusercontent.com/mindfold-ai/Trellis/f089cb3286071199e84118dee86b6d76aab032f1/packages/cli/src/utils/managed-removal.ts

Adaptation recommendation: use one declaration and bidirectional artifact-contract tests for harnessed-owned skills, generated commands, roles and hook wrappers. External installers remain external writers: do not treat a predeclared expected file set as proof that harnessed owns everything they touched. Keep actual runtime/registration/trust checks separate from template parity.

## Synthesis And First-Stage Recommendation

| Mechanism | Decision | Reason |
| --- | --- | --- |
| Shared host descriptor with separated skills/config/detection roots | Consolidate existing mechanisms | Harnessed already has PlatformDescriptor; avoid adding another conflicting path registry. |
| Plugin-managed versus skills-managed source | Evaluate explicitly in the resolved plan | Update and removal must not silently take over a host-managed or manually installed component. |
| Single host-resolved component plan | First integration target | Install, setup grouping, verify, doctor and uninstall should not independently reinterpret overrides. |
| Single owned-artifact declaration plus two-way parity tests | Adopt incrementally | Start with generated artifacts harnessed actually owns; retain host-specific operations outside a plain file map. |
| New hash/backup subsystem | Do not add | Existing skillIntegrity/skillBackup already provide the workflow-artifact baseline and backup behavior. |
| Project template overwrite/removal policies | Do not copy | Global external installations and shared host directories have different ownership and safety boundaries. |
| More agent CLIs, generic plugin framework, upstream source vendoring | Out of scope | First-stage target remains Claude Code and Codex, preserving the existing installation engine. |

Recommended sequence for a later approved design:

1. Characterize existing Claude/Codex install, verification and removal behavior with contract fixtures; preserve established permission/credential boundaries.
2. Centralize host resolution into a thin immutable component plan derived from existing declarations. Migrate duplicated consumers one by one; do not run old and new mutation paths together.
3. Define and test harnessed-owned rendered artifact sets in both directions. Preserve explicit exceptions and optional opt-in semantics.
4. Add installation-source-aware update/removal decisions only for concrete consumers; ambiguous management responsibility must not authorize deletion or overwrite.
5. Validate native registrations, plugin enablement, hook trust and required runtimes independently. Unsupported components and upstream blockers remain explicit outcomes.

## Result And Evidence Limits

The user's withdrawal of direct replacement is recorded. The research supports consolidation and selective reuse of mechanisms, not replacement by any upstream's installer. No implementation, live installation migration, upstream execution, configuration/credential access or publication occurred in this research. Native host behavior still requires fixture and machine acceptance after implementation.

## Harnessed Integration Constraints

Source inspection confirms that install resolves host overrides in src/installers/index.ts, while the uninstall entrypoint consumes the original manifest and per-method teardown. Setup separately derives the effective install method. The initial integration target is one resolved host contract shared by these consumers, not a replacement of the method dispatchers.

The existing skill backup/hash ledger covers harnessed-rendered workflow artifacts. Do not assume it establishes ownership of all external upstream files. Any broader managed-file policy needs explicit ownership boundaries; configuration or user credentials must not become generic tracked payloads.

Proposed first-stage boundaries (pending final design):

- Keep only Claude Code and Codex as implemented host targets.
- Preserve existing package channels, permission gates, confirmation and upstream installer invocations.
- Separate host-native registration/conversion from component-specific and OS-specific runtime checks.
- Verification must not silently authorize repair, enable disabled plugins or trust hooks.
- Do not infer external-resource deletion from path shape or an upstream component name.
- Use real fixture contracts and host artifact comparisons; a declared descriptor field must have an evaluated consumer.
- No copied upstream installer implementation and no new persisted receipt format unless a concrete first-stage consumer requires it.
