import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { clientsRouter } from './routes/clients.js'
import { checklistsRouter } from './routes/checklists.js'
import { jobsRouter } from './routes/jobs.js'
import { invoicesRouter, stripeWebhookRouter } from './routes/invoices.js'
import { expensesRouter } from './routes/expenses.js'
import { wagesRouter } from './routes/wages.js'
import { financeRouter } from './routes/finance.js'
import { payrollRouter } from './routes/payroll.js'
import { emailsRouter } from './routes/emails.js'
import { companyRouter } from './routes/company.js'
import { gmailRouter } from './routes/gmail.js'
import { mobileRouter } from './routes/mobile.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = process.env['PORT'] ?? 3000

// Comma-separated list, e.g. "https://nimbuscleaning.net,https://www.nimbuscleaning.net"
const allowedOrigins = process.env['CORS_ORIGIN']?.split(',').map((o) => o.trim())
app.use(cors({
  origin: allowedOrigins ?? ((origin, cb) => cb(null, true)),
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
app.use('/api/v1/emails', emailsRouter)
app.use('/api/v1/company/gmail', gmailRouter)
app.use('/api/v1/company', companyRouter)
app.use('/api/v1/expenses', expensesRouter)
app.use('/api/v1/wages', wagesRouter)
app.use('/api/v1/finance', financeRouter)
app.use('/api/v1/payroll', payrollRouter)
app.use('/api/v1', stripeWebhookRouter)
app.use('/api/v1/invoices', invoicesRouter)
app.use('/api/v1', mobileRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
