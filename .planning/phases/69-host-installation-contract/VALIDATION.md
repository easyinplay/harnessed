# Phase 69 验收规划矩阵

日期：2026-10-23。状态：`planned`，不是实现测试或执行结果。
范围：保留 shared engine、method dispatchers 和 manifests，引入薄 HostAdapter；首期仅 Claude/Codex。用户已撤回直接替换安装方案。
Ownership：仅本文件；DESIGN.md、PLAN.md 及生产代码由其他执行单元管理。

## 证据边界

- 本次只读取仓库 research、源码与相关测试源码；没有运行测试、上游安装或访问本机 config/auth/key。
- 所有矩阵项均为 `planned`。现有测试路径是复用/扩展锚点，不代表已覆盖新增断言或通过。
- F：未来 fixture/mock/临时目录契约证据，不能证明 native host 激活。P：未来隔离 package-channel smoke，也不等于 live-host。
- L：未来另行授权的 live-host 证据，须记录 host/CLI 版本、OS、channel、时间和脱敏结果。U：未验证；当前执行证据全部为 U。
- RED 指未来负向 fixture/故障注入后断言应失败的方式；本次不注入、不执行，不填新测试数量或成功统计。
- 必须：本 phase 交付门槛。延后：保留未验证和阻塞原因，不得以 fixture success 替代。

## 路径索引

| 索引 | 生产/研究路径 | 最相关现有测试路径 |
| --- | --- | --- |
| H | `src/platform/platform.ts` | `tests/installers/platform-host-reason.test.ts`; `tests/installers/platform-codex.test.ts`; `tests/installers/platform-golden.test.ts` |
| R | `.planning/research/host-installation-patterns.md`; `src/installers/index.ts` | `tests/unit/installers-harness-overrides.test.ts` |
| S | `src/cli/lib/setup-helpers.ts`; `src/installers/lib/verifyInstalled.ts`; `src/installers/lib/idempotent.ts` | `tests/unit/cli-setup-helpers-stepb.test.ts`; `tests/unit/cli-setup-idempotent-probe.test.ts` |
| D | `src/cli/doctor.ts`; `src/cli/lib/check-install-channels.ts`; `src/cli/lib/check-codex-hooks.ts` | `tests/unit/cli-doctor.test.ts`; `tests/cli/check-install-channels.test.ts`; `tests/cli/check-codex-hooks.test.ts` |
| C | `src/installers/lib/codexPlugins.ts` | `tests/installers/codexPlugins.test.ts`; `tests/installers/codexPluginRegistry.test.ts` |
| U | `src/uninstallers/index.ts`; `src/uninstallers/lib/declaredTeardown.ts` | `tests/unit/uninstallers-declaredTeardown.test.ts`; `tests/cli/uninstall.test.ts` |
| A | `src/installers/lib/codexAgentRoles.ts`; `src/installers/lib/codexHookPlugin.ts` | `tests/cli/renderSkillTemplatesHost.test.ts`; `tests/unit/generate-commands.test.ts`; `tests/installers/codexAgentRoles.test.ts`; `tests/installers/codexHookPlugin.test.ts` |
| B | `src/cli/lib/skillIntegrity.ts`; `src/cli/lib/skillBackup.ts` | `tests/cli/lib/skillIntegrity.test.ts`; `tests/cli/lib/skillBackup.test.ts` |
| G | `manifests/skill-packs/gstack.yaml`; `src/cli/lib/probe-gstack.ts`; `src/installers/lib/gstackRuntime.ts` | `tests/cli/probe-gstack.test.ts`; `tests/unit/installers-lib-gstackRuntime.test.ts`; `tests/unit/installers-gstack-lease.test.ts` |
| P | `package.json`; `src/platform/packagePath.ts` | `tests/cli/lib/packagePath.test.ts`; `tests/unit/compile-bundle.test.ts`; `tests/unit/compile-unpack.test.ts` |

索引仅缩短引用；新增测试文件名由 PLAN.md 确定，本文不声称它们已存在。

## 契约矩阵

