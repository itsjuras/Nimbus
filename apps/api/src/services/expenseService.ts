import {
  getExpensesByCompany,
  getExpenseById,
  createExpenseRecord,
  updateExpenseStatus,
  deleteExpenseRecord,
} from '../db/queries/expenses.js'
import { AppError } from '../middleware/errorHandler.js'
import type { Expense, CreateExpenseRequest, UpdateExpenseStatusRequest } from '@nimbus/shared'

export async function listExpenses(companyId: string): Promise<Expense[]> {
  return getExpensesByCompany(companyId)
}

export async function createExpense(
  companyId: string,
  submittedBy: string,
  input: CreateExpenseRequest,
): Promise<Expense> {
  return createExpenseRecord({
    companyId,
    submittedBy,
    amountCents: input.amountCents,
    description: input.description,
    category: input.category ?? 'supplies',
    ...(input.jobId && { jobId: input.jobId }),
    ...(input.receiptStoragePath && { receiptStoragePath: input.receiptStoragePath }),
  })
}

export async function reviewExpense(
  id: string,
  companyId: string,
  reviewedBy: string,
  input: UpdateExpenseStatusRequest,
): Promise<Expense> {
  const expense = await getExpenseById(id, companyId)
  if (!expense) throw new AppError('EXPENSE_NOT_FOUND', 'No expense found with that ID', 404)
  if (expense.status !== 'pending') {
    throw new AppError('EXPENSE_ALREADY_REVIEWED', 'Expense has already been reviewed', 400)
  }
  const updated = await updateExpenseStatus(id, companyId, input.status, reviewedBy)
  if (!updated) throw new AppError('EXPENSE_NOT_FOUND', 'No expense found with that ID', 404)
  return updated
}

export async function removeExpense(id: string, companyId: string): Promise<void> {
  const expense = await getExpenseById(id, companyId)
  if (!expense) throw new AppError('EXPENSE_NOT_FOUND', 'No expense found with that ID', 404)
  await deleteExpenseRecord(id, companyId)
}
