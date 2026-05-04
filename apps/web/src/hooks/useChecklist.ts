import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ReplaceChecklistRequest, Checklist, ChecklistItem } from '@nimbus/shared'

interface ChecklistWithItems {
  checklist: Checklist
  items: ChecklistItem[]
}

export function useChecklist(clientId: string) {
  return useQuery({
    queryKey: ['checklists', clientId],
    queryFn: () => api.get<ChecklistWithItems | null>(`/api/v1/checklists/${clientId}`),
    enabled: !!clientId,
  })
}

export function useReplaceChecklist(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReplaceChecklistRequest) =>
      api.put<ChecklistWithItems>(`/api/v1/checklists/${clientId}`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['checklists', clientId], updated)
    },
  })
}
