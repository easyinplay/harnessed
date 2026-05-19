# ADR 0023: Phase 6.1 — npm publish release process (GitHub Actions OIDC provenance)

## Status

**Accepted (phase 6.1 W1 — 2026-05-20)** — phase 6.1 plan-phase PLAN.md 1546L 19 tasks 3 waves
ready → Wave 0 STATE D2 iter 8 TERMINUS + #BA retire + npm rehearsal 4/4 PASS + 756 baseline →
Wave 1 T1.0 PREREQ (npm account + Trusted Publishers deferred fallback documented) + T1.1
NEW `.github/workflows/publish.yml` 39L OIDC tag-trigger + T1.2 package.json `private` removal +
version `0.3.0` → `1.0.0` + `author` field + T1.3 本 ADR → Wave 2 close cadence artifacts ship →
🎯 v1.0 tag LOCAL CREATE → Accepted at phase 6.1 ship.

> Phase 6.1 は v1.0 GA milestone **FINAL phase (1/1)**, 把 v1.0 装配为 **D-02 NpmPublishStrategy
> `.github/workflows/publish.yml` NEW OIDC trusted publishing (no NPM_TOKEN long-lived token;
> id-token:write permission + npm publish --provenance --access public) + D-05 PackageJsonUpdate
> `private` removal + version 1.0.0 + `author` field + ADR 0023 PRIMARY anchor + ci.yml A7 iter
> 0022→0023 + 🎯 v1.0 tag LOCAL CREATE 25-40L annotation (D-04)**. M-01 PRODUCTION RELEASE phase
> class lock — 沿袭 ADR 0022 多決策 errata 模式.

## Context

D-02 NpmPublishStrategy spec verbatim: GitHub Actions `.github/workflows/publish.yml` NEW +
release-by-tag trigger + npm provenance attestation (sigstore-backed). Phase 6.1 FINAL phase.
Three options evaluated: (a) manual npm token + 2FA local publish — REJECTED long-lived token
risk + manual 2FA prompt every release; (b) long-lived NPM_TOKEN in CI secrets — REJECTED token
rotation debt + secret sprawl; (c) OIDC Trusted Publishing (no long-lived token) — SELECTED
supply-chain security 2024+ best practice. D-02 LOCKS option (c).

D-05 PackageJsonUpdate: `"private": true` removed (blocks publish), `"version": "0.3.0"` →
`"version": "1.0.0"` (v1.0 GA), `"author": "easyinplay"` added. All other metadata fields
already present and correct (description, keywords, homepage, repository, bugs, license, bin,
files whitelist — verified clean via `npm pack --dry-run` Wave 0 T0.3 rehearsal).

Phase 6.1 = PRODUCTION RELEASE decision phase per M-01 LOCK (publish.yml NEW GitHub Actions
workflow establishing permanent OIDC release pipeline) ≠ R-5 publish-only passthrough.
Full ship cadence applies: ADR 0023 institutional lock justified per:
- CONTEXT.md line 140: "recommend NEW ADR 0023 institutional lock (NOT close ceremony —
  production release CADENCE pattern)"
- ADR 0022 § Errata-path note (explicit): "v0.6.0+ 演化走 ADR 0023+ errata"
- Phase class M-01: publish.yml qualifies as "infrastructure-level architectural NEW"

### A7 守恒约束 (ADR 0001-0022 main body 不可改)

Phase 6.1 沿袭 ADR 0022 errata 风格 — **不动 ADR 0001-0022 main body** (A7 守恒). baseline tag
iterate 0022 → 0023 (Wave 2 T2.X LOCAL CREATE `adr-0023-accepted` tag; ci.yml A7 step iter
`0022` → `0023` single extend NOT retroactive — Phase 5.2 W2 T2.7 已 iter 0021→0022).
本 ADR 0023 起 phase 6.1 ship 时刻 frozen; v1.1+ 演化走 ADR 0024+ errata.

## Decisions

### 1. D-02 NpmPublishStrategy — OIDC Trusted Publishing no NPM_TOKEN (HIGH, deliberate)

`.github/workflows/publish.yml` NEW: trigger `push: tags: v[0-9]+.[0-9]+.[0-9]+` (semantic
version only; excludes alpha/rc/beta tags). `permissions: id-token: write` (OIDC token minting)
+ `contents: read` (minimal privilege). ubuntu-latest only (publish platform-agnostic; no matrix).
SHA-pinned actions (checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 v4.3.1 +
setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 v4.4.0 — sister ci.yml H1 SHAs verbatim).
`registry-url: 'https://registry.npmjs.org'` required for setup-node OIDC .npmrc generation.
`corepack enable` + `corepack pnpm install --frozen-lockfile` + `corepack pnpm build` (sister
ci.yml pattern). `npm publish --provenance --access public` (D-02 LOCKED; NOT pnpm publish —
npm CLI canonical for OIDC provenance per OQ-4 RESOLVED). sigstore attestation auto-generated.
`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` env: fallback if Trusted Publishers UI not yet
configured (granular access token path; prefer OIDC once Trusted Publishers registered).
Sneak-blocks: NO npm token + 2FA local (long-lived token risk) + NO pnpm publish (OIDC less
reliable per research OQ-4) + NO hybrid manual first + OIDC after (over-engineering).

