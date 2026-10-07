// `harnessed agents-md` —— 把 harnessed 自己那段写进 `<CODEX_HOME>/AGENTS.md` 的标记区间。
//
// opt-in 的实现方式就是「它是一个要你自己敲的命令」:setup 不会顺手写 AGENTS.md。
// 那是维护者的个人指令文件,harnessed 只在被明确要求时碰它,而且只碰标记区间内。
//
// codex-only,且是**诚实拒绝**而非假装成功:claude 上没有 AGENTS.md 这个加载契约,
// 悄悄写一个文件在那儿只会制造一份没人读的副本(与 `stop-hook-recover` 在 codex 上
// 返回 harness-mismatch 同一个姿态,ADR 0041 § Consequences)。
//
// 退出码:0 = 写了 / 无变化 / 预览 / 移除;1 = 宿主不符或写入失败。

import { join } from 'node:path'
import type { Command } from 'commander'
import { getLocale } from '../i18n/index.js'
import { getAssetsRoot } from '../platform/assetsRoot.js'
import { detectPlatform } from '../platform/platform.js'
import { runAgentsMd } from './lib/agentsMd.js'

export function registerAgentsMd(program: Command): void {
  program
    .command('agents-md')
    .description(
      'Write the harnessed block into <CODEX_HOME>/AGENTS.md (marker-delimited, idempotent) — ' +
        'command list + host-primitive glossary, all derived; your own prose outside the markers is untouched',
    )
    .option('--dry-run', 'print what would be written; touch nothing')
    .option('--remove', 'strip the harnessed block (leaves the rest of the file alone)')
    .action(async (raw: { dryRun?: boolean; remove?: boolean }) => {
      const platform = detectPlatform()
      if (platform.id !== 'codex') {
        // The advice names HARNESSED_PLATFORM, not `--platform`: this command has no such
        // flag (only setup / check-docs / inject-state do), and pointing someone at an
        // option that does not exist is worse than giving no advice at all.
        console.error(
          `harness-mismatch: AGENTS.md is codex's session-start contract; this process resolved to ` +
            `'${platform.id}'. Nothing written — run this from codex, or force the host with ` +
            `HARNESSED_PLATFORM=codex, because a copy nobody reads is worse than no copy.`,
        )
        process.exitCode = 1
        return
      }
      const locale = getLocale()
      try {
        const r = await runAgentsMd({
          workflowsDir: join(getAssetsRoot(), 'workflows'),
          dryRun: raw.dryRun === true,
          remove: raw.remove === true,
          locale: locale === 'zh-Hans' ? 'zh-Hans' : 'en',
        })
        switch (r.status) {
          case 'preview':
            console.log(r.section.trimEnd())
            console.log(
              `\n[dry-run] would ${r.action} the block above in ${r.path}. ` +
                'Nothing outside the markers is touched.',
            )
            break
          case 'written':
            console.log(
              `${r.action === 'replace' ? 'refreshed' : 'wrote'} the harnessed block in ${r.path}`,
            )
            break
          case 'removed':
            console.log(`removed the harnessed block from ${r.path}`)
            break
          case 'unchanged':
            console.log(`${r.path} already up to date — nothing to do`)
            break
          case 'absent':
            console.log(`${r.path} does not exist — nothing to remove`)
            break
        }
      } catch (e) {
        console.error(`agents-md failed: ${(e as Error).message}`)
        process.exitCode = 1
      }
    })
}
