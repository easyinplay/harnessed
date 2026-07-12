# progress — 4.28.0 B3 Slice 2:一行安装器

- [x] 立项:Phase 3 CEO review 覆盖 + 用户确认紧跟;三个子任务级决策保守锁定并声明
- [x] 灰区协议实战回流:fork 真机演习证伪 D2(~/.harnessed = 遗留根,启动迁移蒸发落位物),
      STATUS: NEEDS_CLARIFICATION 停驻 → 主 session relay → 用户裁决 D2-rev = 平台惯例
      (unix ~/.local/bin,Windows %LOCALAPPDATA%\harnessed\bin)→ SendMessage 续跑
- [x] T1-T3 + README fork 实施(install.sh / install.ps1 / installer-smoke CI / Quick
      Install 节;顺带修 PATH 指令自包含化 + 断言路径同步)
- [x] 真机验证:seam 安装全流程 + 持久性三次启动核验(迁移不再触碰)+ doctor 首次实证
      compiled 更新检查真实 GitHub 路径;MINGW 门 exit 1 正确指引
- [x] 主 session 复验:vitest 2121/0;tsc 0;lint 0;bash -n OK;gates 7/7
- [x] CHANGELOG `## [4.28.0]` + bump
- [x] commit `1542605` + push;tag v4.28.0 已发(用户确认)
- [x] 发版实证:publish success + npm 4.28.0 上线;installer-smoke 首跑 unix 双平台
      断言误报(runner 的 ~/.local/bin 本在 PATH,安装器正确走零摩擦分支,断言硬要
      export 片段)→ `5e74b31` 一行修(对齐 windows 侧双形态)→ 三平台全绿;
      复跑一次 windows 既有 token-budget 测试超时(runner 负载抖动,非回归)→ rerun 绿
- [ ] 排队:Slice 3(npm per-platform 包)、E1 签名重估(安装器已落地,重估条件成熟);
      用户真实 curl/irm 路径 dogfood
