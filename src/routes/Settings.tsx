import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, pruneOrphanTags } from '../db'
import {
  exportData,
  importData,
  requestPersistence,
  storageEstimate,
  type ImportMode,
} from '../lib/backup'

function fmtBytes(n: number): string {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [msg, setMsg] = useState('')
  const [importMode, setImportMode] = useState<ImportMode>('merge')

  const counts = useLiveQuery(async () => {
    const [reels, lists, tags] = await Promise.all([db.reels.count(), db.lists.count(), db.tags.count()])
    return { reels, lists, tags }
  }, [])

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
    storageEstimate().then(setEstimate)
  }, [])

  const onImport = async (file: File) => {
    try {
      const { reels } = await importData(file, importMode)
      await pruneOrphanTags()
      setMsg(`Imported ${reels} reels (${importMode}).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Settings</h1>
      </header>

      <section className="card-section">
        <h2>Your library</h2>
        <p className="muted">
          {counts ? `${counts.reels} reels · ${counts.lists} lists · ${counts.tags} tags` : '…'}
        </p>
      </section>

      <section className="card-section">
        <h2>Backup</h2>
        <p className="muted">
          Everything lives only on this device. iOS can clear it if the app sits unused — export
          regularly.
        </p>
        <button className="btn btn--primary" onClick={() => exportData()}>
          Export backup (.json)
        </button>

        <div className="import-row">
          <label className="toggle">
            <input
              type="radio"
              name="mode"
              checked={importMode === 'merge'}
              onChange={() => setImportMode('merge')}
            />
            Merge
          </label>
          <label className="toggle">
            <input
              type="radio"
              name="mode"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
            />
            Replace all
          </label>
        </div>
        <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          Import backup…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
        {msg && <p className="banner banner--ok">{msg}</p>}
      </section>

      <section className="card-section">
        <h2>Storage</h2>
        <p className="muted">
          Persistent storage:{' '}
          <strong>{persisted === null ? '…' : persisted ? 'granted ✓' : 'not granted'}</strong>
        </p>
        {!persisted && (
          <button
            className="btn btn--ghost"
            onClick={async () => setPersisted(await requestPersistence())}
          >
            Request persistent storage
          </button>
        )}
        {estimate && (
          <p className="muted">
            Using {fmtBytes(estimate.usage)} of {fmtBytes(estimate.quota)}
          </p>
        )}
      </section>

      <section className="card-section">
        <h2>About</h2>
        <p className="muted">
          ReelKeeper is a personal, offline-first index of Instagram reels. Reels play via
          Instagram's embed when you're online; offline you can browse your lists, tags, notes and
          the map. See the README for the iOS Shortcut setup.
        </p>
      </section>
    </div>
  )
}
