import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/store'
import Embed from '../components/Embed'
import ReelEditor from '../components/ReelEditor'

export default function ReelDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { reels, ready, deleteReel } = useData()
  const reel = useMemo(() => reels.find((r) => r.id === id), [reels, id])

  if (!ready) return <div className="page"><p className="muted">Loading…</p></div>
  if (!reel)
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
