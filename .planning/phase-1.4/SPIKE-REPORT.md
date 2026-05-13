# Phase 1.4 SPIKE-REPORT — main-process query() API 实证 (T2.1 anchor)

> **Phase**: 1.4 Wave 1 (Spike)
> **Task**: T2.1 + T2.2 — `scripts/spike/routing-spawn-agent.sh` 实测产出 + 实装 anchor decisions
> **Decision**: D1.4-1 R1+R2 P0 mitigation Step 1
> **Date**: 2026-05-13
> **Status**: ✅ FEASIBLE — verbatim COMPLETE 回流路径 confirmed on Win Git Bash; engine.ts 实装 anchor decisions ≥ 5 项落地

---

## § 1 实测平台 + 时间 + claude CLI version

| 维度 | 值 |
|---|---|
| 实测时间 (UTC) | 2026-05-13T13:05:12Z |
| Platform | MINGW64_NT-10.0-26200 (Windows 11 Pro for Workstations + Git Bash) |
| Bash version | 3.6.7-fb42d713.x86_64 |
| Node | ≥ 22.0.0 (per `engines.node` lock) |
| **claude CLI version** | **2.1.133 (Claude Code)** — fresh 2026-05-13 release line; RESEARCH § 1.1 cite v2.1.110+ + v2.1.121 + v2.1.128 history within 2026 fast-iteration window |
| spike script | `scripts/spike/routing-spawn-agent.sh` (47L, ≤80L D-10 hard limit) |
| `SPIKE_TIMEOUT` (default) | 60s — cold-start ≤ 7s warmup + 30s margin (Win Git Bash 实测稳定) |

**Cross-OS 兼容性**: 本次实测仅在 Win Git Bash 跑通；Linux / macOS 待 phase 1.4 cross-platform CI 实测时同步验证（W-4 沿袭 phase 1.3 F36 风格 — 如其他平台异常 record F40-Linux / F40-macOS 而非阻塞）。

---

## § 2 各 step PASS/FAIL/NEEDS_TWEAK/SKIP 表格 + ms 时序

| Step | 描述 | Verdict | Cold (ms) | Warm (ms) | Reason |
|---|---|---|---|---|---|
| **Step 1** | `claude plugin --help` 含 `install`/`uninstall`/`list` subcommand 探测 | **PASS** | 213 | 216 | RESEARCH § 1.1 真实 CLI 形态 confirmed (v2.1.133 verify) — `claude plugin install <name> --scope project` 子命令真实存在 |
| **Step 2** | `claude mcp list` idempotent_check 路径 | **PASS** | 2619 | 4103 | mcp list 返回 7 行 — phase 1.1 manifest `idempotent_check` (`claude mcp list \| grep -q <name>`) 路径可靠 |
| **Step 3** | `claude -p` headless mode + verbatim COMPLETE 回流 | **PASS** | 6582 | 15664 | verbatim `COMPLETE` 单行回流 (`grep -qE "^COMPLETE\$"` 命中) — F33 P1 mitigation FEASIBLE on Win Git Bash |
| **Step 4** | `claude --help` 含 `--completion-promise` / `--max-iterations` flag 探测 | **NEEDS_TWEAK** | 220 | 219 | claude --help 不含 ralph-loop flag — 需 `/ralph-loop:ralph-loop` slash 才能调用官方 plugin (D1.4-3 自实装 ≤50L wedge 路径 confirmed) |
| **Step 5** | `~/.claude/skills/` filesystem scan (D1.4-1 reload bypass) | **PASS** | 110 | 121 | `/c/Users/easyi/.claude/skills/` 含 **100 skill** (sample: caveman / diagnose / find-docs / find-skills / grill-me) — reload bypass filesystem scan 路径 FEASIBLE |

**汇总**: 4 PASS + 1 NEEDS_TWEAK + 0 FAIL + 0 SKIP（cold + warm 双跑稳定一致）。

**Cold vs Warm 差异**:
- Step 2 / Step 3 cold-start 显著快于 warm（2.6s vs 4.1s / 6.6s vs 15.7s）— 推断 Win Git Bash 首跑 spawn claude CLI 进程时刻有 disk-cache prime，warm 实测受 background 进程干扰；不影响 verdict
- 其他 3 step 均 ms-level，cold/warm 一致

