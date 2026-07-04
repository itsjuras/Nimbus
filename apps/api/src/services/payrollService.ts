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
  VerifyCompanyBankRequest,
  SaveCrewBankRequest,
  RunPayrollRequest,
} from '@nimbus/shared'

const siteUrl = (): string => process.env['SITE_URL'] ?? 'http://localhost:5173'

// Stripe rejects localhost/example URLs in business profiles; recipient
// accounts need *a* valid product URL, not necessarily the dev one
const businessProfileUrl = (): string => {
  const url = siteUrl()
  return url.startsWith('https://') ? url : 'https://www.nimbuscleaning.net'
}

const CLEANING_SERVICES_MCC = '7349'

// ── Owner: Stripe Connect onboarding ──────────────────────────────────────────

export async function getConnectStatus(companyId: string): Promise<ConnectStatus> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  const base = {
    companyBankStatus: company.bankStatus,
    companyBankLast4: company.bankLast4,
    companyBankName: company.bankName,
  }

  if (!company.stripeAccountId) {
    return { connected: false, onboardingComplete: false, payoutsEnabled: false, ...base }
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
    ...base,
  }
}

export async function startConnectOnboarding(companyId: string, email: string | undefined): Promise<{ url: string }> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  let accountId = company.stripeAccountId

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'CA',
      ...(email && { email }),
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
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

// ── Owner: company funding bank (pre-authorized debit source) ─────────────────

export async function saveCompanyBank(
  companyId: string,
  input: SaveCompanyBankRequest,
  ownerEmail: string | undefined,
  requestIp: string,
  userAgent: string,
): Promise<ConnectStatus> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  let customerId = company.stripeCustomerId
  if (!customerId) {
    const customer = await getStripe().customers.create({
      name: company.name,
      ...(ownerEmail && { email: ownerEmail }),
      metadata: { nimbus_company_id: companyId },
    })
    customerId = customer.id
    await updateCompanyPayrollData(companyId, { stripeCustomerId: customerId })
  }

  const paymentMethod = await getStripe().paymentMethods.create({
    type: 'acss_debit',
    acss_debit: {
      institution_number: input.institutionNumber,
      transit_number: input.transitNumber,
      account_number: input.accountNumber,
    },
    billing_details: { name: input.accountHolderName, ...(ownerEmail && { email: ownerEmail }) },
  })

  // Confirming the SetupIntent triggers microdeposits and records the debit mandate
  const setupIntent = await getStripe().setupIntents.create({
    customer: customerId,
    payment_method: paymentMethod.id,
    payment_method_types: ['acss_debit'],
    confirm: true,
    payment_method_options: {
      acss_debit: {
        currency: 'cad',
        verification_method: 'microdeposits',
        mandate_options: {
          payment_schedule: 'sporadic',
          transaction_type: 'business',
        },
      },
    },
    mandate_data: {
      customer_acceptance: {
        type: 'online',
        online: { ip_address: requestIp, user_agent: userAgent },
      },
    },
    metadata: { nimbus_company_id: companyId },
  })

  const bankLast4 = paymentMethod.acss_debit?.last4 ?? input.accountNumber.slice(-4)
  const bankName = paymentMethod.acss_debit?.bank_name ?? null
  const verified = setupIntent.status === 'succeeded'
  const mandateId = typeof setupIntent.mandate === 'string' ? setupIntent.mandate : setupIntent.mandate?.id

  await updateCompanyPayrollData(companyId, {
    stripePaymentMethodId: paymentMethod.id,
    stripeSetupIntentId: setupIntent.id,
    ...(mandateId && { stripeMandateId: mandateId }),
    bankStatus: verified ? 'verified' : 'pending_verification',
    bankLast4,
    bankName,
  })

  return getConnectStatus(companyId)
}

export async function verifyCompanyBank(
  companyId: string,
  input: VerifyCompanyBankRequest,
): Promise<ConnectStatus> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)
  if (!company.stripeSetupIntentId || company.bankStatus !== 'pending_verification') {
    throw new AppError('NO_PENDING_VERIFICATION', 'No bank account awaiting verification', 400)
  }

  let setupIntent
  try {
    setupIntent = await getStripe().setupIntents.verifyMicrodeposits(company.stripeSetupIntentId, {
      amounts: input.amounts,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    throw new AppError('VERIFICATION_FAILED', message, 400)
  }

  if (setupIntent.status !== 'succeeded') {
    throw new AppError('VERIFICATION_FAILED', `Verification did not complete (status: ${setupIntent.status})`, 400)
  }

  const mandateId = typeof setupIntent.mandate === 'string' ? setupIntent.mandate : setupIntent.mandate?.id
  await updateCompanyPayrollData(companyId, {
    bankStatus: 'verified',
    ...(mandateId && { stripeMandateId: mandateId }),
  })

  return getConnectStatus(companyId)
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
    country: 'CA',
    currency: 'cad',
    routing_number: `${input.transitNumber}${input.institutionNumber}`,
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
    const [year, month, day] = input.dateOfBirth.split('-').map(Number)

    const account = await getStripe().accounts.create({
      type: 'custom',
      country: 'CA',
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        phone: input.phone,
        dob: { day: day ?? 1, month: month ?? 1, year: year ?? 1990 },
        address: {
          line1: input.addressLine1,
          city: input.city,
          state: input.province.toUpperCase(),
          postal_code: input.postalCode.toUpperCase(),
          country: 'CA',
        },
        relationship: { title: 'Crew Member' },
      },
      business_profile: {
        mcc: CLEANING_SERVICES_MCC,
        product_description: 'Cleaning crew member receiving wage payouts',
        url: businessProfileUrl(),
      },
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: requestIp },
      external_account: externalAccount,
      metadata: { nimbus_profile_id: profileId, nimbus_company_id: companyId },
    })
    accountId = account.id

    if (account.capabilities?.transfers !== 'active') {
      const due = account.requirements?.currently_due ?? []
      // Account exists but can't receive transfers yet — surface what Stripe still wants
      throw new AppError(
        'RECIPIENT_INCOMPLETE',
        `Stripe needs more information before this person can be paid: ${due.join(', ') || 'unknown requirements'}`,
        400,
      )
    }
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
    companyBankSaved: company.bankStatus === 'verified',
  }
}

// ── Run payroll ───────────────────────────────────────────────────────────────

export async function runPayroll(
  companyId: string,
  initiatedBy: string,
  input: RunPayrollRequest,
): Promise<PayrollRun> {
  const company = await getCompanyPayrollData(companyId)
  if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

  if (!company.stripeAccountId || !company.stripeOnboardingComplete) {
    throw new AppError('CONNECT_INCOMPLETE', 'Complete business verification in Settings before running payroll', 400)
  }
  if (
    !company.stripeCustomerId ||
    !company.stripePaymentMethodId ||
    !company.stripeMandateId ||
    company.bankStatus !== 'verified'
  ) {
    throw new AppError('NO_COMPANY_BANK', 'Add and verify your payroll bank account in Settings before running payroll', 400)
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
      currency: 'cad',
      customer: company.stripeCustomerId,
      payment_method: company.stripePaymentMethodId,
      payment_method_types: ['acss_debit'],
      off_session: true,
      confirm: true,
      mandate: company.stripeMandateId,
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
        currency: 'cad',
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
