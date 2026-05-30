import {
  getWageEntriesByCompany,
  createWageEntryRecord,
  deleteWageEntryRecord,
} from '../db/queries/wages.js'
import { AppError } from '../middleware/errorHandler.js'
import type { WageEntry, LogWageRequest } from '@nimbus/shared'

export async function listWageEntries(companyId: string): Promise<WageEntry[]> {
  return getWageEntriesByCompany(companyId)
}

export async function logWage(companyId: string, input: LogWageRequest): Promise<WageEntry> {
  return createWageEntryRecord({
    companyId,
    profileId: input.profileId,
    payType: input.payType,
    rateCents: input.rateCents,
    totalCents: input.totalCents,
    periodDate: input.periodDate,
    ...(input.hours !== undefined && { hours: input.hours }),
    ...(input.jobId && { jobId: input.jobId }),
    ...(input.notes && { notes: input.notes }),
  })
}

export async function removeWageEntry(id: string, companyId: string): Promise<void> {
  // Re-fetch to verify ownership before deleting
  const entries = await getWageEntriesByCompany(companyId)
  const entry = entries.find((e) => e.id === id)
  if (!entry) throw new AppError('WAGE_ENTRY_NOT_FOUND', 'No wage entry found with that ID', 404)
  await deleteWageEntryRecord(id, companyId)
}
