// src/cli/lib/probe-chrome-devtools.ts — chrome-devtools MCP provider availability.
//
// THE DEFECT THIS CLOSES. workflows/capabilities.yaml said 「两者都缺时本 capability
// 不可用」 and workflows/judgments/web-testing-routing.yaml said the same in its
// trigger description — and NOTHING evaluated either sentence. chrome-devtools has
// two possible providers and BOTH are optional, so on a machine with neither the
// verify/qa `05-perf-a11y-diagnostic` lane still fired and pointed the model at a
// tool that does not exist. This module is the ONE probe that both the gate fact
// (`harnessed facts` → `chrome_devtools_available`) and the doctor `ecc` check
// read, so the runtime and the health report can never disagree about it.
//
// PROVIDERS (either/or — 4.32.22 final):
//   1. the `ecc` plugin — ECC's ONLY default MCP connector IS chrome-devtools
//      (ECC 2.1.0's `.mcp.json` declares exactly one server:
//      `npx -y chrome-devtools-mcp@latest`).
//   2. a standalone chrome-devtools-mcp registration — either the official CC
//      plugin (`chrome-devtools-mcp@claude-plugins-official`) or the stdio
//      `mcpServers` entry written by manifests/optional/chrome-devtools-mcp.yaml.
// src/cli/lib/check-ecc.ts already probed forms 2 and 3 for its dual-install warn;
// those probes MOVED here so there is exactly one definition of "a standalone
// chrome-devtools is registered" rather than two that can drift.
//
// UNKNOWN FALLS TO *AVAILABLE* (documented direction, deliberately NOT ADR-0038's).
// A probe that throws (EACCES on ~/.claude.json, an unreadable plugin registry)
// resolves to `unknown: true`, and `chromeDevtoolsAvailable()` then returns TRUE.
// Why this way round:
//   - ADR-0038 fails CLOSED on an UNDEFINED BARE VARIABLE. That is a STATIC config
//     bug (expression ↔ gate-context drift) where firing anyway made the most
//     expensive sub the default path — a different failure class from a failed
//     filesystem read.
//   - A failed probe is an OPERATIONAL fault, and for those the repo's rule is
//     ADR-0029 fail-soft plus src/workflow/skipGate.ts's invariant: on a broken
//     config harnessed never does MORE than asked and NEVER silently REMOVES a
//     declared step. Resolving unknown → false would delete a declared diagnostic
//     capability with no signal — the exact defect this module exists to fix, only
//     inverted.
// So: definitely-absent → false (skip, and say why, naming both enable paths);
// cannot tell → true (run, and say the probe faulted).

import { isMcpServerRegistered, isPluginRegistered } from '../../installers/lib/readClaudeConfig.js'

/** MCP server / official-plugin registration name (manifests/optional/chrome-devtools-mcp.yaml). */
export const CHROME_DEVTOOLS_MCP_NAME = 'chrome-devtools-mcp'

/** Marketplace plugin name probed by check-ecc (`ecc@ecc` → left-of-`@` is `ecc`). */
export const ECC_PLUGIN_NAME = 'ecc'

/** BOTH enable paths, verbatim. Every message that reports the diagnostic lane off
 *  must carry this — a skip without a remedy is the silent-capability-loss defect. */
export const CHROME_DEVTOOLS_ENABLE_PATHS =
  'enable EITHER provider: (1) install the ecc plugin (`harnessed install ecc` — chrome-devtools is its only default MCP connector), OR (2) self-install the standalone server (`claude mcp add chrome-devtools-mcp`, manifests/optional/chrome-devtools-mcp.yaml). Install exactly ONE — both at once creates same-name dual-prefix tool-call ambiguity (the doctor `ecc` check warns on the leftover).'

export interface ChromeDevtoolsProbe {
  /** `ecc` plugin registered (brings the chrome-devtools connector with it). */
  ecc: boolean
  /** official `chrome-devtools-mcp@claude-plugins-official` plugin registered. */
  standalonePlugin: boolean
  /** `chrome-devtools-mcp` stdio entry in the harness `mcpServers` config. */
  standaloneStdio: boolean
  /** true ⇒ at least one probe threw; availability is UNKNOWN, never a plain false. */
  unknown: boolean
  /** Human-readable list of the providers actually found (empty when none). */
  providers: string[]
}

