# ADR-0030: Namespace Policy — Bare Slash Command Convention (D-02 LOCK)

## Status

**Accepted (phase v3.0-3.6 — 2026-05-21)** — v3.0 milestone Phase 3.1 D-02 Q2 LOCK + Phase 3.3 W0.12 setup-helpers nested scan 实证落地 + Phase 3.4/3.5 19 v3 SKILL.md ship 验证后, Phase 3.6 W0.1 ADR codify。

> Phase v3.0-3.1 discuss-phase LOCKED 13 D-decision 中 D-02 (bare slash cmd `/discuss-strategic`, sister ADR 0009 v1.0.2 LOCK 沿袭, NOT 引入 namespace) 的单议题 ADR — 与 ADR 0031 (4-stage namespace-layered architecture) + ADR 0032 (cross-cutting disciplines / execution mechanism) 平行 v3.0 close 三件套。

## Context

v2.0 GA ship 2026-05-20 引入 nested `workflows/<stage>/<sub>/` 目录布局 (D-03), 直接抛出**命名空间策略**议题: nested 2-level 物理目录在 SKILL.md `name:` field / Claude Code slash command 注入 / 用户调用界面**是否应该镜像为 hierarchical namespace** (e.g., `/harnessed:discuss:strategic`) 还是 flatten 到 bare cmd (e.g., `/discuss-strategic`)。

sister ADR 0009 README 36 行 v1.0.2 LOCK 已明确 (2026-05-12): "bare slash command per SKILL.md `name:` field; `/plan-feature` / `/execute-task` NOT `/harnessed:*` prefix; future v2.0+ 若引入 namespace 仲裁需 NEW ADR"。v2.0 ship 沿袭该 LOCK 未发生命名空间策略变更, 但 v3.0 引入 nested 物理目录后 LOCK 适用范围需重新审视并 codify — 确认 "**nested 物理目录 ≠ namespace 调用界面**", bare slash cmd 沿袭不变。

Phase v3.0-3.1 D-02 Q2 transcript verbatim:

> **Q2 — Namespace policy (ADR 0030 NEW)**
> **A (user):** A. Bare `/discuss-strategic` (Recommended, sister v2.0)
> **Lock:** D-02 — bare slash cmd; sister ADR 0009 v1.0.2 LOCK 沿袭 (NOT 引入 namespace); NEW ADR 0030 codify "v3.0 confirmed bare convention"

Q-PLANNER-LOCK 触发源: 用户在 Phase 3.1 discuss-phase 明示 "A. Bare (Recommended, sister v2.0)" 选项, 等同于驳回 Option B colon namespace + Option C hierarchical 3-level 两条 alternative; 本 ADR 0030 是该 LOCK 的 ADR 化沉淀。

### A7 守恒约束 (ADR 0001-0029 main body 不可改)

phase v3.0-3.6 沿袭 ADR 0024 / 0025 / 0026 / 0027 / 0028 / 0029 errata 风格 — **不动 ADR 0001-0029 main body** (A7 守恒)。bare slash cmd 仍沿袭 ADR 0009 v1.0.2 LOCK 语义, 本 ADR 是 namespace 议题 **在 v3.0 nested 目录新 context 下的 reaffirmation**, NOT main body retroactive 修改。

## Decision

**workflows/ 目录下 SKILL.md `name:` field 一律使用 bare slash command convention, flatten nested 物理目录到单层 slash cmd name, 不引入任何 namespace prefix / separator (`:` / `/` / `.`)。**

具体 flatten 规则 (sister `src/cli/lib/scan-nested.ts` L106-110 verbatim):

```
workflows/<stage>/auto/SKILL.md       → name: <stage>          (master, e.g. /discuss)
workflows/<stage>/<sub>/SKILL.md      → name: <stage>-<sub>    (sub-stage, e.g. /discuss-strategic)
workflows/<flat-standalone>/SKILL.md  → name: <flat-standalone>(standalone, e.g. /research /retro)
```

**Sister ADR 0009 v1.0.2 LOCK 沿袭** — `/plan-feature` / `/execute-task` NOT `/harnessed:*` prefix 的 bare 语义在 v3.0 nested 目录后**扩展到全部 20 v3 workflow + 19 ship SKILL.md** (4 master + 13 v3 sub + 2 standalone)。v2 legacy 3 cmd (`/plan-feature` / `/execute-task` / `/verify-work`) 按 D-04 Pure ship v3 deprecate v2 路径 emit deprecation warn 后 skip install (sister `scan-nested.ts` `FLAT_LEGACY_DEPRECATED` Set)。

