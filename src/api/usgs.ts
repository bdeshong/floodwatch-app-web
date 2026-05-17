import type { USGSParameter, USGSObservation } from '../types'

const BASE = 'https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items'
const API_KEY = import.meta.env.VITE_USGS_API_KEY as string

const PARAM_INFO: Record<string, { name: string; unit: string }> = {
  '00065': { name: 'Gauge Height', unit: 'ft' },
  '00060': { name: 'Discharge', unit: 'ft³/s' },
  '00045': { name: 'Precipitation', unit: 'in' },
  '00010': { name: 'Water Temperature', unit: '°C' },
}

export class USGSRateLimitError extends Error {
  constructor() {
    super('USGS rate limit exceeded')
    this.name = 'USGSRateLimitError'
  }
}

type USGSFeature = {
  properties: { time: string; value: string | null; unit_of_measure: string; parameter_code: string }
}

async function fetchPage(url: string): Promise<{ features: USGSFeature[]; nextUrl: string | null }> {
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } })
  if (res.status === 429) throw new USGSRateLimitError()
  if (!res.ok) throw new Error(`USGS API error: ${res.status}`)

  const data = await res.json()
  const nextLink = (data.links ?? []).find((l: { rel: string; href: string }) => l.rel === 'next')
  return {
    features: data.features ?? [],
    nextUrl: nextLink?.href ?? null,
  }
}

export async function fetchUSGSData(siteId: string): Promise<USGSParameter[]> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const timeRange = `${yesterday.toISOString()}/${now.toISOString()}`

  const params = new URLSearchParams({
    monitoring_location_id: `USGS-${siteId}`,
    parameter_code: '00065,00060,00045,00010',
    time: timeRange,
    f: 'json',
    limit: '500',
  })

  const allFeatures: USGSFeature[] = []
  let nextUrl: string | null = `${BASE}?${params}`

  while (nextUrl) {
    const page = await fetchPage(nextUrl)
    allFeatures.push(...page.features)
    nextUrl = page.nextUrl
  }

  const features = allFeatures

  const grouped = new Map<string, USGSObservation[]>()
  const units = new Map<string, string>()

  for (const f of features) {
    const { parameter_code, time, value, unit_of_measure } = f.properties
    if (!grouped.has(parameter_code)) grouped.set(parameter_code, [])
    grouped.get(parameter_code)!.push({
      time,
      value: value === null ? null : parseFloat(value),
      unit: unit_of_measure,
    })
    if (!units.has(parameter_code)) units.set(parameter_code, unit_of_measure)
  }

  const DISPLAY_ORDER = ['00065', '00045', '00060', '00010']

  return Array.from(grouped.entries())
    .map(([code, observations]) => {
      const sorted = observations.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      )
      const info = PARAM_INFO[code] ?? { name: code, unit: units.get(code) ?? '' }
      return {
        code,
        name: info.name,
        unit: units.get(code) ?? info.unit,
        observations: sorted,
        latest: sorted.length > 0 ? sorted[sorted.length - 1] : null,
      }
    })
    .sort(
      (a, b) =>
        (DISPLAY_ORDER.indexOf(a.code) + 1 || DISPLAY_ORDER.length + 1) -
        (DISPLAY_ORDER.indexOf(b.code) + 1 || DISPLAY_ORDER.length + 1)
    )
    .filter((p) => p.observations.length > 0)
}
