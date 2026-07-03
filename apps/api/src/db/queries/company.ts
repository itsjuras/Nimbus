import { supabase } from '../supabase.js'
import type { CompanySettings } from '@nimbus/shared'

function rowToSettings(row: Record<string, unknown>): CompanySettings {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    companyName: (row['company_name'] as string | null) ?? null,
    replyToEmail: (row['reply_to_email'] as string | null) ?? null,
  }
}

export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error || !data) return null
  return rowToSettings(data as Record<string, unknown>)
}

export interface GoogleAuthData {
  googleEmail: string | null
  googleRefreshToken: string | null
}

export async function getGoogleAuth(companyId: string): Promise<GoogleAuthData | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('google_email, google_refresh_token')
    .eq('id', companyId)
    .single()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return {
    googleEmail: (row['google_email'] as string | null) ?? null,
    googleRefreshToken: (row['google_refresh_token'] as string | null) ?? null,
  }
}

export async function setGoogleAuth(
  companyId: string,
  googleEmail: string,
  googleRefreshToken: string,
): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ google_email: googleEmail, google_refresh_token: googleRefreshToken })
    .eq('id', companyId)
  if (error) throw new Error(error.message)
}

export async function clearGoogleAuth(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ google_email: null, google_refresh_token: null })
    .eq('id', companyId)
  if (error) throw new Error(error.message)
}

export async function updateCompanySettings(
  companyId: string,
  updates: Partial<{ companyName: string | null; replyToEmail: string | null }>,
): Promise<CompanySettings | null> {
  const patch: Record<string, unknown> = {}
  if ('companyName' in updates)   patch['company_name']   = updates.companyName
  if ('replyToEmail' in updates)  patch['reply_to_email'] = updates.replyToEmail

  const { data, error } = await supabase
    .from('companies')
    .update(patch)
    .eq('id', companyId)
    .select('*')
    .single()

  if (error || !data) return null
  return rowToSettings(data as Record<string, unknown>)
}
