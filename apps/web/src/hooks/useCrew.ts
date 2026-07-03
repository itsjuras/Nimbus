import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Profile, InviteCrewRequest, UpdatePayRateRequest, Job } from '@nimbus/shared'

const CREW_KEY = ['crew'] as const

export function useCrewMembers() {
  return useQuery({
    queryKey: CREW_KEY,
    queryFn: () => api.get<Profile[]>('/api/v1/crew'),
  })
}

export function useInviteCrew() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteCrewRequest) => api.post<{ profile: Profile }>('/api/v1/crew/invite', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREW_KEY }),
  })
}

export function useCrewMemberJobs(profileId: string) {
  return useQuery({
    queryKey: ['crew', profileId, 'jobs'] as const,
    queryFn: () => api.get<Job[]>(`/api/v1/crew/${profileId}/jobs`),
    enabled: !!profileId,
  })
}

export function useUpdateCrewMember(profileId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePayRateRequest) => api.patch<Profile>(`/api/v1/crew/${profileId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREW_KEY }),
  })
}
