import { z } from 'zod'

export const SignUpSchema = z.object({
  companyName: z.string().min(1).max(100),
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

export const InviteCrewSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  role: z.enum(['manager', 'crew']),
})

export type SignUpRequest = z.infer<typeof SignUpSchema>
export type InviteCrewRequest = z.infer<typeof InviteCrewSchema>
