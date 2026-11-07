import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/**
 * @param {{ page?: number, pageSize?: number, search?: string, order?: 'asc'|'desc' }} query
 */
export function useBatches(query = {}) {
  return useQuery({
    queryKey: queryKeys.batches(query),
    queryFn: () => services.academics.listBatches(query),
    staleTime: 60_000,
  })
}

/** @param {import('../../../contracts/ids.js').BatchId} batchId */
export function useBatch(batchId) {
  return useQuery({
    queryKey: queryKeys.batch(batchId),
    queryFn: () => services.academics.getBatch(batchId),
    enabled: Boolean(batchId),
  })
}

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: () => services.academics.listSubjects(),
    staleTime: 10 * 60_000,
  })
}
