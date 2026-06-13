# harnessed

[English](./README.md) | [简体中文](./README-cn.md) | [繁體中文](./README-tw.md) | [日本語](./README-ja.md) | [한국어](./README-ko.md) | **Português (Brasil)** | [Türkçe](./README-tr.md) | [Русский](./README-ru.md) | [Tiếng Việt](./README-vi.md) | [ไทย](./README-th.md)

> **Note (best-effort translation):** This translation is generated/best-effort and may lag behind the English [README.md](./README.md). For the latest and authoritative content, refer to the English version.

> Gerenciador de pacotes para harness de codificação com AI + orquestrador de Composition
> Executa mecanicamente a metodologia de colaboração em três camadas (governança gstack + gerente de projetos GSD + engenheiro sênior superpowers + princípios karpathy + movimentos mattpocock) como um motor executável

[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)

> Não é afiliado, endossado nem patrocinado pela Harness Inc. (veja [NOTICE](./NOTICE))

---

## ✨ TL;DR

**Orquestração de melhores práticas para Harness Engineering no Claude Code** — reúne os melhores componentes open-source do ecossistema Claude Code, integrando-os em um Workflow unificado por meio de Skills de Composition opinativas; não faz Vendor do código upstream — os Manifests descrevem install/check, e as Skills de Composition orquestram a colaboração entre múltiplos upstreams.

---

> Espera — o harnessed realmente consegue competir de igual para igual com os gigantes upstream como superpowers / gstack / GSD?
> Claro — nós **estamos nos ombros de gigantes**. Ver mais longe, disse Newton. 🧐
> ... *(sussurrando)* Mas, olhando de perto, parece mais o papagaio empoleirado nesse ombro.
> Bom — papagaios imitam; nós **orquestramos**. 🦜

---

## 🎯 Key Differentiators

- **Stack de três camadas executada mecanicamente** — `gstack governance` + `GSD project manager` + `superpowers senior engineer` + `karpathy 4 principles` + `mattpocock 23 moves`, 5 pilares com 100% de cobertura
- **Sem Vendor do upstream** — Manifests descrevem install/check; quando o upstream é atualizado, os usuários simplesmente reinstalam para obter a versão mais recente
- **Composition Skill** — Skills de Workflow internas funcionam como a batuta do maestro, orquestrando múltiplos upstreams em conjunto. **1 super-master `/auto` + 4 masters de stage + 18 sub-workflows + 2 standalone = 25 Workflows em namespace hierárquico**, execução mecânica completa de 4 stages (`/auto` one-shot entre stages / `/discuss /plan /task /verify` por stage individual / 18 subs da three-layer-stack / `/research /retro` 2 standalones)
- **L0 Discipline Substrate** — linha de base de comportamento global entre stages (princípios karpathy + estilo de output + linguagem + operacional + prioridade + protocolos), aplicada universalmente
- **Mentalidade de gerenciador de pacotes** — grafo de dependências de instalação com resolução automática, health check com doctor, instalação base completa em um comando
- **Ponto de entrada unificado** — os usuários interagem com os master slash commands `/discuss /plan /task /verify` sem precisar aprender a terminologia de cada upstream; sub-commands invocam explicitamente um único stage (por exemplo, `/discuss-strategic` executa apenas a clarificação da camada estratégica)

---

## 📦 Quick Install

```bash
npm install -g harnessed && harnessed setup
```

> O Windows PowerShell 5.x não suporta encadeamento com `&&` — use `;` ou duas linhas (`npm install -g harnessed; harnessed setup`). bash / zsh / PowerShell 7+ / cmd.exe funcionam normalmente.

**Para desinstalar:**
```bash
harnessed uninstall    # Remove os arquivos próprios do harnessed (componentes upstream NÃO são afetados)
```

> `harnessed uninstall` limpa commands, workflow skills, variáveis de ambiente de settings e o diretório de estado. Componentes upstream (pacotes npm, servidores MCP, plugins CC, repositórios git-clonados, npx skills) permanecem intactos. Execute `harnessed uninstall <name>` para remover um upstream individual. Adicione `--dry-run` para pré-visualizar.

