# ADR-0007: Categorization Schema Errata (manifest 加 category / install_type / decision_rules 字段)

## Status

**Accepted** — 2026-05-13

## Context

### Phase 1.2.5 wedge 重定位 lock 的 schema 缺口

phase 1.2.5 architecture revision（commit `33da1a0`，ADR 0006 wedge 重定位）锁定了三层栈方法论可执行 engine 的核心数据契约：

- **6 大 skill category**（meta / engineering / design / content / testing / search） — A8' acceptance bar lock；不再仅 4 category
- **decision rules**（DMN-style YAML，6 category × ≥ 12 rules MVP）— 用户笔记中 "ui-ux-pro-max + frontend-design 默认/冲突仲裁/override 做出风格" 这种规则不是配置，是机器可执行的 routing logic
- **4 install_type**（skill / mcp / npm / git）— D1.2.5-12 决策；区分 skill / MCP / npm package / git clone 4 种安装路径（chrome-devtools-mcp 是 MCP 不是 skill）

phase 1.1 ship 的 ADR 0001 manifest schema v1（`adr-0001-accepted` baseline tag 守恒）只覆盖 engineering category 一个分支的"10 固定上游 manifest"假设，**不含**这 3 个 phase 1.2.5 lock 的字段：

| 字段 | ADR 0001 schema | phase 1.2.5 lock 需要 |
|---|---|---|
| `category` | ❌ 不存在 | ✅ 6 enum union |
| `install_type` | ❌ 不存在（仅有 `install.method` 6 enum） | ✅ 4 enum union；与 method 1:N 闭合 |
| `decision_rules` | ❌ 不存在 | ✅ optional Object（per-manifest decision hint） |

phase 1.4 routing engine v1 实装时需要从 manifest **结构化** 读出 category + install_type + decision_rules（per-manifest hint），否则需 retrofit schema。

### A7 守恒约束（不动 ADR 0001 main body）

phase 1.1 acceptance bar A7 + phase 1.2 acceptance bar B7' + phase 1.2.5 wedge 共同要求 **ADR 0001-0006 main body 不可改**（仅允许 ADR-NNNN errata）。CI A7 step 自动 enforce — 任一 baseline tag iterate 出现非空 diff 即 fail。

本 ADR 0007 是 **errata** 形式 — 不动 ADR 0001 main body；schema 通过新增 3 字段（2 必填 + 1 optional）扩展。本 errata 沿袭 ADR 0003（install method count errata 5→6）+ ADR 0005（marketplace_source 字段补完）的"errata 不动 main body"风格。

### phase 1.4 routing engine 消费契约

phase 1.4 routing engine v1 实装时直接从 manifest 读：

- `manifest.spec.category` → category match (L1 router 第一层路由)
- `manifest.spec.install_type` → routing engine 选择 install adapter（skill → cc-plugin-marketplace / npx-skill-installer；mcp → mcp-stdio-add / mcp-http-add；npm → npm-cli；git → git-clone-with-setup）
- `manifest.spec.decision_rules`（optional）→ per-manifest decision hint（与 `.planning/decision_rules.yaml` 全局 rule-set 完全独立 schema — 全局优先，manifest 字段是 backup hint）

## Decision

### 1. SpecSchema 加 3 字段

在 `src/manifest/schema/spec.ts` `SpecSchema` 顶层基础上加 3 字段（**Pattern L spec-level metadata 加法**）：

```typescript
// SpecSchema 加（Type.Object 内部）：
category: Type.Union([
  Type.Literal('meta'),
  Type.Literal('engineering'),
  Type.Literal('design'),
  Type.Literal('content'),
  Type.Literal('testing'),
  Type.Literal('search'),
]),
install_type: Type.Union([
  Type.Literal('skill'),
  Type.Literal('mcp'),
  Type.Literal('npm'),
  Type.Literal('git'),
]),
// per-manifest decision hint（非全局 rule-set — 全局在 .planning/decision_rules.yaml T3.1）
decision_rules: Type.Optional(Type.Object({
  trigger: Type.Optional(Type.String({ minLength: 1 })),
  default_expert: Type.Optional(Type.String({ minLength: 1 })),
  arbitration_rule: Type.Optional(Type.String({ minLength: 1 })),
  override_signals: Type.Optional(Type.Array(Type.Object({
    phrase: Type.String({ minLength: 1 }),
    use: Type.String({ minLength: 1 }),
  }, { additionalProperties: false }))),
}, { additionalProperties: false })),
```

### 2. 字段语义

#### 2.1 `category`（必填，A8' lock）

6 enum union — manifest 自我声明所属 category，供 phase 1.4 routing engine L1 路由 match。

