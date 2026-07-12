---
phase: 3
version: 3.5.0
title: Verify + Ship v3.5.0
status: ready-for-review
created: 2026-05-25
depends_on: Phase 1 (landed eb60722) + Phase 2 (TBD)
sister_cadence: v3.4.4 Phase 6 release (650b7f6)
estimated_loc: ~30-50 LOC (CHANGELOG finalize + version bump)
estimated_commits: 2 (CHANGELOG finalize + release version bump)
---

# v3.5.0 Phase 3 — Verify + Ship

## Goal (one sentence)

把 v3.5.0 (P0 cleanup + Option 1-Lite escalation) ship 到 npm registry + GitHub release,带 provenance attestation + sigstore TLOG。

## Why

v3.5.0 已包含两个独立交付:
1. **Phase 1 P0 sweep** (landed eb60722) — workflows/ 完全 self-contained
2. **Phase 2 Option 1-Lite escalation** (待 Phase 2 ship) — signal-driven Agent Teams hint

需要按 sister v3.4.4 Phase 6 cadence ship 出去,触发 GitHub Actions publish.yml 自动 npm publish。

## Pre-conditions (hard gates,任一 fail → 不允许 ship)

- [ ] Phase 1 commits landed (`dcc8469`, `3ccc1f1`, `2fa4b1e`, `eb60722`) ✓ verified
- [ ] Phase 2 commits landed (4 commits Wave 1-4)
- [ ] `pnpm build` 0 red
- [ ] `corepack pnpm test` ≥1092 pass (1087 baseline + 5 Phase 2 new cells) / 5 skip / 1 todo
- [ ] `grep -r "~/.claude" workflows/` = 0 命中 (Phase 1 gate maintained)
- [ ] `pnpm pack --dry-run` tarball 解压 grep workflows/ ~/.claude = 0
- [ ] 主分支 working tree clean (`git status --porcelain` 空)
- [ ] 本地 `main` HEAD == `origin/main` HEAD (no untracked release-blocking commits)

---

## Wave 切分 (2 commits + 1 tag + 1 push)

### Wave 1 — CHANGELOG finalize

**Background**: v3.4.4 CHANGELOG entry (L10) 当前仍标 "(Unreleased)" — release commit 650b7f6 仅 bump 了 package.json,未 finalize CHANGELOG date。这是 v3.4.4 ship 时的疏漏,本 Phase 3 一并 fix。

**Action**:
1. **Fix v3.4.4 (Unreleased) → release date**:
   ```diff
   - ## 3.4.4 (Unreleased)
   + ## [3.4.4] - 2026-05-24
   ```
   (release date from `git log -1 650b7f6 --format=%cI` = 2026-05-24)

