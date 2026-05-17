# ADR 0016: Phase 3.3 — aliases.yaml RICH redirect + DOCTOR-ONLY-WARN deprecation marker + known-good 版本组合 lock (9 章节 errata 合并)

## Status

**Accepted (phase 3.3 W2 — 2026-05-17)** — phase 3.3 plan-phase Wave 0 sketch (W0.3 12+13 schemaVersion surface decision) → Wave 1 fill-out (schemas + loaders + helper + doctor 7th check) → Wave 2 e2e + ADR fill → Accepted at phase 3.3 ship.

> Phase 3.3 是 v0.3.0 milestone **第 3 phase (3/4)**, 把 v0.3.0 装配为 **aliases.yaml RICH 5-field redirect + metadata (D-01) + DOCTOR-ONLY-WARN 安静 install + doctor 7th check 人读 audit (D-02) + versions/<harnessed-ver>-known-good.yaml YAML manifest lazy-load 版本 lock (D-03) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04) + W0 backlog 3 项一次根治 (W0.1 STATE COLLAPSE + W0.2 dashboard-sse fix path (a) random ephemeral port + W0.3 schemaVersion 12+13 surface manifest-domain colocation decision + T0.5 planFeature.v1 11th surface backfill)**. 4 大决策 sister cluster 一次 ship — 沿袭 ADR 0008/0009/0010/0011/0012/0013/0014/0015 多决策合并 errata 模式 (B-35 + B-36 lock).

## Context

Phase 3.3 把 v0.3.0 milestone 第 3 phase 装配为 aliases.yaml 重定向 + deprecation marker + known-good 版本组合 lock + STATE dual-SSOT terminus + W0 backlog 3 项 absorb. 4 大主题 sister cluster 一次 ship, 作为 v0.3.0 milestone 第 3 phase open — R7.5 (模拟上游改名场景 install 通过 + doctor warning) + R7.6 (harnessed install --known-good reproducible) ROADMAP 双 acceptance bar 锚定.

Phase 3.2 ship 后 sister analog: workflow-domain `src/workflow/schema/` (config.v1 + governance.v1 + planFeature.v1) — Phase 3.3 W1 完成 manifest-domain `src/manifest/schema/` (aliases.v1 + known-good.v1) 类比扩展，cross-phase colocation 模式延袭至 3 个 domain (checkpoint-domain Phase 3.1 currentWorkflow.v1 + workflow-domain Phase 3.2 + manifest-domain Phase 3.3). install.ts L74-77 加 1 行 `resolveAlias(name) ?? name` 实现 Karpathy surgical pre-manifest-lookup; doctor.ts 184→195L 加 7th check `checkDeprecations` 人读 deprecation table (D-02 silent install + doctor audit = R7.5 验收两 surface 共同达成).

并办 STATE.md L23a + Phase 3.2 carry-forward 3 项一次根治 — W0.1 STATE dual-SSOT 5th and final recurrence COLLAPSE (4 prior: README L9 / README L44 / PROJECT-SPEC / STATE freshness scope; D-04 (b) LOCKED) / W0.2 dashboard-sse 4-cell flaky fix path (a) random ephemeral port + DASHBOARD_PORT env injection (sister Node `net.createServer({port:0})` MDN std) / W0.3 schemaVersion 12+13 surface decision (aliases.v1 + known-good.v1 NEW, Karpathy single-responsibility 双独立文件 manifest-domain colocation) — 沿袭 Phase 2.1/2.2/2.3/2.4/3.1/3.2 Wave 0 一次根治模式.

### A7 守恒约束 (ADR 0001-0015 main body 不可改)

phase 3.3 沿袭 ADR 0003/0005/0007/0008/0009/0010/0011/0012/0013/0014/0015 errata 风格 — **不动 ADR 0001-0015 main body** (A7 守恒). baseline tag iterate 15 → 16 (Wave 2 T2.10 ship 时 push `adr-0016-accepted` tag, ci.yml A7 step iter `1-0015` → `1-0016` per W-02 orchestrator explicit literal fix sister Phase 3.1 W5 T5.4 + Phase 3.2 W3 T3.4). 本 ADR 0016 起 phase 3.3 ship 时刻 frozen; v0.3.1+ 演化走 ADR 0017+ errata.

