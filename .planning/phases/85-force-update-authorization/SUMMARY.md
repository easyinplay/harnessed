# Phase 85 — force-update authorization — SUMMARY

## 交付内容(2026-11-09)

**问题**:`harnessed setup` 的 force-update 遍自 v5.0.0 起对全部组件一律拒绝
(`update-unsupported`),收尾却提示「Re-run `harnessed setup` later to retry」——
重试永远同样拒绝;两个 L4 全局 npm 工具(ctx7 / playwright-cli)则被排除在 force 遍之外。

**根因**:`f5ca347` 建立的安全模型只有拒绝这一半;`cb990f8`(Phase 82)引入的声明所有权
机制从未接进闸门,于是 setup 的 force 遍成了死胡同。

**授权路径(证明即刷新,证明不成立即维持拒绝)**:

| 安装通道 | 证明方式 |
|---|---|
| npx / npm 技能包 | manifest 声明 `ownership.resources`,且覆盖的每个既有条目都过 marker 校验;声明还必须覆盖 manifest 自称的每个 `installs_skills` |
| marketplace 插件 | 宿主插件注册表存在限定名(`name@marketplace`)注册 |
| git clone | 既有 checkout 的 git origin == manifest clone URL,且命令不写出该 checkout 之外 |
| 全局 npm | `npm install -g <pkg>`(按包名隔离,非共享命名空间);仅在**确认驱动的** force 遍生效,确认提问点名组件,force 遍已升级的工具不再被 L4 rescue 二次询问 |

**同批修掉的真缺陷**:

- 授权刷新遍不产生新路径 → 「只记新增路径」的 receipt 为空 → 安装被自己写的 receipt 卡死。
  刷新遍改为记录**已证明归属的完整集合**。
- 所有权契约缺 `agents-skills` 根:`skills` CLI 不带 `--global` 时把真文件装进
  `~/.agents/skills` 并在宿主 skills 目录留符号链接,而符号链接按设计被所有权发现层跳过
  → design-taste-frontend 无法被证明。schema + ownershipContract + receipt 三处同步补根。
- gsd 声明的 marker 要求每个制品都含 `gsd-core`:实测 72 个 gsd-* SKILL.md 中 9 个、
  35 个 gsd-*.md agent 中 4 个不含 → 声明永远证不出东西 → gsd 与未声明包同样被拒。
  marker 改为制品自带的 `gsd-` 身份(两宿主都成立)。
- 收尾文案不再谎称重试可解:`update-unsupported` 拒绝改报「上游工具接管」,
  瞬时失败才提示重跑。

**新增声明**:playwright-test(`playwright-cli`)、webapp-testing(`webapp-testing`),
design-taste-frontend(`design-taste-frontend`,`agents-skills` 根)。

**测试**:4 个新文件 / 29 个用例 —— 安装器授权(11)、所有权新根(5)、L4 system 授权(6)、
诚实收尾文案(4)、manifest 声明校验(10)。全部走真实代码路径(tmp home,不碰真实 ~/.claude)。

**门禁**:vitest 全量通过(见发布回执)、biome 0 blocking、tsc 0、`scripts/check-*.mjs` 10/10 +
`scripts/ci/check-adr-baselines.mjs` + `scripts/ci/check-biome.mjs` 全 0、`build` +
`build:hooks` 后 `bin/` 零 drift、schema 已重生成并入库。

**不在范围**:不放宽 fail-closed 本身;不给 git checkout 的下游 skill 目录单设 marker
(checkout 已证明归属);不动 `harnessed update`(coordinator 有自己的 receipt 世界)。
