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

---

## Update — Polish Round 1（2026-05-16，post-merge）

dashboard NEW commit `0b4e76d` 已合并后，main agent 后续做了一轮纯 UX polish（用户驱动 + 顺手修一个 silent bug）。 这是**第二个独立 commit 候选**（建议同样走 `tooling:` 类型）。

### Follow-up commit 草案

```
tooling(dashboard): UX polish — centered main + 4 stats with trend + hover lift + sticky nav/top + ADR count fix

Visual + behavior improvements on top of dashboard NEW (0b4e76d). All inline
JS-constant CSS/HTML/JS; no new deps; read-only contract preserved (still
never writes .planning/).

CSS:
  - .main: margin:0 auto + clamp(24px,4vw,48px) padding → 居中 + responsive
  - .nav: position:sticky;top:0;height:100vh;overflow-y:auto;align-self:start
    → 长页 sidebar 持续可见（用户反馈）
  - .top: moved inside .main + sticky + backdrop-filter:blur(8px) + bg rgba
    + border-radius → 顶栏跟随滚动，毛玻璃浮动质感
  - .nav bg #161b22 → #0a0d11 (3-tier dark: nav < main < cards) →
    视觉层次清晰；.nav a:hover bg 同步调整
  - .card / .stat: transition + hover translateY(-1px) + box-shadow + border
    → 鼠标悬停 micro-lift 反馈
  - blockquote bg #161b22 → #0d1117 (nested in card 内嵌区分)

Stats (Dashboard page):
  - 3 cards → 4 cards (加 "tests 通过" with trend arrow)
  - parseTestsStat() helper 解析 STATE.md regex /tests A→B (+N)/
    → current=B, delta=N 渲染 "B ↑N" 绿色 trend
  - ADR count bug fix: listDirs(ADR,'') 用了 isDirectory() filter
    (always 0); 改为 readdirSync + file regex → 正确计 12 ADR

JS:
  - getElementById('main') → getElementById('content') (HTML 重构副作用)
    + innerHTML setter 同步改名 (loadPage / r refresh callback)

HTML:
  - .top 从 .layout root 移到 .main 第一个子元素
  - .main 内加 <div id="content"> 包裹动态加载内容

Reverted: 实验性 .card p/.card li/.card blockquote max-width:78ch
  → prose 现在与 table 等宽 (用户反馈: 文本应该自适应到 table 宽度)

Total diff: ~30 LOC net add (CSS) + 1 helper (parseTestsStat) + 2 inline
JS edits + HTML restructure. scripts/dashboard.mjs 455L → ~475L.

Tested 2026-05-16:
  - 5 endpoints 200 (dashboard / roadmap / current / adrs / mtime)
  - --no-open + port-occupied silent exit unchanged
  - Dashboard shows: 9 phase / 12 ADR / 444 tests ↑12 / 8 commits
  - Sidebar sticky verified (scroll long Roadmap 页 nav 保持可见)
  - Top bar sticky verified (scroll main 内 top bar 浮在 content 上)
  - Cards hover micro-lift 反馈
  - 跨 OS browser spawn unchanged (cmd /c start / open / xdg-open)

不动: package.json / .gitignore / src/* / .planning/* / docs/adr/* /
  CI workflows / 已 ship phase artifacts. A7 守恒 trivially 满足.
```

### 变更摘要表

| Polish 项 | 改动 | Trigger |
|----------|------|---------|
| Centering | `.main` margin:0 auto + responsive padding | 用户反馈"内容靠左侧别扭" |
| Sidebar 色差 (P3) | `.nav` bg `#0a0d11`（3-tier dark）| main agent 主动 polish |
| Sidebar 固定 ⭐ | `.nav` sticky + 100vh + overflow-y | 用户反馈"侧边栏没固定，下滚看不到" |
| Top bar 重新设计 (P2) | sticky in main + backdrop blur + rounded | main agent 主动 polish |
| Cards hover (P4) | transition + translateY + shadow + border | main agent 主动 polish |
| Stats 升级 (P5) | 3→4 cards + tests trend "B ↑N" | 用户选 P5 |
| ADR count bug fix | listDirs (isDirectory filter) → readdirSync + file regex | main agent 顺手发现 |
| Prose width revert | 撤回 `.card p max-width:78ch` | 用户反馈"text 没有自适应"（撤回 P1）|

