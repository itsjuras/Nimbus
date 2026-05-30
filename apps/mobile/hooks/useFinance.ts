import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { FinanceSummary } from '@nimbus/shared'

export function useFinanceSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['finance', 'summary', from, to],
    queryFn: () =>
      api.get<FinanceSummary>(`/api/v1/finance/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    enabled: !!from && !!to,
    retry: false,
  })
}
