import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useGauges } from '../hooks/useGauges'
import { GaugeModal } from './GaugeModal'
import type { Gauge, MapBounds } from '../types'

const ATLANTA: [number, number] = [33.749, -84.388]
const DEFAULT_ZOOM = 10
const MIN_ZOOM = 8

const MARKER_STYLE = {
  fillColor: '#3b82f6',
  color: '#1d4ed8',
  weight: 1.5,
  opacity: 1,
  fillOpacity: 0.85,
}

const MARKER_HOVER_STYLE = {
  ...MARKER_STYLE,
  fillColor: '#1d4ed8',
}

interface MapControllerProps {
  onBoundsChange: (bounds: MapBounds, zoom: number) => void
}

function MapController({ onBoundsChange }: MapControllerProps) {
  const map = useMap()

  const update = useCallback(() => {
    const b = map.getBounds()
    onBoundsChange(
      {
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      },
      map.getZoom()
    )
  }, [map, onBoundsChange])

  useMapEvents({ moveend: update, zoomend: update })
  useEffect(() => { update() }, [update])

  return null
}

export function FloodMap() {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [selected, setSelected] = useState<Gauge | null>(null)

  const handleBoundsChange = useCallback((b: MapBounds, z: number) => {
    setBounds(b)
    setZoom(z)
  }, [])

  const activeBounds = zoom >= MIN_ZOOM ? bounds : null
  const { data: gauges = [], isFetching } = useGauges(activeBounds)

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={ATLANTA}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <MapController onBoundsChange={handleBoundsChange} />
        {gauges.map((gauge) => (
          <CircleMarker
            key={gauge.id}
            center={[gauge.location.latitude, gauge.location.longitude]}
            radius={7}
            pathOptions={MARKER_STYLE}
            eventHandlers={{
              click: () => setSelected(gauge),
              mouseover: (e) => e.target.setStyle(MARKER_HOVER_STYLE),
              mouseout: (e) => e.target.setStyle(MARKER_STYLE),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{gauge.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Loading indicator */}
      {isFetching && (
        <div className="absolute top-3 right-3 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md flex items-center gap-2 text-xs text-gray-600 font-medium">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading gauges…
        </div>
      )}

      {/* Zoom hint */}
      {zoom < MIN_ZOOM && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md text-sm text-gray-600 pointer-events-none">
          Zoom in to see gauges
        </div>
      )}

      {/* Gauge count */}
      {zoom >= MIN_ZOOM && !isFetching && gauges.length > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md text-xs text-gray-500 pointer-events-none">
          {gauges.length} gauge{gauges.length !== 1 ? 's' : ''} in view
        </div>
      )}

      {selected && <GaugeModal gauge={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
