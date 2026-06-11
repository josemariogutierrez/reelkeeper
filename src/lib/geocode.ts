// Address search via OpenStreetMap Nominatim (free, CORS-friendly, no key).
// Personal-use rate limits apply: keep it to user-driven, debounced searches.

export interface GeocodeResult {
  lat: number
  lng: number
  label: string
}

export async function searchPlaces(query: string, limit = 6): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (!q) return []
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '0')
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`)
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    label: d.display_name,
  }))
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'jsonv2')
  try {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error()
    const data = (await res.json()) as { display_name?: string }
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}
