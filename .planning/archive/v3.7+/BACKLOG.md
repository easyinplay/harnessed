# v3.7+ Backlog

> Created 2026-05-25 after v3.6.1 ship。Empirical-driven grooming — items surfaced during v3.6.0 / v3.6.1 cycles, ranked by (用户痛点 × 实施成本)^-1。

---

## Priority matrix

| Rank | Item | 触发来源 | Scope | Risk | Defer to v3.8+? |
|---|---|---|---|---|---|
| **P0** | doctor.ts registry refactor | v3.6.0 Phase 2 B-03 exception(227 LOC 超 ≤225L hard limit) | ~80-120 LOC src refactor + tests update | 低(纯重构,行为不变) | NO |
| **P1** | Conditional RULES inject | v3.6.0 Phase 4 prompt budget audit(~670 tokens/spawn) | ~30-50 LOC src + judgment 评估 | 中(LLM 行为 emergent,需 dry-run smoke) | YES if budget < critical |
| **P2** | Meta-process: spec 写作前 grep-validate | v3.6.0 Phase 3 灰区 2 处 trigger ref naming drift(SPEC D1 写的 ref 与 yaml 实际不一致) | CLAUDE.md addendum / spec-checklist.md(~30 LOC docs) | 极低(纯文档) | NO |
| **P3** | `harnessed setup` 末尾自动跑 doctor | v3.6.0 Phase 2 out-of-scope decision 的反面 | ~10 LOC setup.ts append | 低 | YES — empirical wait |
| **P4** | 第三方 plugin auto-install hook | v3.6.0 Phase 2 NO auto-install decision 的反面 | ~150-250 LOC + 跨平台 fork/exec | 高(权限 / 跨平台 / 信任边界) | YES — empirical wait |

---

## P0 — doctor.ts registry refactor

### Why

v3.6.0 Phase 2 ship 加了 2 doctor checks(mattpocock-skills + MCP availability),`src/cli/doctor.ts` 从 226L 涨到 247L,**超过 B-03 ≤225L hard limit + 12.5% tolerance**(项目级 karpathy ≤200L target)。当前 commit body 标 exception,但下次再加 check(P3 自动跑 doctor / v3.7+ 加 superpowers 检测)就必须 refactor。

### Scope

- 创建 `src/cli/lib/doctor-registry.ts` — 把所有 check function 登记到数组 `CHECKS: CheckFn[]`
- `doctor.ts` 简化为:
  ```ts
  const results = await Promise.all(CHECKS.map((c) => c()))
  ```
- 每个 check function 保持 `Promise<CheckResult>` shape 不变,只是 import location 迁移
- Tests:`tests/cli/doctor.test.ts` assert `CHECKS.length === 12`(future-proof for add/remove)

### Estimated

- 80-120 LOC src(`doctor.ts` shrink ~80L,`doctor-registry.ts` new ~50L)
- 30-50 LOC test
- 0 behavioral change(行为相同,只是 dispatch 方式重构)

### Wave plan

- Wave 1: 创建 registry + 迁移 dispatch
- Wave 2: tests update + reality check
- Single phase 2-wave cycle

---

## P1 — Conditional RULES inject

### Why

v3.6.0 Phase 4 ship 后,每个 spawned subagent 收到 `criticalSystemReminder_EXPERIMENTAL` = `ESCALATION_RULES + TRANSPARENT_SKIP_RULES + AGENT_TEAMS_PREVENTION_RULES` ≈ **670 tokens/spawn**(典型 5000-token budget 的 ~13%)。

3 RULES blocks 的实际相关性按 phase 类型差异大:
- `task-deliver` / `verify-multispec` 可能真涉及 Agent Teams escalation → 全部 inject 合理
- `task-clarify` / `verify-progress` 几乎不会 fire escalation triggers → AGENT_TEAMS_PREVENTION_RULES 浪费 ~200 tokens
- `discuss-strategic` / `retro` → 三个都不太用

### Scope

- 加 `phase.injects_rules: string[]` yaml field(optional;default = `[escalation, transparent-skip]` 通用 2 项)
- `task-deliver` / `verify-multispec` / `task-test` yaml 显式 declare `injects_rules: [escalation, transparent-skip, agent-teams-prevention]`
- `buildAgentDef` 根据 phase 的 `injects_rules` 字段动态构造 `criticalSystemReminder_EXPERIMENTAL`
- 默认 inject 2 项(`ESCALATION` + `TRANSPARENT_SKIP`)≈ 470 tokens(节省 200 tokens / 30%)

### Estimated

- 30-50 LOC src(buildAgentDef 改 + yaml schema extend)
- 50-80 LOC test(per-phase inject 内容 assertion)
- LLM 行为 emergent — Wave 4 dry-run smoke 必须 verify spawned subagent 在不 inject AGENT_TEAMS_PREVENTION 时仍能正常工作

### Risk