### Bug 修正记录（silent bug，今天才暴露）

**ADR count = 0**：`pageDashboard()` 原用 `listDirs(ADR, '').filter(...)` 但 `listDirs` 内部 `statSync().isDirectory()` 只返回**目录**，而 `docs/adr/*.md` 是文件 → 永远 0。`pageADRs()` 用的是 `readdirSync(ADR).filter(...)` 直读，没踩坑。这次 dashboard page 复用了 `listDirs` 是 copy-paste 错误。Fix: 替换为 `readdirSync(ADR).filter(/^\d{4}-.*\.md$/)`。

### 用户 feedback 处理（实事求是）

| Feedback | 处理 |
|---------|------|
| "内容靠左侧别扭" → 居中 | ✅ `.main` margin auto + clamp padding |
| "表格宽度自适应挺好的，但是文本没有自适应" | ✅ **撤回**原 P1 prose max-width:78ch（main agent 之前建议错方向）|
| "左侧侧边栏没有固定" | ✅ `.nav` sticky + 100vh + overflow-y |

### 实测验证（curl + sanity test）

```
✅ port-occupied silent exit 正常
✅ --no-open flag 正常
✅ 5 endpoints 200: / page/dashboard page/roadmap page/adrs mtime
✅ Dashboard stats: 9 phase / 12 ADR (was buggy 0) / 444 tests ↑12 / 8 commits
✅ Sidebar sticky on long pages (Roadmap / Current Phase 实测)
✅ Top bar sticky in main scroll context
✅ Card hover micro-lift 视觉反馈
✅ Prose 文本现在与 table 等宽（撤回 78ch 后）
```

### Phase 归属（与原 commit 一致）

