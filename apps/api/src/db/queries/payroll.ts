import { supabase } from '../supabase.js'
import type { PayrollRun, PayrollRunItem, PayrollRunStatus, PayrollRunItemStatus, WageEntry, PayType, CompanyBankStatus } from '@nimbus/shared'

// ── Company payroll fields ────────────────────────────────────────────────────

export interface CompanyPayrollData {
  id: string
  name: string
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
  stripeCustomerId: string | null
  stripePaymentMethodId: string | null
  stripeSetupIntentId: string | null
  stripeMandateId: string | null
  bankStatus: CompanyBankStatus
  bankLast4: string | null
  bankName: string | null
}

export async function getCompanyPayrollData(companyId: string): Promise<CompanyPayrollData | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, stripe_account_id, stripe_onboarding_complete, stripe_customer_id, stripe_payment_method_id, stripe_setup_intent_id, stripe_mandate_id, bank_status, bank_last4, bank_name')
    .eq('id', companyId)
    .single()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    stripeAccountId: (row['stripe_account_id'] as string | null) ?? null,
    stripeOnboardingComplete: (row['stripe_onboarding_complete'] as boolean | null) ?? false,
    stripeCustomerId: (row['stripe_customer_id'] as string | null) ?? null,
    stripePaymentMethodId: (row['stripe_payment_method_id'] as string | null) ?? null,
    stripeSetupIntentId: (row['stripe_setup_intent_id'] as string | null) ?? null,
    stripeMandateId: (row['stripe_mandate_id'] as string | null) ?? null,
    bankStatus: (row['bank_status'] as CompanyBankStatus | null) ?? 'none',
    bankLast4: (row['bank_last4'] as string | null) ?? null,
    bankName: (row['bank_name'] as string | null) ?? null,
  }
}

export async function updateCompanyPayrollData(
  companyId: string,
  patch: Partial<{
    stripeAccountId: string
    stripeOnboardingComplete: boolean
    stripeCustomerId: string
    stripePaymentMethodId: string
    stripeSetupIntentId: string
    stripeMandateId: string
    bankStatus: CompanyBankStatus
    bankLast4: string
    bankName: string | null
  }>,
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.stripeAccountId !== undefined) update['stripe_account_id'] = patch.stripeAccountId
  if (patch.stripeOnboardingComplete !== undefined) update['stripe_onboarding_complete'] = patch.stripeOnboardingComplete
  if (patch.stripeCustomerId !== undefined) update['stripe_customer_id'] = patch.stripeCustomerId
  if (patch.stripePaymentMethodId !== undefined) update['stripe_payment_method_id'] = patch.stripePaymentMethodId
  if (patch.stripeSetupIntentId !== undefined) update['stripe_setup_intent_id'] = patch.stripeSetupIntentId
  if (patch.stripeMandateId !== undefined) update['stripe_mandate_id'] = patch.stripeMandateId
  if (patch.bankStatus !== undefined) update['bank_status'] = patch.bankStatus
  if (patch.bankLast4 !== undefined) update['bank_last4'] = patch.bankLast4
  if (patch.bankName !== undefined) update['bank_name'] = patch.bankName

  const { error } = await supabase.from('companies').update(update).eq('id', companyId)
  if (error) throw new Error(error.message)
}

export async function getCompanyIdByStripeAccount(stripeAccountId: string): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('stripe_account_id', stripeAccountId)
    .maybeSingle()
  return (data as Record<string, unknown> | null)?.['id'] as string | null ?? null
}

// ── Crew payout accounts ──────────────────────────────────────────────────────

export async function getProfilePayoutAccount(
  profileId: string,
  companyId: string,
): Promise<{ stripeAccountId: string | null; fullName: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_account_id, full_name')
    .eq('id', profileId)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return {
    stripeAccountId: (row['stripe_account_id'] as string | null) ?? null,
    fullName: row['full_name'] as string,
  }
}

export async function setProfilePayoutAccount(
  profileId: string,
  companyId: string,
  stripeAccountId: string,
  bankLast4: string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ stripe_account_id: stripeAccountId, bank_last4: bankLast4 })
    .eq('id', profileId)
    .eq('company_id', companyId)
  if (error) throw new Error(error.message)
}

export async function getPayoutAccountsByProfileIds(
  profileIds: string[],
  companyId: string,
): Promise<Map<string, { stripeAccountId: string | null; fullName: string }>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, stripe_account_id, full_name')
    .eq('company_id', companyId)
    .in('id', profileIds)

  if (error) throw new Error(error.message)
  const map = new Map<string, { stripeAccountId: string | null; fullName: string }>()
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(row['id'] as string, {
      stripeAccountId: (row['stripe_account_id'] as string | null) ?? null,
      fullName: row['full_name'] as string,
    })
  }
  return map
}

// ── Unpaid wage entries ───────────────────────────────────────────────────────

