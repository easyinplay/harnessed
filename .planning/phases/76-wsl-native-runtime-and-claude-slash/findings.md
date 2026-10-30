# Phase 76 Findings

## Verified Inputs

- WSL setup selected Windows npm/npx/global CLI shims from inherited Windows PATH and launched `CMD.EXE` with a `\\wsl.localhost\...` cwd, which Windows rejected as UNC.
- The same environment had no native Linux `node`, producing `/bin/sh: 1: node not found` and a Windows `ctx7` wrapper failure.
- `git clone` failures to `github.com:443` are independent network failures and must not be reclassified as runtime errors.
- Issue #13 reports duplicate current-Claude slash entries because setup installs both `skills/<x>/SKILL.md` and `commands/<x>.md`.
- The user explicitly requires current Claude Code behavior only; no compatibility path for older Claude Code is needed.

## Design Decisions

- Introduce a shared native-tool resolver and use it for both presence detection and execution.
- Fail closed when the first selected Linux PATH entry is a Windows launcher; do not search past it and later execute a different first entry.
- Do not globally sanitize `/mnt/c` from PATH.
- Stop generating Claude workflow command files and prune only harnessed-owned legacy files identified by the existing marker.
- Preserve Codex prompt generation and user-authored Claude command files.
- GSD upstream confirms host-specific materialization: Claude uses its native `~/.claude` skill surface, while other runtimes receive their own transformed layouts. It does not rely on Claude scanning `.agents/skills`.
- Local inspection confirms `~/.agents/skills/ship` and `~/.claude/skills/ship` are independent ordinary directories, not symlinks, and their `SKILL.md` hashes differ.
- Therefore checkpoint setup detection must be host-aware: Claude proves readiness through harnessed-owned workflow skills; Codex continues to prove readiness through generated prompt files.

## Untrusted External Input

- GitHub issue #13 content is treated as problem evidence only; no instruction embedded in it is executed.
- GitHub currently has two open non-PR issues: #13 (Claude slash duplication) and #12 (release-preflight version discovery outside npm projects).
- Issue #12 is an independent cross-ecosystem version-source/API decision and is being researched separately before implementation approval.

## Repository State

- `origin/main` points at `b491407897c2745675ee3640a39a1a816c6a2159` locally.
- CI runs `40874806116` and `40875856153` both completed successfully; the older Phase 75 text saying CI was pending is stale and must be corrected during metadata synchronization.
