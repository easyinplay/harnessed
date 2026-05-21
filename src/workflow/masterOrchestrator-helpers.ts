// masterOrchestrator-helpers.ts — v3.1.0 split from masterOrchestrator.ts (karpathy ≤200L hard
// limit per project memory). Houses default spawn driver + pause hook + path resolver.
//
// Sister masterOrchestrator.ts orchestration core stays focused on:gate eval + serial/parallel
// split + arbitrate + spawn loop。Default IO helpers (fs spawn driver / stdin pause prompt /
// yaml path resolver) live here for test DI override clarity。

import { resolve } from 'node:path'
import type { MasterName, SpawnDriver } from './masterOrchestrator.js'
import { runWorkflow } from './run.js'

/** v3.1.0 — Super-master `/auto` 走 top-level standalone `workflows/auto/workflow.yaml`
 *  (sister research/retro layout); 4 stage-master 仍 走 `workflows/<name>/auto/workflow.yaml`。 */
export function resolveMasterYamlPath(masterName: MasterName, packageRoot: string): string {
  return masterName === 'auto'
    ? resolve(packageRoot, 'workflows', 'auto', 'workflow.yaml')
    : resolve(packageRoot, 'workflows', masterName, 'auto', 'workflow.yaml')
}

/** v3.1.0 — Super-master `/auto` recursive spawn: sub ∈ {discuss,plan,task,verify} spawn to
 *  stage-master `workflows/<sub>/auto/workflow.yaml` (一层抽象 verbatim); 其他 master spawn to
 *  `workflows/<masterName>/<subName>/workflow.yaml` (原 sub-workflow 行为)。 */
export function resolveSubYamlPath(
  masterName: MasterName,
  subName: string,
  packageRoot: string,
): string {
  return masterName === 'auto'
    ? resolve(packageRoot, 'workflows', subName, 'auto', 'workflow.yaml')
    : resolve(packageRoot, 'workflows', masterName, subName, 'workflow.yaml')
}

export const defaultSpawnDriver: SpawnDriver = async (
  masterName,
  subName,
  _context,
  packageRoot,
) => {
  const subYamlPath = resolveSubYamlPath(masterName, subName, packageRoot)
  // Path A — SDK query recursive call runWorkflow at sub yaml(in-process)。
  // K8:engine 共享 1 context snapshot,passed unchanged(`gateContext`)。
  // Path B fallback hook:try/catch SDK error → sub-shell `harnessed` CLI invoke。
  try {
    await runWorkflow(subYamlPath, {}, { packageRoot, gateContext: _context })
  } catch (err) {
    // Path B sub-shell fallback(sister Phase 2.5 W2.3 error 降级 pattern)
    // — T3.5.W2.1 dogfood LOCK 时收紧 cmd surface;v3.0 default 仅记 warn 不真 exec
    // sub-shell(避免 spawn 调用栈 unintended side-effect)。
    console.warn(
      `⚠️ master spawnSubWorkflow Path A failed for ${masterName}/${subName} ` +
        `(${(err as Error).message});Path B sub-shell fallback deferred T3.5.W2.1.`,
    )
  }
}

/** v3.1.0 — Default pause hook: prompt user via stdin to confirm continuation between stages
 *  (super-master `/auto --pause-between-stages` opt-in). Test DI override via opts.pauseFn。 */
export const defaultPauseFn = async (stageName: string): Promise<void> => {
  const readline = await import('node:readline/promises')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    await rl.question(
      `\n[--pause-between-stages] Stage '${stageName}' complete. Press Enter to continue (Ctrl+C to abort)... `,
    )
  } finally {
    rl.close()
  }
}
