import { Router } from 'express'
import { GenerateEmailDraftSchema, SendEmailSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { generateDraft, sendEmail } from '../services/emailService.js'

export const emailsRouter = Router()

emailsRouter.use(requireAuth)
emailsRouter.use(requireRole('owner', 'manager'))

// POST /api/v1/emails/draft
emailsRouter.post('/draft', validate(GenerateEmailDraftSchema), async (req, res, next) => {
  try {
    const draft = await generateDraft(req.user.companyId, req.body)
    res.json(draft)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/emails/send
emailsRouter.post('/send', validate(SendEmailSchema), async (req, res, next) => {
  try {
    await sendEmail(req.user.companyId, req.body)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