🤖 **Ou peça para uma IA instalar por você** — cole esta frase no Claude Code (ou em qualquer assistente de IA):

> Install harnessed for me following the guide at `https://github.com/easyinplay/harnessed/blob/main/INSTALL-WITH-AI.md`

A IA vai buscar automaticamente o documento + executar a instalação, lidando com casos de borda de OS / permissões / PATH / corepack — sem necessidade de copiar grandes blocos de texto.

> [!TIP]
> 🚀 **Os adorados recursos Agent Teams e Subagents são habilitados automaticamente no harnessed com base na tarefa!**
> Não é necessário configurar manualmente `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — `harnessed setup` grava o valor em `~/.claude/settings.json` automaticamente. O Pattern A de três vias full-stack / Pattern C de 4 especialistas e outros Workflows multi-agente funcionam imediatamente.

---

## 🚀 Quick Start — 3 Opções

Em ordem crescente de intervenção do usuário:

### 🎯 Modo Auto (Recomendado para iniciantes / quem não quer pensar muito)

```
/auto "requisito X"

# Para requisitos grandes você pode ativar os stages explicitamente (geralmente desnecessário — a IA julga e roteia automaticamente;
# force se acreditar tratar-se de um requisito grande):
/auto "requisito X" --staged
```

> Não quer pensar muito, ou está começando agora — deixe o harnessed cuidar de tudo. Executa os 6 stages completos (research condicional → discuss → plan → task → verify → retro obrigatório) sem pausas. A IA julga a complexidade do requisito em 1-shot, sugere mudar para o modo `--staged` em requisitos grandes (para após cada stage para revisão); antes de iniciar pergunta "Você tem um entendimento claro do requisito?" — se não → executa automaticamente `/research` com investigação multi-fonte; finaliza com `/retro` obrigatório. Falha rápida em caso de erro; retome com `harnessed resume`.

### 📂 Modo Stage (Recomendado para power users / quem quer revisar resultados intermediários)

```
/discuss "requisito X"          # Clarificação em 3 camadas: Strategic + Phase + Subtask
/plan "requisito X"             # Architecture (condicional) + persistência do plano
/task "subtask-1"               # 4 subs em série (clarify → code → test → deliver)
/verify "phase-1"               # 7 subs com verificação condicional
```

> Quer decidir de qual stage partir / revisar outputs intermediários — os 4 masters podem ser chamados de forma independente, e cada master ainda expande automaticamente todos os subs daquele stage internamente.

### 🔬 Modo Cirúrgico (Modo expert / você sabe o que quer)

```
/discuss-phase "..."        # Executa apenas a clarificação da camada Phase
/plan-architecture "..."    # Executa apenas a revisão de arquitetura
/verify-paranoid "..."      # Executa apenas a revisão do Paranoid Staff Engineer
# ... escolha qualquer um dos outros 18 sub-workflows
```

> "Sou expert, vou decidir eu mesmo" — pule o master e invoque um sub-workflow diretamente. Adequado para usuários avançados que sabem exatamente qual sub precisam, ou para reutilização de um único step.

---

## 📐 Diagrama do Fluxo de 4 Stages

```mermaid
graph TD
  RS([⓪ /research — investigação multi-fonte pré-stage, opcional]):::optional
  subgraph Discuss[① Discuss — Clarificação Estratégica]
    DM[/discuss master/]
    DS[discuss-strategic]
    DP[discuss-phase]
    DT[discuss-subtask]
    DM --> DS & DP & DT
  end
  subgraph Plan[② Plan — Planejamento de Tarefas]
    PM[/plan master/]
    PA[plan-architecture]
    PP[plan-phase]
    PM --> PA & PP
  end
  subgraph Task[③ Task — Execução]
    TM[/task master/]
    TC[task-clarify]
    TCo[task-code]
    TT[task-test]
    TD[task-deliver]
    TM --> TC --> TCo --> TT --> TD
  end
  subgraph Verify[④ Verify — Verificação]
    VMs[/verify master/]
    VP[verify-progress]
    VC[verify-code-review]
    VPa[verify-paranoid]
    VQ[verify-qa]
    VS[verify-security]
    VD[verify-design]
    VSi[verify-simplify]
    VM[verify-multispec]
    VMs --> VP & VC & VPa & VQ & VS & VD & VSi & VM
  end
  RT([⑤ /retro — resumo do milestone, opcional]):::optional
  RS --> Discuss
  Discuss --> Plan --> Task --> Verify
  Verify --> RT
  classDef optional stroke-dasharray:5 5,fill:#f5f5f5,color:#666
