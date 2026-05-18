import { z } from 'zod'

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
})

export const UpdateClientSchema = CreateClientSchema.partial()

export const ChecklistItemInputSchema = z.object({
  label: z.string().min(1).max(300),
  requiresPhoto: z.boolean(),
  position: z.number().int().nonnegative(),
})

export const ReplaceChecklistSchema = z.object({
  name: z.string().min(1).max(200),
  items: z.array(ChecklistItemInputSchema),
})

export type CreateClientRequest = z.infer<typeof CreateClientSchema>
export type UpdateClientRequest = z.infer<typeof UpdateClientSchema>
export type ChecklistItemInput = z.infer<typeof ChecklistItemInputSchema>
export type ReplaceChecklistRequest = z.infer<typeof ReplaceChecklistSchema>