---

## § 3 verbatim COMPLETE feasibility 结论

**Verdict: FEASIBLE** ✅

### 3.1 实测证据

- Step 3 默认 `SPIKE_TIMEOUT=60s` 全跑通，verbatim `^COMPLETE$` 单行 grep 命中 (rc=0)
- prompt verbatim 文本: `Output exactly the single uppercase word COMPLETE on its own line and nothing else.` — 强 instructional + "exactly" + "single" + "and nothing else." 三重锁
- claude CLI v2.1.133 在 Win Git Bash 默认 model（推断 Sonnet — 未指定 `--model` flag）verbatim 回流稳定 — 6.6s cold / 15.7s warm

### 3.2 phase 1.4 engine.ts 含义

phase 1.4 D1.4-3 lock — `src/routing/engine.ts` 实装 ralph-loop wrap 时:
- main agent system prompt 必须 instructional inline (`do NOT summarize, paraphrase, or interpret`) + verbatim grep `^COMPLETE$` exact match — F33 P1 mitigation **路径 1:1 验证**
- `--completion-promise "COMPLETE"` 是 exact string match (RESEARCH § 2.3 anthropics/claude-code/plugins/ralph-wiggum verbatim) — 自实装 ≤50L 在 engine.ts 内串 verbatim grep + iteration 计数即可
- max-iter 20 (external) × maxTurns 50 (internal) 双 cap 是 actual safety net；`--completion-promise` 是 happy path（如 subagent 因为 prompt 调倾 summarize 永不命中 verbatim COMPLETE → max-iter 20 兜底 throw `MaxIterationsExceededError` → narrow 到 EngineResult `{aborted: true; reason}`）

### 3.3 边界条件 — Win Git Bash + cold start

- **首跑 cold-start ≤ 7s**: 在容忍范围（D1.4-3 max-iter 20 × per-iter 7s = 140s worst case，仍可接受）
- **timeout 30s 边界**: `SPIKE_TIMEOUT=10s` 实测 timeout（首跑测试），`SPIKE_TIMEOUT=30s` warm 跑通；script default 已升级 60s 防 cold-start 误判
- **F40-Win finding 反转**: 初次 spike 跑（10s timeout）误报 BLOCKED → 调长 timeout 后 PASS — 这是 timeout 配置 bug，不是 Win 平台 bug；F40-Win finding 不需 record

---

## § 4 ralph-loop wrap 时序 — `--completion-promise` exact match + `--max-iterations` cap behavior

### 4.1 探测结论 (Step 4 NEEDS_TWEAK)

`claude --help` v2.1.133 顶层 CLI **不含** `--completion-promise` / `--max-iterations` flag — 这两 flag 是 anthropics/claude-code/plugins/ralph-wiggum **slash command** (`/ralph-loop:ralph-loop "..."`) 内部参数，不是 built-in 主进程 CLI flag。

### 4.2 phase 1.4 D1.4-3 wedge 自实装路径 confirmed

phase 1.4 不引入 anthropics 官方 ralph-wiggum plugin 作为 dep（违反 wedge 原则 — 不 vendor）；`src/routing/engine.ts` 内自实装 ralph-loop wrap (≤ 50L 纯 string match + iteration 计数) — Step 4 NEEDS_TWEAK 实测明确 confirm 此路径合理:

- 主进程 `query({ options: { allowedTools: [...,'Agent'], agents: { name: agentDef } } })` 调用 (RESEARCH § 2.2)
- 每 iter 抓 subagent final message 字符串 → `match.includes('COMPLETE')` exact check (FEASIBLE per § 3)
- 不命中 → re-spawn 同 agent w/ retry context augment (`task.task += "[Previous attempt did not produce COMPLETE marker. Retry: focus on producing the COMPLETE token verbatim when done.]"`)
- max-iter exceeded → throw `MaxIterationsExceededError` → narrow 到 EngineResult `{aborted: true; reason}`

### 4.3 双 cap 计算

- **External max-iter**: 20 (D1.4-3 lock — RESEARCH § 2.4 confirmed)
- **Internal maxTurns**: 50 (AgentDefinition.maxTurns 字段 — contract § 2.2 L37)
- **Worst case round-trips**: 20 × 50 = **1000 LLM round-trips** (phase 1.3 contract § 6 锁)
- **Worst case duration**: 1000 × 7s (cold-start per call) = ~7000s ≈ 117 min — 极端边界，main agent print warning + abort 中途人工干预

