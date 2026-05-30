import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { WageEntry, LogWageRequest } from '@nimbus/shared'

const KEY = ['wages'] as const

export function useWageEntries() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<WageEntry[]>('/api/v1/wages'),
  })
}

export function useJobWages(jobId: string) {
  return useQuery({
    queryKey: [...KEY, 'job', jobId],
    queryFn: () => api.get<WageEntry[]>(`/api/v1/jobs/${jobId}/wages`),
    enabled: !!jobId,
  })
}

export function useLogHoursForJob(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { profileId: string; hours: number }) =>
      api.post<WageEntry>(`/api/v1/jobs/${jobId}/wages`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, 'job', jobId] })
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export function useLogWage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LogWageRequest) => api.post<WageEntry>('/api/v1/wages', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
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
