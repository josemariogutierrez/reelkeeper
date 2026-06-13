import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

const RETURN_KEY = 'rk:returnTo'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Complete any redirect sign-in and restore where the user came from.
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          const back = sessionStorage.getItem(RETURN_KEY)
          sessionStorage.removeItem(RETURN_KEY)
          if (back && back !== window.location.pathname + window.location.search) {
            window.history.replaceState(null, '', back)
          }
        }
      })
      .catch((e) => setError(e?.message ?? 'Sign-in failed'))

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    setError(null)
    sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search)
    try {
      // Redirect is the reliable flow inside an installed iOS PWA; popup often
      // gets blocked there. Fall back to popup if redirect can't start.
      await signInWithRedirect(auth, googleProvider)
    } catch {
      try {
        await signInWithPopup(auth, googleProvider)
      } catch (e) {
        setError((e as Error)?.message ?? 'Sign-in failed')
      }
    }
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, error, signIn, signOutUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
