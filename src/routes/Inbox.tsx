import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { filterReels } from '../lib/search'
import ReelCard from '../components/ReelCard'

export default function Inbox() {
  const [query, setQuery] = useState('')
  const [unsortedOnly, setUnsortedOnly] = useState(false)

  const reels = useLiveQuery(() => db.reels.orderBy('createdAt').reverse().toArray(), [], [])
  const tags = useLiveQuery(() => db.tags.toArray(), [], [])
  const tagsById = useMemo(() => new Map((tags ?? []).map((t) => [t.id, t])), [tags])

  const visible = useMemo(() => {
    let r = reels ?? []
    if (unsortedOnly) r = r.filter((x) => x.listIds.length === 0)
    return filterReels(r, query, tagsById)
  }, [reels, unsortedOnly, query, tagsById])

  return (
    <div className="page">
      <header className="page__header">
        <h1>ReelKeeper</h1>
        <Link to="/add" className="btn btn--primary">
          + Add reel
        </Link>
      </header>

      <input
        className="input search"
        value={query}
        placeholder="Search title, tags, notes, place…"
        onChange={(e) => setQuery(e.target.value)}
      />

      <label className="toggle">
        <input
          type="checkbox"
          checked={unsortedOnly}
          onChange={(e) => setUnsortedOnly(e.target.checked)}
        />
        Unsorted only
      </label>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No reels yet.</p>
          <p className="muted">
            Share a reel from Instagram (via the iOS Shortcut or Android share sheet), or paste a
            link with <strong>+ Add reel</strong>.
          </p>
        </div>
      ) : (
        <div className="cards">
          {visible.map((r) => (
            <ReelCard key={r.id} reel={r} />
          ))}
        </div>
      )}
    </div>
  )
}
