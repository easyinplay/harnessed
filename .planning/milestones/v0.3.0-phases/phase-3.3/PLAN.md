---
phase: 3.3
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  # W0 backlog absorb (3 项 — W0.1 D-04 STATE COLLAPSE / W0.2 dashboard-sse flaky 根治 / W0.3 schema decision doc)
  - .planning/STATE.md                                # W0.1 — 删 L4 frontmatter `> Status:` 行 + 删 L5 `> 最后更新：` 行 (D-04 COLLAPSE 5-recurrence terminus; "当前位置" L21-27 块 single SSOT 保留)
  - scripts/check-transparency-verdicts.mjs           # W0.1 — 加 STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m 全文 OR-fallback for STATE.md only (RESEARCH § 6.2 verbatim, ~10L delta; README + PROJECT-SPEC unchanged)
  - scripts/dashboard.mjs                             # W0.2 — L39 const PORT = 47180 → const PORT = Number(process.env.DASHBOARD_PORT ?? 47180) (additive, prod default preserved; +1L delta; RESEARCH § 7.1 Step 1 verbatim)
  - tests/scripts/dashboard-sse.test.ts               # W0.2 — random ephemeral port via net.createServer().listen(0) + DASHBOARD_PORT env injection + 8s waitFor sister Phase 2.4 W4 Win 3-tier (RESEARCH § 7.1 Step 2 verbatim; +12L net delta well under ≤40L spec)
  - .planning/phase-3.3/W0.3-schema-decision.md       # W0.3 — schemaVersion 12+13 surface decision record (NEW aliases.v1 + known-good.v1 sister Phase 3.2 W0.3 76L 直接 model; path divergence section MANIFEST-domain colocation rule per RESEARCH § 9.2)
  # W0.5 — schemaVersion 11th surface backfill (planFeature.v1 sister Phase 3.2 W2 T2.2 b875e21 latent stale claim fix per sister Phase 3.2 W2 T2.6 c37ee29 Rule 1 surgical pattern)
  - src/types/schemaVersion.ts                        # W0 T0.5 (FIRST touch) — MODIFY +4-5L planFeature.v1 11th surface register backfill (SCHEMA_VERSIONS const + SchemaVersionLiteral Union both extend +1 entry; JSDoc 加 11th surface line); subsequent W1 T1.1 extends 11→13
  - src/workflow/schema/planFeature.ts                # W0 T0.5 (conditional) — IF current hard-coded literal swap to SCHEMA_VERSIONS.planFeature import sister Phase 3.1 W1 8th surface pattern; ELSE no-op (current state has no schemaVersion field on PlanFeatureWorkflowV1)
  - tests/unit/types-schemaVersion.test.ts            # W0 T0.5 (FIRST touch) — MODIFY 3 places: describe block 10→11 + .toHaveLength(10) → .toHaveLength(11) + expectedSurfaces add 'plan-feature' (sister Phase 3.1 W1 T1.4 pattern); subsequent W1 T1.12 extends to 13 surfaces
  # W1 — schemas (12+13 surface) + manifest loaders + check helper + doctor 7th wire + install resolveAlias + --known-good flag + 2 yaml seed
  - src/types/schemaVersion.ts                        # W1 T1.1 — MODIFY 10 actual baseline → 11 (T0.5 backfill planFeature.v1 sister Phase 3.2 W2 T2.2 b875e21 stale claim fix) → 13 surface (+aliases.v1 12th + known-good.v1 13th W1 T1.1; +4L delta W1 cross 2 处: SCHEMA_VERSIONS const + SchemaVersionLiteral Union + ~4-5L T0.5 delta; sister Phase 3.2 W1 T1.1 8→10 双加 precedent + sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical fix pattern for T0.5)
  - src/manifest/schema/aliases.v1.ts                 # W1 T1.2 — NEW ≤40L (D-01 RICH; TypeBox AliasEntryV1 含 redirect + reason maxLength:500 + since_version semver pattern + deprecation_date ISO-date pattern + removal_date Optional; AliasesV1 wraps schemaVersion Literal + aliases Record<string, AliasEntryV1>; manifest-domain colocation per RESEARCH § 5.3 + sister governance.ts pattern)
  - src/manifest/schema/known-good.v1.ts              # W1 T1.3 — NEW ≤45L (D-03 YAML manifest; TypeBox PinnedUpstream {name + version + install_method} + KnownGoodV1 {schemaVersion + harnessed_version semver pattern + e2e_verified_at ISO-date pattern + upstreams: Array}; install_method 字符串非 InstallType enum 避 schema drift coupling per RESEARCH § 4.2)
  - src/manifest/aliases.ts                           # W1 T1.4 — NEW ≤40L (loadAliases() fail-soft + resolveAlias(name) + listDeprecations() consumer; memoized 1-read per process Karpathy YAGNI; sister state.ts L23-41 fail-soft read 模式直接复刻; yaml.parse + Value.Check + Karpathy fail-loud throw on schema invalid per RESEARCH § 2.3)
  - src/manifest/knownGood.ts                         # W1 T1.5 — NEW ≤45L (loadKnownGood(harnessedVer) + getPinnedVersion(upstreamName, harnessedVer); memoized Map<harnessedVer, KnownGoodV1Type|null>; lazy load only when --known-good flag triggers consume per RESEARCH § 4.4 Karpathy YAGNI lock; sister aliases.ts L23-41 fail-soft read 模式)
  - src/cli/lib/check-deprecations.ts                 # W1 T1.6 — NEW ≤40L PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L sister-share extract 守 doctor.ts ≤200L); checkDeprecations(): CheckResult dispatch — table format multi-deprecation aggregation per Discretion locked RESEARCH § 3.2 verbatim
  - src/cli/doctor.ts                                 # W1 T1.7 — MODIFY +5L (7th check checkDeprecations dispatch sister L138-142 checkGstackPrefix 100% reuse; results array push 7th entry; description string 加 'deprecations'; 184→~189L ≤ 200L Karpathy clean; sister 6th 已实证 +5L NOT 需 B-03 5% tolerance per RESEARCH § 12.3)
  - src/cli/install.ts                                # W1 T1.8 + T1.9 — MODIFY ~+10L (T1.8 +2L: pre-manifest-lookup resolveAlias inject 1-line surgical per RESEARCH § 8.1 verbatim — D-02 silent redirect NO console.warn; T1.9 +8L: --known-good commander option + RawOpts.knownGood + lazy import on flag detect + npm-cli npm_version override per RESEARCH § 4.3); 117→~127L ≤ 200L
  - manifests/aliases.yaml                            # W1 T1.10 — NEW empty seed ~10L (schemaVersion: harnessed.aliases.v1 + aliases: {} empty Record MVP; Phase 3.4 dogfood adds first actual deprecation entries per CONTEXT specifics + RESEARCH § 2.2 verbatim)
  - versions/0.3.0-known-good.yaml                    # W1 T1.11 — NEW empty seed ~10L (NEW versions/ 顶层 dir + 0.3.0-known-good.yaml schemaVersion: harnessed.known-good.v1 + harnessed_version: 0.3.0 + e2e_verified_at: 2026-05-17 + upstreams: [] MVP; Phase 3.4 dogfood adds actual e2e-verified pinned per RESEARCH § 4.1 verbatim)
  # W1 tests
  - tests/manifest/schema/aliases-v1.test.ts          # NEW ~50L (4 fixture TypeBox contract: happy / missing required field / extra field reject / invalid ISO-date pattern reject) — 12th surface schema lock per RESEARCH § 10.1 dimension contractual
  - tests/manifest/schema/known-good-v1.test.ts       # NEW ~50L (4 fixture TypeBox contract: happy / missing required / extra field reject / invalid semver harnessed_version reject) — 13th surface schema lock
  - tests/manifest/aliases.test.ts                    # NEW ~60L (5 fixture: file missing → null fail-soft / empty aliases:{} record / 1-entry resolveAlias hit / unknown name resolveAlias null fallback / corrupt yaml → throw fail-loud) — sister state.test.ts vi.mock pattern
  - tests/manifest/knownGood.test.ts                  # NEW ~60L (5 fixture: file missing → null / empty upstreams:[] → null pinned / 3-entry getPinnedVersion hit / unknown upstream → null fallback / schema drift → throw)
  - tests/cli/check-deprecations.test.ts              # NEW ~50L (5 fixture: aliases.yaml missing → status='pass' / empty aliases → 'pass' / 1 deprecation → 'warn' + message contains old/new / 3 deprecations → 'warn' + table format / corrupt aliases → 'fail' with fix hint)
  - tests/unit/types-schemaVersion.test.ts            # MODIFY ~+5L (13-surface count assertion + 2 new tests for aliases + knownGood register) — migration dimension per RESEARCH § 10.1
  - tests/cli/doctor.test.ts                          # MODIFY ~+10L (1 new test: 7th check dispatch returns CheckResult with name='deprecated manifests'; exit code matrix verify warn ≠ fail per B-06 sister Phase 2.4)
  - tests/cli/doctor-fixtures.test.ts                 # MODIFY ~+10L (7th check 加入 6-check fixtures parametrize sister Phase 3.2 W1 sister 6-check pattern)
  # W2 — e2e integration + observability + security + ADR + STATE/RETRO/ROADMAP + ship
  - tests/integration/install-aliases.test.ts         # W2 T2.1 — NEW ~80L (3 fixture e2e R7.5 验收: 模拟上游改名场景 install 通过 — fixture 1 install old-name → resolveAlias redirect → manifests/tools/new-name.yaml 实读 + install 成功 + exit 0; fixture 2 unknown name + no alias → fail exit 1; fixture 3 alias 存在但 redirect target manifest 缺 → install fail-loud)
  - tests/integration/install-known-good.test.ts      # W2 T2.2 — NEW ~70L (2 fixture e2e R7.6 验收: harnessed install --known-good reproducible — fixture 1 upstream 在 lock + npm-cli method → npm_version override 生效; fixture 2 upstream 不在 lock → fallback to manifest default version)
  - tests/integration/install-silent-redirect.test.ts # W2 T2.3 — NEW ~50L (1 fixture observability: install redirect path stdout/stderr NOT 含 'redirect|deprecated' substring — D-02 silent redirect 守门; sister Phase 3.2 W2 assertion pattern)
  - tests/manifest/aliases-security.test.ts           # W2 T2.4 — NEW ~50L (2 fixture security: path traversal redirect attempt {redirect: '../../../etc/passwd'} → Value.Check fail OR path.resolve cwd-bound reject; additionalProperties:false extra field 反 strict reject per RESEARCH § 10.4 verbatim threat model)
  - tests/manifest/knownGood-security.test.ts         # W2 T2.4 — NEW ~30L (1 fixture security: malicious harnessed_version '9.9.9.invalid' OR garbage → Value.Check semver pattern fail; sister aliases-security pattern)
  - docs/adr/0016-aliases-deprecation-known-good.md   # W2 T2.5 — NEW ~150L (Phase 3.3 ADR 9 章节 errata sister Phase 3.2 ADR 0015 模式: 1 D-01 RICH aliases / 2 D-02 DOCTOR-ONLY-WARN / 3 D-03 YAML known-good / 4 D-04 STATE COLLAPSE 5-recurrence terminus / 5 § 5 schemaVersion 12+13 surface manifest-domain colocation / 6 § 8 install resolveAlias inject pre-lookup / 7 § 7 dashboard-sse fix path (a) random port + DASHBOARD_PORT env / 8 § 12 3-wave W0-W2 topology / 9 ASR/ADR-stats)
  - .planning/STATE.md                                # W2 T2.6 — append Phase 3.3 SHIPPED event log + 当前位置 块更新 + 12th 历史 entry (D-04 单 SSOT 后保留 当前位置 块作 SoT)
  - .planning/RETROSPECTIVE.md                        # W2 T2.7 — Phase 3.3 milestone retrospective entry (W0.1 D-04 5-recurrence terminus lesson + W0.2 dashboard-sse fix path (a) lesson + W1 manifest-domain colocation 3rd consumer pattern + W2 install resolveAlias 1-line surgical + D-02 silent install observability)
  - .planning/ROADMAP.md                              # W2 T2.8 — Phase 3.3 ✅ SHIPPED marker + v0.3.0 3/4 progress (Phase 3.1 + 3.2 + 3.3 ship; Phase 3.4 pending) + Phase 3.4 prereq carry-forward (路由命中率 ≥ 85% + token budget + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml)

autonomous: true

requirements:
  - R7.5  # manifests/aliases.yaml 重定向 + deprecation_marker doctor/install 显示提示; 验收 模拟上游改名场景 install 通过 + 提示 (R7.5 → 4 acceptance: aliases.yaml schema validate + resolveAlias works + doctor 7th check warns deprecations + install 静默重定向)
  - R7.6  # 每个 harnessed 版本冻结一组通过 e2e 的上游版本 lock; 验收 harnessed install --known-good reproducible (R7.6 → 2 acceptance: versions/0.3.0-known-good.yaml schema validate + harnessed install --known-good 解 pinned version override manifest default)

# user_setup: 无 — 本 phase 0 external service dependency (aliases.yaml + known-good.yaml 是 git-tracked metadata + 项目自身 manifest convention; 无新 npm dep, sister Phase 3.2 zero-dep cadence延续 per RESEARCH § 16)

