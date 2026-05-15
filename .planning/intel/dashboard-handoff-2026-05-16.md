# Handoff to other CC — `scripts/dashboard.mjs` + Phase 2.4 doctor 完整版 C 路径

> 日期：2026-05-16
> 上下游会话：main CC session（dashboard 设计 + 实装 + 测试）
> 状态：dashboard A 路径已 ready merge；C 路径（STATE.md watcher + hook auto-install）作为 Phase 2.4 doctor 完整版的 sister 功能 backlog

---

## 1. 已完成（待 commit）

### 1.1 单原子 commit 草案

```
tooling: scripts/dashboard.mjs NEW — read-only .planning/ + docs/adr/ + git
visualization (~305L zero-dep ESM + tiny inline md→html + mtime polling +
hook-ready --no-open + port-occupied silent exit)

单文件 dashboard 脚本 — 本地 HTTP server (port 47180) + 自动开浏览器，
读 .planning/{STATE,ROADMAP,RETROSPECTIVE}.md + phase-*/{task_plan,progress,
VERIFICATION,PLAN-CHECK,KICKOFF}.md + docs/adr/*.md + .planning/intel/*.md
+ git log，渲染为 7 nav 暗色主题 SPA（沿用 superpowers brainstorming 的
shell + fetch fragment 模式，参考 C:\Users\easyi\Desktop\1710-1776950194\）。

零外部依赖（只用 node built-ins: http / fs / net / path / child_process），
内联 ~50L tiny markdown→HTML（headings / tables / code / lists / bold /
italic / links / blockquote），mtime polling 2s 间隔 → 文件变更前端 dot
变橙闪烁，用户点 ⟳ 即看最新。

每次请求 fresh 读取，no cache，全 read-only — 永远不写 .planning/。
跨 OS browser open 用 platform-specific cmd（win: cmd /c start / mac:
open / linux: xdg-open），不用 shell:true 避 node DEP0190 warning。

Hook-ready 设计:
  --no-open flag       → 启动 dashboard 但不开浏览器（hook 场景用）
  port-occupied probe  → TCP connect 47180 占用则 exit 0 silent
                         → 让 CC SessionStart hook 可重复安全调用
                         → 不重开 tab、不端口冲突 crash

7 个 nav: Dashboard (STATE head + 最近 8 commits + 3 stats) / Roadmap /
Current Phase (自动识别最新 phase-X.Y 目录，前 80 行 truncate) / Phase
History / ADRs (11 卡片 + Status badge) / Intel & Retro / Activity (近
50 commits 时间线).

不动: package.json（避免与 phase-2.3 prep 冲突，可手动加 "dash":
"node scripts/dashboard.mjs"）/ .gitignore（dashboard 不产生持久文件，
runtime state 只在内存）/ src/* (零核心代码改动) / 任何已 ship phase
artifacts (A7 守恒 trivially 满足).

参考: heptagent vision § 23 Project Adapter 把"L2 read-existing-planning"
模式锁定为 heptagent 自身 Import Wizard 的 GSD adapter；本脚本是
harnessed 自给自足的 L2 prototype（其他平台 future 借鉴）。
```

### 1.2 文件清单

```
NEW (1 file, ~305L):
  scripts/dashboard.mjs   ESM + shebang + 沿袭 check-transparency-verdicts.mjs 风格
                          (node: prefix imports + 2-space indent + 顶部 comment block)

NOT MODIFIED (intentional avoid-conflict):
  package.json            (可后续加 "dash": "node scripts/dashboard.mjs")
  .gitignore              (不需要 — 脚本不产持久文件)
  src/**                  (零核心代码触碰)
  .planning/**            (full read-only — 永远不写)
  docs/adr/**             (full read-only)
  .github/workflows/**    (CI 不需变 — 是 dev tool 非 ship artifact)
```

### 1.3 验收 criteria

