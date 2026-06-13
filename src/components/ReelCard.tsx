import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/store'
import type { Reel } from '../types'

export default function ReelCard({ reel }: { reel: Reel }) {
  const { tags } = useData()
  const tagNames = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t.name]))
    return reel.tagIds.map((id) => byId.get(id)).filter(Boolean) as string[]
  }, [tags, reel.tagIds])

  return (
    <Link to={`/reel/${reel.id}`} className="card">
      <div className="card__thumb" aria-hidden>
        <span className="card__glyph">▶</span>
      </div>
      <div className="card__body">
        <div className="card__title">{reel.title || reel.url.replace(/^https?:\/\/(www\.)?/, '')}</div>
        {reel.location && <div className="card__loc">📍 {reel.location.label}</div>}
        {tagNames.length > 0 && (
          <div className="card__tags">
            {tagNames.map((n) => (
              <span key={n} className="tagpill">
                #{n}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
