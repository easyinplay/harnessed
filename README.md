# harnessed

> AI coding harness 生态的 **包管理器 + composition orchestrator**。
> 不 vendor 上游代码，用 manifest 装依赖、用 composition skill 编织流程。

## 状态

🚧 **Pre-launch** — 立项参数已敲定，等待 gstack `/autoplan` 多角色决策关卡通过后正式立项。

## 一句话定位

> 别人造轮子（如 ECC 自家 30 agents/135 skills），我们做"指挥棒" —— 装配市面上最优秀的开源/闭源 Claude Code 生态组件，用强意见的 composition skill 把它们编织成统一工作流。

## 关键差异化

- **不 vendor**：上游代码不进我们仓库，靠 manifest 描述 install/check
- **Composition Skill**：自家 workflow skill 当指挥棒，调度多个上游协同
- **包管理器思维**：`harnessed install <workflow>` 自动解析依赖图、`doctor` 健康检查
- **强意见 vs all-in-one**：用户面对 `/harnessed:*` 统一入口，不需要学每家上游术语

## 文档导航

- [`PROJECT-SPEC.md`](./PROJECT-SPEC.md) — 立项参数 spec sheet（gstack `/autoplan` 输入材料）
- [`WORKFLOWS-MVP.md`](./WORKFLOWS-MVP.md) — 3 个 MVP workflow 展开

## License

MIT（待 `/plan-ceo-review` 最终确认）
