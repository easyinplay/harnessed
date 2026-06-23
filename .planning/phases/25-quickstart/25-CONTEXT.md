# Phase 25 CONTEXT — value-prop + quickstart legibility

> Locked from the 2026-06-23 v8.0 Frictionless Entry discuss (ROADMAP active + STATE — do NOT re-derive the posture/competitive basis here) + the Phase 25 positioning clarification (AskUserQuestion 2026-06-23: 定位主句取向 = **结果导向**; 用户 2026-06-23 追加: ZH 主句同步). Main-session hand-controlled (GSD plan-phase agent chain overreaches on this host — STATE methodology lesson). **Docs-only**; no `/plan-eng-review` (no architecture); TDD skipped (D5).

## Goal

Close the legibility/adoption gap vs comet's instantly-graspable positioning: a first-time reader of `README.md` grasps "what harnessed gives me" in **one sentence**, then can go install → first-workflow → see-where-I-am in **<5 min**. Phase 24 shipped the zero-arg `harnessed` you-are-here entry (`c988bc8`); Phase 25 makes it the **spine of the quickstart** (the "where am I / what next" demo). 中文门面 (`README-cn.md`) 的一句话定位同步同一主句 (D4).

## Verified surface (spec-writing checklist — Read-confirmed 2026-06-23)

- `README.md` H1 + 副标题 L5–6 (`AI coding harness package manager + composition orchestrator` / `Machine-executes the three-layer-stack...`) — 主句改对象 (exists)
- `README.md` TL;DR L18–24 (`Best-practice orchestration for Harness Engineering on Claude Code`) — 重组对象 (exists)
- `README.md` Quick Install L59–65 + `Quick Start — 3 Options` L79–115 (Auto/Stage/Surgical) — quickstart 整合对象, 3-Options 保留 (exists)
- `README.md` Operational Commands CLI table L402–426 — 加 bare `harnessed` 行 (exists; sister `harnessed next` L408 / `harnessed resume` L414)
- zero-arg `harnessed` you-are-here = Phase 24 shipped (`c988bc8`; `src/cli/lib/here.ts` — `parseBareInvocation`/`buildHereView`/`runHere`) — quickstart demo 主角 (exists)
- `README-cn.md` 一句话定位段 `## ✨ 一句话定位` L16–18 (`做 Claude Code 上 Harness Engineering 的最佳编排实践...`) — **ZH 主句改对象** (exists); wedge 副标题 L5–6 (`AI coding harness 包管理器 + composition orchestrator`) 保留 (exists)
- `README-cn.md` 正文 **整体 stale** (Read-confirmed): L106 `4-stage 流程图` / L153 `25 workflow 总览表` / 缺整个 Ship ⑤ stage — vs EN 5-stage/27-workflow. 落后一个 milestone. **NOT touched this phase** (D4)
- 9 个翻译版 (`README-cn/tw/ja/ko/pt-BR/tr/ru/vi/th`) — 顶部语言切换链接 L3 (exists)

## Locked decisions

- **D1 — 定位主句 = 结果导向** (AskUserQuestion 2026-06-23): `README.md` H1 下方新主句 =
  > **Turn raw Claude Code into a disciplined senior engineering team.** One install wires governance, planning, TDD, and review into a single Discuss→Ship workflow where progress and evidence persist on disk, not in chat.

  package-manager wedge (`AI coding harness package manager + composition orchestrator`) **降为副标题副线保留** (差异化不丢 — FAQ Q2 wedge). 现有 TL;DR 段 (`Best-practice orchestration for Harness Engineering...`) 重组: 主句上提, TL;DR 改为「它怎么做到」的展开, 不再与主句争夺第一印象.
- **D2 — <5min linear quickstart**: 在 `Quick Start — 3 Options` 之前 (Quick Install 之后) 加一条「First 5 Minutes」**最短线性路径** (区别于 3-Options 的「按介入程度分层」):
  1. install: `npm install -g harnessed && harnessed setup`
  2. 跑第一个 workflow: `/auto "your first requirement"` (newcomer 默认; 或 `/discuss "..."`)
  3. **看你在哪 / 下一步**: 裸 `harnessed` → you-are-here dashboard + `NEXT:` (Phase 24)
  4. 随时续: 裸 `harnessed` 或 `harnessed resume`

  3-Options (Auto/Stage/Surgical) 作为「想更细控制」的下一层保留, 不删.
