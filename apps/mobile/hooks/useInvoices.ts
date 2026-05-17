import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Invoice } from '@nimbus/shared'

const INVOICES_KEY = ['invoices'] as const

export function useInvoices() {
  return useQuery({
    queryKey: INVOICES_KEY,
    queryFn: () => api.get<Invoice[]>('/api/v1/invoices'),
    retry: false,
  })
}