`tooling:` 独立 commit（沿袭 0b4e76d 风格 + Phase 2.2 hygiene commit pattern）。 不与 Phase 2.3 scope 耦合；A7 守恒 trivially 满足（无 ADR / src/* / phase artifact 触碰）。

### 给执行 CC 的建议

1. **直接采用 commit 草案** —— 已沿袭 sister style，executor 不需要重写
2. **若要 squash** 进 0b4e76d，可以 `git commit --fixup=0b4e76d` 然后 `git rebase -i --autosquash` —— 但**不推荐**（dashboard.mjs 是新文件，第一次 NEW 已经 push，rewriting history 会污染上游分支）
3. **推荐路径**：独立 commit ship —— 既保留 NEW 历史，也保留 polish iteration 历史 (sister cadence 一致)

---

## Update — Polish Round 2（2026-05-16，post Phase 2.3 ship）

Polish Round 1 commit `161621c` 后用户提供 Typora Phycat-Cherry 主题导出 HTML 样本（`C:/Users/easyi/Desktop/{STATE,ROADMAP,PLAN}.html`），驱动第二轮 typography polish + 顺手 fix 两个 sort 倒序。 第三个独立 commit 候选。

### Follow-up commit 草案

```
tooling(dashboard): polish round 2 — Phycat-Cherry inspired typography + heading decorations + reverse ADRs/History order

Inspired by Typora Phycat-Cherry theme (sumruler/typora-theme-phycat), borrowed
typography rhythm + heading decorations into dark-friendly accent. All inline
JS-constant CSS + 2 surgical .reverse() calls; no new deps; no breaking change.

Phycat-Cherry borrowed (dark-friendly adapted):
  - 字体栈 add "LXGW WenKai" / "PingFang SC" / "Microsoft YaHei" (中文优化)
  - 段落 word-spacing 1px / .card p line-height 1.75 / .card li line-height 1.7
  - #content > h2:first-child (page title) — 居中 + bottom 4px 渐变下划线 +
    box-shadow halo (蓝→绿 gradient #58a6ff → #7ee787)
  - .card h1 — 居中 + 3px 渐变下划线 (markdown 顶级标题 like ROADMAP)
  - .card h2 — bottom border 1px + 加粗
  - .card h3 — 左侧 4×18px 渐变 accent bar (::before)
  - .card h4 — 9px 圆环 + hover 填充 + scale 1.1 + shadow halo
  - .card h5 — ▸ 三角符号 prefix
  - .card h6 — — 破折号 prefix + 灰色
  - .card blockquote — 圆角 8px + ❝ Georgia 引号 ::before + 半透明蓝色 bg +
    border-left 4px (升级自原 3px solid 简版)
  - .card hr — 渐变 transparent → #30363d → transparent (替代纯色线)
  - .card strong — color #e6edf3 加深

未照搬 Phycat (dark/dev 场景不适用):
  - Phycat 衬线字体 (Optima/Georgia serif) → 保留 sans-serif (dense 技术内容更顺)
  - ::after icon mask SVG 装饰 → 太重，省
  - task-list pulse animation → 项目 markdown 不用 task list
  - counter-reset 章节自动编号 → 与已有 markdown # 数字结构 overlapping
  - h3/h4 hover translateX(6px) → 与现有 card-level translateY hover 冲突

Sort order fixes (user feedback):
  - pageADRs(): .sort() → .sort().reverse() (12 ADR 0012→0001 最新在上)
  - pageHistory(): listDirs(PLANNING) → listDirs(PLANNING).slice().reverse()
    (phase-2.4 → 2.3 → 2.2 → ... → 1.1 最新在上)
  - subtitle 加 "（最新在上）" 提示

Total diff: ~28L net CSS + 2 surgical reverse calls + 2 subtitle string updates.
scripts/dashboard.mjs ~475L → ~503L.

Tested 2026-05-16:
  - 5 endpoints 200
  - ADRs 倒序 verified: 0012 / 0011 / 0010 / 0009 / 0008 ...
  - History 倒序 verified: phase-2.4 / phase-2.3 / 2.2 / 2.1 / 1.5 / 1.4 ...
  - Phycat CSS rules served: .card h1::after / h3::before / h4::before (hover) /
    h5::before (▸) / h6::before (—) / blockquote ❝ + 圆角 + accent

不动: package.json / .gitignore / src/* / .planning/* / docs/adr/* / CI /
  已 ship phase artifacts. A7 守恒 trivially 满足.
```

### 变更摘要

| Polish 项 | 改动 | Trigger |
|----------|------|---------|
| 字体栈 i18n 优化 | body 加 LXGW WenKai / PingFang SC / Microsoft YaHei | Phycat-Cherry 借鉴 |
| 段落 rhythm | line-height 1.75 / word-spacing 1px / margin 10px | Phycat-Cherry 借鉴 |
| Page title 装饰 | `#content > h2:first-child` 居中 + 渐变下划线 + halo | Phycat-Cherry 借鉴 |
| .card h1 装饰 | 居中 + 渐变下划线（markdown 顶层）| Phycat-Cherry 借鉴 |
| .card h2 装饰 | bottom border 加粗 | Phycat-Cherry 借鉴 |
| .card h3 装饰 | 左侧 4×18px 渐变 accent bar `::before` | Phycat-Cherry 借鉴 |
| .card h4 装饰 | 9px 圆环 + hover 填充 + scale + shadow halo | Phycat-Cherry 借鉴 |
| .card h5/h6 装饰 | ▸ 三角 / — 破折号 prefix | Phycat-Cherry 借鉴 |
| blockquote 升级 | 圆角 8px + ❝ Georgia 引号 + 半透明 bg + 4px accent | Phycat-Cherry 借鉴（升级自原简版）|
| hr 渐变 | transparent → #30363d → transparent | Phycat-Cherry 借鉴 |
| strong 加深 | color #e6edf3 | Phycat-Cherry 借鉴 |
| **ADRs 倒序** ⭐ | `.reverse()` after sort | 用户反馈 |
| **Phase History 倒序** ⭐ | `.slice().reverse()` | 用户反馈 |

### 用户 feedback 处理

1. **"正文显示效果还有待改进"** + 提供 Phycat-Cherry HTML 样本 → ✅ 11 项 typography polish dark-friendly 适配
2. **"ADRS Phase History 是不是应该倒叙显示"** → ✅ 两处 `.reverse()` + subtitle 加 "（最新在上）" 提示

### 实测验证

```
✅ ADRs 倒序: 0012 / 0011 / 0010 / 0009 / 0008 ... （curl verified）
✅ History 倒序: phase-2.4 / 2.3 / 2.2 / 2.1 / 1.5 / 1.4 / 1.3 / 1.2.5 / 1.2 / 1.1
✅ Phycat CSS 全 served (h1-h6 ::before/::after + blockquote + hr 全在)
✅ port-occupied silent exit 仍正常
✅ --no-open flag 仍正常
✅ 5 endpoints 200
```

### Phase 归属（与前两轮一致）

`tooling(dashboard):` 独立 commit（沿袭 0b4e76d NEW + 161621c polish round 1 风格）。 不与 Phase 2.3 ship 或 Phase 2.4 discuss-phase 耦合；A7 守恒 trivially 满足。

### Dashboard 演进时间线

```
2026-05-16 早上    0b4e76d  tooling: scripts/dashboard.mjs NEW (~456L)
2026-05-16 中午    161621c  tooling(dashboard): polish round 1 + rename Dashboard→STATE (~475L)
2026-05-16 下午    <TBD>    tooling(dashboard): polish round 2 — Phycat-Cherry + reverse (~503L)
```

3 commit 演进路径 = sister cadence 一致；每轮独立 ship 留 iteration 历史 ↗

### 顺手发现（free intel）

测试 history 倒序时发现 **`.planning/phase-2.4/` 目录已创建** —— Phase 2.4 discuss-phase 已启动。 dashboard `Current Phase` 自动识别 phase-2.4 为 latest。 main agent 这一轮 polish 期间，另一边 CC 已经在 prep Phase 2.4（doctor 完整版）。

下一次 review trigger: Phase 2.4 W0 启动前 / W6 ship 后。 dashboard tool 是否进 Phase 2.4 doctor 完整版 (C 路径整合 SessionStart hook auto-install + STATE.md watcher + 多项目支持) 仍是 advisory backlog。

---

## 累积 dashboard tool ship 总结（3 commit）

| Commit | Type | LOC | Trigger | 核心改动 |
|--------|------|-----|---------|---------|
| `0b4e76d` | NEW | ~456L | main agent 设计 + user accept | 单文件 ESM 零依赖 read-only `.planning/` 可视化；7 nav SPA；HTTP server :47180 + mtime polling；--no-open + port-occupied silent exit hook-ready |
| `161js polish round 1` (`161621c`) | polish | +~20L (475L) | main agent + user feedback | 居中 main + 4 stats + tests trend ↑12 + ADR count bug fix + sidebar 色差 + cards hover + sticky top bar + Dashboard → STATE 命名 |
| polish round 2 (此 commit) | polish | +~28L (~503L) | user 提供 Phycat-Cherry HTML 样本 + 反馈倒序 | 11 项 Phycat-Cherry typography 借鉴（dark-friendly 适配）+ ADRs/History 倒序 |

→ **dashboard.mjs 自此 production-quality**，下一次主要演进窗口是 Phase 2.4 doctor 完整版 absorb C 路径（SessionStart hook auto-install + STATE.md watcher + 多项目支持）。

