# spike — B 档可行性:bun build --compile 单文件分发(2026-07-04)

背景:用户问"harnessed 改为基于 bun 构建"的优缺点;三档位分析后定向调研 B 档
(单文件可执行分发,CodeGraph 模式,战略收益 = 用户机器不再需要 Node 22)。
测试台:Windows 11 + bun 1.3.14 + node 24.18 + 本仓 dist(4.18.0)+ 已认证 claude。

## 实测通过(按风险序)

1. **agent-sdk 真实 query 全链路 ✅(原一票否决项,排除)**
   `query({prompt, options:{model: haiku, maxTurns:1}})` 在 bun 下完整跑通:system:init 握手、
   流式消息、result subtype=success、returns "SPIKE-OK";19.6s(node 基线 25.8s,单样本仅记录)。
   sdkSpawn/ralphLoopWrap 依赖的机制无阻断。
2. **bun 运行时跑 dist/cli.mjs ✅**
   doctor 15 项全过(含 where/which spawnSync、Git Bash resolveBash、fs 探测);setup --dry-run 正常;
   `install ctx7` 全链路(含 idempotent 探测、结果输出)与 node 输出一致。
3. **编译与启动 ✅**
   `bun build --compile dist/cli.mjs`:421 modules bundle 92ms + compile 1.0s;单 exe 97MB;
   `--version` 启动 0.27s(node dist 0.37s)。doctor 在 exe 下全过(cwd=repo 时)。
4. 状态写入(proper-lockfile 链路)在 install 路径正常。

## 实测断裂(B 档主工程成本)

5. **资产解析 ❌**:异地 cwd 下 exe 跑 `setup` → `setup.workflows_not_found`。
   根因:getPackageRoot 基于 import.meta.url,编译后指向 bunfs 虚拟路径;运行时 readdir/readFile
   的 workflows/(28 dir)、manifests/、messages/(i18n)全部落空。
   两个方案:(a) bun 资产嵌入 — 但 readdir 语义需改造为静态资产清单,侵入面大;
   (b) 首跑解包 — exe 内嵌 tar/清单,首次运行解到 stateRoot(~/.claude/harnessed/assets/<ver>/),
   getPackageRoot 加 compiled 分支指向解包目录。推荐 (b),估 ~1 phase。

## 顺带暴露的既有 bug(与 bun 无关,node 同样)

- workflows_not_found 时 i18n key 原样输出(messages/ 同样没解析到)且 exit=0(应非零)。
- `harnessed install` 对 already-installed 结果打印 "installed <name>@<ver>"(误导;
  本机 ctx7 经 context7 插件别名短路即如此)。
→ 两条记 follow-up,可下个 patch 顺手修。

## 未验证 / 残留风险

- 分发管线:97MB × ≥3 平台(bun 支持 --target 交叉编译,未实测)、Windows/macOS 签名、
  gh release 资产、自更新机制 — 估 ~1 phase。
- bun Windows child_process 边角的长期兼容性跟踪(本次矩阵通过,历史上是 bun 弱面);
  CI 需加 bun-compile 冒烟 job。
- 交互组件(@clack)在 bun TTY 下未实测(本 spike 全非 TTY)。

## 结论

**技术可行,核心风险已排除**。成本 = 资产解包架构(~1 phase)+ 发布管线(~1 phase)+ CI 冒烟。
建议路径:作为未来 milestone 候选,以"npm 渠道之外并行发 binary"切入(不替换 npm,不动开发工具链
pnpm/vitest —— B 档只关乎分发),等有真实用户需求信号(如"不想装 Node")再启动。
