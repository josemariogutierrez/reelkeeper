import { db } from '../db'
import type { List, Reel, Tag } from '../types'

interface BackupFile {
  app: 'reelkeeper'
  version: 1
  exportedAt: number
  reels: Reel[]
  lists: List[]
  tags: Tag[]
}

export async function exportData(): Promise<void> {
  const [reels, lists, tags] = await Promise.all([
    db.reels.toArray(),
    db.lists.toArray(),
    db.tags.toArray(),
  ])
  const payload: BackupFile = {
    app: 'reelkeeper',
    version: 1,
    exportedAt: Date.now(),
    reels,
    lists,
    tags,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(payload.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `reelkeeper-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportMode = 'merge' | 'replace'

export async function importData(file: File, mode: ImportMode): Promise<{ reels: number }> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<BackupFile>
  if (data.app !== 'reelkeeper' || !Array.isArray(data.reels)) {
    throw new Error('Not a ReelKeeper backup file.')
  }
  await db.transaction('rw', db.reels, db.lists, db.tags, async () => {
    if (mode === 'replace') {
      await Promise.all([db.reels.clear(), db.lists.clear(), db.tags.clear()])
    }
    await db.tags.bulkPut(data.tags ?? [])
    await db.lists.bulkPut(data.lists ?? [])
    await db.reels.bulkPut(data.reels ?? [])
  })
  return { reels: data.reels.length }
}

/** Ask the browser to keep our IndexedDB data from being evicted. */
export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage?.persist) {
    if (await navigator.storage.persisted()) return true
    return navigator.storage.persist()
  }
  return false
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate()
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
  }
  return null
}