```

> Caixas tracejadas = standalones opcionais (`/research` investigação pré-estratégica / `/retro` resumo pós-milestone); caixas sólidas = cadência principal dos 4 stages.

### Tabela de Visão Geral dos 25 Workflows

| Slash cmd | Stage | Tipo | Capacidade / Upstream | Resumo |
|-----------|-------|------|----------------------|-------|
| `/auto` | Todos | **Super-master** | masterOrchestrator (entre 6 stages) | Execução completa de 6 stages em 1-shot (research condicional → discuss → plan → task → verify → retro obrigatório); julgamento de complexidade em 1-shot + verificação de entendimento + retro obrigatório; `--staged` opt-in com gate por stage |
| `/discuss` | ① Discuss | Master | masterOrchestrator | 3 subs com avaliação de gate em paralelo (regra chain-isolation) |
| `/discuss-strategic` | ① Discuss | Sub | gstack `/office-hours` + `/plan-ceo-review` + planning-with-files | Camada estratégica — governança obrigatória para novos recursos / novos milestones / direção do produto (findings.md persistido) |
| `/discuss-phase` | ① Discuss | Sub | GSD `/gsd-discuss-phase` + planning-with-files | Camada de Phase — ≥2 decisões abertas / clarificação de área cinzenta (findings.md + knowledge.md persistidos) |
| `/discuss-subtask` | ① Discuss | Sub | superpowers brainstorming + `/grill-with-docs` | Camada de Subtask — ≥2 abordagens / algoritmo central / API contract (discussão curta efêmera, não persistida) |
| `/plan` | ② Plan | Master | masterOrchestrator | Invocação serial de 2 subs (architecture condicional → phase sempre) |
| `/plan-architecture` | ② Plan | Sub | gstack `/plan-eng-review` | Camada de arquitetura — gate de governança obrigatório para arquiteturas complexas |
| `/plan-phase` | ② Plan | Sub | GSD `/gsd-plan-phase` + planning-with-files `/plan` | Camada de plano — persiste `task_plan.md` + `progress.md` |
| `/task` | ③ Task | Master | masterOrchestrator | Invocação serial de 4 subs por subtask (clarify → code → test → deliver) |
| `/task-clarify` | ③ Task | Sub | superpowers brainstorming + `/grill-with-docs` condicional | Gate de clarificação no início da subtask |
| `/task-code` | ③ Task | Sub | karpathy 4 principles + `/zoom-out` / `/improve-codebase-architecture` / `/diagnose` condicional | Codificação da subtask + sincronização cross-session de progress.md |
| `/task-test` | ③ Task | Sub | superpowers TDD red-green-refactor + `/diagnose` condicional | TDD obrigatório para lógica central (alias mattpocock `/tdd`) |
| `/task-deliver` | ③ Task | Sub | wrapper SDK `ralph-loop` + Agent Teams condicional | Até `COMPLETE` verbatim + fallback max_iter R20.10 |
| `/verify` | ④ Verify | Master | masterOrchestrator | 7 subs com Dispatcher condicional por cenário |
| `/verify-progress` | ④ Verify | Sub | GSD `/gsd-verify-work` + `/gsd-progress` | Ponto de partida serial obrigatório — aceitação UAT + sincronização de estado |
| `/verify-code-review` | ④ Verify | Sub | `code-review` multi-subagent fan-out | Descobertas de alta confiança em paralelo |
| `/verify-paranoid` | ④ Verify | Sub | gstack `/review` (Paranoid Staff Engineer) | Obrigatório para módulos críticos antes de PR |
| `/verify-qa` | ④ Verify | Sub | gstack `/qa` + playwright-cli / `@playwright/test` / webapp-testing | QA end-to-end (condicional has_ui_changes) |
| `/verify-security` | ④ Verify | Sub | gstack `/cso` | OWASP / auth / secrets (condicional has_auth_or_secrets) |
| `/verify-design` | ④ Verify | Sub | gstack `/design-review` + ui-ux-pro-max + frontend-design | Consistência do sistema de design (condicional has_design_changes) |
| `/verify-simplify` | ④ Verify | Sub | `code-simplifier` | Simplificação serial final |
| `/verify-multispec` | ④ Verify | Sub | Agent Team Pattern C com 4 especialistas | Escalada para PR de release crítico / grande refatoração (cross-examination mútuo via SendMessage) |
| `/research` | Standalone | Standalone | Tavily / Exa MCP + ctx7 + GSD `/gsd-discuss-phase` | Investigação multi-fonte (alternativa ao Stage ①) |
| `/retro` | Standalone | Standalone | gstack `/retro` + planning-with-files RETROSPECTIVE.md | Resumo de encerramento de projeto / milestone |

> O orquestrador master roteia automaticamente via gate para o sub correto (regra chain-isolation — subs que não disparam são declarados como ignorados de forma transparente).
> A invocação direta de um sub também ignora o master para executar um único stage, por exemplo `/discuss-strategic "novo recurso X"`.

---

## ⚡ Fluxo de Uso

Metodologia three-layer-stack de 4 stages — recomendado conduzir pelos 4 master orchestrators em série:

```
/discuss  →  /plan  →  /task  →  /verify
   ①         ②        ③         ④
