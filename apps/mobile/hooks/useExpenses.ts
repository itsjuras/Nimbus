import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Expense, CreateExpenseRequest, UpdateExpenseStatusRequest } from '@nimbus/shared'

const KEY = ['expenses'] as const

export function useExpenses() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Expense[]>('/api/v1/expenses'),
    retry: false,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => api.post<Expense>('/api/v1/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export function useReviewExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateExpenseStatusRequest & { id: string }) =>
      api.patch<Expense>(`/api/v1/expenses/${id}/status`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}
