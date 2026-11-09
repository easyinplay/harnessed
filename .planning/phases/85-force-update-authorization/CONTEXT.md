# Phase 85 — force-update authorization(未证明即拒绝 → 证明即刷新)

## 问题(维护者 2026-11-05 报告,本机最新版安装实测)

`harnessed setup` 的 force-update 第二遍对 9 个组件全部拒绝:

```
kept-existing  playwright-test / superpowers / webapp-testing / design-taste-frontend /
               gstack / mattpocock-skills / planning-with-files / ui-ux-pro-max / gsd
refresh failed: Existing … source or external write footprint is unproven; refusing replacement.
```

且收尾提示「Re-run `harnessed setup` later to retry the update」是死路:重试永远同样拒绝。

另两个 L4 CLI 工具(ctx7 / playwright-cli)被排除在 force-update 之外,提示手动 npm 升级。

## 根因(逐文件读码核实)

`f5ca347`(2026-10-23,v5.0.0 起)引入统一安装生命周期契约:四个安装器
(npxSkillInstaller / npmCli / ccPluginMarketplace / gitCloneWithSetup)在
`opts.updateInstalled && 存在既有目标` 时**一律** `unproven → refuse`。
`cb990f8`(Phase 82)又加了声明所有权机制(manifest `ownership.resources` + marker 验证),
但**从未把任何授权路径接进 force-update 闸门**——连已声明的 gsd / mattpocock-skills
也被拒(npmCli 的 `!usesDeclaredOwnership` 让行过 129,却在 145 行的
`existingPackTarget` 再拦一次;npxSkillInstaller 的闸门根本不看声明)。

即:安全模型立住了(fail-closed),授权那一半从未建成,setup 的 force 遍成了死胡同。

## 决策(维护者 2026-11-05 指示)

1. **证明即刷新**:四个安装器在 force 遍的拒绝闸门改为「能证明既有目标是自己的 → 刷新;
   不能证明 → 维持拒绝(fail-closed 不动)」。证明方式按安装器:
   - npxSkillInstaller / npmCli(npm 技能包):manifest 声明所有权
     (`ownership.resources`)+ marker 全量验证(`snapshotDeclaredOwnership` 的每条路径
     都过 `discoverDeclaredOwnership` 的 marker 检查)。
   - ccPluginMarketplace:宿主插件注册表里存在**限定名**(name@marketplace)注册
     ——同一来源身份,`claude/codex plugin install` 本身就是官方更新路径。
   - gitCloneWithSetup:既有 checkout 的 git origin URL == manifest cmd 的 clone URL。
2. **给剩余三个 npx 单技能包补声明**:playwright-test(skill `playwright-cli`)、
   webapp-testing、design-taste-frontend,各加一条
   `ownership.resources`(`marker: {path: SKILL.md, contains: "name: <skill>"}`,
   与 mattpocock-skills 同款;skills CLI 写的 SKILL.md 带该 frontmatter)。
   实施期修正:design-taste-frontend 的 cmd **不带 `--global`**,skills CLI 把真文件
   装进 `~/.agents/skills/<name>` 并在宿主 skills 目录留**符号链接**;符号链接被
   ownership 发现层显式跳过(防越界),所以该包的声明落在新根 `agents-skills`
   (`<userHome>/.agents/skills`,schema + ownershipContract + receipt 三处同步),
   指向真实文件所在处。
3. **L4 CLI 工具进 force 遍**(维护者明示「采用官方的 npm 升级模式」):force 遍对
   **全局 npm 安装**(`npm install -g <pkg>`)组件以 `system: true` 跑 manifest 自己的
   命令(npm 幂等升级;PR #38 的 cmd.exe 引号修复保证带引号 spec 在 Windows 原样到达
   npm)。npm 全局前缀是**按包名隔离**的,不存在共享命名空间写入风险,故不需要
   所有权证明。普通安装遍与显式 `--system` 语义不变。
   实施期限定:该 system 授权**只在确认驱动的 force 遍**(用户点确认那遍)生效;
   `--update-installed` 旗标路径不带它(非交互脚本里静默写全局前缀不可接受),
   该路径仍走既有文档口径 `harnessed setup --system --non-interactive --update-installed`。
   force 遍的确认提问**点名**将被系统级升级的组件(ctx7 / playwright-cli)。
4. **诚实收尾**:kept-existing 里因 `update-unsupported` 拒绝的,提示改为
   「上游工具管理 / 声明缺失」,不再谎称重试可解(kept-existing 条目新增
   `retryable` 标志:契约拒绝 = 不可重试,瞬时失败 = 可重试)。
5. **刷新遍的 receipt 语义**(实施期补):刷新不产生新路径,「只记新增路径」的
   receipt 会是空的并让安装失败(自己写的 receipt 卡死自己)。授权刷新遍改为记录
   **已证明归属的完整集合**(证明集即归属集)。
6. **声明必须覆盖 manifest 自称的技能**(实施期补):marker 证明只对**已声明**的条目
   说话;一个没声明自己技能的包仍可能覆盖同名外来目录。故授权条件追加
   `declaredCoversSkillNames`:manifest 的 `installs_skills` 每个名字都必须落在声明
   的 selector(names 或 prefix)内,否则视为未证明 → 维持拒绝。
7. **gsd 声明的 marker 修正**(实施期补):实测 72 个 gsd-* SKILL.md 中 9 个、
   35 个 gsd-*.md agent 中 4 个不含 `gsd-core` → 声明永远证不出东西 → gsd 与
   未声明包同样被拒。marker 改为制品自带的 `gsd-` 身份(两个宿主都成立:
   claude 写 `name: gsd-x`,codex 写 `name: "gsd-x"`)。

## 不做什么

- 不放宽 fail-closed 本身:无声明、无注册限定名、origin 不符 → 依旧拒绝。
- 不给 git checkout 的下游 skill 目录(gstack 的 `gstack-*`)单独设 marker——
  checkout 已证明归属,skill 目录是同一组件的下游写。
- 不动 `harnessed update`(coordinator 有自己的 receipt/adoption 世界)。

## 验收

1. 声明包(mattpocock / gsd / 新增三个)在既有技能在场 + marker 全过时,
   force 遍真跑刷新命令(spawn 被调用),不再拒绝。
2. marker 不符 / 无声明 / 限定名不匹配 / origin 不符 → 维持拒绝,文案含可行动建议。
3. L4:ctx7 / playwright-cli 出现在 force 确认列表,确认后以 system 跑官方 npm 命令;
   非交互维持 skip。
4. 门禁:vitest 全绿、biome 0、tsc 0、check-*.mjs 全 0、`build:hooks` 后 `bin/` 零 drift。
5. 发版 v5.0.15(5.0.13 / 5.0.14 已发;本版带 Phase 85 修复条目)。
