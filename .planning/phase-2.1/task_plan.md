# Phase 2.1 task_plan — 4 installer methods 实装

> **Authored**: 2026-05-15 (Wave B — main agent direct-write per anti-stall protocol)
> **23 atomic 子任务 / 6 wave**（Wave 0 = T1.1~T1.9；T1.9 user-directed post-Wave-C 加入）
> 每 task: 文件 / action(CONCRETE values)/ read_first / acceptance_criteria(grep/wc/test 可验)/ 决策来源

---

## Wave 0 — sister review 结清 + schema 前置 + ADR 0010（T1.1~T1.9）

### T1.1 — ADR 0010 draft

- **文件**: `docs/adr/0010-installer-schema-extension-errata.md`(new)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 创建 ADR 0010,≥100L,6-section(沿袭 ADR 0008/0009 errata 风格):
  - **§ Status**: `Accepted`(ship 时)/ draft 阶段 `Proposed`
  - **§ Context**: phase 2.1 installer 实装需 schema 扩展;phase 1.5 sister review H3/H4 deferred 需正式记录;ADR 0001-0009 main body 守恒 → 走 errata
  - **§ Decision**(6 子项):
    1. license whitelist 加 `MIT-0`(baoyu-skills,D-05)+ `anthropics-official` carve-out(frontend-design/document-skills/webapp-testing 来自 anthropics/skills 无 LICENSE,D-03/D-04)
    2. `license_source` audit 字段:optional enum `README | registry | none | anthropics-official`
    3. bundle-install:新 optional `provides: Type.Array({ id, component_type }, { minItems: 2, uniqueItems: true })` 顶层字段;`install`/`verify`/`uninstall` 保持 singular(D2.1-1/D2.1-2)
    4. install_type enforcement:`install_type` ↔ `install.method` 1:N 闭合 cross-field check
    5. **H3 errata**: agentDefinition.ts budget ≤150L → ≤200L 正式记录。**W2 fix — drafting 前先实测对齐 3 处数字**:`wc -l src/routing/agentDefinition.ts`(phase 1.5 ship 191L)+ 读 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 实际字段数;ADR 按实测写,统一:measured = 191L / new budget cap = ≤200L / delta = 148→191L 即 +43L(2 optional string 字段 `initialPrompt`+`criticalSystemReminder_EXPERIMENTAL` + `AGENT_DEFINITION_FIELDS` drift detector)
    6. **D-16**: `--header` `${ENV_VAR}` 处理 = installer 在 arg 构造前 resolve `process.env`(B1 checkCmdString gate 零改动)
  - **§ Consequences**: **H4** — `arbitrate` substring match(ADR 0009 § Decision 2 `task.prompt.toLowerCase().includes(trigger.toLowerCase())`)已知 false-positive 风险(trigger `"test"` 命中 `"latest"`/`"contest"`);v0.2+ semantic router L2 替代;transparency verify checklist 防 verdict 反模式复发
  - **§ Compliance**: `git diff adr-0001-accepted -- docs/adr/0001-*.md` = 0(A7 守恒);ADR 0001-0009 main body 不动
  - **§ Errata-path note**: ship 时 `adr-0010-accepted` baseline tag;ci.yml A7 step iter 1-9 → 1-10
- **read_first**: `docs/adr/0009-routing-l2-engineering-23-shi-errata.md`(errata 风格 reference + § Decision 2 = H4 substring match factual source)/ `docs/adr/0008-routing-engine-v1-errata.md`(errata 风格)/ `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`(S3 — H3 errata 的对象文档,v1.1 字段数 factual source)/ `.planning/phase-2.1/2.1-CONTEXT.md`(D-03/D-04/D-08/D-16)/ `.planning/phase-2.1/RESEARCH.md`(D2.1-1)
- **acceptance_criteria**:
  - `wc -l docs/adr/0010-installer-schema-extension-errata.md` ≥ 100
  - `grep -c "^## " docs/adr/0010-installer-schema-extension-errata.md` ≥ 6
  - `grep -c "MIT-0\|anthropics-official\|license_source\|provides\|H3\|H4\|--header" docs/adr/0010-installer-schema-extension-errata.md` ≥ 7
  - `grep -c "status: Proposed\|status: Accepted" docs/adr/0010-*.md` ≥ 1
- **决策来源**: E1 + D-04 + D-08 + D-09 + D-16 + H3 + H4

### T1.2 — license whitelist + license_source 字段

- **文件**: `src/manifest/schema/spec.ts`(或 license 枚举所在的 metadata 子 schema — D-18:启动前 grep 确认)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**:
  1. grep `src/manifest/schema/` 定位现有 license `Type.Union`(D-18)
  2. license 枚举加 2 个 `Type.Literal`:`Type.Literal('MIT-0')` + `Type.Literal('anthropics-official')`(沿袭 `InstallType` 4-literal union pattern,PATTERNS § 3.1)
  3. 加 optional `license_source` 字段到 metadata.upstream(或 license 同层),fenced 注释 `// ADR 0010 errata — license provenance audit field (D-04).`:
     ```typescript
     license_source: Type.Optional(Type.Union([
       Type.Literal('README'), Type.Literal('registry'),
       Type.Literal('none'), Type.Literal('anthropics-official'),
     ])),
     ```
