import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGauges } from '../hooks/useGauges'
import { useColorScheme } from '../hooks/useColorScheme'
import { GaugeModal } from './GaugeModal'
import type { Gauge, MapBounds } from '../types'

const DEFAULT_ZOOM = 12
const MIN_ZOOM = 8

const GAUGE_ICON = L.divIcon({
  className: '',
  html: '<div class="gauge-marker-wrap"><span class="gauge-ring"></span><div class="gauge-dot"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  tooltipAnchor: [0, -13],
})

interface MapControllerProps {
  onBoundsChange: (bounds: MapBounds, zoom: number) => void
}

function GeolocateOnMount() {
  const map = useMap()

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM),
      () => { /* denied or unavailable — stay on Atlanta default */ },
      { timeout: 8000, maximumAge: 60_000 }
    )
  }, [map])

  return null
}

function MapController({ onBoundsChange }: MapControllerProps) {
  const map = useMap()

  const update = useCallback(() => {
    const b = map.getBounds()
    onBoundsChange(
      { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() },
      map.getZoom()
    )
  }, [map, onBoundsChange])

  useMapEvents({ moveend: update, zoomend: update })
  useEffect(() => { update() }, [update])

  return null
}

const pillStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 500,
  background: 'var(--pill-bg)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  padding: '7px 16px',
  fontSize: 11,
  color: 'var(--text-secondary)',
  pointerEvents: 'none' as const,
  letterSpacing: '0.04em',
  boxShadow: '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
  animation: 'fade-up 0.2s ease both',
}

export function FloodMap() {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [selected, setSelected] = useState<Gauge | null>(null)

  const handleBoundsChange = useCallback((b: MapBounds, z: number) => {
    setBounds(b)
    setZoom(z)
  }, [])

  const scheme = useColorScheme()
  const tileUrl = scheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const activeBounds = zoom >= MIN_ZOOM ? bounds : null
  const { data: gauges = [], isFetching } = useGauges(activeBounds)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[33.749, -84.388]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          subdomains="abcd"
          maxZoom={19}
        />
        <GeolocateOnMount />
        <MapController onBoundsChange={handleBoundsChange} />
        {gauges.map((gauge) => (
          <Marker
            key={gauge.id}
            position={[gauge.location.latitude, gauge.location.longitude]}
            icon={GAUGE_ICON}
            eventHandlers={{ click: () => setSelected(gauge) }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={1}>
              {gauge.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Loading */}
      {isFetching && (
        <div style={{ ...pillStyle, top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', width: 8, height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="live-ring" style={{ animationDuration: '1.2s' }} />
            <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', position: 'relative', zIndex: 1 }} />
          </div>
          Loading gauges
        </div>
      )}

      {/* Zoom hint */}
      {zoom < MIN_ZOOM && (
        <div style={{ ...pillStyle, bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
          Zoom in to see gauges
        </div>
      )}

      {/* Gauge count */}
      {zoom >= MIN_ZOOM && !isFetching && gauges.length > 0 && (
        <div style={{ ...pillStyle, bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{gauges.length}</span>
          {' '}gauge{gauges.length !== 1 ? 's' : ''} in view
        </div>
      )}

      {selected && <GaugeModal gauge={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
