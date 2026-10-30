import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { acquireUpdateLock } from '../../src/cli/lib/updateLock.js'

describe('update lock process races', () => {
  let root: string
  let worker: string
  const children: ChildProcess[] = []

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'harnessed-update-race-'))
    worker = join(root, 'lock-worker.cjs')
    await build({
      stdin: {
        resolveDir: resolve('.'),
        contents: `import { acquireUpdateLock, consumeUpdateLockContinuation } from './src/cli/lib/updateLock.ts';
          if (process.argv[4]) {
            consumeUpdateLockContinuation({stateRoot: process.argv[3], target: process.argv[2], ...JSON.parse(process.argv[4])}).then(result => {
              process.stdout.write(JSON.stringify({status: result.ok ? 'consumed' : result.reason}) + '\\n');
              if (result.ok) process.stdin.resume();
            }).catch(error => { console.error(error); process.exitCode = 1; });
          } else {
          acquireUpdateLock({stateRoot: process.argv[3], target: process.argv[2], staleAfterMs: 1000}).then(result => {
            process.stdout.write(JSON.stringify({status: result.status}) + '\\n');
            if (result.status === 'acquired') process.stdin.on('data', () => result.lock.release().then(() => process.exit(0)));
          }).catch(error => { console.error(error); process.exitCode = 1; });
          }`,
      },
      outfile: worker,
      bundle: true,
      platform: 'node',
      format: 'cjs',
    })
  })

  afterEach(async () => {
    await Promise.all(
      children.splice(0).map(async (child) => {
        if (child.exitCode !== null || child.signalCode !== null) return
        const exited = once(child, 'close')
        child.kill()
        await exited
      }),
    )
    await rm(root, { recursive: true, force: true })
  })

  function contender(
    target: string,
    stateRoot: string,
    continuation?: { nonce: string; targetKey: string; protocolVersion: number },
  ) {
    const args = [worker, target, stateRoot]
    if (continuation) args.push(JSON.stringify(continuation))
    const child = spawn(process.execPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    children.push(child)
    const ready = new Promise<string>((resolveReady, reject) => {
      let output = ''
      child.stdout.on('data', (chunk) => {
        output += chunk.toString()
        if (output.includes('\n')) resolveReady(JSON.parse(output.trim()).status)
      })
      child.once('error', reject)
      child.once('close', () => {
        if (!output) reject(new Error('lock worker exited without a result'))
      })
    })
    return { child, ready }
  }

  it('has one winner across independent processes and host roots', async () => {
    const target = join(root, 'harnessed.exe')
    const contenders = Array.from({ length: 8 }, (_, index) =>
      contender(target, join(root, `host-${index}`)),
    )
    const statuses = await Promise.all(contenders.map((entry) => entry.ready))
    expect(statuses.filter((status) => status === 'acquired')).toHaveLength(1)
    expect(statuses.filter((status) => status === 'busy')).toHaveLength(7)
  })

  it('protects live P2 after P1 crashes and recovers only after P2 dies and goes stale', async () => {
    const target = join(root, 'harnessed.exe')
    const owner = contender(target, join(root, 'claude'))
    expect(await owner.ready).toBe('acquired')
    const path = `${target}.harnessed-update-anchor.json`
    const grant = JSON.parse(await readFile(path, 'utf8'))
    const p2 = contender(target, join(root, 'claude'), {
      protocolVersion: grant.protocolVersion,
      targetKey: grant.targetKey,
      nonce: grant.nonce,
    })
    expect(await p2.ready).toBe('consumed')
    const transferred = JSON.parse(await readFile(path, 'utf8'))
    expect(transferred.ownerPid).toBe(p2.child.pid)

    const ownerExited = once(owner.child, 'close')
    owner.child.kill()
    await ownerExited
    await expect(
      acquireUpdateLock({
        stateRoot: join(root, 'codex'),
        target,
        now: () => transferred.heartbeatAt + 600_000,
      }),
    ).resolves.toMatchObject({ status: 'busy', ownerPid: p2.child.pid })

    const p2Exited = once(p2.child, 'close')
    p2.child.kill()
    await p2Exited
    await expect(
      acquireUpdateLock({
        stateRoot: join(root, 'codex'),
        target,
        now: () => transferred.heartbeatAt + 1000,
      }),
    ).resolves.toMatchObject({ status: 'busy', ownerPid: p2.child.pid })
    const recovered = await acquireUpdateLock({
      stateRoot: join(root, 'codex'),
      target,
      now: () => transferred.heartbeatAt + 600_000,
    })
    expect(recovered.status).toBe('acquired')
    if (recovered.status === 'acquired') await recovered.lock.release()
  })

  it('recovers a crashed owner and a crashed metadata guard without removing a fresh owner', async () => {
    const target = join(root, 'harnessed.exe')
    const owner = contender(target, join(root, 'claude'))
    expect(await owner.ready).toBe('acquired')
    const exited = once(owner.child, 'close')
    owner.child.kill()
    await exited
    const recovered = await acquireUpdateLock({
      stateRoot: join(root, 'codex'),
      target,
      now: () => Date.now() + 600_000,
    })
    expect(recovered.status).toBe('acquired')
    if (recovered.status !== 'acquired') return
    await recovered.lock.release()
    const guard = recovered.lock.path.replace(/\.json$/, '.lock')
    await mkdir(guard)
    const { utimes } = await import('node:fs/promises')
    await utimes(guard, new Date(0), new Date(0))
    const fresh = await acquireUpdateLock({ stateRoot: root, target })
    expect(fresh.status).toBe('acquired')
    if (fresh.status === 'acquired') {
      expect(await contender(target, join(root, 'claude')).ready).toBe('busy')
      await fresh.lock.release()
    }
  })
})
