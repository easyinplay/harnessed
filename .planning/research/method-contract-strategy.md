# Method Contract Strategy

Date: 2026-10-24.
Status: Approved documentation decisions; implementation proposals remain unapproved.

## Scope And Evidence

This record preserves the approved conclusions of the Comet Native/Classic comparison and the related documentation policies. It is not an implementation plan, a new phase, a migration authorization, or permission to weaken AGENTS.md.

The comparison used Comet snapshot `aeb1a6598034e28ce46b8422d4dbd8785e607bd7`, commit time `2026-10-22T23:21:20Z`. The existing local research notes report inspection of:

- `README-zh.md`.
- `assets/skills-zh/comet-native/SKILL.md`.
- `assets/skills-zh/comet-classic/SKILL.md`.
- `docs/architecture/sdk-getting-started.zh.md`.
- `docs/architecture/runtime-sdk-native-classic-integration.zh.md`.

These are upstream declarations and source observations, not a local reproduction or upstream runtime acceptance. No upstream installation or agent execution was performed for this documentation change. Author-reported token results are omitted; they are not evidence of harnessed performance.

Host-installation research remains separate: [Host Installation Pattern Research](./host-installation-patterns.md). Its installer/ownership conclusions do not authorize a methodology change.

## Meaning Of Native And Classic

Comet Native delegates method selection to a capable model after scope/spec confirmation, while retaining runtime state, user decisions, tests, fresh verification and recoverable archive obligations. Classic retains selected-method process obligations, including OpenSpec/Superpowers stages.

The distinction is **autonomous method selection versus method-constrained execution**. It is not light versus full, a task-size heuristic, or a choice between Claude Code and Codex.

The reference direction is a shared runtime with independent workflow contracts and isolated contract state. Project configuration explicitly selects a contract; it must not silently switch contracts based on task size, host availability, dependency failures or the model's preference. Shared infrastructure is not permission to merge process obligations or state namespaces.

## Harnessed Decisions

### Preserve The Default

Keep the existing three-layer-stack methodology as the default: gstack governance, GSD orchestration and superpowers execution quality, with planning persistence and evidence gates. This record adds no autonomous mode, SDK, installer replacement, state migration or automatic switching. Existing AGENTS.md rules and approvals remain in force.

### Keep Three Dimensions Independent

| Dimension | Meaning | Must Not Imply |
| --- | --- | --- |
| Host | Claude Code/Codex execution primitives and installation/registration boundaries | A different method contract or weaker safety requirements |
| Method contract | The approved workflow's required decisions, stages and process evidence | A light/full verification label or a host selection |
| Verification strength | The required depth and evidence for the task's risks and outcomes | Permission to skip a selected contract's mandatory stages |

Existing `verify_mode` is advisory verification strength, not a Native/Classic selector. Native/headless execution paths and `auto_transition` are separate concerns. Do not repurpose those names as methodology modes.

### Strengthen Shared Boundaries Before Considering Another Contract

The approved direction is to strengthen the binding between the approved spec, change scope, permissions and verification evidence. Concrete runtime changes still require their own approved design and acceptance criteria.

- Record what spec and change scope were approved, including allowed files/actions and the authority for any expansion.
- Separate tool availability, prompt capability/role injection, actual upstream invocation and successful execution. Injecting an upstream role or name into a prompt is not proof that the official upstream ran.
- Keep verification evidence tied to the approved outcome and relevant permissions. File existence and rendered hashes do not establish semantic correctness.
- Preserve explicit blockers. If a required gstack component is unavailable, report that component and the affected step; do not silently substitute a static role review for an explicitly required official gstack invocation.
- Missing gstack is not proof that the entire shared runtime or every workflow is unusable. Report component readiness separately from unrelated runtime capabilities.

### Audit Version Pinning Before Implementation

Comet's README IMPORTANT callout assigns state, execution and recovery to the SDK, while the host supplies models, MCP and tools. Its evaluation unit is the whole application with fixed dependencies, not an isolated prompt. An active run should bind its selected application/workflow definition and dependency versions rather than silently changing meaning after an update. For harnessed, this is an audit target, not a claim of a fully implemented SDK or version-pinning contract: first inspect the existing state, checkpoint and evidence mechanisms for reusable identity/version fields and recovery behavior.

Reuse the existing validated, locked and atomic runtime state where suitable. Do not introduce another state database or duplicate ledger merely to imitate upstream naming. Any later contract isolation, version binding or migration behavior requires an explicit approved design.

### Future Autonomous Method Evaluation Is Opt-In Only

Only after the shared boundaries and state/version audit should a separately approved project consider an explicit opt-in autonomous-method contract. Evaluate it against the current contract using common outcome and safety cases, plus contract-specific process checks. Shared safety/outcome checks do not erase each contract's distinct process obligations.

There is no authorization here to add that contract, a mode flag, a new SDK, a migration, or weaker governance. Project selection and any later transition must be explicit, not an automatic fallback.

## Approved Documentation Policies

### English Release Records Going Forward

All new commit subjects and bodies, new CHANGELOG/Unreleased entries, GitHub release notes, and release log documents must be in English. Do not translate or rewrite existing historical commits, CHANGELOG entries, release notes or release logs. Existing identifiers, commands and references retain their exact spelling. Conversation language and localized documentation are unchanged.

This is a content-language policy, not authorization to commit, push or publish.

### README Language Entry Points

- `README.md` is the canonical default English document.
- `README-zh.md` preserves the Simplified Chinese document.
- `README-en.md` remains a full English compatibility mirror, with a pointer to the canonical document.
- Root README language navigation points English to `README.md` and Simplified Chinese to `README-zh.md`; best-effort authority notes point to `README.md`.
- Preserve local heading anchors and verify navigation after the move. Add `README-zh.md` to the npm publication allowlist.

### Installation Recommendation

Put the standalone binary before npm and mark it recommended. npm remains a supported alternative and requires Node.js >= 22. Align the AI installation guide and the root README installation order without rewriting entire translations.

The standalone binary removes only harnessed's own Node.js dependency. Host/upstream tools may still require Node/npm, Git, Bun, Python or browser system libraries. Binary installation, target-host setup and actual runtime acceptance are distinct outcomes. Do not report a complete installation when setup failed or a required dependency remains unverified.

## Documentation Acceptance Checklist

Worker verification completed on 2026-10-24:

- [x] This worker's changes stay within the approved documentation paths and `package.json.files`; no runtime, version or historical CHANGELOG changes.
- [x] Native/Classic semantics, explicit selection, independent dimensions, gstack visibility and evidence limits are recorded without claiming implementation.
- [x] All future release-record categories are explicitly English; historical records remain unchanged.
- [x] English and Simplified Chinese entry points, translation authority notes and local README anchors resolve: 11 root READMEs, 99 navigation links, 176 local links and 11 README anchors checked.
- [x] Standalone installation precedes npm and is recommended in all 11 root READMEs; npm support, upstream runtime caveats and AI guide step references were checked.
- [x] `README-zh.md` is in the npm package's dry-run file list: `npm pack --dry-run --json --ignore-scripts --offline` reports 182 files including all three English/Chinese README entry points.
- [x] Whitespace/diff checks pass; this worker leaves pre-existing untracked notes untouched and unstaged and does not commit or push. The main session handles any later commit/push under its standing policy.

The main session owns the STATE.md entry and final integrated verification. This documentation task does not update STATE.md or claim runtime acceptance.
