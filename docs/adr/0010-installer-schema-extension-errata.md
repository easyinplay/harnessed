# ADR-0010: Installer Schema Extension Errata (phase 2.1 — license whitelist + bundle-install `provides` + install_type enforcement + H3/H4 sister-review deferred items)

## Status

**Proposed** — 2026-05-15 (phase 2.1 plan-phase Wave 0 draft; flips to **Accepted** at phase 2.1 ship)

## Context

### Phase 2.1 scope — 4 installer 实装需 schema 扩展

phase 2.1 实装 `mcp-http-add` / `git-clone-with-setup` / `cc-plugin-marketplace` /
`npx-skill-installer` 4 个 placeholder installer（`phase21Placeholder` 删除，6 install
method 全 runtime-ready）。execute-phase 前的 Wave 0 需要先落地以下 schema 扩展，否则
4 个 installer wave 无 schema 依据：

1. **license whitelist 扩展** — `baoyu-skills` resolve 为 `MIT-0`（v0.2.0-extensions
   research 确认），现有 `SpdxLicense` 5-enum union 不含 `MIT-0`；`frontend-design` /
   `document-skills` / `webapp-testing` 来自 `anthropics/skills` monorepo，上游无独立
   `LICENSE` 文件 — 需 `anthropics-official` carve-out。
2. **`license_source` audit 字段** — license 来源 provenance 需可审计（README 声明 /
   registry 元数据 / 无 / anthropics-official carve-out）。
3. **bundle-install 建模** — `document-skills`（`anthropics/skills` → pptx + docx +
   xlsx + pdf）通过 ONE `claude plugin install` 安装，一次 install 动作产出 4 个 doc
   skill。现有 `SpecSchema` 一 manifest 一 atomic component，无法表达 bundle。
4. **install_type enforcement** — `install_type`（4 enum）↔ `install.method`（6
   method）的 1:N 闭合（ADR 0007 lock）目前仅文档约定，schema/validate 层未机械 enforce。

### Phase 1.5 sister review H3/H4 deferred items 需正式记录

phase 1.5 sister review 留下 2 个 deferred item，phase 2.1 Wave 0 正式登记：

- **H3** — `src/routing/agentDefinition.ts` budget。phase 1.4 ADR 0008 设 ≤150L budget
  cap；phase 1.5 T5.4 实装 14-字段 factory（contract v1.1 — `initialPrompt` +
  `criticalSystemReminder_EXPERIMENTAL` + `AGENT_DEFINITION_FIELDS` drift detector）后
  实测文件已增长，超出原 ≤150L cap。需正式 errata 记录新 budget。
- **H4** — `arbitrate()` substring match false-positive 风险。ADR 0009 § Decision 2
  `matchesTrigger()` 用 `task.prompt.toLowerCase().includes(trigger.toLowerCase())`，
  substring 包含匹配会有 false-positive（trigger `"test"` 命中 `"latest"` /
  `"contest"`）。需正式记录为已知 limitation + 缓解路线。

### A7 守恒约束（ADR 0001-0009 main body 不可改）

