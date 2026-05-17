import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGauges } from '../hooks/useGauges'
import { useColorScheme } from '../hooks/useColorScheme'
import { GaugeModal } from './GaugeModal'
import type { Gauge, MapBounds } from '../types'

const ATLANTA: [number, number] = [33.749, -84.388]
const DEFAULT_ZOOM = 10
const MIN_ZOOM = 8

const GAUGE_ICON = L.divIcon({
  className: '',
  html: '<div class="gauge-marker-wrap"><div class="gauge-dot"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  tooltipAnchor: [0, -13],
})

interface MapControllerProps {
  onBoundsChange: (bounds: MapBounds, zoom: number) => void
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
  backdropFilter: 'blur(8px)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '6px 14px',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 11,
  color: 'var(--text-primary)',
  pointerEvents: 'none' as const,
  letterSpacing: '0.04em',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
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
        center={ATLANTA}
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
        <div style={{ ...pillStyle, top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
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
        <div style={{ ...pillStyle, bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{ color: 'var(--accent)' }}>{gauges.length}</span>
          {' '}gauge{gauges.length !== 1 ? 's' : ''} in view
        </div>
      )}

      {selected && <GaugeModal gauge={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
