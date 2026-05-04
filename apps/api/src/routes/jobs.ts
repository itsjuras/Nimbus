import { Router, type Router as ExpressRouter } from 'express'
import { CreateJobSchema, UpdateJobSchema, JobFiltersSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  startJob,
} from '../services/jobService.js'

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

// POST /api/v1/jobs/:id/start — crew action
jobsRouter.post('/:id/start', async (req, res, next) => {
  try {
    const job = await startJob(String(req.params['id']), req.user.companyId)
    res.json(job)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/jobs/:id/complete — implemented fully in step 6
jobsRouter.post('/:id/complete', async (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Coming in step 6' } })
})
