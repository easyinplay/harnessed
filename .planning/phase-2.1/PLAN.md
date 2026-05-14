# Phase 2.1 PLAN — 4 installer methods 实装

> **Authored**: 2026-05-15 (Wave B — main agent direct-write per anti-stall protocol)
> **依赖**: KICKOFF.md / 2.1-CONTEXT.md / PATTERNS.md / RESEARCH.md / ASSUMPTIONS.md
> **风格沿袭**: phase 1.5 PLAN.md 8 段结构

---

## § 1 Goal & Scope

### 1.1 Goal

把 v0.1.0 的 4 个 placeholder installer 实装为 runtime-ready,遵守 ADR 0004 6 契约;外加 Wave 0 任务批清 phase 1.5 sister review deferred(H3/H4/M1 + transparency checklist)+ research refinement schema 前置(license whitelist / bundle-install / install_type enforcement)+ 起草 ADR 0010。

ship 后 **6 install method 全覆盖**(npm-cli + mcp-stdio-add 已 ship + 本 phase 4 个)。

### 1.2 In Scope(E1-E8 — 详 ASSUMPTIONS § A)

- **E1**: `docs/adr/0010-installer-schema-extension-errata.md`(≥100L 6-section)
- **E2**: license whitelist(MIT-0 + anthropics-official + license_source)+ bundle-install `provides:` 字段 + install_type enforcement + decision_rules.yaml `warn:` 移除 + schema unit tests
- **E3**: `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + ci.yml step + M1 SAMPLES § 8.4
- **E4**: `src/installers/mcpHttpAdd.ts` + unit test
- **E5**: `src/installers/gitCloneWithSetup.ts` + unit test
- **E6**: `src/installers/ccPluginMarketplace.ts` + unit test
- **E7**: `src/installers/npxSkillInstaller.ts` + unit test
- **E8**: dispatch table 6 method 全覆盖 + contract test 全套 + CI 三平台全绿 + adr-0010-accepted tag + ci.yml A7 iter 1-9→1-10

### 1.3 Out of Scope（推后续 phase — 详 KICKOFF § 1.3）

| 项 | 推迟到 |
|----|-------|
| npx-skill-installer 完整目录桥接(SessionStart sync-hook) | 后续 phase(D-02) |
| Claude Agent SDK + ralph-wiggum keep-vs-switch + ADR 0011 | Phase 2.2(D-08) |
| execute-task workflow + ralph-loop full integration | Phase 2.2 |
| `decision_rules.yaml` bundle-routing(`anthropics-skills-pptx` → bundle 解析) | Phase 2.3(D2.1-3) |
| design/content/testing extension category 实装 | Phase 2.3 |

---

## § 2 Wave 拓扑

```
Wave 0 — sister review 结清 + schema 前置 + ADR 0010 (E1+E2+E3)  [T1.1~T1.8]
  ├─ T1.1 ADR 0010 draft
  ├─ T1.2 license whitelist + license_source     ┐
  ├─ T1.3 bundle-install `provides:` 字段          ├─ schema (E2)
  ├─ T1.4 install_type enforcement                │
  ├─ T1.5 decision_rules.yaml `warn:` 移除         │
  ├─ T1.6 schema unit tests                       ┘
  ├─ T1.7 transparency checklist + CI gate + ci.yml step  ┐ (E3)
  └─ T1.8 M1 SAMPLES § 8.4 miss 身份标注                    ┘
       ↓ (Wave 0 全完成 — license/bundle/checkCmdString 是 installer 前置)
Wave 1 — mcp-http-add (E4)              [T2.1 installer + T2.2 unit test]   ← 最先,mcpStdioAdd proven sibling
       ↓
Wave 2 — git-clone-with-setup (E5)      [T3.1 installer + T3.2 unit test]   ← ui-ux-pro-max.yaml 已是真实 manifest
       ↓
Wave 3 — cc-plugin-marketplace (E6)     [T4.1 installer + T4.2 unit test]   ← CC 非交互 CLI 已解锁
       ↓
Wave 4 — npx-skill-installer (E7)       [T5.1 installer + T5.2 unit test]   ← soft-defer 候选,minimal-pin
       ↓
