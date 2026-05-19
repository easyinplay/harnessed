---
phase: 5.2
version: 1
status: ready
type: phase
plan: 1
wave: 0
depends_on: [phase-5.1]
gap_closure: false
autonomous: true

# Frontmatter sister Phase 5.1 PLAN.md 100% template reuse — adapted Phase 5.2 ARCHITECTURAL scope
# Phase 5.2 = v0.5.0 milestone 2/3 PROGRESS (M-01 ARCHITECTURAL phase class LOCK NOT R-5 publish-only sister Phase 5.1延袭)
# 8 D-decisions LOCKED (CONTEXT 5.2-CONTEXT.md L28-114):
#   R10.3 D-01 per-method 7 NEW src/uninstallers/*.ts + D-02 ephemeral no-op + warn + D-05 --dry-run default + D-06 --yes bypass + D-07 NO --keep-backup
#   R10.4 D-03 5 vector minimal MVP OWASP A1 + D-04 resolveAlias + manifest path 2 sites + D-08 generic PathTraversalError NOT leak path
# M-01 LOCKED (CONTEXT L18-25): PhaseClass ARCHITECTURAL — full ship cadence ADR 0022 + ci.yml A7 step iter 0021→0022 + dual tag (sister Phase 5.1 alpha.1 cadence延袭; 🎯 v0.5.0 milestone tag reserved Phase 5.3)

requirements:
  - R10.3  # harnessed uninstall command #BV — `harnessed uninstall <name>` 14th CLI subcommand + 7 per-method uninstaller (sister installers/ symmetric)
  - R10.4  # path traversal regex hardening #AH — `src/manifest/lib/path-guard.ts` NEW + 5 OWASP A1 vector regex + 4 call site integration

files_modified:
  # ===== W0 cadence absorb + sub-batch (4 项 STRICT path-dep T0.1 → T0.2 → T0.3 + T0.4; sister Phase 5.1 W0 cadence延袭) =====
  - .planning/STATE.md                                          # T0.1 D2 cadence iter 6 REINFORCE — trim Phase 4.3+5.1 narrative (~-20-30L expected) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 + Phase 5.1; sister Phase 5.1 W0 T0.1 5th-iter terminus → Phase 5.2 W0 T0.1 6th-iter REINFORCE (post-5-iter-terminus stable signal confirm; if confirmed at 6th iter, D2 cadence formally institutionalized "implicit-standing-process" Phase 5.3+)
  - .planning/RETROSPECTIVE.md                                  # T0.1 — receive Phase 4.3+Phase 5.1 narrative section (verbatim relocate); ALSO W2 T2.10 Phase 5.2 milestone retrospective append + cross-milestone v0.5.0 close-prep trends section (NOT milestone close; v0.5.0 milestone close 留 Phase 5.3)
  - scripts/check-state-archive-stale.mjs                       # T0.2 CONDITIONAL D1 SIZE_LIMIT 165→? round 3 decision per CONTEXT #BA L122 decision tree: IF post-T0.1 STATE ≤150L → tighten 165→150 (15L headroom; sister Phase 4.3 W0.2 200→175 cadence延袭 tighter as more confidence) / 151-160L → DEFER #BA Phase 5.3+ (5th DEFER signal — reassess if formal close vs continue defer) / >160L → BLOCKED escalate W0.1 trim sufficiency investigation
  # ===== W0 sub-batch absorb (#BH + #BI; sister #BQ planner Wave B discretion per Phase 5.1 cadence) =====
  - src/cli/lib/validateFlags.ts                                # T0.3 NEW ~20-30L (sub-batch #BH MED) — extract `function validateNonInteractiveFlags(raw, cmdName)` 5-site duplicate (install.ts L68-74 + install-base.ts L51-56 + research.ts L37-43 + manifest-add.ts L39-41 + execute-task.ts L39-43; RESEARCH § 4 verified 5 grep hits); console.error + process.exit(2) preserve verbatim error message per RESEARCH § 4 L578-585; export sig `(raw: { nonInteractive?: boolean; apply?: boolean; dryRun?: boolean }, commandName: string) => void`
  - src/uninstallers/lib/runOrPreview.ts                        # T0.3 NEW ~25-40L (sub-batch #BI MED) — extract `function dryRunGate(ctx)` 4+-installer duplicate (installers/npmCli.ts L87-88 + mcpStdioAdd.ts L120 + mcpHttpAdd.ts L219 + ccPluginMarketplace.ts L160 + gitCloneWithSetup.ts L180 + npxSkillInstaller.ts L143 + ccHookAdd.ts L89; RESEARCH § 4 verified 7-way dup); pattern `if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }` simple helper for uninstaller reuse (NOT installer regression scope — installer files unchanged Phase 5.2); export sig `(ctx: UninstallContext) => UninstallResult | null` (null means proceed, non-null means abort+return)
  - src/cli/install.ts                                          # T0.3 MODIFY ~-3L net — H1 gate L68-74 replace with `validateNonInteractiveFlags(raw, 'install')` import call
  - src/cli/install-base.ts                                     # T0.3 MODIFY ~-3L net — same pattern
  - src/cli/research.ts                                         # T0.3 MODIFY ~-3L net — same pattern
  - src/cli/manifest-add.ts                                     # T0.3 MODIFY ~-2L net — same pattern (shorter inline block)
  - src/cli/execute-task.ts                                     # T0.3 MODIFY ~-3L net — same pattern

  # ===== W1 R10.3 uninstall CLI + 7 NEW uninstallers (8 项 — Phase 5.2 architectural anchor #1) =====
  - src/uninstallers/lib/types.ts                               # T1.1 NEW ~25-35L — UninstallOpts + UninstallContext + UninstallResult + Uninstaller types (sister src/installers/lib/types.ts symmetric); UninstallOpts = { apply: boolean; dryRun: boolean; yes: boolean }; UninstallResult union { ok:true; removedPaths:string[] } | { ok:false; phase; error; suggest? } | { aborted:true; reason }
  - src/uninstallers/index.ts                                   # T1.2 NEW ~25-35L (≤200L Karpathy PASS large headroom) — Phase 5.2 R10.3 D-01 LOCKED per-method dispatch table sister src/installers/index.ts L28-37 symmetric 100% reuse; `Record<Manifest['spec']['install']['method'], Uninstaller>` + `runUninstall(manifest, opts) → Promise<UninstallResult>`; drop `levelOf()` (uninstall has no L4 --system gate per RESEARCH § 2.1 D-01 note)
  - src/uninstallers/npmCli.ts                                  # T1.2 NEW ~25-35L — `npm uninstall <pkg>` via spawn (NOT runArgs — runArgs prefixes 'claude' per RESEARCH § Pitfall 1 + L242-244); D-02 ephemeral detect `/\bnpx\s+(--yes|-y)\b/.test(install.cmd)` → exit 0 + warn message verbatim per CONTEXT D-02 L54-56 + RESEARCH § 2.1 L139-152
  - src/uninstallers/mcpStdioAdd.ts                             # T1.2 NEW ~20-30L — `claude mcp remove <name> --scope project` via `runArgs` from installers/lib/runClaudeArgs.js (Phase 5.1 W0 #BF extract reuse per RESEARCH § Don't Hand-Roll table); discriminator `install.method !== 'mcp-stdio-add'` preflight error via err() from installers/lib/err.js (Phase 5.1 W0 #BG extract reuse)
  - src/uninstallers/mcpHttpAdd.ts                              # T1.2 NEW ~20-30L — IDENTICAL body to mcpStdioAdd.ts (`claude mcp remove` transport-agnostic per RESEARCH § 2.2 + PATTERNS § 2.4); discriminator `install.method !== 'mcp-http-add'`
  - src/uninstallers/ccPluginMarketplace.ts                     # T1.2 NEW ~25-35L — `claude plugin uninstall <plugin>@<marketplace>` via runArgs; parseCmd helper inline (duplicate from src/installers/ccPluginMarketplace.ts L55-68 — YAGNI per RESEARCH § 2.3 + § 7 Q2 single-caller; or import if export added)
  - src/uninstallers/gitCloneWithSetup.ts                       # T1.2 NEW ~30-40L — `fs.rm(cloneTarget, { recursive: true, force: true })` cross-OS (Node 22 native NO shell per RESEARCH § Don't Hand-Roll + 2.4); extractCloneTarget helper inline duplicate (28L from src/installers/gitCloneWithSetup.ts L70-98 per RESEARCH § 2.4 + § 7 Q1 YAGNI single-caller); `force:true` idempotent if already absent
  - src/uninstallers/npxSkillInstaller.ts                       # T1.2 NEW ~20-30L — `fs.rm(join(homedir(), '.claude', 'skills', skillName), { recursive: true, force: true })` per RESEARCH § 2.5; extractSkillName helper inline duplicate (from src/installers/npxSkillInstaller.ts L47-54 per § 7 Q2 YAGNI); NOT ephemeral (npxSkill writes persistent files per RESEARCH § 2 L155 + Pitfall 2)
  - src/uninstallers/ccHookAdd.ts                               # T1.2 NEW ~35-45L — reverse JSON deep-merge `~/.claude/settings.json` per RESEARCH § 2.6; readFile + JSON.parse + `settings.hooks[ev].filter(h => !(h.command===cmd && h.matcher===matcher))` + delete empty hooks[ev] + writeFile + verify re-read; idempotent (settings.json absent or hook not present → ok:true noop per RESEARCH § 2.6 L360-368); 3 install fields used: install.hook_event + install.hook_command + install.hook_matcher (RESEARCH § A4 verified)
  - src/cli/uninstall.ts                                        # T1.2 NEW ~110-140L (≤200L Karpathy PASS 60-90L headroom; sister src/cli/install.ts 145L 90% reuse per PATTERNS § 14L cli/uninstall.ts) — CLI subcommand register 14th in src/cli.ts; D-05 dry-run default + D-06 --yes bypass H1 gate + D-02 ephemeral pre-check via `runUninstall` dispatch; imports `guardPath` from ../manifest/lib/path-guard.js (R10.4 D-04 hardening site 2 — invoke BEFORE resolve(manifestPath))
  - src/cli.ts                                                  # T1.3 MODIFY ~+2L — add `import { registerUninstall } from './cli/uninstall.js'` + `registerUninstall(program)` 14th subcommand register (sister Phase 5.1 W1 T1.3 13th audit-log register cadence延袭; alphabetical insert)
  # ===== W1 R10.3 TDD (1 项) =====
  - tests/cli/uninstall.test.ts                                 # T1.3 NEW ~150-180L (≤200L PASS; TDD red-green-refactor per CLAUDE.md "核心业务逻辑/算法/高可靠性场景强制 TDD"); sister tests/cli/audit-log.test.ts 242L ExitError + runCli helper 100% reuse per PATTERNS § 2.4; 10-14 cells covering 7 method × edge case per CONTEXT § Open Q + RESEARCH § 3.5: (1) H1 gate --yes without --apply → exit 2 (2) manifest not found → exit 1 (3) dry-run default no --apply → preview output exit 2 aborted (4) --apply ephemeral (npx --yes) → exit 0 + D-02 warn (5) --apply git-clone → fs.rm called correct path exit 0 (6) --apply npx-skill → fs.rm called ~/.claude/skills/<name> exit 0 (7) --apply mcp-stdio-add → runArgs(['mcp','remove',name]) called exit 0 (8) --apply mcp-http-add → runArgs same exit 0 (9) --apply cc-plugin → runArgs(['plugin','uninstall',slug]) exit 0 (10) --apply --yes skips confirm prompt exit 0 (11) runArgs spawn error → exit 1 (12) cc-hook-add inverse merge → settings.json filter out matching entry exit 0 (13) path traversal name → PathTraversalError → exit 1 (14) cross-OS Win+Linux+macOS CI green Day 1 verify (CI matrix not test-internal)
  - .planning/phase-5.2/DOGFOOD-T1.X.md                         # T1.4 NEW ~30-50L W1 R10.3 mid-wave empirical evidence sister Phase 5.1 DOGFOOD-T1.X.md format 100% reuse adapted W1 scope only (final 3-axis DOGFOOD in W2): (A) 7 uninstaller + cli/uninstall.ts ≤200L Karpathy verify each via `wc -l src/uninstallers/*.ts src/cli/uninstall.ts` + tests/cli/uninstall.test.ts ≥10 cells PASS (B) PREREQ verify Wave 1 entry: `claude mcp remove --help` exit 0 + `claude plugin uninstall --help` exit 0 (A1/A2 ASSUMPTION RESEARCH § Assumptions Log resolve) (C) ephemeral detect smoke: manual `harnessed uninstall <ephemeral-manifest> --apply` exit 0 + warn message present (verify D-02)

  # ===== W2 R10.4 path-guard + ADR 0022 + ci.yml A7 + milestone artifacts (14 项 — Phase 5.2 architectural anchor #2 + ship cadence) =====
  - src/manifest/lib/path-guard.ts                              # T2.1 NEW ~30-50L PRIMARY R10.4 anchor (≤200L Karpathy PASS 150L+ headroom) — D-03 LOCKED 5 OWASP A1 path traversal vectors module-level pre-compiled RegExp array (NOT inside loop per RESEARCH § 3.1 + sister Phase 5.1 R10.1 REDACT_PATTERNS symmetric design); PathTraversalError class extend Error with D-08 generic message `'path traversal attempt detected'` NOT echo user input (CSO veto per CONTEXT D-08 L110-114); export `guardPath(input: string): void` throws on first match; 5 patterns verbatim per CONTEXT D-03 L66-71 + RESEARCH § 3.1 L448-454: (1) `/\.\.\//` Unix dot-dot (2) `/\.\.\\/` Win backslash (3) `/\x00/` null byte (4) `/%2[eE]%2[eE]/` URL-encoded (5) `/%25[2][eE]%25[2][eE]/` double-encoded
  - tests/manifest/path-guard.test.ts                           # T2.2 NEW ~80-120L (≤200L PASS) — TDD red-green-refactor per CLAUDE.md core security logic 强制; sister tests/manifest/aliases-security.test.ts pattern (no vi.mock needed — pure function); 7-9 cells per CONTEXT § Open Q + RESEARCH § 3.5: (1) Unix `../../etc/passwd` → throws (2) Win `..\windows\system32` → throws (3) null byte `path\x00attack` → throws (4) URL-encoded `%2e%2e%2fetc` → throws (5) double-encoded `%252e%252e%252f` → throws (6) D-08 verify: error.message does NOT contain user input string `../../etc/passwd` (7) safe path `manifests/tools/ctx7.yaml` → no throw (8) safe simple name `ctx7` → no throw (9) safe path with dashes/underscores `my-tool_v2` → no throw
  - src/manifest/aliases.ts                                     # T2.3 MODIFY ~+2L — R10.4 D-04 hardening site 1; add `import { guardPath } from './lib/path-guard.js'` + invoke `guardPath(name)` first line of `resolveAlias(name)` per RESEARCH § 3.2 L491-503 (BEFORE loadAliases yaml lookup; transitive protection for both install + uninstall + audit-log paths)
  - src/cli/install.ts                                          # T2.4a MODIFY ~+2L — R10.4 D-04 hardening site 2; invoke `guardPath(resolvedName)` after L81 alias resolution + BEFORE L82 `resolve(process.cwd(), manifests/tools/${resolvedName}.yaml)` (defense-in-depth for alias redirect value per RESEARCH § 3.3 L518-523 + § A6 + § 7 Q5)
  - src/cli/audit-log.ts                                        # T2.4b MODIFY ~+1L — R10.4 D-04 add `guardPath` for AUDIT_PATH-adjacent inputs IF any user-controlled path inputs exist (verify via grep `process.argv\|opts\.` for path-shaped inputs; CONTEXT D-04 L86 audit/log.ts JSONL path HARDCODED so audit-log consumer likely NOT user-controlled — verify Wave 2 entry; IF zero user-controlled path inputs → SKIP this file entry + document SKIP-rationale in T2.4b acceptance per Karpathy YAGNI; expected minimal/no change)
  - src/cli/uninstall.ts                                        # T2.4c (already created T1.2) — verify guardPath invoked BEFORE manifest path resolve (sister install.ts L82 hardening symmetric per RESEARCH § 3.3); MUST screen resolvedName after alias resolution + screen original `name` flag at CLI entry (defense-in-depth)
  - docs/adr/0022-uninstall-and-path-traversal.md               # T2.5 NEW ~140-180L PRIMARY ADR 9-section format sister docs/adr/0021-state-lock-and-audit-consumer.md 174L 100% reuse adapted per RESEARCH § 5.1: Status (Accepted phase 5.2 W2 — 2026-05-20/21) + Context (R10.3 gap Phase 4.2 sister 3rd-cycle #BV carry + R10.4 gap Phase 3.4 #AH carry) + Decisions (8 D-decisions + M-01 verbatim D-01 per-method 7 + D-02 ephemeral no-op + D-03 5-vector OWASP A1 + D-04 2-site minimal + D-05 dry-run default + D-06 --yes bypass + D-07 NO --keep-backup + D-08 generic error) + A7 Conservation (ADR 0001-0021 main body 0 diff verified; ci.yml A7 iter 0021→0022 single extend NOT retroactive — Phase 5.1 W2 T2.8 已 retroactive fix 0019+0020+0021) + Consequences (R10.3 14th subcommand + R10.4 path-guard reusable across install+uninstall+audit-log paths) + Compliance (R10.3 + R10.4 acceptance verbatim cite) + Errata-path (frozen Phase 5.2; v0.6+ ADR 0023+) + Adoption-confirmation (Phase 5.2 ship evidence DOGFOOD 3/3) + References (CONTEXT D-01-08 + RESEARCH § 1-7 + sister ADR 0021 state-lock + ADR 0004 dry-run contract延袭)
  - docs/adr/README.md                                          # T2.6 MODIFY ~+1 row — append `| [0022](./0022-uninstall-and-path-traversal.md) | Phase 5.2 — R10.3 harnessed uninstall CLI (7-method dispatch) + R10.4 path traversal 5-vector regex hardening | Accepted | 2026-05-20 |` after ADR 0021 entry (sister Phase 5.1 W2 T2.7 single-add cadence延袭)
  - .github/workflows/ci.yml                                    # T2.7 MODIFY single extend NOT retroactive (Phase 5.1 W2 T2.8 already retroactive fix 0019+0020+0021 per RESEARCH § 5.2 + CONTEXT critical finding) — A7 step iter 0021 → 0022 (4 surgical edits sister Phase 5.1 cadence): Line 87 step name `ADR 0001-0021` → `ADR 0001-0022` + Line 90 first for loop append `0022` after `0021` + Line 101 second for loop append same + Line 112 echo `A7 ✅ ADR 0001-0021` → `ADR 0001-0022`; STRICT ordering: ci.yml commit + push BEFORE adr-0022-accepted tag creation per STRIDE D mitigation sister Phase 5.1
  - CHANGELOG.md                                                # T2.8 MODIFY ~+8-12L — add `## [0.5.0-alpha.2] - 2026-05-20/21` section + `### Added` (R10.3 harnessed uninstall CLI subcommand 14th + 7 per-method uninstaller src/uninstallers/* + R10.4 path-guard.ts 5-vector OWASP A1 + ADR 0022 + W0 sub-batch validateFlags.ts + runOrPreview.ts dedup extract) + `### Changed` (ci.yml A7 step ADR 0001-0021 → 0001-0022 single extend) + Keep-a-Changelog format sister Phase 5.1 W2 T2.9 cadence延袭
  - .planning/STATE.md                                          # T2.9 (ALREADY listed above for T0.1 trim) — ALSO Phase 5.2 SHIPPED 续编 + 当前位置 update + v0.5.0 milestone 2/3 PROGRESS marker (NOT close — v0.5.0 close 留 Phase 5.3) + 进度 18/20 → 19/20 95%; 下一 phase update Phase 5.3 close prep
  - .planning/RETROSPECTIVE.md                                  # T2.10 (ALREADY listed above for T0.1 archive) — ALSO append Phase 5.2 milestone retrospective 7-section sister Phase 5.1 W2 T2.7 format 100% reuse + cross-milestone v0.5.0 close-prep trends section (NOT full close — v0.5.0 cross-milestone close 留 Phase 5.3)
  - .planning/ROADMAP.md                                        # T2.11 MODIFY — Phase 5.2 ✅ SHIPPED literal cadence延袭 (sister L267-272 v0.5.0 Phase 5.1 SHIPPED literal cadence); v0.5.0 transitions 1/3 PROGRESS → 2/3 PROGRESS
  - PROJECT-SPEC.md                                             # T2.12 MODIFY — L3 Status header add Phase 5.2 SHIPPED literal (sister Phase 5.1 W2 T2.13 transparency gate pattern延袭)
  - README.md                                                   # T2.13 MODIFY — L9 Status freshness Phase 5.2 SHIPPED + Phase 5.2 row append shipped phase list
  - .planning/phase-5.2/DOGFOOD-T2.X.md                         # T2.14 NEW ~60-80L 3-axis empirical evidence sister Phase 5.1 DOGFOOD-T2.X.md 60L format 100% reuse: (A) R10.3 cli/uninstall.ts ≤200L Karpathy + 7 uninstallers each ≤30-45L + tests/cli/uninstall.test.ts ≥10 cells TDD PASS + manual `harnessed uninstall <test-manifest>` dry-run + --apply ephemeral warn + --apply git-clone fs.rm verify (B) R10.4 path-guard.ts ≤50L + tests/manifest/path-guard.test.ts 7+ cells PASS + 5 attack vector reject simulation (`harnessed install '../../etc/passwd'` → PathTraversalError exit 1 generic msg) + safe path passthrough verify (C) ADR 0022 + ci.yml A7 iter 0021→0022 grep both for loops contain `0022` + 0001-0021 main body 0 diff `git diff` == 0 + CHANGELOG.md v0.5.0-alpha.2 entry + W0 sub-batch validateFlags.ts + runOrPreview.ts extract verify 5+7=12 import line changes
  # ===== W2 tag creation (LOCAL CREATE per CLAUDE.md commit safety; user controls all push) =====
  # NOTE: Tags NOT files but listed for completeness; W2 T2.15 dual-tag LOCAL CREATE adr-0022-accepted (pinned ADR 0022 initial commit hash) + v0.5.0-alpha.2-uninstall-security (NOT 🎯 v0.5.0 milestone tag — v0.5.0 milestone close 留 Phase 5.3 per ROADMAP v0.5.0 3-phase split L266-277)