function toWageEntry(row: Record<string, unknown>): WageEntry {
  const profile = row['profiles'] as Record<string, unknown> | null
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    profileId: row['profile_id'] as string,
    profileName: (profile?.['full_name'] as string | null) ?? null,
    jobId: (row['job_id'] as string | null) ?? null,
    payType: row['pay_type'] as PayType,
    hours: (row['hours'] as number | null) ?? null,
    rateCents: row['rate_cents'] as number,
    totalCents: row['total_cents'] as number,
    periodDate: row['period_date'] as string,
    notes: (row['notes'] as string | null) ?? null,
    payrollRunId: (row['payroll_run_id'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}

export async function getUnpaidWageEntries(
  companyId: string,
  from: string,
  to: string,
): Promise<WageEntry[]> {
  const { data, error } = await supabase
    .from('wage_entries')
    .select('*, profiles!profile_id(full_name)')
    .eq('company_id', companyId)
    .is('payroll_run_id', null)
    .gte('period_date', from)
    .lte('period_date', to)
    .order('period_date', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map(toWageEntry)
}

export async function tagWageEntries(entryIds: string[], runId: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('wage_entries')
    .update({ payroll_run_id: runId })
    .eq('company_id', companyId)
    .in('id', entryIds)
  if (error) throw new Error(error.message)
}

export async function untagWageEntries(runId: string, profileId?: string): Promise<void> {
  let query = supabase.from('wage_entries').update({ payroll_run_id: null }).eq('payroll_run_id', runId)
  if (profileId) query = query.eq('profile_id', profileId)
  const { error } = await query
  if (error) throw new Error(error.message)
}

// ── Payroll runs ──────────────────────────────────────────────────────────────

function toRunItem(row: Record<string, unknown>): PayrollRunItem {
  const profile = row['profiles'] as Record<string, unknown> | null
  return {
    id: row['id'] as string,
    payrollRunId: row['payroll_run_id'] as string,
    profileId: row['profile_id'] as string,
    profileName: (profile?.['full_name'] as string | null) ?? null,
    amountCents: row['amount_cents'] as number,
    status: row['status'] as PayrollRunItemStatus,
    failureMessage: (row['failure_message'] as string | null) ?? null,
  }
}

function toRun(row: Record<string, unknown>, items: PayrollRunItem[]): PayrollRun {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    initiatedBy: row['initiated_by'] as string,
    periodFrom: row['period_from'] as string,
    periodTo: row['period_to'] as string,
    totalCents: row['total_cents'] as number,
    status: row['status'] as PayrollRunStatus,
    failureMessage: (row['failure_message'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
    paidAt: (row['paid_at'] as string | null) ?? null,
    items,
  }
}

export async function createPayrollRunRecord(input: {
  companyId: string
  initiatedBy: string
  periodFrom: string
  periodTo: string
  totalCents: number
}): Promise<string> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .insert({
      company_id: input.companyId,
      initiated_by: input.initiatedBy,
      period_from: input.periodFrom,
      period_to: input.periodTo,
      total_cents: input.totalCents,
      status: 'funding',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create payroll run')
  return (data as Record<string, unknown>)['id'] as string
}

export async function createPayrollRunItemRecords(
  runId: string,
  companyId: string,
  lines: { profileId: string; amountCents: number }[],
): Promise<void> {
  const { error } = await supabase.from('payroll_run_items').insert(
    lines.map((line) => ({
      payroll_run_id: runId,
      company_id: companyId,
      profile_id: line.profileId,
      amount_cents: line.amountCents,
      status: 'pending',
    })),
  )
  if (error) throw new Error(error.message)
}

export async function setRunPaymentIntent(runId: string, paymentIntentId: string): Promise<void> {
  const { error } = await supabase
    .from('payroll_runs')
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', runId)
  if (error) throw new Error(error.message)
}

// Conditional transition used as a lock so webhook + lazy sync can't both pay out
export async function transitionRunStatus(
  runId: string,
  fromStatus: PayrollRunStatus,
  toStatus: PayrollRunStatus,
  extra?: { failureMessage?: string; paidAt?: string },
): Promise<boolean> {
  const update: Record<string, unknown> = { status: toStatus }
  if (extra?.failureMessage !== undefined) update['failure_message'] = extra.failureMessage
  if (extra?.paidAt !== undefined) update['paid_at'] = extra.paidAt

  const { data, error } = await supabase
    .from('payroll_runs')
    .update(update)
    .eq('id', runId)
    .eq('status', fromStatus)
    .select('id')

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown[]).length > 0
}

export async function updateRunItem(
  itemId: string,
  patch: { status: PayrollRunItemStatus; stripeTransferId?: string; failureMessage?: string },
): Promise<void> {
  const update: Record<string, unknown> = { status: patch.status }
  if (patch.stripeTransferId !== undefined) update['stripe_transfer_id'] = patch.stripeTransferId
  if (patch.failureMessage !== undefined) update['failure_message'] = patch.failureMessage

  const { error } = await supabase.from('payroll_run_items').update(update).eq('id', itemId)
  if (error) throw new Error(error.message)
}

const RUN_SELECT = '*, payroll_run_items(*, profiles!profile_id(full_name))'

function rowToRunWithItems(row: Record<string, unknown>): PayrollRun {
  const itemRows = (row['payroll_run_items'] ?? []) as Record<string, unknown>[]
  return toRun(row, itemRows.map(toRunItem))
}

export async function getPayrollRunsByCompany(companyId: string): Promise<PayrollRun[]> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(RUN_SELECT)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map(rowToRunWithItems)
}

export async function getPayrollRunById(runId: string, companyId?: string): Promise<PayrollRun | null> {
  let query = supabase.from('payroll_runs').select(RUN_SELECT).eq('id', runId)
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query.single()

  if (error || !data) return null
  return rowToRunWithItems(data as Record<string, unknown>)
}

export async function getRunPaymentIntentId(runId: string): Promise<string | null> {
  const { data } = await supabase
    .from('payroll_runs')
    .select('stripe_payment_intent_id')
    .eq('id', runId)
    .single()
  return ((data as Record<string, unknown> | null)?.['stripe_payment_intent_id'] as string | null) ?? null
}