- **read_first**: `src/manifest/schema/spec.ts`(`InstallType`/`Category` `Type.Union` pattern + ADR 0009 errata block lines 133-150)/ `docs/adr/0010-installer-schema-extension-errata.md`(T1.1 § Decision 1/2)
- **acceptance_criteria**:
  - `grep -rc "Type.Literal('MIT-0')" src/manifest/schema/` ≥ 1
  - `grep -rc "Type.Literal('anthropics-official')" src/manifest/schema/` ≥ 1
  - `grep -rc "license_source" src/manifest/schema/` ≥ 1
  - `corepack pnpm typecheck` 通过
- **决策来源**: E2 + D-03 + D-04 + D-05 + D-18 + PATTERNS § 3.1/3.2

### T1.3 — bundle-install `provides:` 字段

- **文件**: `src/manifest/schema/spec.ts`
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 加 bundle-install schema,fenced 注释 `// ADR 0010 errata — bundle-install modeling (#10, D2.1-1).`:
  ```typescript
  const ProvidedUnit = Type.Object(
    {
      id: Type.String({ minLength: 1 }),       // routing-addressable, <org>-<repo>-<unit>
      component_type: ComponentType,            // reuse existing union
    },
    { additionalProperties: false },
  )
  // 加入 SpecSchema:
  provides: Type.Optional(Type.Array(ProvidedUnit, { minItems: 2, uniqueItems: true })),
  ```
  `install`/`verify`/`uninstall` **保持 singular 不动**。bundle manifest 用现有 `type: 'cc-skill-pack'`(D2.1-2 — 无新 TypeEnum/ComponentType 值)。
- **read_first**: `src/manifest/schema/spec.ts`(`Triggers` optional-object pattern lines 143-150 + `ComponentType` union)/ `.planning/phase-2.1/RESEARCH.md` § 1(D2.1-1 concrete sketch)
- **acceptance_criteria**:
  - `grep -c "ProvidedUnit" src/manifest/schema/spec.ts` ≥ 1
  - `grep -c "provides: Type.Optional" src/manifest/schema/spec.ts` ≥ 1
  - `grep -c "minItems: 2" src/manifest/schema/spec.ts` ≥ 1
  - `corepack pnpm typecheck` 通过
- **决策来源**: E2 + D2.1-1 + D2.1-2 + PATTERNS § 3.3

### T1.4 — install_type enforcement

- **文件**: `src/manifest/validate.ts`(或 validate 层 — 启动前确认现有 `install_type` check 位置,参考 `tests/unit/manifest-validate.install-type.test.ts`)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 加 cross-field 校验 — `install_type`(ngm/npx/git/local 4 enum)↔ `install.method`(6 method)1:N 闭合(ADR 0007)。映射:
  - `ngm` → `npm-cli`
  - `npx` → `npx-skill-installer`
  - `git` → `git-clone-with-setup`
  - `local` → (无 — 保留)
  - `mcp-stdio-add` / `mcp-http-add` / `cc-plugin-marketplace` → install_type 不约束(MCP/plugin 类)
  不匹配 → validate 抛 error `keyword: 'install-type-mismatch'`。PATTERNS § 3.4:TypeBox `Type` 不支持 cross-field,这是 validate 层 refinement rule。
- **read_first**: `src/manifest/validate.ts` / `tests/unit/manifest-validate.install-type.test.ts`(现有 check 的 test)/ `docs/adr/0007-categorization-schema-extension.md`(install_type 1:N 闭合)
- **acceptance_criteria**:
  - `grep -c "install-type-mismatch\|installTypeMethod" src/manifest/validate.ts` ≥ 1
  - `corepack pnpm typecheck` 通过
- **决策来源**: E2 + PATTERNS § 3.4 + ADR 0007

### T1.5 — decision_rules.yaml `warn:` 移除

- **文件**: `routing/decision_rules.yaml`
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 删除 `chinese-content-deck` rule 的 `warn:` key(baoyu-skills resolve 为 MIT-0,D-05 — 不再需 license warn)。1-line 删除。其余 rule 不动。
- **read_first**: `routing/decision_rules.yaml`(`chinese-content-deck` rule)
- **acceptance_criteria**:
  - `chinese-content-deck` rule block 内无 `warn:` key
  - `corepack pnpm test -- tests/unit/routing-decisionRules` 全绿(yaml parse OK)
- **决策来源**: E2 + D-05

### T1.6 — schema unit tests

