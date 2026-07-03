import { Router, type Router as ExpressRouter } from 'express'
import { SaveCompanyBankSchema, VerifyCompanyBankSchema, SaveCrewBankSchema, RunPayrollSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import {
  getConnectStatus,
  startConnectOnboarding,
  saveCompanyBank,
  verifyCompanyBank,
  saveCrewBank,
  previewPayroll,
  runPayroll,
  listPayrollRuns,
} from '../services/payrollService.js'
import { supabase } from '../db/supabase.js'

async function getUserEmail(userId: string): Promise<string | undefined> {
  const { data } = await supabase.auth.admin.getUserById(userId)
  return data.user?.email
}

export const payrollRouter: ExpressRouter = Router()

payrollRouter.use(requireAuth)

// GET /api/v1/payroll/connect/status
payrollRouter.get('/connect/status', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    res.json(await getConnectStatus(req.user.companyId))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/payroll/connect/onboard — returns Stripe-hosted onboarding URL
payrollRouter.post('/connect/onboard', requireRole('owner'), async (req, res, next) => {
  try {
    const email = await getUserEmail(req.user.id)
    res.json(await startConnectOnboarding(req.user.companyId, email))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/payroll/company-bank — save funding bank; starts microdeposit verification
payrollRouter.post(
  '/company-bank',
  requireRole('owner'),
  validate(SaveCompanyBankSchema),
  async (req, res, next) => {
    try {
      const email = await getUserEmail(req.user.id)
      res.json(
        await saveCompanyBank(
          req.user.companyId,
          req.body,
          email,
          req.ip ?? '0.0.0.0',
          req.headers['user-agent'] ?? 'unknown',
        ),
      )
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/payroll/company-bank/verify — confirm the two microdeposit amounts
payrollRouter.post(
  '/company-bank/verify',
  requireRole('owner'),
  validate(VerifyCompanyBankSchema),
  async (req, res, next) => {
    try {
      res.json(await verifyCompanyBank(req.user.companyId, req.body))
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/payroll/crew/:id/bank — crew payout bank (self, or owner/manager)
payrollRouter.post('/crew/:id/bank', validate(SaveCrewBankSchema), async (req, res, next) => {
  try {
    const profileId = String(req.params['id'])
    const isSelf = profileId === req.user.id
    const isAdmin = req.user.role === 'owner' || req.user.role === 'manager'
    if (!isSelf && !isAdmin) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
      return
    }
    res.json(await saveCrewBank(profileId, req.user.companyId, req.body, req.ip ?? '0.0.0.0'))
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/payroll/preview?from=YYYY-MM-DD&to=YYYY-MM-DD
payrollRouter.get('/preview', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const parsed = RunPayrollSchema.safeParse({
      from: String(req.query['from'] ?? ''),
      to: String(req.query['to'] ?? ''),
    })
    if (!parsed.success) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'from and to must be YYYY-MM-DD' } })
      return
    }
    res.json(await previewPayroll(req.user.companyId, parsed.data.from, parsed.data.to))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/payroll/run — debit company bank and pay crew
payrollRouter.post('/run', requireRole('owner'), validate(RunPayrollSchema), async (req, res, next) => {
  try {
    const run = await runPayroll(req.user.companyId, req.user.id, req.body)
    res.status(201).json(run)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/payroll/runs — history (also syncs pending runs with Stripe)
payrollRouter.get('/runs', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    res.json(await listPayrollRuns(req.user.companyId))
  } catch (err) {
    next(err)
  }
})