must_haves:
  truths:
    # R7.5 — aliases.yaml + deprecation marker (D-01 RICH + D-02 DOCTOR-ONLY-WARN)
    - "developer can place an entry in manifests/aliases.yaml with shape `{<old-name>: { redirect: <new-name>, reason, since_version, deprecation_date, removal_date? }}` and TypeBox Value.Check(AliasesV1, parsed) returns true; invalid shapes (missing required field / extra field / bad ISO-date pattern / bad semver pattern) return false (12th surface schema lock, 4 fixture test coverage)"
    - "developer can call `resolveAlias('old-name')` from src/manifest/aliases.ts and receive the redirect target string when alias registered; receive null when no alias for the name; loadAliases() returns null fail-soft when manifests/aliases.yaml file absent (sister state.ts L23-41 fail-soft read 模式 100% reuse); throws Karpathy fail-loud Error when yaml exists but schema invalid (debug locality)"
    - "developer can run `harnessed doctor` on a project with manifests/aliases.yaml containing 0 deprecations and see 7th check `deprecated manifests — no deprecated manifests` status=pass; on project with N≥1 deprecations see `N deprecated manifest(s)` status=warn + table format multi-line message (Discretion locked per RESEARCH § 3.3) + fix hint `install paths auto-redirect; consider migrating manifest references` — doctor exit code 0 unchanged (warn ≠ fail per B-06 sister Phase 2.4 W3)"
    - "developer can run `harnessed doctor --json` and the JSON output `checks[]` array contains 7th entry `{name:'deprecated manifests', status:'pass'|'warn'|'fail', message, fix?}` consumable by CI (sister Phase 2.4 D-01 --json array-aggregate pattern); table format multi-line preserved in message field"
    - "developer can run `harnessed install <old-name>` on a project with aliases.yaml registering old-name → new-name and the install proceeds silently to install new-name (D-02 DOCTOR-ONLY-WARN locked: stdout/stderr NOT contain 'redirect' OR 'deprecated' substring; install observability test守门 — install path 仅 redirect, doctor surface warning); install exit code 0 if redirect target manifest exists, exit 1 with manifest-not-found error if redirect target missing (fail-loud)"

    # R7.6 — known-good 版本组合 (D-03 YAML manifest)
    - "developer can place YAML lock at `versions/0.3.0-known-good.yaml` with shape `{schemaVersion: 'harnessed.known-good.v1', harnessed_version: '0.3.0', e2e_verified_at: '2026-05-17', upstreams: [{name, version, install_method}]}` and TypeBox Value.Check(KnownGoodV1, parsed) returns true; invalid harnessed_version (non-semver) OR invalid e2e_verified_at (non-ISO-date) → Value.Check false (13th surface schema lock, 4 fixture)"
    - "developer can call `getPinnedVersion('claude-agent-sdk', '0.3.0')` from src/manifest/knownGood.ts and receive the pinned version string when upstream registered in lock; receive null when upstream not in lock OR no lock file for harnessedVer (caller `?? manifest.spec.install.npm_version` fallback per install.ts T1.9); loadKnownGood lazy load only on --known-good flag detect (Karpathy YAGNI locked Discretion per RESEARCH § 4.3)"
    - "developer can run `harnessed install <name> --known-good` and the install proceeds with `manifest.spec.install.npm_version` overridden by `getPinnedVersion(name, '0.3.0')` when (a) manifest install method is 'npm-cli' AND (b) upstream registered in versions/0.3.0-known-good.yaml — sister Phase 2.1 npm-cli install method per CD-2 install method registry; --known-good flag without pinned version (upstream not in lock OR empty upstreams:[]) → fallback to manifest default npm_version (graceful)"
    - "developer running `harnessed install <name>` WITHOUT --known-good flag does NOT trigger loadKnownGood() at all (lazy load 守门; Karpathy YAGNI Discretion lock; perf bench verify cold-start install NOT 调 fs.readFileSync on versions/ path via vi.spy assertion)"

    # Schema discipline — 12th + 13th surface single 兼容门 (CD-5)
    - "every new schema (planFeature.v1 T0.5 backfill + aliases.v1 + knownGood.v1) goes through src/types/schemaVersion.ts SCHEMA_VERSIONS const + SchemaVersionLiteral Union (10 actual baseline → 11 T0.5 backfill planFeature.v1 → 13 W1 double-add aliases + knownGood, sister Phase 3.2 W1 T1.1 9+10 双加 precedent模式 12+13 双加 + sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical fix pattern for T0.5 stale b875e21 register backfill); consume sites (aliases.ts loadAliases + knownGood.ts loadKnownGood) optionally use branchOnSchemaVersion<T>() OR direct Value.Check (v1-only surfaces no version branching needed); `grep -cE 'harnessed\\.\\w+\\.v1' src/types/schemaVersion.ts` ≥ 13 (10 actual baseline + 1 T0.5 backfill + 2 W1 double-add = 13 final)"

    # Karpathy hard limit (B-06/B-26) per-file ≤ 200L + each NEW per spec limit
    - "every NEW src/ file fits Karpathy hard limit ≤ 200L AND per-spec budgets: check-deprecations.ts ≤ 40L (PRIMARY helper sister probe-gstack 48L 守 doctor.ts ≤ 200L), aliases.ts ≤ 40L (sister state.ts read 模式), knownGood.ts ≤ 45L (sister aliases.ts + Map cache), aliases.v1.ts ≤ 40L (sister governance.ts TypeBox shape), known-good.v1.ts ≤ 45L (sister aliases.v1.ts + Array shape); doctor.ts MODIFY 184 → ~189L ≤ 200L Karpathy clean (no B-03 5% tolerance needed per RESEARCH § 12.3 verified baseline); install.ts MODIFY 117 → ~127L ≤ 200L"

    # W0 backlog absorb — 3 项 one-shot 根治 (D-04 5-recurrence terminus + dashboard-sse flaky + schema decision doc)
    - "Wave 0 3 项 backlog 一次根治: W0.1 (D-04 LOCKED) STATE.md L4 `> Status:` + L5 `> 最后更新：` 两行删 (5-recurrence pattern terminus: README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置块 dual) + `当前位置` block L21-27 single SSOT 保留 + scripts/check-transparency-verdicts.mjs 加 STATE_POSITION_RE OR-fallback for STATE.md only (README + PROJECT-SPEC unchanged) per RESEARCH § 6.2 verbatim; W0.2 (Phase 3.2 deferred #2) dashboard-sse 4 cell flaky 根治 fix path (a) random ephemeral port + DASHBOARD_PORT env per RESEARCH § 7.1 verbatim — dashboard.mjs L39 const PORT additive env-var override (+1L), dashboard-sse.test.ts random port via net.createServer({port:0}) + spawn env injection + 8s waitFor sister Phase 2.4 W4 Win 3-tier (+12L net); W0.3 .planning/phase-3.3/W0.3-schema-decision.md NEW ~60L recording 12+13 surface double-add decision (manifest-domain colocation rule + sister Phase 3.2 W0.3 76L 直接 model + path divergence section)"
    - "Wave 0 dashboard.mjs no FIX required beyond L39 env-var additive change — D-04 STATE COLLAPSE has 0 dashboard parsing dependency per RESEARCH § 1.1 verified (12-match grep 全 categorize: dashboard 仅 head(state, 35) generic markdown render + watcher filename-only + `/api/project/<id>/state` raw text serve; NO L4 Status: regex extract; ADR scope L322 regex is unrelated docs/adr/*.md scope); planner DROPS CONTEXT.md L160 'spike 1h 评估' sub-step (already Wave A verified safe)"

    # ADR 0016 + ship + A7 守恒
    - "ADR 0016 errata accepted 9 章节 (1 D-01 RICH aliases 5 fields + reason maxLength 500 + ISO-date pattern not FormatRegistry + 2 D-02 DOCTOR-ONLY-WARN install silent + doctor 7th table format + 3 D-03 YAML manifest versions/0.3.0-known-good.yaml + lazy load + 4 D-04 STATE COLLAPSE 5-recurrence terminus + STATE_POSITION_RE OR-fallback + 5 § 5 schemaVersion 12+13 surface manifest-domain colocation + 6 § 8 install resolveAlias pre-manifest-lookup 1-line surgical + 7 § 7 dashboard-sse fix path (a) random port + DASHBOARD_PORT env + 8 § 12 3-wave W0-W2 topology + 9 ASR/ADR-stats sister Phase 3.2 ADR 0015); ADR 0001-0015 main body 0 diff verify (A7 守恒 iter 1-0015 → 1-0016 sister Phase 3.2 T3.6 pattern)"
    - "Phase 3.3 self-dogfood acceptance: R7.5 模拟上游改名场景 install 通过 — install-aliases integration 3 fixture pass (rename redirect + unknown fail-loud + alias-but-target-missing fail-loud); R7.6 harnessed install --known-good reproducible — install-known-good integration 2 fixture pass (npm_version override + fallback graceful); baseline tag adr-0016-accepted + milestone tag v0.3.0-alpha.3-aliases-known-good pushed"

  artifacts:
    # W0 artifacts
    - path: ".planning/STATE.md"
      provides: "W0.1 D-04 COLLAPSE: 删 L4 `> Status: v0.1.0 SHIPPED & ARCHIVED · ...` 整行 + 删 L5 `> 最后更新：2026-05-17（...）` 整行; L21-27 当前位置块保留作 single SSOT (含 `**Phase 3.2 SHIPPED**` literal + L24 当前里程碑 + L25 下一 phase + L26 状态 + L27 进度); W2 ship 续编 12th 历史 entry + Phase 3.3 SHIPPED event log; 5-recurrence pattern terminus 记录 in commit msg (README L9 / L44 / PROJECT-SPEC / STATE freshness / STATE 当前位置 dual → COLLAPSE single)"
      contains: "当前位置"

    - path: "scripts/check-transparency-verdicts.mjs"
      provides: "W0.1 freshness gate 扩 STATE_POSITION_RE OR-fallback for STATE.md only: 加 `const STATE_POSITION_RE = /\\*\\*Phase [1-9]\\.[0-9]+ SHIPPED\\*\\*/m` 顶部 (~L21 sister STATUS_MARKER + STATE_LATEST_SUBPHASE_RE existing); checkFreshness L53-91 modify — STATE.md branch (`file === '.planning/STATE.md'`) when STATUS_MARKER 不匹配 → fallback to full-file scan `STATE_POSITION_RE.test(content)` exit 0 if matches (README + PROJECT-SPEC unchanged behavior); ~10L delta total; sister Phase 2.4 H2 1-line fix range模式 + Phase 2.2 W2 T2.0 STATE.md FRONT_MATTER_DOCS 加 pattern"
      contains: "STATE_POSITION_RE"

    - path: "scripts/dashboard.mjs"
      provides: "W0.2 L39 MODIFY: `const PORT = 47180` → `const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)` (env-var override additive; prod default 47180 preserved zero behavior change; +1L delta); RESEARCH § 7.1 Step 1 verbatim; test 既存 L3-4 comment 'override via DASHBOARD_PORT env var if we add it later' 现 Phase 3.3 W0.2 兑现 exactly that designed name"

    - path: "tests/scripts/dashboard-sse.test.ts"
      provides: "W0.2 4 cell flaky fix path (a) random ephemeral port + DASHBOARD_PORT env injection: import createServer from 'node:net' + getEphemeralPort(): Promise<number> helper (net.createServer().listen(0) → addr.port → close) + L17 `const PORT = 47180` → `let PORT = 0` (populated in beforeAll) + L84-107 beforeAll 加 `PORT = await getEphemeralPort()` + spawn env `{...process.env, DASHBOARD_PORT: String(PORT)}` injection + waitFor 8s timeout sister Phase 2.4 W4 Win 3-tier + remove L84-94 portTaken probe + L116-155 4 cells 删 `if (portTaken.value) return` skip branches (always run); +12L net delta (within ≤40L spec); RESEARCH § 7.1 Step 2 verbatim"
      contains: "DASHBOARD_PORT"

    - path: ".planning/phase-3.3/W0.3-schema-decision.md"
      provides: "W0.3 NEW ~60L decision record per sister Phase 3.2 W0.3 76L 模板: Decision section (NEW double-add aliases.v1 12th + knownGood.v1 13th surface) + Rationale 4 子 (Karpathy single-responsibility + manifest-domain colocation + sister Phase 3.2 W1 9+10 双加 precedent + sister Phase 3.1 W1 8th surface colocation 模式延续) + Path divergence from PATTERNS.md section (manifest-domain colocation rule: schemas live with primary consumers — aliases + knownGood = manifest-domain consumed by src/manifest/*.ts + src/cli/install.ts; NOT workflow/schema/ NOT checkpoint/schema/; PATTERNS.md § 1 row 4 already places at manifest/schema/ so 本 phase 是 confirmation NOT divergence) + Schema specs × 2 (aliases.v1 + known-good.v1 TypeBox blocks excerpt) + Implementation order (W1 T1.1-T1.5) + Verification (grep commands)"
      contains: "Path divergence"

    # W1 artifacts — schemas + manifest + check helper + doctor 7th + install integrate
    - path: "src/types/schemaVersion.ts"
      provides: "11th + 12th + 13th surface registered cumulative: planFeature = 'harnessed.plan-feature.v1' (T0.5 backfill sister Phase 3.2 W2 T2.2 b875e21 stale claim fix) + aliases = 'harnessed.aliases.v1' + knownGood = 'harnessed.known-good.v1' (W1 T1.1 double-add per sister Phase 3.2 W1 T1.1 9+10 双加 precedent); SCHEMA_VERSIONS const + SchemaVersionLiteral Union both extended (+1 T0.5, +2 W1) = 10 actual baseline → 13 final; branchOnSchemaVersion<T> helper unchanged signature; JSDoc comment block L13-26 加 3 行 surfaces 11-13 描述 (T0.5 加 11th planFeature line + W1 T1.1 加 12th aliases + 13th knownGood lines)"
      contains: "harnessed.known-good.v1"

    - path: "src/manifest/schema/aliases.v1.ts"
      provides: "NEW ≤40L TypeBox AliasesV1 (D-01 RICH 12th surface, manifest-domain colocation per RESEARCH § 5.3): AliasEntryV1 = Type.Object{redirect minLength 1, reason minLength 1 maxLength 500 (DOS cap sister governance.ts), since_version pattern semver `^\\d+\\.\\d+\\.\\d+$`, deprecation_date pattern ISO `^\\d{4}-\\d{2}-\\d{2}$` (NOT FormatRegistry sister Phase 3.2 W2 Rule 1 lesson), removal_date Optional pattern ISO} additionalProperties:false strict; AliasesV1 = Type.Object{schemaVersion: Literal(SCHEMA_VERSIONS.aliases), aliases: Type.Record(Type.String{minLength:1}, AliasEntryV1)} strict; Static<typeof> export"
      exports: ["AliasEntryV1", "AliasesV1", "AliasEntryV1Type", "AliasesV1Type"]

    - path: "src/manifest/schema/known-good.v1.ts"
      provides: "NEW ≤45L TypeBox KnownGoodV1 (D-03 YAML manifest 13th surface): PinnedUpstream = Type.Object{name minLength 1, version minLength 1, install_method minLength 1 (free-form string non-enum 避 InstallType union coupling per RESEARCH § 4.2)} strict; KnownGoodV1 = Type.Object{schemaVersion: Literal(SCHEMA_VERSIONS.knownGood), harnessed_version: pattern semver, e2e_verified_at: pattern ISO-date, upstreams: Array(PinnedUpstream)} strict; Static<typeof> export"
      exports: ["PinnedUpstream", "KnownGoodV1", "KnownGoodV1Type"]

    - path: "src/manifest/aliases.ts"
      provides: "NEW ≤40L loadAliases (memoized 1-read per process, fail-soft null on file missing, Karpathy fail-loud throw on schema invalid with first 3 Value.Errors excerpt) + resolveAlias(name): string|null thin wrap (loadAliases?.aliases?.[name]?.redirect ?? null) + listDeprecations(): Array<{old, entry}> consumer for doctor 7th check; sister state.ts L23-41 fail-soft read 模式 + sister manifest/validate.ts yaml.parse 模式; ALIASES_PATH = 'manifests/aliases.yaml' (project-tracked NOT runtime state, NOT .harnessed/ 路径)"
      exports: ["loadAliases", "resolveAlias", "listDeprecations"]

    - path: "src/manifest/knownGood.ts"
      provides: "NEW ≤45L loadKnownGood(harnessedVer) (memoized Map<harnessedVer, KnownGoodV1Type|null>, fail-soft null on file missing, Karpathy fail-loud throw on schema invalid) + getPinnedVersion(upstreamName, harnessedVer): string|null thin lookup (.upstreams.find(u => u.name === upstreamName)?.version ?? null); Karpathy YAGNI: only consume when --known-good flag triggers (lazy load locked Discretion per RESEARCH § 4.3); path 构造 versions/${harnessedVer}-known-good.yaml (sister install.ts L66 manifests/tools/${name}.yaml 范式)"
      exports: ["loadKnownGood", "getPinnedVersion"]

    - path: "src/cli/lib/check-deprecations.ts"
      provides: "NEW ≤40L PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L sister-share extract pattern for Karpathy ≤200L 守 doctor.ts): checkDeprecations(): CheckResult — try { listDeprecations() } → empty: pass + 'no deprecated manifests'; N entries: warn + multi-line table format `'old' → 'new' (since X, date Y, removes Z; reason)` + fix 'install paths auto-redirect; consider migrating manifest references' / catch: fail + load error message + fix 'verify manifests/aliases.yaml schema (see docs/PROJECT-SPEC.md § R04 P2#13)'; D-02 DOCTOR-ONLY-WARN status=warn ≠ fail (B-06 sister Phase 2.4 W3 doctor exit code map); table aggregation per Discretion locked RESEARCH § 3.2 verbatim"
      exports: ["checkDeprecations", "CheckResult"]

    - path: "src/cli/doctor.ts"
      provides: "MODIFY +5L (7th check checkDeprecations dispatch sister L138-142 checkGstackPrefix 100% reuse): async function checkDeprecations() dynamic import + delegate (~4L NEW function); results array L150-157 push 7th entry `await checkDeprecations()` (+1L); description string L139 加 'deprecations' (e.g. 'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations)'); FINAL 184 → ~189L ≤ 200L Karpathy hard limit clean (no B-03 5% tolerance needed per RESEARCH § 12.3 verified baseline)"
      contains: "checkDeprecations"

    - path: "src/cli/install.ts"
      provides: "MODIFY ~+10L (T1.8 resolveAlias pre-lookup inject 1-line surgical per RESEARCH § 8.1 verbatim — D-02 silent redirect locked NO console.warn; T1.9 --known-good commander option + RawOpts.knownGood + lazy import on flag detect + npm_version override per RESEARCH § 4.3): L46-56 加 `.option('--known-good', 'use known-good version lock from versions/<harnessed-ver>-known-good.yaml')` commander option + L65-66 BEFORE manifestPath resolve insert `const { resolveAlias } = await import('../manifest/aliases.js'); const resolvedName = resolveAlias(name) ?? name` (then replace `name` with `resolvedName` in L66+L67 path constructions + L69+L74 readFile + L77+L78 error message) + L99 后 加 lazy --known-good consume block (if raw.knownGood → import getPinnedVersion + harnessedVer 硬码 '0.3.0' (TODO Phase 3.4 read from package.json) + if pinned AND install method npm-cli → override npm_version); 117 → ~127L ≤ 200L; RawOpts interface L30-37 加 `knownGood?: boolean`"
      contains: "resolveAlias"

    - path: "manifests/aliases.yaml"
      provides: "NEW empty seed ~10L (D-01 MVP per RESEARCH § 2.2 verbatim): `schemaVersion: harnessed.aliases.v1` + `aliases: {}` empty Record (Phase 3.4 dogfood adds first actual deprecation entries; commented example structure shows shape); 顶层 manifests/ dir (NOT subdir tools/ or skill-packs/ — aliases is metadata index NOT a manifest per CONTEXT D-01 L48)"
      contains: "harnessed.aliases.v1"

    - path: "versions/0.3.0-known-good.yaml"
      provides: "NEW 顶层 dir + empty seed file ~10L (D-03 MVP per RESEARCH § 4.1 verbatim + Claude's Discretion #4 推 ship 1 file with empty upstreams + e2e_verified_at: '2026-05-17' placeholder): `schemaVersion: harnessed.known-good.v1` + `harnessed_version: '0.3.0'` + `e2e_verified_at: '2026-05-17'` + `upstreams: []` empty Array MVP (Phase 3.4 dogfood adds actual e2e-verified pinned: claude-agent-sdk + gstack + etc); `versions/` 是 NEW 顶层 dir sister `manifests/` flat 平级"
      contains: "harnessed.known-good.v1"

    # W2 artifacts — integration e2e + observability + security + ADR + ship
    - path: "tests/integration/install-aliases.test.ts"
      provides: "NEW ~80L 3 fixture e2e R7.5 验收 (模拟上游改名场景 install 通过): fixture 1 rename redirect e2e — seed manifests/aliases.yaml {old-package-name: {redirect: 'ctx7', ...}} + run `harnessed install old-package-name --dry-run` + assert dry-run output references 'ctx7' manifest path + exit 0; fixture 2 unknown name + no alias → install fail with manifest-not-found + exit 1 (fail-loud Karpathy); fixture 3 alias 存在但 redirect target manifest 缺 → install fail-loud manifest-not-found (NOT crash with 'undefined manifest')"
      contains: "resolveAlias"

    - path: "tests/integration/install-known-good.test.ts"
      provides: "NEW ~70L 2 fixture e2e R7.6 验收 (harnessed install --known-good reproducible): fixture 1 lock hit — seed versions/0.3.0-known-good.yaml {upstreams: [{name: 'ctx7', version: '1.2.3', install_method: 'npm-cli'}]} + run `harnessed install ctx7 --known-good --dry-run` + assert dry-run output shows npm_version=1.2.3 (override manifest default); fixture 2 lock miss — seed lock with upstreams: [] empty + run same command + assert dry-run output falls back to manifest default npm_version (graceful)"

    - path: "tests/integration/install-silent-redirect.test.ts"
      provides: "NEW ~50L 1 fixture observability (D-02 silent install 守门): seed aliases.yaml {old-name: {redirect: 'ctx7', ...}} + run `harnessed install old-name --dry-run` + capture stdout AND stderr + assert NOT contain 'redirect' substring + assert NOT contain 'deprecated' substring + assert NOT contain 'warning' substring; install path仅 silent redirect, doctor surface separately (R7.5 验收 'install 通过' 语义对齐); sister Phase 3.2 W2 stdout assertion 范式"
      contains: "stdout"

    - path: "tests/manifest/aliases-security.test.ts"
      provides: "NEW ~50L 2 fixture security per RESEARCH § 10.4 threat model: fixture 1 path traversal redirect attempt — aliases.yaml {harmful: {redirect: '../../../etc/passwd', ...}} → Value.Check returns true (TypeBox 仅 length validate NOT content) BUT install.ts path resolve cwd-bound — 加 resolvedName 经 path.resolve('manifests/tools/${resolvedName}.yaml') 若 `..` chars 进入 resolvedName → assert resolve 不 leak cwd (Node path.resolve absolute-safe behavior verify); fixture 2 schema drift extra field tampering — aliases.yaml entry {redirect, reason, since_version, deprecation_date, removal_date, EXTRA_FIELD: 'malicious'} → additionalProperties:false strict reject → Value.Check returns false"

    - path: "tests/manifest/knownGood-security.test.ts"
      provides: "NEW ~30L 1 fixture security: malicious harnessed_version '9.9.9.invalid' OR garbage 'rm -rf /' → Value.Check semver pattern `^\\d+\\.\\d+\\.\\d+$` fail; sister aliases-security 范式"

    - path: "docs/adr/0016-aliases-deprecation-known-good.md"
      provides: "Phase 3.3 ADR 9 章节 errata sister Phase 3.2 ADR 0015 模式: Wave 0 sketch L1-50 → Wave 2 fill L51-150; covers D-01 RICH aliases / D-02 DOCTOR-ONLY-WARN / D-03 YAML known-good / D-04 STATE COLLAPSE 5-recurrence terminus / § 5 schemaVersion 12+13 manifest-domain colocation / § 8 install resolveAlias pre-lookup / § 7 dashboard-sse fix path (a) / § 12 3-wave topology / 9 ASR/ADR-stats"
      contains: "## Context"

    - path: ".planning/RETROSPECTIVE.md"
      provides: "Phase 3.3 milestone retrospective entry — W0.1 D-04 5-recurrence pattern terminus lesson + W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env lesson sister Phase 2.4 W4 Win 3-tier + W1 manifest-domain schema colocation 3rd consumer pattern (sister Phase 1.X manifest/schema/spec.ts + Phase 3.2 workflow-domain workflow/schema/ + Phase 3.3 本 phase) + W2 install resolveAlias 1-line surgical pre-lookup + D-02 silent install observability test (stdout NOT 'redirect|deprecated' substring) lesson"

    - path: ".planning/ROADMAP.md"
      provides: "Phase 3.3 ✅ SHIPPED marker + v0.3.0 3/4 进度 + Phase 3.4 prereq (路由命中率 ≥ 85% + token budget + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml + EE-4 BLOCKER auto-spawn rerun + userSpawn session_id capture)"

  key_links:
    - from: "src/cli/doctor.ts checkDeprecations action"
      to: "src/cli/lib/check-deprecations.ts checkDeprecations"
      via: "dynamic import + delegate (sister doctor.ts L138-142 checkGstackPrefix pattern) — `const { checkDeprecations: runCheck } = await import('./lib/check-deprecations.js'); return runCheck()`"
      pattern: "import.*check-deprecations|checkDeprecations"

    - from: "src/cli/lib/check-deprecations.ts checkDeprecations"
      to: "src/manifest/aliases.ts listDeprecations"
      via: "static import + try/catch wrap — listDeprecations() returns Array<{old, entry}>; helper formats table multi-line message + CheckResult; sister Phase 3.2 probe-gstack.ts → src/manifest/<domain>.ts consumer model"
      pattern: "listDeprecations\\(\\)|from.*manifest/aliases"

    - from: "src/manifest/aliases.ts loadAliases"
      to: "manifests/aliases.yaml"
      via: "readFileSync + yaml.parse + Value.Check(AliasesV1, parsed) — sister state.ts L23-41 fail-soft read pattern (null on file missing); Karpathy fail-loud throw on schema invalid (debug locality with first 3 Value.Errors excerpt sister Phase 3.2 governance.ts)"
      pattern: "aliases\\.yaml|Value\\.Check.*Aliases"

    - from: "src/cli/install.ts action handler"
      to: "src/manifest/aliases.ts resolveAlias"
      via: "dynamic import + 1-line pre-manifest-lookup wrap (RESEARCH § 8.1 verbatim) — `const { resolveAlias } = await import('../manifest/aliases.js'); const resolvedName = resolveAlias(name) ?? name` BEFORE manifestPath resolve; D-02 silent redirect locked (NO console.warn output, install observability test守门)"
      pattern: "resolveAlias\\(.*name|resolvedName"

    - from: "src/cli/install.ts --known-good flag consume"
      to: "src/manifest/knownGood.ts getPinnedVersion"
      via: "lazy dynamic import only when raw.knownGood === true (Karpathy YAGNI Discretion locked per RESEARCH § 4.3) — `if (raw.knownGood) { const { getPinnedVersion } = await import('../manifest/knownGood.js'); const pinned = getPinnedVersion(v.manifest.metadata.name, '0.3.0') }`; override npm_version field if (a) pinned AND (b) install method npm-cli"
      pattern: "getPinnedVersion|--known-good"

    - from: "src/types/schemaVersion.ts SCHEMA_VERSIONS"
      to: "src/manifest/schema/aliases.v1.ts AliasesV1 + known-good.v1.ts KnownGoodV1"
      via: "Type.Literal(SCHEMA_VERSIONS.aliases) + Type.Literal(SCHEMA_VERSIONS.knownGood) — single 兼容门 CD-5 (sister Phase 3.2 W1 T1.1 9+10 双加 模式 12+13 双加)"
      pattern: "SCHEMA_VERSIONS\\.(aliases|knownGood)"

    - from: ".planning/STATE.md (W0.1 post-COLLAPSE)"
      to: "scripts/check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback"
      via: "L4 frontmatter `> Status:` 删 + L5 `> 最后更新：` 删 (D-04 COLLAPSE locked); freshness gate STATE_POSITION_RE = /\\*\\*Phase [1-9]\\.[0-9]+ SHIPPED\\*\\*/m 扫 STATE.md 全文; checkFreshness L53-91 modify STATE.md branch — STATUS_MARKER 不匹配 → fallback STATE_POSITION_RE.test(full) 满足即 exit 0 (README + PROJECT-SPEC unchanged)"
      pattern: "STATE_POSITION_RE|当前位置"

    - from: "scripts/dashboard.mjs L39 PORT"
      to: "process.env.DASHBOARD_PORT"
      via: "additive env-var override `const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)` (prod default 47180 preserved zero behavior change; test 既存 L3-4 comment 现 W0.2 兑现 exact designed name); +1L delta total"
      pattern: "DASHBOARD_PORT|process\\.env"

    - from: "tests/scripts/dashboard-sse.test.ts beforeAll spawn"
      to: "scripts/dashboard.mjs spawn env DASHBOARD_PORT injection"
      via: "getEphemeralPort() via net.createServer({port:0}).listen → addr.port → close; spawn(... { env: {...process.env, DASHBOARD_PORT: String(PORT)}}) injection + 8s waitFor sister Phase 2.4 W4 Win 3-tier; 4 cells removed portTaken probe + skip branches (always run)"
      pattern: "net\\.createServer|DASHBOARD_PORT.*String\\(PORT"
