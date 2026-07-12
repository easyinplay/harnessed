# HANDOFF — harnessed v3.4.4 准备(audit-first then implement)

> 创建:2026-05-24
> 触发:Claude 在 v3.4.0 → v3.4.3 短时间 4 patches 中累计 lose holistic mental map,user reality check "你自己已经记不清了"。Compact 前 self-contained handoff,新 session 必须 audit-first 再 propose v3.4.4。

## ⚠️ 新 session 入场协议(严格执行,不要跳)

```
1. Read this HANDOFF 全文(本文件)
2. Read 推荐顺序 reference 部分(见下)
3. Spawn 1 个 gsd-codebase-mapper subagent 做 systematic audit
   → 输出: D:\GitCode\harnessed\.planning\audit-2026-05-24.md
4. 主 session Read 完整 audit
5. 跟 user align v3.4.4 真方向(propose 时 reference audit + user reframes)
6. User explicit confirm 后才 spawn executor implement
7. Implement 后 reality check by user(在 Claude Code 实测 /verify-paranoid)
8. 通过才 npm publish v3.4.4 + GitHub Release
```

**不要**在 audit 完成前:
- 直接动 code
- Propose v3.4.4 implementation 方向
- Spawn executor

**不要**重复前面 4 patches 错误路径(见下"Known wrong directions")。

---

## Critical project state(2026-05-24 当下)

