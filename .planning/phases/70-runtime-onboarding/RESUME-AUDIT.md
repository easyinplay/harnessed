# Phase 70 Resume Audit

Date: 2026-10-24, Asia/Shanghai.
Source under review: `338b4be7232be208995f60b4455184177d7a2fdf`.
Status: Additional verification complete; the user subsequently authorized publication and the per-release governance substitution. See the publication follow-up below.

## Confirmed Completed Work

- GitHub Actions run `40060190611` completed successfully on the exact source above: all nine jobs passed (Windows/macOS/Linux test, binary and installer matrices).
- The website was already independently deployed as `daa0e2b`; it is not a remaining deployment task and was not redeployed during this audit.
- Fresh README contracts pass 30/30. Fresh whole-repository Biome exits 0; existing warnings are not suppressed.
- Package candidate remains 5.0.0. GitHub latest stable remains v4.49.2; remote `refs/tags/v5.0.0` is absent.
- Independent read-only audit ran the mechanical release preflight at the source above: changelog, version, tracked git cleanliness and tag absence all pass. This does not test governance authorization or certify publication.

## Installed Gstack Reality Probe

Ran the existing opt-in test with the explicit installed home `C:/Users/easyi/.codex`:

```text
vitest run tests/unit/installers-gstack-lease.test.ts -t "installed runtime reality probe" --no-file-parallelism
```

Result: one selected test passed, 22 skipped; 1.51 seconds. The selected test explicitly requires a failed real lease result with keyword `upstream-lease-unavailable` and `exit 3`, and checks that owned scratch entries are unchanged after cleanup. A passing test means the current blocked environment was correctly recognized, not that gstack became ready.

The installed VERSION file currently reports 1.91.176.0. No upstream update, native symlink-policy change, shared lease removal or lock bypass was attempted. Native office-hours/CEO/architecture/review completion is still not established. Repeatedly starting the same long preamble is not a useful substitute for this bounded check.

## Bun-Hosted Isolated Codex Probe

Executed the existing `scripts/codex-live/run.mjs --isolated-only` using Bun with automatic env-file loading disabled. The outer runner supplied an allowlisted environment, temporary HOME/USERPROFILE/CODEX_HOME/cache/state roots and an explicit source assets override. No provider credentials were copied and Stage B was not run.

Result: exit 0, 16/16 checks passed, 15.25 seconds; no timeout or output-budget failure. Codex reported 0.164.0, with a drift notice versus the newest committed payload fixtures 0.163.

Verified outcomes:

- Three first-party hook plugins installed through the real production installer path in an isolated native Codex home: perturn-inject, perturn-inject-invalidate and doc-discipline-gate.
- Real app-server hooks/list reported all three trusted.
- Native plugin removal succeeded; hooks/list and plugin list contained no remaining harnessed hooks/plugins; owned marketplace and cache directories were removed.
- The script's shell checks passed for pwsh and cmd; their hook literals are explicitly npm-mode in the existing harness, not Bun-mode. Their successful timing must not be relabeled Bun hook timing.

Evidence limits:

- Production runtime selection under the Bun-hosted installer chooses Bun mode; this run did not independently persist and assert each generated Bun command literal. Existing Bun literal/shim contract tests remain separate evidence.
- No live model turn or live agent hook notification was requested. This is native registration/trust/removal evidence, not a full Bun-mode model-workflow activation certificate.
- The inner script warned that a temporary home was busy during its first cleanup attempt. The outer owned-root cleanup then completed, and a subsequent existence check confirmed the entire outer root was gone. No real Codex configuration or plugin was removed.
- Actual installed source inputs were used, not a newly published npm or signed release binary. Publication acceptance is still future work.

## Remaining Decision And Release Steps

The user requested continuing, but has not explicitly accepted replacement of the incomplete native gstack governance gates. This audit does not grant that exception. The release can proceed either after those original gates are genuinely completed, or after the user explicitly accepts the documented independent reviews and real verification as the substitute for this CLI release only.

Once that decision is resolved: re-run preflight on the actual release commit, publish the version tag once, wait for npm and all three binary jobs, verify registry/latest, signed asset checksums and executable/package versions, and record the publication receipt. None of these future steps is marked complete here. Do not change the upstream gstack readiness result or disable its safety checks to obtain a green release.

## Publication Follow-Up

The user's explicit publication request resolved the decision above for CLI 5.0.0 only. Exact release source `047cdacf925fdff5f848df0a6d04b6fadf5eac2a` passed CI `40087428094` and fresh isolated preflight before tag `v5.0.0` was pushed once. Tag-triggered publish `40100043369` completed all four jobs successfully; npm and the public stable GitHub release were created, with all nine binary/hash/signature assets. Downloaded artifact and live website acceptance are recorded separately in [the release receipt](../../releases/5.0.0.md). The original audit above remains a historical record, not the current publication hold. Native gstack is still blocked, not passed.