| ID | 路径锚点 | 验收断言 | RED 触发方式 | 门槛 / 证据 / 状态 |
| --- | --- | --- | --- | --- |
| H01 | H、R | context 构建边界通过注入的只读探测收集 home/env/OS/pin 快照；component resolver 对已捕获输入纯解析，同输入同计划、不修改输入，不再次读取 ambient process/fs。 | 冻结快照并在解析后设置读取 tripwire；外界 env 改变导致同一快照计划漂移即 RED。 | 必须 / F / planned |
| H02 | H、G | custom home（含空格）与 CODEX_HOME 明确区分 skills/config/state/detection；共享 `.agents/skills` 不是 host 安装证明；保留 Claude MCP sibling 路径。 | 默认 home 与 Claude 根放冲突 sentinel；读写错误根或把 config 根当 skills 根即 RED。 | 必须 / F / planned |
| H03 | H、G | 覆盖 unset、空与非空 override；`HARNESSED_ROOT_OVERRIDE` 仅移动 stateRoot，空值不形成相对路径；CODEX_HOME/参数优先级遵循批准设计。 | 父 env 指向另一 custom home，参数为空；preview/probe/write/delete 目标不同即 RED。 | 必须 / F / planned |
| H04 | H；`tests/cli/setup-platform.test.ts` | 未知显式 CLI host 在副作用前拒绝；未知 env/pin 的历史 fall-through 与 skipped reason 单独刻画；不启用其他 host。 | `--platform bogus`、未知 env/pin、双 session env；错误时写 pin 或接受 aspirational host 即 RED。 | 必须 / F / planned |
| H05 | H、G；`tests/installers/winSpawn.test.ts` | host 与 OS 独立；Claude/Codex 分别覆盖 win32/linux/darwin 的 shell/argv、路径与 junction/symlink 分支；mock OS 不是真实 OS 证据。 | 对同 host 注入错误 OS shell/路径，错误操作未被拒绝即 RED。 | 必须 / F；真实 OS 延后 L / planned |
| R01 | R、S、D、U | install、setup 展示分组/串行分区、probe/verify、doctor、uninstall 共享同一 effective plan 的 host/method/verify/source/targets/gates。 | override 将 plugin 改为 MCP；任一消费者仍读原 method、verify、host 或另行解释 override 即 RED。 | 必须 / F / planned |
| R02 | R、S | Claude 基线不漂移；Codex 完整替换 install 并按既有语义选 verify；缺 override 的 Claude-only 方法明确 mismatch。 | 去 override 或传 schema-invalid 空 install override；仍 dispatch、借目录/缓存变绿即 RED。 | 必须 / F / planned |
| R03 | S、D、G | presence、完整 runtime、native registration、enabled、trust 独立；unknown/unsupported 不等于 ready；只读 probe/doctor 不 repair/enable/trust。 | 仅留 SKILL.md、移除 runtime、CLI 不可解析、verifier 抛错；仍 ready 或发生写入即 RED。 | 必须 / F / planned |
| C01 | C、S、U | CLI plugin/skills 来源与 manual/unknown 管理责任不混用；qualified ID 精确匹配 marketplace，不以同名另来源授权更新/删除。 | 返回 `demo@other` 而计划要求 `demo@expected`；裸名或目录导致 ready/owned/可删除即 RED。 | 必须 / F / planned |
| C02 | C、D | installed 与 enabled 独立；available/not-installed、disabled、未知 enabled 不冒充 active；不可解析输出保留 unknown，不解析成空集成功。 | CLI fixture 含 installed+disabled、同名多 marketplace、坏 JSON/table；自动 enable 或判 active 即 RED。 | 必须 / F / planned |
| C03 | C、R、U；`src/installers/lib/state.ts` | 当前 manifest/ref/method/target 是本次意图而非历史 receipt；manifest/channel drift、手工 shared skill、observed-only state 不自动形成 ownership 或成功记录。 | 更换渠道/目标并保留旧资源或仅 presence receipt；仍接管、删除或改写成功记录即 RED。 | 必须 / F / planned |
| U01 | U、R | Codex declared uninstall 依据 effective host teardown；cmd 与 cleanup_paths 均不得沿用 Claude 目标，不用字符串替换猜外部 ownership。 | 原 manifest 留 Claude uninstall、Codex override 生效；拦截 spawn/rm，见 `--claude` 或 `.claude` 删除即 RED。 | 必须 / F / planned |
| U02 | U、B | 无明确 Codex teardown/ownership 时安全拒绝或报告不支持；拒绝越界路径、home 根、未知外部资源；cmd 失败不扩大删除权限。 | 缺 teardown、`..`/绝对越界、链接指用户目录、cmd 非零；越界删除或静默成功即 RED。 | 必须 / F / planned |
| U03 | `src/manifest/schema/spec.ts`; `src/manifest/security.ts`; `schemas/manifest.v1.schema.json`; U | 可选 Codex uninstall 扩展与实际消费者同批；嵌套 uninstall.cmd 和 cleanup_paths 均接受安全筛查，旧 manifest 继续有效，生成 schema 与 TypeBox 一致。 | 新增字段但 resolver 不读；在嵌套 cmd/cleanup 注入命令替换或路径逃逸；仅顶层字段检查通过即 RED。 | 必须 / F / planned |
| U04 | H、R、U；`src/platform/harnessedRoot.ts` | teardown 启用前，native/cleanup/state/receipt 目标及锁已固定于捕获 context；允许构建阶段只读探测，不在执行中重选宿主或迁移根。 | snapshot 后切换 host/home/root env 与 pin，拦截 cleanup/CLI/state；任一目标随 ambient 漂移即 RED。 | 必须 / F / planned |
| U05 | R、U | resolver 实际消费 component/host neutral-teardown policy，绑定审计过的 cmd 与 cleanup_paths；未审计或声明改变即 unsupported。 | 审计过的 global CLI 正例、GSD npm-cli 和未审计组件反例；仅按 method/name 或过期 audit 放行即 RED。 | 必须 / F / planned |
| A01 | A、B | `expected -> written`：声明的 harnessed-owned skills、commands、roles、hook wrappers 均在批准根生成，内容等于 host/OS 渲染预期。 | 漏一项输出、改字节/根；只凭声明存在就通过即 RED。 | 必须 / F / planned |
| A02 | A、B、U | `written -> declared`：实际写集均有 ownership 声明或显式分类例外；ledger/backup 元数据单列，不将外部 installer 写集归为自有。 | 注入未声明文件、漏报元数据、重复运行增意外产物；未捕获即 RED。 | 必须 / F / planned |
| A03 | A、B、U | 安装/重复安装/卸载保持既有用户文件、无 ledger、修改后受管文件和其他 host 内容的策略；engine 命名空间原有 backup/warn/overwrite 不被改写，来源不明不新增清理权限。 | user sentinel、修改 SKILL.md、备份失败、错误链接；突破既有覆盖/拒绝/警告规则或删除其他 host 内容即 RED。 | 必须 / F / planned |
| Z01 | R、S、U；`tests/integration/manifest-install-dry-run.test.ts`; `tests/cli/setup-platform.test.ts` | install/setup/uninstall dry-run 预览同一计划；零 target 写删、零 registration/trust/pin/receipt/backup mutation。既有 bootstrap/版本 metadata cache 独立记录，不伪称整个进程零 IO。 | 对 mutation 边界设 tripwire，比较隔离 target 前后快照；安装、注册或信任副作用即 RED，bootstrap/cache 单独审计。 | 必须 / F / planned |
| Z02 | R、D；`tests/unit/cli-lib-l4-rescue.test.ts`; `tests/installers/codexHookTrust.test.ts` | L4 `--system`、普通确认、hook trust 独立；`--yes`/非交互/host 选择不暗授系统写入或 trust，trust 不授权 L4。 | 交叉组合 system/yes/trust/dry-run；缺授权仍全局安装或 trust RPC 即 RED。 | 必须 / F / planned |
| G01 | G、S、D | 内容 probe 成功不代表 browser/runtime ready；gstack known-blocked 保留真实错误/退出码/原因，不被 retained-version/skip/adapter 折算为绿色。 | browser 非零、lease unavailable 或仅有内容；install/setup/doctor 报 ready 即 RED。 | 必须 / F / planned |
| G02 | G | 现有 opt-in real probe 仅为后续入口；机器 blocker 未重测前保留未验证/known-blocked，不通过换 fixture 或删检查消除。 | fixture success 标 live pass，或无新同环境证据就清除 blocker；证据审查判 RED。 | 延后 / L / planned |

