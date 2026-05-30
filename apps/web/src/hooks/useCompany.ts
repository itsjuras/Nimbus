import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CompanySettings, UpdateCompanySettingsRequest } from '@nimbus/shared'

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company', 'settings'],
    queryFn: () => api.get<CompanySettings>('/api/v1/company/settings'),
  })
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCompanySettingsRequest) =>
      api.patch<CompanySettings>('/api/v1/company/settings', data),
    onSuccess: (updated) => {
      qc.setQueryData(['company', 'settings'], updated)
    },
  })
}
