# harnessed

> **完整三层栈方法论的可执行 engine** — 6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 always-on / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
> 在装配主义 base 之上：不 vendor 上游代码，用 manifest 描述 install/check，用 composition skill 编排多上游工作流（详 [ADR 0006](./docs/adr/0006-architecture-wedge-revision-v3.md)）

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)

> **Status:** 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-16** (Phase 2.1+2.2+2.3+2.4) · **Phase 3.3 SHIPPED 2026-05-17** — aliases.yaml RICH 5-field redirect (D-01 schema 12th surface) + DOCTOR-ONLY-WARN install 安静 (D-02 1-line resolveAlias surgical + doctor 7th check 人读 audit) + known-good YAML manifest lazy-load 版本 lock (D-03 schema 13th surface) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 (b) LOCKED) + ADR 0016 9 章节 errata (v0.3.0 milestone 3/4) · **Phase 3.2 SHIPPED 2026-05-17** — gstack 前缀探测 PROBE + workflow JINJA `{{prefix}}` 插值 + plan-feature 5-phase WIRED reference + governance.json PUSH veto halt_workflow + ADR 0015 9 章节 errata (v0.3.0 milestone 2/4) · **Phase 3.1 SHIPPED 2026-05-16** — checkpoint 引擎 TEMPLATE 摘要 + archive 双轨 + harnessed resume 12th CLI + compact 75% placeholder + T4.4 closure infra activation 闭环 (D-04 WIRE-IN 实证) + ADR 0014 9 章节 errata accepted (v0.3.0 milestone 1/4 START). Next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控.

> Not affiliated with, endorsed by, or sponsored by Harness Inc.（见 [NOTICE](./NOTICE)）

## 一句话定位

别人造轮子（如 ECC 自家 30 agents/135 skills），我们做"指挥棒"——装配市面上最优秀的开源 Claude Code 生态组件，用强意见的 composition skill 织成统一工作流；上层把 CLAUDE.md 里写的"gstack 决策 → GSD 项目经理 → superpowers 资深工程师"三层栈方法论机器化为可执行 engine。

## 关键差异化

- **三层栈机器化**（[ADR 0006](./docs/adr/0006-architecture-wedge-revision-v3.md)）：gstack（决策层 / 6+ 虚拟角色 / 治理关卡） + GSD（项目经理 / phase orchestration / 状态持久化） + superpowers（资深工程师 / 子任务执行质量） + andrej-karpathy-skills（4 心法 always-on baseline） + mattpocock-skills（23 招式 by-phase routing） — 8 支柱 100% capture，把 CLAUDE.md 协作规则机器化为可执行 engine
- **不 vendor**（base layer）：上游代码不进我们仓库，靠 manifest 描述 install/check（schema v1 frozen — see [ADR 0001](./docs/adr/0001-manifest-schema-v1.md)；phase 1.3 加 categorization 3 字段 errata see [ADR 0007](./docs/adr/0007-categorization-schema-extension.md)）
- **Composition Skill**：自家 workflow skill 当指挥棒，调度多个上游协同（research / execute-task / plan-feature 三 MVP workflow）
- **包管理器思维**：`harnessed install <workflow>` 自动解析依赖图、`doctor` 健康检查、`install-base` 一键装齐 base profile（10 固定 manifest）
- **强意见 vs all-in-one**：用户面对 `/harnessed:*` 统一入口，不需学每家上游术语

## Repo Structure

```
harnessed/
├── manifests/           # 上游描述层（不 vendor）
│   ├── tools/          # cc-plugin / mcp-npm / cli-npm
│   └── skill-packs/    # cc-skill-pack
├── workflows/          # composition skill（指挥棒）
├── routing/            # B+C 混合路由 SSOT
├── config-templates/   # 配置注入层（hooks 等）
├── schemas/            # JSON Schema artifact (publish 给 IDE / CI)
├── src/                # TS 源码（installer / validator / router / checkpoint）
├── tests/              # vitest 单测 + 集成 + bench
└── docs/adr/           # 架构决策记录
```

## v0.2.0 状态

