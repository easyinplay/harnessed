# Phase 72: npm 5.0.1 Maintenance Release

Date: 2026-10-26. Status: candidate in progress. This patch cuts the already verified Phase71 corrections; it does not add a new product surface.

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