```

| Stage | Master | Principais sub-workflows | Colaboração com upstreams |
| ---- | ---- | ---- | ---- |
| ① **Discuss** | `/discuss` | strategic / phase / subtask (3 em paralelo) | gstack `/office-hours` + GSD `/gsd-discuss-phase` + superpowers brainstorming |
| ② **Plan** | `/plan` | architecture (condicional) → phase | gstack `/plan-eng-review` + GSD `/gsd-plan-phase` + planning-with-files |
| ③ **Task** | `/task` | clarify → code → test → deliver (4 em série por subtask) | karpathy principles + mattpocock moves + superpowers TDD + `ralph-loop` |
| ④ **Verify** | `/verify` | progress → 5 paralelos condicionais → simplify (+ multispec crítico) | GSD `/gsd-verify-work` + code-review + gstack `/review` / `/qa` / `/cso` / `/design-review` + code-simplifier |

Exemplo prático:

```bash
# 1. Instala os upstreams do Workflow (uma linha instala gstack + GSD + superpowers + planning-with-files)
harnessed setup

# 2. Executa a cadência de 4 stages dentro do Claude Code
/discuss "novo recurso X"          # Clarificação em 3 camadas: Strategic + Phase + Subtask
/plan "novo recurso X"             # Architecture (condicional) + plano (grafo de tarefas persistido)
/task "subtask-1: API contract"    # 4 subs em série por subtask
/verify "phase-1"                  # 7 subs condicionais

