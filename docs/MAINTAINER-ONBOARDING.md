# Maintainer Onboarding

> **Status**：v0.4 activated（Phase 4.2 SHIPPED 2026-05-18 — co-maintainer 招募窗口已开启）
> **决策来源**：[ROADMAP § v0.4 Goal](../.planning/ROADMAP.md) + R04 失败模式 3（单 maintainer 36%/年掉队率）

## 目标

降低 fork 与外部 contributor 入门门槛；6 月窗口期内 merge 至少 1 个外部 PR；建立 bus factor ≥ 1.5。

## 招募窗口

- **启动**：v0.4.0 ship 2026-05-19 Phase 4.3 close（6-month organic external clock per D-04 HYBRID）
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
6. [ADR 0014-0017](./adr/) — checkpoint engine + plan-feature + aliases + routing 100% per-tier (v0.3.0 closure)
7. [docs/benchmarks/v0.4.md](./benchmarks/v0.4.md) — dogfooding benchmark FULL per-task disclosure (Phase 4.1 R8.1 anchor)
8. [CONTRIBUTING.md](../CONTRIBUTING.md) — dev setup + commit 规则 + ADR 写作
9. [.planning/ROADMAP.md](../.planning/ROADMAP.md) — 4 milestones × 3-5 phases
10. [.planning/STATE.md](../.planning/STATE.md) — 跨 session 项目记忆

## A. Dev environment 30-min Quickstart (R8.2 acceptance)

完整 prerequisites + setup 步骤参考 [CONTRIBUTING.md § Prerequisites + § Setup](../CONTRIBUTING.md) (Karpathy DRY — NOT recopy)。30-min checkpoint：

1. **Toolchain 就绪** (~5min)：Node ≥ 22 + Git + `corepack enable` (Windows ACL fallback 见 CONTRIBUTING.md Win Workaround)
2. **依赖安装** (~5min)：`corepack pnpm install --frozen-lockfile`
3. **首轮测试** (~10min M2 class)：`corepack pnpm test` (701+ tests, expect ≤5min on M2 / ≤10min on Win cold)
4. **构建 + smoke** (~5min)：`corepack pnpm build` then `node dist/cli.mjs --version` (verify dist/ artifacts)

未通过任一 checkpoint → 见 [CONTRIBUTING.md § Common Issues](../CONTRIBUTING.md) Win-specific bash flavor / port-in-use / corepack ACL 三类常见 fix。

## B. Commit conventions

- **Conventional Commits 格式**：`<type>(<scope>): <summary>` (sister Phase 1.X+ all commits 遵循；type ∈ feat/fix/docs/refactor/perf/style/chore/test)
- **scope 格式**：`phase-{N.M}-w{W}` 或 `phase-{N.M}` (sister `docs(phase-4.2-w1): ...` precedent)
- **Karpathy hard cap**：源码 ≤200L per file + docs ≤150L per file (sister B-06 + B-26 + Phase 3.4 D-04 explicit；详 [CLAUDE.md](../CLAUDE.md))
- **Biome preempt MANDATORY**：commit .ts/.js/.mjs 前先跑 `pnpm exec biome check --write` (project memory `feedback_biome-preempt.md` 3 CI-red recurrences terminus；详 [CONTRIBUTING.md § Commit Message 格式](../CONTRIBUTING.md))
- 详细 commit 规则 + scope 表 + body 模板见 [CONTRIBUTING.md](../CONTRIBUTING.md)

## C. ADR review checklist

收到 ADR PR 时，5-point review：

1. **9 章节 errata 格式**：sister ADR 0001-0017 main body 0 diff per A7 守恒（Status / Context / Decision / Consequences / Alternatives + 9 章节 errata appendix）
2. **Status flow**：Proposed → Accepted → (optional Superseded by ADR XXXX) — `adr-XXXX-accepted` git tag pushed at Accepted
3. **REQ-ID anchor**：每个 Decision 节锚定 REQ-ID（sister Phase 3.4 W2 T2.7 iter 1-0017 cadence）
4. **Cross-reference**：引用先前 ADR + Decision Lock + Sneak-block clauses（sister ADR 0005 errata precedent）
5. **A7 守恒**：先前 ADR main body 0 diff（仅 errata appendix 允许追加），CI gate `ci.yml` A7 step verify
6. **Biome preempt before commit**（若涉 .ts/.js fixture 改）

