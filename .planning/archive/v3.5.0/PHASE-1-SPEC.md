---
phase: 1
version: 3.5.0
title: P0 Private-File Reference Sweep
status: ready-for-review
created: 2026-05-25
sister_cadence: v3.4.4 Phase 1-6
estimated_loc: ~150-200 LOC delete/modify
estimated_commits: 4 (one per wave)
---

# v3.5.0 Phase 1 — P0 Private-File Reference Sweep

## Goal (one sentence)

把 `workflows/` (npm publish 范围) 里所有指向用户私有文件 (`~/.claude/CLAUDE.md` / `~/.claude/rules/*.md` / `~/.claude/plugins/cache/.../X.Y.Z` / `~/.claude/settings.json`) 的引用全部清除或替换为 self-contained 形式,让 harnessed v3.5.0 ship 出去的 npm 包对任何下游用户都是自洽的。

## Why (background)

v3.4.4 audit (`.planning/audit-private-refs-2026-05-25.md`) + 实地 grep (151 命中) 揭示:

- npm `package.json` 的 `files` 字段把 `workflows/` 整目录打包 ship
- `workflows/capabilities.yaml` + 7 个 `workflows/disciplines/*.yaml` + 8 个 `workflows/judgments/*.yaml` + 30+ 个 `workflows/**/SKILL.md` + 30+ 个 `workflows/**/workflow.yaml` 都在注释 / description / References 节里写死 `~/.claude/...` 路径
- 下游用户 `npm install harnessed` 拉到包后,这些路径在他们的文件系统里**根本不存在**

这违背 harnessed 的核心承诺 (self-contained AI coding harness package)。用户在前次 reframe 里明确说过:

> "harnessed 必须自身实现完全的三层栈流程,不能依赖我电脑上的 claude.md 和 .claude/rules/,因为一般的 harnessed 根本不可能有我的规则和配置文件"

## Scope

### In-scope (Phase 1 必修)

| Bucket | Files | Hits | Wave |
|---|---|---|---|
| A. `capabilities.yaml` | 1 file | 11 hits | Wave 1 |
| B. `disciplines/*.yaml` | 7 files | 7 hits | Wave 2 |
| C. `judgments/*.yaml` | 8 files | 9 hits | Wave 2 |
| D. `role-prompts.yaml` | 1 file | 3 hits | Wave 2 |
| E. `workflows/**/SKILL.md` | ~25 files | ~50 hits | Wave 3 |
| F. `workflows/**/workflow.yaml` | ~20 files | ~30 hits | Wave 3 |
| G. Reality check verify | - | grep target = 0 | Wave 4 |

**总命中**: ~110-120 处 (grep `~[/\\]\.?claude` workflows/)
**总 LOC 改动**: ~150-200 (大部分为删除/改写注释行)

### Out-of-scope (NOT Phase 1)

- **P1 项目内文件** (`.planning/` / `docs/` / `CLAUDE.md` 项目根 / `tests/` / `scripts/` / `src/`): 不在 `package.json files` 字段里 → 不影响下游用户,保留原状
- **P2 superpowers/gstack/mattpocock impl 字段** (`capabilities.yaml` 中 `impl: superpowers` / `impl: gstack` / `impl: mattpocock-skills` 共 ~26 处): 这是 capability registry 设计 (声明"如果用户安装了这些第三方,这些 cmd 可用"),与 `impl: claude-platform` / `impl: plugin` / `impl: cli` 同类设计。**留给 v3.6+ doctor 兼容性增强** (单独 ADR 评估是否要 fallback 或 explicit dependency declaration)
- **Phase 2 Option 1 prompt-driven Teams**: 单独 spec (PHASE-2-SPEC.md)
- **Phase 3 verify + ship**: 单独 spec (PHASE-3-SPEC.md)

---

## 处置规则 (deterministic — 实施 subagent 照表执行)

实施 subagent 必须按下表 deterministic 处置每类引用,**不允许 case-by-case 即兴**。遇到表外 case → STATUS: NEEDS_CLARIFICATION 返回。

### R1. `description:` 字段尾巴 `(per ~/.claude/rules/X.md L*)` 引用

