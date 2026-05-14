# Phase 2.1 plan-phase — KICKOFF

> **Authored**: 2026-05-15
> **Phase**: v0.2.0 Phase 2.1 — 4 installer methods 实装
> **依赖**: `2.1-CONTEXT.md`(discuss-phase 4 灰色地带决策)+ `.planning/research/v0.2.0-{installers,extensions,SUMMARY}.md`(research refresh 已产出)
> **风格沿袭**: phase 1.5 plan-phase Wave 结构(KICKOFF → Wave A PATTERNS+RESEARCH → Wave B ASSUMPTIONS+PLAN+task_plan → Wave C PLAN-CHECK)

---

## § 1 Phase Goal & Scope

### 1.1 Goal

把 v0.1.0 的 4 个 placeholder installer(`mcp-http-add` / `git-clone-with-setup` / `cc-plugin-marketplace` / `npx-skill-installer`)实装为 runtime-ready,遵守 ADR 0004 的 6 个 installer 契约;**外加 Phase 2.1 Wave 0 任务批**清 phase 1.5 sister review deferred + research refinement schema 前置 + 起草 ADR 0010。

ship 后 **6 install method 全覆盖**(v0.1.0 已 ship npm-cli + mcp-stdio-add 2 个 + 本 phase 4 个)。

### 1.2 In Scope（8 acceptance bar E1-E8）

- **E1 — ADR 0010 draft**: `docs/adr/0010-installer-schema-extension-errata.md`(≥100L 6-section errata 沿袭 ADR 0008/0009 风格)— license whitelist 扩展 + bundle-install schema + install_type enforcement + H3 agentDefinition budget errata + H4 substring false-positive transparency
- **E2 — Wave 0 schema**: license whitelist 加 `MIT-0` + `anthropics-official` carve-out + `license_source` audit 字段(TypeBox spec.ts)+ manifest schema bundle-install 建模 + install_type enforcement + `routing/decision_rules.yaml` 去 `chinese-content-deck` rule 的 `warn:`(baoyu-skills MIT-0)+ schema unit tests
- **E3 — Wave 0 transparency**: transparency verify checklist 落地(markdown checklist 或轻量 CI gate — "CLOSED/100%/全绿" 须附 specific 数字 + miss 清单)+ M1 `.planning/phase-1.4/SAMPLES.md` v2 § 8.4 标注 2/30 miss 身份 + `checkCmdString` `${ENV_VAR}` false-positive carve-out(`mcp-http-add --header` 前置)
- **E4 — mcp-http-add**: `src/installers/mcpHttpAdd.ts`(≈ mcpStdioAdd 1:1 clone — `claude mcp add --transport http --scope project`)+ contract test
- **E5 — git-clone-with-setup**: `src/installers/gitCloneWithSetup.ts`(full-SHA pinned + B1 security gate + win32 Git Bash)+ contract test
- **E6 — cc-plugin-marketplace**: `src/installers/ccPluginMarketplace.ts`(`claude plugin marketplace add` + `claude plugin install <plugin>@<marketplace> --scope project` 非交互)+ contract test
- **E7 — npx-skill-installer**: `src/installers/npxSkillInstaller.ts`(minimal-pin 一个工具 + best-effort verify;目录冲突记 finding)+ contract test
- **E8 — ship**: `src/installers/index.ts` dispatch table 6 method 全覆盖 + CI 三平台全绿 + `adr-0010-accepted` tag + ci.yml A7 step iter 1-9 → 1-10 + ADR 0001-0009 main body 守恒

### 1.3 Out of Scope（推后续 phase）

| 项 | 推迟到 | Rationale |
|----|-------|-----------|
| npx-skill-installer 完整目录桥接(`~/.agents/` vs `~/.claude/skills/` SessionStart sync-hook) | 后续 phase | CONTEXT D-02 — Phase 2.1 只 minimal-pin + best-effort verify,目录桥接超 installer 范围 |
| Claude Agent SDK 引入 + ralph-wiggum keep-vs-switch + ADR 0011 | Phase 2.2 | CONTEXT D-08 |
| execute-task workflow + ralph-loop full integration | Phase 2.2 | ROADMAP v0.2.0 |
| design/content/testing extension category 实装 | Phase 2.3 | 本 phase 只做 license whitelist 前置,不做 extension 实装 |
| `--force` flag for idempotent_check | phase 2.1+ 评估 | v0.1 deferred,非本 phase 硬要求 |

---

## § 2 Wave 拓扑（预期 — Wave B planner 细化）

```
Wave 0 — sister review 结清 + schema 前置 + ADR 0010 draft (E1+E2+E3)
  ├─ ADR 0010 draft (E1)
  ├─ license whitelist + bundle-install + install_type schema (E2)
  └─ transparency checklist + M1 标注 + checkCmdString carve-out (E3)
       ↓
Wave 1-4 — installer 实装（低风险优先 — CONTEXT D-10）
  Wave 1: mcp-http-add (E4)        ← mcpStdioAdd proven sibling,最先建信心
  Wave 2: git-clone-with-setup (E5) ← ui-ux-pro-max.yaml 已是真实 manifest
  Wave 3: cc-plugin-marketplace (E6) ← CC 非交互 CLI 已解锁
  Wave 4: npx-skill-installer (E7)   ← soft-defer 候选,minimal-pin
       ↓
Wave 5 — tests + ship (E8)
  dispatch table 6 method 全覆盖 + contract test 全套 + CI 三平台 + adr-0010-accepted tag
```