threats_open:
  # STRIDE per RESEARCH § 6 (R-1 CC CLI A1/A2 + R-2 fs.rm Win NTFS + R-3 extractCloneTarget dup drift + R-4 W0 #BH scope creep + R-5 5 RegExp per-call overhead) + Phase 5.2 specific
  - threat: claude mcp remove + claude plugin uninstall exact CLI syntax unverified (A1/A2 ASSUMPTION LOW confidence per RESEARCH § Sources Tertiary)
    stride: T  # Tampering (wrong cmd → mcp/plugin not actually removed)
    mitigation: T1.0 PREREQ TASK Wave 1 entry verify `claude mcp remove --help` + `claude plugin uninstall --help` exit 0 + syntax matches RESEARCH § 2.2-2.3 invocation (mcp remove <name> --scope project / plugin uninstall <plugin>@<marketplace>); if syntax diverges → DOGFOOD-T1.X.md (B) document actual syntax + ADR 0022 note A1/A2 resolution; BLOCKER for Wave 1 T1.2 mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace uninstaller until resolved
  - threat: fs.rm cross-OS Win NTFS locked files (.git index or active process holding file)
    stride: D  # Denial of Service (uninstall fails partway)
    mitigation: Node.js fs.rm `{ force: true, maxRetries: 3 }` option per RESEARCH § Risk Matrix R-2; force:true ignores ENOENT making idempotent; maxRetries:3 handles transient locks; tests/cli/uninstall.test.ts cell 5+6 verify cross-OS Win+Linux+macOS CI green Day 1; ALSO acceptance T1.4 DOGFOOD-T1.X.md (C) note Win CI runner fs.rm behavior
  - threat: path-guard regex bypass — attacker constructs novel encoding not covered by 5 patterns (e.g. Unicode NFD/NFC, UNC paths \\\\server\\share, Win 8.3 short names)
    stride: I  # Info Disclosure (read sensitive files via traversal)
    mitigation: D-03 LOCKED 5 vector MVP per CONTEXT D-03 sneak-block "NO comprehensive 10+ vectors v0.6+ if signal"; CSO+Paranoid Staff Eng aligned; ACCEPTED residual risk LOW (single-maintainer dogfood; real attack surface near-zero per Phase 3.4 W0.4 spike); v0.6+ if real attack signal arrives
  - threat: extractCloneTarget + extractSkillName duplicated in uninstaller diverges from installer parser over time
    stride: I  # Info Disclosure (wrong target path → wrong directory removed)
    mitigation: Per RESEARCH § Risk Matrix R-3 + § 7 Q1+Q2 — both files parse same `git clone` / `npx skills@` cmd shape; manifest cmd shapes are schema-validated stable; uninstaller files include `// sister src/installers/<file> extractCloneTarget — refactor to shared lib if 3rd caller appears` comment; YAGNI single-caller acceptable; mitigation if 3rd caller arrives v0.6+ extract to lib
  - threat: PathTraversalError generic message gives attacker LESS info but defender ALSO LESS audit context (D-08 trade-off)
    stride: R  # Repudiation (audit trail incomplete)
    mitigation: D-08 LOCKED CSO veto + sister redact pattern symmetric; defender side gets full context via Phase 4.3 R8.1 audit.log producer NEW category `security_violation` recommend (NOT required Phase 5.2; defer Phase 5.3+ if signal); user-facing message remains generic per CSO requirement
  - threat: --yes flag bypass without --apply ambiguity (user types `harnessed uninstall foo --yes` expecting destroy but gets dry-run)
    stride: D  # Denial of Service (UX failure mode)
    mitigation: D-06 H1 gate per RESEARCH § 2.1 D-06 L181-189 — `--yes` without `--apply` → exit 2 with explicit error + fix hint `harnessed uninstall <name> --yes --apply`; tests/cli/uninstall.test.ts cell 1 verify exit 2 + stderr contains "--yes requires --apply"
  - threat: W0 sub-batch #BH 5-file H1 gate touch increases blast radius for Wave 0 (sister Phase 5.1 W0 #BF+#BG mitigation precedent)
    stride: D  # Denial of Service (test regression risk)
    mitigation: #BH is pure import-addition + call-site replacement NO logic change (sister Phase 5.1 W0 cadence延袭); Biome preempt `pnpm exec biome check --write` MANDATORY pre-commit per project memory `feedback_biome-preempt.md`; full test suite green gate post-extract verify; T0.3 atomic commit per `feedback_biome-preempt.md` "small atomic commits" preference
  - threat: ci.yml A7 iter ordering — adr-0022-accepted tag pushed BEFORE ci.yml A7 step iter → A7 gate fails next CI run (sister Phase 5.1 STRIDE D threat precedent)
    stride: D  # DoS (workflow block)
    mitigation: STRICT ordering per RESEARCH § 5.2 + sister Phase 5.1 T2.8 pattern; W2 task ordering enforces T2.7 (ci.yml A7 iter commit + push) → T2.15 (dual tag LOCAL CREATE); planner T2.15 acceptance verify `git log .github/workflows/ci.yml` shows commit timestamp < tag annotation timestamp
  - threat: dual tag premature push (user attempts push BEFORE Phase 5.2 ship + DOGFOOD verify)
    stride: R  # Repudiation (audit trail integrity)
    mitigation: CLAUDE.md commit safety NEVER push without user explicit approval (sister Phase 5.1 LOCAL CREATE 待 push 模式延袭); W2 T2.15 LOCAL CREATE only `git tag -a` (NO `git push --tags`); planner T2.15 acceptance `git ls-remote origin refs/tags/v0.5.0-alpha.2-uninstall-security` returns empty (verify NO push)

