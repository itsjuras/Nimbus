import { Router, type Router as ExpressRouter } from 'express'
import { SignUpSchema, InviteCrewSchema, UpdatePayRateSchema } from '@nimbus/shared'
import { validate } from '../middleware/validate.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { signUpOwner, inviteCrew } from '../services/authService.js'
import { getProfileById, getProfilesByCompany, updateProfile } from '../db/queries/profiles.js'
import { getJobsByProfile } from '../db/queries/jobs.js'

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

// GET /api/v1/crew
// Lists all profiles in the company
authRouter.get('/crew', requireAuth, async (req, res, next) => {
  try {
    const profiles = await getProfilesByCompany(req.user.companyId)
    res.json(profiles)
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

// GET /api/v1/crew/:id/jobs
// Returns all jobs assigned to a specific crew member
authRouter.get('/crew/:id/jobs', requireAuth, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const jobs = await getJobsByProfile(String(req.params['id']), req.user.companyId)
    res.json(jobs)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/crew/:id
// Owner/manager only — updates a crew member's pay rate and phone
authRouter.patch(
  '/crew/:id',
  requireAuth,
  requireRole('owner', 'manager'),
  validate(UpdatePayRateSchema),
  async (req, res, next) => {
    try {
      const profile = await updateProfile(String(req.params['id']), req.user.companyId, req.body)
      if (!profile) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Crew member not found' } })
        return
      }
      res.json(profile)
    } catch (err) {
      next(err)
    }
  },
)
