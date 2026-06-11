import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { requestPersistence } from './lib/backup'
import 'leaflet/dist/leaflet.css'
import './styles.css'

// Best-effort: ask the browser not to evict our local data.
requestPersistence().catch(() => {})

// vite-plugin-pwa injects the base; BrowserRouter needs the matching basename.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename || undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
