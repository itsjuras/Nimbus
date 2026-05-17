import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Client } from '@nimbus/shared'

const CLIENTS_KEY = ['clients'] as const

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: () => api.get<Client[]>('/api/v1/clients'),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: () => api.get<Client>(`/api/v1/clients/${id}`),
    enabled: !!id,
  })
}
