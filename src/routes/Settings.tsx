import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../data/auth'
import { useData } from '../data/store'
import { requestPersistence, storageEstimate } from '../lib/backup'

function fmtBytes(n: number): string {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

export default function Settings() {
  const { user, signOutUser } = useAuth()
  const { reels, lists, tags, exportData, importData, legacyCount, migrateFromLocal } = useData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [msg, setMsg] = useState('')
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [legacy, setLegacy] = useState<number | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
    storageEstimate().then(setEstimate)
    legacyCount().then(setLegacy).catch(() => setLegacy(0))
  }, [legacyCount])

  const onImport = async (file: File) => {
    try {
      const { reels: n } = await importData(file, importMode)
      setMsg(`Imported ${n} reels (${importMode}).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  const runMigrate = async () => {
    const { reels: n } = await migrateFromLocal(true)
    setLegacy(0)
    setMsg(`Imported ${n} reels from this device into your account.`)
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Settings</h1>
      </header>

      <section className="card-section">
        <h2>Account</h2>
        <p className="muted">Signed in as {user?.email ?? user?.displayName ?? 'you'}</p>
        <button className="btn btn--ghost" onClick={signOutUser}>
          Sign out
        </button>
      </section>

      <section className="card-section">
        <h2>Your library</h2>
        <p className="muted">
          {reels.length} reels · {lists.length} lists · {tags.length} tags
        </p>
        <p className="muted">Synced to your account — sign in on any device to see the same data.</p>
      </section>

      {legacy != null && legacy > 0 && (
        <section className="card-section">
          <h2>Import from this device</h2>
          <p className="muted">
            Found {legacy} reel{legacy === 1 ? '' : 's'} saved locally before you had an account.
            Import them into your synced library?
          </p>
          <button className="btn btn--primary" onClick={runMigrate}>
            Import {legacy} into my account
          </button>
        </section>
      )}

      <section className="card-section">
        <h2>Backup</h2>
        <p className="muted">Export a JSON snapshot anytime, or restore from one.</p>
        <button className="btn btn--primary" onClick={exportData}>
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
            Offline cache using {fmtBytes(estimate.usage)} of {fmtBytes(estimate.quota)}
          </p>
        )}
      </section>

      <section className="card-section">
        <h2>About</h2>
        <p className="muted">
          ReelKeeper indexes your Instagram reels and syncs them to your account (Firebase). Reels
          play via Instagram's embed online; offline you can browse lists, tags, notes and the map.
        </p>
      </section>
    </div>
  )
}