**位置**: `capabilities.yaml` L182/195/204/213/224/233/242/251/260 (9 处)

**处置**: **直接删除尾巴**,description 主体保留。理由: description 本身已经表达 capability 用途,引用源标注是 maintainer 自己的索引,不该出现在 ship 文件里。

**示例**:
```yaml
# BEFORE
description: UI/UX 默认主方案 数据驱动 (per ~/.claude/rules/web-design.md L5)
# AFTER
description: UI/UX 默认主方案 数据驱动
```

### R2. `plugin_path:` 字段值

**位置**: `capabilities.yaml` L435 `planning-with-files.plugin_path`

**处置**: **删除整个字段**。理由:
- 下游用户的 Claude Code plugin 安装路径不固定 (Windows/macOS/Linux 差异 + plugin 版本号会迭代)
- 该字段当前未被 runtime 消费 (grep `plugin_path` src/ workflows/ = 仅 capabilities.yaml + 文档引用)
- `cmd: /plan` 已经足以让 spawned Claude 调 plugin,不需要 path

**示例**:
```yaml
# BEFORE
planning-with-files:
  impl: claude-code-plugin
  install_type: plugin
  plugin_id: planning-with-files
  cmd: /plan
  ...
  plugin_path: ~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0
  outputs:
    - task_plan.md
# AFTER
planning-with-files:
  impl: claude-code-plugin
  install_type: plugin
  plugin_id: planning-with-files
  cmd: /plan
  ...
  outputs:
    - task_plan.md
```

### R3. yaml 顶部 L1-L5 注释 `# 机器化 ~/.claude/CLAUDE.md「X」节` / `# Sister: ~/.claude/rules/X.md`

**位置**: 所有 `disciplines/*.yaml` + `judgments/*.yaml` + 部分 `workflows/**/workflow.yaml`

**处置**: **改写为 self-contained 描述**,删除 `~/.claude/...` 路径,保留语义说明。

**示例**:
```yaml
# BEFORE (disciplines/karpathy.yaml L2)
# karpathy 心法 + 编码硬限 — 机器化 ~/.claude/CLAUDE.md 「andrej-karpathy-skills」 节
# AFTER
# karpathy 心法 + 编码硬限 — bundled discipline (think-before-coding / simplicity-first / surgical-changes / goal-driven)
```

```yaml
# BEFORE (judgments/parallelism-gate.yaml L2-L3)
# Parallelism 判据 — 机器化 ~/.claude/CLAUDE.md 「子任务并行执行机制 (subagent vs Agent Teams 路由)」节
# Sister: ~/.claude/rules/agent-teams.md (5 升级触发完整生命周期)
# AFTER
# Parallelism 判据 — bundled subagent vs Agent Teams routing rules
# (4 triggers: subagent-default / main-session-fallback / agent-teams-upgrade / ralph-loop-wrapper)
```

### R4. yaml 注释里 `sister ~/.claude/rules/agent-teams.md L*-L*` 行号引用

**位置**: `verify-work/workflow.yaml` L8/29/128, `verify/multispec/workflow.yaml` L5/9/17/27, `task/deliver/workflow.yaml` L6/23/36, `parallelism-gate.yaml` L26 (15+ 处)

**处置**: **删除整个 reference line** 或 **改写为内联说明**。理由: 行号引用对下游用户毫无意义。内容相关的话内联到注释主体。

**示例**:
```yaml
# BEFORE
# Cleanup mandatory per ~/.claude/rules/agent-teams.md 防呆清单 (SendMessage shutdown_request + TeamDelete)
# AFTER
# Cleanup mandatory: send SendMessage shutdown_request to each teammate, then TeamDelete
```

### R5. `language.yaml` L23 `check_method:` 字段值含 `~/.claude/settings.json`

**位置**: `disciplines/language.yaml:23`

**处置**: **改为 env-var 形式**,移除路径引用。

**示例**:
```yaml
# BEFORE
check_method: read ~/.claude/settings.json env.HARNESSED_USER_LANG, validate output lang matches
# AFTER
check_method: read env.HARNESSED_USER_LANG, validate output lang matches
```

### R6. SKILL.md 主体段 `(per ~/.claude/CLAUDE.md "X 节")` / `(sister ~/.claude/rules/X.md)`

