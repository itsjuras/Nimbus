import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Client, CreateClientRequest } from '@nimbus/shared'

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

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientRequest) => api.post<Client>('/api/v1/clients', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateClientRequest>) => api.patch<Client>(`/api/v1/clients/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
}
