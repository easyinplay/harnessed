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

## F12 — `PlatformDescriptor.id` 允许 6 个 id,但只有 2 个有描述符

`src/platform/platform.ts:41` 把 `id` 定成
`'claude' | 'codex' | 'agents' | 'cursor' | 'gemini' | 'copilot'`,
而 T4 新增的 `HostId`(由 `HOST_IDS` 派生)只有 `'claude' | 'codex'`。
所以 `descriptor.id` 不能直接赋给 `HostId` 字段,必须经 `isHostId()` 收窄。

这是个会咬将来的落差:**gemini milestone 开工时,`id` 联合里已经有 `'gemini'`,
但它没有描述符**,于是「类型上允许」与「运行时存在」不一致。加宿主时要同时
进 `HOST_IDS` 与描述符工厂,只改 `:41` 那个联合会得到一个类型过得去、
运行时 `descriptorFor` 没有分支的半截宿主。

## F11 — 手写账本 fixture 的三个坑(我连踩三次,产品一次没错)

做 T4-T6 的独立冒烟时,我的 fixture 连续三版被正确地报成「源账本在但读不动」。
三次都是我的错:

1. **`schemaVersion` 是字符串不是数字。** 值为 `'harnessed.workflow-store.v1'` /
   `'harnessed.current-workflow.v1'`(`src/types/schemaVersion.ts`),写 `1` 直接
   `Value.Check` 失败。
2. **Windows 反斜杠不能手拼进 JSON。** `repoKey` 形如 `c:\users\easyi\...`,
   直接插进 JSON 字符串里 `\u`(`\users`)被当 unicode 转义起始 ⇒ 坏 JSON。
   必须用 `JSON.stringify` 生成,不要用 heredoc 手拼。
3. **`SubProgressEntry.gate_fired` 是必填**(`currentWorkflow.v1.ts:46`,`Type.Boolean()` 非 Optional)。
   漏掉它会让**整本账**校验失败,因为 `workflows` 是
   `Type.Record(Type.String(), CurrentWorkflowV1)`,一个槽位不合格就整本不合格。

**反过来说,这三次恰好把 D14 验了**:每次都被准确地归类为「存在但无效」而非
「不存在」,而且 `{"schemaVersion":...,"workflows":{}}` 报的是「无候选」不是「损坏」。
定位手段是二分(只含必填 → 逐项加回),比读 schema 猜更快。

## F10 — 槽位单调增长无人修剪 ⇒ T7 从 P2 升为 adopt 可重复使用的**前置**

两条独立实测:

1. **全仓没有任何地方删槽位。** `rg 'delete .*\.workflows|delete store|delete .*\.intents|delete .*retro_meta' src/`
   **零命中**。`src/cli/gc.ts` 的 `gcCompiledArtifacts` 只扫安装备份与编译产物(`:52`、`:235`),
   不碰账本。
2. **session env 确实被注入**:`CLAUDE_CODE_SESSION_ID` 实测已设(36 字符,等于当前会话 id),
   `CODEX_SESSION_ID` 未设。所以 `activeKey()` 在 claude 侧会产出**复合键**,
   每个跑过 workflow 的会话留下一个永久 `repoKey::<sid>` 槽位(`state.ts:125` 只写 activeKey)。

合起来的后果:adopt 的候选匹配(D9)排除归档键 `::displaced-*` / `::premigrate-*`,
但**不排除** `::<sid>` 槽位 —— 它们是真候选。源宿主上会话一累积,
**D10 的「多候选 → 拒绝并列出」就从边缘情形变成常态**,adopt 第二次起就用不了。

所以 T7 的修剪**不是 P2 加分项**,是 adopt 能被重复使用的前置。原 P2 判断基于
「增长极慢(只在 paused + adopt 同时发生)」,那只覆盖了我新增的归档键,
漏了**既存的 session 槽位累积**这条更粗的来源。外部意见 #5 当时点到了
(「a monotonically growing map makes 'refuse on ambiguity' the normal outcome within weeks」),
我把它折进 T7 时降级成了「修剪归档键」,没接上它与 D10 的连锁。