- **harnessed v3.4.3 published**(npm + GitHub Release: https://github.com/easyinplay/harnessed/releases/tag/v3.4.3)
- **User 本机已装 v3.4.3 + harnessed setup 已跑**(commands + skills 文件已在 user `~/.claude/`)
- **harnessed-site v3.4.3** 已 Cloudflare Pages live: https://harnessed.cc
- **User 反馈 `/verify-paranoid` 在 Claude Code 内 invoke 仍不 work**(另一 CC 实例详细诊断;诊断对的,我设计错)

### User 机器 plugins 实况
**已装(plugin)**:andrej-karpathy-skills, claude-hud, claude-md-management, code-review, code-simplifier, context7, document-skills, example-skills, frontend-design, planning-with-files, playwright, ralph-loop, skill-creator, typescript-lsp, ui-ux-pro-max, caveman, rust-analyzer-lsp, warp, superpowers, figma, microsoft-docs

**已装(user-skill in `~/.claude/skills/<x>/`)**:gstack, mattpocock-*, gsd-*, harnessed-* (v3.4.3 setup 安装)

**user-skill ≠ plugin**:gstack 等用 `git clone <repo> ~/.claude/skills/<name>/` 安装,**不在** `~/.claude/plugins/installed_plugins.json`,**没有** `<plugin>:` slash command prefix(gstack `/review` 是 bare,不是 `/gstack:review`)。这是 v3.4.1 → v3.4.2 architecture flip 的根因。

---

## v3.4.x patches 演进史(必读 — 不要重复犯错)

| 版本 | 假设 | 真相 / 错在哪 |
|---|---|---|
| v3.4.0 ship | SKILL.md body 写 `{{ capabilities.X.cmd }}` Jinja 模板会自动渲染 | 模板**从未渲染**,verbatim 留 SKILL.md 给 Claude 看(没人 implement render logic) |
| v3.4.1 patch | Resolver 加 `plugin_namespace` prefix render `/review` → `/gstack:review` | **gstack 不是 plugin** 是 user-skill,没 namespace prefix。Bare `/review` 才对 |
| v3.4.2 patch ✓ | drop prefix mutation + plugin/user-skill discriminator + 5 mapping fix + caveman dual-install 示范 + `install_type: array` | 这部分**对**。User-skill detection via `readInstalledUserSkills()` + capabilities.yaml install_type 字段都对 |
| v3.4.3 patch | dual-source `~/.claude/commands/<x>.md` + `~/.claude/skills/<x>/SKILL.md`,body 写 dual-path "preferred SlashCommand /review + fallback Task spawn" | **`SlashCommand` 工具 Claude 没有**(它是 user UI 触发机制,不是 Claude 模型工具)→ preferred 100% 死路;`harnessed verify-paranoid --apply` CLI 是 **vapor**(从未 implement) |

### v3.4.3 真实 state breakdown

**Working in v3.4.3**:
- ✓ commands/<x>.md + skills/<x>/SKILL.md 双源 generation 写入 user 机器
- ✓ role-prompts.yaml 24 entries 中央 registry(ported from gstack expert prompts)
- ✓ Capability presence detection (plugin via `installed_plugins.json` / user-skill via `~/.claude/skills/<x>/` dir scan)
- ✓ Idempotent setup re-runnable
- ✓ Marker-based skip-user-file logic

**Broken / vapor in v3.4.3**:
- ❌ Body 写 "Use the SlashCommand tool to run /review" — Claude 无此工具
- ❌ Body "preferred path" 100% 走不通 → 永远 fallback 路径
- ❌ 24 SKILL.md sources 可能还提 `harnessed <x> --apply` vapor CLI(audit 时需 grep 确认全删)
- ❌ `harnessed --help` 实际 subcommand 只有:`install / install-base / research / execute-task / manifest-add / doctor / audit / audit-log / rollback / status / backup`。**13+ sub-workflow CLI 全 vapor**

---

## Architecture 真相(User reframe 7 之后我才看清)

### harnessed npm package 内**已 ship**的(我之前错误地认为缺失,实际有)

- **6 disciplines yaml** (`workflows/disciplines/`):karpathy / language / operational / output-style / priority / protocols
- **10 judgments yaml** (`workflows/judgments/`):parallelism-gate / strategic-gate / phase-gate / subtask-gate / tdd-gate / stage-routing / web-{search,design,testing}-routing / fallback
- **10 个 TypeScript runtime modules** (`src/workflow/`):masterOrchestrator + masterOrchestrator-helpers + disciplineLoader + judgmentResolver + exprBuilder + governance + interpolate + loadPhases + run + schema/
- **24 workflow.yaml** (`workflows/<stage>/<sub>/workflow.yaml`)
- **role-prompts.yaml**(v3.4.3 加)

### 真正的 gap

User invoke surface 跟 runtime **disconnect**:

- `harnessed --help` 只 wire 了 **2 个 workflow**(research + execute-task)到 CLI 入口
- 18+ sub-workflow + 4 个 master(/auto /discuss /plan /task /verify)CLI subcommand **完全没 implement**
- `masterOrchestrator.ts` 含 6-stage pipeline 但**没 user-callable 入口**
- Disciplines + judgments runtime 大部分 dead code(只 research/execute-task 走得到)
- User 输 `/verify-paranoid` → Claude Code platform 加载 commands/<x>.md body → Claude 模型 model-driven execute(**完全 bypass runtime**)

### 这是 v3.4.x 的 root architecture gap

不是 "disciplines 缺",是 "已 ship 的 runtime + disciplines + judgments 跟 user invoke surface disconnect"。

---

## User 关键 reframes(verbatim,新 session 必须 internalize)

### Reframe 1 — "你不要让我一边一边的修改,要想明白再写"
User accumulated frustration over 4 patches。要求 deep think 全维度后再 propose。**禁止** iterative patch 模式。

### Reframe 2 — "既然有分流规则,不能让 agent 自己判断走哪个吗?需要写死吗"
Body **不该 prescribe** subagent / Agent Teams / ralph-loop path。Claude 看 task spec + 内置能力 + 全局 routing context 自动 route。Body schema: **role + mission + checklist + acceptance + scope**(不写 invoke 指令)。

### Reframe 3 — "你为什么纠结 ~/.claude/CLAUDE.md,harnessed 本就是为了实现三层栈的方法论"
**harnessed 不该依赖** user 先装 `~/.claude/CLAUDE.md` global rules。harnessed 应该 self-contained ship。User 真正用户是装 harnessed 的人,不是 owner 自己(我之前把自己当 target user 是错框架)。

### Reframe 4 — "三层栈工作流和路由判断,不应该是在 harnessed 内部实现的吗"
Routing **不该 ship 到 user CLAUDE.md**(user 不该看 implementation detail)。Harnessed 内部自管。**实际确实如此** — disciplines/ + judgments/ + runtime 都已 ship,只是 disconnect 没用起来。

### Reframe 5 — "那不太对啊,你之前写的 workflow,包括 auto 模式实现的是什么?"
触发我重新 audit 看到 `masterOrchestrator.ts` + `workflows/auto/workflow.yaml` 真实 implement 6-stage pipeline + disciplines + judgments runtime 已存在。**真 gap 是 user invoke → runtime wire 缺失**,不是 content 缺失。

### Reframe 6(final reality check)— "这还是你自己写的项目吗?你自己已经记不清了"
直接 reality check:Claude session 累计 4 patches 中 lose holistic context,每次 patch 才发现新事实。**需要 fresh full audit rebuild mental map**。这就是当下决定 compact + audit-first 的原因。

---

## Audit subagent spec(新 session 第一件事 spawn)

**Subagent type**: `gsd-codebase-mapper`(read-only,suited for codebase intelligence)

**Brief**:

```
Spawn gsd-codebase-mapper for harnessed (D:\GitCode\harnessed) holistic audit.

Output single file: D:\GitCode\harnessed\.planning\audit-2026-05-24.md
Target length: 200-400 lines markdown.

Audit sections (each must be present in output):

## 1. CLI entry wire (src/cli.ts)
- All registered subcommands (with bash help text quotes)
- For each subcommand: handler module path + invoked runtime module + dataflow brief

## 2. Runtime modules (src/workflow/*.ts)
- masterOrchestrator.ts: exports, invoke entry points, who calls it
- masterOrchestrator-helpers.ts: helper functions, used by who
- judgmentResolver.ts, disciplineLoader.ts, exprBuilder.ts, governance.ts, loadPhases.ts, run.ts, interpolate.ts: each module's role + caller/callee
- src/workflow/schema/*: type definitions, validation entry points
- Dependency graph (ascii text):
  cli.ts → run.ts → masterOrchestrator → disciplineLoader/judgmentResolver/...
  (or actual graph based on real code)

## 3. Workflow data inventory
- workflows/*/workflow.yaml (24 files): full list with schema_version + delegates_to + tools_available + phase count
- workflows/disciplines/*.yaml (6 files): each discipline's content 1-paragraph summary
- workflows/judgments/*.yaml (10 files): each judgment's gate logic 1-paragraph summary
- workflows/capabilities.yaml: 83 entries breakdown by impl/install_type
- workflows/role-prompts.yaml: 24 role prompts list (name + role summary)

## 4. Setup pipeline (src/cli/setup.ts)
- Step A (workflow install) / A.5 (template render) / A.6 (commands/ generation, v3.4.3) / B (base manifest install) / C (Agent Teams env) / D (user lang) each: what does + what writes to user filesystem + idempotency story

## 5. Tests inventory (tests/)
- unit/ vs integration/ vs dogfood/ vs workflow/ breakdown (file count + purpose each)
- 8 baseline failures: each test's file:line + reason failing (verify still 8 after audit re-run)

## 6. Dead code analysis
- Which runtime modules have actual user-invoke path (via CLI or other)
- Which are wired up in code but never called (e.g. masterOrchestrator for /auto, /verify, /discuss, /plan, /task — likely all orphan)
- List all vapor `harnessed <x> --apply` references across:
  - SKILL.md sources (workflows/<stage>/<sub>/SKILL.md, 24 files)
  - README.md + README-cn.md + 8 translated READMEs
  - docs/ (any)
  - .planning/ (informational only, not user-facing)

## 7. True gap list (synthesis)
- User invoke surface (Claude Code `/verify-paranoid` etc.) → runtime disconnect points (concrete: what should run, what actually runs)
- 24 commands/<x>.md body 当前 dual-path content snapshot (preferred SlashCommand /review + fallback Task spawn) — confirm vapor preferred path
- Architecture options to bridge invoke surface → runtime (list 3-4 options with tradeoffs):
  - Option α: universal `harnessed run <workflow-name>` 1 个 subcommand 接所有 workflow,内部 dispatch 到 masterOrchestrator
  - Option β: 13+ 独立 subcommand (`harnessed verify-paranoid` etc.) each wire to specific workflow load + masterOrchestrator invoke
  - Option γ: 不 wire CLI,接受 Claude model-driven execute (commands body 简洁 task spec,Claude 自路由 spawn subagent)
  - Option δ: hybrid (Claude 看 body 决定 in-session 或 Bash invoke harnessed run)

## 8. Bonus findings
Any additional gaps / inconsistencies discovered during audit that weren't covered above.

CONSTRAINT: 100% read-only audit. NO code changes, NO commit, NO test runs.
Output is a single .md file at the specified path.
If section impossible to fill (data unavailable), explicitly say so in that section.
```

---

## 推荐 read order(新 session audit 后,跟 user align 前)

1. `D:\GitCode\harnessed\.planning\audit-2026-05-24.md`(audit 输出)
2. `D:\GitCode\harnessed\PROJECT-SPEC.md`(原始 wedge / 差异化 / ECC 对比)
3. `D:\GitCode\harnessed\CHANGELOG.md`(v3.4.0 → v3.4.3 entries)
4. `D:\GitCode\harnessed\workflows\auto\SKILL.md`(/auto master 的 spec — user reframe 5 提到 critical)
5. `D:\GitCode\harnessed\src\cli\setup.ts`(setup pipeline)
6. `D:\GitCode\harnessed\src\workflow\masterOrchestrator.ts`(runtime entry,看是否真有 entry / 谁 call 它)
7. `D:\GitCode\harnessed\src\cli.ts`(CLI 入口注册)

## v3.4.4 candidate directions(audit 后 narrow 选 1)

**Option α — Universal `harnessed run <workflow-name>` subcommand**
- Wire 1 个 CLI 入口 to masterOrchestrator
- commands/<x>.md body: `Use Bash to run: harnessed run <name> --apply`
- 内部 load workflows/<name>/workflow.yaml → masterOrchestrator → disciplines + judgments + spawn agents
- 工作量: 3-5h
- Runtime + disciplines 真用起来 ✓
- 优:最 minimal wire ; 劣:Bash invoke 包 1 层,Claude 体验略 indirect

**Option β — 13+ 独立 CLI subcommand**
- 每个 sub-workflow 独立 wire(`harnessed verify-paranoid` `harnessed discuss-strategic` etc.)
- 工作量: 1-2 day
- 优:每个 subcommand 独立 documented + testable ; 劣:重复 wiring + over-engineering

**Option γ — Body 自包含 task spec + Claude model-driven**
- 不 wire CLI(承认 runtime dead code,接受 status quo)
- commands/<x>.md body:role + mission + checklist + acceptance + scope(per user reframe 2)
- Claude 看 body 自路由(用 Task / Agent Teams 凭内置判断)
- 工作量: 2-3h
- 优:最简 + 最 portable ; 劣:disciplines + judgments + masterOrchestrator runtime 永远 dead code 浪费

**Option δ — Hybrid**
- commands/<x>.md body 含 task spec + 推荐"如果想用 harnessed runtime 完整 dispatcher 体验 use Bash: harnessed run <name>" 选项
- Claude 根据 task complexity / context 自己 decide in-session execute or Bash invoke harnessed runtime
- 工作量: 4-6h
- 优:both worlds ; 劣:复杂度高,Claude 行为不确定

**新 session 任务**:Audit 后跟 user align 选 α/β/γ/δ。我目前 lean Option α(minimal wire 让 runtime alive),但 user 可能 prefer γ(最简)。**不要预判,audit 先**。

---

## Known wrong directions(已被前面 patches 证明走不通,新 session 不要再考虑)

| ❌ 错向 | 为什么 |
|---|---|
| SKILL.md body 写 `Use SlashCommand to run /review` | Claude 没 SlashCommand 工具(那是 user UI 触发机制,not Claude 模型工具) |
| Body 写 dual-path "preferred + fallback" | Preferred 总死路 → 误导 |
| Body prescribe spawn 模式(`Use Task tool to spawn...`) | 写死忽略 runtime signals,user reframe 2 反对 |
| Ship disciplines section 到 user `~/.claude/CLAUDE.md` | Invasive + redundant(npm package 内已 ship)+ user reframe 3/4 反对 |
| Namespace prefix render(`/review` → `/gstack:review`) | gstack 是 user-skill 不是 plugin,无 prefix;v3.4.2 已反转 |
| 假设 `harnessed verify-paranoid --apply` CLI 存在 | Vapor,从未 implement(v3.4.0 ship 错误 claim) |

---

## Open questions(audit 后跟 user align 时讨论)

1. **CLI subcommand wire**: α / β / γ / δ 选哪个
2. **role-prompts.yaml 是否保留**:Option α/β 是 runtime input source;Option γ 应 inline 到 SKILL.md / commands body
3. **Vapor CLI cleanup scope**: SKILL.md sources + README + docs 全 audit + 删
4. **Reality check protocol formalize**: user 在 Claude Code 实测 `/verify-paranoid`,期望行为 list
5. **Future plugin volatility(v3.4.2 已部分解决)**:Option α/β wire 后如何保持解耦?

---

## 不可遗忘的 user 信息

- User 是 harnessed owner(easyinplay)
- User 主语言:简体中文,但 conversation 中英文混用,术语保留英文
- User 工作 style:深度思考 > 迭代 patch;reality check严格;不接受 partial solution
- User 装机情况:Windows + git bash MSYS2,`corepack pnpm` 而非直接 pnpm,Chrome 不在标准路径(playwright cache `~/AppData/Local/ms-playwright/chromium-XXXX/chrome-win64/chrome.exe`)
- User 已为 v3.4.x ship cycle 累积疲劳,**新 session 必须严格 audit-first,不要再 quick propose**

---

## 最后,严肃的 Self-reminder for new session

> "你不要让我一边一边的修改,要想明白再写。"
> — User reframe 1

新 session 接手:Audit → align → confirm → implement → reality check → ship。
**5 个 gate 一个都不能跳。**
