import { z } from 'zod'

export const GenerateEmailDraftSchema = z.object({
  clientId: z.string().uuid().optional(),
  recipientName: z.string().max(200).optional(),
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  threadContext: z.string().max(8000).optional(),
})

export const SendEmailSchema = z.object({
  clientId: z.string().uuid(),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(10000),
})

export const ReplyEmailSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1, 'Body is required').max(10000),
})

export type GenerateEmailDraftRequest = z.infer<typeof GenerateEmailDraftSchema>
export type SendEmailRequest = z.infer<typeof SendEmailSchema>
export type ReplyEmailRequest = z.infer<typeof ReplyEmailSchema>

export interface EmailDraft {
  subject: string
  body: string
}

// ── Gmail integration ─────────────────────────────────────────────────────────

export interface GmailStatus {
  connected: boolean
  email: string | null
}

export interface InboxThread {
  id: string
  subject: string
  fromName: string
  fromEmail: string
  snippet: string
  date: string
  unread: boolean
  messageCount: number
  clientId: string | null
  clientName: string | null
}

export interface InboxMessage {
  id: string
  fromName: string
  fromEmail: string
  to: string
  date: string
  body: string
  isOwn: boolean
}

export interface InboxThreadDetail {
  id: string
  subject: string
  clientId: string | null
  clientName: string | null
  messages: InboxMessage[]
}
