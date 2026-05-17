import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { uploadJobPhoto } from '../lib/storage'
import { useAuth } from './useAuth'
import { JOBS_KEY } from './useJobs'
import type { Job, JobChecklistItem, JobPhoto } from '@nimbus/shared'

export function useMyJobs() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [...JOBS_KEY, 'mine', profile?.id],
    queryFn: () => api.get<Job[]>('/api/v1/jobs'),
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
    onMutate: async ({ checklistItemId, completed }) => {
      await queryClient.cancelQueries({ queryKey: [...JOBS_KEY, jobId] })
      const previous = queryClient.getQueryData([...JOBS_KEY, jobId])
      queryClient.setQueryData([...JOBS_KEY, jobId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const job = old as { checklistItems: Array<{ checklistItemId: string; completed: boolean }> }
        return {
          ...job,
          checklistItems: job.checklistItems.map((item) =>
            item.checklistItemId === checklistItemId ? { ...item, completed } : item,
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...JOBS_KEY, jobId], context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, jobId] }),
  })
}

export function useUploadPhoto(jobId: string) {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      checklistItemId,
      localUri,
    }: {
      checklistItemId: string
      localUri: string
    }): Promise<JobPhoto> => {
      if (!profile) throw new Error('Not authenticated')

      const storagePath = await uploadJobPhoto(
        profile.companyId,
        jobId,
        checklistItemId,
        localUri,
      )

      return api.post<JobPhoto>(`/api/v1/jobs/${jobId}/photos`, {
        checklistItemId,
        storagePath,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, jobId] }),
  })
}
