# Gray Area 1: JSON Schema 校验器选型

> Phase: harnessed v0.1 phase 1.1
> Decided ADR: `D:\GitCode\harnessed\docs\adr\0001-manifest-schema-v1.md`
> Date: 2026-05-11
> Researcher: GSD advisor-researcher (Opus 4.7)

---

## 问题陈述

ADR-0001 已冻结 manifest schema v1，包含 4 种 manifest type、5 种异构 install method、复杂的 `type × install.method` 兼容矩阵、apiVersion / upstream_health / signed_by 等多个必填条件字段，并明确要求 **strict 模式**（未知字段直接 reject，对标 Kubeconform `-strict`）。phase 1.1 需要选定一个 schema 校验器作为 CI / runtime 校验的基础设施 —— 这个选择会同时决定：(a) 我们能否把 schema 文件作为 IDE-friendly artifact publish 给社区（让上游作者用 VS Code YAML 插件本地校验自己的 manifest），(b) installer / doctor / setup CLI 在 TypeScript 端能否享受 `infer` 出强类型，(c) 错误信息能否精准指向"哪个 yaml 文件第几行哪个字段不对"。

候选库的核心张力在于：**"真正的 JSON Schema 标准"**（Ajv / TypeBox）与 **"TypeScript-first DX"**（Zod / Valibot）的取舍。前者输出可被任何 JSON Schema 工具消费的 artifact（OpenAPI 生态、IDE、其他语言），后者 DX 更优但 schema 不是真正的 JSON Schema。考虑到 manifest 是 harnessed 的核心 IP 和**社区扩展点**，且 ADR-0001 显式提到"JSON Schema 文件可独立 publish"，本调研最终倾向 JSON Schema 标准派。

---

## 候选方案对比表