must_haves:
  # ===== 8 D-decisions + M-01 verbatim (CONTEXT 5.2-CONTEXT.md L28-114 LOCKED — 0 sneak tolerance) =====
  decisions:
    - id: D-01
      lock: DispatchArch per-method 7 NEW src/uninstallers/*.ts (sister installers/ pattern symmetric延袭) — npmCli + mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace + gitCloneWithSetup + npxSkillInstaller + ccHookAdd
      sneak-block: |
        planner / executor MUST NOT use single uninstall.ts switch 7 case (asymmetric with install dispatch + approaches ~150L Karpathy violation)
        planner / executor MUST NOT use reverse-by-install ledger lookup (.harnessed/installed.json — over-engineering Phase 5.2; data-driven 优秀 但 install-time co-modification + state.ts concurrent lock 互动 complex)
        planner / executor MUST NOT use Hybrid per-method + ledger (over-engineering 2 architectures simultaneously)
        Each uninstaller file Karpathy ≤30L estimate (sister install*.ts 25-50L precedent); src/uninstallers/index.ts dispatch table Karpathy ≤30L
        src/uninstallers/lib/ shared helpers reuse from src/installers/lib/{runClaudeArgs,err}.ts (Phase 5.1 W0 #BF+#BG extract benefit) — NO duplicate err.ts in uninstallers/lib/
    - id: D-02
      lock: EphemeralSemantic no-op + warn user — detect via `spec.install.cmd` includes `"npx --yes"` / `"npx -y"` → exit 0 + warn message verbatim `"ephemeral install: nothing to uninstall ('<name>' uses 'npx --yes' runtime-only invocation; no persistent install to remove)"`
      sneak-block: |
        planner / executor MUST NOT error + exit 1 (UX 弱 用户必须知道哪些是 ephemeral 先验)
        planner / executor MUST NOT silent skip (用户 sense check missing — 'uninstall finished' on non-installed manifests confusing)
        planner / executor MUST NOT auto-detect with hidden logic (explicit warn message > implicit silence)
        Detection regex: `/\bnpx\s+(--yes|-y)\b/.test(install.cmd)` per RESEARCH § 2.1 L141
        Ephemeral check ONLY in src/uninstallers/npmCli.ts (NOT other 6 uninstallers — npxSkillInstaller uses npx in cmd but writes persistent files per RESEARCH § Pitfall 2 + § 2 L155; NOT ephemeral)
        Warn output via console.warn (NOT console.error) — exit 0 success path, message informational
    - id: D-03
      lock: AttackVectorScope 5 vector minimal MVP OWASP A1 path traversal top 5 — Unix `../` / Win `..\` / null byte `\x00` / URL-encoded `%2e%2e` / double-encoded `%252e%252e`
      sneak-block: |
        planner / executor MUST NOT add comprehensive 10+ vectors (symlink / UNC \\\\server\\share / Unicode NFD/NFC / Win 8.3 / NTFS ADS — 超 Karpathy YAGNI; v0.6+ if real attack signal)
        planner / executor MUST NOT do regex blacklist + path.resolve() whitelist defense-in-depth (defense-in-depth 优秀 但 fs.realpath + Win symlink edge case + 2x test surface; defer v0.6+ if signal)
        planner / executor MUST NOT add 仅 1 vector (违 R10.4 spec verbatim "5+ vectors" 不可接受)
        5 patterns verbatim per CONTEXT D-03 L66-71 + RESEARCH § 3.1 L448-454:
          1. `/\.\.\//` Unix dot-dot
          2. `/\.\.\\/` Win backslash dot-dot
          3. `/\x00/` null byte injection
          4. `/%2[eE]%2[eE]/` URL-encoded dot-dot (case-insensitive hex)
          5. `/%25[2][eE]%25[2][eE]/` double-encoded (defense against decode-then-validate flow)
        Pre-compile at module load (NOT inside loop or function body); module-level `const PATH_TRAVERSAL_PATTERNS: RegExp[] = [...]`; sister Phase 5.1 R10.1 REDACT_PATTERNS symmetric design
        TDD red-green-refactor REQUIRED (CLAUDE.md core security logic); 7-9 cell fixture matrix tests/manifest/path-guard.test.ts cells 1-5 attack vectors + cell 6 D-08 verify + cells 7-9 safe path negative controls
    - id: D-04
      lock: HardeningScope resolveAlias + manifest path 2 sites minimal (user-controlled path inputs only) — src/manifest/aliases.ts resolveAlias() + src/cli/install.ts L82 + src/cli/uninstall.ts NEW similar (manifest path resolve)
      sneak-block: |
        planner / executor MUST NOT add src/audit/log.ts hardcoded `.harnessed/audit.log` path (NOT user-controlled, no attack surface; CONTEXT D-04 L86)
        planner / executor MUST NOT add uninstall.ts redundant explicit verify (transitive resolveAlias 保护 already covers — but defense-in-depth screen resolvedName per RESEARCH § 3.3 + § A6 + § 7 Q5 1-line addition acceptable Karpathy)
        planner / executor MUST NOT do comprehensive 全 fs.readFile/writeFile/spawn args audit (超 Phase 5.2 1-day target; sister BB path 4 项 carry-forward NOT v1.0 GA gate)
        Hardening sites verbatim:
          Site 1: src/manifest/aliases.ts L36 `resolveAlias(name)` first line `guardPath(name)` before yaml lookup
          Site 2a: src/cli/install.ts L81-82 `guardPath(resolvedName)` after alias resolution + before resolve(manifestPath) (defense-in-depth alias redirect value screen per RESEARCH § 3.3 L518-523)
          Site 2b: src/cli/uninstall.ts NEW symmetric — `guardPath(name)` at CLI entry + `guardPath(resolvedName)` after alias resolution
          Site 2c: src/cli/audit-log.ts CONDITIONAL — verify any user-controlled path inputs exist via grep; expected minimal/no change (AUDIT_PATH hardcoded literal per Phase 5.1 STRIDE T mitigation)
        path-guard.ts location: src/manifest/lib/path-guard.ts NEW (NOT co-locate src/manifest/security.ts) — security.ts = shell-escape AST detect; path-guard = user-input CLI boundary; concern separation per RESEARCH § 3.4 L526-531
    - id: D-05
      lock: DryRunFlag --dry-run default ON; --apply explicit (sister install ADR 0004 contract 1延袭)
      sneak-block: |
        planner / executor MUST NOT default --apply (destructive default 不可接受)
        planner / executor MUST NOT force interactive y/N every time (UX 弱 CI 阻塞)
        Default behavior: `harnessed uninstall <name>` → dry-run preview output + exit 2 aborted (sister install --dry-run default pattern延袭)
        Explicit apply: `harnessed uninstall <name> --apply` → execute uninstall (sister install symmetric)
        Dry-run preview verbatim per RESEARCH § 2.1 D-05 L166-172: `[dry-run] would uninstall '<name>' via method '<method>'` + `  run with --apply to execute` + exit 0
    - id: D-06
      lock: ConfirmPrompt interactive y/N default No + --yes bypass for CI (sister install --non-interactive double-flag延袭 BUT uses --yes flag name per destructive ops convention)
      sneak-block: |
        planner / executor MUST NOT skip interactive prompt when --apply without --yes (单层保护不足 destructive op)
        planner / executor MUST NOT block CI with always-prompt no --yes bypass (CI 自动化阻塞)
        H1 gate: `--yes` without `--apply` → exit 2 + error `'error: --yes requires --apply to execute\n  fix:  harnessed uninstall <name> --yes --apply'` per RESEARCH § 2.1 D-06 L181-189
        Interactive confirm (when --apply AND NOT --yes): `@clack/prompts` p.confirm({ message: "Uninstall '<name>'? This cannot be undone.", initialValue: false }) default No; p.isCancel OR false → exit 2
        Flag name: `--yes` (NOT `--non-interactive` sister install) — destructive ops conventionally use `--yes` (rm -rf style UX familiarity); document inconsistency in ADR 0022 per RESEARCH § 7 Q4
    - id: D-07
      lock: BackupOption NO --keep-backup flag — delete 直接 NOT move-to-backup; use `harnessed backup create` independent workflow Phase 2.1+ ship
      sneak-block: |
        planner / executor MUST NOT add --keep-backup default ON move-to-backup (混淆 backup 职责 + disk space accumulation)
        planner / executor MUST NOT add --keep-backup opt-in flag (over-engineering YAGNI)
        Alternative documented: ADR 0022 Compliance section references `harnessed backup create <name>` independent workflow as user path for pre-uninstall backup
        Rationale: single responsibility per CONTEXT D-07 L107-108; backup is backup subcommand job NOT uninstall subcommand
    - id: D-08
      lock: ErrorMessageSafety PathTraversalError generic message `'path traversal attempt detected'` NOT include user input attempted path (CSO defense; NOT echo back enumeration success)
      sneak-block: |
        planner / executor MUST NOT echo back attempted path (`../../etc/passwd` reveal attacker enumeration success — CSO veto permanent)
        planner / executor MUST NOT silent fail no error (UX 弱 + audit log missing)
        Error class verbatim per RESEARCH § 3.1 L456-463:
          ```ts
          export class PathTraversalError extends Error {
            constructor() {
              super('path traversal attempt detected')  // NO user input
              this.name = 'PathTraversalError'
              Object.setPrototypeOf(this, PathTraversalError.prototype)
            }
          }
          ```
        Object.setPrototypeOf for TS class extend Error (sister Phase 5.1 R10.2 LockHeldError pattern延袭)
        Logging side internal — audit.log Phase 4.3 producer 可补 NEW audit category `security_violation` deferred Phase 5.3+ if signal (CONTEXT D-08 L112-114)
        TDD verify: tests/manifest/path-guard.test.ts cell 6 — `expect(error.message).not.toContain('../../etc/passwd')` per RESEARCH § 3.5 cell 6

  # ===== M-01 meta-decision verbatim (CONTEXT L18-25 LOCKED — 0 sneak tolerance) =====
  meta_decisions:
    - id: M-01
      lock: PhaseClass ARCHITECTURAL (NOT R-5 publish-only sister Phase 4.1+4.2 mode); full ship cadence ADR 0022 + ci.yml A7 step iter 0021→0022 + dual tag (sister Phase 5.1 alpha.1-audit-lock + Phase 4.3 close cadence延袭)
      sneak-block: |
        planner / executor MUST NOT treat Phase 5.2 as R-5 publish-only; NEW src/cli/uninstall.ts + 7 NEW src/uninstallers/*.ts + NEW src/manifest/lib/path-guard.ts + MODIFY src/manifest/aliases.ts = architectural change
        Full ship cadence applies: ADR 0022 PRIMARY + ci.yml A7 step iter 0021→0022 (single extend NOT retroactive — Phase 5.1 W2 T2.8 already retroactive fix 0019+0020+0021) + dual tag adr-0022-accepted + v0.5.0-alpha.2-uninstall-security
        NOT triple tag with 🎯 v0.5.0 — v0.5.0 milestone close 留 Phase 5.3 per ROADMAP v0.5.0 3-phase split L266-277
        Phase 5.2 = 2-of-3 milestone progress NOT close; sister Phase 5.1 = 1-of-3 milestone progress (sister Phase 5.2 analog progress phase per M-01 ARCHITECTURAL class shared)

  # ===== W0 cadence absorb 4 项 (sister Phase 5.1 W0 cadence延袭; #BA round 3 conditional decision tree per CONTEXT L122) =====
  w0_backlog:
    - id: T0.1 (sister M2 D2 cadence iter 6 REINFORCE — post-5-iter-terminus stable signal confirm; if confirmed at 6th iter, D2 cadence formally institutionalized "implicit-standing-process" Phase 5.3+)
      action: trim Phase 4.3 + Phase 5.1 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 + Phase 5.1 (dual-phase archive sister Phase 5.1 W0 T0.1 single-phase 5th-iter terminus → Phase 5.2 W0 T0.1 6th-iter REINFORCE; sister 5-recurrence terminus heuristic confirmed pattern stable beyond founder-effort); HTML-comment archive marker pointer left in STATE.md trim site per sister L42 format
      priority: HIGH
      path-dep: FIRST (reduces STATE.md size — creates T0.2 SIZE_LIMIT flip headroom per CONTEXT #BA decision tree)
    - id: T0.2 (DEFERRED #BA D1 SIZE_LIMIT 165→? round 3 conditional flip per CONTEXT #BA L122 decision tree)
      action: CONDITIONAL — IF post-T0.1 STATE ≤150L → flip 1-line surgical L12 `const SIZE_LIMIT = 165` → `const SIZE_LIMIT = 150` (15L safety headroom; sister Phase 4.3 W0.2 200→175 + Phase 5.1 W0 T0.2 175→165 cadence延袭 tighter as confidence in trim cadence increases) / 151-160L → DEFER #BA carry-forward Phase 5.3+ W0 LOW priority (5th DEFER signal — reassess if Phase 5.3 should formally close #BA disposition vs continue defer) / >160L → BLOCKED escalate investigate W0.1 trim sufficiency (current STATE 164L; post-T0.1 trim Phase 4.3+5.1 narrative expected -20-30L → ~134-144L → FLIP path likely active)
      priority: MED conditional
      path-dep: AFTER T0.1
    - id: T0.3 (sub-batch #BH MED + #BI MED absorb — sister #BQ planner Wave B discretion per Phase 5.1 cadence)
      action: extract src/cli/lib/validateFlags.ts NEW + src/uninstallers/lib/runOrPreview.ts NEW + MODIFY 5 CLI files (install/install-base/research/manifest-add/execute-task) replace H1 gate inline block with `validateNonInteractiveFlags(raw, 'cmdName')` import call; pure refactor NO behavior change; Biome preempt `pnpm exec biome check --write` MANDATORY pre-commit per project memory `feedback_biome-preempt.md` (3 CI-red recurrences Phase 2.1.1/2.2/2.3 sister precedent); full test suite green gate post-extract verify
      priority: MED carry-forward 4-phase
      path-dep: PARALLEL with T0.1+T0.2 (different files NO conflict; can run same Wave 0 commit batch OR separate atomic commits per `feedback_biome-preempt.md` "small atomic commits" preference)
    - id: T0.4 (Wave 0 post-extract baseline verify — sister Phase 5.1 W0 cadence延袭)
      action: full test suite + biome + tsc gate post-W0 verify — `corepack pnpm test` 733+ tests green (NO regression from sub-batch #BH+#BI extract) + `pnpm exec biome check src/cli/lib/validateFlags.ts src/uninstallers/lib/runOrPreview.ts src/cli/{install,install-base,research,manifest-add,execute-task}.ts` exit 0 + `pnpm build` exit 0 + grep verify 5+ H1 gate inline blocks now reference validateNonInteractiveFlags import (NOT inline duplicate)
      priority: HIGH (BLOCKER for Wave 1 — must verify W0 sub-batch refactor clean before R10.3 uninstaller layer build)
      path-dep: AFTER T0.1+T0.2+T0.3 (gate verification of W0 cadence completion)

  # ===== Observable truths (R10.3 + R10.4 goal-backward decomposition; M-01 ARCHITECTURAL full ship cadence — sister Phase 5.1 truths section延袭) =====
  truths:
    # W0 truths (4 cadence + sub-batch)
    - "STATE.md ≤150L post-W0 T0.1 trim Phase 4.3+5.1 narrative archive (sister 6th-iter REINFORCE D2 cadence; current 164L → expected -20-30L)"
    - "SIZE_LIMIT 165 → 150 surgical flip IF post-T0.1 ≤150L (D1 round 3 conditional per CONTEXT #BA decision tree; FLIP path likely active per trim arithmetic)"
    - "src/cli/lib/validateFlags.ts NEW exports validateNonInteractiveFlags(raw, cmdName) — 5 CLI files use import call NOT inline H1 gate (sub-batch #BH MED dedup; 0 line behavior change)"
    - "src/uninstallers/lib/runOrPreview.ts NEW exports dryRunGate(ctx) — Phase 5.2 W1 uninstallers consume (NOT installer regression; sub-batch #BI MED extract)"
    - "Full test suite 733+ green post-W0 (NO regression from W0 sub-batch extract refactor); biome + tsc + build all exit 0"

    # W1 R10.3 truths (Phase 5.2 architectural anchor #1)
    - "`harnessed uninstall <name>` CLI subcommand registered 14th in src/cli.ts (sister Phase 5.1 audit-log 13th register cadence延袭)"
    - "src/uninstallers/index.ts dispatch table exports runUninstall(manifest, opts) — 7 method × Uninstaller record sister installers/index.ts symmetric"
    - "7 NEW uninstaller files (npmCli + mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace + gitCloneWithSetup + npxSkillInstaller + ccHookAdd) each ≤45L Karpathy"
    - "src/cli/uninstall.ts ≤200L Karpathy (sister install.ts 145L 90% reuse per PATTERNS § cli/uninstall.ts estimate ≤130L)"
    - "D-05 dry-run default — `harnessed uninstall foo` (no --apply) → preview output + exit 2 aborted; `harnessed uninstall foo --apply` → execute"
    - "D-06 --yes bypass — `--yes` without `--apply` → exit 2 H1 gate error; `--apply` without `--yes` → interactive p.confirm default No; `--apply --yes` → execute no prompt"
    - "D-02 ephemeral detect — npmCli uninstaller checks `/\\bnpx\\s+(--yes|-y)\\b/.test(install.cmd)` → exit 0 + warn message (NOT error); other 6 uninstallers unaffected"
    - "tests/cli/uninstall.test.ts 10-14 cells PASS (TDD red-green-refactor; H1 gate + dry-run + ephemeral + 7 method dispatch + --yes bypass + spawn error + path traversal)"
    - "DOGFOOD-T1.X.md 3-axis empirical evidence (Karpathy + PREREQ CC CLI verify A1/A2 + ephemeral smoke)"

    # W2 R10.4 truths (Phase 5.2 architectural anchor #2)
    - "src/manifest/lib/path-guard.ts NEW ≤50L exports guardPath(input) + PathTraversalError class — 5 pre-compiled RegExp at module load"
    - "5 attack vectors caught — Unix `../` + Win `..\\` + null `\\x00` + URL-encoded `%2e%2e` + double-encoded `%252e%252e` per CONTEXT D-03 verbatim"
    - "D-08 verify — PathTraversalError.message === 'path traversal attempt detected' (NO user input echo back; CSO defense)"
    - "D-04 hardening 2 sites — src/manifest/aliases.ts resolveAlias() (site 1) + src/cli/install.ts L82 + src/cli/uninstall.ts NEW (site 2)"
    - "tests/manifest/path-guard.test.ts 7-9 cells PASS (TDD red-green-refactor; 5 vector reject + 3 safe path passthrough + 1 D-08 message verify)"

    # W2 ship cadence truths (M-01 ARCHITECTURAL)
    - "ADR 0022 9-section format sister 0021 100% reuse — Status/Context/Decisions/A7/Consequences/Compliance/Errata/Adoption/References"
    - "docs/adr/README.md +1 row 0022 entry between 0021 and (future 0023+)"
    - "ci.yml A7 step iter 0021 → 0022 (4 surgical edits L87 + L90 + L101 + L112); single extend NOT retroactive per Phase 5.1 already-fixed 0019+0020+0021"
    - "ADR 0001-0021 main body 0 diff verified (`git diff <initial-commit>..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/002[01]-*.md | wc -l` == 0)"
    - "CHANGELOG.md v0.5.0-alpha.2 entry — R10.3 uninstall + R10.4 path-guard + ADR 0022 + W0 sub-batch dedup"
    - "STATE.md updated — Phase 5.2 ✅ SHIPPED + 当前位置 + v0.5.0 milestone 2/3 PROGRESS + 进度 18/20 → 19/20 95% + 下一 phase Phase 5.3 close prep"
    - "RETROSPECTIVE.md append Phase 5.2 7-section retrospective + cross-milestone v0.5.0 close-prep trends section (NOT full close — 留 Phase 5.3)"
    - "ROADMAP.md Phase 5.2 ✅ SHIPPED literal + v0.5.0 1/3 → 2/3 transition"
    - "PROJECT-SPEC.md L3 + README.md L9 status freshness Phase 5.2 SHIPPED"
    - "DOGFOOD-T2.X.md 3-axis empirical evidence (R10.3 + R10.4 + ship cadence verify)"

  # ===== Artifacts (verifiable artifact list — every truth backed by file) =====
  artifacts:
    # W0 (4 items)
    - { path: ".planning/STATE.md", provides: "Phase 4.3+5.1 narrative trimmed; size ≤150L verify (D2 iter 6 REINFORCE)" }
    - { path: ".planning/RETROSPECTIVE.md", provides: "Phase 4.3+5.1 narrative received § ARCHIVED FROM STATE; also Phase 5.2 retrospective append T2.10" }
    - { path: "scripts/check-state-archive-stale.mjs", provides: "SIZE_LIMIT 165→150 conditional flip OR DEFER #BA Phase 5.3+ per decision tree" }
    - { path: "src/cli/lib/validateFlags.ts", provides: "validateNonInteractiveFlags() helper — 5 CLI file dedup", min_lines: 20 }
    - { path: "src/uninstallers/lib/runOrPreview.ts", provides: "dryRunGate() helper — uninstaller dry-run reuse", min_lines: 25 }
    # W1 R10.3 (10 items)
    - { path: "src/uninstallers/lib/types.ts", provides: "UninstallOpts + UninstallContext + UninstallResult + Uninstaller types", min_lines: 25 }
    - { path: "src/uninstallers/index.ts", provides: "dispatch table + runUninstall() entry", min_lines: 25 }
    - { path: "src/uninstallers/npmCli.ts", provides: "npm uninstall <pkg> OR D-02 ephemeral no-op + warn", min_lines: 25 }
    - { path: "src/uninstallers/mcpStdioAdd.ts", provides: "claude mcp remove <name> --scope project", min_lines: 20 }
    - { path: "src/uninstallers/mcpHttpAdd.ts", provides: "claude mcp remove <name> (identical to mcpStdio)", min_lines: 20 }
    - { path: "src/uninstallers/ccPluginMarketplace.ts", provides: "claude plugin uninstall <plugin>@<marketplace>", min_lines: 25 }
    - { path: "src/uninstallers/gitCloneWithSetup.ts", provides: "fs.rm cloneTarget recursive+force cross-OS", min_lines: 30 }
    - { path: "src/uninstallers/npxSkillInstaller.ts", provides: "fs.rm ~/.claude/skills/<name> recursive+force", min_lines: 20 }
    - { path: "src/uninstallers/ccHookAdd.ts", provides: "reverse JSON deep-merge from ~/.claude/settings.json filter-out matching entry", min_lines: 35 }
    - { path: "src/cli/uninstall.ts", provides: "14th CLI subcommand register — H1 gate + dry-run + dispatch", min_lines: 110 }
    - { path: "tests/cli/uninstall.test.ts", provides: "TDD red-green-refactor 10-14 cells", min_lines: 150 }
    - { path: ".planning/phase-5.2/DOGFOOD-T1.X.md", provides: "W1 mid-wave 3-axis empirical evidence", min_lines: 30 }
    # W2 R10.4 + ship (10 items)
    - { path: "src/manifest/lib/path-guard.ts", provides: "guardPath() + PathTraversalError + 5 RegExp pre-compile", min_lines: 30 }
    - { path: "tests/manifest/path-guard.test.ts", provides: "TDD red-green-refactor 7-9 cells", min_lines: 80 }
    - { path: "docs/adr/0022-uninstall-and-path-traversal.md", provides: "ADR 0022 PRIMARY 9-section format", min_lines: 140 }
    - { path: "docs/adr/README.md", provides: "ADR index +1 row 0022 entry" }
    - { path: ".github/workflows/ci.yml", provides: "A7 step iter 0021→0022 (4 surgical edits)" }
    - { path: "CHANGELOG.md", provides: "v0.5.0-alpha.2 entry — R10.3 + R10.4 + ADR 0022" }
    - { path: ".planning/STATE.md", provides: "Phase 5.2 SHIPPED + 当前位置 + v0.5.0 2/3 + 18/20→19/20" }
    - { path: ".planning/RETROSPECTIVE.md", provides: "Phase 5.2 retrospective + cross-milestone v0.5.0 close-prep trends" }
    - { path: ".planning/ROADMAP.md", provides: "Phase 5.2 ✅ SHIPPED literal + v0.5.0 1/3→2/3" }
    - { path: "PROJECT-SPEC.md", provides: "L3 Status Phase 5.2 SHIPPED" }
    - { path: "README.md", provides: "L9 Status freshness + shipped phase list +1" }
    - { path: ".planning/phase-5.2/DOGFOOD-T2.X.md", provides: "W2 final 3-axis empirical evidence", min_lines: 60 }

  # ===== Key links (most likely break sites — sister Phase 5.1 key_links section延袭) =====
  key_links:
    - from: src/cli.ts
      to: src/cli/uninstall.ts registerUninstall(program)
      via: import + register call (14th subcommand)
      pattern: "registerUninstall\\(program\\)"
    - from: src/cli/uninstall.ts
      to: src/uninstallers/index.ts runUninstall(manifest, opts)
      via: import + dispatch invoke
      pattern: "runUninstall\\("
    - from: src/uninstallers/index.ts
      to: 7 individual uninstaller files via Record<method, Uninstaller>
      via: dispatch table
      pattern: "uninstallers\\[manifest\\.spec\\.install\\.method\\]"
    - from: src/uninstallers/{mcpStdioAdd,mcpHttpAdd,ccPluginMarketplace}.ts
      to: src/installers/lib/runClaudeArgs.ts runArgs (Phase 5.1 W0 #BF extract reuse)
      via: import + spawn
      pattern: "runArgs\\(\\["
    - from: src/uninstallers/*.ts (all 7)
      to: src/installers/lib/err.ts err (Phase 5.1 W0 #BG extract reuse)
      via: import + preflight error construction
      pattern: "err\\(ctx,"
    - from: src/manifest/aliases.ts resolveAlias
      to: src/manifest/lib/path-guard.ts guardPath (R10.4 D-04 site 1)
      via: import + first-line invocation
      pattern: "guardPath\\(name\\)"
    - from: src/cli/install.ts L82
      to: src/manifest/lib/path-guard.ts guardPath (R10.4 D-04 site 2a — defense-in-depth resolvedName)
      via: import + invoke before resolve(manifestPath)
      pattern: "guardPath\\(resolvedName\\)"
    - from: src/cli/uninstall.ts
      to: src/manifest/lib/path-guard.ts guardPath (R10.4 D-04 site 2b symmetric)
      via: import + invoke at CLI entry + after alias resolution
      pattern: "guardPath\\("
    - from: docs/adr/0022-uninstall-and-path-traversal.md
      to: docs/adr/README.md row entry + ci.yml A7 loop both `0022`
      via: A7 守恒 gate enforcement
      pattern: "0022"
    - from: ci.yml A7 step
      to: adr-0022-accepted tag (LOCAL CREATE T2.15; STRICT ordering ci.yml commit BEFORE tag)
      via: STRIDE D mitigation ordering
      pattern: "adr-0022-accepted"
---

<objective>
Phase 5.2 delivers two independent but companion capabilities sister Phase 5.1 cadence延袭 ARCHITECTURAL phase class (M-01 LOCKED NOT R-5 publish-only):

**R10.3 `harnessed uninstall <name>` CLI 14th subcommand** — per-method 7 NEW src/uninstallers/*.ts (sister installers/ symmetric); D-01 LOCKED + D-02 ephemeral no-op + warn + D-05 dry-run default + D-06 --yes bypass + D-07 NO --keep-backup (use `harnessed backup` independent)

**R10.4 path traversal regex hardening** — NEW src/manifest/lib/path-guard.ts (5 OWASP A1 vectors pre-compile at module load) + D-04 LOCKED 2 sites resolveAlias() + manifest path resolve (install + uninstall + CONDITIONAL audit-log); D-08 generic PathTraversalError NOT leak path

Purpose: v0.5.0 milestone 2/3 PROGRESS (sister H1 BB path LOCKED 2026-05-19; v1.0 GA stable level prerequisite); discharge 2 carry-forward backlogs (#BV uninstall 4-phase sister carry; #AH path traversal 4-phase sister carry); W0 sub-batch absorb #BH validateFlags + #BI runOrPreview MED dedup sister Phase 5.1 W0 #BF+#BG cadence延袭

Output: 7 uninstaller NEW + 1 CLI uninstall.ts NEW + 1 path-guard.ts NEW + 4 call site MODIFY + ADR 0022 + ci.yml A7 0021→0022 + DOGFOOD T1+T2 + STATE+RETROSPECTIVE+ROADMAP+PROJECT-SPEC+README+CHANGELOG ship cadence + LOCAL CREATE adr-0022-accepted + v0.5.0-alpha.2-uninstall-security dual tag (NO push per CLAUDE.md commit safety; 🎯 v0.5.0 milestone tag reserved Phase 5.3)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phase-5.2/5.2-CONTEXT.md
@.planning/phase-5.2/RESEARCH.md
@.planning/phase-5.2/PATTERNS.md
@.planning/phase-5.2/5.2-DISCUSSION-LOG.md

# Sister Phase 5.1 ship cadence reference (R10.1+R10.2 architectural precedent — uninstall + path-guard symmetric)
@.planning/phase-5.1/PLAN.md
@docs/adr/0021-state-lock-and-audit-consumer.md

# Sister installer pattern reference (symmetric inverse for 7 uninstaller files)
@src/installers/index.ts
@src/installers/lib/runClaudeArgs.ts
@src/installers/lib/err.ts
@src/installers/lib/types.ts

# R10.4 anchor reference (regex pre-compile sister Phase 5.1 R10.1 REDACT_PATTERNS symmetric)
@src/cli/audit-log.ts
@src/manifest/security.ts
@src/manifest/aliases.ts
</context>

<interfaces>
<!-- Key contracts extracted from codebase for executor consumption — NO scavenger hunt needed -->

From src/installers/index.ts (sister dispatch table — Phase 5.2 uninstallers/index.ts symmetric):
```typescript
export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'npm-cli': installNpmCli,
  'mcp-stdio-add': installMcpStdioAdd,
  'cc-plugin-marketplace': installCcPluginMarketplace,
  'git-clone-with-setup': installGitCloneWithSetup,
  'npx-skill-installer': installNpxSkillInstaller,
  'mcp-http-add': installMcpHttpAdd,
  'cc-hook-add': installCcHookAdd,
}
export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult>
```

From src/installers/lib/runClaudeArgs.ts (Phase 5.1 W0 #BF extract — reuse in mcpStdio + mcpHttp + ccPlugin uninstallers):
```typescript
export async function runArgs(claudeArgs: string[], cwd: string, timeoutMs?: number): Promise<ProcResult>
// Win: spawn('cmd.exe', ['/c', 'claude', ...claudeArgs])
// Unix: spawn('claude', claudeArgs, { shell: false })
export interface ProcResult { exitCode: number; stdout: string; stderr: string }
```

From src/installers/lib/err.ts (Phase 5.1 W0 #BG extract — reuse in all 7 uninstallers):
```typescript
export function err(ctx: InstallContext, path: string, message: string, keyword: string): InstallError
```

From src/installers/lib/types.ts (sister types — Phase 5.2 uninstallers/lib/types.ts symmetric):
```typescript
export interface InstallContext { manifest: Manifest; opts: InstallOpts; level: Level; cwd: string }
export interface InstallOpts { apply: boolean; dryRun: boolean; nonInteractive?: boolean }
export type InstallResult = { ok: true; backupId?: string; appliedFiles: string[] } | { ok: false; phase; error; suggest? } | { aborted: true; reason }
```

From src/cli/audit-log.ts L17-29 (sister REDACT_PATTERNS pre-compile — Phase 5.2 PATH_TRAVERSAL_PATTERNS symmetric):
```typescript
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key=[REDACTED]'],
  // ... 5 total module-level
]
function redact(s: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), s)
}
```

From src/manifest/aliases.ts L36-38 (R10.4 D-04 hardening site 1 — pre-modification):
```typescript
export function resolveAlias(name: string): string | null {
  return loadAliases()?.aliases?.[name]?.redirect ?? null
}
// Post-modification: add `guardPath(name)` first line BEFORE loadAliases lookup
```

From src/cli/install.ts L67-74 (sister H1 gate — Phase 5.2 W0 #BH extract source):
```typescript
if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
  console.error(
    'error: --non-interactive requires an explicit --apply or --dry-run flag\n' +
    "  fix:  re-run as 'harnessed install <name> --non-interactive --dry-run' or '--apply'",
  )
  process.exit(2)
}
// Post W0 #BH: replace with `validateNonInteractiveFlags(raw, 'install')` import call
```

From src/cli/install.ts L79-82 (sister manifest path resolve — Phase 5.2 R10.4 D-04 site 2a):
```typescript
const resolvedName = resolveAlias(name) ?? name
const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
// Post R10.4: add `guardPath(resolvedName)` between L81 + L82 (defense-in-depth resolvedName screen)
```

From src/installers/ccHookAdd.ts L46-93 (sister deep-merge — Phase 5.2 uninstallers/ccHookAdd.ts inverse template):
```typescript
// Install: push entry to settings.hooks[ev]
settings.hooks[ev] = settings.hooks[ev] ?? []
settings.hooks[ev].push({ matcher, command: cmd })
// Uninstall (inverse): filter OUT matching entry
settings.hooks[ev] = settings.hooks[ev].filter(h => !(h.command === cmd && h.matcher === matcher))
```

From src/installers/gitCloneWithSetup.ts L70-98 (sister extractCloneTarget — Phase 5.2 uninstallers/gitCloneWithSetup.ts duplicate inline per YAGNI):
```typescript
function extractCloneTarget(cmd: string): string | null { /* 28L parser */ }
// Uninstaller: duplicate inline (single-caller YAGNI per RESEARCH § 7 Q1); add `// sister src/installers/gitCloneWithSetup.ts extractCloneTarget` comment
```
</interfaces>

<tasks>

<!-- =============== WAVE 0: cadence absorb + sub-batch (4 tasks T0.1-T0.4; sister Phase 5.1 W0 cadence延袭) =============== -->

<task type="auto">
  <name>Task T0.1: D2 cadence iter 6 REINFORCE — trim Phase 4.3+5.1 narrative STATE → RETROSPECTIVE</name>
  <files>.planning/STATE.md, .planning/RETROSPECTIVE.md</files>
  <action>
    Per D2 standing process (sister Phase 5.1 W0 T0.1 5th-iter terminus → Phase 5.2 W0 T0.1 6th-iter REINFORCE post-5-iter-terminus stable signal confirm):

    1. **Identify trim scope** — STATE.md L36 (Phase 5.1 SHIPPED narrative) + L61-62 (Phase 5.1 + 4.3 ship history lines) + any Phase 4.3/5.1 specific narrative entries in 已完成 phase ship 历史 section L52-65.

    2. **Verbatim relocate** to RETROSPECTIVE.md `§ ARCHIVED FROM STATE — Phase 4.3` + `§ ARCHIVED FROM STATE — Phase 5.1` (NEW sections at top of archive area; preserve verbatim — no rewrite):
       - Phase 4.3 narrative block from STATE
       - Phase 5.1 narrative block from STATE (R10.1 audit-log + R10.2 state lock + ADR 0021 + ci.yml A7 0018→0021 details)

    3. **Leave HTML-comment pointer** in STATE.md trim site per sister L42 format:
       `<!-- Phase 4.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 (2026-05-19 Phase 5.1 W0 T0.1 D2 cadence iter 5 TERMINUS) -->` (already present per sister Phase 5.1 W0 — verify still present + add same for Phase 5.1)
       `<!-- Phase 5.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1 (2026-05-19 Phase 5.2 W0 T0.1 D2 cadence iter 6 REINFORCE — post-5-iter-terminus stable signal confirm; if confirmed at 6th iter, D2 cadence formally institutionalized "implicit-standing-process" Phase 5.3+) -->`

    4. **Verify size** — `wc -l .planning/STATE.md` should show ~134-144L (current 164L; expected -20-30L trim per W0 backlog table CONTEXT L122).

    5. **Sneak-block**: MUST NOT rewrite/summarize Phase 4.3+5.1 narrative (verbatim relocate only; sister Phase 5.1 T0.1 cadence延袭); MUST preserve HTML comment markers in STATE.md trim sites; MUST NOT delete from STATE without paste to RETROSPECTIVE first.
  </action>
  <verify>
    <automated>wc -l .planning/STATE.md | awk '{print ($1 <= 150) ? "PASS" : (($1 <= 160) ? "DEFER_PATH" : "BLOCKED")}'</automated>
  </verify>
  <done>
    - STATE.md size ≤150L (FLIP path likely active for T0.2) OR 151-160L (DEFER #BA path) OR BLOCKED escalate
    - RETROSPECTIVE.md `§ ARCHIVED FROM STATE — Phase 4.3` + `§ ARCHIVED FROM STATE — Phase 5.1` sections added with verbatim narrative
    - HTML comment markers present in STATE.md at trim sites (sister L57-59 format)
  </done>
</task>

<task type="auto">
  <name>Task T0.2: D1 SIZE_LIMIT 165→? round 3 conditional flip per #BA decision tree</name>
  <files>scripts/check-state-archive-stale.mjs</files>
  <action>
    Per CONTEXT #BA L122 decision tree (sister Phase 4.3 W0.2 200→175 + Phase 5.1 W0 T0.2 175→165 cadence延袭 tighter as confidence in trim cadence increases):

    1. **Read post-T0.1 STATE.md size** — `wc -l .planning/STATE.md` → branch decision:
       - **IF ≤150L → FLIP path**: 1-line surgical edit L12 (or wherever `const SIZE_LIMIT = 165` lives — grep first to verify line number) `const SIZE_LIMIT = 165` → `const SIZE_LIMIT = 150` (15L safety headroom)
       - **IF 151-160L → DEFER #BA**: NO file change; document decision in commit message + STATE.md "Blockers" or "P1 DEFERRED carry-forward" section append `#BA → Phase 5.3+ W0 LOW priority (5th DEFER signal — reassess if Phase 5.3 should formally close #BA disposition vs continue defer)`
       - **IF >160L → BLOCKED**: escalate — investigate W0.1 trim sufficiency; T0.1 likely failed to remove enough narrative (re-run T0.1 with deeper trim scope)

    2. **Verify if FLIP path taken**: `node -e "import('./scripts/check-state-archive-stale.mjs')"` OR `node scripts/check-state-archive-stale.mjs .planning/STATE.md` exit 0 (new limit enforced); `pnpm test` related tests green (e.g. tests/scripts/check-state-archive-stale.test.ts if exists).

    3. **Sneak-block**: MUST NOT flip SIZE_LIMIT below 150 (15L headroom floor; sister Phase 5.1 cadence — never below 5L margin); MUST NOT skip DEFER documentation if 151-160L path (terminus signal tracking).
  </action>
  <verify>
    <automated>node scripts/check-state-archive-stale.mjs .planning/STATE.md</automated>
  </verify>
  <done>
    - IF FLIP path: SIZE_LIMIT = 150 + check-state-archive-stale.mjs exit 0
    - IF DEFER path: NO file change; STATE.md DEFERRED section updated with #BA carry-forward Phase 5.3+
    - IF BLOCKED path: T0.1 re-run with deeper scope (escalation; not Plan-level resolvable)
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task T0.3: sub-batch #BH validateFlags + #BI runOrPreview extract — sister Phase 5.1 W0 #BF+#BG cadence延袭</name>
  <files>src/cli/lib/validateFlags.ts, src/uninstallers/lib/runOrPreview.ts, src/cli/install.ts, src/cli/install-base.ts, src/cli/research.ts, src/cli/manifest-add.ts, src/cli/execute-task.ts</files>
  <action>
    Two parallel atomic extracts per RESEARCH § 4 verified grep results (5-file H1 gate dup + 7-installer dryRun dup):

    **Step 1 — NEW src/cli/lib/validateFlags.ts (~20-30L)**: Extract identical 4-line block from install.ts L67-74:
    ```typescript
    // src/cli/lib/validateFlags.ts — Phase 5.2 W0 #BH NEW
    export function validateNonInteractiveFlags(
      raw: { nonInteractive?: boolean; apply?: boolean; dryRun?: boolean },
      commandName: string,
    ): void {
      if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
        console.error(
          `error: --non-interactive requires an explicit --apply or --dry-run flag\n` +
          `  fix:  re-run as 'harnessed ${commandName} --non-interactive --dry-run' or '--apply'`,
        )
        process.exit(2)
      }
    }
    ```

    **Step 2 — MODIFY 5 CLI files** — replace inline H1 gate block with single import + call:
    - `src/cli/install.ts` L67-74 → `validateNonInteractiveFlags(raw, 'install')`
    - `src/cli/install-base.ts` L51-56 → `validateNonInteractiveFlags(raw, 'install-base')`
    - `src/cli/research.ts` L37-43 → `validateNonInteractiveFlags(raw, 'research')`
    - `src/cli/manifest-add.ts` L39-41 → `validateNonInteractiveFlags(raw, 'manifest-add')` (note: manifest-add inline is shorter — verify error message identical post-replace OR keep manifest-add inline if format diverges)
    - `src/cli/execute-task.ts` L39-43 → `validateNonInteractiveFlags(raw, 'execute-task')`

    Add `import { validateNonInteractiveFlags } from './lib/validateFlags.js'` to each file.

    **Step 3 — NEW src/uninstallers/lib/runOrPreview.ts (~25-40L)**: Extract dryRun gate helper for uninstaller reuse (NOT installer regression — installer files untouched Phase 5.2):
    ```typescript
    // src/uninstallers/lib/runOrPreview.ts — Phase 5.2 W0 #BI NEW
    import type { UninstallContext, UninstallResult } from './types.js'

    export function dryRunGate(ctx: UninstallContext): UninstallResult | null {
      if (ctx.opts.dryRun || !ctx.opts.apply) {
        return { aborted: true, reason: 'dry-run' }
      }
      return null  // proceed
    }
    ```
    Note: types.ts NOT yet created (T1.1) — this file may be created AFTER T1.1 OR with forward-declared types (recommend: T0.3 creates with `// TODO: import from ./types.js after T1.1` placeholder + T1.1 wires up the import; OR T0.3 implements types.ts inline first then T1.1 extends — pragmatic choice for execute-phase).

    **Step 4 — Biome preempt MANDATORY** before commit per project memory `feedback_biome-preempt.md` (3 CI-red recurrences):
    `pnpm exec biome check --write src/cli/lib/validateFlags.ts src/uninstallers/lib/runOrPreview.ts src/cli/{install,install-base,research,manifest-add,execute-task}.ts`

    **Step 5 — Test suite green gate**: `corepack pnpm test` 733+ tests still green (NO regression from refactor).

    **Sneak-block**: MUST NOT change H1 gate error message wording (executor reads message verbatim — wording change = behavior change masquerading as refactor); MUST preserve exit code 2 + console.error stream; MUST run biome BEFORE commit (sister project memory enforced).
  </action>
  <verify>
    <automated>corepack pnpm test && pnpm exec biome check src/cli/lib/validateFlags.ts src/uninstallers/lib/runOrPreview.ts && pnpm build</automated>
  </verify>
  <done>
    - src/cli/lib/validateFlags.ts NEW ≤30L exports validateNonInteractiveFlags
    - src/uninstallers/lib/runOrPreview.ts NEW ≤40L exports dryRunGate
    - 5 CLI files MODIFY — import + call replace inline H1 gate block
    - `grep -E "if \(raw\.nonInteractive && !raw\.apply" src/cli/*.ts` returns 0 hits (all inline gates replaced) OR documents manifest-add inline if kept
    - 733+ tests green; biome + tsc + build exit 0
  </done>