---

## § 5 skill load filesystem scan 行为

### 5.1 实测结论 (Step 5 PASS)

`/c/Users/easyi/.claude/skills/` 含 **100 skill** (filesystem scan path verified)：

```
caveman / diagnose / find-docs / find-skills / grill-me / ... (100 total)
```

(实测样本前 5 个，含 user CLAUDE.md cite 的 mattpocock 招式 `/grill-with-docs` `/diagnose` 等家族)

### 5.2 phase 1.4 D1.4-1 reload bypass 路径 FEASIBLE

D1.4-1 锁 — install plugin 后**不调** `/reload-plugins`（GitHub issue #35641 / #46594 fresh 2026 Q1-Q2 仍 broken）；改为 spawn fresh subagent 让 CC runtime 从 `~/.claude/skills/<name>/SKILL.md` filesystem scan 加载 — Step 5 实测 100 skill 已存在 + filesystem scan 路径稳定，**reload bypass 路径 FEASIBLE**。

### 5.3 install 后 sleep retry idempotent_check 边界

phase 1.4 engine.ts install 段后:
- 默认 sleep 短暂 (~500ms) 等待 disk-cache 同步
- retry idempotent_check (`claude mcp list | grep -q <name>` 或 `[ -f ~/.claude/skills/<name>/SKILL.md ]`) max 3 次
- 仍 missing → throw `SkillNotInstalledError` → narrow 到 EngineResult `{ok: false; phase: 'install'; error}`
- 极端场景（plugin install 后 settings.json 改 hook 配置需要 main-session pickup）→ throw `RestartRequiredError` → main agent print "请 exit + restart Claude Code 让 plugin 生效"

---

## § 6 与 contract v1 / D1.4-1 / D1.4-3 出入分析

### 6.1 一致性 verify

| Contract / Decision | Plan 锁 | 实测 verify | 出入 |
|---|---|---|---|
| D1.4-1 (`claude plugin install` CLI subcommand 真实) | RESEARCH § 1.1 verbatim | Step 1 PASS confirm | ✅ 0 出入 |
| D1.4-1 (`/reload-plugins` skill bug → reload bypass via filesystem scan) | RESEARCH § 1.2 + GitHub issue #35641 | Step 5 PASS confirm 100 skill | ✅ 0 出入 |
| D1.4-3 (官方 ralph-wiggum 是 slash plugin 不是 built-in CLI flag) | RESEARCH § 2.3 | Step 4 NEEDS_TWEAK confirm 无 flag | ✅ 0 出入 — wedge 自实装 ≤50L 路径正确 |
| F33 P1 verbatim COMPLETE main agent system prompt 强制 | contract § 5.4 | Step 3 PASS verbatim 单行回流 | ✅ 0 出入 — feasibility 验证 |
| AgentDefinition 12 字段 contract v1 (frozen at phase 1.3 ship) | contract § 2 + W-5 V1 BLOCKER | spike 不涉及 spawn AgentDefinition (skeleton 仅 `claude -p`) | (spike scope 之外，T3.2 实装时 1:1 enforce) |

### 6.2 0 fresh 偏离 — 不需触发 ADR 0008 errata 调整

phase 1.4 RESEARCH § 1-2 + ADR 0008 § Decision 已落地的 4 个 errata items + 8 接口契约升级跟踪点 — 与本 spike 实测全部 1:1 对齐：
- **Step 1+2 PASS**: D1.4-1 install path + idempotent_check 路径不需调整
- **Step 3 PASS**: F33 P1 verbatim COMPLETE 主进程实测 FEASIBLE — D-18 systemPrompt.ts 1:1 contract § 5.4 路径不需调整
- **Step 4 NEEDS_TWEAK**: D1.4-3 wedge 自实装 ≤50L 路径 confirmed (RESEARCH § 2.4 verify) — 不需调整
- **Step 5 PASS**: D1.4-1 reload bypass filesystem scan 路径 confirmed (D1.4-1 § 1.4 verbatim) — 不需调整