**附带实证:T1 的迁移在真机生效。** 账本键今天早些时候是 `D:\GitCode\harnessed`,
现在是 `d:\gitcode\harnessed`(小写),且仍只有 1 个槽位、仍是裸键 —— 折叠成功、
未撞键、未丢槽位,与「本机无撞键 ⇒ 迁移为 no-op 式折叠」的预判一致。

## F8 — 我在 task_plan 与已提交 ADR 里引用了一个不存在的符号 `PLATFORMS`

D2 原写「`PLATFORMS` 已按 id 暴露两根(`platform.ts:145`)」,D16 要求 `--from` 候选从它派生。
**实测它不存在**:`platform.ts` 该处是一句注释,其下是**私有未导出**的
`descriptorById(id, home)`(一次一个描述符,不可枚举)。全仓 `rg PLATFORMS src/` 只有
`preflight.ts` 的 `SUPPORTED_PLATFORMS`(OS 名,无关)与 `setup.ts` 的 `KNOWN_PLATFORMS`
(而它本身就是 D16 要消除的手写清单之一)。

根因:我在会话早期 grep 到那行注释文本就当成了存在一个 keyed record,**没有 grep 符号本身**。
这正是项目 CLAUDE.md「Spec writing pre-commit checklist」第 3 条要防的事
(TS function/symbol name 必须 `grep -n "^export function <name>"` 验过),我没执行。

结论**因此加强而非削弱**:今天没有可派生的清单,所以 T4/T6 要新增一个导出的 id 清单
并让 `KNOWN_PLATFORMS` 消费它,把三份手写清单**收敛成两份**,而不只是「不做第四份」。
ADR 与 task_plan 均已显式留更正痕迹,未静默改写。

**连带教训:文档里的行号会腐烂。** T3 插入代码后,ADR 引用的 pin 探测位置从 `:199` 漂到 `:288`。
更正后改为点名构造(`[codexDescriptor(home).stateRoot, base.stateRoot]`)而非只给行号。

## F9 — `<new-diagnostics>` 本 phase 内幻影三次,3/3 全错

第三次报得最像真的:`platform.ts:227 Cannot find name 'resolveHostORIGINAL'` 加两处
`Duplicate function implementation` —— 一个具体的脚手架名字。实测 `rg resolveHostORIGINAL`
零命中、`resolveHost` 只定义一次、`tsc --noEmit` 退出 0 零输出。它捕到的是 subagent
做构建往返实验(为证明 bin 的 delta 全是自己的而非扫进来的陈旧)时的中间态。

判据固化:**诊断与自跑 `tsc` 冲突时,信 `tsc`**;但要先确认 tsc 的覆盖范围
(本仓 `tsconfig.json` 无 `include`/`exclude` ⇒ 默认覆盖 `tests/`,所以那个 0 是有效的 0)。

## F7 — `check-host-primitives.mjs` 的扫描盲区(待办 T8 顺带记)

它只扫 `workflows/**/SKILL.md` 与 yaml 面,**扫不到 TS 运行时字符串**。
所以 `resume.ts:81,83` 里硬编码的 `in Claude Code:` 与把 CC `session_id` 当
「SDK will redirect to original session」广告的措辞,闸门看不见。T8 修措辞,
闸门盲区本身另记 TODO。

## F13 — T7 / T8 副发现

- `mutateStore` 总是写盘,T7 锁内重判后无可删时仍会无内容变化地重写一次。要避免需给 `state.ts` 加导出,而它被 14 个测试文件 factory mock,故不碰。
- `messages/zh-Hans.json` 的其他 `gc.*` 文案本来就是英文,T7 只补了新增两条,未回补旧的。
- T8 把 `resume.ts` 的 `in Claude Code:` 与 `SDK will redirect` 改成宿主中立。F7 的闸门盲区(`check-host-primitives` 扫不到 TS 运行时字符串)仍在,未修,仅挂账。
