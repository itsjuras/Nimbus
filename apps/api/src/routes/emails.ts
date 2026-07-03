import { Router } from 'express'
import { GenerateEmailDraftSchema, SendEmailSchema, ReplyEmailSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { generateDraft, sendEmail } from '../services/emailService.js'
import { getInbox, getInboxThread, replyToThread } from '../services/gmailService.js'

export const emailsRouter = Router()

emailsRouter.use(requireAuth)
emailsRouter.use(requireRole('owner', 'manager'))

// GET /api/v1/emails/inbox — recent Gmail threads with client matching
emailsRouter.get('/inbox', async (req, res, next) => {
  try {
    res.json(await getInbox(req.user.companyId))
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/emails/threads/:id — full thread
emailsRouter.get('/threads/:id', async (req, res, next) => {
  try {
    res.json(await getInboxThread(req.user.companyId, String(req.params['id'])))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/emails/reply — reply within a Gmail thread
emailsRouter.post('/reply', validate(ReplyEmailSchema), async (req, res, next) => {
  try {
    await replyToThread(req.user.companyId, req.body)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

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
