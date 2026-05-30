import { z } from 'zod'

export const GenerateEmailDraftSchema = z.object({
  clientId: z.string().uuid(),
  prompt: z.string().min(1, 'Prompt is required').max(2000),
})

export const SendEmailSchema = z.object({
  clientId: z.string().uuid(),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(10000),
})

export type GenerateEmailDraftRequest = z.infer<typeof GenerateEmailDraftSchema>
export type SendEmailRequest = z.infer<typeof SendEmailSchema>

export interface EmailDraft {
  subject: string
  body: string
}
