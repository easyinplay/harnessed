// chrome-devtools provider probe — the availability answer behind the
// `chrome_devtools_available` gate fact and the doctor `ecc` check.
//
// The defect being locked down: workflows/capabilities.yaml and
// workflows/judgments/web-testing-routing.yaml both declared 「两者都缺时本
// capability 不可用」 and NOTHING evaluated it, so verify/qa phase 05 fired on
// machines with zero providers. These tests pin the three registration forms, the
// either/or semantics, and — most importantly — the documented direction for an
// UNKNOWN answer (a faulted probe must NOT delete the lane).

import { describe, expect, it } from 'vitest'
import {
  CHROME_DEVTOOLS_ENABLE_PATHS,
  CHROME_DEVTOOLS_MCP_NAME,
  chromeDevtoolsAvailable,
  chromeDevtoolsFactSource,
  ECC_PLUGIN_NAME,
  isChromeDevtoolsAvailable,
  probeChromeDevtools,
} from '../../src/cli/lib/probe-chrome-devtools.js'

/** Deps stub: a registration exists iff its name is in the given set. */
function registry(plugins: string[] = [], mcpServers: string[] = []) {
  return {
    pluginRegistered: async (n: string) => plugins.includes(n),
    mcpServerRegistered: async (n: string) => mcpServers.includes(n),
  }
}

const THROWS = {
  pluginRegistered: async () => {
    throw new Error('EACCES: permission denied, open ~/.claude/plugins/installed_plugins.json')
  },
  mcpServerRegistered: async () => {
    throw new Error('EACCES: permission denied, open ~/.claude.json')
  },
}

describe('probeChromeDevtools — either/or provider detection', () => {
  it('both providers absent → not available, and the reason names BOTH enable paths', async () => {
    const p = await probeChromeDevtools(registry())
    expect(p.ecc).toBe(false)
    expect(p.standalonePlugin).toBe(false)
    expect(p.standaloneStdio).toBe(false)
    expect(p.unknown).toBe(false)
    expect(p.providers).toEqual([])
    expect(chromeDevtoolsAvailable(p)).toBe(false)

    // A skip with no remedy is the silent-capability-loss defect itself.
    const reason = chromeDevtoolsFactSource(p)
    expect(reason).toContain('NO chrome-devtools provider registered')
    expect(reason).toContain('harnessed install ecc')
    expect(reason).toContain('claude mcp add chrome-devtools-mcp')
  })

  it('ecc plugin present → available (chrome-devtools is ECC’s only default MCP)', async () => {
    const p = await probeChromeDevtools(registry([ECC_PLUGIN_NAME]))
    expect(p.ecc).toBe(true)
    expect(chromeDevtoolsAvailable(p)).toBe(true)
    expect(chromeDevtoolsFactSource(p)).toContain('ecc plugin')
  })

  it('standalone stdio server only (self-install manifest, no ecc) → available', async () => {
    const p = await probeChromeDevtools(registry([], [CHROME_DEVTOOLS_MCP_NAME]))
    expect(p.ecc).toBe(false)
    expect(p.standaloneStdio).toBe(true)
    expect(chromeDevtoolsAvailable(p)).toBe(true)
    expect(chromeDevtoolsFactSource(p)).toContain('stdio MCP server')
  })

  it('standalone official plugin only (no ecc) → available', async () => {
    const p = await probeChromeDevtools(registry([CHROME_DEVTOOLS_MCP_NAME]))
    expect(p.ecc).toBe(false)
    expect(p.standalonePlugin).toBe(true)
    expect(chromeDevtoolsAvailable(p)).toBe(true)
  })

  it('both providers present → available, both reported (the doctor dual-install warn feeds off this)', async () => {
    const p = await probeChromeDevtools(registry([ECC_PLUGIN_NAME], [CHROME_DEVTOOLS_MCP_NAME]))
    expect(p.ecc).toBe(true)
    expect(p.standaloneStdio).toBe(true)
    expect(p.providers).toHaveLength(2)
  })
})

describe('probeChromeDevtools — UNKNOWN falls to AVAILABLE (documented direction)', () => {
  it('a throwing probe never propagates; it records unknown', async () => {
    const p = await probeChromeDevtools(THROWS)
    expect(p.unknown).toBe(true)
    expect(p.providers).toEqual([])
  })

  it('unknown resolves to available — a fault must NOT silently delete the lane', async () => {
    // ADR-0038 fails CLOSED on an undefined BARE VARIABLE (a static config bug).
    // A failed filesystem probe is an OPERATIONAL fault, where ADR-0029 fail-soft
    // and src/workflow/skipGate.ts's "never silently REMOVE a declared step" apply.
    expect(chromeDevtoolsAvailable(await probeChromeDevtools(THROWS))).toBe(true)
    expect(await isChromeDevtoolsAvailable(THROWS)).toBe(true)
  })

  it('the unknown reason says the probe faulted AND still lists both enable paths', async () => {
    const reason = chromeDevtoolsFactSource(await probeChromeDevtools(THROWS))
    expect(reason).toContain('FAULTED')
    expect(reason).toContain('harnessed install ecc')
    expect(reason).toContain('claude mcp add chrome-devtools-mcp')
  })

  it('one probe faulting does not erase a provider the other one found', async () => {
    const p = await probeChromeDevtools({
      pluginRegistered: async (n: string) => n === ECC_PLUGIN_NAME,
      mcpServerRegistered: THROWS.mcpServerRegistered,
    })
    expect(p.ecc).toBe(true)
    expect(p.unknown).toBe(true)
    expect(chromeDevtoolsAvailable(p)).toBe(true)
    // A found provider is a definite answer — no need to spam the enable paths.
    expect(chromeDevtoolsFactSource(p)).toContain('ecc plugin')
  })
})

describe('CHROME_DEVTOOLS_ENABLE_PATHS — the single verbatim remedy string', () => {
  it('names both providers and warns against installing both', () => {
    expect(CHROME_DEVTOOLS_ENABLE_PATHS).toContain('harnessed install ecc')
    expect(CHROME_DEVTOOLS_ENABLE_PATHS).toContain('claude mcp add chrome-devtools-mcp')
    expect(CHROME_DEVTOOLS_ENABLE_PATHS).toMatch(/ONE/)
  })
})
