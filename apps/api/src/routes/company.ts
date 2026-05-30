import { Router } from 'express'
import { UpdateCompanySettingsSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { getCompanySettings, updateCompanySettings } from '../db/queries/company.js'
import { AppError } from '../middleware/errorHandler.js'

export const companyRouter = Router()

companyRouter.use(requireAuth)

// GET /api/v1/company/settings
companyRouter.get('/settings', async (req, res, next) => {
  try {
    const settings = await getCompanySettings(req.user.companyId)
    if (!settings) throw new AppError('NOT_FOUND', 'Company not found', 404)
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/company/settings — owner only
companyRouter.patch('/settings', requireRole('owner'), validate(UpdateCompanySettingsSchema), async (req, res, next) => {
  try {
    const updated = await updateCompanySettings(req.user.companyId, req.body)
    if (!updated) throw new AppError('NOT_FOUND', 'Company not found', 404)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})