**位置**: 多个 SKILL.md 的 frontmatter 后第一段 + Overview 段

**处置**: **删除括号引用**,保留主体说明。

**示例**:
```markdown
<!-- BEFORE (discuss/auto/SKILL.md L23) -->
4-stage cadence Stage ① master orchestrator delegating to 3 independent sub-workflows
(per ~/.claude/CLAUDE.md "澄清/审查触发判据" 节 三层独立判断):
<!-- AFTER -->
4-stage cadence Stage ① master orchestrator delegating to 3 independent sub-workflows
(三层独立判断: strategic / phase / subtask):
```

### R7. SKILL.md `## References` 节 bullet `- ~/.claude/CLAUDE.md "X"` / `- ~/.claude/rules/X.md`

**位置**: 几乎所有 `workflows/**/SKILL.md` 末尾 References 节 (30+ 处)

**处置**: **删除整个 bullet**。理由:
- 下游用户 npm install 拿到的 SKILL.md 引用根本不存在的私有文件 → 无价值
- 不替换为 GitHub URL (重定向回 repo 增加 SKILL.md 体积且非必要 — repo 链接放 README.md 一次即可)
- 保留 References 节里指向 harnessed 自己代码 / yaml / ADR 的 bullets (e.g., `workflows/judgments/parallelism-gate.yaml` / `docs/adr/0029-...` / `src/workflow/run.ts`)

**示例**:
```markdown
<!-- BEFORE (verify/multispec/SKILL.md L85-86) -->
- D-09 — L0 Discipline Substrate ...
- ~/.claude/CLAUDE.md "Verify 阶段 — 关键发布 / 大重构 PR 升级 Agent Team Pattern C" verbatim
- ~/.claude/rules/agent-teams.md Pattern C 多维度审查 + 防呆清单 + 完整生命周期
- workflows/judgments/parallelism-gate.yaml — Agent Teams upgrade trigger
<!-- AFTER -->
- D-09 — L0 Discipline Substrate ...
- workflows/judgments/parallelism-gate.yaml — Agent Teams upgrade trigger
```

### R8. SKILL.md 段落里 `Plugin path verified at ~/.claude/plugins/cache/...`

**位置**: `task/deliver/SKILL.md:82`, `task/code/SKILL.md:60`, `plan-feature/SKILL.md:58`, `plan/phase/SKILL.md:37`

**处置**: **替换为 install 指引**,不写死路径。

**示例**:
```markdown
<!-- BEFORE (task/deliver/SKILL.md L82-83) -->
③ task chain。Plugin path `~/.claude/plugins/cache/planning-with-files/
planning-with-files/2.34.0/` verified (2026-05-20)。
<!-- AFTER -->
③ task chain. Requires `planning-with-files` Claude Code plugin (install via Claude Code plugin marketplace).
```

### R9. SKILL.md `Sister ~/.claude/commands/<x>.md` 引用

**位置**: `research/SKILL.md:67`, `verify-work/SKILL.md:76`, `plan-feature/SKILL.md:87`

**处置**: **改写为 generic 描述**,引用 `commands/<x>.md` 不带 `~/.claude/` 前缀 (`harnessed setup` 安装到这个路径,下游用户视角下是相对 home 的标准路径,但要内联说明而不是裸写)。

**示例**:
```markdown
<!-- BEFORE (research/SKILL.md L67) -->
(Sister `~/.claude/commands/research.md` is also generated by `harnessed setup`...)
<!-- AFTER -->
(`harnessed setup` also installs a `research` Claude Code slash command at
`<claude-home>/commands/research.md` — both files carry the same instruction.)
```

### R10. role-prompts.yaml 顶部注释 `~/.claude/commands/`

**位置**: `role-prompts.yaml:4`, `:16`, `:48`

**处置**: **改写为 `<claude-home>/commands/` 占位符** + 一句话说明 `harnessed setup` 写入流程。同 R9。

---

## Wave 切分 (4 commits)

实施 subagent 必须按 wave 顺序执行,每 wave 1 commit。每 commit 前必跑 `pnpm exec biome check --write` (项目 biome-preempt discipline)。

