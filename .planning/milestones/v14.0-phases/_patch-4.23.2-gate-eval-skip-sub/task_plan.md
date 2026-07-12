# task_plan — 4.23.2 gate eval 未定义变量 fail-closed + --skip-sub 别名/警告(issue #5)

status: ready-to-execute
issue #5 两缺陷,已全部代码实锤:
- 缺陷 1:`stage-routing.yaml:97` `fires_when: "... and is_critical_release == true"` 裸引用是
  **契约内**的(`src/workflow/schema/phaseFactContext.ts:134` root-flat required boolean,
  v3.3 W0.8 Appendix C 定的);真 bug 是 v4.1.2 抽出的 `buildDefaultGateContext`
  (src/cli/lib/gateContext.ts)漏了 root-flat `is_critical_release` → eval 抛
  "undefined variable" → ADR 0029 fail-soft 把配置错误 fail-open 成 fire →
  非关键发布也误触 verify-multispec(4-specialist Agent Team,最贵路径)。
- 缺陷 2:`--skip-sub verify-paranoid/verify-multispec` 静默失效 — clause.sub 是
  `paranoid`/`multispec`(yaml 内名),用户传的是面向用户的 `/verify-paranoid` 斜杠名;
  gates.ts:176 / masterOrchestrator.ts:131 Set 精确匹配不命中且无警告。

## 锁定决策
- D1(修根因,与 issue 建议 1 的"改 yaml"相反,依 schema 契约):`buildDefaultGateContext`
  加 root-flat `is_critical_release: false`(critical release 为 opt-in,--context 翻真)。
  yaml 不动。gateContext.ts 头注释"每个 fires_when 引用的变量必须存在于此"即本 bug 的自证。
- D2(issue 建议 2,fail-soft 分型):三处 catch(gates.ts:194 / masterOrchestrator.ts:150 /
  run.ts:491)区分 — expr-eval 的 "undefined variable"(静态配置 bug)→ **fail-closed**
  (视为 gate=false 不 fire,skip reason + 醒目 warn:"gate 表达式引用了上下文缺失的变量,
  按 fail-closed 不 fire;修 judgments yaml 或补 gateContext/--context");其余 runtime
  error 维持 ADR 0029 fail-soft fire。判别 helper `isUndefinedVariableError(e)` 放
  exprBuilder.ts(GateEvalError + /undefined variable/i,有测试)。
  ADR 0029 文件尾加 Amendment 节(4.23.2:undefined-variable 例外,理由 = 该类错误
  fail-open 会把成本最高子项当默认路径,与 gate 本意相反;audit 测试守静态面)。
- D3(缺陷 2 修复):skip 匹配加别名 — 请求名等于 `<master>-<clause.sub>` 时命中
  (`verify-paranoid` 在 master verify 下 → `paranoid`);循环后对未命中任何 clause 的
  skip 名打 stderr warning(`--skip-sub X ignored: not a sub of master Y; valid: <列表>`)。
  gates.ts 与 masterOrchestrator.ts 双实现(共享 helper 放 src/workflow/ 或 cli/lib 皆可,
  避免 verbatim-copy drift — 参照 gateContext.ts 抽取先例)。auto lite 路径
  `--skip-sub verify --skip-sub retro` 为直接命中,不受影响(回归测试锁)。
- D4(类杀审计测试):新 `tests/workflow/judgmentContextAudit.test.ts` — 遍历
  workflows/judgments/*.yaml 全部 triggers 的 fires_when(fallback.yaml 的 rules 键跳过),
  对 buildDefaultGateContext 逐个 evalGate,断言零 "undefined variable"(本 bug 若有此测
  在 v4.1.2 当场红)。发现新缺失变量 → 补进 default context(默认取保守值)。
- D5 透明声明(不改):verify-paranoid 默认 fire 保留(gateContext 设计偏置
  is_critical_module:true = safety-net,单 reviewer 成本低;issue "期望"节要 paranoid 也
  默认关,与 v4.1.2 既有设计冲突 — 本次不动,--skip-sub 修好后可一键跳过,收尾呈报用户)。
- D6 版本 4.23.2(patch);TDD 红先行。

## T1 测试红先行:judgmentContextAudit(D4)+ isUndefinedVariableError + fail-closed 三处
     + skip 别名/警告(gates CLI 层与 masterOrchestrator 层)+ auto lite 直接命中回归
## T2 gateContext.ts root-flat is_critical_release + D4 审计揪出的其余缺失变量
## T3 exprBuilder helper + 三处 catch 分型 + ADR 0029 Amendment
## T4 skip 别名 + 未命中 warning(共享 helper,两调用点)
## T5 收尾:vitest 全量 + tsc + pnpm lint(全域真实退出码)+ gates 7/7;
     CHANGELOG `## [4.23.2]` + bump + progress.md;commit 即 push;
     issue #5 回复(含 D1 与建议 1 的分歧说明 + D5 透明声明)+ Fixes #5;tag 等确认。