- **🎯 v0.1.0 MILESTONE 100% SHIPPED & ARCHIVED** ✅（6/6 phase；audit `passed` post-reconciliation；归档 `.planning/milestones/v0.1.0-{ROADMAP,REQUIREMENTS}.md`；git tag `v0.1.0`）
- **🎯 v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-16** ✅（Phase 2.1+2.2+2.3+2.4 = 4/4 完成；audit `passed` 13/13 requirements + 4/4 phases + 6/6 integration + 3/3 flows；归档 `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`；git tag `v0.2.0`；6 milestone tag 累积 v0.1.0 / alpha.1-installers / alpha.2-execute-task / alpha.3-extension-mvp / alpha.4-doctor / v0.2.0）
- **v0.3.0 MILESTONE 3/4 PROGRESS 2026-05-17** 🚀（Phase 3.1 + Phase 3.2 + Phase 3.3 SHIPPED；progress 13/17 = 76.5%；next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控）
- **Phase 3.3 shipped** ✅（aliases.yaml RICH 5-field redirect (D-01 schema 12th surface — redirect + reason ≤500 字 DOS cap + since_version semver + deprecation_date ISO-date pattern sister Phase 3.2 W2 Rule 1 lesson + removal_date Optional 长尾窗口) + DOCTOR-ONLY-WARN install 安静 (D-02 install.ts L74-77 1-line resolveAlias surgical pre-manifest-lookup; NO console.warn — sister Unix tool 习俗 ls/cp 不 warn argument aliases) + doctor 7th check checkDeprecations 人读 audit table (doctor.ts 184→195L ≤200L Karpathy clean + check-deprecations.ts 43L NEW helper sister Phase 3.2 W1 probe-gstack.ts 49L extract precedent) + versions/<harnessed-ver>-known-good.yaml YAML manifest lazy-load 版本 lock (D-03 schema 13th surface + knownGood.ts loader per-version Map memoize + install.ts --known-good flag lazy consume Karpathy YAGNI 0 cost when flag not used) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 (b) LOCKED; STATE.md L4 frontmatter + L5 最后更新 双删 5th and final recurrence of dual-SSOT 反模式; check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback +10L freshness gate extend) + Wave 0 backlog 3 项一次根治 (W0.1 STATE COLLAPSE + W0.2 dashboard-sse fix path (a) random ephemeral port DASHBOARD_PORT env injection sister Node net.createServer({port:0}) MDN std + W0.3 schemaVersion 12+13 surface manifest-domain colocation decision + T0.5 planFeature.v1 11th surface backfill sister Phase 3.2 W2 T2.2 b875e21 latent stale claim surgical fix); F1-F8 8/8 acceptance bar; ADR 0016 9 章节 errata accepted; 16 ADR + 16 baseline tag; 623→659+ tests (+36); 16+ atomic commits across W0-W2; schemaVersion 11→13 surface (aliases.v1 12th + known-good.v1 13th); manifest-domain schema colocation 3rd consumer 闭环 (checkpoint-domain Phase 3.1 + workflow-domain Phase 3.2 + manifest-domain Phase 3.3 cross-phase 模式延袭); v0.3.0 milestone 第 3 phase ship）
- **Phase 3.2 shipped** ✅（gstack 命令前缀探测 PROBE (doctor 6th check + 三选一 + fallback prompt; sister Phase 2.4 doctor `--json` CI-friendly) + workflow `invokes` JINJA `{{prefix}}` 模板替换 (zero npm dep + cross-OS + Karpathy YAGNI strict) + plan-feature 5-phase WIRED reference (workflow.run.ts ≤80L + 5 SKILL.md stubs mock + plan-feature/workflow.yaml DSL + activatePhase BEFORE isVetoed B-01 fix locked) + governance.json PUSH veto halt_workflow (gstack 写 harnessed 读 file-based zero coordination + sister Phase 3.1 file-based state machine 模式 + on_veto:halt_workflow workflow-level directive) + Wave 0 backlog 3 项一次根治 (W0.1 cli-audit env-dep CI red fix 解 Phase 3.1 deferred #1 + W0.2 STATE/README format normalize + ci.yml ENFORCE flip + W0.3 schema 9th+10th surface decision doc)；F1-F8 8/8 acceptance bar；ADR 0015 9 章节 errata accepted；15 ADR + 15 baseline tag；611→623+ tests (+12)；24+ atomic commits across W0-W3；schemaVersion 8→11 surface (config.v1 9th + governance.v1 10th + planFeature.v1 11th)；W-01 sister cli-doctor.test W-04 dead var pattern复用守 + W-02 PhasesSchema unconditional extend + W-03 path divergence doc + Rule 1 governance.v1 vetoed_at format→pattern (FormatRegistry latent W1 defect surgical fix)；v0.3.0 milestone 第 2 phase ship）
- **Phase 3.1 shipped** ✅（checkpoint 引擎 TEMPLATE 摘要 (zero LLM call, R7.2 验收 < 1k token 指向机械拼装) + archive 双轨 unbounded raw turn dump + `harnessed resume` 12th CLI subcommand (D-03 RELOAD + § 1.3 cwd guard + --json flag) + compact 75% threshold MVP placeholder (Phase 3.4 ships actual fold) + SIGINT trap Node native zero-dep + isShuttingDown guard + 30s timeout + T4.4 closure infra 三件套 1 milestone 闲置后**首消费者** activation 闭环 (D-04 WIRE-IN 实证 — Phase 2.2 ship `sdkSpawn.onSessionId` + `ralphLoopWrap.resumeSessionId` + `engine.wrappedSpawn capturedSessionId`) + W-01 engineHook.ts PRIMARY extract engine.ts ≤200L Karpathy clean restored + 0 `as any` cast (W-04 phaseId via TaskContext typed field) + Wave 0 backlog 4 项一次根治；F1-F8 8/8 acceptance bar；ADR 0014 9 章节 errata accepted；14 ADR + 14 baseline tag；543→596 tests (+53)；27+ atomic commits across W0-W5；schemaVersion 7-surface → 8-surface (currentWorkflow.v1)；v0.3.0 milestone 第 1 phase START）
- **Phase 2.4 shipped** ✅（doctor 完整版 MIN 5-check (Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL drift) + `--json` flag warn≠fail 策略；EE-4 plan-checker 4 维 SSOT 量化阈值 (file refs / reference sources / concrete acceptance / weasel words) walker 130L + RELAX 0.8/0.8/0.8/0；dashboard C 路径 3 子 FULL absorb (cc-hook-add 7th installer SessionStart 自挂 + SSE watcher localhost-only bind + multi-project registry `~/.claude/harnessed-projects.json`)；audit 完整版 runtime-layer 3 helper hard-fail (origin tamper + install.cmd shell-eval injection 精筛 + provenance gate)；ralph-loop Win sentinel 5 fixture + CI step；F1-F8 8/8；ADR 0013 9 章节 errata accepted；432→543 tests (+111 — 项目历史最大 phase delta：30 doctor fixture + 30 plan-checker fixture + 6 e2e cells)；13 ADR + 13 baseline tag iterate；`adr-0013-accepted` + `v0.2.0-alpha.4-doctor` + 🎯 `v0.2.0` milestone tag triple pushed；2 same-wave hotfix (W6 plan-checker-fixtures Win timeout 15s→30s + biome formatter 3-line)；W6 deferred-items #3 RESOLVED (EE-4 CI yaml step reorder 1-line dc4445f)；Phase 2.3 sister review backlog 5 项全 W0 一次根治）
- **Phase 2.3 shipped** ✅（extension category MVP design/content/testing + karpathy SKILL-ONLY 注入 + EE-5 5-question merge gate CLI + CD-3 显式职责负空间 `if_rejected_use:<id>` + 30/30 routing 100%；F1-F8 8/8；ADR 0012 9 章节 errata；M3 perf gate 终结 anti-pattern (移出 CI critical path → perf-bench.yml nightly cron)；T0.10 always_active spike FAIL → fallback path (description-keyword + self-reflexive prompt)；432→492 tests (+60)；`adr-0012-accepted` + `v0.2.0-alpha.3-extension-mvp` 双 tag pushed；DI-1 same-day hotfix karpathy-skills.yaml schema-compliant；3 sister review backlog absorb (STATE.md FRONT_MATTER_DOCS / dashboard cross-phase RETRO / ADR 0012 9 章节 fill)）
- **Phase 2.2 shipped** ✅（execute-task workflow + ralph-loop full SDK integration；SDK `@anthropic-ai/claude-agent-sdk@0.3.142` INTRODUCE + AgentDefinition 5-字段 SDK input + 9-字段 prompt-inject contract v1.2 reconcile；dual-signal completion 4-layer + per-phase model tier `[opus,sonnet,sonnet,haiku]` + schemaVersion 7-surface 单一兼容门 (CD-5) + provenance gate hard fail (CD-6) + transparency CI gate W3 ENFORCE=true；F1-F8 8/8；ADR 0011 9 章节 errata 合并；30/30 sample harness COMPLETE 100%；432+3 tests；`adr-0011-accepted` + `v0.2.0-alpha.2-execute-task` 双 tag pushed；CD-4 Task Session 复用 conditional → SC4 PARTIAL → T4.4 DEFERRED v0.3.0；EE-4 plan 4 维量化阈值 → DEFERRED Phase 2.4）
- **Phase 2.1 shipped** ✅（4 placeholder installer 实装 → 6 install method 全 runtime-ready + Wave 0 schema/sister-review/docs batch；E1-E8 8/8；ADR 0010 errata + `adr-0010-accepted` + `v0.2.0-alpha.1-installers` 双 tag pushed；374+3 tests；含 phase 2.1.1 hotfix CI lint `b9c932a`；**transparency 反模式 CI gate 结构性根治**：`check-transparency-verdicts.mjs` warn-only round 1 → phase 2.2 flip enforce）
- **Phase 1.5 shipped** ✅（DAG resolver Kahn 142L + Semantic Router L2 stub 81L + engineering 5 routing rules + mattpocock 23 招式 phase routing schema + ADR 0009 errata 4 items + `<promise>` XML wrapper + ralphLoop 65L→42L hard split）
- **Phase 1.4 shipped** ✅（routing engine v1 + AgentDefinition factory + research workflow E2E + 30 sample inline truth table + 291+2 tests + ADR 0008 errata）
- **Phase 1.3 shipped** ✅（categorization schema 3 字段 + decision_rules.yaml v1 12 rules + `harnessed install-base` 子命令 + 235 tests + ADR 0007 errata）
- **Phase 1.2.5 architecture revision shipped** ✅（[ADR 0006](./docs/adr/0006-architecture-wedge-revision-v3.md) — wedge 升级 "装配主义包管理器" → "完整三层栈方法论的可执行 engine"；8 支柱 100% capture lock；ROADMAP v3 重排 16 → 17 phase）
- **Phase 1.2 shipped** ✅（cli-npm + mcp-stdio installer runtime + 5 CLI subcommands + 12 contract tests + ADR 0005 errata + 含 phase 1.2.1 hotfix B5'）
- **Phase 1.1 + 1.1.1 hotfix shipped** ✅（schema v1 frozen + 10 上游 manifest + bench 21.7-22.6ms + B1 shell-escape security gate + 3 ADRs）
- **Acceptance bar E1-E8 8/8 (Phase 2.1)** ✅（A7 ADR 0001-0010 守恒 / 10 baseline tag iterate / Cross-OS CI 三平台全绿 — run 25900941988）
- **Acceptance bar F1-F8 8/8 (Phase 2.2)** ✅（A7 ADR 0001-0011 守恒 / 11 baseline tag iterate / Cross-OS CI 三平台全绿 — run 25924933870）
- **Acceptance bar F1-F8 8/8 (Phase 2.3)** ✅（A7 ADR 0001-0012 守恒 / 12 baseline tag iterate / Cross-OS CI 三平台全绿 — run 25948298223）
- **Acceptance bar F1-F8 8/8 (Phase 2.4)** ✅（A7 ADR 0001-0012 守恒 / 13 baseline tag iterate / Cross-OS CI 三平台全绿 — run 25958873300）
- **Acceptance bar F1-F8 8/8 (Phase 3.1)** ✅（A7 ADR 0001-0013 守恒 / 14 baseline tag iterate / Cross-OS CI 三平台全绿 — run TBD post-T5.6 push）
- **Next**：Phase 3.2 gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装（v0.3.0 MILESTONE 1/4 START 2026-05-16 — Phase 3.1 ship + 14 ADR + 14 baseline tag + 10 milestone tag 累积 + `v0.3.0-alpha.1-checkpoint` pushed；prereq：DEFERRED #1 W0.3 ENFORCE flip → Phase 3.2 W0 prereq after STATE/README format normalization + cli-audit 2 pre-existing fail scheduled fix session + EE-4 BLOCKER auto-spawn rerun 推 Phase 3.3+/3.4 plan-feature workflow w/ checkpoint 成熟后接入）

## Install Quick Start（phase 1.2 ready）

`harnessed install <name>` **默认 dry-run**——列出将装的上游 / 改的文件，必须 `y` / `--apply` 才执行。详见 [docs/INSTALLER-CONTRACT.md](./docs/INSTALLER-CONTRACT.md) 6 条用户视角硬契约。

```bash
# 默认 dry-run（看 diff，不写盘）
harnessed install ctx7

# 显式 apply（交互场景）
harnessed install ctx7 --apply

# 自动化场景（CI 流水线）— 双 flag 必须
harnessed install tavily-mcp --non-interactive --apply

# 看已装状态 / 备份 / 清理
harnessed status
harnessed backup list
harnessed gc --older-than 30d --apply

# 出错恢复（一行回滚 + EOL preserve + sha1 verify）
harnessed rollback 2026-05-12T15:30:00Z

# 健康检查（4-check：Node ≥ 22 / MCP scope / jq present / Win bash flavor）
harnessed doctor
```

### Flags

| Flag | 说明 |
| ---- | ---- |
| `--apply` | 显式执行（默认 dry-run） |
| `--dry-run` | 永不写盘（即使加 `--apply` 也优先 dry-run） |
| `--system` | L4 全局装允许（否则自动降级 L1 npx ephemeral） |
| `--non-interactive` | 自动化场景；必须配合 `--apply` 或 `--dry-run` 否则 exit 2 |
| `--full-diff` | 展开 > 200 行的 diff 折叠 |
| `--no-color` | 强制 nocolor（即使 TTY） |

## 使用流程（phase 1.2 实装后启用）

harnessed 是 **CLI + CC skill 混合体**——CLI 管装/检/恢复，skill 管编排：

```bash
# 1. 一次性 setup（装 workflow skills 到 ~/.claude/skills/、配置 hooks）
npx harnessed@latest setup

# 2. 装某个 workflow 用到的所有上游 plugin（一行装齐 4-5 个上游）
harnessed install plan-feature
# → 自动装 gstack + superpowers + GSD + planning-with-files

# 3. 跑 workflow（在 Claude Code 内输入 slash command）
/harnessed:plan-feature "新功能 X"
# → 调度 5 phase: gstack governance → superpowers brainstorm → GSD discuss/plan → planning-with-files persist
# → 暂停点等用户 approve（CEO veto / final task_plan lock）

# 4. 中断后恢复
harnessed status   # 看当前 phase
harnessed resume   # 从最近 checkpoint 继续

# 5. 健康检查
harnessed doctor   # 检测上游 stale / Windows ACL / 配置漂移
```

## FAQ — 常见疑问

**Q1. 装了 harnessed，还需要装 superpowers/gstack/GSD 等上游 plugin 吗？**

需要，但**用户感知 = 一行命令**：`harnessed install <workflow>` 自动解析 manifest 依赖图、装齐所有上游。类比 `brew install <formula>` 装全套依赖——你不需要单独 `brew install` 每个依赖项。

**Q2. 为什么不把 superpowers/gstack 的相关 skill 直接 vendor 进 harnessed 仓库？**

4 条理由：

1. **差异化哲学**（[ADR 0001](./docs/adr/0001-manifest-schema-v1.md) + PROJECT-SPEC § 6 wedge）：harnessed 是「装配主义包管理器」对位 ECC 的「all-in-one 自建派」。vendor = 失去 wedge → 沦为又一个 plugin pack
2. **License + attribution 噩梦**：vendor 4-5 个主动维护的上游 = 复杂 license 拼盘 + 违反 [vendor/ENTRY-CRITERIA.md](./vendor/ENTRY-CRITERIA.md)（要求"上游已停摆"才允许 vendor）
3. **上游升级反向**：当前 manifest 描述 → 上游升级用户重 install 即得新版；vendor 后必须手动 sync code → 永远落后
4. **Bus factor 1**：单 maintainer 维护 vendor 4-5 上游 = 加速 burnout（Avelino 论文实证 OSS 单 maintainer 年掉队率 36%）

**Q3. gstack 的 `/office-hours`、GSD 的 `/gsd-discuss-phase`、superpowers 的 brainstorming 看起来都是"plan/discuss"类，是不是重叠？**

不是。它们是**三层栈的不同阶段**（PROJECT-SPEC § 10 phases schema 显式编排）：

| 阶段 | 上游 | 职责 |
|------|------|------|
| Governance | gstack | 多角色决策关卡（CEO/EM/Designer/Paranoid Engineer） |
| Brainstorming | superpowers | 子任务设计澄清、方案对比 |
| Orchestration | GSD | 高层 phase 任务图 + 依赖分析 |
| Persistence | planning-with-files | 持久化 task_plan / progress / findings 到 markdown |

`/harnessed:plan-feature` 把这 4 个阶段串起来——每个阶段做不同事，输出喂给下一阶段。**没有合并**。

**Q4. workflow phase 之间是自动跑还是等用户？**

看 `workflows/<name>/SKILL.md` frontmatter 的 `pause` 字段：

- `pause: human_review` → 阻塞等用户 approve（governance gate / final lock 用，如 plan-feature 的 phase 01 + 05）
- 无 `pause` → 自动 chain 到下一 phase（中间步骤）

每个 phase 输出写到 `.harnessed/checkpoints/`，session 中断后 `harnessed resume` 从最近 checkpoint 继续。

**Q5. harnessed 自己是 CC plugin 吗？**

混合体：

- `npx harnessed@latest setup` 跑的是 **Node.js CLI**（`bin/harnessed`）
- setup 装的 **workflow skills**（markdown）进 `~/.claude/skills/`，由 Claude Code 在运行时加载
- `/harnessed:*` 是 CC 内的 slash command，触发 skill 执行
- CLI 和 CC skill 共享 `.harnessed/checkpoints/` 状态目录

## 文档导航

- [PROJECT-SPEC.md](./PROJECT-SPEC.md) — 立项参数 spec sheet（v2.1）
- [WORKFLOWS-MVP.md](./WORKFLOWS-MVP.md) — 3 个 MVP workflow 展开（v2.1）
- [docs/adr/](./docs/adr/) — 架构决策记录（0001 schema / 0002 toolchain / 0003 method count errata / 0004 installer UX contract / 0005 marketplace_source errata / **0006 architecture-wedge-revision-v3** / **0007 categorization-schema-extension errata**）
- [.planning/ROADMAP.md](./.planning/ROADMAP.md) — 4 milestones × 3-5 phases 路线图
- [.planning/STATE.md](./.planning/STATE.md) — 跨 session 项目记忆 SSOT
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南（含 Windows corepack ACL workaround）
- [SECURITY.md](./SECURITY.md) — 漏洞披露通道

## Sponsor / Co-maintainer

GitHub Sponsors 启用 + co-maintainer 招募窗口在 v0.4 开启（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）。

## License

[Apache-2.0](./LICENSE) — 见 [NOTICE](./NOTICE)（含 Harness Inc. 商标 disclaimer）
