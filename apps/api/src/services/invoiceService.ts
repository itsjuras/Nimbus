import { getStripe } from '../lib/stripe.js'
import { getClientById } from '../db/queries/clients.js'
import {
  getInvoicesByCompany,
  getInvoiceById,
  createInvoiceRecord,
  updateInvoiceStatus,
  getClientStripeCustomerId,
  setClientStripeCustomerId,
} from '../db/queries/invoices.js'
import { AppError } from '../middleware/errorHandler.js'
import { handlePayrollWebhookEvent } from './payrollService.js'
import type { Invoice, CreateInvoiceRequest } from '@nimbus/shared'

export async function listInvoices(companyId: string): Promise<Invoice[]> {
  return getInvoicesByCompany(companyId)
}

export async function getInvoice(id: string, companyId: string): Promise<Invoice> {
  const invoice = await getInvoiceById(id, companyId)
  if (!invoice) throw new AppError('INVOICE_NOT_FOUND', 'No invoice found with that ID', 404)
  return invoice
}

export async function createInvoice(
  companyId: string,
  input: CreateInvoiceRequest,
): Promise<Invoice> {
  const client = await getClientById(input.clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  // Get or create Stripe customer for this client
  let stripeCustomerId = await getClientStripeCustomerId(input.clientId)

  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      name: client.name,
      ...(client.contactEmail && { email: client.contactEmail }),
      ...(client.address && { address: { line1: client.address, country: 'US' } }),
      metadata: { nimbus_client_id: input.clientId, nimbus_company_id: companyId },
    })
    stripeCustomerId = customer.id
    await setClientStripeCustomerId(input.clientId, stripeCustomerId)
  }

  // Create the Stripe invoice. collection_method 'send_invoice' is required for
  // emailing the client a payable invoice, and it demands a due date — default
  // to 30 days out when none was picked.
  const stripeInvoice = await getStripe().invoices.create({
    customer: stripeCustomerId,
    currency: input.currency,
    collection_method: 'send_invoice',
    ...(input.dueDate
      ? { due_date: Math.floor(new Date(input.dueDate).getTime() / 1000) }
      : { days_until_due: 30 }),
    auto_advance: false, // We control when it gets sent
    metadata: { nimbus_company_id: companyId, ...(input.jobId && { nimbus_job_id: input.jobId }) },
  })

  // Add line items to Stripe invoice
  await Promise.all(
    input.lineItems.map((item) =>
      getStripe().invoiceItems.create({
        customer: stripeCustomerId as string,
        invoice: stripeInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: item.unitAmountCents,
        currency: input.currency,
      }),
    ),
  )

  // Retrieve updated invoice to get hosted URL
  const finalised = await getStripe().invoices.retrieve(stripeInvoice.id)

  return createInvoiceRecord({
    companyId,
    clientId: input.clientId,
    ...(input.jobId && { jobId: input.jobId }),
    stripeInvoiceId: finalised.id,
    stripeInvoiceUrl: finalised.hosted_invoice_url ?? '',
    currency: input.currency,
    ...(input.dueDate && { dueDate: input.dueDate }),
    lineItems: input.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmountCents: item.unitAmountCents,
    })),
  })
}

export async function sendInvoice(id: string, companyId: string): Promise<Invoice> {
  const invoice = await getInvoiceById(id, companyId)
  if (!invoice) throw new AppError('INVOICE_NOT_FOUND', 'No invoice found with that ID', 404)

  if (invoice.status !== 'draft') {
    throw new AppError('INVOICE_NOT_DRAFT', 'Only draft invoices can be sent', 400)
  }

  if (!invoice.stripeInvoiceId) {
    throw new AppError('INVOICE_NO_STRIPE_ID', 'Invoice is not linked to Stripe', 500)
  }

  // Finalise and send via Stripe — this emails the client directly.
  // The hosted payment URL only exists once the invoice is finalised,
  // so capture it here rather than at creation time.
  const sent = await getStripe().invoices.sendInvoice(invoice.stripeInvoiceId)

  await updateInvoiceStatus(invoice.stripeInvoiceId, 'sent', undefined, sent.hosted_invoice_url ?? undefined)

  return getInvoice(id, companyId)
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string,
  secret: string,
): Promise<void> {
  let event

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    throw new AppError('WEBHOOK_INVALID', 'Invalid Stripe webhook signature', 400)
  }

  // Payroll events (funding debits, Connect account updates) are handled separately
  if (await handlePayrollWebhookEvent(event)) return

  if (event.type === 'invoice.paid') {
    const inv = event.data.object
    await updateInvoiceStatus(inv.id, 'paid', new Date(inv.status_transitions.paid_at! * 1000).toISOString())
  }

  if (event.type === 'invoice.voided') {
    const inv = event.data.object
    await updateInvoiceStatus(inv.id, 'void')
  }
}