## 隔离渠道 Smoke

以下均是未来规划，本次不 build/pack/compile、不启动 host、不调用上游安装。

| ID | 路径锚点 | 验收断言 | RED 触发方式 | 门槛 / 证据 / 状态 |
| --- | --- | --- | --- | --- |
| P01 | P、H、R | source channel 在独立 HOME/USERPROFILE/CODEX_HOME/state、受控 PATH 中运行解析、预览、只读诊断；外部 CLI 用 fixture，禁网络。 | 工作区外访问设 tripwire；泄漏真实 home、调用上游或借其他 channel 依赖即 RED。 | 必须 / P / planned |
| P02 | P、A | npm channel 用实际 pack 产物装入隔离 prefix，不依赖 checkout；声明/模板/消息等运行资产与 source 计划一致；staging 写入与 CLI dry-run 分账。 | 缺包内资产、切断 source 路径、污染另一 prefix；借 source 通过或 dry-run 写 home 即 RED。 | 必须 / P / planned |
| P03 | P、A | compiled channel 用独立载荷、不复用 npm/source assets；现有 first-use unpack 在隔离 bootstrap 单列记录，随后固定 baseline 检查 preview 无额外 target mutation；不改 compile entry 生命周期。 | 移走外部 assets、损坏 bundle；漏资产成功、跨渠道回退或 bootstrap 后 preview 修改 target 即 RED。 | 必须 / P / planned |
| P04 | P、G | 各 channel 分开记录 host/OS、载荷标识、隔离根、退出码、诊断；同 blocker 保持一致，不把加载成功当 native 安装成功。 | npm 成功覆盖 compiled 失败，或 gstack blocked 被汇总 ready；审查判 RED。 | 必须 / P / planned |
| L01 | C、D、G | native plugin activation/enablement、hook trust 生效、真实 browser 能力需独立 host 会话与授权；不读取 config/auth/key 补证据。 | 凭 mock CLI、文件存在或 package smoke 宣称 native 生效即 RED。 | 延后 / L / planned |

