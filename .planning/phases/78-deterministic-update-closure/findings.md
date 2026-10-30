# Phase 78 Findings

Date: 2026-10-29. Research status: complete for planning.

## Verified Current Behavior

- `harnessed update --upstreams` reruns `installBaseProfile` without `updateInstalled`; already-installed entries may only short-circuit and must not be reported as updated.
- compiled self-update exits before a general upstream closure can run. A fresh-runtime continuation is required.
- current upstream tally can contain failures while the command exits successfully. Phase 78 needs a structural result and exit contract.
- the existing 24-hour update cache covers harnessed itself, not all upstream components, and may fetch on a cache miss. A SessionStart foreground hook cannot call it unchanged.
- `setup --update-installed` deliberately refuses unproven plugin, checkout and shared-skill replacements. `update-unsupported` is a security boundary.
- MCP installers ignore forced update to avoid overwriting user registration configuration.
- Claude current setup installs workflow skills without legacy command files; Codex continues to generate prompts. The new workflow must preserve issue #13 behavior.

## Governance Decisions

- gstack strategic review split delivery into Phase 78 deterministic closure and Phase 79 restricted agent repair.
- Staff Engineer architecture review returned approved-with-changes with no architecture blocker.
- Phase 78 uses a code-owned adapter registry; no manifest `spec.update` is added until real update patterns are proven.
- reminder is installed by default, fail-soft and cache-only in the foreground, with persistent opt-out.
- third-party execution is allowed only through a reviewed adapter. Opaque components remain report-only.
- GSD is the first adapter because it exposes host-specific runtime identity and an upstream-owned deterministic installer.

## Base Component Classification

| Component | Install channel | Phase 78 status | Reason |
|---|---|---|---|
| `gsd` | host-specific GSD installer | reviewed adapter | runtime identity and installer can be verified |
| `ctx7` | global npm CLI | unsupported | PATH/prefix ownership and version adapter not proven |
| `playwright-cli` | global npm CLI + browser | unsupported | browser payload needs a dedicated contract |
| `superpowers` | plugin registry | unsupported | identity/version/trust differ by host |
| `planning-with-files` | Claude plugin / Codex copied skill | unsupported | host-specific channel mismatch |
| `gstack` | retained Git checkout + setup | unsupported | HEAD does not prove copied skill state |
| `ui-ux-pro-max` | plugin / temporary Git copy | opaque | Codex install removes source checkout |
| `playwright-test` | `skills@latest` copy | opaque | installer version is not content version |
| `webapp-testing` | `skills@latest` copy | opaque | shared write ownership unproven |
| `design-taste-frontend` | `skills@latest` copy | opaque | SHA does not prove local ownership |
| `mattpocock-skills` | `skills@latest` copy | opaque | bundle collisions/shared footprint |
| `exa-mcp` | MCP registration | report-only | registration is not runtime ownership |
| `tavily-mcp` | MCP registration | report-only | registration is not runtime ownership |

## Reminder and Host Evidence

- Claude hook installation already performs settings merge and idempotent verification.
- Codex first-party hooks are delivered through a local plugin and require explicit trust.
- the reminder needs a distinct identity from inject-state invalidation.
- the workflow scanner accepts an unknown flat workflow directory, so `workflows/harnessed-update/` needs no scanner change.
- workflow count in CI is fixed at 29 and must become 30.

## Baseline Verification

Before implementation, 7 related test files and 180 tests passed, covering update, update cache, Claude/Codex hooks, workflow generation and setup host context.

## Release Blockers

1. Prove a positive GSD update transition and negative identity/source cases.
2. Prove Windows compiled absolute-path P1 to P2 continuation.
3. Prove Claude reminder visibility and Codex local-plugin trust/reminder output.
4. Prove SessionStart foreground makes zero network calls and exits `0` for every failure.
5. Prove `retained`, `unsupported`, offline and partial execution cannot display as complete success.
6. Complete broad tests and independent review before release metadata, tag or publication.

## Preserved Workspace State

Phase 76/77 source changes and unrelated untracked root files are pre-existing and must not be reverted, staged accidentally or used as update fixtures.

## Local Closeout (2026-10-30)

The behavior/blocker lists above are the preserved planning baseline, not outstanding implementation status. Phase 78 is now 8/8 complete locally; [VERIFICATION.md](VERIFICATION.md) records repaired acceptance, final gates, real GSD/Windows/SessionStart smoke, review closure and execution limits. [SUMMARY.md](SUMMARY.md) is the close anchor. This docs-only task records supplied evidence without rerunning runtime acceptance. Latest published npm remains `5.0.4`; package candidate `5.0.5` remains unpublished. No Phase 78 commit/push/tag/publish; Phase 79 agent repair remains deferred.
