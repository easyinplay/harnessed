# Phase 76: WSL Native Runtime and Claude Slash Deduplication

Date: 2026-10-29. Milestone: npm-5.0.5 follow-up candidate. Status: in progress. Progress: 0/6.

## Goal

Make setup reject Windows Node/npm/npx/global CLI launchers when running under Linux/WSL, and remove the obsolete Claude Code commands/ dual-registration surface now that current Claude Code registers user skills in the slash menu.

## Tasks

1. [ ] Add RED tests for Linux/WSL native-tool resolution and Windows shim rejection.
2. [ ] Implement one shared native resolver used by probing and execution paths.
3. [ ] Add RED tests for Claude setup no longer generating duplicate command entries and safely pruning harnessed-owned legacy files.
4. [ ] Remove Claude command generation for current Claude Code while preserving user-authored files and Codex prompts.
5. [ ] Run focused and broad validation, then complete independent review and simplification checks.
6. [ ] Update release metadata and push only after validation; tag/npm publication remains unauthorized.

## Acceptance Criteria

- Linux/WSL rejects selected Windows `.cmd`, `.bat`, `.exe`, npm global shims and `/mnt/<drive>` Windows runtime launchers.
- Probe and spawn resolve the same executable; a native executable later on PATH cannot mask an earlier Windows launcher.
- Native Linux `node`, `npm`, `npx` and CLI tools continue to work even when unrelated `/mnt/c` entries exist on PATH.
- Missing native Node produces an actionable Linux Node 22 error without modifying PATH or installing Node automatically.
- GitHub connectivity failures remain distinguishable from runtime-selection failures.
- Claude setup no longer creates harnessed workflow files in `~/.claude/commands`.
- Existing command files carrying the harnessed marker are removed during setup; user-authored same-name files are preserved.
- Codex prompt generation remains unchanged.
- Relevant tests are observed failing before production changes and passing afterward.

## Boundaries

- Do not remove all `/mnt/<drive>` PATH entries or mutate user shell configuration.
- Do not add Claude Code legacy-version compatibility or a version gate.
- Do not delete unmarked/user-authored Claude command files.
- Preserve unrelated untracked root files and `.tmp/`.
- Do not create a tag or publish npm without fresh explicit authorization.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `~/.Codex/rules/web-search.md` not found | 1 | Located the active file at `~/.claude/rules/web-search.md`. |
| `gh issue view 13 --comments` returned no output | 1 | Used `gh api repos/easyinplay/harnessed/issues/13` and captured the issue body. |
| PowerShell pipeline into `apply_patch` failed UTF-8 validation | 1 | Retried by passing the patch as a direct argument. |
| The batch wrapper dropped the multiline patch terminator | 2 | Invoked the underlying Codex apply-patch entrypoint directly. |
