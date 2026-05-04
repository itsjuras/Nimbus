import { supabase } from '../supabase.js'
import type { Client } from '@nimbus/shared'
import type { CreateClientRequest, UpdateClientRequest } from '@nimbus/shared'

function toClient(row: Record<string, unknown>): Client {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    name: row['name'] as string,
    address: (row['address'] as string | null) ?? null,
    contactName: (row['contact_name'] as string | null) ?? null,
    contactEmail: (row['contact_email'] as string | null) ?? null,
    notes: (row['notes'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}

export async function getClientsByCompany(companyId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) throw error
  return (data as Record<string, unknown>[]).map(toClient)
}

export async function getClientById(id: string, companyId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return null
  return toClient(data as Record<string, unknown>)
}

export async function createClient(
  companyId: string,
  input: CreateClientRequest,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      company_id: companyId,
      name: input.name,
      address: input.address ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toClient(data as Record<string, unknown>)
}

export async function updateClient(
  id: string,
  companyId: string,
  input: UpdateClientRequest,
): Promise<Client | null> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch['name'] = input.name
  if (input.address !== undefined) patch['address'] = input.address
  if (input.contactName !== undefined) patch['contact_name'] = input.contactName
  if (input.contactEmail !== undefined) patch['contact_email'] = input.contactEmail
  if (input.notes !== undefined) patch['notes'] = input.notes

  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return null
  return toClient(data as Record<string, unknown>)
}

export async function deleteClient(id: string, companyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  return !error
}
