---
name: karpathy-baseline
description: |
  ALWAYS apply Karpathy 4 心法 baseline to every coding decision: Think Before Coding /
  Simplicity First (YAGNI) / Surgical Changes / Goal-Driven Execution. Cross-cutting
  always-on heuristics — applies to ALL coding tasks regardless of language, framework,
  or phase. Source: andrej-karpathy-skills (forrestchang, MIT) — distilled.
source: github.com/forrestchang/andrej-karpathy-skills
license: MIT
version: 1.0.0
upstream: https://github.com/forrestchang/andrej-karpathy-skills
---

# Karpathy Baseline (心法 always-on)

**ALWAYS apply these 4 心法 to every coding decision in this session.** This skill is
cross-cutting baseline behavior, not an opt-in tool — invoke implicitly on every
implementation task, design decision, edit, and verification step.

## 1. Think Before Coding

先思考再写。 对新功能 / 陌生代码先 read + understand,禁止"看着改"。
- 触发:每次 implementation task。
- 反模式:直接动键盘改文件 / 不读 caller 就改 callee / 不读 schema 就动 data。
- 落地:先用 Read / Grep 拿到 ≥3 个 anchor 文件 + 1 个 caller path,再动 Edit。

## 2. Simplicity First (YAGNI)

最小有效代码。 不预先抽象、不预先加灵活性、不堆装配。
- 触发:每次 design decision。
- 反模式:preemptive abstraction / N×M 候选矩阵 / 多 layer of indirection。
- 落地:写最 dumb 的 working version 先,refactor 推后到第 2 caller 出现。

## 3. Surgical Changes

小步原子修改。 一次只改一个意图,git commit 历史保持线性可 revert。
- 触发:每次 edit。
- 反模式:mixed-concern commit / 连 refactor 带 feature / 顺手清理 unrelated code。
- 落地:每个 commit 一个 type(feat / fix / refactor / docs)+ 一个 scope + ≤200L diff。

## 4. Goal-Driven Execution

始终回到目标。 写代码前问"这一步要达到什么",写完问"达到了吗"。
- 触发:每个子任务起点 + 终点。
- 反模式:side quest / yak shaving / 跑偏到 unrelated refactor。
- 落地:开头复述 task goal,结尾对照 acceptance criteria 逐条 verify。

---

*Source distilled from forrestchang/andrej-karpathy-skills (MIT). Phase 2.3 D-02 SKILL-ONLY injection (NOT CLAUDE.md sed). T0.10 fallback path: description-keyword + self-reflexive prompt discovery (SDK 0.3.142 `skillFrontmatter` extracts only name/source/tokens — no `always_active` field support).*