### Wave 1 — `capabilities.yaml` 全文件 sweep
- **范围**: L73 (caveman 注释) + L182/195/204/213/224/233/242/251/260 (R1 9 处) + L435 (R2) + L472/479/996 (R4 注释)
- **预估 LOC**: ~12 行删除 + 9 行改写
- **Commit message**: `fix(capabilities): v3.5.0 strip ~/.claude/* references from description/plugin_path/comments`

### Wave 2 — `disciplines/*.yaml` + `judgments/*.yaml` + `role-prompts.yaml`
- **范围**:
  - `disciplines/karpathy.yaml:2` (R3)
  - `disciplines/operational.yaml:2-3` (R3)
  - `disciplines/output-style.yaml:2` (R3)
  - `disciplines/priority.yaml:2` (R3)
  - `disciplines/protocols.yaml:2` (R3)
  - `disciplines/language.yaml:23` (R5)
  - `judgments/strategic-gate.yaml:2` (R3)
  - `judgments/phase-gate.yaml:2` (R3)
  - `judgments/subtask-gate.yaml:2` (R3)
  - `judgments/tdd-gate.yaml:2` (R3)
  - `judgments/fallback.yaml:2` (R3)
  - `judgments/web-design-routing.yaml:2` (R3)
  - `judgments/web-testing-routing.yaml:2` (R3)
  - `judgments/web-search-routing.yaml:2` (R3)
  - `judgments/parallelism-gate.yaml:2-3, 26` (R3 + R4)
  - `role-prompts.yaml:4, 16, 48` (R10)
- **预估 LOC**: ~20 行改写
- **Commit message**: `fix(disciplines+judgments): v3.5.0 strip ~/.claude/* from yaml header comments`

### Wave 3 — `workflows/**/SKILL.md` + `workflows/**/workflow.yaml` 主体 sweep
- **范围**: 全部 SKILL.md References 节 + workflow.yaml 顶部注释 (R6/R7/R8/R9 处置)
- **文件清单** (按 grep 输出整理):
  - `discuss/auto/{SKILL.md, workflow.yaml}`
  - `discuss/strategic/{SKILL.md, workflow.yaml}`
  - `discuss/phase/{SKILL.md, workflow.yaml}`
  - `discuss/subtask/{SKILL.md, workflow.yaml}`
  - `plan/auto/{SKILL.md, workflow.yaml}`
  - `plan/phase/{SKILL.md, workflow.yaml}`
  - `plan/architecture/{SKILL.md, workflow.yaml}`
  - `plan-feature/SKILL.md`
  - `research/{SKILL.md, workflow.yaml}`
  - `task/auto/{SKILL.md, workflow.yaml}`
  - `task/clarify/SKILL.md`
  - `task/code/{SKILL.md, workflow.yaml}`
  - `task/test/workflow.yaml`
  - `task/deliver/{SKILL.md, workflow.yaml}`
  - `verify-work/{SKILL.md, workflow.yaml}`
  - `verify/auto/{SKILL.md, workflow.yaml}`
  - `verify/code-review/{SKILL.md, workflow.yaml}`
  - `verify/design/{SKILL.md, workflow.yaml}`
  - `verify/multispec/{SKILL.md, workflow.yaml}`
  - `verify/paranoid/{SKILL.md, workflow.yaml}`
  - `verify/progress/{SKILL.md, workflow.yaml}`
  - `verify/qa/{SKILL.md, workflow.yaml}`
  - `verify/security/{SKILL.md, workflow.yaml}`
  - `verify/simplify/{SKILL.md, workflow.yaml}`
  - `retro/{SKILL.md, workflow.yaml}`
- **预估 LOC**: ~120-150 行 (大部分为删除 References bullets + 改写括号引用)
- **Commit message**: `fix(workflows): v3.5.0 strip ~/.claude/* from SKILL.md+workflow.yaml across 25 workflows`

