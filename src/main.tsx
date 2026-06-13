import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './data/auth'
import { requestPersistence } from './lib/backup'
import 'leaflet/dist/leaflet.css'
import './styles.css'

// Best-effort: ask the browser not to evict Firestore's offline cache.
requestPersistence().catch(() => {})

// vite-plugin-pwa injects the base; BrowserRouter needs the matching basename.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename || undefined}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
