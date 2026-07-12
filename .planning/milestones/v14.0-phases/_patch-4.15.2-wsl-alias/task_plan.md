# task_plan — 4.15.2 WSL app-alias 漏网 + 功能验证 + 错误尾巴消毒

status: ready-to-execute
根因(用户 dogfood v4.15.1,同机):PATH bash = `C:\Users\<u>\AppData\Local\Microsoft\WindowsApps\bash.exe`
(Microsoft Store WSL app 执行别名)。4.15.1 的 WSL_STUB_RE 只匹配 System32/Sysnative/SysWOW64 → 该别名被当成
"非 WSL" 在第 2 步直接采纳;doctor checkWinBash 同步误报 "(Git Bash / native)"。后果:ctx7 L4 verify、
gstack / ui-ux-pro-max force-refresh(git-clone posix cmd)仍打到 WSL stub。mattpocock force-refresh 失败原因
被 kept-existing 吞掉,无法诊断(T3 补)。
TDD: T1/T2 先测。

## T1 — bash 候选功能验证(治本,不再靠路径清单猜)[resolveBash.ts]
- WSL_STUB_RE 增补 `[\\/]microsoft[\\/]windowsapps[\\/]bash\.exe$`(快速拒绝已知别名)。
- 新增一次性功能探针 `bashWorks(path)`:`spawnSync(path, ['-c', 'echo harnessed-bash-ok'])`,
  status 0 且 stdout 含标记才采纳;失败 → 继续解析链(未知位置的 stub / 损坏 bash 全兜住)。
  探针结果随 resolution 一起 memoize(每进程每候选至多一次);deps 注入可测。
- env HARNESSED_BASH 覆盖跳过探针(用户显式指定,verbatim 信任,注释说明)。
- doctor checkWinBash 经同一 SoT 自动获益(报告 resolved+validated 的那个)。

## T2 — 非 POSIX verify 不再进 bash [spawn.ts]
- win32 + posixShell 分支内:cmd 不含 POSIX 依赖(启发式:无 `test `/`grep `/`|`/`[`/`~`/`&&`/`;`/重定向)
  → 改走 cmd.exe 分支(如 `ctx7 --version`、`<tool> --help`)。bash 不可用时这类 verify 与 bash 彻底解耦。
- 保守:判定不确定的一律维持 posix 路径;现有 posix 用例(test 链已 native、grep 管道)行为不变,测试钉扎。

## T3 — kept-existing 行携带底层原因 [setup-helpers.ts reclassify + setup.ts printGrouped]
- reclassifyForceUpdateFailures 把原 failed reason 传递到 keptExisting(结构 {name, reason});
- 表格 note 列:`refresh failed: <reason 截断 90> — prior version retained`。
- 下轮 dogfood 即可直读 mattpocock refresh 失败的真实原因。

## T4 — 错误尾巴消毒 [verifyMessage.ts + spawn timeout 消息]
- stderr/stdout 尾巴复用 checkWinBash 的消毒逻辑(抽公共 helper:去控制符/替换非法序列/截 120);
  CP936 乱码不再原样进错误消息(ctx7 那条的观感问题)。

## T5 — jq 检查降级评估 [check-builtin.ts]
- 先 grep 仓库确认 jq 实际消费方;若 harnessed 自身不依赖(疑为早期遗留/gstack 侧需求)→ fail 降 warn,
  加 install_commands(winget install jqlang.jq)进 auto-install 流;若确有硬依赖则保持并在 message 注明用途。

## T6 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.15.2]`(中文)+ bump + progress.md。
- 不 commit 不 push。