---

<objective>
Phase 3.3 把 **v0.3.0 milestone 第 3 phase** (4 phase 中第 3, upstream rename + version lock 适配层) 装配为 **manifests/aliases.yaml RICH schema + deprecation marker DOCTOR-ONLY-WARN (doctor 7th check + install 静默重定向) + versions/<harnessed-ver>-known-good.yaml YAML manifest version lock + harnessed install --known-good flag pinned version override + W0 backlog 3 项一次根治 (D-04 STATE COLLAPSE 5-recurrence terminus + dashboard-sse flaky fix path (a) random port + W0.3 schemaVersion 12+13 surface decision doc)**。

**核心 4 子功能** (D-01~D-04 + 3 项 W0):

1. **D-01 RICH aliases.yaml schema** (R7.5) — `manifests/aliases.yaml` 顶层 NEW empty seed (Phase 3.4 dogfood adds first actual deprecation entries) + `src/manifest/schema/aliases.v1.ts` NEW ≤40L (TypeBox AliasEntryV1 含 redirect + reason maxLength 500 + since_version semver pattern + deprecation_date ISO-date pattern + removal_date Optional; AliasesV1 wraps schemaVersion Literal + aliases Record<string, AliasEntryV1>; manifest-domain colocation per RESEARCH § 5.3) + `src/manifest/aliases.ts` NEW ≤40L (loadAliases memoized fail-soft + resolveAlias(name): string|null thin wrap + listDeprecations() consumer; sister state.ts L23-41 fail-soft read 模式 + sister manifest/validate.ts yaml.parse 模式; Karpathy fail-loud throw on schema invalid 含 first 3 Value.Errors excerpt 调试 locality) + schemaVersion 12th surface register。

