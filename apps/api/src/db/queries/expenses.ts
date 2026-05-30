import { supabase } from '../supabase.js'
import type { Expense, ExpenseStatus } from '@nimbus/shared'

function toExpense(row: Record<string, unknown>): Expense {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    submittedBy: row['submitted_by'] as string,
    submittedByName: (row['submitted_by_name'] as string | null) ?? null,
    jobId: (row['job_id'] as string | null) ?? null,
    amountCents: row['amount_cents'] as number,
    description: row['description'] as string,
    category: row['category'] as Expense['category'],
    receiptStoragePath: (row['receipt_storage_path'] as string | null) ?? null,
    status: row['status'] as ExpenseStatus,
    reviewedBy: (row['reviewed_by'] as string | null) ?? null,
    reviewedAt: (row['reviewed_at'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}

export async function getExpensesByCompany(
  companyId: string,
  from?: string,
  to?: string,
): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*, profiles!submitted_by(full_name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const profile = row['profiles'] as Record<string, unknown> | null
    return toExpense({ ...row, submitted_by_name: profile?.['full_name'] ?? null })
  })
}

export async function getExpenseById(id: string, companyId: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, profiles!submitted_by(full_name)')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return null
  const profile = (data as Record<string, unknown>)['profiles'] as Record<string, unknown> | null
  return toExpense({ ...(data as Record<string, unknown>), submitted_by_name: profile?.['full_name'] ?? null })
}

export async function createExpenseRecord(input: {
  companyId: string
  submittedBy: string
  amountCents: number
  description: string
  category: string
  jobId?: string
  receiptStoragePath?: string
}): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      company_id: input.companyId,
      submitted_by: input.submittedBy,
      amount_cents: input.amountCents,
      description: input.description,
      category: input.category,
      job_id: input.jobId ?? null,
      receipt_storage_path: input.receiptStoragePath ?? null,
    })
    .select('*, profiles!submitted_by(full_name)')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create expense')
  const profile = (data as Record<string, unknown>)['profiles'] as Record<string, unknown> | null
  return toExpense({ ...(data as Record<string, unknown>), submitted_by_name: profile?.['full_name'] ?? null })
}

export async function updateExpenseStatus(
  id: string,
  companyId: string,
  status: ExpenseStatus,
  reviewedBy: string,
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, profiles!submitted_by(full_name)')
    .single()

  if (error || !data) return null
  const profile = (data as Record<string, unknown>)['profiles'] as Record<string, unknown> | null
  return toExpense({ ...(data as Record<string, unknown>), submitted_by_name: profile?.['full_name'] ?? null })
}

export async function deleteExpenseRecord(id: string, companyId: string): Promise<void> {
  await supabase.from('expenses').delete().eq('id', id).eq('company_id', companyId)
}
