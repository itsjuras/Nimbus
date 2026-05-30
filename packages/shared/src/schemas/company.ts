import { z } from 'zod'

export const UpdateCompanySettingsSchema = z.object({
  companyName: z.string().min(1).max(200).nullable().optional(),
  replyToEmail: z.string().email().nullable().optional(),
})

export type UpdateCompanySettingsRequest = z.infer<typeof UpdateCompanySettingsSchema>
