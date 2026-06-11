import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteList } from '../db'
import { filterReels } from '../lib/search'
import ReelCard from '../components/ReelCard'
import ListMap from '../components/ListMap'

type View = 'grid' | 'map'

export default function ListView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('grid')
  const [query, setQuery] = useState('')

  const list = useLiveQuery(() => db.lists.get(id), [id])
  const reels = useLiveQuery(
    () => db.reels.where('listIds').equals(id).reverse().sortBy('createdAt'),
    [id],
    [],
  )
  const tags = useLiveQuery(() => db.tags.toArray(), [], [])
  const tagsById = useMemo(() => new Map((tags ?? []).map((t) => [t.id, t])), [tags])

  const visible = useMemo(() => filterReels(reels ?? [], query, tagsById), [reels, query, tagsById])
  const locatedCount = (reels ?? []).filter((r) => r.location).length

  const remove = async () => {
    if (confirm(`Delete list "${list?.name}"? Reels stay saved; they're just removed from this list.`)) {
      await deleteList(id)
      navigate('/lists')
    }
  }

  if (list === undefined) return <div className="page" />
  if (list === null)
    return (
      <div className="page">
        <p className="muted">List not found.</p>
        <Link to="/lists" className="btn btn--ghost">
          Back to lists
        </Link>
      </div>
    )

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Link to="/lists" className="back">
            ‹ Lists
          </Link>
          <h1>{list.name}</h1>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={remove}>
          Delete
        </button>
      </header>

      <div className="segmented">
        <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>
          Grid
        </button>
        <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
          Map {locatedCount > 0 && `(${locatedCount})`}
        </button>
      </div>

      {view === 'grid' ? (
        <>
          <input
            className="input search"
            value={query}
            placeholder="Search in this list…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {visible.length === 0 ? (
            <div className="empty">
              <p className="muted">No reels here yet. Add a reel to this list from its detail page.</p>
            </div>
          ) : (
            <div className="cards">
              {visible.map((r) => (
                <ReelCard key={r.id} reel={r} />
              ))}
            </div>
          )}
        </>
      ) : (
        <ListMap reels={reels ?? []} />
      )}
    </div>
  )
}
