import { getFinanceSummary } from '../db/queries/finance.js'
import type { FinanceSummary } from '@nimbus/shared'

export async function getSummary(
  companyId: string,
  from: string,
  to: string,
): Promise<FinanceSummary> {
  return getFinanceSummary(companyId, from, to)
}
