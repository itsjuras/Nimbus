import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  ConnectStatus,
  PayrollPreview,
  PayrollRun,
  SaveCompanyBankRequest,
  SaveCrewBankRequest,
  RunPayrollRequest,
} from '@nimbus/shared'

const CONNECT_KEY = ['payroll', 'connect'] as const
const RUNS_KEY = ['payroll', 'runs'] as const

export function useConnectStatus() {
  return useQuery({
    queryKey: CONNECT_KEY,
    queryFn: () => api.get<ConnectStatus>('/api/v1/payroll/connect/status'),
  })
}

export function useStartOnboarding() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/v1/payroll/connect/onboard', {}),
  })
}

export function useSaveCompanyBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveCompanyBankRequest) =>
      api.post<{ bankLast4: string; bankName: string | null }>('/api/v1/payroll/company-bank', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONNECT_KEY }),
  })
}

export function useSaveCrewBank(profileId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveCrewBankRequest) =>
      api.post<{ bankLast4: string }>(`/api/v1/payroll/crew/${profileId}/bank`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew'] })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}

export function usePayrollPreview(from: string, to: string) {
  return useQuery({
    queryKey: ['payroll', 'preview', from, to] as const,
    queryFn: () => api.get<PayrollPreview>(`/api/v1/payroll/preview?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  })
}

export function useRunPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RunPayrollRequest) => api.post<PayrollRun>('/api/v1/payroll/run', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['wages'] })
    },
  })
}

export function usePayrollRuns() {
  return useQuery({
    queryKey: RUNS_KEY,
    queryFn: () => api.get<PayrollRun[]>('/api/v1/payroll/runs'),
  })
}
