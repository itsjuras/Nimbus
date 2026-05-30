import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { WageEntry } from '@nimbus/shared'

const KEY = ['wages'] as const

export function useWageEntries() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<WageEntry[]>('/api/v1/wages'),
    retry: false,
  })
}

export function useDeleteWageEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/wages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}