```bash
# A. 启动验证（无 warning + 无 exception）
node scripts/dashboard.mjs &
sleep 2
# Expect: "harnessed dashboard: http://localhost:47180" + 浏览器自动开
#         无 DEP0190 / 无 node warning / 无 unhandled rejection

# B. --no-open flag（hook 场景）
node scripts/dashboard.mjs --no-open
# Expect: dashboard 启动但浏览器不开

# C. port-occupied silent exit（重复调用安全）
node scripts/dashboard.mjs --no-open  # 第 1 次（端口空闲 → 启动）
node scripts/dashboard.mjs --no-open  # 第 2 次（端口被占 → 友好 msg + exit 0）
# Expect 第 2 次输出: "dashboard already running on http://localhost:47180" + exit 0

# D. 8 endpoints 200
for p in / page/dashboard page/roadmap page/current page/history page/adrs page/intel page/activity mtime; do
  echo -n "$p: " && curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:47180/$p"
done
# Expect: all 200

# E. lint pass（biome 应零警告 — 沿袭 check-*.mjs 风格）
npx biome check scripts/dashboard.mjs

# F. typecheck N/A（.mjs 不进 tsconfig include）

# G. 跨 OS 验证（建议 CI matrix 跑一次即可，dashboard 不进生产 CI）
#    macOS: open 唤起默认浏览器 ✓
#    Linux: xdg-open 唤起默认浏览器 ✓
#    Windows: cmd /c start "" url 唤起默认浏览器 ✓
```

### 1.4 main CC session 已实测（2026-05-16）

| 项 | 结果 |
|----|------|
| 启动无 warning（DEP0190 已修）| ✅ |
| `--no-open` 不开浏览器 | ✅ |
| port-occupied 静默退出 + exit 0 | ✅ |
| 原 server 持续 200 响应 | ✅ |
| 8 endpoint 全 200 | ✅ |
| 自动识别最新 phase-2.3 目录 | ✅ |
| 中文 + emoji 正确渲染 | ✅ |

---

## 2. Phase 归属建议（让另一边 CC 自主决定）

| Type | 时机 | 利弊 |
|------|------|------|
| **A. `tooling:` 独立 commit** ⭐推荐 | 现在就可以 | 不与 Phase 2.3 scope 耦合；dev tool 价值即时兑现 |
| B. `phase-2.4 piggy:` | Phase 2.4 doctor 完整版时 | dashboard 是 doctor 的 sister 功能，sister cadence ship |
| C. `hygiene:` | 独立 ship（同 phase-2.2 `18150a5` 模式）| 沿袭已有 hygiene commit pattern |

---

## 3. Phase 2.4 doctor 完整版 — C 路径 backlog（前置规划）

dashboard A 路径已 ship 后，**Phase 2.4 doctor 完整版**（ROADMAP P2.4）建议把 dashboard auto-spawn + STATE.md 智能 watcher 一起 absorb。三件 sister 功能：

### 3.1 SessionStart hook 自动 spawn（A → 用户体验升级）

用户当前需手动加 `~/.claude/settings.json` hook 配置：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "node scripts/dashboard.mjs --no-open"
          }
        ]
      }
    ]
  }
}
```

Phase 2.4 `harnessed setup` 引擎应自动装这个 hook（沿袭 OMC `keyword-detector.mjs` UserPromptSubmit hook 装载模式 — intel `omc-comparison.md` EE-3 已记录可借鉴）。

**估算改动**：~30L `src/installers/cc-hook-installer.ts`（新 install method） + harnessed setup 引擎 dispatch 接入

### 3.2 STATE.md mtime watcher + 智能触发（C 路径核心）

dashboard 当前是"用户 demand-pull"（要看时手动开浏览器）。C 路径升级为"事件 push"：

```js
// scripts/dashboard.mjs 增量 (~50L)
import { watch } from 'node:fs'

const STATE_FILE = join(PLANNING, 'STATE.md')
const STATUS_RE = /\*{2}Phase\s+(\d+\.\d+)\s+SHIPPED\*{2}|Ready for execute|Ready for verify/

