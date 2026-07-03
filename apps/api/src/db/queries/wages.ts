import { supabase } from '../supabase.js'
import type { WageEntry, PayType } from '@nimbus/shared'

function toWageEntry(row: Record<string, unknown>): WageEntry {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    profileId: row['profile_id'] as string,
    profileName: (row['profile_name'] as string | null) ?? null,
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

export async function getWageEntriesByCompany(
  companyId: string,
  from?: string,
  to?: string,
): Promise<WageEntry[]> {
  let query = supabase
    .from('wage_entries')
    .select('*, profiles!profile_id(full_name)')
    .eq('company_id', companyId)
    .order('period_date', { ascending: false })

  if (from) query = query.gte('period_date', from)
  if (to) query = query.lte('period_date', to)

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const profile = row['profiles'] as Record<string, unknown> | null
    return toWageEntry({ ...row, profile_name: profile?.['full_name'] ?? null })
  })
}

export async function createWageEntryRecord(input: {
  companyId: string
  profileId: string
  payType: PayType
  hours?: number
  rateCents: number
  totalCents: number
  periodDate: string
  jobId?: string
  notes?: string
}): Promise<WageEntry> {
  const { data, error } = await supabase
    .from('wage_entries')
    .insert({
      company_id: input.companyId,
      profile_id: input.profileId,
      pay_type: input.payType,
      hours: input.hours ?? null,
      rate_cents: input.rateCents,
      total_cents: input.totalCents,
      period_date: input.periodDate,
      job_id: input.jobId ?? null,
      notes: input.notes ?? null,
    })
    .select('*, profiles!profile_id(full_name)')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create wage entry')
  const profile = (data as Record<string, unknown>)['profiles'] as Record<string, unknown> | null
  return toWageEntry({ ...(data as Record<string, unknown>), profile_name: profile?.['full_name'] ?? null })
}

export async function getWageEntriesByJob(jobId: string, companyId: string): Promise<WageEntry[]> {
  const { data, error } = await supabase
    .from('wage_entries')
    .select('*, profiles!profile_id(full_name)')
    .eq('job_id', jobId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const profile = row['profiles'] as Record<string, unknown> | null
    return toWageEntry({ ...row, profile_name: profile?.['full_name'] ?? null })
  })
}

export async function deleteWageEntryRecord(id: string, companyId: string): Promise<void> {
  await supabase.from('wage_entries').delete().eq('id', id).eq('company_id', companyId)
}