</task>

<task type="auto">
  <name>Task T0.4: W0 baseline gate verify — post-extract test/biome/tsc green; Wave 1 unblock</name>
  <files>(verification only — no file modification)</files>
  <action>
    Final gate before Wave 1 entry — verify W0 sub-batch refactor clean per sister Phase 5.1 W0 cadence延袭:

    1. **Full test suite** — `corepack pnpm test` exit 0; expected 733+ tests PASS (NO regression from T0.3 extract)
    2. **Biome** — `pnpm exec biome check src/cli/ src/uninstallers/` exit 0
    3. **TypeScript** — `pnpm exec tsc --noEmit` exit 0
    4. **Build** — `pnpm build` exit 0
    5. **Grep verify W0 #BH dedup** — `grep -lE "if \(raw\.nonInteractive && !raw\.apply" src/cli/*.ts` returns 0 (or 1 if manifest-add kept inline per T0.3 step 2 caveat — document in DOGFOOD-T2.X)
    6. **Grep verify W0 #BI ready** — `wc -l src/uninstallers/lib/runOrPreview.ts` shows file exists ≤40L (uninstaller layer NOT yet using it — Wave 1 will import)

    **Sneak-block**: MUST NOT proceed to Wave 1 if ANY of test/biome/tsc/build fails; MUST NOT skip grep verification (#BH dedup is observable artifact per truth list).
  </action>
  <verify>
    <automated>corepack pnpm test && pnpm exec biome check src/cli/ src/uninstallers/ && pnpm exec tsc --noEmit && pnpm build</automated>
  </verify>
  <done>
    - 733+ tests green; biome + tsc + build exit 0
    - W0 #BH grep verification PASS (0 inline H1 gate duplicates remaining OR documented exception)
    - W0 #BI file exists ≤40L ready for Wave 1 uninstaller consumption
    - Wave 1 unblocked for R10.3 uninstaller layer build
  </done>
</task>

<!-- =============== WAVE 1: R10.3 uninstall — 7 uninstallers + CLI + TDD (5 tasks T1.0-T1.4) =============== -->

<task type="checkpoint:human-verify">
  <name>Task T1.0: PREREQ — verify claude mcp remove + claude plugin uninstall CLI syntax (A1/A2 ASSUMPTION resolve)</name>
  <what-built>
    NOT yet built — this is a PREREQ verification gate. RESEARCH § Sources Tertiary Assumptions Log A1+A2 LOW confidence: `claude mcp remove <name> --scope project` + `claude plugin uninstall <plugin>@<marketplace>` exact CLI syntax inferred from install counterparts but NOT verified against live CC CLI.

    Wave 1 T1.2 mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace uninstaller depend on correct syntax — if A1/A2 wrong, those 3 uninstaller files produce non-functional code.
  </what-built>
  <how-to-verify>
    Run these CC CLI commands locally + record exact syntax output:

    1. `claude mcp remove --help` — verify exact syntax:
       - Required positional arg name? (e.g. `<name>` or `<server-name>`)
       - `--scope project` flag exists? (or `--scope=project`?)
       - Exit code semantics — does `claude mcp remove nonexistent` exit 0 (idempotent) or exit 1 (not found)?

    2. `claude plugin uninstall --help` — verify exact syntax:
       - Required arg format? (e.g. `<plugin>@<marketplace>` or `<plugin>` only or `<slug>`)
       - Or is it `claude plugin remove` instead of `claude plugin uninstall`?

    3. If syntax matches RESEARCH § 2.2-2.3 invocation → reply "approved — syntax matches RESEARCH"
    4. If syntax differs → reply with actual syntax discovered; planner will update T1.2 mcpStdio/mcpHttp/ccPlugin uninstaller files to use actual syntax
  </how-to-verify>
  <resume-signal>Type "approved" if RESEARCH syntax matches OR provide actual `--help` output if differs</resume-signal>
</task>

<task type="auto" tdd="true">
  <name>Task T1.1: NEW src/uninstallers/lib/types.ts + src/uninstallers/index.ts (dispatch table + types contract)</name>
  <files>src/uninstallers/lib/types.ts, src/uninstallers/index.ts</files>
  <behavior>
    - Test 1: UninstallOpts interface exports { apply: boolean; dryRun: boolean; yes: boolean }
    - Test 2: UninstallContext interface exports { manifest: Manifest; opts: UninstallOpts; cwd: string }
    - Test 3: UninstallResult union type exports 3 variants (ok / aborted / error)
    - Test 4: uninstallers dispatch table contains 7 method keys (all Manifest install.method values)
    - Test 5: runUninstall(manifest, opts) function exported; dispatches to correct uninstaller per install.method
  </behavior>
  <action>
    **Step 1 — NEW src/uninstallers/lib/types.ts (~25-35L)** sister src/installers/lib/types.ts symmetric:
    ```typescript
    import type { Manifest } from '../../manifest/schema/spec.js'

    export interface UninstallOpts {
      apply: boolean
      dryRun: boolean
      yes: boolean
    }
    export interface UninstallContext {
      manifest: Manifest
      opts: UninstallOpts
      cwd: string
    }
    export type UninstallResult =
      | { ok: true; removedPaths: string[] }
      | { ok: false; phase: 'preflight' | 'spawn' | 'verify'; error: string; suggest?: string }
      | { aborted: true; reason: 'user-cancel' | 'ephemeral' | 'dry-run' }
    export type Uninstaller = (ctx: UninstallContext) => Promise<UninstallResult>
    ```

    **Step 2 — NEW src/uninstallers/index.ts (~25-35L)** sister src/installers/index.ts symmetric per RESEARCH § 1 D-01:
    ```typescript
    import { uninstallCcHookAdd } from './ccHookAdd.js'
    import { uninstallCcPluginMarketplace } from './ccPluginMarketplace.js'
    import { uninstallGitCloneWithSetup } from './gitCloneWithSetup.js'
    import { uninstallMcpHttpAdd } from './mcpHttpAdd.js'
    import { uninstallMcpStdioAdd } from './mcpStdioAdd.js'
    import { uninstallNpmCli } from './npmCli.js'
    import { uninstallNpxSkillInstaller } from './npxSkillInstaller.js'
    import type { Manifest } from '../manifest/schema/spec.js'
    import type { Uninstaller, UninstallOpts, UninstallResult } from './lib/types.js'

    export const uninstallers: Record<Manifest['spec']['install']['method'], Uninstaller> = {
      'npm-cli': uninstallNpmCli,
      'mcp-stdio-add': uninstallMcpStdioAdd,
      'cc-plugin-marketplace': uninstallCcPluginMarketplace,
      'git-clone-with-setup': uninstallGitCloneWithSetup,
      'npx-skill-installer': uninstallNpxSkillInstaller,
      'mcp-http-add': uninstallMcpHttpAdd,
      'cc-hook-add': uninstallCcHookAdd,
    }

    export async function runUninstall(manifest: Manifest, opts: UninstallOpts): Promise<UninstallResult> {
      return uninstallers[manifest.spec.install.method]({ manifest, opts, cwd: process.cwd() })
    }
    ```

    **Step 3 — Backfill T0.3 runOrPreview.ts type imports** if placeholder TODO was used; now types.ts exists.

    **Sneak-block**: MUST NOT include `levelOf()` (uninstall has no L4 --system gate per D-01 LOCKED sneak-block + RESEARCH § 2.1 L113); MUST NOT add `backupId` to UninstallResult (uninstall NOT install — D-07 NO backup); each file ≤35L Karpathy.
  </action>
  <verify>
    <automated>pnpm exec biome check src/uninstallers/ && pnpm exec tsc --noEmit && wc -l src/uninstallers/lib/types.ts src/uninstallers/index.ts | awk '$1 <= 40 || /total/'</automated>
  </verify>
  <done>
    - src/uninstallers/lib/types.ts NEW ≤35L exports UninstallOpts + UninstallContext + UninstallResult + Uninstaller
    - src/uninstallers/index.ts NEW ≤35L exports uninstallers dispatch + runUninstall
    - biome + tsc exit 0 (NOTE: 7 individual uninstaller files NOT yet created — index.ts imports will fail tsc until T1.2 done; acceptable transient state OR T1.2 must run immediately after)
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task T1.2: NEW 7 src/uninstallers/*.ts files (npmCli + mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace + gitCloneWithSetup + npxSkillInstaller + ccHookAdd)</name>
  <files>src/uninstallers/npmCli.ts, src/uninstallers/mcpStdioAdd.ts, src/uninstallers/mcpHttpAdd.ts, src/uninstallers/ccPluginMarketplace.ts, src/uninstallers/gitCloneWithSetup.ts, src/uninstallers/npxSkillInstaller.ts, src/uninstallers/ccHookAdd.ts</files>
  <behavior>
    Per-file behavior (each TDD red-green-refactor via tests/cli/uninstall.test.ts cells 4-9+12):
    - npmCli: D-02 ephemeral detect via `/\bnpx\s+(--yes|-y)\b/.test(install.cmd)` → exit 0 + warn; else `npm uninstall <pkg>` via direct spawn (NOT runArgs which prefixes claude)
    - mcpStdioAdd: discriminator check `install.method === 'mcp-stdio-add'`; runArgs(['mcp', 'remove', name, '--scope', 'project'])
    - mcpHttpAdd: IDENTICAL body to mcpStdioAdd (claude mcp remove transport-agnostic per RESEARCH § 2.2); discriminator check `install.method === 'mcp-http-add'`
    - ccPluginMarketplace: parse `<plugin>@<marketplace>` from install.cmd; runArgs(['plugin', 'uninstall', pluginAtMkt])
    - gitCloneWithSetup: extractCloneTarget inline (duplicate from installer L70-98 per YAGNI); fs.rm(cloneTarget, { recursive: true, force: true })
    - npxSkillInstaller: extractSkillName inline; fs.rm(join(homedir(), '.claude', 'skills', skillName), { recursive: true, force: true })
    - ccHookAdd: readFile settings.json + JSON.parse + filter out matching entry from hooks[ev] + writeFile + verify re-read
  </behavior>
  <action>
    Implement each file per RESEARCH § 2 verbatim — execute in order recommended per PATTERNS § risk #1 (simplest spawns first; ccHookAdd last most complex):

    **Order**: mcpStdioAdd → mcpHttpAdd → ccPluginMarketplace → npmCli → npxSkillInstaller → gitCloneWithSetup → ccHookAdd

    **Each file template** sister installer 1:1 inverse (PATTERNS § file classification 100% reuse):

    Example mcpStdioAdd:
    ```typescript
    // src/uninstallers/mcpStdioAdd.ts (~20L)
    import { err } from '../installers/lib/err.js'
    import { runArgs } from '../installers/lib/runClaudeArgs.js'
    import type { Uninstaller } from './lib/types.js'

    export const uninstallMcpStdioAdd: Uninstaller = async (ctx) => {
      const install = ctx.manifest.spec.install
      if (install.method !== 'mcp-stdio-add') {
        return { ok: false, phase: 'preflight', error: err(ctx as any, '/spec/install/method', `dispatch bug: ${install.method}`, 'dispatch-mismatch').error }
      }
      const name = ctx.manifest.metadata.name
      const r = await runArgs(['mcp', 'remove', name, '--scope', 'project'], ctx.cwd)
      if (r.exitCode !== 0) {
        return { ok: false, phase: 'spawn', error: `claude mcp remove exited ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
      }
      return { ok: true, removedPaths: [] }
    }
    ```

    **Special-case npmCli with D-02 ephemeral detect** per RESEARCH § 2.1 L139-152:
    ```typescript
    // src/uninstallers/npmCli.ts (~30L)
    import { spawn } from 'node:child_process'
    export const uninstallNpmCli: Uninstaller = async (ctx) => {
      const install = ctx.manifest.spec.install
      if (install.method !== 'npm-cli') return /* dispatch error */
      if (/\bnpx\s+(--yes|-y)\b/.test(install.cmd)) {
        console.warn(`ephemeral install: nothing to uninstall ('${ctx.manifest.metadata.name}' uses 'npx --yes' runtime-only invocation; no persistent install to remove)`)
        return { aborted: true, reason: 'ephemeral' }
      }
      const pkgMatch = install.cmd.match(/\bnpm\s+install(?:\s+-g)?\s+(\S+)/)
      const pkg = pkgMatch?.[1] ?? ctx.manifest.metadata.upstream.source
      const isGlobal = /\bnpm\s+install\s+-g\b/.test(install.cmd)
      const args = isGlobal ? ['uninstall', '-g', pkg] : ['uninstall', pkg]
      // direct npm spawn — NOT runArgs (which prefixes claude)
      // ... ~10L spawn pattern from src/installers/lib/spawn.ts sister ...
      return { ok: true, removedPaths: [] }
    }
    ```

    **Special-case gitCloneWithSetup + npxSkillInstaller** — cross-OS fs.rm per RESEARCH § 2.4-2.5:
    ```typescript
    import { rm } from 'node:fs/promises'
    await rm(targetPath, { recursive: true, force: true })
    // force:true makes idempotent if already absent — no ENOENT throw
    ```

    **Special-case ccHookAdd** — reverse JSON deep-merge per RESEARCH § 2.6 L350-374:
    ```typescript
    settings.hooks[ev] = settings.hooks[ev].filter(h => !(h.command === cmd && h.matcher === matcher))
    if (settings.hooks[ev].length === 0) delete settings.hooks[ev]
    ```

    **Apply T0.3 W0 #BI runOrPreview if dry-run gate needed inside uninstaller** — currently D-05 dry-run gated at CLI layer (cli/uninstall.ts) BEFORE dispatch per RESEARCH § Architectural Responsibility Map L67 "CLI short-circuits before dispatch if !apply"; so uninstaller files may NOT need runOrPreview.ts import; document SKIP if so + T0.3 W0 #BI value = future-proofing only. Per CONTEXT § Open Q + RESEARCH § 4.2 L606 "may not need".

    **Sneak-block**: each file ≤45L Karpathy (mcp* ≤25L / git* + npx-skill ≤35L / ccHookAdd ≤45L); MUST use shell:false default (RESEARCH § 1 D-01 spawn argv mode immune shell escape); MUST use `force:true` on fs.rm (idempotent); MUST verify dispatch discriminator first-line of each uninstaller (sister installer pattern延袭); MUST NOT use runArgs for npm (prefixes claude — Pitfall 1).
  </action>
  <verify>
    <automated>corepack pnpm test -- tests/cli/uninstall.test.ts --run && pnpm exec biome check src/uninstallers/ && pnpm exec tsc --noEmit && wc -l src/uninstallers/*.ts</automated>
  </verify>
  <done>
    - 7 uninstaller files NEW each ≤45L Karpathy
    - tests/cli/uninstall.test.ts cells 4-9+12 PASS (per-method dispatch + ephemeral + fs.rm + hook inverse)
    - biome + tsc exit 0
    - `grep -E "shell\s*:\s*true" src/uninstallers/` returns 0 hits
    - `grep "force: true" src/uninstallers/gitCloneWithSetup.ts src/uninstallers/npxSkillInstaller.ts` returns 2 hits
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task T1.3: NEW src/cli/uninstall.ts + MODIFY src/cli.ts register 14th + NEW tests/cli/uninstall.test.ts</name>
  <files>src/cli/uninstall.ts, src/cli.ts, tests/cli/uninstall.test.ts</files>
  <behavior>
    Test cells 1-14 per RESEARCH § 3.5 + PATTERNS § tests/cli/uninstall.test.ts cell matrix:
    - Cell 1: H1 gate `--yes` without `--apply` → exit 2 with verbatim error message
    - Cell 2: Manifest not found → exit 1
    - Cell 3: Default dry-run no `--apply` → preview output + exit 2 aborted (D-05)
    - Cell 4: `--apply` on ephemeral (npx --yes cmd) → exit 0 + warn (D-02)
    - Cell 5: `--apply` git-clone-with-setup → fs.rm called correct path, exit 0
    - Cell 6: `--apply` npx-skill-installer → fs.rm called ~/.claude/skills/<name>, exit 0
    - Cell 7: `--apply` mcp-stdio-add → runArgs(['mcp','remove',name,'--scope','project']) called, exit 0
    - Cell 8: `--apply` mcp-http-add → same as cell 7 (transport-agnostic)
    - Cell 9: `--apply` cc-plugin-marketplace → runArgs(['plugin','uninstall',slug]) called, exit 0
    - Cell 10: `--apply --yes` skips confirm prompt, exit 0
    - Cell 11: runArgs spawn error → exit 1 + error message
    - Cell 12: `--apply` cc-hook-add → settings.json filter out matching entry exit 0
    - Cell 13: Path traversal name (e.g. `../../etc/passwd`) → PathTraversalError → exit 1 (R10.4 D-04 site 2b)
    - Cell 14: Safe name `ctx7` passes path guard + proceeds to dispatch
  </behavior>
  <action>
    **Step 1 — TDD RED first**: Create tests/cli/uninstall.test.ts BEFORE src/cli/uninstall.ts. Sister tests/cli/audit-log.test.ts 242L 100% reuse per PATTERNS § 2.4 — ExitError class + runCli helper + vi.mock node:child_process + node:fs + node:fs/promises pattern.

    ```typescript
    // tests/cli/uninstall.test.ts — Phase 5.2 R10.3 TDD red-green-refactor (~150-180L)
    import { Command } from 'commander'
    import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

    vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
    vi.mock('node:fs/promises', () => ({ rm: vi.fn(), readFile: vi.fn(), writeFile: vi.fn() }))
    vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({ runArgs: vi.fn() }))

    class ExitError extends Error { constructor(public code: number) { super(`exit(${code})`) } }
    async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> { /* sister audit-log.test.ts pattern */ }

    describe('R10.3 harnessed uninstall CLI', () => {
      it('cell 1 — --yes without --apply → exit 2 H1 gate', async () => { /* ... */ })
      it('cell 2 — manifest not found → exit 1', async () => { /* ... */ })
      it('cell 3 — default dry-run preview → exit 2 aborted', async () => { /* ... */ })
      // ... cells 4-14 per behavior matrix above
    })
    ```

    **Step 2 — NEW src/cli/uninstall.ts (~110-140L)** sister src/cli/install.ts 145L 90% reuse per PATTERNS § cli/uninstall.ts:

    ```typescript
    // src/cli/uninstall.ts — Phase 5.2 R10.3 NEW (≤200L Karpathy)
    import { readFile } from 'node:fs/promises'
    import { resolve } from 'node:path'
    import * as p from '@clack/prompts'
    import type { Command } from 'commander'
    import { runUninstall } from '../uninstallers/index.js'
    import { resolveAlias } from '../manifest/aliases.js'
    import { guardPath } from '../manifest/lib/path-guard.js'  // R10.4 D-04 site 2b
    import { validateManifestFile } from '../manifest/validate.js'

    interface RawOpts {
      apply?: boolean
      dryRun?: boolean
      yes?: boolean
    }

    export function registerUninstall(program: Command): void {
      program
        .command('uninstall <name>')
        .description('Uninstall a tool (dry-run by default — pass --apply to execute)')
        .option('--apply', 'execute the uninstall (default: dry-run preview only)')
        .option('--dry-run', 'force dry-run (overrides --apply if both set)')
        .option('--yes', 'skip interactive confirmation (CI/scripts — requires --apply)')
        .action(async (name: string, raw: RawOpts) => {
          // H1 gate — D-06 LOCKED
          if (raw.yes && !raw.apply && !raw.dryRun) {
            console.error(
              'error: --yes requires --apply to execute uninstall\n' +
              "  fix:  'harnessed uninstall <name> --yes --apply'",
            )
            process.exit(2)
          }
          // R10.4 D-04 site 2b — screen user input name
          try { guardPath(name) } catch (e) {
            console.error(`✗ ${(e as Error).message}`); process.exit(1)
          }
          // alias resolution + defense-in-depth resolvedName screen
          const resolvedName = resolveAlias(name) ?? name
          guardPath(resolvedName)
          const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
          let raw_yaml: string
          try { raw_yaml = await readFile(manifestPath, 'utf8') } catch {
            console.error(`✗ manifest not found: ${manifestPath}`); process.exit(1)
          }
          const v = validateManifestFile(raw_yaml, manifestPath)
          if (!v.ok) { console.error(`✗ ${v.error}`); process.exit(1) }
          // D-05 dry-run default
          const isDryRun = !raw.apply || raw.dryRun === true
          if (isDryRun) {
            console.log(`[dry-run] would uninstall '${resolvedName}' via method '${v.manifest.spec.install.method}'`)
            console.log('  run with --apply to execute')
            process.exit(2)
          }
          // D-06 interactive confirm (when --apply AND NOT --yes)
          if (raw.apply && !raw.yes) {
            const confirmed = await p.confirm({
              message: `Uninstall '${resolvedName}'? This cannot be undone.`,
              initialValue: false,
            })
            if (p.isCancel(confirmed) || !confirmed) {
              console.log('aborted')
              process.exit(2)
            }
          }
          // dispatch to runUninstall
          const result = await runUninstall(v.manifest, { apply: true, dryRun: false, yes: !!raw.yes })
          if ('aborted' in result) {
            console.log(`aborted: ${result.reason}`)
            process.exit(result.reason === 'ephemeral' ? 0 : 2)
          }
          if (result.ok) {
            console.log(`✓ uninstalled '${resolvedName}'`)
            process.exit(0)
          }
          console.error(`✗ ${result.error}`)
          process.exit(1)
        })
    }
    ```

    **Step 3 — MODIFY src/cli.ts +~2L** (alphabetical insert after registerAuditLog from Phase 5.1):
    ```typescript
    import { registerUninstall } from './cli/uninstall.js'
    // ... existing registers ...
    registerUninstall(program)  // 14th subcommand Phase 5.2 R10.3 — harnessed uninstall
    ```

    **Sneak-block**: uninstall.ts MUST ≤200L Karpathy; MUST use `--yes` flag name (NOT `--non-interactive` — destructive ops convention per RESEARCH § 7 Q4 + D-06); MUST invoke guardPath at CLI entry AND after alias resolution (defense-in-depth D-04); ephemeral exit code 0 (success path NOT 2); MUST use `@clack/prompts` p.confirm initialValue:false (D-06 default No).
  </action>
  <verify>
    <automated>corepack pnpm test -- tests/cli/uninstall.test.ts --run && wc -l src/cli/uninstall.ts && pnpm exec biome check src/cli/uninstall.ts src/cli.ts && pnpm build && node dist/cli.js uninstall --help</automated>
  </verify>
  <done>
    - tests/cli/uninstall.test.ts ≥10 cells PASS (TDD red-green-refactor)
    - src/cli/uninstall.ts ≤200L Karpathy
    - src/cli.ts +~2L registerUninstall 14th subcommand
    - `node dist/cli.js uninstall --help` exit 0 + shows --apply/--dry-run/--yes flags
    - `grep "guardPath\(" src/cli/uninstall.ts` returns ≥2 hits (entry + post-alias)
  </done>
</task>

<task type="auto">
  <name>Task T1.4: NEW .planning/phase-5.2/DOGFOOD-T1.X.md (W1 mid-wave 3-axis empirical evidence)</name>
  <files>.planning/phase-5.2/DOGFOOD-T1.X.md</files>
  <action>
    Sister Phase 5.1 DOGFOOD-T1.X.md format 100% reuse adapted W1 R10.3 scope (~30-50L):

    **Axis A — Karpathy + TDD verify**:
    - `wc -l src/uninstallers/*.ts src/cli/uninstall.ts src/uninstallers/lib/types.ts src/uninstallers/index.ts` each ≤200L (most ≤45L)
    - `corepack pnpm test -- tests/cli/uninstall.test.ts --run` ≥10 cells PASS

    **Axis B — PREREQ CC CLI A1/A2 ASSUMPTION resolution** (T1.0 checkpoint outcome):
    - Document `claude mcp remove --help` actual syntax discovered
    - Document `claude plugin uninstall --help` actual syntax discovered
    - Note any deviations from RESEARCH § 2.2-2.3 + commits referencing fix-ups

    **Axis C — Ephemeral detect smoke + dispatch smoke**:
    - Pre-seed test manifest `manifests/tools/test-ephemeral.yaml` with `spec.install.cmd: 'npx --yes some-pkg'`
    - Manual run: `harnessed uninstall test-ephemeral --apply` → exit 0 + warn message present in stderr
    - Pre-seed test manifest `manifests/tools/test-git-clone.yaml` with git-clone-with-setup method + temp target
    - Manual run: `harnessed uninstall test-git-clone --apply --yes` → exit 0 + temp dir removed
    - Path traversal smoke: `harnessed uninstall '../../etc/passwd'` → exit 1 + generic message "path traversal attempt detected" (NO path echo back per D-08)

    **Sneak-block**: MUST NOT use real production manifests for smoke testing (use temp fixtures); MUST include axis B PREREQ outcome (T1.0 checkpoint is gating); MUST verify D-08 message generic (no path leak).
  </action>
  <verify>
    <automated>wc -l .planning/phase-5.2/DOGFOOD-T1.X.md | awk '{print ($1 >= 30) ? "PASS" : "FAIL"}'</automated>
  </verify>
  <done>
    - DOGFOOD-T1.X.md NEW ≥30L (≤80L target)
    - 3 axes documented PASS
    - A1/A2 CC CLI syntax assumption RESOLVED + documented
  </done>
</task>

<!-- =============== WAVE 2: R10.4 path-guard + ADR + A7 + ship cadence (14 tasks T2.1-T2.14) =============== -->

<task type="auto" tdd="true">
  <name>Task T2.1: NEW src/manifest/lib/path-guard.ts + tests/manifest/path-guard.test.ts (R10.4 D-03 5-vector + D-08 generic error)</name>
  <files>src/manifest/lib/path-guard.ts, tests/manifest/path-guard.test.ts</files>
  <behavior>
    - Cell 1: Unix `../../etc/passwd` → throws PathTraversalError
    - Cell 2: Windows `..\windows\system32` → throws PathTraversalError
    - Cell 3: Null byte `path\x00attack` → throws PathTraversalError
    - Cell 4: URL-encoded `%2e%2e%2fetc` → throws PathTraversalError
    - Cell 5: Double-encoded `%252e%252e%252f` → throws PathTraversalError
    - Cell 6 (D-08 verify): error.message === 'path traversal attempt detected' AND does NOT contain `../../etc/passwd` or any user input
    - Cell 7: Safe path `manifests/tools/ctx7.yaml` → does NOT throw
    - Cell 8: Safe simple name `ctx7` → does NOT throw
    - Cell 9: Safe name with dashes `my-tool_v2` → does NOT throw
  </behavior>
  <action>
    **Step 1 — TDD RED first**: Create tests/manifest/path-guard.test.ts BEFORE src/manifest/lib/path-guard.ts implementation.

    ```typescript
    // tests/manifest/path-guard.test.ts — Phase 5.2 R10.4 TDD (~80-120L)
    import { describe, expect, it } from 'vitest'
    import { guardPath, PathTraversalError } from '../../src/manifest/lib/path-guard.js'

    describe('R10.4 path traversal guard', () => {
      it('cell 1 — Unix dot-dot-slash throws', () => {
        expect(() => guardPath('../../etc/passwd')).toThrow(PathTraversalError)
      })
      it('cell 2 — Win backslash dot-dot throws', () => {
        expect(() => guardPath('..\\windows\\system32')).toThrow(PathTraversalError)
      })
      it('cell 3 — null byte injection throws', () => {
        expect(() => guardPath('path\x00attack')).toThrow(PathTraversalError)
      })
      it('cell 4 — URL-encoded dot-dot throws', () => {
        expect(() => guardPath('%2e%2e%2fetc')).toThrow(PathTraversalError)
      })
      it('cell 5 — double URL-encoded throws', () => {
        expect(() => guardPath('%252e%252e%252f')).toThrow(PathTraversalError)
      })
      it('cell 6 — D-08 verify: error message generic NOT echo input', () => {
        try { guardPath('../../etc/passwd') } catch (e) {
          expect((e as Error).message).toBe('path traversal attempt detected')
          expect((e as Error).message).not.toContain('etc/passwd')
          expect((e as Error).message).not.toContain('..')
        }
      })
      it('cell 7 — safe path passthrough', () => {
        expect(() => guardPath('manifests/tools/ctx7.yaml')).not.toThrow()
      })
      it('cell 8 — safe simple name passthrough', () => {
        expect(() => guardPath('ctx7')).not.toThrow()
      })
      it('cell 9 — safe name with dashes/underscores passthrough', () => {
        expect(() => guardPath('my-tool_v2')).not.toThrow()
      })
    })
    ```

    **Step 2 — NEW src/manifest/lib/path-guard.ts (~30-50L)** sister Phase 5.1 R10.1 REDACT_PATTERNS module-level pre-compile pattern symmetric per RESEARCH § 3.1:

    ```typescript
    // src/manifest/lib/path-guard.ts — Phase 5.2 R10.4 NEW (≤50L Karpathy)
    // D-03 LOCKED 5 OWASP A1 path traversal vectors — pre-compile at module load
    // (NOT inside function body; sister Phase 5.1 R10.1 audit-log REDACT_PATTERNS延袭)
    const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
      /\.\.\//,                  // (1) Unix dot-dot-slash
      /\.\.\\/,                  // (2) Windows backslash dot-dot
      /\x00/,                    // (3) Null byte injection
      /%2[eE]%2[eE]/,            // (4) URL-encoded dot-dot
      /%25[2][eE]%25[2][eE]/,    // (5) Double-encoded
    ]

    /** Generic path traversal error — D-08 LOCKED does NOT echo user input
     *  (CSO defense; prevents attack reconnaissance enumeration). */
    export class PathTraversalError extends Error {
      constructor() {
        super('path traversal attempt detected')
        this.name = 'PathTraversalError'
        Object.setPrototypeOf(this, PathTraversalError.prototype)
      }
    }

    /** Guard a user-supplied path string against the 5 OWASP A1 traversal vectors.
     *  Throws PathTraversalError on first match. Safe: does not include input in message. */
    export function guardPath(input: string): void {
      for (const re of PATH_TRAVERSAL_PATTERNS) {
        if (re.test(input)) throw new PathTraversalError()
      }
    }
    ```

    **Sneak-block**: MUST ≤50L Karpathy; MUST use Object.setPrototypeOf for TS class extend Error (sister Phase 5.1 LockHeldError pattern延袭); MUST NOT include input in error message (D-08 LOCKED CSO veto permanent); MUST pre-compile at module load NOT inside loop/function body (RESEARCH § 3.1 + Pitfall 4); MUST use 5 patterns verbatim per CONTEXT D-03 (NO 1-vector reduction NO 10+ vector expansion).
  </action>
  <verify>
    <automated>corepack pnpm test -- tests/manifest/path-guard.test.ts --run && wc -l src/manifest/lib/path-guard.ts && pnpm exec biome check src/manifest/lib/path-guard.ts</automated>
  </verify>
  <done>
    - src/manifest/lib/path-guard.ts NEW ≤50L exports guardPath + PathTraversalError
    - tests/manifest/path-guard.test.ts 7-9 cells PASS
    - biome + tsc + build exit 0
    - `grep "Object.setPrototypeOf" src/manifest/lib/path-guard.ts` returns 1 hit
    - `grep "'path traversal attempt detected'" src/manifest/lib/path-guard.ts` returns 1 hit (generic message verbatim)
  </done>
</task>

<task type="auto">
  <name>Task T2.2: MODIFY src/manifest/aliases.ts resolveAlias() — D-04 hardening site 1</name>
  <files>src/manifest/aliases.ts</files>
  <action>
    R10.4 D-04 hardening site 1 — invoke guardPath BEFORE yaml lookup per RESEARCH § 3.2:

    1. Add import: `import { guardPath } from './lib/path-guard.js'`
    2. Modify `resolveAlias(name)` first line:
    ```typescript
    export function resolveAlias(name: string): string | null {
      guardPath(name)  // R10.4 D-04 hardening site 1 — throws PathTraversalError on attack
      return loadAliases()?.aliases?.[name]?.redirect ?? null
    }
    ```

    **Existing tests must still pass** — run `corepack pnpm test -- tests/manifest/aliases-security.test.ts --run` after change.

    **Sneak-block**: MUST add guardPath FIRST LINE of resolveAlias (BEFORE any aliases lookup); MUST NOT inline path-guard logic (use import from lib/); MUST NOT skip existing test verification (regression check).
  </action>
  <verify>
    <automated>corepack pnpm test -- tests/manifest/ --run && pnpm exec biome check src/manifest/aliases.ts</automated>
  </verify>
  <done>
    - src/manifest/aliases.ts MODIFY +2L (import + guardPath call)
    - All existing aliases tests still PASS
    - `grep "guardPath(name)" src/manifest/aliases.ts` returns 1 hit
  </done>
</task>

<task type="auto">
  <name>Task T2.3: MODIFY src/cli/install.ts L81-82 + verify src/cli/uninstall.ts L?? — D-04 hardening site 2a + 2b verify</name>
  <files>src/cli/install.ts, src/cli/uninstall.ts</files>
  <action>
    R10.4 D-04 hardening site 2 — defense-in-depth resolvedName screen per RESEARCH § 3.3 + § A6:

    **Site 2a — src/cli/install.ts L81-82**:
    1. Add import: `import { guardPath } from '../manifest/lib/path-guard.js'`
    2. Insert `guardPath(resolvedName)` between L81 (alias resolution) and L82 (resolve manifestPath):
    ```typescript
    const resolvedName = resolveAlias(name) ?? name
    guardPath(resolvedName)  // R10.4 D-04 site 2a — defense-in-depth alias redirect screen
    const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
    ```

    **Site 2b — src/cli/uninstall.ts** (already created T1.3):
    Verify uninstall.ts L?? contains `guardPath(name)` at CLI entry + `guardPath(resolvedName)` after alias resolution per T1.3 plan — `grep -c "guardPath" src/cli/uninstall.ts` ≥ 2.

    **Existing install tests must still pass** — `corepack pnpm test -- tests/cli/install*.test.ts --run`.

    **Sneak-block**: MUST screen resolvedName (NOT just original name) — defense-in-depth alias redirect value per RESEARCH § A6 (alias redirect could itself contain traversal); MUST NOT skip uninstall.ts verification (T1.3 may have missed this — verify Wave 2 entry).
  </action>
  <verify>
    <automated>corepack pnpm test -- tests/cli/ --run && grep -c "guardPath(resolvedName)" src/cli/install.ts && grep -c "guardPath" src/cli/uninstall.ts</automated>
  </verify>
  <done>
    - src/cli/install.ts MODIFY +2L (import + guardPath call); `grep "guardPath(resolvedName)" src/cli/install.ts` ≥ 1 hit
    - src/cli/uninstall.ts `grep "guardPath" src/cli/uninstall.ts` ≥ 2 hits (entry + post-alias)
    - All existing install/uninstall tests still PASS
  </done>
</task>

<task type="auto">
  <name>Task T2.4: CONDITIONAL MODIFY src/cli/audit-log.ts — D-04 site 2c (verify minimal/no change)</name>
  <files>src/cli/audit-log.ts</files>
  <action>
    Per CONTEXT D-04 L86 + RESEARCH § 3 — audit-log.ts AUDIT_PATH is HARDCODED literal (Phase 5.1 STRIDE T mitigation). User-controlled path inputs may not exist.

    1. **Grep verify** — `grep -E "process\.argv\|opts\.(path|file)" src/cli/audit-log.ts` — expected 0 hits for path-shaped user input.
    2. **IF zero user-controlled path inputs found**:
       - SKIP MODIFY this file
       - Document SKIP-rationale in DOGFOOD-T2.X.md axis B: "audit-log.ts AUDIT_PATH hardcoded per Phase 5.1 STRIDE T mitigation; no user-controlled path inputs require guardPath integration per D-04 LOCKED 2 sites minimal (Karpathy YAGNI)"
    3. **IF user-controlled path input found** (unexpected — verify Wave 2 entry):
       - Add `guardPath(<user-input-var>)` BEFORE any path operation
       - Document the path in DOGFOOD-T2.X.md axis B

    **Sneak-block**: MUST NOT add gratuitous guardPath calls for non-user-controlled paths (D-04 LOCKED 2 sites minimal — sneak-block "NO src/audit/log.ts hardcoded path NOT user-controlled, no attack surface"); MUST document SKIP-rationale if applicable.
  </action>
  <verify>
    <automated>grep -cE "process\.argv|opts\.(path|file)" src/cli/audit-log.ts</automated>
  </verify>
  <done>
    - Either SKIP rationale documented (preferred per CONTEXT D-04 + Karpathy YAGNI) OR +1-2L guardPath added (if user-controlled path discovered)
    - existing tests still PASS
  </done>
</task>

<task type="auto">
  <name>Task T2.5: NEW docs/adr/0022-uninstall-and-path-traversal.md (PRIMARY ADR 9-section)</name>
  <files>docs/adr/0022-uninstall-and-path-traversal.md</files>
  <action>
    PRIMARY ADR 0022 ARCHITECTURAL anchor per M-01 LOCKED — sister docs/adr/0021-state-lock-and-audit-consumer.md 174L 9-section format 100% reuse adapted Phase 5.2 R10.3+R10.4 content:

    **Required 9 sections** (≤180L Karpathy):

    1. **Status** — `Accepted (phase 5.2 — 2026-05-20/21)`
    2. **Context** — R10.3 #BV 4th-cycle carry-forward (Phase 4.2 sister 3rd-cycle origin → Phase 5.2 deliver) + R10.4 #AH 4-phase carry (Phase 3.4 W0.4 spike → Phase 4.0 DEFERRED → Phase 4.3 carry → Phase 5.2 deliver); v0.5.0 milestone 2/3 PROGRESS sister H1 BB path LOCKED 2026-05-19
    3. **Decisions** — 8 D-decisions + M-01 verbatim from CONTEXT.md (D-01 per-method 7 + D-02 ephemeral no-op + D-03 5-vector OWASP A1 + D-04 2-site minimal + D-05 dry-run default + D-06 --yes bypass + D-07 NO --keep-backup + D-08 generic error + M-01 ARCHITECTURAL)
    4. **A7 Conservation** — ADR 0001-0021 main body 0 diff verified; ci.yml A7 iter 0021→0022 single extend (NOT retroactive — Phase 5.1 W2 T2.8 already retroactive fix 0019+0020+0021)
    5. **Consequences** — R10.3 14th subcommand + 7 per-method uninstaller (+) / R10.4 path-guard.ts reusable across install+uninstall+audit-log (+) / extractCloneTarget+extractSkillName duplication in uninstaller drift risk (-) accepted YAGNI per RESEARCH § 7 Q1+Q2
    6. **Compliance** — R10.3 + R10.4 acceptance verbatim cite from REQUIREMENTS.md L406-407 + ROADMAP § v0.5.0 L259-262
    7. **Errata-path** — frozen Phase 5.2 ship; v0.6+ ADR 0023+ for comprehensive 10+ attack vector expansion + reverse-by-install ledger if signal
    8. **Adoption-confirmation** — Phase 5.2 ship evidence DOGFOOD-T2.X.md 3/3 axes PASS + 733+→750+ tests + ci.yml A7 0021→0022 + dual tag LOCAL CREATE adr-0022-accepted + v0.5.0-alpha.2-uninstall-security
    9. **References** — CONTEXT 5.2-CONTEXT.md D-01-08 + RESEARCH 5.2/RESEARCH.md § 1-7 + sister ADR 0021 state-lock + ADR 0004 dry-run contract延袭 + sister Phase 5.1 R10.1 REDACT_PATTERNS symmetric pre-compile design

    **Sneak-block**: ≤200L Karpathy; MUST cross-reference ADR 0021 (sister anchor) + ADR 0004 (dry-run contract); MUST document D-04 sneak-block "NO src/audit/log.ts hardcoded path"; MUST note A1/A2 ASSUMPTION resolution path (T1.0 PREREQ outcome from DOGFOOD-T1.X axis B); MUST NOT inflate beyond 180L (sister 0021 174L precedent).
  </action>
  <verify>
    <automated>wc -l docs/adr/0022-uninstall-and-path-traversal.md | awk '{print ($1 >= 140 && $1 <= 200) ? "PASS" : "FAIL"}'</automated>
  </verify>
  <done>
    - docs/adr/0022-uninstall-and-path-traversal.md NEW 140-200L
    - 9 sections present (Status + Context + Decisions + A7 + Consequences + Compliance + Errata + Adoption + References)
    - Cross-references ADR 0021 + ADR 0004 + sister Phase 5.1 R10.1
  </done>
</task>

<task type="auto">
  <name>Task T2.6: MODIFY docs/adr/README.md — append ADR 0022 row</name>
  <files>docs/adr/README.md</files>
  <action>
    Sister Phase 5.1 W2 T2.7 single-add cadence延袭 — append 1 row after ADR 0021 entry:

    ```markdown
    | [0022](./0022-uninstall-and-path-traversal.md) | Phase 5.2 — R10.3 harnessed uninstall CLI (7-method dispatch) + R10.4 path traversal 5-vector regex hardening | Accepted | 2026-05-20 |
    ```

    Insert position: after ADR 0021 row, before any v0.6+ placeholder (if exists).

    **Sneak-block**: MUST NOT reorder existing rows (sister index immutability); MUST match table column format verbatim (4 cols: link + description + status + date).
  </action>
  <verify>
    <automated>grep -c "0022.*uninstall.*path-traversal" docs/adr/README.md</automated>
  </verify>
  <done>
    - docs/adr/README.md +1 row 0022 entry between 0021 and (future 0023+)
  </done>
</task>

<task type="auto">
  <name>Task T2.7: MODIFY .github/workflows/ci.yml A7 step iter 0021→0022 (single extend per Phase 5.1 retroactive done)</name>
  <files>.github/workflows/ci.yml</files>
  <action>
    Single extend NOT retroactive per RESEARCH § 5.2 + CONTEXT critical finding (Phase 5.1 W2 T2.8 already retroactive fix 0019+0020+0021).

    **4 surgical edits** (sister Phase 5.1 cadence):
    1. **L87 step name**: `ADR 0001-0021 main body 守恒` → `ADR 0001-0022 main body 守恒`
    2. **L90 first for loop**: append `0022` after `0021`: `for n in 0001 0002 ... 0020 0021 0022; do`
    3. **L101 second for loop**: same append (verify exact line via `grep -n "for n in 0001" .github/workflows/ci.yml`)
    4. **L112 echo**: `A7 ✅ ADR 0001-0021` → `A7 ✅ ADR 0001-0022`

    **STRICT ordering** per STRIDE D mitigation (sister Phase 5.1 T2.8 pattern): ci.yml commit + push BEFORE adr-0022-accepted tag creation (T2.15). Plan-execute MUST enforce T2.7 → T2.15 ordering.

    **Pre-modification verify** — `git diff $(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0001-*.md ... docs/adr/0021-*.md | tail -1)..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/002[01]-*.md | wc -l` should be 0 (ADR 0001-0021 main body 0 diff verified).

    **Sneak-block**: MUST NOT touch any ADR 0001-0021 main body (A7 guard reciprocal — modifying any of them would break A7); MUST verify both for-loop occurrences (L90 + L101 — exact line numbers may shift); MUST update step name + echo string (transparency gate).
  </action>
  <verify>
    <automated>grep -c "0022" .github/workflows/ci.yml | awk '{print ($1 >= 4) ? "PASS" : "FAIL"}'</automated>
  </verify>
  <done>
    - ci.yml A7 step iter 0021 → 0022 (4 surgical edits applied)
    - Both for-loop occurrences include `0022`
    - Step name + echo string updated to "ADR 0001-0022"
    - ADR 0001-0021 main body 0 diff verified pre-modification (A7 守恒 invariant)
  </done>
</task>

<task type="auto">
  <name>Task T2.8: MODIFY CHANGELOG.md — v0.5.0-alpha.2 entry</name>
  <files>CHANGELOG.md</files>
  <action>
    Sister Phase 5.1 W2 T2.9 Keep-a-Changelog format延袭 — add `## [0.5.0-alpha.2] - 2026-05-20/21` section:

    ```markdown
    ## [0.5.0-alpha.2] - 2026-05-20

    ### Added
    - R10.3 `harnessed uninstall <name>` CLI 14th subcommand (sister installers/ symmetric)
    - 7 per-method uninstallers in `src/uninstallers/` (npmCli + mcpStdioAdd + mcpHttpAdd + ccPluginMarketplace + gitCloneWithSetup + npxSkillInstaller + ccHookAdd)
    - R10.4 path traversal regex hardening — `src/manifest/lib/path-guard.ts` with 5 OWASP A1 vectors
    - ADR 0022 — uninstall + path-traversal architectural decision lock
    - W0 sub-batch dedup — `src/cli/lib/validateFlags.ts` (#BH 5-file H1 gate extract) + `src/uninstallers/lib/runOrPreview.ts` (#BI uninstaller dry-run helper)

    ### Changed
    - `.github/workflows/ci.yml` A7 step ADR 0001-0021 → 0001-0022 (single extend; Phase 5.1 W2 T2.8 already retroactive fix 0019+0020+0021)
    - 5 CLI files (install/install-base/research/manifest-add/execute-task) use `validateNonInteractiveFlags` import instead of inline H1 gate
    - `src/manifest/aliases.ts` `resolveAlias()` invokes `guardPath()` before yaml lookup (R10.4 D-04 site 1)
    - `src/cli/install.ts` invokes `guardPath(resolvedName)` after alias resolution (R10.4 D-04 site 2a)
    ```

    **Sneak-block**: MUST use Keep-a-Changelog format (sister Phase 4.3 W2 T2.5 + Phase 5.1 T2.9 cadence); MUST NOT use Conventional Changelog auto-gen (sister Phase 4.3 D-04 LOCK NOT auto-gen per YAGNI); root-level CHANGELOG.md NOT docs/CHANGELOG.md.
  </action>
  <verify>
    <automated>grep -c "0.5.0-alpha.2" CHANGELOG.md</automated>
  </verify>
  <done>
    - CHANGELOG.md +8-12L v0.5.0-alpha.2 section
    - Added + Changed subsections present
    - Keep-a-Changelog format preserved
  </done>
