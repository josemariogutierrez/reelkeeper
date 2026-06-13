import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../data/store'
import { parseShare } from '../lib/instagram'
import ReelEditor from '../components/ReelEditor'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: string; deduped: boolean }
  | { kind: 'error'; message: string }

export default function AddReel() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { reels, saveReel } = useData()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [manual, setManual] = useState('')

  // Share target (Android) sends title/text/url; iOS Shortcut / paste sends ?url=
  const incoming = params.get('url') || params.get('text') || params.get('title')

  const savedId = status.kind === 'saved' ? status.id : null
  const reel = useMemo(() => reels.find((r) => r.id === savedId), [reels, savedId])

  const doSave = async (raw: string) => {
    const parsed = parseShare(raw)
    if (!parsed) {
      setStatus({ kind: 'error', message: "That doesn't look like an Instagram reel link." })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      const text = params.get('text')
      const caption = text && text !== parsed.url ? text : undefined
      const { id, deduped } = await saveReel({ ...parsed, caption })
      setStatus({ kind: 'saved', id, deduped })
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message })
    }
  }

  // auto-save when arriving from a share/shortcut
  useEffect(() => {
    if (incoming && status.kind === 'idle') doSave(incoming)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming])

  return (
    <div className="page page--add">
      <header className="page__header">
        <h1>Add reel</h1>
        <Link to="/" className="btn btn--ghost">
          Close
        </Link>
      </header>

      {status.kind === 'idle' && !incoming && (
        <div className="field">
          <label className="field__label">Paste an Instagram reel link</label>
          <input
            className="input"
            value={manual}
            placeholder="https://www.instagram.com/reel/…"
            autoFocus
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSave(manual)}
          />
          <button className="btn btn--primary" onClick={() => doSave(manual)}>
            Save
          </button>
        </div>
      )}

      {status.kind === 'saving' && <p className="muted">Saving…</p>}

      {status.kind === 'error' && (
        <div className="banner banner--error">
          <p>{status.message}</p>
          <button className="btn btn--ghost" onClick={() => setStatus({ kind: 'idle' })}>
            Try again
          </button>
        </div>
      )}

      {status.kind === 'saved' && reel && (
        <>
          <div className="banner banner--ok">
            {status.deduped ? 'Already saved — opening it to edit.' : 'Saved to your inbox ✓'}
          </div>
          <p className="muted">Add details now, or just hit Done — you can organize later.</p>
          <ReelEditor reel={reel} />
          <div className="add__actions">
            <button className="btn btn--primary" onClick={() => navigate('/')}>
              Done
            </button>
            <button className="btn btn--ghost" onClick={() => navigate(`/reel/${reel.id}`)}>
              Open full view
            </button>
          </div>
        </>
      )}
    </div>
  )
}
