import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Invoice, CreateInvoiceRequest } from '@nimbus/shared'

const INVOICES_KEY = ['invoices'] as const

export function useInvoices() {
  return useQuery({
    queryKey: INVOICES_KEY,
    queryFn: () => api.get<Invoice[]>('/api/v1/invoices'),
    retry: false,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => api.post<Invoice>('/api/v1/invoices', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
  })
}