详细 ADR 写作规则见 [CONTRIBUTING.md § ADR 写作](../CONTRIBUTING.md)。

## D. Cross-OS CI maintenance playbook

`.github/workflows/ci.yml` matrix 三平台 (ubuntu-latest + macos-latest + windows-latest)。CI 红时 3-step debug：

1. **CI matrix 红 → 锁定 failing OS**：通常 Win-specific bash flavor / port-in-use / build ordering
2. **本地 Win 复现**：cmd.exe (NOT git-bash) 重跑 failing step；常见 Win-specific 陷阱：
   - **Build-before-test** 顺序 MANDATORY on Win（sister Phase 3.4 hotfix 554b82b — `pnpm build` MUST 在 `vitest` 前；macOS/Linux 容错但 Win 严格）
   - **Ephemeral port**：用 `net.createServer({port:0})` 拿动态端口（sister Phase 3.3 W0.2 dashboard-sse fix），避免 port-in-use
   - **bash flavor sentinel**：sister Phase 2.4 W4 ralph-loop Win sentinel pattern (5 fixture detect git-bash vs cmd.exe)
3. **Fix forward strategy**：surgical fix > skip test；commit 走 `fix(phase-N.M-wX-hotfix): ...` scope

## E. Manifest schema 守门 SOP

manifest schema v1 frozen ([ADR 0001](./adr/0001-manifest-schema-v1.md))，extension 通过 errata ADR 追加（详 [ADR 0007](./adr/0007-categorization-schema-extension.md) categorization 3-field extension + [ADR 0003](./adr/0003-install-method-count-errata.md) install method count errata）。schemaVersion 当前 13-surface registry（sister Phase 3.3 W0.3 manifest-domain colocation 3rd consumer 闭环）。

- **变更前**：review schema diff + 写 errata ADR + colocation domain rule (schema 放对应 domain 目录 NOT global)
- **变更验证**：`corepack pnpm test -- --filter manifest-validate` (fixture-driven verify all 10 base manifest pass schema)
- **schemaVersion bump**：仅 additive 字段 → patch；breaking → major + new ADR

## F. Upstream drift monitoring

AI harness 上游 (ctx7 / gstack / superpowers / mattpocock etc.) 每 ~3 个月洗牌一轮，单 maintainer 易漏。

- **版本 lock**：`versions/<harnessed-ver>-known-good.yaml` lazy-load 锁定 e2e-verified 上游版本 (Phase 3.3 D-03 8-entry shipped；详 [ADR 0016](./adr/0016-aliases-known-good.md))
- **月度 doctor**：`harnessed doctor` 8-check 跑一遍 (sister Phase 4.1 [`docs/benchmarks/v0.4-upgrade-e2e.log`](./benchmarks/v0.4-upgrade-e2e.log) template precedent)
- **Manifest churn 信号**：上游 README 大改 / install method 改 / breaking config → 触发 manifest errata ADR
- **Escalation**：上游 stop shipping ≥6 个月 → 进入 maintenance-only mode (per § 风险 fallback)

## v0.4 启动前 TODO

- [x] GitHub Sponsors page 公开 + README badge（Phase 4.2 W1 T1.4 SHIPPED）
- [x] stale-bot 配置（90 天无活动 issue/PR 自动关闭；Phase 4.2 W1 T1.2 SHIPPED `.github/workflows/stale.yml`）
- [x] issue template 完成（Phase 4.2 W1 T1.3 SHIPPED `.github/ISSUE_TEMPLATE/` 3 templates + config.yml）
- [ ] 首个 "good first issue" 标签清单（≥ 5 个；organic external clock per D-04 HYBRID）
- [ ] 招募贴文（README 顶部 + Discord / Twitter；organic external clock per D-04 HYBRID）

## 风险（提前 awareness）

- ⚠️ R04 学术实证：单 maintainer 项目 36%/年掉队率
- ⚠️ AI harness 生态变化快（每 3 个月洗牌）— co-maintainer 需"上游漂移嗅觉"
- ⚠️ 招不到的应对：转 maintenance-only，不接新功能；维持 schema + workflow

## References

- PROJECT-SPEC § 5.6（商业模式 + co-maintainer 窗口决策）+ R04 P0#3（bus factor ≥ 1.5 验收）+ [Avelino et al., "A novel approach for estimating Truck Factors"](https://arxiv.org/abs/1604.06766)（学术 36% 数据）
