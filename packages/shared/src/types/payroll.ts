export type PayrollRunStatus = 'funding' | 'paying' | 'paid' | 'failed'
export type PayrollRunItemStatus = 'pending' | 'paid' | 'failed'

export interface PayrollRunItem {
  id: string
  payrollRunId: string
  profileId: string
  profileName: string | null
  amountCents: number
  status: PayrollRunItemStatus
  failureMessage: string | null
}

export interface PayrollRun {
  id: string
  companyId: string
  initiatedBy: string
  periodFrom: string
  periodTo: string
  totalCents: number
  status: PayrollRunStatus
  failureMessage: string | null
  createdAt: string
  paidAt: string | null
  items: PayrollRunItem[]
}

export interface PayrollPreviewLine {
  profileId: string
  profileName: string
  entryCount: number
  totalCents: number
  hasBank: boolean
}

export interface PayrollPreview {
  lines: PayrollPreviewLine[]
  totalCents: number
  payableCents: number
  onboardingComplete: boolean
  companyBankSaved: boolean
}

export type CompanyBankStatus = 'none' | 'pending_verification' | 'verified'

export interface ConnectStatus {
  connected: boolean
  onboardingComplete: boolean
  payoutsEnabled: boolean
  companyBankStatus: CompanyBankStatus
  companyBankLast4: string | null
  companyBankName: string | null
}
