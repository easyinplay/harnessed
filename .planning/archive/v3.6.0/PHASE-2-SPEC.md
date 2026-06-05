---
phase: 2
version: 3.6.0
title: setup-time third-party doctor — mattpocock + MCP availability
status: ready-for-review
created: 2026-05-25
depends_on: Phase 1 landed (independent;不阻塞)
sister_cadence: v3.4.x doctor 10-check pattern (`src/cli/lib/check-*.ts` delegate)
estimated_loc: ~150-200 src + ~50-80 test
estimated_commits: 4 (Wave 1 mattpocock check / Wave 2 MCP check / Wave 3 tests / Wave 4 reality + CHANGELOG)
---

# v3.6.0 Phase 2 — setup-time third-party doctor

## Goal (one sentence)

把 `harnessed doctor` 现有 10 checks 增加到 12 checks:加 **mattpocock-skills 安装检测**(user reframe "setup 时检测安装")+ **3 个 MCP server 可用性检测**(audit P1a — tavily / exa / chrome-devtools),缺失时 stderr 提示安装指引(NO auto-install)。

## Why (background)

1. **User reframe**(Phase 1 SPEC 写作时由用户提出): "在 setup 时就需要检测 mattpocock-skills 并安装"。Phase 1 把 mattpocock 方法论 inline 到 role-prompts.yaml(spawned subagent 无 plugin 也能跑),Phase 2 把 install-time 检测补上(提示用户装 plugin 可以走 SlashCommand 加速路径)。
2. **Audit P1a** (`audit-harnessed-vs-user-rules-2026-05-25.md`):"MCP 自动探测 + fallback hint"。当前 `check-mcp-scope` 只检查 `~/.claude.json` 是否有 user-scope MCP servers(scope 合规检查),不检查 Tavily/Exa/chrome-devtools 这 3 个 specific MCP server 是否在 `~/.claude/settings.json` 真正 enable + 可用。
3. **现有 doctor pattern 已成熟**: `src/cli/doctor.ts` 用 `Promise.all` 并行 10 checks,每个 check 是独立 `src/cli/lib/check-*.ts` helper(delegate pattern)。新增 2 checks 完美复用此 pattern,几乎无 architecture risk。

## Scope

### In-scope (2 个新 checks)

| check | 目的 | helper file | result entry |
|---|---|---|---|
| `mattpocock-skills` 安装 | 探 `~/.claude/plugins/cache/mattpocock-skills/<id>/<version>/` 或 `~/.claude/skills/mattpocock-skills/` | `src/cli/lib/check-mattpocock-skills.ts` (new) | 1 entry |
| `MCP server availability` | 读 `~/.claude/settings.json` 看 tavily-mcp / exa-mcp / chrome-devtools-mcp 是否在 `mcpServers` block enable | `src/cli/lib/check-mcp-availability.ts` (new) | 1 entry(details 含 3 server 子状态) |

### Out-of-scope (NOT Phase 2)

- **`superpowers` 安装检测** — 不在 audit P1a 范围;留 v3.7+ empirical-driven(用户已 explicit 选 Z scope mattpocock-only)
- **Agent Teams 防呆自动检查** — Phase 4 范围(cleanup discipline + state tracking)
- **gstack / planning-with-files 检测** — 现有 doctor 已 cover(`probe-gstack.ts` + `check-planning-with-files.ts`)
- **`mcp scope` 检查** — 现有 `checkMcpScope` 已 cover(scope 合规层),Phase 2 加的是 server availability 层(不同 concern)
- **auto-install** — 用户 explicit 排除("NO auto-install")。helper 仅探测 + 提示用户跑 `claude plugin install ...`
- **`harnessed setup` Step 改动** — 当前 `harnessed setup` 不主动跑 doctor(用户手动跑)。Phase 2 不改 setup 流程,只增 doctor checks。**v3.7+ 候选**:setup 末尾自动跑 doctor。

---

## Design details

### D1. `check-mattpocock-skills.ts` (sister `check-planning-with-files.ts` L1-58)

