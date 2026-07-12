# Phase 25-01 SUMMARY — value-prop + quickstart legibility

> Executed 2026-06-23, main-session hand-controlled (docs-only). Plan: `25-01-PLAN.md`. Context: `25-CONTEXT.md`. Deps: Phase 24 (`c988bc8`).

## Delivered

Docs-only README legibility pass — 2 files (`README.md` full + `README-cn.md` 仅主句), `git diff --stat` = `README.md` +40/-4, `README-cn.md` +4/-1. 7 translations untouched.

### EN `README.md`

- **D1 定位主句上提** (L5): H1 下方第一 blockquote 改为结果导向主句 — `> **Turn raw Claude Code into a disciplined senior engineering team.** One install wires governance, planning, TDD, and review into a single Discuss→Ship workflow where progress and evidence persist on disk, not in chat.` package-manager wedge 降为紧随的 _斜体副线_ (`_AI coding harness package manager + composition orchestrator_ — machine-executes...`) — wedge 保留, 差异化不丢.
- **D1 TL;DR 重组** (`## ✨ TL;DR`): 从重复定位 (`Best-practice orchestration for Harness Engineering...`) 改为「它怎么做到」展开 (`**How it works**: assembles + orchestrates ... does **not** vendor ... upstream upgrade = re-install`). 不再与主句争第一印象; operating loop mermaid 保留.
- **D2/D3 First 5 Minutes** (L80, `## ⏱️ First 5 Minutes`): 新增最短线性路径插在 Quick Install 之后、`Quick Start — 3 Options` (L112) 之前 — ① install one-liner ② `/auto "your first requirement"` ③ **裸 `harnessed`** = you-are-here dashboard + `NEXT:` (一个命令看「我在哪+下一步」, 不用记 status/next/resume, comet `/comet` analog, read-only, `--json` 机器读) ④ `harnessed` / `harnessed resume` 续. 收尾导向 3-Options. 3-Options (Auto/Stage/Surgical) 原样保留作进阶层.
- **D3 CLI 表行** (L441): Operational Commands `### CLI Commands` 在 `harnessed next` 上方加一行 `harnessed` (no args) = zero-arg you-are-here + `NEXT` + `--json` + onboarding.

### ZH `README-cn.md` (D4 — 仅主句)

- 一句话定位段 (L18) 同步 D1 结果导向主句中文版 — `**把原始的 Claude Code 变成一支纪律严明的资深工程团队。** 一次安装,就把治理 (governance)、规划 (planning)、TDD、审查 (review) 织进一条 Discuss→Ship 工作流 —— 进度和证据落在磁盘上,不消散在对话里。` 原 composition 描述降为紧随副线 (`_AI coding harness 包管理器 + composition orchestrator_ —— 装配...`). 顶部 wedge 副标题 (L5) 保留.
- **ZH 仅改主句段** — quickstart / CLI / 整体 drift (L106 `4-stage` / L153 `25 workflow` / 缺 Ship ⑤; README-cn 落后 EN 一个 milestone) NOT touched → v10.0 i18n surface 整体刷新.

## Verification (Acceptance 1–6 — grep + diff, docs-only)

| # | 验收 | 证据 |
|---|------|------|
| 1 | EN 主句在顶部 + wedge 共存 | `disciplined senior engineering team` README.md:5; `package manager` 仍在 (2 hits: 主标题副线 + FAQ) |
| 2 | First 5 Minutes linear + step3 零参数 + 3-Options 保留 | `First 5 Minutes` README.md:80; 4 step (install/`/auto`/裸 `harnessed`/resume); `Quick Start — 3 Options` README.md:112 |
| 3 | bare `harnessed` CLI 行 | `harnessed` (no args) README.md:441 |
| 4 | 链接/mermaid/badge 不破坏 | mermaid fence count 不变 (EN 2 diagram / ZH 2); diff 全为新增段落, 无 mermaid/badge/link 块改动 |
| 5 | **TDD 跳过** (D5) | docs-only README 重组, 非核心逻辑/算法/数据处理, 无回归风险面; zero-arg `harnessed` **行为**是 Phase 24 shipped + 已测 (1352 tests), 本 phase 只在 README 描述, 不碰 code. 无自动化测试, 验收靠 grep 锚点 + 人读 (CLAUDE.md TDD 跳过协议) |
| 6 | ZH 主句同步 + wedge 保留 + 整体 drift 不动 | `纪律严明` README-cn.md:18; `包管理器` 仍在 (L5 副标题 + L20 副线); `git diff --stat` 仅 `README.md` + `README-cn.md`; 7 翻译版 (tw/ja/ko/pt-BR/tr/ru/vi/th) `git status` 未列 |

## Notes

- KARPATHY-minimal: 全部为段落重组 + 一段新增 (First 5 Minutes), 无重写; 27-workflow table / Architecture / FAQ / Usage Flow / badge / 9-语言链接 全保留.
- 守宽 wedge preserved (package-manager 副线 EN + ZH 双保留).
- Known follow-on (v10.0 i18n surface): README-cn 正文整体刷新 (带 Ship stage / 27-workflow / First 5 Minutes ZH 版) + 其余 7 翻译版主句同步.
