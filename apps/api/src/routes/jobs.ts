import { Router, type Router as ExpressRouter } from 'express'
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
    const job = await completeJob(
      String(req.params['id']),
      req.user.companyId,
      req.user.id,
    )
    res.json(job)
  } catch (err) {
    next(err)
  }
})
