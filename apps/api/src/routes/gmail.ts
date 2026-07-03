import { Router, type Router as ExpressRouter } from 'express'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { FRONTEND_URL } from '../lib/googleAuth.js'
import {
  getGmailStatus,
  buildConnectUrl,
  handleOAuthCallback,
  disconnectGmail,
} from '../services/gmailService.js'

export const gmailRouter: ExpressRouter = Router()

// GET /api/v1/company/gmail/callback — browser redirect from Google, no auth header
gmailRouter.get('/callback', async (req, res) => {
  const code = String(req.query['code'] ?? '')
  const state = String(req.query['state'] ?? '')

  if (!code || !state) {
    res.redirect(`${FRONTEND_URL}/owner/emails?gmail=error`)
    return
  }

  try {
    await handleOAuthCallback(code, state)
    res.redirect(`${FRONTEND_URL}/owner/emails?gmail=connected`)
  } catch (err) {
    console.error('Gmail OAuth callback failed:', err)
    res.redirect(`${FRONTEND_URL}/owner/emails?gmail=error`)
  }
})

gmailRouter.use(requireAuth)
gmailRouter.use(requireRole('owner', 'manager'))

// GET /api/v1/company/gmail/status
gmailRouter.get('/status', async (req, res, next) => {
  try {
    res.json(await getGmailStatus(req.user.companyId))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/company/gmail/connect — returns Google consent URL
gmailRouter.post('/connect', requireRole('owner'), (req, res) => {
  res.json(buildConnectUrl(req.user.companyId))
})

// DELETE /api/v1/company/gmail — disconnect
gmailRouter.delete('/', requireRole('owner'), async (req, res, next) => {
  try {
    await disconnectGmail(req.user.companyId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