- **文件**: `tests/unit/manifest-validate.license.test.ts`(new)+ `tests/unit/manifest-validate.bundle.test.ts`(new)+ `tests/unit/manifest-validate.install-type.test.ts`(extend)
- **wave**: 0 | **depends_on**: T1.2, T1.3, T1.4 | **autonomous**: yes
- **action**:
  - license test(≥5 cell):MIT-0 accept / anthropics-official accept / 非白名单 license reject / license_source 4 enum accept / license_source 非法值 reject
  - bundle test(≥5 cell):`provides` 2-unit accept / 1-unit reject(minItems:2)/ 重复 id reject(uniqueItems)/ `provides` 缺省 accept(atomic manifest)/ ProvidedUnit `additionalProperties:false` reject 多余字段
  - install-type extend(≥3 cell):ngm↔npm-cli accept / npx↔git-clone-with-setup reject(install-type-mismatch)/ mcp-http-add 不约束 accept
- **read_first**: `tests/unit/manifest-validate.install-type.test.ts`(现有 pattern)/ `tests/unit/manifest-validate.category.test.ts`(Pattern J negative test 风格)/ `src/manifest/schema/spec.ts`(T1.2/T1.3 改后)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/unit/manifest-validate` 全绿
  - license test ≥5 cell,bundle test ≥5 cell,install-type extend ≥3 新 cell
- **决策来源**: E2 + Pattern J

### T1.7 — transparency verify checklist + CI gate

- **文件**: `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`(new)+ `scripts/check-transparency-verdicts.mjs`(new)+ `.github/workflows/ci.yml`(extend)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**:
  1. `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`(≥40L)— 定义结构化 verdict-marker 约定:
     - 任何 closure verdict 必须写成 marker 行:`Verdict: <CLOSED|PASS|...> (N/N <unit>, miss: <list|none>)` 或 `状态: <全绿|...> — N/N, miss: <list|none>`
     - marker token 行首:`Verdict:` / `状态:` / `Closure:`
     - 人工判断部分(miss list 是否完整、count 是否正确)checklist 说明
     - 背景:phase 1.4 T1("100% hit" 实际 70%)+ phase 1.5 H1/M1 连续 2 phase transparency 反模式复发,结构性根治
  2. `scripts/check-transparency-verdicts.mjs`(~15-25L pure ESM)— scan 限定 glob `.planning/**/PLAN-CHECK.md` + `.planning/**/*-AUDIT.md` + `.planning/**/VERIFICATION.md`,匹配行首 `Verdict:`/`状态:`/`Closure:` 的 marker 行(**S5 — regex 须容忍 0-2 个 markdown bold `*` 包裹**,如 `**Verdict:**` 与 `Verdict:` 均匹配),若该行无 `\d+/\d+` ratio AND 无 `miss:` 声明 → 打印违规行。自由 prose 不匹配(D2.1-8 false-positive mitigation)
     - **W3 — 锁定 warn-only round 1**:gate **首轮 warn-only**(打印违规行 + `process.exit(0)`)—— 历史 verdict 文档(phase 1.x PLAN-CHECK / v0.1.0-MILESTONE-AUDIT / 各 phase VERIFICATION)写于 gate 之前,多用自由 prose 结论,首轮 enforce 会 red CI 在历史文档上。round 1 warn-only,**flip 到 enforce(exit 1)推 phase 2.2**(phase 2.2 起所有新 verdict 文档已遵守 marker 约定)。脚本顶部 const `ENFORCE = false` + 注释 "// W3: warn-only round 1; flip to true in phase 2.2"
  3. `.github/workflows/ci.yml` 加 step `node scripts/check-transparency-verdicts.mjs`(在 A7 step 附近)
  4. `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` 明示 marker 允许 markdown bold 包裹(`**Verdict:**` 合法)
- **read_first**: `.planning/phase-1.5/PLAN-CHECK.md` § 8(verdict 文档结构 reference)/ `.planning/v0.1.0-MILESTONE-AUDIT.md`(AUDIT 文档结构)/ `.github/workflows/ci.yml`(A7 step pattern)/ `.planning/phase-2.1/RESEARCH.md` § 3(D2.1-7/8)
- **acceptance_criteria**:
  - `wc -l docs/TRANSPARENCY-VERDICT-CHECKLIST.md` ≥ 40
  - `test -f scripts/check-transparency-verdicts.mjs && node scripts/check-transparency-verdicts.mjs; echo "exit=$?"` → **exit=0**(W3 warn-only round 1 — 即使历史文档违规也 exit 0 + 打印 warning)
  - `grep -c "ENFORCE = false" scripts/check-transparency-verdicts.mjs` ≥ 1(W3 lock)
  - `grep -c "check-transparency-verdicts" .github/workflows/ci.yml` ≥ 1
- **决策来源**: E3 + D2.1-7 + D2.1-8

### T1.8 — M1 SAMPLES § 8.4 miss 身份标注

- **文件**: `.planning/phase-1.4/SAMPLES.md`(extend § 8.4)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 跑 `corepack pnpm test -- tests/integration/routing-30-samples` 拿 specific match 结果,定位 28/30 中的 2 个 miss sample 身份,在 SAMPLES.md § 8.4 标注:miss sample id + category + 为何 acceptable(预期 fallthrough / v0.2+ 升级路径)。补全 phase 1.5 M1 transparency gap。
- **read_first**: `.planning/phase-1.4/SAMPLES.md`(§ 8 现有结构)/ `tests/integration/routing-30-samples.test.ts`(30 sample + specific match assert)
- **acceptance_criteria**:
  - `.planning/phase-1.4/SAMPLES.md` § 8.4 含 2 个具名 miss sample(id + category + rationale)
  - `grep -c "miss" .planning/phase-1.4/SAMPLES.md` ≥ 2
- **决策来源**: E3 + M1

### T1.9 — CONTRIBUTING.md SSOT 引用纪律 section（user-directed,post-Wave-C 加入）

- **文件**: `CONTRIBUTING.md`(extend — 加新 section)
- **wave**: 0 | **depends_on**: — | **autonomous**: yes
- **action**: 把 `.planning/intel/omc-comparison.md` § 0 的 "SSOT 引用纪律" 从 intel-local 提升为**项目级文档纪律**,在 `CONTRIBUTING.md` 加一节 `## intel / 参考文档的 SSOT 引用规则`(~15-25L):
  - **核心理念**:intel / 参考文档是**外部参考,不是 SSOT** —— 引用 SSOT 资源(phase / ADR 编号)必须防 stale
  - **phase 编号** → 用**语义锚定**("Phase 2.2 = execute-task workflow"),不只靠数字(phase 可被 insert — phase 1.2.5 即先例)
  - **ADR 编号** → **绝不预占**(ADR 编号是"先 plan-phase 先占"的动态资源);需新 ADR 时写"需起 errata ADR(编号由对应 phase plan-phase 流程分配)",不写死 ADR NNNN
  - **校验时机** → 任何 phase discuss-phase 取用参考文档时,先比对当前 `ROADMAP.md` / `docs/adr/` 实际编号,发现 drift 即就地修正
  - **反面教材**:引 `.planning/intel/omc-comparison.md` 2026-05-14 初版写死 "phase 2.0" + "ADR 0010" → v0.2.0 激活后即 stale 的真实案例
  - 适用范围:`.planning/intel/**` + 任何引用 phase/ADR 编号的参考文档
