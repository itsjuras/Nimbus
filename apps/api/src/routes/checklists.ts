import { Router, type Router as ExpressRouter } from 'express'
import { ReplaceChecklistSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { getChecklist, replaceChecklist } from '../services/checklistService.js'

export const checklistsRouter: ExpressRouter = Router()

checklistsRouter.use(requireAuth)

// GET /api/v1/checklists/:clientId
checklistsRouter.get('/:clientId', async (req, res, next) => {
  try {
    const result = await getChecklist(String(req.params['clientId']), req.user.companyId)
    res.json(result ?? null)
  } catch (err) {
    next(err)
  }
})

// PUT /api/v1/checklists/:clientId
checklistsRouter.put(
  '/:clientId',
  requireRole('owner', 'manager'),
  validate(ReplaceChecklistSchema),
  async (req, res, next) => {
    try {
      const result = await replaceChecklist(String(req.params['clientId']), req.user.companyId, req.body)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)
