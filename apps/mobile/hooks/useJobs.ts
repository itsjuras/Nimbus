import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Job, JobDetail, UpdateJobRequest, JobFilters, CreateJobRequest, Checklist } from '@nimbus/shared'

export const JOBS_KEY = ['jobs'] as const

function filtersToParams(filters: JobFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: [...JOBS_KEY, filters],
    queryFn: () => api.get<Job[]>(`/api/v1/jobs${filtersToParams(filters)}`),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: [...JOBS_KEY, id],
    queryFn: () => api.get<JobDetail>(`/api/v1/jobs/${id}`),
    enabled: !!id,
  })
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateJobRequest) => api.patch<Job>(`/api/v1/jobs/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useStartJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Job>(`/api/v1/jobs/${id}/start`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateJobRequest) => api.post<Job>('/api/v1/jobs', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useClientChecklist(clientId: string | null) {
  return useQuery({
    queryKey: ['checklists', clientId],
    queryFn: () => api.get<Checklist>(`/api/v1/checklists/${clientId}`),
    enabled: !!clientId,
  })
}