```typescript
// v3.6.0 Phase 2 — 11th doctor check (mattpocock-skills install probe per user
// reframe "setup 时检测 mattpocock-skills 并安装"). File-based probe NOT shell
// CLI (sister check-planning-with-files.ts pattern; avoids `claude plugin list`
// dependency).
//
// Probe locations (try both per mattpocock dual support):
//   1. ~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/  (plugin form)
//   2. ~/.claude/skills/mattpocock-skills/                                       (user-skill form)
// Either present → pass. Both missing → warn (non-blocking per warn ≠ fail R2.4.1).

import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

const REMEDIATION =
  'install via Claude Code plugin marketplace: `claude plugin install mattpocock-skills` ' +
  '(or git clone https://github.com/mattpocock/skills ~/.claude/skills/mattpocock-skills); ' +
  'methodology fallback already inline in role-prompts.yaml per v3.6.0 Phase 1 — install ' +
  'is optional but enables /grill-with-docs /zoom-out etc. SlashCommand acceleration'

export async function checkMattpocockSkills(): Promise<CheckResult> {
  const pluginRoot = join(homedir(), '.claude', 'plugins', 'cache', 'mattpocock-skills', 'mattpocock-skills')
  const skillRoot = join(homedir(), '.claude', 'skills', 'mattpocock-skills')

  // Try plugin form first
  try {
    const entries = await readdir(pluginRoot)
    const versions = entries.filter((e) => /^\d+\.\d+/.test(e))
    if (versions.length > 0) {
      return {
        name: 'mattpocock-skills',
        status: 'pass',
        message: `installed as plugin (version ${versions.join(', ')})`,
      }
    }
  } catch {
    // fall through to user-skill check
  }

  // Try user-skill form
  try {
    await stat(skillRoot)
    return {
      name: 'mattpocock-skills',
      status: 'pass',
      message: `installed as user-skill (${skillRoot})`,
    }
  } catch {
    // fall through to warn
  }

  return {
    name: 'mattpocock-skills',
    status: 'warn',
    message: 'not installed (plugin cache + user-skill paths both missing)',
    fix: REMEDIATION,
  }
}
```

**Estimated LOC**: ~50 (sister `check-planning-with-files.ts` 58 LOC)

### D2. `check-mcp-availability.ts` (NEW pattern — settings.json parser)

