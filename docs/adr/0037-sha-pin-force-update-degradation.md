# ADR 0037 — D-15 SHA pin 在 force-update / 自删 clone 目录下的降级语义

- **Status**: Accepted
- **Date**: 2026-07-03
- **Supersedes**: none — **Amends** ADR-0010 errata D-15(git-clone-with-setup 的 `git rev-parse HEAD` SHA 验证);fresh-install 的硬门**不变**
- **Relates to**: ADR-0001(版本锁哲学)、ADR-0010(D-15 SHA-verify errata)、`.planning/phases/_patch-4.16.0-refresh-repair/`(dogfood 确诊)
- **Milestone**: (patch 4.16.0,无活动 milestone)

## Context

用户 dogfood(v4.15.2,Windows)force-update pass 中两个 git-clone 组件的失败由 kept-existing
带因面(4.15.2 T3)确诊为 D-15 SHA 验证自身的结构性问题,而非安装失败:

1. **自删 clone 目录(ui-ux-pro-max 模式)**:manifest cmd 把上游 clone 进
   `~/.claude/skills/.cache/midway-uiux`,拷出产物后 `rm -rf` 该 cache — D-15 的
   `git rev-parse HEAD` 在 cmd 结束后才跑,目标目录已不存在 → `exit 128` →
   `sha-mismatch` fail。**组件实际刷新成功**,报告为失败(latent bug,4.10.1 起存在,
   此前被 verify-经-WSL 的更早失败掩盖)。
2. **SHA pin 与 force-update 语义矛盾(gstack / ui-ux 通用)**:`git_ref` 是 install-time
   钉住的 40-hex SHA;force-update 的语义是"刷新到上游最新"——上游一动,HEAD 必然
   不再匹配 pin。照 D-15 原契约,**每次 force-update 都注定 sha-mismatch fail**,
   直到有人手动 bump manifest git_ref。这不是 supply-chain 异常,是刷新的正常结果。

## Decision

`installGitCloneWithSetup` 的 D-15 SHA 验证增加两个降级分支(v4.16.0):

1. **rev-parse 不可执行(exit ≠ 0 / 无输出)→ console.warn 降级,不 fail**
   (两种安装模式一致)。消息注明 "install cmd may remove its own clone dir",
   install 是否成功以 manifest `verify.cmd`(4.15.1 起 native test-chain 求值)为准。
2. **SHA mismatch 且 `ctx.opts.updateInstalled === true`(force-update)→ console.warn
   降级,不 fail**。消息给出实际 HEAD 与 pin,提示 bump manifest git_ref。
3. **SHA mismatch 且 fresh install(updateInstalled 非 true)→ 维持硬 fail
   (`keyword: 'sha-mismatch'`)** — pin 仍是首次接触上游时的 supply-chain 门。

警示通过 `console.warn` 无条件输出(不受 `quiet` 门控):quiet 抑制的是 diff 预览,
不是 supply-chain 通告;`InstallResult` 的 ok 变体没有消息通道可携带。

## Consequences

- **正向**:ui-ux-pro-max / gstack 的 force-refresh 不再被结构性误报;真实刷新失败
  (clone/setup 段 exit ≠ 0)仍走 spawn-phase fail,可诊断性由 4.16.0 T4 全文原因块保障。
- **弱化(接受)**:force-update 放弃了"刷新后的内容 == pin"的保证 — 这本来就是
  force-update 语义上不可能满足的;pin 退化为 install-time 记录 + 漂移通告。
- **弱化(接受)**:自删 cache 模式下 SHA 完全不可验证 — cmd 与 git_ref 出自同一
  manifest 作者(signed_by + schema 门),D-15 防的是上游漂移不是 manifest 作者,
  verify.cmd 仍验证最终产物存在。
- **不变**:fresh install 的 SHA 硬门、`sha-required`(SemVer 拒绝)、
  `git-clone-shape` preflight、B1 安全门全部原样。

## Verification

- tests/unit/installers-gitCloneWithSetup.test.ts:fresh mismatch 仍 fail /
  force-update mismatch 降级 ok + warn / rev-parse 不可执行降级 ok + warn(TDD 先红)。