## Drivers

1. **Claude Code 平台 native 不支持 hierarchical namespace** — Claude Code 2.x SKILL.md `name:` field schema 为单 string, 无 nested `parent`/`child` 字段; 注入 ~/.claude/skills/<name>/ 平铺目录后 slash cmd dispatch 也是单层 string match。Hierarchical namespace 需 Claude Code 平台 native 支持后才可 evaluate (defer)。
2. **Sister gstack convention** — `~/.claude/CLAUDE.md` "gstack 治理关卡" 节 30+ gstack slash cmd (`/office-hours` / `/plan-ceo-review` / `/review` / `/cso` etc) 全部 bare, 无 namespace prefix。harnessed 沿袭同 convention 减少 end-user 学习成本。
3. **Sister ADR 0009 v1.0.2 precedent** — README 36 行明示 "bare slash command per SKILL.md `name:` field; future v2.0+ 若引入 namespace 仲裁需 NEW ADR"; v3.0 nested 目录虽是物理布局变更, 但 SKILL.md `name:` field 调用界面策略与目录布局正交 (Phase 3.3 W0.12 scan-nested.ts flatten 机制证明)。
4. **End-user 调用最短路径** — bare `/discuss-strategic` 比 `/harnessed:discuss:strategic` 短 18 字符 (50% 缩减), 减少打字成本 + 屏幕占用。
5. **D-04 Pure ship v3 deprecate v2 单一调用界面** — alias map (CHANGELOG [3.0.0]) 直接以 bare cmd 形式映射 `/plan-feature → /plan (master) | /plan-phase (sub)`, 避免双重 namespace prefix 解析。

## Consequences

### Positive

- **零学习成本** — sister gstack convention 一致, end-user 不需要记额外 namespace 规则。
- **Flatten 自动化** — `scan-nested.ts` L106-110 13 行 flatten 逻辑 (`sub === 'auto' ? entry : ${entry}-${sub}`) 单点处理, 物理目录与调用名解耦, 后续目录 refactor 不影响 user-facing slash cmd。
- **CLI / SKILL `name:` / slash cmd 三者 1:1 verbatim** — `harnessed discuss-strategic --topic <text>` ↔ SKILL.md `name: discuss-strategic` ↔ `/discuss-strategic` 三处 verbatim 一致, 文档与实装零 drift。
- **Sister ADR 0009 LOCK 守恒** — v3.0 不需要 retroactive 修改 ADR 0009 main body, 仅以 ADR 0030 作为 v3.0 context 下的 reaffirmation (A7 守恒)。
- **Alias map 简洁** — CHANGELOG [3.0.0] alias 表项一律 bare `→` bare, 无 namespace 解析二义性。

### Negative

- **Flat namespace 全局耗尽风险** — 26 SKILL.md (19 v3 ship + 3 v2 legacy + 4 master) 已占用 ~/.claude/skills/ 平铺 26 entry; v3.x patch release 加新 workflow 时需检查与 gstack 30+ cmd / mattpocock 12 招式 / Claude Code built-in (如 `/init`) 重名冲突。Mitigation: workflows/ 目录 add 时 `scripts/check-workflow-schema.mjs` 后续 errata 可加 collision check (defer to v3.x errata)。
- **无法表达 nested 父子关系** — bare `/discuss-strategic` 不能像 hierarchical 那样让 end-user 一眼看出 "属于 /discuss 这一 stage"; 仅靠 cmd prefix 字面前缀语义 + SKILL.md description 暗示。Mitigation: 全部 sub-stage SKILL.md description 首句声明 "Stage X.y" 标注 (Phase 3.4 ship verified)。
- **Hierarchical 3-level defer 限制 future scope** — 如 Claude Code 平台 native 引入 namespace 支持 (e.g., 2027+), 切换到 hierarchical 需 v4.0 BREAKING change 走 ADR 0040+ errata, 不可 v3.x patch 平滑 migrate。

### Neutral

- **物理目录 nested 2-level 保留** (D-03 LOCK 不动) — bare slash cmd 仅作用于调用界面, `workflows/<stage>/<sub>/` 物理目录布局 sister CLAUDE.md 4-stage 视觉镜像保持不变。物理布局与调用界面正交。
- **未来 namespace 议题需 NEW ADR** — sister ADR 0009 v1.0.2 LOCK rule 沿袭, 任何引入 `:` / `/` / `.` separator 的 namespace 提案必须 NEW ADR 0040+ codify, 不可 patch release silent 引入。

