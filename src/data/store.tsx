import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { collection, deleteDoc, deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './auth'
import type { List, Reel, Tag } from '../types'
import { clearLegacy, readLegacy } from './legacy'

interface DataState {
  ready: boolean
  reels: Reel[]
  lists: List[]
  tags: Tag[]
  saveReel: (input: { shortcode: string; url: string; caption?: string }) => Promise<{ id: string; deduped: boolean }>
  updateReel: (id: string, patch: Partial<Reel>) => Promise<void>
  deleteReel: (id: string) => Promise<void>
  createList: (name: string, color?: string) => Promise<string>
  deleteList: (id: string) => Promise<void>
  setReelLists: (reelId: string, listIds: string[]) => Promise<void>
  setReelTagsByName: (reelId: string, names: string[]) => Promise<void>
  exportData: () => void
  importData: (file: File, mode: 'merge' | 'replace') => Promise<{ reels: number }>
  legacyCount: () => Promise<number>
  migrateFromLocal: (clearAfter: boolean) => Promise<{ reels: number }>
}

const DataCtx = createContext<DataState | null>(null)

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.abs(Date.now() ^ ((Math.random() * 1e9) | 0)).toString(36)
}

// Firestore rejects `undefined`; translate it to a field delete on merge writes.
function sanitize(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) out[k] = v === undefined ? deleteField() : v
  return out
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user!.uid

  const [reels, setReels] = useState<Reel[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loaded, setLoaded] = useState({ reels: false, lists: false, tags: false })

  // keep latest snapshots available to mutations without stale closures
  const reelsRef = useRef(reels)
  const tagsRef = useRef(tags)
  reelsRef.current = reels
  tagsRef.current = tags

  const cols = useMemo(
    () => ({
      reels: collection(db, 'users', uid, 'reels'),
      lists: collection(db, 'users', uid, 'lists'),
      tags: collection(db, 'users', uid, 'tags'),
    }),
    [uid],
  )

  useEffect(() => {
    const unsubReels = onSnapshot(cols.reels, (snap) => {
      setReels(snap.docs.map((d) => d.data() as Reel))
      setLoaded((s) => ({ ...s, reels: true }))
    })
    const unsubLists = onSnapshot(cols.lists, (snap) => {
      setLists(snap.docs.map((d) => d.data() as List))
      setLoaded((s) => ({ ...s, lists: true }))
    })
    const unsubTags = onSnapshot(cols.tags, (snap) => {
      setTags(snap.docs.map((d) => d.data() as Tag))
      setLoaded((s) => ({ ...s, tags: true }))
    })
    return () => {
      unsubReels()
      unsubLists()
      unsubTags()
    }
  }, [cols])

  // ---- mutations ----
  const saveReel: DataState['saveReel'] = async ({ shortcode, url, caption }) => {
    const existing = reelsRef.current.find((r) => r.shortcode === shortcode)
    if (existing) return { id: existing.id, deduped: true }
    const now = Date.now()
    const reel: Reel = {
      id: shortcode, // shortcode IS the doc id → natural dedupe
      shortcode,
      url,
      caption,
      tagIds: [],
      listIds: [],
      createdAt: now,
      updatedAt: now,
    }
    await setDoc(doc(cols.reels, shortcode), sanitize(reel as unknown as Record<string, unknown>))
    return { id: shortcode, deduped: false }
  }

  const updateReel: DataState['updateReel'] = async (id, patch) => {
    await setDoc(doc(cols.reels, id), sanitize({ ...patch, updatedAt: Date.now() }), { merge: true })
  }

  const deleteReel: DataState['deleteReel'] = async (id) => {
    await deleteDoc(doc(cols.reels, id))
  }

  const createList: DataState['createList'] = async (name, color) => {
    const id = genId()
    const list: List = { id, name: name.trim(), color, createdAt: Date.now() }
    await setDoc(doc(cols.lists, id), sanitize(list as unknown as Record<string, unknown>))
    return id
  }

  const deleteList: DataState['deleteList'] = async (id) => {
    await deleteDoc(doc(cols.lists, id))
    const affected = reelsRef.current.filter((r) => r.listIds.includes(id))
    await Promise.all(
      affected.map((r) => updateReel(r.id, { listIds: r.listIds.filter((l) => l !== id) })),
    )
  }

  const setReelLists: DataState['setReelLists'] = async (reelId, listIds) => {
    await updateReel(reelId, { listIds })
  }

  const getOrCreateTagId = async (rawName: string): Promise<string> => {
    const name = rawName.trim().toLowerCase()
    if (!name) throw new Error('empty tag')
    const existing = tagsRef.current.find((t) => t.name === name)
    if (existing) return existing.id
    const id = genId()
    await setDoc(doc(cols.tags, id), { id, name })
    // optimistically reflect so a follow-up name in the same batch dedupes
    tagsRef.current = [...tagsRef.current, { id, name }]
    return id
  }

  const setReelTagsByName: DataState['setReelTagsByName'] = async (reelId, names) => {
    const unique = Array.from(new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean)))
    const ids = await Promise.all(unique.map(getOrCreateTagId))
    await updateReel(reelId, { tagIds: Array.from(new Set(ids)) })
  }

  // ---- backup ----
  const exportData: DataState['exportData'] = () => {
    const payload = {
      app: 'reelkeeper',
      version: 1,
      exportedAt: Date.now(),
      reels: reelsRef.current,
      lists,
      tags,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reelkeeper-backup-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const writeAll = async (data: { reels?: Reel[]; lists?: List[]; tags?: Tag[] }) => {
    await Promise.all([
      ...(data.tags ?? []).map((t) => setDoc(doc(cols.tags, t.id), sanitize(t as unknown as Record<string, unknown>))),
      ...(data.lists ?? []).map((l) => setDoc(doc(cols.lists, l.id), sanitize(l as unknown as Record<string, unknown>))),
      ...(data.reels ?? []).map((r) => setDoc(doc(cols.reels, r.id), sanitize(r as unknown as Record<string, unknown>))),
    ])
  }

  const importData: DataState['importData'] = async (file, mode) => {
    const parsed = JSON.parse(await file.text())
    if (parsed.app !== 'reelkeeper' || !Array.isArray(parsed.reels)) {
      throw new Error('Not a ReelKeeper backup file.')
    }
    if (mode === 'replace') {
      await Promise.all([
        ...reelsRef.current.map((r) => deleteDoc(doc(cols.reels, r.id))),
        ...lists.map((l) => deleteDoc(doc(cols.lists, l.id))),
        ...tags.map((t) => deleteDoc(doc(cols.tags, t.id))),
      ])
    }
    await writeAll(parsed)
    return { reels: parsed.reels.length }
  }

  // ---- legacy migration ----
  const legacyCount: DataState['legacyCount'] = async () => (await readLegacy()).reels.length

  const migrateFromLocal: DataState['migrateFromLocal'] = async (clearAfter) => {
    const snap = await readLegacy()
    await writeAll(snap)
    if (clearAfter) await clearLegacy()
    return { reels: snap.reels.length }
  }

  const ready = loaded.reels && loaded.lists && loaded.tags

  return (
    <DataCtx.Provider
      value={{
        ready,
        reels,
        lists,
        tags,
        saveReel,
        updateReel,
        deleteReel,
        createList,
        deleteList,
        setReelLists,
        setReelTagsByName,
        exportData,
        importData,
        legacyCount,
        migrateFromLocal,
      }}
    >
      {children}
    </DataCtx.Provider>
  )
}

export function useData(): DataState {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
