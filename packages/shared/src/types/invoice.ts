export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void'

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitAmountCents: number
}

export interface Invoice {
  id: string
  companyId: string
  clientId: string
  jobId: string | null
  stripeInvoiceId: string | null
  stripeInvoiceUrl: string | null
  status: InvoiceStatus
  currency: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  lineItems: InvoiceLineItem[]
}
