import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Reel } from '../types'

export default function ReelCard({ reel }: { reel: Reel }) {
  const tagNames =
    useLiveQuery(
      async () => {
        const tags = await db.tags.bulkGet(reel.tagIds)
        return tags.filter(Boolean).map((t) => t!.name)
      },
      [reel.tagIds.join(',')],
      [] as string[],
    ) ?? []

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