```typescript
// v3.6.0 Phase 2 — 12th doctor check (3 MCP server availability per audit P1a).
// Reads ~/.claude/settings.json (NOT ~/.claude.json — user scope settings),
// checks if tavily-mcp / exa-mcp / chrome-devtools-mcp are enabled in
// `mcpServers` block. Distinct from existing `checkMcpScope` which checks
// scope hygiene (project vs user); this check is server-by-server availability.

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

const TARGET_SERVERS = ['tavily-mcp', 'exa-mcp', 'chrome-devtools'] as const

export async function checkMcpAvailability(): Promise<CheckResult> {
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  let installed: string[] = []
  let missing: string[] = [...TARGET_SERVERS]

  try {
    const raw = await readFile(settingsPath, 'utf8')
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> }
    const servers = parsed.mcpServers ?? {}
    const serverNames = Object.keys(servers)
    installed = TARGET_SERVERS.filter((s) => serverNames.some((n) => n.includes(s) || s.includes(n)))
    missing = TARGET_SERVERS.filter((s) => !installed.includes(s))
  } catch {
    // settings.json missing or malformed — all 3 effectively missing
  }

  if (missing.length === 0) {
    return {
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'pass',
      message: `all 3 installed: ${installed.join(', ')}`,
    }
  }

  if (installed.length === 0) {
    return {
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'warn',
      message: 'none of 3 target MCP servers installed in ~/.claude/settings.json',
      fix: 'install via `claude mcp add <server-name>`; harnessed routes web-search to tavily/exa per workflows/judgments/web-search-routing.yaml — without them, falls back to WebFetch/WebSearch built-in',
    }
  }

  return {
    name: 'MCP servers (tavily/exa/chrome-devtools)',
    status: 'warn',
    message: `${installed.length}/3 installed: ${installed.join(', ')}; missing: ${missing.join(', ')}`,
    fix: `install missing via \`claude mcp add ${missing.join(' && claude mcp add ')}\``,
  }
}
```

**Estimated LOC**: ~60

### D3. `doctor.ts` integration

`doctor.ts` 当前 226 行(B-03 ≤225L 已经 +1)。新增 2 checks 增量:
- +2 async wrapper function (~6 行)
- +2 in `Promise.all` 数组 (~2 行)
- +2 in `results` array (~2 行)
- +1 in `--description` text (~1 行 — 加 mattpocock + MCP availability 字样)
- 共 ~11 行 → 237 行 → **超过 B-03 225L hard limit + 12.5% tolerance**

**两个 design 候选**:

**A. 接受 237L 一次性 exception**(推荐 — karpathy simplicity)
- Pro: 0 refactor cost,sister B-03 允许 case-by-case justified exception
- Con: 下次加 check 还要扩界限,迟早要 refactor
- Justify(在 commit body): "12 checks 都是 delegate to `check-*.ts` helper,doctor.ts 仍然是薄 dispatcher;refactor 留到 14+ checks 时一次性做"

**B. Refactor to `check-registry.ts`** — 把所有 checks 登记到数组,doctor.ts 简化为 `for (const c of CHECKS) results.push(await c())`
- Pro: 未来 scalability
- Con: ~80-120 LOC 额外 refactor(创建 registry + 改 doctor.ts + 改测试)+ premature abstraction risk
- Defer to v3.7+

**Default proposal**: A(spec acceptance gate;实施 subagent 不自行 refactor)

### D4. i18n consideration

现有 doctor.ts L218-221 用 `t('doctor.summary.fail')` 等 i18n keys。新 check messages 是否 i18n?

**Default proposal**: 不 i18n(matches sister `check-planning-with-files.ts` L21-22 + L41 + L46 + L52 + L57 都用 raw English strings + REMEDIATION const)。如果 reviewer 要 i18n,加 4 个新 keys 到 `messages/{en,zh-Hans}.json`(`doctor.mattpocock.*` + `doctor.mcp_avail.*`)。

---

## Wave 切分 (4 commits)

### Wave 1 — `check-mattpocock-skills.ts` + doctor.ts integration
- **Files**: `src/cli/lib/check-mattpocock-skills.ts` (new) + `src/cli/doctor.ts` (+~6 行)
- **LOC**: ~55 src
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(doctor): v3.6.0 Phase 2 Wave 1 — 11th check mattpocock-skills install probe`

### Wave 2 — `check-mcp-availability.ts` + doctor.ts integration
- **Files**: `src/cli/lib/check-mcp-availability.ts` (new) + `src/cli/doctor.ts` (+~6 行)
- **LOC**: ~65 src
- **Build gate**: `corepack pnpm build` 0 红
- **Commit**: `feat(doctor): v3.6.0 Phase 2 Wave 2 — 12th check MCP servers availability (tavily/exa/chrome-devtools)`

### Wave 3 — Tests
- **Files**: 
  - `tests/cli/lib/check-mattpocock-skills.test.ts` (new) — 3 cells: plugin form pass / user-skill form pass / both missing warn
  - `tests/cli/lib/check-mcp-availability.test.ts` (new) — 3 cells: all 3 present pass / partial warn / none warn
  - `tests/cli/doctor.test.ts` (existing — update if test asserts on results count = 10 → 12)
- **LOC**: ~80 test
- **Test gate**: `corepack pnpm test` ≥1098 pass (Phase 1 ship 时 baseline 应该已经 +Phase 1 cells)
- **Commit**: `test(doctor): v3.6.0 Phase 2 Wave 3 — mattpocock + MCP availability check coverage`

### Wave 4 — Reality check + CHANGELOG
- **Step 1**: `pnpm build` 0 红
- **Step 2**: `pnpm test` ≥baseline + 6 new cells pass
- **Step 3**: `harnessed doctor` 手动跑(real env)— 看 12 checks 全部输出 + 新增 2 checks 状态合理
- **Step 4**: `harnessed doctor --json | jq '.checks | length'` 应输出 `12`
- **Step 5**: 加 CHANGELOG v3.6.0 Phase 2 section
- **Commit**: `docs(changelog): v3.6.0 Phase 2 — setup-time third-party doctor (mattpocock + MCP availability)`

---

## 灰区 (实施 subagent 遇到必须 STATUS: NEEDS_CLARIFICATION)

