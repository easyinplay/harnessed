# findings — 4.31.0 eval Slice A

## mutation 验收留证(T7,2026-07-13 实跑)

`scripts/verify-eval-traps.mjs` 结果:**TRAP-EFFECTIVE ×3**。三例均走 reintroduce-patch
fallback(直接 revert 与后续重写冲突,与 CEO plan rev2 issue 3 预判一致)。重引入 patch:
- issue5-undefined-variable ← 反 `6e244b5`:`isUndefinedVariableError` 头部 `return false`
  (还原 fail-open)→ trap 红 ✓
- issue5-skip-sub-alias ← 反 `6e244b5`:`matchSkipSub` 改精确匹配 only(还原静默不命中)
  → trap 红 ✓
- serial-order-guard ← 反 `37605a7`:`findSerialBlockers` 恒返 `[]`(还原越序不设防)
  → trap 红 ✓
脚本首跑曾误报 3 MISSED(worktree 基于 HEAD 缺未提交 eval 命令)→ 已修:eval 层从当前树
overlay + harness 故障("unknown command" 类)fail-loud 不冒充 verdict。

## 首日战果:/auto SOP 的 `--skip-sub clarify` 杂散警告

`auto-lite-skip` 种子录制时发现:SOP 教科书命令 `--skip-sub clarify` 的 `clarify` 不是
auto master 的 delegates 子项(valid: research/discuss/plan/task/verify/retro)。
4.23.2 加未命中警告后,每次合规 /auto 都打一条 `ignored` 警告;此前静默吞从未暴露。
处置(主 session):skipSubs 加 `clarify→discuss` 同义词(兼容全部已装旧 SKILL 文本),
SOP 文本改名记 TODOS 下次渲染 pass。**这是 trap suite 存在价值的首日实证 —
不是逮回归,是逮到了从未被看见的存量缺陷。**

## 过程修复

- Wave 1 runner 缺陷:envelope 读取在 cwd 还原后执行 → repoKey 错位恒 null;移入 try 内,
  golden 现携真实台账(2 个冒烟 golden 重录)。
- golden 走 biome preempt 格式化(config-protection hook 拦截豁免条目 → 按 hook 哲学
  改流程不改配置;比较是 parse 后结构级,排版无关)。

## coverage 轨迹

冒烟 7/41 → 真种子 8/41 → +广度基线 **14/41**(BARE 34→27)。剩余裸奔集中:
parallelism 团队路由 / web-search / web-testing / tdd-gate — 后续种子增长方向
(--coverage 即导航图,E2 兑现)。
