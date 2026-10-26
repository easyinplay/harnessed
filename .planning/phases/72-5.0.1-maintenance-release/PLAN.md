# Phase 72: npm 5.0.1 Maintenance Release

Date: 2026-10-26. Status: complete; published and downloaded acceptance passed. This patch cut the already verified Phase71 corrections without adding a new product surface.

## Scope

- Package version:5.0.1.
- Manager-neutral package-update dry-run safety fix.
- Concise localized README installation sections and removal of the redundant AI installation guide.
- Repository hygiene: project-local Claude files are untracked while their local copies remain intact.
- Current Bun website guidance is already independently deployed and verified; it is not part of the CLI package.

## Release Gates

1. Carry forward Phase71 evidence:4468-test serialized regression, focused updater/runtime tests, docs30, build, lint and independent static review.
2. Rebuild at5.0.1 and rerun installation documentation contracts.
3. Commit and push the candidate, then require exact-source three-platform CI success.
4. Run isolated release-preflight and verify npm5.0.1 plus remote tag vacancy.
5. Stop for explicit user authorization before pushing `v5.0.1`.
6. After authorization, publish once and verify npm metadata, the three signed binaries and the live website version as applicable.

## Boundaries

No runtime-mode, host, schema, state or security-policy change is included. The known native gstack Windows lease blocker remains explicit. The release-only governance substitution approved for5.0.0 does not automatically extend to this release.

## Outcome

- Candidate96f338c passed exact-source CI40353980387 on all nine jobs. Isolated release-preflight passed four checks, and public version/tag vacancy was confirmed before the user explicitly authorized publication.
- Annotated tagv5.0.1 was pushed once and peeled to96f338c. Publish40355172102 passed npm plus all three platform binary jobs.
- Public npm converged to version/latest5.0.1; actual tarball integrity, normal temporary dependency installation and installed CLI version passed.
- All nine release assets were downloaded. Three hashes and Ed25519 signatures passed, tampering was rejected, and the downloaded Windows executable printed5.0.1 in isolation.
- Four fresh production website contexts observed all version/link nodes move fromv5.0.0 tov5.0.1. Native gstack remains blocked, not passed. See the release receipt and SUMMARY.
