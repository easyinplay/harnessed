# gstack Codex Windows Lease Blocker

## 判定

2026-10-23：本机当前 Git Bash 无法创建 gstack lease 所需的 dangling symbolic-link token。门禁应返回 `ok: false`、`phase: verify`、`error.keyword: upstream-lease-unavailable`。这不是安装成功，也不能由 `gstack-skill-start` 的 exit 0 推导为 lease 可用。

本任务只实现 harnessed 的 fail-closed readiness gate，不修改 upstream、ACL、MSYS 安全策略或正式 user lease 目录，不替换锁协议，不创建私有正式 lease。没有 commit 或 push。

## Upstream 证据

前一轮只读 `gh api` 核对结果：

- 本机 installed VERSION：`1.91.176.0`；source HEAD：`514fbfdc9799376edfd2536f60659501a48ead64`。
- 查询时 upstream `main`：`4a98e407e60e6581748b3835e387a870cff55265`，commit time `2026-10-23T00:26:19Z`，VERSION `1.91.181.0`。
- 该 commit 的 `bin/gstack-lease` 与 installed 文件逐字节相同；Git blob SHA：`ded79313e5e04069f825b1a0db6697e0ed4d7be4`。
- 该 commit 的 `bin/gstack-skill-start` 与 installed 文件逐字节相同；Git blob SHA：`6592d5746029fdd64c9fdc8f907989d5ac9d0921`。
- 因此查询时的 `1.91.181.0` 尚未修复下述行为。本任务未升级或安装任何 upstream。

可按固定 commit 只读复核，不依赖未来 main 是否移动：

```powershell
gh api 'repos/garrytan/gstack/contents/VERSION?ref=4a98e407e60e6581748b3835e387a870cff55265' --method GET
gh api 'repos/garrytan/gstack/contents/bin/gstack-lease?ref=4a98e407e60e6581748b3835e387a870cff55265' --method GET --jq .sha
gh api 'repos/garrytan/gstack/contents/bin/gstack-skill-start?ref=4a98e407e60e6581748b3835e387a870cff55265' --method GET --jq .sha
```

`gstack-lease` lines 100-138 使用 symlink target 原子发布 owner token，`.lock.break` 也使用 symlink。`lock()` 把所有 `ln -s` 失败当作可重试竞争，隐藏 stderr；owner 为空时仍最终返回 3，`touch` 输出 live-process 文案。`gstack-skill-start` lines 126-132 显式 fail-open，警告后继续。锁原语不可用不等于已证明另有 live process 持锁。

## 隔离重现

前一轮唯一空 temp 中观测：

```text
INITIAL_ENTRIES=0
DANGLING_LN_RC=1
IS_SYMLINK=no
LEASE_TOUCH_RC=3
FINAL_ENTRIES_BEGIN
FINAL_ENTRIES_END
gstack-lease: the lease directory is locked by live process ; lease 1 not renewed
```

直接 `ln -s` 报 `No such file or directory`。没有测试提权或其他 native-symlink 模式，不推断所有 Windows 环境都不支持。

## 新门禁

- 入口：`src/installers/lib/gstackLease.ts` 的 `verifyGstackLease(ctx)`。
- 仅处理 metadata.name 为 `gstack` 且 active host 为 `codex`；dry-run 不执行。
- runtime home 优先取 `install.env.CODEX_HOME`，其次 parent `CODEX_HOME`，最后 active platform home。调用该 runtime 内的实际 `bin/gstack-lease`，不是 source 中另一份脚本。
- 按 installed `.source-path` 定位 source checkout；缺少 marker 时采用 runtime root，与 upstream root fallback 一致。路径不可用或相对路径均 fail-closed。
- 在 canonical source checkout 下通过 `mkdtemp` 创建唯一 `.harnessed-gstack-lease-*` scratch，确保位于相同文件系统；只对子进程设置 `GSTACK_LEASE_DIR` 和诊断用 `GSTACK_LEASE_LOCK_TRIES=1`。
- 使用实际 Git Bash、`execFile`、`shell: false`、10,000 ms timeout、SIGKILL、64 KiB output bound。禁用 Bash profile/rc，不转发 credentials 或 startup hooks，保留 inherited native MSYS/CYGWIN policy。
- 官方 `touch` 失败一律传播。exit 0 还须证明 scratch 中恰有一个 numeric PID regular lease file，且未遗留锁；否则仍失败。
- cleanup 前检查 scratch 的 realpath parent、prefix 和非 symlink 属性，只删除本次记录的自有目录；cleanup 失败也 fail-closed。
- `verifyInstalled` 顺序为原 shell verify、lease gate、原 `verifySkillRuntime`。已有和 fresh 安装均在 receipt 记录前接受该验证；runtime repair helper 协议未变。

这只证明当前环境的 lease 原语与当前官方 touch 路径是否可用，不声明完整并发算法、updater 生命周期或其他组件均已验证。

## 本轮验证

- TDD red：接线前 shell 成功后仍返回 `null`，新增验证链用例失败；接线后得到 `upstream-lease-unavailable`，且不调用后续 skillRuntime，转绿。
- `tests/unit/installers-gstack-lease.test.ts`：20 个隔离 fixture 用例通过，包含真实 Bash fixture、CODEX_HOME 优先级、native policy 不覆盖、伪成功拒绝、timeout、scratch 清理、并发 scratch 唯一性、已有/fresh failure 不写 receipt。
- 唯一受影响的既有 mock 文件为 `tests/unit/installers-gitCloneWithSetup.test.ts`，仅新增 lease gate mock，保留原 runtime repair 断言。
- 显式 opt-in 的 installed runtime reality probe 通过：本机门禁正确返回 FAIL，官方 touch exit 3，keyword 为 `upstream-lease-unavailable`，source checkout 自有 scratch 无残留。测试运行约 1 秒，未运行长 preamble。
- 已修复 fixture 中 `git_ref` 联合类型未收窄问题；全局 `tsc --noEmit --incremental false` 通过。

重跑本机诊断必须显式传入真实 runtime home，避免绕过普通测试的 HOME 隔离：

```powershell
$env:HARNESSED_GSTACK_LEASE_REAL_PROBE = '1'
$env:HARNESSED_GSTACK_LEASE_REAL_CODEX_HOME = 'C:/Users/easyi/.codex'
node node_modules/vitest/vitest.mjs run tests/unit/installers-gstack-lease.test.ts -t 'installed runtime reality probe'
```

fullsuite、统一 build 和最终实机 setup 由主 session 执行。本门禁的预期是保留 gstack 阻断，不得为了全绿而转成功或写 receipt；不能在尚未统一验证时声称全部组件可用。
