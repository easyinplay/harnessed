# progress — 4.22.1 evidence guard 解析对齐 + 双守卫预检

## 任务状态(全部 DONE,TDD 先红后绿)
- T1 evidence.ts 裸名多基解析:红 2(phases 最新 / legacy)→ 绿;根优先 / missing 裸名 / 分隔符不变 / drift 绝对路径共 5 新用例;实现中踩坑一次 — JSDoc 注释里写 `.planning/phases/*/` 的 `*/` 提前终结块注释(memory 已记的 biome/JSDoc 唯一真例外),改行注释后恢复
- T2 checkpoint start step-0 警告:红 1 → 绿;三态(缺骨架警告 / 齐全静默 / 无 .planning 静默);stderr only,fail-soft
- T2b(追加范围)GateGuard 双守卫预检:红 1 → 绿;探测面实证 = ecc marketplace `hooks/gateguard-fact-force.js`(kill-switch `GATEGUARD_DISABLED=1`、`ECC_GATEGUARD`∈{off,0,false,disabled};active 信号 = settings hooks 关键字 / ecc 插件注册 / env 显式启用);checkpoint start stderr 预警 + 三选一建议;CLI 测试经 vi.mock 新模块保确定性(真实探测 host 依赖)
- T4(追加范围)doctor 第 16 项 `guard conflict (GateGuard)`:warn-only;与 T2b 共享探测 SoT(新独立模块 check-guard-conflict.ts,防 mock-export-gap);doctor.test / doctor-fixtures 计数 15→16 + 名称清单同步

## 验证
- 受影响套件:evidence 17/17、skeleton+T2b 5/5、guard-conflict 7/7、doctor 两文件绿;全量 tally 见主 session 复验
- tsc 0;CHANGELOG ANSI 0;biome/build/gates 见主 session 复验

## D2 风险记录(接受)
旧 phase 目录同名文件可满足新 sub 的 guard(mtime 最新优先缓解)— 证据语义 = 产物已持久化。

## 被更新的既有断言
doctor.test.ts cell 0/1/5(15→16 + 名称)、doctor-fixtures(toHaveLength + 清单)— 追加检查的必然后果;其余零改动。

## 偏差说明
(1) T2b/T4 为 coordinator 中途追加范围;(2) GateGuard 探测的 ecc-plugin 信号存在误报余地(插件装了但 hook 被其 per-config 关掉),warn-only + kill-switch 优先可接受,措辞用 "appears active";(3) check-guard-conflict 模块先写实现后写测试(探测语义已由 coordinator 锁定,7 用例钉行为)。
