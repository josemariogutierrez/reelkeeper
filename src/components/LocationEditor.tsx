import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { Marker as LeafletMarker } from 'leaflet'
import { reverseGeocode, searchPlaces, type GeocodeResult } from '../lib/geocode'
import type { ReelLocation } from '../types'
import '../lib/leafletIcon'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '© OpenStreetMap contributors'

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14))
  }, [lat, lng, map])
  return null
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

export default function LocationEditor({
  value,
  onChange,
}: {
  value?: ReelLocation
  onChange: (loc: ReelLocation | undefined) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const markerRef = useRef<LeafletMarker>(null)

  // debounce the geocoder
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        setResults(await searchPlaces(q))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [query])

  const pick = (r: GeocodeResult) => {
    onChange({ lat: r.lat, lng: r.lng, label: r.label })
    setResults([])
    setQuery('')
  }

  const placeAt = async (lat: number, lng: number) => {
    onChange({ lat, lng, label: value?.label ?? 'Locating…' })
    const label = await reverseGeocode(lat, lng)
    onChange({ lat, lng, label })
  }

  const center: [number, number] = value ? [value.lat, value.lng] : [19.4326, -99.1332] // CDMX default

  return (
    <div className="field">
      <label className="field__label">Location</label>
      <div className="row">
        <input
          className="input"
          value={query}
          placeholder="Search a place or address…"
          onChange={(e) => setQuery(e.target.value)}
        />
        {value && (
          <button type="button" className="btn btn--ghost" onClick={() => onChange(undefined)}>
            Clear
          </button>
        )}
      </div>
      {searching && <p className="muted">Searching…</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" className="result" onClick={() => pick(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && <p className="muted location-label">📍 {value.label}</p>}
      <div className="map map--editor">
        <MapContainer center={center} zoom={value ? 14 : 11} scrollWheelZoom>
          <TileLayer url={OSM_URL} attribution={OSM_ATTR} />
          <ClickToPlace onPick={placeAt} />
          {value && <Recenter lat={value.lat} lng={value.lng} />}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const m = markerRef.current
                  if (m) {
                    const ll = m.getLatLng()
                    placeAt(ll.lat, ll.lng)
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="hint">Tap the map to drop a pin, or drag it to fine-tune.</p>
    </div>
  )
}
