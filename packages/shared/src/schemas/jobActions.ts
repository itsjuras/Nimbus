import { z } from 'zod'

export const MarkItemCompleteSchema = z.object({
  checklistItemId: z.string().uuid(),
  completed: z.boolean(),
})

export const RegisterPhotoSchema = z.object({
  checklistItemId: z.string().uuid(),
  storagePath: z.string().min(1),
})

export type MarkItemCompleteRequest = z.infer<typeof MarkItemCompleteSchema>
export type RegisterPhotoRequest = z.infer<typeof RegisterPhotoSchema>
