# Host Installation Contract Design

Status: approved by the user on 2026-10-23. Scope: Claude Code and Codex. Execution may use the completed static architecture review as its prerequisite; the native gstack gate remains blocked/notrun.

## 1. Problem And Existing Seams

Install resolves host overrides in src/installers/index.ts; setup independently derives its effective method in src/cli/lib/setup-helpers.ts. The uninstall entrypoint dispatches the original manifest. Manifest host overrides currently contain install and optional verify, but no uninstall. Native Codex operations already have dedicated modules, while some presence logic equates absence of a JSON plugin registry with lack of a usable plugin implementation.

The target is lifecycle consistency, not a new installer framework. Preserve the seven method-based dispatchers and the existing declarative manifests.

## 2. Selected Approach

Keep declarations at their current homes and add one shared, pure host/component resolver. Introduce a thin host-operation facade around existing Claude/Codex functions only where lifecycle consumers need it. Do not create another path registry or move every existing module into a new directory.

Rejected: continuing per-consumer conditionals, which retains duplicate interpretation. Rejected: separate complete installers per agent, which duplicates backup, consent and error semantics. Rejected: a generic third-party adapter plugin API, which has no first-stage consumer.

Proposed module boundary (names are planned, not existing APIs):

```text
public lifecycle entrypoint
  -> resolveHostContext(explicit target, environment snapshot)
  -> resolveComponentPlan(manifest, context, operation)
  -> existing method dispatcher + selected native host operations
  -> operation-specific evidence and existing result formatter
```

## 3. HostContext Contract

- HostId is limited to the existing implemented claude/codex IDs. An invalid explicit target fails without execution; existing implicit host precedence remains ADR 0040-compatible.
- Context contains the selected host, OS and resolved host paths. Reuse PlatformDescriptor rather than creating parallel constants. Implementation refinement: resolution-reason diagnostics stay in the existing host resolver instead of adding an unused snapshot/persisted field.
- Select host once at the public lifecycle boundary. Passed context is authoritative; an inner operation must not redetect the host from ambient directories after planning.
- After construction, host, native/config/skill homes and the existing stateRoot are authoritative for every enabled mutation, cleanup, receipt write and native registration target. Ambient environment, directories or pins cannot reselect them. Thread context through applicable helpers before enabling that mutation path, including teardown in Task 3; Task 4 is not permission to defer this safety requirement.
- Building that context may perform the existing read-only host/pin discovery through injected readers. Purity applies to component-plan derivation from an already captured context; do not redesign host discovery as a side effect of this phase.
- Resolve native CODEX_HOME/CLAUDE_CONFIG_DIR and per-install overrides consistently, preserving explicit-empty semantics and existing tested defaults. Do not reinterpret CODEX_HOME as an instruction to migrate harnessed stateRoot.
- Do not retain or serialize the full environment. Snapshot only inputs needed for host/path selection. The existing verify-only environment allowlist remains independent and mandatory.
- OS-specific shell/runtime choices are not new host IDs. A Windows gstack failure is not a generic Codex unsupported result.

## 4. ResolvedComponentPlan Contract

The resolver is pure: no filesystem writes, process spawn, network request, registration or receipt update. Input is a validated manifest, HostContext and operation (install, inspect, update or uninstall). Output is either an explicit unsupported/invalid-contract reason or a readonly effective plan.

The effective plan carries the component ID, context, effective manifest and declaration-source metadata for selected blocks (base, host override or existing native adapter). This metadata is not observed installation provenance. Method and display group are derived from that effective install block; do not store separately mutable copies of the same fact.

Install selection preserves the current wholesale replacement semantics. Verify follows the existing host override/default rule during the compatibility slice. Unsupported behavior is per operation, not a blanket claim that a host cannot support plugins because it lacks installed_plugins.json.

Runtime inspection returns evidence separately: content, executable, registration, enablement, trust, required runtime, authentication/approval when actually probed. Unknown is not ready. An observed installation source does not establish ownership or authorize update/removal.

Keep existing InstallResult/UninstallResult and CLI success behavior through compatibility wrappers. Add structured diagnostic detail only with a concrete consumer and tests; no universal readiness framework or new receipt schema in the first slice.

## 5. Explicit Host Teardown

Propose additive spec.harness_overrides.codex.uninstall using the existing Uninstall shape. The public manifest version remains v1; existing manifests still validate. Update TypeBox, generated JSON schema, SCHEMA.md, security screening and actual resolver/uninstall consumers together.

Resolution rules:

1. An explicit host uninstall block replaces the base block in full.
2. Existing native structural teardown (MCP/plugin/hook) may use host-native operations with an exact component/plugin ID. It must not inherit a Claude shell command merely because the install method name is shared.
3. Base teardown may be shared only when explicitly audited as host-neutral and the actual target can be established; global CLI uninstall is a candidate, not a blanket rule for npm-cli (GSD also uses that method).
4. A host-specific installation without a demonstrated safe teardown returns unsupported-operation before any delete, spawn or receipt change. Never infer safe deletion from a component name or clone destination alone.

For rule 3, use a small reviewed component/host policy consumed by the pure resolver in componentPlan.ts, not a generic policy framework or an unevaluated note. Each neutral-base permission is bound to the reviewed cmd AND cleanup_paths declaration (or its deterministic digest), so a changed declaration cannot inherit a stale audit. Start only with individually reviewed neutral components; an absent policy is unsupported. Do not infer neutrality from npm-cli, a name, a command-text heuristic or path shape. Native structural teardown still targets an exact resource identity under its separate safety contract.

