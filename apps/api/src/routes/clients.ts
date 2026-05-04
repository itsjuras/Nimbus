import { Router, type Router as ExpressRouter } from 'express'
import { CreateClientSchema, UpdateClientSchema } from '@nimbus/shared'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../services/clientService.js'

export const clientsRouter: ExpressRouter = Router()

clientsRouter.use(requireAuth)

// GET /api/v1/clients
clientsRouter.get('/', async (req, res, next) => {
  try {
    const clients = await listClients(req.user.companyId)
    res.json(clients)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/clients
clientsRouter.post(
  '/',
  requireRole('owner', 'manager'),
  validate(CreateClientSchema),
  async (req, res, next) => {
    try {
      const client = await createClient(req.user.companyId, req.body)
      res.status(201).json(client)
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/v1/clients/:id
clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await getClient(String(req.params['id']), req.user.companyId)
    res.json(client)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/clients/:id
clientsRouter.patch(
  '/:id',
  requireRole('owner', 'manager'),
  validate(UpdateClientSchema),
  async (req, res, next) => {
    try {
      const client = await updateClient(String(req.params['id']), req.user.companyId, req.body)
      res.json(client)
    } catch (err) {
      next(err)
    }
  },
)

// DELETE /api/v1/clients/:id
clientsRouter.delete('/:id', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await deleteClient(String(req.params['id']), req.user.companyId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
