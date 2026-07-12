# progress — 4.23.2 gate eval fail-closed + skip-sub 别名(issue #5)

- [x] issue #5 核实与根因修正(缺陷 1 = gateContext 漏 root-flat 变量,非 yaml 错;
      缺陷 2 = 斜杠名 vs clause 内名不匹配且无警告)
- [x] task_plan 锁定(D1-D6)
- [x] T1-T4 fork 实施(TDD 红 13 → 绿;12 文件;ADR 0029 Amendment 改道 ADR 0038 —
      0029 在 CI A7 守恒环内不可追加,fork 正确规避;A7 环止于 0032,0038 无需动
      ci.yml 无需 tag,与 0033-0037 先例一致)
- [x] 审计测试确认缺失变量仅 is_critical_release 一个;expr-eval 实证 object member
      缺失静默 false,裸标识符是唯一 fail-open 面
- [x] T5 主 session 复验:vitest 全量 2026 passed / 0 failed;tsc 0;pnpm lint exit 0;
      gates 7/7;fork 侧真实 CLI dogfood 四场景(普通 verify skip multispec /
      skip 别名生效 / bogus 名警告 / --context opt-in 恢复 fire)
- [x] CHANGELOG `## [4.23.2]` + bump 4.23.2
- [x] commit `6e244b5` + push main;issue #5 回复(D1 分歧 + D5 声明)并已 CLOSED(Fixes #5)
- [ ] tag v4.23.2(等用户确认)

## D5 透明声明(待用户裁决可改)
issue "期望"节要 paranoid 默认也不 fire;本次保留 `is_critical_module: true` 默认偏置
(v4.1.2 有意设计:单 reviewer safety-net 成本低,4-specialist multispec 才必须门住),
--skip-sub paranoid / verify-paranoid 修好后可一键跳过。用户如要求连 paranoid 默认关,
改 gateContext 一行 + 相应测试。
