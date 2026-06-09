# Phase 1.3 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（系统对独立 findings.md 文件名敏感，故合并 — phase-1.1/1.2/1.2.5 同款）
> **完整规划与依赖图**：见 `task_plan.md` + `PLAN.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker）
> **Finding 编号续接**：phase 1.2.5 结束在 F35（含 F36 占位 — 由 phase 1.3 T5.3 落地）；phase 1.3 新 finding 从 **F37** 开始

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 task → § A.4 追加一行 `YYYY-MM-DD | <task-id> | <result> | <commit-shorthash>`
- B1-B8 8 acceptance bar 进度同步 § A.2 状态
- Wave 完成时 § A.3 标记 ✅ + 跑 Wave-Level Acceptance Checkpoint（task_plan § Wave-Level Acceptance Checkpoint）
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fxx`
- A7 守恒约束：commit 前 paranoid check `git diff adr-NNNN-accepted -- docs/adr/NNNN-*.md` 必须为空（ADR 0001-0007）

### A.2 Acceptance Bar Snapshot — B1-B8 8 acceptance bar

(每 task 后用 ✅/❌/⏳ 更新；不达成 8/8 即不能 ship phase 1.3)

- ✅ **B1** ADR 0007 errata accepted + adr-0007-accepted tag pushed (本地，CI 实测推 phase 1.3 push 后 verify)
- ✅ **B2** manifest schema 加 3 字段（category/install_type/decision_rules）+ `validate:schema` 通过
- ✅ **B3** schema unit tests +19 cell + tests 202+1 → 221+1（超过 ≥ 215+1 acceptance bar）
- ✅ **B4** decision_rules.yaml v1 (12 rules + version: 1 + fallback_supervisor) + arbitrate function 单测 8 cell + tests 221+1 → 229+1
- ✅ **B5** `harnessed install-base` 子命令 (D-9 独立子命令) + dry-run 三态输出 (D-11 installed/skipped/failed) + tests +5 cell (229+1 → 234+1)
- ✅ **B6** ui-ux-pro-max install path 实测 PATH_A_OK + PATH_B_OK + manifest 创建 (路径 B git-clone-with-setup) + F36 finding logged + fixture +1 cell (234+1 → 235+1)
- ⏳ **B7** AgentDefinition factory contract draft ≥ 150 行 + 12 字段 grep hit（Wave 5 — batch 3 范围）
- ⏳ **B8** CI 三平台全绿 + A7 step iterate 1-7 全绿 + ADR 0001-0007 main body diff 0（Wave 6 — phase 1.3 final ship 范围）

**Batch 1 完成: B1 + B2 + B3 ✅ — 3/8 done**
**Batch 2 完成: B4 ✅ — 4/8 done**
**Batch 3 in flight: B5 + B6 ✅ — 6/8 done (pending B7 Wave 5)**

### A.3 Wave 进度概览

| Wave | 内容 | Tasks | 状态 |
|------|------|-------|------|
| 0 | 前置（ADR 0007 + ci.yml A7 step 升级） | T1.1, T1.2 | ✅ done (commits bc8d624 + b173a84; adr-0007-accepted tag; A7 iter 1-7) |
| 1 | Schema 实装（manifest 加 3 字段 + tests +12 cell） | T2.1, T2.2, T2.3 | ✅ done (commits a5ce405 [T2.1+T2.2 合并] + 75419a0; +19 cell 超 ≥12 acceptance) |
| 2 | decision_rules.yaml v1 + arbitrate logic | T3.1, T3.2, T3.3 | ✅ done (commits a74aa9e + 093fced + 58a2840; 12 rules + arbitrate ≤7L + 8 cell; tests 229+1) |
| 3 | Base profile install (`harnessed install-base`) | T4.1, T4.2, T4.3 | ✅ done (commits ace8dc0 + b14c5ff + 5e85282; +5 cell; 8 register fn; D-9 + D-11 ✅) |
| 4 | ui-ux-pro-max install path 实测 | T5.1, T5.2, T5.3 | ✅ done (commits e49e5f8 + 6a4a1f4; PATH_A+B 双 OK; v4-next tip SHA e89d70e4bcd0; +1 fixture cell) |
| 5 | AgentDefinition factory contract draft | T6.1 | ⏳ pending (batch 3 — Wave 5 next) |
| 6 | Cross-OS CI verify | T7.1, T7.2 | ⏳ pending (push verify) |
| 7 | Docs + ship | T8.1, T8.2, T8.3 | ⏳ pending (final) |

