import { z } from 'zod'

export const InvoiceLineItemInputSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().positive(),
})

export const CreateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  currency: z.string().length(3).default('usd'),
  lineItems: z.array(InvoiceLineItemInputSchema).min(1, 'Add at least one line item'),
})

export type InvoiceLineItemInput = z.infer<typeof InvoiceLineItemInputSchema>
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceSchema>
