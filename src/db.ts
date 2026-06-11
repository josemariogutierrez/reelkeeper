import Dexie, { type Table } from 'dexie'
import type { List, Reel, Tag } from './types'

export class ReelKeeperDB extends Dexie {
  reels!: Table<Reel, string>
  lists!: Table<List, string>
  tags!: Table<Tag, string>

  constructor() {
    super('reelkeeper')
    this.version(1).stores({
      // indexed fields only; *tagIds/*listIds are multiEntry for filtering
      reels: 'id, shortcode, createdAt, *tagIds, *listIds',
      lists: 'id, name, createdAt',
      tags: 'id, &name',
    })
  }
}

export const db = new ReelKeeperDB()

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.abs(Date.now() ^ ((Math.random() * 1e9) | 0)).toString(36)
}

// ---- Reels ----

export interface SaveReelInput {
  shortcode: string
  url: string
  caption?: string
}

/** Save a reel, deduping by shortcode. Returns the reel id (existing or new). */
export async function saveReel(input: SaveReelInput): Promise<{ id: string; deduped: boolean }> {
  const existing = await db.reels.where('shortcode').equals(input.shortcode).first()
  if (existing) return { id: existing.id, deduped: true }
  const now = Date.now()
  const reel: Reel = {
    id: uuid(),
    shortcode: input.shortcode,
    url: input.url,
    caption: input.caption,
    tagIds: [],
    listIds: [],
    createdAt: now,
    updatedAt: now,
  }
  await db.reels.add(reel)
  return { id: reel.id, deduped: false }
}

export async function updateReel(id: string, patch: Partial<Reel>): Promise<void> {
  await db.reels.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteReel(id: string): Promise<void> {
  await db.reels.delete(id)
}

// ---- Lists ----

export async function createList(name: string, color?: string): Promise<string> {
  const id = uuid()
  await db.lists.add({ id, name: name.trim(), color, createdAt: Date.now() })
  return id
}

export async function deleteList(id: string): Promise<void> {
  await db.transaction('rw', db.lists, db.reels, async () => {
    await db.lists.delete(id)
    const affected = await db.reels.where('listIds').equals(id).toArray()
    await Promise.all(
      affected.map((r) =>
        db.reels.update(r.id, { listIds: r.listIds.filter((l) => l !== id), updatedAt: Date.now() }),
      ),
    )
  })
}

export async function setReelLists(reelId: string, listIds: string[]): Promise<void> {
  await updateReel(reelId, { listIds })
}

// ---- Tags ----

export async function getOrCreateTag(name: string): Promise<string> {
  const norm = name.trim().toLowerCase()
  if (!norm) throw new Error('empty tag')
  const existing = await db.tags.where('name').equals(norm).first()
  if (existing) return existing.id
  const id = uuid()
  await db.tags.add({ id, name: norm })
  return id
}

/** Replace a reel's tags from a list of tag names (creates tags as needed). */
export async function setReelTagsByName(reelId: string, names: string[]): Promise<void> {
  const ids = await Promise.all(names.map((n) => getOrCreateTag(n)))
  await updateReel(reelId, { tagIds: Array.from(new Set(ids)) })
}

/** Remove tags no longer used by any reel (housekeeping). */
export async function pruneOrphanTags(): Promise<void> {
  const [tags, reels] = await Promise.all([db.tags.toArray(), db.reels.toArray()])
  const used = new Set(reels.flatMap((r) => r.tagIds))
  const orphans = tags.filter((t) => !used.has(t.id)).map((t) => t.id)
  if (orphans.length) await db.tags.bulkDelete(orphans)
}
