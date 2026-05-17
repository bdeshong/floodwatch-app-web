import { useQuery } from '@tanstack/react-query'
import { fetchGaugesInBounds } from '../api/floodwatch'
import type { MapBounds } from '../types'

export function useGauges(bounds: MapBounds | null) {
  return useQuery({
    queryKey: ['gauges', bounds],
    queryFn: () => fetchGaugesInBounds(bounds!),
    enabled: !!bounds,
    staleTime: 30_000,
    gcTime: 60_000,
  })
}
