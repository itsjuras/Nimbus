import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Checklist, ChecklistItem } from '@nimbus/shared'

export interface ChecklistWithItems {
  checklist: Checklist
  items: ChecklistItem[]
}

export interface ChecklistItemDraft {
  label: string
  requiresPhoto: boolean
  position: number
}

const KEY = (clientId: string) => ['checklists', clientId]

export function useClientChecklist(clientId: string | null) {
  return useQuery({
    queryKey: KEY(clientId ?? ''),
    queryFn: () => api.get<ChecklistWithItems | null>(`/api/v1/checklists/${clientId}`),
    enabled: !!clientId,
  })
}

export function useUpdateChecklist(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; items: ChecklistItemDraft[] }) =>
      api.put<ChecklistWithItems>(`/api/v1/checklists/${clientId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(clientId) }),
  })
}
