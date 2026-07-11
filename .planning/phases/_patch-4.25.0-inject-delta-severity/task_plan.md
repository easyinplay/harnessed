# task_plan — 4.25.0 B1 注入 delta 化 + B3 不确定性分级(intel 增补 3 动工)

status: ready-to-execute
来源:intel 增补 3 actionable 短清单,用户"动工"。
- B1(Trellis byte-stable/memoize + comet hash 命中免重读合成):bin/harnessed-inject-state.mjs
  每轮把 `<project-context>`(≤1500 token 的 learnings + CONTEXT 摘录)全量重注;同内容
  逐轮重复烧 token(10 轮 ≈ 1.5 万 token 量级,comet 同类优化实测省 ~44K/10 task)。
  `<workflow-state>` 小且随状态合法变化,不动。
- B3(comet 0.3.5):"SUGGESTION > WARNING > CRITICAL,仅可复现 build 失败/测试失败/安全
  漏洞可标 CRITICAL,模糊/判断类发现必须降级" — verify 家族 role prompts 无此纪律,
  误报易升格成阻塞;doctor 的 fail 级使用面需对账。

## 锁定决策
- D1 会话级 delta 注入(新模块 + bin/TS 双端):
  - 缓存:`<stateRoot>/inject-cache/<sha256(repoKey::sid) 前 16 位>.json`,
    存 `{pcHash, ts, turns}`。键含 sid — 无 sid(env 未设/旧宿主)→ 无缓存,
    永远全量注入(字节等同旧行为,fail-soft)。
  - 规则:本轮 pc 的 sha256 == 缓存 pcHash 且 turns < REFRESH_N → 跳过 pc 只发 ws,
    turns+1;否则全量注入 + 重置 {pcHash, ts, turns:0}。
  - REFRESH_N 默认 10(env `HARNESSED_INJECT_REFRESH_TURNS` 可调):周期性重注对冲
    compaction 丢历史(compaction 后 ≤N 轮内 pc 必然回来;我方无 PreCompact hook,
    不为此新装 — YAGNI,周期重注是无状态解)。pc 内容变化(learnings 追加/phase 推进)
    → hash 变 → 自动全量,零额外逻辑。
  - 缓存 I/O 任何错误 → 全量注入(fail-soft,绝不因缓存少注)。
  - bin(纯 JS 热路径)与 TS(injectState 侧)双端:缓存层抽独立模块
    (bin 内联函数 + src/checkpoint/injectCache.ts),纯逻辑(shouldSkipPc 判定)
    进 parity 测试,fs 层各自单元测试。
- D2 verify 家族 severity 纪律(role-prompts en/zh):在 verify 报告类条目(paranoid /
  code-review / qa / security,由 fork 读 yaml 现状后按最小一致面落点,possibly 复用
  各条目的 severity: 字段 + checklist 行)写入:"Severity discipline: SUGGESTION >
  WARNING > CRITICAL — only reproducible build failures, test failures, and security
  vulnerabilities may be CRITICAL; ambiguous or judgment-call findings MUST be
  downgraded, never rounded up."(zh 对应;en/zh 条目数保持相等)。
- D3 doctor fail 级对账:audit 现有 checks 哪些 emit 'fail' — 原则:fail 仅保留
  "harnessed 自身无法工作"类(损坏安装/缺依赖);环境模糊类若有 fail 降 warn。
  仅在发现违反时改,改动逐条记录;无违反则测试断言现状锁定原则。
- D4 版本 4.25.0(minor:注入行为新增缓存面 + prompts);TDD 红先行。

## T1 测试红先行:injectCache 判定纯逻辑(命中跳过/turns 到期重注/hash 变全量/无 sid
     直通/缓存损坏 fail-soft)+ bin/TS parity + role-prompts severity 关键词(en/zh +
     条目数相等)+ doctor fail 面断言
## T2 D1 实现 [src/checkpoint/injectCache.ts 新模块 + bin 内联 + 两端接线]
## T3 D2 role-prompts en/zh;D3 doctor 对账
## T4 收尾:vitest 全量 + tsc + pnpm lint + gates 7/7;CHANGELOG `## [4.25.0]` + bump +
     progress.md + intel 回填(B1/B3 IMPL);commit 即 push;tag 等确认。
