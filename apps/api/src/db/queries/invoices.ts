import { supabase } from '../supabase.js'
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@nimbus/shared'

function toLineItem(row: Record<string, unknown>): InvoiceLineItem {
  return {
    id: row['id'] as string,
    invoiceId: row['invoice_id'] as string,
    description: row['description'] as string,
    quantity: row['quantity'] as number,
    unitAmountCents: row['unit_amount_cents'] as number,
  }
}

function toInvoice(row: Record<string, unknown>, items: InvoiceLineItem[]): Invoice {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    clientId: row['client_id'] as string,
    jobId: (row['job_id'] as string | null) ?? null,
    stripeInvoiceId: (row['stripe_invoice_id'] as string | null) ?? null,
    stripeInvoiceUrl: (row['stripe_invoice_url'] as string | null) ?? null,
    status: row['status'] as InvoiceStatus,
    currency: row['currency'] as string,
    dueDate: (row['due_date'] as string | null) ?? null,
    paidAt: (row['paid_at'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
    lineItems: items,
  }
}

export async function getInvoicesByCompany(companyId: string): Promise<Invoice[]> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!invoices || invoices.length === 0) return []

  const invoiceIds = (invoices as Record<string, unknown>[]).map((i) => i['id'] as string)

  const { data: items, error: itemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .in('invoice_id', invoiceIds)

  if (itemsError) throw itemsError

  const itemsByInvoice = new Map<string, InvoiceLineItem[]>()
  for (const item of (items ?? []) as Record<string, unknown>[]) {
    const invoiceId = item['invoice_id'] as string
    const existing = itemsByInvoice.get(invoiceId) ?? []
    existing.push(toLineItem(item))
    itemsByInvoice.set(invoiceId, existing)
  }

  return (invoices as Record<string, unknown>[]).map((row) =>
    toInvoice(row, itemsByInvoice.get(row['id'] as string) ?? []),
  )
}

export async function getInvoiceById(id: string, companyId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return null

  const { data: items } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)

  return toInvoice(
    data as Record<string, unknown>,
    ((items ?? []) as Record<string, unknown>[]).map(toLineItem),
  )
}

export async function createInvoiceRecord(input: {
  companyId: string
  clientId: string
  jobId?: string
  stripeInvoiceId: string
  stripeInvoiceUrl: string
  currency: string
  dueDate?: string
  lineItems: Array<{ description: string; quantity: number; unitAmountCents: number }>
}): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      company_id: input.companyId,
      client_id: input.clientId,
      job_id: input.jobId ?? null,
      stripe_invoice_id: input.stripeInvoiceId,
      stripe_invoice_url: input.stripeInvoiceUrl,
      currency: input.currency,
      due_date: input.dueDate ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create invoice')

  const invoiceId = (data as Record<string, unknown>)['id'] as string

  const { data: items, error: itemsError } = await supabase
    .from('invoice_line_items')
    .insert(
      input.lineItems.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_amount_cents: item.unitAmountCents,
      })),
    )
    .select()

  if (itemsError) throw itemsError

  return toInvoice(
    data as Record<string, unknown>,
    ((items ?? []) as Record<string, unknown>[]).map(toLineItem),
  )
}

export async function updateInvoiceStatus(
  stripeInvoiceId: string,
  status: InvoiceStatus,
  paidAt?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (paidAt) patch['paid_at'] = paidAt

  await supabase
    .from('invoices')
    .update(patch)
    .eq('stripe_invoice_id', stripeInvoiceId)
}

export async function getClientStripeCustomerId(clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('id', clientId)
    .single()

  return (data as Record<string, unknown> | null)?.['stripe_customer_id'] as string | null ?? null
}

export async function setClientStripeCustomerId(
  clientId: string,
  stripeCustomerId: string,
): Promise<void> {
  await supabase
    .from('clients')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', clientId)
}
