import { useAuth } from '../data/auth'

export default function SignIn() {
  const { signIn, error } = useAuth()
  return (
    <div className="signin">
      <div className="signin__logo" aria-hidden>
        ▶
      </div>
      <h1>ReelKeeper</h1>
      <p className="muted">
        Save, organize and map your Instagram reels — synced to your account across devices.
      </p>
      <button className="btn btn--primary signin__btn" onClick={signIn}>
        Continue with Google
      </button>
      {error && <p className="banner banner--error">{error}</p>}
      <p className="hint">Your reels are private to your account.</p>
    </div>
  )
}
