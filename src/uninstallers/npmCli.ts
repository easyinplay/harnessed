// Phase 5.2 W1 T1.2 — uninstall method 1/7: npm-cli.
// D-02: ephemeral detect (npx --yes / npx -y in install.cmd) → no-op + warn exit 0.
// Otherwise: `npm uninstall <pkg>` via direct spawn (NOT runArgs — runArgs prefixes 'claude').

import { spawn } from 'node:child_process'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

export const uninstallNpmCli: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'npm-cli') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  // D-02: ephemeral detect — npx --yes / npx -y means runtime-only, nothing to uninstall.
  if (/\bnpx\s+(--yes|-y)\b/.test(install.cmd)) {
    const name = ctx.manifest.metadata.name
    console.warn(
      `ephemeral install: nothing to uninstall ('${name}' uses 'npx --yes' runtime-only invocation; no persistent install to remove)`,
    )
    return { ok: true, removedPaths: [] }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  // Extract package name from install.cmd (e.g. "npm install -g ctx7" → "ctx7")
  const m = install.cmd.match(/npm\s+(?:install|i)\s+(?:-g\s+)?(\S+)/)
  const pkg = m?.[1] ?? ctx.manifest.metadata.upstream.source

  const isWin = process.platform === 'win32'
  const result = await new Promise<{ exitCode: number; stderr: string }>((resolve) => {
    const child = isWin
      ? spawn('cmd.exe', ['/c', 'npm', 'uninstall', '-g', pkg], { windowsHide: true })
      : spawn('npm', ['uninstall', '-g', pkg], { shell: false })
    let stderr = ''
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout]` })
    }, 30_000)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: e.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr })
    })
  })

  if (result.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      error: `npm uninstall exited ${result.exitCode}: ${result.stderr.slice(0, 200)}`,
    }
  }
  return { ok: true, removedPaths: [pkg] }
}
