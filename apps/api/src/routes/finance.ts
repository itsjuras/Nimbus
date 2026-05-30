import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { getSummary } from '../services/financeService.js'

export const financeRouter = Router()

financeRouter.use(requireAuth)
financeRouter.use(requireRole('owner', 'manager'))

// GET /api/v1/finance/summary?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z
financeRouter.get('/summary', async (req, res, next) => {
  try {
    const from = String(req.query['from'] ?? '')
    const to = String(req.query['to'] ?? '')
    if (!from || !to) {
      res.status(400).json({ error: { code: 'MISSING_PARAMS', message: 'from and to are required' } })
      return
    }
    const summary = await getSummary(req.user.companyId, from, to)
    res.json(summary)
  } catch (err) {
    next(err)
  }
})
