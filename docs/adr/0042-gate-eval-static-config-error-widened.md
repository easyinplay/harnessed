# ADR 0042 — gate eval 的 fail-closed 判据扩到三类静态配置错误;更正 ADR-0038 的一条前提

- **Status**: Accepted
- **Date**: 2026-10-07
- **Supersedes**: none — **Amends** ADR-0038 的 Decision 第 1 条(判据从单一 `undefined variable`
  扩到三类),并**更正其 Context 中一条被实测证伪的前提**。按 ADR-0038 自己采用的守恒做法
  (它 amend ADR-0029 时也以新 ADR 承载、不改其正文),这里同样不改 0038 的正文。
- **Relates to**: ADR-0029(fallback 3 铁律 + fail-soft)、ADR-0038(本 ADR 所 amend)、
  GitHub issue #5、`.planning/phases/51-ecc-orchestration/findings.md` F7(4.32.23 spike 实测)
- **Milestone**: (v16.0 收口后,无活动 milestone)

## Context

ADR-0038 把「gate 表达式引用了求值上下文里没有的**裸标识符**」定为静态配置漂移并 fail-closed。
它的 Context 同时写下一条分型依据:

> 根因分型:expr-eval 的 "undefined variable" 只发生在**裸标识符缺失于求值上下文**时
> (object member 缺失静默求 false,4.23.2 实证)

**括号里那半句不成立。** 4.32.23 的 spike 发现、本 ADR 在本仓 pinned 的 expr-eval 上复测确认:
object member 缺失并不总是静默求 false —— 一旦经 `in` 运算符访问,expr-eval 会去取该成员的
`.length`,于是抛 `TypeError`:

```
'x' in subtask.missing   → TypeError: Cannot read properties of undefined (reading 'length')
'x' in subtask.nul       → TypeError: Cannot read properties of null (reading 'length')
subtask.missing.length>0 → Error: parse error [1:23]: Expected TNAME
bareMissing == true      → Error: undefined variable: bareMissing     ← 0038 已覆盖的那一类
```

`TypeError` 的消息不含 `undefined variable`,因此不匹配 `isUndefinedVariableError` 的正则,
落回 ADR-0029 的 fail-soft —— **子项照 fire**。这正是 issue #5 的形状(gate 越贵、误触越贵),
只是触发路径换了一条:0038 封住了裸标识符那条,`in` 那条仍开着。

该缺陷此前**未被触发**,因为当时没有任何 judgment 用数组 fact。它是潜伏的:引入第一个数组
fact 的那次改动会同时把它激活,而那次改动的作者没有理由去看这条判据。

## Decision

1. 判据改名 **`isStaticGateConfigError`**,语义从「未定义变量」扩为「gate 表达式与它被给予的
   上下文之间的**静态漂移**」—— 共同点是**重试永远不会好**,所以当成「gate 已 fire」一定是错的。
   覆盖三类(均为实测消息,不是手写假设):
   - 裸标识符缺失 → `undefined variable: <name>`
   - `in` 访问缺失 / null 成员 → `Cannot read properties of (undefined|null) (reading 'length')`
   - 表达式无法解析 → `parse error [...]`
2. **刻意不纳入** `Expression must evaluate to boolean, got <t>`:该错误**可能**取决于某个 fact
   的运行时类型,因而不必然是静态的;而 yaml 语料那一面已由下述审计守住。
3. 三处 catch(`gates.ts` / `masterOrchestrator.ts` / `run.ts`)的 warn 文案一并泛化 ——
   原文只说「references a variable missing from the gate context」,对后两类是错的指引。
4. 改名同步 4 处调用点;旧名不保留别名(别名会腐烂成两套说法)。

## Consequences

- **第一道防线不变**:`tests/workflow/judgmentContextAudit.test.ts` 遍历
  `workflows/judgments/*.yaml` 全部 `fires_when` / `skips_when`,对 `buildDefaultGateContext`
  逐个求值断言零抛错。三类里的任意一类只要出现在 yaml 语料且在默认上下文下就会抛,CI 当场红。
- **本 ADR 是第二道防线**,它守的是审计**守不住**的那个缺口:某个 fact 在默认审计上下文里
  **存在**、却对某个真实任务缺失或为 null —— 审计通过,运行时抛,此前落 fail-soft。
- fail-closed 的方向性代价:一个本该 fire 的子项,若其 gate 表达式写错,现在**不会**跑。
  这是有意的 —— 配置错误应当表现为「没跑 + 醒目 warn」,而不是「跑了最贵的那条路」。
- 判据变宽带来的误判风险:三类消息都来自 expr-eval 自己,且都在 `GateEvalError` 包装之内
  (`e instanceof GateEvalError` 仍是前置条件,所以同名消息的裸 `Error` 不会命中)。
  正常求值路径不受影响,有「满足的 `in` 照常求值」一条测试钉住。
- 若将来升级 expr-eval,这三条消息文本属**外部契约**:
  `tests/workflow/exprBuilder.test.ts` 的 15-17 三条用例断言的是**真实抛出的文本**而非手写消息,
  所以上游一旦改措辞,它们会红并点名,而不是静默退回 fail-soft。

## 证据(三层,逐层都验过「反过来会红」)

| 层 | 位置 | 验的是 |
|---|---|---|
| 判据 | `tests/workflow/exprBuilder.test.ts` 15-18 | 三类消息命中、满足的 `in` 照常求值(变宽没引入误判) |
| CLI | `tests/cli/gates.test.ts` cell 17a(3 例) | 贵子项落 `skip[]` 而非 `fire[]`;stderr 不含 `fail-soft` |
| 产物 | `fixtures/eval/adr0042-in-missing-member/` | 跑 **dist** 的 `harnessed gates`,doctored judgments 用 `'release' in phase.missing_array_xyz` |

产物那层的红是决定性的:把判据收回 ADR-0038 的旧样、重建 dist 再跑该场景,
`verify-multispec` 出现在 **FIRE** 列表,warn 写着 `firing sub as if gate=true (ADR 0029 fail-soft)`
—— 即 4-specialist Agent Team 在一次普通 verify 上跑起来,issue #5 原样。

顺带:skip reason 的固定字面量 `misconfigured (undefined variable)` 对后两类会贴错标签,
改为 `misconfigured (expression/context drift)`(两处:`gates.ts` / `masterOrchestrator.ts`)。
`issue5-undefined-variable` 的 eval golden 因此重录 2 行,diff 已逐行审过(fire/skip 列表与顺序零变化)。