# 3. Retomar após interrupção (a qualquer momento)
harnessed resume
```

> Você também pode invocar subs diretamente para ignorar o master e executar apenas uma camada, por exemplo `/verify-paranoid` executa apenas a revisão do Paranoid Staff Engineer.

📊 Mermaid detalhado + walkthroughs completos de cada stage: [docs/WORKFLOW.md](./docs/WORKFLOW.md)

---

## 🗂️ Arquitetura (4 stages em namespace hierárquico)

### 1. Estrutura de Diretórios

```
harnessed/
├── manifests/                  # L1: camada de descrição upstream (NÃO vendored)
├── workflows/                  # L6: Skills de Composition (batuta do maestro dos 4 stages)
│   ├── discuss/                # Stage ① 3 camadas (strategic + phase + subtask)
│   │   ├── auto/               # gate-route do master /discuss
│   │   ├── strategic/          # /discuss-strategic (gstack /office-hours + /plan-ceo-review)
│   │   ├── phase/              # /discuss-phase (GSD /gsd-discuss-phase)
│   │   └── subtask/            # /discuss-subtask (superpowers brainstorming)
│   ├── plan/                   # Stage ② (architecture + grafo de tarefas da phase)
│   ├── task/                   # Stage ③ (clarify + code + test + deliver)
│   ├── verify/                 # Stage ④ (progress + code-review + paranoid + qa + cso + design + simplify + multispec)
│   ├── research/               # Stage ① alternativo standalone
│   ├── retro/                  # encerramento de milestone standalone pós-④
│   ├── capabilities.yaml       # L5a: ~100 entradas, 7 categorias SoT
│   ├── defaults.yaml           # ralph_max_iterations por fase de workflow
│   ├── judgments/              # L5a: critérios three-layer-stack + paralelismo + tdd + fallback + rules-routing
│   │   ├── strategic-gate.yaml
│   │   ├── phase-gate.yaml
│   │   ├── subtask-gate.yaml
│   │   ├── parallelism-gate.yaml         # L5b roteamento do mecanismo de execução
│   │   ├── tdd-gate.yaml
│   │   ├── fallback.yaml                 # 3 regras: skip_with_transparency + override + chain_isolation
│   │   ├── web-design-routing.yaml       # roteamento de ferramentas de design UI
│   │   ├── web-testing-routing.yaml      # roteamento de ferramentas E2E / browser testing
│   │   ├── web-search-routing.yaml       # roteamento de busca web / fetch de docs
│   │   └── stage-routing.yaml            # roteamento sub-stage do master orchestrator
│   └── disciplines/            # L0: linha de base de comportamento global entre stages
│       ├── karpathy.yaml       # 4 princípios + ≤200L
│       ├── output-style.yaml   # BLUF + no-emoji + no-em-dash
│       ├── language.yaml       # zh-Hans padrão + preservação do inglês
│       ├── operational.yaml    # biome preempt + A7 + commit safety
│       ├── priority.yaml       # arbitragem de conflitos entre Skills
│       └── protocols.yaml      # cc-handoff design doc self-contained
├── routing/                    # L4: SSOT do engine de roteamento (decision_rules.yaml)
├── schemas/                    # L3: JSON Schema (consumido por IDE / CI)
├── src/                        # L4: engine TS (workflow + routing + cli + installers + checkpoint + audit + state)
├── tests/                      # vitest unit + integration + dogfood (R8.1 dogfood-first)
├── scripts/                    # gate CI (check-workflow-schema, transparency-verdict, state-archive)
├── .planning/                  # Memory do projeto (STATE + ROADMAP + REQUIREMENTS + por-phase + milestones)
└── docs/adr/                   # registros de decisão de arquitetura
```

### 2. Camadas Lógicas (8 camadas)

```
┌────────────────────────────────────────────────────────────┐
│ L7 Slash cmd voltado ao usuário + harnessed CLI             │
│   /discuss /plan /task /verify (master) + 18 sub + /research /retro + /auto super-master
│   + invocação direta gstack (30+ opcionais): /office-hours /review /qa /...
├────────────────────────────────────────────────────────────┤
│ L6 Orquestração de Workflow (workflows/<stage>/<sub>/)       │
├────────────────────────────────────────────────────────────┤
│ L5b Mecanismo de Execução (ortogonal): subagent / Agent Teams│
│   / sessão principal + wrapper ralph-loop                   │
│   parallelism-gate.yaml: subagent padrão → escalada com 5 gatilhos │
│   Pattern A three-way full-stack / B hipóteses opostas / C revisão multi-dimensional │
├────────────────────────────────────────────────────────────┤
│ L5a Capability + Judgment + Defaults SoT                    │
│   capabilities.yaml (7 categorias) + judgments/ (10 arquivos) + │
│   defaults.yaml                                              │
├────────────────────────────────────────────────────────────┤
│ L4  Engine de runtime (workflow / routing / handlers)        │
├────────────────────────────────────────────────────────────┤
│ L3  TypeBox schema + gate CI                                 │
├────────────────────────────────────────────────────────────┤
│ L2  Installer + engine de Manifest                           │
├────────────────────────────────────────────────────────────┤
│ L1  Componentes upstream (NÃO vendored)                      │
├────────────────────────────────────────────────────────────┤
│ L0  Discipline Substrate (aplicado globalmente)              │
│   karpathy principles + output-style + language + operational + │
│   priority + protocols (aplicados universalmente em L1-L7)  │
└────────────────────────────────────────────────────────────┘
```

### 3. Capacidades Transversais (capabilities.yaml — 7 categorias, ~100 entradas)

```
behavioral (6):       karpathy-guidelines + output-style + language + operational + priority + protocols
tool-slash-cmd (~60): gstack 30+ opcionais + gsd 10+ + mattpocock 12 alta-frequência + etc.
tool-mcp (3):         chrome-devtools-mcp / tavily-mcp / exa-mcp
tool-cli (2):         ctx7 / gws
tool-plugin (2):      planning-with-files / @playwright/test
tool-bundled (3):     ralph-loop / webapp-testing / playwright-cli
agent-platform (3):   agent-teams-create / send-message / shutdown
```

### 4. Exemplo de Fluxo de Dados (usuário invoca `/discuss "novo recurso X"`)

```
[L7] Usuário invoca /discuss "novo recurso X"
  ↓
