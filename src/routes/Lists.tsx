import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/store'

export default function Lists() {
  const [name, setName] = useState('')
  const { lists, reels, createList } = useData()

  const ordered = useMemo(() => [...lists].sort((a, b) => a.createdAt - b.createdAt), [lists])
  const countFor = (id: string) => reels.filter((r) => r.listIds.includes(id)).length

  const add = async () => {
    if (!name.trim()) return
    await createList(name)
    setName('')
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Lists</h1>
      </header>

      <div className="row">
        <input
          className="input"
          value={name}
          placeholder="New list (e.g. CDMX Eats)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn--primary" onClick={add}>
          Create
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className="empty">
          <p className="muted">No lists yet. Create one above, then add reels to it.</p>
        </div>
      ) : (
        <ul className="listgrid">
          {ordered.map((l) => (
            <li key={l.id}>
              <Link to={`/list/${l.id}`} className="listcard">
                <span className="listcard__name">{l.name}</span>
                <span className="listcard__count">{countFor(l.id)} reels</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
