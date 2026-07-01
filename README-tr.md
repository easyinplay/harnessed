# harnessed

[English](./README.md) | [简体中文](./README-cn.md) | [繁體中文](./README-tw.md) | [日本語](./README-ja.md) | [한국어](./README-ko.md) | [Português (Brasil)](./README-pt-BR.md) | **Türkçe** | [Русский](./README-ru.md) | [Tiếng Việt](./README-vi.md) | [ไทย](./README-th.md)

> **Note (best-effort translation):** This translation is generated/best-effort and may lag behind the English [README.md](./README.md). For the latest and authoritative content, refer to the English version.

> **Ham Claude Code'u disiplinli, kıdemli bir mühendislik ekibine dönüştürün.** Tek bir kurulum; governance, planlama, TDD ve incelemeyi tek bir Discuss→Ship Workflow'una bağlar; burada ilerleme ve kanıtlar sohbette değil, diskte kalıcı olur.

> _AI coding harness paket yöneticisi + Composition Orchestrator_ — üç katmanlı yığın iş birliği metodolojisini (gstack governance + GSD proje yöneticisi + superpowers kıdemli mühendis + karpathy ilkeleri + mattpocock hamleleri) çalıştırılabilir bir motor olarak makine düzeyinde uygular

[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)

> Harness Inc. ile herhangi bir bağlantısı, onayı veya sponsorluğu yoktur (bkz. [NOTICE](./NOTICE))

---

## ✨ TL;DR

**Nasıl çalışır**: harnessed, en iyi açık kaynak Claude Code ajanlarını (gstack, GSD, superpowers, planning-with-files) **bir araya getirir** ve görüşlü Composition Skills aracılığıyla bunları tek bir Workflow'a **orkestrale eder**. Upstream kodu vendor **etmez** — manifest'ler kurulum/kontrol adımlarını tanımlar, Composition Skills ise çok-upstream iş birliğini yönetir (böylece bir upstream yükseltmesi yalnızca yeniden kurulumdan ibarettir, asla elle kod senkronizasyonu değil).

### 🔁 İşletim döngüsü

> **Discuss → Plan → Build → Verify → Ship**, bir **Learn** döngüsüyle kapanır — üç katmanlı yığın boyunca makine düzeyinde yürütülür (gstack governance · GSD orkestrasyonu · superpowers TDD · checkpoint kanıtı). Ham ajan çalışması savrulur; harnessed bunu, ilerleme ve kanıtın sohbette yaşamak yerine kalıcı olduğu bir tek-doğru-kaynak (source-of-truth) yoluna dönüştürür. **Öğrenme otomatiktir**: tamamlanan her Workflow, başarısızlık/döngü/ret sinyallerini `.planning/LEARNINGS.md`'ye ekler ve bunlar bir sonraki döngüye enjekte edilir — bu her zaman açıktır, isteğe bağlı Retro'ya **bağlı değildir**. Retro (`/retro`) ayrı, isteğe bağlı bir milestone özetidir.

```mermaid
flowchart LR
  R(["⓪ Research<br/>çok-kaynaklı araştırma<br/>(isteğe bağlı)"]):::opt --> D
  D(["① Discuss<br/>3-katman açıklama"]) --> P(["② Plan<br/>spec + görev kalıcılaştırma"])
  P --> T(["③ Task<br/>TDD inşa + checkpoint"])
  T --> V(["④ Verify<br/>bağımsız inceleme + kanıt kapısı"])
  V --> S(["⑤ Ship<br/>release-preflight → tag'e hazır (yayın CI ile)"])
  S -. "milestone özeti" .-> RT(["Retro<br/>(isteğe bağlı)"]):::opt
  V -. "başarısız / boşluk" .-> T
  S == "🔁 Learn — her Workflow tamamlandığında öğrenimler yakalanır → sonraki döngüye enjekte edilir" ==> D
  classDef opt stroke-dasharray:5,opacity:0.8
```

---

## 🧱 Üç katmanlı yığın nedir?

harnessed'ın üç katmanlı yığını, yerleşik **BDD → SDD → TDD** iç içe yapısının bir yazılım mühendisliği uygulamasıdır: her biri farklı bir soruyu yanıtlayan üç iç içe geri besleme döngüsü. **Üç katman, döngülerin kendisidir** (kararlı teori); harnessed, açık kaynak ekosistemini her döngünün içine **birleştirir** (compose) — ve bileşenler **örtüşür**, ki bir Composition Orchestrator'ın tahkim ettiği tam da budur.

| Katman | Döngü | Yanıtladığı soru | Birleştirildiği bileşenler (örtüşen) |
|---|---|---|---|
| **① Behavior** | BDD | *Ne* inşa edilecek + bittiğini nasıl bileceğiz | gstack `/office-hours` governance · GSD discuss · superpowers brainstorming → kabul kriterleri |
| **② Spec** | SDD | *Nasıl* yapılandırılır | GSD plan-phase → gereksinimler / tasarım / görevler · contract'lar (Spec Kit / ECC desenleri) |
| **③ Implementation** | TDD | Gerçekten *çalışıyor* mu | superpowers TDD red-green · subagent yürütme · GSD verify-work · ralph-loop tamamlama |

Döngüler, aşama değil **iç içe geçmiş merceklerdir** — klasik Cucumber BDD-dış + TDD-iç çift döngüsü, GenAI çağı SDD spec halkasıyla genişletilerek üçlü döngüye dönüştürülmüştür. harnessed, varsayılan dış→iç geçişi 5-aşamalı cadence'ı olarak çalıştırır ve buna **bugün sevk ettiği geri-kenarları (back-edges)** ekler: Verify, başarısız işi Task'a geri gönderir; gri bir alana çarpan bir subagent, devam etmeden önce açıklamaya gidip geri döner; ve sevk edilen her döngü, öğrenimleri bir sonraki Discuss'a geri besler. (Daha ince taneli yapılandırılmış geri-kenarlar — örn. bir contract çelişkisini doğrudan Spec'e, belirsiz bir gereksinimi Behavior'a yönlendirmek — yol haritasındadır, henüz sevk edilmemiştir. harnessed, üçlü döngünün doğrusal-cadence gerçeklemesidir; tam yönlendirilmiş graf onun evrim yoludur.)