## 交付与灰区

### HIC Requirement Traceability

| Requirement | Planned Acceptance Cases |
| --- | --- |
| HIC-01 | H01-H05、R02 |
| HIC-02 | R01-R03、U01 |
| HIC-03 | U01-U05 |
| HIC-04 | H03、C02、Z01-Z02、G01 |
| HIC-05 | C01、C03、U02、A03 |
| HIC-06 | A01-A03 |
| HIC-07 | P01-P04、G01-G02、L01 |

- 执行时逐项记录命令、隔离条件、证据路径与结果；未运行保持 U，负向 fixture 正确失败不等于 live capability 通过。
- 必须项出现 RED 不可标 phase complete；延后项保留原因、授权条件和 blocker，不以跳过测试伪装 pass。
- `STATUS: NEEDS_CLARIFICATION`：若 DESIGN.md/PLAN.md 未锁定 custom CODEX_HOME 与共享 skills 映射、空参数优先级、未知显式 env 兼容策略，返回主 session，不在本文自决。
- `STATUS: NEEDS_CLARIFICATION`：缺 host-specific declared teardown 或 ownership 证据时只验安全拒绝；新增删除策略/用户修改文件政策必须先返回主 session。
- 不新增 receipt 格式、不重建 hash/backup、不扩大首期 host；不修改生产代码或其他规划文件，不 commit/push。
