# Installed Codex Acceptance (2026-10-23)

## Verified baseline and installation
- PATH resolved standalone harnessed 4.43.0. Real harnessed update upgraded it to 4.49.1, retaining the old binary under ~/.codex/harnessed/bin-backup/4.43.0.
- Default Codex setup reported 2 installed / 7 already-installed / 1 skipped / 1 failed (107.6s), yet exited 0.
- Setup installed 29 workflow skills, 26 commands, and 20 Codex agent roles. It backed up 24 non-pristine skill directories before overwrite.
- Workflow integrity now passes 29/29. superpowers@openai-api-curated is installed and enabled.
- Explicitly installed and trusted perturn-inject, perturn-inject-invalidate, doc-discipline-gate. Installed doctor confirms all three trusted.
- Explicit harnessed install ctx7 --system --non-interactive succeeded; ctx7 --version returns 0.8.1.
- ctx7 library react hooks returned real library results successfully (exit 0).
- Installed gates task with explicitly filled single-command facts fires only task-code/task-deliver and skips clarify/test as expected.
- Installed prompt task-code renders no unresolved host/capability template and includes a Language section.

## Confirmed defects under repair
1. update success/rollback/npm messages name Claude Code under Codex.
2. Codex MCP idempotency falls through to the manifest's Claude shell check. Tavily was reported already-installed but codex mcp list contains only Exa.
3. setup exits 0 even when a base upstream failed.
4. setup's missing-key tail points Codex users at Claude settings (doctor hint was already host-aware).
5. planning-with-files and ui-ux-pro-max are installed as Codex skills but capability presence metadata still declares Claude plugins.

## Upstream/environment limitations
- gstack latest source (514fbfdc9799376edfd2536f60659501a48ead64) fails its own Windows setup during a staged directory rename at gstack-design-consultation (Permission denied); only a partial prefix set exists.
- Current process groups do not match the inspected inherited Deny SID. Empty-directory creation/rename under ~/.codex/skills succeeds. No ACL changes were made; concrete locking cause remains unverified.
- EXA_API_KEY and TAVILY_API_KEY are absent from this process environment. Credential values and credential-bearing configuration files were not read.
- Missing keys and unsupported Claude-only capabilities must not be presented as successful functional acceptance.
- playwright-cli skill is readable, but a playwright-cli executable is not on PATH; the base manifest installs a skill rather than the browser runtime.

## Deeper upstream checks and repairs
- GSD indicator directories were real empty directories: 66 shared gsd-* directories, only eight with SKILL.md. gsd-plan-phase/gsd-progress were empty. Directory-only indicators caused a false already-installed result.
- Ran official @opengsd/gsd-core installer 1.18.0 with --codex --global --no-legacy-cleanup. It now exposes 72/72 shared GSD skill files; gsd-tools runtime-identity returns package version 1.18.0.
- GSD 1.18.0 installs Codex skills under ~/.agents/skills, not the manifest's older ~/.codex/skills-only verify path. The manifest verification needs compatibility with both layouts.
- The GSD installer reports 80 unreplaced .claude references in 42 upstream assets. This upstream warning was not suppressed.
- Installed UI/UX helper search.py returned three real products.csv results successfully.

## Fresh installed acceptance evidence
- Final command: node scripts/codex-live/installed-acceptance.mjs; exit 0, RESULT PASS 5/5.
- Evidence: ee12e278-c437-4a60-88b5-d19534c56a79/report.json.
- Fresh Codex hook turn returned a random next sentinel absent from its prompt, with zero model tool calls (9576ms).
- Invalid completion result blocked with exit 1 and pending state preserved. Correct promise completed with exit 0; evidence_status remained none_declared (not artifact verification).
- Overlong STATE returned Codex JSON deny, while non-commit control returned silent pass.
- Role turn completed one spawn/wait/close (22405ms). The requested agent_type was harnessed-task-code, but Codex JSON does not independently expose the selected role name; do not overclaim role identity from this stream.

## Final MCP runtime results (supersede key-only inference)
- Patched source installer installed Tavily correctly; both tavily-mcp and exa-mcp are now registered/enabled in the real Codex config.
- Official MCP SDK initialization and tools/list succeeded for both installed package ranges.
- Real Exa web_search_exa returned isError=true and 401 requiring EXA_API_KEY.
- Real Tavily tavily_search returned isError=false and actual search results despite this process not exposing TAVILY_API_KEY. Its credential source remains unverified; no secret lookup was attempted.
- Codex app-server mcpServerStatus/list reported Exa 3.4.2 and Tavily 0.2.22 with tool schemas and toolsError=null.
- Fresh Codex headless discovery/search attempts reached tavily-mcp but returned: MCP tool call requires approval, but approval policy is never.
- Kept safety settings unchanged. Codex-specific setup/doctor hints now describe process-env visibility, not guaranteed query failure.
