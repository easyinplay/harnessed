# Phase 2.3 Deferred Items

Out-of-scope discoveries during Wave 5 execution (and later) that should be addressed in Wave 6 hotfix or carried to Phase 2.4.

---

## DI-1 — karpathy-skills.yaml schema violation (`git_ref: HEAD`)

- **Discovered**: Wave 5 T5.3 e2e smoke (2026-05-16)
- **File**: `manifests/skill-packs/karpathy-skills.yaml` L31
- **Issue**: `git_ref: HEAD` violates `manifest.v1.schema.json` pattern
  `^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+([.-][\w.-]+)?)$` (requires 7-40 hex SHA or semver tag)
- **Origin**: Wave 2 T2.4 (commit b97677d, 2026-05-16) — schema gate not run on this manifest in dry-run integration suite (karpathy is Wave 2 ship, not in Wave 1 T1.6 5-manifest dry-run list)
- **Impact**:
  - `harnessed install karpathy-skills --apply` would schema-reject before invoking installer
  - T5.3 Link 5 e2e smoke had to relax from `validateManifestFile().ok` to raw-yaml string contains-checks
  - Wave 5 T5.4 A7 守恒 verify NOT affected (ADR docs unchanged)
- **Semantic note**: `install.cmd` uses local `cp -R skills/karpathy-baseline ~/.claude/skills/` — `git_ref` is semantically unused by the local-copy install path. Real fix is one of:
  - (a) Switch `install.method` from `git-clone-with-setup` to a method that doesn't require `git_ref` (e.g. add a `local-copy` method)
  - (b) Pin `git_ref` to a real `forrestchang/andrej-karpathy-skills` upstream SHA + keep the local-copy cmd as a documentation note that THIS repo's SKILL.md derives from that pin
- **Scope decision**: OUT-of-scope for Wave 5 T5.3 (SCOPE BOUNDARY — only auto-fix issues directly caused by current task). Logged here.
- **Suggested Wave 6 fix**: Apply option (b) — pin to a real upstream SHA. Add karpathy-skills.yaml to the install dry-run integration list so future schema regressions are caught.
- **Severity**: M2 (runtime block on install command, no current data loss; manual users can `harnessed install karpathy-skills --apply` and see a clear error)
- **Tag for triage**: `wave-6-hotfix`