</task>

<task type="auto">
  <name>Task T2.9: MODIFY .planning/STATE.md — Phase 5.2 SHIPPED + 当前位置 + v0.5.0 2/3 + 18/20→19/20</name>
  <files>.planning/STATE.md</files>
  <action>
    Combine with T0.1 STATE trim — sister Phase 5.1 W2 T2.10 cadence延袭:

    **Update locations**:
    1. **当前位置 (Current Position) — `**GSD phase**` line**: Append `Phase 5.2 SHIPPED 2026-05-20` literal sister Phase 5.1 SHIPPED line precedent
    2. **`**当前里程碑**` line**: Update `v0.5.0 v1.0-RC2 minor **1/3 STARTING**` → `v0.5.0 v1.0-RC2 minor **2/3 PROGRESS**` (Phase 5.2 ✅ ship + Phase 5.3 close prep next)
    3. **`**下一 phase**` line**: Update Phase 5.2 plan-phase content → `Phase 5.3 close prep — v0.5.0 milestone close + 🎯 v1.0 GA prep (3-file archive triplet + ADR 0023+ + triple tag including 🎯 v0.5.0 milestone)`
    4. **`**进度**` line**: `18 / 20 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 90%` → `19 / 20 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 95%`
    5. **各里程碑进度 table v0.5.0 row**: `1/3 🚧 IN PROGRESS` → `2/3 🚧 IN PROGRESS` + update description with Phase 5.2 SHIPPED + Phase 5.3 close prep pending
    6. **已完成 phase ship 历史 section**: Add `- **Phase 5.2 shipped** ✅ (2026-05-20) — R10.3 harnessed uninstall + R10.4 path traversal hardening + ADR 0022 + ci.yml A7 0021→0022 + tests 733+→750+` line before Phase 5.1 line
    7. **关键决策记录 table**: Append `| ADR 0022 path traversal + uninstall | F26 + ci.yml iterate | Phase 5.2 W2 T2.7 iter 1-0021 → 1-0022 |` row
    8. **关键提醒**: Update bullet 7 if it references "ADR 0001-0020" → "ADR 0001-0021" or "0001-0022"

    **Sneak-block**: MUST preserve T0.1 archive marker HTML comments (Phase 4.3+5.1 narrative already moved to RETROSPECTIVE); MUST NOT close v0.5.0 milestone (留 Phase 5.3); MUST NOT use ✅ checkbox for v0.5.0 row (still IN PROGRESS).
  </action>
  <verify>
    <automated>grep -E "Phase 5\.2 SHIPPED|2/3 PROGRESS|19 / 20" .planning/STATE.md | wc -l</automated>
  </verify>
  <done>
    - STATE.md "当前位置" updated with Phase 5.2 SHIPPED
    - 当前里程碑 v0.5.0 1/3 → 2/3 PROGRESS
    - 下一 phase Phase 5.3 close prep
    - 进度 18/20 → 19/20 95%
    - 已完成 phase ship 历史 +1 Phase 5.2 line
    - Total size still ≤150L (post-T0.1 trim baseline preserved despite +8L Phase 5.2 entries; should be ~140-150L)
  </done>
