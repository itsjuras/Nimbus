import { supabase } from '../supabase.js'
import type { Profile } from '@nimbus/shared'

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    role: row['role'] as Profile['role'],
    fullName: row['full_name'] as string,
    phone: (row['phone'] as string | null) ?? null,
    avatarUrl: (row['avatar_url'] as string | null) ?? null,
    payType: (row['pay_type'] as 'hourly' | 'per_job' | null) ?? null,
    payRateCents: (row['pay_rate_cents'] as number | null) ?? null,
    bankLast4: (row['bank_last4'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return toProfile(data as Record<string, unknown>)
}

export async function getProfilesByCompany(companyId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', companyId)
    .order('full_name')

  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(toProfile)
}

export async function updateProfile(
  id: string,
  companyId: string,
  patch: { payType?: 'hourly' | 'per_job'; payRateCents?: number; phone?: string | null },
): Promise<Profile | null> {
  const update: Record<string, unknown> = {}
  if (patch.payType !== undefined) update['pay_type'] = patch.payType
  if (patch.payRateCents !== undefined) update['pay_rate_cents'] = patch.payRateCents
  if (patch.phone !== undefined) update['phone'] = patch.phone

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error || !data) return null
  return toProfile(data as Record<string, unknown>)
}

export async function createProfile(profile: {
  id: string
  companyId: string
  role: Profile['role']
  fullName: string
  phone?: string
}): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profile.id,
      company_id: profile.companyId,
      role: profile.role,
      full_name: profile.fullName,
      phone: profile.phone ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create profile')
  return toProfile(data as Record<string, unknown>)
}
