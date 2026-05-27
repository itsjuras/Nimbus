import { supabase } from '../supabase.js'
import type { Job, JobDetail, JobStatus } from '@nimbus/shared'
import type { JobFilters } from '@nimbus/shared'

function toJob(row: Record<string, unknown>): Job {
  return {
    id: row['id'] as string,
    companyId: row['company_id'] as string,
    clientId: row['client_id'] as string,
    checklistId: row['checklist_id'] as string,
    scheduledAt: row['scheduled_at'] as string,
    status: row['status'] as JobStatus,
    notes: (row['notes'] as string | null) ?? null,
    createdAt: row['created_at'] as string,
  }
}

export async function getJobsByCompany(
  companyId: string,
  filters: JobFilters = {},
): Promise<Job[]> {
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('scheduled_at', { ascending: true })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.from) query = query.gte('scheduled_at', filters.from)
  if (filters.to) query = query.lte('scheduled_at', filters.to)

  const { data, error } = await query
  if (error) throw error
  return (data as Record<string, unknown>[]).map(toJob)
}

export async function getJobById(id: string, companyId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return null
  return toJob(data as Record<string, unknown>)
}

export async function getJobDetail(id: string, companyId: string): Promise<JobDetail | null> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !job) return null

  const jobRow = job as Record<string, unknown>
  const jobId = jobRow['id'] as string

  // Fetch all related data in parallel
  const [clientRes, checklistRes, crewRes, checklistItemsRes, photosRes, completionRes] =
    await Promise.all([
      supabase.from('clients').select('name, contact_email').eq('id', jobRow['client_id']).single(),
      supabase.from('checklists').select('name').eq('id', jobRow['checklist_id']).single(),
      supabase
        .from('job_crew')
        .select('profiles(id, full_name, role, avatar_url)')
        .eq('job_id', jobId),
      supabase
        .from('job_checklist_items')
        .select('*, checklist_items(label, requires_photo, position)')
        .eq('job_id', jobId)
        .order('checklist_items(position)'),
      supabase.from('job_photos').select('*').eq('job_id', jobId),
      supabase.from('job_completions').select('completed_at').eq('job_id', jobId).single(),
    ])

  const crew = (crewRes.data ?? []).map((row) => {
    const p = (row as Record<string, unknown>)['profiles'] as Record<string, unknown>
    return {
      id: p['id'] as string,
      fullName: p['full_name'] as string,
      role: p['role'] as string,
      avatarUrl: (p['avatar_url'] as string | null) ?? null,
    }
  })

  const photos = (photosRes.data ?? []) as Record<string, unknown>[]

  const checklistItems = (checklistItemsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const ci = r['checklist_items'] as Record<string, unknown>
    const itemId = r['id'] as string
    return {
      id: itemId,
      checklistItemId: r['checklist_item_id'] as string,
      label: ci['label'] as string,
      requiresPhoto: ci['requires_photo'] as boolean,
      position: ci['position'] as number,
      completed: r['completed'] as boolean,
      completedBy: (r['completed_by'] as string | null) ?? null,
      completedAt: (r['completed_at'] as string | null) ?? null,
      photos: photos
        .filter((p) => p['checklist_item_id'] === r['checklist_item_id'])
        .map((p) => ({
          id: p['id'] as string,
          jobId: p['job_id'] as string,
          checklistItemId: p['checklist_item_id'] as string,
          profileId: p['profile_id'] as string,
          storagePath: p['storage_path'] as string,
          createdAt: p['created_at'] as string,
        })),
    }
  })

  return {
    ...toJob(jobRow),
    clientName: (clientRes.data as Record<string, unknown> | null)?.['name'] as string ?? '',
    clientContactEmail: (clientRes.data as Record<string, unknown> | null)?.['contact_email'] as string | null ?? null,
    checklistName: (checklistRes.data as Record<string, unknown> | null)?.['name'] as string ?? '',
    crew,
    checklistItems,
    completedAt:
      (completionRes.data as Record<string, unknown> | null)?.['completed_at'] as string ?? null,
  }
}

export async function createJob(
  companyId: string,
  input: {
    clientId: string
    checklistId: string
    scheduledAt: string
    notes?: string
  },
): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      client_id: input.clientId,
      checklist_id: input.checklistId,
      scheduled_at: input.scheduledAt,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toJob(data as Record<string, unknown>)
}

export async function updateJob(
  id: string,
  companyId: string,
  patch: { scheduledAt?: string; notes?: string },
): Promise<Job | null> {
  const update: Record<string, unknown> = {}
  if (patch.scheduledAt !== undefined) update['scheduled_at'] = patch.scheduledAt
  if (patch.notes !== undefined) update['notes'] = patch.notes

  const { data, error } = await supabase
    .from('jobs')
    .update(update)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error || !data) return null
  return toJob(data as Record<string, unknown>)
}

export async function updateJobStatus(
  id: string,
  companyId: string,
  status: JobStatus,
): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error || !data) return null
  return toJob(data as Record<string, unknown>)
}

export async function deleteJob(id: string, companyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  return !error
}

export async function setJobCrew(jobId: string, crewIds: string[]): Promise<void> {
  await supabase.from('job_crew').delete().eq('job_id', jobId)

  if (crewIds.length === 0) return

  const { error } = await supabase
    .from('job_crew')
    .insert(crewIds.map((profileId) => ({ job_id: jobId, profile_id: profileId })))

  if (error) throw error
}

export async function clearJobChecklistItems(jobId: string): Promise<void> {
  await supabase.from('job_checklist_items').delete().eq('job_id', jobId)
}

export async function seedJobChecklistItems(
  jobId: string,
  checklistId: string,
): Promise<void> {
  const { data: items, error } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('checklist_id', checklistId)

  if (error || !items) return

  const rows = (items as Record<string, unknown>[]).map((item) => ({
    job_id: jobId,
    checklist_item_id: item['id'] as string,
  }))

  if (rows.length > 0) {
    await supabase.from('job_checklist_items').insert(rows)
  }
}