- **read_first**: `CONTRIBUTING.md`(现有结构 — phase 1.1 ship 139L)/ `.planning/intel/omc-comparison.md` § 0(2026-05-15 重写版 — 提升的源)
- **acceptance_criteria**:
  - `grep -c "SSOT 引用" CONTRIBUTING.md` ≥ 1
  - `grep -c "绝不预占\|语义锚定" CONTRIBUTING.md` ≥ 2
  - `wc -l CONTRIBUTING.md` 比 ship 前 +15 以上
- **决策来源**: user-directed(2026-05-15 — intel omc-comparison.md 重写后 follow-through;与 T1.7 transparency verify checklist 同属"文档诚实纪律"结构性修复,折叠进 Wave 0)

---

## Wave 1 — mcp-http-add（T2.1~T2.2）

### T2.1 — mcpHttpAdd.ts installer

- **文件**: `src/installers/mcpHttpAdd.ts`(new)
- **wave**: 1 | **depends_on**: T1.1(ADR 0010 D-16 approach)| **autonomous**: yes
- **action**: clone `src/installers/mcpStdioAdd.ts`(~85%,PATTERNS § 2 mcpHttpAdd):
  - import 同 mcpStdioAdd 的 lib helper 集(checkCmdString / backup / confirm / diff / preflight / state / types);**不用 lib/spawn.ts** — 直接 `spawn` + 本地 `runArgs`/`err`/`ProcResult`(verbatim copy)
  - 7-step 骨架 copy:method-discriminator guard(`install.method !== 'mcp-http-add'` → `dispatch-mismatch` error)→ `preflight` → **adapt `addArgs`** → B1 per-arg re-screen → `.mcp.json` diff → `confirmAt('L3')` + dry-run short-circuit → backup → `runArgs` → exit-code check → verify → `updateInstalled`
  - **adapt `addArgs`**(authoritative,D-12 hardcode `--scope project`):
    ```typescript
    // --header env-resolution BEFORE arg construction (D-16): resolve ${ENV_VAR} from process.env, fail clear if unset
    const headerArgs = resolveHeaders(install.headers)  // flatten → ['--header','Key: Value', ...] BEFORE <name>
    const addArgs = ['mcp','add','--scope','project','--transport','http', ...headerArgs, name, url]
    ```
  - `resolveHeaders` helper(inline,≤10L):读 `process.env`,`${VAR}` 未设 → throw `InstallError keyword:'env-unset'`;resolve 后值无 `${...}` → B1 re-screen 不会 false-positive
  - `.mcp.json` 入口 shape:`{[name]:{type:'http',url,headers}}`(非 stdio 的 `{command,args}`)
  - verify:`claude mcp list | grep -q ${name}`;OAuth server 加 `claude mcp get <name>` pending-auth surface
