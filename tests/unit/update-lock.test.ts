import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  acquireUpdateLock,
  consumeUpdateLockContinuation,
  UPDATE_LOCK_PROTOCOL_VERSION,
  updateTargetKey,
  withUpdateLock,
} from '../../src/cli/lib/updateLock.js'

async function stateRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'harnessed-update-lock-'))
}

describe('update lock ownership', () => {
  it('keeps the package anchor outside the replaceable package and shares entry aliases', async () => {
    const root = await stateRoot()
    const packageRoot = join(root, 'node_modules', 'harnessed')
    await mkdir(join(packageRoot, 'dist'), { recursive: true })
    await writeFile(join(packageRoot, 'package.json'), JSON.stringify({ name: 'harnessed' }))
    await writeFile(join(packageRoot, 'dist', 'cli.mjs'), '')
    await writeFile(join(packageRoot, 'dist', 'other.mjs'), '')
    const entry = join(packageRoot, 'dist', 'cli.mjs')
    const first = await acquireUpdateLock({ stateRoot: root, target: entry })
    if (first.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      expect(updateTargetKey(entry)).toBe(updateTargetKey(join(packageRoot, 'dist', 'other.mjs')))
      expect(first.lock.path.startsWith(`${packageRoot.toLowerCase()}\\`)).toBe(false)
      await rm(join(packageRoot, 'dist'), { recursive: true })
      await mkdir(join(packageRoot, 'dist'))
      await writeFile(entry, 'new')
      expect((await acquireUpdateLock({ stateRoot: 'other-host', target: entry })).status).toBe(
        'busy',
      )
    } finally {
      await first.lock.release()
    }
  })

  it('serializes stale decisions with a competing recovery, without moving the new owner', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const old = await acquireUpdateLock({ stateRoot: root, target, now: () => 0 })
    if (old.status !== 'acquired') throw new Error('fixture lock missing')
    let competitor: ReturnType<typeof acquireUpdateLock> | undefined
    const recovered = await acquireUpdateLock({
      stateRoot: root,
      target,
      now: () => 10_000,
      staleAfterMs: 1000,
      isProcessAlive: () => {
        competitor = acquireUpdateLock({
          stateRoot: root,
          target,
          now: () => 10_000,
          staleAfterMs: 1000,
          isProcessAlive: () => false,
        })
        return false
      },
    })
    expect(recovered.status).toBe('acquired')
    const competing = await competitor
    if (competing?.status === 'acquired') await competing.lock.release()
    expect(competing?.status).toBe('busy')
    await old.lock.release()
    if (recovered.status === 'acquired') {
      expect(JSON.parse(await readFile(recovered.lock.path, 'utf8')).nonce).toBe(
        recovered.lock.nonce,
      )
      await recovered.lock.release()
    }
  })
  it('shares one target across Claude and Codex state roots', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const first = await acquireUpdateLock({ stateRoot: join(root, 'claude'), target })
    expect(first.status).toBe('acquired')
    try {
      const second = await acquireUpdateLock({ stateRoot: join(root, 'codex'), target })
      if (second.status === 'acquired') await second.lock.release()
      expect(second.status).toBe('busy')
    } finally {
      if (first.status === 'acquired') await first.lock.release()
    }
  })

  it('canonicalizes symlinked target ancestors before hashing and locking', async () => {
    const root = await stateRoot()
    const actual = join(root, 'actual')
    const alias = join(root, 'alias')
    await mkdir(actual)
    await symlink(actual, alias, process.platform === 'win32' ? 'junction' : 'dir')
    expect(updateTargetKey(join(alias, 'cli.mjs'))).toBe(updateTargetKey(join(actual, 'cli.mjs')))
  })

  it.each([
    { name: 'malformed JSON', contents: '{broken' },
    { name: 'null', contents: 'null' },
    { name: 'number', contents: '42' },
    { name: 'boolean', contents: 'true' },
    { name: 'string', contents: '"invalid"' },
    { name: 'array', contents: '[]' },
    { name: 'incomplete object', contents: '{}' },
    { name: 'oversize JSON', contents: JSON.stringify('x'.repeat(16 * 1024)) },
  ])('recovers stale $name records but never steals fresh ones', async ({ contents }) => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const first = await acquireUpdateLock({ stateRoot: root, target })
    if (first.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      await writeFile(first.lock.path, contents)
      expect((await acquireUpdateLock({ stateRoot: root, target })).status).toBe('busy')
      await utimes(first.lock.path, new Date(0), new Date(0))
      expect(
        (await acquireUpdateLock({ stateRoot: root, target, maxStaleRecoveries: 0 })).status,
      ).toBe('busy')
      const recovered = await acquireUpdateLock({ stateRoot: root, target })
      expect(recovered.status).toBe('acquired')
      if (recovered.status !== 'acquired') return
      await first.lock.refresh()
      await first.lock.release()
      expect(JSON.parse(await readFile(recovered.lock.path, 'utf8')).nonce).toBe(
        recovered.lock.nonce,
      )
      expect((await acquireUpdateLock({ stateRoot: root, target })).status).toBe('busy')
      await recovered.lock.release()
    } finally {
      await first.lock.release()
    }
  })

  it('allows exactly one stale-recovery winner and old handles cannot remove it', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const first = await acquireUpdateLock({ stateRoot: root, target, pid: 123, now: () => 0 })
    if (first.status !== 'acquired') throw new Error('fixture lock missing')
    const contenders = await Promise.all(
      Array.from({ length: 12 }, () =>
        acquireUpdateLock({
          stateRoot: root,
          target,
          now: () => 10_000,
          staleAfterMs: 1000,
          isProcessAlive: () => false,
        }),
      ),
    )
    const winners = contenders.filter((entry) => entry.status === 'acquired')
    expect(winners).toHaveLength(1)
    await first.lock.release()
    await first.lock.refresh()
    expect((await acquireUpdateLock({ stateRoot: root, target })).status).toBe('busy')
    for (const winner of winners) if (winner.status === 'acquired') await winner.lock.release()
  })
  it('keeps the target lock held while P2 runs and refuses a second updater', async () => {
    const root = await stateRoot()
    const target = join(root, 'Program Files', 'Harnessed', 'harnessed.exe')
    let finishP2!: () => void
    const p2 = new Promise<void>((resolve) => {
      finishP2 = resolve
    })
    let entered!: () => void
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })

    const first = withUpdateLock({ stateRoot: root, target }, async () => {
      entered()
      await p2
      return 'done'
    })
    await started

    const second = await acquireUpdateLock({ stateRoot: root, target })
    expect(second.status).toBe('busy')

    finishP2()
    await expect(first).resolves.toEqual({ status: 'completed', value: 'done' })
    const after = await acquireUpdateLock({ stateRoot: root, target })
    expect(after.status).toBe('acquired')
    if (after.status === 'acquired') await after.lock.release()
  })

  it('keys locks by resolved target so independent channels do not collide', async () => {
    const root = await stateRoot()
    const compiled = await acquireUpdateLock({
      stateRoot: root,
      target: join(root, 'harnessed.exe'),
    })
    const packageEntry = await acquireUpdateLock({
      stateRoot: root,
      target: join(root, 'node_modules', 'harnessed', 'dist', 'cli.mjs'),
    })

    expect(compiled.status).toBe('acquired')
    expect(packageEntry.status).toBe('acquired')
    if (compiled.status === 'acquired') await compiled.lock.release()
    if (packageEntry.status === 'acquired') await packageEntry.lock.release()
  })

  it('recovers only a stale lock whose owner is no longer alive', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const crashed = await acquireUpdateLock({
      stateRoot: root,
      target,
      now: () => 100,
      pid: 111,
      isProcessAlive: () => false,
    })
    expect(crashed.status).toBe('acquired')

    const recovered = await acquireUpdateLock({
      stateRoot: root,
      target,
      now: () => 10_000,
      staleAfterMs: 1_000,
      pid: 222,
      isProcessAlive: () => false,
    })
    expect(recovered.status).toBe('acquired')
    if (crashed.status === 'acquired') await crashed.lock.release()

    const stillBusy = await acquireUpdateLock({
      stateRoot: root,
      target,
      now: () => 10_001,
      isProcessAlive: () => true,
    })
    expect(stillBusy.status).toBe('busy')
    if (recovered.status === 'acquired') await recovered.lock.release()
  })
})

