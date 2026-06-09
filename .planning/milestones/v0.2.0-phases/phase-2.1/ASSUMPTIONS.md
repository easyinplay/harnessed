# Phase 2.1 ASSUMPTIONS

> **Authored**: 2026-05-15 (Wave B — main agent direct-write per anti-stall protocol; gsd-planner socket-errored at 8 tool uses)
> **依赖**: KICKOFF.md / 2.1-CONTEXT.md / PATTERNS.md / RESEARCH.md
> **风格沿袭**: phase 1.5 ASSUMPTIONS.md 4 段结构(acceptance bar 状态 / 决策锁 / 风险 / References)

---

## § A — E1-E8 Acceptance Bar 状态

| AB | 内容 | task 覆盖 | 状态 |
|----|------|-----------|------|
| **E1** | ADR 0010 draft(≥100L 6-section errata)— license whitelist + bundle-install + install_type enforcement + H3 budget errata + H4 substring false-positive + D-16 --header env-resolution | T1.1 | Wave 0 |
| **E2** | Wave 0 schema — license whitelist(MIT-0 + anthropics-official + license_source 字段)+ bundle-install `provides:` 字段 + install_type enforcement + decision_rules.yaml `warn:` 移除 + schema unit tests | T1.2 + T1.3 + T1.4 + T1.5 + T1.6 | Wave 0 |
| **E3** | Wave 0 transparency — TRANSPARENCY-VERDICT-CHECKLIST.md + check-transparency-verdicts.mjs CI gate + ci.yml step + M1 SAMPLES § 8.4 标注 | T1.7 + T1.8 | Wave 0 |
| **E4** | mcp-http-add installer 实装(≈ mcpStdioAdd 85% clone)+ contract test | T2.1 + T2.2 | Wave 1 |
| **E5** | git-clone-with-setup installer 实装(npmCli orchestrator + git rev-parse SHA verify)+ contract test | T3.1 + T3.2 | Wave 2 |
| **E6** | cc-plugin-marketplace installer 实装(two-step spawn)+ contract test | T4.1 + T4.2 | Wave 3 |
| **E7** | npx-skill-installer installer 实装(minimal-pin skills@1.5.7)+ contract test | T5.1 + T5.2 | Wave 4 |
| **E8** | dispatch table 6 method 全覆盖 + contract test 全套 + CI 三平台全绿 + adr-0010-accepted tag + ci.yml A7 iter 1-9→1-10 | T6.1 ~ T6.6 | Wave 5 |

---

## § B — 决策锁(CONTEXT D-01~D-14 + PATTERNS D-15~D-21 + RESEARCH D2.1-1~D2.1-8 整合)