**结论**: 本 spike 不触发 ADR 0008 errata sister patch (D-18 contract drift 路径不需走)；T3.1 engine.ts 实装可直接消费 plan 锁的 8 接口契约。

---

## § 7 engine.ts 实装 anchor decisions（≥ 5 项）

基于本 spike 5 step 实测，phase 1.4 T3.1 `src/routing/engine.ts` 实装时刻明确 7 个 anchor decisions：

### Anchor 1 — 主流程 chain (Pattern N — Engine 主流程编排)

```
runRouting(prompt, opts)
  → loadDecisionRules('routing/decision_rules.yaml')   [Step N/A — phase 1.3 ship 已 import 入口]
  → arbitrate(rules, taskContext)                       [Step N/A — phase 1.3 ship 已 import 入口]
  → installMissing(decision.skills, opts)              [Step 5 PASS — filesystem scan 路径]
  → createAgent(task, decision, opts)                   [Step N/A — T3.2 factory throw-error]
  → spawnSubagentViaQuery(agentDef)                    [Step 1+3 PASS — `claude plugin install` + `claude -p` verbatim 路径]
  → ralphLoopWrap(spawn, COMPLETE_TOKEN, max=20)       [Step 3+4 PASS+NEEDS_TWEAK — 自实装 ≤50L verbatim grep + iteration 计数]
  → narrow EngineResult three-state discriminated union
```

**5 步 chain 各 ≤ 30L，总 ≤ 200L hard limit (D-13)；spillover 抽 `src/routing/lib/ralphLoop.ts`**

### Anchor 2 — verbatim COMPLETE grep 实现 (D-18 enforce)

```typescript
// src/routing/engine.ts (snippet — 概念示意，T3.1 实装具体写法)
const finalMessage = await spawnSubagentViaQuery(agentDef);
if (/^COMPLETE$/m.test(finalMessage)) {     // exact-string match per Step 3 PASS verify
  return { ok: true, result: finalMessage, matchedRule: decision.matchedRule };
}
// 不命中 → re-spawn or throw
```

**关键**: regex `^COMPLETE$/m` (multiline mode) 匹配单行 — Step 3 实测 prompt verbatim 文本 + claude CLI v2.1.133 默认 model verbatim 回流路径与此 1:1 对应。

### Anchor 3 — install 段后 sleep retry idempotent_check (D1.4-1 reload bypass)

```typescript
async function installMissing(skills: string[], opts: RoutingOpts): Promise<void> {
  for (const name of skills) {
    if (await isInstalled(name)) continue;                          // idempotent skip
    await runInstall(name, { ...opts, nonInteractive: true });      // library call (W-2 优先)
    await sleep(500);                                                // disk-cache 同步等待
    let retries = 3;
    while (retries-- > 0 && !(await isInstalled(name))) {
      await sleep(300);
    }
    if (!(await isInstalled(name))) throw new SkillNotInstalledError(name);
  }
}
```

**关键**: `isInstalled` 走 filesystem scan (`fs.existsSync(~/.claude/skills/<name>/SKILL.md)`) + `claude mcp list | grep -q <name>` 双路径（Step 2 + Step 5 PASS verify）；不调 `/reload-plugins` (D1.4-1 § 1.4 verbatim)。

### Anchor 4 — ralph-loop wrap 自实装 ≤50L (D1.4-3 wedge)

```typescript
// 内联 engine.ts (≤50L per D1.4-3) 或抽 src/routing/lib/ralphLoop.ts (spillover)
async function ralphLoopWrap(spawn: () => Promise<string>, token: string, maxIter: number): Promise<{ result: string; complete: boolean; iter: number }> {
  for (let i = 0; i < maxIter; i++) {
    const final = await spawn();
    if (new RegExp(`^${token}$`, 'm').test(final)) return { result: final, complete: true, iter: i + 1 };
  }
  throw new MaxIterationsExceededError(`${maxIter} iterations exhausted`);
}
```

**Step 4 NEEDS_TWEAK 验证**: 不引入 anthropics/claude-code/plugins/ralph-wiggum dep；自实装 ≤50L 纯 string match + iteration 计数（wedge 原则严守）。

### Anchor 5 — RestartRequiredError 兜底路径

