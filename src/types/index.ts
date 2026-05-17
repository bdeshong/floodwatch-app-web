export interface GaugeCapabilities {
  height: boolean
  precipitation: boolean
  discharge: boolean
  temperature_water: boolean
  lastUpdated: string
}

export interface NWSStages {
  currentStage: number | null
  action: number | null
  flood: number | null
  moderate: number | null
  major: number | null
  recordHeight: number | null
  lastUpdated: string
}

export interface Gauge {
  id: number
  name: string
  usgs: {
    id: string
    name: string
    capabilities: GaugeCapabilities
  }
  nws: {
    id: string | null
    stages: NWSStages
  }
  location: {
    latitude: number
    longitude: number
  }
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface USGSObservation {
  time: string
  value: number | null
  unit: string
}

export interface USGSParameter {
  code: string
  name: string
  unit: string
  observations: USGSObservation[]
  latest: USGSObservation | null
}