2. **D-02 DOCTOR-ONLY-WARN deprecation marker visibility** (R7.5) — `src/cli/doctor.ts` 加 7th check `checkDeprecations` (~5L MODIFY sister L138-142 checkGstackPrefix 100% reuse dispatch dynamic import + delegate; 184→~189L ≤ 200L Karpathy clean) + `src/cli/lib/check-deprecations.ts` NEW ≤40L PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L sister-share extract pattern for 守 doctor.ts ≤200L; table format multi-deprecation aggregation per Discretion locked RESEARCH § 3.2 verbatim; D-02 status=warn ≠ fail B-06 sister Phase 2.4 W3) + `src/cli/install.ts` 加 1-line resolveAlias pre-manifest-lookup inject (`const resolvedName = resolveAlias(name) ?? name`; D-02 silent redirect locked NO console.warn output, install observability test守门 stdout NOT 'redirect|deprecated' substring per RESEARCH § 8.1+8.3 verbatim; R7.5 验收 "install 通过 + 提示" 语义 由 install 通过 silent redirect + doctor 提示 table multi-deprecation 两 surface 共同达成)。

3. **D-03 YAML manifest known-good 版本组合** (R7.6) — `versions/` 新顶层 dir + `versions/0.3.0-known-good.yaml` NEW empty seed ~10L (schemaVersion + harnessed_version 0.3.0 + e2e_verified_at 2026-05-17 + upstreams: [] empty Array MVP; Phase 3.4 dogfood adds actual e2e-verified pinned per Discretion locked) + `src/manifest/schema/known-good.v1.ts` NEW ≤45L (TypeBox PinnedUpstream {name + version + install_method 字符串非 enum 避 schema drift 加耦 per RESEARCH § 4.2} + KnownGoodV1 wraps schemaVersion Literal + harnessed_version semver pattern + e2e_verified_at ISO-date + upstreams: Array; manifest-domain colocation) + `src/manifest/knownGood.ts` NEW ≤45L (loadKnownGood memoized Map<harnessedVer, KnownGoodV1Type|null> + getPinnedVersion(upstreamName, harnessedVer) thin lookup; Karpathy YAGNI: only consume when --known-good flag triggers lazy load locked Discretion per RESEARCH § 4.3; path versions/${harnessedVer}-known-good.yaml 构造 sister install.ts L66 范式) + `src/cli/install.ts` 加 `--known-good` commander option + RawOpts.knownGood + lazy import on flag detect + npm_version override (when install method npm-cli AND pinned hit per RESEARCH § 4.3) + schemaVersion 13th surface register。

4. **D-04 STATE dual-SSOT 5-recurrence terminus COLLAPSE** (W0.1 root-cause 必修) — `.planning/STATE.md` 删 L4 `> Status:` 整行 + 删 L5 `> 最后更新：` 整行 ("当前位置" L21-27 块 single SSOT 保留, 含 `**Phase 3.2 SHIPPED**` literal 等 markers 已饱和 STATE_POSITION_RE; 5-recurrence terminus = README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 dual) + `scripts/check-transparency-verdicts.mjs` 扩 `STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` 顶部 declare + checkFreshness L53-91 modify STATE.md branch — STATUS_MARKER 不匹配 → fallback STATE_POSITION_RE.test(full) 满足即 exit 0 (README + PROJECT-SPEC unchanged behavior, OR-fallback for STATE.md only per RESEARCH § 6.2 verbatim) + dashboard.mjs **无 fix 需要** per RESEARCH § 1.1 verified (12-match grep 直证 dashboard 不 parse L4 frontmatter; planner DROPS CONTEXT.md L160 "spike 1h 评估" sub-step)。