phase 2.1 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 errata 风格 — **不动 ADR 0001-0009
main body**（A7 守恒）。`docs/INSTALLER-CONTRACT.md` +
`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 同样不动 — H3 走本 ADR 0010
errata 记录，不改 contract main body。本 ADR 0010 起 phase 2.1 ship 时刻 frozen；v0.2.2+
演化走 ADR 0011+ errata。

## Decision

### 1. license whitelist 加 `MIT-0` + `anthropics-official` carve-out

`src/manifest/schema/metadata.ts` 的 `SpdxLicense` `Type.Union` 加 2 个 `Type.Literal`：

- **`MIT-0`** — `baoyu-skills`（`jimliu/baoyu-skills`）resolve 为 MIT-0（MIT No
  Attribution）。MIT-0 是 OSI 认可、SPDX 注册的合法 license id，加入白名单后
  `chinese-content-deck` 路由 rule 不再需 `warn:` license 警告（见 T1.5）。
- **`anthropics-official`** — `frontend-design` / `document-skills` / `webapp-testing`
  来自 `anthropics/skills` monorepo，上游不为每个 sub-skill 提供独立 `LICENSE` 文件。
  这是一个 **carve-out**（非标准 SPDX id），明示"该组件来自 anthropics 官方 skills
  仓库，license 归属随 anthropics/skills 仓库整体"。

沿袭现有 `InstallType` / `Category` 4-/6-literal union pattern（PATTERNS § 3.1）。

### 2. `license_source` audit 字段

`src/manifest/schema/metadata.ts` 的 `Upstream` object 加 optional `license_source`
enum，记录 license 信息的来源 provenance：

| 值 | 含义 |
|----|------|
| `README` | license 从上游仓库 README 声明提取 |
| `registry` | license 从 npm/package registry 元数据提取 |
| `none` | 上游无 license 声明（需人工 review，对应未来 `archived` 等场景）|
| `anthropics-official` | anthropics/skills carve-out — license 随仓库整体 |

`Type.Optional` — 纯 additive，A7' 8-pillar safe，所有现有 manifest 不破。

### 3. bundle-install — 新 optional `provides:` 顶层字段（D2.1-1）

`src/manifest/schema/spec.ts` 加 `ProvidedUnit` object + optional `provides:` 顶层数组
字段（RESEARCH § 1 Option C — 最 surgical）：

```typescript
const ProvidedUnit = Type.Object(
  {
    id: Type.String({ minLength: 1 }),   // routing-addressable, <org>-<repo>-<unit>
    component_type: ComponentType,        // reuse existing union
  },
  { additionalProperties: false },
)
// 加入 SpecSchema:
provides: Type.Optional(Type.Array(ProvidedUnit, { minItems: 2, uniqueItems: true })),
```

- `provides` 缺省 ⇒ manifest 是 atomic（今天行为，byte-identical 不变）。
- `provides` 存在 ⇒ 一次 install 暴露 N 个具名 unit。`minItems: 2` — 1-unit 的
  "bundle" 就是 atomic manifest，强制区分。`uniqueItems: true` — 防 id 重复。
- **`install` / `verify` / `uninstall` 保持 singular 不动** — bundle 由 ONE
  `claude plugin install` 安装；建模 4 个独立 install block 会误表达现实并破坏
  dispatch-table 1:installer:1:method invariant。
- bundle manifest 用现有 `type: 'cc-skill-pack'`（D2.1-2 — 无新 `TypeEnum` /
  `ComponentType` 值）。
- `decision_rules.yaml` 的 bundle-routing 编辑（granular `anthropics-skills-pptx` →
  bundle 解析）是 **phase 2.3** scope，**不是** phase 2.1（D2.1-3）。phase 2.1 只 ship
  `provides` schema 字段 + 测试，让 phase 2.3 能 author `document-skills` manifest。

### 4. install_type ↔ install.method 1:N 闭合 enforcement

`src/manifest/validate.ts` 加 cross-field refinement check（TypeBox `Type` 不支持
cross-field 约束 — PATTERNS § 3.4，这是 validate 层 rule）。1:N 映射闭合（ADR 0007）：

| `install_type` | 合法 `install.method` |
|----------------|----------------------|
| `npm` | `npm-cli` |
| `mcp` | `mcp-stdio-add` / `mcp-http-add` |
| `git` | `git-clone-with-setup` |
| `skill` | `cc-plugin-marketplace` / `npx-skill-installer` |

不匹配 → validate 抛 error，`keyword: 'install-type-mismatch'`。这把 ADR 0007 的 1:N
闭合从"文档约定"升级为"机械 enforce"。

### 5. H3 errata — `agentDefinition.ts` budget ≤150L → ≤200L 正式记录

phase 1.4 ADR 0008 给 `src/routing/agentDefinition.ts` 设 ≤150L budget。phase 1.5 T5.4
实装 contract v1.1（`AgentDefinition` 12 → 14 字段：`initialPrompt` +
`criticalSystemReminder_EXPERIMENTAL` 两个 optional string 字段 +
`AGENT_DEFINITION_FIELDS` drift detector const）后，文件实际增长。

**三处数字对齐（实测 — 2026-05-15）**：

| 项 | 值 |
|----|----|
| **measured（实测当前行数）** | `wc -l src/routing/agentDefinition.ts` = **191L** |
| **原 budget cap（ADR 0008）** | ≤150L |
| **new budget cap（本 ADR 0010 errata）** | **≤200L** |
| **delta** | 148L → 191L，即 **+43L**（2 optional string 字段 `initialPrompt` +
  `criticalSystemReminder_EXPERIMENTAL` + `AGENT_DEFINITION_FIELDS` drift detector）|

新 budget cap = **≤200L**。191L 实测值留 9L headroom。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`
v1.1 14-字段 schema main body **不动** — H3 budget 调整仅通过本 ADR 0010 errata 记录，
不改 contract main body（A7 守恒 — contract main body 与 ADR main body 同等守恒规则）。