- **read_first**: `src/installers/mcpStdioAdd.ts`(完整 — 85% clone 源)/ `src/installers/lib/types.ts`(`Installer`/`InstallError` 类型)/ `.planning/phase-2.1/PATTERNS.md` § 2 mcpHttpAdd / `docs/adr/0010-*.md`(D-16 approach)
- **acceptance_criteria**:
  - `test -f src/installers/mcpHttpAdd.ts`
  - `grep -c "mcp-http-add" src/installers/mcpHttpAdd.ts` ≥ 1(discriminator guard)
  - `grep -c "'--scope','project'\|--scope.*project" src/installers/mcpHttpAdd.ts` ≥ 1(D-12)
  - `grep -c "transport.*http\|'http'" src/installers/mcpHttpAdd.ts` ≥ 1
  - `grep -c "resolveHeaders\|process.env" src/installers/mcpHttpAdd.ts` ≥ 1(D-16)
  - `corepack pnpm typecheck` 通过
- **决策来源**: E4 + D-12 + D-16 + PATTERNS § 2

### T2.2 — mcpHttpAdd unit test

- **文件**: `tests/unit/installers-mcpHttpAdd.test.ts`(new)
- **wave**: 1 | **depends_on**: T2.1 | **autonomous**: yes
- **action**: clone `tests/unit/installers-mcpStdioAdd.test.ts` 结构(`vi.mock` contract test);adapt:`addArgs` 含 `--transport http` + `<url>` assert / `--scope project` hardcode assert / `--header` env-resolution(env set → resolved value;env unset → `env-unset` error)/ dry-run short-circuit / dispatch-mismatch / verify `claude mcp list` exit-code。≥6 cell。
- **read_first**: `tests/unit/installers-mcpStdioAdd.test.ts`(clone 源)/ `src/installers/mcpHttpAdd.ts`(T2.1)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/unit/installers-mcpHttpAdd` 全绿
  - ≥6 cell
- **决策来源**: E4 + Pattern K

---

## Wave 2 — git-clone-with-setup（T3.1~T3.2）

### T3.1 — gitCloneWithSetup.ts installer

- **文件**: `src/installers/gitCloneWithSetup.ts`(new)
- **wave**: 2 | **depends_on**: T2.1(lib helper 复用验证)| **autonomous**: yes
- **action**: npmCli orchestrator 形 + mcpStdioAdd verify(~55%,PATTERNS § 2 gitCloneWithSetup):
  - import npmCli 的 lib helper 集(含 `lib/spawn.ts` 的 `spawnCmd` — 跑 manifest `cmd` 字符串)
  - 骨架(npmCli.ts thin-orchestrator):discriminator guard(`install.method !== 'git-clone-with-setup'`)→ `preflight`(已强制 `git_ref` HEAD/main/master 拒绝 — 复用不重建)→ `renderDiff`(pure-create:`oldText:''`,`+++ NEW: ~/.claude/skills/<name>/`)→ `confirmAt('L2')`(若涉 PATH 改 L4)→ dry-run short-circuit → `backup`(pure-create sentinel)→ `spawnCmd(ctx, install.cmd, [])` → **NEW SHA-verify step**(D-15)→ verify `spawnCmd(ctx, verify.cmd, [])` → `updateInstalled`
  - **NEW SHA-verify(D-15 — inline ≤10L,不建 lib/gitVerify.ts)**:spawn 后 `git rev-parse HEAD` in cloned dir,match `install.git_ref`(full SHA);不匹配 → `InstallError keyword:'sha-mismatch'`
  - backup pure-create:rollback = `rm -rf` created dir
- **read_first**: `src/installers/npmCli.ts`(完整 — orchestrator 形)/ `src/installers/mcpStdioAdd.ts`(preflight/verify pattern)/ `src/installers/lib/{spawn,backup,types}.ts` / `manifests/skill-packs/ui-ux-pro-max.yaml`(真实 git-clone manifest 范例)/ `.planning/phase-2.1/PATTERNS.md` § 2 gitCloneWithSetup
- **acceptance_criteria**:
  - `test -f src/installers/gitCloneWithSetup.ts`
  - `grep -c "git-clone-with-setup" src/installers/gitCloneWithSetup.ts` ≥ 1
  - `grep -c "rev-parse\|sha-mismatch" src/installers/gitCloneWithSetup.ts` ≥ 1(D-15)
  - `grep -c "spawnCmd" src/installers/gitCloneWithSetup.ts` ≥ 1
  - `corepack pnpm typecheck` 通过
- **决策来源**: E5 + D-13 + D-15 + PATTERNS § 2

### T3.2 — gitCloneWithSetup unit test

- **文件**: `tests/unit/installers-gitCloneWithSetup.test.ts`(new)
- **wave**: 2 | **depends_on**: T3.1 | **autonomous**: yes
- **action**: clone `tests/unit/installers-npmCli.test.ts` 结构;adapt:`spawnCmd` install.cmd assert / SHA-verify(rev-parse match → ok;mismatch → `sha-mismatch` error)/ pure-create backup(`oldText:''`)/ dry-run / dispatch-mismatch / preflight git_ref HEAD 拒绝。≥6 cell。
- **read_first**: `tests/unit/installers-npmCli.test.ts`(clone 源)/ `src/installers/gitCloneWithSetup.ts`(T3.1)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/unit/installers-gitCloneWithSetup` 全绿
  - ≥6 cell
