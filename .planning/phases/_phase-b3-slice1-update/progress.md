# progress — 4.27.0 B3 Slice 1

- [x] P2=B5 立项:/plan-ceo-review 完整跑毕(SELECTIVE EXPANSION;spec loop 3 轮 18 修
      PASS 8.5/10;深审 F1-F3 + outside voice OV1-OV4 共 7 项用户裁决;NO UNRESOLVED)
- [x] CEO plan 定稿(~/.gstack/.../ceo-plans/2026-07-12-b5-phase3-slice1.md,
      GSTACK REVIEW REPORT 收尾)+ TODOS.md 新建 + tasks JSONL(7 tasks)
- [x] 用户裁决 D4:跳过 /plan-eng-review,直接实施(spec loop 已前置吸收)
- [x] T1-T6 fork 实施(红 14 → 绿;17 文件 +43 cell;真机 Windows 冒烟三连:dry-run
      8 步预览零残留 / 真实 swap + 回滚网就位 + .bak EPERM 留档按设计 / inject-state
      子命令真实输出;4 处保护性偏差有记录:gc compiled 门控、成功后 gc 不扫自身 .bak、
      lazy thunk ESM 形态、ci smoke 排除 .sha256)
- [x] T-final 主 session 复验:vitest 串行权威 2121 passed / 0 failed;tsc 0;lint 0;
      build OK;gates 7/7;diagnostics 整墙报错经验证均为陈旧快照
- [x] T7:CHANGELOG `## [4.27.0]`(含 4 条已知限制 + 手动 restore 文档)+ bump
- [ ] commit + push;tag v4.27.0(等用户确认)
- [ ] 发版后:CI binary-smoke update 演习首次实证(ci.yml 变更仅本地 YAML parse);
      用户机器真机 dogfood(compiled update 首次真实 GitHub 下载路径);Slice 2 安装器
      紧跟立项(OV1 裁决"不拖")
