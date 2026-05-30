import { Router } from 'express'
import { LogWageSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { listWageEntries, logWage, removeWageEntry } from '../services/wageService.js'

export const wagesRouter = Router()

wagesRouter.use(requireAuth)
wagesRouter.use(requireRole('owner', 'manager'))

// GET /api/v1/wages
wagesRouter.get('/', async (req, res, next) => {
  try {
    const entries = await listWageEntries(req.user.companyId)
    res.json(entries)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/wages
wagesRouter.post('/', validate(LogWageSchema), async (req, res, next) => {
  try {
    const entry = await logWage(req.user.companyId, req.body)
    res.status(201).json(entry)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/wages/:id
wagesRouter.delete('/:id', async (req, res, next) => {
  try {
    await removeWageEntry(String(req.params['id']), req.user.companyId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
