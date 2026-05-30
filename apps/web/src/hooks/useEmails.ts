import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { EmailDraft, GenerateEmailDraftRequest, SendEmailRequest } from '@nimbus/shared'

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