Wave 5 — tests + ship (E8)              [T6.1~T6.6]
  ├─ T6.1 dispatch table 6 method 全覆盖
  ├─ T6.2 installer-contract.test.ts extend(4 新 installer)
  ├─ T6.3 ci.yml A7 step iter 1-9→1-10
  ├─ T6.4 CI 三平台全绿 verify + push
  ├─ T6.5 progress.md + STATE.md update + adr-0010-accepted tag
  └─ T6.6 VERIFICATION.md (≥120L)
```

Wave 0 必须最先 — license whitelist(T1.2)是 cc-plugin/extension 候选前置;bundle-install `provides:`(T1.3)是 document-skills 前置;`--header` env-resolution approach(T1.1 ADR 记 D-16)是 mcp-http-add 前置。Wave 1-4 顺序严格(D-10 低风险优先,每 wave 依赖前 wave 的 lib helper 复用验证)。

---

## § 3 任务表（22 atomic 子任务 — 详 task_plan.md 各 task 验收 / 决策来源）

| Wave | Task | 文件 | 决策来源 |
|------|------|------|---------|
| 0 | T1.1 | `docs/adr/0010-installer-schema-extension-errata.md` | E1 + D-04 + D-08 + D-09 + D-16 + H3 + H4 + ADR 0008/0009 errata 风格 |
| 0 | T1.2 | `src/manifest/schema/spec.ts`(或 metadata 子 schema)— license whitelist + license_source | E2 + D-03 + D-04 + D-05 + D-18 + PATTERNS § 3.1/3.2 |
| 0 | T1.3 | `src/manifest/schema/spec.ts` — bundle-install `provides:` 字段 | E2 + D2.1-1 + D2.1-2 + PATTERNS § 3.3 |
| 0 | T1.4 | install_type enforcement(validate 层 cross-field check) | E2 + PATTERNS § 3.4 + ADR 0007 1:N 闭合 |
| 0 | T1.5 | `routing/decision_rules.yaml` — `chinese-content-deck` rule 去 `warn:` | E2 + D-05 |
| 0 | T1.6 | `tests/unit/manifest-validate.*.test.ts` 扩展 | E2 + Pattern J |
| 0 | T1.7 | `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + `.github/workflows/ci.yml` step | E3 + D2.1-7 + D2.1-8 |
| 0 | T1.8 | `.planning/phase-1.4/SAMPLES.md` § 8.4 — M1 2/30 miss 身份标注 | E3 + M1 |
| 1 | T2.1 | `src/installers/mcpHttpAdd.ts` | E4 + D-12 + D-16 + PATTERNS § 2 mcpHttpAdd(~85% clone) |
| 1 | T2.2 | `tests/unit/installers-mcpHttpAdd.test.ts` | E4 + Pattern K |
| 2 | T3.1 | `src/installers/gitCloneWithSetup.ts` | E5 + D-13 + D-15 + PATTERNS § 2 gitCloneWithSetup(~55%) |
| 2 | T3.2 | `tests/unit/installers-gitCloneWithSetup.test.ts` | E5 + Pattern K |
| 3 | T4.1 | `src/installers/ccPluginMarketplace.ts` | E6 + D-11 + D-20 + PATTERNS § 2 ccPluginMarketplace(~65%) |
| 3 | T4.2 | `tests/unit/installers-ccPluginMarketplace.test.ts` | E6 + Pattern K |
| 4 | T5.1 | `src/installers/npxSkillInstaller.ts` | E7 + D-01 + D-02 + D2.1-4 + D2.1-5 + D2.1-6 + PATTERNS § 2 npxSkillInstaller(~50%) |
| 4 | T5.2 | `tests/unit/installers-npxSkillInstaller.test.ts` | E7 + Pattern K |
| 5 | T6.1 | `src/installers/index.ts` — dispatch table 6 method 全覆盖 | E8 + PATTERNS § 4 |
| 5 | T6.2 | `tests/integration/installer-contract.test.ts` 扩展(4 新 installer) | E8 + ADR 0004 6 契约 |
| 5 | T6.3 | `.github/workflows/ci.yml` — A7 step iter 1-9 → 1-10 | E8 + D-09 + A7 守恒 |
| 5 | T6.4 | CI 三平台全绿 verify + push origin | E8 |
| 5 | T6.5 | `.planning/STATE.md` + `progress.md` 更新 + `adr-0010-accepted` tag | E8 + D-09 |
| 5 | T6.6 | `.planning/phase-2.1/VERIFICATION.md`(≥120L) | E1-E8 复现命令 + phase 2.2/2.3 prereq |