- **决策来源**: E5 + Pattern K

---

## Wave 3 — cc-plugin-marketplace（T4.1~T4.2）

### T4.1 — ccPluginMarketplace.ts installer

- **文件**: `src/installers/ccPluginMarketplace.ts`(new)
- **wave**: 3 | **depends_on**: T3.1(lib helper 复用验证)| **autonomous**: yes
- **action**: clone mcpStdioAdd direct-spawn 模式(~65%,PATTERNS § 2 ccPluginMarketplace):
  - import 同 mcpHttpAdd 集(direct-spawn,authoritative args,无 lib/spawn.ts)
  - 骨架 clone mcpStdioAdd 但 **two sequential `runArgs`**:
    ```typescript
    // Step 1 — register marketplace (idempotent per D-20)
    const mktArgs = ['plugin','marketplace','add', marketplaceUrl]
    // Step 2 — install plugin, --scope project hardcoded
    const installArgs = ['plugin','install',`${plugin}@${marketplaceName}`,'--scope','project']
    ```
  - **D-20 idempotency**:step-1 `marketplace add` 非零退出**视为非致命 IF** step-2 `plugin install` 成功(marketplace 已注册是 benign);可选 `claude plugin marketplace list` pre-check
  - diff target:`.claude/settings.json` `enabledPlugins` key
  - B1 per-arg re-screen loop verbatim copy
  - verify:`claude plugin list --json` **exit code**(非 stdout parse — C6 discipline)
  - `confirmAt('L3')`
- **read_first**: `src/installers/mcpStdioAdd.ts`(direct-spawn 模式源)/ `src/installers/lib/types.ts` / `.planning/phase-2.1/PATTERNS.md` § 2 ccPluginMarketplace / `.planning/research/v0.2.0-installers.md` § cc-plugin-marketplace
- **acceptance_criteria**:
  - `test -f src/installers/ccPluginMarketplace.ts`
  - `grep -c "cc-plugin-marketplace" src/installers/ccPluginMarketplace.ts` ≥ 1
  - `grep -c "marketplace.*add\|plugin.*install" src/installers/ccPluginMarketplace.ts` ≥ 2(two-step)
  - `grep -c "'--scope','project'\|--scope.*project" src/installers/ccPluginMarketplace.ts` ≥ 1
  - `corepack pnpm typecheck` 通过
- **决策来源**: E6 + D-11 + D-20 + PATTERNS § 2

### T4.2 — ccPluginMarketplace unit test

