import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  prepareOwnedPathRemoval,
  removeOwnedDirectoryViaQuarantine,
  removeOwnedFileViaQuarantine,
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

    try {
      await mkdir(root, { recursive: true })
      await writeFile(target, 'owned state')
      const snapshot = await prepareOwnedPathRemoval(root, target)

      await unlink(target)
      await writeFile(target, 'replacement')

      await expect(removeOwnedFileViaQuarantine(snapshot)).rejects.toThrow(
        /identity changed after preflight/i,
      )
      expect(await readFile(target, 'utf8')).toBe('replacement')
    } finally {
      await removeWithoutFollowingLinks(fixture)
    }
  })
})