Before enabling mutation, audit every shipped base/optional manifest that has a Codex override and supply either a concrete teardown or an explicit unsupported outcome. Keep stop-hook-recover and other unsupported capabilities unsupported.

All cleanup confinement, consent, dirty/user-data protection and managed hook namespace checks remain in force. No generic cleanup over the entire .agents, .codex or .claude directory is permitted. Unknown installation management responsibility never grants cleanup rights.

## 6. Thin Host Adapter Responsibilities

The facade distinguishes capability support from storage shape: Codex can expose a native plugin CLI while having no JSON plugin registry. Delegate native plugin/MCP registration to existing runHarnessArgs/codexPlugins/codexMcpServers helpers, and native hook trust to codexHookTrust.

The first migration wraps existing implementations; it does not invent a common writable configuration format. Preserve serialized Codex plugin/MCP mutations and the no-config.toml/no-auth.json-read boundary. L4 authorization cannot imply hook trust. Disabled plugins are not automatically enabled.

Component-specific work remains in existing runtime modules: GSD identity/resources, planning/UI helpers, gstack browser/dependency bridge and lease check. The host facade selects paths/operations; it cannot turn an upstream failure into supported-and-ready.

No direct copying of comet/Trellis/GSD installer code. Borrow the separated roots, lifecycle reuse and artifact contract principles documented in the research.

## 7. Installation Source And Management Responsibility

Inspect native plugin IDs with marketplace qualification, installed/enabled metadata and safe resource evidence. Distinguish host-managed plugin, external skills installation, harnessed-generated artifact and unknown source where evidence allows.

These are per-operation observations, not a new persistent ownership database. Existing state receipts record presence/version; the fact that recordObservedInstall wrote a receipt must not become proof that harnessed owns externally created files. Respect user-disabled components and explicit trust decisions.

Current effective blocks, refs, methods and target paths describe intended behavior now, not the historical installation that produced a resource. Before destructive update or uninstall, match actual resource identity/source evidence against the applicable management policy. A changed manifest/channel, manual shared-skill install or observed-only receipt cannot by itself authorize external takeover, deletion or a new success receipt. Confirmation alone is not ownership evidence. Unknown/conflicting identity fails safely; an exact known native resource may be acted on only through the explicit operation policy and existing consent, without claiming ownership of the surrounding directory.

When an update cannot safely act on a source, report skipped/unsupported with a remediation path. An explicit user install/uninstall request still follows confirmation and resource-level safety checks; the adapter does not create consent.

## 8. Harnessed-Owned Artifact Contract

Describe only artifacts harnessed actually renders/writes: workflow skills, generated command files, harnessed-prefixed roles and first-party hook wrappers. Reuse current renderers, markers, skill hash ledger and backup behavior.

Do not replace the engines with one universal file copier. A hook wrapper definition and native registration/trust operation are distinct. A shared expected artifact set must feed production writers as well as tests, or it is another dead declaration.

Validate both directions in isolated fixtures: every declared artifact is written with the expected host/locale bytes, and every write is declared or explicitly explained. Repeated setup is idempotent. Existing user-file overwrite/refusal/backup behavior remains unchanged.

The existing engine-namespace restore policy (backup, warn and overwrite when applicable) is not replaced by a blanket no-overwrite rule. Unknown external ownership must not create new cleanup rights; it also must not silently change the established engine repair policy. Metadata/backup writes are classified separately from rendered payloads.

External upstream installers remain external writers. A manifest list of expected skills is not ownership of an entire upstream checkout or all files below a host directory. Initial coverage does not require a complete external file inventory.

## 9. Lifecycle Consumer Migration

| Consumer | Required Common Contract | Preserved Behavior |
| --- | --- | --- |
| install/install-base/update --upstreams | effective host blocks and native route | existing dispatch, confirmation and backups |
| setup grouping/partition/rescue | same effective method and operation support | MCP serialization, separate optional counts, failure exit |
| already-installed/retained-version probe | same host targets and runtime evidence | no automatic repair during verification |
| doctor | selected host and scoped evidence | independent checks remain; no key-only availability claim |
| uninstall | explicit effective teardown or safe unsupported | no wrong-host cleanup or automatic ownership inference |
| rendered artifacts | common owned-artifact enumeration | existing host/locale renderers and user-content policy |

Compatibility wrappers keep current callers working while each consumer migrates. Do not run legacy and new mutation paths for the same operation. Extract only the host behavior actually consumed by a migrated path.

Dry-run has no installation-target, registration, trust, pin, receipt or backup mutation. Existing package bootstrap (including compiled first-use asset unpack) and version metadata caching must be staged/accounted for separately. This phase does not redesign compiled startup to eliminate unpacking; establish a baseline after isolated bootstrap and verify no subsequent target mutation.

## 10. Approval, Safety And Exit Conditions

This document proposes interfaces; it does not authorize a new package release or live uninstallation. Native gstack plan-eng-review is still blocked by its known lease issue; static architecture review is recorded independently, not as a passing native gate.

Execution requires detailed design approval and resolution of required execution governance. The first implementation commit should contain characterization tests, not wholesale module relocation. VALIDATION.md specifies evidence obligations; PLAN.md orders the slices.

The phase is complete only after both hosts share lifecycle interpretation, unsafe teardown is blocked, declared/written owned artifacts agree, compatibility gates pass, and actual host evidence is reported separately from fixtures. gstack and externally authenticated tools may remain blocked, but cannot be claimed ready.