## Decisions

### 1. D-01 RICH — aliases.yaml 5-field redirect entry + metadata

`manifests/aliases.yaml` RICH schema 12th surface — 5 fields per entry: `redirect` (target name) + `reason` (≤500 字符 DOS cap sister governance.ts) + `since_version` (semver pattern strict) + `deprecation_date` (ISO-date pattern, NOT `format: 'date'` — sister Phase 3.2 W2 Rule 1 lesson, FormatRegistry.Set 未 project-wide 注册时 `format` silently passes garbage) + `removal_date` (Optional ISO-date, 长尾窗口). FLAT (string-only map `{old: new}`) rejected — 失 metadata 无法 generate deprecation table; TIERED (string OR object union) rejected — Karpathy YAGNI violation (双 path 复杂度 vs 5-field 直 declarative).

`src/manifest/schema/aliases.v1.ts` 34L NEW (12th schemaVersion surface, manifest-domain colocation per W0.3 decision doc) + `src/manifest/aliases.ts` 47L NEW consumer (`loadAliases` memoize per-process + `resolveAlias` + `listDeprecations`, fail-soft 缺文件 → null fallback sister `src/checkpoint/state.ts` L23-41 pattern).

### 2. D-02 DOCTOR-ONLY-WARN — install 安静重定向 + doctor 7th check 人读 audit

`src/cli/install.ts` L74-77 加 1 行 `const resolvedName = resolveAlias(name) ?? name` (Karpathy surgical — 1 行 not 6, sister Phase 3.2 W2 governance.ts isVetoed 1-line guard pattern). NO `console.warn()` 在 install path (D-02 LOCKED, INSTALL-WARN 不可 sneak-in: CI 噪声 + 重复警告 + R7.5 "install 通过" 语义对齐). INSTALL-THROW + --force-deprecated flag 不可 sneak-in — 太严苛 + 与 R7.5 "install 通过" 语义冲突.

`src/cli/doctor.ts` 184→195L 加 7th check `checkDeprecations` (≤200L Karpathy hard limit clean; sister Phase 3.2 W1 175→186L 6th check checkGstackPrefix pattern) + `src/cli/lib/check-deprecations.ts` 43L NEW helper (single-responsibility helper extract sister Phase 3.1 W3 engineHook.ts 49L pattern). Doctor 输出 deprecation table (old → new + reason + since_version + deprecation_date) 作为 human-readable audit surface — 用户主动跑 `harnessed doctor` 看 deprecated 列表，install path 静默 (sister Unix tool 习俗: ls / cp 不 warn argument aliases).

T2.3 install-silent-redirect.test.ts 1 fixture 守门 — install stdout + stderr 不含 'redirect|deprecated|warning' substring (case-insensitive).

### 3. D-03 YAML manifest — versions/<harnessed-ver>-known-good.yaml lazy-load 版本 lock

`versions/0.3.0-known-good.yaml` 9L NEW seed (空 upstreams: [] Phase 3.4 dogfood 填充 e2e-verified pinned versions) + `src/manifest/schema/known-good.v1.ts` 33L NEW (13th schemaVersion surface, manifest-domain colocation) + `src/manifest/knownGood.ts` 46L NEW consumer (`loadKnownGood(harnessedVer)` per-version memoize Map + `getPinnedVersion(name, harnessedVer)` lazy, sister aliases.ts memoize pattern).

JSON known-good (npm-lock style) rejected — 项目未用 npm-lock + yaml convention sister manifest 已用 yaml; Embed-in-manifest yaml rejected — 跨 manifest agg 难, R7.6 "harnessed 版本冻结一组" scope mismatch (per-version lock 是 cross-manifest aggregate).