### 6. D-16 — `--header` `${ENV_VAR}` 环境变量解析方式

`mcp-http-add` installer 的 `--header` 值可能携带 `${ENV_VAR}`（如
`Authorization: Bearer ${API_KEY}`）。B1 安全 gate（`checkCmdString`）会对 `${...}`
报 false-positive。**决策（D-16 — RESEARCH § 6 推荐方案 a）**：installer 在 arg 构造
**之前** resolve `process.env`（`resolveHeaders` helper，inline ≤10L）：`${VAR}` 未设
→ throw `InstallError keyword:'env-unset'`；resolve 后的值不含 `${...}` → B1 per-arg
re-screen 不会 false-positive。**B1 `checkCmdString` gate 零改动** — 安全 gate 保持
纯净，env-resolution 在 installer 层完成。

## Consequences

### 正面

1. **4 installer wave schema 依据齐备** — Wave 1-4 可直接实装，无 schema blocker。
2. **license 审计透明** — `MIT-0` + `anthropics-official` 白名单化 + `license_source`
   provenance 字段，license 来源可机械审计。
3. **bundle-install A7' clean** — `provides` 纯 additive，所有现有 manifest validate
   byte-identical，无 migration script。
4. **install_type 闭合机械 enforce** — ADR 0007 的 1:N 闭合从文档约定升级为 validate
   层 hard check，manifest 作者不可能写出 install_type/method 不一致的 manifest。
5. **H3 budget 透明** — `agentDefinition.ts` budget ≤150L → ≤200L 正式 errata 记录，
   三处数字（measured 191L / cap ≤200L / delta +43L）对齐，无隐性 budget 漂移。

### 负面

1. **H4 `arbitrate` substring match false-positive 风险（已知 limitation）** — ADR
   0009 § Decision 2 的 `matchesTrigger()` 用
   `task.prompt.toLowerCase().includes(trigger.toLowerCase())` substring 包含匹配。
   已知 false-positive：trigger `"test"` 会命中 prompt 中的 `"latest"` / `"contest"` /
   `"protest"` 等子串。**缓解路线**：v0.2+ semantic router L2（`semanticRouter.ts` 当前
   v0.1 stub return null）替代 substring 匹配，用 embedding 语义相似度；在此之前 H4 作为
   已知 limitation 接受 — 30-sample truth table 当前未暴露该 false-positive（trigger
   词选择上无 substring 碰撞），但新增 rule 时需人工 review trigger 词是否会 substring
   碰撞。transparency verify checklist（T1.7）防 verdict 反模式复发。
2. **认知负担扩大** — schema 字段表分散到 ADR 0001 + 0005 + 0007 + 0009 + 0010；
   `docs/adr/README.md` index 需加 0010 行。mitigation：本 ADR 自带"errata"语义。