[L6] workflows/discuss/auto/workflow.yaml master orchestrator
  ↓
[L5a] judgments.strategic-gate.fires + phase-gate.fires + subtask-gate.fires (avaliação paralela em 3 vias)
  ↓
[L4] judgmentResolver.ts (split de ref em 4 níveis) + exprBuilder.ts (avaliação expr-eval)
  ↓
[L0] discipline.priority-hierarchy arbitra conflitos de ferramentas / output-style formata o output
  ↓
[sub com fires=true] → invoca sub-workflow (/discuss-strategic / /discuss-phase / /discuss-subtask)
  ↓ para cada sub:
      ├─ behavioral_layer: karpathy-guidelines (sempre ativo)
      ├─ tools_available: planning-with-files / ctx7 / mattpocock por condição
      ├─ parallelism: judgments.parallelism-gate.<route>.fires (mecanismo L5b)
      └─ invocações de phase executam via interpolação de template de capability
  ↓
[fallback.yaml chain-isolation] 3 camadas julgadas de forma independente, sem dependência serial
[Declaração de transparência de skip] subs que não disparam → "⚠️ Skipped <sub> because <reason>"
  ↓
planning-with-files /plan (ferramenta transversal) → grava artifacts em .planning/<phase-id>/
  ↓
[L4] state.ts writeCurrentWorkflow (proper-lockfile) + audit.append (JSONL de 12 campos)
```

### 5. Matriz de Roteamento de Decisões (baseada em regras, codificada em judgments + capabilities)

| Cenário | Padrão → Escalada |
|------|---------------------|
| Mecanismo de paralelismo | subagent → Agent Teams Pattern A/B/C (5 gatilhos) |
| Plano primário de design UI | ui-ux-pro-max → frontend-design (usuário pede estilo explicitamente) |
| Exploração E2E no browser | playwright-cli (uma linha Bash, eficiente em Token) |
| E2E commitável em TS | @playwright/test padrão |
| E2E com linkage de backend Python | webapp-testing |
| Diagnósticos de performance / a11y / memória | chrome-devtools-mcp |
| Busca web (por palavras-chave) | Tavily MCP padrão |
| Busca web (descritiva / acadêmica) | Exa MCP |
| Docs de API de bibliotecas | ctx7 CLI |
| URL do GitHub | gh CLI |
| Fetch de URL única | WebFetch built-in |
| Gmail / Drive / Calendar | gws CLI |
| Revisão de arquitetura (complexa) | gstack /plan-eng-review |
| TDD obrigatório (algoritmo central) | superpowers TDD OU mattpocock /tdd |
| PR de módulo crítico | gstack /review |
| Revisão multi-dimensional de PR com grande refatoração | Agent Team Pattern C com 4 especialistas |
| Hand-off entre sessões | discipline.protocols design doc self-contained |
| Complexidade de `/auto` para requisitos grandes | julgamento 1-shot da IA → sugere automaticamente `--staged` (resposta "n" sugere `/discuss` manual) |
| Entendimento do requisito em `/auto` | pergunta antes de iniciar → "n" adiciona automaticamente investigação multi-fonte via `/research` |

---

## 🛠️ Comandos Operacionais

> Estes são os comandos de manutenção próprios do harnessed (setup / health check / backup-rollback / recuperação de estado, etc.). Para o desenvolvimento diário de recursos, use apenas os slash commands acima — normalmente você não precisará destes.

**v4.0 — cérebro de orquestração.** Slash commands executam a clarificação na sessão principal do Claude Code (para que as perguntas cheguem até você), depois fazem spawn de subagents CC-native (habilitando Agent Teams + round-trips de clarificação). O harnessed fornece a avaliação de gates (`harnessed gates`) e prompts prontos para spawn (`harnessed prompt`); a sessão principal faz o spawn. `harnessed run` permanece para uso em CI/headless.

### Comandos CLI

| Comando | Descrição |
| ---- | ---- |
| `harnessed setup` | Setup inicial; instala Skills de Workflow em `~/.claude/skills/` + MCP em `~/.claude.json` |
| `harnessed gates <master>` | Avalia quais sub-workflows disparam para um master stage (JSON: fire/skip/parallelism). Usado por slash commands para orquestrar spawns nativos. |
| `harnessed prompt <sub>` | Gera um prompt pronto para spawn (role + checklist + disciplines + protocolos de completion/clarification) para um sub-workflow. |
| `harnessed checkpoint <action> <sub>` | Registra start/complete/fail de um sub-workflow em `~/.claude/harnessed/checkpoints/`. |
| `harnessed run <name>` | Executa um workflow via spawn SDK in-process (modo CI/headless). Slash commands usam spawn CC-native em vez disso. |
| `harnessed resume` | Retoma a partir do checkpoint mais recente após interrupção de sessão |
| `harnessed status` | Phase atual + detentor do lock |
| `harnessed doctor` | Health check com 8 verificações (Node / MCP / jq / Win bash / routing / token budget, etc.) |
| `harnessed install <name>` | Instala um Manifest upstream |
| `harnessed uninstall [name]` | Desinstalação unificada — sem nome: remove os arquivos próprios do harnessed (upstreams intactos); com nome: remove um único upstream |
| `harnessed backup` | Gerenciamento de snapshots de backup |
| `harnessed rollback <timestamp>` | Rollback em um único comando (preservação de EOL + verificação sha1) |
| `harnessed gc` | Limpa backups expirados |
| `harnessed audit-log` | Consulta do log de transparência de roteamento (suporta expressão jq com `--filter`) |

### Flags

> Todos os comandos **aplicam (escrita imediata)** por padrão — nenhuma flag é necessária. Usuários avançados podem adicionar `--dry-run` para visualizar prévia.

| Flag | Descrição |
| ---- | ---- |
| `--dry-run` | Visualiza sem gravar em disco (opt-in para usuários avançados) |
| `--non-interactive` | Cenários CI / scripted |
| `--system` | Permite instalação global L4 (caso contrário, faz downgrade para npx efêmero L1) |
| `--full-diff` | Expande diffs recolhidos acima de 200 linhas |
| `--no-color` | Força sem cor (mesmo em TTY) |
| `--task <text>` | Subcomando `run` — descrição da tarefa (passada como `gateContext.task` do workflow) |
| `--task-stdin` | Subcomando `run` — lê a descrição da tarefa do stdin até EOF (evita escape de shell em aspas/$/`) |


