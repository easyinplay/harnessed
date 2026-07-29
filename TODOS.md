# TODOS

> Deferred work with context. Source of each entry = a review decision (linked). Do not
> inline into ROADMAP/STATE (doc discipline: one fact one home).

## From /plan-ceo-review 2026-07-12 (B5 Phase 3 Slice 1 — CEO plan: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-12-b5-phase3-slice1.md`)

- [ ] **E1 二进制签名(Windows Authenticode + macOS notarization)** — P2 / L(CC: M + 证书采购)
  Why: 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,安装器体验最大摩擦源。
  Depends: **用户拍板证书采购** — 决策清单已备:`docs/e1-code-signing-options.md`(4.32.20,三档预算 + 三个拍板问题)。
  注意:与 4.32.19 更新通道 ed25519 资产签名(review #12)是两回事,后者已落地。
- [ ] **E3 channel-aware update(stable/beta)** — P3 / M(CC: S-M)
  Why: Trellis 模式的预发订阅。Blocked by: 发布节奏尚无 beta 轨道(预发 tag 约定 + publish.yml 分轨先行)。
- [x] **`harnessed update --rollback`** — SHIPPED 4.32.20:`runBinaryRollback`(同款 rename dance,被换下的二进制先 bank 回 bin-backup/<curver>/ 保可逆;`--rollback [version]`,缺省取最高 banked 版;npm 模式明确拒绝导向 `npm i -g`)。
- [ ] **undici EnvHttpProxyAgent 代理支持** — P3 / S
  Why: 受限网络下 update 下载不走系统代理。等真实用户信号;当前以可操作报错 + npm 渠道兜底。
- [ ] **Slice 2:curl/PowerShell 一行安装器** — P1(本切片发布后紧跟,OV1 裁决"不拖")
  Why: 创造二进制用户群;消灭 Node 22 前置。Depends: 资产命名契约(已冻结)+ per-asset .sha256(Slice 1 交付)。
- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P3(2026-07-12 降级,用户裁决)
  Why: esbuild/Biome 模式。价值质疑:npm 用户必有 Node(包是纯 JS 本就能跑),二进制用户已有一行安装器;
  收益仅剩启动速度,代价是 4 个 npm 包的发布管线/版本锁/launcher shim 维护面。等真实需求信号再启。
  Depends: Slice 1/2(已发)。

## Gate semantics

- [ ] **ADR-0038 第三类:对缺失/null 成员用 `in` 落 fail-SOFT** — P2(4.32.23 spike 实测发现)
  `'x' in subtask.missing` 抛的是 `Cannot read properties of undefined (reading 'length')`,
  不匹配 `isUndefinedVariableError` 的 `/undefined variable/i`(`src/workflow/exprBuilder.ts:44-46`)
  → 落 ADR-0029 fail-soft,子项照 fire。目前无 judgment 用数组 fact 故未触发;
  引入任何数组 fact 前必须先把正则收口到 fail-closed(ADR-0038 的「静态配置漂移」理由同样成立)。
  证据:`.planning/phases/51-ecc-orchestration/findings.md` F7。

- [ ] **ECC 语言专家路由是否补机器层(B 方案)** — P3,等用户 rust/go 手测结论
  4.32.23 已交付 prose 级(Approach A:`harnessed prompt` 渲染 aliases + 单火/降级指令)。
  TS 面代理实测判专家无优势(findings F8),故未建 probe/resolver/git 语言推导机器。
  若 rust/go 面实测显示专家确有语言特有发现,再按 `task_plan.md` 的 T1-T5 回补。

## Watch items

- [x] **gsd-core 1.7.0 GA watch** — RESOLVED 2026-07-15:1.7.0 GA 已发(npm latest=1.7.0)。
  评估结论:host-integration interface(ADR-1239)+ destSubpath write-confinement 未改
  claude runtime 写入路径(本机 1.7.0 实测 gsd-* 仍装 ~/.claude/skills/,71 skill)。
  manifest re-sync 完成(npm_version ^1.7.0 / last_known_good 1.7.0 / 4.32.3)。

## Earlier deferrals (intel 回填表镜像,详 .planning/intel/omc-comparison.md)

- [x] **B4 eval harness** — Slice A SHIPPED 4.31.0(trap suite + coverage 导航;B1 证据包 SHIPPED(逮住 issue #7);Slice C 录制导出 SHIPPED 4.32.0(harnessed eval record,默认脱敏,round-trip);后续差异化实验需另一形态(模糊 spec/跨 session))
- [x] **SOP 文本 `--skip-sub clarify` 改名 `discuss`** — SHIPPED 4.32.20:generator(generateCommands + rewrite-skill-invoke-sections)+ 全部 workflows/*/SKILL{,.zh-Hans}.md 改 `--skip-sub discuss`;engine 侧 clarify→discuss synonym 保留(兼容已装旧文本)。
- [ ] **G5/OMC ambiguity 量化阈值** — P3,方向级设计,v5+ discuss