| 维度 | Ajv (v8.17.1) | Zod (v4) | TypeBox (v0.34.49 LTS / v1.x) | Valibot (v1.3.1) |
|------|---------------|----------|-------------------------------|------------------|
| **本质** | 纯 JSON Schema 校验器 | TS-first schema lib，可单向导出 JSON Schema | JSON Schema builder（schema 即 JSON Schema 对象），TS 类型从 schema 推导 | TS-first schema lib，模块化、可单向导出 JSON Schema |
| **JSON Schema 规范符合度** | 完整 Draft-04/06/07/2019-09/**2020-12** + JTD（最权威实现） | `toJSONSchema()` v4 内置但**有损**，仅供导出文档用 | 原生输出标准 JSON Schema（Draft-07，v1.x 原生 2020-12） | 通过 `@valibot/to-json-schema` 单向转，不能完整覆盖 valibot 全部能力 |
| **Strict 模式 / unknown fields reject** | 默认 `strict: true` + schema 内 `additionalProperties: false` 双重保险 | `.strict()` modifier 拒绝 unknown keys | `Type.Object({...}, { additionalProperties: false })`，校验由 Ajv / TypeCompiler 执行 | `v.strictObject()` 拒绝 unknown keys |
| **conditional schema（type × install.method）** | 完整支持 `if/then/else`、`oneOf` + `discriminator`（需 `discriminator: true` 选项） | `z.discriminatedUnion("type", [...])`，DX 最好但只在 TS 端工作 | `Type.Union([...])` + discriminator 标注，输出标准 JSON Schema oneOf | `v.variant("type", [...])`，DX 类似 Zod，导出 JSON Schema 时较受限 |
| **TypeScript 类型推导** | 无（需手写 interface 或外加 `json-schema-to-ts`） | `z.infer<typeof S>`，v4 修复递归类型 | `Static<typeof S>`，schema 即 JS 对象（直接是 JSON Schema） | `v.InferOutput<typeof S>` |
| **错误信息质量** | 结构化 `ErrorObject[]`（含 `instancePath`、`schemaPath`、`keyword`、`params`），配合 `ajv-errors` 可自定义 | `ZodError.issues[]`，v4 引入 `prettifyError`；DX 一流 | 自带 TypeCompiler 错误较粗（尤其 union），实战推荐外接 Ajv | v1.1 引入 `prettifyError`，结构化 issues |
| **性能（schemabenchmarks.dev）** | JIT 编译；TypeBox + Ajv 100k 复杂对象 ~8ms | v4 比 v3 快 6-14×，但仍比 Ajv 慢 ~22× | TypeCompiler 比 Ajv 还快 ~2×（纯校验） | 中位 (~85ms)，比 Zod v4 快 2× 但比 Ajv 慢 10× |
| **Bundle size**（min+gzip） | ~30 KB（含 strict + formats） | ~14 KB（v4 classic），@zod/mini ~1.9 KB | ~30 KB（含 compiler）；schema-only ~5 KB | **~1.9 KB**（含 to-json-schema ~6 KB），最小 |
| **License** | MIT | MIT | MIT | MIT |
| **维护活跃度 / npm 周下载** | ESLint 等核心生态依赖；JSON Schema 规范工作组首推实现 | ~20M 周下载；v4 2025-08 GA，社区最大 | **80M+ 周下载**（Fastify、Elysia、Hono 都在用） | 8.6k stars，v1 GA 2025；增长快但生态最年轻 |
| **可独立 publish 给社区** | schema 本身就是 `*.schema.json` 文件，VS Code YAML 插件 / SchemaStore 直接消费 | schema 是 TS 代码，社区只能 import TS（破坏多语言生态） | schema 是 JS 对象，`JSON.stringify` 即得标准 schema 文件 | 同 Zod，社区需先经我方导出脚本 |

---

## 各候选深度分析

### Ajv（推荐主选）

Ajv (v8.17.1, MIT) 是 JSON Schema 工作组首推的实现，被 ESLint、JSON Schema 官方 CLI、Fastify、AWS CDK 等核心生态依赖，是 schema validator 领域事实上的"工业标准"。

**为什么适合 harnessed**：(1) 完整支持 Draft-2020-12，包含 `if/then/else` 与 `discriminator`（开 `discriminator: true` 后专为 oneOf 优化），完美匹配 ADR-0001 的 `type × install.method` 兼容矩阵；(2) 默认 strict mode 三件套 (`strictSchema/strictTypes/strictRequired`) + schema 内 `additionalProperties: false` 直接满足"未知字段拒绝"；(3) 可配 `ajv-errors` 给每个字段自定义错误消息，配 `ajv-formats` 校验 ISO date / SemVer / SPDX URI；(4) 错误对象 `ErrorObject` 含 `instancePath` / `schemaPath` / `keyword` / `params`，配合 `yaml@2.x` 的 CST `range` 信息可精准映射"yaml 第 N 行 M 列字段错"；(5) JIT 编译，100 manifest 校验 < 10ms，远超 < 100ms SLA。

**主要缺点**：本身不输出 TS 类型。但这能用 **`@sinclair/typebox`** 完美补足 —— TypeBox 的 schema 对象**直接是** Ajv 能消费的 JSON Schema，类型由 `Static<typeof S>` 推导，校验交给 Ajv（拿到精细错误信息）。

### Zod (v4)

Zod (v4 GA 2025-08, MIT, ~20M weekly) 是 TS 生态最流行的 schema 库，DX 是四个候选中最佳。

**为什么不选 Zod 作为 manifest 校验器**：(1) 本质上 Zod schema 是 TS 代码，**不是** JSON Schema —— `toJSONSchema()` v4 虽内置但是单向、有损，无法实现 ADR 提到的"schema 可独立 publish 让社区 IDE 用"目标；(2) 性能仍比 Ajv 慢 ~22×；(3) 复杂 schema 写 Zod 比写 JSON Schema 还啰嗦；(4) 把 schema 锁在 TS 生态会让未来出 Python / Go 子项目时再次重写 schema。

### TypeBox（推荐配套）

TypeBox (`@sinclair/typebox` v0.34.49 LTS, MIT, **80M+ weekly downloads**, 6500+ 依赖项目) 在 Fastify、Elysia、Hono、AWS Powertools 等高性能 TS 框架中已成为事实标准。它独特的设计哲学是：**schema 对象 = 标准 JSON Schema 对象**。

**为什么是绝佳的"Ajv 配套"**：(1) `Type.Object({...})` 写起来像 Zod 一样有 IDE 智能提示，但产出的就是 Ajv 能直接 consume 的 schema 对象，零转换损失；(2) `Static<typeof ManifestSchema>` 自动得到精确 TS 类型；(3) v0.34 LTS 仍主线维护，dual ESM+CJS 兼容（v1.x 是 ESM-only + TS7-native，本项目用 LTS 更稳）；(4) 校验仍走 Ajv，仅用 TypeBox 做 schema 定义 —— TypeBox 自己的错误信息不够友好，不要用它做 user-facing 校验。

### Valibot

Valibot (v1.3.1, MIT, ~8.6k stars) 最大卖点是 **bundle size 1.9 KB**（vs Zod 14 KB） —— edge / serverless / 浏览器场景王者。

**为什么不选 Valibot**：(1) 本项目是 **CLI / installer**，bundle size 不是关键约束；(2) `@valibot/to-json-schema` 同样是单向、有损；(3) 与 Zod 一样不解决 "schema as standalone artifact" 的核心需求；(4) 生态最年轻，错误信息基础设施刚起步。

---

## 推荐

**主选**：**Ajv (v8.17.x) 作为校验引擎 + `@sinclair/typebox` (v0.34 LTS) 作为 schema 定义层**

理由（按优先级）：

1. **战略对齐 ADR-0001**：schema 即标准 JSON Schema 文件，可作为 `manifest-schema.v1.json` artifact 与 npm 包一起 publish，社区作者只需在 manifest 顶部加 `# yaml-language-server: $schema=...` 即可在 VS Code 获得自动补全 + 校验
2. **strict + conditional 矩阵原生支持**：Ajv `oneOf` + `discriminator: true` 天然适配 `type × install.method` 矩阵
3. **DX 不输 Zod**：TypeBox 提供 `Static<>` 推导，installer / doctor / setup 全程强类型
4. **性能远超 SLA**：Ajv JIT 编译，100 manifest < 10ms（vs SLA 100ms）
5. **错误信息精细**：Ajv `ErrorObject[]` + `ajv-errors` + `yaml@2.x` CST `range` 三层组合
6. **生态背书**：ESLint / Fastify / AWS CDK / JSON Schema 工作组都用 Ajv；TypeBox 80M+ 周下载

**Fallback**：纯 Ajv + 手写 `*.schema.json` + `json-schema-to-ts` 推 TS 类型 —— 牺牲 DX 但获得最大稳定性。该 fallback 切换成本约 1 工作日。

**明确不选**：Zod 与 Valibot 都因 "schema 不是真正的 JSON Schema" 与 ADR "可独立 publish" 目标根本冲突而排除。

---

## 对 phase 1.1 实施的具体建议

### 包名 / 版本（严格 pin minor，allow patch）

```json
{
  "dependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "ajv-errors": "^3.0.0",
    "@sinclair/typebox": "^0.34.49",
    "yaml": "^2.8.4"
  }
}
```

注意：

- **不要用 `js-yaml`**。改用 `yaml@2.x`，它的 `parseDocument()` 提供 CST `range` 信息，能精确映射错误行号
- **不要用 TypeBox v1.x**（ESM-only + TS7-native，仍在迭代），等 1.x 稳定后在 v0.2 评估升级
- 不引入 `ajv-keywords`、`ajv-cli` 等扩展（YAGNI）
- 注意：开 `discriminator: true` 后必须用 `oneOf`（不能用 `anyOf`），且每个分支的 discriminator 字段必须是 `const` / `enum` 单值

### 代码结构示意

```
packages/cli/src/
├── manifest/
│   ├── schema/
│   │   ├── index.ts                  # TypeBox schema 定义（主入口）
│   │   ├── apiVersion.ts             # const Literal('harnessed/v1')
│   │   ├── metadata.ts               # metadata 子 schema
│   │   ├── spec.ts                   # spec 子 schema（含 type×method 矩阵）
│   │   ├── installMethods/           # 5 个 method 的差异化 schema
│   │   │   ├── ccPluginMarketplace.ts
│   │   │   ├── gitCloneWithSetup.ts
│   │   │   ├── npmCli.ts
│   │   │   ├── mcpStdioAdd.ts
│   │   │   └── mcpHttpAdd.ts
│   │   └── dist/
│   │       └── manifest-schema.v1.json   # 构建产物，npm publish 给社区
│   ├── validate.ts                   # validateManifest(rawYaml: string): Result
│   ├── types.ts                      # export type Manifest = Static<typeof ManifestSchema>
│   └── errors.ts                     # AjvError + yaml CST range → 友好错误
└── ...

scripts/
└── build-schema.ts                   # JSON.stringify(ManifestSchema) → manifest-schema.v1.json
```

### 关键代码模式

**条件矩阵（type × install.method）用 `oneOf` + discriminator**：

```ts
import { Type, type Static } from '@sinclair/typebox';

const InstallCcPlugin = Type.Object({
  method: Type.Literal('cc-plugin-marketplace'),
  cmd: Type.String(),
  git_ref: Type.String(),
  idempotent_check: Type.String(),
}, { additionalProperties: false });

const InstallNpmCli = Type.Object({
  method: Type.Literal('npm-cli'),
  cmd: Type.String(),
  npm_version: Type.String(),
  idempotent_check: Type.String(),
}, { additionalProperties: false });

const Install = Type.Union(
  [InstallCcPlugin, InstallNpmCli],
  { discriminator: { propertyName: 'method' } }
);

export const ManifestSchema = Type.Object({
  apiVersion: Type.Literal('harnessed/v1'),
  kind: Type.Literal('Manifest'),
  metadata: MetadataSchema,
  spec: Type.Object({
    type: Type.Union([
      Type.Literal('cc-plugin'),
      Type.Literal('cc-skill-pack'),
      Type.Literal('mcp-npm'),
      Type.Literal('cli-npm'),
    ]),
    install: Install,
  }, { additionalProperties: false }),
}, { additionalProperties: false });

export type Manifest = Static<typeof ManifestSchema>;
```

**校验入口（带 yaml 行号映射）**：

```ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { parseDocument } from 'yaml';
import { ManifestSchema } from './schema';

const ajv = addErrors(addFormats(new Ajv({
  strict: true,
  allErrors: true,
  discriminator: true,
})));
const validate = ajv.compile(ManifestSchema);

export function validateManifestFile(yamlSource: string, filename: string) {
  const doc = parseDocument(yamlSource);
  if (doc.errors.length) {
    return { ok: false, errors: doc.errors.map(toFriendly) };
  }
  const data = doc.toJS();
  if (!validate(data)) {
    return {
      ok: false,
      errors: validate.errors!.map(err => ({
        path: err.instancePath,
        message: err.message,
        line: locateLineFromCST(doc, err.instancePath),
        file: filename,
      })),
    };
  }
  return { ok: true, manifest: data as Manifest };
}
```

### CI 集成方式

1. **预提交钩子**：`pnpm exec harnessed validate manifests/**/*.yaml`
2. **GitHub Actions**：在 `pr.yml` 加 step `pnpm validate-manifests`，失败时输出可点击的 GitHub annotations（`::error file=...,line=...,col=...::message`）
3. **Schema publish**：
   - 构建时 `node scripts/build-schema.ts` 输出 `dist/manifest-schema.v1.json`
   - npm package 中 `files: ["dist/manifest-schema.v1.json"]`
   - 同时镜像到 `https://harnessed.dev/schemas/manifest.v1.json`
   - v0.2+ 提交 PR 到 [SchemaStore](https://github.com/SchemaStore/schemastore) 让 VS Code YAML 插件按 `manifest.yaml` 文件名自动启用
4. **schema 自身校验**：CI 跑 `npx ajv compile -s dist/manifest-schema.v1.json --strict=true`

### 验收标准（建议加入 phase 1.1 progress.md）

- [ ] `pnpm test:schema` 通过：9 个 v0.1 上游 manifest 全部 schema-valid
- [ ] negative test：故意写错的 manifest 必须报错并精确定位行号
- [ ] `dist/manifest-schema.v1.json` 可被 `ajv compile --strict=true` 接受
- [ ] benchmark：100 manifest 串行校验 < 100ms（实测应 < 20ms）
- [ ] VS Code YAML 插件能基于 schema 给 manifest.yaml 提供补全（手动验收）

---

## 信息来源

- [Ajv Strict Mode docs](https://ajv.js.org/strict-mode.html)
- [Ajv Options & Discriminator](https://ajv.js.org/options.html)
- [Ajv JSON Schema 2020-12 support](https://ajv.js.org/json-schema.html)
- [Ajv GitHub (ajv-validator/ajv)](https://github.com/ajv-validator/ajv)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Zod v4 Migration Guide](https://zod.dev/v4/changelog)
- [TypeBox npm @sinclair/typebox v0.34.49](https://www.npmjs.com/package/@sinclair/typebox)
- [TypeBox GitHub](https://github.com/sinclairzx81/typebox)
- [TypeBox vs Ajv (devpick 2026)](https://devpick.co/ajv-vs-sinclair-typebox)
- [Zod vs TypeBox 2026 (PkgPulse)](https://www.pkgpulse.com/blog/zod-vs-typebox-2026)
- [Valibot v1.1 Release Notes](https://valibot.dev/blog/valibot-v1.1-release-notes/)
- [Valibot vs Zod v4 (PkgPulse)](https://www.pkgpulse.com/guides/valibot-vs-zod-v4-typescript-validator-2026)
- [Schema Benchmarks 2026](https://schemabenchmarks.dev/blog/welcome)
- [yaml package npm (v2.8.4)](https://www.npmjs.com/package/yaml)
- [Kubeconform (灵感来源)](https://github.com/yannh/kubeconform)
