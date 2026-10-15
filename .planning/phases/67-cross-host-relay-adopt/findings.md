# Phase 67 — findings

> 执行中的实测发现。计划见 `task_plan.md`,当前节点见 `progress.md`。

## F1 — `process.cwd()` 在 win32 原样返回进目录时的大小写(实测)

Windows **不**规范化 cwd 的大小写:

```
chdir('d:/gitcode/harnessed')  -> process.cwd() === 'd:\gitcode\harnessed'
chdir('D:/GitCode/harnessed')  -> process.cwd() === 'D:\GitCode\harnessed'
chdir('d:/GITCODE/HARNESSED')  -> process.cwd() === 'd:\GITCODE\HARNESSED'
```

配合 `path.resolve` 完整保留大小写(含盘符),T1 要修的缺陷**确认为真实而非理论**:
同一目录用不同大小写进入 = 两个独立槽位,在途 workflow 静默消失。

## F2 — `repoKey` 有第二份实现,T1 若只折 CLI 侧会制造新回归

`src/checkpoint/injectStateMain.ts` 持有一份**有意的 dep-free `repoKey` 复制品**
(自陈理由:真品在 typebox 污染的 `workflowStore.ts`,import 会把 typebox 拖进热路径),
经 esbuild 打进 `bin/harnessed-inject-state.mjs` —— 每轮 `UserPromptSubmit` 注入那条 hook。

它是键的**生产者**,不是 ADR 里点名的那六处裸键回退**消费者**。只折 CLI 侧的后果:
CLI 写折叠键、hook 查未折叠键,复合键与裸键**双 miss** ⇒ 每轮注入器在 win32 上
几乎每次调用都瞎掉。这正是 T1 要消灭的症状被搬到热路径。

T1 之前两边保留大小写的方式完全一致、永远相合,所以这是**新回归**而非既存条件。
**两份实现之间当时没有任何 parity 测试**,全量绿着它们已经分叉。
(模块注释称 v16.0 Phase 63 清掉了其他「会和 CLI 漂移」的复制品;这一份活了下来。)

裁定:复制品同折,并入 T1 一起发;拆 `slotKey`(折叠,喂账本查找与 inject cache)
与 `repoPath`(未折叠,喂所有磁盘路径与 `buildInjection` 下游),让路径消费者逐字节不变;
新增 parity 测试**驱动真实 bin**(`execFileSync`,沿 `staleLedgerPerSlot.test.ts` 的姐妹 pattern,
因为模块以 `void main()` 结尾且 bundle 才是真正跑的东西)。该测试在折叠前返回空值,
会抓到这次分叉。

## F3 — 22 个既存测试只断言 bin 自洽,从未断言 bin 与 CLI 相合

折叠复制品后,3 个 bin 驱动测试文件里 22 个既存测试红了:它们全都用**裸 tmp 路径**
做 `workflows.json` 的键,而那是真实 CLI 在 win32 上**从不会写**的槽位。
已改为经 `normalizeRepoKey` 取键。这类测试是潜伏的:绿不代表两侧一致。
`injectState.test.ts` 里那些 `expect(stdout).toBe(buildInjection(repoRoot, …))` 的
逐字节断言仍安全,因为 `repoRoot` 只被 `join` 用于磁盘读、从不嵌进输出
(核过 `src/checkpoint/injectState.ts:267,334,342,356`)。

## F4 — `<new-diagnostics>` 幻影,本 phase 内复现两次

两次都报「某导出不存在 / 某名字找不到」,两次都被自跑 `tsc --noEmit`(退出 0,零输出)证伪;
逐条抽查也证实 import 都在。第二次报的是**测试文件缺 import**,看着更可信,
于是额外核了 `tsconfig.json` 无 `include`/`exclude` ⇒ 默认覆盖 `tests/`,
所以 tsc 的 0 是有效覆盖下的 0。记忆 `feedback_stale-diagnostics-verify-tsc` 再次成立。

## F5 — `pnpm` 不在 PATH(复现本仓 CLAUDE.md 已载的坑)

`pnpm exec biome` 退出 **127**(command not found)。必须 `corepack pnpm exec biome`。
退出码 127 容易被当成「检查通过」误读,因为它不打印 biome 的失败信息。

## F6 — 已知且已挂账,本 phase 不碰

`src/cli.ts` 调的 `migrateLegacyHarnessedRoot` 硬编码 `homedir()/.harnessed` 与
`homedir()/.claude/harnessed`,绕过 `detectPlatform().stateRoot` seam 且**忽略
`HARNESSED_ROOT_OVERRIDE`** —— 任何走到它的测试都会写真实用户目录。
既存,已在 `STATE.md` 的 carry-forward(v9.0 历史遗留)。T1 的迁移**刻意不沿用**这个姿态。

## F7 — `check-host-primitives.mjs` 的扫描盲区(待办 T8 顺带记)

它只扫 `workflows/**/SKILL.md` 与 yaml 面,**扫不到 TS 运行时字符串**。
所以 `resume.ts:81,83` 里硬编码的 `in Claude Code:` 与把 CC `session_id` 当
「SDK will redirect to original session」广告的措辞,闸门看不见。T8 修措辞,
闸门盲区本身另记 TODO。