`src/cli/install.ts` L114-121 加 `--known-good` flag lazy consume (仅当 flag 设置时 import + load, Karpathy YAGNI Discretion lock — 0 cost when flag not used). `install.ts` L116 hardcoded `harnessedVer = '0.3.0'` (DEFERRED #AD Phase 3.4 reads from package.json, TODO comment 标记).

T2.2 install-known-good.test.ts 2 fixture 守门 (lock hit override 99.99.99 + lock miss graceful fallback).

### 4. D-04 STATE dual-SSOT 5-recurrence terminus COLLAPSE (b) LOCKED

`.planning/STATE.md` L4 frontmatter `> Status:` + L5 `> 最后更新：` 双删 — 5th and final recurrence of dual-SSOT 反模式 (4 priors: README L9 / README L44 / PROJECT-SPEC L3 / STATE freshness gate scope). Karpathy YAGNI single SoT: "当前位置" block (L21-27) 是 sole SSOT post-COLLAPSE. `scripts/check-transparency-verdicts.mjs` 加 `STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` OR-fallback (full-file scan) — STATE.md 验收 check 仍 pass (单一 source 单一 scan strategy).

(a) EXTEND freshness gate scope 保 dual 不可 sneak-in (over-engineering 不消除 root); (c) COLLAPSE INVERSE 删 "当前位置" 块 不可 sneak-in (损 human-readable + dashboard 可能 break — RESEARCH § 1.1 12-match grep evidence verified dashboard.mjs parses no L4 frontmatter, so D-04 (b) COLLAPSE safe + 0 dashboard breakage).

### 5. § 4 + § 9 — schemaVersion 12+13 surface manifest-domain colocation (W0.3 decision doc)

`src/types/schemaVersion.ts` 11 → 13 surface (additive extension, B-37 内部 0 修改): `harnessed.aliases.v1` (12th — `manifests/aliases.yaml` D-01 RICH) + `harnessed.known-good.v1` (13th — `versions/<ver>-known-good.yaml` D-03 YAML manifest). W0.3 决: 双独立 surface per Karpathy single-responsibility — aliases (upstream rename redirect) 与 known-good (per-version pin lock) 是 distinct manifest-domain concepts 独立 lifecycle.

**Colocation 规则 cross-phase 延袭至 3 domain**:
- checkpoint-domain (Phase 3.1) → `src/checkpoint/schema/` (currentWorkflow.v1 8th)
- workflow-domain (Phase 3.2) → `src/workflow/schema/` (config.v1 9th + governance.v1 10th + planFeature.v1 11th W0 T0.5 backfill)
- manifest-domain (Phase 3.3) → `src/manifest/schema/` (aliases.v1 12th + known-good.v1 13th)

Each surface lives with primary consumer — Karpathy consumer-locality discipline cross-phase reusable. T0.5 planFeature.v1 11th surface backfill (sister Phase 3.2 W2 T2.2 b875e21 latent stale claim surgical fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern) 解 Phase 3.3 W3 plan-checker iter 1 B-1 BLOCKER.

### 6. § 6 — install resolveAlias 1-line surgical pre-manifest-lookup (Karpathy exemplar)

`src/cli/install.ts` L74-77 (3 lines net delta — import + resolveAlias call + null coalesce) — Karpathy surgical exemplar per RESEARCH § 8.1. Sister Phase 3.2 W2 governance.ts isVetoed 1-line guard pattern延袭. Cost: 1 alias module load per install invocation (memoize per-process); 0 sink cost when no aliases.yaml present (existsSync short-circuit).

### 7. § 7 — W0.2 dashboard-sse fix path (a) random ephemeral port + DASHBOARD_PORT env injection

`scripts/dashboard.mjs` L39 1-line additive: `const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)` (prod default 保持 47180 zero behavior change; test inject DASHBOARD_PORT 强制 random port). `tests/scripts/dashboard-sse.test.ts` ~12L net delta — import `net.createServer` + `getEphemeralPort()` helper + beforeAll env injection + 8s waitFor (sister Phase 2.4 W4 Win 3-tier pattern) + 删 portTaken probe + 删 4-cell skip branches.

Fix path (a) chosen over (b) hard-kill 47180 (rude to dev who runs `harnessed dashboard` in another terminal) + (c) skip-with-detailed-stderr (3 cell perma-skip = quality loss). 4 cell 一次性 pass cross-OS.

### 8. § 8 — `manifests/aliases.yaml` MVP empty seed (Phase 3.4 dogfood 填充)

`manifests/aliases.yaml` 14L NEW (RICH sample commented + active `aliases: {}` empty map — Phase 3.4 dogfood 加 first actual deprecation entries). `versions/0.3.0-known-good.yaml` 9L NEW (空 upstreams: [] — Phase 3.4 dogfood 填 actual e2e-verified pinned versions e.g., claude-agent-sdk@0.3.142, gstack@1.5.0).

DEFERRED #AC + #AD + #AE registered (carry-forward 3 项): aliases.yaml dogfood entries / install.ts harnessed_version source-of-truth read from package.json / path traversal hardening regex (Phase 3.3 relies on git-tracked aliases.yaml + PR review gate, Phase 3.4 dogfood 时若 surface 实际 attack vector 再 add).

### 9. § 12 — 3-wave topology rationale (W0-W2, sister Phase 3.2 4-wave 缩 1 因 scope smaller) + A7 conservation

W0 backlog 3 项 absorb + setup (5 task — T0.1 STATE COLLAPSE / T0.2 dashboard-sse fix / T0.3 W0.3 decision / T0.4 test dirs scaffold / T0.5 planFeature.v1 11th surface backfill) → W1 schemas 12+13 surface + manifest loaders + check-deprecations helper + doctor 7th + install integrate + 2 yaml seed + 8 test files (12 task) → W2 e2e integration (R7.5 + R7.6 acceptance) + observability + security + ADR + STATE/RETRO/ROADMAP + A7 + ship tags (9 task) → 26 atomic task vs Phase 3.2 23 task (similar scope — MVP infrastructure + 2 yaml seed empty + dogfood deferred Phase 3.4); ~150L src delta vs Phase 3.2 ~280L (smaller). ADR 0001-0015 main body 0 diff verify (A7 守恒 sister Phase 3.2 T3.4); ci.yml A7 iter `1-0015` → `1-0016` per W-02 explicit `ADR 0001-0016` literal (NOT naked `1-0016` substring); baseline tag `adr-0016-accepted` (W2 T2.10) + milestone tag `v0.3.0-alpha.3-aliases-known-good`.

## A7 Conservation

ADR 0001-0015 main body **untouched**; baseline tag iteration `adr-0001-accepted` ... `adr-0015-accepted` → 加 `adr-0016-accepted` (phase 3.3 Wave 2 T2.10 ship 打). `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**. schemaVersion 11-surface → 13-surface = additive extension (新 `aliases.v1` + `known-good.v1`), 无修改既有 11 surface 内部 (B-37, sister Phase 3.2 8→11 precedent extended).

### A7 守恒验收命令 (phase 3.3 ship 后 0001-0016 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0016 main body unchanged"
```

phase 3.3 ship 前 A7 守恒 ADR 0001-0015 验收 (Wave 2 T2.9 mid-wave + T2.10 ship-time verify):

```bash
git diff adr-0015-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-5]-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0015` 加 `0016`; step name `ADR 0001-0015` → `ADR 0001-0016` (W-02 explicit literal fix, Wave 2 T2.7 落地 — sister Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 pattern).

## Consequences

**Capability deltas (Phase 3.3 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| aliases.yaml RICH redirect (D-01) | NEW aliases.v1 schema 34L + aliases.ts loader 47L + manifests/aliases.yaml 14L MVP seed | T2.1 install-aliases.test.ts 3 fixture (R7.5) + T2.4 aliases-security 2 fixture |
| install silent redirect (D-02) | install.ts +3L resolveAlias pre-lookup; NO console.warn | T2.3 install-silent-redirect.test.ts 1 fixture observability gate |
| doctor 7th check deprecation audit (D-02) | doctor.ts 184→195L + check-deprecations.ts 43L NEW helper | `tests/cli/doctor.test.ts` 6→7 surface bump + Phase 3.3 W1 T1.12 fixture |
| known-good version lock (D-03) | NEW known-good.v1 schema 33L + knownGood.ts loader 46L + versions/0.3.0-known-good.yaml 9L MVP seed + install.ts --known-good flag +8L | T2.2 install-known-good.test.ts 2 fixture (R7.6) + T2.4 knownGood-security 2 fixture |
| STATE dual-SSOT terminus (D-04 LOCKED) | STATE.md L4+L5 删除 (5-recurrence terminus); check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback +10L | `node scripts/check-transparency-verdicts.mjs` exit 0 + grep STATE.md "当前位置" block 验证 |
| schemaVersion 12+13 surface | additive 11→13 (aliases.v1 + known-good.v1) | `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` == 13 |
| W0.2 dashboard-sse fix path (a) | scripts/dashboard.mjs +1L env-var override + tests/scripts/dashboard-sse.test.ts ~+12L getEphemeralPort + DASHBOARD_PORT injection | 4-cell pass cross-OS first acceptance bar |
| T0.5 planFeature.v1 11th surface backfill | schemaVersion.ts +4-5L (sister Phase 3.2 W2 b875e21 latent stale claim surgical fix) | `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` 10→11 (pre-W1) |

**Negative consequence + mitigation**: DEFERRED #AC aliases.yaml dogfood entries 推 Phase 3.4 (本 phase MVP empty `aliases: {}` map 守 schema 验证 path 不消费 actual rename) + DEFERRED #AD install.ts harnessed_version source-of-truth 推 Phase 3.4 read from package.json (本 phase hardcoded '0.3.0' TODO 标记) + DEFERRED #AE path traversal regex 推 Phase 3.4 dogfood 真攻击面后 evaluate. mitigation: 3 sister deferred 均 documented + tracked + 触发条件 clear.

## Compliance

**F1-F8 8/8 acceptance bar verify evidence**:

- F1 ADR 0016 errata accepted — 本 ADR Status flip + 9 章节 fill (Wave 2 T2.5)
- F2 aliases.yaml RICH redirect + doctor 7th check (R7.5 验收) — Wave 1 T1.4-T1.6 + Wave 2 T2.1 + T2.3 (consumer + helper + 3 + 1 fixture)
- F3 install silent redirect (D-02) — Wave 1 T1.9 + Wave 2 T2.3 (1-line resolveAlias + observability gate)
- F4 known-good version lock (D-03 R7.6 验收) — Wave 1 T1.5 + T1.9 + T1.11 + Wave 2 T2.2 (consumer + flag + seed + 2 fixture)
- F5 STATE dual-SSOT terminus (D-04 LOCKED) — Wave 0 T0.1 + Wave 2 T2.6 (COLLAPSE + 当前位置 块更新)
- F6 STRIDE security守门 — Wave 2 T2.4 (4 fixture aliases + knownGood combined T-3.3-01 + T-3.3-03 + T-3.3-05)
- F7 W0 backlog 3 项一次根治 — Wave 0 T0.1-T0.5 (STATE COLLAPSE + dashboard-sse fix + W0.3 decision + test dirs + T0.5 planFeature backfill)
- F8 SHIP — `adr-0016-accepted` baseline tag + `v0.3.0-alpha.3-aliases-known-good` (Wave 2 T2.10); ci.yml A7 step iter `1-0015` → `1-0016` (T2.7); A7 守恒 ADR 0001-0015 main body 0 diff verified

**3-OS CI 全绿 evidence**: Wave 0 W0.2 fix achieved CI 3-OS green on first push (first acceptance bar per RESEARCH § 7.1 fix path (a) recipe verified); Wave 1-2 ship per-task CI runs 3-OS green; Wave 2 ship final CI verify (T2.10 push 触发).

**Karpathy hard limits met (all files ≤ budget)**:
- ADR 0016 ≤ 250L (本 fill-out 实占 ≈ 180L)
- doctor.ts 184→195L (≤200L hard limit clean)
- check-deprecations.ts 43L (≤50L PRIMARY helper, sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L extraction precedent)
- aliases.ts 47L (≤50L D-01 RICH consumer)
- knownGood.ts 46L (≤50L D-03 YAML manifest consumer)
- aliases.v1.ts 34L (≤40L 12th surface TypeBox)
- known-good.v1.ts 33L (≤45L 13th surface TypeBox)
- install.ts 140L post-T1.9 (≤200L hard limit clean — resolveAlias 1-line + --known-good 8-line additive)
- manifests/aliases.yaml 14L + versions/0.3.0-known-good.yaml 9L MVP seed

## Errata-path note

phase 3.3 走 ADR 0016 errata pattern (新决策 inline, ADR 0001-0015 0-diff preserved); future Phase 3.4+ 走 ADR 0017+ errata. 本 ADR 0016 起 phase 3.3 ship 时刻 frozen — 任何 v0.3.1+ 演化 (Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml + EE-4 BLOCKER auto-spawn rerun + userSpawn session_id capture + aliases.yaml first actual deprecation entries) 必须开 ADR 0017+ errata; 本 ADR 0016 main body 不可改 (与 ADR 0001-0015 同等守恒规则).

phase 3.3 ship 时 Wave 2 T2.10 (本 ADR `adr-0016-accepted` baseline tag push 前) ci.yml A7 step `for n in ... 0015` → `for n in ... 0015 0016` + step name `ADR 0001-0015` → `ADR 0001-0016` (baseline tag iteration `1-0015 → 1-0016` per W-02 orchestrator explicit literal fix sister Phase 3.1 W5 T5.4 + Phase 3.2 W3 T3.4).

## Adoption-confirmation

**v0.3.0 MILESTONE 3/4 PROGRESS** (sister Phase 3.1 + 3.2 v0.3.0 milestone 第 1+2 phase ship pattern — 第 3 phase ship 推进 milestone 75%):

- 3 phase ship: Phase 3.1 (checkpoint engine + harnessed resume + compact) + Phase 3.2 (gstack prefix probe + workflow interpolate + plan-feature 5-phase WIRED) + Phase 3.3 (aliases.yaml RICH + DOCTOR-ONLY-WARN + known-good lock) = 3/4
- 16 ADR + 16 baseline tag accumulate (0001-0016)
- 12 milestone tag accumulate (sister v0.1.0+v0.2.0 9 个 + v0.3.0-alpha.1-checkpoint + v0.3.0-alpha.2-plan-feature + v0.3.0-alpha.3-aliases-known-good)
- Tests baseline: 623 → 659+ (W1 +27 fixture schemas + loaders + helper + doctor 7th + W2 +10 fixture e2e + security); 3-OS CI matrix 全绿
- W1 T1.4-T1.5 manifest-domain colocation 3rd consumer (Phase 1.X spec.ts/metadata.ts + Phase 3.2 workflow/schema/ + Phase 3.3 manifest/schema/) + W2 T2.1-T2.3 R7.5 + R7.6 e2e acceptance + D-02 observability守门 + W2 T2.10 baseline tag adr-0016-accepted push = "Adoption confirmed" 实证

**Deferred items disposition** (Wave 2 ship-time review):
- DEFERRED #AC (aliases.yaml dogfood actual deprecation entries) → Phase 3.4 dogfood (本 phase MVP empty `aliases: {}` map)
- DEFERRED #AD (install.ts harnessed_version source-of-truth — hardcoded '0.3.0' TODO marker) → Phase 3.4 reads from package.json
- DEFERRED #AE (path traversal regex hardening for resolveAlias) → Phase 3.4 dogfood 真攻击面后 evaluate
- DEFERRED #2 (dashboard-sse pre-existing flaky) ✅ RESOLVED Phase 3.3 W0.2 (fix path (a) random ephemeral port + DASHBOARD_PORT env injection — Phase 3.2 RETRO carry-forward closed)
- EE-4 BLOCKER auto-spawn rerun → Phase 3.4 后 evaluate (carry-forward unchanged)
- userSpawn session_id capture (Phase 3.1 DEFERRED #2) → Phase 3.4+ if real userSpawn demand (fresh-session fallback per B-02 still acceptable)
- plan-feature 真接外部 gsd-* spawn (D-03 WIRED MVP Phase 3.2) → Phase 3.3+ dogfood 时 transition stub → real (Phase 3.3 本身仅 infra prep; Phase 3.4 dogfood seed actual pinned versions 是 sister event)

## References

### 内部依据

- `docs/adr/0015-gstack-probe-interpolate-plan-feature.md` (Phase 3.2 ship base — 9 章节 errata sister template direct analog)
- `docs/adr/0014-checkpoint-engine-resume-compact.md` (Phase 3.1 ship base — schema colocation 起源)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `src/cli/install.ts` (W1 T1.9 — 117→140L resolveAlias 1-line surgical pre-manifest-lookup + --known-good flag lazy consume, ≤200L Karpathy clean)
- `src/cli/doctor.ts` (W1 T1.7 — 184→195L 7th check checkDeprecations, ≤200L Karpathy clean)
- `src/cli/lib/check-deprecations.ts` (W1 T1.6 NEW 43L — single-responsibility helper extract sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L precedent)
- `src/manifest/aliases.ts` (W1 T1.4 NEW 47L — D-01 RICH consumer + memoize + listDeprecations)
- `src/manifest/knownGood.ts` (W1 T1.5 NEW 46L — D-03 YAML manifest consumer + per-version Map memoize)
- `src/manifest/schema/aliases.v1.ts` (W1 T1.2 NEW 34L — 12th schemaVersion surface + ISO-date pattern sister Phase 3.2 W2 Rule 1 lesson)
- `src/manifest/schema/known-good.v1.ts` (W1 T1.3 NEW 33L — 13th schemaVersion surface + semver pattern strict)
- `src/types/schemaVersion.ts` (W0 T0.5 + W1 T1.1 — 10 → 13 surface additive: planFeature.v1 backfill + aliases.v1 + known-good.v1)
- `manifests/aliases.yaml` (W1 T1.10 NEW 14L — RICH MVP empty seed, Phase 3.4 dogfood 填充 first actual deprecation entries)
- `versions/0.3.0-known-good.yaml` (W1 T1.11 NEW 9L — MVP empty upstreams: [] seed, Phase 3.4 dogfood 填 e2e-verified pinned versions)
- `tests/integration/install-aliases.test.ts` (W2 T2.1 NEW ~110L — 3 fixture R7.5 验收 模拟上游改名场景 install 通过)
- `tests/integration/install-known-good.test.ts` (W2 T2.2 NEW ~90L — 2 fixture R7.6 验收 --known-good reproducible)
- `tests/integration/install-silent-redirect.test.ts` (W2 T2.3 NEW ~60L — 1 fixture D-02 observability守门)
- `tests/manifest/aliases-security.test.ts` + `knownGood-security.test.ts` (W2 T2.4 NEW ~110L — 4 fixture STRIDE T-3.3-01 + T-3.3-03 + T-3.3-05)
- `scripts/dashboard.mjs` (W0.2 T0.2 +1L env-var override DASHBOARD_PORT) + `tests/scripts/dashboard-sse.test.ts` (W0.2 T0.2 ~+12L getEphemeralPort + env injection)
- `scripts/check-transparency-verdicts.mjs` (W0.1 T0.1 +10L STATE_POSITION_RE OR-fallback)
- `.planning/STATE.md` (W0.1 T0.1 L4+L5 删除 5-recurrence terminus + W2 T2.6 当前位置块 + 历史 entry 续编)
- `.github/workflows/ci.yml` (W2 T2.7 A7 iter `1-0015` → `1-0016` per W-02 explicit literal fix)
- `.planning/phase-3.3/{3.3-KICKOFF, 3.3-CONTEXT, PATTERNS, RESEARCH, ASSUMPTIONS, PLAN, task_plan, W0.3-schema-decision, DOGFOOD-T2.8}.md`

### 外部参考

- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律
- `.planning/ROADMAP.md` L163-165 (Phase 3.3 验收: "模拟上游改名场景 install 通过")
- `.planning/REQUIREMENTS.md` R7.5 + R7.6 (aliases.yaml 重定向 install 通过 + harnessed install --known-good reproducible)
- `docs/PROJECT-SPEC.md` § 5 (manifest deprecation marker + aliases.yaml + known-good 版本组合 立项参数)
- Node `net.createServer({port:0})` MDN std (W0.2 dashboard-sse fix path (a) random ephemeral port pattern)
- npm-lock convention (D-03 known-good evaluated rejected — 项目未用 npm-lock + yaml convention sister)
