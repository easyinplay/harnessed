---
phase: 5
version: 3.6.0
title: Verify + Ship v3.6.0
status: ready-for-review
created: 2026-05-25
depends_on: Phase 1-4 all landed
sister_cadence: v3.5.0 Phase 3 (release 9c28848)
estimated_loc: ~12 (version bump + package.json files +1 + CHANGELOG header)
estimated_commits: 3 (packaging fix THIRD-PARTY-NOTICES / CHANGELOG header finalize / release version bump)
---

# v3.6.0 Phase 5 — Verify + Ship

## Goal (one sentence)

把 v3.6.0(mattpocock methodology inline + doctor 第三方检测 + 澄清运行时检测 + Agent Teams 防呆 inject)ship 到 npm registry + GitHub release,带 provenance attestation + sigstore TLOG。

## Pre-conditions (hard gates,任一 fail → 不允许 ship)

- [ ] Phase 1 commits landed (4 wave + 1 vendor chore commit)
- [ ] Phase 2 commits landed (4 wave)
- [ ] Phase 3 commits landed (4 wave)
- [ ] Phase 4 commits landed (3 wave)
- [ ] `corepack pnpm build` 0 红
- [ ] `corepack pnpm test` baseline + 全 Phase 1-4 cumulative cells pass
- [ ] `grep -r "~/.claude" workflows/` = 0 命中 (v3.5.0 Phase 1 hard gate maintained)
- [ ] CHANGELOG v3.6.0 4 sections 全部 landed(各 Phase wave 4 commit 加)
- [ ] 主分支 working tree clean(`git status --porcelain` 空,允许 untracked `.planning/`)
- [ ] 本地 `main` HEAD == `origin/main` HEAD

---

## Wave 切分 (3 commits + 1 tag + 1 push)

### Wave 0 — Packaging fix (THIRD-PARTY-NOTICES.md ship)

**Background** (added 2026-05-25 from Phase 1 subagent NEEDS_CLARIFICATION feedback):

Phase 1 subagent identified that `THIRD-PARTY-NOTICES.md` was created at repo root (per Phase 1 SPEC D4) but **NOT added to `package.json` "files" array** → npm tarball doesn't ship the aggregator NOTICES file. Inline attribution in `workflows/role-prompts.yaml` (header + 3 inline comments + SHA pin) already satisfies MIT literal requirements (paraphrased excerpts only, not substantial portions). However, aggregator NOTICES is industry best practice — defer to Phase 5 packaging scope.

**Action**:
1. Edit `package.json` `"files"` array — add `"THIRD-PARTY-NOTICES.md"` between `"NOTICE"` and end of array (or sorted alphabetically — match existing convention)
2. Verify `pnpm pack --dry-run` tarball contents now include `package/THIRD-PARTY-NOTICES.md` (use `tar -tzf` to confirm)

**LOC**: 1

**Commit**: `chore(packaging): v3.6.0 ship THIRD-PARTY-NOTICES.md via package.json files (MIT compliance — mattpocock paraphrased excerpts aggregator)`

### Wave 1 — CHANGELOG header finalize

**Action**:
1. **Fix v3.6.0 header** `## 3.6.0 (Unreleased)` → `## [3.6.0] - 2026-05-25`(或 release commit date — verify when ship)
2. (Sister v3.5.0 cycle 提醒:Phase 2 subagent 可能误改 header,需要 cleanup 同 v3.5.0 Phase 3 Wave 1 pattern;若 Phase 2-4 subagent commit 时 header 已乱,这里一并 fix)

**LOC**: ~2 (header line edit)

**Commit**: `docs(changelog): v3.6.0 release date finalize`

### Wave 2 — Version bump + release tag

**Action**:
1. Bump `package.json` `"version": "3.5.0"` → `"3.6.0"`
2. **Commit**: `release: v3.6.0`(sister `9c28848 release: v3.5.0` verbatim cadence)
3. **Tag**: `git tag v3.6.0 -m "v3.6.0 — mattpocock methodology inline + doctor 第三方检测 + 澄清运行时检测 + Agent Teams prevention inject"`
4. **Push (REQUIRES USER APPROVAL)**:
   ```bash
   git push origin main
   git push origin v3.6.0
   ```
   Tag push triggers GitHub Actions `publish.yml` → npm publish with provenance.

**LOC**: 1

---

## Post-publish verify (Wave 3 — verify-only,no commit)

After GitHub Actions completes (~3-5 min):

1. **GitHub Actions status**:
   ```bash
   gh run list --workflow=publish.yml --limit 1
   gh run view <run-id>
   ```
   Expected: green ✓(sister v3.5.0 run 26369634577 31s 成功;若 sigstore rekor transient TLS retry → `gh run rerun <id>`)