</task>

<task type="auto">
  <name>Task T2.10: MODIFY .planning/RETROSPECTIVE.md — Phase 5.2 retrospective + cross-milestone v0.5.0 close-prep trends</name>
  <files>.planning/RETROSPECTIVE.md</files>
  <action>
    Sister Phase 5.1 W2 T2.7 7-section retrospective format 100% reuse + cross-milestone trends section.

    **Append at top of file (NEW Phase 5.2 retrospective section)**:

    7 sections per sister Phase 5.1 cadence:
    1. **What Shipped** — R10.3 14th CLI subcommand + 7 uninstaller + R10.4 path-guard 5 OWASP A1 + ADR 0022 + ci.yml A7 0021→0022 + W0 sub-batch #BH+#BI dedup
    2. **What Worked** — Sister Phase 5.1 W0 #BF+#BG cadence延袭 enable Phase 5.2 W0 #BH+#BI parallel atomic refactor; PATTERNS § 20-file 100% analog reuse rapid build; TDD red-green-refactor for R10.3 ephemeral + R10.4 5 regex核心 logic
    3. **What Was Inefficient** — Wave 1 T1.0 PREREQ checkpoint A1/A2 ASSUMPTION resolution gate (could be PRE-PHASE research deeper); 7 uninstaller monotony despite ≤45L Karpathy each (mechanical not creative — accept low blast radius)
    4. **Patterns Established** — D2 cadence iter 6 REINFORCE → "implicit-standing-process" institutionalize (if 6th iter confirmed stable beyond 5-iter terminus); module-level RegExp pre-compile sister redact symmetric design (Phase 5.1 R10.1 → Phase 5.2 R10.4)
    5. **Key Lessons** — Karpathy file-per-method ≤30L preservation > 1 file switch-case (D-01 LOCKED); ephemeral detect via cmd regex pattern in uninstaller layer (NOT CLI — RESEARCH § Architectural Responsibility Map separates concerns); generic error messages vs informative trade-off (D-08 LOCKED CSO defense)
    6. **Cost Patterns** — Plan-phase budget similar Phase 5.1 (sister cadence延袭); execute-phase 7 file × ≤45L = bounded effort; PREREQ gate adds 1 checkpoint context cost
    7. **Carry-forward** — Phase 5.2 SHIPPED clears #BV + #AH; v0.6+ deferred = 10+ vector expansion + reverse-by-install ledger + comprehensive fs.* audit + state.ts op-level lock refinement; Phase 5.3 close prep = v0.5.0 milestone close + 🎯 v1.0 GA target

    **Cross-milestone v0.5.0 close-prep trends section** (NEW — sister v0.4.0 close trends from Phase 4.3 retrospective format延袭 BUT prep-only, not full close):
    - v0.5.0 minor 2/3 PROGRESS (Phase 5.1 + 5.2 SHIPPED; Phase 5.3 close pending)
    - 4 R10.x requirements discharged (R10.1 + R10.2 Phase 5.1; R10.3 + R10.4 Phase 5.2)
    - 4 ADR added (0021 + 0022) — full close 留 Phase 5.3 milestone-AUDIT triplet
    - Carry-forward 0 v0.5.0-scoped backlogs remaining (clean close prep state)

    **Sneak-block**: MUST NOT mark v0.5.0 milestone CLOSED (留 Phase 5.3 sister Phase 4.3 close cadence延袭); MUST distinguish "close-prep" vs "close" sections; MUST preserve T0.1 archived narrative §s (Phase 4.3 + Phase 5.1 archive already received).
  </action>
  <verify>
    <automated>grep -c "Phase 5.2" .planning/RETROSPECTIVE.md | awk '{print ($1 >= 5) ? "PASS" : "FAIL"}'</automated>
  </verify>
  <done>
    - RETROSPECTIVE.md +60-100L Phase 5.2 7-section retrospective
    - Cross-milestone v0.5.0 close-prep trends section appended
    - Phase 4.3 + Phase 5.1 archived narratives preserved (T0.1 work intact)
  </done>