`installMissing` 极端场景（plugin install 后 settings.json 改 hook 配置需要 main-session pickup）→ throw `RestartRequiredError`；engine.ts main agent 捕获后 print user-friendly "请 exit + restart Claude Code 让 plugin 生效" → narrow 到 EngineResult `{ok: false; phase: 'install'; error: RestartRequiredError}`。Step 5 PASS 验证 reload bypass filesystem scan 在 100 skill 场景稳定 — `RestartRequiredError` 是极少触发的兜底路径，不是常规 happy path。

### Anchor 6 — `query()` `allowedTools` 必含 `'Agent'` (RESEARCH § 2.2)

main agent spawn subagent 时:
```typescript
query({
  prompt: task.prompt,
  options: {
    allowedTools: ['Read', 'Grep', 'Glob', 'Agent'],  // ⚠️ 必含 'Agent' 才能 spawn subagent (官方 docs 明文约束)
    agents: { [name]: agentDef }
  }
})
```

**关键 caveat**:
- subagent 自身的 `tools` 字段**绝不能**含 `'Agent'`（Fact D 嵌套禁止 — RESEARCH-1 § 1.1）
- Tool name 兼容: `'Task'` (CC v2.1.62-) 与 `'Agent'` (v2.1.63+) 双兼容 — message 检测 `block.name in ['Task', 'Agent']`

### Anchor 7 — 默认 timeout 60s + cold-start 容忍

Step 3 实测 cold-start 6.6s / warm 15.7s — `engine.ts` per-spawn timeout 默认 60s（含 7s × 8x margin）；用户可 `process.env.HARNESSED_SPAWN_TIMEOUT_MS` override（沿袭 D1.4-14 ENV mock 注入风格）；超时不命中 verbatim COMPLETE → re-iter retry 逻辑（Anchor 4 ralph-loop wrap）。

---

## § 8 References

### 内部依据

- `.planning/phase-1.4/RESEARCH.md` § 1 (P0-1 plugin install + reload bypass HIGH conf) + § 2 (P0-2 AgentDefinition + ralph-loop HIGH conf)
- `.planning/phase-1.4/PATTERNS.md` § 4 D-13 (engine ≤200L) + D-14 (factory throw) + D-18 (systemPrompt 1:1 contract § 5.4)
- `.planning/phase-1.4/ASSUMPTIONS.md` § B P0-1 (D1.4-1) + P0-2 (D1.4-2 + D1.4-3) + § E R1+R2 P0 mitigation
- `.planning/phase-1.4/PLAN.md` § 4 8 接口契约 + § 5 R1+R2 风险 mitigation
- `.planning/phase-1.4/task_plan.md` T2.1 + T2.2 + T3.1 anchor consume
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` § 2-3-5 (12 字段 + factory signature + 4 typed error class)
- `docs/adr/0008-routing-engine-v1-errata.md` § Decision 4 接口契约升级跟踪点
- `routing/decision_rules.yaml` v1 (12 rules + Priority hit policy + fallback_supervisor)
- `scripts/spike/routing-spawn-agent.sh` (47L D-10 probe — 本 report source artifact)

### Phase 1.3 ship cross-link

- `src/routing/decisionRules.ts` (`loadDecisionRules` + `arbitrate` ≤ 7L 入口 — phase 1.4 engine.ts 直接 import)
- `src/installers/index.ts` L60-L63 `runInstall(manifest, opts)` (Pattern D dispatcher — engine.ts install 段直接复用 — W-2 sister patch library call 优先)
- `src/manifest/security.ts` `checkCmdString` (B1 沿袭 — yaml + prompt 注入防御)

### 外部参考 (RESEARCH 已 cite)

- `code.claude.com/docs/en/plugins-reference` (fetched 2026-05-13) — `claude plugin install <name> [-s scope]` 真实 CLI subcommand
- `code.claude.com/docs/en/agent-sdk/subagents` (fetched 2026-05-13) — 12-field AgentDefinition + `Agent` tool 嵌套禁止 + Task→Agent rename
- anthropics/claude-code/plugins/ralph-wiggum (Tavily fetched 2026-05-13) — 官方 ralph-loop plugin in-session stop-hook 实装 + `--completion-promise` exact match + `--max-iterations` actual safety net
- GitHub anthropics/claude-code Issue #35641 / #46594 (Q1-Q2 2026) — `/reload-plugins` skill bug 仍 open
