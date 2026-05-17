import type { Gauge, MapBounds } from '../types'

const BASE = 'http://localhost:8080'

export async function fetchGaugesInBounds(bounds: MapBounds): Promise<Gauge[]> {
  const params = new URLSearchParams({
    northLatitude: String(bounds.north),
    southLatitude: String(bounds.south),
    eastLongitude: String(bounds.east),
    westLongitude: String(bounds.west),
  })
  const res = await fetch(`${BASE}/gauge?${params}`)
  if (!res.ok) throw new Error(`FloodWatch API error: ${res.status}`)
  return res.json()
}