**W0 backlog 3 项 absorb** (沿袭 Phase 2.3+2.4+3.1+3.2 W0 5-phase 连续 "deferred → next phase W0 一次根治" pattern):
- **W0.1 (必修 first task, D-04 实施)**: STATE.md COLLAPSE 删 L4+L5 + freshness gate STATE_POSITION_RE OR-fallback 扩 + 5-recurrence terminus 记录 in commit msg (per RESEARCH § 6.1-6.4 verbatim);
- **W0.2 (必修, Phase 3.2 deferred #2)**: dashboard-sse 4 cell flaky 根治 fix path (a) random ephemeral port + DASHBOARD_PORT env injection per RESEARCH § 7.1 verbatim — dashboard.mjs L39 +1L env-var additive override (prod default preserved) + dashboard-sse.test.ts +12L net delta (getEphemeralPort helper + let PORT mutable + beforeAll inject env + 8s waitFor sister Phase 2.4 W4 Win 3-tier + remove portTaken probe + 4 cell skip branches); **Acceptance**: `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3` 4/4 pass;
- **W0.3 (Phase 3.3 own prereq)**: `.planning/phase-3.3/W0.3-schema-decision.md` NEW ~60L recording 12+13 surface double-add decision (manifest-domain colocation rule + sister Phase 3.2 W0.3 76L 直接 model + path divergence section)。

**Wave 拓扑** (RESEARCH § 12.1 recommended 3-wave W0-W2, sister Phase 3.2 4-wave 缩 1 因 schemaVersion 双 add scope 类似 + 无 wired-runner 新组件):

```
Wave 0 — backlog 3 项 absorb + test infra setup + schema baseline backfill (5 sub-tasks, T0.1 first 必修)
  ├─ T0.1 W0.1 D-04 STATE COLLAPSE 删 L4+L5 + freshness gate STATE_POSITION_RE OR-fallback 扩 (FIRST TASK 必修, 5-recurrence terminus)
  ├─ T0.2 W0.2 dashboard.mjs L39 env-var additive + dashboard-sse.test.ts random port + DASHBOARD_PORT env injection fix path (a)
  ├─ T0.3 W0.3 .planning/phase-3.3/W0.3-schema-decision.md schema decision record (manifest-domain colocation + path divergence)
  ├─ T0.4 tests/manifest/schema/ + tests/integration/ + tests/manifest/ + tests/cli/ dirs setup verify
  └─ T0.5 src/types/schemaVersion.ts MODIFY +4-5L (planFeature.v1 11th surface backfill; sister Phase 3.2 W2 T2.2 b875e21 stale claim register fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical fix pattern延袭)
       ↓
Wave 1 — schemas (12+13 surface) + manifest loaders + check helper + doctor 7th wire + install resolveAlias + --known-good flag + 2 yaml seed + 8 unit/contract test files
  ├─ T1.1 src/types/schemaVersion.ts MODIFY 11 → 13 surface (+4L double-add aliases + knownGood)
  ├─ T1.2 src/manifest/schema/aliases.v1.ts NEW ≤40L (D-01 RICH 12th surface TypeBox)
  ├─ T1.3 src/manifest/schema/known-good.v1.ts NEW ≤45L (D-03 YAML 13th surface TypeBox)
  ├─ T1.4 src/manifest/aliases.ts NEW ≤40L (loadAliases + resolveAlias + listDeprecations)
  ├─ T1.5 src/manifest/knownGood.ts NEW ≤45L (loadKnownGood + getPinnedVersion lazy)
  ├─ T1.6 src/cli/lib/check-deprecations.ts NEW ≤40L PRIMARY helper (sister probe-gstack.ts pattern)
  ├─ T1.7 src/cli/doctor.ts MODIFY +5L (7th check dispatch sister L138-142 100% reuse)
  ├─ T1.8 src/cli/install.ts MODIFY +2L (resolveAlias pre-lookup inject)
  ├─ T1.9 src/cli/install.ts MODIFY +8L (--known-good commander option + RawOpts + lazy import + npm_version override)
  ├─ T1.10 manifests/aliases.yaml NEW ~10L empty seed (D-01 MVP)
  ├─ T1.11 versions/0.3.0-known-good.yaml NEW ~10L empty seed (D-03 MVP)
  └─ T1.12 tests Wave 1 — 8 test files (schema/aliases-v1 4 + schema/known-good-v1 4 + aliases 5 + knownGood 5 + check-deprecations 5 + types-schemaVersion MODIFY 2 + doctor MODIFY 1 + doctor-fixtures MODIFY 1 = ~27 fixture)
       ↓
Wave 2 — e2e integration + observability + security + ADR + STATE/RETRO/ROADMAP + A7 + ship tags
  ├─ T2.1 tests/integration/install-aliases.test.ts NEW ~80L 3 fixture e2e (R7.5 验收: 模拟上游改名 install 通过)
  ├─ T2.2 tests/integration/install-known-good.test.ts NEW ~70L 2 fixture e2e (R7.6 验收: --known-good reproducible)
  ├─ T2.3 tests/integration/install-silent-redirect.test.ts NEW ~50L 1 fixture observability (D-02 stdout NOT 'redirect|deprecated')
  ├─ T2.4 tests/manifest/aliases-security.test.ts + knownGood-security.test.ts NEW ~80L combined 3 fixture (path traversal + extra field reject + semver pattern reject)
  ├─ T2.5 docs/adr/0016-aliases-deprecation-known-good.md NEW ~150L 9 章节 finalize
  ├─ T2.6 .planning/STATE.md append Phase 3.3 SHIPPED event log + 12th 历史 entry + 当前位置 块更新
  ├─ T2.7 .planning/RETROSPECTIVE.md Phase 3.3 milestone retro entry
  ├─ T2.8 .planning/ROADMAP.md Phase 3.3 ✅ + v0.3.0 3/4 + Phase 3.4 prereq
  ├─ T2.9 A7 守恒 verify (`git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l == 0`)
  └─ T2.10 baseline tag adr-0016-accepted + milestone tag v0.3.0-alpha.3-aliases-known-good push
```

**Purpose**: R7.5 (manifests/aliases.yaml 重定向 + deprecation marker doctor/install 显示提示; 模拟上游改名 install 通过) + R7.6 (harnessed install --known-good reproducible per-harnessed-version pinned upstream lock) + 3 项 W0 backlog cleanup (D-04 5-recurrence terminus + dashboard-sse flaky 根治 + schemaVersion 12+13 decision doc) + v0.3.0 milestone 第 3 phase ship (3/4 progress)。

**Output**: 3 Wave × 26 atomic task (per task_plan.md) + 单 ADR 0016 errata 9 章节 + `adr-0016-accepted` baseline tag + `v0.3.0-alpha.3-aliases-known-good` milestone tag + 2 NEW yaml seed (manifests/aliases.yaml empty + versions/0.3.0-known-good.yaml empty) + 5 NEW src TS files (schemas × 2 + loaders × 2 + check helper × 1) + 2 MODIFY src TS files (doctor.ts +5L + install.ts +10L) + 1 MODIFY type registry (schemaVersion.ts +4L) + 8 NEW test files (~38 NEW fixture) + 3 W0 backlog absorb files (STATE.md collapse + check-transparency-verdicts.mjs gate extend + dashboard-sse.test.ts random port fix + dashboard.mjs +1L env-var)。

> **R1+R2 critical findings absorbed** (4 项): (1) **dashboard.mjs D-04 COLLAPSE 0 parsing dependency verified** (RESEARCH § 1.1 12-match grep 直证 — planner DROPS CONTEXT.md L160 "spike 1h 评估" sub-step, W0.1 仅 docs delete + gate extend); (2) **schemaVersion 10 actual baseline + T0.5 backfill 11th planFeature + W1 double-add 12+13 = 13 final MANIFEST-domain colocation** (RESEARCH § 5.3 + § 9.2 — aliases.v1 + known-good.v1 placed at src/manifest/schema/ sister spec.ts/metadata.ts existing manifest-domain schemas, NOT src/workflow/schema/ NOT src/checkpoint/schema/; consumer locality rule per sister Phase 3.2 W0.3 path divergence pattern); (3) **doctor.ts 184L baseline verified** (RESEARCH § 0.4 实测 `wc -l src/cli/doctor.ts` = 184 — 加 7th check 184→~189L ≤ 200L Karpathy clean, **不需** existing-helper split, **不需** B-03 5% tolerance); (4) **W0.2 fix path (a) random port + DASHBOARD_PORT env locked verbatim** (RESEARCH § 7.1 Step 1+2 recipe — NOT (b) vi.mock node:http NOT (c) Win skip; dashboard.mjs L39 +1L additive override prod default preserved + test +12L net delta within ≤40L spec; sister Node `net.createServer({port:0})` MDN standard + sister Phase 2.4 W4 Win 3-tier 8s waitFor)。

</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phase-3.3/3.3-KICKOFF.md
@.planning/phase-3.3/3.3-CONTEXT.md
@.planning/phase-3.3/PATTERNS.md
@.planning/phase-3.3/RESEARCH.md
@.planning/phase-3.3/task_plan.md
@.planning/RETROSPECTIVE.md

# Frozen interface contracts (本 phase 消费 — Phase 3.1 + 3.2 actually shipped 10 surface schemaVersion; planFeature.v1 b875e21 stale claim backfilled to 11 by Phase 3.3 W0 T0.5)
@src/types/schemaVersion.ts
@src/cli/doctor.ts
@src/cli/install.ts
@src/cli/lib/probe-gstack.ts
@src/cli/lib/origin-check.ts
@src/manifest/validate.ts
@src/manifest/schema/spec.ts
@src/workflow/schema/governance.ts
@src/workflow/schema/config.ts
@src/checkpoint/state.ts
@scripts/check-transparency-verdicts.mjs
@scripts/dashboard.mjs
@tests/scripts/dashboard-sse.test.ts
@tests/cli/doctor.test.ts
@tests/unit/types-schemaVersion.test.ts
@manifests/skill-packs/gstack.yaml
@manifests/tools/ctx7.yaml

# Sister precedent (format gold-standard)
@.planning/phase-3.2/PLAN.md
@.planning/phase-3.2/task_plan.md
@.planning/phase-3.2/3.2-CONTEXT.md
@.planning/phase-3.2/W0.3-schema-decision.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From src/types/schemaVersion.ts (10 actual baseline — planFeature.v1 NEVER registered despite Phase 3.2 W2 T2.2 b875e21 commit msg stale claim; Phase 3.3 W0 T0.5 backfills 11th planFeature + W1 T1.1 加 12+13 双 add aliases + knownGood):
```typescript
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  currentWorkflow: 'harnessed.current-workflow.v1', // Phase 3.1 W1 T1.1 ADD 8th surface
  config: 'harnessed.config.v1',                    // Phase 3.2 W1 T1.1 ADD 9th surface
  governance: 'harnessed.governance.v1',            // Phase 3.2 W1 T1.1 ADD 10th surface
  // planFeature: 'harnessed.plan-feature.v1',      // ← Phase 3.3 W0 T0.5 BACKFILL 11th surface (sister Phase 3.2 W2 T2.2 b875e21 commit msg claim "11th surface" was LATENT STALE — never actually registered in SCHEMA_VERSIONS const; T0.5 surgical fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern)
  // Phase 3.3 W1 T1.1 ADD:
  // aliases: 'harnessed.aliases.v1',              // ← 12th surface (D-01 RICH)
  // knownGood: 'harnessed.known-good.v1',         // ← 13th surface (D-03 YAML manifest)
} as const

export function branchOnSchemaVersion<T>(
  v: string,
  handlers: { v1: () => T; unknown: () => T }
): T
```

From src/cli/doctor.ts L138-142 (sister `checkGstackPrefix` 6th check Phase 3.2 W1 T1.5 — direct analog for `checkDeprecations` 7th):
```typescript
async function checkGstackPrefix(): Promise<CheckResult> {
  const { probeGstackPrefix } = await import('./lib/probe-gstack.js')
  const r = probeGstackPrefix()
  return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
}
// Phase 3.3 W1 T1.7 ADD 7th check (sister 100% reuse):
async function checkDeprecations(): Promise<CheckResult> {
  const { checkDeprecations: runCheck } = await import('./lib/check-deprecations.js')
  return runCheck()
}
// results array L150-157 push 7th:
const results: CheckResult[] = [
  checkNodeVersion(), await checkMcpScope(), checkJq(), checkWinBash(),
  await checkOriginUrl(), await checkGstackPrefix(),
  await checkDeprecations(),  // ← Phase 3.3 W1 T1.7 ADD
]
```

From src/cli/install.ts L46-67 (Phase 3.3 W1 T1.8 + T1.9 insert points):
```typescript
program
  .command('install <name>')
  .description('Install an upstream (dry-run by default — pass --apply to execute)')
  .option('--apply', 'execute the install (default: dry-run preview only)')
  .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
  .option('--system', 'allow L4 system-wide install (e.g. global npm install)')
  .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
  .option('--full-diff', 'expand diffs longer than 200 lines')
  .option('--no-color', 'disable ANSI colors (auto-detected when piped)')
  // Phase 3.3 W1 T1.9 ADD:
  // .option('--known-good', 'use known-good version lock from versions/<harnessed-ver>-known-good.yaml')
  .action(async (name: string, raw: RawOpts) => {
    // ... H1 pre-action flag gate L58-64 ...

    // Phase 3.3 W1 T1.8 ADD (BEFORE manifestPath resolve):
    // const { resolveAlias } = await import('../manifest/aliases.js')
    // const resolvedName = resolveAlias(name) ?? name
    // (then replace `name` with `resolvedName` in L66-67 path constructions + L77-78 error message)

    const manifestPath = resolve(process.cwd(), `manifests/tools/${name}.yaml`)
    const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${name}.yaml`)
    // ... existing readFile + chosenPath logic ...

    const v = validateManifestFile(yamlSrc, chosenPath)
    // ... existing opts construction L92-99 ...

    // Phase 3.3 W1 T1.9 ADD (BEFORE runInstall):
    // if (raw.knownGood) {
    //   const { getPinnedVersion } = await import('../manifest/knownGood.js')
    //   const pinned = getPinnedVersion(v.manifest.metadata.name, '0.3.0') // TODO Phase 3.4: read from package.json
    //   if (pinned && v.manifest.spec.install.method === 'npm-cli') {
    //     ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
    //   }
    // }
    const result = await runInstall(v.manifest, opts)
    // ... rest unchanged ...
  })
```

From src/checkpoint/state.ts L23-41 (sister fail-soft read pattern — Phase 3.3 W1 aliases.ts + knownGood.ts 直接复刻 100% reuse):
```typescript
export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
  let raw: string
  try { raw = await readFile(STATE_PATH, 'utf8') } catch { return null }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return null }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(CurrentWorkflowV1, parsed) ? (parsed as CurrentWorkflowV1Type) : null),
    unknown: () => null,
  })
}
```

From src/workflow/schema/governance.ts (Phase 3.2 W1 T1.3 — sister TypeBox shape direct analog for aliases.v1.ts + known-good.v1.ts):
```typescript
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'
export const GovernanceV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance),
    status: Type.Union([Type.Literal('active'), Type.Literal('vetoed')]),
    reason: Type.Optional(Type.String({ maxLength: 500 })),
    vetoed_at: Type.Optional(Type.String({ format: 'date-time' })),  // ← sister: Phase 3.2 used format:'date-time' but Phase 3.2 W2 Rule 1 lesson: FormatRegistry not registered, use pattern instead
    vetoed_by: Type.Optional(Type.String({ maxLength: 100 })),
  },
  { additionalProperties: false },
)
```

From scripts/check-transparency-verdicts.mjs L20-30 + L53-91 (W0.1 freshness gate STATE_POSITION_RE OR-fallback extend point):
```javascript
const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m  // L20 — first 50 lines scan
const FRONT_MATTER_DOCS = ['README.md', 'PROJECT-SPEC.md', '.planning/STATE.md']  // L25
const STATE_LATEST_SUBPHASE_RE = /\*{2}Phase\s+(\d+\.\d+)\s+SHIPPED\*{2}/g  // L29 — already exists, full-file matchAll

// Phase 3.3 W0.1 ADD:
// const STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m  // full-file scan, single match

// L53-91 checkFreshness MODIFY — STATE.md OR-fallback branch:
function checkFreshness(violations) {
  // ... existing milestone + subphase gates ...
  for (const file of FRONT_MATTER_DOCS) {
    // ... existing head read ...
    const match = head.match(STATUS_MARKER)
    if (!match) {
      // Phase 3.3 W0.1 ADD OR-fallback: for STATE.md specifically
      // if (file === '.planning/STATE.md') {
      //   const full = readFileSync(file, 'utf8')
      //   if (!STATE_POSITION_RE.test(full)) {
      //     violations.push(`${file}:1  missing both Status: marker (first 50L) AND STATE_POSITION_RE (full file)`)
      //   }
      //   continue  // STATE.md OK if EITHER pattern matches
      // }
      violations.push(`${file}:1  missing Status: marker in first 50 lines`)
      continue
    }
    // ... existing content checks ...
  }
}
```

From scripts/dashboard.mjs L39 (W0.2 +1L env-var additive):
```javascript
// PRE-W0.2 (Phase 2.4 W3):
const PORT = 47180
// POST-W0.2 (Phase 3.3):
// const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)  // prod default preserved
```

From tests/scripts/dashboard-sse.test.ts L1-30 + L84-107 (W0.2 fix path (a) random port + DASHBOARD_PORT env injection target):
```typescript
// L3-4 EXISTING comment (Phase 2.4 W3 hint):
// "We spawn the dashboard at a random high port (override via DASHBOARD_PORT env var
//  if we add it later; for now we test against the production 47180 port — if it
//  collides on the developer machine, the test skipIf bails)."
// ← Phase 3.3 W0.2 fulfils EXACTLY this designed-but-not-implemented behavior.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
// Phase 3.3 W0.2 ADD:
// import { createServer as createNetServer } from 'node:net'

const DASHBOARD = join(process.cwd(), 'scripts', 'dashboard.mjs')
// PRE: const PORT = 47180  ← L17
// POST: let PORT = 0  // populated in beforeAll via getEphemeralPort()

// Phase 3.3 W0.2 ADD getEphemeralPort helper (sister Node net.createServer best practice):
// function getEphemeralPort(): Promise<number> {
//   return new Promise((resolve, reject) => {
//     const srv = createNetServer()
//     srv.listen(0, '127.0.0.1', () => {
//       const addr = srv.address()
//       if (addr && typeof addr === 'object') { srv.close(() => resolve(addr.port)) }
//       else { srv.close(() => reject(new Error('failed to get ephemeral port'))) }
//     })
//     srv.on('error', reject)
//   })
// }

