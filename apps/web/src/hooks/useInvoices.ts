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

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    queryFn: () => api.get<Invoice>(`/api/v1/invoices/${id}`),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => api.post<Invoice>('/api/v1/invoices', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
  })
}

export function useSendInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Invoice>(`/api/v1/invoices/${id}/send`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
  })
}