---

## ❓ FAQ

<details>
<summary><b>Q1. Ainda preciso instalar os upstreams superpowers / gstack / GSD após instalar o harnessed?</b></summary>

<br>

Sim, mas **a experiência do usuário = um único comando**:

```bash
harnessed setup  # Instala automaticamente gstack + GSD + superpowers + planning-with-files; 25 Skills de Workflow vão para ~/.claude/skills/ + variável de ambiente Agent Teams gravada automaticamente em ~/.claude.json
```

Pense no `brew install <formula>` puxando o conjunto completo de dependências — você não precisa fazer `brew install` de cada dependência separadamente.

</details>

<details>
<summary><b>Q2. Por que não fazer Vendor de superpowers / gstack no repositório do harnessed?</b></summary>

<br>

4 motivos:

1. **Filosofia de diferenciação** — o harnessed é o "gerenciador de pacotes assembleísta" em contraponto ao campo "all-in-one auto-construído". Fazer Vendor = perder o diferencial → tornar-se mais um pacote de Plugins
2. **Pesadelo de licença + atribuição** — fazer Vendor de 4-5 upstreams ativamente mantidos = um mosaico complexo de licenças
3. **Upgrades upstream invertem a direção** — a descrição via Manifest atual permite que os usuários reinstale para obter a versão mais recente no upgrade do upstream; fazer Vendor força sincronização manual de código e fica perpetuamente desatualizado
4. **Bus factor 1** — um único mantenedor mantendo 4-5 upstreams em sync = aceleração do burnout

