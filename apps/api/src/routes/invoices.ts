import { Router, type Router as ExpressRouter } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { CreateInvoiceSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import {
  listInvoices,
  getInvoice,
  createInvoice,
  sendInvoice,
  handleStripeWebhook,
} from '../services/invoiceService.js'
import { webhookSecret } from '../lib/stripe.js'

// Webhook lives on its own router: it's mounted at /api/v1 (raw body, no auth),
// while invoicesRouter is mounted at /api/v1/invoices
export const stripeWebhookRouter: ExpressRouter = Router()

export const invoicesRouter: ExpressRouter = Router()

// POST /api/v1/webhooks/stripe — raw body, no auth middleware
stripeWebhookRouter.post(
  '/webhooks/stripe',
  async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' } })
      return
    }

    try {
      await handleStripeWebhook(req.body as Buffer, signature, webhookSecret)
      res.json({ received: true })
    } catch (err) {
      next(err)
    }
  },
)

invoicesRouter.use(requireAuth)

// GET /api/v1/invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const invoices = await listInvoices(req.user.companyId)
    res.json(invoices)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/invoices
invoicesRouter.post(
  '/',
  requireRole('owner', 'manager'),
  validate(CreateInvoiceSchema),
  async (req, res, next) => {
    try {
      const invoice = await createInvoice(req.user.companyId, req.body)
      res.status(201).json(invoice)
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/v1/invoices/:id
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const invoice = await getInvoice(String(req.params['id']), req.user.companyId)
    res.json(invoice)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/invoices/:id/send
invoicesRouter.post(
  '/:id/send',
  requireRole('owner', 'manager'),
  async (req, res, next) => {
    try {
      const invoice = await sendInvoice(String(req.params['id']), req.user.companyId)
      res.json(invoice)
    } catch (err) {
      next(err)
    }
  },
)