Wave 0 必须最先 — license whitelist(E2)是 cc-plugin-marketplace/extension 候选前置;bundle-install schema(E2)是 document-skills 前置;checkCmdString carve-out(E3)是 mcp-http-add `--header` 前置。

---

## § 3 Hard Constraints（不可违反）

1. **A7 守恒** — ADR 0001-0009 main body 0 diff;ADR 0010 走 errata 路径(不动旧 ADR);`docs/INSTALLER-CONTRACT.md` + `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 不动(H3 走 ADR 0010 errata,不改 contract main body)
2. **ADR 0004 6 契约** — 每个 installer 必须遵守:dry-run default + diff + rollback + 4-Level confirm + MCP CLI-only + no-silent-failure;CI 有 contract test 自动化
3. **TypeBox not zod** — manifest schema 用 `@sinclair/typebox`,schema 改动(E2)用 `Type.*` 不是 `z.*`
4. **Karpathy simplicity** — installer 复用现有 7 个 lib helper;超 hard limit 才 spillover 到 `lib/`;不引入新 deps(4 个 installer 都用现有 `claude` CLI / `git` / `npx` — 无 npm dep 引入)
5. **A8 LF line endings** — 所有新文件 LF
6. **B1 security gate** — git-clone-with-setup 的 git_ref 必须 full-SHA pinned 过 phase 1.1.1 H7 `checkCmdString` shell-escape 过滤
7. **mcp scope hardcode** — mcp-http-add 同 mcp-stdio-add hardcode `--scope project`(CC #54803 user-scope bug transport-agnostic)
8. **transparency 反模式根治** — E3 的 verify checklist 是结构性根治,不是装饰;phase 1.4 T1 + phase 1.5 H1/M1 连续 2 phase 复发,reviewer 明确"否则 phase 2.0/2.x 还会复发第三次"

---

## § 4 Wave A 研究分工

research refresh(`v0.2.0-installers.md` HIGH conf)已覆盖 4 installer 的 CLI/API + headless + failure modes + ADR 0004 fit — **phase RESEARCH.md 不重做 installer 机制调研**,聚焦剩余不确定:

- **R1 (gsd-pattern-mapper → PATTERNS.md)**: 9-ish 新/改文件 → 现有 analog 映射。重点:4 个新 installer vs `npmCli.ts`/`mcpStdioAdd.ts` 复用度 + 7 个 lib helper 够不够用 + spec.ts TypeBox schema 改动 analog + dispatch table 扩展 pattern
- **R2 (gsd-phase-researcher → RESEARCH.md)**: 聚焦 3 项(installer 机制已由 v0.2.0-installers.md 覆盖,不重做):
  1. **bundle-install schema 建模** — document-skills 4-in-1,字段形态(`bundle:` 字段 vs `component_type: bundle` vs 其他)+ 现有 schema 怎么扩展最 surgical
  2. **npx-skill-installer 工具选型确认** — v0.2.0-installers.md 指向 vercel-labs/skills 为 de-facto,确认当前状态 + minimal-pin 的具体 install 命令
  3. **transparency verify checklist 落地形态** — markdown checklist(verify-phase 读)vs 轻量 CI grep gate,哪个更能结构性根治 + 怎么不误伤正常文本

---

## § 5 预算

- **plan-phase**: ~2-3h(Wave A 并行 R1+R2 ~45min / Wave B planner ~45min / Wave C plan-checker ~30min)
- **execute-phase**: ~6-10 工作日(Wave 0 schema 前置 ~1.5d / 4 installer 各 ~1-2d / Wave 5 tests+ship ~1d)
- 沿袭 phase 1.5 batch 节奏(PP cadence — push + 并行 batch executor)

---

## § 6 phase 2.1 vs phase 2.2/2.3 边界

| 维度 | phase 2.1（本 phase） | phase 2.2 | phase 2.3 |
|------|----------------------|-----------|-----------|
| installer | 4 placeholder 实装(6 method 全覆盖) | — | extension category 复用 installer |
| schema | license whitelist + bundle-install + install_type enforcement | — | — |
| ADR | ADR 0010(schema errata) | ADR 0011(SDK + ralph-wiggum) | — |
| SDK | 不引入 | `@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE | — |
| sister review | Wave 0 清 phase 1.5 H3/H4/M1 + transparency checklist | — | — |
| extension | 只做 license whitelist 前置 | — | design/content/testing 真实候选实装 |

---

**phase 2.1 KICKOFF complete** — Wave A(R1 PATTERNS + R2 RESEARCH 并行)启动准备。
