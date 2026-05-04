import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Profile, InviteCrewRequest } from '@nimbus/shared'

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
