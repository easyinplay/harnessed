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
- [ ] commit + push;tag v4.28.0(等用户确认)
- [ ] 发版后:installer-smoke CI 首次实证;真实 curl/irm 路径 dogfood;
      排队:Slice 3(npm per-platform 包)、E1 签名重估(安装器已落地,重估条件成熟)