describe('update lock continuation nonce', () => {
  it.each([
    { consumed: true, reason: 'nonce-consumed' },
    { consumed: false, reason: 'target-mismatch' },
  ])('rejects a consumed=$consumed nonce after its owner exits without changing the lock', async ({
    consumed,
    reason,
  }) => {
    const exited = spawnSync(process.execPath, ['-e', ''], { windowsHide: true })
    expect(exited.status).toBe(0)
    expect(exited.pid).toBeGreaterThan(0)
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const acquired = await acquireUpdateLock({
      stateRoot: root,
      target,
      pid: consumed ? process.pid : exited.pid,
    })
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const input = {
        stateRoot: root,
        target,
        nonce: acquired.lock.nonce,
        targetKey: acquired.lock.targetKey,
        protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
      }
      if (consumed)
        await expect(consumeUpdateLockContinuation({ ...input, pid: exited.pid })).resolves.toEqual(
          { ok: true },
        )
      const before = await readFile(acquired.lock.path, 'utf8')
      await expect(consumeUpdateLockContinuation(input)).resolves.toEqual({ ok: false, reason })
      if (consumed) {
        await expect(
          consumeUpdateLockContinuation({ ...input, nonce: 'wrong-nonce' }),
        ).resolves.toEqual({ ok: false, reason: 'nonce-mismatch' })
        await expect(
          consumeUpdateLockContinuation({ ...input, targetKey: 'wrong-target' }),
        ).resolves.toEqual({ ok: false, reason: 'target-mismatch' })
      }
      expect(await readFile(acquired.lock.path, 'utf8')).toBe(before)
    } finally {
      await acquired.lock.release()
    }
  })

  it('transfers ownership to P2 until it is dead and its heartbeat is stale', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const acquired = await acquireUpdateLock({ stateRoot: root, target, now: () => 0 })
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      await expect(
        consumeUpdateLockContinuation({
          stateRoot: root,
          target,
          nonce: acquired.lock.nonce,
          targetKey: acquired.lock.targetKey,
          protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
          pid: 222,
          now: () => 2000,
        }),
      ).resolves.toEqual({ ok: true })
      expect(JSON.parse(await readFile(acquired.lock.path, 'utf8'))).toMatchObject({
        ownerPid: 222,
        consumedAt: 2000,
        heartbeatAt: 2000,
      })
      await expect(
        acquireUpdateLock({
          stateRoot: root,
          target,
          now: () => 10_000,
          staleAfterMs: 1000,
          isProcessAlive: (pid) => pid === 222,
        }),
      ).resolves.toMatchObject({ status: 'busy', ownerPid: 222 })
      await expect(
        acquireUpdateLock({
          stateRoot: root,
          target,
          now: () => 2500,
          staleAfterMs: 1000,
          isProcessAlive: () => false,
        }),
      ).resolves.toMatchObject({ status: 'busy', ownerPid: 222 })
      const recovered = await acquireUpdateLock({
        stateRoot: root,
        target,
        now: () => 10_000,
        staleAfterMs: 1000,
        isProcessAlive: () => false,
      })
      expect(recovered.status).toBe('acquired')
      if (recovered.status === 'acquired') await recovered.lock.release()
    } finally {
      await acquired.lock.release()
    }
  })

  it('accepts the matching nonce and protocol exactly once', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')
    const acquired = await acquireUpdateLock({
      stateRoot: root,
      target,
      nonce: 'f'.repeat(32),
    })
    expect(acquired.status).toBe('acquired')
    if (acquired.status !== 'acquired') return

    await expect(
      consumeUpdateLockContinuation({
        stateRoot: root,
        target,
        nonce: 'f'.repeat(32),
        targetKey: acquired.lock.targetKey,
        protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
      }),
    ).resolves.toEqual({ ok: true })
    await expect(
      consumeUpdateLockContinuation({
        stateRoot: root,
        target,
        nonce: 'f'.repeat(32),
        targetKey: acquired.lock.targetKey,
        protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
      }),
    ).resolves.toEqual({ ok: false, reason: 'nonce-consumed' })
    await acquired.lock.release()
  })

  it('rejects a wrong nonce, target key, or protocol without consuming the grant', async () => {
    const root = await stateRoot()
    const acquired = await acquireUpdateLock({
      stateRoot: root,
      target: join(root, 'harnessed.exe'),
      nonce: '1'.repeat(32),
    })
    expect(acquired.status).toBe('acquired')
    if (acquired.status !== 'acquired') return

    await expect(
      acquired.lock.consumeContinuation({
        nonce: '2'.repeat(32),
        targetKey: acquired.lock.targetKey,
        protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
      }),
    ).resolves.toEqual({ ok: false, reason: 'nonce-mismatch' })
    await expect(
      acquired.lock.consumeContinuation({
        nonce: '1'.repeat(32),
        targetKey: 'wrong-target',
        protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
      }),
    ).resolves.toEqual({ ok: false, reason: 'target-mismatch' })
    await expect(
      acquired.lock.consumeContinuation({
        nonce: '1'.repeat(32),
        targetKey: acquired.lock.targetKey,
        protocolVersion: 999,
      }),
    ).resolves.toEqual({ ok: false, reason: 'protocol-mismatch' })
    await acquired.lock.release()
  })
})

describe('withUpdateLock release', () => {
  it('releases after failure and interruption', async () => {
    const root = await stateRoot()
    const target = join(root, 'harnessed.exe')

    await expect(
      withUpdateLock({ stateRoot: root, target }, async () => {
        throw new Error('P2 failed')
      }),
    ).rejects.toThrow('P2 failed')
    const afterFailure = await acquireUpdateLock({ stateRoot: root, target })
    expect(afterFailure.status).toBe('acquired')
    if (afterFailure.status === 'acquired') await afterFailure.lock.release()

    const interruption = new Error('interrupted')
    interruption.name = 'AbortError'
    await expect(
      withUpdateLock({ stateRoot: root, target }, async () => {
        throw interruption
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    const afterInterruption = await acquireUpdateLock({ stateRoot: root, target })
    expect(afterInterruption.status).toBe('acquired')
    if (afterInterruption.status === 'acquired') await afterInterruption.lock.release()
  })
})