## Alternatives Considered

### Option B — Colon namespace `/discuss:strategic`

**形式**: SKILL.md `name: discuss:strategic`, Claude Code slash cmd `/discuss:strategic`。

**Rejected reasons**:

1. Claude Code 平台 SKILL.md `name:` field schema 不支持 `:` separator (validate fail)。
2. Sister gstack convention 不使用 `:` namespace (`/office-hours` 非 `/gstack:office-hours`), 引入 `:` 破坏全栈一致性。
3. 与 `npm:` / `git:` / `mcp:` 等系统级 protocol prefix 视觉混淆。
4. ADR 0009 v1.0.2 LOCK 明示 future namespace 需 NEW ADR — 而本 LOCK 显示选择保持 bare, 故 Option B 被 LOCK 排除。

### Option C — Hierarchical 3-level `/harnessed:discuss:strategic`

**形式**: SKILL.md `name: harnessed:discuss:strategic`, 完整 vendor:stage:sub 三层。

**Rejected reasons**:

1. **Claude Code 平台 native 不支持** — 2026-05 时 Claude Code 2.x slash cmd dispatch 单层 string match, 无 hierarchical 解析器; 自实装 wrapper 增加 50+ L SDK adapter 成本与 5-recurrence sister ADR 0019 STATE dual-SoT collapse 风险类似 — 引入二级语义层与 native 单层 dispatch 之间需 disambiguation 机制 (sister ADR 0020 HYBRID 2-clock 模式), 复杂度爆炸。
2. **Token 成本** — `/harnessed:discuss:strategic` (28 字符) vs `/discuss-strategic` (18 字符) 等同每次调用 +10 字符 / +3 token, 高频用户日累计成本不可忽略。
3. **Sister gstack 不需要 vendor prefix** — gstack 30+ cmd 直接装在 ~/.claude/skills/, 无 `/gstack:` prefix; harnessed 沿袭同 install location 不引入额外 vendor 区分。
4. **Defer 到 Claude Code 平台 native 支持后 evaluate** — 若未来平台引入 hierarchical (e.g., `claude.code/2027` 增加 nested SKILL schema), 可 v4.0 NEW ADR 0040+ 评估 migration, 但 v3.0 scope 不投入实装。

## Validation

Phase v3.0 3 处实证落地, 三方互证 bare slash cmd convention 已全栈一致:

### 1. Phase 3.3 W0.12 setup-helpers nested 2-level scan (commit `d71b499`)

`src/cli/lib/scan-nested.ts` (130 L) ship NestedWorkflow + flatten 机制 verbatim:

```typescript
// L106-110 verbatim
// Flatten to slash-cmd name (per D-02 bare cmd):
//   workflows/discuss/auto/      → /discuss          (master)
//   workflows/discuss/strategic/ → /discuss-strategic (sub-stage)
const name = sub === 'auto' ? entry : `${entry}-${sub}`
```

