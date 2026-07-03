import { z } from 'zod'

// Canadian bank account numbering
const transitNumber = z.string().regex(/^\d{5}$/, 'Transit number must be 5 digits')
const institutionNumber = z.string().regex(/^\d{3}$/, 'Institution number must be 3 digits')
const accountNumber = z.string().regex(/^\d{5,12}$/, 'Account number must be 5–12 digits')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

export const SaveCompanyBankSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required').max(100),
  transitNumber,
  institutionNumber,
  accountNumber,
})

export const VerifyCompanyBankSchema = z.object({
  amounts: z.tuple([
    z.number().int().positive('Amount must be positive'),
    z.number().int().positive('Amount must be positive'),
  ]),
})

// Stripe requires full identity for payout recipients (Canadian KYC)
export const SaveCrewBankSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required').max(100),
  transitNumber,
  institutionNumber,
  accountNumber,
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required').max(20),
  dateOfBirth: isoDate,
  addressLine1: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  province: z.string().length(2, 'Use the 2-letter province code (e.g. BC)'),
  postalCode: z.string().min(6, 'Valid postal code is required').max(7),
})

export const RunPayrollSchema = z.object({
  from: isoDate,
  to: isoDate,
})

export type SaveCompanyBankRequest = z.infer<typeof SaveCompanyBankSchema>
export type VerifyCompanyBankRequest = z.infer<typeof VerifyCompanyBankSchema>
export type SaveCrewBankRequest = z.infer<typeof SaveCrewBankSchema>
export type RunPayrollRequest = z.infer<typeof RunPayrollSchema>
