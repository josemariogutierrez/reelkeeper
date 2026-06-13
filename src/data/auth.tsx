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
    try {
      // Popup is the reliable flow: signInWithRedirect breaks in installed PWAs
      // because browsers block the cross-site (firebaseapp.com) storage it needs
      // to read the result back. Popup returns the credential directly.
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = (e as { code?: string })?.code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return // user dismissed it; let them tap again
      }
      // Popup blocked / unsupported in this environment → fall back to redirect.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search)
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (e2) {
          setError((e2 as Error)?.message ?? 'Sign-in failed')
        }
        return
      }
      setError((e as Error)?.message ?? 'Sign-in failed')
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
