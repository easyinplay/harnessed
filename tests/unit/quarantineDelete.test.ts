import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertOwnedPathUnchanged,
  prepareOwnedPathRemoval,
  removeOwnedDirectoryViaQuarantine,
  removeOwnedFileViaQuarantine,
  withQuarantineTransaction,
} from '../../src/lib/quarantineDelete.js'

async function removeWithoutFollowingLinks(path: string): Promise<void> {
  const info = await lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (info === null) return

  if (info.isSymbolicLink()) {
    await unlink(path)
    return
  }
  if (info.isDirectory()) {
    for (const entry of await readdir(path)) {
      await removeWithoutFollowingLinks(join(path, entry))
    }
    await rm(path, { recursive: true, force: true })
    return
  }
  await unlink(path)
}

describe('removeOwnedDirectoryViaQuarantine', () => {
  it('rejects a directory replaced by an external symlink after preflight', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-delete-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'component')
    const external = join(fixture, 'external')
    const sentinel = join(external, 'sentinel.txt')

    try {
      await mkdir(target, { recursive: true })
      await mkdir(external, { recursive: true })
      await writeFile(sentinel, 'external sentinel')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await rm(target, { recursive: true })
      await symlink(external, target, process.platform === 'win32' ? 'junction' : 'dir')

      await expect(removeOwnedDirectoryViaQuarantine(snapshot)).rejects.toThrow(
        /symbolic link|junction/i,
      )
      expect(await readFile(sentinel, 'utf8')).toBe('external sentinel')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })
})

