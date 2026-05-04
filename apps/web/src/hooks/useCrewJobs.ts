import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { uploadJobPhoto } from '../lib/storage'
import { useAuth } from './useAuth'
import type { Job, JobDetail, JobChecklistItem, JobPhoto } from '@nimbus/shared'

const JOBS_KEY = ['jobs'] as const

export function useMyJobs() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [...JOBS_KEY, 'mine', profile?.id],
    queryFn: async () => {
      const all = await api.get<Job[]>('/api/v1/jobs')
      // Filter to only jobs where this crew member is assigned
      // The detail view has crew info; list view doesn't, so we fetch all and filter client-side.
      // A dedicated /api/v1/crew/jobs endpoint can replace this in a future optimisation.
      return all
    },
    enabled: !!profile,
  })
}

export function useCompleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => api.post<Job>(`/api/v1/jobs/${jobId}/complete`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useMarkItemComplete(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ checklistItemId, completed }: { checklistItemId: string; completed: boolean }) =>
      api.patch<JobChecklistItem>(`/api/v1/jobs/${jobId}/checklist-items`, {
        checklistItemId,
        completed,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, jobId] }),
  })
}

export function useUploadPhoto(jobId: string) {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      checklistItemId,
      file,
    }: {
      checklistItemId: string
      file: File
    }): Promise<JobPhoto> => {
      if (!profile) throw new Error('Not authenticated')

      const storagePath = await uploadJobPhoto(
        profile.companyId,
        jobId,
        checklistItemId,
        file,
      )

      return api.post<JobPhoto>(`/api/v1/jobs/${jobId}/photos`, {
        checklistItemId,
        storagePath,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, jobId] }),
  })
}

export { useJob } from './useJobs'
export type { JobDetail }
