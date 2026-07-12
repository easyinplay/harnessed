# progress — 4.15.2 WSL app-alias + 功能探针 + doctor jq 降级

- T1 DONE — WSL_STUB_RE 增补 `Microsoft\WindowsApps\bash.exe`;`probe` 注入 deps(true/false/null 三态,
  默认 realProbe = `bash -c` no-op exit-0 判定,error/unavailable → null 接受降级);env 覆盖跳过探针;
  候选统一 `usable()` 门(正则 + 探针);checkWinBash 经同一 SoT 自动获益。TDD 先红后绿(+6 用例)。
- T2 DONE — `needsPosixShell` 启发式(shell 语法正则 + coreutil 首 token 集,保守偏 posix);
  win32 posixShell 分支降级为能力提示,纯 exe verify(ctx7 --version)走 cmd.exe。TDD(+3 用例)。
- T3 DONE — `keptExisting` string[] → {name, reason}[](StepBResult + ForceUpdateReclassification +
  reclassify + printGrouped note `refresh failed: <reason≤90> — prior version retained`)。
- T4 DONE — `sanitizeOutputTail` 共享(verifyMessage.ts;ASCII-only 保持原 doctor 契约 — CP936 乱码
  与合法 CJK 不可区分,宁可全剥离不嵌可疑字串);formatVerifyFail / spawn 超时消息 / checkWinBash 三处消费。
- T5 DONE — jq 调查:消费方仅 `audit-log --filter`(spawn jq,自带 ENOENT 降级提示 i18n key
  audit_log.jq_missing)与 ralph-loop manifest notice(Windows 运行时);非 setup/核心依赖 →
  fail 降 warn + install_commands(winget/brew/apt 按平台)进 auto-install。
- T6 DONE — vitest 全量 1800 passed / 0 failed(202 files,净增 +9);tsc 0;biome clean
  (残留 1 warning 为 HEAD 既有未触碰文件);scripts/check-*.mjs 7/7 OK;CHANGELOG 4.15.2 + bump。

## 被更新的既有断言(4 处)
1. tests/cli/setup-force-update.test.ts ×2 — keptExisting 形状 → {name, reason}(T3 必然后果)。
2. tests/cli/doctor.test.ts cell 3 — jq missing fail→warn(T5 语义翻转,exit 1→0)。
3. tests/cli/doctor-fixtures.test.ts missing-jq scenario — summary fail→warn(同上)。
4. tests/unit/cli-doctor.test.ts 'jq missing → exit 1' — 重写为 checkJq 直接单测
   (全局 spawn-fail mock 下 CLI exit code 混入宿主相关 checks,沿用旁边 checkMcpScope 先例)。

## 实现中的一次设计回调
探针初版要求 stdout 含 marker;doctor fixtures 的通用 spawnSync mock 返回 status 0 + 空 stdout →
被判 false → 8 个 doctor 用例连锁红。回调为 exit-code 契约(status 0 即可用)— dogfood 的无发行版
stub 恰是 exit 1,marker 匹配属过度设计;已在 realProbe 注释记录理由。

## 备注
- 有发行版且能跑通 `-c` 的真 WSL bash 仍会被探针放行(exit 0)但 `~` 语义问题依旧 —
  已知位置正则是第一道门(System32 + WindowsApps 已覆盖实际观测位置);再有新位置观测再补。
- doctor `bash flavor` 在该用户机器下轮预期:WindowsApps 别名被拒 → git 派生/标准位置命中 Git Bash
  (机器装了 Git)→ pass 或 warn(PATH-first 是 stub 的提示)。