</task>

<task type="auto">
  <name>Task T2.11: MODIFY .planning/ROADMAP.md — Phase 5.2 ✅ SHIPPED literal + v0.5.0 1/3 → 2/3</name>
  <files>.planning/ROADMAP.md</files>
  <action>
    Sister L267-272 v0.5.0 Phase 5.1 SHIPPED literal cadence延袭:

    1. **L267 Phase 5.1 row**: already shipped — verify present
    2. **L270 Phase 5.2 row**: Update `**Phase 5.2: R10.3 uninstall + R10.4 path traversal hardening** (1 day target)` → add `**Phase 5.2** ✅ **SHIPPED 2026-05-20** — R10.3 uninstall 14th CLI subcommand + 7 per-method uninstaller + R10.4 src/manifest/lib/path-guard.ts 5 OWASP A1 vector + ADR 0022 + ci.yml A7 0021→0022 + W0 sub-batch #BH validateFlags + #BI runOrPreview dedup; tests 733+→750+ (+17 R10.3+R10.4 cells); 22 ADR + 19 baseline tag accumulate; v0.5.0-alpha.2-uninstall-security dual tag LOCAL CREATE` literal cadence
    3. **v0.5.0 chapter status line** (L242 area): `1/3 STARTING` → `2/3 PROGRESS`
    4. **Phase 5.3 row**: Update next phase pointer to Phase 5.3 close

    **Sneak-block**: MUST match exact format of L130 v0.3.0 + L185 v0.4.0 SHIPPED literal cadence (verbatim sister precedent); MUST NOT mark v0.5.0 close (留 Phase 5.3); MUST update tag count + ADR count.
  </action>
  <verify>
    <automated>grep -E "Phase 5\.2.*SHIPPED" .planning/ROADMAP.md</automated>
  </verify>
  <done>
    - ROADMAP.md Phase 5.2 ✅ SHIPPED literal added
    - v0.5.0 chapter status 1/3 → 2/3 PROGRESS
    - Phase 5.3 row updated next-phase pointer
  </done>