- **文件**: `tests/unit/installers-ccPluginMarketplace.test.ts`(new)
- **wave**: 3 | **depends_on**: T4.1 | **autonomous**: yes
- **action**: clone mcpStdioAdd test 结构;adapt:two-step spawn assert(mktArgs + installArgs)/ D-20 idempotency(step-1 非零 + step-2 成功 → ok)/ `--scope project` hardcode / verify `claude plugin list --json` exit-code / dry-run / dispatch-mismatch。≥6 cell。
- **read_first**: `tests/unit/installers-mcpStdioAdd.test.ts`(clone 源)/ `src/installers/ccPluginMarketplace.ts`(T4.1)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/unit/installers-ccPluginMarketplace` 全绿
  - ≥6 cell
- **决策来源**: E6 + Pattern K

---

## Wave 4 — npx-skill-installer（T5.1~T5.2）

### T5.1 — npxSkillInstaller.ts installer

- **文件**: `src/installers/npxSkillInstaller.ts`(new)
- **wave**: 4 | **depends_on**: T4.1(lib helper 复用验证)| **autonomous**: yes
- **action**: npmCli npx 模式(~50%,PATTERNS § 2 npxSkillInstaller):
  - import npmCli 集(用 `lib/spawn.ts`)
  - 骨架 npmCli orchestrator:discriminator guard(`install.method !== 'npx-skill-installer'`)→ preflight → renderDiff(pure-create)→ `confirmAt('L2')` → dry-run → backup → `spawnCmd(ctx, cmd, [])` → **real-path verify** → updateInstalled
  - **cmd(D2.1-4/D2.1-5 — pin `skills@1.5.7`)**:
    ```
    npx --yes skills@1.5.7 add <owner/repo> --skill <name> --agent claude-code --copy --global --yes
    ```
    (T5.1 启动前若距 research >2 周,`npm view skills version` 复核 pin latest-stable — D2.1-4 / R6)
  - **CRITICAL real-path verify(D2.1-6,C6)**:`test -f ~/.claude/skills/<name>/SKILL.md` — **真实路径**,非 npx exit code。npx 成功但 verify fail → `InstallError keyword:'verify-failed'` + `suggest:` 指向 `~/.agents/` vs `~/.claude/` bridge limitation
  - 目录冲突记 progress.md finding(D-02 — 完整桥接 deferred)
- **read_first**: `src/installers/npmCli.ts`(npx 模式源)/ `src/installers/lib/{spawn,types}.ts` / `.planning/phase-2.1/PATTERNS.md` § 2 npxSkillInstaller / `.planning/phase-2.1/RESEARCH.md` § 2(D2.1-4/5/6 exact cmd + flags)
- **acceptance_criteria**:
  - `test -f src/installers/npxSkillInstaller.ts`
  - `grep -c "npx-skill-installer" src/installers/npxSkillInstaller.ts` ≥ 1
  - `grep -c "skills@1.5.7\|--copy\|--global" src/installers/npxSkillInstaller.ts` ≥ 2(D2.1-5 flags)
  - `grep -c "SKILL.md\|verify-failed" src/installers/npxSkillInstaller.ts` ≥ 1(D2.1-6 real-path verify)
  - `corepack pnpm typecheck` 通过
- **决策来源**: E7 + D-01 + D-02 + D2.1-4 + D2.1-5 + D2.1-6 + PATTERNS § 2

### T5.2 — npxSkillInstaller unit test

- **文件**: `tests/unit/installers-npxSkillInstaller.test.ts`(new)
- **wave**: 4 | **depends_on**: T5.1 | **autonomous**: yes
- **action**: clone npmCli test 结构;adapt:`skills@1.5.7` + `--copy --global` cmd assert / real-path verify(`test -f` mock — exists → ok;npx exit 0 但文件缺 → `verify-failed`)/ dry-run / dispatch-mismatch。≥6 cell。
- **read_first**: `tests/unit/installers-npmCli.test.ts`(clone 源)/ `src/installers/npxSkillInstaller.ts`(T5.1)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/unit/installers-npxSkillInstaller` 全绿
  - ≥6 cell
- **决策来源**: E7 + Pattern K

---

## Wave 5 — tests + ship（T6.1~T6.6）

### T6.1 — dispatch table 6 method 全覆盖

- **文件**: `src/installers/index.ts`(modify)
- **wave**: 5 | **depends_on**: T2.1, T3.1, T4.1, T5.1 | **autonomous**: yes
- **action**(PATTERNS § 4 — 4-line swap + 4 imports + 1 deletion):
  - 加 4 import:`import { installMcpHttpAdd } from './mcpHttpAdd.js'`(等)
  - `installers` Record 4 个 `phase21Placeholder` → 真实 installer:`'mcp-http-add': installMcpHttpAdd` 等
  - 删 `phase21Placeholder` const + 注释
  - `levelOf()`(L3/L2/L2/L3)**零改动**;`runInstall` **零改动**
- **read_first**: `src/installers/index.ts`(当前 placeholder 结构)/ 4 个新 installer 的 export name
- **acceptance_criteria**:
  - `grep -c "phase21Placeholder" src/installers/index.ts` = 0
  - `grep -c "installMcpHttpAdd\|installGitCloneWithSetup\|installCcPluginMarketplace\|installNpxSkillInstaller" src/installers/index.ts` ≥ 8(4 import + 4 dispatch)
  - `corepack pnpm typecheck` 通过
- **决策来源**: E8 + PATTERNS § 4

### T6.2 — installer-contract.test.ts 扩展

- **文件**: `tests/integration/installer-contract.test.ts`(extend)
- **wave**: 5 | **depends_on**: T6.1 | **autonomous**: yes
- **action**: 4 新 installer 加入 ADR 0004 6 契约 contract test(dry-run default + diff + rollback + 4-Level confirm + MCP CLI-only + no-silent-failure)。沿袭现有 `vi.mock` contract test 结构 + dispatch-mismatch test。real-spawn 走 `skipIf(!process.env.HARNESSED_REAL_SPAWN)` gate。
- **read_first**: `tests/integration/installer-contract.test.ts`(现有 12 contract test 结构)/ `docs/INSTALLER-CONTRACT.md`(6 契约)
- **acceptance_criteria**:
  - `corepack pnpm test -- tests/integration/installer-contract` 全绿
  - 4 新 installer 各有 contract test cell
- **决策来源**: E8 + ADR 0004 6 契约

### T6.3 — ci.yml A7 step iter 1-9 → 1-10

