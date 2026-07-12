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
- [ ] **Slice 3:npm per-platform optionalDependencies 二进制包** — P2
  Why: esbuild/Biome 模式,npm 用户也免 Node 前置运行时。Depends: Slice 1/2。

## Earlier deferrals (intel 回填表镜像,详 .planning/intel/omc-comparison.md)

- [ ] **B4 eval harness(comet `comet eval` 模式)** — P2 / L,v5+ 立项
- [ ] **G5/OMC ambiguity 量化阈值** — P3,方向级设计,v5+ discuss