**Bileşenler örtüşür — mesele tam da bu.** **GSD**, orkestrasyon omurgası olarak üç döngünün hepsinden geçer; **gstack**, Behavior + Review'ı kapsar; **superpowers**, Behavior (brainstorm) + Implementation (TDD)'i kapsar. harnessed bunları bağlar — ve örtüşmeyi tahkim eder — tek bir motorda. Her katmandan geçen iki **çapraz-kesim disiplini** vardır: **karpathy ilkeleri** (*nasıl* kodlanır — basitlik-önce, cerrahi diff'ler) + **mattpocock hamleleri** (`/diagnose`, `/zoom-out` gibi talep üzerine taktiksel araçlar).

Yukarıdaki çalışma zamanı döngüsüyle eşlenir: **Discuss = Behavior (BDD) · Plan = Spec (SDD) · Build = Implementation (TDD)**, ardından **Verify + Ship** bunu kanıt kapılarıyla kapatır.

---

> Bekle — harnessed gerçekten superpowers / gstack / GSD gibi dev upstream'lerle boy ölçüşebilir mi?
> Elbette — biz **devlerin omuzları üzerinde duruyoruz**. Newton'ın dediği gibi, daha uzağı görürsün. 🧐
> ... *(fısıldıyor)* Yakından bakınca, o omuzda tüneyen papağana daha çok benziyoruz aslında.
> Eh — papağanlar taklit eder; biz **orkestrale ederiz**. 🦜

---

## 🎯 Temel Farklılaştırıcılar

- **Üç katmanlı yığın makine düzeyinde uygulanır** — **BDD→SDD→TDD iç içe üçlü döngüsü** ([bu da ne?](#-üç-katmanlı-yığın-nedir)), `gstack` + `GSD` + `superpowers`'tan birleştirilmiş (örtüşen, omurga olarak GSD) artı çapraz-kesim disiplinleri olarak `karpathy 4 ilkesi` + `mattpocock 23 hamlesi`
- **Upstream'lerin vendor edilmemesi** — manifest'ler kurulum/kontrolü tanımlar; upstream yükseltildiğinde kullanıcılar en son sürümü almak için yalnızca yeniden kurulum yapar
- **Composition Skill** — dahili Workflow Skills, şef sopası gibi davranıp birden fazla upstream'i uyum içinde orkestrale eder. **1 süper-ana `/auto` + 5 aşama-ana + 20 alt-workflow + 2 bağımsız = 28 namespace katmanlı Workflow**, tam 5-aşama makine uygulaması (`/auto` aşamalar arası tek atışta / `/discuss /plan /task /verify /ship` tek aşama / 20 adet üç katmanlı yığın alt-workflow / `/research /retro` 2 bağımsız)
- **L0 Discipline Substrate** — global çapraz-aşama davranış temeli (karpathy ilkeleri + çıktı stili + dil + operasyonel + öncelik + protokoller), evrensel olarak uygulanır
- **Paket yöneticisi zihniyeti** — kurulum bağımlılık grafiği otomatik çözümlenir, `doctor` sağlık kontrolü, install-base tek seferlik tam kurulum
- **Birleşik giriş noktası** — kullanıcılar her upstream'in terminolojisini öğrenmek zorunda kalmadan `/discuss /plan /task /verify /ship` ana slash komutlarını kullanır; alt komutlar tek bir aşamayı açıkça çağırır (örn. `/discuss-strategic` yalnızca stratejik katman açıklamasını çalıştırır)
- **İleri taşıma (forward continuation)** — `harnessed next` / `harnessed advance` sizi görevler ve phase'ler arasında taşır: biri bittiğinde, sonraki **`.planning/` disk durumundan türetilir** (bir phase, `PLAN`'ının eşleşen bir `SUMMARY`'si olduğunda tamamlanmıştır) — bakımı gereken bir kuyruk yoktur, dolayısıyla akış ortasında eklenen yeni bir phase otomatik olarak alınır ve devam, diskten yeniden türetir. Tur başına bir `NEXT-UNIT` izi (breadcrumb), bir sonrakinin ne olduğunu işaret eder

---

## 🆚 Native Claude Code / Codex'e karşı

Native ajanlar size ilkeller (primitives) verir; harnessed onları bir metodolojiye dokur. Native bir hücrede bir ilkelin "var olduğu" söylendiğinde, onu yine de her proje için kendiniz tasarlar, bağlar ve bakımını yaparsınız — harnessed bunu önceden-birleştirilmiş ve motor-güdümlü olarak sevk eder.

| Boyut | Native Claude Code | Native Codex | harnessed |
|---|---|---|---|
| **Workflow / metodoloji** | Yalnızca ilkeller — akışı her seferinde siz tasarlarsınız | Daha az ilkel — prompt başına serbest stil | Kodlanmış **Discuss→Ship** 5-aşama üç katmanlı yığın motoru — BDD + SDD + TDD döngüleri + 2 çapraz-kesim (Review + Ship) |
| **Talimat enjeksiyonu** | `CLAUDE.md` + skill'ler + hook'lar var, ama statik ve elle bağlanmış | Yalnızca `AGENTS.md` — skill/hook yok | Tur başına breadcrumb hook + görev kapsamlı yönlendirme + her döngüde enjekte edilen öğrenimler |
| **Durum / ilerleme** | Sohbet bağlamı — `/clear` / compaction'da kaybolur | Sohbet bağlamı — kalıcılık katmanı yok | Diskte `.planning/` + `current-workflow.json` defteri + checkpoint kanıtı |
| **Oturumlar arası kurtarma** | Bağlamı elle yeniden açıklayın | Bağlamı elle yeniden açıklayın | `harnessed status --recover`: buradasınız + sonraki adım |
| **Doğrulama / "bitti"** | Ajan kendini "bitti" diye bildirir | Ajan kendini "bitti" diye bildirir | Bağımsız inceleme subagent'ları + **fail-CLOSED kanıt koruması** (eksik artifact = bitmemiş) |
| **Subagent orkestrasyonu** | Subagent + Agent Teams mevcut, ama elle orkestre edilir | Subagent/team ilkeli yok | `gates → prompt → spawn → checkpoint`; Agent Teams göreve göre otomatik etkin |
| **Öğrenme döngüsü** | Yok | Yok | `LEARNINGS.md` otomatik yakalanır + bir sonraki döngüye enjekte edilir |
| **Platform erişimi** | Yalnızca Claude Code | Yalnızca Codex | **Çapraz-harness** — birincil Claude Code, platform katmanı üzerinden Codex |

> Native ajanlar, önemsiz tek seferlik düzenlemeler için sıfır-kurulum, sıfır-ek yük ile kazanır. harnessed ise iş birden fazla adıma, oturuma ya da subagent'a yayıldığı an hakkını verir — serbest stil savrulması ve sohbette-kaybolan durumun size maliyet çıkarmaya başladığı yerde.

---

## 📦 Hızlı Kurulum

```bash
npm install -g harnessed && harnessed setup
```

> Windows PowerShell 5.x `&&` zincirlemesini desteklemez — `;` kullanın ya da iki satıra bölün (`npm install -g harnessed; harnessed setup`). bash / zsh / PowerShell 7+ / cmd.exe normal çalışır.

🤖 **Veya bir yapay zekaya kurdurun** — bu cümleyi Claude Code'a (ya da herhangi bir yapay zeka asistanına) yapıştırın:

> Install harnessed for me following the guide at `https://github.com/easyinplay/harnessed/blob/main/INSTALL-WITH-AI.md`

Yapay zeka dokümanı otomatik olarak çeker ve kurulumu gerçekleştirir; işletim sistemi / izinler / PATH / corepack uç durumlarını sizin yerinize halleder — büyük metin parçaları kopyalamanıza gerek yoktur.

> [!TIP]
> 🚀 **Çok sevilen Agent Teams ve Subagent özellikleri harnessed'da göreve göre otomatik etkinleştirilir!**
> `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`'i elle yapılandırmanıza gerek yok — `harnessed setup` bunu `~/.claude/settings.json`'a otomatik olarak yazar. Pattern A tam-yığın üçlü / Pattern C 4-uzman ve diğer çok-ajan Workflow'ları kutudan çıktığı gibi çalışır.

---

## ⏱️ İlk 5 Dakika

Sıfırdan çalışan bir Workflow'a en kısa yol:

```bash
# 1. Kurulum (tek satır)
npm install -g harnessed && harnessed setup
```

```
# 2. Claude Code içinde — ilk Workflow'unuzu başlatın
/auto "ilk gereksiniminiz"        # yeni başlayan varsayılanı: tüm aşamaları uçtan uca çalıştırır
```

```bash
# 3. Kaybolduysanız? harnessed'ı argümansız çalıştırın — nerede olduğunuzu + sırada ne olduğunu söyler
harnessed
#   → buradasınız panosu (aktif phase + adım başına durum) + bir NEXT: auto|manual|done satırı
#   status / next / resume hatırlamaya gerek yok — tek komut (comet `/comet` benzeri, salt-okunur)
#   makine okunabilir çıktı için --json ekleyin
```

```bash
# 4. Bir kesintiden sonra istediğiniz zaman devam edin
harnessed            # aynı buradasınız görünümü
harnessed resume     # en son checkpoint'ten devam edin
```

> Hangi aşamanın ne zaman çalışacağı üzerinde daha ince denetim mi istiyorsunuz? Aşağıdaki 3 moda bakın.

---

## 🚀 Hızlı Başlangıç — 3 Seçenek

Artan kullanıcı müdahalesi sırasıyla:

### 🎯 Otomatik Mod (Yeni başlayanlar / fazla düşünmek istemeyenler için önerilir)

```
/auto "gereksinim X"

# Büyük gereksinimler için aşamaları açıkça belirtebilirsiniz (genellikle gerekmez — yapay zeka
# otomatik değerlendirip yönlendirir; büyük bir gereksinim olduğuna inanıyorsanız zorla kullanın):
/auto "gereksinim X" --staged
```

> Fazla düşünmek istemiyorsanız ya da yeni başlıyorsanız — her şeyi harnessed'a bırakın. Durmaksızın tam 6 aşama çalışır (araştırma koşullu → discuss → plan → task → verify → retro zorunlu). Yapay zeka tek atışta gereksinim karmaşıklığını değerlendirir, büyük gereksinimler için `--staged` moduna geçmeyi önerir (her aşamadan sonra inceleme için durur); başlamadan önce "Gereksinimi açıkça anlıyor musunuz?" sorusunu sorar — hayır → `/research` çok-kaynaklı araştırmayı otomatik çalıştırır; zorunlu `/retro` özetiyle biter. Hata durumunda hızlı kesilir, `harnessed resume` ile devam edilir.

### 📂 Aşama Modu (İleri kullanıcılar / ara sonuçları incelemek isteyenler için önerilir)

```
/discuss "gereksinim X"          # Stratejik + Phase + Subtask 3 katmanlı açıklama
/plan "gereksinim X"             # Mimari (koşullu) + plan kalıcılaştırma
/task "alt görev-1"              # 4 alt-workflow seri (clarify → code → test → deliver)
/verify "phase-1"                # 10 alt-workflow koşullu doğrulama
```

> Hangi aşamadan başlayacağınıza karar vermek / ara çıktıları incelemek istiyorsanız — 5 ana bağımsız olarak çağrılabilir ve her ana, dahili olarak o aşamanın tüm alt-workflow'larını yine de otomatik olarak dağıtır.

### 🔬 Cerrahi Mod (Uzman modu / ne istediğinizi biliyorsunuz)

```
/discuss-phase "..."        # Yalnızca Phase katmanı açıklamasını çalıştır
/plan-architecture "..."    # Yalnızca mimari incelemeyi çalıştır
/verify-paranoid "..."      # Yalnızca Paranoid Staff Engineer incelemesini çalıştır
# ... diğer 20 alt-workflow'dan birini seçin
```

> "Ben uzmanım, kendim karar veririm" — ana orchestrator'ı atlayıp doğrudan bir alt-workflow'u çağırın. Tam olarak hangi alt-workflow'a ihtiyaç duyduğunu bilen ileri kullanıcılar için ya da tek adımın yeniden kullanımı için uygundur.

---

## 📐 5-Aşama Akış Diyagramı

```mermaid
graph TD
  RS([⓪ /research — ön aşama çok-kaynaklı araştırma, isteğe bağlı]):::optional
  subgraph Discuss[① Discuss — Stratejik Açıklama]
    DM[/discuss master/]
    DS[discuss-strategic]
    DP[discuss-phase]
    DT[discuss-subtask]
    DM --> DS & DP & DT
  end
  subgraph Plan[② Plan — Görev Planlaması]
    PM[/plan master/]
    PA[plan-architecture]
    PP[plan-phase]
    PM --> PA & PP
  end
  subgraph Task[③ Task — Yürütme]
    TM[/task master/]
    TC[task-clarify]
    TCo[task-code]
    TT[task-test]
    TD[task-deliver]
    TM --> TC --> TCo --> TT --> TD
  end
  subgraph Verify[④ Verify — Doğrulama]
    VMs[/verify master/]
    VP[verify-progress]
    VC[verify-code-review]
    VPa[verify-paranoid]
    VQ[verify-qa]
    VS[verify-security]
    VD[verify-design]
    VE[verify-eval-review]
    VV[verify-validate-phase]
    VSi[verify-simplify]
    VM[verify-multispec]
    VMs --> VP & VC & VPa & VQ & VS & VD & VE & VV & VSi & VM
  end
  subgraph Ship[⑤ Ship — Sürüm]
    SMs[/ship master/]
    SP[ship-preflight]
    SMs --> SP
  end
  RT([⑥ /retro — milestone özeti, isteğe bağlı]):::optional
  RS --> Discuss
  Discuss --> Plan --> Task --> Verify --> Ship
  Ship --> RT
  classDef optional stroke-dasharray:5 5,fill:#f5f5f5,color:#666
```

> Kesik çizgili kutular = isteğe bağlı bağımsız araçlar (`/research` stratejik öncesi araştırma / `/retro` milestone sonrası özet); düz kutular = ana 5-aşama cadence (Ship, tag'e hazır noktada durur; gerçek yayını `publish.yml` CI yapar).

### 28-Workflow Genel Bakış Tablosu

| Slash komutu | Aşama | Tür | Yetenek / Upstream | Kısa açıklama |
|-----------|-------|------|----------------------|-------|
| `/auto` | Tümü | **Süper-ana** | masterOrchestrator (6 aşama boyunca) | Tek atışta tam 6-aşama çalışma (araştırma koşullu → discuss → plan → task → verify → retro zorunlu); yapay zeka tek atışta karmaşıklık değerlendirmesi + anlama kontrolü + zorunlu retro; `--staged` isteğe bağlı aşama kapısı |
| `/discuss` | ① Discuss | Ana | masterOrchestrator | 3 alt-workflow paralel kapı-değerlendirmesi (chain-isolation kuralı) |
| `/discuss-strategic` | ① Discuss | Alt | gstack `/office-hours` + `/plan-ceo-review` + planning-with-files | Stratejik katman — yeni özellikler / yeni milestone'lar / ürün yönü için zorunlu governance (findings.md kalıcılaştırılır) |
| `/discuss-phase` | ① Discuss | Alt | GSD `/gsd-discuss-phase` + planning-with-files | Phase katmanı — ≥2 açık karar / gri alan açıklaması (findings.md + knowledge.md kalıcılaştırılır) |
| `/discuss-subtask` | ① Discuss | Alt | superpowers brainstorming + `/grill-with-docs` | Subtask katmanı — ≥2 yaklaşım / temel algoritma / API contract (geçici kısa tartışma, kalıcılaştırılmaz) |
| `/plan` | ② Plan | Ana | masterOrchestrator | 2 alt-workflow seri çağrısı (mimari koşullu → phase her zaman) |
| `/plan-architecture` | ② Plan | Alt | gstack `/plan-eng-review` | Mimari katman — karmaşık mimari için zorunlu governance kapısı |
| `/plan-phase` | ② Plan | Alt | GSD `/gsd-plan-phase` + planning-with-files `/plan` | Plan katmanı — `task_plan.md` + `progress.md` kalıcılaştırır |
| `/task` | ③ Task | Ana | masterOrchestrator | Her alt görev için 4 alt-workflow seri çağrısı (clarify → code → test → deliver) |
| `/task-clarify` | ③ Task | Alt | superpowers brainstorming + `/grill-with-docs` koşullu | Alt görev başlangıç açıklama kapısı |
| `/task-code` | ③ Task | Alt | karpathy 4 ilkesi + `/zoom-out` / `/improve-codebase-architecture` / `/diagnose` koşullu | Alt görev kodlama + çapraz oturum progress.md senkronizasyonu |
| `/task-test` | ③ Task | Alt | superpowers TDD red-green-refactor + `/diagnose` koşullu | Temel mantık için TDD zorunlu (mattpocock `/tdd` takma adı) |
| `/task-deliver` | ③ Task | Alt | `ralph-loop` SDK sarmalayıcı + Agent Teams koşullu | Verbatim `COMPLETE` alınana kadar + R20.10 max_iter fallback |
| `/verify` | ④ Verify | Ana | masterOrchestrator | 10 alt-workflow senaryoya göre koşullu dağıtım |
| `/verify-progress` | ④ Verify | Alt | GSD `/gsd-verify-work` + `/gsd-progress` | Zorunlu seri başlangıç noktası — UAT kabulü + durum senkronizasyonu |
| `/verify-code-review` | ④ Verify | Alt | `code-review` çok-subagent fan-out | Paralel yüksek-güvenilirlik bulguları |
| `/verify-paranoid` | ④ Verify | Alt | gstack `/review` (Paranoid Staff Engineer) | Kritik modül PR öncesi zorunlu |
| `/verify-qa` | ④ Verify | Alt | gstack `/qa` + playwright-cli / `@playwright/test` / webapp-testing | Uçtan uca QA (has_ui_changes koşullu) |
| `/verify-security` | ④ Verify | Alt | gstack `/cso` | OWASP / auth / secrets (has_auth_or_secrets koşullu) |
| `/verify-design` | ④ Verify | Alt | gstack `/design-review` + ui-ux-pro-max + design-taste-frontend | Tasarım sistemi tutarlılığı (has_design_changes koşullu) |
| `/verify-eval-review` | ④ Verify | Alt | GSD `/gsd-eval-review` | AI phase eval kapsam denetimi (has_ai_phase koşullu; plan tarafındaki gsd-ai-integration-phase ile eşleşir) |
| `/verify-validate-phase` | ④ Verify | Alt | GSD `/gsd-validate-phase` | Nyquist requirement→test kapsam boşluğu doldurma (requires_coverage_audit koşullu) |
| `/verify-simplify` | ④ Verify | Alt | `code-simplifier` | Son seri sadeleştirme |
| `/verify-multispec` | ④ Verify | Alt | 4-uzman Agent Team Pattern C | Kritik sürüm / büyük refactor PR tırmanması (karşılıklı SendMessage çapraz sorgulama) |
| `/ship` | ⑤ Ship | Ana | masterOrchestrator | Verify sonrası sürüm aşaması — preflight → PR/deploy'u gstack `/ship`'e devret → yayını CI ile yap (tag'e hazır sınırı) |
| `/ship-preflight` | ⑤ Ship | Alt | `harnessed release-preflight` | Salt-okunur sürüm-hazırlık kapısı (CHANGELOG `[Unreleased]` / sürüm / git-clean / tag-yokluğu); başarısızlıkta bloklar |
| `/research` | Bağımsız | Bağımsız | Tavily / Exa MCP + ctx7 + GSD `/gsd-discuss-phase` | Çok-kaynaklı araştırma (Aşama ① alternatifi) |
| `/retro` | Bağımsız | Bağımsız | gstack `/retro` + planning-with-files RETROSPECTIVE.md | Proje / milestone kapanış özeti |

> Ana orchestrator, doğru alt-workflow'a otomatik kapı-yönlendirmesi yapar (chain-isolation kuralı — tetiklenmeyen alt-workflow'lar şeffaf biçimde atlandı olarak bildirilir).
> Alt-workflow'ların doğrudan çağrılması da ana orchestrator'ı atlayıp tek bir aşamayı çalıştırır, örn. `/discuss-strategic "yeni özellik X"`.

---

## ⚡ Kullanım Akışı

5-aşama üç katmanlı yığın metodolojisi — 5 ana orchestrator'ı seri olarak kullanarak sürmeniz önerilir:

```
/discuss  →  /plan  →  /task  →  /verify  →  /ship
   ①         ②        ③         ④           ⑤
```

| Aşama | Ana | Ana alt-workflow'lar | Upstream iş birliği |
| ---- | ---- | ---- | ---- |
| ① **Discuss** | `/discuss` | strategic / phase / subtask (3 paralel) | gstack `/office-hours` + GSD `/gsd-discuss-phase` + superpowers brainstorming |
| ② **Plan** | `/plan` | architecture (koşullu) → phase | gstack `/plan-eng-review` + GSD `/gsd-plan-phase` + planning-with-files |
| ③ **Task** | `/task` | clarify → code → test → deliver (her alt görev için 4 seri) | karpathy ilkeleri + mattpocock hamleleri + superpowers TDD + `ralph-loop` |
| ④ **Verify** | `/verify` | progress → 5 paralel koşullu → simplify (+ multispec kritik) | GSD `/gsd-verify-work` + code-review + gstack `/review` / `/qa` / `/cso` / `/design-review` + code-simplifier |
| ⑤ **Ship** | `/ship` | preflight (sürüm-hazırlık kapısı) → PR/deploy devri | `harnessed release-preflight` + gstack `/ship` + `publish.yml` CI (tag'e hazır sınırı) |

Pratik örnek:

```bash
# 1. Workflow upstream'lerini kurun (tek satır gstack + GSD + superpowers + planning-with-files'ı kurar)
harnessed setup

# 2. Claude Code içinde 5-aşama cadence'ı çalıştırın
/discuss "yeni özellik X"          # Stratejik + Phase + Subtask 3 katmanlı açıklama
/plan "yeni özellik X"             # Mimari (koşullu) + plan (görev grafiği kalıcılaştırılır)
/task "alt görev-1: API contract"  # Her alt görev için 4 seri alt-workflow
/verify "phase-1"                  # 10 koşullu alt-workflow
/ship                              # release-preflight kapısı → PR/deploy (tag'e hazır; yayın CI ile)

# 3. Kesintiden sonra devam edin (herhangi bir zamanda)
harnessed resume
```

> Ayrıca ana orchestrator'ı atlayıp yalnızca bir katmanı çalıştırmak için alt-workflow'ları doğrudan çağırabilirsiniz; örn. `/verify-paranoid` yalnızca Paranoid Staff Engineer incelemesini çalıştırır.

📊 Ayrıntılı mermaid + tam aşama açıklamaları: [docs/WORKFLOW.md](./docs/WORKFLOW.md)

---

## 🗂️ Mimari (5-aşama namespace katmanlı)

### 1. Dizin Yapısı

```
harnessed/
├── manifests/                  # L1: upstream tanımlama katmanı (vendor EDİLMEZ)
├── workflows/                  # L6: composition skills (5-aşama şef sopası)
│   ├── discuss/                # Aşama ① 3 katman (strategic + phase + subtask)
│   │   ├── auto/               # /discuss master kapı-yönlendirmesi
│   │   ├── strategic/          # /discuss-strategic (gstack /office-hours + /plan-ceo-review)
│   │   ├── phase/              # /discuss-phase (GSD /gsd-discuss-phase)
│   │   └── subtask/            # /discuss-subtask (superpowers brainstorming)
│   ├── plan/                   # Aşama ② (mimari + phase görev grafiği)
│   ├── task/                   # Aşama ③ (clarify + code + test + deliver)
│   ├── verify/                 # Aşama ④ (progress + code-review + paranoid + qa + cso + design + simplify + multispec)
│   ├── ship/                   # Aşama ⑤ (preflight sürüm-hazırlık kapısı → PR/deploy'u gstack /ship'e devret; tag'e hazır)
│   ├── research/               # bağımsız Aşama ① alternatifi
│   ├── retro/                  # bağımsız ⑤ sonrası milestone kapanışı
│   ├── capabilities.yaml       # L5a: ~100 giriş, 7 kategori SoT
│   ├── defaults.yaml           # workflow phase başına ralph_max_iterations
│   ├── judgments/              # L5a: üç katmanlı yığın kriterleri + paralellik + tdd + fallback + rules-routing
│   │   ├── strategic-gate.yaml
│   │   ├── phase-gate.yaml
│   │   ├── subtask-gate.yaml
│   │   ├── parallelism-gate.yaml         # L5b yürütme mekanizması yönlendirmesi
│   │   ├── tdd-gate.yaml
│   │   ├── fallback.yaml                 # 3 kural: skip_with_transparency + override + chain_isolation
│   │   ├── web-design-routing.yaml       # UI tasarım araç yönlendirmesi
│   │   ├── web-testing-routing.yaml      # E2E / tarayıcı test araç yönlendirmesi
│   │   ├── web-search-routing.yaml       # Web arama / belge çekme yönlendirmesi
│   │   └── stage-routing.yaml            # master orchestrator alt-aşama yönlendirmesi
│   └── disciplines/            # L0: global çapraz-aşama davranış temeli
│       ├── karpathy.yaml       # 4 ilke + ≤200L
│       ├── output-style.yaml   # BLUF + no-emoji + no-em-dash
│       ├── language.yaml       # zh-Hans varsayılan + İngilizce koruma
│       ├── operational.yaml    # biome preempt + A7 + commit güvenliği
│       ├── priority.yaml       # skill çatışma tahkimi
│       └── protocols.yaml      # cc-handoff tasarım belgesi öz-içerikli
├── routing/                    # L4: yönlendirme motoru SSOT (decision_rules.yaml)
├── schemas/                    # L3: JSON Schema (IDE / CI tarafından kullanılır)
├── src/                        # L4: TS motoru (workflow + routing + cli + installer'lar + checkpoint + audit + state)
├── tests/                      # vitest unit + integration + dogfood (R8.1 dogfood-first)
├── scripts/                    # CI kapısı (check-workflow-schema, transparency-verdict, state-archive)
├── .planning/                  # proje belleği (STATE + ROADMAP + REQUIREMENTS + phase başına + milestone'lar)
└── docs/adr/                   # mimari karar kayıtları
```

### 2. Mantıksal Katmanlama (8 katman)

```
┌────────────────────────────────────────────────────────────┐
│ L7 Kullanıcıya yönelik slash komutu + harnessed CLI          │
│   /discuss /plan /task /verify /ship (master) + 20 alt + /research /retro + /auto süper-master
│   + doğrudan gstack çağrısı (30+ isteğe bağlı): /office-hours /review /qa /...
├────────────────────────────────────────────────────────────┤
│ L6 Workflow orkestrasyonu (workflows/<aşama>/<alt>/)         │
├────────────────────────────────────────────────────────────┤
│ L5b Yürütme Mekanizması (ortogonal): subagent / Agent Teams  │
│   / ana oturum + ralph-loop sarmalayıcı                     │
│   parallelism-gate.yaml: varsayılan subagent → 5 tetikleyici ile tırmanma │
│   Pattern A tam-yığın üçlü / B karşıt hipotezler / C çok-boyutlu inceleme │
├────────────────────────────────────────────────────────────┤
│ L5a Yetenek + Yargılama + Varsayılanlar SoT                  │
│   capabilities.yaml (7 kategori) + judgments/ (10 dosya) +  │
│   defaults.yaml                                              │
├────────────────────────────────────────────────────────────┤
│ L4  Çalışma zamanı motoru (workflow / routing / handler'lar) │
├────────────────────────────────────────────────────────────┤
│ L3  TypeBox şeması + CI kapısı                               │
├────────────────────────────────────────────────────────────┤
│ L2  Installer + Manifest motoru                              │
├────────────────────────────────────────────────────────────┤
│ L1  Upstream bileşenler (vendor EDİLMEZ)                     │
├────────────────────────────────────────────────────────────┤
│ L0  Discipline Substrate (global olarak uygulanır)           │
│   karpathy ilkeleri + output-style + dil + operasyonel +    │
│   öncelik + protokoller (L1-L7'ye evrensel olarak uygulanır)│
└────────────────────────────────────────────────────────────┘
```

### 3. Çapraz-Kesim Yetenekleri (capabilities.yaml — 7 kategori, ~100 giriş)

```
behavioral (6):       karpathy-guidelines + output-style + language + operational + priority + protocols
tool-slash-cmd (~60): gstack 30+ isteğe bağlı + gsd 10+ + mattpocock 12 yüksek-frekanslı + vb.
tool-mcp (3):         chrome-devtools-mcp / tavily-mcp / exa-mcp
tool-cli (2):         ctx7 / gws
tool-plugin (2):      planning-with-files / @playwright/test
tool-bundled (3):     ralph-loop / webapp-testing / playwright-cli
agent-platform (3):   agent-teams-create / send-message / shutdown
```

### 4. Veri Akışı Örneği (kullanıcı `/discuss "yeni özellik X"` çağırır)

```
[L7] Kullanıcı /discuss "yeni özellik X" çağırır
  ↓
[L6] workflows/discuss/auto/workflow.yaml master orchestrator
  ↓
[L5a] judgments.strategic-gate.fires + phase-gate.fires + subtask-gate.fires (3 yönlü paralel değerlendirme)
  ↓
[L4] judgmentResolver.ts (4 seviyeli ref bölümü) + exprBuilder.ts (expr-eval değerlendirme)
  ↓
[L0] discipline.priority-hierarchy araç çatışmalarını tahkim eder / output-style çıktıyı biçimlendirir
  ↓
[fires=true alt] → alt-workflow çağrısı (/discuss-strategic / /discuss-phase / /discuss-subtask)
  ↓ her alt için:
      ├─ behavioral_layer: karpathy-guidelines (her zaman açık)
      ├─ tools_available: planning-with-files / ctx7 / mattpocock koşula bağlı
      ├─ parallelism: judgments.parallelism-gate.<yol>.fires (L5b mekanizması)
      └─ phase çağrıları yetenek şablonu interpolasyonu ile yürütülür
  ↓
[fallback.yaml chain-isolation] 3 katman bağımsız değerlendirilir, seri bağımlı değil
[Şeffaflık bildirimi atlandı] tetiklenmeyen alt'lar → "⚠️ Skipped <alt> because <neden>"
  ↓
planning-with-files /plan (çapraz-kesim araç) → artifact'ları .planning/<phase-id>/'a yazar
  ↓
[L4] state.ts writeCurrentWorkflow (proper-lockfile) + audit.append (12-alan JSONL)
```

### 5. Karar Yönlendirme Matrisi (kural tabanlı, judgments + capabilities içinde kodlanmış)

| Senaryo | Varsayılan → Tırmanma |
|------|---------------------|
| Paralellik mekanizması | subagent → Agent Teams Pattern A/B/C (5 tetikleyici) |
| UI tasarımı birincil plan | **iki aşamalı**: ui-ux-pro-max (hedef kitle / etkileşim mantığı / tasarım ekseni — yapı) → design-taste-frontend (anti-slop görsel cila overlay, çapraz-agent taste-skill) |
| E2E tarayıcı keşfi | playwright-cli (tek satır Bash, token-verimli) |
| E2E commit edilebilir TS | @playwright/test varsayılan |
| E2E Python backend bağlantısı | webapp-testing |
| Performans / a11y / bellek tanılaması | chrome-devtools-mcp |
| Web arama (anahtar kelime) | Tavily MCP varsayılan |
| Web arama (tanımlayıcı / akademik) | Exa MCP |
| Kütüphane API belgeleri | ctx7 CLI |
| GitHub URL | gh CLI |
| Tek URL çekme | WebFetch dahili |
| Gmail / Drive / Calendar | gws CLI |
| Mimari inceleme (karmaşık) | gstack /plan-eng-review |
| TDD zorunlu (temel algoritma) | superpowers TDD VEYA mattpocock /tdd |
| Kritik modül PR | gstack /review |
| Büyük refactor PR çok-boyutlu inceleme | 4-uzman Agent Team Pattern C |
| Çapraz oturum hand-off | discipline.protocols öz-içerikli tasarım belgesi |
| `/auto` büyük gereksinimler için karmaşıklık | yapay zeka tek atışta değerlendirme → `--staged` otomatik öneri (n iptal manuel `/discuss` önerir) |
| `/auto` gereksinim anlayışı | başlamadan önce sor → n otomatik `/research` çok-kaynaklı araştırma ekler |

---

## 🛠️ Operasyonel Komutlar

> Bunlar harnessed'ın kendi bakım komutlarıdır (kurulum / sağlık kontrolü / yedek-geri alma / durum kurtarma vb.). Günlük özellik geliştirme için yukarıdaki slash komutlarını kullanın — bunlara genellikle ihtiyaç duymazsınız.

**v4.0 — orkestrasyon beyni.** Slash command'lar açıklama (clarification) işlemini Claude Code ana session'ında çalıştırır (böylece sorular size ulaşır), ardından CC-native subagent'lar spawn eder (Agent Teams + açıklama round-trip'lerini etkinleştirir). harnessed gate değerlendirmesi (`harnessed gates`) ve spawn'a hazır prompt'lar (`harnessed prompt`) sağlar; spawn işlemini ana session yapar. `harnessed run`, CI/headless kullanım için korunur.

### CLI Komutları

| Komut | Açıklama |
| ---- | ---- |
| `harnessed setup` | Tek seferlik kurulum; workflow skills'i `~/.claude/skills/`'e + MCP'yi `~/.claude.json`'a kurar |
| `harnessed gates <master>` | Bir master stage için hangi sub-workflow'ların tetiklendiğini değerlendirir (JSON: fire/skip/parallelism). Slash command'lar tarafından native spawn'ları orkestre etmek için kullanılır. |
| `harnessed prompt <sub>` | Bir sub-workflow için spawn'a hazır bir prompt (role + checklist + disciplines + completion/clarification protokolleri) üretir. |
| `harnessed checkpoint <action> <sub>` | Bir sub-workflow'un start/complete/fail durumunu `~/.claude/harnessed/checkpoints/`'e kaydeder. |
| `harnessed` (argümansız) | Sıfır-argüman buradasınız: aktif-workflow panosu + `NEXT: auto\|manual\|done` + çalıştırma ipucu; `--json` makine okunabilir; aktif workflow yoksa → onboarding ipucu (comet `/comet` benzeri, salt-okunur). |
| `harnessed next` | Deterministik sonraki-adım contract'ı. Bir workflow içinde: `NEXT: auto\|manual\|done`. Workflow'un alt'larının tümü çözüldüğünde, bir sonraki **çapraz-birime** (`.planning/` disk durumundan türetilen sonraki phase/task) düşer; exit-code contract'ı ile (`0` ilerle · `2` bitti · `10` bloklanmış). |
| `harnessed advance` | İleri taşıma — milestone boyunca sonraki iş birimini (sonraki phase/task) ve onu çalıştıracak komutu yazdırır. Yalnızca-yazdırır (sonraki `/auto`'yu ana session çalıştırır); tamamlanmamış daha önceki bir phase'i geçmeyi reddeder (`--force` geçersiz kılar); `--json`, bir `while harnessed advance --json; do :; done` döngüsünü sürer. |
| `harnessed reject <sub>` | Bir alt'ı kullanıcı-reddetti olarak işaretler (terminal, `failed`'den farklı). |
| `harnessed compact [--tokens <n>]` | Çözülmüş defter girişlerini özetler+tahliye eder (G6-güvenli: `fail_count>0` asla tahliye edilmez); `checkpoint complete --tokens` üzerinde otomatik tetiklenir. |
| `harnessed workflows` | Devam eden workflow'ları listeler (repo başına bir tane). |
| `harnessed learn "<lesson>"` | Bu repo'nun `.planning/LEARNINGS.md`'sine düz metin bir öğrenim ekler. |
| `harnessed run <name>` | Bir workflow'u in-process SDK spawn ile çalıştırır (CI/headless modu). Slash command'lar bunun yerine CC-native spawn kullanır. |
| `harnessed resume` | Oturum kesintisinden sonra en son checkpoint'ten devam eder |
| `harnessed status` | Mevcut phase + kilit sahibi |
| `harnessed doctor` | 14-kontrollü sağlık denetimi (Node / MCP / jq / Win bash / routing / token bütçesi / mattpocock / CodeGraph / güncelleme-mevcut vb.) |
| `harnessed update [--check\|--upstreams\|--migration-report]` | Kendini güncelle (`npm i -g harnessed@latest`); `--check` en son sürümü bildirir; `--upstreams` temel manifest'leri yeniden çalıştırır; `--migration-report` salt-okunur bir bayat-durum envanteridir |
| `harnessed release-preflight` | Salt-okunur sürüm-hazırlık kapısı (CHANGELOG `[Unreleased]` / sürüm / git-clean / tag-yokluğu); hazır değilse 1 ile çıkar. Ship-aşaması kapısı. |
| `harnessed retro --done` | `/retro` çalıştırdıktan sonra retro-hatırlatıcı phase sayacını sıfırlar (tur başına RETRO-DUE dürtmesini temizler). |
| `harnessed install <isim>` | Upstream manifest'i kurar |
| `harnessed uninstall [isim]` | Ters kaldırma |
| `harnessed backup` | Anlık görüntü yedek yönetimi |
| `harnessed rollback <zaman_damgası>` | Tek satır geri alma (EOL koruma + sha1 doğrulama) |
| `harnessed gc` | Süresi dolmuş yedekleri temizler |
| `harnessed audit-log` | Yönlendirme şeffaflık günlüğü sorgusu (`--filter` jq ifadesini destekler) |

### Bayraklar

> Tüm komutlar varsayılan olarak **uygular (anlık yazma)** — bayrak gerekmez. İleri kullanıcılar önizleme için `--dry-run` ekleyebilir.

| Bayrak | Açıklama |
| ---- | ---- |
| `--dry-run` | Diske yazmadan önizle (ileri kullanıcı isteğe bağlı) |
| `--non-interactive` | CI / betiklenmiş senaryolar |
| `--system` | L4 global kuruluma izin ver (aksi takdirde L1 npx geçici olarak düşürülür) |
| `--yes` | Kaldırmada (uninstall) etkileşimli onayı atla |
| `--full-diff` | 200 satırın üzerinde katlanan farkları genişlet |
| `--no-color` | Rengi zorla kapat (TTY'de bile) |
| `--task <text>` | `run` — görev açıklaması (workflow `gateContext.task` olarak iletilir) |
| `--task-stdin` | `run` — görev açıklamasını stdin'den EOF'a kadar oku (tırnak/$/` shell escape'inden kaçınır) |


---

## ❓ SSS

<details>
<summary><b>S1. harnessed kurduktan sonra superpowers / gstack / GSD upstream'lerini de ayrıca kurmam gerekiyor mu?</b></summary>

<br>

Evet, ancak **kullanıcı deneyimi = tek komut**:

```bash
harnessed setup  # gstack + GSD + superpowers + planning-with-files'ı otomatik kurar; 26 workflow skill ~/.claude/skills/'e iner + Agent Teams ortam değişkeni ~/.claude.json'a otomatik yazılır
```

`brew install <formula>`'nın tam bağımlılık kümesini çektiğini düşünün — her bağımlılık için ayrı ayrı `brew install` yapmanıza gerek yoktur.

</details>

<details>
<summary><b>S2. Neden superpowers / gstack'i harnessed repo'suna vendor etmiyorsunuz?</b></summary>

<br>

4 neden:

1. **Farklılaşma felsefesi** — harnessed, "hepsi bir arada kendi yapımı" kampına karşı konumlandırılmış "assembly-ist paket yöneticisi"dir. Vendor etmek = kaldıraç noktasını kaybetmek → bir plugin paketi daha olmak
2. **Lisans + atıf kabusu** — aktif olarak geliştirilen 4-5 upstream'i vendor etmek = karmaşık bir lisans yaması
3. **Upstream yükseltmeleri yön tersine çevirir** — mevcut manifest tanımı, upstream yükseltildiğinde kullanıcıların yeniden kurarak en son sürümü almasını sağlar; vendor etmek manuel kod senkronizasyonunu zorlar ve sürekli geride kalır
4. **Tek kişi riski (bus factor 1)** — 4-5 vendor edilmiş upstream'i senkronize tutan tek bir geliştirici = hızlanmış tükenmişlik

</details>

<details>
<summary><b>S3. gstack / GSD / superpowers hepsi plan/discuss araçları gibi görünüyor — örtüşmüyor mu?</b></summary>

<br>

**Hayır**. Bunlar üç katmanlı yığının farklı aşamalarıdır:

| Aşama | Upstream | Sorumluluk |
| ---- | ---- | ---- |
| Governance | gstack | Çok-rol karar kapıları (CEO / EM / Designer / Paranoid Engineer) |
| Brainstorming | superpowers | Subtask tasarım açıklaması, alternatif karşılaştırması |
| Orchestration | GSD | Üst düzey phase görev grafiği + bağımlılık analizi |
| Kalıcılaştırma | planning-with-files | `task_plan.md` / `progress.md` / `findings.md` kalıcılaştırır |

`/discuss /plan /task /verify /ship` — 5 ana, 5 aşamayı birbirine bağlar; her ana dahili olarak kendi alt-workflow'una devreder. Her aşama farklı bir şey yapar ve bir sonrakini besler. **Birleştirme yok**.

</details>

<details>
<summary><b>S4. Workflow aşamaları otomatik mi çalışır yoksa kullanıcıyı bekler mi?</b></summary>

<br>

`workflows/<isim>/SKILL.md` frontmatter'ındaki `pause` alanına bağlıdır:

- `pause: human_review` → kullanıcı onayını bekleyerek bloklar (governance kapısı / son kilit, örn. `/discuss-strategic` gstack `/office-hours` + `/plan-architecture` `/plan-eng-review` kilit kapısı)
- `pause` yok → bir sonraki aşamaya otomatik zincirler

Her aşama çıktısı `.harnessed/checkpoints/`'a yazılır; oturum kesintisinden sonra `harnessed resume` en son checkpoint'ten devam eder.

</details>

<details>
<summary><b>S5. harnessed'ın kendisi bir CC Plugin mi?</b></summary>

<br>

Karma bir yapı:

- `npx harnessed@latest setup` **Node.js CLI**'yi çalıştırır (`bin/harnessed`)
- Kurulum, **workflow skills'i** (markdown) `~/.claude/skills/`'e yükler; Claude Code çalışma zamanı tarafından yüklenir
- `/discuss` / `/plan` / `/task` / `/verify` vb. yetenek yürütmesini tetikleyen CC içindeki slash komutlarıdır
- CLI ve CC skills, `.harnessed/checkpoints/` durum dizinini paylaşır

</details>

---


## Lisans

[Apache-2.0](./LICENSE) — bkz. [NOTICE](./NOTICE) (Harness Inc. ticari marka feragatnamesi dahil)

Geliştirmeyi destekleyin: [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
