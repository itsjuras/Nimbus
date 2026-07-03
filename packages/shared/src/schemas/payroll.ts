import { z } from 'zod'

const routingNumber = z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits')
const accountNumber = z.string().regex(/^\d{4,17}$/, 'Account number must be 4–17 digits')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

export const SaveCompanyBankSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required').max(100),
  routingNumber,
  accountNumber,
  accountType: z.enum(['checking', 'savings']).default('checking'),
})

export const SaveCrewBankSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required').max(100),
  routingNumber,
  accountNumber,
})

export const RunPayrollSchema = z.object({
  from: isoDate,
  to: isoDate,
})

export type SaveCompanyBankRequest = z.infer<typeof SaveCompanyBankSchema>
export type SaveCrewBankRequest = z.infer<typeof SaveCrewBankSchema>
export type RunPayrollRequest = z.infer<typeof RunPayrollSchema>
