# task_plan — 4.31.0 eval Slice A:编排器行为回归 trap suite

status: ready-to-execute
spec SoT(两层,冲突时下层赢):
- CEO plan:`~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-13-eval-trap-suite-slice-a.md`
  (CLEARED,8 任务成册,全部实现语义已钉死 — exit=ExitError/golden 归一化/错误三型/
  $unset/coverage 派生/dist 执行物/#2 出范围)
- 设计文档:`~/.gstack/.../easyi-main-design-20260713-120000.md`(APPROVED,P1-P3)
治理门:office-hours + plan-ceo-review 双道走毕(spec loop 2 轮 + OV 6 点,零未决)。

## Waves
- **Wave 0 = T1**(独立 commit,先行):checkpoint.ts/gates.ts action body 行为保持式
  提取(runCheckpointComplete/Start/Fail + runGatesPlan,throw ExitError 注入)。
  验收:零测试文件修改 + 全量绿(必要);等价性由 Wave 2 mutation 验收补行为级证明。
- **Wave 1 = T2-T4 + T8**:schema(+regen 铁律)→ runner/golden → CLI(--json/--coverage/
  --update-golden/::error)→ vitest 薄壳。
- **Wave 2 = T5-T7**:种子 5-8 → ci.yml eval 步 → verify-eval-traps.mjs 一次性验收
  (留证本 phase SUMMARY)。
- T-final(主 session):全量验证 + CHANGELOG 4.31.0 + bump + progress + commit/push;
  tag 等用户确认;发版后 TODOS/intel 回填(B4 → IMPL Slice A)。