- **文件**: `.github/workflows/ci.yml`(modify)
- **wave**: 5 | **depends_on**: T1.1 | **autonomous**: yes
- **action**: A7 step 两处 `for n in 0001 ... 0009` loop 加 `0010`;step 注释 + name 更新 `ADR 0001-0009` → `ADR 0001-0010`;加 phase 2.1 ADR 0010 errata 说明注释(沿袭 phase 1.5 T1.2 模式)
- **read_first**: `.github/workflows/ci.yml`(A7 step — phase 1.5 iter 1-9 改后)
- **acceptance_criteria**:
  - `grep -c "0001 0002 0003 0004 0005 0006 0007 0008 0009 0010" .github/workflows/ci.yml` ≥ 2(两处 loop)
  - `grep -c "ADR 0001-0010" .github/workflows/ci.yml` ≥ 1
- **决策来源**: E8 + D-09 + A7 守恒

### T6.4 — CI 三平台全绿 verify + push

- **文件**: —(git push + gh run watch)
- **wave**: 5 | **depends_on**: T6.1, T6.2, T6.3 | **autonomous**: no(main agent decide push timing)
- **action**: push origin → `gh run watch` CI run → 确认 windows/macos/ubuntu 三平台全 success。A7 step(此时 adr-0010-accepted tag 未推 → warn skip,与 phase 1.3/1.4/1.5 chicken-and-egg 模式一致)。typecheck + lint + test + build + schema + installer integration step 全绿。
- **read_first**: —
- **acceptance_criteria**:
  - `gh run view <id> --json conclusion,jobs` → conclusion `success`,3 job 全 success
- **决策来源**: E8

### T6.5 — STATE.md + progress.md 更新 + adr-0010-accepted tag

- **文件**: `.planning/STATE.md`(modify)+ `.planning/phase-2.1/progress.md`(new/finalize)+ git tag
- **wave**: 5 | **depends_on**: T6.4 | **autonomous**: no(main agent decide tag push)
- **action**:
  - STATE.md:phase 2.1 SHIPPED 行 + 进度 6/17 → 7/17(≈41.2%)+ ADR 累积 9→10 + baseline tag 9→10 + tests count 更新
  - progress.md:6 wave 执行进度 + findings tracker(含 npx 目录冲突 known limitation D-02)
  - `git tag adr-0010-accepted <ship commit>`(ADR 0010 main body stable since draft 时验证 0 diff)
  - main agent decide:`v0.2.0-alpha.1-installers` milestone tag
- **read_first**: `.planning/STATE.md`(phase 1.5 SHIPPED 行模式)/ `.planning/phase-1.5/progress.md`(progress 结构)
- **acceptance_criteria**:
  - `grep -c "phase 2.1.*SHIPPED\|Phase 2.1.*SHIPPED" .planning/STATE.md` ≥ 1
  - `git tag -l adr-0010-accepted` 命中
  - `git diff adr-0010-accepted -- docs/adr/0010-*.md | wc -l` = 0
- **决策来源**: E8 + D-09

### T6.6 — VERIFICATION.md

- **文件**: `.planning/phase-2.1/VERIFICATION.md`(new,≥120L)
- **wave**: 5 | **depends_on**: T6.5 | **autonomous**: yes
- **action**: E1-E8 复现命令(PLAN § 6)+ 7 接口契约(PLAN § 4)phase 2.2/2.3 prereq + findings 索引 + batch commit 索引。沿袭 phase 1.5 VERIFICATION.md 结构。
- **read_first**: `.planning/phase-1.5/VERIFICATION.md`(结构 reference)/ `.planning/phase-2.1/PLAN.md`(§ 4 + § 6)
- **acceptance_criteria**:
  - `wc -l .planning/phase-2.1/VERIFICATION.md` ≥ 120
  - E1-E8 复现命令全含 + 7 接口契约 phase 2.2/2.3 prereq
- **决策来源**: E1-E8 + PLAN § 4

---

## Ship line

phase 2.1 ship 后:
- **23 atomic 子任务** 全完成(Wave 0-5；T1.9 user-directed post-Wave-C 加入)
- **6 install method 全 runtime-ready** — `phase21Placeholder` 删除
- **E1-E8 8/8 acceptance bar**
- ADR 累积 9 → **10**;baseline tag 9 → **10**(adr-0010-accepted)
- ci.yml A7 step iter 1-9 → **1-10**
- tests:phase 1.5 ship 318+3 → 预期 +~30 cell(8 schema + 24 installer unit/contract)→ ~348+3
- 新文件:`docs/adr/0010-*.md` + `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` + `src/installers/{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.ts` + 4 unit test + 3 schema test;**修改**:`src/manifest/schema/spec.ts` + `src/manifest/validate.ts` + `src/installers/index.ts` + `routing/decision_rules.yaml` + `.github/workflows/ci.yml` + `tests/integration/installer-contract.test.ts` + `.planning/phase-1.4/SAMPLES.md`
- A7 守恒:ADR 0001-0009 main body 0 diff