### 2. D-05 PackageJsonUpdate — private removal + 1.0.0 + author (MED, batch)

`"private": true` REMOVE (was blocking publish). `"version": "0.3.0"` → `"version": "1.0.0"`
(jump 0.5.0 → 1.0.0 sister CHANGELOG cadence延袭; NO intermediate 1.0.0-rc.X per D-05
sneak-block). `"author": "easyinplay"` ADD (was missing; only field absent per RESEARCH § 3).
`files` array whitelist unchanged — already correct (51 files 210.5 kB compressed Wave 0 T0.3
npm pack --dry-run PASS; no .planning/, no tests/, no src/ in tarball — confirmed clean).
Sneak-blocks: NO custom registry URL (default npmjs.org) + NO bump to 1.0.0-rc.X.

### § M-01 PhaseClass PRODUCTION RELEASE LOCK

Phase 6.1 = production release ship (publish.yml NEW CI/CD infrastructure + OIDC security
pattern + permanent release cadence lock for v1.x future releases) ≠ R-5 NOT invoked (Wave A
Research finding confirmed). Full ship cadence applies.

## A7 Conservation

ADR 0001-0022 main body **untouched**; baseline tag iteration `adr-0001-accepted`…`adr-0022-accepted`
(Phase 5.2 ship) → 加 `adr-0023-accepted` (Phase 6.1 Wave 2 T2.X LOCAL CREATE).

### A7 守恒验收命令 (phase 6.1 ship 後 0001-0023 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018 0019 0020 0021 0022 0023; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0023 main body unchanged"
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0022` → `for n in ... 0022 0023`;
step name `ADR 0001-0022` → `ADR 0001-0023`; echo `ADR 0001-0022` → `ADR 0001-0023`
(Wave 2 T2.2 落地; single extend NOT retroactive).

## Consequences

**Capability deltas (Phase 6.1 ship 後新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| npm publish stream | NEW `.github/workflows/publish.yml` 39L OIDC tag-trigger | tag push v*.*.* → CI workflow fires |
| Supply-chain provenance | sigstore attestation via `--provenance` flag | npm provenance check on registry |
| package.json publishable | `private` removed + version 1.0.0 + author added | `npm pack --dry-run` shows harnessed@1.0.0 |
| Future releases | tag push v1.x.y → auto-publish (no per-release manual steps) | publish.yml workflow reuse |

**Negative consequence + mitigation**: Trusted Publishers UI config is a one-time manual
external prereq (npm registry side). Fallback: `secrets.NPM_TOKEN` granular access token path
documented in T1.0 PREREQ status doc + publish.yml `NODE_AUTH_TOKEN` env reference.

## Compliance

**F1-F8 8/8 acceptance bar:**

- **F1 ADR 0023 accepted** — 本 ADR Status flip (T1.3 W1)
- **F2 publish.yml NEW** — T1.1 PASS (39L OIDC tag-trigger; sister ci.yml SHA-pins)
- **F3 package.json 3 changes** — T1.2 PASS (private removed + 1.0.0 + author; 756 tests PASS)
- **F4 ci.yml A7 iter 0022→0023** — T2.2 Wave 2 single extend
- **F5 DOGFOOD-T2.X.md 3-axis PASS** — T2.7 Wave 2
- **F6 RETROSPECTIVE Phase 6.1** — T2.8 Wave 2
- **F7 STATE.md FINAL update** — T2.9 Wave 2
- **F8 🎯 v1.0 tag LOCAL CREATE** — T2.10 Wave 2 (user push approval required)

## Errata-path note

Phase 6.1 走 ADR 0023 errata pattern (新決策 inline; ADR 0001-0022 0-diff preserved). Future
v1.1+ 走 ADR 0024+ errata. 本 ADR 0023 起 phase 6.1 ship 时刻 frozen — post-v1.0 maintenance-only
mode 演化 (Trusted Publishers scope change / new npm OIDC patterns / package rename) 必须开
ADR 0024+ errata.

## References

### 内部依据

- `docs/adr/0022-uninstall-and-path-traversal.md` (Phase 5.2 PRIMARY — 9-section format template)
- `docs/adr/0020-active-development-window-binding.md` (D-04 HYBRID 2-clock; organic clock OPENED)
- `docs/adr/0021-state-lock-and-audit-consumer.md` (state lock pattern; v0.5.0 security posture)
- `.github/workflows/publish.yml` (T1.1 NEW 39L — D-02 OIDC tag-trigger)
- `package.json` (T1.2 MODIFIED — D-05 private removal + 1.0.0 + author)
- `.planning/phase-6.1/{6.1-CONTEXT,PLAN,PLAN-CHECK,6.1-PATTERNS,RESEARCH}.md`

### 外部参考

- npm Trusted Publishing docs (docs.npmjs.com/trusted-publishers; OIDC no-token pattern)
- npm provenance statements (docs.npmjs.com/generating-provenance-statements; --provenance flag)
- sigstore supply-chain attestation (bundled npm ≥9.5; automatic via --provenance)
- GitHub Actions OIDC (docs.github.com — id-token:write permission; tokenless auth)