### Wave 4 — Reality check + Verify
- **Step 1**: `pnpm build` 确认无 TS 红 (yaml schema 不变,预期 0 红)
- **Step 2**: `corepack pnpm test` 确认无 test 红 (yaml comments 改动不影响 schema 验证或 runtime;预期 0 红)
- **Step 3**: `grep -r "~/.claude" workflows/` 必须 0 命中 → 真 self-contained
- **Step 4**: `pnpm pack --dry-run` 检查 tarball 内容,grep tarball 解出来的 `workflows/` 也是 0 命中
- **Step 5**: 若任何 step 失败 → STATUS: NEEDS_CLARIFICATION 返回主 session
- **Step 6**: 全 pass 后,**不 commit** (Phase 1 verify 不产生改动,只是验证)。直接进入 Phase 2 (Option 1 wire)。

---

## 灰区 (实施 subagent 遇到下列情况必须 STATUS: NEEDS_CLARIFICATION)

1. **某条 description 删除尾巴后变得无意义** (e.g., 删完 `(per ...)` 后整句失去主语) → 返回,等用户决定是改写还是保留尾巴
2. **R3 改写时找不到合适的 self-contained 表达** (规则原义太依赖外部上下文) → 返回原文 + 候选改写让用户选
3. **某文件 SKILL.md References 节删除所有 `~/.claude/...` 后变空** → 返回询问是否删除整个 References 节还是保留空标题
4. **遇到表外的私有引用形式** (本 spec R1-R10 未覆盖的) → 返回原始文本 + line 让用户加规则
5. **Wave 1-3 任一 commit 后 `pnpm build` 红** → 立即返回,**不要尝试 fix-forward** (yaml 注释改动理论不影响 build,出红肯定有 hidden coupling)

---

## Sister 文件参考 (实施 subagent context)

- `D:/GitCode/harnessed/.planning/audit-private-refs-2026-05-25.md` — audit 报告
- `D:/GitCode/harnessed/.planning/v3.4.4/PHASE-1-SPEC.md` — sister Phase 1 cadence 参考 (run subcommand)
- `D:/GitCode/harnessed/CLAUDE.md` — 项目 CLAUDE.md (NOT private — checked into repo)
- `D:/GitCode/harnessed/workflows/capabilities.yaml` — Wave 1 主目标
- `D:/GitCode/harnessed/workflows/judgments/parallelism-gate.yaml` — Phase 2 注入源 (Phase 1 R3 也要 sweep)

---

## Acceptance criteria (Phase 1 完成判据)

- [ ] Wave 1 commit landed: capabilities.yaml 11 处全部按规则处置
- [ ] Wave 2 commit landed: disciplines + judgments + role-prompts 共 ~20 处处置
- [ ] Wave 3 commit landed: 25 workflows 的 SKILL.md + workflow.yaml 主体引用处置
- [ ] `grep -r "~/.claude" workflows/` 输出空 (0 命中) — **hard gate**
- [ ] `pnpm build` 0 红
- [ ] `corepack pnpm test` 0 红 (baseline 1087 pass 维持)
- [ ] `pnpm pack --dry-run` tarball 解压后 `workflows/` grep 0 命中
- [ ] CHANGELOG.md v3.5.0 (Unreleased) 加 Phase 1 节描述 P0 cleanup

完成后状态: ready for Phase 2 (Option 1 wire) spec review。

---

## Risk + rollback

- **Risk 1**: yaml 注释改动看似无害,实际有自动化工具消费这些注释 (e.g., 文档生成器)
  - **Mitigation**: Wave 4 跑全测试套件 + reality check 0 红才进 Phase 2
- **Risk 2**: SKILL.md References 节大量删除导致 maintainer 索引丢失
  - **Mitigation**: 这些索引在 git history 里保留 (revert 可恢复);maintainer 索引该用 ADR 而不是 SKILL.md
- **Risk 3**: Wave 3 文件数多 (50+ 文件),subagent 可能漏改
  - **Mitigation**: Wave 4 `grep -r "~/.claude" workflows/ = 0` 是 hard gate,漏改必失败

- **Rollback**: 4 个 commit atomic,任何 wave 出问题 `git revert <hash>` 即可。Phase 2 spec 不前置依赖任何 yaml schema 改动。

---

*Spec written 2026-05-25 by main session per v3.4.4 sister cadence + audit-first protocol.*
*Approval gate: user review this spec → ack → spawn implementation subagent.*
