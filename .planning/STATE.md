---
gsd_state_version: 1.0
milestone: none
milestone_name: (none — post-milestone patch/phase arc 4.13.0→4.28.0)
status: no-active-milestone
last_updated: "2026-07-12T13:00:00.000Z"
last_activity: 2026-07-12
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Latest shipped (npm)**: **v4.28.0** 2026-07-12. Since v13.0 (4.12.0, last formal milestone) a 16-version post-milestone arc, three sub-arcs (detail: CHANGELOG per version + `.planning/phases/_patch-*/_phase-*` dirs):
  1. **Setup 治理 + cross-harness**(4.13–4.18):setup 五根因修复(串行化/stdin/进度/rescue/表格)→ 14/14 全绿;codex 全对齐;环境免疫(WSL bash 探针/中性 spawn cwd/hook schema)。
  2. **/auto 合规 + 双守卫 + issues**(4.21–4.26):checkpoint intent/perturn 护栏/evidence guard 多基解析;GateGuard env 豁免单通道;issues #2-#5 关闭(skill 完整性五态台账+自愈+备份、deferrable relay 门、gate undefined-variable fail-closed + skip-sub 别名);intel 五家对照借鉴(备份后覆盖/Red Flags/注入 delta/严重度分级/串行次序守卫)。
  3. **B 路线 Phase 3**(4.27–4.28):`harnessed update` compiled 分支(sha256/原子替换/回滚网)+ hook 自包含(inject-state 子命令)+ 一行安装器(install.sh/ps1 → 平台惯例目录)+ installer/update CI 演习(3-OS)。资产命名契约冻结公共 API。CEO plan:`~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-12-b5-phase3-slice1.md`。

## Current Position

- **Next(等用户信号)**:B 路线 Slice 3(npm per-platform 包 — 价值/成本存疑,defer 建议已呈)· E1 签名重估(证书采购,用户决策)· 4.13–4.28 弧线补记 retro/milestone 归档(phases/ 现 61 目录,_patch/_phase 未归档)。全清单:`TODOS.md`(4.28.0 起为 defer 记录的家)。
- **进行中债**:README 镜像同步(9 语言,fork 进行中)。

## Accumulated Context

### Invariants (must not break)

- en-default byte-identical; claude default install byte-identical; additive-only (no en-behavior mutation).
- KARPATHY-minimal surgical diffs; full gate green(vitest 基线 2121;`--no-file-parallelism` 为权威口径); Windows CI green on 3 platforms.
- Biome preempt before every TS/JS commit; `pnpm lint` 全域真实退出码(禁 `| tail` 掩蔽)。
- Every `.planning/` edit self-exemplifies doc-discipline (STATE digest <100 lines; overview pointers not inlined narrative)。
- **Commit 即 push main**(2026-07-05 坏盘事故后用户批准);tag/发版仍需用户确认。
- `~/.harnessed` 是遗留根,永不可作安装目标(启动迁移蒸发陷阱,4.28.0 真机实证)。
- typebox 改动必须 `pnpm build && pnpm build:schema` 并提交 schemas/;vi.mock factory 模块禁加新导出(独立新模块)。

### Open todos / carry-forward (non-blocking)

- `TODOS.md`(repo 根,4.28.0 起):E1 签名 / E3 channel / --rollback / proxy / Slice 2✅(已发)/ Slice 3 / eval harness / ambiguity 阈值。
- 历史遗留(v9.0 系):`migrateLegacyHarnessedRoot` 未 descriptor-routed、残余 `~/.claude` hardcodes;doc-hygiene:phases/ 09–44 + _patch/_phase 目录待归档 pass。
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`。

## Session Continuity

- **本弧线方法论状态**(2026-07-12):relay 契约(4.23.1)首次完整实战 — 4.28.0 安装器 fork 真机证伪 D2 落位目录 → `STATUS: NEEDS_CLARIFICATION` 停驻 → 主 session relay → 用户裁决 → SendMessage 续跑。gate 治理(4.23.2 fail-closed 分型 + judgments 审计测试)与 skill 完整性(4.23.0 台账 + 4.24.0 备份)为当前防线基座。
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session;fork subagent + TDD + 主 session 复验为本弧线标准 cadence;subagent 产出必须主 session 亲验(vitest/tsc/gates 实跑)。
- **发版 SOP**:CHANGELOG(Edit 工具,禁 heredoc)→ bump → commit+push → tag(等确认)→ 后台 watch CI+publish → 收尾确认;三平台二进制 + per-asset .sha256 随 release。
