# progress — 4.15.1 WSL-bash 根因修复(2026-07-02)

## 任务状态
- T1 resolveBash — DONE:新模块 src/installers/lib/resolveBash.ts(deps 注入 + memoize + resetBashResolutionCache(override) 测试钉扎);spawnCmd posixShell 分支消费;PATH 仅 WSL stub → 'bash-missing' fail-loud(含 HARNESSED_BASH 提示);8 单测。
- T2 nativeTest — DONE:新模块 nativeTest.ts(evalTestChain:test -f/-d/-e、||/&&、~ 展开、文法保守回落);spawnCmd 顶部快路径(双 shell 模式全平台),cmd.exe idempotent fallback 顺带修复;8 单测。
- T3 quiet + 错误文本 — DONE:npmCli L4 行 quiet 门(2 单测);新 verifyMessage.formatVerifyFail 统一 3 个 installer verify 失败消息(npmCli / npxSkillInstaller / gitCloneWithSetup;4 单测);spawnCmd 超时消息 stdout 兜底。
- T4 doctor — DONE:checkMcpScope 永不 fail(user-scope = installer 默认,名称 'mcp scope');checkWinBash 走 resolveBash SoT + 三态(fail/warn/pass)+ 乱码消毒(4 单测);probe-gstack 加 fs 分支 + exists 注入 + 修 bogus @gstack/cli 提示(2 新/改单测)。
- T5 输出打磨 — DONE:分隔线按实际最宽行;force-updating 头行;失败摘要 trailer(setup complete 前)。
- T6 收尾 — DONE:CHANGELOG 4.15.1 + bump;schema 未触碰(无需 build:schema)。

## 验证
- vitest 全量:199 files passed(3 skipped),**1791 passed / 0 failed**(5 skipped + 1 todo;净增 +30)
- tsc --noEmit 0;biome clean(残留 1 warning 为 HEAD 既有 tests/unit/installers-mcpHttpAdd.test.ts HTTP_TEST_KEY 行,本 patch 未触碰)
- scripts/check-*.mjs 7/7 OK

## 被更新的既有断言清单(全部为 native 快路径 / 语义翻转的必然后果,意图保留)
1. tests/unit/installers-lib-spawn.test.ts posixShell 块:test-chain cmd → grep 形式(native 路径不再 spawn;posixShell 路由断言意图保留),HARNESSED_BASH='bash' 钉扎 + cache 重置;bash-ENOENT 用例同换 grep。新增 WSL-only 拒绝 + native 快路径 2 用例。
2. tests/unit/installers-gitCloneWithSetup.test.ts:fixture verify/idempotent test-chain → grep 形式(保 mocked-spawn 契约)。
3. tests/unit/installers-harness-overrides.test.ts:同上。
4. tests/unit/installers-npxSkillInstaller.test.ts:fixture verify/idempotent 同上(test 环境 homedir mock + 真实 statSync 的组合会让 native 路径打到真 fs)。
5. tests/cli/probe-gstack.test.ts case 4:注入 exists=false(默认真实 fs 在装了 gstack 的机器上会翻 pass)+ fix 断言 'harnessed setup';新增 case 4b fs 分支。
6. tests/unit/cli-doctor.test.ts:'user-scope MCP → exit 1' 重写为 checkMcpScope 直接单测(pass 语义;原 CLI 级断言混入 gstack PATH probe 噪声)。
7. tests/cli/doctor-fixtures.test.ts:check 名 'mcp scope = project' → 'mcp scope'。

## 偏差说明
- (1) evalTestChain 支持 -e(-f/-d 之外;上游 manifest 可能用到,保守文法内零成本)。
- (2) checkWinBash 放弃了旧的 `bash -c 'echo $WSL_DISTRO_NAME'` spawn 探测 — WSL 判定改为 System32 路径签名(resolveBash 的 where 行),乱码源头(spawn WSL stub)彻底消失;doctor-fixtures 的 `cmd==='bash'` mock 分支变成不再命中的死支,未删(fixture 兼容)。
- (3) resolveBash 順序把 "PATH 首个非 WSL bash" 放在 git 派生之前 — 保证健康机器与 pre-4.15.1 行为 byte-compatible(task_plan 原文顺序是 git 派生优先,调整理由:最小行为变化)。
