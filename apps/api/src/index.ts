import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { clientsRouter } from './routes/clients.js'
import { checklistsRouter } from './routes/checklists.js'
import { jobsRouter } from './routes/jobs.js'
import { invoicesRouter } from './routes/invoices.js'
import { expensesRouter } from './routes/expenses.js'
import { wagesRouter } from './routes/wages.js'
import { financeRouter } from './routes/finance.js'
import { mobileRouter } from './routes/mobile.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = process.env['PORT'] ?? 3000

const allowedOrigin = process.env['CORS_ORIGIN']
app.use(cors({
  origin: allowedOrigin ?? ((origin, cb) => cb(null, true)),
  credentials: true,
}))

// Stripe webhook must receive the raw body for signature verification
app.use(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1', authRouter)
app.use('/api/v1/clients', clientsRouter)
app.use('/api/v1/checklists', checklistsRouter)
app.use('/api/v1/jobs', jobsRouter)
app.use('/api/v1', invoicesRouter)
app.use('/api/v1/expenses', expensesRouter)
app.use('/api/v1/wages', wagesRouter)
app.use('/api/v1/finance', financeRouter)
app.use('/api/v1', mobileRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
