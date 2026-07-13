# TODOS

> Deferred work with context. Source of each entry = a review decision (linked). Do not
> inline into ROADMAP/STATE (doc discipline: one fact one home).

## From /plan-ceo-review 2026-07-12 (B5 Phase 3 Slice 1 — CEO plan: `~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-07-12-b5-phase3-slice1.md`)

- [ ] **E1 二进制签名(Windows Authenticode + macOS notarization)** — P2 / L(CC: M + 证书采购)
  Why: 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,安装器体验最大摩擦源。
  Depends: Slice 2 安装器立项时重估;证书成本(OV ~$100+/年,Apple $99/年)。
- [ ] **E3 channel-aware update(stable/beta)** — P3 / M(CC: S-M)
  Why: Trellis 模式的预发订阅。Blocked by: 发布节奏尚无 beta 轨道(预发 tag 约定 + publish.yml 分轨先行)。
- [ ] **`harnessed update --rollback`** — P3 / S(CC: S)
  Why: bin-backup 已存旧版,一条命令原子恢复。当前切片以文档化手动 restore 覆盖;等真实回滚需求信号。
- [ ] **undici EnvHttpProxyAgent 代理支持** — P3 / S
  Why: 受限网络下 update 下载不走系统代理。等真实用户信号;当前以可操作报错 + npm 渠道兜底。
- [ ] **Slice 2:curl/PowerShell 一行安装器** — P1(本切片发布后紧跟,OV1 裁决"不拖")
  Why: 创造二进制用户群;消灭 Node 22 前置。Depends: 资产命名契约(已冻结)+ per-asset .sha256(Slice 1 交付)。
- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P3(2026-07-12 降级,用户裁决)
  Why: esbuild/Biome 模式。价值质疑:npm 用户必有 Node(包是纯 JS 本就能跑),二进制用户已有一行安装器;
  收益仅剩启动速度,代价是 4 个 npm 包的发布管线/版本锁/launcher shim 维护面。等真实需求信号再启。
  Depends: Slice 1/2(已发)。

## Watch items

- [ ] **gsd-core 1.7.0 GA watch**(v15.0 re-sync 记,2026-07-13)— 现在 rc.6(`next` tag):
  negotiated host-integration interface(ADR-1239)与 destSubpath write-confinement 与
  harnessed 安装通道直接相关;GA 后评估 re-sync(write-confinement 可能改安装写入路径行为)。

## Earlier deferrals (intel 回填表镜像,详 .planning/intel/omc-comparison.md)

- [x] **B4 eval harness** — Slice A SHIPPED 4.31.0(trap suite + coverage 导航;B 真 agent 冻结待 mock report 实验、C 录制器待续)
- [ ] **SOP 文本 `--skip-sub clarify` 改名 `discuss`** — P3 / S,下次 SKILL 渲染 pass 顺带(engine 侧 synonym 已兼容,纯文本卫生)
- [ ] **G5/OMC ambiguity 量化阈值** — P3,方向级设计,v5+ discuss