// L84-107 beforeAll MODIFY (per RESEARCH § 7.1 Step 2):
// beforeAll(async () => {
//   PORT = await getEphemeralPort()
//   // ... tmpRoot setup ...
//   const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
//     cwd: tmpRoot, stdio: 'ignore', detached: false,
//     env: { ...process.env, DASHBOARD_PORT: String(PORT) },  // ← inject env var
//   })
//   handle = { proc, tmpRoot }
//   await waitFor(PORT, 8000)  // 8s sister Phase 2.4 W4 Win 3-tier
// }, 15_000)
// (also remove L84-94 portTaken probe + L116-155 4 cell skip branches)
```

From src/cli/lib/probe-gstack.ts L1-48 (sister PRIMARY helper pattern — Phase 3.3 W1 T1.6 check-deprecations.ts 100% reuse):
```typescript
// Karpathy hard limit ≤50L PRIMARY helper守 doctor.ts ≤200L. Pattern:
//   1. Single export fn returns CheckResult shape
//   2. Try cross-OS spawnSync OR file-read OR validate
//   3. Branch on outcome → return pass/warn/fail + message + fix hint
//   4. Defensive fallback (catch → fail with fix hint)
// Phase 3.3 W1 T1.6 check-deprecations.ts 沿袭 EXACT shape:
//   export function checkDeprecations(): CheckResult {
//     try { const deprecations = listDeprecations() / ... } catch { ... }
//   }
```
</interfaces>

<tasks>

<!-- Each Wave delegates to atomic task_plan.md task IDs (T0.x / T1.x / T2.x).
     task_plan.md contains <read_first> / <acceptance_criteria> / <action> with concrete values per task. -->

<task type="auto">
  <name>Wave 0 — Backlog 3 项 absorb + schema baseline backfill (T0.1 W0.1 first 必修 5-recurrence terminus; T0.5 planFeature.v1 11th surface backfill)</name>
  <files>.planning/STATE.md, scripts/check-transparency-verdicts.mjs, scripts/dashboard.mjs, tests/scripts/dashboard-sse.test.ts, .planning/phase-3.3/W0.3-schema-decision.md, src/types/schemaVersion.ts, src/workflow/schema/planFeature.ts</files>
  <action>Run T0.1 → T0.2 → T0.3 → T0.4 per task_plan.md (T0.1 first 必修, T0.2 + T0.3 may parallelize, T0.4 last). **T0.1 W0.1 D-04 STATE COLLAPSE** per RESEARCH § 6.1 verbatim — (a) delete `.planning/STATE.md` L4 整行 `> Status: v0.1.0 SHIPPED & ARCHIVED · ... (long Phase ship inline)`; (b) delete L5 整行 `> 最后更新：2026-05-17（... long event log inline）`; (c) MODIFY `scripts/check-transparency-verdicts.mjs` 加 `const STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` 顶部 declare (~L21 sister STATUS_MARKER + STATE_LATEST_SUBPHASE_RE existing) + checkFreshness L53-91 modify STATE.md branch — STATUS_MARKER 不匹配 时 if `file === '.planning/STATE.md'` 则 fallback to full-file `readFileSync` + `STATE_POSITION_RE.test(content)` exit 0 if matches (README + PROJECT-SPEC unchanged behavior); (d) commit msg "fix(phase-3.3-w0): T0.1 — STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 LOCKED)" 含 5-recurrence list (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 dual) + RESEARCH § 1.1 dashboard verified safe note. **T0.2 W0.2 dashboard-sse fix path (a)** per RESEARCH § 7.1 Step 1+2 verbatim — (a) MODIFY `scripts/dashboard.mjs` L39 `const PORT = 47180` → `const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)` (additive, prod default 47180 preserved, +1L delta); (b) MODIFY `tests/scripts/dashboard-sse.test.ts` add `import { createServer as createNetServer } from 'node:net'` + add `getEphemeralPort(): Promise<number>` helper (net.createServer().listen(0) → addr.port → close, sister Node MDN std) + change L17 `const PORT = 47180` → `let PORT = 0` (mutable) + L84-107 beforeAll 加 `PORT = await getEphemeralPort()` 顶部 + change spawn args remove `--port` and add `env: {...process.env, DASHBOARD_PORT: String(PORT)}` injection + waitFor 8s timeout (sister Phase 2.4 W4 Win 3-tier) + remove L84-94 portTaken probe lines + remove L116-155 4 cell `if (portTaken.value) return` skip branches (always run); (+12L net delta within ≤40L spec). **T0.3 W0.3 schema decision doc** — create `.planning/phase-3.3/W0.3-schema-decision.md` ~60L per sister Phase 3.2 W0.3 76L 模板: Decision section (NEW double-add aliases.v1 12th + knownGood.v1 13th surface) + Rationale 4 子 (Karpathy single-responsibility + manifest-domain colocation + sister Phase 3.2 W1 9+10 双加 precedent + sister manifest/schema/spec.ts colocation 模式延续) + **Path divergence from PATTERNS.md** section per RESEARCH § 9.2 (manifest-domain colocation rule: schemas live with primary consumers — aliases + knownGood = manifest-domain consumed by src/manifest/*.ts + src/cli/install.ts; NOT workflow/schema/ NOT checkpoint/schema/; PATTERNS.md § 1 row 4 already places at manifest/schema/ so 本 phase confirms NOT diverges) + Schema specs × 2 (TypeBox blocks excerpt aliases.v1 + known-good.v1) + Implementation order (W1 T1.1-T1.5) + Verification (grep commands). **T0.4** mkdir -p test dirs (`tests/manifest/schema`, `tests/manifest`, `tests/integration` if not exists) + positive verify vitest.config.ts include glob covers recursively. **T0.5 schemaVersion 11th surface backfill** (sister Phase 3.2 W2 T2.2 b875e21 stale claim register fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical pattern) — (a) Read `src/types/schemaVersion.ts` L34-54 + `src/workflow/schema/planFeature.ts` to verify 10 actual baseline + planFeature.v1 literal usage; (b) Edit `src/types/schemaVersion.ts` SCHEMA_VERSIONS const add 11th entry `planFeature: 'harnessed.plan-feature.v1'` after `governance:` line + extend JSDoc surface enumeration with `  - plan-feature: src/workflow/schema/planFeature.ts (plan-feature workflow DSL) ← Phase 3.3 W0 T0.5 BACKFILL 11th surface (sister Phase 3.2 W2 T2.2 b875e21 stale claim fix)`; (c) Edit SchemaVersionLiteral Union add 11th `Type.Literal(SCHEMA_VERSIONS.planFeature)` entry; (d) IF `src/workflow/schema/planFeature.ts` currently has a hard-coded `'harnessed.plan-feature.v1'` literal (verify via grep), swap to `SCHEMA_VERSIONS.planFeature` constant import sister Phase 3.1 W1 8th surface pattern; ELSE no-op (current state: no schemaVersion field in PlanFeatureWorkflowV1 — backfill is registry-only); (e) Run `corepack pnpm typecheck` to verify type compile; (f) Update `tests/unit/types-schemaVersion.test.ts` from "10 surfaces" assertions to "11 surfaces" assertions sister Phase 3.1 W1 T1.4 pattern (3 places: describe block name, `.toHaveLength(10)` → `.toHaveLength(11)`, expectedSurfaces array add `'plan-feature'`); (g) Biome preempt + commit msg `fix(phase-3.3-w0): T0.5 — planFeature.v1 11th schemaVersion surface register backfill (sister Phase 3.2 W2 T2.2 b875e21 latent stale claim; orchestrator iter 1 B-1 fix path b)`.</action>
  <verify>
    <automated>! grep -q "^> Status:" .planning/STATE.md # exit 0 (L4 删除 verify); ! grep -q "^> 最后更新：" .planning/STATE.md # exit 0 (L5 删除 verify); grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md # exit 0 (当前位置块 literal 保留 verify); grep -E "STATE_POSITION_RE" scripts/check-transparency-verdicts.mjs | wc -l # ≥ 2 (declare + check); node scripts/check-transparency-verdicts.mjs # exit 0 (transparency gate pass post-W0.1); grep -q "DASHBOARD_PORT" scripts/dashboard.mjs # exit 0 (env-var additive verify); grep -q "DASHBOARD_PORT" tests/scripts/dashboard-sse.test.ts # exit 0 (env injection verify); grep -q "createNetServer\|net.createServer" tests/scripts/dashboard-sse.test.ts # exit 0 (random port helper verify); corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3 # 4/4 pass (W0.2 acceptance bar); test -f .planning/phase-3.3/W0.3-schema-decision.md; grep -E "Path divergence|manifest-domain|src/manifest/schema/" .planning/phase-3.3/W0.3-schema-decision.md | wc -l # ≥ 3 (rationale captured); wc -l .planning/phase-3.3/W0.3-schema-decision.md # ≥ 40 ≤ 100; [ -d tests/manifest/schema ] && [ -d tests/integration ]; grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts # == 11 (T0.5 backfill verify: 10 actual baseline + 1 planFeature backfill); grep -q "planFeature" src/types/schemaVersion.ts # exit 0 (T0.5 surface register); grep -q "harnessed\\.plan-feature\\.v1" src/types/schemaVersion.ts # exit 0 (T0.5 literal added); corepack pnpm typecheck 2>&1 | tail -3 # exit 0 (planFeature.ts compile clean post-T0.5); corepack pnpm test -- --run tests/unit/types-schemaVersion.test.ts 2>&1 | tail -3 # 0 fail (test 10→11 surface assertion updated per sister Phase 3.1 W1 T1.4 pattern)</automated>
  </verify>
  <done>STATE.md L4+L5 删 (5-recurrence pattern terminus); freshness gate STATE_POSITION_RE OR-fallback 扩 (transparency gate exit 0); dashboard.mjs L39 env-var additive (+1L); dashboard-sse.test.ts random port + DASHBOARD_PORT env injection (+12L net, 4/4 cells pass; W0.2 acceptance bar = first acceptance bar of Phase 3.3); W0.3 schema decision doc with manifest-domain colocation + path divergence section; test dirs ready for W1+W2 NEW fixture; T0.5 schemaVersion 10 → 11 surface backfill (planFeature.v1 11th register; sister Phase 3.2 W2 T2.2 b875e21 stale claim fix; sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical pattern; types-schemaVersion.test.ts 10→11 assertion updated; typecheck clean)</done>
</task>

<task type="auto">
  <name>Wave 1 — Schemas (12+13 surface) + manifest loaders + check-deprecations helper + doctor 7th check + install resolveAlias + --known-good flag + 2 yaml seed + 8 test files</name>
  <files>src/types/schemaVersion.ts, src/manifest/schema/aliases.v1.ts, src/manifest/schema/known-good.v1.ts, src/manifest/aliases.ts, src/manifest/knownGood.ts, src/cli/lib/check-deprecations.ts, src/cli/doctor.ts, src/cli/install.ts, manifests/aliases.yaml, versions/0.3.0-known-good.yaml, tests/manifest/schema/aliases-v1.test.ts, tests/manifest/schema/known-good-v1.test.ts, tests/manifest/aliases.test.ts, tests/manifest/knownGood.test.ts, tests/cli/check-deprecations.test.ts, tests/unit/types-schemaVersion.test.ts, tests/cli/doctor.test.ts, tests/cli/doctor-fixtures.test.ts</files>
  <action>Run T1.1 → T1.12 per task_plan.md (T1.1 schemaVersion 11→13 surface 先 → T1.2/T1.3 schemas 并行 → T1.4/T1.5 manifest loaders 并行 → T1.6 check-deprecations helper → T1.7 doctor 7th dispatch → T1.8 + T1.9 install MODIFY 并行 → T1.10/T1.11 yaml seeds 并行 → T1.12 8 test files). **T1.1 sig**: SCHEMA_VERSIONS 加 `aliases: 'harnessed.aliases.v1'` + `knownGood: 'harnessed.known-good.v1'` 2 entry after `governance:` (or after `planFeature:` if 11th surface registered already by Phase 3.2 W2); SchemaVersionLiteral Union 加 2 Type.Literal; JSDoc L13-26 加 surfaces 12-13 描述 (e.g. "  - aliases: manifests/aliases.yaml (upstream rename redirect) ← Phase 3.3 W1 T1.1 ADD (12th surface, D-01 RICH)" + "  - known-good: versions/<harnessed-ver>-known-good.yaml (upstream version lock) ← Phase 3.3 W1 T1.1 ADD (13th surface, D-03 YAML manifest)"). **T1.2 aliases.v1.ts**: per RESEARCH § 2.1 verbatim + PATTERNS § 2.4 verbatim — Type.Object 5 fields AliasEntryV1 + Type.Object 2 fields AliasesV1 wraps Record; ISO-date pattern `^\\d{4}-\\d{2}-\\d{2}$` (NOT FormatRegistry sister Phase 3.2 W2 Rule 1 lesson 锁); semver pattern `^\\d+\\.\\d+\\.\\d+$`; additionalProperties:false strict; reason maxLength:500 DOS cap (sister governance.ts L21); Karpathy hard limit ≤40L. **T1.3 known-good.v1.ts**: per RESEARCH § 4.2 verbatim + PATTERNS § 2.5 verbatim — Type.Object 3 fields PinnedUpstream + Type.Object 4 fields KnownGoodV1 wraps Array; install_method 字符串 (Type.String minLength 1) NOT InstallType union 避 coupling drift; semver + ISO-date patterns; additionalProperties:false strict; Karpathy hard limit ≤45L. **T1.4 aliases.ts**: per RESEARCH § 2.3 verbatim — readFileSync + yaml.parse + Value.Check(AliasesV1, parsed) + Karpathy fail-loud throw Error含 first 3 Value.Errors slice (sister state.ts L23-41 fail-soft missing file→null but invalid schema→throw 区分); 3 exports loadAliases + resolveAlias + listDeprecations; memoize `let _cached: AliasesV1Type | null = null`; ALIASES_PATH = join(process.cwd(), 'manifests', 'aliases.yaml'); Karpathy ≤40L. **T1.5 knownGood.ts**: per RESEARCH § 4.4 verbatim — sister aliases.ts pattern但 Map<harnessedVer, KnownGoodV1Type | null> cache (per-version memoize); 2 exports loadKnownGood + getPinnedVersion; path `join(versionsDir(), \`${harnessedVer}-known-good.yaml\`)`; Karpathy ≤45L. **T1.6 check-deprecations.ts**: per RESEARCH § 3.2 verbatim — sister probe-gstack.ts PRIMARY helper pattern; try { listDeprecations() } → empty: pass / N: warn + table format multi-line (per Discretion locked) / catch: fail + fix hint; Karpathy ≤40L. **T1.7 doctor.ts MODIFY**: per RESEARCH § 3.1 verbatim + PATTERNS § 2.6 verbatim — 加 async `checkDeprecations()` dispatch (sister checkGstackPrefix L138-142 100% reuse, 4L NEW function + 1L results array push) + description string L139 加 'deprecations'; FINAL `wc -l src/cli/doctor.ts` ≤ 200 Karpathy clean. **T1.8 install.ts resolveAlias inject**: per RESEARCH § 8.1 verbatim — BEFORE L66 manifestPath resolve 加 `const { resolveAlias } = await import('../manifest/aliases.js'); const resolvedName = resolveAlias(name) ?? name` + replace ALL subsequent uses of `name` with `resolvedName` (L66+L67 path constructions + L77+L78 error message + L78 fix message); D-02 silent redirect 守门 NO console.warn/log. **T1.9 install.ts --known-good flag**: per RESEARCH § 4.3 verbatim — L46-56 commander option chain 加 `.option('--known-good', 'use known-good version lock from versions/<harnessed-ver>-known-good.yaml')` + L30-37 RawOpts interface 加 `knownGood?: boolean` + L99 后 (BEFORE runInstall) 加 lazy block `if (raw.knownGood) { const { getPinnedVersion } = await import('../manifest/knownGood.js'); const harnessedVer = '0.3.0' /* TODO Phase 3.4: read from package.json */; const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer); if (pinned && v.manifest.spec.install.method === 'npm-cli') { (v.manifest.spec.install as { npm_version?: string }).npm_version = pinned } }`. **T1.10 manifests/aliases.yaml**: NEW empty seed ~10L per RESEARCH § 2.2 verbatim — `schemaVersion: harnessed.aliases.v1` + `aliases: {}` empty Record MVP + 顶部 comment block describing structure (commented-out example entry for reference). **T1.11 versions/0.3.0-known-good.yaml**: NEW 顶层 dir + empty seed ~10L per RESEARCH § 4.1 verbatim — `schemaVersion: harnessed.known-good.v1` + `harnessed_version: '0.3.0'` + `e2e_verified_at: '2026-05-17'` + `upstreams: []` empty Array MVP + 顶部 comment Phase 3.4 dogfood fills. **T1.12 8 test files**: per task_plan.md verbatim — schema/aliases-v1.test.ts 4 fixture + schema/known-good-v1.test.ts 4 fixture + aliases.test.ts 5 fixture + knownGood.test.ts 5 fixture + check-deprecations.test.ts 5 fixture + types-schemaVersion.test.ts MODIFY +2 fixture (13-surface count + 2 new register) + doctor.test.ts MODIFY +1 fixture (7th check dispatch) + doctor-fixtures.test.ts MODIFY +1 fixture (7th check parametrize); biome preempt before commit.</action>
  <verify>
    <automated>grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts # ≥ 13 (11 → 13 double-add); grep -E "harnessed\.aliases\.v1|harnessed\.known-good\.v1" src/types/schemaVersion.ts | wc -l # ≥ 2; corepack pnpm test -- --run tests/manifest/ tests/cli/check-deprecations.test.ts tests/unit/types-schemaVersion.test.ts tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts 2>&1 | tail -5 # all pass; wc -l src/cli/doctor.ts # ≤ 200; wc -l src/cli/install.ts # ≤ 200; wc -l src/cli/lib/check-deprecations.ts # ≤ 40; wc -l src/manifest/aliases.ts # ≤ 40; wc -l src/manifest/knownGood.ts # ≤ 45; wc -l src/manifest/schema/aliases.v1.ts # ≤ 40; wc -l src/manifest/schema/known-good.v1.ts # ≤ 45; pnpm typecheck # 0 error; test -f manifests/aliases.yaml && grep -q "harnessed.aliases.v1" manifests/aliases.yaml; test -f versions/0.3.0-known-good.yaml && grep -q "harnessed.known-good.v1" versions/0.3.0-known-good.yaml; grep -q "checkDeprecations" src/cli/doctor.ts; grep -q "resolveAlias" src/cli/install.ts; grep -q "known-good" src/cli/install.ts # --known-good flag verify; grep -q "FormatRegistry\|format: 'date'\|format: \"date\"" src/manifest/schema/aliases.v1.ts # NEGATIVE: should NOT find (Phase 3.2 W2 Rule 1 lesson 守门)</automated>
  </verify>
  <done>13-surface registered + AliasesV1 + KnownGoodV1 schemas pass roundtrip (4+4 contract fixture pass); loadAliases + resolveAlias + listDeprecations fail-soft on missing + fail-loud on schema invalid (5 fixture pass); loadKnownGood + getPinnedVersion lazy load + per-version cache (5 fixture pass); checkDeprecations 3 status (pass/warn/fail) + table format multi-line (5 fixture pass); doctor 7th check dispatch works (--json output includes 'deprecated manifests' entry; sister 6th check parametrize); install resolveAlias 1-line pre-lookup + silent redirect (no console output); install --known-good flag commander option + lazy resolve + npm_version override; manifests/aliases.yaml + versions/0.3.0-known-good.yaml MVP empty seed; all NEW files ≤ Karpathy hard limit; doctor.ts 184→~189L; install.ts 117→~127L; typecheck clean; biome preempt clean</done>
</task>

<task type="auto">
  <name>Wave 2 — E2E integration (R7.5 + R7.6 acceptance) + observability + security + ADR 0016 + STATE/RETRO/ROADMAP 续编 + A7 守恒 + ship tags</name>
  <files>tests/integration/install-aliases.test.ts, tests/integration/install-known-good.test.ts, tests/integration/install-silent-redirect.test.ts, tests/manifest/aliases-security.test.ts, tests/manifest/knownGood-security.test.ts, docs/adr/0016-aliases-deprecation-known-good.md, .planning/STATE.md, .planning/RETROSPECTIVE.md, .planning/ROADMAP.md</files>
  <action>Run T2.1 → T2.10 per task_plan.md (sequential, ship cadence). **T2.1 install-aliases.test.ts**: NEW ~80L 3 fixture e2e R7.5 验收 — fixture 1 rename redirect e2e (seed aliases.yaml {old-package-name: {redirect: 'ctx7', reason, since_version: '0.3.0', deprecation_date: '2026-05-17'}} + run `harnessed install old-package-name --dry-run --non-interactive` + assert dry-run output path references manifests/tools/ctx7.yaml NOT manifests/tools/old-package-name.yaml + exit 0); fixture 2 unknown name + no alias (run `harnessed install nonexistent --dry-run --non-interactive` + assert stderr contains 'manifest .* not found' + exit 1 Karpathy fail-loud); fixture 3 alias 存在但 redirect target manifest 缺 (seed aliases.yaml {old-name: {redirect: 'missing-manifest', ...}} + run install + assert fail-loud with manifest-not-found, NOT crash with 'undefined manifest'). **T2.2 install-known-good.test.ts**: NEW ~70L 2 fixture e2e R7.6 验收 — fixture 1 lock hit (seed versions/0.3.0-known-good.yaml {upstreams: [{name: 'ctx7', version: '1.2.3', install_method: 'npm-cli'}]} + run `harnessed install ctx7 --known-good --dry-run --non-interactive` + assert dry-run output shows npm_version=1.2.3 override manifest default); fixture 2 lock miss (seed lock with upstreams: [] empty + run same command + assert fall back to manifest default npm_version graceful, no error). **T2.3 install-silent-redirect.test.ts**: NEW ~50L 1 fixture observability (D-02 守门) — seed aliases.yaml {old-name: {redirect: 'ctx7', ...}} + run `harnessed install old-name --dry-run --non-interactive` + capture stdout AND stderr via child_process spawn + assert combined output NOT 含 'redirect' substring + NOT 含 'deprecated' substring + NOT 含 'warning' substring; sister Phase 3.2 W2 stdout assertion 范式. **T2.4 aliases-security.test.ts + knownGood-security.test.ts**: NEW combined ~80L 3 fixture security per RESEARCH § 10.4 — fixture A1 path traversal redirect (aliases.yaml {harmful: {redirect: '../../../etc/passwd', ...}} → Value.Check returns true (TypeBox 仅 length validate NOT content) + install.ts path.resolve('manifests/tools/${resolvedName}.yaml') absolute-safe verify Node behavior not leak cwd → assert resolve OR error gracefully NOT exfiltrate); fixture A2 schema drift extra field tampering (aliases.yaml entry add EXTRA_FIELD → additionalProperties:false strict reject Value.Check false); fixture K1 malicious harnessed_version garbage 'rm -rf /' OR '9.9.9.invalid' → Value.Check semver pattern fail. **T2.5 ADR 0016**: NEW ~150L 9 章节 errata per Phase 3.2 ADR 0015 sister pattern — header + 1 D-01 RICH aliases (5 fields + reason maxLength 500 + ISO-date pattern not FormatRegistry) + 2 D-02 DOCTOR-ONLY-WARN install silent + doctor 7th table format + 3 D-03 YAML manifest versions/0.3.0-known-good.yaml + lazy load + 4 D-04 STATE COLLAPSE 5-recurrence terminus + STATE_POSITION_RE OR-fallback + 5 § 5 schemaVersion 12+13 surface manifest-domain colocation (sister Phase 3.2 W0.3 + Phase 3.3 W0.3 confirm-not-diverge) + 6 § 8 install resolveAlias pre-manifest-lookup 1-line surgical + 7 § 7 W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env + 8 § 12 3-wave W0-W2 topology + 9 ASR/ADR-stats. **T2.6 STATE.md**: append Phase 3.3 SHIPPED event log to existing 当前位置 块 (D-04 单 SSOT 后保留 当前位置 块作 SoT — 加 `**Phase 3.3 SHIPPED** (2026-05-MM) — aliases.yaml RICH + DOCTOR-ONLY-WARN deprecation + known-good lock + W0 backlog 3 项一次根治 (D-04 5-recurrence terminus + dashboard-sse fix path a + schema 12+13 surface)` 至 L23 GSD phase 链 first; 加 12th 历史 entry to 已完成 phase ship 历史 section (Phase 3.2 W0.2 added section). **T2.7 RETROSPECTIVE.md**: Phase 3.3 milestone retro entry — W0.1 D-04 5-recurrence terminus lesson (dual-SSOT anti-pattern 5 prior recurrences identified + COLLAPSE 根治) + W0.2 dashboard-sse fix path (a) lesson (RESEARCH-guided fix recipe verbatim + sister Phase 2.4 W4 Win 3-tier 8s waitFor 复用) + W1 manifest-domain schema colocation 3rd consumer pattern (sister Phase 1.X manifest/schema/spec.ts + Phase 3.2 workflow-domain workflow/schema/ + Phase 3.3 本 phase = 3rd domain colocation cycle) + W2 install resolveAlias 1-line surgical pre-lookup (Karpathy surgical exemplar — alias resolution in 1 line not 6) + D-02 silent install observability test (stdout NOT 'redirect|deprecated' substring 守门). **T2.8 ROADMAP.md**: Phase 3.3 ✅ SHIPPED marker + v0.3.0 3/4 进度 + Phase 3.4 prereq (路由命中率 ≥ 85% + token budget + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml + EE-4 BLOCKER auto-spawn rerun + userSpawn session_id capture). **T2.9 A7**: `git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l` == 0. **T2.10 tags**: `git tag adr-0016-accepted` + `git tag v0.3.0-alpha.3-aliases-known-good`.</action>
  <verify>
    <automated>corepack pnpm test -- --run tests/integration/install-aliases.test.ts tests/integration/install-known-good.test.ts tests/integration/install-silent-redirect.test.ts tests/manifest/aliases-security.test.ts tests/manifest/knownGood-security.test.ts 2>&1 | tail -10 # all pass; corepack pnpm test 2>&1 | tail -5 # full suite green; test -f docs/adr/0016-aliases-deprecation-known-good.md && wc -l docs/adr/0016-aliases-deprecation-known-good.md # ≥ 100; git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l # == 0 (A7 守恒); git tag --list | grep -E "adr-0016-accepted|v0\.3\.0-alpha\.3-aliases-known-good" | wc -l # == 2; grep -E "Phase 3\.3.*SHIPPED" .planning/STATE.md | wc -l # ≥ 1; grep -E "Phase 3\.3.*✅" .planning/ROADMAP.md | wc -l # ≥ 1; node scripts/check-transparency-verdicts.mjs # exit 0 (gate still pass post-Phase-3.3 ship); grep -E "redirect|deprecated|warning" <(corepack pnpm exec node dist/cli/index.js install old-package-name --dry-run --non-interactive 2>&1) | wc -l # == 0 (D-02 silent redirect守门 — but only if dist build present; skip if not)</automated>
  </verify>
  <done>install-aliases 3 fixture e2e pass (R7.5 acceptance "模拟上游改名场景 install 通过" satisfied); install-known-good 2 fixture e2e pass (R7.6 acceptance "harnessed install --known-good reproducible" satisfied); install-silent-redirect observability守门 (D-02 stdout/stderr NOT 'redirect|deprecated'); security tests 3 fixture pass (path traversal + extra field reject + semver pattern reject); ADR 0016 9 章节 finalized + A7 守恒 0 diff verified (sister Phase 3.2 T3.6 pattern); STATE.md/RETROSPECTIVE.md/ROADMAP.md 续编 (12th 历史 entry + Phase 3.3 ✅ + v0.3.0 3/4); adr-0016-accepted + v0.3.0-alpha.3-aliases-known-good tags pushed; Phase 3.3 SHIPPED</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| **manifests/aliases.yaml authored content → resolveAlias → install path** | aliases.yaml 是 project-tracked (git-managed) — author-controlled (harnessed maintainer + PR review gate). resolveAlias 返 redirect string 用于 install.ts path constructions (`manifests/tools/${resolvedName}.yaml`). Path traversal via malicious `redirect: '../../../etc/passwd'` mitigated by Node path.resolve absolute-safe + TypeBox `minLength: 1` validate. |
| **versions/<ver>-known-good.yaml authored content → getPinnedVersion → install npm_version override** | versions/ yaml 是 project-tracked (release-process-managed via git PR). getPinnedVersion 返 pinned version 用于 npm-cli installer 参数. Malicious version string injection mitigated by Phase 2.1 audit cmd-injection SHELL_EVAL_MARKERS refinement (npm-cli installer params sanitized at runtime). |
| **doctor 7th check `--json` output → CI consumer** | doctor `--json` deprecations array consumed by CI scripts. PRC 含 metadata (since_version + deprecation_date + reason) — no secrets surfaced (project-tracked metadata only). |
| **install path silent redirect (D-02 lock)** | install path uses resolvedName silently — no console.warn/log surface to stdout/stderr. R7.5 "install 通过" 语义对齐: install silent + doctor surface deprecation warning separately (two surfaces, two roles). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-3.3-01 | Tampering | malicious `manifests/aliases.yaml` `redirect: '../../../etc/passwd'` (path traversal via redirect name attempting cwd-leak) | mitigate | Node `path.resolve('manifests/tools/${resolvedName}.yaml')` is cwd-bound absolute-safe (resolves to absolute path within cwd OR throws). Additional defense: install.ts could regex-guard `resolvedName` against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces). Test fixture `tests/manifest/aliases-security.test.ts` verifies behavior. |
| T-3.3-02 | DoS | malicious `aliases.yaml` huge `reason` field memory exhaustion (e.g., 10MB string) | mitigate | TypeBox `maxLength: 500` cap on AliasEntryV1.reason (sister Phase 3.2 W1 governance.ts L21 DOS cap pattern). Value.Check returns false on overlength. |
| T-3.3-03 | Tampering | malicious `aliases.yaml` schema drift via extra field (e.g., `{redirect, reason, since_version, deprecation_date, EXTRA_FIELD: 'malicious'}`) | mitigate | `additionalProperties: false` strict on AliasEntryV1 + AliasesV1 outer (sister Phase 3.2 W1 governance.ts L26 pattern). Test fixture `tests/manifest/aliases-security.test.ts` verifies reject. |
| T-3.3-04 | Tampering | malicious `versions/<ver>-known-good.yaml` fake `harnessed_version: '9.9.9'` to mislead users into wrong pinned versions | accept | known-good.yaml is git-tracked + release-process-managed (PR review gate); content audit is process-level not code-level. Schema accepts any semver-shaped string (semver pattern `^\\d+\\.\\d+\\.\\d+$` validates shape only, not value). |
| T-3.3-05 | Injection | malicious `known-good.yaml` `version: '$(rm -rf /)'` injection via npm-cli installer parameter | mitigate | TypeBox `Type.String({minLength: 1})` validates length only; install.ts passes pinned version to npm-cli installer — sister Phase 2.1 audit cmd-injection SHELL_EVAL_MARKERS refinement applies (npm-cli installer params sanitized at runtime — Phase 2.1 W4 hard-fail audit gate). |
| T-3.3-06 | Tampering | malicious `aliases.yaml` schemaVersion drift `harnessed.aliases.v9` to bypass v1 validation | mitigate | Type.Literal(SCHEMA_VERSIONS.aliases) strict — only `harnessed.aliases.v1` accepted; v9 → Value.Check false → loadAliases throws fail-loud (Karpathy debug locality). |
| T-3.3-07 | Repudiation | deprecation audit trail (which manifest deprecated when by whom) | accept | aliases.yaml is git-tracked → `git blame manifests/aliases.yaml` provides per-line authorship + commit history audit trail (no in-code audit log needed). |
| T-3.3-08 | Information Disclosure | doctor `--json` output exposes RICH deprecation metadata (since_version + deprecation_date + reason) | accept | Metadata is project-tracked git content (no secrets); CI exposure is intentional (R7.5 验收 "doctor / install 阶段显式提示" requires surface visibility). |

</threat_model>

<verification>
**Phase-level verification gates (all must pass before T2.10 ship tags):**

1. **Full test suite green** (every Wave 内): `corepack pnpm test` → 623+ (Phase 3.2 baseline) → ~661+ tests / 0 fail (本 phase ~38 NEW fixture per RESEARCH § 10.1 target)
2. **CI 3-OS green** (every Wave 内): GitHub Actions all 3 OS (Linux/macOS/Win) green; W0.2 dashboard-sse fix 4/4 cell pass on Win (first acceptance bar of Phase 3.3)
3. **Karpathy hard limit per-file** (Wave 1 完成时): all NEW src/ files ≤ 200L AND per-spec budgets — check-deprecations.ts ≤ 40L (PRIMARY helper sister probe-gstack 48L) + aliases.ts ≤ 40L + knownGood.ts ≤ 45L + aliases.v1.ts ≤ 40L + known-good.v1.ts ≤ 45L; MODIFY doctor.ts ≤ 200L (184 → ~189L Karpathy clean, no B-03 5% tolerance needed per RESEARCH § 12.3 verified baseline) + install.ts ≤ 200L (117 → ~127L)
4. **Schema discipline CD-5**: `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` ≥ 13 (10 actual baseline → 11 T0.5 backfill planFeature.v1 → 13 W1 T1.1 double-add aliases + knownGood); `grep -E "harnessed\\.aliases\\.v1|harnessed\\.known-good\\.v1|harnessed\\.plan-feature\\.v1" src/types/schemaVersion.ts | wc -l` ≥ 3 (T0.5 backfill planFeature + W1 double-add aliases + knownGood all 3 visible)
5. **TypeBox ISO-date pattern lesson 守门** (sister Phase 3.2 W2 Rule 1): `! grep -E "FormatRegistry|format: 'date'|format: \"date\"" src/manifest/schema/aliases.v1.ts src/manifest/schema/known-good.v1.ts` exit 0 (NEGATIVE check — pattern must be `^\\d{4}-\\d{2}-\\d{2}$` NOT FormatRegistry)
6. **Biome lint preempt** (project memory feedback_biome-preempt.md, 3 CI-red recurrences): `pnpm exec biome check --write` 每 commit 前本地必跑
7. **R7.5 acceptance** (模拟上游改名场景 install 通过 + 提示): T2.1 install-aliases 3 fixture pass (rename redirect + unknown fail-loud + alias-target-missing fail-loud) + T2.3 install-silent-redirect 1 fixture pass (D-02 silent install观查 stdout/stderr NOT 'redirect|deprecated' substring) + T1.12 check-deprecations 5 fixture pass (doctor 7th check status pass/warn/fail + table format)
8. **R7.6 acceptance** (harnessed install --known-good reproducible): T2.2 install-known-good 2 fixture pass (npm_version override + fallback graceful) + T1.12 knownGood 5 fixture pass (loadKnownGood + getPinnedVersion lazy + per-version cache)
9. **A7 ADR conservation** (T2.9): `git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l` == 0 (only ADR 0016 NEW; 0001-0015 不动)
10. **W0.1 守门** (D-04 5-recurrence terminus): post-T0.1 `! grep -q "^> Status:" .planning/STATE.md` exit 0 + `! grep -q "^> 最后更新：" .planning/STATE.md` exit 0 + `grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit 0 + `node scripts/check-transparency-verdicts.mjs` exit 0 (transparency gate pass)
11. **W0.2 守门** (dashboard-sse fix path a): post-T0.2 `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3` 4/4 pass + `grep -q "DASHBOARD_PORT" scripts/dashboard.mjs` exit 0 + `grep -q "DASHBOARD_PORT\|createNetServer" tests/scripts/dashboard-sse.test.ts` exit 0
12. **Threat model coverage** (security tests): T2.4 3 fixture pass (path traversal + extra field reject + semver pattern reject) — STRIDE T-3.3-01 + T-3.3-03 + T-3.3-05 covered by test fixtures

**Per-task acceptance**: each task in task_plan.md carries grep-verifiable `<acceptance_criteria>` block; executor runs verify per task before commit.
</verification>

<success_criteria>
**Phase 3.3 SHIPPED criteria (all must hold):**

- [ ] Wave 0 W0.1 D-04 STATE COLLAPSE 5-recurrence terminus (L4 + L5 删 + STATE_POSITION_RE OR-fallback for STATE.md only + transparency gate exit 0)
- [ ] Wave 0 W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env injection (dashboard.mjs +1L + test +12L net + 4/4 cell pass = first acceptance bar)
- [ ] Wave 0 W0.3 schema decision record (12+13 surface double-add aliases.v1 + knownGood.v1 manifest-domain colocation + Path divergence from PATTERNS.md confirm-not-diverge section)
- [ ] Wave 0 T0.5 schemaVersion 10 → 11 backfill (planFeature.v1 11th surface register; sister Phase 3.2 W2 T2.2 b875e21 commit msg stale claim surgical fix; sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern)
- [ ] Wave 0 T0.5 schemaVersion 10 → 11 backfill (planFeature.v1 sister Phase 3.2 W2 T2.2 b875e21 stale claim register fix) + Wave 1 T1.1 schemaVersion 11 → 13 (aliases.v1 + knownGood.v1 double-add) + `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` ≥ 13
- [ ] Wave 1 aliases.v1 + known-good.v1 TypeBox schemas pass roundtrip + ISO-date pattern NOT FormatRegistry (sister Phase 3.2 W2 Rule 1 lesson 守门) + additionalProperties:false strict
- [ ] Wave 1 aliases.ts + knownGood.ts loaders fail-soft on missing file + Karpathy fail-loud throw on schema invalid (5 fixture each pass)
- [ ] Wave 1 check-deprecations.ts ≤ 40L PRIMARY helper (sister probe-gstack 48L) + table format multi-line aggregation (5 fixture pass)
- [ ] Wave 1 doctor.ts 184 → ~189L ≤ 200L Karpathy clean (7th check `deprecated manifests` dispatch + --json output + B-06 warn ≠ fail)
- [ ] Wave 1 install.ts resolveAlias pre-manifest-lookup 1-line surgical (D-02 silent redirect locked, NO console output) + --known-good flag commander option + lazy resolve + npm_version override
- [ ] Wave 1 manifests/aliases.yaml + versions/0.3.0-known-good.yaml MVP empty seed (Phase 3.4 dogfood adds actual entries)
- [ ] Wave 2 install-aliases 3 fixture pass (R7.5 acceptance "模拟上游改名场景 install 通过") + install-silent-redirect 1 fixture pass (D-02 守门 stdout/stderr NOT 'redirect|deprecated' substring)
- [ ] Wave 2 install-known-good 2 fixture pass (R7.6 acceptance "harnessed install --known-good reproducible")
- [ ] Wave 2 security tests 3 fixture pass (T-3.3-01 path traversal + T-3.3-03 extra field reject + T-3.3-05 semver pattern reject)
- [ ] Wave 2 ADR 0016 9 章节 + A7 守恒 0 diff (sister Phase 3.2 T3.6 pattern)
- [ ] Wave 2 STATE.md (12th 历史 entry + Phase 3.3 SHIPPED event log + 当前位置 块更新) + RETROSPECTIVE.md + ROADMAP.md 续编 Phase 3.3 ✅
- [ ] Wave 2 baseline tag `adr-0016-accepted` + milestone tag `v0.3.0-alpha.3-aliases-known-good` pushed
- [ ] v0.3.0 milestone 3/4 progress (Phase 3.1 + Phase 3.2 + Phase 3.3 shipped; Phase 3.4 pending — 路由命中率 ≥ 85% + token budget + plan-feature dogfood)
</success_criteria>

<output>
After completion, create `.planning/phase-3.3/3.3-01-SUMMARY.md` per `$HOME/.claude/get-shit-done/templates/summary.md` template.

Summary must cover:
- Phase 3.3 D-01~D-04 lock implementation outcomes (RICH aliases / DOCTOR-ONLY-WARN / YAML known-good / STATE COLLAPSE)
- 3 Wave × 25 atomic task ship cadence
- W0.1 D-04 STATE COLLAPSE 5-recurrence pattern terminus achieved (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 dual → COLLAPSE single)
- W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env applied (RESEARCH-guided recipe verbatim + sister Phase 2.4 W4 Win 3-tier 8s waitFor 复用 + 4/4 cell pass)
- W0.3 schemaVersion 12+13 surface double-add (aliases.v1 + known-good.v1 manifest-domain colocation + Path divergence from PATTERNS.md confirm-not-diverge section)
- schemaVersion 3rd domain colocation cycle 实证 (Phase 1.X manifest-domain manifest/schema/ + Phase 3.2 workflow-domain workflow/schema/ + Phase 3.3 manifest-domain manifest/schema/ continuation)
- doctor 7th check sister Phase 3.2 W1 checkGstackPrefix 100% reuse extract pattern (PRIMARY helper check-deprecations.ts ≤40L 守 doctor.ts ≤200L cycle 3rd consumer)
- install resolveAlias 1-line surgical pre-manifest-lookup (Karpathy surgical exemplar — alias resolution in 1 line not 6)
- D-02 silent install observability test (stdout NOT 'redirect|deprecated' substring 守门 — install path silent + doctor surface两 surface共同达成 R7.5 "install 通过 + 提示" 语义)
- TypeBox ISO-date pattern lesson 复用 (sister Phase 3.2 W2 Rule 1 — pattern '^\\d{4}-\\d{2}-\\d{2}$' NOT FormatRegistry 'format: date')
- ADR 0016 9 章节 + A7 守恒 verify outcome
- Phase 3.4 prereq carry-forward (路由命中率 ≥ 85% + token budget 监控 + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml + EE-4 BLOCKER auto-spawn rerun + userSpawn session_id capture)
- v0.3.0 3/4 milestone progress + remaining Phase 3.4 scope
</output>
</content>
</invoke>