</task>

<task type="auto">
  <name>Task T2.12: MODIFY PROJECT-SPEC.md + README.md — L3 / L9 status freshness Phase 5.2 SHIPPED</name>
  <files>PROJECT-SPEC.md, README.md</files>
  <action>
    Sister Phase 5.1 W2 T2.13+T2.14 FRONT_MATTER_DOCS transparency gate pattern延袭:

    **PROJECT-SPEC.md L3**: Update Status header `Phase 5.1 SHIPPED` → `Phase 5.1 + 5.2 SHIPPED 2026-05-19/20` (or whatever current literal — match sister cadence verbatim)

    **README.md L9**: Status freshness add Phase 5.2 literal; Phase 5.2 row append to shipped phase list (if user-facing summary exists L46-48)

    **Sneak-block**: MUST match exact format of sister Phase 5.1 T2.13+T2.14 edits (verbatim sister precedent); README is for users — keep dev status terse per L52-54 STATE.md note "README is for users dev status doesn't belong"; if README has no dev status section, SKIP README dev status update + only update L9 Status freshness header.
  </action>
  <verify>
    <automated>grep -c "Phase 5.2" PROJECT-SPEC.md README.md</automated>
  </verify>
  <done>
    - PROJECT-SPEC.md L3 Status updated
    - README.md L9 Status freshness updated (and shipped phase row if applicable)
  </done>
</task>

<task type="auto">
  <name>Task T2.13: NEW .planning/phase-5.2/DOGFOOD-T2.X.md (W2 final 3-axis empirical evidence)</name>
  <files>.planning/phase-5.2/DOGFOOD-T2.X.md</files>
  <action>
    Sister Phase 5.1 DOGFOOD-T2.X.md 60L format 100% reuse adapted W2 R10.3+R10.4+ship scope (~60-80L):

    **Axis A — R10.3 verify**:
    - `wc -l src/uninstallers/*.ts src/cli/uninstall.ts` each ≤200L Karpathy
    - `corepack pnpm test -- tests/cli/uninstall.test.ts --run` ≥10 cells PASS
    - Manual smoke: `harnessed uninstall <test-manifest>` dry-run preview + `--apply` ephemeral warn + `--apply` git-clone fs.rm verify
    - Path traversal smoke: `harnessed uninstall '../../etc/passwd' --apply` → exit 1 + generic message NO path echo

    **Axis B — R10.4 verify**:
    - `wc -l src/manifest/lib/path-guard.ts` ≤50L Karpathy
    - `corepack pnpm test -- tests/manifest/path-guard.test.ts --run` 7+ cells PASS
    - 5 attack vector reject simulation manual (Unix + Win + null + URL + double-encoded) via `harnessed install '<attack-vector>'` each exit 1
    - Safe path passthrough: `harnessed install 'manifests/tools/ctx7.yaml'` → no guard throw (proceeds to manifest read)
    - D-04 site verification: `grep -c "guardPath" src/manifest/aliases.ts src/cli/install.ts src/cli/uninstall.ts` ≥ 4 hits total
    - D-08 message verify: pull stderr from path traversal smoke + verify "path traversal attempt detected" only (NO `../../etc/passwd` substring)

    **Axis C — Ship cadence verify**:
    - ADR 0022: `wc -l docs/adr/0022-uninstall-and-path-traversal.md` 140-200L + 9 sections present
    - ci.yml A7 iter: `grep -c "0022" .github/workflows/ci.yml` ≥ 4 hits (step name + 2 for loops + echo)
    - A7 守恒: `git diff $(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0021-state-lock-and-audit-consumer.md | tail -1)..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/002[01]-*.md | wc -l` == 0 (ADR 0001-0021 main body 0 diff)
    - CHANGELOG.md v0.5.0-alpha.2 entry: `grep -c "0.5.0-alpha.2" CHANGELOG.md` ≥ 1
    - W0 sub-batch dedup: `grep -lE "if \(raw\.nonInteractive && !raw\.apply" src/cli/*.ts` returns 0 (or 1 if manifest-add kept inline per T0.3 caveat)
    - LOCAL tags ready for T2.15: verify NO push via `git ls-remote origin refs/tags/adr-0022-accepted refs/tags/v0.5.0-alpha.2-uninstall-security` returns empty

    **Sneak-block**: MUST include all 3 axes verbatim per sister format; MUST verify D-08 message generic (CSO defense); MUST verify A7 守恒 (`wc -l` == 0); MUST verify NO push (CLAUDE.md commit safety).
  </action>
  <verify>
    <automated>wc -l .planning/phase-5.2/DOGFOOD-T2.X.md | awk '{print ($1 >= 60) ? "PASS" : "FAIL"}'</automated>
  </verify>
  <done>
    - DOGFOOD-T2.X.md NEW 60-80L
    - 3 axes (R10.3 + R10.4 + ship) all PASS
    - A7 守恒 verified (`wc -l` == 0)
    - NO push verified (LOCAL CREATE only)
  </done>
</task>

<task type="auto">
  <name>Task T2.14: LOCAL CREATE adr-0022-accepted + v0.5.0-alpha.2-uninstall-security dual tag + final ship verify</name>
  <files>(git tags — NOT files; STRICT ordering enforcement per STRIDE D mitigation)</files>
  <action>
    LOCAL CREATE only per CLAUDE.md commit safety (sister Phase 5.1 W2 T2.16 cadence延袭) — NEVER `git push --tags` without user explicit approval.

    **STRICT ordering enforce** (sister Phase 5.1 STRIDE D mitigation):
    1. **PREREQ**: T2.7 ci.yml A7 iter commit + push已 done (this commit must exist BEFORE tag creation)
    2. **PREREQ**: T2.5 ADR 0022 file commit已 done (find ADR 0022 initial commit hash via `git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0022-uninstall-and-path-traversal.md | tail -1`)

    **Tag creation commands**:
    ```bash
    # Find ADR 0022 initial commit hash
    ADR_HASH=$(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0022-uninstall-and-path-traversal.md | tail -1)

    # LOCAL CREATE adr-0022-accepted (annotated tag pinned to ADR initial commit)
    git tag -a adr-0022-accepted "$ADR_HASH" -m "Phase 5.2 W2 T2.5 — ADR 0022 R10.3 uninstall + R10.4 path traversal hardening accepted"

    # LOCAL CREATE v0.5.0-alpha.2-uninstall-security (annotated tag pinned to Phase 5.2 ship HEAD)
    git tag -a v0.5.0-alpha.2-uninstall-security HEAD -m "Phase 5.2 ship — R10.3 uninstall + R10.4 path traversal hardening; v0.5.0 milestone 2/3 PROGRESS"

    # VERIFY NO push
    git ls-remote origin refs/tags/adr-0022-accepted refs/tags/v0.5.0-alpha.2-uninstall-security
    # Expected: empty output (tags NOT pushed)

    # Final ship gate: full test suite + biome + tsc + build
    corepack pnpm test && pnpm exec biome check src/ tests/ && pnpm exec tsc --noEmit && pnpm build
    # Expected: all exit 0
    ```

    **Push-safety verify**: `git ls-remote origin refs/tags/v0.5.0-alpha.2-uninstall-security` returns empty (verify NO push per CLAUDE.md commit safety + STRIDE R mitigation).

    **Sneak-block**: MUST NOT push tags (CLAUDE.md commit safety NEVER push without user approval); MUST pin adr-0022-accepted to ADR initial commit hash NOT HEAD (sister Phase 4.3 ship intent reconstruction precedent — adr-0021-accepted pinned to ADR 0021 initial commit per Phase 5.1 ship); MUST NOT create 🎯 v0.5.0 milestone tag (留 Phase 5.3 close per M-01 sneak-block + ROADMAP v0.5.0 3-phase split).
  </action>
  <verify>
    <automated>git tag -l "adr-0022-accepted" "v0.5.0-alpha.2-uninstall-security" | wc -l && git ls-remote origin refs/tags/v0.5.0-alpha.2-uninstall-security | wc -l</automated>
  </verify>
  <done>
    - adr-0022-accepted tag LOCAL CREATE (pinned to ADR 0022 initial commit hash)
    - v0.5.0-alpha.2-uninstall-security tag LOCAL CREATE (pinned to Phase 5.2 ship HEAD)
    - Both tags NOT pushed (LOCAL only per CLAUDE.md commit safety)
    - Full test suite 750+ green; biome + tsc + build exit 0
    - Phase 5.2 SHIPPED — ready for user push approval
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI flag → uninstaller dispatch | User-controlled `<name>` argument crosses into manifest path resolve + fs operations |
| Manifest yaml → uninstaller spawn | Manifest cmd field parsed for extractCloneTarget + extractSkillName + ephemeral detect; spawned to OS |
| Aliases.yaml → resolveAlias redirect | User-installable alias entries could contain crafted redirect values |
| Settings.json read/parse → ccHookAdd uninstaller | ~/.claude/settings.json parsed for filter-out matching entry |

## STRIDE Threat Register

(See `threats_open:` frontmatter section above for complete STRIDE register — 9 threats covering A1/A2 CC CLI syntax + fs.rm Win + path-guard regex bypass + extractCloneTarget drift + D-08 trade-off + --yes UX + W0 #BH blast radius + ci.yml A7 ordering + dual tag premature push)
</threat_model>

<verification>
**Phase-level acceptance** (sister Phase 5.1 verification block延袭):

1. **R10.3 verbatim acceptance** per ROADMAP L260-261 + REQUIREMENTS R10.3 L406:
   - `harnessed uninstall <manifest-name>` 反向 install method 撤销 install artifact (7 methods):
     - npm-cli → `npm uninstall <pkg>` (OR D-02 ephemeral exit 0 + warn)
     - mcp-stdio-add + mcp-http-add → `claude mcp remove <name> --scope project`
     - cc-plugin-marketplace → `claude plugin uninstall <plugin>@<marketplace>`
     - git-clone-with-setup → `fs.rm(target, { recursive: true, force: true })` cross-OS
     - npx-skill-installer → `fs.rm(~/.claude/skills/<name>, { recursive: true, force: true })`
     - cc-hook-add → reverse JSON deep-merge from `~/.claude/settings.json`
   - dry-run preview 默认 (D-05) + `--apply` 显式 + `--yes` bypass CI (D-06) + NO --keep-backup (D-07; use `harnessed backup`)

2. **R10.4 verbatim acceptance** per ROADMAP L262 + REQUIREMENTS R10.4 L407:
   - `resolveAlias` + manifest path 通过 regex hardening
   - `tests/manifest/path-guard.test.ts` 5+ attack vectors verify each → throws PathTraversalError:
     - `../../etc/passwd` (Unix) ✓
     - `..\\..\\windows\\system32` (Win) ✓
     - null bytes `path\x00attack` ✓
     - URL-encoded `%2e%2e%2fetc` ✓
     - Double-encoded `%252e%252e%252f` ✓
   - D-08: error.message === 'path traversal attempt detected' (NO user input echo back)

3. **CI all green** Win+Linux+macOS:
   - `corepack pnpm test` 750+ tests green (733+ baseline + R10.3 + R10.4 cells)
   - `pnpm exec biome check` exit 0
   - `pnpm exec tsc --noEmit` exit 0
   - `pnpm build` exit 0
   - ci.yml A7 step "ADR 0001-0022 main body 守恒" passes (0001-0021 main body 0 diff + 0022 file exists + adr-0022-accepted tag exists OR warning-skip)

4. **Ship cadence verification** (M-01 ARCHITECTURAL):
   - ADR 0022 NEW 9-section format
   - docs/adr/README.md +1 row 0022
   - ci.yml A7 iter 0021→0022 (4 surgical edits + STRICT ordering)
   - CHANGELOG.md v0.5.0-alpha.2 entry
   - STATE.md + RETROSPECTIVE.md + ROADMAP.md + PROJECT-SPEC.md + README.md status freshness
   - DOGFOOD-T1.X.md + DOGFOOD-T2.X.md 3-axis empirical evidence each
   - LOCAL CREATE adr-0022-accepted + v0.5.0-alpha.2-uninstall-security dual tag (NO push)
</verification>

<success_criteria>
Phase 5.2 SHIPPED when:

- [ ] W0 cadence T0.1+T0.2+T0.3+T0.4: D2 iter 6 REINFORCE trim Phase 4.3+5.1 narrative archive; SIZE_LIMIT 165→? round 3 decision per #BA tree; sub-batch #BH validateFlags + #BI runOrPreview extract; baseline gate green
- [ ] W1 R10.3 T1.0+T1.1+T1.2+T1.3+T1.4: PREREQ CC CLI A1/A2 verify; types.ts + index.ts dispatch; 7 uninstaller files ≤45L each; cli/uninstall.ts ≤200L + cli.ts 14th register + tests/cli/uninstall.test.ts ≥10 cells PASS; DOGFOOD-T1.X.md mid-wave
- [ ] W2 R10.4 + ship T2.1-T2.14: path-guard.ts ≤50L + tests 7-9 cells PASS; 4 D-04 hardening sites (aliases + install + uninstall + audit-log conditional); ADR 0022 PRIMARY 9-section ≤200L; docs/adr/README.md +1 row; ci.yml A7 iter 0021→0022; CHANGELOG v0.5.0-alpha.2; STATE+RETROSPECTIVE+ROADMAP+PROJECT-SPEC+README updates; DOGFOOD-T2.X.md final; LOCAL CREATE dual tag (NO push)
- [ ] 750+ tests green Win+Linux+macOS CI
- [ ] All 8 D-decisions + M-01 LOCKED 0 sneak (CONTEXT verbatim implemented)
- [ ] ADR 0001-0021 main body 0 diff verified (A7 守恒 invariant)
- [ ] User push approval pending — adr-0022-accepted + v0.5.0-alpha.2-uninstall-security tag LOCAL CREATE ready
</success_criteria>

<output>
After Phase 5.2 ship completion:

1. Final commit: `docs(phase-5.2-w2-ship): T2.X — Phase 5.2 ✅ SHIPPED R10.3 uninstall + R10.4 path-guard + ADR 0022 + ci.yml A7 0021→0022 + dual tag LOCAL CREATE (sister Phase 5.1 ship cadence延袭)`

2. Create `.planning/phase-5.2/SUMMARY.md` (or `5.2-SUMMARY.md` per project convention) — sister Phase 5.1 SUMMARY format延袭

3. Notify user: Phase 5.2 SHIPPED; tags adr-0022-accepted + v0.5.0-alpha.2-uninstall-security LOCAL CREATE pending user push approval per CLAUDE.md commit safety

4. Next entry: Phase 5.3 close prep — v0.5.0 milestone close + 🎯 v1.0 GA target (3-file archive triplet `.planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` sister v0.3.0+v0.4.0 close cadence延袭)
</output>
