# Maintainer Onboarding (Stub)

> **Status**：占位文档（v0.1）— 实际启用于 v0.4 co-maintainer 招募窗口
> **决策来源**：[ROADMAP § v0.4 Goal](../.planning/ROADMAP.md) + R04 失败模式 3（单 maintainer 36%/年掉队率）

## 目标

降低 fork 与外部 contributor 入门门槛；6 月窗口期内 merge 至少 1 个外部 PR；建立 bus factor ≥ 1.5。

## 招募窗口

- **启动**：v0.4 ship 时正式发布（参考 PROJECT-SPEC § 5.6）
- **时长**：6 个月
- **退出**：窗口结束未招到 → 进入 maintenance-only 模式（不假装有人）

## Co-maintainer 角色定位

- **commit access**：merge 权限 + ADR review 权限
- **首要职责**：cross-OS CI 红线维护 + manifest schema 守门 + 上游漂移监控
- **入门承诺**：30 分钟跑通 dev 环境 + 1 个外部 PR merge

## 必读文档（窗口启动前固定）

1. [PROJECT-SPEC.md](../PROJECT-SPEC.md) — 立项参数 + 14 项锁定决策
2. [WORKFLOWS-MVP.md](../WORKFLOWS-MVP.md) — 3 MVP workflow 设计
3. [ADR 0001](./adr/0001-manifest-schema-v1.md) — manifest schema v1 SSOT
4. [ADR 0002](./adr/0002-repo-structure-toolchain-v0.1.md) — toolchain 选型
5. [ADR 0003](./adr/0003-install-method-count-errata.md) — install method count errata 模式
6. [CONTRIBUTING.md](../CONTRIBUTING.md) — dev setup + commit 规则 + ADR 写作
7. [.planning/ROADMAP.md](../.planning/ROADMAP.md) — 4 milestones × 3-5 phases
8. [.planning/STATE.md](../.planning/STATE.md) — 跨 session 项目记忆

## v0.4 启动前 TODO（占位）

- [ ] GitHub Sponsors page 公开 + README badge
- [ ] stale-bot 配置（90 天无活动 issue 自动关闭）
- [ ] issue / PR template 完成
- [ ] 首个 "good first issue" 标签清单（≥ 5 个）
- [ ] 招募贴文（README 顶部 + Discord / Twitter）

## 风险（提前 awareness）

- ⚠️ R04 学术实证：单 maintainer 项目 36%/年掉队率
- ⚠️ AI harness 生态变化快（每 3 个月洗牌）— co-maintainer 需"上游漂移嗅觉"
- ⚠️ 招不到的应对：转 maintenance-only，不接新功能；维持 schema + workflow

## References

- PROJECT-SPEC § 5.6（商业模式 + co-maintainer 窗口决策）+ R04 P0#3（bus factor ≥ 1.5 验收）+ [Avelino et al., "A novel approach for estimating Truck Factors"](https://arxiv.org/abs/1604.06766)（学术 36% 数据）

