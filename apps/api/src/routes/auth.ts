import { Router, type Router as ExpressRouter } from 'express'
import { SignUpSchema, InviteCrewSchema } from '@nimbus/shared'
import { validate } from '../middleware/validate.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { signUpOwner, inviteCrew } from '../services/authService.js'
import { getProfileById } from '../db/queries/profiles.js'

export const authRouter: ExpressRouter = Router()

// GET /api/v1/auth/me
// Returns the authenticated user's profile
authRouter.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getProfileById(req.user.id)
    if (!profile) {
      res.status(404).json({ error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } })
      return
    }
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/signup
// Public — creates a new company and owner account
authRouter.post('/auth/signup', validate(SignUpSchema), async (req, res, next) => {
  try {
    const result = await signUpOwner(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/crew/invite
// Owner/manager only — invites a crew member via email
authRouter.post(
  '/crew/invite',
  requireAuth,
  requireRole('owner', 'manager'),
  validate(InviteCrewSchema),
  async (req, res, next) => {
    try {
      const result = await inviteCrew(req.user.companyId, req.body)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },
)
