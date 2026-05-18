import { useQuery } from '@tanstack/react-query'
import { fetchUSGSData } from '../api/usgs'

export function useUSGSData(siteId: string | null, days = 1) {
  return useQuery({
    queryKey: ['usgs', siteId, days],
    queryFn: () => fetchUSGSData(siteId!, days),
    enabled: !!siteId,
    staleTime: 5 * 60_000,
  })
}