1. **mattpocock plugin form 真实路径与 spec 假设不同**(Wave 1 跑时 plugin cache 路径与 `~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/` 不符;e.g. 实际是 `~/.claude/plugins/cache/mattpocock-skills/skills/<version>/` 因为 repo name vs plugin_id 不同)→ return,问要不要参考 `mattpocock/skills` repo 的 `.claude-plugin/` 目录确定真实 path 模式
2. **MCP settings.json 路径在 Windows 是 `~/.claude/settings.json` 还是 `%USERPROFILE%/.claude/settings.json`** → return 验证(`homedir()` 应该跨平台,但 readFile 可能遇到不同 separator)
3. **现有 `doctor.test.ts` 已经断言 `results.length === 10` 或 hardcode 10 entry name 列表** → return,问是 update 测试还是 add 新测试不动旧
4. **`doctor.ts` 超 237L 接 +CommitB-03 justification 是否需要更新 CLAUDE.md L21 hard limit 描述** → return,问是接受 exception 还是改 limit 文本
5. **`check-mcp-availability.ts` 检测的 MCP server 名字模糊匹配可能 false positive**(e.g. 用户装了 `tavily-mcp-fork`)→ return,问 exact match 还是 substring match
6. **Wave 2 跑后 `harnessed doctor` real env 输出有意外 warn / fail**(e.g. mattpocock 没装 → warn,但 reviewer 想要 default install pre-Phase-2)→ return,问是默认接受 warn 还是 Phase 2 顺便 ship 自动安装(out of scope but conditional)
7. **任何 Wave 后 `pnpm build` 红** → 立即 return,**不 fix-forward**

---

## Sister 文件参考

- `D:/GitCode/harnessed/src/cli/doctor.ts` — main dispatcher(integration target)
- `D:/GitCode/harnessed/src/cli/lib/check-planning-with-files.ts` — sister helper pattern(D1 copy 模板)
- `D:/GitCode/harnessed/src/cli/lib/check-agent-teams-doctor.ts` — sister env-based check pattern
- `D:/GitCode/harnessed/tests/cli/doctor.test.ts` — sister test pattern
- `D:/GitCode/harnessed/.planning/v3.6.0/PHASE-1-SPEC.md` — sister Phase 1 cadence

---

## Acceptance criteria

- [ ] Wave 1: `check-mattpocock-skills.ts` created + doctor.ts integration + 0 build red
- [ ] Wave 2: `check-mcp-availability.ts` created + doctor.ts integration + 0 build red
- [ ] Wave 3: 6 new test cells pass + doctor.test.ts updated if needed
- [ ] Wave 4: `pnpm build` + `pnpm test` ≥baseline+6 + CHANGELOG Phase 2 section + manual `harnessed doctor` shows 12 checks
- [ ] `harnessed doctor --json` outputs `checks: [12 entries]`
- [ ] Missing mattpocock → status warn + REMEDIATION hint
- [ ] Missing MCP servers → status warn with per-server detail

---

## Risk + rollback

- **Risk 1**: doctor.ts 超 225L hard limit(B-03)— spec D3 已 propose A 接受 exception,但 reviewer 可能要 refactor
  - **Mitigation**: 灰区 #4 协议,实施 subagent return 等用户决定
- **Risk 2**: mattpocock plugin 真实路径 differ from spec assumption
  - **Mitigation**: 灰区 #1 协议;helper 同时探 plugin + user-skill 两种 path 已经 robust
- **Risk 3**: MCP server name pattern matching false positive
  - **Mitigation**: 灰区 #5 协议;substring match 是当前 design(`tavily-mcp-fork` 会 match `tavily-mcp` substring → pass,但实际仍能用)
- **Risk 4**: `~/.claude/settings.json` 不存在(用户从未配置过任何 MCP)→ all 3 missing warn,可能造成噪音
  - **Mitigation**: warn 是 advisory(`warn ≠ fail`),不阻塞 doctor 退出;message 清楚说明"none installed",REMEDIATION 给安装命令

- **Rollback**: 4 atomic commits;Wave 1-2 各自独立 helper,可单独 revert。doctor.ts 增量很小,revert 风险低。

---

*Spec written 2026-05-25 by main session per v3.5.0 sister cadence + Phase 1 user reframe.*
*Approval gate: user review this spec → ack → spawn implementation subagent.*
