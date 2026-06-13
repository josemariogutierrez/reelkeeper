// Reads the OLD local-only Dexie database so a user can import anything they
// saved before accounts existed. Independent of the new Firestore layer.
import Dexie, { type Table } from 'dexie'
import type { List, Reel, Tag } from '../types'

class LegacyDB extends Dexie {
  reels!: Table<Reel, string>
  lists!: Table<List, string>
  tags!: Table<Tag, string>
  constructor() {
    super('reelkeeper')
    this.version(1).stores({
      reels: 'id, shortcode, createdAt, *tagIds, *listIds',
      lists: 'id, name, createdAt',
      tags: 'id, &name',
    })
  }
}

const legacyDb = new LegacyDB()

export interface LegacySnapshot {
  reels: Reel[]
  lists: List[]
  tags: Tag[]
}

export async function readLegacy(): Promise<LegacySnapshot> {
  try {
    const [reels, lists, tags] = await Promise.all([
      legacyDb.reels.toArray(),
      legacyDb.lists.toArray(),
      legacyDb.tags.toArray(),
    ])
    return { reels, lists, tags }
  } catch {
    return { reels: [], lists: [], tags: [] }
  }
}

export async function clearLegacy(): Promise<void> {
  try {
    await Promise.all([legacyDb.reels.clear(), legacyDb.lists.clear(), legacyDb.tags.clear()])
  } catch {
    /* ignore */
  }
}