### 中性

1. ADR 0001-0009 main body 0 修改；本 ADR 加 `adr-0010-accepted` baseline tag，CI A7
   step iterate 1-9 → 1-10（T6.3 落地）。
2. `provides` id 命名约定（`<org>-<repo>-<unit>` vs 其他）是 phase 2.3 的 call — phase
   2.1 只 ship schema 字段使其存在。
3. `license_source` 字段 phase 2.1 不强制回填现有 manifest（optional）；phase 2.3+
   author 新 manifest 时按需填写。

## Compliance / Migration

### A7 守恒验收命令（phase 2.1 ship 后 0001-0010 iterate）

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0010 main body unchanged"
```

phase 2.1 draft 阶段（本 ADR `Proposed`）验收：
```bash
git diff adr-0001-accepted -- docs/adr/0001-*.md   # = 0 lines (A7 守恒)
```

ADR 0001-0009 main body 不动；`docs/INSTALLER-CONTRACT.md` +
`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 不动（H3 走本 errata）。

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in 0001 ... 0009` loop 加 `0010`；
step name `ADR 0001-0009` → `ADR 0001-0010`（T6.3 落地）。

### Errata-path note

phase 2.1 ship 时打 `adr-0010-accepted` baseline tag（本 ADR main body 自 draft 时刻
验证 0 diff stable）。push 后 CI A7 step 实测 10 ADR baseline tag 全绿。任一非空 diff
即 fail。本 ADR 0010 起 phase 2.1 ship 时刻 frozen — 任何 v0.2.2+ 演化（新 license
id / bundle routing 解析 / 新 installer method / H4 semantic router L2 true impl）必须
开 ADR 0011+ errata；本 ADR 0010 main body 不可改（与 ADR 0001-0009 同等守恒规则）。

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § "Top-level structure"（SpecSchema / SpdxLicense
  unchanged — A7 守恒）
- `docs/adr/0003-install-method-count-errata.md` / `0005-marketplace-source-schema-errata.md`
  / `0007-categorization-schema-extension.md`（errata 不动 main body 风格沿袭）
- `docs/adr/0008-routing-engine-v1-errata.md`（agentDefinition budget ≤150L 原始 cap —
  本 ADR § Decision 5 H3 errata 续接）
- `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` § Decision 1（contract v1.1
  14 字段 — H3 budget 增长根因）+ § Decision 2（`matchesTrigger()` substring match —
  H4 factual source）
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`（v1.1 14-字段 contract — H3 errata 对象，
  main body 不动）
- `src/manifest/schema/metadata.ts`（`SpdxLicense` 5-enum union — § Decision 1/2 扩展点）
- `src/manifest/schema/spec.ts`（`SpecSchema` / `ComponentType` — § Decision 3 扩展点）
- `src/manifest/validate.ts`（validate 层 — § Decision 4 cross-field check landing）
- `.planning/phase-2.1/2.1-CONTEXT.md`（D-03 / D-04 / D-05 / D-08 / D-16）
- `.planning/phase-2.1/RESEARCH.md` § 1（D2.1-1 bundle-install Option C concrete sketch）
  + § 3（D2.1-7/8 transparency verify）
- `.planning/phase-2.1/PATTERNS.md` § 3（TypeBox schema-change patterns）
- `.planning/phase-2.1/task_plan.md` T1.1（本 ADR 0010 draft + adr-0010-accepted tag）

### 外部参考

- SPDX License List — `MIT-0` (MIT No Attribution) 注册 id 确认
- `anthropics/skills` monorepo（frontend-design / document-skills / webapp-testing 来源
  — 无 per-skill LICENSE 文件，`anthropics-official` carve-out 依据）
- `vercel-labs/skills` upstream issue #675（`document-skills` 4-in-1 bundling 确认 —
  bundle-install 建模动因）
