import { useQuery } from '@tanstack/react-query'
import { fetchUSGSData } from '../api/usgs'

export function useUSGSData(siteId: string | null) {
  return useQuery({
    queryKey: ['usgs', siteId],
    queryFn: () => fetchUSGSData(siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60_000,
  })
}
