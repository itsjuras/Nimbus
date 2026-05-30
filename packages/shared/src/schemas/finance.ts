import { z } from 'zod'

export const CreateExpenseSchema = z.object({
  amountCents: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(300),
  category: z.enum(['supplies', 'other']).default('supplies'),
  jobId: z.string().uuid().optional(),
  receiptStoragePath: z.string().optional(),
})

export const UpdateExpenseStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export const LogWageSchema = z.object({
  profileId: z.string().uuid(),
  payType: z.enum(['hourly', 'per_job']),
  hours: z.number().positive().optional(),
  rateCents: z.number().int().positive(),
  totalCents: z.number().int().positive(),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  jobId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export const UpdatePayRateSchema = z.object({
  payType: z.enum(['hourly', 'per_job']),
  payRateCents: z.number().int().nonnegative(),
})

export const FinancePeriodSchema = z.object({
  from: z.string(),
  to: z.string(),
})

export type CreateExpenseRequest = z.infer<typeof CreateExpenseSchema>
export type UpdateExpenseStatusRequest = z.infer<typeof UpdateExpenseStatusSchema>
export type LogWageRequest = z.infer<typeof LogWageSchema>
export type UpdatePayRateRequest = z.infer<typeof UpdatePayRateSchema>
export type FinancePeriodRequest = z.infer<typeof FinancePeriodSchema>
