import { Router } from 'express'
import { CreateExpenseSchema, UpdateExpenseStatusSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { listExpenses, createExpense, reviewExpense, removeExpense } from '../services/expenseService.js'

export const expensesRouter = Router()

expensesRouter.use(requireAuth)

// GET /api/v1/expenses
expensesRouter.get('/', async (req, res, next) => {
  try {
    const expenses = await listExpenses(req.user.companyId)
    res.json(expenses)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/expenses
expensesRouter.post('/', validate(CreateExpenseSchema), async (req, res, next) => {
  try {
    const expense = await createExpense(req.user.companyId, req.user.id, req.body)
    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/expenses/:id/status
expensesRouter.patch(
  '/:id/status',
  requireRole('owner', 'manager'),
  validate(UpdateExpenseStatusSchema),
  async (req, res, next) => {
    try {
      const expense = await reviewExpense(
        String(req.params['id']),
        req.user.companyId,
        req.user.id,
        req.body,
      )
      res.json(expense)
    } catch (err) {
      next(err)
    }
  },
)

// DELETE /api/v1/expenses/:id
expensesRouter.delete('/:id', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await removeExpense(String(req.params['id']), req.user.companyId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