| enum value | 描述 | 示例上游 |
|---|---|---|
| `meta` | meta-skill creation / discovery（"创建 skill" / "找现有 skill"） | （phase 1.4+ 加入） |
| `engineering` | 工程化 / orchestration / 治理 / 心法 / 招式 | gstack / GSD / superpowers / karpathy / mattpocock / ralph-loop / planning-with-files |
| `design` | UI/UX / 前端设计 | ui-ux-pro-max / frontend-design |
| `content` | 文档 / pptx / 中文内容 | （phase 1.4+ 加入） |
| `testing` | E2E / a11y / perf / 内存 | playwright / chrome-devtools-mcp / webapp-testing |
| `search` | 网络搜索 / 库文档 | ctx7 / tavily-mcp / exa-mcp |

#### 2.2 `install_type`（必填，D1.2.5-12 lock）

4 enum union — 与 `install.method` **1:N 闭合**（一个 install_type 可对应多个 method；一个 method 对应唯一 install_type）：

| install_type | install.method（1:N） | 适用 manifest |
|---|---|---|
| `skill` | `cc-plugin-marketplace` / `npx-skill-installer` | superpowers / ralph-loop / planning-with-files / mattpocock-skills / karpathy-skills |
| `mcp` | `mcp-stdio-add` / `mcp-http-add` | tavily-mcp / exa-mcp |
| `npm` | `npm-cli` | ctx7 / gsd |
| `git` | `git-clone-with-setup` | gstack |

phase 1.4 routing engine 消费 `install_type` 选择 install adapter（不再依赖 `install.method` 字符串解析路由）。

#### 2.3 `decision_rules`（optional，per-manifest decision hint）

manifest 自己声明 "我适合什么场景"（trigger / default_expert / arbitration_rule / override_signals），供 phase 1.4 routing engine **fallback** 使用（全局 `.planning/decision_rules.yaml` 优先）。

字段：

- `trigger`（optional string）— 用户请求中的触发关键词描述（如 "user 请求 UI/UX 设计"）
- `default_expert`（optional string）— 默认调用的角色（如 `ui-ux-pro-max`）
- `arbitration_rule`（optional string）— 与同 category 其他 manifest 冲突时的仲裁规则
- `override_signals`（optional array of `{ phrase, use }`）— 用户原文出现 `phrase` 时强制使用 `use` 角色（如 `phrase: "做出风格", use: frontend-design`）

`additionalProperties: false` 严格模式 — 任何额外字段直接 reject。

### 3. ADR 0001 main body 不动（A7 守恒）

`docs/adr/0001-manifest-schema-v1.md` 的 SpecSchema 字段表 **不修改**；读者通过本 ADR 0007 知道："phase 1.3+ schema 实际多 3 字段（category 必填 / install_type 必填 / decision_rules optional），由 phase 1.2.5 wedge 重定位驱动。"

### 4. phase 1.1-1.2 已 ship 10 manifest 全量加字段

phase 1.3 T2.1 同步把 10 base manifest 全部补 `category` + `install_type` 字段（不补 `decision_rules`，optional 留 phase 1.4 按需加）。fixture（`tests/fixtures/manifests/valid/*.yaml`）同步加字段。

10 manifest mapping（参 task_plan T2.1）：

```
ctx7              → search × npm   (method: npm-cli)
tavily-mcp        → search × mcp   (method: mcp-stdio-add)
exa-mcp           → search × mcp   (method: mcp-stdio-add)
gstack            → engineering × git    (method: git-clone-with-setup)
gsd               → engineering × npm    (method: npm-cli)
superpowers       → engineering × skill  (method: cc-plugin-marketplace)
ralph-loop        → engineering × skill  (method: cc-plugin-marketplace)
planning-with-files → engineering × skill (method: cc-plugin-marketplace)
mattpocock-skills → engineering × skill  (method: npx-skill-installer)
karpathy-skills   → engineering × skill  (method: npx-skill-installer)
```

## Consequences

### 正面

1. **结构化 SSOT 三段** — manifest 不再藏 category / install_type 在 metadata 描述里靠后期解析复原；validate 时 schema 直接 enforce 6+4 enum。
2. **A7 守恒维持** — ADR 0001-0006 main body 0 修改；本 ADR 加 `adr-0007-accepted` baseline tag，CI A7 step iterate 1-7。
3. **phase 1.4 不需 retrofit** — routing engine 实装时直接 `manifest.spec.category` + `manifest.spec.install_type` 拿数据，无需后期 schema 大改。
4. **测试自动覆盖** — 新增 `tests/unit/manifest-validate.{category,install-type,decision-rules}.test.ts` 三文件 ≥ 12 cell；fixture-driven positive test 自动覆盖 10 manifest。
5. **phase 2.1 install adapter 解耦** — install adapter 调度走 `install_type`（skill/mcp/npm/git）四分支，不再嵌套 `install.method` 6 分支字符串 case。

### 负面