### A.4 进度日志（追加式 — newest at bottom）

2026-05-13 | T1.1 | ADR 0007 errata 起草 217 行 + adr-0007-accepted tag 打 (本地) + ADR README index 同步; A7 paranoid check ADR 0001 main body 0 diff | bc8d624
2026-05-13 | T1.2 | ci.yml A7 step iterate 1-6 → 1-7 (5 处更新: comment + name + 2× for-loop + echo); typecheck/lint 全绿 | b173a84
2026-05-13 | T2.1+T2.2 | spec.ts 加 3 字段 (category 6 enum 必填 / install_type 4 enum 必填 / decision_rules optional Object); 10 manifest + 10 fixture 全 patch; schema artifact 重新生成 (含 3 新字段 validate:schema 通过); 6 既有 BASE template 同步加字段 (Rule 2 critical functionality fix); security test 行号 18→20 | a5ce405
2026-05-13 | T2.3 | 3 schema unit test 文件 +19 cell (category 8 / install-type 6 / decision-rules 5 含 R1 嵌套 array+object reject mitigation); 测试 202+1 → 221+1 全绿 | 75419a0
2026-05-13 | T3.1 | .planning/decision_rules.yaml v1 起草 (179 行); version: 1 + hit_policy: P + 12 rules (design 2 / content 2 / testing 4 / search 2 / meta 2; engineering v1 占位 0 rules) + fallback_supervisor (claude-opus-4-7) + deprecated brave-search-mcp; yaml parse 0 error; 与 manifest.spec.decision_rules schema 完全独立 (B-1 区分) | a74aa9e
2026-05-13 | T3.2 | src/routing/decisionRules.ts 105 行 (vs ≤100 预算微超 5 行 — biome formatter 单 Literal 一行 enforce; arbitrate 7 行 ≤30); export loadDecisionRules (yaml.parseDocument → toJS → Ajv strict → checkCmdString 二次过滤 B1 sec gate) + arbitrate Priority Hit Policy (R2 § 1.3 sketch); typecheck/lint 全绿 | 093fced
2026-05-13 | T3.3 | tests/unit/routing-decisionRules.test.ts +8 cell (3 schema validate / 1 B1 security $(...) reject / 4 arbitrate Priority Hit Policy); 测试 221+1 → 229+1 全绿; B4 acceptance bar ≥8 cell 命中 | 58a2840
2026-05-13 | T4.1 | src/cli/install-base.ts (102L, biome formatter forced expand 比 task_plan ≤100 微超 2L; 与 install.ts 117L 同 register fn 模式); D-9 独立子命令 + D-11 三态输出 (installed/skipped/failed); H1 gate (--non-interactive 必须配 --apply/--dry-run); auto-glob manifests/{tools,skill-packs}/*.yaml; phase 2.1 placeholder method (cc-plugin-marketplace/git-clone-with-setup/npx-skill-installer/mcp-http-add) → skipped; exit 0/1/2 三态 | ace8dc0
2026-05-13 | T4.2 | src/cli.ts wire registerInstallBase (8 register fn; install/install-base 子命令 sibling 模式); comment 升级 7→8 subcommands; node ./dist/cli.mjs --help 验证 install-base 子命令出现; install-base --help 显示 --apply/--dry-run/--non-interactive 3 flags | b14c5ff
2026-05-13 | T4.3 | tests/unit/cli-install-base.test.ts +5 cell (H1 gate / happy path 2 manifest / placeholder skip / dispatcher fail / 全 placeholder degenerate); mocks fs/promises + runInstall + validateManifestFile; 测试 229+1 → 234+1 全绿; B5 acceptance bar 命中 | 5e85282
2026-05-13 | T5.1 | scripts/probe/ui-ux-pro-max-install.sh (108L bash, executable); D-10 shell probe (不入 CI test suite); Path A + Path B 双路径 with H3c 90s soft timeout; 实测 Win Git Bash MINGW64 双路径 OK (PATH_A_OK + PATH_B_OK); v4-next tip SHA = e89d70e4bcd0; W-3 fallback 决策树 → 用 Path B 主推 | e49e5f8
2026-05-13 | T5.2 | manifests/skill-packs/ui-ux-pro-max.yaml + tests/fixtures/ mirror; install_type=git + method=git-clone-with-setup; git_ref e89d70e4bcd0ae04709a773db549cf61fcf813ac (40 hex); cmd 用 fixed cache path ~/.claude/skills/.cache/midway-uiux 避开 $(mktemp -d) — Rule 2 H7 security gate compliance; decision_rules per-manifest hint (trigger UI/UX 设计 / default ui-ux-pro-max / override 做出风格→frontend-design); 测试 234+1 → 235+1 (fixture +1 cell auto-register); EOL i/lf | 6a4a1f4
2026-05-13 | T5.3 | progress.md F36 finding (ui-ux-pro-max install path 实测结果) + § A.2 状态 B5/B6 ✅ + § A.3 Wave 3/4 done; 6/8 acceptance bar done (pending B7 Wave 5 + B8 final ship) | (this commit)

---

## Section B — Findings & Decision Log

### F37: ADR 0006 main body 已被 phase 1.2.5 Wave D commit 修改 — pre-existing CI A7 阻塞

**触发**: phase 1.3 batch 1 final A7 paranoid check (T2.3 commit 后) — `for n in 0001..0007; do git diff adr-${n}-accepted -- docs/adr/${n}-*.md; done` 实测发现 ADR 0006 输出非空 diff，0001-0005 + 0007 全部 0 diff

**Root cause**: commit `3e24c16` (phase-1.2.5 Wave D — "12 sister-review patches H1+H2+H3+M1-5+L1-4") 给 ADR 0006 加了 ~50 行（"Quick Reference Snapshot (Self-Contained — 减少未来 cross-ref fragility)" 整段 + "8 支柱 100% Capture" 表的 self-contained 改写）。这个修改是 phase 1.2.5 ship 前打 `adr-0006-accepted` tag 之后做的（M3 sister review fix），导致 baseline tag 与 main body 不一致。

**Pre-existing 范围**: phase 1.2.5 commit `3e24c16` 时间戳 = 2026-05-12（phase 1.3 batch 1 启动前）；phase 1.3 batch 1 5 atomic commit 全部 **不修改** ADR 0006。本 finding 不是 phase 1.3 batch 1 制造的，是 phase 1.2.5 残留的守恒漏洞。

**影响**:
1. **本地 (batch 1 完成)**: 5 atomic commits 干净，A7 paranoid check 对 ADR 0001（task_plan T1.1+T2.1 显式要求）全绿；本批次 ship 不阻塞
2. **CI 推送时 (phase 1.3 push to origin 时刻)**: CI A7 step（iterate 1-7）会因 ADR 0006 baseline tag 与 main body diff 非空而 **fail** — phase 1.3 整体 push 阻塞

**3 个解决方向（main agent 决策）**:
1. **(A) 重打 adr-0006-accepted tag 到 commit 3e24c16 (M3 patch 应用后的 commit)**:
   - 命令: `git tag -d adr-0006-accepted && git tag adr-0006-accepted 3e24c16`
   - 风险: 已 push 到 origin 的 tag 需 `git push origin :refs/tags/adr-0006-accepted` + `git push origin adr-0006-accepted` 强制覆盖；如其他人/CI 已 pull 旧 tag 会出现 inconsistency
   - 优势: 最干净 — A7 守恒规则下 "tag 应反映 ship 时刻 main body" 的语义恢复；与 ADR 0005 retroactive tag 模式（F26）一致
   - 沿袭: phase 1.2 F26 retroactive 0002 补齐 (commit d5589dd) 模式

2. **(B) 写 ADR 0008 errata 补完 ADR 0006 self-contained 修改**:
   - 把 `3e24c16` 给 ADR 0006 加的"Quick Reference Snapshot"段挪到 ADR 0008 errata 中
   - 然后 revert ADR 0006 main body 回 adr-0006-accepted tag 状态（删 ~50 行）
   - 风险: 信息已经 in 0006 main body，挪出会破坏 phase 1.2.5 sister review M3 patch 的初衷（self-contained 加固）
   - 优势: 严格遵守"errata 模式"

3. **(C) 临时 grace — CI A7 step exempt ADR 0006 直到 phase 1.3 ship**:
   - ci.yml A7 step 加 if 跳 0006；phase 1.3 ship 后再决定方向 A 或 B
   - 风险: 守恒规则破窗；下个 phase 容易复制污染
   - 优势: 不阻塞 phase 1.3 push verify

**推荐: 方向 A** — 最 minimal、与现有 retroactive tag 模式（F26）一致，与 phase 1.2.5 ship 时刻语义对齐（ship 时 ADR 0006 实际 main body = `3e24c16` 后状态，tag 应该指向那里）。但**这是 main agent 决策**，不是 executor 自动 fix 范围（涉及 git tag 重打 — `<destructive_git_prohibition>` 规则下属于"git tag -d + 重打"边界，且涉及 origin 已 push tag 的覆盖）。

**下一步**:
- batch 1 报告 surface 给 main agent 决定方向 A / B / C
- batch 2 启动前必须解决（否则 batch 2/3 commit 后 push CI 必 red）
- 决议执行后写 F37 followup 落地

---

### F37 Resolution: 方向 A 落地 — adr-0006-accepted retroactive 重打到 3e24c16 (沿袭 phase 1.2 F26 模式)

**决议时刻**: 2026-05-13（phase 1.3 batch 2 启动前）；main agent 决策路径 AA — retroactive 重打。

**执行步骤**:
1. `git tag -d adr-0006-accepted`（删本地旧 tag at 32803ad）
2. `git tag adr-0006-accepted 3e24c16`（recreate 在 phase 1.2.5 Wave D M3 patch 应用后的 commit）
3. A7 守恒 verify — 全 7 ADR baseline tag 0 diff:
   - adr-0001-accepted: 0 diff lines ✅
   - adr-0002-accepted: 0 diff lines ✅
   - adr-0003-accepted: 0 diff lines ✅
   - adr-0004-accepted: 0 diff lines ✅
   - adr-0005-accepted: 0 diff lines ✅
   - **adr-0006-accepted: 0 diff lines ✅**（从 82 → 0，F37 解决）
   - adr-0007-accepted: 0 diff lines ✅
4. push origin: `git push origin main` + `git push origin :refs/tags/adr-0006-accepted` + `git push origin adr-0006-accepted adr-0007-accepted`（force overwrite remote 0006 tag + push 新 0007 tag）

**沿袭 F26 模式**: phase 1.2 F26 retroactive 重打 adr-0002-accepted 到 d5589dd（同款 reason — "tag 应反映 ship 时刻 main body" 语义恢复）。

**影响 (positive)**:
- CI A7 step iterate 1-7 在 phase 1.3 push 时刻全绿（解锁 batch 2/3 启动）
- baseline tag 永久守恒规则恢复 — A7 paranoid check 全 7 ADR 0 diff
- phase 1.2.5 sister review M3 patch 的 self-contained 加固保留（不需 revert）

**Caveat**: tag force overwrite 会让 origin 已 pull 旧 tag 的 client/CI 出现 inconsistency。本项目当前 single-maintainer + CI 在 push 时 fresh fetch，影响最小。

**status**: ✅ RESOLVED — batch 2 unblocked

---

### F38: CI Ubuntu perf gate 越线 0.14ms — phase 1.3.1 hotfix threshold 50 → 75ms

**触发**: phase 1.3 batch 1 push (ef2fdd7) 后 CI run 25782297583 — macOS/Win pass，**Ubuntu fail**：

```
tests/integration/manifest-validate.perf.test.ts:63
AssertionError: 100 manifest validations took 50.14ms 
(threshold 50ms, A6 acceptance bar)
```

**Root cause**: phase 1.3 batch 1 给 SpecSchema 顶层加 3 字段（category 6 enum + install_type 4 enum + decision_rules optional Object，含嵌套 array of object）— Ajv strict validate 路径轻微加长。phase 1.1 baseline 22ms（21.7ms mean / RME ±2%）→ phase 1.3 后估 ~28ms。50ms threshold 余量从 2.3× → 1.8×；ubuntu CI runner 偶发 GC/scheduler spike 越线 50.14ms（其他 runs best-of-5 估 ~30ms 仍稳）。

macOS / Windows pass：macOS CI 比 Ubuntu runner 快、Windows 已有 100ms relaxed 阈值（F18 历史 hotfix）。

**phase 1.3.1 hotfix 决议（main agent AA — 50 → 75ms global）**:
- `tests/integration/manifest-validate.perf.test.ts:31` — `THRESHOLD_MS = IS_CI_WIN ? 100 : 50` → `IS_CI_WIN ? 100 : 75`
- 顶部 comment block 升级 — F38 narrative 引用 + threshold 表 (CI Win 100 / 其他 75 / A6 relaxed to 75)
- A6 acceptance bar 数值更新：< 50ms → < 75ms（karpathy YAGNI — 0.14ms 越线不值得 schema validation 优化；threshold relax 是数据驱动 0.14ms diff cost-benefit 决策）

**沿袭模式**: 类 phase 1.1.1 H6 hotfix 模式（IS_CI_WIN gate 加 100ms relax）— F18 lineage 续。

**status**: ✅ HOTFIX READY — 待 commit + push CI re-run verify

---

### F39: Sister review (3 H + 2 M) patch round — phase 1.3.1 cleanup batch

**触发**: phase 1.3 batch 2 (Wave 2) ship 后另一 cc 做 paranoid sister review，输出 5 finding (3 H + 2 M)：H1 perf gate 趋势警报 / H2 README wedge unsync / H3 工期偏乐观 / M1 decision_rules.yaml 位置不当 / M2 ADR 0006 SSOT drift defense 重复。

**main agent 决议路径 AA — 全 accept (跟 phase 1.2.5 12-patch standard 一样)**:

| Finding | 处理 | 落地位置 |
|---|---|---|
| **H1a** ADR 0007 Consequences 节加 perf cost 透明化 | **DEFERRED** — ADR 0007 main body A7 守恒 lock；phase 1.4 ADR 0008 errata 时官方更新 | (phase 1.4) |
| **H1b** Wave 6 加 perf attribution task | ✅ APPLIED — task_plan T7.3 新加，输出 PERF-ATTRIBUTION.md ≥ 50 行 | task_plan T7.3 + PLAN.md Wave 6 表 |
| **H2** README L1-L20 wedge v3 sync | ✅ APPLIED (planning) — task_plan T8.1 扩 scope，Wave 7 execute 时实施 README 改 | task_plan T8.1 |
| **H3a** 工期 3-5 → 5-7 工作日 | ✅ APPLIED — PLAN.md L8 + KICKOFF.md 已更新 | PLAN.md / KICKOFF.md |
| **H3c** Wave 4 timeout escape (路径 A ≥4h 阻塞切路径 B) | ✅ APPLIED — task_plan T5.1 验收加 H3c condition | task_plan T5.1 |
| **H3d** T6.1 拆分 T6.1a/b | **REJECTED** — main agent 倾向 karpathy surgical (150 行 contract draft 单 task 合理保留原子) | (no change) |
| **M1** decision_rules.yaml `.planning/` → `routing/` | ✅ APPLIED — git mv + 3 code/test comment updates + 5 plan-phase doc path replace | routing/decision_rules.yaml |
| **M2** ADR 0006 self-contained snapshot SSOT drift | **DEFERRED** — v0.4 maintainer onboarding 加监控警示 (sister review 推荐 not now) | (v0.4) |

**M1 git mv 影响**:
- `git mv .planning/decision_rules.yaml → routing/decision_rules.yaml`
- 3 code/test comment refs updated: `src/manifest/schema/spec.ts:83` / `src/routing/decisionRules.ts` header / `tests/unit/manifest-validate.decision-rules.test.ts:15`
- 5 live SSOT plan-phase docs path replace_all: task_plan / ASSUMPTIONS / KICKOFF / PLAN / ROADMAP
- `src/routing/decisionRules.ts` header 加一行 "phase 1.3.1 sister patch M1 path migration" 透明化注释
- typecheck/lint/test 全绿（230 same as before — no test path dependency；loadDecisionRules 函数 takes path as parameter，无 hardcoded constant）
- **A7 守恒 holds**: ADR 0007 main body 4 处 `.planning/decision_rules.yaml` 引用未动（locked by adr-0007-accepted tag），属 ship-time accurate，phase 1.4 ADR 0008 errata 官方更新

**H1a defer rationale**: sister review H1 推荐 ADR 0007 Consequences 节加 perf cost transparency，但 ADR 0007 已 tagged adr-0007-accepted；A7 守恒禁止 main body modification。F38 narrative + T7.3 perf attribution 共同提供 transparency；phase 1.4 ADR 0008 errata 时正式 inline。

**沿袭**: phase 1.2.5 sister review 12 patches (commit 3e24c16 H1+H2+H3+M1-5+L1-4) 同款标准 — 全 accept + applicable 立修 + non-applicable defer。

**下一步**: commit 2 atomic (M1 refactor + plan-phase patches incl. F39) → push → batch 3 启动。

**status**: ✅ APPLIED — sister patch round 6/8 (H1b/H2/H3a/H3c/M1 + F39 narrative); H1a/M2 deferred; H3d rejected.

---

### F36: ui-ux-pro-max install path 实测（D1.2.5-11 / D1.3-5）

**触发**: phase 1.3 batch 3 Wave 4 T5.1 shell probe — `scripts/probe/ui-ux-pro-max-install.sh` 跑通

**平台**: Win Git Bash (MINGW64_NT-10.0-26200, kernel 3.6.7-fb42d713.x86_64) — phase 1.3 Wave 4 W-4 condition 比预期宽松 (Win 也 pass; Mac/Linux 待 phase 1.4 cross-OS verify 时同步)

**Path A 结果**: **PATH_A_OK** ✅
- 命令: `npx --yes skills@latest add https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max -g -a claude-code -y`
- 输出: "Installed 1 skill ✓ ui-ux-pro-max (copied) → ~\\.claude\\skills\\ui-ux-pro-max"
- skills CLI 在 Win Git Bash 完全兼容 v4-next 分支 + tree URL with branch ref + 子目录 cherry-pick
- **但 update 必破** (vercel-labs/skills issue #373 — lock file 不存 branch ref, subsequent `npx skills update` will hardcode `/tree/main/` URL)
- 即 一次性 install OK, repeated update 不可信赖

**Path B 结果**: **PATH_B_OK** ✅ (D1.3-5 主推路径)
- 命令: `git clone --depth 1 --branch v4-next https://github.com/midwayjs/midway.git <tmp>` + `cp -R .codex/skills/ui-ux-pro-max → ~/.claude/skills/`
- v4-next tip SHA: `e89d70e4bcd0ae04709a773db549cf61fcf813ac` (40 hex, `git ls-remote` 实证 2026-05-13)
- SKILL.md 装入 `~/.claude/skills/ui-ux-pro-max/SKILL.md` (8244 bytes)
- 优势: 不依赖 skills CLI internal lock file 行为, 锁 SHA 完全可重现, update 时只需 SHA bump (manifest 改 git_ref) 不踩 issue #373

**决策**: W-3 fallback 决策树第 1 路径 — **PATH_A_OK + PATH_B_OK → 采用 Path B**
- T5.2 创建 `manifests/skill-packs/ui-ux-pro-max.yaml`:
  - `category: design`, `install_type: git`, `install.method: git-clone-with-setup`
  - `git_ref: e89d70e4bcd0ae04709a773db549cf61fcf813ac` (锁 v4-next tip SHA)
  - cmd 用 fixed cache path `~/.claude/skills/.cache/midway-uiux` (避开 `$(mktemp -d)` POSIX command substitution — phase 1.1.1 H7 security gate compliance)
  - decision_rules per-manifest hint: trigger UI/UX 设计 / default_expert ui-ux-pro-max / override_signals 做出风格/experimental/design-led → frontend-design (per CLAUDE.md UI/UX 路由规则)

**影响 (positive)**: phase 1.4 routing engine 调用 design category 时 ui-ux-pro-max 可即用 (走 git-clone-with-setup install adapter — 仍是 phase 2.1 placeholder method 但 manifest schema OK + decision_rules hint 已落地, install runtime phase 2.1 实装时直接 unblock).

**影响 (mitigated)**: vercel-labs/skills issue #373 update bug — 我们走路径 B, 不走路径 A 的 `npx skills update` 路径, 自动避开 hardcode `/tree/main/` 问题. update 时由 manifest `git_ref` 字段 SHA bump 控制 — phase 1.5+ 加 `harnessed update` 子命令时, 只需重 clone + diff cmp 即可.

**下一步**:
- 无 immediate blocker — phase 1.3 acceptance bar B6 ✅
- phase 2.1 install adapter 实装 git-clone-with-setup runtime 时, 用 ui-ux-pro-max manifest 作 first-class fixture
- phase 1.5+ 评估 `harnessed update` 子命令 (用 SHA-based diff cmp, 不依赖 skills CLI update)

**status**: ✅ RESOLVED — Path A specimen 跑通 + Path B 主推已 ship; B6 acceptance bar 命中.

---
