import type Stripe from 'stripe'
import { getStripe } from '../lib/stripe.js'
import { AppError } from '../middleware/errorHandler.js'
import {
  getCompanyPayrollData,
  updateCompanyPayrollData,
  getCompanyIdByStripeAccount,
  getProfilePayoutAccount,
  setProfilePayoutAccount,
  getPayoutAccountsByProfileIds,
  getUnpaidWageEntries,
  tagWageEntries,
  untagWageEntries,
  createPayrollRunRecord,
  createPayrollRunItemRecords,
  setRunPaymentIntent,
  transitionRunStatus,
  updateRunItem,
  getPayrollRunsByCompany,
  getPayrollRunById,
  getRunPaymentIntentId,
} from '../db/queries/payroll.js'
import type {
  ConnectStatus,
  PayrollPreview,
  PayrollPreviewLine,
  PayrollRun,
  SaveCompanyBankRequest,
  SaveCrewBankRequest,
  RunPayrollRequest,
} from '@nimbus/shared'

const siteUrl = (): string => process.env['SITE_URL'] ?? 'http://localhost:5173'

// ── Owner: Stripe Connect onboarding ──────────────────────────────────────────

export async function getConnectStatus(companyId: string): Promise<ConnectStatus> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  if (!company.stripeAccountId) {
    return {
      connected: false,
      onboardingComplete: false,
      payoutsEnabled: false,
      companyBankLast4: company.bankLast4,
      companyBankName: company.bankName,
    }
  }

  const account = await getStripe().accounts.retrieve(company.stripeAccountId)
  const onboardingComplete = Boolean(account.details_submitted && account.payouts_enabled)

  if (onboardingComplete !== company.stripeOnboardingComplete) {
    await updateCompanyPayrollData(companyId, { stripeOnboardingComplete: onboardingComplete })
  }

  return {
    connected: true,
    onboardingComplete,
    payoutsEnabled: Boolean(account.payouts_enabled),
    companyBankLast4: company.bankLast4,
    companyBankName: company.bankName,
  }
}

