import { useEffect, useRef, useState } from 'react'
import { embedUrl } from '../lib/instagram'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

let scriptPromise: Promise<void> | null = null

function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://www.instagram.com/embed.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('embed.js failed'))
    document.body.appendChild(s)
  })
  return scriptPromise
}

/** Live Instagram embed. Works online + for public reels only; degrades gracefully. */
export default function Embed({ shortcode, url }: { shortcode: string; url: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (!online) return
    let cancelled = false
    loadEmbedScript()
      .then(() => {
        if (cancelled) return
        window.instgrm?.Embeds.process()
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [online, shortcode])

  if (!online) {
    return (
      <div className="embed-fallback">
        <p>You're offline — the reel can't load.</p>
        <a className="btn" href={url} target="_blank" rel="noreferrer">
          Open in Instagram when online
        </a>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="embed-fallback">
        <p>Couldn't embed this reel (it may be private or removed).</p>
        <a className="btn" href={url} target="_blank" rel="noreferrer">
          Open in Instagram ↗
        </a>
      </div>
    )
  }

  return (
    <div ref={ref} className="embed-wrap">
      {/* Instagram's embed.js upgrades this blockquote into the player */}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={embedUrl(shortcode)}
        data-instgrm-version="14"
        style={{ background: '#fff', margin: 0, padding: 0, width: '100%' }}
      >
        <a href={url}>View this reel on Instagram</a>
      </blockquote>
    </div>
  )
}
