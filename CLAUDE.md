# harnessed — Project CLAUDE.md

> Project-specific instructions for Claude Code working on `harnessed`.
> Sister docs: [PROJECT-SPEC.md](./PROJECT-SPEC.md) · [.planning/STATE.md](./.planning/STATE.md) · [docs/WORKFLOW.md](./docs/WORKFLOW.md)
> Global rules (三层栈方法论 / web search routing / ctx7) live in `~/.claude/CLAUDE.md`.

---

## Project context

**harnessed** = AI coding harness 生态的「装配主义包管理器 + composition orchestrator」。不 vendor 上游代码,通过 manifest 描述 install/check + composition skill 编排 ECC / Superpowers / GSD / gstack 等异构上游组件成可执行 workflow。

- **Status**: 🎯 v0.4.0 SHIPPED & ARCHIVED 2026-05-19 (17/20 phases 85%); v0.5.0 v1.0-RC2 minor STARTING; 🎯 v1.0 GA target 2026-05-22~23
- **Stack**: Node.js 22 + TypeScript + pnpm + vitest + biome
- **Commit safety**: NEVER push to remote without user explicit approval (CLAUDE.md commit safety)
- **Biome preempt**: TS/JS commit 前必跑 `pnpm exec biome check --write` (3 CI-red recurrences project memory)
- **Phase cadence**: 三层栈完整方法论严格遵守 (gstack governance → GSD orchestration → superpowers brainstorming + karpathy 心法 + mattpocock 招式 + ralph-loop COMPLETE → verify)

---

## gstack skill routing

Use **gstack skills** for all governance, review, debugging, testing, shipping workflows. Browser automation: **always use `/browse` (or `$B` from gstack)**, **NEVER use `mcp__claude-in-chrome__*` tools** — they are slow and unreliable.

When the user's request matches one of these patterns, invoke the gstack skill via the Skill tool (not an ad-hoc answer). A false positive is cheaper than a false negative.

### Strategy & planning
- Product ideas / "is this worth building" / brainstorm → `/office-hours`
- Strategy / scope / "think bigger" / "what should we build" → `/plan-ceo-review`
- Architecture / "does this design make sense" → `/plan-eng-review`
- Design system / brand / "how should this look" → `/design-consultation`
- Design review of a plan → `/plan-design-review`
- Developer experience of a plan → `/plan-devex-review`
- "Review everything" / full review pipeline → `/autoplan`
- Save progress / "save my work" → `/context-save`
- Resume / restore / "where was I" → `/context-restore`

### Investigation & QA
- Bugs / errors / "why is this broken" / "wtf" → `/investigate`
- Test the site / "does this work" → `/qa` (or `/qa-only` for report only)
- Code review / "look at my changes" → `/review`
- Visual polish / design audit / "this looks off" → `/design-review`
- Developer experience audit / onboarding test → `/devex-review`
- Security / OWASP / "is this secure" → `/cso`
- Second opinion / codex review → `/codex`
- Page speed / performance regression / benchmarks → `/benchmark`

### Design execution
- Design shotgun (variants exploration) → `/design-shotgun`
- Design HTML mockup → `/design-html`

### Browser / web
- Browser automation / dogfooding / "open the browser" → `/browse` (or `/open-gstack-browser` for headed)
- Headed Chrome with Chrome extension → `/connect-chrome`
- Import cookies for authenticated testing → `/setup-browser-cookies`

### Ship & deploy
- Ship / deploy / create a PR / "send it" → `/ship`
- Merge + deploy + verify → `/land-and-deploy`
- Configure deployment → `/setup-deploy`
- Setup gbrain (project context) → `/setup-gbrain`
- Post-deploy monitoring → `/canary`
- Update docs after shipping → `/document-release`
- Generate documents (PDFs, etc.) → `/document-generate`

### Operational
- Weekly retro / "how'd we do" → `/retro`
- Safety mode / careful mode → `/careful` or `/guard`
- Restrict edits to a directory → `/freeze` or `/unfreeze`
- Upgrade gstack → `/gstack-upgrade`
- Review what gstack has learned → `/learn`

When in doubt, invoke the gstack skill. The skill has multi-step workflows + checklists + quality gates that produce better results than an ad-hoc answer.

---

## 三层栈方法论 reminder (per ~/.claude/CLAUDE.md global)

新功能/关键模块启动按完整 cadence:

1. **Discuss** — 🔒 gstack `/office-hours` + `/plan-ceo-review` (或 `/autoplan`) 强制 → GSD `/gsd-discuss-phase` 灰色澄清
2. **Plan** — GSD `/gsd-plan-phase` + planning-with-files 持久化;复杂架构 gstack `/plan-eng-review`
3. **Execute** — 每子任务: `superpowers:brainstorming` + karpathy 4 心法 always-on + mattpocock 23 招式按需 + 核心逻辑 TDD + `ralph-loop` 至 verbatim COMPLETE
4. **Verify** — GSD `/gsd-verify-work` + `code-review` 多 agent + 关键模块 gstack `/review` + `code-simplifier` + 里程碑 `/retro`

详 [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 4-stage mermaid + harnessed v0.4 gap 分析。

---

## Project memory references

跨 session 优先读:
- `.planning/STATE.md` — 当前 phase / 进度 SoT
- `.planning/ROADMAP.md` — phase 路线图
- `.planning/REQUIREMENTS.md` — 验收标准
- `docs/adr/` — 20 ADRs (架构决策记录)
- `.planning/RETROSPECTIVE.md` — 历史 phase narrative 归档

---

## Windows dev environment quirks

- Git Bash (MSYS2) 默认 shell; 用 Unix shell syntax (`/dev/null` not `NUL`, forward slashes)
- `pnpm` via corepack: `corepack pnpm` 显式 (PATH 没 pnpm.exe direct)
- `bun` via winget `C:\Users\<user>\AppData\Local\Microsoft\WinGet\Links\` (gstack build 依赖)
- Windows ACL corepack workaround 见 [CONTRIBUTING.md](./CONTRIBUTING.md)
- CI 必须保持 Windows 通过 — 历史 cross-OS Day 1 (Phase 1.1 起 ci.yml)

---

## Spec writing pre-commit checklist (v3.8.0 P2)

写 SPEC 前必须 verify 所有 cross-reference 实际存在;否则实施 subagent 被迫触发灰区协议 STATUS: NEEDS_CLARIFICATION 中途阻塞,主 session 必须裁决再 SendMessage resume,浪费 cycle。

历史教训(v3.6.0 Phase 2/3 灰区):
- Phase 2 SPEC 假设 mattpocock plugin cache path 是 `~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/` — 我未 verify,subagent 实施时遇到真实路径不符触发灰区
- Phase 3 SPEC D1 写了 2 个 trigger ref (`judgments.architecture-gate.plan-eng-review.fires` / `judgments.phase-gate.gray-areas.fires`) — 实际 yaml 不存在,subagent cross-validate 揪出灰区

### Checklist (写 SPEC 前必跑)

对 SPEC 中提到的每个:

1. **File path** (e.g. `src/cli/lib/check-X.ts`, `workflows/judgments/Y.yaml`) — 跑 `ls` / `Read` verify file exists OR explicit 标 "NEW"
2. **Yaml entry name** (e.g. `judgments.subtask-gate.brainstorming.fires`) — `grep -n` 实际 yaml `triggers.<name>` entry 是否真存在
3. **TS function name** (e.g. `buildAgentDef`, `loadCapabilities`) — `grep -n "^export function <name>"` verify
4. **Capability ref** (e.g. `superpowers-brainstorming`) — verify in `workflows/capabilities.yaml`
5. **Plugin path** (e.g. `~/.claude/plugins/cache/<plugin>/<id>/<version>/`) — verify with `ls` on host machine OR conservatively use generic install hint instead of hard path

### SPEC 顶部 `verified_refs:` field

每个 SPEC frontmatter 加 (optional, recommended):

```yaml
verified_refs:
  - "src/cli/doctor.ts (exists)"
  - "judgments.subtask-gate.brainstorming.fires (yaml verified)"
  - "buildAgentDef function in src/workflow/run.ts:L76 (exists)"
```

这是 audit trail — 让 reviewer / implementing subagent 知道哪些已 verify、哪些是 NEW (期望被创建)。

### 落实

主 session 写 SPEC 时,在每 D1-DN design 节内的 file/yaml/function reference 旁,标:
- ✓ existing — 已 grep 验过
- NEW — 期望 Wave N 创建

养成 grep 优先于 assume 的习惯。

---

*Project: harnessed*
*CLAUDE.md created: 2026-05-19 (gstack v1.40.0.0 install onboarding)*
