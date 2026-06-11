import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteReel } from '../db'
import Embed from '../components/Embed'
import ReelEditor from '../components/ReelEditor'

export default function ReelDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const reel = useLiveQuery(() => db.reels.get(id), [id])

  if (reel === undefined) return <div className="page" />
  if (reel === null)
    return (
      <div className="page">
        <p className="muted">Reel not found.</p>
        <Link to="/" className="btn btn--ghost">
          Back
        </Link>
      </div>
    )

  const remove = async () => {
    if (confirm('Delete this reel permanently?')) {
      await deleteReel(reel.id)
      navigate(-1)
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <button className="back" onClick={() => navigate(-1)}>
          ‹ Back
        </button>
        <button className="btn btn--ghost btn--sm" onClick={remove}>
          Delete
        </button>
      </header>

      <Embed shortcode={reel.shortcode} url={reel.url} />

      <a className="btn btn--ghost open-ig" href={reel.url} target="_blank" rel="noreferrer">
        Open in Instagram ↗
      </a>

      <ReelEditor reel={reel} />
    </div>
  )
}
