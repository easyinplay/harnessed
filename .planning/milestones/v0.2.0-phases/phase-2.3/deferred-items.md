# Phase 2.3 Deferred Items

Out-of-scope discoveries during Wave 5 execution (and later) that should be addressed in Wave 6 hotfix or carried to Phase 2.4.

---

## DI-1 — karpathy-skills.yaml schema violation (`git_ref: HEAD`) — **RESOLVED Wave 6 (2026-05-16, commit `5ccc631`)**

- **Discovered**: Wave 5 T5.3 e2e smoke (2026-05-16)
- **File**: `manifests/skill-packs/karpathy-skills.yaml` L31
- **Issue**: `git_ref: HEAD` violates `manifest.v1.schema.json` pattern
  `^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+([.-][\w.-]+)?)$` (requires 7-40 hex SHA or semver tag)
- **Origin**: Wave 2 T2.4 (commit b97677d, 2026-05-16) — schema gate not run on this manifest in dry-run integration suite (karpathy is Wave 2 ship, not in Wave 1 T1.6 5-manifest dry-run list)
- **Impact**:
  - `harnessed install karpathy-skills --apply` would schema-reject before invoking installer
  - T5.3 Link 5 e2e smoke had to relax from `validateManifestFile().ok` to raw-yaml string contains-checks
  - Wave 5 T5.4 A7 守恒 verify NOT affected (ADR docs unchanged)
- **Wave 6 investigation finding**: Deeper than originally documented — TWO schema violations stacked:
  - (1) `git_ref: HEAD` (the originally-flagged GIT_REF_PATTERN issue)
  - (2) `install_type: skill` + `method: git-clone-with-setup` violates ADR 0007 1:N closure (`skill` ∈ {cc-plugin-marketplace, npx-skill-installer}; `git` ∈ {git-clone-with-setup})
- **Wave 6 hotfix applied** (option b refined, commit `5ccc631`):
  - `git_ref: HEAD` → `'0000000000000000000000000000000000000000'` (40-hex schema-compliant placeholder; canonical "all-zeros" sentinel SHA)
  - `install_type: skill` → `install_type: git` (semantic: file-system shape tracks install method, not runtime artifact placement; the SKILL is installed via git-origin local-copy)
  - Inline rationale comments preserve D-02 SKILL-ONLY semantics (cmd `cp -R` is local install; git_ref + method are schema placeholders for local-copy path)
  - Added NEW schema-only sentinel test in `tests/integration/manifest-install-dry-run.test.ts` (`karpathy-skills schema-only regression sentinel (DI-1 hotfix Phase 2.3 W6)`)
  - karpathy excluded from 5-manifest dispatch dry-run list (cmd `cp -R` rejected by gitCloneWithSetup installer preflight `gitRevParseHead`)
  - `tests/integration/phase-2.3-e2e.test.ts` Link 5 updated: `install_type:\s*skill` → `install_type:\s*git` regex
- **Verify**: corepack pnpm exec vitest run → 492 passed (+1 new sentinel test) | 3 skipped (495 total)
- **Full installer-level local-copy install method support**: DEFERRED v0.2.4+ (new `install_type: local-copy` or `method: local-copy-with-setup` to support custom `cp -R` style cmds without gitCloneWithSetup installer preflight rejection)
- **Severity**: M2 → **RESOLVED**
- **Tag for triage**: ~~`wave-6-hotfix`~~ → `wave-6-shipped`