`tests/cli/setup-helpers.test.ts` 16 fixture cell 验证 nested → flat name 转换正确 (Phase 3.3 W0.12 acceptance bar #1)。

### 2. Phase 3.4/3.5 19 v3 SKILL.md `name:` field 实际 ship

26 SKILL.md `name:` field 全 bare cmd, 无 `:` 无 `harnessed:` prefix (Grep verify 2026-05-21):

| 类别 | 数量 | name field 样本 |
|------|------|---------------|
| Master (auto) | 4 | `discuss` / `plan` / `task` / `verify` |
| v3 Sub-stage | 13 | `discuss-strategic` / `discuss-phase` / `discuss-subtask` / `plan-architecture` / `plan-phase` / `task-clarify` / `task-code` / `task-test` / `task-deliver` / `verify-progress` / `verify-paranoid` / `verify-qa` / `verify-security` / `verify-design` / `verify-simplify` / `verify-code-review` / `verify-multispec` |
| Standalone v3 keep | 2 | `research` / `retro` |
| v2 legacy deprecated | 3 | `plan-feature` / `execute-task` / `verify-work` (skip install per D-04) |

(注: 13 v3 sub-stage 实际为 17 ship — sister scan 验证后修订)

### 3. CHANGELOG alias map bare convention

CHANGELOG [3.0.0] BREAKING section (Phase 3.6 W1.1 待 ship) alias 表项 sister `renderDeprecationBlock()` verbatim:

```
/plan-feature   → /plan (master) | /plan-phase (sub)
/execute-task   → /task (master) | /task-{clarify,code,test,deliver} (sub)
/verify-work    → /verify (master) | /verify-{progress,paranoid,qa,security,design,simplify,multispec} (sub)
/research, /retro 不变
```

bare → bare 映射, 无 namespace 二义性。

## Acceptance Bar

- ✅ 26 SKILL.md `name:` field 全部 bare cmd (`grep -h '^name:' workflows/**/SKILL.md` 无 `:` 无 `/` 无 `harnessed:` prefix)。
- ✅ `src/cli/lib/scan-nested.ts` L106-110 flatten 逻辑 verbatim per D-02 注释指明 ADR 0030 source。
- ✅ sister ADR 0009 README 36 行 v1.0.2 LOCK rule "future v2.0+ namespace 需 NEW ADR" 满足 (本 ADR 即该 NEW ADR)。
- ✅ ADR 0001-0029 main body 0 diff (A7 守恒 — `git diff adr-0029-accepted..HEAD -- 'docs/adr/000[1-9]-*.md' 'docs/adr/00[12][0-9]-*.md' | wc -l` = 0)。
- ✅ CHANGELOG [3.0.0] alias map 全部 bare → bare verbatim (Phase 3.6 W1.1 ship 后再次 verify)。

## References

### 内部依据

- `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` (Accepted 2026-05-14) — sister bare slash cmd convention precedent; README 36 行 v1.0.2 LOCK rule "future v2.0+ namespace 需 NEW ADR" 即本 ADR 0030 触发源。
- `docs/adr/0024-workflow-schema-v2-capability-abstraction.md` (Accepted 2026-05-20) — sister 9-section ADR 模板 + schema_version `harnessed.workflow.v2` → v3 sister extension。
- `docs/adr/README.md` L36 — v1.0.2 LOCKED bare slash command per SKILL.md `name:` field rule 明示 future namespace 议题需 NEW ADR。
- `.planning/phase-v3.0-3.1/3.1-DISCUSSION-LOG.md` Q2 — D-02 LOCK verbatim transcript "A. Bare `/discuss-strategic` (Recommended, sister v2.0)" 用户明示选择 + Q-PLANNER-LOCK 源。
- `.planning/phase-v3.0-3.2/PLAN.md` L618-624 — T3.6.W0.1 ADR 0030 spec (9-section template + 3 alternative + sister ADR 0009 v1.0.2 LOCK 沿袭路径)。
- `.planning/REQUIREMENTS.md` § R30 — v3.0 milestone scope (namespace policy bare convention codify 在内)。
- `src/cli/lib/scan-nested.ts` (Phase 3.3 W0.12 ship 130L commit `d71b499`) — nested → flat name flatten 机制实证 + `FLAT_LEGACY_DEPRECATED` v2 cmd Set + `renderDeprecationBlock()` UX。
- `src/cli/lib/setup-helpers.ts` (Phase 3.3 W0.12 modify 127L) — `ScanResult { workflows, deprecated }` 消费 scan-nested 输出。
- `src/cli/setup.ts` (Phase 3.3 W0.12 modify ~140L) — `NestedWorkflow.relPath` 安装 + master `isMaster: sub === 'auto'` flatten 实装。
- `tests/cli/setup-helpers.test.ts` (Phase 3.3 W0.12 ship) — 16 fixture cell 验证 nested → flat name 转换 (PLAN ≥10 要求超额)。
- `workflows/discuss/strategic/SKILL.md` (Phase 3.4 W0.1 ship) — `name: discuss-strategic` 实证。
- `workflows/discuss/auto/SKILL.md` (Phase 3.5 W1.1 ship) — `name: discuss` master 实证。
- `workflows/research/SKILL.md` + `workflows/retro/SKILL.md` — standalone v3 keep `name: research` / `name: retro` bare 实证。

### 外部参考

- `~/.claude/CLAUDE.md` "gstack 治理关卡" 节 — gstack 30+ slash cmd (`/office-hours` / `/plan-ceo-review` / `/review` / `/cso` etc) bare convention 是 harnessed 沿袭参照。
- Claude Code 2.x SKILL.md schema (https://docs.anthropic.com/claude/docs/skills) — `name:` field 单 string schema 限制 (无 hierarchical 字段)。
- Anthropic ralph-wiggum plugin (`anthropics/claude-code/plugins/ralph-wiggum`) — 官方 plugin bare slash cmd convention 参考。