### B.1 从 discuss-phase 锁定(CONTEXT,不重新讨论)
- **D-01** npx-skill-installer = minimal-pin 一个工具实装
- **D-02** `~/.agents/` vs `~/.claude/skills/` 目录桥接推后续 phase;Phase 2.1 best-effort verify + 目录冲突记 progress.md finding
- **D-03** license whitelist 加 `anthropics-official` carve-out
- **D-04** `anthropics-official` 写 ADR 0010 § Decision + 加 `license_source` audit 字段
- **D-05** baoyu-skills MIT-0 — 加 MIT-0 到 whitelist + 去 decision_rules.yaml `chinese-content-deck` rule `warn:`
- **D-06** Wave 0 独立任务批,在 installer wave 之前
- **D-07** Wave 0 内容 7 项(H3/H4/M1 + transparency checklist + #8/#10/#11)
- **D-08** ADR 拆分:ADR 0010 = Phase 2.1 schema errata;ADR 0011 = Phase 2.2 SDK(推后)
- **D-09** ADR 0010 走 errata 路径;ship 时 adr-0010-accepted tag;CI A7 iter 1-9→1-10
- **D-10** 实装顺序 mcp-http-add → git-clone-with-setup → cc-plugin-marketplace → npx-skill-installer
- **D-11** cc-plugin-marketplace 已解锁(CC 非交互 CLI)
- **D-12** mcp-http-add hardcode `--scope project`(CC #54803 transport-agnostic)
- **D-13** git-clone-with-setup — ui-ux-pro-max.yaml 已是真实 manifest,win32 需 Git Bash
- **D-14** 4 installer 全遵守 ADR 0004 6 契约

### B.2 从 PATTERNS 锁定(D-15~D-21,RESEARCH 已 resolve 部分)
- **D-15** git-clone-with-setup `git rev-parse HEAD` SHA-match **inline 在 gitCloneWithSetup.ts**(≤10 行,单 caller,Karpathy YAGNI — 不建 lib/gitVerify.ts)。`git_ref` HEAD/main/master 拒绝已由 `preflight` 强制,复用不重建。
- **D-16** `--header` checkCmdString carve-out = **(a) resolve `${ENV_VAR}` before arg construction** — mcpHttpAdd.ts 读 `process.env` 解析 header 值,未设则 fail clear;B1 gate 保持纯净,checkCmdString.ts **零改动**。ADR 0010 § Decision 记此 approach。
- **D-17** bundle-install schema shape ← **RESOLVED by D2.1-1**(见 B.3)
- **D-18** license enum location — execute-phase T1.2 启动前 grep `src/manifest/schema/` 确认 license 枚举在 spec.ts 还是 metadata 子 schema;`Type.Union` 扩展 pattern 与位置无关
- **D-19** transparency verify checklist form ← **RESOLVED by D2.1-7/8**(见 B.3)
- **D-20** cc-plugin-marketplace idempotency = step-1 `marketplace add` 非零退出**视为非致命 IF** step-2 `plugin install` 成功(marketplace 已注册是 benign state);execute-phase 实测确认精确行为
- **D-21** npx-skill-installer tool pin ← **RESOLVED by D2.1-4**(见 B.3)

### B.3 从 RESEARCH 锁定(D2.1-1~D2.1-8,HIGH/HIGH/MEDIUM conf)
- **D2.1-1** bundle-install = 新 **optional** `provides: Type.Array({ id, component_type }, { minItems: 2, uniqueItems: true })` 顶层字段。`install`/`verify`/`uninstall` 保持 **singular**。纯 additive,A7' 8 支柱 safe,无 migration script。沿袭 phase 1.5 T5.5 `phase`/`triggers` additive 模式。(resolves D-17)
- **D2.1-2** bundle manifest 无新 `TypeEnum`/`ComponentType` 值 — 用现有 `type: 'cc-skill-pack'`,`provides[]` 枚举内容。
- **D2.1-3** `decision_rules.yaml` bundle-routing 编辑(`anthropics-skills-pptx` → bundle 解析)是 **Phase 2.3 NOT 2.1**。Phase 2.1 只 ship `provides` schema 字段 + tests。Phase 2.1 唯一 routing 编辑是 D-05 的 `chinese-content-deck` `warn:` 移除。
- **D2.1-4** npx-skill-installer pin **`skills@1.5.7`**(vercel-labs/skills,npm pkg `skills`,latest 2026-05-14)。版本 pin 保证 reproducibility(ADR 0007 `install_type: npx`)。(resolves D-21)
- **D2.1-5** install 命令:`npx --yes skills@1.5.7 add <owner/repo> --skill <name> --agent claude-code --copy --global --yes`。**`--copy` 强制** — 真实目录装到 `~/.claude/skills/<name>/`,无 `~/.agents/` symlink 依赖,绕开冲突(CONTEXT D-02 — 无 SessionStart sync-hook)。
- **D2.1-6** npx-skill-installer verify = `test -f ~/.claude/skills/<name>/SKILL.md` exit code(**NOT** npx exit code — C6 no-silent-failure)。目录冲突记 progress.md known limitation。
- **D2.1-7** transparency verify = **hybrid**:`docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 定义结构化 verdict-marker 约定(`Verdict:` / `状态:` 行须带 `N/N` ratio + miss 声明)+ **narrow** CI gate(`scripts/check-transparency-verdicts.mjs`)只扫 marker 行,bare claim 则 fail。(resolves D-19)
- **D2.1-8** CI gate scope 边界(只 marker 行非自由 prose)是 false-positive mitigation — 保持 narrow + documented。exact marker token + scanned globs 是 Wave B 决定:**marker token = `Verdict:` / `状态:` / `Closure:` 行首**;**scanned globs = `.planning/**/PLAN-CHECK.md` + `.planning/**/*-AUDIT.md` + `.planning/**/VERIFICATION.md`**(结构化 verdict 文档,非 prose-heavy 的 progress/CONTEXT)。

---

## § C — 风险登记 R1-R6

| ID | 风险 | 等级 | mitigation 一行 |
|----|------|------|----------------|
| R1 | cc-plugin-marketplace `marketplace add` 重复注册行为未文档化(research § 1 MEDIUM unknown) | 🟡 P1 | D-20 — 非零退出视为非致命 IF install 成功;execute-phase T4.1 实测确认 + 必要时 `claude plugin marketplace list` pre-check |
| R2 | `--header` `${ENV_VAR}` 撞 checkCmdString shell-escape false-positive | 🟡 P1 | D-16(a) — installer 在 arg 构造前 resolve env,B1 gate 零改动;未设环境变量 fail clear |
| R3 | npx-skill-installer `~/.agents/` vs `~/.claude/skills/` 目录冲突 | 🟡 P1 | D2.1-5 `--copy` flag 强制真实目录;D2.1-6 real-path verify;目录冲突 known limitation 记 progress.md(完整桥接 deferred) |
| R4 | win32 git-clone-with-setup `rm -rf`/`cp -R` pipeline 需 Git Bash | 🟢 P2 | D-13 — ui-ux-pro-max.yaml 已 phase 1.3 实测 PATH_A+B 双 OK;`preflight` 已检 Win bash flavor |
| R5 | transparency CI gate 误伤正常 prose | 🟡 P1 | D2.1-8 — gate 只扫结构化 marker 行(`Verdict:`/`状态:`/`Closure:` 行首)+ 限定 3 类 verdict 文档 glob,自由 prose 不匹配 |
| R6 | `skills` npm 版本移动快(latest 2026-05-14,research valid until ~2026-06-15) | 🟢 P2 | D2.1-4 pin `skills@1.5.7`;execute-phase 若距 research >2 周,T5.1 启动前 `npm view skills version` 复核 pin latest-stable |

---

## § D — References

- `.planning/phase-2.1/KICKOFF.md` — E1-E8 acceptance bars + Wave 拓扑 + hard constraints
- `.planning/phase-2.1/2.1-CONTEXT.md` — D-01~D-14 discuss-phase 决策
- `.planning/phase-2.1/PATTERNS.md` — file→analog 表 + D-15~D-21 + schema change patterns + dispatch extension
- `.planning/phase-2.1/RESEARCH.md` — D2.1-1~D2.1-8 + bundle-install/npx/transparency 3 topic
- `.planning/research/v0.2.0-installers.md` — 4 installer CLI/API 机制(HIGH conf 主依据)
- `docs/INSTALLER-CONTRACT.md` — ADR 0004 6 硬契约
- `docs/adr/0007-categorization-schema-extension.md` — install_type 字段(4 enum)
- `docs/adr/{0008,0009}-*.md` — errata 风格 reference
- `src/installers/{index,mcpStdioAdd,npmCli}.ts` — dispatch table + 2 working installer analog
- `src/manifest/schema/spec.ts` — TypeBox manifest schema