---

## § 4 接口契约（phase 2.2/2.3 prereq）

phase 2.1 ship 后 frozen 接口:

1. **6 install method dispatch table** — `installers: Record<method, Installer>`(`src/installers/index.ts`)6 method 全 runtime-ready(npm-cli / mcp-stdio-add / mcp-http-add / git-clone-with-setup / cc-plugin-marketplace / npx-skill-installer);`phase21Placeholder` const 删除
2. **`provides: ProvidedUnit[]` schema 字段**(`src/manifest/schema/spec.ts`)— optional 顶层 array,`{ id, component_type }`,`minItems: 2`;phase 2.3 写 document-skills manifest 直接消费
3. **`license_source` audit 字段** — optional enum(README/registry/none/anthropics-official);phase 2.3 extension manifest license 来源审计
4. **license whitelist 扩展** — `MIT-0` + `anthropics-official` 已在白名单;phase 2.3 anthropics/skills 来源 candidate 直接过
5. **install_type enforcement** — `install_type` ↔ `install.method` 1:N 闭合 cross-field check;phase 2.3 manifest 写入时强制
6. **transparency verdict-marker 约定** — `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 定义 `Verdict:`/`状态:`/`Closure:` 行须带 `N/N` + miss 声明;CI gate 强制;phase 2.2+ 所有 verify/audit 文档遵守
7. **4 个 installer module** — `mcpHttpAdd` / `gitCloneWithSetup` / `ccPluginMarketplace` / `npxSkillInstaller` 各 export 1 `Installer`;phase 2.3 extension category 复用

---

## § 5 风险登记（R1-R6 — 详 ASSUMPTIONS § C）

| ID | 风险 | 等级 | mitigation |
|----|------|------|-----------|
| R1 | cc-plugin `marketplace add` 重复注册行为未文档化 | 🟡 P1 | D-20 非致命 IF install 成功;T4.1 实测确认 |
| R2 | `--header` `${ENV_VAR}` 撞 checkCmdString false-positive | 🟡 P1 | D-16(a) arg 构造前 resolve env,B1 gate 零改动 |
| R3 | npx `~/.agents/` vs `~/.claude/skills/` 目录冲突 | 🟡 P1 | D2.1-5 `--copy` 强制;D2.1-6 real-path verify;known limitation 记 progress.md |
| R4 | win32 git-clone `rm -rf`/`cp -R` 需 Git Bash | 🟢 P2 | D-13 phase 1.3 已实测;`preflight` 已检 Win bash flavor |
| R5 | transparency CI gate 误伤正常 prose | 🟡 P1 | D2.1-8 只扫 marker 行 + 限定 3 类 verdict 文档 glob |
| R6 | `skills` npm 版本移动快 | 🟢 P2 | D2.1-4 pin `skills@1.5.7`;T5.1 启动前若距 research >2 周复核 |

---

## § 6 接受标准（goal-backward verify）— E1-E8 复现命令

```bash
# E1 — ADR 0010 draft
wc -l docs/adr/0010-installer-schema-extension-errata.md           # ≥ 100
grep -c "## " docs/adr/0010-installer-schema-extension-errata.md   # ≥ 6 (6-section)
grep -c "license_source\|provides\|H3\|H4\|--header" docs/adr/0010-installer-schema-extension-errata.md  # ≥ 5

