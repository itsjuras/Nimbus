import {
  getChecklistByClientId,
  upsertChecklist,
  replaceChecklistItems,
  type ChecklistWithItems,
} from '../db/queries/checklists.js'
import { getClientById } from '../db/queries/clients.js'
import { AppError } from '../middleware/errorHandler.js'
import type { ReplaceChecklistRequest } from '@nimbus/shared'

export async function getChecklist(
  clientId: string,
  companyId: string,
): Promise<ChecklistWithItems | null> {
  const client = await getClientById(clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)
  return getChecklistByClientId(clientId, companyId)
}

export async function replaceChecklist(
  clientId: string,
  companyId: string,
  input: ReplaceChecklistRequest,
): Promise<ChecklistWithItems> {
  const client = await getClientById(clientId, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)

  const checklist = await upsertChecklist(clientId, companyId, input.name)
  const items = await replaceChecklistItems(checklist.id, input.items)
  return { checklist, items }
}