中等。**有可能 fail-soft 降级 — spawned subagent 在 transparent-skip 时不知道 Agent Teams 还有 cleanup 防呆**。但实际上 transparent-skip + Agent Teams escalation 是相对独立的 concern,可能没问题。

### Defer condition

- 如果 empirical 下游用户不在乎 prompt budget(670 tokens 不是 BLOCKER)→ defer v3.8+
- 如果上游 SDK 更新让 prompt cache 默认开启 → 永远 defer

---

## P2 — Meta-process: spec 写作前 grep-validate

### Why

v3.6.0 Phase 3 实施时,subagent cross-validate 揪出 SPEC D1 我写的 2 处 trigger ref 名字 drift(`architecture-gate.plan-eng-review.fires` 实际不存在;`phase-gate.gray-areas.fires` 实际是 `phase-gate.gsd-discuss-phase.fires`)。这是 spec 写作时**未 grep verify 实际 yaml entry 命名**的失误。

类似失误在 v3.6.0 Phase 2 也出现一次(plugin path 假设)。

### Scope

- 在 `D:/GitCode/harnessed/CLAUDE.md` 加一节 "Spec 写作 pre-commit checklist":
  - 写到 SPEC 的 file path 必须 verify exists
  - 写到 SPEC 的 yaml entry name / TS function name / capability ref 必须 grep-verify 实际存在
  - SPEC 顶部 `verified_refs:` field 记录已验证的 cross-reference
- 或者写一个 `.planning/SPEC-CHECKLIST.md` 作为 sister doc

### Estimated

- ~30 LOC docs(CLAUDE.md addendum 或新 file)
- 0 src / 0 test

### Risk

极低。纯 process 改进,不影响 runtime。

### Why 不立即做

写完后我自己不一定 follow(LLM 行为 emergent + 历史对话 noise)— 这是个 self-discipline reminder,不是 enforcement。可以 v3.7 一起加,但 priority 低。

---

## P3 — `harnessed setup` 末尾自动跑 doctor

### Why

v3.6.0 Phase 2 SPEC out-of-scope decision 是 "setup 不自动跑 doctor,用户手动跑"。但 user 可能不知道 doctor 命令存在,装完 harnessed 没跑 doctor → 不知道 plugin 缺失 → workflow 跑 fail 才发现。

自动跑 doctor 末尾输出 + 安装指引让用户**第一次 setup 就看到** missing plugins/MCP 列表。

### Scope

- `src/cli/setup.ts` 末尾(Step D 之后,bundled_summary 之前)加一段:
  ```ts
  console.log(t('setup.running_doctor'))
  await runDoctorChecks()  // exposes checks list + REMEDIATION hints
  ```
- 或者更简单:`console.log('\n💡 run `harnessed doctor` to verify your environment')`

### Estimated

- ~10 LOC src

### Risk

低。`harnessed doctor` 已经 advisory(`warn ≠ fail`),append 到 setup 不影响 exit code。

### Why defer

empirical-driven:等下游用户反馈"我装完后不知道还要跑 doctor"。当前没数据 support 这是真 friction。

---

## P4 — 第三方 plugin auto-install hook

### Why

P3 的"自动跑 doctor 提示 missing plugin"是 advisory。P4 是更激进 — `harnessed setup` 检测到 plugin 缺失时,**询问用户**是否自动安装(`claude plugin install X`)。

### Scope

- `src/cli/setup.ts` 在 doctor 跑完后:
  - 对每个 `status: warn` + `fix:` 含 `claude plugin install` 的 entry → AskUserQuestion 确认
  - 用户 ack → `spawnSync('claude', ['plugin', 'install', '<name>'])` 自动跑
  - 用户 deny → skip + 继续

### Estimated

- 150-250 LOC src + 跨平台 spawn handling
- 50-80 LOC test(mock spawn + AskUserQuestion)

### Risk

**高**:
- 权限:`claude plugin install` 可能要 sudo / admin / npm permissions
- 跨平台:Windows / macOS / Linux spawn 行为差异
- 信任边界:harnessed 主动安装第三方 = scope creep,违反 v3.6.0 Phase 2 SPEC 的"NO auto-install" decision

### Why defer

v3.6.0 Phase 2 explicit decision 是 NO auto-install。改这个决策需要新的需求驱动证据(下游用户主动要求 auto-install),不应该 maintainer 自己拍脑袋反转。

---

## 建议 v3.7.0 scope

| Option | 范围 | 时长 | Risk |
|---|---|---|---|
| **A**(推荐) | **P0 only**(doctor refactor)— 1-phase 2-wave + ship | 1-2h | 低 |
| **B** | P0 + P2(refactor + spec checklist)— 2 phase + ship | 2-3h | 低 |
| **C** | P0 + P1 + P2(refactor + conditional inject + checklist)— 3 phase + ship | 3-5h | 中 |
| **D** | 暂时不做 — 等更多 empirical signal | 0 | - |

---

*Audit trail — 5 items surfaced from v3.6.0 / v3.6.1 cycles. Ship priorities = empirical-driven backlog grooming.*
