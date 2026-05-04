import { supabase } from '../supabase.js'
import type { Checklist, ChecklistItem } from '@nimbus/shared'
import type { ChecklistItemInput } from '@nimbus/shared'

function toChecklist(row: Record<string, unknown>): Checklist {
  return {
    id: row['id'] as string,
    clientId: row['client_id'] as string,
    companyId: row['company_id'] as string,
    name: row['name'] as string,
    createdAt: row['created_at'] as string,
  }
}

function toChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row['id'] as string,
    checklistId: row['checklist_id'] as string,
    label: row['label'] as string,
    requiresPhoto: row['requires_photo'] as boolean,
    position: row['position'] as number,
    createdAt: row['created_at'] as string,
  }
}

export interface ChecklistWithItems {
  checklist: Checklist
  items: ChecklistItem[]
}

export async function getChecklistByClientId(
  clientId: string,
  companyId: string,
): Promise<ChecklistWithItems | null> {
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('client_id', clientId)
    .eq('company_id', companyId)
    .single()

  if (error || !checklist) return null

  const { data: items, error: itemsError } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('checklist_id', (checklist as Record<string, unknown>)['id'])
    .order('position')

  if (itemsError) throw itemsError

  return {
    checklist: toChecklist(checklist as Record<string, unknown>),
    items: (items as Record<string, unknown>[]).map(toChecklistItem),
  }
}

export async function upsertChecklist(
  clientId: string,
  companyId: string,
  name: string,
): Promise<Checklist> {
  // Use upsert on client_id uniqueness — one checklist per client
  const { data: existing } = await supabase
    .from('checklists')
    .select('id')
    .eq('client_id', clientId)
    .eq('company_id', companyId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('checklists')
      .update({ name })
      .eq('id', (existing as Record<string, unknown>)['id'])
      .select()
      .single()

    if (error) throw error
    return toChecklist(data as Record<string, unknown>)
  }

  const { data, error } = await supabase
    .from('checklists')
    .insert({ client_id: clientId, company_id: companyId, name })
    .select()
    .single()

  if (error) throw error
  return toChecklist(data as Record<string, unknown>)
}

export async function replaceChecklistItems(
  checklistId: string,
  items: ChecklistItemInput[],
): Promise<ChecklistItem[]> {
  // Delete all existing items then insert the new set
  const { error: deleteError } = await supabase
    .from('checklist_items')
    .delete()
    .eq('checklist_id', checklistId)

  if (deleteError) throw deleteError

  if (items.length === 0) return []

  const { data, error } = await supabase
    .from('checklist_items')
    .insert(
      items.map((item) => ({
        checklist_id: checklistId,
        label: item.label,
        requires_photo: item.requiresPhoto,
        position: item.position,
      })),
    )
    .select()
    .order('position')

  if (error) throw error
  return (data as Record<string, unknown>[]).map(toChecklistItem)
}