- **D3 — zero-arg `harnessed` 进 README**: quickstart step 3 demo 它; Operational Commands CLI 表加一行 bare `harnessed` (zero-arg you-are-here + `NEXT`, sister `harnessed next`/`resume`).
- **D4 — scope = EN `README.md` 全套 + `README-cn.md` 仅主句** (用户 2026-06-23 要求 ZH 主句同步): EN `README.md` = D1 主句 + D2 quickstart + D3 CLI 行 **全套**; `README-cn.md` = **仅同步 D1 结果导向主句** (一句话定位段 L16–18 → 中文版主句; wedge 副标题 L5–6 保留). **ZH quickstart / CLI 行 / 整体 drift 不同步**. 理由: README-cn 不止主句 stale — 整个结构落后一个 milestone (L106 `4-stage` / L153 `25 workflow` / 缺 Ship ⑤; EN 已 5-stage/27). 把最新的 First 5 Minutes (演示零参数 `harnessed`) 塞进落后一个 milestone 的 ZH 正文会加重「新主句演示 vs 旧 4-stage 正文」混杂; quickstart + ZH 整体 drift 更适合随 ZH 一次性刷新带 Ship stage 一起做 → **v10.0 i18n surface**. 其余 7 个翻译版 (tw/ja/ko/pt-BR/tr/ru/vi/th) 全部 → v10.0.
- **D5 — TDD 跳过** (CLAUDE.md TDD 跳过协议): docs-only README 重组, 非核心逻辑/算法/数据处理, 无回归风险面 (zero-arg `harnessed` **行为**是 Phase 24 shipped + 已测, Phase 25 只在 README 描述它, 不碰 code). 验收靠 grep 锚点 + human-read legibility, 非自动化测试.

## Scope

- `README.md`: 主句重组 (D1) + 「First 5 Minutes」linear quickstart (D2) + Operational Commands 加 bare `harnessed` 行 (D3).
- `README-cn.md`: **仅** 一句话定位段同步 D1 结果导向主句中文版 (D4); wedge 副标题保留.

## Out of scope (do NOT touch)

- `README-cn.md` quickstart / CLI 行 / 整体 drift (4-stage/25-workflow/缺 Ship) 同步 → **v10.0 i18n surface** (D4).
- 其余 7 个翻译版 (tw/ja/ko/pt-BR/tr/ru/vi/th) 全部 → v10.0 (D4).
- 任何 code / CLI 行为改动 — Phase 25 docs-only (zero-arg `harnessed` 是 Phase 24 shipped).
- `docs/comparison.md` / `docs/WORKFLOW.md` / 其他 docs — Phase 25 聚焦 README 门面 legibility.
- Stars / demo gif / DeepWiki — marketing follow-on (ROADMAP non-phase tier), 非 Phase 25.
- Cross-harness `~/.claude/` 抽象 — v9.0.

## Invariants

- 守宽 wedge preserved (package-manager 副线不丢 — D1; EN + ZH 均保留).
- 现有 badge / mermaid / 9-语言切换链接 (L3) / 内部锚点链接 不破坏 (EN + ZH).
- doc-discipline: 一句话定位 one-fact-one-home per language (EN README canonical + ZH 主句对齐同一 D1); STATE/ROADMAP 指针引用, narrative 进 SUMMARY 不内联.
- KARPATHY-minimal: 重组现有 README 段落, 不重写全文; ZH 只动主句段.
- NEVER push without approval.

## Acceptance

1. `README.md` H1 下方含结果导向主句 (D1 verbatim 或措辞微调); package-manager wedge 仍在副标题 (grep 确认两者**共存**).
2. `README.md` 含一条「First 5 Minutes」**linear** quickstart (install → 跑第一个 workflow → 裸 `harnessed` you-are-here → resume), step 3 显式用零参数 `harnessed` (Phase 24); 3-Options 分层保留.
3. Operational Commands CLI 表含一行 bare `harnessed` (zero-arg you-are-here + NEXT).
4. 无 broken link / 锚点; mermaid / badge 不破坏 (EN + ZH).
5. TDD 跳过理由已记录 (D5); docs-only 无自动化测试 — 验收靠 grep 锚点 + 人读.
6. `README-cn.md` 一句话定位段同步为 D1 结果导向主句中文版 (保留命令/术语英文); wedge 副标题保留; ZH quickstart/CLI/整体 drift **不动** (→ v10.0). `git diff` 仅 `README.md` + `README-cn.md`.
