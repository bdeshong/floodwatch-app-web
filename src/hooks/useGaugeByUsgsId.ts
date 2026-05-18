import { useQuery } from '@tanstack/react-query'
import { fetchGaugeByUsgsId } from '../api/floodwatch'

export function useGaugeByUsgsId(usgsId: string | undefined) {
  return useQuery({
    queryKey: ['gauge-by-usgs-id', usgsId],
    queryFn: () => fetchGaugeByUsgsId(usgsId!),
    enabled: !!usgsId,
    staleTime: 30_000,
    retry: 1,
  })
}
