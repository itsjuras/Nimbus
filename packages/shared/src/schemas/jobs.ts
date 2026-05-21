import { z } from 'zod'

export const CreateJobSchema = z.object({
  clientId: z.string().uuid(),
  checklistId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  crewIds: z.array(z.string().uuid()).min(1, 'Assign at least one crew member'),
})

export const UpdateJobSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  crewIds: z.array(z.string().uuid()).optional(),
})

export const JobFiltersSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'missed']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export type CreateJobRequest = z.infer<typeof CreateJobSchema>
export type UpdateJobRequest = z.infer<typeof UpdateJobSchema>
export type JobFilters = z.infer<typeof JobFiltersSchema>