2. **Add v3.5.0 section** (insert above v3.4.4):

   ```markdown
   ## 3.5.0 (Unreleased)

   ### Phase 1 — P0 private-file reference sweep

   - **workflows**: stripped all `~/.claude/CLAUDE.md` / `~/.claude/rules/*.md` / `~/.claude/plugins/cache/.../X.Y.Z` / `~/.claude/settings.json` references from `workflows/` (65 files, ~150 hits across capabilities.yaml + 7 disciplines yaml + 8 judgments yaml + 25 sub-workflow SKILL.md + workflow.yaml + role-prompts.yaml). `npm install harnessed` now ships a self-contained package with zero references to maintainer's private home-directory files. **Net delta**: -48 LOC (mainly References-bullet deletions in SKILL.md). **Hard gate verified**: `grep -r "~/.claude" workflows/` = 0 hits.
   - **capabilities**: dropped `planning-with-files.plugin_path` field (runtime not consumed; environment-specific). Description fields cleaned of `(per ~/.claude/rules/X.md L*)` source-citation tails (maintainer index belongs in ADRs, not shipped yaml).
   - **disciplines + judgments**: yaml header comments rewritten to self-contained descriptions (no `~/.claude/CLAUDE.md` 节 references). `language.yaml` `check_method` field switched from `~/.claude/settings.json` path to `env.HARNESSED_USER_LANG` (env-var consistency).
   - **SKILL.md**: References sections stripped of `~/.claude/*` bullets (~30 occurrences across 25 sub-workflows). Plugin-path mentions replaced with install guidance ("Requires X plugin via Claude Code plugin marketplace"). `harnessed setup` slash-command sister references rewritten with `<claude-home>/commands/<x>.md` placeholders.
   - **regression**: Zero user-facing — yaml schema unchanged, runtime dispatcher unchanged, all 1087 tests pass. v3.4.4 capability cmd resolution paths preserved verbatim (only descriptive metadata stripped).

   ### Phase 2 — Option 1-Lite signal-driven Agent Teams escalation

   - **runtime**: `buildAgentDef` (src/workflow/run.ts) now injects 5-trigger natural-language escalation rules into spawned subagent prompts via `criticalSystemReminder_EXPERIMENTAL` field (piped through `sdkReconcile.ts:54-56`). Spawned subagent identifies any of `parallelism-gate.yaml agent-teams-upgrade.fires_when` 5 triggers (teammate_send_message_needed / subagent_context_overflow / shared_task_list / opposing_hypothesis_debate / fullstack_three_way) and signals via `structured_output.needs_teams_escalation: true + escalation_reason`.
   - **schema**: `COMPLETION_SCHEMA` (src/workflow/lib/completionSchema.ts) extended with optional `needs_teams_escalation` (boolean) + `escalation_reason` (string) fields. `SdkResultEnvelope` interface updated. Absent fields default to no-escalation (backward compatible).
   - **runtime**: `_dispatchSkillStub.fn` (src/workflow/run.ts) parses escalation signal from envelope. `DispatchStubResult` extended with `needsTeamsEscalation` + `escalationReason` optional fields. `runWorkflow` main loop emits stderr hint when escalation fires (informational only; phase continues normally; user decides whether to open Agent Teams in main Claude Code session).
   - **why this design (spike)**: SDK v0.3.142 `ToolInputSchemas` union (sdk-tools.d.ts:11-36) does NOT expose `TeamCreate` / `SendMessage` / `TeamDelete` to subagents spawned via `query()`. The original prompt-driven plan ("spawned Claude self-executes TeamCreate") is physically impossible; this Lite version is the honest fallback: spawned subagent identifies + signals, user/main session executes.
   - **prompt budget**: ESCALATION_RULES constant adds ~320 tokens per spawn (single-shot insertion into critical reminder section). Acceptable overhead.
   - **regression**: Zero user-facing for non-escalating tasks. Tasks that fire any of the 5 triggers now print stderr advisory; no exit-code change, no phase-skip change.

   ### Phase 3 — Verify + ship

   - **release**: Tag `v3.5.0` pushed; GitHub Actions `publish.yml` auto-triggered npm publish with `--provenance` (sigstore rekor TLOG attestation per supply-chain hardening pattern延袭 since v3.4.x).
   - **package**: tarball verified `~/.claude` 0 hits in `workflows/` after pack; net package size delta ~-2 KB from Phase 1 deletions.
   - **CHANGELOG**: this entry + retroactive `## [3.4.4] - 2026-05-24` finalize (release-time omission backfilled).
   ```

3. **Commit**: `docs(changelog): v3.5.0 finalize sections + backfill v3.4.4 release date`

**LOC**: ~50 (mostly new CHANGELOG section text)

### Wave 2 — Version bump + release tag

**Action**:
1. **Bump `package.json` version**:
   ```diff
   - "version": "3.4.4",
   + "version": "3.5.0",
   ```

2. **Commit**: `release: v3.5.0` (sister `650b7f6 release: v3.4.4` verbatim cadence)

3. **Tag**: `git tag v3.5.0 -m "v3.5.0 — P0 private-file sweep + Option 1-Lite Agent Teams escalation"`

4. **Push tag (REQUIRES USER APPROVAL — destructive action visible to others)**:
   ```bash
   git push origin main
   git push origin v3.5.0
   ```

   **Tag push triggers GitHub Actions `publish.yml`** → npm publish with provenance.

**LOC**: 1 (version bump line)

---

## Post-publish verify (Wave 3 — verify-only, no commit)

After GitHub Actions completes (~3-5 min):

1. **GitHub Actions run status**:
   ```bash
   gh run list --workflow=publish.yml --limit 1
   gh run view <run-id>
   ```
   Expected: green ✓ (sister v3.4.4 ran 26365674994 with rekor transient retry; if same TLS error → `gh run rerun <id>`)

2. **npm registry check**:
   ```bash
   npm view harnessed@3.5.0 version
   npm view harnessed@3.5.0 dist.tarball
   ```
   Expected: `3.5.0` + tarball URL exists

3. **Provenance verify**:
   ```bash
   npm view harnessed@3.5.0 --json | jq .repository
   # check provenance attestation visible on https://www.npmjs.com/package/harnessed?activeTab=provenance
   ```

4. **Live install smoke test** (fresh tmp dir):
   ```bash
   cd /tmp/harnessed-test-3.5.0
   npm install -g harnessed@3.5.0
   harnessed --version
   # Expected: 3.5.0
   grep -r "~/.claude" $(npm root -g)/harnessed/workflows/ | wc -l
   # Expected: 0
   ```

5. **GitHub release page**:
   ```bash
   gh release view v3.5.0
   ```
   If release page is empty, create via:
   ```bash
   gh release create v3.5.0 --title "v3.5.0 — P0 sweep + Option 1-Lite escalation" \
     --notes "$(awk '/## 3.5.0/,/## 3.4.4/' CHANGELOG.md | head -n -1)"
   ```

---

## 灰区 (实施 subagent / 主 session 遇到必须停)

1. **CHANGELOG v3.4.4 backfill date 与 git log 不一致** (e.g., 650b7f6 实际 commit date 与预期 release date 不同) → return with `git log -1 650b7f6 --format=%cI` 结果让我决定写哪个日期
2. **publish.yml CI 红 (sister v3.4.4 sigstore rekor transient TLS error)** → 跑 `gh run rerun <id>` 一次;若仍红 → return 完整 log 让我诊断
3. **npm publish E404 / E403 / OTP required** → return,不要自决重试 (npm OIDC 失败 fallback NPM_TOKEN 已配,但 OTP 路径需用户交互)
4. **`harnessed --version` show 3.4.4 not 3.5.0 after fresh install** → 可能 npm CDN 缓存延迟 (5-30 分钟);return + 告诉用户等
5. **任何 push 操作失败 / 需要 force-push** → 立即 return,**绝不 force-push**
6. **`git status` not clean before Wave 2** → return,询问是否要 stash / commit pending changes

---

## Sister 文件参考

- `D:/GitCode/harnessed/.github/workflows/publish.yml` — auto-trigger 流程
- `D:/GitCode/harnessed/CHANGELOG.md` — release notes 主目标
- `D:/GitCode/harnessed/package.json` — version bump 主目标
- `git show 650b7f6` — sister v3.4.4 release commit pattern

---

## Acceptance criteria (Phase 3 完成判据)

- [ ] Wave 1 commit landed: CHANGELOG v3.5.0 三段 (Phase 1 + 2 + 3) + v3.4.4 date 回填
- [ ] Wave 2 commit landed: package.json 3.4.4 → 3.5.0
- [ ] Tag `v3.5.0` 创建 (local)
- [ ] User-approved push: `git push origin main` + `git push origin v3.5.0`
- [ ] GitHub Actions publish.yml run green (sigstore rekor TLOG attestation success)
- [ ] `npm view harnessed@3.5.0 version` returns `3.5.0`
- [ ] Provenance badge visible on npmjs.com package page
- [ ] Fresh install smoke test: `grep -r "~/.claude" $(npm root -g)/harnessed/workflows/` = 0 命中
- [ ] GitHub release v3.5.0 page populated with CHANGELOG section

完成后状态: v3.5.0 shipped。`.planning/STATE.md` 更新到下一 milestone (v3.5.1 or v3.6.0 TBD)。

---

## Risk + rollback

- **Risk 1**: tag push 触发 publish.yml 后 publish 失败 (TLS / OTP / E404)
  - **Mitigation**: GitHub Actions `gh run rerun` 重试通常解 transient TLS;OTP/E404 需用户介入
  - **Worst case**: 删除 tag + 重 tag + 重 push (`git tag -d v3.5.0 && git push origin :refs/tags/v3.5.0 && git tag v3.5.0 && git push origin v3.5.0`) — 不丢代码,仅 tag 移位
- **Risk 2**: npm 已 publish 但 CHANGELOG / GitHub release 没同步
  - **Mitigation**: post-publish step 5 补 `gh release create`;不影响 npm 已 published 包
- **Risk 3**: 发现 v3.5.0 ship 后真有 BLOCKER bug
  - **Mitigation**: v3.5.1 patch fix (sister v3.4.4 ship 后 9 baseline test 修法 cadence);**绝不 npm unpublish** (24h 锁)

- **Rollback**: 2 atomic commits;tag 可重移 (见 Risk 1 worst case)。Phase 1 / Phase 2 commits 独立于 Phase 3,任何 ship 失败不影响代码 commit。

---

*Spec written 2026-05-25 by main session per v3.4.4 Phase 6 sister cadence.*
*Approval gate: Phase 2 完成 → user review this spec → ack → main session executes (NOT spawning subagent — ship 涉及 push + GitHub Actions,主 session 直接做更合适).*
