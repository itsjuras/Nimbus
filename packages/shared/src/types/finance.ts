export type ExpenseCategory = 'supplies' | 'other'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type PayType = 'hourly' | 'per_job'

export interface Expense {
  id: string
  companyId: string
  submittedBy: string
  submittedByName: string | null
  jobId: string | null
  amountCents: number
  description: string
  category: ExpenseCategory
  receiptStoragePath: string | null
  status: ExpenseStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface WageEntry {
  id: string
  companyId: string
  profileId: string
  profileName: string | null
  jobId: string | null
  payType: PayType
  hours: number | null
  rateCents: number
  totalCents: number
  periodDate: string
  notes: string | null
  createdAt: string
}

export interface FinanceSummary {
  revenueCents: number
  supplyCostsCents: number
  wageCostsCents: number
  totalCostsCents: number
  profitCents: number
  period: { from: string; to: string }
}
