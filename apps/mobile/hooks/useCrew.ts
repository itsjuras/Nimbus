import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Profile } from '@nimbus/shared'

const CREW_KEY = ['crew'] as const

export function useCrewMembers() {
  return useQuery({
    queryKey: CREW_KEY,
    queryFn: () => api.get<Profile[]>('/api/v1/crew'),
  })
}

export function useCrewMember(id: string) {
  return useQuery({
    queryKey: [...CREW_KEY, id],
    queryFn: () => api.get<Profile>(`/api/v1/crew/${id}`),
    enabled: !!id,
  })
}