# E2 — license whitelist + bundle-install + install_type + decision_rules
grep -c "MIT-0\|anthropics-official" src/manifest/schema/*.ts      # ≥ 2
grep -c "license_source" src/manifest/schema/*.ts                  # ≥ 1
grep -c "provides" src/manifest/schema/spec.ts                     # ≥ 1
grep -c "warn:" routing/decision_rules.yaml                        # chinese-content-deck rule 的 warn 已移除 (count 减 1)
corepack pnpm test -- tests/unit/manifest-validate                 # schema unit tests 全绿

# E3 — transparency checklist + CI gate + M1
wc -l docs/TRANSPARENCY-VERDICT-CHECKLIST.md                       # ≥ 40
test -f scripts/check-transparency-verdicts.mjs && echo OK
grep -c "check-transparency-verdicts" .github/workflows/ci.yml     # ≥ 1
grep -c "miss" .planning/phase-1.4/SAMPLES.md                      # § 8.4 含 2/30 miss 身份

# E4-E7 — 4 installer 实装
for f in mcpHttpAdd gitCloneWithSetup ccPluginMarketplace npxSkillInstaller; do
  test -f "src/installers/${f}.ts" && echo "${f} OK"
  test -f "tests/unit/installers-${f}.test.ts" && echo "${f} test OK"
done
corepack pnpm typecheck                                            # 通过

# E8 — dispatch table + contract test + CI + tag
grep -c "phase21Placeholder" src/installers/index.ts               # = 0 (删除)
grep -c "Installer" src/installers/index.ts                        # 6 method 全 import
corepack pnpm test                                                 # 三平台全绿基线 + 新增 cell
grep -c "for n in 0001" .github/workflows/ci.yml                   # A7 step 含 0010
git tag -l adr-0010-accepted                                       # 命中
gh run list --workflow ci.yml --limit 1                            # 三平台全 success
git diff adr-0001-accepted -- docs/adr/0001-*.md                   # 0 行 (A7 守恒)
```

---

## § 7 Wave Acceptance Checkpoint 表

| Wave | Acceptance | 触发条件 | Blocker 处理 |
|------|-----------|---------|-------------|
| 0 | ADR 0010 ≥100L 6-section + schema 4 项改动 typecheck 通过 + schema unit tests 全绿 + transparency CI gate 可运行 + M1 标注 | T1.1~T1.8 完成 | schema typecheck fail → revise;CI gate 误伤 → 收窄 marker glob(D2.1-8) |
| 1 | mcpHttpAdd.ts typecheck + unit test 全绿 + ADR 0004 6 契约遵守 | T2.1+T2.2 | `--header` env-resolution fail → revise D-16 approach |
| 2 | gitCloneWithSetup.ts typecheck + unit test + git rev-parse SHA verify inline | T3.1+T3.2 | SHA-match fail → revise verify step |
| 3 | ccPluginMarketplace.ts typecheck + unit test + two-step spawn | T4.1+T4.2 | marketplace add idempotency 异常 → D-20 fallback + 实测 |
| 4 | npxSkillInstaller.ts typecheck + unit test + real-path verify | T5.1+T5.2 | npx 版本漂移 → D2.1-4 复核 pin;目录冲突 → progress.md finding |
| 5 | dispatch table 6 method + contract test 全套 + CI 三平台全绿 + adr-0010-accepted tag + A7 iter 1-10 | T6.1~T6.6 | CI red → hotfix;tag push fail → retry |

---

## § 8 phase 2.1 vs phase 2.2/2.3 边界

| 维度 | phase 2.1（本 phase） | phase 2.2 | phase 2.3 |
|------|----------------------|-----------|-----------|
| installer | 4 placeholder 实装(6 method 全覆盖) | — | extension category 复用 4 installer |
| schema | license whitelist + bundle-install `provides:` + install_type enforcement | — | document-skills manifest 用 `provides:` |
| ADR | ADR 0010(schema errata) | ADR 0011(SDK + ralph-wiggum) | — |
| SDK | 不引入 | `@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE | — |
| sister review | Wave 0 清 phase 1.5 H3/H4/M1 + transparency checklist | — | — |
| routing | 仅 D-05 `chinese-content-deck` `warn:` 移除 | — | bundle-routing(`anthropics-skills-pptx` → bundle 解析) |
| extension | 只做 license whitelist 前置 | — | design/content/testing 真实候选实装 |

---

**phase 2.1 PLAN complete** — Wave C plan-checker verify entry。