1. **认知负担** — schema 字段表分散到 ADR 0001 + 0005 + 0007，需 ADR README index 显式 link。
2. **mitigation**：`docs/adr/README.md` index 加 0007 行，并在 0001 索引行后保留 ADR 0005 注（本 ADR 不再追加 0001 索引行注释，避免索引行越来越长 — 0007 自带"errata"语义足够）。
3. **manifest 全量迁移** — phase 1.1-1.2 已 ship 10 manifest 全部需要补 `category` + `install_type` 字段；T2.1 一次完成。
4. **fixture 同步成本** — 10 fixture 同步加字段（无变更等价于 fixture-driven test 失败）。

### 中性

1. v0.1 `category` 仅 6 enum；v0.2+ 拓展（如加入 `infrastructure` / `data`）时再开 ADR 0008+ errata。
2. v0.1 `install_type` 4 enum 闭合现有 6 method；v0.2+ 加新 method（如 `direct-url-zip`）时同步拓展 `install_type` enum。
3. `decision_rules` schema 仅 v1（4 字段）；v0.2+ 加 cmd-shape 字段（cmd / args / security gate 扩展）时再开 ADR 0008+ errata。

## Compliance / Migration

### v0.1 强制约束

- `category` 必填（6 enum union；missing 直接 reject）
- `install_type` 必填（4 enum union；missing 直接 reject）
- `decision_rules` optional；如声明，则严格按 4 字段 schema（`additionalProperties: false`）
- `install_type` 与 `install.method` 1:N 闭合（schema 不强制 cross-field validate；phase 1.4 routing engine runtime check）

### W-2 D-9 propagation（ADR 0006 § 6 描述覆盖）

ADR 0006 § 6 "ROADMAP 重排" 段描述："`harnessed install --base` 一键装齐 (phase 1.3 加)"。

**本 ADR 0007 errata 官方覆盖该描述** — 实装走 D-9 决策 = **独立 `harnessed install-base` 子命令（不加 `--base` flag）**：

- 决策来源：phase 1.3 ASSUMPTIONS D1.3-9 lock — 独立子命令风格与 `harnessed install` / `harnessed doctor` / `harnessed audit` 等保持一致；避免 `--base` flag 与未来 install 子命令其他 flag 命名空间冲突
- A7 守恒规则下不能改 ADR 0006 main body（已被 `adr-0006-accepted` tag 守恒），故 D-9 决策由本 ADR 0007 errata Compliance 段官方覆盖；ADR 0006 § 6 描述视为"非规范性 sketch"，本 ADR 0007 § Compliance 视为"规范性实装契约"
- phase 1.3 T4.1 实装 `src/cli/install-base.ts`（独立子命令）+ T4.2 wire 到 `src/cli.ts`（8 个 register fn 之一）

### A7 验收命令更新

```bash
for n in 0001 0002 0003 0004 0005 0006 0007; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0007 main body unchanged"
```

CI workflow `.github/workflows/ci.yml` A7 step 同步升级 iterate 1-6 → 1-7（phase 1.3 T1.2 完成）。

### 守恒强化

phase 1.3 T1.1 完成时打 `adr-0007-accepted` tag（本地）；phase 1.3 T7.1 push 时让 CI A7 step 实测全绿 7 ADR baseline tag。任一非空 diff 即 fail。

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § "Top-level structure"（SpecSchema unchanged — A7 守恒）
- `docs/adr/0003-install-method-count-errata.md`（errata 不动 main body 风格沿袭）
- `docs/adr/0005-marketplace-source-schema-errata.md`（schema 字段补完 errata 风格沿袭）
- `docs/adr/0006-three-stack-mechanization-wedge.md` § 4 + § 5 + § 6（A8' 6 category lock + install_type 4 enum lock + ROADMAP 重排）
- `.planning/phase-1.3/PLAN.md` § 4 接口契约 + § 6 acceptance bar B1-B8
- `.planning/phase-1.3/ASSUMPTIONS.md` D1.3-2 + D1.3-7 + D1.3-8 + D1.3-9 + D1.3-12
- `.planning/phase-1.3/RESEARCH.md` R2 § 2.3 TypeBox 嵌套 robust 性 + R2 § 4 AgentDefinition 12 字段
- `.planning/phase-1.3/PATTERNS.md` R1 D-7 Pattern L spec-level metadata
- `.planning/phase-1.3/GRAY-AREA-1-routing-engine.md` § 2 schema（decision_rules.yaml v1 起源）
- `.planning/phase-1.3/PLAN-CHECK-ROUND-2.md`（13 fix items applied 验证 — round 2 verdict APPROVED）
- 10 base manifest（`manifests/{tools,skill-packs}/*.yaml`）+ 对应 fixture（`tests/fixtures/manifests/valid/*.yaml`）

### 外部参考

- DMN 1.4 Hit Policy Specification（OMG，Priority Hit Policy 仲裁规则起源）
- TypeBox 0.34 docs（`Type.Union` + `Type.Optional` + `Type.Object` `additionalProperties` 严格模式）
- Kubernetes API Conventions（`spec` 顶层加 metadata 字段的 K8s CRD 模式）