describe('removeOwnedFileViaQuarantine', () => {
  it('removes an unchanged owned file through quarantine', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-file-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await removeOwnedFileViaQuarantine(snapshot)

      await expect(access(target)).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('restores and preserves a replacement file swapped in after preflight', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-file-swap-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')
    const replacement = join(root, 'replacement-state.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await writeFile(replacement, 'replacement state')
      await unlink(target)
      await rename(replacement, target)

      await expect(removeOwnedFileViaQuarantine(snapshot)).rejects.toThrow(
        /identity changed after preflight/i,
      )
      expect(await readFile(target, 'utf8')).toBe('replacement state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('rejects a same-inode content replacement after preflight', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-file-content-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)
      const before = await lstat(target)

      await writeFile(target, 'replacement state')
      const after = await lstat(target)
      expect(after.dev).toBe(before.dev)
      expect(after.ino).toBe(before.ino)

      await expect(assertOwnedPathUnchanged(snapshot)).rejects.toThrow(
        /path changed after preflight/i,
      )
      await expect(removeOwnedFileViaQuarantine(snapshot)).rejects.toThrow(
        /content changed after preflight/i,
      )
      expect(await readFile(target, 'utf8')).toBe('replacement state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('restores the original file when quarantine verification fails', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-file-verify-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await expect(
        removeOwnedFileViaQuarantine(snapshot, {
          verify: async () => {
            throw new Error('marker changed after quarantine')
          },
        }),
      ).rejects.toThrow(/marker changed after quarantine/i)
      expect(await readFile(target, 'utf8')).toBe('owned state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })
})

describe('withQuarantineTransaction', () => {
  it('rolls back every quarantined path when the commit callback fails', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-transaction-write-'))
    const root = join(fixture, 'owned')
    const first = join(root, 'first.json')
    const second = join(root, 'second.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(first, 'first state')
      await writeFile(second, 'second state')
      const firstSnapshot = await prepareOwnedPathRemoval(root, first)
      const secondSnapshot = await prepareOwnedPathRemoval(root, second)
      let firstVerifyCalls = 0
      let secondVerifyCalls = 0

      await expect(
        withQuarantineTransaction(
          async () => {
            await removeOwnedFileViaQuarantine(firstSnapshot, {
              verify: async () => {
                firstVerifyCalls += 1
              },
            })
            await removeOwnedFileViaQuarantine(secondSnapshot, {
              verify: async () => {
                secondVerifyCalls += 1
              },
            })
          },
          async () => {
            throw new Error('write receipt failed')
          },
        ),
      ).rejects.toThrow(/write receipt failed/i)
      expect(await readFile(first, 'utf8')).toBe('first state')
      expect(await readFile(second, 'utf8')).toBe('second state')
      expect(firstVerifyCalls).toBe(2)
      expect(secondVerifyCalls).toBe(2)
      expect(
        (await readdir(root)).filter((name) => name.startsWith('.harnessed-quarantine-')),
      ).toEqual([])
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('rolls back prior quarantines when a later quarantine fails', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-transaction-stage-'))
    const root = join(fixture, 'owned')
    const first = join(root, 'first.json')
    const second = join(root, 'second.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(first, 'first state')
      await writeFile(second, 'second state')
      const firstSnapshot = await prepareOwnedPathRemoval(root, first)
      const secondSnapshot = await prepareOwnedPathRemoval(root, second)

      await expect(
        withQuarantineTransaction(
          async () => {
            await removeOwnedFileViaQuarantine(firstSnapshot)
            await removeOwnedFileViaQuarantine(secondSnapshot, {
              verify: async () => {
                throw new Error('second quarantine failed')
              },
            })
          },
          async () => undefined,
        ),
      ).rejects.toThrow(/second quarantine failed/i)
      expect(await readFile(first, 'utf8')).toBe('first state')
      expect(await readFile(second, 'utf8')).toBe('second state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('reports every rollback failure with its retained quarantine path', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-transaction-rollback-'))
    const root = join(fixture, 'owned')
    const first = join(root, 'first.json')
    const second = join(root, 'second.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(first, 'first state')
      await writeFile(second, 'second state')
      const firstSnapshot = await prepareOwnedPathRemoval(root, first)
      const secondSnapshot = await prepareOwnedPathRemoval(root, second)

      let failure: Error | undefined
      try {
        await withQuarantineTransaction(
          async () => {
            await removeOwnedFileViaQuarantine(firstSnapshot)
            await removeOwnedFileViaQuarantine(secondSnapshot)
          },
          async () => {
            await writeFile(first, 'occupied first')
            await writeFile(second, 'occupied second')
            throw new Error('remove receipt failed')
          },
        )
      } catch (error) {
        failure = error as Error
      }

      expect(failure?.message).toMatch(/remove receipt failed/i)
      expect(failure?.message).toContain(first)
      expect(failure?.message).toContain(second)
      expect(failure?.message.match(/retained at/g)).toHaveLength(2)
      expect(
        (await readdir(root)).filter((name) => name.startsWith('.harnessed-quarantine-')),
      ).toHaveLength(2)
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('does not restore quarantine content tampered before rollback', async () => {
    const fixture = await mkdtemp(
      join(tmpdir(), 'harnessed-quarantine-transaction-tamper-rollback-'),
    )
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')
    let quarantinePath = ''

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await expect(
        withQuarantineTransaction(
          async () => removeOwnedFileViaQuarantine(snapshot),
          async () => {
            quarantinePath = join(
              root,
              (await readdir(root)).find((name) => name.startsWith('.harnessed-quarantine-')) ?? '',
            )
            await writeFile(quarantinePath, 'foreign state')
            throw new Error('write receipt failed')
          },
        ),
      ).rejects.toThrow(/write receipt failed.*rollback reverify failed.*retained at/i)
      await expect(access(target)).rejects.toMatchObject({ code: 'ENOENT' })
      expect(await readFile(quarantinePath, 'utf8')).toBe('foreign state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('does not delete quarantine content tampered after commit', async () => {
    const fixture = await mkdtemp(
      join(tmpdir(), 'harnessed-quarantine-transaction-tamper-cleanup-'),
    )
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')
    let quarantinePath = ''

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      const result = await withQuarantineTransaction(
        async () => removeOwnedFileViaQuarantine(snapshot),
        async () => {
          quarantinePath = join(
            root,
            (await readdir(root)).find((name) => name.startsWith('.harnessed-quarantine-')) ?? '',
          )
          await writeFile(quarantinePath, 'foreign state')
        },
      )

      expect(result.cleanupFailures).toHaveLength(1)
      expect(result.cleanupFailures[0]).toMatch(/cleanup reverify failed.*retained at/i)
      await expect(access(target)).rejects.toMatchObject({ code: 'ENOENT' })
      expect(await readFile(quarantinePath, 'utf8')).toBe('foreign state')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })

  it('finalizes quarantines after commit and supports retry after a rolled-back commit', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'harnessed-quarantine-transaction-retry-'))
    const root = join(fixture, 'owned')
    const target = join(root, 'state.json')

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      let commitAttempts = 0
      let verifyCalls = 0

      const attempt = async () => {
        const snapshot = await prepareOwnedPathRemoval(root, target)
        return withQuarantineTransaction(
          async () =>
            removeOwnedFileViaQuarantine(snapshot, {
              verify: async () => {
                verifyCalls += 1
              },
            }),
          async () => {
            commitAttempts += 1
            if (commitAttempts === 1) throw new Error('remove receipt failed')
          },
        )
      }

      await expect(attempt()).rejects.toThrow(/remove receipt failed/i)
      expect(await readFile(target, 'utf8')).toBe('owned state')

      const result = await attempt()

      expect(result.cleanupFailures).toEqual([])
      await expect(access(target)).rejects.toMatchObject({ code: 'ENOENT' })
      expect(
        (await readdir(root)).filter((name) => name.startsWith('.harnessed-quarantine-')),
      ).toEqual([])
      expect(commitAttempts).toBe(2)
      expect(verifyCalls).toBe(4)
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })
})
