# Phase 69 Local Verification

Date: 2026-10-23. Scope: Claude Code and Codex component installation contracts. Result: local fixture and package-channel acceptance passed. This is not native activation, authentication, browser readiness or release approval.

## Fresh Final Gates

| Gate | Command / Evidence | Result |
| --- | --- | --- |
| Build and types | `corepack pnpm build` | exit 0; includes `tsc --noEmit`, ESM/DTS and hook generation |
| Full serialized suite | `corepack pnpm exec vitest run --no-file-parallelism` | 367 files passed, 3 skipped; 4327 tests passed, 11 skipped, 1 todo; 283.89 seconds |
| Whole-repository lint | `corepack pnpm lint` | exit 0, 17 existing warnings; final error-only check also exit 0 |
| Schema generation | `corepack pnpm build:schema` | exit 0, generated schema included |
| Schema validation | `corepack pnpm validate:schema` | exit 0, Ajv strict/discriminator |
| Schema consumers | `node scripts/check-schema-consumers.mjs` | 204 declared, 0 evaluated by nothing; exemptions unchanged |
| Host primitive gate | `node scripts/check-host-primitives.mjs` | exit 0, no unexpected Claude primitives in Codex output |
| Locale parity | skill and YAML i18n parity scripts | both exit 0; existing render hash goldens unchanged |
| Production eval | `node dist/cli.mjs eval --dir fixtures/eval` in an isolated home/state | pass 14, fail/error/config-error/missing-golden 0, updated 0 |
| Diff hygiene | `git diff --check` | exit 0 |

The earlier 4204-pass / 8-fail run is retained in EXECUTION.md. Its eight missing-FS-mock failures were reproduced and fixed without changing the original 42 contract assertions. The final suite above is a fresh run after all production changes froze, not a sum of worker counts.

## Requirement Evidence

| Requirement | Local Evidence | Disposition |
| --- | --- | --- |
| HIC-01 | platform-host-install-context, installers-component-plan, installers-host-context, platform/winSpawn goldens | Immutable selection; pure readonly derivation; explicit unsupported host; empty/casing/precedence and independent state root covered |
| HIC-02 | host-installation-lifecycle, setup-host-context, uninstall-host-context, setup retained/grouping, observation contracts | Same effective method, source and snapshot reach preview, confirmation, dispatch and native/probe targets |
| HIC-03 | manifest-codex-uninstall, host-teardown-contract, host-native-targets, existing uninstall tests | Alias-aware security; explicit safe operation policy; unknown source/ownership, links and failed commands do not become successful removal |
| HIC-04 | host-install-context-plumbing, host-setup-write-context, native/trust/OS tests | Native env, state, backup, confirmation, L4, trust and verify secret allowlist remain separate |
| HIC-05 | external-update sentinel/channel-drift tests, observed receipt conflict tests, native generated-identity/inventory tests | Presence and current declarations do not grant ownership or overwrite rights |
| HIC-06 | host-owned-artifacts plus existing render/locale/backup/hash goldens | Complete workflow trees, commands, roles and first-party hook payloads match declarations in both directions; repeated writes and user-content protections covered |
| HIC-07 | Final source/npm/compiled smoke and negative package fixture below | Local channels verified independently; native/other-OS evidence remains separately classified |

The per-component teardown migration covers `uninstall <name>`. The legacy no-name unified footprint-removal flow was not replaced or broadened. Existing seven installer methods, package channels, state roots, consent and backup/hash policy remain in place.

## Final Package Channels

Fresh npm tarball: `corepack pnpm pack --pack-destination <isolated>/final`. Installed into a new temporary prefix using `npm install --offline --ignore-scripts --no-audit --no-fund --package-lock=false`; 117 dependencies installed. No global prefix was modified.

Fresh Windows compiled payload: `bun scripts/build-binary.mjs --outfile <isolated>/harnessed-final.exe`; 167 bundled assets, 668 modules. Neither payload is a published release; version remains 4.49.2.

Each of source, actual npm-prefix CLI and actual Windows compiled CLI was run from a foreign cwd for both hosts and en/zh locales: 12 successful setup previews, each enumerating 29 workflows in its selected skills root. Native CLI PATH was empty. HOME/USERPROFILE/native homes/state were fixture-scoped and checked against the explicit temporary root before writes. Version cache was seeded fixture metadata, not a registry/latest assertion. Compiled bootstrap/unpack was recorded before the baseline; subsequent recursive file/directory/hash snapshots were unchanged. Nine selected runtime asset hashes matched source for every channel/host.

