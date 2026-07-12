# task_plan — 4.28.0 B3 Slice 2:一行安装器(curl / PowerShell)

status: ready-to-execute
spec 上游:CEO plan `~/.gstack/.../ceo-plans/2026-07-12-b5-phase3-slice1.md`(Phase 3 全局
已过 CEO review;本切片 = 其 Deferred 列表首项,OV1 裁决"紧跟不拖";TODOS.md P1 行)。
依赖已就绪:资产命名契约 + per-asset .sha256(4.27.0 交付,release 实证 6 资产)。

## 锁定决策(子任务级,保守默认 + 透明声明)
- D1 脚本形态:repo 根 `install.sh`(macOS/Linux)+ `install.ps1`(Windows);
  入口约定 `curl -fsSL https://raw.githubusercontent.com/easyinplay/harnessed/main/install.sh | bash`
  与 `irm .../install.ps1 | iex`(raw main 分支 — 脚本自身逻辑要薄且稳,重逻辑留给二进制)。
- D2(REVISED,用户裁决 2026-07-12):安装目录 = **平台惯例位置** — unix `~/.local/bin/harnessed`
  (现代发行版多已在 PATH),Windows `%LOCALAPPDATA%\harnessed\bin\harnessed.exe`。
  原 `~/.harnessed/bin` 被真机证伪:该目录是遗留根,`migrateLegacyHarnessedRoot()`
  (harnessedRoot.ts:97-140)在二进制首次启动即整目录改名,落位物当场蒸发。
  平台惯例位与迁移逻辑永久解耦、harness 无关(不绑 claude 宿主目录);update 的
  execPath 自替换天然兼容。
- D3 PATH 策略(最小侵入):unix 检测 PATH 含否,不改 shell rc,只打印精确 export 行
  (按 $SHELL 给 bashrc/zshrc 对应 snippet);Windows 交互 → consent 后
  [Environment]::SetEnvironmentVariable user 追加,非交互/拒绝 → 打印手动指令。
- D4 流程:平台/arch 检测(darwin 仅 arm64,x64 明确报不支持)→ GitHub releases/latest
  解析 → 下载二进制 + .sha256 → 校验(sha256sum/shasum/CertUtil 按平台)→ 安装 →
  chmod 755 → `--version` smoke → PATH 提示 → 打印 next steps(`harnessed setup`)。
  已装则原地覆盖(幂等;后续更新走 `harnessed update`,脚本尾注明)。
  任一步失败:醒目报错 + 不留半装状态(temp 下载,验证后才落位)。
- D5 验证:CI 新 installer-smoke(3-OS matrix)— 本地资产源 seam(env
  `HARNESSED_INSTALLER_SOURCE_DIR`,同 update 演习哲学,零网络)跑完整安装 →
  断言落位 + --version + PATH 提示输出;shell 侧 bash -n / PSScriptAnalyzer 可用则 lint。
- D6 文档:README 安装节改为一行安装器优先(npm 并列保留 — 并行铁律);
  CHANGELOG 4.28.0。E1 签名维持 defer(TODOS 已记 SmartScreen 摩擦)。

## T1 install.sh(TDD:bats 不引入,重逻辑用 CI smoke + 本地 seam 断言;语法 bash -n)
## T2 install.ps1(同上;pwsh -NoProfile -Command 语法检查)
## T3 CI installer-smoke job(3-OS,本地源 seam)
## T4 README 安装节 + 收尾:vitest 全量(不应有 TS 面变化,回归确认)+ gates 7/7 +
     CHANGELOG `## [4.28.0]` + bump + progress;commit 即 push;tag 等确认。
