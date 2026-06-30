# Patch 4.10.1 — installer force-update 健壮性

> Status: ✅ 实现 + 测试通过(未 commit / 未 push)
> Date: 2026-06-30

## 背景
真实 `harnessed setup` force-update 14 个 already-installed,6 个失败:
- frontend-design / gstack / ui-ux-pro-max:`git-clone-with-setup cmd exited 1`(re-run 写已存在 dest 失败)
- playwright-test / mattpocock-skills:`npx skills add` 120s 超时
- gsd:`verify exit 1`(布局漂移)

核心安装成功,失败全在可选 force-update。学 comet `ensureOpenSpecCli`「升级失败 ≠ 致命,回退现有 + warn」。

## Fix A — 3 git-clone manifest 可重跑(写 final dest 前 rm -rf)
- gstack.yaml:cmd 开头加 `rm -rf ~/.claude/skills/gstack &&`
- frontend-design.yaml:`cp -R` 前插 `rm -rf ~/.claude/skills/frontend-design &&`
- ui-ux-pro-max.yaml:`cp -R` 前插 `rm -rf ~/.claude/skills/ui-ux-pro-max &&`
- `git clone <url> <dest>` 形状未破坏(extractCloneTarget + D-15 SHA-verify 依赖);idempotent_check 不变。

## Fix B — install 超时 120s → 300s
- src/installers/lib/spawn.ts `DEFAULT_INSTALL_TIMEOUT_MS = 300_000`(注释说明理由)。
- 全仓唯一 install 超时常量,3 个 installer 共用,无别处需同步。verify 超时 15s 不变。

## Fix C — failed→keptExisting 优雅降级(comet ensureOpenSpecCli)
src/cli/lib/setup-helpers.ts:
- StepBResult 加 `keptExisting?: string[]`
- 纯函数 `reclassifyForceUpdateFailures(firstPass, forcePass, probe)`:第二趟 failed ∩ 第一趟 alreadyInstalled 且 probe→present → failed→keptExisting;absent/throw → 保持 failed;非 alreadyInstalled 永不 probe。
- `makeIdempotentProbe(manifestPaths)`:预验证 name→Manifest,复用 isAlreadyInstalled 作真实 probe。

src/cli/setup.ts:force-update 第二趟后 reclassify、summary 加 kept-existing 计数、printGrouped 加 kept-existing 桶(console.warn 非 error)、末尾 warn 提示可重试。

## 改/建文件
改:3 manifest + src/installers/lib/spawn.ts + src/cli/lib/setup-helpers.ts + src/cli/setup.ts
建:tests/cli/setup-force-update.test.ts、tests/installers/git-clone-idempotent.test.ts

## Gate
biome ✅ / tsc 0 ✅ / vitest 71 passed ✅ / check-workflow-schema ✅ / validate-schema ✅
注:tests/cli/setup.test.ts 默认 5s 偶发 timeout(基线即如此 heavy-import flaky,非回归);--testTimeout=30000 全 8 绿。

## TDD
先写 9 RED → 实现 → 全绿。无跳过。