2. **npm registry check**:
   ```bash
   npm view harnessed@3.6.0 version dist.tarball
   ```
   Expected: `3.6.0` + tarball URL

3. **Provenance**:
   ```bash
   npm view harnessed@3.6.0 --json | jq .repository
   ```
   验证 provenance attestation 在 https://www.npmjs.com/package/harnessed?activeTab=provenance

4. **Live install smoke test**:
   ```bash
   ROOT=$(npm root -g)
   npm install -g harnessed@3.6.0
   harnessed --version  # expect 3.6.0
   grep -r "~/.claude" "$ROOT/harnessed/workflows/" | wc -l  # expect 0 (Phase 1 v3.5.0 hard gate)
   harnessed doctor --json | jq '.checks | length'  # expect 12 (Phase 2 doctor 12 checks)
   ```

5. **GitHub release page**:
   ```bash
   gh release view v3.6.0
   ```
   若空,create via:
   ```bash
   gh release create v3.6.0 --title "v3.6.0 — mattpocock methodology inline + doctor + clarification runtime + Agent Teams prevention" \
     --notes-file <(awk '/## \[3.6.0\]/,/## \[3.5.0\]/' CHANGELOG.md | head -n -1)
   ```

---

## 灰区 (实施 / 主 session 遇到必须停)

1. **CHANGELOG v3.6.0 header missing 或 Phase N sections 不全** → return,问哪个 Phase 没 finalize CHANGELOG section
2. **publish.yml CI 红**(sigstore rekor transient)→ `gh run rerun <id>` 一次;若仍红 → return 完整 log
3. **`harnessed doctor` 显示 not 12 checks**(可能 Phase 2 实施时 check count drift)→ return,verify Phase 2 实施
4. **npm publish E404 / E403 / OTP required** → return,**不自决重试**
5. **`harnessed --version` show 3.5.0 not 3.6.0 after fresh install** → npm CDN cache 延迟(5-30 min),等 + verify
6. **任何 push 操作失败 / 需 force-push** → 立即 return,**绝不 force-push**
7. **`git status` not clean before Wave 2** → return,询问是否要 stash / commit pending changes

---

## Sister 文件参考

- `D:/GitCode/harnessed/.planning/v3.5.0/PHASE-3-SPEC.md` — sister ship cycle template
- `D:/GitCode/harnessed/.github/workflows/publish.yml` — auto-trigger 流程
- `D:/GitCode/harnessed/CHANGELOG.md` — release notes 目标
- `D:/GitCode/harnessed/package.json` — version bump 目标
- `git show 9c28848` — sister v3.5.0 release commit pattern

---

## Acceptance criteria

- [ ] Wave 1: CHANGELOG `## [3.6.0] - 2026-05-25` header finalized
- [ ] Wave 2: package.json 3.5.0 → 3.6.0
- [ ] Tag `v3.6.0` 创建 + user-approved push
- [ ] GitHub Actions publish.yml run green
- [ ] `npm view harnessed@3.6.0 version` returns `3.6.0`
- [ ] Provenance badge visible
- [ ] Fresh install: `grep -r "~/.claude" $(npm root -g)/harnessed/workflows/` = 0
- [ ] Fresh install: `harnessed doctor --json | jq '.checks | length'` = 12
- [ ] GitHub release v3.6.0 page populated

---

## Risk + rollback

- **Risk 1**: tag push triggers publish.yml failure(sister v3.5.0 cycle 有 sigstore rekor transient)
  - **Mitigation**: `gh run rerun`;worst case 删除 tag + 重 tag + 重 push
- **Risk 2**: npm publish 成功但 CHANGELOG / GitHub release 没同步
  - **Mitigation**: Step 5 补 `gh release create`
- **Risk 3**: 发现 ship 后真有 BLOCKER bug
  - **Mitigation**: v3.6.1 patch fix;**绝不 npm unpublish**(24h 锁)

- **Rollback**: 2 atomic commits;tag 可移(`git tag -d v3.6.0 && git push origin :refs/tags/v3.6.0 && git tag v3.6.0 && git push origin v3.6.0`)。Phase 1-4 commits 独立于 Phase 5,任何 ship 失败不影响代码 commit。

---

*Spec written 2026-05-25 by main session per v3.5.0 Phase 3 sister ship cadence.*
*Approval gate: Phase 1-4 完成 → user review this spec → ack → main session executes (NOT spawning subagent — ship 涉及 push + GitHub Actions,主 session 直接做).*
