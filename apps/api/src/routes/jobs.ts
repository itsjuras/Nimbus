import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { CreateJobSchema, UpdateJobSchema, JobFiltersSchema, MarkItemCompleteSchema, RegisterPhotoSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  startJob,
  missJob,
  reseedJobChecklist,
} from '../services/jobService.js'
import {
  markItemComplete,
  registerPhoto,
  completeJob,
} from '../services/jobCompletionService.js'
import { getWageEntriesByJob, createWageEntryRecord } from '../db/queries/wages.js'
import { getJobDetail } from '../db/queries/jobs.js'
import { AppError } from '../middleware/errorHandler.js'

const LogHoursSchema = z.object({
  profileId: z.string().uuid(),
  hours: z.number().positive(),
})

export const jobsRouter: ExpressRouter = Router()

jobsRouter.use(requireAuth)

// GET /api/v1/jobs
jobsRouter.get('/', async (req, res, next) => {
  try {
    const filters = JobFiltersSchema.parse({
      status: req.query['status'],
      from: req.query['from'],
      to: req.query['to'],
    })
    const jobs = await listJobs(req.user.companyId, filters)
    res.json(jobs)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs
jobsRouter.post(
  '/',
  requireRole('owner', 'manager'),
  validate(CreateJobSchema),
  async (req, res, next) => {
    try {
      const job = await createJob(req.user.companyId, req.body)
      res.status(201).json(job)
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/v1/jobs/:id
jobsRouter.get('/:id', async (req, res, next) => {
  try {
    const job = await getJob(String(req.params['id']), req.user.companyId)
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/jobs/:id
jobsRouter.patch(
  '/:id',
  requireRole('owner', 'manager'),
  validate(UpdateJobSchema),
  async (req, res, next) => {
    try {
      const job = await updateJob(String(req.params['id']), req.user.companyId, req.body)
      res.json(job)
    } catch (err) {
      next(err)
    }
  },
)

// DELETE /api/v1/jobs/:id
jobsRouter.delete('/:id', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await deleteJob(String(req.params['id']), req.user.companyId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs/:id/start
jobsRouter.post('/:id/start', async (req, res, next) => {
  try {
    const job = await startJob(String(req.params['id']), req.user.companyId)
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs/:id/reseed-checklist
jobsRouter.post('/:id/reseed-checklist', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const job = await reseedJobChecklist(String(req.params['id']), req.user.companyId)
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs/:id/miss
jobsRouter.post('/:id/miss', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const job = await missJob(String(req.params['id']), req.user.companyId)
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/jobs/:id/checklist-items
jobsRouter.patch(
  '/:id/checklist-items',
  validate(MarkItemCompleteSchema),
  async (req, res, next) => {
    try {
      const item = await markItemComplete(
        String(req.params['id']),
        req.user.companyId,
        req.user.id,
        req.body.checklistItemId,
        req.body.completed,
      )
      res.json(item)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/jobs/:id/photos
jobsRouter.post(
  '/:id/photos',
  validate(RegisterPhotoSchema),
  async (req, res, next) => {
    try {
      const photo = await registerPhoto(
        String(req.params['id']),
        req.user.companyId,
        req.user.id,
        req.body.checklistItemId,
        req.body.storagePath,
      )
      res.status(201).json(photo)
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/jobs/:id/complete
jobsRouter.post('/:id/complete', async (req, res, next) => {
  try {
    // Owners/managers can complete instantly from any active status;
    // crew must follow start → checklist → complete
    const force = req.user.role === 'owner' || req.user.role === 'manager'
    const job = await completeJob(
      String(req.params['id']),
      req.user.companyId,
      req.user.id,
      { force },
    )
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/jobs/:id/wages
jobsRouter.get('/:id/wages', async (req, res, next) => {
  try {
    const wages = await getWageEntriesByJob(String(req.params['id']), req.user.companyId)
    res.json(wages)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs/:id/wages  — log hours for an hourly crew member
jobsRouter.post(
  '/:id/wages',
  requireRole('owner', 'manager'),
  validate(LogHoursSchema),
  async (req, res, next) => {
    try {
      const jobId = String(req.params['id'])
      const { profileId, hours } = req.body as { profileId: string; hours: number }

      const detail = await getJobDetail(jobId, req.user.companyId)
      if (!detail) throw new AppError('JOB_NOT_FOUND', 'No job found with that ID', 404)

      const member = detail.crew.find((m) => m.id === profileId)
      if (!member) throw new AppError('CREW_NOT_FOUND', 'Crew member not assigned to this job', 404)
      if (member.payType !== 'hourly') {
        throw new AppError('WRONG_PAY_TYPE', 'Crew member is not on hourly pay', 400)
      }
      if (!member.payRateCents || member.payRateCents <= 0) {
        throw new AppError('NO_PAY_RATE', 'No hourly rate set for this crew member', 400)
      }

      const totalCents = Math.round(hours * member.payRateCents)
      const periodDate = detail.scheduledAt.split('T')[0]!

      const entry = await createWageEntryRecord({
        companyId: req.user.companyId,
        profileId,
        payType: 'hourly',
        hours,
        rateCents: member.payRateCents,
        totalCents,
        periodDate,
        jobId,
      })

      res.status(201).json(entry)
    } catch (err) {
      next(err)
    }
  },
)
