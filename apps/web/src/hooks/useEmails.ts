import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  EmailDraft,
  GenerateEmailDraftRequest,
  SendEmailRequest,
  ReplyEmailRequest,
  GmailStatus,
  InboxThread,
  InboxThreadDetail,
} from '@nimbus/shared'

export function useGenerateDraft() {
  return useMutation({
    mutationFn: (data: GenerateEmailDraftRequest) =>
      api.post<EmailDraft>('/api/v1/emails/draft', data),
  })
}

export function useSendEmail() {
  return useMutation({
    mutationFn: (data: SendEmailRequest) =>
      api.post<{ ok: boolean }>('/api/v1/emails/send', data),
  })
}

// ── Gmail integration ─────────────────────────────────────────────────────────

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail', 'status'] as const,
    queryFn: () => api.get<GmailStatus>('/api/v1/company/gmail/status'),
  })
}

export function useConnectGmail() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/v1/company/gmail/connect', {}),
  })
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<{ ok: boolean }>('/api/v1/company/gmail'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gmail'] }),
  })
}

export function useInbox(enabled: boolean) {
  return useQuery({
    queryKey: ['gmail', 'inbox'] as const,
    queryFn: () => api.get<InboxThread[]>('/api/v1/emails/inbox'),
    enabled,
    refetchInterval: 60_000,
  })
}

export function useSentEmails(enabled: boolean) {
  return useQuery({
    queryKey: ['gmail', 'sent'] as const,
    queryFn: () => api.get<InboxThread[]>('/api/v1/emails/sent'),
    enabled,
    refetchInterval: 60_000,
  })
}

export function useInboxThread(threadId: string | null) {
  return useQuery({
    queryKey: ['gmail', 'thread', threadId] as const,
    queryFn: () => api.get<InboxThreadDetail>(`/api/v1/emails/threads/${threadId}`),
    enabled: !!threadId,
  })
}

export function useReplyToThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReplyEmailRequest) => api.post<{ ok: boolean }>('/api/v1/emails/reply', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gmail', 'thread', variables.threadId] })
      queryClient.invalidateQueries({ queryKey: ['gmail', 'inbox'] })
    },
  })
}