export async function startConnectOnboarding(companyId: string, email: string | undefined): Promise<{ url: string }> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  let accountId = company.stripeAccountId

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'US',
      ...(email && { email }),
      capabilities: { transfers: { requested: true } },
      business_profile: { name: company.name },
      metadata: { nimbus_company_id: companyId },
    })
    accountId = account.id
    await updateCompanyPayrollData(companyId, { stripeAccountId: accountId })
  }

  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl()}/owner/settings?connect=refresh`,
    return_url: `${siteUrl()}/owner/settings?connect=return`,
    type: 'account_onboarding',
  })

  return { url: link.url }
}

// ── Owner: company funding bank (ACH debit source) ───────────────────────────

export async function saveCompanyBank(
  companyId: string,
  input: SaveCompanyBankRequest,
): Promise<{ bankLast4: string; bankName: string | null }> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  let customerId = company.stripeCustomerId
  if (!customerId) {
    const customer = await getStripe().customers.create({
      name: company.name,
      metadata: { nimbus_company_id: companyId },
    })
    customerId = customer.id
    await updateCompanyPayrollData(companyId, { stripeCustomerId: customerId })
  }

  const paymentMethod = await getStripe().paymentMethods.create({
    type: 'us_bank_account',
    us_bank_account: {
      routing_number: input.routingNumber,
      account_number: input.accountNumber,
      account_holder_type: 'company',
      account_type: input.accountType,
    },
    billing_details: { name: input.accountHolderName },
  })

  await getStripe().paymentMethods.attach(paymentMethod.id, { customer: customerId })

  const bankLast4 = paymentMethod.us_bank_account?.last4 ?? input.accountNumber.slice(-4)
  const bankName = paymentMethod.us_bank_account?.bank_name ?? null

  await updateCompanyPayrollData(companyId, {
    stripePaymentMethodId: paymentMethod.id,
    bankLast4,
    bankName,
  })

  return { bankLast4, bankName }
}

// ── Crew: payout bank details ─────────────────────────────────────────────────

export async function saveCrewBank(
  profileId: string,
  companyId: string,
  input: SaveCrewBankRequest,
  requestIp: string,
): Promise<{ bankLast4: string }> {
  const profile = await getProfilePayoutAccount(profileId, companyId)
  if (!profile) throw new AppError('NOT_FOUND', 'Crew member not found', 404)

  const externalAccount = {
    object: 'bank_account' as const,
    country: 'US',
    currency: 'usd',
    routing_number: input.routingNumber,
    account_number: input.accountNumber,
    account_holder_name: input.accountHolderName,
    account_holder_type: 'individual' as const,
  }

  let accountId = profile.stripeAccountId
  let bankLast4 = input.accountNumber.slice(-4)

  if (!accountId) {
    const nameParts = profile.fullName.trim().split(/\s+/)
    const firstName = nameParts[0] ?? profile.fullName
    const lastName = nameParts.slice(1).join(' ') || firstName

    const account = await getStripe().accounts.create({
      type: 'custom',
      country: 'US',
      business_type: 'individual',
      individual: { first_name: firstName, last_name: lastName },
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: requestIp },
      external_account: externalAccount,
      metadata: { nimbus_profile_id: profileId, nimbus_company_id: companyId },
    })
    accountId = account.id
  } else {
    const bankAccount = await getStripe().accounts.createExternalAccount(accountId, {
      external_account: externalAccount as unknown as string,
      default_for_currency: true,
    })
    if ('last4' in bankAccount && typeof bankAccount.last4 === 'string') {
      bankLast4 = bankAccount.last4
    }
  }

  await setProfilePayoutAccount(profileId, companyId, accountId, bankLast4)
  return { bankLast4 }
}

// ── Payroll preview ───────────────────────────────────────────────────────────

export async function previewPayroll(companyId: string, from: string, to: string): Promise<PayrollPreview> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  const entries = await getUnpaidWageEntries(companyId, from, to)

  const grouped = new Map<string, { totalCents: number; entryCount: number; name: string }>()
  for (const entry of entries) {
    const existing = grouped.get(entry.profileId)
    if (existing) {
      existing.totalCents += entry.totalCents
      existing.entryCount += 1
    } else {
      grouped.set(entry.profileId, {
        totalCents: entry.totalCents,
        entryCount: 1,
        name: entry.profileName ?? 'Unknown',
      })
    }
  }

  const accounts = grouped.size > 0
    ? await getPayoutAccountsByProfileIds([...grouped.keys()], companyId)
    : new Map<string, { stripeAccountId: string | null; fullName: string }>()

  const lines: PayrollPreviewLine[] = [...grouped.entries()].map(([profileId, group]) => ({
    profileId,
    profileName: group.name,
    entryCount: group.entryCount,
    totalCents: group.totalCents,
    hasBank: Boolean(accounts.get(profileId)?.stripeAccountId),
  }))
  lines.sort((a, b) => a.profileName.localeCompare(b.profileName))

  return {
    lines,
    totalCents: lines.reduce((sum, line) => sum + line.totalCents, 0),
    payableCents: lines.filter((l) => l.hasBank).reduce((sum, line) => sum + line.totalCents, 0),
    onboardingComplete: company.stripeOnboardingComplete,
    companyBankSaved: Boolean(company.stripeCustomerId && company.stripePaymentMethodId),
  }
}

// ── Run payroll ───────────────────────────────────────────────────────────────

export async function runPayroll(
  companyId: string,
  initiatedBy: string,
  input: RunPayrollRequest,
  requestIp: string,
  userAgent: string,
): Promise<PayrollRun> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  if (!company.stripeAccountId || !company.stripeOnboardingComplete) {
    throw new AppError('CONNECT_INCOMPLETE', 'Complete Stripe onboarding in Settings before running payroll', 400)
  }
  if (!company.stripeCustomerId || !company.stripePaymentMethodId) {
    throw new AppError('NO_COMPANY_BANK', 'Add your company bank account in Settings before running payroll', 400)
  }

  const entries = await getUnpaidWageEntries(companyId, input.from, input.to)
  if (entries.length === 0) {
    throw new AppError('NOTHING_TO_PAY', 'No unpaid wage entries in this period', 400)
  }

  const accounts = await getPayoutAccountsByProfileIds(
    [...new Set(entries.map((e) => e.profileId))],
    companyId,
  )

  // Only crew with a connected bank get paid; the rest stay in the unpaid pool
  const payableEntries = entries.filter((e) => accounts.get(e.profileId)?.stripeAccountId)
  if (payableEntries.length === 0) {
    throw new AppError('NO_BANK_DETAILS', 'None of the crew in this period have bank details on file', 400)
  }

  const grouped = new Map<string, number>()
  for (const entry of payableEntries) {
    grouped.set(entry.profileId, (grouped.get(entry.profileId) ?? 0) + entry.totalCents)
  }
  const lines = [...grouped.entries()].map(([profileId, amountCents]) => ({ profileId, amountCents }))
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0)

  const runId = await createPayrollRunRecord({
    companyId,
    initiatedBy,
    periodFrom: input.from,
    periodTo: input.to,
    totalCents,
  })
  await createPayrollRunItemRecords(runId, companyId, lines)
  await tagWageEntries(payableEntries.map((e) => e.id), runId, companyId)

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      customer: company.stripeCustomerId,
      payment_method: company.stripePaymentMethodId,
      payment_method_types: ['us_bank_account'],
      confirm: true,
      mandate_data: {
        customer_acceptance: {
          type: 'online',
          online: { ip_address: requestIp, user_agent: userAgent },
        },
      },
      description: `Payroll ${input.from} to ${input.to}`,
      metadata: { payroll_run_id: runId, nimbus_company_id: companyId },
    })

    await setRunPaymentIntent(runId, paymentIntent.id)

    if (paymentIntent.status === 'succeeded') {
      await processTransfers(runId)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    await transitionRunStatus(runId, 'funding', 'failed', { failureMessage: message })
    await untagWageEntries(runId)
    throw new AppError('FUNDING_FAILED', `Could not debit company bank account: ${message}`, 400)
  }

  const run = await getPayrollRunById(runId, companyId)
  if (!run) throw new AppError('INTERNAL_ERROR', 'Payroll run not found after creation', 500)
  return run
}

// ── Transfers: pay each crew member once funding has cleared ─────────────────

async function processTransfers(runId: string): Promise<void> {
  // Conditional transition acts as a lock: webhook and lazy sync can't both run this
  const locked = await transitionRunStatus(runId, 'funding', 'paying')
  if (!locked) return

  const run = await getPayrollRunById(runId)
  if (!run) return

  const paymentIntentId = await getRunPaymentIntentId(runId)

  let sourceTransaction: string | undefined
  if (paymentIntentId) {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
    const charge = paymentIntent.latest_charge
    sourceTransaction = typeof charge === 'string' ? charge : charge?.id
  }

  const accounts = await getPayoutAccountsByProfileIds(
    run.items.map((i) => i.profileId),
    run.companyId,
  )

  let paidCount = 0
  for (const item of run.items) {
    if (item.status !== 'pending') continue

    const destination = accounts.get(item.profileId)?.stripeAccountId
    if (!destination) {
      await updateRunItem(item.id, { status: 'failed', failureMessage: 'No bank details on file' })
      await untagWageEntries(runId, item.profileId)
      continue
    }

    try {
      const transfer = await getStripe().transfers.create({
        amount: item.amountCents,
        currency: 'usd',
        destination,
        ...(sourceTransaction && { source_transaction: sourceTransaction }),
        transfer_group: `payroll_${runId}`,
        metadata: { payroll_run_id: runId, nimbus_profile_id: item.profileId },
      })
      await updateRunItem(item.id, { status: 'paid', stripeTransferId: transfer.id })
      paidCount += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer failed'
      await updateRunItem(item.id, { status: 'failed', failureMessage: message })
      // Return this crew member's wages to the unpaid pool so a retry can pick them up
      await untagWageEntries(runId, item.profileId)
    }
  }

  if (paidCount > 0) {
    await transitionRunStatus(runId, 'paying', 'paid', { paidAt: new Date().toISOString() })
  } else {
    await transitionRunStatus(runId, 'paying', 'failed', {
      failureMessage: 'All transfers failed — wages returned to the unpaid pool',
    })
  }
}

async function failRun(runId: string, message: string): Promise<void> {
  const failed = await transitionRunStatus(runId, 'funding', 'failed', { failureMessage: message })
  if (failed) await untagWageEntries(runId)
}

// ── Run history (with lazy status sync as webhook fallback) ───────────────────

export async function listPayrollRuns(companyId: string): Promise<PayrollRun[]> {
  let runs = await getPayrollRunsByCompany(companyId)
  let needsRefresh = false

  for (const run of runs) {
    if (run.status !== 'funding') continue
    const paymentIntentId = await getRunPaymentIntentId(run.id)
    if (!paymentIntentId) continue

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status === 'succeeded') {
      await processTransfers(run.id)
      needsRefresh = true
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      const reason = paymentIntent.last_payment_error?.message ?? 'Bank debit failed'
      await failRun(run.id, reason)
      needsRefresh = true
    }
  }

  if (needsRefresh) runs = await getPayrollRunsByCompany(companyId)
  return runs
}

// ── Webhook events ────────────────────────────────────────────────────────────

// Returns true if the event was a payroll event and has been handled
export async function handlePayrollWebhookEvent(event: Stripe.Event): Promise<boolean> {
  if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const runId = paymentIntent.metadata?.['payroll_run_id']
    if (!runId) return false

    if (event.type === 'payment_intent.succeeded') {
      await processTransfers(runId)
    } else {
      const reason = paymentIntent.last_payment_error?.message ?? 'Bank debit failed'
      await failRun(runId, reason)
    }
    return true
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const companyId = await getCompanyIdByStripeAccount(account.id)
    if (companyId) {
      const onboardingComplete = Boolean(account.details_submitted && account.payouts_enabled)
      await updateCompanyPayrollData(companyId, { stripeOnboardingComplete: onboardingComplete })
    }
    return true
  }

  return false
}