Negative npm fixture: extracted the same tarball into a new package directory while excluding workflow assets. CLI exited 1 with a workflow failure and no workflow preview; it did not borrow the checkout's assets. The positive package was left unchanged. Existing compile bundle/unpack fault tests also passed in the full suite.

| Payload | SHA256 |
| --- | --- |
| `dist/cli.mjs` | `3E28639D473735933D74AD1461482B56B832FFD28ED263752355DCB198F4B773` |
| local `harnessed-4.49.2.tgz` | `6C14A5432B83B409E594696F5D154BF8887E620DD75FBD88B00183BF90301089` |
| local `harnessed-final.exe` | `F53E3E701187F9520CE5D727D1FF97F2EAD26B6A545742A00E1C9BDE909F1DF1` |

Tarball/prefix root: `%TEMP%/harnessed-phase69-npm-7720d9bb15cd451587830a0555f1f9f5`. Binary/channel fixture root: `%TEMP%/harnessed-phase69-binary-0eb37df151404925a2a84928dcfda597`.

## Review Closure And Boundaries

Independent static reviews found and closed nine issues, followed by a CLI preview/confirmation consistency gap. Real RED/GREEN regressions cover destination-link traversal, context priority, YAML aliases, Windows env casing, wrong-host retained verification, missing trust hashes, dry-run receipts, native hook removal identity/confinement and neutral command failure. The final full suite includes the subsequent unknown-registration, partial untrust-failure and CLI-context regressions.

- Codex MCP teardown and unaudited external plugin/skill/git teardown remain explicitly unsupported. Registration-only metadata is not source identity.
- Known existing external/manual resources cannot be silently taken over by update. Fresh default gstack/UI installation paths retain their existing declarations and confirmation policy.
- Native hook cleanup requires generated resource identity/inventory and confined targets. Native registration unknown is not absence; partial native/RPC failure is not success.
- Native gstack architecture/review gates remain blocked/notrun. The user accepted static architecture review as the execution prerequisite; no native gate is claimed passed.
- `code-simplifier` has no available Codex backing in this scope: notrun/recorded, not replaced with an invented equivalent.
- Real upstream install/uninstall, native hook activation/authentication, browser readiness and cross-OS live behavior were not exercised. Windows binary preview is real; other-OS CI and native scenarios are not inferred from mocks.
- No version bump, tag, npm publication, global installation replacement or native security-policy change was performed.

## Incomplete Workspace Cleanup

The native PowerShell deletion command for seven pre-existing root zero-byte files was rejected by execution policy. Two final directory scans now report zero root zero-byte files and Git no longer lists those seven paths. Their removal is not attributed to this agent's rejected commands, and they were not staged.

An invalid earlier smoke used the readonly PowerShell `$HOME` name and was terminated. It left a newly generated 53-byte `C:\Users\easyi\state\update-check.json`; its bounded cleanup was also rejected before execution. This residual and its parent directory remain. No alternate deletion mechanism was used. The invalid run supplies no acceptance evidence; only the guarded retries above are counted. Details, timestamps and intermediate failures are preserved in EXECUTION.md.

## CI Encoding Follow-Up

The first pushed core commit `f5ca347` ran CI `39980176901`: Ubuntu/macOS test jobs and all six binary/installer smoke jobs passed; the Windows test job alone failed. Its PowerShell 5.1 installer fixture decoded UTF-8 script bytes as ANSI, turning the one non-ASCII executable string into malformed quotes. The same failure also appears on the prior `841605a` CI run; this is an installer compatibility debt exposed by CI, not a host-contract test exemption.

Main reproduced 7 PowerShell parse errors from Windows-1252-decoded source, added a portable executable-line ASCII regression and observed RED, then replaced one diagnostic punctuation character with ASCII. The decoded source now has zero parse errors; the complete installer fixture passes 19 tests with five Windows-inapplicable Unix cases skipped. No original assertion, consent, exit propagation or install strategy was relaxed. The supplemental change does not alter the source/npm/compiled runtime payloads hashed above. The next CI run verifies this separate correction.
