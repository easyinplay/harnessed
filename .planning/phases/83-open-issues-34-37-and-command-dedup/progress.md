# Phase 83 Progress

## 2026-11-01

- Triaged the four newly filed issues #34-#37 against the current `main` (v5.0.7, commit `742e111`).
- Measured the local install: compiled binary channel, version **4.49.2**, npm latest 5.0.7.
- Root-caused the duplicate slash command: 26 stale `~/.claude/commands/*.md` files from the
  v3.4.4 command-file era coexist with the same 26 workflow skills, and the local 4.49.2 binary
  predates `legacyCommandCleanup.ts`, so nothing ever removed them.
- Root-caused #35: `refreshOwnedUpdate()` already does every repair the duplicate needs, but it is
  wired only into the npm channel continuation, never into the compiled binary path.
- Wrote `task_plan.md` with four disjoint workstreams (W1 #34, W2 #35, W3 #36, W4 #37) and
  `findings.md` with F1-F6.
- Checked the #34 network premise from this host: `api.github.com`, `github.com` and the npm
  registry all answered 200, so the fix is justified by host-independence rather than a local repro.

## 2026-11-02

- W1 #34 — **complete**. `resolveLatestRelease` now returns the api.github.com asset endpoint as the
  primary download URL (same host as the metadata hop) with `browser_download_url` kept as fallback;
  `.sha256.sig` resolves as its OWN release asset; transient network failures retry (3 attempts,
  no retry on 4xx); the failure message names the release, the tried URL, `npm i -g harnessed@latest`
  and `HARNESSED_UPDATE_SOURCE_DIR`.
  New: `src/cli/lib/selfUpdateBinary.ts` + `tests/cli/lib/selfUpdateBinary-issue34.test.ts` (7 tests).
- W2 #35 — **complete**. Root cause: `refreshOwnedUpdate()` already performs all three repairs
  (refresh workflow skills, re-register owned hooks, `removeLegacyClaudeCommands`) but was wired
  only into the npm `--update-continuation` handover; the plain compiled `harnessed update` path
  stopped after the binary swap. Fix: the OLD binary hands the refresh to the NEW binary
  (the NEW binary owns the NEW assets `<stateRoot>/assets/<newVersion>`) by spawning `execPath`
  with the hidden internal flag `--internal-owned-refresh`; the NEW binary runs the refresh and
  exits 0/1. Fail-soft: a failed handover prints `harnessed setup` as the next step and never
  changes the update's exit code.
  New: `src/cli/lib/ownedRefresh.ts`, `src/cli/lib/ownedRefreshFlag.ts`,
  `tests/cli/lib/ownedRefresh.test.ts` (9 tests).
  Changed: `src/cli.ts` (internal entry point, NOT a public command — the CLI surface contract
  pins 32 public commands + 11 README locales), `src/cli/update.ts` (compiled `updated` branch),
  `tests/cli/update.test.ts` (expects the handover + the new stdout line).
- W3 #36 — **complete**. `harnessedHookTeardown.ts` gained a version-agnostic first-party
  registration identity (`harnessedHookRegistrations`); `ccHookAdd.ts` counts a stale
  `assets/<oldVersion>/…` entry as OURS so it is collapsed into the single current entry instead of
  duplicating it; `refreshOwnedUpdate.ts` now skips a hook only when there is NO first-party
  registration of it at all (a stale one is re-installed so it migrates); `gc.ts` keeps an
  `assets/<version>` directory that the host `settings.json` still references (fail-soft on an
  unreadable settings.json, both call sites benefit with no change); `check-stale-hooks.ts` points
  at `harnessed setup` / `harnessed update` for a version-stale hook and keeps the uninstall advice
  for a genuinely orphaned entry.
  New: `tests/installers/issue36-hook-identity.test.ts`; changed: `tests/installers/ccHookAdd.test.ts`,
  `tests/cli/gc-compiled.test.ts`, `tests/cli/check-stale-hooks.test.ts`, `tests/unit/refresh-owned-update.test.ts`.
- W4 #37 — **complete**. The ownership-lock retry budget went from `{5, 25, 250}` (~0.6 s) to
  `{30, 250, 4000}` (exported as `INSTALL_OWNERSHIP_LOCK_RETRIES`), so a queued contender waits its
  turn instead of dying with `ELOCKED`; `installers/index.ts` classifies `ELOCKED` as its own
  `lock-contention` reason; `setup.ts` counts a lock-contention failure as a retryable warning
  ("re-run `harnessed setup` to finish them") and keeps exit 0, while every other failure kind
  still exits 1.
  New: `tests/installers/runInstallLockContention.test.ts`; changed: `tests/unit/installers-ownershipLock.test.ts`,
  `tests/cli/setup-failure-exit.test.ts`, `tests/integration/installer-contract.test.ts`,
  `tests/unit/uninstallers-declaredTeardown.test.ts` (mock factories gained the new helper export).
- **Local duplicate slash command — fixed on this machine.** All 26 `~/.claude/commands/*.md` files
  were harnessed-owned (verified with the repo's own `shouldOverwriteFile` rule) and were removed
  with the repo's own `removeLegacyClaudeCommands`; the files were first copied to
  `~/.claude/harnessed/backups/legacy-commands-20261102/` so the operation stays reversible.
  `~/.claude/commands/` is now empty and the 26 workflow skills (incl. `retro`) are intact, so the
  slash-command picker shows one `/retro` again.

## Status

- W1 #34 — complete
- W2 #35 — complete
- W3 #36 — complete
- W4 #37 — complete
- Local duplicate-command cleanup — complete
- Integration verification — **complete**: `tsc --noEmit` exit 0; `biome check src/ tests/` exit 0
  (1 pre-existing warning in the untouched `src/cli/facts.ts`); full `vitest run` 424 files passed /
  4 skipped, **5375 tests passed** / 43 skipped / 1 todo (baseline was 5273 — the four fixes add
  102); all 13 `scripts/check-*.mjs` CI gates exit 0; `git diff --check` exit 0.
- Commit + push — **complete**: `df202412` (the four fixes) + `d9d369a` (the lock-retry scope +
  the stale-state test) on remote `main`. CI `41366996735` (headSha `d9d369a`) passed **9/9**,
  `conclusion=success`. The previous commit's CI was red (`41185715671`) — see the follow-up section.
- Release — **complete**: `9ba5a6a` (chore(release): prepare v5.0.8) → CI `41388714691` 9/9 green →
  tag `v5.0.8` → publish run `41389215133` success (npm publish + 3 binary jobs). Verified: npm
  `dist-tags.latest` = **5.0.8** (queried from the registry directly, not the local cache),
  GitHub release `v5.0.8` with **9 assets** (3 binaries × [bin, .sha256, .sha256.sig]).
- Issues — **complete**: #34/#35/#36/#37 each got a verification comment and were closed.

## Live verification on this machine (after the release)

- `harnessed.exe update` → `[harnessed] updated 5.0.7 → 5.0.8` — the binary downloaded itself from
  the **api.github.com asset endpoint** (issue #34 end-to-end), sha256 + ed25519 verified.
- The handover line did NOT appear, and that is expected: the process that performed the swap was
  5.0.7, which predates the handover. The refresh can only be driven by the NEW binary, so the
  first upgrade onto the fixed version needs one explicit refresh; every later update does it
  automatically.
- `harnessed.exe --internal-owned-refresh` → `owned state refreshed (2 component(s):
  harnessed-workflows, update-reminder)`.
- `harnessed doctor` now reports `✓ workflow skill integrity — 34 installed workflow skill(s) match
  their install-time hash ledger` (it reported 5 MISSING skills before) and `✓ stale hooks — no
  orphaned harnessed hooks`. `~/.claude/commands/` is empty — the duplicate slash commands are gone.

## Follow-up found while watching CI (pre-existing main red)

The first push (`df202412`) turned CI red — but on a failure that was ALREADY red on the
previous commit (`742e111`, itself red since `cb990f8`): `tests/unit/installers-npxSkillInstaller.test.ts`
failed with `ENOENT: ... mkdir 'D:\tmp\fake-home\.claude\harnessed\.ownership.lock'` on all three OSes.
Cause: `cb990f8` put the npx skill installer behind `withInstallOwnershipLock`, and that test
mocks `node:fs/promises` with a no-op `mkdir` — so the state root is never created and
proper-lockfile cannot create the lock directory inside it. The test only passed on machines
where an earlier run had left `D:\tmp\fake-home` behind.

Two fixes:

1. `src/installers/lib/installOwnershipLock.ts` — the backoff now lives in our own loop and
   re-attempts ONLY `ELOCKED`. proper-lockfile's own `retries` option re-runs the attempt on ANY
   error, so the enlarged budget would have turned that ENOENT into a ~108 s stall per test
   instead of a fast failure.
2. `tests/unit/installers-npxSkillInstaller.test.ts` — the mock keeps the REAL `mkdir`, so the
   state root exists exactly as it does in production.

New: `tests/unit/installers-ownershipLock-retry.test.ts` (a non-contention failure is not retried;
contention is).

## End-to-end smoke of the #35 handover (isolated HOME)

`node dist/cli.mjs --internal-owned-refresh` against a throwaway home
(`HOME`/`USERPROFILE`/`CLAUDE_CONFIG_DIR` pointed at a temp dir):

- exit 0, `[harnessed] owned state refreshed (2 component(s): harnessed-workflows, update-reminder)`
- 34 workflow skill directories written, `settings.json` created with the owned hook registered
- a seeded legacy command file carrying `<!-- harnessed-generated:v3.4.4 -->` was REMOVED, while a
  user-authored command file in the same directory was left untouched

That is the duplicate-slash-command repair running through the shipped code path.

## 2026-11-02 (late) — follow-up defect from the live codex-host install

The user pasted a real `install.ps1` run on the codex host: v5.0.8 installed, but
`harnessed setup` exited 1, so `install.ps1` threw a PowerShell exception.

Diagnosis: 3 REAL component failures + 3 FALSE ones.

- gstack — the upstream lease was held by a live process; re-run `harnessed setup` when no
  gstack process is running.
- planning-with-files — ownership refusal from the in-flight ownership-guard work
  (`cb990f8`); the shared skill's ownership could not be proven, so the install declined
  to replace it.
- playwright-cli — the pinned-version verify failed because the L4 install was declined.

The 3 false failures were ours: `src/cli/setup.ts` → `isCommandFailureWarning()` counted
`no role-prompts.yaml entry for '<workflow>'` (an expected skip, already treated as such by
the update path) as a component failure. Fixed (F9); the skip stays a visible warning, an
unrenderable or unwritable command still fails. Regression test added to
`tests/cli/setup-failure-exit.test.ts`.

Also cleared the two `tests/integration/update-cli-process.test.ts` failures: both came from a
stale `dist/cli.mjs` built before the 5.0.8 version bump (F10). After `pnpm build` the file is
39/39 green.

## 2026-11-02 — fix shipped as v5.0.9

- Fix commit `91ec691` (`fix(setup): stop counting an expected command skip as a failed
  component`) pushed to `main`; CI `41392546250` passed.
- Release prep `f7b04d4` (`chore(release): prepare v5.0.9`: version bump + `CHANGELOG.md`
  `## [5.0.9]` section + regenerated `bin/` artifacts); CI `41416432147` passed 9/9.
- Tag `v5.0.9` pushed → publish run `41417121623` success (npm publish + 3 binary jobs).
- Verified: npm registry `dist-tags.latest` = **5.0.9** (queried from the registry, not the local
  cache), GitHub release `v5.0.9` with **9 assets** (3 binaries × [bin, .sha256, .sha256.sig]).
- Local gate status before the release commit: `tsc --noEmit` exit 0, Biome clean on the changed
  files, `tests/cli tests/unit tests/integration` = 3568 passed / 1 flaky-failed
  (`tests/unit/update-lock.test.ts`, an `EPERM` rename in the Windows temp dir — 22/22 green in
  isolation, unrelated to this change), all 12 `scripts/check-*.mjs` gates exit 0.

Open, not ours to close here: the three real component failures of the user's codex-host install
(gstack upstream lease held by a live process, planning-with-files ownership refusal from the
in-flight ownership-guard work, playwright-cli pinned-version verify against a declined L4
install).

### Live verification of the #35 handover (5.0.8 → 5.0.9)

`harnessed update` on this machine: `[harnessed] updated 5.0.8 → 5.0.9` followed by
`[harnessed] refreshed workflow skills + hooks for 5.0.9 (owned state re-synced)`. This is the
FIRST live run of the handover — the earlier 5.0.7 → 5.0.8 jump could not print it because the
5.0.7 binary predates the fix. After the update: `harnessed --version` = 5.0.9, doctor reports
`✓ workflow skill integrity — 34 installed workflow skill(s) match their install-time hash
ledger`, `✓ update — up to date (5.0.9)`, `✓ stale hooks — no orphaned harnessed hooks`.

`harnessed doctor --host codex` on the codex host is clean apart from warnings (origin URL, token
budget, MCP key visibility, codex hook trust for `update-reminder`); the codex host binary is
still 5.0.8 and needs the 5.0.9 install to pick up the setup fix.

## 2026-11-02 — codex-host install re-run with v5.0.9

`install.ps1` re-run (binary 5.0.9) plus `harnessed setup --platform codex` — the fix is
visible in the real run: the three `[A.6] no role-prompts.yaml entry` skips are warnings only
and the summary reads `0 setup` failures (`3 base, 0 optional, 0 setup`). Before the fix the
same three skips were counted as failed components, which is what made the install exit 1.

Two of the three genuine failures were then closed on the machine:

- **gstack Codex lease** — `gstack-lease: the lease directory is locked by live process ;`
  with an EMPTY owner: nobody held the lock. `bin/gstack-lease` locks with a `ln -s` symlink
  (`$DIR/.lock`), and this host's Git Bash cannot create symlinks (Developer Mode is enabled
  in the registry but the user is not in the Developers group and the process is not elevated;
  `New-Item -ItemType SymbolicLink` → "Administrator privilege required for this operation").
  Fix: `MSYS=winsymlinks:lnk` (written to the Windows user environment). Measured: `ln -s`
  creates `.lock.lnk`, `readlink .lock` returns the owner string, a second `ln -s` fails with
  "File exists" — the lock protocol is intact, not bypassed — and `gstack-lease touch`/`list`
  exit 0. gstack then reports `already-installed`.
- **playwright-cli** — the host had `@playwright/cli@0.1.23` while
  `manifests/tools/playwright-cli.yaml` pins `0.1.22` (exact match in `npm_version`,
  `idempotent_check` and the verify script), so the verify failed with
  "Expected playwright-cli 0.1.22". `harnessed setup --system` does NOT downgrade it: the
  component is already in harnessed's ledger, so the run verifies instead of installing.
  Installed the pinned version on the machine
  (`npm install -g @playwright/cli@0.1.22` + `playwright-cli install-browser chromium`).

Remaining: **planning-with-files** — `Existing shared skill source or external write footprint
is unproven; refusing replacement.` The skill itself is intact
(`~/.agents/skills/planning-with-files/` with SKILL.md + scripts + templates) and `harnessed
status` lists `planning-with-files @ ^1.5.7 (installed 2026-10-23)`; the guard only refuses to
REPLACE it because its ownership cannot be proven. That is the in-flight manifest-ownership
work's territory (`src/installers/npmCli.ts`, `skillOwnershipReceipt.ts`, manifest schema) — not
duplicated here. Until it lands, the codex host's `harnessed setup` keeps exiting 1 for that one
component alone.

Evidence: `Upstream components: 0 installed / 13 already-installed / 0 skipped / 1 failed`,
`setup incomplete - 34 workflow(s) installed; 13 base component(s) configured; 1 component(s)
failed (1 base, 0 optional, 0 setup)`, `harnessed doctor --host codex` → all checks ok (with
warnings).

## Two further defects found while repairing the codex host

**1. The `BREAK-LOOP` directive named a skill harnessed never ships.** A codex agent reported
"当前工作流要求连续失败后先执行 break-loop，但技能目录及插件缓存中未找到该技能" and stopped the
workflow. `break-loop` exists nowhere: not in `workflows/`, not in the installed skill dirs of
either host, not in the plugin cache. The G6 commit `7314aa1` added only the detector
(`src/checkpoint/breakLoop.ts`) and the message text — its own comment pointed at a skill doc
that was never written ("Trellis break-loop analog"). The stop rule actually lives in the shipped
workflow docs (`workflows/task/SKILL.md`, `workflows/verify/*/SKILL.md`: "任一触发即 STOP ——
重新收敛范围、修掉阻塞点或上报用户"), and both hosts have those installed. Fix: the three runtime
messages (`src/checkpoint/injectState.ts`, `src/cli/checkpoint.ts` × 2) now state the action
instead of naming a skill, and the stale comment was corrected. Regression: the inject-state test
asserts the directive carries no `break-loop skill` reference and does carry the stop rule.

**2. `playwright-cli` was the only npm component pinned to one exact version.** Survey of every
manifest: `webapp-testing ^1.7.4`, `tavily-mcp ^0.2.0`, `playwright-test ^1.5.25`,
`exa-mcp ^3.2.0`, `ctx7 ^0.5.0`, `planning-with-files ^1.5.7`, `mattpocock-skills ^1.5.7`,
`gsd ^1.7.0`, `codegraph ^1.0.0` — all ranges; `playwright-cli` alone was `"0.1.22"` with an
exact-equality `idempotent_check` AND an exact-equality assert inside verify. That is what turned
a host carrying 0.1.23 into a red component. Measured on this host: 0.1.23 satisfies every
capability assertion of the verify script (version → Chromium metadata → the @playwright/cli
reference), so only the exact-equality assert was wrong. Fix: `npm_version: ^0.1.22`, install
`npm install -g "@playwright/cli@^0.1.22"` (quoted so cmd.exe does not eat the caret), an
`idempotent_check` that accepts any 0.1.x patch ≥ 22, and a verify that asserts the same range
instead of one exact string. Contract tests updated: the range accepts 0.1.22 / 0.1.23 / 0.1.220,
and still rejects 0.1.21, 0.1.22-beta and 0.2.0.

Live proof with the local build (repo manifests, same host): `playwright-cli` moved from
`✗ failed` to `○ already-installed`; the only remaining failure is planning-with-files.

## v5.0.10 shipped (2026-11-02)

Both defects above went out in **v5.0.10**:

- `e8e5406` — the BREAK-LOOP directive fix (A + D: no dangling skill reference, the stop rule
  stated in the directive itself).
- `89f8864` — the playwright-cli range contract.
- `2fa1af5` — CHANGELOG + this record; `a0481b5` — `chore(release): prepare v5.0.10`
  (version bump + regenerated `bin/` artifacts + the biome formatting the previous CI run
  caught on `tests/integration/playwright-runtime-contract.test.ts`).

CI `41465517232` (a0481b5) passed 9/9 → tag `v5.0.10` → publish run `41467229953` success
(npm publish + 3 binary jobs). Verified from the registry, not the local cache:
`dist-tags.latest` = **5.0.10**, release `v5.0.10` with **9 assets**.

Live on this machine with the shipped binary: `harnessed update` → 5.0.9 → 5.0.10 with the
owned-state refresh; `harnessed setup --platform codex --system` → `playwright-cli` reports
`○ already-installed` (the host's 0.1.23 now satisfies the range) and the only remaining
failure is planning-with-files.

## 2026-11-03 stop-hook-recover 下线 + codex 宿主 planning-with-files 修复

两件事都进了 `main`，未发版（下一个 patch 是 v5.0.11）。

### 1. `stop-hook-recover` optional 组件彻底移除（`ec91eef`）

用户裁定：Claude Code 的「工具调用被当纯文本吐出」症状已消失，这个防御网不再需要，选
**彻底移除**（而非只下线 / 只撤出 offer）。

删除：manifest、`src/checkpoint/stopHookMain.ts`、`src/checkpoint/modeBDetect.ts`、
`src/cli/stopHookCmd.ts`（`harnessed stop-hook` 子命令）、生成产物
`bin/harnessed-stop-hook.mjs`，以及 `refreshOwnedUpdate` 的 owned 列表条目。
setup 的 optional 清单由 3 项变 2 项（chrome-devtools-mcp / ecc）。

**保留**：`COMPILED_HOOK_IDENTITIES` 里的 `stop-hook` 身份（仅识别用）。teardown 用这张表
判定「已存在的注册是不是我们的」，身份一删，`harnessed uninstall` 就摘不掉旧装机留下的
Stop 注册，doctor 也不再报残留 —— 旧注册仍在同一台机器上，就必须能被识别和清理。

**用户裁定（2026-11-03）**：该身份**保留 3 个月**（即到 2027-02-03），之后移除，移除动作
已列入 `TODOS.md`（含移除清单：hookEntry 身份项、teardown 的 legacy 形态字符串、
check-stale-hooks 引用、以 `harnessed-stop-hook.mjs` 为样本的测试断言，以及发版说明里
提醒旧装机手工清理 `Stop` 注册）。

### 2. codex 宿主 setup exit 1 根因与修复（`7a2f64a`）

用户贴的 install.ps1 日志显示 codex 宿主 setup 恒失败一个组件：
`planning-with-files` → `Existing shared skill source or external write footprint is
unproven; refusing replacement.` → setup exit 1 → 安装器抛 `setup failed (exit code 1)`。

根因不在 ownership 声明本身，而在**顺序**：`src/installers/npxSkillInstaller.ts` 的
拒绝分支在「是否已安装」判定**之前**：

```ts
if (ctx.hostContext && !singleSkill && !hasDeclaredTargets && !usesDeclaredOwnership)
  return unprovenSkillTarget(ctx)
```

`planning-with-files` 是唯一既没写 `--skill` 单选、也没声明 `installs_skills` 的
npx-skill-installer manifest → codex 上被无条件拒绝。而本机
`~/.agents/skills/planning-with-files/` 其实完整存在（SKILL.md / session-catchup.py /
三个 templates 都在，manifest 的 codex verify 也过），所以正确结论是 already-installed。

修法（manifest 层，不动另一会话正在改的 installer / receipt 文件）：codex override 的
install 块声明 `installs_skills: [planning-with-files]` —— 这正是该 repo 的唯一 skill
目录，target set 可证 → 拒绝分支不再触发 → 组件被认成 already-installed。

真机验证（本地构建 + `HARNESSED_PLATFORM=codex`）：`Upstream components: 1 installed /
13 already-installed / 0 skipped / **0 failed**` → `setup exit=0`。

回归护栏：新增 manifest 契约测试（每个 npx-skill-installer install 块都必须能证明
target set，失败信息列出 offender），并在 installer 层加用例（有声明的 pack 不再被
`update-unsupported` 拒绝；无声明的拒绝用例保留）。

CI：`41632560006`（ec91eef）9/9、`41633631131`（7a2f64a）9/9，均绿。本地：tsc 0、
biome 硬门 0 blocking（1 条 facts.ts 基线 warning 非本次）、schema validate OK、
受影响测试 282 + 45 全绿。

## v5.0.11 shipped (2026-11-03)

提交链：`ec91eef`（移除组件）→ `7a2f64a`（codex 修复）→ `e98c2c0`（planning 记录）→
`440a1de`（chore(release): prepare v5.0.11）→ `61c7e71`（stop-hook 身份移除窗口入计划）。

发版：`440a1de` 的 CI 被 `61c7e71` 的推送取消（ci.yml `cancel-in-progress: true`），
改用 `61c7e71`（含 release prep 的最新提交）打 tag → CI `41642137276` 9/9 绿 →
tag `v5.0.11` → publish run `41643135405` success（npm publish + 3 个 binary job）。
Registry 直查（不走本地缓存）：`dist-tags.latest` = **5.0.11**，`versions["5.0.11"]` 存在；
release `v5.0.11` 9 个 asset（3 binary + 3 .sha256 + 3 .sha256.sig）。

本机真机（binary 通道，用户裁定保留 binary、去掉 npm 全局）：

- `harnessed update` 没能把 binary 从 5.0.10 升到 5.0.11 —— 报
  `could not reach GitHub releases to resolve the latest binary`，重跑则挂住 10 分钟以上。
  但同一时刻 `curl` / `node fetch` / `bun fetch` 都能拿到 v5.0.11，api.github.com 也不限流。
  **真因是下载太慢而不是解析失败**：windows asset 有 103,795,200 字节（≈99MB），
  `curl` 拉完用了 660 秒（≈157 KB/s），binary 内置超时扛不住，而报错文案把锅甩给了
  「解析 release」。绕过：`curl -L` 拉 asset + `sha256sum` 对 `.sha256` 校验（一致）→
  覆盖 `harnessed.exe`（旧版留 `harnessed.exe.bak-5.0.10`）。改进项已入 `TODOS.md`。
- 换成 5.0.11 后：`harnessed --version` → 5.0.11（自带资产解包到
  `~/.claude/harnessed/assets/5.0.11`）；codex 宿主 `harnessed setup --non-interactive`
  → **0 failed / exit 0**，optional 清单 3 → 2（stop-hook-recover 已不在）。
