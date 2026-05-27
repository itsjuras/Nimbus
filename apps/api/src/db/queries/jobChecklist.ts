import { supabase } from '../supabase.js'
import type { JobChecklistItem, JobPhoto } from '@nimbus/shared'

function toJobChecklistItem(row: Record<string, unknown>): JobChecklistItem {
  return {
    id: row['id'] as string,
    jobId: row['job_id'] as string,
    checklistItemId: row['checklist_item_id'] as string,
    completed: row['completed'] as boolean,
    completedBy: (row['completed_by'] as string | null) ?? null,
    completedAt: (row['completed_at'] as string | null) ?? null,
  }
}

export async function markChecklistItemComplete(
  jobId: string,
  checklistItemId: string,
  profileId: string,
  completed: boolean,
): Promise<JobChecklistItem> {
  const patch = completed
    ? { completed: true, completed_by: profileId, completed_at: new Date().toISOString() }
    : { completed: false, completed_by: null, completed_at: null }

  // Try to update existing row
  const { data: updated } = await supabase
    .from('job_checklist_items')
    .update(patch)
    .eq('job_id', jobId)
    .eq('checklist_item_id', checklistItemId)
    .select()
    .single()

  if (updated) return toJobChecklistItem(updated as Record<string, unknown>)

  // Row missing (e.g. cascade-deleted after checklist edit) — insert it now
  const { data: inserted, error } = await supabase
    .from('job_checklist_items')
    .insert({ job_id: jobId, checklist_item_id: checklistItemId, ...patch })
    .select()
    .single()

  if (error || !inserted) throw new Error(error?.message ?? 'Failed to update checklist item')
  return toJobChecklistItem(inserted as Record<string, unknown>)
}

export async function insertJobPhoto(
  jobId: string,
  checklistItemId: string,
  profileId: string,
  storagePath: string,
): Promise<JobPhoto> {
  const { data, error } = await supabase
    .from('job_photos')
    .insert({
      job_id: jobId,
      checklist_item_id: checklistItemId,
      profile_id: profileId,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to insert photo')
  const row = data as Record<string, unknown>
  return {
    id: row['id'] as string,
    jobId: row['job_id'] as string,
    checklistItemId: row['checklist_item_id'] as string,
    profileId: row['profile_id'] as string,
    storagePath: row['storage_path'] as string,
    createdAt: row['created_at'] as string,
  }
}

export interface ChecklistCompletionStatus {
  totalItems: number
  completedItems: number
  missingPhotos: string[] // labels of requires_photo items with no photo
}

export async function getChecklistCompletionStatus(
  jobId: string,
): Promise<ChecklistCompletionStatus> {
  const { data: items, error } = await supabase
    .from('job_checklist_items')
    .select('id, checklist_item_id, completed, checklist_items(label, requires_photo)')
    .eq('job_id', jobId)

  if (error || !items) throw new Error('Failed to fetch checklist items')

  const { data: photos } = await supabase
    .from('job_photos')
    .select('checklist_item_id')
    .eq('job_id', jobId)

  const photoedItemIds = new Set(
    (photos ?? []).map((p) => (p as Record<string, unknown>)['checklist_item_id'] as string),
  )

  const missingPhotos: string[] = []
  let completedItems = 0

  for (const item of items as Record<string, unknown>[]) {
    if (item['completed']) completedItems++
    const ci = item['checklist_items'] as Record<string, unknown>
    if (ci['requires_photo'] && !photoedItemIds.has(item['checklist_item_id'] as string)) {
      missingPhotos.push(ci['label'] as string)
    }
  }

  return { totalItems: items.length, completedItems, missingPhotos }
}
