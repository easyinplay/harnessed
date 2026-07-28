# E1 — OS Code Signing 采购决策清单

> 状态:**决策待用户拍板**(涉及付费订阅 / 外部账户,不可自主推进)。
> 背景:TODOS E1 — 无签名 exe 触发 SmartScreen/Gatekeeper + Defender 误报,一行安装器体验的最大摩擦源。
> 范围:仅 **OS 层 code signing**(Windows Authenticode / macOS notarization)。更新通道的 ed25519 资产签名已于 4.32.19(review #12)落地,是另一回事,不受本决策影响。
> 价格为 2026-07 参考区间,下单前以官网为准。

## Windows(Authenticode)

| 选项 | 年成本(约) | SmartScreen 信誉 | CI 集成 | 备注 |
|---|---|---|---|---|
| **Azure Trusted Signing**(推荐先查资格) | ~$120/年($9.99/月) | 快速积累(微软托管证书) | 官方 GitHub Action(`azure/trusted-signing-action`),密钥不落 runner | 资格:个人需身份验证,组织需 3 年以上实体记录(以当前条款为准)。综合成本/集成度最优 |
| OV 证书(Certum/SSL.com/Sectigo) | ~$70–250/年 + 硬件 token | 慢(按下载量积累,新证书初期仍弹) | 需 eSigner 类云签或 token 过 CI(摩擦大) | 2023 起强制 HSM/token 存钥,CI 集成是主要痛点。Certum 有 ~€69 开源优惠 |
| EV 证书 | ~$250–400/年 | **即时**通过 | 同上 token 问题 | 贵且 CI 摩擦同 OV;仅当「首日零弹窗」是硬需求才值 |
| 不签名(现状) | $0 | 每次弹「未知发布者」 | — | 安装器转化率损耗;Defender 偶发误报需逐版申诉 |

## macOS(notarization)

| 选项 | 年成本 | 备注 |
|---|---|---|
| **Apple Developer Program**(唯一路径) | $99/年 | Developer ID 证书 + `notarytool` 公证;无替代方案。CI:证书 + App Store Connect API key 存 GitHub secrets,公证步 ~2-5min/版 |
| 不公证(现状) | $0 | Gatekeeper 拦截,用户须 `xattr -d com.apple.quarantine` 或右键打开;对 CLI 用户群尚可忍 |

## 不解决问题的选项(排除)

- **sigstore/cosign**:供应链透明性好,但**不是** Authenticode/notarization,SmartScreen/Gatekeeper 不认。
- **自签名证书**:OS 不信任,弹窗照旧。

## 推荐路径(按预算档)

1. **$0(维持现状)**:安装器文档写清弹窗预期 + bypass 步骤。已有兜底。
2. **~$120/年(仅 Windows)**:Azure Trusted Signing——先查个人/组织资格;过则 CI 集成半天内可落地(publish.yml binaries matrix 加一步)。Windows 是弹窗痛感最大的平台。
3. **~$220/年(双平台全签)**:上一档 + Apple Developer $99/年。macOS 公证步接入 `build-binary` 后的 matrix。

## 拍板需要回答的三个问题

1. 接受年度订阅成本吗?哪一档?
2. Azure Trusted Signing 资格核验(个人身份验证 / 组织实体年限)是否可过?
3. 发布主体名义:个人名(easyinplay)还是注册实体?(证书 CN 会展示给终端用户)

拍板后:开专项(/plan-ceo-review),CI 侧改动集中在 publish.yml binaries matrix(Windows 签名步 + macOS 公证步),预估 CC 工作量 M。
