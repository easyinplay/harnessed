// v16.0 Phase 65 T8 NEW — the RUNTIME hook for the `{{ host.* }}` family.
//
// Three surfaces carry host primitives, each with its own host question:
//   S1 workflows/**/SKILL.md      → ./renderSkillTemplates.ts — host = install TARGET
//   S2 <home>/commands/<x>.md     → ./generateCommands.ts     — host = install TARGET
//   S3 the spawn prompt           → THIS module               — host = what we RUN under
//
// S3 is `workflows/role-prompts{,.zh-Hans}.yaml` reaching a subagent through
// `buildAgentDef`, from `harnessed prompt <sub>` (main-session spawn) and from
// `harnessed run` (SDK spawn). Both entry points resolve the table here so the
// fail-soft policy lives in one place instead of being restated at each caller.
//
// Fail-soft, unlike S1/S2: those render at INSTALL time, where a throw is a
// loud, fixable, pre-delivery failure. S3 renders mid-session — aborting a run
// because one table cell is missing is worse than handing the subagent the
// un-substituted sentence, which is still the (claude) wording it had before
// Phase 65. The warning goes to stderr so `harnessed prompt`'s stdout stays a
// clean prompt for the caller to pipe.

import type { SupportedLocale } from '../../i18n/index.js'
import { mapRolePromptsText, type RolePrompt } from '../../workflow/rolePrompts.js'
import { type HostId, loadHostPrimitivesCached, renderHostPrimitives } from './hostPrimitives.js'

/** Inputs for {@link renderRolePromptsForHost}. */
export interface RolePromptHostRenderOptions {
  /** The `workflows/` tree holding `host-primitives{,.<locale>}.yaml`. */
  workflowsDir: string
  /** The harness this process is running under (`toHostId(detectPlatform().id)`). */
  host: HostId
  /** Locale of the already-loaded registry — the table must match it. */
  locale: SupportedLocale
}

/**
 * Resolve every `{{ host.* }}` in a role-prompt registry's PROMPT-BODY fields.
 *
 * Returns a new registry; the input is untouched. `description` is not rendered
 * — see `mapRolePromptsText` for why (it is the one field the install surface
 * emits as raw yaml frontmatter).
 */
export async function renderRolePromptsForHost(
  prompts: Record<string, RolePrompt>,
  opts: RolePromptHostRenderOptions,
): Promise<Record<string, RolePrompt>> {
  try {
    const table = await loadHostPrimitivesCached({
      workflowsDir: opts.workflowsDir,
      locale: opts.locale,
    })
    return mapRolePromptsText(prompts, (body) =>
      renderHostPrimitives(body, { host: opts.host, table }),
    )
  } catch (err) {
    console.error(
      `⚠️ host-primitive render failed (${(err as Error).message}); ` +
        'using the raw role-prompt text (ADR 0029 fail-soft).',
    )
    return prompts
  }
}