/** Injectable probes (sister probe-gstack.ts `ProbeGstackDeps`) — tests pin these
 *  instead of reaching for a module-factory mock. */
export interface ChromeDevtoolsProbeDeps {
  pluginRegistered: (name: string) => Promise<boolean>
  mcpServerRegistered: (name: string) => Promise<boolean>
}

const DEFAULT_DEPS: ChromeDevtoolsProbeDeps = {
  pluginRegistered: isPluginRegistered,
  mcpServerRegistered: isMcpServerRegistered,
}

/** Run one probe; a throw records the fault and contributes `false` to the
 *  provider set (the fault is carried separately as `unknown`, so the caller can
 *  still tell "no provider" apart from "could not look"). */
async function probeOne(fn: () => Promise<boolean>, onFault: () => void): Promise<boolean> {
  try {
    return await fn()
  } catch {
    onFault()
    return false
  }
}

/** NEVER throws — see the module header on the unknown direction. */
export async function probeChromeDevtools(
  deps: Partial<ChromeDevtoolsProbeDeps> = {},
): Promise<ChromeDevtoolsProbe> {
  const d = { ...DEFAULT_DEPS, ...deps }
  let unknown = false
  const fault = (): void => {
    unknown = true
  }
  const ecc = await probeOne(() => d.pluginRegistered(ECC_PLUGIN_NAME), fault)
  const standalonePlugin = await probeOne(() => d.pluginRegistered(CHROME_DEVTOOLS_MCP_NAME), fault)
  const standaloneStdio = await probeOne(
    () => d.mcpServerRegistered(CHROME_DEVTOOLS_MCP_NAME),
    fault,
  )

  const providers: string[] = []
  if (ecc) providers.push('ecc plugin')
  if (standalonePlugin) providers.push(`${CHROME_DEVTOOLS_MCP_NAME}@claude-plugins-official plugin`)
  if (standaloneStdio) providers.push(`${CHROME_DEVTOOLS_MCP_NAME} stdio MCP server`)

  return { ecc, standalonePlugin, standaloneStdio, unknown, providers }
}

/** true when a provider exists OR the probe could not tell (unknown → available). */
export function chromeDevtoolsAvailable(p: ChromeDevtoolsProbe): boolean {
  return p.providers.length > 0 || p.unknown
}

/** Convenience one-shot for callers that only want the boolean gate fact. */
export async function isChromeDevtoolsAvailable(
  deps?: Partial<ChromeDevtoolsProbeDeps>,
): Promise<boolean> {
  return chromeDevtoolsAvailable(await probeChromeDevtools(deps))
}

/** Provenance line for the `chrome_devtools_available` derived fact — and the
 *  skip reason when the diagnostic lane does not run. Names BOTH enable paths in
 *  the not-available and probe-faulted branches. */
export function chromeDevtoolsFactSource(p: ChromeDevtoolsProbe): string {
  if (p.providers.length > 0) {
    return `chrome-devtools provider registered: ${p.providers.join(' + ')}`
  }
  if (p.unknown) {
    return (
      'chrome-devtools provider probe FAULTED (unreadable plugin registry / MCP config) — ' +
      'availability unknown, reported true so the perf / a11y / memory diagnostic lane is ' +
      `never silently deleted (ADR-0029 fail-soft). To make it definite, ${CHROME_DEVTOOLS_ENABLE_PATHS}`
    )
  }
  return (
    'NO chrome-devtools provider registered — the verify-qa `05-perf-a11y-diagnostic` lane ' +
    '(perf / a11y / memory, judgments.web-testing-routing.chrome-devtools-mcp-diagnostic.fires) ' +
    `will NOT run. To turn it on, ${CHROME_DEVTOOLS_ENABLE_PATHS}`
  )
}