</details>

<details>
<summary><b>Q3. gstack / GSD / superpowers parecem todos ferramentas de plan/discuss — não há sobreposição?</b></summary>

<br>

**Não**. Eles representam stages diferentes da three-layer-stack:

| Stage | Upstream | Responsabilidade |
| ---- | ---- | ---- |
| Governance | gstack | Gates de decisão multi-papel (CEO / EM / Designer / Paranoid Engineer) |
| Brainstorming | superpowers | Clarificação de design de Subtask, comparação de alternativas |
| Orchestration | GSD | Grafo de tarefas de alto nível por Phase + análise de dependências |
| Persistência | planning-with-files | Persiste `task_plan.md` / `progress.md` / `findings.md` |

`/discuss /plan /task /verify` — os 4 masters encadeiam os 4 stages; cada master delega internamente ao seu sub. Cada stage faz uma coisa diferente e alimenta o próximo. **Sem fusão**.

</details>

<details>
<summary><b>Q4. As fases do Workflow rodam automaticamente ou aguardam o usuário?</b></summary>

<br>

Depende do campo `pause` no frontmatter de `workflows/<name>/SKILL.md`:

- `pause: human_review` → bloqueia aguardando aprovação do usuário (gate de governança / lock final, por exemplo `/discuss-strategic` gstack `/office-hours` + `/plan-architecture` gate de lock-in `/plan-eng-review`)
- Sem `pause` → encadeia automaticamente para a próxima fase

O output de cada fase é gravado em `.harnessed/checkpoints/`; após uma interrupção de sessão, `harnessed resume` continua a partir do checkpoint mais recente.

</details>

<details>
<summary><b>Q5. O harnessed em si é um Plugin de CC?</b></summary>

<br>

É um híbrido:

- `npx harnessed@latest setup` executa o **CLI Node.js** (`bin/harnessed`)
- o setup instala **Skills de Workflow** (markdown) em `~/.claude/skills/`, carregadas pelo runtime do Claude Code
- `/discuss` / `/plan` / `/task` / `/verify` etc. são slash commands dentro do CC que disparam a execução das Skills
- O CLI e as Skills do CC compartilham o diretório de estado `.harnessed/checkpoints/`

</details>

---


## Licença

[Apache-2.0](./LICENSE) — veja [NOTICE](./NOTICE) (inclui disclaimer de marca registrada da Harness Inc.)

Apoie o desenvolvimento: [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