let lastStatus = null
watch(STATE_FILE, () => {
  const content = readFileSync(STATE_FILE, 'utf8')
  const m = content.match(STATUS_RE)
  if (m && m[0] !== lastStatus) {
    lastStatus = m[0]
    // 触发: 用 WebSocket 通知前端 / 弹 OS notification / spawn 新 browser tab
    notifyClient('phase-transition', { marker: m[0] })
  }
})
```

**估算改动**：~50L + 前端 WebSocket 接入（替换当前 2s polling）

### 3.3 多项目支持（heptagent ADD 形态预演）

当前 dashboard 单项目（assumes `cwd = harnessed` repo）。Phase 2.4+ 可加多项目：

```bash
heptagent doctor --multi-project ~/projects/*/   # 启动 dashboard 显示多项目
```

→ 这其实就是 heptagent vision § 21.2 "ADD 主布局" 的 prototype。**harnessed 的 doctor 完整版 = heptagent ADD 的 ancestor**。

**估算改动**：~80L 左栏多项目 nav + URL routing

### 3.4 总 Phase 2.4 doctor 完整版改动量

| 子功能 | 估 LOC | 价值 |
|--------|-------|------|
| Health check 主流程（doctor 本职）| ~150L | ROADMAP P2.4 原承诺 |
| 3.1 SessionStart hook auto-install | ~30L | 用户零配置开 dashboard |
| 3.2 STATE.md watcher + WebSocket push | ~50L | plan→execute 转换自动响应 |
| 3.3 多项目 dashboard | ~80L | heptagent ADD 形态预演 |
| **合计** | **~310L** | doctor + dashboard 完整 sister ship |

→ 一个 phase 内 absorb 4 件 sister 功能合理；Phase 2.4 plan-phase 时正式拆 task 排 wave。

---

## 4. 测试期间发现 — free intel

测试 dashboard 时正好渲染 `phase-2.3/task_plan.md`，几条 free intel：

| 发现 | 来源 | 状态 |
|------|------|------|
| **Phase 2.3 已启动 prep** | `.planning/phase-2.3/task_plan.md` 存在 | ✅ 你已知 |
| **ADR 0012 已 reserved** | T0.1 Resolved (2026-05-16): "`0012` = `0012` (next after ADR 0011)" | ✅ SSOT 引用纪律走得对 |
| **T0.10 always_active spike FAIL** | SDK 0.3.142 `skillFrontmatter` 仅 extract `name / source / tokens` 三字段，无 `always_active` 任何变体 | ⚠️ R2 fallback A1 触发 — description-keyword matching + self-reflexive prompt 嵌入 SKILL.md body |
| **影响 T2.3 SKILL.md ship 设计** | (1) 不含 `always_active` 字段 (2) description 用 high-precision keyword (3) body 首段 self-reflexive prompt "ALWAYS apply..." | ⏳ 建议在 Phase 2.3 SKILL.md drafts 里坐实 |

→ 这块**不在 dashboard PR scope** 里，是顺手看到 = handoff context。

---

## 5. STATE.md 建议（advisory，commit 时可加）

若 ship 为 tooling commit，STATE.md "已完成" 末尾加一条：

```markdown
- ✅ **tooling: scripts/dashboard.mjs NEW**（2026-05-16）—— ~305L 零依赖 ESM
  单文件 read-only `.planning/` + `docs/adr/` + git activity 可视化；HTTP server
  :47180 + mtime polling 2s 自动检测；7 nav SPA（dashboard / roadmap / current
  phase / history / adrs / intel & retro / activity）。`--no-open` + port-occupied
  silent exit 让 CC SessionStart hook 可重复安全调用。不入 production CI（dev
  tool），不动 package.json（用户可手动加 `dash` script）。**Phase 2.4 doctor
  完整版**将 absorb SessionStart hook auto-install + STATE.md 智能 watcher +
  多项目支持（doctor 的 sister 功能 cluster）。参考 superpowers brainstorming
  shell + fetch fragment 模式。
```

ROADMAP.md 不必动（不是 phase 里程碑级；Phase 2.4 plan-phase 时再排 dashboard 完整版 task）。

---

## 6. 一句话总结

✅ **dashboard A 路径 ready merge**（standalone tool + hook-ready / 实测全通过 / 不与 Phase 2.3 scope 耦合 / A7 守恒 trivially 满足）。
⏳ **Phase 2.4 doctor 完整版 absorb C 路径**（SessionStart hook auto-install + STATE.md watcher + 多项目支持，共 ~160L 增量），是 heptagent ADD 形态的 ancestor prototype。
