import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import type { Reel } from '../types'
import '../lib/leafletIcon'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '© OpenStreetMap contributors'

function FitBounds({ reels }: { reels: Reel[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = reels.filter((r) => r.location).map((r) => [r.location!.lat, r.location!.lng] as [number, number])
    if (pts.length === 1) {
      map.setView(pts[0], 14)
    } else if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] })
    }
  }, [reels, map])
  return null
}

export default function ListMap({ reels }: { reels: Reel[] }) {
  const located = reels.filter((r) => r.location)

  if (located.length === 0) {
    return (
      <div className="empty">
        <p className="muted">No reels in this list have a location yet. Open a reel to add one.</p>
      </div>
    )
  }

  return (
    <div className="map map--full">
      <MapContainer center={[located[0].location!.lat, located[0].location!.lng]} zoom={12} scrollWheelZoom>
        <TileLayer url={OSM_URL} attribution={OSM_ATTR} />
        <FitBounds reels={located} />
        {located.map((r) => (
          <Marker key={r.id} position={[r.location!.lat, r.location!.lng]}>
            <Popup>
              <div className="popup">
                <strong>{r.title || 'Untitled reel'}</strong>
                <div className="popup__loc">{r.location!.label}</div>
                <Link to={`/reel/${r.id}`} className="btn btn--primary btn--sm">
                  Open reel
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
